// ============================================================
// R2: Fix Attempt Cache — 跨 loop fingerprint cache
//
// 動機：BDD pipeline 4 個 fix loop（validate / actions_design / alignment_gate / dry_run）
// 各自獨立呼叫 LLM 修，彼此不知道其他 loop 已嘗試過。同 issue 從 alignment → dry-run
// 被攻擊兩次。
//
// 設計：Redis 記錄 conversation-level「已嘗試修過的 issue fingerprint」。下個 loop
// 偵測到相同 fingerprint 已試過 ≥2 次 → skip LLM。
//
// Key prefix：`bdd-fix-attempted:` — **嚴格限制 BDD pipeline，不接觸 Coder 端**
//
// Fail-open：Redis 取不到 / 連線抖動 → cache miss → 正常跑 LLM（零 regression）
// ============================================================

import type { Redis } from 'ioredis'
import { createLogger } from './logger'
import { createHash } from 'crypto'

const logger = createLogger('fix-attempt-cache')

const KEY_PREFIX = 'bdd-fix-attempted:'
const TTL_SECONDS = 3600  // 1 小時 — 對話結束後自然清
const SKIP_THRESHOLD = 2  // 已嘗試 ≥ 此值 → skip LLM

let _redis: Redis | null = null

export function setFixAttemptCacheRedis(r: Redis | null): void {
  _redis = r
}

export type LoopName = 'validation' | 'actions_design' | 'alignment_gate' | 'dry_run'

export interface AttemptRecord {
  count: number
  lastTriedAt: string  // ISO timestamp
  succeeded: boolean   // 上次嘗試後 issue 是否消失（true = 成功，後續不該再 skip）
}

/**
 * 給定一個 issue 描述產 stable fingerprint hash
 * 格式：<loopName>|<featureName>|<issueKind>|<keyContent100chars>
 */
export function buildFingerprint(params: {
  loopName: LoopName
  featureName: string
  issueKind: string
  keyContent: string
}): string {
  const raw = `${params.loopName}|${params.featureName}|${params.issueKind}|${params.keyContent.slice(0, 100)}`
  return createHash('sha1').update(raw).digest('hex').slice(0, 16)
}

function buildRedisKey(conversationId: string, fingerprint: string): string {
  return `${KEY_PREFIX}${conversationId}:${fingerprint}`
}

/**
 * 查詢某 fingerprint 的嘗試紀錄
 * 無紀錄 / Redis 取不到 → 回 null
 */
export async function getAttemptRecord(
  conversationId: string,
  fingerprint: string,
): Promise<AttemptRecord | null> {
  if (!_redis) return null
  try {
    const raw = await _redis.get(buildRedisKey(conversationId, fingerprint))
    if (!raw) return null
    return JSON.parse(raw) as AttemptRecord
  } catch (e) {
    logger.warn({ err: e, conversationId, fingerprint }, 'R2: getAttemptRecord 失敗，fail-open')
    return null
  }
}

/**
 * 記錄一次嘗試結果
 * - 若該 fingerprint 已有紀錄 → count + 1
 * - succeeded = true 代表這次修完該 issue 不再出現（後續不應 skip）
 */
export async function recordAttempt(
  conversationId: string,
  fingerprint: string,
  succeeded: boolean,
): Promise<void> {
  if (!_redis) return
  try {
    const key = buildRedisKey(conversationId, fingerprint)
    const existing = await _redis.get(key)
    let record: AttemptRecord
    if (existing) {
      const prev = JSON.parse(existing) as AttemptRecord
      record = {
        count: prev.count + 1,
        lastTriedAt: new Date().toISOString(),
        succeeded,
      }
    } else {
      record = {
        count: 1,
        lastTriedAt: new Date().toISOString(),
        succeeded,
      }
    }
    await _redis.set(key, JSON.stringify(record), 'EX', TTL_SECONDS)
  } catch (e) {
    logger.warn({ err: e, conversationId, fingerprint }, 'R2: recordAttempt 失敗（不阻塞）')
  }
}

/**
 * 主入口：給定一組 issue fingerprints，判斷是否該 skip LLM fix call
 *
 * 規則：**全部** fingerprints 都已嘗試 >= SKIP_THRESHOLD 次（且未成功） → skip
 * 任一 fingerprint 從未嘗試 → 不 skip（可能是新 issue）
 *
 * @returns
 *   skip=true → caller 應跳過 LLM call
 *   skip=false → caller 應跑 LLM；跑完後請 caller 呼叫 recordAttempt
 */
export async function shouldSkipLlmFix(
  conversationId: string | undefined | null,
  fingerprints: string[],
): Promise<{
  skip: boolean
  reason?: string
  attemptCounts?: number[]
}> {
  if (!conversationId || fingerprints.length === 0) {
    return { skip: false }
  }
  if (!_redis) {
    return { skip: false, reason: 'Redis not injected (fail-open)' }
  }

  try {
    const records = await Promise.all(
      fingerprints.map(fp => getAttemptRecord(conversationId, fp)),
    )
    const attemptCounts = records.map(r => r?.count ?? 0)

    // 任一 fingerprint 之前嘗試已成功 → 表示這是新出現的 issue（不該被 cache 擋）
    const anySucceeded = records.some(r => r?.succeeded === true)
    if (anySucceeded) {
      return { skip: false, reason: 'previously-succeeded issues present (not stale)', attemptCounts }
    }

    // 全部 issue 已嘗試 >= SKIP_THRESHOLD → skip
    const allExceeded = attemptCounts.every(c => c >= SKIP_THRESHOLD)
    if (allExceeded) {
      return {
        skip: true,
        reason: `all ${fingerprints.length} issues already attempted >= ${SKIP_THRESHOLD} times across loops`,
        attemptCounts,
      }
    }

    return { skip: false, attemptCounts }
  } catch (e) {
    logger.warn({ err: e, conversationId }, 'R2: shouldSkipLlmFix 失敗，fail-open（跑 LLM）')
    return { skip: false, reason: 'Redis error (fail-open)' }
  }
}

/**
 * 批次記錄：一次 LLM 修復跑完後，把當前所有 issue fingerprints 寫進 cache
 * succeededFingerprints 是 LLM 修完後**已消失**的 fingerprints — 標為 succeeded
 * remainingFingerprints 是修完後**仍存在**的 — 標為未成功（count + 1）
 */
export async function recordBatchAttempt(
  conversationId: string | undefined | null,
  succeededFingerprints: string[],
  remainingFingerprints: string[],
): Promise<void> {
  if (!conversationId || !_redis) return
  await Promise.all([
    ...succeededFingerprints.map(fp => recordAttempt(conversationId, fp, true)),
    ...remainingFingerprints.map(fp => recordAttempt(conversationId, fp, false)),
  ])
}

// ============================================================
// Per-feature attempt counter（2026-05-18 b2252efc 治本 safety net）
//
// 動機：既有 fingerprint 對 LLM 微差錯誤訊息敏感（每次 hash 不同 → R2 cache miss）
// → b2252efc 跑了 71 次 fix call / 80 分鐘沒收斂。
//
// 這層 safety net：**不管 fingerprint 怎樣**，同 conversation 同 feature 已修 ≥N
// 次 → 強制 abort 該 feature 繼續修。LLM 真的修不下來的 spec 矛盾 case 直接 break。
//
// Redis key: `bdd-feature-attempts:<convId>:<featureName>` → INCR count
// ============================================================

const FEATURE_KEY_PREFIX = 'bdd-feature-attempts:'
const FEATURE_MAX_ATTEMPTS = 5  // 同 feature 修 ≥5 次仍失敗 → strip
const FEATURE_TTL_SECONDS = 3600

/**
 * 增加 feature 修復計數（每次 fixMultipleFeatures 跑完呼叫）
 * 回新計數值
 */
export async function incrementFeatureAttempt(
  conversationId: string | undefined | null,
  featureName: string,
): Promise<number> {
  if (!conversationId || !_redis || !featureName) return 0
  try {
    const key = `${FEATURE_KEY_PREFIX}${conversationId}:${featureName}`
    const count = await _redis.incr(key)
    if (count === 1) {
      // 首次設 TTL，避免 stale key 永遠累積
      await _redis.expire(key, FEATURE_TTL_SECONDS)
    }
    return count
  } catch (e) {
    logger.warn({ err: e, featureName }, 'incrementFeatureAttempt 失敗（fail-open）')
    return 0
  }
}

/**
 * 查 feature 已修幾次（不增加）
 */
export async function getFeatureAttemptCount(
  conversationId: string | undefined | null,
  featureName: string,
): Promise<number> {
  if (!conversationId || !_redis || !featureName) return 0
  try {
    const key = `${FEATURE_KEY_PREFIX}${conversationId}:${featureName}`
    const raw = await _redis.get(key)
    return raw ? parseInt(raw, 10) : 0
  } catch (e) {
    logger.warn({ err: e, featureName }, 'getFeatureAttemptCount 失敗（fail-open）')
    return 0
  }
}

/**
 * 批次過濾：input 一組 feature names，回 [可繼續修, 已達上限該 skip]
 * fixMultipleFeatures 入口用
 */
export async function partitionFeaturesByAttemptCap(
  conversationId: string | undefined | null,
  featureNames: string[],
): Promise<{ canContinue: string[]; skipReachedCap: string[] }> {
  if (!conversationId || !_redis || featureNames.length === 0) {
    return { canContinue: featureNames, skipReachedCap: [] }
  }
  try {
    const counts = await Promise.all(
      featureNames.map(n => getFeatureAttemptCount(conversationId, n)),
    )
    const canContinue: string[] = []
    const skipReachedCap: string[] = []
    for (let i = 0; i < featureNames.length; i++) {
      if (counts[i] >= FEATURE_MAX_ATTEMPTS) {
        skipReachedCap.push(featureNames[i])
      } else {
        canContinue.push(featureNames[i])
      }
    }
    return { canContinue, skipReachedCap }
  } catch (e) {
    logger.warn({ err: e }, 'partitionFeaturesByAttemptCap 失敗（fail-open）')
    return { canContinue: featureNames, skipReachedCap: [] }
  }
}

export const PER_FEATURE_MAX_ATTEMPTS = FEATURE_MAX_ATTEMPTS
