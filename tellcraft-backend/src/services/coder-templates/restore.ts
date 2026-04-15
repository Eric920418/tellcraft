import { z } from 'zod'
import { INLINE_SNAKE_TO_CAMEL } from './_shared'

export const RestoreSlotSchema = z.object({
  table: z.string(),
  entityIdParam: z.string().default('id'),
  scopeColumn: z.string().optional(),
  scopeParam: z.string().optional(),
})

export function renderRestoreTemplate(
  slots: z.infer<typeof RestoreSlotSchema>,
  fnName: string,
): string {
  const tag = `// @generated-by-template: restore`

  return `import { sql } from '@/lib/db'
${tag}

export async function ${fnName}(input: any) {
  const entityId = input.${slots.entityIdParam}
  if (!entityId) throw new Error('缺少 ID 參數')

  const [existing] = await sql\`
    SELECT * FROM ${slots.table}
    WHERE id = \${entityId}
      AND deleted_at IS NOT NULL
  \`
  if (!existing) throw new Error('該記錄未被刪除或不存在')

  const [row] = await sql\`
    UPDATE ${slots.table}
    SET deleted_at = NULL, updated_at = NOW()
    WHERE id = \${entityId}
    RETURNING *
  \`

${INLINE_SNAKE_TO_CAMEL}
  return { __status: 200, ..._c(row) }
}`
}
