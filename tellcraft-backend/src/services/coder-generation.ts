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

const sql = neon(process.env.DATABASE_URL!)

export { sql }
`,
    description: 'Neon PostgreSQL 資料庫連接',
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
- ID 欄位使用 UUID（gen_random_uuid()）
- 密碼雜湊用 bcryptjs（import bcrypt from 'bcryptjs'），JWT 用 jsonwebtoken
- 不要做認證/登入檢查（如檢查 userId 是否存在、要求 token）。呼叫者已處理認證，函數只做業務邏輯
- 前置（狀態）規則中的「使用者必須已登入」由測試框架的 UID actor 處理，函數內不需驗證

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

## 輸出
只輸出 TypeScript 代碼，不要任何解釋或 markdown 包裹。`
}

function buildActionUserPrompt(
  action: ActionEntry,
  schemaSql: string,
  entityMapping: string,
  types: Record<string, unknown>
): string {
  const rulesText = (action.rules || [])
    .map(r => `- [${r.type}] ${r.rule}`)
    .join('\n')

  const typesText = Object.keys(types).length > 0
    ? `\n## 型別參考\n${yaml.dump(types)}`
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
${typesText}

請根據以上定義實作函數。
函數名必須使用 camelCase：export async function ${toCamelCase(action.name)}(input: ${toPascalCase(action.name)}Input)
檔名：lib/actions/${toKebabCase(action.name)}.ts`
}

export async function generateActionFunction(
  action: ActionEntry,
  ctx: { schemaSql: string; entityMapping: string; types: Record<string, unknown> },
  trackingContext?: { userId?: string; conversationId?: string }
): Promise<GeneratedComponent> {
  const systemPrompt = buildActionSystemPrompt()
  const userPrompt = buildActionUserPrompt(action, ctx.schemaSql, ctx.entityMapping, ctx.types)

  const result = await callClaude(systemPrompt, userPrompt, { maxTokens: 4096 }, trackingContext)

  if (!result.success || !result.content) {
    throw new Error(`生成 ${action.name} 失敗：${result.error}`)
  }

  const code = extractCodeFromResponse(result.content)

  return {
    path: `lib/actions/${toKebabCase(action.name)}.ts`,
    content: code,
    description: action.summary,
  }
}

// ============================================================
// 4. Server Actions 機械映射（零 LLM）
// ============================================================

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
        return `export async function ${fnName}Action(input: ${inputType}) {
  return ${fnName}(input)
}`
      })
      .join('\n\n')

    // 從對應 lib/actions 匯入型別
    const typeImports = domainActions
      .map(a => `import type { ${toPascalCase(a.name)}Input } from '@/lib/actions/${toKebabCase(a.name)}'`)
      .join('\n')

    const content = `'use server'

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
      const isQuery = a.rules?.some(r => r.type === '後置（回應）') && !a.rules?.some(r => r.type === '後置（狀態）')
      actionMeta.set(a.name, {
        method: (typeof a.method === 'string' ? a.method : (isQuery ? 'GET' : 'POST')).toUpperCase(),
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
    return NextResponse.json(result, { status: 200 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
`
    } else {
      // POST/PUT/DELETE/PATCH
      const statusCode = meta.method === 'POST' ? 201 : 200
      content = `import { NextRequest, NextResponse } from 'next/server'
import { ${fnName} } from '${importPath}'
import type { ${inputType} } from '${importPath}'

export async function ${meta.method}(req: NextRequest) {
  try {
    const body: ${inputType} = await req.json()
    const result = await ${fnName}(body)
    return NextResponse.json(result, { status: ${statusCode} })
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
// 5. 識別需改寫的 UIUX 組件（零 LLM）
// ============================================================

// 掃描 useState 初始化為硬編碼陣列或物件的模式
const MOCK_DATA_PATTERNS = [
  // useState([{ key: value, ... }])
  /useState\(\s*\[\s*\{[^}]+\}/,
  // useState({ key: value, ... }) 且非簡單的 boolean/string/number
  /useState\(\s*\{\s*\w+\s*:\s*['"][^'"]{10,}/,
  // 大段硬編碼陣列 const xxx = [{ ... }]
  /(?:const|let)\s+\w+\s*=\s*\[\s*\{\s*(?:id|name|title|label)\s*:/,
]

export function identifyMockDataComponents(
  code: GeneratedCode
): { needsRewrite: GeneratedComponent[]; unchanged: GeneratedComponent[] } {
  const needsRewrite: GeneratedComponent[] = []
  const unchanged: GeneratedComponent[] = []

  const allComponents = [...code.pages, ...code.components]

  for (const comp of allComponents) {
    const hasMockData = MOCK_DATA_PATTERNS.some(pattern => pattern.test(comp.content))
    if (hasMockData) {
      needsRewrite.push(comp)
    } else {
      unchanged.push(comp)
    }
  }

  logger.info({ needsRewrite: needsRewrite.length, unchanged: unchanged.length }, '組件分類完成')
  return { needsRewrite, unchanged }
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

## 輸出
只輸出完整的改寫後 TypeScript/JSX 代碼，不要任何解釋或 markdown 包裹。`
}

function buildRewriteUserPrompt(
  component: GeneratedComponent,
  availableActions: { path: string; exports: string[] }[]
): string {
  const actionsText = availableActions
    .map(a => `- ${a.path}: ${a.exports.join(', ')}`)
    .join('\n')

  return `## 可用的 Server Actions
${actionsText}

## 原始組件（路徑：${component.path}）
${component.content}

請改寫此組件，將 mock 數據替換為 Server Action 調用。路徑保持不變：${component.path}`
}

export async function rewriteComponentForServerActions(
  component: GeneratedComponent,
  availableActions: { path: string; exports: string[] }[],
  trackingContext?: { userId?: string; conversationId?: string }
): Promise<GeneratedComponent> {
  const systemPrompt = buildRewriteSystemPrompt()
  const userPrompt = buildRewriteUserPrompt(component, availableActions)

  const result = await callClaude(systemPrompt, userPrompt, { maxTokens: 8192 }, trackingContext)

  if (!result.success || !result.content) {
    logger.warn({ path: component.path, error: result.error }, '組件改寫失敗，保留原始版本')
    return component
  }

  const code = extractCodeFromResponse(result.content)

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
  const { actionsYml, schemaSql, entityMapping, existingUiuxCode, trackingContext } = input

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
      return generateActionFunction(action, { schemaSql, entityMapping, types }, trackingContext)
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

  // Step 5: 識別需改寫的組件
  await callbacks.onProgress('分析前端組件...', 55)
  const { needsRewrite, unchanged } = identifyMockDataComponents(existingUiuxCode)

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
        return rewriteComponentForServerActions(comp, availableActions, trackingContext)
      },
      3
    )
  }

  await callbacks.onProgress('完成！', 98)

  const backendFiles = [dbFile, ...actionFiles, ...serverActionFiles, ...apiRouteFiles]
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

## 認證檢查（常見錯誤！）
如果錯誤是 "操作者必須已登入"，移除函數內的認證/登入檢查。
不要檢查 userId 是否存在。呼叫者已處理認證。`

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
