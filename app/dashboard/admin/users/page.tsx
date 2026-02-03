'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { DataTable, StatusBadge, SearchInput, type Column } from '../../../components/dashboard'
import { listAllUsers, setUserAdmin } from '../../../lib/vps-api'

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
}

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

const statusLabels: Record<string, string> = {
  active: '正常',
  suspended: '暫停',
  cancelled: '取消',
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')  // 輸入框的值（即時更新）
  const [searchQuery, setSearchQuery] = useState('')  // 實際查詢的值（debounced）
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const pageSize = 20

  // Debounced search - 用戶停止輸入 300ms 後才查詢
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      setSearchQuery(value)
      setPage(1)  // 重置頁碼
    }, 300)
  }, [])

  // 清理 timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
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
        page,
        pageSize,
        sortBy,
        sortOrder,
        search: searchQuery || undefined,
      })

      if (!result.success) {
        if (result.error === '無管理員權限') {
          router.push('/dashboard')
          return
        }
        setError(result.error || '載入失敗')
        setIsLoading(false)
        return
      }

      if (result.data) {
        setUsers(result.data.items)
        setTotal(result.data.total)
      }
      setIsLoading(false)
    }

    fetchUsers()
  }, [page, sortBy, sortOrder, searchQuery, router])

  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    const token = getAuthToken()
    if (!token) {
      alert('請重新登入')
      return
    }

    const result = await setUserAdmin({ token, userId, isAdmin: !currentIsAdmin })
    if (result.success) {
      // 更新本地狀態
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isAdmin: !currentIsAdmin } : u))
      )
    } else {
      alert(result.error || '操作失敗')
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
      key: 'plan',
      header: '方案',
      width: '100px',
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
      header: '狀態',
      width: '100px',
      render: (user: User) => (
        <StatusBadge
          status={statusLabels[user.subscriptionStatus] || user.subscriptionStatus}
          variant={statusVariants[user.subscriptionStatus] || 'default'}
        />
      ),
    },
    {
      key: 'projectCount',
      header: '專案',
      width: '80px',
      sortable: true,
      render: (user: User) => (
        <span style={{ fontFamily: 'var(--font-mono)' }}>{user.projectCount}</span>
      ),
    },
    {
      key: 'messageCount',
      header: '訊息',
      width: '80px',
      render: (user: User) => (
        <span style={{ fontFamily: 'var(--font-mono)' }}>{user.messageCount}</span>
      ),
    },
    {
      key: 'createdAt',
      header: '註冊日期',
      width: '120px',
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
          {user.isAdmin ? '移除管理' : '設為管理'}
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
          用戶管理
        </h1>
        <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>
          共 {total} 位用戶
        </p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{ marginBottom: 20, width: 320 }}
      >
        <SearchInput
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="搜尋 Email 或名稱..."
        />
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <DataTable
          columns={columns}
          data={users}
          keyField="id"
          isLoading={isLoading}
          emptyMessage="沒有用戶"
          onRowClick={(user) => {
            router.push(`/dashboard/admin/users/${user.id}`)
          }}
          pagination={{
            page,
            pageSize,
            total,
            onPageChange: setPage,
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
