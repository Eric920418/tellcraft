/**
 * VPS Backend API 客戶端
 *
 * 用於將請求從 Vercel 前端轉發到 VPS 後端
 * 取代原有的 Inngest 觸發機制
 */

// API 基礎 URL
// - 伺服器端（Server Actions/Components）：直接調用 VPS API
// - 客戶端（瀏覽器）：通過 Vercel API Route 代理避免 CORS
function getApiBase(): string {
  // 客戶端: 通過 /api/vps 代理
  if (typeof window !== 'undefined') {
    return '/api/vps'
  }
  // 伺服器端: 直連 VPS API
  return process.env.VPS_API_URL || 'http://54.238.4.117:8080'
}

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
  const baseUrl = getApiBase()
  const fullUrl = `${baseUrl}${endpoint}`

  // Debug log
  console.log(`[VPS API] ${options.method || 'GET'} ${fullUrl} (base: ${baseUrl})`)

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    const text = await response.text()
    let data: T
    try {
      data = JSON.parse(text) as T
    } catch {
      console.error(`[VPS API] Non-JSON response (${response.status}): ${text.substring(0, 200)}`)
      return {
        success: false,
        error: `VPS 後端無回應或返回錯誤 (HTTP ${response.status})`,
      }
    }

    if (!response.ok) {
      return {
        success: false,
        error: ((data as Record<string, unknown>).error as string) || `HTTP ${response.status}`,
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
  userId?: string
  mode?: 'fast' | 'fine'
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
      userId: input.userId,
      mode: input.mode,
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
  userId?: string
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
      userId: input.userId,
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
  streamingPreview?: {
    pages: { path: string; content: string; description: string }[]
    components: { path: string; content: string; description: string }[]
    styles: string
    tailwindConfig: string
    phase: 'structure' | 'animation' | 'rwd'
  } | null
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
  page?: number
  pageSize?: number
  search?: string
  status?: string
}): Promise<ApiResponse<{
  projects: Array<{
    id: string
    name: string
    description: string | null
    status: string
    vercelUrl: string | null
    customDomain: string | null
    conversationCount: number
    createdAt: string
    updatedAt: string
  }>
  total: number
  page: number
  pageSize: number
}>> {
  const params = new URLSearchParams()
  if (input.page) params.set('page', input.page.toString())
  if (input.pageSize) params.set('pageSize', input.pageSize.toString())
  if (input.search) params.set('search', input.search)
  if (input.status) params.set('status', input.status)

  const query = params.toString() ? `?${params.toString()}` : ''

  return apiRequest(`/api/project${query}`, {
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

/**
 * 獲取所有專案列表（管理員專用）
 */
export async function listAllProjects(input: {
  token: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  status?: string
  userId?: string
}): Promise<ApiResponse<{
  items: Array<{
    id: string
    name: string
    status: string
    userId: string
    userEmail: string
    conversationCount: number
    vercelUrl: string | null
    createdAt: string
    updatedAt: string
  }>
  total: number
  page: number
  pageSize: number
  totalPages: number
}>> {
  const params = new URLSearchParams()
  if (input.page) params.set('page', input.page.toString())
  if (input.pageSize) params.set('pageSize', input.pageSize.toString())
  if (input.sortBy) params.set('sortBy', input.sortBy)
  if (input.sortOrder) params.set('sortOrder', input.sortOrder)
  if (input.search) params.set('search', input.search)
  if (input.status) params.set('status', input.status)
  if (input.userId) params.set('userId', input.userId)

  const query = params.toString() ? `?${params.toString()}` : ''

  return apiRequest(`/api/dashboard/admin/projects${query}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
  })
}

/**
 * 獲取所有對話列表（管理員專用）
 */
export async function listAllConversations(input: {
  token: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  projectId?: string
}): Promise<ApiResponse<{
  items: Array<{
    id: string
    projectId: string
    projectName: string
    userId: string
    userEmail: string
    messageCount: number
    specComplete: boolean
    createdAt: string
    updatedAt: string
  }>
  total: number
  page: number
  pageSize: number
  totalPages: number
}>> {
  const params = new URLSearchParams()
  if (input.page) params.set('page', input.page.toString())
  if (input.pageSize) params.set('pageSize', input.pageSize.toString())
  if (input.sortBy) params.set('sortBy', input.sortBy)
  if (input.sortOrder) params.set('sortOrder', input.sortOrder)
  if (input.projectId) params.set('projectId', input.projectId)

  const query = params.toString() ? `?${params.toString()}` : ''

  return apiRequest(`/api/dashboard/admin/conversations${query}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
  })
}

// ============================================================
// Template Overrides API (專案級模板客製化)
// ============================================================

/**
 * 獲取專案的模板客製化
 */
export async function getTemplateOverrides(input: {
  projectId: string
  token: string
}): Promise<ApiResponse<{ overrides: Record<string, Record<string, string>> }>> {
  return apiRequest(`/api/project/${input.projectId}/template-overrides`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
  })
}

/**
 * 保存專案的模板客製化
 */
export async function saveTemplateOverrides(input: {
  projectId: string
  overrides: Record<string, Record<string, string>>
  token: string
}): Promise<ApiResponse<{ success: boolean }>> {
  return apiRequest(`/api/project/${input.projectId}/template-overrides`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
    body: JSON.stringify({ overrides: input.overrides }),
  })
}

// ============================================================
// Templates API
// ============================================================

interface TemplateData {
  id: string
  name: string
  slug: string
  category: string
  description: string
  thumbnailUrl: string
  previewImageUrl?: string | null
  tags: string[]
  designDefaults?: unknown
  pageStructure?: unknown
  isActive: boolean
  isFeatured: boolean
  sortOrder: number
}

/**
 * 獲取模板列表
 */
export async function getTemplates(input?: {
  category?: string
  featuredOnly?: boolean
}): Promise<ApiResponse<{ templates: TemplateData[] }>> {
  const params = new URLSearchParams()
  if (input?.category) params.set('category', input.category)
  if (input?.featuredOnly) params.set('featuredOnly', 'true')

  const query = params.toString() ? `?${params.toString()}` : ''

  return apiRequest(`/api/templates${query}`, {
    method: 'GET',
  })
}

/**
 * 根據 ID 獲取模板
 */
export async function getTemplateById(input: {
  templateId: string
}): Promise<ApiResponse<{ template: TemplateData }>> {
  return apiRequest(`/api/templates/${input.templateId}`, {
    method: 'GET',
  })
}

/**
 * 根據 slug 獲取模板
 */
export async function getTemplateBySlug(input: {
  slug: string
}): Promise<ApiResponse<{ template: TemplateData }>> {
  return apiRequest(`/api/templates/slug/${input.slug}`, {
    method: 'GET',
  })
}

/**
 * 初始化模板資料（管理員專用）
 */
export async function initializeTemplates(input: {
  token: string
  templates: TemplateData[]
}): Promise<ApiResponse<{ success: boolean; count: number }>> {
  return apiRequest('/api/templates/init', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
    body: JSON.stringify({ templates: input.templates }),
  })
}

/**
 * 管理員模板列表資料
 */
interface AdminTemplateData extends TemplateData {
  createdAt: string
  preview: {
    version: number | null
    updatedAt: string | null
    status: 'cached' | 'none'
  }
}

/**
 * 獲取管理員模板列表（包含預覽狀態）
 */
export async function getAdminTemplates(input: {
  token: string
}): Promise<ApiResponse<{ templates: AdminTemplateData[] }>> {
  return apiRequest('/api/templates/admin/list', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
  })
}

/**
 * 重新生成模板預覽
 */
export async function regenerateTemplatePreview(input: {
  token: string
  templateId: string
}): Promise<ApiResponse<{ success: boolean; version: number; message: string }>> {
  return apiRequest(`/api/templates/preview/${input.templateId}/regenerate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
  })
}

// ============================================================
// User API
// ============================================================

/**
 * 獲取當前用戶資訊
 */
export async function getCurrentUserFromVps(input: {
  token?: string
}): Promise<ApiResponse<{
  userId: string
  email?: string
  name?: string
  avatarUrl?: string
  isAdmin: boolean
} | null>> {
  return apiRequest('/api/user/me', {
    method: 'GET',
    headers: input.token
      ? { Authorization: `Bearer ${input.token}` }
      : undefined,
  })
}

/**
 * 遷移匿名帳號到認證帳號
 */
export async function migrateAnonymousAccount(input: {
  token: string
  anonymousId: string
}): Promise<ApiResponse<{
  migratedProjects: number
  migratedConversations: number
}>> {
  return apiRequest('/api/user/migrate', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
    body: JSON.stringify({ anonymousId: input.anonymousId }),
  })
}

/**
 * 更新專案
 */
export async function updateProject(input: {
  projectId: string
  name?: string
  description?: string
  token: string
}): Promise<ApiResponse<{ success: boolean }>> {
  return apiRequest(`/api/project/${input.projectId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
    body: JSON.stringify({
      name: input.name,
      description: input.description,
    }),
  })
}

// ============================================================
// BDD Session API
// ============================================================

interface ClarifyItem {
  id: string
  question: string
  category: string
  context?: string
  suggestions?: string[]
  answer?: string
  status: 'pending' | 'answered' | 'skipped'
  createdAt: string
  answeredAt?: string
}

interface BddSession {
  id: string
  projectId: string | null
  conversationId: string
  taskId: string | null
  currentPhase: string
  currentRound: number
  currentQuestionIndex: number
  totalDiscovered: number
  totalResolved: number
  consecutiveEmptyRounds: number
  clarifyItems: ClarifyItem[]
  stagingItems: ClarifyItem[]
  resolvedItems: ClarifyItem[]
  originalRequirements: string
  projectContext: Record<string, unknown>
  schemaSqlContent: string | null
  entityMappingContent: string | null
  featuresContent: string | null
  actionsYmlContent: string | null
  isaConfigContent: string | null
  validationResult: unknown | null
  createdAt: string
  updatedAt: string
}

/**
 * 創建 BDD Session
 */
export async function createBddSession(input: {
  conversationId: string
  projectId?: string
  taskId?: string
  originalRequirements: string
  projectContext?: Record<string, unknown>
  token?: string
}): Promise<ApiResponse<{ sessionId: string }>> {
  return apiRequest('/api/bdd/session', {
    method: 'POST',
    headers: input.token ? { Authorization: `Bearer ${input.token}` } : {},
    body: JSON.stringify({
      conversationId: input.conversationId,
      projectId: input.projectId,
      taskId: input.taskId,
      originalRequirements: input.originalRequirements,
      projectContext: input.projectContext,
    }),
  })
}

/**
 * 獲取 BDD Session
 */
export async function getBddSession(input: {
  sessionId?: string
  conversationId?: string
  projectId?: string
  token?: string
}): Promise<ApiResponse<{ session: BddSession | null }>> {
  let endpoint: string
  if (input.sessionId) {
    endpoint = `/api/bdd/session/${input.sessionId}`
  } else if (input.conversationId) {
    endpoint = `/api/bdd/session/by-conversation/${input.conversationId}`
  } else if (input.projectId) {
    endpoint = `/api/bdd/session/by-project/${input.projectId}`
  } else {
    return { success: false, error: '需要 sessionId、conversationId 或 projectId' }
  }

  return apiRequest(endpoint, {
    method: 'GET',
    headers: input.token ? { Authorization: `Bearer ${input.token}` } : {},
  })
}

/**
 * 更新 BDD Session
 */
export async function updateBddSession(input: {
  sessionId: string
  updates: Partial<{
    currentPhase: string
    currentRound: number
    currentQuestionIndex: number
    totalDiscovered: number
    totalResolved: number
    consecutiveEmptyRounds: number
    clarifyItems: ClarifyItem[]
    stagingItems: ClarifyItem[]
    resolvedItems: ClarifyItem[]
    schemaSqlContent: string
    entityMappingContent: string
    featuresContent: string
    actionsYmlContent: string
    isaConfigContent: string
    validationResult: unknown
  }>
  token?: string
}): Promise<ApiResponse<{ session: BddSession }>> {
  return apiRequest(`/api/bdd/session/${input.sessionId}`, {
    method: 'PATCH',
    headers: input.token ? { Authorization: `Bearer ${input.token}` } : {},
    body: JSON.stringify(input.updates),
  })
}

/**
 * 回答釐清項目
 */
export async function answerClarifyItem(input: {
  sessionId: string
  itemId: string
  answer: string
  token?: string
}): Promise<ApiResponse<{ success: boolean; item: ClarifyItem; remainingCount: number }>> {
  return apiRequest(`/api/bdd/session/${input.sessionId}/answer`, {
    method: 'POST',
    headers: input.token ? { Authorization: `Bearer ${input.token}` } : {},
    body: JSON.stringify({ itemId: input.itemId, answer: input.answer }),
  })
}

/**
 * 批次確認項目
 */
export async function confirmBatch(input: {
  sessionId: string
  itemIds: string[]
  answers: Record<string, string>
  token?: string
}): Promise<ApiResponse<{ success: boolean; confirmedCount: number; remainingCount: number }>> {
  return apiRequest(`/api/bdd/session/${input.sessionId}/confirm`, {
    method: 'POST',
    headers: input.token ? { Authorization: `Bearer ${input.token}` } : {},
    body: JSON.stringify({ itemIds: input.itemIds, answers: input.answers }),
  })
}

/**
 * 撤銷回答
 */
export async function revertAnswer(input: {
  sessionId: string
  itemId: string
  token?: string
}): Promise<ApiResponse<{ success: boolean; item: ClarifyItem }>> {
  return apiRequest(`/api/bdd/session/${input.sessionId}/revert`, {
    method: 'POST',
    headers: input.token ? { Authorization: `Bearer ${input.token}` } : {},
    body: JSON.stringify({ itemId: input.itemId }),
  })
}

/**
 * 跳過項目
 */
export async function skipClarifyItem(input: {
  sessionId: string
  itemId: string
  token?: string
}): Promise<ApiResponse<{ success: boolean; item: ClarifyItem }>> {
  return apiRequest(`/api/bdd/session/${input.sessionId}/skip`, {
    method: 'POST',
    headers: input.token ? { Authorization: `Bearer ${input.token}` } : {},
    body: JSON.stringify({ itemId: input.itemId }),
  })
}

/**
 * 新增釐清項目
 */
export async function addClarifyItems(input: {
  sessionId: string
  items: Array<{
    question: string
    category: string
    context?: string
    suggestions?: string[]
  }>
  token?: string
}): Promise<ApiResponse<{ success: boolean; addedCount: number; totalCount: number }>> {
  return apiRequest(`/api/bdd/session/${input.sessionId}/items`, {
    method: 'POST',
    headers: input.token ? { Authorization: `Bearer ${input.token}` } : {},
    body: JSON.stringify({ items: input.items }),
  })
}

/**
 * 獲取當前釐清項目
 */
export async function getCurrentClarifyItem(input: {
  sessionId: string
  token?: string
}): Promise<ApiResponse<{
  currentItem: ClarifyItem | null
  currentIndex: number
  totalPending: number
  totalResolved: number
}>> {
  return apiRequest(`/api/bdd/session/${input.sessionId}/current`, {
    method: 'GET',
    headers: input.token ? { Authorization: `Bearer ${input.token}` } : {},
  })
}

/**
 * 獲取 BDD Session 進度
 */
export async function getBddSessionProgress(input: {
  sessionId: string
  token?: string
}): Promise<ApiResponse<{
  currentPhase: string
  currentRound: number
  totalDiscovered: number
  totalResolved: number
  pendingCount: number
  skippedCount: number
  consecutiveEmptyRounds: number
}>> {
  return apiRequest(`/api/bdd/session/${input.sessionId}/progress`, {
    method: 'GET',
    headers: input.token ? { Authorization: `Bearer ${input.token}` } : {},
  })
}

// ============================================================
// 專案詳情 API
// ============================================================

/**
 * 開始專案新迭代
 * 創建新對話 + 專案狀態改為 generating
 */
export async function startProjectIteration(input: {
  projectId: string
  description?: string
  token?: string
}): Promise<ApiResponse<{ conversationId: string; projectStatus: string }>> {
  return apiRequest(`/api/project/${input.projectId}/iterate`, {
    method: 'POST',
    headers: input.token
      ? { Authorization: `Bearer ${input.token}` }
      : undefined,
    body: JSON.stringify({
      description: input.description,
    }),
  })
}

/**
 * 刪除專案
 * 級聯刪除相關的 BDD Sessions、Tasks、Conversations
 */
export async function deleteProject(input: {
  projectId: string
  token: string
}): Promise<ApiResponse<{ success: boolean }>> {
  return apiRequest(`/api/project/${input.projectId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
  })
}

/**
 * 獲取專案版本歷史
 */
export async function getProjectVersions(input: {
  projectId: string
  token: string
}): Promise<ApiResponse<{
  versions: Array<{
    id: string
    versionNumber: number
    versionLabel: string | null
    status: string
    changeSummary: string | null
    conversationId: string | null
    createdAt: string
    hasBackup: boolean
  }>
}>> {
  return apiRequest(`/api/project/${input.projectId}/versions`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
  })
}

/**
 * 更新版本標籤
 */
export async function updateVersionLabel(input: {
  projectId: string
  versionNumber: number
  label: string
  token: string
}): Promise<ApiResponse<{ success: boolean }>> {
  return apiRequest(`/api/project/${input.projectId}/versions/${input.versionNumber}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
    body: JSON.stringify({ label: input.label }),
  })
}

/**
 * 回滾到指定版本
 */
export async function rollbackVersion(input: {
  projectId: string
  versionNumber: number
  token: string
}): Promise<ApiResponse<{
  success: boolean
  newVersionNumber: number
  message: string
}>> {
  return apiRequest(`/api/project/${input.projectId}/versions/${input.versionNumber}/rollback`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
    body: JSON.stringify({ confirm: true }),
  })
}

/**
 * 對比兩個版本
 */
export async function compareVersions(input: {
  projectId: string
  v1: number
  v2: number
  token: string
}): Promise<ApiResponse<{
  schemaDiff: string
  featuresDiff: Array<{
    name: string
    status: 'added' | 'removed' | 'modified'
    diff?: string
  }>
}>> {
  return apiRequest(`/api/project/${input.projectId}/versions/compare?v1=${input.v1}&v2=${input.v2}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
  })
}

/**
 * 獲取專案完整詳情
 */
export async function getProjectDetail(input: {
  projectId: string
  token: string
}): Promise<ApiResponse<{
  project: {
    id: string
    name: string
    description: string | null
    status: string
    vercelUrl: string | null
    customDomain: string | null
    domainStatus: string | null
    createdAt: string
    updatedAt: string
  }
  conversations: Array<{
    id: string
    messages: unknown[]
    specComplete: boolean
    createdAt: string
    updatedAt: string
  }>
  deployments: Array<{
    id: string
    url: string | null
    status: string
    createdAt: string
  }>
  generations: Array<{
    id: string
    status: string
    attemptCount: number
    createdAt: string
  }>
}>> {
  return apiRequest(`/api/project/${input.projectId}/detail`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
  })
}

/**
 * 獲取專案最新生成記錄
 */
export async function getLatestGeneration(input: {
  projectId: string
  token: string
}): Promise<ApiResponse<{
  generation: {
    id: string
    generatedCodeUrl: string | null
    status: string
    attemptCount: number
    createdAt: string
  } | null
}>> {
  return apiRequest(`/api/project/${input.projectId}/latest-generation`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${input.token}`,
    },
  })
}

// ============================================================
// Operations API (綜合操作)
// ============================================================

/**
 * 創建或更新生成記錄
 */
export async function createOrUpdateGeneration(input: {
  projectId: string
  status: string
  attemptCount?: number
  token: string
}): Promise<ApiResponse<{ generationId: string; attemptCount: number }>> {
  return apiRequest('/api/operations/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({
      projectId: input.projectId,
      status: input.status,
      attemptCount: input.attemptCount,
    }),
  })
}

/**
 * 創建部署記錄
 */
export async function createDeployment(input: {
  projectId: string
  url?: string
  status: string
  organizationId?: string
  token: string
}): Promise<ApiResponse<{ deploymentId: string }>> {
  return apiRequest('/api/operations/deployments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({
      projectId: input.projectId,
      url: input.url,
      status: input.status,
      organizationId: input.organizationId,
    }),
  })
}

/**
 * 更新部署記錄
 */
export async function updateDeployment(input: {
  deploymentId: string
  url?: string
  status?: string
  token: string
}): Promise<ApiResponse<{ success: boolean }>> {
  return apiRequest(`/api/operations/deployments/${input.deploymentId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({
      url: input.url,
      status: input.status,
    }),
  })
}

/**
 * 創建任務
 */
export async function createTask(input: {
  projectId: string
  skillId?: string
  taskInput?: Record<string, unknown>
  priority?: number
  token: string
}): Promise<ApiResponse<{ taskId: string }>> {
  return apiRequest('/api/operations/tasks', {
    method: 'POST',
    headers: { Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({
      projectId: input.projectId,
      skillId: input.skillId,
      input: input.taskInput,
      priority: input.priority,
    }),
  })
}

/**
 * 更新任務
 */
export async function updateTask(input: {
  taskId: string
  status?: string
  output?: Record<string, unknown>
  failedStep?: string
  currentStep?: string
  token: string
}): Promise<ApiResponse<{ success: boolean }>> {
  return apiRequest(`/api/operations/tasks/${input.taskId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({
      status: input.status,
      output: input.output,
      failedStep: input.failedStep,
      currentStep: input.currentStep,
    }),
  })
}

/**
 * 完整建立任務（包含訂閱檢查、優先級計算）
 */
export async function createTaskFull(input: {
  projectId: string
  goal: string
  token: string
}): Promise<ApiResponse<{
  taskId: string
  status: string
  stepCount: number
  calculatedPriority: number
}>> {
  return apiRequest('/api/operations/tasks/full', {
    method: 'POST',
    headers: { Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({
      projectId: input.projectId,
      goal: input.goal,
    }),
  })
}

/**
 * 確認任務計劃
 */
export async function confirmTaskPlan(input: {
  taskId: string
  approved: boolean
  token: string
}): Promise<ApiResponse<{
  taskId: string
  status: string
}>> {
  return apiRequest(`/api/operations/tasks/${input.taskId}/confirm`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({
      approved: input.approved,
    }),
  })
}

/**
 * 取消任務
 */
export async function cancelTask(input: {
  taskId: string
  token: string
}): Promise<ApiResponse<{
  taskId: string
  status: string
}>> {
  return apiRequest(`/api/operations/tasks/${input.taskId}/cancel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${input.token}` },
  })
}

/**
 * 重試任務
 */
export async function retryTask(input: {
  taskId: string
  token: string
}): Promise<ApiResponse<{
  taskId: string
  status: string
  currentStep: number
}>> {
  return apiRequest(`/api/operations/tasks/${input.taskId}/retry`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${input.token}` },
  })
}

/**
 * 獲取任務
 */
export async function getTask(input: {
  taskId: string
  token?: string
}): Promise<ApiResponse<{
  task: {
    id: string
    projectId: string
    userId: string
    skillId: string | null
    input: Record<string, unknown>
    output: Record<string, unknown>
    priority: number
    status: string
    failedStep: string | null
    currentStep: string | null
    createdAt: string
    updatedAt: string
  }
}>> {
  return apiRequest(`/api/operations/tasks/${input.taskId}`, {
    method: 'GET',
    headers: input.token ? { Authorization: `Bearer ${input.token}` } : {},
  })
}

/**
 * 獲取對話消息（含任務狀態）
 */
export async function getConversationMessagesWithTask(input: {
  conversationId: string
  lastUpdatedAt?: string
  token?: string
}): Promise<ApiResponse<{
  messages: Array<{
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: string
    stage?: string
    progress?: { current: number; total: number; step: string }
  }>
  specComplete: boolean
  updatedAt: string
  currentTaskId?: string
  taskStatus?: string
  bddSessionId?: string
  bddPhase?: string
  noChange?: boolean
}>> {
  const params = new URLSearchParams()
  if (input.lastUpdatedAt) params.append('lastUpdatedAt', input.lastUpdatedAt)

  return apiRequest(`/api/operations/conversations/${input.conversationId}/messages?${params}`, {
    method: 'GET',
    headers: input.token ? { Authorization: `Bearer ${input.token}` } : {},
  })
}

/**
 * 添加對話消息
 */
export async function addConversationMessage(input: {
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  stage?: string
  progress?: { current: number; total: number; step: string }
  token?: string
}): Promise<ApiResponse<{ messageId: string }>> {
  return apiRequest(`/api/operations/conversations/${input.conversationId}/messages`, {
    method: 'POST',
    headers: input.token ? { Authorization: `Bearer ${input.token}` } : {},
    body: JSON.stringify({
      role: input.role,
      content: input.content,
      stage: input.stage,
      progress: input.progress,
    }),
  })
}

/**
 * 取消訂閱
 */
export async function cancelSubscription(input: {
  token: string
}): Promise<ApiResponse<{ success: boolean }>> {
  return apiRequest('/api/operations/subscription/cancel', {
    method: 'POST',
    headers: { Authorization: `Bearer ${input.token}` },
  })
}

/**
 * 更新專案狀態
 */
export async function updateProjectStatus(input: {
  projectId: string
  status?: string
  vercelUrl?: string
  customDomain?: string
  domainStatus?: string
  token: string
}): Promise<ApiResponse<{ success: boolean }>> {
  return apiRequest(`/api/operations/projects/${input.projectId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({
      status: input.status,
      vercelUrl: input.vercelUrl,
      customDomain: input.customDomain,
      domainStatus: input.domainStatus,
    }),
  })
}

/**
 * 創建通知
 */
export async function createNotification(input: {
  userId: string
  type: string
  title: string
  message: string
  metadata?: Record<string, unknown>
  token: string
}): Promise<ApiResponse<{ notificationId: string }>> {
  return apiRequest('/api/operations/notifications', {
    method: 'POST',
    headers: { Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      metadata: input.metadata,
    }),
  })
}

/**
 * 迭代修改專案
 */
export async function iterateProject(input: {
  projectId: string
  changes: string
  isDestructive?: boolean
  token: string
}): Promise<ApiResponse<{ projectId: string; status: string; backupCreated: boolean }>> {
  return apiRequest(`/api/operations/projects/${input.projectId}/iterate`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({
      changes: input.changes,
      isDestructive: input.isDestructive,
    }),
  })
}

/**
 * 訂閱操作（取消/重新訂閱）
 */
export async function subscriptionAction(input: {
  action: 'cancel' | 'resubscribe'
  token: string
}): Promise<ApiResponse<{ userId: string; status: string }>> {
  return apiRequest('/api/operations/subscription/action', {
    method: 'POST',
    headers: { Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({ action: input.action }),
  })
}

/**
 * 生成程式碼
 */
export async function generateCode(input: {
  projectId: string
  token: string
}): Promise<ApiResponse<{ generationId: string; attemptCount: number; status: string }>> {
  return apiRequest('/api/operations/generate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({ projectId: input.projectId }),
  })
}

/**
 * 部署專案
 */
export async function deployProjectVps(input: {
  projectId: string
  token: string
}): Promise<ApiResponse<{ deploymentId: string; status: string }>> {
  return apiRequest('/api/operations/deploy', {
    method: 'POST',
    headers: { Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({ projectId: input.projectId }),
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
  listAllProjects,
  listAllConversations,
  getCurrentUserFromVps,
  migrateAnonymousAccount,
  updateProject,
  // Template Overrides
  getTemplateOverrides,
  saveTemplateOverrides,
  // BDD Session
  createBddSession,
  getBddSession,
  updateBddSession,
  answerClarifyItem,
  confirmBatch,
  revertAnswer,
  skipClarifyItem,
  addClarifyItems,
  getCurrentClarifyItem,
  getBddSessionProgress,
  // Project Detail
  getProjectDetail,
  getLatestGeneration,
  // Project Iteration & Versioning
  startProjectIteration,
  deleteProject,
  getProjectVersions,
  updateVersionLabel,
  rollbackVersion,
  compareVersions,
  // Operations
  createOrUpdateGeneration,
  createDeployment,
  updateDeployment,
  createTask,
  updateTask,
  getTask,
  getConversationMessagesWithTask,
  addConversationMessage,
  cancelSubscription,
  updateProjectStatus,
  createNotification,
  generateCode,
  deployProjectVps,
  iterateProject,
  subscriptionAction,
  exportData,
  transferResources,
  registerSkill,
  configureWebhook,
}

/**
 * 導出資料
 */
export async function exportData(input: {
  format: 'sql' | 'json'
  projectId?: string
  token: string
}): Promise<ApiResponse<{ downloadUrl: string; format: string }>> {
  return apiRequest('/api/operations/export', {
    method: 'POST',
    headers: { Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({
      format: input.format,
      projectId: input.projectId,
    }),
  })
}

/**
 * 移轉資源
 */
export async function transferResources(input: {
  projectId: string
  dbApiKey: string
  vercelToken: string
  token: string
}): Promise<ApiResponse<{ projectId: string; transferred: boolean }>> {
  return apiRequest('/api/operations/transfer', {
    method: 'POST',
    headers: { Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({
      projectId: input.projectId,
      dbApiKey: input.dbApiKey,
      vercelToken: input.vercelToken,
    }),
  })
}

/**
 * 註冊技能
 */
export async function registerSkill(input: {
  name: string
  description?: string
  version: string
  token: string
}): Promise<ApiResponse<{ skillId: string; status: string }>> {
  return apiRequest('/api/operations/skills', {
    method: 'POST',
    headers: { Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({
      name: input.name,
      description: input.description,
      version: input.version,
    }),
  })
}

/**
 * 配置 Webhook
 */
export async function configureWebhook(input: {
  url: string
  events: string[]
  secret?: string
  token: string
}): Promise<ApiResponse<{ webhookId: string; status: string }>> {
  return apiRequest('/api/operations/webhooks', {
    method: 'POST',
    headers: { Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({
      url: input.url,
      events: input.events,
      secret: input.secret,
    }),
  })
}

// 導出類型
export type { ClarifyItem, BddSession }
