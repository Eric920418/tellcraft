import Redis from 'ioredis'

// ============================================================
// Pre-filter：零 LLM 成本的前置過濾層
// ============================================================

export interface PrefilterResult {
  allowed: boolean
  reason?: 'empty' | 'too_long' | 'injection' | 'rate_limit'
  errorMessage?: string
}

// 消息長度上限
const MAX_MESSAGE_LENGTH = 5000

// Rate Limiting：60 秒內最多 10 條
const RATE_LIMIT_WINDOW = 60  // 秒
const RATE_LIMIT_MAX = 10

// Prompt injection 偵測模式
// 設計原則：Tellcraft 讓用戶「描述產品需求」，正常需求可能包含
// "forget password"、"act as admin"、"ignore items above $100" 等用語。
// 因此 pattern 必須精準針對「對 AI 下指令」的攻擊，避免誤殺需求描述。
const INJECTION_PATTERNS = [
  // ── 英文 patterns（限定後文為 AI 相關詞彙）──
  /ignore\s+(all\s+)?previous\s+(instructions?|prompts?|rules?|context)\b/i,
  /disregard\s+(all\s+)?previous\s+(instructions?|prompts?|rules?|context)\b/i,
  /forget\s+(all\s+)?previous\s+(instructions?|prompts?|rules?|context)\b/i,
  /you\s+are\s+now\s+(a|an)\s+(AI|assistant|chatbot|model|bot)\b/i,
  /\bact\s+as\b.{0,30}\b(assistant|AI|chatbot|model)\b/i,
  /\bjailbreak\b/i,
  /\bDAN\b.{0,20}\b(mode|prompt|character)\b/i,
  /\[\s*SYSTEM\s*\]/i,
  /<<\s*SYS\s*>>/i,
  // ── 中文 patterns ──
  /忽略(所有)?之?前的?(指令|提示|規則)/,
  /無視(所有)?之?前的?(指令|提示|規則)/,
  /假裝你是/,
  /你現在(是|扮演).{0,10}(AI|助手|機器人)/,
  /新的?指令[：:]\s*\S/,
  /系統提示[：:]\s*\S/,
]

/**
 * 前置過濾用戶消息（零 LLM 成本）
 *
 * 檢查順序：空消息 → 長度上限 → Prompt injection → Rate limiting
 */
export async function prefilterMessage(
  message: string,
  userId: string,
  redis: Redis
): Promise<PrefilterResult> {
  // 1. 空消息/純空白
  if (!message || !message.trim()) {
    return {
      allowed: false,
      reason: 'empty',
      errorMessage: '請輸入您的需求描述。',
    }
  }

  // 2. 長度上限
  if (message.length > MAX_MESSAGE_LENGTH) {
    return {
      allowed: false,
      reason: 'too_long',
      errorMessage: `訊息過長（${message.length} 字），請精簡至 ${MAX_MESSAGE_LENGTH} 字以內。`,
    }
  }

  // 3. Prompt injection 偵測
  const trimmed = message.trim()
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      console.warn(`[Prefilter] Prompt injection 偵測: userId=${userId}, pattern=${pattern}`)
      return {
        allowed: false,
        reason: 'injection',
        errorMessage: '無法處理此類訊息。請描述您想建立的產品或功能。',
      }
    }
  }

  // 4. Rate Limiting（Lua script 原子操作：INCR + EXPIRE 不可分割）
  try {
    const rateLimitKey = `ratelimit:msg:${userId}`
    const luaScript = `
      local current = redis.call("INCR", KEYS[1])
      if current == 1 then
        redis.call("EXPIRE", KEYS[1], ARGV[1])
      end
      return current
    `
    const count = await redis.eval(luaScript, 1, rateLimitKey, RATE_LIMIT_WINDOW) as number

    if (count > RATE_LIMIT_MAX) {
      const ttl = await redis.ttl(rateLimitKey)
      return {
        allowed: false,
        reason: 'rate_limit',
        errorMessage: `發送過於頻繁，請 ${ttl > 0 ? ttl : RATE_LIMIT_WINDOW} 秒後再試。`,
      }
    }
  } catch (err) {
    // Redis rate limit 失敗不阻塞（降級放行）
    console.error('[Prefilter] Rate limit 檢查失敗（降級放行）:', err)
  }

  return { allowed: true }
}
