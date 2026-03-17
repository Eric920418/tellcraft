// ============================================================
// Coder Skill Phase Handler
// 從 BDD 產出讀取規格 → 生成後端代碼 → 改寫前端組件
// ============================================================

import type Redis from 'ioredis'
import type { Server as SocketIOServer } from 'socket.io'
import * as db from '../../db/client'
import type { FlowState, GeneratedCode } from '../../types/flow-state'
import { type GeneratedComponent, generateTailwindConfig } from '../../services/uiux-generation'
import { executeCoderPipeline } from '../../services/coder-generation'
import { sendMessage, saveFlowState, getFlowState, touchFlowActivity } from '../orchestrator-utils'
import { createLogger } from '../../lib/logger'

const logger = createLogger('coder-phases')

export interface CoderSkillInput {
  taskId: string
  projectId: string
  conversationId: string
  userId: string
  redis: Redis
  io: SocketIOServer
}

export async function executeCoderSkill(input: CoderSkillInput): Promise<void> {
  const { projectId, conversationId, userId, redis, io } = input

  // 1. 讀取 BDD 產出
  const bddSession = await db.queryOne<{
    actions_yml_content: string | null
    schema_sql_content: string | null
    entity_mapping_content: string | null
  }>(
    `SELECT actions_yml_content, schema_sql_content, entity_mapping_content
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

  // 5. 執行 Pipeline
  try {
    const result = await executeCoderPipeline(
      {
        projectId,
        actionsYml: bddSession.actions_yml_content,
        schemaSql: bddSession.schema_sql_content,
        entityMapping: bddSession.entity_mapping_content || '',
        existingUiuxCode,
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
        fileType: f.path.startsWith('app/') && !f.path.includes('/components/') ? 'page' : 'component',
      })),
    ]

    await db.upsertProjectFiles(projectId, 'coder', allCoderFiles)

    // 合併代碼到 FlowState（rewritten 覆蓋 uiux）
    const mergedPages = mergeComponents(existingUiuxCode.pages, result.rewrittenFrontend.filter(f => pages.some(p => p.path === f.path)))
    const mergedComponents = mergeComponents(existingUiuxCode.components, result.rewrittenFrontend.filter(f => components.some(c => c.path === f.path)))

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

    // 發送完成訊息
    await sendMessage(conversationId, io, {
      content: isChinese
        ? `**後端代碼生成完成！**\n\n${result.summary}\n\n您的網站現在已連接真實的 Neon PostgreSQL 資料庫。\n\n- 輸入「**部署**」部署上線\n- 或描述想調整的地方`
        : `**Backend code generation complete!**\n\n${result.summary}\n\nYour site is now connected to a real Neon PostgreSQL database.\n\n- Type "**Deploy**" to go live\n- Or describe what you'd like to adjust`,
      stage: 'uiux_complete',
      layoutHint: 'split',
      richContent: {
        type: 'code_preview',
        data: {
          pages: mergedPages,
          components: mergedComponents,
          styles,
          tailwindConfig,
          currentPhase: 'uiux_complete',
          serverActions,
          apiRoutes,
          dbLib,
          hasServerActions: true,
          neonConnectionString: (await db.queryOne<{ neon_connection_string: string | null }>('SELECT neon_connection_string FROM projects WHERE id = $1', [projectId]))?.neon_connection_string || undefined,
        } as Record<string, unknown>,
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
      content: isChinese ? '找不到後端代碼，請先執行「接上資料庫」。' : 'No backend code found.',
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
    stage: 'info',
  })

  // 定時心跳：每 15 秒觸發一次，確保長時間操作（pnpm install、LLM 修復）期間不被超時恢復誤殺
  const heartbeatInterval = setInterval(() => {
    void touchFlowActivity(redis, conversationId)
  }, 15_000)

  try {
    const { runRedGreenCycle, formatTestResults } = await import('../../services/specformula-runner')

    // 3. 執行紅綠燈循環
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
      onProgress: async (step, percent) => {
        await touchFlowActivity(redis, conversationId)
        await sendMessage(conversationId, io, {
          content: `${step} (${percent}%)`,
          stage: 'info',
        })
      },
    })

    // 4. 更新結果
    state = await getFlowState(redis, conversationId) || state
    state.phase = 'uiux_complete'
    state.coderTestPassed = result.allPassed
    state.coderTestAttempts = result.attempts
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
    const summary = result.allPassed
      ? (isChinese ? '所有測試通過！' : 'All tests passed!')
      : (isChinese ? `${result.testResults.failed} 個場景仍然失敗（${result.attempts} 輪修復後）` : `${result.testResults.failed} scenarios still failing after ${result.attempts} attempts`)

    const quickReplies: Array<{ label: string; value: string; style: 'primary' | 'secondary' | 'ghost' }> = [
      { label: isChinese ? '部署上線' : 'Deploy', value: '部署', style: 'primary' },
    ]
    if (!result.allPassed) {
      quickReplies.push({ label: isChinese ? '重試測試' : 'Retry Tests', value: '__verify_backend__', style: 'secondary' })
    }
    quickReplies.push({ label: isChinese ? '開始新專案' : 'New Project', value: '__new_project__', style: 'ghost' })

    await sendMessage(conversationId, io, {
      content: `${statusEmoji} **${summary}**\n\n${reportText}`,
      stage: 'uiux_complete',
      quickReplies,
    })

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

function inferFileType(path: string): string {
  if (path.startsWith('lib/db')) return 'config'
  if (path.startsWith('lib/actions/')) return 'service'
  if (path.startsWith('app/actions/')) return 'service'
  if (path.startsWith('app/api/')) return 'api_route'
  return 'component'
}

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
