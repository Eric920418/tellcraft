import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tellcraft-jwt-secret-change-in-production'
)

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')

  // 顯示 secret 的前幾個字符（不要完整顯示）
  const secretPreview = (process.env.JWT_SECRET || 'tellcraft-jwt-secret-change-in-production').substring(0, 15) + '...'

  if (!token) {
    return NextResponse.json({
      secretPreview,
      hasEnvSecret: !!process.env.JWT_SECRET,
      message: 'Add ?token=xxx to test verification'
    })
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return NextResponse.json({
      secretPreview,
      hasEnvSecret: !!process.env.JWT_SECRET,
      verified: true,
      payload
    })
  } catch (error: unknown) {
    const err = error as Error
    return NextResponse.json({
      secretPreview,
      hasEnvSecret: !!process.env.JWT_SECRET,
      verified: false,
      error: err.message
    })
  }
}
