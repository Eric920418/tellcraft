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

/**
 * 處理用戶回答，決定是否需要更多問題
 */
export async function processAnswer(
  originalQuestion: string,
  userAnswer: string,
  allQuestionsAndAnswers: Array<{ question: string; answer: string }>,
  requirements: string
): Promise<{
  success: boolean
  needMoreQuestions: boolean
  summary?: string
  followUpQuestions?: Array<{
    id: string
    question: string
    category: 'data' | 'feature' | 'terminology'
    priority: 'high' | 'medium' | 'low'
    options?: Array<{ label: string; description: string }>
  }>
  error?: string
}> {
  const systemPrompt = `你是一位 BDD 分析師。用戶剛回答了一個釐清問題，請分析這個回答：

1. 這個回答是否清楚、完整？
2. 是否引發了新的問題需要釐清？
3. 根據目前所有的問答，需求是否已經足夠清楚？

**輸出格式**（JSON）：
{
  "answerClear": true/false,
  "answerSummary": "對回答的簡短總結",
  "needMoreQuestions": true/false,
  "followUpQuestions": [
    {
      "id": "Q-follow-1",
      "question": "追問問題",
      "category": "data" | "feature" | "terminology",
      "priority": "high" | "medium" | "low",
      "options": [...]
    }
  ],
  "specReadiness": "ready" | "almost" | "needs_more"
}`

  const qaHistory = allQuestionsAndAnswers
    .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`)
    .join('\n\n')

  const userMessage = `原始需求：
${requirements}

---

已釐清的問答：
${qaHistory}

---

最新問題：${originalQuestion}
最新回答：${userAnswer}`

  const response = await callClaude(systemPrompt, [{ role: 'user', content: userMessage }])

  if (!response.success) {
    return { success: false, needMoreQuestions: false, error: response.error }
  }

  try {
    const jsonMatch = response.content?.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { success: false, needMoreQuestions: false, error: '無法解析 LLM 回應' }
    }

    const parsed = JSON.parse(jsonMatch[0])
    return {
      success: true,
      needMoreQuestions: parsed.needMoreQuestions || false,
      summary: parsed.answerSummary,
      followUpQuestions: parsed.followUpQuestions || [],
    }
  } catch (err) {
    return { success: false, needMoreQuestions: false, error: `解析回應時發生錯誤: ${err}` }
  }
}

/**
 * 產出 BDD 規格摘要
 */
export async function generateSpecSummary(
  requirements: string,
  questionsAndAnswers: Array<{ question: string; answer: string }>,
  projectContext?: string
): Promise<{
  success: boolean
  summary?: {
    entities: Array<{ name: string; description: string; attributes: string[] }>
    features: Array<{ name: string; description: string; rules: string[] }>
    decisions: Array<{ question: string; answer: string; impact: string }>
  }
  error?: string
}> {
  const systemPrompt = `你是一位 BDD 分析師。根據需求和釐清問答，產出規格摘要。

**輸出格式**（JSON）：
{
  "summary": {
    "entities": [
      { "name": "實體名稱", "description": "說明", "attributes": ["屬性1", "屬性2"] }
    ],
    "features": [
      { "name": "功能名稱", "description": "說明", "rules": ["規則1", "規則2"] }
    ],
    "decisions": [
      { "question": "釐清的問題", "answer": "決定", "impact": "這個決定如何影響規格" }
    ]
  }
}`

  const qaHistory = questionsAndAnswers
    .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`)
    .join('\n\n')

  const userMessage = `${projectContext ? `專案背景：${projectContext}\n\n` : ''}需求描述：
${requirements}

---

釐清問答：
${qaHistory}`

  const response = await callClaude(systemPrompt, [{ role: 'user', content: userMessage }])

  if (!response.success) {
    return { success: false, error: response.error }
  }

  try {
    const jsonMatch = response.content?.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { success: false, error: '無法解析 LLM 回應' }
    }

    const parsed = JSON.parse(jsonMatch[0])
    return { success: true, summary: parsed.summary }
  } catch (err) {
    return { success: false, error: `解析回應時發生錯誤: ${err}` }
  }
}

// ============================================================
// BDD Spec 完整流程 - Phase 1-5 專用 Prompts
// ============================================================

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
  options?: Array<{ label: string; description: string }>
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
  trackingContext?: LlmTrackingContext
): Promise<{
  success: boolean
  items?: ClarifyItem[]
  coverageSummary?: Record<string, 'clear' | 'partial' | 'missing'>
  error?: string
}> {
  const existingQuestions = existingItems?.map(item => item.question) || []

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
- 一次最多返回 10 個問題
- 按優先級排序：High → Medium → Low

${existingQuestions.length ? `\n**已經問過的問題**（不要重複）：\n${existingQuestions.join('\n')}` : ''}`

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
 * 白話翻譯問題
 * 將技術問題翻譯為用戶可理解的白話文
 */
export async function translateToWhiteText(
  question: string,
  terminology: Map<string, string>,
  trackingContext?: LlmTrackingContext
): Promise<{
  success: boolean
  whiteText?: string
  error?: string
}> {
  const termList = Array.from(terminology.entries())
    .map(([en, zh]) => `- ${en}: ${zh}`)
    .join('\n')

  const systemPrompt = `你是一位翻譯專家。將以下技術問題翻譯為白話文，讓非技術人員也能理解。

## 翻譯規則
1. 將英文欄位名替換為中文（使用提供的術語對照表）
2. 首次提及時可用小括號備註英文，如：「價格 (price)」
3. 將技術詞彙轉換為領域語言：
   - 「屬性」→「資訊」
   - 「欄位」→「項目」
   - 「關係」→「關聯」
   - 「約束」→「限制」
   - >= → 「大於等於」
   - != → 「不等於」
   - null → 「空白」或「未設定」
4. 保持問題的完整語義，不簡化技術細節
5. 嚴禁發明新術語

## 術語對照表
${termList || '（無）'}

直接輸出翻譯後的問題，不要加任何其他說明。`

  const response = await callClaude(
    systemPrompt,
    [{ role: 'user', content: question }],
    { maxTokens: 1024, temperature: 0.2 },
    trackingContext
  )

  if (!response.success) {
    return { success: false, error: response.error }
  }

  return {
    success: true,
    whiteText: response.content?.trim(),
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
  const existingQuestions = existingItems?.map(item => item.question) || []

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

${existingQuestions.length ? `\n**已經問過的問題**（不要重複）：\n${existingQuestions.join('\n')}` : ''}`

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
 * 修正 Feature File 格式錯誤
 */
export async function fixFeatureFormat(
  featureContent: string,
  errors: string[],
  trackingContext?: LlmTrackingContext
): Promise<{
  success: boolean
  fixedContent?: string
  error?: string
}> {
  const systemPrompt = `你是一位 sdd.os ISA Gherkin 專家。請修正以下 Feature File 的格式錯誤。

## sdd.os ISA 格式規範
1. 檔案開頭必須有 \`# Action:\` 和 \`# Summary:\` 註解
2. 每個 Rule 必須標註 \`前置\` 或 \`後置\`
3. When 格式：\`{summary}, call table:\`
4. Then 成功格式：\`{summary}成功, with table:\`
5. Then 失敗格式：\`操作失敗\`
6. Entity 驗證格式：\`存在一個{entity}, with table:\`

## 錯誤列表
${errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}

直接輸出修正後的完整 Feature File 內容，不要加任何說明。`

  const response = await callClaude(
    systemPrompt,
    [{ role: 'user', content: featureContent }],
    { maxTokens: 8192, temperature: 0.1 },
    trackingContext
  )

  if (!response.success) {
    return { success: false, error: response.error }
  }

  // 提取 gherkin 內容
  let fixedContent = response.content?.trim() || ''
  const gherkinMatch = fixedContent.match(/```gherkin\s*([\s\S]*?)\s*```/)
  if (gherkinMatch) {
    fixedContent = gherkinMatch[1]
  }

  return { success: true, fixedContent }
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
