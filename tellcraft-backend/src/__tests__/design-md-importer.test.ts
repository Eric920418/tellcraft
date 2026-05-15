import { describe, expect, it } from 'vitest'
import { parseTellcraftDesignMd } from '../services/design-md-importer'
import { renderTellcraftDesignSystemAsMarkdown } from '../services/design-system-renderer'
import type { DesignSystem } from '../services/uiux-generation'

const sampleDs: DesignSystem = {
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
  shadows: {
    strategy: 'subtle-shadows',
    values: { sm: '0 1px 2px rgba(0,0,0,0.05)', md: '0 4px 6px rgba(0,0,0,0.1)' },
  },
  animationPersonality: 'smooth',
  layoutArchetype: 'editorial',
}

describe('Phase I: parseTellcraftDesignMd', () => {
  describe('Round-trip 一致性（最關鍵驗收）', () => {
    it('render → parse 後核心欄位完全一致', () => {
      const md = renderTellcraftDesignSystemAsMarkdown(sampleDs)
      const result = parseTellcraftDesignMd(md)
      expect(result.success).toBe(true)
      if (!result.success) return

      const ds = result.designSystem
      // colorPalette 必填欄位
      expect(ds.colorPalette.primary).toBe('#5B5BD6')
      expect(ds.colorPalette.background).toBe('#FFFFFF')
      expect(ds.colorPalette.foreground).toBe('#1A1A1A')
      // colorPalette 可選欄位
      expect(ds.colorPalette.secondary).toBe('#7C7CE8')
      expect(ds.colorPalette.accent).toBe('#A855F7')
      expect(ds.colorPalette.surface1).toBe('#F9FAFB')
      expect(ds.colorPalette.surface2).toBe('#F3F4F6')
      expect(ds.colorPalette.destructive).toBe('#EF4444')
      expect(ds.colorPalette.success).toBe('#10B981')
    })

    it('typography 完整 round-trip', () => {
      const md = renderTellcraftDesignSystemAsMarkdown(sampleDs)
      const result = parseTellcraftDesignMd(md)
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.designSystem.typography.fontFamily).toBe('Inter')
      expect(result.designSystem.typography.scale.xs).toBe('0.75rem')
      expect(result.designSystem.typography.scale.base).toBe('1rem')
    })

    it('spacing + borderRadius round-trip', () => {
      const md = renderTellcraftDesignSystemAsMarkdown(sampleDs)
      const result = parseTellcraftDesignMd(md)
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.designSystem.spacing.unit).toBe(4)
      expect(result.designSystem.spacing.scale.md).toBe('1rem')
      expect(result.designSystem.borderRadius.full).toBe('9999px')
    })

    it('shadows + animationPersonality + layoutArchetype round-trip', () => {
      const md = renderTellcraftDesignSystemAsMarkdown(sampleDs)
      const result = parseTellcraftDesignMd(md)
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.designSystem.shadows?.strategy).toBe('subtle-shadows')
      expect(result.designSystem.animationPersonality).toBe('smooth')
      expect(result.designSystem.layoutArchetype).toBe('editorial')
    })

    it('cssVariables 保留原始格式', () => {
      const md = renderTellcraftDesignSystemAsMarkdown(sampleDs)
      const result = parseTellcraftDesignMd(md)
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.designSystem.cssVariables).toContain(':root')
      expect(result.designSystem.cssVariables).toContain('--color-primary')
    })
  })

  describe('用戶手動修改場景', () => {
    it('用戶把 primary 改紅 → parse 出新色', () => {
      let md = renderTellcraftDesignSystemAsMarkdown(sampleDs)
      md = md.replace(/`#5B5BD6`/g, '`#EF4444`')
      const result = parseTellcraftDesignMd(md)
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.designSystem.colorPalette.primary).toBe('#EF4444')
    })

    it('用戶刪掉 secondary 行 → fallback 用 primary', () => {
      const md = renderTellcraftDesignSystemAsMarkdown(sampleDs)
        .replace(/- \*\*Secondary\*\* \(`[^`]+`\):[^\n]*\n/, '')
      const result = parseTellcraftDesignMd(md)
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.designSystem.colorPalette.secondary).toBe(result.designSystem.colorPalette.primary)
      expect(result.warnings.some(w => w.includes('secondary'))).toBe(true)
    })
  })

  describe('錯誤訊息（CLAUDE.md「所有錯誤完整顯示在前端」）', () => {
    it('空字串 → 明確錯誤', () => {
      const result = parseTellcraftDesignMd('')
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.errors[0]).toContain('內容為空')
    })

    it('沒有任何 H2 段落 → 格式錯誤', () => {
      const result = parseTellcraftDesignMd('this is just plain text, no markdown')
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.errors[0]).toContain('找不到任何 ## 段落')
    })

    it('缺 Color Palette section → 必填錯誤', () => {
      const result = parseTellcraftDesignMd('## Visual Theme\n\nNo colors.\n')
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.errors.some(e => e.includes('Color Palette'))).toBe(true)
    })

    it('primary 寫成 "red"（非 hex）→ 必填錯誤含具體格式提示', () => {
      const md = `## Color Palette\n\n### Primary\n- **Primary** (red): 主色\n- **Background** (\`#FFFFFF\`): bg\n- **Foreground** (\`#000000\`): fg\n`
      const result = parseTellcraftDesignMd(md)
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.errors.some(e => e.includes('primary 必填'))).toBe(true)
      expect(result.errors.some(e => e.includes('#xxxxxx'))).toBe(true)
    })

    it('超過 200KB → 明確錯誤', () => {
      const huge = 'x'.repeat(200_001)
      const result = parseTellcraftDesignMd(huge)
      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.errors[0]).toContain('200KB')
    })

    it('null 或非字串輸入 → 不 crash 返回錯誤', () => {
      // @ts-expect-error 故意傳非字串測 defensive 處理
      const result = parseTellcraftDesignMd(null)
      expect(result.success).toBe(false)
    })
  })

  describe('寬鬆容忍（設計師 / 其他 AI 寫的變體）', () => {
    it('最小化 markdown 只含必填欄位仍可解析', () => {
      const minimal = `## Color Palette

### Primary
- **Primary** (\`#FF0000\`): 主色

### Neutral & Surface
- **Background** (\`#FFFFFF\`): bg
- **Foreground** (\`#000000\`): fg
`
      const result = parseTellcraftDesignMd(minimal)
      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.designSystem.colorPalette.primary).toBe('#FF0000')
      expect(result.designSystem.colorPalette.background).toBe('#FFFFFF')
      expect(result.designSystem.colorPalette.foreground).toBe('#000000')
      // fallback 欄位
      expect(result.designSystem.typography.fontFamily).toContain('Inter')
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('Color Palette 不分子標題（無 ### Primary）仍可解析', () => {
      const flat = `## Color Palette

- **Primary** (\`#FF0000\`): 主色
- **Background** (\`#FFFFFF\`): bg
- **Foreground** (\`#000000\`): fg
`
      const result = parseTellcraftDesignMd(flat)
      expect(result.success).toBe(true)
    })
  })
})
