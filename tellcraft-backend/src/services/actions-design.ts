import * as yaml from 'js-yaml'
import { recordLlmUsage } from '../db/client'
import { LlmTrackingContext } from './classifier'

// Sonnet 定價 (每百萬 tokens)
const SONNET_PRICING = { input: 3, output: 15 }

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
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { success: false, error: 'ANTHROPIC_API_KEY not configured' }
  }

  let lastError = 'Unknown error'

  for (let attempt = 1; attempt <= RETRY_MAX; attempt++) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
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
          console.warn(`[ActionsDesign] HTTP ${response.status} (attempt ${attempt}/${RETRY_MAX})，${delay}ms 後重試`)
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
        console.warn(`[ActionsDesign] 網路錯誤 (attempt ${attempt}/${RETRY_MAX})，${delay}ms 後重試:`, lastError.slice(0, 100))
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
5. **step 格式**：
   - When: \`{summary}, call table:\`
   - Then 成功: \`{summary}成功, with table:\`
   - Then 失敗: \`操作失敗\`
   - Entity 驗證: \`存在一個{entity}, with table:\`
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
  database: supabase

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
): Promise<{ success: boolean; actionsYml?: string; error?: string }> {
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

  console.log(`[ActionsDesign] 生成 actions.yml，${features.length} 個 Features...`)
  const response = await callClaude(SYSTEM_PROMPT, userMessage, { maxTokens: 16384, temperature: 0.1 })

  if (!response.success) {
    return { success: false, error: response.error }
  }

  // 記錄使用量
  if (response.inputTokens && response.outputTokens && trackingContext) {
    const costUsd = (response.inputTokens * SONNET_PRICING.input + response.outputTokens * SONNET_PRICING.output) / 1000000
    await recordLlmUsage({
      model: 'claude-sonnet-4-6',
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      costUsd,
      purpose: 'actions_design',
      userId: trackingContext.userId,
      conversationId: trackingContext.conversationId,
    }).catch(err => console.error('[ActionsDesign] 記錄使用量失敗:', err))
  }

  // 提取 YAML 內容
  const yamlMatch = response.content?.match(/```yaml\s*([\s\S]*?)\s*```/)
  if (!yamlMatch) {
    console.error('[ActionsDesign] LLM 回應無法提取 YAML，前 500 字:', response.content?.substring(0, 500))
    return { success: false, error: '無法從 LLM 回應提取 YAML' }
  }

  const actionsYml = yamlMatch[1].trim()

  // 驗證
  const validation = validateActionsYml(actionsYml, features)
  if (!validation.valid) {
    console.warn('[ActionsDesign] 初次生成驗證失敗:', validation.errors)

    // 修復重試（1 次）
    const fixPrompt = `你之前生成的 actions.yml 有以下問題，請修正後重新輸出完整 YAML：

## 問題
${validation.errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}

## 原始 YAML
\`\`\`yaml
${actionsYml}
\`\`\`

請修正上述問題，輸出完整的修正版 YAML（用 \`\`\`yaml\`\`\` 包裹）。`

    console.log('[ActionsDesign] 修復重試...')
    const fixResponse = await callClaude(SYSTEM_PROMPT, fixPrompt, { maxTokens: 16384, temperature: 0.1 })

    if (fixResponse.success) {
      const fixYamlMatch = fixResponse.content?.match(/```yaml\s*([\s\S]*?)\s*```/)
      if (fixYamlMatch) {
        const fixedYml = fixYamlMatch[1].trim()
        const fixValidation = validateActionsYml(fixedYml, features)
        if (fixValidation.valid) {
          console.log('[ActionsDesign] 修復後驗證通過')
          return { success: true, actionsYml: fixedYml }
        }
        console.warn('[ActionsDesign] 修復後仍有問題:', fixValidation.errors)
        // 降級：使用修復版（可能部分正確）
        return { success: true, actionsYml: fixedYml }
      }
    }

    // 降級：使用初始版本
    console.warn('[ActionsDesign] 修復失敗，使用初始版本')
    return { success: true, actionsYml }
  }

  console.log(`[ActionsDesign] 生成完成，${features.length} 個 Actions`)
  return { success: true, actionsYml }
}
