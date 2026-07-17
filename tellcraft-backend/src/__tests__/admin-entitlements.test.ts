import { describe, it, expect } from 'vitest'
import {
  ADMIN_PLAN,
  UNLIMITED,
  resolveEffectivePlan,
  isUnlimitedPlan,
  isFairUsePlan,
  getCreditLimit,
  getProjectLimit,
  getDomainLimit,
  getDbLimit,
  isCreditExhausted,
} from '../config/plans'

describe('resolveEffectivePlan — admin 配額豁免的單一入口', () => {
  it('is_admin（DB row，snake_case）→ admin 有效方案', () => {
    expect(resolveEffectivePlan({ plan: 'free', is_admin: true })).toBe(ADMIN_PLAN)
  })

  it('isAdmin（req.user / JWT payload，camelCase）→ admin 有效方案', () => {
    expect(resolveEffectivePlan({ plan: 'free', isAdmin: true })).toBe(ADMIN_PLAN)
  })

  it('非 admin 一律原樣回傳真實方案（不得改動既有行為）', () => {
    expect(resolveEffectivePlan({ plan: 'free', is_admin: false })).toBe('free')
    expect(resolveEffectivePlan({ plan: 'creator', isAdmin: false })).toBe('creator')
    expect(resolveEffectivePlan({ plan: 'pro' })).toBe('pro')
    expect(resolveEffectivePlan({ plan: 'business', is_admin: null })).toBe('business')
  })

  it('admin 身份壓過真實方案 — 即使 plan 是 free', () => {
    // 核心情境：Eric 的帳號 plan 停在 free，但 is_admin=true 就該完全不受限
    expect(resolveEffectivePlan({ plan: 'free', is_admin: true })).toBe(ADMIN_PLAN)
  })
})

describe('admin 有效方案的配額 — 四張表都必須無限', () => {
  it('credit 無限且永不判定為耗盡', () => {
    expect(getCreditLimit(ADMIN_PLAN)).toBe(UNLIMITED)
    expect(isCreditExhausted(ADMIN_PLAN, 0)).toBe(false)
    expect(isCreditExhausted(ADMIN_PLAN, 999_999_999)).toBe(false)
  })

  it('專案 / 域名 / DB 數量無限', () => {
    expect(getProjectLimit(ADMIN_PLAN)).toBe(UNLIMITED)
    expect(getDomainLimit(ADMIN_PLAN)).toBe(UNLIMITED)
    expect(getDbLimit(ADMIN_PLAN)).toBe(UNLIMITED)
  })

  it('DB 上限必須 > 0 — checkDbQuota 對 limit <= 0 是直接硬擋，不是比數量', () => {
    expect(getDbLimit(ADMIN_PLAN)).toBeGreaterThan(0)
    expect(getDomainLimit(ADMIN_PLAN)).toBeGreaterThan(0)
  })

  it('isUnlimitedPlan 只認 admin', () => {
    expect(isUnlimitedPlan(ADMIN_PLAN)).toBe(true)
    for (const plan of ['free', 'creator', 'pro', 'business']) {
      expect(isUnlimitedPlan(plan)).toBe(false)
    }
  })

  it('admin 走 fair-use 顯示分支 — 避免前端印出 "12 / null"（Infinity 序列化成 null）', () => {
    expect(isFairUsePlan(ADMIN_PLAN)).toBe(true)
    expect(JSON.parse(JSON.stringify({ limit: getCreditLimit(ADMIN_PLAN) })).limit).toBeNull()
  })
})

describe('既有付費方案配額不得被 admin 改動汙染（回歸）', () => {
  it('四個真實方案的 credit 上限維持原值', () => {
    expect(getCreditLimit('free')).toBe(15)
    expect(getCreditLimit('creator')).toBe(90)
    expect(getCreditLimit('pro')).toBe(300)
    expect(getCreditLimit('business')).toBe(900)
  })

  it('free 仍受限、仍不可建 DB / 綁域名', () => {
    expect(isCreditExhausted('free', 15)).toBe(true)
    expect(getProjectLimit('free')).toBe(1)
    expect(getDbLimit('free')).toBe(0)
    expect(getDomainLimit('free')).toBe(0)
  })

  it('fair-use 仍只有 business 與 admin', () => {
    expect(isFairUsePlan('business')).toBe(true)
    expect(isFairUsePlan('free')).toBe(false)
    expect(isFairUsePlan('creator')).toBe(false)
    expect(isFairUsePlan('pro')).toBe(false)
  })

  it('未知方案 fallback 維持最保守值', () => {
    expect(getCreditLimit('nonexistent')).toBe(15)
    expect(getProjectLimit('nonexistent')).toBe(1)
    expect(getDbLimit('nonexistent')).toBe(0)
  })
})
