// R2: Fix Attempt Cache 測試
import { describe, it, expect, beforeEach, vi } from 'vitest'

// 用 vi.hoisted 確保 mock Redis 在 module import 之前初始化
const { mockRedis, mockStore } = vi.hoisted(() => {
  const store = new Map<string, string>()
  const redis = {
    get: vi.fn(async (k: string) => store.get(k) ?? null),
    set: vi.fn(async (k: string, v: string) => { store.set(k, v); return 'OK' }),
  }
  return { mockRedis: redis, mockStore: store }
})

import {
  setFixAttemptCacheRedis,
  buildFingerprint,
  getAttemptRecord,
  recordAttempt,
  shouldSkipLlmFix,
  recordBatchAttempt,
} from '../lib/fix-attempt-cache'

beforeEach(() => {
  mockStore.clear()
  mockRedis.get.mockClear()
  mockRedis.set.mockClear()
  setFixAttemptCacheRedis(mockRedis as never)
})

describe('R2: buildFingerprint', () => {
  it('same input → same fingerprint', () => {
    const fp1 = buildFingerprint({ loopName: 'validation', featureName: 'F', issueKind: 'k', keyContent: 'abc' })
    const fp2 = buildFingerprint({ loopName: 'validation', featureName: 'F', issueKind: 'k', keyContent: 'abc' })
    expect(fp1).toBe(fp2)
    expect(fp1).toHaveLength(16)
  })
  it('different loops → different fingerprints', () => {
    const fp1 = buildFingerprint({ loopName: 'validation', featureName: 'F', issueKind: 'k', keyContent: 'abc' })
    const fp2 = buildFingerprint({ loopName: 'dry_run', featureName: 'F', issueKind: 'k', keyContent: 'abc' })
    expect(fp1).not.toBe(fp2)
  })
})

describe('R2: shouldSkipLlmFix — skip rules', () => {
  it('null conversationId → allow', async () => {
    const r = await shouldSkipLlmFix(null, ['fp1'])
    expect(r.skip).toBe(false)
  })
  it('empty fingerprints → allow', async () => {
    const r = await shouldSkipLlmFix('conv-1', [])
    expect(r.skip).toBe(false)
  })
  it('no cache entries → allow (first attempt)', async () => {
    const r = await shouldSkipLlmFix('conv-1', ['fp1', 'fp2'])
    expect(r.skip).toBe(false)
    expect(r.attemptCounts).toEqual([0, 0])
  })
  it('all fingerprints exceeded 2 attempts → skip', async () => {
    await recordAttempt('conv-1', 'fp1', false)
    await recordAttempt('conv-1', 'fp1', false)
    await recordAttempt('conv-1', 'fp2', false)
    await recordAttempt('conv-1', 'fp2', false)
    const r = await shouldSkipLlmFix('conv-1', ['fp1', 'fp2'])
    expect(r.skip).toBe(true)
    expect(r.reason).toContain('already attempted')
  })
  it('any fingerprint marked succeeded → not skip', async () => {
    await recordAttempt('conv-1', 'fp1', true)  // 之前修成功
    await recordAttempt('conv-1', 'fp1', true)
    const r = await shouldSkipLlmFix('conv-1', ['fp1'])
    expect(r.skip).toBe(false)
    expect(r.reason).toContain('previously-succeeded')
  })
  it('partial exceeded → not skip (one new issue → run LLM)', async () => {
    await recordAttempt('conv-1', 'fp1', false)
    await recordAttempt('conv-1', 'fp1', false)
    // fp2 never attempted
    const r = await shouldSkipLlmFix('conv-1', ['fp1', 'fp2'])
    expect(r.skip).toBe(false)
  })
})

describe('R2: recordAttempt count semantics', () => {
  it('increments count on repeated calls', async () => {
    await recordAttempt('conv-1', 'fp1', false)
    let r = await getAttemptRecord('conv-1', 'fp1')
    expect(r?.count).toBe(1)
    await recordAttempt('conv-1', 'fp1', false)
    r = await getAttemptRecord('conv-1', 'fp1')
    expect(r?.count).toBe(2)
  })
  it('uses prefix bdd-fix-attempted', async () => {
    await recordAttempt('conv-x', 'fp1', false)
    const keys = [...mockStore.keys()]
    expect(keys.some(k => k.startsWith('bdd-fix-attempted:conv-x:'))).toBe(true)
  })
})

describe('R2: recordBatchAttempt', () => {
  it('marks succeeded vs remaining separately', async () => {
    await recordBatchAttempt('conv-1', ['fp_done'], ['fp_pending'])
    const done = await getAttemptRecord('conv-1', 'fp_done')
    const pending = await getAttemptRecord('conv-1', 'fp_pending')
    expect(done?.succeeded).toBe(true)
    expect(pending?.succeeded).toBe(false)
  })
})

describe('R2: fail-open behaviors', () => {
  it('Redis not injected → not skip', async () => {
    setFixAttemptCacheRedis(null)
    const r = await shouldSkipLlmFix('conv-1', ['fp1'])
    expect(r.skip).toBe(false)
    expect(r.reason).toContain('fail-open')
  })
  it('Redis throws → fail-open (not skip)', async () => {
    setFixAttemptCacheRedis({
      get: vi.fn().mockRejectedValue(new Error('Redis error')),
      set: vi.fn(),
    } as never)
    const r = await shouldSkipLlmFix('conv-1', ['fp1'])
    expect(r.skip).toBe(false)
  })
})

describe('R2: namespace isolation', () => {
  it('different conversation IDs → independent cache', async () => {
    await recordAttempt('conv-A', 'fp1', false)
    await recordAttempt('conv-A', 'fp1', false)
    const rA = await shouldSkipLlmFix('conv-A', ['fp1'])
    const rB = await shouldSkipLlmFix('conv-B', ['fp1'])
    expect(rA.skip).toBe(true)
    expect(rB.skip).toBe(false)
  })
})
