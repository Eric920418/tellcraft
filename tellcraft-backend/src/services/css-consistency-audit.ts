/**
 * CSS Token Consistency Audit (P0)
 *
 * 統計每個檔案 + 全站使用的 design token 種類數，超出閾值產 issue。
 * 覆蓋影片框架第 4 維度「視覺系統一致性」。
 *
 * 設計考量：
 * - 純靜態零 LLM、零外部依賴
 * - 用 rule prefix `consistency-*` 區分，不擴展 QualityCategory（避免衝擊前端/telemetry/autoFix）
 * - 失敗 fail-open（未知 token 跳過、不阻塞 pipeline）
 * - issue severity：per-file 用 warning，global 用 critical（跨檔濫用更嚴重）
 */

import type { QualityIssue } from './quality-gate'
import type { GeneratedCode } from '../types/flow-state'

const THRESHOLDS = {
  perFile: {
    grayShades: 4,
    radii: 4,
    fontSizes: 6,
    shadows: 4,
    spacings: 6,         // P4: 同檔 ≥6 種 spacing → warning
  },
  global: {
    grayShades: 8,
    radii: 6,
    fontSizes: 9,
    shadows: 6,
    spacings: 10,        // P4: 全站 ≥10 種 spacing → critical
    buttonVariants: 6,   // P4: 全站 ≥6 種 button fingerprint → warning，≥10 → critical
    buttonVariantsCritical: 10,
  },
}

const GRAY_REGEX = /\b(?:text|bg|border|ring|divide|placeholder|from|to|via)-(slate|gray|zinc|neutral|stone)-(\d{2,3})\b/g
const RADIUS_REGEX = /\brounded(?:-(?:none|sm|md|lg|xl|2xl|3xl|full))?\b/g
const FONT_SIZE_REGEX = /\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/g
const SHADOW_REGEX = /\bshadow(?:-(?:sm|md|lg|xl|2xl|inner|none))?\b/g
// P4: spacing tokens — p-/m-/gap-/space-x-/space-y-/px-/py-/mx-/my-，捕獲數值（含 arbitrary [1.5rem]）
// 結尾用 negative lookahead 不用 \b，因為 ] 後不一定有 word boundary
const SPACING_REGEX = /\b(?:p|m|gap|space-[xy]|px|py|pt|pb|pl|pr|mx|my|mt|mb|ml|mr)-(\d+|\[[\d.]+(?:px|rem|em)\])(?![a-z0-9])/g
// P4: button-like 元素（<button> 或 <a className="...">）— 抽 className 內容
const BUTTON_TAG_REGEX = /<(button|a)\s+[^>]*?className\s*=\s*(["'])([^"']+?)\2[^>]*>/g

interface FileTokens {
  gray: Set<string>
  radii: Set<string>
  fontSizes: Set<string>
  shadows: Set<string>
  spacings: Set<string>      // P4
  buttonClasses: string[]    // P4: 每個 button-like 的 className，給後續做 fingerprint
}

function extractTokens(content: string): FileTokens {
  const tokens: FileTokens = {
    gray: new Set<string>(),
    radii: new Set<string>(),
    fontSizes: new Set<string>(),
    shadows: new Set<string>(),
    spacings: new Set<string>(),
    buttonClasses: [],
  }

  let m: RegExpExecArray | null

  GRAY_REGEX.lastIndex = 0
  while ((m = GRAY_REGEX.exec(content)) !== null) {
    tokens.gray.add(`${m[1]}-${m[2]}`)
  }

  RADIUS_REGEX.lastIndex = 0
  while ((m = RADIUS_REGEX.exec(content)) !== null) {
    tokens.radii.add(m[0])
  }

  FONT_SIZE_REGEX.lastIndex = 0
  while ((m = FONT_SIZE_REGEX.exec(content)) !== null) {
    tokens.fontSizes.add(m[0])
  }

  SHADOW_REGEX.lastIndex = 0
  while ((m = SHADOW_REGEX.exec(content)) !== null) {
    tokens.shadows.add(m[0])
  }

  SPACING_REGEX.lastIndex = 0
  while ((m = SPACING_REGEX.exec(content)) !== null) {
    tokens.spacings.add(m[0])  // p-4 / m-6 / gap-2 / px-[1.5rem]
  }

  BUTTON_TAG_REGEX.lastIndex = 0
  while ((m = BUTTON_TAG_REGEX.exec(content)) !== null) {
    tokens.buttonClasses.push(m[3])
  }

  return tokens
}

// ============================================================
// P4: Button variant fingerprint — {bg, text, padding, rounded, fontWeight} 五元組
// 跨頁去重後計算 variant 數量，過多代表設計系統沒落地
// ============================================================

function buttonFingerprint(className: string): string {
  // 拆 token，剝 variant prefix（hover:/focus:/md:），只看預設狀態
  const tokens = className.split(/\s+/).filter(Boolean).map(t => t.replace(/^([a-z-]+:)+/, ''))

  const find = (predicate: (t: string) => boolean): string =>
    tokens.find(predicate) || ''

  const bg = find(t => /^bg-/.test(t))
  const text = find(t => /^text-(white|black|slate|gray|zinc|neutral|stone|red|blue|green|yellow|orange|amber|lime|emerald|teal|cyan|sky|indigo|violet|purple|fuchsia|pink|rose|primary|foreground|muted)/.test(t))
  // padding：取第一個 p-/px-/py- 代表性 token
  const padding = find(t => /^p[xy]?-/.test(t))
  const rounded = find(t => /^rounded(-|$)/.test(t))
  const fontWeight = find(t => /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/.test(t))

  return [bg, text, padding, rounded, fontWeight].join('|')
}

export interface CssAuditResult {
  perFile: Array<{
    path: string
    grayCount: number
    radiusCount: number
    fontSizeCount: number
    shadowCount: number
    spacingCount: number          // P4
  }>
  global: {
    grayCount: number
    radiusCount: number
    fontSizeCount: number
    shadowCount: number
    spacingCount: number          // P4
    buttonVariantCount: number    // P4
  }
  issues: QualityIssue[]
}

export function auditCssConsistency(code: GeneratedCode): CssAuditResult {
  const allFiles = [...code.pages, ...code.components]
  const issues: QualityIssue[] = []
  let counter = 0

  const globalTokens: FileTokens = {
    gray: new Set<string>(),
    radii: new Set<string>(),
    fontSizes: new Set<string>(),
    shadows: new Set<string>(),
    spacings: new Set<string>(),
    buttonClasses: [],
  }
  // P4: button variant fingerprint 全站去重收集（同 fingerprint = 同變體）
  const globalButtonFingerprints = new Set<string>()
  const fingerprintExamples = new Map<string, string>()  // fingerprint → 範例 className

  const perFileSummary: CssAuditResult['perFile'] = []

  for (const file of allFiles) {
    const tokens = extractTokens(file.content)

    tokens.gray.forEach(t => globalTokens.gray.add(t))
    tokens.radii.forEach(t => globalTokens.radii.add(t))
    tokens.fontSizes.forEach(t => globalTokens.fontSizes.add(t))
    tokens.shadows.forEach(t => globalTokens.shadows.add(t))
    tokens.spacings.forEach(t => globalTokens.spacings.add(t))

    // P4: 收集每個 button-like className 的 fingerprint
    for (const btnClass of tokens.buttonClasses) {
      const fp = buttonFingerprint(btnClass)
      if (fp.replace(/\|/g, '').length === 0) continue  // 全空 fingerprint 不算
      globalButtonFingerprints.add(fp)
      if (!fingerprintExamples.has(fp)) {
        fingerprintExamples.set(fp, btnClass.length > 80 ? btnClass.slice(0, 80) + '…' : btnClass)
      }
    }

    perFileSummary.push({
      path: file.path,
      grayCount: tokens.gray.size,
      radiusCount: tokens.radii.size,
      fontSizeCount: tokens.fontSizes.size,
      shadowCount: tokens.shadows.size,
      spacingCount: tokens.spacings.size,
    })

    if (tokens.gray.size >= THRESHOLDS.perFile.grayShades) {
      issues.push({
        id: `consistency-${++counter}`,
        category: 'code_quality',
        severity: 'warning',
        rule: 'consistency-gray-shades',
        file: file.path,
        message: `使用了 ${tokens.gray.size} 種灰色（${[...tokens.gray].sort().join(', ')}），增加視覺噪音`,
        suggestion: '收斂到 ≤3 種：surface-1/2/3 + foreground/muted 即可。優先用 design system token 而非直接 gray-100/200/...',
      })
    }

    if (tokens.radii.size >= THRESHOLDS.perFile.radii) {
      issues.push({
        id: `consistency-${++counter}`,
        category: 'code_quality',
        severity: 'warning',
        rule: 'consistency-radii',
        file: file.path,
        message: `使用了 ${tokens.radii.size} 種圓角（${[...tokens.radii].sort().join(', ')}），缺乏視覺節奏`,
        suggestion: '收斂到 ≤3 種：rounded-md（卡片）+ rounded-lg（容器）+ rounded-full（pill）',
      })
    }

    if (tokens.fontSizes.size >= THRESHOLDS.perFile.fontSizes) {
      issues.push({
        id: `consistency-${++counter}`,
        category: 'code_quality',
        severity: 'warning',
        rule: 'consistency-font-sizes',
        file: file.path,
        message: `使用了 ${tokens.fontSizes.size} 種字級（${[...tokens.fontSizes].sort().join(', ')}），破壞 type scale`,
        suggestion: '收斂到 ≤5 階：caption / body / lead / h2 / h1（如 text-xs / text-base / text-lg / text-2xl / text-4xl）',
      })
    }

    if (tokens.shadows.size >= THRESHOLDS.perFile.shadows) {
      issues.push({
        id: `consistency-${++counter}`,
        category: 'code_quality',
        severity: 'warning',
        rule: 'consistency-shadows',
        file: file.path,
        message: `使用了 ${tokens.shadows.size} 種 shadow（${[...tokens.shadows].sort().join(', ')}），缺乏深度節奏`,
        suggestion: '收斂到 ≤3 階：shadow-sm（hover）+ shadow-md（card）+ shadow-lg（modal）',
      })
    }

    // P4: spacing per-file
    if (tokens.spacings.size >= THRESHOLDS.perFile.spacings) {
      issues.push({
        id: `consistency-${++counter}`,
        category: 'code_quality',
        severity: 'warning',
        rule: 'consistency-spacing',
        file: file.path,
        message: `使用了 ${tokens.spacings.size} 種 spacing（${[...tokens.spacings].sort().slice(0, 8).join(', ')}${tokens.spacings.size > 8 ? '...' : ''}），破壞視覺節奏`,
        suggestion: '收斂到 ≤4 階：用 4px 倍數階梯（p-1 / p-2 / p-4 / p-6 / p-8），不要每個 section 各自決定 padding',
      })
    }
  }

  if (globalTokens.gray.size >= THRESHOLDS.global.grayShades) {
    issues.push({
      id: `consistency-${++counter}`,
      category: 'code_quality',
      severity: 'critical',
      rule: 'consistency-gray-shades-global',
      file: '<global>',
      message: `全站使用了 ${globalTokens.gray.size} 種灰色，遠超設計系統一致性閾值（${THRESHOLDS.global.grayShades}）`,
      suggestion: '審視整個 design system 的灰階使用，回到 mood/tier 定義的色板，避免每頁都引入新色',
    })
  }

  if (globalTokens.radii.size >= THRESHOLDS.global.radii) {
    issues.push({
      id: `consistency-${++counter}`,
      category: 'code_quality',
      severity: 'critical',
      rule: 'consistency-radii-global',
      file: '<global>',
      message: `全站使用了 ${globalTokens.radii.size} 種圓角，破壞品牌一致性`,
      suggestion: '統一到 ≤4 階圓角，配合 design system tokens',
    })
  }

  if (globalTokens.fontSizes.size >= THRESHOLDS.global.fontSizes) {
    issues.push({
      id: `consistency-${++counter}`,
      category: 'code_quality',
      severity: 'critical',
      rule: 'consistency-font-sizes-global',
      file: '<global>',
      message: `全站使用了 ${globalTokens.fontSizes.size} 種字級，缺乏 type scale 紀律`,
      suggestion: '審視 type scale，限制在 8 階內（包含 caption ~ display）',
    })
  }

  if (globalTokens.shadows.size >= THRESHOLDS.global.shadows) {
    issues.push({
      id: `consistency-${++counter}`,
      category: 'code_quality',
      severity: 'critical',
      rule: 'consistency-shadows-global',
      file: '<global>',
      message: `全站使用了 ${globalTokens.shadows.size} 種 shadow，深度系統混亂`,
      suggestion: '收斂到 ≤5 階 shadow，避免 hover/focus/active 各自為政',
    })
  }

  // P4: spacing global
  if (globalTokens.spacings.size >= THRESHOLDS.global.spacings) {
    issues.push({
      id: `consistency-${++counter}`,
      category: 'code_quality',
      severity: 'critical',
      rule: 'consistency-spacing-global',
      file: '<global>',
      message: `全站使用了 ${globalTokens.spacings.size} 種 spacing，破壞節奏紀律`,
      suggestion: '統一到 4px / 8px 倍數階梯，建議 ≤8 階',
    })
  }

  // P4: button variants（跨頁 fingerprint 比對 — 設計系統沒落地的最強訊號）
  const variantCount = globalButtonFingerprints.size
  if (variantCount >= THRESHOLDS.global.buttonVariantsCritical) {
    issues.push({
      id: `consistency-${++counter}`,
      category: 'code_quality',
      severity: 'critical',
      rule: 'consistency-button-variants',
      file: '<global>',
      message: `全站使用了 ${variantCount} 種 button 變體（{bg, text, padding, rounded, fontWeight} 五元組去重），設計系統沒落地的強烈訊號`,
      suggestion: `收斂到 1-3 種主要按鈕（primary/secondary/ghost），統一 padding 與 rounded。範例變體：${[...fingerprintExamples.values()].slice(0, 3).map(s => `「${s}」`).join(' / ')}`,
    })
  } else if (variantCount >= THRESHOLDS.global.buttonVariants) {
    issues.push({
      id: `consistency-${++counter}`,
      category: 'code_quality',
      severity: 'warning',
      rule: 'consistency-button-variants',
      file: '<global>',
      message: `全站使用了 ${variantCount} 種 button 變體，超出設計系統推薦的 1-3 種`,
      suggestion: '審視所有 <button> 與 <a className=> 是否可統一到 primary / secondary / ghost 三種',
    })
  }

  return {
    perFile: perFileSummary,
    global: {
      grayCount: globalTokens.gray.size,
      radiusCount: globalTokens.radii.size,
      fontSizeCount: globalTokens.fontSizes.size,
      shadowCount: globalTokens.shadows.size,
      spacingCount: globalTokens.spacings.size,
      buttonVariantCount: variantCount,
    },
    issues,
  }
}

export function isConsistencyIssue(issue: QualityIssue): boolean {
  return issue.rule.startsWith('consistency-')
}
