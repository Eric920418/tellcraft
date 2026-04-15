import { z } from 'zod'
import { INLINE_SNAKE_TO_CAMEL } from './_shared'

export const UpdateSlotSchema = z.object({
  table: z.string(),
  entityIdParam: z.string().default('id'),
  scopeColumn: z.string().optional(),
  scopeParam: z.string().optional(),
  updateColumns: z.array(z.object({
    column: z.string(),
    param: z.string(),
    alias: z.string(),
  })),
})

export function renderUpdateTemplate(
  slots: z.infer<typeof UpdateSlotSchema>,
  fnName: string,
): string {
  const tag = `// @generated-by-template: update`
  const setClauses = slots.updateColumns.map(c => `${c.column} = \${input.${c.param}}`).join(', ')

  return `import { sql } from '@/lib/db'
${tag}

export async function ${fnName}(input: any) {
  const existing = await sql\`SELECT * FROM ${slots.table} WHERE id = \${input.${slots.entityIdParam}}\`
  if (existing.length === 0) throw new Error('不存在或不屬於當前使用者')

  const [row] = await sql\`
    UPDATE ${slots.table} SET ${setClauses}, updated_at = NOW()
    WHERE id = \${input.${slots.entityIdParam}}
    RETURNING *
  \`

${INLINE_SNAKE_TO_CAMEL}
  return { __status: 200, ..._c(row) }
}`
}
