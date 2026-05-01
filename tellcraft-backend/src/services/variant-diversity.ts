/**
 * Variant Diversity Validator (T4)
 *
 * generateDesignVariants prompt 寫了「至少 3 種佈局」「surface 要區別」等規則，
 * 但沒人事後驗證。實測常見「5 個變體都用 sidebar + card grid，只是顏色不同」。
 *
 * 本模組純函數做事後檢查，回傳具體 issue 列表。零 LLM。
 * 呼叫端可以根據 issue 決定是否 retry LLM（帶上 retryHint）。
 */

import type { DesignVariant } from './uiux-generation'

export type DiversityIssueKey =
  | 'layout_archetype_too_few'
  | 'primary_hue_too_similar'
  | 'font_family_too_few'
  | 'depth_strategy_too_few'
  | 'signature_too_similar'

export interface DiversityIssue {
  key: DiversityIssueKey
  message: string
  hint: string  // 給 LLM retry 時用的具體建議
}

export interface DiversityResult {
  passed: boolean
  issues: DiversityIssue[]
  metrics: {
    uniqueArchetypes: number
    uniqueFonts: number
    uniqueDepthStrategies: number
    avgHueDistance: number
    maxSignatureSimilarity: number
  }
}

// ============================================================
// HSL hue 計算（只算 hue，不需要完整 HSL）
// ============================================================

/**
 * Hex → HSL hue (0-360)。失敗回 null。
 */
export function hexToHue(hex: string): number | null {
  const m = hex.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (!m) return null

  let raw = m[1]
  if (raw.length === 3) {
    raw = raw.split('').map(c => c + c).join('')
  }
  const r = parseInt(raw.slice(0, 2), 16) / 255
  const g = parseInt(raw.slice(2, 4), 16) / 255
  const b = parseInt(raw.slice(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min

  // 灰階（無 hue）→ 回傳 -1 作為「無色相」標記
  if (d === 0) return -1

  let h: number
  if (max === r) h = ((g - b) / d) % 6
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4

  h = Math.round(h * 60)
  if (h < 0) h += 360
  return h
}

/**
 * 兩個 hue 的最小角距（0-180）。任一灰階回傳 0（視為「同色」嚴格判定）。
 */
export function hueDistance(h1: number | null, h2: number | null): number {
  if (h1 === null || h2 === null) return 0
  if (h1 < 0 || h2 < 0) return 0  // 灰階不算差異
  const diff = Math.abs(h1 - h2)
  return Math.min(diff, 360 - diff)
}

// ============================================================
// Levenshtein（短字串足夠）
// ============================================================

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const m = a.length, n = b.length
  const dp: number[] = new Array(n + 1)
  for (let j = 0; j <= n; j++) dp[j] = j

  for (let i = 1; i <= m; i++) {
    let prev = i - 1
    dp[0] = i
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j]
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost)
      prev = tmp
    }
  }
  return dp[n]
}

/** 0..1，1 = 完全相同。短字串 < 4 字回傳 0（噪音太大）。 */
export function stringSimilarity(a: string, b: string): number {
  const A = (a || '').toLowerCase().replace(/\s+/g, ' ').trim()
  const B = (b || '').toLowerCase().replace(/\s+/g, ' ').trim()
  if (A.length < 4 || B.length < 4) return 0
  const maxLen = Math.max(A.length, B.length)
  if (maxLen === 0) return 0
  return 1 - levenshtein(A, B) / maxLen
}

// ============================================================
// 主驗證函數
// ============================================================

const THRESHOLDS = {
  minUniqueArchetypes: 3,
  minUniqueFonts: 3,
  minUniqueDepthStrategies: 2,
  minAvgHueDistance: 40,         // pairs avg
  maxSignatureSimilarity: 0.6,   // 任一 pair 不可超過
}

export function validateVariantDiversity(variants: DesignVariant[]): DiversityResult {
  const issues: DiversityIssue[] = []

  if (!Array.isArray(variants) || variants.length < 2) {
    return {
      passed: true,
      issues: [],
      metrics: {
        uniqueArchetypes: 0, uniqueFonts: 0, uniqueDepthStrategies: 0,
        avgHueDistance: 0, maxSignatureSimilarity: 0,
      },
    }
  }

  // 1. layoutArchetype 唯一數
  const archetypes = new Set(
    variants.map(v => v.designSystem?.layoutArchetype).filter(Boolean) as string[]
  )
  if (archetypes.size < THRESHOLDS.minUniqueArchetypes) {
    issues.push({
      key: 'layout_archetype_too_few',
      message: `5 個變體只用了 ${archetypes.size} 種 layoutArchetype（要 ≥ ${THRESHOLDS.minUniqueArchetypes}）`,
      hint: `請讓變體探索不同 layoutArchetype（bento / editorial / dashboard / storytelling / app-shell）。當前：${[...archetypes].join('、')}`,
    })
  }

  // 2. typography.fontFamily 唯一數
  const fonts = new Set(
    variants
      .map(v => v.designSystem?.typography?.fontFamily?.split(',')[0]?.trim().toLowerCase())
      .filter(Boolean) as string[]
  )
  if (fonts.size < THRESHOLDS.minUniqueFonts) {
    issues.push({
      key: 'font_family_too_few',
      message: `5 個變體只用了 ${fonts.size} 種主字體（要 ≥ ${THRESHOLDS.minUniqueFonts}）`,
      hint: `請讓變體使用至少 3 種不同 fontFamily（display 字體 + body 字體不同搭配，或無襯線/襯線/等寬交錯）。當前主字體：${[...fonts].join('、')}`,
    })
  }

  // 3. depth.strategy 唯一數
  const depthStrats = new Set(
    variants.map(v => v.designSystem?.depth?.strategy).filter(Boolean) as string[]
  )
  if (depthStrats.size < THRESHOLDS.minUniqueDepthStrategies) {
    issues.push({
      key: 'depth_strategy_too_few',
      message: `5 個變體只用了 ${depthStrats.size} 種 depth.strategy（要 ≥ ${THRESHOLDS.minUniqueDepthStrategies}）`,
      hint: `請讓至少 2 個變體切換深度策略（flat / subtle / elevated / glassmorphic）。當前：${[...depthStrats].join('、')}`,
    })
  }

  // 4. primary 平均 hue 距離
  const hues = variants.map(v => hexToHue(v.designSystem?.colorPalette?.primary || ''))
  let pairCount = 0
  let totalDistance = 0
  for (let i = 0; i < hues.length; i++) {
    for (let j = i + 1; j < hues.length; j++) {
      totalDistance += hueDistance(hues[i], hues[j])
      pairCount++
    }
  }
  const avgHueDistance = pairCount > 0 ? totalDistance / pairCount : 0
  if (avgHueDistance < THRESHOLDS.minAvgHueDistance) {
    issues.push({
      key: 'primary_hue_too_similar',
      message: `5 個變體 primary 平均色相距離 ${avgHueDistance.toFixed(1)}°（要 ≥ ${THRESHOLDS.minAvgHueDistance}°）`,
      hint: `請讓變體的 colorPalette.primary 跨越色相光譜（例如：藍 / 綠 / 紅 / 中性灰 / 暖橙），不要 5 個都集中在同一色域。`,
    })
  }

  // 5. signatureElement 相似度
  const signatures = variants.map(v => v.signatureElement || '').filter(s => s.length > 0)
  let maxSim = 0
  let mostSimilarPair: [string, string] | null = null
  for (let i = 0; i < signatures.length; i++) {
    for (let j = i + 1; j < signatures.length; j++) {
      const sim = stringSimilarity(signatures[i], signatures[j])
      if (sim > maxSim) {
        maxSim = sim
        mostSimilarPair = [signatures[i], signatures[j]]
      }
    }
  }
  if (maxSim > THRESHOLDS.maxSignatureSimilarity) {
    issues.push({
      key: 'signature_too_similar',
      message: `signatureElement 兩兩相似度過高（${maxSim.toFixed(2)}，閾值 ${THRESHOLDS.maxSignatureSimilarity}）`,
      hint: `請重寫過於相似的 signatureElement。最像的兩個：「${mostSimilarPair?.[0]}」vs「${mostSimilarPair?.[1]}」。每個 signature 必須是具體獨特的視覺元素，不是抽象概念。`,
    })
  }

  return {
    passed: issues.length === 0,
    issues,
    metrics: {
      uniqueArchetypes: archetypes.size,
      uniqueFonts: fonts.size,
      uniqueDepthStrategies: depthStrats.size,
      avgHueDistance: Math.round(avgHueDistance * 10) / 10,
      maxSignatureSimilarity: Math.round(maxSim * 100) / 100,
    },
  }
}

/**
 * 根據 issues 組合一個 LLM retry hint 段落。
 */
export function buildRetryHint(issues: DiversityIssue[]): string {
  if (issues.length === 0) return ''
  const lines = issues.map((i, idx) => `${idx + 1}. ${i.message}\n   → ${i.hint}`)
  return `## 上次生成的變體缺乏差異化（必須改善）

${lines.join('\n')}

請重新生成 5 個變體，這次嚴格確保上述每一點都通過。如果原來的某幾個變體還行，
保留它們的 axis；只重做造成上述問題的那幾個變體，徹底換掉它們的 layoutArchetype /
font / depth / primary hue / signatureElement。`
}
