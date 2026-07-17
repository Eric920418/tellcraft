// ============================================================
// 配額常數唯一來源（所有路由/服務一律 import 此檔）
// ============================================================

/** Credit 扣除成本 */
export const CREDIT_COSTS = {
  /** 聊天/釐清/BDD 回答 — 0-1 Haiku */
  BASE_MESSAGE: 1,
  /** Design Brief 生成 — 1-4 Sonnet */
  DESIGN_BRIEF: 3,
  /** Design Variant 生成 — 1 Sonnet */
  DESIGN_VARIANT: 2,
  /** BDD Formulation — 2-5 Sonnet */
  BDD_FORMULATION: 5,
  /** Fast Build 完整管線 — 3 Sonnet + QG */
  FAST_BUILD: 8,
  /** Normal UIUX 完整管線 — 3-6 Sonnet + QG */
  UIUX_PIPELINE: 10,
  /** 迭代修改 (refineCode) — 1 Sonnet (大 context) */
  ITERATION: 3,
  /** 部署 — 0-7 Sonnet (平均低) */
  DEPLOY: 2,
} as const

// ============================================================
// Admin 有效方案（不受配額限制）
// ============================================================

/**
 * Admin 的「有效方案」。
 * 這不是可購買方案，也永遠不會寫進 users.plan — 它只在執行期由
 * resolveEffectivePlan() 從 users.is_admin 解析出來，作為所有配額查表的 key。
 * 用虛擬方案而非把 admin 當成 business，是為了讓 admin 不佔用真實方案語意
 * （統計、帳單、fair-use 文案都不會被污染）。
 */
export const ADMIN_PLAN = 'admin'

/** 無限配額。JS 端比較用；寫進 SQL 前必須先經 isUnlimitedPlan() 分支掉 */
export const UNLIMITED = Number.POSITIVE_INFINITY

/**
 * 配額判斷的唯一入口：把「使用者」解析成「有效方案」。
 *
 * 任何 `SELECT plan FROM users` 之後要拿 plan 去查配額的地方，都必須先經過這裡，
 * 否則該檢查點對 admin 不會放行（新增配額檢查時的漏接點）。
 *
 * 同時吃 is_admin（DB row）與 isAdmin（req.user / JWT payload），避免 snake/camel
 * 混用導致無聲讀到 undefined 而失效。
 */
export function resolveEffectivePlan(user: {
  plan: string
  is_admin?: boolean | null
  isAdmin?: boolean | null
}): string {
  return user.is_admin || user.isAdmin ? ADMIN_PLAN : user.plan
}

/** 該有效方案是否完全不受配額限制 */
export function isUnlimitedPlan(plan: string): boolean {
  return plan === ADMIN_PLAN
}

/** 方案每月 Credit 配額 */
export const PLAN_CREDIT_LIMITS: Record<string, number> = {
  free: 15,
  creator: 90,
  pro: 300,
  business: 900,
  [ADMIN_PLAN]: UNLIMITED,
}

/** 方案專案數量上限 */
export const PLAN_PROJECT_LIMITS: Record<string, number> = {
  free: 1,
  creator: 5,
  pro: 20,
  business: 100,
  [ADMIN_PLAN]: UNLIMITED,
}

/** 方案域名數量上限（free 不可使用） */
export const PLAN_DOMAIN_LIMITS: Record<string, number> = {
  free: 0,
  creator: 1,
  pro: 2,
  business: 3,
  [ADMIN_PLAN]: UNLIMITED,
}

/** 方案 DB 數量上限（free 不可使用） */
export const PLAN_DB_LIMITS: Record<string, number> = {
  free: 0,
  creator: 1,
  pro: 3,
  business: 5,
  [ADMIN_PLAN]: UNLIMITED,
}

/** 取得方案 DB 上限 */
export function getDbLimit(plan: string): number {
  return PLAN_DB_LIMITS[plan] ?? 0
}

/** 配額耗盡錯誤碼 */
export const CREDIT_LIMIT_ERROR_CODE = 'CREDIT_LIMIT_REACHED'

/** 取得方案 Credit 上限 */
export function getCreditLimit(plan: string): number {
  return PLAN_CREDIT_LIMITS[plan] ?? 15
}

/**
 * 對外以 fair use 文案呈現的方案（= UI 上不顯示配額分母的方案）。
 * admin 納入此列：其 limit 是 Infinity，經 JSON 序列化會變 null，
 * 靠這個旗標讓前端走「只顯示已用量」的既有分支，而非印出 "12 / null"。
 */
export function isFairUsePlan(plan: string): boolean {
  return plan === 'business' || plan === ADMIN_PLAN
}

/** 取得方案專案上限 */
export function getProjectLimit(plan: string): number {
  return PLAN_PROJECT_LIMITS[plan] ?? 1
}

/** 取得方案域名上限 */
export function getDomainLimit(plan: string): number {
  return PLAN_DOMAIN_LIMITS[plan] ?? 0
}

/** 判斷是否已用完 Credit */
export function isCreditExhausted(plan: string, creditsUsed: number): boolean {
  const limit = getCreditLimit(plan)
  return creditsUsed >= limit
}
