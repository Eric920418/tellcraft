// ============================================================
// L31.M: Per-Conversation Budget Cap（跨流程 cost guardrail）
//
// 動機：Phase 5 (L31.I) cost guardrail 只擋 alignment gate 內 fix loop，
// 但 feature-validation / spec-feedback-loop / 其他 caller 都呼叫
// fixMultipleFeatures 不受 guardrail 保護。8a32661e 案例 $5.84 / 75 calls
// 跨流程燒，Phase 5 看不到。
//
// 解法：per-conversation budget cap — 任何修復路徑 call LLM 前先 query
// llm_usage 看該 conversation 累計 cost，超過 MAX_CONVERSATION_COST_USD
// 直接 abort（return exceeded:true）。
//
// 不擋普通生成：只在 fix path（fixMultipleFeatures / fixFailingAction /
// fixFailingSpec）入口 check — 普通生成是 user 預期的 LLM 呼叫。
// ============================================================

import { createLogger } from './logger'
import { queryOne } from '../db/client'
import { getEnv } from './env'

const logger = createLogger('conversation-budget')

export interface BudgetCheckResult {
  exceeded: boolean
  currentCostUsd: number
  limitUsd: number
  callCount: number
}

/**
 * Query llm_usage 累計 cost，判斷是否超過 conversation budget。
 *
 * @param conversationId — 若為空/undefined → 跳過 check（exceeded: false）
 * @param maxUsdOverride — 可選 override env，給特定流程設不同 budget
 *
 * Fail-open：DB query 失敗 → exceeded: false（不阻塞，避免 DB 抖動誤殺）
 */
export async function checkConversationBudget(
  conversationId: string | undefined | null,
  maxUsdOverride?: number,
): Promise<BudgetCheckResult> {
  const env = getEnv()
  const limitUsd = maxUsdOverride ?? env.MAX_CONVERSATION_COST_USD

  // 無 conversationId → 跳過（普通 anonymous call）
  if (!conversationId) {
    return { exceeded: false, currentCostUsd: 0, limitUsd, callCount: 0 }
  }

  try {
    const row = await queryOne<{ cost: string | number | null; calls: number }>(
      `SELECT COALESCE(SUM(cost_usd), 0) AS cost, COUNT(*)::int AS calls
       FROM llm_usage WHERE conversation_id = $1`,
      [conversationId]
    )
    const currentCostUsd = Number(row?.cost ?? 0)
    const callCount = Number(row?.calls ?? 0)
    const exceeded = currentCostUsd >= limitUsd

    if (exceeded) {
      logger.warn({
        conversationId, currentCostUsd: currentCostUsd.toFixed(2),
        limitUsd, callCount,
      }, 'L31.M: Conversation budget exceeded')
    }

    return { exceeded, currentCostUsd, limitUsd, callCount }
  } catch (e) {
    // DB 抖動或查詢失敗 — fail-open 不阻塞（避免誤殺正常流程）
    logger.warn({ err: e, conversationId }, 'L31.M: budget check failed, fail-open')
    return { exceeded: false, currentCostUsd: 0, limitUsd, callCount: 0 }
  }
}

/**
 * 給 fix path caller 用的「budget check + early-abort」helper
 *
 * 用法：
 *   const budget = await guardFixPathBudget(conversationId, 'fixFailingAction')
 *   if (budget.exceeded) return { success: false, error: budget.errorMessage }
 *
 * 統一 telemetry + 統一 error message 格式。
 */
export async function guardFixPathBudget(
  conversationId: string | undefined | null,
  callerName: string,
): Promise<{ exceeded: false } | { exceeded: true; errorMessage: string; currentCostUsd: number; limitUsd: number }> {
  const result = await checkConversationBudget(conversationId)
  if (!result.exceeded) {
    return { exceeded: false }
  }

  // Telemetry — fire and forget
  const { recordTelemetry } = await import('../services/skill-telemetry')
  recordTelemetry({
    skillName: 'budget_guard',
    eventType: 'conversation_budget_exceeded',
    patternKey: callerName,
    outcome: 'blocked',
    phase: 'budget_guard',
    severity: 'critical',
    conversationId: conversationId ?? undefined,
    payload: {
      currentCostUsd: result.currentCostUsd,
      limitUsd: result.limitUsd,
      callCount: result.callCount,
      caller: callerName,
    },
  }).catch(() => {})

  const errorMessage = `對話 LLM cost ($${result.currentCostUsd.toFixed(2)}) 已達上限 ($${result.limitUsd}). ` +
    `${callerName} 跳過避免進一步燒錢。env MAX_CONVERSATION_COST_USD 可調整。`

  return {
    exceeded: true,
    errorMessage,
    currentCostUsd: result.currentCostUsd,
    limitUsd: result.limitUsd,
  }
}
