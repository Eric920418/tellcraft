'use client'

import { Link, useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import StatsCard from './StatsCard'
import { ProgressBar } from './Chart'

interface Stats {
  totalProjects: number
  totalConversations: number
  totalDeployments: number
  creditUsage: {
    used: number
    limit: number
    plan: string
    isFairUse: boolean
  }
}

interface Project {
  id: string
  name: string
  status: string
  isPinned: boolean
  conversationCount: number
  latestConversationId: string | null
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
  const router = useRouter()
  const creditUsageSubtitle = stats.creditUsage.isFairUse
    ? t('messageCountFairUse', { used: stats.creditUsage.used })
    : t('messageCount', { used: stats.creditUsage.used, limit: stats.creditUsage.limit })

  const getProjectPrimaryPath = (project: Project) => {
    if (project.latestConversationId) return `/?conversation=${project.latestConversationId}`
    return `/dashboard/projects/${project.id}`
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
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
      </div>

      {/* Stats Grid */}
      <div
        className="stats-grid"
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
          value={stats.creditUsage.plan.toUpperCase()}
          subtitle={creditUsageSubtitle}
          icon="◈"
          delay={0.15}
        />
      </div>

      {/* Message Usage */}
      <div
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
          value={stats.creditUsage.used}
          max={stats.creditUsage.limit}
          label={t('quotaUsage')}
          maxLabel={stats.creditUsage.isFairUse ? t('fairUseLabel') : undefined}
        />
      </div>

      {/* Recent Projects */}
      <div
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, overflow: 'hidden' }}>
            {recentProjects.map((project, index) => (
              <div
                key={project.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  router.push(getProjectPrimaryPath(project))
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    router.push(getProjectPrimaryPath(project))
                  }
                }}
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
                  cursor: 'pointer',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, color: 'var(--black)' }}>
                    {project.isPinned && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2l2.09 6.26L21 9.27l-5 4.87L17.18 21 12 17.27 6.82 21 8 14.14l-5-4.87 6.91-1.01L12 2z" />
                      </svg>
                    )}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
