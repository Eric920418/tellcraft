'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { DataTable, DateRangePicker, type Column } from '../../../components/dashboard'
import { getAuditLogs } from '../../../actions/admin'

interface AuditLog {
  id: string
  userId: string | null
  userEmail: string | null
  action: string
  entityType: string | null
  entityId: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

const actionLabels: Record<string, string> = {
  login: '登入',
  logout: '登出',
  create_project: '創建專案',
  deploy: '部署',
  message: '發送訊息',
  grant_admin: '授予管理員',
  revoke_admin: '撤銷管理員',
}

export default function AdminLogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionFilter, setActionFilter] = useState('')
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  })

  const pageSize = 50

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true)
      const result = await getAuditLogs({
        page,
        pageSize,
        action: actionFilter || undefined,
        startDate: dateRange.start,
        endDate: dateRange.end,
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
        setLogs(result.data.items)
        setTotal(result.data.total)
      }
      setIsLoading(false)
    }

    fetchLogs()
  }, [page, actionFilter, dateRange, router])

  const columns: Column<AuditLog>[] = [
    {
      key: 'createdAt',
      header: '時間',
      width: '160px',
      render: (log: AuditLog) => (
        <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--gray-500)' }}>
          {new Date(log.createdAt).toLocaleString('zh-TW')}
        </span>
      ),
    },
    {
      key: 'action',
      header: '操作',
      width: '120px',
      render: (log: AuditLog) => (
        <span
          style={{
            fontSize: 12,
            padding: '3px 8px',
            background: 'var(--gray-100)',
            color: 'var(--gray-600)',
          }}
        >
          {actionLabels[log.action] || log.action}
        </span>
      ),
    },
    {
      key: 'userEmail',
      header: '用戶',
      width: '200px',
      render: (log: AuditLog) =>
        log.userEmail ? (
          <span style={{ fontSize: 13 }}>{log.userEmail}</span>
        ) : (
          <span style={{ color: 'var(--gray-300)' }}>-</span>
        ),
    },
    {
      key: 'entityType',
      header: '實體',
      width: '100px',
      render: (log: AuditLog) =>
        log.entityType ? (
          <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{log.entityType}</span>
        ) : (
          <span style={{ color: 'var(--gray-300)' }}>-</span>
        ),
    },
    {
      key: 'entityId',
      header: '實體 ID',
      width: '120px',
      render: (log: AuditLog) =>
        log.entityId ? (
          <span
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: 'var(--gray-400)',
            }}
          >
            {log.entityId.slice(0, 8)}...
          </span>
        ) : (
          <span style={{ color: 'var(--gray-300)' }}>-</span>
        ),
    },
    {
      key: 'metadata',
      header: '詳情',
      width: '1fr',
      render: (log: AuditLog) =>
        log.metadata ? (
          <span
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: 'var(--gray-400)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block',
            }}
          >
            {JSON.stringify(log.metadata).slice(0, 50)}
            {JSON.stringify(log.metadata).length > 50 ? '...' : ''}
          </span>
        ) : (
          <span style={{ color: 'var(--gray-300)' }}>-</span>
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
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: '-0.02em',
              marginBottom: 8,
            }}
          >
            審計日誌
          </h1>
          <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>
            共 {total} 條記錄
          </p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value)
            setPage(1)
          }}
          style={{
            padding: '10px 12px',
            fontSize: 14,
            border: '1px solid var(--border-color)',
            background: 'var(--white)',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="">所有操作</option>
          <option value="login">登入</option>
          <option value="logout">登出</option>
          <option value="create_project">創建專案</option>
          <option value="deploy">部署</option>
          <option value="message">發送訊息</option>
          <option value="grant_admin">授予管理員</option>
          <option value="revoke_admin">撤銷管理員</option>
        </select>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <DataTable
          columns={columns}
          data={logs}
          keyField="id"
          isLoading={isLoading}
          emptyMessage="沒有日誌記錄"
          pagination={{
            page,
            pageSize,
            total,
            onPageChange: setPage,
          }}
        />
      </motion.div>
    </div>
  )
}
