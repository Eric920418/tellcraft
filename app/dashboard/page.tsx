import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { db, PLAN_MESSAGE_LIMITS } from '../lib/db'
import { DashboardContent } from '../components/dashboard/DashboardContent'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tellcraft-jwt-secret-change-in-production'
)

export default async function DashboardPage() {
  // 從 JWT 獲取用戶 ID（layout 已驗證過，這裡直接解析）
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) {
    redirect('/auth/login?next=/dashboard')
  }

  let userId: string
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    userId = payload.sub as string
  } catch {
    redirect('/auth/login?next=/dashboard')
  }

  const authUser = { id: userId }

  // 並行查詢所有資料（一次 server 往返）
  const [userResult, projectsResult] = await Promise.all([
    db
      .from('users')
      .select('plan, message_count_this_period')
      .eq('id', authUser.id)
      .single(),
    db
      .from('projects')
      .select('id, name, status, created_at, updated_at', { count: 'exact' })
      .eq('user_id', authUser.id)
      .order('updated_at', { ascending: false })
      .limit(5)
  ])

  const user = userResult.data
  const projects = projectsResult.data || []
  const projectCount = projectsResult.count || 0
  const projectIds = projects.map((p: any) => p.id)

  // 並行查詢對話和部署數量
  const [convResult, deployResult, convCountsResult] = projectIds.length > 0
    ? await Promise.all([
        db
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .in('project_id', projectIds),
        db
          .from('deployments')
          .select('id', { count: 'exact', head: true })
          .in('project_id', projectIds)
          .eq('status', 'success'),
        db
          .from('conversations')
          .select('project_id')
          .in('project_id', projectIds)
      ])
    : [{ count: 0 }, { count: 0 }, { data: [] }]

  // 計算每個專案的對話數量
  const convCountMap = new Map<string, number>()
  convCountsResult.data?.forEach((c: { project_id: string }) => {
    convCountMap.set(c.project_id, (convCountMap.get(c.project_id) || 0) + 1)
  })

  const stats = {
    totalProjects: projectCount,
    totalConversations: convResult.count || 0,
    totalDeployments: deployResult.count || 0,
    messageUsage: {
      used: user?.message_count_this_period || 0,
      limit: PLAN_MESSAGE_LIMITS[user?.plan || 'free'] || 50,
      plan: user?.plan || 'free'
    }
  }

  const recentProjects = projects.map((p: any) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    conversationCount: convCountMap.get(p.id) || 0,
    updatedAt: p.updated_at
  }))

  return <DashboardContent stats={stats} recentProjects={recentProjects} />
}
