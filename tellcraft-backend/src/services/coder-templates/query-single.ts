import { z } from 'zod'
import { INLINE_SNAKE_TO_CAMEL } from './_shared'

export const QuerySingleSlotSchema = z.object({
  table: z.string(),
  entityIdParam: z.string().default('id'),
  scopeColumn: z.string().optional(),
  scopeParam: z.string().optional(),
  softDeleteColumn: z.string().optional(),
})

export function renderQuerySingleTemplate(
  slots: z.infer<typeof QuerySingleSlotSchema>,
  fnName: string,
): string {
  const tag = `// @generated-by-template: query_single`

  return `import { sql } from '@/lib/db'
${tag}

export async function ${fnName}(input: any) {
  const entityId = input.${slots.entityIdParam}
  if (!entityId) throw new Error('缺少 ID 參數')

  const [row] = await sql\`
    SELECT * FROM ${slots.table}
    WHERE id = \${entityId}
      ${slots.softDeleteColumn ? `AND ${slots.softDeleteColumn} IS NULL` : ''}
  \`
  if (!row) throw new Error('找不到資料')

${INLINE_SNAKE_TO_CAMEL}
  return { __status: 200, ..._c(row) }
}`
}
