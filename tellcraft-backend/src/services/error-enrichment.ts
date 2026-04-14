/**
 * Error Enrichment — Harness 級錯誤反饋攔截
 *
 * 把 Adapter/VAR/Schema 級別的原始錯誤字串，透過已分類的 rootCause 查表，
 * 附加「結構化修復提示」（harnessHint）給 LLM 的修復 prompt。
 *
 * 使用場景（三處整合點，共用同一個 enrichError()）：
 *   1. services/coder-generation.ts fixFailingAction — Coder Green Phase 修復
 *   2. services/red-phase-validator.ts unexpectedFailures — RED Phase 非預期失敗歸檔
 *   3. services/feature-alignment-gate.ts fixMultipleFeatures — Feature 對齊修復
 *
 * 設計原則：
 *   - 零 LLM：純查表
 *   - 不取代分類器：rootCause 依然來自現有的 classifyFailureRootCause/classifyRedPhaseFailure
 *   - 降級：查不到 rootCause 時 harnessHint 為空字串，不影響既有行為
 */

import type { FailureRootCause } from './coder-generation'
import type { RedPhaseFailureType } from './red-phase-validator'

// 合併兩套型別：Coder Green Phase 8 類 + RED Phase 6 類（部分重疊如 var_resolution）
export type EnrichableRootCause = FailureRootCause | RedPhaseFailureType

export interface EnrichErrorContext {
  phase: 'coder_green' | 'red_phase' | 'feature_alignment'
  actionName?: string
  featureContent?: string
  schemaSql?: string
}

export interface EnrichedError {
  rootCause: EnrichableRootCause
  originalError: string
  harnessHint: string         // 給 LLM 看的結構化修復路徑（空字串代表無 hint）
  skipLlmFix: boolean         // true = Harness 已知怎麼修，跳過 LLM 修復
}

/**
 * Harness 修復提示查表。
 *
 * 每條 hint 都以「現象 → 常見根因 → 具體修復方向」三段結構。
 * 修改 hint 時必須透過 scripts/register-prompt-change.ts 註冊，避免週報追蹤斷線。
 */
const ROOT_CAUSE_HINTS: Record<EnrichableRootCause, string> = {
  // ── Coder Green Phase 8 類 ──
  dispatch_mismatch: `VAR-System dispatch 不匹配。
常見根因：_stepSummary dispatch 條件使用 op.includes() 而非 op === '...'，或 summary 字串與 Feature When 步驟不完全一致。
修復方向：(1) 每個 if/else if 用 === 精確匹配（避免子字串碰撞）；(2) 對照 Feature 的 When 步驟文字，dispatch 字串必須 byte-identical。`,

  missing_column: `SQL column 不存在。
常見根因：(1) Schema DDL 用 snake_case（created_at）但代碼用 camelCase；(2) 使用了 Schema 不存在的 deleted_at 欄位（腦補軟刪除）；(3) JOIN 條件欄位名錯誤。
修復方向：對照 SQL Schema DDL 確認欄位名完全一致。只有 Schema 明確定義了 deleted_at 才加 WHERE deleted_at IS NULL，沒有就不加。`,

  wrong_status: `HTTP status code 不匹配。
常見根因：建立/新增操作應回 201，其餘應回 200，但代碼遺漏 __status 設定或回錯值。
修復方向：確保每個 return 路徑都帶 \`;(result as any).__status = 200|201\`；不要漏掉 error 分支的 status。`,

  field_naming: `回應欄位命名不匹配。
常見根因：BDD DataTable header 是 camelCase（episodeId），PostgreSQL 回傳是 snake_case（episode_id），代碼未做轉換或轉換後名稱不對齊。
修復方向：(1) 用 _c()/snakeToCamel() 轉換所有 SQL 回傳；(2) 欄位名稱必須與 Feature Then 步驟的 DataTable header 完全一致；(3) 看 requiredResponseFields 清單對照。`,

  sql_error: `SQL 語法錯誤。
常見根因：(1) 用了 MySQL 語法（ON DUPLICATE KEY）而非 PostgreSQL（ON CONFLICT）；(2) parameterized query 的 $1/$2 數量與 VALUES 不匹配；(3) 表名錯誤。
修復方向：統一用 PostgreSQL 語法，確認 $n 參數數量與實際傳入參數一致。`,

  auth_check: `多餘的 auth/token 檢查。
常見根因：LLM 在 action 函數內自行加入 JWT/token/userId 驗證，但 Server Action 層已處理認證，action 層只需使用傳入的 userId。
修復方向：移除所有 \`if (!userId) throw\`、JWT 驗證、session 檢查。userId 由呼叫者注入，直接使用。`,

  var_resolution: `VAR-System 解析失敗（Feature 規格問題，不是代碼問題）。
常見根因：(1) BDD Schema 缺少 deleted_at 導致軟刪除查詢失敗；(2) executionKey 前綴寫成 > 而非 <；(3) WHEN call table headers 誤用 >/< 前綴。
修復方向：這是 Feature 規格問題，修代碼無效。應在 RED Phase 前修 Feature；若已到 Green Phase，表示分類錯誤，回報 bug。`,

  fk_constraint: `外鍵約束違反。
常見根因：(1) INSERT 的父記錄在 entity_setup 之前沒先建立；(2) 代碼使用的 FK 值與 Feature Background 準備的資料 ID 不一致；(3) FK 指向錯誤的 table。
修復方向：對照 Feature Background 的 entity_setup 順序，確認父記錄先存在；FK 值用 $VAR 引用而非寫死。`,

  spec_inconsistency: `Feature 內部矛盾（Feature 規格問題，不是代碼問題）。
常見根因：(1) Scenario 名稱說「應變為 null」但 DataTable 期望具體 UUID；(2) 同一欄位在不同 scenario 被期望成不同類型值；(3) Scenario 描述與 Schema FK 行為不一致（e.g. 期望 cascade null 但 Schema 沒 ON DELETE SET NULL）。
修復方向：這是 Feature 規格內部矛盾，修代碼永遠無效（LLM 會在兩個方向間擺動）。必須修 Feature 的 DataTable 或 scenario 名稱達成一致。`,

  unknown: '',

  // ── RED Phase 專屬 6 類（部分與 Coder 共用 key） ──
  entity_setup: `entity_setup 失敗：Feature Background 的資料準備階段報錯。
常見根因：(1) 欄位名與 Schema DDL 不一致；(2) NOT NULL 欄位未在 DataTable 提供值；(3) FK 欄位引用的父 table/ID 不存在；(4) 型別不匹配（字串塞進 UUID 欄位）。
修復方向：檢查 Feature Background 的 \`準備一個{entity}, with table:\` 區塊，對照 Schema DDL 逐欄位驗證。`,

  step_parsing: `Feature 解析失敗：Gherkin 步驟文字無法對應到 ISA instruction regex。
常見根因：(1) When 格式缺 Actor 前綴（應為 \`UID="$var" {summary}, call table:\` 或 \`No Actor {summary}, call table:\`）；(2) Then 格式缺 HTTP status code；(3) Rule 缺四類前綴標註。
修復方向：對照 sdd.os ISA SpecFormula 標準格式，補齊 Actor/status/四類前綴。`,

  api_spec_mismatch: `API spec 不匹配：Feature 的 Action summary 在 actionsYml 找不到對應 action。
常見根因：(1) Feature 的 \`# Action: actionName\` 與 actionsYml 的 action name 不一致；(2) summary 文字在 Feature 與 actionsYml 間漂移。
修復方向：確認 Feature 檔案註解 \`# Action:\` 與 actionsYml 的 action name 完全相同；summary 必須與 Feature name 一致。`,

  routing_mismatch: `路由不匹配（RoutingStubAdapter 獨有）：HTTP 請求打到 404 而非預期的 stub。
常見根因：(1) Feature \`# [METHOD] /path\` 註解的路徑或方法與 actionsYml 不一致；(2) 路徑參數格式不對（:id vs {id}）。
修復方向：對照 actionsYml 的 path/method，確認 Feature 註解完全一致。`,
}

/**
 * 判斷是否應該跳過 LLM 修復（Harness 已知怎麼修，或修代碼無效）。
 *
 * 短路的三類都是「Feature 規格問題或已知直接機械修復」：
 *   - var_resolution / spec_inconsistency：修代碼永遠無效（必須修 Feature）
 *   - auth_check：有機械修復函數 removeAuthChecks()，不需 LLM
 *
 * 其餘 rootCause 仍走 LLM 修復，但帶上 harnessHint。
 */
function shouldSkipLlmFix(rootCause: EnrichableRootCause): boolean {
  return rootCause === 'var_resolution'
    || rootCause === 'auth_check'
    || rootCause === 'spec_inconsistency'
}

/**
 * 為已分類的錯誤附加 Harness 級修復提示。
 *
 * @param error 原始錯誤字串
 * @param rootCause 已由上游分類器決定的 rootCause
 * @param _context 目前未使用，保留擴充空間（未來可依 phase/actionName 客製 hint）
 */
export function enrichError(
  error: string,
  rootCause: EnrichableRootCause,
  _context?: EnrichErrorContext
): EnrichedError {
  const harnessHint = ROOT_CAUSE_HINTS[rootCause] || ''
  return {
    rootCause,
    originalError: error || '',
    harnessHint,
    skipLlmFix: shouldSkipLlmFix(rootCause),
  }
}

/**
 * 把 EnrichedError 格式化為 LLM prompt section。
 * 供 fixFailingAction / fixMultipleFeatures 注入使用。
 */
export function formatHintForPrompt(enriched: EnrichedError): string {
  if (!enriched.harnessHint) return ''
  return `## Harness 修復提示（rootCause: ${enriched.rootCause}）
${enriched.harnessHint}
`
}

/**
 * 把 EnrichedError 格式化為 RedPhaseUnexpectedFailure.error 的短字串。
 * 前置 hint 摘要 + 截斷的原始錯誤。
 *
 * 注意：不加 `[rootCause]` 前綴，因為下游消費者（如 coder-phases）會在外層
 * 包 `[${f.failureType}]`，重複前綴會讓訊息變 `[entity_setup] ... [entity_setup] ...`。
 */
export function formatHintForRedPhase(enriched: EnrichedError, maxOriginalLen: number = 300): string {
  const truncated = enriched.originalError.substring(0, maxOriginalLen)
  if (!enriched.harnessHint) return truncated
  // 取 hint 第一行（現象那一行）做 summary，完整 hint 留給 LLM 修復 prompt 用
  const hintSummary = enriched.harnessHint.split('\n')[0]
  return `${hintSummary}\n原始錯誤: ${truncated}`
}
