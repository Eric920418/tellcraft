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
  },
  global: {
    grayShades: 8,
    radii: 6,
    fontSizes: 9,
    shadows: 6,
  },
}

const GRAY_REGEX = /\b(?:text|bg|border|ring|divide|placeholder|from|to|via)-(slate|gray|zinc|neutral|stone)-(\d{2,3})\b/g
const RADIUS_REGEX = /\brounded(?:-(?:none|sm|md|lg|xl|2xl|3xl|full))?\b/g
const FONT_SIZE_REGEX = /\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/g
const SHADOW_REGEX = /\bshadow(?:-(?:sm|md|lg|xl|2xl|inner|none))?\b/g

interface FileTokens {
  gray: Set<string>
  radii: Set<string>
  fontSizes: Set<string>
  shadows: Set<string>
}

function extractTokens(content: string): FileTokens {
  const tokens: FileTokens = {
    gray: new Set<string>(),
    radii: new Set<string>(),
    fontSizes: new Set<string>(),
    shadows: new Set<string>(),
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

  return tokens
}

export interface CssAuditResult {
  perFile: Array<{
    path: string
    grayCount: number
    radiusCount: number
    fontSizeCount: number
    shadowCount: number
  }>
  global: {
    grayCount: number
    radiusCount: number
    fontSizeCount: number
    shadowCount: number
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
  }

  const perFileSummary: CssAuditResult['perFile'] = []

  for (const file of allFiles) {
    const tokens = extractTokens(file.content)

    tokens.gray.forEach(t => globalTokens.gray.add(t))
    tokens.radii.forEach(t => globalTokens.radii.add(t))
    tokens.fontSizes.forEach(t => globalTokens.fontSizes.add(t))
    tokens.shadows.forEach(t => globalTokens.shadows.add(t))

    perFileSummary.push({
      path: file.path,
      grayCount: tokens.gray.size,
      radiusCount: tokens.radii.size,
      fontSizeCount: tokens.fontSizes.size,
      shadowCount: tokens.shadows.size,
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

  return {
    perFile: perFileSummary,
    global: {
      grayCount: globalTokens.gray.size,
      radiusCount: globalTokens.radii.size,
      fontSizeCount: globalTokens.fontSizes.size,
      shadowCount: globalTokens.shadows.size,
    },
    issues,
  }
}

export function isConsistencyIssue(issue: QualityIssue): boolean {
  return issue.rule.startsWith('consistency-')
}
