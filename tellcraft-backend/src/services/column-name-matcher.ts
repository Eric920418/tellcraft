// ============================================================
// Column Name Matcher — 統一 fieldName → schema column 比對邏輯
//
// **動機**：R5 Fix B 在 red-phase-validator.ts:529 加了 VAR 序列化命名解構
// （剝 `<entity><seq><Field>` 拿尾段 PascalCase 比對 schema），但只修了「Response
// 欄位可達性」這 1 處，**其他 4 處同模式 column matching 完全沒掃齊**：
//
//   - red-phase-validator.ts:160 fieldMatchesAnyColumn（Response 欄位用，本來就有）
//   - red-phase-validator.ts:371 findColumnInTable（entity_setup DataTable Check 9）
//   - feature-alignment-gate.ts:854 entity_column_coverage（Check 2）
//   - feature-alignment-gate.ts:1683 Check 16 field variant
//   - feature-dry-run.ts:428 entity_validate 執行期
//
// 結果：CMS 場景大量用 VAR `>AdminUser1.id` 宣告 → DataTable header 變
// `adminUser1Id`（entity+seq+Field 序列化），上述 4 處死板比對 → 99% false positive
// 雜訊（conversation b2252efc 106 個 error 多數來自這層）。
//
// **此 helper 是 single source of truth** — 5 處 caller 改用同一個 function，
// 從源頭保證 VAR 解構在所有 column matching 點位一致。CLAUDE.md R5.1 事件明確
// 警告「抽 helper 兩邊 import 共用，從 source 層保證不漏接」，本檔即實踐。
// ============================================================

export interface ColumnLike {
  name: string
}

/**
 * 把 camelCase / mixed → snake_case lowercase
 * 與 red-phase-validator.ts:148 / feature-alignment-gate.ts:112 既有實作一致
 */
export function toSnakeCase(s: string): string {
  return s.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()
}

/**
 * 把 snake_case → camelCase（保留大小寫）
 * 與 red-phase-validator.ts:152 / feature-alignment-gate.ts:116 既有實作一致
 */
export function toCamelCase(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

/**
 * 把 fieldName 攤平成所有可能對應 schema column 的 candidate name（小寫）
 *
 * 4 種解構策略：
 *   1. 原始 lowercase
 *   2. snake_case lowercase（camelCase → snake）
 *   3. camelCase lowercase（snake_case → camel）
 *   4. VAR 剝尾段（`<entity><seq><Field>`）→ 抓 PascalCase field → 上述三變體
 *   5. 單 entity prefix（`<entity><Field>`，沒 seq）→ 抓 PascalCase field → 上述三變體
 *
 * 範例：
 *   - "adminUser1Id"   → ["adminuser1id", "admin_user1id", "id"]
 *   - "plan2Title"     → ["plan2title", "title", "plan2_title"]
 *   - "category1Name"  → ["category1name", "name", "category1_name"]
 *   - "planId"         → ["planid", "plan_id", "id"]
 *   - "user_email"     → ["user_email", "useremail"]
 *
 * 全部 lowercase 方便跟 column.name.toLowerCase() set 比對
 */
export function expandFieldCandidates(fieldName: string): string[] {
  const candidates = new Set<string>()
  const trimmed = fieldName.trim()
  if (!trimmed) return []

  candidates.add(trimmed.toLowerCase())
  candidates.add(toSnakeCase(trimmed).toLowerCase())
  candidates.add(toCamelCase(trimmed).toLowerCase())

  // VAR 命名解構：抓最後一段 PascalCase（或多段連續 PascalCase）作為 field
  //   adminUser1Id     → "Id"         → "id"
  //   plan2Title       → "Title"      → "title"
  //   article1CategoryId → "CategoryId" → "category_id" / "categoryid"（保留 composite）
  //   userEmail        → "Email"      → "email"（單 entity prefix，無 seq）
  //
  // 策略：找「最後一段 lowercase / digit 之後接 PascalCase」的分界點
  //   - adminUser1Id : 分界在 1|I，PascalCase 尾段 = "Id"
  //   - userEmail    : 分界在 r|E，PascalCase 尾段 = "Email"
  //   - article1CategoryId : 分界在 1|C，PascalCase 尾段 = "CategoryId"
  //   - id / email   : 無分界（沒前綴），不再解構
  const tailMatch = trimmed.match(/(?:[a-z]|\d)([A-Z][a-zA-Z0-9]*)$/)
  if (tailMatch) {
    const fieldSuffix = tailMatch[1].charAt(0).toLowerCase() + tailMatch[1].slice(1)
    candidates.add(fieldSuffix.toLowerCase())
    candidates.add(toSnakeCase(fieldSuffix).toLowerCase())
    candidates.add(toCamelCase(fieldSuffix).toLowerCase())

    // 若 fieldSuffix 自己仍是 composite（如 CategoryId → category_id），也加最內層
    //   CategoryId → "Id" → "id"，覆蓋「FK 命名指向 PK」場景
    const innerMatch = fieldSuffix.match(/(?:[a-z]|\d)([A-Z][a-zA-Z0-9]*)$/)
    if (innerMatch) {
      const innerSuffix = innerMatch[1].charAt(0).toLowerCase() + innerMatch[1].slice(1)
      candidates.add(innerSuffix.toLowerCase())
      candidates.add(toSnakeCase(innerSuffix).toLowerCase())
    }
  }

  return Array.from(candidates)
}

/**
 * 判斷 fieldName 是否能對應 columns 中任一 column name
 *
 * 接受：
 *   - `Iterable<string>`（column 名字列）
 *   - `Iterable<ColumnLike>`（含 `.name`）
 *   - `Set<string>`（直接比對）
 */
export function fieldMatchesAnyColumn(
  fieldName: string,
  columns: Iterable<string | ColumnLike> | Set<string>,
): boolean {
  const candidates = expandFieldCandidates(fieldName)
  if (candidates.length === 0) return false

  const columnSet = new Set<string>()
  for (const c of columns) {
    const name = typeof c === 'string' ? c : c.name
    columnSet.add(name.toLowerCase())
  }
  return candidates.some(c => columnSet.has(c))
}

/**
 * 判斷 fieldName 是否在指定 table 中
 * 等價於 fieldMatchesAnyColumn(fieldName, table.columns)
 */
export function columnExistsInTable(
  fieldName: string,
  table: { columns: ColumnLike[] },
): boolean {
  return fieldMatchesAnyColumn(fieldName, table.columns)
}
