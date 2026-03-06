'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Link, useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { StatusBadge, MiniStatsCard } from '@/app/components/dashboard'
import { getUserDetail, setUserAdmin } from '@/app/lib/vps-api'

// 從 localStorage 獲取 token
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

interface UserDetail {
  user: {
    id: string
    email: string
    name: string | null
    plan: string
    subscriptionStatus: string
    isAdmin: boolean
    messageCount: number
    createdAt: string
  }
  projects: Array<{
    id: string
    name: string
    status: string
    createdAt: string
  }>
  recentConversations: Array<{
    id: string
    projectName: string
    messageCount: number
    updatedAt: string
  }>
  stats: {
    totalProjects: number
    totalConversations: number
    totalDeployments: number
    totalLLMCost: number
  }
}

const statusVariants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  active: 'success',
  suspended: 'warning',
  cancelled: 'error',
  draft: 'default',
  generating: 'warning',
  testing: 'info',
  deployed: 'success',
  failed: 'error',
}

const statusLabelKeys: Record<string, string> = {
  active: 'statusActive',
  suspended: 'statusSuspended',
  cancelled: 'statusCancelled',
  draft: 'statusDraft',
  generating: 'statusGenerating',
  testing: 'statusTesting',
  deployed: 'statusDeployed',
  failed: 'statusFailed',
}

export default function AdminUserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('dashboard')
  const ta = useTranslations('dashboard.admin')
  const tc = useTranslations('common')
  const [data, setData] = useState<UserDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getStatusLabel = (status: string) => {
    const key = statusLabelKeys[status]
    return key ? t(key) : status
  }

  const userId = params.id as string

  useEffect(() => {
    const fetchData = async () => {
      const token = getAuthToken()
      if (!token) {
        router.push('/auth/login?next=/dashboard/admin/users/' + userId)
        return
      }

      const result = await getUserDetail({ token, userId })

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
        setData(result.data)
      }
      setIsLoading(false)
    }

    fetchData()
  }, [userId, router])

  const handleToggleAdmin = async () => {
    if (!data) return
    const token = getAuthToken()
    if (!token) {
      alert(tc('pleaseRelogin'))
      return
    }

    const result = await setUserAdmin({
      token,
      userId: data.user.id,
      isAdmin: !data.user.isAdmin,
    })
    if (result.success) {
      setData({
        ...data,
        user: { ...data.user, isAdmin: !data.user.isAdmin },
      })
    } else {
      alert(result.error || tc('operationFailed'))
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
        {error || ta('userNotExists')}
        <div style={{ marginTop: 16 }}>
          <Link href="/dashboard/admin/users" style={{ color: '#DC2626' }}>
            {t('backToUsers')}
          </Link>
        </div>
      </div>
    )
  }

  const { user, projects, recentConversations, stats } = data

  return (
    <div>
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ marginBottom: 16 }}
      >
        <Link
          href="/dashboard/admin/users"
          style={{
            fontSize: 13,
            color: 'var(--gray-400)',
            textDecoration: 'none',
          }}
        >
          {t('backToUsers')}
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
              {user.name || user.email.split('@')[0]}
            </h1>
            <StatusBadge
              status={getStatusLabel(user.subscriptionStatus)}
              variant={statusVariants[user.subscriptionStatus] || 'default'}
            />
            {user.isAdmin && (
              <span
                style={{
                  fontSize: 11,
                  padding: '3px 8px',
                  background: 'var(--black)',
                  color: 'var(--white)',
                }}
              >
                ADMIN
              </span>
            )}
          </div>
          <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>{user.email}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleToggleAdmin}
          style={{
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 500,
            background: user.isAdmin ? '#FEE2E2' : 'var(--black)',
            color: user.isAdmin ? '#DC2626' : 'var(--white)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {user.isAdmin ? ta('removeAdminFull') : ta('setAdminFull')}
        </motion.button>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
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
          <MiniStatsCard label={t('projectsLabel')} value={stats.totalProjects} />
        </div>
        <div
          style={{
            padding: 20,
            background: 'var(--white)',
            border: '1px solid var(--border-color)',
          }}
        >
          <MiniStatsCard label={t('conversationsLabel')} value={stats.totalConversations} />
        </div>
        <div
          style={{
            padding: 20,
            background: 'var(--white)',
            border: '1px solid var(--border-color)',
          }}
        >
          <MiniStatsCard label={t('deploymentsLabel')} value={stats.totalDeployments} />
        </div>
        <div
          style={{
            padding: 20,
            background: 'var(--white)',
            border: '1px solid var(--border-color)',
          }}
        >
          <MiniStatsCard label={t('llmCost')} value={`$${stats.totalLLMCost.toFixed(2)}`} />
        </div>
        <div
          style={{
            padding: 20,
            background: 'var(--white)',
            border: '1px solid var(--border-color)',
          }}
        >
          <MiniStatsCard label={t('plan')} value={user.plan.toUpperCase()} />
        </div>
      </motion.div>

      {/* Projects */}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 500 }}>{t('projectsLabel')}</h2>
          <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>{projects.length} {t('projectsLabel')}</span>
        </div>
        {projects.length === 0 ? (
          <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>{t('noProjects')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 480, overflowY: 'auto' }}>
            {projects.map((project) => (
              <div
                key={project.id}
                style={{
                  padding: '14px 16px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontWeight: 500 }}>{project.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <StatusBadge
                    status={getStatusLabel(project.status)}
                    variant={statusVariants[project.status] || 'default'}
                  />
                  <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                    {new Date(project.createdAt).toLocaleDateString('zh-TW')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Recent Conversations */}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 500 }}>{ta('recentConversations')}</h2>
          <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>{recentConversations.length} {t('conversationsLabel')}</span>
        </div>
        {recentConversations.length === 0 ? (
          <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>{t('noConversations')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 480, overflowY: 'auto' }}>
            {recentConversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/dashboard/admin/conversations/${conv.id}?userId=${userId}`}
                style={{
                  padding: '14px 16px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  textDecoration: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--gray-50)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{conv.projectName}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
                    {ta('messagesCount', { count: conv.messageCount })}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                    {new Date(conv.updatedAt).toLocaleDateString('zh-TW')}
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="1.5">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
