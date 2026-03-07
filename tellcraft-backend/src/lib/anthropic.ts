/**
 * 統一 Anthropic Client + 模型 ID 常數
 * 全 codebase 唯一的 `new Anthropic` 和模型字串來源
 */

import Anthropic from '@anthropic-ai/sdk'
import { getEnv } from './env'

// ============================================================
// 模型 ID 常數（全 codebase 唯一來源）
// ============================================================

export const MODEL = {
  SONNET: 'claude-sonnet-4-6',
  HAIKU: 'claude-haiku-4-5-20251001',
} as const

export type ModelId = (typeof MODEL)[keyof typeof MODEL]

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
