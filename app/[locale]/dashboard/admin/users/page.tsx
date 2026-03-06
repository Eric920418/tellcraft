'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useRouter } from '@/i18n/navigation'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { DataTable, StatusBadge, SearchInput, type Column } from '@/app/components/dashboard'
import { listAllUsers, setUserAdmin } from '@/app/lib/vps-api'

// 從 localStorage 獲取 token
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

interface User {
  id: string
  email: string
  name: string | null
  plan: string
  subscriptionStatus: string
  isAdmin: boolean
  projectCount: number
  messageCount: number
  createdAt: string
  provider: string | null
}

type ProviderTab = 'oauth' | 'guest'

const planLabels: Record<string, string> = {
  free: 'Free',
  creator: 'Creator',
  pro: 'Pro',
  business: 'Business',
}

const statusVariants: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  active: 'success',
  suspended: 'warning',
  cancelled: 'error',
}

const statusLabelKeys: Record<string, string> = {
  active: 'statusActive',
  suspended: 'statusSuspended',
  cancelled: 'statusCancelled',
}

export default function AdminUsersPage() {
  const router = useRouter()
  const t = useTranslations('dashboard')
  const ta = useTranslations('dashboard.admin')
  const tc = useTranslations('common')
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [activeTab, setActiveTab] = useState<ProviderTab>('oauth')
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const getStatusLabel = (status: string) => {
    const key = statusLabelKeys[status]
    return key ? t(key) : status
  }

  const providerTabs: { key: ProviderTab; label: string }[] = [
    { key: 'oauth', label: ta('providerOAuth') },
    { key: 'guest', label: ta('providerGuest') },
  ]

  // 一次載入全部用戶（不分頁查後端），前端做分類 + 分頁
  // 用戶量不大的情況下這樣最簡單，避免後端也要加 provider filter
  const pageSize = 500

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value)
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      setSearchQuery(value)
    }, 300)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const fetchUsers = async () => {
      const token = getAuthToken()
      if (!token) {
        router.push('/auth/login?next=/dashboard/admin/users')
        return
      }

      setIsLoading(true)
      const result = await listAllUsers({
        token,
        page: 1,
        pageSize,
        sortBy,
        sortOrder,
        search: searchQuery || undefined,
      })

      if (!result.success) {
        if (result.error === 'ADMIN_REQUIRED') {
          router.push('/dashboard')
          return
        }
        setError(result.error || tc('loadFailed'))
        setIsLoading(false)
        return
      }

      if (result.data) {
        setAllUsers(result.data.items)
        setTotal(result.data.total)
      }
      setIsLoading(false)
    }

    fetchUsers()
  }, [sortBy, sortOrder, searchQuery, router])

  // 按 provider 分類
  const categorizedUsers = useMemo(() => {
    const oauth: User[] = []
    const guest: User[] = []

    for (const u of allUsers) {
      if (u.provider === 'google' || u.provider === 'line') oauth.push(u)
      else guest.push(u)
    }

    return { oauth, guest }
  }, [allUsers])

  const displayUsers = useMemo(() => {
    if (activeTab === 'oauth') return categorizedUsers.oauth
    return categorizedUsers.guest
  }, [activeTab, categorizedUsers])

  const tabCounts = useMemo(() => ({
    oauth: categorizedUsers.oauth.length,
    guest: categorizedUsers.guest.length,
  }), [categorizedUsers])

  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    const token = getAuthToken()
    if (!token) {
      alert(tc('pleaseRelogin'))
      return
    }

    const result = await setUserAdmin({ token, userId, isAdmin: !currentIsAdmin })
    if (result.success) {
      setAllUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isAdmin: !currentIsAdmin } : u))
      )
    } else {
      alert(result.error || tc('operationFailed'))
    }
  }

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder('desc')
    }
  }

  const columns: Column<User>[] = [
    {
      key: 'email',
      header: 'Email',
      width: '2fr',
      sortable: true,
      render: (user: User) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 500 }}>{user.email}</span>
            {user.isAdmin && (
              <span
                style={{
                  fontSize: 10,
                  padding: '2px 6px',
                  background: 'var(--black)',
                  color: 'var(--white)',
                }}
              >
                ADMIN
              </span>
            )}
          </div>
          {user.name && (
            <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
              {user.name}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'provider',
      header: ta('loginProvider'),
      width: '100px',
      render: (user: User) => (
        <span
          style={{
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 3,
            fontWeight: 500,
            ...(user.provider === 'google'
              ? { background: '#E8F0FE', color: '#1A73E8' }
              : user.provider === 'line'
                ? { background: '#E6F9E6', color: '#06C755' }
                : { background: 'var(--gray-100)', color: 'var(--gray-500)' }),
          }}
        >
          {user.provider === 'google' ? 'Google' : user.provider === 'line' ? 'LINE' : ta('providerGuest')}
        </span>
      ),
    },
    {
      key: 'plan',
      header: ta('planColumn'),
      width: '80px',
      sortable: true,
      render: (user: User) => (
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: user.plan === 'free' ? 'var(--gray-500)' : 'var(--black)',
          }}
        >
          {planLabels[user.plan] || user.plan}
        </span>
      ),
    },
    {
      key: 'subscriptionStatus',
      header: ta('statusColumn'),
      width: '80px',
      render: (user: User) => (
        <StatusBadge
          status={getStatusLabel(user.subscriptionStatus)}
          variant={statusVariants[user.subscriptionStatus] || 'default'}
        />
      ),
    },
    {
      key: 'projectCount',
      header: ta('projectsColumn'),
      width: '60px',
      sortable: true,
      render: (user: User) => (
        <span style={{ fontFamily: 'var(--font-mono)' }}>{user.projectCount}</span>
      ),
    },
    {
      key: 'messageCount',
      header: ta('messagesColumn'),
      width: '60px',
      render: (user: User) => (
        <span style={{ fontFamily: 'var(--font-mono)' }}>{user.messageCount}</span>
      ),
    },
    {
      key: 'createdAt',
      header: ta('registeredAt'),
      width: '100px',
      sortable: true,
      render: (user: User) => (
        <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>
          {new Date(user.createdAt).toLocaleDateString('zh-TW')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      render: (user: User) => (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => {
            e.stopPropagation()
            handleToggleAdmin(user.id, user.isAdmin)
          }}
          style={{
            padding: '4px 8px',
            fontSize: 11,
            background: user.isAdmin ? '#FEE2E2' : 'var(--gray-100)',
            color: user.isAdmin ? '#DC2626' : 'var(--gray-600)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {user.isAdmin ? ta('removeAdmin') : ta('setAdmin')}
        </motion.button>
      ),
    },
  ]

  if (error) {
    return (
      <div
        style={{
          padding: '40px',
          background: '#FEE2E2',
          border: '1px solid #FECACA',
          color: '#DC2626',
        }}
      >
        {error}
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: 24 }}
      >
        <h1
          style={{
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: '-0.02em',
            marginBottom: 8,
          }}
        >
          {ta('userManagement')}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>
          {ta('totalCount', { count: total })}
        </p>
      </motion.div>

      {/* Search + Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}
      >
        <div style={{ width: 280 }}>
          <SearchInput
            value={searchInput}
            onChange={handleSearchChange}
            placeholder={t('searchPlaceholder')}
          />
        </div>

        {/* Provider Tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {providerTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: activeTab === tab.key ? 600 : 400,
                background: activeTab === tab.key ? 'var(--black)' : 'transparent',
                color: activeTab === tab.key ? 'var(--white)' : 'var(--gray-500)',
                border: activeTab === tab.key ? 'none' : '1px solid var(--gray-200)',
                borderRadius: 4,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
              <span
                style={{
                  marginLeft: 6,
                  fontSize: 11,
                  opacity: 0.7,
                }}
              >
                {tabCounts[tab.key]}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <DataTable
          columns={columns}
          data={displayUsers}
          keyField="id"
          isLoading={isLoading}
          emptyMessage={t('noUsers')}
          onRowClick={(user) => {
            router.push(`/dashboard/admin/users/${user.id}`)
          }}
          sortConfig={{
            sortBy,
            sortOrder,
            onSort: handleSort,
          }}
        />
      </motion.div>
    </div>
  )
}
