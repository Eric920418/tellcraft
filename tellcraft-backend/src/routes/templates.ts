/**
 * Templates API 路由
 * 提供模板資料的 CRUD 操作 + 用戶模板提交 + 管理員審核
 */
import { Router } from 'express'
import crypto from 'crypto'
import { query, queryOne } from '../db/client'
import { requireAuth, requireAdmin } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { templateSubmitPreflightSchema, templateSubmitSchema, templateReviewSchema } from '../schemas/template-submit'
import { captureAndSaveThumbnail } from '../services/thumbnail-recapture'
import { createLogger } from '../lib/logger'

const logger = createLogger('templates')

const router: Router = Router()

// UUID 格式檢測
const isUUID = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)

// 簡易 slugify
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w\u4e00-\u9fff-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'template'
}


// ============================================================
// 模板提交 API（放在 /:id 前避免路徑衝突）
// ============================================================

/**
 * POST /api/templates/submit/preflight
 * 提交前檢查：檢查專案狀態、推斷預填資料
 */
router.post('/submit/preflight', requireAuth, validateBody(templateSubmitPreflightSchema), async (req, res) => {
  try {
    const { projectId } = req.body
    const userId = req.user!.id

    // 驗證專案擁有權
    const project = await queryOne<{
      id: string; name: string; status: string; vercel_url: string | null; user_id: string
    }>(
      'SELECT id, name, status, vercel_url, user_id FROM projects WHERE id = $1',
      [projectId]
    )

    if (!project) {
      return res.status(404).json({ error: '專案不存在' })
    }
    if (project.user_id !== userId) {
      return res.status(403).json({ error: '無權限操作此專案' })
    }

    // 檢查項目
    const filesResult = await query<{ file_path: string; file_type: string }>(
      `SELECT file_path, CASE
        WHEN file_path LIKE '%/page.tsx' OR file_path LIKE '%/page.jsx' THEN 'page'
        WHEN file_path LIKE '%.css' OR file_path LIKE '%tailwind%' THEN 'style'
        ELSE 'other'
       END as file_type
       FROM project_files WHERE project_id = $1`,
      [projectId]
    )

    const hasPages = filesResult.rows.some(f => f.file_type === 'page')
    const hasStyles = filesResult.rows.some(f => f.file_type === 'style')
    const isDeployed = project.status === 'deployed'

    // 重複檢查
    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM templates WHERE source_project_id = $1 AND review_status IN ('pending', 'approved')`,
      [projectId]
    )
    const notDuplicate = !existing

    const checks = { hasPages, hasStyles, isDeployed, notDuplicate }
    const errors: string[] = []
    if (!hasPages) errors.push('專案中沒有頁面檔案')
    if (!hasStyles) errors.push('專案中沒有樣式檔案')
    if (!isDeployed) errors.push('專案尚未部署')
    if (!notDuplicate) errors.push('此專案已提交過模板')

    const passed = errors.length === 0

    // 推斷預填資料
    const prefilled: { name: string; category: string; tags: string[] } = {
      name: project.name || '',
      category: 'landing',
      tags: [],
    }

    // 嘗試從 Redis FlowState 推斷分類
    // 這裡用簡單的專案名推斷，因為路由中無法直接訪問 Redis
    const nameLower = (project.name || '').toLowerCase()
    if (nameLower.includes('saas') || nameLower.includes('dashboard')) prefilled.category = 'saas'
    else if (nameLower.includes('ecommerce') || nameLower.includes('shop') || nameLower.includes('商')) prefilled.category = 'ecommerce'
    else if (nameLower.includes('blog') || nameLower.includes('部落格')) prefilled.category = 'blog'
    else if (nameLower.includes('portfolio') || nameLower.includes('作品')) prefilled.category = 'portfolio'
    else if (nameLower.includes('event') || nameLower.includes('活動')) prefilled.category = 'event'

    res.json({ checks, passed, errors, prefilled })
  } catch (error) {
    logger.error({ err: error }, '模板提交 preflight 失敗')
    res.status(500).json({ error: '檢查失敗' })
  }
})

/**
 * POST /api/templates/submit
 * 用戶提交專案為模板
 */
router.post('/submit', requireAuth, validateBody(templateSubmitSchema), async (req, res) => {
  try {
    const { projectId, name, description, category, tags, thumbnailUrl } = req.body
    const userId = req.user!.id

    // 重新驗證擁有權 + 專案狀態
    const project = await queryOne<{
      id: string; name: string; status: string; vercel_url: string | null; user_id: string
    }>(
      'SELECT id, name, status, vercel_url, user_id FROM projects WHERE id = $1',
      [projectId]
    )

    if (!project) return res.status(404).json({ error: '專案不存在' })
    if (project.user_id !== userId) return res.status(403).json({ error: '無權限操作此專案' })

    // 重新執行關鍵檢查（防繞過）
    const filesResult = await query<{ file_path: string }>(
      `SELECT file_path FROM project_files WHERE project_id = $1 AND (file_path LIKE '%/page.tsx' OR file_path LIKE '%/page.jsx')`,
      [projectId]
    )
    if (filesResult.rows.length === 0) return res.status(400).json({ error: '專案中沒有頁面檔案' })

    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM templates WHERE source_project_id = $1 AND review_status IN ('pending', 'approved')`,
      [projectId]
    )
    if (existing) return res.status(409).json({ error: '此專案已提交過模板' })

    // Slug 生成（衝突時加隨機後綴，最多重試 3 次）
    let slug = slugify(name)
    for (let attempt = 0; attempt < 3; attempt++) {
      const slugConflict = await queryOne<{ id: string }>('SELECT id FROM templates WHERE slug = $1', [slug])
      if (!slugConflict) break
      slug = `${slugify(name)}-${crypto.randomBytes(3).toString('hex')}`
    }

    // Name 衝突處理
    let finalName = name
    const nameConflict = await queryOne<{ id: string }>('SELECT id FROM templates WHERE name = $1', [finalName])
    if (nameConflict) {
      finalName = `${name} (${crypto.randomBytes(3).toString('hex')})`
    }

    // 從 project_files 組裝 page_structure
    const allFiles = await query<{ file_path: string }>(
      'SELECT file_path FROM project_files WHERE project_id = $1',
      [projectId]
    )
    const pages = allFiles.rows
      .filter(f => f.file_path.includes('/page.tsx') || f.file_path.includes('/page.jsx'))
      .map(f => f.file_path)
    const components = allFiles.rows
      .filter(f => !f.file_path.includes('/page.') && (f.file_path.endsWith('.tsx') || f.file_path.endsWith('.jsx')))
      .map(f => f.file_path)
    const pageStructure = { pages, components }

    // 封面截圖
    let finalThumbnailUrl = thumbnailUrl || null
    if (!finalThumbnailUrl && project.vercel_url) {
      const vercelUrl = project.vercel_url.startsWith('http') ? project.vercel_url : `https://${project.vercel_url}`
      finalThumbnailUrl = await captureAndSaveThumbnail(vercelUrl)
    }

    // INSERT 模板
    const templateId = crypto.randomUUID()
    await query(
      `INSERT INTO templates (id, name, slug, category, description, thumbnail_url, tags, page_structure,
        is_active, is_featured, sort_order, source_project_id, submitted_by, review_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, false, 999, $9, $10, 'pending')`,
      [
        templateId,
        finalName,
        slug,
        category,
        description,
        finalThumbnailUrl,
        tags,
        JSON.stringify(pageStructure),
        projectId,
        userId,
      ]
    )

    logger.info({ templateId, slug, projectId, userId }, '用戶提交模板')

    res.json({ templateId, slug, reviewStatus: 'pending' })
  } catch (error) {
    logger.error({ err: error }, '模板提交失敗')
    res.status(500).json({ error: '提交失敗' })
  }
})

/**
 * GET /api/templates/mine
 * 獲取當前用戶提交的模板列表
 */
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id

    const result = await query<{
      id: string; name: string; slug: string; category: string; description: string
      thumbnail_url: string | null; tags: string[]; review_status: string; review_reason: string | null
      created_at: Date; source_project_id: string | null
    }>(
      `SELECT id, name, slug, category, description, thumbnail_url, tags, review_status, review_reason, created_at, source_project_id
       FROM templates WHERE submitted_by = $1 ORDER BY created_at DESC`,
      [userId]
    )

    const templates = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      category: row.category,
      description: row.description,
      thumbnailUrl: row.thumbnail_url,
      tags: row.tags,
      reviewStatus: row.review_status,
      reviewReason: row.review_reason,
      createdAt: row.created_at,
      sourceProjectId: row.source_project_id,
    }))

    res.json({ templates })
  } catch (error) {
    logger.error({ err: error }, '獲取我的模板失敗')
    res.status(500).json({ error: '獲取失敗' })
  }
})

/**
 * PATCH /api/templates/:id/review
 * 管理員審核模板（approve/reject）
 */
router.patch('/:id/review', requireAdmin, validateBody(templateReviewSchema), async (req, res) => {
  try {
    const { id } = req.params
    const { status, reason } = req.body

    if (!isUUID(id)) return res.status(400).json({ error: '無效的模板 ID' })

    const template = await queryOne<{ id: string; review_status: string }>(
      'SELECT id, review_status FROM templates WHERE id = $1',
      [id]
    )
    if (!template) return res.status(404).json({ error: '模板不存在' })

    const isActive = status === 'approved'
    await query(
      `UPDATE templates SET review_status = $1, review_reason = $2, is_active = $3 WHERE id = $4`,
      [status, reason || null, isActive, id]
    )

    logger.info({ templateId: id, status, adminId: req.user!.id }, '管理員審核模板')

    // approved 且無縮圖時，後台自動截圖（fire-and-forget）
    if (isActive) {
      queryOne<{ vercel_url: string | null; thumbnail_url: string | null }>(
        `SELECT p.vercel_url, t.thumbnail_url
         FROM templates t
         LEFT JOIN projects p ON p.id = t.source_project_id
         WHERE t.id = $1`,
        [id]
      ).then(async row => {
        if (row?.vercel_url && !row.thumbnail_url) {
          const url = row.vercel_url.startsWith('http') ? row.vercel_url : `https://${row.vercel_url}`
          const thumbUrl = await captureAndSaveThumbnail(url)
          if (thumbUrl) {
            await query(`UPDATE templates SET thumbnail_url = $1 WHERE id = $2`, [thumbUrl, id])
            logger.info({ templateId: id, thumbUrl }, '模板縮圖自動截圖完成')
          }
        }
      }).catch(err => logger.warn({ err }, '模板縮圖後台截圖失敗'))
    }

    res.json({ success: true, reviewStatus: status, isActive })
  } catch (error) {
    logger.error({ err: error }, '模板審核失敗')
    res.status(500).json({ error: '審核失敗' })
  }
})


// ============================================================
// 公開模板 API
// ============================================================

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

    let sql = `SELECT t.*, p.vercel_url AS project_vercel_url
               FROM templates t
               LEFT JOIN projects p ON p.id = t.source_project_id
               WHERE t.is_active = true AND t.review_status = 'approved'`
    const params: string[] = []
    let paramIndex = 1

    if (category && category !== 'all') {
      sql += ` AND t.category = $${paramIndex}`
      params.push(category)
      paramIndex++
    }

    if (featuredOnly === 'true') {
      sql += ` AND t.is_featured = true`
    }

    sql += ` ORDER BY t.sort_order ASC`

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
      project_vercel_url: string | null
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
      sortOrder: row.sort_order,
      deployedUrl: row.project_vercel_url
        ? (row.project_vercel_url.startsWith('http') ? row.project_vercel_url : `https://${row.project_vercel_url}`)
        : null,
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

    // 1. 獲取模板（支援 UUID 或 slug），同時 JOIN 取得 source project 的 vercel_url
    const templateQuery = isUUID(identifier)
      ? `SELECT t.id, t.name, t.slug, t.category, t.description, t.design_defaults, t.page_structure,
               p.vercel_url AS project_vercel_url
         FROM templates t LEFT JOIN projects p ON p.id = t.source_project_id WHERE t.id = $1`
      : `SELECT t.id, t.name, t.slug, t.category, t.description, t.design_defaults, t.page_structure,
               p.vercel_url AS project_vercel_url
         FROM templates t LEFT JOIN projects p ON p.id = t.source_project_id WHERE t.slug = $1`

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
      project_vercel_url: string | null
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

    // 3. 無快取 → 若有 source project 的 vercel_url，直接 redirect 展示真實站台
    if (template.project_vercel_url) {
      const deployedUrl = template.project_vercel_url.startsWith('http')
        ? template.project_vercel_url
        : `https://${template.project_vercel_url}`
      logger.info({ templateName: template.name, deployedUrl }, '模板無預覽快取，redirect 到 deployed site')
      return res.redirect(302, deployedUrl)
    }

    // 4. 無快取且無 deployed URL → 返回佔位頁面
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
    const { review_status: filterStatus } = req.query as { review_status?: string }

    let sql = `SELECT
        t.*,
        tp.version as preview_version,
        tp.updated_at as preview_updated_at
      FROM templates t
      LEFT JOIN template_previews tp ON t.id = tp.template_id`
    const params: string[] = []

    if (filterStatus && ['pending', 'approved', 'rejected'].includes(filterStatus)) {
      sql += ` WHERE t.review_status = $1`
      params.push(filterStatus)
    }

    sql += ` ORDER BY t.created_at DESC`

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
      review_status: string
      review_reason: string | null
      submitted_by: string | null
      source_project_id: string | null
      preview_version: number | null
      preview_updated_at: Date | null
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
      isActive: row.is_active,
      isFeatured: row.is_featured,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      reviewStatus: row.review_status || 'approved',
      reviewReason: row.review_reason,
      submittedBy: row.submitted_by,
      sourceProjectId: row.source_project_id,
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
