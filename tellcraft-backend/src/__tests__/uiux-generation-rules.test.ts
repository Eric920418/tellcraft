/**
 * 防雷清單 → 測試轉化：uiux-generation.ts 規則測試
 *
 * 覆蓋 CLAUDE.md 防雷清單：
 * - generateTailwindConfig() 禁止 CSS 變數引用，必須用硬編碼值
 */

import { describe, it, expect } from 'vitest'
import { generateTailwindConfig } from '../services/uiux-generation'

// ============================================================
// generateTailwindConfig — 禁止 CSS 變數引用
// 防雷清單：generateTailwindConfig() 必須用硬編碼值（'9999px' 非 'var(--radius-full)'）
// ============================================================

describe('generateTailwindConfig CSS variable prohibition', () => {
  const mockDesignSystem = {
    colorPalette: {
      primary: '#3B82F6',
      secondary: '#6366F1',
      accent: '#F59E0B',
      background: '#FFFFFF',
      foreground: '#111827',
      muted: '#F3F4F6',
      border: '#E5E7EB',
      destructive: '#EF4444',
      success: '#10B981',
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      headingFamily: 'Inter, system-ui, sans-serif',
      scale: { xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem', xl: '1.25rem' },
    },
    borderRadius: {
      none: '0px',
      sm: '4px',
      md: '8px',
      lg: '12px',
      full: '9999px',
    },
    spacing: {
      unit: '0.25rem',
      scale: { '1': '0.25rem', '2': '0.5rem', '4': '1rem', '8': '2rem' },
    },
    tailwindExtend: {
      fontFamily: {},
    },
  }

  it('should NOT contain any CSS variable references (var(--...))', () => {
    const config = generateTailwindConfig(mockDesignSystem as any)
    expect(config).not.toContain('var(--')
    expect(config).not.toContain('var(')
  })

  it('should contain hardcoded color values', () => {
    const config = generateTailwindConfig(mockDesignSystem as any)
    expect(config).toContain("'#3B82F6'")  // primary
    expect(config).toContain("'#6366F1'")  // secondary
  })

  it('should contain hardcoded border radius values', () => {
    const config = generateTailwindConfig(mockDesignSystem as any)
    expect(config).toContain("'0px'")     // none
    expect(config).toContain("'9999px'")  // full
  })

  it('should output valid TypeScript config', () => {
    const config = generateTailwindConfig(mockDesignSystem as any)
    expect(config).toContain("import type { Config } from 'tailwindcss'")
    expect(config).toContain('export default config')
  })

  it('should handle optional destructive/success colors', () => {
    const noOptional = { ...mockDesignSystem, colorPalette: { ...mockDesignSystem.colorPalette, destructive: '', success: '' } }
    const config = generateTailwindConfig(noOptional as any)
    expect(config).not.toContain('destructive')
    expect(config).not.toContain('success')
  })
})
