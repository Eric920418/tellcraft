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
import { getCreditLimit, isFairUsePlan } from '../config/plans'
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

    // 查詢用戶信息
    const user = await queryOne<{
      plan: string
      credits_used_this_period: number
    }>(
      'SELECT plan, credits_used_this_period FROM users WHERE id = $1',
      [userId]
    )

    if (!user) {
      return res.status(404).json({ error: '用戶不存在' })
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
    }>(
      `SELECT p.id, p.name, p.status, p.is_pinned, p.created_at, p.updated_at,
              lc.id as latest_conversation_id
       FROM projects p
       LEFT JOIN LATERAL (
         SELECT id FROM conversations
         WHERE project_id = p.id
         ORDER BY updated_at DESC LIMIT 1
       ) lc ON true
       WHERE p.user_id = $1
       ORDER BY p.is_pinned DESC, p.pinned_at DESC NULLS LAST, p.updated_at DESC
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

    const plan = user.plan || 'free'
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

    res.json({ stats, recentProjects })
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

    const result = await query<{
      id: string
      user_id: string
      conversation_id: string
      model: string
      input_tokens: number
      output_tokens: number
      cost_usd: string
      created_at: string
      user_name: string | null
      user_email: string | null
    }>(
      `SELECT llm_usage.id, llm_usage.user_id, llm_usage.conversation_id, llm_usage.model,
              llm_usage.input_tokens, llm_usage.output_tokens, llm_usage.cost_usd, llm_usage.created_at,
              users.name AS user_name, users.email AS user_email
       FROM llm_usage
       LEFT JOIN users ON llm_usage.user_id = users.id
       WHERE llm_usage.created_at >= $1 AND llm_usage.created_at <= $2
       ORDER BY llm_usage.created_at ASC`,
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
      userName?: string
      userId?: string
      latestAt?: string
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
      const entry: typeof existing = {
        inputTokens: existing.inputTokens + (row.input_tokens || 0),
        outputTokens: existing.outputTokens + (row.output_tokens || 0),
        cost: existing.cost + (parseFloat(row.cost_usd) || 0),
        count: existing.count + 1,
      }
      // conversation 分組時記錄用戶資訊和最新活動時間
      if (groupBy === 'conversation') {
        if (!existing.userName) {
          entry.userName = row.user_name || row.user_email || undefined
          entry.userId = row.user_id || undefined
        }
        // 追蹤該分組的最新活動時間（SQL 已按 ASC，所以最後一條最新）
        // pg 驅動對 TIMESTAMPTZ 返回 Date 物件，用 new Date() 統一處理
        entry.latestAt = new Date(row.created_at).toISOString()
      }
      breakdownMap.set(key, entry)
    }

    let breakdown = Array.from(breakdownMap.entries()).map(([key, value]) => ({
      key,
      ...value
    }))

    // conversation 分組按最新活動時間降序排列（最近活動在前）
    if (groupBy === 'conversation') {
      breakdown = breakdown.sort((a, b) => {
        const timeA = new Date(a.latestAt || 0).getTime()
        const timeB = new Date(b.latestAt || 0).getTime()
        return timeB - timeA
      })
    }

    res.json({
      totalInputTokens,
      totalOutputTokens,
      totalCost,
      breakdown
    })
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
    const { page = '1', pageSize = '20', sortBy = 'created_at', sortOrder = 'desc', search } = req.query as {
      page?: string
      pageSize?: string
      sortBy?: string
      sortOrder?: string
      search?: string
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

    // 構建查詢
    let whereClause = ''
    const params: (string | number)[] = []

    if (search) {
      whereClause = 'WHERE (u.email ILIKE $1 OR u.name ILIKE $1)'
      params.push(`%${search}%`)
    }

    // 查詢總數
    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM users u ${whereClause}`,
      params
    )
    const total = parseInt(countResult?.count || '0', 10)

    // 查詢用戶列表（包含專案數量）
    const usersResult = await query<{
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
        (SELECT string_agg(up.provider, ',') FROM user_providers up WHERE up.user_id = u.id) as linked_providers
       FROM users u
       LEFT JOIN projects p ON p.user_id = u.id
       ${whereClause}
       GROUP BY u.id
       ORDER BY ${sortField === 'project_count' ? 'project_count' : `u.${sortField}`} ${order}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    )

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

    res.json({ items, total, page: pageNum, pageSize: limit })
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

    // 獲取用戶基本資料
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

    // 獲取專案列表
    const projectsResult = await query<{
      id: string
      name: string
      status: string
      created_at: string
    }>(
      'SELECT id, name, status, created_at FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    )

    // 獲取最近對話
    const conversationsResult = await query<{
      id: string
      project_name: string
      message_count: string
      updated_at: string
    }>(
      `SELECT c.id, p.name as project_name, jsonb_array_length(c.messages) as message_count, c.updated_at
       FROM conversations c
       JOIN projects p ON c.project_id = p.id
       WHERE p.user_id = $1
       ORDER BY c.updated_at DESC`,
      [userId]
    )

    // 獲取統計數據
    const [projectCount, convCount, deployCount, llmCost] = await Promise.all([
      queryOne<{ count: string }>('SELECT COUNT(*) as count FROM projects WHERE user_id = $1', [userId]),
      queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM conversations c JOIN projects p ON c.project_id = p.id WHERE p.user_id = $1',
        [userId]
      ),
      queryOne<{ count: string }>(
        `SELECT COUNT(*) as count FROM deployments d JOIN projects p ON d.project_id = p.id WHERE p.user_id = $1 AND d.status = 'success'`,
        [userId]
      ),
      queryOne<{ total: string }>(
        'SELECT COALESCE(SUM(cost_usd), 0) as total FROM llm_usage WHERE user_id = $1',
        [userId]
      ),
    ])

    res.json({
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
        totalProjects: parseInt(projectCount?.count || '0', 10),
        totalConversations: parseInt(convCount?.count || '0', 10),
        totalDeployments: parseInt(deployCount?.count || '0', 10),
        totalLLMCost: parseFloat(llmCost?.total || '0')
      }
    })
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

    // 查詢總數
    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM projects p ${whereClause}`,
      params
    )
    const total = parseInt(countResult?.count || '0', 10)

    // 查詢專案列表（包含用戶 email 和對話數量）
    const projectsResult = await query<{
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
    )

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

    res.json({ items, total, page: pageNum, pageSize: limit, totalPages: Math.ceil(total / limit) })
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

    // 查詢總數
    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM conversations c ${whereClause}`,
      params
    )
    const total = parseInt(countResult?.count || '0', 10)

    // 查詢對話列表（包含專案和用戶資訊）
    const conversationsResult = await query<{
      id: string
      project_id: string
      project_name: string
      user_id: string
      user_email: string
      messages: any[]
      spec_complete: boolean
      created_at: string
      updated_at: string
    }>(
      `SELECT
        c.id, c.project_id, p.name as project_name,
        p.user_id, u.email as user_email,
        c.messages, c.spec_complete, c.created_at, c.updated_at
       FROM conversations c
       JOIN projects p ON c.project_id = p.id
       LEFT JOIN users u ON p.user_id = u.id
       ${whereClause}
       ORDER BY c.${sortField} ${order}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      // Note: sortField from allowedSortFields whitelist, order from ternary - no SQL injection
      [...params, limit, offset]
    )

    const items = conversationsResult.rows.map(conv => ({
      id: conv.id,
      projectId: conv.project_id,
      projectName: conv.project_name || '',
      userId: conv.user_id || '',
      userEmail: conv.user_email || '',
      messageCount: (conv.messages || []).length,
      specComplete: conv.spec_complete,
      createdAt: conv.created_at,
      updatedAt: conv.updated_at
    }))

    res.json({ items, total, page: pageNum, pageSize: limit, totalPages: Math.ceil(total / limit) })
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
}

function resolveLogFiles(source?: string): string[] {
  if (!source || source === 'all') {
    return [LOG_FILES.out, LOG_FILES.error]
  }
  if (source === 'out') return [LOG_FILES.out]
  if (source === 'error') return [LOG_FILES.error]
  return [LOG_FILES.out, LOG_FILES.error]
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
  const rows = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM templates WHERE thumbnail_url IS NULL AND is_active = true AND vercel_url IS NULL`,
    []
  )
  const pending = parseInt(rows.rows[0]?.count || '0', 10)
  // fire-and-forget
  generateThumbnailsForSeedTemplates().catch(err => logger.error({ err }, '手動觸發縮圖生成失敗'))
  res.json({ success: true, message: `已觸發縮圖生成，待處理：${pending} 筆` })
})

export default router
