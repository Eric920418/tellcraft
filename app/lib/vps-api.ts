/**
 * VPS Backend API 客戶端
 *
 * 用於將請求從 Vercel 前端轉發到 VPS 後端
 * 取代原有的 Inngest 觸發機制
 */

// API 基礎 URL - 通過 Vercel API Route 代理，避免 Mixed Content 問題
const API_BASE = '/api/vps'

// ============================================================
// 類型定義
// ============================================================

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  stage?: string
  progress?: { current: number; total: number; step: string }
}

// ============================================================
// HTTP 請求封裝
// ============================================================

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}`,
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('[VPS API] 請求失敗:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================
// API 函數
// ============================================================

/**
 * 發送消息到對話（觸發 Orchestrator）
 */
export async function sendMessage(input: {
  conversationId: string
  message: string
  projectId: string
  token?: string
}): Promise<ApiResponse<{ messageId: string; jobId: string }>> {
  return apiRequest(`/api/conversation/${input.conversationId}/message`, {
    method: 'POST',
    headers: input.token
      ? { Authorization: `Bearer ${input.token}` }
      : undefined,
    body: JSON.stringify({
      message: input.message,
      projectId: input.projectId,
    }),
  })
}

/**
 * 回覆對話（多輪對話機制）
 */
export async function replyToConversation(input: {
  conversationId: string
  message: string
  projectId: string
  taskId?: string
  specConfirmed?: boolean
  token?: string
}): Promise<ApiResponse<{ messageId: string; jobId: string }>> {
  return apiRequest(`/api/conversation/${input.conversationId}/reply`, {
    method: 'POST',
    headers: input.token
      ? { Authorization: `Bearer ${input.token}` }
      : undefined,
    body: JSON.stringify({
      message: input.message,
      projectId: input.projectId,
      taskId: input.taskId,
      specConfirmed: input.specConfirmed,
    }),
  })
}

/**
 * 取得對話消息
 */
export async function getConversationMessages(input: {
  conversationId: string
  lastUpdatedAt?: string
  token?: string
}): Promise<ApiResponse<{
  messages: Message[]
  updatedAt: string
  hasChanges: boolean
  currentTaskId?: string
  taskStatus?: string
  isComplete?: boolean
}>> {
  const params = new URLSearchParams()
  if (input.lastUpdatedAt) {
    params.set('lastUpdatedAt', input.lastUpdatedAt)
  }

  const query = params.toString() ? `?${params.toString()}` : ''

  return apiRequest(`/api/conversation/${input.conversationId}/messages${query}`, {
    method: 'GET',
    headers: input.token
      ? { Authorization: `Bearer ${input.token}` }
      : undefined,
  })
}

/**
 * 創建專案
 */
export async function createProject(input: {
  name: string
  description?: string
  token: string
}): Promise<ApiResponse<{ project: { id: string; name: string; status: string } }>> {
  return apiRequest('/api/project', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
    body: JSON.stringify({
      name: input.name,
      description: input.description,
    }),
  })
}

/**
 * 取得專案列表
 */
export async function getProjects(input: {
  token: string
}): Promise<ApiResponse<{ projects: Array<{
  id: string
  name: string
  description: string | null
  status: string
  created_at: string
  updated_at: string
}> }>> {
  return apiRequest('/api/project', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
  })
}

/**
 * 取得單一專案
 */
export async function getProject(input: {
  projectId: string
  token: string
}): Promise<ApiResponse<{
  project: {
    id: string
    name: string
    description: string | null
    status: string
  }
  conversation?: {
    id: string
    messages: Message[]
    spec_complete: boolean
  }
}>> {
  return apiRequest(`/api/project/${input.projectId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
  })
}

/**
 * 健康檢查
 */
export async function healthCheck(): Promise<ApiResponse<{
  status: string
  timestamp: string
  services: {
    database: string
    redis: string
  }
}>> {
  return apiRequest('/health', {
    method: 'GET',
  })
}

/**
 * 獲取 Dashboard 統計數據
 */
export async function getDashboardStats(input: {
  token: string
}): Promise<ApiResponse<{
  stats: {
    totalProjects: number
    totalConversations: number
    totalDeployments: number
    messageUsage: {
      used: number
      limit: number
      plan: string
    }
  }
  recentProjects: Array<{
    id: string
    name: string
    status: string
    conversationCount: number
    updatedAt: string
  }>
}>> {
  return apiRequest('/api/dashboard/stats', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
  })
}

/**
 * 獲取管理員統計數據
 */
export async function getAdminStats(input: {
  token: string
}): Promise<ApiResponse<{
  totalUsers: number
  totalProjects: number
  totalConversations: number
  totalDeployments: number
  activeUsers7d: number
  newUsers7d: number
  totalLLMCost: number
}>> {
  return apiRequest('/api/dashboard/admin/stats', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
  })
}

/**
 * 獲取 LLM 用量統計
 */
export async function getLLMUsageStats(input: {
  token: string
  startDate?: string
  endDate?: string
  groupBy?: 'day' | 'week' | 'month' | 'model' | 'conversation'
}): Promise<ApiResponse<{
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
  const params = new URLSearchParams()
  if (input.startDate) params.set('startDate', input.startDate)
  if (input.endDate) params.set('endDate', input.endDate)
  if (input.groupBy) params.set('groupBy', input.groupBy)

  const query = params.toString() ? `?${params.toString()}` : ''

  return apiRequest(`/api/dashboard/admin/usage${query}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
  })
}

// ============================================================
// Session API
// ============================================================

/**
 * 初始化會話（支援匿名用戶）
 */
export async function initializeSession(input: {
  anonymousId?: string
  conversationId?: string
  createNew?: boolean
  token?: string
}): Promise<ApiResponse<{
  userId: string
  projectId: string
  conversationId: string
  messages: Message[]
  isNewUser: boolean
  isNewProject: boolean
  isNewConversation: boolean
  resumed: boolean
}>> {
  return apiRequest('/api/session/initialize', {
    method: 'POST',
    headers: input.token
      ? { Authorization: `Bearer ${input.token}` }
      : undefined,
    body: JSON.stringify({
      anonymousId: input.anonymousId,
      conversationId: input.conversationId,
      createNew: input.createNew,
    }),
  })
}

/**
 * 獲取用戶對話列表
 */
export async function getUserConversations(input: {
  anonymousId?: string
  token?: string
}): Promise<ApiResponse<{
  conversations: Array<{
    id: string
    projectId: string
    projectName: string
    messageCount: number
    lastMessage: string
    specComplete: boolean
    updatedAt: string
  }>
}>> {
  const params = new URLSearchParams()
  if (input.anonymousId) params.set('anonymousId', input.anonymousId)
  const query = params.toString() ? `?${params.toString()}` : ''

  return apiRequest(`/api/session/conversations${query}`, {
    method: 'GET',
    headers: input.token
      ? { Authorization: `Bearer ${input.token}` }
      : undefined,
  })
}

/**
 * 獲取專案提醒（橫幅顯示）
 */
export async function getProjectReminder(input: {
  anonymousId?: string
  token?: string
}): Promise<ApiResponse<{
  reminder: {
    type: 'in_progress' | 'completed' | 'failed'
    projectId: string
    projectName: string
    message: string
    url?: string
  } | null
}>> {
  const params = new URLSearchParams()
  if (input.anonymousId) params.set('anonymousId', input.anonymousId)
  const query = params.toString() ? `?${params.toString()}` : ''

  return apiRequest(`/api/session/project-reminder${query}`, {
    method: 'GET',
    headers: input.token
      ? { Authorization: `Bearer ${input.token}` }
      : undefined,
  })
}

// ============================================================
// Admin User Management API
// ============================================================

/**
 * 獲取所有用戶列表（管理員專用）
 */
export async function listAllUsers(input: {
  token: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
}): Promise<ApiResponse<{
  items: Array<{
    id: string
    email: string
    name: string | null
    plan: string
    subscriptionStatus: string
    isAdmin: boolean
    projectCount: number
    messageCount: number
    createdAt: string
  }>
  total: number
  page: number
  pageSize: number
}>> {
  const params = new URLSearchParams()
  if (input.page) params.set('page', input.page.toString())
  if (input.pageSize) params.set('pageSize', input.pageSize.toString())
  if (input.sortBy) params.set('sortBy', input.sortBy)
  if (input.sortOrder) params.set('sortOrder', input.sortOrder)
  if (input.search) params.set('search', input.search)

  const query = params.toString() ? `?${params.toString()}` : ''

  return apiRequest(`/api/dashboard/admin/users${query}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
  })
}

/**
 * 獲取單一用戶詳情（管理員專用）
 */
export async function getUserDetail(input: {
  token: string
  userId: string
}): Promise<ApiResponse<{
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
  return apiRequest(`/api/dashboard/admin/users/${input.userId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
  })
}

/**
 * 獲取審計日誌（管理員專用）
 */
export async function getAuditLogs(input: {
  token: string
  page?: number
  pageSize?: number
  action?: string
  startDate?: string
  endDate?: string
}): Promise<ApiResponse<{
  items: Array<{
    id: string
    userId: string | null
    userEmail: string | null
    action: string
    entityType: string | null
    entityId: string | null
    metadata: Record<string, unknown> | null
    createdAt: string
  }>
  total: number
  page: number
  pageSize: number
}>> {
  const params = new URLSearchParams()
  if (input.page) params.set('page', input.page.toString())
  if (input.pageSize) params.set('pageSize', input.pageSize.toString())
  if (input.action) params.set('action', input.action)
  if (input.startDate) params.set('startDate', input.startDate)
  if (input.endDate) params.set('endDate', input.endDate)

  const query = params.toString() ? `?${params.toString()}` : ''

  return apiRequest(`/api/dashboard/admin/logs${query}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
  })
}

/**
 * 設置用戶管理員狀態
 */
export async function setUserAdmin(input: {
  token: string
  userId: string
  isAdmin: boolean
}): Promise<ApiResponse<{ success: boolean }>> {
  return apiRequest(`/api/dashboard/admin/users/${input.userId}/admin`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
    body: JSON.stringify({ isAdmin: input.isAdmin }),
  })
}

// ============================================================
// 導出
// ============================================================

export const vpsApi = {
  sendMessage,
  replyToConversation,
  getConversationMessages,
  createProject,
  getProjects,
  getProject,
  healthCheck,
  getDashboardStats,
  getAdminStats,
  getLLMUsageStats,
  initializeSession,
  getUserConversations,
  getProjectReminder,
  listAllUsers,
  setUserAdmin,
  getUserDetail,
  getAuditLogs,
}
