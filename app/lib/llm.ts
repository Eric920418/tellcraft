// ============================================================
// LLM 服務 - Anthropic Claude API
// 注意：這個模組直接在服務器端使用，不是 Server Actions
// ============================================================

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface LlmResponse {
  success: boolean
  content?: string
  error?: string
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
  }
): Promise<LlmResponse> {
  const apiKey = process.env.CLAUDE_API_KEY

  console.log('[LLM] CLAUDE_API_KEY exists:', !!apiKey)
  console.log('[LLM] API Key prefix:', apiKey?.substring(0, 15) || 'NONE')

  if (!apiKey) {
    console.error('[LLM] ERROR: 缺少 ANTHROPIC_API_KEY')
    return { success: false, error: '缺少 ANTHROPIC_API_KEY' }
  }

  try {
    const response = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: options?.model || 'claude-sonnet-4-20250514',
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

    return { success: true, content }
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
