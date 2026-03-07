/**
 * Session API 路由
 * 處理用戶會話初始化、對話管理
 */
import { Router, Request, Response } from 'express'
import { query, queryOne } from '../db/client'
import { requireAuth, optionalAuth } from '../middleware/auth'
import crypto from 'crypto'
import { getCreditLimit, getProjectLimit, isCreditExhausted, CREDIT_LIMIT_ERROR_CODE } from '../config/plans'
import { createLogger } from '../lib/logger'

const logger = createLogger('session')

const router: Router = Router()

/**
 * POST /api/session/initialize
 * 初始化會話（支援匿名用戶）
 */
router.post('/initialize', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { anonymousId, conversationId, createNew } = req.body as {
      anonymousId?: string
      conversationId?: string
      createNew?: boolean
    }

    let userId: string
    let isNewUser = false

    // 已登入用戶
    if (req.user) {
      userId = req.user.id
    } else if (anonymousId) {
      // 匿名用戶 - 查找或創建
      // 優先使用 email 查找（更可靠）
      const anonEmail = `anon_${anonymousId}@tellcraft.local`
      const existingUser = await queryOne<{ id: string }>(
        'SELECT id FROM users WHERE email = $1',
        [anonEmail]
      )

      if (existingUser) {
        userId = existingUser.id
      } else {
        // 創建匿名用戶
        userId = crypto.randomUUID()
        await query(
          `INSERT INTO users (id, email, plan, subscription_status, credits_used_this_period, message_count_this_period)
           VALUES ($1, $2, 'free', 'active', 0, 0)`,
          [userId, anonEmail]
        )
        isNewUser = true
      }
    } else {
      return res.status(400).json({ error: '需要 anonymousId 或登入' })
    }

    // 查詢用戶資料
    const user = await queryOne<{
      plan: string
      credits_used_this_period: number
    }>(
      'SELECT plan, credits_used_this_period FROM users WHERE id = $1',
      [userId]
    )

    if (!user) {
      return res.status(404).json({ error: '用戶不存在' })
    }

    const quotaReached = isCreditExhausted(user.plan, user.credits_used_this_period)

    // 如果指定了 conversationId，嘗試恢復
    if (conversationId && !createNew) {
      const conv = await queryOne<{
        id: string
        project_id: string
        messages: any
        spec_complete: boolean
      }>(
        `SELECT c.id, c.project_id, c.messages, c.spec_complete
         FROM conversations c
         JOIN projects p ON c.project_id = p.id
         WHERE c.id = $1 AND p.user_id = $2`,
        [conversationId, userId]
      )

      if (conv) {
        return res.json({
          userId,
          projectId: conv.project_id,
          conversationId: conv.id,
          messages: conv.messages || [],
          isNewUser,
          isNewProject: false,
          isNewConversation: false,
          resumed: true,
          readOnly: quotaReached,
          lockReason: quotaReached ? 'credit_limit' : undefined,
          creditsUsed: user.credits_used_this_period,
          creditLimit: getCreditLimit(user.plan),
        })
      }
    }

    // 配額滿：進入唯讀模式，回傳最近一個有歷史內容的對話供預覽
    if (quotaReached) {
      const latestConversation = await queryOne<{
        id: string
        project_id: string
        messages: any
      }>(
        `SELECT c.id, c.project_id, c.messages
         FROM conversations c
         JOIN projects p ON c.project_id = p.id
         WHERE p.user_id = $1
           AND jsonb_array_length(COALESCE(c.messages::jsonb, '[]'::jsonb)) > 0
         ORDER BY c.updated_at DESC
         LIMIT 1`,
        [userId]
      )

      if (!latestConversation) {
        return res.status(403).json({
          error: CREDIT_LIMIT_ERROR_CODE,
          message: '已達到本期 Credit 配額上限',
        })
      }

      return res.json({
        userId,
        projectId: latestConversation.project_id,
        conversationId: latestConversation.id,
        messages: latestConversation.messages || [],
        isNewUser,
        isNewProject: false,
        isNewConversation: false,
        resumed: true,
        readOnly: true,
        lockReason: 'credit_limit',
        creditsUsed: user.credits_used_this_period,
        creditLimit: getCreditLimit(user.plan),
      })
    }

    // 查找或創建專案
    let projectId: string
    let isNewProject = false

    // 查找可複用的專案（draft 或 generating 狀態）
    const existingProject = await queryOne<{ id: string; status: string }>(
      `SELECT id, status FROM projects
       WHERE user_id = $1 AND status IN ('draft', 'generating')
       ORDER BY updated_at DESC LIMIT 1`,
      [userId]
    )

    if (existingProject && !createNew) {
      projectId = existingProject.id
    } else {
      // 檢查專案數量限制
      const projectCount = await queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM projects WHERE user_id = $1',
        [userId]
      )
      const projectLimit = getProjectLimit(user.plan)

      if (parseInt(projectCount?.count || '0', 10) >= projectLimit && !createNew) {
        // 達到限制，複用最近的專案
        const recentProject = await queryOne<{ id: string }>(
          'SELECT id FROM projects WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1',
          [userId]
        )
        if (recentProject) {
          projectId = recentProject.id
        } else {
          return res.status(403).json({ error: '已達到專案數量上限' })
        }
      } else {
        // 創建新專案（處理名稱衝突）
        projectId = crypto.randomUUID()
        const baseName = `專案 ${new Date().toLocaleDateString('zh-TW')}`

        // 檢查名稱是否已存在
        const existingNames = await query<{ name: string }>(
          `SELECT name FROM projects WHERE user_id = $1 AND name LIKE $2`,
          [userId, `${baseName}%`]
        )

        let finalName = baseName
        if (existingNames.rows.length > 0) {
          const existingSet = new Set(existingNames.rows.map(r => r.name))
          let suffix = 2
          while (existingSet.has(finalName)) {
            finalName = `${baseName} (${suffix})`
            suffix++
          }
        }

        await query(
          `INSERT INTO projects (id, user_id, name, status, created_at, updated_at)
           VALUES ($1, $2, $3, 'draft', NOW(), NOW())`,
          [projectId, userId, finalName]
        )
        isNewProject = true
      }
    }

    // 查找或創建對話
    let conversationIdResult: string
    let isNewConversation = false
    let messages: any[] = []

    if (!createNew) {
      // 查找未完成的對話
      const existingConv = await queryOne<{ id: string; messages: any }>(
        `SELECT id, messages FROM conversations
         WHERE project_id = $1 AND spec_complete = false
         ORDER BY updated_at DESC LIMIT 1`,
        [projectId]
      )

      if (existingConv) {
        conversationIdResult = existingConv.id
        messages = existingConv.messages || []
      } else {
        // 創建新對話
        conversationIdResult = crypto.randomUUID()
        await query(
          `INSERT INTO conversations (id, project_id, messages, spec_complete, created_at, updated_at)
           VALUES ($1, $2, '[]', false, NOW(), NOW())`,
          [conversationIdResult, projectId]
        )
        isNewConversation = true
      }
    } else {
      // 強制創建新對話
      conversationIdResult = crypto.randomUUID()
      await query(
        `INSERT INTO conversations (id, project_id, messages, spec_complete, created_at, updated_at)
         VALUES ($1, $2, '[]', false, NOW(), NOW())`,
        [conversationIdResult, projectId]
      )
      isNewConversation = true
    }

    res.json({
      userId,
      projectId,
      conversationId: conversationIdResult,
      messages,
      isNewUser,
      isNewProject,
      isNewConversation,
      resumed: !isNewConversation && messages.length > 0,
      readOnly: false,
    })
  } catch (error) {
    logger.error({ err: error }, '初始化失敗')
    // 臨時返回詳細錯誤用於診斷
    res.status(500).json({
      error: '初始化失敗',
      detail: (error as Error).message,
    })
  }
})

/**
 * GET /api/session/conversations
 * 獲取用戶的對話列表
 */
router.get('/conversations', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id

    const result = await query<{
      id: string
      project_id: string
      project_name: string
      messages: any
      spec_complete: boolean
      updated_at: string
    }>(
      `SELECT c.id, c.project_id, p.name as project_name, c.messages, c.spec_complete, c.updated_at
       FROM conversations c
       JOIN projects p ON c.project_id = p.id
       WHERE p.user_id = $1
       ORDER BY c.updated_at DESC
       LIMIT 20`,
      [userId]
    )

    const conversations = result.rows.map(c => ({
      id: c.id,
      projectId: c.project_id,
      projectName: c.project_name,
      messageCount: (c.messages || []).length,
      lastMessage: (c.messages || []).slice(-1)[0]?.content?.slice(0, 50) || '',
      specComplete: c.spec_complete,
      updatedAt: c.updated_at
    }))

    res.json({ conversations })
  } catch (error) {
    logger.error({ err: error }, '獲取對話列表失敗')
    res.status(500).json({ error: '獲取對話列表失敗' })
  }
})

/**
 * GET /api/session/project-reminder
 * 獲取專案提醒（橫幅顯示）
 */
router.get('/project-reminder', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id

    // 查找最近的專案
    const project = await queryOne<{
      id: string
      name: string
      status: string
      vercel_url: string | null
      updated_at: string
    }>(
      `SELECT id, name, status, vercel_url, updated_at
       FROM projects
       WHERE user_id = $1
       ORDER BY updated_at DESC
       LIMIT 1`,
      [userId]
    )

    if (!project) {
      return res.json({ reminder: null })
    }

    // 根據狀態返回提醒
    const updatedAt = new Date(project.updated_at)
    const now = new Date()
    const hoursSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60)

    let reminder: {
      type: 'in_progress' | 'completed' | 'failed'
      projectId: string
      projectName: string
      message: string
      url?: string
    } | null = null

    if (project.status === 'draft' || project.status === 'generating') {
      // 查找未完成的對話
      const conv = await queryOne<{ id: string }>(
        'SELECT id FROM conversations WHERE project_id = $1 AND spec_complete = false LIMIT 1',
        [project.id]
      )

      if (conv) {
        reminder = {
          type: 'in_progress',
          projectId: project.id,
          projectName: project.name,
          message: '你有一個專案正在進行中'
        }
      }
    } else if (project.status === 'deployed' && hoursSinceUpdate < 24) {
      reminder = {
        type: 'completed',
        projectId: project.id,
        projectName: project.name,
        message: '你的專案已上線！',
        url: project.vercel_url || undefined
      }
    } else if (project.status === 'failed' && hoursSinceUpdate < 24) {
      reminder = {
        type: 'failed',
        projectId: project.id,
        projectName: project.name,
        message: '你的專案生成失敗'
      }
    }

    res.json({ reminder })
  } catch (error) {
    logger.error({ err: error }, '獲取專案提醒失敗')
    res.status(500).json({ error: '獲取專案提醒失敗' })
  }
})

export default router
