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
  SONNET: 'claude-sonnet-4-6',
  HAIKU: 'claude-haiku-4-5-20251001',
} as const

export type ModelId = (typeof MODEL)[keyof typeof MODEL]

// ============================================================
// 定價（USD per 1M tokens）— 全 codebase 唯一來源
// ============================================================

export const PRICING: Record<string, { input: number; output: number }> = {
  [MODEL.SONNET]: { input: 3, output: 15 },
  [MODEL.HAIKU]: { input: 0.8, output: 4 },
}

export function calculateLlmCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const p = PRICING[model]
  if (!p) return 0
  return (inputTokens * p.input + outputTokens * p.output) / 1_000_000
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
}): void {
  const cost = calculateLlmCost(params.model, params.inputTokens, params.outputTokens)
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
  }
}
