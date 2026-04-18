// ============================================================
// UIUX Phase Handlers
// Design Discovery, Variants, Code Pipeline, Template
// 從 orchestrator.ts 提取
// ============================================================

import Redis from 'ioredis'
import * as db from '../../db/client'
import type { FlowState, IoEmitter } from '../../types/flow-state'
import { sanitizeForPreview } from '../../services/code-verify'
import {
  generateDesignVariants, synthesizeVariants, extractVariantConcept,
  generateStructure, generateAnimations, generateRwd,
  generateTailwindConfig, generateDesignBrief, adjustDesignBrief,
  DesignBrief, TemplateData, GeneratedComponent, VariantConcept,
  ensureResponsiveClasses,
} from '../../services/uiux-generation'
import { translateBddToUISpec, buildUISpecSummary } from '../../services/bdd-to-ui-spec'
import { runQualityGate, autoFixCriticalIssues, autoFixCriticalIssuesRuleBased } from '../../services/quality-gate'
import { evaluateUi, type UiEvaluationIssue } from '../../services/ui-evaluator'
import type { QualityIssue } from '../../services/quality-gate'
import { getEnv } from '../../lib/env'
import { getBddSession, updateBddSession } from '../../services/bdd-session'
import { analyzeReference, analyzeUploadedImage } from '../../services/reference-analyzer'
import { getImageLibraryOrFallback } from '../../services/image-library-service'
import { recommendMoods, getMoodSummary } from '../../services/design-moods'
import { executeIteration, executeUndoIteration } from '../../services/iteration-skill'
import { semanticGateway } from '../../services/semantic-gateway'
import { detectFastModeIntent, getFaqReply, answerWithSonnet } from '../../services/customer-service'
import { sendMessage, streamLlmMessage, saveFlowState, saveFlowStateLight, getFlowState, deleteFlowState, makeStreamingCallback, generatedCodeToFileRows, deductCredits, hasRecentFlowActivity, touchFlowActivity, snapshotCodeToGeneration } from '../orchestrator-utils'
import { CREDIT_COSTS } from '../../config/plans'
import {
  hasDeployIntent, hasRejectDeployIntent, hasUndoIntent,
  hasChangeIntent, hasRollbackSpecIntent, hasCoderIntent,
  DESIGN_BRIEF_LIMITS,
} from '../intent-helpers'
import { handlePhaseError } from '../phase-router'
import { createLogger } from '../../lib/logger'

// Lazy imports to avoid circular dependencies
const getDeployerSkill = () => import('./deploy-phases').then(m => m.executeDeployerSkill)
const getSpecChangeHandler = () => import('./bdd-phases').then(m => m.handleSpecChange)

const logger = createLogger('uiux-phases')

/**
 * 判斷是否顯示「接上資料庫」quickReply
 * 條件：有 BDD actionsYml + 有 Neon DB + 未完成 coder + 不是 fast-build
 */
async function shouldShowCoderButton(state: FlowState): Promise<boolean> {
  if (state.coderCompleted) return false
  if (state.fastMode) return false
  if (!state.projectId) return false
  const bdd = await db.queryOne<{ actions_yml_content: string }>(
    'SELECT actions_yml_content FROM bdd_sessions WHERE project_id = $1 AND actions_yml_content IS NOT NULL ORDER BY updated_at DESC LIMIT 1',
    [state.projectId]
  )
  if (!bdd) return false
  const neon = await db.queryOne<{ neon_connection_string: string }>(
    'SELECT neon_connection_string FROM projects WHERE id = $1 AND neon_connection_string IS NOT NULL',
    [state.projectId]
  )
  return !!neon
}

// ============================================================
// UIUX Phase Routing Handlers (called from phase-router.ts)
// ============================================================

export async function handleUiuxCodeGenerating(
  conversationId: string, state: FlowState, redis: Redis, io: IoEmitter
) {
    const GENERATION_TIMEOUT_MS = 10 * 60 * 1000
    const startedAt = state.uiuxCodeGenerationStartedAt || 0
    const elapsed = Date.now() - startedAt

    // ── 過期 lock 偵測（stalled job re-processing 自己持有 lock 的情境）──
    const STALE_UIUX_THRESHOLD_MS = 5 * 60 * 1000
    let isStale = false
    if (startedAt > 0 && elapsed > STALE_UIUX_THRESHOLD_MS) {
      const lockExists = (await redis.exists(`conv-lock:${conversationId}`)) === 1
      if (lockExists) {
        const hasActivity = await hasRecentFlowActivity(redis, conversationId)
        if (!hasActivity) {
          logger.warn({ conversationId, elapsed: Math.round(elapsed / 1000) + 's' },
            'UIUX 代碼生成過期偵測：lock 存在但無心跳，觸發恢復')
          isStale = true
        }
      }
    }

    const isTimedOut = startedAt === 0 || elapsed > GENERATION_TIMEOUT_MS

    if (isTimedOut || isStale) {
      const hasRecentActivity = await hasRecentFlowActivity(redis, conversationId)
      if (hasRecentActivity) {
        logger.info('代碼生成檢查超時但近期仍有活動心跳，跳過恢復')
        await sendMessage(conversationId, io, {
          content: '正在生成中，請稍候...',
          stage: 'uiux_pipeline_progress',
        })
        return
      }

      logger.warn({ elapsed: startedAt === 0 ? 'legacy' : Math.round(elapsed / 1000) + 's' }, '代碼生成超時，偵測到中斷，自動恢復')

      // 檢查是否有已存檔的代碼可以恢復
      const hasCode = state.uiuxGeneratedCode &&
        (state.uiuxGeneratedCode.pages.length > 0 || state.uiuxGeneratedCode.components.length > 0)
      const resumePhase = state.uiuxCodePhase || 'structure'

      if (hasCode && resumePhase !== 'structure' && resumePhase !== 'complete') {
        // 有中途存檔且未完成 → 自動恢復管線（從中斷點繼續）
        logger.info({ resumePhase }, '從階段自動恢復管線')
        state.uiuxCodeGenerationStartedAt = Date.now()
        state.waitingForReply = false
        await saveFlowState(redis, conversationId, state)

        // 直接呼叫管線，它會根據 uiuxCodePhase 跳過已完成的階段
        await executeFullCodePipeline(conversationId, state, redis, io)
      } else if (hasCode && resumePhase === 'complete') {
        // 所有階段都完成了但沒走到最後收尾 → 直接進入 uiux_complete
        logger.info('代碼已全部生成，進入完成狀態')
        state.phase = 'uiux_complete'
        state.uiuxCodePhase = 'complete'
        state.uiuxCodeGenerationStartedAt = undefined
        state.waitingForReply = false
        await saveFlowState(redis, conversationId, state)

        await sendMessage(conversationId, io, {
          content: '代碼生成已恢復完成！\n\n你可以：\n- 輸入「**部署**」部署上線\n- 或描述想調整的地方，我來修改',
          stage: 'uiux_complete',
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
      return
    }

    await sendMessage(conversationId, io, {
      content: '正在生成中，請稍候...',
      stage: 'uiux_pipeline_progress',
    })
    return
}

export async function handleUiuxIterating(
  conversationId: string, state: FlowState, redis: Redis, io: IoEmitter
) {
    const isChinese = state.locale !== 'en'
    const ITERATION_TIMEOUT_MS = 5 * 60 * 1000
    const iterStartedAt = state.uiuxCodeGenerationStartedAt || 0
    if (iterStartedAt > 0 && Date.now() - iterStartedAt > ITERATION_TIMEOUT_MS) {
      logger.warn('迭代修改超時，自動恢復到 uiux_complete')
      state.phase = 'uiux_complete'
      state.uiuxCodeGenerationStartedAt = undefined
      await saveFlowState(redis, conversationId, state)
      await sendMessage(conversationId, io, {
        content: isChinese
          ? '修改中斷了，請重新描述你想調整的內容。'
          : 'Modification was interrupted. Please describe what you want to adjust.',
        stage: 'uiux_complete',
      })
      return
    }
    await sendMessage(conversationId, io, {
      content: isChinese
        ? '正在修改設計中，請稍候...'
        : 'Modifying design, please wait...',
      stage: 'info',
    })
    return
}

export async function handleFastGenerating(
  conversationId: string, state: FlowState, redis: Redis, io: IoEmitter
) {
    // 結構生成失敗後等待用戶點重試，攔截隨機輸入
    if (state.waitingForReply) {
      const isChinese = state.locale !== 'en'
      await sendMessage(conversationId, io, {
        content: isChinese
          ? '生成已暫停。請點擊「重試」按鈕重新生成，或點「開始新專案」重新描述需求。'
          : 'Generation is paused. Click "Retry" to regenerate, or "New Project" to start fresh.',
        stage: 'info',
        quickReplies: [
          { label: isChinese ? '重試' : 'Retry', value: '__retry_fast_build__', style: 'primary' as const },
          { label: isChinese ? '開始新專案' : 'New Project', value: '__new_project__', style: 'ghost' as const },
        ],
      })
      return
    }

    // ── 快速孤兒偵測 ──
    // conv-lock 不存在 = Worker 已死（啟動清理刪除所有殘留鎖）
    const lockExists = (await redis.exists(`conv-lock:${conversationId}`)) === 1
    const orphanStartedAt = state.uiuxCodeGenerationStartedAt || 0
    const elapsedMs = orphanStartedAt > 0 ? Date.now() - orphanStartedAt : 0

    if (!lockExists && orphanStartedAt > 0 && elapsedMs > 60_000) {
      logger.warn({ conversationId, elapsedMs, codePhase: state.uiuxCodePhase },
        'Fast Build 孤兒偵測：conv-lock 不存在，立即恢復')
      await redis.del(`flow:activity:${conversationId}`).catch(() => {})
      await recoverFastBuildFromInterruption(conversationId, state, redis, io)
      return
    }

    // ── 過期 lock 偵測（stalled job re-processing 自己持有 lock 的情境）──
    // conv-lock 存在但 startedAt 已很舊 + 無活動心跳 → 原始 Worker 已死，
    // 當前 lock 是重新處理的 job 自己持有的，不代表有人在生成
    const STALE_GENERATION_THRESHOLD_MS = 5 * 60 * 1000
    if (lockExists && orphanStartedAt > 0 && elapsedMs > STALE_GENERATION_THRESHOLD_MS) {
      const hasRecentActivity = await hasRecentFlowActivity(redis, conversationId)
      if (!hasRecentActivity) {
        logger.warn({ conversationId, elapsedMs, codePhase: state.uiuxCodePhase },
          'Fast Build 過期偵測：lock 存在但無活動心跳，觸發恢復')
        await redis.del(`flow:activity:${conversationId}`).catch(() => {})
        await recoverFastBuildFromInterruption(conversationId, state, redis, io)
        return
      }
    }

    const FAST_BUILD_TIMEOUT_MS = 20 * 60 * 1000
    const startedAt = state.uiuxCodeGenerationStartedAt || 0
    if (startedAt === 0 || Date.now() - startedAt > FAST_BUILD_TIMEOUT_MS) {
      const hasRecentActivity = await hasRecentFlowActivity(redis, conversationId)
      if (hasRecentActivity) {
        const isChinese = state.locale !== 'en'
        logger.info('Fast Build 檢查超時但近期仍有活動心跳，跳過恢復')
        await sendMessage(conversationId, io, {
          content: isChinese
            ? '正在生成中，請稍候... 預計 5 分鐘完成。'
            : 'Generating, please wait... Estimated 5 minutes.',
          stage: 'info',
        })
        return
      }

      logger.warn('Fast Build 超時，嘗試恢復')
      const isChinese = state.locale !== 'en'
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
            data: (() => {
              const s = sanitizeForPreview({ pages: state.uiuxGeneratedCode!.pages, components: state.uiuxGeneratedCode!.components, styles: state.uiuxGeneratedCode!.styles })
              return { pages: s.code.pages, components: s.code.components, styles: s.code.styles, tailwindConfig: twConfig, currentPhase: 'complete' }
            })() as Record<string, unknown>,
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
      return
    }
    const isChinese = state.locale !== 'en'
    await sendMessage(conversationId, io, {
      content: isChinese
        ? '正在生成中，請稍候... 預計 5 分鐘完成。'
        : 'Generating, please wait... Estimated 5 minutes.',
      stage: 'info',
    })
    return
}

// ============================================================
// Fast Build 中斷恢復（孤兒偵測 + flowstate-recovery 共用）
// ============================================================

export async function recoverFastBuildFromInterruption(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: IoEmitter
) {
  const isChinese = state.locale !== 'en'
  const codePhase = state.uiuxCodePhase || 'structure'
  const hasCode = state.uiuxGeneratedCode &&
    (state.uiuxGeneratedCode.pages.length > 0 || state.uiuxGeneratedCode.components.length > 0)

  if (!hasCode) {
    // 無代碼 → 刪除 FlowState + 提示重新開始
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
    return
  }

  if (codePhase === 'animation' || codePhase === 'rwd') {
    // 中間態（有 structure 代碼，animation/rwd 未完成）→ 暫停讓用戶選擇
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
  } else {
    // structure 或 complete → 直接跳 uiux_complete
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
        data: (() => {
          const s = sanitizeForPreview({ pages: state.uiuxGeneratedCode!.pages, components: state.uiuxGeneratedCode!.components, styles: state.uiuxGeneratedCode!.styles })
          return { pages: s.code.pages, components: s.code.components, styles: s.code.styles, tailwindConfig: twConfig, currentPhase: 'complete' }
        })() as Record<string, unknown>,
      },
      quickReplies: [
        { label: isChinese ? '部署上線' : 'Deploy', value: '部署', style: 'primary' },
      ],
    })
  }
}

export interface UiuxContinueFlowData {
  projectId: string
  conversationId: string
  userId: string
  taskId?: string
  message: string
  locale?: 'zh' | 'en'
  imageUrls?: string[]
}

export async function handleUiuxMixedPhaseRouting(
  data: UiuxContinueFlowData,
  state: FlowState,
  trimmedMsg: string,
  message: string,
  redis: Redis,
  io: IoEmitter
) {
  const { conversationId, projectId, userId } = data

  // 全形字母轉半形
  const normalizedMsg = message.replace(/[Ａ-Ｚａ-ｚ]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)
  )

    // ── 舊對話逃生出口：__regenerate_features__ 一鍵重新生成 Features（適用第 9 層粒度規則）──
    if (trimmedMsg === '__regenerate_features__') {
      const { regenerateFeaturesTask } = await import('./coder-phases')
      await regenerateFeaturesTask({
        projectId, conversationId, userId,
        redis, io,
      })
      return
    }

    if (state.phase === 'spec_completed' && hasChangeIntent(trimmedMsg)) {
      const specChangeHandler = await getSpecChangeHandler()
      await specChangeHandler(conversationId, state, trimmedMsg, redis, io)
      return
    }

    // ── spec_completed：查看變更歷史 ──
    if (state.phase === 'spec_completed' && trimmedMsg.includes('變更歷史')) {
      const session = await getBddSession({ sessionId: state.sessionId! })
      if (!session.success || !session.data) {
        await sendMessage(conversationId, io, { content: '規格資料已過期，請開始新的對話。', stage: 'error' })
        return
      }
      const history = session.data.changeHistory || []
      if (history.length === 0) {
        await sendMessage(conversationId, io, { content: '目前沒有變更歷史。', stage: 'info' })
      } else {
        let text = `**變更歷史**（${history.length} 筆）\n\n`
        history.forEach((entry, i) => {
          const time = new Date(entry.timestamp).toLocaleString('zh-TW')
          text += `**${i + 1}.** [${entry.changeType}] ${entry.description}\n   ${time} | 影響：${entry.affectedLayers.join(', ')}\n\n`
        })
        text += '_輸入「撤銷變更」可回滾到某個版本_'
        await sendMessage(conversationId, io, { content: text, stage: 'info' })
      }
      return
    }

    // ── spec_completed：撤銷變更（回滾規格）──
    if (state.phase === 'spec_completed' && hasRollbackSpecIntent(trimmedMsg)) {
      const session = await getBddSession({ sessionId: state.sessionId! })
      if (!session.success || !session.data) {
        await sendMessage(conversationId, io, { content: '規格資料已過期，無法回滾。', stage: 'error' })
        return
      }
      const history = session.data.changeHistory || []
      if (history.length === 0) {
        await sendMessage(conversationId, io, { content: '目前沒有變更歷史可回滾。', stage: 'info' })
        return
      }
      let text = `**選擇要回滾到的版本**\n\n回滾會還原該筆變更及其之後的所有變更。\n\n`
      history.forEach((entry, i) => {
        const time = new Date(entry.timestamp).toLocaleString('zh-TW')
        text += `**${i + 1}.** [${entry.changeType}] ${entry.description}\n   ${time}\n\n`
      })
      text += '_輸入編號（如「1」）選擇要回滾的變更，或輸入「取消」放棄。_'
      state.phase = 'spec_rollback_select'
      await saveFlowState(redis, conversationId, state)
      await sendMessage(conversationId, io, {
        content: text,
        stage: 'spec_rollback_select',
        quickReplies: [
          ...history.map((_, i) => ({ label: `回滾 #${i + 1}`, value: String(i + 1), style: 'ghost' as const })),
          { label: '取消', value: '取消', style: 'ghost' as const },
        ],
      })
      return
    }

    // 檢查是否是模板選擇訊息
    if (message.includes('我選擇') && message.includes('模板')) {
      try {
        await handleTemplateSelection(conversationId, state, message, redis, io)
      } catch (err) {
        await handlePhaseError(conversationId, state, err, redis, io)
      }
      return
    }

    // uiux_template_selection 階段：自然語言匹配（序號、名稱）
    if (state.phase === 'uiux_template_selection') {
      try {
        await handleTemplateNaturalSelection(conversationId, state, message, redis, io)
      } catch (err) {
        await handlePhaseError(conversationId, state, err, redis, io)
      }
      return
    }

    // 檢查是否是變體選擇訊息（支援多種自然語言表達，含全形）
    if (
      normalizedMsg.includes('選擇變體') ||
      normalizedMsg.includes('合併') ||
      normalizedMsg.match(/選擇?\s*[A-E]/i) ||
      normalizedMsg.match(/我要\s*[A-E]/i) ||
      normalizedMsg.match(/我選\s*[A-E]/i) ||
      normalizedMsg.match(/^[A-E]$/i)
    ) {
      try {
        await handleVariantSelection(conversationId, state, normalizedMsg, redis, io)
      } catch (err) {
        await handlePhaseError(conversationId, state, err, redis, io)
      }
      return
    }

    // variant_selection 階段：任何包含 A-E 的訊息都嘗試路由
    if (state.phase === 'uiux_variant_selection' && normalizedMsg.match(/[A-E]/i)) {
      try {
        await handleVariantSelection(conversationId, state, normalizedMsg, redis, io)
      } catch (err) {
        await handlePhaseError(conversationId, state, err, redis, io)
      }
      return
    }

    // 檢查是否是確認使用模板
    if (message.includes('確認使用')) {
      await handleConfirmTemplate(conversationId, state, redis, io)
      return
    }

    // 管線跑完後的確認/重做（管線執行中 waitingForReply=false，不會觸發）
    if (state.uiuxCodePhase && state.waitingForReply && (
      message.includes('繼續') ||
      message.includes('下一步') ||
      message.includes('好') ||
      message.includes('可以') ||
      message === 'Y' ||
      message === 'y'
    )) {
      await handleCodePhaseConfirm(conversationId, state, redis, io)
      return
    }

    if (state.uiuxCodePhase && state.waitingForReply && (
      message.includes('重新生成') ||
      message.includes('重做')
    )) {
      await handleCodePhaseRedo(conversationId, state, redis, io)
      return
    }

    // ── UIUX 完成後檢查是否要部署、撤銷或迭代修改 ──
    if (state.phase === 'uiux_complete') {
      const trimmed = message.trim()
      const isChinese = /[\u4e00-\u9fff]/.test(trimmed) || state.locale === 'zh'

      // 預先計算 Coder 按鈕（所有回覆路徑共用）
      const showCoder = !state.coderCompleted && await shouldShowCoderButton(state)
      const coderQr = showCoder
        ? { label: isChinese ? '生成後端（接上資料庫）' : 'Generate Backend', value: '__connect_database__', style: 'primary' as const }
        : null

      if (hasDeployIntent(trimmed)) {
        // 攔截：有 DB 但還沒跑 Coder → 提醒用戶先接上資料庫
        if (!state.coderCompleted && await shouldShowCoderButton(state)) {
          await sendMessage(conversationId, io, {
            content: '你的網站目前使用假資料，部署後功能不會真正運作。\n\n建議先「**生成後端**」，讓 AI 自動開發後端邏輯並連接資料庫，再部署上線。',
            stage: 'uiux_complete',
            quickReplies: [
              { label: '生成後端（建議）', value: '__connect_database__', style: 'primary' },
              { label: '仍然部署（僅前端）', value: '__deploy_without_coder__', style: 'secondary' },
            ],
          })
          return
        }
        const deployerSkill = await getDeployerSkill()
        await deployerSkill({
          taskId: state.taskId || '',
          projectId: data.projectId,
          conversationId,
          userId,
          message,
          redis,
          io,
        })
        return
      }
      // 重試 DB Provisioning
      if (trimmed === '__retry_db_provision__') {
        const isChinese = state.locale !== 'en'
        try {
          // 從 BDD session 讀取 schemaSql + entityMapping
          const bddRow = await db.queryOne<{ schema_sql_content: string; entity_mapping_content: string }>(
            'SELECT schema_sql_content, entity_mapping_content FROM bdd_sessions WHERE project_id = $1 AND schema_sql_content IS NOT NULL ORDER BY updated_at DESC LIMIT 1',
            [data.projectId]
          )
          if (!bddRow) {
            await sendMessage(conversationId, io, {
              content: isChinese ? '找不到 BDD 規格，無法建立資料庫。' : 'BDD spec not found, cannot create database.',
              stage: 'uiux_complete',
            })
            return
          }
          const { deriveSchemaFromBdd } = await import('../../services/schema-derivation')
          const { provisionNeonDatabase } = await import('../../services/neon-service')
          const derivedSchema = deriveSchemaFromBdd(bddRow.schema_sql_content, bddRow.entity_mapping_content || '')
          if (derivedSchema.entityCount === 0) {
            await sendMessage(conversationId, io, {
              content: isChinese ? 'Schema 推導結果為空，無法建立資料庫。' : 'Schema derivation yielded no tables.',
              stage: 'uiux_complete',
            })
            return
          }
          await sendMessage(conversationId, io, {
            content: isChinese
              ? `正在重新建立資料庫...\n\n偵測到 ${derivedSchema.entityCount} 個資料表：\n${derivedSchema.displaySummary}`
              : `Retrying database setup...\n\nDetected ${derivedSchema.entityCount} tables:\n${derivedSchema.displaySummary}`,
            stage: 'db_provisioning',
          })
          const result = await provisionNeonDatabase({
            projectId: data.projectId,
            projectName: `tc-${data.projectId.slice(0, 8)}`,
            schema: derivedSchema,
            conversationId,
            io,
            locale: state.locale,
          })
          state.dbProvisionStatus = result ? 'completed' : 'failed'
          await saveFlowState(redis, conversationId, state)
          if (result) {
            // DB 建立成功，自動觸發 Coder
            const coderPhases = await import('./coder-phases')
            await coderPhases.executeCoderSkill({
              taskId: state.taskId || '',
              projectId: data.projectId,
              conversationId,
              userId,
              redis,
              io,
            })
          } else {
            await sendMessage(conversationId, io, {
              content: isChinese
                ? '資料庫建立再次失敗，請稍後重試或先部署純前端版本。'
                : 'Database setup failed again. Please try later or deploy frontend only.',
              stage: 'uiux_complete',
              quickReplies: [
                { label: isChinese ? '重試' : 'Retry', value: '__retry_db_provision__', style: 'primary' as const },
                { label: isChinese ? '部署純前端' : 'Deploy frontend only', value: '__deploy_without_coder__', style: 'secondary' as const },
              ],
            })
          }
        } catch (err) {
          logger.error({ err, conversationId }, 'DB provision 重試失敗')
          await sendMessage(conversationId, io, {
            content: isChinese
              ? '資料庫建立過程發生錯誤，請稍後重試。'
              : 'An error occurred during database setup. Please try again later.',
            stage: 'uiux_complete',
            quickReplies: [
              { label: isChinese ? '重試' : 'Retry', value: '__retry_db_provision__', style: 'primary' as const },
              { label: isChinese ? '部署純前端' : 'Deploy frontend only', value: '__deploy_without_coder__', style: 'secondary' as const },
            ],
          })
        }
        return
      }
      // 用戶確認跳過 Coder 直接部署
      if (trimmed === '__deploy_without_coder__') {
        const deployerSkill = await getDeployerSkill()
        await deployerSkill({
          taskId: state.taskId || '',
          projectId: data.projectId,
          conversationId,
          userId,
          message: '部署',
          redis,
          io,
        })
        return
      }
      // 拒絕部署（「我不要部署」「先不上線」）→ 確認並提示其他選項
      if (hasRejectDeployIntent(trimmed)) {
        const qr: { label: string; value: string; style: 'primary' | 'secondary' | 'ghost' }[] = []
        if (coderQr) qr.push(coderQr)
        qr.push({ label: isChinese ? '部署上線' : 'Deploy', value: '部署', style: coderQr ? 'secondary' : 'primary' })
        if (state.uiuxPreIterationCode) {
          qr.push({ label: isChinese ? '撤銷修改' : 'Undo', value: '撤銷', style: 'ghost' })
        }
        qr.push({ label: isChinese ? '上傳到模板庫' : 'Upload as Template', value: '__upload_template__', style: 'ghost' })
        await sendMessage(conversationId, io, {
          content: isChinese
            ? '好的，暫時不部署。您可以繼續修改設計，或隨時點擊「部署上線」。'
            : 'Got it, not deploying for now. You can continue modifying the design, or click "Deploy" whenever ready.',
          stage: 'uiux_complete',
          quickReplies: qr,
        })
        return
      }
      if (hasUndoIntent(trimmed)) {
        await executeUndoIteration({ conversationId, projectId: data.projectId, redis, io })
        return
      }

      // 接上資料庫（Coder Skill）
      if (trimmed === '__connect_database__' || hasCoderIntent(trimmed)) {
        if (state.coderCompleted) {
          await sendMessage(conversationId, io, {
            content: '後端已經開發完成了！如果有功能需要調整，可以直接告訴我修改內容。',
            quickReplies: [
              { label: '部署上線', value: '部署', style: 'primary' as const },
              { label: '修改設計', value: '我想修改', style: 'secondary' as const },
            ],
          })
          return
        }
        // 檢查 Neon DB 是否可用（provision 成功），不可用時自動重試
        const neonRow = await db.queryOne<{ neon_connection_string: string }>(
          'SELECT neon_connection_string FROM projects WHERE id = $1 AND neon_connection_string IS NOT NULL',
          [data.projectId]
        )
        if (!neonRow) {
          // DB 不可用 → 自動重試 provisioning（不多問一步）
          const isChinese = state.locale !== 'en'
          try {
            const bddRow = await db.queryOne<{ schema_sql_content: string; entity_mapping_content: string }>(
              'SELECT schema_sql_content, entity_mapping_content FROM bdd_sessions WHERE project_id = $1 AND schema_sql_content IS NOT NULL ORDER BY updated_at DESC LIMIT 1',
              [data.projectId]
            )
            if (!bddRow) {
              await sendMessage(conversationId, io, {
                content: isChinese ? '此專案缺少 BDD 規格，無法建立資料庫。請先完成需求釐清。' : 'BDD spec not found. Please complete requirements first.',
                stage: 'uiux_complete',
              })
              return
            }
            const { deriveSchemaFromBdd } = await import('../../services/schema-derivation')
            const { provisionNeonDatabase } = await import('../../services/neon-service')
            const derivedSchema = deriveSchemaFromBdd(bddRow.schema_sql_content, bddRow.entity_mapping_content || '')
            if (derivedSchema.entityCount === 0) {
              await sendMessage(conversationId, io, {
                content: isChinese ? 'Schema 推導結果為空，無法建立資料庫。' : 'Schema derivation yielded no tables.',
                stage: 'uiux_complete',
              })
              return
            }
            await sendMessage(conversationId, io, {
              content: isChinese
                ? `正在建立資料庫...\n\n偵測到 ${derivedSchema.entityCount} 個資料表：\n${derivedSchema.displaySummary}`
                : `Setting up database...\n\nDetected ${derivedSchema.entityCount} tables:\n${derivedSchema.displaySummary}`,
              stage: 'db_provisioning',
            })
            const provResult = await provisionNeonDatabase({
              projectId: data.projectId,
              projectName: `tc-${data.projectId.slice(0, 8)}`,
              schema: derivedSchema,
              conversationId,
              io,
              locale: state.locale,
            })
            state.dbProvisionStatus = provResult ? 'completed' : 'failed'
            await saveFlowState(redis, conversationId, state)
            if (!provResult) {
              await sendMessage(conversationId, io, {
                content: isChinese
                  ? '資料庫建立失敗，請稍後重試或先部署純前端版本。'
                  : 'Database setup failed. Please try later or deploy frontend only.',
                stage: 'uiux_complete',
                quickReplies: [
                  { label: isChinese ? '重試' : 'Retry', value: '__retry_db_provision__', style: 'primary' as const },
                  { label: isChinese ? '部署純前端' : 'Deploy frontend only', value: '__deploy_without_coder__', style: 'secondary' as const },
                ],
              })
              return
            }
          } catch (err) {
            logger.error({ err, conversationId }, 'Auto DB provision 失敗')
            const isCh = state.locale !== 'en'
            await sendMessage(conversationId, io, {
              content: isCh ? '資料庫建立過程發生錯誤，請稍後重試。' : 'Database setup error. Please try again later.',
              stage: 'uiux_complete',
              quickReplies: [
                { label: isCh ? '重試' : 'Retry', value: '__retry_db_provision__', style: 'primary' as const },
                { label: isCh ? '部署純前端' : 'Deploy frontend only', value: '__deploy_without_coder__', style: 'secondary' as const },
              ],
            })
            return
          }
        }
        // DB 可用 → 執行 Coder Skill
        const coderPhases = await import('./coder-phases')
        await coderPhases.executeCoderSkill({
          taskId: state.taskId || '',
          projectId: data.projectId,
          conversationId,
          userId,
          redis,
          io,
        })
        return
      }

      // 問候/問題/閒聊攔截 — 在 semanticGateway 前
      const intentCheck2 = detectFastModeIntent(trimmed)
      if (intentCheck2.match && intentCheck2.type === 'platform_issue') {
        const qr: { label: string; value: string; style: 'primary' | 'secondary' | 'ghost' }[] = []
        if (coderQr) qr.push(coderQr)
        qr.push({ label: isChinese ? '部署上線' : 'Deploy', value: '部署', style: coderQr ? 'secondary' : 'primary' })
        if (state.uiuxPreIterationCode) {
          qr.push({ label: isChinese ? '撤銷修改' : 'Undo', value: '撤銷', style: 'ghost' })
        }
        await sendMessage(conversationId, io, {
          content: isChinese
            ? '看起來預覽出現了問題。請試試：\n1. 重新整理頁面\n2. 清除瀏覽器快取\n\n如果問題持續，描述您看到的具體狀況，我會嘗試修復。'
            : 'Looks like the preview has an issue. Try:\n1. Refresh the page\n2. Clear browser cache\n\nIf it persists, describe what you see and I\'ll try to fix it.',
          stage: 'customer_service',
          quickReplies: qr,
        })
        return
      }
      if (intentCheck2.match) {
        if (intentCheck2.type === 'question') {
          const faqResult = getFaqReply(trimmed, state.locale)
          const qr: { label: string; value: string; style: 'primary' | 'secondary' | 'ghost' }[] = []
          if (coderQr) qr.push(coderQr)
          qr.push({ label: isChinese ? '部署上線' : 'Deploy', value: '部署', style: coderQr ? 'secondary' : 'primary' as const })
          qr.push({ label: isChinese ? '開始新專案' : 'New Project', value: '__new_project__', style: 'ghost' as const })
          qr.push({ label: isChinese ? '上傳到模板庫' : 'Upload as Template', value: '__upload_template__', style: 'ghost' as const })
          if (faqResult) {
            await sendMessage(conversationId, io, {
              content: faqResult.reply,
              stage: 'customer_service',
              quickReplies: qr,
            })
          } else {
            await streamLlmMessage(conversationId, io, {
              stage: 'customer_service',
              quickReplies: qr,
              llmFn: (onDelta) => answerWithSonnet(trimmed, { conversationId, locale: state.locale }, onDelta),
            })
          }
          return
        }
        await sendMessage(conversationId, io, {
          content: isChinese
            ? '嗨！您的設計已經完成了。您可以：\n- 描述修改需求來調整設計\n- 點擊「部署上線」發布網站\n- 點擊「開始新專案」重新開始'
            : 'Hi! Your design is ready. You can:\n- Describe changes to adjust the design\n- Click "Deploy" to publish your site\n- Click "New Project" to start fresh',
          stage: 'info',
          quickReplies: [
            ...(coderQr ? [coderQr] : []),
            { label: isChinese ? '部署上線' : 'Deploy', value: '部署', style: coderQr ? 'secondary' as const : 'primary' as const },
            { label: isChinese ? '開始新專案' : 'New Project', value: '__new_project__', style: 'ghost' as const },
            { label: isChinese ? '上傳到模板庫' : 'Upload as Template', value: '__upload_template__', style: 'ghost' as const },
          ],
        })
        return
      }

      // 有生成代碼 → semanticGateway 判斷是否為有效修改請求
      if (state.uiuxGeneratedCode && state.uiuxCodePhase === 'complete') {
        const gwResult2 = await semanticGateway({
          phase: 'iteration',
          userMessage: trimmed,
          conversationId,
          userId,
          locale: data.locale || state.locale,
        }, state)
        if (!gwResult2.accept) {
          state.semanticRejectCount = (state.semanticRejectCount || 0) + 1
          await saveFlowStateLight(redis, conversationId, state)
          const qr: { label: string; value: string; style: 'primary' | 'secondary' | 'ghost' }[] = []
          if (coderQr) qr.push(coderQr)
          qr.push({ label: '部署上線', value: '部署', style: coderQr ? 'secondary' : 'primary' })
          if (state.uiuxPreIterationCode) {
            qr.push({ label: '撤銷修改', value: '撤銷', style: 'ghost' })
          }
          await sendMessage(conversationId, io, {
            content: gwResult2.guidanceMessage || '請描述您想修改的設計內容。',
            stage: 'info',
            quickReplies: qr,
          })
          return
        }
        state.semanticRejectCount = 0
        await saveFlowStateLight(redis, conversationId, state)
        await executeIteration({ conversationId, projectId: data.projectId, userId, userFeedback: message, redis, io, imageUrls: data.imageUrls })
        return
      }
    }

    // ── UIUX 階段 catch-all ──
    // 如果到這裡還沒 return，表示訊息無法識別
    // 絕對不能讓它洩漏到下方的 BDD processUserReply
    logger.info({ phase: state.phase, message }, 'UIUX 階段未匹配的訊息')
    if (state.phase === 'uiux_variant_selection') {
      const vrIds = (state.uiuxVariants || []).map(v => ({
        label: `選擇 ${v.id}`,
        value: `選擇 ${v.id}`,
        style: 'ghost' as const,
      }))
      await sendMessage(conversationId, io, {
        content: '請選擇您喜歡的設計方向。\n\n- 輸入「選擇 A」直接使用某個方案\n- 輸入「合併 A+C」組合多個方案的特點',
        stage: 'info',
        quickReplies: vrIds.length > 0 ? vrIds : [
          { label: '選擇 A', value: '選擇 A', style: 'ghost' as const },
          { label: '選擇 B', value: '選擇 B', style: 'ghost' as const },
          { label: '選擇 C', value: '選擇 C', style: 'ghost' as const },
          { label: '選擇 D', value: '選擇 D', style: 'ghost' as const },
          { label: '選擇 E', value: '選擇 E', style: 'ghost' as const },
        ],
      })
    } else if (state.phase === 'uiux_template_selection') {
      await sendMessage(conversationId, io, {
        content: '請選擇一個模板，或描述您想要的設計風格。',
        stage: 'info',
      })
    } else if (state.phase === 'uiux_complete' && (!state.uiuxGeneratedCode || state.uiuxCodePhase !== 'complete')) {
      // 異常狀態：uiux_complete 但無代碼（例如 structure 失敗後殘留）
      logger.warn('uiux_complete 但無生成代碼，重置為 idle')
      state.phase = 'idle'
      await saveFlowState(redis, conversationId, state)
      await sendMessage(conversationId, io, {
        content: '目前沒有已生成的設計，請描述你想要什麼樣的網站，我來幫你生成。',
        stage: 'info',
      })
    }
    return
}

// ============================================================
// UIUX Core Functions
// ============================================================

/**
 * 從自然語言訊息中解析模板序號
 * 支援：「第一個」「第1個」「1」「first」「1st」等
 */
function parseTemplateOrdinal(msg: string): number | null {
  const trimmed = msg.trim()

  // 純數字：「1」「2」
  const numMatch = trimmed.match(/^(\d+)$/)
  if (numMatch) return parseInt(numMatch[1])

  // 中文序數：「第一個」「第1個」「第一」「第三個模板」
  const zhMap: Record<string, number> = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '1': 1, '2': 2, '3': 3, '4': 4, '5': 5,
    '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  }
  const zhMatch = trimmed.match(/第([一二三四五六七八九十\d]+)/)
  if (zhMatch) return zhMap[zhMatch[1]] ?? null

  // 英文序數
  const lower = trimmed.toLowerCase()
  const enMap: Record<string, number> = {
    'first': 1, '1st': 1, 'second': 2, '2nd': 2, 'third': 3, '3rd': 3,
    'fourth': 4, '4th': 4, 'fifth': 5, '5th': 5,
  }
  for (const [key, val] of Object.entries(enMap)) {
    if (lower.includes(key)) return val
  }

  return null
}

/**
 * uiux_template_selection 階段的自然語言匹配
 * 當用戶不按按鈕，直接打字「第一個」「這個」「1」時的處理
 */
async function handleTemplateNaturalSelection(
  conversationId: string,
  state: FlowState,
  message: string,
  redis: Redis,
  io: IoEmitter
) {
  const templates = state.displayedTemplates
  if (!templates || templates.length === 0) {
    // 沒有模板列表（舊 FlowState），提示用戶使用按鈕
    await sendMessage(conversationId, io, {
      content: '請點擊模板卡片後按「使用此模板」按鈕來選擇。',
      stage: 'info',
    })
    return
  }

  // 1. 嘗試序號匹配
  const ordinal = parseTemplateOrdinal(message)
  if (ordinal !== null) {
    if (ordinal >= 1 && ordinal <= templates.length) {
      const selected = templates[ordinal - 1]
      logger.info({ ordinal, templateId: selected.id, templateName: selected.name }, '序號匹配模板')
      const synthesized = `我選擇「${selected.name}」這個模板`
      await handleTemplateSelection(conversationId, state, synthesized, redis, io)
      return
    }
    // 序號超出範圍
    await sendMessage(conversationId, io, {
      content: `目前有 ${templates.length} 個模板，請輸入 1~${templates.length} 的編號。`,
      stage: 'info',
    })
    return
  }

  // 2. 嘗試名稱模糊匹配
  const lowerMsg = message.toLowerCase().trim()
  const nameMatches = templates.filter(t =>
    t.name.toLowerCase().includes(lowerMsg) || lowerMsg.includes(t.name.toLowerCase())
  )
  if (nameMatches.length === 1) {
    logger.info({ templateId: nameMatches[0].id, templateName: nameMatches[0].name }, '名稱匹配模板')
    const synthesized = `我選擇「${nameMatches[0].name}」這個模板`
    await handleTemplateSelection(conversationId, state, synthesized, redis, io)
    return
  }

  // 3. 沒有匹配：列出模板讓用戶選擇
  const list = templates.map((t, i) => `**${i + 1}.** ${t.name}`).join('\n')
  await sendMessage(conversationId, io, {
    content: `請選擇一個模板（輸入編號即可）：\n\n${list}`,
    stage: 'info',
  })
}

export async function handleTemplateSelection(
  conversationId: string,
  state: FlowState,
  message: string,
  redis: Redis,
  io: IoEmitter
) {
  // 從訊息中提取模板 ID
  // 訊息格式：「我選擇「xxx」這個模板」
  const templateMatch = message.match(/我選擇「([^」]+)」/)
  if (!templateMatch) {
    await sendMessage(conversationId, io, {
      content: '無法識別您選擇的模板，請重新選擇。',
      stage: 'error',
    })
    return
  }

  const templateIdOrName = templateMatch[1]
  logger.info(`用戶選擇模板: ${templateIdOrName}`)

  // 查詢模板
  const templateResult = await db.queryOne<{
    id: string
    name: string
    slug: string
    category: string
    description: string
    design_defaults: unknown
    page_structure: unknown
  }>(
    `SELECT id, name, slug, category, description, design_defaults, page_structure
     FROM templates
     WHERE id::text = $1 OR slug = $1 OR name = $1`,
    [templateIdOrName]
  )

  if (!templateResult) {
    await sendMessage(conversationId, io, {
      content: '找不到該模板，請重新選擇。',
      stage: 'error',
    })
    return
  }

  const template: TemplateData = {
    id: templateResult.id,
    name: templateResult.name,
    slug: templateResult.slug,
    category: templateResult.category,
    description: templateResult.description,
    designDefaults: templateResult.design_defaults as TemplateData['designDefaults'],
    pageStructure: templateResult.page_structure as TemplateData['pageStructure'],
  }

  // 讀取用戶在 PreviewPanel 中的 template overrides
  if (state.projectId) {
    const overridesResult = await db.queryOne<{ template_overrides: Record<string, Record<string, string>> | null }>(
      `SELECT template_overrides FROM projects WHERE id = $1`,
      [state.projectId]
    )
    if (overridesResult?.template_overrides && Object.keys(overridesResult.template_overrides).length > 0) {
      state.templateOverrides = overridesResult.template_overrides
      await saveFlowState(redis, conversationId, state)
      logger.info(`載入 template overrides: ${Object.keys(overridesResult.template_overrides).length} 個元素`)
    }
  }

  // 進入 Design Brief 確認環節
  await startDesignBriefConfirm(conversationId, state, template, 'template', redis, io)
}

/**
 * 處理變體選擇
 * 用戶選擇或合併變體後，啟動三階段生成流程
 */
export async function handleVariantSelection(
  conversationId: string,
  state: FlowState,
  message: string,
  redis: Redis,
  io: IoEmitter
) {
  // 解析用戶選擇
  // 支援格式：「選擇 A」、「選擇變體 A」、「我要 E」、「我選 B」、「A」、「合併 A+C」、「合併 A 和 C」
  let selectedIds: string[] = []

  const singleMatch = message.match(/(?:選擇\s*變體?|我要|我選|選)\s*([A-E])/i)
    || message.match(/^([A-E])$/i)
  const mergeMatch = message.match(/合併\s*([A-E])\s*[+和與]\s*([A-E])/i)
  const multiMergeMatch = message.match(/合併\s*([A-E](?:\s*[+和與,]\s*[A-E])+)/i)

  if (singleMatch) {
    selectedIds = [singleMatch[1].toUpperCase()]
  } else if (mergeMatch) {
    selectedIds = [mergeMatch[1].toUpperCase(), mergeMatch[2].toUpperCase()]
  } else if (multiMergeMatch) {
    const ids = multiMergeMatch[1].match(/[A-E]/gi)
    if (ids) {
      selectedIds = ids.map(id => id.toUpperCase())
    }
  } else {
    // 最後嘗試：從訊息中提取任何 A-E 字母
    const anyMatch = message.match(/[A-E]/i)
    if (anyMatch) {
      selectedIds = [anyMatch[0].toUpperCase()]
    }
  }

  if (selectedIds.length === 0) {
    await sendMessage(conversationId, io, {
      content: '無法識別您的選擇。請輸入「選擇 A」或「合併 A+C」格式。',
      stage: 'error',
    })
    return
  }

  logger.info(`用戶選擇變體: ${selectedIds.join(', ')}`)

  // 取得 BDD Session
  if (!state.sessionId) {
    logger.error('缺少 sessionId')
    await sendMessage(conversationId, io, {
      content: '設計資訊已過期，請重新開始一個新對話。',
      stage: 'error',
      quickReplies: [{ label: '開始新專案', value: '__new_project__', style: 'primary' }],
    })
    await deleteFlowState(redis, conversationId)
    return
  }

  const session = await getBddSession({ sessionId: state.sessionId })
  if (!session.success || !session.data) {
    logger.error('無法取得 BDD Session')
    await sendMessage(conversationId, io, {
      content: '無法取得設計資料，請重新開始。',
      stage: 'error',
      quickReplies: [{ label: '開始新專案', value: '__new_project__', style: 'primary' }],
    })
    await deleteFlowState(redis, conversationId)
    return
  }

  // 取得變體
  const variants = session.data.designVariants || state.uiuxVariants
  if (!variants || variants.length === 0) {
    await sendMessage(conversationId, io, {
      content: '找不到設計變體，請重新選擇模板。',
      stage: 'error',
    })
    return
  }

  // 驗證選擇的變體 ID
  const validIds = ['A', 'B', 'C', 'D', 'E']
  const invalidIds = selectedIds.filter(id => !validIds.includes(id))
  if (invalidIds.length > 0) {
    await sendMessage(conversationId, io, {
      content: `無效的變體 ID: ${invalidIds.join(', ')}。請選擇 A-E 之間的變體。`,
      stage: 'error',
    })
    return
  }

  // 合併變體生成最終 Design System
  const finalDesignSystem = synthesizeVariants(selectedIds, variants, state.uiuxDesignMood)

  // 提取選中 variant 的創意概念
  const variantConcept = extractVariantConcept(selectedIds, variants)
  state.uiuxVariantConcept = variantConcept
  logger.info(`變體創意概念: ${variantConcept.name}${variantConcept.signatureElement ? ` (Signature: ${variantConcept.signatureElement})` : ''}`)

  // 保存到 BDD Session
  await updateBddSession({
    sessionId: state.sessionId,
    updates: {
      selectedVariantIds: selectedIds,
      finalDesignSystem: finalDesignSystem,
      currentPhase: 'uiux_code_generation',
    },
  })

  // 更新狀態，開始完整生成管線
  state.phase = 'uiux_code_generation'
  state.uiuxDesignSystem = finalDesignSystem
  state.uiuxCodePhase = 'structure'
  state.waitingForReply = false
  state.uiuxCodeGenerationStartedAt = Date.now()
  await saveFlowState(redis, conversationId, state)

  // 一氣呵成：Structure → Animation → RWD → Quality Gate
  await executeFullCodePipeline(conversationId, state, redis, io)
}

// ============================================================
// 快速建站 Skill
// ============================================================


export async function executeFullCodePipeline(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: IoEmitter
) {
  const { sessionId, uiuxDesignSystem } = state

  if (!sessionId || !uiuxDesignSystem) {
    logger.error('Pipeline 缺少必要的狀態數據')
    return
  }

  // ── 全程心跳：每 15 秒觸發，確保 post-processing 期間（syntax fix、QG）不被 recovery 誤殺 ──
  const heartbeatInterval = setInterval(() => {
    void touchFlowActivity(redis, conversationId)
  }, 15_000)

  // ── Pipeline guard：偵測 FlowState phase 被外部改變（recovery 或新 job），中止殭屍管線 ──
  // 不能只查 conv-lock 是否存在（新 job 會拿到新鎖），必須查 phase 是否仍是 uiux_code_generation
  const checkPipelineStillOwned = async (): Promise<boolean> => {
    try {
      const fresh = await getFlowState(redis, conversationId)
      if (!fresh || (fresh.phase !== 'uiux_code_generation' && fresh.phase !== 'uiux_quality_gate')) {
        logger.warn({ conversationId, currentPhase: fresh?.phase }, 'Pipeline guard: phase 已被外部改變（recovery/新 job），中止管線')
        clearInterval(heartbeatInterval)
        return false
      }
      return true
    } catch {
      return true // Redis 錯誤時不中止
    }
  }

  try {

  const { template: dbTemplate, bddSpec, originalRequirements, actionsYml } = await getTemplateAndBddSpec(sessionId)
  const template = state.uiuxPreparedTemplate || dbTemplate
  const pages = template.pageStructure.pages || ['home']
  const twConfig = generateTailwindConfig(uiuxDesignSystem)

  // ===== Resume 支援：根據 uiuxCodePhase 跳過已完成階段 =====
  const PHASE_ORDER: Record<string, number> = { structure: 0, animation: 1, rwd: 2, quality_gate: 3, complete: 4 }
  const resumePhase = state.uiuxCodePhase || 'structure'
  const resumeIndex = PHASE_ORDER[resumePhase] ?? 0
  let currentCode = state.uiuxGeneratedCode || { pages: [], components: [], styles: '' }

  if (resumeIndex > 0 && (currentCode.pages.length > 0 || currentCode.components.length > 0)) {
    const pageCount = currentCode.pages.length
    const compCount = currentCode.components.length
    logger.info(`Pipeline 從 ${resumePhase} 階段恢復（已有 ${pageCount} 頁 ${compCount} 組件）`)
    await sendMessage(conversationId, io, {
      content: `正在從中斷點恢復生成（已完成 ${pageCount} 個頁面），繼續處理中...`,
      stage: 'uiux_pipeline_progress',
      progress: { current: resumeIndex, total: 3, step: '恢復生成' },
    })
  } else {
    await sendMessage(conversationId, io, {
      content: '正在生成設計中，請稍候...',
      stage: 'uiux_pipeline_progress',
      progress: { current: 1, total: 3, step: '生成中' },
    })
  }

  // ===== BDD→UI 翻譯（有快取跳過）=====
  let uiSpec = state.uiuxUISpec
  if (!uiSpec && bddSpec) {
    logger.info('Pipeline 開始 BDD→UI 翻譯...')
    const translateResult = await translateBddToUISpec(bddSpec, originalRequirements, { userId: state.userId, conversationId }, actionsYml)
    if (translateResult.success && translateResult.spec) {
      uiSpec = translateResult.spec
      state.uiuxUISpec = uiSpec
      await saveFlowState(redis, conversationId, state)
      logger.info(`BDD→UI 翻譯完成: ${uiSpec.pages.length} 頁面`)
    } else {
      logger.warn({ err: translateResult.error }, 'BDD→UI 翻譯失敗，嘗試從原始需求生成...')
      if (originalRequirements) {
        const fallbackResult = await translateBddToUISpec('', originalRequirements, { userId: state.userId, conversationId })
        if (fallbackResult.success && fallbackResult.spec) {
          uiSpec = fallbackResult.spec
          state.uiuxUISpec = uiSpec
          await saveFlowState(redis, conversationId, state)
          logger.info(`原始需求→UI 翻譯完成: ${uiSpec.pages.length} 頁面`)
        } else {
          logger.warn('原始需求→UI 翻譯也失敗，降級用原始 bddSpec')
        }
      }
    }
  }

  // ===== 階段 1/3：結構（尚未完成時才執行）=====
  if (resumeIndex <= 0) {
    // 相關假圖白名單（fail-safe：失敗不阻塞 pipeline）
    if (!state.uiuxImageLibrary) {
      const productType = (template as any).category || state.fastModeProductType || 'landing'
      try {
        state.uiuxImageLibrary = await getImageLibraryOrFallback(productType, { locale: state.locale })
        await saveFlowState(redis, conversationId, state)
      } catch (err) {
        logger.warn({ err }, 'imageLibrary 載入失敗（降級跳過）')
      }
    }

    const structureResult = await generateStructure(
      uiuxDesignSystem,
      pages,
      template,
      bddSpec,
      state.uiuxDesignTier,
      {
        originalRequirements,
        designIdeas: state.uiuxDesignIdeas,
        designBrief: state.uiuxDesignBrief,
        uiSpec,
        variantConcept: state.uiuxVariantConcept,
        templateOverrides: state.templateOverrides,
        referenceAnalysis: state.uiuxReferenceAnalysis,
        moodId: state.uiuxDesignMood,
        generationProfile: 'balanced',
        imageLibrary: state.uiuxImageLibrary,
        projectSeed: state.projectId,
      },
      { userId: state.userId, conversationId, purpose: 'uiux_structure' },
      makeStreamingCallback(conversationId, io, redis, 'structure', twConfig),
      () => void touchFlowActivity(redis, conversationId),
      // Checkpoint：Structure 生成中途持久化到 FlowState
      async (partial) => {
        state.uiuxGeneratedCode = { pages: partial.pages, components: partial.components, styles: partial.styles }
        await saveFlowState(redis, conversationId, state)
      },
    )

    if (!structureResult.success) {
      logger.error({ err: structureResult.error }, 'Pipeline 結構生成失敗')
      state.phase = 'uiux_variant_selection'
      state.uiuxCodePhase = undefined
      await saveFlowState(redis, conversationId, state)
      await sendMessage(conversationId, io, {
        content: `生成失敗：${structureResult.error}\n\n請重新選擇變體，或輸入「重試」再試一次。`,
        stage: 'error',
      })
      return
    }

    currentCode = {
      pages: structureResult.pages || [],
      components: structureResult.components || [],
      styles: structureResult.styles || '',
    }

    // ── Pipeline guard：Structure 完成後檢查 phase 是否仍由本 job 持有 ──
    if (!(await checkPipelineStillOwned())) return

    // ── Structure 中途存檔（防止後續階段中斷丟失進度）──
    state.uiuxGeneratedCode = currentCode
    state.uiuxStructureCode = currentCode
    state.uiuxCodePhase = 'animation'
    state.uiuxCodeGenerationStartedAt = Date.now() // 重設超時計時器
    await saveFlowState(redis, conversationId, state)
    await updateBddSession({
      sessionId,
      updates: {
        generatedPages: currentCode.pages,
        generatedComponents: currentCode.components,
        generatedStyles: currentCode.styles,
      },
    })
    if (state.projectId) {
      await db.upsertProjectFiles(state.projectId, 'uiux',
        generatedCodeToFileRows(currentCode, state.uiuxDesignSystem))
    }
  }

  // UISpec 摘要（Animation + RWD 共用）
  const pipelineUiSpecSummary = state.uiuxUISpec ? buildUISpecSummary(state.uiuxUISpec) : undefined

  // ===== 階段 2/3：動畫（animation 尚未完成時才執行）=====
  if (resumeIndex <= 1) {
    const animationResult = await generateAnimations(
      uiuxDesignSystem,
      currentCode,
      state.uiuxDesignTier,
      { userId: state.userId, conversationId, purpose: 'uiux_animation' },
      makeStreamingCallback(conversationId, io, redis, 'animation', twConfig),
      state.uiuxVariantConcept,
      pipelineUiSpecSummary,
      state.uiuxDesignMood,
      undefined,
      'balanced',
      async (partial) => { state.uiuxGeneratedCode = partial; await saveFlowState(redis, conversationId, state) },
    )

    if (animationResult.success) {
      currentCode = {
        pages: animationResult.pages || currentCode.pages,
        components: animationResult.components || currentCode.components,
        styles: animationResult.styles || currentCode.styles,
      }
    } else {
      logger.warn({ err: animationResult.error }, 'Pipeline 動畫生成失敗，使用結構代碼繼續')
    }

    // ── Pipeline guard：Animation 完成後檢查 phase 是否仍由本 job 持有 ──
    if (!(await checkPipelineStillOwned())) return

    // ── Animation 中途存檔 ──
    state.uiuxGeneratedCode = currentCode
    state.uiuxAnimationCode = currentCode
    state.uiuxCodePhase = 'rwd'
    state.uiuxCodeGenerationStartedAt = Date.now() // 重設超時計時器
    await saveFlowState(redis, conversationId, state)
    await updateBddSession({
      sessionId,
      updates: {
        generatedPages: currentCode.pages,
        generatedComponents: currentCode.components,
        generatedStyles: currentCode.styles,
      },
    })
    if (state.projectId) {
      await db.upsertProjectFiles(state.projectId, 'uiux',
        generatedCodeToFileRows(currentCode, state.uiuxDesignSystem))
    }
  }

  // ===== 階段 3/3：響應式 =====
  const rwdResult = await generateRwd(
    uiuxDesignSystem,
    currentCode,
    state.uiuxDesignTier,
    { userId: state.userId, conversationId, purpose: 'uiux_rwd' },
    makeStreamingCallback(conversationId, io, redis, 'rwd', twConfig),
    state.uiuxVariantConcept,
    pipelineUiSpecSummary,
    undefined,
    state.uiuxDesignMood,
    undefined,
    'balanced',
    async (partial) => { state.uiuxGeneratedCode = partial; await saveFlowState(redis, conversationId, state) },
  )

  if (rwdResult.success) {
    currentCode = {
      pages: rwdResult.pages || currentCode.pages,
      components: rwdResult.components || currentCode.components,
      styles: rwdResult.styles || currentCode.styles,
    }
  } else {
    logger.warn({ err: rwdResult.error }, 'Pipeline RWD 生成失敗，使用動畫代碼繼續')
  }

  // ── Pipeline guard：RWD 完成後、QG 前檢查 phase 是否仍由本 job 持有 ──
  if (!(await checkPipelineStillOwned())) return

  // ===== Quality Gate（靜默執行）=====
  const MAX_FIX_ATTEMPTS = 3
  let report = runQualityGate(currentCode, state.uiuxDesignTier, state.uiuxDesignMood)
  let totalAutoFixed = 0

  for (let attempt = 0; attempt < MAX_FIX_ATTEMPTS && !report.passed; attempt++) {
    let criticalIssues = [
      ...report.categories.a11y.issues,
      ...report.categories.performance.issues,
      ...report.categories.code_quality.issues,
    ].filter(i => i.severity === 'critical')

    if (criticalIssues.length === 0) break

    logger.info(`Pipeline QG 修復 ${attempt + 1}/${MAX_FIX_ATTEMPTS}`)

    const qgTrackingContext = { userId: state.userId, conversationId, projectId: state.projectId }
    const ruleFixed = autoFixCriticalIssuesRuleBased(currentCode, criticalIssues, qgTrackingContext)
    if (ruleFixed) {
      currentCode = ruleFixed
      report = runQualityGate(currentCode, state.uiuxDesignTier, state.uiuxDesignMood)
      criticalIssues = [
        ...report.categories.a11y.issues,
        ...report.categories.performance.issues,
        ...report.categories.code_quality.issues,
      ].filter(i => i.severity === 'critical')
      if (criticalIssues.length === 0) {
        totalAutoFixed += 1
        break
      }
    }

    const fixedCode = await autoFixCriticalIssues(currentCode, criticalIssues, qgTrackingContext)
    if (!fixedCode) break

    totalAutoFixed += criticalIssues.length
    currentCode = fixedCode
    report = runQualityGate(currentCode, state.uiuxDesignTier, state.uiuxDesignMood)
  }

  report.summary.autoFixed = totalAutoFixed

  // ===== 黑盒 Evaluator 二階段 QA（PR1 Harness Engineering）=====
  // 獨立驗收軌道：看不到 tsx 代碼，只從 screenshot + DOM outline 判斷可用性
  // flag off 時完全跳過迴圈，避免 generateTailwindConfig 白算
  if (getEnv().ENABLE_UI_EVALUATOR) {
    const MAX_EVAL_ATTEMPTS = 2
    const evalTwConfig = generateTailwindConfig(uiuxDesignSystem)
    const qgTrackingContextEval = { userId: state.userId, conversationId, projectId: state.projectId }
    for (let evalAttempt = 0; evalAttempt < MAX_EVAL_ATTEMPTS; evalAttempt++) {
      const evalResult = await evaluateUi({
        code: currentCode,
        tailwindConfig: evalTwConfig,
        tier: state.uiuxDesignTier,
        bddBrief: state.uiuxDesignBrief?.styleSummary,
        trackingContext: { userId: state.userId ?? undefined, conversationId },
      })

      // softFail（preview 失敗 / LLM 失敗）→ 不阻塞
      if (evalResult.softFail || evalResult.report.passed) break

      const evalIssues = evalResult.report.issues.filter(i => i.severity === 'critical')
      if (evalIssues.length === 0) break

      logger.info({ evalAttempt, issueCount: evalIssues.length }, 'Evaluator 發現 critical 問題，嘗試 Generator 修復')

      const qualityIssues: QualityIssue[] = evalIssues.map((i: UiEvaluationIssue, idx: number) => ({
        id: `eval-${evalAttempt}-${idx}`,
        category: 'code_quality',
        severity: 'critical',
        rule: `evaluator_${i.category}`,
        message: `[Evaluator] ${i.description}（路由 ${i.route}）`,
        file: i.route,
        suggestion: '請從使用者視角修復此問題，不要只是改 class 名稱',
      }))

      const evalFixed = await autoFixCriticalIssues(currentCode, qualityIssues, qgTrackingContextEval)
      if (!evalFixed) break
      currentCode = evalFixed
      totalAutoFixed += evalIssues.length
    }

    report.summary.autoFixed = totalAutoFixed
  }

  // ===== 保存最終結果 =====
  state.uiuxGeneratedCode = currentCode
  state.uiuxQualityReport = report
  state.uiuxCodePhase = 'complete'
  state.phase = 'uiux_complete'
  state.waitingForReply = false
  await saveFlowState(redis, conversationId, state)

  // Credit 扣除：UIUX 完整管線額外成本（base 已在入口扣除）
  if (state.userId) {
    await deductCredits(state.userId, CREDIT_COSTS.UIUX_PIPELINE - CREDIT_COSTS.BASE_MESSAGE)
  }

  await updateBddSession({
    sessionId,
    updates: {
      generatedPages: currentCode.pages,
      generatedComponents: currentCode.components,
      generatedStyles: currentCode.styles,
      currentPhase: 'uiux_complete',
    },
  })

  if (state.projectId) {
    // 代碼已過 QG + L1 防禦，屬於「最終 stable 版本」→ 建立 LKG 快照
    await db.upsertProjectFiles(state.projectId, 'uiux',
      generatedCodeToFileRows(currentCode, state.uiuxDesignSystem),
      'passed')
    await snapshotCodeToGeneration(state.projectId, {
      changeSummary: 'UIUX 設計完成',
      conversationId,
    })
  }

  // ===== 清除 streaming preview =====
  await redis.del(`streaming:preview:${conversationId}`).catch(() => {})

  // ===== 最終完成訊息 =====
  const tailwindConfig = generateTailwindConfig(uiuxDesignSystem)
  const finalPageCount = currentCode.pages.length
  const finalComponentCount = currentCode.components.length

  await sendMessage(conversationId, io, {
    content: await (async () => {
      const base = `設計完成！共 ${finalPageCount} 個頁面、${finalComponentCount} 個組件。`
      if (await shouldShowCoderButton(state)) {
        return base + `\n\n下一步：點擊「**生成後端**」讓 AI 自動開發後端邏輯並連接資料庫，再部署上線。`
      }
      return base + `輸入「**部署**」即可上線。`
    })(),
    stage: 'uiux_generation_complete',
    progress: { current: 3, total: 3, step: '完成' },
    layoutHint: 'split',
    richContent: {
      type: 'code_preview',
      data: (() => {
        const s = sanitizeForPreview({ pages: currentCode.pages, components: currentCode.components, styles: currentCode.styles })
        return { pages: s.code.pages, components: s.code.components, styles: s.code.styles, tailwindConfig, currentPhase: 'complete' }
      })() as Record<string, unknown>,
    },
    quickReplies: await (async () => {
      const showCoder = await shouldShowCoderButton(state)
      if (showCoder) {
        // 有 DB 時：接上資料庫優先，部署次要
        return [
          { label: '生成後端', value: '__connect_database__', style: 'primary' as const },
          { label: '先部署前端', value: '部署', style: 'secondary' as const },
          { label: '上傳到模板庫', value: '__upload_template__', style: 'ghost' as const },
        ]
      }
      return [
        { label: '部署上線', value: '部署', style: 'primary' as const },
        { label: '上傳到模板庫', value: '__upload_template__', style: 'ghost' as const },
      ]
    })(),
  })

  logger.info(`Pipeline 完成: ${finalPageCount} pages, ${finalComponentCount} components, QG passed=${report.passed}`)

  } finally {
    clearInterval(heartbeatInterval)
  }
}

/**
 * 階段 1：生成結構（保留供獨立調用）
 */
async function executeCodePhaseStructure(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: IoEmitter
) {
  const { sessionId, uiuxDesignSystem } = state

  if (!sessionId || !uiuxDesignSystem) {
    logger.error('缺少必要的狀態數據')
    return
  }

  // 發送生成中訊息
  await sendMessage(conversationId, io, {
    content: `**階段 1/3：結構生成**\n\n正在生成頁面結構和基礎樣式（桌面版）...`,
    stage: 'uiux_structure_generating',
    progress: { current: 1, total: 3, step: '生成結構' },
  })

  // 取得模板和 BDD 規格
  const { template: dbTemplate, bddSpec, originalRequirements, actionsYml } = await getTemplateAndBddSpec(sessionId)

  // 優先使用 FlowState 中的 uiuxPreparedTemplate（包含用戶的設計偏好和正確的頁面結構）
  const template = state.uiuxPreparedTemplate || dbTemplate

  // BDD→UI 翻譯（有快取跳過）
  let structUISpec = state.uiuxUISpec
  if (!structUISpec && bddSpec) {
    const translateResult = await translateBddToUISpec(bddSpec, originalRequirements, { userId: state.userId, conversationId }, actionsYml)
    if (translateResult.success && translateResult.spec) {
      structUISpec = translateResult.spec
      state.uiuxUISpec = structUISpec
      await saveFlowState(redis, conversationId, state)
    }
  }

  // 生成結構
  const pages = template.pageStructure.pages || ['home']
  const twCfg = generateTailwindConfig(uiuxDesignSystem)

  // 相關假圖白名單（fail-safe）
  if (!state.uiuxImageLibrary) {
    const productType = (template as any).category || state.fastModeProductType || 'landing'
    try {
      state.uiuxImageLibrary = await getImageLibraryOrFallback(productType, { locale: state.locale })
      await saveFlowState(redis, conversationId, state)
    } catch (err) {
      logger.warn({ err }, 'imageLibrary 載入失敗（降級跳過）')
    }
  }

  const structureResult = await generateStructure(
    uiuxDesignSystem,
    pages,
    template,
    bddSpec,
    state.uiuxDesignTier,
    {
      originalRequirements,
      designIdeas: state.uiuxDesignIdeas,
      designBrief: state.uiuxDesignBrief,
      uiSpec: structUISpec,
      variantConcept: state.uiuxVariantConcept,
      referenceAnalysis: state.uiuxReferenceAnalysis,
      moodId: state.uiuxDesignMood,
      generationProfile: 'balanced',
      imageLibrary: state.uiuxImageLibrary,
      projectSeed: state.projectId,
    },
    { userId: state.userId, conversationId, purpose: 'uiux_structure' },
    makeStreamingCallback(conversationId, io, redis, 'structure', twCfg),
    () => void touchFlowActivity(redis, conversationId),
    // Checkpoint：Structure 生成中途持久化到 FlowState
    async (partial) => {
      state.uiuxGeneratedCode = { pages: partial.pages, components: partial.components, styles: partial.styles }
      await saveFlowState(redis, conversationId, state)
    },
  )

  if (!structureResult.success) {
    logger.error({ err: structureResult.error }, '結構生成失敗')
    await sendMessage(conversationId, io, {
      content: `結構生成失敗：${structureResult.error}。請稍後再試。`,
      stage: 'error',
    })
    return
  }

  // 保存生成結果
  const generatedCode = {
    pages: structureResult.pages || [],
    components: structureResult.components || [],
    styles: structureResult.styles || '',
  }

  state.uiuxGeneratedCode = generatedCode
  state.uiuxStructureCode = generatedCode  // 保存快照供 redo 時回溯
  state.uiuxCodePhase = 'structure'
  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)

  // 保存到 BDD Session
  await updateBddSession({
    sessionId,
    updates: {
      generatedPages: generatedCode.pages,
      generatedComponents: generatedCode.components,
      generatedStyles: generatedCode.styles,
    },
  })

  // 同步寫入 project_files（獨立存儲）
  if (state.projectId) {
    await db.upsertProjectFiles(state.projectId, 'uiux',
      generatedCodeToFileRows(generatedCode, state.uiuxDesignSystem))
  }

  // 清除 streaming preview
  await redis.del(`streaming:preview:${conversationId}`).catch(() => {})

  // 發送完成訊息，等待用戶確認
  const pageCount = generatedCode.pages.length
  const componentCount = generatedCode.components.length

  await sendMessage(conversationId, io, {
    content: `**階段 1/3 完成：結構**\n\n已生成：\n- ${pageCount} 個頁面\n- ${componentCount} 個組件\n- 全域樣式\n\n這是靜態的桌面版結構，請在預覽面板查看。\n\n---\n\n✅ **繼續** - 添加動畫效果\n🔄 **重新生成** - 重做這個階段`,
    stage: 'uiux_structure_complete',
    progress: { current: 1, total: 3, step: '結構完成' },
    layoutHint: 'split',
    richContent: {
      type: 'code_preview',
      data: {
        pages: generatedCode.pages,
        components: generatedCode.components,
        styles: generatedCode.styles,
        tailwindConfig: generateTailwindConfig(uiuxDesignSystem),
        currentPhase: 'structure',
      } as Record<string, unknown>,
    },
  })

  logger.info(`結構生成完成: ${pageCount} pages, ${componentCount} components`)
}

/**
 * 階段 2：添加動畫
 */
async function executeCodePhaseAnimation(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: IoEmitter
) {
  const { sessionId, uiuxDesignSystem, uiuxGeneratedCode } = state

  if (!sessionId || !uiuxDesignSystem || !uiuxGeneratedCode) {
    logger.error('缺少必要的狀態數據')
    return
  }

  // 發送生成中訊息
  await sendMessage(conversationId, io, {
    content: `**階段 2/3：動畫增強**\n\n正在添加動畫效果（入場動畫、hover 效果、狀態轉換）...`,
    stage: 'uiux_animation_generating',
    progress: { current: 2, total: 3, step: '添加動畫' },
  })

  // 生成動畫
  const animTwCfg = generateTailwindConfig(uiuxDesignSystem)
  const stepUiSpecSummary = state.uiuxUISpec ? buildUISpecSummary(state.uiuxUISpec) : undefined
  const animationResult = await generateAnimations(
    uiuxDesignSystem,
    uiuxGeneratedCode,
    state.uiuxDesignTier,
    { userId: state.userId, conversationId, purpose: 'uiux_animation' },
    makeStreamingCallback(conversationId, io, redis, 'animation', animTwCfg),
    state.uiuxVariantConcept,
    stepUiSpecSummary,
    state.uiuxDesignMood,
    undefined,
    'balanced',
    async (partial) => { state.uiuxGeneratedCode = partial; await saveFlowState(redis, conversationId, state) },
  )

  if (!animationResult.success) {
    logger.error({ err: animationResult.error }, '動畫生成失敗')
    await sendMessage(conversationId, io, {
      content: `動畫生成失敗：${animationResult.error}。您可以選擇繼續或重試。`,
      stage: 'error',
    })
    return
  }

  // 更新生成結果
  const generatedCode = {
    pages: animationResult.pages || uiuxGeneratedCode.pages,
    components: animationResult.components || uiuxGeneratedCode.components,
    styles: animationResult.styles || uiuxGeneratedCode.styles,
  }

  state.uiuxGeneratedCode = generatedCode
  state.uiuxAnimationCode = generatedCode  // 保存快照供 redo 時回溯
  state.uiuxCodePhase = 'animation'
  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)

  // 保存到 BDD Session
  await updateBddSession({
    sessionId,
    updates: {
      generatedPages: generatedCode.pages,
      generatedComponents: generatedCode.components,
      generatedStyles: generatedCode.styles,
    },
  })

  // 同步寫入 project_files（獨立存儲）
  if (state.projectId) {
    await db.upsertProjectFiles(state.projectId, 'uiux',
      generatedCodeToFileRows(generatedCode, state.uiuxDesignSystem))
  }

  // 清除 streaming preview
  await redis.del(`streaming:preview:${conversationId}`).catch(() => {})

  // 發送完成訊息
  await sendMessage(conversationId, io, {
    content: `**階段 2/3 完成：動畫**\n\n已添加：\n- 頁面入場動畫\n- 按鈕 hover/tap 效果\n- 卡片懸浮效果\n- Loading 動畫\n\n請在預覽面板查看動畫效果。\n\n---\n\n✅ **繼續** - 添加響應式設計\n🔄 **重新生成** - 重做動畫`,
    stage: 'uiux_animation_complete',
    progress: { current: 2, total: 3, step: '動畫完成' },
    layoutHint: 'split',
    richContent: {
      type: 'code_preview',
      data: {
        pages: generatedCode.pages,
        components: generatedCode.components,
        styles: generatedCode.styles,
        tailwindConfig: generateTailwindConfig(uiuxDesignSystem),
        currentPhase: 'animation',
      } as Record<string, unknown>,
    },
  })

  logger.info('動畫生成完成')
}

/**
 * 階段 3：添加響應式設計
 */
async function executeCodePhaseRwd(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: IoEmitter
) {
  const { sessionId, uiuxDesignSystem, uiuxGeneratedCode } = state

  if (!sessionId || !uiuxDesignSystem || !uiuxGeneratedCode) {
    logger.error('缺少必要的狀態數據')
    return
  }

  // 發送生成中訊息
  await sendMessage(conversationId, io, {
    content: `**階段 3/3：響應式設計**\n\n正在添加響應式佈局（移動端適配、漢堡選單、觸控優化）...`,
    stage: 'uiux_rwd_generating',
    progress: { current: 3, total: 3, step: '響應式設計' },
  })

  // 生成響應式設計
  const rwdTwCfg = generateTailwindConfig(uiuxDesignSystem)
  const rwdStepUiSpecSummary = state.uiuxUISpec ? buildUISpecSummary(state.uiuxUISpec) : undefined
  const rwdResult = await generateRwd(
    uiuxDesignSystem,
    uiuxGeneratedCode,
    state.uiuxDesignTier,
    { userId: state.userId, conversationId, purpose: 'uiux_rwd' },
    makeStreamingCallback(conversationId, io, redis, 'rwd', rwdTwCfg),
    state.uiuxVariantConcept,
    rwdStepUiSpecSummary,
    undefined,
    state.uiuxDesignMood,
    undefined,
    'balanced',
    async (partial) => { state.uiuxGeneratedCode = partial; await saveFlowState(redis, conversationId, state) },
  )

  if (!rwdResult.success) {
    logger.error({ err: rwdResult.error }, '響應式設計生成失敗')
    await sendMessage(conversationId, io, {
      content: `響應式設計生成失敗：${rwdResult.error}。您可以選擇完成或重試。`,
      stage: 'error',
    })
    return
  }

  // 更新生成結果
  const generatedCode = {
    pages: rwdResult.pages || uiuxGeneratedCode.pages,
    components: rwdResult.components || uiuxGeneratedCode.components,
    styles: rwdResult.styles || uiuxGeneratedCode.styles,
  }

  state.uiuxGeneratedCode = generatedCode
  state.uiuxCodePhase = 'quality_gate'
  state.phase = 'uiux_quality_gate'
  state.waitingForReply = false
  await saveFlowState(redis, conversationId, state)

  logger.info('RWD 完成，觸發 Quality Gate')

  // 觸發 Quality Gate
  await executeQualityGate(conversationId, state, redis, io)
}

/**
 * Quality Gate：自動品質檢查 + 修復
 */
export async function executeQualityGate(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: IoEmitter
) {
  const { sessionId, uiuxDesignSystem, uiuxGeneratedCode } = state

  if (!sessionId || !uiuxDesignSystem || !uiuxGeneratedCode) {
    logger.error('Quality Gate 缺少必要的狀態數據')
    return
  }

  // 發送品質檢查進度訊息
  await sendMessage(conversationId, io, {
    content: '**品質檢查中...**\n\n正在檢查 A11y / Performance / SEO / Code Quality...',
    stage: 'uiux_quality_gate_running',
    progress: { current: 3, total: 3, step: '品質檢查' },
  })

  const MAX_FIX_ATTEMPTS = 3
  let currentCode = { ...uiuxGeneratedCode }
  let report = runQualityGate(currentCode, state.uiuxDesignTier, state.uiuxDesignMood)
  let totalAutoFixed = 0

  // 自動修復循環
  for (let attempt = 0; attempt < MAX_FIX_ATTEMPTS && !report.passed; attempt++) {
    let criticalIssues = [
      ...report.categories.a11y.issues,
      ...report.categories.performance.issues,
      ...report.categories.code_quality.issues,
    ].filter(i => i.severity === 'critical')

    if (criticalIssues.length === 0) break

    logger.info(`Quality Gate 修復嘗試 ${attempt + 1}/${MAX_FIX_ATTEMPTS}，${criticalIssues.length} 個 critical issues`)

    await sendMessage(conversationId, io, {
      content: `發現 ${criticalIssues.length} 個 critical 問題，正在自動修復（第 ${attempt + 1} 輪）...`,
      stage: 'uiux_quality_gate_fixing',
    })

    const qgTrackingContext2 = { userId: state.userId, conversationId, projectId: state.projectId }
    const ruleFixed = autoFixCriticalIssuesRuleBased(currentCode, criticalIssues, qgTrackingContext2)
    if (ruleFixed) {
      currentCode = ruleFixed
      report = runQualityGate(currentCode, state.uiuxDesignTier, state.uiuxDesignMood)
      criticalIssues = [
        ...report.categories.a11y.issues,
        ...report.categories.performance.issues,
        ...report.categories.code_quality.issues,
      ].filter(i => i.severity === 'critical')
      if (criticalIssues.length === 0) {
        totalAutoFixed += 1
        break
      }
    }

    const fixedCode = await autoFixCriticalIssues(currentCode, criticalIssues, qgTrackingContext2)
    if (!fixedCode) {
      logger.error('Quality Gate autoFix 失敗')
      break
    }

    totalAutoFixed += criticalIssues.length
    currentCode = fixedCode
    report = runQualityGate(currentCode, state.uiuxDesignTier, state.uiuxDesignMood)
  }

  // 更新 autoFixed 計數
  report.summary.autoFixed = totalAutoFixed

  // ===== 黑盒 Evaluator 二階段 QA（PR1）=====
  if (getEnv().ENABLE_UI_EVALUATOR) {
    const MAX_EVAL_ATTEMPTS_2 = 2
    const evalTwConfig2 = generateTailwindConfig(uiuxDesignSystem)
    for (let evalAttempt = 0; evalAttempt < MAX_EVAL_ATTEMPTS_2; evalAttempt++) {
      const evalResult = await evaluateUi({
        code: currentCode,
        tailwindConfig: evalTwConfig2,
        tier: state.uiuxDesignTier,
        bddBrief: state.uiuxDesignBrief?.styleSummary,
        trackingContext: { userId: state.userId ?? undefined, conversationId },
      })
      if (evalResult.softFail || evalResult.report.passed) break
      const evalIssues = evalResult.report.issues.filter(i => i.severity === 'critical')
      if (evalIssues.length === 0) break
      const qualityIssues: QualityIssue[] = evalIssues.map((i: UiEvaluationIssue, idx: number) => ({
        id: `eval-alt-${evalAttempt}-${idx}`,
        category: 'code_quality',
        severity: 'critical',
        rule: `evaluator_${i.category}`,
        message: `[Evaluator] ${i.description}（路由 ${i.route}）`,
        file: i.route,
        suggestion: '請從使用者視角修復此問題',
      }))
      const evalFixed = await autoFixCriticalIssues(currentCode, qualityIssues, { userId: state.userId, conversationId, projectId: state.projectId })
      if (!evalFixed) break
      currentCode = evalFixed
      totalAutoFixed += evalIssues.length
    }
    report.summary.autoFixed = totalAutoFixed
  }

  // 更新代碼和報告到 state
  state.uiuxGeneratedCode = currentCode
  state.uiuxQualityReport = report
  state.uiuxCodePhase = 'complete'
  state.phase = 'uiux_complete'
  await saveFlowState(redis, conversationId, state)

  // 保存最終結果到 BDD Session
  await updateBddSession({
    sessionId,
    updates: {
      generatedPages: currentCode.pages,
      generatedComponents: currentCode.components,
      generatedStyles: currentCode.styles,
      currentPhase: 'uiux_complete',
    },
  })

  // 同步寫入 project_files（獨立存儲）
  if (state.projectId) {
    await db.upsertProjectFiles(state.projectId, 'uiux',
      generatedCodeToFileRows(currentCode, state.uiuxDesignSystem))
  }

  // 發送品質報告
  const passedText = report.passed ? '通過' : '未通過'
  const fixedText = totalAutoFixed > 0 ? `\n已自動修復 ${totalAutoFixed} 個問題。` : ''

  await sendMessage(conversationId, io, {
    content: `**品質檢查${passedText}**\n\n共發現 ${report.summary.total} 個問題（Critical: ${report.summary.critical} / Warning: ${report.summary.warning} / Info: ${report.summary.info}）${fixedText}`,
    stage: 'uiux_quality_gate_complete',
    richContent: {
      type: 'quality_gate_report',
      data: report as unknown as Record<string, unknown>,
    },
  })

  // 生成 Tailwind 配置
  const tailwindConfig = generateTailwindConfig(uiuxDesignSystem)

  // 發送最終完成訊息
  const pageCount = currentCode.pages.length
  const componentCount = currentCode.components.length

  await sendMessage(conversationId, io, {
    content: `**程式碼生成完成！**\n\n已生成：\n- ${pageCount} 個頁面（含響應式）\n- ${componentCount} 個組件（含動畫）\n- 全域樣式 (globals.css)\n- Tailwind 配置\n\n品質檢查${report.passed ? '通過' : '完成'}${totalAutoFixed > 0 ? `，已自動修復 ${totalAutoFixed} 個問題` : ''}\n\n---\n\n🚀 輸入「**部署**」即可將網站部署上線`,
    stage: 'uiux_generation_complete',
    progress: { current: 3, total: 3, step: '完成' },
    layoutHint: 'split',
    richContent: {
      type: 'code_preview',
      data: (() => {
        const s = sanitizeForPreview({ pages: currentCode.pages, components: currentCode.components, styles: currentCode.styles })
        return { pages: s.code.pages, components: s.code.components, styles: s.code.styles, tailwindConfig, currentPhase: 'complete' }
      })() as Record<string, unknown>,
    },
  })

  logger.info(`Quality Gate 完成: passed=${report.passed}, issues=${report.summary.total}, autoFixed=${totalAutoFixed}`)
}

/**
 * 處理階段確認（繼續到下一階段）
 */
export async function handleCodePhaseConfirm(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: IoEmitter
) {
  const { uiuxCodePhase } = state

  logger.info(`確認當前階段: ${uiuxCodePhase}`)

  switch (uiuxCodePhase) {
    case 'structure':
      // 繼續到動畫階段
      await executeCodePhaseAnimation(conversationId, state, redis, io)
      break
    case 'animation':
      // 繼續到響應式階段
      await executeCodePhaseRwd(conversationId, state, redis, io)
      break
    case 'complete':
      // 已經完成
      await sendMessage(conversationId, io, {
        content: '程式碼生成已完成。您可以在預覽面板查看和複製代碼。',
        stage: 'uiux_complete',
      })
      break
    default:
      await sendMessage(conversationId, io, {
        content: '當前沒有進行中的生成階段。',
        stage: 'error',
      })
  }
}

/**
 * 處理階段重做
 */
export async function handleCodePhaseRedo(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: IoEmitter
) {
  const { uiuxCodePhase } = state

  logger.info(`重做當前階段: ${uiuxCodePhase}`)

  // 恢復上一階段的代碼快照，確保 redo 是在乾淨的基礎上重做
  if (uiuxCodePhase === 'animation' && state.uiuxStructureCode) {
    state.uiuxGeneratedCode = state.uiuxStructureCode
  }

  switch (uiuxCodePhase) {
    case 'structure':
      await executeCodePhaseStructure(conversationId, state, redis, io)
      break
    case 'animation':
      await executeCodePhaseAnimation(conversationId, state, redis, io)
      break
    default:
      await sendMessage(conversationId, io, {
        content: '當前沒有可重做的階段。',
        stage: 'error',
      })
  }
}

/**
 * 取得模板和 BDD 規格
 */
async function getTemplateAndBddSpec(sessionId: string): Promise<{
  template: TemplateData
  bddSpec: string
  originalRequirements: string
  actionsYml?: string
}> {
  const session = await getBddSession({ sessionId })
  if (!session.success || !session.data) {
    return {
      template: {
        id: 'default',
        name: 'Default',
        slug: 'default',
        category: 'general',
        description: '預設模板',
        designDefaults: {},
        pageStructure: { pages: ['home'], components: [] },
      },
      bddSpec: '',
      originalRequirements: '',
    }
  }

  let template: TemplateData = {
    id: 'default',
    name: 'Default',
    slug: 'default',
    category: 'general',
    description: '預設模板',
    designDefaults: {},
    pageStructure: { pages: ['home'], components: [] },
  }

  if (session.data.uiuxTemplateId) {
    const templateResult = await db.queryOne<{
      id: string
      name: string
      slug: string
      category: string
      description: string
      design_defaults: unknown
      page_structure: unknown
    }>(
      `SELECT id, name, slug, category, description, design_defaults, page_structure
       FROM templates WHERE id::text = $1`,
      [session.data.uiuxTemplateId]
    )

    if (templateResult) {
      template = {
        id: templateResult.id,
        name: templateResult.name,
        slug: templateResult.slug,
        category: templateResult.category,
        description: templateResult.description,
        designDefaults: templateResult.design_defaults as TemplateData['designDefaults'],
        pageStructure: templateResult.page_structure as TemplateData['pageStructure'],
      }
    }
  }

  const bddSpec = session.data.featuresContent
    ? session.data.featuresContent.map(f => f.content).join('\n\n---\n\n')
    : ''

  return {
    template,
    bddSpec,
    originalRequirements: session.data.originalRequirements || '',
    actionsYml: session.data.actionsYmlContent || undefined,
  }
}

/**
 * 處理確認使用模板
 * 當用戶確認使用當前預覽的模板時
 */
export async function handleConfirmTemplate(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: IoEmitter
) {
  // 如果已經有選擇的模板，直接進入變體生成
  if (state.uiuxTemplateId) {
    // 發送訊息讓用戶選擇變體
    await sendMessage(conversationId, io, {
      content: '請選擇您喜歡的設計方向，或輸入「選擇 A」直接使用該變體。',
      stage: 'uiux_prompt_variant_selection',
      quickReplies: [
        { label: '選擇 A', value: '選擇 A', style: 'ghost' },
        { label: '選擇 B', value: '選擇 B', style: 'ghost' },
        { label: '選擇 C', value: '選擇 C', style: 'ghost' },
        { label: '選擇 D', value: '選擇 D', style: 'ghost' },
        { label: '選擇 E', value: '選擇 E', style: 'ghost' },
      ],
    })
    return
  }

  await sendMessage(conversationId, io, {
    content: '請先選擇一個模板。',
    stage: 'uiux_prompt_template_selection',
  })
}

// ============================================================
// 設計偏好詢問與釐清
// ============================================================

/**
 * 處理設計偏好回覆
 * A = 有想法，進入設計釐清
 * B = 沒想法，顯示模板
 */
export async function handleDesignPreferenceReply(
  conversationId: string,
  state: FlowState,
  message: string,
  redis: Redis,
  io: IoEmitter
) {
  const trimmed = message.trim().toUpperCase()

  // 判斷用戶選擇
  const hasIdeas = trimmed === 'A' ||
    trimmed.startsWith('A.') ||
    message.includes('有想法') ||
    message.includes('想討論') ||
    message.includes('我想要')

  const noIdeas = trimmed === 'B' ||
    trimmed.startsWith('B.') ||
    message.includes('沒有') ||
    message.includes('看模板') ||
    message.includes('沒想法')

  if (hasIdeas) {
    // 進入設計釐清流程
    await startDesignClarify(conversationId, state, redis, io)
  } else if (noIdeas) {
    // 顯示模板選擇器
    await showTemplatePicker(conversationId, state, redis, io)
  } else {
    // 無法識別，視為有想法，把訊息當作第一個設計想法
    await startDesignClarifyWithInitialIdea(conversationId, state, message, redis, io)
  }
}

/**
 * 開始設計釐清流程
 */
async function startDesignClarify(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: IoEmitter
) {
  await sendMessage(conversationId, io, {
    content: `很好！讓我來了解你的設計想法。\n\n首先，請告訴我：\n\n**你希望產品給用戶什麼樣的感覺？**\n\n_例如：專業可靠、活潑有趣、簡約現代、溫暖親切..._`,
    stage: 'uiux_design_clarify',
    quickReplies: [
      { label: '← 返回重選', value: '__go_back__', style: 'ghost' },
    ],
  })

  // 初始化設計釐清狀態
  state.phase = 'uiux_design_clarify'
  state.lastStablePhase = 'uiux_design_clarify'
  state.uiuxDesignClarifyStep = 1
  state.uiuxDesignIdeas = []
  state.waitingForReply = true
  await saveFlowStateLight(redis, conversationId, state)
}

/**
 * 開始設計釐清流程，帶有初始想法
 */
async function startDesignClarifyWithInitialIdea(
  conversationId: string,
  state: FlowState,
  initialIdea: string,
  redis: Redis,
  io: IoEmitter
) {
  // 保存初始想法
  state.phase = 'uiux_design_clarify'
  state.uiuxDesignClarifyStep = 2
  state.uiuxDesignIdeas = [{ step: 'initial', answer: initialIdea }]

  await sendMessage(conversationId, io, {
    content: `收到！「${initialIdea}」\n\n接下來，請告訴我：\n\n**你有沒有喜歡的網站或 App 可以參考？**\n\n_可以提供名稱或網址，例如：Notion、Stripe、Apple..._`,
    stage: 'uiux_design_clarify',
    quickReplies: [
      { label: '← 返回重選', value: '__go_back__', style: 'ghost' },
    ],
  })

  state.waitingForReply = true
  await saveFlowStateLight(redis, conversationId, state)
}


/**
 * 處理設計釐清回覆
 */
export async function handleDesignClarifyReply(
  conversationId: string,
  state: FlowState,
  message: string,
  redis: Redis,
  io: IoEmitter,
  imageUrls?: string[]
) {
  const step = state.uiuxDesignClarifyStep || 1
  const ideas = state.uiuxDesignIdeas || []

  // 設計釐清問題序列
  const clarifyQuestions = [
    {
      step: 1,
      key: 'feeling',
      question: '你希望產品給用戶什麼樣的感覺？',
      hint: '例如：專業可靠、活潑有趣、簡約現代、溫暖親切...',
    },
    {
      step: 2,
      key: 'reference',
      question: '你有沒有喜歡的網站或 App 可以參考？',
      hint: '可以提供名稱或網址，例如：Notion、Stripe、Apple...也可以直接上傳參考截圖',
    },
    {
      step: 3,
      key: 'color',
      question: '你對顏色有什麼偏好嗎？',
      hint: '例如：藍色系、暖色調、黑白灰、品牌色是 #FF5733...',
    },
    {
      step: 4,
      key: 'layout',
      question: '你偏好什麼樣的佈局風格？',
      hint: '例如：簡潔留白、內容密集、卡片式、列表式...',
    },
  ]

  // 驗證並保存當前回答
  const currentQuestion = clarifyQuestions.find(q => q.step === step)
  if (currentQuestion) {
    const trimmedMsg = message.trim()

    // __skip__ → 跳過此題，不保存答案
    if (trimmedMsg === '__skip__') {
      // 不保存，直接進入下一題
    } else {
      // 語義閘門驗證回答品質
      const gatewayResult = await semanticGateway({
        phase: 'design_clarify',
        userMessage: trimmedMsg,
        designQuestion: currentQuestion,
        conversationId,
        userId: state.userId,
        locale: state.locale,
      }, state)

      if (!gatewayResult.accept) {
        state.semanticRejectCount = (state.semanticRejectCount || 0) + 1
        state.waitingForReply = true
        await saveFlowStateLight(redis, conversationId, state)
        await sendMessage(conversationId, io, {
          content: gatewayResult.guidanceMessage || '請重新回答。',
          stage: 'uiux_design_clarify',
          quickReplies: [
            { label: '跳過此題', value: '__skip__', style: 'ghost' },
            { label: '← 重來', value: '__go_back__', style: 'ghost' },
          ],
        })
        return
      }

      // 驗證通過，重置拒絕計數並保存答案
      state.semanticRejectCount = 0
      ideas.push({ step: currentQuestion.key, answer: trimmedMsg })
      state.uiuxDesignIdeas = ideas

      // Step 2 (reference)：保存上傳的參考圖片 URL
      if (currentQuestion.key === 'reference' && imageUrls?.length) {
        state.uiuxReferenceImageUrls = imageUrls
      }
    }
  }

  // 檢查是否還有下一個問題
  const nextQuestion = clarifyQuestions.find(q => q.step === step + 1)

  if (nextQuestion) {
    // 繼續下一個問題
    await sendMessage(conversationId, io, {
      content: `好的，收到！\n\n**${nextQuestion.question}**\n\n_${nextQuestion.hint}_`,
      stage: 'uiux_design_clarify',
      quickReplies: [
        { label: '跳過此題', value: '__skip__', style: 'ghost' },
        { label: '← 重來', value: '__go_back__', style: 'ghost' },
      ],
    })

    state.uiuxDesignClarifyStep = step + 1
    state.waitingForReply = true
    await saveFlowStateLight(redis, conversationId, state)
  } else {
    // 釐清完成，生成設計方案
    await completeDesignClarify(conversationId, state, redis, io)
  }
}

/**
 * 完成設計釐清，基於用戶想法生成設計變體
 */
export async function completeDesignClarify(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: IoEmitter
) {
  const ideas = state.uiuxDesignIdeas || []

  // 整理用戶的設計想法
  const designBrief = ideas.map(i => `- ${i.step}: ${i.answer}`).join('\n')

  await sendMessage(conversationId, io, {
    content: `太好了！收到你的設計想法：\n\n${designBrief}\n\n讓我整理一下方向...`,
    stage: 'uiux_design_clarify_complete',
  })

  // 分析參考圖片和/或參考網站（兩者都做，合併結果）
  const referenceIdea = ideas.find(i => i.step === 'reference')
  const hasUploadedImage = state.uiuxReferenceImageUrls?.length
  const hasUrlInput = referenceIdea?.answer

  // 並行分析上傳圖片 + URL（如果兩者都有）
  const [imageAnalysisResult, urlAnalysisResult] = await Promise.allSettled([
    hasUploadedImage
      ? analyzeUploadedImage(state.uiuxReferenceImageUrls![0], {
          userId: state.userId,
          conversationId,
          purpose: 'uploaded_image_analysis',
        })
      : Promise.resolve(null),
    hasUrlInput
      ? analyzeReference(referenceIdea!.answer, {
          userId: state.userId,
          conversationId,
          purpose: 'reference_analysis',
        })
      : Promise.resolve(null),
  ])

  const imageAnalysis = imageAnalysisResult.status === 'fulfilled' ? imageAnalysisResult.value : null
  const urlAnalysis = urlAnalysisResult.status === 'fulfilled' ? urlAnalysisResult.value : null

  if (imageAnalysisResult.status === 'rejected') {
    logger.warn({ err: imageAnalysisResult.reason }, '上傳圖片分析失敗，降級跳過')
  }
  if (urlAnalysisResult.status === 'rejected') {
    logger.warn({ err: urlAnalysisResult.reason }, '參考網站分析失敗，降級跳過')
  }

  // 合併分析結果
  if (imageAnalysis && urlAnalysis && imageAnalysis.visionAnalysis && urlAnalysis.visionAnalysis) {
    // 兩者都有 Vision 結果 → 合併 visionAnalysis
    state.uiuxReferenceAnalysis = {
      url: urlAnalysis.url,
      metadata: urlAnalysis.metadata,
      visionAnalysis: `## 上傳參考圖片分析\n${imageAnalysis.visionAnalysis}\n\n## 參考網站分析（${urlAnalysis.metadata?.title || urlAnalysis.url}）\n${urlAnalysis.visionAnalysis}`,
      analysisSource: 'uploaded_image',
    }
    await saveFlowState(redis, conversationId, state)
    await sendMessage(conversationId, io, {
      content: `已分析您上傳的參考圖片和 **${urlAnalysis.metadata?.title || urlAnalysis.url}**，設計風格會融入後續方案。`,
      stage: 'uiux_design_clarify_complete',
    })
  } else if (imageAnalysis?.visionAnalysis) {
    // 只有圖片分析成功
    state.uiuxReferenceAnalysis = imageAnalysis
    await saveFlowState(redis, conversationId, state)
    await sendMessage(conversationId, io, {
      content: '已分析您上傳的參考圖片，設計風格會融入後續方案。',
      stage: 'uiux_design_clarify_complete',
    })
  } else if (urlAnalysis) {
    // 只有 URL 分析
    state.uiuxReferenceAnalysis = urlAnalysis
    await saveFlowState(redis, conversationId, state)

    if ((urlAnalysis.analysisSource === 'vision' || urlAnalysis.analysisSource === 'uploaded_image') && urlAnalysis.visionAnalysis) {
      await sendMessage(conversationId, io, {
        content: `已分析 **${urlAnalysis.metadata?.title || urlAnalysis.url}** 的設計風格，會融入後續方案。`,
        stage: 'uiux_design_clarify_complete',
      })
    } else if (urlAnalysis.analysisSource === 'metadata_only') {
      await sendMessage(conversationId, io, {
        content: `已取得 **${urlAnalysis.metadata?.title || urlAnalysis.url}** 的基本資訊。`,
        stage: 'uiux_design_clarify_complete',
      })
    }
  } else if (imageAnalysis) {
    // 圖片分析有結果但無 visionAnalysis（text_only 降級）
    state.uiuxReferenceAnalysis = imageAnalysis
    await saveFlowState(redis, conversationId, state)
  }

  // 取得 BDD Session
  if (!state.sessionId) {
    logger.error('缺少 sessionId')
    return
  }

  const session = await getBddSession({ sessionId: state.sessionId })
  if (!session.success || !session.data) {
    logger.error('無法取得 BDD Session')
    return
  }

  // 構建設計需求摘要
  // 創建一個虛擬模板，基於用戶的設計想法
  const customTemplate: TemplateData = {
    id: 'custom',
    name: 'Custom Design',
    slug: 'custom',
    category: inferCategoryFromIdeas(ideas),
    description: designBrief,
    designDefaults: inferDesignDefaultsFromIdeas(ideas),
    pageStructure: { pages: ['home', 'dashboard'], components: [] },
  }

  // 規則式推薦 Mood
  const feeling = ideas.find(i => i.step === 'feeling')?.answer || ''
  const productType = inferCategoryFromIdeas(ideas)
  const recommendedMoodIds = recommendMoods(feeling, productType, state.uiuxDesignTier || 'creative')
  if (recommendedMoodIds.length > 0) {
    state.uiuxDesignMood = recommendedMoodIds[0]
    await saveFlowState(redis, conversationId, state)
  }

  // 進入 Design Brief 確認環節
  await startDesignBriefConfirm(conversationId, state, customTemplate, 'ideas', redis, io)
}

// ============================================================
// Design Brief 確認環節
// ============================================================

/** 從用戶設計偏好構建 fallback brief（Brief LLM 生成失敗時使用） */
function buildFallbackBrief(state: FlowState, productType: string): DesignBrief {
  const ideas = state.uiuxDesignIdeas || []
  const feeling = ideas.find(i => i.step === 'feeling')?.answer || ''
  const reference = ideas.find(i => i.step === 'reference')?.answer || ''
  const color = ideas.find(i => i.step === 'color')?.answer || ''
  const layout = ideas.find(i => i.step === 'layout')?.answer || ''

  const creativeKeywords = ['創意', '藝術', '大膽', '獨特', '極簡', '高端', '前衛', '時尚', 'creative', 'artistic', 'minimal']
  const isCreative = creativeKeywords.some(k => feeling.toLowerCase().includes(k))

  return {
    styleSummary: feeling || `${productType} 標準設計風格`,
    colorDirection: color || '根據產品類型自動選擇',
    layoutSuggestion: layout || '標準佈局',
    referenceAnalysis: reference || '無參考',
    professionalRecommendations: [],
    sourceType: state.uiuxDesignIdeas ? 'ideas' : 'template',
    recommendedTier: isCreative ? 'creative' : 'functional',
    tierReason: '根據用戶偏好自動推斷',
    domainKeywords: [],
    signature: '',
  }
}

/**
 * 啟動 Design Brief 確認
 * Path A 和 Path B 的匯流入口
 */
export async function startDesignBriefConfirm(
  conversationId: string,
  state: FlowState,
  template: TemplateData,
  sourceType: 'ideas' | 'template',
  redis: Redis,
  io: IoEmitter
) {
  // 保存模板到 state
  state.uiuxPreparedTemplate = template

  // 發送分析中訊息
  await sendMessage(conversationId, io, {
    content: sourceType === 'ideas'
      ? '好的，讓我整理一下你的設計想法...'
      : `好的，讓我分析一下「${template.name}」模板的設計方向...`,
    stage: 'uiux_design_brief_generating',
  })

  // 取得 BDD Session
  if (!state.sessionId) {
    logger.error('缺少 sessionId')
    await proceedToVariantGeneration(conversationId, state, redis, io)
    return
  }

  const session = await getBddSession({ sessionId: state.sessionId })
  if (!session.success || !session.data) {
    logger.error('無法取得 BDD Session')
    await proceedToVariantGeneration(conversationId, state, redis, io)
    return
  }

  const bddSpec = session.data.featuresContent
    ? session.data.featuresContent.map(f => `- ${f.name}`).join('\n')
    : ''
  const productType = session.data.projectContext || '通用應用'

  // 呼叫 LLM 生成 Design Brief
  const briefResult = await generateDesignBrief(
    template,
    bddSpec,
    productType,
    sourceType === 'ideas' ? (state.uiuxDesignIdeas || null) : null,
    sourceType,
    { userId: state.userId, conversationId, purpose: 'uiux_brief' },
    state.uiuxReferenceAnalysis
  )

  if (!briefResult.success || !briefResult.brief) {
    // 降級：使用 fallback brief 而非完全跳過
    logger.warn({ err: briefResult.error }, 'Design Brief 生成失敗，使用 fallback brief')
    const fallbackBrief = buildFallbackBrief(state, productType)
    state.uiuxDesignBrief = fallbackBrief
    state.uiuxDesignTier = fallbackBrief.recommendedTier
    await saveFlowState(redis, conversationId, state)
    await proceedToVariantGeneration(conversationId, state, redis, io)
    return
  }

  // 保存 brief 到 state（含 tier）
  state.uiuxDesignBrief = briefResult.brief
  state.uiuxDesignTier = briefResult.brief.recommendedTier
  state.uiuxDesignBriefRound = 1
  state.uiuxDesignBriefHistory = [
    { role: 'assistant', content: briefResult.displayText || '' },
  ]
  state.phase = 'uiux_design_brief_confirm'
  state.lastStablePhase = 'uiux_design_brief_confirm'
  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)

  // Credit 扣除：Design Brief 額外成本
  if (state.userId) {
    await deductCredits(state.userId, CREDIT_COSTS.DESIGN_BRIEF - CREDIT_COSTS.BASE_MESSAGE)
  }

  // 構建展示訊息
  const brief = briefResult.brief
  const tierLabel = brief.recommendedTier === 'creative' ? '創意型' : '功能型'
  const tierDesc = brief.recommendedTier === 'creative'
    ? '允許漸層背景、獨特字體、豐富動畫效果、大膽佈局'
    : '注重功能清晰度、保守配色、克制的動畫、標準佈局'

  const displayText = briefResult.displayText || `## 設計方向確認

**設計模式**：${tierLabel}（推薦）
_${brief.tierReason || tierDesc}_

根據你的${sourceType === 'ideas' ? '想法' : '選擇'}，我整理了以下方向：

**風格定位**：${brief.styleSummary}
**色彩方向**：${brief.colorDirection}
**佈局建議**：${brief.layoutSuggestion}
**參考分析**：${brief.referenceAnalysis}

**專業建議**：
${brief.professionalRecommendations.map(r => `- ${r}`).join('\n')}`

  const moodInfo = state.uiuxDesignMood
    ? `\n**視覺風格**：${getMoodSummary(state.uiuxDesignMood)}`
    : ''

  await sendMessage(conversationId, io, {
    content: `${displayText}${moodInfo}\n\n---\n\n如果沒有要調整的，我就開始生成設計方案了？\n也可以告訴我想調整的部分，例如：「顏色想暖一點」、「佈局改卡片式」、「我想要更有創意的設計」`,
    stage: 'uiux_design_brief_confirm',
    quickReplies: [
      { label: '確認，開始生成', value: '確認', style: 'primary' },
      { label: '我想調整', value: '我想調整', style: 'secondary' },
      { label: '← 重新選擇設計方向', value: '__go_back__', style: 'ghost' },
    ],
  })

  logger.info('Design Brief 已生成，等待用戶確認')
}

/**
 * 處理 Design Brief 確認回覆
 * 用戶可以確認、調整（最多 3 輪）
 */
export async function handleDesignBriefReply(
  conversationId: string,
  state: FlowState,
  message: string,
  redis: Redis,
  io: IoEmitter
) {
  const msg = message.trim().toLowerCase()

  // 判斷是否確認
  const confirmPatterns = /^(好|好的|可以|沒問題|確認|是|是的|對|嗯|ok|y|yes|沒有|就這樣|開始|proceed|go|沒有要調整|不用調整|直接開始|開始生成|不用了|可以了|很好|讚|棒|符合)$/i
  if (confirmPatterns.test(msg) || msg.includes('沒有要調整') || msg.includes('開始生成') || msg.includes('就這樣') || msg.includes('符合期待') || msg.includes('沒問題')) {
    logger.info('用戶確認 Design Brief，進入變體生成')
    await proceedToVariantGeneration(conversationId, state, redis, io)
    return
  }

  // 調整判斷
  const round = state.uiuxDesignBriefRound || 1
  if (round >= DESIGN_BRIEF_LIMITS.MAX_ROUNDS) {
    // 已達上限，自動 proceed
    logger.info('Design Brief 調整已達 3 輪上限，自動進入變體生成')
    await sendMessage(conversationId, io, {
      content: '已經調整了幾輪了，讓我根據目前的方向開始生成設計方案吧！',
      stage: 'uiux_design_brief_confirm',
    })
    await proceedToVariantGeneration(conversationId, state, redis, io)
    return
  }

  // 呼叫 LLM 調整 brief
  if (!state.uiuxDesignBrief || !state.uiuxPreparedTemplate) {
    logger.error('缺少 Design Brief 或模板資訊')
    await proceedToVariantGeneration(conversationId, state, redis, io)
    return
  }

  await sendMessage(conversationId, io, {
    content: '收到，讓我調整一下...',
    stage: 'uiux_design_brief_adjusting',
  })

  // 取得 productType
  let productType = '通用應用'
  if (state.sessionId) {
    const session = await getBddSession({ sessionId: state.sessionId })
    if (session.success && session.data) {
      productType = session.data.projectContext || '通用應用'
    }
  }

  // 更新對話歷史
  const history = state.uiuxDesignBriefHistory || []
  history.push({ role: 'user', content: message })

  const adjustResult = await adjustDesignBrief(
    state.uiuxDesignBrief,
    message,
    history,
    state.uiuxPreparedTemplate,
    productType,
    { userId: state.userId, conversationId, purpose: 'uiux_brief' }
  )

  if (!adjustResult.success || !adjustResult.brief) {
    logger.warn({ err: adjustResult.error }, '調整 Design Brief 失敗')
    await sendMessage(conversationId, io, {
      content: `調整時遇到問題，讓我直接用目前的方向開始生成吧。`,
      stage: 'uiux_design_brief_confirm',
    })
    await proceedToVariantGeneration(conversationId, state, redis, io)
    return
  }

  // 更新 state（含 tier 同步 + mood 重新推薦）
  state.uiuxDesignBrief = adjustResult.brief
  state.uiuxDesignTier = adjustResult.brief.recommendedTier
  // 根據調整後的 styleSummary 重新推薦 mood
  const adjustedMoods = recommendMoods(
    adjustResult.brief.styleSummary + ' ' + message,
    productType,
    adjustResult.brief.recommendedTier
  )
  if (adjustedMoods.length > 0) {
    state.uiuxDesignMood = adjustedMoods[0]
  }
  state.uiuxDesignBriefRound = round + 1
  history.push({ role: 'assistant', content: adjustResult.displayText || '' })
  state.uiuxDesignBriefHistory = history
  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)

  // 發送更新後的 brief
  const brief = adjustResult.brief
  const displayText = adjustResult.displayText || `## 設計方向（已更新）

**風格定位**：${brief.styleSummary}
**色彩方向**：${brief.colorDirection}
**佈局建議**：${brief.layoutSuggestion}
**參考分析**：${brief.referenceAnalysis}

**專業建議**：
${brief.professionalRecommendations.map(r => `- ${r}`).join('\n')}`

  const adjustedMoodInfo = state.uiuxDesignMood
    ? `\n**視覺風格**：${getMoodSummary(state.uiuxDesignMood)}`
    : ''

  const promptSuffix = round + 1 >= DESIGN_BRIEF_LIMITS.MAX_ROUNDS
    ? '\n\n已更新！接下來我就開始生成設計方案了。'
    : '\n\n已更新！還有要調整的嗎？沒有的話我就開始了！'

  await sendMessage(conversationId, io, {
    content: `${displayText}${adjustedMoodInfo}${promptSuffix}`,
    stage: 'uiux_design_brief_confirm',
    quickReplies: [
      { label: '確認，開始生成', value: '確認', style: 'primary' },
      { label: '← 重新選擇設計方向', value: '__go_back__', style: 'ghost' },
    ],
  })

  logger.info(`Design Brief 已調整（第 ${round + 1} 輪）`)
}

/**
 * 進入變體生成（公共邏輯）
 * Design Brief 確認後或降級時調用
 */
export async function proceedToVariantGeneration(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: IoEmitter
) {
  const template = state.uiuxPreparedTemplate
  if (!template) {
    logger.error('proceedToVariantGeneration: 缺少 uiuxPreparedTemplate')
    await sendMessage(conversationId, io, {
      content: '發生錯誤：缺少模板資訊。請重新選擇設計方向。',
      stage: 'error',
    })
    return
  }

  // 將 Design Brief 注入模板 description（增強 prompt）
  if (state.uiuxDesignBrief) {
    const brief = state.uiuxDesignBrief
    const briefEnhancement = [
      `風格定位：${brief.styleSummary}`,
      `色彩方向：${brief.colorDirection}`,
      `佈局建議：${brief.layoutSuggestion}`,
      `參考分析：${brief.referenceAnalysis}`,
      ...brief.professionalRecommendations.map(r => `建議：${r}`),
      ...(brief.domainKeywords?.length ? [`Domain 關鍵概念：${brief.domainKeywords.join('、')}`] : []),
      ...(brief.signature ? [`Signature Element：${brief.signature}`] : []),
    ].join('\n')
    template.description = template.description
      ? `${template.description}\n\n## AI 設計顧問建議\n${briefEnhancement}`
      : `## AI 設計顧問建議\n${briefEnhancement}`
  }

  const sourceType = state.uiuxDesignBrief?.sourceType || 'template'

  // 發送生成中訊息
  await sendMessage(conversationId, io, {
    content: '設計方向已確認！接下來我會基於這個方向，生成 5 種不同風格的具體設計方案讓你挑選...',
    stage: 'uiux_variants_generating',
    progress: { current: 1, total: 3, step: '生成設計變體' },
  })

  // 取得 BDD Session
  if (!state.sessionId) {
    logger.error('proceedToVariantGeneration: 缺少 sessionId')
    await sendMessage(conversationId, io, {
      content: '設計資訊已過期，請重新開始。',
      stage: 'error',
      quickReplies: [{ label: '開始新專案', value: '__new_project__', style: 'primary' }],
    })
    await deleteFlowState(redis, conversationId)
    return
  }

  const session = await getBddSession({ sessionId: state.sessionId })
  if (!session.success || !session.data) {
    logger.error('proceedToVariantGeneration: 無法取得 BDD Session')
    await sendMessage(conversationId, io, {
      content: '無法取得設計資料，請重新開始。',
      stage: 'error',
      quickReplies: [{ label: '開始新專案', value: '__new_project__', style: 'primary' }],
    })
    await deleteFlowState(redis, conversationId)
    return
  }

  const bddSpec = session.data.featuresContent
    ? session.data.featuresContent.map(f => `- ${f.name}`).join('\n')
    : ''
  const productType = session.data.projectContext || '通用應用'
  const originalRequirements = session.data.originalRequirements || ''

  // 更新狀態
  state.phase = 'uiux_generating_variants'
  state.uiuxTemplateId = template.id
  await saveFlowState(redis, conversationId, state)

  // 更新 BDD Session（template.id = 'custom' 時不寫入 UUID 欄位）
  const sessionUpdates: Record<string, unknown> = {
    currentPhase: 'uiux_generating_variants',
  }
  if (template.id !== 'custom') {
    sessionUpdates.uiuxTemplateId = template.id
  }
  await updateBddSession({
    sessionId: state.sessionId,
    updates: sessionUpdates,
  })

  // 生成 5 個設計變體
  const variantsResult = await generateDesignVariants(
    template,
    bddSpec,
    productType,
    state.uiuxDesignTier,
    { userId: state.userId, conversationId, purpose: 'uiux_variants' },
    originalRequirements,
    state.uiuxReferenceAnalysis,
    state.uiuxDesignMood
  )

  if (!variantsResult.success || !variantsResult.variants) {
    logger.error({ err: variantsResult.error }, '生成設計變體失敗')
    if (sourceType === 'ideas') {
      // Path A fallback：切換到模板選擇
      await sendMessage(conversationId, io, {
        content: '生成設計方案時發生錯誤。讓我們改用模板開始。',
        stage: 'error',
      })
      await showTemplatePicker(conversationId, state, redis, io)
    } else {
      // Path B：降級回模板選擇
      await sendMessage(conversationId, io, {
        content: '生成設計方案時發生錯誤。讓我們重新選擇模板。',
        stage: 'error',
      })
      await showTemplatePicker(conversationId, state, redis, io)
    }
    return
  }

  const variants = variantsResult.variants
  logger.info(`成功生成 ${variants.length} 個設計變體`)

  // 保存變體到 BDD Session
  await updateBddSession({
    sessionId: state.sessionId,
    updates: {
      designVariants: variants,
      currentPhase: 'uiux_variant_selection',
    },
  })

  // 更新狀態
  state.phase = 'uiux_variant_selection'
  state.lastStablePhase = 'uiux_variant_selection'
  state.uiuxVariants = variants
  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)

  // Credit 扣除：Design Variant 額外成本
  if (state.userId) {
    await deductCredits(state.userId, CREDIT_COSTS.DESIGN_VARIANT - CREDIT_COSTS.BASE_MESSAGE)
  }

  // 構建變體描述
  const variantDescriptions = variants.map(v =>
    `**${v.id}. ${v.name}**\n${v.description}\n關鍵特點：${v.keyFeatures.join('、')}`
  ).join('\n\n')

  const prefix = sourceType === 'ideas'
    ? '以下是 5 種不同的設計方案，都基於你確認的設計方向，但各有不同的切入角度'
    : '以下是 5 種不同的設計方案，各有不同的切入角度'

  // 發送變體選擇訊息
  const variantReplies: { label: string; value: string; style: 'primary' | 'secondary' | 'ghost' }[] = variants.map(v => ({
    label: `選擇 ${v.id}`,
    value: `選擇 ${v.id}`,
    style: 'ghost' as const,
  }))
  variantReplies.push({ label: '← 返回設計方向', value: '__go_back__', style: 'ghost' })
  await sendMessage(conversationId, io, {
    content: `${prefix}！\n\n${variantDescriptions}\n\n請選擇你喜歡的方向：\n- 輸入「選擇 A」直接使用某個方案\n- 輸入「合併 A+C」組合多個方案的特點`,
    stage: 'uiux_variants_ready',
    layoutHint: 'split',
    richContent: {
      type: 'variant_picker',
      data: {
        variants: variants,
        selectedIds: [],
        fromUserIdeas: sourceType === 'ideas',
      } as Record<string, unknown>,
    },
    quickReplies: variantReplies,
  })
}

/**
 * 顯示模板選擇器
 */
export async function showTemplatePicker(
  conversationId: string,
  state: FlowState,
  redis: Redis,
  io: IoEmitter
) {
  // 是否有智能匹配結果
  const hasMatchedIds = state.matchedTemplateIds && state.matchedTemplateIds.length > 0
  const filteredMode = hasMatchedIds

  let templatesResult
  if (hasMatchedIds) {
    // 只查詢匹配的模板，按匹配順序排列
    const ids = state.matchedTemplateIds!
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ')
    templatesResult = await db.query<{
      id: string
      name: string
      slug: string
      category: string
      description: string
      thumbnail_url: string
      preview_image_url: string | null
      tags: string[]
      design_defaults: unknown
      page_structure: unknown
      is_featured: boolean
      sort_order: number
    }>(`SELECT * FROM templates WHERE id::text IN (${placeholders}) AND is_active = true`, ids)

    // 按匹配順序排列（保持 matchedTemplateIds 的分數排序）
    const orderMap = new Map(ids.map((id, idx) => [id, idx]))
    templatesResult.rows.sort((a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99))
  } else {
    // fallback：全部模板
    templatesResult = await db.query<{
      id: string
      name: string
      slug: string
      category: string
      description: string
      thumbnail_url: string
      preview_image_url: string | null
      tags: string[]
      design_defaults: unknown
      page_structure: unknown
      is_featured: boolean
      sort_order: number
    }>('SELECT * FROM templates WHERE is_active = true ORDER BY sort_order ASC')
  }

  const templates = templatesResult.rows.map(row => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    description: row.description,
    thumbnailUrl: row.thumbnail_url,
    previewImageUrl: row.preview_image_url,
    tags: row.tags,
    designDefaults: row.design_defaults,
    pageStructure: row.page_structure,
    isFeatured: row.is_featured,
    sortOrder: row.sort_order,
  }))

  const recommendedIds = templates.filter(t => t.isFeatured).map(t => t.id)

  const content = filteredMode
    ? `根據你的需求，推薦了 ${templates.length} 個最合適的模板：`
    : '好的！請從下方選擇一個設計模板作為起點：'

  await sendMessage(conversationId, io, {
    content,
    stage: 'uiux_template_picker',
    layoutHint: 'split',
    richContent: {
      type: 'template_picker',
      data: {
        templates,
        recommendedIds,
        selectedTemplateId: null,
        filteredMode,
      },
    },
    quickReplies: [
      { label: '← 返回', value: '__go_back__', style: 'ghost' },
    ],
  })

  state.phase = 'uiux_template_selection'
  state.lastStablePhase = 'uiux_template_selection'
  state.waitingForReply = false
  state.displayedTemplates = templates.map(t => ({ id: t.id, name: t.name }))
  await saveFlowState(redis, conversationId, state)
}

/**
 * 從用戶想法推斷類別
 */
function inferCategoryFromIdeas(ideas: Array<{ step: string; answer: string }>): string {
  const allText = ideas.map(i => i.answer).join(' ').toLowerCase()

  if (allText.includes('dashboard') || allText.includes('後台') || allText.includes('管理')) {
    return 'dashboard'
  }
  if (allText.includes('電商') || allText.includes('購物') || allText.includes('ecommerce')) {
    return 'ecommerce'
  }
  if (allText.includes('landing') || allText.includes('行銷') || allText.includes('宣傳')) {
    return 'landing'
  }
  if (allText.includes('saas') || allText.includes('工具') || allText.includes('平台')) {
    return 'saas'
  }

  return 'general'
}

/**
 * 從用戶想法推斷設計默認值
 */
function inferDesignDefaultsFromIdeas(ideas: Array<{ step: string; answer: string }>): TemplateData['designDefaults'] {
  const defaults: TemplateData['designDefaults'] = {}

  const colorIdea = ideas.find(i => i.step === 'color')
  if (colorIdea) {
    const answer = colorIdea.answer.toLowerCase()
    if (answer.includes('藍') || answer.includes('blue')) {
      defaults.colorScheme = 'blue'
    } else if (answer.includes('綠') || answer.includes('green')) {
      defaults.colorScheme = 'green'
    } else if (answer.includes('紅') || answer.includes('red')) {
      defaults.colorScheme = 'red'
    } else if (answer.includes('黑') || answer.includes('dark') || answer.includes('暗')) {
      defaults.colorScheme = 'dark'
    } else if (answer.includes('暖')) {
      defaults.colorScheme = 'warm'
    }
  }

  const layoutIdea = ideas.find(i => i.step === 'layout')
  if (layoutIdea) {
    const answer = layoutIdea.answer.toLowerCase()
    if (answer.includes('簡潔') || answer.includes('留白') || answer.includes('minimal')) {
      defaults.spacing = 'spacious'
    } else if (answer.includes('密集') || answer.includes('compact')) {
      defaults.spacing = 'compact'
    }
  }

  return defaults
}

// ============================================================
// Deployer Skill
// ============================================================
