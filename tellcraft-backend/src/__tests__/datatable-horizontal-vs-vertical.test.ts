// L33: maybeTransposeVerticalDataTable 區分水平 vs 垂直格式
//
// 之前 bug：horizontal `[username, password] / [admin_owner, CorrectPassword]`
// 被誤判為垂直 → headers 變 [username, admin_owner]，row 錯位 → password 永遠 undefined
// → Admin Login 永遠 fail。

import { describe, it, expect } from 'vitest'
import { maybeTransposeVerticalDataTable } from '../services/specformula-runner'

describe('L33 — maybeTransposeVerticalDataTable 水平/垂直區分', () => {
  // ===== 水平格式（不該轉置）=====

  it('❌ 不轉置：標準 horizontal Login table（admin_owner / CorrectPassword）', () => {
    const raw = [
      ['username', 'password'],
      ['admin_owner', 'CorrectPassword'],
    ]
    expect(maybeTransposeVerticalDataTable(raw)).toBe(null)
  })

  it('❌ 不轉置：horizontal with email pair', () => {
    const raw = [
      ['email', 'password'],
      ['user@example.com', 'SecretPass'],
    ]
    // 注意：value 含 @ → 看起來像值，但 firstRow 兩個都是常見欄位名 → 水平更合理
    // 我們的策略：firstRow 全 valid header + secondRow[0] 像 key → 水平優先
    // user@example.com 含 @ → 看起來像 value → secondRow 像 [key, value] → 但 user@example.com 不是 valid header
    // 所以 looksLikeKeyValuePair(secondRow) = false → 水平
    expect(maybeTransposeVerticalDataTable(raw)).toBe(null)
  })

  it('❌ 不轉置：3+ rows horizontal', () => {
    const raw = [
      ['username', 'password'],
      ['user1', 'pass1'],
      ['user2', 'pass2'],
    ]
    expect(maybeTransposeVerticalDataTable(raw)).toBe(null)
  })

  it('❌ 不轉置：horizontal 含 VAR 前綴', () => {
    const raw = [
      ['>User1.id', 'username', 'passwordHash'],
      ['<userId', 'admin', 'hashed'],
    ]
    // 3 columns 不轉置（早期 return）
    expect(maybeTransposeVerticalDataTable(raw)).toBe(null)
  })

  // ===== 垂直格式（該轉置）=====

  it('✅ 轉置：垂直 key-value with quoted values', () => {
    const raw = [
      ['email', '"alice@example.com"'],
      ['password_hash', '"hashed_value"'],
    ]
    const result = maybeTransposeVerticalDataTable(raw)
    expect(result).not.toBeNull()
    expect(result!.headers).toEqual(['email', 'password_hash'])
    expect(result!.rows[0]).toEqual({ email: '"alice@example.com"', password_hash: '"hashed_value"' })
  })

  it('✅ 轉置：垂直 with @ in value', () => {
    const raw = [
      ['email', 'alice@example.com'],
      ['name', 'Alice'],
    ]
    // alice@example.com 含 @ → looks like value
    // Alice 純識別字 — 但 firstRow 不全是 [valid_header, valid_header]（因為 alice@example.com 不是 valid_header）
    // → firstRowAllValidHeaders = false → 不走水平 short-circuit → 進入轉置驗證
    const result = maybeTransposeVerticalDataTable(raw)
    expect(result).not.toBeNull()
    expect(result!.headers).toEqual(['email', 'name'])
  })

  it('✅ 轉置：垂直 with $ VAR value（兩行 value 都有特徵）', () => {
    const raw = [
      ['userId', '$User1.id'],
      ['description', '"Hello World"'],
    ]
    const result = maybeTransposeVerticalDataTable(raw)
    expect(result).not.toBeNull()
    expect(result!.headers).toEqual(['userId', 'description'])
  })

  it('✅ 邊界：純識別字 value 視為水平（如 [title, Hello]）— 寧可錯歸水平也不亂轉', () => {
    // 規範：垂直格式的 value 必須有特徵（引號 / VAR / 特殊字元 / 中文）
    // 純 ASCII 識別字（如 'Hello'）不可靠分辨 → 預設當水平
    const raw = [
      ['title', 'Hello'],
      ['name', 'World'],
    ]
    expect(maybeTransposeVerticalDataTable(raw)).toBe(null)
  })

  // ===== 邊界 cases =====

  it('null：1 column 表', () => {
    expect(maybeTransposeVerticalDataTable([['only-one']])).toBe(null)
  })

  it('null：3 columns 表', () => {
    expect(maybeTransposeVerticalDataTable([['a', 'b', 'c'], ['1', '2', '3']])).toBe(null)
  })

  it('null：只有 1 行', () => {
    expect(maybeTransposeVerticalDataTable([['a', 'b']])).toBe(null)
  })
})
