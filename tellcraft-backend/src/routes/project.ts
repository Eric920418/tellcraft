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
 * GET /api/project/:id/detail
 * 取得專案完整詳情（包含對話、部署、生成記錄）
 */
router.get('/:id/detail', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const project = await db.queryOne<{
      id: string
      name: string
      description: string | null
      status: string
      vercel_url: string | null
      custom_domain: string | null
      domain_status: string | null
      created_at: string
      updated_at: string
      user_id: string
    }>(
      'SELECT * FROM projects WHERE id = $1',
      [id]
    )

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    if (project.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // 取得對話
    const conversations = await db.queryMany<{
      id: string
      messages: unknown[]
      spec_complete: boolean
      created_at: string
      updated_at: string
    }>(
      'SELECT id, messages, spec_complete, created_at, updated_at FROM conversations WHERE project_id = $1 ORDER BY updated_at DESC',
      [id]
    )

    // 取得部署
    const deployments = await db.queryMany<{
      id: string
      url: string | null
      status: string
      created_at: string
    }>(
      'SELECT id, url, status, created_at FROM deployments WHERE project_id = $1 ORDER BY created_at DESC LIMIT 5',
      [id]
    )

    // 取得生成記錄
    const generations = await db.queryMany<{
      id: string
      status: string
      attempt_count: number
      created_at: string
    }>(
      'SELECT id, status, attempt_count, created_at FROM generations WHERE project_id = $1 ORDER BY created_at DESC LIMIT 5',
      [id]
    )

    res.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        vercelUrl: project.vercel_url,
        customDomain: project.custom_domain,
        domainStatus: project.domain_status,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      },
      conversations: conversations.map(c => ({
        id: c.id,
        messages: c.messages,
        specComplete: c.spec_complete,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      })),
      deployments: deployments.map(d => ({
        id: d.id,
        url: d.url,
        status: d.status,
        createdAt: d.created_at,
      })),
      generations: generations.map(g => ({
        id: g.id,
        status: g.status,
        attemptCount: g.attempt_count,
        createdAt: g.created_at,
      })),
    })
  } catch (error) {
    console.error('[Project] 取得專案詳情失敗:', error)
    res.status(500).json({ error: 'Failed to get project detail' })
  }
})

/**
 * GET /api/project/:id/latest-generation
 * 取得專案最新的生成記錄
 */
router.get('/:id/latest-generation', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    // 驗證專案擁有權
    const project = await db.queryOne<{ user_id: string }>(
      'SELECT user_id FROM projects WHERE id = $1',
      [id]
    )

    if (!project || project.user_id !== userId) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const generation = await db.queryOne<{
      id: string
      generated_code_url: string | null
      status: string
      attempt_count: number
      created_at: string
    }>(
      'SELECT id, generated_code_url, status, attempt_count, created_at FROM generations WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1',
      [id]
    )

    res.json({
      generation: generation ? {
        id: generation.id,
        generatedCodeUrl: generation.generated_code_url,
        status: generation.status,
        attemptCount: generation.attempt_count,
        createdAt: generation.created_at,
      } : null
    })
  } catch (error) {
    console.error('[Project] 取得最新生成記錄失敗:', error)
    res.status(500).json({ error: 'Failed to get latest generation' })
  }
})

/**
 * GET /api/project/:id/versions
 * 取得專案版本歷史
 */
router.get('/:id/versions', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    // 驗證專案擁有權
    const project = await db.queryOne<{ user_id: string }>(
      'SELECT user_id FROM projects WHERE id = $1',
      [id]
    )

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    if (project.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // 查詢版本歷史
    const versions = await db.queryMany<{
      id: string
      version_number: number
      version_label: string | null
      status: string
      change_summary: string | null
      conversation_id: string | null
      created_at: string
      schema_snapshot: string | null
      features_snapshot: unknown | null
    }>(
      `SELECT id, version_number, version_label, status, change_summary,
              conversation_id, created_at, schema_snapshot, features_snapshot
       FROM generations
       WHERE project_id = $1
       ORDER BY version_number DESC`,
      [id]
    )

    res.json({
      versions: versions.map(v => ({
        id: v.id,
        versionNumber: v.version_number,
        versionLabel: v.version_label,
        status: v.status,
        changeSummary: v.change_summary,
        conversationId: v.conversation_id,
        createdAt: v.created_at,
        hasBackup: !!(v.schema_snapshot || v.features_snapshot),
      }))
    })
  } catch (error) {
    console.error('[Project] 取得版本歷史失敗:', error)
    res.status(500).json({ error: 'Failed to get versions' })
  }
})

/**
 * PATCH /api/project/:id/versions/:versionNumber
 * 更新版本標籤
 */
router.patch('/:id/versions/:versionNumber', requireAuth, async (req, res) => {
  try {
    const { id, versionNumber } = req.params
    const userId = req.user!.id
    const { label } = req.body as { label?: string }

    // 驗證專案擁有權
    const project = await db.queryOne<{ user_id: string }>(
      'SELECT user_id FROM projects WHERE id = $1',
      [id]
    )

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    if (project.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // 更新版本標籤
    const result = await db.query(
      `UPDATE generations
       SET version_label = $1
       WHERE project_id = $2 AND version_number = $3`,
      [label || null, id, parseInt(versionNumber, 10)]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Version not found' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('[Project] 更新版本標籤失敗:', error)
    res.status(500).json({ error: 'Failed to update version label' })
  }
})

/**
 * POST /api/project/:id/versions/:versionNumber/rollback
 * 回滾到指定版本
 */
router.post('/:id/versions/:versionNumber/rollback', requireAuth, async (req, res) => {
  try {
    const { id, versionNumber } = req.params
    const userId = req.user!.id
    const { confirm } = req.body as { confirm?: boolean }

    if (!confirm) {
      return res.status(400).json({ error: '需要確認回滾操作' })
    }

    // 驗證專案擁有權
    const project = await db.queryOne<{ user_id: string; status: string }>(
      'SELECT user_id, status FROM projects WHERE id = $1',
      [id]
    )

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    if (project.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // 讀取目標版本
    const targetVersion = await db.queryOne<{
      id: string
      version_number: number
      schema_snapshot: string | null
      features_snapshot: unknown | null
    }>(
      `SELECT id, version_number, schema_snapshot, features_snapshot
       FROM generations
       WHERE project_id = $1 AND version_number = $2`,
      [id, parseInt(versionNumber, 10)]
    )

    if (!targetVersion) {
      return res.status(404).json({ error: 'Version not found' })
    }

    if (!targetVersion.schema_snapshot && !targetVersion.features_snapshot) {
      return res.status(400).json({ error: '此版本沒有可用的快照' })
    }

    // 獲取當前最大版本號
    const maxVersion = await db.queryOne<{ max_version: number }>(
      'SELECT COALESCE(MAX(version_number), 0) as max_version FROM generations WHERE project_id = $1',
      [id]
    )

    const newVersionNumber = (maxVersion?.max_version || 0) + 1

    // 創建新版本（從快照恢復）
    await db.transaction(async (client) => {
      // 創建新的 generation 記錄
      await client.query(
        `INSERT INTO generations (
           id, project_id, version_number, version_label, status,
           change_summary, schema_snapshot, features_snapshot, created_at
         ) VALUES (
           $1, $2, $3, $4, 'pending', $5, $6, $7, NOW()
         )`,
        [
          require('crypto').randomUUID(),
          id,
          newVersionNumber,
          null,
          `回滾自 v${targetVersion.version_number}`,
          targetVersion.schema_snapshot,
          JSON.stringify(targetVersion.features_snapshot),
        ]
      )

      // 更新專案狀態
      await client.query(
        `UPDATE projects SET status = 'testing', updated_at = NOW() WHERE id = $1`,
        [id]
      )
    })

    res.json({
      success: true,
      newVersionNumber,
      message: `已回滾到版本 ${targetVersion.version_number}，創建新版本 ${newVersionNumber}`
    })
  } catch (error) {
    console.error('[Project] 版本回滾失敗:', error)
    res.status(500).json({ error: 'Failed to rollback version' })
  }
})

/**
 * GET /api/project/:id/versions/compare
 * 對比兩個版本
 */
router.get('/:id/versions/compare', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const { v1, v2 } = req.query as { v1?: string; v2?: string }

    if (!v1 || !v2) {
      return res.status(400).json({ error: '需要提供 v1 和 v2 參數' })
    }

    // 驗證專案擁有權
    const project = await db.queryOne<{ user_id: string }>(
      'SELECT user_id FROM projects WHERE id = $1',
      [id]
    )

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    if (project.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // 讀取兩個版本
    const versions = await db.queryMany<{
      version_number: number
      schema_snapshot: string | null
      features_snapshot: unknown | null
    }>(
      `SELECT version_number, schema_snapshot, features_snapshot
       FROM generations
       WHERE project_id = $1 AND version_number IN ($2, $3)
       ORDER BY version_number`,
      [id, parseInt(v1, 10), parseInt(v2, 10)]
    )

    if (versions.length !== 2) {
      return res.status(404).json({ error: '找不到指定的版本' })
    }

    const [version1, version2] = versions

    // 計算 Schema 差異（簡單的行對比）
    const schema1Lines = (version1.schema_snapshot || '').split('\n')
    const schema2Lines = (version2.schema_snapshot || '').split('\n')

    const schemaDiff = computeSimpleDiff(schema1Lines, schema2Lines)

    // 計算 Features 差異
    const features1 = (version1.features_snapshot as Array<{ name: string; content: string }>) || []
    const features2 = (version2.features_snapshot as Array<{ name: string; content: string }>) || []

    const featuresDiff = computeFeaturesDiff(features1, features2)

    res.json({
      schemaDiff,
      featuresDiff
    })
  } catch (error) {
    console.error('[Project] 版本對比失敗:', error)
    res.status(500).json({ error: 'Failed to compare versions' })
  }
})

// 簡單的行差異計算
function computeSimpleDiff(lines1: string[], lines2: string[]): string {
  const result: string[] = []
  const maxLines = Math.max(lines1.length, lines2.length)

  for (let i = 0; i < maxLines; i++) {
    const line1 = lines1[i] || ''
    const line2 = lines2[i] || ''

    if (line1 === line2) {
      result.push(`  ${line1}`)
    } else if (!line1) {
      result.push(`+ ${line2}`)
    } else if (!line2) {
      result.push(`- ${line1}`)
    } else {
      result.push(`- ${line1}`)
      result.push(`+ ${line2}`)
    }
  }

  return result.join('\n')
}

// Features 差異計算
function computeFeaturesDiff(
  features1: Array<{ name: string; content: string }>,
  features2: Array<{ name: string; content: string }>
): Array<{ name: string; status: 'added' | 'removed' | 'modified'; diff?: string }> {
  const result: Array<{ name: string; status: 'added' | 'removed' | 'modified'; diff?: string }> = []

  const names1 = new Set(features1.map(f => f.name))
  const names2 = new Set(features2.map(f => f.name))

  // 找出新增的
  for (const f of features2) {
    if (!names1.has(f.name)) {
      result.push({ name: f.name, status: 'added' })
    }
  }

  // 找出刪除的
  for (const f of features1) {
    if (!names2.has(f.name)) {
      result.push({ name: f.name, status: 'removed' })
    }
  }

  // 找出修改的
  for (const f1 of features1) {
    const f2 = features2.find(f => f.name === f1.name)
    if (f2 && f1.content !== f2.content) {
      const diff = computeSimpleDiff(f1.content.split('\n'), f2.content.split('\n'))
      result.push({ name: f1.name, status: 'modified', diff })
    }
  }

  return result
}

/**
 * POST /api/project/:id/iterate
 * 開始新迭代：創建新對話 + 專案狀態改為 generating
 */
router.post('/:id/iterate', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const { description } = req.body as { description?: string }

    // 驗證專案擁有權
    const project = await db.queryOne<{
      id: string
      user_id: string
      status: string
      name: string
    }>(
      'SELECT id, user_id, status, name FROM projects WHERE id = $1',
      [id]
    )

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    if (project.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // 只有已部署或失敗的專案可以開始新迭代
    if (project.status !== 'deployed' && project.status !== 'failed') {
      return res.status(400).json({
        error: '只有已部署或失敗的專案可以開始新迭代',
        currentStatus: project.status
      })
    }

    // 使用事務創建新對話並更新專案狀態
    const result = await db.transaction(async (client) => {
      // 創建新對話
      const conversationResult = await client.query<{ id: string }>(
        `INSERT INTO conversations (project_id, messages, spec_complete, created_at, updated_at)
         VALUES ($1, $2, false, NOW(), NOW())
         RETURNING id`,
        [id, JSON.stringify(description ? [{
          id: require('crypto').randomUUID(),
          role: 'user',
          content: description,
          timestamp: new Date().toISOString()
        }] : [])]
      )

      const conversationId = conversationResult.rows[0].id

      // 更新專案狀態為 generating
      await client.query(
        `UPDATE projects SET status = 'generating', updated_at = NOW() WHERE id = $1`,
        [id]
      )

      return { conversationId }
    })

    res.json({
      conversationId: result.conversationId,
      projectStatus: 'generating'
    })
  } catch (error) {
    console.error('[Project] 開始新迭代失敗:', error)
    res.status(500).json({ error: 'Failed to start iteration' })
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
