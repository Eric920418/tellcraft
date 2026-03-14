import * as yaml from 'js-yaml'
import { getAnthropicHeaders, MODEL, trackLlmUsage } from '../lib/anthropic'
import { LlmTrackingContext } from './classifier'
import { createLogger } from '../lib/logger'

const logger = createLogger('actions-design')

// ============================================================
// 類型定義
// ============================================================

export interface ActionsDesignInput {
  features: Array<{ name: string; actionName: string; content: string }>
  schemaSql: string
  entityMapping: string
  projectName?: string
}

interface ActionRule {
  rule: string
  type: string
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

interface ExtractYamlResult {
  yamlText: string
  strategy: 'fenced-yaml' | 'unclosed-fenced-yaml' | 'yaml-root' | 'raw-content'
}

// ============================================================
// LLM 調用（複用 formulation.ts 的 raw fetch 模式）
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
  options: { maxTokens?: number; temperature?: number } = {}
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
          logger.warn({ status: response.status, attempt, maxRetries: RETRY_MAX, delayMs: delay }, 'HTTP 錯誤，重試中')
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
        logger.warn({ attempt, maxRetries: RETRY_MAX, delayMs: delay, error: lastError.slice(0, 100) }, '網路錯誤，重試中')
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      break
    }
  }

  return { success: false, error: lastError }
}

// ============================================================
// actions.yml 驗證
// ============================================================

/**
 * 驗證 actions.yml 結構：
 * 1. YAML 解析成功
 * 2. 每個 action 的 summary 與對應 Feature 名稱一致
 * 3. 每個 Feature 都有對應 action
 * 4. rules 包含四類 type 之一
 */
export function validateActionsYml(
  actionsYml: string,
  features: Array<{ name: string; actionName: string }>
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // 1. YAML 解析
  let parsed: ActionsYmlStructure
  try {
    parsed = yaml.load(actionsYml) as ActionsYmlStructure
  } catch (err) {
    return { valid: false, errors: [`YAML 解析失敗: ${err}`] }
  }

  if (!parsed || !parsed.actions || !Array.isArray(parsed.actions)) {
    return { valid: false, errors: ['缺少 actions 陣列'] }
  }

  const validTypes = ['前置（狀態）', '前置（參數）', '後置（回應）', '後置（狀態）']

  // 2. 檢查每個 action
  const actionSummaries = new Set<string>()
  for (const action of parsed.actions) {
    if (!action.name) {
      errors.push('Action 缺少 name 欄位')
      continue
    }
    if (!action.summary) {
      errors.push(`Action "${action.name}" 缺少 summary 欄位`)
      continue
    }
    actionSummaries.add(action.summary)

    // 檢查 rules type
    if (action.rules && Array.isArray(action.rules)) {
      for (const rule of action.rules) {
        if (rule.type && !validTypes.includes(rule.type)) {
          errors.push(`Action "${action.name}" 的 rule type "${rule.type}" 不在四類之中`)
        }
      }
    }
  }

  // 3. 檢查 Feature ↔ Action 一致性
  for (const feature of features) {
    if (!actionSummaries.has(feature.name)) {
      errors.push(`Feature "${feature.name}" 沒有對應的 Action（summary 不匹配）`)
    }
  }

  // 4. 檢查 action.name 與 feature.actionName 一致性
  const featureActionNames = new Set(features.map(f => f.actionName))
  for (const action of parsed.actions) {
    if (action.name && !featureActionNames.has(action.name)) {
      errors.push(`Action "${action.name}" 沒有對應的 Feature（actionName 不匹配）`)
    }
  }

  return { valid: errors.length === 0, errors }
}

function hasActionsArray(parsed: unknown): parsed is ActionsYmlStructure {
  if (!parsed || typeof parsed !== 'object') {
    return false
  }
  const obj = parsed as Record<string, unknown>
  return Array.isArray(obj.actions)
}

function tryParseActionsYaml(candidate: string): string | null {
  const normalized = candidate
    .replace(/^\uFEFF/, '') // 移除 BOM
    .replace(/^\s*yaml\s*\n/i, '')
    .trim()

  if (!normalized) {
    return null
  }

  try {
    const parsed = yaml.load(normalized)
    if (hasActionsArray(parsed)) {
      return normalized
    }
  } catch {
    return null
  }

  return null
}

function extractYamlFromLlmResponse(content?: string): ExtractYamlResult | null {
  const text = (content || '').trim()
  if (!text) {
    return null
  }

  // 1) 優先：標準 fenced yaml/yml
  const fencedMatches = text.matchAll(/```(?:yaml|yml)\s*([\s\S]*?)\s*```/gi)
  for (const match of fencedMatches) {
    const parsed = tryParseActionsYaml(match[1] || '')
    if (parsed) {
      return { yamlText: parsed, strategy: 'fenced-yaml' }
    }
  }

  // 2) 降級：只有開頭 fence，沒有結尾 fence（常見於輸出截斷）
  const unclosedFenceMatch = text.match(/```(?:yaml|yml)\s*([\s\S]*)$/i)
  if (unclosedFenceMatch) {
    const parsed = tryParseActionsYaml(unclosedFenceMatch[1] || '')
    if (parsed) {
      return { yamlText: parsed, strategy: 'unclosed-fenced-yaml' }
    }
  }

  // 3) 降級：從 YAML root key 開始嘗試（處理模型未包 code fence 的情況）
  const rootMatch = text.match(/(?:^|\n)(project|actions|types)\s*:/i)
  if (rootMatch && typeof rootMatch.index === 'number') {
    const rootStart = rootMatch.index + (rootMatch[0].startsWith('\n') ? 1 : 0)
    const parsed = tryParseActionsYaml(text.slice(rootStart))
    if (parsed) {
      return { yamlText: parsed, strategy: 'yaml-root' }
    }
  }

  // 4) 最後嘗試整段內容（容忍回應前後有少量空白/說明）
  const parsed = tryParseActionsYaml(text)
  if (parsed) {
    return { yamlText: parsed, strategy: 'raw-content' }
  }

  return null
}

// ============================================================
// 核心生成函數
// ============================================================

const SYSTEM_PROMPT = `你是一位 sdd.os ISA 專家，負責從 Feature Files 和 Schema 設計 Server Actions 規格。

## 任務
分析提供的 sdd.os ISA Feature Files，設計對應的 Server Actions，以 YAML 格式輸出 actions.yml。

## 核心規範
1. **summary 一致**：每個 Action 的 summary 必須與 Feature 名稱**完全一致**（逐字匹配）
2. **name 一致**：每個 Action 的 name 必須與 Feature 開頭的 \`# Action:\` 註解一致
3. **rules 完整**：每個 Action 必須列出所有 Rule（從 Feature File 提取）
4. **type 四類**：每條 rule 的 type 必須是以下四類之一：
   - \`前置（狀態）\`：系統既有狀態約束（如庫存>0）
   - \`前置（參數）\`：輸入參數約束（如數量>0、必填欄位）
   - \`後置（回應）\`：API 回傳資料預期（查詢類功能）
   - \`後置（狀態）\`：資料庫狀態變化（命令類功能）
5. **step 格式（SpecFormula 標準）**：
   - When: \`(No Actor|UID="$var") {summary}, call table:\`
   - Then 成功: \`{summary}(STATUS)回應, with table:\`
   - Then 失敗: \`操作失敗\`
   - Entity 驗證: \`應該存在一個{entity}, with table:\`
   - Entity 不存在: \`應該不存在一個{entity}, with table:\`
6. **Types 對應 Schema**：所有 SQL Schema 主表都有 Type 定義，SQL→TS 類型映射正確

## SQL → TypeScript 類型映射
| SQL 類型 | TypeScript 類型 |
|----------|-----------------|
| VARCHAR/TEXT | string |
| INT/INTEGER/BIGINT | number |
| DECIMAL/NUMERIC | number（金額建議 string） |
| BOOLEAN | boolean |
| TIMESTAMP/TIMESTAMPTZ | string (ISO 8601) |
| UUID | string |
| ENUM | string with enum 值 |

## 輸出格式
請以 YAML 格式輸出，用 \`\`\`yaml\`\`\` 包裹：

\`\`\`yaml
project:
  name: 專案名稱
  framework: next.js
  database: postgresql

actions:
  - name: actionFunctionName
    summary: Feature名稱
    description: |
      功能描述
    featureFile: spec/features/Feature名稱.feature
    rules:
      - rule: 四類前綴 - 規則描述
        type: 四類之一
        step: "ISA step statement"
    input:
      type: InputTypeName
      properties:
        fieldName:
          type: string
          required: true
    output:
      success:
        type: OutputTypeName
      error:
        type: ActionError

types:
  TypeName:
    description: 對應 schema 中的表名
    properties:
      fieldName:
        type: string
    required:
      - fieldName
\`\`\`

## 禁止事項
1. 不要設計 Feature Files 中未提及的 Action
2. 不要在 rules 中編造不存在的 Rule
3. 不要讓 Action summary 與 Feature 名稱不一致
4. 不要省略 featureFile 和 rules 欄位`

/**
 * 從 Feature Files + Schema 生成 actions.yml
 *
 * LLM 驅動（Sonnet），~1 次調用，~$0.05
 */
export async function generateActionsYml(
  input: ActionsDesignInput,
  trackingContext?: LlmTrackingContext
): Promise<{ success: boolean; actionsYml?: string; openApiSpec?: string; error?: string }> {
  const { features, schemaSql, entityMapping, projectName } = input

  if (features.length === 0) {
    return { success: false, error: '沒有 Feature Files' }
  }

  // 構建 user message
  const featuresContent = features.map(f =>
    `### ${f.name} (${f.actionName})\n\`\`\`gherkin\n${f.content}\n\`\`\``
  ).join('\n\n---\n\n')

  const userMessage = `## 專案${projectName ? `: ${projectName}` : ''}

## Feature Files（sdd.os ISA 格式）

${featuresContent}

---

## SQL Schema
\`\`\`sql
${schemaSql}
\`\`\`

## Entity Mapping
\`\`\`yaml
${entityMapping}
\`\`\`

請根據以上內容生成 actions.yml。`

  logger.info({ featureCount: features.length }, '生成 actions.yml')
  const response = await callClaude(SYSTEM_PROMPT, userMessage, { maxTokens: 16384, temperature: 0.1 })

  if (!response.success) {
    return { success: false, error: response.error }
  }

  // 記錄使用量
  if (response.inputTokens && response.outputTokens) {
    trackLlmUsage({
      model: MODEL.SONNET,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      purpose: 'actions_design',
      userId: trackingContext?.userId,
      conversationId: trackingContext?.conversationId,
    })
  }

  // 提取 YAML 內容（含容錯降級）
  let extracted = extractYamlFromLlmResponse(response.content)
  if (!extracted) {
    logger.warn({ responsePreview: response.content?.substring(0, 500) }, '首次提取 YAML 失敗，嘗試格式重試')
    const reformatPrompt = `你上一則回覆無法被程式解析為 actions.yml（可能缺少結尾 code fence 或輸出截斷）。

請重新輸出「完整 actions.yml」，並嚴格遵守：
1. 只輸出一個 \`\`\`yaml\`\`\` 區塊
2. 不要輸出任何額外解釋文字
3. YAML 必須包含 project / actions / types

## 上一則回覆（可能截斷）
\`\`\`
${(response.content || '').slice(0, 2000)}
\`\`\``
    const reformatResponse = await callClaude(SYSTEM_PROMPT, reformatPrompt, { maxTokens: 16384, temperature: 0.1 })
    if (reformatResponse.success) {
      extracted = extractYamlFromLlmResponse(reformatResponse.content)
      if (extracted) {
        logger.info({ strategy: extracted.strategy }, '格式重試後成功提取 YAML')
      }
    }
  }
  if (!extracted) {
    logger.error({ responsePreview: response.content?.substring(0, 500) }, 'LLM 回應無法提取 YAML')
    return { success: false, error: '無法從 LLM 回應提取 YAML' }
  }

  if (extracted.strategy !== 'fenced-yaml') {
    logger.warn({ strategy: extracted.strategy }, 'LLM YAML 以容錯模式提取')
  }

  const actionsYml = extracted.yamlText

  // 驗證
  const validation = validateActionsYml(actionsYml, features)
  if (!validation.valid) {
    logger.warn({ errors: validation.errors }, '初次生成驗證失敗')

    // 修復重試（1 次）
    const fixPrompt = `你之前生成的 actions.yml 有以下問題，請修正後重新輸出完整 YAML：

## 問題
${validation.errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}

## 原始 YAML
\`\`\`yaml
${actionsYml}
\`\`\`

請修正上述問題，輸出完整的修正版 YAML（用 \`\`\`yaml\`\`\` 包裹）。`

    logger.info('修復重試...')
    const fixResponse = await callClaude(SYSTEM_PROMPT, fixPrompt, { maxTokens: 16384, temperature: 0.1 })

    if (fixResponse.success) {
      const fixExtracted = extractYamlFromLlmResponse(fixResponse.content)
      if (fixExtracted) {
        if (fixExtracted.strategy !== 'fenced-yaml') {
          logger.warn({ strategy: fixExtracted.strategy }, '修復回應 YAML 以容錯模式提取')
        }
        const fixedYml = fixExtracted.yamlText
        const fixValidation = validateActionsYml(fixedYml, features)
        if (fixValidation.valid) {
          logger.info('修復後驗證通過')
          return { success: true, actionsYml: fixedYml }
        }
        logger.warn({ errors: fixValidation.errors }, '修復後仍有問題')
        // 降級：使用修復版（可能部分正確）
        return { success: true, actionsYml: fixedYml }
      }
    }

    // 降級：使用初始版本
    logger.warn('修復失敗，使用初始版本')
    return { success: true, actionsYml }
  }

  logger.info({ actionCount: features.length }, '生成完成')

  // 自動生成 OpenAPI 3.0 spec
  let openApiSpec: string | undefined
  try {
    openApiSpec = convertToOpenAPI(actionsYml, projectName)
    logger.info('OpenAPI 3.0 spec 生成完成')
  } catch (err) {
    logger.warn({ err }, 'OpenAPI 生成失敗，降級跳過')
  }

  return { success: true, actionsYml, openApiSpec }
}

// ============================================================
// OpenAPI 3.0 轉換（機械映射，零 LLM）
// ============================================================

/**
 * 將 actions.yml 轉換為 OpenAPI 3.0 YAML
 * 機械映射，零 LLM：
 * - Command Action → POST /api/{actionName}
 * - Query Action → GET /api/{actionName}
 * - rules 中 前置（參數）→ 400 response
 * - rules 中 前置（狀態）→ 409 response
 * - types → components/schemas
 */
export function convertToOpenAPI(actionsYml: string, projectName?: string): string {
  const parsed = yaml.load(actionsYml) as ActionsYmlStructure
  if (!parsed || !parsed.actions) {
    throw new Error('actions.yml 解析失敗或缺少 actions')
  }

  const openapi: Record<string, unknown> = {
    openapi: '3.0.3',
    info: {
      title: `${projectName || parsed.project?.name || 'API'} - Server Actions`,
      version: '1.0.0',
      description: `由 Tellcraft BDD Spec 自動生成的 API 規格`,
    },
    paths: {} as Record<string, unknown>,
    components: {
      schemas: {} as Record<string, unknown>,
    },
  }

  const paths = openapi.paths as Record<string, unknown>
  const schemas = (openapi.components as Record<string, unknown>).schemas as Record<string, unknown>

  // 轉換 types → components/schemas
  if (parsed.types) {
    for (const [typeName, typeDef] of Object.entries(parsed.types)) {
      const def = typeDef as Record<string, unknown>
      const schemaObj: Record<string, unknown> = {
        type: 'object',
        description: (def.description as string) || typeName,
      }
      if (def.properties) {
        const props: Record<string, unknown> = {}
        for (const [propName, propDef] of Object.entries(def.properties as Record<string, unknown>)) {
          const p = propDef as Record<string, unknown>
          props[propName] = mapTypeToOpenAPI(p.type as string)
        }
        schemaObj.properties = props
      }
      if (def.required && Array.isArray(def.required)) {
        schemaObj.required = def.required
      }
      schemas[typeName] = schemaObj
    }
  }

  // 轉換 actions → paths
  for (const action of parsed.actions) {
    const isQuery = isQueryAction(action)
    const method = (typeof action.method === 'string' ? action.method : (isQuery ? 'GET' : 'POST')).toLowerCase()
    const pathKey = typeof action.path === 'string' ? action.path : `/api/${action.name}`

    // 分析 rules 判斷錯誤回應
    const has400 = action.rules?.some(r => r.type === '前置（參數）')
    const has409 = action.rules?.some(r => r.type === '前置（狀態）')

    const operation: Record<string, unknown> = {
      summary: action.summary || action.name,
      operationId: action.name,
      tags: [projectName || 'Actions'],
    }

    if (action.rules && action.rules.length > 0) {
      operation.description = action.rules.map(r => `- [${r.type}] ${r.rule}`).join('\n')
    }

    // Request body / parameters
    if (!isQuery && action.input) {
      const inputType = (action.input as Record<string, unknown>).type as string | undefined
      if (inputType && schemas[inputType]) {
        operation.requestBody = {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${inputType}` },
            },
          },
        }
      } else if ((action.input as Record<string, unknown>).properties) {
        const reqSchema = buildInlineSchema(action.input as Record<string, unknown>)
        operation.requestBody = {
          required: true,
          content: {
            'application/json': { schema: reqSchema },
          },
        }
      }
    } else if (isQuery && action.input) {
      const inputProps = (action.input as Record<string, unknown>).properties as Record<string, unknown> | undefined
      if (inputProps) {
        operation.parameters = Object.entries(inputProps).map(([name, def]) => {
          const d = def as Record<string, unknown>
          return {
            name,
            in: 'query',
            required: d.required === true,
            schema: mapTypeToOpenAPI(d.type as string),
          }
        })
      }
    }

    // Responses
    const responses: Record<string, unknown> = {}

    // 200 成功
    const outputSuccess = action.output ? (action.output as Record<string, unknown>).success as Record<string, unknown> | undefined : undefined
    if (outputSuccess?.type && schemas[outputSuccess.type as string]) {
      responses['200'] = {
        description: '操作成功',
        content: {
          'application/json': {
            schema: { $ref: `#/components/schemas/${outputSuccess.type}` },
          },
        },
      }
    } else {
      responses['200'] = { description: '操作成功' }
    }

    // 400 參數錯誤
    if (has400) {
      const paramRules = action.rules!.filter(r => r.type === '前置（參數）')
      responses['400'] = {
        description: `參數驗證失敗: ${paramRules.map(r => r.rule).join('; ')}`,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' },
                code: { type: 'string', example: 'VALIDATION_ERROR' },
              },
            },
          },
        },
      }
    }

    // 409 狀態衝突
    if (has409) {
      const stateRules = action.rules!.filter(r => r.type === '前置（狀態）')
      responses['409'] = {
        description: `狀態衝突: ${stateRules.map(r => r.rule).join('; ')}`,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' },
                code: { type: 'string', example: 'CONFLICT' },
              },
            },
          },
        },
      }
    }

    operation.responses = responses
    paths[pathKey] = { [method]: operation }
  }

  return yaml.dump(openapi, { indent: 2, lineWidth: 120, noRefs: true })
}

// ============================================================
// OpenAPI 轉換輔助函數
// ============================================================

function isQueryAction(action: ActionEntry): boolean {
  // 後置（回應）型 = 查詢類；後置（狀態）型 = 命令類
  if (!action.rules || action.rules.length === 0) return false
  const hasResponseRule = action.rules.some(r => r.type === '後置（回應）')
  const hasStateRule = action.rules.some(r => r.type === '後置（狀態）')
  // 只有回應沒有狀態變化 → 查詢
  return hasResponseRule && !hasStateRule
}

function mapTypeToOpenAPI(tsType: string | undefined): Record<string, unknown> {
  if (!tsType) return { type: 'string' }
  const t = tsType.toLowerCase().trim()
  if (t === 'string') return { type: 'string' }
  if (t === 'number') return { type: 'number' }
  if (t === 'boolean') return { type: 'boolean' }
  if (t === 'string (iso 8601)') return { type: 'string', format: 'date-time' }
  if (t.startsWith('string')) return { type: 'string' }
  if (t.includes('[]')) {
    const itemType = t.replace('[]', '').trim()
    return { type: 'array', items: mapTypeToOpenAPI(itemType) }
  }
  // 可能是自訂 type → $ref
  return { $ref: `#/components/schemas/${tsType}` }
}

function buildInlineSchema(input: Record<string, unknown>): Record<string, unknown> {
  const schema: Record<string, unknown> = { type: 'object' }
  const properties = input.properties as Record<string, unknown> | undefined
  if (properties) {
    const props: Record<string, unknown> = {}
    const required: string[] = []
    for (const [name, def] of Object.entries(properties)) {
      const d = def as Record<string, unknown>
      props[name] = mapTypeToOpenAPI(d.type as string)
      if (d.required === true) required.push(name)
    }
    schema.properties = props
    if (required.length > 0) schema.required = required
  }
  return schema
}

