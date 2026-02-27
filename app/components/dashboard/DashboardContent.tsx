'use client'

import { motion } from 'framer-motion'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import StatsCard from './StatsCard'
import { ProgressBar } from './Chart'

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

const statusColors: Record<string, string> = {
  draft: 'var(--gray-500)',
  generating: '#F59E0B',
  testing: '#3B82F6',
  deployed: '#22C55E',
  failed: '#EF4444',
}

const statusKeyMap: Record<string, string> = {
  draft: 'statusDraft',
  generating: 'statusGenerating',
  testing: 'statusTesting',
  deployed: 'statusDeployed',
  failed: 'statusFailed',
}

export function DashboardContent({
  stats,
  recentProjects,
}: {
  stats: Stats
  recentProjects: Project[]
}) {
  const t = useTranslations('dashboard')

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
          title={t('projectsLabel')}
          value={stats.totalProjects}
          icon="□"
          delay={0}
        />
        <StatsCard
          title={t('conversationsLabel')}
          value={stats.totalConversations}
          icon="◇"
          delay={0.05}
        />
        <StatsCard
          title={t('deploymentsLabel')}
          value={stats.totalDeployments}
          icon="⬡"
          delay={0.1}
        />
        <StatsCard
          title={t('plan')}
          value={stats.messageUsage.plan.toUpperCase()}
          subtitle={t('messageCount', { used: stats.messageUsage.used, limit: stats.messageUsage.limit })}
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
          {t('messageQuota')}
        </h2>
        <ProgressBar
          value={stats.messageUsage.used}
          max={stats.messageUsage.limit}
          label={t('quotaUsage')}
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
          <h2 style={{ fontSize: 16, fontWeight: 500 }}>{t('recentProjects')}</h2>
          <Link
            href="/dashboard/projects"
            style={{
              fontSize: 13,
              color: 'var(--gray-500)',
              textDecoration: 'none',
            }}
          >
            {t('viewAll')} →
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
            <p style={{ marginBottom: 16 }}>{t('noProjects')}</p>
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
              <span>+</span> {t('createFirstProject')}
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
                      {t('conversationCount', { count: project.conversationCount })}
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
                        color: statusColors[project.status] || 'var(--gray-500)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                      }}
                    >
                      {statusKeyMap[project.status] ? t(statusKeyMap[project.status]) : project.status}
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
