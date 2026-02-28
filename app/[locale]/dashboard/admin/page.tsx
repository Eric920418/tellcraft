'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { StatsCard, BarChart } from '@/app/components/dashboard'
import { getAdminStats, getLLMUsageStats } from '@/app/lib/vps-api'

interface AdminStats {
  totalUsers: number
  totalProjects: number
  totalConversations: number
  totalDeployments: number
  activeUsers7d: number
  newUsers7d: number
  totalLLMCost: number
}

interface LLMUsage {
  totalInputTokens: number
  totalOutputTokens: number
  totalCost: number
  breakdown: Array<{
    key: string
    inputTokens: number
    outputTokens: number
    cost: number
    count: number
  }>
}

// 從 localStorage 獲取 token（客戶端）
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const t = useTranslations('dashboard.admin')
  const tc = useTranslations('common')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [llmUsage, setLLMUsage] = useState<LLMUsage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const token = getAuthToken()
      if (!token) {
        router.push('/auth/login?next=/dashboard/admin')
        return
      }

      const [statsResult, usageResult] = await Promise.all([
        getAdminStats({ token }),
        getLLMUsageStats({ token, groupBy: 'day' }),
      ])

      if (!statsResult.success) {
        if (statsResult.error === 'ADMIN_REQUIRED') {
          router.push('/dashboard')
          return
        }
        setError(statsResult.error || tc('loadFailed'))
        setIsLoading(false)
        return
      }

      if (statsResult.data) {
        setStats(statsResult.data)
      }
      if (usageResult.success && usageResult.data) {
        setLLMUsage(usageResult.data)
      }
      setIsLoading(false)
    }

    fetchData()
  }, [router])

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

  // 準備圖表數據（最近 7 天）
  const chartData = llmUsage?.breakdown.slice(-7).map((d) => ({
    label: d.key.slice(5), // MM-DD
    value: d.count,
  })) || []

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
          title={t('totalUsers')}
          value={stats?.totalUsers || 0}
          subtitle={t('newUsersInDays', { count: stats?.newUsers7d || 0 })}
          icon="○"
          delay={0}
        />
        <StatsCard
          title={t('totalProjects')}
          value={stats?.totalProjects || 0}
          icon="□"
          delay={0.05}
        />
        <StatsCard
          title={t('totalConversations')}
          value={stats?.totalConversations || 0}
          icon="◇"
          delay={0.1}
        />
        <StatsCard
          title={t('totalDeployments')}
          value={stats?.totalDeployments || 0}
          icon="⬡"
          delay={0.15}
        />
      </div>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 20,
          marginBottom: 32,
        }}
      >
        <Link href="/dashboard/admin/users" style={{ textDecoration: 'none' }}>
          <motion.div
            whileHover={{ y: -2 }}
            style={{
              padding: 24,
              background: 'var(--white)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 8 }}>○</div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4, color: 'var(--black)' }}>
              {t('userManagement')}
            </div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
              {t('viewManageUsers')}
            </div>
          </motion.div>
        </Link>
        <Link href="/dashboard/admin/usage" style={{ textDecoration: 'none' }}>
          <motion.div
            whileHover={{ y: -2 }}
            style={{
              padding: 24,
              background: 'var(--white)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 8 }}>◈</div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4, color: 'var(--black)' }}>
              {t('llmUsage')}
            </div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
              {t('viewApiUsage')}
            </div>
          </motion.div>
        </Link>
        <Link href="/dashboard/admin/templates" style={{ textDecoration: 'none' }}>
          <motion.div
            whileHover={{ y: -2 }}
            style={{
              padding: 24,
              background: 'var(--white)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 8 }}>◫</div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4, color: 'var(--black)' }}>
              {t('templateManagement')}
            </div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
              {t('manageTemplates')}
            </div>
          </motion.div>
        </Link>
      </motion.div>

      {/* LLM Usage Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 20,
        }}
      >
        {/* Cost Summary */}
        <div
          style={{
            padding: 24,
            background: 'var(--white)',
            border: '1px solid var(--border-color)',
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 20 }}>{t('llmCostLabel')}</h2>
          <div style={{ display: 'flex', gap: 32 }}>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--gray-400)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 8,
                }}
              >
                {t('totalCostLabel')}
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 300,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                ${(llmUsage?.totalCost || 0).toFixed(2)}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--gray-400)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 8,
                }}
              >
                {t('totalTokensLabel')}
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 300,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {((llmUsage?.totalInputTokens || 0) + (llmUsage?.totalOutputTokens || 0)).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Chart */}
        <div
          style={{
            padding: 24,
            background: 'var(--white)',
            border: '1px solid var(--border-color)',
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 20 }}>{t('recent7dActivity')}</h2>
          {chartData.length > 0 ? (
            <BarChart data={chartData} height={150} />
          ) : (
            <div style={{ color: 'var(--gray-400)', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>
              {tc('noData')}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
