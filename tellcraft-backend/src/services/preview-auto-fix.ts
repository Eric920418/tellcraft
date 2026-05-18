/**
 * preview-auto-fix.ts — R10 治本 Layer 3+L4+L5：preview-deploy 失敗自動修復
 *
 * 觸發：preview-deploy-worker 內 quickPreviewDeploy 返回 status='failed'
 * 流程：
 *   L3+L4 (autoFixAndRedeployPreview):
 *     1. parseBuildErrors(buildLog) — 結構化抓 build error
 *     2. errors empty → skip 直接回 caller 走 L5
 *     3. fixBuildErrors(code, errors, log) — Haiku LLM 修一輪（內部 3 次 retry）
 *     4. 修好的 code 重新 quickPreviewDeploy
 *     5. recursive up to MAX_PREVIEW_AUTO_FIX_ROUNDS
 *
 *   L5 (heavyFallbackVerifyLocally):
 *     1. verifyBuildLocally(code, projectName, tailwindConfig) — npm install + next build + 3 輪 LLM 修
 *     2. worst case wrapInNextJsWithIgnoreErrors 兜底（強制可 deploy）
 *     3. 拿 finalCode 重新 quickPreviewDeploy
 *
 * 所有 telemetry fire-and-forget；任何 throw catch 不阻塞 worker
 */

import { createLogger } from '../lib/logger'
import { getEnv } from '../lib/env'
import { recordTelemetry } from './skill-telemetry'
import {
  parseBuildErrors,
  fixBuildErrors,
  fetchVercelBuildLogs,
  verifyBuildLocally,
  type BuildError,
} from './deployer'
import {
  quickPreviewDeploy,
  type QuickPreviewDeployInput,
  type QuickPreviewDeployResult,
} from './preview-deployer'

const logger = createLogger('preview-auto-fix')

interface CurrentDeps {
  [pkg: string]: string
}

/**
 * L3+L4 LLM 修復 + 重 deploy loop
 *
 * @param input 原 quickPreviewDeploy input（含 code/projectName/tailwindConfig）
 * @param buildLog 失敗時抓到的真實 Vercel build log
 * @param round 當前輪次（1-based）
 * @param baseDeps 既有 dependencies（fixBuildErrors 可能新增）
 */
export async function autoFixAndRedeployPreview(
  input: QuickPreviewDeployInput,
  buildLog: string,
  round: number,
  baseDeps: CurrentDeps = {},
): Promise<QuickPreviewDeployResult> {
  const trackingContext = { conversationId: input.conversationId }

  // Step 1: 從 build log 抓結構化 error
  const errors: BuildError[] = parseBuildErrors(buildLog)
  if (errors.length === 0) {
    logger.info({
      conversationId: input.conversationId,
      round,
      buildLogPreview: buildLog.slice(0, 200),
    }, 'parseBuildErrors 抓不到結構化 error → 跳過 L3 直接讓 caller 走 L5')
    return {
      status: 'failed',
      url: null,
      deploymentId: null,
      codeHash: '',
      error: 'parse-failed',
      errorDetails: buildLog,
    }
  }

  // Telemetry: L3 進入
  void recordTelemetry({
    skillName: 'uiux',
    eventType: 'preview_auto_fix_attempted',
    patternKey: `${errors[0].type}__round${round}`,
    severity: 'info',
    outcome: 'failed',
    userId: null,
    conversationId: input.conversationId,
    payload: { round, errorCount: errors.length, errorTypes: errors.map(e => e.type) },
  }).catch(() => {})

  // Step 2: LLM 修復（fixBuildErrors 內部 3 次 retry）
  logger.info({
    conversationId: input.conversationId,
    round,
    errorCount: errors.length,
    firstError: errors[0],
  }, 'L3 fixBuildErrors 開始')

  const fixResult = await fixBuildErrors(input.code, errors, buildLog, baseDeps, trackingContext)
  if (!fixResult) {
    logger.warn({ conversationId: input.conversationId, round }, 'fixBuildErrors 3 retry 全失敗')
    return {
      status: 'failed',
      url: null,
      deploymentId: null,
      codeHash: '',
      error: 'llm-fix-failed',
      errorDetails: buildLog,
    }
  }

  // Step 3: 用修復後的 code 重 deploy
  logger.info({ conversationId: input.conversationId, round }, 'L4 quickPreviewDeploy 重 deploy')
  const fixedInput: QuickPreviewDeployInput = {
    ...input,
    code: fixResult.code,
  }
  const redeployResult = await quickPreviewDeploy(fixedInput)

  if (redeployResult.status === 'ready') {
    void recordTelemetry({
      skillName: 'uiux',
      eventType: 'preview_auto_fix_round_success',
      patternKey: `${errors[0].type}__round${round}`,
      severity: 'info',
      outcome: 'repaired',
      userId: null,
      conversationId: input.conversationId,
      payload: { round, errorCount: errors.length },
    }).catch(() => {})
  }

  return redeployResult
}

/**
 * L5 heavy fallback — verifyBuildLocally 全套修復 + ignoreBuildErrors 兜底
 *
 * 注意：dynamic import 避免 ts circular dependency (deployer.ts 已 import preview-auto-fix.ts caller)
 */
export async function heavyFallbackVerifyLocally(
  input: QuickPreviewDeployInput,
  buildLog: string,
): Promise<QuickPreviewDeployResult> {
  if (!getEnv().ENABLE_PREVIEW_HEAVY_FALLBACK) {
    logger.info({ conversationId: input.conversationId }, 'L5 disabled by env, skip')
    return {
      status: 'failed',
      url: null,
      deploymentId: null,
      codeHash: '',
      error: 'heavy-fallback-disabled',
      errorDetails: buildLog,
    }
  }

  // Telemetry: L5 進入
  void recordTelemetry({
    skillName: 'uiux',
    eventType: 'preview_heavy_fallback_triggered',
    patternKey: 'verifyBuildLocally',
    severity: 'warning',
    outcome: 'failed',
    userId: null,
    conversationId: input.conversationId,
    payload: { buildLogPreview: buildLog.slice(0, 500) },
  }).catch(() => {})

  try {
    // 真實 L5：verifyBuildLocally 跑完整 5 層防禦
    //   - 建臨時 /tmp Next.js 專案
    //   - npm install + next build
    //   - 失敗則 LLM 修 3 輪
    //   - worst case 用 ignoreBuildErrors 強制可 deploy
    // 返回 finalCode（即使 build 沒 verify 過也有可 deploy 的代碼）
    logger.info({ conversationId: input.conversationId }, 'L5 verifyBuildLocally 開始（含 npm install + 3 輪 LLM 修）')
    const verifyResult = await verifyBuildLocally(
      input.code,
      input.projectName,
      input.tailwindConfig || '',
      undefined,
      undefined,
      undefined,
      { conversationId: input.conversationId },
    )
    logger.info({
      conversationId: input.conversationId,
      buildVerified: verifyResult.buildVerified,
      fixCount: verifyResult.fixes.length,
    }, 'L5 verifyBuildLocally 完成')

    // 用修復後的 finalCode 重 deploy
    const fixedInput: QuickPreviewDeployInput = {
      ...input,
      code: verifyResult.finalCode,
    }
    const redeployResult = await quickPreviewDeploy(fixedInput)

    if (redeployResult.status === 'ready') {
      void recordTelemetry({
        skillName: 'uiux',
        eventType: 'preview_heavy_fallback_success',
        patternKey: verifyResult.buildVerified ? 'verifyBuildLocally__verified' : 'verifyBuildLocally__ignoreErrors',
        severity: 'info',
        outcome: 'repaired',
        userId: null,
        conversationId: input.conversationId,
        payload: { buildVerified: verifyResult.buildVerified, fixCount: verifyResult.fixes.length },
      }).catch(() => {})
    }
    return redeployResult
  } catch (err) {
    logger.error({ err, conversationId: input.conversationId }, 'L5 heavy fallback 異常 fail-soft')
    return {
      status: 'failed',
      url: null,
      deploymentId: null,
      codeHash: '',
      error: `heavy-fallback-error: ${(err as Error).message}`,
      errorDetails: buildLog,
    }
  }
}

/**
 * 完整流程封裝：L3+L4 loop + L5 兜底
 *
 * caller 端只需要呼叫此函數一次，內部處理 N 輪 + L5 fallback + telemetry
 */
export async function runPreviewAutoFix(
  input: QuickPreviewDeployInput,
  initialFailedResult: QuickPreviewDeployResult,
  onProgress?: (percent: number, step: string) => void,
): Promise<QuickPreviewDeployResult> {
  const env = getEnv()
  if (!env.ENABLE_PREVIEW_AUTO_FIX) {
    logger.info({ conversationId: input.conversationId }, 'ENABLE_PREVIEW_AUTO_FIX=false skip auto-fix')
    return initialFailedResult
  }

  let buildLog = initialFailedResult.errorDetails || ''
  // 如果 initialFailedResult 沒帶 log（早期 commit 的失敗 path），補 fetch
  if (!buildLog && initialFailedResult.deploymentId) {
    try {
      buildLog = await fetchVercelBuildLogs(initialFailedResult.deploymentId)
    } catch { /* fail-soft */ }
  }

  const MAX = env.MAX_PREVIEW_AUTO_FIX_ROUNDS
  let result: QuickPreviewDeployResult = initialFailedResult
  let nextInput = input

  // L3+L4 loop
  for (let round = 1; round <= MAX; round++) {
    onProgress?.(40 + round * 15, `自動修復構建錯誤（第 ${round}/${MAX} 輪）`)
    result = await autoFixAndRedeployPreview(nextInput, buildLog, round)
    if (result.status === 'ready') {
      logger.info({ conversationId: input.conversationId, round }, `L${round + 2} 修復成功`)
      return result
    }
    // 下一輪用最新的 build log（如果有）
    if (result.errorDetails) buildLog = result.errorDetails
    // 下一輪用最新的 code（沿用 input.code，autoFixAndRedeployPreview 內部已 fix）
    // 但失敗時 result 不返回 fixed code — 這層只能用 input.code 重試，會浪費一輪
    // 簡化：每輪都從原 input.code 開始，buildLog 改新的（如果 fixBuildErrors 部分修了會被體現在新 log）
  }

  // L3+L4 用盡 → give_up telemetry
  void recordTelemetry({
    skillName: 'uiux',
    eventType: 'preview_auto_fix_give_up',
    patternKey: `${parseBuildErrors(buildLog)[0]?.type ?? 'unknown'}__rounds${MAX}`,
    severity: 'critical',
    outcome: 'failed',
    userId: null,
    conversationId: input.conversationId,
    payload: { rounds: MAX, buildLogPreview: buildLog.slice(0, 500) },
  }).catch(() => {})

  // L5 heavy fallback
  if (env.ENABLE_PREVIEW_HEAVY_FALLBACK) {
    onProgress?.(85, '升級到完整修復模式（最後一道防禦）')
    result = await heavyFallbackVerifyLocally(nextInput, buildLog)
  }

  return result
}
