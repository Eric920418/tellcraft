/**
 * Structured Outputs 共用封裝
 * 使用 Anthropic SDK messages.parse() + zodOutputFormat() 保證 JSON Schema 合規輸出
 */

import type Anthropic from '@anthropic-ai/sdk'
import type { ZodType } from 'zod'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { getAnthropicClient, trackLlmUsage, type ModelId } from './anthropic'
import { createLogger } from './logger'

const logger = createLogger('structured-output')

const RETRY_MAX = 3
const RETRY_BASE_MS = 2000

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
  purpose: string
  trackingContext?: { userId?: string; conversationId?: string }
}

// ============================================================
// Core function
// ============================================================

export async function callStructured<T>(
  options: StructuredOptions<T>,
): Promise<StructuredResult<T>> {
  const { schema, model, system, messages, maxTokens, temperature, purpose, trackingContext } = options
  const client = getAnthropicClient()

  for (let attempt = 1; attempt <= RETRY_MAX; attempt++) {
    try {
      const response = await client.messages.parse({
        model,
        max_tokens: maxTokens,
        system,
        messages,
        ...(temperature !== undefined && { temperature }),
        output_config: { format: zodOutputFormat(schema) },
      })

      // Track usage regardless of stop_reason（含 prompt caching metrics）
      const usage = response.usage
      const usageAny = usage as unknown as Record<string, unknown>
      const cacheCreation = (usageAny.cache_creation_input_tokens as number) || 0
      const cacheRead = (usageAny.cache_read_input_tokens as number) || 0
      trackLlmUsage({
        model,
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
        purpose,
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
      if (response.parsed_output == null) {
        logger.error({ purpose, model, stopReason }, 'parsed_output is null on end_turn')
        return { success: false, error: 'parsed_output is null' }
      }

      return {
        success: true,
        data: response.parsed_output,
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
  if ('status' in err) {
    const status = (err as { status: number }).status
    if (status === 429 || status === 529 || status === 503) return true
  }

  // Network errors
  if (err instanceof Error) {
    const msg = err.message
    if (msg.includes('ECONNRESET') || msg.includes('ETIMEDOUT') || msg.includes('overloaded')) {
      return true
    }
  }

  return false
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
