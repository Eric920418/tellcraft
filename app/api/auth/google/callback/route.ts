import { NextResponse } from 'next/server'

const VPS_API_URL = process.env.VPS_API_URL || 'http://54.238.4.117:8080'

/**
 * GET /api/auth/google/callback
 * 接收 Google OAuth 回調，轉發給 VPS 處理
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  // 處理錯誤
  if (error) {
    return NextResponse.redirect(`${url.origin}/auth/login?error=${encodeURIComponent(error)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${url.origin}/auth/login?error=missing_code`)
  }

  try {
    // 轉發給 VPS 處理 token 交換
    const vpsResponse = await fetch(`${VPS_API_URL}/auth/google/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        state,
        redirectUri: `${url.origin}/api/auth/google/callback`,
      }),
    })

    if (!vpsResponse.ok) {
      const errorData = await vpsResponse.json().catch(() => ({}))
      console.error('[Auth] VPS exchange error:', errorData)
      return NextResponse.redirect(`${url.origin}/auth/login?error=exchange_failed`)
    }

    const data = await vpsResponse.json() as { token: string; returnTo?: string }

    // 重定向到前端 callback 頁面
    const returnTo = data.returnTo || '/'
    return NextResponse.redirect(
      `${url.origin}/auth/callback?token=${data.token}&returnTo=${encodeURIComponent(returnTo)}`
    )
  } catch (error) {
    console.error('[Auth] Google callback error:', error)
    return NextResponse.redirect(`${url.origin}/auth/login?error=callback_failed`)
  }
}
