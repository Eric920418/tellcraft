import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import Redis from 'ioredis'
import { getUser, queryOne } from '../db/client'
import { getEnv } from '../lib/env'
import { createLogger } from '../lib/logger'

const logger = createLogger('auth')

// JWT 配置（已在啟動時由 validateEnv() 驗證）
const JWT_SECRET: string = getEnv().JWT_SECRET

// Redis client（由 index.ts 注入，用於 token 黑名單）
let redisClient: Redis | null = null
export function setMiddlewareRedisClient(redis: Redis) {
  redisClient = redis
}

async function isTokenBlacklisted(token: string): Promise<boolean> {
  if (!redisClient) return false
  const result = await redisClient.get(`token:blacklist:${token}`)
  return result === '1'
}

// ============================================================
// 類型擴展
// ============================================================

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        plan: string
        subscriptionStatus: string
        /** 來自 DB users.is_admin（每次 requireAuth 現查，非 JWT payload 快照） */
        isAdmin: boolean
      }
    }
  }
}

// ============================================================
// JWT 驗證
// ============================================================

interface JWTPayload {
  sub: string
  email: string
  name?: string
  iat: number
  exp: number
}

function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

// ============================================================
// Chrome Extension scoped JWT（R11 治本）
// ============================================================

export interface ExtensionJWTPayload {
  sub: string  // userId
  scope: 'extension'
  conversationId: string
  projectId: string
  iat: number
  exp: number
}

/**
 * 簽 1 小時短期 scoped JWT，綁定特定 conversation/project
 * 即使 token 洩漏也只能改該對話
 */
export function signExtensionToken(payload: {
  userId: string
  conversationId: string
  projectId: string
}): { token: string; expiresAt: number } {
  const expiresIn = 3600  // 1 hour
  const token = jwt.sign(
    {
      sub: payload.userId,
      scope: 'extension',
      conversationId: payload.conversationId,
      projectId: payload.projectId,
    },
    JWT_SECRET,
    { expiresIn }
  )
  return { token, expiresAt: Date.now() + expiresIn * 1000 }
}

/**
 * 驗證 extension scope JWT — 失敗回 401
 * 用在所有 /api/extension/* endpoints
 */
export async function requireExtensionAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing extension auth header' })
      return
    }
    const token = authHeader.replace('Bearer ', '')
    let payload: ExtensionJWTPayload
    try {
      payload = jwt.verify(token, JWT_SECRET) as ExtensionJWTPayload
    } catch {
      res.status(401).json({ error: 'Invalid or expired extension token' })
      return
    }
    if (payload.scope !== 'extension') {
      res.status(403).json({ error: 'Token scope mismatch — extension scope required' })
      return
    }
    // 載入用戶（驗證帳號仍有效）
    const user = await getUser(payload.sub)
    if (!user) {
      res.status(401).json({ error: 'User not found' })
      return
    }
    req.user = {
      id: user.id,
      email: user.email,
      plan: user.plan,
      subscriptionStatus: user.subscription_status,
      isAdmin: user.is_admin === true,
    }
    // 附加 extension scope info 給 endpoint 用
    ;(req as Request & { extension?: { conversationId: string; projectId: string } }).extension = {
      conversationId: payload.conversationId,
      projectId: payload.projectId,
    }
    next()
  } catch (err) {
    logger.error({ err }, 'requireExtensionAuth 失敗')
    res.status(500).json({ error: 'Extension auth failed' })
  }
}

// ============================================================
// 認證中間件
// ============================================================

/**
 * 驗證 JWT Token
 * - 從 Authorization header 取得 Bearer token
 * - 驗證 JWT 簽名
 * - 從本地 DB 載入用戶資料
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' })
      return
    }

    const token = authHeader.replace('Bearer ', '')

    // 黑名單檢查
    if (await isTokenBlacklisted(token)) {
      res.status(401).json({ error: 'Token has been revoked' })
      return
    }

    // 驗證 JWT
    const payload = verifyToken(token)
    if (!payload) {
      res.status(401).json({ error: 'Invalid or expired token' })
      return
    }

    // 從本地 DB 載入用戶資料
    const user = await getUser(payload.sub)

    if (!user) {
      res.status(401).json({ error: 'User not found in database' })
      return
    }

    // 附加用戶資料到 request
    req.user = {
      id: user.id,
      email: user.email,
      plan: user.plan,
      subscriptionStatus: user.subscription_status,
      isAdmin: user.is_admin === true,
    }

    next()
  } catch (error) {
    logger.error({ err: error }, '認證錯誤')
    res.status(500).json({ error: 'Authentication failed' })
  }
}

/**
 * 可選認證（允許匿名訪問）
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      // 沒有 token，允許匿名訪問
      next()
      return
    }

    const token = authHeader.replace('Bearer ', '')

    const payload = verifyToken(token)
    if (payload) {
      const user = await getUser(payload.sub)
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          plan: user.plan,
          subscriptionStatus: user.subscription_status,
          isAdmin: user.is_admin === true,
        }
      }
    }

    next()
  } catch (error) {
    // 認證失敗時仍允許匿名訪問
    logger.warn({ err: error }, 'Optional auth failed')
    next()
  }
}

/**
 * 檢查訂閱狀態
 */
export function requireActiveSubscription(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  // Admin 不受訂閱狀態限制
  if (req.user.isAdmin) {
    next()
    return
  }

  if (req.user.subscriptionStatus !== 'active') {
    res.status(403).json({ error: 'Active subscription required' })
    return
  }

  next()
}

/**
 * 檢查用戶方案
 */
export function requirePlan(...allowedPlans: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    // Admin 不受方案限制（domain 路由、程式碼下載、import-design 等付費限定功能）
    if (req.user.isAdmin) {
      next()
      return
    }

    if (!allowedPlans.includes(req.user.plan)) {
      res.status(403).json({
        error: `Plan ${allowedPlans.join(' or ')} required`,
        currentPlan: req.user.plan,
      })
      return
    }

    next()
  }
}

/**
 * 管理員認證中間件
 * 先驗證 JWT，再查 DB is_admin
 */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // 先跑 requireAuth
  await requireAuth(req, res, async () => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' })
        return
      }

      const adminCheck = await queryOne<{ is_admin: boolean }>(
        'SELECT is_admin FROM users WHERE id = $1',
        [req.user.id]
      )

      if (!adminCheck?.is_admin) {
        res.status(403).json({ error: 'ADMIN_REQUIRED' })
        return
      }

      next()
    } catch (error) {
      logger.error({ err: error }, 'requireAdmin error')
      res.status(500).json({ error: 'Admin check failed' })
    }
  })
}
