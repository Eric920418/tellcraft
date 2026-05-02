import { describe, expect, it } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import { parseDesignMd, renderDesignSystemMarkdown } from '../services/design-md-parser'

const designMdRoot = path.join(__dirname, '../../external/awesome-design-md/design-md')

function readFile(brand: string): string | null {
  const file = path.join(designMdRoot, brand, 'DESIGN.md')
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : null
}

function listBrands(): string[] {
  if (!fs.existsSync(designMdRoot)) return []
  return fs.readdirSync(designMdRoot)
    .filter(b => fs.statSync(path.join(designMdRoot, b)).isDirectory())
    .filter(b => fs.existsSync(path.join(designMdRoot, b, 'DESIGN.md')))
}

describe('design-md-parser', () => {
  // 在 submodule 沒拉到的環境（極少數本機測試 / sparse CI）skip 整組
  const brands = listBrands()
  const SUBMODULE_AVAILABLE = brands.length > 0

  it.skipIf(!SUBMODULE_AVAILABLE)('parses all 71 brand DESIGN.md without throwing', () => {
    const failures: string[] = []
    for (const brand of brands) {
      const content = readFile(brand)!
      try {
        parseDesignMd(content, { brandKey: brand })
      } catch (err) {
        failures.push(`${brand}: ${(err as Error).message}`)
      }
    }
    expect(failures).toEqual([])
  })

  it.skipIf(!SUBMODULE_AVAILABLE)('extracts colors + typography for ≥95% of brands (allow few weak parses)', () => {
    let coverage = 0
    for (const brand of brands) {
      const ds = parseDesignMd(readFile(brand)!, { brandKey: brand })
      const hasColors = !!ds.colorPalette && Object.values(ds.colorPalette).some(arr => (arr?.length ?? 0) > 0)
      const hasTypo = !!ds.typography?.hierarchy && ds.typography.hierarchy.length > 0
      if (hasColors && hasTypo) coverage++
    }
    expect(coverage / brands.length).toBeGreaterThanOrEqual(0.95)
  })

  it.skipIf(!SUBMODULE_AVAILABLE)('stripe parse: numbered format A with sohne-var font + multi-component buttons', () => {
    const ds = parseDesignMd(readFile('stripe')!, { brandKey: 'stripe' })
    expect(ds.metadata.brandKey).toBe('stripe')
    expect(ds.metadata.source).toBe('vendored_designmd')
    expect(ds.typography?.primaryFont).toBe('sohne-var')
    expect(ds.colorPalette?.primary?.length).toBeGreaterThan(0)
    const purpleEntry = ds.colorPalette?.primary?.find(e => e.value === '#533afd')
    expect(purpleEntry).toBeDefined()
    expect(ds.components?.buttons?.length).toBeGreaterThan(0)
  })

  it.skipIf(!SUBMODULE_AVAILABLE)('linear.app parse: unnumbered format B with token-based colors', () => {
    const ds = parseDesignMd(readFile('linear.app')!, { brandKey: 'linear.app' })
    expect(ds.typography?.primaryFont).toBe('Linear Display')
    expect(ds.typography?.hierarchy?.length).toBeGreaterThan(5)
    // linear uses {colors.primary} tokens, hex falls in the description
    const lavender = ds.colorPalette?.brand?.find(e => /lavender/i.test(e.name))
    expect(lavender).toBeDefined()
    expect(ds.components?.buttons?.length).toBeGreaterThan(0)
  })

  it.skipIf(!SUBMODULE_AVAILABLE)('apple parse: long font fallback chain captured', () => {
    const ds = parseDesignMd(readFile('apple')!, { brandKey: 'apple' })
    expect(ds.typography?.primaryFont).toMatch(/SF Pro/i)
    expect(ds.colorPalette?.brand?.length).toBeGreaterThan(0)
  })

  it('renderDesignSystemMarkdown returns rawMarkdown verbatim when present', () => {
    const ds = parseDesignMd('# Test\n\n## Overview\n\nSimple atmosphere.\n', { brandKey: 'test' })
    const rendered = renderDesignSystemMarkdown(ds)
    expect(rendered).toContain('Simple atmosphere')
  })

  it('parser is fail-soft on malformed input — returns minimal valid DesignSystem', () => {
    const ds = parseDesignMd('Not a real DESIGN.md, no headings at all.', { brandKey: 'malformed' })
    expect(ds.metadata.brandKey).toBe('malformed')
    // No sections found → schema-valid empty result
    expect(ds.colorPalette).toBeUndefined()
    expect(ds.typography).toBeUndefined()
  })

  it('parser handles inline component bullets (- **Name**: description format)', () => {
    const md = `## Overview\nA test brand.\n\n## Components\n### Buttons\n- **Primary Pill**: Transparent background, white text, pill shape (86px radius).\n- **Ghost Button**: No background or border, gray text.\n`
    const ds = parseDesignMd(md, { brandKey: 'test-inline' })
    expect(ds.components?.buttons?.length).toBe(2)
    expect(ds.components?.buttons?.[0].name).toBe('Primary Pill')
    expect(ds.components?.buttons?.[1].name).toBe('Ghost Button')
  })

  it('parser handles colon-encoded H3 titles (### Cards: 12px radius)', () => {
    const md = `## Components\n### Cards: 12px radius, pastel backgrounds\n\nSome description.\n`
    const ds = parseDesignMd(md, { brandKey: 'test-h3-colon' })
    expect(ds.components?.cards?.length).toBe(1)
    expect(ds.components?.cards?.[0].name).toBe('Cards')
    expect(ds.components?.cards?.[0].description).toContain('12px radius')
  })
})
