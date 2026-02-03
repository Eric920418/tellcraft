import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { getUser } from '../db/client'

// JWT 配置
const JWT_SECRET = process.env.JWT_SECRET || 'tellcraft-jwt-secret-change-in-production'

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
