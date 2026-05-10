/**
 * Coder Skill Subgraph — 完全自動化（無 interrupt）
 *
 * Graph 結構：
 *   START → validate → afterValidate?
 *     ├─ blocked → END（回退 uiux_complete）
 *     ├─ no_data → END（缺少 BDD/UIUX）
 *     └─ pass → generate → test → afterTest?
 *                                   ├─ passed → END
 *                                   ├─ no_progress → END
 *                                   └─ retry（round < 3）→ test（loop）
 *
 * 每個 node 從 Redis FlowState / PostgreSQL 讀取大資料，
 * 只回傳輕量路由 metadata 到 LangGraph state。
 */
import { StateGraph, START, END } from '@langchain/langgraph'
import { TellcraftState, type TellcraftStateType } from '../state'
import { getRedis, getIo } from '../context'
import { sendMessage, saveFlowState, getFlowState, touchFlowActivity, snapshotCodeToGeneration, inferFileType } from '../../workers/orchestrator-utils'
import { executeRedPhase, formatRedPhaseReport, runRedPhaseFullValidation, runRedPhaseRoutingValidation } from '../../services/red-phase-validator'
import { runFeatureAlignmentGate } from '../../services/feature-alignment-gate'
import { executeCoderPipeline } from '../../services/coder-generation'
import { runCoderE2ETests } from '../../services/coder-e2e-test'
import { type GeneratedComponent, generateTailwindConfig } from '../../services/uiux-generation'
import { sanitizeForPreview } from '../../services/code-verify'
import type { FlowState, GeneratedCode } from '../../types/flow-state'
import * as db from '../../db/client'
import { createLogger } from '../../lib/logger'

const logger = createLogger('coder-subgraph')

// ============================================================
// Node 1: validate — Setup + RED Phase + Alignment Gate
// ============================================================

async function validateNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()
  const { projectId, conversationId, userId } = state

  // 1. 讀取 BDD 產出
  const bddSession = await db.queryOne<{
    id: string
    actions_yml_content: string | null
    schema_sql_content: string | null
    entity_mapping_content: string | null
    features_content: Array<{ actionName: string; content: string; name?: string }> | null
    open_api_spec_content: string | null
    isa_config_content: string | null
  }>(
    `SELECT id, actions_yml_content, schema_sql_content, entity_mapping_content, features_content,
            open_api_spec_content, isa_config_content
     FROM bdd_sessions
     WHERE project_id = $1 AND actions_yml_content IS NOT NULL
     ORDER BY updated_at DESC LIMIT 1`,
    [projectId]
  )

  if (!bddSession || !bddSession.actions_yml_content || !bddSession.schema_sql_content) {
    const flowState = await getFlowState(redis, conversationId)
    if (flowState && flowState.phase === 'coder_generating') {
      flowState.phase = 'uiux_complete'
      flowState.coderGenerationStartedAt = undefined
      flowState.waitingForReply = false
      await saveFlowState(redis, conversationId, flowState)
    }
    await sendMessage(conversationId, io, {
      content: '此專案缺少 BDD 規格（actionsYml 或 schemaSql），無法生成後端代碼。請先完成 BDD 需求釐清。',
      stage: 'coder_error',
      quickReplies: [{ label: '部署現有前端', value: '部署', style: 'secondary' as const }],
    })
    return { coderStage: 'no_data', phase: 'uiux_complete' }
  }

  // 2. 讀取 UIUX 代碼
  const uiuxFiles = await db.getProjectFiles(projectId, 'uiux')
  if (uiuxFiles.length === 0) {
    const flowState = await getFlowState(redis, conversationId)
    if (flowState && flowState.phase === 'coder_generating') {
      flowState.phase = 'uiux_complete'
      flowState.coderGenerationStartedAt = undefined
      flowState.waitingForReply = false
      await saveFlowState(redis, conversationId, flowState)
    }
    await sendMessage(conversationId, io, {
      content: '此專案沒有 UIUX 代碼，無法進行前端改寫。請先完成 UIUX 設計。',
      stage: 'coder_error',
    })
    return { coderStage: 'no_data', phase: 'uiux_complete' }
  }

  // 3. 設定 FlowState
  let flowState = await getFlowState(redis, conversationId)
  if (!flowState) {
    flowState = {
      phase: 'coder_generating', projectId, currentRound: 0,
      questionIndex: 0, batchCount: 0, waitingForReply: false,
      totalQuestionsAsked: 0, userId,
    } as FlowState
  }

  // 重建 GeneratedCode
  const pages: GeneratedComponent[] = []
  const components: GeneratedComponent[] = []
  let styles = ''
  for (const f of uiuxFiles) {
    if (f.file_type === 'page') pages.push({ path: f.file_path, content: f.content, description: f.description || '' })
    else if (f.file_type === 'component') components.push({ path: f.file_path, content: f.content, description: f.description || '' })
    else if (f.file_type === 'style') styles = f.content
  }
  const existingUiuxCode: GeneratedCode = { pages, components, styles }

  flowState.coderPreRewriteCode = flowState.uiuxGeneratedCode || existingUiuxCode
  flowState.phase = 'coder_generating'
  flowState.waitingForReply = false
  flowState.coderGenerationStartedAt = Date.now()
  if (!flowState.userId) flowState.userId = userId
  if (!flowState.projectId) flowState.projectId = projectId
  await saveFlowState(redis, conversationId, flowState)

  const isChinese = flowState.locale !== 'en'
  await sendMessage(conversationId, io, {
    content: isChinese
      ? '正在生成後端代碼，將 mock 數據替換為真實的資料庫操作...'
      : 'Generating backend code, replacing mock data with real database operations...',
    stage: 'coder_generating',
    progress: { current: 0, total: 100, step: isChinese ? '準備中' : 'Preparing' },
  })

  // 4. RED Phase L1 — SDD 靜態規格驗證
  if (bddSession.features_content && bddSession.features_content.length > 0) {
    try {
      const redResult = await executeRedPhase({
        features: bddSession.features_content,
        actionsYml: bddSession.actions_yml_content,
        schemaSql: bddSession.schema_sql_content,
        entityMapping: bddSession.entity_mapping_content || '',
      })

      flowState = await getFlowState(redis, conversationId) || flowState
      flowState.coderRedPhasePassed = redResult.passed
      flowState.coderRedPhaseIssueCount = redResult.errors + redResult.warnings
      flowState.coderRedPhaseFixRounds = 0
      await saveFlowState(redis, conversationId, flowState)

      if (!redResult.passed) {
        logger.warn({ errors: redResult.errors, warnings: redResult.warnings }, 'RED Phase 發現規格問題')
        const report = formatRedPhaseReport(redResult)
        await sendMessage(conversationId, io, {
          content: isChinese
            ? `⚠ 規格預檢發現 ${redResult.errors} 個問題，將嘗試在代碼生成後自動修復：\n${report}`
            : `⚠ Spec pre-check found ${redResult.errors} issue(s), will attempt auto-fix after code generation:\n${report}`,
          stage: 'coder_generating',
        })
      }
    } catch (e) {
      logger.error({ error: e }, 'RED Phase 執行失敗，降級跳過')
    }
  }

  // 5. RED Phase L2 Stub + L2.5 Routing（非阻塞）
  if (bddSession.features_content?.length && bddSession.open_api_spec_content && bddSession.isa_config_content) {
    const project = await db.queryOne<{ neon_connection_string: string | null }>(
      `SELECT neon_connection_string FROM projects WHERE id = $1`, [projectId]
    )
    if (project?.neon_connection_string) {
      try {
        const stubResult = await runRedPhaseFullValidation({
          features: bddSession.features_content,
          actionsYml: bddSession.actions_yml_content,
          openApiSpec: bddSession.open_api_spec_content,
          isaConfigYml: bddSession.isa_config_content,
          schemaSql: bddSession.schema_sql_content,
          entityMapping: bddSession.entity_mapping_content || '',
          neonConnectionString: project.neon_connection_string,
        })
        if (!stubResult.passed) {
          logger.warn({ unexpectedFailures: stubResult.unexpectedFailures.length }, 'RED Phase Stub 發現非預期失敗')
        }
      } catch (e) {
        logger.error({ error: e }, 'RED Phase Stub 執行失敗，降級跳過')
      }

      try {
        const routingResult = await runRedPhaseRoutingValidation({
          features: bddSession.features_content,
          actionsYml: bddSession.actions_yml_content,
          openApiSpec: bddSession.open_api_spec_content,
          isaConfigYml: bddSession.isa_config_content,
          schemaSql: bddSession.schema_sql_content,
          entityMapping: bddSession.entity_mapping_content || '',
          neonConnectionString: project.neon_connection_string,
        })
        if (!routingResult.passed && routingResult.routingMismatches.length > 0) {
          logger.warn({ mismatches: routingResult.routingMismatches.length }, 'RED Phase Routing 發現路由不匹配')
        }
      } catch (e) {
        logger.error({ error: e }, 'RED Phase Routing 執行失敗，降級跳過')
      }
    }
  }

  // 6. Feature Alignment Gate（阻塞式）
  if (bddSession.features_content && bddSession.features_content.length > 0) {
    try {
      const gateResult = await runFeatureAlignmentGate({
        features: bddSession.features_content,
        actionsYml: bddSession.actions_yml_content,
        schemaSql: bddSession.schema_sql_content,
        entityMapping: bddSession.entity_mapping_content || '',
        trackingContext: { userId, conversationId },
      })

      // 修復後更新 DB
      if (gateResult.fixedFeatures || gateResult.fixedSchemaSql || gateResult.fixedEntityMapping) {
        const setClauses: string[] = []
        const params: unknown[] = []
        if (gateResult.fixedFeatures) {
          params.push(JSON.stringify(gateResult.fixedFeatures))
          setClauses.push(`features_content = $${params.length}`)
        }
        if (gateResult.fixedSchemaSql) {
          params.push(gateResult.fixedSchemaSql)
          setClauses.push(`schema_sql_content = $${params.length}`)
        }
        if (gateResult.fixedEntityMapping) {
          params.push(gateResult.fixedEntityMapping)
          setClauses.push(`entity_mapping_content = $${params.length}`)
        }
        if (setClauses.length > 0) {
          params.push(bddSession.id)
          await db.query(`UPDATE bdd_sessions SET ${setClauses.join(', ')} WHERE id = $${params.length}`, params)
        }
        logger.info({ fixedCount: gateResult.fixedIssueCount }, 'Alignment Gate: 已自動修復並更新 DB')
      }

      if (gateResult.blocked) {
        flowState = await getFlowState(redis, conversationId) || flowState
        flowState.phase = 'uiux_complete'
        flowState.waitingForReply = true
        await saveFlowState(redis, conversationId, flowState)
        await sendMessage(conversationId, io, {
          content: gateResult.blockMessage || 'Feature 對齊檢查失敗，請修正 BDD 規格後重試。',
          stage: 'coder_error',
          quickReplies: [{ label: isChinese ? '重試' : 'Retry', value: '__retry_coder__' }],
        })
        return { coderStage: 'blocked', phase: 'uiux_complete' }
      }

      if (gateResult.fixedIssueCount > 0) {
        await sendMessage(conversationId, io, {
          content: isChinese
            ? `✓ Feature 對齊閘門：自動修復了 ${gateResult.fixedIssueCount} 個問題（${gateResult.durationMs}ms）`
            : `✓ Feature Alignment Gate: auto-fixed ${gateResult.fixedIssueCount} issue(s) (${gateResult.durationMs}ms)`,
          stage: 'coder_generating',
        })
      }
    } catch (e) {
      logger.error({ error: e }, 'Alignment Gate 執行失敗，降級跳過')
    }
  }

  return { coderStage: 'validated', phase: 'coder_generating' }
}

// ============================================================
// Node 2: generate — executeCoderPipeline + merge + E2E
// ============================================================

async function generateNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()
  const { projectId, conversationId, userId } = state

  // 讀取 BDD 產出（validate node 已確認存在）
  const bddSession = await db.queryOne<{
    actions_yml_content: string
    schema_sql_content: string
    entity_mapping_content: string | null
    features_content: Array<{ actionName: string; content: string; name?: string }> | null
  }>(
    `SELECT actions_yml_content, schema_sql_content, entity_mapping_content, features_content
     FROM bdd_sessions WHERE project_id = $1 AND actions_yml_content IS NOT NULL
     ORDER BY updated_at DESC LIMIT 1`,
    [projectId]
  )

  if (!bddSession) return { coderStage: 'no_data', phase: 'uiux_complete' }

  // 讀取 UIUX 代碼
  const uiuxFiles = await db.getProjectFiles(projectId, 'uiux')
  const pages: GeneratedComponent[] = []
  const components: GeneratedComponent[] = []
  let styles = ''
  for (const f of uiuxFiles) {
    if (f.file_type === 'page') pages.push({ path: f.file_path, content: f.content, description: f.description || '' })
    else if (f.file_type === 'component') components.push({ path: f.file_path, content: f.content, description: f.description || '' })
    else if (f.file_type === 'style') styles = f.content
  }
  const existingUiuxCode: GeneratedCode = { pages, components, styles }

  let flowState = await getFlowState(redis, conversationId)
  if (!flowState) return { coderStage: 'no_data', phase: 'uiux_complete' }
  const isChinese = flowState.locale !== 'en'

  try {
    const result = await executeCoderPipeline(
      {
        projectId,
        actionsYml: bddSession.actions_yml_content,
        schemaSql: bddSession.schema_sql_content,
        entityMapping: bddSession.entity_mapping_content || '',
        existingUiuxCode,
        features: bddSession.features_content || undefined,
        trackingContext: { userId, conversationId },
      },
      {
        onProgress: async (step, percent) => {
          void touchFlowActivity(redis, conversationId)
          io.to(`conversation:${conversationId}`).emit('coder_progress', { step, percent })
        },
      }
    )

    // 保存代碼
    const allCoderFiles = [
      ...result.backendFiles.map(f => ({ filePath: f.path, content: f.content, description: f.description, fileType: inferFileType(f.path) })),
      ...result.rewrittenFrontend.map(f => ({ filePath: f.path, content: f.content, description: f.description, fileType: inferFileType(f.path) })),
    ]
    await db.upsertProjectFiles(projectId, 'coder', allCoderFiles)
    await snapshotCodeToGeneration(projectId, { changeSummary: 'Coder 後端生成完成', conversationId })

    // 合併代碼
    const mergedPages = mergeComponents(existingUiuxCode.pages, result.rewrittenFrontend.filter(f => pages.some(p => p.path === f.path)))
    const mergedComponents = mergeComponents(
      [...existingUiuxCode.components, ...result.backendFiles],
      result.rewrittenFrontend.filter(f => components.some(c => c.path === f.path))
    )

    flowState = await getFlowState(redis, conversationId) || flowState
    flowState.uiuxGeneratedCode = { pages: mergedPages, components: mergedComponents, styles }
    flowState.uiuxCodePhase = 'complete'
    flowState.coderCompleted = true
    flowState.coderGenerationStartedAt = undefined

    // E2E 測試
    const tailwindConfig = flowState.uiuxDesignSystem ? generateTailwindConfig(flowState.uiuxDesignSystem) : ''
    const neonRow = await db.queryOne<{ neon_connection_string: string | null }>(
      'SELECT neon_connection_string FROM projects WHERE id = $1', [projectId]
    )
    const neonConnectionString = neonRow?.neon_connection_string || undefined

    if (neonConnectionString) {
      await sendMessage(conversationId, io, {
        content: isChinese ? '執行端到端測試，確認所有頁面可用...' : 'Running E2E tests to verify all pages...',
        stage: 'coder_testing',
      })
      const e2eResult = await runCoderE2ETests({
        code: { pages: mergedPages, components: mergedComponents, styles },
        tailwindConfig,
        extraDependencies: { '@neondatabase/serverless': '^0.10.0', bcryptjs: '^3.0.3', jsonwebtoken: '^9.0.0', 'next-auth': '5.0.0-beta.30' },
        neonConnectionString,
        trackingContext: { userId, conversationId },
        onProgress: (step: string) => {
          io.to(`conversation:${conversationId}`).emit('coder_progress', { step, percent: 92 })
        },
      })
      if (e2eResult.fixedFiles.length > 0) {
        const fixedDbFiles = e2eResult.fixedFiles.map((f: { path: string; content: string }) => ({
          filePath: f.path, content: f.content, description: '', fileType: inferFileType(f.path),
        }))
        await db.upsertProjectFiles(projectId, 'coder', fixedDbFiles)
        for (const fix of e2eResult.fixedFiles) {
          const pi = mergedPages.findIndex(p => p.path === fix.path)
          if (pi >= 0) mergedPages[pi] = { ...mergedPages[pi], content: fix.content }
          const ci = mergedComponents.findIndex(c => c.path === fix.path)
          if (ci >= 0) mergedComponents[ci] = { ...mergedComponents[ci], content: fix.content }
        }
        flowState.uiuxGeneratedCode = { pages: mergedPages, components: mergedComponents, styles }
      }
    }

    // 判斷是否有 Neon DB → 進入 test 或直接完成
    flowState.phase = neonConnectionString ? 'coder_testing' : 'uiux_complete'
    flowState.waitingForReply = !neonConnectionString
    await saveFlowState(redis, conversationId, flowState)

    if (!neonConnectionString) {
      // 無 Neon DB → 直接完成
      const mockWarnings = result.mockDataWarnings || []
      const mockWarningText = mockWarnings.length > 0
        ? `\n\n⚠️ ${mockWarnings.length} 個組件仍使用假資料：${mockWarnings.map(w => `\`${w}\``).join('、')}`
        : ''
      const sanitized = sanitizeForPreview({ pages: mergedPages, components: mergedComponents, styles })
      await sendMessage(conversationId, io, {
        content: `**後端代碼生成完成！**\n\n${result.summary}${mockWarningText}\n\n- 輸入「**部署**」部署上線\n- 或描述想調整的地方`,
        stage: 'uiux_complete', layoutHint: 'split',
        richContent: {
          type: 'code_preview',
          data: { pages: sanitized.code.pages, components: sanitized.code.components, styles: sanitized.code.styles, tailwindConfig, currentPhase: 'uiux_complete' } as Record<string, unknown>,
        },
        quickReplies: [
          { label: '部署上線', value: '部署', style: 'primary' as const },
          { label: '開始新專案', value: '__new_project__', style: 'ghost' as const },
        ],
      })
      return { coderStage: 'done', phase: 'uiux_complete' }
    }

    // 有 Neon DB → 發送預覽 + 進入 test
    const serverActions = result.backendFiles.filter(f => f.path.startsWith('app/actions/'))
    const apiRoutes = result.backendFiles.filter(f => f.path.startsWith('app/api/'))
    const dbLib = result.backendFiles.filter(f => f.path.startsWith('lib/'))
    await sendMessage(conversationId, io, {
      content: isChinese
        ? `**後端代碼生成完成！**\n\n${result.summary}\n\n正在自動執行 BDD 規格驗證...`
        : `**Backend code generation complete!**\n\n${result.summary}\n\nRunning BDD spec validation automatically...`,
      stage: 'coder_testing', layoutHint: 'split',
      richContent: {
        type: 'code_preview',
        data: {
          pages: mergedPages, components: mergedComponents, styles, tailwindConfig,
          currentPhase: 'coder_testing', serverActions, apiRoutes, dbLib,
          hasServerActions: true, neonConnectionString,
        } as Record<string, unknown>,
      },
    })

    return { coderStage: 'generated', phase: 'coder_testing', testRound: 0 }
  } catch (err) {
    logger.error({ err, projectId }, 'Coder Pipeline 失敗')
    flowState = await getFlowState(redis, conversationId) || flowState
    if (flowState.coderPreRewriteCode) flowState.uiuxGeneratedCode = flowState.coderPreRewriteCode
    flowState.phase = 'uiux_complete'
    flowState.uiuxCodePhase = 'complete'
    flowState.coderGenerationStartedAt = undefined
    flowState.waitingForReply = false
    await saveFlowState(redis, conversationId, flowState)
    const errorMsg = err instanceof Error ? err.message : String(err)
    await sendMessage(conversationId, io, {
      content: `**後端代碼生成失敗**\n\n${errorMsg}\n\n您可以重試或直接部署現有的前端代碼。`,
      stage: 'uiux_complete',
      quickReplies: [
        { label: '重試', value: '__connect_database__', style: 'primary' as const },
        { label: '直接部署', value: '部署', style: 'secondary' as const },
      ],
    })
    return { coderStage: 'error', phase: 'uiux_complete' }
  }
}

// ============================================================
// Node 3: test — 單次 runRedGreenCycle（fix loop 靠 graph edge 重複）
// ============================================================

async function testNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()
  const { projectId, conversationId, userId } = state
  const round = state.testRound

  let flowState = await getFlowState(redis, conversationId)
  if (!flowState) return { coderStage: 'error', phase: 'uiux_complete' }
  const isChinese = flowState.locale !== 'en'

  // 讀取 BDD 資料
  const bddSession = await db.queryOne<{
    features_content: unknown[] | null
    actions_yml_content: string | null
    open_api_spec_content: string | null
    isa_config_content: string | null
    schema_sql_content: string | null
    entity_mapping_content: string | null
  }>(
    `SELECT features_content, actions_yml_content, open_api_spec_content,
            isa_config_content, schema_sql_content, entity_mapping_content
     FROM bdd_sessions WHERE project_id = $1
     ORDER BY updated_at DESC LIMIT 1`,
    [projectId]
  )

  if (!bddSession?.features_content || !bddSession?.actions_yml_content) {
    return { coderStage: 'error', phase: 'uiux_complete' }
  }

  const project = await db.queryOne<{ neon_connection_string: string | null }>(
    'SELECT neon_connection_string FROM projects WHERE id = $1', [projectId]
  )
  if (!project?.neon_connection_string) {
    return { coderStage: 'error', phase: 'uiux_complete' }
  }

  // 讀取 backend 檔案（可能已被上一輪 fix 更新）
  const backendFileRows = await db.queryMany<{ file_path: string; content: string; description: string | null }>(
    `SELECT file_path, content, description FROM project_files
     WHERE project_id = $1 AND skill_source = 'coder'
     AND (file_path LIKE 'lib/%' OR file_path LIKE 'app/api/%')`,
    [projectId]
  )
  const backendFiles: GeneratedComponent[] = backendFileRows.map(r => ({
    path: r.file_path, content: r.content, description: r.description || '',
  }))

  const featureFiles = (bddSession.features_content as unknown[]).map((f: unknown) => {
    const obj = f as Record<string, unknown>
    return {
      name: (obj.name as string) || (obj.featureName as string) || 'unknown',
      content: (obj.content as string) || (obj.featureContent as string) || '',
    }
  })

  if (round > 0) {
    await sendMessage(conversationId, io, {
      content: isChinese
        ? `自動重試修復（第 ${round} 輪）...`
        : `Auto-retry fix (round ${round})...`,
      stage: 'coder_testing',
    })
  }

  // 心跳
  const heartbeat = setInterval(() => void touchFlowActivity(redis, conversationId), 15_000)

  try {
    const { runRedGreenCycle, formatTestResults } = await import('../../services/specformula-runner')

    const result = await runRedGreenCycle({
      backendFiles,
      featureFiles,
      actionsYml: bddSession.actions_yml_content,
      openApiSpec: bddSession.open_api_spec_content || '',
      isaConfigYml: bddSession.isa_config_content || '',
      schemaSql: bddSession.schema_sql_content || '',
      entityMapping: bddSession.entity_mapping_content || '',
      neonConnectionString: project.neon_connection_string,
      maxAttempts: 3,
      trackingContext: { userId, conversationId },
      onProgress: async (step: string, percent: number) => {
        await touchFlowActivity(redis, conversationId)
        await sendMessage(conversationId, io, { content: `${step} (${percent}%)`, stage: 'coder_testing' })
      },
    })

    // 更新 project_files（如果有修復）
    if (result.attempts > 1) {
      for (const file of result.finalFiles) {
        await db.query(
          `INSERT INTO project_files (project_id, skill_source, file_path, content, description)
           VALUES ($1, 'coder', $2, $3, $4)
           ON CONFLICT (project_id, skill_source, file_path) DO UPDATE SET content = $3, description = $4`,
          [projectId, file.path, file.content, file.description || '']
        )
      }
    }

    // L31.J Phase 3a: persist 修過的 BDD 到 bdd_sessions.features_content
    if (result.fixedBddFeatures && result.fixedBddFeatures.size > 0) {
      try {
        const featureFilesObj = bddSession.features_content as Array<{ name: string; actionName: string; content: string }>
        const updatedFeatures = featureFilesObj.map(f => {
          const fixed = result.fixedBddFeatures!.get(f.name)
          return fixed ? { ...f, content: fixed } : f
        })
        await db.query(
          `UPDATE bdd_sessions SET features_content = $1, updated_at = NOW() WHERE project_id = $2`,
          [JSON.stringify(updatedFeatures), projectId]
        )
        logger.info({ projectId, fixedCount: result.fixedBddFeatures.size }, 'L31.J Phase 3a: BDD features 已 persist 到 bdd_sessions')
      } catch (e) {
        logger.warn({ err: e, projectId }, 'L31.J Phase 3a: persist BDD 失敗（不阻塞）')
      }
    }

    // 更新 FlowState
    // round=0 是 LangGraph fresh invoke 第一輪 → 重置 attempts（不繼承上次 retry 的累積）
    // round>0 是 graph 內部重試 loop → 累加（同一個 invoke 內的多輪測試應該加總）
    flowState = await getFlowState(redis, conversationId) || flowState
    flowState.coderTestPassed = result.allPassed
    flowState.coderTestAttempts = round === 0
      ? result.attempts
      : (flowState.coderTestAttempts || 0) + result.attempts
    flowState.coderTestFailedScenarios = result.testResults.failed
    flowState.coderTestFeatureCount = featureFiles.length
    flowState.coderTestRegressionRounds = round === 0
      ? result.regressionRounds
      : (flowState.coderTestRegressionRounds || 0) + result.regressionRounds

    // 儲存上一輪 failed 數量（用於 no_progress 判斷）
    const previousFailed = (flowState as unknown as Record<string, unknown>)._previousTestFailed as number | undefined
    ;(flowState as unknown as Record<string, unknown>)._previousTestFailed = result.testResults.failed

    await saveFlowState(redis, conversationId, flowState)

    const nextRound = round + 1
    const noProgress = previousFailed !== undefined && result.testResults.failed >= previousFailed

    if (result.allPassed) {
      return { coderStage: 'test_passed', testRound: nextRound }
    }
    if (noProgress || nextRound >= 3) {
      return { coderStage: 'test_failed', testRound: nextRound }
    }
    // 有進展、還有配額 → 回到 test（graph edge loop）
    return { coderStage: 'test_retry', testRound: nextRound }

  } catch (err) {
    logger.error({ err, projectId, round }, 'Test node 失敗')
    flowState = await getFlowState(redis, conversationId) || flowState
    flowState.coderTestStartedAt = undefined
    await saveFlowState(redis, conversationId, flowState)
    return { coderStage: 'test_failed', testRound: round + 1 }
  } finally {
    clearInterval(heartbeat)
  }
}

// ============================================================
// Node 4: finalize — 發送最終結果訊息
// ============================================================

async function finalizeNode(state: TellcraftStateType): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const io = getIo()
  const { projectId, conversationId } = state

  let flowState = await getFlowState(redis, conversationId)
  if (!flowState) return { phase: 'uiux_complete' }
  const isChinese = flowState.locale !== 'en'

  flowState.phase = 'uiux_complete'
  flowState.coderTestStartedAt = undefined
  flowState.waitingForReply = false
  await saveFlowState(redis, conversationId, flowState)

  const passed = state.coderStage === 'test_passed'
  const failed = flowState.coderTestFailedScenarios || 0
  const attempts = flowState.coderTestAttempts || 0
  const featureCount = flowState.coderTestFeatureCount || 0
  const regressionRounds = flowState.coderTestRegressionRounds || 0
  const estimatedFixRounds = Math.max(0, attempts - featureCount - regressionRounds)
  const wasFixedDuringRun = featureCount > 0 && attempts > featureCount

  // 拆解 attempts 成「Feature 首測 + LLM 修復 + 回歸」，避免「X 輪修復後」誤導用戶以為單一 scenario 被改 X 次
  const attemptsDetail = featureCount > 0
    ? (isChinese
      ? `共 ${attempts} 次測試（${featureCount} 個 Feature × 首測 + ${estimatedFixRounds} 次 LLM 修復 + ${regressionRounds} 輪回歸）`
      : `${attempts} test runs total (${featureCount} feature × first-pass + ${estimatedFixRounds} LLM fixes + ${regressionRounds} regression rounds)`)
    : (isChinese ? `共 ${attempts} 次測試嘗試` : `${attempts} test attempts`)

  const statusEmoji = passed ? '✅' : '❌'
  const summary = passed
    ? (isChinese
      ? wasFixedDuringRun
        ? `所有測試通過！\n\n📌 **這次通過經歷了 ${estimatedFixRounds} 次 LLM 修復 + ${regressionRounds} 輪回歸驗證。如果上方對話有 ❌ 失敗訊息，那是已被修復的舊狀態，可以忽略。**\n\n⚠️ 提醒：retry 出來的綠燈不等於穩定 — 部署到正式環境後請務必再驗證一次核心流程。`
        : '所有測試通過！'
      : wasFixedDuringRun
        ? `All tests passed!\n\n📌 **This pass involved ${estimatedFixRounds} LLM fixes + ${regressionRounds} regression rounds. Any ❌ messages above are now outdated — please disregard them.**\n\n⚠️ Heads up: a retry-induced green is not the same as a stable green. Re-verify core flows after deploying to production.`
        : 'All tests passed!')
    : (isChinese
      ? `${failed} 個 scenario 仍然失敗（${attemptsDetail}）`
      : `${failed} scenarios still failing (${attemptsDetail})`)

  const quickReplies: Array<{ label: string; value: string; style: 'primary' | 'secondary' | 'ghost' }> = []
  if (passed) {
    quickReplies.push({ label: isChinese ? '部署上線' : 'Deploy', value: '部署', style: 'primary' })
  } else {
    // L31.F: 「重新對齊 BDD」設為主要按鈕（會跑 Check 13-16 + 自動修對齊矛盾）
    quickReplies.push({ label: isChinese ? '重新對齊 BDD（推薦）' : 'Re-align BDD (Recommended)', value: '__realign_bdd__', style: 'primary' })
    quickReplies.push({ label: isChinese ? '只重試測試' : 'Retry Tests Only', value: '__verify_backend__', style: 'secondary' })
    quickReplies.push({ label: isChinese ? '帶風險部署' : 'Deploy (risky)', value: '__deploy_with_risk__', style: 'ghost' })
  }
  quickReplies.push({ label: isChinese ? '開始新專案' : 'New Project', value: '__new_project__', style: 'ghost' })

  // 重建 code_preview（用 DB 最新代碼）
  const tailwindConfig = flowState.uiuxDesignSystem ? generateTailwindConfig(flowState.uiuxDesignSystem) : ''
  const neonRow = await db.queryOne<{ neon_connection_string: string | null }>(
    'SELECT neon_connection_string FROM projects WHERE id = $1', [projectId]
  )

  const code = flowState.uiuxGeneratedCode
  if (code) {
    const sanitized = sanitizeForPreview(code)
    const backendFiles = await db.queryMany<{ file_path: string; content: string }>(
      `SELECT file_path, content FROM project_files WHERE project_id = $1 AND skill_source = 'coder'
       AND (file_path LIKE 'app/actions/%' OR file_path LIKE 'app/api/%' OR file_path LIKE 'lib/%')`,
      [projectId]
    )
    const serverActions = backendFiles.filter(f => f.file_path.startsWith('app/actions/')).map(f => ({ path: f.file_path, content: f.content, description: '' }))
    const apiRoutes = backendFiles.filter(f => f.file_path.startsWith('app/api/')).map(f => ({ path: f.file_path, content: f.content, description: '' }))
    const dbLib = backendFiles.filter(f => f.file_path.startsWith('lib/')).map(f => ({ path: f.file_path, content: f.content, description: '' }))

    await sendMessage(conversationId, io, {
      content: `${statusEmoji} **${summary}**`,
      stage: 'uiux_complete', layoutHint: 'split',
      richContent: {
        type: 'code_preview',
        data: {
          pages: sanitized.code.pages, components: sanitized.code.components, styles: sanitized.code.styles,
          tailwindConfig, currentPhase: 'uiux_complete',
          serverActions, apiRoutes, dbLib, hasServerActions: true,
          neonConnectionString: neonRow?.neon_connection_string || undefined,
        } as Record<string, unknown>,
      },
      quickReplies,
    })
  } else {
    await sendMessage(conversationId, io, {
      content: `${statusEmoji} **${summary}**`,
      stage: 'uiux_complete',
      quickReplies,
    })
  }

  logger.info({ projectId, conversationId, passed, failed, attempts }, 'Coder Subgraph 完成')
  return { phase: 'uiux_complete' }
}

// ============================================================
// Edge routing functions
// ============================================================

function afterValidate(state: TellcraftStateType): string {
  if (state.coderStage === 'blocked' || state.coderStage === 'no_data') return 'end'
  return 'generate'
}

function afterGenerate(state: TellcraftStateType): string {
  // generate node 設定了 coderStage
  if (state.coderStage === 'generated') return 'test'  // 有 Neon DB → 測試
  return 'end'  // 無 Neon DB 或 error → 結束
}

function afterTest(state: TellcraftStateType): string {
  if (state.coderStage === 'test_passed') return 'finalize'
  if (state.coderStage === 'test_retry') return 'test'  // ← fix loop edge!
  return 'finalize'  // test_failed or error
}

// ============================================================
// Build Subgraph
// ============================================================

export function buildCoderSubgraph() {
  return new StateGraph(TellcraftState)
    .addNode('validate', validateNode)
    .addNode('generate', generateNode)
    .addNode('test', testNode)
    .addNode('finalize', finalizeNode)

    .addEdge(START, 'validate')
    .addConditionalEdges('validate', afterValidate, {
      generate: 'generate',
      end: END,
    })
    .addConditionalEdges('generate', afterGenerate, {
      test: 'test',
      end: END,
    })
    .addConditionalEdges('test', afterTest, {
      test: 'test',       // ← fix loop!
      finalize: 'finalize',
    })
    .addEdge('finalize', END)
    .compile()
}

// ============================================================
// Helper
// ============================================================

function mergeComponents(
  original: GeneratedComponent[],
  rewritten: GeneratedComponent[]
): GeneratedComponent[] {
  const map = new Map<string, GeneratedComponent>()
  for (const comp of original) map.set(comp.path, comp)
  for (const comp of rewritten) map.set(comp.path, comp)
  return Array.from(map.values())
}
