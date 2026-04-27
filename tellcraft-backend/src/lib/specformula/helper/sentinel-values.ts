/**
 * SpecFormula sentinel value 統一過濾（L28.B）
 *
 * Feature DataTable 的某些 cell 不是「資料值」而是「驗證標記」/「VAR 系統指令」。
 * 處理 cell 值（轉型、塞 SQL、查 DB 等）之前必須過濾掉這些 sentinel：
 *
 *   - `&isXxx` / `&CAS` 約束：只在驗證階段使用，不能塞 SQL
 *   - `<executionKey`：捕獲執行結果（Then 用），不是查詢值
 *   - `>contextKey.field`：宣告 context（Given 用），不是值
 *   - `$notnull` / `$null` / `null`：「應存在不為空」/「應為 null」的驗證標記
 *   - `<non-empty>` / `<notempty>`：文字標記（與 < executionKey 不同的特殊值）
 *
 * 過去的 bug：entity-validate.ts 的 PK 路徑只跳過 `&` / `<` 前綴，
 * 沒過濾 `$notnull` → 試圖把 "$notnull" 轉成 UUID 塞 SQL → PG 拋型別錯。
 *
 * 統一用此 helper 確保所有 instruction 處理 cell 值時規則一致。
 */
export function isSentinelValue(raw: string | null | undefined): boolean {
  if (!raw) return true
  const t = raw.trim()
  if (!t) return true
  // CAS 約束（&isTrue, &>0, &isNotNull, ...）
  if (t.startsWith('&')) return true
  // VAR 系統前綴
  if (t.startsWith('<')) return true  // executionKey capture / 文字標記
  if (t.startsWith('>')) return true  // contextKey declare
  // 驗證標記（不是值）
  if (t === '$notnull' || t === '$null' || t === 'null') return true
  return false
}

/**
 * 判斷是否為「不可塞 SQL 的非值」— 比 isSentinelValue 寬，
 * 也涵蓋未解析的 $variable（fail-closed）
 *
 * 用於：將 cell 值送進 PG 查詢前的最後守門
 */
export function isNonQueryableValue(raw: string | null | undefined): boolean {
  if (isSentinelValue(raw)) return true
  // 未解析的 $variable 引用（例：$User.id 但 User 沒宣告）
  // 注意：$digit 開頭是 bcrypt hash（$2b$10$...），不是 VAR
  // 由呼叫端決定是否在 resolver.resolveVariable 失敗時把這視為 unqueryable
  return false
}
