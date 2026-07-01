/**
 * 統一 Anthropic Client + 模型 ID 常數 + Pricing
 * 全 codebase 唯一的 `new Anthropic`、模型字串、定價來源
 */

import Anthropic from '@anthropic-ai/sdk'
import { getEnv } from './env'
import { recordLlmUsage } from '../db/client'
import { createLogger } from './logger'

const logger = createLogger('anthropic')

// ============================================================
// 模型 ID 常數（全 codebase 唯一來源）
// ============================================================

export const MODEL = {
  SONNET: 'claude-sonnet-5',
  HAIKU: 'claude-haiku-4-5-20251001',
} as const

export type ModelId = (typeof MODEL)[keyof typeof MODEL]

// ============================================================
// 模型能力 gate（Sonnet 5 / Opus 4.7+ / Fable 這一代的 API 契約變更）
//
// 這一代移除了兩樣舊模型接受、傳了會直接回 400 的參數：
//   1. 非預設 sampling 參數（temperature / top_p / top_k）
//   2. extended thinking 的 budget_tokens（{type:'enabled'} 改成 adaptive）
// Haiku 4.5 等舊模型仍支援。目前 codebase 只有 SONNET(=sonnet-5) 與 HAIKU。
//
// 所有 API 組裝點（callStructured / 各 callClaude wrapper）一律用下面的 helper
// 過濾參數，避免散落各處手動 if；未來換模型只改這裡一處。
// ============================================================

/** 該模型是否接受非預設 sampling 參數（Haiku 4.5 等舊模型 true；Sonnet 5 這一代 false） */
export function supportsSampling(model: string): boolean {
  return model === MODEL.HAIKU
}

/** 回傳可安全展開進 request body 的 sampling 參數；不支援的模型回 {}（不傳 → 用預設，不 400） */
export function samplingParams(model: string, temperature?: number): { temperature?: number } {
  return temperature !== undefined && supportsSampling(model) ? { temperature } : {}
}

/**
 * 回傳可安全展開進 request body 的 thinking 參數。針對 Sonnet 5 這一代的兩個變化：
 *   (a) 移除了 {type:'enabled', budget_tokens}（傳了 → 400）
 *   (b) 「省略 thinking」= 預設跑 adaptive thinking（4.6 是不跑）
 *
 * 因此對 Sonnet 5：
 *   - 呼叫端「有」要 thinking（如 coder 修復想加推理）→ 回 {}，讓其吃預設 adaptive（(b) 的紅利，
 *     相當於舊 extended thinking 的現代版；SDK 0.72.1 無 adaptive 型別，靠「省略即 adaptive」達成）
 *   - 呼叫端「沒」要 thinking（deterministic 生成 / structured）→ pin {type:'disabled'} 對齊 4.6 行為，
 *     避免 (b) 的 adaptive 吃掉小 max_tokens 額度造成 JSON 截斷、或推高成本
 *
 * 舊模型（Haiku 等）不受 (a)(b) 影響：requested → 原樣 enabled；否則不設。
 *
 * 註：此 helper 只被「有 spread thinkingParams」的組裝點消費（structured-output funnel + coder），
 *     free-text wrapper（uiux/actions/formulation）不 spread 它，故它們的 Sonnet 5 呼叫維持 adaptive
 *     預設開啟（大 max_tokens、graceful，視為品質升級）。要改變此分工只需在對應組裝點增減 spread。
 */
export function thinkingParams(
  model: string,
  thinking?: { type: 'enabled'; budget_tokens: number },
): { thinking?: { type: 'enabled'; budget_tokens: number } | { type: 'disabled' } } {
  if (supportsSampling(model)) {
    return thinking ? { thinking } : {}
  }
  return thinking ? {} : { thinking: { type: 'disabled' } }
}

// ============================================================
// 定價（USD per 1M tokens）— 全 codebase 唯一來源
// ============================================================

export const PRICING: Record<string, { input: number; output: number }> = {
  [MODEL.SONNET]: { input: 3, output: 15 },
  [MODEL.HAIKU]: { input: 0.8, output: 4 },
}

/** Prompt caching 定價（USD per 1M tokens） */
export const CACHE_PRICING: Record<string, { write: number; read: number }> = {
  [MODEL.SONNET]: { write: 3.75, read: 0.3 },   // 125% input, 10% input
  [MODEL.HAIKU]:  { write: 1.0,  read: 0.08 },
}

export function calculateLlmCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheCreationTokens?: number,
  cacheReadTokens?: number,
): number {
  const p = PRICING[model]
  if (!p) return 0
  let cost = (inputTokens * p.input + outputTokens * p.output) / 1_000_000
  const cp = CACHE_PRICING[model]
  if (cp && cacheCreationTokens) cost += (cacheCreationTokens * cp.write) / 1_000_000
  if (cp && cacheReadTokens) cost += (cacheReadTokens * cp.read) / 1_000_000
  return cost
}

/**
 * Fire-and-forget LLM 用量記錄。
 * 自動計算 cost，DB 寫入失敗只 log 不 throw。
 */
export function trackLlmUsage(params: {
  model: string
  inputTokens: number
  outputTokens: number
  purpose: string
  userId?: string
  conversationId?: string
  cacheCreationTokens?: number
  cacheReadTokens?: number
}): void {
  const cost = calculateLlmCost(
    params.model, params.inputTokens, params.outputTokens,
    params.cacheCreationTokens, params.cacheReadTokens,
  )
  recordLlmUsage({
    model: params.model,
    inputTokens: params.inputTokens,
    outputTokens: params.outputTokens,
    costUsd: cost,
    purpose: params.purpose,
    userId: params.userId,
    conversationId: params.conversationId,
  }).catch(err => logger.error({ err }, 'trackLlmUsage failed'))
}

// ============================================================
// Anthropic SDK Client（單例）
// ============================================================

let _client: Anthropic | null = null

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    const env = getEnv()
    _client = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
      // L25.C: SDK 層 retry（補足 structured-output 的 app 層 retry）
      // 覆蓋 429/500/502/503/504/529 等 transient 錯誤
      maxRetries: 3,
    })
  }
  return _client
}

// ============================================================
// Anthropic Headers（給 fetch 模式用）
// ============================================================

export function getAnthropicHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-api-key': getEnv().ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
    'anthropic-beta': 'prompt-caching-2024-07-31',
  }
}

// ============================================================
// Prompt Caching 共用 helper
// ============================================================

/** system prompt 的可快取型別（string 或 TextBlockParam[]） */
export type CacheableSystemPrompt = string | Anthropic.Messages.TextBlockParam[]

/**
 * 將 system prompt 拆分為 static（cacheable）+ dynamic block。
 * ENABLE_PROMPT_CACHING=false 時回退為 plain string。
 *
 * static 部分必須放在最前面（prefix matching），跨呼叫不變的規則/模板放這裡。
 * dynamic 部分放每次呼叫會變的內容（feature name、action info 等）。
 */
export function buildCacheableSystem(
  staticPart: string,
  dynamicPart?: string,
): CacheableSystemPrompt {
  if (!getEnv().ENABLE_PROMPT_CACHING) {
    return dynamicPart ? staticPart + '\n\n' + dynamicPart : staticPart
  }
  const blocks: Anthropic.Messages.TextBlockParam[] = [
    { type: 'text' as const, text: staticPart, cache_control: { type: 'ephemeral' as const } },
  ]
  if (dynamicPart) {
    blocks.push({ type: 'text' as const, text: dynamicPart })
  }
  return blocks
}
