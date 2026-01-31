'use client'

import Sidebar from './Sidebar'

interface UserInfo {
  userId: string
  email?: string
  name?: string
  avatarUrl?: string
  isAdmin: boolean
}

export function DashboardShell({
  user,
  children,
}: {
  user: UserInfo
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--gray-50)',
        display: 'flex',
      }}
    >
      <Sidebar
        isAdmin={user.isAdmin}
        user={{
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
        }}
      />
      <main
        style={{
          flex: 1,
          marginLeft: 240,
          padding: 32,
          minHeight: '100vh',
        }}
      >
        {children}
      </main>
    </div>
  )
}
