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

function buildActionSystemPrompt(): string {
  return `你是一位 Next.js + PostgreSQL 後端工程師。你的任務是根據 Action 定義實作一個純邏輯函數。

## 技術約束
- 使用 @neondatabase/serverless 的 neon SQL tagged template
- import { sql } from '@/lib/db'
- 函數必須 export + async
- 錯誤處理：驗證失敗時 throw new Error(中文錯誤描述)
- 回傳型別明確（不用 any）
- SQL 查詢必須使用 parameterized query（$1, $2...），嚴禁字串拼接 SQL
- 所有日期用 ISO 8601 字串
- ID 欄位使用 UUID。如果輸入有 ID 值（如 input.episodeId）→ 用它；沒有才用 gen_random_uuid()
- 密碼雜湊用 bcryptjs（import bcrypt from 'bcryptjs'），JWT 用 jsonwebtoken
- 不要做認證/登入檢查（如檢查 userId 是否存在、要求 token）。呼叫者（Server Action）已處理認證並注入 userId，函數只做業務邏輯
- 前置（狀態）規則中的「使用者必須已登入」由測試框架的 UID actor 處理，函數內不需驗證
- 如果 schema 有 email_verified_at 欄位但專案沒有實際的郵件發送機制（如 SendGrid/Resend 等第三方服務），則：註冊時 email_verified_at 設為 NOW()（自動通過驗證），登入時不檢查 email_verified_at。這確保應用開箱即用，未來接入真實郵件服務時再改為 NULL + 驗證流程
- 如果測試傳 email 作為使用者識別：先用 input.userId（如果存在），否則用 email 查 users 表取得 userId。不要把 userId 當必要輸入參數驗證
- 登出操作：直接 return { __status: 200, message: '登出成功' }。不需驗證 token/session 是否有效

## 認證欄位
- Server Action 層會自動從 cookie 注入 userId，非登入操作不用擔心認證
- **不要在 lib/actions 裡 import 'next/headers' 或操作 cookie** — 這由上層 Server Action 處理
- 登入/註冊成功時，回傳物件**必須包含 \`userId\` 欄位**（值為用戶 UUID），欄位名**必須是 \`userId\`**（不要用 createdUserId/user_id 等）
- 登出操作：直接 return，不需操作 cookie
- ON CONFLICT 語法：使用 PostgreSQL 的 ON CONFLICT (id) DO UPDATE SET col = EXCLUDED.col，不要用 MySQL 的 ON DUPLICATE KEY UPDATE

## 子操作派發（重要！）
一個 Action 可能包含多個子操作（如 manage_auth 包含 註冊/登入/登出）。
呼叫時 input 會包含 _stepSummary 欄位，值是中文子操作名稱（如 "使用者註冊"、"使用者登入"）。
必須用 input._stepSummary 來判斷要執行哪個子操作：
\`\`\`typescript
const op = input._stepSummary || ''
if (op.includes('註冊')) { /* 註冊邏輯 */ }
else if (op.includes('登入')) { /* 登入邏輯 */ }
else if (op.includes('登出')) { /* 登出邏輯 */ }
else { throw new Error('不支援的操作') }
\`\`\`
不要依賴 input.action 或其他自定義派發欄位，只用 _stepSummary。

## 必須包含的標準操作（重要！）

每個 Action 必須根據管理的 entity 自動包含以下操作分支，**即使 BDD 規則沒有明確定義**：

1. **列表查詢**：\`if (op.includes('列表') || op.includes('全部'))\` — SELECT 全部記錄（可選 WHERE 過濾），**不要求 ID 參數**。前端頁面載入時必定需要此操作。
2. **單筆查詢**：\`else if (op.includes('查詢') || op.includes('詳情'))\` — 需要 entity 主鍵 ID
3. **建立**：\`else if (op.includes('建立') || op.includes('新增') || op.includes('註冊'))\` — INSERT
4. **更新**：\`else if (op.includes('更新') || op.includes('修改') || op.includes('編輯'))\` — UPDATE by ID
5. **刪除**：\`else if (op.includes('刪除') || op.includes('移除'))\` — DELETE by ID
6. **ID 參數驗證**：單筆查詢/更新/刪除操作必須在第一行驗證 ID 存在，缺失時拋錯：
\`\`\`typescript
const entityId = input.id || input.xxxId  // 匹配 schema 主鍵欄位名
if (!entityId) throw new Error('缺少 ID 參數')
\`\`\`

**判斷順序很重要**：先判斷「列表」再判斷「查詢」，因為「查詢列表」同時包含兩個關鍵字。

每個分支的 _stepSummary 關鍵字**必須用上述括號中的中文詞**，不要用其他同義詞（如不要用「檢索」代替「查詢」）。
前端改寫時會用這些精確的關鍵字，不一致會導致 500 error。

## Array/Batch 操作（重要！）

如果 action 需要接收多個 ID（如拖曳排序、批次刪除、批次操作）：
1. 輸入欄位會是**逗號分隔字串**（如 "uuid-1,uuid-2,uuid-3"），必須自行 split：
   \`const ids = (input.orderedItemIds || '').split(',').map(s => s.trim()).filter(Boolean)\`
2. PostgreSQL array 查詢用 ANY，不用 IN：
   \`await sql\`SELECT * FROM todos WHERE id = ANY(\${ids}::uuid[])\`\`
3. 批次 UPDATE 保留順序（拖曳排序）：逐筆 UPDATE
   \`\`\`typescript
   for (let i = 0; i < ids.length; i++) {
     await sql\`UPDATE todos SET sort_order = \${i + 1} WHERE id = \${ids[i]}\`
   }
   \`\`\`
4. 如果 input 欄位名含 Ids/Items/List（複數），一律先 split(',')

## Multi-table JOIN 查詢

列表查詢如果需要關聯資料（如訂單列表含用戶名、商品名），用 JOIN：
\`\`\`typescript
const rows = await sql\`
  SELECT o.*, u.name as user_name, p.title as product_title
  FROM orders o
  JOIN users u ON o.user_id = u.id
  JOIN products p ON o.product_id = p.id
  WHERE o.deleted_at IS NULL
  ORDER BY o.created_at DESC
\`
\`\`\`

## Transaction（多表原子操作）

如果一個操作需要更新多張表（如建立訂單同時扣庫存），用 sql.begin：
\`\`\`typescript
const result = await sql.begin(async (tx) => {
  const [order] = await tx\`INSERT INTO orders (...) VALUES (...) RETURNING *\`
  await tx\`UPDATE products SET stock = stock - \${qty} WHERE id = \${productId}\`
  return order
})
\`\`\`

## 程式碼結構
\`\`\`typescript
import { sql } from '@/lib/db'

// 型別定義
interface XxxInput { _stepSummary?: string; ... }
interface XxxOutput { __status?: number; ... }

export async function actionName(input: XxxInput): Promise<XxxOutput> {
  const op = input._stepSummary || ''
  // 根據 op 判斷子操作
  // 1. 前置（參數）驗證 → 來自 rules
  // 2. 前置（狀態）檢查 → DB 查詢
  // 3. 核心邏輯 → INSERT/UPDATE/DELETE
  // 4. 後置（回應）→ return { __status: 201, ...data }
}
\`\`\`

## HTTP Status Code
成功回應時，必須在返回物件中加入 __status 欄位表示 HTTP 狀態碼。
- 建立/新增操作：__status: 201
- 查詢/列表操作：__status: 200
- 更新操作：__status: 200
- 刪除操作：__status: 200
- 登入/登出等操作：__status: 200
例如：return { __status: 201, email, role }

## Response 回傳規則（重要！）
每種操作必須回傳完整資料，不能只回傳 { __status: 200 }：
- **建立操作（INSERT）**：\`const [row] = await sql\`INSERT INTO ... RETURNING *\`; return { __status: 201, ...row }\`
- **更新操作（UPDATE）**：\`const [row] = await sql\`UPDATE ... RETURNING *\`; return { __status: 200, ...row }\`（**必須 RETURNING *** 並展開到回傳物件中）
- **刪除操作（DELETE）**：\`return { __status: 200, message: '刪除成功' }\`
- **列表查詢**：\`const rows = await sql\`SELECT ...\`; (rows as any).__status = 200; return rows\`（直接回傳 pg 陣列，在陣列上設 __status 確保 route handler 用 200）
- **單筆查詢**：\`return { __status: 200, ...row }\`
- **批次操作（排序/拖曳）**：逐筆 UPDATE 後 \`return { __status: 200, success: true }\`

## 日期欄位處理
PostgreSQL DATE/TIMESTAMP 欄位從 pg driver 取出是 JS Date 物件，回傳前必須轉成字串：
- DATE 欄位：\`row.due_date instanceof Date ? row.due_date.toISOString().split('T')[0] : row.due_date\`
- TIMESTAMP 欄位：\`row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at\`
- **絕不能直接回傳 Date 物件**（JSON 序列化後會變成 "Wed Dec 31 2025..." 格式而非 ISO）

## 輸出
只輸出 TypeScript 代碼，不要任何解釋或 markdown 包裹。`
}

function buildActionUserPrompt(
  action: ActionEntry,
  schemaSql: string,
  entityMapping: string,
  types: Record<string, unknown>,
  requiredResponseFields?: string[],
  stepSummaries?: string[]
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
${typesText}${responseFieldsText}${stepSummariesText}

請根據以上定義實作函數。
函數名必須使用 camelCase：export async function ${toCamelCase(action.name)}(input: ${toPascalCase(action.name)}Input)
檔名：lib/actions/${toKebabCase(action.name)}.ts`
}

export async function generateActionFunction(
  action: ActionEntry,
  ctx: { schemaSql: string; entityMapping: string; types: Record<string, unknown>; features?: Array<{ actionName: string; content: string }> },
  trackingContext?: { userId?: string; conversationId?: string }
): Promise<GeneratedComponent> {
  const systemPrompt = buildActionSystemPrompt()
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
  const userPrompt = buildActionUserPrompt(action, ctx.schemaSql, ctx.entityMapping, ctx.types, requiredResponseFields, stepSummaries)

  // 複雜 action（多規則）自動獲得更多 token
  const ruleCount = (action.rules || []).length
  const actionMaxTokens = Math.max(4096, Math.min(4096 + ruleCount * 512, 8192))
  const result = await callClaude(systemPrompt, userPrompt, { maxTokens: actionMaxTokens }, trackingContext)

  if (!result.success || !result.content) {
    throw new Error(`生成 ${action.name} 失敗：${result.error}`)
  }

  let code = extractCodeFromResponse(result.content)

  // 移除 LLM 偶爾加入的認證檢查
  code = code.replace(/if\s*\(\s*!(?:input\.)?userId\s*\)\s*\{[^}]*(?:throw|return)[^}]*\}/g, '')
  code = code.replace(/if\s*\(\s*!(?:input\.)?userId\s*\)\s*(?:throw|return)[^\n]*/g, '')
  code = code.replace(/if\s*\([^)]*\)\s*\{?\s*throw\s+new\s+Error\s*\(\s*['"`][^'"`]*(?:必須已登入|認證|已過期|unauthorized|must.*log|未登入|操作者必須)[^'"`]*['"`]\s*\)\s*\}?/gi, '')
  code = code.replace(/if\s*\(\s*!(?:input\.)?(?:token|session|authToken)\s*\)\s*\{[^}]*(?:throw|return)[^}]*\}/g, '')
  code = code.replace(/if\s*\(\s*!(?:input\.)?(?:token|session|authToken)\s*\)\s*(?:throw|return)[^\n]*/g, '')

  // MySQL → PostgreSQL 語法修正
  code = code.replace(
    /ON\s+DUPLICATE\s+KEY\s+UPDATE\s+(.+?)(?=\s*`|;|\n|$)/gim,
    (_match: string, setCols: string) => {
      const pgCols = setCols.replace(/VALUES\s*\(\s*(\w+)\s*\)/gi, 'EXCLUDED.$1')
      return `ON CONFLICT (id) DO UPDATE SET ${pgCols}`
    }
  )

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
    const routeDir = meta.path
      .replace(/^\//, '')  // remove leading slash
      .replace(/:(\w+)/g, '[$1]')  // :id → [id]

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

export async function rewriteComponentForServerActions(
  component: GeneratedComponent,
  availableActions: { path: string; exports: string[] }[],
  actionImplementations?: { path: string; content: string }[],
  trackingContext?: { userId?: string; conversationId?: string }
): Promise<GeneratedComponent> {
  const systemPrompt = buildRewriteSystemPrompt()
  const userPrompt = buildRewriteUserPrompt(component, availableActions, actionImplementations)

  // 根據組件大小動態設定 max_tokens（1 token ≈ 3 字元，改寫後通常比原始稍長）
  const estimatedTokens = Math.ceil(component.content.length / 3) + 1024
  const maxTokens = Math.max(8192, Math.min(estimatedTokens, 32768))
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
→ 把 IN (\${array}) 改為 = ANY(\${array}::uuid[])`

/**
 * 用 LLM 修復失敗的 action 函數
 */
export async function fixFailingAction(
  actionName: string,
  currentCode: string,
  failedScenarios: Array<{ scenarioName: string; ruleName: string; error?: string }>,
  schemaSql: string,
  trackingContext?: { userId?: string; conversationId?: string }
): Promise<string> {
  const failureDetails = failedScenarios
    .map(s => {
      const label = s.ruleName ? `${s.ruleName} - ${s.scenarioName}` : s.scenarioName
      return `- ${label}\n  Error: ${s.error || 'unknown'}`
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
