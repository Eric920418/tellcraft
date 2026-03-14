// ============================================================
// Phase Router
// 從 handleContinueFlow 提取的 phase 路由分派邏輯
// ============================================================

import type Redis from 'ioredis'
import type { Server as SocketIOServer } from 'socket.io'
import type { FlowState } from '../types/flow-state'
import { sendMessage, saveFlowState, deleteFlowState } from './orchestrator-utils'
import { executeIteration, executeUndoIteration, executeRollbackQuery, executeRollbackSelection } from '../services/iteration-skill'
import { semanticGateway } from '../services/semantic-gateway'
import { detectFastModeIntent, getFaqReply, answerWithSonnet } from '../services/customer-service'
import {
  hasDeployIntent, hasRejectDeployIntent, hasRollbackIntent, hasUndoIntent, hasDomainIntent,
  PHASE_BACKTRACK_MAP, PHASE_LABELS,
} from './intent-helpers'
import { createLogger } from '../lib/logger'

// Phase handlers
import {
  handleESInitReply, handleESExploreReply,
  handleFormulationDraftReview, handleSpecRollbackSelect,
  handleSpecChangeConfirm, handleSpecChangeAnalyzing,
  handlePrdDiscoveryGenerating, handleFormulationGenerating,
  handleSpecDiscoveryGenerating, handleBddWaitingForReply,
} from './phase-handlers/bdd-phases'
import {
  handleDesignPreferenceReply, handleDesignClarifyReply, handleDesignBriefReply,
  handleUiuxCodeGenerating, handleUiuxIterating, handleFastGenerating,
  handleUiuxMixedPhaseRouting,
} from './phase-handlers/uiux-phases'
import { executeDeployerSkill } from './phase-handlers/deploy-phases'
import { buildPostDeployFastBuildQuickReplies } from './phase-handlers/fast-build-phases'
import {
  executeDomainSkill,
  handleDomainConfirmPurchase, handleDomainOwnSetup,
  handleDomainDnsVerifying, handleDomainComplete, handleDomainFailed,
} from './phase-handlers/domain-phases'

const logger = createLogger('phase-router')

export interface ContinueFlowData {
  projectId: string
  conversationId: string
  userId: string
  taskId?: string
  message: string
  specConfirmed?: boolean
  locale?: 'zh' | 'en'
  imageUrls?: string[]
}

/**
 * Phase 路由：根據 FlowState.phase 分派到對應的 handler
 * 回傳 true 表示已處理，false 表示未匹配
 */
export async function routePhase(
  data: ContinueFlowData,
  state: FlowState,
  trimmedMsg: string,
  redis: Redis,
  io: SocketIOServer
): Promise<boolean> {
  const { conversationId, projectId, userId, message } = data

  // ── Event Storming ──
  if (state.phase === 'es_init') {
    await handleESInitReply(conversationId, state, message, redis, io)
    return true
  }
  if (state.phase === 'es_explore') {
    await handleESExploreReply(conversationId, state, message, redis, io)
    return true
  }

  // ── UIUX Design Discovery ──
  if (state.phase === 'uiux_design_preference') {
    try { await handleDesignPreferenceReply(conversationId, state, message, redis, io) }
    catch (err) { await handlePhaseError(conversationId, state, err, redis, io) }
    return true
  }
  if (state.phase === 'uiux_design_clarify') {
    try { await handleDesignClarifyReply(conversationId, state, message, redis, io, data.imageUrls) }
    catch (err) { await handlePhaseError(conversationId, state, err, redis, io) }
    return true
  }
  if (state.phase === 'uiux_design_brief_confirm') {
    try { await handleDesignBriefReply(conversationId, state, message, redis, io) }
    catch (err) { await handlePhaseError(conversationId, state, err, redis, io) }
    return true
  }

  // ── Deployer Failed ──
  if (state.phase === 'deployer_failed') {
    await routeDeployerFailed(data, state, trimmedMsg, redis, io)
    return true
  }

  // ── Deployer Deploying ──
  if (state.phase === 'deployer_deploying') {
    await sendMessage(conversationId, io, { content: '正在部署中，請稍候...', stage: 'info' })
    return true
  }

  // ── BDD Formulation Draft Review ──
  if (state.phase === 'formulation_draft_review') {
    await handleFormulationDraftReview(conversationId, state, message, redis, io)
    return true
  }

  // ── Spec Rollback / Change ──
  if (state.phase === 'spec_rollback_select') {
    await handleSpecRollbackSelect(conversationId, state, message, redis, io)
    return true
  }
  if (state.phase === 'spec_change_confirm') {
    await handleSpecChangeConfirm(conversationId, state, message, redis, io)
    return true
  }
  if (state.phase === 'spec_change_analyzing') {
    await handleSpecChangeAnalyzing(conversationId, io)
    return true
  }

  // ── Generation in progress（攔截用戶輸入 + 死鎖偵測）──
  if (state.phase === 'prd_discovery' && !state.waitingForReply) {
    await handlePrdDiscoveryGenerating(conversationId, state, redis, io)
    return true
  }
  if (state.phase === 'formulation' && !state.waitingForReply) {
    await handleFormulationGenerating(conversationId, state, redis, io)
    return true
  }
  if (state.phase === 'spec_discovery' && !state.waitingForReply) {
    await handleSpecDiscoveryGenerating(conversationId, state, redis, io)
    return true
  }
  if (state.phase === 'fast_generating') {
    // awaiting_continue 時用戶輸入普通文字 → 視為「想先修改」→ 轉 uiux_complete + 迭代
    if (state.waitingForReply && state.fastBuildStage === 'awaiting_continue') {
      state.phase = 'uiux_complete'
      state.fastBuildStage = 'complete'
      state.uiuxCodePhase = 'complete'
      state.waitingForReply = false
      state.uiuxCodeGenerationStartedAt = undefined
      await saveFlowState(redis, conversationId, state)
      await executeIteration({
        conversationId, projectId: data.projectId, userId: data.userId,
        userFeedback: data.message, redis, io,
      })
      return true
    }
    await handleFastGenerating(conversationId, state, redis, io)
    return true
  }
  if (state.phase === 'uiux_iterating') {
    await handleUiuxIterating(conversationId, state, redis, io)
    return true
  }

  // ── Coder Generating ──
  if (state.phase === 'coder_generating') {
    const isChinese = state.locale !== 'en'
    await sendMessage(conversationId, io, {
      content: isChinese ? '正在生成後端代碼，請稍候...' : 'Generating backend code, please wait...',
      stage: 'info',
    })
    return true
  }

  // ── Coder Testing ──
  if (state.phase === 'coder_testing') {
    const isChinese = state.locale !== 'en'
    await sendMessage(conversationId, io, {
      content: isChinese ? '正在執行 SpecFormula 測試，請稍候...' : 'Running SpecFormula tests, please wait...',
      stage: 'info',
    })
    return true
  }

  // ── Domain Phases ──
  if (state.phase === 'domain_searching' || state.phase === 'domain_registering') {
    const isChinese = state.locale !== 'en'
    await sendMessage(conversationId, io, {
      content: isChinese ? '正在處理中，請稍候...' : 'Processing, please wait...',
      stage: 'info',
    })
    return true
  }
  if (state.phase === 'domain_dns_verifying') {
    await handleDomainDnsVerifying({ conversationId, projectId, userId, message, state, redis, io, locale: data.locale })
    return true
  }
  if (state.phase === 'domain_confirm_purchase') {
    await handleDomainConfirmPurchase({ conversationId, projectId, userId, message, state, redis, io, locale: data.locale })
    return true
  }
  if (state.phase === 'domain_own_setup') {
    await handleDomainOwnSetup({ conversationId, projectId, userId, message, state, redis, io, locale: data.locale })
    return true
  }
  if (state.phase === 'domain_complete') {
    await handleDomainComplete({ conversationId, projectId, userId, message, state, redis, io, locale: data.locale })
    return true
  }
  if (state.phase === 'domain_failed') {
    await handleDomainFailed({ conversationId, projectId, userId, message, state, redis, io, locale: data.locale })
    return true
  }

  // ── Deployer Complete ──
  if (state.phase === 'deployer_complete') {
    await routeDeployerComplete(data, state, trimmedMsg, redis, io)
    return true
  }

  // ── Deployer Rollback Select ──
  if (state.phase === 'deployer_rollback_select') {
    await executeRollbackSelection({ conversationId, projectId, userMessage: message, redis, io })
    return true
  }

  // ── Code Generation / Quality Gate ──
  if (state.phase === 'uiux_code_generation' || state.phase === 'uiux_quality_gate') {
    await handleUiuxCodeGenerating(conversationId, state, redis, io)
    return true
  }

  // ── UIUX Mixed Phases ──
  if (
    state.phase === 'uiux_template_selection' ||
    state.phase === 'spec_completed' ||
    state.phase === 'uiux_variant_selection' ||
    state.phase === 'uiux_generating_variants' ||
    state.phase === 'uiux_complete'
  ) {
    await handleUiuxMixedPhaseRouting(data, state, trimmedMsg, message, redis, io)
    return true
  }

  return false
}

// ============================================================
// Deployer Failed 路由
// ============================================================

async function routeDeployerFailed(
  data: ContinueFlowData, state: FlowState, trimmed: string, redis: Redis, io: SocketIOServer
) {
  const { conversationId, projectId, userId, message } = data

  if (hasRejectDeployIntent(trimmed)) {
    state.phase = 'uiux_complete'
    await saveFlowState(redis, conversationId, state)
    const isChinese = /[\u4e00-\u9fff]/.test(trimmed)
    await sendMessage(conversationId, io, {
      content: isChinese
        ? '好的，已返回設計修改模式。直接輸入修改建議即可調整設計，完成後再部署。'
        : 'Got it. You\'re back in design mode. Describe changes to adjust, then deploy when ready.',
      stage: 'info',
      quickReplies: [{ label: isChinese ? '部署上線' : 'Deploy', value: '部署', style: 'primary' as const }],
    })
    return
  }

  if (hasDeployIntent(trimmed) || ['重試'].some(kw => trimmed.includes(kw))) {
    await executeDeployerSkill({ taskId: state.taskId || '', projectId, conversationId, userId, message, redis, io })
    return
  }

  const returnKeywords = ['返回修改', '返回', '回去修改', '回到修改']
  if (returnKeywords.some(kw => trimmed.includes(kw))) {
    state.phase = 'uiux_complete'
    await saveFlowState(redis, conversationId, state)
    await sendMessage(conversationId, io, {
      content: '已返回設計修改模式。直接輸入修改建議即可調整設計，完成後再部署。',
      stage: 'info',
      quickReplies: [{ label: '部署上線', value: '部署', style: 'primary' }],
    })
    return
  }

  if (hasUndoIntent(trimmed)) {
    await executeUndoIteration({ conversationId, projectId, redis, io })
    return
  }
  if (hasRollbackIntent(trimmed)) {
    await executeRollbackQuery({ conversationId, projectId, redis, io })
    return
  }

  // 問候/問題/閒聊攔截
  const intentCheck = detectFastModeIntent(trimmed)
  if (intentCheck.match) {
    const isChinese = /[\u4e00-\u9fff]/.test(trimmed) || state.locale === 'zh'
    const qr = [
      { label: isChinese ? '重試部署' : 'Retry Deploy', value: '重試', style: 'primary' as const },
      { label: isChinese ? '開始新專案' : 'New Project', value: '__new_project__', style: 'ghost' as const },
    ]
    if (intentCheck.type === 'question') {
      const faqResult = getFaqReply(trimmed, state.locale)
      if (faqResult) {
        await sendMessage(conversationId, io, { content: faqResult.reply, stage: 'customer_service', quickReplies: qr })
      } else {
        const reply = await answerWithSonnet(trimmed, { conversationId, locale: state.locale })
        await sendMessage(conversationId, io, { content: reply, stage: 'customer_service', quickReplies: qr })
      }
      return
    }
    await sendMessage(conversationId, io, {
      content: isChinese
        ? '嗨！部署之前遇到了問題。您可以：\n- 描述修改需求來調整設計\n- 點擊「重試部署」重新部署\n- 點擊「開始新專案」重新開始'
        : 'Hi! The deployment ran into an issue. You can:\n- Describe changes to adjust the design\n- Click "Retry Deploy" to try again\n- Click "New Project" to start fresh',
      stage: 'info', quickReplies: qr,
    })
    return
  }

  // semanticGateway
  const gwResult = await semanticGateway({ phase: 'iteration', userMessage: trimmed, conversationId, userId, locale: data.locale || state.locale }, state)
  if (!gwResult.accept) {
    state.semanticRejectCount = (state.semanticRejectCount || 0) + 1
    await saveFlowState(redis, conversationId, state)
    await sendMessage(conversationId, io, {
      content: gwResult.guidanceMessage || '請描述您想修改的設計內容。',
      stage: 'info',
      quickReplies: [
        { label: '部署上線', value: '部署', style: 'primary' as const },
        { label: '重試部署', value: '重試', style: 'ghost' as const },
      ],
    })
    return
  }
  state.semanticRejectCount = 0
  await saveFlowState(redis, conversationId, state)
  await executeIteration({ conversationId, projectId, userId, userFeedback: message, redis, io, imageUrls: data.imageUrls })
}

// ============================================================
// Deployer Complete 路由
// ============================================================

async function routeDeployerComplete(
  data: ContinueFlowData, state: FlowState, trimmed: string, redis: Redis, io: SocketIOServer
) {
  const { conversationId, projectId, userId, message } = data

  if (hasDeployIntent(trimmed)) {
    await executeDeployerSkill({ taskId: state.taskId || '', projectId, conversationId, userId, message, redis, io })
    return
  }
  if (hasDomainIntent(trimmed)) {
    await executeDomainSkill({
      taskId: state.taskId || '', projectId, conversationId, userId, message,
      skillName: 'domain-dns', redis, io, locale: data.locale || state.locale,
    })
    return
  }
  if (hasRejectDeployIntent(trimmed)) {
    const isChinese = /[\u4e00-\u9fff]/.test(trimmed)
    await sendMessage(conversationId, io, {
      content: isChinese
        ? '好的，不再部署。您可以繼續修改設計，或選擇回滾到之前的版本。'
        : 'Got it, no further deployment. You can continue modifying the design or rollback to a previous version.',
      stage: 'deployer_complete',
      quickReplies: buildPostDeployFastBuildQuickReplies(state, { includeDeploy: true, includeRollback: true }),
    })
    return
  }
  if (hasUndoIntent(trimmed)) {
    await executeUndoIteration({ conversationId, projectId, redis, io })
    return
  }
  if (hasRollbackIntent(trimmed)) {
    await executeRollbackQuery({ conversationId, projectId, redis, io })
    return
  }

  // 問候/問題/閒聊攔截
  const intentCheck = detectFastModeIntent(trimmed)
  if (intentCheck.match) {
    const isChinese = /[\u4e00-\u9fff]/.test(trimmed) || state.locale === 'zh'
    const qr = buildPostDeployFastBuildQuickReplies(state, { includeDeploy: true, includeNewProject: true })
    qr.push({ label: isChinese ? '綁定自訂網域' : 'Bind Custom Domain', value: '綁定網域', style: 'ghost' as const })
    if (intentCheck.type === 'question') {
      const faqResult = getFaqReply(trimmed, state.locale)
      if (faqResult) {
        await sendMessage(conversationId, io, { content: faqResult.reply, stage: 'customer_service', quickReplies: qr })
      } else {
        const reply = await answerWithSonnet(trimmed, { conversationId, locale: state.locale })
        await sendMessage(conversationId, io, { content: reply, stage: 'customer_service', quickReplies: qr })
      }
      return
    }
    await sendMessage(conversationId, io, {
      content: isChinese
        ? '嗨！您的網站已經部署上線了。您可以：\n- 描述修改需求來調整設計\n- 點擊「部署上線」更新網站\n- 綁定自訂網域\n- 點擊「開始新專案」重新開始'
        : 'Hi! Your site is live. You can:\n- Describe changes to adjust the design\n- Click "Deploy" to update the site\n- Bind a custom domain\n- Click "New Project" to start fresh',
      stage: 'info', quickReplies: qr,
    })
    return
  }

  // semanticGateway
  const gwResult = await semanticGateway({ phase: 'iteration', userMessage: trimmed, conversationId, userId, locale: data.locale || state.locale }, state)
  if (!gwResult.accept) {
    state.semanticRejectCount = (state.semanticRejectCount || 0) + 1
    await saveFlowState(redis, conversationId, state)
    await sendMessage(conversationId, io, {
      content: gwResult.guidanceMessage || '請描述您想修改的設計內容。',
      stage: 'info',
      quickReplies: buildPostDeployFastBuildQuickReplies(state, { includeDeploy: true, includeRollback: true }),
    })
    return
  }
  state.semanticRejectCount = 0
  await saveFlowState(redis, conversationId, state)
  await executeIteration({ conversationId, projectId, userId, userFeedback: message, redis, io, imageUrls: data.imageUrls })
}

// ============================================================
// Phase Error Handler
// ============================================================

export async function handlePhaseError(
  conversationId: string, state: FlowState, err: unknown, redis: Redis, io: SocketIOServer
) {
  const errorMsg = err instanceof Error ? err.message : String(err)
  logger.error({ phase: state.phase, err: errorMsg }, 'Phase handler 錯誤')

  const targetPhase = PHASE_BACKTRACK_MAP[state.phase]
  const targetLabel = targetPhase ? PHASE_LABELS[targetPhase] : null

  const quickReplies: { label: string; value: string; style: 'primary' | 'secondary' | 'ghost' }[] = [
    { label: '重試', value: '__retry__', style: 'primary' },
  ]
  if (targetLabel) {
    quickReplies.push({ label: `← 返回${targetLabel}`, value: '__go_back__', style: 'ghost' })
  }

  await sendMessage(conversationId, io, {
    content: `處理時發生錯誤：${errorMsg}\n\n你可以重新輸入回覆來重試，或點擊下方按鈕。`,
    stage: 'error',
    quickReplies,
  })

  state.waitingForReply = true
  await saveFlowState(redis, conversationId, state)
}
