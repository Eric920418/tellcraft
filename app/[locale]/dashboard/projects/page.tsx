'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { DataTable, StatusBadge, SearchInput, type Column } from '@/app/components/dashboard'
import { getProjects, togglePinProject } from '@/app/lib/vps-api'
import { useLocalePath } from '@/app/hooks/useLocalePath'

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
  latestConversationId: string | null
  isPinned: boolean
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

const statusLabelKeys: Record<string, string> = {
  draft: 'statusDraft',
  generating: 'statusGenerating',
  testing: 'statusTesting',
  deployed: 'statusDeployed',
  failed: 'statusFailed',
}

export default function ProjectsPage() {
  const router = useRouter()
  const t = useTranslations('dashboard')
  const localePath = useLocalePath()
  const [projects, setProjects] = useState<Project[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [isMobile, setIsMobile] = useState(false)

  const [refetchFlag, setRefetchFlag] = useState(0)
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
  }, [page, statusFilter, search, router, refetchFlag])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const syncMobileState = (event?: MediaQueryListEvent) => {
      setIsMobile(event ? event.matches : mediaQuery.matches)
    }

    syncMobileState()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncMobileState)
      return () => mediaQuery.removeEventListener('change', syncMobileState)
    }

    mediaQuery.addListener(syncMobileState)
    return () => mediaQuery.removeListener(syncMobileState)
  }, [])


  const handleTogglePin = async (project: Project) => {
    const token = getAuthToken()
    if (!token) return

    const result = await togglePinProject({ projectId: project.id, token })
    if (result.success) {
      // 置頂後跳回第 1 頁，取消置頂留在當前頁重新拉資料
      if (!project.isPinned) {
        if (page === 1) {
          setRefetchFlag(f => f + 1)
        } else {
          setPage(1)
        }
      } else {
        setRefetchFlag(f => f + 1)
      }
    }
  }

  const getStatusLabel = (status: string) => {
    const key = statusLabelKeys[status]
    return key ? t(key) : status
  }

  const renderConversationAction = (project: Project) => {
    if (!project.latestConversationId) return null
    return (
      <a
        href={localePath(`/?conversation=${project.latestConversationId}`)}
        title={t('enterConversation')}
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: 6,
          color: 'var(--gray-400)',
          textDecoration: 'none',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--black)'
          e.currentTarget.style.background = 'var(--gray-100)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--gray-400)'
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </a>
    )
  }

  const desktopColumns: Column<Project>[] = [
    {
      key: 'pin',
      header: '',
      width: '40px',
      render: (project: Project) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleTogglePin(project)
          }}
          title={project.isPinned ? t('unpinProject') : t('pinProject')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            borderRadius: 4,
            transition: 'all 0.15s ease',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={project.isPinned ? '#F59E0B' : 'none'} stroke={project.isPinned ? '#F59E0B' : 'var(--gray-300)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l2.09 6.26L21 9.27l-5 4.87L17.18 21 12 17.27 6.82 21 8 14.14l-5-4.87 6.91-1.01L12 2z" />
          </svg>
        </button>
      ),
    },
    {
      key: 'name',
      header: t('projectName'),
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
      header: t('statusLabel'),
      width: '120px',
      render: (project: Project) => (
        <StatusBadge
          status={getStatusLabel(project.status)}
          variant={statusVariants[project.status] || 'default'}
        />
      ),
    },
    {
      key: 'conversationCount',
      header: t('conversationsHeader'),
      width: '80px',
      render: (project: Project) => (
        <span style={{ fontFamily: 'var(--font-mono)' }}>{project.conversationCount}</span>
      ),
    },
    {
      key: 'url',
      header: t('urlHeader'),
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
      key: 'actions',
      header: '',
      width: '50px',
      render: (project: Project) => renderConversationAction(project),
    },
    {
      key: 'updatedAt',
      header: t('updatedAt'),
      width: '140px',
      render: (project: Project) => (
        <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>
          {new Date(project.updatedAt).toLocaleDateString('zh-TW')}
        </span>
      ),
    },
  ]

  const mobileColumns: Column<Project>[] = [
    {
      key: 'pin',
      header: '',
      width: '40px',
      render: (project: Project) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleTogglePin(project)
          }}
          title={project.isPinned ? t('unpinProject') : t('pinProject')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            borderRadius: 4,
            transition: 'all 0.15s ease',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={project.isPinned ? '#F59E0B' : 'none'} stroke={project.isPinned ? '#F59E0B' : 'var(--gray-300)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l2.09 6.26L21 9.27l-5 4.87L17.18 21 12 17.27 6.82 21 8 14.14l-5-4.87 6.91-1.01L12 2z" />
          </svg>
        </button>
      ),
    },
    {
      key: 'summary',
      header: t('projectName'),
      width: '1fr',
      render: (project: Project) => (
        <div>
          <div style={{ fontWeight: 500 }}>{project.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <StatusBadge
              status={getStatusLabel(project.status)}
              variant={statusVariants[project.status] || 'default'}
            />
            <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>
              {t('conversationCount', { count: project.conversationCount })}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 6 }}>
            {new Date(project.updatedAt).toLocaleDateString('zh-TW')}
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '50px',
      render: (project: Project) => renderConversationAction(project),
    },
  ]

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="dashboard-page-header"
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
            {t('myProjects')}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>
            {t('manageProjects')}
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
          <span>+</span> {t('newProject')}
        </Link>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="dashboard-filters-row"
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('searchProjects')}
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
          <option value="">{t('allStatus')}</option>
          <option value="draft">{t('statusDraft')}</option>
          <option value="generating">{t('statusGenerating')}</option>
          <option value="testing">{t('statusTesting')}</option>
          <option value="deployed">{t('statusDeployed')}</option>
          <option value="failed">{t('statusFailed')}</option>
        </select>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <DataTable
          columns={isMobile ? mobileColumns : desktopColumns}
          data={projects}
          keyField="id"
          minTableWidth={isMobile ? 0 : 480}
          isLoading={isLoading}
          emptyMessage={t('noProjectsYet')}
          onRowClick={(project) => {
            window.location.href = localePath(`/dashboard/projects/${project.id}`)
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
