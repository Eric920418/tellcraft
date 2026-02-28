import { recordLlmUsage } from '../db/client'
import { safeParseJson } from '../utils/safe-parse-json'
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
  decisionSummary?: DecisionSummary | null,
  esDocumentContent?: string,
  partialSpecContext?: string
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

### B. 功能模型檢查（四類規則分類）
- **B1. 功能識別**：所有使用者與系統的交互點是否都已識別？
- **B2. 規則完整性**：每個功能的四類規則是否完整？
  - **前置（狀態）**：執行前系統必須滿足的狀態約束（如庫存>0、訂單狀態為待付款）
  - **前置（參數）**：輸入參數的約束（如數量>0、email格式正確、必要參數）
  - **後置（回應）**：API 回傳內容的預期（主要用於查詢類功能）
  - **後置（狀態）**：執行後資料庫狀態的變化（主要用於命令類功能）
- **B3. 例子覆蓋度**：每條規則是否有足夠的例子？
- **B4. 邊界條件覆蓋**：數值/組合/時間/狀態邊界是否涵蓋？
- **B5. 錯誤與異常處理**：異常情況是否都有對應規則？

### C. 術語與一致性檢查
- **C1. 詞彙表**：核心概念是否都有一致的命名？
- **C2. 術語衝突**：是否存在同義詞混用或同名異義？

### D. 其他品質檢查
- **D1. 待決事項**：是否存在 TODO 或未決議事項？
- **D2. 模糊描述**：是否存在未量化的形容詞？
${esDocumentContent ? `
### E. ES 一致性檢查（Event Storming 文檔存在時）
- **E1. ES ↔ Feature 對應**：每個 ES Command/ReadModel 是否有對應功能？名稱是否一致？
- **E2. ES ↔ Entity 對應**：每個 ES Aggregate 是否有對應實體？屬性是否一致？
- **E3. ES Rules ↔ Feature Rules**：ES 四類規則（Invariant/前置/後置/約束）是否都出現在對應功能中？

ES 文檔內容：
${esDocumentContent}` : ''}

## 四類規則分類說明

當你發現缺少的規則時，請標註屬於哪一類：
| 類型 | 說明 | 範例 |
|------|------|------|
| 前置（狀態） | 系統中既有資料的狀態約束 | 庫存必須大於0 |
| 前置（參數） | 用戶傳入的輸入參數約束 | 數量必須大於0、必要參數缺少 |
| 後置（回應） | API 回傳資料的預期 | 查詢結果應包含訂單明細 |
| 後置（狀態） | 資料庫中狀態的變化 | 庫存應減少對應數量 |

## 提案模式

對於你有高信心推薦答案的問題（例如：業界標準做法、唯一合理選擇），
設定該題的 mode 為 "propose"，在 proposedAnswer 填入建議答案，confidence 為 "high"。
用戶只需確認或否決，不需自己選擇。

對於有一定信心但非唯一選擇的問題，保持 mode 為 "ask"，
但在最可能的選項後加 「（建議）」讓用戶快速確認。

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
      "checklistItem": "A1" | "A2" | ... | "D2" | "E1" | "E2" | "E3",
      "ruleType": "前置（狀態）" | "前置（參數）" | "後置（回應）" | "後置（狀態）" | null,
      "location": "實體/功能名稱",
      "impact": "影響範圍說明",
      "options": ["A. 選項描述", "B. 選項描述（建議）", "C. 選項描述"],
      "mode": "ask" | "propose",
      "proposedAnswer": "建議的答案（propose 模式必填）",
      "confidence": "high" | "medium"
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
- **A4（跨屬性不變條件）** 的 Missing → **強制 High**${esDocumentContent ? `
- **E1/E2/E3（ES 一致性）** 的 Missing → **強制 High**` : ''}
- High：阻礙核心功能定義或資料建模
- Medium：影響邊界條件或測試完整性
- Low：優化或細節調整

## 規則
- 每個問題必須是具體的、可回答的
- 每個問題提供 2-4 個常見選項（格式：A. 描述, B. 描述），對有信心的選項加「（建議）」
- ruleType 欄位：若此問題與功能規則相關，標註四類之一；若與資料模型/術語相關，設為 null
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
4. **尊重用戶明確排除的功能**：如果用戶說「不需要 X」「不要 Y」，就不要問任何關於 X 或 Y 的問題
${partialSpecContext ? `
## 已產出的部分規格摘要
${partialSpecContext}
以上是根據已回答問題推導的部分規格，請據此避免重複問題，並深入未覆蓋的領域。` : ''}`

  const userMessage = `需求描述：\n${requirements}`

  try {
    console.log('[PRD Discovery] 調用 LLM 分析需求...')

    const RETRY_MAX = 3
    const RETRY_BASE_DELAY_MS = 2000
    let response: Response | null = null

    for (let attempt = 1; attempt <= RETRY_MAX; attempt++) {
      try {
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 8192,
            temperature: 0.2,
            system: systemPrompt,
            messages: [{ role: 'user', content: userMessage }],
          }),
        })

        if (response.ok) break

        const isRetryable = response.status === 429 || response.status === 529 || response.status === 503
        if (attempt < RETRY_MAX && isRetryable) {
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1)
          console.warn(`[PRD Discovery] HTTP ${response.status} (attempt ${attempt}/${RETRY_MAX})，${delay}ms 後重試`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        break
      } catch (fetchErr) {
        const errMsg = String(fetchErr)
        const isRetryable = errMsg.includes('ECONNRESET') || errMsg.includes('ETIMEDOUT') || errMsg.includes('fetch failed')
        if (attempt < RETRY_MAX && isRetryable) {
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1)
          console.warn(`[PRD Discovery] 網路錯誤 (attempt ${attempt}/${RETRY_MAX})，${delay}ms 後重試:`, errMsg.slice(0, 100))
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        throw fetchErr
      }
    }

    if (!response || !response.ok) {
      const errorText = response ? await response.text() : 'No response'
      const status = response?.status || 0
      console.error('[PRD Discovery] API 請求失敗:', status, errorText)
      if (status === 529 || status === 503) {
        return { success: false, error: 'AI 伺服器目前繁忙，已自動重試但仍無法處理。請稍等 1-2 分鐘後再試。' }
      }
      if (status === 429) {
        return { success: false, error: 'AI 請求過於頻繁，請稍等片刻再試。' }
      }
      return { success: false, error: `API error: ${status}` }
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

    // 安全解析回應
    const content = data.content?.[0]?.text || ''
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed = safeParseJson<any>(content)
    if (!parsed) {
      console.error('[PRD Discovery] 無法解析 LLM 回應，原始內容:', content.slice(0, 500))
      return { success: false, error: 'AI 回應格式異常，請重新描述您的需求。' }
    }

    // 轉換格式（符合 bdd-session.ts 的 ClarifyItem 類型）
    const items: ClarifyItem[] = (parsed.items || []).map((item: {
      id?: string
      question: string
      whiteTextQuestion?: string
      priority?: string
      checklistItem?: string
      options?: Array<string | { label: string; description: string }>
      mode?: 'ask' | 'propose'
      proposedAnswer?: string
      confidence?: 'high' | 'medium'
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
      // 提案模式欄位
      ...(item.mode === 'propose' ? {
        mode: 'propose' as const,
        proposedAnswer: item.proposedAnswer,
        confidence: item.confidence || 'high',
      } : {}),
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
