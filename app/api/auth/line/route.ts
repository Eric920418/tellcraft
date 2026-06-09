import { NextResponse } from 'next/server'

const VPS_API_URL = process.env.VPS_API_URL || 'https://api.tellcraft.com'

/**
 * GET /api/auth/line
 * 代理到 VPS 的 LINE OAuth 入口
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const returnTo = url.searchParams.get('returnTo') || '/'

  // 重定向到 VPS OAuth（使用 Vercel callback）
  const vpsUrl = new URL(`${VPS_API_URL}/auth/line`)
  vpsUrl.searchParams.set('returnTo', returnTo)
  vpsUrl.searchParams.set('callbackHost', url.origin) // 告訴 VPS 回調到 Vercel

  return NextResponse.redirect(vpsUrl.toString())
}
