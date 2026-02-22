import { recordLlmUsage } from '../db/client'
import { ClarifyItem } from './bdd-session'
import { LlmTrackingContext } from './classifier'
import { DecisionSummary } from './clarify-dedup'

// Sonnet 定價 (每百萬 tokens)
const SONNET_PRICING = { input: 3, output: 15 }

// ============================================================
// PRD Discovery 類型
// ============================================================

interface PrdDiscoveryResult {
  success: boolean
  items?: ClarifyItem[]
  coverageSummary?: Record<string, 'clear' | 'partial' | 'missing'>
  error?: string
}

// ============================================================
// PRD Discovery 實現
// ============================================================

/**
 * Phase 1: PRD Discovery - 使用檢查清單掃描需求
 */
export async function runPrdDiscovery(
  requirements: string,
  trackingContext?: LlmTrackingContext,
  existingItems?: ClarifyItem[],
  decisionSummary?: DecisionSummary | null
): Promise<PrdDiscoveryResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    console.error('[PRD Discovery] ANTHROPIC_API_KEY 未設定')
    return { success: false, error: 'API key not configured' }
  }

  // 建立已釐清的 Q&A 列表（包含問題和答案）
  const existingQA = existingItems
    ?.filter(item => item.answer)
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
      "options": ["A. 選項描述", "B. 選項描述", "C. 選項描述"]
    }
  ],
  "coverageSummary": {
    "A1": "clear" | "partial" | "missing",
    "A2": "clear" | "partial" | "missing"
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
- 每個問題提供 2-4 個常見選項（格式：A. 描述, B. 描述）
- 白話翻譯：將英文欄位名替換為中文，移除程式語法符號
- 不要問太技術的問題，用領域語言
- **最多列出 5 個問題**（小批量，確保問題間有邏輯連貫性）
- **這 5 個問題之間也不能語意重複**（例如「資料存哪裡」和「如何儲存」是重複的）
- 按優先級排序：High → Medium → Low
${decisionSummary ? `

## ⛔ 已決策主題摘要（嚴禁再問相關問題）

${decisionSummary.coveredTopics.map(t => `- **${t.topic}** [${t.checklistAreas.join(',')}]: ${t.decision}`).join('\n')}
${decisionSummary.excludedFeatures.length > 0 ? `

**已排除功能**（禁止詢問）：
${decisionSummary.excludedFeatures.map(f => `- ${f}`).join('\n')}` : ''}` : ''}
${existingQA.length ? `

**已經釐清的問題**（這些主題已經確認，不要再問）：
${existingQA.join('\n\n')}` : ''}
${pendingQuestions.length ? `

**待處理的問題**（這些問題正在等待回答，不要重複）：
${pendingQuestions.join('\n')}` : ''}

**核心原則**：
1. **不重複**：不要問與已釐清問題語意相似的問題，也不要問這一批問題中互相重複的問題
2. **邏輯推論**：根據已有答案推論哪些功能/情況已被排除，不要問邏輯上不可能存在的問題
3. **理解隱含意義**：用戶的回答可能隱含排除了某些功能，仔細分析答案的完整含義
4. **尊重用戶明確排除的功能**：如果用戶說「不需要 X」「不要 Y」，就不要問任何關於 X 或 Y 的問題`

  const userMessage = `需求描述：\n${requirements}`

  try {
    console.log('[PRD Discovery] 調用 LLM 分析需求...')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8192,
        temperature: 0.2,  // 降低溫度，減少隨機性，避免重複問題
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[PRD Discovery] API 請求失敗:', response.status, errorText)
      return { success: false, error: `API error: ${response.status}` }
    }

    const data = await response.json() as {
      usage?: { input_tokens: number; output_tokens: number }
      content?: Array<{ text: string }>
    }

    // 記錄 LLM 使用量
    const inputTokens = data.usage?.input_tokens || 0
    const outputTokens = data.usage?.output_tokens || 0
    const costUsd = (inputTokens * SONNET_PRICING.input + outputTokens * SONNET_PRICING.output) / 1000000

    await recordLlmUsage({
      model: 'claude-sonnet-4-6',
      inputTokens,
      outputTokens,
      costUsd,
      purpose: 'prd_discovery',
      userId: trackingContext?.userId,
      conversationId: trackingContext?.conversationId,
    }).catch(err => console.error('[PRD Discovery] 記錄 LLM 使用量失敗:', err))

    console.log(`[PRD Discovery] LLM 回應完成 (tokens: ${inputTokens}/${outputTokens}, cost: $${costUsd.toFixed(4)}, conversation: ${trackingContext?.conversationId || 'none'})`)

    // 解析回應
    const content = data.content?.[0]?.text || ''
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      console.error('[PRD Discovery] 無法解析 LLM 回應')
      return { success: false, error: '無法解析 LLM 回應' }
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0]
    const parsed = JSON.parse(jsonStr)

    // 轉換格式（符合 bdd-session.ts 的 ClarifyItem 類型）
    const items: ClarifyItem[] = (parsed.items || []).map((item: {
      id?: string
      question: string
      whiteTextQuestion?: string
      priority?: string
      checklistItem?: string
      options?: Array<string | { label: string; description: string }>
    }) => ({
      id: item.id || crypto.randomUUID(),
      question: item.question,
      whiteTextQuestion: item.whiteTextQuestion || item.question,
      priority: (item.priority as 'high' | 'medium' | 'low') || 'medium',
      checklistItem: item.checklistItem || 'B1',
      status: 'pending' as const,
      options: (item.options || []).map((opt: string | { label: string; description: string }) =>
        typeof opt === 'string' ? opt : `${opt.label}. ${opt.description}`
      ),
    }))

    console.log(`[PRD Discovery] 生成 ${items.length} 個釐清問題`)

    return {
      success: true,
      items,
      coverageSummary: parsed.coverageSummary,
    }
  } catch (error) {
    console.error('[PRD Discovery] 執行失敗:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
