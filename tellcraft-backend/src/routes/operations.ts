/**
 * Operations API 路由
 * 處理各種數據庫操作，支持前端 Server Actions 遷移
 */
import { Router, Request, Response } from 'express'
import { query, queryOne, queryMany, transaction } from '../db/client'
import { optionalAuth, requireAuth } from '../middleware/auth'
import crypto from 'crypto'

const router: Router = Router()

// 方案配額限制
const PLAN_MESSAGE_LIMITS: Record<string, number> = {
  free: 50,
  creator: 200,
  pro: 1000,
  business: Infinity
}

// ============================================================
// 生成記錄 API
// ============================================================

/**
 * POST /api/operations/generations
 * 創建或更新生成記錄
 */
router.post('/generations', requireAuth, async (req: Request, res: Response) => {
  try {
    const { projectId, status, attemptCount } = req.body

    const existing = await queryOne<{ id: string; attempt_count: number }>(
      `SELECT id, attempt_count FROM generations
       WHERE project_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [projectId]
    )

    let generationId: string
    let finalAttemptCount: number

    if (existing) {
      generationId = existing.id
      finalAttemptCount = attemptCount || existing.attempt_count + 1
      await query(
        `UPDATE generations SET status = $1, attempt_count = $2, updated_at = NOW()
         WHERE id = $3`,
        [status, finalAttemptCount, generationId]
      )
    } else {
      generationId = crypto.randomUUID()
      finalAttemptCount = 1
      await query(
        `INSERT INTO generations (id, project_id, status, attempt_count, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())`,
        [generationId, projectId, status, finalAttemptCount]
      )
    }

    res.json({ generationId, attemptCount: finalAttemptCount })
  } catch (error) {
    console.error('[Operations] 創建生成記錄失敗:', error)
    res.status(500).json({ error: '創建生成記錄失敗' })
  }
})

/**
 * GET /api/operations/generations/:projectId/latest
 * 獲取專案最新生成記錄
 */
router.get('/generations/:projectId/latest', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params

    const generation = await queryOne<{
      id: string
      status: string
      attempt_count: number
      generated_code_url: string | null
      created_at: string
    }>(
      `SELECT id, status, attempt_count, generated_code_url, created_at
       FROM generations
       WHERE project_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [projectId]
    )

    res.json({
      generation: generation ? {
        id: generation.id,
        status: generation.status,
        attemptCount: generation.attempt_count,
        generatedCodeUrl: generation.generated_code_url,
        createdAt: generation.created_at,
      } : null
    })
  } catch (error) {
    console.error('[Operations] 獲取生成記錄失敗:', error)
    res.status(500).json({ error: '獲取生成記錄失敗' })
  }
})

// ============================================================
// 部署 API
// ============================================================

/**
 * POST /api/operations/deployments
 * 創建部署記錄
 */
router.post('/deployments', requireAuth, async (req: Request, res: Response) => {
  try {
    const { projectId, url, status, organizationId } = req.body

    const deploymentId = crypto.randomUUID()
    await query(
      `INSERT INTO deployments (id, project_id, url, status, organization_id, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [deploymentId, projectId, url || null, status, organizationId || null]
    )

    res.json({ deploymentId })
  } catch (error) {
    console.error('[Operations] 創建部署記錄失敗:', error)
    res.status(500).json({ error: '創建部署記錄失敗' })
  }
})

/**
 * PATCH /api/operations/deployments/:id
 * 更新部署記錄
 */
router.patch('/deployments/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { url, status } = req.body

    const updates: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (url !== undefined) {
      updates.push(`url = $${paramIndex++}`)
      params.push(url)
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`)
      params.push(status)
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: '沒有更新內容' })
    }

    params.push(id)
    await query(
      `UPDATE deployments SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      params
    )

    res.json({ success: true })
  } catch (error) {
    console.error('[Operations] 更新部署記錄失敗:', error)
    res.status(500).json({ error: '更新部署記錄失敗' })
  }
})

// ============================================================
// 任務 API
// ============================================================

/**
 * POST /api/operations/tasks
 * 創建任務
 */
router.post('/tasks', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { projectId, skillId, input, priority } = req.body

    const taskId = crypto.randomUUID()
    await query(
      `INSERT INTO tasks (id, project_id, user_id, skill_id, input, priority, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'planning', NOW(), NOW())`,
      [taskId, projectId, userId, skillId || null, JSON.stringify(input || {}), priority || 0]
    )

    res.json({ taskId })
  } catch (error) {
    console.error('[Operations] 創建任務失敗:', error)
    res.status(500).json({ error: '創建任務失敗' })
  }
})

/**
 * PATCH /api/operations/tasks/:id
 * 更新任務
 */
router.patch('/tasks/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const { status, output, failedStep, currentStep } = req.body

    // 驗證任務屬於用戶
    const task = await queryOne<{ user_id: string }>(
      'SELECT user_id FROM tasks WHERE id = $1',
      [id]
    )

    if (!task || task.user_id !== userId) {
      return res.status(404).json({ error: '任務不存在' })
    }

    const updates: string[] = ['updated_at = NOW()']
    const params: any[] = []
    let paramIndex = 1

    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`)
      params.push(status)
    }
    if (output !== undefined) {
      updates.push(`output = $${paramIndex++}`)
      params.push(JSON.stringify(output))
    }
    if (failedStep !== undefined) {
      updates.push(`failed_step = $${paramIndex++}`)
      params.push(failedStep)
    }
    if (currentStep !== undefined) {
      updates.push(`current_step = $${paramIndex++}`)
      params.push(currentStep)
    }

    params.push(id)
    await query(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      params
    )

    res.json({ success: true })
  } catch (error) {
    console.error('[Operations] 更新任務失敗:', error)
    res.status(500).json({ error: '更新任務失敗' })
  }
})

/**
 * GET /api/operations/tasks/:id
 * 獲取任務詳情
 */
router.get('/tasks/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const task = await queryOne<{
      id: string
      project_id: string
      user_id: string
      skill_id: string | null
      input: any
      output: any
      priority: number
      status: string
      failed_step: string | null
      current_step: string | null
      created_at: string
      updated_at: string
    }>(
      'SELECT * FROM tasks WHERE id = $1',
      [id]
    )

    if (!task) {
      return res.status(404).json({ error: '任務不存在' })
    }

    res.json({
      task: {
        id: task.id,
        projectId: task.project_id,
        userId: task.user_id,
        skillId: task.skill_id,
        input: task.input,
        output: task.output,
        priority: task.priority,
        status: task.status,
        failedStep: task.failed_step,
        currentStep: task.current_step,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
      }
    })
  } catch (error) {
    console.error('[Operations] 獲取任務失敗:', error)
    res.status(500).json({ error: '獲取任務失敗' })
  }
})

// ============================================================
// 對話消息 API
// ============================================================

/**
 * GET /api/operations/conversations/:id/messages
 * 獲取對話消息（含任務狀態）
 */
router.get('/conversations/:id/messages', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { lastUpdatedAt } = req.query as { lastUpdatedAt?: string }

    // 先檢查是否有更新
    if (lastUpdatedAt) {
      const check = await queryOne<{ updated_at: string }>(
        'SELECT updated_at FROM conversations WHERE id = $1',
        [id]
      )

      if (check && check.updated_at === lastUpdatedAt) {
        return res.json({ noChange: true, updatedAt: check.updated_at })
      }
    }

    // 獲取對話
    const conversation = await queryOne<{
      id: string
      project_id: string
      messages: any[]
      spec_complete: boolean
      updated_at: string
    }>(
      'SELECT id, project_id, messages, spec_complete, updated_at FROM conversations WHERE id = $1',
      [id]
    )

    if (!conversation) {
      return res.status(404).json({ error: '對話不存在' })
    }

    // 獲取關聯的任務
    const task = await queryOne<{ id: string; status: string }>(
      `SELECT t.id, t.status FROM tasks t
       JOIN projects p ON t.project_id = p.id
       JOIN conversations c ON c.project_id = p.id
       WHERE c.id = $1
       ORDER BY t.created_at DESC LIMIT 1`,
      [id]
    )

    // 獲取 BDD Session
    const bddSession = await queryOne<{ id: string; current_phase: string }>(
      `SELECT id, current_phase FROM bdd_sessions
       WHERE conversation_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [id]
    )

    res.json({
      messages: conversation.messages || [],
      specComplete: conversation.spec_complete,
      updatedAt: conversation.updated_at,
      currentTaskId: task?.id,
      taskStatus: task?.status,
      bddSessionId: bddSession?.id,
      bddPhase: bddSession?.current_phase,
    })
  } catch (error) {
    console.error('[Operations] 獲取對話消息失敗:', error)
    res.status(500).json({ error: '獲取對話消息失敗' })
  }
})

/**
 * POST /api/operations/conversations/:id/messages
 * 添加對話消息
 */
router.post('/conversations/:id/messages', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { role, content, stage, progress } = req.body

    // 獲取當前消息
    const conversation = await queryOne<{ messages: any[] }>(
      'SELECT messages FROM conversations WHERE id = $1',
      [id]
    )

    if (!conversation) {
      return res.status(404).json({ error: '對話不存在' })
    }

    const messages = conversation.messages || []
    const messageId = crypto.randomUUID()
    const newMessage = {
      id: messageId,
      role,
      content,
      timestamp: new Date().toISOString(),
      stage,
      progress,
    }

    messages.push(newMessage)

    await query(
      'UPDATE conversations SET messages = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(messages), id]
    )

    res.json({ messageId })
  } catch (error) {
    console.error('[Operations] 添加消息失敗:', error)
    res.status(500).json({ error: '添加消息失敗' })
  }
})

// ============================================================
// 用戶訂閱 API
// ============================================================

/**
 * POST /api/operations/subscription/cancel
 * 取消訂閱
 */
router.post('/subscription/cancel', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id

    // 檢查用戶狀態
    const user = await queryOne<{ subscription_status: string }>(
      'SELECT subscription_status FROM users WHERE id = $1',
      [userId]
    )

    if (!user) {
      return res.status(404).json({ error: '用戶不存在' })
    }

    if (user.subscription_status !== 'active') {
      return res.status(400).json({ error: '訂閱狀態不是 active' })
    }

    // 更新訂閱狀態
    await query(
      "UPDATE users SET subscription_status = 'cancelled', updated_at = NOW() WHERE id = $1",
      [userId]
    )

    res.json({ success: true })
  } catch (error) {
    console.error('[Operations] 取消訂閱失敗:', error)
    res.status(500).json({ error: '取消訂閱失敗' })
  }
})

// ============================================================
// 專案狀態更新 API
// ============================================================

/**
 * PATCH /api/operations/projects/:id/status
 * 更新專案狀態
 */
router.patch('/projects/:id/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const { status, vercelUrl, customDomain, domainStatus } = req.body

    // 驗證專案屬於用戶
    const project = await queryOne<{ user_id: string }>(
      'SELECT user_id FROM projects WHERE id = $1',
      [id]
    )

    if (!project || project.user_id !== userId) {
      return res.status(404).json({ error: '專案不存在' })
    }

    const updates: string[] = ['updated_at = NOW()']
    const params: any[] = []
    let paramIndex = 1

    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`)
      params.push(status)
    }
    if (vercelUrl !== undefined) {
      updates.push(`vercel_url = $${paramIndex++}`)
      params.push(vercelUrl)
    }
    if (customDomain !== undefined) {
      updates.push(`custom_domain = $${paramIndex++}`)
      params.push(customDomain)
    }
    if (domainStatus !== undefined) {
      updates.push(`domain_status = $${paramIndex++}`)
      params.push(domainStatus)
    }

    params.push(id)
    await query(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      params
    )

    res.json({ success: true })
  } catch (error) {
    console.error('[Operations] 更新專案狀態失敗:', error)
    res.status(500).json({ error: '更新專案狀態失敗' })
  }
})

// ============================================================
// 通知 API
// ============================================================

/**
 * POST /api/operations/notifications
 * 創建通知
 */
router.post('/notifications', requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId, type, title, message, metadata } = req.body

    const notificationId = crypto.randomUUID()
    await query(
      `INSERT INTO notifications (id, user_id, type, title, message, metadata, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, false, NOW())`,
      [notificationId, userId, type, title, message, JSON.stringify(metadata || {})]
    )

    res.json({ notificationId })
  } catch (error) {
    console.error('[Operations] 創建通知失敗:', error)
    res.status(500).json({ error: '創建通知失敗' })
  }
})

// ============================================================
// 程式碼生成 API
// ============================================================

/**
 * POST /api/operations/generate
 * 開始生成程式碼
 */
router.post('/generate', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { projectId } = req.body

    // 查詢專案
    const project = await queryOne<{ id: string; status: string; user_id: string }>(
      'SELECT id, status, user_id FROM projects WHERE id = $1',
      [projectId]
    )

    if (!project) {
      return res.status(404).json({ error: '專案不存在' })
    }

    if (project.user_id !== userId) {
      return res.status(403).json({ error: '無權訪問此專案' })
    }

    // 檢查對話是否完成
    const conversation = await queryOne<{ id: string; spec_complete: boolean }>(
      'SELECT id, spec_complete FROM conversations WHERE project_id = $1',
      [projectId]
    )

    if (!conversation) {
      return res.status(400).json({ error: '沒有對話記錄' })
    }

    if (!conversation.spec_complete) {
      return res.status(400).json({ error: 'BDD Spec 尚未完成' })
    }

    // 檢查現有生成記錄
    const existingGeneration = await queryOne<{
      id: string
      status: string
      attempt_count: number
    }>(
      `SELECT id, status, attempt_count FROM generations
       WHERE project_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [projectId]
    )

    // 自癒機制：3 次失敗後停止
    if (existingGeneration?.status === 'failed' && existingGeneration.attempt_count >= 3) {
      await query(
        "UPDATE projects SET status = 'failed', updated_at = NOW() WHERE id = $1",
        [projectId]
      )
      return res.status(400).json({ error: '生成失敗次數已達上限' })
    }

    // 創建或更新生成記錄
    let generationId: string
    let attemptCount: number

    if (existingGeneration?.status === 'failed') {
      generationId = existingGeneration.id
      attemptCount = existingGeneration.attempt_count + 1
      await query(
        `UPDATE generations SET status = 'success', attempt_count = $1, updated_at = NOW()
         WHERE id = $2`,
        [attemptCount, generationId]
      )
    } else {
      generationId = crypto.randomUUID()
      attemptCount = 1
      await query(
        `INSERT INTO generations (id, project_id, status, attempt_count, created_at, updated_at)
         VALUES ($1, $2, 'success', 1, NOW(), NOW())`,
        [generationId, projectId]
      )
    }

    // 更新專案狀態
    await query(
      "UPDATE projects SET status = 'testing', updated_at = NOW() WHERE id = $1",
      [projectId]
    )

    res.json({ generationId, attemptCount, status: 'success' })
  } catch (error) {
    console.error('[Operations] 生成程式碼失敗:', error)
    res.status(500).json({ error: '生成程式碼失敗' })
  }
})

/**
 * POST /api/operations/deploy
 * 部署專案
 */
router.post('/deploy', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { projectId } = req.body

    // 查詢專案
    const project = await queryOne<{
      id: string
      status: string
      user_id: string
      name: string
    }>(
      'SELECT id, status, user_id, name FROM projects WHERE id = $1',
      [projectId]
    )

    if (!project) {
      return res.status(404).json({ error: '專案不存在' })
    }

    if (project.user_id !== userId) {
      return res.status(403).json({ error: '無權訪問此專案' })
    }

    if (project.status !== 'testing') {
      return res.status(400).json({ error: '專案狀態必須為 testing' })
    }

    // 創建部署記錄
    const deploymentId = crypto.randomUUID()
    await query(
      `INSERT INTO deployments (id, project_id, status, created_at)
       VALUES ($1, $2, 'pending', NOW())`,
      [deploymentId, projectId]
    )

    // 更新專案狀態
    await query(
      "UPDATE projects SET status = 'deploying', updated_at = NOW() WHERE id = $1",
      [projectId]
    )

    res.json({ deploymentId, status: 'pending' })
  } catch (error) {
    console.error('[Operations] 部署專案失敗:', error)
    res.status(500).json({ error: '部署專案失敗' })
  }
})

export default router
