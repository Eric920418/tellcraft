/**
 * Fast Build 生成服務
 * 快速模式專用的輔助函數：tier 偵測、產品推斷、默認 DesignSystem 建立
 * 大部分零 LLM 成本（規則式推斷），generateFastConcept 使用 1 次 Haiku
 */

import type { DesignTier, DesignSystem, TemplateData } from './uiux-generation'
import { matchTemplates } from './template-matcher'
import { queryOne } from '../db/client'
import { getAnthropicHeaders, MODEL, calculateLlmCost, trackLlmUsage } from '../lib/anthropic'
import { createLogger } from '../lib/logger'
import { safeParseJson } from '../utils/safe-parse-json'

const logger = createLogger('fast-build-generation')
const FAST_BUILD_CACHE_LIMIT = 200
const FAST_CONCEPT_CACHE = new Map<string, FastConcept>()
const EXPANDED_PROMPT_CACHE = new Map<string, string>()

function normalizeCacheText(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, ' ')
}

function buildFastCacheKey(prefix: string, parts: string[]): string {
  return `${prefix}:${parts.map(normalizeCacheText).join('|')}`
}

export function buildFastModeCacheKey(
  description: string,
  productType: string,
  pages: string[],
  tier: DesignTier,
): string {
  return buildFastCacheKey('fast-build', [description, productType, pages.join('|'), tier])
}

function rememberCacheValue<T>(cache: Map<string, T>, key: string, value: T): void {
  if (cache.has(key)) {
    cache.delete(key)
  }
  cache.set(key, value)
  if (cache.size > FAST_BUILD_CACHE_LIMIT) {
    const oldestKey = cache.keys().next().value
    if (oldestKey) cache.delete(oldestKey)
  }
}

// ============================================================
// Tier 偵測（規則式，零 LLM 成本）
// ============================================================

/**
 * 加權關鍵字表：強信號(3)、中信號(2)、弱信號(1)
 * 比起純計數，能更準確區分 functional vs creative
 */
const WEIGHTED_FUNCTIONAL: Array<{ keyword: string; weight: number }> = [
  // 強信號（權重 3）
  { keyword: 'dashboard', weight: 3 }, { keyword: 'admin', weight: 3 },
  { keyword: 'crm', weight: 3 }, { keyword: 'erp', weight: 3 },
  { keyword: 'analytics', weight: 3 },
  // 中信號（權重 2）
  { keyword: '後台', weight: 2 }, { keyword: '管理系統', weight: 2 },
  { keyword: '控制台', weight: 2 }, { keyword: '報表', weight: 2 },
  { keyword: '數據', weight: 2 }, { keyword: '面板', weight: 2 },
  { keyword: 'saas', weight: 2 }, { keyword: '平台', weight: 2 },
  { keyword: '診所', weight: 2 }, { keyword: '醫療', weight: 2 },
  { keyword: '律師', weight: 2 }, { keyword: '法律', weight: 2 },
  { keyword: '金融', weight: 2 }, { keyword: '會計', weight: 2 },
  { keyword: '保險', weight: 2 }, { keyword: '房地產', weight: 2 },
  // 弱信號（權重 1）
  { keyword: '管理', weight: 1 }, { keyword: '系統', weight: 1 },
  { keyword: '工具', weight: 1 }, { keyword: '訂單管理', weight: 1 },
  { keyword: '用戶管理', weight: 1 }, { keyword: '庫存', weight: 1 },
  { keyword: '專案管理', weight: 1 }, { keyword: 'project management', weight: 1 },
  { keyword: '看板', weight: 1 }, { keyword: 'kanban', weight: 1 },
  { keyword: '教育', weight: 1 }, { keyword: '學校', weight: 1 },
  { keyword: '計算機', weight: 1 }, { keyword: '轉換器', weight: 1 },
  { keyword: '編輯器', weight: 1 }, { keyword: '計時器', weight: 1 },
  { keyword: '記帳', weight: 1 },
]

const WEIGHTED_CREATIVE: Array<{ keyword: string; weight: number }> = [
  // 強信號（權重 3）
  { keyword: '品牌', weight: 3 }, { keyword: '創意', weight: 3 },
  { keyword: 'portfolio', weight: 3 }, { keyword: '作品集', weight: 3 },
  // 中信號（權重 2）
  { keyword: 'landing', weight: 2 }, { keyword: '官網', weight: 2 },
  { keyword: '餐廳', weight: 2 }, { keyword: '咖啡', weight: 2 },
  { keyword: '設計師', weight: 2 }, { keyword: '攝影', weight: 2 },
  { keyword: '藝術', weight: 2 }, { keyword: '音樂', weight: 2 },
  { keyword: '時尚', weight: 2 }, { keyword: '婚禮', weight: 2 },
  { keyword: '花店', weight: 2 }, { keyword: '酒吧', weight: 2 },
  { keyword: '美容', weight: 2 }, { keyword: '沙龍', weight: 2 },
  { keyword: '健身', weight: 2 }, { keyword: '瑜伽', weight: 2 },
  { keyword: '民宿', weight: 2 }, { keyword: '飯店', weight: 2 },
  { keyword: 'branding', weight: 2 }, { keyword: 'gallery', weight: 2 },
  { keyword: 'fashion', weight: 2 }, { keyword: 'lifestyle', weight: 2 },
  // 弱信號（權重 1）
  { keyword: '展示', weight: 1 }, { keyword: 'studio', weight: 1 },
  { keyword: 'showcase', weight: 1 }, { keyword: 'design', weight: 1 },
  { keyword: '工作室', weight: 1 }, { keyword: 'blog', weight: 1 },
  { keyword: '部落格', weight: 1 }, { keyword: '個人網站', weight: 1 },
  { keyword: '獨特', weight: 1 }, { keyword: '潮流', weight: 1 },
  { keyword: '活動', weight: 1 }, { keyword: 'event', weight: 1 },
  { keyword: '旅遊', weight: 1 }, { keyword: '公益', weight: 1 },
  { keyword: '非營利', weight: 1 },
]

/**
 * 規則式 tier 偵測（加權匹配）
 * 預設 creative（快速模式用戶大多做 landing page）
 */
export function detectDesignTier(description: string): DesignTier {
  const lower = description.toLowerCase()

  const functionalScore = WEIGHTED_FUNCTIONAL
    .filter(w => lower.includes(w.keyword))
    .reduce((sum, w) => sum + w.weight, 0)
  const creativeScore = WEIGHTED_CREATIVE
    .filter(w => lower.includes(w.keyword))
    .reduce((sum, w) => sum + w.weight, 0)

  if (functionalScore > creativeScore) return 'functional'
  return 'creative' // 預設 creative
}

// ============================================================
// 產品類型推斷
// ============================================================

const PRODUCT_TYPE_RULES: Array<{ keywords: string[]; type: string }> = [
  // ── 具體產業（放前面，避免被泛用類型搶先匹配）──
  { keywords: ['餐廳', '餐飲', '美食', '菜單', 'menu', 'restaurant'], type: 'restaurant' },
  { keywords: ['咖啡', 'cafe', 'coffee'], type: 'cafe' },
  { keywords: ['健身', 'gym', '瑜伽', 'yoga', '運動'], type: 'fitness' },
  { keywords: ['醫療', '診所', '牙醫', '健康', 'clinic'], type: 'healthcare' },
  { keywords: ['律師', '法律', '事務所', 'law'], type: 'legal' },
  { keywords: ['金融', '會計', '保險', '理財', 'finance'], type: 'finance' },
  { keywords: ['房地產', '租屋', '房屋', '不動產', '物業'], type: 'realestate' },
  { keywords: ['美容', '美髮', '沙龍', 'salon', 'spa'], type: 'salon' },
  { keywords: ['婚禮', '婚紗', '婚攝', 'wedding'], type: 'wedding' },
  { keywords: ['攝影', '相機', '寫真', 'photography'], type: 'photography' },
  { keywords: ['音樂', '樂團', '演唱會', '音樂人'], type: 'music' },
  { keywords: ['飯店', '旅館', '酒店', 'hotel'], type: 'hotel' },
  { keywords: ['旅遊', '民宿', '住宿', 'travel'], type: 'travel' },
  { keywords: ['代理', '工作室', 'agency', '行銷', '廣告'], type: 'agency' },
  { keywords: ['非營利', '公益', 'ngo', '慈善'], type: 'nonprofit' },
  { keywords: ['零售', '門市', '實體店', '百貨'], type: 'retail' },
  { keywords: ['教育', '課程', '培訓', '學校', '線上學習'], type: 'education' },
  // ── 活動/節慶（放在 tool 之前，避免被清單等泛用詞搶走）──
  { keywords: ['活動節', '設計節', '音樂節', '藝術節', '節慶', '慶典', 'festival', 'design festival', 'art festival', 'music festival'], type: 'event' },
  // ── 工具型產品（放在泛用類型前面，避免被 saas 搶走）──
  // 注意：「清單」太廣泛（如「元件清單」非 checklist），已移除；改用更精確的 checklist
  {
    keywords: [
      '計算機', 'calculator', '轉換器', 'converter',
      '看板', 'kanban', 'todo', '待辦', 'checklist',
      '編輯器', 'editor', '筆記', 'note',
      '計時器', 'timer', '碼表', 'stopwatch', '倒數',
      '記帳', '追蹤器', 'tracker', '記錄器',
      '產生器', 'generator', '密碼', 'color picker',
      '白板', 'whiteboard', '畫板',
    ],
    type: 'tool',
  },
  // ── 泛用類型 ──
  { keywords: ['portfolio', '作品集', '設計師'], type: 'portfolio' },
  { keywords: ['blog', '部落格', '文章'], type: 'blog' },
  { keywords: ['dashboard', '後台', '管理', 'admin'], type: 'dashboard' },
  { keywords: ['saas', '平台', '系統'], type: 'saas' },
  { keywords: ['電商', '商店', '購物', 'shop', 'store', 'ecommerce'], type: 'ecommerce' },
  { keywords: ['landing', '官網', '品牌', '公司', '企業'], type: 'landing' },
  { keywords: ['活動', 'event', '派對'], type: 'event' },
  { keywords: ['個人', '自我介紹', '履歷', 'resume', 'cv'], type: 'personal' },
]

/**
 * 推斷產品類型
 */
export function inferProductType(description: string): string {
  const lower = description.toLowerCase()

  for (const rule of PRODUCT_TYPE_RULES) {
    if (rule.keywords.some(k => lower.includes(k))) {
      return rule.type
    }
  }

  return 'landing' // 預設 landing page
}

// ============================================================
// 頁面推斷
// ============================================================

const DEFAULT_PAGES: Record<string, string[]> = {
  // ── 核心差異化頁面（3-4 頁，去掉通用頁）──
  ecommerce: ['首頁', '商品列表', '商品詳情', '購物車'],
  saas: ['首頁', '功能介紹', '價格方案'],
  hotel: ['首頁', '房型介紹', '訂房'],
  healthcare: ['首頁', '科別介紹', '線上掛號'],
  education: ['首頁', '課程列表', '課程詳情'],
  salon: ['首頁', '服務項目', '預約'],
  realestate: ['首頁', '物件列表', '物件詳情'],
  travel: ['首頁', '行程列表', '行程詳情'],
  fitness: ['首頁', '課表', '會員方案'],
  retail: ['首頁', '產品列表', '產品詳情'],
  // ── 標準產品（3-4 頁，維持不變）──
  restaurant: ['首頁', '菜單', '關於我們', '聯繫'],
  cafe: ['首頁', '菜單', '關於', '聯繫'],
  agency: ['首頁', '案例', '服務', '聯繫'],
  legal: ['首頁', '服務領域', '律師團隊', '聯繫'],
  finance: ['首頁', '服務', '關於', '聯繫'],
  nonprofit: ['首頁', '使命', '活動', '捐款'],
  wedding: ['首頁', '作品', '方案', '聯繫'],
  music: ['首頁', '音樂', '演出', '聯繫'],
  photography: ['首頁', '作品集', '方案', '聯繫'],
  portfolio: ['首頁', '作品集', '關於我', '聯繫'],
  blog: ['首頁', '文章列表', '關於'],
  // ── 簡單產品（1-3 頁，維持不變）──
  tool: ['主頁面'],
  dashboard: ['Dashboard'],
  landing: ['首頁'],
  event: ['首頁', '活動詳情', '報名'],
  personal: ['首頁', '關於我', '聯繫'],
}

/**
 * 推斷頁面列表
 */
export function inferPages(description: string, productType: string): string[] {
  // 先嘗試從描述中提取明確提到的頁面（中英文雙語 + 常見 SaaS/app 頁面名）
  const pageKeywords = [
    // 中文
    '首頁', '關於', '聯繫', '菜單', '作品', '價格', '功能', '文章', '產品', '服務',
    '團隊', '常見問題', '課表', '教練', '醫師', '科別', '物件', '行程', '案例',
    '預約', '門市', '房型', '設施', '訂房', '捐款', '演出', '方案', '師資', '課程',
    '聯絡', '新聞', '最新消息', '下載', '支援', '幫助', '會員', '儀表板', '設定', '商品',
    // 英文（常見 SaaS/Dashboard 頁面）
    'Dashboard', 'Users', 'Orders', 'Products', 'Analytics', 'Chat', 'Files',
    'Settings', 'Profile', 'Billing', 'FAQ', 'Pricing', 'About', 'Contact',
    'Home', 'Overview', 'Reports', 'Notifications', 'Messages', 'Calendar',
    'Inventory', 'Customers', 'Invoices', 'Teams', 'Projects', 'Tasks',
  ]
  const negativePatterns = ['不要', '不需要', '不用', '沒有', '去掉', '移除']
  // 子句分隔符（中英文標點）
  const clauseSeparators = /[，。,.、；;！!？?]/
  const lower = description.toLowerCase()
  const mentioned = pageKeywords.filter(k => {
    const kLower = k.toLowerCase()
    // 掃描所有出現位置，只要有任何一個未被否定就保留
    let searchFrom = 0
    while (true) {
      const idx = lower.indexOf(kLower, searchFrom)
      if (idx === -1) return false
      // 取關鍵詞所在的子句（用標點分段）
      let clauseStart = 0
      for (let i = idx - 1; i >= 0; i--) {
        if (clauseSeparators.test(lower[i])) { clauseStart = i + 1; break }
      }
      let clauseEnd = lower.length
      for (let i = idx + kLower.length; i < lower.length; i++) {
        if (clauseSeparators.test(lower[i])) { clauseEnd = i; break }
      }
      const clause = lower.slice(clauseStart, clauseEnd)
      // 在整個子句內檢查否定詞（同時覆蓋前置和後置）
      if (!negativePatterns.some(neg => clause.includes(neg))) {
        return true // 這個出現位置沒有否定 → 保留
      }
      searchFrom = idx + 1
    }
  })

  if (mentioned.length >= 2) {
    return mentioned
  }

  return DEFAULT_PAGES[productType] || ['首頁']
}

export function shouldExpandBriefPrompt(description: string, pages: string[]): boolean {
  const trimmed = description.trim()
  if (!trimmed) return false

  const isChinese = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(trimmed)
  if (isChinese) {
    const charCount = trimmed.replace(/\s/g, '').length
    if (charCount > 80) return false
  } else {
    const wordCount = trimmed.split(/\s+/).length
    if (wordCount > 40) return false
  }

  const normalized = trimmed.toLowerCase()
  const punctuationCount = (trimmed.match(/[，。,.、；;!?！？\n]/g) || []).length
  const pageMentions = pages.filter(page => normalized.includes(page.toLowerCase())).length
  const detailSignals = [
    'hero', 'cta', 'faq', 'pricing', 'features', 'about', 'contact',
    '標題', '按鈕', '表單', '方案', '價格', '聯繫', '功能', '特色',
  ].filter(signal => normalized.includes(signal)).length

  if (pageMentions >= 2 && punctuationCount >= 2) return false
  if (detailSignals >= 3 && punctuationCount >= 2) return false

  return true
}

const HOME_PAGE_PATTERNS = ['首頁', 'home', 'landing', '主頁面']
const APP_CORE_PAGE_PATTERNS = ['dashboard', '儀表板', '控制台', '工作台', 'workspace', '主頁面', '看板']
const COMPLEX_FAST_BUILD_TYPES = new Set([
  'saas',
  'ecommerce',
  'hotel',
  'travel',
  'education',
  'healthcare',
  'fitness',
  'retail',
  'salon',
])
const CONVERSION_PAGE_PRIORITIES: Record<string, string[]> = {
  saas: ['價格方案', 'pricing', 'plans', '方案', '功能介紹', 'features'],
  ecommerce: ['商品列表', 'products', 'shop', '商品詳情'],
  hotel: ['訂房', 'booking', '預訂', '房型介紹'],
  travel: ['行程列表', 'tours', '行程詳情', '報名'],
  education: ['課程列表', 'courses', '課程詳情', '報名'],
  healthcare: ['線上掛號', '預約', 'booking', '科別介紹'],
  fitness: ['會員方案', '方案', '課表', '預約'],
  retail: ['產品列表', '商品列表', 'products', '門市資訊'],
  salon: ['預約', 'booking', '服務項目', '作品展示'],
}

function findPageByPatterns(pages: string[], patterns: string[]): string | undefined {
  const normalizedPages = pages.map(page => ({
    raw: page,
    normalized: page.trim().toLowerCase(),
  }))

  for (const pattern of patterns.map(pattern => pattern.toLowerCase())) {
    const matched = normalizedPages.find(page => page.normalized.includes(pattern))
    if (matched) return matched.raw
  }

  return undefined
}

export function pickFirstBatchPages(
  productType: string,
  layoutMode: LayoutMode,
  pages: string[],
): string[] {
  if (pages.length <= 4) return [...pages]  // 4 頁以內一批完成，無需暫停

  const homePage = findPageByPatterns(pages, HOME_PAGE_PATTERNS) || pages[0]

  if (layoutMode === 'app') {
    const corePage = findPageByPatterns(pages, APP_CORE_PAGE_PATTERNS) || pages[0]
    return [corePage]
  }

  if (!COMPLEX_FAST_BUILD_TYPES.has(productType)) {
    return [homePage]
  }

  const conversionPage = findPageByPatterns(pages, CONVERSION_PAGE_PRIORITIES[productType] || [])
  if (conversionPage && conversionPage !== homePage) {
    return [homePage, conversionPage]
  }

  const fallbackSecondPage = pages.find(page => page !== homePage)
  return fallbackSecondPage ? [homePage, fallbackSecondPage] : [homePage]
}

export function enforceFastBuildLayoutGuards(
  productType: string,
  layoutMode: LayoutMode,
  promptSection?: string,
): string {
  const base = promptSection?.trim()
  const guard =
    layoutMode === 'app'
      ? `## Fast Build Layout Guards
- Product type: ${productType}
- This is an app/tool/dashboard flow. Prefer app shell, workspace, dashboard canvas, inspector panels, command surfaces, utility-focused layouts.
- Do NOT generate marketing hero sections, testimonials, brand story blocks, pricing tables, newsletter signup bands, or promotional CTA strips unless the page list explicitly includes them.
- Navigation should support task completion first. Avoid homepage-style storytelling rhythms.`
      : `## Fast Build Layout Guards
- Product type: ${productType}
- This is a website/marketing flow. Prefer homepage sections, editorial content flow, feature storytelling, pricing/contact/about pages.
- Do NOT generate app-shell layouts, sidebar-first dashboards, command-center chrome, dense admin tables, or utility-console framing unless the page list explicitly demands it.
- Navigation should feel like a website, not a productivity tool.`

  return [base, guard].filter(Boolean).join('\n\n')
}

// ============================================================
// 頁面合併（DEFAULT_PAGES + Haiku suggestedPages）
// ============================================================

/**
 * 合併預設頁面和 Haiku 建議頁面，去重後截斷
 * - defaultPages 為基底，suggestedPages 補充
 * - 去重用正規化 key（去空白+小寫）
 * - 上限 maxPages 個
 */
export function mergePages(defaultPages: string[], suggestedPages?: string[], maxPages = 4): string[] {
  if (!suggestedPages?.length) return defaultPages.slice(0, maxPages)
  const seen = new Map<string, string>()
  for (const p of defaultPages) seen.set(p.replace(/\s/g, '').toLowerCase(), p)
  for (const raw of suggestedPages) {
    // 清理 LLM 回傳的垃圾頁名：去掉括號描述、路徑前綴、截取到合理長度
    const cleaned = raw
      .replace(/^\/+/, '')           // 去掉前導 /
      .replace(/[（(].*/g, '')       // 去掉括號及後面的描述
      .replace(/[，,].*/g, '')       // 去掉逗號後的描述
      .trim()
    if (!cleaned || cleaned.length > 20) continue  // 跳過空值和過長的垃圾
    const key = cleaned.replace(/\s/g, '').toLowerCase()
    if (!seen.has(key)) seen.set(key, cleaned)
  }
  return Array.from(seen.values()).slice(0, maxPages)
}

// ============================================================
// 產業別配色系統
// ============================================================

export interface IndustryPalette {
  primary: string; secondary: string; accent: string
  background: string; foreground: string; muted: string; border: string
  surface1: string; surface2: string; surface3: string; ring: string
  fontFamily: string; displayFont?: string
}

const INDUSTRY_COLOR_PALETTES: Record<string, IndustryPalette> = {
  // 餐飲類 — 暖色調
  restaurant: {
    primary: '#b45309', secondary: '#78350f', accent: '#d97706',
    background: '#fffbeb', foreground: '#1c1917', muted: '#fef3c7', border: '#fde68a',
    surface1: '#fffbeb', surface2: '#ffffff', surface3: '#fef3c7', ring: '#d97706',
    fontFamily: 'DM Sans', displayFont: 'Playfair Display',
  },
  cafe: {
    primary: '#92400e', secondary: '#78350f', accent: '#b45309',
    background: '#fefce8', foreground: '#1c1917', muted: '#fef9c3', border: '#fde047',
    surface1: '#fefce8', surface2: '#ffffff', surface3: '#fef9c3', ring: '#b45309',
    fontFamily: 'DM Sans', displayFont: 'Lora',
  },
  // 健康/醫療 — 冷靜淺綠+藍
  healthcare: {
    primary: '#0d9488', secondary: '#0f766e', accent: '#14b8a6',
    background: '#f0fdfa', foreground: '#0f172a', muted: '#ccfbf1', border: '#99f6e4',
    surface1: '#f0fdfa', surface2: '#ffffff', surface3: '#ccfbf1', ring: '#14b8a6',
    fontFamily: 'DM Sans',
  },
  fitness: {
    primary: '#059669', secondary: '#047857', accent: '#10b981',
    background: '#f0fdf4', foreground: '#0f172a', muted: '#dcfce7', border: '#bbf7d0',
    surface1: '#f0fdf4', surface2: '#ffffff', surface3: '#dcfce7', ring: '#10b981',
    fontFamily: 'Outfit',
  },
  // 專業服務 — 穩重深藍/灰
  legal: {
    primary: '#1e3a5f', secondary: '#334155', accent: '#2563eb',
    background: '#f8fafc', foreground: '#0f172a', muted: '#f1f5f9', border: '#e2e8f0',
    surface1: '#f8fafc', surface2: '#ffffff', surface3: '#f1f5f9', ring: '#2563eb',
    fontFamily: 'DM Sans', displayFont: 'Playfair Display',
  },
  finance: {
    primary: '#1e40af', secondary: '#1e3a8a', accent: '#3b82f6',
    background: '#eff6ff', foreground: '#0f172a', muted: '#dbeafe', border: '#bfdbfe',
    surface1: '#eff6ff', surface2: '#ffffff', surface3: '#dbeafe', ring: '#3b82f6',
    fontFamily: 'DM Sans', displayFont: 'DM Mono',
  },
  realestate: {
    primary: '#0369a1', secondary: '#075985', accent: '#0ea5e9',
    background: '#f0f9ff', foreground: '#0f172a', muted: '#e0f2fe', border: '#bae6fd',
    surface1: '#f0f9ff', surface2: '#ffffff', surface3: '#e0f2fe', ring: '#0ea5e9',
    fontFamily: 'DM Sans',
  },
  // 教育 — 知性藍紫
  education: {
    primary: '#4f46e5', secondary: '#4338ca', accent: '#6366f1',
    background: '#fafafe', foreground: '#1e1b4b', muted: '#eef2ff', border: '#e0e7ff',
    surface1: '#fafafe', surface2: '#ffffff', surface3: '#eef2ff', ring: '#6366f1',
    fontFamily: 'DM Sans',
  },
  // 創意/藝術 — 大膽對比
  portfolio: {
    primary: '#18181b', secondary: '#3f3f46', accent: '#f59e0b',
    background: '#fafafa', foreground: '#18181b', muted: '#f4f4f5', border: '#e4e4e7',
    surface1: '#fafafa', surface2: '#ffffff', surface3: '#f4f4f5', ring: '#f59e0b',
    fontFamily: 'Plus Jakarta Sans', displayFont: 'Instrument Serif',
  },
  photography: {
    primary: '#18181b', secondary: '#27272a', accent: '#a3a3a3',
    background: '#fafafa', foreground: '#18181b', muted: '#f5f5f5', border: '#e5e5e5',
    surface1: '#fafafa', surface2: '#ffffff', surface3: '#f5f5f5', ring: '#18181b',
    fontFamily: 'Outfit', displayFont: 'Playfair Display',
  },
  music: {
    primary: '#7c3aed', secondary: '#6d28d9', accent: '#a78bfa',
    background: '#faf5ff', foreground: '#1e1b4b', muted: '#f3e8ff', border: '#e9d5ff',
    surface1: '#faf5ff', surface2: '#ffffff', surface3: '#f3e8ff', ring: '#a78bfa',
    fontFamily: 'Space Grotesk', displayFont: 'Instrument Serif',
  },
  // 美容/時尚 — 柔和粉色調
  salon: {
    primary: '#be185d', secondary: '#9d174d', accent: '#ec4899',
    background: '#fff1f2', foreground: '#1c1917', muted: '#ffe4e6', border: '#fecdd3',
    surface1: '#fff1f2', surface2: '#ffffff', surface3: '#ffe4e6', ring: '#ec4899',
    fontFamily: 'DM Sans', displayFont: 'Cormorant Garamond',
  },
  wedding: {
    primary: '#be123c', secondary: '#9f1239', accent: '#f43f5e',
    background: '#fff1f2', foreground: '#1c1917', muted: '#ffe4e6', border: '#fecdd3',
    surface1: '#fff1f2', surface2: '#ffffff', surface3: '#ffe4e6', ring: '#f43f5e',
    fontFamily: 'DM Sans', displayFont: 'Cormorant Garamond',
  },
  // 旅遊/飯店 — 自然色系
  travel: {
    primary: '#0891b2', secondary: '#0e7490', accent: '#06b6d4',
    background: '#ecfeff', foreground: '#0f172a', muted: '#cffafe', border: '#a5f3fc',
    surface1: '#ecfeff', surface2: '#ffffff', surface3: '#cffafe', ring: '#06b6d4',
    fontFamily: 'Outfit',
  },
  hotel: {
    primary: '#78350f', secondary: '#92400e', accent: '#d97706',
    background: '#fffbeb', foreground: '#1c1917', muted: '#fef3c7', border: '#fde68a',
    surface1: '#fffbeb', surface2: '#ffffff', surface3: '#fef3c7', ring: '#d97706',
    fontFamily: 'DM Sans', displayFont: 'Playfair Display',
  },
  // 公益 — 溫暖綠色
  nonprofit: {
    primary: '#15803d', secondary: '#166534', accent: '#22c55e',
    background: '#f0fdf4', foreground: '#14532d', muted: '#dcfce7', border: '#bbf7d0',
    surface1: '#f0fdf4', surface2: '#ffffff', surface3: '#dcfce7', ring: '#22c55e',
    fontFamily: 'DM Sans',
  },
  // 電商/零售 — 活力明亮
  ecommerce: {
    primary: '#ea580c', secondary: '#c2410c', accent: '#f97316',
    background: '#fff7ed', foreground: '#1c1917', muted: '#ffedd5', border: '#fed7aa',
    surface1: '#fff7ed', surface2: '#ffffff', surface3: '#ffedd5', ring: '#f97316',
    fontFamily: 'Outfit',
  },
  retail: {
    primary: '#dc2626', secondary: '#b91c1c', accent: '#ef4444',
    background: '#fef2f2', foreground: '#1c1917', muted: '#fee2e2', border: '#fecaca',
    surface1: '#fef2f2', surface2: '#ffffff', surface3: '#fee2e2', ring: '#ef4444',
    fontFamily: 'Outfit',
  },
  // 工具型 — 清爽功能導向
  tool: {
    primary: '#3b82f6', secondary: '#64748b', accent: '#10b981',
    background: '#ffffff', foreground: '#0f172a', muted: '#f8fafc', border: '#e2e8f0',
    surface1: '#ffffff', surface2: '#f8fafc', surface3: '#f1f5f9', ring: '#3b82f6',
    fontFamily: 'DM Sans',
  },
  // 代理/行銷 — 現代感
  agency: {
    primary: '#6366f1', secondary: '#4f46e5', accent: '#818cf8',
    background: '#fafafa', foreground: '#18181b', muted: '#f4f4f5', border: '#e4e4e7',
    surface1: '#fafafa', surface2: '#ffffff', surface3: '#f4f4f5', ring: '#818cf8',
    fontFamily: 'Space Grotesk', displayFont: 'Instrument Serif',
  },
  // 部落格 — 閱讀導向
  blog: {
    primary: '#18181b', secondary: '#3f3f46', accent: '#6366f1',
    background: '#fafafa', foreground: '#18181b', muted: '#f4f4f5', border: '#e4e4e7',
    surface1: '#fafafa', surface2: '#ffffff', surface3: '#f4f4f5', ring: '#6366f1',
    fontFamily: 'DM Sans', displayFont: 'Libre Baskerville',
  },
  // 管理後台 — 功能導向
  dashboard: {
    primary: '#3b82f6', secondary: '#64748b', accent: '#10b981',
    background: '#ffffff', foreground: '#0f172a', muted: '#f1f5f9', border: '#e2e8f0',
    surface1: '#ffffff', surface2: '#f8fafc', surface3: '#f1f5f9', ring: '#3b82f6',
    fontFamily: 'DM Sans', displayFont: 'DM Mono',
  },
  // 活動 — 紫色+金色活力
  event: {
    primary: '#7c3aed', secondary: '#6d28d9', accent: '#f59e0b',
    background: '#faf5ff', foreground: '#1e1b4b', muted: '#f3e8ff', border: '#e9d5ff',
    surface1: '#faf5ff', surface2: '#ffffff', surface3: '#f3e8ff', ring: '#f59e0b',
    fontFamily: 'Outfit', displayFont: 'Fraunces',
  },
  // Landing — 現代靛+金
  landing: {
    primary: '#6366f1', secondary: '#4f46e5', accent: '#f59e0b',
    background: '#fafafa', foreground: '#18181b', muted: '#f4f4f5', border: '#e4e4e7',
    surface1: '#fafafa', surface2: '#ffffff', surface3: '#f4f4f5', ring: '#f59e0b',
    fontFamily: 'Bricolage Grotesque', displayFont: 'DM Sans',
  },
  // 個人網站 — 暖色調
  personal: {
    primary: '#18181b', secondary: '#3f3f46', accent: '#f59e0b',
    background: '#fafafa', foreground: '#18181b', muted: '#f4f4f5', border: '#e4e4e7',
    surface1: '#fafafa', surface2: '#ffffff', surface3: '#f4f4f5', ring: '#f59e0b',
    fontFamily: 'Outfit',
  },
  // SaaS — 科技感
  saas: {
    primary: '#6366f1', secondary: '#4f46e5', accent: '#06b6d4',
    background: '#fafafa', foreground: '#18181b', muted: '#f4f4f5', border: '#e4e4e7',
    surface1: '#fafafa', surface2: '#ffffff', surface3: '#f4f4f5', ring: '#06b6d4',
    fontFamily: 'Space Grotesk',
  },
}

// ============================================================
// DesignSystem 2.0 輔助函數（純函數，零 LLM）
// ============================================================

export function deriveShadows(tier: DesignTier, productType: string, palette: IndustryPalette): DesignSystem['shadows'] {
  if (tier === 'functional') {
    if (['dashboard', 'saas', 'tool'].includes(productType)) {
      return { strategy: 'borders-only', values: {} }
    }
    return {
      strategy: 'subtle-shadows',
      values: {
        sm: '0 1px 3px rgba(0,0,0,0.06)',
        md: '0 4px 6px rgba(0,0,0,0.07)',
      },
    }
  }
  // creative
  if (['portfolio', 'photography', 'agency'].includes(productType)) {
    return {
      strategy: 'subtle-shadows',
      values: {
        sm: '0 1px 3px rgba(0,0,0,0.06)',
        md: '0 4px 6px rgba(0,0,0,0.07)',
        glow: `0 0 20px ${palette.accent}30`,
      },
    }
  }
  if (['event', 'music', 'landing'].includes(productType)) {
    return {
      strategy: 'layered-shadows',
      values: {
        sm: '0 1px 3px rgba(0,0,0,0.06)',
        md: '0 4px 6px rgba(0,0,0,0.07)',
        lg: '0 10px 25px rgba(0,0,0,0.10)',
        glow: `0 0 30px ${palette.accent}25`,
      },
    }
  }
  return {
    strategy: 'subtle-shadows',
    values: {
      sm: '0 1px 3px rgba(0,0,0,0.06)',
      md: '0 4px 6px rgba(0,0,0,0.07)',
    },
  }
}

export function deriveDepth(tier: DesignTier, productType: string): DesignSystem['depth'] {
  if (tier === 'functional') {
    if (['dashboard', 'tool'].includes(productType)) {
      return { strategy: 'flat', cardStyle: 'bg-surface-2 rounded-md border border-border' }
    }
    if (['saas', 'finance'].includes(productType)) {
      return { strategy: 'subtle', cardStyle: 'bg-white border border-border rounded-lg' }
    }
    return { strategy: 'subtle', cardStyle: 'bg-white shadow-sm rounded-lg border border-border/50' }
  }
  // creative
  if (['portfolio', 'photography'].includes(productType)) {
    return { strategy: 'elevated', cardStyle: 'bg-white shadow-md hover:shadow-lg rounded-xl transition-shadow' }
  }
  if (['event', 'music', 'landing'].includes(productType)) {
    return { strategy: 'elevated', cardStyle: 'bg-white shadow-lg rounded-2xl' }
  }
  return { strategy: 'subtle', cardStyle: 'bg-white shadow-sm rounded-xl border border-border/50' }
}

export function deriveAnimationPersonality(tier: DesignTier, productType: string): DesignSystem['animationPersonality'] {
  if (tier === 'functional') {
    if (['dashboard', 'tool', 'admin'].includes(productType)) return 'minimal'
    return 'smooth'
  }
  // creative
  if (['portfolio', 'photography'].includes(productType)) return 'dramatic'
  if (['event', 'music'].includes(productType)) return 'bouncy'
  return 'smooth'
}

export function deriveLayoutArchetype(tier: DesignTier, productType: string): DesignSystem['layoutArchetype'] {
  if (tier === 'functional') {
    if (['dashboard', 'admin', 'tool'].includes(productType)) return 'dashboard'
    return 'app-shell'
  }
  // creative
  if (['portfolio', 'photography'].includes(productType)) return 'editorial'
  if (['landing', 'agency', 'event', 'music'].includes(productType)) return 'storytelling'
  return 'bento'
}

export function deriveGradients(tier: DesignTier, productType: string, palette: IndustryPalette): DesignSystem['gradients'] | undefined {
  if (tier === 'functional') return undefined
  const base: NonNullable<DesignSystem['gradients']> = {
    primary: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})`,
    surface: `linear-gradient(180deg, ${palette.background}, ${palette.surface3 ?? palette.muted})`,
  }
  if (['event', 'music', 'landing'].includes(productType)) {
    base.accent = `radial-gradient(ellipse at 50% 0%, ${palette.accent}20, transparent 70%)`
  }
  return base
}

// ============================================================
// 默認 DesignSystem（零 LLM 成本）
// ============================================================

/**
 * 從 IndustryPalette 建構完整 DesignSystem
 */
function paletteToDesignSystem(p: IndustryPalette, tier: DesignTier, productType?: string): DesignSystem {
  const fontSans = [p.fontFamily, 'system-ui', 'sans-serif']
  const fontFamilies: Record<string, string[]> = { sans: fontSans }
  if (p.displayFont) fontFamilies.display = [p.displayFont, 'serif']
  if (tier === 'functional') fontFamilies.mono = ['JetBrains Mono', 'monospace']

  return {
    cssVariables: `:root {
  --color-primary: ${p.primary};
  --color-secondary: ${p.secondary};
  --color-accent: ${p.accent};
  --color-background: ${p.background};
  --color-foreground: ${p.foreground};
  --color-muted: ${p.muted};
  --color-border: ${p.border};
  --color-surface-1: ${p.surface1};
  --color-surface-2: ${p.surface2};
  --color-surface-3: ${p.surface3};
  --color-ring: ${p.ring};
}`,
    tailwindExtend: {
      colors: {
        primary: p.primary, secondary: p.secondary, accent: p.accent,
        background: p.background, foreground: p.foreground, muted: p.muted, border: p.border,
        'surface-1': p.surface1, 'surface-2': p.surface2, 'surface-3': p.surface3, ring: p.ring,
      },
      fontFamily: fontFamilies,
    },
    typography: {
      fontFamily: p.fontFamily,
      scale: tier === 'functional'
        ? { 'text-xs': '0.75rem', 'text-sm': '0.875rem', 'text-base': '1rem', 'text-lg': '1.125rem', 'text-xl': '1.25rem', 'text-2xl': '1.5rem', 'text-3xl': '1.875rem', 'text-4xl': '2.25rem' }
        : { 'text-xs': '0.75rem', 'text-sm': '0.875rem', 'text-base': '1rem', 'text-lg': '1.125rem', 'text-xl': '1.25rem', 'text-2xl': '1.5rem', 'text-3xl': '1.875rem', 'text-4xl': '2.25rem', 'text-5xl': '3rem' },
    },
    colorPalette: {
      primary: p.primary, secondary: p.secondary, accent: p.accent,
      background: p.background, foreground: p.foreground, muted: p.muted, border: p.border,
      surface1: p.surface1, surface2: p.surface2, surface3: p.surface3, ring: p.ring,
      destructive: '#ef4444', success: '#22c55e',
    },
    spacing: {
      unit: 4,
      scale: tier === 'functional'
        ? { sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem', '2xl': '3rem' }
        : { sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem', '2xl': '3rem', '3xl': '4rem' },
    },
    borderRadius: tier === 'functional'
      ? { none: '0', sm: '0.25rem', md: '0.5rem', lg: '0.75rem', full: '9999px' }
      : { none: '0', sm: '0.375rem', md: '0.75rem', lg: '1rem', full: '9999px' },
    shadows: deriveShadows(tier, productType ?? '', p),
    depth: deriveDepth(tier, productType ?? ''),
    animationPersonality: deriveAnimationPersonality(tier, productType ?? ''),
    layoutArchetype: deriveLayoutArchetype(tier, productType ?? ''),
    gradients: deriveGradients(tier, productType ?? '', p),
  }
}

// Tier 預設配色（無產業匹配時的 fallback）
const TIER_FALLBACK_PALETTES: Record<DesignTier, IndustryPalette> = {
  functional: {
    primary: '#3b82f6', secondary: '#64748b', accent: '#3b82f6',
    background: '#ffffff', foreground: '#0f172a', muted: '#f1f5f9', border: '#e2e8f0',
    surface1: '#ffffff', surface2: '#f8fafc', surface3: '#f1f5f9', ring: '#3b82f6',
    fontFamily: 'DM Sans',
  },
  creative: {
    primary: '#6366f1', secondary: '#a855f7', accent: '#f59e0b',
    background: '#fafafa', foreground: '#18181b', muted: '#f4f4f5', border: '#e4e4e7',
    surface1: '#fafafa', surface2: '#ffffff', surface3: '#f4f4f5', ring: '#f59e0b',
    fontFamily: 'Outfit', displayFont: 'Playfair Display',
  },
}

/**
 * 建立產業別/tier-based 默認 DesignSystem
 * 1. 先查 INDUSTRY_COLOR_PALETTES[productType]
 * 2. 無匹配則 fallback 到 tier 預設配色
 */
export function buildDefaultDesignSystem(tier: DesignTier, productType?: string): DesignSystem {
  const palette = (productType && INDUSTRY_COLOR_PALETTES[productType])
    || TIER_FALLBACK_PALETTES[tier]
  return paletteToDesignSystem(palette, tier, productType)
}

// ============================================================
// 互動提示推斷（按產品類型）
// ============================================================

const INTERACTION_HINTS: Record<string, string> = {
  restaurant: `- 菜單頁：分類篩選（前菜/主菜/甜點/飲品），點擊分類即時過濾
- 聯繫頁：聯繫表單（姓名、電話、訊息），提交後顯示成功提示
- 預約功能（如適用）：日期選擇 + 人數 → 提交表單`,
  cafe: `- 菜單頁：分類篩選（咖啡/茶/甜點），點擊分類即時過濾
- 聯繫頁：聯繫表單（姓名、Email、訊息），提交後顯示成功提示`,
  fitness: `- 課表頁：週曆/日曆切換，點擊時段查看課程詳情 Modal
- 教練團隊：教練卡片（照片/專長/證照），點擊展開詳細資歷
- 會員方案：方案比較表（月費/季費/年費）+ 方案特色 + CTA 報名按鈕
- 聯繫頁：免費體驗預約表單（日期+時段+姓名+電話）`,
  healthcare: `- 科別介紹：Tab 或 Accordion 切換不同科別，含服務說明與常見症狀
- 醫師團隊：醫師卡片，點擊展開專長/經歷/門診時間
- 線上掛號：選擇科別 → 選擇醫師 → 選擇日期時段 → 填寫個人資料 → 確認
- 衛教專區：文章列表 + 分類篩選（依科別）+ 搜尋框
- 聯繫頁：地圖 + 交通指引 + 聯繫表單`,
  education: `- 課程列表：分類篩選（依難度/類型/科目），搜尋框即時過濾
- 課程詳情：章節大綱 Accordion + 課程時長/費用 + 報名按鈕 → Modal 表單
- 師資介紹：教師卡片，點擊展開經歷/專長/學歷
- 常見問題：Accordion 展開/收合（報名流程/退費/證書等）
- 聯繫頁：聯繫表單 + 校區地圖`,
  realestate: `- 物件列表：篩選（地區/價格/坪數/類型），搜尋框，列表/網格切換
- 物件詳情：照片輪播 + 格局圖 + 設備清單 + 價格 + 地址地圖 + 聯繫按鈕
- 關於我們：公司介紹 + 團隊成員 + 服務理念
- 聯繫表單：物件編號自動帶入，姓名+電話+訊息`,
  travel: `- 行程列表：篩選（目的地/天數/價格），搜尋框，卡片展示
- 行程詳情：日程表 Accordion（每日行程）+ 照片輪播 + 價格 + 包含/不包含 + 報名按鈕
- 旅遊攻略：文章列表 + 目的地分類篩選 + 搜尋
- 報名表單：選擇日期 + 人數 → 填寫資料 → 送出確認`,
  agency: `- 案例展示：分類篩選（依服務類型），Lightbox 瀏覽
- 服務介紹：Tab 切換不同服務項目
- 聯繫表單：姓名、公司、Email、需求描述`,
  salon: `- 服務項目：分類（剪髮/染燙/護理/美甲），價格表 + 時長
- 作品展示：照片牆 Lightbox，before/after 對比滑動
- 設計師團隊：設計師卡片（照片/專長/年資），點擊查看作品集
- 預約系統：選擇服務 → 選設計師 → 選日期時段 → 填資料 → 確認
- 聯繫頁：營業時間 + 地址地圖 + 聯繫表單`,
  legal: `- 服務領域：Accordion 或 Tab 展開各領域說明
- 律師團隊：律師卡片，點擊查看專長/學歷/經歷
- 免費諮詢表單：姓名、電話、Email、案件簡述`,
  finance: `- 服務項目：Tab 切換（理財/保險/稅務等）
- 試算工具（如適用）：輸入欄位 → 即時計算結果
- 諮詢預約表單：姓名、電話、需求類型下拉選擇`,
  nonprofit: `- 捐款區：金額選擇按鈕 + 自訂金額輸入
- 活動列表：時間軸或卡片，點擊查看詳情
- 志工報名表單：姓名、Email、可用時段`,
  retail: `- 產品列表：分類篩選 + 搜尋框 + 價格排序
- 產品詳情：照片輪播 + 規格說明 + 價格 + 庫存狀態 + 門市可取貨標示
- 門市資訊：地圖嵌入 + 各門市營業時間/地址/電話
- 聯繫表單 + 會員優惠申請`,
  hotel: `- 房型介紹：Tab 或卡片切換不同房型（含照片輪播 + 設備圖標 + 價格）
- 設施服務：Icon Grid + 點擊展開說明（泳池/健身房/Spa/商務中心）
- 餐飲頁：餐廳介紹卡片 + 菜單分類瀏覽 + 營業時間
- 訂房表單：入住/退房日期選擇 + 房型下拉 + 人數 + 特殊需求文字框 → 送出確認
- 聯繫頁：地圖嵌入 + 交通指引 + 聯繫表單`,
  wedding: `- 照片/影片展示：Lightbox 全螢幕瀏覽
- 服務方案：卡片比較表（方案 A/B/C）
- 諮詢表單：婚期、預算範圍、聯繫方式`,
  music: `- 音樂播放器：播放/暫停按鈕 + 進度條（若為音樂人網站）
- 活動列表：演出時間表，點擊查看詳情
- 聯繫/經紀表單：姓名、Email、合作類型`,
  photography: `- 作品集：分類篩選（婚攝/人像/商攝等），Lightbox 全螢幕
- 方案價格：卡片比較表
- 預約表單：選擇類型 → 日期 → 聯繫方式`,
  portfolio: `- 作品集頁：分類篩選（依作品類型），點擊作品打開詳情 Modal 或 Lightbox
- 聯繫頁：聯繫表單（姓名、Email、訊息），提交後顯示成功提示`,
  blog: `- 文章列表：搜尋框即時過濾文章、分類標籤篩選
- 文章頁：目錄導航（滾動到對應章節）`,
  tool: `- 主功能區域佔滿螢幕，直接呈現核心操作界面
- 輸入區域：根據工具類型提供輸入欄位（文字框/數字輸入/選擇器）
- 操作按鈕：清除/重置/計算/轉換等核心動作
- 結果展示：即時顯示結果，支援複製到剪貼簿
- 本地狀態管理：用 useState 管理所有資料，支援新增/刪除/修改
- 如適用：拖拽排序（看板類）、勾選完成（待辦類）、即時預覽（編輯器類）`,
  dashboard: `- 資料表格：搜尋篩選 + 排序
- 新增資料：按鈕 → Modal 表單 → 提交加入列表
- 刪除資料：按鈕 → AlertDialog 確認 → 移除
- 編輯資料：按鈕 → 預填 Modal → 提交更新`,
  saas: `- 功能介紹：Tab 或 Accordion 切換不同功能模組，含螢幕截圖/動圖展示
- 價格方案：月付/年付切換 Toggle + 方案比較表（免費/專業/企業）+ CTA 按鈕
- 使用案例：客戶案例卡片 + 產業分類篩選 + 點擊展開詳情
- 常見問題：Accordion 展開/收合 + 搜尋過濾
- CTA 按鈕：點擊滾動到註冊區域或打開註冊 Modal
- 聯繫頁：聯繫表單，提交後顯示成功提示`,
  ecommerce: `- 商品列表：分類篩選 + 搜尋框即時過濾 + 價格排序
- 商品詳情：圖片輪播 + 規格選擇（尺寸/顏色）+ 數量調整 + 加入購物車按鈕 + 相關商品推薦
- 購物車：商品列表（含縮圖）+ 數量調整（+/-）+ 刪除按鈕 + 小計/總計即時更新 + 前往結帳按鈕
- 結帳：收件資訊表單（姓名/地址/電話）+ 付款方式選擇（信用卡/轉帳）+ 訂單摘要 + 確認下單
- 會員中心：Tab 切換（訂單記錄/個人資料/收藏清單）+ 訂單狀態標籤（處理中/已出貨/已完成）
- 聯繫頁：聯繫表單，提交後顯示成功提示`,
  landing: `- CTA 按鈕：點擊滾動到對應區域或打開表單 Modal
- FAQ 區域：Accordion 展開/收合
- 聯繫表單：姓名、Email、訊息，提交後顯示成功提示`,
  event: `- 報名表單：姓名、Email、電話等欄位 → 提交後顯示確認
- 活動詳情：Tab 切換不同資訊（議程/講者/地點）
- 倒計時計時器（如適用）`,
  personal: `- 聯繫表單：姓名、Email、訊息，提交後顯示成功提示
- 技能/經歷區域：Tab 或 Accordion 切換`,
}

/**
 * 根據產品類型推斷互動提示
 */
export function inferInteractionHint(productType: string): string {
  return INTERACTION_HINTS[productType] || INTERACTION_HINTS['landing'] || ''
}

// ============================================================
// 產品類型中文標籤（用於面向用戶的消息）
// ============================================================

export const PRODUCT_TYPE_LABELS: Record<string, string> = {
  restaurant: '餐廳網站', cafe: '咖啡廳網站', fitness: '健身網站',
  healthcare: '醫療網站', education: '教育網站', realestate: '房地產網站',
  travel: '旅遊網站', agency: '代理公司網站', salon: '美容沙龍網站',
  legal: '法律事務所網站', finance: '金融網站', nonprofit: '公益網站',
  retail: '零售網站', hotel: '飯店網站', wedding: '婚禮網站',
  music: '音樂網站', photography: '攝影網站', portfolio: '作品集',
  blog: '部落格', tool: '工具應用', dashboard: '管理後台',
  saas: 'SaaS 平台', ecommerce: '電商網站', landing: '網站',
  event: '活動網站', personal: '個人網站',
}

// ============================================================
// 佈局模式推斷（App vs Website）
// ============================================================

export type LayoutMode = 'app' | 'website'

const APP_PRODUCT_TYPES = new Set(['dashboard', 'tool'])
const APP_SIGNALS = ['app', '應用', '工具', '管理', '後台', 'admin', 'dashboard', 'trello', 'notion', 'jira']

export function inferLayoutMode(productType: string, description?: string): LayoutMode {
  if (APP_PRODUCT_TYPES.has(productType)) return 'app'
  if (productType === 'saas' && description) {
    const lower = description.toLowerCase()
    if (APP_SIGNALS.some(s => lower.includes(s))) return 'app'
  }
  return 'website'
}

// ============================================================
// 最小化 TemplateData
// ============================================================

/**
 * 建立最小化 TemplateData（不呼叫 LLM）
 */
export function buildMinimalTemplate(description: string, productType: string): TemplateData {
  return {
    id: `fast-${productType}`,
    name: `Fast ${productType}`,
    slug: `fast-${productType}`,
    category: productType,
    description,
    designDefaults: {},
    pageStructure: {
      pages: inferPages(description, productType),
      components: [],
    },
  }
}

// ============================================================
// 模板風格提示（零用戶交互，自動取最佳匹配模板作為 prompt 參考）
// ============================================================

/**
 * 為 Fast Build 查詢最佳匹配模板的設計風格提示
 * 零用戶交互：自動取最高分模板的配色和佈局作為 prompt 參考
 */
export async function getTemplateStyleHint(
  description: string,
  productType: string
): Promise<string | null> {
  const matches = await matchTemplates({ originalRequirements: description })
  const best = matches.find(m => m.score >= 40)
  if (!best) return null

  const template = await queryOne<{
    name: string; category: string; description: string
    design_defaults: { style?: string; primaryColor?: string; layout?: string } | null
    page_structure: { pages?: string[] } | null
  }>(
    'SELECT name, category, description, design_defaults, page_structure FROM templates WHERE id = $1',
    [best.templateId]
  )
  if (!template) return null

  // 弱匹配 + 類別不符 → 風格提示可能誤導
  if (best.score < 60 && template.category !== productType) return null

  const parts: string[] = [`參考模板：「${template.name}」（${template.category}）`]
  if (template.description) parts.push(`描述：${template.description}`)
  if (template.design_defaults) {
    const d = template.design_defaults
    if (d.style) parts.push(`風格：${d.style}`)
    if (d.primaryColor) parts.push(`主色：${d.primaryColor}`)
    if (d.layout) parts.push(`佈局：${d.layout}`)
  }
  if (template.page_structure?.pages?.length) {
    parts.push(`頁面結構：${template.page_structure.pages.join('、')}`)
  }

  return parts.join('\n')
}

// ============================================================
// Haiku 概念生成（+1 Haiku 調用，給 Fast Build 設計靈魂）
// ============================================================

export interface FastConcept {
  name: string
  vibe: string
  signatureElement: string
  keyFeatures: string[]
  suggestedTier?: DesignTier
  suggestedPages?: string[]
}

/**
 * 用 1 次 Haiku 生成簡化的創意概念
 * 失敗時降級返回 null（不影響主流程）
 */
export async function generateFastConcept(
  description: string,
  productType: string,
  tier: DesignTier,
  primaryColor: string,
  context?: { userId?: string; conversationId?: string },
  referenceVisionAnalysis?: string
): Promise<FastConcept | null> {
  // 快取 key 包含參考分析文字的前 50 字（避免快取混淆）
  const refHint = referenceVisionAnalysis ? referenceVisionAnalysis.slice(0, 50) : ''
  const cacheKey = buildFastCacheKey('fast-concept', [description, productType, tier, primaryColor, refHint])
  const cached = FAST_CONCEPT_CACHE.get(cacheKey)
  if (cached) {
    logger.info({ productType }, 'FastConcept cache hit')
    return cached
  }

  try {
    const isChinese = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(description)
    const systemPrompt = isChinese
      ? `你是設計顧問。根據產品描述生成設計概念。回覆嚴格 JSON（無其他文字）：
{"name":"概念名稱(2-4字)","vibe":"設計氛圍描述(1句話)","signatureElement":"一個招牌視覺元素(具體的設計手法)","keyFeatures":["設計特徵1","設計特徵2","設計特徵3"],"suggestedTier":"functional或creative","suggestedPages":["頁面1","頁面2",...]}
suggestedTier 判斷規則：dashboard/admin/SaaS 工具型 → functional；品牌展示/創意/個性化 → creative。
suggestedPages：列出最核心的 2-4 個頁面，不要超過 4 個。dashboard/admin/SaaS 工具型用功能頁面名（如 Dashboard、Users、Settings），不要加「首頁」「價格」等行銷頁面。品牌/官網型可以用「首頁」+功能頁。
讓概念獨特，避免泛用描述。signatureElement 要具體到能直接寫代碼（如「hero 區域的漸層玻璃態卡片」而非「現代設計」）。`
      : `You are a design consultant. Generate a design concept from the product description. Reply strictly JSON (no other text):
{"name":"Concept name(2-4 words)","vibe":"Design vibe(1 sentence)","signatureElement":"One signature visual element(specific design technique)","keyFeatures":["Feature 1","Feature 2","Feature 3"],"suggestedTier":"functional or creative","suggestedPages":["Page 1","Page 2",...]}
suggestedTier rules: dashboard/admin/SaaS tools → functional; brand/creative/personality → creative.
suggestedPages: List 2-4 core pages, max 4. For dashboard/admin/SaaS tools use functional page names (e.g. Dashboard, Users, Settings) — do NOT add "Home", "Pricing" or other marketing pages. For brand/website types, use "Home" + feature pages.
Make the concept unique. signatureElement must be specific enough to code (e.g. "frosted glass hero cards with gradient border" not "modern design").`

    let userMsg = isChinese
      ? `產品：${description}\n類型：${productType}\n當前 tier：${tier}\n主色：${primaryColor}`
      : `Product: ${description}\nType: ${productType}\nCurrent tier: ${tier}\nPrimary color: ${primaryColor}`

    if (referenceVisionAnalysis) {
      userMsg += isChinese
        ? `\n\n## 參考設計分析\n用戶提供了一張參考設計圖片，以下是分析結果，請讓概念風格與參考一致：\n${referenceVisionAnalysis}`
        : `\n\n## Reference Design Analysis\nThe user provided a reference design image. Align the concept style with this analysis:\n${referenceVisionAnalysis}`
    }

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: getAnthropicHeaders(),
      body: JSON.stringify({
        model: MODEL.HAIKU,
        max_tokens: 600,
        temperature: 0.5,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMsg }],
      }),
    })

    if (!resp.ok) {
      logger.warn({ status: resp.status }, 'FastConcept API 錯誤，降級跳過')
      return null
    }

    const data = await resp.json() as {
      content?: Array<{ text?: string }>
      usage?: { input_tokens?: number; output_tokens?: number }
    }

    if (data.usage) {
      const inputTokens = data.usage.input_tokens || 0
      const outputTokens = data.usage.output_tokens || 0
      trackLlmUsage({
        model: MODEL.HAIKU,
        inputTokens,
        outputTokens,
        purpose: 'fast_build_concept',
        userId: context?.userId,
        conversationId: context?.conversationId,
      })
    }

    const text = data.content?.[0]?.text
    if (!text) {
      logger.warn('FastConcept 空回應，降級跳過')
      return null
    }

    // 解析 JSON（safeParseJson 四層防禦 + 截斷修復）
    let parsed = safeParseJson<Partial<FastConcept>>(text)
    if (!parsed) {
      // 第五層：max_tokens 截斷修復 — 嘗試補齊未閉合的 JSON
      const braceStart = text.indexOf('{')
      if (braceStart >= 0) {
        let truncated = text.slice(braceStart)
          .replace(/,\s*$/, '')           // 移除尾隨逗號
        // 補齊未閉合的陣列和物件
        const openBrackets = (truncated.match(/\[/g) || []).length - (truncated.match(/\]/g) || []).length
        const openBraces = (truncated.match(/\{/g) || []).length - (truncated.match(/\}/g) || []).length
        // 截斷可能在字串值中間，嘗試關閉當前字串
        if ((truncated.match(/"/g) || []).length % 2 !== 0) {
          truncated += '"'
        }
        truncated += ']'.repeat(Math.max(0, openBrackets))
        truncated += '}'.repeat(Math.max(0, openBraces))
        parsed = safeParseJson<Partial<FastConcept>>(truncated)
        if (parsed) {
          logger.info('FastConcept JSON 截斷修復成功')
        }
      }
    }
    if (!parsed) {
      logger.warn({ textPreview: text.slice(0, 200) }, 'FastConcept 無法解析 JSON，降級跳過')
      return null
    }
    if (!parsed.name || !parsed.vibe || !parsed.signatureElement) {
      logger.warn('FastConcept 缺少必要欄位，降級跳過')
      return null
    }

    // 驗證 suggestedTier
    if (parsed.suggestedTier && parsed.suggestedTier !== 'functional' && parsed.suggestedTier !== 'creative') {
      parsed.suggestedTier = undefined
    }

    // 驗證 suggestedPages
    let suggestedPages: string[] | undefined
    if (Array.isArray(parsed.suggestedPages)) {
      suggestedPages = parsed.suggestedPages
        .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
        .slice(0, 4)
      if (suggestedPages.length === 0) suggestedPages = undefined
    }

    const result = {
      name: parsed.name,
      vibe: parsed.vibe,
      signatureElement: parsed.signatureElement,
      keyFeatures: Array.isArray(parsed.keyFeatures) ? parsed.keyFeatures.slice(0, 5) : [],
      suggestedTier: parsed.suggestedTier,
      suggestedPages,
    }
    rememberCacheValue(FAST_CONCEPT_CACHE, cacheKey, result)
    return result
  } catch (err) {
    logger.warn({ err }, 'FastConcept 生成失敗，降級跳過')
    return null
  }
}

// ============================================================
// Haiku Prompt 擴展（將簡短描述擴展為完整網站需求）
// ============================================================

/**
 * 用 1 次 Haiku 將簡短描述擴展為完整的網站內容需求
 * 跳過條件：描述已經夠詳細（中文 > 80 字 或 英文 > 40 詞）
 * 失敗時 return null（降級用原始描述）
 */
export async function expandBriefPrompt(
  description: string,
  productType: string,
  pages: string[],
  context?: { userId?: string; conversationId?: string }
): Promise<string | null> {
  if (!shouldExpandBriefPrompt(description, pages)) {
    logger.info('ExpandPrompt 描述已夠詳細，跳過擴展')
    return null
  }

  const cacheKey = buildFastCacheKey('expand-prompt', [description, productType, pages.join('|')])
  const cached = EXPANDED_PROMPT_CACHE.get(cacheKey)
  if (cached) {
    logger.info({ productType }, 'ExpandPrompt cache hit')
    return cached
  }

  try {
    const isChinese = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(description)
    const pagesStr = pages.join('、')
    const label = PRODUCT_TYPE_LABELS[productType] || '網站'

    const systemPrompt = isChinese
      ? `你是網站內容策劃師。根據用戶的簡短描述，擴展為完整的網站內容需求。

規則：
1. 以提供的頁面列表為核心骨架，為每個頁面描述具體內容。可以微調頁面名稱，但不要刪除核心頁面
2. 每個頁面描述具體的區塊內容（Hero、特色、列表、CTA 等）
3. 提供具體的示範文案（真實的品名/價格/描述，不是 placeholder 如「項目1」「描述文字」）
4. 包含功能細節和 CTA 文案
5. 輸出 400-600 中文字的純文字描述
6. 不要輸出 JSON 或 markdown 格式標記`
      : `You are a website content planner. Expand the user's brief description into a complete website content requirement.

Rules:
1. Use the provided page list as the core skeleton, describe specific content for each page. You may fine-tune page names but do not remove core pages
2. Describe specific sections for each page (Hero, Features, List, CTA, etc.)
3. Provide concrete sample copy (real names/prices/descriptions, NOT placeholders like "Item 1" or "Description text")
4. Include functional details and CTA copy
5. Output 200-300 words of plain text description
6. Do not output JSON or markdown formatting`

    const userMsg = isChinese
      ? `用戶描述：${description}\n產品類型：${label}\n頁面列表：${pagesStr}`
      : `User description: ${description}\nProduct type: ${label}\nPages: ${pagesStr}`

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: getAnthropicHeaders(),
      body: JSON.stringify({
        model: MODEL.HAIKU,
        max_tokens: 1000,
        temperature: 0.6,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMsg }],
      }),
    })

    if (!resp.ok) {
      logger.warn({ status: resp.status }, 'ExpandPrompt API 錯誤，降級跳過')
      return null
    }

    const data = await resp.json() as {
      content?: Array<{ text?: string }>
      usage?: { input_tokens?: number; output_tokens?: number }
    }

    if (data.usage) {
      const inputTokens = data.usage.input_tokens || 0
      const outputTokens = data.usage.output_tokens || 0
      trackLlmUsage({
        model: MODEL.HAIKU,
        inputTokens,
        outputTokens,
        purpose: 'fast_build_prompt_expansion',
        userId: context?.userId,
        conversationId: context?.conversationId,
      })
    }

    const text = data.content?.[0]?.text?.trim()
    if (!text || text.length < 50) {
      logger.warn('ExpandPrompt 回應太短或空，降級跳過')
      return null
    }

    logger.info({ length: text.length }, 'ExpandPrompt 擴展成功')
    rememberCacheValue(EXPANDED_PROMPT_CACHE, cacheKey, text)
    return text
  } catch (err) {
    logger.warn({ err }, 'ExpandPrompt 擴展失敗，降級跳過')
    return null
  }
}
