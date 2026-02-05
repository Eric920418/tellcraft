/**
 * Templates API 路由
 * 提供模板資料的 CRUD 操作
 */
import { Router } from 'express'
import { query, queryOne } from '../db/client'
import { requireAuth } from '../middleware/auth'

const router: Router = Router()

/**
 * GET /api/templates
 * 獲取所有啟用的模板
 */
router.get('/', async (req, res) => {
  try {
    const { category, featuredOnly } = req.query as {
      category?: string
      featuredOnly?: string
    }

    let sql = `SELECT * FROM templates WHERE is_active = true`
    const params: string[] = []
    let paramIndex = 1

    if (category && category !== 'all') {
      sql += ` AND category = $${paramIndex}`
      params.push(category)
      paramIndex++
    }

    if (featuredOnly === 'true') {
      sql += ` AND is_featured = true`
    }

    sql += ` ORDER BY sort_order ASC`

    const result = await query<{
      id: string
      name: string
      slug: string
      category: string
      description: string
      thumbnail_url: string
      preview_image_url: string | null
      tags: string[]
      design_defaults: unknown
      page_structure: unknown
      is_active: boolean
      is_featured: boolean
      sort_order: number
    }>(sql, params)

    const templates = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      category: row.category,
      description: row.description,
      thumbnailUrl: row.thumbnail_url,
      previewImageUrl: row.preview_image_url,
      tags: row.tags,
      designDefaults: row.design_defaults,
      pageStructure: row.page_structure,
      isActive: row.is_active,
      isFeatured: row.is_featured,
      sortOrder: row.sort_order
    }))

    res.json({ templates })
  } catch (error) {
    console.error('[Templates] 獲取模板列表失敗:', error)
    res.status(500).json({ error: '獲取模板列表失敗' })
  }
})

/**
 * GET /api/templates/:id
 * 根據 ID 獲取單個模板
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const template = await queryOne<{
      id: string
      name: string
      slug: string
      category: string
      description: string
      thumbnail_url: string
      preview_image_url: string | null
      tags: string[]
      design_defaults: unknown
      page_structure: unknown
      is_active: boolean
      is_featured: boolean
      sort_order: number
    }>(
      'SELECT * FROM templates WHERE id = $1',
      [id]
    )

    if (!template) {
      return res.status(404).json({ error: '模板不存在' })
    }

    res.json({
      template: {
        id: template.id,
        name: template.name,
        slug: template.slug,
        category: template.category,
        description: template.description,
        thumbnailUrl: template.thumbnail_url,
        previewImageUrl: template.preview_image_url,
        tags: template.tags,
        designDefaults: template.design_defaults,
        pageStructure: template.page_structure,
        isActive: template.is_active,
        isFeatured: template.is_featured,
        sortOrder: template.sort_order
      }
    })
  } catch (error) {
    console.error('[Templates] 獲取模板失敗:', error)
    res.status(500).json({ error: '獲取模板失敗' })
  }
})

/**
 * GET /api/templates/slug/:slug
 * 根據 slug 獲取模板
 */
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params

    const template = await queryOne<{
      id: string
      name: string
      slug: string
      category: string
      description: string
      thumbnail_url: string
      preview_image_url: string | null
      tags: string[]
      design_defaults: unknown
      page_structure: unknown
      is_active: boolean
      is_featured: boolean
      sort_order: number
    }>(
      'SELECT * FROM templates WHERE slug = $1',
      [slug]
    )

    if (!template) {
      return res.status(404).json({ error: '模板不存在' })
    }

    res.json({
      template: {
        id: template.id,
        name: template.name,
        slug: template.slug,
        category: template.category,
        description: template.description,
        thumbnailUrl: template.thumbnail_url,
        previewImageUrl: template.preview_image_url,
        tags: template.tags,
        designDefaults: template.design_defaults,
        pageStructure: template.page_structure,
        isActive: template.is_active,
        isFeatured: template.is_featured,
        sortOrder: template.sort_order
      }
    })
  } catch (error) {
    console.error('[Templates] 獲取模板失敗:', error)
    res.status(500).json({ error: '獲取模板失敗' })
  }
})

/**
 * POST /api/templates/init
 * 初始化模板資料（管理員專用）
 */
router.post('/init', requireAuth, async (req, res) => {
  try {
    // 檢查是否為管理員
    const adminCheck = await queryOne<{ is_admin: boolean }>(
      'SELECT is_admin FROM users WHERE id = $1',
      [req.user!.id]
    )

    if (!adminCheck?.is_admin) {
      return res.status(403).json({ error: '無管理員權限' })
    }

    const { templates } = req.body as {
      templates: Array<{
        id: string
        name: string
        slug: string
        category: string
        description: string
        thumbnailUrl: string
        previewImageUrl?: string
        tags: string[]
        designDefaults: unknown
        pageStructure: unknown
        isActive: boolean
        isFeatured: boolean
        sortOrder: number
      }>
    }

    if (!templates || !Array.isArray(templates)) {
      return res.status(400).json({ error: '缺少 templates 資料' })
    }

    // Upsert 每個模板
    let count = 0
    for (const t of templates) {
      await query(
        `INSERT INTO templates (id, name, slug, category, description, thumbnail_url, preview_image_url, tags, design_defaults, page_structure, is_active, is_featured, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           slug = EXCLUDED.slug,
           category = EXCLUDED.category,
           description = EXCLUDED.description,
           thumbnail_url = EXCLUDED.thumbnail_url,
           preview_image_url = EXCLUDED.preview_image_url,
           tags = EXCLUDED.tags,
           design_defaults = EXCLUDED.design_defaults,
           page_structure = EXCLUDED.page_structure,
           is_active = EXCLUDED.is_active,
           is_featured = EXCLUDED.is_featured,
           sort_order = EXCLUDED.sort_order`,
        [
          t.id,
          t.name,
          t.slug,
          t.category,
          t.description,
          t.thumbnailUrl,
          t.previewImageUrl || null,
          JSON.stringify(t.tags),
          JSON.stringify(t.designDefaults),
          JSON.stringify(t.pageStructure),
          t.isActive,
          t.isFeatured,
          t.sortOrder
        ]
      )
      count++
    }

    res.json({ success: true, count })
  } catch (error) {
    console.error('[Templates] 初始化模板失敗:', error)
    res.status(500).json({ error: '初始化模板失敗' })
  }
})

export default router
