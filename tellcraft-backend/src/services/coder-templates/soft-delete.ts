// ============================================================
// Soft Delete Template
// 從 delete.ts 分離出的子模組。行為與原 renderDeleteTemplate
// 當 slots.softDeleteColumn 存在時的分支 byte-identical。
// 獨立後可擴充 cascadeUpdates（Phase 2）。
// ============================================================

import { z } from 'zod'
import { INLINE_SNAKE_TO_CAMEL } from './_shared'

export const SoftDeleteSlotSchema = z.object({
  table: z.string(),
  entityIdParam: z.string().default('id'),
  softDeleteColumn: z.string(),
})

export function renderSoftDeleteTemplate(
  slots: z.infer<typeof SoftDeleteSlotSchema>,
  fnName: string,
): string {
  const tag = `// @generated-by-template: delete`
  return `import { sql } from '@/lib/db'
${tag}

export async function ${fnName}(input: any) {
  const [row] = await sql\`
    UPDATE ${slots.table} SET ${slots.softDeleteColumn} = NOW(), updated_at = NOW()
    WHERE id = \${input.${slots.entityIdParam}}
    RETURNING *
  \`

${INLINE_SNAKE_TO_CAMEL}
  return { __status: 200, ..._c(row) }
}`
}
