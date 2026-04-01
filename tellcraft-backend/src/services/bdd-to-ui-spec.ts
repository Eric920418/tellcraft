/**
 * BDD→UI 翻譯 Service
 * 將 ISA 格式的 BDD Feature Files 翻譯為前端可消費的 UI 需求規格
 */

import yaml from 'js-yaml'
import { getAnthropicClient, MODEL, trackLlmUsage } from '../lib/anthropic'
import { safeParseJson } from '../utils/safe-parse-json'
import { createLogger } from '../lib/logger'

const logger = createLogger('bdd-to-ui-spec')

// ============================================================
// 類型定義
// ============================================================

export interface UIAction {
  name: string
  type: 'create' | 'update' | 'delete' | 'view' | 'filter' | 'toggle' | 'batch' | 'sort' | 'export' | 'navigate' | 'upload'
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
  type: 'table' | 'list' | 'cards' | 'chart' | 'stat_card' | 'carousel' | 'gallery' | 'paginated_list'
  columns?: string[]
}

export interface UIPage {
  name: string
  route: string
  purpose: string
  actions: UIAction[]
  dataDisplays: UIDataDisplay[]
}

export interface UIEntityField {
  name: string
  type?: string        // 'string' | 'number' | 'boolean' | 'string (ISO 8601)' 等
  required?: boolean
  validation?: string  // 來自 actionsYml rules[type='前置（參數）']
}

export interface UIRequirementsSpec {
  productName: string
  productSummary: string
  pages: UIPage[]
  navigation: string[]
  entities: Array<{ name: string; fields: UIEntityField[] }>
  userFlows?: Array<{
    name: string          // e.g. "訂單建立流程"
    steps: string[]       // e.g. ["選擇商品", "填寫地址", "確認付款", "完成"]
    triggerPage: string   // 起始頁面
  }>
  stateHints?: Array<{
    name: string          // e.g. "購物車"
    scope: 'page' | 'global'  // 頁面級 vs 全域
    description: string   // e.g. "多頁面共享的購物車項目列表"
  }>
}

interface TranslateResult {
  success: boolean
  spec?: UIRequirementsSpec
  error?: string
}


// ============================================================
// Actions YAML 摘要（零 LLM）
// ============================================================

interface ActionProperty {
  type?: string
  description?: string
}

interface ParsedAction {
  name?: string
  summary?: string
  input?: {
    properties?: Record<string, ActionProperty>
    required?: string[]
  }
  rules?: Array<{ rule?: string; type?: string }>
}

interface ParsedTypeDefinition {
  description?: string
  properties?: Record<string, { type?: string; description?: string }>
  required?: string[]
}

interface ParsedActionsYml {
  actions?: ParsedAction[]
  types?: Record<string, ParsedTypeDefinition>
}

/**
 * 將 actionsYml 解析為結構化摘要文本，供注入 BDD→UI 翻譯 prompt
 * 零 LLM，純規則式提取。解析失敗返回 null（降級到現有行為）
 */
export function summarizeActionsForUI(actionsYml: string): string | null {
  try {
    const parsed = yaml.load(actionsYml) as ParsedActionsYml | null
    if (!parsed || !Array.isArray(parsed.actions) || parsed.actions.length === 0) {
      return null
    }

    const MAX_ACTIONS = 12
    const actions = parsed.actions
    const truncated = actions.length > MAX_ACTIONS
    const toProcess = truncated ? actions.slice(0, MAX_ACTIONS) : actions

    const sections: string[] = []

    for (const action of toProcess) {
      if (!action.name) continue

      const lines: string[] = [`### ${action.name}${action.summary ? ` — ${action.summary}` : ''}`]

      // 提取輸入欄位
      if (action.input?.properties) {
        const props = action.input.properties
        const required = new Set(action.input.required || [])
        const fieldDescs = Object.entries(props).map(([fieldName, fieldDef]) => {
          const typePart = fieldDef?.type || 'unknown'
          const reqPart = required.has(fieldName) ? ', 必填' : ''
          return `${fieldName}(${typePart}${reqPart})`
        })
        if (fieldDescs.length > 0) {
          lines.push(`輸入欄位：${fieldDescs.join('、')}`)
        }
      }

      // 按 type 分類 rules
      if (Array.isArray(action.rules) && action.rules.length > 0) {
        const rulesByType: Record<string, string[]> = {}
        for (const r of action.rules) {
          if (!r.rule) continue
          const ruleType = r.type || '其他'
          if (!rulesByType[ruleType]) rulesByType[ruleType] = []
          rulesByType[ruleType].push(r.rule)
        }

        const TYPE_LABELS: Record<string, string> = {
          '前置（參數）': '驗證規則',
          '前置（狀態）': '前置條件',
          '後置（主要）': '操作效果',
          '後置（副作用）': '副作用',
        }

        for (const [ruleType, rules] of Object.entries(rulesByType)) {
          const label = TYPE_LABELS[ruleType] || ruleType
          lines.push(`${label}：${rules.join('；')}`)
        }
      }

      sections.push(lines.join('\n'))
    }

    if (sections.length === 0) return null

    let result = sections.join('\n\n')
    if (truncated) {
      result += `\n\n（另有 ${actions.length - MAX_ACTIONS} 個 Actions，結構類似）`
    }

    return result
  } catch (err) {
    logger.warn({ err }, 'actionsYml 解析失敗，降級跳過')
    return null
  }
}

/**
 * 將 Haiku 不精確的 entity fields 用 actionsYml 的 types + input.properties 覆寫
 * 零 LLM，純規則式。解析失敗返回原 spec（降級）
 */
export function enrichEntitiesFromActionsYml(
  spec: UIRequirementsSpec,
  actionsYml: string
): UIRequirementsSpec {
  try {
    const parsed = yaml.load(actionsYml) as ParsedActionsYml | null
    if (!parsed) return spec

    // ---- 1. 從 types 區塊建立 entity field 索引 ----
    const typeFieldMap = new Map<string, { fields: UIEntityField[]; raw: ParsedTypeDefinition }>()
    if (parsed.types) {
      for (const [typeName, typeDef] of Object.entries(parsed.types)) {
        if (!typeDef.properties) continue
        const requiredSet = new Set(typeDef.required || [])
        const fields: UIEntityField[] = Object.entries(typeDef.properties).map(([name, prop]) => ({
          name,
          type: prop.type,
          required: requiredSet.has(name) || undefined,
        }))
        // 存兩種 key：原始名 + 小寫去空格（模糊匹配）
        typeFieldMap.set(typeName, { fields, raw: typeDef })
        typeFieldMap.set(typeName.toLowerCase().replace(/\s+/g, ''), { fields, raw: typeDef })
      }
    }

    // ---- 2. 從 actions 建立 action 輸入索引（by name + summary） ----
    const actionInputMap = new Map<string, ParsedAction>()
    if (parsed.actions) {
      for (const action of parsed.actions) {
        if (action.name) actionInputMap.set(action.name.toLowerCase(), action)
        if (action.summary) actionInputMap.set(action.summary, action)
      }
    }

    // ---- 3. enrichment entity fields ----
    const enrichedEntities = spec.entities.map(entity => {
      // 正規化舊格式（string[] → UIEntityField[]）
      const normalizedFields: UIEntityField[] = entity.fields.map(f =>
        typeof f === 'string' ? { name: f } : f
      )

      // 嘗試從 types 匹配
      const fuzzyKey = entity.name.toLowerCase().replace(/\s+/g, '')
      const typeMatch = typeFieldMap.get(entity.name) || typeFieldMap.get(fuzzyKey)

      if (typeMatch) {
        // 用 types 定義覆寫：保留 Haiku 識別的欄位順序，補充 type/required
        const typeFieldIndex = new Map(typeMatch.fields.map(f => [f.name, f]))
        const enrichedFields = normalizedFields.map(f => {
          const match = typeFieldIndex.get(f.name)
          if (match) {
            return { ...f, type: match.type || f.type, required: match.required ?? f.required }
          }
          return f
        })
        // types 中有但 Haiku 遺漏的欄位 → 補充
        const existingNames = new Set(enrichedFields.map(f => f.name))
        for (const tf of typeMatch.fields) {
          if (!existingNames.has(tf.name)) {
            enrichedFields.push(tf)
          }
        }
        return { name: entity.name, fields: enrichedFields }
      }

      return { name: entity.name, fields: normalizedFields }
    })

    // ---- 4. types 中有但 spec.entities 沒有的 → 補充 ----
    const existingEntityNames = new Set(enrichedEntities.map(e => e.name.toLowerCase().replace(/\s+/g, '')))
    if (parsed.types) {
      for (const [typeName, typeDef] of Object.entries(parsed.types)) {
        const fuzzy = typeName.toLowerCase().replace(/\s+/g, '')
        if (existingEntityNames.has(fuzzy)) continue
        if (!typeDef.properties) continue
        const requiredSet = new Set(typeDef.required || [])
        enrichedEntities.push({
          name: typeName,
          fields: Object.entries(typeDef.properties).map(([name, prop]) => ({
            name,
            type: prop.type,
            required: requiredSet.has(name) || undefined,
          })),
        })
      }
    }

    // ---- 5. enrich action fields（pages 中的 action.fields） ----
    const enrichedPages = spec.pages.map(page => ({
      ...page,
      actions: page.actions.map(action => {
        if (!action.fields || action.fields.length === 0) return action

        // 找對應的 actionsYml action
        const matchKey = action.name.toLowerCase().replace(/\s+/g, '')
        const actionDef = actionInputMap.get(matchKey) || actionInputMap.get(action.name)

        if (!actionDef?.input?.properties) return action

        const inputProps = actionDef.input.properties
        const inputRequired = new Set(actionDef.input.required || [])
        // 提取前置（參數）rules 作為 validation
        const paramRules = (actionDef.rules || [])
          .filter(r => r.type === '前置（參數）' && r.rule)
          .map(r => r.rule!)

        const enrichedFields = action.fields.map(field => {
          const propMatch = inputProps[field.name]
          if (propMatch) {
            return {
              ...field,
              type: propMatch.type || field.type,
              required: inputRequired.has(field.name) || field.required,
            }
          }
          return field
        })

        // 如果有前置（參數）rules，附加到第一個 required field 的 validation
        if (paramRules.length > 0 && enrichedFields.length > 0) {
          const validationText = paramRules.join('；')
          const firstRequired = enrichedFields.find(f => f.required)
          if (firstRequired && !firstRequired.validation) {
            firstRequired.validation = validationText
          }
        }

        return { ...action, fields: enrichedFields }
      }),
    }))

    return { ...spec, entities: enrichedEntities, pages: enrichedPages }
  } catch (err) {
    logger.warn({ err }, 'enrichEntitiesFromActionsYml 失敗，降級跳過')
    return spec
  }
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
  trackingContext?: { userId?: string; conversationId?: string },
  actionsYml?: string
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
9. 多步驟流程（例如：建立→審核→執行）→ userFlows 陣列
10. 跨頁面共享的資料（例如：購物車在多頁面可見）→ stateHints with scope='global'
11. 具有「前置（狀態）」Rule 的 Feature → 表示有條件邏輯，需要在 UI 中反映（disabled button/warning）
12. 同一 entity 在多個 Feature 中出現 → 可能需要 dashboard 式的統一管理頁面
13. 如果提供了 Server Actions 定義，fields 的 name/type/required 必須以 Action 定義為準，validation 從前置（參數）rules 提取

## DataDisplay Type 映射
- Feature 中有多欄位 entity + 列表展示 → table
- 少量項目（<10）或視覺化展示 → cards
- 統計數字（總數/金額/百分比）→ stat_card
- 時間序列/趨勢數據 → chart
- 簡單清單（無多欄位）→ list
- 橫向滾動展示（活動/推薦/產品輪播）→ carousel
- 圖片密集展示（作品集/相簿/圖片集）→ gallery
- 大量條目列表（預期 >20 項，如會員/文章/訂單歷史）→ paginated_list

## Action Type 映射
- "新增/建立/記錄/添加" → create
- "修改/更新/編輯" → update
- "刪除/移除" → delete（confirmRequired: true）
- "查詢/搜尋/篩選" → filter
- "查看/瀏覽" → view
- "啟用/停用/開關/切換/上架/下架" → toggle
- "批量/全選/多選" → batch（confirmRequired: true）
- "排序/排列" → sort
- "匯出/下載/導出/列印" → export
- "下一步/上一步/流程/步驟" → navigate
- "上傳/匯入/拖放" → upload

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
          "type": "table|list|cards|chart|stat_card|carousel|gallery|paginated_list",
          "columns": ["col1", "col2"]
        }
      ]
    }
  ],
  "navigation": ["頁面1", "頁面2"],
  "entities": [
    { "name": "EntityName", "fields": [
      { "name": "field1", "type": "string", "required": true },
      { "name": "field2", "type": "number" }
    ]}
  ],
  "userFlows": [
    { "name": "流程名稱", "steps": ["步驟1", "步驟2"], "triggerPage": "起始頁面" }
  ],
  "stateHints": [
    { "name": "狀態名", "scope": "page|global", "description": "描述" }
  ]
}`

    // 生成 actions 摘要（零 LLM）
    const actionsSummary = actionsYml ? summarizeActionsForUI(actionsYml) : null

    let userMessage = `## 產品需求
${originalRequirements}

## BDD Feature Files
${bddSpec}`

    if (actionsSummary) {
      userMessage += `

## Server Actions 定義（欄位名/型別/驗證以此為準，優先於 Feature Files 推測）
${actionsSummary}`
    }

    userMessage += `

請翻譯為前端 UI 需求規格 JSON。`

    const RETRY_MAX = 4
    const RETRY_BASE_DELAY_MS = 5000
    let lastError: unknown = null

    for (let attempt = 1; attempt <= RETRY_MAX; attempt++) {
      try {
        const stream = anthropic.messages.stream({
          model: MODEL.HAIKU,
          max_tokens: 8192,
          temperature: 0.1,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        })

        const finalMessage = await stream.finalMessage()

        // 記錄 LLM 用量
        const usage = finalMessage.usage
        if (usage) {
          trackLlmUsage({
            model: MODEL.HAIKU,
            inputTokens: usage.input_tokens || 0,
            outputTokens: usage.output_tokens || 0,
            purpose: 'bdd_to_ui_translation',
            userId: trackingContext?.userId,
            conversationId: trackingContext?.conversationId,
          })
        }

        const content = finalMessage.content[0]

        if (content.type !== 'text') {
          return { success: false, error: 'LLM 回應格式錯誤' }
        }

        // 安全解析 JSON（支援 3+ 反引號 code fence、尾隨逗號等）
        const spec = safeParseJson<UIRequirementsSpec>(content.text)
        if (!spec) {
          // JSON 截斷/格式錯誤可重試（通常是 max_tokens 不足導致輸出截斷）
          lastError = new Error('LLM 回應無法解析為有效 JSON')
          if (attempt < RETRY_MAX) {
            logger.warn({ attempt, outputLength: content.text.length }, 'JSON 解析失敗，重試中')
            continue
          }
          return { success: false, error: 'LLM 回應無法解析為有效 JSON' }
        }

        // 基本驗證
        if (!spec.pages || !Array.isArray(spec.pages) || spec.pages.length === 0) {
          return { success: false, error: '翻譯結果缺少頁面定義' }
        }

        // 正規化 entities（Haiku 可能輸出舊格式 string[]）
        if (spec.entities?.length > 0) {
          spec.entities = spec.entities.map(e => ({
            name: e.name,
            fields: Array.isArray(e.fields)
              ? e.fields.map(f => (typeof f === 'string' ? { name: f } : f))
              : [],
          }))
        }

        // 零 LLM 後處理：用 actionsYml 精確覆寫 entity 欄位 type/required/validation
        const enrichedSpec = actionsYml ? enrichEntitiesFromActionsYml(spec, actionsYml) : spec

        logger.info({ pages: enrichedSpec.pages.length, entities: enrichedSpec.entities?.length || 0, conversationId: trackingContext?.conversationId }, '翻譯完成')

        return { success: true, spec: enrichedSpec }
      } catch (innerErr) {
        lastError = innerErr
        const errMsg = String(innerErr)
        const isRetryable = errMsg.includes('overloaded_error') || errMsg.includes('529') ||
          errMsg.includes('rate_limit_error') || errMsg.includes('503') ||
          errMsg.includes('ECONNRESET') || errMsg.includes('ETIMEDOUT')
        if (attempt < RETRY_MAX && isRetryable) {
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1)
          logger.warn({ attempt, retryMax: RETRY_MAX, delayMs: delay, error: errMsg.slice(0, 150) }, '暫時性錯誤，重試中')
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        break
      }
    }

    logger.error({ err: lastError }, '翻譯失敗')
    return { success: false, error: `BDD→UI 翻譯失敗: ${lastError}` }
  } catch (err) {
    logger.error({ err }, '翻譯初始化失敗')
    return { success: false, error: `BDD→UI 翻譯失敗: ${err}` }
  }
}

/**
 * 根據 action type 生成互動實作指引
 */
function getInteractionDescription(action: UIAction): string {
  const fieldList = action.fields && action.fields.length > 0
    ? action.fields.map(f => `${f.label}(${f.type}${f.required ? ', 必填' : ''})`).join('、')
    : ''

  switch (action.type) {
    case 'create':
      return `「${action.name}」按鈕 → 打開 Modal（useState 控制） → 表單欄位：${fieldList || '根據實體推斷'} → 提交後加入列表 + 關閉 Modal + 清空表單`
    case 'delete':
      return `「${action.name}」按鈕 → AlertDialog 確認「確定要刪除嗎？」 → 確認後從列表移除該項目`
    case 'update':
      return `「${action.name}」按鈕 → 打開預填資料的 Modal → 欄位：${fieldList || '與 create 相同'} → 提交後更新列表中對應項目 + 關閉 Modal`
    case 'filter':
      return `搜尋框/篩選器 → useState 管理搜尋詞 → useMemo 即時過濾列表`
    case 'view':
      return `點擊項目 → 展開詳情面板或導航到詳情頁`
    case 'toggle':
      return `「${action.name}」開關/按鈕 → useState boolean 控制 → 即時切換狀態 + 視覺反饋（switch 或 badge 狀態變色）`
    case 'batch':
      return `勾選框多選 → useState<Set> 管理選中 ID → 全選/取消 → 批量操作按鈕（disabled when empty）→ 確認對話框 → 批量處理`
    case 'sort':
      return `表頭點擊排序 → useState 管理 sortKey+sortOrder → 圖示反映排序方向（↑↓）→ useMemo 排序後資料`
    case 'export':
      return `「${action.name}」按鈕 → 觸發下載（模擬：生成 CSV/JSON blob → URL.createObjectURL → <a download>）`
    case 'navigate':
      return `「${action.name}」→ 多步驟表單/流程（useState step 控制） → 上一步/下一步 → 完成時提交`
    case 'upload':
      return `「${action.name}」→ input[type=file] + 拖放區域（onDragOver/onDrop）→ FileReader 預覽 → 上傳進度條（模擬）`
    default:
      return `「${action.name}」— 需要完整互動實作`
  }
}

/**
 * 將 UIRequirementsSpec 格式化為 prompt section（含互動實作指引）
 */
export function formatUISpecForPrompt(spec: UIRequirementsSpec): string {
  const lines: string[] = [
    `## 前端需求規格（已從 BDD 翻譯 — 含互動實作指引）`,
    `產品：${spec.productName} — ${spec.productSummary}`,
    '',
    '### 頁面規劃與互動需求',
  ]

  for (const page of spec.pages) {
    lines.push(`\n#### ${page.name} (${page.route})`)
    lines.push(`用途：${page.purpose}`)

    if (page.dataDisplays.length > 0) {
      lines.push(`資料展示：${page.dataDisplays.map(d => `${d.name}(${d.type}${d.columns ? ': ' + d.columns.join('/') : ''})`).join('、')}`)
      // M5：進階 display type 加入實作提示
      for (const d of page.dataDisplays) {
        if (d.type === 'carousel') lines.push(`  → 實作為走馬燈：useState index + 左右箭頭 + dots 指示器 + 自動輪播（useEffect + setInterval）`)
        if (d.type === 'paginated_list') lines.push(`  → 實作為分頁列表：每頁 10-20 項 + 底部分頁器（Prev/頁碼/Next）`)
        if (d.type === 'gallery') lines.push(`  → 實作為相簿網格：grid-cols-3 gap-4（響應式欄數 RWD 階段處理）+ 點擊放大 Modal + 上一張/下一張`)
      }
    }

    if (page.actions.length > 0) {
      lines.push(`\n**互動操作（每個都必須完整實作）：**`)
      for (const action of page.actions) {
        lines.push(`- ${getInteractionDescription(action)}`)
      }
    }
  }

  if (spec.navigation.length > 0) {
    lines.push('', '### 導航結構', spec.navigation.join(' → '))
  }

  if (spec.entities.length > 0) {
    lines.push('', '### 實體與欄位（用 useState 管理，初始值為模擬數據）')
    for (const entity of spec.entities) {
      const fieldDescs = entity.fields.map(f => {
        if (typeof f === 'string') return f  // 向下相容舊格式
        let desc = f.name
        if (f.type) desc += `(${f.type})`
        if (f.required) desc += '*'
        if (f.validation) desc += ` [${f.validation}]`
        return desc
      })
      lines.push(`- **${entity.name}**：${fieldDescs.join('、')}`)
    }
  }

  // 用戶流程
  if (spec.userFlows && spec.userFlows.length > 0) {
    lines.push('', '### 用戶操作流程（需要完整實作步驟控制）')
    for (const flow of spec.userFlows) {
      lines.push(`- **${flow.name}**（從 ${flow.triggerPage} 開始）：${flow.steps.join(' → ')}`)
    }
  }

  // 狀態管理提示
  if (spec.stateHints && spec.stateHints.length > 0) {
    lines.push('', '### 狀態管理提示')
    for (const hint of spec.stateHints) {
      lines.push(`- **${hint.name}**（${hint.scope === 'global' ? '全域' : '頁面級'}）：${hint.description}`)
    }
  }

  return lines.join('\n')
}

/**
 * 生成 uiSpec 的輕量摘要（供 Animation/RWD 階段注入）
 */
export function buildUISpecSummary(spec: UIRequirementsSpec): string {
  const actionTypes = new Set<string>()
  const displayTypes = new Set<string>()
  for (const page of spec.pages) {
    for (const action of page.actions) actionTypes.add(action.type)
    for (const display of page.dataDisplays) displayTypes.add(display.type)
  }
  const lines = [`產品：${spec.productName}，${spec.pages.length} 個頁面`]
  if (actionTypes.size > 0) lines.push(`互動操作：${[...actionTypes].join('、')}`)
  if (displayTypes.size > 0) lines.push(`資料展示：${[...displayTypes].join('、')}`)
  if (spec.userFlows && spec.userFlows.length > 0) {
    lines.push(`用戶流程：${spec.userFlows.map(f => f.name).join('、')}`)
  }
  return lines.join('\n')
}
