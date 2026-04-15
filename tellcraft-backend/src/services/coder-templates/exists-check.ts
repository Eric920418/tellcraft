// ============================================================
// Exists Check Template — 存在性檢查
// 關鍵字：是否存在、已註冊、已佔用、已被使用、唯一性、exists、duplicate
// 典型場景：註冊時檢查 email、建立時檢查 slug 是否重複
// 回傳：{ __status: 200, exists: boolean } 或 { __status: 409, exists: true } (negate=true + 存在視為衝突)
// ============================================================

import { z } from 'zod'

export const ExistsCheckSlotSchema = z.object({
  table: z.string(),
  /** 用於匹配的欄位（snake_case，如 'email'、'slug'） */
  column: z.string(),
  /** input 上的參數名（camelCase） */
  param: z.string(),
  /** 結果 alias（預設 exists） */
  alias: z.string().default('exists'),
  /** softDeleteColumn：有定義時，已軟刪除的記錄不計入 "存在" */
  softDeleteColumn: z.string().optional(),
  /** 排除特定 id（更新場景用，例如檢查 email 被其他 user 佔用） */
  excludeIdParam: z.string().optional(),
})

export function renderExistsCheckTemplate(
  slots: z.infer<typeof ExistsCheckSlotSchema>,
  fnName: string,
): string {
  const tag = `// @generated-by-template: exists_check`
  const excludeClause = slots.excludeIdParam
    ? `\n      AND id != \${input.${slots.excludeIdParam}}`
    : ''
  const softDeleteClause = slots.softDeleteColumn ? `\n      AND ${slots.softDeleteColumn} IS NULL` : ''

  return `import { sql } from '@/lib/db'
${tag}

export async function ${fnName}(input: any) {
  const value = input.${slots.param}
  if (value === undefined || value === null || value === '') {
    throw new Error('缺少 ${slots.param} 參數')
  }

  const rows = await sql\`
    SELECT 1 FROM ${slots.table}
    WHERE ${slots.column} = \${value}${excludeClause}${softDeleteClause}
    LIMIT 1
  \`

  return { __status: 200, ${slots.alias}: rows.length > 0 }
}`
}
