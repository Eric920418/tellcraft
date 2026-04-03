import { z } from 'zod'
import { createLogger } from '../lib/logger'
import { getAnthropicHeaders, MODEL, trackLlmUsage, buildCacheableSystem, type CacheableSystemPrompt } from '../lib/anthropic'
import { getEnv } from '../lib/env'
import { callStructured } from '../lib/structured-output'
import { ClarifyItem, TechnicalContext } from './bdd-session'
import { LlmTrackingContext } from './classifier'

const logger = createLogger('formulation')

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

/**
 * BDD Feature 後置驗證：零 LLM，自動修正 LLM 常犯的格式錯誤。
 * 在 Feature 生成後、保存到 DB 前執行。
 */
export function sanitizeFeatureContent(content: string): { content: string; fixes: string[] } {
  const fixes: string[] = []
  let result = content

  // 1. 回應, with JSON: → 回應, with table:（DataTable 格式是標準，JSON 格式容易匹配失敗）
  result = result.replace(/回應,\s*with JSON:/g, () => {
    fixes.push('回應, with JSON: → 回應, with table:')
    return '回應, with table:'
  })

  // 2. 回應為, with JSON: → 回應, with table:（統一用 DataTable 格式）
  result = result.replace(/回應為,\s*with JSON:/g, () => {
    fixes.push('回應為, with JSON: → 回應, with table:')
    return '回應, with table:'
  })

  // 3. entity_validate header 中的 > 前綴移除（>id → id）
  // 匹配: 應該存在/不存在一個..., with table:\n    | >field | → | field |
  const entityValidateHeaderRegex = /((?:應該(?:不)?存在一個)[^\n]+with\s+table:\s*\n\s*\|[^\n]*?)(\|)\s*>(\w[\w.]*)/g
  let entityValidateMatch: RegExpExecArray | null
  const entityValidateReplacements: Array<{ original: string; replacement: string }> = []
  while ((entityValidateMatch = entityValidateHeaderRegex.exec(result)) !== null) {
    entityValidateReplacements.push({
      original: entityValidateMatch[0],
      replacement: `${entityValidateMatch[1]}${entityValidateMatch[2]} ${entityValidateMatch[3]}`,
    })
    fixes.push(`entity_validate header >${entityValidateMatch[3]} → ${entityValidateMatch[3]}`)
  }
  for (const { original, replacement } of entityValidateReplacements) {
    result = result.replace(original, replacement)
  }

  return { content: result, fixes }
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
  systemPrompt: CacheableSystemPrompt,
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
        usage?: { input_tokens: number; output_tokens: number; cache_creation_input_tokens?: number; cache_read_input_tokens?: number }
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

  const systemPrompt = `你是一位資深的資料庫架構師。根據需求和釐清決策，產出 **PostgreSQL** SQL Schema 和 Entity 映射。

## 輸出格式

### 1. SQL Schema (schema.sql) — PostgreSQL（Neon）
\`\`\`sql
CREATE TABLE table_name (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    amount NUMERIC(10, 2),
    status VARCHAR(50),
    CONSTRAINT chk_status CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`

### 2. Entity Mapping (YAML)
\`\`\`yaml
entity_to_table_mapping:
  - 中文實體名: table_name
\`\`\`

## PostgreSQL 型別規則（嚴格遵守）
- 目標資料庫是 **PostgreSQL（Neon）**，禁止使用 MySQL 語法
- ID 欄位一律用 \`UUID PRIMARY KEY DEFAULT gen_random_uuid()\`
- 字串用 \`VARCHAR(n)\` 或 \`TEXT\`
- 整數用 \`INTEGER\` 或 \`SMALLINT\` 或 \`BIGINT\`
- 布林用 \`BOOLEAN\`
- 小數用 \`NUMERIC(precision, scale)\`
- 浮點用 \`DOUBLE PRECISION\` 或 \`REAL\`
- 時間用 \`TIMESTAMPTZ\`
- 枚舉用 \`VARCHAR(50) + CHECK\` constraint
- 禁止：TINYINT、MEDIUMINT、DOUBLE（不帶 PRECISION）、FLOAT、AUTO_INCREMENT、UNSIGNED、COMMENT '...'、ENUM()、DATETIME

## 其他規則
- 限制條件用 CHECK constraint 表達
- 使用 snake_case 命名
- 不要假設需求中沒有的欄位

輸出 JSON 格式：
\`\`\`json
{
  "schemaSql": "完整的 PostgreSQL DDL",
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
  const SchemaResultSchema = z.object({
    schemaSql: z.string(),
    entityMapping: z.string(),
  })

  const result = await callStructured({
    schema: SchemaResultSchema,
    model: MODEL.SONNET,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
    maxTokens: 8192,
    temperature: 0.2,
    purpose: 'formulation_schema',
    trackingContext,
  })

  if (!result.success) {
    logger.error({ error: result.error }, 'Schema LLM 回應失敗')
    return { success: false, error: result.error }
  }

  logger.info('SQL Schema 生成完成')
  return {
    success: true,
    schemaSql: result.data.schemaSql,
    entityMapping: result.data.entityMapping,
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
  const IdentifyFeaturesSchema = z.object({
    features: z.array(z.object({
      name: z.string(),
      actionName: z.string(),
      description: z.string(),
    })),
  })

  const result = await callStructured({
    schema: IdentifyFeaturesSchema,
    model: MODEL.SONNET,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
    maxTokens: 8192,
    temperature: 0.2,
    purpose: 'formulation_identify_features',
    trackingContext,
  })

  if (!result.success) {
    logger.error({ error: result.error }, 'Features LLM 回應失敗')
    return { success: false, error: result.error }
  }

  logger.info({ featureCount: result.data.features.length }, '識別 Features 完成')
  return {
    success: true,
    features: result.data.features,
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

  // ── Prompt Caching: 靜態 ISA 規則放 Block 1（跨 feature 快取），動態 feature info 放 Block 2 ──
  const staticSystemPrompt = `你是一位資深的 BDD 分析師。請為指定的功能產出 Gherkin Feature File。

## sdd.os ISA SpecFormula 標準格式規範

### ⚠️ 無腦補原則（最高優先）
**嚴格遵守需求和釐清決策，不擅自假設任何功能、欄位或行為。** 如果需求沒提到的東西，就不要加。

### VAR 系統（取代硬編碼 UUID）
| 前綴 | 用途 | 範例 |
|------|------|------|
| \`>\` | Given 中宣告 Context Key | \`>TestUser.id\` |
| \`$\` | 引用之前宣告的值 | \`$TestUser.id\` |
| \`<\` | 捕捉執行結果 | \`<userId\` |
- \`$notnull\` 表示非空即可

### Given 設定方式選擇指引
| 判定條件 | 選擇 | 範例 |
|----------|------|------|
| 簡單 Invariant（單一欄位約束） | Choice A: 直接用 \`準備一個{entity}, with table:\` | price >= 0、status = 'active' |
| 複雜 Invariant（跨屬性計算） | Choice B: 用 \`(UID="$var") {summary}, call table:\` 透過 Action 設定 | 總額 = 單價 × 數量 |
| 狀態流轉（需前置 Action 建立狀態） | Choice B: 用 Action 設定 | 訂單需先經過「建立」才能「取消」 |

### Given 步驟格式（資料準備）
- 資料準備：\`準備一個{entity}, with table:\`（使用 \`>contextKey\` / \`<executionKey\`）
- 時間控制：\`現在時間為 "{datetime}"\`

### When 步驟格式（Action 呼叫，必須有 Actor 前綴）
- 無身份：\`(No Actor) {summary}, call table:\`
- 帶身份：\`(UID="$var") {summary}, call table:\`

### Then 步驟格式（回應驗證，含 HTTP status code）
- 成功回應：\`{summary}(STATUS)回應, with table:\`（如 201、200）
- 成功回應 JSON：\`{summary}(STATUS)回應為, with JSON:\`
- 操作失敗：\`操作失敗\`
- Entity 存在驗證：\`應該存在一個{entity}, with table:\`
- Entity 不存在驗證：\`應該不存在一個{entity}, with table:\`

### 必要 Header（檔案開頭）
- \`# Action: actionName\`：標註這是哪個 Action（camelCase 或 snake_case）
- \`# [METHOD] /path\`：HTTP method 和 API 路徑
- \`# Summary: xxx\`：Action 的一句話說明

## 四類規則分類法（關鍵 ⚠️）

每條 Rule **必須**標註四類之一，不可使用舊的 @Pre/@Post：

| 類型 | 說明 | 失敗的 Then |
|------|------|------------|
| \`前置（狀態）\` | 系統既有狀態約束（如庫存>0） | \`Then 操作失敗\` |
| \`前置（參數）\` | 輸入參數約束（如數量>0、必填） | \`Then 操作失敗\` |
| \`後置（回應）\` | 回傳資料預期（查詢類功能用） | \`Then {summary}(200)回應, with table:\` |
| \`後置（狀態）\` | 資料庫狀態變化（命令類功能用） | \`Then {summary}(201)回應, with table:\` + Entity 驗證 |

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
- 至少 1 條「後置」Rule（回應或狀態）`

  const dynamicSystemPrompt = `## 目標功能
- 名稱：${featureInfo.name}
- Action：${featureInfo.actionName}
- 描述：${featureInfo.description}

## 輸出格式
直接輸出完整的 .feature 檔案內容，不需要 JSON 包裝。

\`\`\`gherkin
# Action: ${featureInfo.actionName}
# [POST] /api/path
# Summary: ${featureInfo.name}
Feature: ${featureInfo.name}

  Background:
    Given 準備一個{entity}, with table:
      | >Entity1.id | 欄位 |
      | <entity1Id  | 值   |

  # ========== 前置條件 ==========

  Rule: 前置（狀態）- 規則描述

    Example: 情境說明
      When (UID="$Entity.id") {summary}, call table:
        | 欄位        | 值 |
        | $Entity2.id | 值 |
      Then 操作失敗

  Rule: 前置（參數）- 規則描述

    Example: 情境說明
      When (No Actor) {summary}, call table:
        | 欄位 | 值 |
      Then 操作失敗

  # ========== 後置條件 ==========

  Rule: 後置（回應）- 規則描述

    Example: 情境說明
      When (UID="$Entity.id") {summary}, call table:
        | 欄位 | 值 |
      Then {summary}(200)回應, with table:
        | id         | 欄位     |
        | $Entity.id | $notnull |

  Rule: 後置（狀態）- 規則描述

    Example: 情境說明
      When (UID="$Entity.id") {summary}, call table:
        | 欄位 | 值 |
      Then {summary}(201)回應, with table:
        | >result.id | 欄位         |
        | <resultId  | 值           |
      And 應該存在一個{entity}, with table:
        | id        | 欄位     | 狀態欄位 |
        | $resultId | 預期值   | 預期狀態 |
\`\`\`

## 規則
- 檔案開頭必須用 \`# Action: actionName\`、\`# [METHOD] /path\`、\`# Summary: xxx\`
- 每條 Rule 標註四類之一（前置（狀態）/前置（參數）/後置（回應）/後置（狀態）），**禁止使用舊的 @Pre/@Post**
- Rule 命名遵循嚴格句型：\`<四類前綴> - <主詞> 必須/應 <單一條件>\`
- 每條 Rule 只驗證一件事（原子化）— 包含「且/和/並且」必須拆分
- 每條 Rule 至少有一個 Example
- 邊界條件要有對應的 Example
- 使用 Entity Mapping 中的中文實體名
- **必須使用 VAR 系統**：\`>contextKey\` 在 Given 宣告、\`$variable\` 引用、\`<executionKey\` 捕捉結果，禁止硬編碼 UUID
- **>contextKey 命名規則（關鍵 ⚠️）**：
  - 用**首字母大寫的概念名 + 數字後綴**：\`>List1.id\`、\`>Todo1.id\`、\`>User1.id\`
  - **禁止用 table name（複數）**：\`>lists.id\`（❌）、\`>todos.id\`（❌）、\`>users.id\`（❌）
  - 同類型多個實體用數字區分：\`>Product1.id\`、\`>Product2.id\`
  - 只有一個實體時也要用概念名：\`>List1.id\`（不是 \`>lists.id\`）
  - \`<executionKey\` 的名稱必須與後續 \`$variable\` 引用匹配：\`<listId\` → \`$listId\`、\`<list1Id\` → \`$list1Id\`
- **VAR 對齊規則（關鍵 ⚠️）**：
  - DataTable 中 Header 有 \`>contextKey\` → 同一欄的 Data **必須**是 \`<executionKey\`（配對捕獲）
  - Data 有 \`<executionKey\` → 同一欄的 Header **必須**有 \`>contextKey\`
  - 正確：\`| >User.id | name |\` → \`| <userId | "John" |\`
  - 錯誤：\`| >User.id | name |\` → \`| email | "John" |\`（data 缺 \`<\` 前綴）
  - 錯誤：\`| id | name |\` → \`| <userId | "John" |\`（header 缺 \`>\` 前綴）
  - Entity 準備（\`準備一個\`）的 DataTable data row **至少要有一個非空欄位值**，不可全空
  - **\`>contextKey\`/\`<executionKey\` 只用於 Given 準備（\`準備一個\`）和 Then 回應（\`(STATUS)回應\`）**：\`應該存在一個{entity}\` 的 DataTable header 用**純欄位名**（如 \`id\`、\`isCompleted\`），**禁止加 \`>\` 前綴**。正確：\`| id | isCompleted |\` → \`| $todo1Id | true |\`。錯誤：\`| >id | isCompleted |\` → \`| $todo1Id | true |\`（entity 驗證不需要擷取變數）
  - **\`&\` 約束標記（\`&isNull\`/\`&isNotNull\`/\`&isTrue\`/\`&isFalse\`）只用於 Then 驗證步驟**：Given 準備（\`準備一個\`）的 DataTable **禁止使用 \`&isNull\`**。要表達「欄位為空」→ 直接不填該欄位（DB 用 DEFAULT 或 NULL）。錯誤：\`| deleted_at |\` → \`| &isNull |\`。正確：不包含 \`deleted_at\` 欄位
- **When 必須有 Actor 前綴**：\`(No Actor)\` 或 \`(UID="$var")\`
- **Then 成功必須有 HTTP status code**：\`{summary}(201)回應, with table:\`
- **Then 的 summary 必須與 When 完全一致**：When 用 \`切換待辦事項完成狀態\`，Then 也用 \`切換待辦事項完成狀態(200)回應\`，不可縮寫
- **Array 回應多行驗證**：列表查詢的 Then 回應 DataTable 可以有多行來驗證多個陣列元素。行順序 = 陣列元素順序（第一行=第一個元素）。**禁止用 \`index\` 欄位**表示位置，直接用行順序。正確：\`| id | name | \\n | $list1Id | 工作 | \\n | $list2Id | 生活 |\`。錯誤：\`| index | name | \\n | 0 | 工作 |\`
- **Entity 驗證**：使用 \`應該存在一個\`（非舊的「存在一個」）
- DataTable 命名慣例：
  - 欄位名用 camelCase（\`totalAmount\`、\`memberLevel\`）
  - JSON 值整體用雙引號：\`[{"productId":"$Product1.id","quantity":2}]\`
  - 布林值用 true/false，列舉值用原始大寫（如 PENDING、ACTIVE）
  - 禁止模糊描述（如「某商品」「一些數量」），必須用具體值
- **級聯刪除後的 FK 驗證**：如果刪除了父實體（如清單），子實體（如待辦事項）的 FK 欄位（如 listId）會變為 null。entity_validate 應該用 \`&isNull\` 驗證 FK，不是用原來的 \`$variable\`。正確：\`| id | listId |\` → \`| $todo1Id | &isNull |\`。錯誤：\`| id | listId |\` → \`| $todo1Id | $list1Id |\`（list1Id 已被刪除，值不再是它的 UUID）
- **測試數據日期必須用未來日期**：截止日期、到期日等 DataTable 值用 \`2099-12-31\` 而非具體的過去日期，避免與 handler 的時間驗證衝突。正確：\`| dueDate | 2099-12-31 |\`。錯誤：\`| dueDate | 2025-12-31 |\`（可能早於 handler 執行時的 NOW()）
- **無腦補原則**：嚴格按需求和決策來，不擅自添加需求中沒提到的欄位或功能
- **Entity 必須存在於 Schema**：\`準備一個{entity}\` 和 \`應該存在一個{entity}\` 的 entity 名稱必須是 Schema 中已定義的資料表（透過 Entity Mapping 映射）。禁止發明 Schema 中不存在的 table（如 Schema 沒有 sessions 表就不能 \`準備一個sessions\`）
- **DataTable 欄位必須存在於 Schema**：DataTable 的 header 欄位名稱（camelCase）必須能映射到對應 table 的實際 column name（snake_case）。禁止使用 Schema 中不存在的欄位
- **回應驗證（Then 回應）DataTable 的 header 必須用純欄位名**：header 用 camelCase 欄位名（如 \`id\`、\`isCompleted\`、\`totalAmount\`），**禁止用 \`$Var.field\` 格式**（如 \`$Todo.id\`）。\`$variable\` 只能出現在 data row 的值中（引用之前宣告的變數），不能當 header。正確：\`| id | isCompleted |\` → \`| $Todo.id | true |\`。錯誤：\`| $Todo.id | $Todo.isCompleted |\` → \`| true | true |\`
- **Entity 驗證（應該存在一個）DataTable 必須包含至少一個主鍵或唯一識別欄位**：\`應該存在一個{entity}\` 的 DataTable header 至少要有一個 \`id\` 或可查詢欄位，讓 SpecFormula 能用 WHERE 條件查到精確的記錄。只有約束欄位（\`&isTrue\`、\`&isNotNull\`）不夠 — 需要至少一個具體值欄位。正確：\`| id | isDeleted |\` → \`| $Todo.id | &isTrue |\`。錯誤：\`| isDeleted |\` → \`| &isTrue |\`（缺少 ID，無法精確查詢）

## Array 類型參數（如拖曳排序、批次操作）

如果 action 需要接收多個 ID（如 orderedItemIds），在 DataTable 中用**逗號分隔 $variable**：
\`\`\`
| orderedItemIds                       |
| $Todo1.id,$Todo2.id,$Todo3.id        |
\`\`\`
禁止用 JSON array 格式（\`["...","..."]\`），因為 VAR-System 無法在 JSON 內解析 $variable。
Action 函數會自行 \`split(',')\` 處理。

## Scenario Outline（合併同模式的參數驗證）
當多個 Example 共享同一驗證模式（例如「缺少必要參數 → 失敗」），**可以考慮**使用 Scenario Outline 合併：

\`\`\`gherkin
  Rule: 前置（參數）- 必要參數必須提供

    Scenario Outline: 缺少 <缺少參數> 時操作失敗
      When (No Actor) {summary}, call table:
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

  const systemPrompt = buildCacheableSystem(staticSystemPrompt, dynamicSystemPrompt)

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
    trackLlmUsage({
      model: MODEL.SONNET,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      purpose: 'formulation_generate_feature',
      userId: trackingContext?.userId,
      conversationId: trackingContext?.conversationId,
    })
  }

  // 提取 Gherkin 內容
  const gherkinMatch = response.content?.match(/```gherkin\s*([\s\S]*?)\s*```/)
  const rawContent = gherkinMatch ? gherkinMatch[1].trim() : response.content?.trim() || ''

  if (!rawContent) {
    return { success: false, error: '生成的 Feature 內容為空' }
  }

  // 後置修正：與 fixMultipleFeatures/generateDraftBatch 一致
  const { content: sanitizedContent, fixes } = sanitizeFeatureContent(rawContent)
  if (fixes.length > 0) {
    logger.info({ featureName: featureInfo.name, fixes }, 'Feature 後置修正')
  }

  return {
    success: true,
    feature: {
      name: featureInfo.name,
      actionName: featureInfo.actionName,
      content: sanitizedContent,
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
  updatedSchemaSql?: string
  updatedEntityMapping?: string
  error?: string
}> {
  if (features.length === 0) {
    return { success: true, fixedFeatures: [] }
  }

  // Extended Thinking: 修復路徑用深度推理
  const env = getEnv()
  const thinkingConfig = env.ENABLE_EXTENDED_THINKING
    ? { type: 'enabled' as const, budget_tokens: env.EXTENDED_THINKING_BUDGET }
    : undefined

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
  ): Promise<{ success: boolean; fixedFeatures?: GeneratedFeature[]; updatedSchemaSql?: string; updatedEntityMapping?: string; error?: string }> {
    const systemPrompt = `你是一位 sdd.os ISA SpecFormula 標準 Gherkin 專家。請根據用戶反饋修正以下 Feature Files。

## sdd.os ISA SpecFormula 標準格式規範
1. 檔案開頭必須有 \`# Action: actionName\`、\`# [METHOD] /path\` 和 \`# Summary:\` 註解
2. 每個 Rule 必須標註**四類之一**：\`前置（狀態）\`、\`前置（參數）\`、\`後置（回應）\`、\`後置（狀態）\`
3. **禁止使用舊的 @Pre/@Post**，必須使用四類前綴
4. Rule 命名句型：\`<四類前綴> - <主詞> 必須/應 <單一條件>\`
5. When 格式：\`(No Actor|UID="$var") {summary}, call table:\`（必須有 Actor 前綴）
6. Then 成功格式：\`{summary}(STATUS)回應, with table:\`（必須有 HTTP status code）
7. Then 失敗格式：\`操作失敗\`
8. Entity 驗證格式：\`應該存在一個{entity}, with table:\` 或 \`應該不存在一個{entity}, with table:\`
9. Given 資料準備：\`準備一個{entity}, with table:\`
10. VAR 系統：\`>contextKey\` 宣告、\`$variable\` 引用、\`<executionKey\` 捕捉
11. **VAR 對齊規則**：Header 有 \`>contextKey\` → 同一欄 Data **必須**是 \`<executionKey\`；Data 有 \`<executionKey\` → 同一欄 Header **必須**有 \`>contextKey\`。範例：\`| >User.id | name |\` → \`| <userId | "John" |\` ✅。\`| >User.id | name |\` → \`| email | "John" |\` ❌
12. Entity 準備（\`準備一個\`）的 DataTable data row **至少要有一個非空欄位值**，不可全空
13. **DataTable 欄位必須存在於 Schema 中**：\`準備一個{entity}\` 的欄位名必須是對應資料表中的實際欄位（camelCase → snake_case 映射）

## 四類規則分類
- **前置（狀態）**：系統既有狀態約束（如庫存>0）
- **前置（參數）**：輸入參數約束（如數量>0、必填欄位）
- **後置（回應）**：API 回傳資料預期（查詢類功能）
- **後置（狀態）**：資料庫狀態變化（命令類功能）

## 重要約束
修復時必須嚴格遵守：
1. 用戶在釐清階段做出的所有決策
2. 若原有 @Pre → 改為「前置（狀態）」或「前置（參數）」（根據內容判斷）
3. 若原有 @Post → 改為「後置（回應）」或「後置（狀態）」（根據內容判斷）

## Schema 修改權限
- **預設情況**：Feature 修復應遵守現有 Schema 定義的欄位名稱和類型
- **允許修改 Schema 的情況**：當用戶釐清決策明確要求新增欄位、新增表、或修改欄位類型時，你**必須**同時修改 Schema SQL 和 Entity Mapping
- 修改 Schema 時，輸出完整的 SQL DDL（不是 diff），保留所有原有表和欄位
- 修改 Entity Mapping 時，輸出完整的 YAML（不是 diff），保留所有原有映射
- 如果不需要修改 Schema/Entity Mapping，對應欄位輸出 null

## 輸出格式
只輸出 JSON，不要加任何解釋、分析、或前言文字。直接以 { 開頭。
\`\`\`json
{
  "features": [
    { "name": "Feature名稱", "actionName": "action_name", "content": "修正後的完整 gherkin 內容" }
  ],
  "schemaSql": null,
  "entityMapping": null
}
\`\`\`
- \`schemaSql\`: 修改後的完整 SQL DDL，或 null（不需要修改時）
- \`entityMapping\`: 修改後的完整 YAML，或 null（不需要修改時）`

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
    const FixFeaturesSchema = z.object({
      features: z.array(z.object({
        name: z.string(),
        actionName: z.string(),
        content: z.string(),
      })),
      schemaSql: z.string().nullable(),
      entityMapping: z.string().nullable(),
    })

    const result = await callStructured({
      schema: FixFeaturesSchema,
      model: MODEL.SONNET,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      maxTokens: 16384,
      temperature: 0.1,
      thinking: thinkingConfig,
      purpose: 'formulation_fix_features',
      trackingContext,
    })

    if (!result.success) {
      logger.error({ batchLabel, error: result.error }, 'LLM 回應失敗')
      return { success: false, error: result.error }
    }

    const fixedFeatures = result.data.features as GeneratedFeature[]
    // 後置驗證：sanitizeFeatureContent 修正 Gherkin 內容格式錯誤
    for (const feature of fixedFeatures) {
      const { content: sanitized, fixes: featureFixes } = sanitizeFeatureContent(feature.content)
      if (featureFixes.length > 0) {
        feature.content = sanitized
        logger.info({ feature: feature.name, fixes: featureFixes }, '修復後 Feature 後置修正')
      }
    }
    const schemaChanged = !!result.data.schemaSql
    const mappingChanged = !!result.data.entityMapping
    if (schemaChanged || mappingChanged) {
      logger.info({ batchLabel, schemaChanged, mappingChanged }, '修復含 Schema/EntityMapping 更新')
    }
    logger.info({ batchLabel, fixedCount: fixedFeatures.length }, '修復完成')
    return {
      success: true,
      fixedFeatures,
      updatedSchemaSql: result.data.schemaSql || undefined,
      updatedEntityMapping: result.data.entityMapping || undefined,
    }
  }

  // ── 主邏輯：≤3 個直接修，>3 個分批 ──

  if (features.length <= BATCH_SIZE) {
    return await fixFeatureBatch(features, '修復')
  }

  // 分批修復
  logger.info({ featureCount: features.length, batchSize: BATCH_SIZE }, '啟用分批修復')
  const allFixed: GeneratedFeature[] = []
  let latestSchemaSql: string | undefined
  let latestEntityMapping: string | undefined
  let batchIndex = 0

  for (let i = 0; i < features.length; i += BATCH_SIZE) {
    batchIndex++
    const batch = features.slice(i, i + BATCH_SIZE)
    const batchLabel = `批次 ${batchIndex}/${Math.ceil(features.length / BATCH_SIZE)}`

    const result = await fixFeatureBatch(batch, batchLabel)
    if (result.success && result.fixedFeatures) {
      allFixed.push(...result.fixedFeatures)
      if (result.updatedSchemaSql) latestSchemaSql = result.updatedSchemaSql
      if (result.updatedEntityMapping) latestEntityMapping = result.updatedEntityMapping
    } else {
      logger.warn({ batchLabel, failedCount: batch.length }, '批次修復失敗，保留原始 Features')
      allFixed.push(...batch.map(f => ({ name: f.name, actionName: f.actionName, content: f.content })))
    }
  }

  logger.info({ totalFixed: allFixed.length, schemaUpdated: !!latestSchemaSql, mappingUpdated: !!latestEntityMapping }, '分批修復完成')
  return { success: true, fixedFeatures: allFixed, updatedSchemaSql: latestSchemaSql, updatedEntityMapping: latestEntityMapping }
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

## sdd.os ISA 格式規範（SpecFormula 標準）
- 檔案開頭：\`# Action: actionName\` + \`# [METHOD] /path\` + \`# Summary: xxx\`
- Given 資料準備：\`準備一個{entity}, with table:\`（DataTable 使用 VAR 系統）
- Given 時間控制：\`現在時間為 "{datetime}"\`
- When：\`(No Actor|UID="$var") {summary}, call table:\`（必須有 Actor 前綴）
- Then 成功：\`{summary}(STATUS)回應, with table:\`（STATUS 為 HTTP 狀態碼如 200/201）
- Then 成功 JSON：\`{summary}(STATUS)回應為, with JSON:\`
- Then 失敗：\`操作失敗\`
- Entity 驗證：\`應該存在一個{entity}, with table:\`
- Entity 不存在：\`應該不存在一個{entity}, with table:\`
- Rule 四類前綴：前置（狀態）/前置（參數）/後置（回應）/後置（狀態）
- Rule 命名：\`<四類前綴> - <主詞> 必須/應 <單一條件>\`

## VAR 系統
- \`>ContextName.field\`：Context Key，宣告一個可被後續引用的上下文物件
- \`<executionKey\`：Execution Key，捕獲執行時產生的值（如自動生成的 ID）
- \`$ContextName.field\`：Variable Reference，引用先前宣告的 Context Key 值
- \`$notnull\`：特殊值，驗證欄位不為 null

## PostgreSQL 型別規則（嚴格遵守）
- 目標資料庫是 **PostgreSQL（Neon）**，禁止使用 MySQL 語法
- ID：\`UUID PRIMARY KEY DEFAULT gen_random_uuid()\`
- 整數：\`INTEGER\` / \`SMALLINT\` / \`BIGINT\`（禁止 TINYINT/MEDIUMINT）
- 布林：\`BOOLEAN\`（禁止 TINYINT(1)）
- 時間：\`TIMESTAMPTZ\`（禁止 DATETIME）
- 浮點：\`DOUBLE PRECISION\` / \`REAL\`（禁止 DOUBLE/FLOAT）
- 枚舉：\`VARCHAR(50) + CHECK\`（禁止 ENUM()）
- 禁止：AUTO_INCREMENT、UNSIGNED、COMMENT '...'

## 無腦補原則
嚴格按 ES 分析結果和需求來，不擅自假設。

## 輸出格式
\`\`\`json
{
  "schemaSql": "完整的 PostgreSQL DDL",
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
  // 動態 maxTokens：每個 Feature 的 Gherkin 內容 ~1500 tokens + schema/entityMapping ~3000
  const estimatedFeatureCount = (esDocumentContent.match(/Command|ReadModel/gi) || []).length || 10
  const maxTokens = Math.min(Math.max(estimatedFeatureCount * 2000 + 5000, 16384), 65536)

  const DraftBatchSchema = z.object({
    schemaSql: z.string().nullable(),
    entityMapping: z.string().nullable(),
    features: z.array(z.object({
      name: z.string(),
      actionName: z.string(),
      content: z.string(),
    })),
    uncertainItems: z.array(z.string()).nullable(),
  })

  const result = await callStructured({
    schema: DraftBatchSchema,
    model: MODEL.SONNET,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
    maxTokens,
    temperature: 0.2,
    purpose: 'formulation_draft_batch',
    trackingContext,
  })

  if (!result.success) {
    logger.error({ error: result.error }, 'Draft Batch LLM 回應失敗')
    return { success: false, error: result.error }
  }

  const parsed = result.data
  const features = parsed.features as GeneratedFeature[]
  const uncertainItems = parsed.uncertainItems || []

  // 後置驗證：自動修正 LLM 常犯的格式錯誤
  let totalFixes = 0
  for (const feature of features) {
    const { content: sanitized, fixes: featureFixes } = sanitizeFeatureContent(feature.content)
    if (featureFixes.length > 0) {
      feature.content = sanitized
      totalFixes += featureFixes.length
      logger.info({ feature: feature.name, fixes: featureFixes }, 'Feature 後置修正')
    }
  }
  if (totalFixes > 0) {
    logger.info({ totalFixes, featureCount: features.length }, 'Feature 後置驗證完成')
  }

  logger.info({ featureCount: features.length, uncertainCount: uncertainItems.length }, 'Draft Batch 完成')

  return {
    success: true,
    schemaSql: parsed.schemaSql || undefined,
    entityMapping: parsed.entityMapping || undefined,
    features,
    uncertainItems,
  }
}
