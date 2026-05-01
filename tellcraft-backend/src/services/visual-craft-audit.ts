/**
 * Visual Craft Audit (T8)
 *
 * QG 既有 5 類靜態檢查 + P0 一致性 + P1 對比度都是「禁止性」規則（不要這樣做）。
 * 缺「主動評分」維度——typographic rhythm 美不美？留白比例對不對？視覺重心成立嗎？
 *
 * 本模組四項零 LLM 規則，rule prefix `craft-*`，category=code_quality（沿用 P0
 * 不擴 QualityCategory 的決定）。
 */

import type { QualityIssue } from './quality-gate'
import type { GeneratedCode } from '../types/flow-state'

// ============================================================
// Tailwind text-* 與 spacing 階梯對應表（rem）
// ============================================================

const TEXT_SCALE: Record<string, number> = {
  xs: 0.75, sm: 0.875, base: 1, lg: 1.125, xl: 1.25,
  '2xl': 1.5, '3xl': 1.875, '4xl': 2.25, '5xl': 3,
  '6xl': 3.75, '7xl': 4.5, '8xl': 6, '9xl': 8,
}

const SPACING_SCALE: Record<string, number> = {
  '0': 0, '0.5': 2, '1': 4, '1.5': 6, '2': 8, '2.5': 10, '3': 12,
  '3.5': 14, '4': 16, '5': 20, '6': 24, '7': 28, '8': 32, '9': 36,
  '10': 40, '11': 44, '12': 48, '14': 56, '16': 64, '20': 80,
  '24': 96, '28': 112, '32': 128, '36': 144, '40': 160, '44': 176,
  '48': 192, '52': 208, '56': 224, '60': 240, '64': 256, '72': 288,
  '80': 320, '96': 384,
}

// ============================================================
// 1. Typographic Rhythm
// ============================================================

const TEXT_REGEX = /\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/g

function checkTypographicRhythm(content: string, filePath: string, counter: { n: number }): QualityIssue[] {
  const issues: QualityIssue[] = []
  const sizes = new Set<number>()
  let m: RegExpExecArray | null
  TEXT_REGEX.lastIndex = 0
  while ((m = TEXT_REGEX.exec(content)) !== null) {
    sizes.add(TEXT_SCALE[m[1]])
  }
  const sorted = [...sizes].sort((a, b) => a - b)
  if (sorted.length < 3) return issues  // 太少 size 不能評估

  // 計算相鄰 size 比值
  const ratios: number[] = []
  for (let i = 1; i < sorted.length; i++) {
    ratios.push(sorted[i] / sorted[i - 1])
  }
  const avgRatio = ratios.reduce((s, r) => s + r, 0) / ratios.length

  // 健康範圍 1.125-1.6（minor third → golden ratio 之間）
  if (avgRatio > 2.5) {
    issues.push({
      id: `craft-${++counter.n}`,
      category: 'code_quality',
      severity: 'warning',
      rule: 'craft-typographic-rhythm',
      file: filePath,
      message: `字級階梯跳躍過大（avg ratio ${avgRatio.toFixed(2)}，健康 1.125-1.6）`,
      suggestion: `用了過於極端的字級組合（${sorted.length} 種：${sorted.map(s => `${s}rem`).join(', ')}）。考慮收斂中間階級，避免「超大標題 + 超小內文」的廣告感。`,
    })
  } else if (avgRatio < 1.08 && sorted.length > 4) {
    issues.push({
      id: `craft-${++counter.n}`,
      category: 'code_quality',
      severity: 'info',
      rule: 'craft-typographic-rhythm',
      file: filePath,
      message: `字級階梯過於密集（avg ratio ${avgRatio.toFixed(2)}），層級難以辨識`,
      suggestion: '相鄰字級至少差 1.125x（minor second），讀者才能掃出資訊層級。',
    })
  }
  return issues
}

// ============================================================
// 2. Vertical Rhythm（spacing 是否落在 base unit 倍數）
// ============================================================

const SPACING_REGEX = /\b(?:py|my|space-y|gap)-(\d+(?:\.\d+)?|\[[\d.]+(?:px|rem|em)\])(?![a-z0-9])/g

function checkVerticalRhythm(content: string, filePath: string, counter: { n: number }): QualityIssue[] {
  const issues: QualityIssue[] = []
  const offBaseTokens = new Set<string>()
  let m: RegExpExecArray | null
  SPACING_REGEX.lastIndex = 0
  while ((m = SPACING_REGEX.exec(content)) !== null) {
    const raw = m[1]
    if (raw.startsWith('[')) {
      // arbitrary value — 抽 px 數值
      const px = raw.match(/(\d+(?:\.\d+)?)px/)?.[1]
      if (px) {
        const n = parseFloat(px)
        if (n % 4 !== 0) offBaseTokens.add(`py/my-[${n}px]`)
      }
      continue
    }
    const px = SPACING_SCALE[raw]
    if (px === undefined) continue
    // 4px base：所有預設值都是 4 的倍數，但 0.5 / 1.5 / 2.5 / 3.5 是 2px 倍數
    // 我們檢查 ≤ 8px 以下的奇數值（如 spacing-0.5=2, 1=4, 1.5=6...）
    // 實務上：垂直節奏應落在 ≥ 8 開始，連續用 0.5/1.5 等表示沒系統
    if (px > 0 && px < 8 && [2, 6].includes(px)) {
      offBaseTokens.add(raw)
    }
  }
  if (offBaseTokens.size >= 3) {
    issues.push({
      id: `craft-${++counter.n}`,
      category: 'code_quality',
      severity: 'info',
      rule: 'craft-vertical-rhythm',
      file: filePath,
      message: `${offBaseTokens.size} 處垂直間距使用了非 base unit 倍數`,
      suggestion: '垂直節奏建議落在 8px / 16px / 24px / 32px 階梯（py-2 / py-4 / py-6 / py-8）。0.5x / 1.5x 階梯零散使用代表沒間距系統。',
    })
  }
  return issues
}

// ============================================================
// 3. White Space Ratio（hero / page 應有充足留白）
// ============================================================

function checkWhiteSpaceRatio(content: string, filePath: string, counter: { n: number }): QualityIssue[] {
  const issues: QualityIssue[] = []
  if (!/page\.tsx?$/.test(filePath)) return issues  // 只檢 page

  const isHero = /(?:hero|landing|home)/i.test(filePath) || filePath === 'app/page.tsx'

  // 找所有 py-N（最大值代表頁面最大段落呼吸量）
  const pyValues: number[] = []
  const PY_REGEX = /\bpy-(\d+(?:\.\d+)?)\b/g
  let m: RegExpExecArray | null
  while ((m = PY_REGEX.exec(content)) !== null) {
    const n = SPACING_SCALE[m[1]]
    if (n !== undefined) pyValues.push(n)
  }
  if (pyValues.length === 0) return issues
  const maxPy = Math.max(...pyValues)

  const requiredMaxPx = isHero ? 64 : 32  // hero 至少 py-16，content 至少 py-8
  if (maxPy < requiredMaxPx) {
    issues.push({
      id: `craft-${++counter.n}`,
      category: 'code_quality',
      severity: 'warning',
      rule: 'craft-white-space',
      file: filePath,
      message: `頁面最大 py 只到 ${maxPy}px${isHero ? '（hero / landing 應 ≥ py-16）' : '（內容區應 ≥ py-8）'}`,
      suggestion: '段落間缺少呼吸空間會顯得擁擠。Hero 段建議 py-16 ~ py-32，內容段 py-8 ~ py-16。',
    })
  }
  return issues
}

// ============================================================
// 4. Heading Anchor Density（每個 page 應有 ≥1 h1，h2/h3 應佔 section 50%+）
// ============================================================

function checkHeadingAnchors(content: string, filePath: string, counter: { n: number }): QualityIssue[] {
  const issues: QualityIssue[] = []
  if (!/page\.tsx?$/.test(filePath)) return issues  // 只檢 page

  const h1Count = (content.match(/<h1\b/g) || []).length
  const h2Count = (content.match(/<h2\b/g) || []).length
  const h3Count = (content.match(/<h3\b/g) || []).length
  const sectionCount = (content.match(/<section\b/g) || []).length

  if (h1Count === 0) {
    issues.push({
      id: `craft-${++counter.n}`,
      category: 'code_quality',
      severity: 'warning',
      rule: 'craft-heading-anchor',
      file: filePath,
      message: '頁面缺少 <h1>（無障礙 + SEO 需要）',
      suggestion: '每個 page 應有 1 個 <h1> 作為主標題，後續用 <h2> / <h3> 建立層級。',
    })
  } else if (h1Count > 1) {
    issues.push({
      id: `craft-${++counter.n}`,
      category: 'code_quality',
      severity: 'info',
      rule: 'craft-heading-anchor',
      file: filePath,
      message: `頁面有 ${h1Count} 個 <h1>（建議只 1 個）`,
      suggestion: '多個 h1 會稀釋頁面主題。次要標題改用 <h2>。',
    })
  }

  // section 多但沒對應 heading → 段落沒有可掃描的標題
  if (sectionCount >= 3 && h2Count + h3Count < Math.floor(sectionCount / 2)) {
    issues.push({
      id: `craft-${++counter.n}`,
      category: 'code_quality',
      severity: 'info',
      rule: 'craft-heading-anchor',
      file: filePath,
      message: `頁面有 ${sectionCount} 個 <section> 但只 ${h2Count + h3Count} 個 h2/h3`,
      suggestion: '每個 section 建議至少 1 個 heading，方便用戶與螢幕閱讀器掃讀。',
    })
  }
  return issues
}

// ============================================================
// 主 entry
// ============================================================

export interface VisualCraftResult {
  issues: QualityIssue[]
  metrics: {
    fileCount: number
    issueCount: number
  }
}

export function auditVisualCraft(code: GeneratedCode): VisualCraftResult {
  const allFiles = [...code.pages, ...code.components]
  const counter = { n: 0 }
  const issues: QualityIssue[] = []
  for (const file of allFiles) {
    issues.push(...checkTypographicRhythm(file.content, file.path, counter))
    issues.push(...checkVerticalRhythm(file.content, file.path, counter))
    issues.push(...checkWhiteSpaceRatio(file.content, file.path, counter))
    issues.push(...checkHeadingAnchors(file.content, file.path, counter))
  }
  return {
    issues,
    metrics: {
      fileCount: allFiles.length,
      issueCount: issues.length,
    },
  }
}

export function isCraftIssue(issue: QualityIssue): boolean {
  return issue.rule.startsWith('craft-')
}
