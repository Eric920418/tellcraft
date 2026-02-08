/**
 * BDD→UI 翻譯 Service
 * 將 ISA 格式的 BDD Feature Files 翻譯為前端可消費的 UI 需求規格
 */

import Anthropic from '@anthropic-ai/sdk'

// ============================================================
// 類型定義
// ============================================================

export interface UIAction {
  name: string
  type: 'create' | 'update' | 'delete' | 'view' | 'filter'
  confirmRequired: boolean
  fields?: Array<{
    name: string
    label: string
    type: string
    required: boolean
    validation?: string
  }>
}

export interface UIDataDisplay {
  name: string
  type: 'table' | 'list' | 'cards' | 'chart' | 'stat_card'
  columns?: string[]
}

export interface UIPage {
  name: string
  route: string
  purpose: string
  actions: UIAction[]
  dataDisplays: UIDataDisplay[]
}

export interface UIRequirementsSpec {
  productName: string
  productSummary: string
  pages: UIPage[]
  navigation: string[]
  entities: Array<{ name: string; fields: string[] }>
}

interface TranslateResult {
  success: boolean
  spec?: UIRequirementsSpec
  error?: string
}

// ============================================================
// Anthropic 單例
// ============================================================

let anthropicClient: Anthropic | null = null

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('缺少 CLAUDE_API_KEY 或 ANTHROPIC_API_KEY')
    }
    anthropicClient = new Anthropic({ apiKey })
  }
  return anthropicClient
}

// ============================================================
// 核心函數
// ============================================================

/**
 * 將 BDD Feature Files 翻譯為前端 UI 需求規格
 * 使用 Haiku 快速翻譯，失敗時 orchestrator 降級用原始 bddSpec
 */
export async function translateBddToUISpec(
  bddSpec: string,
  originalRequirements: string,
  trackingContext?: { userId?: string; conversationId?: string }
): Promise<TranslateResult> {
  if (!bddSpec || bddSpec.trim().length === 0) {
    return { success: false, error: 'BDD spec 為空' }
  }

  try {
    const anthropic = getAnthropicClient()

    const systemPrompt = `你是一位前端架構師。你的任務是將 BDD Feature Files（ISA 格式）翻譯成前端 UI 需求規格。

## 翻譯規則
1. 每個 Feature 對應一個或多個 UI 頁面
2. @Action 步驟（When "..., call table:"）→ 前端操作（按鈕、表單、對話框）
3. table 中的欄位 → 表單 input 或資料展示列
4. Then 步驟中的驗證 → 成功後的 UI 回饋（toast、列表更新）
5. "操作失敗" → 錯誤狀態 UI
6. "存在一個{entity}" → 資料展示元件（表格/卡片/列表）
7. Rule 的前置/後置標註 → 頁面歸屬和上下文
8. 多個相關 Feature 可以合併到同一頁面

## Action Type 映射
- "新增/建立/記錄/添加" → create
- "修改/更新/編輯" → update
- "刪除/移除" → delete（confirmRequired: true）
- "查詢/搜尋/篩選" → filter
- "查看/瀏覽" → view

## 輸出格式
嚴格輸出 JSON，不要有其他文字：
{
  "productName": "產品名稱",
  "productSummary": "一句話描述",
  "pages": [
    {
      "name": "頁面名稱",
      "route": "/suggested-route",
      "purpose": "一句話描述用途",
      "actions": [
        {
          "name": "操作名稱",
          "type": "create",
          "confirmRequired": false,
          "fields": [
            { "name": "fieldName", "label": "顯示名", "type": "text|number|date|select|textarea", "required": true, "validation": "optional rule" }
          ]
        }
      ],
      "dataDisplays": [
        {
          "name": "展示名稱",
          "type": "table|list|cards|chart|stat_card",
          "columns": ["col1", "col2"]
        }
      ]
    }
  ],
  "navigation": ["頁面1", "頁面2"],
  "entities": [
    { "name": "EntityName", "fields": ["field1", "field2"] }
  ]
}`

    const userMessage = `## 產品需求
${originalRequirements}

## BDD Feature Files
${bddSpec}

請翻譯為前端 UI 需求規格 JSON。`

    const stream = anthropic.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      temperature: 0.1,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const finalMessage = await stream.finalMessage()
    const content = finalMessage.content[0]

    if (content.type !== 'text') {
      return { success: false, error: 'LLM 回應格式錯誤' }
    }

    // 解析 JSON（可能包在 code block 裡）
    let jsonStr = content.text.trim()
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)```/)
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim()
    }

    const spec = JSON.parse(jsonStr) as UIRequirementsSpec

    // 基本驗證
    if (!spec.pages || !Array.isArray(spec.pages) || spec.pages.length === 0) {
      return { success: false, error: '翻譯結果缺少頁面定義' }
    }

    console.log(`[BDD→UI] 翻譯完成: ${spec.pages.length} 頁面, ${spec.entities?.length || 0} 實體`,
      trackingContext?.conversationId ? `(conv: ${trackingContext.conversationId})` : '')

    return { success: true, spec }
  } catch (err) {
    console.error('[BDD→UI] 翻譯失敗:', err)
    return { success: false, error: `BDD→UI 翻譯失敗: ${err}` }
  }
}

/**
 * 將 UIRequirementsSpec 格式化為 prompt section
 */
export function formatUISpecForPrompt(spec: UIRequirementsSpec): string {
  const lines: string[] = [
    `## 前端需求規格（已從 BDD 翻譯）`,
    `產品：${spec.productName} — ${spec.productSummary}`,
    '',
    '### 頁面規劃',
  ]

  for (const page of spec.pages) {
    lines.push(`- **${page.name}** (${page.route}): ${page.purpose}`)

    if (page.actions.length > 0) {
      lines.push(`  操作：${page.actions.map(a => `${a.name}(${a.type}${a.confirmRequired ? ', 需確認' : ''})`).join('、')}`)
    }

    if (page.dataDisplays.length > 0) {
      lines.push(`  展示：${page.dataDisplays.map(d => `${d.name}(${d.type}${d.columns ? ': ' + d.columns.join('/') : ''})`).join('、')}`)
    }

    // 列出操作的欄位細節
    for (const action of page.actions) {
      if (action.fields && action.fields.length > 0) {
        lines.push(`  「${action.name}」欄位：${action.fields.map(f => `${f.label}(${f.type}${f.required ? ', 必填' : ''})`).join('、')}`)
      }
    }
  }

  if (spec.navigation.length > 0) {
    lines.push('', '### 導航結構', spec.navigation.join(' → '))
  }

  if (spec.entities.length > 0) {
    lines.push('', '### 實體與欄位')
    for (const entity of spec.entities) {
      lines.push(`- **${entity.name}**：${entity.fields.join('、')}`)
    }
  }

  return lines.join('\n')
}
