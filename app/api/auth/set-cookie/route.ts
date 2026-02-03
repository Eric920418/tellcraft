import { NextResponse } from 'next/server'

const VPS_API_URL = process.env.VPS_API_URL || 'http://54.238.4.117:8080'

/**
 * POST /api/auth/set-cookie
 * 設置 JWT token 為 httpOnly cookie（供 middleware 和 Server Components 使用）
 */
export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    // 驗證 token 有效性
    const verifyResponse = await fetch(`${VPS_API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (!verifyResponse.ok) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 設置 cookie
    const response = NextResponse.json({ success: true })

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 天（與 JWT 過期時間一致）
    })

    return response
  } catch (error) {
    console.error('[Auth] Set cookie error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

/**
 * DELETE /api/auth/set-cookie
 * 清除 auth cookie（登出時使用）
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true })

  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // 立即過期
  })

  return response
}
