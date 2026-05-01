/**
 * Abort Flag (T6 — 漸進可中斷生成)
 *
 * ⚠️  **Phase 1 SCAFFOLD — 未啟用** ⚠️
 *
 * 此模組目前**沒有任何生產呼叫端**：
 *   - generateStructure / coder-generation 等生成路徑沒有讀取 abort flag
 *   - 沒有 API route 觸發 setAbortFlag
 *   - 沒有前端「中止生成」按鈕
 *
 * 這是 PR1（T6 commit）刻意保留的鷹架，等之後「前端中止按鈕 + API route + 生成迴圈
 * 接入 abortChecker」三件事都做完才會生效。在那之前，呼叫 setAbortFlag 不會中止
 * 任何生成（不會誤導用戶——因為前端也沒這個按鈕）。
 *
 * 啟用前，請完成（要五處同步，見 CLAUDE.md「新增 phase 必須五處同步」精神）：
 *   1) 前端中止按鈕 + Server Action
 *   2) `app/api/vps/uiux/abort/[conversationId]` route 呼叫 setAbortFlag
 *   3) `generateStructure` 多批次邊界 `if (await abortChecker?.()) throw new AbortError()`
 *   4) `phase handler` 透過 `makeAbortChecker(redis, conversationId)` 注入給 generation
 *   5) `flowstate-recovery` 偵測「中止後殘留」清理流程
 *
 * 使用流程（啟用後）：
 * 1. 觸發中止：`setAbortFlag(redis, conversationId)`（前端按鈕 → API → 此處）
 * 2. 生成端：`isAbortRequested(redis, conversationId)` 在批次邊界檢查
 * 3. 中止後：`clearAbortFlag(redis, conversationId)` 清除狀態
 *
 * 注意：本模組不嘗試 mid-stream LLM 中止。LLM 還在 streaming 時 abort flag
 * 已 set，generation 仍會跑完當前 batch 才退出。延遲上限 = 一個 batch 時間（~30-60s）。
 */

import type Redis from 'ioredis'
import { createLogger } from '../lib/logger'

const logger = createLogger('abort-flag')

const KEY_PREFIX = 'uiux:abort:'
const TTL_SECONDS = 600  // 10 分鐘自動過期，防殘留

function abortKey(conversationId: string): string {
  return `${KEY_PREFIX}${conversationId}`
}

/** 觸發中止訊號。fire-and-forget — 失敗不阻塞呼叫端但會 log（fail-open ≠ fail-silent）。 */
export async function setAbortFlag(redis: Redis, conversationId: string): Promise<void> {
  if (!conversationId) return
  try {
    await redis.set(abortKey(conversationId), '1', 'EX', TTL_SECONDS)
  } catch (err) {
    logger.warn({ err: String(err).slice(0, 200), conversationId }, 'setAbortFlag 寫入 Redis 失敗')
  }
}

/** 檢查中止訊號。錯誤一律回 false（fail-open，不要因 redis 故障阻止生成）。
 * 高頻呼叫（每批次邊界），Redis 故障時用 debug 級別避免 log flood；除錯需要時開 LOG_LEVEL=debug 即可。
 */
export async function isAbortRequested(redis: Redis | null | undefined, conversationId: string | undefined): Promise<boolean> {
  if (!redis || !conversationId) return false
  try {
    const v = await redis.get(abortKey(conversationId))
    return v === '1'
  } catch (err) {
    logger.debug({ err: String(err).slice(0, 200), conversationId }, 'isAbortRequested 讀取失敗，fail-open 不中止')
    return false
  }
}

/** 清除中止訊號（生成端中止後 / 完整完成後呼叫）。 */
export async function clearAbortFlag(redis: Redis | null | undefined, conversationId: string | undefined): Promise<void> {
  if (!redis || !conversationId) return
  try {
    await redis.del(abortKey(conversationId))
  } catch (err) {
    logger.warn({ err: String(err).slice(0, 200), conversationId }, 'clearAbortFlag 清除 Redis 失敗')
  }
}

/**
 * 給生成端用的便利包裝：建立一個 closure 以閉包持有 redis + conversationId，
 * 之後在 batch 邊界呼叫 `await checker()` 即可。
 */
export function makeAbortChecker(redis: Redis | null | undefined, conversationId: string | undefined) {
  return () => isAbortRequested(redis, conversationId)
}
