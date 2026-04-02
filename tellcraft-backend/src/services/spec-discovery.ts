import { z } from 'zod'
import { MODEL } from '../lib/anthropic'
import { callStructured } from '../lib/structured-output'
import { ClarifyItem } from './bdd-session'
import { LlmTrackingContext } from './classifier'
import { GeneratedFeature } from './formulation'
import { createLogger } from '../lib/logger'

const logger = createLogger('spec-discovery')

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
// Structured Output Schema
// ============================================================

const SpecDiscoverySchema = z.object({
  issues: z.array(z.object({
    featureName: z.string(),
    actionName: z.string(),
    category: z.enum(['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7']),
    severity: z.enum(['high', 'medium', 'low']),
    description: z.string(),
    question: z.string(),
    whiteTextQuestion: z.string(),
    suggestedFix: z.string().nullable(),
    options: z.array(z.string()).nullable(),
  })),
})

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

### When 步驟格式（SpecFormula 標準）
- Action 呼叫：\`(No Actor|UID="$var") {summary}, call table:\`（必須有 Actor 前綴）

### Then 步驟格式
- 成功回應：\`{summary}(STATUS)回應, with table:\`（STATUS 為 HTTP 狀態碼）
- 操作失敗：\`操作失敗\`
- Entity 驗證：\`應該存在一個{entity}, with table:\`
- Entity 不存在：\`應該不存在一個{entity}, with table:\`

### VAR 系統
- \`>ContextName.field\`：宣告 Context Key
- \`<executionKey\`：捕獲執行時值
- \`$ContextName.field\`：引用先前宣告的值

### 必要元素
- \`# Action: actionName\` + \`# [METHOD] /path\` + \`# Summary: xxx\` 標頭
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

  // 第一次嘗試 12288 tokens
  let result = await callStructured({
    schema: SpecDiscoverySchema,
    model: MODEL.SONNET,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
    maxTokens: 12288,
    temperature: 0.2,
    purpose: 'spec_discovery',
    trackingContext,
  })

  // 截斷時用更大的 maxTokens 重試一次
  if (!result.success && result.stopReason === 'max_tokens') {
    logger.warn('回應被截斷，以 16384 tokens 重試')
    result = await callStructured({
      schema: SpecDiscoverySchema,
      model: MODEL.SONNET,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      maxTokens: 16384,
      temperature: 0.2,
      purpose: 'spec_discovery',
      trackingContext,
    })
  }

  if (!result.success) {
    logger.warn({ error: result.error }, '審查失敗，視為無問題繼續')
    return { success: true, issues: [] }
  }

  // 為每個 issue 加上 id
  const issues: SpecIssue[] = result.data.issues.map((issue, index) => ({
    ...issue,
    id: `spec_${Date.now()}_${index}`,
    suggestedFix: issue.suggestedFix || undefined,
    options: issue.options || undefined,
  }))

  logger.info({ issueCount: issues.length }, '審查完成')
  return { success: true, issues }
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
