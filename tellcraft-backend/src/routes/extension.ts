/**
 * routes/extension.ts — Chrome Extension MV3 backend endpoints
 *
 * R11 治本：給 extension content_script 用的 API
 *
 * Endpoints:
 *   POST /api/extension/auth/exchange — 用 session cookie 換 scoped JWT (1hr)
 *   GET  /api/extension/verify-preview — 確認 host 是該 conversation 的合法 preview
 *   POST /api/extension/apply-update   — commit 6 接 deterministic AST patch
 */

import { Router, type Router as RouterType, type Request } from 'express'
import { z } from 'zod'
import * as db from '../db/client'
import { signExtensionToken, requireExtensionAuth } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { createLogger } from '../lib/logger'
import jwt from 'jsonwebtoken'
import { getEnv } from '../lib/env'

const logger = createLogger('extension-routes')
const router: RouterType = Router()

// ============================================================
// POST /api/extension/auth/exchange
// ============================================================
// 用 tellcraft.com session cookie 或 Bearer token 換 scoped JWT
// 綁定特定 conversation/project — token 洩漏只影響該對話
//
// 流程：
//   1. extension background service worker 經 chrome.cookies.get 拿 tellcraft.com 的 token cookie
//   2. POST { conversationId } + Bearer 既有 user token
//   3. backend 驗 token 拿 userId → 驗 conversation 屬於該 user → 簽 scoped JWT 返回

const authExchangeSchema = z.object({
  conversationId: z.string().uuid(),
})

router.post('/auth/exchange', validateBody(authExchangeSchema), async (req, res) => {
  try {
    // 用既有 Bearer token 拿 userId（不能 reuse optionalAuth 因要驗證 user-conversation 關聯）
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing user token in Authorization header' })
    }
    let userId: string
    try {
      const payload = jwt.verify(authHeader.replace('Bearer ', ''), getEnv().JWT_SECRET) as { sub: string; scope?: string }
      if (payload.scope === 'extension') {
        return res.status(400).json({ error: 'Use user token, not extension scoped token' })
      }
      userId = payload.sub
    } catch {
      return res.status(401).json({ error: 'Invalid user token' })
    }

    const { conversationId } = req.body as z.infer<typeof authExchangeSchema>

    // 驗證 conversation 屬於該 user
    const conv = await db.queryOne<{ project_id: string }>(
      `SELECT c.project_id
       FROM conversations c
       JOIN projects p ON c.project_id = p.id
       WHERE c.id = $1 AND p.user_id = $2`,
      [conversationId, userId],
    )
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found or access denied' })
    }

    const { token, expiresAt } = signExtensionToken({
      userId,
      conversationId,
      projectId: conv.project_id,
    })

    logger.info({ userId, conversationId, projectId: conv.project_id }, 'extension scoped token issued')
    return res.json({
      scopedToken: token,
      expiresAt,
      conversationId,
      projectId: conv.project_id,
      userId,
    })
  } catch (err) {
    logger.error({ err }, 'auth/exchange 失敗')
    return res.status(500).json({ error: 'Auth exchange failed' })
  }
})

// ============================================================
// GET /api/extension/verify-preview?host=...&conversationId=...
// ============================================================
// content script 從 *.vercel.app 跑時三層偵測之一：
//   確認該 host 真的是該 conversation 的 preview deploy
//   防 URL 字串造假（用戶不能用任意 vercel URL 啟動編輯器）

router.get('/verify-preview', requireExtensionAuth, async (req: Request, res) => {
  try {
    const { host, conversationId } = req.query as { host?: string; conversationId?: string }
    if (!host || !conversationId) {
      return res.status(400).json({ error: 'Missing host or conversationId' })
    }

    // scoped token 的 conversationId 必須跟 query 一致
    const extReq = req as Request & { extension?: { conversationId: string; projectId: string } }
    if (extReq.extension?.conversationId !== conversationId) {
      return res.status(403).json({ error: 'Token conversation mismatch' })
    }

    // 比對 preview_deployments.url
    const deploy = await db.queryOne<{ url: string; project_id: string }>(
      `SELECT url, project_id FROM preview_deployments
       WHERE conversation_id = $1
       ORDER BY created_at DESC LIMIT 5`,
      [conversationId],
    )
    if (!deploy) {
      return res.status(404).json({ error: 'No preview deployments found for this conversation' })
    }

    // url 形如 https://cms-xxx.vercel.app — extract host 比對
    let deployHost: string
    try {
      deployHost = new URL(deploy.url).host
    } catch {
      return res.status(500).json({ error: 'Stored preview URL malformed' })
    }
    if (deployHost !== host) {
      logger.warn({ conversationId, host, deployHost }, 'host mismatch — possible spoofing')
      return res.status(403).json({ error: 'Host does not match conversation preview' })
    }

    return res.json({ ok: true, projectId: deploy.project_id, conversationId })
  } catch (err) {
    logger.error({ err }, 'verify-preview 失敗')
    return res.status(500).json({ error: 'Verify preview failed' })
  }
})

// ============================================================
// POST /api/extension/apply-update  (commit 6 接 AST patch + redeploy)
// ============================================================
// 此 commit 只 stub — commit 6 接 extension-apply-skill.ts

router.post('/apply-update', requireExtensionAuth, async (_req, res) => {
  return res.status(501).json({ error: 'apply-update not implemented (commit 6 will接)' })
})

export default router
