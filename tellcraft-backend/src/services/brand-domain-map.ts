/**
 * Brand Domain Map — 把用戶 URL / 自然語言裡的品牌名映射到 awesome-design-md 的 brandKey。
 *
 * 兩張表：
 *   - DOMAIN_TO_BRAND：完整域名（含子域處理由 parseAndNormalizeDomain 統一規範化後查詢）
 *   - TEXT_ALIAS_TO_BRAND：用戶自然語言「像 Stripe」「Notion 風格」時的詞匹配
 *
 * brandKey 必須與 external/awesome-design-md/design-md/{brandKey}/ 目錄名完全一致。
 *
 * 維護指南：
 *   - 新增品牌時兩張表都要補（domain 命中走 URL 路徑、text alias 命中走純文字路徑）
 *   - 別名小心衝突：例如 "meta" 太短易誤觸發 → 加 word boundary + 配合上下文判斷
 *   - 命中失敗不退化（reference-analyzer 走原 puppeteer），所以漏字段是 fail-soft
 */

/**
 * 域名 → brandKey 對映。Key 必須是 normalized 後的 hostname（去 www、lowercase）。
 *
 * 涵蓋規則：
 *   1. 主要域名（{brand}.com / {brand}.app / {brand}.io 等）
 *   2. 對應產品線次要域名（apple.com → 'apple'、developer.apple.com 由 parseAndNormalizeDomain 自動命中）
 */
export const DOMAIN_TO_BRAND: Readonly<Record<string, string>> = Object.freeze({
  // SaaS / Dev tools
  'airtable.com': 'airtable',
  'cal.com': 'cal',
  'claude.ai': 'claude',
  'anthropic.com': 'claude',
  'clay.com': 'clay',
  'clickhouse.com': 'clickhouse',
  'cohere.com': 'cohere',
  'cohere.ai': 'cohere',
  'composio.dev': 'composio',
  'cursor.com': 'cursor',
  'cursor.sh': 'cursor',
  'elevenlabs.io': 'elevenlabs',
  'expo.dev': 'expo',
  'figma.com': 'figma',
  'framer.com': 'framer',
  'hashicorp.com': 'hashicorp',
  'intercom.com': 'intercom',
  'linear.app': 'linear.app',
  'lovable.dev': 'lovable',
  'minimax.io': 'minimax',
  'mintlify.com': 'mintlify',
  'miro.com': 'miro',
  'mistral.ai': 'mistral.ai',
  'mongodb.com': 'mongodb',
  'notion.com': 'notion',
  'notion.so': 'notion',
  'ollama.com': 'ollama',
  'opencode.ai': 'opencode.ai',
  'posthog.com': 'posthog',
  'raycast.com': 'raycast',
  'replicate.com': 'replicate',
  'resend.com': 'resend',
  'runwayml.com': 'runwayml',
  'sanity.io': 'sanity',
  'sentry.io': 'sentry',
  'shopify.com': 'shopify',
  'slack.com': 'slack',
  'stripe.com': 'stripe',
  'supabase.com': 'supabase',
  'superhuman.com': 'superhuman',
  'together.ai': 'together.ai',
  'vercel.com': 'vercel',
  'voltagent.dev': 'voltagent',
  'warp.dev': 'warp',
  'webflow.com': 'webflow',
  'wise.com': 'wise',
  'x.ai': 'x.ai',
  'zapier.com': 'zapier',

  // AI / LLM
  'meta.ai': 'meta',
  'meta.com': 'meta',
  'nvidia.com': 'nvidia',

  // Consumer / Travel
  'airbnb.com': 'airbnb',
  'apple.com': 'apple',
  'pinterest.com': 'pinterest',
  'spotify.com': 'spotify',
  'uber.com': 'uber',

  // Finance / Crypto
  'binance.com': 'binance',
  'coinbase.com': 'coinbase',
  'kraken.com': 'kraken',
  'mastercard.com': 'mastercard',
  'revolut.com': 'revolut',

  // Auto
  'bmw.com': 'bmw',
  'bmwusa.com': 'bmw',
  'bmw-m.com': 'bmw-m',
  'm.bmw.com': 'bmw-m',
  'bugatti.com': 'bugatti',
  'ferrari.com': 'ferrari',
  'lamborghini.com': 'lamborghini',
  'renault.com': 'renault',
  'tesla.com': 'tesla',

  // Lifestyle / Brand
  'nike.com': 'nike',
  'starbucks.com': 'starbucks',
  'vodafone.com': 'vodafone',

  // Media / Console
  'playstation.com': 'playstation',
  'spacex.com': 'spacex',
  'theverge.com': 'theverge',
  'wired.com': 'wired',

  // Enterprise
  'ibm.com': 'ibm',
})

/**
 * 文字別名 → brandKey。匹配時用 word boundary 避免 "meta" 誤觸發 "metadata"。
 *
 * 設計選擇：
 *   - 大小寫不敏感（呼叫端先 .toLowerCase()）
 *   - 只匹配整個英文詞，不做模糊比對
 *   - 多個品牌名同時出現時 inferBrandFromText 必須 return null（避免「Stripe vs Linear 哪個」誤判）
 */
export const TEXT_ALIAS_TO_BRAND: Readonly<Record<string, string>> = Object.freeze({
  airbnb: 'airbnb',
  airtable: 'airtable',
  apple: 'apple',
  binance: 'binance',
  bmw: 'bmw',
  bugatti: 'bugatti',
  cal: 'cal',
  'cal.com': 'cal',
  claude: 'claude',
  anthropic: 'claude',
  clay: 'clay',
  clickhouse: 'clickhouse',
  cohere: 'cohere',
  coinbase: 'coinbase',
  composio: 'composio',
  cursor: 'cursor',
  elevenlabs: 'elevenlabs',
  expo: 'expo',
  ferrari: 'ferrari',
  figma: 'figma',
  framer: 'framer',
  hashicorp: 'hashicorp',
  ibm: 'ibm',
  intercom: 'intercom',
  kraken: 'kraken',
  lamborghini: 'lamborghini',
  linear: 'linear.app',
  lovable: 'lovable',
  mastercard: 'mastercard',
  meta: 'meta',
  minimax: 'minimax',
  mintlify: 'mintlify',
  miro: 'miro',
  mistral: 'mistral.ai',
  mongodb: 'mongodb',
  nike: 'nike',
  notion: 'notion',
  nvidia: 'nvidia',
  ollama: 'ollama',
  opencode: 'opencode.ai',
  pinterest: 'pinterest',
  playstation: 'playstation',
  posthog: 'posthog',
  raycast: 'raycast',
  renault: 'renault',
  replicate: 'replicate',
  resend: 'resend',
  revolut: 'revolut',
  runway: 'runwayml',
  runwayml: 'runwayml',
  sanity: 'sanity',
  sentry: 'sentry',
  shopify: 'shopify',
  slack: 'slack',
  spacex: 'spacex',
  spotify: 'spotify',
  starbucks: 'starbucks',
  stripe: 'stripe',
  supabase: 'supabase',
  superhuman: 'superhuman',
  tesla: 'tesla',
  verge: 'theverge',
  uber: 'uber',
  vercel: 'vercel',
  vodafone: 'vodafone',
  voltagent: 'voltagent',
  warp: 'warp',
  webflow: 'webflow',
  wired: 'wired',
  wise: 'wise',
  zapier: 'zapier',
  // 「together」太常見會誤觸發（"work together"），只匹配 together.ai
  'together.ai': 'together.ai',
  // 「x」單字無法當別名，只匹配 x.ai 或 xai
  'x.ai': 'x.ai',
  xai: 'x.ai',
  // bmw-m 與 bmw 在自然語言難以區分，只走 URL 路徑（m.bmw.com）
})

/**
 * 規範化 hostname：lowercase + 去 www. + 多層子域則嘗試精確命中後降級到 SLD+TLD。
 *
 * 例：
 *   - https://www.stripe.com/pricing  → 'stripe.com'
 *   - https://blog.stripe.com         → 先試 'blog.stripe.com'（沒命中）→ 降到 'stripe.com'
 *   - https://docs.figma.com          → 先試 'docs.figma.com' → 降到 'figma.com'
 *   - https://m.bmw.com               → 命中 'm.bmw.com' → 'bmw-m'（特殊配對）
 *
 * 不直接傳 SLD+TLD 因為 m.bmw.com 與 bmw.com 對應不同 brandKey。
 */
export function parseAndNormalizeDomain(url: string): { full: string; sld: string } | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) return null
  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '')
  if (!hostname || !hostname.includes('.')) return null
  // 取最後兩段為 SLD+TLD，例外處理 .co.uk / .com.tw 等雙段 TLD
  const parts = hostname.split('.')
  let sld: string
  if (parts.length >= 3 && /^(com|co|org|net|gov|edu|ac)$/.test(parts[parts.length - 2])) {
    sld = parts.slice(-3).join('.')
  } else {
    sld = parts.slice(-2).join('.')
  }
  return { full: hostname, sld }
}

/**
 * 從 URL 找對應 brandKey。先試完整 hostname 再降級到 SLD+TLD。
 */
export function lookupBrandByDomain(url: string): string | null {
  const norm = parseAndNormalizeDomain(url)
  if (!norm) return null
  return DOMAIN_TO_BRAND[norm.full] ?? DOMAIN_TO_BRAND[norm.sld] ?? null
}

/**
 * 從自然語言推斷 brand。零 LLM，純 word boundary 比對。
 *
 * 安全規則：
 *   - 多個不同 brand 同時出現 → return null（避免「Stripe vs Linear 哪個」誤判）
 *   - 整個輸入要包含 word boundary 形式的 alias（避免 "metadata" 命中 "meta"）
 */
export function inferBrandFromText(text: string): string | null {
  const lower = text.toLowerCase()
  const matched = new Set<string>()
  for (const [alias, brand] of Object.entries(TEXT_ALIAS_TO_BRAND)) {
    const re = new RegExp(`(?:^|[^a-z0-9])${alias.replace(/\./g, '\\.')}(?:[^a-z0-9]|$)`, 'i')
    if (re.test(lower)) matched.add(brand)
  }
  if (matched.size === 1) {
    return matched.values().next().value as string
  }
  return null
}
