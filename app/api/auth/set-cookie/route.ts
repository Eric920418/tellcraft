import { NextResponse } from 'next/server'

/**
 * POST /api/auth/set-cookie
 * 設置 JWT token 為 httpOnly cookie
 * 不做驗證，讓 middleware 去驗證
 */
export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token || typeof token !== 'string' || token.length < 10) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 400 })
    }

    // 直接設置 cookie，不驗證（讓 middleware 驗證）
    const response = NextResponse.json({ success: true })

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 天
    })

    return response
  } catch (error) {
    console.error('[Auth] Set cookie error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

/**
 * DELETE /api/auth/set-cookie
 * 清除 auth cookie
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true })

  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  return response
}
