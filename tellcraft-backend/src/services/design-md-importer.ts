/**
 * DESIGN.md Importer (Phase I)
 *
 * Reverse parser: 解析用戶上傳的 DESIGN.md 為 uiux-generation DesignSystem 物件。
 *
 * 設計目標：
 *   1. Round-trip 一致性：Phase H renderer 輸出的 DESIGN.md import 回來能還原 DesignSystem
 *   2. 寬鬆容忍：設計師 / 其他 AI 工具寫的變體 markdown 也能盡力解析（缺 section 用 defaults）
 *   3. 錯誤訊息可讀：失敗時返回行號 + 具體原因（CLAUDE.md「所有錯誤完整顯示在前端」）
 *
 * 必填欄位（缺一即 fail）：
 *   - colorPalette.primary（hex）
 *   - colorPalette.background（hex）
 *   - colorPalette.foreground（hex）
 *
 * 可選欄位（缺則用 reasonable defaults）：
 *   - secondary / accent / muted / border / surface 1-3 / ring / destructive / success
 *   - typography.fontFamily（default 'Inter'）
 *   - typography.scale（default empty）
 *   - spacing / borderRadius / shadows / mood / animationPersonality / layoutArchetype
 */

import type { DesignSystem } from './uiux-generation'
import { createLogger } from '../lib/logger'

const logger = createLogger('design-md-importer')

export type ImportResult =
  | { success: true; designSystem: DesignSystem; warnings: string[] }
  | { success: false; errors: string[] }

const DEFAULTS = {
  fontFamily: 'Inter, system-ui, sans-serif',
  scale: {} as Record<string, string>,
  spacingUnit: 4,
  spacingScale: {} as Record<string, string>,
  borderRadius: { none: '0', sm: '0.25rem', md: '0.5rem', lg: '0.75rem', full: '9999px' },
} as const

const H2_RE = /^##\s+(.+)$/gm
const COLOR_LINE_RE = /^[-*]\s+\*\*([^*]+)\*\*\s*\(`?(#[0-9a-fA-F]{3,8})`?\)\s*:?\s*(.*)$/
const FONT_LINE_RE = /^[-*]\s+\*\*([^*]+)\*\*\s*\(`([^`]+)`\)/
const SCALE_ROW_RE = /^\|\s*`?([^|`]+?)`?\s*\|\s*([^|]+?)\s*\|$/
const RADIUS_LINE_RE = /^[-*]\s+\*\*(none|sm|md|lg|full)\*\*\s*:\s*([^_\n]+?)(?:\s+_.*)?$/
const SPACING_UNIT_RE = /Base Unit\*?\*?\s*:?\*?\*?\s*(\d+)\s*px/i
const CSS_BLOCK_RE = /```css\s*\n([\s\S]*?)\n```/

interface Section {
  title: string
  normalizedTitle: string
  body: string
  startLine: number
}

function splitH2Sections(markdown: string): Section[] {
  const sections: Section[] = []
  const matches = [...markdown.matchAll(H2_RE)]
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]
    const start = m.index! + m[0].length
    const end = i + 1 < matches.length ? matches[i + 1].index! : markdown.length
    const rawTitle = m[1].replace(/^\d+\.\s+/, '').trim()
    sections.push({
      title: rawTitle,
      normalizedTitle: rawTitle.toLowerCase(),
      body: markdown.slice(start, end),
      startLine: markdown.slice(0, m.index!).split('\n').length,
    })
  }
  return sections
}

function findSection(sections: Section[], keywords: string[]): Section | null {
  for (const s of sections) {
    for (const kw of keywords) {
      if (s.normalizedTitle.includes(kw.toLowerCase())) return s
    }
  }
  return null
}

interface ParsedColors {
  primary?: string
  secondary?: string
  accent?: string
  background?: string
  foreground?: string
  muted?: string
  border?: string
  surface1?: string
  surface2?: string
  surface3?: string
  ring?: string
  destructive?: string
  success?: string
  other: Record<string, string>
}

function parseColors(section: Section, warnings: string[]): ParsedColors {
  const out: ParsedColors = { other: {} }
  for (const line of section.body.split('\n')) {
    const m = COLOR_LINE_RE.exec(line.trim())
    if (!m) continue
    const name = m[1].trim().toLowerCase()
    const hex = m[2]
    switch (name) {
      case 'primary': out.primary = hex; break
      case 'secondary': out.secondary = hex; break
      case 'accent': out.accent = hex; break
      case 'background': out.background = hex; break
      case 'foreground': out.foreground = hex; break
      case 'muted': out.muted = hex; break
      case 'border': out.border = hex; break
      case 'surface-1': case 'surface 1': case 'surface1': out.surface1 = hex; break
      case 'surface-2': case 'surface 2': case 'surface2': out.surface2 = hex; break
      case 'surface-3': case 'surface 3': case 'surface3': out.surface3 = hex; break
      case 'ring': out.ring = hex; break
      case 'destructive': out.destructive = hex; break
      case 'success': out.success = hex; break
      default: out.other[name] = hex
    }
  }
  if (Object.keys(out.other).length > 0) {
    warnings.push(`未識別的色號：${Object.keys(out.other).join(', ')}（已保留但不會影響生成）`)
  }
  return out
}

interface ParsedTypography {
  fontFamily?: string
  displayFont?: string
  monoFont?: string
  scale: Record<string, string>
}

function parseTypography(section: Section): ParsedTypography {
  const out: ParsedTypography = { scale: {} }
  let inScaleTable = false
  for (const rawLine of section.body.split('\n')) {
    const line = rawLine.trim()
    const fontMatch = FONT_LINE_RE.exec(line)
    if (fontMatch) {
      const role = fontMatch[1].trim().toLowerCase()
      const family = fontMatch[2]
      if (role === 'primary') out.fontFamily = family
      else if (role === 'display') out.displayFont = family
      else if (role === 'monospace' || role === 'mono') out.monoFont = family
      continue
    }
    if (line.startsWith('| Token') || line.match(/^\|\s*Token\s*\|\s*Size/i)) {
      inScaleTable = true; continue
    }
    if (inScaleTable && line.match(/^\|[-:|\s]+\|$/)) continue
    if (inScaleTable && line.startsWith('|')) {
      const m = SCALE_ROW_RE.exec(line)
      if (m) {
        const token = m[1].trim()
        const size = m[2].trim()
        if (token && size && !token.toLowerCase().includes('token')) {
          out.scale[token] = size
        }
      }
      continue
    }
    if (inScaleTable && !line.startsWith('|') && line.length > 0) inScaleTable = false
  }
  return out
}

interface ParsedLayout {
  spacingUnit?: number
  spacingScale: Record<string, string>
  borderRadius: Partial<Record<'none' | 'sm' | 'md' | 'lg' | 'full', string>>
}

function parseLayout(section: Section): ParsedLayout {
  const out: ParsedLayout = { spacingScale: {}, borderRadius: {} }
  let inSpacingTable = false
  for (const rawLine of section.body.split('\n')) {
    const line = rawLine.trim()
    const unitMatch = SPACING_UNIT_RE.exec(line)
    if (unitMatch) {
      const u = parseInt(unitMatch[1], 10)
      if (!Number.isNaN(u) && u > 0 && u <= 100) out.spacingUnit = u
      continue
    }
    if (line.match(/^\|\s*Token\s*\|\s*Value/i)) { inSpacingTable = true; continue }
    if (inSpacingTable && line.match(/^\|[-:|\s]+\|$/)) continue
    if (inSpacingTable && line.startsWith('|')) {
      const m = SCALE_ROW_RE.exec(line)
      if (m) {
        const token = m[1].trim()
        const value = m[2].trim()
        if (token && value && !token.toLowerCase().includes('token')) {
          out.spacingScale[token] = value
        }
      }
      continue
    }
    if (inSpacingTable && !line.startsWith('|') && line.length > 0) inSpacingTable = false
    const radiusMatch = RADIUS_LINE_RE.exec(line)
    if (radiusMatch) {
      out.borderRadius[radiusMatch[1] as 'none' | 'sm' | 'md' | 'lg' | 'full'] = radiusMatch[2].trim()
    }
  }
  return out
}

function parseVisualTheme(section: Section): { mood?: string; animationPersonality?: DesignSystem['animationPersonality']; layoutArchetype?: DesignSystem['layoutArchetype'] } {
  const out: { mood?: string; animationPersonality?: DesignSystem['animationPersonality']; layoutArchetype?: DesignSystem['layoutArchetype'] } = {}
  for (const rawLine of section.body.split('\n')) {
    const line = rawLine.trim()
    const moodMatch = line.match(/\*\*情緒基調\*\*\s*[:：]\s*(.+)$/)
    if (moodMatch) out.mood = moodMatch[1].trim().split(/[\s（]/)[0].toLowerCase()
    const animMatch = line.match(/\*\*動畫個性\*\*\s*[:：]\s*([a-z]+)/i)
    if (animMatch) {
      const val = animMatch[1].toLowerCase()
      if (['minimal', 'smooth', 'bouncy', 'dramatic', 'playful'].includes(val)) {
        out.animationPersonality = val as DesignSystem['animationPersonality']
      }
    }
    const layoutMatch = line.match(/\*\*佈局原型\*\*\s*[:：]\s*([a-z-]+)/i)
    if (layoutMatch) {
      const val = layoutMatch[1].toLowerCase()
      if (['bento', 'editorial', 'dashboard', 'storytelling', 'app-shell'].includes(val)) {
        out.layoutArchetype = val as DesignSystem['layoutArchetype']
      }
    }
  }
  return out
}

function parseDepth(section: Section): DesignSystem['shadows'] {
  let strategy: 'borders-only' | 'subtle-shadows' | 'layered-shadows' | undefined
  const values: { sm?: string; md?: string; lg?: string; glow?: string } = {}
  for (const rawLine of section.body.split('\n')) {
    const line = rawLine.trim()
    const strategyMatch = line.match(/Shadow Strategy[:：]?\s*`?(borders-only|subtle-shadows|layered-shadows)`?/i)
    if (strategyMatch) { strategy = strategyMatch[1].toLowerCase() as typeof strategy; continue }
    const valueMatch = line.match(/\*\*shadow-(sm|md|lg)\*\*\s*[:：]\s*`?([^`]+)`?/)
    if (valueMatch) { values[valueMatch[1] as 'sm' | 'md' | 'lg'] = valueMatch[2].trim(); continue }
    const glowMatch = line.match(/\*\*glow\*\*\s*[:：]\s*`?([^`]+)`?/)
    if (glowMatch) values.glow = glowMatch[1].trim()
  }
  if (!strategy && Object.keys(values).length === 0) return undefined
  return { strategy: strategy ?? 'subtle-shadows', values }
}

function parseCssVariables(markdown: string): string | undefined {
  const m = CSS_BLOCK_RE.exec(markdown)
  if (!m) return undefined
  const content = m[1].trim()
  if (!content.includes(':root')) return undefined
  return content
}

const HEX_REGEX_STRICT = /^#[0-9a-fA-F]{3,8}$/
function isValidHex(v: string | undefined): v is string {
  return !!v && HEX_REGEX_STRICT.test(v)
}

export function parseTellcraftDesignMd(markdown: string): ImportResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!markdown || typeof markdown !== 'string') {
    return { success: false, errors: ['DESIGN.md 內容為空'] }
  }
  if (markdown.length > 200_000) {
    return { success: false, errors: ['DESIGN.md 內容超過 200KB 上限'] }
  }

  const sections = splitH2Sections(markdown)
  if (sections.length === 0) {
    return { success: false, errors: ['找不到任何 ## 段落，DESIGN.md 格式錯誤'] }
  }

  const colorsSection = findSection(sections, ['color palette', '色彩'])
  const typoSection = findSection(sections, ['typography', '字體'])
  const layoutSection = findSection(sections, ['layout & spacing', 'spacing', '佈局', 'layout'])
  const themeSection = findSection(sections, ['visual theme', '視覺主題'])
  const depthSection = findSection(sections, ['depth', '深度'])

  if (!colorsSection) errors.push('找不到 ## Color Palette section（必填）')
  if (!typoSection) warnings.push('找不到 ## Typography section，將使用 Inter 預設字體')
  if (!layoutSection) warnings.push('找不到 ## Layout & Spacing section，將使用預設 spacing/borderRadius')

  if (errors.length > 0) return { success: false, errors }

  const colors = colorsSection ? parseColors(colorsSection, warnings) : { other: {} } as ParsedColors
  const typo = typoSection ? parseTypography(typoSection) : { scale: {} } as ParsedTypography
  const layout = layoutSection ? parseLayout(layoutSection) : { spacingScale: {}, borderRadius: {} } as ParsedLayout
  const theme = themeSection ? parseVisualTheme(themeSection) : {}
  const shadows = depthSection ? parseDepth(depthSection) : undefined
  const cssVariables = parseCssVariables(markdown)

  if (!isValidHex(colors.primary)) {
    errors.push('colorPalette.primary 必填且必須是 hex 色號（例如 #5B5BD6），請檢查 ### Primary 段內「- **Primary** (`#xxxxxx`)」格式')
  }
  if (!isValidHex(colors.background)) {
    errors.push('colorPalette.background 必填且必須是 hex 色號，請檢查 ### Neutral & Surface 段內「- **Background** (`#xxxxxx`)」格式')
  }
  if (!isValidHex(colors.foreground)) {
    errors.push('colorPalette.foreground 必填且必須是 hex 色號，請檢查 ### Neutral & Surface 段內「- **Foreground** (`#xxxxxx`)」格式')
  }
  if (errors.length > 0) return { success: false, errors }

  const secondary = isValidHex(colors.secondary) ? colors.secondary : colors.primary!
  const accent = isValidHex(colors.accent) ? colors.accent : colors.primary!
  const muted = isValidHex(colors.muted) ? colors.muted : '#6B7280'
  const border = isValidHex(colors.border) ? colors.border : '#E5E7EB'

  if (!isValidHex(colors.secondary)) warnings.push('secondary 未提供，fallback 用 primary')
  if (!isValidHex(colors.accent)) warnings.push('accent 未提供，fallback 用 primary')
  if (!isValidHex(colors.muted)) warnings.push('muted 未提供，fallback 用 #6B7280')
  if (!isValidHex(colors.border)) warnings.push('border 未提供，fallback 用 #E5E7EB')

  const fontFamily = typo.fontFamily ?? DEFAULTS.fontFamily
  const designSystem: DesignSystem = {
    cssVariables: cssVariables ?? buildFallbackCssVariables({
      primary: colors.primary!, secondary, accent,
      background: colors.background!, foreground: colors.foreground!,
      muted, border,
      surface1: colors.surface1, surface2: colors.surface2, surface3: colors.surface3,
      ring: colors.ring,
    }),
    tailwindExtend: {
      colors: {
        primary: colors.primary!, secondary, accent,
        background: colors.background!, foreground: colors.foreground!,
        muted, border,
        ...(colors.surface1 && { 'surface-1': colors.surface1 }),
        ...(colors.surface2 && { 'surface-2': colors.surface2 }),
        ...(colors.surface3 && { 'surface-3': colors.surface3 }),
        ...(colors.ring && { ring: colors.ring }),
      },
      fontFamily: {
        sans: [fontFamily, 'system-ui', 'sans-serif'],
        ...(typo.displayFont && { display: [typo.displayFont, fontFamily] }),
        ...(typo.monoFont && { mono: [typo.monoFont, 'ui-monospace', 'monospace'] }),
      },
    },
    typography: {
      fontFamily,
      scale: Object.keys(typo.scale).length > 0 ? typo.scale : DEFAULTS.scale,
    },
    colorPalette: {
      primary: colors.primary!, secondary, accent,
      background: colors.background!, foreground: colors.foreground!,
      muted, border,
      ...(colors.surface1 && { surface1: colors.surface1 }),
      ...(colors.surface2 && { surface2: colors.surface2 }),
      ...(colors.surface3 && { surface3: colors.surface3 }),
      ...(colors.ring && { ring: colors.ring }),
      ...(colors.destructive && { destructive: colors.destructive }),
      ...(colors.success && { success: colors.success }),
    },
    spacing: {
      unit: layout.spacingUnit ?? DEFAULTS.spacingUnit,
      scale: Object.keys(layout.spacingScale).length > 0 ? layout.spacingScale : DEFAULTS.spacingScale,
    },
    borderRadius: {
      none: layout.borderRadius.none ?? DEFAULTS.borderRadius.none,
      sm: layout.borderRadius.sm ?? DEFAULTS.borderRadius.sm,
      md: layout.borderRadius.md ?? DEFAULTS.borderRadius.md,
      lg: layout.borderRadius.lg ?? DEFAULTS.borderRadius.lg,
      full: layout.borderRadius.full ?? DEFAULTS.borderRadius.full,
    },
    ...(shadows && { shadows }),
    ...(theme.mood && { mood: theme.mood }),
    ...(theme.animationPersonality && { animationPersonality: theme.animationPersonality }),
    ...(theme.layoutArchetype && { layoutArchetype: theme.layoutArchetype }),
  }

  logger.info({
    primary: colors.primary,
    fontFamily,
    warningCount: warnings.length,
    hasCssVariables: !!cssVariables,
  }, 'DESIGN.md import 解析成功')

  return { success: true, designSystem, warnings }
}

function buildFallbackCssVariables(c: {
  primary: string; secondary: string; accent: string;
  background: string; foreground: string; muted: string; border: string;
  surface1?: string; surface2?: string; surface3?: string; ring?: string
}): string {
  const lines: string[] = [':root {']
  lines.push(`  --color-primary: ${c.primary};`)
  lines.push(`  --color-secondary: ${c.secondary};`)
  lines.push(`  --color-accent: ${c.accent};`)
  lines.push(`  --color-background: ${c.background};`)
  lines.push(`  --color-foreground: ${c.foreground};`)
  lines.push(`  --color-muted: ${c.muted};`)
  lines.push(`  --color-border: ${c.border};`)
  if (c.surface1) lines.push(`  --color-surface-1: ${c.surface1};`)
  if (c.surface2) lines.push(`  --color-surface-2: ${c.surface2};`)
  if (c.surface3) lines.push(`  --color-surface-3: ${c.surface3};`)
  if (c.ring) lines.push(`  --color-ring: ${c.ring};`)
  lines.push('}')
  return lines.join('\n')
}
