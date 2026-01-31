// ============================================================
// LLM 服務 - Anthropic Claude API
// 注意：這個模組直接在服務器端使用，不是 Server Actions
// ============================================================

import { createClient } from '@supabase/supabase-js'

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

// Supabase service client for logging
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Claude 定價 (每百萬 tokens，美元)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-5-20250929': { input: 3, output: 15 },  // 最新 Sonnet 4.5
  'claude-opus-4-5-20250514': { input: 15, output: 75 },   // Opus 4.5
  'claude-3-5-haiku-20241022': { input: 0.8, output: 4 },
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface LlmResponse {
  success: boolean
  content?: string
  error?: string
  usage?: {
    inputTokens: number
    outputTokens: number
    cost: number
  }
}

interface LlmTrackingContext {
  userId?: string
  conversationId?: string
  purpose?: string
}

/**
 * 記錄 LLM 使用量到資料庫
 */
async function logLlmUsage(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cost: number,
  context?: LlmTrackingContext
): Promise<void> {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('[LLM] 無法記錄使用量：缺少 Supabase 設定')
    return
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    await supabase.from('llm_usage').insert({
      user_id: context?.userId || null,
      conversation_id: context?.conversationId || null,
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: cost,
      purpose: context?.purpose || null,
    })
    console.log(`[LLM] 已記錄使用量: ${inputTokens} in / ${outputTokens} out, $${cost.toFixed(6)}`)
  } catch (err) {
    console.error('[LLM] 記錄使用量失敗:', err)
  }
}

/**
 * 呼叫 Claude API
 */
export async function callClaude(
  systemPrompt: string,
  messages: Message[],
  options?: {
    model?: string
    maxTokens?: number
    temperature?: number
  },
  trackingContext?: LlmTrackingContext
): Promise<LlmResponse> {
  const apiKey = process.env.CLAUDE_API_KEY

  console.log('[LLM] CLAUDE_API_KEY exists:', !!apiKey)
  console.log('[LLM] API Key prefix:', apiKey?.substring(0, 15) || 'NONE')

  if (!apiKey) {
    console.error('[LLM] ERROR: 缺少 ANTHROPIC_API_KEY')
    return { success: false, error: '缺少 ANTHROPIC_API_KEY' }
  }

  const model = options?.model || 'claude-sonnet-4-5-20250929'

  try {
    const response = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature ?? 0.7,
        system: systemPrompt,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, error: `API 錯誤: ${errorText}` }
    }

    const data = await response.json()
    const content = data.content?.[0]?.text

    if (!content) {
      return { success: false, error: '無法取得回應內容' }
    }

    // 計算 token 使用量和成本
    const inputTokens = data.usage?.input_tokens || 0
    const outputTokens = data.usage?.output_tokens || 0
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['claude-sonnet-4-5-20250929']
    const cost = (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000

    // 記錄使用量
    await logLlmUsage(model, inputTokens, outputTokens, cost, trackingContext)

    return {
      success: true,
      content,
      usage: { inputTokens, outputTokens, cost }
    }
  } catch (err) {
    return { success: false, error: `呼叫 LLM 時發生錯誤: ${err}` }
  }
}

// ============================================================
// BDD Spec 專用 Prompts
// ============================================================

/**
 * Discovery 階段 - 分析需求，找出歧義和遺漏
 */
export async function discoverAmbiguities(
  requirements: string,
  projectContext?: string,
  existingQuestions?: string[]
): Promise<{
  success: boolean
  questions?: Array<{
    id: string
    question: string
    category: 'data' | 'feature' | 'terminology'
    priority: 'high' | 'medium' | 'low'
    options?: Array<{ label: string; description: string }>
  }>
  error?: string
}> {
  const systemPrompt = `你是一位資深的 BDD（行為驅動開發）分析師。你的任務是分析用戶的需求描述，找出其中的歧義、遺漏和需要釐清的問題。

**分析重點**：
1. **資料模型**：實體、屬性、關係是否清楚？數值邊界是否明確？
2. **功能規則**：前置條件、後置條件是否完整？異常處理是否定義？
3. **術語一致性**：是否有同義詞混用或同名異義的情況？

**輸出格式**（JSON）：
{
  "questions": [
    {
      "id": "Q1",
      "question": "問題描述（白話文，讓非技術人員也能理解）",
      "category": "data" | "feature" | "terminology",
      "priority": "high" | "medium" | "low",
      "options": [
        { "label": "A", "description": "選項 A 的描述" },
        { "label": "B", "description": "選項 B 的描述" }
      ]
    }
  ]
}

**規則**：
- 每個問題必須是具體的、可回答的
- 優先問 high 優先級問題（影響核心架構的）
- 每個問題最多 4 個選項，或允許簡短文字回答
- 不要問太技術的問題，用領域語言
- 一次最多返回 5 個問題
- 如果需求已經很清楚，返回空陣列

${existingQuestions?.length ? `**已經問過的問題**（不要重複）：\n${existingQuestions.join('\n')}` : ''}`

  const userMessage = projectContext
    ? `專案背景：${projectContext}\n\n需求描述：\n${requirements}`
    : `需求描述：\n${requirements}`

  const response = await callClaude(systemPrompt, [{ role: 'user', content: userMessage }])

  if (!response.success) {
    return { success: false, error: response.error }
  }

  try {
    // 解析 JSON
    const jsonMatch = response.content?.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { success: false, error: '無法解析 LLM 回應' }
    }

    const parsed = JSON.parse(jsonMatch[0])
    return { success: true, questions: parsed.questions || [] }
  } catch (err) {
    return { success: false, error: `解析回應時發生錯誤: ${err}` }
  }
}

// ============================================================
// BDD Spec 完整流程 - Phase 1-5 專用 Prompts
// ============================================================

/**
 * 生成釐清完成摘要
 * 將釐清結果整理成格式化的 Markdown 摘要
 */
export async function generateClarifySummary(
  requirements: string,
  resolvedItems: Array<{
    question: string
    whiteTextQuestion?: string
    answer?: string
    category?: string
  }>,
  trackingContext?: LlmTrackingContext
): Promise<{
  success: boolean
  summary?: string
  error?: string
}> {
  const systemPrompt = `你是一位 BDD 分析師。請根據原始需求和釐清問答，產出一份結構化的需求摘要。

## 輸出格式（Markdown）

請依照以下格式輸出，**每個區塊之間用空行分隔**：

我已經了解您的需求了！

## 資料模型
- **實體名稱**：簡短說明
  屬性：屬性1, 屬性2, 屬性3

## 功能規格
- **功能名稱**：功能說明
  規則：規則1; 規則2; 規則3

## 規則
1. 資料模型和功能規格要從釐清結果中提煉，不要只是複述問答內容
2. 整體內容要簡潔明瞭，讓非技術人員也能理解
3. 不要顯示決策記錄，所有決策結果應該融入到資料模型和功能規格中
4. 每個功能的規則要具體明確，不要太籠統`

  const qaList = resolvedItems
    .filter(item => item.answer)
    .map(item => `問題：${item.whiteTextQuestion || item.question}\n答案：${item.answer}`)
    .join('\n\n')

  const userMessage = `## 原始需求
${requirements}

## 釐清問答
${qaList || '（無額外釐清）'}`

  const response = await callClaude(
    systemPrompt,
    [{ role: 'user', content: userMessage }],
    { maxTokens: 4096, temperature: 0.3 },
    trackingContext
  )

  if (!response.success) {
    return { success: false, error: response.error }
  }

  return {
    success: true,
    summary: response.content?.trim(),
  }
}

// 釐清項目類型定義
export interface ClarifyItem {
  id: string
  question: string
  whiteTextQuestion: string  // 白話翻譯版
  category: 'data' | 'feature' | 'terminology'
  priority: 'high' | 'medium' | 'low'
  checklistItem?: string  // 對應的檢查清單項目 (A1-A6, B1-B5, C1-C2, D1-D2)
  location?: string  // 定位：哪個實體/功能
  impact?: string  // 影響範圍
  // 支援兩種格式：字串陣列 ["A. 描述..."] 或物件陣列 [{ label, description }]
  options?: Array<string | { label: string; description: string }>
  status: 'pending' | 'reviewing' | 'confirmed' | 'resolved' | 'skipped' | 'deferred'
  answer?: string
  answeredAt?: string
}

/**
 * Phase 1: PRD Discovery - 使用檢查清單掃描需求
 * 使用 A1-A6, B1-B5, C1-C2, D1-D2 檢查清單
 */
export async function runPrdDiscovery(
  requirements: string,
  projectContext?: string,
  existingItems?: ClarifyItem[],
  trackingContext?: LlmTrackingContext,
  options?: { isFirstRound?: boolean }
): Promise<{
  success: boolean
  items?: ClarifyItem[]
  coverageSummary?: Record<string, 'clear' | 'partial' | 'missing'>
  error?: string
}> {
  // 建立已釐清的 Q&A 列表（包含問題和答案）
  const existingQA = existingItems
    ?.filter(item => item.answer) // 只包含已回答的
    ?.map(item => `Q: ${item.whiteTextQuestion || item.question}\nA: ${item.answer}`) || []

  // 待處理的問題（還沒回答的）
  const pendingQuestions = existingItems
    ?.filter(item => !item.answer)
    ?.map(item => item.whiteTextQuestion || item.question) || []

  const systemPrompt = `你是一位資深的 BDD（行為驅動開發）分析師。請根據以下檢查清單掃描用戶的需求描述，找出歧義、遺漏和需要釐清的問題。

## 檢查清單

### A. 領域與資料模型檢查
- **A1. 實體完整性**：所有核心業務概念是否都已建模為實體？
- **A2. 屬性定義**：每個屬性是否都有明確的資料型別和說明？
- **A3. 屬性值邊界條件**：數值範圍限制是否明確？
- **A4. 跨屬性不變條件**：屬性間的計算關係是否明確？
- **A5. 關係與唯一性**：實體間的關聯關係是否完整？
- **A6. 生命週期與狀態**：狀態轉換規則是否完整？

### B. 功能模型檢查
- **B1. 功能識別**：所有使用者與系統的交互點是否都已識別？
- **B2. 規則完整性**：前置/後置條件是否完整？是否已原子化？
- **B3. 例子覆蓋度**：每條規則是否有足夠的例子？
- **B4. 邊界條件覆蓋**：數值/組合/時間/狀態邊界是否涵蓋？
- **B5. 錯誤與異常處理**：異常情況是否都有對應規則？

### C. 術語與一致性檢查
- **C1. 詞彙表**：核心概念是否都有一致的命名？
- **C2. 術語衝突**：是否存在同義詞混用或同名異義？

### D. 其他品質檢查
- **D1. 待決事項**：是否存在 TODO 或未決議事項？
- **D2. 模糊描述**：是否存在未量化的形容詞？

## 輸出要求

產出 JSON 格式的釐清項目列表：

\`\`\`json
{
  "items": [
    {
      "id": "C-001",
      "question": "技術問題描述",
      "whiteTextQuestion": "白話翻譯版問題（讓非技術人員也能理解）",
      "category": "data" | "feature" | "terminology",
      "priority": "high" | "medium" | "low",
      "checklistItem": "A1" | "A2" | ... | "D2",
      "location": "實體/功能名稱",
      "impact": "影響範圍說明",
      "options": [
        { "label": "A", "description": "選項描述" },
        { "label": "B", "description": "選項描述" }
      ]
    }
  ],
  "coverageSummary": {
    "A1": "clear" | "partial" | "missing",
    "A2": "clear" | "partial" | "missing",
    ...
  }
}
\`\`\`

## 優先級規則
- **A1（實體完整性）** 的 Missing → **強制 High**
- **A4（跨屬性不變條件）** 的 Missing → **強制 High**
- High：阻礙核心功能定義或資料建模
- Medium：影響邊界條件或測試完整性
- Low：優化或細節調整

## 規則
- 每個問題必須是具體的、可回答的
- 每個問題最多 4 個選項（加上「其他」選項）
- 白話翻譯：將英文欄位名替換為中文，移除程式語法符號
- 不要問太技術的問題，用領域語言
- ${options?.isFirstRound !== false ? '盡可能一次列出所有需要釐清的問題，不要保留' : '只列出根據答案發現的新問題，最多 10 個'}
- 按優先級排序：High → Medium → Low
${existingQA.length ? `

**已經釐清的問題**（這些主題已經確認，絕對不要再問類似的問題）：
${existingQA.join('\n\n')}` : ''}
${pendingQuestions.length ? `

**待處理的問題**（這些問題正在等待回答，不要重複）：
${pendingQuestions.join('\n')}` : ''}

**重要**：不要問與「已經釐清的問題」語意相似或主題相同的問題。如果某個主題（例如：金額小數點處理、日期格式等）已經被回答過，就絕對不要用不同措辭再問一次。`

  const userMessage = projectContext
    ? `專案背景：${projectContext}\n\n需求描述：\n${requirements}`
    : `需求描述：\n${requirements}`

  const response = await callClaude(
    systemPrompt,
    [{ role: 'user', content: userMessage }],
    { maxTokens: 8192, temperature: 0.3 },
    trackingContext
  )

  if (!response.success) {
    return { success: false, error: response.error }
  }

  try {
    const jsonMatch = response.content?.match(/```json\s*([\s\S]*?)\s*```/) ||
                      response.content?.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { success: false, error: '無法解析 LLM 回應' }
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0]
    const parsed = JSON.parse(jsonStr)

    // 為每個項目設置初始狀態
    const items: ClarifyItem[] = (parsed.items || []).map((item: Partial<ClarifyItem>) => ({
      ...item,
      status: 'pending',
    }))

    // 語意去重：過濾掉與現有問題重複的新問題
    if (items.length > 0 && existingItems && existingItems.length > 0) {
      const filteredItems = await filterDuplicateQuestions(items, existingItems, trackingContext)
      console.log(`[LLM] 語意去重: ${items.length} → ${filteredItems.length} 題`)
      return {
        success: true,
        items: filteredItems,
        coverageSummary: parsed.coverageSummary,
      }
    }

    return {
      success: true,
      items,
      coverageSummary: parsed.coverageSummary,
    }
  } catch (err) {
    return { success: false, error: `解析回應時發生錯誤: ${err}` }
  }
}

/**
 * 語意去重：過濾掉與現有問題語意相似的新問題
 * 使用 Claude 判斷語意相似度
 */
async function filterDuplicateQuestions(
  newItems: ClarifyItem[],
  existingItems: ClarifyItem[],
  trackingContext?: LlmTrackingContext
): Promise<ClarifyItem[]> {
  // 提取現有問題的主題摘要
  const existingTopics = existingItems.map((item, i) => ({
    id: i + 1,
    question: item.whiteTextQuestion || item.question,
    answer: item.answer || '(未回答)',
  }))

  // 新問題列表
  const newQuestions = newItems.map((item, i) => ({
    id: i + 1,
    question: item.whiteTextQuestion || item.question,
  }))

  const systemPrompt = `你是一個語意相似度判斷專家。你的任務是找出新問題中，哪些與已經問過的問題在語意上重複。

## 判斷標準

兩個問題算「重複」的情況：
1. 問的是同一個主題/概念（即使措辭不同）
2. 問的是同一件事的不同面向（例如：「金額可以有小數嗎？」和「金額要保留幾位小數？」）
3. 答案會互相矛盾或覆蓋（例如：「日期格式是什麼？」已回答後，不需要再問「用什麼格式記錄日期？」）

兩個問題「不重複」的情況：
1. 問的是不同實體/功能
2. 問的是同一實體的不同屬性（例如：「用戶名最多幾個字？」和「用戶 email 格式？」不重複）
3. 問的是新的邊界條件（例如：已問「最多幾個」，再問「最少幾個」不算重複）

## 輸出格式

只返回 JSON，包含要保留的新問題 ID 列表：
\`\`\`json
{
  "keep": [1, 3, 5],
  "duplicates": [
    { "id": 2, "similar_to": 15, "reason": "都在問金額小數點" },
    { "id": 4, "similar_to": 8, "reason": "都在問分類刪除後的處理" }
  ]
}
\`\`\``

  const userMessage = `## 已經問過的問題（共 ${existingTopics.length} 題）

${existingTopics.map(t => `${t.id}. ${t.question}\n   答: ${t.answer}`).join('\n\n')}

## 新產生的問題（共 ${newQuestions.length} 題）

${newQuestions.map(q => `${q.id}. ${q.question}`).join('\n')}

請判斷新問題中哪些與已問過的問題重複，返回要保留的問題 ID。`

  const response = await callClaude(
    systemPrompt,
    [{ role: 'user', content: userMessage }],
    { maxTokens: 1024, temperature: 0, model: 'claude-3-5-haiku-20241022' }, // 用 Haiku 省錢
    { ...trackingContext, purpose: 'semantic_dedup' }
  )

  if (!response.success || !response.content) {
    console.log('[LLM] 語意去重失敗，返回所有新問題')
    return newItems
  }

  try {
    const jsonMatch = response.content.match(/```json\s*([\s\S]*?)\s*```/) ||
                      response.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return newItems
    }

    const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0])
    const keepIds = new Set(parsed.keep || [])

    // 記錄被過濾的問題
    if (parsed.duplicates?.length > 0) {
      console.log('[LLM] 過濾重複問題:')
      parsed.duplicates.forEach((d: { id: number; similar_to: number; reason: string }) => {
        console.log(`  - 新問題 ${d.id} 與舊問題 ${d.similar_to} 重複: ${d.reason}`)
      })
    }

    return newItems.filter((_, i) => keepIds.has(i + 1))
  } catch (err) {
    console.log('[LLM] 解析語意去重結果失敗:', err)
    return newItems
  }
}

/**
 * Phase 2: Formulation - 產出 SQL Schema
 */
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
    .filter(item => item.status === 'resolved' && item.answer)
    .map(item => `Q: ${item.whiteTextQuestion}\nA: ${item.answer}`)
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

  const response = await callClaude(
    systemPrompt,
    [{ role: 'user', content: userMessage }],
    { maxTokens: 8192, temperature: 0.2 },
    trackingContext
  )

  if (!response.success) {
    return { success: false, error: response.error }
  }

  try {
    const jsonMatch = response.content?.match(/```json\s*([\s\S]*?)\s*```/) ||
                      response.content?.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { success: false, error: '無法解析 LLM 回應' }
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0]
    const parsed = JSON.parse(jsonStr)

    return {
      success: true,
      schemaSql: parsed.schemaSql,
      entityMapping: parsed.entityMapping,
    }
  } catch (err) {
    return { success: false, error: `解析回應時發生錯誤: ${err}` }
  }
}

/**
 * Phase 2: Formulation - 產出 Feature Files (sdd.os ISA 格式)
 */
export async function generateFeatureFiles(
  requirements: string,
  resolvedItems: ClarifyItem[],
  schemaSql: string,
  entityMapping: string,
  projectContext?: string,
  trackingContext?: LlmTrackingContext
): Promise<{
  success: boolean
  features?: Array<{ name: string; actionName: string; content: string }>
  error?: string
}> {
  const decisions = resolvedItems
    .filter(item => item.status === 'resolved' && item.answer)
    .map(item => `Q: ${item.whiteTextQuestion}\nA: ${item.answer}`)
    .join('\n\n')

  const systemPrompt = `你是一位資深的 BDD 分析師。根據需求、釐清決策和 Schema，產出 sdd.os ISA 格式的 Feature Files。

## sdd.os ISA Gherkin 格式（Server Actions 版）

### Feature 檔案結構
\`\`\`gherkin
# Action: actionFunctionName
# Summary: 功能名稱
Feature: 功能名稱

  Background:
    Given 準備一個{entity}, with table:
      | column1 | column2 |
      | value1  | value2  |

  #------------------------------------------------------------
  Rule: 前置/後置 - 規則描述
  #------------------------------------------------------------

    Example: 例子名稱
      When {功能名稱}, call table:
        | param1 | param2 |
        | value1 | value2 |
      Then {功能名稱}成功, with table:
        | field1 | field2 |
        | value1 | value2 |
      And 存在一個{entity}, with table:
        | column1 | column2 |
        | value1  | value2  |

    Example: 錯誤情境
      When {功能名稱}, call table:
        | param1 | param2 |
        | value1 | value2 |
      Then 操作失敗
\`\`\`

## 格式規則
1. **Action 綁定**：檔案開頭必須有 \`# Action:\` 和 \`# Summary:\` 註解
2. **Rule 標註**：每個 Rule 必須標註 \`前置\` 或 \`後置\`
3. **When 格式**：\`{summary}, call table:\`
4. **Then 成功格式**：\`{summary}成功, with table:\`
5. **Then 失敗格式**：\`操作失敗\`
6. **Entity 驗證格式**：\`存在一個{entity}, with table:\`
7. **summary 一致**：Feature 名稱必須與 When/Then 中的 summary 一致

## Entity 映射
${entityMapping}

## 輸出格式
\`\`\`json
{
  "features": [
    {
      "name": "建立訂單",
      "actionName": "createOrder",
      "content": "完整的 .feature 檔案內容"
    }
  ]
}
\`\`\``

  const userMessage = `${projectContext ? `專案背景：${projectContext}\n\n` : ''}需求描述：
${requirements}

---

SQL Schema：
${schemaSql}

---

釐清決策：
${decisions || '（無額外決策）'}`

  const response = await callClaude(
    systemPrompt,
    [{ role: 'user', content: userMessage }],
    { maxTokens: 16384, temperature: 0.3 },
    trackingContext
  )

  if (!response.success) {
    return { success: false, error: response.error }
  }

  try {
    const jsonMatch = response.content?.match(/```json\s*([\s\S]*?)\s*```/) ||
                      response.content?.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { success: false, error: '無法解析 LLM 回應' }
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0]
    const parsed = JSON.parse(jsonStr)

    return {
      success: true,
      features: parsed.features,
    }
  } catch (err) {
    return { success: false, error: `解析回應時發生錯誤: ${err}` }
  }
}

/**
 * Phase 3: Spec Discovery - 對產出的 Feature Files 進行再次檢查
 */
export async function runSpecDiscovery(
  features: Array<{ name: string; content: string }>,
  schemaSql: string,
  existingItems?: ClarifyItem[],
  trackingContext?: LlmTrackingContext
): Promise<{
  success: boolean
  items?: ClarifyItem[]
  error?: string
}> {
  // 建立已釐清的 Q&A 列表
  const existingQA = existingItems
    ?.filter(item => item.answer)
    ?.map(item => `Q: ${item.whiteTextQuestion || item.question}\nA: ${item.answer}`) || []

  // 待處理的問題
  const pendingQuestions = existingItems
    ?.filter(item => !item.answer)
    ?.map(item => item.whiteTextQuestion || item.question) || []

  const systemPrompt = `你是一位資深的 BDD 分析師。請檢查以下 Feature Files，找出需要補充或釐清的地方。

## 檢查重點
1. **規則完整性**：每個功能的前置/後置條件是否完整？
2. **Example 覆蓋度**：每條 Rule 是否有足夠的 Example 覆蓋邊界？
3. **邊界條件**：數值邊界、狀態邊界、組合邊界是否涵蓋？
4. **錯誤處理**：異常情況是否都有對應的 Rule + Example？
5. **格式正確性**：是否符合 sdd.os ISA 格式？

## 輸出格式
\`\`\`json
{
  "items": [
    {
      "id": "S-001",
      "question": "技術問題描述",
      "whiteTextQuestion": "白話翻譯版問題",
      "category": "feature",
      "priority": "high" | "medium" | "low",
      "location": "Feature 名稱 / Rule 描述",
      "impact": "影響範圍說明",
      "options": [...]
    }
  ]
}
\`\`\`

## 規則
- 如果 Feature Files 已經很完整，返回空陣列
- 一次最多返回 5 個問題
${existingQA.length ? `

**已經釐清的問題**（這些主題已經確認，絕對不要再問類似的問題）：
${existingQA.join('\n\n')}` : ''}
${pendingQuestions.length ? `

**待處理的問題**（不要重複）：
${pendingQuestions.join('\n')}` : ''}

**重要**：不要問與「已經釐清的問題」語意相似或主題相同的問題。`

  const featuresContent = features
    .map(f => `### ${f.name}\n\`\`\`gherkin\n${f.content}\n\`\`\``)
    .join('\n\n')

  const userMessage = `## SQL Schema
\`\`\`sql
${schemaSql}
\`\`\`

## Feature Files
${featuresContent}`

  const response = await callClaude(
    systemPrompt,
    [{ role: 'user', content: userMessage }],
    { maxTokens: 4096, temperature: 0.3 },
    trackingContext
  )

  if (!response.success) {
    return { success: false, error: response.error }
  }

  try {
    const jsonMatch = response.content?.match(/```json\s*([\s\S]*?)\s*```/) ||
                      response.content?.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { success: false, error: '無法解析 LLM 回應' }
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0]
    const parsed = JSON.parse(jsonStr)

    const items: ClarifyItem[] = (parsed.items || []).map((item: Partial<ClarifyItem>) => ({
      ...item,
      status: 'pending',
    }))

    // 語意去重：過濾掉與現有問題重複的新問題
    if (items.length > 0 && existingItems && existingItems.length > 0) {
      const filteredItems = await filterDuplicateQuestions(items, existingItems, trackingContext)
      console.log(`[LLM] Spec Discovery 語意去重: ${items.length} → ${filteredItems.length} 題`)
      return { success: true, items: filteredItems }
    }

    return { success: true, items }
  } catch (err) {
    return { success: false, error: `解析回應時發生錯誤: ${err}` }
  }
}

/**
 * Phase 4: Actions Design - 產出 actions.yml
 */
export async function generateActionsYml(
  features: Array<{ name: string; actionName: string; content: string }>,
  schemaSql: string,
  trackingContext?: LlmTrackingContext
): Promise<{
  success: boolean
  actionsYml?: string
  error?: string
}> {
  const systemPrompt = `你是一位資深的 API 架構師。根據 Feature Files 產出 Server Actions 規格（actions.yml）。

## 輸出格式 (YAML)
\`\`\`yaml
actions:
  - name: actionFunctionName
    summary: 功能名稱
    description: 功能說明
    input:
      - name: paramName
        type: string | number | boolean | array | object
        required: true | false
        description: 參數說明
    output:
      success:
        - name: fieldName
          type: string | number | boolean | array | object
          description: 欄位說明
      error:
        code: ERROR_CODE
        message: 錯誤訊息
    rules:
      preconditions:
        - 前置條件1
        - 前置條件2
      postconditions:
        - 後置條件1
        - 後置條件2
\`\`\`

## 規則
- action name 使用 camelCase
- summary 必須與 Feature 名稱一致
- input/output 的 type 要與 Schema 一致

直接輸出 YAML 內容，不要包含 \`\`\`yaml 標記。`

  const featuresContent = features
    .map(f => `### ${f.name} (${f.actionName})\n${f.content}`)
    .join('\n\n')

  const userMessage = `## SQL Schema
${schemaSql}

## Feature Files
${featuresContent}`

  const response = await callClaude(
    systemPrompt,
    [{ role: 'user', content: userMessage }],
    { maxTokens: 8192, temperature: 0.2 },
    trackingContext
  )

  if (!response.success) {
    return { success: false, error: response.error }
  }

  // 移除可能的 markdown 標記
  let actionsYml = response.content?.trim() || ''
  actionsYml = actionsYml.replace(/^```yaml\s*/i, '').replace(/\s*```$/i, '')

  return { success: true, actionsYml }
}

/**
 * Phase 5: ISA Config - 產出 isa_codegen.yml
 */
export async function generateIsaConfig(
  features: Array<{ name: string; actionName: string; content: string }>,
  entityMapping: string,
  actionsYml: string,
  trackingContext?: LlmTrackingContext
): Promise<{
  success: boolean
  isaConfig?: string
  error?: string
}> {
  const systemPrompt = `你是一位 sdd.os ISA 配置專家。根據 Feature Files 和 Actions 規格，產出 isa_codegen.yml 配置。

## 輸出格式 (YAML)
\`\`\`yaml
isa_codegen:
  target: nextjs-server-actions
  database: supabase

  entity_mapping:
    # 從 entity_to_table_mapping.yml 複製

  step_patterns:
    action_call:
      pattern: "{summary}, call table:"
      executor: server-action
      action_resolver: by-summary

    action_success:
      pattern: "{summary}成功, with table:"
      executor: assertion
      mode: response-validation

    action_failure:
      pattern: "操作失敗"
      executor: assertion
      mode: error-expected

    entity_verify:
      pattern: "存在一個{entity}, with table:"
      executor: supabase-query
      mode: existence-check

    entity_prepare:
      pattern: "準備一個{entity}, with table:"
      executor: supabase-insert
      mode: test-fixture

  actions:
    # 從 Feature 檔案的 # Action: 註解提取
    - name: actionName
      summary: 功能名稱
      file: spec/features/功能名稱.feature
\`\`\`

直接輸出 YAML 內容，不要包含 \`\`\`yaml 標記。`

  const featuresContent = features
    .map(f => `### ${f.name} (${f.actionName})\nFile: spec/features/${f.name}.feature`)
    .join('\n')

  const userMessage = `## Entity Mapping
${entityMapping}

## Actions Spec
${actionsYml}

## Features
${featuresContent}`

  const response = await callClaude(
    systemPrompt,
    [{ role: 'user', content: userMessage }],
    { maxTokens: 4096, temperature: 0.2 },
    trackingContext
  )

  if (!response.success) {
    return { success: false, error: response.error }
  }

  // 移除可能的 markdown 標記
  let isaConfig = response.content?.trim() || ''
  isaConfig = isaConfig.replace(/^```yaml\s*/i, '').replace(/\s*```$/i, '')

  return { success: true, isaConfig }
}

/**
 * 批量修正多個 Feature Files 格式錯誤
 * 優化：一次 LLM 調用修復所有 Features，節省 Token
 */
export async function fixMultipleFeatures(
  features: Array<{ name: string; content: string; errors: string[] }>,
  trackingContext?: LlmTrackingContext
): Promise<{
  success: boolean
  fixedFeatures?: Array<{ name: string; content: string }>
  error?: string
}> {
  if (features.length === 0) {
    return { success: true, fixedFeatures: [] }
  }

  const systemPrompt = `你是一位 sdd.os ISA Gherkin 專家。請修正以下多個 Feature Files 的格式錯誤。

## sdd.os ISA 格式規範
1. 檔案開頭必須有 \`# Action:\` 和 \`# Summary:\` 註解
2. 每個 Rule 必須標註 \`前置\` 或 \`後置\`
3. When 格式：\`{summary}, call table:\`
4. Then 成功格式：\`{summary}成功, with table:\`
5. Then 失敗格式：\`操作失敗\`
6. Entity 驗證格式：\`存在一個{entity}, with table:\`

## 輸出格式
請以 JSON 格式輸出修正後的內容：
\`\`\`json
{
  "features": [
    { "name": "Feature名稱", "content": "修正後的完整內容" }
  ]
}
\`\`\``

  // 構建用戶消息，包含所有需要修復的 Features
  const userMessage = features.map(f =>
    `### Feature: ${f.name}\n\n**錯誤**:\n${f.errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}\n\n**內容**:\n\`\`\`gherkin\n${f.content}\n\`\`\``
  ).join('\n\n---\n\n')

  const response = await callClaude(
    systemPrompt,
    [{ role: 'user', content: userMessage }],
    { maxTokens: 16384, temperature: 0.1 },
    trackingContext
  )

  if (!response.success) {
    return { success: false, error: response.error }
  }

  try {
    const jsonMatch = response.content?.match(/```json\s*([\s\S]*?)\s*```/) ||
                      response.content?.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { success: false, error: '無法解析 LLM 回應' }
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0]
    const parsed = JSON.parse(jsonStr)

    return {
      success: true,
      fixedFeatures: parsed.features || [],
    }
  } catch (err) {
    return { success: false, error: `解析回應時發生錯誤: ${err}` }
  }
}

// ============================================================
// Feature File 驗證函數
// 模擬 validate-feature.ts 和 lint-gherkin-format.ts 的邏輯
// ============================================================

// 錯誤代碼定義
const ERROR_CODES = {
  MISSING_ACTION_ANNOTATION: 'E001',
  MISSING_SUMMARY_ANNOTATION: 'E002',
  MISSING_FEATURE_DECLARATION: 'E003',
  SUMMARY_FEATURE_MISMATCH: 'E004',
  RULE_MISSING_PRE_POST: 'E005',
  WHEN_FORMAT_INVALID: 'E006',
  THEN_FORMAT_INVALID: 'E007',
  NO_EXAMPLE: 'E008',
}

// 驗證用正規表示式
const VALIDATION_PATTERNS = {
  actionAnnotation: /^#\s*Action:\s*(\w+)\s*$/m,
  summaryAnnotation: /^#\s*Summary:\s*(.+)\s*$/m,
  featureDeclaration: /^Feature:\s*(.+)\s*$/m,
  ruleWithPrePost: /^\s*Rule:\s*(前置|後置)\s*-\s*(.+)\s*$/,
  exampleDeclaration: /^\s*Example:\s*(.+)\s*$/gm,
  scenarioDeclaration: /^\s*Scenario:\s*(.+)\s*$/gm,
  // ISA 格式正規表示式
  whenCallTable: /^.+, call table:$/,
  thenSuccess: /^.+成功,?\s*with table:$/,
  thenFailure: /^操作失敗$/,
  entityValidate: /^存在一個[\u4e00-\u9fffa-zA-Z]+, with table:$/,
  entitySetup: /^準備一個[\u4e00-\u9fffa-zA-Z]+, with table:$/,
}

export interface ValidationError {
  code: string
  message: string
  line?: number
  suggestion?: string
}

export interface ValidationWarning {
  code: string
  message: string
  line?: number
}

export interface FeatureValidationResult {
  passed: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

/**
 * 驗證 Feature 內容是否符合 sdd.os ISA 格式
 * 模擬 validate-feature.ts 和 lint-gherkin-format.ts 的邏輯
 */
export function validateFeatureContent(content: string): FeatureValidationResult {
  const result: FeatureValidationResult = {
    passed: true,
    errors: [],
    warnings: [],
  }

  const lines = content.split('\n')

  // 1. 檢查 Action 註解 (E001)
  if (!VALIDATION_PATTERNS.actionAnnotation.test(content)) {
    result.passed = false
    result.errors.push({
      code: ERROR_CODES.MISSING_ACTION_ANNOTATION,
      message: '缺少 Action 註解',
      suggestion: '在檔案開頭加入: # Action: functionName',
    })
  }

  // 2. 檢查 Summary 註解 (E002)
  if (!VALIDATION_PATTERNS.summaryAnnotation.test(content)) {
    result.passed = false
    result.errors.push({
      code: ERROR_CODES.MISSING_SUMMARY_ANNOTATION,
      message: '缺少 Summary 註解',
      suggestion: '在 Action 註解下方加入: # Summary: 功能名稱',
    })
  }

  // 3. 檢查 Feature 宣告 (E003)
  if (!VALIDATION_PATTERNS.featureDeclaration.test(content)) {
    result.passed = false
    result.errors.push({
      code: ERROR_CODES.MISSING_FEATURE_DECLARATION,
      message: '缺少 Feature 宣告',
      suggestion: '加入: Feature: 功能名稱',
    })
  }

  // 4. 檢查 Summary 與 Feature 名稱是否一致 (E004)
  const summaryMatch = content.match(VALIDATION_PATTERNS.summaryAnnotation)
  const featureMatch = content.match(VALIDATION_PATTERNS.featureDeclaration)
  if (summaryMatch && featureMatch) {
    const summary = summaryMatch[1].trim()
    const featureName = featureMatch[1].trim()
    if (summary !== featureName) {
      result.passed = false
      result.errors.push({
        code: ERROR_CODES.SUMMARY_FEATURE_MISMATCH,
        message: `Summary "${summary}" 與 Feature 名稱 "${featureName}" 不一致`,
        suggestion: '確保 Summary 與 Feature 名稱完全相同',
      })
    }
  }

  // 5. 檢查所有 Rule 是否有前置/後置標註 (E005)
  lines.forEach((line, index) => {
    if (/^\s*Rule:/.test(line) && !VALIDATION_PATTERNS.ruleWithPrePost.test(line.trim())) {
      result.passed = false
      result.errors.push({
        code: ERROR_CODES.RULE_MISSING_PRE_POST,
        message: `Rule 缺少前置/後置標註: "${line.trim()}"`,
        line: index + 1,
        suggestion: '格式應為: Rule: 前置 - 規則描述 或 Rule: 後置 - 規則描述',
      })
    }
  })

  // 6. 檢查 When 步驟格式 (E006) - ISA 格式驗證
  lines.forEach((line, index) => {
    const whenMatch = line.match(/^\s*When\s+(.+)\s*$/)
    if (whenMatch) {
      const whenContent = whenMatch[1].trim()
      // 應該符合 {summary}, call table: 格式
      if (!VALIDATION_PATTERNS.whenCallTable.test(whenContent)) {
        result.passed = false
        result.errors.push({
          code: ERROR_CODES.WHEN_FORMAT_INVALID,
          message: `When 步驟格式錯誤: "${whenContent}"`,
          line: index + 1,
          suggestion: '格式應為: When {summary}, call table:',
        })
      }
    }
  })

  // 7. 檢查 Then 步驟格式 (E007) - ISA 格式驗證
  lines.forEach((line, index) => {
    const thenMatch = line.match(/^\s*Then\s+(.+)\s*$/)
    if (thenMatch) {
      const thenContent = thenMatch[1].trim()
      const isSuccess = VALIDATION_PATTERNS.thenSuccess.test(thenContent)
      const isFailure = VALIDATION_PATTERNS.thenFailure.test(thenContent)
      const isEntityValidation = VALIDATION_PATTERNS.entityValidate.test(thenContent)

      if (!isSuccess && !isFailure && !isEntityValidation) {
        // 可能是格式問題，添加警告
        result.warnings.push({
          code: 'W002',
          message: `Then 步驟格式可能不正確: "${thenContent}"`,
          line: index + 1,
        })
      }
    }
  })

  // 8. 檢查 And 步驟中的 Entity 驗證格式
  lines.forEach((line, index) => {
    const andMatch = line.match(/^\s*And\s+(.+)\s*$/)
    if (andMatch) {
      const andContent = andMatch[1].trim()
      // 如果是 Entity 驗證，檢查格式
      if (andContent.startsWith('存在一個') && !VALIDATION_PATTERNS.entityValidate.test(andContent)) {
        result.warnings.push({
          code: 'W003',
          message: `Entity 驗證格式可能不正確: "${andContent}"`,
          line: index + 1,
        })
      }
    }
  })

  // 9. 檢查是否有 Example (E008)
  const exampleMatches = content.match(VALIDATION_PATTERNS.exampleDeclaration)
  const scenarioMatches = content.match(VALIDATION_PATTERNS.scenarioDeclaration)
  if (!exampleMatches && !scenarioMatches) {
    result.passed = false
    result.errors.push({
      code: ERROR_CODES.NO_EXAMPLE,
      message: '沒有找到任何 Example 或 Scenario',
      suggestion: '每個 Rule 至少需要一個 Example',
    })
  }

  return result
}

/**
 * 驗證多個 Feature 內容
 */
export function validateMultipleFeatures(
  features: Array<{ name: string; content: string }>
): {
  passed: boolean
  results: Array<{
    name: string
    validation: FeatureValidationResult
  }>
  totalErrors: number
  totalWarnings: number
  allErrors: ValidationError[]
  allWarnings: ValidationWarning[]
} {
  const results: Array<{
    name: string
    validation: FeatureValidationResult
  }> = []

  const allErrors: ValidationError[] = []
  const allWarnings: ValidationWarning[] = []

  for (const feature of features) {
    const validation = validateFeatureContent(feature.content)
    results.push({ name: feature.name, validation })

    // 收集所有錯誤，加上 feature 名稱前綴
    for (const error of validation.errors) {
      allErrors.push({
        ...error,
        message: `${feature.name}: ${error.message}`,
      })
    }
    for (const warning of validation.warnings) {
      allWarnings.push({
        ...warning,
        message: `${feature.name}: ${warning.message}`,
      })
    }
  }

  return {
    passed: results.every(r => r.validation.passed),
    results,
    totalErrors: allErrors.length,
    totalWarnings: allWarnings.length,
    allErrors,
    allWarnings,
  }
}
