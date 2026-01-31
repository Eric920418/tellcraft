import { redirect } from 'next/navigation'
import { createClient } from '../lib/supabase/server'
import { supabase, PLAN_MESSAGE_LIMITS } from '../lib/supabase'
import { DashboardContent } from '../components/dashboard/DashboardContent'

export default async function DashboardPage() {
  // Server-side 認證
  const authClient = await createClient()
  const { data: { user: authUser } } = await authClient.auth.getUser()

  if (!authUser) {
    redirect('/auth/login?next=/dashboard')
  }

  // 並行查詢所有資料（一次 server 往返）
  const [userResult, projectsResult] = await Promise.all([
    supabase
      .from('users')
      .select('plan, message_count_this_period')
      .eq('id', authUser.id)
      .single(),
    supabase
      .from('projects')
      .select('id, name, status, created_at, updated_at', { count: 'exact' })
      .eq('user_id', authUser.id)
      .order('updated_at', { ascending: false })
      .limit(5)
  ])

  const user = userResult.data
  const projects = projectsResult.data || []
  const projectCount = projectsResult.count || 0
  const projectIds = projects.map(p => p.id)

  // 並行查詢對話和部署數量
  const [convResult, deployResult, convCountsResult] = projectIds.length > 0
    ? await Promise.all([
        supabase
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .in('project_id', projectIds),
        supabase
          .from('deployments')
          .select('id', { count: 'exact', head: true })
          .in('project_id', projectIds)
          .eq('status', 'success'),
        supabase
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

  const recentProjects = projects.map(p => ({
    id: p.id,
    name: p.name,
    status: p.status,
    conversationCount: convCountMap.get(p.id) || 0,
    updatedAt: p.updated_at
  }))

  return <DashboardContent stats={stats} recentProjects={recentProjects} />
}
