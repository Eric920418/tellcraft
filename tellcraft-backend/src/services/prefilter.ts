import Redis from 'ioredis'
import { z } from 'zod'
import { createLogger } from '../lib/logger'
import { MODEL } from '../lib/anthropic'
import { callStructured } from '../lib/structured-output'
import { recordTelemetry } from './skill-telemetry'

const logger = createLogger('prefilter')

// ============================================================
// Pre-filter：零 LLM 成本的前置過濾層
// ============================================================

export interface PrefilterResult {
  allowed: boolean
  reason?: 'empty' | 'too_long' | 'injection' | 'rate_limit' | 'gibberish' | 'offensive' | 'spam'
  errorMessage?: string
}

// ============================================================
// 輸入品質檢測（亂碼 / 髒話 / 垃圾輸入）
// ============================================================

export type InputQualityVerdict = 'valid' | 'gibberish' | 'offensive' | 'spam'
export type QualityStrictness = 'strict' | 'normal' | 'lenient'

export interface InputQualityResult {
  quality: InputQualityVerdict
  confidence: number
  reason?: string           // debug 用
  userMessage?: string      // 面向用戶的拒絕訊息
}

// ── 髒話庫（精準小型，命中即攔截）──
// L27: 大幅擴充台灣 / 中國 / 香港髒話變體覆蓋。歷史漏網案例：
//   - `幹林娘` 漏網（/幹你/ 沒抓到，台語「林」= 你的口語化）
//   - `機掰` / `雞掰` 等台灣常用髒話沒覆蓋
//   - `北七` / `北爛` / `白目` 等貶意詞沒覆蓋
//   - `他媽的` / `你媽的` 等 expletive 沒覆蓋
const OFFENSIVE_PATTERNS_ZH = [
  // === 「幹/操/肏」+ 對方代詞家族 ===
  // 你 / 林（台語你）/ 恁（閩南語你）/ 拎（你的口語）/ 妳
  /[幹操肏][林你恁拎妳][娘媽老]/,           // 幹你娘 / 幹林娘 / 操恁媽 / 肏拎老母
  /[幹操肏][林你恁拎妳]媽[逼的死B]/i,       // 幹你媽逼 / 操拎媽B
  /[幹操肏][林你恁拎妳]老[師母父北爸逼]/,    // 幹你老師 / 幹林老母
  /[幹操肏](三小|啥小|什麼|啥|什小)/,        // 幹三小 / 操什麼 / 肏啥
  /[幹操肏][林你恁拎妳](?:屁|屎|機|雞)/,     // 幹你屁 / 操林機掰 partial
  // 不含對方代詞的單字攻擊（語氣強烈）
  /操[你妳爆]/, /肏[你妳爆]/,
  // === 「你媽 / 他媽」家族 ===
  /[你妳他祂恁拎林]媽[逼的死B噓]/i,          // 你媽逼 / 他媽的 / 恁媽B
  /(他媽|你媽|去他媽|去你媽|他X)的/,         // 他媽的 / 去他媽的 / 他X的
  // === 「機掰 / 雞掰」家族（台灣常用） ===
  /[機雞][掰巴八]/, /[幹超][機雞][掰巴八]/,  // 機掰 / 雞八 / 幹機掰
  // === 「北七 / 北爛 / 87」 ===
  // 注意：\b 對中文字無效（中文字非 \w），改用 lookbehind/lookahead 排除常見詞綴
  // 排除 北七星(汽水) 北爛東(街)，避免誤殺地名/品牌
  /(?<![一-鿿\w])北七(?![星路街市\w])/u,
  /(?<![一-鿿\w])北爛(?![東西南北\w])/u,
  /\b87\b/,  // 87 是數字，\b 適用
  // === 罵人智力 ===
  /傻[逼B屄]/i, /煞筆/, /沙比/, /白癡/, /智障/, /低能/, /白目/, /蠢[蛋貨豬]/,
  // === 罵人品行 ===
  /狗娘[養]/, /婊子/, /婊[妹姨]/, /賤[人貨種]/, /賤婊/,
  /龜[兒孫]/, /龜兒子/, /王八[蛋羔]/, /鱉孫/,
  // === 詛咒類 ===
  /去死/, /死全家/, /死爸/, /死媽/,
  /滾[蛋開]/, /廢物/, /垃圾/,
  /哭[爸夭枵腰]/,
  // === 性器官辱罵 ===
  /[雞機][巴掰八]/, /屌(?![絲))]|$)/, /[陰幹]屄/, /屄[孔逼]/,
  // === 香港 / 廣東髒話 ===
  /(?:屌|丟)你老母/, /[屌丟](?:佢|你|妳)/, /冚家鏟/, /冚家剷/,
  /仆街/, /死撚/, /臭閪/,
]

const OFFENSIVE_PATTERNS_EN = [
  /\bfuck\s*(you|off|ing|er|ed)?\b/i,
  /\bf[\*\-_@#$%&]+c?k\b/i,                 // f*ck / f**k / f-ck / f@k（規避偽裝）c 為可選
  /\bshit\b/i, /\bsh[\*\-_]+t\b/i,
  /\bbitch\b/i, /\bb[\*\-_]+tch\b/i,
  /\basshole\b/i, /\ba[\*\-_]+hole\b/i,
  /\bdick\s*head\b/i, /\bdickhead\b/i,
  /\bstfu\b/i, /\bgtfo\b/i,
  /\bkill\s+your\s*self\b/i, /\bkys\b/i,
  /\bcunt\b/i, /\btwat\b/i, /\bwanker\b/i, /\bbastard\b/i,
  /\bmotherfucker\b/i, /\bmotherfuckers?\b/i,
  /\bpiss\s+off\b/i,
  /\bbollocks\b/i,
  /\bretard(ed)?\b/i,
]

// ── 無母音英文白名單（常見技術縮寫）──
const NO_VOWEL_WHITELIST = new Set([
  'rwd', 'css', 'html', 'btn', 'cta', 'svg', 'npm', 'url',
  'faq', 'crm', 'cms', 'dns', 'api', 'jwt', 'cdn', 'cli',
  'ssl', 'tls', 'ssh', 'sql', 'php', 'xml', 'yml', 'pdf',
  'rpc', 'tcp', 'udp', 'http', 'https', 'smtp', 'ftp',
  'rgb', 'hsl', 'px', 'rem', 'vw', 'vh', 'ssr', 'ssg',
  'seo', 'pwa', 'mvp', 'crm', 'sdk', 'www', 'ts', 'js',
  'tsx', 'jsx', 'db', 'ux', 'ui', 'pr', 'mr', 'ci', 'cd',
])

function reject(
  quality: InputQualityVerdict,
  confidence: number,
  reason: string,
  isChinese: boolean
): InputQualityResult {
  const messages: Record<InputQualityVerdict, { zh: string; en: string }> = {
    offensive: {
      zh: '請文明使用 Tellcraft。如果您有建站需求，請描述您想建立的網站。',
      en: 'Please use Tellcraft respectfully. If you have a project, describe the website you\'d like to build.',
    },
    gibberish: {
      zh: '無法理解您的輸入。請用正常語句描述您的需求',
      en: 'I couldn\'t understand your input. Please describe your request clearly, e.g. "Build a restaurant website"',
    },
    spam: {
      zh: '請輸入有效的文字內容。',
      en: 'Please enter valid text content.',
    },
    valid: { zh: '', en: '' },
  }
  return {
    quality,
    confidence,
    reason,
    userMessage: isChinese ? messages[quality].zh : messages[quality].en,
  }
}

function checkOffensive(message: string, isChinese: boolean): InputQualityResult | null {
  for (const p of OFFENSIVE_PATTERNS_ZH) {
    if (p.test(message)) {
      return reject('offensive', 0.95, `zh pattern: ${p}`, isChinese)
    }
  }
  for (const p of OFFENSIVE_PATTERNS_EN) {
    if (p.test(message)) {
      return reject('offensive', 0.95, `en pattern: ${p}`, isChinese)
    }
  }
  return null
}

function checkGibberish(message: string, strictness: QualityStrictness, isChinese: boolean): InputQualityResult | null {
  const trimmed = message.trim()

  // 單字元/雙字元不在這裡處理（可能是有意義的短回覆如 A/B/好）
  if (trimmed.length <= 2) return null

  // G1: 全同字元重複（中文 ≥4 才算，英文 ≥3）
  const sameCharMatch = trimmed.match(/^(.)\1+$/)
  if (sameCharMatch) {
    const char = sameCharMatch[1]
    const threshold = /[\u4e00-\u9fff]/.test(char) ? 3 : 2  // 中文 4 字（index 3），英文 3 字（index 2）
    if (trimmed.length > threshold) {
      return reject('gibberish', 0.95, `G1: repeated char '${char}' ×${trimmed.length}`, isChinese)
    }
  }

  // G2: 短模式重複 ≥3 次（1-3 字元模式，如 sdsd, WE2E2E2E）
  for (let patLen = 1; patLen <= 3; patLen++) {
    if (trimmed.length < patLen * 3) continue
    const pat = trimmed.slice(0, patLen)
    const repeated = pat.repeat(Math.ceil(trimmed.length / patLen)).slice(0, trimmed.length)
    if (repeated === trimmed && trimmed.length / patLen >= 3) {
      return reject('gibberish', 0.9, `G2: pattern '${pat}' repeated ${Math.floor(trimmed.length / patLen)}×`, isChinese)
    }
  }

  // G2b: 去除標點/空格後的子模式重複（捕捉 "0.0.0.0.0" → core "00000000"）
  const corePunctStripped = trimmed.replace(/[\s.,!?;:。，！？、；：\-_=+'"…`~()（）[\]{}|\\/<>@#$%^&*]+/g, '')
  if (corePunctStripped.length >= 3) {
    for (let patLen = 1; patLen <= 3; patLen++) {
      if (corePunctStripped.length < patLen * 3) continue
      const pat = corePunctStripped.slice(0, patLen)
      const repeated = pat.repeat(Math.ceil(corePunctStripped.length / patLen)).slice(0, corePunctStripped.length)
      if (repeated === corePunctStripped && corePunctStripped.length / patLen >= 3) {
        return reject('gibberish', 0.85, `G2b: stripped pattern '${pat}' repeated`, isChinese)
      }
    }
  }

  // G2c: 中文夾雜亂碼拉丁字母（如 "我要BBBCCCAAA"）— strict only
  if (strictness === 'strict') {
    const latinPart = trimmed.replace(/[^a-zA-Z]/g, '')
    if (latinPart.length >= 4) {
      const uniqueChars = new Set(latinPart.toLowerCase()).size
      // unique ratio 過低表示重複填充（如 "BBBCCCAAA" unique=3, ratio=0.33）
      if (uniqueChars / latinPart.length < 0.4) {
        return reject('gibberish', 0.8, `G2c: low latin unique ratio ${(uniqueChars / latinPart.length).toFixed(2)} in '${latinPart}'`, isChinese)
      }
    }
  }

  // 以下規則只對純拉丁字母（可含數字）有效
  const latinOnly = /^[a-zA-Z0-9]+$/.test(trimmed)
  if (!latinOnly) return null

  const letters = trimmed.replace(/[^a-zA-Z]/g, '')
  if (letters.length < 3) return null

  const lower = letters.toLowerCase()

  // G3: 純拉丁 ≥4 字無母音（白名單排除）
  if (letters.length >= 4 && !/[aeiou]/i.test(letters)) {
    if (!NO_VOWEL_WHITELIST.has(lower)) {
      return reject('gibberish', 0.9, `G3: no vowels in '${trimmed}'`, isChinese)
    }
  }

  // G4: unique_chars/total_chars 過低
  const uniqueChars = new Set(lower).size
  const ratio = uniqueChars / lower.length
  const ratioThreshold = strictness === 'strict' ? 0.35 : 0.25
  if (lower.length >= 6 && ratio < ratioThreshold) {
    return reject('gibberish', 0.85, `G4: char ratio ${ratio.toFixed(2)} < ${ratioThreshold}`, isChinese)
  }

  // G5: 高子音密度（英文）
  if (letters.length >= 6) {
    const consonants = lower.replace(/[aeiou]/g, '')
    const consonantRatio = consonants.length / lower.length
    if (consonantRatio > 0.85) {
      return reject('gibberish', 0.85, `G5: consonant ratio ${consonantRatio.toFixed(2)}`, isChinese)
    }
    // 最長連續子音群 ≥6
    const consonantGroups = lower.split(/[aeiou]+/)
    const longestGroup = Math.max(...consonantGroups.map(g => g.length))
    if (longestGroup >= 6) {
      return reject('gibberish', 0.8, `G5: longest consonant group ${longestGroup}`, isChinese)
    }
  }

  // G6: 混合字符無意義（strict only）— 純英數 3-6 字無母音
  if (strictness === 'strict' && trimmed.length >= 3 && trimmed.length <= 6) {
    if (/^[a-zA-Z0-9]+$/.test(trimmed) && !/[aeiouAEIOU]/.test(trimmed)) {
      if (!NO_VOWEL_WHITELIST.has(lower)) {
        return reject('gibberish', 0.7, `G6: short no-vowel '${trimmed}'`, isChinese)
      }
    }
  }

  return null
}

function checkSpam(message: string, strictness: QualityStrictness, isChinese: boolean): InputQualityResult | null {
  const trimmed = message.trim()

  // 純數字 ≤10 字（lenient 模式跳過，因為可能是選擇版本號等）
  if (strictness !== 'lenient' && /^\d+$/.test(trimmed) && trimmed.length <= 10) {
    return reject('spam', 0.8, `pure digits: '${trimmed}'`, isChinese)
  }

  // 純數字 + 符號（如 "0.0", "1.2.3", "0.0.0.0.0" — 無任何文字）
  if (strictness !== 'lenient' && /^[\d\s.,:;!?=+\-*/()[\]{}|\\/<>@#$%^&_~`'"]+$/.test(trimmed)) {
    return reject('spam', 0.8, `digits and symbols only: '${trimmed}'`, isChinese)
  }

  // 純符號（無任何文字或數字）
  if (/^[^\w\u4e00-\u9fff\u3400-\u4dbf]+$/.test(trimmed) && trimmed.length > 1) {
    return reject('spam', 0.85, `pure symbols`, isChinese)
  }

  return null
}

/**
 * 輸入品質檢測（純規則式，零 LLM）
 *
 * 執行順序：offensive → gibberish → spam → valid
 */
export function checkInputQuality(message: string, strictness: QualityStrictness = 'normal', locale?: 'zh' | 'en'): InputQualityResult {
  const trimmed = message.trim()
  if (!trimmed) return { quality: 'valid', confidence: 1 }

  // locale 有傳就用（用戶偏好），否則 fallback 到訊息內容偵測
  // 亂碼是純拉丁字母時偵測會 fallback 到英文，但用戶可能是中文用戶
  const isChinese = locale ? locale === 'zh' : /[\u4e00-\u9fff\u3400-\u4dbf]/.test(trimmed)

  // 1. 髒話
  const offensiveResult = checkOffensive(trimmed, isChinese)
  if (offensiveResult) return offensiveResult

  // 2. 亂碼
  const gibberishResult = checkGibberish(trimmed, strictness, isChinese)
  if (gibberishResult) return gibberishResult

  // 3. 垃圾
  const spamResult = checkSpam(trimmed, strictness, isChinese)
  if (spamResult) return spamResult

  return { quality: 'valid', confidence: 1 }
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
  // Layer 0: 「做/建 + 任意詞(1-15字) + 網站/官網/網頁/頁面」→ 直接放行（含 typo，零成本）
  const BUILD_PATTERN = /(?:做|建|幫我做|建立|打造|製作|開發|做一個|建一個).{1,15}(?:網站|官網|網頁|頁面)/
  if (BUILD_PATTERN.test(message)) {
    return { relevant: true }
  }

  const lower = message.toLowerCase()
  const isChinese = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(message)

  // Layer 1: 強信號 → 直接放行（有產業/產品類型 = 夠具體）
  if (STRONG_SIGNALS.some(kw => lower.includes(kw))) {
    return { relevant: true }
  }

  const hasWeakSignal = WEAK_SIGNALS.some(kw => lower.includes(kw))

  // Layer 2/3: 弱信號或無信號 → 微型 Haiku 判斷（相關性 + 具體性）
  const RelevanceSchema = z.object({
    relevant: z.boolean(),
    vague: z.boolean().nullable(),
    policy: z.enum(['harmful', 'illegal', 'adult', 'hate', 'privacy']).nullable(),
  })

  try {
    const systemPrompt = hasWeakSignal
      ? `用戶想用介面建站工具。判斷描述是否具體到能知道「建什麼類型的網站」。同時檢查內容是否涉及有害/非法/成人/仇恨/隱私侵犯（正常的醫療資訊網站是允許的，只有診斷/測驗工具才算有害）。

具體的例子（→ relevant=true）：
- 有產業詞：「做咖啡廳網站」「餐廳訂位系統」「健身房官網」「卡啡廳網站」（含錯字也算）
- 有功能描述：「有菜單和預約的網站」「電商購物平台」
- 有產品類型：「個人作品集」「SaaS landing page」
- 即使有錯字或縮寫，只要能辨識產業/功能 = 具體

模糊的例子（→ relevant=true, vague=true）：
- 純泛用：「做一個很酷的網站」「建一個網頁」「做個很棒的東西」
- 完全不知道建什麼：「做一個」「建立一個系統」（沒有領域詞）

回覆 JSON:
- 夠具體：{"relevant":true,"vague":null,"policy":null}
- 相關但太模糊：{"relevant":true,"vague":true,"policy":null}
- 與建網站無關：{"relevant":false,"vague":null,"policy":null}
- 內容不當：{"relevant":false,"vague":null,"policy":"harmful"}`
      : '判斷用戶訊息是否與「建立網站/應用/數位產品」相關。同時檢查內容是否涉及有害/非法/成人/仇恨/隱私侵犯。回覆 JSON: {"relevant":true,"vague":null,"policy":null} 或 {"relevant":false,"vague":null,"policy":null} 或 {"relevant":false,"vague":null,"policy":"harmful"}'

    const result = await callStructured({
      schema: RelevanceSchema,
      model: MODEL.HAIKU,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
      maxTokens: 100,
      purpose: 'fast_mode_relevance_check',
      trackingContext: context,
    })

    if (!result.success) {
      logger.warn({ error: result.error }, '相關性檢查失敗，降級放行（fail-open）')
      return { relevant: true }
    }

    const parsed = result.data

    // 內容不當 → 拒絕（Content Policy）
    if (parsed.policy) {
      return {
        relevant: false,
        errorMessage: isChinese
          ? '抱歉，Tellcraft 無法協助建立此類內容。請描述一個合適的網站需求。'
          : 'Sorry, Tellcraft cannot assist with this type of content. Please describe an appropriate website.',
      }
    }

    // 不相關 → 拒絕
    if (parsed.relevant === false) {
      return {
        relevant: false,
        errorMessage: isChinese
          ? '這個需求似乎與建立網站無關。Tellcraft 專門用於介面建站。\n\n請描述您想建立的網站或應用，例如：「做一個咖啡店官網」、「建立一個作品集網站」'
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
    logger.error({ err }, '相關性檢查失敗，降級放行（fail-open）')
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
    logger.warn({ userId, count }, '違規記錄')

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
    logger.error({ err }, '違規記錄失敗（降級跳過）')
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
  redis: Redis,
  locale?: 'zh' | 'en'
): Promise<PrefilterResult> {
  const isChinese = locale ? locale === 'zh' : /[\u4e00-\u9fff\u3400-\u4dbf]/.test(message)

  // 0. 冷卻期檢查（違規累計觸發的暫停）
  const cooldownTtl = await checkCooldown(userId, redis)
  if (cooldownTtl > 0) {
    recordTelemetry({
      skillName: 'prefilter', eventType: 'prefilter_antiloop',
      patternKey: 'cooldown_active', outcome: 'blocked', phase: 'prefilter',
      userId, payload: { cooldownTtl },
    }).catch(() => {})
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
      logger.warn({ userId, pattern: String(pattern) }, 'Prompt injection 偵測')
      recordTelemetry({
        skillName: 'prefilter', eventType: 'prefilter_reject',
        patternKey: 'injection', outcome: 'blocked', phase: 'prefilter',
        userId, severity: 'critical',
      }).catch(() => {})
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

  // 3.5 輸入品質（亂碼 + 髒話 + 垃圾）
  const qualityResult = checkInputQuality(trimmed, 'normal', isChinese ? 'zh' : 'en')
  if (qualityResult.quality !== 'valid') {
    logger.warn({ userId, quality: qualityResult.quality, reason: qualityResult.reason }, '品質攔截')
    recordTelemetry({
      skillName: 'prefilter', eventType: 'prefilter_reject',
      patternKey: qualityResult.quality, outcome: 'blocked', phase: 'prefilter',
      userId, payload: { reason: qualityResult.reason, locale },
    }).catch(() => {})
    if (qualityResult.quality === 'offensive') {
      const cooldown = await recordViolation(userId, redis)
      const cooldownWarning = cooldown > 0
        ? (isChinese ? `\n\n⚠️ 由於多次違規，您的帳號已被暫停 ${Math.ceil(cooldown / 60)} 分鐘。` : `\n\n⚠️ Due to repeated violations, your account has been suspended for ${Math.ceil(cooldown / 60)} minute${Math.ceil(cooldown / 60) > 1 ? 's' : ''}.`)
        : ''
      return {
        allowed: false,
        reason: 'offensive',
        errorMessage: (qualityResult.userMessage || '') + cooldownWarning,
      }
    }
    return {
      allowed: false,
      reason: qualityResult.quality as PrefilterResult['reason'],
      errorMessage: qualityResult.userMessage,
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
    logger.error({ err }, 'Rate limit 檢查失敗（降級放行）')
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
