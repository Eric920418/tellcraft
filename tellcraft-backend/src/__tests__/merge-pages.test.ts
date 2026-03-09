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
    // maxPages 預設 4，合併後取前 4
    expect(result).toEqual(['首頁', '產品列表', '聯繫', '商品詳情'])
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

  it('預設上限 4 個頁面', () => {
    const result = mergePages(
      ['首頁', '商品列表', '商品詳情', '購物車', '結帳'],
      ['會員中心', '聯繫', '常見問題', '退換貨']
    )
    expect(result).toHaveLength(4)
    // defaultPages 本身已超過上限，直接截斷
    expect(result).toEqual(['首頁', '商品列表', '商品詳情', '購物車'])
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

  it('清理帶括號描述的垃圾頁名', () => {
    const result = mergePages(
      ['首頁'],
      ['/landing（沉浸式敘事入口，含個人節點生成）', '/home（首頁，含展覽主視覺、策展人）']
    )
    // /landing → landing（去前導 / + 去括號描述）
    // /home → home（去前導 /），但 "首頁" 已存在，home 是不同 key 所以會加入
    expect(result).toContain('landing')
    expect(result).toContain('home')
    // 不應包含括號描述
    expect(result.every(p => !p.includes('（'))).toBe(true)
  })

  it('跳過清理後過長的垃圾頁名', () => {
    const result = mergePages(
      ['首頁'],
      ['這是一個非常非常非常長的頁面名稱超過二十個字的情況']
    )
    // 超過 20 字的頁名被跳過
    expect(result).toEqual(['首頁'])
  })

  it('跳過清理後為空的垃圾頁名', () => {
    const result = mergePages(
      ['首頁'],
      ['（純括號描述沒有頁名）', '/', '']
    )
    expect(result).toEqual(['首頁'])
  })

  it('清理帶逗號描述的頁名', () => {
    const result = mergePages(
      ['首頁'],
      ['作品集,含互動展示', '關於我們']
    )
    expect(result).toContain('作品集')
    expect(result).toContain('關於我們')
    expect(result.every(p => !p.includes(','))).toBe(true)
  })
})
