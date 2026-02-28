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
  vague?: boolean    // 相關但描述太模糊
  errorMessage?: string
}

// ── 強信號：有具體描述（產業/產品類型/功能），直接放行 ──
const STRONG_SIGNALS = [
  // 產業/場景 — 中文
  '餐廳', '咖啡', '咖啡廳', '店', '公司', '品牌', '商品', '服務',
  '課程', '預約', '訂購', '購物', '電商', '部落格', '作品集',
  '履歷', '活動', '展示', '形象', '行銷', '宣傳', '旅遊', '健身',
  '醫療', '教育', '音樂', '攝影', '婚禮', '寵物', '美食', '房地產',
  // 產業/場景 — 英文
  'restaurant', 'coffee', 'cafe', 'bakery', 'hotel', 'gym', 'fitness',
  'clinic', 'dental', 'medical', 'healthcare', 'pharmacy',
  'school', 'academy', 'university', 'education', 'tutor',
  'salon', 'spa', 'barber', 'beauty',
  'law firm', 'accounting', 'consulting', 'agency', 'studio',
  'photography', 'wedding', 'event', 'catering',
  'real estate', 'property', 'rental',
  'travel', 'tourism', 'booking',
  'pet', 'veterinary', 'vet',
  'music', 'band', 'podcast', 'art',
  'church', 'nonprofit', 'charity', 'ngo',
  'startup', 'tech', 'fintech', 'crypto',
  'shop', 'store', 'boutique', 'marketplace',
  'grocery', 'food', 'delivery', 'meal',
  // 具體產品類型 — 中文
  '官網',
  // 具體產品類型 — 英文
  'landing', 'portfolio', 'blog', 'dashboard', 'saas', 'cms',
  'e-commerce', 'ecommerce', 'webshop', 'storefront',
  'newsletter', 'resume', 'cv',
  'directory', 'listing', 'marketplace',
  'wiki', 'documentation', 'knowledge base',
  // 具體功能描述 — 中文
  '按鈕', '表單', '導覽', '選單', '輪播', '圖片', '影片',
  '登入', '註冊', '購物車', '搜尋', '留言', '聯絡',
  // 具體功能描述 — 英文
  'login', 'sign up', 'signup', 'register', 'checkout', 'cart',
  'contact form', 'booking form', 'reservation',
  'gallery', 'carousel', 'slider', 'hero section',
  'navbar', 'sidebar', 'footer', 'header',
  'pricing', 'testimonial', 'faq',
  'search', 'filter', 'comment', 'review',
]

// ── 弱信號：只有泛建站詞彙（知道要「建」但不知道建「什麼」），需 Haiku 確認 ──
const WEAK_SIGNALS = [
  // 泛用產品類型（沒有產業修飾就太模糊）— 中文
  '網站', '網頁', '頁面', '首頁', '平台', '系統', '應用',
  // 泛用產品類型 — 英文
  'app', 'website', 'web', 'page', 'site', 'platform', 'application',
  // 設計意圖 — 中文
  '設計', '介面', '排版', '版面', '樣式', '風格', '佈局', '布局',
  // 設計意圖 — 英文
  'ui', 'ux', 'layout', 'design', 'theme', 'template', 'mockup', 'prototype',
  // 建造動詞 — 中文
  '做一個', '建立', '建一個', '打造', '開發', '製作', '生成',
  // 建造動詞 — 英文
  'build', 'create', 'make', 'generate', 'develop', 'set up', 'launch',
  // 技術描述
  '動畫', '互動', '響應式', 'rwd', 'responsive', 'animation', 'interactive',
]

const HAIKU_PRICING = { input: 0.8, output: 4 }

/**
 * 檢查用戶輸入是否與建站相關且具體到可執行（Fast Mode 專用）
 *
 * 三層策略：
 * 1. 強信號（產業/具體產品）→ 直接放行（零成本）
 * 2. 弱信號（泛建站詞）→ Haiku 判斷是否具體到可生成
 * 3. 無信號 → Haiku 判斷相關性
 */
export async function checkBuildRelevance(
  message: string,
  context?: { userId?: string; conversationId?: string }
): Promise<RelevanceCheckResult> {
  const lower = message.toLowerCase()
  const isChinese = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(message)

  // Layer 1: 強信號 → 直接放行（有產業/產品類型 = 夠具體）
  if (STRONG_SIGNALS.some(kw => lower.includes(kw))) {
    return { relevant: true }
  }

  const hasWeakSignal = WEAK_SIGNALS.some(kw => lower.includes(kw))

  // Layer 2/3: 弱信號或無信號 → 微型 Haiku 判斷（相關性 + 具體性）
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { relevant: true }
  }

  try {
    const systemPrompt = hasWeakSignal
      ? '用戶想用快速建站工具。判斷描述是否具體到能知道「建什麼類型的網站」。只回覆 JSON:\n- 夠具體：{"relevant":true}\n- 相關但太模糊（如「做一個很酷的東西」「建一個網站」）：{"relevant":true,"vague":true}\n- 與建網站無關：{"relevant":false}'
      : '判斷用戶訊息是否與「建立網站/應用/數位產品」相關。只回覆 JSON: {"relevant":true} 或 {"relevant":false}'

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
        system: systemPrompt,
        messages: [{ role: 'user', content: message }],
      }),
    })

    if (!resp.ok) {
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

    const parsed = safeParseJson<{ relevant?: boolean; vague?: boolean }>(text)
    if (!parsed) return { relevant: true }

    // 不相關 → 拒絕
    if (parsed.relevant === false) {
      return {
        relevant: false,
        errorMessage: isChinese
          ? '這個需求似乎與建立網站無關。Tellcraft 專門用於快速建站。\n\n請描述您想建立的網站或應用，例如：「做一個咖啡店官網」、「建立一個作品集網站」'
          : 'This doesn\'t seem related to building a website. Tellcraft is a website builder.\n\nPlease describe the website or app you\'d like to build, e.g. "Build a coffee shop website" or "Create a portfolio site"',
      }
    }

    // 相關但太模糊 → 要求補充
    if (parsed.vague) {
      return {
        relevant: true,
        vague: true,
        errorMessage: isChinese
          ? '描述有點模糊，我需要更多細節才能幫您建站。\n\n請告訴我：\n- 這是什麼類型的網站？（如：餐廳官網、個人作品集、電商平台）\n- 主要用途是什麼？\n\n例如：「做一個日式餐廳的官網，要有菜單和訂位功能」'
          : 'Your description is a bit vague. I need more details to build your site.\n\nPlease tell me:\n- What type of website? (e.g. restaurant, portfolio, e-commerce)\n- What\'s its main purpose?\n\nExample: "Build a Japanese restaurant website with a menu and reservation system"',
      }
    }

    return { relevant: true }
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

// ── 違規冷卻升級 ──
// 累計違規（injection/abuse）→ 冷卻期逐級升級
// Redis key: `violation:{userId}` (count), TTL 24 小時自動歸零
const VIOLATION_THRESHOLDS = [
  { minCount: 3, cooldownSeconds: 60 },    // 第 3-5 次：冷卻 1 分鐘
  { minCount: 6, cooldownSeconds: 300 },   // 第 6-9 次：冷卻 5 分鐘
  { minCount: 10, cooldownSeconds: 1800 },  // 第 10+ 次：冷卻 30 分鐘
]
const VIOLATION_TTL = 86400  // 24 小時後歸零

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
 * 記錄違規並檢查是否觸發冷卻（Redis 原子操作）
 *
 * @returns 冷卻秒數（0 = 未觸發冷卻，正常返回違規回覆）
 */
async function recordViolation(userId: string, redis: Redis): Promise<number> {
  const key = `violation:${userId}`
  try {
    // 原子操作：INCR + 確保 TTL
    const luaScript = `
      local count = redis.call("INCR", KEYS[1])
      if count == 1 then
        redis.call("EXPIRE", KEYS[1], ARGV[1])
      end
      return count
    `
    const count = await redis.eval(luaScript, 1, key, VIOLATION_TTL) as number
    console.warn(`[Prefilter] 違規記錄: userId=${userId}, count=${count}`)

    // 從高到低匹配冷卻等級
    for (let i = VIOLATION_THRESHOLDS.length - 1; i >= 0; i--) {
      if (count >= VIOLATION_THRESHOLDS[i].minCount) {
        const cooldown = VIOLATION_THRESHOLDS[i].cooldownSeconds
        // 設定冷卻 key
        const cooldownKey = `cooldown:${userId}`
        await redis.set(cooldownKey, '1', 'EX', cooldown)
        return cooldown
      }
    }
    return 0
  } catch (err) {
    console.error('[Prefilter] 違規記錄失敗（降級跳過）:', err)
    return 0
  }
}

/**
 * 檢查用戶是否在冷卻期內
 */
async function checkCooldown(userId: string, redis: Redis): Promise<number> {
  try {
    const cooldownKey = `cooldown:${userId}`
    const ttl = await redis.ttl(cooldownKey)
    return ttl > 0 ? ttl : 0
  } catch {
    return 0
  }
}

/**
 * 前置過濾用戶消息（零 LLM 成本）
 *
 * 檢查順序：冷卻期 → 空消息 → 長度上限 → Prompt injection（+ 違規累計）→ Rate limiting
 */
export async function prefilterMessage(
  message: string,
  userId: string,
  redis: Redis
): Promise<PrefilterResult> {
  const isChinese = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(message)

  // 0. 冷卻期檢查（違規累計觸發的暫停）
  const cooldownTtl = await checkCooldown(userId, redis)
  if (cooldownTtl > 0) {
    const minutes = Math.ceil(cooldownTtl / 60)
    return {
      allowed: false,
      reason: 'rate_limit',
      errorMessage: isChinese
        ? `⚠️ 因多次發送無效訊息，您的帳號暫時冷卻中。請 ${minutes} 分鐘後再試。\n\nTellcraft 專門用於網站開發，請準備好您的建站需求後再來。`
        : `⚠️ Your account is temporarily on cooldown due to repeated invalid messages. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.\n\nTellcraft is for building websites — please come back with your project idea.`,
    }
  }

  // 1. 空消息/純空白
  if (!message || !message.trim()) {
    return {
      allowed: false,
      reason: 'empty',
      errorMessage: isChinese ? '請輸入您的需求描述。' : 'Please enter your request.',
    }
  }

  // 2. 長度上限
  if (message.length > MAX_MESSAGE_LENGTH) {
    return {
      allowed: false,
      reason: 'too_long',
      errorMessage: isChinese
        ? `訊息過長（${message.length} 字），請精簡至 ${MAX_MESSAGE_LENGTH} 字以內。`
        : `Message too long (${message.length} chars). Please keep it under ${MAX_MESSAGE_LENGTH} characters.`,
    }
  }

  // 3. Prompt injection 偵測
  const trimmed = message.trim()
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      console.warn(`[Prefilter] Prompt injection 偵測: userId=${userId}, pattern=${pattern}`)
      // 記錄違規 + 可能觸發冷卻
      const cooldown = await recordViolation(userId, redis)
      const cooldownWarning = cooldown > 0
        ? (isChinese ? `\n\n⚠️ 由於多次違規，您的帳號已被暫停 ${Math.ceil(cooldown / 60)} 分鐘。` : `\n\n⚠️ Due to repeated violations, your account has been suspended for ${Math.ceil(cooldown / 60)} minute${Math.ceil(cooldown / 60) > 1 ? 's' : ''}.`)
        : ''
      return {
        allowed: false,
        reason: 'injection',
        errorMessage: (isChinese
          ? '無法處理此類訊息。請描述您想建立的產品或功能。'
          : 'This type of message cannot be processed. Please describe the product or feature you want to build.')
          + cooldownWarning,
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
        errorMessage: isChinese
          ? `發送過於頻繁，請 ${ttl > 0 ? ttl : RATE_LIMIT_WINDOW} 秒後再試。`
          : `Too many messages. Please wait ${ttl > 0 ? ttl : RATE_LIMIT_WINDOW} seconds.`,
      }
    }
  } catch (err) {
    // Redis rate limit 失敗不阻塞（降級放行）
    console.error('[Prefilter] Rate limit 檢查失敗（降級放行）:', err)
  }

  return { allowed: true }
}

/**
 * 記錄違規（供 orchestrator 在 Classifier 判定 abuse 後調用）
 */
export async function recordAbuseViolation(
  userId: string,
  redis: Redis
): Promise<{ cooldown: number }> {
  const cooldown = await recordViolation(userId, redis)
  return { cooldown }
}
