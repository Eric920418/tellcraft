import { safeParseJson } from '../utils/safe-parse-json'
import { getAnthropicHeaders, MODEL, calculateLlmCost, trackLlmUsage } from '../lib/anthropic'
import { ClarifyItem } from './bdd-session'
import { LlmTrackingContext } from './classifier'
import { DecisionSummary } from './clarify-dedup'
import { createLogger } from '../lib/logger'

const logger = createLogger('prd-discovery')

// ============================================================
// PRD Discovery 類型
// ============================================================

interface PrdDiscoveryResult {
  success: boolean
  items?: ClarifyItem[]
  coverageSummary?: Record<string, 'clear' | 'partial' | 'missing'>
  error?: string
}

interface ParsedPrdPayload {
  items?: unknown[]
  coverageSummary?: Record<string, 'clear' | 'partial' | 'missing'>
}

interface ParsedPrdItem {
  id?: string
  question: string
  whiteTextQuestion?: string
  priority?: string
  checklistItem?: string
  options?: Array<string | { label: string; description: string }>
  mode?: 'ask' | 'propose'
  proposedAnswer?: string
  confidence?: 'high' | 'medium'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  technicalContext?: any
  whiteTextOptions?: string[]
}

function parsePrdPayload(content: string): ParsedPrdPayload | null {
  // 1) 直接安全解析
  let parsed = safeParseJson<unknown>(content)

  // 2) 失敗時，嘗試從 code fence 或大括號區段提取 JSON
  if (!parsed) {
    const jsonMatch = content.match(/`{3,}(?:json)?\s*\n?([\s\S]*?)\n?`{3,}/i) ||
                      content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0]
      parsed = safeParseJson<unknown>(jsonStr)
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null
  }

  return parsed as ParsedPrdPayload
}

function buildFallbackClarifyItem(content: string): ClarifyItem {
  const trimmed = content.trim()
  const fallbackQuestion = trimmed
    ? `AI 回應未符合 JSON 格式。請先補充需求核心：${trimmed.slice(0, 140)}${trimmed.length > 140 ? '...' : ''}`
    : '需求描述目前資訊不足，請先補充主要使用者、核心功能與使用情境。'

  return {
    id: crypto.randomUUID(),
    question: fallbackQuestion,
    whiteTextQuestion: fallbackQuestion,
    priority: 'high',
    checklistItem: 'B1',
    status: 'pending',
    options: [
      'A. 先列出主要使用者角色與目標（建議）',
      'B. 先列出 3-5 個核心功能',
      'C. 先說明是創作平台、閱讀平台，或兩者兼具',
    ],
  }
}

function isParsedPrdItem(value: unknown): value is ParsedPrdItem {
  if (!value || typeof value !== 'object') {
    return false
  }
  const item = value as Record<string, unknown>
  return typeof item.question === 'string'
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
- **A7. 計算公式**：衍生值（金額、百分比、排名）的計算公式是否明確？
- **A8. 級聯效應**：實體狀態改變時，關聯實體如何同步？
- **A9. 時間約束**：有效期、超時、保留期限？
- **A10. 並發衝突**：同一資源多人操作的處理？

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
- **B6. 狀態機完整性**：所有合法遷移路徑？不可回退的狀態？
- **B7. 批量操作邊界**：數量上限、部分失敗策略？

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

## 需求權重分析（每次生成問題前必須先做）

在生成問題之前，先掃描用戶需求描述，將提到的每個功能/模組分類：
- **DETAILED（詳述）**：用戶用多段落、多節描述的核心功能 → 已有清晰需求，只問「歧義」和「遺漏」，不要展開細節
- **MENTIONED（提及）**：用戶用 1-2 句話提到的功能 → 最多 2-3 個問題，聚焦範圍確認（「管理什麼？誰用？」）
- **IMPLIED（隱含）**：從上下文推斷的功能 → 最多 1 個問題，確認是否需要

### 問題分配規則
1. **正比於描述篇幅**：如果 80% 的描述在講前端體驗，最多 20% 的問題可以關於其他功能
2. **不要膨脹**：不要把用戶一句話的簡單需求（如「要後台管理」）展開成 10+ 個 CRUD 細節問題
3. **詳述功能只問歧義**：用戶花 3 段描述的 Landing Page 動畫已經很清楚了，不需要問「你要不要動畫」
4. **簡述功能只問範圍**：「要後台管理系統」→ 問「管理哪些內容？誰登入？」（2-3 題就夠）

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
      "confidence": "high" | "medium",
      "technicalContext": {
        "entities": [{ "name": "中文實體名", "tableName": "表名", "fields": [{ "name": "欄位名", "label": "中文名", "type": "型別", "constraints": ["約束"] }] }],
        "relationships": [{ "from": "實體A", "to": "實體B", "type": "1:N", "foreignKey": "外鍵", "description": "白話描述" }],
        "computations": [{ "target": "目標欄位", "formula": "計算公式", "description": "白話描述" }],
        "stateTransitions": [{ "entity": "實體", "field": "狀態欄位", "from": "來源狀態", "to": "目標狀態", "trigger": "觸發動作", "description": "白話描述" }],
        "constraints": [{ "expression": "技術表達式", "description": "白話描述", "scope": "single_field | cross_field | cross_entity" }],
        "impactedFeatures": ["受影響的功能名稱"]
      },
      "whiteTextOptions": ["A. 純白話描述", "B. 純白話描述"]
    }
  ],
  "coverageSummary": {
    "A1": "clear" | "partial" | "missing",
    "A2": "clear" | "partial" | "missing"
  }
}
\`\`\`

## 深度邏輯探測原則

### 必須探測的維度：
1. **計算公式**（A4/A7）— 金額/數量/百分比 → 怎麼算？哪些欄位參與？精度？
2. **狀態機**（A6/B6）— 有狀態概念 → 有哪些狀態？如何轉換？有無最終狀態？
3. **級聯效應**（A8）— 刪除/取消/退款 → 關聯資料怎麼處理？
4. **跨欄位約束**（A4）— 多個相關欄位 → 互相限制？
5. **邊界條件**（B4）— 數值 → 零、負數、極大值、小數怎麼處理？

### 禁止的淺層問題：
- ❌「這個欄位是否需要？」→ ✅「這個資訊是必填還是選填？沒填會怎樣？」
- ❌「用什麼型別？」→ ✅「這個資訊長什麼樣？數字、文字、日期、還是從選項中選？」

## 白話翻譯強制規則

### 禁止清單（whiteTextQuestion + whiteTextOptions 不可出現）
- 程式符號：>=, <=, !=, ==, &&, ||, null, undefined, true/false
- 型別名稱：INT, VARCHAR, DECIMAL, BOOLEAN, ENUM, JSONB, UUID
- SQL 語法：CHECK, NOT NULL, CONSTRAINT, FOREIGN KEY, PRIMARY KEY
- 程式概念：API, CRUD, middleware, callback, schema

### 替換規則
| 技術用語 | 白話替換 |
|----------|----------|
| null | 空白、未填寫 |
| >= 0 | 不可以是負數 |
| NOT NULL | 必填、不能空白 |
| DECIMAL(10,2) | 可以有小數的數字 |
| ENUM('A','B') | 只能從幾個選項中選 |
| 1:N 關係 | 一個 X 可以有多個 Y |
| BOOLEAN | 是或否 |

### 品質自檢
生成後想像你在跟一位沒有程式經驗的花店老闆對話。她會疑惑就需要重寫。

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
    logger.info('調用 LLM 分析需求...')

    const RETRY_MAX = 3
    const RETRY_BASE_DELAY_MS = 2000
    let response: Response | null = null

    for (let attempt = 1; attempt <= RETRY_MAX; attempt++) {
      try {
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: getAnthropicHeaders(),
          body: JSON.stringify({
            model: MODEL.SONNET,
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
          logger.warn({ status: response.status, attempt, maxRetries: RETRY_MAX, delayMs: delay }, 'HTTP 錯誤，重試中')
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        break
      } catch (fetchErr) {
        const errMsg = String(fetchErr)
        const isRetryable = errMsg.includes('ECONNRESET') || errMsg.includes('ETIMEDOUT') || errMsg.includes('fetch failed')
        if (attempt < RETRY_MAX && isRetryable) {
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1)
          logger.warn({ attempt, maxRetries: RETRY_MAX, delayMs: delay, error: errMsg.slice(0, 100) }, '網路錯誤，重試中')
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        throw fetchErr
      }
    }

    if (!response || !response.ok) {
      const errorText = response ? await response.text() : 'No response'
      const status = response?.status || 0
      logger.error({ status, errorText }, 'API 請求失敗')
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
    const costUsd = calculateLlmCost(MODEL.SONNET, inputTokens, outputTokens)

    trackLlmUsage({
      model: MODEL.SONNET,
      inputTokens,
      outputTokens,
      purpose: 'prd_discovery',
      userId: trackingContext?.userId,
      conversationId: trackingContext?.conversationId,
    })

    logger.info({ inputTokens, outputTokens, cost: costUsd.toFixed(4), conversationId: trackingContext?.conversationId }, 'LLM 回應完成')

    // 安全解析回應（含容錯提取）
    const content = data.content?.[0]?.text || ''
    const parsed = parsePrdPayload(content)
    if (!parsed) {
      logger.warn({ responsePreview: content.slice(0, 500) }, '無法解析 LLM JSON，使用降級釐清題')
      return {
        success: true,
        items: [buildFallbackClarifyItem(content)],
      }
    }

    // 轉換格式（符合 bdd-session.ts 的 ClarifyItem 類型）
     
    const parsedItems = (parsed.items || []).filter(isParsedPrdItem)
    const items: ClarifyItem[] = parsedItems.map((item: ParsedPrdItem) => ({
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
      // 深度邏輯探測欄位（寬容解析：格式錯則捨棄）
      ...(item.technicalContext && typeof item.technicalContext === 'object' && Array.isArray(item.technicalContext.entities) ? {
        technicalContext: item.technicalContext,
      } : {}),
      ...(Array.isArray(item.whiteTextOptions) && item.whiteTextOptions.length > 0 ? {
        whiteTextOptions: item.whiteTextOptions,
      } : {}),
    }))

    logger.info({ itemCount: items.length }, '生成釐清問題')

    return {
      success: true,
      items,
      coverageSummary: parsed.coverageSummary,
    }
  } catch (error) {
    logger.error({ err: error }, '執行失敗')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
