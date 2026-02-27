import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

// JWT Secret - 必須與 VPS 使用的 secret 一致
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || ''
)

if (!process.env.JWT_SECRET) {
  console.error('[Middleware] CRITICAL: JWT_SECRET environment variable is not set!')
}

interface JWTPayload {
  sub: string        // user id
  email?: string
  isAdmin?: boolean
  exp?: number
}

const intlMiddleware = createIntlMiddleware(routing)

/**
 * 合併 next-intl locale routing + JWT 認證 Middleware
 */
export async function middleware(request: NextRequest) {
  // Step 1: 先跑 next-intl middleware 處理 locale 偵測/redirect
  const response = intlMiddleware(request)

  // Step 2: 檢查是否需要 JWT 認證（dashboard 路徑）
  const pathname = request.nextUrl.pathname

  // 解析 locale prefix：/en/dashboard → dashboard, /dashboard → dashboard
  const pathnameWithoutLocale = pathname.replace(/^\/(zh|en)/, '') || '/'

  if (!pathnameWithoutLocale.startsWith('/dashboard')) {
    return response
  }

  // 獲取 auth_token cookie
  const token = request.cookies.get('auth_token')?.value

  // 取得當前 locale（優先 pathname，否則用 defaultLocale）
  const localeMatch = pathname.match(/^\/(zh|en)/)
  const locale = localeMatch ? localeMatch[1] : routing.defaultLocale
  const localePrefix = locale === routing.defaultLocale ? '' : `/${locale}`

  if (!token) {
    const url = request.nextUrl.clone()
    url.pathname = `${localePrefix}/auth/login`
    url.searchParams.set('next', pathnameWithoutLocale)
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
    if (pathnameWithoutLocale.startsWith('/dashboard/admin')) {
      if (!payload.isAdmin) {
        const url = request.nextUrl.clone()
        url.pathname = `${localePrefix}/dashboard`
        return NextResponse.redirect(url)
      }
    }

    // 將用戶資訊傳遞給 Server Components（通過 header）
    response.headers.set('x-user-id', payload.sub)
    response.headers.set('x-user-is-admin', String(payload.isAdmin || false))

    return response
  } catch (error) {
    console.error('[Middleware] JWT verification failed:', error)

    // Token 無效，清除 cookie 並導向登入頁
    const url = request.nextUrl.clone()
    url.pathname = `${localePrefix}/auth/login`
    url.searchParams.set('next', pathnameWithoutLocale)

    const redirectResponse = NextResponse.redirect(url)
    redirectResponse.cookies.set('auth_token', '', { maxAge: 0, path: '/' })
    return redirectResponse
  }
}

export const config = {
  matcher: [
    // 匹配所有非 API/靜態/Next.js 內部路徑
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
}
