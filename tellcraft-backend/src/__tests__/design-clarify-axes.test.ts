import { describe, it, expect } from 'vitest'
import {
  extractCoveredAxes,
  getCoveredAxes,
  pickNextClarifyAxis,
  pickSupplementaryQuestion,
  shouldAskSupplementary,
} from '../services/design-clarify-axes'

describe('extractCoveredAxes — feeling', () => {
  it.each([
    '專業可靠',
    '活潑有趣',
    '我希望感覺很簡約現代',
    'I want it to feel professional and trustworthy',
    'Sleek and minimal vibes',
    '想要那種輕鬆親切的感覺',
  ])('detects feeling in: %s', (text) => {
    expect(extractCoveredAxes(text).has('feeling')).toBe(true)
  })

  it('does not falsely detect feeling in pure layout text', () => {
    expect(extractCoveredAxes('卡片式網格佈局').has('feeling')).toBe(false)
  })
})

describe('extractCoveredAxes — reference', () => {
  it.each([
    '參考 Notion',
    '想要像 Stripe 那樣的設計',
    '類似 Linear 的風格',
    'similar to airbnb',
    'inspired by figma',
    'https://stripe.com',
    '可以參考 vercel.com',
    '像 Apple 那種簡潔',
  ])('detects reference in: %s', (text) => {
    expect(extractCoveredAxes(text).has('reference')).toBe(true)
  })
})

describe('extractCoveredAxes — color', () => {
  it.each([
    '藍色系',
    '暖色調',
    '黑白灰',
    '主色 #FF5733',
    'blue accent',
    'monochrome with warm tones',
    '配色偏向冷色',
    '想要紫色',
  ])('detects color in: %s', (text) => {
    expect(extractCoveredAxes(text).has('color')).toBe(true)
  })
})

describe('extractCoveredAxes — layout', () => {
  it.each([
    '簡潔留白',
    '卡片式佈局',
    '網格排版',
    '左右分割',
    '滿版 hero',
    'sidebar with main content',
    'grid layout',
    'spacious column',
  ])('detects layout in: %s', (text) => {
    expect(extractCoveredAxes(text).has('layout')).toBe(true)
  })
})

describe('extractCoveredAxes — multi-axis single message', () => {
  it('detects all 4 axes in a rich one-shot description', () => {
    const text = '我想要像 Stripe 那種專業現代的感覺，配色用藍色系，佈局簡潔留白卡片式'
    const covered = extractCoveredAxes(text)
    expect(covered.has('feeling')).toBe(true)
    expect(covered.has('reference')).toBe(true)
    expect(covered.has('color')).toBe(true)
    expect(covered.has('layout')).toBe(true)
  })

  it('returns empty set for too-short input', () => {
    expect(extractCoveredAxes('').size).toBe(0)
    expect(extractCoveredAxes('a').size).toBe(0)
  })
})

describe('getCoveredAxes', () => {
  it('counts explicit step keys as covered', () => {
    const ideas = [
      { step: 'feeling', answer: '隨便' },
      { step: 'reference', answer: '沒想法' },
    ]
    const covered = getCoveredAxes(ideas)
    expect(covered.has('feeling')).toBe(true)
    expect(covered.has('reference')).toBe(true)
    expect(covered.has('color')).toBe(false)
    expect(covered.has('layout')).toBe(false)
  })

  it('combines explicit + textual detection', () => {
    const ideas = [
      { step: 'initial', answer: '我想要藍色簡潔的卡片式設計' },
    ]
    const covered = getCoveredAxes(ideas)
    expect(covered.has('color')).toBe(true)
    expect(covered.has('layout')).toBe(true)
  })

  it('ignores empty/whitespace explicit answers', () => {
    const ideas = [
      { step: 'feeling', answer: '' },
      { step: 'color', answer: '  ' },
    ]
    const covered = getCoveredAxes(ideas)
    expect(covered.has('feeling')).toBe(false)
    expect(covered.has('color')).toBe(false)
  })
})

describe('pickNextClarifyAxis', () => {
  it('returns feeling first when nothing covered', () => {
    expect(pickNextClarifyAxis([])).toBe('feeling')
  })

  it('returns first un-covered axis in order', () => {
    const ideas = [{ step: 'feeling', answer: '專業' }]
    expect(pickNextClarifyAxis(ideas)).toBe('reference')
  })

  it('skips axes already covered via initial idea text', () => {
    const ideas = [{ step: 'initial', answer: '想要藍色現代風格的卡片佈局' }]
    // initial 命中 feeling/color/layout，唯一未涵蓋是 reference
    expect(pickNextClarifyAxis(ideas)).toBe('reference')
  })

  it('returns null when all 4 axes covered', () => {
    const ideas = [
      { step: 'initial', answer: '像 Stripe 那種專業現代藍色簡潔卡片佈局' },
    ]
    expect(pickNextClarifyAxis(ideas)).toBeNull()
  })

  it('does NOT skip when explicit answers present but axis not actually covered textually', () => {
    // user 回答了 feeling 但答案是「隨便」(沒命中關鍵詞) — 仍應視為已回答（明確 step 標記）
    const ideas = [{ step: 'feeling', answer: '隨便都好' }]
    expect(pickNextClarifyAxis(ideas)).toBe('reference')
  })
})

describe('shouldAskSupplementary', () => {
  it('returns true when 1 turn covers all 4 axes', () => {
    const ideas = [{ step: 'initial', answer: '想要像 Stripe 的專業藍色簡潔卡片網格' }]
    expect(shouldAskSupplementary(ideas)).toBe(true)
  })

  it('returns false when user already answered 2+ turns', () => {
    const ideas = [
      { step: 'feeling', answer: '專業' },
      { step: 'reference', answer: 'Stripe' },
      { step: 'color', answer: '藍色' },
      { step: 'layout', answer: '卡片式' },
    ]
    expect(shouldAskSupplementary(ideas)).toBe(false)
  })

  it('returns false when not all 4 axes covered', () => {
    const ideas = [{ step: 'initial', answer: '想要藍色簡潔卡片' }]
    // 缺 reference — 不該補追問
    expect(shouldAskSupplementary(ideas)).toBe(false)
  })

  it('returns false on empty input', () => {
    expect(shouldAskSupplementary([])).toBe(false)
  })
})

describe('pickSupplementaryQuestion', () => {
  it('returns a question when ideas only contain initial', () => {
    const ideas = [{ step: 'initial', answer: '...' }]
    const q = pickSupplementaryQuestion(ideas)
    expect(q).not.toBeNull()
    expect(q?.question).toBeTruthy()
    expect(q?.hint).toBeTruthy()
  })

  it('avoids re-asking already-asked supplementary keys', () => {
    const ideas = [
      { step: 'initial', answer: '...' },
      { step: 'brand_personality', answer: '像 Linear' },
    ]
    const q = pickSupplementaryQuestion(ideas)
    expect(q?.key).not.toBe('brand_personality')
  })

  it('deterministic: same ideas → same question', () => {
    const ideas = [{ step: 'initial', answer: '...' }]
    const a = pickSupplementaryQuestion(ideas)
    const b = pickSupplementaryQuestion(ideas)
    expect(a?.key).toBe(b?.key)
  })
})
