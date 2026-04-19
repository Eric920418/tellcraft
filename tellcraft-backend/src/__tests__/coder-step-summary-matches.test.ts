// ============================================================
// stepSummaryMatches — word-boundary keyword matcher
// ASCII keyword 用 \b boundary 避免 substring collision
// CJK keyword 用 includes（中文無 word boundary 概念）
// ============================================================

import { describe, it, expect } from 'vitest'
import { stepSummaryMatches } from '../services/coder-generation'

describe('stepSummaryMatches — ASCII word-boundary 匹配', () => {
  it('match 完整單詞', () => {
    expect(stepSummaryMatches('List Orders', ['List'])).toBe(true)
    expect(stepSummaryMatches('Get Order', ['Get'])).toBe(true)
    expect(stepSummaryMatches('Create Todo', ['Create'])).toBe(true)
  })

  it('case-insensitive', () => {
    expect(stepSummaryMatches('list orders', ['List'])).toBe(true)
    expect(stepSummaryMatches('LIST ORDERS', ['list'])).toBe(true)
  })

  it('不誤傷 substring: list vs listing', () => {
    expect(stepSummaryMatches('Show listing', ['list'])).toBe(false)
    expect(stepSummaryMatches('playlist manager', ['list'])).toBe(false)
  })

  it('不誤傷 substring: get vs forget / forget', () => {
    expect(stepSummaryMatches('Do not forget', ['get'])).toBe(false)
    expect(stepSummaryMatches('getting started', ['get'])).toBe(false)
    expect(stepSummaryMatches('target user', ['get'])).toBe(false)
  })

  it('不誤傷 substring: add vs address', () => {
    expect(stepSummaryMatches('Set address', ['add'])).toBe(false)
    expect(stepSummaryMatches('addressing issues', ['add'])).toBe(false)
  })

  it('不誤傷 substring: all vs allergic / hall', () => {
    expect(stepSummaryMatches('allergic reaction', ['all'])).toBe(false)
    expect(stepSummaryMatches('hallway', ['all'])).toBe(false)
  })

  it('keyword 帶尾隨空白被 trim 後正確 match', () => {
    expect(stepSummaryMatches('List Orders', ['List '])).toBe(true)
    expect(stepSummaryMatches('get all items', [' all '])).toBe(true)
  })

  it('多個 keyword 任一 match 即 true', () => {
    expect(stepSummaryMatches('Create Order', ['Update', 'Create', 'Delete'])).toBe(true)
  })

  it('空 keyword 陣列回 false', () => {
    expect(stepSummaryMatches('anything', [])).toBe(false)
  })

  it('空字串 keyword 被略過', () => {
    expect(stepSummaryMatches('List Orders', ['', '  ', 'List'])).toBe(true)
    expect(stepSummaryMatches('List Orders', ['', '  '])).toBe(false)
  })
})

describe('stepSummaryMatches — CJK substring 匹配', () => {
  it('中文用 includes 直接比對', () => {
    expect(stepSummaryMatches('建立訂單', ['建立'])).toBe(true)
    expect(stepSummaryMatches('查詢訂單列表', ['列表'])).toBe(true)
    expect(stepSummaryMatches('刪除商品', ['刪除', '移除'])).toBe(true)
  })

  it('中文部分匹配保留（無 word boundary 概念）', () => {
    // 「建立訂單」match「建立」是合法的中文 infix 比對
    expect(stepSummaryMatches('建立訂單資料', ['建立'])).toBe(true)
  })
})

describe('stepSummaryMatches — 混合列表', () => {
  it('中英 keyword 混合，match 任一即 true', () => {
    const LIST_KW = ['列表', '全部', 'List', 'All']
    expect(stepSummaryMatches('List Orders', LIST_KW)).toBe(true)
    expect(stepSummaryMatches('查詢列表', LIST_KW)).toBe(true)
    expect(stepSummaryMatches('Create Order', LIST_KW)).toBe(false)
  })

  it('regex 特殊字元被 escape（防 ReDoS 或誤匹配）', () => {
    // 雖然 keyword 列表不該含特殊字元，但 escape 是防禦
    expect(stepSummaryMatches('Price: $10', ['$'])).toBe(false) // $ 不是 word char，\b$\b 無意義
  })
})
