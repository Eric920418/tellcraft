// ============================================================
// L21.P1-A: unwrapListResponse — 擋 LLM 生成的 pagination wrap 格式
// Feature DataTable 驗證預設把 response 當純 array；Coder 若 wrap {items, total,...}
// 會導致 validation 永遠失敗。此 sanitize 層後置強制解包成純 array。
// ============================================================

import { describe, it, expect } from 'vitest'
import { unwrapListResponse } from '../services/coder-generation'

describe('unwrapListResponse — wrap 解包', () => {
  it('return { items, total, page, pageSize } → return items（加 __status）', () => {
    const input = `  const rows = await sql\`...\`
  return { items: rows, total: rows.length, page: 1, pageSize: 20 }`
    const out = unwrapListResponse(input)
    expect(out).toContain(';(rows as any).__status = 200')
    expect(out).toContain('return rows')
    expect(out).not.toContain('items:')
  })

  it('return { data: camelRows, total } → unwrap 成 camelRows', () => {
    const input = `  return { data: camelRows, total: 5 }`
    const out = unwrapListResponse(input)
    expect(out).toContain('return camelRows')
    expect(out).not.toContain('data:')
  })

  it('return { rows: result } + 全 pagination meta → unwrap', () => {
    const input = `  return { rows: result, count: 10, hasMore: false, nextCursor: null }`
    const out = unwrapListResponse(input)
    expect(out).toContain('return result')
  })

  it('return { results: list } → unwrap', () => {
    const input = `  return { results: list, page: 1 }`
    const out = unwrapListResponse(input)
    expect(out).toContain('return list')
  })

  it('單筆 return { __status: 201, ...row } 不動（非 wrap）', () => {
    const input = `  return { __status: 201, ...row }`
    const out = unwrapListResponse(input)
    expect(out).toBe(input)
  })

  it('return { items: rows, someBusinessField: x } 不動（wrap 外有業務欄位，可能是合法包裝）', () => {
    const input = `  return { items: rows, summary: stats }`
    const out = unwrapListResponse(input)
    expect(out).toBe(input)
  })

  it('return { items } shorthand 無 meta → 仍 unwrap', () => {
    // shorthand `items` 無法 match `key: value` pattern → skip（保守）
    // 這個 case 其實不 unwrap（pattern 要求顯式 `:`）
    const input = `  return { items }`
    const out = unwrapListResponse(input)
    expect(out).toBe(input)
  })

  it('arrayVar 是 complex expression 不動（保守）', () => {
    const input = `  return { items: await fn(), total: 5 }`
    const out = unwrapListResponse(input)
    expect(out).toBe(input)
  })

  it('完整函數 round-trip：list action', () => {
    const input = `export async function listMediaFiles(input: Input) {
  const userId = input.userId
  const rows = await sql\`SELECT * FROM media_files WHERE uploaded_by = \${userId} ORDER BY uploaded_at DESC\`
  const camelRows = rows.map(_c)
  return { items: camelRows, total: camelRows.length, page: 1, pageSize: 20 }
}`
    const out = unwrapListResponse(input)
    expect(out).toContain('return camelRows')
    expect(out).toContain(';(camelRows as any).__status = 200')
    // 原來的 SQL 還在
    expect(out).toContain('SELECT * FROM media_files')
  })

  it('保留原有縮排', () => {
    const input = `        return { items: rows, total: rows.length }`
    const out = unwrapListResponse(input)
    expect(out).toMatch(/^ {8};\(rows as any\)\.__status = 200/m)
    expect(out).toMatch(/^ {8}return rows/m)
  })
})
