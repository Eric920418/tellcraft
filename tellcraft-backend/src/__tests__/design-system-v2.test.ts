import { describe, it, expect } from 'vitest'
import {
  deriveShadows,
  deriveDepth,
  deriveAnimationPersonality,
  deriveLayoutArchetype,
  deriveGradients,
  buildDefaultDesignSystem,
  type IndustryPalette,
} from '../services/fast-build-generation'
import {
  synthesizeVariants,
  buildDesignSystemPrompt,
  type DesignSystem,
  type DesignVariant,
} from '../services/uiux-generation'
import { selectCompositionPatterns } from '../services/composition-patterns'

// ============================================================
// 測試用 IndustryPalette fixture
// ============================================================

const MOCK_PALETTE: IndustryPalette = {
  primary: '#6366f1',
  secondary: '#4f46e5',
  accent: '#f59e0b',
  background: '#fafafa',
  foreground: '#18181b',
  muted: '#f4f4f5',
  border: '#e4e4e7',
  surface1: '#fafafa',
  surface2: '#ffffff',
  surface3: '#f4f4f5',
  ring: '#f59e0b',
  fontFamily: 'Outfit',
}

// ============================================================
// deriveShadows
// ============================================================

describe('deriveShadows', () => {
  it('functional+dashboard → borders-only', () => {
    const result = deriveShadows('functional', 'dashboard', MOCK_PALETTE)
    expect(result?.strategy).toBe('borders-only')
    expect(result?.values).toEqual({})
  })

  it('functional+saas → borders-only', () => {
    const result = deriveShadows('functional', 'saas', MOCK_PALETTE)
    expect(result?.strategy).toBe('borders-only')
  })

  it('functional+tool → borders-only', () => {
    const result = deriveShadows('functional', 'tool', MOCK_PALETTE)
    expect(result?.strategy).toBe('borders-only')
  })

  it('functional+other → subtle-shadows with sm+md', () => {
    const result = deriveShadows('functional', 'restaurant', MOCK_PALETTE)
    expect(result?.strategy).toBe('subtle-shadows')
    expect(result?.values.sm).toBeTruthy()
    expect(result?.values.md).toBeTruthy()
    expect(result?.values.lg).toBeUndefined()
  })

  it('creative+event → layered-shadows with glow', () => {
    const result = deriveShadows('creative', 'event', MOCK_PALETTE)
    expect(result?.strategy).toBe('layered-shadows')
    expect(result?.values.sm).toBeTruthy()
    expect(result?.values.md).toBeTruthy()
    expect(result?.values.lg).toBeTruthy()
    expect(result?.values.glow).toBeTruthy()
  })

  it('creative+landing → layered-shadows with glow', () => {
    const result = deriveShadows('creative', 'landing', MOCK_PALETTE)
    expect(result?.strategy).toBe('layered-shadows')
    expect(result?.values.glow).toBeTruthy()
  })

  it('creative+portfolio → subtle-shadows with glow', () => {
    const result = deriveShadows('creative', 'portfolio', MOCK_PALETTE)
    expect(result?.strategy).toBe('subtle-shadows')
    expect(result?.values.glow).toBeTruthy()
  })
})

// ============================================================
// deriveDepth
// ============================================================

describe('deriveDepth', () => {
  it('functional+dashboard → flat strategy', () => {
    const result = deriveDepth('functional', 'dashboard')
    expect(result?.strategy).toBe('flat')
    expect(result?.cardStyle).toContain('bg-surface-2')
  })

  it('functional+tool → flat strategy', () => {
    const result = deriveDepth('functional', 'tool')
    expect(result?.strategy).toBe('flat')
  })

  it('functional+saas → subtle strategy', () => {
    const result = deriveDepth('functional', 'saas')
    expect(result?.strategy).toBe('subtle')
    expect(result?.cardStyle).toContain('border')
  })

  it('functional+other → subtle strategy', () => {
    const result = deriveDepth('functional', 'restaurant')
    expect(result?.strategy).toBe('subtle')
  })

  it('creative+portfolio → elevated with hover:shadow-lg', () => {
    const result = deriveDepth('creative', 'portfolio')
    expect(result?.strategy).toBe('elevated')
    expect(result?.cardStyle).toContain('hover:shadow-lg')
  })

  it('creative+event → elevated with shadow-lg', () => {
    const result = deriveDepth('creative', 'event')
    expect(result?.strategy).toBe('elevated')
    expect(result?.cardStyle).toContain('shadow-lg')
  })

  it('creative+other → subtle', () => {
    const result = deriveDepth('creative', 'blog')
    expect(result?.strategy).toBe('subtle')
  })
})

// ============================================================
// deriveAnimationPersonality
// ============================================================

describe('deriveAnimationPersonality', () => {
  it('functional+dashboard → minimal', () => {
    expect(deriveAnimationPersonality('functional', 'dashboard')).toBe('minimal')
  })

  it('functional+tool → minimal', () => {
    expect(deriveAnimationPersonality('functional', 'tool')).toBe('minimal')
  })

  it('functional+admin → minimal', () => {
    expect(deriveAnimationPersonality('functional', 'admin')).toBe('minimal')
  })

  it('functional+other → smooth', () => {
    expect(deriveAnimationPersonality('functional', 'saas')).toBe('smooth')
  })

  it('creative+portfolio → dramatic', () => {
    expect(deriveAnimationPersonality('creative', 'portfolio')).toBe('dramatic')
  })

  it('creative+photography → dramatic', () => {
    expect(deriveAnimationPersonality('creative', 'photography')).toBe('dramatic')
  })

  it('creative+event → bouncy', () => {
    expect(deriveAnimationPersonality('creative', 'event')).toBe('bouncy')
  })

  it('creative+music → bouncy', () => {
    expect(deriveAnimationPersonality('creative', 'music')).toBe('bouncy')
  })

  it('creative+other → smooth', () => {
    expect(deriveAnimationPersonality('creative', 'landing')).toBe('smooth')
  })
})

// ============================================================
// deriveLayoutArchetype
// ============================================================

describe('deriveLayoutArchetype', () => {
  it('functional+dashboard → dashboard', () => {
    expect(deriveLayoutArchetype('functional', 'dashboard')).toBe('dashboard')
  })

  it('functional+admin → dashboard', () => {
    expect(deriveLayoutArchetype('functional', 'admin')).toBe('dashboard')
  })

  it('functional+tool → dashboard', () => {
    expect(deriveLayoutArchetype('functional', 'tool')).toBe('dashboard')
  })

  it('functional+other → app-shell', () => {
    expect(deriveLayoutArchetype('functional', 'saas')).toBe('app-shell')
  })

  it('creative+portfolio → editorial', () => {
    expect(deriveLayoutArchetype('creative', 'portfolio')).toBe('editorial')
  })

  it('creative+photography → editorial', () => {
    expect(deriveLayoutArchetype('creative', 'photography')).toBe('editorial')
  })

  it('creative+landing → storytelling', () => {
    expect(deriveLayoutArchetype('creative', 'landing')).toBe('storytelling')
  })

  it('creative+agency → storytelling', () => {
    expect(deriveLayoutArchetype('creative', 'agency')).toBe('storytelling')
  })

  it('creative+event → storytelling', () => {
    expect(deriveLayoutArchetype('creative', 'event')).toBe('storytelling')
  })

  it('creative+other → bento', () => {
    expect(deriveLayoutArchetype('creative', 'restaurant')).toBe('bento')
  })
})

// ============================================================
// deriveGradients
// ============================================================

describe('deriveGradients', () => {
  it('functional → undefined', () => {
    expect(deriveGradients('functional', 'dashboard', MOCK_PALETTE)).toBeUndefined()
  })

  it('functional+any → undefined', () => {
    expect(deriveGradients('functional', 'saas', MOCK_PALETTE)).toBeUndefined()
  })

  it('creative → has primary+surface', () => {
    const result = deriveGradients('creative', 'portfolio', MOCK_PALETTE)
    expect(result).toBeDefined()
    expect(result?.primary).toContain('linear-gradient')
    expect(result?.surface).toContain('linear-gradient')
  })

  it('creative+landing → has primary+surface+accent', () => {
    const result = deriveGradients('creative', 'landing', MOCK_PALETTE)
    expect(result?.primary).toBeTruthy()
    expect(result?.surface).toBeTruthy()
    expect(result?.accent).toContain('radial-gradient')
  })

  it('creative+event → has accent gradient', () => {
    const result = deriveGradients('creative', 'event', MOCK_PALETTE)
    expect(result?.accent).toContain('radial-gradient')
  })

  it('creative+music → has accent gradient', () => {
    const result = deriveGradients('creative', 'music', MOCK_PALETTE)
    expect(result?.accent).toBeDefined()
  })

  it('creative+blog → no accent gradient', () => {
    const result = deriveGradients('creative', 'blog', MOCK_PALETTE)
    expect(result?.accent).toBeUndefined()
  })
})

// ============================================================
// buildDesignSystemPrompt 向後相容
// ============================================================

function makeMinimalDesignSystem(): DesignSystem {
  return {
    cssVariables: ':root { --color-primary: #6366f1; }',
    tailwindExtend: { colors: { primary: '#6366f1' } },
    typography: { fontFamily: 'DM Sans', scale: {} },
    colorPalette: {
      primary: '#6366f1',
      secondary: '#4f46e5',
      accent: '#f59e0b',
      background: '#fafafa',
      foreground: '#18181b',
      muted: '#f4f4f5',
      border: '#e4e4e7',
    },
    spacing: { unit: 4, scale: { sm: '0.5rem', md: '1rem' } },
    borderRadius: { none: '0', sm: '0.25rem', md: '0.5rem', lg: '0.75rem', full: '9999px' },
  }
}

describe('buildDesignSystemPrompt 向後相容', () => {
  it('舊版 DesignSystem（無新欄位）不崩潰', () => {
    const ds = makeMinimalDesignSystem()
    expect(() => buildDesignSystemPrompt(ds)).not.toThrow()
    const output = buildDesignSystemPrompt(ds)
    expect(output).toContain('Design System')
  })

  it('shadows=borders-only → 輸出包含「禁止使用 shadow-*」', () => {
    const ds: DesignSystem = {
      ...makeMinimalDesignSystem(),
      shadows: { strategy: 'borders-only', values: {} },
    }
    const output = buildDesignSystemPrompt(ds)
    expect(output).toContain('禁止使用 shadow-*')
  })

  it('depth.cardStyle 出現在輸出中', () => {
    const ds: DesignSystem = {
      ...makeMinimalDesignSystem(),
      depth: { strategy: 'flat', cardStyle: 'bg-surface-2 rounded-md border border-border' },
    }
    const output = buildDesignSystemPrompt(ds)
    expect(output).toContain('bg-surface-2 rounded-md border border-border')
  })

  it('gradients.primary 出現在輸出中', () => {
    const ds: DesignSystem = {
      ...makeMinimalDesignSystem(),
      gradients: { primary: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
    }
    const output = buildDesignSystemPrompt(ds)
    expect(output).toContain('linear-gradient(135deg, #6366f1, #4f46e5)')
  })

  it('無 shadows 欄位時輸出不包含陰影章節標題', () => {
    const ds = makeMinimalDesignSystem()
    const output = buildDesignSystemPrompt(ds)
    expect(output).not.toContain('陰影策略')
  })
})

// ============================================================
// synthesizeVariants 新欄位合併
// ============================================================

function makeVariant(
  id: 'A' | 'B' | 'C' | 'D' | 'E',
  axis: DesignVariant['axis'],
  dsOverrides: Partial<DesignSystem> = {}
): DesignVariant {
  return {
    id,
    name: `Variant ${id}`,
    axis,
    description: `Variant ${id} description`,
    designSystem: {
      ...makeMinimalDesignSystem(),
      ...dsOverrides,
    },
    previewDescription: 'preview',
    keyFeatures: ['feature1'],
  }
}

describe('synthesizeVariants 新欄位合併', () => {
  it('expressive axis → depth 合併到結果', () => {
    const baseVariant = makeVariant('A', 'hierarchy')
    const expressiveVariant = makeVariant('B', 'expressive', {
      depth: { strategy: 'elevated', cardStyle: 'bg-white shadow-md rounded-xl' },
      shadows: { strategy: 'layered-shadows', values: { sm: '0 1px 3px rgba(0,0,0,0.1)' } },
    })
    const result = synthesizeVariants(['A', 'B'], [baseVariant, expressiveVariant])
    expect(result.depth?.strategy).toBe('elevated')
    expect(result.shadows?.strategy).toBe('layered-shadows')
  })

  it('layout axis → layoutArchetype 合併到結果', () => {
    const baseVariant = makeVariant('A', 'hierarchy')
    const layoutVariant = makeVariant('B', 'layout', {
      layoutArchetype: 'editorial',
    })
    const result = synthesizeVariants(['A', 'B'], [baseVariant, layoutVariant])
    expect(result.layoutArchetype).toBe('editorial')
  })

  it('moodId 傳入 → result.mood 被設置（單選）', () => {
    const variant = makeVariant('A', 'hierarchy')
    const result = synthesizeVariants(['A'], [variant], 'glassmorphic-dark')
    expect(result.mood).toBe('glassmorphic-dark')
  })

  it('moodId 傳入 → result.mood 被設置（多選）', () => {
    const variantA = makeVariant('A', 'hierarchy')
    const variantB = makeVariant('B', 'density')
    const result = synthesizeVariants(['A', 'B'], [variantA, variantB], 'brutalist')
    expect(result.mood).toBe('brutalist')
  })

  it('無 moodId → result.mood 不被設置', () => {
    const variant = makeVariant('A', 'hierarchy')
    const result = synthesizeVariants(['A'], [variant])
    expect(result.mood).toBeUndefined()
  })
})

// ============================================================
// selectCompositionPatterns layoutArchetypeHint
// ============================================================

describe('selectCompositionPatterns layoutArchetypeHint', () => {
  it('dashboard archetype → data category patterns 優先排序', () => {
    const result = selectCompositionPatterns(
      'functional', 'dashboard', ['dashboard.tsx', 'settings.tsx'],
      undefined, 3, 'dashboard'
    )
    // 確保選出的 patterns 中至少有 data category
    const categories = result.map(p => p.category)
    expect(categories).toContain('data')
  })

  it('storytelling archetype → hero category patterns 優先排序', () => {
    const result = selectCompositionPatterns(
      'creative', 'landing', ['home.tsx'],
      undefined, 3, 'storytelling'
    )
    const categories = result.map(p => p.category)
    expect(categories).toContain('hero')
  })

  it('無 layoutArchetypeHint → 依正常邏輯選擇', () => {
    const withHint = selectCompositionPatterns(
      'creative', 'portfolio', ['home.tsx'],
      undefined, 2, 'editorial'
    )
    const withoutHint = selectCompositionPatterns(
      'creative', 'portfolio', ['home.tsx'],
      undefined, 2
    )
    // 兩者都應回傳 2 個 pattern（只測試不崩潰）
    expect(withHint.length).toBeGreaterThanOrEqual(1)
    expect(withoutHint.length).toBeGreaterThanOrEqual(1)
  })

  it('app-shell archetype → shell category patterns 加分', () => {
    const result = selectCompositionPatterns(
      'functional', 'saas', ['app.tsx', 'settings.tsx'],
      undefined, 3, 'app-shell'
    )
    expect(result.length).toBeGreaterThan(0)
    // shell patterns 應在結果中更可能出現
    const hasShell = result.some(p => p.category === 'shell')
    expect(hasShell).toBe(true)
  })
})

// ============================================================
// buildDefaultDesignSystem 整合測試
// ============================================================

describe('buildDefaultDesignSystem 整合', () => {
  it('dashboard → animationPersonality=minimal', () => {
    const ds = buildDefaultDesignSystem('functional', 'dashboard')
    expect(ds.animationPersonality).toBe('minimal')
  })

  it('creative+portfolio → layoutArchetype=editorial', () => {
    const ds = buildDefaultDesignSystem('creative', 'portfolio')
    expect(ds.layoutArchetype).toBe('editorial')
  })

  it('creative+event → gradients 存在且有 accent', () => {
    const ds = buildDefaultDesignSystem('creative', 'event')
    expect(ds.gradients?.accent).toBeTruthy()
  })

  it('functional → gradients=undefined', () => {
    const ds = buildDefaultDesignSystem('functional', 'dashboard')
    expect(ds.gradients).toBeUndefined()
  })

  it('無 productType → 不崩潰', () => {
    expect(() => buildDefaultDesignSystem('functional')).not.toThrow()
    expect(() => buildDefaultDesignSystem('creative')).not.toThrow()
  })
})
