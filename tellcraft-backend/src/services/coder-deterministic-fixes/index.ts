// ============================================================
// Coder Deterministic Fixes — 零 LLM 機械修復
// 替代 fixFailingAction 中三類 rootCause 的 LLM 修復：
//   missing_column → tryFixMissingColumn (schema column 對齊)
//   wrong_status   → tryFixWrongStatus   (HTTP status code 回填)
//   field_naming   → tryFixFieldNaming   (response field camelCase 對齊)
//
// 每個 fix 為純函數：(code, error, context) → string | null
//   成功 → 修復後的 code（會過 esbuild 驗證）
//   失敗 → null（呼叫端 fallback 到 LLM 修復，帶 harnessHint）
// ============================================================

import { createLogger } from '../../lib/logger'
import { recordTelemetry, truncateFeedback } from '../skill-telemetry'
import { tryFixMissingColumn } from './missing-column'
import { tryFixWrongStatus } from './wrong-status'
import { tryFixFieldNaming } from './field-naming'

const logger = createLogger('deterministic-fixes')

export { tryFixMissingColumn } from './missing-column'
export { tryFixWrongStatus } from './wrong-status'
export { tryFixFieldNaming } from './field-naming'

export type DeterministicRootCause = 'missing_column' | 'wrong_status' | 'field_naming'

export interface DeterministicFixContext {
  actionName: string
  schemaSql: string
  error: string
  featureContent?: string
  trackingContext?: { userId?: string; conversationId?: string }
}

export interface DeterministicFixResult {
  fixedCode: string
  strategy: string
}

/**
 * Dispatch 入口：根據 rootCause 呼叫對應 fixer，並做 esbuild 驗證 + telemetry
 * @returns 修復後 code（已過 esbuild 驗證），失敗回 null
 */
export async function tryDeterministicFix(
  rootCause: DeterministicRootCause,
  currentCode: string,
  ctx: DeterministicFixContext,
): Promise<string | null> {
  let result: DeterministicFixResult | null = null

  try {
    switch (rootCause) {
      case 'missing_column':
        result = tryFixMissingColumn(currentCode, ctx)
        break
      case 'wrong_status':
        result = tryFixWrongStatus(currentCode, ctx)
        break
      case 'field_naming':
        result = tryFixFieldNaming(currentCode, ctx)
        break
    }
  } catch (err) {
    logger.warn({ err, rootCause, actionName: ctx.actionName }, 'Deterministic fix 拋出例外，fallback 到 LLM')
    recordFailMetric(rootCause, ctx, 'exception')
    return null
  }

  if (!result) {
    recordFailMetric(rootCause, ctx, 'no_match')
    return null
  }

  // esbuild 語法驗證（修壞了就 rollback）
  try {
    const esbuild = await import('esbuild')
    await esbuild.transform(result.fixedCode, { loader: 'ts' })
  } catch (syntaxErr) {
    logger.warn(
      { rootCause, actionName: ctx.actionName, strategy: result.strategy, err: String(syntaxErr).slice(0, 200) },
      'Deterministic fix 產出代碼語法錯誤，fallback 到 LLM',
    )
    recordFailMetric(rootCause, ctx, 'syntax_error')
    return null
  }

  // 成功埋點
  recordTelemetry({
    skillName: 'coder',
    eventType: 'coder_test_fix_success',
    patternKey: `deterministic_fix:${rootCause}`,
    outcome: 'repaired',
    rootCauseCategory: rootCause,
    phase: 'coder_green_phase',
    userId: ctx.trackingContext?.userId,
    conversationId: ctx.trackingContext?.conversationId,
    payload: {
      actionName: ctx.actionName,
      fixStrategy: result.strategy,
      beforeHash: hashString(currentCode),
      afterHash: hashString(result.fixedCode),
      evidence: truncateFeedback(ctx.error),
    },
  }).catch(() => {})

  logger.info({ rootCause, actionName: ctx.actionName, strategy: result.strategy }, '零 LLM 修復成功')
  return result.fixedCode
}

function recordFailMetric(
  rootCause: DeterministicRootCause,
  ctx: DeterministicFixContext,
  reason: string,
): void {
  recordTelemetry({
    skillName: 'coder',
    eventType: 'coder_test_fail',
    patternKey: `deterministic_fix_miss:${rootCause}`,
    outcome: 'failed',
    rootCauseCategory: rootCause,
    phase: 'coder_green_phase',
    errorType: 'test_fail',
    severity: 'info',
    userId: ctx.trackingContext?.userId,
    conversationId: ctx.trackingContext?.conversationId,
    payload: { actionName: ctx.actionName, reason, evidence: truncateFeedback(ctx.error) },
  }).catch(() => {})
}

/** 簡易 8 碼 hash（不用 crypto 省依賴，僅供 telemetry 去重識別） */
function hashString(input: string): string {
  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) - h + input.charCodeAt(i)) | 0
  }
  return Math.abs(h).toString(16).slice(0, 8)
}
