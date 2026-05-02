import { describe, expect, it } from 'vitest'
import { computeDesignSystemHash, freezeDesignSystem, convertVendoredToDesignSystem } from '../services/design-system-freeze'
import type { DesignSystem } from '../services/uiux-generation'
import type { DesignSystem as VendoredDesignSpec } from '../types/design-system-schema'

const sampleDs: DesignSystem = {
  cssVariables: ':root { --color-primary: #5B5BD6; }',
  tailwindExtend: {
    colors: { primary: '#5B5BD6' },
    fontFamily: { sans: ['Inter'] },
  },
  typography: { fontFamily: 'Inter', scale: { base: '1rem' } },
  colorPalette: {
    primary: '#5B5BD6',
    secondary: '#7C7CE8',
    accent: '#A855F7',
    background: '#FFFFFF',
    foreground: '#1A1A1A',
    muted: '#6B7280',
    border: '#E5E7EB',
  },
  spacing: { unit: 4, scale: { md: '1rem' } },
  borderRadius: { none: '0', sm: '0.25rem', md: '0.5rem', lg: '0.75rem', full: '9999px' },
}

describe('computeDesignSystemHash', () => {
  it('is stable across repeated calls', () => {
    const a = computeDesignSystemHash(sampleDs)
    const b = computeDesignSystemHash(sampleDs)
    expect(a).toBe(b)
    expect(a).toMatch(/^[0-9a-f]{16}$/)
  })

  it('changes when content changes', () => {
    const a = computeDesignSystemHash(sampleDs)
    const modified = { ...sampleDs, colorPalette: { ...sampleDs.colorPalette, primary: '#FF0000' } }
    const b = computeDesignSystemHash(modified)
    expect(a).not.toBe(b)
  })

  it('is order-independent (object key sort)', () => {
    const a = computeDesignSystemHash(sampleDs)
    // 故意換 key 順序：JSON.parse 後 in-memory 順序仍與字面順序對應
    // stableStringify 應吃 sort 把它們同化
    const reorderedJson = JSON.stringify({
      colorPalette: sampleDs.colorPalette,
      typography: sampleDs.typography,
      cssVariables: sampleDs.cssVariables,
      tailwindExtend: sampleDs.tailwindExtend,
      spacing: sampleDs.spacing,
      borderRadius: sampleDs.borderRadius,
    })
    const reordered = JSON.parse(reorderedJson) as DesignSystem
    const b = computeDesignSystemHash(reordered)
    expect(a).toBe(b)
  })
})

describe('freezeDesignSystem', () => {
  it('returns hash + summary', () => {
    const result = freezeDesignSystem(sampleDs, 'user_designed', { conversationId: 'c1' })
    expect(result.hash).toMatch(/^[0-9a-f]{16}$/)
    expect(result.source).toBe('user_designed')
    expect(result.primaryColor).toBe('#5B5BD6')
    expect(result.fontFamily).toBe('Inter')
    expect(result.frozenAt).toBeGreaterThan(0)
  })

  it('handles all 4 source types', () => {
    for (const source of ['user_designed', 'vendored_designmd', 'vendored_modified', 'rolled_back'] as const) {
      const r = freezeDesignSystem(sampleDs, source)
      expect(r.source).toBe(source)
    }
  })
})

describe('convertVendoredToDesignSystem', () => {
  const vendored: VendoredDesignSpec = {
    metadata: { source: 'vendored_designmd', brandKey: 'stripe', generatedAt: Date.now() },
    visualTheme: {
      atmosphere: 'Premium fintech aesthetic',
      keyCharacteristics: ['Light weight typography'],
    },
    colorPalette: {
      primary: [{ name: 'Stripe Purple', value: '#533afd', role: 'Primary brand' }],
      neutral: [
        { name: 'Heading', value: '#061b31', role: 'Primary headings' },
        { name: 'Body', value: '#64748d', role: 'Secondary text' },
      ],
      surface: [{ name: 'Pure White', value: '#ffffff', role: 'Page background' }],
      border: [{ name: 'Border Default', value: '#e5edf5', role: 'Standard border' }],
    },
    typography: {
      primaryFont: 'sohne-var',
      monoFont: 'SourceCodePro',
    },
  }

  it('extracts primary + foreground + background from vendored', () => {
    const ds = convertVendoredToDesignSystem(vendored)
    expect(ds.colorPalette.primary).toBe('#533afd')
    expect(ds.colorPalette.foreground).toBe('#061b31')
    expect(ds.colorPalette.background).toBe('#ffffff')
    expect(ds.colorPalette.border).toBe('#e5edf5')
  })

  it('synthesizes cssVariables from extracted colors', () => {
    const ds = convertVendoredToDesignSystem(vendored)
    expect(ds.cssVariables).toContain('--color-primary: #533afd')
    expect(ds.cssVariables).toContain('--color-foreground: #061b31')
    expect(ds.cssVariables).toContain('--color-background: #ffffff')
  })

  it('preserves font family from vendored', () => {
    const ds = convertVendoredToDesignSystem(vendored)
    expect(ds.typography.fontFamily).toBe('sohne-var')
    expect(ds.tailwindExtend.fontFamily?.mono?.[0]).toBe('SourceCodePro')
  })

  it('marks layoutPreference with brandKey', () => {
    const ds = convertVendoredToDesignSystem(vendored)
    expect(ds.metadata?.layoutPreference).toBe('vendored:stripe')
  })

  it('falls back to defaults when vendored has minimal data', () => {
    const minimal: VendoredDesignSpec = {
      metadata: { source: 'vendored_designmd', generatedAt: Date.now() },
    }
    const ds = convertVendoredToDesignSystem(minimal)
    expect(ds.colorPalette.primary).toMatch(/^#/)
    expect(ds.typography.fontFamily).toBeTruthy()
    expect(ds.borderRadius).toBeDefined()
  })
})
