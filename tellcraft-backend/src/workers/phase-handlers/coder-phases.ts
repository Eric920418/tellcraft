// ============================================================
// Coder Skill Phase Handler
// 從 BDD 產出讀取規格 → 生成後端代碼 → 改寫前端組件
// ============================================================

import type Redis from 'ioredis'
import * as db from '../../db/client'
import type { FlowState, GeneratedCode, IoEmitter } from '../../types/flow-state'
import { type GeneratedComponent, generateTailwindConfig } from '../../services/uiux-generation'
import { executeCoderPipeline } from '../../services/coder-generation'
import { sendMessage, saveFlowState, getFlowState, touchFlowActivity, snapshotCodeToGeneration, inferFileType } from '../orchestrator-utils'
import { runCoderE2ETests } from '../../services/coder-e2e-test'
import { executeRedPhase, formatRedPhaseReport, runRedPhaseFullValidation, runRedPhaseRoutingValidation } from '../../services/red-phase-validator'
import { runFeatureAlignmentGate } from '../../services/feature-alignment-gate'
import { analyzeSpecIssuesInFailures } from '../../services/semantic-consistency-validator'
import { runFormulation, generateDraftBatch, type FormulationResult } from '../../services/formulation'
import type { ClarifyItem } from '../../services/bdd-session'
import { createLogger } from '../../lib/logger'
import { sanitizeForPreview } from '../../services/code-verify'

const logger = createLogger('coder-phases')

export interface CoderSkillInput {
  taskId: string
  projectId: string
  conversationId: string
  userId: string
  redis: Redis
  io: IoEmitter
}

export async function executeCoderSkill(input: CoderSkillInput): Promise<void> {
  const { projectId, conversationId, userId, redis, io } = input

  // 1. 讀取 BDD 產出（含 features_content 供 response field 名稱對齊）
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
    // 恢復 FlowState 防止卡死（從重試進入時 phase 可能已是 coder_generating）
    const state = await getFlowState(redis, conversationId)
    if (state && state.phase === 'coder_generating') {
      state.phase = 'uiux_complete'
      state.coderGenerationStartedAt = undefined
      state.waitingForReply = false
      await saveFlowState(redis, conversationId, state)
    }
    await sendMessage(conversationId, io, {
      content: '此專案缺少 BDD 規格（actionsYml 或 schemaSql），無法生成後端代碼。請先完成 BDD 需求釐清。',
      stage: 'coder_error',
      quickReplies: [
        { label: '部署現有前端', value: '部署', style: 'secondary' as const },
      ],
    })
    return
  }

  // 2. 讀取 UIUX 代碼
  const uiuxFiles = await db.getProjectFiles(projectId, 'uiux')
  if (uiuxFiles.length === 0) {
    // 恢復 FlowState 防止卡死
    const state = await getFlowState(redis, conversationId)
    if (state && state.phase === 'coder_generating') {
      state.phase = 'uiux_complete'
      state.coderGenerationStartedAt = undefined
      state.waitingForReply = false
      await saveFlowState(redis, conversationId, state)
    }
    await sendMessage(conversationId, io, {
      content: '此專案沒有 UIUX 代碼，無法進行前端改寫。請先完成 UIUX 設計。',
      stage: 'coder_error',
    })
    return
  }

  // 重建 GeneratedCode（複用 deployer 的模式）
  const pages: GeneratedComponent[] = []
  const components: GeneratedComponent[] = []
  let styles = ''

  for (const f of uiuxFiles) {
    if (f.file_type === 'page') {
      pages.push({ path: f.file_path, content: f.content, description: f.description || '' })
    } else if (f.file_type === 'component') {
      components.push({ path: f.file_path, content: f.content, description: f.description || '' })
    } else if (f.file_type === 'style') {
      styles = f.content
    }
  }

  const existingUiuxCode: GeneratedCode = { pages, components, styles }

  // 3. 設定 FlowState
  let state = await getFlowState(redis, conversationId)
  if (!state) {
    state = {
      phase: 'coder_generating',
      projectId,
      currentRound: 0,
      questionIndex: 0,
      batchCount: 0,
      waitingForReply: false,
      totalQuestionsAsked: 0,
      userId,
    }
  }

  // 快照當前代碼（供失敗恢復）
  state.coderPreRewriteCode = state.uiuxGeneratedCode || existingUiuxCode
  state.phase = 'coder_generating'
  state.waitingForReply = false
  state.coderGenerationStartedAt = Date.now()
  if (!state.userId) state.userId = userId
  if (!state.projectId) state.projectId = projectId
  await saveFlowState(redis, conversationId, state)

  // 4. 通知用戶
  const isChinese = state.locale !== 'en'
  await sendMessage(conversationId, io, {
    content: isChinese
      ? '正在生成後端代碼，將 mock 數據替換為真實的資料庫操作...'
      : 'Generating backend code, replacing mock data with real database operations...',
    stage: 'coder_generating',
    progress: { current: 0, total: 100, step: isChinese ? '準備中' : 'Preparing' },
  })

  // 5. RED Phase — SDD 靜態規格驗證（Feature ↔ actionsYml ↔ Schema 一致性）
  if (bddSession.features_content && bddSession.features_content.length > 0) {
    try {
      const redResult = await executeRedPhase({
        features: bddSession.features_content,
        actionsYml: bddSession.actions_yml_content,
        schemaSql: bddSession.schema_sql_content,
        entityMapping: bddSession.entity_mapping_content || '',
      })

      // 更新 FlowState
      state = await getFlowState(redis, conversationId) || state
      state.coderRedPhasePassed = redResult.passed
      state.coderRedPhaseIssueCount = redResult.errors + redResult.warnings
      state.coderRedPhaseFixRounds = 0
      await saveFlowState(redis, conversationId, state)

      if (!redResult.passed) {
        // 有 error 級問題 — 記錄但不阻塞（後續 GREEN Phase 的 fixFailingAction 會修）
        // 日後可在此加入 LLM 自動修復 Feature 的邏輯
        logger.warn({
          errors: redResult.errors,
          warnings: redResult.warnings,
          issues: redResult.issues.filter(i => i.severity === 'error').map(i => ({
            feature: i.featureName,
            type: i.issueType,
            desc: i.description,
          })),
        }, 'RED Phase 發現規格問題')

        const report = formatRedPhaseReport(redResult)
        await sendMessage(conversationId, io, {
          content: isChinese
            ? `⚠ 規格預檢發現 ${redResult.errors} 個問題，將嘗試在代碼生成後自動修復：\n${report}`
            : `⚠ Spec pre-check found ${redResult.errors} issue(s), will attempt auto-fix after code generation:\n${report}`,
          stage: 'coder_generating',
        })
      } else {
        logger.info({ warnings: redResult.warnings, durationMs: redResult.durationMs }, 'RED Phase 通過')
      }
    } catch (e) {
      // RED Phase 失敗不阻塞 Pipeline — 降級跳過
      logger.error({ error: e }, 'RED Phase 執行失敗，降級跳過')
    }
  }

  // 6. RED Phase Stub — 全場景 SpecFormula 驗證（用 StubHttpAdapter 跑完整場景）
  if (bddSession.features_content && bddSession.features_content.length > 0
      && bddSession.open_api_spec_content && bddSession.isa_config_content) {
    try {
      // 查詢 Neon 連線字串
      const project = await db.queryOne<{ neon_connection_string: string | null }>(
        `SELECT neon_connection_string FROM projects WHERE id = $1`,
        [projectId]
      )

      if (project?.neon_connection_string) {
        const stubResult = await runRedPhaseFullValidation({
          features: bddSession.features_content,
          actionsYml: bddSession.actions_yml_content,
          openApiSpec: bddSession.open_api_spec_content,
          isaConfigYml: bddSession.isa_config_content,
          schemaSql: bddSession.schema_sql_content,
          entityMapping: bddSession.entity_mapping_content || '',
          neonConnectionString: project.neon_connection_string,
        })

        // 更新 FlowState
        state = await getFlowState(redis, conversationId) || state
        state.coderRedPhasePassed = stubResult.passed
        state.coderRedPhaseIssueCount = stubResult.unexpectedFailures.length
        await saveFlowState(redis, conversationId, state)

        if (!stubResult.passed) {
          logger.warn({
            unexpectedFailures: stubResult.unexpectedFailures.length,
            expectedRed: stubResult.expectedRedCount,
          }, 'RED Phase Stub 發現非預期失敗')

          const failureSummary = stubResult.unexpectedFailures
            .map(f => `- [${f.failureType}] ${f.featureName} / ${f.scenarioName}: ${f.error.substring(0, 80)}`)
            .join('\n')
          await sendMessage(conversationId, io, {
            content: isChinese
              ? `⚠ SDD RED Phase 發現 ${stubResult.unexpectedFailures.length} 個測試基礎設施問題：\n${failureSummary}`
              : `⚠ SDD RED Phase found ${stubResult.unexpectedFailures.length} test infrastructure issue(s):\n${failureSummary}`,
            stage: 'coder_generating',
          })
        } else {
          logger.info({
            expectedRed: stubResult.expectedRedCount,
            totalScenarios: stubResult.totalScenarios,
            durationMs: stubResult.durationMs,
          }, 'RED Phase Stub 通過 — 所有測試正確，全部預期 RED')
        }
      }
    } catch (e) {
      // Stub RED Phase 失敗不阻塞 Pipeline — 降級跳過
      logger.error({ error: e }, 'RED Phase Stub 執行失敗，降級跳過')
    }
  }

  // 6.5 RED Phase Routing — 路由匹配驗證（in-process Express + SupertestAdapter）
  if (bddSession.features_content && bddSession.features_content.length > 0
      && bddSession.open_api_spec_content && bddSession.isa_config_content) {
    try {
      const project = await db.queryOne<{ neon_connection_string: string | null }>(
        `SELECT neon_connection_string FROM projects WHERE id = $1`, [projectId]
      )

      if (project?.neon_connection_string) {
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
          logger.warn({
            mismatches: routingResult.routingMismatches.length,
            details: routingResult.routingMismatches.map(m => ({
              feature: m.featureName,
              step: m.stepText.substring(0, 60),
            })),
          }, 'RED Phase Routing 發現路由不匹配')

          const mismatchSummary = routingResult.routingMismatches
            .map(m => `- ${m.featureName}: ${m.stepText.substring(0, 60)}`)
            .join('\n')
          await sendMessage(conversationId, io, {
            content: `⚠ Routing 驗證發現 ${routingResult.routingMismatches.length} 個路由不匹配（不阻塞生成）：\n${mismatchSummary}`,
            stage: 'coder_generating',
          })
        } else {
          logger.info({
            expectedRed: routingResult.expectedRedCount,
            totalScenarios: routingResult.totalScenarios,
            durationMs: routingResult.durationMs,
          }, 'RED Phase Routing 通過')
        }
      }
    } catch (e) {
      logger.error({ error: e }, 'RED Phase Routing 執行失敗，降級跳過')
    }
  }

  // 6.8 Feature Alignment Gate — 阻斷式 Feature 品質閘門
  if (bddSession.features_content && bddSession.features_content.length > 0) {
    try {
      const gateResult = await runFeatureAlignmentGate({
        features: bddSession.features_content,
        actionsYml: bddSession.actions_yml_content,
        schemaSql: bddSession.schema_sql_content,
        entityMapping: bddSession.entity_mapping_content || '',
        trackingContext: { userId, conversationId },
      })

      if (gateResult.fixedFeatures || gateResult.fixedSchemaSql || gateResult.fixedEntityMapping) {
        // 用修復後的 Features + Schema + EntityMapping 更新 DB
        const setClauses: string[] = []
        const params: unknown[] = []

        if (gateResult.fixedFeatures) {
          bddSession.features_content = gateResult.fixedFeatures
          params.push(JSON.stringify(gateResult.fixedFeatures))
          setClauses.push(`features_content = $${params.length}`)
        }
        if (gateResult.fixedSchemaSql) {
          bddSession.schema_sql_content = gateResult.fixedSchemaSql
          params.push(gateResult.fixedSchemaSql)
          setClauses.push(`schema_sql_content = $${params.length}`)
        }
        if (gateResult.fixedEntityMapping) {
          bddSession.entity_mapping_content = gateResult.fixedEntityMapping
          params.push(gateResult.fixedEntityMapping)
          setClauses.push(`entity_mapping_content = $${params.length}`)
        }

        if (setClauses.length > 0) {
          params.push(bddSession.id)
          await db.query(
            `UPDATE bdd_sessions SET ${setClauses.join(', ')} WHERE id = $${params.length}`,
            params
          )
        }
        logger.info({ fixedCount: gateResult.fixedIssueCount, schemaUpdated: !!gateResult.fixedSchemaSql }, 'Alignment Gate: 已自動修復並更新 DB')
      }

      if (gateResult.blocked) {
        // 阻塞：告訴用戶問題無法自動修復，回退到 uiux_complete
        state = await getFlowState(redis, conversationId) || state
        state.phase = 'uiux_complete'
        state.waitingForReply = true
        await saveFlowState(redis, conversationId, state)
        await sendMessage(conversationId, io, {
          content: gateResult.blockMessage || 'Feature 對齊檢查失敗，請修正 BDD 規格後重試。',
          stage: 'coder_error',
          quickReplies: [
            { label: isChinese ? '重新生成 Features（適用新粒度規則）' : 'Regenerate Features', value: '__regenerate_features__', style: 'primary' as const },
            { label: isChinese ? '重試 Coder' : 'Retry Coder', value: '__retry_coder__', style: 'secondary' as const },
          ],
        })
        return
      }

      if (gateResult.fixedIssueCount > 0) {
        await sendMessage(conversationId, io, {
          content: isChinese
            ? `✓ Feature 對齊閘門：自動修復了 ${gateResult.fixedIssueCount} 個問題（${gateResult.durationMs}ms）`
            : `✓ Feature Alignment Gate: auto-fixed ${gateResult.fixedIssueCount} issue(s) (${gateResult.durationMs}ms)`,
          stage: 'coder_generating',
        })
      } else {
        logger.info({ durationMs: gateResult.durationMs }, 'Alignment Gate: 通過（無需修復）')
      }
    } catch (e) {
      // Alignment Gate 失敗不阻塞 Pipeline — 降級跳過
      logger.error({ error: e }, 'Alignment Gate 執行失敗，降級跳過')
    }
  }

  // 7. 執行 Pipeline
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
          // 心跳 + 進度推送
          void touchFlowActivity(redis, conversationId)
          io.to(`conversation:${conversationId}`).emit('coder_progress', { step, percent })
        },
      }
    )

    // 6. 成功 — 保存代碼
    const allCoderFiles = [
      ...result.backendFiles.map(f => ({
        filePath: f.path,
        content: f.content,
        description: f.description,
        fileType: inferFileType(f.path),
      })),
      ...result.rewrittenFrontend.map(f => ({
        filePath: f.path,
        content: f.content,
        description: f.description,
        fileType: inferFileType(f.path),
      })),
    ]

    await db.upsertProjectFiles(projectId, 'coder', allCoderFiles)

    // 快照代碼到 generation（Coder 完成後的完整代碼）
    await snapshotCodeToGeneration(projectId, {
      changeSummary: 'Coder 後端生成完成',
      conversationId,
    })

    // 合併代碼到 FlowState（rewritten 覆蓋 uiux，backendFiles 加入 components）
    const mergedPages = mergeComponents(existingUiuxCode.pages, result.rewrittenFrontend.filter(f => pages.some(p => p.path === f.path)))
    const mergedComponents = mergeComponents(
      [...existingUiuxCode.components, ...result.backendFiles],
      result.rewrittenFrontend.filter(f => components.some(c => c.path === f.path))
    )

    state = await getFlowState(redis, conversationId) || state
    state.uiuxGeneratedCode = { pages: mergedPages, components: mergedComponents, styles }
    state.phase = 'uiux_complete'
    state.uiuxCodePhase = 'complete'
    state.coderCompleted = true
    state.coderGenerationStartedAt = undefined
    state.waitingForReply = false
    await saveFlowState(redis, conversationId, state)

    // 分類後端檔案供 WebContainer 預覽
    const serverActions = result.backendFiles.filter(f => f.path.startsWith('app/actions/'))
    const apiRoutes = result.backendFiles.filter(f => f.path.startsWith('app/api/'))
    const dbLib = result.backendFiles.filter(f => f.path.startsWith('lib/'))
    const tailwindConfig = state.uiuxDesignSystem
      ? generateTailwindConfig(state.uiuxDesignSystem)
      : ''

    // 查詢 Neon 連線字串
    const neonRow = await db.queryOne<{ neon_connection_string: string | null }>(
      'SELECT neon_connection_string FROM projects WHERE id = $1', [projectId]
    )
    const neonConnectionString = neonRow?.neon_connection_string || undefined

    // E2E 端到端測試（Coder 完成後、sendMessage 前）
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

      logger.info({ passed: e2eResult.passed, softFail: e2eResult.softFail, summary: e2eResult.summary, fixCount: e2eResult.fixedFiles.length }, 'E2E 測試結果')

      // E2E softFail（基礎設施問題）→ 通知用戶但不阻塞
      if (!e2eResult.passed && e2eResult.softFail) {
        await sendMessage(conversationId, io, {
          content: isChinese
            ? `⚠️ E2E 檢查遇到問題：${e2eResult.summary}（不影響後續流程）`
            : `⚠️ E2E check encountered issues: ${e2eResult.summary} (does not block pipeline)`,
          stage: 'coder_testing',
        })
      }

      // 如果有修正，寫回 DB + 更新 FlowState
      if (e2eResult.fixedFiles.length > 0) {
        const fixedDbFiles = e2eResult.fixedFiles.map((f: { path: string; content: string }) => ({
          filePath: f.path,
          content: f.content,
          description: '',
          fileType: inferFileType(f.path),
        }))
        await db.upsertProjectFiles(projectId, 'coder', fixedDbFiles)

        // 更新 mergedPages/mergedComponents
        for (const fix of e2eResult.fixedFiles) {
          const pageIdx = mergedPages.findIndex(p => p.path === fix.path)
          if (pageIdx >= 0) mergedPages[pageIdx] = { ...mergedPages[pageIdx], content: fix.content }
          const compIdx = mergedComponents.findIndex(c => c.path === fix.path)
          if (compIdx >= 0) mergedComponents[compIdx] = { ...mergedComponents[compIdx], content: fix.content }
        }

        // 更新 FlowState
        state.uiuxGeneratedCode = { pages: mergedPages, components: mergedComponents, styles }
        await saveFlowState(redis, conversationId, state)
      }
    }

    // 自動執行 SpecFormula BDD 規格驗證（Coder 完成後立即觸發，不需用戶手動點按鈕）
    if (neonConnectionString) {
      try {
        // 先發送預覽代碼（讓用戶在等待測試期間可以預覽）
        const autoTestMockWarnings = result.mockDataWarnings || []
        const autoTestMockWarningText = autoTestMockWarnings.length > 0
          ? (isChinese
            ? `\n\n⚠️ ${autoTestMockWarnings.length} 個組件仍使用假資料：${autoTestMockWarnings.map(w => `\`${w}\``).join('、')}`
            : `\n\n⚠️ ${autoTestMockWarnings.length} component(s) still use mock data: ${autoTestMockWarnings.join(', ')}`)
          : ''
        await sendMessage(conversationId, io, {
          content: isChinese
            ? `**後端代碼生成完成！**\n\n${result.summary}${autoTestMockWarningText}\n\n正在自動執行 BDD 規格驗證...`
            : `**Backend code generation complete!**\n\n${result.summary}${autoTestMockWarningText}\n\nRunning BDD spec validation automatically...`,
          stage: 'coder_testing',
          layoutHint: 'split',
          richContent: {
            type: 'code_preview',
            data: {
              pages: mergedPages,
              components: mergedComponents,
              styles,
              tailwindConfig,
              currentPhase: 'coder_testing',
              serverActions,
              apiRoutes,
              dbLib,
              hasServerActions: true,
              neonConnectionString,
            } as Record<string, unknown>,
          },
        })

        await executeCoderTesting({
          taskId: input.taskId,
          projectId, conversationId, userId, redis, io,
          codePreviewData: {
            pages: mergedPages,
            components: mergedComponents,
            styles,
            tailwindConfig,
            serverActions,
            apiRoutes,
            dbLib,
            hasServerActions: true,
            neonConnectionString,
          },
        } as any)

        logger.info({ projectId, conversationId, ...summarizeResult(result) }, 'Coder Skill + SpecFormula 完成')
        return  // executeCoderTesting 內部已處理完成訊息和 FlowState
      } catch (testErr) {
        logger.warn({ err: testErr, projectId }, 'SpecFormula 自動測試失敗，降級為手動觸發')
        // 降級：走下面原有的完成訊息邏輯（顯示 __verify_backend__ 按鈕）
      }
    }

    // 發送完成訊息（無 Neon DB 或 SpecFormula 自動觸發失敗時的降級路徑）
    const mockWarnings = result.mockDataWarnings || []
    const mockWarningText = mockWarnings.length > 0
      ? (isChinese
        ? `\n\n⚠️ 以下 ${mockWarnings.length} 個組件仍使用假資料，可能需要手動調整：\n${mockWarnings.map(w => `- \`${w}\``).join('\n')}`
        : `\n\n⚠️ ${mockWarnings.length} component(s) still use mock data and may need manual adjustment:\n${mockWarnings.map(w => `- \`${w}\``).join('\n')}`)
      : ''
    await sendMessage(conversationId, io, {
      content: isChinese
        ? `**後端代碼生成完成！**\n\n${result.summary}${mockWarningText}\n\n您的網站現在已連接真實的 Neon PostgreSQL 資料庫。\n\n- 輸入「**部署**」部署上線\n- 或描述想調整的地方`
        : `**Backend code generation complete!**\n\n${result.summary}${mockWarningText}\n\nYour site is now connected to a real Neon PostgreSQL database.\n\n- Type "**Deploy**" to go live\n- Or describe what you'd like to adjust`,
      stage: 'uiux_complete',
      layoutHint: 'split',
      richContent: {
        type: 'code_preview',
        data: (() => {
          const s = sanitizeForPreview({ pages: mergedPages, components: mergedComponents, styles })
          return { pages: s.code.pages, components: s.code.components, styles: s.code.styles, tailwindConfig, currentPhase: 'uiux_complete', serverActions, apiRoutes, dbLib, hasServerActions: true, neonConnectionString }
        })() as Record<string, unknown>,
      },
      quickReplies: [
        { label: isChinese ? '部署上線' : 'Deploy', value: '部署', style: 'primary' as const },
        { label: isChinese ? '驗證後端' : 'Verify Backend', value: '__verify_backend__', style: 'secondary' as const },
        { label: isChinese ? '開始新專案' : 'New Project', value: '__new_project__', style: 'ghost' as const },
      ],
    })

    logger.info({ projectId, conversationId, ...summarizeResult(result) }, 'Coder Skill 完成')
  } catch (err) {
    // 7. 失敗 — 恢復快照
    logger.error({ err, projectId, conversationId }, 'Coder Skill 失敗')

    state = await getFlowState(redis, conversationId) || state
    if (state.coderPreRewriteCode) {
      state.uiuxGeneratedCode = state.coderPreRewriteCode
    }
    state.phase = 'uiux_complete'
    state.uiuxCodePhase = 'complete'
    state.coderGenerationStartedAt = undefined
    state.waitingForReply = false
    await saveFlowState(redis, conversationId, state)

    const errorMsg = err instanceof Error ? err.message : String(err)
    await sendMessage(conversationId, io, {
      content: isChinese
        ? `**後端代碼生成失敗**\n\n${errorMsg}\n\n您可以重試或直接部署現有的前端代碼。`
        : `**Backend code generation failed**\n\n${errorMsg}\n\nYou can retry or deploy the existing frontend code.`,
      stage: 'uiux_complete',
      quickReplies: [
        { label: isChinese ? '重試' : 'Retry', value: '__connect_database__', style: 'primary' as const },
        { label: isChinese ? '直接部署' : 'Deploy as-is', value: '部署', style: 'secondary' as const },
      ],
    })
  }
}

// ============================================================
// Coder Testing（SpecFormula 紅綠燈）
// ============================================================

export async function executeCoderTesting(input: CoderSkillInput): Promise<void> {
  const { projectId, conversationId, userId, redis, io } = input

  let state = await getFlowState(redis, conversationId)
  if (!state) {
    await sendMessage(conversationId, io, { content: '找不到對話狀態', stage: 'error' })
    return
  }
  const isChinese = state.locale !== 'en'

  // 1. 讀取所需資料
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
    await sendMessage(conversationId, io, {
      content: isChinese ? '缺少 BDD 規格，無法執行測試。' : 'Missing BDD specs, cannot run tests.',
      stage: 'error',
    })
    return
  }

  // 讀取 Neon 連線字串
  const project = await db.queryOne<{ neon_connection_string: string | null }>(
    'SELECT neon_connection_string FROM projects WHERE id = $1',
    [projectId]
  )

  if (!project?.neon_connection_string) {
    await sendMessage(conversationId, io, {
      content: isChinese ? '缺少資料庫連線，請先建立 Neon DB。' : 'Missing database connection.',
      stage: 'error',
    })
    return
  }

  // 讀取 backend 檔案
  const backendFileRows = await db.queryMany<{ file_path: string; content: string; description: string | null }>(
    `SELECT file_path, content, description FROM project_files
     WHERE project_id = $1 AND skill_source = 'coder'
     AND (file_path LIKE 'lib/%' OR file_path LIKE 'app/api/%')`,
    [projectId]
  )

  if (backendFileRows.length === 0) {
    await sendMessage(conversationId, io, {
      content: isChinese ? '找不到後端代碼，請先執行「生成後端」。' : 'No backend code found.',
      stage: 'error',
    })
    return
  }

  const backendFiles: GeneratedComponent[] = backendFileRows.map(r => ({
    path: r.file_path,
    content: r.content,
    description: r.description || '',
  }))

  // 解析 featureFiles（features_content 是 JSONB，pg driver 自動解析為陣列）
  const rawFeatures = bddSession.features_content
  const featureFiles: { name: string; content: string }[] = Array.isArray(rawFeatures)
    ? rawFeatures.map((f: unknown) => {
        const obj = f as Record<string, unknown>
        return {
          name: (obj.name as string) || (obj.featureName as string) || 'unknown',
          content: (obj.content as string) || (obj.featureContent as string) || '',
        }
      })
    : []

  if (featureFiles.length === 0) {
    await sendMessage(conversationId, io, { content: 'Feature Files 為空', stage: 'error' })
    return
  }

  // 2. 設定 phase
  state.phase = 'coder_testing'
  state.coderTestStartedAt = Date.now()
  state.waitingForReply = false
  await saveFlowState(redis, conversationId, state)

  await sendMessage(conversationId, io, {
    content: isChinese ? '開始執行 SpecFormula 測試...' : 'Starting SpecFormula tests...',
    stage: 'coder_testing',
  })

  // 定時心跳：每 15 秒觸發一次，確保長時間操作（pnpm install、LLM 修復）期間不被超時恢復誤殺
  const heartbeatInterval = setInterval(() => {
    void touchFlowActivity(redis, conversationId)
  }, 15_000)

  try {
    const { runRedGreenCycle, formatTestResults } = await import('../../services/specformula-runner')

    // 3. 執行紅綠燈循環
    const rgcInput = {
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
        await sendMessage(conversationId, io, {
          content: `${step} (${percent}%)`,
          stage: 'coder_testing',
        })
      },
    }

    let result = await runRedGreenCycle(rgcInput)

    // 3b. 自動重試：測試沒全過且有進展就繼續（最多 3 輪，不需用戶手動按重試）
    const MAX_AUTO_RETRIES = 3
    let autoRetry = 0
    let previousFailed = result.testResults.failed

    while (!result.allPassed && autoRetry < MAX_AUTO_RETRIES) {
      autoRetry++
      logger.info({ autoRetry, failed: previousFailed, conversationId }, '自動重試修復')
      await sendMessage(conversationId, io, {
        content: isChinese
          ? `自動重試修復（第 ${autoRetry} 輪）— ${previousFailed} 個場景待修...`
          : `Auto-retry fix (round ${autoRetry}) — ${previousFailed} scenarios remaining...`,
        stage: 'coder_testing',
      })
      await touchFlowActivity(redis, conversationId)

      result = await runRedGreenCycle({ ...rgcInput, backendFiles: result.finalFiles })

      if (result.testResults.failed >= previousFailed) {
        logger.info({ autoRetry, failed: result.testResults.failed, previousFailed }, '自動重試無進展，停止')
        break
      }
      previousFailed = result.testResults.failed
    }

    // 4. 更新結果
    state = await getFlowState(redis, conversationId) || state
    state.phase = 'uiux_complete'
    state.coderTestPassed = result.allPassed
    state.coderTestAttempts = result.attempts
    state.coderTestFailedScenarios = result.testResults.failed
    state.coderTestStartedAt = undefined
    state.waitingForReply = false

    // 如果有修復的代碼，更新 project_files
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

    await saveFlowState(redis, conversationId, state)

    const reportText = formatTestResults(result.testResults)
    const statusEmoji = result.allPassed ? '✅' : '❌'

    // 分析失敗的 scenarios 是否為 Feature 內部矛盾（修代碼永遠沒用）
    let specAnalysis: { hasSpecIssues: boolean; humanReadableReport: string } = { hasSpecIssues: false, humanReadableReport: '' }
    if (!result.allPassed) {
      try {
        const failedScenarios = result.testResults.scenarios
          .filter((s) => s.status === 'failed')
          .map((s) => ({ featureName: s.featureName, scenarioName: s.scenarioName, error: s.error }))
        specAnalysis = analyzeSpecIssuesInFailures(failedScenarios, featureFiles)
      } catch (e) {
        logger.warn({ err: e }, 'Spec issue 分析失敗，降級為通用訊息')
      }
    }

    // 偵測 API summary mismatch（Feature When summary 在 api-spec 找不到）
    const apiMismatchFailures = result.allPassed ? [] : result.testResults.scenarios
      .filter(s => s.status === 'failed' && /找不到 API 操作/i.test(s.error || ''))
    const missingApiSummaries = new Set<string>()
    for (const s of apiMismatchFailures) {
      const m = (s.error || '').match(/找不到 API 操作 '([^']+)'/)
      if (m) missingApiSummaries.add(m[1])
    }
    const hasApiMismatch = missingApiSummaries.size > 0 && !specAnalysis.hasSpecIssues

    let summary: string
    if (result.allPassed) {
      summary = isChinese ? '所有測試通過！' : 'All tests passed!'
    } else if (specAnalysis.hasSpecIssues) {
      // Feature 內部矛盾 → 明確告知用戶
      summary = isChinese
        ? `**Feature 內部矛盾，LLM 無法靠修改代碼解決**\n\n${specAnalysis.humanReadableReport}\n\n修了 ${result.attempts} 輪都失敗。需要您確認正確意圖才能繼續。`
        : `**Feature contains internal contradictions, LLM cannot fix by modifying code**\n\n${specAnalysis.humanReadableReport}\n\nAfter ${result.attempts} fix rounds. Please confirm the correct intent.`
    } else if (hasApiMismatch) {
      // Feature When summary vs actionsYml summary 不對齊
      const missingList = Array.from(missingApiSummaries).map(s => `- 「${s}」`).join('\n')
      summary = isChinese
        ? `**Feature ↔ actionsYml 對齊失敗（修代碼絕對沒用）**\n\n` +
          `Feature 的 When 步驟用了以下 summary，但 actionsYml/api-spec 找不到對應 operation：\n${missingList}\n\n` +
          `原因：Feature 與 actionsYml 是兩次獨立 LLM 生成，用詞略有差異（e.g. 多了「一筆」之類修飾詞）。handler 代碼本身是對的，只是 summary 對不上。\n\n` +
          `${apiMismatchFailures.length} 個 scenario 100% 失敗（${result.attempts} 輪修復後）。`
        : `**Feature ↔ actionsYml summary mismatch (code fix won't work)**\n\nMissing summaries in api-spec:\n${missingList}\n\nReason: Feature and actionsYml were generated by separate LLM calls with slight wording drift. The handler code is correct; only the summaries don't align.`
    } else {
      summary = isChinese
        ? `${result.testResults.failed} 個場景仍然失敗（${result.attempts} 輪修復後）`
        : `${result.testResults.failed} scenarios still failing after ${result.attempts} attempts`
    }

    const quickReplies: Array<{ label: string; value: string; style: 'primary' | 'secondary' | 'ghost' }> = []
    if (result.allPassed) {
      quickReplies.push({ label: isChinese ? '部署上線' : 'Deploy', value: '部署', style: 'primary' })
    } else if (specAnalysis.hasSpecIssues) {
      // Spec 矛盾 → 主要選項是審查 Feature
      quickReplies.push({ label: isChinese ? '審查並修改 Feature' : 'Review Features', value: isChinese ? '修改 Feature' : 'review features', style: 'primary' })
      quickReplies.push({ label: isChinese ? '強制重試（我確認 Feature 正確）' : 'Force Retry', value: '__verify_backend__', style: 'secondary' })
      quickReplies.push({ label: isChinese ? '帶風險部署' : 'Deploy (risky)', value: '__deploy_with_risk__', style: 'ghost' })
    } else if (hasApiMismatch) {
      // API summary 不對齊 → 一鍵重新生成 Features（適用新粒度規則）為主要選項
      quickReplies.push({ label: isChinese ? '重新生成 Features（適用新粒度規則）' : 'Regenerate Features', value: '__regenerate_features__', style: 'primary' })
      quickReplies.push({ label: isChinese ? '回 BDD 修正 Feature' : 'Back to BDD', value: '__retry_coder__', style: 'secondary' })
      quickReplies.push({ label: isChinese ? '帶風險部署' : 'Deploy (risky)', value: '__deploy_with_risk__', style: 'ghost' })
    } else {
      quickReplies.push({ label: isChinese ? '重試測試' : 'Retry Tests', value: '__verify_backend__', style: 'primary' })
      quickReplies.push({ label: isChinese ? '帶風險部署' : 'Deploy (risky)', value: '__deploy_with_risk__', style: 'secondary' })
    }
    quickReplies.push({ label: isChinese ? '開始新專案' : 'New Project', value: '__new_project__', style: 'ghost' })

    // 用修復後的 backend files 重建 code_preview，讓 WebContainer 更新
    if (result.attempts > 1 && (input as any).codePreviewData) {
      const cpd = (input as any).codePreviewData as Record<string, unknown>
      // 用修復後的 finalFiles 替換原始 backend files
      const updatedServerActions = result.finalFiles.filter(f => f.path.startsWith('app/actions/'))
      const updatedApiRoutes = result.finalFiles.filter(f => f.path.startsWith('app/api/'))
      const updatedDbLib = result.finalFiles.filter(f => f.path.startsWith('lib/'))

      const sanitizedCpd = sanitizeForPreview({ pages: cpd.pages as GeneratedComponent[], components: cpd.components as GeneratedComponent[], styles: (cpd.styles as string) || '' })
      await sendMessage(conversationId, io, {
        content: `${statusEmoji} **${summary}**\n\n${reportText}`,
        stage: 'uiux_complete',
        layoutHint: 'split',
        richContent: {
          type: 'code_preview',
          data: {
            ...cpd,
            pages: sanitizedCpd.code.pages,
            components: sanitizedCpd.code.components,
            styles: sanitizedCpd.code.styles,
            currentPhase: 'uiux_complete',
            serverActions: updatedServerActions.length > 0 ? updatedServerActions : cpd.serverActions,
            apiRoutes: updatedApiRoutes.length > 0 ? updatedApiRoutes : cpd.apiRoutes,
            dbLib: updatedDbLib.length > 0 ? updatedDbLib : cpd.dbLib,
          },
        },
        quickReplies,
      })
    } else {
      await sendMessage(conversationId, io, {
        content: `${statusEmoji} **${summary}**\n\n${reportText}`,
        stage: 'uiux_complete',
        quickReplies,
      })
    }

    logger.info({
      projectId, conversationId,
      allPassed: result.allPassed,
      attempts: result.attempts,
      passed: result.testResults.passed,
      failed: result.testResults.failed,
    }, 'Coder Testing 完成')

  } catch (err) {
    logger.error({ err, projectId, conversationId }, 'Coder Testing 失敗')

    state = await getFlowState(redis, conversationId) || state
    state.phase = 'uiux_complete'
    state.coderTestStartedAt = undefined
    state.waitingForReply = false
    await saveFlowState(redis, conversationId, state)

    const errorMsg = err instanceof Error ? err.message : String(err)
    await sendMessage(conversationId, io, {
      content: isChinese
        ? `**測試執行失敗**\n\n${errorMsg}\n\n您可以重試或直接部署。`
        : `**Test execution failed**\n\n${errorMsg}\n\nYou can retry or deploy as-is.`,
      stage: 'uiux_complete',
      quickReplies: [
        { label: isChinese ? '重試測試' : 'Retry Tests', value: '__verify_backend__', style: 'primary' as const },
        { label: isChinese ? '直接部署' : 'Deploy as-is', value: '部署', style: 'secondary' as const },
      ],
    })
  } finally {
    clearInterval(heartbeatInterval)
  }
}

// ============================================================
// 工具函數
// ============================================================

/**
 * 合併組件列表：rewritten 覆蓋同路徑的原始組件
 */
function mergeComponents(
  original: GeneratedComponent[],
  rewritten: GeneratedComponent[]
): GeneratedComponent[] {
  const map = new Map<string, GeneratedComponent>()
  for (const comp of original) map.set(comp.path, comp)
  for (const comp of rewritten) map.set(comp.path, comp)
  return Array.from(map.values())
}

function summarizeResult(result: { backendFiles: unknown[]; rewrittenFrontend: unknown[]; unchangedFrontend: unknown[] }) {
  return {
    backendFiles: result.backendFiles.length,
    rewrittenFrontend: result.rewrittenFrontend.length,
    unchangedFrontend: result.unchangedFrontend.length,
  }
}

// ============================================================
// 舊對話逃生出口：重新生成 Features（適用第 9 層新粒度規則）
// ============================================================

/**
 * 從既有 BDD session 重新生成 Features（適用第 9 層 1 Feature = 1 Operation 規則）。
 * 適用場景：舊對話的 Feature 含 CRUD 合併，新規則下 Coder 跑 RED Phase 失敗。
 * 用戶點「重新生成 Features（適用新粒度規則）」quickReply 觸發。
 *
 * 流程：
 * 1. 讀 BDD session（保留 originalRequirements + resolvedItems + ES doc）
 * 2. 清空 features_content / actions_yml_content / open_api_spec_content / isa_config_content
 * 3. 跑 generateDraftBatch（有 ES）或 runFormulation（無 ES）
 * 4. 寫回 features_content
 * 5. 呼叫 completeSpecPhase 自動跑 actionsYml + isaConfig + DB provisioning + dry-run
 */
export async function regenerateFeaturesTask(input: {
  projectId: string
  conversationId: string
  userId: string
  redis: Redis
  io: IoEmitter
}): Promise<void> {
  const { projectId, conversationId, userId, redis, io } = input

  const state = await getFlowState(redis, conversationId)
  if (!state) {
    await sendMessage(conversationId, io, { content: '找不到對話狀態', stage: 'error' })
    return
  }
  const isChinese = state.locale !== 'en'

  // 1. 讀最新 BDD session
  const bddSession = await db.queryOne<{
    id: string
    original_requirements: string
    clarify_items: unknown
    staging_items: unknown
    resolved_items: unknown
    es_document_content: string | null
    project_context: string | null
  }>(
    `SELECT id, original_requirements, clarify_items, staging_items, resolved_items,
            es_document_content, project_context
     FROM bdd_sessions WHERE project_id = $1 ORDER BY updated_at DESC LIMIT 1`,
    [projectId]
  )

  if (!bddSession) {
    await sendMessage(conversationId, io, {
      content: isChinese ? '找不到規格資料，無法重新生成。' : 'BDD session not found.',
      stage: 'error',
    })
    return
  }

  // 2. 清空舊生成結果
  await db.updateBddSession(bddSession.id, {
    featuresContent: null,
    actionsYmlContent: null,
    openApiSpecContent: null,
    isaConfigContent: null,
  })

  // 3. 告知用戶 + 設 phase
  state.phase = 'formulation'
  state.sessionId = bddSession.id
  state.waitingForReply = false
  state.formulationStartedAt = Date.now()
  await saveFlowState(redis, conversationId, state)

  await sendMessage(conversationId, io, {
    content: isChinese
      ? '🔄 步驟 1/4：使用新粒度規則重新生成 Features（預估 1-2 分鐘）...'
      : 'Step 1/4: Regenerating Features with new granularity (est. 1-2 min)...',
    stage: 'formulation_start',
    progress: { current: 1, total: 4, step: 'Features 生成' },
  })

  // 4. 合併 resolved items
  const staging = Array.isArray(bddSession.staging_items) ? bddSession.staging_items : []
  const resolved = Array.isArray(bddSession.resolved_items) ? bddSession.resolved_items : []
  const allResolvedItems = ([...staging, ...resolved] as ClarifyItem[]).filter(
    (item): item is ClarifyItem => !!item?.answer
  )

  try {
    // 5. 執行 formulation
    let result: FormulationResult
    if (bddSession.es_document_content) {
      const draft = await generateDraftBatch(
        bddSession.es_document_content,
        bddSession.original_requirements,
        allResolvedItems,
        bddSession.project_context || undefined,
        { conversationId, userId }
      )
      result = {
        success: draft.success,
        schemaSql: draft.schemaSql,
        entityMapping: draft.entityMapping,
        features: draft.features,
        error: draft.error,
      }
    } else {
      result = await runFormulation(
        bddSession.original_requirements,
        allResolvedItems,
        bddSession.project_context || undefined,
        undefined,
        { conversationId, userId }
      )
    }

    if (!result.success || !result.features) {
      state.phase = 'uiux_complete'
      state.formulationStartedAt = undefined
      await saveFlowState(redis, conversationId, state)
      await sendMessage(conversationId, io, {
        content: isChinese
          ? `重新生成失敗：${result.error || '未知錯誤'}`
          : `Regeneration failed: ${result.error || 'unknown'}`,
        stage: 'error',
        quickReplies: [
          { label: isChinese ? '再試一次' : 'Retry', value: '__regenerate_features__', style: 'primary' as const },
        ],
      })
      return
    }

    // 6. 保存新 features 到 session
    await db.updateBddSession(bddSession.id, {
      schemaSqlContent: result.schemaSql,
      entityMappingContent: result.entityMapping,
      featuresContent: result.features,
      currentPhase: 'spec_discovery',
    })

    await sendMessage(conversationId, io, {
      content: isChinese
        ? `✅ 已生成 ${result.features.length} 個 Features。\n🔄 步驟 2/4：驗證規格格式 + 生成 actions.yml + isa_config（預估 5-7 分鐘，內含 LLM 呼叫）...`
        : `✅ Generated ${result.features.length} Features.\nStep 2/4: Validating + generating actions.yml + isa_config (est. 5-7 min)...`,
      stage: 'info',
      progress: { current: 2, total: 4, step: '規格驗證與生成' },
    })

    // 7. 觸發 completeSpecPhase（自動跑 Feature 驗證 + actionsYml + isaConfig + DB + dry-run）
    // 加 15min timeout 防止 LLM 卡死讓 FlowState 永久孤兒
    state.sessionId = bddSession.id
    await saveFlowState(redis, conversationId, state)

    const { completeSpecPhase } = await import('./bdd-phases')
    const COMPLETE_SPEC_TIMEOUT_MS = 15 * 60 * 1000 // 15 分鐘
    await Promise.race([
      completeSpecPhase(conversationId, state, redis, io),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('completeSpecPhase 超時（> 15 分鐘）')), COMPLETE_SPEC_TIMEOUT_MS)
      ),
    ])

    // 8. completeSpecPhase 完成後追加引導訊息
    const updatedState = await getFlowState(redis, conversationId)
    if (updatedState?.phase === 'spec_completed' || updatedState?.phase === 'uiux_design_preference') {
      await sendMessage(conversationId, io, {
        content: isChinese
          ? `✅ Features 已用新粒度規則重新生成（${result.features.length} 個獨立 Feature）。\n現在可以重新執行後端代碼生成。`
          : `✅ Features regenerated (${result.features.length} independent Features). Ready to re-run backend generation.`,
        stage: 'info',
        quickReplies: [
          { label: isChinese ? '重新生成後端' : 'Re-run Coder', value: '__connect_database__', style: 'primary' as const },
        ],
      })
    }

    logger.info({
      projectId, conversationId, sessionId: bddSession.id, featureCount: result.features.length,
    }, 'regenerateFeaturesTask 完成')
  } catch (err) {
    logger.error({ err, projectId, conversationId }, '重新生成 Features 失敗')
    state.phase = 'uiux_complete'
    state.formulationStartedAt = undefined
    await saveFlowState(redis, conversationId, state)
    const errorMsg = err instanceof Error ? err.message : String(err)
    await sendMessage(conversationId, io, {
      content: isChinese ? `重新生成失敗：${errorMsg}` : `Regeneration failed: ${errorMsg}`,
      stage: 'error',
      quickReplies: [
        { label: isChinese ? '再試一次' : 'Retry', value: '__regenerate_features__', style: 'primary' as const },
      ],
    })
  }
}
