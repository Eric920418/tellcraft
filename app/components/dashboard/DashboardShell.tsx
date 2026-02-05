'use client'

import { useState } from 'react'
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div
      className="dashboard-shell"
      style={{
        minHeight: '100vh',
        background: 'var(--gray-50)',
        display: 'flex',
      }}
    >
      {/* 手機版 Menu 按鈕 */}
      <button
        className="mobile-menu-toggle"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        style={{
          display: 'none',
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 1001,
          width: 40,
          height: 40,
          background: 'var(--white)',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: 20,
        }}
      >
        {isMobileMenuOpen ? '✕' : '☰'}
      </button>

      {/* 手機版遮罩 */}
      {isMobileMenuOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            display: 'none',
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 999,
          }}
        />
      )}

      <Sidebar
        isAdmin={user.isAdmin}
        user={{
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
        }}
        className={isMobileMenuOpen ? 'sidebar-open' : ''}
      />
      <main
        className="dashboard-main"
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
