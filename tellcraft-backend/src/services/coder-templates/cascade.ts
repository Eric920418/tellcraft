import { z } from 'zod'
import { INLINE_SNAKE_TO_CAMEL, buildScopeClause } from './_shared'

export const CascadeSlotSchema = z.object({
  parentTable: z.string(),
  childTable: z.string(),
  fkColumn: z.string(),
  scopeColumn: z.string().optional(),
  scopeParam: z.string().optional(),
  entityIdParam: z.string().default('id'),
  defaultEntityQuery: z.string().optional(),
  defaultEntityTable: z.string().optional(),
  softDeleteColumn: z.string().optional(),
})

export function renderCascadeTemplate(
  slots: z.infer<typeof CascadeSlotSchema>,
  fnName: string,
): string {
  const tag = `// @generated-by-template: cascade`
  const scope = buildScopeClause(slots.scopeColumn, slots.scopeParam)
  const defaultLookup = slots.defaultEntityQuery && slots.defaultEntityTable
    ? `
    const [defaultEntity] = await tx\`SELECT id FROM ${slots.defaultEntityTable} WHERE ${slots.defaultEntityQuery} LIMIT 1\`
    const fallbackId = defaultEntity?.id || null`
    : `
    const fallbackId = null`

  return `import { sql } from '@/lib/db'
${tag}

export async function ${fnName}(input: any) {
  const ${slots.entityIdParam} = input.${slots.entityIdParam}
${scope.varDecl}

  const result = await sql.begin(async (tx: any) => {
    const [parent] = await tx\`
      ${slots.softDeleteColumn
        ? `UPDATE ${slots.parentTable} SET ${slots.softDeleteColumn} = NOW(), updated_at = NOW()`
        : `DELETE FROM ${slots.parentTable}`}
      WHERE id = \${${slots.entityIdParam}}
      RETURNING *
    \`
    if (!parent) throw new Error('找不到資料')
${defaultLookup}

    await tx\`
      UPDATE ${slots.childTable} SET ${slots.fkColumn} = \${fallbackId}, updated_at = NOW()
      WHERE ${slots.fkColumn} = \${${slots.entityIdParam}}
    \`
    return parent
  })

${INLINE_SNAKE_TO_CAMEL}
  return { __status: 200, ..._c(result) }
}`
}
