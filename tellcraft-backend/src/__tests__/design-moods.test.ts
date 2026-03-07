import { describe, it, expect } from 'vitest'
import {
  DESIGN_MOODS,
  recommendMoods,
  getMoodPromptBlock,
  getMoodAnimationHint,
  getMoodRwdHint,
  getMoodSummary,
  listAvailableMoods,
} from '../services/design-moods'

// ============================================================
// recommendMoods — 中文關鍵詞匹配
// ============================================================

describe('recommendMoods 中文關鍵詞', () => {
  it('「高端極簡」→ 推薦 luxury-minimal', () => {
    const result = recommendMoods('高端極簡', '', 'creative')
    expect(result).toContain('luxury-minimal')
  })

  it('「溫暖自然有機」→ 推薦 organic-warm', () => {
    const result = recommendMoods('溫暖自然有機', '', 'creative')
    expect(result).toContain('organic-warm')
  })

  it('「暗色科技終端」→ 推薦 tech-dark', () => {
    const result = recommendMoods('暗色科技終端', '', 'creative')
    expect(result).toContain('tech-dark')
  })

  it('「玻璃霓虹未來」→ 推薦 glassmorphic-dark', () => {
    const result = recommendMoods('玻璃霓虹未來', '', 'creative')
    expect(result).toContain('glassmorphic-dark')
  })

  it('「粗獷工業前衛」→ 推薦 brutalist', () => {
    const result = recommendMoods('粗獷工業前衛', '', 'creative')
    expect(result).toContain('brutalist')
  })

  it('「雜誌社論排版」→ 推薦 editorial-clean', () => {
    const result = recommendMoods('雜誌社論排版', '', 'creative')
    expect(result).toContain('editorial-clean')
  })

  it('「活潑可愛繽紛」→ 推薦 playful-pop', () => {
    const result = recommendMoods('活潑可愛繽紛', '', 'creative')
    expect(result).toContain('playful-pop')
  })

  it('「商務專業系統」→ 推薦 neo-corporate', () => {
    const result = recommendMoods('商務專業系統', '', 'functional')
    expect(result).toContain('neo-corporate')
  })

  it('「文青極簡留白」→ 推薦 editorial-clean', () => {
    const result = recommendMoods('文青極簡留白', '', 'creative')
    expect(result).toContain('editorial-clean')
  })

  it('「賽博朋克」→ 推薦 glassmorphic-dark', () => {
    const result = recommendMoods('賽博朋克', '', 'creative')
    // 賽博 matches glassmorphic-dark
    expect(result).toContain('glassmorphic-dark')
  })
})

// ============================================================
// recommendMoods — 英文關鍵詞匹配
// ============================================================

describe('recommendMoods 英文關鍵詞', () => {
  it('"luxury minimal" → luxury-minimal', () => {
    const result = recommendMoods('luxury minimal', '', 'creative')
    expect(result).toContain('luxury-minimal')
  })

  it('"dark terminal code" → tech-dark', () => {
    const result = recommendMoods('dark terminal code', '', 'creative')
    expect(result).toContain('tech-dark')
  })

  it('"playful fun colorful" → playful-pop', () => {
    const result = recommendMoods('playful fun colorful', '', 'creative')
    expect(result).toContain('playful-pop')
  })

  it('"brutalist raw punk" → brutalist', () => {
    const result = recommendMoods('brutalist raw punk', '', 'creative')
    expect(result).toContain('brutalist')
  })

  it('"editorial magazine clean" → editorial-clean', () => {
    const result = recommendMoods('editorial magazine clean', '', 'creative')
    expect(result).toContain('editorial-clean')
  })
})

// ============================================================
// recommendMoods — 產品類型親和
// ============================================================

describe('recommendMoods 產品類型親和', () => {
  it('productType=restaurant → organic-warm 有分數', () => {
    const result = recommendMoods('', 'restaurant', 'creative')
    expect(result).toContain('organic-warm')
  })

  it('productType=developer → tech-dark 有分數', () => {
    const result = recommendMoods('', 'developer', 'creative')
    expect(result).toContain('tech-dark')
  })

  it('productType=dashboard + functional → neo-corporate', () => {
    const result = recommendMoods('', 'dashboard', 'functional')
    expect(result).toContain('neo-corporate')
  })

  it('productType=blog → editorial-clean 有分數', () => {
    const result = recommendMoods('', 'blog', 'creative')
    expect(result).toContain('editorial-clean')
  })

  it('productType=education → playful-pop 有分數', () => {
    const result = recommendMoods('', 'education', 'creative')
    expect(result).toContain('playful-pop')
  })

  it('productType=salon → organic-warm 或 luxury-minimal', () => {
    const result = recommendMoods('', 'salon', 'creative')
    expect(result.some(id => id === 'organic-warm' || id === 'luxury-minimal')).toBe(true)
  })

  it('productType=agency → glassmorphic-dark 或 brutalist 或 editorial-clean', () => {
    const result = recommendMoods('', 'agency', 'creative')
    expect(result.some(id =>
      id === 'glassmorphic-dark' || id === 'brutalist' || id === 'editorial-clean'
    )).toBe(true)
  })

  it('feeling + productType 組合提高分數', () => {
    const withFeeling = recommendMoods('溫暖', 'restaurant', 'creative')
    const withoutFeeling = recommendMoods('', 'restaurant', 'creative')
    // 有 feeling 時 organic-warm 排名應更靠前或分數更高
    expect(withFeeling[0]).toBe('organic-warm')
    // productType only 也應該有它
    expect(withoutFeeling).toContain('organic-warm')
  })
})

// ============================================================
// recommendMoods — Tier 過濾
// ============================================================

describe('recommendMoods Tier 過濾', () => {
  it('functional tier 不推薦 glassmorphic-dark', () => {
    const result = recommendMoods('玻璃暗色', '', 'functional')
    expect(result).not.toContain('glassmorphic-dark')
  })

  it('functional tier 不推薦 brutalist', () => {
    const result = recommendMoods('粗獷工業', '', 'functional')
    expect(result).not.toContain('brutalist')
  })

  it('functional tier 不推薦 playful-pop', () => {
    const result = recommendMoods('活潑可愛', '', 'functional')
    expect(result).not.toContain('playful-pop')
  })

  it('functional tier 可以推薦 organic-warm（both 類型）', () => {
    const result = recommendMoods('溫暖自然', '', 'functional')
    expect(result).toContain('organic-warm')
  })

  it('functional tier 可以推薦 neo-corporate', () => {
    const result = recommendMoods('商務專業', '', 'functional')
    expect(result).toContain('neo-corporate')
  })
})

// ============================================================
// recommendMoods — 無匹配
// ============================================================

describe('recommendMoods 無匹配', () => {
  it('完全無關的關鍵詞 → 空陣列', () => {
    const result = recommendMoods('吃飯睡覺打豆豆', '', 'creative')
    expect(result).toEqual([])
  })

  it('空字串 + 無 productType → 空陣列', () => {
    const result = recommendMoods('', '', 'creative')
    expect(result).toEqual([])
  })
})

// ============================================================
// getMoodPromptBlock
// ============================================================

describe('getMoodPromptBlock', () => {
  it.each(Object.keys(DESIGN_MOODS))('每個 mood ID 都有非空 promptBlock: %s', (id) => {
    const block = getMoodPromptBlock(id)
    expect(block).toBeTruthy()
    expect(block.length).toBeGreaterThan(100)
  })

  it('無效 ID 回空字串', () => {
    expect(getMoodPromptBlock('nonexistent')).toBe('')
  })
})

// ============================================================
// getMoodAnimationHint / getMoodRwdHint
// ============================================================

describe('getMoodAnimationHint', () => {
  it.each(Object.keys(DESIGN_MOODS))('每個 mood 有非空 animationHint: %s', (id) => {
    const hint = getMoodAnimationHint(id)
    expect(hint).toBeTruthy()
    expect(hint.length).toBeGreaterThan(30)
  })
})

describe('getMoodRwdHint', () => {
  it.each(Object.keys(DESIGN_MOODS))('每個 mood 有非空 rwdHint: %s', (id) => {
    const hint = getMoodRwdHint(id)
    expect(hint).toBeTruthy()
    expect(hint.length).toBeGreaterThan(20)
  })
})

// ============================================================
// getMoodSummary
// ============================================================

describe('getMoodSummary', () => {
  it('有效 ID 回傳格式正確的摘要', () => {
    const summary = getMoodSummary('editorial-clean')
    expect(summary).toContain('社論美學')
    expect(summary).toContain('Editorial Clean')
  })

  it('無效 ID 回空字串', () => {
    expect(getMoodSummary('nonexistent')).toBe('')
  })
})

// ============================================================
// listAvailableMoods
// ============================================================

describe('listAvailableMoods', () => {
  it('無 tier 過濾回傳所有 8 個', () => {
    const moods = listAvailableMoods()
    expect(moods).toHaveLength(8)
  })

  it('functional tier 過濾', () => {
    const moods = listAvailableMoods('functional')
    // functional: neo-corporate, organic-warm, editorial-clean, tech-dark (4 個)
    expect(moods.length).toBeGreaterThanOrEqual(4)
    expect(moods.every(m => {
      const full = DESIGN_MOODS[m.id]
      return full.compatibleTiers.includes('functional')
    })).toBe(true)
  })

  it('creative tier 過濾', () => {
    const moods = listAvailableMoods('creative')
    // creative: 全部 8 個都相容 creative（6 個 creative-only + 2 個 both）
    expect(moods.length).toBeGreaterThanOrEqual(7)
    expect(moods.every(m => {
      const full = DESIGN_MOODS[m.id]
      return full.compatibleTiers.includes('creative')
    })).toBe(true)
  })
})

// ============================================================
// recommendMoods 回傳最多 3 個
// ============================================================

describe('recommendMoods 回傳限制', () => {
  it('最多回傳 3 個 mood', () => {
    // 大量關鍵詞匹配多個 mood
    const result = recommendMoods('科技暗色玻璃霓虹粗獷活潑溫暖高端', '', 'creative')
    expect(result.length).toBeLessThanOrEqual(3)
  })
})
