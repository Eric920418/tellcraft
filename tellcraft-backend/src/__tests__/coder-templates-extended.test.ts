// ============================================================
// Coder Templates Extended Tests
// 測試 coder-templates/ registry 的 4 個新 template：
//   count / exists_check / search / soft-delete（內部委派）
// 每個 template 餵最小 fixture slots → render → esbuild transform 通過
// ============================================================

import { describe, it, expect } from 'vitest'
import * as esbuild from 'esbuild'
import {
  TEMPLATE_REGISTRY,
  getTemplate,
} from '../services/coder-templates'
import { renderCountTemplate, CountSlotSchema } from '../services/coder-templates/count'
import { renderExistsCheckTemplate, ExistsCheckSlotSchema } from '../services/coder-templates/exists-check'
import { renderSearchTemplate, SearchSlotSchema } from '../services/coder-templates/search'
import { renderSoftDeleteTemplate, SoftDeleteSlotSchema } from '../services/coder-templates/soft-delete'
import { renderDeleteTemplate, DeleteSlotSchema } from '../services/coder-templates/delete'

async function assertTypescriptValid(code: string, label: string) {
  try {
    await esbuild.transform(code, { loader: 'ts' })
  } catch (err) {
    throw new Error(`${label} 產出 TS 無效: ${String(err).slice(0, 500)}\n\n--- 產出代碼 ---\n${code}`, { cause: err })
  }
}

describe('coder-templates registry', () => {
  it('registry 覆蓋 13 個 operationType（10 V1 + 3 V2 擴充）', () => {
    const expectedKeys = [
      'aggregate', 'export', 'cascade', 'create', 'update', 'delete',
      'query_list', 'query_single', 'toggle', 'restore',
      'count', 'exists_check', 'search',
    ]
    for (const k of expectedKeys) {
      expect(TEMPLATE_REGISTRY).toHaveProperty(k)
    }
  })

  it('getTemplate 對 unknown operationType 回 null', () => {
    expect(getTemplate('unknown')).toBeNull()
    expect(getTemplate('auth')).toBeNull()
    expect(getTemplate('batch')).toBeNull()
  })
})

describe('count template', () => {
  it('預設參數渲染合法 TS', async () => {
    const slots = CountSlotSchema.parse({
      table: 'tasks',
      scopeColumn: 'user_id',
      scopeParam: 'userId',
    })
    const code = renderCountTemplate(slots, 'handleCountTasks')
    await assertTypescriptValid(code, 'count 預設')
    expect(code).toContain('COUNT(*)')
    expect(code).toContain('total: Number(row?.total ?? 0)')
    expect(code).toContain('@generated-by-template: count')
  })

  it('distinctColumn 觸發 COUNT(DISTINCT ...)', async () => {
    const slots = CountSlotSchema.parse({
      table: 'orders',
      distinctColumn: 'customer_id',
      alias: 'uniqueCustomers',
    })
    const code = renderCountTemplate(slots, 'handleUniqueCustomerCount')
    await assertTypescriptValid(code, 'count distinct')
    expect(code).toContain('COUNT(DISTINCT customer_id)')
    expect(code).toContain('uniqueCustomers: Number')
  })

  it('含 softDeleteColumn 過濾已刪除', async () => {
    const slots = CountSlotSchema.parse({
      table: 'tasks',
      softDeleteColumn: 'deleted_at',
    })
    const code = renderCountTemplate(slots, 'handleTaskCount')
    await assertTypescriptValid(code, 'count softDelete')
    expect(code).toContain('AND deleted_at IS NULL')
  })
})

describe('exists_check template', () => {
  it('最小參數：檢查 email 是否已註冊', async () => {
    const slots = ExistsCheckSlotSchema.parse({
      table: 'users',
      column: 'email',
      param: 'email',
    })
    const code = renderExistsCheckTemplate(slots, 'handleCheckEmailExists')
    await assertTypescriptValid(code, 'exists_check email')
    expect(code).toContain('@generated-by-template: exists_check')
    expect(code).toContain('exists: rows.length > 0')
    expect(code).toContain('WHERE email = ${value}')
    expect(code).toContain('LIMIT 1')
  })

  it('excludeIdParam 觸發更新場景的唯一性檢查', async () => {
    const slots = ExistsCheckSlotSchema.parse({
      table: 'users',
      column: 'email',
      param: 'email',
      excludeIdParam: 'id',
    })
    const code = renderExistsCheckTemplate(slots, 'handleCheckEmailExistsForUpdate')
    await assertTypescriptValid(code, 'exists_check exclude')
    expect(code).toContain('AND id != ${input.id}')
  })

  it('含 softDeleteColumn 排除已刪除記錄', async () => {
    const slots = ExistsCheckSlotSchema.parse({
      table: 'users',
      column: 'email',
      param: 'email',
      softDeleteColumn: 'deleted_at',
    })
    const code = renderExistsCheckTemplate(slots, 'handleCheckEmailExists')
    await assertTypescriptValid(code, 'exists_check softDelete')
    expect(code).toContain('AND deleted_at IS NULL')
  })
})

describe('search template', () => {
  it('單欄位 ILIKE 模糊搜尋', async () => {
    const slots = SearchSlotSchema.parse({
      table: 'products',
      searchColumns: ['name'],
      searchParam: 'keyword',
    })
    const code = renderSearchTemplate(slots, 'handleSearchProducts')
    await assertTypescriptValid(code, 'search 單欄位')
    expect(code).toContain('name ILIKE ${__q}')
    expect(code).toContain('@generated-by-template: search')
  })

  it('多欄位 OR 搜尋', async () => {
    const slots = SearchSlotSchema.parse({
      table: 'articles',
      searchColumns: ['title', 'content'],
      searchParam: 'q',
    })
    const code = renderSearchTemplate(slots, 'handleSearchArticles')
    await assertTypescriptValid(code, 'search 多欄位')
    expect(code).toContain('title ILIKE ${__q} OR content ILIKE ${__q}')
  })

  it('含分頁參數', async () => {
    const slots = SearchSlotSchema.parse({
      table: 'users',
      searchColumns: ['name', 'email'],
      searchParam: 'q',
      limitParam: 'limit',
      offsetParam: 'offset',
    })
    const code = renderSearchTemplate(slots, 'handleSearchUsers')
    await assertTypescriptValid(code, 'search 分頁')
    expect(code).toContain('LIMIT ${Number(input.limit) || 20}')
    expect(code).toContain('OFFSET ${Number(input.offset) || 0}')
  })

  it('keyword 為空時走無 ILIKE 的分支', async () => {
    const slots = SearchSlotSchema.parse({
      table: 'products',
      searchColumns: ['name'],
      searchParam: 'keyword',
    })
    const code = renderSearchTemplate(slots, 'handleSearchProducts')
    expect(code).toContain("keyword === ''")
    // 空字串分支不應包含 ILIKE 條件
    const emptyBranchIdx = code.indexOf("keyword === ''")
    const nonEmptyBranchIdx = code.indexOf(': await sql`\n        SELECT')
    expect(emptyBranchIdx).toBeLessThan(nonEmptyBranchIdx)
  })
})

describe('soft-delete template（從 delete 委派）', () => {
  it('直接呼叫 soft-delete render', async () => {
    const slots = SoftDeleteSlotSchema.parse({
      table: 'tasks',
      softDeleteColumn: 'deleted_at',
    })
    const code = renderSoftDeleteTemplate(slots, 'handleDeleteTask')
    await assertTypescriptValid(code, 'soft_delete 直接')
    expect(code).toContain('UPDATE tasks SET deleted_at = NOW()')
    expect(code).not.toContain('DELETE FROM tasks')
  })

  it('delete template 遇到 softDeleteColumn 時委派 → 輸出一致', () => {
    const deleteSlots = DeleteSlotSchema.parse({
      table: 'tasks',
      softDeleteColumn: 'deleted_at',
    })
    const softSlots = SoftDeleteSlotSchema.parse({
      table: 'tasks',
      softDeleteColumn: 'deleted_at',
    })
    const deleteCode = renderDeleteTemplate(deleteSlots, 'handleDeleteTask')
    const softCode = renderSoftDeleteTemplate(softSlots, 'handleDeleteTask')
    expect(deleteCode).toBe(softCode)
  })

  it('delete 沒有 softDeleteColumn 時走硬刪除', async () => {
    const slots = DeleteSlotSchema.parse({
      table: 'tasks',
    })
    const code = renderDeleteTemplate(slots, 'handleDeleteTask')
    await assertTypescriptValid(code, 'hard delete')
    expect(code).toContain('DELETE FROM tasks')
    expect(code).not.toContain('deleted_at')
  })
})

describe('_shared INLINE_SNAKE_TO_CAMEL 是 string literal（不是 function）', () => {
  it('從 _shared.ts 導入的 INLINE_SNAKE_TO_CAMEL 是 string', async () => {
    const { INLINE_SNAKE_TO_CAMEL } = await import('../services/coder-templates/_shared')
    expect(typeof INLINE_SNAKE_TO_CAMEL).toBe('string')
    expect(INLINE_SNAKE_TO_CAMEL).toContain('const _c = (row: any) =>')
    // 防雷：絕不能出現 export function _c 或類似 helper 宣告
    expect(INLINE_SNAKE_TO_CAMEL).not.toMatch(/function\s+_c\s*\(/)
  })
})
