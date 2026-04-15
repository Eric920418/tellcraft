import { z } from 'zod'
import { buildScopeClause } from './_shared'

export const AggregateSlotSchema = z.object({
  table: z.string(),
  scopeColumn: z.string().optional(),
  scopeParam: z.string().optional(),
  dateColumn: z.string().optional(),
  dateParam: z.string().optional(),
  dateGranularity: z.enum(['month', 'day', 'year']).default('month'),
  softDeleteColumn: z.string().optional(),
  aggregations: z.array(z.object({
    fn: z.enum(['SUM', 'COUNT', 'AVG']),
    column: z.string(),
    condition: z.string().optional(),
    alias: z.string(),
  })),
  groupBy: z.array(z.object({
    column: z.string(),
    alias: z.string(),
  })).optional(),
})

export function renderAggregateTemplate(
  slots: z.infer<typeof AggregateSlotSchema>,
  fnName: string,
): string {
  const selectClauses = slots.aggregations.map(a => {
    const expr = a.condition
      ? `CASE WHEN ${a.condition} THEN ${a.column} ELSE 0 END`
      : a.column
    return `      COALESCE(${a.fn}(${expr}), 0) as "${a.alias}"`
  })

  const groupByCols = (slots.groupBy || []).map(g => `      ${g.column} as "${g.alias}"`)
  const allSelect = [...groupByCols, ...selectClauses].join(',\n')
  const groupByClause = slots.groupBy ? `\n    GROUP BY ${slots.groupBy.map(g => g.column).join(', ')}` : ''
  const dateFilter = slots.dateColumn && slots.dateParam
    ? `\n      AND date_trunc('${slots.dateGranularity}', ${slots.dateColumn}) = date_trunc('${slots.dateGranularity}', \${${slots.dateParam}}::date)`
    : ''

  const tag = `// @generated-by-template: aggregate`
  const scope = buildScopeClause(slots.scopeColumn, slots.scopeParam)

  if (slots.groupBy) {
    return `import { sql } from '@/lib/db'
${tag}

export async function ${fnName}(input: any) {
${scope.varDecl}
${slots.dateParam ? `  const ${slots.dateParam} = input.${slots.dateParam}\n` : ''}
  const rows = await sql\`
    SELECT
${allSelect}
    FROM ${slots.table}
    ${scope.whereClause}
      ${slots.softDeleteColumn ? `AND ${slots.softDeleteColumn} IS NULL` : ''}${dateFilter}${groupByClause}
  \`
  const result = rows.map((r: any) => ({
    ${[...(slots.groupBy || []).map(g => `${g.alias}: r.${g.alias}`), ...slots.aggregations.map(a => `${a.alias}: Number(r.${a.alias})`)].join(',\n    ')}
  }))
  ;(result as any).__status = 200
  return result
}`
  }

  return `import { sql } from '@/lib/db'
${tag}

export async function ${fnName}(input: any) {
${scope.varDecl}
${slots.dateParam ? `  const ${slots.dateParam} = input.${slots.dateParam}\n` : ''}
  const rows = await sql\`
    SELECT
${allSelect}
    FROM ${slots.table}
    ${scope.whereClause}
      ${slots.softDeleteColumn ? `AND ${slots.softDeleteColumn} IS NULL` : ''}${dateFilter}
  \`
  const row = rows[0] || {}
  return {
    __status: 200,
    ${slots.aggregations.map(a => `${a.alias}: Number(row.${a.alias} ?? 0)`).join(',\n    ')}
  }
}`
}
