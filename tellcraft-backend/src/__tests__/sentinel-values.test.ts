// L28.B: 統一 sentinel value 過濾測試
// 確保 entity-validate / entity-non-existence-validate / 其他 instruction
// 處理 cell 值時規則一致

import { describe, it, expect } from 'vitest'
import { isSentinelValue } from '../lib/specformula/helper/sentinel-values'

describe('isSentinelValue — L28.B 統一過濾', () => {
  it('空值 / 空白 / null / undefined → true（不可塞 SQL）', () => {
    expect(isSentinelValue('')).toBe(true)
    expect(isSentinelValue('   ')).toBe(true)
    expect(isSentinelValue(null)).toBe(true)
    expect(isSentinelValue(undefined)).toBe(true)
  })

  it('VAR 系統前綴 → true', () => {
    expect(isSentinelValue('>User1.id')).toBe(true)        // declare
    expect(isSentinelValue('<userId')).toBe(true)          // capture
    expect(isSentinelValue('<non-empty>')).toBe(true)      // 文字標記
    expect(isSentinelValue('<notempty>')).toBe(true)
  })

  it('CAS 約束（&）→ true', () => {
    expect(isSentinelValue('&isTrue')).toBe(true)
    expect(isSentinelValue('&isNotNull')).toBe(true)
    expect(isSentinelValue('&>0')).toBe(true)
    expect(isSentinelValue('&isNull')).toBe(true)
  })

  it('驗證標記 $notnull / $null / null → true（修復 PK 路徑漏網）', () => {
    expect(isSentinelValue('$notnull')).toBe(true)  // ← 之前漏跳的關鍵 case
    expect(isSentinelValue('$null')).toBe(true)
    expect(isSentinelValue('null')).toBe(true)
  })

  it('真實值（UUID / 字串 / 數字 / VAR 引用）→ false', () => {
    expect(isSentinelValue('550e8400-e29b-41d4-a716-446655440000')).toBe(false)
    expect(isSentinelValue('Standard Plan')).toBe(false)
    expect(isSentinelValue('1500')).toBe(false)
    expect(isSentinelValue('$User.id')).toBe(false)        // VAR 引用 — 是值（待 resolver 解）
    expect(isSentinelValue('$pricingSection1Id')).toBe(false)
  })

  it('bcrypt hash 開頭 $2b$ → false（不是 VAR 引用）', () => {
    expect(isSentinelValue('$2b$10$abcdef.hash.value')).toBe(false)
  })

  it('前後空白被 trim 處理', () => {
    expect(isSentinelValue('  $notnull  ')).toBe(true)
    expect(isSentinelValue('  Standard Plan  ')).toBe(false)
  })
})
