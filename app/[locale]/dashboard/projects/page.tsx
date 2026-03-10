'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { DataTable, StatusBadge, SearchInput, type Column } from '@/app/components/dashboard'
import ProjectHoverCard from '@/app/components/dashboard/ProjectHoverCard'
import { getProjects, togglePinProject, deleteProjects, getConversationMessages } from '@/app/lib/vps-api'
import { useAuth } from '@/app/hooks/useAuth'

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
  const { user } = useAuth()
  const isPaidUser = !!user && user.plan !== 'free' && !!user.plan
  const [projects, setProjects] = useState<Project[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [isMobile, setIsMobile] = useState(false)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [refetchFlag, setRefetchFlag] = useState(0)
  const [isDownloading, setIsDownloading] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const pageSize = 10

  // Hover preview state
  const [hoverProject, setHoverProject] = useState<Project | null>(null)
  const [hoverAnchorRect, setHoverAnchorRect] = useState<DOMRect | null>(null)
  const [hoverMessages, setHoverMessages] = useState<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: string }[] | null>(null)
  const [hoverLoading, setHoverLoading] = useState(false)
  const messageCache = useRef<Map<string, { id: string; role: 'user' | 'assistant'; content: string; timestamp: string }[]>>(new Map())
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // 換頁/篩選/搜尋時清空選取
  useEffect(() => {
    setSelectedIds(new Set())
  }, [page, statusFilter, search])

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


  const handleRowMouseEnter = (project: Project, event: React.MouseEvent<HTMLDivElement>) => {
    clearTimeout(hideTimeoutRef.current)
    const rect = event.currentTarget.getBoundingClientRect()
    setHoverProject(project)
    setHoverAnchorRect(rect)

    const cached = messageCache.current.get(project.id)
    if (cached) {
      setHoverMessages(cached)
      setHoverLoading(false)
      return
    }

    if (!project.latestConversationId) {
      setHoverMessages([])
      setHoverLoading(false)
      return
    }

    setHoverLoading(true)
    const token = getAuthToken()
    const projectId = project.id
    clearTimeout(showTimeoutRef.current)
    showTimeoutRef.current = setTimeout(async () => {
      if (!token || !project.latestConversationId) {
        setHoverLoading(false)
        return
      }
      const result = await getConversationMessages({ conversationId: project.latestConversationId, token })
      if (result.success && result.data) {
        const msgs = result.data.messages
          .filter((m) => m.role !== ('system' as string))
          .slice(-4)
        messageCache.current.set(projectId, msgs)
        setHoverMessages(msgs)
        setHoverLoading(false)
      } else {
        setHoverMessages([])
        setHoverLoading(false)
      }
    }, 300)
  }

  const handleRowMouseLeave = () => {
    clearTimeout(showTimeoutRef.current)
    hideTimeoutRef.current = setTimeout(() => {
      setHoverProject(null)
      setHoverAnchorRect(null)
      setHoverMessages(null)
    }, 200)
  }

  const handleCardMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setHoverProject(null)
      setHoverAnchorRect(null)
      setHoverMessages(null)
    }, 200)
  }

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleToggleSelectAll = () => {
    if (selectedIds.size === projects.length && projects.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(projects.map(p => p.id)))
    }
  }

  const handleBatchDelete = async () => {
    const token = getAuthToken()
    if (!token) return
    setIsDeleting(true)
    setDeleteError(null)
    const result = await deleteProjects({ ids: Array.from(selectedIds), token })
    setIsDeleting(false)
    if (result.success) {
      setShowDeleteModal(false)
      setSelectedIds(new Set())
      setRefetchFlag(f => f + 1)
    } else {
      setDeleteError(result.error ?? '刪除失敗，請稍後再試')
    }
  }

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

  const handleDownload = async (project: Project) => {
    const token = getAuthToken()
    if (!token) return
    setIsDownloading(project.id)
    setDownloadError(null)
    try {
      const res = await fetch(`/api/projects/${project.id}/download-code`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setDownloadError(err.error || '下載失敗，請稍後再試')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project.name}-code.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      setDownloadError('下載失敗，請稍後再試')
    } finally {
      setIsDownloading(null)
    }
  }

  const getStatusLabel = (status: string) => {
    const key = statusLabelKeys[status]
    return key ? t(key) : status
  }

  const getProjectPrimaryPath = (project: Project) => {
    if (project.latestConversationId) return `/?conversation=${project.latestConversationId}`
    return `/dashboard/projects/${project.id}`
  }

  const renderProjectDetailAction = (project: Project) => {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* 下載代碼按鈕 */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (isPaidUser) handleDownload(project)
          }}
          disabled={isDownloading === project.id}
          title={isPaidUser ? '下載代碼 (ZIP)' : '升級付費方案以下載代碼'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 10,
            border: 'none',
            color: 'var(--gray-500)',
            background: 'var(--gray-50)',
            cursor: isPaidUser && isDownloading !== project.id ? 'pointer' : 'not-allowed',
            opacity: isPaidUser ? 1 : 0.4,
            transition: 'all 0.15s ease',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (isPaidUser) {
              e.currentTarget.style.color = 'var(--black)'
              e.currentTarget.style.background = 'var(--gray-100)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--gray-500)'
            e.currentTarget.style.background = 'var(--gray-50)'
          }}
        >
          {isDownloading === project.id ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          )}
        </button>
        {/* 詳情連結 */}
        <Link
          href={`/dashboard/projects/${project.id}`}
          title={t('projectDetail')}
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 10,
            color: 'var(--gray-500)',
            background: 'var(--gray-50)',
            textDecoration: 'none',
            transition: 'all 0.15s ease',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--black)'
            e.currentTarget.style.background = 'var(--gray-100)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--gray-500)'
            e.currentTarget.style.background = 'var(--gray-50)'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </Link>
      </div>
    )
  }

  const desktopColumns: Column<Project>[] = [
    {
      key: 'pin',
      header: '',
      width: '72px',
      truncate: false,
      render: (project: Project) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            type="checkbox"
            checked={selectedIds.has(project.id)}
            onChange={() => handleToggleSelect(project.id)}
            onClick={(e) => e.stopPropagation()}
            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--black)', flexShrink: 0 }}
          />
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
        </div>
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
      truncate: false,
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
      truncate: false,
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
      width: '116px',
      truncate: false,
      render: (project: Project) => renderProjectDetailAction(project),
    },
    {
      key: 'updatedAt',
      header: t('updatedAt'),
      width: '140px',
      truncate: false,
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
      width: '60px',
      truncate: false,
      render: (project: Project) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            type="checkbox"
            checked={selectedIds.has(project.id)}
            onChange={() => handleToggleSelect(project.id)}
            onClick={(e) => e.stopPropagation()}
            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--black)', flexShrink: 0 }}
          />
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
        </div>
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
      width: '64px',
      truncate: false,
      render: (project: Project) => renderProjectDetailAction(project),
    },
  ]

  return (
    <div>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
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
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
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
            width: 180,
            minWidth: 140,
            maxWidth: '100%',
            flexShrink: 0,
          }}
        >
          <option value="">{t('allStatus')}</option>
          <option value="draft">{t('statusDraft')}</option>
          <option value="generating">{t('statusGenerating')}</option>
          <option value="testing">{t('statusTesting')}</option>
          <option value="deployed">{t('statusDeployed')}</option>
          <option value="failed">{t('statusFailed')}</option>
        </select>
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.button
              key="batch-delete-btn"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              onClick={() => { setDeleteError(null); setShowDeleteModal(true) }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 16px',
                fontSize: 14,
                fontWeight: 500,
                background: '#EF4444',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
              刪除選取（{selectedIds.size}）
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 下載錯誤提示 */}
      {downloadError && (
        <div style={{
          padding: '10px 14px',
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: 6,
          fontSize: 13,
          color: '#DC2626',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}>
          <span>{downloadError}</span>
          <button
            onClick={() => setDownloadError(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 16, lineHeight: 1, padding: 0 }}
          >×</button>
        </div>
      )}

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {/* 全選行 */}
        {projects.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 12px',
              marginBottom: 4,
              background: selectedIds.size > 0 ? 'var(--gray-50)' : 'transparent',
              borderRadius: 6,
            }}
          >
            <input
              type="checkbox"
              ref={(el) => {
                if (el) {
                  el.indeterminate = selectedIds.size > 0 && selectedIds.size < projects.length
                  el.checked = selectedIds.size === projects.length && projects.length > 0
                }
              }}
              onChange={handleToggleSelectAll}
              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--black)' }}
            />
            <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>
              {selectedIds.size > 0
                ? `已選取 ${selectedIds.size} 個`
                : `全選本頁 ${projects.length} 個`}
            </span>
          </div>
        )}
        <DataTable
          columns={isMobile ? mobileColumns : desktopColumns}
          data={projects}
          keyField="id"
          minTableWidth={isMobile ? 0 : 480}
          isLoading={isLoading}
          emptyMessage={t('noProjectsYet')}
          onRowClick={(project) => {
            router.push(getProjectPrimaryPath(project))
          }}
          onRowMouseEnter={isMobile ? undefined : handleRowMouseEnter}
          onRowMouseLeave={isMobile ? undefined : handleRowMouseLeave}
          pagination={{
            page,
            pageSize,
            total,
            onPageChange: setPage,
          }}
        />
      </motion.div>

      {/* 批量刪除確認 Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <>
            <motion.div
              key="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => !isDeleting && setShowDeleteModal(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                zIndex: 1000,
              }}
            />
            <motion.div
              key="modal-box"
              initial={{ opacity: 0, scale: 0.95, y: '-48%', x: '-50%' }}
              animate={{ opacity: 1, scale: 1, y: '-50%', x: '-50%' }}
              exit={{ opacity: 0, scale: 0.95, y: '-48%', x: '-50%' }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                zIndex: 1001,
                background: 'var(--white)',
                borderRadius: 12,
                padding: '28px 32px',
                width: 400,
                maxWidth: 'calc(100vw - 32px)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
                刪除 {selectedIds.size} 個專案
              </h3>
              <p style={{ fontSize: 14, color: 'var(--gray-500)', lineHeight: 1.6, marginBottom: 8 }}>
                此操作無法復原。選取的專案及其所有代碼、對話記錄、部署資料都將永久刪除。
              </p>
              {deleteError && (
                <div style={{
                  marginTop: 12,
                  padding: '10px 14px',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 6,
                  fontSize: 13,
                  color: '#DC2626',
                }}>
                  {deleteError}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  style={{
                    padding: '9px 18px',
                    fontSize: 14,
                    border: '1px solid var(--border-color)',
                    background: 'var(--white)',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    borderRadius: 6,
                    opacity: isDeleting ? 0.5 : 1,
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleBatchDelete}
                  disabled={isDeleting}
                  style={{
                    padding: '9px 18px',
                    fontSize: 14,
                    fontWeight: 500,
                    background: isDeleting ? '#FCA5A5' : '#EF4444',
                    color: '#fff',
                    border: 'none',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    borderRadius: 6,
                    transition: 'background 0.15s',
                  }}
                >
                  {isDeleting ? '刪除中...' : `刪除（${selectedIds.size}）`}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hover Preview Card */}
      <AnimatePresence>
        {hoverProject && hoverAnchorRect && (
          <ProjectHoverCard
            key={hoverProject.id}
            project={hoverProject}
            messages={hoverMessages}
            isLoading={hoverLoading}
            anchorRect={hoverAnchorRect}
            onMouseEnter={() => clearTimeout(hideTimeoutRef.current)}
            onMouseLeave={handleCardMouseLeave}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
