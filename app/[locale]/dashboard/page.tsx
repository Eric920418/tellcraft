import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getDashboardStats } from '@/app/lib/vps-api'
import { DashboardContent } from '@/app/components/dashboard/DashboardContent'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) {
    redirect('/auth/login?next=/dashboard')
  }

  // 通過 VPS API 獲取 Dashboard 數據
  const result = await getDashboardStats({ token })

  if (!result.success || !result.data) {
    // API 錯誤時顯示空狀態
    console.error('[Dashboard] 獲取數據失敗:', result.error)
    return (
      <DashboardContent
        stats={{
          totalProjects: 0,
          totalConversations: 0,
          totalDeployments: 0,
          messageUsage: { used: 0, limit: 50, plan: 'free' }
        }}
        recentProjects={[]}
      />
    )
  }

  return <DashboardContent stats={result.data.stats} recentProjects={result.data.recentProjects} />
}
