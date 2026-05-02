import { describe, expect, it } from 'vitest'
import {
  DOMAIN_TO_BRAND,
  TEXT_ALIAS_TO_BRAND,
  parseAndNormalizeDomain,
  lookupBrandByDomain,
  inferBrandFromText,
} from '../services/brand-domain-map'

describe('parseAndNormalizeDomain', () => {
  it('strips www. prefix and lowercases', () => {
    expect(parseAndNormalizeDomain('https://www.STRIPE.com')).toEqual({ full: 'stripe.com', sld: 'stripe.com' })
  })

  it('returns full hostname for subdomain queries', () => {
    expect(parseAndNormalizeDomain('https://blog.stripe.com')).toEqual({ full: 'blog.stripe.com', sld: 'stripe.com' })
  })

  it('handles two-segment TLDs (.co.uk, .com.tw)', () => {
    expect(parseAndNormalizeDomain('https://example.co.uk')).toEqual({ full: 'example.co.uk', sld: 'example.co.uk' })
    expect(parseAndNormalizeDomain('https://shop.example.com.tw')).toEqual({ full: 'shop.example.com.tw', sld: 'example.com.tw' })
  })

  it('rejects non-http(s) protocols', () => {
    expect(parseAndNormalizeDomain('javascript:alert(1)')).toBeNull()
    expect(parseAndNormalizeDomain('ftp://example.com')).toBeNull()
  })

  it('rejects malformed URLs', () => {
    expect(parseAndNormalizeDomain('not a url')).toBeNull()
    expect(parseAndNormalizeDomain('https://')).toBeNull()
  })
})

describe('lookupBrandByDomain', () => {
  it('hits exact domain', () => {
    expect(lookupBrandByDomain('https://stripe.com')).toBe('stripe')
    expect(lookupBrandByDomain('https://figma.com/community')).toBe('figma')
  })

  it('hits via SLD fallback for subdomains', () => {
    expect(lookupBrandByDomain('https://blog.stripe.com')).toBe('stripe')
    expect(lookupBrandByDomain('https://docs.figma.com')).toBe('figma')
  })

  it('distinguishes m.bmw.com from bmw.com', () => {
    expect(lookupBrandByDomain('https://bmw.com')).toBe('bmw')
    expect(lookupBrandByDomain('https://m.bmw.com')).toBe('bmw-m')
  })

  it('returns null for unknown brands', () => {
    expect(lookupBrandByDomain('https://random-blog.example.com')).toBeNull()
  })

  it('returns null for malformed URLs', () => {
    expect(lookupBrandByDomain('not a url')).toBeNull()
  })
})

describe('inferBrandFromText', () => {
  it('matches Chinese context "像 Stripe"', () => {
    expect(inferBrandFromText('我想做一個像 Stripe 的金流網站')).toBe('stripe')
  })

  it('matches English context "feel like Notion"', () => {
    expect(inferBrandFromText('I want it to feel like Notion')).toBe('notion')
  })

  it('matches longer brand keys like linear.app via "linear"', () => {
    expect(inferBrandFromText('類似 Linear 的設計風格')).toBe('linear.app')
  })

  it('returns null when multiple brand names appear (avoid false positive on comparison)', () => {
    expect(inferBrandFromText('Stripe vs Linear 哪個比較好')).toBeNull()
  })

  it('does not false-match common English words via word boundary', () => {
    // "metadata" should not match "meta"
    expect(inferBrandFromText('I love metadata structure')).toBeNull()
    // "cohere" alias is "cohere" — must not match "coherent"
    expect(inferBrandFromText('the design feels coherent')).toBeNull()
  })

  it('matches brand-only domain alias like together.ai', () => {
    expect(inferBrandFromText('use together.ai for inference')).toBe('together.ai')
  })

  it('returns null when no brand alias hit', () => {
    expect(inferBrandFromText('please make me a beautiful website')).toBeNull()
  })
})

describe('coverage — every entry maps to a real brandKey', () => {
  it('all DOMAIN_TO_BRAND values are non-empty strings', () => {
    for (const [domain, brand] of Object.entries(DOMAIN_TO_BRAND)) {
      expect(brand, `domain ${domain}`).toMatch(/.+/)
    }
  })

  it('all TEXT_ALIAS_TO_BRAND values are non-empty strings', () => {
    for (const [alias, brand] of Object.entries(TEXT_ALIAS_TO_BRAND)) {
      expect(brand, `alias ${alias}`).toMatch(/.+/)
    }
  })
})
