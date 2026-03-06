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

/** 方案每月 Credit 配額 */
export const PLAN_CREDIT_LIMITS: Record<string, number> = {
  free: 30,
  creator: 150,
  pro: 800,
  business: Infinity,
}

/** 方案專案數量上限 */
export const PLAN_PROJECT_LIMITS: Record<string, number> = {
  free: 1,
  creator: 5,
  pro: 20,
  business: 100,
}

/** 配額耗盡錯誤碼 */
export const CREDIT_LIMIT_ERROR_CODE = 'CREDIT_LIMIT_REACHED'

/** 取得方案 Credit 上限 */
export function getCreditLimit(plan: string): number {
  return PLAN_CREDIT_LIMITS[plan] ?? 30
}

/** 取得方案專案上限 */
export function getProjectLimit(plan: string): number {
  return PLAN_PROJECT_LIMITS[plan] ?? 1
}

/** 判斷是否已用完 Credit */
export function isCreditExhausted(plan: string, creditsUsed: number): boolean {
  const limit = getCreditLimit(plan)
  return creditsUsed >= limit
}
