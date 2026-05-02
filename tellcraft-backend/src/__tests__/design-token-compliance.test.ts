import { describe, expect, it } from 'vitest'
import { auditDesignTokenCompliance, computeAllowedColorTokens } from '../services/design-token-compliance'
import { expandColorFamily, findClosestTailwindToken } from '../services/tailwind-color-resolver'
import type { DesignSystem } from '../services/uiux-generation'

const stripeishDs: DesignSystem = {
  cssVariables: '',
  tailwindExtend: { colors: { primary: '#533afd' } },
  typography: { fontFamily: 'Inter', scale: {} },
  colorPalette: {
    primary: '#533afd',  // ≈ violet-600
    secondary: '#7C7CE8',
    accent: '#A855F7',
    background: '#ffffff',
    foreground: '#0f172a',  // ≈ slate-900
    muted: '#64748d',
    border: '#e5edf5',
  },
  spacing: { unit: 4, scale: {} },
  borderRadius: { none: '0', sm: '0.25rem', md: '0.5rem', lg: '0.75rem', full: '9999px' },
}

describe('Phase D: expandColorFamily', () => {
  it('expands purple-500 to all purple shades', () => {
    const tokens = expandColorFamily('purple-500')
    expect(tokens).toContain('purple-50')
    expect(tokens).toContain('purple-500')
    expect(tokens).toContain('purple-900')
    expect(tokens.length).toBeGreaterThan(8)
  })

  it('returns single entry for white/black', () => {
    expect(expandColorFamily('white')).toEqual(['white'])
    expect(expandColorFamily('black')).toEqual(['black'])
  })

  it('returns empty for non-Tailwind tokens', () => {
    expect(expandColorFamily('foreground')).toEqual([])
    expect(expandColorFamily('primary')).toEqual([])
  })
})

describe('Phase D: findClosestTailwindToken', () => {
  it('matches Stripe purple to violet/indigo family', () => {
    const closest = findClosestTailwindToken('#533afd')
    expect(closest).toMatch(/^(violet|indigo|purple|blue)-\d+$/)
  })

  it('matches white precisely', () => {
    expect(findClosestTailwindToken('#ffffff')).toMatch(/white|.*-50/)
  })

  it('returns null for invalid hex', () => {
    expect(findClosestTailwindToken('not a hex')).toBeNull()
  })
})

describe('Phase D: computeAllowedColorTokens', () => {
  it('includes white/black/transparent always', () => {
    const allowed = computeAllowedColorTokens(stripeishDs)
    expect(allowed.has('white')).toBe(true)
    expect(allowed.has('black')).toBe(true)
    expect(allowed.has('transparent')).toBe(true)
  })

  it('includes custom tailwindExtend alias', () => {
    const allowed = computeAllowedColorTokens(stripeishDs)
    expect(allowed.has('primary')).toBe(true)
  })

  it('expands closest color families for each colorPalette hex', () => {
    const allowed = computeAllowedColorTokens(stripeishDs)
    // primary='#533afd' → violet/indigo family → some shade should be allowed
    const hasPurpleish = Array.from(allowed).some(t => /^(violet|indigo|purple|blue)-\d+$/.test(t))
    expect(hasPurpleish).toBe(true)
  })
})

describe('Phase D: auditDesignTokenCompliance', () => {
  it('flags out-of-palette token as critical', () => {
    const files = [{
      path: 'app/page.tsx',
      content: 'export default function() { return <div className="bg-emerald-500">Test</div> }',
    }]
    const result = auditDesignTokenCompliance(files, stripeishDs)
    // emerald is unlikely to be matched by stripe purple (#533afd) family
    const hasViolation = result.issues.some(i => i.rule === 'design-token-out-of-palette')
    expect(hasViolation).toBe(true)
    if (hasViolation) {
      expect(result.issues[0].severity).toBe('critical')
    }
  })

  it('passes white/transparent / custom alias / closest family', () => {
    const files = [{
      path: 'app/page.tsx',
      content: 'export default function() { return <div className="bg-white text-primary border-transparent">OK</div> }',
    }]
    const result = auditDesignTokenCompliance(files, stripeishDs)
    expect(result.violationCount).toBe(0)
  })

  it('deduplicates same token within same file', () => {
    const files = [{
      path: 'app/page.tsx',
      content: `<div className="bg-emerald-500">A</div>
<div className="bg-emerald-500">B</div>
<div className="bg-emerald-500">C</div>`,
    }]
    const result = auditDesignTokenCompliance(files, stripeishDs)
    // 3 同樣的 emerald-500 → 只應報 1 次
    const emeraldViolations = result.issues.filter(i => i.message.includes('emerald'))
    expect(emeraldViolations.length).toBe(1)
  })

  it('only audits .tsx/.jsx/.css files', () => {
    const files = [{
      path: 'README.md',
      content: 'Use bg-emerald-500 for highlights',
    }]
    const result = auditDesignTokenCompliance(files, stripeishDs)
    expect(result.scannedCount).toBe(0)
  })

  it('respects opacity suffix (bg-white/50 → still resolves to white)', () => {
    const files = [{
      path: 'app/page.tsx',
      content: '<div className="bg-white/50">x</div>',
    }]
    const result = auditDesignTokenCompliance(files, stripeishDs)
    const whiteViolations = result.issues.filter(i => i.message.includes('white'))
    expect(whiteViolations.length).toBe(0)
  })
})
