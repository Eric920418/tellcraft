import { describe, expect, it } from 'vitest'
import { mergePatch, type DesignSystemPatch } from '../services/design-system-sync'
import type { DesignSystem } from '../services/uiux-generation'

const baseDs: DesignSystem = {
  cssVariables: ':root { --color-primary: #5B5BD6; }',
  tailwindExtend: { colors: { primary: '#5B5BD6' }, fontFamily: { sans: ['Inter'] } },
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

describe('Phase G: mergePatch — LLM patch merge logic', () => {
  it('merges primary color change', () => {
    const patch: DesignSystemPatch = {
      colorPalette: { primary: '#EF4444' },
      changeNotes: '主色從紫改紅',
    }
    const merged = mergePatch(baseDs, patch)
    expect(merged.colorPalette.primary).toBe('#EF4444')
    // 沒改的欄位保持原值
    expect(merged.colorPalette.secondary).toBe('#7C7CE8')
    expect(merged.colorPalette.foreground).toBe('#1A1A1A')
  })

  it('rejects non-hex values (defensive against LLM hallucination)', () => {
    const patch: DesignSystemPatch = {
      colorPalette: { primary: 'red' },  // 非 hex，應拒絕
      changeNotes: '主色改紅',
    }
    const merged = mergePatch(baseDs, patch)
    expect(merged.colorPalette.primary).toBe('#5B5BD6')  // 維持原值
  })

  it('accepts shorthand 3-digit hex', () => {
    const patch: DesignSystemPatch = {
      colorPalette: { primary: '#F00' },
      changeNotes: 'red',
    }
    const merged = mergePatch(baseDs, patch)
    expect(merged.colorPalette.primary).toBe('#F00')
  })

  it('merges typography fontFamily', () => {
    const patch: DesignSystemPatch = {
      typography: { fontFamily: 'Geist Sans' },
      changeNotes: '字體換 Geist',
    }
    const merged = mergePatch(baseDs, patch)
    expect(merged.typography.fontFamily).toBe('Geist Sans')
    // typography.scale 保留
    expect(merged.typography.scale.base).toBe('1rem')
  })

  it('merges cssVariables when contains :root', () => {
    const patch: DesignSystemPatch = {
      cssVariables: ':root { --color-primary: #EF4444; --color-bg: #FFFFFF; }',
      changeNotes: 'CSS variables 更新',
    }
    const merged = mergePatch(baseDs, patch)
    expect(merged.cssVariables).toContain('#EF4444')
  })

  it('rejects cssVariables without :root selector (defensive)', () => {
    const patch: DesignSystemPatch = {
      cssVariables: 'random text not css',
      changeNotes: '亂寫',
    }
    const merged = mergePatch(baseDs, patch)
    expect(merged.cssVariables).toBe(baseDs.cssVariables)
  })

  it('handles empty patch (no-design-system-change)', () => {
    const patch: DesignSystemPatch = {
      changeNotes: 'no-design-system-change',
    }
    const merged = mergePatch(baseDs, patch)
    expect(merged.colorPalette).toEqual(baseDs.colorPalette)
    expect(merged.typography).toEqual(baseDs.typography)
    expect(merged.cssVariables).toBe(baseDs.cssVariables)
  })

  it('merges multiple color fields at once', () => {
    const patch: DesignSystemPatch = {
      colorPalette: {
        primary: '#EF4444',
        accent: '#10B981',
        background: '#0F172A',
      },
      changeNotes: '深色主題 + 紅綠主色',
    }
    const merged = mergePatch(baseDs, patch)
    expect(merged.colorPalette.primary).toBe('#EF4444')
    expect(merged.colorPalette.accent).toBe('#10B981')
    expect(merged.colorPalette.background).toBe('#0F172A')
    expect(merged.colorPalette.foreground).toBe('#1A1A1A')  // 沒改保留
  })

  it('does not mutate base DesignSystem', () => {
    const patch: DesignSystemPatch = {
      colorPalette: { primary: '#EF4444' },
      changeNotes: '改紅',
    }
    const baseSnapshot = JSON.parse(JSON.stringify(baseDs))
    mergePatch(baseDs, patch)
    expect(baseDs).toEqual(baseSnapshot)
  })
})
