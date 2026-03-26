// ============================================================
// Coder Skill — 後端代碼生成核心
// 從 BDD 產出（actionsYml + schemaSql）生成：
//   1. lib/db.ts（固定模板，零 LLM）
//   2. lib/actions/*.ts（LLM 逐 action 生成純邏輯函數）
//   3. app/actions/*.ts（零 LLM，Server Actions 機械映射）
//   4. 改寫 UIUX 組件（LLM，useState mock → Server Action 調用）
// ============================================================

import * as yaml from 'js-yaml'
import { getAnthropicHeaders, MODEL, trackLlmUsage } from '../lib/anthropic'
import type { GeneratedComponent } from './uiux-generation'
import type { GeneratedCode } from '../types/flow-state'
import { createLogger } from '../lib/logger'
import { safeParseJson } from '../utils/safe-parse-json'
import { isQueryAction } from './actions-design'
import { sanitizeNamedImports } from '../utils/sanitize-named-imports'

const logger = createLogger('coder-generation')

// ============================================================
// 型別定義
// ============================================================

interface ActionRule {
  rule: string
  type: string   // '前置（狀態）'|'前置（參數）'|'後置（回應）'|'後置（狀態）'
  step: string
}

interface ActionEntry {
  name: string
  summary: string
  featureFile?: string
  rules?: ActionRule[]
  [key: string]: unknown
}

interface ActionsYmlStructure {
  project?: Record<string, unknown>
  actions?: ActionEntry[]
  types?: Record<string, unknown>
}

// 預設啟用 per-sub-operation 生成，設 CODER_PER_SUBOP=false 回退到舊模式
const USE_PER_SUBOP = process.env.CODER_PER_SUBOP !== 'false'

interface SubOperation {
  /** _stepSummary 值，如 "建立記帳記錄" */
  summary: string
  /** 推斷的操作類型 */
  operationType: 'create' | 'update' | 'delete' | 'query_list' | 'query_single' | 'aggregate' | 'cascade' | 'auth' | 'batch' | 'export' | 'unknown'
  /** 此子操作相關的 Rule + Example 區塊（含 Background） */
  relevantGherkin: string
  /** 此子操作必須回傳的欄位 */
  requiredResponseFields: string[]
  /** 此子操作對應的 ActionRule[] */
  actionRules: ActionRule[]
}

export interface CoderInput {
  projectId: string
  actionsYml: string
  schemaSql: string
  entityMapping: string
  existingUiuxCode: GeneratedCode
  features?: Array<{ actionName: string; content: string }>
  trackingContext?: { userId?: string; conversationId?: string }
}

export interface CoderOutput {
  backendFiles: GeneratedComponent[]
  rewrittenFrontend: GeneratedComponent[]
  unchangedFrontend: GeneratedComponent[]
  summary: string
}

// ============================================================
// LLM 調用（複用 actions-design.ts 的模式）
// ============================================================

const RETRY_MAX = 3
const RETRY_BASE_DELAY_MS = 2000

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 529 || status === 503
}

function isRetryableFetchError(err: unknown): boolean {
  const msg = String(err)
  return msg.includes('ECONNRESET') || msg.includes('ETIMEDOUT') || msg.includes('fetch failed')
}

async function callClaude(
  systemPrompt: string,
  userMessage: string,
  options: { maxTokens?: number; temperature?: number } = {},
  trackingContext?: { userId?: string; conversationId?: string }
): Promise<{
  success: boolean
  content?: string
  inputTokens?: number
  outputTokens?: number
  error?: string
}> {
  let lastError = 'Unknown error'

  for (let attempt = 1; attempt <= RETRY_MAX; attempt++) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: getAnthropicHeaders(),
        body: JSON.stringify({
          model: MODEL.SONNET,
          max_tokens: options.maxTokens || 8192,
          temperature: options.temperature || 0.2,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        if (attempt < RETRY_MAX && isRetryableStatus(response.status)) {
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1)
          logger.warn({ status: response.status, attempt, delayMs: delay }, 'API 錯誤，重試中')
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        lastError = `API error: ${response.status} - ${errorText}`
        break
      }

      const data = await response.json() as {
        usage?: { input_tokens: number; output_tokens: number }
        content?: Array<{ text: string }>
      }

      if (trackingContext && data.usage) {
        trackLlmUsage({
          model: MODEL.SONNET,
          inputTokens: data.usage.input_tokens,
          outputTokens: data.usage.output_tokens,
          purpose: 'coder-generation',
          ...trackingContext,
        })
      }

      return {
        success: true,
        content: data.content?.[0]?.text || '',
        inputTokens: data.usage?.input_tokens || 0,
        outputTokens: data.usage?.output_tokens || 0,
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error'
      if (attempt < RETRY_MAX && isRetryableFetchError(error)) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1)
        logger.warn({ attempt, delayMs: delay, error: lastError.slice(0, 100) }, '網路錯誤，重試中')
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      break
    }
  }

  return { success: false, error: lastError }
}

// ============================================================
// 1. DB 連接模板（零 LLM）
// ============================================================

export function generateDbConnection(): GeneratedComponent {
  return {
    path: 'lib/db.ts',
    content: `import { neon } from '@neondatabase/serverless'

let _sql: ReturnType<typeof neon> | null = null

export function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set')
    }
    _sql = neon(process.env.DATABASE_URL)
  }
  return _sql(strings, ...values)
}
`,
    description: 'Neon PostgreSQL 資料庫連接（lazy init）',
  }
}

// ============================================================
// 2. 解析 actionsYml
// ============================================================

export function parseActionsYml(actionsYml: string): {
  actions: ActionEntry[]
  types: Record<string, unknown>
} {
  const parsed = yaml.load(actionsYml) as ActionsYmlStructure
  if (!parsed || !parsed.actions || !Array.isArray(parsed.actions)) {
    throw new Error('actionsYml 格式錯誤：缺少 actions 陣列')
  }
  return {
    actions: parsed.actions,
    types: (parsed.types as Record<string, unknown>) || {},
  }
}

// ============================================================
// 3. LLM 生成純邏輯函數
// ============================================================

// ============================================================
// Handler 化 System Prompt（按操作類型拆分，只注入相關的 handler）
// ============================================================

const BASE_PROMPT = `你是一位 Next.js + PostgreSQL 後端工程師。你的任務是根據 Action 定義和 BDD Feature 規格實作一個純邏輯函數。

## 技術約束
- import { sql } from '@/lib/db'（@neondatabase/serverless 的 neon SQL tagged template）
- 函數必須 export + async，回傳型別明確
- 錯誤處理：驗證失敗時 throw new Error(中文錯誤描述)
- SQL 必須用 parameterized query（$1, $2...），嚴禁字串拼接
- ID 欄位用 UUID，日期用 ISO 8601 字串
- 密碼用 bcryptjs（import bcrypt from 'bcryptjs'），JWT 用 jsonwebtoken
- 不做認證檢查 — Server Action 層已處理，userId 由呼叫者注入
- 不要 import 'next/headers' 或操作 cookie
- ON CONFLICT 用 PostgreSQL 語法（不用 MySQL 的 ON DUPLICATE KEY）
- 如果測試傳 email 識別使用者：先用 input.userId，沒有再查 users 表

## 子操作派發
\`\`\`typescript
const op = input._stepSummary || ''
if (op.includes('...')) { /* 子操作 1 */ }
else if (op.includes('...')) { /* 子操作 2 */ }
else { throw new Error('不支援的操作') }
\`\`\`
用 BDD Feature 的 When 步驟 summary 精確文字作為 includes() 條件。

## 日期欄位
DATE → \`row.x instanceof Date ? row.x.toISOString().split('T')[0] : row.x\`
TIMESTAMP → \`row.x instanceof Date ? row.x.toISOString() : row.x\`

## 輸出
只輸出 TypeScript 代碼，不要任何解釋或 markdown 包裹。`

// --- Handler: 建立操作 (INSERT) ---
const CREATE_HANDLER = `
## 建立操作 Handler
\`\`\`typescript
// 前置（參數）驗證
if (!input.xxx) throw new Error('xxx 必須提供')

// INSERT + RETURNING *（必須展開 row 到回傳物件）
const [row] = await sql\`
  INSERT INTO table_name (id, user_id, ..., created_at, updated_at)
  VALUES (gen_random_uuid(), \${userId}, ..., NOW(), NOW())
  RETURNING *
\`
return { __status: 201, ...row }
\`\`\`
重點：__status: 201，RETURNING * 展開到 return。`

// --- Handler: 列表查詢 (SELECT 多筆) ---
const QUERY_LIST_HANDLER = `
## 列表查詢 Handler
\`\`\`typescript
const rows = await sql\`
  SELECT * FROM table_name
  WHERE user_id = \${userId} AND deleted_at IS NULL
  ORDER BY sort_order ASC
\`
;(rows as any).__status = 200
return rows
\`\`\`
重點：回傳 Array（不要包成 { items: rows }），在 Array 上設 __status = 200。`

// --- Handler: 單筆查詢 (SELECT 一筆) ---
const QUERY_SINGLE_HANDLER = `
## 單筆查詢 Handler
\`\`\`typescript
const entityId = input.id || input.xxxId
if (!entityId) throw new Error('缺少 ID 參數')
const [row] = await sql\`SELECT * FROM table_name WHERE id = \${entityId}\`
if (!row) throw new Error('找不到資料')
return { __status: 200, ...row }
\`\`\``

// --- Handler: 更新操作 (UPDATE) ---
const UPDATE_HANDLER = `
## 更新操作 Handler
\`\`\`typescript
const entityId = input.id || input.xxxId
if (!entityId) throw new Error('缺少 ID 參數')

// 前置（狀態）驗證：必須存在且屬於當前使用者
const existing = await sql\`SELECT * FROM table_name WHERE id = \${entityId} AND user_id = \${userId}\`
if (existing.length === 0) throw new Error('不存在或不屬於當前使用者')

// UPDATE + RETURNING *（必須展開 row 到回傳物件）
const [row] = await sql\`
  UPDATE table_name SET col = \${val}, updated_at = NOW()
  WHERE id = \${entityId}
  RETURNING *
\`
return { __status: 200, ...row }
\`\`\`
重點：__status: 200，RETURNING * 展開到 return。`

// --- Handler: 刪除操作 (DELETE/軟刪除) ---
const DELETE_HANDLER = `
## 刪除操作 Handler
\`\`\`typescript
const entityId = input.id || input.xxxId
if (!entityId) throw new Error('缺少 ID 參數')

// 軟刪除（如果 schema 有 deleted_at 欄位）
const [row] = await sql\`
  UPDATE table_name SET deleted_at = NOW(), updated_at = NOW()
  WHERE id = \${entityId} AND user_id = \${userId}
  RETURNING *
\`
return { __status: 200, ...row }
\`\`\``

// --- Handler: 批次操作 (排序/拖曳) ---
const BATCH_HANDLER = `
## 批次操作 Handler
\`\`\`typescript
// 輸入：逗號分隔字串 → split 成陣列
const ids = (input.orderedItemIds || '').split(',').map(s => s.trim()).filter(Boolean)
if (ids.length === 0) throw new Error('缺少 orderedItemIds 參數')

// 逐筆 UPDATE
for (let i = 0; i < ids.length; i++) {
  await sql\`UPDATE table_name SET sort_order = \${i + 1}, updated_at = NOW() WHERE id = \${ids[i]}\`
}
return { __status: 200, success: true }
\`\`\`
重點：回傳 { success: true }，PostgreSQL array 查詢用 ANY(\${ids}::uuid[])。`

// --- Handler: 認證操作 (登入/註冊/登出) ---
const AUTH_HANDLER = `
## 認證操作 Handler
\`\`\`typescript
// 註冊：INSERT + bcrypt hash + 回傳 userId
const hashedPassword = await bcrypt.hash(input.password, 10)
const [user] = await sql\`INSERT INTO users (...) VALUES (...) RETURNING *\`
return { __status: 201, userId: user.id, message: '註冊成功' }

// 登入：bcrypt.compare + JWT
const [user] = await sql\`SELECT * FROM users WHERE email = \${input.email}\`
if (!user) throw new Error('使用者不存在')
const valid = await bcrypt.compare(input.password, user.password_hash)
if (!valid) throw new Error('密碼不正確')
const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' })
return { __status: 200, userId: user.id, accessToken, message: '登入成功' }

// 登出：直接回傳
return { __status: 200, message: '登出成功' }
\`\`\`
重點：註冊/登入必須回 userId + message。登入必須回 accessToken。`

// --- Handler: Transaction ---
const TRANSACTION_HANDLER = `
## Transaction Handler
\`\`\`typescript
const result = await sql.begin(async (tx) => {
  const [row] = await tx\`INSERT INTO ... RETURNING *\`
  await tx\`UPDATE ... WHERE ...\`
  return row
})
return { __status: 201, ...result }
\`\`\``

// --- Handler: 聚合/摘要查詢 ---
const AGGREGATE_HANDLER = `
## 聚合/摘要查詢 Handler
\`\`\`typescript
// 聚合查詢必須用 COALESCE 防止 NULL，非聚合欄位必須 GROUP BY
const rows = await sql\`
  SELECT
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as "totalIncome",
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as "totalExpense"
  FROM table_name
  WHERE device_id = \${deviceId} AND deleted_at IS NULL
    AND date_trunc('month', transaction_date) = date_trunc('month', \${month}::date)
\`
const result = rows[0] || { totalIncome: 0, totalExpense: 0 }
// 數值欄位必須轉 Number（PostgreSQL 回傳 string）
return { __status: 200, totalIncome: Number(result.totalIncome), totalExpense: Number(result.totalExpense) }
\`\`\`
規則：
- SELECT 中非聚合函數的欄位**必須**出現在 GROUP BY
- 用 COALESCE(..., 0) 防止空結果回傳 NULL
- 用 Number() 轉型（PostgreSQL SUM/COUNT 回傳 string）
- 用 date_trunc() 做月份比較，不要拼字串
- 分組查詢（GROUP BY）回傳 Array 設 __status；單一聚合取 rows[0] 回傳 Object
- 無資料時回傳零值物件，不要回傳 404
- WHERE 必須加 deleted_at IS NULL 排除軟刪除記錄`

// --- Handler: 級聯刪除/更新 ---
const CASCADE_HANDLER = `
## 級聯刪除/更新 Handler
當刪除父實體時，如果有子實體透過 FK 引用它，必須同時更新子記錄：
\`\`\`typescript
const result = await sql.begin(async (tx) => {
  // Step 1: 軟刪除父實體
  const [parent] = await tx\`
    UPDATE parent_table SET deleted_at = NOW(), updated_at = NOW()
    WHERE id = \${entityId} RETURNING *
  \`
  if (!parent) throw new Error('找不到資料')
  // Step 2: 級聯更新子實體的 FK 為 NULL（代表「未分類」）
  await tx\`UPDATE child_table SET parent_id = NULL, updated_at = NOW() WHERE parent_id = \${entityId}\`
  return parent
})
return { __status: 200, ...result }
\`\`\`
規則：
- 刪除被 FK 引用的實體時，必須 transaction 內同時更新子記錄的 FK 為 NULL
- 子記錄不要刪除，只把 FK 設為 NULL
- 用 sql.begin() 確保原子性`

// --- Handler: 欄位別名（snake_case → camelCase）---
const COLUMN_ALIAS_HANDLER = `
## 欄位別名（PostgreSQL snake_case → camelCase）
PostgreSQL 回傳的欄位名是 snake_case（category_id, created_at, deleted_at, transaction_date）。
BDD 測試驗證的欄位名是 camelCase（categoryId, createdAt, deletedAt, transactionDate）。
必須在回傳前轉換，否則測試一定失敗！
\`\`\`typescript
// 方法 1: SQL AS 別名（推薦）
SELECT category_id as "categoryId", created_at as "createdAt", deleted_at as "deletedAt" FROM ...

// 方法 2: 程式碼轉換（適合 RETURNING * 展開場景）
function snakeToCamel(row: any) {
  if (!row) return row
  const result: any = {}
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
    result[camelKey] = value
  }
  return result
}
// 用在 INSERT/UPDATE/DELETE RETURNING * 後
const [row] = await sql\`UPDATE ... RETURNING *\`
return { __status: 200, ...snakeToCamel(row) }

// 列表查詢
const rows = await sql\`SELECT * FROM ...\`
const camelRows = rows.map(snakeToCamel)
;(camelRows as any).__status = 200
return camelRows
\`\`\`
重點：BDD requiredResponseFields 列表中的名稱是精確的 camelCase，你的回傳必須完全匹配。`

/**
 * 根據 action 的 rules 類型，選擇性注入相關 handler。
 * 不再用一個巨大的 system prompt 教 LLM 所有操作類型。
 */
function buildActionSystemPrompt(action?: ActionEntry): string {
  if (!action) return BASE_PROMPT

  const handlers: string[] = []
  const rules = action.rules || []
  const nameHint = ((action.name || '') + ' ' + (action.summary || '')).toLowerCase()

  // 認證相關
  if (/auth|login|register|signup|signin|logout|password|token|verify/i.test(nameHint)) {
    handlers.push(AUTH_HANDLER)
  }

  // 批次操作
  if (/reorder|sort|batch|drag|拖曳|排序|批次/i.test(nameHint)) {
    handlers.push(BATCH_HANDLER)
  }

  // 從 rules 類型判斷需要的 handler
  const hasStateRules = rules.some(r => r.type === '後置（狀態）')
  const hasResponseRules = rules.some(r => r.type === '後置（回應）')

  // 有後置（狀態）→ 可能有 INSERT/UPDATE/DELETE
  if (hasStateRules) {
    handlers.push(CREATE_HANDLER)
    handlers.push(UPDATE_HANDLER)
    handlers.push(DELETE_HANDLER)
  }

  // 有後置（回應）→ 有查詢操作
  if (hasResponseRules) {
    handlers.push(QUERY_LIST_HANDLER)
    handlers.push(QUERY_SINGLE_HANDLER)
  }

  // 如果沒有匹配到任何 handler（兜底），注入所有
  if (handlers.length === 0) {
    handlers.push(CREATE_HANDLER, QUERY_LIST_HANDLER, QUERY_SINGLE_HANDLER, UPDATE_HANDLER, DELETE_HANDLER, BATCH_HANDLER)
  }

  // Transaction handler（如果有多表操作暗示）
  if (/order.*item|cart.*product|transfer|transaction|原子/i.test(nameHint) || rules.length > 8) {
    handlers.push(TRANSACTION_HANDLER)
  }

  // --- 語義感知 handler 選擇（補充 rule-type 之外的模式）---
  const allRuleText = rules.map(r => (r as any).rule || (r as any).description || '').join(' ')
  const allText = nameHint + ' ' + allRuleText

  // 聚合/摘要查詢（SUM, GROUP BY, 統計）
  if (/摘要|統計|彙總|加總|合計|summary|aggregate|total|count|average|平均/i.test(allText)) {
    handlers.push(AGGREGATE_HANDLER)
  }

  // 級聯操作（刪除父實體需要更新子記錄）
  if (rules.some(r => /未分類|相關.*應|級聯|cascade|歸入|改為/i.test((r as any).rule || (r as any).description || ''))) {
    handlers.push(CASCADE_HANDLER)
  }

  // camelCase 欄位別名（所有有回應或狀態驗證的 action 都需要）
  if (hasResponseRules || hasStateRules) {
    handlers.push(COLUMN_ALIAS_HANDLER)
  }

  return `${BASE_PROMPT}\n\n${handlers.join('\n')}`
}

function buildActionUserPrompt(
  action: ActionEntry,
  schemaSql: string,
  entityMapping: string,
  types: Record<string, unknown>,
  requiredResponseFields?: string[],
  stepSummaries?: string[],
  featureContent?: string
): string {
  const rulesText = (action.rules || [])
    .map(r => `- [${r.type}] ${r.rule}`)
    .join('\n')

  const typesText = Object.keys(types).length > 0
    ? `\n## 型別參考\n${yaml.dump(types)}`
    : ''

  const responseFieldsText = requiredResponseFields && requiredResponseFields.length > 0
    ? `\n## 必須返回的欄位名稱（嚴格遵守，不可改名）
BDD 規格驗證會從 response body 精確提取以下欄位，名稱不一致會導致測試失敗：
${requiredResponseFields.map(f => `- \`${f}\``).join('\n')}
例如建立操作成功時：return { __status: 201, ${requiredResponseFields.join(', ')}, ...其他欄位 }
這些欄位名稱是 BDD 規格硬編碼的，必須完全一致（區分大小寫）。`
    : ''

  const stepSummariesText = stepSummaries && stepSummaries.length > 0
    ? `\n## _stepSummary 精確派發值（嚴格遵守，禁止改寫）
BDD 測試會用以下精確的 _stepSummary 值呼叫此函數。你的 if/else 分支的 includes() 條件必須能匹配這些值：
${stepSummaries.map(s => `- "${s}"`).join('\n')}
重要：使用這些精確的文字作為 includes() 條件，不要用同義詞替換（例如：如果 summary 是「建立待辦事項」，就用 op.includes('建立待辦事項')，不要改成 op.includes('新增')）。`
    : ''

  return `## Action 定義
名稱：${action.name}
摘要：${action.summary}

## 規則
${rulesText || '（無特定規則）'}

## 相關資料表 DDL
${schemaSql}

## Entity Mapping（中文實體 → 表名）
${entityMapping}
${typesText}${responseFieldsText}${stepSummariesText}${featureContent ? `

## BDD Feature 規格（最重要！你的代碼必須通過這些測試場景）
以下是 SpecFormula 測試會執行的完整 Feature 文件。仔細閱讀每個 Scenario 的：
- When 步驟的 DataTable → 這是你的函數會收到的 request 參數
- Then 步驟的 DataTable → 這是你的函數必須返回的 response 格式和欄位
- Then 回應為 JSON → 回應必須是 Array 格式，不能包成 Object
- 操作失敗 → 這些情境你的函數必須 throw Error

\`\`\`gherkin
${featureContent}
\`\`\`` : ''}

請根據以上定義實作函數。
函數名必須使用 camelCase：export async function ${toCamelCase(action.name)}(input: ${toPascalCase(action.name)}Input)
檔名：lib/actions/${toKebabCase(action.name)}.ts`
}

// ============================================================
// Per-SubOperation 生成系統
// ============================================================

/** 從 Feature 文件提取子操作（按 When 步驟的 summary 分組 Rule 區塊） */
function extractSubOperations(featureContent: string, action: ActionEntry): SubOperation[] {
  const lines = featureContent.split('\n')

  // 1. 提取 Background 區塊
  let backgroundStart = -1
  let backgroundEnd = -1
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*Background:/i.test(lines[i])) {
      backgroundStart = i
    } else if (backgroundStart >= 0 && backgroundEnd < 0 && /^\s*(?:Rule:|#-{3,})/.test(lines[i]) && i > backgroundStart) {
      backgroundEnd = i
    }
  }
  const background = backgroundStart >= 0
    ? lines.slice(backgroundStart, backgroundEnd >= 0 ? backgroundEnd : lines.length).join('\n')
    : ''

  // 2. 用 Rule: 分割成區塊
  const ruleBlocks: Array<{ content: string }> = []
  let currentRuleStart = -1
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*Rule:/.test(lines[i])) {
      if (currentRuleStart >= 0) {
        ruleBlocks.push({ content: lines.slice(currentRuleStart, i).join('\n') })
      }
      currentRuleStart = i
    }
  }
  if (currentRuleStart >= 0) {
    ruleBlocks.push({ content: lines.slice(currentRuleStart).join('\n') })
  }

  if (ruleBlocks.length === 0) return []

  // 3. 對每個 Rule 區塊找 When 步驟的 summary
  const summaryRegex = /(?:When|And)\s+(?:\((?:No Actor|UID="[^"]*")\)\s+)?(.+?),\s*call\s+table:/i
  const groups = new Map<string, string[]>()

  for (const block of ruleBlocks) {
    const match = block.content.match(summaryRegex)
    const summary = match?.[1]?.trim() || '__default__'
    if (!groups.has(summary)) groups.set(summary, [])
    groups.get(summary)!.push(block.content)
  }

  // 單一 summary → 不需要拆分，走原路徑
  const validGroups = new Map([...groups].filter(([k]) => k !== '__default__'))
  if (validGroups.size <= 1) return []

  // 4. 構建 SubOperation 列表
  const subOps: SubOperation[] = []
  for (const [summary, blocks] of validGroups) {
    const combinedGherkin = background + '\n\n' + blocks.join('\n\n')
    const operationType = inferOperationType(summary, blocks.join(' '))
    const requiredResponseFields = extractResponseFieldsFromGherkin(blocks.join('\n'))

    const matchedRules = (action.rules || []).filter(r =>
      blocks.some(b => b.includes(r.rule || ''))
    )

    subOps.push({
      summary,
      operationType,
      relevantGherkin: combinedGherkin,
      requiredResponseFields,
      actionRules: matchedRules,
    })
  }

  return subOps
}

/** 從 summary 文字推斷操作類型 */
function inferOperationType(summary: string, ruleText: string): SubOperation['operationType'] {
  const s = summary + ' ' + ruleText
  if (/摘要|統計|彙總|加總|合計|summary|aggregate|total/i.test(s)) return 'aggregate'
  if (/匯出|export/i.test(s)) return 'export'
  if (/未分類|相關.*應|級聯|cascade/i.test(s)) return 'cascade'
  if (/auth|login|register|signup|signin|logout|password/i.test(s)) return 'auth'
  if (/reorder|batch|拖曳|批次/i.test(s)) return 'batch'
  if (DELETE_KEYWORDS.some(k => summary.includes(k))) return 'delete'
  if (UPDATE_KEYWORDS.some(k => summary.includes(k))) return 'update'
  if (CREATE_KEYWORDS.some(k => summary.includes(k))) return 'create'
  if (LIST_KEYWORDS.some(k => summary.includes(k))) return 'query_list'
  if (QUERY_KEYWORDS.some(k => summary.includes(k))) return 'query_single'
  return 'unknown'
}

/** 從 Gherkin 文字提取必須回傳的欄位 */
function extractResponseFieldsFromGherkin(gherkinText: string): string[] {
  const fields = new Set<string>()
  const lines = gherkinText.split('\n')
  let inResponseTable = false
  let headerCells: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (/(?:Then|And)\s+.+\(\d+\)回應/.test(trimmed)) {
      inResponseTable = true
      headerCells = []
      continue
    }
    if (inResponseTable && trimmed.startsWith('|')) {
      const cells = trimmed.split('|').map(c => c.trim()).filter(Boolean)
      if (headerCells.length === 0) {
        headerCells = cells
      } else {
        for (let i = 0; i < cells.length && i < headerCells.length; i++) {
          if (cells[i].startsWith('<')) fields.add(cells[i].substring(1))
          if (cells[i] === '$notnull' || cells[i] === '&isNotNull') {
            if (!headerCells[i].startsWith('>') && !headerCells[i].startsWith('<')) {
              fields.add(headerCells[i])
            }
          }
        }
      }
    } else if (inResponseTable && !trimmed.startsWith('|')) {
      inResponseTable = false
      headerCells = []
    }
  }
  return [...fields]
}

/** 精準 handler 選擇（每個子操作只注入 1 個主 handler） */
function buildSubOpSystemPrompt(subOp: SubOperation): string {
  const handlers: string[] = []
  switch (subOp.operationType) {
    case 'create':      handlers.push(CREATE_HANDLER); break
    case 'update':      handlers.push(UPDATE_HANDLER); break
    case 'delete':      handlers.push(DELETE_HANDLER); break
    case 'query_list':  handlers.push(QUERY_LIST_HANDLER); break
    case 'query_single': handlers.push(QUERY_SINGLE_HANDLER); break
    case 'aggregate':   handlers.push(AGGREGATE_HANDLER); break
    case 'cascade':     handlers.push(CASCADE_HANDLER); break
    case 'auth':        handlers.push(AUTH_HANDLER); break
    case 'batch':       handlers.push(BATCH_HANDLER); break
    case 'export':      handlers.push(QUERY_LIST_HANDLER); break
    default:
      handlers.push(CREATE_HANDLER, QUERY_LIST_HANDLER, UPDATE_HANDLER, DELETE_HANDLER)
  }
  handlers.push(COLUMN_ALIAS_HANDLER)
  return `${BASE_PROMPT}\n\n${handlers.join('\n')}`
}

/** 生成單個子操作的代碼 */
async function generateSubOperationCode(
  action: ActionEntry,
  subOp: SubOperation,
  ctx: { schemaSql: string; entityMapping: string; types: Record<string, unknown> },
  trackingContext?: { userId?: string; conversationId?: string }
): Promise<{ summary: string; code: string }> {
  const systemPrompt = buildSubOpSystemPrompt(subOp)

  const responseFieldsText = subOp.requiredResponseFields.length > 0
    ? `\n## 必須返回的欄位名稱（嚴格遵守，不可改名）\n${subOp.requiredResponseFields.map(f => `- \`${f}\``).join('\n')}`
    : ''

  const handleName = `handle${toPascalCase(subOp.summary)}`
  const userPrompt = `## 子操作定義
Action 名稱：${action.name}
子操作：${subOp.summary}
操作類型：${subOp.operationType}

## 規則
${(subOp.actionRules || []).map(r => `- [${r.type}] ${r.rule}`).join('\n') || '（無特定規則）'}

## 相關資料表 DDL
${ctx.schemaSql}

## Entity Mapping（中文實體 → 表名）
${ctx.entityMapping}
${responseFieldsText}

## BDD Scenario（你的代碼必須通過這些測試）
\`\`\`gherkin
${subOp.relevantGherkin}
\`\`\`

請實作一個 async function ${handleName}(input: any)。
只實作「${subOp.summary}」這一個操作，不要 _stepSummary 分派。
函數內直接寫核心邏輯。只輸出 TypeScript 代碼。`

  const maxTokens = Math.max(2048, Math.min(2048 + (subOp.actionRules?.length || 0) * 512, 8192))
  const result = await callClaude(systemPrompt, userPrompt, { maxTokens }, trackingContext)

  if (!result.success || !result.content) {
    throw new Error(`生成子操作 ${subOp.summary} 失敗：${result.error}`)
  }

  let code = extractCodeFromResponse(result.content)
  code = removeAuthChecks(code)
  code = fixMySqlSyntax(code)

  return { summary: subOp.summary, code }
}

/** 移除 LLM 偶爾加入的認證檢查（共用） */
function removeAuthChecks(code: string): string {
  // Pattern 1: if (!userId) { throw/return ... }
  code = code.replace(/if\s*\(\s*!(?:input\.)?userId\s*\)\s*\{[^}]*(?:throw|return)[^}]*\}/g, '')
  // Pattern 2: if (!userId) throw/return ...
  code = code.replace(/if\s*\(\s*!(?:input\.)?userId\s*\)\s*(?:throw|return)[^\n]*/g, '')
  // Pattern 3: 包含 auth 相關的 throw 語句（完整模式）
  code = code.replace(/if\s*\([^)]*\)\s*\{?\s*throw\s+new\s+Error\s*\(\s*['"`][^'"`]*(?:必須已登入|認證|已過期|unauthorized|must.*log|未登入|操作者必須|認證憑證無效|token.*(?:invalid|expired)|session.*(?:invalid|expired))[^'"`]*['"`]\s*\)\s*\}?/gi, '')
  // Pattern 4: token/session 驗證的 if block
  code = code.replace(/if\s*\(\s*!(?:input\.)?(?:token|session|authToken)\s*\)\s*\{[^}]*(?:throw|return)[^}]*\}/g, '')
  code = code.replace(/if\s*\(\s*!(?:input\.)?(?:token|session|authToken)\s*\)\s*(?:throw|return)[^\n]*/g, '')
  return code
}

/** 修正 MySQL → PostgreSQL 語法（共用） */
function fixMySqlSyntax(code: string): string {
  return code.replace(
    /ON\s+DUPLICATE\s+KEY\s+UPDATE\s+(.+?)(?=\s*`|;|\n|$)/gim,
    (_match: string, setCols: string) => {
      const pgCols = setCols.replace(/VALUES\s*\(\s*(\w+)\s*\)/gi, 'EXCLUDED.$1')
      return `ON CONFLICT (id) DO UPDATE SET ${pgCols}`
    }
  )
}

/** 移除 import 語句 */
function removeImports(code: string): string {
  return code.split('\n').filter(l => !l.trim().startsWith('import ')).join('\n')
}

/** 從位置提取完整函數體（brace matching） */
function extractFunctionBody(code: string, startIdx: number): string | null {
  if (startIdx < 0 || startIdx >= code.length) return null
  const firstBrace = code.indexOf('{', startIdx)
  if (firstBrace < 0) return null

  let depth = 0
  for (let i = firstBrace; i < code.length; i++) {
    if (code[i] === '{') depth++
    if (code[i] === '}') {
      depth--
      if (depth === 0) {
        return code.slice(startIdx, i + 1)
      }
    }
  }
  return null
}

/** 零 LLM 機械組裝子操作為最終 action 函數 */
function composeActionFunction(
  action: ActionEntry,
  subOps: SubOperation[],
  subOpCodes: Array<{ summary: string; code: string }>
): GeneratedComponent {
  // 1. 收集所有 import 語句，去重
  const namedImports = new Map<string, Set<string>>()
  const defaultImports = new Map<string, string>()
  const processedDefaultMods = new Set<string>()

  for (const { code } of subOpCodes) {
    for (const line of code.split('\n')) {
      const trimmed = line.trim()
      // import { x, y } from 'module'
      const namedMatch = trimmed.match(/^import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/)
      if (namedMatch) {
        const names = namedMatch[1].split(',').map(s => s.trim()).filter(Boolean)
        const mod = namedMatch[2]
        if (!namedImports.has(mod)) namedImports.set(mod, new Set())
        names.forEach(n => namedImports.get(mod)!.add(n))
        continue
      }
      // import x from 'module'
      const defaultMatch = trimmed.match(/^import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/)
      if (defaultMatch && !processedDefaultMods.has(defaultMatch[2])) {
        defaultImports.set(defaultMatch[2], defaultMatch[1])
        processedDefaultMods.add(defaultMatch[2])
      }
    }
  }

  // 2. 組裝 import 區塊
  const importLines: string[] = []
  const emittedMods = new Set<string>()
  for (const [mod, defName] of defaultImports) {
    const named = namedImports.get(mod)
    if (named && named.size > 0) {
      importLines.push(`import ${defName}, { ${[...named].join(', ')} } from '${mod}'`)
      namedImports.delete(mod)
    } else {
      importLines.push(`import ${defName} from '${mod}'`)
    }
    emittedMods.add(mod)
  }
  for (const [mod, names] of namedImports) {
    if (!emittedMods.has(mod)) {
      importLines.push(`import { ${[...names].join(', ')} } from '${mod}'`)
    }
  }

  // 3. 提取 helper 函數（如 snakeToCamel），去重
  const helperFunctions = new Map<string, string>()
  for (const { code } of subOpCodes) {
    const cleaned = removeImports(code)
    const helperRegex = /(?:^|\n)((?:async\s+)?function\s+(?!handle)(\w+)\s*\([^)]*\)[^{]*\{)/g
    let match: RegExpExecArray | null
    while ((match = helperRegex.exec(cleaned)) !== null) {
      const funcName = match[2]
      if (!helperFunctions.has(funcName)) {
        const body = extractFunctionBody(cleaned, match.index + (match[0].startsWith('\n') ? 1 : 0))
        if (body) helperFunctions.set(funcName, body.trim())
      }
    }
  }

  // 4. 提取每個子操作的 handle 函數
  const handleFunctions: string[] = []
  for (const { summary, code } of subOpCodes) {
    let cleaned = removeImports(code)
    // 移除已提升的 helper
    for (const [, fullHelper] of helperFunctions) {
      cleaned = cleaned.replace(fullHelper, '')
    }
    // 確保函數名稱正確
    const handleName = `handle${toPascalCase(summary)}`
    cleaned = cleaned.replace(
      /(?:export\s+)?(?:async\s+)?function\s+\w+/,
      `async function ${handleName}`
    )
    const trimmed = cleaned.trim()
    if (trimmed) handleFunctions.push(trimmed)
  }

  // 5. 組裝 _stepSummary 分派（長 summary 在前，避免子字串衝突）
  const sortedOps = [...subOps].sort((a, b) => b.summary.length - a.summary.length)
  const dispatchBranches = sortedOps.map((op, i) => {
    const handleName = `handle${toPascalCase(op.summary)}`
    const prefix = i === 0 ? 'if' : 'else if'
    return `  ${prefix} (op.includes('${op.summary}')) return ${handleName}(input)`
  }).join('\n')

  // 6. 組裝最終檔案
  const fnName = toCamelCase(action.name)
  const finalCode = `${importLines.join('\n')}

${[...helperFunctions.values()].join('\n\n')}

${handleFunctions.join('\n\n')}

export async function ${fnName}(input: any) {
  const op = input._stepSummary || ''
${dispatchBranches}
  else { throw new Error('不支援的操作') }
}`

  return {
    path: `lib/actions/${toKebabCase(action.name)}.ts`,
    content: finalCode,
    description: action.summary,
  }
}

// ============================================================
// 主要 Action 生成函數
// ============================================================

export async function generateActionFunction(
  action: ActionEntry,
  ctx: { schemaSql: string; entityMapping: string; types: Record<string, unknown>; features?: Array<{ actionName: string; content: string }> },
  trackingContext?: { userId?: string; conversationId?: string }
): Promise<GeneratedComponent> {
  // === Per-SubOperation 生成模式（manage_ 等多子操作 action） ===
  if (USE_PER_SUBOP) {
    const featureContentForSubOp = ctx.features?.find(f => f.actionName === action.name)?.content
    if (featureContentForSubOp) {
      const subOps = extractSubOperations(featureContentForSubOp, action)
      if (subOps.length > 1) {
        logger.info({ actionName: action.name, subOpCount: subOps.length, summaries: subOps.map(s => `${s.summary}(${s.operationType})`) }, 'Per-SubOp 生成模式')

        try {
          const subOpCodes = await runWithConcurrencyLimit(
            subOps,
            async (subOp, idx) => {
              logger.info({ actionName: action.name, subOp: subOp.summary, idx }, `生成子操作 ${idx + 1}/${subOps.length}`)
              return generateSubOperationCode(action, subOp, ctx, trackingContext)
            },
            3
          )

          let result = composeActionFunction(action, subOps, subOpCodes)

          // 組裝後跑 validateActionResponses（復用現有 post-fix）
          const { files, fixes } = validateActionResponses([result])
          if (fixes.length > 0) {
            logger.info({ actionName: action.name, fixes }, 'Per-SubOp 組裝後 post-fix')
          }
          result = files[0] as GeneratedComponent

          return result
        } catch (subOpErr) {
          logger.warn({ actionName: action.name, err: subOpErr }, 'Per-SubOp 生成失敗，回退到整體生成')
          // 回退到下方的原有邏輯
        }
      }
    }
  }

  // === 原有的單次生成邏輯（單操作 feature 或 fallback） ===
  const systemPrompt = buildActionSystemPrompt(action)
  const requiredResponseFields = ctx.features
    ? extractResponseFieldsFromFeatures(ctx.features, action.name)
    : undefined
  const stepSummaries = ctx.features
    ? extractStepSummariesFromFeatures(ctx.features, action.name)
    : undefined
  if (requiredResponseFields && requiredResponseFields.length > 0) {
    logger.info({ actionName: action.name, fields: requiredResponseFields }, 'BDD response fields 注入')
  }
  if (stepSummaries && stepSummaries.length > 0) {
    logger.info({ actionName: action.name, summaries: stepSummaries }, 'BDD step summaries 注入')
  }
  // 找到對應的 Feature 文件內容
  const featureContent = ctx.features
    ? ctx.features.find(f => f.actionName === action.name)?.content
    : undefined
  if (featureContent) {
    logger.info({ actionName: action.name, featureLen: featureContent.length }, 'BDD Feature 內容注入')
  }
  const userPrompt = buildActionUserPrompt(action, ctx.schemaSql, ctx.entityMapping, ctx.types, requiredResponseFields, stepSummaries, featureContent)

  // 複雜 action（多規則）→ 更多 token（Feature 注入後 prompt 更長，output 也需更多空間）
  const ruleCount = (action.rules || []).length
  const featureTokenEstimate = featureContent ? Math.ceil(featureContent.length / 4) : 0
  const actionMaxTokens = Math.max(4096, Math.min(4096 + ruleCount * 512 + Math.min(featureTokenEstimate, 2048), 16384))
  const result = await callClaude(systemPrompt, userPrompt, { maxTokens: actionMaxTokens }, trackingContext)

  if (!result.success || !result.content) {
    throw new Error(`生成 ${action.name} 失敗：${result.error}`)
  }

  let code = extractCodeFromResponse(result.content)
  code = removeAuthChecks(code)
  code = fixMySqlSyntax(code)

  return {
    path: `lib/actions/${toKebabCase(action.name)}.ts`,
    content: code,
    description: action.summary,
  }
}

// ============================================================
// 4. Server Actions 機械映射（零 LLM）
// ============================================================

/** 判斷 action 的認證類型（零 LLM，按 name 關鍵字） */
function getActionAuthType(name: string): 'login' | 'logout' | 'normal' {
  const lower = name.toLowerCase()
  if (/log_?out|sign_?out/.test(lower)) return 'logout'
  if (/log_?in|sign_?in|register|sign_?up/.test(lower)) return 'login'
  return 'normal'
}

export function generateServerActions(
  actions: ActionEntry[],
  entityMapping: string
): GeneratedComponent[] {
  // 按 entity/domain 分組
  const groups = groupActionsByDomain(actions, entityMapping)
  const files: GeneratedComponent[] = []

  for (const [domain, domainActions] of Object.entries(groups)) {
    const imports = domainActions
      .map(a => `import { ${toCamelCase(a.name)} } from '@/lib/actions/${toKebabCase(a.name)}'`)
      .join('\n')

    const exports = domainActions
      .map(a => {
        const fnName = toCamelCase(a.name)
        const inputType = `${toPascalCase(a.name)}Input`
        const authType = getActionAuthType(a.name)

        if (authType === 'logout') {
          // 登出：清除 cookie
          return `export async function ${fnName}Action(input: ${inputType}) {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('userId')
  } catch { /* WebContainer WASM 環境無 AsyncLocalStorage，跳過 cookie 操作 */ }
  return ${fnName}(input)
}`
        }

        if (authType === 'login') {
          // 登入/註冊：呼叫後設 cookie（多欄位名 fallback）
          return `export async function ${fnName}Action(input: ${inputType}) {
  const result = await ${fnName}(input)
  const uid = (result as any).userId || (result as any).createdUserId || (result as any).user_id
  if (uid && result.__status && result.__status < 300) {
    try {
      const cookieStore = await cookies()
      cookieStore.set('userId', String(uid), { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7 })
    } catch { /* WebContainer WASM 環境無 AsyncLocalStorage，跳過 cookie 操作 */ }
  }
  return result
}`
        }

        // 一般 action：讀 cookie 注入 userId
        return `export async function ${fnName}Action(input: ${inputType}) {
  let userId: string | undefined
  try {
    const cookieStore = await cookies()
    userId = cookieStore.get('userId')?.value
  } catch { /* WebContainer WASM 環境無 AsyncLocalStorage，跳過 cookie 讀取 */ }
  return ${fnName}({ ...input, ...(userId ? { userId } : {}) })
}`
      })
      .join('\n\n')

    // 從對應 lib/actions 匯入型別
    const typeImports = domainActions
      .map(a => `import type { ${toPascalCase(a.name)}Input } from '@/lib/actions/${toKebabCase(a.name)}'`)
      .join('\n')

    const content = `'use server'

import { cookies } from 'next/headers'
${imports}
${typeImports}

${exports}
`
    files.push({
      path: `app/actions/${domain}.ts`,
      content,
      description: `${domain} 領域的 Server Actions`,
    })
  }

  return files
}

// ============================================================
// 4.5 API Routes 生成（零 LLM，機械映射）
// ============================================================

/**
 * 從 actionsYml 機械生成 Next.js API Routes
 * 每個 action → app/api/<path>/route.ts
 * 用於 SpecFormula 測試（Mini Express test server 也會參照此映射）
 */
export function generateApiRoutes(
  actions: ActionEntry[],
  actionsYml: string
): GeneratedComponent[] {
  // 解析 actionsYml 取得 method/path
  let parsed: ActionsYmlStructure | undefined
  try {
    parsed = yaml.load(actionsYml) as ActionsYmlStructure
  } catch {
    // 解析失敗降級
  }

  // 建立 name → { method, path } 映射
  const actionMeta = new Map<string, { method: string; path: string }>()
  if (parsed?.actions) {
    for (const a of parsed.actions) {
      actionMeta.set(a.name, {
        method: (typeof a.method === 'string' ? a.method : (isQueryAction(a) ? 'GET' : 'POST')).toUpperCase(),
        path: typeof a.path === 'string' ? a.path : `/api/${a.name}`,
      })
    }
  }

  const files: GeneratedComponent[] = []

  for (const action of actions) {
    const meta = actionMeta.get(action.name) || {
      method: 'POST',
      path: `/api/${action.name}`,
    }

    const importPath = `@/lib/actions/${toKebabCase(action.name)}`
    const fnName = toCamelCase(action.name)
    const inputType = `${toPascalCase(action.name)}Input`

    // Derive the route file path from the API path
    // /api/orders/:id → app/api/orders/[id]/route.ts
    const rawRouteDir = meta.path
      .replace(/^\//, '')  // remove leading slash
      .replace(/:(\w+)/g, '[$1]')  // :id → [id]
    // 確保路徑以 app/ 開頭（Next.js App Router 規範）
    const routeDir = rawRouteDir.startsWith('app/') ? rawRouteDir : `app/${rawRouteDir}`

    let content: string
    if (meta.method === 'GET') {
      content = `import { NextRequest, NextResponse } from 'next/server'
import { ${fnName} } from '${importPath}'

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries())
    const result = await ${fnName}(params as unknown as Parameters<typeof ${fnName}>[0])
    const status = (result as any).__status || 200
    return NextResponse.json(result, { status })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
`
    } else {
      // POST/PUT/DELETE/PATCH
      const defaultStatus = meta.method === 'POST' ? 201 : 200
      content = `import { NextRequest, NextResponse } from 'next/server'
import { ${fnName} } from '${importPath}'
import type { ${inputType} } from '${importPath}'

export async function ${meta.method}(req: NextRequest) {
  try {
    const body: ${inputType} = await req.json()
    const result = await ${fnName}(body)
    const status = (result as any).__status || ${defaultStatus}
    return NextResponse.json(result, { status })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
`
    }

    files.push({
      path: `${routeDir}/route.ts`,
      content,
      description: `${action.summary || action.name} API Route (${meta.method} ${meta.path})`,
    })
  }

  return files
}

// ============================================================
// 5. 識別需改寫的 UIUX 組件（Haiku LLM + regex fallback）
// ============================================================

// Regex fallback 模式（Haiku 失敗時使用）
const MOCK_DATA_PATTERNS = [
  /useState\(\s*\[\s*\{[^}]+\}/,
  /useState\(\s*\{\s*\w+\s*:\s*['"][^'"]{10,}/,
  /(?:const|let)\s+\w+\s*(?::\s*\w+(?:\[\])?\s*)?=\s*\[\s*\{/,
  /(?:const|let)\s+\w+\s*=\s*\[[\s\S]*?\{[\s\S]*?\}[\s\S]*?\{[\s\S]*?\}[\s\S]*?\{/,
  /import\s+.*from\s+['"].*(?:mock|seed|fake|dummy|sample)[^'"]*['"]/i,
]

/** 從組件中截取摘要供 Haiku 判斷（前 80 行 + 後段關鍵行） */
function extractComponentSummary(content: string): string {
  const lines = content.split('\n')
  if (lines.length <= 80) return content

  const head = lines.slice(0, 80).join('\n')

  const KEYWORDS = /useState|const\s+\w+\s*=\s*\[|data|items|mock|sample|dummy|\.map\s*\(/i
  const extraLines: string[] = []
  for (let i = 80; i < lines.length && extraLines.length < 20; i++) {
    if (KEYWORDS.test(lines[i])) {
      extraLines.push(`L${i + 1}: ${lines[i]}`)
    }
  }

  let summary = head
  if (extraLines.length > 0) {
    summary += '\n// ... (後段關鍵行摘錄)\n' + extraLines.join('\n')
  }
  summary += `\n// [共 ${lines.length} 行]`
  return summary
}

const MOCK_IDENTIFICATION_SYSTEM_PROMPT = `你是前端代碼分析專家。判斷 React 組件中是否包含「需要替換為 Server Action 呼叫的 mock/硬編碼業務資料」。

## 需要改寫（標記）
- useState 初始化為硬編碼的業務資料陣列（如產品列表、訂單列表、用戶資料、節目列表）
- const/let 宣告的大段業務假資料陣列（如 const episodes = [{ id: 'ep-001', title: '...' }, ...]）
- 表單提交只做 console.log/alert/setState，沒有真實後端呼叫
- 從 mock/seed/fake/dummy 檔案 import 資料

## 不需要改寫（不標記）
- 導航選單項目（nav items）、Footer 連結 — 純 UI 結構
- Feature/優勢/服務展示列表 — 行銷靜態內容
- icon/route/theme 映射物件 — UI 配置
- 動畫配置/樣式常數 — 純前端
- 已使用 fetch/Server Action/API 的組件
- 空的 useState 初始化（useState([])、useState(null)）

只回覆 JSON：{"indices":[0,2,5]}
indices 為需改寫的組件索引（從 0 開始）。無組件需改寫則 {"indices":[]}`

/** 用 Haiku 一次 batch 識別所有需改寫的組件，失敗回傳 null */
async function classifyComponentsWithHaiku(
  allComponents: GeneratedComponent[],
  availableActions: Array<{ name: string; summary: string }>,
  trackingContext?: { userId?: string; conversationId?: string },
): Promise<number[] | null> {
  try {
    const actionsText = availableActions
      .map(a => `- ${a.name}: ${a.summary}`)
      .join('\n')

    const componentSummaries = allComponents
      .map((comp, i) => `### [${i}] ${comp.path}\n\`\`\`tsx\n${extractComponentSummary(comp.content)}\n\`\`\``)
      .join('\n\n')

    const userMessage = `## 此專案的業務操作（Server Actions）\n${actionsText}\n\n## 組件列表（共 ${allComponents.length} 個）\n\n${componentSummaries}`

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: getAnthropicHeaders(),
      body: JSON.stringify({
        model: MODEL.HAIKU,
        max_tokens: 200,
        temperature: 0,
        system: MOCK_IDENTIFICATION_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!resp.ok) {
      logger.warn({ status: resp.status }, 'Haiku mock 識別 API 失敗')
      return null
    }

    const data = await resp.json() as {
      content: Array<{ type: string; text?: string }>
      usage: { input_tokens: number; output_tokens: number }
    }

    trackLlmUsage({
      model: MODEL.HAIKU,
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0,
      purpose: 'coder_mock_identification',
      userId: trackingContext?.userId,
      conversationId: trackingContext?.conversationId,
    })

    const text = data.content?.[0]?.type === 'text' ? data.content[0].text : null
    if (!text) {
      logger.warn('Haiku mock 識別回應為空')
      return null
    }

    const parsed = safeParseJson<{ indices: number[] }>(text)
    if (!parsed || !Array.isArray(parsed.indices)) {
      logger.warn({ text }, 'Haiku mock 識別 JSON 解析失敗')
      return null
    }

    // 驗證 indices 範圍 + 去重
    const valid = [...new Set(parsed.indices)].filter(
      i => typeof i === 'number' && i >= 0 && i < allComponents.length
    )

    logger.info(
      { raw: parsed.indices.length, valid: valid.length, total: allComponents.length },
      'Haiku mock 識別完成',
    )
    return valid
  } catch (err) {
    logger.warn({ err }, 'Haiku mock 識別異常')
    return null
  }
}

/** Regex fallback 識別 */
function identifyByRegex(
  allComponents: GeneratedComponent[],
): { needsRewrite: GeneratedComponent[]; unchanged: GeneratedComponent[] } {
  const needsRewrite: GeneratedComponent[] = []
  const unchanged: GeneratedComponent[] = []
  for (const comp of allComponents) {
    if (MOCK_DATA_PATTERNS.some(p => p.test(comp.content))) {
      needsRewrite.push(comp)
    } else {
      unchanged.push(comp)
    }
  }
  return { needsRewrite, unchanged }
}

export async function identifyMockDataComponents(
  code: GeneratedCode,
  options?: {
    availableActions?: Array<{ name: string; summary: string }>
    trackingContext?: { userId?: string; conversationId?: string }
  },
): Promise<{ needsRewrite: GeneratedComponent[]; unchanged: GeneratedComponent[] }> {
  const allComponents = [...code.pages, ...code.components]

  // Haiku LLM 識別（需要 availableActions）
  if (options?.availableActions && options.availableActions.length > 0) {
    const indices = await classifyComponentsWithHaiku(
      allComponents,
      options.availableActions,
      options.trackingContext,
    )

    if (indices !== null) {
      const indexSet = new Set(indices)
      const needsRewrite: GeneratedComponent[] = []
      const unchanged: GeneratedComponent[] = []
      for (let i = 0; i < allComponents.length; i++) {
        if (indexSet.has(i)) {
          needsRewrite.push(allComponents[i])
        } else {
          unchanged.push(allComponents[i])
        }
      }
      logger.info({ needsRewrite: needsRewrite.length, unchanged: unchanged.length, method: 'haiku' }, '組件分類完成')
      return { needsRewrite, unchanged }
    }

    logger.warn('Haiku 識別失敗，降級到 regex')
  }

  // Fallback: regex
  const result = identifyByRegex(allComponents)
  logger.info({ needsRewrite: result.needsRewrite.length, unchanged: result.unchanged.length, method: 'regex' }, '組件分類完成')
  return result
}

// ============================================================
// 6. LLM 改寫 UIUX 組件
// ============================================================

function buildRewriteSystemPrompt(): string {
  return `你是一位 Next.js 前端工程師。你的任務是改寫一個 React 組件，將 mock 數據替換為 Server Action 調用。

## 改寫規則
1. 保留所有 UI 結構、樣式（Tailwind class）、動畫（motion/react）不變
2. 將 useState([{...mock data...}]) 替換為 useState<Type[]>([]) + useEffect 中調用 Server Action 獲取資料
3. 將 useState({...mock object...}) 替換為 useState<Type | null>(null) + useEffect 載入
4. 將硬編碼常數陣列 const items = [{...}] 替換為 Server Action 動態載入
5. 將表單提交的 mock 邏輯替換為調用對應的 create/update/delete Server Action
6. Server Action import 格式：import { actionNameAction } from '@/app/actions/domain'
7. 保留 'use client' 指令
8. 加 loading 狀態（簡單的 loading spinner 或 skeleton）
9. 加 error 狀態（try/catch + error state + 錯誤提示）
10. 不要引入任何新的 npm 套件
11. 如果組件只是純 UI 展示（沒有資料操作），保持原樣不改

## Server Action 調用規範（重要！）
這些 Server Actions 使用 **_stepSummary** 欄位（中文子操作名稱）作為操作派發，**不是** intent/action 欄位。

**_stepSummary 必須使用 Action 函數中定義的精確值**（見下方 Action 介面定義中 if (op.includes('...')) 的字串）。
不要自己發明 _stepSummary 值，必須從 Action 原始碼中找到對應的 includes() 判斷條件。

例如：如果 Action 程式碼中寫 if (op.includes('註冊'))，那 _stepSummary 必須包含「註冊」（如 '使用者註冊'），不能用「建立帳號」等同義詞。

標準調用方式：
- **列表查詢**（頁面初始載入）：actionFn({ _stepSummary: '查詢列表' }) — **不傳 ID，不傳 userId**
- **單筆查詢**（詳情頁）：actionFn({ _stepSummary: '查詢詳情', entityId: '...' }) — 傳 ID
- **建立**：actionFn({ _stepSummary: '建立XXX', ...fields })
- **更新**：actionFn({ _stepSummary: '更新XXX', id: '...', ...fields })
- **刪除**：actionFn({ _stepSummary: '刪除XXX', id: '...' })

**認證已自動處理**：Server Action 會從 cookie 自動注入 userId，**組件絕對不需要手動傳 userId**。登入成功後 cookie 自動設定，你只需管理 UI 狀態（如 setIsLoggedIn(true)）。

**不要重複 key**：每個參數只寫一次（JS 物件中重複 key 只保留最後一個，浪費且易混淆）。

**頁面初始載入資料時，必須使用包含「列表」或「全部」的 _stepSummary，不要用「查詢」（那是單筆，需要 ID）。**

回傳格式：成功時直接回傳欄位（result.fieldName 或 result 本身是陣列），失敗時 throw Error。
**不要用 result.data.xxx，要直接用 result.xxx。** 列表查詢回傳陣列時直接用 result（它就是陣列）。
**不要傳 { intent: 'get' }，這樣的調用無效。**

以下是實際函數的 Input/Output 介面定義和完整實作，**_stepSummary 必須精確匹配**：

## 輸出
只輸出完整的改寫後 TypeScript/JSX 代碼，不要任何解釋或 markdown 包裹。`
}

function extractInterfacesFromActionFile(content: string): string {
  const lines = content.split('\n')
  const result: string[] = []
  let inInterface = false
  let braceDepth = 0

  for (const line of lines) {
    if (!inInterface && (line.startsWith('interface ') || line.startsWith('export interface '))) {
      inInterface = true
      braceDepth = 0
      result.push(line)
      continue
    }
    if (!inInterface && line.startsWith('export async function ')) {
      // 只取函數簽名第一行
      result.push(line.split('{')[0].trimEnd())
      result.push('...')
      result.push('}')
      result.push('')
      continue
    }
    if (inInterface) {
      result.push(line)
      braceDepth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length
      if (braceDepth <= 0 && line.includes('}')) {
        inInterface = false
        result.push('')
      }
    }
  }

  // 提取所有 _stepSummary 合法值（從 op.includes('...') 中抓取）
  const stepSummaries: string[] = []
  for (const m of content.matchAll(/op\.includes\(['"]([^'"]+)['"]\)/g)) {
    stepSummaries.push(m[1])
  }
  if (stepSummaries.length > 0) {
    result.push('')
    result.push(`// 合法的 _stepSummary 值（必須包含以下關鍵字之一）：`)
    result.push(`// ${stepSummaries.map(s => `「${s}」`).join('、')}`)
  }

  return result.join('\n')
}

function buildRewriteUserPrompt(
  component: GeneratedComponent,
  availableActions: { path: string; exports: string[] }[],
  actionImplementations?: { path: string; content: string }[]
): string {
  const actionsText = availableActions
    .map(a => `- ${a.path}: ${a.exports.join(', ')}`)
    .join('\n')

  let interfacesText = ''
  if (actionImplementations && actionImplementations.length > 0) {
    interfacesText = '\n## Action 介面定義\n' +
      actionImplementations
        .map(a => `// ${a.path}\n${extractInterfacesFromActionFile(a.content)}`)
        .join('\n')
  }

  return `## 可用的 Server Actions
${actionsText}
${interfacesText}
## 原始組件（路徑：${component.path}）
${component.content}

請改寫此組件，將 mock 數據替換為 Server Action 調用。路徑保持不變：${component.path}`
}

/**
 * 大組件（>20KB）用 SEARCH/REPLACE diff 模式改寫，只輸出修改的部分。
 * 小組件照舊全文改寫。
 */
export async function rewriteComponentForServerActions(
  component: GeneratedComponent,
  availableActions: { path: string; exports: string[] }[],
  actionImplementations?: { path: string; content: string }[],
  trackingContext?: { userId?: string; conversationId?: string }
): Promise<GeneratedComponent> {
  const isLargeComponent = component.content.length > 20000 // > 20KB 用 diff 模式

  if (isLargeComponent) {
    return rewriteWithDiffMode(component, availableActions, actionImplementations, trackingContext)
  }

  const systemPrompt = buildRewriteSystemPrompt()
  const userPrompt = buildRewriteUserPrompt(component, availableActions, actionImplementations)

  const estimatedTokens = Math.ceil(component.content.length / 3) + 2048
  const maxTokens = Math.max(8192, Math.min(estimatedTokens, 64000))
  const result = await callClaude(systemPrompt, userPrompt, { maxTokens }, trackingContext)

  if (!result.success || !result.content) {
    logger.warn({ path: component.path, error: result.error }, '組件改寫失敗，保留原始版本')
    return component
  }

  const code = extractCodeFromResponse(result.content)

  // 截斷偵測：JSX 開閉標籤不平衡 → 回退原始組件
  const openTags = (code.match(/<[A-Z]\w*/g) || []).length
  const closeTags = (code.match(/<\/[A-Z]\w*>/g) || []).length
  if (openTags > 0 && Math.abs(openTags - closeTags) > 2) {
    logger.warn({ path: component.path, openTags, closeTags }, '改寫後 JSX 標籤不平衡（可能截斷），回退原始版本')
    return component
  }

  return {
    path: component.path,
    content: code,
    description: component.description,
  }
}

/**
 * 大組件的 SEARCH/REPLACE diff 改寫模式。
 * LLM 只輸出 mock 數據替換為 Server Action 的修改片段，不輸出整個檔案。
 * 大幅減少 output tokens（68KB 組件 → ~3-5KB diff）。
 */
async function rewriteWithDiffMode(
  component: GeneratedComponent,
  availableActions: { path: string; exports: string[] }[],
  actionImplementations?: { path: string; content: string }[],
  trackingContext?: { userId?: string; conversationId?: string }
): Promise<GeneratedComponent> {
  const systemPrompt = buildRewriteSystemPrompt() + `

## 重要：使用 SEARCH/REPLACE 格式輸出（大組件模式）
此組件很大（${Math.round(component.content.length / 1024)}KB），不要輸出完整檔案。
只輸出需要修改的部分，使用以下格式：

<<<<<<< SEARCH
需要被替換的原始代碼（精確匹配，包括空白和縮排）
=======
替換後的新代碼
>>>>>>> REPLACE

每個 SEARCH/REPLACE block 修改一處。可以有多個 block。
SEARCH 部分必須精確匹配原始代碼（逐字元對應）。
只修改 mock 數據相關的部分（import、useState 初始值、fetch/API 調用），保留所有 UI/動畫/樣式不變。

典型修改：
1. 新增 import：在檔案頂部 import Server Action
2. 替換 useState 初始值：mock 陣列 → 空陣列 + useEffect fetch
3. 替換 CRUD 操作：直接修改 state → 呼叫 Server Action`

  const userPrompt = buildRewriteUserPrompt(component, availableActions, actionImplementations)

  // diff 模式不需要很多 output tokens（只輸出修改部分）
  const maxTokens = Math.min(16384, 64000)
  const result = await callClaude(systemPrompt, userPrompt, { maxTokens }, trackingContext)

  if (!result.success || !result.content) {
    logger.warn({ path: component.path, error: result.error }, '大組件 diff 改寫失敗，保留原始版本')
    return component
  }

  // 解析 SEARCH/REPLACE blocks
  const BLOCK_REGEX = /<<<<<<< SEARCH\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>> REPLACE/g
  const blocks: Array<{ search: string; replace: string }> = []
  let match: RegExpExecArray | null
  while ((match = BLOCK_REGEX.exec(result.content)) !== null) {
    blocks.push({ search: match[1], replace: match[2] })
  }

  if (blocks.length === 0) {
    // LLM 沒有輸出 SEARCH/REPLACE 格式 → 嘗試當全文處理
    const code = extractCodeFromResponse(result.content)
    const openTags = (code.match(/<[A-Z]\w*/g) || []).length
    const closeTags = (code.match(/<\/[A-Z]\w*>/g) || []).length
    if (openTags > 0 && Math.abs(openTags - closeTags) > 2) {
      logger.warn({ path: component.path, openTags, closeTags }, '大組件 fallback 全文模式也截斷，回退原始版本')
      return component
    }
    return { path: component.path, content: code, description: component.description }
  }

  // 逐個 block 應用到原始代碼
  let modifiedContent = component.content
  let appliedCount = 0
  let failedCount = 0

  for (const block of blocks) {
    const searchTrimmed = block.search.trim()
    if (!searchTrimmed) continue

    // 精確匹配
    if (modifiedContent.includes(searchTrimmed)) {
      modifiedContent = modifiedContent.replace(searchTrimmed, block.replace.trim())
      appliedCount++
    } else {
      // 容錯：忽略前後空白差異
      const fuzzySearch = searchTrimmed.split('\n').map(l => l.trim()).join('\n')
      const fuzzyContent = modifiedContent.split('\n').map(l => l.trim()).join('\n')
      if (fuzzyContent.includes(fuzzySearch)) {
        // 找到原始代碼中的位置
        const lines = modifiedContent.split('\n')
        const searchLines = searchTrimmed.split('\n')
        let startIdx = -1
        for (let i = 0; i <= lines.length - searchLines.length; i++) {
          let match = true
          for (let j = 0; j < searchLines.length; j++) {
            if (lines[i + j].trim() !== searchLines[j].trim()) {
              match = false
              break
            }
          }
          if (match) {
            startIdx = i
            break
          }
        }
        if (startIdx >= 0) {
          const replaceLines = block.replace.trim().split('\n')
          lines.splice(startIdx, searchLines.length, ...replaceLines)
          modifiedContent = lines.join('\n')
          appliedCount++
        } else {
          failedCount++
        }
      } else {
        failedCount++
      }
    }
  }

  logger.info({
    path: component.path,
    totalBlocks: blocks.length,
    applied: appliedCount,
    failed: failedCount,
    sizeBefore: component.content.length,
    sizeAfter: modifiedContent.length,
  }, '大組件 SEARCH/REPLACE diff 改寫完成')

  if (appliedCount === 0) {
    logger.warn({ path: component.path }, '所有 SEARCH/REPLACE block 都失敗，回退原始版本')
    return component
  }

  return {
    path: component.path,
    content: modifiedContent,
    description: component.description,
  }
}

// ============================================================
// 7. Pipeline 入口
// ============================================================

export async function executeCoderPipeline(
  input: CoderInput,
  callbacks: {
    onProgress: (step: string, percent: number) => Promise<void>
  }
): Promise<CoderOutput> {
  const { actionsYml, schemaSql, entityMapping, existingUiuxCode, features, trackingContext } = input

  // Step 1: 解析 actionsYml
  await callbacks.onProgress('解析 BDD 規格...', 2)
  const { actions, types } = parseActionsYml(actionsYml)
  logger.info({ actionCount: actions.length }, 'actionsYml 解析完成')

  if (actions.length === 0) {
    throw new Error('actionsYml 中沒有任何 action 定義')
  }

  // Step 2: 生成 DB 連接
  await callbacks.onProgress('建立資料庫連接...', 5)
  const dbFile = generateDbConnection()

  // Step 3: 並行生成 action 函數（限制並發 3）
  await callbacks.onProgress(`生成 ${actions.length} 個後端函數...`, 8)
  const actionFiles = await runWithConcurrencyLimit(
    actions,
    async (action, idx) => {
      const percent = 8 + Math.floor((idx / actions.length) * 42)
      await callbacks.onProgress(`生成 ${action.name}...`, percent)
      return generateActionFunction(action, { schemaSql, entityMapping, types, features }, trackingContext)
    },
    3
  )

  // Step 4: 生成 Server Actions
  await callbacks.onProgress('生成 Server Actions...', 50)
  const serverActionFiles = generateServerActions(actions, entityMapping)

  // Step 4.5: 生成 API Routes（零 LLM，SpecFormula 測試用）
  await callbacks.onProgress('生成 API Routes...', 53)
  const apiRouteFiles = generateApiRoutes(actions, actionsYml)
  logger.info({ count: apiRouteFiles.length }, 'API Routes 生成完成')

  // Step 5: 識別需改寫的組件（Haiku LLM + regex fallback）
  await callbacks.onProgress('分析前端組件...', 55)
  let { needsRewrite, unchanged } = await identifyMockDataComponents(existingUiuxCode, {
    availableActions: actions.map(a => ({ name: a.name, summary: a.summary })),
    trackingContext,
  })

  // 構建 availableActions（供前端改寫 LLM 參考）
  const availableActions = serverActionFiles.map(f => ({
    path: f.path,
    exports: extractExportNames(f.content),
  }))

  // Step 6: 並行改寫前端組件（限制並發 3）
  let rewrittenFrontend: GeneratedComponent[] = []
  if (needsRewrite.length > 0) {
    await callbacks.onProgress(`改寫 ${needsRewrite.length} 個前端組件...`, 58)
    rewrittenFrontend = await runWithConcurrencyLimit(
      needsRewrite,
      async (comp, idx) => {
        const percent = 58 + Math.floor((idx / needsRewrite.length) * 37)
        await callbacks.onProgress(`改寫 ${comp.path}...`, percent)
        return rewriteComponentForServerActions(comp, availableActions, actionFiles, trackingContext)
      },
      3
    )
  }

  // Step 7: Named import 驗證與修復（零 LLM）
  await callbacks.onProgress('驗證 import 引用...', 96)
  const allFrontendFiles = [...rewrittenFrontend, ...unchanged]
  const backendFilesRaw = [dbFile, ...actionFiles, ...serverActionFiles, ...apiRouteFiles]
  const { sanitized: sanitizedFrontend, fixes } = sanitizeNamedImports([...allFrontendFiles, ...backendFilesRaw])

  // 分離回前端和後端
  const frontendPaths = new Set(allFrontendFiles.map(f => f.path))
  const backendPaths = new Set(backendFilesRaw.map(f => f.path))
  const finalRewritten: GeneratedComponent[] = []
  const finalUnchanged: GeneratedComponent[] = []
  const rewrittenPathSet = new Set(rewrittenFrontend.map(f => f.path))

  for (const f of sanitizedFrontend) {
    if (backendPaths.has(f.path)) continue
    if (rewrittenPathSet.has(f.path)) {
      finalRewritten.push(f as GeneratedComponent)
    } else if (frontendPaths.has(f.path)) {
      finalUnchanged.push(f as GeneratedComponent)
    }
  }
  rewrittenFrontend = finalRewritten
  unchanged = finalUnchanged

  if (fixes.length > 0) {
    logger.info({ fixCount: fixes.length }, 'Named import 修復完成')
  }

  // Step 8: 驗證前端 _stepSummary 呼叫 vs 後端 action 分支（零 LLM）
  await callbacks.onProgress('驗證前後端一致性...', 97)
  const actionCallFixes = validateAndFixActionCalls(
    [...rewrittenFrontend, ...unchanged],
    actionFiles,
    serverActionFiles,
  )
  if (actionCallFixes.length > 0) {
    logger.info({ fixCount: actionCallFixes.length, fixes: actionCallFixes }, 'Action call 修正完成')
  }

  // Step 8: Post-generation response 驗證（零 LLM）
  const { files: validatedActionFiles, fixes: responseFixes } = validateActionResponses(actionFiles)
  if (responseFixes.length > 0) {
    // 用修復後的版本替換原始 action files
    for (const vf of validatedActionFiles) {
      const idx = actionFiles.findIndex(f => f.path === vf.path)
      if (idx !== -1) actionFiles[idx] = vf
    }
  }

  await callbacks.onProgress('完成！', 98)

  const backendFiles = sanitizedFrontend.filter(f => backendPaths.has(f.path)) as typeof backendFilesRaw
  if (backendFiles.length === 0) backendFiles.push(...backendFilesRaw) // fallback
  const summary = `生成了 ${actionFiles.length} 個後端函數、${serverActionFiles.length} 個 Server Action、${apiRouteFiles.length} 個 API Route，改寫了 ${rewrittenFrontend.length} 個前端組件（${unchanged.length} 個保持不變）。`

  logger.info({
    actionFiles: actionFiles.length,
    serverActionFiles: serverActionFiles.length,
    rewrittenFrontend: rewrittenFrontend.length,
    unchangedFrontend: unchanged.length,
  }, 'Coder Pipeline 完成')

  return { backendFiles, rewrittenFrontend, unchangedFrontend: unchanged, summary }
}

// ============================================================
// 8. Post-generation response 驗證 + 自動修復（零 LLM）
// ============================================================

/**
 * 掃描 LLM 生成的 action 代碼，修復常見的 response 格式問題：
 * - 列表查詢包成 Object 而非回 Array
 * - UPDATE 缺 RETURNING *
 * - 批次操作缺 success: true
 */
export function validateActionResponses(actionFiles: GeneratedComponent[]): { files: GeneratedComponent[]; fixes: string[] } {
  const fixes: string[] = []
  const result = actionFiles.map(file => {
    if (!file.path.startsWith('lib/actions/')) return file
    let code = file.content
    let modified = false

    // Rule 1: 列表查詢回 Array（不要包成 { items: rows }）
    // 找 return { __status: 200, items: rows } 或 { __status: 200, data: rows } 模式
    const listWrapperPattern = /return\s*\{\s*__status:\s*200\s*,\s*(?:items|data|results|list|lists|todos|records)\s*:\s*(\w+)\s*\}/g
    let match: RegExpExecArray | null
    while ((match = listWrapperPattern.exec(code)) !== null) {
      const rowsVar = match[1]
      const original = match[0]
      const replacement = `;(${rowsVar} as any).__status = 200; return ${rowsVar}`
      code = code.replace(original, replacement)
      fixes.push(`${file.path}: 列表查詢 Object wrapper → bare Array（${rowsVar}）`)
      modified = true
    }

    // Rule 2: UPDATE 語句必須有 RETURNING *
    // 找 await sql`UPDATE ... ` 後面沒有 RETURNING
    const updateNoReturning = /const\s+\[?\s*(\w+)\s*\]?\s*=\s*await\s+sql\s*`\s*UPDATE\s+[^`]*?WHERE\s+[^`]*?(?<!RETURNING\s+\*)\s*`/gi
    const updateBlocks = code.match(updateNoReturning)
    if (updateBlocks) {
      for (const block of updateBlocks) {
        if (!block.includes('RETURNING')) {
          const fixed = block.replace(/`\s*$/, ' RETURNING *`')
          code = code.replace(block, fixed)
          fixes.push(`${file.path}: UPDATE 加 RETURNING *`)
          modified = true
        }
      }
    }

    // Rule 3: 批次操作（for 循環 + UPDATE）後必須有 success: true
    // 找 for 循環結束後的 return 如果缺 success
    const batchPattern = /for\s*\([^)]*\)\s*\{[^}]*await\s+sql\s*`\s*UPDATE[^}]*\}\s*\n\s*return\s*\{([^}]*)\}/g
    let batchMatch: RegExpExecArray | null
    while ((batchMatch = batchPattern.exec(code)) !== null) {
      const returnBody = batchMatch[1]
      if (!returnBody.includes('success')) {
        const originalReturn = `return {${returnBody}}`
        const fixedReturn = `return {${returnBody}${returnBody.trim() ? ', ' : ''}success: true}`
        code = code.replace(originalReturn, fixedReturn)
        fixes.push(`${file.path}: 批次操作加 success: true`)
        modified = true
      }
    }

    // Rule 3b: 簡化匹配 — return { __status: 200 } 在 for 循環後
    if (code.includes('sort_order') || code.includes('sortOrder') || code.includes('reorder')) {
      const simpleReturn = /return\s*\{\s*__status:\s*200\s*\}(?!\s*[,;]?\s*success)/g
      if (simpleReturn.test(code) && !code.includes('success: true')) {
        code = code.replace(/return\s*\{\s*__status:\s*200\s*\}/g, 'return { __status: 200, success: true }')
        fixes.push(`${file.path}: 排序操作加 success: true`)
        modified = true
      }
    }

    // Rule 4: 物理 DELETE → 軟刪除（偵測 DELETE FROM 且代碼其他地方有 deleted_at 暗示）
    const hasDeleteFrom = /await\s+(?:sql|tx)\s*`\s*DELETE\s+FROM\s+/i.test(code)
    const hasDeletedAtUsage = /deleted_at/i.test(code)
    const hasDeletedAtInSql = /deleted_at\s+IS\s+NULL/i.test(code)
    if (hasDeleteFrom && (hasDeletedAtUsage || hasDeletedAtInSql)) {
      // 只在同一個 action 已經在其他地方用了 deleted_at（暗示表有此欄位）時才修復
      code = code.replace(
        /await\s+(sql|tx)\s*`\s*DELETE\s+FROM\s+(\w+)\s+WHERE\s+([^`]*?)\s*`/gi,
        (match, driver, table, whereClause) => {
          fixes.push(`${file.path}: DELETE FROM ${table} → 軟刪除 (SET deleted_at = NOW())`)
          modified = true
          return `await ${driver}\`UPDATE ${table} SET deleted_at = NOW(), updated_at = NOW() WHERE ${whereClause} RETURNING *\``
        }
      )
    }

    // Rule 5: 裸 SUM/COUNT 沒包 COALESCE → 自動加上
    const nakedAggregatePattern = /(?<!COALESCE\s*\(\s*)(SUM|COUNT|AVG)\s*\(/gi
    if (nakedAggregatePattern.test(code)) {
      // 重置 lastIndex
      nakedAggregatePattern.lastIndex = 0
      // 用更精確的 pattern 替換（只處理 SQL template literal 內的）
      const sqlBlockPattern = /sql\s*`([^`]*)`/g
      let sqlMatch: RegExpExecArray | null
      while ((sqlMatch = sqlBlockPattern.exec(code)) !== null) {
        const sqlContent = sqlMatch[1]
        if (/(?<!COALESCE\s*\(\s*)(SUM|COUNT|AVG)\s*\(/i.test(sqlContent)) {
          const fixedSql = sqlContent.replace(
            /(?<!COALESCE\s*\(\s*)((?:SUM|COUNT|AVG)\s*\([^)]*\))/gi,
            'COALESCE($1, 0)'
          )
          if (fixedSql !== sqlContent) {
            code = code.replace(sqlContent, fixedSql)
            fixes.push(`${file.path}: 聚合函數加 COALESCE 防 NULL`)
            modified = true
          }
        }
      }
    }

    return modified ? { ...file, content: code } : file
  })

  if (fixes.length > 0) {
    logger.info({ fixCount: fixes.length, fixes }, 'Action response 自動修復完成')
  }

  return { files: result, fixes }
}

// ============================================================
// 9. 前後端 _stepSummary 一致性驗證（零 LLM）
// ============================================================

interface ActionBranch {
  keywords: string[]        // op.includes('XXX') 的所有關鍵字
  requiredParams: string[]  // if (!input.xxx) throw 中的 xxx
  order: number             // if/else if 順序
}

interface ActionBranchMap {
  functionName: string
  branches: ActionBranch[]
}

/** 從 action 檔案提取所有 if/else if 分支和必要參數 */
function extractActionBranches(actionContent: string): ActionBranch[] {
  const branches: ActionBranch[] = []

  // 用行掃描法提取分支
  const lines = actionContent.split('\n')
  let currentBranch: ActionBranch | null = null
  let order = 0

  for (const line of lines) {
    const trimmed = line.trim()

    // 偵測 if/else if (op.includes('...'))
    const branchMatch = trimmed.match(/^(?:}\s*else\s+)?if\s*\(/)
    if (branchMatch && trimmed.includes('op.includes')) {
      // 提取所有 op.includes('...') 關鍵字
      const keywords: string[] = []
      for (const m of trimmed.matchAll(/op\.includes\(['"]([^'"]+)['"]\)/g)) {
        keywords.push(m[1])
      }
      if (keywords.length > 0) {
        currentBranch = { keywords, requiredParams: [], order: order++ }
        branches.push(currentBranch)
      }
      continue
    }

    // 在當前分支內偵測必要參數：if (!input.xxx) { throw
    if (currentBranch && /if\s*\(\s*!input\.(\w+)\s*\)/.test(trimmed)) {
      const paramMatch = trimmed.match(/if\s*\(\s*!input\.(\w+)\s*\)/)
      if (paramMatch) {
        currentBranch.requiredParams.push(paramMatch[1])
      }
    }

    // 偵測分支結束（遇到下一個 } else if 或 } else { throw）
    if (trimmed.startsWith('} else {') || trimmed === '}') {
      // 可能是最後的 else { throw } 或函數結束
    }
  }

  return branches
}

/** 從 server action 檔案建立 actionNameAction → lib/actions 函數名的映射 */
function buildActionNameMap(
  serverActionFiles: { path: string; content: string }[],
  actionFiles: { path: string; content: string }[],
): Map<string, { functionName: string; content: string }> {
  const map = new Map<string, { functionName: string; content: string }>()

  for (const sa of serverActionFiles) {
    // 提取 export async function xxxAction
    const exportMatch = sa.content.match(/export\s+async\s+function\s+(\w+Action)/)
    if (!exportMatch) continue
    const actionFnName = exportMatch[1] // e.g. manageAuthAction

    // 提取 import { yyy } from '@/lib/actions/zzz'
    const importMatch = sa.content.match(/import\s*\{\s*(\w+)\s*\}\s*from\s*['"]@\/lib\/actions\/([^'"]+)['"]/)
    if (!importMatch) continue
    const libFnName = importMatch[1] // e.g. manageAuth
    const libPath = `lib/actions/${importMatch[2]}.ts`

    // 找到對應的 action 實作檔案
    const actionFile = actionFiles.find(f =>
      f.path === libPath || f.path === libPath.replace('.ts', '.tsx')
    )
    if (actionFile) {
      map.set(actionFnName, { functionName: libFnName, content: actionFile.content })
    }
  }

  return map
}

// 標準 _stepSummary 值（避免關鍵字衝突）
const STANDARD_SUMMARIES = {
  list: '查詢列表',
  query: '查詢詳情',
  create: '建立資料',
  update: '更新資料',
  delete: '刪除資料',
} as const

const LIST_KEYWORDS = ['列表', '全部']
const QUERY_KEYWORDS = ['查詢', '詳情']
const CREATE_KEYWORDS = ['建立', '新增', '註冊']
const UPDATE_KEYWORDS = ['更新', '修改', '編輯']
const DELETE_KEYWORDS = ['刪除', '移除', '取消']

/** 從呼叫上下文提取完整的參數物件內容（brace matching） */
function extractCallParams(content: string, callStart: number): { params: Set<string>; fullCallEnd: number } {
  const params = new Set<string>()
  let braceDepth = 0
  let inBrace = false
  let paramContent = ''

  for (let i = callStart; i < content.length && i < callStart + 500; i++) {
    const ch = content[i]
    if (ch === '{') {
      braceDepth++
      inBrace = true
    }
    if (inBrace) paramContent += ch
    if (ch === '}') {
      braceDepth--
      if (braceDepth === 0) {
        // 提取所有 key: 或 key, 形式的參數名
        for (const m of paramContent.matchAll(/(\w+)\s*:/g)) {
          if (m[1] !== '_stepSummary') params.add(m[1])
        }
        return { params, fullCallEnd: i }
      }
    }
  }

  return { params, fullCallEnd: callStart + 500 }
}

/** 判斷一組參數是否包含 ID 類參數 */
function hasIdLikeParam(params: Set<string>): boolean {
  return [...params].some(p => p.endsWith('Id') || p === 'id')
}

/** 判斷一組參數是否只有 _stepSummary（無其他業務參數） */
function isListCall(params: Set<string>): boolean {
  // 過濾掉常見的非業務參數
  const businessParams = [...params].filter(p => p !== '_stepSummary' && p !== 'userId')
  return businessParams.length === 0 || !businessParams.some(p => p.endsWith('Id') || p === 'id')
}

/** 從 _stepSummary 值和參數推斷意圖 */
function inferIntent(
  stepSummary: string,
  params: Set<string>,
): 'list' | 'query' | 'create' | 'update' | 'delete' | 'unknown' {
  const hasId = hasIdLikeParam(params)
  const businessParams = [...params].filter(p => p !== '_stepSummary' && p !== 'userId')

  // 明確的刪除/取消意圖
  if (DELETE_KEYWORDS.some(kw => stepSummary.includes(kw))) return 'delete'

  // 明確的建立意圖
  if (CREATE_KEYWORDS.some(kw => stepSummary.includes(kw)) && !QUERY_KEYWORDS.some(kw => stepSummary.includes(kw))) return 'create'

  // 明確的更新意圖
  if (UPDATE_KEYWORDS.some(kw => stepSummary.includes(kw))) return 'update'

  // 明確的列表意圖
  if (LIST_KEYWORDS.some(kw => stepSummary.includes(kw))) return 'list'

  // 不傳 ID 且沒有其他業務參數 → 列表
  if (!hasId && businessParams.length === 0) return 'list'

  // 傳了 ID 但沒有其他修改欄位 → 單筆查詢
  if (hasId && businessParams.filter(p => !p.endsWith('Id') && p !== 'id').length === 0) return 'query'

  // 傳了 ID + 其他欄位 → 更新
  if (hasId && businessParams.length > 1) return 'update'

  return 'unknown'
}

/** 根據意圖找到對應的 action 分支 */
function findBranchForIntent(branches: ActionBranch[], intent: string): ActionBranch | null {
  const keywordMap: Record<string, string[]> = {
    list: LIST_KEYWORDS,
    query: QUERY_KEYWORDS,
    create: CREATE_KEYWORDS,
    update: UPDATE_KEYWORDS,
    delete: DELETE_KEYWORDS,
  }

  const targetKeywords = keywordMap[intent]
  if (!targetKeywords) return null

  // 對 list 要排除同時含 query 關鍵字的分支
  if (intent === 'list') {
    return branches.find(b => b.keywords.some(kw => LIST_KEYWORDS.includes(kw))) || null
  }

  // 對 query 要排除 list 分支
  if (intent === 'query') {
    return branches.find(b =>
      b.keywords.some(kw => QUERY_KEYWORDS.includes(kw)) &&
      !b.keywords.some(kw => LIST_KEYWORDS.includes(kw))
    ) || null
  }

  return branches.find(b => b.keywords.some(kw => targetKeywords.includes(kw))) || null
}

/** 生成不會衝突的 _stepSummary 值 */
function generateSafeSummary(intent: string): string {
  return STANDARD_SUMMARIES[intent as keyof typeof STANDARD_SUMMARIES] || '查詢列表'
}

/** 驗證並修正前端組件中的 _stepSummary 呼叫 */
function validateAndFixActionCalls(
  frontendFiles: Array<{ path: string; content: string; description?: string }>,
  actionFiles: Array<{ path: string; content: string; description?: string }>,
  serverActionFiles: Array<{ path: string; content: string; description?: string }>,
): Array<{ file: string; original: string; fixed: string; reason: string }> {
  const fixes: Array<{ file: string; original: string; fixed: string; reason: string }> = []
  const actionMap = buildActionNameMap(serverActionFiles, actionFiles)

  for (let fi = 0; fi < frontendFiles.length; fi++) {
    const file = frontendFiles[fi]
    let content = file.content
    const replacements: Array<{ from: string; to: string }> = []

    // 找所有 xxxAction({ ... _stepSummary: '...' ... }) 呼叫
    const callRegex = /(\w+Action)\s*\(\s*\{/g
    let callMatch

    while ((callMatch = callRegex.exec(content)) !== null) {
      const actionFnName = callMatch[1]
      const actionInfo = actionMap.get(actionFnName)
      if (!actionInfo) continue

      const branches = extractActionBranches(actionInfo.content)
      if (branches.length === 0) continue

      // 提取完整的參數物件
      const { params } = extractCallParams(content, callMatch.index + callMatch[0].length - 1)

      // 提取 _stepSummary 值
      const callSlice = content.slice(callMatch.index, callMatch.index + 500)
      const summaryMatch = callSlice.match(/_stepSummary:\s*['"]([^'"]+)['"]/)

      // 沒有 _stepSummary → LLM 用了 intent/action/type 等錯誤格式，需要整段替換
      if (!summaryMatch) {
        const intentMatch = callSlice.match(/(?:intent|action|type)\s*:\s*['"](\w+)['"]/)
        if (!intentMatch) continue

        const wrongKey = intentMatch[0] // e.g. intent: 'get'
        const wrongValue = intentMatch[1] // e.g. 'get'

        // 從錯誤的 intent 值推斷意圖
        const intentMap: Record<string, string> = {
          get: 'list', list: 'list', fetch: 'list', query: 'query', read: 'query',
          create: 'create', add: 'create', post: 'create', register: 'create',
          update: 'update', put: 'update', patch: 'update', edit: 'update', save: 'update',
          delete: 'delete', remove: 'delete', destroy: 'delete', cancel: 'delete',
        }
        const guessedIntent = intentMap[wrongValue.toLowerCase()] || 'list'
        const safeSummary = generateSafeSummary(guessedIntent)

        // 替換整個錯誤的 key: value 為 _stepSummary: 'xxx'
        content = content.split(wrongKey).join(`_stepSummary: '${safeSummary}'`)
        frontendFiles[fi] = { ...frontendFiles[fi], content }
        fixes.push({
          file: file.path,
          original: wrongKey,
          fixed: `_stepSummary: '${safeSummary}'`,
          reason: `未使用 _stepSummary（用了 ${wrongKey}），替換為標準格式`,
        })
        continue
      }

      const stepSummary = summaryMatch[1]

      // 模擬 JS runtime 匹配：依序找第一個匹配的分支
      let matchedBranch: ActionBranch | null = null
      for (const branch of branches) {
        if (branch.keywords.some(kw => stepSummary.includes(kw))) {
          matchedBranch = branch
          break
        }
      }

      // 推斷前端呼叫的意圖
      const intent = inferIntent(stepSummary, params)
      if (intent === 'unknown') continue

      // 找到意圖對應的正確分支
      const correctBranch = findBranchForIntent(branches, intent)
      if (!correctBranch) continue

      // 如果匹配到的分支就是正確的分支 → OK
      if (matchedBranch === correctBranch) continue

      // 匹配到錯誤的分支 → 需要修正
      const safeSummary = generateSafeSummary(intent)

      // 確認新的 summary 會正確匹配到目標分支
      let wouldMatch: ActionBranch | null = null
      for (const branch of branches) {
        if (branch.keywords.some(kw => safeSummary.includes(kw))) {
          wouldMatch = branch
          break
        }
      }

      if (wouldMatch !== correctBranch) {
        // 安全 summary 也衝突 → 直接用目標分支的第一個關鍵字
        const directSummary = correctBranch.keywords[0]
        replacements.push({ from: stepSummary, to: directSummary })
        fixes.push({
          file: file.path,
          original: stepSummary,
          fixed: directSummary,
          reason: `意圖「${intent}」但匹配到「${matchedBranch?.keywords[0] || '無'}」分支，改為「${directSummary}」`,
        })
      } else {
        replacements.push({ from: stepSummary, to: safeSummary })
        fixes.push({
          file: file.path,
          original: stepSummary,
          fixed: safeSummary,
          reason: `意圖「${intent}」但匹配到「${matchedBranch?.keywords[0] || '無'}」分支，改為「${safeSummary}」`,
        })
      }
    }

    // 批次替換（replaceAll 避免只改第一個）
    if (replacements.length > 0) {
      for (const { from, to } of replacements) {
        content = content.split(`_stepSummary: '${from}'`).join(`_stepSummary: '${to}'`)
        content = content.split(`_stepSummary: "${from}"`).join(`_stepSummary: "${to}"`)
      }
      frontendFiles[fi] = { ...file, content }
    }
  }

  return fixes
}

// ============================================================
// Feature Execution Key 提取
// ============================================================

/**
 * 從 BDD Feature 文件提取 SpecFormula execution key（<executionKey），
 * 這些是 API response 必須返回的欄位名稱。
 * 不包含 __status（由系統自動處理）。
 */
function extractResponseFieldsFromFeatures(
  features: Array<{ actionName: string; content: string }>,
  actionName: string
): string[] {
  const matched = features.filter(f => f.actionName === actionName)
  if (matched.length === 0) return []

  const fields = new Set<string>()
  for (const feature of matched) {
    // 找 response 驗證步驟後的 data table（Then ...回應, with table:）
    const lines = feature.content.split('\n')
    let inResponseTable = false
    let headerLine = ''

    for (const line of lines) {
      const trimmed = line.trim()

      // 偵測 response 驗證步驟
      if (/(?:Then|And)\s+.+\(\d+\)回應/.test(trimmed)) {
        inResponseTable = true
        headerLine = ''
        continue
      }

      if (inResponseTable) {
        if (trimmed.startsWith('|')) {
          if (!headerLine) {
            headerLine = trimmed // header row（暫存，等 data row 來配對）
          } else {
            // data row — 提取所有需要 LLM 回傳的欄位
            const headers = headerLine.split('|').map(c => c.trim()).filter(Boolean)
            const cells = trimmed.split('|').map(c => c.trim()).filter(Boolean)
            for (let ci = 0; ci < cells.length && ci < headers.length; ci++) {
              const cell = cells[ci]
              const header = headers[ci]
              if (cell.startsWith('<')) {
                fields.add(cell.substring(1)) // <executionKey → 去掉 < 前綴
              } else if ((cell === '$notnull' || cell === '&isNotNull') && header && !header.startsWith('>') && !header.startsWith('<')) {
                fields.add(header) // 驗證非空的欄位 → LLM 必須回傳
              }
            }
          }
        } else {
          inResponseTable = false
        }
      }
    }
  }

  return [...fields]
}

/**
 * 從 Feature 文件提取所有 When 步驟的 summary（即 _stepSummary 值）
 * 這些值是 action 代碼的 `if (op.includes('xxx'))` 必須精確匹配的
 */
function extractStepSummariesFromFeatures(
  features: Array<{ actionName: string; content: string }>,
  actionName: string
): string[] {
  const matched = features.filter(f => f.actionName === actionName)
  if (matched.length === 0) return []

  const summaries = new Set<string>()
  for (const feature of matched) {
    const lines = feature.content.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      // 匹配 When/And 步驟中的 api_call：(UID="...") summary, call table: 或 (No Actor) summary, call table:
      const match = trimmed.match(/(?:When|And)\s+(?:\((?:No Actor|UID="[^"]*")\)\s+)?(.+?),\s*call\s+table:/i)
      if (match) {
        summaries.add(match[1].trim())
      }
    }
  }

  return [...summaries]
}

// ============================================================
// 工具函數
// ============================================================

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase()
}

/** snake_case/kebab-case → camelCase: manage_auth → manageAuth */
function toCamelCase(str: string): string {
  return str
    .split(/[_\s-]+/)
    .map((word, i) => i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
}

/** snake_case/kebab-case → PascalCase: manage_auth → ManageAuth */
function toPascalCase(str: string): string {
  return str
    .split(/[_\s-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
}

/**
 * 從 LLM 回應中提取代碼（移除 markdown 包裹）
 */
function extractCodeFromResponse(response: string): string {
  // 嘗試提取 ```typescript ... ``` 或 ```tsx ... ``` 區塊
  const fencedMatch = response.match(/```(?:typescript|tsx|ts|javascript|jsx)?\s*\n([\s\S]*?)```/)
  if (fencedMatch) return fencedMatch[1].trim()

  // 沒有 markdown 包裹，直接返回
  return response.trim()
}

/**
 * 從 Server Action 檔案內容提取 export 的函數名
 */
function extractExportNames(content: string): string[] {
  const matches = content.matchAll(/export\s+async\s+function\s+(\w+)/g)
  return Array.from(matches, m => m[1])
}

/**
 * 按 entity/domain 分組 actions（從 entityMapping 推導）
 */
function groupActionsByDomain(
  actions: ActionEntry[],
  entityMapping: string
): Record<string, ActionEntry[]> {
  // 解析 entity mapping（YAML: 中文實體 → 表名）
  let mapping: Record<string, string> = {}
  try {
    const parsed = yaml.load(entityMapping)
    if (parsed && typeof parsed === 'object') {
      mapping = parsed as Record<string, string>
    }
  } catch {
    // 解析失敗，使用 action.name 推導
  }

  // 反轉 mapping：表名 → 中文實體
  const tableToEntity = new Map<string, string>()
  for (const [entity, table] of Object.entries(mapping)) {
    if (typeof table === 'string') {
      tableToEntity.set(table.toLowerCase(), entity)
    }
  }

  const groups: Record<string, ActionEntry[]> = {}

  for (const action of actions) {
    // 從 action name 推導 domain（如 createProduct → product）
    const domain = inferDomainFromActionName(action.name)
    if (!groups[domain]) groups[domain] = []
    groups[domain].push(action)
  }

  return groups
}

/**
 * 從 action 名稱推導 domain（如 createProduct → product, listOrders → order）
 */
function inferDomainFromActionName(name: string): string {
  // 移除常見前綴：create/get/list/update/delete/find/check/verify
  const withoutPrefix = name
    .replace(/^(create|get|list|update|delete|find|check|verify|add|remove|cancel|complete|approve|reject)/, '')

  if (!withoutPrefix) return 'general'

  // camelCase → kebab-case 並取第一個詞作 domain
  const kebab = withoutPrefix
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()

  // 移除複數 s（簡單處理）
  const domain = kebab.split('-')[0].replace(/s$/, '')
  return domain || 'general'
}

// ============================================================
// 7. LLM 修復失敗的 Action（紅綠燈循環用）
// ============================================================

const FIX_SYSTEM_PROMPT = `你是一位 TypeScript 後端專家。根據測試失敗結果修復 action 函數。

## 規則
1. 只修改函數內部邏輯，不要改 function signature 或 export
2. 使用 parameterized queries（$1, $2）防 SQL injection
3. 確保 import 完整（特別是 sql from '@/lib/db'）
4. 根據失敗的場景和 error message 推斷需要修改的邏輯
5. 輸出完整的修正後檔案內容（用 \`\`\`typescript\`\`\` 包裹）

## 子操作派發（常見錯誤！）
如果錯誤是 "不支援的操作類型" 或類似的派發問題，是因為函數用了 input.action 來判斷子操作。
正確做法：使用 input._stepSummary（中文子操作名稱，如 "使用者註冊"、"建立節目"）來派發。
\`\`\`typescript
const op = input._stepSummary || ''
if (op.includes('註冊')) { ... }
else if (op.includes('登入')) { ... }
\`\`\`
不要用 input.action，只用 input._stepSummary 做 includes 匹配。

## bcrypt import（常見錯誤！）
如果錯誤是 "bcrypt.hash is not a function"，改為 named import：
import { hash, compare } from 'bcryptjs'
不要用 import bcrypt from 'bcryptjs'。

## 認證檢查（嚴重錯誤 — 絕對禁止！）
絕對不要在函數內檢查認證/登入/角色：
- 禁止寫 if (!userId) throw/return
- 禁止寫 if (!input.userId) 任何東西
- 禁止寫 "操作者必須已登入" "must be logged in" "unauthorized" 等錯誤訊息
- 禁止檢查 token、session、角色、權限
- 如果現有代碼有認證檢查，必須完全刪除
userId 由呼叫者注入，可直接使用，不需驗證是否存在。

## HTTP Status Code（常見錯誤！）
每個子操作必須返回正確的 __status：
- 建立/新增 → __status: 201
- 查詢/列表/更新/刪除/登入/登出 → __status: 200
不要只在某些 branch 返回 __status，每個 return 都要帶 __status。

## 回應欄位名稱（常見錯誤！）
回傳欄位名稱必須與測試 DataTable 的 header 完全一致（camelCase）。
如果測試驗證 episodeId，必須 return { episodeId: xxx }，不能是 id 或 episode_id。
如果測試驗證 showId，必須 return { showId: xxx }。以此類推。

## ID 欄位（常見錯誤！）
如果輸入包含 episodeId/showId/commentId 等 ID 值，INSERT 時必須使用輸入的 ID：
\`\`\`typescript
const id = input.episodeId || crypto.randomUUID()
await sql\`INSERT INTO episodes (id, ...) VALUES (\${id}, ...)\`
return { episodeId: id, ... }
\`\`\`
不要忽略輸入的 ID 而用 gen_random_uuid() 或 DEFAULT 生成新 ID。

## PostgreSQL 語法（常見錯誤！）
使用 PostgreSQL 語法，不要用 MySQL：
- ✅ ON CONFLICT (id) DO UPDATE SET col = EXCLUDED.col
- ❌ ON DUPLICATE KEY UPDATE（MySQL 語法，PostgreSQL 不支持）
- ✅ gen_random_uuid()
- ❌ UUID()

## email → userId（常見錯誤！）
測試傳入 email 參數時，函數必須自行查詢 userId：
\`\`\`typescript
// 先用 input.userId（如果有的話），否則用 email 查詢
let userId = input.userId
if (!userId && input.email) {
  const users = await sql\`SELECT id FROM users WHERE email = \${input.email}\`
  userId = users[0]?.id
}
if (!userId) throw new Error('使用者不存在')
\`\`\`
不要 require input.userId 作為必要參數。
如果 input.userId 已經存在就直接用，否則用 email 查詢。

## 子操作分支順序（常見嚴重 Bug！）
_stepSummary includes 匹配有交叉時，更具體的分支必須排在前面！
例如「查詢訂閱列表」包含「訂閱」二字，如果「訂閱」分支在「查詢」前面就會錯誤匹配。
正確順序範例：
\`\`\`typescript
if (op.includes('取消訂閱')) { ... }
else if (op.includes('查詢') || op.includes('列表')) { // ← 必須在「訂閱」前面！
  const rows = await sql\`SELECT ... FROM table WHERE user_id = \${userId}\`
  ;(rows as any).__status = 200; return rows  // 列表查詢：設 __status 確保 route handler 用 200
}
else if (op.includes('訂閱')) { ... }
\`\`\`
通用規則：「查詢/列表」分支必須排在「建立/新增/訂閱」分支之前。

## 查詢列表操作（常見錯誤！）
查詢「使用者的」訂閱列表/播放記錄等，只需要 userId。
不要要求 showId/episodeId 等額外參數。
\`\`\`typescript
if (op.includes('查詢') || op.includes('列表')) {
  const userId = input.userId
  const rows = await sql\`SELECT ... FROM table WHERE user_id = \${userId}\`
  ;(rows as any).__status = 200; return rows  // 列表查詢：設 __status 確保 route handler 用 200
}
\`\`\`

## 單一設定表操作（常見錯誤！）
如果表只有一筆記錄（如 channel_config，id 固定為 1），查詢就是 SELECT * WHERE id = 1，
更新就是 UPDATE ... WHERE id = 1。不要要求 action/type 參數。
直接用 _stepSummary 判斷是查詢還是更新：
\`\`\`typescript
if (op.includes('查詢') || op.includes('取得')) {
  const row = await sql\`SELECT * FROM channel_config WHERE id = 1\`
  return { __status: 200, ...row[0] }
}
// 更新：把所有輸入欄位 SET 進去
const setCols = Object.keys(input).filter(k => k !== '_stepSummary' && k !== 'userId')
// ... UPDATE channel_config SET ... WHERE id = 1
\`\`\`

## 登出操作（常見錯誤！）
登出操作不需要驗證 token/session 是否有效。直接返回成功：
\`\`\`typescript
if (op.includes('登出')) {
  return { __status: 200, message: '登出成功' }
}
\`\`\`
不要驗證 token、session、JWT 是否有效或已過期。登出就是直接成功。

## Array/Batch 常見修復

如果錯誤是 "invalid input syntax for type uuid" 且 SQL params 含逗號分隔值或 $variable 字面字串：
→ 輸入是逗號分隔字串，需要 split(',').map(s => s.trim()).filter(Boolean)
→ SQL 用 ANY(\${array}::uuid[])，不用 IN
→ 不要直接把字串傳入 uuid 欄位

如果錯誤涉及拖曳排序/批次更新/重新排列：
→ 先 split 取得 ID 陣列，再逐筆 UPDATE（for loop），每個 UPDATE 一個 ID + 一個 sort_order
→ 確保 sort_order 從 1 開始連續遞增

如果錯誤含 "column X is of type uuid but expression is of type text"：
→ 加 ::uuid cast：\`WHERE id = \${value}::uuid\`

如果錯誤含 "operand of WHERE must not return a set"：
→ 把 IN (\${array}) 改為 = ANY(\${array}::uuid[])

## 聚合查詢（常見錯誤！）
如果錯誤含 "must appear in the GROUP BY clause"：
→ SELECT 中非聚合函數（SUM/COUNT/AVG 以外）的欄位必須出現在 GROUP BY
→ 例如：SELECT category_id, SUM(amount) FROM ... GROUP BY category_id
如果回應值為空（"預期: XXX 實際:" 後面是空的）但預期有數字：
→ 聚合函數必須用 COALESCE：COALESCE(SUM(amount), 0)
→ 回傳值必須用 Number() 轉型：Number(result.totalIncome)（PostgreSQL SUM/COUNT 回傳 string）
→ 無資料時回傳零值物件 { totalIncome: 0, totalExpense: 0 }，不要 404 或空
→ 日期範圍過濾用 date_trunc：date_trunc('month', transaction_date) = date_trunc('month', \${month}::date)
→ 必須加 deleted_at IS NULL 排除軟刪除記錄

## 軟刪除（常見錯誤！）
如果錯誤含 "deletedAt 預期非 null，但實際值為 null"：
→ 刪除操作**必須**用 UPDATE SET deleted_at = NOW()，**絕對不能**用 DELETE FROM
→ 查詢操作**必須**加 WHERE deleted_at IS NULL 排除已刪除記錄
→ 摘要/統計查詢也必須排除 deleted_at IS NOT NULL 的記錄

## camelCase 欄位名稱（常見錯誤！）
如果錯誤含 "值不匹配" 且 "實際:" 後面是空的（不是值錯，是欄位找不到）：
→ PostgreSQL RETURNING * 回傳 snake_case（category_id），BDD 期望 camelCase（categoryId）
→ 解法 1: SQL AS 別名：SELECT category_id as "categoryId", deleted_at as "deletedAt"
→ 解法 2: 回傳前轉換：key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
→ 常見欄位：category_id→categoryId, created_at→createdAt, deleted_at→deletedAt, transaction_date→transactionDate, device_id→deviceId

## 級聯操作（常見錯誤！）
如果錯誤含 "找不到符合條件的" 且是刪除父實體後驗證子實體：
→ 刪除被 FK 引用的實體時，必須同時更新子記錄的 FK 為 NULL
→ 用 sql.begin() transaction 包裹多步驟操作
→ 例如：刪除類別 → UPDATE transactions SET category_id = NULL WHERE category_id = \${categoryId}

## 步驟上下文（Steps Context）— 最重要的修復線索！
測試失敗時會附帶完整的 BDD 步驟（Given/When/Then + DataTable）。
這些步驟告訴你測試「到底在驗什麼」：

- **Given 準備一個{entity}** → 測試前置資料（INSERT 到 DB）
- **When {summary}, call table:** → 實際傳入的參數和欄位
- **Then {summary}(STATUS)回應, with table:** → **你的回應必須包含這些欄位！**
- **And 應該存在一個{entity}, with table:** → DB 驗證，確保你的 INSERT/UPDATE 是正確的

**修復關鍵**：
1. 看 Then 的 DataTable headers → 你的 return 物件「必須」包含這些欄位（camelCase）
2. 看 Then 的 DataTable values → 預期值，判斷你的 SQL 和回應映射是否正確
3. 看 And 的 entity_validate DataTable → DB 應有的狀態，確認 INSERT/UPDATE/soft-delete 正確
4. Entity Mapping（如有）→ entity 中文名稱對應的實際 DB table 名`

/**
 * 用 LLM 修復失敗的 action 函數
 */
export async function fixFailingAction(
  actionName: string,
  currentCode: string,
  failedScenarios: Array<{ scenarioName: string; ruleName: string; error?: string; stepsContext?: string }>,
  schemaSql: string,
  trackingContext?: { userId?: string; conversationId?: string },
  featureContent?: string,
  entityMapping?: string
): Promise<string> {
  // === Per-SubOp 精準修復：偵測組裝式程式碼結構 ===
  const handleFuncMatches = [...currentCode.matchAll(/async function (handle\w+)\s*\(/g)]
  if (handleFuncMatches.length > 1) {
    // 從 dispatch 區塊提取 summary → handleFunc 映射
    const dispatchMap = new Map<string, string>()
    const dispatchRegex = /op\.includes\('([^']+)'\)\s*\)\s*return\s+(handle\w+)/g
    let dm: RegExpExecArray | null
    while ((dm = dispatchRegex.exec(currentCode)) !== null) {
      dispatchMap.set(dm[1], dm[2])
    }

    if (dispatchMap.size > 0) {
      // 根據失敗 scenario 的 ruleName/scenarioName 匹配到子操作
      const failedBySubOp = new Map<string, typeof failedScenarios>()
      for (const s of failedScenarios) {
        const text = (s.ruleName || '') + ' ' + (s.scenarioName || '')
        let matched = false
        for (const [summary, funcName] of dispatchMap) {
          if (text.includes(summary)) {
            if (!failedBySubOp.has(funcName)) failedBySubOp.set(funcName, [])
            failedBySubOp.get(funcName)!.push(s)
            matched = true
            break
          }
        }
        if (!matched) {
          // 無法匹配 → 加到第一個子操作（保守策略）
          const firstFunc = handleFuncMatches[0][1]
          if (!failedBySubOp.has(firstFunc)) failedBySubOp.set(firstFunc, [])
          failedBySubOp.get(firstFunc)!.push(s)
        }
      }

      // 逐個修復失敗的子操作
      let fixedCode = currentCode
      for (const [funcName, scenarios] of failedBySubOp) {
        const funcStartIdx = fixedCode.indexOf(`async function ${funcName}`)
        const funcBody = extractFunctionBody(fixedCode, funcStartIdx)
        if (!funcBody) continue

        const subFixDetails = scenarios
          .map(s => {
            let detail = `- ${s.ruleName ? `${s.ruleName} - ` : ''}${s.scenarioName}\n  Error: ${s.error || 'unknown'}`
            if ((s as any).stepsContext) {
              detail += `\n  Steps:\n${(s as any).stepsContext.split('\n').map((l: string) => '    ' + l).join('\n')}`
            }
            return detail
          })
          .join('\n')

        logger.info({ actionName, funcName, scenarioCount: scenarios.length }, 'Per-SubOp 精準修復')

        try {
          const fixedFunc = await callClaude(FIX_SYSTEM_PROMPT, `## 當前子操作函數（${funcName}）
\`\`\`typescript
${funcBody}
\`\`\`

## 測試失敗
${subFixDetails}

## SQL Schema
\`\`\`sql
${schemaSql}
\`\`\`
${entityMapping ? `\n## Entity Mapping\n\`\`\`yaml\n${entityMapping}\n\`\`\`\n` : ''}

只修復這個子操作函數，不要改函數名稱（${funcName}）。輸出修正後的完整函數。`,
            { maxTokens: 4096, temperature: 0.1 }, trackingContext)

          if (fixedFunc.success && fixedFunc.content) {
            let newFunc = extractCodeFromResponse(fixedFunc.content)
            if (newFunc && newFunc.length > 50) {
              newFunc = removeAuthChecks(newFunc)
              newFunc = fixMySqlSyntax(newFunc)
              // 確保函數名不被 LLM 改掉
              if (!newFunc.includes(`function ${funcName}`)) {
                newFunc = newFunc.replace(/(?:async\s+)?function\s+\w+/, `async function ${funcName}`)
              }
              fixedCode = fixedCode.replace(funcBody, newFunc)
            }
          }
        } catch (fixErr) {
          logger.warn({ actionName, funcName, err: fixErr }, 'Per-SubOp 修復 LLM 呼叫失敗')
        }
      }

      // esbuild 語法驗證（與原有路徑一致）
      try {
        const esbuild = await import('esbuild')
        await esbuild.transform(fixedCode, { loader: 'ts' })
      } catch (syntaxErr) {
        logger.warn({ actionName, syntaxErr }, 'Per-SubOp 修復後語法錯誤，回退到修復前代碼')
        return currentCode
      }

      return fixedCode
    }
  }
  // === END Per-SubOp 精準修復 ===

  const failureDetails = failedScenarios
    .map(s => {
      const label = s.ruleName ? `${s.ruleName} - ${s.scenarioName}` : s.scenarioName
      let errorText = `  Root Cause: ${s.error || 'unknown'}`
      if ((s as any).allErrors) {
        errorText += `\n  Chain Errors:\n    ${(s as any).allErrors.split('\n').join('\n    ')}`
      }
      if (s.stepsContext) {
        errorText += `\n  Steps:\n${s.stepsContext.split('\n').map(l => '    ' + l).join('\n')}`
      }
      return `- ${label}\n${errorText}`
    })
    .join('\n')

  const userMessage = `## 當前代碼（${actionName}）
\`\`\`typescript
${currentCode}
\`\`\`

## 測試失敗
${failureDetails}

## SQL Schema
\`\`\`sql
${schemaSql}
\`\`\`
${entityMapping ? `\n## Entity Mapping\n\`\`\`yaml\n${entityMapping}\n\`\`\`\n` : ''}
請修復代碼使所有測試通過。輸出完整的修正後檔案。`

  const response = await callClaude(FIX_SYSTEM_PROMPT, userMessage, { maxTokens: 8192, temperature: 0.1 }, trackingContext)

  if (!response.success || !response.content) {
    logger.warn({ actionName, error: response.error }, 'LLM 修復失敗')
    return currentCode // 降級返回原始代碼
  }

  let fixed = extractCodeFromResponse(response.content)
  if (!fixed || fixed.length < 50) {
    logger.warn({ actionName }, 'LLM 修復結果過短，使用原始代碼')
    return currentCode
  }

  // 修正 LLM 偶爾混入的中文標點
  fixed = fixed
    .replace(/；/g, ';')
    .replace(/。/g, ';')
    .replace(/，/g, ',')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/：/g, ':')
    .replace(/｛/g, '{')
    .replace(/｝/g, '}')
    .replace(/【/g, '[')
    .replace(/】/g, ']')

  // 移除 LLM 偶爾加入的認證檢查（儘管 prompt 禁止，LLM 仍可能添加）
  // Pattern 1: if (!userId) { throw/return ... }
  fixed = fixed.replace(/if\s*\(\s*!(?:input\.)?userId\s*\)\s*\{[^}]*(?:throw|return)[^}]*\}/g, '')
  // Pattern 2: if (!userId) throw/return ...
  fixed = fixed.replace(/if\s*\(\s*!(?:input\.)?userId\s*\)\s*(?:throw|return)[^\n]*/g, '')
  // Pattern 3: 包含 auth 相關的 throw 語句
  fixed = fixed.replace(/if\s*\([^)]*\)\s*\{?\s*throw\s+new\s+Error\s*\(\s*['"`][^'"`]*(?:必須已登入|認證|已過期|unauthorized|must.*log|未登入|操作者必須|認證憑證無效|token.*(?:invalid|expired)|session.*(?:invalid|expired))[^'"`]*['"`]\s*\)\s*\}?/gi, '')
  // Pattern 4: token/session 驗證的 if block（登出操作常見）
  fixed = fixed.replace(/if\s*\(\s*!(?:input\.)?(?:token|session|authToken)\s*\)\s*\{[^}]*(?:throw|return)[^}]*\}/g, '')
  fixed = fixed.replace(/if\s*\(\s*!(?:input\.)?(?:token|session|authToken)\s*\)\s*(?:throw|return)[^\n]*/g, '')

  // MySQL → PostgreSQL 語法修正
  fixed = fixed.replace(
    /ON\s+DUPLICATE\s+KEY\s+UPDATE\s+(.+?)(?=\s*`|;|\n|$)/gim,
    (_match: string, setCols: string) => {
      const pgCols = setCols.replace(/VALUES\s*\(\s*(\w+)\s*\)/gi, 'EXCLUDED.$1')
      return `ON CONFLICT (id) DO UPDATE SET ${pgCols}`
    }
  )

  // 確保 export function 名稱正確（LLM 偶爾會重命名函數）
  const expectedFnName = toCamelCase(actionName)
  const exportRegex = new RegExp(`export\\s+async\\s+function\\s+${expectedFnName}\\b`)
  if (!exportRegex.test(fixed)) {
    // 嘗試修復：找到任何 export async function 並重命名
    const anyExportMatch = fixed.match(/export\s+async\s+function\s+(\w+)/)
    if (anyExportMatch) {
      fixed = fixed.replace(
        /export\s+async\s+function\s+\w+/,
        `export async function ${expectedFnName}`
      )
      logger.warn({ actionName, original: anyExportMatch[1], expected: expectedFnName }, 'LLM 修復重命名了函數，已自動修正')
    } else {
      logger.warn({ actionName }, 'LLM 修復缺少 export async function，使用原始代碼')
      return currentCode
    }
  }

  // 語法驗證：用 esbuild 快速檢查 TypeScript 語法
  try {
    const esbuild = await import('esbuild')
    await esbuild.transform(fixed, { loader: 'ts' })
  } catch (syntaxErr) {
    logger.warn({ actionName, error: String(syntaxErr).slice(0, 200) }, 'LLM 修復代碼有語法錯誤，使用原始代碼')
    return currentCode
  }

  logger.info({ actionName }, 'LLM 修復完成')
  return fixed
}

/**
 * 並行執行，限制最大並發數
 */
async function runWithConcurrencyLimit<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = []
  let currentIndex = 0

  async function worker() {
    while (currentIndex < items.length) {
      const idx = currentIndex++
      results[idx] = await fn(items[idx], idx)
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker()
  )

  await Promise.all(workers)
  return results
}
