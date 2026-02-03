import { NextResponse } from 'next/server'

/**
 * Auth Callback Route
 * 處理 OAuth 回調 - 現在直接由 VPS 處理
 * 這個 route 保留用於兼容性，重定向到 page.tsx
 */
export async function GET(request: Request) {
  const url = new URL(request.url)

  // 如果有 token 參數（來自 VPS），讓 page.tsx 處理
  if (url.searchParams.has('token')) {
    // 重定向到同路徑讓 page.tsx 處理
    return NextResponse.redirect(url)
  }

  // 處理錯誤
  const error = url.searchParams.get('error')
  if (error) {
    return NextResponse.redirect(
      `${url.origin}/auth/login?error=${encodeURIComponent(error)}`
    )
  }

  // 沒有 token 參數，返回登入頁
  return NextResponse.redirect(`${url.origin}/auth/login?error=missing_token`)
}
