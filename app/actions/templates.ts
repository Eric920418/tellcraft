'use server'

import { getTranslations } from 'next-intl/server'

import {
  Template,
  TemplateCategory,
  TemplateCardData,
  INITIAL_TEMPLATES,
  toTemplateCardData,
  filterTemplatesByCategory,
  getFeaturedTemplates
} from '../lib/templates'
import * as vpsApi from '../lib/vps-api'
import { reviewTemplate as reviewTemplateApi, getTemplatePublicFiles as getTemplatePublicFilesApi, type TemplateFileData } from '../lib/vps-api'
import { getAuthToken } from '../lib/auth'

// ============================================================
// 類型定義
// ============================================================

interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// ============================================================
// 模板 Actions（透過 VPS API 存取資料庫）
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
    const result = await vpsApi.getTemplates({
      category: category === 'all' ? undefined : category,
      featuredOnly,
    })

    if (!result.success || !result.data) {
      // Fallback 到靜態資料
      console.warn('[Templates] VPS API failed, using static data:', result.error)
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

    // 轉換為 TemplateCardData
    const templates: TemplateCardData[] = result.data.templates.map(t => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      category: t.category as TemplateCategory,
      description: t.description,
      thumbnailUrl: t.thumbnailUrl,
      tags: t.tags,
      isFeatured: t.isFeatured,
      deployedUrl: t.deployedUrl ?? null,
      sourceProjectId: t.sourceProjectId ?? null,
    }))

    return { success: true, data: templates }
  } catch (err) {
    // Fallback 到靜態資料
    console.warn('[Templates] 異常，使用靜態資料:', err)
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
  const t = await getTranslations('actionErrors')
  try {
    const result = await vpsApi.getTemplateById({ templateId })

    if (!result.success || !result.data) {
      // Fallback 到靜態資料
      const staticTemplate = INITIAL_TEMPLATES.find(tmpl => tmpl.id === templateId)
      if (staticTemplate) {
        return { success: true, data: staticTemplate }
      }
      return { success: false, error: t('templateNotFound') }
    }

    const raw = result.data.template
    const template: Template = {
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      category: raw.category as TemplateCategory,
      description: raw.description,
      thumbnailUrl: raw.thumbnailUrl,
      previewImageUrl: raw.previewImageUrl || raw.thumbnailUrl, // fallback to thumbnail
      tags: raw.tags,
      designDefaults: raw.designDefaults as Template['designDefaults'],
      pageStructure: raw.pageStructure as Template['pageStructure'],
      isActive: raw.isActive,
      isFeatured: raw.isFeatured,
      sortOrder: raw.sortOrder
    }

    return { success: true, data: template }
  } catch {
    // Fallback 到靜態資料
    const staticTemplate = INITIAL_TEMPLATES.find(tmpl => tmpl.id === templateId)
    if (staticTemplate) {
      return { success: true, data: staticTemplate }
    }
    return { success: false, error: t('templateNotFound') }
  }
}

/**
 * 根據 slug 獲取模板
 */
export async function getTemplateBySlug(
  slug: string
): Promise<ActionResult<Template>> {
  const t = await getTranslations('actionErrors')
  try {
    const result = await vpsApi.getTemplateBySlug({ slug })

    if (!result.success || !result.data) {
      const staticTemplate = INITIAL_TEMPLATES.find(tmpl => tmpl.slug === slug)
      if (staticTemplate) {
        return { success: true, data: staticTemplate }
      }
      return { success: false, error: t('templateNotFound') }
    }

    const raw = result.data.template
    const template: Template = {
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      category: raw.category as TemplateCategory,
      description: raw.description,
      thumbnailUrl: raw.thumbnailUrl,
      previewImageUrl: raw.previewImageUrl || raw.thumbnailUrl, // fallback to thumbnail
      tags: raw.tags,
      designDefaults: raw.designDefaults as Template['designDefaults'],
      pageStructure: raw.pageStructure as Template['pageStructure'],
      isActive: raw.isActive,
      isFeatured: raw.isFeatured,
      sortOrder: raw.sortOrder
    }

    return { success: true, data: template }
  } catch {
    const staticTemplate = INITIAL_TEMPLATES.find(tmpl => tmpl.slug === slug)
    if (staticTemplate) {
      return { success: true, data: staticTemplate }
    }
    return { success: false, error: t('templateNotFound') }
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
  const t = await getTranslations('actionErrors')
  const desc = productDescription.toLowerCase()

  // 關鍵字匹配規則
  const categoryScores: Record<TemplateCategory, number> = {
    saas: 0,
    landing: 0,
    ecommerce: 0,
    content: 0,
    portfolio: 0,
    dashboard: 0,
    blog: 0,
    event: 0,
    tool: 0,
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

  // 獲取所有模板
  const result = await getTemplates()
  if (!result.success || !result.data) {
    return { success: false, error: result.error || t('getTemplatesFailed') }
  }

  let templates = result.data

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
    templates = templates.filter(t => t.isFeatured)
  }

  return {
    success: true,
    data: templates.slice(0, maxResults)
  }
}

// ============================================================
// 模板提交 Actions
// ============================================================

/**
 * 模板提交 preflight 檢查
 */
export async function templateSubmitPreflight(
  projectId: string
): Promise<ActionResult<{
  checks: { hasPages: boolean; hasStyles: boolean; isDeployed: boolean; notDuplicate: boolean }
  passed: boolean
  errors: string[]
  prefilled: { name: string; category: string; tags: string[] }
}>> {
  try {
    const token = await getAuthToken()
    if (!token) return { success: false, error: '未登入' }

    const result = await vpsApi.templateSubmitPreflight({ token, projectId })
    if (!result.success || !result.data) {
      return { success: false, error: result.error || '檢查失敗' }
    }
    return { success: true, data: result.data }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

/**
 * 提交專案為模板
 */
export async function templateSubmit(input: {
  projectId: string
  name: string
  description: string
  category: string
  tags: string[]
  thumbnailUrl?: string
}): Promise<ActionResult<{ templateId: string; slug: string; reviewStatus: string }>> {
  try {
    const token = await getAuthToken()
    if (!token) return { success: false, error: '未登入' }

    const result = await vpsApi.templateSubmit({ token, ...input })
    if (!result.success || !result.data) {
      return { success: false, error: result.error || '提交失敗' }
    }
    return { success: true, data: result.data }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

/**
 * 獲取我的模板列表
 */
export async function getMyTemplates(): Promise<ActionResult<vpsApi.MyTemplateData[]>> {
  try {
    const token = await getAuthToken()
    if (!token) return { success: false, error: '未登入' }

    const result = await vpsApi.getMyTemplates({ token })
    if (!result.success || !result.data) {
      return { success: false, error: result.error || '獲取失敗' }
    }
    return { success: true, data: result.data.templates }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

/**
 * 管理員審核模板（批准/拒絕）
 */
export async function reviewTemplate(input: {
  templateId: string
  status: 'approved' | 'rejected'
  reason?: string
}): Promise<ActionResult<{ reviewStatus: string; isActive: boolean }>> {
  try {
    const token = await getAuthToken()
    if (!token) return { success: false, error: 'NOT_AUTHENTICATED' }

    const result = await reviewTemplateApi({ token, ...input })
    if (!result.success || !result.data) {
      return { success: false, error: result.error || '審核失敗' }
    }
    return { success: true, data: result.data }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

/**
 * 初始化模板資料（將靜態資料寫入資料庫）
 * - 僅供管理員使用
 */
export async function initializeTemplates(): Promise<ActionResult<{ count: number }>> {
  try {
  const t = await getTranslations('actionErrors')
    const token = await getAuthToken()

    if (!token) {
      return { success: false, error: t('notAuthenticated') }
    }

    // 將靜態模板轉換為 API 格式
    const templates = INITIAL_TEMPLATES.map(t => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      category: t.category,
      description: t.description,
      thumbnailUrl: t.thumbnailUrl,
      previewImageUrl: t.previewImageUrl,
      tags: t.tags,
      designDefaults: t.designDefaults,
      pageStructure: t.pageStructure,
      isActive: t.isActive,
      isFeatured: t.isFeatured,
      sortOrder: t.sortOrder
    }))

    const result = await vpsApi.initializeTemplates({ token, templates })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, data: { count: result.data?.count || 0 } }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

/**
 * 公開取得用戶提交模板的 project files（用於 Sandpack 渲染）
 */
export async function getTemplateFiles(
  templateId: string
): Promise<ActionResult<{ files: TemplateFileData[] }>> {
  try {
    const result = await getTemplatePublicFilesApi({ templateId })
    if (!result.success || !result.data) {
      return { success: false, error: result.error || '取得模板檔案失敗' }
    }
    return { success: true, data: result.data }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
