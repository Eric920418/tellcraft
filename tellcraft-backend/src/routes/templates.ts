/**
 * Templates API 路由
 * 提供模板資料的 CRUD 操作
 */
import { Router } from 'express'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import Anthropic from '@anthropic-ai/sdk'
import { query, queryOne } from '../db/client'
import { requireAuth } from '../middleware/auth'

const router: Router = Router()

// Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// 預生成模板映射（模板 slug -> 文件名）
const PREGENERATED_TEMPLATES: Record<string, string> = {
  'saas-minimal': 'saas-dashboard-minimal.html',
  'saas-pro': 'saas-dashboard-professional.html',
  'landing-startup': 'startup-landing-page.html',
  'landing-corporate': 'corporate-website.html',
  'ecommerce-modern': 'modern-ecommerce.html',
}

// 預生成模板目錄
const TEMPLATES_DIR = join(__dirname, '../data/template-previews')

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
 * GET /api/templates/preview/:id
 * 生成模板預覽 HTML（用於 iframe）
 * 優先順序：1. 預生成文件 2. 數據庫緩存 3. LLM 動態生成
 */
router.get('/preview/:id', async (req, res) => {
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
      return res.status(404).send('<html><body><h1>模板不存在</h1></body></html>')
    }

    // 2. 優先檢查預生成文件（零 LLM 消耗）
    const pregeneratedFile = PREGENERATED_TEMPLATES[template.slug]
    if (pregeneratedFile) {
      const filePath = join(TEMPLATES_DIR, pregeneratedFile)
      if (existsSync(filePath)) {
        console.log(`[Templates] 使用預生成模板: ${template.slug}`)
        const htmlContent = readFileSync(filePath, 'utf-8')
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.setHeader('X-Cache', 'PREGENERATED')
        return res.send(htmlContent)
      }
    }

    // 3. 檢查數據庫緩存（永久有效）
    const cached = await queryOne<{ html_content: string; version: number }>(
      'SELECT html_content, version FROM template_previews WHERE template_id = $1',
      [id]
    )

    if (cached) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.setHeader('X-Cache', 'HIT')
      res.setHeader('X-Preview-Version', String(cached.version))
      return res.send(cached.html_content)
    }

    // 4. 調用 LLM 生成 HTML（最後手段，應避免）
    console.log(`[Templates] ⚠️ LLM 生成模板預覽: ${template.name} (建議添加預生成文件)`)

    const designDefaults = template.design_defaults
    const pageStructure = template.page_structure

    const prompt = `你是一個專業的前端開發者。根據以下設計規格，生成一個完整的 HTML 頁面預覽。

## 模板資訊
- 名稱：${template.name}
- 類別：${template.category}
- 描述：${template.description}

## 設計規格
- 風格：${designDefaults.style}
- 色彩模式：${designDefaults.colorMode}
- 主色調：${designDefaults.primaryColor}
- 強調色：${designDefaults.accentColor}
- 字體：${designDefaults.fontFamily}
- 圓角：${designDefaults.borderRadius}
- 間距：${designDefaults.spacing}

## 頁面結構
- 頁面：${pageStructure.pages.join(', ')}
- 組件：${pageStructure.components.join(', ')}

## 要求
1. 生成一個完整的 HTML 文件，使用 Tailwind CSS CDN
2. 頁面應該展示模板的主要視覺風格和佈局
3. 使用指定的顏色、字體和間距
4. 包含指定的組件（如 header, sidebar, stats-card 等）
5. 頁面要有真實的假資料（Lorem ipsum 或合理的範例數據）
6. 響應式設計，但優先桌面版
7. ${designDefaults.colorMode === 'dark' ? '使用深色背景' : '使用淺色背景'}

## 輸出格式
直接輸出完整的 HTML 代碼，不要包含 \`\`\`html 標記。從 <!DOCTYPE html> 開始。`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    let htmlContent = ''
    for (const block of response.content) {
      if (block.type === 'text') {
        htmlContent += block.text
      }
    }

    // 清理可能的 markdown 標記
    htmlContent = htmlContent.trim()
    if (htmlContent.startsWith('```html')) {
      htmlContent = htmlContent.slice(7)
    }
    if (htmlContent.startsWith('```')) {
      htmlContent = htmlContent.slice(3)
    }
    if (htmlContent.endsWith('```')) {
      htmlContent = htmlContent.slice(0, -3)
    }
    htmlContent = htmlContent.trim()

    // 5. 緩存到數據庫（初次生成，version = 1）
    await query(
      `INSERT INTO template_previews (template_id, html_content, version, updated_at)
       VALUES ($1, $2, 1, NOW())
       ON CONFLICT (template_id) DO UPDATE SET
         html_content = $2,
         version = template_previews.version + 1,
         updated_at = NOW()`,
      [id, htmlContent]
    )

    // 6. 返回 HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('X-Cache', 'MISS')
    res.send(htmlContent)

  } catch (error) {
    console.error('[Templates] 生成預覽失敗:', error)

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

    // 3. 調用 LLM 生成新版本
    console.log(`[Templates] 重新生成模板預覽: ${template.name} (v${newVersion})`)

    const designDefaults = template.design_defaults
    const pageStructure = template.page_structure

    const prompt = `你是一個專業的前端開發者。根據以下設計規格，生成一個完整的 HTML 頁面預覽。

## 模板資訊
- 名稱：${template.name}
- 類別：${template.category}
- 描述：${template.description}

## 設計規格
- 風格：${designDefaults.style}
- 色彩模式：${designDefaults.colorMode}
- 主色調：${designDefaults.primaryColor}
- 強調色：${designDefaults.accentColor}
- 字體：${designDefaults.fontFamily}
- 圓角：${designDefaults.borderRadius}
- 間距：${designDefaults.spacing}

## 頁面結構
- 頁面：${pageStructure.pages.join(', ')}
- 組件：${pageStructure.components.join(', ')}

## 要求
1. 生成一個完整的 HTML 文件，使用 Tailwind CSS CDN
2. 頁面應該展示模板的主要視覺風格和佈局
3. 使用指定的顏色、字體和間距
4. 包含指定的組件（如 header, sidebar, stats-card 等）
5. 頁面要有真實的假資料（Lorem ipsum 或合理的範例數據）
6. 響應式設計，但優先桌面版
7. ${designDefaults.colorMode === 'dark' ? '使用深色背景' : '使用淺色背景'}

## 輸出格式
直接輸出完整的 HTML 代碼，不要包含 \`\`\`html 標記。從 <!DOCTYPE html> 開始。`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    let htmlContent = ''
    for (const block of response.content) {
      if (block.type === 'text') {
        htmlContent += block.text
      }
    }

    // 清理可能的 markdown 標記
    htmlContent = htmlContent.trim()
    if (htmlContent.startsWith('```html')) {
      htmlContent = htmlContent.slice(7)
    }
    if (htmlContent.startsWith('```')) {
      htmlContent = htmlContent.slice(3)
    }
    if (htmlContent.endsWith('```')) {
      htmlContent = htmlContent.slice(0, -3)
    }
    htmlContent = htmlContent.trim()

    // 4. 更新緩存
    await query(
      `INSERT INTO template_previews (template_id, html_content, version, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (template_id) DO UPDATE SET
         html_content = $2,
         version = $3,
         updated_at = NOW()`,
      [id, htmlContent, newVersion]
    )

    res.json({
      success: true,
      version: newVersion,
      message: `模板預覽已重新生成 (v${newVersion})`,
    })

  } catch (error) {
    console.error('[Templates] 重新生成預覽失敗:', error)
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

/**
 * GET /api/templates/admin/list
 * 管理員專用：獲取所有模板（包含預覽狀態）
 */
router.get('/admin/list', requireAuth, async (req, res) => {
  try {
    // 檢查是否為管理員
    const adminCheck = await queryOne<{ is_admin: boolean }>(
      'SELECT is_admin FROM users WHERE id = $1',
      [req.user!.id]
    )

    if (!adminCheck?.is_admin) {
      return res.status(403).json({ error: '無管理員權限' })
    }

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
      has_pregenerated: boolean
    }>(
      `SELECT
        t.*,
        tp.version as preview_version,
        tp.updated_at as preview_updated_at,
        CASE WHEN t.slug IN ('saas-minimal', 'saas-pro', 'landing-startup', 'landing-corporate', 'ecommerce-modern')
          THEN true ELSE false END as has_pregenerated
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
        hasPregenerated: row.has_pregenerated,
        status: row.has_pregenerated ? 'pregenerated' : (row.preview_version ? 'cached' : 'none')
      }
    }))

    res.json({ templates })
  } catch (error) {
    console.error('[Templates] 獲取管理員模板列表失敗:', error)
    res.status(500).json({ error: '獲取模板列表失敗' })
  }
})

export default router
