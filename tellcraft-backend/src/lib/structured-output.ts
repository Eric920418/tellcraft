/**
 * Structured Outputs 共用封裝
 * 使用 Anthropic SDK messages.parse() + zodOutputFormat() 保證 JSON Schema 合規輸出
 * 大 max_tokens 時自動切換 streaming（SDK v0.72+ 要求）
 */

import type Anthropic from '@anthropic-ai/sdk'
import type { ZodType } from 'zod'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { getAnthropicClient, trackLlmUsage, samplingParams, thinkingParams, type ModelId } from './anthropic'
import { createLogger } from './logger'

const logger = createLogger('structured-output')

const RETRY_MAX = 3
const RETRY_BASE_MS = 2000

// SDK v0.72+ 閾值：(60min * maxTokens) / 128000 > 10min → maxTokens > 21333
const STREAMING_THRESHOLD = 21000

// ============================================================
// Public types
// ============================================================

export type StructuredResult<T> =
  | { success: true; data: T; usage: { inputTokens: number; outputTokens: number } }
  | { success: false; error: string; stopReason?: string }

export interface StructuredOptions<T> {
  schema: ZodType<T>
  model: ModelId
  system: string | Anthropic.Messages.TextBlockParam[]
  messages: Anthropic.Messages.MessageParam[]
  maxTokens: number
  temperature?: number
  thinking?: { type: 'enabled'; budget_tokens: number }
  purpose: string
  trackingContext?: { userId?: string; conversationId?: string }
}

// ============================================================
// Core function
// ============================================================

export async function callStructured<T>(
  options: StructuredOptions<T>,
): Promise<StructuredResult<T>> {
  const { schema, model, system, messages, maxTokens, temperature, thinking, purpose, trackingContext } = options
  const client = getAnthropicClient()
  const effectiveMaxTokens = thinking ? maxTokens + thinking.budget_tokens : maxTokens

  for (let attempt = 1; attempt <= RETRY_MAX; attempt++) {
    try {
      const params = {
        model,
        max_tokens: effectiveMaxTokens,
        system,
        messages,
        ...(thinking ? {} : samplingParams(model, temperature)),
        ...thinkingParams(model, thinking),
        output_config: { format: zodOutputFormat(schema) },
      }

      // 大 maxTokens 用 streaming 避免 SDK v0.72+ 的 10 分鐘限制
      const response = effectiveMaxTokens > STREAMING_THRESHOLD
        ? await client.messages.stream(params).finalMessage()
        : await client.messages.parse(params)

      // Track usage regardless of stop_reason（含 prompt caching metrics）
      const usage = response.usage
      const usageAny = usage as unknown as Record<string, unknown>
      const cacheCreation = (usageAny.cache_creation_input_tokens as number) || 0
      const cacheRead = (usageAny.cache_read_input_tokens as number) || 0
      trackLlmUsage({
        model,
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
        purpose: thinking ? `${purpose}+thinking` : purpose,
        userId: trackingContext?.userId,
        conversationId: trackingContext?.conversationId,
        cacheCreationTokens: cacheCreation,
        cacheReadTokens: cacheRead,
      })

      // Check stop_reason — only end_turn guarantees valid structured output
      const stopReason = response.stop_reason
      if (stopReason !== 'end_turn') {
        if (stopReason === 'max_tokens') {
          logger.warn({ purpose, model, maxTokens }, 'Structured output truncated (max_tokens)')
          return { success: false, error: 'Output truncated (max_tokens)', stopReason }
        }
        if (stopReason === 'refusal') {
          const refusalText = response.content
            .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
            .map(b => b.text)
            .join('')
          logger.warn({ purpose, model, refusalText }, 'Structured output refused')
          return { success: false, error: `Refused: ${refusalText}`, stopReason }
        }
        // stop_sequence, tool_use, pause_turn, or unknown
        logger.warn({ purpose, model, stopReason }, 'Unexpected stop_reason for structured output')
        return { success: false, error: `Unexpected stop_reason: ${stopReason}`, stopReason: stopReason ?? undefined }
      }

      // parsed_output is guaranteed by SDK when stop_reason is end_turn
      // Both .parse() and .stream().finalMessage() populate parsed_output with output_config
      const parsedOutput = (response as unknown as { parsed_output: T | null }).parsed_output
      if (parsedOutput == null) {
        logger.error({ purpose, model, stopReason }, 'parsed_output is null on end_turn')
        return { success: false, error: 'parsed_output is null' }
      }

      return {
        success: true,
        data: parsedOutput,
        usage: { inputTokens: usage.input_tokens, outputTokens: usage.output_tokens },
      }
    } catch (err: unknown) {
      if (isRetryable(err) && attempt < RETRY_MAX) {
        const delay = RETRY_BASE_MS * Math.pow(2, attempt - 1)
        logger.warn({ err, attempt, delay, purpose }, 'Retryable error, backing off')
        await sleep(delay)
        continue
      }
      const message = err instanceof Error ? err.message : String(err)
      logger.error({ err, attempt, purpose }, 'callStructured failed')
      return { success: false, error: message }
    }
  }

  // Should not reach here, but TypeScript needs it
  return { success: false, error: 'Exhausted retries' }
}

// ============================================================
// Helpers
// ============================================================

function isRetryable(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false

  // Anthropic SDK APIError — check status
  // L25.C: 加 500/502/504 — Anthropic API 在 Cloudflare 後面，transient 錯誤常見
  if ('status' in err) {
    const status = (err as { status: number }).status
    if (status === 429 || status === 529 || status === 503) return true
    if (status === 500 || status === 502 || status === 504) return true
  }

  // Network errors + Cloudflare 502 HTML body（有時不帶 status）
  if (err instanceof Error) {
    const msg = err.message
    if (msg.includes('ECONNRESET') || msg.includes('ETIMEDOUT') || msg.includes('overloaded')) {
      return true
    }
    // Cloudflare error pages leak HTML into error message
    if (msg.includes('502 Bad Gateway') || msg.includes('504 Gateway') || msg.includes('cloudflare')) {
      return true
    }
  }

  return false
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
