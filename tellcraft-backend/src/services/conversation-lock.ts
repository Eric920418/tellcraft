import Redis from 'ioredis'
import crypto from 'crypto'

const LOCK_PREFIX = 'conv-lock:'
// 10 分鐘 TTL + withConversationLock 自動續約（每 4 分鐘）
// 長時間任務（fast_generating 最長 35 min）由續約覆蓋
// Worker 崩潰時最多 10 分鐘自動過期，不再卡 35 分鐘
const LOCK_TTL_SECONDS = 600

/**
 * 嘗試取得對話互斥鎖（Redis SET NX EX）
 * 同一對話同一時間只允許一個 Worker job 執行
 */
export async function acquireConversationLock(
  redis: Redis,
  conversationId: string
): Promise<{ acquired: boolean; lockId: string }> {
  const lockId = crypto.randomUUID()
  const key = `${LOCK_PREFIX}${conversationId}`

  const result = await redis.set(key, lockId, 'EX', LOCK_TTL_SECONDS, 'NX')
  return { acquired: result === 'OK', lockId }
}

/**
 * 釋放對話鎖（Lua script 確保只釋放自己持有的鎖）
 */
export async function releaseConversationLock(
  redis: Redis,
  conversationId: string,
  lockId: string
): Promise<boolean> {
  const key = `${LOCK_PREFIX}${conversationId}`

  // Lua: 只有 lockId 匹配時才刪除，防止誤刪其他 Worker 的鎖
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `
  const result = await redis.eval(script, 1, key, lockId)
  return result === 1
}

/**
 * 續約對話鎖 TTL（Lua script：只有 lockId 匹配時才 EXPIRE）
 * 供 withConversationLock 內部定時器使用
 */
export async function refreshConversationLock(
  redis: Redis,
  conversationId: string,
  lockId: string
): Promise<boolean> {
  const key = `${LOCK_PREFIX}${conversationId}`
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("expire", KEYS[1], ARGV[2])
    else
      return 0
    end
  `
  const result = await redis.eval(script, 1, key, lockId, String(LOCK_TTL_SECONDS))
  return result === 1
}

/**
 * 強制釋放對話鎖（不驗證 lockId）
 * 僅供 flowstate-recovery 在超時恢復後使用，避免 lock 繼續卡住
 */
export async function forceReleaseConversationLock(
  redis: Redis,
  conversationId: string
): Promise<boolean> {
  const key = `${LOCK_PREFIX}${conversationId}`
  const result = await redis.del(key)
  return result === 1
}

// ============================================================
// 用戶全局任務鎖（user-active）
// 同一用戶任何時間只能有一個活躍 AI 任務
// ============================================================

const USER_ACTIVE_PREFIX = 'user-active:'
export const USER_ACTIVE_TTL_SECONDS = 600 // 10 分鐘，與 conv-lock 一致（續約覆蓋長時間任務）

/**
 * API 層呼叫：原子 check-and-set
 * 返回 { acquired: true } 或 { acquired: false, activeConversationId }
 * Redis 不可用時 fail-open（返回 acquired: true）
 */
export async function acquireUserActiveLock(
  redis: Redis,
  userId: string,
  conversationId: string
): Promise<{ acquired: true } | { acquired: false; activeConversationId: string }> {
  try {
    const key = `${USER_ACTIVE_PREFIX}${userId}`
    // Lua 原子 check-and-set：有佔用者返回佔用 conversationId，否則設值並返回 "OK"
    const script = `
      local existing = redis.call("GET", KEYS[1])
      if existing then
        return existing
      end
      redis.call("SET", KEYS[1], ARGV[1], "EX", ARGV[2])
      return "OK"
    `
    const result = await redis.eval(script, 1, key, conversationId, String(USER_ACTIVE_TTL_SECONDS)) as string

    if (result === 'OK') {
      return { acquired: true }
    }
    // 返回的是已佔用的 conversationId
    return { acquired: false, activeConversationId: result }
  } catch {
    // Redis 不可用時 fail-open
    return { acquired: true }
  }
}

/**
 * Worker 完成後釋放（Lua 精確釋放，只釋放自己佔用的鎖）
 */
export async function releaseUserActiveLock(
  redis: Redis,
  userId: string,
  conversationId: string
): Promise<boolean> {
  try {
    const key = `${USER_ACTIVE_PREFIX}${userId}`
    const script = `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
      else
        return 0
      end
    `
    const result = await redis.eval(script, 1, key, conversationId)
    return result === 1
  } catch {
    return false
  }
}

/**
 * 續約用戶任務鎖 TTL（Lua script：只有 conversationId 匹配時才 EXPIRE）
 * 供 withConversationLock 內部定時器使用
 */
export async function refreshUserActiveLock(
  redis: Redis,
  userId: string,
  conversationId: string
): Promise<boolean> {
  try {
    const key = `${USER_ACTIVE_PREFIX}${userId}`
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("expire", KEYS[1], ARGV[2])
      else
        return 0
      end
    `
    const result = await redis.eval(script, 1, key, conversationId, String(USER_ACTIVE_TTL_SECONDS))
    return result === 1
  } catch {
    return false
  }
}

/**
 * 強制釋放用戶任務鎖（不驗證 conversationId）
 * 僅供 flowstate-recovery 在超時後使用
 */
export async function forceReleaseUserActiveLock(
  redis: Redis,
  userId: string
): Promise<boolean> {
  try {
    const key = `${USER_ACTIVE_PREFIX}${userId}`
    const result = await redis.del(key)
    return result === 1
  } catch {
    return false
  }
}

// 續約間隔：TTL 10 分鐘，每 4 分鐘續約一次（留 6 分鐘安全餘量）
const LOCK_REFRESH_INTERVAL_MS = 4 * 60 * 1000

/**
 * 包裝函數：自動 acquire → 定時續約 → 執行 → release
 * 鎖失敗時返回 { locked: true }，成功時返回 { locked: false, result }
 * 自動每 4 分鐘續約 conv-lock 和 user-active lock（若提供 userId）
 */
export async function withConversationLock<T>(
  redis: Redis,
  conversationId: string,
  fn: () => Promise<T>,
  options?: { userId?: string }
): Promise<{ locked: false; result: T } | { locked: true }> {
  const { acquired, lockId } = await acquireConversationLock(redis, conversationId)

  if (!acquired) {
    return { locked: true }
  }

  // 自動續約定時器：每 4 分鐘刷新 lock TTL，防止長時間任務鎖過期
  const refreshTimer = setInterval(() => {
    void refreshConversationLock(redis, conversationId, lockId).catch(() => {})
    if (options?.userId) {
      void refreshUserActiveLock(redis, options.userId, conversationId).catch(() => {})
    }
  }, LOCK_REFRESH_INTERVAL_MS)

  try {
    const result = await fn()
    return { locked: false, result }
  } finally {
    clearInterval(refreshTimer)
    await releaseConversationLock(redis, conversationId, lockId)
  }
}
