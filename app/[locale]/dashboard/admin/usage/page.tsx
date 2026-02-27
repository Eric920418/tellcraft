'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { StatsCard, BarChart, LineChart, DateRangePicker } from '@/app/components/dashboard'
import { getLLMUsageStats } from '@/app/lib/vps-api'

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

type GroupBy = 'day' | 'week' | 'month' | 'model' | 'conversation'

// 計算預設日期範圍的函數
function getDefaultDateRange() {
  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  return { start: thirtyDaysAgo, end: today }
}

// 從 localStorage 獲取 token（客戶端）
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

export default function AdminUsagePage() {
  const router = useRouter()
  const [usage, setUsage] = useState<LLMUsage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [groupBy, setGroupBy] = useState<GroupBy>('day')
  // 使用函數初始化確保在客戶端計算，避免 SSR hydration 問題
  const [dateRange, setDateRange] = useState(getDefaultDateRange)
  const [tablePage, setTablePage] = useState(0)
  const TABLE_PAGE_SIZE = 20
  const CHART_MAX_ITEMS = 20

  // 切換 groupBy 時重置分頁
  useEffect(() => {
    setTablePage(0)
  }, [groupBy])

  useEffect(() => {
    const fetchData = async () => {
      const token = getAuthToken()
      if (!token) {
        router.push('/auth/login?next=/dashboard/admin/usage')
        return
      }

      setIsLoading(true)
      const result = await getLLMUsageStats({
        token,
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

  // 準備圖表數據（使用 useMemo 避免不必要的重新計算）
  // 數據量大時只取 Top N（按 count 排序）
  const chartData = useMemo(() => {
    const items = usage?.breakdown || []
    const sorted = items.length > CHART_MAX_ITEMS
      ? [...items].sort((a, b) => b.count - a.count).slice(0, CHART_MAX_ITEMS)
      : items
    return sorted.map((d) => ({
      label: groupBy === 'conversation'
        ? d.key.slice(0, 8)
        : d.key.length > 10 ? d.key.slice(5) : d.key,
      value: d.count,
    }))
  }, [usage?.breakdown, groupBy])

  const costChartData = useMemo(() => {
    const items = usage?.breakdown || []
    const sorted = items.length > CHART_MAX_ITEMS
      ? [...items].sort((a, b) => b.cost - a.cost).slice(0, CHART_MAX_ITEMS)
      : items
    return sorted.map((d) => ({
      label: groupBy === 'conversation'
        ? d.key.slice(0, 8)
        : d.key.length > 10 ? d.key.slice(5) : d.key,
      value: d.cost,
    }))
  }, [usage?.breakdown, groupBy])

  // 表格分頁
  const totalRows = usage?.breakdown.length || 0
  const totalPages = Math.ceil(totalRows / TABLE_PAGE_SIZE)
  const pagedBreakdown = useMemo(() => {
    const start = tablePage * TABLE_PAGE_SIZE
    return usage?.breakdown.slice(start, start + TABLE_PAGE_SIZE) || []
  }, [usage?.breakdown, tablePage])

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
          <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 20 }}>
            使用次數
            {(usage?.breakdown.length || 0) > CHART_MAX_ITEMS && (
              <span style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 400, marginLeft: 8 }}>
                Top {CHART_MAX_ITEMS} / {usage?.breakdown.length}
              </span>
            )}
          </h2>
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
          <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 20 }}>
            成本趨勢
            {(usage?.breakdown.length || 0) > CHART_MAX_ITEMS && (
              <span style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 400, marginLeft: 8 }}>
                Top {CHART_MAX_ITEMS} / {usage?.breakdown.length}
              </span>
            )}
          </h2>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 500 }}>詳細分解</h2>
          {totalRows > 0 && (
            <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>
              共 {totalRows} 筆
            </span>
          )}
        </div>
        {isLoading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--gray-400)' }}>
            載入中...
          </div>
        ) : totalRows === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--gray-400)' }}>
            暫無數據
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
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
                  {pagedBreakdown.map((row) => (
                    <tr key={row.key} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px 16px', fontSize: 14 }}>
                        {groupBy === 'conversation' && row.key !== '(無對話)' ? (
                          <a
                            href={`/dashboard/conversations/${row.key}`}
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
            {/* 分頁控制 */}
            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                  paddingTop: 16,
                  marginTop: 16,
                  borderTop: '1px solid var(--border-color)',
                }}
              >
                <button
                  onClick={() => setTablePage((p) => Math.max(0, p - 1))}
                  disabled={tablePage === 0}
                  style={{
                    padding: '6px 12px',
                    fontSize: 13,
                    background: 'var(--white)',
                    border: '1px solid var(--border-color)',
                    color: tablePage === 0 ? 'var(--gray-300)' : 'var(--gray-600)',
                    cursor: tablePage === 0 ? 'default' : 'pointer',
                  }}
                >
                  ←
                </button>
                <span style={{ fontSize: 13, color: 'var(--gray-500)', minWidth: 80, textAlign: 'center' }}>
                  {tablePage + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setTablePage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={tablePage >= totalPages - 1}
                  style={{
                    padding: '6px 12px',
                    fontSize: 13,
                    background: 'var(--white)',
                    border: '1px solid var(--border-color)',
                    color: tablePage >= totalPages - 1 ? 'var(--gray-300)' : 'var(--gray-600)',
                    cursor: tablePage >= totalPages - 1 ? 'default' : 'pointer',
                  }}
                >
                  →
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  )
}
