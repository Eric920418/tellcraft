import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import Redis from 'ioredis'
import { getUser, queryOne } from '../db/client'

// JWT 配置
if (!process.env.JWT_SECRET) {
  throw new Error('CRITICAL: JWT_SECRET environment variable is not set!')
}
const JWT_SECRET: string = process.env.JWT_SECRET

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
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        plan: string
        subscriptionStatus: string
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
    }

    next()
  } catch (error) {
    console.error('[Auth] 認證錯誤:', error)
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
        }
      }
    }

    next()
  } catch (error) {
    // 認證失敗時仍允許匿名訪問
    console.warn('[Auth] Optional auth failed:', error)
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
        res.status(403).json({ error: '無管理員權限' })
        return
      }

      next()
    } catch (error) {
      console.error('[Auth] requireAdmin error:', error)
      res.status(500).json({ error: 'Admin check failed' })
    }
  })
}
