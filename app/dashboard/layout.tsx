import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { DashboardShell } from '../components/dashboard/DashboardShell'

const VPS_API_URL = process.env.VPS_API_URL || 'http://54.238.4.117:8080'

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

  // 驗證 token 並獲取用戶資訊
  try {
    const response = await fetch(`${VPS_API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
      // 避免快取，確保每次都驗證
      cache: 'no-store',
    })

    if (!response.ok) {
      redirect('/auth/login?next=/dashboard')
    }

    const data = await response.json() as {
      user: {
        id: string
        email: string
        name?: string
        avatarUrl?: string
        plan?: string
        isAdmin?: boolean
      }
    }

    const user = {
      userId: data.user.id,
      email: data.user.email,
      name: data.user.name,
      avatarUrl: data.user.avatarUrl,
      isAdmin: data.user.isAdmin || false,
    }

    return (
      <DashboardShell user={user}>
        {children}
      </DashboardShell>
    )
  } catch (error) {
    console.error('[Dashboard] Auth error:', error)
    redirect('/auth/login?next=/dashboard')
  }
}
