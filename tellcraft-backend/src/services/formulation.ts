import { recordLlmUsage } from '../db/client'
import { ClarifyItem } from './bdd-session'
import { LlmTrackingContext } from './classifier'

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

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: options.maxTokens || 8192,
        temperature: options.temperature || 0.2,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, error: `API error: ${response.status} - ${errorText}` }
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
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
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
    .map(item => `Q: ${item.whiteTextQuestion || item.question}\nA: ${item.answer}`)
    .join('\n\n')

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
${decisions || '（無額外決策）'}`

  console.log('[Formulation] 生成 SQL Schema...')
  const response = await callClaude(systemPrompt, userMessage, { maxTokens: 8192 })

  if (!response.success) {
    return { success: false, error: response.error }
  }

  // 記錄使用量
  if (response.inputTokens && response.outputTokens) {
    const costUsd = (response.inputTokens * SONNET_PRICING.input + response.outputTokens * SONNET_PRICING.output) / 1000000
    await recordLlmUsage({
      model: 'claude-sonnet-4-5-20250929',
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      costUsd,
      purpose: 'formulation_schema',
      userId: trackingContext?.userId,
      conversationId: trackingContext?.conversationId,
    }).catch(err => console.error('[Formulation] 記錄使用量失敗:', err))
  }

  try {
    const jsonMatch = response.content?.match(/```json\s*([\s\S]*?)\s*```/) ||
                      response.content?.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { success: false, error: '無法解析 LLM 回應' }
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0]
    const parsed = JSON.parse(jsonStr)

    console.log('[Formulation] SQL Schema 生成完成')
    return {
      success: true,
      schemaSql: parsed.schemaSql,
      entityMapping: parsed.entityMapping,
    }
  } catch (err) {
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
    .map(item => `Q: ${item.whiteTextQuestion || item.question}\nA: ${item.answer}`)
    .join('\n\n')

  const systemPrompt = `你是一位資深的 BDD 分析師。根據需求和 Schema，識別所有需要的功能（Feature）。

## 核心原則：一個 API = 一個 Feature

**每個 Feature 必須對應到一個獨立的 API endpoint**，遵循 RESTful 設計原則：

| 操作類型 | actionName 格式 | 範例 |
|----------|-----------------|------|
| 建立 | create_{entity} | create_order |
| 查詢單筆 | get_{entity} | get_order |
| 查詢列表 | list_{entities} | list_orders |
| 更新 | update_{entity} | update_order |
| 刪除 | delete_{entity} | delete_order |
| 狀態轉換 | {action}_{entity} | cancel_order, complete_order |

## 任務
1. 分析需求和資料模型（Schema 中的每個主要 Table 通常需要 CRUD 操作）
2. 識別所有使用者與系統的交互點
3. 為每個 **獨立的 API 操作** 建立一個 Feature

## 輸出格式
\`\`\`json
{
  "features": [
    {
      "name": "功能中文名稱",
      "actionName": "create_xxx",
      "description": "簡短描述這個功能做什麼"
    }
  ]
}
\`\`\`

## 命名規則
- actionName 使用 snake_case，格式：動詞_名詞（如 create_order, update_user_profile）
- 功能名稱要精確描述交互，不要太抽象
- **禁止合併**：不要把多個 API 合併成一個「管理 XX」的 Feature
- **適度拆分**：狀態轉換如果業務邏輯不同（如「取消訂單」vs「完成訂單」），應該拆成獨立 Feature`

  const userMessage = `${projectContext ? `專案背景：${projectContext}\n\n` : ''}需求描述：
${requirements}

---

SQL Schema：
\`\`\`sql
${schemaSql}
\`\`\`

---

釐清決策：
${decisions || '（無額外決策）'}`

  console.log('[Formulation] 識別 Features...')
  const response = await callClaude(systemPrompt, userMessage, { maxTokens: 4096 })

  if (!response.success) {
    return { success: false, error: response.error }
  }

  // 記錄使用量
  if (response.inputTokens && response.outputTokens) {
    const costUsd = (response.inputTokens * SONNET_PRICING.input + response.outputTokens * SONNET_PRICING.output) / 1000000
    await recordLlmUsage({
      model: 'claude-sonnet-4-5-20250929',
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      costUsd,
      purpose: 'formulation_identify_features',
      userId: trackingContext?.userId,
      conversationId: trackingContext?.conversationId,
    }).catch(err => console.error('[Formulation] 記錄使用量失敗:', err))
  }

  try {
    const jsonMatch = response.content?.match(/```json\s*([\s\S]*?)\s*```/) ||
                      response.content?.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { success: false, error: '無法解析 LLM 回應' }
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0]
    const parsed = JSON.parse(jsonStr)

    console.log(`[Formulation] 識別到 ${parsed.features?.length || 0} 個 Features`)
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
    .map(item => `Q: ${item.whiteTextQuestion || item.question}\nA: ${item.answer}`)
    .join('\n\n')

  const systemPrompt = `你是一位資深的 BDD 分析師。請為指定的功能產出 Gherkin Feature File。

## 目標功能
- 名稱：${featureInfo.name}
- Action：${featureInfo.actionName}
- 描述：${featureInfo.description}

## sdd.os ISA 格式規範

### When 步驟格式
- Action 呼叫：\`{summary}, call table:\`
- 成功回應：\`{summary}成功, with table:\`
- 操作失敗：\`操作失敗\`

### Then 步驟格式
- Entity 驗證：\`存在一個{entity}, with table:\`

### 必要註解
- \`@Action(ActionName)\`：標註這是哪個 Action
- \`# Summary: xxx\`：Action 的一句話說明

## 輸出格式
直接輸出完整的 .feature 檔案內容，不需要 JSON 包裝。

\`\`\`gherkin
@Action(${featureInfo.actionName})
# Summary: ${featureInfo.description}
Feature: ${featureInfo.name}

  @Pre
  Rule: 前置條件規則

    Example: 情境說明
      When {summary}, call table:
        | 欄位 | 值 |
      Then {summary}成功, with table:
        | 欄位 | 值 |
      And 存在一個{entity}, with table:
        | 欄位 | 值 |
\`\`\`

## 規則
- 每條 Rule 標註 @Pre（前置）或 @Post（後置）
- 每條 Rule 至少有一個 Example
- 邊界條件要有對應的 Example
- 使用 Entity Mapping 中的中文實體名`

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
${decisions || '（無額外決策）'}`

  const response = await callClaude(systemPrompt, userMessage, { maxTokens: 8192 })

  if (!response.success) {
    return { success: false, error: response.error }
  }

  // 記錄使用量
  if (response.inputTokens && response.outputTokens) {
    const costUsd = (response.inputTokens * SONNET_PRICING.input + response.outputTokens * SONNET_PRICING.output) / 1000000
    await recordLlmUsage({
      model: 'claude-sonnet-4-5-20250929',
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      costUsd,
      purpose: 'formulation_generate_feature',
      userId: trackingContext?.userId,
      conversationId: trackingContext?.conversationId,
    }).catch(err => console.error('[Formulation] 記錄使用量失敗:', err))
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

export async function runFormulation(
  requirements: string,
  resolvedItems: ClarifyItem[],
  projectContext?: string,
  onProgress?: (step: string, current: number, total: number, detail?: string) => Promise<void>,
  trackingContext?: LlmTrackingContext
): Promise<FormulationResult> {
  try {
    // Step 1: 生成 SQL Schema
    if (onProgress) {
      await onProgress('schema', 1, 3, '生成資料模型...')
    }

    const schemaResult = await generateSchemaSql(requirements, resolvedItems, projectContext, trackingContext)
    if (!schemaResult.success || !schemaResult.schemaSql) {
      return { success: false, error: schemaResult.error || '生成 Schema 失敗' }
    }

    // Step 2: 識別 Features
    if (onProgress) {
      await onProgress('identify', 2, 3, '識別功能模組...')
    }

    const identifyResult = await identifyFeatures(
      requirements,
      resolvedItems,
      schemaResult.schemaSql,
      projectContext,
      trackingContext
    )
    if (!identifyResult.success || !identifyResult.features || identifyResult.features.length === 0) {
      return { success: false, error: identifyResult.error || '識別 Features 失敗' }
    }

    // Step 3: 逐個生成 Features
    if (onProgress) {
      await onProgress('features', 3, 3, `生成 ${identifyResult.features.length} 個功能規格...`)
    }

    const generatedFeatures: GeneratedFeature[] = []
    for (let i = 0; i < identifyResult.features.length; i++) {
      const featureInfo = identifyResult.features[i]

      if (onProgress) {
        await onProgress('feature', i + 1, identifyResult.features.length, featureInfo.name)
      }

      const result = await generateSingleFeature(
        featureInfo,
        requirements,
        resolvedItems,
        schemaResult.schemaSql,
        schemaResult.entityMapping || '',
        projectContext,
        trackingContext
      )

      if (result.success && result.feature) {
        generatedFeatures.push(result.feature)
      } else {
        console.error(`[Formulation] 生成 Feature "${featureInfo.name}" 失敗:`, result.error)
        // 繼續生成其他 Features
      }
    }

    if (generatedFeatures.length === 0) {
      return { success: false, error: '沒有成功生成任何 Feature' }
    }

    console.log(`[Formulation] 完成！生成了 ${generatedFeatures.length} 個 Features`)

    return {
      success: true,
      schemaSql: schemaResult.schemaSql,
      entityMapping: schemaResult.entityMapping,
      features: generatedFeatures,
    }
  } catch (error) {
    console.error('[Formulation] 執行失敗:', error)
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

  // 構建用戶釐清決策
  const decisions = resolvedItems
    .filter(item => item.status === 'answered' && item.answer)
    .map(item => `Q: ${item.whiteTextQuestion || item.question}\nA: ${item.answer}`)
    .join('\n\n')

  const systemPrompt = `你是一位 sdd.os ISA Gherkin 專家。請根據用戶反饋修正以下 Feature Files。

## sdd.os ISA 格式規範
1. 檔案開頭必須有 \`@Action(ActionName)\` 和 \`# Summary:\` 註解
2. 每個 Rule 必須標註 \`@Pre\` 或 \`@Post\`
3. When 格式：\`{summary}, call table:\`
4. Then 成功格式：\`{summary}成功, with table:\`
5. Then 失敗格式：\`操作失敗\`
6. Entity 驗證格式：\`存在一個{entity}, with table:\`

## 重要約束
修復時必須嚴格遵守：
1. 用戶在釐清階段做出的所有決策
2. Schema 定義的欄位名稱和類型
3. Entity Mapping 中的實體命名

## 輸出格式
請以 JSON 格式輸出修正後的內容：
\`\`\`json
{
  "features": [
    { "name": "Feature名稱", "actionName": "action_name", "content": "修正後的完整 gherkin 內容" }
  ]
}
\`\`\``

  // 構建用戶消息
  const featuresContent = features.map(f =>
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

${decisions}` : ''}`

  console.log('[Formulation] 修復 Features...')
  const response = await callClaude(systemPrompt, userMessage, { maxTokens: 16384, temperature: 0.1 })

  if (!response.success) {
    return { success: false, error: response.error }
  }

  // 記錄使用量
  if (response.inputTokens && response.outputTokens) {
    const costUsd = (response.inputTokens * SONNET_PRICING.input + response.outputTokens * SONNET_PRICING.output) / 1000000
    await recordLlmUsage({
      model: 'claude-sonnet-4-5-20250929',
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      costUsd,
      purpose: 'formulation_fix_features',
      userId: trackingContext?.userId,
      conversationId: trackingContext?.conversationId,
    }).catch(err => console.error('[Formulation] 記錄使用量失敗:', err))
  }

  try {
    const jsonMatch = response.content?.match(/```json\s*([\s\S]*?)\s*```/) ||
                      response.content?.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { success: false, error: '無法解析 LLM 回應' }
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0]
    const parsed = JSON.parse(jsonStr)

    console.log(`[Formulation] 修復完成，${parsed.features?.length || 0} 個 Features`)
    return {
      success: true,
      fixedFeatures: parsed.features || [],
    }
  } catch (err) {
    return { success: false, error: `解析回應時發生錯誤: ${err}` }
  }
}
