'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { StatsCard, BarChart, LineChart, DateRangePicker } from '../../../components/dashboard'
import { getLLMUsageStats } from '../../../actions/admin'

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
    conversationId?: string
  }>
}

type GroupBy = 'day' | 'week' | 'month' | 'model' | 'conversation'

export default function AdminUsagePage() {
  const router = useRouter()
  const [usage, setUsage] = useState<LLMUsage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [groupBy, setGroupBy] = useState<GroupBy>('day')
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const result = await getLLMUsageStats({
        startDate: dateRange.start,
        endDate: dateRange.end,
        groupBy,
      })

      if (!result.success) {
        if (result.error === '無管理員權限') {
          router.push('/dashboard')
          return
        }
        setError(result.error || '載入失敗')
        setIsLoading(false)
        return
      }

      if (result.data) {
        setUsage(result.data)
      }
      setIsLoading(false)
    }

    fetchData()
  }, [dateRange, groupBy, router])

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

  // 準備圖表數據（使用 useMemo 避免不必要的重新計算）
  const chartData = useMemo(() =>
    usage?.breakdown.map((d) => ({
      label: d.key.length > 10 ? d.key.slice(5) : d.key, // 縮短日期顯示
      value: d.count,
    })) || []
  , [usage?.breakdown])

  const costChartData = useMemo(() =>
    usage?.breakdown.map((d) => ({
      label: d.key.length > 10 ? d.key.slice(5) : d.key,
      value: d.cost,
    })) || []
  , [usage?.breakdown])

  return (
    <div>
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
          <h1
            style={{
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: '-0.02em',
              marginBottom: 8,
            }}
          >
            LLM 用量統計
          </h1>
          <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>
            監控 API 使用量和成本
          </p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
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
        <StatsCard
          title="總成本"
          value={`$${(usage?.totalCost || 0).toFixed(2)}`}
          icon="$"
          delay={0}
        />
        <StatsCard
          title="總呼叫次數"
          value={usage?.breakdown.reduce((sum, d) => sum + d.count, 0) || 0}
          icon="◈"
          delay={0.05}
        />
        <StatsCard
          title="輸入 Tokens"
          value={usage?.totalInputTokens || 0}
          icon="→"
          delay={0.1}
        />
        <StatsCard
          title="輸出 Tokens"
          value={usage?.totalOutputTokens || 0}
          icon="←"
          delay={0.15}
        />
      </motion.div>

      {/* Group By Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        style={{ marginBottom: 24 }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          {(['day', 'week', 'month', 'model', 'conversation'] as GroupBy[]).map((g) => (
            <motion.button
              key={g}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setGroupBy(g)}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                background: groupBy === g ? 'var(--black)' : 'var(--white)',
                color: groupBy === g ? 'var(--white)' : 'var(--gray-600)',
                border: '1px solid',
                borderColor: groupBy === g ? 'var(--black)' : 'var(--border-color)',
                cursor: 'pointer',
              }}
            >
              {g === 'day' && '按日'}
              {g === 'week' && '按週'}
              {g === 'month' && '按月'}
              {g === 'model' && '按模型'}
              {g === 'conversation' && '按對話'}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 20,
          marginBottom: 32,
        }}
      >
        {/* Usage Chart */}
        <div
          style={{
            padding: 24,
            background: 'var(--white)',
            border: '1px solid var(--border-color)',
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 20 }}>使用次數</h2>
          {isLoading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--gray-400)' }}>
              載入中...
            </div>
          ) : chartData.length > 0 ? (
            <BarChart data={chartData} height={200} />
          ) : (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--gray-400)' }}>
              暫無數據
            </div>
          )}
        </div>

        {/* Cost Chart */}
        <div
          style={{
            padding: 24,
            background: 'var(--white)',
            border: '1px solid var(--border-color)',
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 20 }}>成本趨勢</h2>
          {isLoading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--gray-400)' }}>
              載入中...
            </div>
          ) : costChartData.length > 0 ? (
            <LineChart data={costChartData} height={200} />
          ) : (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--gray-400)' }}>
              暫無數據
            </div>
          )}
        </div>
      </motion.div>

      {/* Breakdown Table */}
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
        <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 20 }}>詳細分解</h2>
        {isLoading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--gray-400)' }}>
            載入中...
          </div>
        ) : usage?.breakdown.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--gray-400)' }}>
            暫無數據
          </div>
        ) : (
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: 'var(--gray-500)', fontWeight: 500 }}>
                    {groupBy === 'model' ? '模型' : groupBy === 'conversation' ? '對話 ID' : '日期'}
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, color: 'var(--gray-500)', fontWeight: 500 }}>
                    次數
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, color: 'var(--gray-500)', fontWeight: 500 }}>
                    輸入 Tokens
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, color: 'var(--gray-500)', fontWeight: 500 }}>
                    輸出 Tokens
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, color: 'var(--gray-500)', fontWeight: 500 }}>
                    成本
                  </th>
                </tr>
              </thead>
              <tbody>
                {usage?.breakdown.map((row) => (
                  <tr key={row.key} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '14px 16px', fontSize: 14 }}>
                      {groupBy === 'conversation' && row.conversationId ? (
                        <a
                          href={`/dashboard/conversations/${row.conversationId}`}
                          style={{
                            color: 'var(--blue-600)',
                            textDecoration: 'none',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 12,
                          }}
                          title={row.key}
                        >
                          {row.key.slice(0, 8)}...
                        </a>
                      ) : (
                        row.key
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      {row.count.toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      {row.inputTokens.toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      {row.outputTokens.toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      ${row.cost.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}
