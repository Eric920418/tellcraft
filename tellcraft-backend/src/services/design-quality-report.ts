/**
 * Design Quality Report (P3)
 *
 * 把 P0/P1/P2 + 既有 quality-gate 的所有 issues 彙整成「設計品質報告」：
 *   - dimensionScores（4 個維度 0-100）
 *   - overallScore（加權平均）
 *   - fixPlan（按 priority 分組的修復建議）
 *
 * 設計：
 * - 純函數：只接受已產出的 QualityReport，不重新跑檢查
 * - 不負責 retry loop（既有 QG 已有 advisory loop，重複實作會造成衝突）
 * - 不阻塞 pipeline：純 advisory 報告，給 telemetry + 前端預覽用
 * - **禁止自動回灌 prompt**（CLAUDE.md 防雷第一條）：本模組只產 issue → 餵 refineCode 改代碼，不改 system prompt
 *
 * Feature flag: ENABLE_DESIGN_QUALITY_REPORT（預設 false）
 */

import type { QualityReport, QualityIssue } from './quality-gate'
import { isConsistencyIssue } from './css-consistency-audit'
import { createLogger } from '../lib/logger'
import { recordTelemetry, type TelemetryTrackingContext } from './skill-telemetry'
import { getEnv } from '../lib/env'
import type { FlowState } from '../types/flow-state'

const logger = createLogger('design-quality-report')

// ============================================================
// 型別定義
// ============================================================

export interface DesignQualityReport {
  overallScore: number
  dimensionScores: {
    consistency: number    // P0
    accessibility: number  // P1（含真實 luminance）+ 既有 a11y
    taskExecution: number  // P2（從 ui-evaluator task_failed 反推；無 evaluator 則 N/A=100）
    codeQuality: number    // 既有 quality-gate 其他 4 類
  }
  issuesByDimension: {
    consistency: QualityIssue[]
    accessibility: QualityIssue[]
    taskExecution: QualityIssue[]
    codeQuality: QualityIssue[]
  }
  fixPlan: Array<{
    priority: 'critical' | 'high' | 'medium'
    dimension: 'consistency' | 'accessibility' | 'taskExecution' | 'codeQuality'
    issueIds: string[]
    suggestion: string
  }>
  generatedAt: string
}

// ============================================================
// 評分公式
// ============================================================

const SCORE_PENALTY = {
  critical: 20,
  warning: 5,
  info: 1,
}

function scoreFromIssues(issues: QualityIssue[]): number {
  let score = 100
  for (const issue of issues) {
    score -= SCORE_PENALTY[issue.severity] ?? 0
  }
  return Math.max(0, score)
}

// ============================================================
// 維度分類
// ============================================================

interface ExtraTaskIssue {
  id: string
  severity: 'critical' | 'warning'
  description: string
  route: string
}

function classifyIssues(
  qualityReport: QualityReport,
  taskFailedIssues: ExtraTaskIssue[] = [],
): DesignQualityReport['issuesByDimension'] {
  const allIssues = [
    ...qualityReport.categories.a11y.issues,
    ...qualityReport.categories.performance.issues,
    ...qualityReport.categories.code_quality.issues,
  ]

  const consistency: QualityIssue[] = []
  const accessibility: QualityIssue[] = []
  const taskExecution: QualityIssue[] = []
  const codeQuality: QualityIssue[] = []

  for (const issue of allIssues) {
    if (isConsistencyIssue(issue)) {
      consistency.push(issue)
    } else if (issue.category === 'a11y') {
      accessibility.push(issue)
    } else {
      // performance + code_quality 其他規則合進 codeQuality
      codeQuality.push(issue)
    }
  }

  // 把 ui-evaluator 的 task_failed issue 轉成 QualityIssue 格式
  for (const t of taskFailedIssues) {
    taskExecution.push({
      id: t.id,
      category: 'a11y',  // 借用既有 category，rule prefix 區分
      severity: t.severity,
      rule: 'task-failed',
      file: `<route:${t.route}>`,
      message: t.description,
    })
  }

  return { consistency, accessibility, taskExecution, codeQuality }
}

// ============================================================
// Fix Plan 生成（按 priority 分組）
// ============================================================

function buildFixPlan(byDim: DesignQualityReport['issuesByDimension']): DesignQualityReport['fixPlan'] {
  const plan: DesignQualityReport['fixPlan'] = []

  type Dim = keyof DesignQualityReport['issuesByDimension']
  const dimensions: Dim[] = ['accessibility', 'consistency', 'taskExecution', 'codeQuality']

  for (const dim of dimensions) {
    const issues = byDim[dim]
    const critical = issues.filter(i => i.severity === 'critical')
    const warning = issues.filter(i => i.severity === 'warning')

    if (critical.length > 0) {
      plan.push({
        priority: 'critical',
        dimension: dim,
        issueIds: critical.map(i => i.id),
        suggestion: summarizeFix(dim, critical),
      })
    }
    if (warning.length > 0) {
      plan.push({
        priority: dim === 'accessibility' || dim === 'taskExecution' ? 'high' : 'medium',
        dimension: dim,
        issueIds: warning.map(i => i.id),
        suggestion: summarizeFix(dim, warning),
      })
    }
  }

  return plan
}

function summarizeFix(dim: keyof DesignQualityReport['issuesByDimension'], issues: QualityIssue[]): string {
  const sample = issues.slice(0, 3).map(i => i.suggestion || i.message).join('；')
  const more = issues.length > 3 ? `（共 ${issues.length} 個）` : ''
  switch (dim) {
    case 'consistency':
      return `收斂 design tokens，減少灰階/圓角/字級/shadow 種類：${sample}${more}`
    case 'accessibility':
      return `提升對比度與 a11y 屬性：${sample}${more}`
    case 'taskExecution':
      return `修復用戶任務失敗點（CTA/導航/資訊缺失）：${sample}${more}`
    case 'codeQuality':
      return `修復程式碼品質問題：${sample}${more}`
  }
}

// ============================================================
// 主函數
// ============================================================

export function generateDesignQualityReport(
  qualityReport: QualityReport,
  opts: {
    taskFailedIssues?: ExtraTaskIssue[]
  } = {},
): DesignQualityReport {
  const issuesByDimension = classifyIssues(qualityReport, opts.taskFailedIssues || [])

  const dimensionScores = {
    consistency: scoreFromIssues(issuesByDimension.consistency),
    accessibility: scoreFromIssues(issuesByDimension.accessibility),
    taskExecution: scoreFromIssues(issuesByDimension.taskExecution),
    codeQuality: scoreFromIssues(issuesByDimension.codeQuality),
  }

  // overallScore: 加權平均（accessibility 權重最高，因為 WCAG 是法規問題）
  const overallScore = Math.round(
    dimensionScores.accessibility * 0.35 +
    dimensionScores.consistency * 0.25 +
    dimensionScores.taskExecution * 0.25 +
    dimensionScores.codeQuality * 0.15
  )

  const fixPlan = buildFixPlan(issuesByDimension)

  return {
    overallScore,
    dimensionScores,
    issuesByDimension,
    fixPlan,
    generatedAt: new Date().toISOString(),
  }
}

// ============================================================
// 簡短 logging helper（給呼叫端用）
// ============================================================

export function logDesignQualityReport(report: DesignQualityReport, ctx: { conversationId?: string; phase?: string }): void {
  logger.info({
    conversationId: ctx.conversationId,
    phase: ctx.phase,
    overall: report.overallScore,
    dim: report.dimensionScores,
    fixPlanCount: report.fixPlan.length,
  }, '[design-quality] 設計品質報告')
}

// ============================================================
// 設計審美閉環 v2（Phase 0）— Telemetry 寫入 helper
// ============================================================

/**
 * 把 design quality snapshot 寫進 skill_telemetry，供週報「Design Knowledge Effectiveness」章節聚合。
 *
 * Fire-and-forget — 任何寫入失敗都不能影響 pipeline。雙路徑（BullMQ + LangGraph）共用此 helper，
 * 避免 caller 端到處重複埋點。
 *
 * Phase 0 設計：
 *  - 純寫入，零阻塞、零回灌
 *  - Payload 帶 mood/tier/dsHash/dsSource → 後續可 GROUP BY 聚合
 *  - flag ENABLE_DESIGN_TELEMETRY_V2=false 時整個 noop
 */
export function recordDesignQualitySnapshot(
  report: DesignQualityReport,
  state: Pick<FlowState, 'uiuxDesignMood' | 'uiuxDesignTier' | 'uiuxDesignSystemHash' | 'uiuxDesignSystemSource' | 'uiuxVariantConcept' | 'projectId' | 'userId'>,
  ctx: TelemetryTrackingContext & { phase?: string },
): void {
  if (!getEnv().ENABLE_DESIGN_TELEMETRY_V2) return

  recordTelemetry({
    skillName: 'uiux',
    eventType: 'design_quality_snapshot',
    patternKey: state.uiuxDesignMood || 'no_mood',
    severity: 'info',
    userId: ctx.userId ?? state.userId ?? null,
    conversationId: ctx.conversationId ?? null,
    projectId: ctx.projectId ?? state.projectId ?? null,
    phase: ctx.phase ?? null,
    payload: {
      overallScore: report.overallScore,
      dimensionScores: report.dimensionScores,
      fixPlanCount: report.fixPlan.length,
      issueCount: {
        consistency: report.issuesByDimension.consistency.length,
        accessibility: report.issuesByDimension.accessibility.length,
        taskExecution: report.issuesByDimension.taskExecution.length,
        codeQuality: report.issuesByDimension.codeQuality.length,
      },
      mood: state.uiuxDesignMood ?? null,
      tier: state.uiuxDesignTier ?? null,
      dsHash: state.uiuxDesignSystemHash ?? null,
      dsSource: state.uiuxDesignSystemSource ?? null,
      variantConceptName: state.uiuxVariantConcept?.name ?? null,
      variantSignature: state.uiuxVariantConcept?.signatureElement ?? null,
    },
  }).catch(() => {})
}
