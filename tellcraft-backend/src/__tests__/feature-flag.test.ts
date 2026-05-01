import { describe, it, expect, beforeEach, vi } from 'vitest'
import { userBucket, isFeatureEnabledForUser } from '../lib/feature-flag'
import { getEnv } from '../lib/env'

// Default test env (matches setup.ts shape)
const baseEnv = {
  DATABASE_URL: 'postgresql://test:test@localhost/test',
  JWT_SECRET: 'test-secret',
  ANTHROPIC_API_KEY: 'sk-ant-test',
  PORT: 3100,
  REDIS_URL: 'redis://localhost:6379',
  CORS_ORIGIN: 'http://localhost:3000',
  DB_POOL_MAX: 20,
  LOG_LEVEL: 'info',
  NODE_ENV: 'test',
  WORKER_CONCURRENCY: 20,
  LLM_MAX_CONCURRENT: 20,
  LLM_QUEUE_TIMEOUT_MS: 120_000,
  DEPLOY_MAX_CONCURRENT: 2,
  DEPLOY_BUILD_MAX_MEMORY_MB: 1024,
  UPLOAD_DIR: '/tmp/uploads',
  APP_URL: 'http://localhost:3000',
  API_URL: 'http://localhost:3100',
  SOCKET_VERBOSE_LOG: false,
  ALLOWED_CALLBACK_HOSTS: 'http://localhost:3000',
}

function setEnvOverride(overrides: Record<string, unknown>) {
  vi.mocked(getEnv).mockReturnValue({
    ...baseEnv,
    ENABLE_UI_EVALUATOR: false,
    ENABLE_DESIGN_QUALITY_REPORT: false,
    ENABLE_REFINE_DIFF_OUTPUT: false,
    ENABLE_UI_EVALUATOR_ROLLOUT_PERCENT: 0,
    ENABLE_DESIGN_QUALITY_REPORT_ROLLOUT_PERCENT: 0,
    ENABLE_REFINE_DIFF_OUTPUT_ROLLOUT_PERCENT: 0,
    ...overrides,
  } as ReturnType<typeof getEnv>)
}

beforeEach(() => {
  vi.clearAllMocks()
  setEnvOverride({})
})

// ============================================================
// userBucket — deterministic + uniform
// ============================================================

describe('userBucket', () => {
  it('returns deterministic value for same input', () => {
    const a = userBucket('user-123', 'ui_evaluator')
    const b = userBucket('user-123', 'ui_evaluator')
    expect(a).toBe(b)
  })

  it('always returns 0-99', () => {
    for (let i = 0; i < 50; i++) {
      const v = userBucket(`user-${i}`, 'ui_evaluator')
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(100)
    }
  })

  it('reasonably uniform across users (1000 sample average ~50)', () => {
    const buckets: number[] = []
    for (let i = 0; i < 1000; i++) {
      buckets.push(userBucket(`u${i}`, 'ui_evaluator'))
    }
    const avg = buckets.reduce((s, b) => s + b, 0) / buckets.length
    expect(avg).toBeGreaterThan(40)
    expect(avg).toBeLessThan(60)
  })

  it('different flags produce salt-distinguished hashes', () => {
    // 統計層級：1000 user 的同 flag bucket 不應與另一 flag 高度相關
    let same = 0
    for (let i = 0; i < 1000; i++) {
      const a = userBucket(`u${i}`, 'ui_evaluator')
      const b = userBucket(`u${i}`, 'design_quality_report')
      if (a === b) same++
    }
    // 純機率撞 ~10/1000 同值；若 salt 失效會 1000/1000 同值
    expect(same).toBeLessThan(50)
  })
})

// ============================================================
// isFeatureEnabledForUser
// ============================================================

describe('isFeatureEnabledForUser', () => {
  it('hardOn=true overrides rollout (always on)', () => {
    setEnvOverride({
      ENABLE_UI_EVALUATOR: true,
      ENABLE_UI_EVALUATOR_ROLLOUT_PERCENT: 0,
    })
    expect(isFeatureEnabledForUser('ui_evaluator', 'any-user')).toBe(true)
  })

  it('hardOn=false + percent=0 → always off', () => {
    setEnvOverride({
      ENABLE_UI_EVALUATOR: false,
      ENABLE_UI_EVALUATOR_ROLLOUT_PERCENT: 0,
    })
    expect(isFeatureEnabledForUser('ui_evaluator', 'any-user')).toBe(false)
  })

  it('hardOn=false + percent=100 → always on', () => {
    setEnvOverride({
      ENABLE_UI_EVALUATOR: false,
      ENABLE_UI_EVALUATOR_ROLLOUT_PERCENT: 100,
    })
    expect(isFeatureEnabledForUser('ui_evaluator', 'any-user')).toBe(true)
  })

  it('percent=50 → roughly half users on', () => {
    setEnvOverride({
      ENABLE_UI_EVALUATOR: false,
      ENABLE_UI_EVALUATOR_ROLLOUT_PERCENT: 50,
    })
    let onCount = 0
    for (let i = 0; i < 1000; i++) {
      if (isFeatureEnabledForUser('ui_evaluator', `user-${i}`)) onCount++
    }
    expect(onCount).toBeGreaterThan(400)
    expect(onCount).toBeLessThan(600)
  })

  it('same user always gets same answer (deterministic)', () => {
    setEnvOverride({
      ENABLE_UI_EVALUATOR: false,
      ENABLE_UI_EVALUATOR_ROLLOUT_PERCENT: 30,
    })
    const a = isFeatureEnabledForUser('ui_evaluator', 'user-stable')
    const b = isFeatureEnabledForUser('ui_evaluator', 'user-stable')
    expect(a).toBe(b)
  })

  it('anonymous (null/undefined userId) handled gracefully', () => {
    setEnvOverride({
      ENABLE_UI_EVALUATOR: false,
      ENABLE_UI_EVALUATOR_ROLLOUT_PERCENT: 50,
    })
    const a = isFeatureEnabledForUser('ui_evaluator', null)
    const b = isFeatureEnabledForUser('ui_evaluator', undefined)
    expect(typeof a).toBe('boolean')
    expect(a).toBe(b)  // 兩者都用 'anonymous' bucket
  })

  it('three flags are independent', () => {
    setEnvOverride({
      ENABLE_UI_EVALUATOR: false,
      ENABLE_UI_EVALUATOR_ROLLOUT_PERCENT: 0,
      ENABLE_DESIGN_QUALITY_REPORT: false,
      ENABLE_DESIGN_QUALITY_REPORT_ROLLOUT_PERCENT: 100,
      ENABLE_REFINE_DIFF_OUTPUT: true,
      ENABLE_REFINE_DIFF_OUTPUT_ROLLOUT_PERCENT: 0,
    })
    expect(isFeatureEnabledForUser('ui_evaluator', 'u1')).toBe(false)
    expect(isFeatureEnabledForUser('design_quality_report', 'u1')).toBe(true)
    expect(isFeatureEnabledForUser('refine_diff_output', 'u1')).toBe(true)
  })
})
