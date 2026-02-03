import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// 和 middleware.ts 完全一樣的設定
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tellcraft-jwt-secret-change-in-production'
)

export const runtime = 'edge' // 強制使用 Edge Runtime，和 middleware 一樣

export async function GET(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value
  const envSecret = process.env.JWT_SECRET
  const secretPreview = (envSecret || 'tellcraft-jwt-secret-change-in-production').substring(0, 20) + '...'

  const result: Record<string, unknown> = {
    runtime: 'edge',
    hasCookie: !!authToken,
    hasEnvSecret: !!envSecret,
    secretPreview,
  }

  if (authToken) {
    try {
      const { payload } = await jwtVerify(authToken, JWT_SECRET)
      result.verified = true
      result.payload = payload
    } catch (error: unknown) {
      const err = error as Error
      result.verified = false
      result.error = err.message
    }
  }

  return NextResponse.json(result)
}
