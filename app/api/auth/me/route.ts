import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tellcraft-jwt-secret-change-in-production'
)

const VPS_API_URL = process.env.VPS_API_URL || 'https://api.tellcraft.com'

/**
 * GET /api/auth/me
 * 本地驗證 JWT，然後從 VPS 獲取完整用戶資訊
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')

  // 先本地驗證 JWT
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)

    // JWT 驗證成功，嘗試從 VPS 獲取完整用戶資訊
    try {
      const response = await fetch(`${VPS_API_URL}/auth/me`, {
        headers: { 'Authorization': authHeader },
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data)
      }
    } catch {
      // VPS 連接失敗，使用 JWT payload 中的基本資訊
      console.log('[Auth] VPS unavailable, using JWT payload')
    }

    // Fallback: 返回 JWT 中的基本資訊
    return NextResponse.json({
      user: {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        isAdmin: payload.isAdmin || false,
      }
    })
  } catch (error) {
    console.error('[Auth] JWT verification failed:', error)
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}
