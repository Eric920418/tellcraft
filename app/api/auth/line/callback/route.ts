import { NextResponse } from 'next/server'

const VPS_API_URL = process.env.VPS_API_URL || 'http://54.238.4.117:8080'

/**
 * GET /api/auth/line/callback
 * 接收 LINE OAuth 回調，轉發給 VPS 處理
 * 支援登入模式和帳號綁定模式
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')
  const errorDescription = url.searchParams.get('error_description')

  // 處理錯誤
  if (error) {
    const errorMsg = errorDescription || error
    return NextResponse.redirect(`${url.origin}/auth/login?error=${encodeURIComponent(errorMsg)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${url.origin}/auth/login?error=missing_code`)
  }

  try {
    // 轉發給 VPS 處理 token 交換
    const vpsResponse = await fetch(`${VPS_API_URL}/auth/line/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        state,
        redirectUri: `${url.origin}/api/auth/line/callback`,
      }),
    })

    if (!vpsResponse.ok) {
      const errorData = await vpsResponse.json().catch(() => ({}))
      console.error('[Auth] VPS LINE exchange error:', errorData)
      return NextResponse.redirect(`${url.origin}/auth/login?error=exchange_failed`)
    }

    const data = await vpsResponse.json() as {
      token?: string
      returnTo?: string
      linked?: boolean
      error?: string
      provider?: string
    }

    // 綁定模式：VPS 返回 linked: true/false
    if (data.linked !== undefined) {
      if (data.linked) {
        return NextResponse.redirect(`${url.origin}/dashboard/account?linked=${data.provider || 'line'}`)
      } else {
        return NextResponse.redirect(`${url.origin}/dashboard/account?error=${data.error || 'link_failed'}`)
      }
    }

    // 登入模式
    const returnTo = data.returnTo || '/'
    return NextResponse.redirect(
      `${url.origin}/auth/callback?token=${data.token}&returnTo=${encodeURIComponent(returnTo)}`
    )
  } catch (error) {
    console.error('[Auth] LINE callback error:', error)
    return NextResponse.redirect(`${url.origin}/auth/login?error=callback_failed`)
  }
}
