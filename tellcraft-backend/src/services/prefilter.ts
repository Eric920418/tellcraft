import Redis from 'ioredis'
import { recordLlmUsage } from '../db/client'
import { safeParseJson } from '../utils/safe-parse-json'

// ============================================================
// Pre-filter：零 LLM 成本的前置過濾層
// ============================================================

export interface PrefilterResult {
  allowed: boolean
  reason?: 'empty' | 'too_long' | 'injection' | 'rate_limit'
  errorMessage?: string
}

// ============================================================
// 建站相關性檢查（Fast Mode 專用）
// ============================================================

export interface RelevanceCheckResult {
  relevant: boolean
  errorMessage?: string
}

// 建站正向信號關鍵詞（命中任一 → 直接放行，零 LLM 成本）
const BUILD_POSITIVE_SIGNALS = [
  // 產品類型
  '網站', '官網', '網頁', '頁面', '首頁', '平台', '系統', '應用',
  'app', 'website', 'web', 'page', 'landing', 'portfolio', 'blog',
  'dashboard', 'saas', 'cms', 'e-commerce', 'ecommerce',
  // 設計意圖
  '設計', '介面', 'ui', 'ux', '排版', '版面', '樣式', '風格',
  '佈局', '布局', 'layout', 'design', 'theme',
  // 建造動詞
  '做一個', '建立', '建一個', '打造', '開發', '製作', '生成',
  'build', 'create', 'make', 'generate',
  // 產業/場景
  '餐廳', '咖啡', '店', '公司', '品牌', '商品', '產品', '服務',
  '課程', '預約', '訂購', '購物', '電商', '部落格', '作品集',
  '履歷', '活動', '展示', '形象', '行銷', '宣傳',
  // 功能描述
  '按鈕', '表單', '導覽', '選單', '輪播', '圖片', '影片',
  '動畫', '互動', '響應式', 'rwd', 'responsive',
]

const HAIKU_PRICING = { input: 0.8, output: 4 }

/**
 * 檢查用戶輸入是否與建站相關（Fast Mode 專用）
 *
 * 兩層策略：
 * 1. 正向關鍵詞匹配（零成本，覆蓋 90%+ 正常請求）
 * 2. 微型 Haiku 二元判斷（~$0.0002/次，僅對模糊輸入觸發）
 */
export async function checkBuildRelevance(
  message: string,
  context?: { userId?: string; conversationId?: string }
): Promise<RelevanceCheckResult> {
  const lower = message.toLowerCase()

  // Layer 1: 正向關鍵詞 → 直接放行
  if (BUILD_POSITIVE_SIGNALS.some(kw => lower.includes(kw))) {
    return { relevant: true }
  }

  // Layer 2: 沒有正向信號 → 微型 Haiku 判斷
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    // 無 API Key → 降級放行（寧可多生成一次也不誤擋）
    return { relevant: true }
  }

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 30,
        system: '判斷用戶訊息是否與「建立網站/應用/數位產品」相關。只回覆 JSON: {"relevant":true} 或 {"relevant":false,"reason":"一句話原因"}',
        messages: [{ role: 'user', content: message }],
      }),
    })

    if (!resp.ok) {
      // API 失敗 → 降級放行
      console.warn(`[Prefilter] 相關性檢查 API 錯誤 ${resp.status}，降級放行`)
      return { relevant: true }
    }

    const data = await resp.json() as {
      content?: Array<{ text?: string }>
      usage?: { input_tokens?: number; output_tokens?: number }
    }

    // 記錄使用量
    if (data.usage) {
      const inputTokens = data.usage.input_tokens || 0
      const outputTokens = data.usage.output_tokens || 0
      const cost = (inputTokens * HAIKU_PRICING.input + outputTokens * HAIKU_PRICING.output) / 1_000_000
      recordLlmUsage({
        model: 'claude-haiku-4-5-20251001',
        inputTokens,
        outputTokens,
        costUsd: cost,
        purpose: 'fast_mode_relevance_check',
        userId: context?.userId,
        conversationId: context?.conversationId,
      }).catch(err => console.error('[Prefilter] 記錄使用量失敗:', err))
    }

    const text = data.content?.[0]?.text
    if (!text) return { relevant: true }

    const parsed = safeParseJson<{ relevant?: boolean; reason?: string }>(text)
    if (!parsed || parsed.relevant !== false) {
      return { relevant: true }
    }

    return {
      relevant: false,
      errorMessage: `這個需求似乎與建立網站無關。Tellcraft 專門用於快速建站。\n\n請描述您想建立的網站或應用，例如：「做一個咖啡店官網」、「建立一個作品集網站」`,
    }
  } catch (err) {
    console.error('[Prefilter] 相關性檢查失敗，降級放行:', err)
    return { relevant: true }
  }
}

// 消息長度上限
const MAX_MESSAGE_LENGTH = 5000

// Rate Limiting：30 秒內最多 6 條（正常用戶不會 5 秒一條）
const RATE_LIMIT_WINDOW = 30  // 秒
const RATE_LIMIT_MAX = 6

// Prompt injection 偵測模式
// 設計原則：Tellcraft 讓用戶「描述產品需求」，正常需求可能包含
// "forget password"、"act as admin"、"ignore items above $100" 等用語。
// 因此 pattern 必須精準針對「對 AI 下指令」的攻擊，避免誤殺需求描述。
const INJECTION_PATTERNS = [
  // ── 英文 patterns（限定後文為 AI 相關詞彙）──
  /ignore\s+(all\s+)?previous\s+(instructions?|prompts?|rules?|context)\b/i,
  /disregard\s+(all\s+)?previous\s+(instructions?|prompts?|rules?|context)\b/i,
  /forget\s+(all\s+)?previous\s+(instructions?|prompts?|rules?|context)\b/i,
  /override\s+(all\s+)?(previous\s+)?(instructions?|prompts?|rules?|system)\b/i,
  /you\s+are\s+now\s+(a|an)\s+(AI|assistant|chatbot|model|bot|hacker|evil)\b/i,
  /\bact\s+as\b.{0,30}\b(assistant|AI|chatbot|model|hacker|evil|DAN)\b/i,
  /\brole\s*play\b.{0,20}\b(as|like)\b/i,
  /\bpretend\s+(you\s+are|to\s+be)\b/i,
  /\bswitch\s+to\b.{0,20}\b(mode|persona|character|role)\b/i,
  /\bjailbreak\b/i,
  /\bDAN\b.{0,20}\b(mode|prompt|character)\b/i,
  /\[\s*SYSTEM\s*\]/i,
  /<<\s*SYS\s*>>/i,
  /\bsystem\s*:\s*\S/i,                     // "system: you are now..."
  /\b(user|human|assistant)\s*:\s*\S/i,      // 偽造對話角色標記
  /\bdo\s+not\s+follow\s+(your\s+)?(rules?|instructions?|guidelines?)\b/i,
  /\brespond\s+without\s+(any\s+)?(restrictions?|filters?|safety)\b/i,
  /\bencode\s+in\s+base64\b/i,              // 嘗試繞過輸出過濾
  // ── 中文 patterns ──
  /忽略(所有)?之?前的?(指令|提示|規則|限制)/,
  /無視(所有)?之?前的?(指令|提示|規則|限制)/,
  /假裝你是/,
  /你現在(是|扮演).{0,10}(AI|助手|機器人|駭客)/,
  /新的?指令[：:]\s*\S/,
  /系統提示[：:]\s*\S/,
  /切換(到|成).{0,10}(模式|角色|人格)/,     // "切換到 DAN 模式"
  /不要遵守.{0,10}(規則|限制|指令)/,         // "不要遵守你的規則"
  /解除.{0,5}(限制|封印|安全)/,              // "解除限制"
  // ── 混合語言（中英夾雜常見攻擊）──
  /ignore.{0,10}(指令|規則|提示)/i,          // "ignore 之前的指令"
  /(忽略|無視).{0,10}(instructions?|rules?|prompts?)/i, // "忽略 instructions"
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
