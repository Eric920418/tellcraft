// ============================================================
// Count Template — 計數 / 總筆數
// 關鍵字：幾筆、幾個、數量、有多少、count、total
// 回傳：{ __status: 200, total: number }
// ============================================================

import { z } from 'zod'
import { buildScopeClause } from './_shared'

export const CountSlotSchema = z.object({
  table: z.string(),
  scopeColumn: z.string().optional(),
  scopeParam: z.string().optional(),
  softDeleteColumn: z.string().optional(),
  /** 結果 alias（預設 total） */
  alias: z.string().default('total'),
  /** DISTINCT 欄位（可選，用於去重計數） */
  distinctColumn: z.string().optional(),
  /** 額外過濾條件 */
  filters: z.array(z.object({
    column: z.string(),
    operator: z.enum(['=', '!=', '<', '>', '<=', '>=', 'IS NULL', 'IS NOT NULL']),
    param: z.string().optional(),
    literal: z.string().optional(),
  })).optional(),
})

export function renderCountTemplate(
  slots: z.infer<typeof CountSlotSchema>,
  fnName: string,
): string {
  const tag = `// @generated-by-template: count`
  const scope = buildScopeClause(slots.scopeColumn, slots.scopeParam)
  const countExpr = slots.distinctColumn ? `COUNT(DISTINCT ${slots.distinctColumn})` : 'COUNT(*)'

  const filterParts: string[] = []
  if (slots.filters && slots.filters.length > 0) {
    for (const f of slots.filters) {
      if (f.operator === 'IS NULL' || f.operator === 'IS NOT NULL') {
        filterParts.push(`AND ${f.column} ${f.operator}`)
      } else if (f.literal) {
        filterParts.push(`AND ${f.column} ${f.operator} ${f.literal}`)
      } else if (f.param) {
        filterParts.push(`AND ${f.column} ${f.operator} \${input.${f.param}}`)
      }
    }
  }
  const filterClause = filterParts.length > 0 ? '\n      ' + filterParts.join('\n      ') : ''

  return `import { sql } from '@/lib/db'
${tag}

export async function ${fnName}(input: any) {
${scope.varDecl}

  const [row] = await sql\`
    SELECT ${countExpr} as "${slots.alias}"
    FROM ${slots.table}
    ${scope.whereClause}
      ${slots.softDeleteColumn ? `AND ${slots.softDeleteColumn} IS NULL` : ''}${filterClause}
  \`

  return { __status: 200, ${slots.alias}: Number(row?.${slots.alias} ?? 0) }
}`
}
