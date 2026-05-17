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
    const { message, projectId, userId: bodyUserId, mode, locale, imageUrls, precisionOrderId } = req.body
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

    // 精細模式訂單綁定：用戶從 /pay/success 跳回 chat 帶 ?orderId=（前端 ChatSection 每次 sendMessage 帶）。
    // 第一次 message 時用 conversation.project_id 反向綁定（IS NULL 條件防覆蓋）。
    // Fail-open：綁定失敗只 log warning，不阻擋對話。
    if (precisionOrderId && conversation.project_id) {
      try {
        const bindRes = await db.query(
          `UPDATE precision_orders
           SET project_id = $1
           WHERE id = $2 AND user_id = $3 AND project_id IS NULL`,
          [conversation.project_id, precisionOrderId, userId]
        )
        if (bindRes.rowCount && bindRes.rowCount > 0) {
          logger.info({ precisionOrderId, projectId: conversation.project_id, userId }, '精細模式訂單綁定到專案')
        }
      } catch (bindErr) {
        logger.warn({ bindErr, precisionOrderId, projectId: conversation.project_id }, '精細模式訂單綁定失敗（fail-open，不阻擋）')
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
        precisionOrderId: precisionOrderId || undefined,
      }, {
        jobId: `msg:${conversationId}:${messageId}`,
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
      jobId: `reply:${conversationId}:${messageId}`,
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
/**
 * Lazy fetch — 拿單條 message 的完整 richContent.data
 * polling response 對超大 message strip richContent.data 後，前端用此 endpoint 拿 detail
 * 防 incident 2026-05-17：避免每次 polling 都拉 500KB+ payload freeze 前端
 */
/**
 * 取最後一次 preview deployment（給 chat 載入時 init iframe src）
 * Phase 1 (Vercel preview 替換 WebContainer)：useStrippedMessageHydration / useChatSession 用此 endpoint
 * 拿最後一次 ready preview URL 直接餵 iframe；若無，前端等 socket 推 preview:ready
 */
router.get('/:id/preview/latest', optionalAuth, async (req, res) => {
  try {
    const { id: conversationId } = req.params
    const conversation = await db.getConversation(conversationId)
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' })

    // 所有權驗證
    const project = await db.queryOne<{ user_id: string }>(
      'SELECT user_id FROM projects WHERE id = $1',
      [conversation.project_id]
    )
    if (project && req.user && project.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // 拿最新一條 preview_deployments（含 building / failed 都返回 — 前端可顯示對應狀態）
    const latest = await db.queryOne<{
      vercel_deployment_id: string
      url: string
      status: 'building' | 'ready' | 'failed'
      error_message: string | null
      created_at: string
    }>(
      `SELECT vercel_deployment_id, url, status, error_message, created_at
       FROM preview_deployments
       WHERE conversation_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [conversationId]
    )

    if (!latest) {
      return res.json({ status: 'none', url: null, lkgUrl: null })
    }

    // 失敗或 building 時提供 fallback URL（上一次成功的 preview 或 production URL）
    let lkgUrl: string | null = null
    if (latest.status !== 'ready') {
      const lkg = await db.queryOne<{ url: string }>(
        `SELECT url FROM preview_deployments
         WHERE conversation_id = $1 AND status = 'ready'
         ORDER BY created_at DESC LIMIT 1`,
        [conversationId]
      )
      if (lkg?.url) {
        lkgUrl = lkg.url
      } else {
        const prod = await db.queryOne<{ vercel_url: string | null }>(
          `SELECT vercel_url FROM projects WHERE id = $1`,
          [conversation.project_id]
        )
        lkgUrl = prod?.vercel_url ?? null
      }
    }

    return res.json({
      status: latest.status,
      url: latest.url,
      deploymentId: latest.vercel_deployment_id,
      error: latest.error_message,
      lkgUrl,
      createdAt: latest.created_at,
    })
  } catch (error) {
    logger.error({ err: error }, '取得 preview/latest 失敗')
    return res.status(500).json({ error: 'Failed to fetch preview' })
  }
})

router.get('/:id/messages/:msgId/rich-data', optionalAuth, async (req, res) => {
  try {
    const { id: conversationId, msgId } = req.params
    const conversation = await db.getConversation(conversationId)
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' })

    // 所有權驗證
    const project = await db.queryOne<{ user_id: string }>(
      'SELECT user_id FROM projects WHERE id = $1',
      [conversation.project_id]
    )
    if (project && req.user && project.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const messages = (conversation.messages || []) as Array<Record<string, unknown>>
    const msg = messages.find(m => m.id === msgId)
    if (!msg) return res.status(404).json({ error: 'Message not found' })
    const rc = msg.richContent as { type?: string; data?: unknown } | undefined
    if (!rc) return res.status(404).json({ error: 'No richContent' })

    return res.json({ messageId: msgId, richContent: rc })
  } catch (error) {
    logger.error({ err: error }, '取得 rich-data 失敗')
    return res.status(500).json({ error: 'Failed to fetch rich-data' })
  }
})

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
    // 防雷 incident 2026-05-17：原條件 `current_phase != 'completed'` 是 bug —
    // Tellcraft 各 skill 完成 phase 命名各異（uiux_complete / deployer_complete / fast_complete / ...），
    // 「completed」單一字串不涵蓋任何實際完成狀態 → 所有正常完成的 conv 都被誤判為「仍生成中」
    // → 每次 polling 都 inject LKG（70+ files / 500KB+）撐爆 response → 前端 freeze
    const TERMINAL_PHASES = [
      'completed',           // legacy
      'uiux_complete',       // UIUX skill 完成
      'deployer_complete',   // 部署完成
      'fast_complete',       // Fast Build 完成
      'clone_complete',      // Clone 完成
      'domain_complete',     // Domain 完成
      'failed',              // 任何失敗終態
    ]
    let activeSessionId: string | undefined
    let activePhase: string | undefined
    if (!activeTask) {
      const bddSession = await db.queryOne<{ id: string; current_phase: string }>(
        `SELECT id, current_phase FROM bdd_sessions
         WHERE conversation_id = $1
           AND current_phase IS NOT NULL
           AND current_phase != ALL($2::text[])
         ORDER BY created_at DESC LIMIT 1`,
        [conversationId, TERMINAL_PHASES]
      )
      if (bddSession) {
        activeSessionId = bddSession.id
        activePhase = bddSession.current_phase
      }
    }

    // 對 code_preview richContent 套用 in-memory 修復（確保舊對話也能正確渲染）
    const { messages: fixedMessages, changed: messagesChanged } = repairCodePreviewInMessages(conversation.messages)

    // 防雷 incident 2026-05-17：polling response 內單條 message > MESSAGE_INLINE_MAX_BYTES 強制 strip
    // 保留 type + reference，前端用 GET /api/conversation/:id/messages/:msgId/rich-data 自己 lazy fetch
    // 不破壞 DB content（DB 仍存原版）— 只在 response 層裁剪
    const MESSAGE_INLINE_MAX_BYTES = 150 * 1024 // 150 KB / message
    let messagesStrippedCount = 0
    const cappedMessages = (fixedMessages as Array<Record<string, unknown>>).map((m, idx) => {
      const msgStr = JSON.stringify(m)
      if (msgStr.length <= MESSAGE_INLINE_MAX_BYTES) return m
      const rc = m.richContent as { type?: string; data?: unknown } | undefined
      if (!rc || !rc.data) return m // 沒 richContent.data 可裁，無法處理
      messagesStrippedCount++
      return {
        ...m,
        richContent: {
          type: rc.type,
          data: {
            _stripped: true,
            _originalSize: msgStr.length,
            _msgIndex: idx,
            _reason: `message exceeded ${MESSAGE_INLINE_MAX_BYTES}B cap — fetch via /api/conversation/${conversationId}/messages/${(m as { id?: string }).id}/rich-data`,
          },
        },
      }
    })
    if (messagesStrippedCount > 0) {
      logger.warn({
        conversationId,
        strippedCount: messagesStrippedCount,
        cap: MESSAGE_INLINE_MAX_BYTES,
      }, 'polling response：訊息超大已 strip richContent.data（前端需 lazy fetch）')
    }

    // Last Known Good fallback：生成中但 preview-gate 攔下壞代碼時，前端需要有上一版可顯示
    // 條件：正在生成（activeTask 或 activePhase 存在）且當前無 streamingPreview → 回傳 LKG
    // 其他情況不查詢，避免每次 polling 都打 project_files
    let lastValidatedFiles = null
    let lkgStrippedDueToCap = false
    const isGenerating = Boolean(activeTask || activePhase)
    if (isGenerating && !streamingPreview) {
      try {
        const lkgRows = await db.getLastValidatedProjectFiles(conversation.project_id)
        if (lkgRows.length > 0) {
          // 防雷 incident 2026-05-17：response size cap — LKG 70+ files 可達 500KB+ 撐爆前端 main thread
          // 超過 LKG_INLINE_MAX_BYTES 就 strip，前端應 fallback 用獨立 LKG endpoint lazy load
          const LKG_INLINE_MAX_BYTES = 200 * 1024 // 200 KB
          const totalSize = lkgRows.reduce((sum, r) => sum + (r.content?.length || 0), 0)
          if (totalSize > LKG_INLINE_MAX_BYTES) {
            lkgStrippedDueToCap = true
            logger.warn({
              projectId: conversation.project_id,
              conversationId,
              totalSize,
              fileCount: lkgRows.length,
              cap: LKG_INLINE_MAX_BYTES,
            }, 'LKG response 超過 size cap，已 strip（前端應改 lazy fetch）')
          } else {
            lastValidatedFiles = lkgRows.map(r => ({
              file_path: r.file_path,
              content: r.content,
              skill_source: r.skill_source,
              file_type: r.file_type,
            }))
          }
        }
      } catch (err) {
        logger.warn({ err, projectId: conversation.project_id }, 'LKG 查詢失敗（不阻塞）')
      }
    }

    res.json({
      messages: cappedMessages,
      updatedAt: conversation.updated_at,
      hasChanges: true,
      currentTaskId: activeTask?.id || activeSessionId,
      taskStatus: activeTask?.status || activePhase,
      isComplete: conversation.spec_complete && !activeTask && !activeSessionId,
      streamingPreview,
      lastValidatedFiles,
      lkgStrippedDueToCap,
      messagesStrippedCount,
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
