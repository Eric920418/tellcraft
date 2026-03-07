import type Redis from 'ioredis'
import { createLogger } from './logger'

const logger = createLogger('cache')

let redis: Redis | null = null

export function setCacheRedisClient(r: Redis) {
  redis = r
}

/**
 * 通用 Redis 快取 wrapper
 * 無 Redis → 直接執行 fn()（降級為無快取）
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
): Promise<T> {
  if (redis) {
    try {
      const hit = await redis.get(key)
      if (hit) return JSON.parse(hit) as T
    } catch (err) {
      logger.warn({ err, key }, '快取讀取失敗')
    }
  }

  const result = await fn()

  if (redis) {
    redis.set(key, JSON.stringify(result), 'EX', ttlSeconds).catch((err) => {
      logger.warn({ err, key }, '快取寫入失敗')
    })
  }

  return result
}

/**
 * 清除指定快取 key
 */
export async function invalidateCache(...keys: string[]): Promise<void> {
  if (redis && keys.length > 0) {
    await redis.del(...keys).catch((err) => {
      logger.warn({ err, keys }, '快取清除失敗')
    })
  }
}
