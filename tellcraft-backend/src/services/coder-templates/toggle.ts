import { z } from 'zod'
import { INLINE_SNAKE_TO_CAMEL } from './_shared'

export const ToggleSlotSchema = z.object({
  table: z.string(),
  entityIdParam: z.string().default('id'),
  toggleColumn: z.string(),
  scopeColumn: z.string().optional(),
  scopeParam: z.string().optional(),
  softDeleteColumn: z.string().optional(),
})

export function renderToggleTemplate(
  slots: z.infer<typeof ToggleSlotSchema>,
  fnName: string,
): string {
  const tag = `// @generated-by-template: toggle`

  return `import { sql } from '@/lib/db'
${tag}

export async function ${fnName}(input: any) {
  const entityId = input.${slots.entityIdParam}
  if (!entityId) throw new Error('缺少 ID 參數')

  const [existing] = await sql\`
    SELECT * FROM ${slots.table}
    WHERE id = \${entityId}
      ${slots.softDeleteColumn ? `AND ${slots.softDeleteColumn} IS NULL` : ''}
  \`
  if (!existing) throw new Error('不存在或已被刪除')

  const [row] = await sql\`
    UPDATE ${slots.table}
    SET ${slots.toggleColumn} = NOT ${slots.toggleColumn}, updated_at = NOW()
    WHERE id = \${entityId}
    RETURNING *
  \`

${INLINE_SNAKE_TO_CAMEL}
  return { __status: 200, ..._c(row) }
}`
}
