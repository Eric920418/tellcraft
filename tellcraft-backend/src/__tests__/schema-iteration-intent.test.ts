import { describe, it, expect } from 'vitest'
import { detectSchemaChangeIntent } from '../services/schema-iteration-intent'

// ============================================================
// 加性意圖（hasIntent=true, likelyDestructive=false）
// ============================================================

describe('detectSchemaChangeIntent — 加性中文', () => {
  const cases = [
    '新增一個 vote_count 欄位到 posts 表',
    '加個 published_at 欄位',
    '加一張 comments 資料表',
    '多一個 status 欄位',
    '多一張 logs 表',
    '新增欄位 description 到 products',
    '新增 index 給 email',
  ]
  cases.forEach(text => {
    it(`命中: "${text}"`, () => {
      const r = detectSchemaChangeIntent(text)
      expect(r.hasIntent).toBe(true)
      expect(r.likelyDestructive).toBe(false)
      expect(r.signals.length).toBeGreaterThan(0)
    })
  })
})

describe('detectSchemaChangeIntent — 加性英文', () => {
  const cases = [
    'add a vote_count column to posts',
    'add new column status',
    'add a new field for email',
    'create a new index on email',
    'add column published_at',
    'new column name',
  ]
  cases.forEach(text => {
    it(`命中: "${text}"`, () => {
      const r = detectSchemaChangeIntent(text)
      expect(r.hasIntent).toBe(true)
      expect(r.likelyDestructive).toBe(false)
    })
  })
})

// ============================================================
// 破壞性意圖（hasIntent=true, likelyDestructive=true）
// ============================================================

describe('detectSchemaChangeIntent — 破壞性中文', () => {
  const cases = [
    '移除 vote_count 欄位',
    '拿掉 status 欄位',
    '砍掉 logs 資料表',
    '刪除 published_at 欄位',
    '把 username 欄位改名為 login_name',
    '更名 column posts 為 articles',
    '把 views 改型別為 bigint',
    '把 created_at 轉成 timestamp',
  ]
  cases.forEach(text => {
    it(`命中破壞: "${text}"`, () => {
      const r = detectSchemaChangeIntent(text)
      expect(r.hasIntent).toBe(true)
      expect(r.likelyDestructive).toBe(true)
    })
  })
})

describe('detectSchemaChangeIntent — 破壞性英文', () => {
  const cases = [
    'drop column vote_count',
    'remove column status',
    'delete the logs table',
    'rename column username to login_name',
    'rename table users to accounts',
    'change type of views to int',
    'alter column type to text',
    'change views to bigint',
  ]
  cases.forEach(text => {
    it(`命中破壞: "${text}"`, () => {
      const r = detectSchemaChangeIntent(text)
      expect(r.hasIntent).toBe(true)
      expect(r.likelyDestructive).toBe(true)
    })
  })
})

// ============================================================
// 不該命中（純前端 / 純後端 code 變更）
// ============================================================

describe('detectSchemaChangeIntent — 不該命中（純前端）', () => {
  const cases = [
    '把 hero 改大一點',
    '把標題改成 "歡迎"',
    '加一個按鈕到 hero 區塊',
    'change the hero text',
    'make the button bigger',
    'add a CTA button',
    '把主色改成藍色',
    '修改一下動畫',
    '我想要 footer 換顏色',
  ]
  cases.forEach(text => {
    it(`不命中: "${text}"`, () => {
      const r = detectSchemaChangeIntent(text)
      expect(r.hasIntent).toBe(false)
      expect(r.likelyDestructive).toBe(false)
    })
  })
})

describe('detectSchemaChangeIntent — 不該命中（純後端 code）', () => {
  const cases = [
    '登入邏輯多加一個驗證',
    'API 回傳要加上 createdAt',                     // 「加上 createdAt」沒接「欄位/column/field」→ 純 code 改
    '修改 server action 的 try/catch',
    'change the validation logic',
    'fix the API response format',
  ]
  cases.forEach(text => {
    it(`不命中: "${text}"`, () => {
      const r = detectSchemaChangeIntent(text)
      expect(r.hasIntent).toBe(false)
    })
  })
})

// ============================================================
// 邊界 case
// ============================================================

describe('detectSchemaChangeIntent — 邊界', () => {
  it('空字串', () => {
    expect(detectSchemaChangeIntent('')).toEqual({ hasIntent: false, likelyDestructive: false, signals: [] })
  })

  it('null / undefined fail-soft', () => {
    expect(detectSchemaChangeIntent(null as unknown as string).hasIntent).toBe(false)
    expect(detectSchemaChangeIntent(undefined as unknown as string).hasIntent).toBe(false)
  })

  it('純空白 → 不命中', () => {
    expect(detectSchemaChangeIntent('   ').hasIntent).toBe(false)
  })

  it('signals 回傳具體名稱（用於 telemetry debugging）', () => {
    const r = detectSchemaChangeIntent('新增一個欄位 vote_count')
    expect(r.signals.length).toBeGreaterThan(0)
    expect(r.signals[0]).toMatch(/zh:/)
  })
})
