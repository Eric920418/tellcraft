import { z } from 'zod'
import { INLINE_SNAKE_TO_CAMEL } from './_shared'
import { renderSoftDeleteTemplate } from './soft-delete'

export const DeleteSlotSchema = z.object({
  table: z.string(),
  entityIdParam: z.string().default('id'),
  scopeColumn: z.string().optional(),
  scopeParam: z.string().optional(),
  softDeleteColumn: z.string().optional(),
})

export function renderDeleteTemplate(
  slots: z.infer<typeof DeleteSlotSchema>,
  fnName: string,
): string {
  // Schema 有 softDeleteColumn → 委派給 soft-delete 模組（行為不變，便於獨立演進）
  if (slots.softDeleteColumn) {
    return renderSoftDeleteTemplate(
      {
        table: slots.table,
        entityIdParam: slots.entityIdParam,
        softDeleteColumn: slots.softDeleteColumn,
      },
      fnName,
    )
  }

  const tag = `// @generated-by-template: delete`
  return `import { sql } from '@/lib/db'
${tag}

export async function ${fnName}(input: any) {
  const [row] = await sql\`
    DELETE FROM ${slots.table}
    WHERE id = \${input.${slots.entityIdParam}}
    RETURNING *
  \`

${INLINE_SNAKE_TO_CAMEL}
  return { __status: 200, ..._c(row) }
}`
}
