'use client'

import { Link, usePathname } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

interface SidebarProps {
  isAdmin?: boolean
  user?: {
    email?: string
    name?: string
    avatarUrl?: string
  }
  className?: string
}

interface NavItem {
  href: string
  labelKey: string
  icon: string
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { href: '/dashboard', labelKey: 'overview', icon: '◐' },
  { href: '/dashboard/projects', labelKey: 'projects', icon: '□' },
  { href: '/dashboard/orders', labelKey: 'orders', icon: '◐' },
  { href: '/dashboard/conversations', labelKey: 'conversations', icon: '◇' },
  { href: '/dashboard/account', labelKey: 'account', icon: '◎' },
  // 管理員專用
  { href: '/dashboard/admin', labelKey: 'adminOverview', icon: '⬡', adminOnly: true },
  { href: '/dashboard/admin/users', labelKey: 'adminUsers', icon: '○', adminOnly: true },
  { href: '/dashboard/admin/usage', labelKey: 'adminUsage', icon: '◈', adminOnly: true },
  { href: '/dashboard/admin/templates', labelKey: 'adminTemplates', icon: '◫', adminOnly: true },
  { href: '/dashboard/admin/logs', labelKey: 'adminLogs', icon: '▤', adminOnly: true },
]

export default function Sidebar({ isAdmin = false, user, className = '' }: SidebarProps) {
  const pathname = usePathname()
  const t = useTranslations('nav')

  const filteredItems = navItems.filter(item => !item.adminOnly || isAdmin)

  // 分組：普通項目和管理員項目
  const userItems = filteredItems.filter(item => !item.adminOnly)
  const adminItems = filteredItems.filter(item => item.adminOnly)

  return (
    <aside
      className={`dashboard-sidebar ${className}`}
      style={{
        width: 240,
        height: '100vh',
        background: 'var(--white)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: 'var(--black)',
            textDecoration: 'none',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Tellcraft" width={24} height={24} style={{ borderRadius: 4 }} />
          Tellcraft
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 12px', overflow: 'auto' }}>
        {/* 用戶導航 */}
        <div style={{ marginBottom: 24 }}>
          {userItems.map((item) => (
            <NavLink key={item.href} item={item} label={t(item.labelKey)} isActive={pathname === item.href} />
          ))}
        </div>

        {/* 管理員導航 */}
        {adminItems.length > 0 && (
          <>
            <div
              style={{
                fontSize: 11,
                color: 'var(--gray-400)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                padding: '8px 12px',
                marginBottom: 4,
              }}
            >
              {t('adminSection')}
            </div>
            {adminItems.map((item) => {
              // 精確匹配：只有完全相同或是該項目的直接子頁面才算 active
              // 但 /dashboard/admin 只在完全匹配時才 active
              const isExactMatch = pathname === item.href
              const isChildRoute = item.href !== '/dashboard/admin' && pathname.startsWith(item.href + '/')
              return (
                <NavLink
                  key={item.href}
                  item={item}
                  label={t(item.labelKey)}
                  isActive={isExactMatch || isChildRoute}
                />
              )
            })}
          </>
        )}
      </nav>

      {/* User info */}
      <div
        style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {user?.avatarUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={user.avatarUrl}
            alt=""
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1px solid var(--border-color)',
            }}
          />
        ) : (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--gray-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              color: 'var(--gray-500)',
            }}
          >
            {user?.name?.[0] || user?.email?.[0] || '?'}
          </div>
        )}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user?.name || user?.email?.split('@')[0] || t('dashboard')}
          </div>
          {isAdmin && (
            <div
              style={{
                fontSize: 11,
                color: 'var(--gray-400)',
              }}
            >
              {t('adminSection')}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

function NavLink({ item, label, isActive }: { item: NavItem; label: string; isActive: boolean }) {
  return (
    <Link href={item.href} style={{ textDecoration: 'none' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          marginBottom: 2,
          background: isActive ? 'var(--gray-50)' : 'transparent',
          borderLeft: isActive ? '2px solid var(--black)' : '2px solid transparent',
          transition: 'all 0.15s ease',
        }}
      >
        <span
          style={{
            fontSize: 14,
            opacity: isActive ? 1 : 0.5,
          }}
        >
          {item.icon}
        </span>
        <span
          style={{
            fontSize: 14,
            fontWeight: isActive ? 500 : 400,
            color: isActive ? 'var(--black)' : 'var(--gray-600)',
          }}
        >
          {label}
        </span>
      </div>
    </Link>
  )
}
