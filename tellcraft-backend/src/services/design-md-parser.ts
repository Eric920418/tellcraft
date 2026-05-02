/**
 * Design MD Parser — deterministic regex 解析 awesome-design-md DESIGN.md。
 *
 * 71 個檔案分兩種格式（build-time test 全覆蓋）：
 *   Format A（47 brands）：numbered headings 「## 1. Visual Theme」「## 2. Color Palette」
 *   Format B（24 brands）：unnumbered headings 「## Overview」「## Colors」「## Typography」
 *
 * 解析策略：
 *   1. 切 H2 區段 + 標題正規化（剝 N. 前綴 + 別名映射）
 *   2. 每區段內切 H3 子區段
 *   3. 各 section 用對應子解析器（color bullet / typography table / component spec）
 *   4. 任何子解析失敗 fail-soft（保留 partial 結果），不 throw
 *
 * 零 LLM、零外部依賴。
 */

import {
  DesignSystemSchema,
  type DesignColorEntry,
  type DesignColorPalette,
  type DesignComponentSpec,
  type DesignComponents,
  type DesignSpacing,
  type DesignSystem,
  type DesignTypography,
  type DesignTypographyRow,
  type DesignVisualTheme,
} from '../types/design-system-schema'

interface Section {
  title: string
  rawTitle: string
  body: string
  subsections: SubSection[]
}

interface SubSection {
  title: string
  rawTitle: string
  body: string
}

const H2_RE = /^##\s+(.+)$/gm
const H3_RE = /^###\s+(.+)$/gm
const NUM_PREFIX_RE = /^\d+\.\s+/

function normalizeHeading(raw: string): string {
  return raw.replace(NUM_PREFIX_RE, '').trim().toLowerCase()
}

function splitH2Sections(content: string): Section[] {
  const sections: Section[] = []
  const matches = [...content.matchAll(H2_RE)]
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]
    const start = m.index! + m[0].length
    const end = i + 1 < matches.length ? matches[i + 1].index! : content.length
    const body = content.slice(start, end)
    const rawTitle = m[1].replace(NUM_PREFIX_RE, '').trim()
    sections.push({
      title: normalizeHeading(m[1]),
      rawTitle,
      body,
      subsections: splitH3Sections(body),
    })
  }
  return sections
}

function splitH3Sections(body: string): SubSection[] {
  const subs: SubSection[] = []
  const matches = [...body.matchAll(H3_RE)]
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]
    const start = m.index! + m[0].length
    const end = i + 1 < matches.length ? matches[i + 1].index! : body.length
    subs.push({
      title: normalizeHeading(m[1]),
      rawTitle: m[1].trim(),
      body: body.slice(start, end),
    })
  }
  return subs
}

const VISUAL_THEME_ALIASES = new Set(['visual theme & atmosphere', 'visual theme', 'overview'])
const COLOR_ALIASES = new Set(['color palette & roles', 'color palette', 'colors'])
const TYPOGRAPHY_ALIASES = new Set(['typography rules', 'typography'])
const COMPONENT_ALIASES = new Set(['component stylings', 'components'])
const LAYOUT_ALIASES = new Set(['layout principles', 'layout', 'spacing & layout'])
const SHAPES_ALIASES = new Set(['shapes', 'border radius'])

function findSection(sections: Section[], aliases: Set<string>): Section | null {
  return sections.find(s => aliases.has(s.title)) ?? null
}

const PALETTE_KEY_MAP: Array<[RegExp, keyof DesignColorPalette]> = [
  [/^primary/i, 'primary'],
  [/^brand/i, 'brand'],
  [/^accent/i, 'accent'],
  [/^neutral/i, 'neutral'],
  [/^surface\s*&?\s*border/i, 'surface'],
  [/^surface/i, 'surface'],
  [/^border|hairline/i, 'border'],
  [/^shadow/i, 'shadow'],
  [/^interactive/i, 'accent'],
  [/^semantic/i, 'accent'],
  [/^text/i, 'neutral'],
]

function classifyPaletteKey(subTitle: string): keyof DesignColorPalette {
  for (const [re, key] of PALETTE_KEY_MAP) {
    if (re.test(subTitle)) return key
  }
  return 'other'
}

const COLOR_LINE_RE = /^[-*]\s+\*\*([^*]+)\*\*\s*\(([^)]+)\)\s*:\s*(.+)$/
const HEX_RE = /#[0-9a-fA-F]{3,8}/
const RGBA_RE = /rgba?\([\d\s.,/%]+\)/

function extractColorValue(parens: string, role: string): string {
  const cleaned = parens.replace(/`/g, '').trim()
  const hexMatch = cleaned.match(HEX_RE)
  if (hexMatch) return hexMatch[0]
  const rgbaMatch = cleaned.match(RGBA_RE)
  if (rgbaMatch) return rgbaMatch[0]
  const inRole = role.match(HEX_RE)
  if (inRole) return inRole[0]
  return cleaned
}

function parseColorBullets(body: string): DesignColorEntry[] {
  const entries: DesignColorEntry[] = []
  for (const rawLine of body.split('\n')) {
    const m = COLOR_LINE_RE.exec(rawLine.trim())
    if (!m) continue
    const [, name, parens, role] = m
    entries.push({
      name: name.trim(),
      value: extractColorValue(parens, role),
      role: role.trim(),
    })
  }
  return entries
}

function parseColorPalette(section: Section): DesignColorPalette {
  const palette: DesignColorPalette = {}
  for (const sub of section.subsections) {
    const key = classifyPaletteKey(sub.rawTitle)
    const entries = parseColorBullets(sub.body)
    if (!entries.length) continue
    const existing = palette[key] ?? []
    palette[key] = [...existing, ...entries]
  }
  if (section.subsections.length === 0) {
    const entries = parseColorBullets(section.body)
    if (entries.length) palette.other = entries
  }
  return palette
}

const FONT_FAMILY_RE = /\*\*([^*]+)\*\*/g
const TABLE_HEADER_RE = /^\|(.+)\|$/
const TABLE_SEP_RE = /^\|[-:|\s]+\|$/

function parseTypographyTable(body: string): DesignTypographyRow[] {
  const rows: DesignTypographyRow[] = []
  const lines = body.split('\n').map(l => l.trim())
  let headerCols: string[] | null = null
  let inTable = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.startsWith('|')) {
      if (inTable) break
      continue
    }
    if (TABLE_SEP_RE.test(line)) {
      inTable = true
      continue
    }
    const headerMatch = TABLE_HEADER_RE.exec(line)
    if (!headerMatch) continue
    const cols = headerMatch[1].split('|').map(c => c.trim())
    if (!headerCols) {
      headerCols = cols.map(c => c.toLowerCase())
      continue
    }
    if (!inTable) continue
    const row: DesignTypographyRow = { role: cols[0] || '' }
    for (let j = 0; j < headerCols.length && j < cols.length; j++) {
      const h = headerCols[j]
      const v = cols[j]
      if (!v) continue
      if (h === 'role' || h === 'token') row.role = v.replace(/`/g, '')
      else if (h === 'font') row.font = v
      else if (h === 'size') row.size = v
      else if (h === 'weight') row.weight = v
      else if (h === 'line height' || h === 'lineheight') row.lineHeight = v
      else if (h === 'letter spacing' || h === 'tracking') row.letterSpacing = v
      else if (h === 'features' || h === 'opentype') row.features = v
      else if (h === 'notes' || h === 'use' || h === 'usage') row.notes = v
    }
    if (row.role) rows.push(row)
  }
  return rows
}

const BACKTICK_FONT_RE = /`([^`]+)`/g
const FONT_FAMILY_LABEL_BLACKLIST = /^(primary|secondary|fallback|mono|monospace|display|text|opentype|features)$/i

function extractFontNameFromLine(line: string): string | null {
  // Format A: "- **Primary**: `sohne-var`, with fallback ..."
  //   → font name lives in first backtick after a label-only **bold**
  const boldMatch = /\*\*([^*]+)\*\*/.exec(line)
  const tickMatches: string[] = []
  let tm
  const re = new RegExp(BACKTICK_FONT_RE.source, 'g')
  while ((tm = re.exec(line)) !== null) tickMatches.push(tm[1])
  if (boldMatch && FONT_FAMILY_LABEL_BLACKLIST.test(boldMatch[1].trim()) && tickMatches.length) {
    return tickMatches[0].trim()
  }
  // Format B: "- **Linear Display** — Linear's custom display sans"
  //   → font name IS the bold text
  if (boldMatch) return boldMatch[1].trim()
  return null
}

function parseTypography(section: Section): DesignTypography {
  const t: DesignTypography = {}
  const fontFamilySub = section.subsections.find(s => /font family/i.test(s.rawTitle))
  if (fontFamilySub) {
    const families: string[] = []
    for (const rawLine of fontFamilySub.body.split('\n')) {
      const line = rawLine.trim()
      if (!/^[-*]\s/.test(line)) continue
      const name = extractFontNameFromLine(line)
      if (name) families.push(name)
    }
    if (families.length) {
      t.primaryFont = families[0]
      const monoCandidate = families.find(f => /mono|code|courier/i.test(f))
      if (monoCandidate) t.monoFont = monoCandidate
    }
  }

  const hierarchySub = section.subsections.find(s => /hierarchy|scale/i.test(s.rawTitle))
  if (hierarchySub) {
    const rows = parseTypographyTable(hierarchySub.body)
    if (rows.length) t.hierarchy = rows
  } else {
    const rows = parseTypographyTable(section.body)
    if (rows.length) t.hierarchy = rows
  }

  const principlesSub = section.subsections.find(s => /principle/i.test(s.rawTitle))
  if (principlesSub) {
    const principles = principlesSub.body
      .split('\n')
      .map(l => l.trim())
      .filter(l => /^[-*]\s/.test(l))
      .map(l => l.replace(/^[-*]\s+/, '').replace(/^\*\*[^*]+\*\*[:\s—-]*/, ''))
      .filter(Boolean)
    if (principles.length) t.principles = principles
  }

  return t
}

const COMPONENT_NAME_RE = /^\*\*`?([^*`]+?)`?\*\*\s*(?:[—-]\s*(.+))?$/
const PROPERTY_BULLET_RE = /^[-*]\s+(.+)$/

function findUnquotedColon(s: string): number {
  let inBacktick = false
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '`') inBacktick = !inBacktick
    else if (s[i] === ':' && !inBacktick) return i
  }
  return -1
}

function parseComponentSpecs(body: string): DesignComponentSpec[] {
  const specs: DesignComponentSpec[] = []
  const lines = body.split('\n')
  let current: DesignComponentSpec | null = null
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue
    const nameMatch = COMPONENT_NAME_RE.exec(line)
    // 區分 bullet bullet（"- ..." or "* ..."）vs bold component header（"**Name**"）：
    // bullet 必須有空格在 - 或 * 後面；組件 header 是 ** 開頭沒有 space
    const isBullet = /^[-*]\s/.test(line)
    if (nameMatch && !isBullet) {
      if (current) specs.push(current)
      current = {
        name: nameMatch[1].trim(),
        description: nameMatch[2]?.trim(),
        properties: {},
      }
      continue
    }
    if (!current) continue
    const propMatch = PROPERTY_BULLET_RE.exec(line)
    if (!propMatch) continue
    const prop = propMatch[1]
    const colonIdx = findUnquotedColon(prop)
    if (colonIdx > 0) {
      const k = prop.slice(0, colonIdx).trim().toLowerCase()
      const v = prop.slice(colonIdx + 1).trim()
      if (k && v && current.properties) current.properties[k] = v
    } else {
      current.description = current.description
        ? `${current.description}; ${prop}`
        : prop
    }
  }
  if (current) specs.push(current)
  return specs
}

const COMPONENT_KIND_MAP: Array<[RegExp, keyof DesignComponents]> = [
  [/button/i, 'buttons'],
  [/card|container/i, 'cards'],
  [/input|form/i, 'inputs'],
  [/badge|tag|pill|chip/i, 'badges'],
  [/nav|menu|header|footer/i, 'navigation'],
]

function classifyComponentKind(subTitle: string): keyof DesignComponents {
  for (const [re, key] of COMPONENT_KIND_MAP) {
    if (re.test(subTitle)) return key
  }
  return 'other'
}

const INLINE_COMPONENT_BULLET_RE = /^[-*]\s+\*\*([^*]+)\*\*\s*[:\s—-]+\s*(.+)$/

function parseInlineComponentBullets(body: string): DesignComponentSpec[] {
  const specs: DesignComponentSpec[] = []
  for (const rawLine of body.split('\n')) {
    const m = INLINE_COMPONENT_BULLET_RE.exec(rawLine.trim())
    if (!m) continue
    specs.push({
      name: m[1].trim(),
      description: m[2].trim(),
      properties: {},
    })
  }
  return specs
}

function parseComponents(section: Section): DesignComponents {
  const out: DesignComponents = {}
  for (const sub of section.subsections) {
    const kind = classifyComponentKind(sub.rawTitle)
    // Try the multi-line "**Name**\n- prop: val" format first
    let specs = parseComponentSpecs(sub.body)
    // Fallback: inline bullet format "- **Name**: description"
    if (!specs.length) specs = parseInlineComponentBullets(sub.body)
    // Fallback 2: H3 title encodes spec inline (e.g. "### Cards: 12px radius")
    if (!specs.length && sub.rawTitle.includes(':')) {
      const colonIdx = sub.rawTitle.indexOf(':')
      specs = [{
        name: sub.rawTitle.slice(0, colonIdx).trim(),
        description: sub.rawTitle.slice(colonIdx + 1).trim(),
        properties: {},
      }]
    }
    if (!specs.length) continue
    const existing = out[kind] ?? []
    out[kind] = [...existing, ...specs]
  }
  return out
}

function parseVisualTheme(section: Section): DesignVisualTheme {
  const out: DesignVisualTheme = {}
  const beforeFirstH3 = section.body.split(/\n###\s+/)[0]
  const paragraphs = beforeFirstH3.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
  if (paragraphs.length) out.atmosphere = paragraphs.slice(0, 3).join('\n\n')

  const keyCharSub = section.subsections.find(s => /key characteristic/i.test(s.rawTitle))
  if (keyCharSub) {
    out.keyCharacteristics = keyCharSub.body
      .split('\n')
      .filter(l => /^[-*]\s/.test(l.trim()))
      .map(l => l.trim().replace(/^[-*]\s+/, ''))
  }
  return out
}

const RADIUS_TOKEN_RE = /\b\d+px\b|\bfull\b|\bnone\b|\b9999px\b/g

function parseSpacing(layoutSection: Section | null, shapesSection: Section | null): DesignSpacing | undefined {
  const out: DesignSpacing = {}
  if (layoutSection) {
    const spacingSub = layoutSection.subsections.find(s => /spacing/i.test(s.rawTitle))
    if (spacingSub) {
      const scale: string[] = []
      for (const line of spacingSub.body.split('\n')) {
        const trimmed = line.trim()
        if (!/^[-*]\s/.test(trimmed)) continue
        const m = trimmed.match(/`?(\d+px(?:\s*-\s*\d+px)?)`?/)
        if (m) scale.push(m[1])
      }
      if (scale.length) out.scale = scale
    }
  }
  const radiiSection = shapesSection ?? layoutSection
  if (radiiSection) {
    const radiusSub = radiiSection.subsections.find(s => /radius/i.test(s.rawTitle))
    if (radiusSub) {
      const set = new Set<string>()
      let m
      while ((m = RADIUS_TOKEN_RE.exec(radiusSub.body)) !== null) {
        set.add(m[0])
      }
      if (set.size) out.borderRadius = Array.from(set)
    }
  }
  return Object.keys(out).length ? out : undefined
}

export interface ParseDesignMdOptions {
  brandKey?: string
  source?: 'vendored_designmd' | 'vision' | 'uploaded_image' | 'merged'
  url?: string
}

export function parseDesignMd(content: string, options: ParseDesignMdOptions = {}): DesignSystem {
  const sections = splitH2Sections(content)

  const visualThemeSec = findSection(sections, VISUAL_THEME_ALIASES)
  const colorSec = findSection(sections, COLOR_ALIASES)
  const typoSec = findSection(sections, TYPOGRAPHY_ALIASES)
  const compSec = findSection(sections, COMPONENT_ALIASES)
  const layoutSec = findSection(sections, LAYOUT_ALIASES)
  const shapesSec = findSection(sections, SHAPES_ALIASES)

  const ds: DesignSystem = {
    metadata: {
      source: options.source ?? 'vendored_designmd',
      brandKey: options.brandKey,
      url: options.url,
      generatedAt: Date.now(),
    },
    rawMarkdown: content,
  }

  if (visualThemeSec) {
    const vt = parseVisualTheme(visualThemeSec)
    if (vt.atmosphere || vt.keyCharacteristics?.length) ds.visualTheme = vt
  }
  if (colorSec) {
    const palette = parseColorPalette(colorSec)
    if (Object.keys(palette).length) ds.colorPalette = palette
  }
  if (typoSec) {
    const typo = parseTypography(typoSec)
    if (typo.primaryFont || typo.hierarchy?.length || typo.principles?.length) {
      ds.typography = typo
    }
  }
  if (compSec) {
    const comps = parseComponents(compSec)
    if (Object.keys(comps).length) ds.components = comps
  }
  const spacing = parseSpacing(layoutSec, shapesSec)
  if (spacing) ds.spacing = spacing

  const result = DesignSystemSchema.safeParse(ds)
  if (!result.success) {
    throw new Error(`[design-md-parser] schema validation failed for ${options.brandKey ?? 'unknown'}: ${result.error.message}`)
  }
  return result.data
}

export function renderDesignSystemMarkdown(ds: DesignSystem): string {
  if (ds.rawMarkdown) return ds.rawMarkdown
  const lines: string[] = []
  if (ds.visualTheme?.atmosphere) {
    lines.push('## Visual Theme', ds.visualTheme.atmosphere, '')
  }
  if (ds.colorPalette) {
    lines.push('## Color Palette')
    for (const [key, entries] of Object.entries(ds.colorPalette)) {
      if (!entries || !entries.length) continue
      lines.push(`### ${key}`)
      for (const e of entries) {
        lines.push(`- **${e.name}** (\`${e.value}\`): ${e.role ?? ''}`)
      }
      lines.push('')
    }
  }
  if (ds.typography) {
    lines.push('## Typography')
    if (ds.typography.primaryFont) lines.push(`- Primary font: ${ds.typography.primaryFont}`)
    if (ds.typography.monoFont) lines.push(`- Mono font: ${ds.typography.monoFont}`)
    if (ds.typography.hierarchy?.length) {
      lines.push('', '| Role | Size | Weight | Line Height | Letter Spacing |', '|---|---|---|---|---|')
      for (const r of ds.typography.hierarchy) {
        lines.push(`| ${r.role} | ${r.size ?? ''} | ${r.weight ?? ''} | ${r.lineHeight ?? ''} | ${r.letterSpacing ?? ''} |`)
      }
    }
    lines.push('')
  }
  if (ds.components) {
    lines.push('## Components')
    for (const [kind, specs] of Object.entries(ds.components)) {
      if (!specs || !specs.length) continue
      lines.push(`### ${kind}`)
      for (const s of specs) {
        lines.push(`**${s.name}**${s.description ? ` — ${s.description}` : ''}`)
        if (s.properties) {
          for (const [k, v] of Object.entries(s.properties)) {
            lines.push(`- ${k}: ${v}`)
          }
        }
        lines.push('')
      }
    }
  }
  return lines.join('\n')
}
