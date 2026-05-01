/**
 * Iteration Feedback Loop (T10)
 *
 * 既有 iteration-skill 只有「重複抱怨偵測」（基於 token 重疊）。沒判「上輪改完
 * 是不是真的改善」。實測常見「用戶說『按鈕還是太小』第 3 次」AI 仍只是再放大 4px。
 *
 * 本模組純函數比對前後 QualityReport，產出：
 * - resolved / introduced / unchanged 的 issue 集合
 * - 用戶 feedback 關鍵詞 vs 對應類別的 issue 是否實際減少
 * - 是否該升級 UX（提供「換方向 / 重新模板 / 強制部署」逃離選項）
 */

import type { QualityReport, QualityIssue } from './quality-gate'

// ============================================================
// 型別
// ============================================================

export interface ReportDiff {
  resolved: QualityIssue[]    // 上一份有 / 這一份沒有
  introduced: QualityIssue[]  // 這一份新增
  unchanged: QualityIssue[]   // 兩份共有
  resolvedCount: number
  introducedCount: number
  unchangedCount: number
  netImprovement: number      // resolved - introduced（正值代表變好）
}

export interface FeedbackLoopAssessment {
  improved: boolean              // 整體是否變好（netImprovement > 0 或 critical 變少）
  failedToImproveCategory: string | null  // 用戶抱怨的軸但沒改善 → 該軸 key
  diff: ReportDiff
  shouldEscalate: boolean        // 連續 ≥ 2 輪沒改善 → 提供逃離選項
}

// ============================================================
// 用戶 feedback 關鍵詞 → 軸線
// ============================================================

const FEEDBACK_AXIS_PATTERNS: Record<string, RegExp> = {
  contrast: /對比度|看不清|太淡|太亮|太暗|文字模糊|背景太淺|背景太深|contrast|too\s+(?:light|dark|faint|pale|dim)/i,
  spacing: /太擠|太密|留白|間距|擁擠|空蕩|太大|太小|padding|margin|spacing|cramped|sparse/i,
  alignment: /對齊|歪|錯位|跑掉|偏移|alignment|misalign|crooked/i,
  size: /太大|太小|太粗|太細|尺寸|大小|size|too\s+(?:big|small|tiny|huge)/i,
  color: /顏色|配色|色調|colour|color|hue|tint/i,
  font: /字體|字型|字級|font|typeface|typography/i,
  animation: /動畫|過場|轉場|animation|transition|hover|motion/i,
  layout: /佈局|版面|排版|位置|擺放|layout|placement/i,
  responsive: /手機|行動|mobile|平板|tablet|rwd|響應|適配/i,
  accessibility: /無障礙|a11y|accessibility|螢幕閱讀器|screen reader|aria|focus/i,
}

/**
 * 從 feedback 偵測用戶在抱怨哪些軸線（一次可能多個）。
 */
export function detectFeedbackAxes(feedback: string): string[] {
  const found: string[] = []
  for (const [axis, regex] of Object.entries(FEEDBACK_AXIS_PATTERNS)) {
    if (regex.test(feedback)) found.push(axis)
  }
  return found
}

// ============================================================
// QualityReport diff
// ============================================================

/**
 * issue 的「身份」key — 同一個位置 + 同一個 rule 視為同一 issue。
 * line 不算入：LLM 修復後行號常會變但語意上是同一問題。
 */
function issueKey(issue: QualityIssue): string {
  return `${issue.file}::${issue.rule}::${issue.message.slice(0, 80)}`
}

function flattenIssues(report: QualityReport | undefined | null): QualityIssue[] {
  if (!report) return []
  return [
    ...report.categories.a11y.issues,
    ...report.categories.performance.issues,
    ...report.categories.code_quality.issues,
  ]
}

export function diffReports(
  before: QualityReport | undefined | null,
  after: QualityReport | undefined | null,
): ReportDiff {
  const beforeList = flattenIssues(before)
  const afterList = flattenIssues(after)
  const beforeMap = new Map(beforeList.map(i => [issueKey(i), i]))
  const afterMap = new Map(afterList.map(i => [issueKey(i), i]))

  const resolved: QualityIssue[] = []
  const introduced: QualityIssue[] = []
  const unchanged: QualityIssue[] = []

  for (const [key, issue] of beforeMap) {
    if (afterMap.has(key)) unchanged.push(issue)
    else resolved.push(issue)
  }
  for (const [key, issue] of afterMap) {
    if (!beforeMap.has(key)) introduced.push(issue)
  }

  return {
    resolved,
    introduced,
    unchanged,
    resolvedCount: resolved.length,
    introducedCount: introduced.length,
    unchangedCount: unchanged.length,
    netImprovement: resolved.length - introduced.length,
  }
}

// ============================================================
// 軸線 → quality-gate rule 過濾器
// ============================================================

const AXIS_TO_RULES: Record<string, RegExp> = {
  contrast: /^(contrast|low-contrast|color-contrast|consistency-)/,
  spacing: /^(consistency-spacing|consistency-padding|craft-vertical-rhythm|craft-white-space)/,
  size: /^(consistency-font|craft-typographic|touch-target)/,
  font: /^(consistency-font|font-|craft-typographic)/,
  color: /^(contrast|consistency-gray|color-)/,
  accessibility: /^(a11y-|aria-|focus-|form-)/,
  animation: /^(motion-|animation-)/,
  layout: /^(layout-|min-w-0|grid-)/,
  responsive: /^(rwd-|mobile-)/,
  alignment: /^(layout-|align-)/,
}

/** 計算 report 中與某軸相關的 critical + warning issue 數量。
 * 注意：visual-craft-audit 與多數 consistency-* 規則都是 warning 而非 critical。
 * 若只計 critical，T10 escalation 對「字體太擠/spacing 不一致」這類連續抱怨永遠不會觸發逃離選項。
 */
export function countIssuesForAxis(report: QualityReport | undefined | null, axis: string): number {
  const list = flattenIssues(report).filter(i => i.severity !== 'info')
  const filter = AXIS_TO_RULES[axis]
  if (!filter) return 0
  return list.filter(i => filter.test(i.rule || '')).length
}

// ============================================================
// 主整合：assessIteration
// ============================================================

export function assessIteration(input: {
  before: QualityReport | undefined | null
  after: QualityReport | undefined | null
  feedback: string
  previousFailedCount: number
}): FeedbackLoopAssessment {
  const diff = diffReports(input.before, input.after)

  // 整體改善：critical 變少，或 netImprovement > 0
  const beforeCritical = flattenIssues(input.before).filter(i => i.severity === 'critical').length
  const afterCritical = flattenIssues(input.after).filter(i => i.severity === 'critical').length
  const improved = afterCritical < beforeCritical || diff.netImprovement > 0

  // 軸線比對：用戶說對比度問題，但對比度 issue 沒減少 → failedToImproveCategory
  const axes = detectFeedbackAxes(input.feedback)
  let failedToImproveCategory: string | null = null
  for (const axis of axes) {
    const beforeAxisCount = countIssuesForAxis(input.before, axis)
    const afterAxisCount = countIssuesForAxis(input.after, axis)
    // 只有當 before 真的有相關 issue 時才算「沒改善」（避免 0 → 0 誤報）
    if (beforeAxisCount > 0 && afterAxisCount >= beforeAxisCount) {
      failedToImproveCategory = axis
      break
    }
  }

  // 連續 ≥ 2 輪沒改善 → 提供逃離選項
  const failedThisRound = !improved || failedToImproveCategory !== null
  const newFailedCount = failedThisRound ? input.previousFailedCount + 1 : 0
  const shouldEscalate = newFailedCount >= 2

  return {
    improved,
    failedToImproveCategory,
    diff,
    shouldEscalate,
  }
}

/**
 * 給用戶看的「沒改善」訊息範本。
 */
export function buildFailedToImproveMessage(axis: string): string {
  const axisName: Record<string, string> = {
    contrast: '對比度',
    spacing: '間距',
    alignment: '對齊',
    size: '尺寸',
    color: '配色',
    font: '字體',
    animation: '動畫',
    layout: '佈局',
    responsive: '響應式適配',
    accessibility: '無障礙',
  }
  const name = axisName[axis] || axis
  return `我嘗試修復了「${name}」問題，但檢測發現問題並沒有實際減少。可能原因：\n` +
    `- 代碼使用了動態 className 或內聯樣式，無法用 className 修改\n` +
    `- 設計系統的色票本身就有衝突，需要從 design tokens 修\n` +
    `- 問題實際存在於不同的地方\n\n` +
    `建議您：直接指定具體值（例如「把 hero 標題改成 text-slate-900」），或選擇下面的選項。`
}
