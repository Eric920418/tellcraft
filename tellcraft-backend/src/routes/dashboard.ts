/**
 * Dashboard API 路由
 * 提供用戶儀表板所需的數據
 */
import { Router, Request, Response } from 'express'
import { query, queryOne } from '../db/client'
import { requireAuth } from '../middleware/auth'

const router: Router = Router()

// 方案配額限制
const PLAN_MESSAGE_LIMITS: Record<string, number> = {
  free: 50,
  creator: 200,
  pro: 1000,
  business: Infinity
}

/**
 * GET /api/dashboard/stats
 * 獲取用戶儀表板統計數據
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id

    // 查詢用戶信息
    const user = await queryOne<{
      plan: string
      message_count_this_period: number
    }>(
      'SELECT plan, message_count_this_period FROM users WHERE id = $1',
      [userId]
    )

    if (!user) {
      return res.status(404).json({ error: '用戶不存在' })
    }

    // 查詢專案數量和最近的專案
    const projectsResult = await query<{
      id: string
      name: string
      status: string
      created_at: string
      updated_at: string
    }>(
      `SELECT id, name, status, created_at, updated_at
       FROM projects
       WHERE user_id = $1
       ORDER BY updated_at DESC
       LIMIT 5`,
      [userId]
    )

    // 查詢專案總數
    const projectCountResult = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM projects WHERE user_id = $1',
      [userId]
    )

    const projects = projectsResult.rows
    const projectCount = parseInt(projectCountResult?.count || '0', 10)
    const projectIds = projects.map(p => p.id)

    // 如果有專案，查詢對話和部署數量
    let convCount = 0
    let deployCount = 0
    const convCountMap = new Map<string, number>()

    if (projectIds.length > 0) {
      const [convCountResult, deployCountResult, convCountsResult] = await Promise.all([
        queryOne<{ count: string }>(
          `SELECT COUNT(*) as count FROM conversations WHERE project_id = ANY($1)`,
          [projectIds]
        ),
        queryOne<{ count: string }>(
          `SELECT COUNT(*) as count FROM deployments WHERE project_id = ANY($1) AND status = 'success'`,
          [projectIds]
        ),
        query<{ project_id: string }>(
          `SELECT project_id FROM conversations WHERE project_id = ANY($1)`,
          [projectIds]
        )
      ])

      convCount = parseInt(convCountResult?.count || '0', 10)
      deployCount = parseInt(deployCountResult?.count || '0', 10)

      convCountsResult.rows.forEach(c => {
        convCountMap.set(c.project_id, (convCountMap.get(c.project_id) || 0) + 1)
      })
    }

    const stats = {
      totalProjects: projectCount,
      totalConversations: convCount,
      totalDeployments: deployCount,
      messageUsage: {
        used: user.message_count_this_period || 0,
        limit: PLAN_MESSAGE_LIMITS[user.plan || 'free'] || 50,
        plan: user.plan || 'free'
      }
    }

    const recentProjects = projects.map(p => ({
      id: p.id,
      name: p.name,
      status: p.status,
      conversationCount: convCountMap.get(p.id) || 0,
      updatedAt: p.updated_at
    }))

    res.json({ stats, recentProjects })
  } catch (error) {
    console.error('[Dashboard] 獲取統計失敗:', error)
    res.status(500).json({ error: '獲取統計數據失敗' })
  }
})

/**
 * GET /api/dashboard/admin/stats
 * 管理員統計數據
 */
router.get('/admin/stats', requireAuth, async (req, res) => {
  try {
    // 檢查是否為管理員
    const adminCheck = await queryOne<{ is_admin: boolean }>(
      'SELECT is_admin FROM users WHERE id = $1',
      [req.user!.id]
    )

    if (!adminCheck?.is_admin) {
      return res.status(403).json({ error: '無管理員權限' })
    }

    const [
      usersCount,
      projectsCount,
      conversationsCount,
      deploymentsCount,
      newUsers7d,
      llmCost
    ] = await Promise.all([
      queryOne<{ count: string }>('SELECT COUNT(*) as count FROM users'),
      queryOne<{ count: string }>('SELECT COUNT(*) as count FROM projects'),
      queryOne<{ count: string }>('SELECT COUNT(*) as count FROM conversations'),
      queryOne<{ count: string }>("SELECT COUNT(*) as count FROM deployments WHERE status = 'success'"),
      queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL '7 days'`
      ),
      queryOne<{ total: string }>(
        `SELECT COALESCE(SUM(cost_usd), 0) as total FROM llm_usage
         WHERE created_at >= NOW() - INTERVAL '30 days'`
      )
    ])

    // 計算 7 天活躍用戶（有對話更新的）
    const activeUsers7d = await queryOne<{ count: string }>(
      `SELECT COUNT(DISTINCT p.user_id) as count
       FROM conversations c
       JOIN projects p ON c.project_id = p.id
       WHERE c.updated_at >= NOW() - INTERVAL '7 days'`
    )

    res.json({
      totalUsers: parseInt(usersCount?.count || '0', 10),
      totalProjects: parseInt(projectsCount?.count || '0', 10),
      totalConversations: parseInt(conversationsCount?.count || '0', 10),
      totalDeployments: parseInt(deploymentsCount?.count || '0', 10),
      activeUsers7d: parseInt(activeUsers7d?.count || '0', 10),
      newUsers7d: parseInt(newUsers7d?.count || '0', 10),
      totalLLMCost: parseFloat(llmCost?.total || '0')
    })
  } catch (error) {
    console.error('[Dashboard] 獲取管理員統計失敗:', error)
    res.status(500).json({ error: '獲取統計數據失敗' })
  }
})

/**
 * GET /api/dashboard/admin/usage
 * LLM 用量統計
 */
router.get('/admin/usage', requireAuth, async (req, res) => {
  try {
    // 檢查是否為管理員
    const adminCheck = await queryOne<{ is_admin: boolean }>(
      'SELECT is_admin FROM users WHERE id = $1',
      [req.user!.id]
    )

    if (!adminCheck?.is_admin) {
      return res.status(403).json({ error: '無管理員權限' })
    }

    const { startDate, endDate, groupBy = 'day' } = req.query as {
      startDate?: string
      endDate?: string
      groupBy?: string
    }

    // 預設查詢最近 30 天
    const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const start = startDate || defaultStartDate
    const end = endDate ? `${endDate}T23:59:59.999Z` : new Date().toISOString()

    const result = await query<{
      id: string
      user_id: string
      conversation_id: string
      model: string
      input_tokens: number
      output_tokens: number
      cost_usd: string
      created_at: string
    }>(
      `SELECT id, user_id, conversation_id, model, input_tokens, output_tokens, cost_usd, created_at
       FROM llm_usage
       WHERE created_at >= $1 AND created_at <= $2
       ORDER BY created_at ASC`,
      [start, end]
    )

    // 計算總計和分組
    let totalInputTokens = 0
    let totalOutputTokens = 0
    let totalCost = 0

    const breakdownMap = new Map<string, {
      inputTokens: number
      outputTokens: number
      cost: number
      count: number
    }>()

    for (const row of result.rows) {
      totalInputTokens += row.input_tokens || 0
      totalOutputTokens += row.output_tokens || 0
      totalCost += parseFloat(row.cost_usd) || 0

      // 分組
      let key: string
      const date = new Date(row.created_at)

      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0]
          break
        case 'week': {
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = weekStart.toISOString().split('T')[0]
          break
        }
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          break
        case 'model':
          key = row.model
          break
        case 'conversation':
          key = row.conversation_id || '(無對話)'
          break
        default:
          key = date.toISOString().split('T')[0]
      }

      const existing = breakdownMap.get(key) || { inputTokens: 0, outputTokens: 0, cost: 0, count: 0 }
      breakdownMap.set(key, {
        inputTokens: existing.inputTokens + (row.input_tokens || 0),
        outputTokens: existing.outputTokens + (row.output_tokens || 0),
        cost: existing.cost + (parseFloat(row.cost_usd) || 0),
        count: existing.count + 1,
      })
    }

    const breakdown = Array.from(breakdownMap.entries()).map(([key, value]) => ({
      key,
      ...value
    }))

    res.json({
      totalInputTokens,
      totalOutputTokens,
      totalCost,
      breakdown
    })
  } catch (error) {
    console.error('[Dashboard] 獲取 LLM 用量失敗:', error)
    res.status(500).json({ error: '獲取用量數據失敗' })
  }
})

export default router
