// ============================================================
// Deterministic Fixes Unit Tests
// 測試三類零 LLM 機械修復：missing_column / wrong_status / field_naming
// ============================================================

import { describe, it, expect } from 'vitest'
import { tryFixMissingColumn } from '../services/coder-deterministic-fixes/missing-column'
import { tryFixWrongStatus } from '../services/coder-deterministic-fixes/wrong-status'
import { tryFixFieldNaming } from '../services/coder-deterministic-fixes/field-naming'
import type { DeterministicFixContext } from '../services/coder-deterministic-fixes'

const BASE_CTX: Omit<DeterministicFixContext, 'error' | 'schemaSql' | 'featureContent'> = {
  actionName: 'testAction',
}

describe('tryFixMissingColumn', () => {
  const schema = `
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  title TEXT,
  dueDate TIMESTAMPTZ,
  status TEXT,
  createdAt TIMESTAMPTZ
);`

  it('snake_case → camelCase 映射', () => {
    const code = `
const rows = await sql\`
  SELECT id, title, due_date, status
  FROM tasks
  WHERE due_date < NOW()
\`
`
    const result = tryFixMissingColumn(code, {
      ...BASE_CTX,
      schemaSql: schema,
      error: 'column "due_date" does not exist',
    })
    expect(result).not.toBeNull()
    expect(result!.strategy).toBe('snake_to_camel')
    expect(result!.fixedCode).toContain('dueDate')
    expect(result!.fixedCode).not.toContain('due_date')
  })

  it('camelCase → snake_case 映射', () => {
    const snakeSchema = `CREATE TABLE users (id UUID, user_name TEXT);`
    const code = `SELECT userName FROM users`
    const result = tryFixMissingColumn(code, {
      ...BASE_CTX,
      schemaSql: snakeSchema,
      error: 'column "userName" does not exist',
    })
    expect(result).not.toBeNull()
    expect(result!.strategy).toBe('camel_to_snake')
    expect(result!.fixedCode).toContain('user_name')
  })

  it('deleted_at 不存在 → 移除 soft delete 條件', () => {
    const code = `
const rows = await sql\`
  SELECT * FROM tasks
  WHERE user_id = \${userId}
    AND deleted_at IS NULL
\`
`
    const result = tryFixMissingColumn(code, {
      ...BASE_CTX,
      schemaSql: schema,
      error: 'column "deleted_at" does not exist',
    })
    expect(result).not.toBeNull()
    expect(result!.strategy).toBe('remove_soft_delete_clause')
    expect(result!.fixedCode).not.toContain('deleted_at IS NULL')
  })

  it('中文錯誤訊息「欄位 X 不存在」也能解析', () => {
    const code = `SELECT due_date FROM tasks`
    const result = tryFixMissingColumn(code, {
      ...BASE_CTX,
      schemaSql: schema,
      error: '欄位 due_date 不存在',
    })
    expect(result).not.toBeNull()
    expect(result!.fixedCode).toContain('dueDate')
  })

  it('Levenshtein fuzzy match（拼字錯誤 ≤ 2）', () => {
    // createdat 距 createdAt = 1 (大小寫 A vs a)；snake_to_camel 已先命中 created_at ↔ createdAt
    // 所以這裡用一個距離 1 的獨立錯誤（createdtAt 距 createdAt = 1）
    const code = `SELECT createdtAt FROM tasks`
    const result = tryFixMissingColumn(code, {
      ...BASE_CTX,
      schemaSql: schema,
      error: 'column "createdtAt" does not exist',
    })
    expect(result).not.toBeNull()
    expect(result!.strategy).toContain('fuzzy_match:createdAt')
    expect(result!.fixedCode).toContain('createdAt')
  })

  it('無法找到替代 → 回 null', () => {
    const result = tryFixMissingColumn('SELECT completely_unrelated_column FROM tasks', {
      ...BASE_CTX,
      schemaSql: schema,
      error: 'column "completely_unrelated_column" does not exist',
    })
    expect(result).toBeNull()
  })
})

describe('tryFixWrongStatus', () => {
  it('中文「預期 201」覆寫 inline object __status', () => {
    const code = `return { __status: 200, id: row.id }`
    const result = tryFixWrongStatus(code, {
      ...BASE_CTX,
      schemaSql: '',
      error: 'HTTP 狀態碼不匹配，預期 201，實際 200',
    })
    expect(result).not.toBeNull()
    expect(result!.fixedCode).toContain('__status: 201')
    expect(result!.fixedCode).not.toContain('__status: 200')
  })

  it('英文「expected 401」覆寫 (result as any).__status', () => {
    const code = `;(result as any).__status = 200`
    const result = tryFixWrongStatus(code, {
      ...BASE_CTX,
      schemaSql: '',
      error: 'expected 401 but got 200',
    })
    expect(result).not.toBeNull()
    expect(result!.fixedCode).toContain('__status = 401')
  })

  it('完全沒 __status → 注入到 return 物件', () => {
    const code = `return { id: 'abc', name: 'foo' }`
    const result = tryFixWrongStatus(code, {
      ...BASE_CTX,
      schemaSql: '',
      error: '預期 201',
    })
    expect(result).not.toBeNull()
    expect(result!.fixedCode).toContain('__status: 201')
  })

  it('無法從 error 提取預期 status → 回 null', () => {
    const result = tryFixWrongStatus('return { __status: 200 }', {
      ...BASE_CTX,
      schemaSql: '',
      error: 'some unrelated error',
    })
    expect(result).toBeNull()
  })
})

describe('tryFixFieldNaming', () => {
  const feature = `
Feature: 查詢任務
  Scenario: 成功查詢
    When 查詢任務, call table:
      | id    |
      | $id   |
    Then 查詢任務(200)回應, with table:
      | dueDate | createdAt |
      | <a>     | <b>       |
`

  it('spread row 且沒 _c() → 注入 _c() 轉換', () => {
    const code = `
async function handleGetTask(input: any) {
  const [row] = await sql\`SELECT * FROM tasks WHERE id = \${input.id}\`
  return { __status: 200, ...row }
}`
    const result = tryFixFieldNaming(code, {
      ...BASE_CTX,
      schemaSql: '',
      error: '值不匹配',
      featureContent: feature,
    })
    expect(result).not.toBeNull()
    expect(result!.strategy).toContain('spread_row_with_underscore_c')
    expect(result!.fixedCode).toContain('..._c(row)')
    expect(result!.fixedCode).toContain('const _c = (row: any)')
  })

  it('已有 _c() → 不重複注入', () => {
    const code = `
async function handleGetTask(input: any) {
  const [row] = await sql\`SELECT * FROM tasks WHERE id = \${input.id}\`
  const _c = (r: any) => r
  return { __status: 200, ..._c(row) }
}`
    const result = tryFixFieldNaming(code, {
      ...BASE_CTX,
      schemaSql: '',
      error: '值不匹配',
      featureContent: feature,
    })
    // 已有 _c() → 不走 case A，可能走 case B；此測試確認不會改動 spread
    if (result) {
      expect(result.fixedCode.match(/..._c\(row\)/g)?.length).toBe(1)
    }
  })

  it('無 feature content → 回 null（無從得知期望欄位）', () => {
    const result = tryFixFieldNaming('return { ...row }', {
      ...BASE_CTX,
      schemaSql: '',
      error: '值不匹配',
    })
    expect(result).toBeNull()
  })
})
