'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { DataTable, StatusBadge, SearchInput, type Column } from '../../components/dashboard'
import { getProjects } from '../../lib/vps-api'

// 從 localStorage 獲取 token
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  vercelUrl: string | null
  customDomain: string | null
  conversationCount: number
  createdAt: string
  updatedAt: string
}

const statusVariants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  draft: 'default',
  generating: 'warning',
  testing: 'info',
  deployed: 'success',
  failed: 'error',
}

const statusLabels: Record<string, string> = {
  draft: '草稿',
  generating: '生成中',
  testing: '測試中',
  deployed: '已上線',
  failed: '失敗',
}

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const pageSize = 10

  useEffect(() => {
    const fetchProjects = async () => {
      const token = getAuthToken()
      if (!token) {
        router.push('/auth/login?next=/dashboard/projects')
        return
      }

      setIsLoading(true)
      const result = await getProjects({
        token,
        page,
        pageSize,
        search: search || undefined,
        status: statusFilter || undefined,
      })

      if (result.success && result.data) {
        setProjects(result.data.projects)
        setTotal(result.data.total)
      }
      setIsLoading(false)
    }

    fetchProjects()
  }, [page, statusFilter, search, router])

  const columns: Column<Project>[] = [
    {
      key: 'name',
      header: '專案名稱',
      width: '2fr',
      render: (project: Project) => (
        <div>
          <div style={{ fontWeight: 500 }}>{project.name}</div>
          {project.description && (
            <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
              {project.description.slice(0, 50)}
              {project.description.length > 50 ? '...' : ''}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: '狀態',
      width: '120px',
      render: (project: Project) => (
        <StatusBadge
          status={statusLabels[project.status] || project.status}
          variant={statusVariants[project.status] || 'default'}
        />
      ),
    },
    {
      key: 'conversationCount',
      header: '對話',
      width: '80px',
      render: (project: Project) => (
        <span style={{ fontFamily: 'var(--font-mono)' }}>{project.conversationCount}</span>
      ),
    },
    {
      key: 'url',
      header: '網址',
      width: '1.5fr',
      render: (project: Project) => {
        const url = project.customDomain || project.vercelUrl
        if (!url) return <span style={{ color: 'var(--gray-300)' }}>-</span>
        return (
          <a
            href={url.startsWith('http') ? url : `https://${url}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              fontSize: 13,
              color: 'var(--gray-500)',
              textDecoration: 'none',
            }}
          >
            {url.replace('https://', '')}
          </a>
        )
      },
    },
    {
      key: 'updatedAt',
      header: '更新時間',
      width: '140px',
      render: (project: Project) => (
        <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>
          {new Date(project.updatedAt).toLocaleDateString('zh-TW')}
        </span>
      ),
    },
  ]

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
            我的專案
          </h1>
          <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>
            管理你的所有專案
          </p>
        </div>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 500,
            background: 'var(--black)',
            color: 'var(--white)',
            textDecoration: 'none',
          }}
        >
          <span>+</span> 新專案
        </Link>
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
        <div style={{ width: 280 }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="搜尋專案..."
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '10px 12px',
            fontSize: 14,
            border: '1px solid var(--border-color)',
            background: 'var(--white)',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="">所有狀態</option>
          <option value="draft">草稿</option>
          <option value="generating">生成中</option>
          <option value="testing">測試中</option>
          <option value="deployed">已上線</option>
          <option value="failed">失敗</option>
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
          data={projects}
          keyField="id"
          isLoading={isLoading}
          emptyMessage="還沒有專案"
          onRowClick={(project) => {
            window.location.href = `/dashboard/projects/${project.id}`
          }}
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
