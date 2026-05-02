import { describe, expect, it } from 'vitest'
import { renderTellcraftDesignSystemAsMarkdown } from '../services/design-system-renderer'
import type { DesignSystem } from '../services/uiux-generation'

const baseDs: DesignSystem = {
  cssVariables: ':root {\n  --color-primary: #5B5BD6;\n  --color-bg: #FFFFFF;\n}',
  tailwindExtend: {
    colors: { primary: '#5B5BD6' },
    fontFamily: {
      sans: ['Inter', 'system-ui'],
      display: ['Geist', 'Inter'],
      mono: ['JetBrains Mono', 'ui-monospace'],
    },
  },
  typography: {
    fontFamily: 'Inter',
    scale: { xs: '0.75rem', base: '1rem', xl: '1.25rem' },
  },
  colorPalette: {
    primary: '#5B5BD6',
    secondary: '#7C7CE8',
    accent: '#A855F7',
    background: '#FFFFFF',
    foreground: '#1A1A1A',
    muted: '#6B7280',
    border: '#E5E7EB',
    surface1: '#F9FAFB',
    surface2: '#F3F4F6',
    surface3: '#E5E7EB',
    ring: '#5B5BD6',
    destructive: '#EF4444',
    success: '#10B981',
  },
  spacing: { unit: 4, scale: { md: '1rem', lg: '1.5rem' } },
  borderRadius: { none: '0', sm: '0.25rem', md: '0.5rem', lg: '0.75rem', full: '9999px' },
}

describe('Phase H: renderTellcraftDesignSystemAsMarkdown', () => {
  it('produces markdown with all 6 standard sections', () => {
    const md = renderTellcraftDesignSystemAsMarkdown(baseDs)
    expect(md).toContain('# Design System')
    expect(md).toContain('## 1. Visual Theme & Atmosphere')
    expect(md).toContain('## 2. Color Palette & Roles')
    expect(md).toContain('## 3. Typography Rules')
    expect(md).toContain('## 4. Layout & Spacing')
  })

  it('includes all colorPalette hex values', () => {
    const md = renderTellcraftDesignSystemAsMarkdown(baseDs)
    expect(md).toContain('#5B5BD6')  // primary
    expect(md).toContain('#A855F7')  // accent
    expect(md).toContain('#FFFFFF')  // background
    expect(md).toContain('#1A1A1A')  // foreground
    expect(md).toContain('#EF4444')  // destructive
    expect(md).toContain('#10B981')  // success
  })

  it('includes all surface levels with role labels', () => {
    const md = renderTellcraftDesignSystemAsMarkdown(baseDs)
    expect(md).toContain('Surface-1')
    expect(md).toContain('Surface-2')
    expect(md).toContain('Surface-3')
  })

  it('renders typography font family + scale table', () => {
    const md = renderTellcraftDesignSystemAsMarkdown(baseDs)
    expect(md).toContain('Inter')
    expect(md).toContain('Geist')      // display
    expect(md).toContain('JetBrains Mono')  // mono
    expect(md).toContain('| Token | Size |')
    expect(md).toContain('| `xs` | 0.75rem |')
  })

  it('renders spacing + borderRadius table', () => {
    const md = renderTellcraftDesignSystemAsMarkdown(baseDs)
    expect(md).toContain('Base Unit**: 4px')
    expect(md).toContain('| `md` | 1rem |')
    expect(md).toContain('Border Radius Scale')
    expect(md).toContain('9999px')
  })

  it('skips Depth section when shadows + depth both undefined', () => {
    const md = renderTellcraftDesignSystemAsMarkdown(baseDs)
    expect(md).not.toContain('## 5. Depth & Elevation')
  })

  it('renders Depth section when shadows present', () => {
    const dsWithShadows: DesignSystem = {
      ...baseDs,
      shadows: {
        strategy: 'layered-shadows',
        values: { sm: '0 1px 2px rgba(0,0,0,0.05)', md: '0 4px 6px rgba(0,0,0,0.1)' },
      },
    }
    const md = renderTellcraftDesignSystemAsMarkdown(dsWithShadows)
    expect(md).toContain('## 5. Depth & Elevation')
    expect(md).toContain('layered-shadows')
    expect(md).toContain('shadow-sm')
  })

  it('renders Gradients section when present', () => {
    const dsWithGradients: DesignSystem = {
      ...baseDs,
      gradients: {
        primary: 'linear-gradient(135deg, #5B5BD6 0%, #A855F7 100%)',
      },
    }
    const md = renderTellcraftDesignSystemAsMarkdown(dsWithGradients)
    expect(md).toContain('## 6. Gradients')
    expect(md).toContain('linear-gradient')
  })

  it('appends CSS Variables raw block', () => {
    const md = renderTellcraftDesignSystemAsMarkdown(baseDs)
    expect(md).toContain('Appendix: CSS Variables')
    expect(md).toContain('--color-primary: #5B5BD6')
  })

  it('does not crash on minimal DesignSystem (most fields default)', () => {
    const minimal: DesignSystem = {
      cssVariables: '',
      tailwindExtend: {},
      typography: { fontFamily: 'system-ui', scale: {} },
      colorPalette: {
        primary: '#000',
        secondary: '#000',
        accent: '#000',
        background: '#fff',
        foreground: '#000',
        muted: '#666',
        border: '#ddd',
      },
      spacing: { unit: 4, scale: {} },
      borderRadius: { none: '0', sm: '0.25rem', md: '0.5rem', lg: '0.75rem', full: '9999px' },
    }
    const md = renderTellcraftDesignSystemAsMarkdown(minimal)
    expect(md).toContain('# Design System')
    expect(md).toContain('## 2. Color Palette & Roles')
    // 沒設 mood / animationPersonality / layoutArchetype → fallback 訊息
    expect(md).toContain('未指定特定視覺主題')
  })

  it('output ends with newline (markdown convention)', () => {
    const md = renderTellcraftDesignSystemAsMarkdown(baseDs)
    expect(md.endsWith('\n')).toBe(true)
  })
})
