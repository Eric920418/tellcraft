/**
 * Image Library Service
 *
 * 根據 productType 從 Unsplash Search API 預抓 6 類相關圖，快取 Redis 7 天。
 * UIUX/Fast Build/Clone 生成前注入 dynamic prompt 白名單，LLM 只能從清單挑。
 * 無 API key / rate limit / 網路錯誤 → 降級回 picsum seed（永不阻塞 pipeline）。
 *
 * 法律義務（Unsplash ToS）：
 *  - photographer profileUrl 帶 utm_source=tellcraft&utm_medium=referral
 *  - 實際使用的照片由 deployer 掃代碼後注入 ImageCredits 組件
 *  - download_location 由 deployer fire-and-forget trigger（部署時而非預抓時）
 */

import { z } from 'zod'
import { cached, invalidateCache } from '../lib/cache'
import { getEnv } from '../lib/env'
import { createLogger } from '../lib/logger'
import { MODEL } from '../lib/anthropic'
import { callStructured } from '../lib/structured-output'

const logger = createLogger('image-library')

// ============================================================
// 型別
// ============================================================

export const ImageAssetSchema = z.object({
  url: z.string().url(),
  rawUrl: z.string().url(),
  width: z.number().int(),
  height: z.number().int(),
  alt: z.string(),
  category: z.enum(['hero', 'product', 'team', 'background', 'lifestyle', 'detail']),
  photographer: z.object({
    name: z.string(),
    profileUrl: z.string().url(),
  }),
  sourceId: z.string(),
  downloadLocation: z.string(),
})
export type ImageAsset = z.infer<typeof ImageAssetSchema>

export const ImageLibrarySchema = z.object({
  productType: z.string(),
  generatedAt: z.number(),
  hero: z.array(ImageAssetSchema),
  product: z.array(ImageAssetSchema),
  team: z.array(ImageAssetSchema),
  background: z.array(ImageAssetSchema),
  lifestyle: z.array(ImageAssetSchema),
  detail: z.array(ImageAssetSchema),
  source: z.enum(['unsplash', 'picsum_fallback']),
})
export type ImageLibrary = z.infer<typeof ImageLibrarySchema>

export type ImageCategory = ImageAsset['category']

const ALL_CATEGORIES: ImageCategory[] = [
  'hero',
  'product',
  'team',
  'background',
  'lifestyle',
  'detail',
]

// ============================================================
// 尺寸規格（對應 CATEGORY）
// ============================================================

const CATEGORY_SIZES: Record<ImageCategory, [number, number]> = {
  hero: [1280, 720],
  background: [1920, 1080],
  product: [800, 600],
  lifestyle: [800, 600],
  detail: [600, 600],
  team: [400, 400],
}

// 每類目標張數（多 query 合併後去重、截斷）
const CATEGORY_TARGET_COUNT: Record<ImageCategory, number> = {
  hero: 5,
  product: 10,
  team: 5,
  background: 3,
  lifestyle: 6,
  detail: 5,
}

// ============================================================
// productType → Unsplash query 字典
// （對應 fast-build-generation.ts PRODUCT_TYPE_RULES 的 26 個 type）
// ============================================================

type QuerySet = Record<ImageCategory, string[]>

const DEFAULT_QUERIES: QuerySet = {
  hero: ['modern business', 'professional workspace'],
  product: ['product display', 'object minimal'],
  team: ['professional portrait', 'business team'],
  background: ['abstract gradient', 'minimal texture'],
  lifestyle: ['people lifestyle', 'modern life'],
  detail: ['minimal object closeup', 'clean details'],
}

const PRODUCTTYPE_TO_UNSPLASH_QUERIES: Record<string, QuerySet> = {
  restaurant: {
    hero: ['restaurant interior', 'cozy dining room'],
    product: ['gourmet dish', 'plated food', 'asian cuisine'],
    team: ['chef portrait', 'restaurant staff'],
    background: ['dark wood texture', 'kitchen ambience'],
    lifestyle: ['people dining', 'family dinner'],
    detail: ['ingredients closeup', 'fresh herbs'],
  },
  cafe: {
    hero: ['coffee shop interior', 'cafe morning light'],
    product: ['latte art', 'pastry flat lay', 'artisan coffee'],
    team: ['barista at work', 'cafe owner'],
    background: ['coffee beans texture', 'cafe wood table'],
    lifestyle: ['people in cafe', 'cafe working'],
    detail: ['espresso pour', 'croissant closeup'],
  },
  fitness: {
    hero: ['modern gym interior', 'fitness studio'],
    product: ['gym equipment', 'yoga mat setup', 'dumbbells'],
    team: ['personal trainer portrait', 'fitness coach'],
    background: ['dark gym texture', 'athletic surface'],
    lifestyle: ['people working out', 'yoga class'],
    detail: ['running shoes', 'workout gear closeup'],
  },
  healthcare: {
    hero: ['modern clinic interior', 'hospital lobby'],
    product: ['medical equipment', 'wellness therapy'],
    team: ['doctor portrait', 'medical team'],
    background: ['clean minimal medical', 'soft blue gradient'],
    lifestyle: ['patient consultation', 'family healthy'],
    detail: ['stethoscope', 'medical tools closeup'],
  },
  legal: {
    hero: ['law office interior', 'professional office'],
    product: ['law books', 'legal documents'],
    team: ['lawyer portrait', 'professional attorney'],
    background: ['wood paneled wall', 'courthouse architecture'],
    lifestyle: ['business handshake', 'professional meeting'],
    detail: ['gavel closeup', 'scales of justice'],
  },
  finance: {
    hero: ['skyscraper business', 'financial district'],
    product: ['charts graphs', 'financial analysis'],
    team: ['financial advisor portrait', 'business professional'],
    background: ['glass building', 'office abstract'],
    lifestyle: ['people finance meeting', 'business workshop'],
    detail: ['calculator pen', 'finance documents closeup'],
  },
  realestate: {
    hero: ['modern house exterior', 'luxury living room'],
    product: ['apartment interior', 'house for sale', 'modern kitchen'],
    team: ['realtor portrait', 'professional agent'],
    background: ['architectural detail', 'minimal interior'],
    lifestyle: ['family home', 'people house tour'],
    detail: ['house keys', 'real estate signage'],
  },
  salon: {
    hero: ['modern salon interior', 'spa room'],
    product: ['hair styling tools', 'manicure setup', 'skincare products'],
    team: ['stylist portrait', 'beautician'],
    background: ['marble texture', 'soft pink pastel'],
    lifestyle: ['hair cut service', 'spa relaxation'],
    detail: ['nail polish closeup', 'makeup brushes'],
  },
  wedding: {
    hero: ['ceremony venue', 'wedding reception elegant'],
    product: ['bridal bouquet', 'wedding cake', 'ring box'],
    team: ['wedding planner portrait', 'couple elegant'],
    background: ['romantic florals', 'soft gold texture'],
    lifestyle: ['wedding guests', 'bride getting ready'],
    detail: ['wedding rings', 'flower details'],
  },
  photography: {
    hero: ['dramatic landscape', 'portrait studio light'],
    product: ['camera on tripod', 'photography gear'],
    team: ['photographer portrait', 'artist with camera'],
    background: ['black minimal texture', 'film grain'],
    lifestyle: ['photographer at work', 'outdoor photography'],
    detail: ['camera lens closeup', 'film strip'],
  },
  music: {
    hero: ['concert stage lights', 'music venue'],
    product: ['vinyl records', 'studio microphone', 'instruments'],
    team: ['musician portrait', 'band on stage'],
    background: ['dark music venue', 'audio waves abstract'],
    lifestyle: ['concert crowd', 'people listening music'],
    detail: ['guitar strings', 'headphones closeup'],
  },
  hotel: {
    hero: ['luxury hotel room', 'hotel lobby'],
    product: ['resort pool', 'hotel bed suite', 'spa bath'],
    team: ['hotel staff portrait', 'concierge'],
    background: ['palm tree tropical', 'marble lobby'],
    lifestyle: ['people vacation', 'hotel breakfast'],
    detail: ['room service tray', 'towel arrangement'],
  },
  travel: {
    hero: ['tropical beach', 'mountain vista', 'city skyline'],
    product: ['travel backpack', 'suitcase', 'map compass'],
    team: ['tour guide portrait', 'traveler'],
    background: ['airplane window view', 'horizon landscape'],
    lifestyle: ['people exploring', 'backpacker journey'],
    detail: ['passport stamp', 'travel accessories'],
  },
  agency: {
    hero: ['modern office space', 'creative studio'],
    product: ['team meeting whiteboard', 'brainstorm session', 'creative work'],
    team: ['creative professional portrait', 'agency team'],
    background: ['minimal office texture', 'glass wall office'],
    lifestyle: ['people collaborating', 'office presentation'],
    detail: ['laptop desk setup', 'sticky notes wall'],
  },
  nonprofit: {
    hero: ['community volunteers', 'helping hands'],
    product: ['charity donation', 'community event'],
    team: ['volunteer portrait', 'team helping'],
    background: ['nature green leaves', 'soft warm texture'],
    lifestyle: ['people volunteering', 'community gathering'],
    detail: ['hands together', 'heart care gesture'],
  },
  retail: {
    hero: ['boutique interior', 'modern retail store'],
    product: ['shelf display', 'shopping bags', 'window display'],
    team: ['shop owner portrait', 'retail assistant'],
    background: ['store neutral texture', 'minimal retail'],
    lifestyle: ['people shopping', 'trying clothes'],
    detail: ['price tag closeup', 'product arrangement'],
  },
  education: {
    hero: ['modern classroom', 'library books'],
    product: ['textbooks stack', 'writing desk setup'],
    team: ['teacher portrait', 'student studying'],
    background: ['blackboard texture', 'library wall'],
    lifestyle: ['students learning', 'group study'],
    detail: ['pen notebook closeup', 'hand writing'],
  },
  event: {
    hero: ['concert crowd', 'festival stage lights'],
    product: ['event stage', 'party decorations'],
    team: ['event organizer portrait', 'performer'],
    background: ['confetti celebration', 'neon lights abstract'],
    lifestyle: ['people celebrating', 'dancing crowd'],
    detail: ['stage light closeup', 'microphone detail'],
  },
  tool: {
    hero: ['minimal workspace', 'clean desk setup'],
    product: ['productivity app screen', 'laptop minimal'],
    team: ['person working laptop', 'developer at desk'],
    background: ['white minimal texture', 'soft gradient'],
    lifestyle: ['people focused work', 'digital productivity'],
    detail: ['keyboard closeup', 'pen on notebook'],
  },
  portfolio: {
    hero: ['creative studio', 'designer workspace'],
    product: ['design mockups', 'typography posters'],
    team: ['creative portrait', 'designer working'],
    background: ['minimal art gallery', 'soft paper texture'],
    lifestyle: ['artist at work', 'creative process'],
    detail: ['sketchbook pen', 'design details closeup'],
  },
  blog: {
    hero: ['writing desk', 'cozy reading nook'],
    product: ['coffee and book', 'notebook pen', 'laptop writing'],
    team: ['writer portrait', 'blogger at work'],
    background: ['paper texture vintage', 'soft warm light'],
    lifestyle: ['person reading', 'thoughtful writing'],
    detail: ['fountain pen closeup', 'journal page'],
  },
  dashboard: {
    hero: ['analytics screen', 'data visualization'],
    product: ['charts dashboard', 'control room screens', 'data interface'],
    team: ['analyst working portrait', 'team data meeting'],
    background: ['dark tech abstract', 'grid pattern'],
    lifestyle: ['people reviewing data', 'monitor setup work'],
    detail: ['chart closeup', 'keyboard data'],
  },
  saas: {
    hero: ['laptop screen modern', 'tech workspace'],
    product: ['software interface', 'clean app screen'],
    team: ['startup team portrait', 'founder working'],
    background: ['abstract blue tech', 'gradient purple tech'],
    lifestyle: ['people coding', 'remote collaboration'],
    detail: ['screen interface closeup', 'code display'],
  },
  ecommerce: {
    hero: ['modern product photography', 'lifestyle shopping scene'],
    product: ['product flat lay', 'fashion minimal product', 'e-commerce goods'],
    team: ['customer service portrait', 'packaging staff'],
    background: ['white product background', 'marble surface'],
    lifestyle: ['online shopping', 'delivery parcel'],
    detail: ['gift wrapping', 'product packaging detail'],
  },
  landing: {
    hero: ['abstract gradient blue', 'modern technology workspace'],
    product: ['app on laptop', 'product screen mockup'],
    team: ['team professional portrait', 'startup meeting'],
    background: ['geometric minimal', 'soft gradient pastel'],
    lifestyle: ['people using laptop', 'creative workspace'],
    detail: ['minimal icon closeup', 'interface detail'],
  },
  personal: {
    hero: ['lifestyle portrait', 'creative personal space'],
    product: ['personal items flat lay', 'notebook phone'],
    team: ['professional portrait', 'lifestyle headshot'],
    background: ['soft neutral texture', 'minimal pastel'],
    lifestyle: ['person lifestyle', 'casual daily'],
    detail: ['hands with camera', 'personal journal'],
  },
}

// ============================================================
// Haiku 專案上下文 → 英文 Unsplash queries（取代 PRODUCTTYPE_TO_UNSPLASH_QUERIES）
// Haiku 失敗時 caller 降級回靜態字典
// ============================================================

export interface QueryGenContext {
  /** 粗分類（fallback 兜底 + Haiku coarse hint） */
  productType: string
  /** 主要語意訊號（caller 選最佳來源：expandedPrompt / bddSpec.title+description / referenceAnalysis.visionAnalysis） */
  primaryDescription: string
  /** UIUX 變體名稱（例：「簡約奶油白」） */
  variantConceptName?: string
  /** UIUX 變體情緒（例：「warm, elegant, editorial」） */
  variantConceptMood?: string
  /** 參考網站 / 圖片 Vision 分析摘要（caller 傳入前**毋需**清理，內部會 sanitize） */
  referenceAnalysisSummary?: string
  /** 8 種 Design Mood 預設之一（非 hex code） */
  designMood?: string
}

/** 清理 reference summary：去除換行 + 截斷 300 字元，防 prompt 挾持 */
function sanitizeReferenceSummary(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, 300)
}

const QueryOutputSchema = z.object({
  hero: z.array(z.string().min(2).max(40)).min(2).max(3),
  product: z.array(z.string().min(2).max(40)).min(2).max(3),
  team: z.array(z.string().min(2).max(40)).min(2).max(3),
  background: z.array(z.string().min(2).max(40)).min(2).max(3),
  lifestyle: z.array(z.string().min(2).max(40)).min(2).max(3),
  detail: z.array(z.string().min(2).max(40)).min(2).max(3),
})

const QUERY_SYSTEM_PROMPT = `You generate English Unsplash search queries tailored to a specific project.

## Rules
1. Output language: ENGLISH ONLY (Unsplash search performs far better on English).
2. Each query: 2-4 words, specific enough to return project-relevant photos.
3. Avoid generic filler ("modern", "professional", "beautiful") unless paired with concrete noun.
4. Reflect the project's real domain (cuisine type, industry specifics, cultural context, aesthetic direction).
5. Six categories, 2-3 queries each:
   - hero: 1280x720 main visual / hero background
   - product: 800x600 product / menu item / service cards
   - team: 400x400 people portraits / staff / customers
   - background: 1920x1080 texture / ambience / section bg
   - lifestyle: 800x600 narrative scenes with people
   - detail: 600x600 close-ups / ingredient / material detail

## Example
Input: productType=restaurant, primaryDescription="Japanese izakaya specializing in yakitori and sake, warm dim lighting"
Output:
{
  "hero": ["izakaya counter night", "yakitori grill smoke"],
  "product": ["yakitori skewers", "sake flight tasting", "japanese small plates"],
  "team": ["izakaya chef portrait", "japanese bartender"],
  "background": ["dark wood japanese texture", "paper lantern glow"],
  "lifestyle": ["friends drinking sake", "izakaya customers laughing"],
  "detail": ["chicken yakitori closeup", "sake pour ceramic cup"]
}

## Anti-example (DO NOT DO)
Input same as above.
Bad output: { "hero": ["restaurant interior"], "product": ["gourmet dish"] }  // too generic, ignores Japanese / yakitori signal`

/**
 * 用 Haiku 把專案真實上下文翻譯成 6 類 × 2-3 個精準英文 Unsplash query
 * 失敗 throw：caller 降級回 PRODUCTTYPE_TO_UNSPLASH_QUERIES
 * 成本：~$0.0005 / 次，~800ms
 */
export async function generateProjectQueries(
  ctx: QueryGenContext,
  trackingContext?: { userId?: string; conversationId?: string },
): Promise<QuerySet> {
  const env = getEnv()
  if (!env.ENABLE_SMART_IMAGE_QUERIES) {
    throw new Error('ENABLE_SMART_IMAGE_QUERIES=false')
  }

  const lines: string[] = [
    `productType: ${ctx.productType}`,
    `primaryDescription: ${ctx.primaryDescription.replace(/\s+/g, ' ').trim().slice(0, 600)}`,
  ]
  if (ctx.variantConceptName) lines.push(`variantConceptName: ${ctx.variantConceptName}`)
  if (ctx.variantConceptMood) lines.push(`variantConceptMood: ${ctx.variantConceptMood}`)
  if (ctx.designMood) lines.push(`designMood: ${ctx.designMood}`)
  if (ctx.referenceAnalysisSummary) {
    lines.push(`referenceAnalysisSummary: ${sanitizeReferenceSummary(ctx.referenceAnalysisSummary)}`)
  }
  const userContent = lines.join('\n')

  const result = await callStructured({
    schema: QueryOutputSchema,
    model: MODEL.HAIKU,
    system: QUERY_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
    maxTokens: 1024,
    temperature: 0.2,
    purpose: 'image_query_generation',
    trackingContext,
  })

  if (!result.success) {
    throw new Error(`generateProjectQueries failed: ${result.error}`)
  }

  return result.data as QuerySet
}

// ============================================================
// Unsplash API client
// ============================================================

const UNSPLASH_API_BASE = 'https://api.unsplash.com'
const UTM_SUFFIX = '?utm_source=tellcraft&utm_medium=referral'

interface UnsplashPhoto {
  id: string
  urls: { raw: string; regular: string; small: string }
  alt_description: string | null
  description: string | null
  width: number
  height: number
  user: {
    name: string
    username: string
    links: { html: string }
  }
  links: {
    html: string
    download_location: string
  }
}

interface UnsplashSearchResponse {
  total: number
  total_pages: number
  results: UnsplashPhoto[]
}

/**
 * 單次搜尋（帶 AbortController 超時）
 * 失敗 throw，由 caller 處理
 */
async function searchUnsplash(query: string, perPage: number): Promise<UnsplashPhoto[]> {
  const env = getEnv()
  if (!env.UNSPLASH_ACCESS_KEY) {
    throw new Error('UNSPLASH_ACCESS_KEY not configured')
  }

  const url = new URL(`${UNSPLASH_API_BASE}/search/photos`)
  url.searchParams.set('query', query)
  url.searchParams.set('per_page', String(perPage))
  url.searchParams.set('orientation', 'landscape')
  url.searchParams.set('order_by', 'relevant')
  url.searchParams.set('content_filter', 'high')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), env.UNSPLASH_API_TIMEOUT_MS)

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1',
      },
      signal: controller.signal,
    })

    if (res.status === 429) {
      throw new Error('Unsplash rate limit exceeded (429)')
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error(`Unsplash auth error (${res.status}) — 檢查 UNSPLASH_ACCESS_KEY`)
    }
    if (!res.ok) {
      throw new Error(`Unsplash HTTP ${res.status}`)
    }

    const data = (await res.json()) as UnsplashSearchResponse
    return data.results ?? []
  } finally {
    clearTimeout(timer)
  }
}

// ============================================================
// URL 格式化
// ============================================================

function formatUnsplashUrl(rawUrl: string, width: number, height: number): string {
  try {
    const u = new URL(rawUrl)
    u.searchParams.set('w', String(width))
    u.searchParams.set('h', String(height))
    u.searchParams.set('fit', 'crop')
    u.searchParams.set('crop', 'entropy')
    u.searchParams.set('q', '80')
    u.searchParams.set('auto', 'format')
    return u.toString()
  } catch {
    return rawUrl
  }
}

function toImageAsset(photo: UnsplashPhoto, category: ImageCategory): ImageAsset {
  const [w, h] = CATEGORY_SIZES[category]
  const altRaw = photo.alt_description || photo.description || `${category} reference`
  const alt = altRaw.replace(/\s+/g, ' ').trim().slice(0, 120)
  const profileUrl = `https://unsplash.com/@${photo.user.username}${UTM_SUFFIX}`
  return {
    url: formatUnsplashUrl(photo.urls.raw, w, h),
    rawUrl: photo.urls.raw,
    width: w,
    height: h,
    alt,
    category,
    photographer: {
      name: photo.user.name,
      profileUrl,
    },
    sourceId: photo.id,
    downloadLocation: photo.links.download_location,
  }
}

// ============================================================
// 核心：fetch library（會 throw）
// ============================================================

export interface FetchImageLibraryOpts {
  locale?: 'zh' | 'en'
  forceRefresh?: boolean
  /** Haiku 專案上下文。傳入則先跑 generateProjectQueries，失敗降級靜態字典 */
  queryContext?: QueryGenContext
  /** cache key scope。通常傳 conversationId；不傳則 fallback 為 productType（legacy pre-warm 相容） */
  cacheKey?: string
  /** LLM usage tracking */
  trackingContext?: { userId?: string; conversationId?: string }
}

/**
 * 從 Unsplash 抓專案相關的 6 類圖庫
 * 優先 Haiku 生專案 query（queryContext 有時），失敗降級 PRODUCTTYPE_TO_UNSPLASH_QUERIES
 * 多 query 合併、按 sourceId 去重、截斷到 CATEGORY_TARGET_COUNT
 * 會 throw：caller 用 getImageLibraryOrFallback 包一層兜底
 */
export async function fetchImageLibrary(
  productType: string,
  opts: FetchImageLibraryOpts = {},
): Promise<ImageLibrary> {
  const env = getEnv()
  if (!env.UNSPLASH_ACCESS_KEY) {
    throw new Error('UNSPLASH_ACCESS_KEY not configured')
  }
  if (!env.ENABLE_UNSPLASH_LIBRARY) {
    throw new Error('ENABLE_UNSPLASH_LIBRARY=false')
  }

  const locale = opts.locale ?? 'en'
  const scope = opts.cacheKey ?? productType
  const cacheKey = `image-lib:v2:${scope}:${locale}`

  if (opts.forceRefresh) {
    await invalidateCache(cacheKey)
  }

  return cached(cacheKey, env.UNSPLASH_CACHE_TTL_SECONDS, async () => {
    // 優先 Haiku 生專案 query；失敗降級靜態字典
    let querySet: QuerySet = PRODUCTTYPE_TO_UNSPLASH_QUERIES[productType] ?? DEFAULT_QUERIES
    if (opts.queryContext) {
      try {
        querySet = await generateProjectQueries(opts.queryContext, opts.trackingContext)
        logger.info({ productType, scope }, 'generateProjectQueries 成功，使用專案級 queries')
      } catch (err) {
        logger.warn({ err, productType, scope }, 'generateProjectQueries 失敗，降級靜態字典')
      }
    }
    const result: Record<ImageCategory, ImageAsset[]> = {
      hero: [],
      product: [],
      team: [],
      background: [],
      lifestyle: [],
      detail: [],
    }
    const seenIds = new Set<string>()

    for (const category of ALL_CATEGORIES) {
      const queries = querySet[category]
      const target = CATEGORY_TARGET_COUNT[category]
      const perQuery = Math.max(8, Math.ceil(target / queries.length) + 3)

      for (const query of queries) {
        if (result[category].length >= target) break
        try {
          const photos = await searchUnsplash(query, perQuery)
          for (const photo of photos) {
            if (seenIds.has(photo.id)) continue
            seenIds.add(photo.id)
            result[category].push(toImageAsset(photo, category))
            if (result[category].length >= target) break
          }
        } catch (err) {
          logger.warn({ err, productType, category, query }, 'Unsplash 搜尋失敗（單 query 跳過）')
        }
      }
    }

    // 至少要有 hero/product 才算成功；否則視為全失敗由 caller 降級
    if (result.hero.length === 0 && result.product.length === 0) {
      throw new Error(`Unsplash library fetch returned empty for productType=${productType}`)
    }

    const library: ImageLibrary = {
      productType,
      generatedAt: Date.now(),
      hero: result.hero,
      product: result.product,
      team: result.team,
      background: result.background,
      lifestyle: result.lifestyle,
      detail: result.detail,
      source: 'unsplash',
    }

    logger.info(
      {
        productType,
        counts: ALL_CATEGORIES.reduce(
          (acc, c) => ({ ...acc, [c]: result[c].length }),
          {} as Record<string, number>,
        ),
      },
      'image library 抓取成功',
    )
    return library
  })
}

// ============================================================
// Picsum fallback
// ============================================================

function mkPicsumAsset(productType: string, category: ImageCategory, index: number): ImageAsset {
  const [w, h] = CATEGORY_SIZES[category]
  const seed = `${productType}-${category}-${index}`
  const url = `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`
  return {
    url,
    rawUrl: url,
    width: w,
    height: h,
    alt: `${productType} ${category} placeholder`,
    category,
    photographer: {
      name: 'Picsum',
      profileUrl: 'https://picsum.photos',
    },
    sourceId: `picsum-${seed}`,
    downloadLocation: '',
  }
}

export function buildPicsumFallbackLibrary(productType: string): ImageLibrary {
  const mkCategory = (cat: ImageCategory, count: number) =>
    Array.from({ length: count }, (_, i) => mkPicsumAsset(productType, cat, i))
  return {
    productType,
    generatedAt: Date.now(),
    hero: mkCategory('hero', 3),
    product: mkCategory('product', 4),
    team: mkCategory('team', 3),
    background: mkCategory('background', 2),
    lifestyle: mkCategory('lifestyle', 4),
    detail: mkCategory('detail', 3),
    source: 'picsum_fallback',
  }
}

// ============================================================
// 永不 throw 的入口（prompt 整合點統一用這個）
// ============================================================

/**
 * 永不 throw。Unsplash 失敗自動降級 picsum library。
 * Prompt 注入點必須用此函數（不要用 fetchImageLibrary 直接接）
 */
export async function getImageLibraryOrFallback(
  productType: string,
  opts: FetchImageLibraryOpts = {},
): Promise<ImageLibrary> {
  const env = getEnv()
  if (!env.UNSPLASH_ACCESS_KEY || !env.ENABLE_UNSPLASH_LIBRARY) {
    return buildPicsumFallbackLibrary(productType)
  }

  try {
    return await fetchImageLibrary(productType, opts)
  } catch (err) {
    logger.warn({ err, productType }, 'Unsplash library 降級 picsum fallback')
    return buildPicsumFallbackLibrary(productType)
  }
}

// ============================================================
// 手動失效
// ============================================================

/**
 * 失效 image library 快取
 * @param scope 通常傳 conversationId（專案級）；legacy pre-warm 路徑傳 productType
 * @param locale cache key 的 locale partition
 */
export async function invalidateImageLibrary(
  scope: string,
  locale: 'zh' | 'en' = 'en',
): Promise<void> {
  await invalidateCache(`image-lib:v2:${scope}:${locale}`)
}

// ============================================================
// Prompt 注入 formatter
// ============================================================

export interface FormatLibraryOpts {
  maxPerCategory?: number
  projectSeed?: string
}

/**
 * 以 seed 做確定性 shuffle（Fisher–Yates + Mulberry32）
 * 同 seed 結果可重現，跨專案分布
 */
function shuffleDeterministic<T>(arr: T[], seed: string): T[] {
  const result = [...arr]
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  let state = h || 1
  const rand = () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

const CATEGORY_DESCRIPTION: Record<ImageCategory, string> = {
  hero: '橫向大圖，1280×720，適合 Hero section 主視覺 / 背景',
  product: '中景，800×600，適合產品卡片 / 菜單項目 / 服務介紹',
  team: '方形頭像，400×400，適合團隊成員 / 見證',
  background: '寬螢幕，1920×1080，適合 section 背景 / 氛圍圖',
  lifestyle: '中景，800×600，敘事情境圖，通用性高',
  detail: '正方形特寫，600×600，適合細節強調 / icon 替代',
}

export function formatImageLibraryForPrompt(
  lib: ImageLibrary,
  opts: FormatLibraryOpts = {},
): string {
  const max = opts.maxPerCategory ?? 8
  const seed = opts.projectSeed ?? lib.productType

  const lines: string[] = []
  lines.push('## 圖片資源（白名單 — 必須從下列清單挑選，禁止自己編 URL）')
  lines.push('')
  lines.push('以下是本專案可用的全部圖片。生成 `<img>` / `<Image>` 時**必須**從下列 URL 中選擇一個，**嚴禁**自己編造或修改 URL。')
  lines.push('')

  for (const category of ALL_CATEGORIES) {
    const pool = shuffleDeterministic(lib[category], `${seed}:${category}`).slice(0, max)
    if (pool.length === 0) continue
    lines.push(`### ${category} 類（${CATEGORY_DESCRIPTION[category]}）`)
    pool.forEach((asset, i) => {
      lines.push(`${i + 1}. \`${asset.url}\` — "${asset.alt}"`)
    })
    lines.push('')
  }

  lines.push('### 使用規則（Critical）')
  lines.push('- `<img src="...">` / `<Image src="...">` 的 src 必須是上述清單中的完整 URL，一個字元都不能改')
  lines.push('- 禁止：自己構造 `photo-xxx` id、禁止替換 hostname、禁止修改尺寸 query string')
  lines.push('- 正確範例：`<img src="<從清單複製>" width={1280} height={720} alt="從清單的英文描述（可翻譯為中文，不得空白）" className="object-cover" />`')
  lines.push('- 每個 section 盡量用不同圖，避免整頁只看到第一張')
  lines.push('- 用途無對應分類時從 `lifestyle` 挑（最通用）')
  if (lib.source === 'picsum_fallback') {
    lines.push('- （當前降級：上述 URL 為 picsum.photos seed，Unsplash 不可用；照常從清單選，不要另外編 URL）')
  }
  lines.push('')

  return lines.join('\n')
}

// ============================================================
// 反查：從代碼中找出實際使用的 Unsplash 作者（供 deployer 建 ImageCredits）
// ============================================================

const UNSPLASH_URL_ID_REGEX = /images\.unsplash\.com\/photo-([A-Za-z0-9_-]+)/g

export function extractUsedUnsplashPhotographers(
  code: string,
  lib: ImageLibrary,
): Array<{ name: string; profileUrl: string; sourceId: string }> {
  if (lib.source !== 'unsplash') return []
  const usedIds = new Set<string>()
  for (const match of code.matchAll(UNSPLASH_URL_ID_REGEX)) {
    usedIds.add(match[1])
  }
  if (usedIds.size === 0) return []

  const all = [...lib.hero, ...lib.product, ...lib.team, ...lib.background, ...lib.lifestyle, ...lib.detail]
  const result: Array<{ name: string; profileUrl: string; sourceId: string }> = []
  const seen = new Set<string>()
  for (const asset of all) {
    for (const id of usedIds) {
      if (id === asset.sourceId || id.startsWith(asset.sourceId) || asset.sourceId.startsWith(id)) {
        if (!seen.has(asset.photographer.name)) {
          seen.add(asset.photographer.name)
          result.push({
            name: asset.photographer.name,
            profileUrl: asset.photographer.profileUrl,
            sourceId: asset.sourceId,
          })
        }
      }
    }
  }
  return result
}

/**
 * 提取實際出現在代碼中的 Unsplash asset（供 sanitize 白名單校驗 + download trigger）
 */
export function extractUsedUnsplashAssets(code: string, lib: ImageLibrary): ImageAsset[] {
  if (lib.source !== 'unsplash') return []
  const usedIds = new Set<string>()
  for (const match of code.matchAll(UNSPLASH_URL_ID_REGEX)) {
    usedIds.add(match[1])
  }
  if (usedIds.size === 0) return []
  const all = [...lib.hero, ...lib.product, ...lib.team, ...lib.background, ...lib.lifestyle, ...lib.detail]
  const seen = new Set<string>()
  const out: ImageAsset[] = []
  for (const asset of all) {
    for (const id of usedIds) {
      if (id === asset.sourceId || id.startsWith(asset.sourceId) || asset.sourceId.startsWith(id)) {
        if (!seen.has(asset.sourceId)) {
          seen.add(asset.sourceId)
          out.push(asset)
        }
      }
    }
  }
  return out
}

/**
 * 產生 ImageCredits.tsx 組件源碼
 * 掃描代碼裡實際使用的 photographer，生成帶 utm 連結的 footer 區塊
 * 無 Unsplash 使用 → 回 null（caller 不注入）
 */
export function buildAttributionBlock(
  code: string,
  lib: ImageLibrary,
): { file: string; data: string } | null {
  const photographers = extractUsedUnsplashPhotographers(code, lib)
  if (photographers.length === 0) return null

  const linkItems = photographers.map(
    (p) =>
      `<a href="${escapeAttr(p.profileUrl)}" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-700">${escapeText(p.name)}</a>`,
  )

  const unsplashLink = `https://unsplash.com/${UTM_SUFFIX}`

  const data = `export default function ImageCredits() {
  return (
    <div className="text-xs text-slate-500 py-3 text-center">
      Photos by{' '}${linkItems.join(', ')}{' '}on{' '}
      <a href="${escapeAttr(unsplashLink)}" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-700">Unsplash</a>
    </div>
  )
}
`

  return {
    file: 'components/ImageCredits.tsx',
    data,
  }
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeText(s: string): string {
  return s.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/{/g, '&#123;').replace(/}/g, '&#125;')
}

// ============================================================
// Download trigger（Unsplash ToS 要求：實際使用時 GET download_location）
// ============================================================

/**
 * fire-and-forget download trigger
 * 只在「照片實際出現在部署代碼裡」時呼叫（由 deployer 觸發，非預抓時）
 */
export function triggerUnsplashDownloads(downloadLocations: string[]): void {
  const env = getEnv()
  if (!env.UNSPLASH_ACCESS_KEY) return
  for (const loc of downloadLocations) {
    if (!loc) continue
    fetch(loc, {
      headers: {
        Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}`,
      },
    }).catch((err) => {
      logger.debug({ err, loc }, 'Unsplash download trigger 失敗（忽略）')
    })
  }
}

// ============================================================
// export 供測試
// ============================================================

export const __internals = {
  PRODUCTTYPE_TO_UNSPLASH_QUERIES,
  DEFAULT_QUERIES,
  CATEGORY_SIZES,
  CATEGORY_TARGET_COUNT,
  formatUnsplashUrl,
  shuffleDeterministic,
}
