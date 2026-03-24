// ============================================================
// 迭代修改 + 回滾 Skill（從 orchestrator.ts 抽出）
// ============================================================

import { Server as SocketIOServer } from 'socket.io'
import Redis from 'ioredis'
import * as db from '../db/client'
import { createLogger } from '../lib/logger'

const logger = createLogger('iteration-skill')
import type { FlowState } from '../types/flow-state'
import { sendMessage, saveFlowState, getFlowState, generatedCodeToFileRows, deductCredits, makeStreamingCallback, snapshotCodeToGeneration } from '../workers/orchestrator-utils'
import { CREDIT_COSTS } from '../config/plans'
import { refineCode, refineFullStackCode, generateTailwindConfig, GeneratedComponent, buildStreamingHandler } from './uiux-generation'
import { listProjectDeployments, rollbackToDeployment, toVercelSlug } from './deployer'

const MAX_ITERATIONS_PER_SESSION = 50

// ============================================================
// 內部 Helper
// ============================================================

/**
 * 從 FlowState 或 project_files 取得當前代碼
 */
async function resolveCurrentCode(state: FlowState): Promise<{
  pages: GeneratedComponent[]
  components: GeneratedComponent[]
  styles: string
} | null> {
  if (state.uiuxGeneratedCode) {
    return state.uiuxGeneratedCode
  }

  if (state.projectId) {
    const projectFiles = await db.getProjectFiles(state.projectId, 'uiux')
    if (projectFiles.length > 0) {
      const pages: GeneratedComponent[] = []
      const components: GeneratedComponent[] = []
      let styles = ''
      for (const f of projectFiles) {
        if (f.file_type === 'page') {
          pages.push({ path: f.file_path, content: f.content, description: f.description || '' })
        } else if (f.file_type === 'component') {
          components.push({ path: f.file_path, content: f.content, description: f.description || '' })
        } else if (f.file_type === 'style') {
          styles = f.content
        }
      }
      return { pages, components, styles }
    }
  }

  return null
}

/**
 * 從 FlowState 或 project_files 取得全棧代碼（前端 + 後端）
 */
async function resolveFullStackCode(state: FlowState): Promise<{
  frontend: { pages: GeneratedComponent[]; components: GeneratedComponent[]; styles: string }
  backend: GeneratedComponent[]
} | null> {
  const frontend = await resolveCurrentCode(state)
  if (!frontend) return null

  const coderFiles = state.projectId
    ? await db.getProjectFiles(state.projectId, 'coder')
    : []

  const backend: GeneratedComponent[] = coderFiles
    .filter(f => ['service', 'api_route', 'config'].includes(f.file_type))
    .map(f => ({ path: f.file_path, content: f.content, description: f.description || '' }))

  return { frontend, backend }
}

/**
 * 判斷迭代範圍：純前端 or 全棧
 */
function classifyIterationScope(
  feedback: string,
  coderCompleted: boolean
): 'frontend' | 'fullstack' {
  if (!coderCompleted) return 'frontend'

  const lower = feedback.toLowerCase()
  const fullstackSignals = [
    // 功能級操作（跨層）
    '拿掉', '移除功能', '刪除功能', '去掉功能', '不要這個功能', '移除',
    'remove feature', 'delete feature', 'remove the',
    // 後端明確
    '驗證邏輯', '登入邏輯', '註冊邏輯', 'api邏輯', '後端邏輯',
    '修改api', '改api', '新增api', '刪除api',
    '資料庫', 'database', 'server action',
    '後端', 'backend',
  ]

  if (fullstackSignals.some(s => lower.includes(s))) return 'fullstack'

  // 長文本且包含「功能」→ 可能是功能級描述
  if (feedback.length >= 20 && lower.includes('功能')) return 'fullstack'

  return 'frontend'
}

/**
 * 推斷 coder 檔案類型
 */
function inferCoderFileType(path: string): string {
  if (path.startsWith('api/') || path.includes('/api/')) return 'api_route'
  if (path.startsWith('lib/') || path.startsWith('app/actions/')) return 'service'
  if (path === 'lib/db.ts') return 'config'
  if (path.includes('/page.')) return 'page'
  return 'component'
}

/**
 * 記錄迭代歷史摘要
 */
function recordIterationHistory(
  state: FlowState,
  feedback: string,
  filesChanged: string[]
) {
  if (!state.iterationHistory) {
    state.iterationHistory = []
  }
  state.iterationHistory.push({
    timestamp: Date.now(),
    feedback,
    filesChanged,
  })
  // 最多保留 20 條歷史
  if (state.iterationHistory.length > 20) {
    state.iterationHistory = state.iterationHistory.slice(-20)
  }
}

/**
 * 將文字轉為 token 集合（支援中英文混合）
 * 英文：按空格分詞；中文：字元 bigram（因為中文沒有空格分隔）
 */
function tokenize(text: string): Set<string> {
  const normalized = text.toLowerCase().replace(/[^\u4e00-\u9fff\w\s]/g, '')
  const tokens = new Set<string>()
  // 英文 word tokens
  for (const word of normalized.split(/\s+/)) {
    if (word.length > 1 && !/[\u4e00-\u9fff]/.test(word)) tokens.add(word)
  }
  // 中文 bigram tokens（「萬花筒」→ {萬花, 花筒}）
  const cjk = normalized.replace(/[^\u4e00-\u9fff]/g, '')
  for (let i = 0; i < cjk.length - 1; i++) {
    tokens.add(cjk.slice(i, i + 2))
  }
  return tokens
}

/**
 * 偵測重複抱怨：比較當前反饋與歷史，回傳連續相似次數（零 LLM）
 */
function detectRepeatedComplaint(
  currentFeedback: string,
  history: { feedback: string; filesChanged: string[] }[]
): number {
  if (!history.length) return 0
  const currentTokens = tokenize(currentFeedback)
  if (currentTokens.size === 0) return 0

  let count = 0
  for (let i = history.length - 1; i >= Math.max(0, history.length - 5); i--) {
    const pastTokens = tokenize(history[i].feedback)
    const intersection = [...currentTokens].filter(k => pastTokens.has(k)).length
    const minSize = Math.min(currentTokens.size, pastTokens.size)
    // overlap coefficient（intersection / min_size）比 Jaccard 更適合長短句比對
    if (minSize > 0 && intersection / minSize >= 0.35) count++
    else break
  }
  return count
}

// ============================================================
// 迭代修改
// ============================================================

export async function executeIteration(input: {
  conversationId: string
  projectId: string
  userId: string
  userFeedback: string
  redis: Redis
  io: SocketIOServer
  imageUrls?: string[]
}): Promise<void> {
  const { conversationId, projectId, userId, userFeedback, redis, io } = input
  const state = await getFlowState(redis, conversationId)
  if (!state) {
    await sendMessage(conversationId, io, {
      content: '找不到流程狀態，請重新開始。',
      stage: 'error',
    })
    return
  }

  // 0. 安全閥：迭代次數上限
  if ((state.iterationCount || 0) >= MAX_ITERATIONS_PER_SESSION) {
    const isChinese = state.locale !== 'en'
    await sendMessage(conversationId, io, {
      content: isChinese
        ? `已達到單次對話的迭代上限（${MAX_ITERATIONS_PER_SESSION} 次）。建議部署目前版本或開始新專案。`
        : `Reached iteration limit (${MAX_ITERATIONS_PER_SESSION}). Please deploy or start a new project.`,
      stage: 'info',
      quickReplies: [
        { label: isChinese ? '部署上線' : 'Deploy', value: '部署', style: 'primary' as const },
        { label: isChinese ? '開始新專案' : 'New Project', value: '__new_project__', style: 'ghost' as const },
      ],
    })
    return
  }

  // 1. 設定 iterating phase 防止並行訊息 + 保存反饋供重試
  state.phase = 'uiux_iterating'
  state.uiuxCodeGenerationStartedAt = Date.now()
  state.lastIterationFeedback = userFeedback
  state.lastIterationImageUrls = input.imageUrls
  await saveFlowState(redis, conversationId, state)

  // 保留原有快照，失敗/異常時恢復
  const previousSnapshot = state.uiuxPreIterationCode

  try {
    await sendMessage(conversationId, io, {
      content: '正在根據您的建議修改設計...',
      stage: 'uiux_iterating',
      progress: { current: 1, total: 2, step: '修改中' },
    })

    // 2. 取得現有代碼
    const currentCode = await resolveCurrentCode(state)

    if (!currentCode) {
      await sendMessage(conversationId, io, {
        content: '找不到可修改的代碼，請先完成設計生成。',
        stage: 'error',
      })
      state.phase = 'uiux_complete'
      state.uiuxCodeGenerationStartedAt = undefined
      await saveFlowState(redis, conversationId, state)
      return
    }

    // 2.5 建構 streaming callback（迭代時即時預覽）
    const tailwindConfig = state.uiuxDesignSystem
      ? generateTailwindConfig(state.uiuxDesignSystem)
      : ''
    const streamingCallback = buildStreamingHandler(
      makeStreamingCallback(conversationId, io, redis, 'iteration', tailwindConfig)
    )

    // 3. 準備反饋文字
    let enrichedFeedback = userFeedback
    if (state.fastMode && state.fastModeExpandedPrompt) {
      enrichedFeedback = `${userFeedback}\n\n[產品完整描述（用於理解上下文，不是修改指令）]\n${state.fastModeExpandedPrompt}`
    }

    // 偵測重複抱怨 → 策略升級
    const repeatCount = detectRepeatedComplaint(userFeedback, state.iterationHistory || [])
    let escalationTemperature: number | undefined

    if (repeatCount >= 1) {
      enrichedFeedback = `⚠️ 用戶已第 ${repeatCount + 1} 次反饋同樣問題。之前 ${repeatCount} 次修改都未解決。
你必須：
1. 回顧下方「迭代歷史」中之前修改了哪些檔案 — 這些修改顯然沒有解決問題
2. 排查「視覺問題診斷」清單每一條（SVG ID 衝突、z-index、overflow、SSR 水合）
3. 採取與之前完全不同的實作策略
4. 如果之前只是調參數（opacity/顏色/大小），這次必須檢查結構性問題（組件是否渲染、SVG 是否正確、ref 是否連接）

${enrichedFeedback}`
      escalationTemperature = 0.4
      logger.info({ repeatCount, conversationId }, '迭代重複抱怨偵測：策略升級')
    }

    const pid = state.projectId || projectId

    // 4. 判斷迭代範圍
    const scope = classifyIterationScope(userFeedback, !!state.coderCompleted)

    let updatedCode: { pages: GeneratedComponent[]; components: GeneratedComponent[]; styles: string }
    let changedFiles: string[]
    let deletedPaths: string[] | undefined

    if (scope === 'fullstack') {
      // ── 全棧迭代分支 ──
      const fullCode = await resolveFullStackCode(state)
      if (!fullCode || fullCode.backend.length === 0) {
        // 無後端代碼 → fallback 到前端迭代
        logger.info({ conversationId }, '全棧迭代 fallback：無後端代碼')
        // 下方走 frontend 分支
      } else {
        logger.info({ conversationId, backendFiles: fullCode.backend.length }, '啟動全棧迭代')
        const fsResult = await refineFullStackCode(
          { ...fullCode.frontend, backendFiles: fullCode.backend },
          enrichedFeedback,
          {
            designSystem: state.uiuxDesignSystem,
            designTier: state.uiuxDesignTier,
            designBrief: state.uiuxDesignBrief,
            variantConcept: state.uiuxVariantConcept,
            iterationHistory: state.iterationHistory,
            temperatureOverride: escalationTemperature,
          },
          { userId: state.userId || userId, conversationId, purpose: 'fullstack_refine' },
          input.imageUrls,
          streamingCallback
        )

        await redis.del(`streaming:preview:${conversationId}`).catch(() => {})

        if (!fsResult.success) {
          const isNoChange = fsResult.error && !fsResult.error.includes('未知錯誤')
          await sendMessage(conversationId, io, {
            content: isNoChange ? `${fsResult.error}` : `修改失敗：${fsResult.error || '未知錯誤，請稍後重試。'}`,
            stage: isNoChange ? 'info' : 'error',
            quickReplies: isNoChange
              ? [{ label: '部署上線', value: '部署', style: 'primary' as const }]
              : [
                  { label: '重試修改', value: '__retry_iteration__', style: 'primary' as const },
                  { label: '部署上線', value: '部署', style: 'secondary' as const },
                ],
          })
          state.uiuxPreIterationCode = previousSnapshot
          state.phase = 'uiux_complete'
          state.uiuxCodeGenerationStartedAt = undefined
          await saveFlowState(redis, conversationId, state)
          return
        }

        // 全棧成功 → 保存快照
        state.uiuxPreIterationCode = JSON.parse(JSON.stringify(currentCode))

        updatedCode = {
          pages: fsResult.pages || currentCode.pages,
          components: fsResult.components || currentCode.components,
          styles: fsResult.styles || currentCode.styles,
        }
        deletedPaths = fsResult.deletedPaths

        // 處理刪除
        if (deletedPaths?.length && pid) {
          await db.deleteProjectFilesByPaths(pid, deletedPaths)
          // 從 updatedCode 移除被刪除的檔案
          updatedCode.pages = updatedCode.pages.filter(p => !deletedPaths!.includes(p.path))
          updatedCode.components = updatedCode.components.filter(c => !deletedPaths!.includes(c.path))
        }

        // 儲存前端
        state.uiuxGeneratedCode = updatedCode
        if (pid) {
          await db.upsertProjectFiles(pid, 'uiux',
            generatedCodeToFileRows(updatedCode, state.uiuxDesignSystem))
        }

        // 儲存後端修改
        if (fsResult.backendFiles?.length && pid) {
          const backendRows = fsResult.backendFiles.map(f => ({
            filePath: f.path,
            content: f.content,
            description: f.description || '',
            fileType: inferCoderFileType(f.path),
          }))
          await db.upsertProjectFiles(pid, 'coder', backendRows)
        }

        // 快照代碼到 generation
        if (pid) {
          await snapshotCodeToGeneration(pid, {
            changeSummary: `迭代修改 #${(state.iterationCount || 0) + 1}`,
            conversationId: input.conversationId,
          })
        }

        // 記錄歷史
        changedFiles = [
          ...(fsResult.pages || []).map(p => p.path),
          ...(fsResult.components || []).map(c => c.path),
          ...(fsResult.backendFiles || []).map(f => f.path),
          ...(deletedPaths || []).map(p => `[deleted] ${p}`),
        ]
        state.iterationCount = (state.iterationCount || 0) + 1
        state.lastIterationFeedback = undefined
        state.lastIterationImageUrls = undefined
        recordIterationHistory(state, userFeedback, changedFiles)

        // 跳到預覽發送（下方共用邏輯）
        // updatedCode, changedFiles, deletedPaths 已設定
        // 繼續到 step 8
      }
    }

    // ── 前端迭代分支（scope === 'frontend' 或 fullstack fallback） ──
    if (!updatedCode!) {
      const result = await refineCode(
        currentCode,
        enrichedFeedback,
        {
          designSystem: state.uiuxDesignSystem,
          designTier: state.uiuxDesignTier,
          designBrief: state.uiuxDesignBrief,
          variantConcept: state.uiuxVariantConcept,
          moodId: state.uiuxDesignMood,
          iterationHistory: state.iterationHistory,
          temperatureOverride: escalationTemperature,
        },
        { userId: state.userId || userId, conversationId, purpose: 'uiux_refine' },
        input.imageUrls,
        streamingCallback
      )

      await redis.del(`streaming:preview:${conversationId}`).catch(() => {})

      if (!result.success || !result.pages) {
        const isNoChange = result.error && !result.error.includes('未知錯誤') && !result.error.includes('無法修改')
        await sendMessage(conversationId, io, {
          content: isNoChange
            ? `${result.error}`
            : `修改失敗：${result.error || '未知錯誤，請稍後重試。'}`,
          stage: isNoChange ? 'info' : 'error',
          quickReplies: isNoChange
            ? [{ label: '部署上線', value: '部署', style: 'primary' as const }]
            : [
                { label: '重試修改', value: '__retry_iteration__', style: 'primary' as const },
                { label: '部署上線', value: '部署', style: 'secondary' as const },
              ],
        })
        state.uiuxPreIterationCode = previousSnapshot
        state.phase = 'uiux_complete'
        state.uiuxCodeGenerationStartedAt = undefined
        await saveFlowState(redis, conversationId, state)
        return
      }

      state.uiuxPreIterationCode = JSON.parse(JSON.stringify(currentCode))

      updatedCode = {
        pages: result.pages,
        components: result.components || currentCode.components,
        styles: result.styles || currentCode.styles,
      }
      state.uiuxGeneratedCode = updatedCode
      state.iterationCount = (state.iterationCount || 0) + 1
      state.lastIterationFeedback = undefined
      state.lastIterationImageUrls = undefined

      changedFiles = result.pages.map(p => p.path)
      if (result.components) {
        changedFiles.push(...result.components.map(c => c.path))
      }
      if (result.styles && result.styles !== currentCode.styles) {
        changedFiles.push('app/globals.css')
      }
      recordIterationHistory(state, userFeedback, changedFiles!)

      if (pid) {
        await db.upsertProjectFiles(pid, 'uiux',
          generatedCodeToFileRows(updatedCode, state.uiuxDesignSystem))
        await snapshotCodeToGeneration(pid, {
          changeSummary: `迭代修改 #${state.iterationCount || 1}`,
          conversationId: input.conversationId,
        })
      }
    }

    // 8. 發送預覽（tailwindConfig 已在上方計算）
    // quickReplies：有迭代前快照時顯示撤銷按鈕
    const quickReplies: { label: string; value: string; style?: 'primary' | 'secondary' | 'ghost' }[] = [
      { label: '部署上線', value: '部署', style: 'primary' },
    ]
    if (state.uiuxPreIterationCode) {
      quickReplies.push({ label: '撤銷修改', value: '撤銷', style: 'ghost' })
    }

    const iterMsg = repeatCount >= 1
      ? `**設計已更新！** (第 ${state.iterationCount} 次迭代)\n\n本次針對重複問題進行了深層修復，請仔細確認效果。\n\n---\n\n輸入「**部署**」重新上線，或繼續提供修改建議。`
      : `**設計已更新！** (第 ${state.iterationCount} 次迭代)\n\n請在預覽面板查看修改效果。\n\n---\n\n輸入「**部署**」重新上線，或繼續提供修改建議。`

    // 取得 Coder 後端檔案供 WebContainer 預覽
    const coderFiles = pid ? await db.getProjectFiles(pid, 'coder') : []
    const serverActions = coderFiles.filter(f => f.file_path.startsWith('app/actions/')).map(f => ({ path: f.file_path, content: f.content, description: f.description || '' }))
    const apiRoutes = coderFiles.filter(f => f.file_path.startsWith('app/api/')).map(f => ({ path: f.file_path, content: f.content, description: f.description || '' }))
    const dbLib = coderFiles.filter(f => f.file_path.startsWith('lib/')).map(f => ({ path: f.file_path, content: f.content, description: f.description || '' }))

    // 查詢 Neon 連線字串，注入 WebContainer 預覽
    const neonRow = pid ? await db.queryOne<{ neon_connection_string: string | null }>(
      'SELECT neon_connection_string FROM projects WHERE id = $1', [pid]
    ) : null
    const neonConnectionString = neonRow?.neon_connection_string || undefined

    await sendMessage(conversationId, io, {
      content: iterMsg,
      stage: 'uiux_iteration_complete',
      layoutHint: 'split',
      richContent: {
        type: 'code_preview',
        data: {
          pages: updatedCode.pages,
          components: updatedCode.components,
          styles: updatedCode.styles,
          tailwindConfig,
          currentPhase: 'complete',
          ...(coderFiles.length > 0 ? { serverActions, apiRoutes, dbLib, hasServerActions: true, neonConnectionString } : {}),
        } as Record<string, unknown>,
      },
      quickReplies,
    })

    // 9. Credit 扣除：迭代修改額外成本（base 已在 handleContinueFlow 入口扣除）
    await deductCredits(userId, CREDIT_COSTS.ITERATION - CREDIT_COSTS.BASE_MESSAGE)

    // 10. 回到 uiux_complete 等待下一步
    state.phase = 'uiux_complete'
    state.uiuxCodePhase = 'complete'
    state.waitingForReply = false
    state.uiuxCodeGenerationStartedAt = undefined
    await saveFlowState(redis, conversationId, state)
  } catch (err) {
    logger.error({ err }, 'executeIteration 異常')
    await redis.del(`streaming:preview:${conversationId}`).catch(() => {})
    state.phase = 'uiux_complete'
    state.uiuxCodeGenerationStartedAt = undefined
    state.uiuxPreIterationCode = previousSnapshot
    await saveFlowState(redis, conversationId, state)

    await sendMessage(conversationId, io, {
      content: `修改過程發生異常：${err instanceof Error ? err.message : String(err)}\n\n請稍後再試，或嘗試其他描述方式。`,
      stage: 'error',
      quickReplies: [
        { label: '重試修改', value: '__retry_iteration__', style: 'primary' as const },
      ],
    })
  }
}

// ============================================================
// 撤銷上一次迭代
// ============================================================

export async function executeUndoIteration(input: {
  conversationId: string
  projectId: string
  redis: Redis
  io: SocketIOServer
}): Promise<void> {
  const { conversationId, projectId, redis, io } = input
  const state = await getFlowState(redis, conversationId)
  if (!state) {
    await sendMessage(conversationId, io, {
      content: '找不到流程狀態，請重新開始。',
      stage: 'error',
    })
    return
  }

  if (!state.uiuxPreIterationCode) {
    await sendMessage(conversationId, io, {
      content: '沒有可撤銷的修改記錄。',
      stage: 'info',
      quickReplies: [
        { label: '部署上線', value: '部署', style: 'primary' },
      ],
    })
    return
  }

  try {
    // 恢復代碼
    state.uiuxGeneratedCode = state.uiuxPreIterationCode
    state.uiuxPreIterationCode = undefined // 只能撤銷一步
    state.iterationCount = Math.max(0, (state.iterationCount || 1) - 1)
    state.iterationHistory?.pop()
    state.phase = 'uiux_complete'
    state.uiuxCodePhase = 'complete'

    // 同步到 project_files
    const pid = state.projectId || projectId
    if (pid && state.uiuxGeneratedCode) {
      await db.upsertProjectFiles(pid, 'uiux',
        generatedCodeToFileRows(state.uiuxGeneratedCode, state.uiuxDesignSystem))
      await snapshotCodeToGeneration(pid, {
        changeSummary: '撤銷迭代修改',
        conversationId,
      })
    }

    await saveFlowState(redis, conversationId, state)

    // 發送預覽
    const tailwindConfig = state.uiuxDesignSystem
      ? generateTailwindConfig(state.uiuxDesignSystem)
      : ''

    // 取得 Coder 後端檔案供 WebContainer 預覽
    const undoPid = state.projectId || projectId
    const undoCoderFiles = undoPid ? await db.getProjectFiles(undoPid, 'coder') : []
    const undoServerActions = undoCoderFiles.filter(f => f.file_path.startsWith('app/actions/')).map(f => ({ path: f.file_path, content: f.content, description: f.description || '' }))
    const undoApiRoutes = undoCoderFiles.filter(f => f.file_path.startsWith('app/api/')).map(f => ({ path: f.file_path, content: f.content, description: f.description || '' }))
    const undoDbLib = undoCoderFiles.filter(f => f.file_path.startsWith('lib/')).map(f => ({ path: f.file_path, content: f.content, description: f.description || '' }))

    // 查詢 Neon 連線字串
    const undoNeonRow = undoPid ? await db.queryOne<{ neon_connection_string: string | null }>(
      'SELECT neon_connection_string FROM projects WHERE id = $1', [undoPid]
    ) : null
    const undoNeonConnStr = undoNeonRow?.neon_connection_string || undefined

    await sendMessage(conversationId, io, {
      content: `**已撤銷上一次修改。**\n\n預覽已恢復到修改前的版本。\n\n---\n\n輸入「**部署**」上線，或繼續提供修改建議。`,
      stage: 'uiux_iteration_complete',
      layoutHint: 'split',
      richContent: {
        type: 'code_preview',
        data: {
          pages: state.uiuxGeneratedCode.pages,
          components: state.uiuxGeneratedCode.components,
          styles: state.uiuxGeneratedCode.styles,
          tailwindConfig,
          currentPhase: 'complete',
          ...(undoCoderFiles.length > 0 ? { serverActions: undoServerActions, apiRoutes: undoApiRoutes, dbLib: undoDbLib, hasServerActions: true, neonConnectionString: undoNeonConnStr } : {}),
        } as Record<string, unknown>,
      },
      quickReplies: [
        { label: '部署上線', value: '部署', style: 'primary' },
      ],
    })
  } catch (err) {
    logger.error({ err }, 'executeUndoIteration 異常')
    await sendMessage(conversationId, io, {
      content: `撤銷操作異常：${err instanceof Error ? err.message : String(err)}`,
      stage: 'error',
    })
  }
}

// ============================================================
// 查詢回滾歷史
// ============================================================

export async function executeRollbackQuery(input: {
  conversationId: string
  projectId: string
  redis: Redis
  io: SocketIOServer
}): Promise<void> {
  const { conversationId, projectId, redis, io } = input
  const state = await getFlowState(redis, conversationId)
  if (!state) {
    await sendMessage(conversationId, io, {
      content: '找不到流程狀態，請重新開始。',
      stage: 'error',
    })
    return
  }

  try {
    const pid = state.projectId || projectId

    // 查詢部署歷史
    const deployments = await listProjectDeployments(pid)

    if (deployments.length <= 1) {
      await sendMessage(conversationId, io, {
        content: '目前只有一個部署版本，無法回滾。',
        stage: 'info',
      })
      return
    }

    // 保存部署列表到 state，等待用戶選擇
    state.rollbackDeployments = deployments
    state.phase = 'deployer_rollback_select'
    await saveFlowState(redis, conversationId, state)

    // 格式化歷史列表
    const historyText = deployments.map((d, i) => {
      const date = new Date(d.created_at).toLocaleString('zh-TW')
      const label = i === 0 ? '（目前版本）' : ''
      return `${i + 1}. ${date} ${label}\n   ${d.url}`
    }).join('\n\n')

    await sendMessage(conversationId, io, {
      content: `**部署歷史**\n\n${historyText}\n\n---\n\n輸入版本編號回滾（如「2」表示回到第 2 個版本），或輸入「取消」。`,
      stage: 'deployer_rollback_select',
      richContent: {
        type: 'deployment_history',
        data: {
          deployments: deployments.map((d, i) => ({
            index: i + 1,
            id: d.id,
            vercelDeploymentId: d.vercel_deployment_id,
            url: d.url,
            createdAt: d.created_at,
            isCurrent: i === 0,
          })),
        } as Record<string, unknown>,
      },
    })
  } catch (err) {
    logger.error({ err }, 'executeRollbackQuery 異常')
    // 保持原 phase 不變（deployer_complete），讓用戶可重試
    await sendMessage(conversationId, io, {
      content: `查詢部署歷史失敗：${err instanceof Error ? err.message : String(err)}\n\n請稍後再試。`,
      stage: 'error',
    })
  }
}

// ============================================================
// 處理回滾選擇
// ============================================================

export async function executeRollbackSelection(input: {
  conversationId: string
  projectId: string
  userMessage: string
  redis: Redis
  io: SocketIOServer
}): Promise<void> {
  const { conversationId, projectId, userMessage, redis, io } = input
  const state = await getFlowState(redis, conversationId)
  if (!state) {
    await sendMessage(conversationId, io, {
      content: '找不到流程狀態，請重新開始。',
      stage: 'error',
    })
    return
  }

  try {
    const cancelKeywords = ['取消', 'cancel', '算了']
    if (cancelKeywords.some(kw => userMessage.includes(kw))) {
      state.phase = 'deployer_complete'
      state.rollbackDeployments = undefined
      await saveFlowState(redis, conversationId, state)
      await sendMessage(conversationId, io, {
        content: '已取消回滾。',
        stage: 'info',
      })
      return
    }

    // 解析版本編號
    const numMatch = userMessage.match(/(\d+)/)
    if (!numMatch) {
      await sendMessage(conversationId, io, {
        content: '請輸入版本編號（如「2」），或輸入「取消」返回。',
        stage: 'info',
      })
      return
    }

    const index = parseInt(numMatch[1]) - 1
    const deployments = state.rollbackDeployments || []
    if (index < 0 || index >= deployments.length) {
      await sendMessage(conversationId, io, {
        content: `請輸入 1 到 ${deployments.length} 之間的版本編號，或輸入「取消」返回。`,
        stage: 'info',
      })
      return
    }

    if (index === 0) {
      await sendMessage(conversationId, io, {
        content: '版本 1 就是目前的版本，無需回滾。請選擇其他版本，或輸入「取消」返回。',
        stage: 'info',
      })
      return
    }

    const target = deployments[index]

    await sendMessage(conversationId, io, {
      content: `正在回滾到版本 ${index + 1}...`,
      stage: 'deployer_rolling_back',
      progress: { current: 1, total: 2, step: '回滾中' },
    })

    // 取得 project name（使用 deployer 的 toVercelSlug 確保一致）
    const project = await db.getProject(state.projectId || projectId)
    const projectName = toVercelSlug(project?.name || '', state.projectId || projectId)

    const result = await rollbackToDeployment(projectName, target.vercel_deployment_id)

    if (result.success) {
      // 記錄回滾到 DB
      await db.query(
        `INSERT INTO deployments (project_id, vercel_deployment_id, url, status)
         VALUES ($1, $2, $3, 'success')`,
        [state.projectId || projectId, target.vercel_deployment_id, target.url]
      )

      state.phase = 'deployer_complete'
      state.rollbackDeployments = undefined
      await saveFlowState(redis, conversationId, state)

      await sendMessage(conversationId, io, {
        content: `**回滾成功！**\n\n已恢復到版本 ${index + 1}：${target.url}\n\n---\n\n直接輸入修改建議即可迭代設計\n輸入「**回滾**」可再次查看部署歷史`,
        stage: 'deployer_complete',
        richContent: {
          type: 'deploy_result',
          data: {
            deploymentUrl: target.url,
            success: true,
          } as Record<string, unknown>,
        },
      })
    } else {
      state.phase = 'deployer_complete'
      state.rollbackDeployments = undefined
      await saveFlowState(redis, conversationId, state)

      await sendMessage(conversationId, io, {
        content: `**回滾失敗**\n\n${result.error}\n\n請稍後再試，或輸入修改建議直接修改設計。`,
        stage: 'deployer_error',
      })
    }
  } catch (err) {
    logger.error({ err }, 'executeRollbackSelection 異常')
    state.phase = 'deployer_complete'
    state.rollbackDeployments = undefined
    await saveFlowState(redis, conversationId, state)

    await sendMessage(conversationId, io, {
      content: `回滾操作異常：${err instanceof Error ? err.message : String(err)}\n\n請稍後再試。`,
      stage: 'error',
    })
  }
}
