import { z } from 'zod'
import { buildScopeClause } from './_shared'

export const ExportSlotSchema = z.object({
  table: z.string(),
  scopeColumn: z.string().optional(),
  scopeParam: z.string().optional(),
  softDeleteColumn: z.string().optional(),
  selectColumns: z.array(z.object({
    column: z.string(),
    alias: z.string(),
  })),
  orderBy: z.array(z.object({
    column: z.string(),
    direction: z.enum(['ASC', 'DESC']),
  })),
  filters: z.array(z.object({
    column: z.string(),
    param: z.string(),
  })).optional(),
})

export function renderExportTemplate(
  slots: z.infer<typeof ExportSlotSchema>,
  fnName: string,
): string {
  const selectCols = slots.selectColumns.map(c =>
    c.column === c.alias ? `      ${c.column}` : `      ${c.column} as "${c.alias}"`,
  ).join(',\n')
  const orderCols = slots.orderBy.map(o => `${o.column} ${o.direction}`).join(', ')
  const filterClauses = (slots.filters || []).map(f =>
    `\n      AND ${f.column} = \${input.${f.param}}`,
  ).join('')
  const tag = `// @generated-by-template: export`
  const scope = buildScopeClause(slots.scopeColumn, slots.scopeParam)

  return `import { sql } from '@/lib/db'
${tag}

export async function ${fnName}(input: any) {
${scope.varDecl}

  const rows = await sql\`
    SELECT
${selectCols}
    FROM ${slots.table}
    ${scope.whereClause}
      ${slots.softDeleteColumn ? `AND ${slots.softDeleteColumn} IS NULL` : ''}${filterClauses}
    ORDER BY ${orderCols}
  \`
  ;(rows as any).__status = 200
  return rows
}`
}
