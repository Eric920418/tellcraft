import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as db from '../db/client'
import {
  getDesignMemory,
  updateDesignMemory,
  formatMemoryForBriefPrompt,
  formatMemoryForVariantPrompt,
  extractPaletteFromDesignSystem,
  extractFontFamily,
  extractStyleKeywords,
  type DesignMemory,
} from '../services/design-memory'
import type { DesignSystem } from '../services/uiux-generation'

const mockRow = {
  user_id: 'u1',
  brand_tone: { keywords: ['minimal', 'professional'], avoid: ['purple'] },
  preferred_palettes: [
    { primary: '#1F2937', secondary: '#3B82F6', accent: '#10B981', background: '#FAFAFA', foreground: '#0F172A', capturedAt: 1700000000000 },
  ],
  preferred_moods: ['editorial-clean'],
  preferred_tiers: ['functional'],
  rejected_patterns: ['fullbleed-hero'],
  signature_keywords: ['analytics', 'realtime'],
  fonts_used: ['DM Sans'],
  sample_count: 2,
  updated_at: new Date('2024-01-01'),
}

const minimalDesignSystem: DesignSystem = {
  cssVariables: ':root {}',
  tailwindExtend: {},
  typography: { fontFamily: '"Inter", system-ui', scale: { base: '1rem' } },
  colorPalette: {
    primary: '#1F2937',
    secondary: '#3B82F6',
    accent: '#10B981',
    background: '#FAFAFA',
    foreground: '#0F172A',
    muted: '#94A3B8',
    border: '#E2E8F0',
  },
  spacing: { unit: 4, scale: { md: '1rem' } },
  borderRadius: { none: '0', sm: '0.25rem', md: '0.5rem', lg: '0.75rem', full: '9999px' },
}

describe('getDesignMemory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null when userId empty', async () => {
    expect(await getDesignMemory('')).toBeNull()
  })

  it('parses DB row into DesignMemory', async () => {
    vi.spyOn(db, 'queryOne').mockResolvedValueOnce(mockRow as never)
    const memory = await getDesignMemory('u1')
    expect(memory?.brandTone?.keywords).toContain('minimal')
    expect(memory?.preferredPalettes).toHaveLength(1)
    expect(memory?.preferredMoods).toEqual(['editorial-clean'])
    expect(memory?.sampleCount).toBe(2)
  })

  it('fail-open on DB error (returns null, never throws)', async () => {
    vi.spyOn(db, 'queryOne').mockRejectedValueOnce(new Error('connection lost'))
    await expect(getDesignMemory('u1')).resolves.toBeNull()
  })

  it('returns null when row not found', async () => {
    vi.spyOn(db, 'queryOne').mockResolvedValueOnce(null)
    expect(await getDesignMemory('u1')).toBeNull()
  })

  it('handles row with null array fields (empty default)', async () => {
    vi.spyOn(db, 'queryOne').mockResolvedValueOnce({
      ...mockRow,
      preferred_moods: null,
      preferred_tiers: null,
      rejected_patterns: null,
    } as never)
    const memory = await getDesignMemory('u1')
    expect(memory?.preferredMoods).toEqual([])
    expect(memory?.rejectedPatterns).toEqual([])
  })
})

describe('updateDesignMemory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does nothing when userId empty', async () => {
    const querySpy = vi.spyOn(db, 'query')
    await updateDesignMemory({ userId: '' })
    expect(querySpy).not.toHaveBeenCalled()
  })

  it('UPSERTs new row when no existing memory', async () => {
    vi.spyOn(db, 'queryOne').mockResolvedValueOnce(null)
    const querySpy = vi.spyOn(db, 'query').mockResolvedValueOnce({} as never)
    await updateDesignMemory({
      userId: 'u1',
      tier: 'creative',
      moodId: 'brutalist',
      incrementSample: true,
    })
    expect(querySpy).toHaveBeenCalledOnce()
    const params = querySpy.mock.calls[0][1] as unknown[]
    expect(params[0]).toBe('u1')
    expect(params[3]).toEqual(['brutalist'])  // moods
    expect(params[4]).toEqual(['creative'])   // tiers
    expect(params[8]).toBe(1)                  // sample_count
  })

  it('dedups arrays and keeps newest tail', async () => {
    vi.spyOn(db, 'queryOne').mockResolvedValueOnce({
      ...mockRow,
      preferred_moods: ['glassmorphic-dark', 'brutalist'],
    } as never)
    const querySpy = vi.spyOn(db, 'query').mockResolvedValueOnce({} as never)
    await updateDesignMemory({ userId: 'u1', moodId: 'brutalist' })
    const params = querySpy.mock.calls[0][1] as unknown[]
    // brutalist dedup → 移到尾部
    expect(params[3]).toEqual(['glassmorphic-dark', 'brutalist'])
  })

  it('caps preferred_palettes at 5 (FIFO)', async () => {
    const existing = Array.from({ length: 5 }, (_, i) => ({
      primary: `#00000${i}`,
      secondary: '#fff',
      accent: '#fff',
      background: '#fff',
      foreground: '#000',
      capturedAt: 1700000000000 + i,
    }))
    vi.spyOn(db, 'queryOne').mockResolvedValueOnce({
      ...mockRow,
      preferred_palettes: existing,
    } as never)
    const querySpy = vi.spyOn(db, 'query').mockResolvedValueOnce({} as never)
    await updateDesignMemory({
      userId: 'u1',
      palette: { primary: '#abcdef', secondary: '#fff', accent: '#fff', background: '#fff', foreground: '#000', capturedAt: Date.now() },
    })
    const params = querySpy.mock.calls[0][1] as unknown[]
    const palettes = JSON.parse(params[2] as string)
    expect(palettes).toHaveLength(5)
    // 最舊（index 0）被淘汰，最新的 #abcdef 在尾部
    expect(palettes[4].primary).toBe('#abcdef')
    expect(palettes[0].primary).toBe('#000001')
  })

  it('fire-and-forget: swallows DB error without throwing', async () => {
    vi.spyOn(db, 'queryOne').mockResolvedValueOnce(null)
    vi.spyOn(db, 'query').mockRejectedValueOnce(new Error('DB write failed'))
    await expect(updateDesignMemory({ userId: 'u1', tier: 'functional' })).resolves.toBeUndefined()
  })
})

describe('formatMemoryForBriefPrompt', () => {
  it('returns empty string for null memory', () => {
    expect(formatMemoryForBriefPrompt(null)).toBe('')
  })

  it('returns empty string when sampleCount < 1', () => {
    const m: DesignMemory = { ...mockRow, userId: 'u1', sampleCount: 0 } as unknown as DesignMemory
    expect(formatMemoryForBriefPrompt(m)).toBe('')
  })

  it('renders all fields when memory is rich', () => {
    const m: DesignMemory = {
      userId: 'u1',
      brandTone: { keywords: ['minimal', 'professional'], avoid: ['purple'] },
      preferredPalettes: [{ primary: '#abc', secondary: '#def', accent: '#fed', background: '#fff', foreground: '#000', capturedAt: 0 }],
      preferredMoods: ['editorial-clean'],
      preferredTiers: ['functional'],
      rejectedPatterns: ['fullbleed-hero'],
      signatureKeywords: ['analytics'],
      fontsUsed: ['DM Sans'],
      sampleCount: 3,
      updatedAt: new Date(),
    }
    const out = formatMemoryForBriefPrompt(m)
    expect(out).toContain('過往語彙')
    expect(out).toContain('已拒絕的 pattern')
    expect(out).toContain('過往字體')
    expect(out).toContain('已完成 3 個專案')
  })
})

describe('formatMemoryForVariantPrompt', () => {
  it('returns empty when no palettes', () => {
    const m: DesignMemory = { ...mockRow, userId: 'u1', preferredPalettes: [] } as unknown as DesignMemory
    expect(formatMemoryForVariantPrompt(m)).toBe('')
  })

  it('renders most-recent palette as family color hint', () => {
    const m: DesignMemory = {
      userId: 'u1',
      brandTone: null,
      preferredPalettes: [
        { primary: '#001', secondary: '#002', accent: '#003', background: '#fff', foreground: '#000', capturedAt: 1 },
        { primary: '#abc', secondary: '#def', accent: '#fed', background: '#fff', foreground: '#000', capturedAt: 2 },
      ],
      preferredMoods: [], preferredTiers: [], rejectedPatterns: [],
      signatureKeywords: [], fontsUsed: [], sampleCount: 2,
      updatedAt: new Date(),
    }
    const out = formatMemoryForVariantPrompt(m)
    expect(out).toContain('#abc')  // 最新的
    expect(out).not.toContain('#001')  // 不是最新
    expect(out).toContain('家族色板提示')
  })
})

describe('extractPaletteFromDesignSystem', () => {
  it('captures primary/secondary/accent/bg/fg + timestamp', () => {
    const palette = extractPaletteFromDesignSystem(minimalDesignSystem)
    expect(palette.primary).toBe('#1F2937')
    expect(palette.secondary).toBe('#3B82F6')
    expect(palette.accent).toBe('#10B981')
    expect(palette.capturedAt).toBeGreaterThan(0)
  })
})

describe('extractFontFamily', () => {
  it('returns first font name stripped of quotes', () => {
    expect(extractFontFamily(minimalDesignSystem)).toBe('Inter')
  })

  it('returns null when no fontFamily', () => {
    const ds = { ...minimalDesignSystem, typography: { fontFamily: '', scale: {} } }
    expect(extractFontFamily(ds)).toBeNull()
  })

  it('handles single name without comma', () => {
    const ds = { ...minimalDesignSystem, typography: { fontFamily: 'DM Sans', scale: {} } }
    expect(extractFontFamily(ds)).toBe('DM Sans')
  })
})

// ============================================================
// Fix #6: extractStyleKeywords — 防止 styleSummary 整段污染 prompt cache
// ============================================================

describe('extractStyleKeywords', () => {
  it('空字串 / null / undefined → 回 []', () => {
    expect(extractStyleKeywords('')).toEqual([])
    expect(extractStyleKeywords('   ')).toEqual([])
    expect(extractStyleKeywords(null)).toEqual([])
    expect(extractStyleKeywords(undefined)).toEqual([])
  })

  it('中文標點切分：「現代簡約，溫暖溫馨，有溫度」→ ≤3 個短詞', () => {
    const out = extractStyleKeywords('現代簡約，溫暖溫馨，有溫度')
    expect(out).toContain('現代簡約')
    expect(out).toContain('溫暖溫馨')
    expect(out.length).toBeLessThanOrEqual(3)
    // 沒有整段塞入
    expect(out.some(k => k.includes('，'))).toBe(false)
  })

  it('英文 with/and 連接詞切分', () => {
    const out = extractStyleKeywords('modern with warm tones and minimal elegance')
    expect(out).toContain('modern')
    expect(out.length).toBeGreaterThan(0)
    expect(out.length).toBeLessThanOrEqual(3)
  })

  it('過濾長度 > 12 字的 token（避免假抽詞效果）', () => {
    const longText = 'thisisaveryveryverylongkeyword another short'
    const out = extractStyleKeywords(longText)
    // 'thisisaveryveryverylongkeyword' (30 字) 應被過濾
    expect(out.every(k => k.length <= 12)).toBe(true)
    expect(out).toContain('another')
  })

  it('過濾長度 < 2 字（中文單字易誤觸）', () => {
    const out = extractStyleKeywords('現代 簡約 a 溫暖')
    expect(out).not.toContain('a')
    expect(out).toContain('現代')
  })

  it('dedupe（保留首次順序）', () => {
    const out = extractStyleKeywords('現代 簡約 現代 簡約 溫暖')
    expect(out).toEqual(['現代', '簡約', '溫暖'])
  })

  it('上限 3 個（即使原文有更多）', () => {
    const out = extractStyleKeywords('a1 a2 a3 a4 a5 a6 a7')
    expect(out.length).toBe(3)
  })

  it('純標點/數字 token 過濾', () => {
    const out = extractStyleKeywords('現代, 123, 簡約')
    expect(out).not.toContain('123')
    expect(out).toContain('現代')
  })

  it('中英混合：「現代 modern minimal 簡約」', () => {
    const out = extractStyleKeywords('現代 modern minimal 簡約')
    expect(out).toContain('現代')
    expect(out).toContain('modern')
    expect(out.length).toBe(3)
  })

  // 關鍵測試：複製真實 styleSummary 場景
  it('真實 brief styleSummary 場景：1-2 句長文 → 抽 3 個短詞', () => {
    const realLike = '我們想做一個現代簡約的設計，主打溫暖、人性化的品牌感，避免過於冷硬的科技風。'
    const out = extractStyleKeywords(realLike)
    expect(out.length).toBeGreaterThan(0)
    expect(out.length).toBeLessThanOrEqual(3)
    // 確認沒有整段塞入（最大長度 12 字）
    expect(out.every(k => k.length <= 12)).toBe(true)
  })
})
