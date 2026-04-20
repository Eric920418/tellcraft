// ============================================================
// Coder Skill — 後端代碼生成核心
// 從 BDD 產出（actionsYml + schemaSql）生成：
//   1. lib/db.ts（固定模板，零 LLM）
//   2. lib/actions/*.ts（LLM 逐 action 生成純邏輯函數）
//   3. app/actions/*.ts（零 LLM，Server Actions 機械映射）
//   4. 改寫 UIUX 組件（LLM，useState mock → Server Action 調用）
// ============================================================

import * as yaml from 'js-yaml'
import { z } from 'zod'
import { getAnthropicHeaders, MODEL, trackLlmUsage, buildCacheableSystem, type CacheableSystemPrompt } from '../lib/anthropic'
import { getEnv } from '../lib/env'
import { callStructured } from '../lib/structured-output'
import type { GeneratedComponent } from './uiux-generation'
import type { GeneratedCode } from '../types/flow-state'
import { createLogger } from '../lib/logger'
import { isQueryAction } from './actions-design'
import { sanitizeNamedImports } from '../utils/sanitize-named-imports'
import { validateComponentSyntax } from './syntax-validator'
import { recordTelemetry, truncateFeedback } from './skill-telemetry'
import { enrichError, formatHintForPrompt } from './error-enrichment'
import { getCoderHandlersJoined, type CoderHandlerId } from '../lib/skill-loader'
import { generateAuthSystem, injectSessionProvider, detectAuthCapabilities } from './coder-auth-templates'
import { generateEmailInfrastructure, generateMagicLinkSystem } from './coder-email-templates'
import { generateAdminPanel } from './coder-admin-templates'
import { generateUploadFiles } from './coder-upload-templates'
import { getTemplate } from './coder-templates'
import { tryDeterministicFix } from './coder-deterministic-fixes'
export { detectAuthInSchema, detectAuthCapabilities, generateAuthSystem, injectSessionProvider } from './coder-auth-templates'
export { generateEmailInfrastructure, generateMagicLinkSystem } from './coder-email-templates'
export { generateAdminPanel } from './coder-admin-templates'
export { generateUploadFiles } from './coder-upload-templates'

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

// Unicode-aware identifier pattern（\w 不匹配中文，需要手動加 CJK 範圍）
const ID_CHAR = '[\\w\\u4e00-\\u9fff\\u3400-\\u4dbf\\u00c0-\\u024f]'
const ID_PATTERN = `${ID_CHAR}+`

interface SubOperation {
  /** _stepSummary value, e.g. "Create Expense Record" */
  summary: string
  /**
   * 推斷的操作類型
   * V1 既有：create | update | delete | query_list | query_single | toggle | restore | aggregate | cascade | auth | batch | export | unknown
   * V2 擴充（CODER_TEMPLATE_V2=true 時才會被推斷出來，走 coder-templates registry）：count | exists_check | search
   */
  operationType: 'create' | 'update' | 'delete' | 'query_list' | 'query_single' | 'toggle' | 'restore' | 'aggregate' | 'cascade' | 'auth' | 'batch' | 'export' | 'count' | 'exists_check' | 'search' | 'unknown'
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
  mockDataWarnings?: string[]
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
  systemPrompt: CacheableSystemPrompt,
  userMessage: string,
  options: { maxTokens?: number; temperature?: number; thinking?: { type: 'enabled'; budget_tokens: number } } = {},
  trackingContext?: { userId?: string; conversationId?: string }
): Promise<{
  success: boolean
  content?: string
  inputTokens?: number
  outputTokens?: number
  error?: string
}> {
  let lastError = 'Unknown error'
  const baseMaxTokens = options.maxTokens || 8192
  const effectiveMaxTokens = options.thinking ? baseMaxTokens + options.thinking.budget_tokens : baseMaxTokens

  for (let attempt = 1; attempt <= RETRY_MAX; attempt++) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: getAnthropicHeaders(),
        body: JSON.stringify({
          model: MODEL.SONNET,
          max_tokens: effectiveMaxTokens,
          ...(options.thinking ? {} : { temperature: options.temperature || 0.2 }),
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
          ...(options.thinking && { thinking: options.thinking }),
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
        usage?: { input_tokens: number; output_tokens: number; cache_creation_input_tokens?: number; cache_read_input_tokens?: number }
        content?: Array<{ type: string; text?: string; thinking?: string }>
      }

      if (trackingContext && data.usage) {
        trackLlmUsage({
          model: MODEL.SONNET,
          inputTokens: data.usage.input_tokens,
          outputTokens: data.usage.output_tokens,
          purpose: options.thinking ? 'coder-generation+thinking' : 'coder-generation',
          cacheCreationTokens: data.usage.cache_creation_input_tokens || 0,
          cacheReadTokens: data.usage.cache_read_input_tokens || 0,
          ...trackingContext,
        })
      }

      if (options.thinking) {
        const thinkingBlock = data.content?.find(b => b.type === 'thinking')
        if (thinkingBlock) {
          logger.info({ thinkingLength: thinkingBlock.thinking?.length || 0, outputTokens: data.usage?.output_tokens }, 'Extended thinking response')
        }
      }

      // 用 .find 取 text block（向後相容：thinking 關閉時 content[0] 就是 text，.find 也能找到）
      const textBlock = data.content?.find(b => b.type === 'text')
      return {
        success: true,
        content: textBlock?.text || '',
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

// M2 Auth 模板 → coder-auth-templates.ts
// M3 Admin Panel 模板 → coder-admin-templates.ts

// (old code removed - now in separate files)
// MARKER_FOR_CLEANUP

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

export const BASE_PROMPT = `You are a Next.js + PostgreSQL backend engineer. Your task is to implement a pure-logic function based on an Action definition and BDD Feature spec.

## ⚠️ LANGUAGE POLICY (MUST)
- ALL generated TypeScript code (error messages, variable names, comments) MUST be in **ENGLISH**
- \`throw new Error('<message>')\` — message MUST be English (e.g. \`'Customer not found'\`, \`'Unsupported operation'\`)
- Comments MUST be English
- Variable names MUST be English camelCase
- BDD step summaries in \`_stepSummary\` dispatch come from Feature's When summary (which is now English) — use the exact summary string verbatim

## Technical Constraints
- \`import { sql } from '@/lib/db'\` (@neondatabase/serverless's neon SQL tagged template)
- Functions MUST be exported + async, with explicit return types
- Error handling: on validation failure, \`throw new Error('<english message>')\`
- SQL MUST use parameterized queries (\`\${var}\` interpolation), NEVER string concatenation
- ID fields use UUID; dates use ISO 8601 strings
- Passwords use bcryptjs (\`import bcrypt from 'bcryptjs'\`); JWT uses \`jsonwebtoken\`
- No auth checks — the Server Action layer handles that; userId is injected by the caller
- Do NOT \`import 'next/headers'\` or manipulate cookies
- Use PostgreSQL \`ON CONFLICT\` syntax (not MySQL \`ON DUPLICATE KEY\`)
- If a test passes email to identify a user: try \`input.userId\` first, else query the \`users\` table
- **Don't hallucinate \`deleted_at\`**: only add \`WHERE deleted_at IS NULL\` when the Schema DDL explicitly defines \`deleted_at\`. If Schema doesn't have it, don't add — otherwise SQL reports "column does not exist".
- **Correct interpretation of validation rules (IMPORTANT)**:
  - Rule "due date cannot be earlier than creation date" → compare this record's \`createdAt\` (= NOW() at creation), **NOT** the current moment
  - In update operations, use the existing record's \`created_at\`: \`new Date(dueDate) < new Date(existing.created_at)\`
  - **If a BDD Feature's test data contains a specific date value (e.g. 2099-12-31), that value is valid — your validation must not reject it**
  - Don't be clever and add validations not stated in BDD rules (format check, length cap, past-date check, etc.)
- **Composite primary key tables (many-to-many junction tables)**:
  - Detection: if the column list is tagged \`⚠️ Composite PK Table\`, the table **has no \`id\` column**
  - WHERE/UPDATE/DELETE MUST use the composite primary key:
    Wrong ❌: \`sql\\\`DELETE FROM todo_tags WHERE id = \\\${tagId}\\\`\`
    Correct ✅: \`sql\\\`DELETE FROM todo_tags WHERE todo_id = \\\${todoId} AND tag_id = \\\${tagId}\\\`\`
  - INSERT also doesn't need \`id\`: \`sql\\\`INSERT INTO todo_tags (todo_id, tag_id) VALUES (\\\${a}, \\\${b})\\\`\`
  - Do NOT use \`RETURNING id\` on composite-PK tables (no id column); use \`RETURNING *\` or explicit columns

## Sub-operation Dispatch
\`\`\`typescript
const op = input._stepSummary || ''
if (op === 'Create Todo') { /* sub-op 1 */ }
else if (op === 'Update Todo') { /* sub-op 2 */ }
else { throw new Error('Unsupported operation') }
\`\`\`
Use the **exact verbatim text** of the Feature's When step summary as the \`===\` condition (not \`includes\`, to prevent substring collisions).

## Input Parameter Naming (CRITICAL — L19.P2)
**Your \`input.X\` names MUST match the Feature's DataTable headers EXACTLY.**

Example: Feature declares
\`\`\`
When (UID="$User.id") Get Portfolio Section, call table:
  | sectionId        |
  | $pageSection1.id |
\`\`\`
→ Your action MUST read \`input.sectionId\` (NOT \`input.id\` even if the summary "Get Portfolio Section" sounds like single-record fetch).

**Rules**:
- \`Get X\` / \`Get X Section\` with \`sectionId\` header → use \`input.sectionId\`, NOT \`input.id\`
- Validation: \`if (!input.sectionId) throw new Error('sectionId is required')\` — the error message should reference the actual param name
- Do NOT guess or rename: the header in Feature DataTable is the contract
- When in doubt, look at the Feature's \`call table:\` headers (ignore \`_stepSummary\` and \`userId\` which are system params)

## Date Fields
DATE → \`row.x instanceof Date ? row.x.toISOString().split('T')[0] : row.x\`
TIMESTAMP → \`row.x instanceof Date ? row.x.toISOString() : row.x\`

## Output
Output TypeScript code ONLY — no explanations, no markdown wrappers.`

// ============================================================
// Handler SOP 內容已抽離到 services/coder-handlers/*.md（PR2 — 按需注入技能索引）
// 透過 lib/skill-loader.ts 的 getCoderHandler(id) 載入，觸發邏輯仍在本檔 buildActionSystemPrompt / buildSubOpSystemPrompt
// ============================================================

/**
 * 根據 action 的 rules 類型，選擇性注入相關 handler。
 * 不再用一個巨大的 system prompt 教 LLM 所有操作類型。
 */
function buildActionSystemPrompt(action?: ActionEntry): CacheableSystemPrompt {
  if (!action) return buildCacheableSystem(BASE_PROMPT)

  const handlers: CoderHandlerId[] = []
  const rules = action.rules || []
  const nameHint = ((action.name || '') + ' ' + (action.summary || '')).toLowerCase()

  // 認證相關
  if (/auth|login|register|signup|signin|logout|password|token|verify/i.test(nameHint)) {
    handlers.push('auth')
  }

  // Email 發送（驗證信、通知信、magic-link）
  if (/email|寄信|通知|notify|verify|confirm|mail|發信/i.test(nameHint)) {
    handlers.push('email-sender')
  }

  // 批次操作
  if (/reorder|sort|batch|drag|拖曳|排序|批次/i.test(nameHint)) {
    handlers.push('batch')
  }

  // 從 rules 類型判斷需要的 handler
  const hasStateRules = rules.some(r => r.type === '後置（狀態）')
  const hasResponseRules = rules.some(r => r.type === '後置（回應）')

  // 有後置（狀態）→ 可能有 INSERT/UPDATE/DELETE
  if (hasStateRules) {
    handlers.push('create')
    handlers.push('update')
    handlers.push('delete')
  }

  // 有後置（回應）→ 有查詢操作
  if (hasResponseRules) {
    handlers.push('query-list')
    handlers.push('query-single')
  }

  // 如果沒有匹配到任何 handler（兜底），注入所有
  if (handlers.length === 0) {
    handlers.push('create', 'query-list', 'query-single', 'update', 'delete', 'batch')
  }

  // Transaction handler（如果有多表操作暗示）
  if (/order.*item|cart.*product|transfer|transaction|原子/i.test(nameHint) || rules.length > 8) {
    handlers.push('transaction')
  }

  // --- 語義感知 handler 選擇（補充 rule-type 之外的模式）---
  const allRuleText = rules.map(r => (r as any).rule || (r as any).description || '').join(' ')
  const allText = nameHint + ' ' + allRuleText

  // 聚合/摘要查詢（SUM, GROUP BY, 統計）
  if (/摘要|統計|彙總|加總|合計|summary|aggregate|total|count|average|平均/i.test(allText)) {
    handlers.push('aggregate')
  }

  // 級聯操作（刪除父實體需要更新子記錄）
  if (rules.some(r => /未分類|相關.*應|級聯|cascade|歸入|改為/i.test((r as any).rule || (r as any).description || ''))) {
    handlers.push('cascade')
  }

  // camelCase 欄位別名（所有有回應或狀態驗證的 action 都需要）
  if (hasResponseRules || hasStateRules) {
    handlers.push('column-alias')
  }

  return buildCacheableSystem(BASE_PROMPT, getCoderHandlersJoined(handlers))
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
    ? `\n## _stepSummary Exact Dispatch Values (STRICT — do NOT rewrite)
BDD tests will invoke this function with exactly these _stepSummary values. Your if/else branches MUST match these with \`===\`:
${stepSummaries.map(s => `- "${s}"`).join('\n')}
IMPORTANT: use \`op === '<full text>'\` for exact match. **Do NOT use \`op.includes()\`** — it causes substring collisions. Example: \`if (op === 'Create Todo')\`, NOT \`op.includes('Create')\` or \`op.includes('Add')\`.`
    : ''

  return `## Action 定義
名稱：${action.name}
摘要：${action.summary}

## 規則
${rulesText || '（無特定規則）'}

## 相關資料表 DDL
${schemaSql}

${generateColumnListText(schemaSql)}

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
  // L7：regex 容錯 \(? \)? 兼容 LLM 寫成「When UID="$Store.id" 查看銷售報表」（無括號）
  const summaryRegex = /(?:When|And)\s+(?:\(?(?:No Actor|UID="[^"]*")\)?\s+)?(.+?),\s*call\s+table:/i
  const groups = new Map<string, string[]>()

  for (const block of ruleBlocks) {
    const match = block.content.match(summaryRegex)
    const rawSummary = match?.[1]?.trim()
    // L7 後處理：regex 沒抓到 Actor 時，summary 兜底再 strip 一次
    const summary = rawSummary ? cleanSubOpSummary(rawSummary) : '__default__'
    if (!groups.has(summary)) groups.set(summary, [])
    groups.get(summary)!.push(block.content)
  }

  // 過濾掉無法解析 summary 的 rule blocks
  const validGroups = new Map([...groups].filter(([k]) => k !== '__default__'))
  if (validGroups.size === 0) return []
  // 即使只有 1 個 summary，也返回 SubOperation 以享受精準 Handler 選擇

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

  // V2 擴充類型（只有 CODER_TEMPLATE_V2=true 時才推斷，否則 fall through 到 V1）
  // 順序重要：exists_check 和 count 必須在 query_list / query_single 之前
  if (getEnv().CODER_TEMPLATE_V2) {
    if (/是否存在|已?註冊|已?佔用|已?被使用|重複.*檢查|唯一性|\bexists?\b|duplicate/i.test(s)) return 'exists_check'
    if (/幾筆|幾個|數量|有多少|計算.*(筆|個|總數)|\bcount\b|total count/i.test(s)) return 'count'
    if (/模糊.*(搜尋|查詢|搜索)|關鍵字.*(搜尋|查詢)|^搜尋|\bsearch\b|ILIKE/i.test(s)) return 'search'
  }

  if (/摘要|統計|彙總|加總|合計|summary|aggregate|total/i.test(s)) return 'aggregate'
  if (/匯出|export/i.test(s)) return 'export'
  if (/未分類|相關.*應|級聯|cascade/i.test(s)) return 'cascade'
  if (/auth|login|register|signup|signin|logout|password/i.test(s)) return 'auth'
  if (/reorder|batch|拖曳|批次/i.test(s)) return 'batch'
  if (RESTORE_KEYWORDS.some(k => summary.includes(k))) return 'restore'
  if (TOGGLE_KEYWORDS.some(k => summary.includes(k))) return 'toggle'
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
function buildSubOpSystemPrompt(subOp: SubOperation): CacheableSystemPrompt {
  const handlers: CoderHandlerId[] = []
  switch (subOp.operationType) {
    case 'create':      handlers.push('create'); break
    case 'update':      handlers.push('update'); break
    case 'delete':      handlers.push('delete'); break
    case 'query_list':  handlers.push('query-list'); break
    case 'query_single': handlers.push('query-single'); break
    case 'aggregate':   handlers.push('aggregate'); break
    case 'toggle':      handlers.push('toggle'); break
    case 'restore':     handlers.push('restore'); break
    case 'cascade':     handlers.push('cascade'); break
    case 'auth':        handlers.push('auth'); break
    case 'batch':       handlers.push('batch'); break
    case 'export':      handlers.push('query-list'); break
    // V2 擴充類型：選擇語意最接近的既有 handler（避免新建 handler 炸 prompt cache）
    case 'count':        handlers.push('aggregate'); break
    case 'exists_check': handlers.push('query-single'); break
    case 'search':       handlers.push('query-list'); break
    default:
      handlers.push('create', 'query-list', 'update', 'delete')
  }
  handlers.push('column-alias')
  return buildCacheableSystem(BASE_PROMPT, getCoderHandlersJoined(handlers))
}

// ============================================================
// Code Template 系統：確定性代碼生成（LLM 填槽位，模板保證 SQL 正確）
// ============================================================

/** 根據 scope 欄位生成 SQL WHERE 片段 + 變數宣告 */
function buildScopeClause(scopeColumn?: string, scopeParam?: string): { varDecl: string; whereClause: string; andClause: string } {
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

/** inline snakeToCamel 代碼片段（不依賴 helper function，避免 composition 丟失） */
const INLINE_SNAKE_TO_CAMEL = `  const _c = (row: any) => {
    if (!row) return row
    const r: any = {}
    for (const [k, v] of Object.entries(row)) r[k.replace(/_([a-z])/g, (_: any, c: string) => c.toUpperCase())] = v
    return r
  }`

const AggregateSlotSchema = z.object({
  table: z.string(),
  scopeColumn: z.string().optional(),
  scopeParam: z.string().optional(),
  dateColumn: z.string().optional(),
  dateParam: z.string().optional(),
  dateGranularity: z.enum(['month', 'day', 'year']).default('month'),
  softDeleteColumn: z.string().optional(),
  aggregations: z.array(z.object({
    fn: z.enum(['SUM', 'COUNT', 'AVG']),
    column: z.string(),
    condition: z.string().optional(),
    alias: z.string(),
  })),
  groupBy: z.array(z.object({
    column: z.string(),
    alias: z.string(),
  })).optional(),
})

const ExportSlotSchema = z.object({
  table: z.string(),
  scopeColumn: z.string().optional(),
  scopeParam: z.string().optional(),
  softDeleteColumn: z.string().optional(),
  selectColumns: z.array(z.object({
    column: z.string(),
    alias: z.string(),
  })),
  orderBy: z.array(z.object({
    column: z.string(),
    direction: z.enum(['ASC', 'DESC']),
  })),
  filters: z.array(z.object({
    column: z.string(),
    param: z.string(),
  })).optional(),
})

const CascadeSlotSchema = z.object({
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

const CreateSlotSchema = z.object({
  table: z.string(),
  columns: z.array(z.object({
    column: z.string(),
    param: z.string(),
    alias: z.string(),
    defaultValue: z.string().optional(),
  })),
  scopeColumn: z.string().optional(),
  scopeParam: z.string().optional(),
})

const UpdateSlotSchema = z.object({
  table: z.string(),
  entityIdParam: z.string().default('id'),
  scopeColumn: z.string().optional(),
  scopeParam: z.string().optional(),
  updateColumns: z.array(z.object({
    column: z.string(),
    param: z.string(),
    alias: z.string(),
  })),
})

const DeleteSlotSchema = z.object({
  table: z.string(),
  entityIdParam: z.string().default('id'),
  scopeColumn: z.string().optional(),
  scopeParam: z.string().optional(),
  softDeleteColumn: z.string().optional(),
})

const QuerySingleSlotSchema = z.object({
  table: z.string(),
  entityIdParam: z.string().default('id'),
  scopeColumn: z.string().optional(),
  scopeParam: z.string().optional(),
  softDeleteColumn: z.string().optional(),
})

const ToggleSlotSchema = z.object({
  table: z.string(),
  entityIdParam: z.string().default('id'),
  toggleColumn: z.string(),
  scopeColumn: z.string().optional(),
  scopeParam: z.string().optional(),
  softDeleteColumn: z.string().optional(),
})

const RestoreSlotSchema = z.object({
  table: z.string(),
  entityIdParam: z.string().default('id'),
  scopeColumn: z.string().optional(),
  scopeParam: z.string().optional(),
})

const QueryListSlotSchema = z.object({
  table: z.string(),
  scopeColumn: z.string().optional(),
  scopeParam: z.string().optional(),
  softDeleteColumn: z.string().optional(),
  selectColumns: z.array(z.object({
    column: z.string(),
    alias: z.string(),
  })).optional(),
  orderBy: z.array(z.object({
    column: z.string(),
    direction: z.enum(['ASC', 'DESC']),
  })).optional(),
  filters: z.array(z.object({
    column: z.string(),
    operator: z.enum(['=', '!=', '<', '>', '<=', '>=', 'IS NULL', 'IS NOT NULL']),
    param: z.string().optional(),
    literal: z.string().optional(),
  })).optional(),
})

// --- Template Render Functions ---

function renderAggregateTemplate(slots: z.infer<typeof AggregateSlotSchema>, fnName: string): string {
  const selectClauses = slots.aggregations.map(a => {
    const expr = a.condition
      ? `CASE WHEN ${a.condition} THEN ${a.column} ELSE 0 END`
      : a.column
    return `      COALESCE(${a.fn}(${expr}), 0) as "${a.alias}"`
  })

  const groupByCols = (slots.groupBy || []).map(g => `      ${g.column} as "${g.alias}"`)
  const allSelect = [...groupByCols, ...selectClauses].join(',\n')
  const groupByClause = slots.groupBy ? `\n    GROUP BY ${slots.groupBy.map(g => g.column).join(', ')}` : ''
  const dateFilter = slots.dateColumn && slots.dateParam
    ? `\n      AND date_trunc('${slots.dateGranularity}', ${slots.dateColumn}) = date_trunc('${slots.dateGranularity}', \${${slots.dateParam}}::date)`
    : ''

  const tag = `// @generated-by-template: aggregate`
  const scope = buildScopeClause(slots.scopeColumn, slots.scopeParam)

  if (slots.groupBy) {
    return `import { sql } from '@/lib/db'
${tag}

export async function ${fnName}(input: any) {
${scope.varDecl}
${slots.dateParam ? `  const ${slots.dateParam} = input.${slots.dateParam}\n` : ''}
  const rows = await sql\`
    SELECT
${allSelect}
    FROM ${slots.table}
    ${scope.whereClause}
      ${slots.softDeleteColumn ? `AND ${slots.softDeleteColumn} IS NULL` : ''}${dateFilter}${groupByClause}
  \`
  const result = rows.map((r: any) => ({
    ${[...(slots.groupBy || []).map(g => `${g.alias}: r.${g.alias}`), ...slots.aggregations.map(a => `${a.alias}: Number(r.${a.alias})`)].join(',\n    ')}
  }))
  ;(result as any).__status = 200
  return result
}`
  }

  return `import { sql } from '@/lib/db'
${tag}

export async function ${fnName}(input: any) {
${scope.varDecl}
${slots.dateParam ? `  const ${slots.dateParam} = input.${slots.dateParam}\n` : ''}
  const rows = await sql\`
    SELECT
${allSelect}
    FROM ${slots.table}
    ${scope.whereClause}
      ${slots.softDeleteColumn ? `AND ${slots.softDeleteColumn} IS NULL` : ''}${dateFilter}
  \`
  const row = rows[0] || {}
  return {
    __status: 200,
    ${slots.aggregations.map(a => `${a.alias}: Number(row.${a.alias} ?? 0)`).join(',\n    ')}
  }
}`
}

function renderExportTemplate(slots: z.infer<typeof ExportSlotSchema>, fnName: string): string {
  const selectCols = slots.selectColumns.map(c =>
    c.column === c.alias ? `      ${c.column}` : `      ${c.column} as "${c.alias}"`
  ).join(',\n')
  const orderCols = slots.orderBy.map(o => `${o.column} ${o.direction}`).join(', ')
  const filterClauses = (slots.filters || []).map(f =>
    `\n      AND ${f.column} = \${input.${f.param}}`
  ).join('')
  const tag = `// @generated-by-template: export`
  const scope = buildScopeClause(slots.scopeColumn, slots.scopeParam)

  return `import { sql } from '@/lib/db'
${tag}

export async function ${fnName}(input: any) {
${scope.varDecl}

  const rows = await sql\`
    SELECT
${selectCols}
    FROM ${slots.table}
    ${scope.whereClause}
      ${slots.softDeleteColumn ? `AND ${slots.softDeleteColumn} IS NULL` : ''}${filterClauses}
    ORDER BY ${orderCols}
  \`
  ;(rows as any).__status = 200
  return rows
}`
}

function renderCascadeTemplate(slots: z.infer<typeof CascadeSlotSchema>, fnName: string): string {
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

function renderCreateTemplate(slots: z.infer<typeof CreateSlotSchema>, fnName: string): string {
  const tag = `// @generated-by-template: create`
  const insertCols = slots.columns.map(c => c.column).join(', ')
  const insertVals = slots.columns.map(c =>
    c.defaultValue ? c.defaultValue : `\${input.${c.param}}`
  ).join(', ')

  return `import { sql } from '@/lib/db'
${tag}

export async function ${fnName}(input: any) {
  const [row] = await sql\`
    INSERT INTO ${slots.table} (${insertCols}, created_at, updated_at)
    VALUES (${insertVals}, NOW(), NOW())
    RETURNING *
  \`

${INLINE_SNAKE_TO_CAMEL}
  return { __status: 201, ..._c(row) }
}`
}

function renderUpdateTemplate(slots: z.infer<typeof UpdateSlotSchema>, fnName: string): string {
  const tag = `// @generated-by-template: update`
  const setClauses = slots.updateColumns.map(c => `${c.column} = \${input.${c.param}}`).join(', ')
  const scope = buildScopeClause(slots.scopeColumn, slots.scopeParam)

  return `import { sql } from '@/lib/db'
${tag}

export async function ${fnName}(input: any) {
  const existing = await sql\`SELECT * FROM ${slots.table} WHERE id = \${input.${slots.entityIdParam}}\`
  if (existing.length === 0) throw new Error('不存在或不屬於當前使用者')

  const [row] = await sql\`
    UPDATE ${slots.table} SET ${setClauses}, updated_at = NOW()
    WHERE id = \${input.${slots.entityIdParam}}
    RETURNING *
  \`

${INLINE_SNAKE_TO_CAMEL}
  return { __status: 200, ..._c(row) }
}`
}

function renderDeleteTemplate(slots: z.infer<typeof DeleteSlotSchema>, fnName: string): string {
  const tag = `// @generated-by-template: delete`

  // Schema 有 softDeleteColumn → 軟刪除（UPDATE SET col = NOW()）；沒有 → 硬刪除（DELETE FROM）
  if (slots.softDeleteColumn) {
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

function renderQueryListTemplate(slots: z.infer<typeof QueryListSlotSchema>, fnName: string): string {
  const tag = `// @generated-by-template: query_list`
  const selectPart = slots.selectColumns
    ? slots.selectColumns.map(c => c.column === c.alias ? c.column : `${c.column} as "${c.alias}"`).join(', ')
    : '*'
  const orderPart = slots.orderBy ? `\n    ORDER BY ${slots.orderBy.map(o => `${o.column} ${o.direction}`).join(', ')}` : ''
  const scope = buildScopeClause(slots.scopeColumn, slots.scopeParam)

  // 動態篩選條件
  const filterParts: string[] = []
  if (slots.filters && slots.filters.length > 0) {
    for (const f of slots.filters) {
      if (f.operator === 'IS NULL' || f.operator === 'IS NOT NULL') {
        filterParts.push(`AND ${f.column} ${f.operator}`)
      } else if (f.literal) {
        filterParts.push(`AND ${f.column} ${f.operator} ${f.literal}`)
      } else if (f.param) {
        filterParts.push(`AND ${f.column} ${f.operator} \${input.${f.param}}`)
      }
    }
  }
  const filterClause = filterParts.length > 0 ? '\n      ' + filterParts.join('\n      ') : ''

  return `import { sql } from '@/lib/db'
${tag}

export async function ${fnName}(input: any) {
${scope.varDecl}

  const rows = await sql\`
    SELECT ${selectPart}
    FROM ${slots.table}
    ${scope.whereClause}
      ${slots.softDeleteColumn ? `AND ${slots.softDeleteColumn} IS NULL` : ''}${filterClause}${orderPart}
  \`

${INLINE_SNAKE_TO_CAMEL}
  const result = rows.map(_c)
  ;(result as any).__status = 200
  return result
}`
}

function renderQuerySingleTemplate(slots: z.infer<typeof QuerySingleSlotSchema>, fnName: string): string {
  const tag = `// @generated-by-template: query_single`

  return `import { sql } from '@/lib/db'
${tag}

export async function ${fnName}(input: any) {
  const entityId = input.${slots.entityIdParam}
  if (!entityId) throw new Error('缺少 ID 參數')

  const [row] = await sql\`
    SELECT * FROM ${slots.table}
    WHERE id = \${entityId}
      ${slots.softDeleteColumn ? `AND ${slots.softDeleteColumn} IS NULL` : ''}
  \`
  if (!row) throw new Error('找不到資料')

${INLINE_SNAKE_TO_CAMEL}
  return { __status: 200, ..._c(row) }
}`
}

function renderToggleTemplate(slots: z.infer<typeof ToggleSlotSchema>, fnName: string): string {
  const tag = `// @generated-by-template: toggle`

  return `import { sql } from '@/lib/db'
${tag}

export async function ${fnName}(input: any) {
  const entityId = input.${slots.entityIdParam}
  if (!entityId) throw new Error('缺少 ID 參數')

  const [existing] = await sql\`
    SELECT * FROM ${slots.table}
    WHERE id = \${entityId}
      ${slots.softDeleteColumn ? `AND ${slots.softDeleteColumn} IS NULL` : ''}
  \`
  if (!existing) throw new Error('不存在或已被刪除')

  const [row] = await sql\`
    UPDATE ${slots.table}
    SET ${slots.toggleColumn} = NOT ${slots.toggleColumn}, updated_at = NOW()
    WHERE id = \${entityId}
    RETURNING *
  \`

${INLINE_SNAKE_TO_CAMEL}
  return { __status: 200, ..._c(row) }
}`
}

function renderRestoreTemplate(slots: z.infer<typeof RestoreSlotSchema>, fnName: string): string {
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

// --- Slot Extraction ---

async function extractSlots<T>(
  schema: z.ZodType<T>,
  subOp: SubOperation,
  schemaSql: string,
  entityMapping: string,
  trackingContext?: { userId?: string; conversationId?: string },
): Promise<T | null> {
  const prompt = `根據 BDD Feature 和 SQL Schema，提取以下 JSON 結構的槽位值。
只輸出 JSON，不要解釋、不要 markdown 包裹。

## SQL Schema
${schemaSql}

## Entity Mapping（中文實體 → 表名）
${entityMapping}

## BDD Feature Scenario
${subOp.relevantGherkin}

## 必須回傳的欄位（camelCase，回應中必須包含）
${subOp.requiredResponseFields.map(f => `- ${f}`).join('\n') || '（無特定欄位要求）'}

## 提取規則
- table/column 用 SQL 真實的 snake_case 名稱
- alias 用 camelCase（跟 BDD 欄位名一致）
- scopeColumn 是限定資料範圍的欄位（如 device_id, user_id）
- scopeParam 是 input 對應的參數名（如 deviceId, userId）
- condition 用 SQL WHERE 語法（如 "type = 'income'"）
- 如果 BDD 提到「未分類」，defaultEntityQuery 填查詢條件（如 "name = '未分類'"）
- **softDeleteColumn**：只有 Schema DDL 中明確定義了 deleted_at 或 is_deleted 欄位時才填（如 "deleted_at"）。如果 Schema 沒有此欄位，**不要填**（省略此欄位），否則會導致 SQL "column does not exist" 錯誤

只輸出 JSON：`

  const systemPrompt = 'You are a structured-data extraction expert. Extract precise JSON slot values from the BDD Feature and SQL Schema. Output JSON only (no prose).'

  // 第一次嘗試（Structured Output 保證 JSON 合規 + Zod 驗證）
  const result1 = await callStructured({
    schema,
    model: MODEL.SONNET,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 2048,
    temperature: 0,
    purpose: 'coder_slot_extraction',
    trackingContext,
  })

  if (result1.success) return result1.data

  // 第二次嘗試：注入第一次的錯誤訊息（罕見，因為 Structured Output 已保證 JSON 格式正確）
  logger.info({ operationType: subOp.operationType, error: result1.error }, 'Slot extraction 第一次失敗，重試中')

  const retryPrompt = `${prompt}

## 上次嘗試失敗
錯誤：${result1.error}

請重新提取正確的 JSON：`

  const result2 = await callStructured({
    schema,
    model: MODEL.SONNET,
    system: systemPrompt,
    messages: [{ role: 'user', content: retryPrompt }],
    maxTokens: 2048,
    temperature: 0,
    purpose: 'coder_slot_extraction',
    trackingContext,
  })

  if (result2.success) return result2.data

  logger.warn({ operationType: subOp.operationType, firstError: result1.error, secondError: result2.error }, 'Slot extraction 重試後仍失敗')
  return null
}

async function tryTemplateGeneration(
  subOp: SubOperation,
  ctx: { schemaSql: string; entityMapping: string },
  fnName: string,
  trackingContext?: { userId?: string; conversationId?: string },
): Promise<string | null> {
  // V2 registry 路徑（僅處理新 operationType：count / exists_check / search）
  // V1 既有 10 類仍走下方 switch 作為 production truth，確保 byte-identity
  if (getEnv().CODER_TEMPLATE_V2) {
    if (subOp.operationType === 'count' || subOp.operationType === 'exists_check' || subOp.operationType === 'search') {
      const tmpl = getTemplate(subOp.operationType)
      if (!tmpl) return null
      const slots = await extractSlots(tmpl.schema, subOp, ctx.schemaSql, ctx.entityMapping, trackingContext)
      if (!slots) return null
      if (tmpl.needsColumnValidation) {
        validateSlotColumns(slots as { table: string; softDeleteColumn?: string; scopeColumn?: string; scopeParam?: string }, ctx.schemaSql)
      }
      return tmpl.render(slots, fnName)
    }
  }

  switch (subOp.operationType) {
    case 'aggregate': {
      const slots = await extractSlots(AggregateSlotSchema, subOp, ctx.schemaSql, ctx.entityMapping, trackingContext)
      return slots ? renderAggregateTemplate(slots, fnName) : null
    }
    case 'export': {
      const slots = await extractSlots(ExportSlotSchema, subOp, ctx.schemaSql, ctx.entityMapping, trackingContext)
      return slots ? renderExportTemplate(slots, fnName) : null
    }
    case 'cascade': {
      const slots = await extractSlots(CascadeSlotSchema, subOp, ctx.schemaSql, ctx.entityMapping, trackingContext)
      return slots ? renderCascadeTemplate(slots, fnName) : null
    }
    case 'create': {
      const slots = await extractSlots(CreateSlotSchema, subOp, ctx.schemaSql, ctx.entityMapping, trackingContext)
      return slots ? renderCreateTemplate(slots, fnName) : null
    }
    case 'update': {
      const slots = await extractSlots(UpdateSlotSchema, subOp, ctx.schemaSql, ctx.entityMapping, trackingContext)
      return slots ? renderUpdateTemplate(slots, fnName) : null
    }
    case 'delete': {
      const slots = await extractSlots(DeleteSlotSchema, subOp, ctx.schemaSql, ctx.entityMapping, trackingContext)
      return slots ? renderDeleteTemplate(slots, fnName) : null
    }
    case 'query_list': {
      const slots = await extractSlots(QueryListSlotSchema, subOp, ctx.schemaSql, ctx.entityMapping, trackingContext)
      if (slots) { validateSlotColumns(slots, ctx.schemaSql) }
      return slots ? renderQueryListTemplate(slots, fnName) : null
    }
    case 'query_single': {
      const slots = await extractSlots(QuerySingleSlotSchema, subOp, ctx.schemaSql, ctx.entityMapping, trackingContext)
      if (slots) { validateSlotColumns(slots, ctx.schemaSql) }
      return slots ? renderQuerySingleTemplate(slots, fnName) : null
    }
    case 'toggle': {
      const slots = await extractSlots(ToggleSlotSchema, subOp, ctx.schemaSql, ctx.entityMapping, trackingContext)
      if (slots) { validateSlotColumns(slots, ctx.schemaSql) }
      return slots ? renderToggleTemplate(slots, fnName) : null
    }
    case 'restore': {
      const slots = await extractSlots(RestoreSlotSchema, subOp, ctx.schemaSql, ctx.entityMapping, trackingContext)
      return slots ? renderRestoreTemplate(slots, fnName) : null
    }
    default:
      return null
  }
}

// ============================================================

/** 生成單個子操作的代碼（優先用 template，fallback 到 free-form LLM） */
async function generateSubOperationCode(
  action: ActionEntry,
  subOp: SubOperation,
  ctx: { schemaSql: string; entityMapping: string; types: Record<string, unknown> },
  trackingContext?: { userId?: string; conversationId?: string }
): Promise<{ summary: string; code: string }> {
  // L7：用 buildHandleName 走 sanitize + toPascalCase，保證 JS 識別符合法
  const handleName = buildHandleName(subOp.summary)

  // === 優先嘗試 template 生成（確定性） ===
  if (subOp.operationType !== 'unknown' && subOp.operationType !== 'auth' && subOp.operationType !== 'batch') {
    try {
      const templateCode = await tryTemplateGeneration(subOp, ctx, handleName, trackingContext)
      if (templateCode) {
        logger.info({ summary: subOp.summary, operationType: subOp.operationType }, 'Template 生成成功')
        return { summary: subOp.summary, code: templateCode }
      }
    } catch (templateErr) {
      logger.warn({ summary: subOp.summary, err: templateErr }, 'Template 生成異常，fallback 到 LLM')
    }
    logger.info({ summary: subOp.summary, operationType: subOp.operationType }, 'Template slot 提取失敗，fallback 到 free-form LLM')
  }

  // === Free-form LLM 生成（fallback） ===
  const systemPrompt = buildSubOpSystemPrompt(subOp)

  const responseFieldsText = subOp.requiredResponseFields.length > 0
    ? `\n## 必須返回的欄位名稱（嚴格遵守，不可改名）\n${subOp.requiredResponseFields.map(f => `- \`${f}\``).join('\n')}`
    : ''

  const userPrompt = `## 子操作定義
Action 名稱：${action.name}
子操作：${subOp.summary}
操作類型：${subOp.operationType}

## 規則
${(subOp.actionRules || []).map(r => `- [${r.type}] ${r.rule}`).join('\n') || '（無特定規則）'}

## 相關資料表 DDL
${ctx.schemaSql}

${generateColumnListText(ctx.schemaSql)}

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
  code = unwrapListResponse(code)  // L21.P1-A：擋 `return { items, total, page, pageSize }` wrap

  return { summary: subOp.summary, code }
}

/** 移除 LLM 偶爾加入的認證檢查（共用） */
export function removeAuthChecks(code: string): string {
  // Pattern 1: if (!userId) { throw/return ... }
  code = code.replace(/if\s*\(\s*!(?:input\.)?userId\s*\)\s*\{[^}]*(?:throw|return)[^}]*\}/g, '')
  // Pattern 2: if (!userId) throw/return ...
  code = code.replace(/if\s*\(\s*!(?:input\.)?userId\s*\)\s*(?:throw|return)[^\n]*/g, '')
  // Pattern 3: 包含 auth 相關的 throw 語句（完整模式）
  // 中英文 keyword 並存：舊 conversation 可能留中文 auth 訊息，新生成以英文為主
  code = code.replace(/if\s*\([^)]*\)\s*\{?\s*throw\s+new\s+Error\s*\(\s*['"`][^'"`]*(?:必須已登入|認證|已過期|unauthorized|must.*log|未登入|操作者必須|認證憑證無效|token.*(?:invalid|expired)|session.*(?:invalid|expired)|authentication required|not authenticated|not logged in|login required|must be logged in|permission denied|forbidden|user id (?:is )?(?:required|missing))[^'"`]*['"`]\s*\)\s*\}?/gi, '')
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

/**
 * L21.P1-A：偵測並修復 Coder 生成的 list query action 回 wrap 格式
 *
 * 問題場景（實測 List Media Files fail on L19）：
 *   return { items: camelRows, total: camelRows.length, page: 1, pageSize: 20 }
 * 但 Feature 驗證預設把 response 當純 array → row lookup 失敗。
 *
 * `query-list.md` handler 已明確禁 wrap，但 LLM 看到 Feature api_call 帶 page/pageSize
 * 就合理地加 pagination wrap。此 helper 後置抓 wrap pattern 改回純 array。
 *
 * 策略（保守）：
 *   - 只對明確是 list query 的 pattern 動手（`return` 某個 array 變數包成 items）
 *   - 保留 __status assignment（SpecFormula 依賴）
 *   - 不動非 wrap 情境（return { __status: 200, ...row } 是合法的單筆回應）
 */
export function unwrapListResponse(code: string): string {
  // Pattern 1: return { items: X } → return X (with __status preserved if present)
  //   e.g.
  //     return { items: camelRows, total: camelRows.length, page: 1, pageSize: 20 }
  //   →
  //     ;(camelRows as any).__status = 200
  //     return camelRows
  // 策略：regex 抓 `return { (items|data|rows|results): <ident>[, ...]*[, __status?: ...]? }`
  //   若 wrap key 以外只剩 total/page/pageSize/等 pagination meta → 拆成 `__status 設定 + return array`
  //   否則（含業務欄位）→ 不動（可能是合法包裝）
  const WRAP_KEYS = new Set(['items', 'data', 'rows', 'results', 'list'])
  const META_KEYS = new Set(['total', 'page', 'pageSize', 'perPage', 'totalPages', 'hasMore', 'nextCursor', 'count', 'limit', 'offset'])

  const lines = code.split('\n')
  const out: string[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const m = line.match(/^(\s*)return\s*\{\s*([^}]+)\}\s*;?\s*$/)
    if (!m) {
      out.push(line)
      continue
    }
    const [, indent, body] = m
    // 解析 `key: value` pairs（簡單 split，不處理 nested object）
    const pairs = body.split(',').map(s => s.trim()).filter(Boolean)
    const parsed = pairs.map(p => {
      const colon = p.indexOf(':')
      if (colon < 0) return null
      return { key: p.substring(0, colon).trim(), value: p.substring(colon + 1).trim() }
    }).filter((p): p is { key: string; value: string } => !!p)

    // 找 wrap key（items/data/rows/results）
    const wrapPair = parsed.find(p => WRAP_KEYS.has(p.key))
    if (!wrapPair) {
      out.push(line)
      continue
    }
    // 其他 key 除了 META / __status 都視為業務欄位（不動）
    const otherKeys = parsed.filter(p => p.key !== wrapPair.key && p.key !== '__status')
    const allMeta = otherKeys.every(p => META_KEYS.has(p.key))
    if (!allMeta) {
      out.push(line)
      continue
    }
    // 安全解包：先 `__status = 200` 設 array 上，再 return 純 array
    const arrayVar = wrapPair.value
    // 簡單 identifier 才改寫（避免改到 arrayVar 是 complex expression 的情況）
    if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(arrayVar)) {
      out.push(line)
      continue
    }
    out.push(`${indent};(${arrayVar} as any).__status = 200`)
    out.push(`${indent}return ${arrayVar}`)
  }
  return out.join('\n')
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

  // 2.5 安全網：如果子操作代碼用了 sql 但沒 import，自動注入
  const allSubOpCode = subOpCodes.map(s => s.code).join('\n')
  const usesSql = /\bsql\s*`/.test(allSubOpCode) || /\bsql\.begin/.test(allSubOpCode)
  const hasSqlImport = namedImports.has('@/lib/db') && namedImports.get('@/lib/db')!.has('sql')
  if (usesSql && !hasSqlImport) {
    if (!namedImports.has('@/lib/db')) namedImports.set('@/lib/db', new Set())
    namedImports.get('@/lib/db')!.add('sql')
  }

  // 3. 提取 helper 函數（如 snakeToCamel），去重
  const helperFunctions = new Map<string, string>()
  for (const { code } of subOpCodes) {
    const cleaned = removeImports(code)
    const helperRegex = new RegExp(`(?:^|\\n)((?:async\\s+)?function\\s+(?!handle)(${ID_PATTERN})\\s*\\([^)]*\\)[^{]*\\{)`, 'g')
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
    // 確保函數名稱正確（使用 Unicode-aware pattern 匹配中文函數名）
    // L7：走 buildHandleName 保證 JS 識別符合法
    const handleName = buildHandleName(summary)
    cleaned = cleaned.replace(
      new RegExp(`(?:export\\s+)?(?:async\\s+)?function\\s+${ID_PATTERN}`),
      `async function ${handleName}`
    )
    const trimmed = cleaned.trim()
    if (trimmed) handleFunctions.push(trimmed)
  }

  // 5. 組裝 _stepSummary 分派（長 summary 在前，避免子字串衝突）
  const sortedOps = [...subOps].sort((a, b) => b.summary.length - a.summary.length)
  const dispatchBranches = sortedOps.map((op, i) => {
    // L7：走 buildHandleName 保證 JS 識別符合法（dispatch + 函數名拼接必須一致）
    const handleName = buildHandleName(op.summary)
    const prefix = i === 0 ? 'if' : 'else if'
    return `  ${prefix} (op === '${op.summary}') return ${handleName}(input)`
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
      if (subOps.length >= 1) {
        const mode = subOps.length === 1 ? '精準 Handler' : 'Per-SubOp'
        logger.info({ actionName: action.name, mode, subOpCount: subOps.length, summaries: subOps.map(s => `${s.summary}(${s.operationType})`) }, `${mode} 生成模式`)

        try {
          const subOpCodes = await runWithConcurrencyLimit(
            subOps,
            async (subOp, idx) => {
              logger.info({ actionName: action.name, subOp: subOp.summary, operationType: subOp.operationType, idx }, `生成子操作 ${idx + 1}/${subOps.length}`)
              return generateSubOperationCode(action, subOp, ctx, trackingContext)
            },
            3
          )

          let result: GeneratedComponent
          if (subOps.length === 1) {
            // 單操作：直接用生成的代碼，不需要 dispatch 組裝
            let { code } = subOpCodes[0]
            // 安全網：如果代碼用了 sql 但沒 import，自動注入
            const singleUsesSql = /\bsql\s*`/.test(code) || /\bsql\.begin/.test(code)
            const singleHasImport = /import\s*\{[^}]*\bsql\b[^}]*\}\s*from\s*['"]@\/lib\/db['"]/.test(code)
            if (singleUsesSql && !singleHasImport) {
              code = `import { sql } from '@/lib/db'\n\n${code}`
            }
            // 確保 export 正確的函數名
            const fnName = toCamelCase(action.name)
            let finalCode = code
            // 將 handle 函數重命名為 action 函數名並 export
            const handleFuncMatch = finalCode.match(new RegExp(`(?:async\\s+)?function\\s+(handle${ID_PATTERN})`))
            if (handleFuncMatch) {
              finalCode = finalCode.replace(
                new RegExp(`(?:export\\s+)?(?:async\\s+)?function\\s+${handleFuncMatch[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
                `export async function ${fnName}`
              )
            } else {
              // LLM 沒用 handle 前綴，直接確保 export
              finalCode = finalCode.replace(
                new RegExp(`(?:export\\s+)?(?:async\\s+)?function\\s+${ID_PATTERN}`),
                `export async function ${fnName}`
              )
            }
            result = {
              path: `lib/actions/${toKebabCase(action.name)}.ts`,
              content: finalCode,
              description: action.summary,
            }
          } else {
            // 多操作：組裝
            result = composeActionFunction(action, subOps, subOpCodes)
          }

          // esbuild 語法驗證：確認語法正確
          try {
            const esbuild = await import('esbuild')
            await esbuild.transform(result.content, { loader: 'ts' })
          } catch (syntaxErr) {
            logger.warn({ actionName: action.name, syntaxErr }, '精準 Handler 生成語法錯誤，回退到整體生成')
            throw syntaxErr  // 觸發外層 catch → 回退到原有邏輯
          }

          // 組裝後跑 validateActionResponses（復用現有 post-fix）
          const { files, fixes } = validateActionResponses([result])
          if (fixes.length > 0) {
            logger.info({ actionName: action.name, fixes }, '精準 Handler 生成 post-fix')
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
  code = unwrapListResponse(code)  // L21.P1-A：擋 `return { items, total, page, pageSize }` wrap

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
/**
 * 從 action 生成的代碼中提取所有 _stepSummary dispatch 值
 * 用於 API route 自動注入 _stepSummary
 */
export function extractDispatchSummaries(actionContent: string): string[] {
  const summaries: string[] = []
  // 匹配 op === '...' 或 op.includes('...')
  for (const m of actionContent.matchAll(/op\s*===\s*['"]([^'"]+)['"]/g)) {
    summaries.push(m[1])
  }
  for (const m of actionContent.matchAll(/op\.includes\(['"]([^'"]+)['"]\)/g)) {
    if (!summaries.includes(m[1])) summaries.push(m[1])
  }
  return summaries
}

/**
 * 猜測 _stepSummary 對應的 HTTP method
 * 查詢/列表 → GET，建立/新增 → POST，編輯/更新 → PUT，刪除/移除 → DELETE
 */
export function guessHttpMethodForSummary(summary: string): string {
  if (/查詢|列表|取得|獲取|搜尋|list|query|get|search|fetch/i.test(summary)) return 'GET'
  if (/建立|新增|註冊|create|add|register|sign.?up/i.test(summary)) return 'POST'
  if (/編輯|更新|修改|update|edit|modify/i.test(summary)) return 'PUT'
  if (/刪除|移除|delete|remove/i.test(summary)) return 'DELETE'
  return 'POST' // 預設
}

export function generateApiRoutes(
  actions: ActionEntry[],
  actionsYml: string,
  actionFiles?: GeneratedComponent[]
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

    const rawRouteDir = meta.path
      .replace(/^\//, '')
      .replace(/:(\w+)/g, '[$1]')
    const routeDir = rawRouteDir.startsWith('app/') ? rawRouteDir : `app/${rawRouteDir}`

    // 從 action 生成的代碼中提取所有 _stepSummary dispatch 值
    const actionFile = actionFiles?.find(f => f.path === `lib/actions/${toKebabCase(action.name)}.ts`)
    const summaries = actionFile ? extractDispatchSummaries(actionFile.content) : []

    let content: string
    if (summaries.length <= 1) {
      // 單操作 action → 簡單路由（自動注入唯一的 _stepSummary）
      const singleSummary = summaries[0] || action.summary || ''
      const isQuery = meta.method === 'GET'
      const defaultStatus = isQuery ? 200 : (meta.method === 'POST' ? 201 : 200)

      if (isQuery) {
        content = `import { NextRequest, NextResponse } from 'next/server'
import { ${fnName} } from '${importPath}'

export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries())
    const result = await ${fnName}({ _stepSummary: '${singleSummary}', ...params } as any)
    const status = (result as any).__status || ${defaultStatus}
    return NextResponse.json(result, { status })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
`
      } else {
        content = `import { NextRequest, NextResponse } from 'next/server'
import { ${fnName} } from '${importPath}'

export async function ${meta.method}(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await ${fnName}({ _stepSummary: '${singleSummary}', ...body })
    const status = (result as any).__status || ${defaultStatus}
    return NextResponse.json(result, { status })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
`
      }
    } else {
      // 多操作 action → 多方法路由，按 HTTP method 自動注入 _stepSummary
      // 前端只需要用正確的 HTTP method，不需要知道 _stepSummary
      const methodHandlers: string[] = []
      const usedMethods = new Set<string>()

      // 按 summary 推斷 HTTP method 並生成 handler
      for (const summary of summaries) {
        const method = guessHttpMethodForSummary(summary)
        if (usedMethods.has(method)) continue // 同一 method 只取第一個
        usedMethods.add(method)

        if (method === 'GET') {
          methodHandlers.push(`export async function GET(req: NextRequest) {
  try {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries())
    const result = await ${fnName}({ _stepSummary: '${summary}', ...params } as any)
    const status = (result as any).__status || 200
    return NextResponse.json(result, { status })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}`)
        } else if (method === 'DELETE') {
          methodHandlers.push(`export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const result = await ${fnName}({ _stepSummary: '${summary}', ${meta.path.includes(':id') ? 'id: id!' : 'id'} } as any)
    const status = (result as any).__status || 200
    return NextResponse.json(result, { status })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}`)
        } else {
          const defaultStatus = method === 'POST' ? 201 : 200
          methodHandlers.push(`export async function ${method}(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await ${fnName}({ _stepSummary: '${summary}', ...body })
    const status = (result as any).__status || ${defaultStatus}
    return NextResponse.json(result, { status })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}`)
        }
      }

      // 如果有 summary 但 method 重複（例如兩個都是 POST），用 _stepSummary body 派發
      // 檢查是否有未使用的 summaries
      const unmapped = summaries.filter(s => {
        const m = guessHttpMethodForSummary(s)
        return [...usedMethods].filter(u => u === m).length > 1
      })
      if (unmapped.length > 0 && !usedMethods.has('POST')) {
        // 加一個 POST handler 接受前端傳入的 _stepSummary
        methodHandlers.push(`export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await ${fnName}(body)
    const status = (result as any).__status || 200
    return NextResponse.json(result, { status })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}`)
      }

      content = `import { NextRequest, NextResponse } from 'next/server'
import { ${fnName} } from '${importPath}'

${methodHandlers.join('\n\n')}
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

/**
 * 從 unchanged 組件中識別 mock data 來源檔案（如 lib/todos.ts）。
 * 規則：lib/ 下、非 lib/db.ts 或 lib/actions/*、export 大型陣列或 INITIAL_/MOCK_ 常數。
 */
function identifyMockDataFiles(unchanged: GeneratedComponent[]): string[] {
  return unchanged
    .filter(f => {
      if (!f.path.startsWith('lib/')) return false
      if (f.path === 'lib/db.ts' || f.path.startsWith('lib/actions/')) return false
      return /export\s+(?:const|let)\s+\w+\s*(?::\s*\w+(?:\[\])?\s*)?=\s*\[/.test(f.content)
        || /export\s+(?:const|let)\s+(?:INITIAL_|MOCK_|SAMPLE_|DEFAULT_|FAKE_)/i.test(f.content)
        || /export\s+(?:type|interface)\s+\w+/.test(f.content) && /export\s+(?:const|let)\s+\w+.*=\s*\[/.test(f.content)
    })
    .map(f => f.path)
}

/**
 * 掃描已改寫的組件是否仍殘留 mock data（import mock 檔案、硬編碼陣列等）。
 * 零 LLM，純 regex。
 */
function scanForRemainingMockData(
  components: GeneratedComponent[],
  mockDataFiles: string[]
): { path: string; issues: string[] }[] {
  const results: { path: string; issues: string[] }[] = []

  for (const comp of components) {
    const issues: string[] = []

    // 1. 檢查是否仍 import 了 mock data 檔案
    for (const mockFile of mockDataFiles) {
      const baseName = mockFile.replace(/^.*\//, '').replace(/\.tsx?$/, '')
      const escaped = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      if (new RegExp(`import\\s+.*from\\s+['"].*${escaped}['"]`).test(comp.content)) {
        issues.push(`仍然 import 了 mock data 檔案: ${mockFile}`)
      }
    }

    // 2. 用 MOCK_DATA_PATTERNS regex 掃描硬編碼陣列
    for (const pattern of MOCK_DATA_PATTERNS) {
      if (pattern.test(comp.content)) {
        issues.push(`偵測到 mock data 模式`)
        break
      }
    }

    if (issues.length > 0) results.push({ path: comp.path, issues })
  }

  return results
}

/**
 * 對仍殘留 mock data 的組件用 diff 模式重試改寫。
 * 在 prompt 中附帶殘留問題描述，引導 LLM 精準修正。
 */
async function retryRewriteForMockData(
  component: GeneratedComponent,
  issues: string[],
  availableActions: { path: string; exports: string[] }[],
  actionImplementations?: { path: string; content: string }[],
  trackingContext?: { userId?: string; conversationId?: string }
): Promise<GeneratedComponent> {
  const issueText = issues.map(i => `- ${i}`).join('\n')
  logger.info({ path: component.path, issues }, '二次改寫：修復殘留 mock data')

  // 構造帶有殘留問題描述的改寫 prompt
  const systemPrompt = buildRewriteSystemPrompt() + `

## 重要：使用 SEARCH/REPLACE 格式輸出（mock data 修復模式）
此組件的上一次改寫未完全移除 mock data。以下是偵測到的問題：
${issueText}

請用以下格式輸出修正：

<<<<<<< SEARCH
需要被替換的原始代碼（精確匹配，包括空白和縮排）
=======
替換後的新代碼
>>>>>>> REPLACE

重點：
1. 移除所有 mock data 的 import（如 import {...} from '@/lib/todos'）
2. 替換為 Server Action 的 import（如 import { manageTodoAction } from '@/app/actions/manage_todo'）
3. 將 useState 的硬編碼初始值替換為空值 + useEffect fetch
4. 保留所有 UI/動畫/樣式不變`

  const userPrompt = buildRewriteUserPrompt(component, availableActions, actionImplementations)

  const maxTokens = Math.min(16384, 64000)
  const result = await callClaude(systemPrompt, userPrompt, { maxTokens }, trackingContext)

  if (!result.success || !result.content) {
    logger.warn({ path: component.path }, '二次改寫失敗，保留上一版本')
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
    // LLM 沒輸出 SEARCH/REPLACE 格式，嘗試全文提取
    const code = extractCodeFromResponse(result.content)
    const openTags = (code.match(/<[A-Z]\w*/g) || []).length
    const closeTags = (code.match(/<\/[A-Z]\w*>/g) || []).length
    if (openTags > 0 && Math.abs(openTags - closeTags) > 2) {
      logger.warn({ path: component.path }, '二次改寫也截斷，保留上一版本')
      return component
    }
    if (code.length > component.content.length * 0.5) {
      return { path: component.path, content: code, description: component.description }
    }
    return component
  }

  // 逐個 block 應用
  let modifiedContent = component.content
  let appliedCount = 0
  for (const block of blocks) {
    const trimmedSearch = block.search.trim()
    if (modifiedContent.includes(trimmedSearch)) {
      modifiedContent = modifiedContent.replace(trimmedSearch, block.replace.trim())
      appliedCount++
    } else {
      // fuzzy：忽略縮排差異
      const normalizedContent = modifiedContent.replace(/^[ \t]+/gm, '')
      const normalizedSearch = trimmedSearch.replace(/^[ \t]+/gm, '')
      if (normalizedContent.includes(normalizedSearch)) {
        const lines = modifiedContent.split('\n')
        const searchLines = trimmedSearch.split('\n')
        const normalizedSearchLines = searchLines.map(l => l.trim())
        for (let i = 0; i <= lines.length - searchLines.length; i++) {
          const match = lines.slice(i, i + searchLines.length).every(
            (l, j) => l.trim() === normalizedSearchLines[j]
          )
          if (match) {
            const before = lines.slice(0, i).join('\n')
            const after = lines.slice(i + searchLines.length).join('\n')
            modifiedContent = before + (before ? '\n' : '') + block.replace.trim() + (after ? '\n' : '') + after
            appliedCount++
            break
          }
        }
      }
    }
  }

  logger.info({ path: component.path, totalBlocks: blocks.length, applied: appliedCount }, '二次改寫 diff 應用完成')

  // L8：偵測 LLM 在 replace block 寫進 git conflict marker → 回退原版本
  if (hasConflictMarker(modifiedContent)) {
    logger.warn({ path: component.path, applied: appliedCount }, '二次改寫偵測到 git conflict marker，回退原始版本')
    return component
  }

  return { path: component.path, content: modifiedContent, description: component.description }
}

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

const MOCK_IDENTIFICATION_SYSTEM_PROMPT = `You are a frontend code analysis expert. Determine whether a React component contains mock/hardcoded business data that needs to be replaced with Server Action calls.

## ⚠️ LANGUAGE POLICY
Your JSON output (reason field, etc.) MUST be in ENGLISH. Do not output Chinese.

你是前端代碼分析專家。判斷 React 組件中是否包含「需要替換為 Server Action 呼叫的 mock/硬編碼業務資料」。

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

    const ComponentIndicesSchema = z.object({
      indices: z.array(z.number()),
    })

    const result = await callStructured({
      schema: ComponentIndicesSchema,
      model: MODEL.HAIKU,
      system: MOCK_IDENTIFICATION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
      maxTokens: 200,
      temperature: 0,
      purpose: 'coder_mock_identification',
      trackingContext,
    })

    if (!result.success) {
      logger.warn({ error: result.error }, 'Haiku mock 識別失敗')
      return null
    }

    // 驗證 indices 範圍 + 去重
    const valid = [...new Set(result.data.indices)].filter(
      i => typeof i === 'number' && i >= 0 && i < allComponents.length
    )

    logger.info(
      { raw: result.data.indices.length, valid: valid.length, total: allComponents.length },
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

function buildRewriteSystemPrompt(): CacheableSystemPrompt {
  return buildCacheableSystem(`You are a Next.js frontend engineer. Your task is to rewrite a React component, replacing mock data with Server Action calls.

## ⚠️ LANGUAGE POLICY
All generated code (error messages, comments, state labels) MUST be in ENGLISH.
- \`throw new Error('<english>')\` / \`catch (e) { setError('<english>') }\`
- Comments in English
- Variable names in English camelCase
- Loading text, error text: use existing UI text (keep if already Chinese — those are user-facing), but any NEW strings you introduce default to English

## Rewrite Rules
1. Preserve all UI structure, styles (Tailwind classes), and animations (motion/react) unchanged
2. Replace \`useState([{...mock data...}])\` with \`useState<Type[]>([])\` + \`useEffect\` calling the Server Action to fetch data
3. Replace \`useState({...mock object...})\` with \`useState<Type | null>(null)\` + \`useEffect\` to load
4. Replace hardcoded constant arrays (\`const items = [{...}]\`) with Server Action dynamic loading
5. Replace form submission mock logic with the corresponding create/update/delete Server Action call
6. Server Action import format: \`import { actionNameAction } from '@/app/actions/domain'\`
7. Keep the \`'use client'\` directive
8. Add loading state (simple spinner or skeleton)
9. Add error state (try/catch + error state + error message — keep user-facing text in its existing language; any NEW text defaults to English)
10. Do NOT introduce any new npm packages
11. If the component is pure UI (no data operations), leave it unchanged

## Server Action Call Convention (CRITICAL)
These Server Actions dispatch on the **_stepSummary** field — NOT an intent/action field.

**_stepSummary MUST be the exact string defined in the Action function** (see the literals in \`if (op === '...')\` or \`if (op.includes('...'))\` within the Action interface definitions below).
Do NOT invent _stepSummary values — find the exact matching condition from the Action source.

The Action's summary strings are English verbs produced by BDD Features (e.g. \`Create Order\`, \`Update Order\`, \`List Orders\`). Use them verbatim — do not translate, pluralize differently, or substitute synonyms.

Example: if the Action code has \`if (op === 'Register User')\`, then \`_stepSummary\` MUST be \`'Register User'\` — not a synonym like \`'Create Account'\`, and not a Chinese translation.

Standard call patterns (summary strings below are illustrative — always pick the real one from the Action interface):
- **List query** (initial page load): check the "required parameters" comments in the Action interface; if the branch needs filter/status, pass reasonable defaults. Example: \`actionFn({ _stepSummary: 'List Orders', filter: 'all' })\`. **Do NOT pass ID, do NOT pass userId**
- **Single query** (detail page): \`actionFn({ _stepSummary: 'Get Order', entityId: '...' })\` — pass ID
- **Create**: \`actionFn({ _stepSummary: 'Create Order', ...fields })\`
- **Update**: \`actionFn({ _stepSummary: 'Update Order', id: '...', ...fields })\`
- **Delete**: \`actionFn({ _stepSummary: 'Delete Order', id: '...' })\`

**Authentication is handled automatically**: the Server Action auto-injects userId from cookie. The component **MUST NOT pass userId manually**. After login the cookie is set automatically — you only manage UI state (e.g. \`setIsLoggedIn(true)\`).

**Do NOT duplicate keys**: each parameter appears once (duplicate keys in JS objects only keep the last occurrence — wasteful and confusing).

**For initial page loads, pick the LIST-type summary (returns an array, usually named with \`List\`/\`All\`/\`Fetch All\` or similar). Do NOT use the single-query summary (requires an ID) — match by the Action's return type and parameter shape.**

Return format: on success, return fields directly (\`result.fieldName\`, or \`result\` itself when it is an array); on failure, \`throw new Error(...)\`.
**Do NOT use \`result.data.xxx\` — use \`result.xxx\` directly.** For list queries returning arrays, use \`result\` directly (it IS the array).
**Do NOT pass \`{ intent: 'get' }\` — such calls are invalid.**

Below are the actual function Input/Output interface definitions and full implementations. **_stepSummary must match exactly**:

## Output
Output the full rewritten TypeScript/JSX code ONLY — no explanations, no markdown wrappers.`)
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

  // 提取所有 _stepSummary 合法值（從 op === '...' 或 op.includes('...') 中抓取）
  const stepSummaries: string[] = []
  for (const m of content.matchAll(/op\s*===\s*['"]([^'"]+)['"]/g)) {
    stepSummaries.push(m[1])
  }
  // 向後相容：也抓 op.includes('...')（舊版生成的代碼）
  for (const m of content.matchAll(/op\.includes\(['"]([^'"]+)['"]\)/g)) {
    if (!stepSummaries.includes(m[1])) stepSummaries.push(m[1])
  }
  if (stepSummaries.length > 0) {
    result.push('')
    result.push(`// 合法的 _stepSummary 值（必須包含以下關鍵字之一）：`)
    result.push(`// ${stepSummaries.map(s => `「${s}」`).join('、')}`)
  }

  // 提取每個 dispatch 分支需要的參數（從 input.xxx 引用中推斷）
  const branchParamRegex = /(?:if|else if)\s*\((?:op\s*===\s*['"]([^'"]+)['"]|op\.includes\(['"]([^'"]+)['"]\))\)\s*\{/g
  let branchMatch: RegExpExecArray | null
  while ((branchMatch = branchParamRegex.exec(content)) !== null) {
    const branchName = branchMatch[1] || branchMatch[2]
    const branchStart = branchMatch.index + branchMatch[0].length
    const branchSlice = content.substring(branchStart, branchStart + 600)
    const params = [...branchSlice.matchAll(/input\.(\w+)/g)].map(m => m[1])
    const uniqueParams = [...new Set(params)].filter(p => p !== '_stepSummary' && p !== 'userId')
    if (uniqueParams.length > 0) {
      result.push(`// 「${branchName}」需要的參數：${uniqueParams.join(', ')}`)
    } else {
      result.push(`// 「${branchName}」不需要額外參數`)
    }
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

  const estimatedTokens = Math.ceil(component.content.length / 2) + 4096
  const maxTokens = Math.max(16384, Math.min(estimatedTokens, 64000))
  const result = await callClaude(systemPrompt, userPrompt, { maxTokens }, trackingContext)

  if (!result.success || !result.content) {
    logger.warn({ path: component.path, error: result.error }, '組件改寫失敗，保留原始版本')
    return component
  }

  const code = extractCodeFromResponse(result.content)

  // 截斷偵測：JSX 開閉標籤不平衡 → 用 diff 模式重試（不直接回退原始版本）
  const openTags = (code.match(/<[A-Z]\w*/g) || []).length
  const closeTags = (code.match(/<\/[A-Z]\w*>/g) || []).length
  if (openTags > 0 && Math.abs(openTags - closeTags) > 2) {
    logger.warn({ path: component.path, openTags, closeTags }, '改寫後 JSX 標籤不平衡（可能截斷），改用 diff 模式重試')
    return rewriteWithDiffMode(component, availableActions, actionImplementations, trackingContext)
  }

  // esbuild TSX 語法驗證 — 捕捉截斷/壞 JSX（tag count 漏網的情況）
  const validated = await validateComponentSyntax(code, component.path)
  if (!validated) {
    logger.warn({ path: component.path }, '改寫後 TSX 語法驗證失敗，改用 diff 模式重試')
    return rewriteWithDiffMode(component, availableActions, actionImplementations, trackingContext)
  }

  // fetch('/api/...') 偵測：LLM 應該用 Server Action import 而非 fetch
  // 如果用了 fetch → 自動注入 _stepSummary 到 fetch body，防止 dispatch 失敗
  const fixedCode = fixFetchCallsWithStepSummary(code, actionImplementations)

  return {
    path: component.path,
    content: fixedCode,
    description: component.description,
  }
}

/**
 * 偵測 fetch('/api/...') 呼叫並自動注入 _stepSummary。
 * LLM 應該用 Server Action import，但有時會用 fetch — 這時 body 缺少 _stepSummary
 * 會導致 action dispatch 找不到分支 → throw → 功能「沒反應」。
 */
function fixFetchCallsWithStepSummary(
  code: string,
  actionImplementations?: { path: string; content: string }[],
): string {
  if (!actionImplementations?.length) return code
  if (!/fetch\s*\(\s*['"`]\/api\//.test(code)) return code

  // 從 action implementations 提取 {actionName → stepSummaries by method}
  const actionSummaries = new Map<string, { get?: string; post?: string; put?: string; delete?: string }>()
  for (const impl of actionImplementations) {
    const actionName = impl.path.replace(/.*\//, '').replace(/\.\w+$/, '') // lib/actions/manage-todo.ts → manage-todo
    const summaries = extractDispatchSummaries(impl.content)
    const methods: { get?: string; post?: string; put?: string; delete?: string } = {}
    for (const s of summaries) {
      const method = guessHttpMethodForSummary(s).toLowerCase() as 'get' | 'post' | 'put' | 'delete'
      if (!methods[method]) methods[method] = s
    }
    actionSummaries.set(actionName, methods)
    // 也用 underscore 版本（manage_todo）
    actionSummaries.set(actionName.replace(/-/g, '_'), methods)
  }

  let result = code

  // 匹配 fetch('/api/xxx', { method: 'POST', ... body: JSON.stringify({ ... }) })
  // 在 JSON.stringify({ 之後注入 _stepSummary
  const fetchRegex = /fetch\s*\(\s*['"`](\/api\/([^'"`]+?))['"`]\s*,\s*\{([^}]*?)body\s*:\s*JSON\.stringify\s*\(\s*\{/g
  let match: RegExpExecArray | null
  const replacements: Array<{ start: number; end: number; replacement: string }> = []

  while ((match = fetchRegex.exec(result)) !== null) {
    const apiPath = match[2] // e.g. "manage_todo" or "toggle_todo_completion"
    const methodMatch = match[3].match(/method\s*:\s*['"`](\w+)['"`]/)
    const httpMethod = (methodMatch?.[1] || 'POST').toLowerCase()

    // 找到對應的 action
    const actionName = apiPath.replace(/\//g, '_').replace(/\[.*?\]/g, '') // manage_todo/[id] → manage_todo_
    const summaryMap = actionSummaries.get(actionName) || actionSummaries.get(apiPath)
    if (!summaryMap) continue

    const stepSummary = summaryMap[httpMethod as keyof typeof summaryMap]
    if (!stepSummary) continue

    // 檢查是否已經有 _stepSummary
    const afterBrace = result.substring(match.index + match[0].length, match.index + match[0].length + 200)
    if (afterBrace.includes('_stepSummary')) continue

    // 在 JSON.stringify({ 後面注入 _stepSummary
    const insertPos = match.index + match[0].length
    replacements.push({
      start: insertPos,
      end: insertPos,
      replacement: ` _stepSummary: '${stepSummary}',`,
    })
  }

  // 倒序替換（避免 index 偏移）
  for (const r of replacements.reverse()) {
    result = result.substring(0, r.start) + r.replacement + result.substring(r.end)
  }

  if (replacements.length > 0) {
    logger.info({ path: 'component', injected: replacements.length }, 'fixFetchCallsWithStepSummary：注入 _stepSummary 到 fetch body')
  }

  return result
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
    // esbuild TSX 語法驗證
    const valid = await validateComponentSyntax(code, component.path)
    if (!valid) {
      logger.warn({ path: component.path }, '大組件 fallback 全文模式 TSX 語法錯誤，回退原始版本')
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

  // L8：LLM 偶爾在 replace block 寫進 git conflict marker（<<<<<<<、=======、>>>>>>>）
  // 在 esbuild 驗證之前先攔截，避免污染後續 syntax firewall + 變空殼
  if (hasConflictMarker(modifiedContent)) {
    logger.warn({ path: component.path, applied: appliedCount }, '偵測到 git conflict marker 流入代碼，回退原始版本')
    return component
  }

  // esbuild TSX 語法驗證 — SEARCH/REPLACE 可能引入語法錯誤
  const valid = await validateComponentSyntax(modifiedContent, component.path)
  if (!valid) {
    logger.warn({ path: component.path, applied: appliedCount, failed: failedCount }, 'SEARCH/REPLACE 後 TSX 語法錯誤，回退原始版本')
    return component
  }

  // fetch('/api/...') 偵測 + _stepSummary 自動注入
  const fixedContent = fixFetchCallsWithStepSummary(modifiedContent, actionImplementations)

  return {
    path: component.path,
    content: fixedContent,
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

  // Step 2.5: Auth 系統生成（零 LLM，schema 驅動三種變體）
  const authCaps = detectAuthCapabilities(schemaSql)
  const authFiles = generateAuthSystem(schemaSql, authCaps)
  if (authFiles) {
    await callbacks.onProgress('生成認證系統...', 7)
    logger.info({ fileCount: authFiles.length, ...authCaps }, 'Auth 系統生成完成')
  }

  // Step 2.6: Email primitive + Magic-link 子系統（零 LLM）
  const actionNames = actions.map(a => a.name || '')
  const emailFiles = generateEmailInfrastructure(schemaSql, actionNames)
  const magicLinkFiles = generateMagicLinkSystem(schemaSql)
  if (emailFiles.length > 0 || magicLinkFiles) {
    await callbacks.onProgress('生成 Email / Magic-link 系統...', 8)
    logger.info(
      { emailCount: emailFiles.length, magicLinkCount: magicLinkFiles?.length || 0, hasMagicLink: authCaps.hasMagicLink },
      'Email 系統生成完成'
    )
  }

  // Step 2.7: Admin Panel generation (zero-LLM)
  const adminFiles = generateAdminPanel(schemaSql, entityMapping, !!authFiles)
  if (adminFiles.length > 0) {
    await callbacks.onProgress('生成管理後台...', 8)
    logger.info({ fileCount: adminFiles.length }, 'Admin Panel 生成完成')
  }

  // Step 2.8: Upload system generation (zero-LLM, independent — any project with image columns)
  const uploadFiles = generateUploadFiles(schemaSql)
  if (uploadFiles) {
    await callbacks.onProgress('生成圖片上傳...', 9)
    logger.info({ fileCount: uploadFiles.length }, 'Upload 系統生成完成')
  }

  // Step 3: 並行生成 action 函數（限制並發 3）
  await callbacks.onProgress(`生成 ${actions.length} 個後端函數...`, 10)
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
  const apiRouteFiles = generateApiRoutes(actions, actionsYml, actionFiles)

  // Step 4.6: API Route 靜態驗證 — 確認每個 route 都有 _stepSummary 注入
  const routesMissingSummary = apiRouteFiles.filter(f => {
    const hasDispatch = actionFiles.some(a => {
      const summaries = extractDispatchSummaries(a.content)
      return summaries.length > 0 && f.path.includes(toKebabCase(a.path.replace('lib/actions/', '').replace('.ts', '')))
    })
    return hasDispatch && !f.content.includes('_stepSummary')
  })
  if (routesMissingSummary.length > 0) {
    logger.error({ paths: routesMissingSummary.map(f => f.path) }, 'API Route 缺少 _stepSummary 注入！')
  }

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

  // Step 6.5: 掃描改寫結果是否仍殘留 mock data → 二次改寫
  const mockDataFiles = identifyMockDataFiles(unchanged)
  if (mockDataFiles.length > 0) {
    logger.info({ mockDataFiles }, '識別到 mock data 來源檔案')
  }
  const mockScanResults = scanForRemainingMockData(rewrittenFrontend, mockDataFiles)
  if (mockScanResults.length > 0) {
    await callbacks.onProgress(`修復 ${mockScanResults.length} 個組件殘留 mock data...`, 96)
    for (const { path, issues } of mockScanResults) {
      const comp = rewrittenFrontend.find(f => f.path === path)
      if (!comp) continue
      const retried = await retryRewriteForMockData(comp, issues, availableActions, actionFiles, trackingContext)
      const idx = rewrittenFrontend.findIndex(f => f.path === path)
      if (idx !== -1) rewrittenFrontend[idx] = retried
    }
  }

  // 二次掃描：記錄仍殘留的 mock data 組件（用於警告用戶）
  const finalMockScan = scanForRemainingMockData(rewrittenFrontend, mockDataFiles)
  const mockDataWarnings = finalMockScan.map(r => r.path)
  if (mockDataWarnings.length > 0) {
    logger.warn({ components: mockDataWarnings }, '二次改寫後仍有組件殘留 mock data')
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
    for (const vf of validatedActionFiles) {
      const idx = actionFiles.findIndex(f => f.path === vf.path)
      if (idx !== -1) actionFiles[idx] = vf
    }
  }

  // Step 8.5: SQL 欄位靜態驗證（零 LLM）— 檢查 deleted_at/user_id 等欄位是否真的存在於 DDL
  const { files: sqlValidatedFiles, fixes: sqlFixes } = validateSqlColumns(actionFiles, schemaSql)
  if (sqlFixes.length > 0) {
    for (const vf of sqlValidatedFiles) {
      const idx = actionFiles.findIndex(f => f.path === vf.path)
      if (idx !== -1) actionFiles[idx] = vf
    }
    logger.info({ fixCount: sqlFixes.length, fixes: sqlFixes }, 'SQL 欄位驗證修正完成')
  }

  // Step 8.6: 確保所有 action 檔案有 sql import（LLM 偶爾忘記 import）
  for (const file of actionFiles) {
    if (!file.path.startsWith('lib/actions/')) continue
    if (file.content.includes('sql`') && !file.content.match(/import\s+.*sql.*from/)) {
      file.content = `import { sql } from '@/lib/db'\n${file.content}`
      logger.info({ path: file.path }, '自動注入缺失的 sql import')
    }
  }

  await callbacks.onProgress('完成！', 98)

  let backendFiles = sanitizedFrontend.filter(f => backendPaths.has(f.path)) as typeof backendFilesRaw
  if (backendFiles.length === 0) backendFiles.push(...backendFilesRaw) // fallback

  // Auth 系統：注入 auth 檔案到 backendFiles + SessionProvider 到 root layout
  if (authFiles) {
    backendFiles.push(...authFiles)
    // 找到 root layout（不含 admin）注入 SessionProvider（用 path 精確比對，避免 index 錯位）
    const allFrontend = [...rewrittenFrontend, ...unchanged]
    const rootLayout = allFrontend.find(f =>
      f.path.match(/app\/(?:\([^)]+\)\/)?layout\.tsx$/) && !f.path.includes('admin')
    )
    if (rootLayout) {
      const injected = injectSessionProvider(rootLayout.content)
      if (injected !== rootLayout.content) {
        const rwIdx = rewrittenFrontend.findIndex(f => f.path === rootLayout.path)
        if (rwIdx !== -1) {
          rewrittenFrontend[rwIdx] = { ...rootLayout, content: injected }
        } else {
          const ucIdx = unchanged.findIndex(f => f.path === rootLayout.path)
          if (ucIdx !== -1) unchanged[ucIdx] = { ...rootLayout, content: injected }
        }
        logger.info({ path: rootLayout.path }, 'SessionProvider 注入到 root layout')
      }
    }
  }

  // Admin Panel + Upload + Email primitive + Magic-link：注入到 backendFiles
  if (adminFiles.length > 0) backendFiles.push(...adminFiles)
  if (uploadFiles) backendFiles.push(...uploadFiles)
  if (emailFiles.length > 0) backendFiles.push(...emailFiles)
  if (magicLinkFiles) backendFiles.push(...magicLinkFiles)

  const summary = `生成了 ${actionFiles.length} 個後端函數、${serverActionFiles.length} 個 Server Action、${apiRouteFiles.length} 個 API Route，改寫了 ${rewrittenFrontend.length} 個前端組件（${unchanged.length} 個保持不變）。${adminFiles.length > 0 ? ` Admin Panel ${adminFiles.length} 個檔案。` : ''}${uploadFiles ? ' Upload 系統。' : ''}${emailFiles.length > 0 ? ' Email primitive。' : ''}${magicLinkFiles ? ` Magic-link ${magicLinkFiles.length} 個檔案。` : ''}`

  logger.info({
    actionFiles: actionFiles.length,
    serverActionFiles: serverActionFiles.length,
    rewrittenFrontend: rewrittenFrontend.length,
    unchangedFrontend: unchanged.length,
  }, 'Coder Pipeline 完成')

  return { backendFiles, rewrittenFrontend, unchangedFrontend: unchanged, summary, mockDataWarnings: mockDataWarnings.length > 0 ? mockDataWarnings : undefined }
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
/**
 * 從 DDL 解析所有 table → columns 映射。
 */
function generateColumnListText(schemaSql: string): string {
  const tables = parseTableColumnsFromDDL(schemaSql)
  if (tables.size === 0) return ''

  const pks = parseTablePrimaryKeys(schemaSql)
  const COMMON_COLS = ['id', 'created_at', 'updated_at']
  const lines = ['## 欄位清單（生成的 SQL 只能使用以下欄位，禁止使用未列出的欄位）']
  for (const [table, cols] of tables) {
    const colList = [...cols].join(', ')
    const pk = pks.get(table)
    let note = ''
    if (pk && pk.length > 1) {
      // 複合主鍵表（junction table）→ 強警告
      note = `（⚠️ 複合主鍵表：PK = (${pk.join(', ')})，**沒有 id 欄位**！WHERE/UPDATE/DELETE 必須用 ${pk.join(' AND ')} 而非 id）`
    } else {
      const missing = COMMON_COLS.filter(c => !cols.has(c))
      if (missing.length > 0) note = `（注意：此表沒有 ${missing.join('、')}）`
    }
    lines.push(`- ${table}: ${colList}${note}`)
  }
  return lines.join('\n')
}

/**
 * 解析每個表的主鍵欄位（支援複合主鍵和 inline PRIMARY KEY）。
 * 返回 Map<tableName, primaryKeyColumns[]>
 */
export function parseTablePrimaryKeys(schemaSql: string): Map<string, string[]> {
  const pkInfo = new Map<string, string[]>()
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(([\s\S]*?)\)\s*;/gi
  let match: RegExpExecArray | null
  while ((match = tableRegex.exec(schemaSql)) !== null) {
    const table = match[1].toLowerCase()
    const body = match[2]

    // 1. 複合 PK：PRIMARY KEY (col1, col2)
    const compositePk = body.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i)
    if (compositePk) {
      const cols = compositePk[1].split(',').map(c => c.trim().toLowerCase()).filter(Boolean)
      if (cols.length > 0) {
        pkInfo.set(table, cols)
        continue
      }
    }

    // 2. Inline PK：col TYPE ... PRIMARY KEY ...
    for (const line of body.split('\n')) {
      const inlinePk = line.match(/^\s*(\w+)\s+\w+(?:\([^)]*\))?\s+[^,\n]*PRIMARY\s+KEY/i)
      if (inlinePk) {
        pkInfo.set(table, [inlinePk[1].toLowerCase()])
        break
      }
    }
  }
  return pkInfo
}

function parseTableColumnsFromDDL(schemaSql: string): Map<string, Set<string>> {
  const tables = new Map<string, Set<string>>()
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(([\s\S]*?)\)\s*;/gi
  let match: RegExpExecArray | null
  while ((match = tableRegex.exec(schemaSql)) !== null) {
    const tableName = match[1].toLowerCase()
    const body = match[2]
    const columns = new Set<string>()
    // 每行一個欄位定義（忽略 CONSTRAINT、PRIMARY KEY、UNIQUE 等）
    for (const line of body.split('\n')) {
      const colMatch = line.trim().match(/^(\w+)\s+(?:UUID|TEXT|VARCHAR|INT|INTEGER|BIGINT|SERIAL|BOOLEAN|DATE|TIMESTAMP|JSONB?|NUMERIC|FLOAT|DOUBLE|SMALLINT|REAL|DECIMAL)/i)
      if (colMatch) {
        columns.add(colMatch[1].toLowerCase())
      }
    }
    tables.set(tableName, columns)
  }
  return tables
}

/**
 * SQL 欄位靜態驗證：掃描生成的 handler 代碼，檢查 SQL 中引用的欄位是否存在於 DDL。
 * 自動修正：deleted_at 不存在時移除、camelCase → snake_case。
 */
export function validateSqlColumns(
  actionFiles: GeneratedComponent[],
  schemaSql: string
): { files: GeneratedComponent[]; fixes: string[] } {
  const fixes: string[] = []
  const tableColumns = parseTableColumnsFromDDL(schemaSql)

  for (const file of actionFiles) {
    let code = file.content
    let modified = false

    // 提取所有 sql`...` 中的 SQL（支援多行 tagged template）
    const sqlBlockRegex = /sql\s*`([\s\S]*?)`/g
    let sqlMatch: RegExpExecArray | null
    while ((sqlMatch = sqlBlockRegex.exec(code)) !== null) {
      const sqlText = sqlMatch[1]

      // 提取表名
      const tableMatch = sqlText.match(/(?:FROM|INTO|UPDATE)\s+(\w+)/i)
      if (!tableMatch) continue
      const tableName = tableMatch[1].toLowerCase()
      const columns = tableColumns.get(tableName)
      if (!columns) continue

      // 檢查 deleted_at IS NULL — 如果表沒有 deleted_at 就移除
      if (/deleted_at\s+IS\s+(?:NOT\s+)?NULL/i.test(sqlText) && !columns.has('deleted_at')) {
        code = code.replace(/\s*AND\s+deleted_at\s+IS\s+(?:NOT\s+)?NULL/gi, '')
        code = code.replace(/WHERE\s+deleted_at\s+IS\s+(?:NOT\s+)?NULL\s+AND/gi, 'WHERE')
        code = code.replace(/WHERE\s+deleted_at\s+IS\s+(?:NOT\s+)?NULL\s*$/gim, '')
        fixes.push(`${file.path}: 移除 deleted_at（表 ${tableName} 沒有此欄位）`)
        modified = true
      }

      // 檢查 user_id scope — 如果表沒有 user_id 就移除
      if (/user_id\s*=\s*\$\{/i.test(sqlText) && !columns.has('user_id')) {
        code = code.replace(/\s*AND\s+user_id\s*=\s*\$\{[^}]+\}/gi, '')
        code = code.replace(/WHERE\s+user_id\s*=\s*\$\{[^}]+\}\s+AND/gi, 'WHERE')
        code = code.replace(/WHERE\s+user_id\s*=\s*\$\{[^}]+\}\s*$/gim, '')
        fixes.push(`${file.path}: 移除 user_id scope（表 ${tableName} 沒有此欄位）`)
        modified = true
      }

      // 檢查 updated_at — 如果表沒有 updated_at 就從 INSERT/UPDATE 移除
      if (/updated_at/i.test(sqlText) && !columns.has('updated_at')) {
        // UPDATE SET ... updated_at = NOW() 或 updated_at = ${...}
        code = code.replace(/,\s*updated_at\s*=\s*(?:NOW\(\)|\$\{[^}]*\})/gi, '')
        code = code.replace(/updated_at\s*=\s*(?:NOW\(\)|\$\{[^}]*\})\s*,/gi, '')
        // INSERT 欄位列表和 VALUES 中的 updated_at
        code = code.replace(/,\s*updated_at(?=[\s,)])/gi, '')
        code = code.replace(/updated_at\s*,/gi, '')
        code = code.replace(/,\s*NOW\(\)(?=\s*\))/gi, (m, offset) => {
          // 只移除對應 updated_at 位置的 NOW()（簡化：如果前面已移除 updated_at 欄位名則也移除對應值）
          return m
        })
        fixes.push(`${file.path}: 移除 updated_at（表 ${tableName} 沒有此欄位）`)
        modified = true
      }

      // 檢查 created_at — 如果表沒有 created_at 就從 INSERT 移除
      if (/created_at/i.test(sqlText) && !columns.has('created_at')) {
        code = code.replace(/,\s*created_at(?=[\s,)])/gi, '')
        code = code.replace(/created_at\s*,/gi, '')
        fixes.push(`${file.path}: 移除 created_at（表 ${tableName} 沒有此欄位）`)
        modified = true
      }

      // 檢查 WHERE id / RETURNING id 在無 id 欄位的表（junction table）
      // 不自動修復（風險高，可能讓 DELETE 變成全表刪除），只 log 警告
      if (!columns.has('id')) {
        if (/\bWHERE\s+id\s*=/i.test(sqlText) || /\bRETURNING\s+id\b/i.test(sqlText)) {
          fixes.push(`⚠️ ${file.path}: 表 ${tableName} 沒有 id 欄位，但 SQL 使用 WHERE id 或 RETURNING id（複合主鍵表，需手動改用 PK 欄位）`)
        }
      }
    }

    if (modified) {
      file.content = code
    }
  }

  return { files: actionFiles, fixes }
}

/**
 * 驗證 slot 提取的 softDeleteColumn/scopeColumn 是否存在於 DDL。
 */
export function validateSlotColumns(
  slots: { table: string; softDeleteColumn?: string; scopeColumn?: string; scopeParam?: string },
  schemaSql: string
): void {
  const tableColumns = parseTableColumnsFromDDL(schemaSql)
  const columns = tableColumns.get(slots.table.toLowerCase())
  if (!columns) return

  if (slots.softDeleteColumn && !columns.has(slots.softDeleteColumn.toLowerCase())) {
    logger.info({ table: slots.table, column: slots.softDeleteColumn }, 'slot softDeleteColumn 不存在，移除')
    slots.softDeleteColumn = ''
  }
  if (slots.scopeColumn && !columns.has(slots.scopeColumn.toLowerCase())) {
    logger.info({ table: slots.table, column: slots.scopeColumn }, 'slot scopeColumn 不存在，移除')
    slots.scopeColumn = undefined
    slots.scopeParam = undefined
  }
}

export function validateActionResponses(actionFiles: GeneratedComponent[]): { files: GeneratedComponent[]; fixes: string[] } {
  const fixes: string[] = []
  const result = actionFiles.map(file => {
    if (!file.path.startsWith('lib/actions/')) return file
    let code = file.content
    let modified = false

    // Rule 1: 列表查詢回 Array（不要包成 { items: rows }）
    // Pattern A: return { __status: 200, items: rows }
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
    // Pattern B: return { __status: 200, recordCount: X, records: rows }（含額外欄位的 wrapper）
    const extendedWrapperPattern = /return\s*\{[^}]*(?:records|items|data|results)\s*:\s*(\w+)[^}]*\}/g
    let extMatch: RegExpExecArray | null
    while ((extMatch = extendedWrapperPattern.exec(code)) !== null) {
      const fullMatch = extMatch[0]
      if (fullMatch.includes('__status: 201') || fullMatch.includes('success:')) continue // 不是列表查詢
      const rowsVar = extMatch[1]
      // 確認 rowsVar 是 Array 類型（前面有 sql` 查詢或 .map()）
      const varDeclPattern = new RegExp(`(?:const|let)\\s+${rowsVar}\\s*=\\s*(?:await\\s+sql|.*\\.map)`)
      if (varDeclPattern.test(code)) {
        code = code.replace(fullMatch, `;(${rowsVar} as any).__status = 200; return ${rowsVar}`)
        fixes.push(`${file.path}: 擴展 wrapper { records: ${rowsVar} } → bare Array`)
        modified = true
      }
    }

    // Rule 1.5: 通用 wrapper 偵測 — return { anyKey: rows } 其中 rows 是 sql 查詢或 .map 結果
    const genericWrapperPattern = /return\s*\{\s*(\w+)\s*:\s*(\w+)\s*\}/g
    let genericMatch: RegExpExecArray | null
    while ((genericMatch = genericWrapperPattern.exec(code)) !== null) {
      const key = genericMatch[1]
      const rowsVar = genericMatch[2]
      if (['success', 'error', 'message', 'status', '__status', 'statusCode'].includes(key)) continue
      const varDecl = new RegExp(`(?:const|let)\\s+${rowsVar}\\s*=\\s*(?:await\\s+sql|.*\\.map)`)
      if (varDecl.test(code)) {
        code = code.replace(genericMatch[0], `;(${rowsVar} as any).__status = 200; return ${rowsVar}`)
        fixes.push(`${file.path}: 通用 wrapper { ${key}: ${rowsVar} } → bare Array`)
        modified = true
      }
    }

    // Rule 1.8: 列表查詢分支中的篩選參數不應 throw（前端初始載入可能不傳）
    // Pattern: 在含「列表」/「全部」的 dispatch 分支中，if (!input.xxx) throw → 移除 throw，改預設值
    const listThrowPattern = /if\s*\(\s*!input\.(\w+)\s*(?:\|\|[^)]+)?\)\s*\{?\s*throw\s+new\s+Error\s*\([^)]*(?:篩選|filter|排序|order|sort)[^)]*\)\s*\}?/g
    let listThrowMatch: RegExpExecArray | null
    while ((listThrowMatch = listThrowPattern.exec(code)) !== null) {
      const paramName = listThrowMatch[1]
      if (['filter', 'status', 'orderBy', 'sortBy', 'sort', 'order'].includes(paramName)) {
        code = code.replace(listThrowMatch[0], '')
        fixes.push(`${file.path}: 移除列表篩選參數 ${paramName} 的 throw（改為選填）`)
        modified = true
      }
    }

    // Rule 1.9: 日期驗證不應比較 NOW() — 防止 BDD 測試數據被拒
    // Pattern: new Date(input.dueDate) < new Date() → 移除（BDD 測試可能用歷史日期如 2025-12-31）
    const nowDateValidation = /if\s*\([^)]*(?:input\.(?:dueDate|deadline|endDate|expiresAt)|new\s+Date\s*\(\s*input\.(?:dueDate|deadline|endDate|expiresAt)\s*\))\s*(?:<|>)=?\s*(?:new\s+Date\s*\(\s*\)|Date\.now\(\))[^{]*\{?\s*\n?\s*throw\s+new\s+Error\s*\([^)]*\)\s*\}?/g
    if (nowDateValidation.test(code)) {
      code = code.replace(nowDateValidation, '/* 日期驗證已移除：避免與 BDD 測試數據衝突 */')
      fixes.push(`${file.path}: 移除 dueDate < NOW() 驗證（BDD 測試可能用歷史日期）`)
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
  keywords: string[]        // op === 'XXX' 或 op.includes('XXX') 的所有關鍵字
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

    // 偵測 if/else if (op === '...' 或 op.includes('...'))
    const branchMatch = trimmed.match(/^(?:}\s*else\s+)?if\s*\(/)
    if (branchMatch && (trimmed.includes('op ===') || trimmed.includes('op.includes'))) {
      // 提取所有 op === '...' 或 op.includes('...') 關鍵字
      const keywords: string[] = []
      for (const m of trimmed.matchAll(/op\s*===\s*['"]([^'"]+)['"]/g)) {
        keywords.push(m[1])
      }
      for (const m of trimmed.matchAll(/op\.includes\(['"]([^'"]+)['"]\)/g)) {
        if (!keywords.includes(m[1])) keywords.push(m[1])
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
// Illustrative default summaries for the `generateSafeSummary()` fast path.
// These are the "first guess" when we have to repair a frontend _stepSummary. If this
// guess doesn't match any real branch keyword, the caller falls back to the actual
// `correctBranch.keywords[0]` (see validateAndFixActionCalls L3661-3663), which keeps
// legacy Chinese Actions working. So these values only need to cover the common-case
// English vocabulary — they do not need to match every historical Action.
const STANDARD_SUMMARIES = {
  list: 'List Items',
  query: 'Get Item',
  create: 'Create Item',
  update: 'Update Item',
  delete: 'Delete Item',
} as const

// Keyword lists — both Chinese (legacy / backward compat) and English (new standard).
// 匹配使用 includes() 會對英文單詞做子字串比對，所以英文 keyword 用帶空白或 PascalCase 的完整詞
// 防誤傷策略：尾隨空白（`'List '`）避免 match `'listing'`；大寫開頭（`'Get '`）配合空白避免 match `'forget '`
const LIST_KEYWORDS = ['列表', '全部', 'List ', 'list ', ' all ', 'All ', 'Index ', 'index ', 'Collection', 'collection']
const QUERY_KEYWORDS = ['查詢', '詳情', '取得', 'Query', 'query', 'Get ', 'get ', 'Fetch', 'fetch', 'Search', 'search', 'View', 'view ']
const CREATE_KEYWORDS = ['建立', '新增', '註冊', '加入', '添加', 'Create', 'create ', 'Add ', 'add ', 'Register', 'register', 'Insert', 'insert']
const UPDATE_KEYWORDS = ['更新', '修改', '編輯', '重命名', '變更', '設定', 'Update', 'update', 'Edit', 'edit', 'Modify', 'modify', 'Change', 'change', 'Rename', 'rename', 'Set ', 'set ']
const DELETE_KEYWORDS = ['刪除', '移除', 'Delete', 'delete', 'Remove', 'remove', 'Destroy', 'destroy', 'Cancel', 'cancel']
const TOGGLE_KEYWORDS = ['切換', 'toggle', 'Toggle', 'Switch', 'switch', 'Enable', 'enable', 'Disable', 'disable']
const RESTORE_KEYWORDS = ['復原', '恢復', 'restore', 'Restore', 'Recover', 'recover', 'Undelete', 'undelete', '取消刪除', '取消軟刪除']

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

/**
 * Word-boundary aware keyword match for step summaries.
 * CJK keywords use plain `includes()` (no word boundaries in Chinese);
 * ASCII keywords use `\b` regex to avoid substring collisions
 * (e.g. 'list' in 'playlist', 'get' in 'forget', 'add' in 'address').
 */
export function stepSummaryMatches(text: string, keywords: readonly string[]): boolean {
  for (const kw of keywords) {
    const trimmed = kw.trim()
    if (!trimmed) continue
    // CJK: plain substring match
    if (/[\u4e00-\u9fff]/.test(trimmed)) {
      if (text.includes(trimmed)) return true
    } else {
      // ASCII: word-boundary match, case-insensitive
      const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      if (new RegExp(`\\b${escaped}\\b`, 'i').test(text)) return true
    }
  }
  return false
}

/** 從 _stepSummary 值和參數推斷意圖 */
function inferIntent(
  stepSummary: string,
  params: Set<string>,
): 'list' | 'query' | 'create' | 'update' | 'delete' | 'unknown' {
  const hasId = hasIdLikeParam(params)
  const businessParams = [...params].filter(p => p !== '_stepSummary' && p !== 'userId')

  // 明確的刪除/取消意圖
  if (stepSummaryMatches(stepSummary, DELETE_KEYWORDS)) return 'delete'

  // 明確的建立意圖
  if (stepSummaryMatches(stepSummary, CREATE_KEYWORDS) && !stepSummaryMatches(stepSummary, QUERY_KEYWORDS)) return 'create'

  // 明確的更新意圖
  if (stepSummaryMatches(stepSummary, UPDATE_KEYWORDS)) return 'update'

  // 明確的列表意圖
  if (stepSummaryMatches(stepSummary, LIST_KEYWORDS)) return 'list'

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
  return STANDARD_SUMMARIES[intent as keyof typeof STANDARD_SUMMARIES] || 'List Items'
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
 * 這些值是 action 代碼的 `if (op === 'xxx')` 必須精確匹配的
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
 * L7 helper：strip BDD When 步驟的 Actor prefix（兼容有/無括號）
 * 用於 extractSubOperations 的 summary 後處理，兜底 regex 沒抓到的邊界 case
 *
 * 範例：
 *   `(UID="$Store.id") 查看銷售報表` → `查看銷售報表`
 *   `UID="$Store.id" 查看銷售報表` → `查看銷售報表`（無括號，LLM 常寫的版本）
 *   `(No Actor) 建立訂單` → `建立訂單`
 *   `No Actor 建立訂單` → `建立訂單`
 *   `查看銷售報表` → `查看銷售報表`（無 Actor，原樣返回）
 */
export function cleanSubOpSummary(rawSummary: string): string {
  return rawSummary
    .replace(/^\s*\((?:No Actor|UID="[^"]*")\)\s*/i, '')   // 帶括號
    .replace(/^\s*UID\s*=\s*"[^"]*"\s+/i, '')              // 無括號 UID
    .replace(/^\s*No Actor\s+/i, '')                        // 無括號 No Actor
    .trim()
}

/**
 * L7 helper：把任意字串 sanitize 成合法的 JS 識別符片段
 * 移除所有非「中文 / 字母 / 數字」的字符（保留中文支援 toPascalCase 的中文 handler 名）
 *
 * 範例：
 *   `UID="$store.id" 查看銷售報表` → `UIDstoreid查看銷售報表`
 *   `查看銷售報表` → `查看銷售報表`（原樣）
 *   `Foo Bar Baz!` → `FooBarBaz`
 */
export function sanitizeForJsIdentifier(str: string): string {
  // 保留：CJK 統一漢字、CJK 擴展 A、半形字母數字、空白（給 toPascalCase 切詞用）
  return str.replace(/[^\u4e00-\u9fff\u3400-\u4dbfa-zA-Z0-9\s]/g, '')
}

/** L7：handleName 拼接專用，組合 sanitize + toPascalCase，保證輸出是合法 JS 識別符 */
export function buildHandleName(summary: string): string {
  return `handle${toPascalCase(sanitizeForJsIdentifier(summary))}`
}

/**
 * L8：偵測代碼是否含 git conflict marker
 * 場景：LLM 在 SEARCH/REPLACE diff 模式下偶爾把 marker 寫進 replace block，
 * apply 後 modifiedContent 會包含 `<<<<<<< / ======= / >>>>>>>`，TS parser 看不懂報錯
 *
 * 偵測規則：行首 7 個連續 `<` / `=` / `>` 才算（避免誤判 markdown 文字）
 */
export function hasConflictMarker(code: string): boolean {
  if (!code) return false
  return /(?:^|\n)(?:<{7}|={7}|>{7})(?=\s|\n|$)/.test(code)
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
3. **不要重新定義已存在的 import 或 helper 函數**（如 snakeToCamel、sql）。這些已經在檔案頂部定義，重複宣告會導致語法錯誤
4. 根據失敗的場景和 error message 推斷需要修改的邏輯
5. 只輸出修正後的函數本體（用 \`\`\`typescript\`\`\` 包裹），不要輸出 import 語句

## 子操作派發（常見錯誤！）
如果錯誤是 "不支援的操作類型" 或類似的派發問題，是因為函數用了 input.action 來判斷子操作。
正確做法：使用 input._stepSummary（中文子操作名稱，如 "使用者註冊"、"建立節目"）來派發。
\`\`\`typescript
const op = input._stepSummary || ''
if (op === '使用者註冊') { ... }
else if (op === '使用者登入') { ... }
\`\`\`
不要用 input.action，只用 input._stepSummary 做 === 精確匹配（不要用 includes，防止子字串碰撞）。

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

## HTTP 回應錯誤診斷（重要！）
如果測試失敗訊息包含 "HTTP: 400" 或 "HTTP: 500"，說明 API 返回了錯誤。
檢查回應體中的 error 訊息（如 "所屬清單不存在"、"缺少必要參數"）：
- "XXX不存在" → 你的 SQL 查詢 WHERE 條件可能用錯欄位，或 FK 參照的 ID 欄位名稱不對
- "缺少XXX參數" → 你的函數沒從 input 中正確讀取該參數名稱
- "無效的XXX" → 你的參數驗證邏輯有誤

## VAR 解析失敗（不是你的代碼問題！）
如果測試失敗訊息包含 "VAR 解析失敗"，這是**測試框架無法找到變數**，不是你的函數有 bug。
此時不要修改函數邏輯 — 直接原樣輸出現有代碼。

## 軟刪除 deleted_at（常見嚴重 Bug！）
如果 Schema DDL 中沒有定義 deleted_at 或 is_deleted 欄位，
**絕對不要**在 SQL 查詢中加 \`WHERE deleted_at IS NULL\` 或 \`AND deleted_at IS NULL\`。
先閱讀 Schema DDL 確認欄位是否存在。不存在就不加，否則會觸發 "column does not exist" SQL 錯誤。

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

## 子操作分支順序
使用 op === '完整 summary' 精確匹配（不用 includes），所以不會有子字串碰撞問題。
每個分支用完整的 BDD summary 文字：
\`\`\`typescript
if (op === '取消訂閱') { ... }
else if (op === '查詢訂閱列表') {
  const rows = await sql\`SELECT ... FROM table WHERE user_id = \${userId}\`
  ;(rows as any).__status = 200; return rows  // 列表查詢：設 __status 確保 route handler 用 200
}
else if (op === '訂閱節目') { ... }
\`\`\`

## 查詢列表操作（常見錯誤！）
查詢「使用者的」訂閱列表/播放記錄等，只需要 userId。
不要要求 showId/episodeId 等額外參數。
\`\`\`typescript
if (op === '查詢訂閱列表') {
  const userId = input.userId
  const rows = await sql\`SELECT ... FROM table WHERE user_id = \${userId}\`
  ;(rows as any).__status = 200; return rows  // 列表查詢：設 __status 確保 route handler 用 200
}
\`\`\`

## 單一設定表操作（常見錯誤！）
如果表只有一筆記錄（如 channel_config，id 固定為 1），查詢就是 SELECT * WHERE id = 1，
更新就是 UPDATE ... WHERE id = 1。不要要求 action/type 參數。
直接用 _stepSummary 精確匹配判斷是查詢還是更新：
\`\`\`typescript
if (op === '查詢頻道設定') {
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
if (op === '使用者登出') {
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
→ 只有 Schema 有 deleted_at 欄位時才加 deleted_at IS NULL

## 軟刪除 vs 硬刪除（常見錯誤！）
**先看 Schema DDL 是否有 deleted_at 欄位！**
如果 Schema **有** deleted_at：
→ 刪除操作用 UPDATE SET deleted_at = NOW()
→ 查詢操作加 WHERE deleted_at IS NULL
如果 Schema **沒有** deleted_at：
→ 刪除操作用 DELETE FROM（如果 FK 有 ON DELETE CASCADE 會自動刪子記錄）
→ 查詢操作**不要**加 deleted_at（否則 SQL 報 "column does not exist"）

## camelCase 欄位名稱（常見錯誤！）
如果錯誤含 "值不匹配" 且 "實際:" 後面是空的（不是值錯，是欄位找不到）：
→ PostgreSQL RETURNING * 回傳 snake_case（category_id），BDD 期望 camelCase（categoryId）
→ 解法 1: SQL AS 別名：SELECT category_id as "categoryId", created_at as "createdAt"
→ 解法 2: 回傳前轉換：key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
→ 常見欄位：category_id→categoryId, created_at→createdAt, updated_at→updatedAt, transaction_date→transactionDate, device_id→deviceId, list_id→listId, is_completed→isCompleted, due_date→dueDate

## 匯出/列表查詢必須回傳 bare Array（常見嚴重錯誤！）
如果錯誤含 "id 值不匹配" 且 "實際:" 後面是空的，且是匯出/列表操作：
→ 回傳格式**必須**是 bare Array：\`return rows\`（在 Array 上設 __status）
→ **絕對禁止**包成 Object：\`return { records: rows }\` 或 \`return { items: rows }\` 或 \`return { data: rows, recordCount: N }\`
→ 正確做法：
\`\`\`typescript
;(rows as any).__status = 200
return rows  // 直接回傳 Array，不要包成 Object
\`\`\`

## 級聯操作（常見錯誤！）
如果錯誤含 "找不到符合條件的" 或 "categoryId" expect 不等於 null 但 actual 是 null：
→ 刪除被 FK 引用的實體時，必須查找「未分類」預設實體的 ID，用它替換（不是設 NULL）
→ 用 sql.begin() transaction 包裹：(1) 軟刪除父實體 (2) 查找未分類類別 ID (3) 更新子記錄 FK 為該 ID
→ 例如：
\`\`\`typescript
const result = await sql.begin(async (tx) => {
  const [parent] = await tx\`UPDATE categories SET deleted_at = NOW() WHERE id = \${categoryId} RETURNING *\`
  const [defaultCat] = await tx\`SELECT id FROM categories WHERE name = '未分類' AND device_id = \${deviceId} LIMIT 1\`
  await tx\`UPDATE transactions SET category_id = \${defaultCat?.id || null} WHERE category_id = \${categoryId}\`
  return parent
})
\`\`\`

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
4. Entity Mapping（如有）→ entity 中文名稱對應的實際 DB table 名

## 狀態更新操作（取消/確認/完成 — 常見嚴重錯誤！）
如果測試失敗是 "status 值不匹配（預期: cancelled 實際: pending）" 或類似的狀態未更新：
→ 你的代碼**沒有執行 UPDATE**，只做了 SELECT 或 throw
→ 正確做法：必須有 \`UPDATE table SET status = 'cancelled', cancelled_at = NOW() WHERE id = \${id} RETURNING *\`
→ 不是 SELECT 後 return，是 UPDATE 後 RETURNING
→ 如果回傳的 status 仍是舊值，100% 是因為你 SELECT 了沒 UPDATE

## 自定義 throw 錯誤（如「沒有可用的美容師」— 常見嚴重錯誤！）
如果測試失敗且 HTTP 400 的 error 是你自己 throw 的中文訊息（如 "沒有可用的美容師"、"服務項目不存在"）：
→ 問題出在你的**查詢條件太嚴格**，不是 DB 沒資料
→ entity_setup 已經插入了完整的測試資料（美容師、班表、服務關聯）
→ 仔細檢查你的 SQL WHERE 條件是否與 entity_setup 的資料匹配
→ 常見錯誤：JOIN 條件用錯欄位名（beautician_id vs beautician_services.beautician_id）
→ 常見錯誤：時間比較格式不匹配（'10:00:00' vs '10:00' vs TIMESTAMPTZ）
→ 常見錯誤：多餘的 is_active = true 檢查（entity_setup 可能沒設 is_active）`

// ============================================================
// 錯誤根因分類器（零 LLM — 純正則）
// ============================================================

export type FailureRootCause =
  | 'dispatch_mismatch'    // _stepSummary dispatch 不匹配
  | 'missing_column'       // SQL column 不存在
  | 'wrong_status'         // HTTP status code 不對
  | 'field_naming'         // 回應欄位 camelCase/snake_case 不匹配
  | 'sql_error'            // SQL 語法錯誤
  | 'auth_check'           // 多餘的 auth 檢查
  | 'var_resolution'       // VAR 系統解析失敗（Feature 問題，不是代碼問題）
  | 'fk_constraint'        // FK 約束違反
  | 'spec_inconsistency'   // Feature 內部矛盾（scenario 名稱 vs DataTable 期望值衝突）
  | 'api_summary_mismatch' // Feature When summary 在 api-spec/actionsYml 找不到（修代碼絕對沒用）
  | 'step_parsing'         // Given/When/Then 步驟格式無法匹配 ISA instruction（Feature 語法問題，修代碼無效）
  | 'unknown'

/**
 * 從 scenario name 偵測「null 意圖」，配合 error 的 expect/actual 判斷是否為 spec 矛盾
 * 典型：scenario 名「應變為 null」+ expect:[UUID] + actual:[null] → spec 矛盾
 */
function detectSpecInconsistency(error: string, scenarioName?: string): boolean {
  if (!scenarioName) return false
  // 中英文 null-intent 並存
  const nullIntentInName = /應變為\s*null|應為\s*null|應清空|應清除|become\s*null|should\s+be\s+null|set\s+to\s+null|become\s+empty|clear(?:ed)?|unset|reset\s+to\s+null|nullified/i.test(scenarioName)
  if (!nullIntentInName) return false

  // error 格式: [entity.field] expect: [X], actual: [Y]
  const expectMatch = error.match(/expect:\s*\[(.+?)\]/i)
  const actualMatch = error.match(/actual:\s*\[(.+?)\]/i)
  if (!expectMatch || !actualMatch) return false

  const expect = expectMatch[1].trim().toLowerCase()
  const actual = actualMatch[1].trim().toLowerCase()

  // Scenario 名說 null，actual 是 null（符合描述），但 expect 非 null → DataTable 寫錯
  if (actual === 'null' && expect !== 'null' && expect !== 'undefined' && expect.length > 0) {
    return true
  }
  return false
}

export function classifyFailureRootCause(error: string, scenarioName?: string): FailureRootCause {
  if (!error) return 'unknown'
  const e = error.toLowerCase()

  // Step parsing failure（優先級最高：修代碼絕對沒用，Feature 步驟語法錯誤）
  // 典型：`準備一個{顧客}` 花括號語法 → SpecFormula regex 不匹配
  if (e.includes('步驟無法匹配') || e.includes('step could not be matched')) {
    return 'step_parsing'
  }

  // API summary mismatch 偵測（修代碼絕對沒用，必須修 Feature/actionsYml summary）
  // 典型：Feature When summary "新增一筆收支記錄" 在 api-spec 找不到 → 所有 scenario 100% 失敗
  if (e.includes('找不到 api 操作') || e.includes('api operation not found')) {
    return 'api_summary_mismatch'
  }

  // Spec 內部矛盾偵測（scenario 名稱 vs DataTable 矛盾，修代碼無效）
  if (detectSpecInconsistency(error, scenarioName)) {
    return 'spec_inconsistency'
  }

  // dispatch mismatch
  if (e.includes('不支援的操作') || e.includes('unsupported operation') || e.includes('不支援的操作類型')) {
    return 'dispatch_mismatch'
  }

  // VAR resolution failure（Feature 問題，不要修代碼）
  if (e.includes('var 解析失敗') || e.includes('無法解析') || e.includes('cannot resolve') || e.includes('failed to resolve var') || e.includes('variable not declared')) {
    return 'var_resolution'
  }

  // missing column
  if (e.includes('column') && (e.includes('does not exist') || e.includes('不存在'))) {
    return 'missing_column'
  }

  // wrong status
  if (e.includes('http 狀態碼不匹配') || e.includes('status code') || /預期\s*\d+/.test(e) || /expected\s+\d{3}/i.test(e) || e.includes('status mismatch')) {
    return 'wrong_status'
  }

  // field naming
  if (
    e.includes('值不匹配') ||
    (e.includes('欄位') && e.includes('不存在')) ||
    (e.includes('field') && e.includes('not found')) ||
    e.includes('value mismatch') ||
    (e.includes('column') && e.includes('not found in response')) ||
    /response.*field.*(missing|mismatch)/i.test(e)
  ) {
    return 'field_naming'
  }

  // auth check（多餘的認證導致 401/403）
  if (e.includes('unauthorized') || e.includes('forbidden') || e.includes('jwt') || e.includes('token')) {
    return 'auth_check'
  }

  // FK constraint
  if (e.includes('foreign key') || e.includes('violates foreign key') || e.includes('fk_')) {
    return 'fk_constraint'
  }

  // SQL syntax error
  if (e.includes('syntax error') || e.includes('sql') || e.includes('relation') || e.includes('invalid input syntax')) {
    return 'sql_error'
  }

  return 'unknown'
}

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
  // === Extended Thinking: 修復路徑用深度推理 ===
  const env = getEnv()
  const thinkingConfig = env.ENABLE_EXTENDED_THINKING
    ? { type: 'enabled' as const, budget_tokens: env.EXTENDED_THINKING_BUDGET }
    : undefined

  // === 根因分類：判斷是否需要 LLM 修復 ===
  const primaryError = failedScenarios[0]?.error || ''
  const primaryScenarioName = failedScenarios[0]?.scenarioName
  const rootCause = classifyFailureRootCause(primaryError, primaryScenarioName)

  recordTelemetry({
    skillName: 'coder',
    eventType: 'coder_test_fail',
    patternKey: rootCause,
    outcome: 'failed',
    rootCauseCategory: rootCause,
    phase: 'coder_green_phase',
    errorType: 'test_fail',
    severity: 'critical',
    userId: trackingContext?.userId,
    conversationId: trackingContext?.conversationId,
    payload: { actionName, scenarioCount: failedScenarios.length, errorSummary: truncateFeedback(primaryError) },
  }).catch(() => {})

  if (rootCause === 'var_resolution') {
    // VAR 解析失敗是 Feature 問題，修代碼沒用
    logger.info({ actionName, rootCause }, 'fixFailingAction: VAR 解析失敗，跳過代碼修復（Feature 問題）')
    return currentCode
  }

  if (rootCause === 'spec_inconsistency') {
    // Feature 內部矛盾（scenario 名稱 vs DataTable 衝突）— 修代碼永遠沒用，LLM 會在兩個方向擺動
    logger.warn({ actionName, rootCause, scenarioName: primaryScenarioName }, 'fixFailingAction: Feature 內部矛盾，跳過代碼修復（需用戶確認意圖）')
    return currentCode
  }

  if (rootCause === 'api_summary_mismatch') {
    // Feature When summary 在 api-spec 找不到 — 修 handler 永遠沒用，必須修 Feature/actionsYml 對齊
    logger.warn({ actionName, rootCause, scenarioName: primaryScenarioName }, 'fixFailingAction: api summary 不匹配（Feature ↔ actionsYml），跳過代碼修復')
    return currentCode
  }

  if (rootCause === 'auth_check') {
    // 多餘的 auth 檢查 — 直接用 removeAuthChecks 而不是 LLM
    logger.info({ actionName, rootCause }, 'fixFailingAction: auth 問題，直接移除 auth 檢查')
    return removeAuthChecks(currentCode)
  }

  // === 零 LLM 機械修復（DETERMINISTIC_FIX_V1=true 時啟用） ===
  // 三類 rootCause 有確定性修復路徑，比 LLM 更快、更穩、省 token
  if (env.DETERMINISTIC_FIX_V1 && (rootCause === 'missing_column' || rootCause === 'wrong_status' || rootCause === 'field_naming')) {
    try {
      const deterministic = await tryDeterministicFix(rootCause, currentCode, {
        actionName,
        schemaSql,
        error: primaryError,
        featureContent,
        trackingContext,
      })
      if (deterministic) {
        logger.info({ actionName, rootCause }, '零 LLM 機械修復成功，跳過 LLM 修復')
        return deterministic
      }
      // 修復失敗 → 繼續走下方 LLM 路徑（帶 harnessHint），不 return
      logger.info({ actionName, rootCause }, '零 LLM 修復未命中，fallback 到 LLM 修復')
    } catch (detErr) {
      logger.warn({ err: detErr, actionName, rootCause }, '零 LLM 修復例外，fallback 到 LLM')
    }
  }

  // === Per-SubOp 精準修復：偵測組裝式程式碼結構 ===
  const handleFuncRegex = new RegExp(`async function (handle${ID_PATTERN})\\s*\\(`, 'g')
  const handleFuncMatches = [...currentCode.matchAll(handleFuncRegex)]
  if (handleFuncMatches.length > 1) {
    // 從 dispatch 區塊提取 summary → handleFunc 映射
    const dispatchMap = new Map<string, string>()
    // 支援 op === '...' 和 op.includes('...')
    const dispatchRegexExact = new RegExp(`op\\s*===\\s*'([^']+)'\\)\\s*return\\s+(handle${ID_PATTERN})`, 'g')
    const dispatchRegexIncludes = new RegExp(`op\\.includes\\('([^']+)'\\)\\s*\\)\\s*return\\s+(handle${ID_PATTERN})`, 'g')
    let dm: RegExpExecArray | null
    while ((dm = dispatchRegexExact.exec(currentCode)) !== null) {
      dispatchMap.set(dm[1], dm[2])
    }
    while ((dm = dispatchRegexIncludes.exec(currentCode)) !== null) {
      if (!dispatchMap.has(dm[1])) dispatchMap.set(dm[1], dm[2])
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
          // 提取 imports 區塊供 Per-SubOp LLM 看到（避免 sql is not defined）
          const importsBlock = currentCode.split('\n').filter(l => l.startsWith('import ')).join('\n')
          // 提取相關 feature content 供 LLM 看到測試期望
          const featureHint = featureContent ? `\n## BDD 規格（測試期望）\n\`\`\`gherkin\n${featureContent.substring(0, 4000)}\n\`\`\`\n` : ''

          // Harness 修復提示：把已分類的 rootCause 轉成結構化修復路徑
          const perSubOpRootCause = classifyFailureRootCause(scenarios[0]?.error || '', scenarios[0]?.scenarioName)
          const enrichedSubOp = enrichError(scenarios[0]?.error || '', perSubOpRootCause, { phase: 'coder_green', actionName })
          const harnessHintBlock = formatHintForPrompt(enrichedSubOp)

          const fixedFunc = await callClaude(FIX_SYSTEM_PROMPT, `## 檔案 import 區塊（已存在，不要重複宣告）
\`\`\`typescript
${importsBlock}
\`\`\`

## 當前子操作函數（${funcName}）
\`\`\`typescript
${funcBody}
\`\`\`
${featureHint}${harnessHintBlock}
## 測試失敗
${subFixDetails}

## SQL Schema
\`\`\`sql
${schemaSql}
\`\`\`
${entityMapping ? `\n## Entity Mapping\n\`\`\`yaml\n${entityMapping}\n\`\`\`\n` : ''}

只修復這個子操作函數，不要改函數名稱（${funcName}）。仔細看 BDD 規格的 Background（資料結構）和 Then（預期欄位）。輸出修正後的完整函數。`,
            { maxTokens: 4096, temperature: 0.1, thinking: thinkingConfig }, trackingContext)

          if (fixedFunc.success && fixedFunc.content) {
            let newFunc = extractCodeFromResponse(fixedFunc.content)
            if (newFunc && newFunc.length > 50) {
              newFunc = removeAuthChecks(newFunc)
              newFunc = fixMySqlSyntax(newFunc)
              // 確保函數名不被 LLM 改掉（Unicode-aware）
              if (!newFunc.includes(`function ${funcName}`)) {
                newFunc = newFunc.replace(new RegExp(`(?:async\\s+)?function\\s+${ID_PATTERN}`), `async function ${funcName}`)
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

      recordTelemetry({
        skillName: 'coder', eventType: 'coder_test_fix_success', patternKey: rootCause,
        outcome: 'repaired', rootCauseCategory: rootCause, phase: 'coder_green_phase',
        userId: trackingContext?.userId, conversationId: trackingContext?.conversationId,
        payload: { actionName, fixMethod: 'per_subop' },
      }).catch(() => {})
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

  const featureSection = featureContent
    ? `\n## BDD 規格（測試期望 — 看清楚 Background 的資料準備和 Then 的預期回應欄位）\n\`\`\`gherkin\n${featureContent.substring(0, 8000)}\n\`\`\`\n`
    : ''

  // Harness 修復提示：主修復路徑也注入結構化修復方向
  const enrichedMain = enrichError(primaryError, rootCause, { phase: 'coder_green', actionName })
  const harnessHintSection = formatHintForPrompt(enrichedMain)

  const userMessage = `## 當前代碼（${actionName}）
\`\`\`typescript
${currentCode}
\`\`\`
${featureSection}${harnessHintSection}
## 測試失敗
${failureDetails}

## SQL Schema
\`\`\`sql
${schemaSql}
\`\`\`
${entityMapping ? `\n## Entity Mapping\n\`\`\`yaml\n${entityMapping}\n\`\`\`\n` : ''}
請修復代碼使所有測試通過。仔細閱讀 BDD 規格的 Background（了解測試資料）和 Then（了解預期回應欄位），確保你的 SQL 查詢回傳的是正確的表和欄位。輸出完整的修正後檔案。`

  const response = await callClaude(FIX_SYSTEM_PROMPT, userMessage, { maxTokens: 8192, temperature: 0.1, thinking: thinkingConfig }, trackingContext)

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

  recordTelemetry({
    skillName: 'coder', eventType: 'coder_test_fix_success', patternKey: rootCause,
    outcome: 'repaired', rootCauseCategory: rootCause, phase: 'coder_green_phase',
    userId: trackingContext?.userId, conversationId: trackingContext?.conversationId,
    payload: { actionName, fixMethod: 'full_llm' },
  }).catch(() => {})
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
