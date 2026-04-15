import { z } from 'zod'
import { INLINE_SNAKE_TO_CAMEL, buildScopeClause } from './_shared'

export const QueryListSlotSchema = z.object({
  table: z.string(),
  scopeColumn: z.string().optional(),
  scopeParam: z.string().optional(),
  softDeleteColumn: z.string().optional(),
  selectColumns: z.array(z.object({
    column: z.string(),
    alias: z.string(),
  })).optional(),
  orderBy: z.array(z.object({
    column: z.string(),
    direction: z.enum(['ASC', 'DESC']),
  })).optional(),
  filters: z.array(z.object({
    column: z.string(),
    operator: z.enum(['=', '!=', '<', '>', '<=', '>=', 'IS NULL', 'IS NOT NULL']),
    param: z.string().optional(),
    literal: z.string().optional(),
  })).optional(),
})

export function renderQueryListTemplate(
  slots: z.infer<typeof QueryListSlotSchema>,
  fnName: string,
): string {
  const tag = `// @generated-by-template: query_list`
  const selectPart = slots.selectColumns
    ? slots.selectColumns.map(c => c.column === c.alias ? c.column : `${c.column} as "${c.alias}"`).join(', ')
    : '*'
  const orderPart = slots.orderBy ? `\n    ORDER BY ${slots.orderBy.map(o => `${o.column} ${o.direction}`).join(', ')}` : ''
  const scope = buildScopeClause(slots.scopeColumn, slots.scopeParam)

  // 動態篩選條件
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

  const rows = await sql\`
    SELECT ${selectPart}
    FROM ${slots.table}
    ${scope.whereClause}
      ${slots.softDeleteColumn ? `AND ${slots.softDeleteColumn} IS NULL` : ''}${filterClause}${orderPart}
  \`

${INLINE_SNAKE_TO_CAMEL}
  const result = rows.map(_c)
  ;(result as any).__status = 200
  return result
}`
}
