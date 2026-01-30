import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const ANONYMOUS_ID_COOKIE = 'tellcraft_anonymous_id'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 年

/**
 * GET /api/session
 * 讀取 session 資訊，優先從 Cookie 恢復 anonymousId
 */
export async function GET() {
  const cookieStore = await cookies()
  const anonymousId = cookieStore.get(ANONYMOUS_ID_COOKIE)?.value

  return NextResponse.json({
    anonymousId: anonymousId || null,
  })
}

/**
 * POST /api/session
 * 設置或更新 session（Cookie 備份 anonymousId）
 */
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { anonymousId } = body

  if (!anonymousId) {
    return NextResponse.json(
      { error: '缺少 anonymousId' },
      { status: 400 }
    )
  }

  const cookieStore = await cookies()

  // 設置 Cookie 備份
  cookieStore.set(ANONYMOUS_ID_COOKIE, anonymousId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })

  return NextResponse.json({
    success: true,
    anonymousId,
  })
}

/**
 * DELETE /api/session
 * 清除 session（登出或帳號合併後）
 */
export async function DELETE() {
  const cookieStore = await cookies()

  cookieStore.delete(ANONYMOUS_ID_COOKIE)

  return NextResponse.json({
    success: true,
  })
}
