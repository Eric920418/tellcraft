'use server'

import { supabase } from '../lib/supabase'
import { createClient } from '../lib/supabase/server'

// ============================================================
// 類型定義
// ============================================================

interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
}

interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ============================================================
// 權限檢查 Helper
// ============================================================

/**
 * 檢查當前用戶是否為管理員
 * 如果不是管理員，拋出錯誤
 */
async function requireAdmin(): Promise<{ userId: string; email: string }> {
  const authClient = await createClient()
  const { data: { user: authUser } } = await authClient.auth.getUser()

  if (!authUser) {
    throw new Error('未登入')
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('is_admin, email')
    .eq('id', authUser.id)
    .single()

  if (error || !user) {
    throw new Error('用戶不存在')
  }

  if (!user.is_admin) {
    throw new Error('無管理員權限')
  }

  return { userId: authUser.id, email: user.email }
}

// ============================================================
// 管理員 Actions
// ============================================================

/**
 * 取得管理員總覽統計
 */
export async function getAdminStats(): Promise<ActionResult<{
  totalUsers: number
  totalProjects: number
  totalConversations: number
  totalDeployments: number
  activeUsers7d: number
  newUsers7d: number
  totalLLMCost: number
}>> {
  try {
    await requireAdmin()

    // 並行查詢所有統計數據（使用 select('id') 而非 select('*') 減少流量）
    const [
      usersCount,
      projectsCount,
      conversationsCount,
      deploymentsCount,
      // 7 天內活躍用戶（有消息的）
      activeUsers7d,
      // 7 天內新用戶
      newUsers7d,
      // 總 LLM 成本（使用 RPC 聚合或限制查詢）
      llmCost
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('projects').select('id', { count: 'exact', head: true }),
      supabase.from('conversations').select('id', { count: 'exact', head: true }),
      supabase.from('deployments').select('id', { count: 'exact', head: true }).eq('status', 'success'),
      supabase
        .from('conversations')
        .select('project_id')
        .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .then(async (res) => {
          if (!res.data) return 0
          const projectIds = [...new Set(res.data.map(c => c.project_id))]
          if (projectIds.length === 0) return 0
          const { data: projects } = await supabase
            .from('projects')
            .select('user_id')
            .in('id', projectIds)
          return new Set(projects?.map(p => p.user_id) || []).size
        }),
      supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      // 使用 Supabase 聚合查詢（只取前 1000 筆做估算，避免全表掃描）
      supabase
        .from('llm_usage')
        .select('cost_usd')
        .order('created_at', { ascending: false })
        .limit(1000)
        .then(res => {
          if (!res.data) return 0
          return res.data.reduce((sum, row) => sum + (parseFloat(row.cost_usd) || 0), 0)
        })
    ])

    return {
      success: true,
      data: {
        totalUsers: usersCount.count || 0,
        totalProjects: projectsCount.count || 0,
        totalConversations: conversationsCount.count || 0,
        totalDeployments: deploymentsCount.count || 0,
        activeUsers7d: activeUsers7d as number,
        newUsers7d: newUsers7d.count || 0,
        totalLLMCost: llmCost as number
      }
    }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

/**
 * 列出所有用戶（分頁、搜尋、排序）
 */
export async function listAllUsers(params: PaginationParams = {}): Promise<ActionResult<PaginatedResult<{
  id: string
  email: string
  name: string | null
  plan: string
  subscriptionStatus: string
  isAdmin: boolean
  projectCount: number
  messageCount: number
  createdAt: string
}>>> {
  try {
    await requireAdmin()

    const { page = 1, pageSize = 20, sortBy = 'created_at', sortOrder = 'desc', search } = params

    let query = supabase
      .from('users')
      .select('id, email, name, plan, subscription_status, is_admin, message_count_this_period, created_at', { count: 'exact' })

    // 搜尋
    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`)
    }

    // 排序
    const sortColumn = sortBy === 'createdAt' ? 'created_at' : sortBy
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' })

    // 分頁
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data: users, error, count } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    // 一次查詢所有用戶的專案（避免 N+1 問題）
    const userIds = users?.map(u => u.id) || []
    const projectCountMap = new Map<string, number>()

    if (userIds.length > 0) {
      // 單一查詢取得所有用戶的專案 user_id，在記憶體中計數
      const { data: projects } = await supabase
        .from('projects')
        .select('user_id')
        .in('user_id', userIds)

      // 在記憶體中計算每個用戶的專案數量
      projects?.forEach(p => {
        projectCountMap.set(p.user_id, (projectCountMap.get(p.user_id) || 0) + 1)
      })
    }

    const items = (users || []).map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      subscriptionStatus: user.subscription_status,
      isAdmin: user.is_admin,
      projectCount: projectCountMap.get(user.id) || 0,
      messageCount: user.message_count_this_period,
      createdAt: user.created_at
    }))

    return {
      success: true,
      data: {
        items,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

/**
 * 列出所有專案
 */
export async function listAllProjects(params: PaginationParams & {
  status?: string
  userId?: string
} = {}): Promise<ActionResult<PaginatedResult<{
  id: string
  name: string
  status: string
  userId: string
  userEmail: string
  conversationCount: number
  vercelUrl: string | null
  createdAt: string
  updatedAt: string
}>>> {
  try {
    await requireAdmin()

    const { page = 1, pageSize = 20, sortBy = 'created_at', sortOrder = 'desc', search, status, userId } = params

    let query = supabase
      .from('projects')
      .select('id, name, status, user_id, vercel_url, created_at, updated_at', { count: 'exact' })

    // 篩選
    if (status) {
      query = query.eq('status', status)
    }
    if (userId) {
      query = query.eq('user_id', userId)
    }
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    // 排序
    const sortColumn = sortBy === 'createdAt' ? 'created_at' : sortBy === 'updatedAt' ? 'updated_at' : sortBy
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' })

    // 分頁
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data: projects, error, count } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    // 查詢用戶 email 和對話數量
    const userIds = [...new Set(projects?.map(p => p.user_id) || [])]
    const projectIds = projects?.map(p => p.id) || []

    const [usersResult, convCounts] = await Promise.all([
      supabase.from('users').select('id, email').in('id', userIds),
      supabase.from('conversations').select('project_id').in('project_id', projectIds)
    ])

    const userEmailMap = new Map<string, string>()
    usersResult.data?.forEach(u => userEmailMap.set(u.id, u.email))

    const convCountMap = new Map<string, number>()
    convCounts.data?.forEach(c => {
      convCountMap.set(c.project_id, (convCountMap.get(c.project_id) || 0) + 1)
    })

    const items = (projects || []).map(project => ({
      id: project.id,
      name: project.name,
      status: project.status,
      userId: project.user_id,
      userEmail: userEmailMap.get(project.user_id) || '',
      conversationCount: convCountMap.get(project.id) || 0,
      vercelUrl: project.vercel_url,
      createdAt: project.created_at,
      updatedAt: project.updated_at
    }))

    return {
      success: true,
      data: {
        items,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

/**
 * 列出所有對話
 * 優化：使用 JOIN 減少 3 次查詢為 1 次
 */
export async function listAllConversations(params: PaginationParams & {
  userId?: string
  projectId?: string
} = {}): Promise<ActionResult<PaginatedResult<{
  id: string
  projectId: string
  projectName: string
  userId: string
  userEmail: string
  messageCount: number
  specComplete: boolean
  createdAt: string
  updatedAt: string
}>>> {
  try {
    await requireAdmin()

    const { page = 1, pageSize = 20, sortBy = 'updated_at', sortOrder = 'desc', projectId } = params

    // 使用 JOIN 一次查詢取得對話、專案和用戶資訊
    let query = supabase
      .from('conversations')
      .select(`
        id,
        project_id,
        messages,
        spec_complete,
        created_at,
        updated_at,
        projects(id, name, user_id, users(id, email))
      `, { count: 'exact' })

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    // 排序
    const sortColumn = sortBy === 'createdAt' ? 'created_at' : sortBy === 'updatedAt' ? 'updated_at' : sortBy
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' })

    // 分頁
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data: conversations, error, count } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    const items = (conversations || []).map(conv => {
      // Supabase JOIN 返回的是單一物件（因為是 1:1 關係）
      const project = conv.projects as unknown as { id: string; name: string; user_id: string; users: { id: string; email: string } | null } | null
      return {
        id: conv.id,
        projectId: conv.project_id,
        projectName: project?.name || '',
        userId: project?.user_id || '',
        userEmail: project?.users?.email || '',
        messageCount: (conv.messages || []).length,
        specComplete: conv.spec_complete,
        createdAt: conv.created_at,
        updatedAt: conv.updated_at
      }
    })

    return {
      success: true,
      data: {
        items,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

/**
 * 取得單一用戶詳情
 */
export async function getUserDetail(userId: string): Promise<ActionResult<{
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
}>> {
  try {
    await requireAdmin()

    // 查詢用戶
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name, plan, subscription_status, is_admin, message_count_this_period, created_at')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return { success: false, error: '用戶不存在' }
    }

    // 查詢專案
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // 查詢對話
    const projectIds = projects?.map(p => p.id) || []
    const { data: conversations } = projectIds.length > 0
      ? await supabase
          .from('conversations')
          .select('id, project_id, messages, updated_at')
          .in('project_id', projectIds)
          .order('updated_at', { ascending: false })
          .limit(5)
      : { data: [] }

    const projectNameMap = new Map(projects?.map(p => [p.id, p.name]) || [])

    // 統計（使用 select('id') 而非 select('*') 減少開銷）
    const [convCountResult, deployCountResult] = await Promise.all([
      projectIds.length > 0
        ? supabase
            .from('conversations')
            .select('id', { count: 'exact', head: true })
            .in('project_id', projectIds)
        : Promise.resolve({ count: 0 }),
      projectIds.length > 0
        ? supabase
            .from('deployments')
            .select('id', { count: 'exact', head: true })
            .in('project_id', projectIds)
            .eq('status', 'success')
        : Promise.resolve({ count: 0 })
    ])

    const convCount = convCountResult.count || 0
    const deployCount = deployCountResult.count || 0

    const { data: llmUsage } = await supabase
      .from('llm_usage')
      .select('cost_usd')
      .eq('user_id', userId)

    const totalLLMCost = llmUsage?.reduce((sum, row) => sum + (parseFloat(row.cost_usd) || 0), 0) || 0

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
          subscriptionStatus: user.subscription_status,
          isAdmin: user.is_admin,
          messageCount: user.message_count_this_period,
          createdAt: user.created_at
        },
        projects: (projects || []).map(p => ({
          id: p.id,
          name: p.name,
          status: p.status,
          createdAt: p.created_at
        })),
        recentConversations: (conversations || []).map(c => ({
          id: c.id,
          projectName: projectNameMap.get(c.project_id) || '',
          messageCount: (c.messages || []).length,
          updatedAt: c.updated_at
        })),
        stats: {
          totalProjects: projects?.length || 0,
          totalConversations: convCount || 0,
          totalDeployments: deployCount || 0,
          totalLLMCost
        }
      }
    }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

/**
 * 取得 LLM 用量統計
 */
export async function getLLMUsageStats(params: {
  startDate?: string
  endDate?: string
  userId?: string
  groupBy?: 'day' | 'week' | 'month' | 'model' | 'user'
} = {}): Promise<ActionResult<{
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
}>> {
  try {
    await requireAdmin()

    const { startDate, endDate, userId, groupBy = 'day' } = params

    // 管理員已驗證，使用 service role client 繞過 RLS 查詢所有數據
    // 預設只查詢最近 30 天，避免全表掃描
    const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    let query = supabase
      .from('llm_usage')
      .select('id, user_id, model, input_tokens, output_tokens, cost_usd, created_at')

    // 總是限制時間範圍
    query = query.gte('created_at', startDate || defaultStartDate)

    if (endDate) {
      // endDate 可能只有日期（如 2026-01-31），需要加上時間以包含當天所有記錄
      const endDateTime = endDate.includes('T') ? endDate : `${endDate}T23:59:59.999Z`
      query = query.lte('created_at', endDateTime)
    }
    if (userId) {
      query = query.eq('user_id', userId)
    }

    query = query.order('created_at', { ascending: true })

    const { data: usage, error } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    // 計算總計
    let totalInputTokens = 0
    let totalOutputTokens = 0
    let totalCost = 0

    const breakdownMap = new Map<string, {
      inputTokens: number
      outputTokens: number
      cost: number
      count: number
    }>()

    for (const row of usage || []) {
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
        case 'user':
          key = row.user_id
          break
        default:
          key = date.toISOString().split('T')[0]
      }

      const existing = breakdownMap.get(key) || { inputTokens: 0, outputTokens: 0, cost: 0, count: 0 }
      breakdownMap.set(key, {
        inputTokens: existing.inputTokens + (row.input_tokens || 0),
        outputTokens: existing.outputTokens + (row.output_tokens || 0),
        cost: existing.cost + (parseFloat(row.cost_usd) || 0),
        count: existing.count + 1
      })
    }

    const breakdown = Array.from(breakdownMap.entries()).map(([key, value]) => ({
      key,
      ...value
    }))

    return {
      success: true,
      data: {
        totalInputTokens,
        totalOutputTokens,
        totalCost,
        breakdown
      }
    }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

/**
 * 取得審計日誌
 */
export async function getAuditLogs(params: PaginationParams & {
  userId?: string
  action?: string
  entityType?: string
  startDate?: string
  endDate?: string
} = {}): Promise<ActionResult<PaginatedResult<{
  id: string
  userId: string | null
  userEmail: string | null
  action: string
  entityType: string | null
  entityId: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}>>> {
  try {
    await requireAdmin()

    const { page = 1, pageSize = 50, userId, action, entityType, startDate, endDate } = params

    // 管理員已驗證，使用 service role client 繞過 RLS 查詢所有數據
    let query = supabase
      .from('audit_logs')
      .select('id, user_id, action, entity_type, entity_id, metadata, created_at', { count: 'exact' })

    if (userId) {
      query = query.eq('user_id', userId)
    }
    if (action) {
      query = query.eq('action', action)
    }
    if (entityType) {
      query = query.eq('entity_type', entityType)
    }
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      // endDate 可能只有日期，需要加上時間以包含當天所有記錄
      const endDateTime = endDate.includes('T') ? endDate : `${endDate}T23:59:59.999Z`
      query = query.lte('created_at', endDateTime)
    }

    query = query.order('created_at', { ascending: false })

    // 分頁
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data: logs, error, count } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    // 查詢用戶 email
    const userIds = [...new Set((logs || []).map(l => l.user_id).filter(Boolean) as string[])]
    const { data: users } = userIds.length > 0
      ? await supabase.from('users').select('id, email').in('id', userIds)
      : { data: [] }

    const userEmailMap = new Map(users?.map(u => [u.id, u.email]) || [])

    const items = (logs || []).map(log => ({
      id: log.id,
      userId: log.user_id,
      userEmail: log.user_id ? userEmailMap.get(log.user_id) || null : null,
      action: log.action,
      entityType: log.entity_type,
      entityId: log.entity_id,
      metadata: log.metadata,
      createdAt: log.created_at
    }))

    return {
      success: true,
      data: {
        items,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

/**
 * 設定/取消用戶管理員權限
 */
export async function setUserAdmin(input: {
  userId: string
  isAdmin: boolean
}): Promise<ActionResult<{ userId: string; isAdmin: boolean }>> {
  try {
    const admin = await requireAdmin()
    const { userId, isAdmin } = input

    // 不能修改自己的權限
    if (userId === admin.userId) {
      return { success: false, error: '不能修改自己的管理員權限' }
    }

    const { error } = await supabase
      .from('users')
      .update({ is_admin: isAdmin })
      .eq('id', userId)

    if (error) {
      return { success: false, error: error.message }
    }

    // 記錄審計日誌
    await supabase.from('audit_logs').insert({
      user_id: admin.userId,
      action: isAdmin ? 'grant_admin' : 'revoke_admin',
      entity_type: 'user',
      entity_id: userId,
      metadata: { targetUserId: userId, isAdmin }
    })

    return {
      success: true,
      data: { userId, isAdmin }
    }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

/**
 * 記錄審計日誌（內部使用）
 */
export async function logAuditEvent(input: {
  userId?: string
  action: string
  entityType?: string
  entityId?: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  const { userId, action, entityType, entityId, metadata } = input

  try {
    await supabase.from('audit_logs').insert({
      user_id: userId || null,
      action,
      entity_type: entityType || null,
      entity_id: entityId || null,
      metadata: metadata || null
    })
  } catch (error) {
    // 審計日誌失敗不應阻塞主流程
    console.error('Failed to log audit event:', error)
  }
}
