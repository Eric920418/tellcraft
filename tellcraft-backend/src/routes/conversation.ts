import { Router, type Router as RouterType } from 'express'
import { Queue } from 'bullmq'
import Redis from 'ioredis'
import crypto from 'crypto'
import { requireAuth, optionalAuth } from '../middleware/auth'
import * as db from '../db/client'

const router: RouterType = Router()

// BullMQ 隊列（在 index.ts 中初始化後傳入）
let orchestratorQueue: Queue
let redisClient: Redis

export function setOrchestratorQueue(queue: Queue) {
  orchestratorQueue = queue
}

export function setRedisClient(redis: Redis) {
  redisClient = redis
}

// ============================================================
// 對話 API
// ============================================================

/**
 * POST /api/conversation/:id/message
 * 發送消息到對話（觸發 Orchestrator）
 * 支援兩種模式：
 * 1. Bearer token 認證（前端直接呼叫）
 * 2. userId 在 body 中（server action 呼叫）
 */
router.post('/:id/message', optionalAuth, async (req, res) => {
  try {
    const { id: conversationId } = req.params
    const { message, projectId, userId: bodyUserId, mode } = req.body
    const userId = req.user?.id || bodyUserId

    if (!userId) {
      return res.status(401).json({ error: 'Missing userId or authentication' })
    }

    if (!message || !projectId) {
      return res.status(400).json({ error: 'Missing message or projectId' })
    }

    // 輸入驗證：非空 + 長度限制
    const trimmedMessage = typeof message === 'string' ? message.trim() : ''
    if (!trimmedMessage) {
      return res.status(400).json({ error: '訊息不能為空' })
    }
    if (trimmedMessage.length > 5000) {
      return res.status(400).json({ error: `訊息過長（${trimmedMessage.length} 字），上限 5000 字` })
    }

    // 取得對話
    const conversation = await db.getConversation(conversationId)
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    // 所有權驗證
    const project = await db.queryOne<{ user_id: string }>(
      'SELECT user_id FROM projects WHERE id = $1',
      [conversation.project_id]
    )
    if (project && project.user_id !== userId) {
      // 檢查匿名用戶
      const ownerUser = await db.queryOne<{ email: string }>(
        'SELECT email FROM users WHERE id = $1',
        [project.user_id]
      )
      const callerUser = await db.queryOne<{ email: string }>(
        'SELECT email FROM users WHERE id = $1',
        [userId]
      )
      if (ownerUser?.email !== callerUser?.email) {
        return res.status(403).json({ error: 'Access denied' })
      }
    }

    // 新增用戶消息到 DB
    const messageId = crypto.randomUUID()
    const newMessage = {
      id: messageId,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    }

    const messages = [...(conversation.messages as unknown[]), newMessage]
    await db.updateConversationMessages(conversationId, messages)

    // 更新用戶消息計數
    const user = await db.getUser(userId)
    if (user) {
      await db.query(
        'UPDATE users SET message_count_this_period = $1 WHERE id = $2',
        [user.message_count_this_period + 1, userId]
      )
    }

    // 加入 BullMQ 隊列
    const job = await orchestratorQueue.add('process-message', {
      projectId,
      conversationId,
      userId,
      message,
      mode,
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    })

    res.json({
      success: true,
      messageId,
      jobId: job.id,
    })
  } catch (error) {
    console.error('[Conversation] 發送消息失敗:', error)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

/**
 * POST /api/conversation/:id/reply
 * 回覆對話（多輪對話機制）
 * 支援兩種模式：
 * 1. Bearer token 認證（前端直接呼叫）
 * 2. userId 在 body 中（server action 呼叫）
 */
router.post('/:id/reply', optionalAuth, async (req, res) => {
  try {
    const { id: conversationId } = req.params
    const { message, projectId, taskId, specConfirmed, userId: bodyUserId } = req.body
    const userId = req.user?.id || bodyUserId

    if (!userId) {
      return res.status(401).json({ error: 'Missing userId or authentication' })
    }

    if (!message || !projectId) {
      return res.status(400).json({ error: 'Missing message or projectId' })
    }

    // 輸入驗證：非空 + 長度限制
    const trimmedReply = typeof message === 'string' ? message.trim() : ''
    if (!trimmedReply) {
      return res.status(400).json({ error: '訊息不能為空' })
    }
    if (trimmedReply.length > 5000) {
      return res.status(400).json({ error: `訊息過長（${trimmedReply.length} 字），上限 5000 字` })
    }

    // 取得對話
    const conversation = await db.getConversation(conversationId)
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    // 所有權驗證
    const project = await db.queryOne<{ user_id: string }>(
      'SELECT user_id FROM projects WHERE id = $1',
      [conversation.project_id]
    )
    if (project && project.user_id !== userId) {
      const ownerUser = await db.queryOne<{ email: string }>(
        'SELECT email FROM users WHERE id = $1',
        [project.user_id]
      )
      const callerUser = await db.queryOne<{ email: string }>(
        'SELECT email FROM users WHERE id = $1',
        [userId]
      )
      if (ownerUser?.email !== callerUser?.email) {
        return res.status(403).json({ error: 'Access denied' })
      }
    }

    // 新增用戶消息到 DB
    const messageId = crypto.randomUUID()
    const newMessage = {
      id: messageId,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    }

    const messages = [...(conversation.messages as unknown[]), newMessage]
    await db.updateConversationMessages(conversationId, messages)

    // 加入 BullMQ 隊列（繼續流程）
    const job = await orchestratorQueue.add('continue-flow', {
      projectId,
      conversationId,
      userId,
      taskId,
      message,
      specConfirmed,
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    })

    res.json({
      success: true,
      messageId,
      jobId: job.id,
    })
  } catch (error) {
    console.error('[Conversation] 回覆失敗:', error)
    res.status(500).json({ error: 'Failed to reply' })
  }
})

/**
 * GET /api/conversation/:id/messages
 * 取得對話消息（輪詢用）
 */
router.get('/:id/messages', optionalAuth, async (req, res) => {
  try {
    const { id: conversationId } = req.params
    const { lastUpdatedAt } = req.query

    // 取得對話
    const conversation = await db.getConversation(conversationId)
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    // 所有權驗證
    const project = await db.queryOne<{ user_id: string }>(
      'SELECT user_id FROM projects WHERE id = $1',
      [conversation.project_id]
    )
    if (project && req.user && project.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // 讀取 streaming preview（如果有的話）
    let streamingPreview = null
    if (redisClient) {
      try {
        const previewJson = await redisClient.get(`streaming:preview:${conversationId}`)
        if (previewJson) {
          streamingPreview = JSON.parse(previewJson)
        }
      } catch {
        // Redis 讀取失敗不阻塞
      }
    }

    // 輕量檢查：比較 updated_at（但如果有 streaming preview 仍然要返回）
    if (lastUpdatedAt && conversation.updated_at === lastUpdatedAt && !streamingPreview) {
      // 沒有新消息也沒有 streaming preview
      return res.json({
        messages: [],
        updatedAt: conversation.updated_at,
        hasChanges: false,
      })
    }

    // 查詢當前活躍的 task
    const activeTask = await db.queryOne<{ id: string; status: string }>(
      `SELECT id, status FROM tasks
       WHERE project_id = $1
       AND status IN ('planning', 'executing', 'pending_approval', 'waiting_approval')
       ORDER BY created_at DESC LIMIT 1`,
      [conversation.project_id]
    )

    // 如果沒有活躍 task，檢查 bdd_sessions
    let activeSessionId: string | undefined
    let activePhase: string | undefined
    if (!activeTask) {
      const bddSession = await db.queryOne<{ id: string; current_phase: string }>(
        `SELECT id, current_phase FROM bdd_sessions
         WHERE conversation_id = $1 AND current_phase != 'completed'
         ORDER BY created_at DESC LIMIT 1`,
        [conversationId]
      )
      if (bddSession) {
        activeSessionId = bddSession.id
        activePhase = bddSession.current_phase
      }
    }

    res.json({
      messages: conversation.messages,
      updatedAt: conversation.updated_at,
      hasChanges: true,
      currentTaskId: activeTask?.id || activeSessionId,
      taskStatus: activeTask?.status || activePhase,
      isComplete: conversation.spec_complete && !activeTask && !activeSessionId,
      streamingPreview,
    })
  } catch (error) {
    console.error('[Conversation] 取得消息失敗:', error)
    res.status(500).json({ error: 'Failed to get messages' })
  }
})

export default router
