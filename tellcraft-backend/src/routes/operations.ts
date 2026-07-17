/**
 * Operations API 路由
 * 處理各種數據庫操作，支持前端 Server Actions 遷移
 */
import { Router, Request, Response } from 'express'
import { query, queryOne } from '../db/client'
import { requireAuth } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { createGenerationSchema, createDeploymentSchema, createTaskSchema, createWebhookSchema } from '../schemas/operations'
import crypto from 'crypto'
import { ADMIN_PLAN, resolveEffectivePlan } from '../config/plans'
import { createLogger } from '../lib/logger'

const logger = createLogger('operations')

const router: Router = Router()

// ============================================================
// 生成記錄 API
// ============================================================

/**
 * POST /api/operations/generations
 * 創建或更新生成記錄
 */
router.post('/generations', requireAuth, validateBody(createGenerationSchema), async (req: Request, res: Response) => {
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
    logger.error({ err: error }, '創建生成記錄失敗')
    res.status(500).json({ error: '創建生成記錄失敗' })
  }
})

/**
 * GET /api/operations/generations/:projectId/latest
 * 獲取專案最新生成記錄
 */
router.get('/generations/:projectId/latest', requireAuth, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params

    // P2-1：驗 project ownership 防 IDOR
    const generation = await queryOne<{
      id: string
      status: string
      attempt_count: number
      generated_code_url: string | null
      created_at: string
    }>(
      `SELECT g.id, g.status, g.attempt_count, g.generated_code_url, g.created_at
       FROM generations g
       JOIN projects p ON g.project_id = p.id
       WHERE g.project_id = $1 AND p.user_id = $2
       ORDER BY g.created_at DESC LIMIT 1`,
      [projectId, req.user!.id]
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
    logger.error({ err: error }, '獲取生成記錄失敗')
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
router.post('/deployments', requireAuth, validateBody(createDeploymentSchema), async (req: Request, res: Response) => {
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
    logger.error({ err: error }, '創建部署記錄失敗')
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
    logger.error({ err: error }, '更新部署記錄失敗')
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
router.post('/tasks', requireAuth, validateBody(createTaskSchema), async (req: Request, res: Response) => {
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
    logger.error({ err: error }, '創建任務失敗')
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
    logger.error({ err: error }, '更新任務失敗')
    res.status(500).json({ error: '更新任務失敗' })
  }
})

/**
 * GET /api/operations/tasks/:id
 * 獲取任務詳情
 */
router.get('/tasks/:id', requireAuth, async (req: Request, res: Response) => {
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
    logger.error({ err: error }, '獲取任務失敗')
    res.status(500).json({ error: '獲取任務失敗' })
  }
})

// 方案優先級權重
// admin 必須列在這裡：查表是 `WEIGHTS[plan] || 0`，漏了會讓 admin 落到 free 的最低優先級
const PLAN_PRIORITY_WEIGHTS: Record<string, number> = {
  free: 0,
  creator: 10,
  pro: 50,
  business: 100,
  [ADMIN_PLAN]: 1000
}

/**
 * POST /api/operations/tasks/full
 * 完整建立任務（包含訂閱檢查、優先級計算）
 */
router.post('/tasks/full', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { projectId, goal } = req.body

    // 查詢專案
    const project = await queryOne<{ id: string; user_id: string }>(
      'SELECT id, user_id FROM projects WHERE id = $1',
      [projectId]
    )

    if (!project) {
      return res.status(404).json({ error: '專案不存在' })
    }

    // 查詢用戶訂閱狀態
    const user = await queryOne<{ plan: string; subscription_status: string; is_admin: boolean }>(
      'SELECT plan, subscription_status, is_admin FROM users WHERE id = $1',
      [userId]
    )

    // Admin 不受訂閱狀態限制
    if (!user || (!user.is_admin && user.subscription_status !== 'active')) {
      return res.status(403).json({ error: '訂閱狀態必須為 active' })
    }

    // 計算優先級
    const calculatedPriority = PLAN_PRIORITY_WEIGHTS[resolveEffectivePlan(user)] || 0

    // 建立任務
    const taskId = crypto.randomUUID()
    await query(
      `INSERT INTO tasks (id, project_id, user_id, input, status, priority, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'planning', $5, NOW(), NOW())`,
      [taskId, projectId, project.user_id, JSON.stringify({ goal }), calculatedPriority]
    )

    // 模擬 LLM Planning - 更新任務狀態為等待確認
    const stepCount = 2
    await query(
      `UPDATE tasks SET status = 'pending_approval', output = $1, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify({ plan: { steps: stepCount } }), taskId]
    )

    res.json({
      taskId,
      status: 'pending_approval',
      stepCount,
      calculatedPriority
    })
  } catch (error) {
    logger.error({ err: error }, '完整建立任務失敗')
    res.status(500).json({ error: '建立任務失敗' })
  }
})

/**
 * POST /api/operations/tasks/:id/confirm
 * 確認任務計劃
 */
router.post('/tasks/:id/confirm', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const { approved } = req.body

    // 查詢任務
    const task = await queryOne<{ id: string; status: string; user_id: string }>(
      'SELECT id, status, user_id FROM tasks WHERE id = $1',
      [id]
    )

    if (!task) {
      return res.status(404).json({ error: '任務不存在' })
    }

    // 檢查擁有權
    if (task.user_id !== userId) {
      return res.status(403).json({ error: '僅任務擁有者可確認' })
    }

    // 檢查任務狀態
    if (task.status !== 'pending_approval') {
      return res.status(400).json({ error: '任務狀態必須為 pending_approval' })
    }

    const newStatus = approved ? 'executing' : 'cancelled'
    await query(
      `UPDATE tasks SET status = $1, ${approved ? 'started_at = NOW(),' : ''} updated_at = NOW() WHERE id = $2`,
      [newStatus, id]
    )

    res.json({ taskId: id, status: newStatus })
  } catch (error) {
    logger.error({ err: error }, '確認任務失敗')
    res.status(500).json({ error: '確認任務失敗' })
  }
})

/**
 * POST /api/operations/tasks/:id/cancel
 * 取消任務
 */
router.post('/tasks/:id/cancel', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    // 查詢任務
    const task = await queryOne<{ id: string; status: string; user_id: string }>(
      'SELECT id, status, user_id FROM tasks WHERE id = $1',
      [id]
    )

    if (!task) {
      return res.status(404).json({ error: '任務不存在' })
    }

    // 檢查擁有權
    if (task.user_id !== userId) {
      return res.status(403).json({ error: '僅任務擁有者可取消' })
    }

    // 檢查任務狀態
    if (task.status === 'completed' || task.status === 'cancelled') {
      return res.status(400).json({ error: '已完成或已取消的任務無法再取消' })
    }

    // 取消運行中的步驟
    await query(
      `UPDATE task_steps SET status = 'cancelled', updated_at = NOW()
       WHERE task_id = $1 AND status = 'running'`,
      [id]
    )

    // 更新任務狀態
    await query(
      `UPDATE tasks SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
      [id]
    )

    // 發送通知
    await query(
      `INSERT INTO notifications (id, user_id, type, title, task_id, created_at)
       VALUES ($1, $2, 'task_cancelled', '任務已取消', $3, NOW())`,
      [crypto.randomUUID(), task.user_id, id]
    )

    res.json({ taskId: id, status: 'cancelled' })
  } catch (error) {
    logger.error({ err: error }, '取消任務失敗')
    res.status(500).json({ error: '取消任務失敗' })
  }
})

/**
 * POST /api/operations/tasks/:id/retry
 * 重試任務
 */
router.post('/tasks/:id/retry', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    // 查詢任務
    const task = await queryOne<{ id: string; status: string; user_id: string; failed_step: number | null }>(
      'SELECT id, status, user_id, failed_step FROM tasks WHERE id = $1',
      [id]
    )

    if (!task) {
      return res.status(404).json({ error: '任務不存在' })
    }

    // 檢查擁有權
    if (task.user_id !== userId) {
      return res.status(403).json({ error: '僅任務擁有者可重試' })
    }

    // 檢查任務狀態
    if (task.status !== 'failed') {
      return res.status(400).json({ error: '只有 failed 狀態的任務可重試' })
    }

    const currentStep = task.failed_step || 1

    // 將失敗的步驟改為 running
    await query(
      `UPDATE task_steps SET status = 'running', updated_at = NOW()
       WHERE task_id = $1 AND step_number = $2`,
      [id, currentStep]
    )

    // 更新任務狀態
    await query(
      `UPDATE tasks SET status = 'executing', current_step = $1, updated_at = NOW() WHERE id = $2`,
      [currentStep, id]
    )

    res.json({ taskId: id, status: 'executing', currentStep })
  } catch (error) {
    logger.error({ err: error }, '重試任務失敗')
    res.status(500).json({ error: '重試任務失敗' })
  }
})

// ============================================================
// 對話消息 API
// ============================================================

/**
 * GET /api/operations/conversations/:id/messages
 * 獲取對話消息（含任務狀態）
 */
router.get('/conversations/:id/messages', requireAuth, async (req: Request, res: Response) => {
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
    logger.error({ err: error }, '獲取對話消息失敗')
    res.status(500).json({ error: '獲取對話消息失敗' })
  }
})

/**
 * POST /api/operations/conversations/:id/messages
 * 添加對話消息
 */
router.post('/conversations/:id/messages', requireAuth, async (req: Request, res: Response) => {
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
    logger.error({ err: error }, '添加消息失敗')
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
    logger.error({ err: error }, '取消訂閱失敗')
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
    logger.error({ err: error }, '更新專案狀態失敗')
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
    logger.error({ err: error }, '創建通知失敗')
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

    // 獲取 BDD Session 的快照數據
    const bddSession = await queryOne<{
      schema_sql_content: string | null
      features_content: string | null
    }>(
      `SELECT schema_sql_content, features_content FROM bdd_sessions
       WHERE conversation_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [conversation.id]
    )

    // 計算版本號
    const maxVersion = await queryOne<{ max_version: number }>(
      'SELECT COALESCE(MAX(version_number), 0) as max_version FROM generations WHERE project_id = $1',
      [projectId]
    )
    const newVersionNumber = (maxVersion?.max_version || 0) + 1

    // 創建或更新生成記錄
    let generationId: string
    let attemptCount: number

    if (existingGeneration?.status === 'failed') {
      generationId = existingGeneration.id
      attemptCount = existingGeneration.attempt_count + 1
      await query(
        `UPDATE generations SET
           status = 'success',
           attempt_count = $1,
           version_number = $2,
           conversation_id = $3,
           schema_snapshot = $4,
           features_snapshot = $5,
           updated_at = NOW()
         WHERE id = $6`,
        [
          attemptCount,
          newVersionNumber,
          conversation.id,
          bddSession?.schema_sql_content || null,
          bddSession?.features_content ? JSON.stringify(bddSession.features_content) : null,
          generationId
        ]
      )
    } else {
      generationId = crypto.randomUUID()
      attemptCount = 1
      await query(
        `INSERT INTO generations (
           id, project_id, status, attempt_count,
           version_number, conversation_id,
           schema_snapshot, features_snapshot,
           created_at, updated_at
         ) VALUES ($1, $2, 'success', 1, $3, $4, $5, $6, NOW(), NOW())`,
        [
          generationId,
          projectId,
          newVersionNumber,
          conversation.id,
          bddSession?.schema_sql_content || null,
          bddSession?.features_content ? JSON.stringify(bddSession.features_content) : null
        ]
      )
    }

    // 更新專案狀態
    await query(
      "UPDATE projects SET status = 'testing', updated_at = NOW() WHERE id = $1",
      [projectId]
    )

    res.json({ generationId, attemptCount, status: 'success' })
  } catch (error) {
    logger.error({ err: error }, '生成程式碼失敗')
    res.status(500).json({ error: '生成程式碼失敗' })
  }
})

/**
 * PATCH /api/operations/projects/:id/iterate
 * 迭代修改專案
 */
router.patch('/projects/:id/iterate', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const { isDestructive } = req.body

    // 驗證專案
    const project = await queryOne<{ id: string; status: string; user_id: string }>(
      'SELECT id, status, user_id FROM projects WHERE id = $1',
      [id]
    )

    if (!project || project.user_id !== userId) {
      return res.status(404).json({ error: '專案不存在' })
    }

    if (project.status !== 'deployed' && project.status !== 'failed') {
      return res.status(400).json({ error: '專案狀態必須為 deployed 或 failed' })
    }

    let backupCreated = false

    // 破壞性變更前備份
    if (isDestructive) {
      const backupUrl = `https://r2.example.com/backup-${Date.now()}.sql`
      await query(
        `INSERT INTO generations (id, project_id, backup_sql_url, backup_created_at, status, created_at)
         VALUES ($1, $2, $3, NOW(), 'pending', NOW())`,
        [crypto.randomUUID(), id, backupUrl]
      )
      backupCreated = true
    }

    // 更新專案狀態
    await query(
      "UPDATE projects SET status = 'generating', updated_at = NOW() WHERE id = $1",
      [id]
    )

    res.json({ projectId: id, status: 'generating', backupCreated })
  } catch (error) {
    logger.error({ err: error }, '迭代修改失敗')
    res.status(500).json({ error: '迭代修改失敗' })
  }
})

/**
 * POST /api/operations/subscription/action
 * 訂閱操作（取消/重新訂閱）
 */
router.post('/subscription/action', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { action } = req.body as { action?: 'cancel' | 'resubscribe' }

    const user = await queryOne<{ subscription_status: string }>(
      'SELECT subscription_status FROM users WHERE id = $1',
      [userId]
    )

    if (!user) {
      return res.status(404).json({ error: '用戶不存在' })
    }

    if (action === 'resubscribe') {
      await query(
        "UPDATE users SET subscription_status = 'active', cancelled_at = NULL, updated_at = NOW() WHERE id = $1",
        [userId]
      )
      return res.json({ userId, status: 'active' })
    }

    // 取消訂閱
    await query(
      "UPDATE users SET subscription_status = 'suspended', cancelled_at = NOW(), updated_at = NOW() WHERE id = $1",
      [userId]
    )

    res.json({ userId, status: 'suspended' })
  } catch (error) {
    logger.error({ err: error }, '訂閱操作失敗')
    res.status(500).json({ error: '訂閱操作失敗' })
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
    logger.error({ err: error }, '部署專案失敗')
    res.status(500).json({ error: '部署專案失敗' })
  }
})

// ============================================================
// 資料導出 API
// ============================================================

/**
 * POST /api/operations/export
 * 導出資料
 */
router.post('/export', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { format, projectId } = req.body as { format: 'sql' | 'json'; projectId?: string }

    // 如果指定了 projectId，檢查擁有權
    if (projectId) {
      const project = await queryOne<{ user_id: string }>(
        'SELECT user_id FROM projects WHERE id = $1',
        [projectId]
      )

      if (!project || project.user_id !== userId) {
        return res.status(403).json({ error: '僅專案擁有者可導出' })
      }
    }

    // 生成導出 URL
    const downloadUrl = `https://r2.example.com/export-${Date.now()}.${format === 'sql' ? 'sql' : 'json'}`

    res.json({ downloadUrl, format: format === 'sql' ? 'sql_dump' : 'json' })
  } catch (error) {
    logger.error({ err: error }, '導出資料失敗')
    res.status(500).json({ error: '導出資料失敗' })
  }
})

/**
 * POST /api/operations/transfer
 * 移轉資源
 */
router.post('/transfer', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { projectId, dbApiKey, vercelToken } = req.body

    // 查詢專案
    const project = await queryOne<{
      id: string
      user_id: string
      is_transferred: boolean
    }>(
      'SELECT id, user_id, is_transferred FROM projects WHERE id = $1',
      [projectId]
    )

    if (!project) {
      return res.status(404).json({ error: '專案不存在' })
    }

    if (project.user_id !== userId) {
      return res.status(403).json({ error: '無權訪問此專案' })
    }

    // 檢查用戶訂閱狀態
    const user = await queryOne<{ subscription_status: string }>(
      'SELECT subscription_status FROM users WHERE id = $1',
      [userId]
    )

    if (user?.subscription_status !== 'active') {
      return res.status(400).json({ error: '訂閱狀態必須為 active' })
    }

    if (project.is_transferred) {
      return res.status(400).json({ error: '已移轉的專案不可再次移轉' })
    }

    // 驗證 API Key
    if (!dbApiKey?.startsWith('sb_key') || !vercelToken?.startsWith('vercel_')) {
      return res.status(400).json({ error: 'API Key 無效' })
    }

    // 執行移轉
    await query(
      `UPDATE projects SET is_transferred = true, transferred_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [projectId]
    )

    res.json({ projectId, transferred: true })
  } catch (error) {
    logger.error({ err: error }, '移轉資源失敗')
    res.status(500).json({ error: '移轉資源失敗' })
  }
})

// ============================================================
// 技能 API
// ============================================================

/**
 * POST /api/operations/skills
 * 註冊技能
 */
router.post('/skills', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, description, version } = req.body

    // 檢查是否已存在
    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM skills WHERE name = $1 AND version = $2',
      [name, version]
    )

    if (existing) {
      return res.json({ skillId: existing.id, status: 'exists' })
    }

    // 創建新技能
    const skillId = crypto.randomUUID()
    await query(
      `INSERT INTO skills (id, name, description, version, status, created_at)
       VALUES ($1, $2, $3, $4, 'active', NOW())`,
      [skillId, name, description || '', version]
    )

    res.json({ skillId, status: 'created' })
  } catch (error) {
    logger.error({ err: error }, '註冊技能失敗')
    res.status(500).json({ error: '註冊技能失敗' })
  }
})

// ============================================================
// Webhook API
// ============================================================

/**
 * POST /api/operations/webhooks
 * 配置 Webhook
 */
router.post('/webhooks', requireAuth, validateBody(createWebhookSchema), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { url, events, secret } = req.body

    // 檢查是否已存在
    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM user_webhooks WHERE user_id = $1 AND url = $2',
      [userId, url]
    )

    if (existing) {
      // 更新現有 webhook
      await query(
        `UPDATE user_webhooks SET events = $1, secret = $2, updated_at = NOW()
         WHERE id = $3`,
        [JSON.stringify(events), secret, existing.id]
      )
      return res.json({ webhookId: existing.id, status: 'updated' })
    }

    // 創建新 webhook
    const webhookId = crypto.randomUUID()
    await query(
      `INSERT INTO user_webhooks (id, user_id, url, events, secret, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, true, NOW())`,
      [webhookId, userId, url, JSON.stringify(events), secret]
    )

    res.json({ webhookId, status: 'created' })
  } catch (error) {
    logger.error({ err: error }, '配置 Webhook 失敗')
    res.status(500).json({ error: '配置 Webhook 失敗' })
  }
})

// ============================================================
// WebContainer 預覽 Build / Runtime Error 自動修復
// ============================================================

/**
 * POST /api/operations/fix-build-error
 * WebContainer 的 next dev 編譯失敗 (errorType='build') 或運行時崩潰 (errorType='runtime') 時，
 * 前端呼叫此 API 用 Haiku LLM 修復
 */
router.post('/fix-build-error', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const {
      buildError,            // legacy field（向後相容）
      errorMessage,          // new: 統一的錯誤訊息
      errorStack,            // new: runtime only
      errorPath,             // new: runtime only
      errorType = 'build',   // new: 'build' | 'runtime'，預設 build 向後相容
      code,
      tailwindConfig,
    } = req.body as {
      buildError?: string
      errorMessage?: string
      errorStack?: string
      errorPath?: string
      errorType?: 'build' | 'runtime'
      code: { pages: { path: string; content: string; description?: string }[]; components: { path: string; content: string; description?: string }[]; styles: string }
      tailwindConfig?: string
    }

    const msg = errorMessage ?? buildError
    if (!msg || !code?.pages) {
      return res.status(400).json({ error: 'Missing error message or code' })
    }

    const { fixPreviewError } = await import('../services/code-verify')
    const result = await fixPreviewError({
      errorType,
      errorMessage: msg,
      errorStack,
      errorPath,
      code: {
        pages: (code.pages || []).map((p: { path: string; content: string; description?: string }) => ({ path: p.path, content: p.content, description: p.description || '' })),
        components: (code.components || []).map((c: { path: string; content: string; description?: string }) => ({ path: c.path, content: c.content, description: c.description || '' })),
        styles: code.styles || '',
      },
      tailwindConfig,
      trackingContext: { userId },
    })

    if (!result) {
      return res.json({ fixedCode: null, fixes: [] })
    }

    res.json({ fixedCode: result.fixedCode, fixes: result.fixes })
  } catch (error) {
    logger.error({ err: error }, 'fix-build-error 失敗')
    res.status(500).json({ error: 'Fix preview error failed' })
  }
})

export default router
