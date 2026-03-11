'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from '@/i18n/navigation'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { getAdminTemplates, getProjectFiles } from '@/app/lib/vps-api'
import { reviewTemplate } from '@/app/actions/templates'

const SandpackPreview = dynamic(
  () => import('@/app/components/uiux/SandpackPreview'),
  { ssr: false }
)

interface AdminTemplate {
  id: string
  name: string
  slug: string
  category: string
  description: string
  thumbnailUrl: string
  previewImageUrl?: string | null
  tags: string[]
  isActive: boolean
  isFeatured: boolean
  sortOrder: number
  createdAt: string
  reviewStatus: string
  reviewReason: string | null
  submittedBy: string | null
  sourceProjectId: string | null
  preview: {
    version: number | null
    updatedAt: string | null
    status: 'cached' | 'none'
  }
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

export default function AdminTemplatesPage() {
  const router = useRouter()
  const t = useTranslations('dashboard.templates')
  const tc = useTranslations('common')
  const [templates, setTemplates] = useState<AdminTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewingId, setPreviewingId] = useState<string | null>(null)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [sandpackData, setSandpackData] = useState<{
    pages: Array<{ path: string; content: string; description: string }>
    components: Array<{ path: string; content: string; description: string }>
    styles: string
    tailwindConfig?: string
  } | null>(null)
  const [sandpackLoading, setSandpackLoading] = useState(false)

  const fetchTemplates = useCallback(async () => {
    const token = getAuthToken()
    if (!token) {
      router.push('/auth/login?next=/dashboard/admin/templates')
      return
    }

    const result = await getAdminTemplates({ token })

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
      setTemplates(result.data.templates as AdminTemplate[])
    }
    setIsLoading(false)
  }, [router])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const loadPreviewFiles = useCallback(async (template: AdminTemplate) => {
    if (!template.sourceProjectId) return
    const token = getAuthToken()
    if (!token) return
    setSandpackLoading(true)
    setSandpackData(null)
    const result = await getProjectFiles({ token, projectId: template.sourceProjectId })
    if (result.success && result.data) {
      const files = result.data.files
      const pages = files.filter(f => f.fileType === 'page').map(f => ({ path: f.path, content: f.content, description: '' }))
      const components = files.filter(f => f.fileType === 'component').map(f => ({ path: f.path, content: f.content, description: '' }))
      const styles = files.filter(f => f.fileType === 'style').map(f => f.content).join('\n')
      const tailwindConfig = files.find(f => f.fileType === 'config')?.content
      setSandpackData({ pages, components, styles, tailwindConfig })
    }
    setSandpackLoading(false)
  }, [])

  const handleApprove = async (templateId: string) => {
    setReviewingId(templateId)
    try {
      const result = await reviewTemplate({ templateId, status: 'approved' })
      if (result.success) {
        await fetchTemplates()
      } else {
        alert(result.error || '審核失敗')
      }
    } finally {
      setReviewingId(null)
    }
  }

  const handleRejectConfirm = async (templateId: string) => {
    setReviewingId(templateId)
    try {
      const result = await reviewTemplate({ templateId, status: 'rejected', reason: rejectReason || undefined })
      if (result.success) {
        setRejectingId(null)
        setRejectReason('')
        await fetchTemplates()
      } else {
        alert(result.error || '拒絕失敗')
      }
    } finally {
      setReviewingId(null)
    }
  }

  const openPreview = (template: AdminTemplate) => {
    setPreviewingId(template.id)
    setSandpackData(null)
    loadPreviewFiles(template)
  }

  if (isLoading) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--gray-500)' }}>
        {tc('loading')}
      </div>
    )
  }

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

  const pendingCount = templates.filter(t => t.reviewStatus === 'pending').length
  const previewingTemplate = templates.find(t => t.id === previewingId)

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: 32 }}
      >
        <h1
          style={{
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: '-0.02em',
            marginBottom: 8,
          }}
        >
          {t('title')}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>
          {t('subtitle')}
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{ marginBottom: 32, display: 'flex', gap: 16 }}
      >
        <div
          style={{
            padding: 20,
            background: 'var(--white)',
            border: '1px solid var(--border-color)',
            display: 'inline-block',
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 8, textTransform: 'uppercase' }}>
            {t('totalTemplates')}
          </div>
          <div style={{ fontSize: 28, fontWeight: 300, fontFamily: 'var(--font-mono)' }}>
            {templates.length}
          </div>
        </div>
        {pendingCount > 0 && (
          <div
            style={{
              padding: 20,
              background: '#FFF7ED',
              border: '1px solid #FED7AA',
              display: 'inline-block',
            }}
          >
            <div style={{ fontSize: 11, color: '#92400E', marginBottom: 8, textTransform: 'uppercase' }}>
              待審核
            </div>
            <div style={{ fontSize: 28, fontWeight: 300, fontFamily: 'var(--font-mono)', color: '#EA580C' }}>
              {pendingCount}
            </div>
          </div>
        )}
      </motion.div>

      {/* Templates Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        style={{
          background: 'var(--white)',
          border: '1px solid var(--border-color)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: 'var(--gray-500)' }}>
                {t('templateColumn')}
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: 'var(--gray-500)' }}>
                {t('category')}
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: 'var(--gray-500)' }}>
                {t('status')}
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: 'var(--gray-500)' }}>
                審核狀態
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 500, color: 'var(--gray-500)' }}>
                {t('actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {templates.map((template, index) => (
              <>
                <motion.tr
                  key={template.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  style={{ borderBottom: rejectingId === template.id ? 'none' : '1px solid var(--border-color)' }}
                >
                  <td style={{ padding: '16px' }}>
                    <div>
                      <div style={{ fontWeight: 500, marginBottom: 2 }}>{template.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{template.slug}</div>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span
                      style={{
                        padding: '4px 8px',
                        fontSize: 11,
                        background: 'var(--gray-100)',
                        borderRadius: 4,
                      }}
                    >
                      {template.category}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {template.isActive && (
                        <span
                          style={{
                            padding: '4px 8px',
                            fontSize: 11,
                            background: '#DCFCE7',
                            color: '#16A34A',
                            borderRadius: 4,
                          }}
                        >
                          {t('enabled')}
                        </span>
                      )}
                      {template.isFeatured && (
                        <span
                          style={{
                            padding: '4px 8px',
                            fontSize: 11,
                            background: '#FEF3C7',
                            color: '#D97706',
                            borderRadius: 4,
                          }}
                        >
                          {t('featured')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {template.reviewStatus === 'pending' && (
                      <span
                        style={{
                          padding: '4px 8px',
                          fontSize: 11,
                          background: '#FFF7ED',
                          color: '#EA580C',
                          borderRadius: 4,
                          border: '1px solid #FED7AA',
                        }}
                      >
                        待審核
                      </span>
                    )}
                    {template.reviewStatus === 'approved' && (
                      <span
                        style={{
                          padding: '4px 8px',
                          fontSize: 11,
                          background: '#DCFCE7',
                          color: '#16A34A',
                          borderRadius: 4,
                          border: '1px solid #BBF7D0',
                        }}
                      >
                        已通過
                      </span>
                    )}
                    {template.reviewStatus === 'rejected' && (
                      <span
                        title={template.reviewReason || ''}
                        style={{
                          padding: '4px 8px',
                          fontSize: 11,
                          background: '#FEE2E2',
                          color: '#DC2626',
                          borderRadius: 4,
                          border: '1px solid #FECACA',
                          cursor: template.reviewReason ? 'help' : 'default',
                        }}
                      >
                        已拒絕
                      </span>
                    )}
                    {(!template.reviewStatus || (template.reviewStatus !== 'pending' && template.reviewStatus !== 'approved' && template.reviewStatus !== 'rejected')) && (
                      <span
                        style={{
                          padding: '4px 8px',
                          fontSize: 11,
                          background: 'var(--gray-100)',
                          color: 'var(--gray-500)',
                          borderRadius: 4,
                        }}
                      >
                        —
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                      {template.reviewStatus === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(template.id)}
                            disabled={reviewingId === template.id}
                            style={{
                              padding: '6px 12px',
                              fontSize: 12,
                              background: reviewingId === template.id ? 'var(--gray-100)' : '#DCFCE7',
                              color: reviewingId === template.id ? 'var(--gray-400)' : '#16A34A',
                              border: '1px solid #BBF7D0',
                              borderRadius: 4,
                              cursor: reviewingId === template.id ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {reviewingId === template.id ? '...' : '✓ 批准'}
                          </button>
                          <button
                            onClick={() => {
                              setRejectingId(rejectingId === template.id ? null : template.id)
                              setRejectReason('')
                            }}
                            disabled={reviewingId === template.id}
                            style={{
                              padding: '6px 12px',
                              fontSize: 12,
                              background: '#FEE2E2',
                              color: '#DC2626',
                              border: '1px solid #FECACA',
                              borderRadius: 4,
                              cursor: 'pointer',
                            }}
                          >
                            ✗ 拒絕
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          if (previewingId === template.id) {
                            setPreviewingId(null)
                          } else {
                            openPreview(template)
                          }
                        }}
                        style={{
                          padding: '6px 12px',
                          fontSize: 12,
                          background: 'var(--gray-100)',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                        }}
                      >
                        {previewingId === template.id ? t('closePreview') : t('preview')}
                      </button>
                    </div>
                  </td>
                </motion.tr>
                {rejectingId === template.id && (
                  <tr style={{ borderBottom: '1px solid var(--border-color)', background: '#FFF7ED' }}>
                    <td colSpan={5} style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: '#92400E', flexShrink: 0 }}>拒絕原因：</span>
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                          placeholder="選填，說明拒絕原因"
                          style={{
                            flex: 1,
                            padding: '6px 10px',
                            fontSize: 12,
                            border: '1px solid #FED7AA',
                            borderRadius: 4,
                            background: 'white',
                            outline: 'none',
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleRejectConfirm(template.id)
                            if (e.key === 'Escape') { setRejectingId(null); setRejectReason('') }
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleRejectConfirm(template.id)}
                          disabled={reviewingId === template.id}
                          style={{
                            padding: '6px 12px',
                            fontSize: 12,
                            background: '#DC2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                          }}
                        >
                          {reviewingId === template.id ? '...' : '確認'}
                        </button>
                        <button
                          onClick={() => { setRejectingId(null); setRejectReason('') }}
                          style={{
                            padding: '6px 12px',
                            fontSize: 12,
                            background: 'var(--gray-100)',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                          }}
                        >
                          取消
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Preview Modal */}
      {previewingId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
          }}
          onClick={() => setPreviewingId(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              width: '100%',
              maxWidth: 1200,
              height: '80vh',
              background: 'var(--white)',
              borderRadius: 8,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span style={{ fontWeight: 500 }}>
                {t('previewTitle', { name: previewingTemplate?.name || '' })}
              </span>
              <button
                onClick={() => setPreviewingId(null)}
                style={{
                  padding: '4px 8px',
                  fontSize: 12,
                  background: 'var(--gray-100)',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                {t('closePreview')}
              </button>
            </div>
            {sandpackLoading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>
                載入預覽中...
              </div>
            ) : sandpackData ? (
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <SandpackPreview
                  pages={sandpackData.pages}
                  components={sandpackData.components}
                  styles={sandpackData.styles}
                  tailwindConfig={sandpackData.tailwindConfig}
                />
              </div>
            ) : previewingTemplate?.thumbnailUrl ? (
              <img
                src={previewingTemplate.thumbnailUrl}
                alt={previewingTemplate.name}
                style={{ flex: 1, objectFit: 'contain', background: '#f9fafb' }}
              />
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>
                此模板無可用預覽
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
