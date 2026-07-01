import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// 必須在 import 被測模組前 mock env + cache + LLM
vi.mock('../lib/env', () => ({
  getEnv: vi.fn(),
}))
vi.mock('../lib/cache', () => ({
  cached: vi.fn(async (_key: string, _ttl: number, fn: () => Promise<any>) => fn()),
  invalidateCache: vi.fn(async () => {}),
}))
vi.mock('../lib/anthropic', () => ({
  MODEL: { HAIKU: 'claude-haiku-4-5-20251001', SONNET: 'claude-sonnet-5' },
}))
vi.mock('../lib/structured-output', () => ({
  callStructured: vi.fn(),
}))

import * as envModule from '../lib/env'
import * as cacheModule from '../lib/cache'
import * as structuredModule from '../lib/structured-output'
import {
  fetchImageLibrary,
  getImageLibraryOrFallback,
  buildPicsumFallbackLibrary,
  formatImageLibraryForPrompt,
  buildAttributionBlock,
  extractUsedUnsplashAssets,
  generateProjectQueries,
  invalidateImageLibrary,
  __internals,
  type QueryGenContext,
} from '../services/image-library-service'

// ============================================================
// helpers
// ============================================================

function mockEnv(overrides: Partial<ReturnType<typeof envModule.getEnv>> = {}) {
  ;(envModule.getEnv as any).mockReturnValue({
    UNSPLASH_ACCESS_KEY: 'test-key',
    ENABLE_UNSPLASH_LIBRARY: true,
    ENABLE_SMART_IMAGE_QUERIES: false,  // 預設關閉，避免多數測試誤觸 Haiku
    UNSPLASH_CACHE_TTL_SECONDS: 3600,
    UNSPLASH_API_TIMEOUT_MS: 5000,
    ...overrides,
  })
}

function makeUnsplashPhoto(id: string, username = 'alice') {
  return {
    id,
    urls: {
      raw: `https://images.unsplash.com/photo-${id}?ixlib=rb-4.0.3`,
      regular: `https://images.unsplash.com/photo-${id}?w=1080`,
      small: `https://images.unsplash.com/photo-${id}?w=400`,
    },
    alt_description: `description for ${id}`,
    description: null,
    width: 5000,
    height: 3333,
    user: {
      name: username === 'alice' ? 'Alice Wang' : 'Bob Chen',
      username,
      links: { html: `https://unsplash.com/@${username}` },
    },
    links: {
      html: `https://unsplash.com/photos/${id}`,
      download_location: `https://api.unsplash.com/photos/${id}/download`,
    },
  }
}

function mockFetchSuccess(photos: ReturnType<typeof makeUnsplashPhoto>[]) {
  global.fetch = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ total: photos.length, total_pages: 1, results: photos }),
  })) as any
}

function mockFetchUnique(perBatch = 12) {
  let counter = 0
  global.fetch = vi.fn(async () => {
    const photos = Array.from({ length: perBatch }, () => makeUnsplashPhoto(`uniq-${counter++}`))
    return {
      ok: true,
      status: 200,
      json: async () => ({ total: perBatch, total_pages: 1, results: photos }),
    }
  }) as any
}

function mockFetchStatus(status: number) {
  global.fetch = vi.fn(async () => ({
    ok: false,
    status,
    json: async () => ({}),
  })) as any
}

function mockHaikuSuccess(queries?: Partial<Record<string, string[]>>) {
  const defaults = {
    hero: ['izakaya counter night', 'yakitori grill smoke'],
    product: ['yakitori skewers', 'sake tasting'],
    team: ['izakaya chef portrait', 'japanese bartender'],
    background: ['dark wood japanese texture', 'paper lantern glow'],
    lifestyle: ['friends drinking sake', 'izakaya customers'],
    detail: ['chicken yakitori closeup', 'sake pour ceramic'],
    ...queries,
  }
  ;(structuredModule.callStructured as any).mockResolvedValue({
    success: true,
    data: defaults,
    usage: { inputTokens: 100, outputTokens: 50 },
  })
}

function mockHaikuFailure(error = 'Haiku API error') {
  ;(structuredModule.callStructured as any).mockResolvedValue({
    success: false,
    error,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockEnv()
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ============================================================
// fetchImageLibrary
// ============================================================

describe('fetchImageLibrary', () => {
  it('對已知 productType 呼叫多個 query 並合併去重', async () => {
    mockFetchUnique()
    const lib = await fetchImageLibrary('restaurant')

    expect(lib.productType).toBe('restaurant')
    expect(lib.source).toBe('unsplash')
    expect(lib.hero.length).toBeGreaterThan(0)
    expect(lib.hero.length).toBeLessThanOrEqual(__internals.CATEGORY_TARGET_COUNT.hero)
  })

  it('URL 自動加 w/h/fit/crop/q/auto 參數', async () => {
    mockFetchSuccess([makeUnsplashPhoto('xyz')])
    const lib = await fetchImageLibrary('restaurant')
    const firstUrl = lib.hero[0]?.url ?? ''

    expect(firstUrl).toContain('w=1280')
    expect(firstUrl).toContain('h=720')
    expect(firstUrl).toContain('fit=crop')
    expect(firstUrl).toContain('crop=entropy')
    expect(firstUrl).toContain('q=80')
    expect(firstUrl).toContain('auto=format')
  })

  it('photographer profileUrl 帶 utm_source=tellcraft&utm_medium=referral', async () => {
    mockFetchSuccess([makeUnsplashPhoto('abc', 'bob')])
    const lib = await fetchImageLibrary('restaurant')
    const asset = lib.hero[0]

    expect(asset.photographer.name).toBe('Bob Chen')
    expect(asset.photographer.profileUrl).toBe('https://unsplash.com/@bob?utm_source=tellcraft&utm_medium=referral')
  })

  it('未知 productType 走 DEFAULT_QUERIES', async () => {
    mockFetchSuccess([makeUnsplashPhoto('fallback-id')])
    const lib = await fetchImageLibrary('bogus-unknown-type')
    expect(lib.source).toBe('unsplash')
    expect(lib.hero.length).toBeGreaterThan(0)
  })

  it('無 UNSPLASH_ACCESS_KEY → throw', async () => {
    mockEnv({ UNSPLASH_ACCESS_KEY: undefined })
    await expect(fetchImageLibrary('restaurant')).rejects.toThrow(/UNSPLASH_ACCESS_KEY/)
  })

  it('ENABLE_UNSPLASH_LIBRARY=false → throw', async () => {
    mockEnv({ ENABLE_UNSPLASH_LIBRARY: false })
    await expect(fetchImageLibrary('restaurant')).rejects.toThrow(/ENABLE_UNSPLASH_LIBRARY/)
  })

  it('所有 query 都 fail → throw empty error', async () => {
    mockFetchStatus(500)
    await expect(fetchImageLibrary('restaurant')).rejects.toThrow(/empty/)
  })

  it('429 rate limit 時整批跳過但不 crash', async () => {
    mockFetchStatus(429)
    await expect(fetchImageLibrary('restaurant')).rejects.toThrow(/empty/)
  })

  it('forceRefresh=true 呼叫 invalidateCache（v2 key）', async () => {
    mockFetchSuccess([makeUnsplashPhoto('xyz')])
    await fetchImageLibrary('restaurant', { forceRefresh: true })
    expect(cacheModule.invalidateCache).toHaveBeenCalledWith('image-lib:v2:restaurant:en')
  })

  it('cacheKey 指定時 → cache key 用 cacheKey 而非 productType', async () => {
    mockFetchSuccess([makeUnsplashPhoto('xyz')])
    await fetchImageLibrary('restaurant', { forceRefresh: true, cacheKey: 'conv-123' })
    expect(cacheModule.invalidateCache).toHaveBeenCalledWith('image-lib:v2:conv-123:en')
  })

  it('queryContext + ENABLE_SMART_IMAGE_QUERIES=true → 走 Haiku 生專案 query', async () => {
    mockEnv({ ENABLE_SMART_IMAGE_QUERIES: true })
    mockFetchUnique()
    mockHaikuSuccess()

    const ctx: QueryGenContext = {
      productType: 'restaurant',
      primaryDescription: 'Japanese izakaya specializing in yakitori and sake',
    }
    await fetchImageLibrary('restaurant', { queryContext: ctx })

    expect(structuredModule.callStructured).toHaveBeenCalledOnce()
    const callArg = (structuredModule.callStructured as any).mock.calls[0][0]
    expect(callArg.model).toBe('claude-haiku-4-5-20251001')
    expect(callArg.purpose).toBe('image_query_generation')
  })

  it('queryContext 提供但 Haiku 失敗 → 降級靜態字典（仍成功）', async () => {
    mockEnv({ ENABLE_SMART_IMAGE_QUERIES: true })
    mockFetchUnique()
    mockHaikuFailure('timeout')

    const lib = await fetchImageLibrary('restaurant', {
      queryContext: { productType: 'restaurant', primaryDescription: 'X' },
    })
    expect(lib.source).toBe('unsplash')
    expect(lib.hero.length).toBeGreaterThan(0)
  })

  it('ENABLE_SMART_IMAGE_QUERIES=false → 不呼叫 Haiku，直接靜態字典', async () => {
    mockEnv({ ENABLE_SMART_IMAGE_QUERIES: false })
    mockFetchUnique()

    await fetchImageLibrary('restaurant', {
      queryContext: { productType: 'restaurant', primaryDescription: 'X' },
    })
    expect(structuredModule.callStructured).not.toHaveBeenCalled()
  })
})

// ============================================================
// generateProjectQueries
// ============================================================

describe('generateProjectQueries', () => {
  it('成功回傳 6 類 × 2-3 個英文 queries', async () => {
    mockEnv({ ENABLE_SMART_IMAGE_QUERIES: true })
    mockHaikuSuccess()

    const result = await generateProjectQueries({
      productType: 'restaurant',
      primaryDescription: 'Japanese izakaya',
    })

    expect(result.hero.length).toBeGreaterThanOrEqual(2)
    expect(result.product.length).toBeGreaterThanOrEqual(2)
    expect(result.hero[0]).toBe('izakaya counter night')
  })

  it('ENABLE_SMART_IMAGE_QUERIES=false → 立即 throw', async () => {
    mockEnv({ ENABLE_SMART_IMAGE_QUERIES: false })

    await expect(
      generateProjectQueries({ productType: 'restaurant', primaryDescription: 'x' }),
    ).rejects.toThrow(/ENABLE_SMART_IMAGE_QUERIES/)
    expect(structuredModule.callStructured).not.toHaveBeenCalled()
  })

  it('Haiku 失敗 → throw', async () => {
    mockEnv({ ENABLE_SMART_IMAGE_QUERIES: true })
    mockHaikuFailure('rate limit')

    await expect(
      generateProjectQueries({ productType: 'restaurant', primaryDescription: 'x' }),
    ).rejects.toThrow(/rate limit/)
  })

  it('referenceAnalysisSummary 會被 sanitize（newline 壓扁 + 截斷 300 字元）', async () => {
    mockEnv({ ENABLE_SMART_IMAGE_QUERIES: true })
    mockHaikuSuccess()

    const longText = 'line1\nline2\n\n\nline3' + 'x'.repeat(500)
    await generateProjectQueries({
      productType: 'cafe',
      primaryDescription: 'cafe test',
      referenceAnalysisSummary: longText,
    })

    const userContent = (structuredModule.callStructured as any).mock.calls[0][0].messages[0].content
    expect(userContent).not.toContain('\n\n\n')  // 多重 newline 清除
    // 被截到 300 字元
    const summaryLineMatch = userContent.match(/referenceAnalysisSummary: (.*)/)
    expect(summaryLineMatch[1].length).toBeLessThanOrEqual(300)
  })

  it('只帶必要欄位時不注入 optional lines', async () => {
    mockEnv({ ENABLE_SMART_IMAGE_QUERIES: true })
    mockHaikuSuccess()

    await generateProjectQueries({
      productType: 'saas',
      primaryDescription: 'team collaboration tool',
    })

    const userContent = (structuredModule.callStructured as any).mock.calls[0][0].messages[0].content
    expect(userContent).toContain('productType: saas')
    expect(userContent).toContain('primaryDescription: team collaboration tool')
    expect(userContent).not.toContain('variantConceptName')
    expect(userContent).not.toContain('referenceAnalysisSummary')
    expect(userContent).not.toContain('designMood')
  })
})

// ============================================================
// getImageLibraryOrFallback
// ============================================================

describe('getImageLibraryOrFallback', () => {
  it('無 API key → picsum fallback', async () => {
    mockEnv({ UNSPLASH_ACCESS_KEY: undefined })
    const lib = await getImageLibraryOrFallback('restaurant')
    expect(lib.source).toBe('picsum_fallback')
    expect(lib.hero.length).toBeGreaterThan(0)
    expect(lib.hero[0].url).toContain('picsum.photos')
  })

  it('ENABLE_UNSPLASH_LIBRARY=false → picsum fallback', async () => {
    mockEnv({ ENABLE_UNSPLASH_LIBRARY: false })
    const lib = await getImageLibraryOrFallback('restaurant')
    expect(lib.source).toBe('picsum_fallback')
  })

  it('Unsplash API 失敗 → picsum fallback 不 throw', async () => {
    mockFetchStatus(500)
    const lib = await getImageLibraryOrFallback('restaurant')
    expect(lib.source).toBe('picsum_fallback')
    expect(lib.hero.length).toBeGreaterThan(0)
  })

  it('Unsplash API 成功 → 返回 unsplash library', async () => {
    mockFetchSuccess([makeUnsplashPhoto('abc')])
    const lib = await getImageLibraryOrFallback('restaurant')
    expect(lib.source).toBe('unsplash')
  })

  it('帶 queryContext + Haiku 成功 → 用 Haiku queries 搜圖', async () => {
    mockEnv({ ENABLE_SMART_IMAGE_QUERIES: true })
    mockFetchUnique()
    mockHaikuSuccess()

    const lib = await getImageLibraryOrFallback('restaurant', {
      cacheKey: 'conv-abc',
      queryContext: { productType: 'restaurant', primaryDescription: 'Japanese izakaya' },
    })
    expect(lib.source).toBe('unsplash')
    expect(structuredModule.callStructured).toHaveBeenCalledOnce()
  })
})

// ============================================================
// invalidateImageLibrary
// ============================================================

describe('invalidateImageLibrary', () => {
  it('用 v2 key scheme + 傳入 scope 與 locale', async () => {
    await invalidateImageLibrary('conv-xyz', 'zh')
    expect(cacheModule.invalidateCache).toHaveBeenCalledWith('image-lib:v2:conv-xyz:zh')
  })

  it('locale 預設為 en', async () => {
    await invalidateImageLibrary('restaurant')
    expect(cacheModule.invalidateCache).toHaveBeenCalledWith('image-lib:v2:restaurant:en')
  })
})

// ============================================================
// buildPicsumFallbackLibrary
// ============================================================

describe('buildPicsumFallbackLibrary', () => {
  it('每類至少 2 張 picsum seed URL', () => {
    const lib = buildPicsumFallbackLibrary('restaurant')
    expect(lib.source).toBe('picsum_fallback')
    expect(lib.hero.length).toBeGreaterThanOrEqual(2)
    expect(lib.product.length).toBeGreaterThanOrEqual(2)
    expect(lib.team.length).toBeGreaterThanOrEqual(2)
    expect(lib.background.length).toBeGreaterThanOrEqual(2)
    expect(lib.lifestyle.length).toBeGreaterThanOrEqual(2)
    expect(lib.detail.length).toBeGreaterThanOrEqual(2)
    for (const asset of lib.hero) {
      expect(asset.url).toMatch(/picsum\.photos\/seed\//)
      expect(asset.sourceId).toMatch(/^picsum-/)
    }
  })
})

// ============================================================
// formatImageLibraryForPrompt
// ============================================================

describe('formatImageLibraryForPrompt', () => {
  it('輸出含六類標題 + URL + alt', async () => {
    mockFetchUnique()
    const lib = await fetchImageLibrary('restaurant')
    const text = formatImageLibraryForPrompt(lib)

    expect(text).toContain('圖片資源（白名單')
    expect(text).toContain('hero 類')
    expect(text).toContain('product 類')
    expect(text).toContain('team 類')
    expect(text).toContain('background 類')
    expect(text).toContain('lifestyle 類')
    expect(text).toContain('detail 類')
    expect(text).toContain('禁止')
    expect(text).toContain('使用規則')
    expect(text).toMatch(/images\.unsplash\.com\/photo-uniq-\d+/)
  })

  it('picsum fallback 時加入降級說明', () => {
    const lib = buildPicsumFallbackLibrary('restaurant')
    const text = formatImageLibraryForPrompt(lib)
    expect(text).toContain('picsum.photos')
    expect(text).toContain('當前降級')
  })

  it('maxPerCategory 限制每類輸出張數', () => {
    const lib = buildPicsumFallbackLibrary('restaurant')
    const text = formatImageLibraryForPrompt(lib, { maxPerCategory: 1 })
    const heroMatches = text.match(/1\. `https:\/\/picsum/g) ?? []
    expect(heroMatches.length).toBe(6)
  })

  it('同 seed → 同 shuffle 順序', () => {
    const lib = buildPicsumFallbackLibrary('restaurant')
    const a = formatImageLibraryForPrompt(lib, { projectSeed: 'project-1', maxPerCategory: 3 })
    const b = formatImageLibraryForPrompt(lib, { projectSeed: 'project-1', maxPerCategory: 3 })
    expect(a).toBe(b)
  })
})

// ============================================================
// extractUsedUnsplashAssets + buildAttributionBlock
// ============================================================

describe('extractUsedUnsplashAssets', () => {
  it('找出代碼中實際出現的 Unsplash asset（非 picsum）', async () => {
    mockFetchSuccess([makeUnsplashPhoto('USED', 'alice'), makeUnsplashPhoto('UNUSED', 'bob')])
    const lib = await fetchImageLibrary('restaurant')

    const code = `<img src="https://images.unsplash.com/photo-USED?w=1280&h=720" alt="x" />`
    const assets = extractUsedUnsplashAssets(code, lib)

    expect(assets.length).toBeGreaterThanOrEqual(1)
    expect(assets.every((a) => a.sourceId === 'USED')).toBe(true)
  })

  it('picsum fallback library → 回空陣列', () => {
    const lib = buildPicsumFallbackLibrary('restaurant')
    const code = `<img src="${lib.hero[0].url}" />`
    expect(extractUsedUnsplashAssets(code, lib)).toEqual([])
  })
})

describe('buildAttributionBlock', () => {
  it('無 Unsplash URL → 回 null', () => {
    const lib = buildPicsumFallbackLibrary('restaurant')
    const code = `<div>hello</div>`
    expect(buildAttributionBlock(code, lib)).toBeNull()
  })

  it('代碼含 Unsplash URL → 生成 ImageCredits 組件', async () => {
    mockFetchSuccess([makeUnsplashPhoto('ABC', 'alice'), makeUnsplashPhoto('DEF', 'bob')])
    const lib = await fetchImageLibrary('restaurant')

    const code = `<img src="https://images.unsplash.com/photo-ABC?..." /><img src="https://images.unsplash.com/photo-DEF?..." />`
    const block = buildAttributionBlock(code, lib)

    expect(block).not.toBeNull()
    expect(block!.file).toBe('components/ImageCredits.tsx')
    expect(block!.data).toContain('Alice Wang')
    expect(block!.data).toContain('Bob Chen')
    expect(block!.data).toContain('utm_source=tellcraft')
    expect(block!.data).toContain('utm_medium=referral')
    expect(block!.data).toContain('target="_blank"')
    expect(block!.data).toContain('rel="noopener noreferrer"')
    expect(block!.data).toContain('Unsplash')
  })

  it('只列代碼中實際出現的作者，不含未使用的', async () => {
    mockFetchSuccess([makeUnsplashPhoto('USED', 'alice'), makeUnsplashPhoto('UNUSED', 'bob')])
    const lib = await fetchImageLibrary('restaurant')

    const code = `<img src="https://images.unsplash.com/photo-USED?..." />`
    const block = buildAttributionBlock(code, lib)

    expect(block!.data).toContain('Alice Wang')
    expect(block!.data).not.toContain('Bob Chen')
  })
})

// ============================================================
// __internals
// ============================================================

describe('字典覆蓋率', () => {
  it('所有 26 個 productType 都有 query 定義（保留當 Haiku 失敗兜底）', () => {
    const expected = [
      'restaurant', 'cafe', 'fitness', 'healthcare', 'legal', 'finance',
      'realestate', 'salon', 'wedding', 'photography', 'music', 'hotel',
      'travel', 'agency', 'nonprofit', 'retail', 'education', 'event',
      'tool', 'portfolio', 'blog', 'dashboard', 'saas', 'ecommerce',
      'landing', 'personal',
    ]
    for (const t of expected) {
      expect(__internals.PRODUCTTYPE_TO_UNSPLASH_QUERIES[t]).toBeDefined()
      const q = __internals.PRODUCTTYPE_TO_UNSPLASH_QUERIES[t]
      expect(q.hero.length).toBeGreaterThan(0)
      expect(q.product.length).toBeGreaterThan(0)
      expect(q.team.length).toBeGreaterThan(0)
      expect(q.background.length).toBeGreaterThan(0)
      expect(q.lifestyle.length).toBeGreaterThan(0)
      expect(q.detail.length).toBeGreaterThan(0)
    }
  })
})

describe('shuffleDeterministic', () => {
  it('相同 seed → 相同結果', () => {
    const arr = [1, 2, 3, 4, 5]
    const a = __internals.shuffleDeterministic(arr, 'seed-x')
    const b = __internals.shuffleDeterministic(arr, 'seed-x')
    expect(a).toEqual(b)
  })

  it('不同 seed → 不同結果（大概率）', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const a = __internals.shuffleDeterministic(arr, 'seed-a')
    const b = __internals.shuffleDeterministic(arr, 'seed-b')
    expect(a).not.toEqual(b)
  })
})
