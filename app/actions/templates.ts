'use server'

import { supabase } from '../lib/supabase'
import {
  Template,
  TemplateCategory,
  TemplateCardData,
  INITIAL_TEMPLATES,
  toTemplateCardData,
  filterTemplatesByCategory,
  getFeaturedTemplates
} from '../lib/templates'

// ============================================================
// 類型定義
// ============================================================

interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// ============================================================
// 模板 Actions
// ============================================================

/**
 * 獲取所有啟用的模板
 * - 按 sortOrder 排序
 * - 可選：按分類過濾
 */
export async function getTemplates(input?: {
  category?: TemplateCategory | 'all'
  featuredOnly?: boolean
}): Promise<ActionResult<TemplateCardData[]>> {
  const { category = 'all', featuredOnly = false } = input || {}

  try {
    // 嘗試從資料庫獲取
    let query = supabase
      .from('templates')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (category !== 'all') {
      query = query.eq('category', category)
    }

    if (featuredOnly) {
      query = query.eq('is_featured', true)
    }

    const { data, error } = await query

    if (error) {
      // 資料庫查詢失敗，fallback 到靜態資料
      console.warn('Failed to fetch templates from DB, using static data:', error.message)
      let templates = INITIAL_TEMPLATES.filter(t => t.isActive)

      if (category !== 'all') {
        templates = filterTemplatesByCategory(templates, category)
      }

      if (featuredOnly) {
        templates = getFeaturedTemplates(templates)
      }

      return {
        success: true,
        data: templates.map(toTemplateCardData)
      }
    }

    // 轉換資料庫格式到應用格式
    const templates: TemplateCardData[] = data.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      name: row.name as string,
      slug: row.slug as string,
      category: row.category as TemplateCategory,
      description: row.description as string,
      thumbnailUrl: row.thumbnail_url as string,
      tags: row.tags as string[],
      isFeatured: row.is_featured as boolean
    }))

    return { success: true, data: templates }
  } catch {
    // Fallback to static data
    let templates = INITIAL_TEMPLATES.filter(t => t.isActive)

    if (category !== 'all') {
      templates = filterTemplatesByCategory(templates, category)
    }

    if (featuredOnly) {
      templates = getFeaturedTemplates(templates)
    }

    return {
      success: true,
      data: templates.map(toTemplateCardData)
    }
  }
}

/**
 * 根據 ID 獲取單個模板的完整資料
 */
export async function getTemplateById(
  templateId: string
): Promise<ActionResult<Template>> {
  try {
    // 嘗試從資料庫獲取
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (error) {
      // Fallback 到靜態資料
      const staticTemplate = INITIAL_TEMPLATES.find(t => t.id === templateId)
      if (staticTemplate) {
        return { success: true, data: staticTemplate }
      }
      return { success: false, error: '模板不存在' }
    }

    // 轉換資料庫格式
    const template: Template = {
      id: data.id,
      name: data.name,
      slug: data.slug,
      category: data.category,
      description: data.description,
      thumbnailUrl: data.thumbnail_url,
      previewImageUrl: data.preview_image_url,
      tags: data.tags,
      designDefaults: data.design_defaults,
      pageStructure: data.page_structure,
      isActive: data.is_active,
      isFeatured: data.is_featured,
      sortOrder: data.sort_order
    }

    return { success: true, data: template }
  } catch {
    // Fallback 到靜態資料
    const staticTemplate = INITIAL_TEMPLATES.find(t => t.id === templateId)
    if (staticTemplate) {
      return { success: true, data: staticTemplate }
    }
    return { success: false, error: '模板不存在' }
  }
}

/**
 * 根據 slug 獲取模板
 */
export async function getTemplateBySlug(
  slug: string
): Promise<ActionResult<Template>> {
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      const staticTemplate = INITIAL_TEMPLATES.find(t => t.slug === slug)
      if (staticTemplate) {
        return { success: true, data: staticTemplate }
      }
      return { success: false, error: '模板不存在' }
    }

    const template: Template = {
      id: data.id,
      name: data.name,
      slug: data.slug,
      category: data.category,
      description: data.description,
      thumbnailUrl: data.thumbnail_url,
      previewImageUrl: data.preview_image_url,
      tags: data.tags,
      designDefaults: data.design_defaults,
      pageStructure: data.page_structure,
      isActive: data.is_active,
      isFeatured: data.is_featured,
      sortOrder: data.sort_order
    }

    return { success: true, data: template }
  } catch {
    const staticTemplate = INITIAL_TEMPLATES.find(t => t.slug === slug)
    if (staticTemplate) {
      return { success: true, data: staticTemplate }
    }
    return { success: false, error: '模板不存在' }
  }
}

/**
 * 根據產品類型推薦模板
 * - 分析需求關鍵字，返回最相關的模板
 */
export async function getRecommendedTemplates(input: {
  productDescription: string
  maxResults?: number
}): Promise<ActionResult<TemplateCardData[]>> {
  const { productDescription, maxResults = 5 } = input
  const desc = productDescription.toLowerCase()

  // 關鍵字匹配規則
  const categoryScores: Record<TemplateCategory, number> = {
    saas: 0,
    landing: 0,
    ecommerce: 0,
    content: 0
  }

  // SaaS 關鍵字
  const saasKeywords = ['dashboard', '控制台', '後台', '管理系統', 'saas', 'b2b', '分析', 'analytics', '報表', '數據']
  saasKeywords.forEach(kw => {
    if (desc.includes(kw)) categoryScores.saas += 2
  })

  // Landing Page 關鍵字
  const landingKeywords = ['官網', 'landing', '產品頁', '品牌', '介紹', '公司', '企業', 'startup', '新創']
  landingKeywords.forEach(kw => {
    if (desc.includes(kw)) categoryScores.landing += 2
  })

  // 電商關鍵字
  const ecommerceKeywords = ['商店', '購物', '電商', 'ecommerce', '商品', '購買', '訂單', '結帳', '購物車']
  ecommerceKeywords.forEach(kw => {
    if (desc.includes(kw)) categoryScores.ecommerce += 2
  })

  // 內容網站關鍵字
  const contentKeywords = ['部落格', 'blog', '文章', '新聞', '資訊', '雜誌', '媒體']
  contentKeywords.forEach(kw => {
    if (desc.includes(kw)) categoryScores.content += 2
  })

  // 找出最高分的分類
  const sortedCategories = Object.entries(categoryScores)
    .sort((a, b) => b[1] - a[1])
    .filter(([, score]) => score > 0)
    .map(([category]) => category as TemplateCategory)

  // 獲取模板
  let templates = INITIAL_TEMPLATES.filter(t => t.isActive)

  // 如果有匹配的分類，優先顯示該分類的模板
  if (sortedCategories.length > 0) {
    const priorityTemplates = templates.filter(t =>
      sortedCategories.includes(t.category)
    )
    const otherTemplates = templates.filter(t =>
      !sortedCategories.includes(t.category)
    )
    templates = [...priorityTemplates, ...otherTemplates]
  } else {
    // 沒有明確匹配，顯示推薦模板
    templates = getFeaturedTemplates(templates)
  }

  return {
    success: true,
    data: templates.slice(0, maxResults).map(toTemplateCardData)
  }
}

/**
 * 初始化模板資料（將靜態資料寫入資料庫）
 * - 僅供管理員使用
 */
export async function initializeTemplates(): Promise<ActionResult<{ count: number }>> {
  try {
    // 將靜態模板轉換為資料庫格式
    const templateRows = INITIAL_TEMPLATES.map(t => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      category: t.category,
      description: t.description,
      thumbnail_url: t.thumbnailUrl,
      preview_image_url: t.previewImageUrl,
      tags: t.tags,
      design_defaults: t.designDefaults,
      page_structure: t.pageStructure,
      is_active: t.isActive,
      is_featured: t.isFeatured,
      sort_order: t.sortOrder
    }))

    // Upsert（避免重複插入）
    const { error } = await supabase
      .from('templates')
      .upsert(templateRows, { onConflict: 'id' })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: { count: templateRows.length } }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
