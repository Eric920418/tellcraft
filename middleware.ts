import { NextResponse, type NextRequest } from 'next/server'

const VPS_API_URL = process.env.VPS_API_URL || 'http://54.238.4.117:8080'

/**
 * VPS JWT 認證 Middleware
 * 檢查 auth_token cookie，驗證並保護路由
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // 只處理需要認證的路由
  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next()
  }

  // 獲取 auth_token cookie
  const token = request.cookies.get('auth_token')?.value

  if (!token) {
    // 未登入，導向登入頁
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // 驗證 token 並獲取用戶資訊
  try {
    const response = await fetch(`${VPS_API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (!response.ok) {
      // Token 無效，清除 cookie 並導向登入頁
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('next', pathname)

      const redirectResponse = NextResponse.redirect(url)
      redirectResponse.cookies.set('auth_token', '', { maxAge: 0, path: '/' })
      return redirectResponse
    }

    const data = await response.json() as { user: { id: string; isAdmin?: boolean } }

    // 管理員路由保護
    if (pathname.startsWith('/dashboard/admin')) {
      if (!data.user.isAdmin) {
        // 非管理員，導向一般儀表板
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    }

    // 將用戶 ID 傳遞給 Server Components（通過 header）
    const nextResponse = NextResponse.next()
    nextResponse.headers.set('x-user-id', data.user.id)
    nextResponse.headers.set('x-user-is-admin', String(data.user.isAdmin || false))

    return nextResponse
  } catch (error) {
    console.error('[Middleware] Auth error:', error)

    // 發生錯誤時，允許請求通過（由 layout 處理）
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    // 只匹配 dashboard 路由
    '/dashboard/:path*',
  ],
}
