'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { StatsCard, BarChart } from '../../components/dashboard'
import { getAdminStats, getLLMUsageStats } from '../../actions/admin'

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

export default function AdminDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [llmUsage, setLLMUsage] = useState<LLMUsage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const [statsResult, usageResult] = await Promise.all([
        getAdminStats(),
        getLLMUsageStats({ groupBy: 'day' }),
      ])

      if (!statsResult.success) {
        if (statsResult.error === '無管理員權限') {
          router.push('/dashboard')
          return
        }
        setError(statsResult.error || '載入失敗')
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
          管理員總覽
        </h1>
        <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>
          平台整體統計與監控
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
          title="總用戶"
          value={stats?.totalUsers || 0}
          subtitle={`${stats?.newUsers7d || 0} 新增（7天）`}
          icon="○"
          delay={0}
        />
        <StatsCard
          title="總專案"
          value={stats?.totalProjects || 0}
          icon="□"
          delay={0.05}
        />
        <StatsCard
          title="總對話"
          value={stats?.totalConversations || 0}
          icon="◇"
          delay={0.1}
        />
        <StatsCard
          title="成功部署"
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
          gridTemplateColumns: 'repeat(3, 1fr)',
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
              用戶管理
            </div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
              查看和管理所有用戶
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
              LLM 用量
            </div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
              查看 API 使用統計
            </div>
          </motion.div>
        </Link>
        <Link href="/dashboard/admin/logs" style={{ textDecoration: 'none' }}>
          <motion.div
            whileHover={{ y: -2 }}
            style={{
              padding: 24,
              background: 'var(--white)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 8 }}>≡</div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4, color: 'var(--black)' }}>
              審計日誌
            </div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
              查看操作記錄
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
          <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 20 }}>LLM 成本</h2>
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
                總成本
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
                總 Tokens
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
          <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 20 }}>最近 7 天活動</h2>
          {chartData.length > 0 ? (
            <BarChart data={chartData} height={150} />
          ) : (
            <div style={{ color: 'var(--gray-400)', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>
              暫無數據
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
