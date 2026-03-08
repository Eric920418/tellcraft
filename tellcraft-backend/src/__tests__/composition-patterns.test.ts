import { describe, it, expect } from 'vitest'
import {
  COMPOSITION_PATTERNS,
  selectCompositionPatterns,
  formatPatternsForPrompt,
  listPatternsForVariants,
} from '../services/composition-patterns'

// ============================================================
// Pattern 定義完整性
// ============================================================

describe('COMPOSITION_PATTERNS 定義完整性', () => {
  it('應有 20 個 pattern', () => {
    expect(Object.keys(COMPOSITION_PATTERNS).length).toBe(20)
  })

  it('每個 pattern 必要欄位完整', () => {
    for (const [id, p] of Object.entries(COMPOSITION_PATTERNS)) {
      expect(p.id).toBe(id)
      expect(p.name).toBeTruthy()
      expect(['hero', 'content', 'data', 'shell']).toContain(p.category)
      expect(['both', 'creative', 'functional']).toContain(p.tier)
      expect(p.description.length).toBeGreaterThan(5)
      expect(p.applicableScenes.length).toBeGreaterThan(0)
      expect(p.tailwindHint.length).toBeGreaterThan(10)
    }
  })
})

// ============================================================
// selectCompositionPatterns — tier 過濾
// ============================================================

describe('selectCompositionPatterns tier 過濾', () => {
  it('functional tier 不選 creative-only patterns', () => {
    const result = selectCompositionPatterns('functional', 'dashboard', ['home'], undefined, 3)
    for (const p of result) {
      expect(p.tier).not.toBe('creative')
    }
  })

  it('creative tier 不選 functional-only patterns', () => {
    const result = selectCompositionPatterns('creative', 'landing', ['home'], undefined, 3)
    for (const p of result) {
      expect(p.tier).not.toBe('functional')
    }
  })

  it('both-tier patterns 在任何 tier 都可選', () => {
    const bothPatterns = Object.values(COMPOSITION_PATTERNS).filter(p => p.tier === 'both')
    expect(bothPatterns.length).toBeGreaterThan(0)

    // 多次嘗試以覆蓋隨機性
    let functionalHasBoth = false
    let creativeHasBoth = false
    for (let i = 0; i < 20; i++) {
      const fr = selectCompositionPatterns('functional', 'landing', ['home'], undefined, 3)
      if (fr.some(p => p.tier === 'both')) functionalHasBoth = true
      const cr = selectCompositionPatterns('creative', 'landing', ['home'], undefined, 3)
      if (cr.some(p => p.tier === 'both')) creativeHasBoth = true
    }
    expect(functionalHasBoth).toBe(true)
    expect(creativeHasBoth).toBe(true)
  })

  it('functional tier 能選到 data 類 pattern', () => {
    let found = false
    for (let i = 0; i < 20; i++) {
      const result = selectCompositionPatterns('functional', 'dashboard', ['dashboard'], undefined, 3)
      if (result.some(p => p.category === 'data')) {
        found = true
        break
      }
    }
    expect(found).toBe(true)
  })
})

// ============================================================
// selectCompositionPatterns — needsHero 保底
// ============================================================

describe('selectCompositionPatterns needsHero 保底', () => {
  it('pages 含 home → 必有 hero pattern', () => {
    for (let i = 0; i < 10; i++) {
      const result = selectCompositionPatterns('creative', 'landing', ['home', 'about'], undefined, 2)
      expect(result.some(p => p.category === 'hero')).toBe(true)
    }
  })

  it('pages 含 landing → 必有 hero pattern', () => {
    for (let i = 0; i < 10; i++) {
      const result = selectCompositionPatterns('creative', 'landing', ['landing-page'], undefined, 2)
      expect(result.some(p => p.category === 'hero')).toBe(true)
    }
  })

  it('只有 2 個 pages → 也觸發 hero 保底', () => {
    for (let i = 0; i < 10; i++) {
      const result = selectCompositionPatterns('creative', 'portfolio', ['layout.tsx', 'page.tsx'], undefined, 2)
      expect(result.some(p => p.category === 'hero')).toBe(true)
    }
  })
})

// ============================================================
// selectCompositionPatterns — needsData 保底
// ============================================================

describe('selectCompositionPatterns needsData 保底', () => {
  it('pages 含 dashboard → 必有 data pattern', () => {
    for (let i = 0; i < 10; i++) {
      const result = selectCompositionPatterns('functional', 'dashboard', ['dashboard', 'settings'], undefined, 2)
      expect(result.some(p => p.category === 'data')).toBe(true)
    }
  })

  it('pages 含 admin → 必有 data pattern', () => {
    for (let i = 0; i < 10; i++) {
      const result = selectCompositionPatterns('functional', 'saas', ['admin-panel', 'users'], undefined, 2)
      expect(result.some(p => p.category === 'data')).toBe(true)
    }
  })

  it('pages 含 analytics → 必有 data pattern', () => {
    for (let i = 0; i < 10; i++) {
      const result = selectCompositionPatterns('functional', 'saas', ['analytics'], undefined, 2)
      expect(result.some(p => p.category === 'data')).toBe(true)
    }
  })
})

// ============================================================
// selectCompositionPatterns — mood 親和加分
// ============================================================

describe('selectCompositionPatterns mood 親和加分', () => {
  it('glassmorphic-dark mood → 偏好 fullbleed-hero / floating-nav / dashboard-bento', () => {
    let hitCount = 0
    const affinityIds = ['fullbleed-hero', 'floating-nav', 'dashboard-bento']
    for (let i = 0; i < 30; i++) {
      const result = selectCompositionPatterns('creative', 'landing', ['home'], 'glassmorphic-dark', 3)
      if (result.some(p => affinityIds.includes(p.id))) hitCount++
    }
    // 應該大多數情況下命中親和 pattern
    expect(hitCount).toBeGreaterThan(15)
  })

  it('tech-dark mood → 偏好 command-palette-nav / sidebar-canvas / data-dense-table', () => {
    let hitCount = 0
    const affinityIds = ['command-palette-nav', 'sidebar-canvas', 'data-dense-table']
    for (let i = 0; i < 30; i++) {
      const result = selectCompositionPatterns('functional', 'dashboard', ['dashboard'], 'tech-dark', 3)
      if (result.some(p => affinityIds.includes(p.id))) hitCount++
    }
    expect(hitCount).toBeGreaterThan(15)
  })

  it('無 mood → 不影響選擇（不報錯）', () => {
    const result = selectCompositionPatterns('creative', 'landing', ['home'], undefined, 2)
    expect(result.length).toBeLessThanOrEqual(2)
  })
})

// ============================================================
// selectCompositionPatterns — 互斥檢查
// ============================================================

describe('selectCompositionPatterns 互斥檢查', () => {
  it('不會同時選中互斥的 hero patterns', () => {
    for (let i = 0; i < 30; i++) {
      const result = selectCompositionPatterns('creative', 'landing', ['home'], undefined, 3)
      const heroPatterns = result.filter(p => p.category === 'hero')
      // Hero patterns 互斥，最多只有 1 個
      expect(heroPatterns.length).toBeLessThanOrEqual(1)
    }
  })

  it('不會同時選中 floating-nav 和 sidebar-canvas', () => {
    for (let i = 0; i < 30; i++) {
      const result = selectCompositionPatterns('creative', 'landing', ['home', 'dashboard'], undefined, 3)
      const hasFloating = result.some(p => p.id === 'floating-nav')
      const hasSidebar = result.some(p => p.id === 'sidebar-canvas')
      expect(hasFloating && hasSidebar).toBe(false)
    }
  })
})

// ============================================================
// selectCompositionPatterns — 數量限制
// ============================================================

describe('selectCompositionPatterns 數量限制', () => {
  it('預設 count=2，最多回傳 2 個', () => {
    const result = selectCompositionPatterns('creative', 'landing', ['home'])
    expect(result.length).toBeLessThanOrEqual(2)
  })

  it('count=3 時最多回傳 3 個', () => {
    const result = selectCompositionPatterns('creative', 'landing', ['home', 'about', 'contact'], undefined, 3)
    expect(result.length).toBeLessThanOrEqual(3)
  })

  it('count 超過 3 時仍只回傳最多 3 個', () => {
    const result = selectCompositionPatterns('creative', 'landing', ['home'], undefined, 10)
    expect(result.length).toBeLessThanOrEqual(3)
  })
})

// ============================================================
// formatPatternsForPrompt
// ============================================================

describe('formatPatternsForPrompt', () => {
  it('空陣列 → 空字串', () => {
    expect(formatPatternsForPrompt([])).toBe('')
  })

  it('包含標題「頁面組合模式」', () => {
    const patterns = selectCompositionPatterns('creative', 'landing', ['home'], undefined, 2)
    const result = formatPatternsForPrompt(patterns)
    expect(result).toContain('頁面組合模式')
  })

  it('包含每個 pattern 的 name 和 tailwindHint', () => {
    const patterns = [COMPOSITION_PATTERNS['split-hero']]
    const result = formatPatternsForPrompt(patterns)
    expect(result).toContain('Split Hero')
    expect(result).toContain('grid grid-cols-[3fr_2fr]')
  })
})

// ============================================================
// listPatternsForVariants
// ============================================================

describe('listPatternsForVariants', () => {
  it('functional tier → 不含 creative-only patterns', () => {
    const result = listPatternsForVariants('functional')
    expect(result).not.toContain('Fullbleed Hero')
    expect(result).not.toContain('Animated Text Hero')
    expect(result).not.toContain('Masonry Grid')
  })

  it('creative tier → 不含 functional-only patterns', () => {
    const result = listPatternsForVariants('creative')
    expect(result).not.toContain('Dashboard Bento')
    expect(result).not.toContain('Command Palette Nav')
    expect(result).not.toContain('Kanban Board')
  })

  it('包含標題「可用的組合模式」', () => {
    const result = listPatternsForVariants('creative')
    expect(result).toContain('可用的組合模式')
  })
})
