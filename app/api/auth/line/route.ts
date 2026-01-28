import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const channelId = process.env.LINE_CHANNEL_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/line/callback`

  if (!channelId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login?error=line_not_configured`
    )
  }

  // 生成 state 用於 CSRF 保護
  const state = crypto.randomUUID()
  const nonce = crypto.randomUUID()

  // 儲存 state 到 cookie（用於驗證 callback）
  const cookieStore = await cookies()
  cookieStore.set('line_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 分鐘
    path: '/',
  })
  cookieStore.set('line_oauth_nonce', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  })

  // LINE OAuth 授權 URL
  const authUrl = new URL('https://access.line.me/oauth2/v2.1/authorize')
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('client_id', channelId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('scope', 'profile openid email')
  authUrl.searchParams.set('nonce', nonce)

  return NextResponse.redirect(authUrl.toString())
}
