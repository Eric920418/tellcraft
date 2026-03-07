import { recordLlmUsage } from '../db/client'
import { createLogger } from '../lib/logger'
import { getAnthropicHeaders, MODEL } from '../lib/anthropic'
import { safeParseJson } from '../utils/safe-parse-json'
import { ClarifyItem, TechnicalContext } from './bdd-session'
import { LlmTrackingContext } from './classifier'

const logger = createLogger('formulation')

// Sonnet 定價 (每百萬 tokens)
const SONNET_PRICING = { input: 3, output: 15 }

// ============================================================
// 類型定義
// ============================================================

export interface FeatureInfo {
  name: string
  actionName: string
  description: string
}

export interface GeneratedFeature {
  name: string
  actionName: string
  content: string
}

export interface FormulationResult {
  success: boolean
  schemaSql?: string
  entityMapping?: string
  features?: GeneratedFeature[]
  error?: string
}

// ============================================================
// LLM 調用輔助函數
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
  let lastError: string = 'Unknown error'

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
          logger.warn({ status: response.status, attempt, maxRetries: RETRY_MAX, delayMs: delay }, 'HTTP 錯誤，即將重試')
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
        logger.warn({ attempt, maxRetries: RETRY_MAX, delayMs: delay, error: lastError.slice(0, 100) }, '網路錯誤，即將重試')
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      break
    }
  }

  return { success: false, error: lastError }
}

// ============================================================
// TechnicalContext 提取輔助函數
// ============================================================

/**
 * 從 resolvedItems 的 technicalContext 中提取結構化 Schema 提示
 * 供注入 Formulation 各階段的 prompt
 */
function extractSchemaHints(resolvedItems: ClarifyItem[]): string {
  const itemsWithContext = resolvedItems.filter(
    item => item.status === 'answered' && item.technicalContext
  )
  if (itemsWithContext.length === 0) return ''

  const allEntities = new Map<string, TechnicalContext['entities'][0]>()
  const allRelationships: NonNullable<TechnicalContext['relationships']> = []
  const allComputations: NonNullable<TechnicalContext['computations']> = []
  const allStateTransitions: NonNullable<TechnicalContext['stateTransitions']> = []
  const allConstraints: NonNullable<TechnicalContext['constraints']> = []

  for (const item of itemsWithContext) {
    const ctx = item.technicalContext!

    // 聚合實體（按 tableName 去重合併 fields）
    for (const entity of ctx.entities) {
      const key = entity.tableName || entity.name
      const existing = allEntities.get(key)
      if (existing) {
        const existingFieldNames = new Set(existing.fields.map(f => f.name))
        for (const field of entity.fields) {
          if (!existingFieldNames.has(field.name)) {
            existing.fields.push(field)
          }
        }
      } else {
        allEntities.set(key, { ...entity })
      }
    }

    if (ctx.relationships) allRelationships.push(...ctx.relationships)
    if (ctx.computations) allComputations.push(...ctx.computations)
    if (ctx.stateTransitions) allStateTransitions.push(...ctx.stateTransitions)
    if (ctx.constraints) allConstraints.push(...ctx.constraints)
  }

  const lines: string[] = ['## 結構化技術上下文（來自釐清階段）\n']

  if (allEntities.size > 0) {
    lines.push('### 實體與欄位')
    for (const entity of allEntities.values()) {
      const tablePart = entity.tableName ? ` (${entity.tableName})` : ''
      lines.push(`- **${entity.name}**${tablePart}`)
      for (const field of entity.fields) {
        const typePart = field.type ? ` ${field.type}` : ''
        const constraintPart = field.constraints?.length ? ` [${field.constraints.join(', ')}]` : ''
        lines.push(`  - ${field.label} (${field.name})${typePart}${constraintPart}`)
      }
    }
    lines.push('')
  }

  if (allRelationships.length > 0) {
    lines.push('### 實體關係')
    for (const rel of allRelationships) {
      const fkPart = rel.foreignKey ? ` FK: ${rel.foreignKey}` : ''
      lines.push(`- ${rel.from} → ${rel.to} [${rel.type}]${fkPart} — ${rel.description}`)
    }
    lines.push('')
  }

  if (allComputations.length > 0) {
    lines.push('### 計算規則')
    for (const comp of allComputations) {
      lines.push(`- ${comp.target} = ${comp.formula} — ${comp.description}`)
    }
    lines.push('')
  }

  if (allStateTransitions.length > 0) {
    lines.push('### 狀態轉換')
    for (const st of allStateTransitions) {
      lines.push(`- ${st.entity}.${st.field}: ${st.from} → ${st.to} (觸發: ${st.trigger}) — ${st.description}`)
    }
    lines.push('')
  }

  if (allConstraints.length > 0) {
    lines.push('### 約束條件')
    for (const c of allConstraints) {
      lines.push(`- [${c.scope}] ${c.expression} — ${c.description}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * 為單一 ClarifyItem 生成技術映射文字（用於 decisions 字串中）
 */
function formatItemTechnicalMapping(item: ClarifyItem): string {
  if (!item.technicalContext) return ''

  const ctx = item.technicalContext
  const parts: string[] = []

  if (ctx.entities.length > 0) {
    const entityStr = ctx.entities.map(e => {
      const fields = e.fields.map(f => {
        const typePart = f.type ? ` ${f.type}` : ''
        return `${f.name}${typePart}`
      }).join(', ')
      const tablePart = e.tableName ? `(${e.tableName})` : ''
      return `${e.name}${tablePart}: ${fields}`
    }).join('; ')
    parts.push(`[技術映射] 涉及實體：${entityStr}`)
  }

  if (ctx.computations?.length) {
    for (const comp of ctx.computations) {
      parts.push(`[計算規則] ${comp.target} = ${comp.formula}`)
    }
  }

  if (ctx.stateTransitions?.length) {
    for (const st of ctx.stateTransitions) {
      parts.push(`[狀態轉換] ${st.entity}.${st.field}: ${st.from} → ${st.to}`)
    }
  }

  if (ctx.constraints?.length) {
    for (const c of ctx.constraints) {
      parts.push(`[約束] ${c.expression}`)
    }
  }

  return parts.join('\n')
}

// ============================================================
// Phase 2: Formulation - 產出 SQL Schema
// ============================================================

export async function generateSchemaSql(
  requirements: string,
  resolvedItems: ClarifyItem[],
  projectContext?: string,
  trackingContext?: LlmTrackingContext
): Promise<{
  success: boolean
  schemaSql?: string
  entityMapping?: string
  error?: string
}> {
  const decisions = resolvedItems
    .filter(item => item.status === 'answered' && item.answer)
    .map(item => {
      const base = `Q: ${item.whiteTextQuestion || item.question}\nA: ${item.answer}`
      const techMapping = formatItemTechnicalMapping(item)
      return techMapping ? `${base}\n${techMapping}` : base
    })
    .join('\n\n')

  const schemaHints = extractSchemaHints(resolvedItems)

  const systemPrompt = `你是一位資深的資料庫架構師。根據需求和釐清決策，產出 SQL Schema 和 Entity 映射。

## 輸出格式

### 1. SQL Schema (schema.sql)
\`\`\`sql
-- 實體名稱
CREATE TABLE table_name (
    id VARCHAR(10) PRIMARY KEY COMMENT '唯一識別碼',
    column_name TYPE NOT NULL COMMENT '欄位說明',
    -- 約束條件
    CONSTRAINT chk_name CHECK (condition)
) COMMENT '實體說明';
\`\`\`

### 2. Entity Mapping (YAML)
\`\`\`yaml
entity_to_table_mapping:
  - 中文實體名: table_name
\`\`\`

## 規則
- 每個欄位必須有 COMMENT 說明
- 限制條件用 CHECK constraint 表達
- 使用 snake_case 命名
- 不要假設需求中沒有的欄位

輸出 JSON 格式：
\`\`\`json
{
  "schemaSql": "完整的 SQL DDL",
  "entityMapping": "完整的 YAML"
}
\`\`\``

  const userMessage = `${projectContext ? `專案背景：${projectContext}\n\n` : ''}需求描述：
${requirements}

---

釐清決策：
${decisions || '（無額外決策）'}${schemaHints ? `

---

${schemaHints}` : ''}`

  logger.info('生成 SQL Schema...')
  const response = await callClaude(systemPrompt, userMessage, { maxTokens: 8192 })

  if (!response.success) {
    return { success: false, error: response.error }
  }

  // 記錄使用量
  if (response.inputTokens && response.outputTokens) {
    const costUsd = (response.inputTokens * SONNET_PRICING.input + response.outputTokens * SONNET_PRICING.output) / 1000000
    await recordLlmUsage({
      model: MODEL.SONNET,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      costUsd,
      purpose: 'formulation_schema',
      userId: trackingContext?.userId,
      conversationId: trackingContext?.conversationId,
    }).catch(err => logger.error({ err }, '記錄使用量失敗'))
  }

  try {
    const parsed = safeParseJson<{ schemaSql?: string; entityMapping?: string }>(response.content || '')
    if (!parsed) {
      logger.error({ rawResponse: response.content?.substring(0, 500) }, 'Schema LLM 回應無法解析為 JSON')
      return { success: false, error: '無法解析 LLM 回應' }
    }

    logger.info('SQL Schema 生成完成')
    return {
      success: true,
      schemaSql: parsed.schemaSql,
      entityMapping: parsed.entityMapping,
    }
  } catch (err) {
    logger.error({ err, rawResponse: response.content?.substring(0, 500) }, 'Schema JSON 解析失敗')
    return { success: false, error: `解析回應時發生錯誤: ${err}` }
  }
}

// ============================================================
// 識別所有需要的 Features
// ============================================================

export async function identifyFeatures(
  requirements: string,
  resolvedItems: ClarifyItem[],
  schemaSql: string,
  projectContext?: string,
  trackingContext?: LlmTrackingContext
): Promise<{
  success: boolean
  features?: FeatureInfo[]
  error?: string
}> {
  const decisions = resolvedItems
    .filter(item => item.status === 'answered' && item.answer)
    .map(item => {
      const base = `Q: ${item.whiteTextQuestion || item.question}\nA: ${item.answer}`
      const techMapping = formatItemTechnicalMapping(item)
      return techMapping ? `${base}\n${techMapping}` : base
    })
    .join('\n\n')

  const schemaHints = extractSchemaHints(resolvedItems)

  const systemPrompt = `你是一位資深的 BDD 分析師。根據需求和 Schema，識別所有需要的功能（Feature）。

## 核心原則：需求驅動 + 智能分組

**只為需求描述或釐清決策中明確提到的操作生成 Feature**，不因 Schema 有 table 就自動補全所有 CRUD。

### 需求權重原則（Critical）
- **核心功能**（用戶大量描述的）→ 按需拆分為合理的 Feature
- **附屬功能**（用戶用 1-2 句提到的，如「要後台管理」）→ 合併為 1 個 Feature（如 manage_admin），不要拆成 manage_users + manage_content + manage_settings
- **Feature 數量應正比於需求描述篇幅**

### 智能合併規則
| 情境 | 處理方式 | 範例 |
|------|----------|------|
| 同一實體的標準 CRUD（建立/查詢/更新/刪除） | **合併為 1 個 Feature**，包含多個 Action block | manage_order（含 create/get/list/update/delete） |
| 狀態轉換（有獨立業務邏輯） | **保持獨立** | cancel_order、complete_order |
| 跨實體操作 | **保持獨立** | add_order_item（涉及 order + product） |
| 簡單查詢/列表 | **合併到對應實體的 CRUD Feature** | list_orders 併入 manage_order |

### actionName 格式
| 操作類型 | actionName 格式 | 範例 |
|----------|-----------------|------|
| CRUD 合併 | manage_{entity} | manage_order |
| 狀態轉換 | {action}_{entity} | cancel_order, approve_order |
| 跨實體操作 | {action}_{target} | add_order_item |

## 任務
1. 從需求和釐清決策中提取**明確提到的操作**（不要腦補 Schema 有但需求沒提的操作）
2. 同一實體的標準 CRUD 合併為一個 Feature
3. 狀態轉換和跨實體操作保持獨立

## 輸出格式
\`\`\`json
{
  "features": [
    {
      "name": "功能中文名稱",
      "actionName": "manage_xxx 或 action_xxx",
      "description": "簡短描述這個功能做什麼（合併的 Feature 說明包含哪些操作）"
    }
  ]
}
\`\`\`

## 命名規則
- actionName 使用 snake_case
- 合併的 CRUD Feature 用 \`manage_{entity}\`
- 獨立操作用 \`動詞_名詞\`（如 cancel_order, approve_request）
- 功能名稱要精確描述交互，不要太抽象`

  const userMessage = `${projectContext ? `專案背景：${projectContext}\n\n` : ''}需求描述：
${requirements}

---

SQL Schema：
\`\`\`sql
${schemaSql}
\`\`\`

---

釐清決策：
${decisions || '（無額外決策）'}${schemaHints ? `

---

${schemaHints}` : ''}`

  logger.info('識別 Features...')
  const response = await callClaude(systemPrompt, userMessage, { maxTokens: 8192 })

  if (!response.success) {
    return { success: false, error: response.error }
  }

  // 記錄使用量
  if (response.inputTokens && response.outputTokens) {
    const costUsd = (response.inputTokens * SONNET_PRICING.input + response.outputTokens * SONNET_PRICING.output) / 1000000
    await recordLlmUsage({
      model: MODEL.SONNET,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      costUsd,
      purpose: 'formulation_identify_features',
      userId: trackingContext?.userId,
      conversationId: trackingContext?.conversationId,
    }).catch(err => logger.error({ err }, '記錄使用量失敗'))
  }

  try {
    const parsed = safeParseJson<{ features?: FeatureInfo[] }>(response.content || '')
    if (!parsed) {
      logger.error({ rawResponse: response.content?.substring(0, 500) }, 'Features LLM 回應無法解析為 JSON')
      return { success: false, error: '無法解析 LLM 回應' }
    }

    logger.info({ featureCount: parsed.features?.length || 0 }, '識別 Features 完成')
    return {
      success: true,
      features: parsed.features,
    }
  } catch (err) {
    return { success: false, error: `解析回應時發生錯誤: ${err}` }
  }
}

// ============================================================
// 生成單個 Feature
// ============================================================

export async function generateSingleFeature(
  featureInfo: FeatureInfo,
  requirements: string,
  resolvedItems: ClarifyItem[],
  schemaSql: string,
  entityMapping: string,
  projectContext?: string,
  trackingContext?: LlmTrackingContext
): Promise<{
  success: boolean
  feature?: GeneratedFeature
  error?: string
}> {
  const decisions = resolvedItems
    .filter(item => item.status === 'answered' && item.answer)
    .map(item => {
      const base = `Q: ${item.whiteTextQuestion || item.question}\nA: ${item.answer}`
      const techMapping = formatItemTechnicalMapping(item)
      return techMapping ? `${base}\n${techMapping}` : base
    })
    .join('\n\n')

  // 提取與此 feature 相關的 technicalContext
  const relatedItems = resolvedItems.filter(item =>
    item.technicalContext?.impactedFeatures?.some(f =>
      f.toLowerCase().includes(featureInfo.actionName.toLowerCase()) ||
      featureInfo.name.includes(f)
    )
  )
  const featureSchemaHints = relatedItems.length > 0
    ? extractSchemaHints(relatedItems)
    : extractSchemaHints(resolvedItems)

  const systemPrompt = `你是一位資深的 BDD 分析師。請為指定的功能產出 Gherkin Feature File。

## 目標功能
- 名稱：${featureInfo.name}
- Action：${featureInfo.actionName}
- 描述：${featureInfo.description}

## sdd.os ISA 格式規範

### ⚠️ 無腦補原則（最高優先）
**嚴格遵守需求和釐清決策，不擅自假設任何功能、欄位或行為。** 如果需求沒提到的東西，就不要加。

### Given 設定方式選擇指引
| 判定條件 | 選擇 | 範例 |
|----------|------|------|
| 簡單 Invariant（單一欄位約束） | Choice A: 直接用 \`準備一個{entity}, with table:\` | price >= 0、status = 'active' |
| 複雜 Invariant（跨屬性計算） | Choice B: 用 \`{summary}, call table:\` 透過 Action 設定 | 總額 = 單價 × 數量 |
| 狀態流轉（需前置 Action 建立狀態） | Choice B: 用 Action 設定 | 訂單需先經過「建立」才能「取消」 |

### Given 步驟格式（資料準備）
- 資料準備：\`準備一個{entity}, with table:\`
- **簡單 Invariant**（如 price >= 0）→ 直接用 \`準備一個{entity}, with table:\` 設定資料
- **複雜 Invariant**（跨屬性計算、狀態流轉）→ 用 \`{summary}, call table:\` 透過 Action 設定

### When 步驟格式（Action 呼叫）
- Action 呼叫：\`{summary}, call table:\`

### Then 步驟格式（回應驗證）
- 成功回應：\`{summary}成功, with table:\`
- 操作失敗：\`操作失敗\`
- Entity 驗證：\`存在一個{entity}, with table:\`

### 必要 Header（檔案開頭）
- \`# Action: actionName\`：標註這是哪個 Action（camelCase 或 snake_case）
- \`# Summary: xxx\`：Action 的一句話說明

## 四類規則分類法（關鍵 ⚠️）

每條 Rule **必須**標註四類之一，不可使用舊的 @Pre/@Post：

| 類型 | 說明 | 失敗的 Then |
|------|------|------------|
| \`前置（狀態）\` | 系統既有狀態約束（如庫存>0） | \`Then 操作失敗\` |
| \`前置（參數）\` | 輸入參數約束（如數量>0、必填） | \`Then 操作失敗\` |
| \`後置（回應）\` | 回傳資料預期（查詢類功能用） | \`Then {summary}成功, with table:\` |
| \`後置（狀態）\` | 資料庫狀態變化（命令類功能用） | \`Then {summary}成功, with table:\` + Entity 驗證 |

### Rule 命名句型（嚴格遵守）

\`\`\`
Rule: <四類前綴> - <主詞> 必須/應 <單一條件>
\`\`\`

正確範例：
- \`Rule: 前置（狀態）- 商品庫存必須充足\`
- \`Rule: 前置（參數）- 必要參數必須提供\`
- \`Rule: 後置（狀態）- 訂單總額應為所有品項小計加總\`
- \`Rule: 後置（回應）- 查詢結果應包含訂單明細\`

### Rule 原子化判定
- 包含「且」「和」「並且」→ **必須拆分**為多條 Rule
- 包含「或」→ 保留為單條（or 條件）
- 混合前後置條件 → **必須拆分**（前置一條、後置一條）

### 每個 Feature 至少必須有
- 至少 1 條「前置（參數）」Rule（必要參數檢查）
- 至少 1 條「後置」Rule（回應或狀態）

## 輸出格式
直接輸出完整的 .feature 檔案內容，不需要 JSON 包裝。

\`\`\`gherkin
# Action: ${featureInfo.actionName}
# Summary: ${featureInfo.description}
Feature: ${featureInfo.name}

  Background:
    Given 準備一個{entity}, with table:
      | 欄位 | 值 |

  # ========== 前置條件 ==========

  Rule: 前置（狀態）- 規則描述

    Example: 情境說明
      When {summary}, call table:
        | 欄位 | 值 |
      Then 操作失敗

  Rule: 前置（參數）- 規則描述

    Example: 情境說明
      When {summary}, call table:
        | 欄位 | 值 |
      Then 操作失敗

  # ========== 後置條件 ==========

  Rule: 後置（狀態）- 規則描述

    Example: 情境說明
      When {summary}, call table:
        | 欄位 | 值 |
      Then {summary}成功, with table:
        | 欄位 | 值 |
      And 存在一個{entity}, with table:
        | 欄位 | 值 |
\`\`\`

## 規則
- 檔案開頭必須用 \`# Action: actionName\` 而非 \`@Action()\`
- 每條 Rule 標註四類之一（前置（狀態）/前置（參數）/後置（回應）/後置（狀態）），**禁止使用舊的 @Pre/@Post**
- Rule 命名遵循嚴格句型：\`<四類前綴> - <主詞> 必須/應 <單一條件>\`
- 每條 Rule 只驗證一件事（原子化）— 包含「且/和/並且」必須拆分
- 每條 Rule 至少有一個 Example
- 邊界條件要有對應的 Example
- 使用 Entity Mapping 中的中文實體名
- DataTable 命名慣例：
  - Actor（人物）用 name 當 Key：\`| name | Alice |\`，不用 \`| userId | 1 |\`
  - 資源/物件用語義 ID：\`| productId | P001 |\`、\`| orderId | ORD-001 |\`
  - 欄位名用 camelCase（\`totalAmount\`、\`memberLevel\`）
  - JSON 值整體用雙引號：\`[{"productId":"P001","quantity":2}]\`
  - 布林值用 true/false，列舉值用原始大寫（如 PENDING、ACTIVE）
  - 禁止模糊描述（如「某商品」「一些數量」），必須用具體值
- **無腦補原則**：嚴格按需求和決策來，不擅自添加需求中沒提到的欄位或功能

## Scenario Outline（合併同模式的參數驗證）
當多個 Example 共享同一驗證模式（例如「缺少必要參數 → 失敗」），**可以考慮**使用 Scenario Outline 合併：

\`\`\`gherkin
  Rule: 前置（參數）- 必要參數必須提供

    Scenario Outline: 缺少 <缺少參數> 時操作失敗
      When {summary}, call table:
        | 欄位1 | 欄位2  |
        | <值1> | <值2>  |
      Then 操作失敗

      Examples:
        | 缺少參數 | 值1 | 值2 |
        | 參數A   |     | 有效值 |
        | 參數B   | 有效值 |     |
\`\`\`

**判斷原則**：
- 適用：多個缺少必要參數的情境（模式完全相同，只是缺少的欄位不同）
- 不適用：有領域特定約束的規則（如「數量>0」「金額≥最低消費」）→ 各自獨立 Rule
- 不適用：成功路徑（後置規則）→ 通常各有不同驗證邏輯`

  const userMessage = `${projectContext ? `專案背景：${projectContext}\n\n` : ''}需求描述：
${requirements}

---

SQL Schema：
\`\`\`sql
${schemaSql}
\`\`\`

Entity Mapping：
\`\`\`yaml
${entityMapping}
\`\`\`

---

釐清決策：
${decisions || '（無額外決策）'}${featureSchemaHints ? `

---

${featureSchemaHints}` : ''}`

  const response = await callClaude(systemPrompt, userMessage, { maxTokens: 8192 })

  if (!response.success) {
    return { success: false, error: response.error }
  }

  // 記錄使用量
  if (response.inputTokens && response.outputTokens) {
    const costUsd = (response.inputTokens * SONNET_PRICING.input + response.outputTokens * SONNET_PRICING.output) / 1000000
    await recordLlmUsage({
      model: MODEL.SONNET,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      costUsd,
      purpose: 'formulation_generate_feature',
      userId: trackingContext?.userId,
      conversationId: trackingContext?.conversationId,
    }).catch(err => logger.error({ err }, '記錄使用量失敗'))
  }

  // 提取 Gherkin 內容
  const gherkinMatch = response.content?.match(/```gherkin\s*([\s\S]*?)\s*```/)
  const content = gherkinMatch ? gherkinMatch[1].trim() : response.content?.trim() || ''

  if (!content) {
    return { success: false, error: '生成的 Feature 內容為空' }
  }

  return {
    success: true,
    feature: {
      name: featureInfo.name,
      actionName: featureInfo.actionName,
      content,
    },
  }
}

// ============================================================
// 完整的 Formulation 流程
// ============================================================

export interface FormulationCheckpoint {
  schemaSql: string
  entityMapping: string
  identifiedFeatures: FeatureInfo[]
  completedNames: string[]
  totalExpected: number
}

export interface FormulationOptions {
  onCheckpoint?: (checkpoint: FormulationCheckpoint) => Promise<void>
  resumeFrom?: {
    schemaSql: string
    entityMapping: string
    identifiedFeatures: FeatureInfo[]
    completedNames: string[]
  }
}

export async function runFormulation(
  requirements: string,
  resolvedItems: ClarifyItem[],
  projectContext?: string,
  onProgress?: (step: string, current: number, total: number, detail?: string) => Promise<void>,
  trackingContext?: LlmTrackingContext,
  options?: FormulationOptions
): Promise<FormulationResult> {
  try {
    let schemaSql: string
    let entityMapping: string
    let featureList: FeatureInfo[]

    if (options?.resumeFrom) {
      // ── 從 checkpoint 恢復，跳過 Step 1 和 Step 2 ──
      logger.info({ completedCount: options.resumeFrom.completedNames.length }, '從 checkpoint 恢復')
      schemaSql = options.resumeFrom.schemaSql
      entityMapping = options.resumeFrom.entityMapping
      featureList = options.resumeFrom.identifiedFeatures
    } else {
      // Step 1: 生成 SQL Schema
      if (onProgress) {
        await onProgress('schema', 1, 3, '生成資料模型...')
      }

      const schemaResult = await generateSchemaSql(requirements, resolvedItems, projectContext, trackingContext)
      if (!schemaResult.success || !schemaResult.schemaSql) {
        return { success: false, error: schemaResult.error || '生成 Schema 失敗' }
      }
      schemaSql = schemaResult.schemaSql
      entityMapping = schemaResult.entityMapping || ''

      // Step 2: 識別 Features
      if (onProgress) {
        await onProgress('identify', 2, 3, '識別功能模組...')
      }

      const identifyResult = await identifyFeatures(
        requirements,
        resolvedItems,
        schemaSql,
        projectContext,
        trackingContext
      )
      if (!identifyResult.success || !identifyResult.features || identifyResult.features.length === 0) {
        return { success: false, error: identifyResult.error || '識別 Features 失敗' }
      }
      featureList = identifyResult.features

      // Step 1&2 完成，保存 checkpoint
      if (options?.onCheckpoint) {
        await options.onCheckpoint({
          schemaSql,
          entityMapping,
          identifiedFeatures: featureList,
          completedNames: [],
          totalExpected: featureList.length,
        })
      }
    }

    // Step 3: 逐個生成 Features
    if (onProgress) {
      await onProgress('features', 3, 3, `生成 ${featureList.length} 個功能規格...`)
    }

    const completedNamesSet = new Set(options?.resumeFrom?.completedNames || [])
    const generatedFeatures: GeneratedFeature[] = []
    let sinceLastCheckpoint = 0

    for (let i = 0; i < featureList.length; i++) {
      const featureInfo = featureList[i]

      // 跳過已完成的 feature（恢復模式）
      if (completedNamesSet.has(featureInfo.actionName)) {
        logger.info({ actionName: featureInfo.actionName }, '跳過已完成的 Feature')
        continue
      }

      if (onProgress) {
        await onProgress('feature', i + 1, featureList.length, featureInfo.name)
      }

      const result = await generateSingleFeature(
        featureInfo,
        requirements,
        resolvedItems,
        schemaSql,
        entityMapping,
        projectContext,
        trackingContext
      )

      if (result.success && result.feature) {
        generatedFeatures.push(result.feature)
        completedNamesSet.add(featureInfo.actionName)
        sinceLastCheckpoint++

        // 每 3 個 feature 保存一次 checkpoint
        if (sinceLastCheckpoint >= 3 && options?.onCheckpoint) {
          sinceLastCheckpoint = 0
          await options.onCheckpoint({
            schemaSql,
            entityMapping,
            identifiedFeatures: featureList,
            completedNames: Array.from(completedNamesSet),
            totalExpected: featureList.length,
          })
          logger.info({ completed: completedNamesSet.size, total: featureList.length }, 'Checkpoint 已保存')
        }
      } else {
        logger.error({ featureName: featureInfo.name, error: result.error }, '生成 Feature 失敗')
        // 繼續生成其他 Features
      }
    }

    if (generatedFeatures.length === 0 && completedNamesSet.size === 0) {
      return { success: false, error: '沒有成功生成任何 Feature' }
    }

    logger.info({ generated: generatedFeatures.length, total: completedNamesSet.size }, 'Formulation 完成')

    return {
      success: true,
      schemaSql,
      entityMapping,
      features: generatedFeatures,
    }
  } catch (error) {
    logger.error({ err: error }, '執行失敗')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================
// 修復多個 Feature Files
// ============================================================

export interface FeatureFixInput {
  name: string
  actionName: string
  content: string
  issues: string[]  // 需要修復的問題描述
}

export async function fixMultipleFeatures(
  features: FeatureFixInput[],
  resolvedItems: ClarifyItem[],
  schemaSql: string,
  entityMapping: string,
  trackingContext?: LlmTrackingContext
): Promise<{
  success: boolean
  fixedFeatures?: GeneratedFeature[]
  error?: string
}> {
  if (features.length === 0) {
    return { success: true, fixedFeatures: [] }
  }

  // 構建用戶釐清決策（所有批次共用）
  const decisions = resolvedItems
    .filter(item => item.status === 'answered' && item.answer)
    .map(item => `Q: ${item.whiteTextQuestion || item.question}\nA: ${item.answer}`)
    .join('\n\n')

  const BATCH_SIZE = 3

  // ── 內部函數：修復一批 Features ──
  async function fixFeatureBatch(
    batch: FeatureFixInput[],
    batchLabel: string
  ): Promise<{ success: boolean; fixedFeatures?: GeneratedFeature[]; error?: string }> {
    const systemPrompt = `你是一位 sdd.os ISA Gherkin 專家。請根據用戶反饋修正以下 Feature Files。

## sdd.os ISA 格式規範
1. 檔案開頭必須有 \`# Action: actionName\` 和 \`# Summary:\` 註解
2. 每個 Rule 必須標註**四類之一**：\`前置（狀態）\`、\`前置（參數）\`、\`後置（回應）\`、\`後置（狀態）\`
3. **禁止使用舊的 @Pre/@Post**，必須使用四類前綴
4. Rule 命名句型：\`<四類前綴> - <主詞> 必須/應 <單一條件>\`
5. When 格式：\`{summary}, call table:\`
6. Then 成功格式：\`{summary}成功, with table:\`
7. Then 失敗格式：\`操作失敗\`
8. Entity 驗證格式：\`存在一個{entity}, with table:\`
9. Given 資料準備：\`準備一個{entity}, with table:\`

## 四類規則分類
- **前置（狀態）**：系統既有狀態約束（如庫存>0）
- **前置（參數）**：輸入參數約束（如數量>0、必填欄位）
- **後置（回應）**：API 回傳資料預期（查詢類功能）
- **後置（狀態）**：資料庫狀態變化（命令類功能）

## 重要約束
修復時必須嚴格遵守：
1. 用戶在釐清階段做出的所有決策
2. Schema 定義的欄位名稱和類型
3. Entity Mapping 中的實體命名
4. 若原有 @Pre → 改為「前置（狀態）」或「前置（參數）」（根據內容判斷）
5. 若原有 @Post → 改為「後置（回應）」或「後置（狀態）」（根據內容判斷）

## 輸出格式
只輸出 JSON，不要加任何解釋、分析、或前言文字。直接以 { 開頭。
\`\`\`json
{
  "features": [
    { "name": "Feature名稱", "actionName": "action_name", "content": "修正後的完整 gherkin 內容" }
  ]
}
\`\`\``

    const featuresContent = batch.map(f =>
      `### Feature: ${f.name} (${f.actionName})\n\n**需修復的問題**:\n${f.issues.map((e, i) => `${i + 1}. ${e}`).join('\n')}\n\n**當前內容**:\n\`\`\`gherkin\n${f.content}\n\`\`\``
    ).join('\n\n---\n\n')

    const userMessage = `## 需要修復的 Feature Files

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

${decisions ? `---

## 用戶釐清決策（修復時必須遵守）

${decisions}` : ''}

重要：只輸出 JSON，不要加任何解釋。直接以 { 開頭，以 } 結尾。`

    logger.info({ batchLabel, featureCount: batch.length }, '修復 Features...')
    const response = await callClaude(systemPrompt, userMessage, { maxTokens: 16384, temperature: 0.1 })

    if (!response.success) {
      return { success: false, error: response.error }
    }

    // 記錄使用量
    if (response.inputTokens && response.outputTokens) {
      const costUsd = (response.inputTokens * SONNET_PRICING.input + response.outputTokens * SONNET_PRICING.output) / 1000000
      await recordLlmUsage({
        model: MODEL.SONNET,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        costUsd,
        purpose: 'formulation_fix_features',
        userId: trackingContext?.userId,
        conversationId: trackingContext?.conversationId,
      }).catch(err => logger.error({ err }, '記錄使用量失敗'))
    }

    try {
      const parsed = safeParseJson<{ features?: GeneratedFeature[] }>(response.content || '')
      if (!parsed) {
        logger.error({ batchLabel, rawResponse: response.content?.substring(0, 500) }, 'LLM 回應無法解析為 JSON')
        return { success: false, error: '無法解析 LLM 回應' }
      }

      logger.info({ batchLabel, fixedCount: parsed.features?.length || 0 }, '修復完成')
      return {
        success: true,
        fixedFeatures: parsed.features || [],
      }
    } catch (err) {
      return { success: false, error: `解析回應時發生錯誤: ${err}` }
    }
  }

  // ── 主邏輯：≤3 個直接修，>3 個分批 ──

  if (features.length <= BATCH_SIZE) {
    return await fixFeatureBatch(features, '修復')
  }

  // 分批修復
  logger.info({ featureCount: features.length, batchSize: BATCH_SIZE }, '啟用分批修復')
  const allFixed: GeneratedFeature[] = []
  let batchIndex = 0

  for (let i = 0; i < features.length; i += BATCH_SIZE) {
    batchIndex++
    const batch = features.slice(i, i + BATCH_SIZE)
    const batchLabel = `批次 ${batchIndex}/${Math.ceil(features.length / BATCH_SIZE)}`

    const result = await fixFeatureBatch(batch, batchLabel)
    if (result.success && result.fixedFeatures) {
      allFixed.push(...result.fixedFeatures)
    } else {
      logger.warn({ batchLabel, failedCount: batch.length }, '批次修復失敗，保留原始 Features')
      allFixed.push(...batch.map(f => ({ name: f.name, actionName: f.actionName, content: f.content })))
    }
  }

  logger.info({ totalFixed: allFixed.length }, '分批修復完成')
  return { success: true, fixedFeatures: allFixed }
}

// ============================================================
// Draft Batch Mode（ES → 一次性草稿生成）
// ============================================================

export interface DraftBatchResult {
  success: boolean
  schemaSql?: string
  entityMapping?: string
  features?: GeneratedFeature[]
  uncertainItems?: string[]
  error?: string
}

/**
 * ES 完成後，一次性生成所有 Feature + Schema + Actions 草稿
 * 用戶審閱確認後再進入 Spec Discovery
 */
export async function generateDraftBatch(
  esDocumentContent: string,
  requirements: string,
  resolvedItems: ClarifyItem[],
  projectContext?: string,
  trackingContext?: LlmTrackingContext
): Promise<DraftBatchResult> {
  const decisions = resolvedItems
    .filter(item => item.status === 'answered' && item.answer)
    .map(item => `Q: ${item.whiteTextQuestion || item.question}\nA: ${item.answer}`)
    .join('\n\n')

  const systemPrompt = `你是一位資深的 BDD 分析師和資料庫架構師。根據 Event Storming 分析結果和需求，一次性產出完整的規格草稿。

## 任務
1. 分析 ES 文檔中所有 clear 的 Commands 和 ReadModels
2. 生成 SQL Schema（每個 Aggregate 對應一個 Table）
3. 生成 Entity Mapping（中文↔英文）
4. 為每個 clear 的 Command/ReadModel 生成一個 Feature File
5. 標記不確定的項目（ES 中標記為「待澄清」的）

## sdd.os ISA 格式規範
- 檔案開頭：\`# Action: actionName\` + \`# Summary: xxx\`
- Given：\`準備一個{entity}, with table:\`
- When：\`{summary}, call table:\`
- Then 成功：\`{summary}成功, with table:\`
- Then 失敗：\`操作失敗\`
- Entity 驗證：\`存在一個{entity}, with table:\`
- Rule 四類前綴：前置（狀態）/前置（參數）/後置（回應）/後置（狀態）
- Rule 命名：\`<四類前綴> - <主詞> 必須/應 <單一條件>\`

## 無腦補原則
嚴格按 ES 分析結果和需求來，不擅自假設。

## 輸出格式
\`\`\`json
{
  "schemaSql": "完整的 SQL DDL",
  "entityMapping": "YAML 格式",
  "features": [
    {
      "name": "功能中文名稱",
      "actionName": "create_xxx",
      "content": "完整的 .feature 檔案內容"
    }
  ],
  "uncertainItems": ["待澄清項目1的描述", "待澄清項目2的描述"]
}
\`\`\``

  const userMessage = `${projectContext ? `專案背景：${projectContext}\n\n` : ''}需求描述：
${requirements}

---

## Event Storming 分析結果
${esDocumentContent}

---

釐清決策：
${decisions || '（無額外決策）'}`

  logger.info('Draft Batch: 開始一次性生成草稿...')
  const response = await callClaude(systemPrompt, userMessage, { maxTokens: 16384 })

  if (!response.success) {
    return { success: false, error: response.error }
  }

  // 記錄使用量
  if (response.inputTokens && response.outputTokens) {
    const costUsd = (response.inputTokens * SONNET_PRICING.input + response.outputTokens * SONNET_PRICING.output) / 1000000
    await recordLlmUsage({
      model: MODEL.SONNET,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      costUsd,
      purpose: 'formulation_draft_batch',
      userId: trackingContext?.userId,
      conversationId: trackingContext?.conversationId,
    }).catch(err => logger.error({ err }, '記錄使用量失敗'))
  }

  try {
    const parsed = safeParseJson<{ features?: GeneratedFeature[]; uncertainItems?: string[]; schemaSql?: string; entityMapping?: string }>(response.content || '')
    if (!parsed) {
      logger.error('Draft Batch LLM 回應無法解析為 JSON')
      return { success: false, error: '無法解析 LLM 回應' }
    }

    const features = (parsed.features || []) as GeneratedFeature[]
    const uncertainItems = (parsed.uncertainItems || []) as string[]

    logger.info({ featureCount: features.length, uncertainCount: uncertainItems.length }, 'Draft Batch 完成')

    return {
      success: true,
      schemaSql: parsed.schemaSql,
      entityMapping: parsed.entityMapping,
      features,
      uncertainItems,
    }
  } catch (err) {
    logger.error({ err }, 'Draft Batch JSON 解析失敗')
    return { success: false, error: `解析回應時發生錯誤: ${err}` }
  }
}
