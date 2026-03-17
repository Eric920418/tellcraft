// ============================================================
// 客服問答功能（Fast Mode 入口 + handleContinueFlow 問候攔截）
// 零 LLM 意圖路由 + FAQ 匹配 + Sonnet 開放問答
// ============================================================

import { createLogger } from '../lib/logger'
import { getAnthropicClient, MODEL, trackLlmUsage } from '../lib/anthropic'

const logger = createLogger('customer-service')

// ── 型別定義 ──

export type FastModeIntentType = 'greeting' | 'chitchat' | 'acknowledgment' | 'question' | 'help' | null

export interface FastModeIntentResult {
  match: boolean
  type: FastModeIntentType
  faqTopic?: string
}

interface FaqEntry {
  patterns: RegExp[]
  replyZh: string
  replyEn: string
}

// ── 建站強信號子集（從 prefilter.ts STRONG_SIGNALS 複製必要項）──
const BUILD_STRONG_SIGNALS = [
  // 產業/場景 — 中文
  '餐廳', '咖啡', '咖啡廳', '花店', '店', '公司', '品牌', '商品',
  '課程', '預約', '訂購', '購物', '電商', '部落格', '作品集',
  '履歷', '活動', '展示', '形象', '行銷', '旅遊', '健身',
  '醫療', '教育', '攝影', '婚禮', '寵物', '美食', '房地產',
  // 產業/場景 — 英文
  'restaurant', 'coffee', 'cafe', 'bakery', 'hotel', 'gym', 'fitness',
  'clinic', 'dental', 'salon', 'spa', 'photography', 'wedding',
  'real estate', 'travel', 'shop', 'store', 'boutique',
  // 具體產品類型
  '官網', 'landing', 'portfolio', 'blog', 'dashboard', 'saas',
  'e-commerce', 'ecommerce',
]

// 建造動詞（與弱信號組合時表示建站意圖）
const BUILD_VERBS_ZH = ['做', '建', '建立', '打造', '開發', '製作', '生成', '幫我做', '幫我建']
const BUILD_VERBS_EN = ['build', 'create', 'make', 'generate', 'develop', 'set up']

// 弱信號（需搭配建造動詞才算建站）
const BUILD_WEAK_SIGNALS = ['網站', '網頁', '頁面', '首頁', '平台', '系統', '應用', 'website', 'web', 'page', 'site', 'app']

/**
 * 偵測 fast mode 用戶輸入的意圖
 * 取代 isGreetingOrChitchat，新增 question/help 分類
 */
export function detectFastModeIntent(msg: string): FastModeIntentResult {
  const trimmed = msg.trim()
  const lower = trimmed.toLowerCase()

  // 1. greeting（精確匹配）
  const greetings = [
    /^(嗨|你好|哈囉|嘿|哈嘍)$/,
    /^(hello|hi|hey|yo|sup|howdy)$/i,
    /^(早安|午安|晚安)$/,
    /^(good morning|good afternoon|good evening|good night)$/i,
  ]
  if (greetings.some(r => r.test(trimmed))) {
    return { match: true, type: 'greeting' }
  }

  // 2. acknowledgment（精確匹配）
  const acknowledgments = [
    /^(好|好的|收到|了解|知道了|嗯|喔|哦|是的|對|沒問題)$/,
    /^(謝謝|感謝|3q)$/,
    /^(ok|okay|sure|yep|yup|yeah|yes|no|nope|nah|alright|right|got it|noted|understood|roger)$/i,
    /^(thanks|thank you|thx|ty|cheers)$/i,
    /^(nice|cool|great|awesome|good|perfect|sweet|neat|wonderful|amazing|excellent|fantastic|brilliant|lovely|wow)$/i,
    /^(lol|lmao|rofl|heh|hehe|haha|hahaha|lmfao)$/i,
  ]
  if (acknowledgments.some(r => r.test(trimmed))) {
    return { match: true, type: 'acknowledgment' }
  }

  // 3. help（使用說明請求）
  const helpPatterns = [
    /^(怎麼用|使用說明|教學|教我|操作說明|使用教學|怎麼操作|怎麼使用)$/,
    /^(help|tutorial|how to use|how does this work|how do i use|instructions|guide)$/i,
  ]
  if (helpPatterns.some(r => r.test(trimmed))) {
    return { match: true, type: 'help' }
  }

  // 4. question（問句偵測，排除帶建站信號的問句）
  const isQuestion = detectQuestion(trimmed, lower)
  if (isQuestion) {
    // 排除帶建站信號的問句（如「可以幫我做一個花店網站嗎？」）
    if (!hasBuildSignal(trimmed, lower)) {
      const faq = matchFaq(trimmed, lower)
      return { match: true, type: 'question', faqTopic: faq?.topic }
    }
  }

  // 5. chitchat（純閒聊）
  const chitchatZh = [
    '天氣', '幾點', '講笑話', '說笑話', '幾歲',
    '吃什麼', '吃飯', '掰掰', '再見',
    '無聊', '好無聊', '你好嗎', '在嗎', '在不在',
  ]
  const chitchatEn = [
    'weather', 'what time', 'tell me a joke', 'tell a joke',
    'how old', 'what\'s your name', 'goodbye', 'bye bye', 'see you', 'see ya',
    'i\'m bored', 'bored', 'how are you', 'what\'s up', 'wassup',
    'are you there', 'anyone there',
  ]
  const laughPattern = /^[哈呵嘻哼嗯啊喔]{2,}$/
  const laughPatternEn = /^(ha){2,}h?$/i
  if (
    chitchatZh.some(k => trimmed.includes(k))
    || chitchatEn.some(k => lower.includes(k))
    || laughPattern.test(trimmed)
    || laughPatternEn.test(trimmed)
    || /^bye$/i.test(trimmed)
  ) {
    return { match: true, type: 'chitchat' }
  }

  return { match: false, type: null }
}

// ── 問句偵測 ──

function detectQuestion(trimmed: string, lower: string): boolean {
  // 中文問號/英文問號結尾
  if (/[？?]$/.test(trimmed)) return true

  // 中文疑問詞
  const zhQuestionWords = [
    '嗎', '呢', '怎麼', '如何', '什麼', '哪', '多少', '為什麼', '為何',
    '可以嗎', '能不能', '有沒有', '是不是', '會不會', '好不好',
    '你是誰', '你能做什麼', '你叫什麼',
  ]
  if (zhQuestionWords.some(w => trimmed.includes(w))) return true

  // 英文疑問句開頭
  const enQuestionStarts = [
    /^(how|what|can|do you|is there|does|are you|who|where|when|why|which|could|would|should|is it|have you|will)/i,
  ]
  if (enQuestionStarts.some(r => r.test(lower))) return true

  return false
}

// ── 建站信號偵測 ──

function hasBuildSignal(trimmed: string, lower: string): boolean {
  // 強信號直接命中
  if (BUILD_STRONG_SIGNALS.some(kw => lower.includes(kw))) return true

  // 建造動詞 + 弱信號組合
  const hasVerb = BUILD_VERBS_ZH.some(v => trimmed.includes(v))
    || BUILD_VERBS_EN.some(v => lower.includes(v))
  const hasWeak = BUILD_WEAK_SIGNALS.some(kw => lower.includes(kw))
  if (hasVerb && hasWeak) return true

  return false
}

// ── FAQ 匹配 ──

const FAQ_ENTRIES: Record<string, FaqEntry> = {
  pricing: {
    patterns: [
      /收費|費用|多少錢|價格|免費|付費|訂閱|方案|定價/,
      /pricing|price|cost|free|how much|subscription|plan/i,
    ],
    replyZh: 'Tellcraft 目前提供三種月費方案：\n\n- Creator：NT$699 / 月（90 Credits）\n- Pro：NT$1,990 / 月（300 Credits）\n- Business：NT$4,990 / 月（高用量 Fair use）\n\n所有方案都支援 AI 建站、迭代修改與部署。想試試看嗎？直接告訴我你想做什麼網站！',
    replyEn: 'Tellcraft currently offers three monthly plans:\n\n- Creator: NT$699/mo (90 credits)\n- Pro: NT$1,990/mo (300 credits)\n- Business: NT$4,990/mo (high-usage fair use)\n\nAll plans include AI-powered building, iteration, and deployment. Want to try it? Tell me what kind of website you want to build!',
  },
  capability: {
    patterns: [
      /能做什麼|功能|有什麼功能|你可以做什麼|你能幹嘛/,
      /what can you do|features|capabilities|what do you do/i,
    ],
    replyZh: 'Tellcraft 是 AI 驅動的自動化建站平台，核心功能：\n\n1. 一句話建站 — 描述需求，AI 自動生成\n2. 專業設計 — 多種風格方案可選\n3. 即時預覽 — 生成過程中即時查看\n4. 自由修改 — 用自然語言描述調整\n5. 一鍵部署 — 自動部署到網路上線\n\n直接告訴我你想做什麼網站就可以開始了！',
    replyEn: 'Tellcraft is an AI-powered website builder:\n\n1. One-sentence build — describe what you need\n2. Professional design — multiple style options\n3. Live preview — see it as it\'s generated\n4. Natural language edits — just describe changes\n5. One-click deploy — go live instantly\n\nJust tell me what kind of website you\'d like to build!',
  },
  limitations: {
    patterns: [
      /可以做\s*(app|APP|手機|ios|android|vue|react native|flutter)/,
      /支援.*(vue|angular|svelte|wordpress|php|python|java|ruby)/i,
      /能做.*app/i,
      /做\s*(app|APP)/,
      /support.*(vue|angular|wordpress|mobile app)/i,
      /can.*(mobile app|native app|ios|android)/i,
    ],
    replyZh: '目前 Tellcraft 專注於網頁前端開發，使用的技術：\n- Next.js + React\n- Tailwind CSS\n- 部署到 Vercel\n\n暫不支援：\n- 手機 APP（iOS/Android）\n- 其他框架（Vue/Angular 等）\n- 後端/資料庫開發\n\n但如果您需要的是網站，我可以幫您做出非常棒的成果！想試試看嗎？',
    replyEn: 'Tellcraft currently focuses on web frontend development:\n- Next.js + React\n- Tailwind CSS\n- Deployed to Vercel\n\nNot supported yet:\n- Mobile apps (iOS/Android)\n- Other frameworks (Vue/Angular)\n- Backend/database development\n\nBut if you need a website, I can create something great! Want to try?',
  },
  howto: {
    patterns: [
      /怎麼開始|怎麼用|第一步|步驟|流程|操作方式|使用方法/,
      /how to start|how to begin|getting started|first step|steps|process/i,
    ],
    replyZh: '使用 Tellcraft 超簡單，只要三步：\n\n1. 描述需求 — 告訴我你想做什麼網站\n   例：「做一個花店官網」\n2. 預覽調整 — 查看生成結果，用自然語言修改\n   例：「把標題改大一點」\n3. 部署上線 — 說「部署」就自動上線！\n\n現在就開始吧，告訴我你想做什麼！',
    replyEn: 'Using Tellcraft is super easy — just 3 steps:\n\n1. Describe — tell me what website you want\n   e.g. "Build a flower shop website"\n2. Preview & adjust — review and modify with natural language\n   e.g. "Make the title bigger"\n3. Deploy — say "deploy" to go live!\n\nLet\'s start! Tell me what you\'d like to build!',
  },
  deployment: {
    patterns: [
      /怎麼部署|部署到哪|上線|發布|publish|deploy.*where|how.*deploy/i,
      /部署方式|部署流程/,
    ],
    replyZh: '網站完成後，只需說「部署」即可一鍵上線！\n\n- 自動部署到 Vercel（全球 CDN，速度極快）\n- 提供免費的 .vercel.app 網域\n- 支援綁定自己的網域\n- 修改後可重新部署更新\n\n想先建一個網站試試嗎？',
    replyEn: 'Once your site is ready, just say "deploy" to go live!\n\n- Auto-deployed to Vercel (global CDN)\n- Free .vercel.app domain included\n- Custom domain support\n- Re-deploy after changes\n\nWant to build a website and try it out?',
  },
  iteration: {
    patterns: [
      /怎麼修改|可以改幾次|修改次數|改幾次|能改嗎|改了還能改/,
      /how.*modify|how many.*changes|can i change|edit.*limit/i,
    ],
    replyZh: '網站生成後可以持續迭代修改。\n\n用自然語言描述就好：\n- 「把標題改成紅色」\n- 「加一個聯絡表單」\n- 「背景換成深色」\n\n也支援撤銷上一步修改和版本回滾。高頻修改建議選擇 Pro 或 Business 方案。\n\n想開始建站嗎？直接告訴我你的需求！',
    replyEn: 'You can keep iterating on your site after it is generated.\n\nJust describe changes in natural language:\n- "Make the title red"\n- "Add a contact form"\n- "Switch to dark background"\n\nUndo and version rollback are also supported. For high-frequency iteration, Pro or Business is the best fit.\n\nReady to start? Tell me what you\'d like to build!',
  },
  domain: {
    patterns: [
      /網域|域名|domain|自己的網址|綁定網址|custom domain/i,
    ],
    replyZh: '部署後會獲得免費的 .vercel.app 網域。\n\n如果您有自己的網域，也可以綁定使用。部署完成後我會引導您設定。\n\n先來建一個網站吧！告訴我你想做什麼。',
    replyEn: 'After deployment, you get a free .vercel.app domain.\n\nYou can also bind your own custom domain — I\'ll guide you through the setup after deployment.\n\nLet\'s build a website first! Tell me what you need.',
  },
  support: {
    patterns: [
      /客服|聯繫|聯絡|回報問題|反饋|feedback|contact|support|report.*bug|bug.*report/i,
    ],
    replyZh: '如果遇到問題或有建議，歡迎透過以下方式聯繫我們：\n\n- 直接在對話中描述問題\n- 網站底部的聯繫方式\n\n如果是建站需求，直接告訴我就可以開始了！',
    replyEn: 'If you have issues or feedback:\n\n- Describe the problem right here in the chat\n- Use the contact info at the bottom of our site\n\nIf you want to build a website, just tell me what you need!',
  },
  about: {
    patterns: [
      /tellcraft是什麼|這是什麼|你是誰|誰做的|什麼平台|關於/,
      /what is tellcraft|who are you|who made|about|what are you|what platform/i,
    ],
    replyZh: 'Tellcraft 是一個 AI 驅動的自動化建站平台。\n\n只要用一句話描述需求，AI 就能自動生成專業網站，支援即時預覽、自然語言修改、一鍵部署上線。\n\n想試試看嗎？告訴我你想做什麼網站！',
    replyEn: 'Tellcraft is an AI-powered website building platform.\n\nJust describe what you need in one sentence, and AI will generate a professional website with live preview, natural language editing, and one-click deployment.\n\nWant to try? Tell me what kind of website you\'d like!',
  },
}

function matchFaq(trimmed: string, lower: string): { topic: string; replyZh: string; replyEn: string } | null {
  for (const [topic, entry] of Object.entries(FAQ_ENTRIES)) {
    if (entry.patterns.some(r => r.test(trimmed) || r.test(lower))) {
      return { topic, replyZh: entry.replyZh, replyEn: entry.replyEn }
    }
  }
  return null
}

/**
 * 取得 FAQ 回覆（給 orchestrator 用）
 */
export function getFaqReply(msg: string, locale?: 'zh' | 'en'): { reply: string; topic: string } | null {
  const trimmed = msg.trim()
  const lower = trimmed.toLowerCase()
  const faq = matchFaq(trimmed, lower)
  if (!faq) return null
  const isChinese = locale === 'zh' || (locale !== 'en' && /[\u4e00-\u9fff\u3400-\u4dbf]/.test(trimmed))
  return { reply: isChinese ? faq.replyZh : faq.replyEn, topic: faq.topic }
}

/**
 * 使用 Sonnet 回答開放問題（FAQ 未命中時）
 */
export async function answerWithSonnet(
  msg: string,
  context: { conversationId?: string; locale?: 'zh' | 'en' },
  onTextDelta?: (accumulated: string) => void
): Promise<string> {
  const isChinese = context.locale === 'zh' || (context.locale !== 'en' && /[\u4e00-\u9fff\u3400-\u4dbf]/.test(msg))

  const fallbackReply = isChinese
    ? '這個問題我目前無法回答。如果您有建站需求，直接告訴我想做什麼網站就好！'
    : 'I\'m not sure about that. If you want to build a website, just tell me what you need!'

  const systemPrompt = isChinese
    ? `你是 Tellcraft 平台的客服助手。Tellcraft 是 AI 驅動的自動化建站平台，用戶描述需求後 AI 自動生成網站。

平台資訊：
- 技術：Next.js + React + Tailwind CSS，部署到 Vercel
- 目前提供 Creator / Pro / Business 三種月費方案
- 支援：一句話建站、即時預覽、自然語言修改、一鍵部署
- 不支援：手機 APP、Vue/Angular、後端開發、資料庫
- 支援在方案配額內持續修改，並支援撤銷和版本回滾

回答規則：
- 只回答與 Tellcraft 平台相關的問題
- 如果問題與平台無關，禮貌地引導用戶回到建站
- 回覆簡潔（200 字以內），適合聊天介面
- 結尾引導用戶開始建站
- 使用繁體中文`
    : `You are a customer service assistant for Tellcraft, an AI-powered website building platform.

Platform info:
- Tech: Next.js + React + Tailwind CSS, deployed to Vercel
- Offers Creator / Pro / Business monthly plans
- Supports: one-sentence builds, live preview, natural language edits, one-click deploy
- Not supported: mobile apps, Vue/Angular, backend/database development
- Supports ongoing edits within plan credits, plus undo and version rollback

Rules:
- Only answer questions related to Tellcraft
- If off-topic, politely guide back to website building
- Keep replies concise (under 200 words), suitable for chat
- End with a prompt to start building`

  try {
    const client = getAnthropicClient()
    const stream = client.messages.stream({
      model: MODEL.SONNET,
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: msg }],
    })

    let accumulated = ''
    stream.on('text', (textDelta) => {
      accumulated += textDelta
      onTextDelta?.(accumulated)
    })

    const finalMessage = await stream.finalMessage()

    // 記錄使用量
    if (finalMessage.usage) {
      trackLlmUsage({
        model: MODEL.SONNET,
        inputTokens: finalMessage.usage.input_tokens || 0,
        outputTokens: finalMessage.usage.output_tokens || 0,
        purpose: 'customer_service',
        conversationId: context.conversationId,
      })
    }

    const text = accumulated.trim()
    if (!text) return fallbackReply

    return text
  } catch (err) {
    logger.error({ err }, 'Sonnet 呼叫失敗')
    return fallbackReply
  }
}
