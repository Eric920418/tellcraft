import { describe, it, expect } from 'vitest'
import {
  getIndustryPrior,
  formatIndustryPriorForPrompt,
  listSupportedIndustries,
} from '../services/industry-priors'

describe('listSupportedIndustries', () => {
  it('returns the 5 high-frequency industries', () => {
    const list = listSupportedIndustries()
    expect(list).toEqual(expect.arrayContaining([
      'restaurant', 'fitness', 'saas', 'portfolio', 'ecommerce',
    ]))
    expect(list).toHaveLength(5)
  })
})

describe('getIndustryPrior', () => {
  it('returns prior for direct match', () => {
    const p = getIndustryPrior('restaurant')
    expect(p?.id).toBe('restaurant')
    expect(p?.expectedSections).toContain('Menu / 菜單')
  })

  it('aliases cafe → restaurant', () => {
    expect(getIndustryPrior('cafe')?.id).toBe('restaurant')
    expect(getIndustryPrior('bakery')?.id).toBe('restaurant')
  })

  it('aliases gym/yoga → fitness', () => {
    expect(getIndustryPrior('gym')?.id).toBe('fitness')
    expect(getIndustryPrior('yoga')?.id).toBe('fitness')
  })

  it('aliases tool/platform/developer → saas', () => {
    expect(getIndustryPrior('tool')?.id).toBe('saas')
    expect(getIndustryPrior('developer')?.id).toBe('saas')
  })

  it('aliases personal/agency → portfolio', () => {
    expect(getIndustryPrior('personal')?.id).toBe('portfolio')
    expect(getIndustryPrior('agency')?.id).toBe('portfolio')
  })

  it('aliases shop/store/retail → ecommerce', () => {
    expect(getIndustryPrior('shop')?.id).toBe('ecommerce')
    expect(getIndustryPrior('store')?.id).toBe('ecommerce')
  })

  it('case-insensitive', () => {
    expect(getIndustryPrior('RESTAURANT')?.id).toBe('restaurant')
    expect(getIndustryPrior('SaaS')?.id).toBe('saas')
  })

  it('returns null for unknown / undefined', () => {
    expect(getIndustryPrior('unknown')).toBeNull()
    expect(getIndustryPrior(undefined)).toBeNull()
    expect(getIndustryPrior('')).toBeNull()
  })
})

describe('formatIndustryPriorForPrompt', () => {
  it('returns empty string for unknown productType', () => {
    expect(formatIndustryPriorForPrompt('unknown')).toBe('')
    expect(formatIndustryPriorForPrompt(undefined)).toBe('')
  })

  it('formats restaurant prior with all sections', () => {
    const out = formatIndustryPriorForPrompt('restaurant')
    expect(out).toContain('行業視覺先驗（restaurant）')
    expect(out).toContain('視覺慣例')
    expect(out).toContain('Menu / 菜單')
    expect(out).toContain('AI slop')
    expect(out).toContain('禁止 SaaS 風格')
  })

  it('saas prior calls out purple gradient slop', () => {
    const out = formatIndustryPriorForPrompt('saas')
    expect(out).toMatch(/紫色漸層/)
  })

  it('fitness prior says硬派', () => {
    const out = formatIndustryPriorForPrompt('fitness')
    expect(out).toContain('硬派')
  })

  it('portfolio prior warns against SaaS sidebar look', () => {
    const out = formatIndustryPriorForPrompt('portfolio')
    expect(out).toContain('SaaS')
  })

  it('ecommerce prior emphasizes CTA visibility', () => {
    const out = formatIndustryPriorForPrompt('ecommerce')
    expect(out).toContain('CTA')
  })

  it('all priors include the "尊重 brief" escape clause', () => {
    for (const id of ['restaurant', 'fitness', 'saas', 'portfolio', 'ecommerce']) {
      expect(formatIndustryPriorForPrompt(id)).toContain('尊重 brief')
    }
  })
})
