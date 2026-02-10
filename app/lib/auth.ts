import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || ''
)

if (!process.env.JWT_SECRET) {
  console.error('[Auth] CRITICAL: JWT_SECRET environment variable is not set!')
}

export interface AuthUser {
  id: string
  email?: string
  name?: string
  isAdmin?: boolean
}

/**
 * 從 cookie 中的 JWT 獲取當前用戶
 * 用於 Server Actions 和 Server Components
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return null
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)

    return {
      id: payload.sub as string,
      email: payload.email as string | undefined,
      name: payload.name as string | undefined,
      isAdmin: payload.isAdmin as boolean | undefined,
    }
  } catch (error) {
    console.error('[Auth] Failed to get current user:', error)
    return null
  }
}

/**
 * 驗證用戶是否已登入，如果未登入則拋出錯誤
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

/**
 * 驗證用戶是否為管理員
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth()
  if (!user.isAdmin) {
    throw new Error('Forbidden: Admin access required')
  }
  return user
}

/**
 * 從 cookie 取得 JWT token
 * 用於呼叫 VPS API
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    return cookieStore.get('auth_token')?.value || null
  } catch {
    return null
  }
}
