// ============================================================
// Phase 3b (L31.K): Pre-Coder Spec Validation
//
// 在 Coder generate 之前，用 RED Phase L2 Stub validator 跑真實 SpecFormula：
// - entity_setup → 真 Neon DB INSERT（驗證 schema/column/FK 對齊）
// - api_call → StubHttpAdapter 回 501（驗證 routing + VAR 解析 + Actor）
// - response_validate → 預期失敗（501 ≠ 200，正確 RED）
//
// 失敗的 BDD-side root cause（var_resolution/api_summary_mismatch/fk_constraint/step_parsing）
// → 自動呼叫 fixFailingSpec 修 BDD（重用 Phase 3a），更新 bdd_sessions.features_content
// → 重跑驗證，最多 maxFixRounds 輪
//
// 跟 Phase 3a 的差異：
// - Phase 3a：Coder 已 generate code，跑 SpecFormula 失敗時分流（後置）
// - Phase 3b：Coder 還沒 generate，用 stub 早期攔截（前置）
//
// 治本邏輯：BDD 階段的 alignment gate 是 heuristic（regex）；Phase 3b 是 ground truth
// （真執行 entity_setup INSERT），抓得到 alignment gate 漏的真矛盾。
// ============================================================

import { createLogger } from '../lib/logger'
import { runRedPhaseFullValidation, type RedPhaseUnexpectedFailure, type RedPhaseFailureType } from './red-phase-validator'
import { fixFailingSpec, BDD_SIDE_ROOT_CAUSES, type FailureRootCause } from './coder-generation'
import { recordTelemetry } from './skill-telemetry'
import * as db from '../db/client'

const logger = createLogger('pre-coder-spec-validation')

export interface PreCoderValidationInput {
  features: Array<{ name?: string; actionName: string; content: string }>  // name optional 對齊 bddSession.features_content
  actionsYml: string
  openApiSpec: string
  isaConfigYml: string
  schemaSql: string
  entityMapping: string
  neonConnectionString: string
  projectId: string  // 給 persist 修過 BDD 用
  trackingContext?: { userId?: string; conversationId?: string }
  maxFixRounds?: number  // 預設 2 輪
  onProgress?: (step: string, percent: number) => Promise<void>
}

export interface PreCoderValidationResult {
  passed: boolean              // 通過：可進 Coder
  blocked: boolean             // 阻塞：剩餘真矛盾無法自動修
  fixedFeatureCount: number    // 修了幾個 feature
  remainingFailureCount: number // 剩幾個 unexpected failure
  blockMessage?: string        // 阻塞時的訊息
  rounds: number               // 跑了幾輪
  durationMs: number
  totalLlmCostUsd: number      // fixFailingSpec 累計 cost
  totalLlmCalls: number
  /**
   * 修過的 BDD content map（caller 可用來通知 user 或記 audit log）
   * 如果有值，已 persist 到 bdd_sessions.features_content
   */
  fixedBddFeatures?: Map<string, string>
}

/**
 * 把 RedPhaseFailureType 映射到 FailureRootCause（給 fixFailingSpec 用）
 *
 * RedPhase 的失敗類型跟 Coder 階段的 root cause 命名不完全一致，做一層 mapping。
 */
function mapRedPhaseFailureToRootCause(rpType: RedPhaseFailureType): FailureRootCause {
  switch (rpType) {
    case 'entity_setup':
      // entity_setup INSERT 失敗（column 不存在 / NOT NULL violation / FK 父不存在）
      // 對應 BDD 修法：補對 schema 的 column / 改 DataTable headers
      return 'step_parsing'  // BDD 結構問題，最接近 step_parsing 的修法方向
    case 'step_parsing':
      return 'step_parsing'
    case 'api_spec_mismatch':
    case 'routing_mismatch':
      // routing/api_spec 都是 Feature When summary 與 actionsYml 對不上
      return 'api_summary_mismatch'
    case 'var_resolution':
      return 'var_resolution'
    case 'unknown':
    default:
      return 'unknown'
  }
}

/**
 * Persist 修過的 BDD 到 bdd_sessions.features_content
 * 失敗 fail-soft（不阻塞流程）— 同 Phase 3a 設計
 */
async function persistFixedBddFeatures(
  projectId: string,
  features: Array<{ name?: string; actionName: string; content: string }>,
): Promise<void> {
  try {
    await db.query(
      `UPDATE bdd_sessions SET features_content = $1, updated_at = NOW() WHERE project_id = $2`,
      [JSON.stringify(features), projectId]
    )
    logger.info({ projectId, featureCount: features.length }, 'L31.K Phase 3b: BDD features 已 persist 到 bdd_sessions')
  } catch (e) {
    logger.warn({ err: e, projectId }, 'L31.K Phase 3b: persist BDD 失敗（不阻塞）')
  }
}

/**
 * 主入口：用 stub 跑 SpecFormula 驗證 BDD spec 對 schema 的真實對齊
 * 失敗時自動呼叫 fixFailingSpec 修 BDD，最多 maxFixRounds 輪
 */
export async function runPreCoderSpecValidation(
  input: PreCoderValidationInput,
): Promise<PreCoderValidationResult> {
  const start = Date.now()
  const maxFixRounds = input.maxFixRounds ?? 2
  let currentFeatures = input.features.map(f => ({ ...f }))  // shallow clone
  const fixedBddFeatures = new Map<string, string>()
  let totalLlmCostUsd = 0
  let totalLlmCalls = 0
  let rounds = 0
  let prevFailureFingerprint: string | null = null
  let lastResult: { passed: boolean; unexpectedFailures: RedPhaseUnexpectedFailure[] } = {
    passed: false, unexpectedFailures: [],
  }

  for (let round = 0; round < maxFixRounds; round++) {
    rounds++
    if (input.onProgress) {
      await input.onProgress(`Pre-Coder Stub 驗證（第 ${round + 1}/${maxFixRounds} 輪）...`, 30 + round * 30)
    }

    // 跑 RED Phase Stub 驗證（用真 Neon DB + StubHttpAdapter）
    const redResult = await runRedPhaseFullValidation({
      features: currentFeatures,
      actionsYml: input.actionsYml,
      openApiSpec: input.openApiSpec,
      isaConfigYml: input.isaConfigYml,
      schemaSql: input.schemaSql,
      entityMapping: input.entityMapping,
      neonConnectionString: input.neonConnectionString,
    })

    lastResult = { passed: redResult.passed, unexpectedFailures: redResult.unexpectedFailures }

    logger.info({
      round: round + 1,
      passed: redResult.passed,
      unexpectedCount: redResult.unexpectedFailures.length,
      expectedRedCount: redResult.expectedRedCount,
    }, 'L31.K Phase 3b: 第 N 輪 stub 驗證')

    // 通過 → 直接 return
    if (redResult.passed) {
      const result: PreCoderValidationResult = {
        passed: true,
        blocked: false,
        fixedFeatureCount: fixedBddFeatures.size,
        remainingFailureCount: 0,
        rounds,
        durationMs: Date.now() - start,
        totalLlmCostUsd,
        totalLlmCalls,
        fixedBddFeatures: fixedBddFeatures.size > 0 ? fixedBddFeatures : undefined,
      }
      if (fixedBddFeatures.size > 0) {
        recordTelemetry({
          skillName: 'red_phase', eventType: 'spec_first_repair_success',
          patternKey: 'pre_coder_passed_after_fix', outcome: 'repaired',
          phase: 'pre_coder_spec_validation', fixRounds: rounds,
          userId: input.trackingContext?.userId, conversationId: input.trackingContext?.conversationId,
          payload: { fixedCount: fixedBddFeatures.size, totalLlmCostUsd, totalLlmCalls },
        }).catch(() => {})
      }
      return result
    }

    // 最後一輪不修（因為修完無法重驗）
    if (round === maxFixRounds - 1) break

    // L31.O: 收斂偵測 — 跟上輪 failure fingerprint 完全相同 → LLM 修不動，提前停
    const currentFingerprint = redResult.unexpectedFailures
      .map(f => `${f.featureName}|${f.scenarioName ?? ''}|${f.failureType}|${(f.error ?? '').slice(0, 100)}`)
      .sort().join('::')
    if (prevFailureFingerprint !== null && currentFingerprint === prevFailureFingerprint) {
      logger.warn({
        round: round + 1,
        unexpectedCount: redResult.unexpectedFailures.length,
        sampleFailures: redResult.unexpectedFailures.slice(0, 3).map(f => f.featureName + '/' + f.failureType),
      }, 'pre-coder-spec-validation: 連續兩輪 failure 指紋一致，LLM 修不動，提前停止')
      recordTelemetry({
        skillName: 'red_phase',
        eventType: 'fix_convergence_failed',
        patternKey: 'identical_failures_across_rounds',
        outcome: 'blocked',
        phase: 'pre_coder_spec_validation',
        fixRounds: round,
        severity: 'warning',
        userId: input.trackingContext?.userId,
        conversationId: input.trackingContext?.conversationId,
        payload: { unexpectedCount: redResult.unexpectedFailures.length, totalLlmCalls, totalLlmCostUsd },
      }).catch(() => {})
      break
    }
    prevFailureFingerprint = currentFingerprint

    // 對 BDD-side 失敗呼叫 fixFailingSpec
    // 按 feature 分組
    const failuresByFeature = new Map<string, RedPhaseUnexpectedFailure[]>()
    for (const f of redResult.unexpectedFailures) {
      const arr = failuresByFeature.get(f.featureName) || []
      arr.push(f)
      failuresByFeature.set(f.featureName, arr)
    }

    let fixedThisRound = 0
    for (const [featureName, failures] of failuresByFeature) {
      const featureIdx = currentFeatures.findIndex(f => (f.name || f.actionName) === featureName)
      if (featureIdx === -1) continue
      const feature = currentFeatures[featureIdx]

      // 取第一個 failure 的 type 作為主要 root cause
      const primaryFailure = failures[0]
      const rootCause = mapRedPhaseFailureToRootCause(primaryFailure.failureType)

      if (!BDD_SIDE_ROOT_CAUSES.has(rootCause)) {
        // 不是 BDD 修得了的 — 不嘗試
        logger.info({ featureName, rootCause, rpType: primaryFailure.failureType },
          'L31.K Phase 3b: rootCause 非 BDD-side，跳過（將阻塞）')
        continue
      }

      const failedScenarios = failures.map(f => ({
        scenarioName: f.scenarioName,
        ruleName: '',
        error: f.error,
        stepsContext: `${f.stepKeyword} ${f.stepText}`,
      }))

      try {
        const specResult = await fixFailingSpec(
          featureName,
          feature.content,
          failedScenarios,
          input.schemaSql,
          rootCause,
          input.trackingContext,
          input.entityMapping,
        )
        totalLlmCalls += specResult.usage.callCount
        totalLlmCostUsd += specResult.usage.costUsd

        if (specResult.fixedFeatureContent !== feature.content) {
          feature.content = specResult.fixedFeatureContent
          fixedBddFeatures.set(featureName, specResult.fixedFeatureContent)
          fixedThisRound++
          logger.info({
            featureName, rootCause,
            costUsd: specResult.usage.costUsd.toFixed(4),
          }, 'L31.K Phase 3b: BDD 已修')
        }
      } catch (e) {
        logger.warn({ err: e, featureName }, 'L31.K Phase 3b: fixFailingSpec 例外，跳過該 feature')
      }
    }

    // 沒修任何 feature → 早停（避免空跑下一輪）
    if (fixedThisRound === 0) {
      logger.info({ round: round + 1, unexpectedCount: redResult.unexpectedFailures.length },
        'L31.K Phase 3b: 本輪未修任何 feature，提前停止')
      break
    }

    // Persist 修過的 BDD（每輪都 persist，避免 worker 崩潰丟資料）
    await persistFixedBddFeatures(input.projectId, currentFeatures)
  }

  // 跑到這裡 = 沒通過
  const failures = lastResult.unexpectedFailures
  const failureSummary = failures.slice(0, 5).map(f =>
    `- [${f.failureType}] ${f.featureName} / ${f.scenarioName}: ${f.error.slice(0, 150)}`
  ).join('\n')

  const blockMessage = `**Pre-Coder Stub 驗證未通過**（${rounds} 輪修復後仍有 ${failures.length} 個非預期失敗）\n\n${failureSummary}${failures.length > 5 ? `\n\n... 還有 ${failures.length - 5} 個未列出` : ''}\n\n**選項**：\n1. 手動審查 BDD spec\n2. 仍進 Coder 嘗試（這些失敗類型修代碼也救不了）`

  recordTelemetry({
    skillName: 'red_phase', eventType: 'red_validation_fail',
    patternKey: 'pre_coder_blocked', outcome: 'blocked',
    phase: 'pre_coder_spec_validation', severity: 'critical',
    userId: input.trackingContext?.userId, conversationId: input.trackingContext?.conversationId,
    payload: { rounds, fixedCount: fixedBddFeatures.size, remainingFailures: failures.length, totalLlmCostUsd, totalLlmCalls },
  }).catch(() => {})

  return {
    passed: false,
    blocked: true,
    fixedFeatureCount: fixedBddFeatures.size,
    remainingFailureCount: failures.length,
    blockMessage,
    rounds,
    durationMs: Date.now() - start,
    totalLlmCostUsd,
    totalLlmCalls,
    fixedBddFeatures: fixedBddFeatures.size > 0 ? fixedBddFeatures : undefined,
  }
}
