import { describe, it, expect } from 'vitest'
import {
  hexToHue, hueDistance, levenshtein, stringSimilarity,
  validateVariantDiversity, buildRetryHint,
} from '../services/variant-diversity'
import type { DesignVariant } from '../services/uiux-generation'

// ============================================================
// hex / hue 轉換
// ============================================================

describe('hexToHue', () => {
  it.each([
    ['#ff0000', 0],     // 紅
    ['#00ff00', 120],   // 綠
    ['#0000ff', 240],   // 藍
    ['#ffff00', 60],    // 黃
    ['#FF00FF', 300],   // 洋紅
  ])('%s → hue %i', (hex, expected) => {
    expect(hexToHue(hex)).toBe(expected)
  })

  it('returns -1 for grayscale', () => {
    expect(hexToHue('#888888')).toBe(-1)
    expect(hexToHue('#000000')).toBe(-1)
  })

  it('handles 3-char hex shorthand', () => {
    expect(hexToHue('#f00')).toBe(0)
  })

  it('returns null for invalid hex', () => {
    expect(hexToHue('not-hex')).toBeNull()
    expect(hexToHue('#xyz')).toBeNull()
    expect(hexToHue('')).toBeNull()
  })
})

describe('hueDistance', () => {
  it('takes shortest arc on 0-360 circle', () => {
    expect(hueDistance(10, 350)).toBe(20)   // 不是 340
    expect(hueDistance(0, 180)).toBe(180)
    expect(hueDistance(120, 240)).toBe(120)
  })

  it('returns 0 when either side is grayscale', () => {
    expect(hueDistance(-1, 120)).toBe(0)
    expect(hueDistance(null, 120)).toBe(0)
  })
})

// ============================================================
// Levenshtein / similarity
// ============================================================

describe('levenshtein', () => {
  it.each([
    ['', '', 0],
    ['abc', 'abc', 0],
    ['abc', 'abd', 1],
    ['kitten', 'sitting', 3],
    ['', 'abc', 3],
  ])('lev(%s, %s) = %i', (a, b, expected) => {
    expect(levenshtein(a, b)).toBe(expected)
  })
})

describe('stringSimilarity', () => {
  it('returns 1 for identical strings', () => {
    expect(stringSimilarity('hello world', 'hello world')).toBe(1)
  })

  it('returns 0 for very short strings (noise filter)', () => {
    expect(stringSimilarity('hi', 'hi')).toBe(0)
  })

  it('detects near-duplicate signatures', () => {
    const a = 'icon-left + 大數字 + 小標籤的 metric 卡'
    const b = 'icon-left + 大數字 + 小標籤的 metric 卡片'
    expect(stringSimilarity(a, b)).toBeGreaterThan(0.85)
  })

  it('low similarity for genuinely different signatures', () => {
    const a = '時鐘式的 24 小時活動熱力圖'
    const b = '雜誌翻頁式的專案詳情'
    expect(stringSimilarity(a, b)).toBeLessThan(0.3)
  })
})

// ============================================================
// validateVariantDiversity
// ============================================================

function makeVariant(overrides: Partial<{
  id: string
  layoutArchetype: string
  primary: string
  fontFamily: string
  depthStrategy: string
  signatureElement: string
}>): DesignVariant {
  return {
    id: (overrides.id as 'A') || 'A',
    name: 'Variant',
    axis: 'hierarchy',
    description: '',
    previewDescription: '',
    keyFeatures: [],
    signatureElement: overrides.signatureElement,
    designSystem: {
      cssVariables: '',
      tailwindExtend: {},
      typography: { fontFamily: overrides.fontFamily || 'Inter, sans-serif', scale: {} },
      colorPalette: {
        primary: overrides.primary || '#3B82F6',
        secondary: '#60A5FA', accent: '#10B981',
        background: '#fff', foreground: '#000',
        muted: '#888', border: '#eee',
      },
      spacing: { unit: 4, scale: {} },
      borderRadius: { none: '0', sm: '0', md: '0', lg: '0', full: '0' },
      depth: { strategy: (overrides.depthStrategy as 'subtle') || 'subtle', cardStyle: '' },
      layoutArchetype: (overrides.layoutArchetype as 'bento') || 'bento',
    },
  }
}

describe('validateVariantDiversity', () => {
  it('passes when 5 truly diverse variants', () => {
    const variants = [
      makeVariant({ id: 'A', layoutArchetype: 'bento',        primary: '#3B82F6', fontFamily: 'DM Sans',     depthStrategy: 'subtle',       signatureElement: '時鐘式的 24 小時活動熱力圖' }),
      makeVariant({ id: 'B', layoutArchetype: 'editorial',    primary: '#EF4444', fontFamily: 'Inter',       depthStrategy: 'flat',         signatureElement: '雜誌翻頁式的專案詳情' }),
      makeVariant({ id: 'C', layoutArchetype: 'storytelling', primary: '#10B981', fontFamily: 'Lora',        depthStrategy: 'elevated',     signatureElement: '地鐵路線圖式的流程追蹤' }),
      makeVariant({ id: 'D', layoutArchetype: 'dashboard',    primary: '#F59E0B', fontFamily: 'Space Grotesk', depthStrategy: 'subtle',     signatureElement: '太空任務控制台的狀態面板' }),
      makeVariant({ id: 'E', layoutArchetype: 'app-shell',    primary: '#8B5CF6', fontFamily: 'Playfair Display', depthStrategy: 'glassmorphic', signatureElement: '打字機式的 hero 文字動畫' }),
    ]
    const result = validateVariantDiversity(variants)
    expect(result.passed).toBe(true)
    expect(result.issues).toHaveLength(0)
    expect(result.metrics.uniqueArchetypes).toBe(5)
    expect(result.metrics.uniqueFonts).toBe(5)
  })

  it('flags low layoutArchetype diversity', () => {
    const variants = Array.from({ length: 5 }, (_, i) =>
      makeVariant({
        id: ['A','B','C','D','E'][i],
        layoutArchetype: i < 4 ? 'bento' : 'editorial',  // 只 2 種
        primary: ['#FF0000','#00FF00','#0000FF','#FFFF00','#FF00FF'][i],
        fontFamily: ['Inter','DM Sans','Lora','Mono','Space Grotesk'][i],
        depthStrategy: i % 2 === 0 ? 'subtle' : 'flat',
        signatureElement: `unique element ${i}`,
      })
    )
    const result = validateVariantDiversity(variants)
    expect(result.passed).toBe(false)
    expect(result.issues.some(i => i.key === 'layout_archetype_too_few')).toBe(true)
  })

  it('flags too-similar primary hues', () => {
    const variants = Array.from({ length: 5 }, (_, i) =>
      makeVariant({
        id: ['A','B','C','D','E'][i],
        layoutArchetype: ['bento','editorial','storytelling','dashboard','app-shell'][i],
        primary: ['#3B82F6','#2563EB','#1D4ED8','#1E40AF','#1E3A8A'][i],  // 全藍
        fontFamily: ['Inter','DM Sans','Lora','Mono','Space Grotesk'][i],
        depthStrategy: i % 2 === 0 ? 'subtle' : 'flat',
        signatureElement: `unique element ${i} with different content here`,
      })
    )
    const result = validateVariantDiversity(variants)
    expect(result.issues.some(i => i.key === 'primary_hue_too_similar')).toBe(true)
  })

  it('flags too-few unique fonts', () => {
    const variants = Array.from({ length: 5 }, (_, i) =>
      makeVariant({
        id: ['A','B','C','D','E'][i],
        layoutArchetype: ['bento','editorial','storytelling','dashboard','app-shell'][i],
        primary: ['#FF0000','#00FF00','#0000FF','#FFFF00','#FF00FF'][i],
        fontFamily: i < 3 ? 'Inter, sans-serif' : 'DM Sans, sans-serif',  // 只 2 種
        depthStrategy: i % 2 === 0 ? 'subtle' : 'flat',
        signatureElement: `unique element ${i} with different content`,
      })
    )
    const result = validateVariantDiversity(variants)
    expect(result.issues.some(i => i.key === 'font_family_too_few')).toBe(true)
  })

  it('flags too-similar signatureElements', () => {
    const variants = Array.from({ length: 5 }, (_, i) =>
      makeVariant({
        id: ['A','B','C','D','E'][i],
        layoutArchetype: ['bento','editorial','storytelling','dashboard','app-shell'][i],
        primary: ['#FF0000','#00FF00','#0000FF','#FFFF00','#FF00FF'][i],
        fontFamily: ['Inter','DM Sans','Lora','Mono','Space Grotesk'][i],
        depthStrategy: i % 2 === 0 ? 'subtle' : 'flat',
        // 兩個極為相似的 signature
        signatureElement: i === 0 ? 'icon-left 大數字 metric 卡片設計樣式'
                        : i === 1 ? 'icon-left 大數字 metric 卡片設計樣式 v2'
                        : `totally different signature ${i} ABC`,
      })
    )
    const result = validateVariantDiversity(variants)
    expect(result.issues.some(i => i.key === 'signature_too_similar')).toBe(true)
  })

  it('returns passed=true when fewer than 2 variants (skip check)', () => {
    expect(validateVariantDiversity([]).passed).toBe(true)
    expect(validateVariantDiversity([makeVariant({})]).passed).toBe(true)
  })
})

describe('buildRetryHint', () => {
  it('returns empty string when no issues', () => {
    expect(buildRetryHint([])).toBe('')
  })

  it('includes message + hint for each issue', () => {
    const hint = buildRetryHint([
      { key: 'layout_archetype_too_few', message: 'M1', hint: 'H1' },
      { key: 'primary_hue_too_similar',  message: 'M2', hint: 'H2' },
    ])
    expect(hint).toContain('M1')
    expect(hint).toContain('H1')
    expect(hint).toContain('M2')
    expect(hint).toContain('H2')
    expect(hint).toContain('重新生成')
  })
})
