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
import { forceReleaseConversationLock, forceReleaseUserActiveLock } from './conversation-lock'
import { generateTailwindConfig } from './uiux-generation'
import type { FlowState } from '../types/flow-state'
import { createLogger } from '../lib/logger'

const logger = createLogger('flowstate-recovery')

// 超時閾值（毫秒）
const PRD_DISCOVERY_TIMEOUT_MS = 5 * 60 * 1000
const FAST_BUILD_TIMEOUT_MS = 25 * 60 * 1000
const FAST_BUILD_RWD_TIMEOUT_MS = 35 * 60 * 1000
const ITERATION_TIMEOUT_MS = 5 * 60 * 1000
const CODE_GENERATION_TIMEOUT_MS = 20 * 60 * 1000
const QUALITY_GATE_TIMEOUT_MS = 10 * 60 * 1000
const DEPLOYER_TIMEOUT_MS = 10 * 60 * 1000
const DOMAIN_SEARCHING_TIMEOUT_MS = 3 * 60 * 1000
const DOMAIN_REGISTERING_TIMEOUT_MS = 10 * 60 * 1000
const DOMAIN_DNS_VERIFYING_TIMEOUT_MS = 5 * 60 * 1000
const CODER_GENERATING_TIMEOUT_MS = 15 * 60 * 1000
const CODER_TESTING_TIMEOUT_MS = 20 * 60 * 1000
const CLONE_ANALYZING_TIMEOUT_MS = 5 * 60 * 1000
const CLONE_GENERATING_TIMEOUT_MS = 20 * 60 * 1000

// 需要掃描的 phase → 超時閾值
const RECOVERABLE_PHASES: Record<string, number> = {
  prd_discovery: PRD_DISCOVERY_TIMEOUT_MS,
  fast_generating: FAST_BUILD_TIMEOUT_MS,
  uiux_iterating: ITERATION_TIMEOUT_MS,
  uiux_code_generation: CODE_GENERATION_TIMEOUT_MS,
  uiux_quality_gate: QUALITY_GATE_TIMEOUT_MS,
  deployer_deploying: DEPLOYER_TIMEOUT_MS,
  domain_searching: DOMAIN_SEARCHING_TIMEOUT_MS,
  domain_registering: DOMAIN_REGISTERING_TIMEOUT_MS,
  domain_dns_verifying: DOMAIN_DNS_VERIFYING_TIMEOUT_MS,
  coder_generating: CODER_GENERATING_TIMEOUT_MS,
  coder_testing: CODER_TESTING_TIMEOUT_MS,
  clone_analyzing: CLONE_ANALYZING_TIMEOUT_MS,
  clone_generating: CLONE_GENERATING_TIMEOUT_MS,
}

function getPhaseTimeoutMs(state: FlowState): number | undefined {
  const baseTimeout = RECOVERABLE_PHASES[state.phase]
  if (!baseTimeout) return undefined

  // RWD 階段輸出通常最大，給更寬鬆的恢復窗口，避免誤判活躍生成為超時。
  if (state.uiuxCodePhase === 'rwd' && (state.phase === 'fast_generating' || state.phase === 'uiux_code_generation')) {
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
        : state.phase === 'domain_registering' || state.phase === 'domain_searching' || state.phase === 'domain_dns_verifying'
        ? (state.domainRegistrationStartedAt || 0)
        : state.phase === 'coder_generating'
        ? (state.coderGenerationStartedAt || 0)
        : state.phase === 'coder_testing'
        ? (state.coderTestStartedAt || 0)
        : state.phase === 'clone_analyzing'
        ? (state.cloneAnalyzingStartedAt || 0)
        : state.phase === 'clone_generating'
        ? (state.cloneGeneratingStartedAt || 0)
        : (state.uiuxCodeGenerationStartedAt || 0)

      // 早期恢復：lock 不存在 = Worker 已死，縮短等待至 5 分鐘（取代完整超時）
      const lockExists = (await redis.exists(`conv-lock:${conversationId}`)) === 1
      const effectiveTimeoutMs = !lockExists ? 5 * 60 * 1000 : timeoutMs

      if (startedAt > 0 && Date.now() - startedAt <= effectiveTimeoutMs) continue

      // 生成類 phase 先檢查近期活動心跳，避免活躍串流被誤判為超時。
      if (
        state.phase === 'fast_generating' ||
        state.phase === 'uiux_iterating' ||
        state.phase === 'uiux_code_generation' ||
        state.phase === 'uiux_quality_gate' ||
        state.phase === 'coder_generating' ||
        state.phase === 'coder_testing' ||
        state.phase === 'clone_generating'
      ) {
        const hasRecentActivity = await hasRecentFlowActivity(redis, conversationId)
        if (hasRecentActivity) continue
      }

      logger.warn({
        conversationId,
        phase: state.phase,
        codePhase: state.uiuxCodePhase,
        timeoutSec: Math.round(effectiveTimeoutMs / 1000),
        baseTimeoutSec: Math.round(timeoutMs / 1000),
        lockExists,
        startedAt: startedAt ? new Date(startedAt).toISOString() : 'none',
        elapsedSec: startedAt ? Math.round((Date.now() - startedAt) / 1000) : undefined,
      }, '偵測到超時')

      await recoverFlowState(redis, io, conversationId, state)
      // 強制釋放 conversation lock，讓後續訊息能正常處理
      const released = await forceReleaseConversationLock(redis, conversationId)
      if (released) {
        logger.info({ conversationId }, '強制釋放 conversation lock')
      }
      // 同時釋放 user-active lock
      if (state.userId) {
        await forceReleaseUserActiveLock(redis, state.userId).catch(() => {})
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

  // 清理孤立 conv-lock（waitingForReply=true 但 lock 未釋放）
  await scanAndCleanOrphanedLocks(redis)
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
    case 'domain_searching':
      await recoverDomainSearching(redis, io, conversationId, state)
      break
    case 'domain_registering':
      await recoverDomainRegistering(redis, io, conversationId, state)
      break
    case 'domain_dns_verifying':
      await recoverDomainDnsVerifying(redis, io, conversationId, state)
      break
    case 'coder_generating':
      await recoverCoderGenerating(redis, io, conversationId, state)
      break
    case 'coder_testing':
      await recoverCoderTesting(redis, io, conversationId, state)
      break
    case 'clone_analyzing':
      await recoverCloneAnalyzing(redis, io, conversationId, state)
      break
    case 'clone_generating':
      await recoverCloneGenerating(redis, io, conversationId, state)
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
  const codePhase = state.uiuxCodePhase || 'structure'

  if (hasCode && (codePhase === 'animation' || codePhase === 'rwd')) {
    // 中間態：有部分代碼，animation/rwd 未完成 → 暫停讓用戶選擇繼續或部署
    state.waitingForReply = true
    state.fastBuildStage = 'awaiting_continue'
    state.uiuxCodeGenerationStartedAt = undefined
    await saveFlowState(redis, conversationId, state)

    const pageCount = state.uiuxGeneratedCode!.pages.length
    const compCount = state.uiuxGeneratedCode!.components.length
    const twConfig = state.uiuxDesignSystem ? generateTailwindConfig(state.uiuxDesignSystem) : ''
    const phaseLabel = codePhase === 'animation'
      ? (isChinese ? '動畫' : 'animation')
      : (isChinese ? '響應式' : 'responsive')

    await sendMessage(conversationId, io, {
      content: isChinese
        ? `快速生成在${phaseLabel}階段中斷了，已保留之前的進度（${pageCount} 個頁面、${compCount} 個組件）。\n\n你可以：`
        : `Generation was interrupted during ${phaseLabel} phase. Progress saved (${pageCount} pages, ${compCount} components).\n\nYou can:`,
      stage: 'fast_generating',
      layoutHint: 'split',
      richContent: {
        type: 'code_preview',
        data: {
          pages: state.uiuxGeneratedCode!.pages,
          components: state.uiuxGeneratedCode!.components,
          styles: state.uiuxGeneratedCode!.styles,
          tailwindConfig: twConfig,
          currentPhase: codePhase,
        } as Record<string, unknown>,
      },
      quickReplies: [
        { label: isChinese ? '繼續完成' : 'Continue', value: '__resume_fast_build_pipeline__', style: 'primary' },
        { label: isChinese ? '就這樣，部署' : 'Deploy as-is', value: '__finish_fast_build__', style: 'secondary' },
      ],
    })
  } else if (hasCode) {
    // 有完整代碼（structure 完成或 complete 階段）→ 直接跳 uiux_complete
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
        ? '快速生成被中斷了（伺服器重啟），請重新描述你想要什麼樣的網站。'
        : 'Generation was interrupted (server restart). Please describe what kind of website you want.',
      stage: 'error',
      quickReplies: [
        { label: isChinese ? '重新開始' : 'Start over', value: '__new_project__', style: 'primary' },
      ],
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
/**
 * 掃描並清理孤立的 conv-lock：
 * 1. FlowState 不存在 → orphaned lock → 刪除
 * 2. FlowState 存在且 waitingForReply=true → job 已完成但 lock 未釋放 → 刪除
 * 3. waitingForReply=false → Worker 可能仍在執行，skip（由 RECOVERABLE_PHASES 機制處理）
 *
 * elapsed < 60s 跳過保護：避免誤刪剛 acquire 的合法鎖
 */
async function scanAndCleanOrphanedLocks(redis: Redis): Promise<void> {
  const LOCK_TTL_SECONDS = 2100
  let cleaned = 0
  let totalScanned = 0

  const stream = redis.scanStream({ match: 'conv-lock:*', count: 100 })

  for await (const keys of stream as AsyncIterable<string[]>) {
    totalScanned += keys.length
    for (const key of keys) {
      try {
        const conversationId = key.replace('conv-lock:', '')

        // TTL 保護：跳過太新的鎖（可能是剛 acquire 的合法鎖）
        const ttl = await redis.ttl(key)
        if (ttl < 0) continue  // -2=key消失(已正常釋放), -1=無TTL(異常但別動)
        const elapsedSec = LOCK_TTL_SECONDS - ttl
        if (elapsedSec < 60) continue

        const stateJson = await redis.get(`flow:${conversationId}`)

        if (!stateJson) {
          // 孤立鎖：無對應 FlowState
          const released = await forceReleaseConversationLock(redis, conversationId)
          if (released) {
            logger.warn({ conversationId, elapsedSec }, '清理孤立 lock（無 FlowState）')
            cleaned++
          }
          continue
        }

        const state = JSON.parse(stateJson) as FlowState
        if (state.waitingForReply) {
          // Job 已完成（設了 waitingForReply=true）但 lock 未釋放 → 程序崩潰
          const released = await forceReleaseConversationLock(redis, conversationId)
          if (released) {
            logger.warn({ conversationId, phase: state.phase, elapsedSec },
              '清理孤立 lock（waitingForReply=true 但 lock 未釋放）')
            cleaned++
          }
          // 同時釋放 user-active lock
          if (state.userId) {
            await forceReleaseUserActiveLock(redis, state.userId).catch(() => {})
          }
        }
        // waitingForReply=false：Worker 可能仍在執行，交由 RECOVERABLE_PHASES 處理
      } catch (err) {
        logger.error({ err, key }, '清理孤立 lock 時錯誤')
      }
    }
  }

  if (cleaned > 0) {
    logger.info({ scanned: totalScanned, cleaned }, '孤立 lock 清理完成')
  }
}

async function recoverDomainSearching(
  redis: Redis, io: SocketIOServer, conversationId: string, state: FlowState
) {
  await deleteFlowState(redis, conversationId)
  const isChinese = state.locale !== 'en'
  await sendMessage(conversationId, io, {
    content: isChinese
      ? '域名查詢逾時了，請重新輸入您想查詢的域名。'
      : 'Domain search timed out. Please enter the domain you want to check again.',
    stage: 'error',
  })
}

async function recoverDomainRegistering(
  redis: Redis, io: SocketIOServer, conversationId: string, state: FlowState
) {
  const isChinese = state.locale !== 'en'
  state.phase = 'domain_failed'
  state.waitingForReply = true
  state.domainRegistrationStartedAt = undefined
  await saveFlowState(redis, conversationId, state)

  const completedSteps = state.domainCompletedSteps || []
  await sendMessage(conversationId, io, {
    content: isChinese
      ? `域名註冊流程中斷了（已完成步驟：${completedSteps.length}）。\n\n您可以重試或放棄。`
      : `Domain registration was interrupted (${completedSteps.length} steps completed).\n\nYou can retry or cancel.`,
    stage: 'error',
    quickReplies: [
      { label: isChinese ? '重試' : 'Retry', value: '__retry_domain__', style: 'primary' },
      { label: isChinese ? '放棄' : 'Cancel', value: '__cancel_domain__', style: 'ghost' },
    ],
  })
}

async function recoverDomainDnsVerifying(
  redis: Redis, io: SocketIOServer, conversationId: string, state: FlowState
) {
  const isChinese = state.locale !== 'en'
  state.phase = 'domain_own_setup'
  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)

  await sendMessage(conversationId, io, {
    content: isChinese
      ? 'DNS 驗證逾時了。請確認 DNS 記錄已正確設定，然後再次告訴我「設定好了」。'
      : 'DNS verification timed out. Please verify your DNS records are correct and tell me "done" to try again.',
    stage: 'domain_own_setup',
    quickReplies: [
      { label: isChinese ? '設定好了' : 'Done', value: isChinese ? '設定好了' : 'done', style: 'primary' },
      { label: isChinese ? '取消' : 'Cancel', value: '__cancel_domain__', style: 'ghost' },
    ],
  })
}

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

/**
 * coder_generating 恢復：回退到 uiux_complete + 恢復快照
 */
async function recoverCoderGenerating(
  redis: Redis, io: SocketIOServer, conversationId: string, state: FlowState
) {
  const isChinese = state.locale !== 'en'

  if (state.coderPreRewriteCode) {
    state.uiuxGeneratedCode = state.coderPreRewriteCode
  }
  state.phase = 'uiux_complete'
  state.coderGenerationStartedAt = undefined
  state.waitingForReply = false
  await saveFlowState(redis, conversationId, state)

  await sendMessage(conversationId, io, {
    content: isChinese
      ? '後端代碼生成中斷了。您可以重試「生成後端」或直接部署現有前端。'
      : 'Backend code generation was interrupted. You can retry or deploy existing frontend.',
    stage: 'uiux_complete',
    quickReplies: [
      { label: isChinese ? '重試' : 'Retry', value: '__connect_database__', style: 'primary' },
      { label: isChinese ? '直接部署' : 'Deploy as-is', value: '部署', style: 'secondary' },
    ],
  })
}

async function recoverCoderTesting(
  redis: Redis, io: SocketIOServer, conversationId: string, state: FlowState
) {
  const isChinese = state.locale !== 'en'

  state.phase = 'uiux_complete'
  state.coderTestStartedAt = undefined
  state.waitingForReply = false
  await saveFlowState(redis, conversationId, state)

  await sendMessage(conversationId, io, {
    content: isChinese
      ? '測試執行中斷了。您可以重試測試或直接部署。'
      : 'Test execution was interrupted. You can retry or deploy as-is.',
    stage: 'uiux_complete',
    quickReplies: [
      { label: isChinese ? '重試測試' : 'Retry Tests', value: '__verify_backend__', style: 'primary' },
      { label: isChinese ? '直接部署' : 'Deploy as-is', value: '部署', style: 'secondary' },
    ],
  })
}

/**
 * clone_analyzing 恢復：轉入 clone_failed + 重試按鈕
 */
async function recoverCloneAnalyzing(
  redis: Redis, io: SocketIOServer, conversationId: string, state: FlowState
) {
  const isChinese = state.locale !== 'en'

  state.phase = 'clone_failed'
  state.waitingForReply = true
  state.cloneFailedReason = 'Analyzing timed out'
  state.cloneAnalyzingStartedAt = undefined
  await saveFlowState(redis, conversationId, state)

  await sendMessage(conversationId, io, {
    content: isChinese
      ? '網站分析逾時了。請重試或嘗試其他網址/截圖。'
      : 'Website analysis timed out. Please retry or try a different URL/screenshot.',
    stage: 'error',
    quickReplies: [
      { label: isChinese ? '重試' : 'Retry', value: '__retry_clone__', style: 'primary' },
      { label: isChinese ? '新專案' : 'New Project', value: '__new_project__', style: 'ghost' },
    ],
  })
}

/**
 * clone_generating 恢復：有已完成 section → 合併 → uiux_complete；否則 → clone_failed
 */
async function recoverCloneGenerating(
  redis: Redis, io: SocketIOServer, conversationId: string, state: FlowState
) {
  const isChinese = state.locale !== 'en'
  const completedSections = state.cloneCompletedSections || 0

  if (completedSections > 0 && state.uiuxGeneratedCode) {
    // 有部分代碼 → 直接完成
    state.phase = 'uiux_complete'
    state.waitingForReply = true
    state.uiuxCodePhase = 'complete'
    state.cloneGeneratingStartedAt = undefined
    await saveFlowState(redis, conversationId, state)

    await sendMessage(conversationId, io, {
      content: isChinese
        ? `生成中斷了，已還原 ${completedSections} 個區塊。你可以繼續修改或部署。`
        : `Generation was interrupted. ${completedSections} sections were recovered. You can modify or deploy.`,
      stage: 'uiux_complete',
      quickReplies: [
        { label: isChinese ? '部署上線' : 'Deploy', value: '部署', style: 'primary' },
        { label: isChinese ? '新專案' : 'New Project', value: '__new_project__', style: 'ghost' },
      ],
    })
  } else {
    // 無代碼 → 失敗
    state.phase = 'clone_failed'
    state.waitingForReply = true
    state.cloneFailedReason = 'Generating timed out with no completed sections'
    state.cloneGeneratingStartedAt = undefined
    await saveFlowState(redis, conversationId, state)

    await sendMessage(conversationId, io, {
      content: isChinese
        ? '代碼生成逾時了，請重試。'
        : 'Code generation timed out. Please retry.',
      stage: 'error',
      quickReplies: [
        { label: isChinese ? '重試' : 'Retry', value: '__retry_clone__', style: 'primary' },
        { label: isChinese ? '新專案' : 'New Project', value: '__new_project__', style: 'ghost' },
      ],
    })
  }
}
