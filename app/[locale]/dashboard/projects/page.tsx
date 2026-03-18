'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { DataTable, StatusBadge, SearchInput, type Column } from '@/app/components/dashboard'
import ProjectHoverCard from '@/app/components/dashboard/ProjectHoverCard'
import TemplateSubmitModal from '@/app/components/templates/TemplateSubmitModal'
import { getProjects, togglePinProject, deleteProjects, getConversationMessages } from '@/app/lib/vps-api'
import { getMyTemplates, updateMyTemplateThumbnail, publishTemplateUpdate } from '@/app/actions/templates'
import type { MyTemplateData } from '@/app/lib/vps-api'
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
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [isMobile, setIsMobile] = useState(false)

  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [refetchFlag, setRefetchFlag] = useState(0)
  const [isDownloading, setIsDownloading] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [uploadProjectId, setUploadProjectId] = useState<string | null>(null)
  const pageSize = 10

  // 我的模板
  const [myTemplates, setMyTemplates] = useState<MyTemplateData[]>([])
  const [myTemplatesLoading, setMyTemplatesLoading] = useState(true)
  const [thumbnailUploading, setThumbnailUploading] = useState<string | null>(null)
  const [thumbnailError, setThumbnailError] = useState<string | null>(null)
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null)
  const [thumbnailTargetId, setThumbnailTargetId] = useState<string | null>(null)
  const [publishingUpdate, setPublishingUpdate] = useState<string | null>(null)

  // Hover preview state
  const [hoverProject, setHoverProject] = useState<Project | null>(null)
  const [hoverAnchorRect, setHoverAnchorRect] = useState<DOMRect | null>(null)
  const [hoverMessages, setHoverMessages] = useState<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: string }[] | null>(null)
  const [hoverLoading, setHoverLoading] = useState(false)
  const messageCache = useRef<Map<string, { id: string; role: 'user' | 'assistant'; content: string; timestamp: string }[]>>(new Map())
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // 搜尋防抖 300ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // 換頁/篩選/搜尋時清空選取並離開複選模式
  useEffect(() => {
    setSelectedIds(new Set())
    setIsSelectMode(false)
  }, [page, statusFilter, debouncedSearch])

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
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
      })

      if (result.success && result.data) {
        setProjects(result.data.projects)
        setTotal(result.data.total)
      }
      setIsLoading(false)
    }

    fetchProjects()
  }, [page, statusFilter, debouncedSearch, router, refetchFlag])

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


  useEffect(() => {
    const token = getAuthToken()
    if (!token) return
    setMyTemplatesLoading(true)
    getMyTemplates().then(result => {
      if (result.success && result.data) setMyTemplates(result.data)
      setMyTemplatesLoading(false)
    })
  }, [])

  const handleThumbnailUpdate = async (templateId: string, file: File) => {
    const token = getAuthToken()
    if (!token) return
    setThumbnailUploading(templateId)
    setThumbnailError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await fetch('/api/vps/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}))
        setThumbnailError(err.error || '上傳失敗')
        return
      }
      const { url } = await uploadRes.json()
      const result = await updateMyTemplateThumbnail(templateId, url)
      if (!result.success) {
        setThumbnailError(result.error || '更新失敗')
        return
      }
      // 重新整理我的模板列表
      const refreshed = await getMyTemplates()
      if (refreshed.success && refreshed.data) setMyTemplates(refreshed.data)
    } catch {
      setThumbnailError('上傳失敗，請稍後再試')
    } finally {
      setThumbnailUploading(null)
      setThumbnailTargetId(null)
    }
  }

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
        const firstUserMsg = result.data.messages.find((m) => m.role === 'user')
        const msgs = firstUserMsg ? [firstUserMsg] : []
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

  const handleToggleSelectMode = () => {
    if (isSelectMode) {
      setSelectedIds(new Set())
    }
    setIsSelectMode(prev => !prev)
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
        {/* 上傳到模板庫（僅已部署專案） */}
        {project.status === 'deployed' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setUploadProjectId(project.id)
              setShowTemplateModal(true)
            }}
            title="上傳到模板庫"
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
              cursor: 'pointer',
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </button>
        )}
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
          {isSelectMode && (
            <input
              type="checkbox"
              checked={selectedIds.has(project.id)}
              onChange={() => handleToggleSelect(project.id)}
              onClick={(e) => e.stopPropagation()}
              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--black)', flexShrink: 0 }}
            />
          )}
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
      width: '156px',
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
          {isSelectMode && (
            <input
              type="checkbox"
              checked={selectedIds.has(project.id)}
              onChange={() => handleToggleSelect(project.id)}
              onClick={(e) => e.stopPropagation()}
              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--black)', flexShrink: 0 }}
            />
          )}
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
      width: '104px',
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
        <button
          onClick={handleToggleSelectMode}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 14px',
            fontSize: 14,
            fontWeight: 500,
            background: isSelectMode ? 'var(--gray-100)' : 'var(--white)',
            color: isSelectMode ? 'var(--gray-700)' : 'var(--gray-500)',
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.15s',
          }}
        >
          {isSelectMode ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              取消複選
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M17 17h.01M14 17h.01M17 14h.01" />
              </svg>
              複選
            </>
          )}
        </button>
        <AnimatePresence>
          {isSelectMode && selectedIds.size > 0 && (
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
        {projects.length > 0 && isSelectMode && (
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
            if (isSelectMode) {
              handleToggleSelect(project.id)
              return
            }
            router.push(getProjectPrimaryPath(project))
          }}
          onRowMouseEnter={isMobile || isSelectMode ? undefined : handleRowMouseEnter}
          onRowMouseLeave={isMobile || isSelectMode ? undefined : handleRowMouseLeave}
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

      {/* 我的模板 */}
      {(myTemplatesLoading || myTemplates.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          style={{ marginTop: 48 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--black)' }}>我的模板</h2>
            <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>
              {myTemplatesLoading ? '載入中...' : `${myTemplates.length} 個`}
            </span>
          </div>

          {thumbnailError && (
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
              <span>{thumbnailError}</span>
              <button onClick={() => setThumbnailError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
            </div>
          )}

          {/* 隱藏的 file input */}
          <input
            ref={thumbnailInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file && thumbnailTargetId) {
                handleThumbnailUpdate(thumbnailTargetId, file)
              }
              e.target.value = ''
            }}
          />

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}>
            {myTemplatesLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: '1px solid var(--border-color)',
                  background: 'var(--gray-50)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}>
                  <div style={{ height: 140, background: 'var(--gray-100)' }} />
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ height: 14, background: 'var(--gray-200)', borderRadius: 4, marginBottom: 8, width: '70%' }} />
                    <div style={{ height: 12, background: 'var(--gray-200)', borderRadius: 4, width: '40%' }} />
                  </div>
                </div>
              ))
              : myTemplates.map((tmpl) => {
                const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
                  pending:  { label: '審核中', bg: '#FEF9C3', color: '#854D0E' },
                  approved: { label: '已上線', bg: '#DCFCE7', color: '#166534' },
                  rejected: { label: '已拒絕', bg: '#FEE2E2', color: '#991B1B' },
                }
                const st = statusConfig[tmpl.reviewStatus] ?? { label: tmpl.reviewStatus, bg: 'var(--gray-100)', color: 'var(--gray-600)' }
                const isUploading = thumbnailUploading === tmpl.id
                const isPublishing = publishingUpdate === tmpl.id
                const hasUnpublishedUpdate =
                  tmpl.reviewStatus === 'approved' &&
                  !!tmpl.sourceProjectUpdatedAt &&
                  !!tmpl.approvedAt &&
                  new Date(tmpl.sourceProjectUpdatedAt) > new Date(tmpl.approvedAt)

                return (
                  <div key={tmpl.id} style={{
                    borderRadius: 10,
                    overflow: 'hidden',
                    border: `1px solid ${hasUnpublishedUpdate ? '#FB923C' : 'var(--border-color)'}`,
                    background: 'var(--white)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    {/* 縮圖 */}
                    <div style={{
                      height: 140,
                      background: 'var(--gray-100)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                      {tmpl.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={tmpl.thumbnailUrl}
                          alt={tmpl.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                          gap: 6,
                          color: 'var(--gray-400)',
                        }}>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                          <span style={{ fontSize: 11 }}>無縮圖</span>
                        </div>
                      )}
                      {/* 上傳中遮罩 */}
                      {isUploading && (
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0,0,0,0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* 未發布更新 banner */}
                    {hasUnpublishedUpdate && (
                      <div style={{
                        padding: '7px 12px',
                        background: '#FFF7ED',
                        borderBottom: '1px solid #FED7AA',
                        fontSize: 12,
                        color: '#C2410C',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        專案有新版本尚未發布
                      </div>
                    )}

                    {/* 資訊 */}
                    <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--black)', lineHeight: 1.3, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tmpl.name}
                        </span>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 500,
                          padding: '2px 8px',
                          borderRadius: 99,
                          background: st.bg,
                          color: st.color,
                          flexShrink: 0,
                          whiteSpace: 'nowrap',
                        }}>
                          {st.label}
                        </span>
                      </div>

                      <span style={{ fontSize: 12, color: 'var(--gray-400)', textTransform: 'capitalize' }}>
                        {tmpl.category}
                      </span>

                      {tmpl.reviewStatus === 'rejected' && tmpl.reviewReason && (
                        <div style={{
                          fontSize: 12,
                          color: '#991B1B',
                          background: '#FEF2F2',
                          borderRadius: 5,
                          padding: '5px 8px',
                          lineHeight: 1.5,
                        }}>
                          拒絕原因：{tmpl.reviewReason}
                        </div>
                      )}

                      {/* 發布更新按鈕（有未發布更新時顯示） */}
                      {hasUnpublishedUpdate && (
                        <button
                          disabled={isPublishing}
                          onClick={async () => {
                            setPublishingUpdate(tmpl.id)
                            setThumbnailError(null)
                            try {
                              const result = await publishTemplateUpdate(tmpl.id)
                              if (!result.success) {
                                setThumbnailError(result.error || '發布失敗')
                                return
                              }
                              const refreshed = await getMyTemplates()
                              if (refreshed.success && refreshed.data) setMyTemplates(refreshed.data)
                            } catch {
                              setThumbnailError('發布失敗，請稍後再試')
                            } finally {
                              setPublishingUpdate(null)
                            }
                          }}
                          style={{
                            marginTop: 'auto',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 5,
                            fontSize: 12,
                            fontWeight: 500,
                            padding: '7px 12px',
                            borderRadius: 6,
                            border: 'none',
                            background: isPublishing ? '#6B7280' : '#111',
                            color: '#fff',
                            cursor: isPublishing ? 'not-allowed' : 'pointer',
                            opacity: isPublishing ? 0.7 : 1,
                            transition: 'background 0.15s',
                            width: '100%',
                          }}
                          onMouseEnter={(e) => { if (!isPublishing) e.currentTarget.style.background = '#374151' }}
                          onMouseLeave={(e) => { if (!isPublishing) e.currentTarget.style.background = '#111' }}
                        >
                          {isPublishing ? (
                            <>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                              </svg>
                              發布中...
                            </>
                          ) : (
                            <>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2v10m0 0l-3-3m3 3l3-3" />
                                <path d="M20 16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4" />
                              </svg>
                              發布更新
                            </>
                          )}
                        </button>
                      )}

                      {/* 更新縮圖按鈕 */}
                      <button
                        disabled={isUploading}
                        onClick={() => {
                          setThumbnailTargetId(tmpl.id)
                          thumbnailInputRef.current?.click()
                        }}
                        style={{
                          marginTop: 'auto',
                          paddingTop: 6,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 5,
                          fontSize: 12,
                          fontWeight: 500,
                          padding: '7px 12px',
                          borderRadius: 6,
                          border: '1px solid var(--border-color)',
                          background: 'var(--white)',
                          color: 'var(--gray-600)',
                          cursor: isUploading ? 'not-allowed' : 'pointer',
                          opacity: isUploading ? 0.5 : 1,
                          transition: 'all 0.15s',
                          width: '100%',
                        }}
                        onMouseEnter={(e) => { if (!isUploading) { e.currentTarget.style.background = 'var(--gray-50)'; e.currentTarget.style.color = 'var(--black)' } }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--white)'; e.currentTarget.style.color = 'var(--gray-600)' }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        {isUploading ? '上傳中...' : '更新縮圖並重新送審'}
                      </button>
                    </div>
                  </div>
                )
              })
            }
          </div>
        </motion.div>
      )}

      {/* 模板上傳 Modal */}
      <TemplateSubmitModal
        isOpen={showTemplateModal}
        onClose={() => { setShowTemplateModal(false); setUploadProjectId(null) }}
        projectId={uploadProjectId}
      />
    </div>
  )
}
