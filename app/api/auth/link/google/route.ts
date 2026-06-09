import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

const VPS_API_URL = process.env.VPS_API_URL || 'https://api.tellcraft.com'
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tellcraft-jwt-secret-change-in-production'
)

/**
 * GET /api/auth/link/google
 * 從 cookie 讀 JWT → 提取 userId → redirect 到 VPS /auth/google?linkUserId=XXX
 */
export async function GET(request: Request) {
  const url = new URL(request.url)

  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.redirect(`${url.origin}/auth/login?error=not_authenticated`)
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    const userId = payload.sub

    if (!userId) {
      return NextResponse.redirect(`${url.origin}/auth/login?error=invalid_token`)
    }

    const vpsUrl = new URL(`${VPS_API_URL}/auth/google`)
    vpsUrl.searchParams.set('returnTo', '/dashboard/account')
    vpsUrl.searchParams.set('callbackHost', url.origin)
    vpsUrl.searchParams.set('linkUserId', userId)

    return NextResponse.redirect(vpsUrl.toString())
  } catch (error) {
    console.error('[Auth] Link Google error:', error)
    return NextResponse.redirect(`${url.origin}/dashboard/account?error=link_failed`)
  }
}
