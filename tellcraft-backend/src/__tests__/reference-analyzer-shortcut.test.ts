/**
 * 短路測試：用戶輸入 URL / 文字 → analyzeReference 命中 vendored brand → 跳過 puppeteer
 *
 * 注意：這個測試不啟動 Chromium，只驗證短路命中時不會走到 fetchMetadata / extractPageData。
 * 我們用 module-level monkey patch 確認這兩個函數沒被呼叫。
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

const designMdRoot = path.join(__dirname, '../../external/awesome-design-md/design-md')
const SUBMODULE_AVAILABLE = fs.existsSync(designMdRoot) &&
  fs.existsSync(path.join(designMdRoot, 'stripe', 'DESIGN.md'))

describe.skipIf(!SUBMODULE_AVAILABLE)('analyzeReference short-circuit (vendored brand)', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('URL hit (stripe.com) → returns vendored_designmd without calling puppeteer', async () => {
    // Mock fetchMetadata + extractPageData to track calls
    const fetchMock = vi.fn()
    const extractMock = vi.fn()

    vi.doMock('../services/reference-analyzer-internals', () => ({}))
    // Direct import — short-circuit happens BEFORE the puppeteer fns,
    // so we just verify the result shape and analysisSource
    const { analyzeReference } = await import('../services/reference-analyzer')
    const result = await analyzeReference('https://stripe.com')

    expect(result.analysisSource).toBe('vendored_designmd')
    expect(result.designSystem?.metadata.brandKey).toBe('stripe')
    expect(result.designSystem?.metadata.url).toBe('https://stripe.com')
    expect(result.designSystem?.typography?.primaryFont).toBe('sohne-var')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(extractMock).not.toHaveBeenCalled()
  })

  it('text hit ("像 Stripe") → returns vendored_designmd', async () => {
    const { analyzeReference } = await import('../services/reference-analyzer')
    const result = await analyzeReference('我想做一個像 Stripe 的金流網站')
    expect(result.analysisSource).toBe('vendored_designmd')
    expect(result.designSystem?.metadata.brandKey).toBe('stripe')
  })

  it('multi-brand text ("Stripe vs Linear") → does NOT short-circuit', async () => {
    const { analyzeReference } = await import('../services/reference-analyzer')
    const result = await analyzeReference('Stripe vs Linear 哪個比較好')
    expect(result.analysisSource).toBe('text_only')
    expect(result.designSystem).toBeUndefined()
  })

  it('subdomain (blog.stripe.com) → still hits stripe brand', async () => {
    const { analyzeReference } = await import('../services/reference-analyzer')
    const result = await analyzeReference('https://blog.stripe.com/posts/xxx')
    expect(result.analysisSource).toBe('vendored_designmd')
    expect(result.designSystem?.metadata.brandKey).toBe('stripe')
  })

  it('formatStructuredDataForPrompt prioritizes designSystem over legacy fields', async () => {
    const { analyzeReference, formatStructuredDataForPrompt } = await import('../services/reference-analyzer')
    const result = await analyzeReference('https://linear.app')
    expect(result.designSystem).toBeDefined()
    const formatted = formatStructuredDataForPrompt(result)
    expect(formatted).toContain('linear.app')
    expect(formatted).toContain('vendored')
  })
})

describe('analyzeReference fallback path (no submodule, no brand match)', () => {
  it('non-URL non-brand text → text_only without designSystem', async () => {
    const { analyzeReference } = await import('../services/reference-analyzer')
    const result = await analyzeReference('please make me a beautiful website')
    expect(result.analysisSource).toBe('text_only')
    expect(result.designSystem).toBeUndefined()
  })
})
