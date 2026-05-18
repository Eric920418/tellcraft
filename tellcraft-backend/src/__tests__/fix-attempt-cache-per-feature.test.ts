import { describe, it, expect, beforeEach } from 'vitest'
import {
  setFixAttemptCacheRedis,
  incrementFeatureAttempt,
  getFeatureAttemptCount,
  partitionFeaturesByAttemptCap,
  PER_FEATURE_MAX_ATTEMPTS,
} from '../lib/fix-attempt-cache'

// Mock Redis（in-memory key-value 模擬 ioredis 介面）
class MockRedis {
  private store = new Map<string, string>()
  private ttls = new Map<string, number>()
  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null
  }
  async set(key: string, value: string, _ex?: string, ttl?: number): Promise<'OK'> {
    this.store.set(key, value)
    if (ttl) this.ttls.set(key, ttl)
    return 'OK'
  }
  async incr(key: string): Promise<number> {
    const current = parseInt(this.store.get(key) ?? '0', 10)
    const next = current + 1
    this.store.set(key, String(next))
    return next
  }
  async expire(key: string, ttl: number): Promise<number> {
    this.ttls.set(key, ttl)
    return 1
  }
  clear() {
    this.store.clear()
    this.ttls.clear()
  }
}

const mock = new MockRedis()

beforeEach(() => {
  mock.clear()
  setFixAttemptCacheRedis(mock as any)
})

describe('fix-attempt-cache — Per-feature attempt counter', () => {
  it('incrementFeatureAttempt 累加 + 首次設 TTL', async () => {
    const count1 = await incrementFeatureAttempt('conv-1', 'Create Article')
    expect(count1).toBe(1)
    const count2 = await incrementFeatureAttempt('conv-1', 'Create Article')
    expect(count2).toBe(2)
  })

  it('不同 feature 各自獨立計數', async () => {
    await incrementFeatureAttempt('conv-1', 'Create Article')
    await incrementFeatureAttempt('conv-1', 'Create Article')
    await incrementFeatureAttempt('conv-1', 'Delete Category')
    expect(await getFeatureAttemptCount('conv-1', 'Create Article')).toBe(2)
    expect(await getFeatureAttemptCount('conv-1', 'Delete Category')).toBe(1)
  })

  it('不同 conversation 不互相污染', async () => {
    await incrementFeatureAttempt('conv-1', 'Create Article')
    await incrementFeatureAttempt('conv-1', 'Create Article')
    expect(await getFeatureAttemptCount('conv-2', 'Create Article')).toBe(0)
  })

  it('Redis 未注入 fail-open 回 0', async () => {
    setFixAttemptCacheRedis(null)
    expect(await incrementFeatureAttempt('conv-1', 'X')).toBe(0)
    expect(await getFeatureAttemptCount('conv-1', 'X')).toBe(0)
  })

  it('conversationId / featureName 空字串 → 0', async () => {
    expect(await incrementFeatureAttempt(null, 'X')).toBe(0)
    expect(await incrementFeatureAttempt('', 'X')).toBe(0)
    expect(await incrementFeatureAttempt('conv-1', '')).toBe(0)
  })
})

describe('fix-attempt-cache — partitionFeaturesByAttemptCap', () => {
  it('全新 conversation → 全部 canContinue', async () => {
    const result = await partitionFeaturesByAttemptCap('conv-1', ['A', 'B', 'C'])
    expect(result.canContinue).toEqual(['A', 'B', 'C'])
    expect(result.skipReachedCap).toEqual([])
  })

  it('已達上限 features → skipReachedCap', async () => {
    // 把 feature A 增 5 次到上限
    for (let i = 0; i < PER_FEATURE_MAX_ATTEMPTS; i++) {
      await incrementFeatureAttempt('conv-1', 'A')
    }
    const result = await partitionFeaturesByAttemptCap('conv-1', ['A', 'B', 'C'])
    expect(result.canContinue.sort()).toEqual(['B', 'C'])
    expect(result.skipReachedCap).toEqual(['A'])
  })

  it('多 feature 已達上限 → 全部 skip', async () => {
    for (let i = 0; i < PER_FEATURE_MAX_ATTEMPTS; i++) {
      await incrementFeatureAttempt('conv-1', 'A')
      await incrementFeatureAttempt('conv-1', 'B')
    }
    const result = await partitionFeaturesByAttemptCap('conv-1', ['A', 'B', 'C'])
    expect(result.skipReachedCap.sort()).toEqual(['A', 'B'])
    expect(result.canContinue).toEqual(['C'])
  })

  it('Redis 未注入 fail-open 全部 canContinue', async () => {
    setFixAttemptCacheRedis(null)
    const result = await partitionFeaturesByAttemptCap('conv-1', ['A', 'B'])
    expect(result.canContinue).toEqual(['A', 'B'])
    expect(result.skipReachedCap).toEqual([])
  })

  it('PER_FEATURE_MAX_ATTEMPTS export 為 5', () => {
    expect(PER_FEATURE_MAX_ATTEMPTS).toBe(5)
  })

  it('b2252efc 情境 simulation：feature 修 5 次後第 6 次被擋', async () => {
    // 模擬 fixMultipleFeatures 跑 5 輪都失敗
    const featureName = 'Delete Category'
    for (let round = 0; round < 5; round++) {
      const partition = await partitionFeaturesByAttemptCap('b2252efc', [featureName])
      expect(partition.canContinue).toContain(featureName)  // 前 5 輪都能繼續
      await incrementFeatureAttempt('b2252efc', featureName)
    }
    // 第 6 輪 → 被 cap 擋
    const partition6 = await partitionFeaturesByAttemptCap('b2252efc', [featureName])
    expect(partition6.canContinue).toEqual([])
    expect(partition6.skipReachedCap).toEqual([featureName])
  })
})
