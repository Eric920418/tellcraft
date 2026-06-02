/**
 * Design Token Extractor — Node 端純函式分類器
 *
 * 演算法移植自 github.com/Manavarya09/design-extract（designlang, MIT License）
 *   - 對應 src/extractors/{colors,variables,spacing,typography,shadows,borders,breakpoints}.js
 *   - 僅移植「演算法」（色彩 clustering + 語意角色、CSS 變數分類、scale 推導），
 *     不引入其 playwright 依賴與 17 種輸出格式。
 *
 * 輸入 = 瀏覽器端 (CLONE_EXTRACTION_SCRIPT) 收集的原料；輸出 = 結構化 design token。
 * 全部 pure function、無瀏覽器 API、可單測。fail-soft：任何子步驟丟錯由 caller 降級。
 */

// ── 輸入原料型別（與瀏覽器端收集腳本對齊）──

export interface RawColorSample {
  hex: string
  role: 'text' | 'bg' | 'border' | 'button'
  area: number // 元素面積（px²），用於辨識大面積背景
}

export interface RawCssVariable {
  name: string // 例：--color-primary
  value: string
}

/** 數值字串 → 出現次數的頻率表（例：{ '16px': 42 }） */
export type FreqMap = Record<string, number>

export interface RawTokenData {
  cssVariables: RawCssVariable[]
  colorSamples: RawColorSample[]
  fontSizes: FreqMap
  fontWeights: FreqMap
  lineHeights: FreqMap
  paddings: FreqMap
  margins: FreqMap
  gaps: FreqMap
  shadows: FreqMap
  radii: FreqMap
  borders: FreqMap
  gradients: string[]
  mediaQueries: string[]
}

// ── 輸出型別 ──

export interface SemanticColors {
  primary?: string
  secondary?: string
  accent?: string
  foreground?: string
  background?: string
  neutrals: string[]
  surfaces: string[]
  primaryConfidence?: number
}

export interface CategorizedVariables {
  colors: RawCssVariable[]
  spacing: RawCssVariable[]
  typography: RawCssVariable[]
  shadows: RawCssVariable[]
  radii: RawCssVariable[]
  other: RawCssVariable[]
}

export interface SpacingScale {
  baseUnit: number
  scale: number[]
}

export interface TypographyScale {
  fontSizes: string[]
  fontWeights: string[]
  lineHeights: string[]
}

export interface CloneDesignTokens {
  semanticColors: SemanticColors
  cssVariables: CategorizedVariables
  spacingScale: SpacingScale
  typographyScale: TypographyScale
  shadows: string[]
  radii: string[]
  borders: string[]
  gradients: string[]
  breakpoints: number[]
}

// ── 色彩數學工具 ──

interface Rgb { r: number; g: number; b: number }
interface Hsl { h: number; s: number; l: number }

function parseHex(hex: string): Rgb | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const int = parseInt(m[1], 16)
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 }
}

function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  let h = 0, s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0)
    else if (max === gn) h = (bn - rn) / d + 2
    else h = (rn - gn) / d + 4
    h /= 6
  }
  return { h: h * 360, s: s * 100, l: l * 100 }
}

/** RGB 歐式距離 */
function colorDistance(a: Rgb, b: Rgb): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2)
}

/** 色相環最短距離（0-180） */
function hueDistance(h1: number, h2: number): number {
  const d = Math.abs(h1 - h2) % 360
  return d > 180 ? 360 - d : d
}

const CLUSTER_DISTANCE = 15 // 對應 colors.js：perceptual distance 閾值
const CHROMATIC_SAT = 25    // 飽和度 > 25 視為彩色（非中性）
const SECONDARY_HUE_DIST = 60
const ACCENT_USAGE_RATIO = 0.05

// ── 色彩 clustering + 語意角色 ──

interface ColorCluster {
  hex: string
  rgb: Rgb
  hsl: Hsl
  count: number
  area: number
  interactiveBg: boolean // 是否出現在 button/CTA 背景
  bgCount: number
  textCount: number
}

export function clusterColors(samples: RawColorSample[]): ColorCluster[] {
  const clusters: ColorCluster[] = []
  for (const s of samples) {
    const rgb = parseHex(s.hex)
    if (!rgb) continue
    let target = clusters.find(c => colorDistance(c.rgb, rgb) < CLUSTER_DISTANCE)
    if (!target) {
      target = {
        hex: normalizeHex(s.hex), rgb, hsl: rgbToHsl(rgb),
        count: 0, area: 0, interactiveBg: false, bgCount: 0, textCount: 0,
      }
      clusters.push(target)
    }
    target.count++
    target.area += s.area || 0
    if (s.role === 'button') target.interactiveBg = true
    if (s.role === 'bg' || s.role === 'button') target.bgCount++
    if (s.role === 'text') target.textCount++
  }
  return clusters.sort((a, b) => b.count - a.count)
}

function normalizeHex(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  return m ? `#${m[1].toLowerCase()}` : hex
}

function brandScore(c: ColorCluster): number {
  // 對應 colors.js：interactiveBg * 100 + saturation * 2 + log10(count)
  return (c.interactiveBg ? 100 : 0) + c.hsl.s * 2 + Math.log10(c.count + 1)
}

function isChromatic(c: ColorCluster): boolean {
  return c.hsl.s > CHROMATIC_SAT && c.hsl.l > 5 && c.hsl.l < 95
}

export function assignSemanticRoles(clusters: ColorCluster[]): SemanticColors {
  const result: SemanticColors = { neutrals: [], surfaces: [] }
  if (clusters.length === 0) return result

  const totalCount = clusters.reduce((sum, c) => sum + c.count, 0) || 1
  const chromatic = clusters.filter(isChromatic).sort((a, b) => brandScore(b) - brandScore(a))
  const neutral = clusters.filter(c => !isChromatic(c))

  // Primary：最高 brand score 的彩色
  if (chromatic.length > 0) {
    result.primary = chromatic[0].hex
    // Confidence：rank1 與 rank2 的分數差距
    const s1 = brandScore(chromatic[0])
    const s2 = chromatic[1] ? brandScore(chromatic[1]) : 0
    const gap = s1 > 0 ? (s1 - s2) / s1 : 0
    result.primaryConfidence = Math.max(0.3, Math.min(1, 0.3 + gap * 1.4))

    // Secondary：色相與 primary 距離 > 60 的最高分彩色
    const sec = chromatic.slice(1).find(c => hueDistance(c.hsl.h, chromatic[0].hsl.h) > SECONDARY_HUE_DIST)
    if (sec) result.secondary = sec.hex

    // Accent：稀疏使用（< 5% 總出現）且非 primary/secondary 的彩色
    const accent = chromatic.find(c =>
      c.hex !== result.primary && c.hex !== result.secondary &&
      c.count / totalCount < ACCENT_USAGE_RATIO)
    if (accent) result.accent = accent.hex
  }

  // Neutrals：低飽和色，依明度排序去重
  result.neutrals = neutral
    .slice()
    .sort((a, b) => b.hsl.l - a.hsl.l)
    .map(c => c.hex)
    .filter((hex, i, arr) => arr.indexOf(hex) === i)
    .slice(0, 8)

  // Surfaces：大面積、偏亮的中性背景
  result.surfaces = neutral
    .filter(c => c.bgCount > 0)
    .sort((a, b) => b.area - a.area)
    .map(c => c.hex)
    .filter((hex, i, arr) => arr.indexOf(hex) === i)
    .slice(0, 4)

  // Background：最大面積的背景色（中性優先）
  const bgCandidate = [...neutral, ...chromatic]
    .filter(c => c.bgCount > 0)
    .sort((a, b) => b.area - a.area)[0]
  if (bgCandidate) result.background = bgCandidate.hex

  // Foreground：最常見的文字色
  const fgCandidate = clusters
    .filter(c => c.textCount > 0)
    .sort((a, b) => b.textCount - a.textCount)[0]
  if (fgCandidate) result.foreground = fgCandidate.hex

  return result
}

// ── CSS 變數分類（對應 variables.js）──

function looksLikeColor(value: string): boolean {
  return /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|\b(oklch|oklab|lab|lch)\(/i.test(value)
}

/** 每類 CSS 變數上限，避免重度使用變數的站讓 FlowState 膨脹 */
const VAR_CATEGORY_CAP = 24

export function categorizeCssVariables(vars: RawCssVariable[]): CategorizedVariables {
  const out: CategorizedVariables = { colors: [], spacing: [], typography: [], shadows: [], radii: [], other: [] }
  for (const v of vars) {
    const name = v.name.toLowerCase()
    const value = v.value
    if (/shadow|elevation/.test(name)) out.shadows.push(v)
    else if (/radius|rounded|corner/.test(name)) out.radii.push(v)
    else if (/color|\bbg\b|background|\bfg\b|foreground|border|fill|stroke|accent|primary|secondary|brand|surface|ring|muted|destructive|success|warning|danger|info/.test(name) || looksLikeColor(value)) out.colors.push(v)
    else if (/font|text|leading|tracking|line-height|letter|weight|size/.test(name)) out.typography.push(v)
    else if (/spac|gap|margin|padding|inset|space|gutter/.test(name)) out.spacing.push(v)
    else out.other.push(v)
  }
  // 各類 cap（colors 最有 prompt 價值，給較高上限）
  out.colors = out.colors.slice(0, VAR_CATEGORY_CAP)
  out.spacing = out.spacing.slice(0, VAR_CATEGORY_CAP)
  out.typography = out.typography.slice(0, VAR_CATEGORY_CAP)
  out.shadows = out.shadows.slice(0, 12)
  out.radii = out.radii.slice(0, 12)
  out.other = out.other.slice(0, 12)
  return out
}

/** 解析變數值裡的 var(--x) 依賴 → { 變數名: [被引用的變數名] } */
export function resolveVariableDependencies(vars: RawCssVariable[]): Record<string, string[]> {
  const deps: Record<string, string[]> = {}
  for (const v of vars) {
    const refs = [...v.value.matchAll(/var\(\s*(--[\w-]+)/g)].map(m => m[1])
    if (refs.length > 0) deps[v.name] = Array.from(new Set(refs))
  }
  return deps
}

// ── Spacing scale 推導（對應 spacing.js）──

function pxValues(...maps: FreqMap[]): number[] {
  const vals: number[] = []
  for (const map of maps) {
    for (const key of Object.keys(map)) {
      // 一個 padding/margin 字串可能含多個值（"8px 16px"）
      for (const tok of key.split(/\s+/)) {
        const m = /^(-?\d+(?:\.\d+)?)px$/.exec(tok.trim())
        if (m) {
          const n = parseFloat(m[1])
          if (n > 0 && n <= 256) vals.push(n)
        }
      }
    }
  }
  return vals
}

export function inferSpacingScale(paddings: FreqMap, margins: FreqMap, gaps: FreqMap): SpacingScale {
  const vals = pxValues(paddings, margins, gaps)
  const unique = Array.from(new Set(vals)).sort((a, b) => a - b)
  if (unique.length === 0) return { baseUnit: 0, scale: [] }

  // base unit：多數值能被 8 整除 → 8，否則被 4 整除 → 4，否則最小值
  const divBy = (d: number) => vals.filter(v => v % d === 0).length / vals.length
  let baseUnit: number
  if (divBy(8) >= 0.6) baseUnit = 8
  else if (divBy(4) >= 0.6) baseUnit = 4
  else baseUnit = unique[0]

  return { baseUnit, scale: unique.slice(0, 12) }
}

// ── Typography scale 推導（對應 typography.js / fonts.js）──

function sortPxDesc(map: FreqMap): string[] {
  return Object.keys(map)
    .filter(k => /^\d/.test(k) || /px|rem|em/.test(k))
    .sort((a, b) => parseFloat(b) - parseFloat(a))
    .filter((k, i, arr) => arr.indexOf(k) === i)
}

export function inferTypographyScale(fontSizes: FreqMap, fontWeights: FreqMap, lineHeights: FreqMap): TypographyScale {
  return {
    fontSizes: sortPxDesc(fontSizes).slice(0, 10),
    fontWeights: Object.keys(fontWeights)
      .filter(w => /^\d+$/.test(w))
      .sort((a, b) => parseInt(a) - parseInt(b))
      .slice(0, 8),
    lineHeights: Object.keys(lineHeights)
      .sort((a, b) => parseFloat(a) - parseFloat(b))
      .slice(0, 8),
  }
}

// ── Shadows / Radii / Borders / Gradients（依頻率去重）──

function topByFreq(map: FreqMap, limit: number, skip: RegExp): string[] {
  return Object.entries(map)
    .filter(([k]) => k && !skip.test(k.trim()))
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k)
    .slice(0, limit)
}

export function normalizeShadows(map: FreqMap): string[] {
  return topByFreq(map, 6, /^(none|0px none)$/)
}

export function normalizeRadii(map: FreqMap): string[] {
  return topByFreq(map, 6, /^0px$/)
}

export function normalizeBorders(map: FreqMap): string[] {
  return topByFreq(map, 6, /^(none|0px|medium none)$/)
}

export function parseGradients(gradients: string[]): string[] {
  return Array.from(new Set(gradients.filter(g => /gradient/i.test(g)))).slice(0, 6)
}

// ── Breakpoints（對應 breakpoints.js）──

export function summarizeBreakpoints(mediaQueries: string[]): number[] {
  const widths = new Set<number>()
  for (const mq of mediaQueries) {
    for (const m of mq.matchAll(/min-width:\s*(\d+(?:\.\d+)?)px/g)) {
      const n = parseFloat(m[1])
      if (n > 0) widths.add(Math.round(n))
    }
  }
  return Array.from(widths).sort((a, b) => a - b)
}

// ── 主組裝函數 ──

export function buildCloneDesignTokens(raw: RawTokenData): CloneDesignTokens {
  const clusters = clusterColors(raw.colorSamples || [])
  return {
    semanticColors: assignSemanticRoles(clusters),
    cssVariables: categorizeCssVariables(raw.cssVariables || []),
    spacingScale: inferSpacingScale(raw.paddings || {}, raw.margins || {}, raw.gaps || {}),
    typographyScale: inferTypographyScale(raw.fontSizes || {}, raw.fontWeights || {}, raw.lineHeights || {}),
    shadows: normalizeShadows(raw.shadows || {}),
    radii: normalizeRadii(raw.radii || {}),
    borders: normalizeBorders(raw.borders || {}),
    gradients: parseGradients(raw.gradients || []),
    breakpoints: summarizeBreakpoints(raw.mediaQueries || []),
  }
}
