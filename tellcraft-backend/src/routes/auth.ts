import { Router, type Router as RouterType } from 'express'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import Redis from 'ioredis'
import * as db from '../db/client'
import { requireAuth } from '../middleware/auth'
import { getEnv } from '../lib/env'
import { createLogger } from '../lib/logger'

const logger = createLogger('auth')

const router: RouterType = Router()

// JWT 配置（已在啟動時由 validateEnv() 驗證）
const JWT_SECRET: string = getEnv().JWT_SECRET
const JWT_EXPIRES_IN = '7d'

// Redis client（由 index.ts 注入，用於 token 黑名單）
let redisClient: Redis | null = null
export function setAuthRedisClient(redis: Redis) {
  redisClient = redis
}

// OAuth 配置
const _env = getEnv()
const GOOGLE_CLIENT_ID = _env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = _env.GOOGLE_CLIENT_SECRET
const LINE_CHANNEL_ID = _env.LINE_CHANNEL_ID
const LINE_CHANNEL_SECRET = _env.LINE_CHANNEL_SECRET

const APP_URL = _env.APP_URL
const API_URL = _env.API_URL

// Callback Host 白名單
const ALLOWED_CALLBACK_HOSTS = _env.ALLOWED_CALLBACK_HOSTS.split(',').map(h => h.trim())

function isAllowedCallbackHost(host: string): boolean {
  return ALLOWED_CALLBACK_HOSTS.some(allowed => host === allowed)
}

/**
 * P2-4：驗證 returnTo 不會變成 open redirect。
 *
 * 只接受同站相對路徑：以 / 開頭、不含 schema (://)、不含 protocol-relative (//)。
 * 外部 URL、JS 偽協議、不合法輸入一律 fallback 到 '/'。
 */
function sanitizeReturnTo(input: unknown): string {
  if (typeof input !== 'string' || !input) return '/'
  if (!input.startsWith('/')) return '/'
  if (input.startsWith('//')) return '/' // protocol-relative URL
  if (input.includes('://')) return '/'
  if (/^javascript:/i.test(input)) return '/' // 雖然 / 開頭已擋住，雙保險
  return input
}

// OAuth State 簽名（防 CSRF）
function signState(data: Record<string, unknown>): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64')
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex')
  return `${payload}.${signature}`
}

function verifyState(state: string): Record<string, unknown> | null {
  const parts = state.split('.')
  if (parts.length !== 2) return null
  const [payload, signature] = parts
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex')
  // timingSafeEqual 防時序攻擊
  if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))) {
    return null
  }
  try {
    return JSON.parse(Buffer.from(payload, 'base64').toString())
  } catch {
    return null
  }
}

// Token 黑名單
async function blacklistToken(token: string): Promise<void> {
  if (!redisClient) return
  // TTL = 7 天（匹配 JWT 過期時間）
  await redisClient.set(`token:blacklist:${token}`, '1', 'EX', 7 * 24 * 60 * 60)
}

async function isTokenBlacklisted(token: string): Promise<boolean> {
  if (!redisClient) return false
  const result = await redisClient.get(`token:blacklist:${token}`)
  return result === '1'
}

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
  // Step 1: 查 user_providers 表（新表）
  const providerRecord = await db.queryOne<{ user_id: string }>(
    'SELECT user_id FROM user_providers WHERE provider = $1 AND provider_id = $2',
    [profile.provider, profile.providerId]
  )

  if (providerRecord) {
    const user = await db.queryOne<{ id: string; email: string; name: string | null; is_admin: boolean }>(
      'SELECT id, email, name, is_admin FROM users WHERE id = $1',
      [providerRecord.user_id]
    )
    if (user) {
      return { id: user.id, email: user.email, name: user.name || undefined, isAdmin: user.is_admin, isNew: false }
    }
  }

  // Step 1b: 向後相容 — 查 users.provider（舊用戶可能尚未遷移到 user_providers）
  let user = await db.queryOne<{ id: string; email: string; name: string | null; is_admin: boolean }>(
    'SELECT id, email, name, is_admin FROM users WHERE provider = $1 AND provider_id = $2',
    [profile.provider, profile.providerId]
  )

  if (user) {
    // 自動補寫 user_providers（舊用戶遷移）
    await db.query(
      `INSERT INTO user_providers (user_id, provider, provider_id, email, name, avatar_url, is_primary)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       ON CONFLICT (provider, provider_id) DO NOTHING`,
      [user.id, profile.provider, profile.providerId, profile.email, profile.name, profile.avatarUrl]
    )
    return { id: user.id, email: user.email, name: user.name || undefined, isAdmin: user.is_admin, isNew: false }
  }

  // Step 2: email 匹配 — 改為 INSERT user_providers（不再覆蓋 users.provider）
  user = await db.queryOne<{ id: string; email: string; name: string | null; is_admin: boolean }>(
    'SELECT id, email, name, is_admin FROM users WHERE email = $1',
    [profile.email]
  )

  if (user) {
    // 將此 provider 綁定到已有帳戶（不覆蓋 users.provider）
    await db.query(
      `INSERT INTO user_providers (user_id, provider, provider_id, email, name, avatar_url, is_primary)
       VALUES ($1, $2, $3, $4, $5, $6, FALSE)
       ON CONFLICT (provider, provider_id) DO NOTHING`,
      [user.id, profile.provider, profile.providerId, profile.email, profile.name, profile.avatarUrl]
    )
    // 補充 users 表名稱/頭像（如果缺失）
    await db.query(
      'UPDATE users SET name = COALESCE(name, $1), avatar_url = COALESCE(avatar_url, $2) WHERE id = $3',
      [profile.name, profile.avatarUrl, user.id]
    )
    return { id: user.id, email: user.email, name: profile.name || user.name || undefined, isAdmin: user.is_admin, isNew: false }
  }

  // Step 3: 創建新用戶 + 同時寫入 user_providers
  const newUser = await db.queryOne<{ id: string }>(
    `INSERT INTO users (id, email, name, avatar_url, provider, provider_id, plan, subscription_status, created_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'free', 'active', NOW())
     RETURNING id`,
    [profile.email, profile.name, profile.avatarUrl, profile.provider, profile.providerId]
  )

  if (!newUser) {
    throw new Error('Failed to create user')
  }

  // 同步寫入 user_providers
  await db.query(
    `INSERT INTO user_providers (user_id, provider, provider_id, email, name, avatar_url, is_primary)
     VALUES ($1, $2, $3, $4, $5, $6, TRUE)
     ON CONFLICT (provider, provider_id) DO NOTHING`,
    [newUser.id, profile.provider, profile.providerId, profile.email, profile.name, profile.avatarUrl]
  )

  return { id: newUser.id, email: profile.email, name: profile.name, isAdmin: false, isNew: true }
}

// ============================================================
// 共用 OAuth Exchange 函數
// ============================================================

interface GoogleUserInfo {
  id: string
  email: string
  name?: string
  picture?: string
}

async function exchangeGoogleCode(code: string, redirectUri: string): Promise<GoogleUserInfo> {
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
    throw new Error(`Google token error: ${errorText}`)
  }

  const tokens = await tokenResponse.json() as { access_token: string }

  const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })

  if (!userResponse.ok) {
    throw new Error('Failed to get Google user info')
  }

  return await userResponse.json() as GoogleUserInfo
}

interface LineUserInfo {
  userId: string
  displayName: string
  pictureUrl?: string
  email: string
}

async function exchangeLineCode(code: string, redirectUri: string): Promise<LineUserInfo> {
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
    throw new Error(`LINE token error: ${errorText}`)
  }

  const tokens = await tokenResponse.json() as { access_token: string; id_token?: string }

  const profileResponse = await fetch('https://api.line.me/v2/profile', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })

  if (!profileResponse.ok) {
    throw new Error('Failed to get LINE profile')
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

  return { ...lineUser, email }
}

// 帳號綁定共用邏輯
async function linkProviderToUser(
  userId: string,
  provider: string,
  providerId: string,
  email?: string,
  name?: string,
  avatarUrl?: string
): Promise<{ success: boolean; error?: string }> {
  if (!['google', 'line', 'telegram'].includes(provider)) {
    return { success: false, error: 'INVALID_PROVIDER' }
  }

  // 檢查此 OAuth 帳號是否已綁定到其他用戶
  const existing = await db.queryOne<{ user_id: string }>(
    'SELECT user_id FROM user_providers WHERE provider = $1 AND provider_id = $2',
    [provider, providerId]
  )

  if (existing) {
    if (existing.user_id === userId) {
      return { success: true } // 已經綁定到自己
    }
    return { success: false, error: 'PROVIDER_ALREADY_LINKED' }
  }

  // 檢查此用戶是否已綁定同一 provider
  const existingForUser = await db.queryOne<{ id: string }>(
    'SELECT id FROM user_providers WHERE user_id = $1 AND provider = $2',
    [userId, provider]
  )

  if (existingForUser) {
    return { success: false, error: 'PROVIDER_ALREADY_BOUND' }
  }

  // 執行綁定
  await db.query(
    `INSERT INTO user_providers (user_id, provider, provider_id, email, name, avatar_url, is_primary)
     VALUES ($1, $2, $3, $4, $5, $6, FALSE)`,
    [userId, provider, providerId, email, name, avatarUrl]
  )

  // LINE 綁 Google 時，如果用戶 email 是假的 @line.tellcraft.app，更新為 Google 真實 email
  if (provider === 'google' && email && !email.endsWith('@line.tellcraft.app')) {
    const currentUser = await db.queryOne<{ email: string }>(
      'SELECT email FROM users WHERE id = $1',
      [userId]
    )
    if (currentUser?.email.endsWith('@line.tellcraft.app')) {
      // 確認 email 不衝突
      const emailConflict = await db.queryOne<{ id: string }>(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      )
      if (!emailConflict) {
        await db.query('UPDATE users SET email = $1 WHERE id = $2', [email, userId])
      }
    }
  }

  return { success: true }
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

  // 如果有 callbackHost，驗證白名單
  const callbackHost = req.query.callbackHost as string | undefined
  if (callbackHost && !isAllowedCallbackHost(callbackHost)) {
    return res.status(400).json({ error: 'Invalid callback host' })
  }

  const redirectUri = callbackHost
    ? `${callbackHost}/api/auth/google/callback`
    : `${API_URL}/auth/google/callback`

  const scope = encodeURIComponent('openid email profile')
  const state = signState({
    returnTo: sanitizeReturnTo(req.query.returnTo),
    callbackHost: callbackHost || null,
    linkUserId: req.query.linkUserId || null,
  })

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

    // 驗證 state 簽名
    let returnTo = '/'
    let linkUserId: string | null = null
    if (state && typeof state === 'string') {
      const stateData = verifyState(state)
      if (!stateData) {
        return res.redirect(`${APP_URL}/auth/login?error=invalid_state`)
      }
      returnTo = sanitizeReturnTo(stateData.returnTo)
      linkUserId = (stateData.linkUserId as string) || null
    } else {
      return res.redirect(`${APP_URL}/auth/login?error=missing_state`)
    }

    const googleUser = await exchangeGoogleCode(code, `${API_URL}/auth/google/callback`)

    // 綁定模式
    if (linkUserId) {
      const result = await linkProviderToUser(
        linkUserId, 'google', googleUser.id, googleUser.email, googleUser.name, googleUser.picture
      )
      if (!result.success) {
        return res.redirect(`${APP_URL}/dashboard/account?error=${result.error}`)
      }
      return res.redirect(`${APP_URL}/dashboard/account?linked=google`)
    }

    // 登入模式
    const user = await findOrCreateUser({
      provider: 'google',
      providerId: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      avatarUrl: googleUser.picture,
    })

    const token = generateToken(user)
    res.redirect(`${APP_URL}/auth/callback#token=${token}&returnTo=${encodeURIComponent(returnTo)}`)
  } catch (error) {
    logger.error({ err: error }, 'Google callback error')
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

    // 驗證 state 簽名（CSRF 防護）
    let returnTo = '/'
    let linkUserId: string | null = null
    if (state && typeof state === 'string') {
      const stateData = verifyState(state)
      if (!stateData) {
        return res.status(400).json({ error: 'invalid_state' })
      }
      returnTo = sanitizeReturnTo(stateData.returnTo)
      linkUserId = (stateData.linkUserId as string) || null
    }

    // 共用 OAuth exchange
    const googleUser = await exchangeGoogleCode(code, redirectUri)

    // 綁定模式
    if (linkUserId) {
      const result = await linkProviderToUser(
        linkUserId, 'google', googleUser.id, googleUser.email, googleUser.name, googleUser.picture
      )
      if (!result.success) {
        return res.json({ linked: false, error: result.error, returnTo })
      }
      logger.info({ userId: linkUserId }, 'Google linked to user')
      return res.json({ linked: true, provider: 'google', returnTo })
    }

    // 登入模式
    const user = await findOrCreateUser({
      provider: 'google',
      providerId: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      avatarUrl: googleUser.picture,
    })

    const token = generateToken(user)
    res.json({ token, returnTo })
  } catch (error) {
    logger.error({ err: error }, 'Google exchange error')
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

  // 如果有 callbackHost，驗證白名單
  const callbackHost = req.query.callbackHost as string | undefined
  if (callbackHost && !isAllowedCallbackHost(callbackHost)) {
    return res.status(400).json({ error: 'Invalid callback host' })
  }

  const redirectUri = callbackHost
    ? `${callbackHost}/api/auth/line/callback`
    : `${API_URL}/auth/line/callback`

  const scope = encodeURIComponent('profile openid email')
  const state = signState({
    returnTo: sanitizeReturnTo(req.query.returnTo),
    callbackHost: callbackHost || null,
    linkUserId: req.query.linkUserId || null,
  })

  const authUrl = `https://access.line.me/oauth2/v2.1/authorize?` +
    `response_type=code` +
    `&client_id=${LINE_CHANNEL_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}` +
    `&scope=${scope}` +
    `&bot_prompt=aggressive`

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

    // 驗證 state 簽名
    let returnTo = '/'
    let linkUserId: string | null = null
    if (state && typeof state === 'string') {
      const stateData = verifyState(state)
      if (!stateData) {
        return res.redirect(`${APP_URL}/auth/login?error=invalid_state`)
      }
      returnTo = sanitizeReturnTo(stateData.returnTo)
      linkUserId = (stateData.linkUserId as string) || null
    } else {
      return res.redirect(`${APP_URL}/auth/login?error=missing_state`)
    }

    const lineUser = await exchangeLineCode(code, `${API_URL}/auth/line/callback`)

    // 綁定模式
    if (linkUserId) {
      const result = await linkProviderToUser(
        linkUserId, 'line', lineUser.userId, lineUser.email, lineUser.displayName, lineUser.pictureUrl
      )
      if (!result.success) {
        return res.redirect(`${APP_URL}/dashboard/account?error=${result.error}`)
      }
      return res.redirect(`${APP_URL}/dashboard/account?linked=line`)
    }

    // 登入模式
    const user = await findOrCreateUser({
      provider: 'line',
      providerId: lineUser.userId,
      email: lineUser.email,
      name: lineUser.displayName,
      avatarUrl: lineUser.pictureUrl,
    })

    const token = generateToken(user)
    res.redirect(`${APP_URL}/auth/callback#token=${token}&returnTo=${encodeURIComponent(returnTo)}`)
  } catch (error) {
    logger.error({ err: error }, 'LINE callback error')
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

    // 驗證 state 簽名（CSRF 防護）
    let returnTo = '/'
    let linkUserId: string | null = null
    if (state && typeof state === 'string') {
      const stateData = verifyState(state)
      if (!stateData) {
        return res.status(400).json({ error: 'invalid_state' })
      }
      returnTo = sanitizeReturnTo(stateData.returnTo)
      linkUserId = (stateData.linkUserId as string) || null
    }

    // 共用 OAuth exchange
    const lineUser = await exchangeLineCode(code, redirectUri)

    // 綁定模式
    if (linkUserId) {
      const result = await linkProviderToUser(
        linkUserId, 'line', lineUser.userId, lineUser.email, lineUser.displayName, lineUser.pictureUrl
      )
      if (!result.success) {
        return res.json({ linked: false, error: result.error, returnTo })
      }
      logger.info({ userId: linkUserId }, 'LINE linked to user')
      return res.json({ linked: true, provider: 'line', returnTo })
    }

    // 登入模式
    const user = await findOrCreateUser({
      provider: 'line',
      providerId: lineUser.userId,
      email: lineUser.email,
      name: lineUser.displayName,
      avatarUrl: lineUser.pictureUrl,
    })

    const token = generateToken(user)
    res.json({ token, returnTo })
  } catch (error) {
    logger.error({ err: error }, 'LINE exchange error')
    res.status(500).json({ error: 'exchange_failed' })
  }
})

// ============================================================
// LINE LIFF 驗證（LINE 內建瀏覽器自動認證）
// ============================================================

/**
 * POST /auth/liff/verify
 * LIFF 入口頁面呼叫：用 LINE ID Token 驗證用戶身份，返回 JWT
 * - LINE /oauth2/v2.1/verify 驗證 ID Token
 * - findOrCreateUser 複用現有邏輯
 */
router.post('/liff/verify', async (req, res) => {
  try {
    const { idToken } = req.body

    if (!idToken || typeof idToken !== 'string') {
      return res.status(400).json({ error: 'Missing idToken' })
    }

    if (!LINE_CHANNEL_ID) {
      return res.status(500).json({ error: 'LINE Login not configured' })
    }

    // 用 LINE API 驗證 ID Token（必須用 application/x-www-form-urlencoded）
    const verifyResponse = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        id_token: idToken,
        client_id: LINE_CHANNEL_ID,
      }),
    })

    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text()
      logger.error({ errorText }, 'LIFF verify error')
      return res.status(401).json({ error: 'ID Token 驗證失敗' })
    }

    const lineProfile = await verifyResponse.json() as {
      sub: string       // LINE userId
      name?: string
      picture?: string
      email?: string
    }

    // email fallback 和 /auth/line/callback 一致
    const email = lineProfile.email || `${lineProfile.sub}@line.tellcraft.app`

    // 複用 findOrCreateUser（已重構為優先查 user_providers 表）
    const user = await findOrCreateUser({
      provider: 'line',
      providerId: lineProfile.sub,
      email,
      name: lineProfile.name,
      avatarUrl: lineProfile.picture,
    })

    const token = generateToken(user)

    logger.info({ lineUserId: lineProfile.sub, isNew: user.isNew }, 'LIFF verify success')
    res.json({ token })
  } catch (error) {
    logger.error({ err: error }, 'LIFF verify error')
    res.status(500).json({ error: 'LIFF 驗證失敗' })
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

    // 黑名單檢查
    if (await isTokenBlacklisted(token)) {
      return res.status(401).json({ error: 'Token has been revoked' })
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET) as { sub: string; email: string; name?: string; isAdmin?: boolean }

      // 查詢完整用戶資訊
      const user = await db.queryOne<{
        id: string
        email: string
        name: string | null
        avatar_url: string | null
        plan: string
        is_admin: boolean
        preferred_language: string | null
      }>(
        'SELECT id, email, name, avatar_url, plan, is_admin, preferred_language FROM users WHERE id = $1',
        [payload.sub]
      )

      if (!user) {
        return res.status(401).json({ error: 'User not found' })
      }

      // 查詢已綁定的 providers
      const providers = await db.query<{
        provider: string
        provider_id: string
        email: string | null
        name: string | null
        linked_at: string
        is_primary: boolean
      }>(
        'SELECT provider, provider_id, email, name, linked_at, is_primary FROM user_providers WHERE user_id = $1 ORDER BY is_primary DESC, linked_at ASC',
        [user.id]
      )

      const linkedProviders = providers.rows.map(p => ({
        provider: p.provider,
        email: p.email,
        name: p.name,
        linkedAt: p.linked_at,
        isPrimary: p.is_primary,
      }))

      const responseData: {
        user: { id: string; email: string; name: string | null; avatarUrl: string | null; plan: string; isAdmin: boolean; linkedProviders: typeof linkedProviders; preferredLanguage: string | null }
        refreshedToken?: string
      } = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatar_url,
          plan: user.plan,
          isAdmin: user.is_admin,
          linkedProviders,
          preferredLanguage: user.preferred_language,
        }
      }

      // admin 狀態在 DB 中改變（例如被其他管理員設為管理）→ 自動刷新 token
      if (Boolean(payload.isAdmin) !== Boolean(user.is_admin)) {
        logger.info({ userId: user.id, jwtAdmin: payload.isAdmin, dbAdmin: user.is_admin }, 'Admin status changed, issuing refreshed token')
        responseData.refreshedToken = generateToken({
          id: user.id,
          email: user.email,
          name: user.name || undefined,
          isAdmin: user.is_admin,
        })
      }

      res.json(responseData)
    } catch {
      return res.status(401).json({ error: 'Invalid token' })
    }
  } catch (error) {
    logger.error({ err: error }, '/me error')
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

    // 黑名單檢查
    if (await isTokenBlacklisted(token)) {
      return res.status(401).json({ error: 'Token has been revoked' })
    }

    try {
      // 即使 token 過期也嘗試解析（ignoreExpiration）
      const payload = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true }) as {
        sub: string
        email: string
        name?: string
        iat?: number
      }

      // 最大年齡限制：超過 24 小時的 token 不可刷新
      if (payload.iat) {
        const tokenAge = Math.floor(Date.now() / 1000) - payload.iat
        if (tokenAge > 24 * 60 * 60) {
          return res.status(401).json({ error: 'Token too old to refresh, please re-login' })
        }
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
    logger.error({ err: error }, '/refresh error')
    res.status(500).json({ error: 'Internal error' })
  }
})

/**
 * POST /auth/logout
 * 登出（純 JWT 模式下主要是前端清除 token）
 */
// ============================================================
// 帳號綁定管理
// ============================================================

/**
 * GET /auth/providers
 * 查詢當前用戶已綁定的 OAuth providers
 */
router.get('/providers', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id

    const providers = await db.query<{
      provider: string
      provider_id: string
      email: string | null
      name: string | null
      avatar_url: string | null
      linked_at: string
      is_primary: boolean
    }>(
      'SELECT provider, provider_id, email, name, avatar_url, linked_at, is_primary FROM user_providers WHERE user_id = $1 ORDER BY is_primary DESC, linked_at ASC',
      [userId]
    )

    res.json({
      providers: providers.rows.map(p => ({
        provider: p.provider,
        email: p.email,
        name: p.name,
        avatarUrl: p.avatar_url,
        linkedAt: p.linked_at,
        isPrimary: p.is_primary,
      }))
    })
  } catch (error) {
    logger.error({ err: error }, '/providers error')
    res.status(500).json({ error: 'Failed to get providers' })
  }
})

/**
 * POST /auth/unlink/:provider
 * 解除綁定指定 provider（至少保留一個）
 */
router.post('/unlink/:provider', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id
    const provider = req.params.provider

    if (!['google', 'line', 'telegram'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider' })
    }

    // 檢查是否有此綁定
    const existing = await db.queryOne<{ id: string }>(
      'SELECT id FROM user_providers WHERE user_id = $1 AND provider = $2',
      [userId, provider]
    )

    if (!existing) {
      return res.status(404).json({ error: 'Provider not linked' })
    }

    // 確保至少保留一個 provider
    const countResult = await db.queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM user_providers WHERE user_id = $1',
      [userId]
    )

    if (parseInt(countResult?.count || '0', 10) <= 1) {
      return res.status(400).json({ error: 'LAST_PROVIDER' })
    }

    // 刪除綁定
    await db.query(
      'DELETE FROM user_providers WHERE user_id = $1 AND provider = $2',
      [userId, provider]
    )

    // Telegram 解綁後清除活躍對話映射（避免 Bot 殘留）
    if (provider === 'telegram') {
      await db.query(
        'DELETE FROM telegram_active_conversations WHERE user_id = $1',
        [userId]
      )
    }

    logger.info({ userId, provider }, 'User unlinked provider')
    res.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, '/unlink error')
    res.status(500).json({ error: 'Failed to unlink provider' })
  }
})

// ============================================================
// Telegram Login Widget 綁定
// ============================================================

/**
 * POST /auth/telegram/link-widget
 * 前端 Telegram Login Widget callback 後呼叫此端點
 * 驗證 Telegram hash，然後將 Telegram 帳號綁定到當前用戶
 */
router.post('/telegram/link-widget', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id
    const tgData = req.body as {
      id?: number | string
      first_name?: string
      last_name?: string
      username?: string
      photo_url?: string
      auth_date?: number | string
      hash?: string
    }

    if (!tgData.id || !tgData.hash || !tgData.auth_date) {
      return res.status(400).json({ error: 'Missing required Telegram fields' })
    }

    const env = getEnv()
    if (!env.TELEGRAM_BOT_TOKEN) {
      return res.status(500).json({ error: 'Telegram not configured' })
    }

    // 驗證 auth_date（不超過 86400 秒前）
    const authDate = Number(tgData.auth_date)
    if (Date.now() / 1000 - authDate > 86400) {
      return res.status(400).json({ error: 'AUTH_DATE_EXPIRED' })
    }

    // 驗證 hash：SHA256(BOT_TOKEN) 作為 HMAC key
    const dataCheckArr = Object.entries(tgData)
      .filter(([k]) => k !== 'hash')
      .map(([k, v]) => `${k}=${v}`)
      .sort()
      .join('\n')

    const secretKey = crypto.createHash('sha256').update(env.TELEGRAM_BOT_TOKEN).digest()
    const expectedHash = crypto.createHmac('sha256', secretKey).update(dataCheckArr).digest('hex')

    if (!crypto.timingSafeEqual(Buffer.from(tgData.hash, 'hex'), Buffer.from(expectedHash, 'hex'))) {
      return res.status(400).json({ error: 'INVALID_HASH' })
    }

    // 將 Telegram id 轉為 string（防止 BigInt 精度問題）
    const tgUserId = String(tgData.id)
    const displayName = [tgData.first_name, tgData.last_name].filter(Boolean).join(' ') || tgData.username

    const result = await linkProviderToUser(
      userId, 'telegram', tgUserId, `${tgUserId}@telegram.tellcraft.app`, displayName, tgData.photo_url
    )

    if (!result.success) {
      return res.status(400).json({ error: result.error })
    }

    logger.info({ userId, tgUserId }, 'Telegram linked to user')
    res.json({ success: true, provider: 'telegram' })
  } catch (error) {
    logger.error({ err: error }, '/telegram/link-widget error')
    res.status(500).json({ error: 'Failed to link Telegram' })
  }
})

// ============================================================
// 語言偏好
// ============================================================

/**
 * POST /auth/preferences
 * 更新用戶語言偏好
 */
router.post('/preferences', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id
    const { preferredLanguage } = req.body

    // 驗證語言值
    const allowedLanguages = ['zh', 'en']
    if (preferredLanguage !== null && !allowedLanguages.includes(preferredLanguage)) {
      return res.status(400).json({ error: 'Invalid language. Allowed: zh, en' })
    }

    await db.query(
      'UPDATE users SET preferred_language = $1 WHERE id = $2',
      [preferredLanguage, userId]
    )

    res.json({ success: true, preferredLanguage })
  } catch (error) {
    logger.error({ err: error }, '/preferences error')
    res.status(500).json({ error: 'Failed to update preferences' })
  }
})

// ============================================================
// 登出
// ============================================================

router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      await blacklistToken(token)
    }
    res.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, 'Logout error')
    res.json({ success: true }) // 登出不應失敗
  }
})

export default router
// CI/CD test - Tue Feb  3 21:04:46 CST 2026
// CI/CD test 2 - Tue Feb  3 23:17:18 CST 2026
