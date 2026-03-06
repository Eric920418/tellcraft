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
// 每對話限速（5 秒窗口最多 1 條）
// ============================================================

const RATE_LIMIT_WINDOW_SECONDS = 5
const RATE_LIMIT_MAX_REQUESTS = 1
const PLAN_MESSAGE_LIMITS: Record<string, number> = {
  free: 50,
  creator: 200,
  pro: 1000,
  business: Infinity,
}
const MESSAGE_LIMIT_ERROR_CODE = 'MESSAGE_LIMIT_REACHED'

/**
 * Lua script: INCR + EXPIRE 原子操作
 * 返回 { allowed, retryAfter }
 */
async function checkConversationRateLimit(conversationId: string): Promise<{ allowed: boolean; retryAfter: number }> {
  if (!redisClient) return { allowed: true, retryAfter: 0 } // Redis 不可用時降級放行

  try {
    const key = `rate-limit:conv:${conversationId}`
    const script = `
      local current = redis.call("INCR", KEYS[1])
      if current == 1 then
        redis.call("EXPIRE", KEYS[1], ARGV[1])
      end
      return current
    `
    const count = await redisClient.eval(script, 1, key, RATE_LIMIT_WINDOW_SECONDS) as number

    if (count > RATE_LIMIT_MAX_REQUESTS) {
      const ttl = await redisClient.ttl(key)
      return { allowed: false, retryAfter: Math.max(ttl, 1) }
    }

    return { allowed: true, retryAfter: 0 }
  } catch (err) {
    console.warn('[RateLimit] Redis 錯誤，降級放行:', err)
    return { allowed: true, retryAfter: 0 } // 降級放行
  }
}

// ============================================================
// Guest 限制 Helper
// ============================================================

/**
 * 檢查用戶是否為匿名（email 以 @tellcraft.local 結尾）
 */
async function isAnonymousUser(userId: string): Promise<boolean> {
  const user = await db.queryOne<{ email: string }>(
    'SELECT email FROM users WHERE id = $1',
    [userId]
  )
  return user?.email?.endsWith('@tellcraft.local') ?? false
}

/**
 * 檢查匿名用戶是否已完成過 fast build（project_files 中有 uiux 記錄）
 */
async function hasGuestCompletedBuild(userId: string): Promise<boolean> {
  const result = await db.queryOne<{ exists: boolean }>(
    `SELECT EXISTS(
      SELECT 1 FROM project_files pf
      JOIN projects p ON pf.project_id = p.id
      WHERE p.user_id = $1 AND pf.skill_source = 'uiux'
    ) as exists`,
    [userId]
  )
  return result?.exists ?? false
}

async function getUserMessageQuotaStatus(userId: string): Promise<{
  messageCount: number
  messageLimit: number
  limitReached: boolean
} | null> {
  const user = await db.queryOne<{
    plan: string
    message_count_this_period: number
  }>(
    'SELECT plan, message_count_this_period FROM users WHERE id = $1',
    [userId]
  )

  if (!user) return null

  const messageLimit = PLAN_MESSAGE_LIMITS[user.plan] || 50
  const messageCount = user.message_count_this_period || 0
  return {
    messageCount,
    messageLimit,
    limitReached: messageCount >= messageLimit,
  }
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
    const { message, projectId, userId: bodyUserId, mode, locale } = req.body
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

    // ===== Guest 限制 =====
    const anonymous = await isAnonymousUser(userId)
    if (anonymous) {
      // 匿名用戶禁止 fine mode
      if (mode === 'fine') {
        return res.status(403).json({
          error: 'GUEST_FINE_LOCKED',
          message: '精細模式需要登入才能使用'
        })
      }
      // 匿名用戶 fast build 只能一次
      const alreadyUsed = await hasGuestCompletedBuild(userId)
      if (alreadyUsed) {
        return res.status(403).json({
          error: 'GUEST_LIMIT_REACHED',
          message: '免費試用已結束，請登入以繼續使用'
        })
      }
    }

    const quota = await getUserMessageQuotaStatus(userId)
    if (!quota) {
      return res.status(404).json({ error: 'User not found' })
    }
    if (quota.limitReached) {
      return res.status(403).json({
        error: MESSAGE_LIMIT_ERROR_CODE,
        message: '已達到本期訊息配額上限',
      })
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

    // 限速檢查（5 秒窗口最多 1 條）
    const rateLimit = await checkConversationRateLimit(conversationId)
    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: `請求過於頻繁，請 ${rateLimit.retryAfter} 秒後再試`,
        retryAfter: rateLimit.retryAfter,
      })
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
    await db.query(
      'UPDATE users SET message_count_this_period = $1 WHERE id = $2',
      [quota.messageCount + 1, userId]
    )

    // 加入 BullMQ 隊列
    const job = await orchestratorQueue.add('process-message', {
      projectId,
      conversationId,
      userId,
      message,
      mode,
      locale,
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
    const { message, projectId, taskId, specConfirmed, userId: bodyUserId, locale } = req.body
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

    // ===== Guest 完成後鎖定回覆 =====
    const anonymousReply = await isAnonymousUser(userId)
    if (anonymousReply) {
      const alreadyUsed = await hasGuestCompletedBuild(userId)
      if (alreadyUsed) {
        return res.status(403).json({
          error: 'GUEST_LIMIT_REACHED',
          message: '免費試用已結束，請登入以繼續使用'
        })
      }
    }

    const replyQuota = await getUserMessageQuotaStatus(userId)
    if (!replyQuota) {
      return res.status(404).json({ error: 'User not found' })
    }
    if (replyQuota.limitReached) {
      return res.status(403).json({
        error: MESSAGE_LIMIT_ERROR_CODE,
        message: '已達到本期訊息配額上限',
      })
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

    // 限速檢查（5 秒窗口最多 1 條）
    const replyRateLimit = await checkConversationRateLimit(conversationId)
    if (!replyRateLimit.allowed) {
      return res.status(429).json({
        error: `請求過於頻繁，請 ${replyRateLimit.retryAfter} 秒後再試`,
        retryAfter: replyRateLimit.retryAfter,
      })
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
      locale,
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
