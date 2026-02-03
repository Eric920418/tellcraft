import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// JWT Secret - 必須與 VPS 使用的 secret 一致
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-jwt-secret-key'
)

interface JWTPayload {
  sub: string        // user id
  email?: string
  isAdmin?: boolean
  exp?: number
}

/**
 * 本地 JWT 驗證 Middleware
 * 在 Edge Runtime 驗證 JWT，不需訪問 VPS
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

  // 本地驗證 JWT
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET) as { payload: JWTPayload }

    // 檢查是否過期（jose 會自動檢查，但這裡做雙重保險）
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      throw new Error('Token expired')
    }

    // 管理員路由保護
    if (pathname.startsWith('/dashboard/admin')) {
      if (!payload.isAdmin) {
        // 非管理員，導向一般儀表板
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    }

    // 將用戶資訊傳遞給 Server Components（通過 header）
    const nextResponse = NextResponse.next()
    nextResponse.headers.set('x-user-id', payload.sub)
    nextResponse.headers.set('x-user-is-admin', String(payload.isAdmin || false))

    return nextResponse
  } catch (error) {
    console.error('[Middleware] JWT verification failed:', error)

    // Token 無效，清除 cookie 並導向登入頁
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('next', pathname)

    const redirectResponse = NextResponse.redirect(url)
    redirectResponse.cookies.set('auth_token', '', { maxAge: 0, path: '/' })
    return redirectResponse
  }
}

export const config = {
  matcher: [
    // 只匹配 dashboard 路由
    '/dashboard/:path*',
  ],
}
