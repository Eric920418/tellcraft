import { describe, it, expect } from 'vitest'
import {
  clusterColors,
  assignSemanticRoles,
  categorizeCssVariables,
  resolveVariableDependencies,
  inferSpacingScale,
  inferTypographyScale,
  normalizeShadows,
  normalizeRadii,
  summarizeBreakpoints,
  buildCloneDesignTokens,
  type RawColorSample,
  type RawTokenData,
} from '../services/clone/design-token-extractor'

// ============================================================
// 色彩 clustering
// ============================================================

describe('clusterColors', () => {
  it('合併 perceptual distance < 15 的近似色', () => {
    const samples: RawColorSample[] = [
      { hex: '#1e293b', role: 'bg', area: 1000 },
      { hex: '#1e2940', role: 'bg', area: 500 }, // 與上者極近 → 合併
      { hex: '#ffffff', role: 'bg', area: 2000 },
    ]
    const clusters = clusterColors(samples)
    expect(clusters.length).toBe(2)
    const dark = clusters.find(c => c.hex === '#1e293b')
    expect(dark?.count).toBe(2)
  })

  it('忽略無效 hex', () => {
    const clusters = clusterColors([
      { hex: 'rgba(0,0,0,0)', role: 'bg', area: 0 },
      { hex: 'not-a-color', role: 'text', area: 0 },
      { hex: '#abcdef', role: 'text', area: 100 },
    ])
    expect(clusters.length).toBe(1)
  })
})

// ============================================================
// 語意角色
// ============================================================

describe('assignSemanticRoles', () => {
  it('primary 選定出現在 button 的彩色（brand score 加權互動背景）', () => {
    // 紫色只在按鈕出現一次；灰藍背景大量出現 → primary 應是紫色（互動加權）
    const samples: RawColorSample[] = [
      { hex: '#635bff', role: 'button', area: 200 }, // 互動 → brand score +100
      ...Array.from({ length: 20 }, () => ({ hex: '#64748b', role: 'bg' as const, area: 5000 })),
    ]
    const roles = assignSemanticRoles(clusterColors(samples))
    expect(roles.primary).toBe('#635bff')
    expect(roles.primaryConfidence).toBeGreaterThan(0)
  })

  it('secondary 需與 primary 色相距離 > 60', () => {
    const samples: RawColorSample[] = [
      { hex: '#635bff', role: 'button', area: 200 },  // 紫（hue ~244）
      { hex: '#22c55e', role: 'button', area: 150 },  // 綠（hue ~142）→ secondary
      { hex: '#6d63ff', role: 'bg', area: 100 },      // 與紫同色相 → 不該當 secondary
    ]
    const roles = assignSemanticRoles(clusterColors(samples))
    expect(roles.primary).toBe('#635bff')
    expect(roles.secondary).toBe('#22c55e')
  })

  it('低飽和色歸 neutrals，foreground 取最常見文字色', () => {
    const samples: RawColorSample[] = [
      ...Array.from({ length: 10 }, () => ({ hex: '#0a0a0a', role: 'text' as const, area: 50 })),
      { hex: '#888888', role: 'border', area: 10 },
      { hex: '#f5f5f5', role: 'bg', area: 8000 },
    ]
    const roles = assignSemanticRoles(clusterColors(samples))
    expect(roles.neutrals.length).toBeGreaterThan(0)
    expect(roles.foreground).toBe('#0a0a0a')
  })

  it('空輸入不丟錯', () => {
    expect(() => assignSemanticRoles([])).not.toThrow()
    expect(assignSemanticRoles([]).neutrals).toEqual([])
  })
})

// ============================================================
// CSS 變數分類
// ============================================================

describe('categorizeCssVariables', () => {
  it('依名稱與值分桶', () => {
    const out = categorizeCssVariables([
      { name: '--color-primary', value: '#635bff' },
      { name: '--brand', value: 'rgb(99,91,255)' },
      { name: '--space-4', value: '16px' },
      { name: '--font-size-lg', value: '1.125rem' },
      { name: '--shadow-md', value: '0 4px 6px rgba(0,0,0,.1)' },
      { name: '--radius', value: '12px' },
      { name: '--z-modal', value: '50' },
    ])
    expect(out.colors.map(v => v.name)).toContain('--color-primary')
    expect(out.colors.map(v => v.name)).toContain('--brand')
    expect(out.spacing.map(v => v.name)).toContain('--space-4')
    expect(out.typography.map(v => v.name)).toContain('--font-size-lg')
    expect(out.shadows.map(v => v.name)).toContain('--shadow-md')
    expect(out.radii.map(v => v.name)).toContain('--radius')
    expect(out.other.map(v => v.name)).toContain('--z-modal')
  })

  it('每類數量 cap 防 FlowState 膨脹（colors ≤ 24）', () => {
    const many = Array.from({ length: 50 }, (_, i) => ({ name: `--color-${i}`, value: '#000000' }))
    const out = categorizeCssVariables(many)
    expect(out.colors.length).toBe(24)
  })

  it('解析 var() 依賴', () => {
    const deps = resolveVariableDependencies([
      { name: '--btn-bg', value: 'var(--color-primary)' },
      { name: '--color-primary', value: '#635bff' },
    ])
    expect(deps['--btn-bg']).toEqual(['--color-primary'])
    expect(deps['--color-primary']).toBeUndefined()
  })
})

// ============================================================
// Scale 推導
// ============================================================

describe('inferSpacingScale', () => {
  it('多數值可被 8 整除 → base 8', () => {
    const s = inferSpacingScale({ '8px': 5, '16px': 10, '24px': 4, '32px': 2 }, {}, {})
    expect(s.baseUnit).toBe(8)
    expect(s.scale).toEqual([8, 16, 24, 32])
  })

  it('複合間距字串拆多值', () => {
    const s = inferSpacingScale({ '8px 16px': 3 }, {}, { '4px': 1 })
    expect(s.scale).toContain(8)
    expect(s.scale).toContain(16)
    expect(s.scale).toContain(4)
  })

  it('空輸入回 base 0', () => {
    expect(inferSpacingScale({}, {}, {})).toEqual({ baseUnit: 0, scale: [] })
  })
})

describe('inferTypographyScale', () => {
  it('字級由大到小去重排序', () => {
    const t = inferTypographyScale(
      { '48px': 2, '16px': 30, '16px ': 0, '24px': 5 },
      { '400': 40, '700': 8 },
      { '1.5': 20, '1.2': 5 },
    )
    expect(t.fontSizes[0]).toBe('48px')
    expect(t.fontWeights).toEqual(['400', '700'])
    expect(t.lineHeights[0]).toBe('1.2')
  })
})

// ============================================================
// Shadows / Radii / Breakpoints
// ============================================================

describe('normalize helpers', () => {
  it('shadow 去 none 依頻率排序', () => {
    const out = normalizeShadows({ 'none': 100, '0 4px 6px rgba(0,0,0,.1)': 8, '0 1px 2px rgba(0,0,0,.05)': 3 })
    expect(out).not.toContain('none')
    expect(out[0]).toBe('0 4px 6px rgba(0,0,0,.1)')
  })

  it('radii 去 0px', () => {
    expect(normalizeRadii({ '0px': 50, '8px': 10, '9999px': 4 })).toEqual(['8px', '9999px'])
  })
})

describe('summarizeBreakpoints', () => {
  it('抓 min-width 去重升冪', () => {
    const bp = summarizeBreakpoints([
      '(min-width: 768px)',
      'screen and (min-width: 1024px)',
      '(min-width: 768px)',
      '(max-width: 600px)',
    ])
    expect(bp).toEqual([768, 1024])
  })

  it('空輸入回空陣列', () => {
    expect(summarizeBreakpoints([])).toEqual([])
  })
})

// ============================================================
// 主組裝 fail-soft
// ============================================================

describe('buildCloneDesignTokens', () => {
  it('部分欄位缺失仍可組裝', () => {
    const raw = { colorSamples: [{ hex: '#635bff', role: 'button', area: 100 }] } as unknown as RawTokenData
    const tokens = buildCloneDesignTokens(raw)
    expect(tokens.semanticColors.primary).toBe('#635bff')
    expect(tokens.spacingScale.scale).toEqual([])
    expect(tokens.breakpoints).toEqual([])
  })

  it('完整輸入產出各類 token', () => {
    const raw: RawTokenData = {
      cssVariables: [{ name: '--color-primary', value: '#635bff' }],
      colorSamples: [
        { hex: '#635bff', role: 'button', area: 200 },
        { hex: '#0a0a0a', role: 'text', area: 50 },
      ],
      fontSizes: { '48px': 2, '16px': 20 },
      fontWeights: { '400': 10, '700': 3 },
      lineHeights: { '1.5': 8 },
      paddings: { '16px': 5 },
      margins: { '24px': 3 },
      gaps: { '8px': 4 },
      shadows: { '0 4px 6px rgba(0,0,0,.1)': 5 },
      radii: { '12px': 6 },
      borders: { '1px solid #e5e7eb': 4 },
      gradients: ['linear-gradient(90deg, #635bff, #22c55e)'],
      mediaQueries: ['(min-width: 768px)'],
    }
    const t = buildCloneDesignTokens(raw)
    expect(t.semanticColors.primary).toBe('#635bff')
    expect(t.cssVariables.colors.length).toBe(1)
    expect(t.spacingScale.baseUnit).toBe(8)
    expect(t.typographyScale.fontSizes[0]).toBe('48px')
    expect(t.shadows.length).toBe(1)
    expect(t.radii).toEqual(['12px'])
    expect(t.gradients.length).toBe(1)
    expect(t.breakpoints).toEqual([768])
  })
})
