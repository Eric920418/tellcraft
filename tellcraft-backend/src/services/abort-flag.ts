/**
 * Abort Flag (T6 — 漸進可中斷生成)
 *
 * Redis-based abort signal，讓長時間生成（generateStructure 多批次）能在批次邊界
 * 退出。執行端只在「批次完成」處檢查，不做 mid-stream abort（避免破壞 LLM SDK
 * stream 的 internal state）。
 *
 * 使用流程：
 * 1. 觸發中止：`setAbortFlag(redis, conversationId)` （後續可由前端中止按鈕 → API → 此處）
 * 2. 生成端：`isAbortRequested(redis, conversationId)` 在批次邊界檢查
 * 3. 中止後：`clearAbortFlag(redis, conversationId)` 清除狀態
 *
 * 注意：本模組不嘗試 mid-stream LLM 中止。LLM 還在 streaming 時 abort flag
 * 已 set，generation 仍會跑完當前 batch 才退出。延遲上限 = 一個 batch 時間（~30-60s）。
 */

import type Redis from 'ioredis'

const KEY_PREFIX = 'uiux:abort:'
const TTL_SECONDS = 600  // 10 分鐘自動過期，防殘留

function abortKey(conversationId: string): string {
  return `${KEY_PREFIX}${conversationId}`
}

/** 觸發中止訊號。fire-and-forget — 失敗不阻塞呼叫端。 */
export async function setAbortFlag(redis: Redis, conversationId: string): Promise<void> {
  if (!conversationId) return
  try {
    await redis.set(abortKey(conversationId), '1', 'EX', TTL_SECONDS)
  } catch {
    // ignore
  }
}

/** 檢查中止訊號。錯誤一律回 false（fail-open，不要因 redis 故障阻止生成）。 */
export async function isAbortRequested(redis: Redis | null | undefined, conversationId: string | undefined): Promise<boolean> {
  if (!redis || !conversationId) return false
  try {
    const v = await redis.get(abortKey(conversationId))
    return v === '1'
  } catch {
    return false
  }
}

/** 清除中止訊號（生成端中止後 / 完整完成後呼叫）。 */
export async function clearAbortFlag(redis: Redis | null | undefined, conversationId: string | undefined): Promise<void> {
  if (!redis || !conversationId) return
  try {
    await redis.del(abortKey(conversationId))
  } catch {
    // ignore
  }
}

/**
 * 給生成端用的便利包裝：建立一個 closure 以閉包持有 redis + conversationId，
 * 之後在 batch 邊界呼叫 `await checker()` 即可。
 */
export function makeAbortChecker(redis: Redis | null | undefined, conversationId: string | undefined) {
  return () => isAbortRequested(redis, conversationId)
}
