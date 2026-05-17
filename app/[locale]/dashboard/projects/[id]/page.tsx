'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Link, useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { StatusBadge, MiniStatsCard } from '@/app/components/dashboard'
import { VersionHistory } from '@/app/components/dashboard/VersionHistory'
import { getProjectDetail } from '@/app/actions'
import { startProjectIteration, deleteProject, purchaseBuyout, type CheckoutCurrency } from '@/app/lib/vps-api'
import { useLocale } from 'next-intl'
import { useAuth } from '@/app/hooks/useAuth'

interface ProjectDetail {
  project: {
    id: string
    name: string
    description: string | null
    status: string
    vercelUrl: string | null
    customDomain: string | null
    domainStatus: string | null
    createdAt: string
    updatedAt: string
  }
  conversations: Array<{
    id: string
    messageCount: number
    specComplete: boolean
    lastMessage: string | null
    createdAt: string
    updatedAt: string
  }>
  deployments: Array<{
    id: string
    url: string | null
    status: string
    createdAt: string
    hasCodeSnapshot: boolean
  }>
  generations: Array<{
    id: string
    status: string
    attemptCount: number
    createdAt: string
  }>
}

const statusVariants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  draft: 'default',
  generating: 'warning',
  testing: 'info',
  deployed: 'success',
  failed: 'error',
  pending: 'default',
  running: 'warning',
  success: 'success',
}

const statusLabelKeys: Record<string, string> = {
  draft: 'statusDraft',
  generating: 'statusGenerating',
  testing: 'statusTesting',
  deployed: 'statusDeployed',
  failed: 'statusFailed',
  pending: 'statusPending',
  running: 'statusRunning',
  success: 'statusSuccess',
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('dashboard')
  const tc = useTranslations('common')
  const locale = useLocale()
  const buyoutCurrency: CheckoutCurrency = locale === 'zh' ? 'twd' : 'usd'
  const { token } = useAuth()
  const [data, setData] = useState<ProjectDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isIterating, setIsIterating] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')
  const [isDownloading, setIsDownloading] = useState<string | null>(null)

  const getStatusLabel = (status: string) => {
    const key = statusLabelKeys[status]
    return key ? t(key) : status
  }

  const projectId = params.id as string

  useEffect(() => {
    const fetchData = async () => {
      const result = await getProjectDetail(projectId)

      if (result.success && result.data) {
        setData(result.data)
      } else {
        setError(result.error || tc('loadFailed'))
      }
      setIsLoading(false)
    }

    fetchData()
  }, [projectId])

  // 計算按鈕顯示邏輯
  const latestConversation = data?.conversations[0]
  const canContinue = latestConversation && !latestConversation.specComplete
  const canIterate = data?.project.status === 'deployed' || data?.project.status === 'failed'

  // 繼續對話
  const handleContinueConversation = () => {
    if (latestConversation) {
      router.push(`/?conversation=${latestConversation.id}`)
    }
  }

  // 開始新迭代
  const handleStartIteration = async () => {
    if (!token) {
      setError(t('loginFirst'))
      return
    }

    setIsIterating(true)
    try {
      const result = await startProjectIteration({
        projectId,
        token,
      })

      if (result.success && result.data) {
        router.push(`/?conversation=${result.data.conversationId}`)
      } else {
        setError(result.error || t('startIterationFailed'))
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsIterating(false)
    }
  }

  // 下載部署代碼
  const handleDownloadDeployment = async (deploymentId: string) => {
    if (!token) return
    setIsDownloading(deploymentId)
    try {
      const res = await fetch(
        `/api/projects/${projectId}/deployments/${deploymentId}/download-code?locale=${locale}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      // 精細模式買斷 gate（W3 第 3 件）：未付買斷費 → 402 + tier/price → 跳買斷 checkout
      if (res.status === 402) {
        const errPayload = await res.json().catch(() => ({} as { error?: string; data?: { orderId?: string } }))
        const orderId = errPayload?.data?.orderId
        if (orderId) {
          try {
            const buyoutRes = await purchaseBuyout({
              orderId,
              currency: buyoutCurrency,
              locale,
              token,
            })
            if (buyoutRes.success && buyoutRes.data?.checkoutUrl) {
              window.location.href = buyoutRes.data.checkoutUrl
              return
            }
            setError(buyoutRes.error || 'Buyout failed')
          } catch (buyoutErr) {
            setError(buyoutErr instanceof Error ? buyoutErr.message : String(buyoutErr))
          }
        } else {
          setError(errPayload?.error || 'precision_buyout_required')
        }
        return
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(err.error || t('downloadFailed'))
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${data?.project.name || 'project'}-code.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      setError(t('downloadFailed'))
    } finally {
      setIsDownloading(null)
    }
  }

  // 點擊對話卡片跳轉
  const handleConversationClick = (conversationId: string) => {
    router.push(`/?conversation=${conversationId}`)
  }

  // 刪除專案
  const handleDeleteProject = async () => {
    if (!token) {
      setError(t('loginFirst'))
      return
    }

    setIsDeleting(true)
    try {
      const result = await deleteProject({
        projectId,
        token,
      })

      if (result.success) {
        router.push('/dashboard/projects')
      } else {
        setError(result.error || t('deleteProjectFailed'))
        setShowDeleteConfirm(false)
      }
    } catch (err) {
      setError((err as Error).message)
      setShowDeleteConfirm(false)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--gray-500)' }}>
        {tc('loading')}
      </div>
    )
  }

  if (error || !data) {
    return (
      <div
        style={{
          padding: '40px',
          background: '#FEE2E2',
          border: '1px solid #FECACA',
          color: '#DC2626',
        }}
      >
        {error || t('projectNotExists')}
        <div style={{ marginTop: 16 }}>
          <Link href="/dashboard/projects" style={{ color: '#DC2626' }}>
            {t('backToProjects')}
          </Link>
        </div>
      </div>
    )
  }

  const { project, conversations, deployments, generations } = data

  return (
    <div>
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ marginBottom: 16 }}
      >
        <Link
          href="/dashboard/projects"
          style={{
            fontSize: 13,
            color: 'var(--gray-400)',
            textDecoration: 'none',
          }}
        >
          {t('backToProjects')}
        </Link>
      </motion.div>

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
          marginBottom: 32,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 500,
                letterSpacing: '-0.02em',
              }}
            >
              {project.name}
            </h1>
            <StatusBadge
              status={getStatusLabel(project.status)}
              variant={statusVariants[project.status] || 'default'}
            />
          </div>
          {project.description && (
            <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>{project.description}</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
          {/* 繼續對話按鈕 */}
          {canContinue && (
            <button
              onClick={handleContinueConversation}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: 500,
                background: 'var(--black)',
                color: 'var(--white)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {t('continueConversation')}
            </button>
          )}

          {/* 新增迭代按鈕 */}
          {canIterate && (
            <button
              onClick={handleStartIteration}
              disabled={isIterating}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: 500,
                background: isIterating ? 'var(--gray-300)' : 'var(--black)',
                color: 'var(--white)',
                border: 'none',
                cursor: isIterating ? 'not-allowed' : 'pointer',
              }}
            >
              {isIterating ? t('processingIteration') : t('newIteration')}
            </button>
          )}

          {/* 訪問網站按鈕 */}
          {project.vercelUrl && (
            <a
              href={project.vercelUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: 500,
                background: 'transparent',
                color: 'var(--black)',
                textDecoration: 'none',
                border: '1px solid var(--border-color)',
              }}
            >
              {t('visitSite')}
            </a>
          )}

          {/* Email 設定 */}
          <Link
            href={`/dashboard/projects/${project.id}/settings/email`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 500,
              background: 'transparent',
              color: 'var(--black)',
              textDecoration: 'none',
              border: '1px solid var(--border-color)',
            }}
          >
            Email 設定
          </Link>

          {/* CMS 客製化 Slots */}
          <Link
            href={`/dashboard/projects/${project.id}/settings/cms-slots`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 500,
              background: 'transparent',
              color: 'var(--black)',
              textDecoration: 'none',
              border: '1px solid var(--border-color)',
            }}
          >
            CMS 客製化
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 20,
          marginBottom: 32,
        }}
      >
        <div
          style={{
            padding: 20,
            background: 'var(--white)',
            border: '1px solid var(--border-color)',
          }}
        >
          <MiniStatsCard label={t('conversationsLabel')} value={conversations.length} />
        </div>
        <div
          style={{
            padding: 20,
            background: 'var(--white)',
            border: '1px solid var(--border-color)',
          }}
        >
          <MiniStatsCard label={t('deploymentsLabel')} value={deployments.length} />
        </div>
        <div
          style={{
            padding: 20,
            background: 'var(--white)',
            border: '1px solid var(--border-color)',
          }}
        >
          <MiniStatsCard label={t('generationsLabel')} value={generations.length} />
        </div>
        <div
          style={{
            padding: 20,
            background: 'var(--white)',
            border: '1px solid var(--border-color)',
          }}
        >
          <MiniStatsCard
            label={t('createdDate')}
            value={new Date(project.createdAt).toLocaleDateString()}
          />
        </div>
      </motion.div>

      {/* Conversations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        style={{
          padding: 24,
          background: 'var(--white)',
          border: '1px solid var(--border-color)',
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 20 }}>{t('conversationRecords')}</h2>
        {conversations.length === 0 ? (
          <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>{t('noConversations')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {conversations.map((conv, index) => (
              <div
                key={conv.id}
                onClick={() => handleConversationClick(conv.id)}
                style={{
                  padding: '14px 16px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.15s, border-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--gray-50)'
                  e.currentTarget.style.borderColor = 'var(--gray-300)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.borderColor = 'var(--border-color)'
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                    {t('conversationNumber', { num: conversations.length - index })}
                    {!conv.specComplete && (
                      <span style={{
                        marginLeft: 8,
                        fontSize: 11,
                        padding: '2px 6px',
                        background: 'var(--yellow-100)',
                        color: 'var(--yellow-700)',
                        borderRadius: 4,
                      }}>
                        {t('inProgress')}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                    {t('messages')} {conv.messageCount}
                  </div>
                  {conv.lastMessage && (
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--gray-500)',
                        marginTop: 4,
                        fontStyle: 'italic',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      「{conv.lastMessage}」
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                    {new Date(conv.updatedAt).toLocaleDateString('zh-TW')}
                  </div>
                  <span style={{ color: 'var(--gray-400)' }}>→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Version History */}
      {token && generations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          style={{
            padding: 24,
            background: 'var(--white)',
            border: '1px solid var(--border-color)',
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 20 }}>{t('versionHistory')}</h2>
          <VersionHistory
            projectId={projectId}
            token={token}
            onError={(err) => setError(err)}
          />
        </motion.div>
      )}

      {/* Deployments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        style={{
          padding: 24,
          background: 'var(--white)',
          border: '1px solid var(--border-color)',
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 20 }}>{t('deploymentHistory')}</h2>
        {deployments.length === 0 ? (
          <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>{t('noDeployments')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {deployments.map((deploy, _index) => (
              <div
                key={deploy.id}
                style={{
                  padding: '14px 16px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <StatusBadge
                    status={getStatusLabel(deploy.status)}
                    variant={statusVariants[deploy.status] || 'default'}
                  />
                  {deploy.url && (
                    <a
                      href={deploy.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 13,
                        color: 'var(--gray-500)',
                        textDecoration: 'none',
                      }}
                    >
                      {deploy.url.replace('https://', '')}
                    </a>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {deploy.hasCodeSnapshot && (
                    <button
                      onClick={() => handleDownloadDeployment(deploy.id)}
                      disabled={isDownloading === deploy.id}
                      style={{
                        padding: '4px 10px',
                        fontSize: 11,
                        background: 'transparent',
                        color: isDownloading === deploy.id ? 'var(--gray-400)' : 'var(--gray-600)',
                        border: '1px solid var(--border-color)',
                        cursor: isDownloading === deploy.id ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isDownloading === deploy.id ? t('downloading') : t('downloadCode')}
                    </button>
                  )}
                  <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                    {new Date(deploy.createdAt).toLocaleDateString('zh-TW')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Danger Zone - 刪除專案 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        style={{
          marginTop: 24,
          padding: 24,
          background: 'var(--white)',
          border: '1px solid #FECACA',
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 8, color: '#DC2626' }}>
          {t('dangerZone')}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 16 }}>
          {t('deleteProjectWarning')}
        </p>
        <button
          onClick={() => { setShowDeleteConfirm(true); setDeleteConfirmName('') }}
          style={{
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 500,
            background: 'transparent',
            color: '#DC2626',
            border: '1px solid #DC2626',
            cursor: 'pointer',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#DC2626'
            e.currentTarget.style.color = 'white'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#DC2626'
          }}
        >
          {t('deleteProject')}
        </button>
      </motion.div>

      {/* 刪除確認彈窗 */}
      {showDeleteConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => { if (!isDeleting) { setShowDeleteConfirm(false); setDeleteConfirmName('') } }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: 'var(--white)',
              padding: 32,
              maxWidth: 400,
              width: '90%',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 500, marginBottom: 12 }}>
              {t('confirmDeleteTitle')}
            </h3>
            <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 8 }}>
              {t('confirmDeleteBody', { name: project.name })}
            </p>
            <ul style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 24, paddingLeft: 20 }}>
              <li>{t('deleteItemConversations', { count: conversations.length })}</li>
              <li>{t('deleteItemGenerations', { count: generations.length })}</li>
              <li>{t('deleteItemDeployments', { count: deployments.length })}</li>
            </ul>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 8 }}>
                {t('deleteConfirmNameLabel', { name: project.name })}
              </p>
              <input
                type="text"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder={project.name}
                autoFocus
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: 14,
                  border: '1px solid var(--border-color)',
                  outline: 'none',
                  fontFamily: 'var(--font-mono)',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmName('') }}
                disabled={isDeleting}
                style={{
                  padding: '10px 20px',
                  fontSize: 14,
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.5 : 1,
                }}
              >
                {tc('cancel')}
              </button>
              <button
                onClick={handleDeleteProject}
                disabled={isDeleting || deleteConfirmName !== project.name}
                style={{
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: 500,
                  background: isDeleting ? '#F87171' : '#DC2626',
                  color: 'white',
                  border: 'none',
                  cursor: (isDeleting || deleteConfirmName !== project.name) ? 'not-allowed' : 'pointer',
                  opacity: deleteConfirmName !== project.name ? 0.4 : 1,
                }}
              >
                {isDeleting ? t('deleting') : t('confirmDelete')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
