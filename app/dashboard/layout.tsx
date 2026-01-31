import { redirect } from 'next/navigation'
import { createClient } from '../lib/supabase/server'
import { supabase } from '../lib/supabase'
import { DashboardShell } from '../components/dashboard/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side 認證檢查（middleware 已處理，這裡是雙重保障）
  const authClient = await createClient()
  const { data: { user: authUser } } = await authClient.auth.getUser()

  if (!authUser) {
    redirect('/auth/login?next=/dashboard')
  }

  // Server-side 查詢用戶資料（一次查詢，無需等待）
  const { data: userData } = await supabase
    .from('users')
    .select('is_admin, email, name')
    .eq('id', authUser.id)
    .single()

  const user = {
    userId: authUser.id,
    email: userData?.email || authUser.email,
    name: userData?.name || authUser.user_metadata?.name || authUser.user_metadata?.full_name,
    avatarUrl: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
    isAdmin: userData?.is_admin || false,
  }

  return (
    <DashboardShell user={user}>
      {children}
    </DashboardShell>
  )
}
