import { describe, it, expect } from 'vitest'
import { mergePages } from '../services/fast-build-generation'

describe('mergePages', () => {
  it('無 suggestedPages 時返回 defaultPages', () => {
    const result = mergePages(['首頁', '關於', '聯繫'])
    expect(result).toEqual(['首頁', '關於', '聯繫'])
  })

  it('suggestedPages 為空陣列時返回 defaultPages', () => {
    const result = mergePages(['首頁', '關於'], [])
    expect(result).toEqual(['首頁', '關於'])
  })

  it('suggestedPages 為 undefined 時返回 defaultPages', () => {
    const result = mergePages(['首頁', '關於'], undefined)
    expect(result).toEqual(['首頁', '關於'])
  })

  it('合併不重複的頁面', () => {
    const result = mergePages(
      ['首頁', '產品列表', '聯繫'],
      ['商品詳情', '購物車']
    )
    expect(result).toEqual(['首頁', '產品列表', '聯繫', '商品詳情', '購物車'])
  })

  it('去重（相同名稱不重複加入）', () => {
    const result = mergePages(
      ['首頁', '產品列表', '聯繫'],
      ['首頁', '產品列表', '購物車']
    )
    expect(result).toEqual(['首頁', '產品列表', '聯繫', '購物車'])
  })

  it('去重忽略空白和大小寫', () => {
    const result = mergePages(
      ['首頁', 'About Us'],
      ['about us', '聯繫']
    )
    expect(result).toEqual(['首頁', 'About Us', '聯繫'])
  })

  it('預設上限 7 個頁面', () => {
    const result = mergePages(
      ['首頁', '商品列表', '商品詳情', '購物車', '結帳'],
      ['會員中心', '聯繫', '常見問題', '退換貨']
    )
    expect(result).toHaveLength(7)
    // 前 5 個是 defaultPages，後 2 個是 suggestedPages
    expect(result).toEqual(['首頁', '商品列表', '商品詳情', '購物車', '結帳', '會員中心', '聯繫'])
  })

  it('自訂 maxPages 上限', () => {
    const result = mergePages(
      ['首頁', '關於', '聯繫'],
      ['商品', '購物車'],
      4
    )
    expect(result).toHaveLength(4)
    expect(result).toEqual(['首頁', '關於', '聯繫', '商品'])
  })

  it('defaultPages 超過上限時截斷', () => {
    const result = mergePages(
      ['首頁', '商品列表', '商品詳情', '購物車', '結帳', '會員中心', '聯繫', 'FAQ'],
      undefined,
      7
    )
    expect(result).toHaveLength(7)
    expect(result[6]).toBe('聯繫')
  })

  it('優先保留 defaultPages 的順序', () => {
    const result = mergePages(
      ['首頁', '關於'],
      ['聯繫', '首頁', 'FAQ']
    )
    // 首頁在 default 中已有，聯繫和 FAQ 是新增
    expect(result[0]).toBe('首頁')
    expect(result[1]).toBe('關於')
    expect(result).toContain('聯繫')
    expect(result).toContain('FAQ')
  })
})
