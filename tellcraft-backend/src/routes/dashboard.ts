/**
 * Dashboard API 路由
 * 提供用戶儀表板所需的數據
 */
import { Router, Request, Response } from 'express'
import { execSync } from 'child_process'
import { truncateSync } from 'fs'
import { query, queryOne } from '../db/client'
import { requireAuth, requireAdmin } from '../middleware/auth'
import { parseLogLine, sanitizeLogLine, isNoiseLine, type ParsedLogLine } from '../utils/log-parser'
import type Redis from 'ioredis'
import { getCreditLimit, isFairUsePlan, resolveEffectivePlan } from '../config/plans'
import { cached, invalidateCache } from '../lib/cache'
import { createLogger } from '../lib/logger'
import { generateThumbnailsForSeedTemplates } from '../services/thumbnail-recapture'

const logger = createLogger('dashboard')

const router: Router = Router()

// Redis client（在 index.ts 中注入）
let redisClient: Redis | null = null

export function setDashboardRedisClient(redis: Redis) {
  redisClient = redis
}

/**
 * GET /api/dashboard/stats
 * 獲取用戶儀表板統計數據
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id

    const data = await cached(`cache:dashboard:stats:${userId}`, 60, async () => {
      // 查詢用戶信息
      const user = await queryOne<{
        plan: string
        credits_used_this_period: number
        is_admin: boolean
      }>(
        'SELECT plan, credits_used_this_period, is_admin FROM users WHERE id = $1',
        [userId]
      )

      if (!user) {
        return null
      }

      // 查詢專案數量和最近的專案（含最新對話 ID）— LATERAL JOIN 取代 N+1 子查詢
      const projectsResult = await query<{
        id: string
        name: string
        status: string
        is_pinned: boolean
        created_at: string
        updated_at: string
        latest_conversation_id: string | null
        latest_conversation_at: string | null
      }>(
        `SELECT p.id, p.name, p.status, p.is_pinned, p.created_at, p.updated_at,
                lc.id as latest_conversation_id, lc.updated_at as latest_conversation_at
         FROM projects p
         LEFT JOIN LATERAL (
           SELECT id, updated_at FROM conversations
           WHERE project_id = p.id
             AND jsonb_array_length(COALESCE(messages::jsonb, '[]'::jsonb)) > 0
           ORDER BY updated_at DESC LIMIT 1
         ) lc ON true
         WHERE p.user_id = $1
         ORDER BY COALESCE(lc.updated_at, p.updated_at) DESC
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
          query<{ project_id: string; count: string }>(
            `SELECT project_id, COUNT(*) as count FROM conversations WHERE project_id = ANY($1) GROUP BY project_id`,
            [projectIds]
          )
        ])

        convCount = parseInt(convCountResult?.count || '0', 10)
        deployCount = parseInt(deployCountResult?.count || '0', 10)

        convCountsResult.rows.forEach(c => {
          convCountMap.set(c.project_id, parseInt(c.count, 10))
        })
      }

      const plan = user ? resolveEffectivePlan(user) : 'free'
      const stats = {
        totalProjects: projectCount,
        totalConversations: convCount,
        totalDeployments: deployCount,
        creditUsage: {
          used: user.credits_used_this_period || 0,
          limit: getCreditLimit(plan),
          plan,
          isFairUse: isFairUsePlan(plan),
        }
      }

      const recentProjects = projects.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        isPinned: p.is_pinned,
        conversationCount: convCountMap.get(p.id) || 0,
        latestConversationId: p.latest_conversation_id,
        updatedAt: p.updated_at
      }))

      return { stats, recentProjects }
    })

    if (!data) {
      return res.status(404).json({ error: '用戶不存在' })
    }

    res.json(data)
  } catch (error) {
    logger.error({ err: error }, '獲取統計失敗')
    res.status(500).json({ error: '獲取統計數據失敗' })
  }
})

/**
 * GET /api/dashboard/admin/stats
 * 管理員統計數據
 */
router.get('/admin/stats', requireAdmin, async (req, res) => {
  try {
    const stats = await cached('cache:admin:stats', 300, async () => {
      const [
        usersCount,
        projectsCount,
        conversationsCount,
        deploymentsCount,
        newUsers7d,
        llmCost,
        activeUsers7d,
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
        ),
        queryOne<{ count: string }>(
          `SELECT COUNT(DISTINCT p.user_id) as count
           FROM conversations c
           JOIN projects p ON c.project_id = p.id
           WHERE c.updated_at >= NOW() - INTERVAL '7 days'`
        ),
      ])

      return {
        totalUsers: parseInt(usersCount?.count || '0', 10),
        totalProjects: parseInt(projectsCount?.count || '0', 10),
        totalConversations: parseInt(conversationsCount?.count || '0', 10),
        totalDeployments: parseInt(deploymentsCount?.count || '0', 10),
        activeUsers7d: parseInt(activeUsers7d?.count || '0', 10),
        newUsers7d: parseInt(newUsers7d?.count || '0', 10),
        totalLLMCost: parseFloat(llmCost?.total || '0'),
      }
    })

    res.json(stats)
  } catch (error) {
    logger.error({ err: error }, '獲取管理員統計失敗')
    res.status(500).json({ error: '獲取統計數據失敗' })
  }
})

/**
 * GET /api/dashboard/admin/usage
 * LLM 用量統計
 */
router.get('/admin/usage', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query as {
      startDate?: string
      endDate?: string
      groupBy?: string
    }

    // 預設查詢最近 30 天
    const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const start = startDate || defaultStartDate
    const end = endDate ? `${endDate}T23:59:59.999Z` : new Date().toISOString()

    const cacheKey = `cache:admin:usage:${groupBy}:${start.slice(0, 10)}:${end.slice(0, 10)}`

    const data = await cached(cacheKey, 60, async () => {
      // 根據 groupBy 構建 SQL breakdown 查詢
      let breakdownSql: string
      const isConversation = groupBy === 'conversation'

      switch (groupBy) {
        case 'week':
          breakdownSql = `SELECT
            DATE_TRUNC('week', created_at)::date::text AS key,
            COALESCE(SUM(input_tokens), 0)::int AS input_tokens,
            COALESCE(SUM(output_tokens), 0)::int AS output_tokens,
            COALESCE(SUM(cost_usd), 0) AS cost,
            COUNT(*)::int AS count
          FROM llm_usage
          WHERE created_at >= $1 AND created_at <= $2
          GROUP BY DATE_TRUNC('week', created_at)
          ORDER BY key ASC`
          break
        case 'month':
          breakdownSql = `SELECT
            TO_CHAR(created_at, 'YYYY-MM') AS key,
            COALESCE(SUM(input_tokens), 0)::int AS input_tokens,
            COALESCE(SUM(output_tokens), 0)::int AS output_tokens,
            COALESCE(SUM(cost_usd), 0) AS cost,
            COUNT(*)::int AS count
          FROM llm_usage
          WHERE created_at >= $1 AND created_at <= $2
          GROUP BY TO_CHAR(created_at, 'YYYY-MM')
          ORDER BY key ASC`
          break
        case 'model':
          breakdownSql = `SELECT
            model AS key,
            COALESCE(SUM(input_tokens), 0)::int AS input_tokens,
            COALESCE(SUM(output_tokens), 0)::int AS output_tokens,
            COALESCE(SUM(cost_usd), 0) AS cost,
            COUNT(*)::int AS count
          FROM llm_usage
          WHERE created_at >= $1 AND created_at <= $2
          GROUP BY model
          ORDER BY count DESC`
          break
        case 'conversation':
          breakdownSql = `SELECT
            COALESCE(l.conversation_id::text, '(無對話)') AS key,
            COALESCE(SUM(l.input_tokens), 0)::int AS input_tokens,
            COALESCE(SUM(l.output_tokens), 0)::int AS output_tokens,
            COALESCE(SUM(l.cost_usd), 0) AS cost,
            COUNT(*)::int AS count,
            COALESCE(u.name, u.email) AS user_name,
            l.user_id,
            MAX(l.created_at) AS latest_at
          FROM llm_usage l
          LEFT JOIN users u ON l.user_id = u.id
          WHERE l.created_at >= $1 AND l.created_at <= $2
          GROUP BY l.conversation_id, l.user_id, u.name, u.email
          ORDER BY latest_at DESC
          LIMIT 200`
          break
        default: // 'day'
          breakdownSql = `SELECT
            DATE(created_at)::text AS key,
            COALESCE(SUM(input_tokens), 0)::int AS input_tokens,
            COALESCE(SUM(output_tokens), 0)::int AS output_tokens,
            COALESCE(SUM(cost_usd), 0) AS cost,
            COUNT(*)::int AS count
          FROM llm_usage
          WHERE created_at >= $1 AND created_at <= $2
          GROUP BY DATE(created_at)
          ORDER BY key ASC`
      }

      const [totalsResult, breakdownResult] = await Promise.all([
        queryOne<{
          total_input_tokens: string
          total_output_tokens: string
          total_cost: string
        }>(
          `SELECT
            COALESCE(SUM(input_tokens), 0) AS total_input_tokens,
            COALESCE(SUM(output_tokens), 0) AS total_output_tokens,
            COALESCE(SUM(cost_usd), 0) AS total_cost
          FROM llm_usage
          WHERE created_at >= $1 AND created_at <= $2`,
          [start, end]
        ),
        query<{
          key: string
          input_tokens: number
          output_tokens: number
          cost: string
          count: number
          user_name?: string | null
          user_id?: string | null
          latest_at?: string | null
        }>(breakdownSql, [start, end]),
      ])

      const breakdown = breakdownResult.rows.map(row => {
        const entry: Record<string, unknown> = {
          key: row.key,
          inputTokens: row.input_tokens,
          outputTokens: row.output_tokens,
          cost: parseFloat(row.cost as string) || 0,
          count: row.count,
        }
        if (isConversation) {
          entry.userName = row.user_name || undefined
          entry.userId = row.user_id || undefined
          entry.latestAt = row.latest_at ? new Date(row.latest_at as string).toISOString() : undefined
        }
        return entry
      })

      return {
        totalInputTokens: parseInt(totalsResult?.total_input_tokens || '0', 10),
        totalOutputTokens: parseInt(totalsResult?.total_output_tokens || '0', 10),
        totalCost: parseFloat(totalsResult?.total_cost || '0'),
        breakdown,
      }
    })

    res.json(data)
  } catch (error) {
    logger.error({ err: error }, '獲取 LLM 用量失敗')
    res.status(500).json({ error: '獲取用量數據失敗' })
  }
})

/**
 * GET /api/dashboard/admin/users
 * 獲取所有用戶列表（管理員專用）
 */
router.get('/admin/users', requireAdmin, async (req, res) => {
  try {
    const { page = '1', pageSize = '20', sortBy = 'created_at', sortOrder = 'desc', search, provider } = req.query as {
      page?: string
      pageSize?: string
      sortBy?: string
      sortOrder?: string
      search?: string
      provider?: string
    }

    const pageNum = parseInt(page, 10)
    const limit = parseInt(pageSize, 10)
    const offset = (pageNum - 1) * limit

    // 允許的排序欄位
    const allowedSortFields: Record<string, string> = {
      email: 'email',
      plan: 'plan',
      created_at: 'created_at',
      createdAt: 'created_at',
      projectCount: 'project_count',
    }

    const sortField = allowedSortFields[sortBy] || 'created_at'
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC'

    // 構建 WHERE 條件
    const conditions: string[] = []
    const params: (string | number)[] = []
    let paramIndex = 1

    if (search) {
      conditions.push(`(u.email ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex})`)
      params.push(`%${search}%`)
      paramIndex++
    }

    if (provider === 'oauth') {
      conditions.push('u.provider IS NOT NULL')
    } else if (provider === 'guest') {
      conditions.push('u.provider IS NULL')
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

    const cacheKey = `cache:admin:users:${pageNum}:${limit}:${sortField}:${order}:${search || ''}:${provider || ''}`

    const data = await cached(cacheKey, 60, async () => {
      // 並行查詢總數 + 用戶列表
      const [countResult, usersResult] = await Promise.all([
        queryOne<{ count: string }>(
          `SELECT COUNT(*) as count FROM users u ${whereClause}`,
          params
        ),
        query<{
          id: string
          email: string
          name: string | null
          plan: string
          subscription_status: string
          is_admin: boolean
          credits_used_this_period: number
          created_at: string
          project_count: string
          provider: string | null
          linked_providers: string | null
        }>(
          `SELECT
            u.id, u.email, u.name, u.plan, u.subscription_status, u.is_admin,
            u.credits_used_this_period, u.created_at, u.provider,
            COUNT(DISTINCT p.id) as project_count,
            string_agg(DISTINCT up.provider, ',') as linked_providers
           FROM users u
           LEFT JOIN projects p ON p.user_id = u.id
           LEFT JOIN user_providers up ON up.user_id = u.id
           ${whereClause}
           GROUP BY u.id
           ORDER BY ${sortField === 'project_count' ? 'project_count' : `u.${sortField}`} ${order}
           LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
          [...params, limit, offset]
        ),
      ])

      const total = parseInt(countResult?.count || '0', 10)
      const items = usersResult.rows.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        plan: u.plan,
        subscriptionStatus: u.subscription_status,
        isAdmin: u.is_admin,
        projectCount: parseInt(u.project_count, 10),
        creditsUsed: u.credits_used_this_period,
        createdAt: u.created_at,
        provider: u.provider || null,
        providers: u.linked_providers ? u.linked_providers.split(',') : (u.provider ? [u.provider] : []),
      }))

      return { items, total, page: pageNum, pageSize: limit }
    })

    res.json(data)
  } catch (error) {
    logger.error({ err: error }, '獲取用戶列表失敗')
    res.status(500).json({ error: '獲取用戶列表失敗' })
  }
})

/**
 * GET /api/dashboard/admin/users/:userId
 * 獲取單一用戶詳情
 */
router.get('/admin/users/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params

    // 獲取用戶基本資料（需先確認存在才繼續）
    const user = await queryOne<{
      id: string
      email: string
      name: string | null
      plan: string
      subscription_status: string
      is_admin: boolean
      credits_used_this_period: number
      created_at: string
    }>(
      'SELECT id, email, name, plan, subscription_status, is_admin, credits_used_this_period, created_at FROM users WHERE id = $1',
      [userId]
    )

    if (!user) {
      return res.status(404).json({ error: '用戶不存在' })
    }

    const data = await cached(`cache:admin:user:${userId}`, 120, async () => {
      // 並行查詢專案、對話、統計
      const [projectsResult, conversationsResult, statsResult] = await Promise.all([
        query<{
          id: string
          name: string
          status: string
          created_at: string
        }>(
          'SELECT id, name, status, created_at FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
          [userId]
        ),
        query<{
          id: string
          project_name: string
          message_count: string
          updated_at: string
        }>(
          `SELECT c.id, p.name as project_name, jsonb_array_length(c.messages) as message_count, c.updated_at
           FROM conversations c
           JOIN projects p ON c.project_id = p.id
           WHERE p.user_id = $1
           ORDER BY c.updated_at DESC
           LIMIT 20`,
          [userId]
        ),
        queryOne<{
          project_count: string
          conv_count: string
          deploy_count: string
          llm_cost: string
        }>(
          `SELECT
            (SELECT COUNT(*) FROM projects WHERE user_id = $1) AS project_count,
            (SELECT COUNT(*) FROM conversations c JOIN projects p ON c.project_id = p.id WHERE p.user_id = $1) AS conv_count,
            (SELECT COUNT(*) FROM deployments d JOIN projects p ON d.project_id = p.id WHERE p.user_id = $1 AND d.status = 'success') AS deploy_count,
            (SELECT COALESCE(SUM(cost_usd), 0) FROM llm_usage WHERE user_id = $1) AS llm_cost`,
          [userId]
        ),
      ])

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
          subscriptionStatus: user.subscription_status,
          isAdmin: user.is_admin,
          creditsUsed: user.credits_used_this_period,
          createdAt: user.created_at
        },
        projects: projectsResult.rows.map(p => ({
          id: p.id,
          name: p.name,
          status: p.status,
          createdAt: p.created_at
        })),
        recentConversations: conversationsResult.rows.map(c => ({
          id: c.id,
          projectName: c.project_name,
          messageCount: parseInt(c.message_count, 10),
          updatedAt: c.updated_at
        })),
        stats: {
          totalProjects: parseInt(statsResult?.project_count || '0', 10),
          totalConversations: parseInt(statsResult?.conv_count || '0', 10),
          totalDeployments: parseInt(statsResult?.deploy_count || '0', 10),
          totalLLMCost: parseFloat(statsResult?.llm_cost || '0')
        }
      }
    })

    res.json(data)
  } catch (error) {
    logger.error({ err: error }, '獲取用戶詳情失敗')
    res.status(500).json({ error: '獲取用戶詳情失敗' })
  }
})

/**
 * GET /api/dashboard/admin/projects
 * 獲取所有專案列表（管理員專用）
 */
router.get('/admin/projects', requireAdmin, async (req, res) => {
  try {
    const { page = '1', pageSize = '20', sortBy = 'created_at', sortOrder = 'desc', search, status, userId } = req.query as {
      page?: string
      pageSize?: string
      sortBy?: string
      sortOrder?: string
      search?: string
      status?: string
      userId?: string
    }

    const pageNum = parseInt(page, 10)
    const limit = parseInt(pageSize, 10)
    const offset = (pageNum - 1) * limit

    // 允許的排序欄位
    const allowedSortFields: Record<string, string> = {
      name: 'name',
      status: 'status',
      created_at: 'created_at',
      createdAt: 'created_at',
      updated_at: 'updated_at',
      updatedAt: 'updated_at',
    }

    const sortField = allowedSortFields[sortBy] || 'created_at'
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC'

    // 構建 WHERE 條件
    const conditions: string[] = []
    const params: (string | number)[] = []
    let paramIndex = 1

    if (status) {
      conditions.push(`p.status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    if (userId) {
      conditions.push(`p.user_id = $${paramIndex}`)
      params.push(userId)
      paramIndex++
    }

    if (search) {
      conditions.push(`p.name ILIKE $${paramIndex}`)
      params.push(`%${search}%`)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

    const cacheKey = `cache:admin:projects:${pageNum}:${limit}:${sortField}:${order}:${search || ''}:${status || ''}:${userId || ''}`

    const data = await cached(cacheKey, 60, async () => {
      // 並行查詢總數 + 專案列表
      const [countResult, projectsResult] = await Promise.all([
        queryOne<{ count: string }>(
          `SELECT COUNT(*) as count FROM projects p ${whereClause}`,
          params
        ),
        query<{
          id: string
          name: string
          status: string
          user_id: string
          user_email: string
          vercel_url: string | null
          created_at: string
          updated_at: string
          conversation_count: string
        }>(
          `SELECT
            p.id, p.name, p.status, p.user_id, u.email as user_email,
            p.vercel_url, p.created_at, p.updated_at,
            COUNT(c.id) as conversation_count
           FROM projects p
           LEFT JOIN users u ON p.user_id = u.id
           LEFT JOIN conversations c ON c.project_id = p.id
           ${whereClause}
           GROUP BY p.id, u.email
           ORDER BY p.${sortField} ${order}
           LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
          // Note: sortField comes from allowedSortFields whitelist, order from ternary - no SQL injection
          [...params, limit, offset]
        ),
      ])

      const total = parseInt(countResult?.count || '0', 10)
      const items = projectsResult.rows.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        userId: p.user_id,
        userEmail: p.user_email || '',
        conversationCount: parseInt(p.conversation_count, 10),
        vercelUrl: p.vercel_url,
        createdAt: p.created_at,
        updatedAt: p.updated_at
      }))

      return { items, total, page: pageNum, pageSize: limit, totalPages: Math.ceil(total / limit) }
    })

    res.json(data)
  } catch (error) {
    logger.error({ err: error }, '獲取專案列表失敗')
    res.status(500).json({ error: '獲取專案列表失敗' })
  }
})

/**
 * GET /api/dashboard/admin/conversations
 * 獲取所有對話列表（管理員專用）
 */
router.get('/admin/conversations', requireAdmin, async (req, res) => {
  try {
    const { page = '1', pageSize = '20', sortBy = 'updated_at', sortOrder = 'desc', projectId } = req.query as {
      page?: string
      pageSize?: string
      sortBy?: string
      sortOrder?: string
      projectId?: string
    }

    const pageNum = parseInt(page, 10)
    const limit = parseInt(pageSize, 10)
    const offset = (pageNum - 1) * limit

    // 允許的排序欄位
    const allowedSortFields: Record<string, string> = {
      created_at: 'created_at',
      createdAt: 'created_at',
      updated_at: 'updated_at',
      updatedAt: 'updated_at',
    }

    const sortField = allowedSortFields[sortBy] || 'updated_at'
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC'

    // 構建 WHERE 條件
    const conditions: string[] = []
    const params: (string | number)[] = []
    let paramIndex = 1

    if (projectId) {
      conditions.push(`c.project_id = $${paramIndex}`)
      params.push(projectId)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

    const cacheKey = `cache:admin:conversations:${pageNum}:${limit}:${sortField}:${order}:${projectId || ''}`

    const data = await cached(cacheKey, 60, async () => {
      // 並行查詢總數 + 對話列表
      const [countResult, conversationsResult] = await Promise.all([
        queryOne<{ count: string }>(
          `SELECT COUNT(*) as count FROM conversations c ${whereClause}`,
          params
        ),
        query<{
          id: string
          project_id: string
          project_name: string
          user_id: string
          user_email: string
          message_count: string
          spec_complete: boolean
          created_at: string
          updated_at: string
        }>(
          `SELECT
            c.id, c.project_id, p.name as project_name,
            p.user_id, u.email as user_email,
            jsonb_array_length(c.messages) as message_count, c.spec_complete, c.created_at, c.updated_at
           FROM conversations c
           JOIN projects p ON c.project_id = p.id
           LEFT JOIN users u ON p.user_id = u.id
           ${whereClause}
           ORDER BY c.${sortField} ${order}
           LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
          // Note: sortField from allowedSortFields whitelist, order from ternary - no SQL injection
          [...params, limit, offset]
        ),
      ])

      const total = parseInt(countResult?.count || '0', 10)
      const items = conversationsResult.rows.map(conv => ({
        id: conv.id,
        projectId: conv.project_id,
        projectName: conv.project_name || '',
        userId: conv.user_id || '',
        userEmail: conv.user_email || '',
        messageCount: parseInt(conv.message_count, 10),
        specComplete: conv.spec_complete,
        createdAt: conv.created_at,
        updatedAt: conv.updated_at
      }))

      return { items, total, page: pageNum, pageSize: limit, totalPages: Math.ceil(total / limit) }
    })

    res.json(data)
  } catch (error) {
    logger.error({ err: error }, '獲取對話列表失敗')
    res.status(500).json({ error: '獲取對話列表失敗' })
  }
})

/**
 * POST /api/dashboard/admin/users/:userId/admin
 * 設置用戶管理員狀態
 */
router.post('/admin/users/:userId/admin', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params
    const { isAdmin } = req.body as { isAdmin: boolean }

    // 不能修改自己的管理員狀態
    if (userId === req.user!.id) {
      return res.status(400).json({ error: '不能修改自己的管理員狀態' })
    }

    await query(
      'UPDATE users SET is_admin = $1 WHERE id = $2',
      [isAdmin, userId]
    )

    // 清除該用戶的快取
    await invalidateCache(`cache:admin:user:${userId}`)

    res.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, '設置管理員狀態失敗')
    res.status(500).json({ error: '設置管理員狀態失敗' })
  }
})

/**
 * GET /api/dashboard/admin/conversations/:conversationId/messages
 * 管理員查看任意對話的訊息（唯讀）
 */
router.get('/admin/conversations/:conversationId/messages', requireAdmin, async (req, res) => {
  try {
    const { conversationId } = req.params
    const { lastUpdatedAt } = req.query as { lastUpdatedAt?: string }

    // 查詢對話 + 關聯的專案和用戶資訊
    const conversation = await queryOne<{
      id: string
      messages: unknown[]
      updated_at: string
      project_id: string
      spec_complete: boolean
    }>(
      'SELECT id, messages, updated_at, project_id, spec_complete FROM conversations WHERE id = $1',
      [conversationId]
    )

    if (!conversation) {
      return res.status(404).json({ error: '對話不存在' })
    }

    // 讀取 streaming preview（如果有的話）
    let streamingPreview = null
    if (redisClient) {
      try {
        const previewJson = await redisClient.get(`streaming:preview:${conversationId}`)
        if (previewJson) {
          streamingPreview = JSON.parse(previewJson)
        }
      } catch {
        // Redis 讀取失敗不阻塞
      }
    }

    // 輕量檢查：比較 updated_at
    if (lastUpdatedAt && conversation.updated_at === lastUpdatedAt && !streamingPreview) {
      return res.json({
        messages: [],
        updatedAt: conversation.updated_at,
        hasChanges: false,
      })
    }

    // 查詢專案 + 用戶資訊
    const projectInfo = await queryOne<{
      name: string
      status: string
      user_id: string
    }>(
      'SELECT name, status, user_id FROM projects WHERE id = $1',
      [conversation.project_id]
    )

    let userInfo: { email: string; name: string | null } = { email: '', name: null }
    if (projectInfo) {
      const user = await queryOne<{ email: string; name: string | null }>(
        'SELECT email, name FROM users WHERE id = $1',
        [projectInfo.user_id]
      )
      if (user) {
        userInfo = user
      }
    }

    // 查詢當前活躍的 task
    const activeTask = await queryOne<{ id: string; status: string }>(
      `SELECT id, status FROM tasks
       WHERE project_id = $1
       AND status IN ('planning', 'executing', 'pending_approval', 'waiting_approval')
       ORDER BY created_at DESC LIMIT 1`,
      [conversation.project_id]
    )

    // 如果沒有活躍 task，檢查 bdd_sessions
    let activeSessionId: string | undefined
    if (!activeTask) {
      const bddSession = await queryOne<{ id: string }>(
        `SELECT id FROM bdd_sessions
         WHERE conversation_id = $1 AND current_phase != 'completed'
         ORDER BY created_at DESC LIMIT 1`,
        [conversationId]
      )
      if (bddSession) {
        activeSessionId = bddSession.id
      }
    }

    res.json({
      messages: conversation.messages,
      updatedAt: conversation.updated_at,
      hasChanges: true,
      currentTaskId: activeTask?.id || activeSessionId,
      streamingPreview,
      user: userInfo,
      project: {
        name: projectInfo?.name || '',
        status: projectInfo?.status || '',
      },
    })
  } catch (error) {
    logger.error({ err: error }, '獲取對話訊息失敗')
    res.status(500).json({ error: '獲取對話訊息失敗' })
  }
})

// ============================================================
// Admin 日誌監控
// ============================================================

const LOG_FILES = {
  out: '/var/log/tellcraft/out.log',
  error: '/var/log/tellcraft/error.log',
  workerOut: '/var/log/tellcraft/worker-out.log',
  workerError: '/var/log/tellcraft/worker-error.log',
}

function resolveLogFiles(source?: string): string[] {
  if (!source || source === 'all') {
    return [LOG_FILES.out, LOG_FILES.error, LOG_FILES.workerOut, LOG_FILES.workerError]
  }
  if (source === 'out') return [LOG_FILES.out, LOG_FILES.workerOut]
  if (source === 'error') return [LOG_FILES.error, LOG_FILES.workerError]
  return [LOG_FILES.out, LOG_FILES.error, LOG_FILES.workerOut, LOG_FILES.workerError]
}

/**
 * GET /admin/logs
 * 獲取最近 N 行 VPS 日誌
 * Query: ?lines=200&source=all|out|error&search=keyword&since=2026-03-06+12:00:00
 */
router.get('/admin/logs', requireAdmin, async (req: Request, res: Response) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
    res.setHeader('Surrogate-Control', 'no-store')

    const lines = Math.min(parseInt(req.query.lines as string) || 200, 1000)
    const source = (req.query.source as string) || 'all'
    const search = (req.query.search as string) || ''
    const since = (req.query.since as string) || ''

    const filesToRead = resolveLogFiles(source)

    const allLines: ParsedLogLine[] = []

    for (const file of filesToRead) {
      try {
        const result = execSync(
          `tail -n ${lines} "${file}"`,
          { encoding: 'utf-8', timeout: 5000 }
        )
        const fileSource = file.includes('error') ? 'error' as const : 'out' as const
        const parsed = result.split('\n')
          .filter(Boolean)
          .map(line => parseLogLine(line, fileSource))
        allLines.push(...parsed)
      } catch {
        // 檔案不存在或無權限，跳過
      }
    }

    // 按時間排序
    allLines.sort((a, b) => a.timestamp.localeCompare(b.timestamp))

    // 過濾噪音日誌（Socket 連接/斷開等）
    const meaningful = allLines.filter(l => !isNoiseLine(l))

    // since 過濾（只返回時間戳 > since 的行）
    const afterSince = since
      ? meaningful.filter(l => l.timestamp > since)
      : meaningful

    // 搜尋過濾
    const filtered = search
      ? afterSince.filter(l =>
          l.message.toLowerCase().includes(search.toLowerCase()) ||
          (l.tag?.toLowerCase().includes(search.toLowerCase()) ?? false)
        )
      : afterSince

    // 敏感資訊遮罩
    const sanitized = filtered.map(sanitizeLogLine)

    res.json({ lines: sanitized, total: sanitized.length })
  } catch (error) {
    logger.error({ err: error }, '獲取日誌失敗')
    res.status(500).json({ error: '獲取日誌失敗' })
  }
})

/**
 * DELETE /admin/logs
 * 清空 PM2 日誌檔（保留檔案本身，僅 truncate 內容）
 * Query: ?source=all|out|error
 */
router.delete('/admin/logs', requireAdmin, async (req: Request, res: Response) => {
  try {
    const source = (req.query.source as string) || 'all'
    const filesToClear = resolveLogFiles(source)
    let clearedCount = 0

    for (const file of filesToClear) {
      try {
        truncateSync(file, 0)
        clearedCount += 1
      } catch (error) {
        const err = error as NodeJS.ErrnoException
        if (err.code === 'ENOENT') {
          continue
        }
        throw error
      }
    }

    res.json({
      success: true,
      clearedCount,
      files: filesToClear,
    })
  } catch (error) {
    logger.error({ err: error }, '清空日誌失敗')
    res.status(500).json({ error: '清空日誌失敗' })
  }
})

// ============================================================
// Job Failures（BullMQ 最終失敗記錄）
// ============================================================

router.get('/job-failures', requireAdmin, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit) || '50', 10), 200)
    const offset = parseInt(String(req.query.offset) || '0', 10)

    const rows = await query(
      `SELECT id, job_id, job_name, conversation_id, user_id, error, resolved_at, created_at
       FROM job_failures
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    )

    const countResult = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM job_failures WHERE resolved_at IS NULL'
    )

    res.json({
      failures: rows.rows,
      unresolvedCount: parseInt(countResult?.count || '0', 10),
    })
  } catch (error) {
    logger.error({ err: error }, '獲取 job failures 失敗')
    res.status(500).json({ error: '獲取 job failures 失敗' })
  }
})

/**
 * POST /admin/regenerate-thumbnails
 * 手動觸發 seed 模板縮圖重新生成（fire-and-forget）
 */
router.post('/admin/regenerate-thumbnails', requireAdmin, async (req: Request, res: Response) => {
  // Clear existing thumbnails so they will be regenerated (old ones may have broken CJK rendering)
  await query(
    `UPDATE templates SET thumbnail_url = NULL WHERE is_active = true AND source_project_id IS NULL`,
    []
  )
  const rows = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM templates WHERE thumbnail_url IS NULL AND is_active = true AND source_project_id IS NULL`,
    []
  )
  const pending = parseInt(rows.rows[0]?.count || '0', 10)
  // fire-and-forget
  generateThumbnailsForSeedTemplates().catch(err => logger.error({ err }, '手動觸發縮圖生成失敗'))
  res.json({ success: true, message: `已清除舊縮圖並觸發重新生成，待處理：${pending} 筆` })
})

export default router
