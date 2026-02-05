// ============================================================
// LLM 服務 - Anthropic Claude API
// 注意：這個模組直接在服務器端使用，不是 Server Actions
// ============================================================

import { db } from './db'

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

// Claude 定價 (每百萬 tokens，美元)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-5-20250929': { input: 3, output: 15 },  // 最新 Sonnet 4.5
  'claude-opus-4-5-20250514': { input: 15, output: 75 },   // Opus 4.5
  'claude-haiku-4-5-20251001': { input: 0.8, output: 4 },
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
 * 修復被截斷的 JSON
 * 嘗試找到最後一個完整的數組元素，截斷後面的部分
 */
function repairTruncatedJson(jsonStr: string): string | null {
  try {
    // 常見的截斷情況：數組中間被截斷
    // 策略：找到 "items" 數組，保留完整的元素

    // 找到 items 數組的開始位置
    const itemsMatch = jsonStr.match(/"items"\s*:\s*\[/)
    if (!itemsMatch || itemsMatch.index === undefined) {
      return null
    }

    const itemsStart = itemsMatch.index + itemsMatch[0].length

    // 從 items 數組開始，找到所有完整的對象
    let depth = 1  // 已經在數組內
    let lastCompleteItemEnd = itemsStart
    let inString = false
    let escapeNext = false

    for (let i = itemsStart; i < jsonStr.length; i++) {
      const char = jsonStr[i]

      if (escapeNext) {
        escapeNext = false
        continue
      }

      if (char === '\\') {
        escapeNext = true
        continue
      }

      if (char === '"') {
        inString = !inString
        continue
      }

      if (inString) continue

      if (char === '{') {
        depth++
      } else if (char === '}') {
        depth--
        if (depth === 1) {
          // 完成了一個完整的對象
          lastCompleteItemEnd = i + 1
        }
      } else if (char === '[') {
        depth++
      } else if (char === ']') {
        depth--
        if (depth === 0) {
          // 數組正常結束
          return null  // 不需要修復
        }
      }
    }

    // 如果我們找到了至少一個完整的對象，構建修復後的 JSON
    if (lastCompleteItemEnd > itemsStart) {
      // 提取到最後一個完整對象的部分
      const repairedItems = jsonStr.substring(0, lastCompleteItemEnd)
      // 關閉數組和對象
      const repaired = repairedItems + ']}'

      // 驗證修復後的 JSON
      JSON.parse(repaired)
      console.log(`[LLM] JSON 修復：截斷位置 ${lastCompleteItemEnd}，原長度 ${jsonStr.length}`)
      return repaired
    }

    return null
  } catch {
    return null
  }
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
  try {
    await db.from('llm_usage').insert({
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
 * 呼叫 Claude API（含 rate limit 重試機制）
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
  const maxRetries = 3
  const baseDelay = 30000 // 30 秒基礎等待時間

  for (let attempt = 0; attempt < maxRetries; attempt++) {
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

        // 檢查是否為 rate limit 錯誤
        if (response.status === 429 || errorText.includes('rate_limit_error')) {
          if (attempt < maxRetries - 1) {
            // 從 header 取得重試等待時間，或使用指數退避
            const retryAfter = response.headers.get('retry-after')
            const waitTime = retryAfter
              ? parseInt(retryAfter, 10) * 1000
              : baseDelay * Math.pow(2, attempt)

            console.log(`[LLM] Rate limit hit, waiting ${waitTime / 1000}s before retry ${attempt + 1}/${maxRetries}...`)
            await new Promise(resolve => setTimeout(resolve, waitTime))
            continue
          }
        }

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
      // 如果是網路錯誤且還有重試次數，繼續重試
      if (attempt < maxRetries - 1) {
        console.log(`[LLM] 請求失敗，重試 ${attempt + 1}/${maxRetries}...`, err)
        await new Promise(resolve => setTimeout(resolve, baseDelay))
        continue
      }
      return { success: false, error: `呼叫 LLM 時發生錯誤: ${err}` }
    }
  }

  return { success: false, error: '超過最大重試次數' }
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
- 每個問題提供 2-4 個常見選項（不需要「其他」選項，用戶可以直接輸入自訂答案）
- 白話翻譯：將英文欄位名替換為中文，移除程式語法符號
- 不要問太技術的問題，用領域語言
- **最多列出 5 個問題**（小批量，確保問題間有邏輯連貫性）
- 按優先級排序：High → Medium → Low
${existingQA.length ? `

**已經釐清的問題**（這些主題已經確認，不要再問）：
${existingQA.join('\n\n')}` : ''}
${pendingQuestions.length ? `

**待處理的問題**（這些問題正在等待回答，不要重複）：
${pendingQuestions.join('\n')}` : ''}

**核心原則**：
1. **不重複**：不要問與已釐清問題語意相似的問題
2. **邏輯推論**：根據已有答案推論哪些功能/情況已被排除，不要問邏輯上不可能存在的問題
3. **理解隱含意義**：用戶的回答可能隱含排除了某些功能，仔細分析答案的完整含義`

  const userMessage = projectContext
    ? `專案背景：${projectContext}\n\n需求描述：\n${requirements}`
    : `需求描述：\n${requirements}`

  const response = await callClaude(
    systemPrompt,
    [{ role: 'user', content: userMessage }],
    { maxTokens: 16384, temperature: 0.3 },  // 增加 max_tokens
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

    let jsonStr = jsonMatch[1] || jsonMatch[0]

    // 嘗試解析 JSON，如果失敗則嘗試修復截斷的 JSON
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: any
    try {
      parsed = JSON.parse(jsonStr)
    } catch (parseError) {
      console.log('[LLM] PRD Discovery JSON 解析失敗，嘗試修復截斷的 JSON...')
      const repaired = repairTruncatedJson(jsonStr)
      if (repaired) {
        parsed = JSON.parse(repaired)
        console.log('[LLM] JSON 修復成功')
      } else {
        throw parseError
      }
    }

    // 為每個項目設置初始狀態
    const items: ClarifyItem[] = (parsed.items || []).map((item: Partial<ClarifyItem>) => ({
      ...item,
      status: 'pending' as const,
    })) as ClarifyItem[]

    // 語意去重：過濾掉與現有問題重複的新問題
    if (items.length > 0 && existingItems && existingItems.length > 0) {
      const filteredItems = await filterDuplicateQuestions(items, existingItems, trackingContext)
      console.log(`[LLM] 語意去重: ${items.length} → ${filteredItems.length} 題`)
      return {
        success: true,
        items: filteredItems,
        coverageSummary: parsed.coverageSummary as Record<string, 'clear' | 'partial' | 'missing'> | undefined,
      }
    }

    return {
      success: true,
      items,
      coverageSummary: parsed.coverageSummary as Record<string, 'clear' | 'partial' | 'missing'> | undefined,
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
    { maxTokens: 1024, temperature: 0, model: 'claude-haiku-4-5-20251001' }, // 用 Haiku 省錢
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
 * 邏輯過濾：根據已回答的問題，過濾掉邏輯上不相關的待處理問題
 * 例如：用戶說「分類是固定的」，就過濾掉「刪除分類後怎麼辦」
 */
export async function filterIrrelevantQuestions(
  pendingItems: ClarifyItem[],
  answeredItems: ClarifyItem[],
  trackingContext?: LlmTrackingContext
): Promise<ClarifyItem[]> {
  // 如果沒有已回答的問題，或沒有待處理的問題，直接返回
  if (answeredItems.length === 0 || pendingItems.length === 0) {
    return pendingItems
  }

  // 提取已回答的 Q&A
  const answeredQA = answeredItems
    .filter(item => item.answer)
    .map((item, i) => ({
      id: i + 1,
      question: item.whiteTextQuestion || item.question,
      answer: item.answer,
    }))

  // 待處理的問題
  const pendingQuestions = pendingItems.map((item, i) => ({
    id: i + 1,
    question: item.whiteTextQuestion || item.question,
  }))

  const systemPrompt = `你是一個邏輯推理專家。根據用戶已經回答的問題，判斷哪些待處理的問題已經**邏輯上不相關**，應該被過濾掉。

## 判斷原則

過濾掉以下類型的問題：
1. **功能已被排除**：用戶說不需要某功能，則該功能的所有相關問題都應過濾
2. **邏輯上不可能**：用戶的回答已經排除了某種情況的存在
3. **答案已隱含**：問題的答案可以從已有回答直接推導出來

## 輸出格式

\`\`\`json
{
  "keep": [1, 3, 5],
  "filtered": [
    { "id": 2, "reason": "簡短說明為何過濾" }
  ]
}
\`\`\`

## 重要
- 仔細分析每個答案的**完整隱含意義**
- 只過濾**明確邏輯上不相關**的問題
- 如果不確定，就保留（寧可多問，不要漏問）
- 輸出純 JSON`

  const userMessage = `## 已回答的問題

${answeredQA.map(qa => `${qa.id}. Q: ${qa.question}\n   A: ${qa.answer}`).join('\n\n')}

## 待處理的問題

${pendingQuestions.map(q => `${q.id}. ${q.question}`).join('\n')}

請判斷哪些待處理的問題應該被過濾掉。`

  const response = await callClaude(
    systemPrompt,
    [{ role: 'user', content: userMessage }],
    { model: 'claude-haiku-4-5-20251001', maxTokens: 2048, temperature: 0 },
    trackingContext
  )

  if (!response.success || !response.content) {
    console.log('[LLM] 邏輯過濾失敗，保留所有問題')
    return pendingItems
  }

  try {
    const jsonMatch = response.content.match(/```json\s*([\s\S]*?)\s*```/) ||
                      response.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return pendingItems
    }

    const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0])
    const keepIds = new Set(parsed.keep || [])

    // 記錄被過濾的問題
    if (parsed.filtered?.length > 0) {
      console.log('[LLM] 邏輯過濾問題:')
      parsed.filtered.forEach((f: { id: number; reason: string }) => {
        const item = pendingItems[f.id - 1]
        console.log(`  - [${f.id}] ${item?.whiteTextQuestion?.substring(0, 30)}... → ${f.reason}`)
      })
    }

    const filtered = pendingItems.filter((_, i) => keepIds.has(i + 1))
    console.log(`[LLM] 邏輯過濾: ${pendingItems.length} → ${filtered.length} 題`)
    return filtered
  } catch (err) {
    console.log('[LLM] 解析邏輯過濾結果失敗:', err)
    return pendingItems
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
/**
 * Step 1: 識別所有需要的 Feature
 */
export async function identifyFeatures(
  requirements: string,
  resolvedItems: ClarifyItem[],
  schemaSql: string,
  projectContext?: string,
  trackingContext?: LlmTrackingContext
): Promise<{
  success: boolean
  features?: Array<{ name: string; actionName: string; description: string }>
  error?: string
}> {
  const decisions = resolvedItems
    .filter(item => item.status === 'resolved' && item.answer)
    .map(item => `Q: ${item.whiteTextQuestion}\nA: ${item.answer}`)
    .join('\n\n')

  const systemPrompt = `你是一位資深的 BDD 分析師。根據需求和 Schema，識別所有需要的功能（Feature）。

## 任務
分析需求，列出所有需要實現的功能。每個功能對應一個 Server Action。

## 輸出格式
\`\`\`json
{
  "features": [
    {
      "name": "建立訂單",
      "actionName": "createOrder",
      "description": "用戶可以建立新訂單，包含商品和數量"
    },
    {
      "name": "取消訂單",
      "actionName": "cancelOrder",
      "description": "用戶可以取消未出貨的訂單"
    }
  ]
}
\`\`\`

## 規則
1. 每個功能名稱要簡潔明確（如「建立訂單」而非「訂單建立功能」）
2. actionName 用 camelCase（如 createOrder）
3. description 簡述功能用途和主要規則`

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
    { maxTokens: 4096, temperature: 0.3 },
    { ...trackingContext, purpose: 'identify_features' }
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
 * Feature 接口摘要（用於跨 Feature 一致性）
 */
interface FeatureSummary {
  name: string
  actionName: string
  inputs: string   // 輸入參數摘要
  outputs: string  // 輸出結果摘要
}

/**
 * Step 2: 生成單個 Feature 的完整內容
 */
export async function generateSingleFeature(
  featureInfo: { name: string; actionName: string; description: string },
  requirements: string,
  resolvedItems: ClarifyItem[],
  schemaSql: string,
  entityMapping: string,
  projectContext?: string,
  trackingContext?: LlmTrackingContext,
  previousFeatures?: FeatureSummary[]  // 已生成的 Features 摘要
): Promise<{
  success: boolean
  feature?: { name: string; actionName: string; content: string }
  featureSummary?: FeatureSummary  // 返回這個 Feature 的摘要供下一個使用
  error?: string
}> {
  const decisions = resolvedItems
    .filter(item => item.status === 'resolved' && item.answer)
    .map(item => `Q: ${item.whiteTextQuestion}\nA: ${item.answer}`)
    .join('\n\n')

  // 構建已生成 Features 的上下文
  const previousFeaturesContext = previousFeatures && previousFeatures.length > 0
    ? `## 已生成的其他功能（請保持接口一致）

${previousFeatures.map((f, i) => `${i + 1}. **${f.name}** (${f.actionName})
   - 輸入：${f.inputs}
   - 輸出：${f.outputs}`).join('\n\n')}

**重要**：如果你的功能需要引用其他功能的輸出（如 orderId），請使用與上面一致的命名。

---

`
    : ''

  const systemPrompt = `你是一位資深的 BDD 分析師。為指定的功能產出完整的 sdd.os ISA 格式 Feature File。

## 要產出的功能
- 名稱：${featureInfo.name}
- Action：${featureInfo.actionName}
- 描述：${featureInfo.description}

${previousFeaturesContext}## sdd.os ISA Gherkin 格式

\`\`\`gherkin
# Action: ${featureInfo.actionName}
# Summary: ${featureInfo.name}
Feature: ${featureInfo.name}

  Background:
    Given 準備一個{entity}, with table:
      | column1 | column2 |
      | value1  | value2  |

  #------------------------------------------------------------
  Rule: 前置/後置 - 規則描述
  #------------------------------------------------------------

    Example: 例子名稱
      When ${featureInfo.name}, call table:
        | param1 | param2 |
        | value1 | value2 |
      Then ${featureInfo.name}成功, with table:
        | field1 | field2 |
        | value1 | value2 |
      And 存在一個{entity}, with table:
        | column1 | column2 |
        | value1  | value2  |

    Example: 錯誤情境
      When ${featureInfo.name}, call table:
        | param1 | param2 |
        | value1 | value2 |
      Then 操作失敗
\`\`\`

## 格式規則
1. **Action 綁定**：檔案開頭必須有 \`# Action:\` 和 \`# Summary:\` 註解
2. **Rule 標註**：每個 Rule 必須標註 \`前置\` 或 \`後置\`
3. **When 格式**：\`${featureInfo.name}, call table:\`
4. **Then 成功格式**：\`${featureInfo.name}成功, with table:\`
5. **Then 失敗格式**：\`操作失敗\`
6. **Entity 驗證格式**：\`存在一個{entity}, with table:\`
7. **summary 一致**：Feature 名稱必須與 When/Then 中的 summary 一致

## Entity 映射
${entityMapping}

## 輸出
直接輸出完整的 .feature 檔案內容，不需要 JSON 包裝。以 \`# Action:\` 開頭。`

  const userMessage = `${projectContext ? `專案背景：${projectContext}\n\n` : ''}需求描述：
${requirements}

---

SQL Schema：
${schemaSql}

---

釐清決策：
${decisions || '（無額外決策）'}

---

請產出「${featureInfo.name}」的完整 Feature File 內容。`

  const response = await callClaude(
    systemPrompt,
    [{ role: 'user', content: userMessage }],
    { maxTokens: 8192, temperature: 0.3 },
    { ...trackingContext, purpose: 'generate_single_feature' }
  )

  if (!response.success) {
    return { success: false, error: response.error }
  }

  // 直接使用回應內容作為 feature content
  const content = response.content?.trim() || ''

  // 驗證內容是否包含必要元素
  if (!content.includes('# Action:') || !content.includes('Feature:')) {
    return { success: false, error: '生成的內容缺少必要元素' }
  }

  // 從生成的內容中提取輸入輸出摘要（用於跨 Feature 一致性）
  const featureSummary = extractFeatureSummary(content, featureInfo)

  return {
    success: true,
    feature: {
      name: featureInfo.name,
      actionName: featureInfo.actionName,
      content,
    },
    featureSummary,
  }
}

/**
 * 從 Feature 內容中提取輸入輸出摘要
 */
function extractFeatureSummary(
  content: string,
  featureInfo: { name: string; actionName: string }
): FeatureSummary {
  // 提取 When 步驟的表格欄位作為輸入
  const whenMatch = content.match(/When\s+[^,]+,\s*call table:\s*\n\s*\|([^|]+(?:\|[^|]+)*)\|/i)
  const inputs = whenMatch
    ? whenMatch[1].split('|').map(s => s.trim()).filter(Boolean).join(', ')
    : '(未識別)'

  // 提取 Then 成功步驟的表格欄位作為輸出
  const thenMatch = content.match(/Then\s+[^,]+成功,?\s*with table:\s*\n\s*\|([^|]+(?:\|[^|]+)*)\|/i)
  const outputs = thenMatch
    ? thenMatch[1].split('|').map(s => s.trim()).filter(Boolean).join(', ')
    : '(未識別)'

  return {
    name: featureInfo.name,
    actionName: featureInfo.actionName,
    inputs,
    outputs,
  }
}

/**
 * 完整的 Feature Files 生成（分批處理，避免截斷）
 */
export async function generateFeatureFiles(
  requirements: string,
  resolvedItems: ClarifyItem[],
  schemaSql: string,
  entityMapping: string,
  projectContext?: string,
  trackingContext?: LlmTrackingContext,
  onProgress?: (current: number, total: number, featureName: string) => Promise<void>
): Promise<{
  success: boolean
  features?: Array<{ name: string; actionName: string; content: string }>
  error?: string
}> {
  // Step 1: 識別所有 Features
  const identifyResult = await identifyFeatures(
    requirements,
    resolvedItems,
    schemaSql,
    projectContext,
    trackingContext
  )

  if (!identifyResult.success || !identifyResult.features) {
    return { success: false, error: identifyResult.error || '識別功能失敗' }
  }

  const featureInfos = identifyResult.features
  const generatedFeatures: Array<{ name: string; actionName: string; content: string }> = []
  const featureSummaries: FeatureSummary[] = []  // 收集已生成 Features 的摘要

  // Step 2: 逐個生成每個 Feature（傳入已生成的摘要保持一致性）
  for (let i = 0; i < featureInfos.length; i++) {
    const featureInfo = featureInfos[i]

    // 回報進度
    if (onProgress) {
      await onProgress(i + 1, featureInfos.length, featureInfo.name)
    }

    const result = await generateSingleFeature(
      featureInfo,
      requirements,
      resolvedItems,
      schemaSql,
      entityMapping,
      projectContext,
      trackingContext,
      featureSummaries  // 傳入已生成的 Features 摘要
    )

    if (!result.success || !result.feature) {
      console.error(`[LLM] 生成 Feature "${featureInfo.name}" 失敗:`, result.error)
      // 繼續生成其他 Features，不中斷整個流程
      continue
    }

    generatedFeatures.push(result.feature)

    // 收集這個 Feature 的摘要，供下一個 Feature 參考
    if (result.featureSummary) {
      featureSummaries.push(result.featureSummary)
    }
  }

  if (generatedFeatures.length === 0) {
    return { success: false, error: '沒有成功生成任何 Feature' }
  }

  return {
    success: true,
    features: generatedFeatures,
  }
}

/**
 * Phase 3: Spec Discovery - 對產出的 Feature Files 進行再次檢查
 */
export async function runSpecDiscovery(
  features: Array<{ name: string; content: string }>,
  schemaSql: string,
  existingItems?: ClarifyItem[],
  trackingContext?: LlmTrackingContext,
  options?: { maxItems?: number }  // 預設 5，初始發現可設 15
): Promise<{
  success: boolean
  items?: ClarifyItem[]
  error?: string
}> {
  const maxItems = options?.maxItems ?? 5
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
- 一次最多返回 ${maxItems} 個問題
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
  database: db

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
      executor: db-query
      mode: existence-check

    entity_prepare:
      pattern: "準備一個{entity}, with table:"
      executor: db-insert
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
  resolvedItems: ClarifyItem[],
  trackingContext?: LlmTrackingContext
): Promise<{
  success: boolean
  fixedFeatures?: Array<{ name: string; content: string }>
  error?: string
}> {
  if (features.length === 0) {
    return { success: true, fixedFeatures: [] }
  }

  // 構建用戶釐清決策
  const decisions = resolvedItems
    .filter(item => item.status === 'resolved' && item.answer)
    .map(item => `Q: ${item.whiteTextQuestion}\nA: ${item.answer}`)
    .join('\n\n')

  const systemPrompt = `你是一位 sdd.os ISA Gherkin 專家。請修正以下多個 Feature Files 的格式錯誤。

## sdd.os ISA 格式規範
1. 檔案開頭必須有 \`# Action:\` 和 \`# Summary:\` 註解
2. 每個 Rule 必須標註 \`前置\` 或 \`後置\`
3. When 格式：\`{summary}, call table:\`
4. Then 成功格式：\`{summary}成功, with table:\`
5. Then 失敗格式：\`操作失敗\`
6. Entity 驗證格式：\`存在一個{entity}, with table:\`

## 重要約束
修復格式時，必須嚴格遵守用戶在釐清階段做出的所有決策。不要擅自添加或修改用戶已明確拒絕的功能。

## 輸出格式
請以 JSON 格式輸出修正後的內容：
\`\`\`json
{
  "features": [
    { "name": "Feature名稱", "content": "修正後的完整內容" }
  ]
}
\`\`\``

  // 構建用戶消息，包含所有需要修復的 Features 和釐清決策
  const featuresContent = features.map(f =>
    `### Feature: ${f.name}\n\n**錯誤**:\n${f.errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}\n\n**內容**:\n\`\`\`gherkin\n${f.content}\n\`\`\``
  ).join('\n\n---\n\n')

  const userMessage = decisions
    ? `${featuresContent}\n\n---\n\n## 重要：用戶釐清決策（修復時必須遵守）\n\n${decisions}`
    : featuresContent

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

// ============================================================
// UIUX Skill - 程式碼生成
// ============================================================

export interface UiuxDesignBrief {
  scope: 'component' | 'page' | 'full'
  productType: string
  style: {
    direction: string
    references: string[]
    adjectives: string[]
  }
  color: {
    preference: string
    brandColor?: string
    darkMode: boolean
  }
  persona: {
    primary: string
    context: string
  }
}

export interface GeneratedComponent {
  path: string
  content: string
  description: string
}

const UIUX_SYSTEM_PROMPT = `你是一個專業的前端開發者，專精於 Next.js 14+ App Router 和 Tailwind CSS。

## 技術棧
- Next.js 14+ App Router（優先使用 Server Components）
- Tailwind CSS（使用預設值，不自訂）
- TypeScript
- motion/react（JavaScript 動畫）
- tw-animate-css（入場動畫）
- cn utility（clsx + tailwind-merge）

## UI 規則（必須遵守）

### Components
- 有鍵盤/focus 行為的組件使用 Base UI、Radix 或 React Aria
- icon-only buttons 必須有 aria-label
- 不手寫鍵盤/focus 行為

### Interaction
- 破壞性操作用 AlertDialog 確認
- loading state 用 skeleton
- 使用 h-dvh 而非 h-screen
- 固定元素尊重 safe-area-inset
- 錯誤顯示在操作發生處

### Animation
- 只動畫 transform 和 opacity
- 不動畫 width/height/top/left/margin/padding
- 入場用 ease-out
- 互動反饋不超過 200ms
- 尊重 prefers-reduced-motion

### Typography
- 標題用 text-balance
- 內文用 text-pretty
- 數據用 tabular-nums
- 密集 UI 用 truncate 或 line-clamp

### Layout
- 使用固定 z-index scale（dropdown:10, sticky:20, fixed:30, modal-backdrop:40, modal:50, popover:60, tooltip:70）
- 方形元素用 size-* 取代 w-* h-*

### Design
- 不使用漸層（除非明確要求）
- 不使用紫色漸層
- 不使用 glow 效果作為主要 affordance
- empty state 有明確的下一步 action
- 每個視圖限制一個 accent color

### 禁止（AI Slop 特徵）
- Inter, Roboto, Arial 作為唯一字體
- 紫色漸層 on 白色背景
- Glow effects 作為主要視覺元素
- 過度使用 emoji 作為 icon
- 無目的的動畫
- 千篇一律的 card grid 佈局

## 輸出格式
使用以下格式輸出每個檔案：

\`\`\`tsx:path/to/file.tsx
// 檔案內容
\`\`\`

確保每個檔案都是完整可用的，包含所有必要的 imports。`

/**
 * 生成頁面元件
 */
export async function generatePageComponent(
  pageName: string,
  brief: UiuxDesignBrief,
  bddSpec?: string,
  trackingContext?: LlmTrackingContext
): Promise<{ success: boolean; component?: GeneratedComponent; error?: string }> {
  const prompt = `根據以下設計簡報生成 ${pageName} 頁面：

## 設計簡報
- 產品類型：${brief.productType}
- 風格方向：${brief.style.direction}
- 參考：${brief.style.references.join(', ') || '無'}
- 配色偏好：${brief.color.preference}
- Dark Mode：${brief.color.darkMode ? '需要支援' : '不需要'}
- 目標用戶：${brief.persona.primary}

${bddSpec ? `## BDD 規格\n${bddSpec}` : ''}

請生成 \`app/${pageName.toLowerCase()}/page.tsx\` 檔案。

要求：
1. 使用 Server Component（除非需要互動）
2. 包含必要的 metadata export
3. RWD 支援（mobile-first）
4. 符合上述所有 UI 規則`

  const response = await callClaude(
    UIUX_SYSTEM_PROMPT,
    [{ role: 'user', content: prompt }],
    { maxTokens: 4096, temperature: 0.2 }, // 降低 temperature 確保風格一致性
    trackingContext
  )

  if (!response.success || !response.content) {
    return { success: false, error: response.error }
  }

  // 解析生成的程式碼
  const codeMatch = response.content.match(/```tsx:([^\n]+)\n([\s\S]*?)```/)
  if (!codeMatch) {
    return { success: false, error: '無法解析生成的程式碼' }
  }

  return {
    success: true,
    component: {
      path: codeMatch[1].trim(),
      content: codeMatch[2].trim(),
      description: `${pageName} 頁面`,
    },
  }
}

/**
 * 生成 UI 元件
 */
export async function generateUiComponent(
  componentName: string,
  componentType: 'button' | 'card' | 'input' | 'modal' | 'header' | 'footer' | 'sidebar' | 'nav' | 'other',
  brief: UiuxDesignBrief,
  trackingContext?: LlmTrackingContext
): Promise<{ success: boolean; component?: GeneratedComponent; error?: string }> {
  const prompt = `根據以下設計簡報生成 ${componentName} 元件：

## 設計簡報
- 產品類型：${brief.productType}
- 風格方向：${brief.style.direction}
- 配色偏好：${brief.color.preference}
- Dark Mode：${brief.color.darkMode ? '需要支援' : '不需要'}

## 元件類型
${componentType}

請生成 \`components/ui/${componentName}.tsx\` 檔案。

要求：
1. 使用 forwardRef 模式
2. 包含完整的 TypeScript 類型
3. 使用 cn utility 處理 className
4. 支援 variant 和 size props（如適用）
5. 符合無障礙標準`

  const response = await callClaude(
    UIUX_SYSTEM_PROMPT,
    [{ role: 'user', content: prompt }],
    { maxTokens: 2048, temperature: 0.2 }, // 降低 temperature 確保風格一致性
    trackingContext
  )

  if (!response.success || !response.content) {
    return { success: false, error: response.error }
  }

  const codeMatch = response.content.match(/```tsx:([^\n]+)\n([\s\S]*?)```/)
  if (!codeMatch) {
    return { success: false, error: '無法解析生成的程式碼' }
  }

  return {
    success: true,
    component: {
      path: codeMatch[1].trim(),
      content: codeMatch[2].trim(),
      description: `${componentName} 元件`,
    },
  }
}

/**
 * 生成 Layout 元件
 */
export async function generateLayoutComponent(
  layoutType: 'header' | 'footer' | 'sidebar' | 'nav',
  brief: UiuxDesignBrief,
  trackingContext?: LlmTrackingContext
): Promise<{ success: boolean; component?: GeneratedComponent; error?: string }> {
  const layoutNames: Record<string, string> = {
    header: 'Header',
    footer: 'Footer',
    sidebar: 'Sidebar',
    nav: 'Navigation',
  }

  const prompt = `根據以下設計簡報生成 ${layoutNames[layoutType]} 元件：

## 設計簡報
- 產品類型：${brief.productType}
- 風格方向：${brief.style.direction}
- 配色偏好：${brief.color.preference}
- Dark Mode：${brief.color.darkMode ? '需要支援' : '不需要'}

請生成 \`components/layout/${layoutNames[layoutType]}.tsx\` 檔案。

要求：
1. ${layoutType === 'header' ? 'sticky top-0，支援 backdrop-blur' : ''}
2. ${layoutType === 'sidebar' ? '支援 collapsed 狀態' : ''}
3. ${layoutType === 'nav' ? '支援 mobile menu（hamburger）' : ''}
4. ${layoutType === 'footer' ? '包含版權和常用連結' : ''}
5. RWD 支援
6. 使用 safe-area-inset（如適用）`

  const response = await callClaude(
    UIUX_SYSTEM_PROMPT,
    [{ role: 'user', content: prompt }],
    { maxTokens: 2048, temperature: 0.2 }, // 降低 temperature 確保風格一致性
    trackingContext
  )

  if (!response.success || !response.content) {
    return { success: false, error: response.error }
  }

  const codeMatch = response.content.match(/```tsx:([^\n]+)\n([\s\S]*?)```/)
  if (!codeMatch) {
    return { success: false, error: '無法解析生成的程式碼' }
  }

  return {
    success: true,
    component: {
      path: codeMatch[1].trim(),
      content: codeMatch[2].trim(),
      description: `${layoutNames[layoutType]} 元件`,
    },
  }
}

/**
 * 生成全域樣式
 */
export async function generateGlobalStyles(
  brief: UiuxDesignBrief,
  trackingContext?: LlmTrackingContext
): Promise<{ success: boolean; content?: string; error?: string }> {
  const prompt = `根據以下設計簡報生成 globals.css：

## 設計簡報
- 風格方向：${brief.style.direction}
- 配色偏好：${brief.color.preference}
- 品牌色：${brief.color.brandColor || '使用預設藍色'}
- Dark Mode：${brief.color.darkMode ? '需要支援' : '不需要'}

請生成 \`styles/globals.css\` 檔案。

要求：
1. 使用 CSS 變數定義顏色
2. 包含 :root 和 .dark 兩組配色
3. 定義 z-index scale
4. 使用 Tailwind @layer 結構
5. 不要加入不必要的裝飾`

  const response = await callClaude(
    UIUX_SYSTEM_PROMPT,
    [{ role: 'user', content: prompt }],
    { maxTokens: 2048, temperature: 0.2 }, // 降低 temperature 確保風格一致性
    trackingContext
  )

  if (!response.success || !response.content) {
    return { success: false, error: response.error }
  }

  const codeMatch = response.content.match(/```css:([^\n]+)\n([\s\S]*?)```/)
  if (!codeMatch) {
    // 嘗試不帶路徑的格式
    const altMatch = response.content.match(/```css\n([\s\S]*?)```/)
    if (altMatch) {
      return { success: true, content: altMatch[1].trim() }
    }
    return { success: false, error: '無法解析生成的樣式' }
  }

  return { success: true, content: codeMatch[2].trim() }
}

/**
 * 批量生成完整前端
 */
export async function generateFullFrontend(
  brief: UiuxDesignBrief,
  pages: string[],
  bddSpec?: string,
  trackingContext?: LlmTrackingContext
): Promise<{
  success: boolean
  pages?: GeneratedComponent[]
  components?: GeneratedComponent[]
  styles?: string
  error?: string
}> {
  const generatedPages: GeneratedComponent[] = []
  const generatedComponents: GeneratedComponent[] = []

  // 1. 生成頁面
  for (const pageName of pages) {
    const result = await generatePageComponent(pageName, brief, bddSpec, trackingContext)
    if (result.success && result.component) {
      generatedPages.push(result.component)
    }
  }

  // 2. 生成基礎 UI 元件
  const uiComponents: Array<{ name: string; type: 'button' | 'card' | 'input' }> = [
    { name: 'Button', type: 'button' },
    { name: 'Card', type: 'card' },
    { name: 'Input', type: 'input' },
  ]

  for (const comp of uiComponents) {
    const result = await generateUiComponent(comp.name, comp.type, brief, trackingContext)
    if (result.success && result.component) {
      generatedComponents.push(result.component)
    }
  }

  // 3. 生成 Layout 元件
  const layoutResult = await generateLayoutComponent('header', brief, trackingContext)
  if (layoutResult.success && layoutResult.component) {
    generatedComponents.push(layoutResult.component)
  }

  // 4. 生成全域樣式
  const stylesResult = await generateGlobalStyles(brief, trackingContext)

  return {
    success: true,
    pages: generatedPages,
    components: generatedComponents,
    styles: stylesResult.content,
  }
}
