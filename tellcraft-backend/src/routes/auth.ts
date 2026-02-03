import { Router, type Router as RouterType } from 'express'
import jwt from 'jsonwebtoken'
import * as db from '../db/client'

const router: RouterType = Router()

// JWT 配置
const JWT_SECRET = process.env.JWT_SECRET || 'tellcraft-jwt-secret-change-in-production'
const JWT_EXPIRES_IN = '7d'

// OAuth 配置
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const LINE_CHANNEL_ID = process.env.LINE_CHANNEL_ID
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET

const APP_URL = process.env.APP_URL || 'https://tellcraft.com'
const API_URL = process.env.API_URL || 'http://54.238.4.117:8080'

// ============================================================
// 輔助函數
// ============================================================

function generateToken(user: { id: string; email: string; name?: string; isAdmin?: boolean }): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin || false,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

async function findOrCreateUser(profile: {
  provider: string
  providerId: string
  email: string
  name?: string
  avatarUrl?: string
}): Promise<{ id: string; email: string; name?: string; isAdmin?: boolean; isNew: boolean }> {
  // 先用 provider + providerId 查找
  let user = await db.queryOne<{ id: string; email: string; name: string | null; is_admin: boolean }>(
    'SELECT id, email, name, is_admin FROM users WHERE provider = $1 AND provider_id = $2',
    [profile.provider, profile.providerId]
  )

  if (user) {
    return { id: user.id, email: user.email, name: user.name || undefined, isAdmin: user.is_admin, isNew: false }
  }

  // 再用 email 查找（可能是之前匿名或其他方式註冊的）
  user = await db.queryOne<{ id: string; email: string; name: string | null; is_admin: boolean }>(
    'SELECT id, email, name, is_admin FROM users WHERE email = $1',
    [profile.email]
  )

  if (user) {
    // 更新 provider 資訊
    await db.query(
      'UPDATE users SET provider = $1, provider_id = $2, name = COALESCE(name, $3), avatar_url = COALESCE(avatar_url, $4) WHERE id = $5',
      [profile.provider, profile.providerId, profile.name, profile.avatarUrl, user.id]
    )
    return { id: user.id, email: user.email, name: profile.name || user.name || undefined, isAdmin: user.is_admin, isNew: false }
  }

  // 創建新用戶（使用 gen_random_uuid() 生成 ID）
  const newUser = await db.queryOne<{ id: string }>(
    `INSERT INTO users (id, email, name, avatar_url, provider, provider_id, plan, subscription_status, created_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'free', 'active', NOW())
     RETURNING id`,
    [profile.email, profile.name, profile.avatarUrl, profile.provider, profile.providerId]
  )

  if (!newUser) {
    throw new Error('Failed to create user')
  }

  return { id: newUser.id, email: profile.email, name: profile.name, isAdmin: false, isNew: true }
}

// ============================================================
// Google OAuth
// ============================================================

/**
 * GET /auth/google
 * 開始 Google OAuth 流程
 * 支援 callbackHost 參數，讓 Vercel 可以代理 callback
 */
router.get('/google', (req, res) => {
  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({ error: 'Google OAuth not configured' })
  }

  // 如果有 callbackHost，使用 Vercel 作為 callback（解決 Google 不允許 IP 的問題）
  const callbackHost = req.query.callbackHost as string | undefined
  const redirectUri = callbackHost
    ? `${callbackHost}/api/auth/google/callback`
    : `${API_URL}/auth/google/callback`

  const scope = encodeURIComponent('openid email profile')
  const state = Buffer.from(JSON.stringify({
    returnTo: req.query.returnTo || '/',
    callbackHost: callbackHost || null,
  })).toString('base64')

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&state=${state}` +
    `&access_type=offline` +
    `&prompt=consent`

  res.redirect(authUrl)
})

/**
 * GET /auth/google/callback
 * Google OAuth 回調（直接模式，VPS 作為 callback）
 */
router.get('/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query

    if (!code || typeof code !== 'string') {
      return res.redirect(`${APP_URL}/auth/login?error=missing_code`)
    }

    // 解析 state
    let returnTo = '/'
    if (state && typeof state === 'string') {
      try {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
        returnTo = stateData.returnTo || '/'
      } catch {
        // ignore
      }
    }

    // 換取 access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${API_URL}/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      console.error('[Auth] Google token error:', await tokenResponse.text())
      return res.redirect(`${APP_URL}/auth/login?error=token_failed`)
    }

    const tokens = await tokenResponse.json() as { access_token: string }

    // 獲取用戶資訊
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!userResponse.ok) {
      return res.redirect(`${APP_URL}/auth/login?error=userinfo_failed`)
    }

    const googleUser = await userResponse.json() as {
      id: string
      email: string
      name?: string
      picture?: string
    }

    // 創建或更新用戶
    const user = await findOrCreateUser({
      provider: 'google',
      providerId: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      avatarUrl: googleUser.picture,
    })

    // 生成 JWT
    const token = generateToken(user)

    // 重定向到前端，帶上 token
    res.redirect(`${APP_URL}/auth/callback?token=${token}&returnTo=${encodeURIComponent(returnTo)}`)
  } catch (error) {
    console.error('[Auth] Google callback error:', error)
    res.redirect(`${APP_URL}/auth/login?error=callback_failed`)
  }
})

/**
 * POST /auth/google/exchange
 * Vercel 代理模式：接收 code，換取 token 並返回 JWT
 */
router.post('/google/exchange', async (req, res) => {
  try {
    const { code, state, redirectUri } = req.body

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Missing code' })
    }

    if (!redirectUri || typeof redirectUri !== 'string') {
      return res.status(400).json({ error: 'Missing redirectUri' })
    }

    // 解析 state
    let returnTo = '/'
    if (state && typeof state === 'string') {
      try {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
        returnTo = stateData.returnTo || '/'
      } catch {
        // ignore
      }
    }

    // 換取 access token（使用 Vercel 提供的 redirectUri）
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('[Auth] Google token error:', errorText)
      return res.status(400).json({ error: 'token_failed', details: errorText })
    }

    const tokens = await tokenResponse.json() as { access_token: string }

    // 獲取用戶資訊
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!userResponse.ok) {
      return res.status(400).json({ error: 'userinfo_failed' })
    }

    const googleUser = await userResponse.json() as {
      id: string
      email: string
      name?: string
      picture?: string
    }

    // 創建或更新用戶
    const user = await findOrCreateUser({
      provider: 'google',
      providerId: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      avatarUrl: googleUser.picture,
    })

    // 生成 JWT
    const token = generateToken(user)

    // 返回 token 給 Vercel
    res.json({ token, returnTo })
  } catch (error) {
    console.error('[Auth] Google exchange error:', error)
    res.status(500).json({ error: 'exchange_failed' })
  }
})

// ============================================================
// LINE OAuth
// ============================================================

/**
 * GET /auth/line
 * 開始 LINE OAuth 流程
 * 支援 callbackHost 參數，讓 Vercel 可以代理 callback
 */
router.get('/line', (req, res) => {
  if (!LINE_CHANNEL_ID) {
    return res.status(500).json({ error: 'LINE OAuth not configured' })
  }

  // 如果有 callbackHost，使用 Vercel 作為 callback
  const callbackHost = req.query.callbackHost as string | undefined
  const redirectUri = callbackHost
    ? `${callbackHost}/api/auth/line/callback`
    : `${API_URL}/auth/line/callback`

  const scope = encodeURIComponent('profile openid email')
  const state = Buffer.from(JSON.stringify({
    returnTo: req.query.returnTo || '/',
    callbackHost: callbackHost || null,
  })).toString('base64')

  const authUrl = `https://access.line.me/oauth2/v2.1/authorize?` +
    `response_type=code` +
    `&client_id=${LINE_CHANNEL_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}` +
    `&scope=${scope}`

  res.redirect(authUrl)
})

/**
 * GET /auth/line/callback
 * LINE OAuth 回調（直接模式，VPS 作為 callback）
 */
router.get('/line/callback', async (req, res) => {
  try {
    const { code, state } = req.query

    if (!code || typeof code !== 'string') {
      return res.redirect(`${APP_URL}/auth/login?error=missing_code`)
    }

    // 解析 state
    let returnTo = '/'
    if (state && typeof state === 'string') {
      try {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
        returnTo = stateData.returnTo || '/'
      } catch {
        // ignore
      }
    }

    // 換取 access token
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${API_URL}/auth/line/callback`,
        client_id: LINE_CHANNEL_ID!,
        client_secret: LINE_CHANNEL_SECRET!,
      }),
    })

    if (!tokenResponse.ok) {
      console.error('[Auth] LINE token error:', await tokenResponse.text())
      return res.redirect(`${APP_URL}/auth/login?error=token_failed`)
    }

    const tokens = await tokenResponse.json() as {
      access_token: string
      id_token?: string
    }

    // 獲取用戶資訊
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!profileResponse.ok) {
      return res.redirect(`${APP_URL}/auth/login?error=profile_failed`)
    }

    const lineUser = await profileResponse.json() as {
      userId: string
      displayName: string
      pictureUrl?: string
    }

    // LINE 不一定給 email，從 id_token 解析或用 userId 生成
    let email = `${lineUser.userId}@line.tellcraft.app`
    if (tokens.id_token) {
      try {
        const payload = JSON.parse(Buffer.from(tokens.id_token.split('.')[1], 'base64').toString())
        if (payload.email) {
          email = payload.email
        }
      } catch {
        // ignore
      }
    }

    // 創建或更新用戶
    const user = await findOrCreateUser({
      provider: 'line',
      providerId: lineUser.userId,
      email,
      name: lineUser.displayName,
      avatarUrl: lineUser.pictureUrl,
    })

    // 生成 JWT
    const token = generateToken(user)

    // 重定向到前端，帶上 token
    res.redirect(`${APP_URL}/auth/callback?token=${token}&returnTo=${encodeURIComponent(returnTo)}`)
  } catch (error) {
    console.error('[Auth] LINE callback error:', error)
    res.redirect(`${APP_URL}/auth/login?error=callback_failed`)
  }
})

/**
 * POST /auth/line/exchange
 * Vercel 代理模式：接收 code，換取 token 並返回 JWT
 */
router.post('/line/exchange', async (req, res) => {
  try {
    const { code, state, redirectUri } = req.body

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Missing code' })
    }

    if (!redirectUri || typeof redirectUri !== 'string') {
      return res.status(400).json({ error: 'Missing redirectUri' })
    }

    // 解析 state
    let returnTo = '/'
    if (state && typeof state === 'string') {
      try {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
        returnTo = stateData.returnTo || '/'
      } catch {
        // ignore
      }
    }

    // 換取 access token（使用 Vercel 提供的 redirectUri）
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: LINE_CHANNEL_ID!,
        client_secret: LINE_CHANNEL_SECRET!,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('[Auth] LINE token error:', errorText)
      return res.status(400).json({ error: 'token_failed', details: errorText })
    }

    const tokens = await tokenResponse.json() as {
      access_token: string
      id_token?: string
    }

    // 獲取用戶資訊
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!profileResponse.ok) {
      return res.status(400).json({ error: 'profile_failed' })
    }

    const lineUser = await profileResponse.json() as {
      userId: string
      displayName: string
      pictureUrl?: string
    }

    // LINE 不一定給 email，從 id_token 解析或用 userId 生成
    let email = `${lineUser.userId}@line.tellcraft.app`
    if (tokens.id_token) {
      try {
        const payload = JSON.parse(Buffer.from(tokens.id_token.split('.')[1], 'base64').toString())
        if (payload.email) {
          email = payload.email
        }
      } catch {
        // ignore
      }
    }

    // 創建或更新用戶
    const user = await findOrCreateUser({
      provider: 'line',
      providerId: lineUser.userId,
      email,
      name: lineUser.displayName,
      avatarUrl: lineUser.pictureUrl,
    })

    // 生成 JWT
    const token = generateToken(user)

    // 返回 token 給 Vercel
    res.json({ token, returnTo })
  } catch (error) {
    console.error('[Auth] LINE exchange error:', error)
    res.status(500).json({ error: 'exchange_failed' })
  }
})

// ============================================================
// Token 相關
// ============================================================

/**
 * GET /auth/me
 * 獲取當前用戶資訊
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing token' })
    }

    const token = authHeader.replace('Bearer ', '')

    try {
      const payload = jwt.verify(token, JWT_SECRET) as { sub: string; email: string; name?: string }

      // 查詢完整用戶資訊
      const user = await db.queryOne<{
        id: string
        email: string
        name: string | null
        avatar_url: string | null
        plan: string
        is_admin: boolean
      }>(
        'SELECT id, email, name, avatar_url, plan, is_admin FROM users WHERE id = $1',
        [payload.sub]
      )

      if (!user) {
        return res.status(401).json({ error: 'User not found' })
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatar_url,
          plan: user.plan,
          isAdmin: user.is_admin,
        }
      })
    } catch {
      return res.status(401).json({ error: 'Invalid token' })
    }
  } catch (error) {
    console.error('[Auth] /me error:', error)
    res.status(500).json({ error: 'Internal error' })
  }
})

/**
 * POST /auth/refresh
 * 刷新 token
 */
router.post('/refresh', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing token' })
    }

    const token = authHeader.replace('Bearer ', '')

    try {
      // 即使 token 過期也嘗試解析（ignoreExpiration）
      const payload = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true }) as {
        sub: string
        email: string
        name?: string
      }

      // 查詢用戶確認存在
      const user = await db.queryOne<{ id: string; email: string; name: string | null; is_admin: boolean }>(
        'SELECT id, email, name, is_admin FROM users WHERE id = $1',
        [payload.sub]
      )

      if (!user) {
        return res.status(401).json({ error: 'User not found' })
      }

      // 生成新 token
      const newToken = generateToken({
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        isAdmin: user.is_admin,
      })

      res.json({ token: newToken })
    } catch {
      return res.status(401).json({ error: 'Invalid token' })
    }
  } catch (error) {
    console.error('[Auth] /refresh error:', error)
    res.status(500).json({ error: 'Internal error' })
  }
})

/**
 * POST /auth/logout
 * 登出（純 JWT 模式下主要是前端清除 token）
 */
router.post('/logout', (_req, res) => {
  // 純 JWT 模式下，登出主要由前端清除 token
  // 如果需要 token 黑名單，可以在這裡實作
  res.json({ success: true })
})

export default router
// CI/CD test - Tue Feb  3 21:04:46 CST 2026
