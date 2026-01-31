'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { StatusBadge, MiniStatsCard } from '../../../components/dashboard'
import { getProjectDetail } from '../../../actions'

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
  const _router = useRouter()
  const [data, setData] = useState<ProjectDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
              background: 'var(--black)',
              color: 'var(--white)',
              textDecoration: 'none',
            }}
          >
            訪問網站 ↗
          </a>
        )}
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
                style={{
                  padding: '14px 16px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                    對話 #{index + 1}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                    {conv.messageCount} 則訊息 · {conv.specComplete ? '規格已完成' : '進行中'}
                  </div>
                  {conv.lastMessage && (
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--gray-500)',
                        marginTop: 4,
                        fontStyle: 'italic',
                      }}
                    >
                      「{conv.lastMessage}...」
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                  {new Date(conv.updatedAt).toLocaleDateString('zh-TW')}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Deployments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
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
    </div>
  )
}
