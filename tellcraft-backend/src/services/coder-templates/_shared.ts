// ============================================================
// Coder Templates — 共用工具
// 單一來源：INLINE_SNAKE_TO_CAMEL、buildScopeClause、OperationType
// ============================================================

/**
 * inline snakeToCamel 代碼片段
 *
 * ⚠️ 必須是 string literal export，絕不可變成 helper function。
 * composeActionFunction 會掃描 helper function 並提取到外層，
 * 如果 _c 被提取，template 內的 `_c(row)` 在 runtime 會 undefined。
 *
 * 驗證：`coder-generation-rules.test.ts` 斷言 composeActionFunction 輸出不含 `function _c`
 */
export const INLINE_SNAKE_TO_CAMEL = `  const _c = (row: any) => {
    if (!row) return row
    const r: any = {}
    for (const [k, v] of Object.entries(row)) r[k.replace(/_([a-z])/g, (_: any, c: string) => c.toUpperCase())] = v
    return r
  }`

/** 根據 scope 欄位生成 SQL WHERE 片段 + 變數宣告 */
export function buildScopeClause(
  scopeColumn?: string,
  scopeParam?: string,
): { varDecl: string; whereClause: string; andClause: string } {
  if (scopeColumn && scopeParam) {
    return {
      varDecl: `  const ${scopeParam} = input.${scopeParam}`,
      whereClause: `WHERE ${scopeColumn} = \${${scopeParam}}`,
      andClause: `AND ${scopeColumn} = \${${scopeParam}}`,
    }
  }
  // 無 scope → 嘗試用 userId（Server Action 注入）
  return {
    varDecl: `  const userId = input.userId`,
    whereClause: `WHERE user_id = \${userId}`,
    andClause: `AND user_id = \${userId}`,
  }
}

// ============================================================
// 子操作類型（與 coder-generation.ts 的 SubOperation['operationType'] 保持一致）
// ============================================================

export type CoreOperationType =
  | 'create'
  | 'update'
  | 'delete'
  | 'query_list'
  | 'query_single'
  | 'toggle'
  | 'restore'
  | 'aggregate'
  | 'cascade'
  | 'export'
  | 'auth'
  | 'batch'
  | 'unknown'

/** Phase 1 新增的 operationType（只有 CODER_TEMPLATE_V2=true 時會被推斷） */
export type ExtendedOperationType =
  | 'count'
  | 'exists_check'
  | 'search'

export type OperationType = CoreOperationType | ExtendedOperationType

/** Template registry entry 介面 */
export interface SubOperationContext {
  summary: string
  operationType: OperationType
  relevantGherkin: string
  requiredResponseFields: string[]
  actionRules: Array<{ rule: string; type: string; step: string }>
}
