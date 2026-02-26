import Redis from 'ioredis'
import crypto from 'crypto'

const LOCK_PREFIX = 'conv-lock:'
const LOCK_TTL_SECONDS = 300 // 5 分鐘，覆蓋最長的部署流程

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
 * 包裝函數：自動 acquire → 執行 → release
 * 鎖失敗時返回 { locked: true }，成功時返回 { locked: false, result }
 */
export async function withConversationLock<T>(
  redis: Redis,
  conversationId: string,
  fn: () => Promise<T>
): Promise<{ locked: false; result: T } | { locked: true }> {
  const { acquired, lockId } = await acquireConversationLock(redis, conversationId)

  if (!acquired) {
    return { locked: true }
  }

  try {
    const result = await fn()
    return { locked: false, result }
  } finally {
    await releaseConversationLock(redis, conversationId, lockId)
  }
}
