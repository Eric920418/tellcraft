// ============================================================
// Search Template — ILIKE 模糊搜尋 + 分頁
// 關鍵字：模糊搜尋、關鍵字搜尋、search、ILIKE
// 典型場景：商品搜尋、文章搜尋、使用者搜尋
// - 支援多欄位 OR 搜尋
// - 自動 ILIKE '%keyword%'
// - 可選分頁（limit / offset）
// ============================================================

import { z } from 'zod'
import { INLINE_SNAKE_TO_CAMEL, buildScopeClause } from './_shared'

export const SearchSlotSchema = z.object({
  table: z.string(),
  scopeColumn: z.string().optional(),
  scopeParam: z.string().optional(),
  softDeleteColumn: z.string().optional(),
  /** 參與模糊搜尋的欄位（snake_case），多欄位為 OR 關係 */
  searchColumns: z.array(z.string()).min(1),
  /** input 上的關鍵字參數名（camelCase） */
  searchParam: z.string(),
  /** 結果欄位投影（省略則 SELECT *） */
  selectColumns: z.array(z.object({
    column: z.string(),
    alias: z.string(),
  })).optional(),
  orderBy: z.array(z.object({
    column: z.string(),
    direction: z.enum(['ASC', 'DESC']),
  })).optional(),
  /** 分頁參數名（省略則不分頁） */
  limitParam: z.string().optional(),
  offsetParam: z.string().optional(),
})

export function renderSearchTemplate(
  slots: z.infer<typeof SearchSlotSchema>,
  fnName: string,
): string {
  const tag = `// @generated-by-template: search`
  const scope = buildScopeClause(slots.scopeColumn, slots.scopeParam)

  const selectPart = slots.selectColumns
    ? slots.selectColumns.map(c => c.column === c.alias ? c.column : `${c.column} as "${c.alias}"`).join(', ')
    : '*'

  const orderPart = slots.orderBy
    ? `\n    ORDER BY ${slots.orderBy.map(o => `${o.column} ${o.direction}`).join(', ')}`
    : ''

  // ILIKE OR 組合（用 __q 暫存避免重複 interpolation）
  const ilikeClauses = slots.searchColumns.map(col => `${col} ILIKE \${__q}`).join(' OR ')

  const limitClause = slots.limitParam
    ? `\n    LIMIT \${Number(input.${slots.limitParam}) || 20}`
    : ''
  const offsetClause = slots.offsetParam
    ? `\n    OFFSET \${Number(input.${slots.offsetParam}) || 0}`
    : ''

  const softDeleteClause = slots.softDeleteColumn ? `AND ${slots.softDeleteColumn} IS NULL` : ''

  return `import { sql } from '@/lib/db'
${tag}

export async function ${fnName}(input: any) {
${scope.varDecl}
  const keyword = String(input.${slots.searchParam} ?? '').trim()
  const __q = \`%\${keyword}%\`

  const rows = keyword === ''
    ? await sql\`
        SELECT ${selectPart}
        FROM ${slots.table}
        ${scope.whereClause}
          ${softDeleteClause}${orderPart}${limitClause}${offsetClause}
      \`
    : await sql\`
        SELECT ${selectPart}
        FROM ${slots.table}
        ${scope.whereClause}
          ${softDeleteClause}
          AND (${ilikeClauses})${orderPart}${limitClause}${offsetClause}
      \`

${INLINE_SNAKE_TO_CAMEL}
  const result = rows.map(_c)
  ;(result as any).__status = 200
  return result
}`
}
