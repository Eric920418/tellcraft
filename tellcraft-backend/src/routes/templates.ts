/**
 * Templates API 路由
 * 提供模板資料的 CRUD 操作
 */
import { Router } from 'express'
import { query, queryOne } from '../db/client'
import { requireAuth, requireAdmin } from '../middleware/auth'
import { createLogger } from '../lib/logger'

const logger = createLogger('templates')

const router: Router = Router()

// UUID 格式檢測
const isUUID = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)

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
      industry: string[]
      use_cases: string[]
      component_types: string[]
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
      industry: row.industry || [],
      useCases: row.use_cases || [],
      componentTypes: row.component_types || [],
      designDefaults: row.design_defaults,
      pageStructure: row.page_structure,
      isActive: row.is_active,
      isFeatured: row.is_featured,
      sortOrder: row.sort_order
    }))

    res.json({ templates })
  } catch (error) {
    logger.error({ err: error }, '獲取模板列表失敗')
    res.status(500).json({ error: '獲取模板列表失敗' })
  }
})

/**
 * GET /api/templates/preview/:id
 * 生成模板預覽 HTML（用於 iframe）
 * 來源：DB 快取（template_previews 表），無快取返回佔位頁面
 */
router.get('/preview/:id', async (req, res) => {
  try {
    const identifier = req.params.id

    // 1. 獲取模板（支援 UUID 或 slug）
    const templateQuery = isUUID(identifier)
      ? 'SELECT id, name, slug, category, description, design_defaults, page_structure FROM templates WHERE id = $1'
      : 'SELECT id, name, slug, category, description, design_defaults, page_structure FROM templates WHERE slug = $1'

    const template = await queryOne<{
      id: string
      name: string
      slug: string
      category: string
      description: string
      design_defaults: {
        style: string
        colorMode: string
        primaryColor: string
        accentColor: string
        fontFamily: string
        borderRadius: string
        spacing: string
      }
      page_structure: {
        pages: string[]
        components: string[]
      }
    }>(templateQuery, [identifier])

    if (!template) {
      return res.status(404).send('<html><body><h1>模板不存在</h1></body></html>')
    }

    // 用實際 UUID 做後續查詢（identifier 可能是 slug）
    const templateId = template.id

    // 2. 檢查數據庫緩存
    const cached = await queryOne<{ html_content: string; version: number }>(
      'SELECT html_content, version FROM template_previews WHERE template_id = $1',
      [templateId]
    )

    if (cached) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.setHeader('X-Cache', 'HIT')
      res.setHeader('X-Preview-Version', String(cached.version))
      return res.send(cached.html_content)
    }

    // 3. 無快取 → 返回佔位頁面
    logger.info({ templateName: template.name, slug: template.slug }, '模板無預覽快取')

    const designDefaults = template.design_defaults
    const placeholderHtml = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.name} - 預覽</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="${designDefaults.colorMode === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'} min-h-screen flex items-center justify-center">
  <div class="text-center max-w-md px-6">
    <div class="w-16 h-16 rounded-2xl ${designDefaults.colorMode === 'dark' ? 'bg-white/10' : 'bg-gray-200'} flex items-center justify-center mx-auto mb-6">
      <svg class="w-8 h-8 ${designDefaults.colorMode === 'dark' ? 'text-white/40' : 'text-gray-400'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
    </div>
    <h2 class="text-xl font-semibold mb-2">${template.name}</h2>
    <p class="${designDefaults.colorMode === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-sm">${template.description}</p>
    <p class="${designDefaults.colorMode === 'dark' ? 'text-gray-600' : 'text-gray-300'} text-xs mt-4">預覽尚未生成</p>
  </div>
</body>
</html>`

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('X-Cache', 'NONE')
    res.send(placeholderHtml)

  } catch (error) {
    logger.error({ err: error }, '生成預覽失敗')

    // 返回錯誤頁面
    const errorHtml = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>預覽生成中</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-white min-h-screen flex items-center justify-center">
  <div class="text-center">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
    <p class="text-gray-400">預覽生成失敗，請稍後再試</p>
    <p class="text-gray-500 text-sm mt-2">${error instanceof Error ? error.message : '未知錯誤'}</p>
  </div>
</body>
</html>`
    res.status(500).send(errorHtml)
  }
})

/**
 * POST /api/templates/preview/:id/regenerate
 * 重新生成模板預覽（用於迭代更新）
 */
router.post('/preview/:id/regenerate', requireAuth, async (req, res) => {
  try {
    const { id } = req.params

    // 1. 獲取模板
    const template = await queryOne<{
      id: string
      name: string
      slug: string
      category: string
      description: string
      design_defaults: {
        style: string
        colorMode: string
        primaryColor: string
        accentColor: string
        fontFamily: string
        borderRadius: string
        spacing: string
      }
      page_structure: {
        pages: string[]
        components: string[]
      }
    }>(
      'SELECT id, name, slug, category, description, design_defaults, page_structure FROM templates WHERE id = $1',
      [id]
    )

    if (!template) {
      return res.status(404).json({ error: '模板不存在' })
    }

    // 2. 獲取當前版本號
    const currentVersion = await queryOne<{ version: number }>(
      'SELECT version FROM template_previews WHERE template_id = $1',
      [id]
    )
    const newVersion = (currentVersion?.version || 0) + 1

    // 3. 禁止 LLM 生成 — 模板預覽必須透過 DB 手動插入（使用 Claude Code 生成 SQL）
    logger.info({ templateName: template.name, version: newVersion }, 'regenerate 已禁用 LLM')

    return res.status(403).json({
      error: '模板預覽 LLM 生成已禁用。請透過 Claude Code 生成 HTML 後直接插入 template_previews 表。',
      slug: template.slug,
      currentVersion: currentVersion?.version || 0,
    })

  } catch (error) {
    logger.error({ err: error }, '重新生成預覽失敗')
    res.status(500).json({ error: '重新生成預覽失敗' })
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
    logger.error({ err: error }, '獲取模板失敗')
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
    logger.error({ err: error }, '獲取模板失敗')
    res.status(500).json({ error: '獲取模板失敗' })
  }
})

/**
 * POST /api/templates/init
 * 初始化模板資料（管理員專用）
 */
router.post('/init', requireAdmin, async (req, res) => {
  try {
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
    logger.error({ err: error }, '初始化模板失敗')
    res.status(500).json({ error: '初始化模板失敗' })
  }
})

/**
 * GET /api/templates/admin/list
 * 管理員專用：獲取所有模板（包含預覽狀態）
 */
router.get('/admin/list', requireAdmin, async (req, res) => {
  try {
    // 獲取所有模板和預覽狀態
    const result = await query<{
      id: string
      name: string
      slug: string
      category: string
      description: string
      thumbnail_url: string
      preview_image_url: string | null
      tags: string[]
      is_active: boolean
      is_featured: boolean
      sort_order: number
      created_at: Date
      preview_version: number | null
      preview_updated_at: Date | null
    }>(
      `SELECT
        t.*,
        tp.version as preview_version,
        tp.updated_at as preview_updated_at
      FROM templates t
      LEFT JOIN template_previews tp ON t.id = tp.template_id
      ORDER BY t.sort_order ASC`
    )

    const templates = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      category: row.category,
      description: row.description,
      thumbnailUrl: row.thumbnail_url,
      previewImageUrl: row.preview_image_url,
      tags: row.tags,
      isActive: row.is_active,
      isFeatured: row.is_featured,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      preview: {
        version: row.preview_version,
        updatedAt: row.preview_updated_at,
        status: row.preview_version ? 'cached' : 'none'
      }
    }))

    res.json({ templates })
  } catch (error) {
    logger.error({ err: error }, '獲取管理員模板列表失敗')
    res.status(500).json({ error: '獲取模板列表失敗' })
  }
})

/**
 * PUT /api/templates/preview/:id
 * 直接更新模板預覽 HTML（Admin only）
 * 用於 Claude Code 批量推送本地生成的預覽
 */
router.put('/preview/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { html_content } = req.body

    if (!id || !isUUID(id)) {
      return res.status(400).json({ error: '無效的模板 ID' })
    }

    if (!html_content || typeof html_content !== 'string' || html_content.length < 100) {
      return res.status(400).json({ error: 'html_content 必須是至少 100 字元的字串' })
    }

    // 檢查模板存在
    const template = await queryOne<{ id: string; slug: string }>(
      'SELECT id, slug FROM templates WHERE id = $1',
      [id]
    )
    if (!template) {
      return res.status(404).json({ error: '模板不存在' })
    }

    // Upsert preview
    await query(
      `INSERT INTO template_previews (template_id, html_content, version)
       VALUES ($1, $2, 1)
       ON CONFLICT (template_id) DO UPDATE SET
         html_content = EXCLUDED.html_content,
         version = template_previews.version + 1,
         updated_at = NOW()`,
      [id, html_content]
    )

    // 取回新版本號
    const updated = await queryOne<{ version: number }>(
      'SELECT version FROM template_previews WHERE template_id = $1',
      [id]
    )

    res.json({
      success: true,
      slug: template.slug,
      version: updated?.version || 1,
      htmlLength: html_content.length,
    })
  } catch (error) {
    logger.error({ err: error }, '更新預覽失敗')
    res.status(500).json({ error: '更新預覽失敗' })
  }
})

export default router
