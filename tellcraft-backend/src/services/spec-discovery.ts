import { recordLlmUsage } from '../db/client'
import { safeParseJson } from '../utils/safe-parse-json'
import { getAnthropicHeaders, MODEL } from '../lib/anthropic'
import { ClarifyItem } from './bdd-session'
import { LlmTrackingContext } from './classifier'
import { GeneratedFeature } from './formulation'
import { createLogger } from '../lib/logger'

const logger = createLogger('spec-discovery')

// Sonnet 定價 (每百萬 tokens)
const SONNET_PRICING = { input: 3, output: 15 }

// ============================================================
// 類型定義
// ============================================================

export interface SpecIssue {
  id: string
  featureName: string
  actionName: string
  category: 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'S7'
  severity: 'high' | 'medium' | 'low'
  description: string
  question: string
  whiteTextQuestion: string
  suggestedFix?: string
  options?: Array<string | { label: string; description?: string }>
}

export interface SpecDiscoveryResult {
  success: boolean
  issues?: SpecIssue[]
  error?: string
}

// 檢查項目類別說明（四類規則版）
const SPEC_CHECK_CATEGORIES: Record<string, string> = {
  S1: '四類規則完整性（前置（狀態）/前置（參數）/後置（回應）/後置（狀態））',
  S2: 'Example 覆蓋度',
  S3: '邊界條件覆蓋',
  S4: '格式正確性（sdd.os ISA + 四類前綴命名）',
  S5: '跨 Feature 一致性',
  S6: 'Schema 對應',
  S7: 'Rule 原子化',
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
  truncated?: boolean
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
          logger.warn({ status: response.status, attempt, maxRetries: RETRY_MAX, delayMs: delay }, 'callClaude HTTP 錯誤，重試中')
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        lastError = `API error: ${response.status} - ${errorText}`
        break
      }

      const data = await response.json() as {
        usage?: { input_tokens: number; output_tokens: number }
        content?: Array<{ text: string }>
        stop_reason?: string
      }

      const truncated = data.stop_reason === 'max_tokens'
      if (truncated) {
        logger.warn({ outputTokens: data.usage?.output_tokens }, 'callClaude 回應被截斷 (stop_reason=max_tokens)')
      }

      return {
        success: true,
        content: data.content?.[0]?.text || '',
        inputTokens: data.usage?.input_tokens || 0,
        outputTokens: data.usage?.output_tokens || 0,
        truncated,
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error'
      if (attempt < RETRY_MAX && isRetryableFetchError(error)) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1)
        logger.warn({ attempt, maxRetries: RETRY_MAX, delayMs: delay, error: lastError.slice(0, 100) }, 'callClaude 網路錯誤，重試中')
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      break
    }
  }

  return { success: false, error: lastError }
}

// ============================================================
// Spec Discovery - 檢查 Feature Files 品質
// ============================================================

export async function runSpecDiscovery(
  features: GeneratedFeature[],
  schemaSql: string,
  entityMapping: string,
  existingItems?: ClarifyItem[],
  trackingContext?: LlmTrackingContext
): Promise<SpecDiscoveryResult> {
  // 將 features 格式化為易讀的內容
  const featuresContent = features.map(f =>
    `### ${f.name} (${f.actionName})\n\`\`\`gherkin\n${f.content}\n\`\`\``
  ).join('\n\n')

  // 已有的問題（避免重複）
  const existingQuestions = (existingItems || [])
    .map(item => item.question)
    .join('\n- ')

  const systemPrompt = `你是一位資深的 BDD 規格審查專家。請審查以下 Feature Files 的品質，找出需要與用戶確認的問題。

## 審查項目

| 代碼 | 檢查項目 | 說明 |
|------|----------|------|
| S1 | 四類規則完整性 | 每個 Feature 是否有完整的四類規則？（前置（狀態）、前置（參數）、後置（回應）、後置（狀態）） |
| S2 | Example 覆蓋度 | 每條 Rule 是否有足夠的 Example 覆蓋正常和異常情況 |
| S3 | 邊界條件覆蓋 | 是否有處理邊界值、空值、最大最小值等情況 |
| S4 | 格式正確性 | 是否符合 sdd.os ISA 格式規範（四類前綴、命名句型） |
| S5 | 跨 Feature 一致性 | 不同 Feature 之間的實體命名、狀態流轉是否一致 |
| S6 | Schema 對應 | Feature 中使用的欄位是否與 Schema 定義一致 |
| S7 | Rule 原子化 | 每條 Rule 是否只驗證一件事？包含「且/和/並且」的 Rule 必須拆分。混合前後置條件的 Rule 也必須拆分。 |

### S1 四類規則完整性檢查細則
- 每個 Feature 至少需要 1 條「前置（參數）」Rule（必要參數檢查）
- 命令類功能至少需要 1 條「後置（狀態）」Rule
- 查詢類功能至少需要 1 條「後置（回應）」Rule
- **檢查是否有使用舊的 @Pre/@Post 而非四類前綴**

### S4 格式正確性檢查細則
- 檔案開頭是否使用 \`# Action: actionName\` 格式（而非舊的 \`@Action()\`）
- Rule 命名是否遵循句型：\`<四類前綴> - <主詞> 必須/應 <單一條件>\`
- 是否有 Rule 使用了舊的 @Pre/@Post 標註
- 是否有 Rule 缺少四類前綴

## sdd.os ISA 格式規範

### Given 步驟格式
- 資料準備：\`準備一個{entity}, with table:\`

### When 步驟格式
- Action 呼叫：\`{summary}, call table:\`

### Then 步驟格式
- 成功回應：\`{summary}成功, with table:\`
- 操作失敗：\`操作失敗\`
- Entity 驗證：\`存在一個{entity}, with table:\`

### 必要元素
- \`# Action: actionName\` 標頭（不是舊的 \`@Action()\`）
- \`# Summary: xxx\` 註解
- 每條 Rule 標註四類之一（前置（狀態）/前置（參數）/後置（回應）/後置（狀態））

## 輸出規則

1. **只回報真正需要確認的問題**：不要回報瑣碎或可以自行推斷的問題
2. **問題要具體**：指出是哪個 Feature、哪條 Rule、什麼問題
3. **提供選項**：如果是選擇題，提供 2-4 個選項，對有信心的選項加「（建議）」
4. **建議修復**：如果可以，提供建議的修復方式
5. **避免重複**：不要重複已經問過的問題
6. **格式問題可自動修復**：如果只是 @Pre/@Post → 四類前綴 的轉換，直接在 suggestedFix 中說明，不必問用戶

## 白話翻譯強制規則（whiteTextQuestion + options）

### 禁止出現的技術用語
- 程式符號：>=, <=, !=, ==, &&, ||
- 型別名稱：INT, VARCHAR, DECIMAL, BOOLEAN, ENUM, JSONB, UUID
- SQL 語法：NULL, NOT NULL, CHECK, CONSTRAINT, FOREIGN KEY, JOIN
- 變數名稱：不得出現 snake_case 或 camelCase 的變數名（如 cover_image、coverImage、is_featured）
- 表名引用：不得出現 table.column 格式（如 works.is_featured）

### 替換範例
| 技術寫法 | 白話寫法 |
|----------|----------|
| works.is_featured 設為 TRUE | 把作品標記為精選 |
| cover_image 設為 NULL | 把封面圖清掉 |
| featured_works 表新增一筆 | 把作品加到精選清單 |
| snake_case / camelCase | 底線式寫法 / 駝峰式寫法 |
| JOIN featured_works | 從精選清單中查詢 |

### 品質自檢
生成 whiteTextQuestion 後，想像你在跟策展團隊的美術設計師對話。她會疑惑就需要重寫。

## 輸出格式

\`\`\`json
{
  "issues": [
    {
      "featureName": "Feature 名稱",
      "actionName": "action_name",
      "category": "S1",
      "severity": "high",
      "description": "問題的詳細描述",
      "question": "需要詢問用戶的問題（技術用語）",
      "whiteTextQuestion": "用白話文詢問用戶的問題",
      "suggestedFix": "建議的修復方式（可選）",
      "options": [
        "A. 選項一",
        "B. 選項二"
      ]
    }
  ]
}
\`\`\`

如果沒有發現問題，返回空陣列：
\`\`\`json
{
  "issues": []
}
\`\`\``

  const userMessage = `## Feature Files

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

${existingQuestions ? `---

## 已問過的問題（請勿重複）

- ${existingQuestions}` : ''}

請審查以上 Feature Files，找出需要與用戶確認的品質問題。`

  logger.info('開始審查 Feature Files...')
  let response = await callClaude(systemPrompt, userMessage, { maxTokens: 12288 })

  if (!response.success) {
    return { success: false, error: response.error }
  }

  // 截斷時用更大的 maxTokens 重試一次
  if (response.truncated) {
    logger.warn('回應被截斷，以 16384 tokens 重試')
    response = await callClaude(systemPrompt, userMessage, { maxTokens: 16384 })
    if (!response.success) {
      return { success: false, error: response.error }
    }
  }

  // 記錄使用量
  if (response.inputTokens && response.outputTokens) {
    const costUsd = (response.inputTokens * SONNET_PRICING.input + response.outputTokens * SONNET_PRICING.output) / 1000000
    await recordLlmUsage({
      model: MODEL.SONNET,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      costUsd,
      purpose: 'spec_discovery',
      userId: trackingContext?.userId,
      conversationId: trackingContext?.conversationId,
    }).catch(err => logger.error({ err }, '記錄使用量失敗'))
  }

  try {
    // 先用 safeParseJson 嘗試解析
    let parsed = safeParseJson<{ issues?: unknown[] }>(response.content || '')

    if (!parsed) {
      // safeParseJson 失敗：可能是截斷的 JSON，嘗試修復
      const jsonMatch = response.content?.match(/`{3,}(?:json)?\s*\n?([\s\S]*?)\n?`{3,}/) ||
                        response.content?.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        if (response.truncated) {
          logger.warn('截斷且無法提取 JSON，視為無問題繼續')
          return { success: true, issues: [] }
        }
        return { success: false, error: '無法解析 LLM 回應' }
      }

      const jsonStr = jsonMatch[1] || jsonMatch[0]
      logger.warn('safeParseJson 失敗，嘗試修復截斷的 JSON')
      const lastCompleteObj = jsonStr.lastIndexOf('},')
      if (lastCompleteObj > 0) {
        const fixedStr = jsonStr.substring(0, lastCompleteObj + 1) + ']}'
        parsed = safeParseJson<{ issues?: unknown[] }>(fixedStr)
        if (parsed) {
          logger.info('JSON 修復成功')
        }
      }

      if (!parsed) {
        logger.warn('JSON 無法修復，視為無問題繼續')
        return { success: true, issues: [] }
      }
    }

    // 為每個 issue 加上 id
    const issues: SpecIssue[] = ((parsed.issues || []) as Array<Omit<SpecIssue, 'id'>>).map((issue, index) => ({
      ...issue,
      id: `spec_${Date.now()}_${index}`,
    }))

    logger.info({ issueCount: issues.length }, '審查完成')
    return { success: true, issues }
  } catch (err) {
    return { success: false, error: `解析回應時發生錯誤: ${err}` }
  }
}

// ============================================================
// 將 SpecIssue 轉換為 ClarifyItem
// ============================================================

export function specIssuesToClarifyItems(issues: SpecIssue[]): ClarifyItem[] {
  return issues.map(issue => ({
    id: issue.id,
    question: issue.question,
    whiteTextQuestion: issue.whiteTextQuestion,
    checklistItem: `${issue.category}: ${SPEC_CHECK_CATEGORIES[issue.category]}`,
    priority: issue.severity,
    status: 'pending' as const,
    options: issue.options,
  }))
}
