'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { StatusBadge, MiniStatsCard } from '../../../components/dashboard'
import { VersionHistory } from '../../../components/dashboard/VersionHistory'
import { getProjectDetail } from '../../../actions'
import { startProjectIteration, deleteProject } from '../../../lib/vps-api'
import { useAuth } from '../../../hooks/useAuth'

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

const statusLabels: Record<string, string> = {
  draft: '草稿',
  generating: '生成中',
  testing: '測試中',
  deployed: '已上線',
  failed: '失敗',
  pending: '等待中',
  running: '執行中',
  success: '成功',
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { token } = useAuth()
  const [data, setData] = useState<ProjectDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isIterating, setIsIterating] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const projectId = params.id as string

  useEffect(() => {
    const fetchData = async () => {
      const result = await getProjectDetail(projectId)

      if (result.success && result.data) {
        setData(result.data)
      } else {
        setError(result.error || '載入失敗')
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
      setError('請先登入')
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
        setError(result.error || '開始新迭代失敗')
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsIterating(false)
    }
  }

  // 點擊對話卡片跳轉
  const handleConversationClick = (conversationId: string) => {
    router.push(`/?conversation=${conversationId}`)
  }

  // 刪除專案
  const handleDeleteProject = async () => {
    if (!token) {
      setError('請先登入')
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
        setError(result.error || '刪除專案失敗')
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
        載入中...
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
        {error || '專案不存在'}
        <div style={{ marginTop: 16 }}>
          <Link href="/dashboard/projects" style={{ color: '#DC2626' }}>
            ← 返回專案列表
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
          ← 返回專案列表
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
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
              status={statusLabels[project.status] || project.status}
              variant={statusVariants[project.status] || 'default'}
            />
          </div>
          {project.description && (
            <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>{project.description}</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
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
              繼續對話 →
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
              {isIterating ? '處理中...' : '新增迭代 +'}
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
              訪問網站 ↗
            </a>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
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
          <MiniStatsCard label="對話" value={conversations.length} />
        </div>
        <div
          style={{
            padding: 20,
            background: 'var(--white)',
            border: '1px solid var(--border-color)',
          }}
        >
          <MiniStatsCard label="部署" value={deployments.length} />
        </div>
        <div
          style={{
            padding: 20,
            background: 'var(--white)',
            border: '1px solid var(--border-color)',
          }}
        >
          <MiniStatsCard label="生成" value={generations.length} />
        </div>
        <div
          style={{
            padding: 20,
            background: 'var(--white)',
            border: '1px solid var(--border-color)',
          }}
        >
          <MiniStatsCard
            label="創建日期"
            value={new Date(project.createdAt).toLocaleDateString('zh-TW')}
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
        <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 20 }}>對話記錄</h2>
        {conversations.length === 0 ? (
          <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>沒有對話記錄</p>
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
                    對話 #{conversations.length - index}
                    {!conv.specComplete && (
                      <span style={{
                        marginLeft: 8,
                        fontSize: 11,
                        padding: '2px 6px',
                        background: 'var(--yellow-100)',
                        color: 'var(--yellow-700)',
                        borderRadius: 4,
                      }}>
                        進行中
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                    {conv.messageCount} 則訊息
                  </div>
                  {conv.lastMessage && (
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--gray-500)',
                        marginTop: 4,
                        fontStyle: 'italic',
                        maxWidth: 400,
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
          <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 20 }}>版本歷史</h2>
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
        <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 20 }}>部署歷史</h2>
        {deployments.length === 0 ? (
          <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>沒有部署記錄</p>
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
                    status={statusLabels[deploy.status] || deploy.status}
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
                <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                  {new Date(deploy.createdAt).toLocaleDateString('zh-TW')}
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
          危險區域
        </h2>
        <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 16 }}>
          刪除專案將會永久移除所有對話記錄、生成記錄和部署歷史，此操作無法復原。
        </p>
        <button
          onClick={() => setShowDeleteConfirm(true)}
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
          刪除專案
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
          onClick={() => !isDeleting && setShowDeleteConfirm(false)}
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
              確定要刪除專案？
            </h3>
            <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 8 }}>
              專案「<strong>{project.name}</strong>」將被永久刪除，包含：
            </p>
            <ul style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 24, paddingLeft: 20 }}>
              <li>{conversations.length} 個對話記錄</li>
              <li>{generations.length} 個生成記錄</li>
              <li>{deployments.length} 個部署歷史</li>
            </ul>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
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
                取消
              </button>
              <button
                onClick={handleDeleteProject}
                disabled={isDeleting}
                style={{
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: 500,
                  background: isDeleting ? '#F87171' : '#DC2626',
                  color: 'white',
                  border: 'none',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                }}
              >
                {isDeleting ? '刪除中...' : '確認刪除'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
