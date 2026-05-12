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
import type { Redis } from 'ioredis'

const logger = createLogger('conversation-budget')

const BLOCKED_PREFIX = 'budget-blocked:'
const BLOCKED_TTL_SEC = 24 * 60 * 60  // 24h — 對話結束後自動清

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
 * L31.N Layer 2：標記 conversation 為 budget-blocked（Redis）
 * 一旦標記，後續所有 LLM call 直接拒（避免每次 trigger 重複寫 telemetry / 重複查 DB）
 */
let _redis: Redis | null = null
function setRedis(r: Redis | null) { _redis = r }
export { setRedis }

async function markConversationBudgetBlocked(conversationId: string, reason: string): Promise<void> {
  if (!_redis) return
  try {
    await _redis.set(`${BLOCKED_PREFIX}${conversationId}`, reason, 'EX', BLOCKED_TTL_SEC)
  } catch (e) {
    logger.warn({ err: e, conversationId }, 'L31.N: mark blocked failed')
  }
}

async function isConversationBudgetBlocked(conversationId: string): Promise<{ blocked: boolean; reason?: string }> {
  if (!_redis) return { blocked: false }
  try {
    const reason = await _redis.get(`${BLOCKED_PREFIX}${conversationId}`)
    return reason ? { blocked: true, reason } : { blocked: false }
  } catch {
    return { blocked: false }
  }
}

/**
 * L31.N Layer 3：global conversation timeout — 對話從首次 LLM call 起 > N 分鐘就強制終結
 * 防止無限 loop / retry 永遠跑下去
 *
 * 用 MIN(created_at) FROM llm_usage 取對話開始時間
 */
async function checkConversationGlobalTimeout(conversationId: string, maxMinutes: number): Promise<{ timedOut: boolean; runtimeMinutes?: number }> {
  try {
    const row = await queryOne<{ first_call: string | null }>(
      `SELECT MIN(created_at) AS first_call FROM llm_usage WHERE conversation_id = $1`,
      [conversationId]
    )
    if (!row?.first_call) return { timedOut: false }
    const firstCallMs = new Date(row.first_call).getTime()
    const elapsedMs = Date.now() - firstCallMs
    const runtimeMinutes = elapsedMs / 60_000
    return { timedOut: runtimeMinutes > maxMinutes, runtimeMinutes }
  } catch {
    return { timedOut: false }  // fail-open
  }
}

/**
 * L31.N Layer 1+2+3 統一入口 — 任何 LLM call 前 check 是否該對話應該繼續
 *
 * 用法：所有 callClaude / callStructured / 任何 LLM call helper 入口都呼叫：
 *   const guard = await assertCanCallLlm(conversationId, 'actions_design')
 *   if (!guard.allowed) return { success: false, error: guard.reason }
 *
 * 檢查順序（fast → slow）：
 * 1. Redis blocked flag — 已標記 blocked 直接拒（O(1) Redis）
 * 2. Global timeout — 對話跑 > MAX_CONVERSATION_RUNTIME_MIN 分鐘
 * 3. Cost budget — 累計 >= MAX_CONVERSATION_COST_USD
 *
 * 任一 fail → 標記 blocked + 一次性 telemetry + return blocked
 */
export async function assertCanCallLlm(
  conversationId: string | undefined | null,
  callerName: string,
): Promise<{ allowed: true } | { allowed: false; reason: string; rule: 'blocked_flag' | 'global_timeout' | 'cost_budget' }> {
  if (!conversationId) return { allowed: true }

  // Layer 2: Redis blocked flag — fast path
  const blocked = await isConversationBudgetBlocked(conversationId)
  if (blocked.blocked) {
    return { allowed: false, reason: blocked.reason ?? 'Conversation already blocked', rule: 'blocked_flag' }
  }

  const env = getEnv()

  // Layer 3: Global timeout
  const timeoutCheck = await checkConversationGlobalTimeout(conversationId, env.MAX_CONVERSATION_RUNTIME_MIN)
  if (timeoutCheck.timedOut) {
    const reason = `對話運行已超過 ${env.MAX_CONVERSATION_RUNTIME_MIN} 分鐘（實際 ${timeoutCheck.runtimeMinutes?.toFixed(1)} 分鐘）— 強制終結避免無限 loop。env MAX_CONVERSATION_RUNTIME_MIN 可調整。`
    await markConversationBudgetBlocked(conversationId, reason)
    await firstTimeTelemetry(conversationId, callerName, 'global_timeout', { runtimeMinutes: timeoutCheck.runtimeMinutes })
    return { allowed: false, reason, rule: 'global_timeout' }
  }

  // Layer 1: Cost budget
  const budgetCheck = await checkConversationBudget(conversationId)
  if (budgetCheck.exceeded) {
    const reason = `對話 LLM cost ($${budgetCheck.currentCostUsd.toFixed(2)}) 已達上限 ($${budgetCheck.limitUsd})。${callerName} 跳過。env MAX_CONVERSATION_COST_USD 可調整。`
    await markConversationBudgetBlocked(conversationId, reason)
    await firstTimeTelemetry(conversationId, callerName, 'cost_budget', {
      currentCostUsd: budgetCheck.currentCostUsd,
      limitUsd: budgetCheck.limitUsd,
      callCount: budgetCheck.callCount,
    })
    return { allowed: false, reason, rule: 'cost_budget' }
  }

  return { allowed: true }
}

/**
 * 一次性 telemetry — 用 in-memory Set 避免單一 worker 內重複寫
 * 跨 worker 由 Redis blocked flag 保證（mark 後其他 worker 直接從 blocked_flag 路徑 return）
 */
const _telemetryWrittenForConv = new Set<string>()
async function firstTimeTelemetry(
  conversationId: string,
  callerName: string,
  rule: 'global_timeout' | 'cost_budget',
  payload: Record<string, unknown>,
): Promise<void> {
  if (_telemetryWrittenForConv.has(conversationId)) return
  _telemetryWrittenForConv.add(conversationId)
  const { recordTelemetry } = await import('../services/skill-telemetry')
  recordTelemetry({
    skillName: 'budget_guard',
    eventType: 'conversation_budget_exceeded',
    patternKey: rule,
    outcome: 'blocked',
    phase: 'budget_guard',
    severity: 'critical',
    conversationId,
    payload: { caller: callerName, rule, ...payload },
  }).catch(() => {})
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
  // L31.N: 統一走 assertCanCallLlm — fix path 也享 Layer 2 blocked flag + Layer 3 global timeout 保護
  const guard = await assertCanCallLlm(conversationId, callerName)
  if (guard.allowed) {
    return { exceeded: false }
  }

  // 為了 backward-compat（callers 仍讀 currentCostUsd / limitUsd），再查一次 budget 取數字
  const result = await checkConversationBudget(conversationId)
  return {
    exceeded: true,
    errorMessage: guard.reason,
    currentCostUsd: result.currentCostUsd,
    limitUsd: result.limitUsd,
  }
}
