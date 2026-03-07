/**
 * Fast Build 生成服務
 * 快速模式專用的輔助函數：tier 偵測、產品推斷、默認 DesignSystem 建立
 * 大部分零 LLM 成本（規則式推斷），generateFastConcept 使用 1 次 Haiku
 */

import type { DesignTier, DesignSystem, TemplateData } from './uiux-generation'
import { matchTemplates } from './template-matcher'
import { queryOne, recordLlmUsage } from '../db/client'
import { getAnthropicHeaders, MODEL } from '../lib/anthropic'
import { createLogger } from '../lib/logger'

const logger = createLogger('fast-build-generation')

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
  // ── 工具型產品（放在泛用類型前面，避免被 saas 搶走）──
  {
    keywords: [
      '計算機', 'calculator', '轉換器', 'converter',
      '看板', 'kanban', 'todo', '待辦', '清單', 'checklist',
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
  restaurant: ['首頁', '菜單', '關於我們', '聯繫'],
  cafe: ['首頁', '菜單', '關於', '聯繫'],
  fitness: ['首頁', '課表', '教練', '聯繫'],
  healthcare: ['首頁', '科別介紹', '醫師團隊', '聯繫'],
  education: ['首頁', '課程列表', '師資', '聯繫'],
  realestate: ['首頁', '物件列表', '關於', '聯繫'],
  travel: ['首頁', '行程列表', '關於', '聯繫'],
  agency: ['首頁', '案例', '服務', '聯繫'],
  salon: ['首頁', '服務項目', '預約', '聯繫'],
  legal: ['首頁', '服務領域', '律師團隊', '聯繫'],
  finance: ['首頁', '服務', '關於', '聯繫'],
  nonprofit: ['首頁', '使命', '活動', '捐款'],
  retail: ['首頁', '產品', '門市', '聯繫'],
  hotel: ['首頁', '房型', '設施', '訂房'],
  wedding: ['首頁', '作品', '方案', '聯繫'],
  music: ['首頁', '音樂', '演出', '聯繫'],
  photography: ['首頁', '作品集', '方案', '聯繫'],
  portfolio: ['首頁', '作品集', '關於我', '聯繫'],
  blog: ['首頁', '文章列表', '關於'],
  tool: ['主頁面'],
  dashboard: ['Dashboard'],
  saas: ['首頁', '功能介紹', '價格', '聯繫'],
  ecommerce: ['首頁', '產品列表', '關於', '聯繫'],
  landing: ['首頁'],
  event: ['首頁', '活動詳情', '報名'],
  personal: ['首頁', '關於我', '聯繫'],
}

/**
 * 推斷頁面列表
 */
export function inferPages(description: string, productType: string): string[] {
  // 先嘗試從描述中提取明確提到的頁面
  const pageKeywords = ['首頁', '關於', '聯繫', '菜單', '作品', '價格', '功能', '文章', '產品', '服務', '團隊', '常見問題', 'FAQ', '課表', '教練', '醫師', '科別', '物件', '行程', '案例', '預約', '門市', '房型', '設施', '訂房', '捐款', '演出', '方案', '師資', '課程', '聯絡', '新聞', '最新消息', '下載', '支援', '幫助', '會員', '儀表板']
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

// ============================================================
// 產業別配色系統
// ============================================================

interface IndustryPalette {
  primary: string; secondary: string; accent: string
  background: string; foreground: string; muted: string; border: string
  fontFamily: string; displayFont?: string
}

const INDUSTRY_COLOR_PALETTES: Record<string, IndustryPalette> = {
  // 餐飲類 — 暖色調
  restaurant: {
    primary: '#b45309', secondary: '#78350f', accent: '#d97706',
    background: '#fffbeb', foreground: '#1c1917', muted: '#fef3c7', border: '#fde68a',
    fontFamily: 'DM Sans', displayFont: 'Playfair Display',
  },
  cafe: {
    primary: '#92400e', secondary: '#78350f', accent: '#b45309',
    background: '#fefce8', foreground: '#1c1917', muted: '#fef9c3', border: '#fde047',
    fontFamily: 'DM Sans', displayFont: 'Lora',
  },
  // 健康/醫療 — 冷靜淺綠+藍
  healthcare: {
    primary: '#0d9488', secondary: '#0f766e', accent: '#14b8a6',
    background: '#f0fdfa', foreground: '#0f172a', muted: '#ccfbf1', border: '#99f6e4',
    fontFamily: 'DM Sans',
  },
  fitness: {
    primary: '#059669', secondary: '#047857', accent: '#10b981',
    background: '#f0fdf4', foreground: '#0f172a', muted: '#dcfce7', border: '#bbf7d0',
    fontFamily: 'Outfit',
  },
  // 專業服務 — 穩重深藍/灰
  legal: {
    primary: '#1e3a5f', secondary: '#334155', accent: '#2563eb',
    background: '#f8fafc', foreground: '#0f172a', muted: '#f1f5f9', border: '#e2e8f0',
    fontFamily: 'DM Sans', displayFont: 'Playfair Display',
  },
  finance: {
    primary: '#1e40af', secondary: '#1e3a8a', accent: '#3b82f6',
    background: '#eff6ff', foreground: '#0f172a', muted: '#dbeafe', border: '#bfdbfe',
    fontFamily: 'DM Sans',
  },
  realestate: {
    primary: '#0369a1', secondary: '#075985', accent: '#0ea5e9',
    background: '#f0f9ff', foreground: '#0f172a', muted: '#e0f2fe', border: '#bae6fd',
    fontFamily: 'DM Sans',
  },
  // 教育 — 知性藍紫
  education: {
    primary: '#4f46e5', secondary: '#4338ca', accent: '#6366f1',
    background: '#fafafe', foreground: '#1e1b4b', muted: '#eef2ff', border: '#e0e7ff',
    fontFamily: 'DM Sans',
  },
  // 創意/藝術 — 大膽對比
  portfolio: {
    primary: '#18181b', secondary: '#3f3f46', accent: '#f59e0b',
    background: '#fafafa', foreground: '#18181b', muted: '#f4f4f5', border: '#e4e4e7',
    fontFamily: 'Outfit', displayFont: 'Sora',
  },
  photography: {
    primary: '#18181b', secondary: '#27272a', accent: '#a3a3a3',
    background: '#fafafa', foreground: '#18181b', muted: '#f5f5f5', border: '#e5e5e5',
    fontFamily: 'Outfit', displayFont: 'Playfair Display',
  },
  music: {
    primary: '#7c3aed', secondary: '#6d28d9', accent: '#a78bfa',
    background: '#faf5ff', foreground: '#1e1b4b', muted: '#f3e8ff', border: '#e9d5ff',
    fontFamily: 'Outfit', displayFont: 'Sora',
  },
  // 美容/時尚 — 柔和粉色調
  salon: {
    primary: '#be185d', secondary: '#9d174d', accent: '#ec4899',
    background: '#fff1f2', foreground: '#1c1917', muted: '#ffe4e6', border: '#fecdd3',
    fontFamily: 'DM Sans', displayFont: 'Playfair Display',
  },
  wedding: {
    primary: '#be123c', secondary: '#9f1239', accent: '#f43f5e',
    background: '#fff1f2', foreground: '#1c1917', muted: '#ffe4e6', border: '#fecdd3',
    fontFamily: 'DM Sans', displayFont: 'Cormorant Garamond',
  },
  // 旅遊/飯店 — 自然色系
  travel: {
    primary: '#0891b2', secondary: '#0e7490', accent: '#06b6d4',
    background: '#ecfeff', foreground: '#0f172a', muted: '#cffafe', border: '#a5f3fc',
    fontFamily: 'Outfit',
  },
  hotel: {
    primary: '#78350f', secondary: '#92400e', accent: '#d97706',
    background: '#fffbeb', foreground: '#1c1917', muted: '#fef3c7', border: '#fde68a',
    fontFamily: 'DM Sans', displayFont: 'Playfair Display',
  },
  // 公益 — 溫暖綠色
  nonprofit: {
    primary: '#15803d', secondary: '#166534', accent: '#22c55e',
    background: '#f0fdf4', foreground: '#14532d', muted: '#dcfce7', border: '#bbf7d0',
    fontFamily: 'DM Sans',
  },
  // 電商/零售 — 活力明亮
  ecommerce: {
    primary: '#ea580c', secondary: '#c2410c', accent: '#f97316',
    background: '#fff7ed', foreground: '#1c1917', muted: '#ffedd5', border: '#fed7aa',
    fontFamily: 'Outfit',
  },
  retail: {
    primary: '#dc2626', secondary: '#b91c1c', accent: '#ef4444',
    background: '#fef2f2', foreground: '#1c1917', muted: '#fee2e2', border: '#fecaca',
    fontFamily: 'Outfit',
  },
  // 工具型 — 清爽功能導向
  tool: {
    primary: '#3b82f6', secondary: '#64748b', accent: '#10b981',
    background: '#ffffff', foreground: '#0f172a', muted: '#f8fafc', border: '#e2e8f0',
    fontFamily: 'DM Sans',
  },
  // 代理/行銷 — 現代感
  agency: {
    primary: '#6366f1', secondary: '#4f46e5', accent: '#818cf8',
    background: '#fafafa', foreground: '#18181b', muted: '#f4f4f5', border: '#e4e4e7',
    fontFamily: 'Outfit', displayFont: 'Sora',
  },
  // 部落格 — 閱讀導向
  blog: {
    primary: '#18181b', secondary: '#3f3f46', accent: '#6366f1',
    background: '#fafafa', foreground: '#18181b', muted: '#f4f4f5', border: '#e4e4e7',
    fontFamily: 'DM Sans', displayFont: 'Lora',
  },
  // 管理後台 — 功能導向
  dashboard: {
    primary: '#3b82f6', secondary: '#64748b', accent: '#10b981',
    background: '#ffffff', foreground: '#0f172a', muted: '#f1f5f9', border: '#e2e8f0',
    fontFamily: 'DM Sans',
  },
  // 活動 — 紫色+金色活力
  event: {
    primary: '#7c3aed', secondary: '#6d28d9', accent: '#f59e0b',
    background: '#faf5ff', foreground: '#1e1b4b', muted: '#f3e8ff', border: '#e9d5ff',
    fontFamily: 'Outfit', displayFont: 'Sora',
  },
  // Landing — 現代靛+金
  landing: {
    primary: '#6366f1', secondary: '#4f46e5', accent: '#f59e0b',
    background: '#fafafa', foreground: '#18181b', muted: '#f4f4f5', border: '#e4e4e7',
    fontFamily: 'Outfit', displayFont: 'Sora',
  },
  // 個人網站 — 暖色調
  personal: {
    primary: '#18181b', secondary: '#3f3f46', accent: '#f59e0b',
    background: '#fafafa', foreground: '#18181b', muted: '#f4f4f5', border: '#e4e4e7',
    fontFamily: 'Outfit',
  },
  // SaaS — 科技感
  saas: {
    primary: '#6366f1', secondary: '#4f46e5', accent: '#06b6d4',
    background: '#fafafa', foreground: '#18181b', muted: '#f4f4f5', border: '#e4e4e7',
    fontFamily: 'DM Sans',
  },
}

// ============================================================
// 默認 DesignSystem（零 LLM 成本）
// ============================================================

/**
 * 從 IndustryPalette 建構完整 DesignSystem
 */
function paletteToDesignSystem(p: IndustryPalette, tier: DesignTier): DesignSystem {
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
}`,
    tailwindExtend: {
      colors: {
        primary: p.primary, secondary: p.secondary, accent: p.accent,
        background: p.background, foreground: p.foreground, muted: p.muted, border: p.border,
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
  }
}

// Tier 預設配色（無產業匹配時的 fallback）
const TIER_FALLBACK_PALETTES: Record<DesignTier, IndustryPalette> = {
  functional: {
    primary: '#3b82f6', secondary: '#64748b', accent: '#3b82f6',
    background: '#ffffff', foreground: '#0f172a', muted: '#f1f5f9', border: '#e2e8f0',
    fontFamily: 'DM Sans',
  },
  creative: {
    primary: '#6366f1', secondary: '#a855f7', accent: '#f59e0b',
    background: '#fafafa', foreground: '#18181b', muted: '#f4f4f5', border: '#e4e4e7',
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
  return paletteToDesignSystem(palette, tier)
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
  fitness: `- 課表頁：週曆/日曆切換，點擊時段查看課程詳情
- 教練頁：教練卡片，點擊展開詳細資歷 Modal
- 聯繫頁：免費體驗預約表單（日期+時段+姓名+電話）`,
  healthcare: `- 科別介紹：Tab 或 Accordion 切換不同科別
- 醫師團隊：醫師卡片，點擊展開專長與經歷
- 線上掛號：選擇科別 → 選擇醫師 → 選擇日期時段 → 填資料 → 確認`,
  education: `- 課程列表：分類篩選（依難度/類型），搜尋框即時過濾
- 課程詳情：章節大綱 Accordion + 報名按鈕 → Modal 表單
- 師資介紹：教師卡片，點擊展開經歷`,
  realestate: `- 物件列表：篩選（地區/價格/坪數/類型），搜尋框
- 物件卡片：點擊查看詳情（Modal 或跳轉，含照片輪播）
- 聯繫表單：物件編號自動帶入，姓名+電話+訊息`,
  travel: `- 行程列表：篩選（目的地/天數/價格），搜尋框
- 行程卡片：點擊查看詳情（含日程表、照片、價格）
- 報名表單：選擇日期 + 人數 → 填寫資料 → 送出`,
  agency: `- 案例展示：分類篩選（依服務類型），Lightbox 瀏覽
- 服務介紹：Tab 切換不同服務項目
- 聯繫表單：姓名、公司、Email、需求描述`,
  salon: `- 服務項目：分類（剪髮/染燙/護理），價格表
- 預約系統：選擇服務 → 選設計師 → 選日期時段 → 填資料
- 作品展示：照片牆 Lightbox，before/after 對比`,
  legal: `- 服務領域：Accordion 或 Tab 展開各領域說明
- 律師團隊：律師卡片，點擊查看專長/學歷/經歷
- 免費諮詢表單：姓名、電話、Email、案件簡述`,
  finance: `- 服務項目：Tab 切換（理財/保險/稅務等）
- 試算工具（如適用）：輸入欄位 → 即時計算結果
- 諮詢預約表單：姓名、電話、需求類型下拉選擇`,
  nonprofit: `- 捐款區：金額選擇按鈕 + 自訂金額輸入
- 活動列表：時間軸或卡片，點擊查看詳情
- 志工報名表單：姓名、Email、可用時段`,
  retail: `- 產品展示：分類篩選 + 搜尋框
- 門市資訊：地圖嵌入（或列表），營業時間
- 聯繫表單 + 會員優惠申請`,
  hotel: `- 房型介紹：Tab 或卡片切換不同房型（含照片輪播）
- 設施服務：Icon Grid + 點擊展開說明
- 訂房表單：入住/退房日期 + 房型 + 人數 → 送出`,
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
  saas: `- 價格頁：月付/年付切換（toggle 控制顯示不同價格）
- 功能頁：Tab 或 Accordion 切換不同功能模組說明
- CTA 按鈕：點擊滾動到註冊區域或打開註冊 Modal
- 聯繫頁：聯繫表單，提交後顯示成功提示`,
  ecommerce: `- 產品列表：分類篩選 + 搜尋框即時過濾
- 產品卡片：點擊查看詳情（Modal 或跳轉）
- 加入購物車按鈕：點擊後更新購物車計數
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

const HAIKU_PRICING = { input: 0.8, output: 4 }

export interface FastConcept {
  name: string
  vibe: string
  signatureElement: string
  keyFeatures: string[]
  suggestedTier?: DesignTier
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
  context?: { userId?: string; conversationId?: string }
): Promise<FastConcept | null> {
  try {
    const isChinese = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(description)
    const systemPrompt = isChinese
      ? `你是設計顧問。根據產品描述生成設計概念。回覆嚴格 JSON（無其他文字）：
{"name":"概念名稱(2-4字)","vibe":"設計氛圍描述(1句話)","signatureElement":"一個招牌視覺元素(具體的設計手法)","keyFeatures":["設計特徵1","設計特徵2","設計特徵3"],"suggestedTier":"functional或creative"}
suggestedTier 判斷規則：dashboard/admin/SaaS 工具型 → functional；品牌展示/創意/個性化 → creative。
讓概念獨特，避免泛用描述。signatureElement 要具體到能直接寫代碼（如「hero 區域的漸層玻璃態卡片」而非「現代設計」）。`
      : `You are a design consultant. Generate a design concept from the product description. Reply strictly JSON (no other text):
{"name":"Concept name(2-4 words)","vibe":"Design vibe(1 sentence)","signatureElement":"One signature visual element(specific design technique)","keyFeatures":["Feature 1","Feature 2","Feature 3"],"suggestedTier":"functional or creative"}
suggestedTier rules: dashboard/admin/SaaS tools → functional; brand/creative/personality → creative.
Make the concept unique. signatureElement must be specific enough to code (e.g. "frosted glass hero cards with gradient border" not "modern design").`

    const userMsg = isChinese
      ? `產品：${description}\n類型：${productType}\n當前 tier：${tier}\n主色：${primaryColor}`
      : `Product: ${description}\nType: ${productType}\nCurrent tier: ${tier}\nPrimary color: ${primaryColor}`

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: getAnthropicHeaders(),
      body: JSON.stringify({
        model: MODEL.HAIKU,
        max_tokens: 300,
        temperature: 0.7,
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
      const cost = (inputTokens * HAIKU_PRICING.input + outputTokens * HAIKU_PRICING.output) / 1_000_000
      recordLlmUsage({
        model: MODEL.HAIKU,
        inputTokens,
        outputTokens,
        costUsd: cost,
        purpose: 'fast_build_concept',
        userId: context?.userId,
        conversationId: context?.conversationId,
      }).catch(err => logger.error({ err }, 'FastConcept 記錄用量失敗'))
    }

    const text = data.content?.[0]?.text
    if (!text) {
      logger.warn('FastConcept 空回應，降級跳過')
      return null
    }

    // 解析 JSON（容忍 markdown code fence）
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      logger.warn('FastConcept 無法解析 JSON，降級跳過')
      return null
    }

    const parsed = JSON.parse(jsonMatch[0]) as Partial<FastConcept>
    if (!parsed.name || !parsed.vibe || !parsed.signatureElement) {
      logger.warn('FastConcept 缺少必要欄位，降級跳過')
      return null
    }

    // 驗證 suggestedTier
    if (parsed.suggestedTier && parsed.suggestedTier !== 'functional' && parsed.suggestedTier !== 'creative') {
      parsed.suggestedTier = undefined
    }

    return {
      name: parsed.name,
      vibe: parsed.vibe,
      signatureElement: parsed.signatureElement,
      keyFeatures: Array.isArray(parsed.keyFeatures) ? parsed.keyFeatures.slice(0, 5) : [],
      suggestedTier: parsed.suggestedTier,
    }
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
  // 跳過條件：描述已夠詳細
  const isChinese = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(description)
  if (isChinese) {
    const charCount = description.replace(/\s/g, '').length
    if (charCount > 80) {
      logger.info({ charCount }, 'ExpandPrompt 描述已夠詳細，跳過擴展')
      return null
    }
  } else {
    const wordCount = description.trim().split(/\s+/).length
    if (wordCount > 40) {
      logger.info({ wordCount }, 'ExpandPrompt description detailed enough, skipping expansion')
      return null
    }
  }

  try {
    const pagesStr = pages.join('、')
    const label = PRODUCT_TYPE_LABELS[productType] || '網站'

    const systemPrompt = isChinese
      ? `你是網站內容策劃師。根據用戶的簡短描述，擴展為完整的網站內容需求。

規則：
1. 頁面結構嚴格按照提供的頁面列表，不要自行新增頁面
2. 每個頁面描述具體的區塊內容（Hero、特色、列表、CTA 等）
3. 提供具體的示範文案（真實的品名/價格/描述，不是 placeholder 如「項目1」「描述文字」）
4. 包含功能細節和 CTA 文案
5. 輸出 400-600 中文字的純文字描述
6. 不要輸出 JSON 或 markdown 格式標記`
      : `You are a website content planner. Expand the user's brief description into a complete website content requirement.

Rules:
1. Follow the provided page list strictly, do not add new pages
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
      const cost = (inputTokens * HAIKU_PRICING.input + outputTokens * HAIKU_PRICING.output) / 1_000_000
      recordLlmUsage({
        model: MODEL.HAIKU,
        inputTokens,
        outputTokens,
        costUsd: cost,
        purpose: 'fast_build_prompt_expansion',
        userId: context?.userId,
        conversationId: context?.conversationId,
      }).catch(err => logger.error({ err }, 'ExpandPrompt 記錄用量失敗'))
    }

    const text = data.content?.[0]?.text?.trim()
    if (!text || text.length < 50) {
      logger.warn('ExpandPrompt 回應太短或空，降級跳過')
      return null
    }

    logger.info({ length: text.length }, 'ExpandPrompt 擴展成功')
    return text
  } catch (err) {
    logger.warn({ err }, 'ExpandPrompt 擴展失敗，降級跳過')
    return null
  }
}
