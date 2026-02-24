import { recordLlmUsage } from '../db/client'
import { ClarifyItem } from './bdd-session'
import { LlmTrackingContext } from './classifier'
import { GeneratedFeature } from './formulation'

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
        model: 'claude-sonnet-4-6',
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
| S7 | Rule 原子化 | 每條 Rule 是否只驗證一件事？是否有需要拆分的 Rule？ |

### S1 四類規則完整性檢查細則
- 每個 Feature 至少需要 1 條「前置（參數）」Rule（必要參數檢查）
- 命令類功能至少需要 1 條「後置（狀態）」Rule
- 查詢類功能至少需要 1 條「後置（回應）」Rule
- **檢查是否有使用舊的 @Pre/@Post 而非四類前綴**

### S4 格式正確性檢查細則
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
- \`@Action(ActionName)\` 註解
- \`# Summary: xxx\` 註解
- 每條 Rule 標註四類之一（前置（狀態）/前置（參數）/後置（回應）/後置（狀態））

## 輸出規則

1. **只回報真正需要確認的問題**：不要回報瑣碎或可以自行推斷的問題
2. **問題要具體**：指出是哪個 Feature、哪條 Rule、什麼問題
3. **提供選項**：如果是選擇題，提供 2-4 個選項，對有信心的選項加「（建議）」
4. **建議修復**：如果可以，提供建議的修復方式
5. **避免重複**：不要重複已經問過的問題
6. **格式問題可自動修復**：如果只是 @Pre/@Post → 四類前綴 的轉換，直接在 suggestedFix 中說明，不必問用戶

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

  console.log('[SpecDiscovery] 開始審查 Feature Files...')
  const response = await callClaude(systemPrompt, userMessage, { maxTokens: 4096 })

  if (!response.success) {
    return { success: false, error: response.error }
  }

  // 記錄使用量
  if (response.inputTokens && response.outputTokens) {
    const costUsd = (response.inputTokens * SONNET_PRICING.input + response.outputTokens * SONNET_PRICING.output) / 1000000
    await recordLlmUsage({
      model: 'claude-sonnet-4-6',
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      costUsd,
      purpose: 'spec_discovery',
      userId: trackingContext?.userId,
      conversationId: trackingContext?.conversationId,
    }).catch(err => console.error('[SpecDiscovery] 記錄使用量失敗:', err))
  }

  try {
    const jsonMatch = response.content?.match(/```json\s*([\s\S]*?)\s*```/) ||
                      response.content?.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { success: false, error: '無法解析 LLM 回應' }
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0]
    const parsed = JSON.parse(jsonStr)

    // 為每個 issue 加上 id
    const issues: SpecIssue[] = (parsed.issues || []).map((issue: Omit<SpecIssue, 'id'>, index: number) => ({
      ...issue,
      id: `spec_${Date.now()}_${index}`,
    }))

    console.log(`[SpecDiscovery] 發現 ${issues.length} 個問題`)
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
