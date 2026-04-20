/**
 * Classify Node — 意圖分類
 *
 * 職責：
 * 1. 如果已有進行中的 flow → 同步 FlowState → 跳到 phase_router
 * 2. Clone mode → 直接路由
 * 3. Fast mode → detectFastModeIntent + checkBuildRelevance → 路由
 * 4. Normal mode → classifyIntent（LLM 三層分類）→ 路由
 *
 * Safety layer（prefilter + credit）在 orchestrator.ts 已處理，不在此 node。
 */
import type { TellcraftStateType } from '../state'
import { getFlowState } from '../../workers/orchestrator-utils'
import { getRedis } from '../context'
import { classifyIntent, isSkillIntent } from '../../services/classifier'
import { detectFastModeIntent } from '../../services/customer-service'
import { checkBuildRelevance, recordAbuseViolation } from '../../services/prefilter'
import * as db from '../../db/client'
import { createLogger } from '../../lib/logger'

const logger = createLogger('graph:classify')

const SPECIAL_TOKENS = [
  '__new_project__',
  '__go_back__',
  '__retry__',
  '__retry_fast_build__',
  '__continue_fast_build__',
  '__finish_fast_build__',
  '__resume_fast_build_pipeline__',
  '__continue_fast_build_after_deploy__',
  '__connect_database__',
  '__verify_backend__',
  '__deploy_with_risk__',
  '__confirm_risky_deploy__',
  '__cancel_risky_deploy__',
  '__cancel_domain__',
  '__retry_clone__',
  '__retry_variants__',
  '__auto_repair_preview__',
] as const

// Skill intent → graph route key 映射
const INTENT_TO_ROUTE: Record<string, string> = {
  'bdd-spec': 'bdd',
  'uiux': 'uiux',
  'coder': 'coder',
  'deployer': 'deploy',
  'domain-purchase': 'domain',
  'domain-dns': 'domain',
  'domain-manager': 'domain',
}

export async function classifyNode(
  state: TellcraftStateType
): Promise<Partial<TellcraftStateType>> {
  const redis = getRedis()
  const message = state.message
  const trimmed = message.trim()

  // ── 1. 偵測特殊 token ──
  const token = SPECIAL_TOKENS.find(t => message.includes(t)) ?? ''

  // ── 2. 讀取現有 FlowState ──
  const flowState = await getFlowState(redis, state.conversationId)

  // ── 2.5. 特殊 token 優先路由（L22：舊 BullMQ 路徑 orchestrator.ts L987 對應邏輯）
  //        LangGraph 原本只在 SPECIAL_TOKENS 存 token 不做路由，
  //        導致 uiux_complete + __connect_database__ 被當 continue_flow → fallback
  const trimmedMsg = trimmed
  if (trimmedMsg === '__connect_database__') {
    // 觸發 Coder Skill（相當於舊 orchestrator handleProcessMessage L987 的攔截）
    return { skillIntent: 'coder', specialToken: token, phase: flowState?.phase || 'idle' }
  }
  if (trimmedMsg === '__verify_backend__') {
    // 只重跑 SpecFormula Testing
    return { skillIntent: 'coder', specialToken: token, phase: flowState?.phase || 'idle' }
  }
  if (trimmedMsg === '__retry_coder__') {
    return { skillIntent: 'coder', specialToken: token, phase: flowState?.phase || 'idle' }
  }

  // ── 3. 已有進行中的 flow → 直接跳到 phase_router ──
  if (flowState && flowState.phase && flowState.phase !== 'idle') {
    return {
      phase: flowState.phase,
      waitingForReply: flowState.waitingForReply ?? false,
      fastBuildStage: (flowState as unknown as Record<string, unknown>).fastBuildStage as string ?? '',
      specialToken: token,
      skillIntent: 'continue_flow',
    }
  }

  // ── 4. Clone mode → 直接路由 ──
  if (state.mode === 'clone' || (state.imageUrls.length > 0 && state.mode !== 'fast')) {
    return { skillIntent: 'clone', specialToken: token, phase: 'idle' }
  }

  // ── 5. Fast mode → detectFastModeIntent + checkBuildRelevance ──
  if (state.mode === 'fast') {
    const fastIntent = detectFastModeIntent(trimmed)
    if (fastIntent.match && fastIntent.type !== null) {
      // greeting/chitchat/acknowledgment → meta（不進 fast build）
      if (['greeting', 'chitchat', 'acknowledgment'].includes(fastIntent.type)) {
        return { skillIntent: 'meta', specialToken: token, phase: 'idle' }
      }
      // help/question/platform_issue → meta（客服回覆）
      if (['help', 'question', 'platform_issue'].includes(fastIntent.type)) {
        return { skillIntent: 'meta', specialToken: token, phase: 'idle' }
      }
    }

    // 檢查是否與建站相關
    try {
      const relevance = await checkBuildRelevance(trimmed)
      if (!relevance.relevant) {
        return { skillIntent: 'meta', specialToken: token, phase: 'idle' }
      }
    } catch {
      // checkBuildRelevance fail-closed（API 錯誤 → 拒絕），但無 API key 時 fail-open
      logger.warn('checkBuildRelevance 失敗，降級放行')
    }

    return { skillIntent: 'fast', specialToken: token, phase: 'idle' }
  }

  // ── 6. Normal mode → LLM 三層分類 ──
  try {
    // 取得對話歷史（最近 10 條）
    const conversation = await db.getConversation(state.conversationId)
    const history = ((conversation?.messages || []) as Array<{ role: 'user' | 'assistant'; content: string }>).slice(-10)

    const classification = await classifyIntent(
      message, history,
      { userId: state.userId, conversationId: state.conversationId }
    )

    // Content policy
    if (classification.contentFlag) {
      await recordAbuseViolation(state.userId, redis)
      return { skillIntent: 'meta', specialToken: token, phase: 'idle', error: 'content_policy' }
    }

    // Meta-intent（非 skill：onboarding/chitchat/abuse/unknown/clarification_needed）
    if (!isSkillIntent(classification.intent)) {
      return { skillIntent: 'meta', specialToken: token, phase: 'idle' }
    }

    // Skill intent
    const intent = INTENT_TO_ROUTE[classification.intent] || 'bdd'
    logger.info({ conversationId: state.conversationId, intent: classification.intent, confidence: classification.confidence }, 'LangGraph classify')

    return { skillIntent: intent, specialToken: token, phase: 'idle' }
  } catch (err) {
    // 分類失敗 → 降級為 BDD（和舊路徑一致）
    logger.error({ err }, 'classifyIntent 失敗，降級為 bdd')
    return { skillIntent: 'bdd', specialToken: token, phase: 'idle' }
  }
}
