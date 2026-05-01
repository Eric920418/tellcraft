import { describe, it, expect } from 'vitest'
import {
  extractCssVariables,
  extractLoadedFonts,
  enforceStyleLock,
} from '../services/style-lock'
import type { DesignSystem, GeneratedComponent } from '../services/uiux-generation'

const baselineDesignSystem: DesignSystem = {
  cssVariables: `:root {
    --color-primary: #3B82F6;
    --color-secondary: #10B981;
    --color-background: #FAFAFA;
    --radius-sm: 0.25rem;
  }`,
  tailwindExtend: {},
  typography: { fontFamily: '"DM Sans", system-ui, sans-serif', scale: { base: '1rem' } },
  colorPalette: {
    primary: '#3B82F6', secondary: '#10B981', accent: '#10B981',
    background: '#FAFAFA', foreground: '#0F172A',
    muted: '#94A3B8', border: '#E2E8F0',
  },
  spacing: { unit: 4, scale: {} },
  borderRadius: { none: '0', sm: '0.25rem', md: '0.5rem', lg: '0.75rem', full: '9999px' },
}

const layoutWithDmSans: GeneratedComponent = {
  path: 'app/layout.tsx',
  content: `import { DM_Sans } from 'next/font/google'
const font = DM_Sans({ subsets: ['latin'], variable: '--font-sans' })
export default function Layout({ children }) { return <html className={font.variable}>{children}</html> }`,
  description: '',
}

// ============================================================
// extractCssVariables
// ============================================================

describe('extractCssVariables', () => {
  it('extracts :root { --x: y; }', () => {
    const css = ':root { --color-primary: #3B82F6; --gap: 8px; }'
    const out = extractCssVariables(css)
    expect(out.get('--color-primary')).toBe('#3B82F6')
    expect(out.get('--gap')).toBe('8px')
  })

  it('handles multiline + whitespace', () => {
    const css = `:root {
      --color-primary:    #ff0000  ;
      --color-secondary: #00ff00;
    }`
    expect(extractCssVariables(css).get('--color-primary')).toBe('#ff0000')
  })

  it('returns empty for missing :root', () => {
    expect(extractCssVariables('body { color: red }').size).toBe(0)
    expect(extractCssVariables('').size).toBe(0)
  })
})

// ============================================================
// extractLoadedFonts
// ============================================================

describe('extractLoadedFonts', () => {
  it('detects single font import', () => {
    const fonts = extractLoadedFonts(`import { DM_Sans } from 'next/font/google'`)
    expect(fonts.has('DM_Sans')).toBe(true)
  })

  it('detects multi-font import', () => {
    const fonts = extractLoadedFonts(`import { Inter, Lora } from 'next/font/google'`)
    expect(fonts.has('Inter')).toBe(true)
    expect(fonts.has('Lora')).toBe(true)
  })

  it('returns empty when no next/font import', () => {
    expect(extractLoadedFonts(`<div>hello</div>`).size).toBe(0)
  })
})

// ============================================================
// enforceStyleLock — CSS variable 還原
// ============================================================

describe('enforceStyleLock — CSS variable', () => {
  it('detects + restores changed --color-primary', () => {
    const modified = {
      pages: [layoutWithDmSans],
      components: [],
      styles: ':root { --color-primary: #ff0000; --color-secondary: #10B981; --color-background: #FAFAFA; --radius-sm: 0.25rem; }',
    }
    const result = enforceStyleLock(baselineDesignSystem, modified)

    expect(result.violations.length).toBe(1)
    expect(result.violations[0].type).toBe('css_variable')
    expect(result.violations[0].token).toBe('--color-primary')
    expect(result.violations[0].expected).toBe('#3B82F6')
    expect(result.violations[0].found).toBe('#ff0000')

    // 還原後應含原色
    expect(result.restoredCode.styles).toContain('--color-primary: #3B82F6')
    expect(result.restoredCode.styles).not.toContain('#ff0000')
    // 其他變數不該被動
    expect(result.restoredCode.styles).toContain('--color-secondary: #10B981')
  })

  it('does NOT restore non-protected variables (e.g. --radius)', () => {
    const modified = {
      pages: [layoutWithDmSans],
      components: [],
      styles: ':root { --color-primary: #3B82F6; --color-secondary: #10B981; --color-background: #FAFAFA; --radius-sm: 1rem; }',
    }
    const result = enforceStyleLock(baselineDesignSystem, modified)
    // --radius-sm 不在 PROTECTED_VAR_PREFIXES，不應被還原
    expect(result.violations.length).toBe(0)
    expect(result.restoredCode.styles).toContain('--radius-sm: 1rem')
  })

  it('returns empty violations when nothing changed', () => {
    const modified = {
      pages: [layoutWithDmSans],
      components: [],
      styles: baselineDesignSystem.cssVariables,
    }
    const result = enforceStyleLock(baselineDesignSystem, modified)
    expect(result.violations.length).toBe(0)
  })

  it('case + whitespace insensitive comparison', () => {
    const modified = {
      pages: [layoutWithDmSans],
      components: [],
      styles: ':root { --color-primary: #3b82f6; --color-secondary: #10B981; --color-background: #FAFAFA; --radius-sm: 0.25rem; }',
    }
    // #3b82f6 vs #3B82F6 — 應視為相同（normalize lowercase）
    const result = enforceStyleLock(baselineDesignSystem, modified)
    expect(result.violations.filter(v => v.token === '--color-primary').length).toBe(0)
  })

  it('does NOT touch when variable is removed entirely (合理重構)', () => {
    const modified = {
      pages: [layoutWithDmSans],
      components: [],
      styles: ':root { --color-secondary: #10B981; --color-background: #FAFAFA; --radius-sm: 0.25rem; }',
    }
    const result = enforceStyleLock(baselineDesignSystem, modified)
    // --color-primary 整個消失 → 不應該強加回去（呼叫端決策）
    expect(result.violations.length).toBe(0)
  })
})

// ============================================================
// enforceStyleLock — Font family
// ============================================================

describe('enforceStyleLock — font family', () => {
  it('flags missing font import in layout.tsx', () => {
    const modifiedLayout: GeneratedComponent = {
      path: 'app/layout.tsx',
      // 沒 import 任何 font
      content: `export default function Layout({ children }) { return <html>{children}</html> }`,
      description: '',
    }
    const modified = {
      pages: [modifiedLayout],
      components: [],
      styles: baselineDesignSystem.cssVariables,
    }
    const result = enforceStyleLock(baselineDesignSystem, modified)
    expect(result.violations.some(v => v.type === 'font_family' && v.token === 'DM Sans')).toBe(true)
  })

  it('accepts DM_Sans (next/font naming) as DM Sans', () => {
    const modified = {
      pages: [layoutWithDmSans],
      components: [],
      styles: baselineDesignSystem.cssVariables,
    }
    const result = enforceStyleLock(baselineDesignSystem, modified)
    expect(result.violations.filter(v => v.type === 'font_family').length).toBe(0)
  })

  it('skips font check if no layout.tsx in modifiedCode', () => {
    const modified = {
      pages: [{ path: 'app/page.tsx', content: 'export default function P() {}', description: '' }],
      components: [],
      styles: baselineDesignSystem.cssVariables,
    }
    const result = enforceStyleLock(baselineDesignSystem, modified)
    expect(result.violations.filter(v => v.type === 'font_family').length).toBe(0)
  })
})
