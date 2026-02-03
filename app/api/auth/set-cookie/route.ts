import { NextResponse } from 'next/server'

/**
 * POST /api/auth/set-cookie
 * 設置 JWT token 為 httpOnly cookie
 */
export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token || typeof token !== 'string' || token.length < 10) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 400 })
    }

    // 手動構建 Set-Cookie header 確保正確設定
    const maxAge = 7 * 24 * 60 * 60 // 7 天
    const isProduction = process.env.NODE_ENV === 'production'

    const cookieValue = [
      `auth_token=${token}`,
      `Path=/`,
      `Max-Age=${maxAge}`,
      `HttpOnly`,
      `SameSite=Lax`,
      isProduction ? 'Secure' : '',
    ].filter(Boolean).join('; ')

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookieValue,
      },
    })
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
