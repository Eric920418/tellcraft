import { describe, it, expect } from 'vitest'
import {
  setAbortFlag,
  isAbortRequested,
  clearAbortFlag,
  makeAbortChecker,
} from '../services/abort-flag'
import type Redis from 'ioredis'

// 簡易記憶體 Redis stub（覆蓋本模組用到的 set/get/del）
function mockRedis(): Redis & { _store: Map<string, string>; _shouldFail?: boolean } {
  const store = new Map<string, string>()
  const stub = {
    _store: store,
    _shouldFail: false,
    async set(key: string, value: string, _ex?: string, _ttl?: number) {
      if (stub._shouldFail) throw new Error('redis down')
      store.set(key, value)
      return 'OK'
    },
    async get(key: string) {
      if (stub._shouldFail) throw new Error('redis down')
      return store.get(key) ?? null
    },
    async del(key: string) {
      if (stub._shouldFail) throw new Error('redis down')
      const had = store.delete(key)
      return had ? 1 : 0
    },
  } as unknown as Redis & { _store: Map<string, string>; _shouldFail?: boolean }
  return stub
}

describe('abort-flag', () => {
  it('set + isAbortRequested round-trip', async () => {
    const r = mockRedis()
    await setAbortFlag(r, 'conv-1')
    expect(await isAbortRequested(r, 'conv-1')).toBe(true)
  })

  it('isAbortRequested returns false for unset key', async () => {
    const r = mockRedis()
    expect(await isAbortRequested(r, 'never-set')).toBe(false)
  })

  it('clearAbortFlag removes the flag', async () => {
    const r = mockRedis()
    await setAbortFlag(r, 'c1')
    await clearAbortFlag(r, 'c1')
    expect(await isAbortRequested(r, 'c1')).toBe(false)
  })

  it('different conversationId scopes', async () => {
    const r = mockRedis()
    await setAbortFlag(r, 'c1')
    expect(await isAbortRequested(r, 'c1')).toBe(true)
    expect(await isAbortRequested(r, 'c2')).toBe(false)
  })

  it('isAbortRequested fail-open on redis error', async () => {
    const r = mockRedis()
    r._shouldFail = true
    expect(await isAbortRequested(r, 'c1')).toBe(false)
  })

  it('setAbortFlag fail-silently on redis error (does not throw)', async () => {
    const r = mockRedis()
    r._shouldFail = true
    await expect(setAbortFlag(r, 'c1')).resolves.toBeUndefined()
  })

  it('returns false for missing redis or conversationId', async () => {
    expect(await isAbortRequested(null, 'c1')).toBe(false)
    expect(await isAbortRequested(undefined, 'c1')).toBe(false)
    const r = mockRedis()
    expect(await isAbortRequested(r, '')).toBe(false)
    expect(await isAbortRequested(r, undefined)).toBe(false)
  })

  it('makeAbortChecker returns closure that polls', async () => {
    const r = mockRedis()
    const checker = makeAbortChecker(r, 'c1')
    expect(await checker()).toBe(false)
    await setAbortFlag(r, 'c1')
    expect(await checker()).toBe(true)
  })
})
