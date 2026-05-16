/**
 * Phase 1 open-design-md-loader + recommendMoodsWithHint 單測
 *
 * 覆蓋：
 *  - loader fail-soft：_curated 不存在 / flag off 時返回空，不 throw
 *  - matchOpenDesignStyle 門檻：分數 <15 不返回
 *  - recommendMoods（既有 caller）零行為改變 — regression 守
 *  - recommendMoodsWithHint：flag off → openDesignStyleHint=undefined
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  listOpenDesignStyles,
  loadOpenDesignStyle,
  matchOpenDesignStyle,
  __resetOpenDesignCacheForTesting,
} from '../services/open-design-md-loader'
import {
  recommendMoods,
  recommendMoodsWithHint,
} from '../services/design-moods'
import * as envModule from '../lib/env'

function mockEnv(overrides: Partial<ReturnType<typeof envModule.getEnv>>) {
  vi.spyOn(envModule, 'getEnv').mockReturnValue({
    ...envModule.getEnv(),
    ...overrides,
  } as ReturnType<typeof envModule.getEnv>)
}

describe('open-design-md-loader fail-soft', () => {
  beforeEach(() => {
    __resetOpenDesignCacheForTesting()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    __resetOpenDesignCacheForTesting()
  })

  it('flag off → 整個 loader noop（不讀 disk，return 空）', () => {
    mockEnv({ ENABLE_OPEN_DESIGN_STYLES: false })
    expect(listOpenDesignStyles()).toEqual([])
    expect(loadOpenDesignStyle('any-key')).toBe(null)
    expect(matchOpenDesignStyle('minimal', 'saas')).toBe(null)
  })

  it('flag on 但 _curated/ 不存在 → 返回空，不 throw', () => {
    mockEnv({ ENABLE_OPEN_DESIGN_STYLES: true })
    // 預期 _curated/ 還沒被 audit 生成（CI/dev env）
    // listOpenDesignStyles 不應 throw
    expect(() => listOpenDesignStyles()).not.toThrow()
    expect(() => matchOpenDesignStyle('minimal', 'saas')).not.toThrow()
  })

  it('matchOpenDesignStyle 對未知 feeling/productType 返回 null（不命中時不誤觸發）', () => {
    mockEnv({ ENABLE_OPEN_DESIGN_STYLES: true })
    const result = matchOpenDesignStyle('xyzzy-random-undefined-feeling', 'unknown-product-type')
    expect(result).toBe(null)
  })
})

describe('recommendMoods regression — 既有 caller 行為零改變', () => {
  beforeEach(() => {
    __resetOpenDesignCacheForTesting()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    __resetOpenDesignCacheForTesting()
  })

  it('return string[] 不是物件（既有 caller 用陣列 API）', () => {
    mockEnv({ ENABLE_OPEN_DESIGN_STYLES: true })
    const result = recommendMoods('minimal clean professional', 'saas', 'functional')
    expect(Array.isArray(result)).toBe(true)
    result.forEach(id => expect(typeof id).toBe('string'))
  })

  it('flag on/off 對 recommendMoods 結果零影響（既有邏輯只看 mood）', () => {
    mockEnv({ ENABLE_OPEN_DESIGN_STYLES: false })
    const offResult = recommendMoods('luxury elegant gold', 'salon', 'creative')

    __resetOpenDesignCacheForTesting()
    mockEnv({ ENABLE_OPEN_DESIGN_STYLES: true })
    const onResult = recommendMoods('luxury elegant gold', 'salon', 'creative')

    expect(onResult).toEqual(offResult)
  })

  it('recommendMoods 對未匹配 feeling 返回空陣列（既有行為）', () => {
    mockEnv({ ENABLE_OPEN_DESIGN_STYLES: true })
    const result = recommendMoods('xyzzy-no-match', 'unknown', 'functional')
    expect(result).toEqual([])
  })
})

describe('recommendMoodsWithHint — Phase 1 擴展簽名', () => {
  beforeEach(() => {
    __resetOpenDesignCacheForTesting()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    __resetOpenDesignCacheForTesting()
  })

  it('flag off → openDesignStyleHint 必為 undefined（不呼叫 loader）', () => {
    mockEnv({ ENABLE_OPEN_DESIGN_STYLES: false })
    const result = recommendMoodsWithHint('minimal clean', 'saas', 'functional')
    expect(result.openDesignStyleHint).toBeUndefined()
    expect(Array.isArray(result.moodIds)).toBe(true)
  })

  it('return 結構：{ moodIds, openDesignStyleHint? }', () => {
    mockEnv({ ENABLE_OPEN_DESIGN_STYLES: true })
    const result = recommendMoodsWithHint('minimal clean professional', 'saas', 'functional')
    expect(result).toHaveProperty('moodIds')
    expect(Array.isArray(result.moodIds)).toBe(true)
    // openDesignStyleHint 可能 undefined（無 curated 時）也可能是物件，但不能 throw
  })

  it('既有 caller 用 recommendMoods 取陣列、新 caller 用 recommendMoodsWithHint 取 hint — 兩 API 結果一致的 moodIds', () => {
    mockEnv({ ENABLE_OPEN_DESIGN_STYLES: false })
    const oldApi = recommendMoods('luxury elegant', 'salon', 'creative')
    const newApi = recommendMoodsWithHint('luxury elegant', 'salon', 'creative')
    expect(newApi.moodIds).toEqual(oldApi)
  })
})

describe('OPEN_DESIGN_STYLE_MAX_INJECT_COUNT env flag', () => {
  it('預設值 1（單次 prompt 注入上限避免選擇爆炸）', () => {
    expect(envModule.getEnv().OPEN_DESIGN_STYLE_MAX_INJECT_COUNT).toBe(1)
  })
})
