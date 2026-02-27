// ============================================================
// Event Storming 服務（Phase 0）
// DFS 深度探索用戶 Raw Idea，產出結構化 ES 文件
// 全部使用 Haiku，成本 ~$0.002/次
// ============================================================

import { recordLlmUsage } from '../db/client'
import { LlmTrackingContext } from './classifier'

// Haiku 定價 (每百萬 tokens)
const HAIKU_PRICING = { input: 0.8, output: 4 }

// ============================================================
// 常量配置
// ============================================================

const ES_CONFIG = {
  MAX_ITEMS: 20,              // Commands + ReadModels 上限
  MAX_QUESTIONS_PER_ROUND: 10, // 每回合主問題上限
  DFS_BANDWIDTH: 3,           // 每批同時處理的項目數
}

// ============================================================
// 型別定義
// ============================================================

type ESItemStatus = 'missing' | 'partial' | 'clear'

interface ESRule {
  type: '前置（狀態）' | '前置（參數）' | '後置（回應）' | '後置（狀態）'
  description: string
}

interface ESCommand {
  name: string
  status: ESItemStatus
  actor: string | null
  aggregate: string | null
  predecessors: string[]
  params: string[]
  description: { what: string | null; why: string | null; when: string | null }
  rules: ESRule[]
}

interface ESReadModel {
  name: string
  status: ESItemStatus
  actor: string | null
  aggregates: string[]
  returnFields: string[]
  description: { what: string | null; why: string | null; when: string | null }
  rules: ESRule[]
}

interface ESActor {
  name: string
  type: '人' | '系統'
  description: string
}

interface ESAggregate {
  name: string
  description: string
  properties: Array<{ name: string; description: string }>
}

export interface ESKnowledgeMap {
  systemName: string
  actors: ESActor[]
  commands: ESCommand[]
  readModels: ESReadModel[]
  aggregates: ESAggregate[]
  currentBatchIndex: number
  totalQuestionsAsked: number
  currentItemName: string | null
  currentSubStep: 'proposal' | 'params' | 'rules' | 'aggregate' | null
}

export interface ESExploreResult {
  type: 'initial_analysis'
    | 'proposal'
    | 'question'
    | 'sub_question'
    | 'batch_complete'
    | 'all_complete'
  content: string
  knowledgeMap: ESKnowledgeMap
  quickReplies?: Array<{ label: string; value: string; style?: 'primary' | 'secondary' | 'ghost' }>
  esDocument?: string
}

// ============================================================
// LLM 調用（Haiku）
// ============================================================

const RETRY_MAX = 3
const RETRY_BASE_DELAY_MS = 2000

async function callHaiku(
  systemPrompt: string,
  userMessage: string,
  options: { maxTokens?: number; temperature?: number } = {},
  trackingContext?: LlmTrackingContext
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

  let lastError = 'Unknown error'

  for (let attempt = 1; attempt <= RETRY_MAX; attempt++) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: options.maxTokens || 4096,
          temperature: options.temperature ?? 0.3,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        const status = response.status
        if (attempt < RETRY_MAX && (status === 429 || status === 529 || status === 503)) {
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1)
          console.warn(`[event-storming callHaiku] HTTP ${status} (attempt ${attempt}/${RETRY_MAX})，${delay}ms 後重試`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        lastError = `API error: ${status} - ${errorText}`
        break
      }

      const data = await response.json() as {
        usage?: { input_tokens: number; output_tokens: number }
        content?: Array<{ text: string }>
      }

      const inputTokens = data.usage?.input_tokens || 0
      const outputTokens = data.usage?.output_tokens || 0

      // 記錄使用量
      if (trackingContext) {
        const cost = (inputTokens * HAIKU_PRICING.input + outputTokens * HAIKU_PRICING.output) / 1_000_000
        recordLlmUsage({
          model: 'claude-haiku-4-5-20251001',
          inputTokens,
          outputTokens,
          costUsd: cost,
          purpose: 'event-storming',
          userId: trackingContext.userId,
          conversationId: trackingContext.conversationId,
        }).catch(err => console.error('[event-storming] 記錄使用量失敗:', err))
      }

      return {
        success: true,
        content: data.content?.[0]?.text || '',
        inputTokens,
        outputTokens,
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error'
      const msg = String(error)
      if (attempt < RETRY_MAX && (msg.includes('ECONNRESET') || msg.includes('ETIMEDOUT') || msg.includes('fetch failed'))) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1)
        console.warn(`[event-storming callHaiku] 網路錯誤 (attempt ${attempt}/${RETRY_MAX})，${delay}ms 後重試`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      break
    }
  }

  return { success: false, error: lastError }
}

// ============================================================
// JSON 安全解析
// ============================================================

function safeParseJson<T>(text: string): T | null {
  // 嘗試從 markdown code block 中提取 JSON
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  const jsonStr = codeBlockMatch ? codeBlockMatch[1].trim() : text.trim()

  try {
    return JSON.parse(jsonStr) as T
  } catch {
    // 嘗試找到第一個 { 或 [ 開始的位置
    const firstBrace = jsonStr.indexOf('{')
    const firstBracket = jsonStr.indexOf('[')
    const start = Math.min(
      firstBrace >= 0 ? firstBrace : Infinity,
      firstBracket >= 0 ? firstBracket : Infinity
    )
    if (start < Infinity) {
      try {
        return JSON.parse(jsonStr.slice(start)) as T
      } catch {
        return null
      }
    }
    return null
  }
}

// ============================================================
// 1. shouldRunEventStorming — 判斷是否需要 ES
// ============================================================

export async function shouldRunEventStorming(
  message: string,
  trackingContext?: LlmTrackingContext
): Promise<{ needed: boolean; reasoning: string }> {
  const systemPrompt = `你是一個需求分析專家。判斷用戶的需求描述是否複雜到需要進行 Event Storming（事件風暴）探索。

## 需要 Event Storming 的情況：
- 涉及多個不同角色（如管理員、用戶、商家等）
- 包含多個業務流程（如下單、付款、出貨、退貨等）
- 有明確的狀態流轉（如訂單狀態：待付款 → 已付款 → 出貨中 → 已完成）
- 涉及多個核心實體間的複雜交互
- 描述了一個完整的業務系統（非單一功能）

## 不需要 Event Storming 的情況：
- 簡單的展示型頁面（Landing Page、作品集、部落格）
- 單一功能（如表單、計算器、待辦清單）
- UI/視覺設計需求
- 描述過於簡短，不到兩句話

回覆 JSON：
{ "needed": true/false, "reasoning": "簡短說明原因" }`

  const response = await callHaiku(systemPrompt, `用戶需求：${message}`, { maxTokens: 256 }, trackingContext)

  if (!response.success || !response.content) {
    console.warn('[event-storming] shouldRunEventStorming LLM 失敗，默認跳過 ES:', response.error)
    return { needed: false, reasoning: 'LLM 調用失敗，跳過 Event Storming' }
  }

  const parsed = safeParseJson<{ needed: boolean; reasoning: string }>(response.content)
  if (!parsed) {
    console.warn('[event-storming] shouldRunEventStorming 解析失敗，默認跳過 ES')
    return { needed: false, reasoning: '解析失敗，跳過 Event Storming' }
  }

  return { needed: !!parsed.needed, reasoning: parsed.reasoning || '' }
}

// ============================================================
// 2. initEventStorming — 初始化，解析 Raw Idea
// ============================================================

export async function initEventStorming(
  message: string,
  trackingContext?: LlmTrackingContext
): Promise<{ success: boolean; knowledgeMap?: ESKnowledgeMap; displayText?: string; error?: string }> {
  const systemPrompt = `你是一位 Event Storming 引導師。從用戶的需求描述中，識別出所有的：
1. **Actors**（角色）：誰會使用這個系統？是人還是系統？
2. **Commands**（命令/寫操作）：用戶可以觸發什麼動作？（如：建立訂單、修改個人資料）
3. **Read Models**（讀操作/查詢）：用戶需要看到什麼資訊？（如：查看訂單列表、查看庫存）
4. **Aggregates**（聚合根）：核心業務實體有哪些？（如：訂單、商品、用戶）

## 重要：
- Commands 是「寫入」操作（建立/修改/刪除）
- Read Models 是「讀取」操作（查詢/列表/報表）
- 盡可能完整地列出，但總數不超過 ${ES_CONFIG.MAX_ITEMS} 個（Commands + ReadModels）
- 對於每個 Actor，標註是「人」還是「系統」

回覆 JSON：
{
  "systemName": "系統名稱",
  "actors": [{ "name": "角色名", "type": "人/系統", "description": "簡短描述" }],
  "commands": [{ "name": "命令名", "actor": "觸發角色", "aggregate": "相關聚合根" }],
  "readModels": [{ "name": "查詢名", "actor": "使用角色", "aggregates": ["相關聚合根"] }],
  "aggregates": [{ "name": "聚合根名", "description": "簡短描述" }]
}`

  const response = await callHaiku(systemPrompt, `用戶需求：\n${message}`, { maxTokens: 4096 }, trackingContext)

  if (!response.success || !response.content) {
    return { success: false, error: response.error || 'LLM 調用失敗' }
  }

  interface InitResult {
    systemName: string
    actors: Array<{ name: string; type: string; description: string }>
    commands: Array<{ name: string; actor: string; aggregate: string }>
    readModels: Array<{ name: string; actor: string; aggregates: string[] }>
    aggregates: Array<{ name: string; description: string }>
  }

  const parsed = safeParseJson<InitResult>(response.content)
  if (!parsed) {
    return { success: false, error: 'LLM 輸出解析失敗' }
  }

  // 建構 KnowledgeMap
  const knowledgeMap: ESKnowledgeMap = {
    systemName: parsed.systemName || '系統',
    actors: parsed.actors.map(a => ({
      name: a.name,
      type: (a.type === '系統' ? '系統' : '人') as '人' | '系統',
      description: a.description || '',
    })),
    commands: parsed.commands.slice(0, ES_CONFIG.MAX_ITEMS).map(c => ({
      name: c.name,
      status: 'missing' as ESItemStatus,
      actor: c.actor || null,
      aggregate: c.aggregate || null,
      predecessors: [],
      params: [],
      description: { what: null, why: null, when: null },
      rules: [],
    })),
    readModels: parsed.readModels.slice(0, ES_CONFIG.MAX_ITEMS - parsed.commands.length).map(r => ({
      name: r.name,
      status: 'missing' as ESItemStatus,
      actor: r.actor || null,
      aggregates: r.aggregates || [],
      returnFields: [],
      description: { what: null, why: null, when: null },
      rules: [],
    })),
    aggregates: parsed.aggregates.map(a => ({
      name: a.name,
      description: a.description || '',
      properties: [],
    })),
    currentBatchIndex: 0,
    totalQuestionsAsked: 0,
    currentItemName: null,
    currentSubStep: null,
  }

  // 組裝展示文字
  const actorList = knowledgeMap.actors.map(a => `  - **${a.name}**（${a.type}）：${a.description}`).join('\n')
  const cmdList = knowledgeMap.commands.map(c => `  - **${c.name}**（${c.actor || '?'} → ${c.aggregate || '?'}）`).join('\n')
  const rmList = knowledgeMap.readModels.map(r => `  - **${r.name}**（${r.actor || '?'} ← ${r.aggregates.join(', ') || '?'}）`).join('\n')
  const aggList = knowledgeMap.aggregates.map(a => `  - **${a.name}**：${a.description}`).join('\n')

  const displayText = `我分析了你的需求，以下是 **${knowledgeMap.systemName}** 的初步結構：

**角色（Actors）**：
${actorList || '  - （無）'}

**命令（Commands）** — 寫入操作：
${cmdList || '  - （無）'}

**查詢（Read Models）** — 讀取操作：
${rmList || '  - （無）'}

**核心實體（Aggregates）**：
${aggList || '  - （無）'}

請確認這個清單是否正確？如果有遺漏或需要修改的地方，請直接告訴我。`

  return { success: true, knowledgeMap, displayText }
}

// ============================================================
// 3. handleInitConfirm — 處理用戶對初始清單的確認
// ============================================================

export function handleInitConfirm(
  userMessage: string,
  knowledgeMap: ESKnowledgeMap
): ESExploreResult {
  const trimmed = userMessage.trim().toLowerCase()
  const isConfirm = ['y', 'yes', '是', '好', '確認', '可以', '沒問題', '正確', 'ok'].some(k => trimmed === k || trimmed.startsWith(k))

  if (isConfirm) {
    return {
      type: 'batch_complete',
      content: '收到！接下來我會逐項深入了解每個命令和查詢的細節。',
      knowledgeMap,
      quickReplies: [
        { label: '跳過 ES，直接釐清', value: '__skip_es__', style: 'ghost' },
      ],
    }
  }

  // 用戶有修改意見 → 返回讓 LLM 處理
  return {
    type: 'question',
    content: '好的，我會根據你的反饋調整清單。請稍候...',
    knowledgeMap,
  }
}

// ============================================================
// 4. exploreNextItem — DFS 探索下一個項目
// ============================================================

export async function exploreNextItem(
  knowledgeMap: ESKnowledgeMap,
  trackingContext?: LlmTrackingContext
): Promise<ESExploreResult> {
  // 找到下一個未完成的項目
  const allItems: Array<{ type: 'command' | 'readModel'; name: string; status: ESItemStatus }> = [
    ...knowledgeMap.commands.map(c => ({ type: 'command' as const, name: c.name, status: c.status })),
    ...knowledgeMap.readModels.map(r => ({ type: 'readModel' as const, name: r.name, status: r.status })),
  ]

  const nextItem = allItems.find(item => item.status !== 'clear')

  if (!nextItem) {
    // 全部完成
    const esDocument = generateESDocument(knowledgeMap)
    return {
      type: 'all_complete',
      content: `Event Storming 探索完成！共澄清了 ${knowledgeMap.commands.length} 個命令和 ${knowledgeMap.readModels.length} 個查詢。\n\n接下來會進入需求釐清階段，利用剛才的分析結果來深入細節。`,
      knowledgeMap,
      esDocument,
    }
  }

  knowledgeMap.currentItemName = nextItem.name
  knowledgeMap.currentSubStep = 'proposal'

  // 收集已澄清的上下文
  const clearedContext = buildClearedContext(knowledgeMap)

  const isCommand = nextItem.type === 'command'
  const cmd = isCommand ? knowledgeMap.commands.find(c => c.name === nextItem.name) : null
  const rm = !isCommand ? knowledgeMap.readModels.find(r => r.name === nextItem.name) : null

  const systemPrompt = `你是一位 Event Storming 引導師，正在深入探索「${knowledgeMap.systemName}」系統的 ${isCommand ? '命令' : '查詢'}：「${nextItem.name}」。

## 已知上下文
${clearedContext || '（尚無已澄清項目）'}

## 你的任務
為「${nextItem.name}」提出描述性屬性的提案，並提出一個需要用戶確認的問題。

提案應包含：
1. **what**: 這個${isCommand ? '命令' : '查詢'}做什麼？（一句話）
2. **why**: 為什麼需要它？（業務價值）
3. **when**: 什麼時候觸發？（前置條件或場景）
4. **params**（${isCommand ? '命令' : '查詢'}的輸入參數列表）
5. **一個澄清問題**：你覺得最重要的、需要確認的問題

回覆 JSON：
{
  "proposal": {
    "what": "描述",
    "why": "業務價值",
    "when": "觸發時機"
  },
  "suggestedParams": ["參數1", "參數2"],
  "question": "需要確認的問題",
  "questionOptions": ["選項內容（不要加 A/B/C 前綴）", "另一選項（建議）"]
}`

  const userMsg = isCommand
    ? `命令「${nextItem.name}」，由 ${cmd?.actor || '未知角色'} 觸發，關聯 ${cmd?.aggregate || '未知'} 聚合根。`
    : `查詢「${nextItem.name}」，由 ${rm?.actor || '未知角色'} 使用，關聯 ${rm?.aggregates?.join(', ') || '未知'} 聚合根。`

  const response = await callHaiku(systemPrompt, userMsg, { maxTokens: 1024 }, trackingContext)

  if (!response.success || !response.content) {
    // 降級：標記為 partial 繼續下一個
    console.warn(`[event-storming] exploreNextItem 失敗（${nextItem.name}）:`, response.error)
    markItemStatus(knowledgeMap, nextItem.name, 'partial')
    knowledgeMap.currentItemName = null
    knowledgeMap.currentSubStep = null
    return exploreNextItem(knowledgeMap, trackingContext)
  }

  interface ExploreProposal {
    proposal: { what: string; why: string; when: string }
    suggestedParams: string[]
    question: string
    questionOptions: string[]
  }

  const parsed = safeParseJson<ExploreProposal>(response.content)
  if (!parsed) {
    console.warn(`[event-storming] exploreNextItem 解析失敗（${nextItem.name}）`)
    markItemStatus(knowledgeMap, nextItem.name, 'partial')
    knowledgeMap.currentItemName = null
    knowledgeMap.currentSubStep = null
    return exploreNextItem(knowledgeMap, trackingContext)
  }

  // 更新知識地圖
  if (isCommand && cmd) {
    cmd.description = {
      what: parsed.proposal.what || null,
      why: parsed.proposal.why || null,
      when: parsed.proposal.when || null,
    }
    cmd.params = parsed.suggestedParams || []
    cmd.status = 'partial'
  } else if (!isCommand && rm) {
    rm.description = {
      what: parsed.proposal.what || null,
      why: parsed.proposal.why || null,
      when: parsed.proposal.when || null,
    }
    rm.returnFields = parsed.suggestedParams || []
    rm.status = 'partial'
  }

  knowledgeMap.totalQuestionsAsked++
  knowledgeMap.currentSubStep = 'params'

  // 組裝展示文字
  const progress = getProgressText(knowledgeMap)
  // 移除 LLM 可能已帶的選項標籤（如 "A. " "A) " "A: "）避免 "A. A." 重複
  const optionsList = (parsed.questionOptions || []).map((opt, i) => {
    const cleaned = opt.replace(/^[A-Da-d][.):\s]+\s*/, '').trim()
    return `  ${String.fromCharCode(65 + i)}. ${cleaned}`
  }).join('\n')

  // 參數/回傳欄位已存入 knowledgeMap（cmd.params / rm.returnFields），不顯示給用戶
  const content = `${progress}

**${isCommand ? '命令' : '查詢'}：${nextItem.name}**

我的提案：
- **做什麼**：${parsed.proposal.what || '—'}
- **為什麼**：${parsed.proposal.why || '—'}
- **何時觸發**：${parsed.proposal.when || '—'}

${parsed.question || '以上提案是否正確？'}
${optionsList}`

  const quickReplies: Array<{ label: string; value: string; style?: 'primary' | 'secondary' | 'ghost' }> = []
  if (parsed.questionOptions?.length) {
    parsed.questionOptions.forEach((opt, i) => {
      const cleanedOpt = opt.replace(/^[A-Da-d][.):\s]+\s*/, '').trim()
      quickReplies.push({ label: `${String.fromCharCode(65 + i)}. ${cleanedOpt.replace('（建議）', '').trim()}`, value: cleanedOpt })
    })
  }
  quickReplies.push({ label: '確認提案', value: '確認', style: 'primary' })
  quickReplies.push({ label: '跳過 ES，直接釐清', value: '__skip_es__', style: 'ghost' })

  return {
    type: 'proposal',
    content,
    knowledgeMap,
    quickReplies,
  }
}

// ============================================================
// 5. handleESAnswer — 處理用戶對提案/問題的回答
// ============================================================

export async function handleESAnswer(
  userMessage: string,
  knowledgeMap: ESKnowledgeMap,
  trackingContext?: LlmTrackingContext
): Promise<ESExploreResult> {
  const currentName = knowledgeMap.currentItemName
  if (!currentName) {
    // 沒有正在處理的項目，移動到下一個
    return exploreNextItem(knowledgeMap, trackingContext)
  }

  const trimmed = userMessage.trim()
  const isConfirm = ['確認', '好', '可以', '沒問題', 'ok', 'y', 'yes'].some(k => trimmed.toLowerCase() === k || trimmed.toLowerCase().startsWith(k + ' '))

  // 找到當前項目
  const cmd = knowledgeMap.commands.find(c => c.name === currentName)
  const rm = knowledgeMap.readModels.find(r => r.name === currentName)

  if (isConfirm) {
    // 用戶確認提案，接著問規則
    if (knowledgeMap.currentSubStep === 'params' || knowledgeMap.currentSubStep === 'proposal') {
      return askRules(knowledgeMap, currentName, trackingContext)
    }
    // 規則也確認了，標記為 clear
    markItemStatus(knowledgeMap, currentName, 'clear')
    knowledgeMap.currentItemName = null
    knowledgeMap.currentSubStep = null
    return exploreNextItem(knowledgeMap, trackingContext)
  }

  // 用戶有反饋，讓 LLM 更新知識地圖
  const clearedContext = buildClearedContext(knowledgeMap)
  const isCommand = !!cmd
  const item = cmd || rm

  const systemPrompt = `你是 Event Storming 引導師。用戶對「${currentName}」的提案給了反饋，請根據反饋更新描述。

## 當前狀態
${JSON.stringify(item, null, 2)}

## 已知上下文
${clearedContext || '（無）'}

根據用戶反饋，更新後回覆 JSON：
{
  "description": { "what": "...", "why": "...", "when": "..." },
  ${isCommand ? '"params": ["參數1", ...]' : '"returnFields": ["欄位1", ...]'},
  "rules": [{ "type": "前置（狀態）/前置（參數）/後置（回應）/後置（狀態）", "description": "規則描述" }],
  "followUpQuestion": "追問（如果還需要確認的話）",
  "isComplete": true/false
}`

  const response = await callHaiku(systemPrompt, `用戶反饋：${userMessage}`, { maxTokens: 1024 }, trackingContext)

  if (!response.success || !response.content) {
    console.warn(`[event-storming] handleESAnswer 失敗（${currentName}）:`, response.error)
    // 降級：標記 partial 繼續
    markItemStatus(knowledgeMap, currentName, 'partial')
    knowledgeMap.currentItemName = null
    knowledgeMap.currentSubStep = null
    return exploreNextItem(knowledgeMap, trackingContext)
  }

  interface AnswerResult {
    description: { what: string; why: string; when: string }
    params?: string[]
    returnFields?: string[]
    rules?: Array<{ type: string; description: string }>
    followUpQuestion?: string
    isComplete?: boolean
  }

  const parsed = safeParseJson<AnswerResult>(response.content)
  if (!parsed) {
    markItemStatus(knowledgeMap, currentName, 'partial')
    knowledgeMap.currentItemName = null
    knowledgeMap.currentSubStep = null
    return exploreNextItem(knowledgeMap, trackingContext)
  }

  // 更新知識地圖
  if (cmd) {
    cmd.description = {
      what: parsed.description?.what || cmd.description.what,
      why: parsed.description?.why || cmd.description.why,
      when: parsed.description?.when || cmd.description.when,
    }
    if (parsed.params) cmd.params = parsed.params
    if (parsed.rules) {
      cmd.rules = parsed.rules.map(r => ({
        type: r.type as ESRule['type'],
        description: r.description,
      }))
    }
  } else if (rm) {
    rm.description = {
      what: parsed.description?.what || rm.description.what,
      why: parsed.description?.why || rm.description.why,
      when: parsed.description?.when || rm.description.when,
    }
    if (parsed.returnFields) rm.returnFields = parsed.returnFields
    if (parsed.rules) {
      rm.rules = parsed.rules.map(r => ({
        type: r.type as ESRule['type'],
        description: r.description,
      }))
    }
  }

  if (parsed.isComplete) {
    markItemStatus(knowledgeMap, currentName, 'clear')
    knowledgeMap.currentItemName = null
    knowledgeMap.currentSubStep = null
    return exploreNextItem(knowledgeMap, trackingContext)
  }

  // 有追問
  if (parsed.followUpQuestion) {
    knowledgeMap.totalQuestionsAsked++
    return {
      type: 'sub_question',
      content: parsed.followUpQuestion,
      knowledgeMap,
      quickReplies: [
        { label: '確認', value: '確認', style: 'primary' },
        { label: '跳過 ES，直接釐清', value: '__skip_es__', style: 'ghost' },
      ],
    }
  }

  // 無追問，標記完成
  markItemStatus(knowledgeMap, currentName, 'clear')
  knowledgeMap.currentItemName = null
  knowledgeMap.currentSubStep = null
  return exploreNextItem(knowledgeMap, trackingContext)
}

// ============================================================
// askRules — 提案確認後，詢問規則
// ============================================================

async function askRules(
  knowledgeMap: ESKnowledgeMap,
  itemName: string,
  trackingContext?: LlmTrackingContext
): Promise<ESExploreResult> {
  const cmd = knowledgeMap.commands.find(c => c.name === itemName)
  const rm = knowledgeMap.readModels.find(r => r.name === itemName)
  const item = cmd || rm
  const isCommand = !!cmd

  const systemPrompt = `你是 Event Storming 引導師。「${itemName}」的描述性屬性已確認，現在需要識別它的業務規則。

## 當前狀態
${JSON.stringify(item, null, 2)}

## 四類規則
- **前置（狀態）**：執行前系統必須滿足的狀態條件（如：庫存 > 0）
- **前置（參數）**：輸入參數的約束（如：數量必須 > 0）
- **後置（回應）**：${isCommand ? '成功回應的內容' : '查詢回傳的資料結構'}
- **後置（狀態）**：${isCommand ? '執行後資料庫的狀態變化' : '（查詢通常無狀態變化）'}

請提出你認為可能的規則，讓用戶確認。

回覆 JSON：
{
  "suggestedRules": [{ "type": "類型", "description": "規則描述" }],
  "displayText": "展示給用戶的說明文字"
}`

  const response = await callHaiku(systemPrompt, `請為「${itemName}」提出規則提案`, { maxTokens: 1024 }, trackingContext)

  if (!response.success || !response.content) {
    // 降級：跳過規則，標記 clear
    markItemStatus(knowledgeMap, itemName, 'clear')
    knowledgeMap.currentItemName = null
    knowledgeMap.currentSubStep = null
    return exploreNextItem(knowledgeMap, trackingContext)
  }

  interface RulesProposal {
    suggestedRules: Array<{ type: string; description: string }>
    displayText: string
  }

  const parsed = safeParseJson<RulesProposal>(response.content)
  if (!parsed || !parsed.suggestedRules?.length) {
    markItemStatus(knowledgeMap, itemName, 'clear')
    knowledgeMap.currentItemName = null
    knowledgeMap.currentSubStep = null
    return exploreNextItem(knowledgeMap, trackingContext)
  }

  // 預設寫入建議規則
  const rules = parsed.suggestedRules.map(r => ({
    type: r.type as ESRule['type'],
    description: r.description,
  }))

  if (cmd) cmd.rules = rules
  if (rm) rm.rules = rules

  knowledgeMap.currentSubStep = 'rules'
  knowledgeMap.totalQuestionsAsked++

  const rulesList = rules.map((r, i) => `  ${i + 1}. **${r.type}**：${r.description}`).join('\n')

  return {
    type: 'proposal',
    content: `${parsed.displayText || `以下是我為「${itemName}」提出的規則：`}\n\n${rulesList}\n\n這些規則是否正確？有需要補充或修改的嗎？`,
    knowledgeMap,
    quickReplies: [
      { label: '確認規則', value: '確認', style: 'primary' },
      { label: '跳過 ES，直接釐清', value: '__skip_es__', style: 'ghost' },
    ],
  }
}

// ============================================================
// 6. generateESDocument — 從 KnowledgeMap 生成 es.md
// ============================================================

export function generateESDocument(knowledgeMap: ESKnowledgeMap): string {
  const lines: string[] = []
  lines.push(`# Event Storming: ${knowledgeMap.systemName}`)
  lines.push('')

  // Actors
  lines.push('## Actors')
  lines.push('')
  for (const actor of knowledgeMap.actors) {
    lines.push(`### ${actor.name}（${actor.type}）`)
    lines.push(actor.description)
    lines.push('')
  }

  // Aggregates
  lines.push('## Aggregates')
  lines.push('')
  for (const agg of knowledgeMap.aggregates) {
    lines.push(`### ${agg.name}`)
    lines.push(agg.description)
    if (agg.properties.length > 0) {
      lines.push('')
      lines.push('Properties:')
      for (const prop of agg.properties) {
        lines.push(`- **${prop.name}**: ${prop.description}`)
      }
    }
    lines.push('')
  }

  // Commands
  lines.push('## Commands')
  lines.push('')
  for (const cmd of knowledgeMap.commands) {
    lines.push(`### ${cmd.name}`)
    lines.push(`- **Actor**: ${cmd.actor || '未知'}`)
    lines.push(`- **Aggregate**: ${cmd.aggregate || '未知'}`)
    if (cmd.description.what) lines.push(`- **What**: ${cmd.description.what}`)
    if (cmd.description.why) lines.push(`- **Why**: ${cmd.description.why}`)
    if (cmd.description.when) lines.push(`- **When**: ${cmd.description.when}`)
    if (cmd.params.length > 0) {
      lines.push(`- **Params**: ${cmd.params.join(', ')}`)
    }
    if (cmd.predecessors.length > 0) {
      lines.push(`- **Predecessors**: ${cmd.predecessors.join(', ')}`)
    }
    if (cmd.rules.length > 0) {
      lines.push('')
      lines.push('Rules:')
      for (const rule of cmd.rules) {
        lines.push(`- **${rule.type}**: ${rule.description}`)
      }
    }
    lines.push(`- **Status**: ${cmd.status}`)
    lines.push('')
  }

  // Read Models
  lines.push('## Read Models')
  lines.push('')
  for (const rm of knowledgeMap.readModels) {
    lines.push(`### ${rm.name}`)
    lines.push(`- **Actor**: ${rm.actor || '未知'}`)
    lines.push(`- **Aggregates**: ${rm.aggregates.join(', ') || '未知'}`)
    if (rm.description.what) lines.push(`- **What**: ${rm.description.what}`)
    if (rm.description.why) lines.push(`- **Why**: ${rm.description.why}`)
    if (rm.description.when) lines.push(`- **When**: ${rm.description.when}`)
    if (rm.returnFields.length > 0) {
      lines.push(`- **Return Fields**: ${rm.returnFields.join(', ')}`)
    }
    if (rm.rules.length > 0) {
      lines.push('')
      lines.push('Rules:')
      for (const rule of rm.rules) {
        lines.push(`- **${rule.type}**: ${rule.description}`)
      }
    }
    lines.push(`- **Status**: ${rm.status}`)
    lines.push('')
  }

  return lines.join('\n')
}

// ============================================================
// 7. validateKnowledgeMap — 驗證知識地圖完整性
// ============================================================

export function validateKnowledgeMap(
  knowledgeMap: ESKnowledgeMap
): { complete: boolean; missingItems: string[] } {
  const missingItems: string[] = []

  for (const cmd of knowledgeMap.commands) {
    if (cmd.status !== 'clear') {
      missingItems.push(`Command: ${cmd.name} (${cmd.status})`)
    }
  }
  for (const rm of knowledgeMap.readModels) {
    if (rm.status !== 'clear') {
      missingItems.push(`ReadModel: ${rm.name} (${rm.status})`)
    }
  }

  return {
    complete: missingItems.length === 0,
    missingItems,
  }
}

// ============================================================
// Helper 函數
// ============================================================

function markItemStatus(knowledgeMap: ESKnowledgeMap, itemName: string, status: ESItemStatus) {
  const cmd = knowledgeMap.commands.find(c => c.name === itemName)
  if (cmd) { cmd.status = status; return }
  const rm = knowledgeMap.readModels.find(r => r.name === itemName)
  if (rm) rm.status = status
}

function buildClearedContext(knowledgeMap: ESKnowledgeMap): string {
  const lines: string[] = []

  for (const cmd of knowledgeMap.commands.filter(c => c.status === 'clear' || c.status === 'partial')) {
    lines.push(`[Command] ${cmd.name}: ${cmd.description.what || '?'} (${cmd.status})`)
    if (cmd.params.length) lines.push(`  Params: ${cmd.params.join(', ')}`)
    if (cmd.rules.length) lines.push(`  Rules: ${cmd.rules.map(r => `${r.type}: ${r.description}`).join('; ')}`)
  }

  for (const rm of knowledgeMap.readModels.filter(r => r.status === 'clear' || r.status === 'partial')) {
    lines.push(`[ReadModel] ${rm.name}: ${rm.description.what || '?'} (${rm.status})`)
    if (rm.returnFields.length) lines.push(`  Fields: ${rm.returnFields.join(', ')}`)
    if (rm.rules.length) lines.push(`  Rules: ${rm.rules.map(r => `${r.type}: ${r.description}`).join('; ')}`)
  }

  return lines.join('\n')
}

function getProgressText(knowledgeMap: ESKnowledgeMap): string {
  const allItems = [...knowledgeMap.commands, ...knowledgeMap.readModels]
  const total = allItems.length
  const cleared = allItems.filter(i => i.status === 'clear').length
  const partial = allItems.filter(i => i.status === 'partial').length

  return `**進度**：${cleared}/${total} 已完成，${partial} 進行中 | 累計 ${knowledgeMap.totalQuestionsAsked} 個問題`
}
