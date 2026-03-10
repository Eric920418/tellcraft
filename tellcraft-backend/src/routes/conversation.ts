import { Router, type Router as RouterType } from 'express'
import { Queue } from 'bullmq'
import Redis from 'ioredis'
import crypto from 'crypto'
import { optionalAuth } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { sendMessageSchema, replyMessageSchema } from '../schemas/conversation'
import * as db from '../db/client'
import { getCreditLimit, isCreditExhausted, CREDIT_LIMIT_ERROR_CODE } from '../config/plans'
import { acquireUserActiveLock, releaseUserActiveLock, USER_ACTIVE_TTL_SECONDS } from '../services/conversation-lock'
import { repairCodePreviewInMessages } from '../services/code-repair'
import { createLogger } from '../lib/logger'

const logger = createLogger('conversation')

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
    logger.warn({ err }, 'Redis 錯誤，降級放行')
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

async function getUserCreditQuotaStatus(userId: string): Promise<{
  creditsUsed: number
  creditLimit: number
  limitReached: boolean
} | null> {
  const user = await db.queryOne<{
    plan: string
    credits_used_this_period: number
  }>(
    'SELECT plan, credits_used_this_period FROM users WHERE id = $1',
    [userId]
  )

  if (!user) return null

  const creditLimit = getCreditLimit(user.plan)
  const creditsUsed = user.credits_used_this_period || 0
  return {
    creditsUsed,
    creditLimit,
    limitReached: isCreditExhausted(user.plan, creditsUsed),
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
router.post('/:id/message', optionalAuth, validateBody(sendMessageSchema), async (req, res) => {
  try {
    const { id: conversationId } = req.params
    const { message, projectId, userId: bodyUserId, mode, locale, imageUrls } = req.body
    const userId = req.user?.id || bodyUserId

    if (!userId) {
      return res.status(401).json({ error: 'Missing userId or authentication' })
    }

    const trimmedMessage = message.trim()

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

    const quota = await getUserCreditQuotaStatus(userId)
    if (!quota) {
      return res.status(404).json({ error: 'User not found' })
    }
    if (quota.limitReached) {
      return res.status(403).json({
        error: CREDIT_LIMIT_ERROR_CODE,
        message: '已達到本期 Credit 配額上限',
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

    // 用戶全局任務鎖（防止多視窗同時跑多個 LLM 任務）
    const userLockResult = await acquireUserActiveLock(redisClient, userId, conversationId)
    if (!userLockResult.acquired) {
      return res.status(409).json({
        error: 'USER_TASK_IN_PROGRESS',
        message: '您有一個 AI 任務正在執行中，請等待完成後再發送。',
        activeConversationId: userLockResult.activeConversationId !== conversationId
          ? userLockResult.activeConversationId
          : undefined,
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

    // Credit 扣除由 Orchestrator 負責（按操作加權）

    // 加入 BullMQ 隊列
    let job
    try {
      job = await orchestratorQueue.add('process-message', {
        projectId,
        conversationId,
        userId,
        message,
        mode,
        locale,
        imageUrls: imageUrls || undefined,
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      })
    } catch (queueErr) {
      // BullMQ 失敗時回退 user-active lock
      await releaseUserActiveLock(redisClient, userId, conversationId).catch(() => {})
      throw queueErr
    }

    res.json({
      success: true,
      messageId,
      jobId: job.id,
    })
  } catch (error) {
    logger.error({ err: error }, '發送消息失敗')
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
router.post('/:id/reply', optionalAuth, validateBody(replyMessageSchema), async (req, res) => {
  try {
    const { id: conversationId } = req.params
    const { message, projectId, taskId, specConfirmed, userId: bodyUserId, locale, imageUrls } = req.body
    const userId = req.user?.id || bodyUserId

    if (!userId) {
      return res.status(401).json({ error: 'Missing userId or authentication' })
    }

    const trimmedReply = message.trim()

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

    const replyQuota = await getUserCreditQuotaStatus(userId)
    if (!replyQuota) {
      return res.status(404).json({ error: 'User not found' })
    }
    if (replyQuota.limitReached) {
      return res.status(403).json({
        error: CREDIT_LIMIT_ERROR_CODE,
        message: '已達到本期 Credit 配額上限',
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

    // 用戶全局任務鎖：同一 conversationId 的 reply（多輪交互）只刷新 TTL
    const replyLockResult = await acquireUserActiveLock(redisClient, userId, conversationId)
    if (!replyLockResult.acquired) {
      if (replyLockResult.activeConversationId !== conversationId) {
        // 別的對話在跑 → 拒絕
        return res.status(409).json({
          error: 'USER_TASK_IN_PROGRESS',
          message: '您有一個 AI 任務正在執行中，請等待完成後再發送。',
          activeConversationId: replyLockResult.activeConversationId,
        })
      }
      // 同一對話的 reply（BDD 釐清、變體選擇等正常多輪流程）→ 刷新 TTL
      await redisClient.expire(`user-active:${userId}`, USER_ACTIVE_TTL_SECONDS).catch(() => {})
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
      imageUrls: imageUrls || undefined,
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
    logger.error({ err: error }, '回覆失敗')
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

    // 對 code_preview richContent 套用 in-memory 修復（確保舊對話也能正確渲染）
    const { messages: fixedMessages, changed: messagesChanged } = repairCodePreviewInMessages(conversation.messages)

    res.json({
      messages: fixedMessages,
      updatedAt: conversation.updated_at,
      hasChanges: true,
      currentTaskId: activeTask?.id || activeSessionId,
      taskStatus: activeTask?.status || activePhase,
      isComplete: conversation.spec_complete && !activeTask && !activeSessionId,
      streamingPreview,
    })

    // 背景存回 DB，讓後續輪詢直接拿到修復版本
    if (messagesChanged) {
      db.updateConversationMessages(conversationId, fixedMessages).catch(err =>
        logger.warn({ err, conversationId }, 'repair messages DB update failed')
      )
    }
  } catch (error) {
    logger.error({ err: error }, '取得消息失敗')
    res.status(500).json({ error: 'Failed to get messages' })
  }
})

export default router
