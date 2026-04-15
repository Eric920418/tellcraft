import { z } from 'zod'
import { INLINE_SNAKE_TO_CAMEL } from './_shared'

export const CreateSlotSchema = z.object({
  table: z.string(),
  columns: z.array(z.object({
    column: z.string(),
    param: z.string(),
    alias: z.string(),
    defaultValue: z.string().optional(),
  })),
  scopeColumn: z.string().optional(),
  scopeParam: z.string().optional(),
})

export function renderCreateTemplate(
  slots: z.infer<typeof CreateSlotSchema>,
  fnName: string,
): string {
  const tag = `// @generated-by-template: create`
  const insertCols = slots.columns.map(c => c.column).join(', ')
  const insertVals = slots.columns.map(c =>
    c.defaultValue ? c.defaultValue : `\${input.${c.param}}`,
  ).join(', ')

  return `import { sql } from '@/lib/db'
${tag}

export async function ${fnName}(input: any) {
  const [row] = await sql\`
    INSERT INTO ${slots.table} (${insertCols}, created_at, updated_at)
    VALUES (${insertVals}, NOW(), NOW())
    RETURNING *
  \`

${INLINE_SNAKE_TO_CAMEL}
  return { __status: 201, ..._c(row) }
}`
}
