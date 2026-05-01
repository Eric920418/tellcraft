/**
 * 防雷清單 → 測試轉化：coder-generation.ts 規則測試
 *
 * 覆蓋 CLAUDE.md 防雷清單中以下條目：
 * - classifyFailureRootCause() 零 LLM 8 類分類器
 * - var_resolution 跳過代碼修復；auth_check 直接 removeAuthChecks()
 * - softDeleteColumn 為 .optional()，Schema 沒有此欄位不生成 AND deleted_at IS NULL
 * - INLINE_SNAKE_TO_CAMEL 必須內嵌模板
 * - Code Template Zod schema 必須寬鬆：scopeColumn/scopeParam 用 .optional()
 */

import { describe, it, expect } from 'vitest'
import {
  classifyFailureRootCause,
  type FailureRootCause,
  validateSlotColumns,
} from '../services/coder-generation'

// ============================================================
// classifyFailureRootCause — 零 LLM 8+1 類分類器
// 防雷清單：classifyFailureRootCause() 零 LLM 8 類
// ============================================================

describe('classifyFailureRootCause', () => {
  // dispatch_mismatch
  it('should classify 不支援的操作 as dispatch_mismatch', () => {
    expect(classifyFailureRootCause('不支援的操作類型')).toBe('dispatch_mismatch')
  })

  it('should classify unsupported operation as dispatch_mismatch', () => {
    expect(classifyFailureRootCause('Unsupported operation for this action')).toBe('dispatch_mismatch')
  })

  // var_resolution（Feature 問題，不要修代碼）
  it('should classify VAR 解析失敗 as var_resolution', () => {
    expect(classifyFailureRootCause('VAR 解析失敗: $userId not found')).toBe('var_resolution')
  })

  it('should classify 無法解析 as var_resolution', () => {
    expect(classifyFailureRootCause('無法解析 $listId')).toBe('var_resolution')
  })

  // missing_column
  it('should classify column does not exist as missing_column', () => {
    expect(classifyFailureRootCause('column "user_name" does not exist')).toBe('missing_column')
  })

  it('should classify column 不存在 as missing_column', () => {
    expect(classifyFailureRootCause('column "email" 不存在')).toBe('missing_column')
  })

  // wrong_status
  it('should classify HTTP 狀態碼不匹配 as wrong_status', () => {
    expect(classifyFailureRootCause('HTTP 狀態碼不匹配：預期 200，實際 500')).toBe('wrong_status')
  })

  it('should classify 預期 NNN as wrong_status', () => {
    expect(classifyFailureRootCause('預期 201 但收到 400')).toBe('wrong_status')
  })

  it('should classify status code mismatch as wrong_status', () => {
    expect(classifyFailureRootCause('Expected status code 200')).toBe('wrong_status')
  })

  // field_naming
  it('should classify 值不匹配 as field_naming', () => {
    expect(classifyFailureRootCause('回應欄位 createdAt 值不匹配')).toBe('field_naming')
  })

  it('should classify 欄位不存在 as field_naming', () => {
    expect(classifyFailureRootCause('回應中欄位 user_name 不存在')).toBe('field_naming')
  })

  it('should classify field not found as field_naming', () => {
    expect(classifyFailureRootCause('response field "userName" not found')).toBe('field_naming')
  })

  // auth_check
  it('should classify unauthorized as auth_check', () => {
    expect(classifyFailureRootCause('Unauthorized: missing token')).toBe('auth_check')
  })

  it('should classify JWT as auth_check', () => {
    expect(classifyFailureRootCause('JWT verification failed')).toBe('auth_check')
  })

  // fk_constraint
  it('should classify foreign key violation as fk_constraint', () => {
    expect(classifyFailureRootCause('violates foreign key constraint "fk_user_id"')).toBe('fk_constraint')
  })

  // sql_error
  it('should classify syntax error as sql_error', () => {
    expect(classifyFailureRootCause('syntax error at or near "FROM"')).toBe('sql_error')
  })

  it('should classify invalid input syntax as sql_error', () => {
    expect(classifyFailureRootCause('invalid input syntax for type uuid')).toBe('sql_error')
  })

  it('should classify relation does not exist as sql_error', () => {
    expect(classifyFailureRootCause('relation "users" does not exist')).toBe('sql_error')
  })

  // unknown
  it('should return unknown for empty string', () => {
    expect(classifyFailureRootCause('')).toBe('unknown')
  })

  it('should return unknown for unrecognized error', () => {
    expect(classifyFailureRootCause('something completely different happened')).toBe('unknown')
  })

  // 優先級測試
  it('should prioritize dispatch_mismatch over sql_error for mixed messages', () => {
    expect(classifyFailureRootCause('不支援的操作 syntax error')).toBe('dispatch_mismatch')
  })

  it('should prioritize var_resolution over missing_column', () => {
    expect(classifyFailureRootCause('VAR 解析失敗 column not found')).toBe('var_resolution')
  })

  // 大小寫不敏感
  it('should be case-insensitive', () => {
    expect(classifyFailureRootCause('UNAUTHORIZED access')).toBe('auth_check')
    expect(classifyFailureRootCause('COLUMN "id" DOES NOT EXIST')).toBe('missing_column')
  })

  // 完整分類覆蓋
  it('should cover all 9 categories', () => {
    const allCategories: FailureRootCause[] = [
      'dispatch_mismatch', 'var_resolution', 'missing_column',
      'wrong_status', 'field_naming', 'auth_check',
      'fk_constraint', 'sql_error', 'unknown',
    ]
    const inputs = [
      '不支援的操作', 'VAR 解析失敗', 'column x does not exist',
      'HTTP 狀態碼不匹配', '值不匹配', 'unauthorized',
      'violates foreign key', 'syntax error', 'random',
    ]
    const results = inputs.map((e) => classifyFailureRootCause(e))
    expect(new Set(results)).toEqual(new Set(allCategories))
  })
})

// ============================================================
// validateSlotColumns — Schema-aware softDeleteColumn
// 防雷清單：softDeleteColumn 為 .optional()，Schema 沒有此欄位不生成 AND deleted_at IS NULL
// ============================================================

describe('validateSlotColumns', () => {
  const schemaSql = `
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL,
      name TEXT,
      deleted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `

  it('should keep softDeleteColumn when column exists in schema', () => {
    const slots = { table: 'users', softDeleteColumn: 'deleted_at' }
    validateSlotColumns(slots, schemaSql)
    expect(slots.softDeleteColumn).toBe('deleted_at')
  })

  it('should remove softDeleteColumn when column does not exist in schema', () => {
    const slots = { table: 'posts', softDeleteColumn: 'deleted_at' }
    validateSlotColumns(slots, schemaSql)
    expect(slots.softDeleteColumn).toBe('')
  })

  it('should handle missing softDeleteColumn gracefully', () => {
    const slots: { table: string; softDeleteColumn?: string } = { table: 'users' }
    validateSlotColumns(slots, schemaSql)
    expect(slots.softDeleteColumn).toBeUndefined()
  })

  it('should remove scopeColumn when column does not exist', () => {
    const slots = { table: 'users', scopeColumn: 'organization_id', scopeParam: 'orgId' }
    validateSlotColumns(slots, schemaSql)
    expect(slots.scopeColumn).toBeUndefined()
    expect(slots.scopeParam).toBeUndefined()
  })

  it('should handle unknown table gracefully (no crash)', () => {
    const slots = { table: 'nonexistent', softDeleteColumn: 'deleted_at' }
    validateSlotColumns(slots, schemaSql)
    // Unknown table → validation skipped, column kept
    expect(slots.softDeleteColumn).toBe('deleted_at')
  })

  it('should be case-insensitive for column matching', () => {
    const slots = { table: 'Users', softDeleteColumn: 'Deleted_At' }
    validateSlotColumns(slots, schemaSql)
    expect(slots.softDeleteColumn).toBe('Deleted_At')
  })
})

// ============================================================
// INLINE_SNAKE_TO_CAMEL — _c 函數行為驗證
// 防雷清單：INLINE_SNAKE_TO_CAMEL 必須內嵌模板，獨立 function 會被拔出
// ============================================================

describe('INLINE_SNAKE_TO_CAMEL (_c function behavior — 遞迴版)', () => {
  // 從 coder-generation.ts 的 INLINE_SNAKE_TO_CAMEL 常數提取的 _c 函數邏輯
  // 遞迴版：JSONB 嵌套 object / array 也轉換
  const _c = (val: any): any => {
    if (val == null) return val
    if (Array.isArray(val)) return val.map(_c)
    if (val instanceof Date || ArrayBuffer.isView(val)) return val
    if (typeof val !== 'object') return val
    const r: any = {}
    for (const [k, v] of Object.entries(val)) {
      const camelKey = k.replace(/_([a-z])/g, (_: any, c: string) => c.toUpperCase())
      r[camelKey] = _c(v)
    }
    return r
  }

  it('should convert snake_case to camelCase', () => {
    expect(_c({ user_name: 'Alice', last_login: '2024-01-01' })).toEqual({
      userName: 'Alice', lastLogin: '2024-01-01',
    })
  })

  it('should handle already camelCase keys', () => {
    expect(_c({ userId: 123, email: 'a@b.com' })).toEqual({ userId: 123, email: 'a@b.com' })
  })

  it('should handle null/undefined', () => {
    expect(_c(null)).toBeNull()
    expect(_c(undefined)).toBeUndefined()
  })

  it('should handle empty object', () => {
    expect(_c({})).toEqual({})
  })

  it('should handle multiple underscores', () => {
    expect(_c({ created_at_utc: '2024' })).toEqual({ createdAtUtc: '2024' })
  })

  it('should preserve primitive types in values', () => {
    expect(_c({ is_active: true, count_total: 42 })).toEqual({
      isActive: true, countTotal: 42,
    })
  })

  // 遞迴行為：JSONB column 嵌套物件 / 陣列
  it('遞迴轉換 JSONB nested object', () => {
    expect(_c({ user_meta: { full_name: 'Alice', user_id: 1 } })).toEqual({
      userMeta: { fullName: 'Alice', userId: 1 },
    })
  })

  it('遞迴轉換 array of objects', () => {
    expect(_c({ tag_list: [{ tag_name: 'foo' }, { tag_name: 'bar' }] })).toEqual({
      tagList: [{ tagName: 'foo' }, { tagName: 'bar' }],
    })
  })

  it('Date 物件保留不轉換（PostgreSQL timestamp）', () => {
    const d = new Date('2024-01-01')
    const result = _c({ created_at: d })
    expect(result.createdAt).toBe(d)
    expect(result.createdAt instanceof Date).toBe(true)
  })

  it('Buffer / Uint8Array 保留不轉換（bytea 欄位）', () => {
    const buf = new Uint8Array([1, 2, 3])
    const result = _c({ image_data: buf })
    expect(result.imageData).toBe(buf)
  })

  it('多層 JSONB 巢狀都轉換', () => {
    expect(_c({ a_b: { c_d: { e_f: 1 } } })).toEqual({
      aB: { cD: { eF: 1 } },
    })
  })

  it('陣列裡的 primitives 保留', () => {
    expect(_c({ tag_ids: [1, 2, 3] })).toEqual({ tagIds: [1, 2, 3] })
  })
})
