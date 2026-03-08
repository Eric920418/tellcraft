'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Sidebar from './Sidebar'
import { useAuth } from '../../hooks/useAuth'

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
  const { user: authUser } = useAuth()
  const t = useTranslations('dashboard')
  // 優先使用 useAuth() 的即時數據（從 DB 讀取），fallback 到 JWT 解析的靜態值
  const effectiveIsAdmin = authUser?.isAdmin ?? user.isAdmin

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [overlayVisible, setOverlayVisible] = useState(false)

  // 動畫延遲：開啟時先顯示 overlay，關閉時先隱藏 sidebar
  useEffect(() => {
    if (isMobileMenuOpen) {
      // 開啟：立即顯示 overlay 動畫
      requestAnimationFrame(() => setOverlayVisible(true))
    } else {
      // 關閉：延遲隱藏 overlay
      const timer = setTimeout(() => setOverlayVisible(false), 50)
      return () => clearTimeout(timer)
    }
  }, [isMobileMenuOpen])

  return (
    <div
      className="dashboard-shell"
      style={{
        minHeight: '100vh',
        background: 'var(--gray-50)',
        display: 'flex',
      }}
    >
      {/* 手機版漢堡選單按鈕 - 精緻動畫版 */}
      <button
        className={`mobile-menu-toggle ${isMobileMenuOpen ? 'is-open' : ''}`}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label={isMobileMenuOpen ? t('closeMenu') : t('openMenu')}
        aria-expanded={isMobileMenuOpen}
      >
        <div className="hamburger-lines">
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </div>
      </button>

      {/* 手機版遮罩 - 模糊背景效果 */}
      <div
        className={`mobile-menu-overlay ${overlayVisible ? 'is-visible' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
        style={{ pointerEvents: isMobileMenuOpen ? 'auto' : 'none' }}
      />

      <Sidebar
        isAdmin={effectiveIsAdmin}
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
          minWidth: 0,
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
