import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { DashboardShell } from '@/app/components/dashboard/DashboardShell'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tellcraft-jwt-secret-change-in-production'
)

interface JWTPayload {
  sub: string
  email: string
  name?: string
  isAdmin?: boolean
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 從 cookie 獲取 JWT token
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) {
    redirect('/auth/login?next=/dashboard')
  }

  // 本地驗證 JWT（不需要訪問 VPS）
  console.log('[Dashboard Layout] Verifying token...')
  console.log('[Dashboard Layout] Token preview:', token.substring(0, 50) + '...')

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET) as { payload: JWTPayload }
    console.log('[Dashboard Layout] JWT verified successfully, user:', payload.sub)

    const user = {
      userId: payload.sub,
      email: payload.email,
      name: payload.name,
      isAdmin: payload.isAdmin || false,
    }

    return (
      <DashboardShell user={user}>
        {children}
      </DashboardShell>
    )
  } catch (error) {
    console.error('[Dashboard Layout] JWT verification failed:', error)
    redirect('/auth/login?next=/dashboard')
  }
}
