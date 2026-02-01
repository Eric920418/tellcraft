// ============================================================
// UIUX 模板系統 - 類型定義與初始資料
// ============================================================

// 模板分類
export type TemplateCategory = 'saas' | 'landing' | 'ecommerce' | 'content'

// 設計風格
export type DesignStyle = 'minimal' | 'modern' | 'professional' | 'playful' | 'elegant'

// 色彩模式
export type ColorMode = 'light' | 'dark' | 'both'

// UiuxDesignBrief - 設計簡報
export interface UiuxDesignBrief {
  style: DesignStyle
  colorMode: ColorMode
  primaryColor?: string      // 主色調 hex
  accentColor?: string       // 強調色 hex
  fontFamily?: string        // 字體家族
  borderRadius?: 'none' | 'small' | 'medium' | 'large' | 'full'
  spacing?: 'compact' | 'normal' | 'spacious'
}

// 頁面結構
export interface PageStructure {
  pages: string[]           // 頁面列表 e.g., ['home', 'pricing', 'about']
  components: string[]      // 元件列表 e.g., ['hero', 'features', 'cta']
}

// 模板介面
export interface Template {
  id: string
  name: string
  slug: string
  category: TemplateCategory
  description: string
  thumbnailUrl: string
  previewImageUrl: string
  tags: string[]
  designDefaults: UiuxDesignBrief
  pageStructure: PageStructure
  isActive: boolean
  isFeatured: boolean
  sortOrder: number
}

// 模板卡片資料（前端顯示用）
export interface TemplateCardData {
  id: string
  name: string
  slug: string
  category: TemplateCategory
  description: string
  thumbnailUrl: string
  tags: string[]
  isFeatured: boolean
}

// ============================================================
// 初始模板資料（5 個起步）
// ============================================================

export const INITIAL_TEMPLATES: Template[] = [
  {
    id: 'saas-minimal',
    name: 'SaaS Dashboard - 極簡',
    slug: 'saas-minimal',
    category: 'saas',
    description: '簡潔的 SaaS 控制台模板，強調留白與易讀性。適合數據驅動的應用。',
    thumbnailUrl: '/templates/thumbnails/saas-minimal.png',
    previewImageUrl: '/templates/previews/saas-minimal.png',
    tags: ['minimal', 'light', 'dashboard', 'analytics'],
    designDefaults: {
      style: 'minimal',
      colorMode: 'light',
      primaryColor: '#000000',
      accentColor: '#3B82F6',
      fontFamily: 'Inter',
      borderRadius: 'small',
      spacing: 'spacious'
    },
    pageStructure: {
      pages: ['dashboard', 'analytics', 'settings', 'profile'],
      components: ['sidebar', 'stats-card', 'chart', 'data-table', 'header']
    },
    isActive: true,
    isFeatured: true,
    sortOrder: 1
  },
  {
    id: 'saas-pro',
    name: 'SaaS Dashboard - 專業',
    slug: 'saas-pro',
    category: 'saas',
    description: '專業級深色 SaaS 控制台，適合開發者工具和進階分析平台。',
    thumbnailUrl: '/templates/thumbnails/saas-pro.png',
    previewImageUrl: '/templates/previews/saas-pro.png',
    tags: ['professional', 'dark', 'dashboard', 'developer'],
    designDefaults: {
      style: 'professional',
      colorMode: 'dark',
      primaryColor: '#FFFFFF',
      accentColor: '#8B5CF6',
      fontFamily: 'JetBrains Mono',
      borderRadius: 'medium',
      spacing: 'normal'
    },
    pageStructure: {
      pages: ['dashboard', 'projects', 'api-keys', 'logs', 'settings'],
      components: ['sidebar', 'terminal', 'code-block', 'metrics', 'header']
    },
    isActive: true,
    isFeatured: true,
    sortOrder: 2
  },
  {
    id: 'landing-startup',
    name: 'Startup Landing Page',
    slug: 'landing-startup',
    category: 'landing',
    description: '現代感十足的新創公司 Landing Page，活潑的漸層色彩與動態效果。',
    thumbnailUrl: '/templates/thumbnails/landing-startup.png',
    previewImageUrl: '/templates/previews/landing-startup.png',
    tags: ['modern', 'vibrant', 'gradient', 'startup'],
    designDefaults: {
      style: 'modern',
      colorMode: 'light',
      primaryColor: '#6366F1',
      accentColor: '#EC4899',
      fontFamily: 'Plus Jakarta Sans',
      borderRadius: 'large',
      spacing: 'spacious'
    },
    pageStructure: {
      pages: ['home', 'features', 'pricing', 'about', 'contact'],
      components: ['hero', 'features-grid', 'testimonials', 'pricing-table', 'cta', 'footer']
    },
    isActive: true,
    isFeatured: true,
    sortOrder: 3
  },
  {
    id: 'landing-corporate',
    name: 'Corporate Website',
    slug: 'landing-corporate',
    category: 'landing',
    description: '專業企業官網模板，穩重的配色與清晰的資訊層次。',
    thumbnailUrl: '/templates/thumbnails/landing-corporate.png',
    previewImageUrl: '/templates/previews/landing-corporate.png',
    tags: ['professional', 'clean', 'corporate', 'business'],
    designDefaults: {
      style: 'professional',
      colorMode: 'light',
      primaryColor: '#1E3A5F',
      accentColor: '#0EA5E9',
      fontFamily: 'Noto Sans TC',
      borderRadius: 'small',
      spacing: 'normal'
    },
    pageStructure: {
      pages: ['home', 'services', 'about', 'team', 'contact'],
      components: ['hero', 'services-list', 'about-section', 'team-grid', 'contact-form', 'footer']
    },
    isActive: true,
    isFeatured: false,
    sortOrder: 4
  },
  {
    id: 'ecommerce-modern',
    name: 'Modern E-commerce',
    slug: 'ecommerce-modern',
    category: 'ecommerce',
    description: '現代電商模板，極簡設計讓產品成為主角，流暢的購物體驗。',
    thumbnailUrl: '/templates/thumbnails/ecommerce-modern.png',
    previewImageUrl: '/templates/previews/ecommerce-modern.png',
    tags: ['minimal', 'light', 'ecommerce', 'shop'],
    designDefaults: {
      style: 'minimal',
      colorMode: 'light',
      primaryColor: '#18181B',
      accentColor: '#F59E0B',
      fontFamily: 'Inter',
      borderRadius: 'medium',
      spacing: 'normal'
    },
    pageStructure: {
      pages: ['home', 'products', 'product-detail', 'cart', 'checkout'],
      components: ['header', 'product-grid', 'product-card', 'cart-drawer', 'checkout-form', 'footer']
    },
    isActive: true,
    isFeatured: true,
    sortOrder: 5
  }
]

// ============================================================
// 工具函數
// ============================================================

/**
 * 根據分類過濾模板
 */
export function filterTemplatesByCategory(
  templates: Template[],
  category: TemplateCategory | 'all'
): Template[] {
  if (category === 'all') return templates
  return templates.filter(t => t.category === category)
}

/**
 * 根據標籤過濾模板
 */
export function filterTemplatesByTag(templates: Template[], tag: string): Template[] {
  return templates.filter(t => t.tags.includes(tag))
}

/**
 * 取得推薦模板
 */
export function getFeaturedTemplates(templates: Template[]): Template[] {
  return templates.filter(t => t.isFeatured).sort((a, b) => a.sortOrder - b.sortOrder)
}

/**
 * 轉換為卡片資料格式
 */
export function toTemplateCardData(template: Template): TemplateCardData {
  return {
    id: template.id,
    name: template.name,
    slug: template.slug,
    category: template.category,
    description: template.description,
    thumbnailUrl: template.thumbnailUrl,
    tags: template.tags,
    isFeatured: template.isFeatured
  }
}

/**
 * 分類顯示名稱
 */
export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  saas: 'SaaS 應用',
  landing: 'Landing Page',
  ecommerce: '電商',
  content: '內容網站'
}

/**
 * 分類圖標
 */
export const CATEGORY_ICONS: Record<TemplateCategory, string> = {
  saas: '📊',
  landing: '🚀',
  ecommerce: '🛒',
  content: '📝'
}
