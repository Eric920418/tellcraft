import { Router, type Router as RouterType } from 'express'
import { requireAuth, requireActiveSubscription } from '../middleware/auth'
import * as db from '../db/client'

const router: RouterType = Router()

// 方案限制
const PLAN_PROJECT_LIMITS: Record<string, number> = {
  free: 1,
  creator: 5,
  pro: 20,
  business: 100,
}

// ============================================================
// 專案 API
// ============================================================

/**
 * GET /api/project
 * 取得用戶的所有專案（支持分頁和搜索）
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id
    const { page = '1', pageSize = '10', search, status } = req.query as {
      page?: string
      pageSize?: string
      search?: string
      status?: string
    }

    const pageNum = parseInt(page, 10)
    const limit = parseInt(pageSize, 10)
    const offset = (pageNum - 1) * limit

    // 構建 WHERE 條件
    const conditions = ['p.user_id = $1']
    const params: (string | number)[] = [userId]
    let paramIndex = 2

    if (search) {
      conditions.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`)
      params.push(`%${search}%`)
      paramIndex++
    }

    if (status) {
      conditions.push(`p.status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    const whereClause = conditions.join(' AND ')

    // 查詢總數
    const countResult = await db.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM projects p WHERE ${whereClause}`,
      params
    )
    const total = parseInt(countResult?.count || '0', 10)

    // 查詢專案列表（包含對話數量）
    const projects = await db.queryMany<{
      id: string
      name: string
      description: string | null
      status: string
      vercel_url: string | null
      custom_domain: string | null
      created_at: string
      updated_at: string
      conversation_count: string
    }>(
      `SELECT p.id, p.name, p.description, p.status, p.vercel_url, p.custom_domain,
              p.created_at, p.updated_at,
              COUNT(c.id) as conversation_count
       FROM projects p
       LEFT JOIN conversations c ON c.project_id = p.id
       WHERE ${whereClause}
       GROUP BY p.id
       ORDER BY p.updated_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    )

    res.json({
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        vercelUrl: p.vercel_url,
        customDomain: p.custom_domain,
        conversationCount: parseInt(p.conversation_count, 10),
        createdAt: p.created_at,
        updatedAt: p.updated_at
      })),
      total,
      page: pageNum,
      pageSize: limit
    })
  } catch (error) {
    console.error('[Project] 取得專案列表失敗:', error)
    res.status(500).json({ error: 'Failed to get projects' })
  }
})

/**
 * GET /api/project/:id
 * 取得單一專案
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const project = await db.getProject(id)
    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    // 確保用戶擁有該專案
    if (project.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // 取得對話
    const conversation = await db.queryOne<{
      id: string
      messages: unknown[]
      spec_complete: boolean
    }>(
      'SELECT id, messages, spec_complete FROM conversations WHERE project_id = $1',
      [id]
    )

    res.json({
      project,
      conversation,
    })
  } catch (error) {
    console.error('[Project] 取得專案失敗:', error)
    res.status(500).json({ error: 'Failed to get project' })
  }
})

/**
 * POST /api/project
 * 創建專案
 */
router.post('/', requireAuth, requireActiveSubscription, async (req, res) => {
  try {
    const userId = req.user!.id
    const userPlan = req.user!.plan
    const { name, description } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' })
    }

    // 檢查專案數量限制
    const { rows: [{ count }] } = await db.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM projects WHERE user_id = $1',
      [userId]
    )

    const limit = PLAN_PROJECT_LIMITS[userPlan] || 1
    if (parseInt(count) >= limit) {
      return res.status(403).json({
        error: 'Project limit reached',
        limit,
        current: parseInt(count),
      })
    }

    // 處理名稱重複
    let finalName = name
    const existingProjects = await db.queryMany<{ name: string }>(
      "SELECT name FROM projects WHERE user_id = $1 AND name LIKE $2",
      [userId, `${name}%`]
    )

    if (existingProjects.length > 0) {
      const existingNames = new Set(existingProjects.map(p => p.name))
      if (existingNames.has(name)) {
        let suffix = 2
        while (existingNames.has(`${name} (${suffix})`)) {
          suffix++
        }
        finalName = `${name} (${suffix})`
      }
    }

    // 創建專案
    const project = await db.queryOne<{ id: string; status: string }>(
      `INSERT INTO projects (user_id, name, description, status, created_at, updated_at)
       VALUES ($1, $2, $3, 'draft', NOW(), NOW())
       RETURNING id, status`,
      [userId, finalName, description || null]
    )

    if (!project) {
      return res.status(500).json({ error: 'Failed to create project' })
    }

    // 創建對話
    await db.query(
      `INSERT INTO conversations (project_id, messages, spec_complete, created_at, updated_at)
       VALUES ($1, '[]', false, NOW(), NOW())`,
      [project.id]
    )

    res.json({
      success: true,
      project: {
        id: project.id,
        name: finalName,
        status: project.status,
      },
    })
  } catch (error) {
    console.error('[Project] 創建專案失敗:', error)
    res.status(500).json({ error: 'Failed to create project' })
  }
})

/**
 * PATCH /api/project/:id
 * 更新專案
 */
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const { name, description } = req.body

    // 確保用戶擁有該專案
    const project = await db.getProject(id)
    if (!project || project.user_id !== userId) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const updates: string[] = []
    const params: unknown[] = []
    let paramIndex = 1

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`)
      params.push(name)
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`)
      params.push(description)
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' })
    }

    updates.push(`updated_at = NOW()`)
    params.push(id)

    await db.query(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      params
    )

    res.json({ success: true })
  } catch (error) {
    console.error('[Project] 更新專案失敗:', error)
    res.status(500).json({ error: 'Failed to update project' })
  }
})

/**
 * DELETE /api/project/:id
 * 刪除專案
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    // 確保用戶擁有該專案
    const project = await db.getProject(id)
    if (!project || project.user_id !== userId) {
      return res.status(404).json({ error: 'Project not found' })
    }

    // 使用事務刪除相關資料
    await db.transaction(async (client) => {
      // 刪除 BDD Sessions
      await client.query(
        'DELETE FROM bdd_sessions WHERE project_id = $1',
        [id]
      )
      // 刪除 Tasks
      await client.query(
        'DELETE FROM tasks WHERE project_id = $1',
        [id]
      )
      // 刪除 Conversations
      await client.query(
        'DELETE FROM conversations WHERE project_id = $1',
        [id]
      )
      // 刪除 Project
      await client.query(
        'DELETE FROM projects WHERE id = $1',
        [id]
      )
    })

    res.json({ success: true })
  } catch (error) {
    console.error('[Project] 刪除專案失敗:', error)
    res.status(500).json({ error: 'Failed to delete project' })
  }
})

export default router
