// ============================================================
// L31.M: Per-Conversation Budget Cap（純安全網）
//
// 動機：當所有收斂偵測都漏抓時，最後一道保險防止單一對話燒到 $100+。
// **不該是主要防線** — 主要防線是 fix loop 的收斂偵測（error fingerprint）。
//
// 預設 $20 — 正常對話不會碰到。如果觸發，等同於信號：
// 「某個 fix loop 沒收斂，去查 telemetry 找根因」
//
// 只在 fix path 入口 check（fixMultipleFeatures / fixFailingAction / fixFailingSpec）
// — 普通生成不擋
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
      }, 'L31.M: Conversation budget exceeded (safety net)')
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

  const errorMessage = `對話 LLM cost ($${result.currentCostUsd.toFixed(2)}) 已達安全網上限 ($${result.limitUsd}). ` +
    `${callerName} 跳過。此為最後防線觸發，代表 fix loop 收斂偵測漏抓 — 請查 telemetry。env MAX_CONVERSATION_COST_USD 可調整。`

  return {
    exceeded: true,
    errorMessage,
    currentCostUsd: result.currentCostUsd,
    limitUsd: result.limitUsd,
  }
}
