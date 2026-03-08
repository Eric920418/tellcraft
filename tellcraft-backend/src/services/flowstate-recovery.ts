// ============================================================
// FlowState 超時自動恢復（定時掃描）
// ============================================================
//
// 每 2 分鐘掃描所有 flow:* Redis keys，找出卡在「生成中」phase 超時的對話，
// 自動恢復 + 透過 sendMessage() 推送通知（Web Socket.io + LINE pushMessage）。
//
// 覆蓋的 phase + 超時閾值：
//   prd_discovery       5 min  →  刪除 FlowState + 提示重新描述
//   fast_generating     20 min →  有代碼 → uiux_complete；無代碼 → idle
//   uiux_iterating      5 min  →  uiux_complete
//   uiux_code_generation 10 min →  三層恢復（有完成代碼/有中途代碼/無代碼）
//   uiux_quality_gate   10 min →  同上
//   deployer_deploying  10 min →  deployer_failed
// ============================================================

import Redis from 'ioredis'
import { Server as SocketIOServer } from 'socket.io'
import { saveFlowState, deleteFlowState, sendMessage, hasRecentFlowActivity } from '../workers/orchestrator-utils'
import { forceReleaseConversationLock } from './conversation-lock'
import { generateTailwindConfig } from './uiux-generation'
import type { FlowState } from '../types/flow-state'
import { createLogger } from '../lib/logger'

const logger = createLogger('flowstate-recovery')

// 超時閾值（毫秒）
const PRD_DISCOVERY_TIMEOUT_MS = 5 * 60 * 1000
const FAST_BUILD_TIMEOUT_MS = 20 * 60 * 1000
const FAST_BUILD_RWD_TIMEOUT_MS = 35 * 60 * 1000
const ITERATION_TIMEOUT_MS = 5 * 60 * 1000
const CODE_GENERATION_TIMEOUT_MS = 20 * 60 * 1000
const QUALITY_GATE_TIMEOUT_MS = 10 * 60 * 1000
const DEPLOYER_TIMEOUT_MS = 10 * 60 * 1000

// 需要掃描的 phase → 超時閾值
const RECOVERABLE_PHASES: Record<string, number> = {
  prd_discovery: PRD_DISCOVERY_TIMEOUT_MS,
  fast_generating: FAST_BUILD_TIMEOUT_MS,
  uiux_iterating: ITERATION_TIMEOUT_MS,
  uiux_code_generation: CODE_GENERATION_TIMEOUT_MS,
  uiux_quality_gate: QUALITY_GATE_TIMEOUT_MS,
  deployer_deploying: DEPLOYER_TIMEOUT_MS,
}

function getPhaseTimeoutMs(state: FlowState): number | undefined {
  const baseTimeout = RECOVERABLE_PHASES[state.phase]
  if (!baseTimeout) return undefined

  // RWD 階段輸出通常最大，給更寬鬆的恢復窗口，避免誤判活躍生成為超時。
  if (state.phase === 'fast_generating' && state.uiuxCodePhase === 'rwd') {
    return FAST_BUILD_RWD_TIMEOUT_MS
  }

  return baseTimeout
}

/**
 * 定時掃描所有 FlowState，偵測超時的「生成中」phase 並自動恢復 + 推送通知。
 * sendMessage() 已整合 DB 寫入 + Socket.io emit + LINE pushMessage，無需額外處理。
 */
export async function scanAndRecoverStuckFlowStates(
  redis: Redis,
  io: SocketIOServer
): Promise<void> {
  let recovered = 0
  let totalScanned = 0

  const stream = redis.scanStream({ match: 'flow:*', count: 100 })

  for await (const keys of stream as AsyncIterable<string[]>) {
    totalScanned += keys.length
    for (const key of keys) {
    try {
      const conversationId = key.replace('flow:', '')
      const stateJson = await redis.get(key)
      if (!stateJson) continue

      const state = JSON.parse(stateJson) as FlowState

      // 跳過等待用戶回覆的 phase
      if (state.waitingForReply) continue

      // 檢查是否是可恢復的 phase
      const timeoutMs = getPhaseTimeoutMs(state)
      if (!timeoutMs) continue

      // 檢查是否超時（startedAt === 0 代表時間戳遺失，視為超時）
      const startedAt = state.phase === 'prd_discovery'
        ? (state.prdDiscoveryStartedAt || 0)
        : (state.uiuxCodeGenerationStartedAt || 0)
      if (startedAt > 0 && Date.now() - startedAt <= timeoutMs) continue

      // 生成類 phase 先檢查近期活動心跳，避免活躍串流被誤判為超時。
      if (
        state.phase === 'fast_generating' ||
        state.phase === 'uiux_iterating' ||
        state.phase === 'uiux_code_generation' ||
        state.phase === 'uiux_quality_gate'
      ) {
        const hasRecentActivity = await hasRecentFlowActivity(redis, conversationId)
        if (hasRecentActivity) continue
      }

      logger.warn({
        conversationId,
        phase: state.phase,
        codePhase: state.uiuxCodePhase,
        timeoutSec: Math.round(timeoutMs / 1000),
        startedAt: startedAt ? new Date(startedAt).toISOString() : 'none',
        elapsedSec: startedAt ? Math.round((Date.now() - startedAt) / 1000) : undefined,
      }, '偵測到超時')

      await recoverFlowState(redis, io, conversationId, state)
      // 強制釋放 conversation lock，讓後續訊息能正常處理
      const released = await forceReleaseConversationLock(redis, conversationId)
      if (released) {
        logger.info({ conversationId }, '強制釋放 conversation lock')
      }
      recovered++
      } catch (err) {
        logger.error({ err, key }, '處理時錯誤')
      }
    }
  }

  if (recovered > 0) {
    logger.info({ scanned: totalScanned, recovered }, '掃描完成')
  }
}

// ============================================================
// 各 phase 恢復邏輯（複製自 orchestrator.ts handleContinueFlow 的超時處理）
// ============================================================

async function recoverFlowState(
  redis: Redis,
  io: SocketIOServer,
  conversationId: string,
  state: FlowState
): Promise<void> {
  switch (state.phase) {
    case 'prd_discovery':
      await recoverPrdDiscovery(redis, io, conversationId, state)
      break
    case 'fast_generating':
      await recoverFastGenerating(redis, io, conversationId, state)
      break
    case 'uiux_iterating':
      await recoverUiuxIterating(redis, io, conversationId, state)
      break
    case 'uiux_code_generation':
    case 'uiux_quality_gate':
      await recoverCodeGeneration(redis, io, conversationId, state)
      break
    case 'deployer_deploying':
      await recoverDeployer(redis, io, conversationId, state)
      break
  }
}

/**
 * prd_discovery 恢復：刪除 FlowState + 提示重新描述
 * PRD Discovery 是初始階段，沒有可恢復的中途進度，直接重來最乾淨
 */
async function recoverPrdDiscovery(
  redis: Redis, io: SocketIOServer, conversationId: string, state: FlowState
) {
  await deleteFlowState(redis, conversationId)

  const isChinese = state.locale !== 'en'
  await sendMessage(conversationId, io, {
    content: isChinese
      ? '需求分析中斷了，請重新描述您的需求。'
      : 'Requirements analysis was interrupted. Please describe your requirements again.',
    stage: 'error',
  })
}

/**
 * fast_generating 恢復（對應 orchestrator.ts L1316-1366）
 * 有代碼 → uiux_complete + code_preview；無代碼 → idle + 提示重新描述
 */
async function recoverFastGenerating(
  redis: Redis, io: SocketIOServer, conversationId: string, state: FlowState
) {
  const isChinese = state.locale !== 'en'
  const hasRecentActivity = await hasRecentFlowActivity(redis, conversationId)
  if (hasRecentActivity) {
    logger.info({ conversationId }, 'Fast Build 仍有活動心跳，跳過恢復')
    return
  }

  const hasCode = state.uiuxGeneratedCode &&
    (state.uiuxGeneratedCode.pages.length > 0 || state.uiuxGeneratedCode.components.length > 0)

  if (hasCode) {
    state.phase = 'uiux_complete'
    state.uiuxCodePhase = 'complete'
    state.uiuxCodeGenerationStartedAt = undefined
    state.waitingForReply = false
    await saveFlowState(redis, conversationId, state)

    const pageCount = state.uiuxGeneratedCode!.pages.length
    const compCount = state.uiuxGeneratedCode!.components.length
    const twConfig = state.uiuxDesignSystem ? generateTailwindConfig(state.uiuxDesignSystem) : ''

    await sendMessage(conversationId, io, {
      content: isChinese
        ? `快速生成中斷了，但已恢復之前的進度（${pageCount} 個頁面、${compCount} 個組件）。\n\n你可以：\n- 輸入「**部署**」部署現有代碼\n- 或描述想調整的地方`
        : `Generation was interrupted, but progress has been recovered (${pageCount} pages, ${compCount} components).\n\nYou can:\n- Type "**Deploy**" to deploy the current code\n- Or describe what you'd like to adjust`,
      stage: 'uiux_complete',
      layoutHint: 'split',
      richContent: {
        type: 'code_preview',
        data: {
          pages: state.uiuxGeneratedCode!.pages,
          components: state.uiuxGeneratedCode!.components,
          styles: state.uiuxGeneratedCode!.styles,
          tailwindConfig: twConfig,
          currentPhase: 'complete',
        } as Record<string, unknown>,
      },
      quickReplies: [
        { label: isChinese ? '部署上線' : 'Deploy', value: '部署', style: 'primary' },
      ],
    })
  } else {
    await deleteFlowState(redis, conversationId)

    await sendMessage(conversationId, io, {
      content: isChinese
        ? '快速生成中斷了，請重新描述你想要什麼樣的網站。'
        : 'Generation was interrupted. Please describe what kind of website you want.',
      stage: 'error',
    })
  }
}

/**
 * uiux_iterating 恢復（對應 orchestrator.ts L1369-1383）
 * → uiux_complete + 提示重新描述修改
 */
async function recoverUiuxIterating(
  redis: Redis, io: SocketIOServer, conversationId: string, state: FlowState
) {
  const isChinese = state.locale !== 'en'
  state.phase = 'uiux_complete'
  state.uiuxCodeGenerationStartedAt = undefined
  await saveFlowState(redis, conversationId, state)

  await sendMessage(conversationId, io, {
    content: isChinese
      ? '修改中斷了，請重新描述你想調整的內容。'
      : 'Modification was interrupted. Please describe what you want to adjust.',
    stage: 'uiux_complete',
  })
}

/**
 * uiux_code_generation / uiux_quality_gate 恢復（對應 orchestrator.ts L1438-1501）
 * 三層恢復：已完成 → uiux_complete；有中途代碼 → uiux_complete（保留部分代碼）；無代碼 → 回到變體選擇
 *
 * 注意：定時掃描不重啟管線（避免併發風險），只恢復到穩定狀態讓用戶操作。
 */
async function recoverCodeGeneration(
  redis: Redis, io: SocketIOServer, conversationId: string, state: FlowState
) {
  const hasCode = state.uiuxGeneratedCode &&
    (state.uiuxGeneratedCode.pages.length > 0 || state.uiuxGeneratedCode.components.length > 0)
  const resumePhase = state.uiuxCodePhase || 'structure'

  if (hasCode && resumePhase === 'complete') {
    // 所有階段都完成了但沒走到最後收尾
    state.phase = 'uiux_complete'
    state.uiuxCodePhase = 'complete'
    state.uiuxCodeGenerationStartedAt = undefined
    state.waitingForReply = false
    await saveFlowState(redis, conversationId, state)

    await sendMessage(conversationId, io, {
      content: '代碼生成已恢復完成！\n\n你可以：\n- 輸入「**部署**」部署上線\n- 或描述想調整的地方，我來修改',
      stage: 'uiux_complete',
    })
  } else if (hasCode) {
    // 有中途代碼 → 保留現有代碼進入 uiux_complete
    state.phase = 'uiux_complete'
    state.uiuxCodePhase = 'complete'
    state.uiuxCodeGenerationStartedAt = undefined
    state.waitingForReply = false
    await saveFlowState(redis, conversationId, state)

    const pageCount = state.uiuxGeneratedCode!.pages.length
    const compCount = state.uiuxGeneratedCode!.components.length
    const twConfig = state.uiuxDesignSystem ? generateTailwindConfig(state.uiuxDesignSystem) : ''

    await sendMessage(conversationId, io, {
      content: `代碼生成被中斷了，已恢復已完成的部分（${pageCount} 個頁面、${compCount} 個組件）。\n\n你可以：\n- 輸入「**部署**」部署現有代碼\n- 或描述想調整的地方`,
      stage: 'uiux_complete',
      layoutHint: 'split',
      richContent: {
        type: 'code_preview',
        data: {
          pages: state.uiuxGeneratedCode!.pages,
          components: state.uiuxGeneratedCode!.components,
          styles: state.uiuxGeneratedCode!.styles,
          tailwindConfig: twConfig,
          currentPhase: 'complete',
        } as Record<string, unknown>,
      },
      quickReplies: [
        { label: '部署上線', value: '部署', style: 'primary' },
      ],
    })
  } else {
    // 沒有存檔 → 回到變體選擇重新生成
    state.phase = 'uiux_variant_selection'
    state.uiuxCodePhase = undefined
    state.uiuxCodeGenerationStartedAt = undefined
    state.waitingForReply = true
    await saveFlowState(redis, conversationId, state)

    await sendMessage(conversationId, io, {
      content: '代碼生成被中斷了（可能因為伺服器重啟）。請重新選擇設計方案以繼續。\n\n例如輸入「選擇 E」重新開始。',
      stage: 'uiux_variants_ready',
    })
  }
}

/**
 * deployer_deploying 恢復
 * → deployer_failed + 提示重試或返回修改
 */
async function recoverDeployer(
  redis: Redis, io: SocketIOServer, conversationId: string, state: FlowState
) {
  state.phase = 'deployer_failed'
  state.uiuxCodeGenerationStartedAt = undefined
  await saveFlowState(redis, conversationId, state)

  await sendMessage(conversationId, io, {
    content: '**部署中斷了**（可能因為伺服器重啟）\n\n輸入「**部署**」可重新嘗試，或「**返回修改**」回到設計修改。',
    stage: 'deployer_error',
    richContent: {
      type: 'deploy_result',
      data: {
        error: '部署過程被中斷（伺服器重啟）',
        success: false,
      } as Record<string, unknown>,
    },
    quickReplies: [
      { label: '重試部署', value: '部署', style: 'primary' },
      { label: '返回修改', value: '返回修改', style: 'secondary' },
    ],
  })
}
