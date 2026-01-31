'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '../components/dashboard'
import { getCurrentUser } from '../actions'

interface UserInfo {
  userId: string
  email?: string
  name?: string
  avatarUrl?: string
  isAdmin: boolean
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const result = await getCurrentUser()

      if (!result.success || !result.data) {
        // 未登入，導向登入頁
        router.push('/auth/login?next=/dashboard')
        return
      }

      // isAdmin 已包含在 getCurrentUser 回傳中，無需額外查詢
      setUser({
        userId: result.data.userId,
        email: result.data.email,
        name: result.data.name,
        avatarUrl: result.data.avatarUrl,
        isAdmin: result.data.isAdmin,
      })
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--gray-50)',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: '3px solid var(--gray-200)',
            borderTopColor: 'var(--black)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (!user) {
    return null
  }

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
