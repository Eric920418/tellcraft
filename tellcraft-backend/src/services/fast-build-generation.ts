/**
 * Fast Build 生成服務
 * 快速模式專用的輔助函數：tier 偵測、產品推斷、默認 DesignSystem 建立
 * 零 LLM 成本 — 全部用規則式推斷
 */

import type { DesignTier, DesignSystem, TemplateData } from './uiux-generation'

// ============================================================
// Tier 偵測（規則式，零 LLM 成本）
// ============================================================

const CREATIVE_KEYWORDS = [
  'landing page', 'landing', '官網', '品牌', 'portfolio', '作品集', '展示',
  '餐廳', '咖啡', '工作室', 'studio', 'blog', '部落格', '個人網站',
  '創意', '有個性', '獨特', '酷', 'cool', '時尚', '潮流',
  '攝影', '設計師', '藝術', '音樂', '活動', 'event',
  '婚禮', '旅遊', '美食', '時裝', '精品', '酒吧', '花店',
]

const FUNCTIONAL_KEYWORDS = [
  'dashboard', '後台', '管理', '系統', 'saas', '平台', '工具',
  'crm', 'erp', '報表', '數據', 'admin', '控制台', '面板',
  '庫存', '訂單管理', '用戶管理', '分析', 'analytics',
  '專案管理', 'project management', '看板', 'kanban',
]

/**
 * 規則式 tier 偵測
 * creative 關鍵詞優先匹配，預設 creative（快速模式用戶大多做 landing page）
 */
export function detectDesignTier(description: string): DesignTier {
  const lower = description.toLowerCase()

  const functionalScore = FUNCTIONAL_KEYWORDS.filter(k => lower.includes(k)).length
  const creativeScore = CREATIVE_KEYWORDS.filter(k => lower.includes(k)).length

  if (functionalScore > creativeScore) return 'functional'
  return 'creative' // 預設 creative
}

// ============================================================
// 產品類型推斷
// ============================================================

const PRODUCT_TYPE_RULES: Array<{ keywords: string[]; type: string }> = [
  { keywords: ['餐廳', '餐飲', '美食', '菜單', 'menu', 'restaurant'], type: 'restaurant' },
  { keywords: ['咖啡', 'cafe', 'coffee'], type: 'cafe' },
  { keywords: ['portfolio', '作品集', '攝影', '設計師'], type: 'portfolio' },
  { keywords: ['blog', '部落格', '文章'], type: 'blog' },
  { keywords: ['dashboard', '後台', '管理', 'admin'], type: 'dashboard' },
  { keywords: ['saas', '平台', '工具', '系統'], type: 'saas' },
  { keywords: ['電商', '商店', '購物', 'shop', 'store', 'ecommerce'], type: 'ecommerce' },
  { keywords: ['landing', '官網', '品牌', '公司', '企業'], type: 'landing' },
  { keywords: ['活動', 'event', '婚禮', '派對'], type: 'event' },
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
  portfolio: ['首頁', '作品集', '關於我', '聯繫'],
  blog: ['首頁', '文章列表', '關於'],
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
  const pageKeywords = ['首頁', '關於', '聯繫', '菜單', '作品', '價格', '功能', '文章', '產品', '服務', '團隊', '常見問題', 'FAQ']
  const negativePatterns = ['不要', '不需要', '不用', '沒有', '去掉', '移除']
  // 子句分隔符（中英文標點）
  const clauseSeparators = /[，。,\.、；;！!？?]/
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
// 默認 DesignSystem（零 LLM 成本）
// ============================================================

/**
 * 建立 tier-based 默認 DesignSystem
 * 提供合理的預設值，具體配色由 LLM 在 generateStructure 中決定
 */
export function buildDefaultDesignSystem(tier: DesignTier): DesignSystem {
  if (tier === 'functional') {
    return {
      cssVariables: `:root {
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --color-accent: #3b82f6;
  --color-background: #ffffff;
  --color-foreground: #0f172a;
  --color-muted: #f1f5f9;
  --color-border: #e2e8f0;
}`,
      tailwindExtend: {
        colors: {
          primary: '#3b82f6',
          secondary: '#64748b',
          accent: '#3b82f6',
          background: '#ffffff',
          foreground: '#0f172a',
          muted: '#f1f5f9',
          border: '#e2e8f0',
        },
        fontFamily: {
          sans: ['DM Sans', 'system-ui', 'sans-serif'],
          mono: ['JetBrains Mono', 'monospace'],
        },
      },
      typography: {
        fontFamily: 'DM Sans',
        scale: {
          'text-xs': '0.75rem',
          'text-sm': '0.875rem',
          'text-base': '1rem',
          'text-lg': '1.125rem',
          'text-xl': '1.25rem',
          'text-2xl': '1.5rem',
          'text-3xl': '1.875rem',
          'text-4xl': '2.25rem',
        },
      },
      colorPalette: {
        primary: '#3b82f6',
        secondary: '#64748b',
        accent: '#3b82f6',
        background: '#ffffff',
        foreground: '#0f172a',
        muted: '#f1f5f9',
        border: '#e2e8f0',
        destructive: '#ef4444',
        success: '#22c55e',
      },
      spacing: {
        unit: 4,
        scale: { sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem', '2xl': '3rem' },
      },
      borderRadius: {
        none: '0',
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        full: '9999px',
      },
    }
  }

  // creative tier — 更大膽的預設
  return {
    cssVariables: `:root {
  --color-primary: #6366f1;
  --color-secondary: #a855f7;
  --color-accent: #f59e0b;
  --color-background: #fafafa;
  --color-foreground: #18181b;
  --color-muted: #f4f4f5;
  --color-border: #e4e4e7;
}`,
    tailwindExtend: {
      colors: {
        primary: '#6366f1',
        secondary: '#a855f7',
        accent: '#f59e0b',
        background: '#fafafa',
        foreground: '#18181b',
        muted: '#f4f4f5',
        border: '#e4e4e7',
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
    },
    typography: {
      fontFamily: 'Outfit',
      scale: {
        'text-xs': '0.75rem',
        'text-sm': '0.875rem',
        'text-base': '1rem',
        'text-lg': '1.125rem',
        'text-xl': '1.25rem',
        'text-2xl': '1.5rem',
        'text-3xl': '1.875rem',
        'text-4xl': '2.25rem',
        'text-5xl': '3rem',
      },
    },
    colorPalette: {
      primary: '#6366f1',
      secondary: '#a855f7',
      accent: '#f59e0b',
      background: '#fafafa',
      foreground: '#18181b',
      muted: '#f4f4f5',
      border: '#e4e4e7',
      destructive: '#ef4444',
      success: '#22c55e',
    },
    spacing: {
      unit: 4,
      scale: { sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem', '2xl': '3rem', '3xl': '4rem' },
    },
    borderRadius: {
      none: '0',
      sm: '0.375rem',
      md: '0.75rem',
      lg: '1rem',
      full: '9999px',
    },
  }
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
  portfolio: `- 作品集頁：分類篩選（依作品類型），點擊作品打開詳情 Modal 或 Lightbox
- 聯繫頁：聯繫表單（姓名、Email、訊息），提交後顯示成功提示`,
  blog: `- 文章列表：搜尋框即時過濾文章、分類標籤篩選
- 文章頁：目錄導航（滾動到對應章節）`,
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
