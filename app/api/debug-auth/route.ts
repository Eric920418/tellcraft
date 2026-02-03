import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tellcraft-jwt-secret-change-in-production'
)

export async function GET(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value

  const result: Record<string, unknown> = {
    hasCookie: !!authToken,
    cookieValue: authToken ? authToken.substring(0, 50) + '...' : null,
    allCookies: request.cookies.getAll().map(c => c.name),
  }

  if (authToken) {
    try {
      const { payload } = await jwtVerify(authToken, JWT_SECRET)
      result.verified = true
      result.payload = payload
    } catch (error: unknown) {
      const err = error as Error
      result.verified = false
      result.verifyError = err.message
    }
  }

  return NextResponse.json(result)
}
