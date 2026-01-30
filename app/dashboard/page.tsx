'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { StatsCard, ProgressBar } from '../components/dashboard'
import { getUserStats, getUserProjects } from '../actions'

interface Stats {
  totalProjects: number
  totalConversations: number
  totalDeployments: number
  messageUsage: {
    used: number
    limit: number
    plan: string
  }
}

interface Project {
  id: string
  name: string
  status: string
  conversationCount: number
  updatedAt: string
}

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'var(--gray-500)' },
  generating: { label: '生成中', color: '#F59E0B' },
  testing: { label: '測試中', color: '#3B82F6' },
  deployed: { label: '已上線', color: '#22C55E' },
  failed: { label: '失敗', color: '#EF4444' },
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentProjects, setRecentProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const [statsResult, projectsResult] = await Promise.all([
        getUserStats(),
        getUserProjects({ pageSize: 5 }),
      ])

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data)
      } else {
        setError(statsResult.error || '載入失敗')
      }

      if (projectsResult.success && projectsResult.data) {
        setRecentProjects(projectsResult.data.projects)
      }

      setIsLoading(false)
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--gray-500)' }}>
        載入中...
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
          儀表板
        </h1>
        <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>
          歡迎回來，查看你的專案概覽
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 20,
          marginBottom: 32,
        }}
      >
        <StatsCard
          title="專案"
          value={stats?.totalProjects || 0}
          icon="□"
          delay={0}
        />
        <StatsCard
          title="對話"
          value={stats?.totalConversations || 0}
          icon="◇"
          delay={0.05}
        />
        <StatsCard
          title="部署"
          value={stats?.totalDeployments || 0}
          icon="⬡"
          delay={0.1}
        />
        <StatsCard
          title="方案"
          value={stats?.messageUsage.plan.toUpperCase() || 'FREE'}
          subtitle={`${stats?.messageUsage.used || 0} / ${stats?.messageUsage.limit || 50} 則訊息`}
          icon="◈"
          delay={0.15}
        />
      </div>

      {/* Message Usage */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        style={{
          padding: 24,
          background: 'var(--white)',
          border: '1px solid var(--border-color)',
          marginBottom: 32,
        }}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 500,
            marginBottom: 16,
          }}
        >
          訊息配額
        </h2>
        <ProgressBar
          value={stats?.messageUsage.used || 0}
          max={stats?.messageUsage.limit || 50}
          label="本週期使用量"
        />
      </motion.div>

      {/* Recent Projects */}
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 500 }}>最近專案</h2>
          <Link
            href="/dashboard/projects"
            style={{
              fontSize: 13,
              color: 'var(--gray-500)',
              textDecoration: 'none',
            }}
          >
            查看全部 →
          </Link>
        </div>

        {recentProjects.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--gray-400)',
            }}
          >
            <p style={{ marginBottom: 16 }}>還沒有專案</p>
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
              <span>+</span> 創建第一個專案
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {recentProjects.map((project, index) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                style={{ textDecoration: 'none' }}
              >
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ x: 4 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    marginLeft: -16,
                    marginRight: -16,
                    borderBottom:
                      index < recentProjects.length - 1
                        ? '1px solid var(--border-color)'
                        : 'none',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--black)' }}>
                      {project.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--gray-400)',
                        marginTop: 4,
                      }}
                    >
                      {project.conversationCount} 個對話
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '3px 8px',
                        background:
                          project.status === 'deployed'
                            ? '#DCFCE7'
                            : project.status === 'failed'
                            ? '#FEE2E2'
                            : 'var(--gray-100)',
                        color: statusLabels[project.status]?.color || 'var(--gray-500)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                      }}
                    >
                      {statusLabels[project.status]?.label || project.status}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>→</span>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
