/**
 * PRD Discovery 去重服務
 * 三層防禦：Decision Summary + Post-generation Dedup
 * 用 Haiku 做輕量語意判斷，失敗時全部降級不阻斷流程
 */

import Anthropic from '@anthropic-ai/sdk'
import { recordLlmUsage } from '../db/client'
import { ClarifyItem } from './bdd-session'

// ============================================================
// 類型定義
// ============================================================

export interface DecisionSummary {
  coveredTopics: Array<{
    topic: string
    decision: string
    checklistAreas: string[]
  }>
  excludedFeatures: string[]
}

// Haiku 定價 (每百萬 tokens)
const HAIKU_PRICING = { input: 0.8, output: 4 }

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
// Decision Summary 生成
// ============================================================

/**
 * 將已回答的 Q&A 壓縮為結構化「已決策主題」列表
 * 用 Haiku 快速摘要，失敗返回 null（降級，不阻斷流程）
 * 成本：~$0.003/次
 */
export async function generateDecisionSummary(
  resolvedItems: ClarifyItem[],
  trackingContext?: { userId?: string; conversationId?: string }
): Promise<DecisionSummary | null> {
  if (resolvedItems.length === 0) return null

  try {
    const anthropic = getAnthropicClient()

    const qaList = resolvedItems
      .filter(item => item.answer)
      .map((item, i) => `${i + 1}. Q: ${item.whiteTextQuestion || item.question}\n   A: ${item.answer}${item.checklistItem ? ` [${item.checklistItem}]` : ''}`)
      .join('\n')

    const systemPrompt = `你是一位需求分析助手。請將以下已回答的 Q&A 列表壓縮為結構化的「已決策主題摘要」。

## 任務
1. 將相關的 Q&A 歸納為主題（例如「商品結構」「定價模式」「用戶角色」）
2. 每個主題用一句話總結決策結果
3. 標註相關的 checklist area（如 A1, B2 等）
4. 找出被用戶明確排除的功能

## 輸出格式（嚴格 JSON）
{
  "coveredTopics": [
    {
      "topic": "主題名稱 — 細項",
      "decision": "一句話決策結果",
      "checklistAreas": ["A1", "A5"]
    }
  ],
  "excludedFeatures": ["被排除的功能1", "被排除的功能2"]
}

## 規則
- 主題命名要具體（「花束尺寸規格」而非「商品」）
- 同一 Q&A 可能涵蓋多個主題
- excludedFeatures 只列用戶明確說「不需要」「不要」的功能`

    const stream = anthropic.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      temperature: 0.1,
      system: systemPrompt,
      messages: [{ role: 'user', content: `已回答的 Q&A 列表：\n${qaList}` }],
    })

    const finalMessage = await stream.finalMessage()

    // 記錄 LLM 用量
    const usage = finalMessage.usage
    if (usage) {
      const cost = (usage.input_tokens * HAIKU_PRICING.input + usage.output_tokens * HAIKU_PRICING.output) / 1_000_000
      recordLlmUsage({
        model: 'claude-haiku-4-5-20251001',
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
        costUsd: cost,
        purpose: 'clarify_decision_summary',
        userId: trackingContext?.userId,
        conversationId: trackingContext?.conversationId,
      }).catch(err => console.error('[ClarifyDedup] recordLlmUsage failed:', err))

      console.log(`[ClarifyDedup] Decision Summary 生成完成 (tokens: ${usage.input_tokens}/${usage.output_tokens}, cost: $${cost.toFixed(4)})`)
    }

    const content = finalMessage.content[0]
    if (content.type !== 'text') return null

    let jsonStr = content.text.trim()
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)```/)
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim()
    }

    const parsed = JSON.parse(jsonStr) as DecisionSummary

    // 基本驗證
    if (!parsed.coveredTopics || !Array.isArray(parsed.coveredTopics)) {
      console.warn('[ClarifyDedup] Decision Summary 格式錯誤，缺少 coveredTopics')
      return null
    }

    console.log(`[ClarifyDedup] Decision Summary: ${parsed.coveredTopics.length} 主題, ${parsed.excludedFeatures?.length || 0} 排除功能`)

    return parsed
  } catch (err) {
    console.error('[ClarifyDedup] generateDecisionSummary 失敗（降級跳過）:', err)
    return null
  }
}

// ============================================================
// Post-generation 去重
// ============================================================

/**
 * 判斷新生成的問題是否與既有問題語意重複
 * 用 Haiku 做語意比對，失敗返回原始 newItems（降級）
 * 成本：~$0.001/次
 */
export async function deduplicateQuestions(
  newItems: ClarifyItem[],
  existingItems: ClarifyItem[],
  trackingContext?: { userId?: string; conversationId?: string }
): Promise<ClarifyItem[]> {
  if (newItems.length === 0 || existingItems.length === 0) return newItems

  try {
    const anthropic = getAnthropicClient()

    const existingList = existingItems
      .map((item, i) => `E${i + 1}. ${item.whiteTextQuestion || item.question}${item.answer ? ` → ${item.answer}` : ''}`)
      .join('\n')

    const newList = newItems
      .map((item, i) => `N${i + 1}. ${item.whiteTextQuestion || item.question}`)
      .join('\n')

    const systemPrompt = `你是一位去重判斷助手。判斷新問題是否與既有問題語意重複。

## 判斷標準
- **語意重複**：詢問的主題和意圖相同，即使措辭不同（例如「花束有幾種尺寸」和「花束大小選項有哪些」是重複的）
- **已被回答覆蓋**：既有問題的回答已經隱含了新問題的答案
- **邏輯上不可能**：根據已有回答，新問題的前提已不成立

## 輸出格式（嚴格 JSON）
{
  "keep": [1, 3],
  "remove": [
    { "index": 2, "reason": "與 E5 重複：都在問商品規格結構" }
  ]
}

其中 index 是 N 編號（1-based）。keep 列出保留的 N 編號，remove 列出移除的。`

    const stream = anthropic.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      temperature: 0.1,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `## 既有問題（已問過或已回答）\n${existingList}\n\n## 新生成的問題\n${newList}\n\n請判斷哪些新問題是重複的。`,
      }],
    })

    const finalMessage = await stream.finalMessage()

    // 記錄 LLM 用量
    const usage = finalMessage.usage
    if (usage) {
      const cost = (usage.input_tokens * HAIKU_PRICING.input + usage.output_tokens * HAIKU_PRICING.output) / 1_000_000
      recordLlmUsage({
        model: 'claude-haiku-4-5-20251001',
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
        costUsd: cost,
        purpose: 'clarify_dedup',
        userId: trackingContext?.userId,
        conversationId: trackingContext?.conversationId,
      }).catch(err => console.error('[ClarifyDedup] recordLlmUsage failed:', err))

      console.log(`[ClarifyDedup] Dedup 完成 (tokens: ${usage.input_tokens}/${usage.output_tokens}, cost: $${cost.toFixed(4)})`)
    }

    const content = finalMessage.content[0]
    if (content.type !== 'text') return newItems

    let jsonStr = content.text.trim()
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)```/)
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim()
    }

    const parsed = JSON.parse(jsonStr) as {
      keep: number[]
      remove: Array<{ index: number; reason: string }>
    }

    if (!parsed.keep || !Array.isArray(parsed.keep)) {
      console.warn('[ClarifyDedup] Dedup 結果格式錯誤，保留所有問題')
      return newItems
    }

    // 根據 keep 列表過濾
    const keepSet = new Set(parsed.keep)
    const filtered = newItems.filter((_, i) => keepSet.has(i + 1))

    const removedCount = newItems.length - filtered.length
    if (removedCount > 0) {
      const reasons = (parsed.remove || []).map(r => `  N${r.index}: ${r.reason}`).join('\n')
      console.log(`[ClarifyDedup] 去重移除 ${removedCount}/${newItems.length} 個問題:\n${reasons}`)
    } else {
      console.log(`[ClarifyDedup] 去重：全部保留 (${newItems.length} 個)`)
    }

    return filtered
  } catch (err) {
    console.error('[ClarifyDedup] deduplicateQuestions 失敗（降級保留全部）:', err)
    return newItems
  }
}
