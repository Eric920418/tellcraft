'use server'

import { getAuthToken } from '../lib/auth'
import * as vpsApi from '../lib/vps-api'

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
// Token Helper
// ============================================================

async function requireToken(): Promise<string> {
  const token = await getAuthToken()
  if (!token) {
    throw new Error('未登入')
  }
  return token
}

// ============================================================
// 管理員 Actions（透過 VPS API）
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
    const token = await requireToken()
    const result = await vpsApi.getAdminStats({ token })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, data: result.data }
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
    const token = await requireToken()
    const result = await vpsApi.listAllUsers({
      token,
      page: params.page,
      pageSize: params.pageSize,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      search: params.search,
    })

    if (!result.success || !result.data) {
      return { success: false, error: result.error }
    }

    return {
      success: true,
      data: {
        items: result.data.items,
        total: result.data.total,
        page: result.data.page,
        pageSize: result.data.pageSize,
        totalPages: Math.ceil(result.data.total / result.data.pageSize),
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
    const token = await requireToken()
    const result = await vpsApi.listAllProjects({
      token,
      page: params.page,
      pageSize: params.pageSize,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      search: params.search,
      status: params.status,
      userId: params.userId,
    })

    if (!result.success || !result.data) {
      return { success: false, error: result.error }
    }

    return {
      success: true,
      data: {
        items: result.data.items,
        total: result.data.total,
        page: result.data.page,
        pageSize: result.data.pageSize,
        totalPages: result.data.totalPages,
      }
    }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

/**
 * 列出所有對話
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
    const token = await requireToken()
    const result = await vpsApi.listAllConversations({
      token,
      page: params.page,
      pageSize: params.pageSize,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      projectId: params.projectId,
    })

    if (!result.success || !result.data) {
      return { success: false, error: result.error }
    }

    return {
      success: true,
      data: {
        items: result.data.items,
        total: result.data.total,
        page: result.data.page,
        pageSize: result.data.pageSize,
        totalPages: result.data.totalPages,
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
    const token = await requireToken()
    const result = await vpsApi.getUserDetail({ token, userId })

    if (!result.success || !result.data) {
      return { success: false, error: result.error }
    }

    return { success: true, data: result.data }
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
  groupBy?: 'day' | 'week' | 'month' | 'model' | 'user' | 'conversation'
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
    const token = await requireToken()
    const result = await vpsApi.getLLMUsageStats({
      token,
      startDate: params.startDate,
      endDate: params.endDate,
      groupBy: params.groupBy === 'user' ? 'day' : params.groupBy, // VPS API 不支援 'user' groupBy
    })

    if (!result.success || !result.data) {
      return { success: false, error: result.error }
    }

    return { success: true, data: result.data }
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
    const token = await requireToken()
    const result = await vpsApi.setUserAdmin({
      token,
      userId: input.userId,
      isAdmin: input.isAdmin,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return {
      success: true,
      data: { userId: input.userId, isAdmin: input.isAdmin }
    }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

