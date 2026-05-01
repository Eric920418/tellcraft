/**
 * Feature Flag with Canary Rollout (T9)
 *
 * 既有 `ENABLE_UI_EVALUATOR` / `ENABLE_DESIGN_QUALITY_REPORT` /
 * `ENABLE_REFINE_DIFF_OUTPUT` 三 flag default false → P0~P6 / diff output
 * 60-70% token 節省大部分用戶享受不到。
 *
 * 本模組做「金絲雀放量」：
 *  1. 既有 boolean flag 仍支援（true → 100% on）
 *  2. 加 `ROLLOUT_PERCENT`（0-100）→ 用 userId hash 做 deterministic bucket
 *  3. 用戶 bucket 落在 percent 範圍內 → enable
 *  4. boolean flag = true 時直接 100%（覆蓋 percent）
 *
 * 同一個 userId 對同一個 flag 永遠落在同一桶（deterministic），
 * 確保用戶體驗一致（不會這次 evaluator on 下次 off 來回變）。
 */

import { getEnv } from './env'

export type RolloutFlagName = 'ui_evaluator' | 'design_quality_report' | 'refine_diff_output'

interface FlagConfig {
  hardOn: boolean        // ENABLE_X = true（硬開）
  rolloutPercent: number // ENABLE_X_ROLLOUT_PERCENT (0-100)
}

function getFlagConfig(flag: RolloutFlagName): FlagConfig {
  const env = getEnv()
  switch (flag) {
    case 'ui_evaluator':
      return {
        hardOn: env.ENABLE_UI_EVALUATOR,
        rolloutPercent: env.ENABLE_UI_EVALUATOR_ROLLOUT_PERCENT,
      }
    case 'design_quality_report':
      return {
        hardOn: env.ENABLE_DESIGN_QUALITY_REPORT,
        rolloutPercent: env.ENABLE_DESIGN_QUALITY_REPORT_ROLLOUT_PERCENT,
      }
    case 'refine_diff_output':
      return {
        hardOn: env.ENABLE_REFINE_DIFF_OUTPUT,
        rolloutPercent: env.ENABLE_REFINE_DIFF_OUTPUT_ROLLOUT_PERCENT,
      }
  }
}

/**
 * djb2 hash → 0-99 桶位。同一個 userId 永遠落同一桶。
 * 加 flag name 作為 salt，避免不同 flag 的 bucket 相關（防止「總是落桶 0 的用戶」全部享受 / 全部排除）。
 */
export function userBucket(userId: string, flag: RolloutFlagName): number {
  const input = `${userId}::${flag}`
  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % 100
}

/**
 * 判斷使用者是否啟用某 flag。
 *
 * 規則：
 *   - hardOn=true → 永遠啟用（覆蓋 rollout）
 *   - hardOn=false + rolloutPercent=0 → 永遠停用
 *   - hardOn=false + rolloutPercent=N → userBucket < N 啟用
 *   - userId 缺失 → 視同 anonymous bucket，但不寫死，用 'anonymous' 作 hash key
 */
export function isFeatureEnabledForUser(
  flag: RolloutFlagName,
  userId: string | undefined | null,
): boolean {
  const cfg = getFlagConfig(flag)
  if (cfg.hardOn) return true
  if (cfg.rolloutPercent <= 0) return false
  if (cfg.rolloutPercent >= 100) return true
  const bucket = userBucket(userId || 'anonymous', flag)
  return bucket < cfg.rolloutPercent
}

/**
 * 回傳當前所有 rollout flag 狀態（給 telemetry / debug 用）。
 */
export function getAllRolloutStatus() {
  const env = getEnv()
  return {
    ui_evaluator: { hardOn: env.ENABLE_UI_EVALUATOR, rolloutPercent: env.ENABLE_UI_EVALUATOR_ROLLOUT_PERCENT },
    design_quality_report: { hardOn: env.ENABLE_DESIGN_QUALITY_REPORT, rolloutPercent: env.ENABLE_DESIGN_QUALITY_REPORT_ROLLOUT_PERCENT },
    refine_diff_output: { hardOn: env.ENABLE_REFINE_DIFF_OUTPUT, rolloutPercent: env.ENABLE_REFINE_DIFF_OUTPUT_ROLLOUT_PERCENT },
  }
}
