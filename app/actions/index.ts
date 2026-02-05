'use server'

// db 直連已遷移至 VPS API，此導入已移除
import { getCurrentUser, getAuthToken } from '../lib/auth'
import { deployProject as deployProjectReal, generateNextJsTemplate } from './deploy'
import * as vpsApi from '../lib/vps-api'
import type { BddSession as VpsBddSession, ClarifyItem as VpsClarifyItem } from '../lib/vps-api'

// ============================================================
// 類型定義
// ============================================================

type ProjectStatus = 'draft' | 'generating' | 'testing' | 'deployed' | 'failed'
type SubscriptionStatus = 'active' | 'suspended' | 'cancelled'
type TaskStatus = 'planning' | 'pending_approval' | 'executing' | 'waiting_approval' | 'completed' | 'failed' | 'cancelled'

interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// ============================================================
// 核心功能 Actions
// ============================================================

/**
 * 建立專案
 * - 前置：用戶訂閱狀態必須為 active
 * - 前置：專案數量不可超過方案上限
 * - 後置：名稱重複時自動加後綴
 */
export async function createProject(input: {
  userId: string
  name: string
  description?: string
}): Promise<ActionResult<{ projectId: string; status: ProjectStatus }>> {
  const { name, description } = input

  const token = await getAuthToken()
  if (!token) {
    return { success: false, error: '未登入' }
  }

  const result = await vpsApi.createProject({
    name,
    description,
    token,
  })

  if (!result.success || !result.data) {
    return { success: false, error: result.error || '建立專案失敗' }
  }

  return {
    success: true,
    data: {
      projectId: result.data.project.id,
      status: result.data.project.status as ProjectStatus
    }
  }
}

/**
 * 發送訊息
 * - 前置：對話次數不可超過方案上限
 * - 後置：每則用戶訊息消耗 1 次對話配額
 */
export async function sendMessage(input: {
  conversationId: string
  content: string
  projectId?: string
}): Promise<ActionResult<{ messageId: string }>> {
  const { conversationId, content, projectId } = input

  // 如果沒有提供 projectId，使用 addConversationMessage API
  const token = await getAuthToken()

  if (!projectId) {
    // 使用 operations API 直接添加消息
    const result = await vpsApi.addConversationMessage({
      conversationId,
      role: 'user',
      content,
      token: token || undefined,
    })

    if (!result.success || !result.data) {
      return { success: false, error: result.error || '發送訊息失敗' }
    }

    return {
      success: true,
      data: { messageId: result.data.messageId }
    }
  }

  // 使用原有的 sendMessage API（會觸發 LLM）
  const result = await vpsApi.sendMessage({
    conversationId,
    message: content,
    projectId,
    token: token || undefined,
  })

  if (!result.success || !result.data) {
    return { success: false, error: result.error || '發送訊息失敗' }
  }

  return {
    success: true,
    data: { messageId: result.data.messageId }
  }
}

/**
 * 生成程式碼
 * - 前置：必須有對話且 BDD Spec 已完成
 * - 後置：生成成功後專案狀態變為 testing
 * - 後置：自癒機制最多嘗試 3 次
 */
export async function generateCode(input: {
  projectId: string
}): Promise<ActionResult<{ generationId: string; status: string }>> {
  const { projectId } = input

  const token = await getAuthToken()
  if (!token) {
    return { success: false, error: '未登入' }
  }

  const result = await vpsApi.generateCode({ projectId, token })

  if (!result.success || !result.data) {
    return { success: false, error: result.error || '生成程式碼失敗' }
  }

  return {
    success: true,
    data: {
      generationId: result.data.generationId,
      status: result.data.status
    }
  }
}

/**
 * 部署專案
 * - 前置：專案狀態必須為 testing
 * - 後置：部署成功後專案狀態變為 deployed
 */
export async function deployProject(input: {
  projectId: string
}): Promise<ActionResult<{ deploymentId: string; url?: string; status: string }>> {
  const { projectId } = input

  const token = await getAuthToken()
  if (!token) {
    return { success: false, error: '未登入' }
  }

  const result = await vpsApi.deployProjectVps({ projectId, token })

  if (!result.success || !result.data) {
    return { success: false, error: result.error || '部署專案失敗' }
  }

  return {
    success: true,
    data: {
      deploymentId: result.data.deploymentId,
      status: result.data.status
    }
  }
}

/**
 * 迭代修改 (updateProject)
 * - 前置：專案狀態必須為 deployed 或 failed
 * - 後置：破壞性變更前自動備份資料
 */
export async function updateProject(input: {
  projectId: string
  changes: string
  isDestructive?: boolean
}): Promise<ActionResult<{ projectId: string; status: ProjectStatus; backupCreated?: boolean }>> {
  const { projectId, changes, isDestructive } = input

  const token = await getAuthToken()
  if (!token) {
    return { success: false, error: '未登入' }
  }

  const result = await vpsApi.iterateProject({
    projectId,
    changes,
    isDestructive,
    token,
  })

  if (!result.success || !result.data) {
    return { success: false, error: result.error || '迭代修改失敗' }
  }

  return {
    success: true,
    data: {
      projectId: result.data.projectId,
      status: result.data.status as ProjectStatus,
      backupCreated: result.data.backupCreated
    }
  }
}

/**
 * 取消訂閱
 * - 後置：取消後訂閱狀態變為 suspended
 * - 後置：暫停期內可重新訂閱恢復
 */
export async function cancelSubscription(input: {
  userId: string
  action?: 'cancel' | 'resubscribe'
}): Promise<ActionResult<{ userId: string; status: SubscriptionStatus }>> {
  const { userId, action = 'cancel' } = input

  const token = await getAuthToken()
  if (!token) {
    return { success: false, error: '未登入' }
  }

  const result = await vpsApi.subscriptionAction({
    action,
    token,
  })

  if (!result.success || !result.data) {
    return { success: false, error: result.error || '訂閱操作失敗' }
  }

  return {
    success: true,
    data: {
      userId: result.data.userId,
      status: result.data.status as SubscriptionStatus
    }
  }
}

/**
 * 導出資料
 * - 前置：僅專案擁有者可導出
 * - 前置：暫停期內可導出資料
 */
export async function exportData(input: {
  userId: string
  format: 'sql' | 'json'
  projectId?: string
  requestUserId?: string
}): Promise<ActionResult<{ downloadUrl: string; format: string }>> {
  const { format, projectId } = input

  const token = await getAuthToken()
  if (!token) {
    return { success: false, error: '未登入' }
  }

  const result = await vpsApi.exportData({ format, projectId, token })

  if (!result.success || !result.data) {
    return { success: false, error: result.error || '導出資料失敗' }
  }

  return {
    success: true,
    data: result.data
  }
}

/**
 * 移轉資源
 * - 前置：訂閱狀態必須為 active
 * - 前置：已移轉的專案不可再次移轉
 * - 後置：自助移轉：用戶輸入 API Key 後自動執行
 */
export async function transferResources(input: {
  projectId: string
  targetUserId: string
  dbApiKey?: string
  vercelToken?: string
}): Promise<ActionResult<{ projectId: string; transferred: boolean }>> {
  const { projectId, dbApiKey, vercelToken } = input

  const token = await getAuthToken()
  if (!token) {
    return { success: false, error: '未登入' }
  }

  if (!dbApiKey || !vercelToken) {
    return { success: false, error: 'API Key 無效' }
  }

  const result = await vpsApi.transferResources({
    projectId,
    dbApiKey,
    vercelToken,
    token,
  })

  if (!result.success || !result.data) {
    return { success: false, error: result.error || '移轉資源失敗' }
  }

  return {
    success: true,
    data: result.data
  }
}

// ============================================================
// Orchestrator Actions
// ============================================================

/**
 * 建立任務
 * - 前置：用戶訂閱狀態必須為 active
 * - 前置：任務屬於專案
 * - 後置：系統自動規劃執行步驟
 */
export async function createTask(input: {
  projectId: string
  goal: string
  userId?: string
}): Promise<ActionResult<{ taskId: string; status: TaskStatus; stepCount?: number; calculatedPriority?: number }>> {
  const { projectId, goal } = input

  const token = await getAuthToken()
  if (!token) {
    return { success: false, error: '未登入' }
  }

  const result = await vpsApi.createTaskFull({
    projectId,
    goal,
    token,
  })

  if (!result.success || !result.data) {
    return { success: false, error: result.error || '建立任務失敗' }
  }

  return {
    success: true,
    data: {
      taskId: result.data.taskId,
      status: result.data.status as TaskStatus,
      stepCount: result.data.stepCount,
      calculatedPriority: result.data.calculatedPriority
    }
  }
}

/**
 * 確認計劃
 * - 前置：任務狀態必須為 pending_approval
 * - 前置：僅任務擁有者可確認
 * - 後置：拒絕計劃時任務取消
 */
export async function confirmTaskPlan(input: {
  taskId: string
  approved: boolean
  requestUserId?: string
}): Promise<ActionResult<{ taskId: string; status: TaskStatus }>> {
  const { taskId, approved } = input

  const token = await getAuthToken()
  if (!token) {
    return { success: false, error: '未登入' }
  }

  const result = await vpsApi.confirmTaskPlan({
    taskId,
    approved,
    token,
  })

  if (!result.success || !result.data) {
    return { success: false, error: result.error || '確認任務失敗' }
  }

  return {
    success: true,
    data: {
      taskId: result.data.taskId,
      status: result.data.status as TaskStatus
    }
  }
}

/**
 * 取消任務
 * - 前置：已完成或已取消的任務無法再取消
 * - 後置：取消任務，保留已完成步驟
 * - 後置：取消時發送通知
 */
export async function cancelTask(input: {
  taskId: string
}): Promise<ActionResult<{ taskId: string; status: TaskStatus }>> {
  const { taskId } = input

  const token = await getAuthToken()
  if (!token) {
    return { success: false, error: '未登入' }
  }

  const result = await vpsApi.cancelTask({
    taskId,
    token,
  })

  if (!result.success || !result.data) {
    return { success: false, error: result.error || '取消任務失敗' }
  }

  return {
    success: true,
    data: {
      taskId: result.data.taskId,
      status: result.data.status as TaskStatus
    }
  }
}

/**
 * 重試任務
 * - 前置：只有 failed 狀態的任務可重試
 * - 後置：從失敗點重試，不重跑已完成步驟
 */
export async function retryTask(input: {
  taskId: string
}): Promise<ActionResult<{ taskId: string; status: TaskStatus; currentStep?: number }>> {
  const { taskId } = input

  const token = await getAuthToken()
  if (!token) {
    return { success: false, error: '未登入' }
  }

  const result = await vpsApi.retryTask({
    taskId,
    token,
  })

  if (!result.success || !result.data) {
    return { success: false, error: result.error || '重試任務失敗' }
  }

  return {
    success: true,
    data: {
      taskId: result.data.taskId,
      status: result.data.status as TaskStatus,
      currentStep: result.data.currentStep
    }
  }
}

/**
 * 註冊技能
 * - 前置：技能名稱不可重複
 * - 後置：自動生成描述的 embedding 向量
 */
export async function registerSkill(input: {
  name: string
  displayName: string
  description: string
  minPlan?: 'free' | 'creator' | 'pro' | 'business'
  costLevel?: 'low' | 'medium' | 'high'
  timeoutMs?: number
}): Promise<ActionResult<{ skillId: string; name: string; status: string; hasEmbedding?: boolean }>> {
  const { name, description } = input

  const token = await getAuthToken()
  if (!token) {
    return { success: false, error: '未登入' }
  }

  const result = await vpsApi.registerSkill({
    name,
    description,
    version: '1.0.0',
    token,
  })

  if (!result.success || !result.data) {
    return { success: false, error: result.error || '註冊技能失敗' }
  }

  return {
    success: true,
    data: {
      skillId: result.data.skillId,
      name,
      status: result.data.status,
      hasEmbedding: true
    }
  }
}

/**
 * 配置 Webhook
 * - 前置：URL 必須是有效的 HTTPS
 * - 後置：成功配置/更新/停用 Webhook
 */
export async function configureWebhook(input: {
  userId?: string
  webhookId?: string
  url?: string
  events?: string
  isActive?: boolean
}): Promise<ActionResult<{ webhookId: string; url?: string; isActive: boolean }>> {
  const { url, events } = input

  // 前置：URL 必須是 HTTPS
  if (url && !url.startsWith('https://')) {
    return { success: false, error: 'URL 必須是 HTTPS' }
  }

  const token = await getAuthToken()
  if (!token) {
    return { success: false, error: '未登入' }
  }

  if (!url || !events) {
    return { success: false, error: '缺少必要參數' }
  }

  const result = await vpsApi.configureWebhook({
    url,
    events: events.split(','),
    token,
  })

  if (!result.success || !result.data) {
    return { success: false, error: result.error || '配置 Webhook 失敗' }
  }

  return {
    success: true,
    data: {
      webhookId: result.data.webhookId,
      url,
      isActive: true
    }
  }
}

// ============================================================
// Chat 串接 VPS Backend Actions
// ============================================================

const VPS_API_URL = process.env.VPS_API_URL || 'http://54.238.4.117:8080'

/**
 * 呼叫 VPS API 觸發訊息處理（取代 Inngest）
 */
async function triggerVpsMessage(input: {
  projectId: string
  conversationId: string
  userId: string
  message: string
}): Promise<void> {
  const response = await fetch(`${VPS_API_URL}/api/conversation/${input.conversationId}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId: input.projectId,
      userId: input.userId,
      message: input.message,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`VPS API error: ${error}`)
  }
}

/**
 * 呼叫 VPS API 觸發回覆處理（取代 Inngest）
 */
async function triggerVpsReply(input: {
  projectId: string
  conversationId: string
  userId: string
  taskId: string
  message: string
  specConfirmed?: boolean
}): Promise<void> {
  const response = await fetch(`${VPS_API_URL}/api/conversation/${input.conversationId}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId: input.projectId,
      userId: input.userId,
      taskId: input.taskId,
      message: input.message,
      specConfirmed: input.specConfirmed,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`VPS API error: ${error}`)
  }
}

/**
 * 初始化會話
 * - 創建或獲取匿名用戶
 * - 創建或獲取專案
 * - 創建或恢復對話
 *
 * @param anonymousId - 匿名用戶 ID
 * @param conversationId - 可選，恢復指定對話
 * @param createNew - 可選，強制創建新對話
 */
export async function initializeSession(input: {
  anonymousId?: string
  conversationId?: string
  createNew?: boolean
}): Promise<ActionResult<{
  userId: string
  projectId: string
  conversationId: string
  isNew: boolean
  hasHistory: boolean
}>> {
  const { anonymousId, conversationId, createNew = false } = input

  if (!anonymousId) {
    return { success: false, error: '缺少 anonymousId' }
  }

  const result = await vpsApi.initializeSession({
    anonymousId,
    conversationId,
    createNew,
  })

  if (!result.success || !result.data) {
    return { success: false, error: result.error || '初始化會話失敗' }
  }

  const data = result.data
  return {
    success: true,
    data: {
      userId: data.userId,
      projectId: data.projectId,
      conversationId: data.conversationId,
      isNew: data.isNewUser || data.isNewConversation,
      hasHistory: data.resumed || (data.messages && data.messages.length > 0)
    }
  }
}

/**
 * 從認證 Session 初始化會話
 * - 從 Supabase Auth 讀取當前登入用戶
 * - 創建或獲取專案和對話
 * - 支援帳號合併（將匿名用戶資料遷移到認證帳號）
 * - 用於已登入用戶
 *
 * @param anonymousId - 可選，用於帳號合併的匿名用戶 ID
 * @param conversationId - 可選，恢復指定對話
 * @param createNew - 可選，強制創建新對話
 */
export async function initializeSessionFromAuth(input?: {
  anonymousId?: string
  conversationId?: string
  createNew?: boolean
}): Promise<ActionResult<{
  userId: string
  projectId: string
  conversationId: string
  isNew: boolean
  isAuthenticated: boolean
  hasHistory: boolean
  migrationResult?: {
    migratedProjects: number
    migratedConversations: number
  }
  user?: {
    email?: string
    name?: string
    avatarUrl?: string
  }
}>> {
  const { anonymousId, conversationId, createNew = false } = input || {}

  const token = await getAuthToken()
  if (!token) {
    return { success: false, error: '未登入' }
  }

  const authUser = await getCurrentUser()
  if (!authUser) {
    return { success: false, error: '未登入' }
  }

  // 使用 VPS API 初始化會話（帶 token 表示已認證用戶）
  const result = await vpsApi.initializeSession({
    anonymousId,
    conversationId,
    createNew,
    token,
  })

  if (!result.success || !result.data) {
    return { success: false, error: result.error || '初始化會話失敗' }
  }

  const data = result.data

  // 如果有 anonymousId，執行帳號合併
  let migrationResult: { migratedProjects: number; migratedConversations: number } | undefined
  if (anonymousId) {
    const migration = await migrateAnonymousAccount({
      authUserId: data.userId,
      anonymousId
    })
    if (migration.success && migration.data) {
      migrationResult = migration.data
    }
  }

  return {
    success: true,
    data: {
      userId: data.userId,
      projectId: data.projectId,
      conversationId: data.conversationId,
      isNew: data.isNewUser || data.isNewConversation,
      isAuthenticated: true,
      hasHistory: data.resumed || (data.messages && data.messages.length > 0),
      migrationResult,
      user: {
        email: authUser.email,
        name: authUser.name,
        avatarUrl: undefined
      }
    }
  }
}

/**
 * 取得當前認證用戶（Server Action 版本）
 * - 用於前端檢查登入狀態
 * - 包含 isAdmin 狀態避免前端重複查詢
 * - 透過 VPS API 取得，避免直連資料庫
 */
export async function getCurrentUserAction(): Promise<ActionResult<{
  userId: string
  email?: string
  name?: string
  avatarUrl?: string
  isAdmin: boolean
} | null>> {
  try {
    const token = await getAuthToken()

    if (!token) {
      return { success: true, data: null }
    }

    const result = await vpsApi.getCurrentUserFromVps({ token })

    if (!result.success || !result.data) {
      return { success: true, data: null }
    }

    return { success: true, data: result.data }
  } catch (error) {
    console.error('[getCurrentUserAction] 錯誤:', error)
    return { success: true, data: null }
  }
}

/**
 * 遷移匿名帳號到認證帳號
 * - 將訪客的專案和對話遷移到認證帳號
 * - 處理同名專案衝突（重命名）
 * - 標記原訪客帳號為 cancelled
 * - 透過 VPS API 執行，避免直連資料庫
 */
export async function migrateAnonymousAccount(input: {
  authUserId: string
  anonymousId: string
}): Promise<ActionResult<{
  migratedProjects: number
  migratedConversations: number
}>> {
  try {
    const token = await getAuthToken()

    if (!token) {
      return { success: false, error: '未登入' }
    }

    const result = await vpsApi.migrateAnonymousAccount({
      token,
      anonymousId: input.anonymousId,
    })

    if (!result.success || !result.data) {
      return { success: false, error: result.error || '遷移失敗' }
    }

    return { success: true, data: result.data }
  } catch (error) {
    console.error('[migrateAnonymousAccount] 錯誤:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * 登出
 * JWT 模式下，登出由前端清除 localStorage 和 cookie 處理
 * 這個 action 只是一個 placeholder
 */
export async function signOut(): Promise<ActionResult<null>> {
  // JWT 模式下，登出主要由前端處理（清除 localStorage 和 cookie）
  // 這裡可以添加任何服務端清理邏輯（如：加入 token 黑名單）
  return { success: true, data: null }
}

/**
 * 發送消息並觸發 Inngest
 * - 存消息到 DB
 * - 觸發 user/request 事件
 * - userId 為可選：如未提供，從認證 session 讀取
 */
export async function sendMessageAndTrigger(input: {
  conversationId: string
  content: string
  userId?: string // 可選，未提供時從 session 讀取
  projectId: string
}): Promise<ActionResult<{ messageId: string }>> {
  const { conversationId, content, projectId } = input

  const token = await getAuthToken()

  // 使用 VPS API 發送消息（sendMessage 會處理消息存儲和觸發後端）
  const result = await vpsApi.sendMessage({
    conversationId,
    projectId,
    message: content,
    token: token || undefined,
  })

  if (!result.success || !result.data) {
    return { success: false, error: result.error || '發送消息失敗' }
  }

  return {
    success: true,
    data: { messageId: result.data.messageId || crypto.randomUUID() }
  }
}

/**
 * 多輪對話回覆
 * - 存消息到 DB
 * - 觸發 VPS Backend reply
 */
export async function replyToConversation(input: {
  conversationId: string
  projectId: string
  userId: string
  taskId: string
  content: string
  specConfirmed?: boolean
}): Promise<ActionResult<{ messageId: string }>> {
  const { conversationId, projectId, taskId, content, specConfirmed } = input

  const token = await getAuthToken()

  // 使用 VPS API 發送回覆
  const result = await vpsApi.replyToConversation({
    conversationId,
    projectId,
    taskId,
    message: content,
    specConfirmed,
    token: token || undefined,
  })

  if (!result.success || !result.data) {
    return { success: false, error: result.error || '回覆失敗' }
  }

  return {
    success: true,
    data: { messageId: result.data.messageId || crypto.randomUUID() }
  }
}

/**
 * 獲取用戶所有對話列表
 * - 用於顯示歷史對話選擇器
 * - 支援匿名用戶和已登入用戶
 */
export async function getUserConversations(input: {
  userId: string
  limit?: number
}): Promise<ActionResult<{
  conversations: Array<{
    id: string
    projectId: string
    projectName: string
    lastMessage?: string
    messageCount: number
    updatedAt: string
    createdAt: string
  }>
  hasMore: boolean
}>> {
  const token = await getAuthToken()
  const result = await vpsApi.getUserConversations({
    token: token || undefined,
  })

  if (!result.success || !result.data) {
    return { success: false, error: result.error || '獲取對話列表失敗' }
  }

  const conversations = result.data.conversations.map((c: any) => ({
    id: c.id,
    projectId: c.projectId,
    projectName: c.projectName,
    lastMessage: c.lastMessage || undefined,
    messageCount: c.messageCount,
    updatedAt: c.updatedAt,
    createdAt: c.updatedAt, // API 可能沒有 createdAt，用 updatedAt 代替
  }))

  return {
    success: true,
    data: {
      conversations,
      hasMore: false, // VPS API 目前不支援分頁
    }
  }
}

/**
 * 獲取對話消息（用於輪詢）
 * - 返回消息列表
 * - 返回當前活躍的 taskId
 * - 優化：先檢查 updated_at，若無更新則跳過載入 messages
 */
export async function getConversationMessages(input: {
  conversationId: string
  afterTimestamp?: string
  lastUpdatedAt?: string  // 新增：上次查詢時的 updated_at
}): Promise<ActionResult<{
  messages: Array<{
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: string
    stage?: string
    progress?: { current: number; total: number; step: string }
  }>
  currentTaskId?: string
  taskStatus?: string
  updatedAt?: string  // 返回當前 updated_at 供下次比對
  isComplete?: boolean  // 對話是否已完成（spec_complete），用於停止輪詢
}>> {
  const { conversationId, afterTimestamp, lastUpdatedAt } = input

  const token = await getAuthToken()

  // 使用 VPS API 獲取對話消息（帶任務狀態）
  const result = await vpsApi.getConversationMessagesWithTask({
    conversationId,
    lastUpdatedAt,
    token: token || undefined,
  })

  if (!result.success || !result.data) {
    return { success: false, error: result.error || '獲取消息失敗' }
  }

  const data = result.data

  // 如果 API 返回 noChange，表示沒有更新
  if (data.noChange) {
    return {
      success: true,
      data: {
        messages: [],
        currentTaskId: data.currentTaskId,
        taskStatus: data.taskStatus,
        updatedAt: data.updatedAt,
        isComplete: data.specComplete && !data.currentTaskId
      }
    }
  }

  let messages = data.messages || []

  // 如果有 afterTimestamp，只返回之後的消息
  if (afterTimestamp) {
    messages = messages.filter((m: { timestamp: string }) => m.timestamp > afterTimestamp)
  }

  // 使用 bddSessionId 作為 currentTaskId（如果沒有 task）
  const activeSessionId = data.currentTaskId || data.bddSessionId
  const sessionStatus = data.taskStatus || data.bddPhase

  return {
    success: true,
    data: {
      messages,
      currentTaskId: activeSessionId,
      taskStatus: sessionStatus,
      updatedAt: data.updatedAt,
      isComplete: data.specComplete && !activeSessionId
    }
  }
}

// ============================================================
// 用戶儀表板 Actions
// ============================================================

/**
 * 獲取當前用戶統計
 * 透過 VPS API 取得，避免直連資料庫
 */
export async function getUserStats(): Promise<ActionResult<{
  totalProjects: number
  totalConversations: number
  totalDeployments: number
  messageUsage: {
    used: number
    limit: number
    plan: string
  }
}>> {
  try {
    const token = await getAuthToken()

    if (!token) {
      return { success: false, error: '未登入' }
    }

    const result = await vpsApi.getDashboardStats({ token })

    if (!result.success || !result.data) {
      return { success: false, error: result.error || '獲取統計失敗' }
    }

    return {
      success: true,
      data: {
        totalProjects: result.data.stats.totalProjects,
        totalConversations: result.data.stats.totalConversations,
        totalDeployments: result.data.stats.totalDeployments,
        messageUsage: result.data.stats.messageUsage
      }
    }
  } catch (error) {
    console.error('[getUserStats] 錯誤:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * 獲取當前用戶的專案列表
 * 透過 VPS API 取得，避免直連資料庫
 */
export async function getUserProjects(params: {
  page?: number
  pageSize?: number
  status?: string
} = {}): Promise<ActionResult<{
  projects: Array<{
    id: string
    name: string
    description: string | null
    status: ProjectStatus
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
  try {
    const token = await getAuthToken()

    if (!token) {
      return { success: false, error: '未登入' }
    }

    const result = await vpsApi.getProjects({
      token,
      page: params.page,
      pageSize: params.pageSize,
      status: params.status,
    })

    if (!result.success || !result.data) {
      return { success: false, error: result.error || '獲取專案列表失敗' }
    }

    return {
      success: true,
      data: {
        projects: result.data.projects.map(p => ({
          ...p,
          status: p.status as ProjectStatus,
        })),
        total: result.data.total,
        page: result.data.page,
        pageSize: result.data.pageSize
      }
    }
  } catch (error) {
    console.error('[getUserProjects] 錯誤:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * 獲取專案提醒（用於首頁顯示待處理專案）
 * 支援匿名用戶和已登入用戶
 */
export async function getProjectReminder(input: {
  anonymousId?: string
} = {}): Promise<ActionResult<{
  hasReminder: boolean
  reminder?: {
    type: 'in_progress' | 'completed' | 'failed'
    projectId: string
    projectName: string
    conversationId?: string
    message: string
    url?: string
    updatedAt: string
  }
}>> {
  const { anonymousId } = input

  const token = await getAuthToken()

  // 使用 VPS API 獲取專案提醒
  const result = await vpsApi.getProjectReminder({
    anonymousId,
    token: token || undefined,
  })

  if (!result.success || !result.data) {
    return { success: true, data: { hasReminder: false } }
  }

  const reminder = result.data.reminder

  if (!reminder) {
    return { success: true, data: { hasReminder: false } }
  }

  return {
    success: true,
    data: {
      hasReminder: true,
      reminder: {
        type: reminder.type,
        projectId: reminder.projectId,
        projectName: reminder.projectName,
        message: reminder.message,
        url: reminder.url,
        updatedAt: new Date().toISOString()
      }
    }
  }
}

/**
 * 獲取專案詳情
 */
export async function getProjectDetail(projectId: string): Promise<ActionResult<{
  project: {
    id: string
    name: string
    description: string | null
    status: ProjectStatus
    vercelUrl: string | null
    customDomain: string | null
    domainStatus: string | null
    createdAt: string
    updatedAt: string
  }
  conversations: Array<{
    id: string
    messageCount: number
    specComplete: boolean
    lastMessage: string | null
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
  const token = await getAuthToken()

  if (!token) {
    return { success: false, error: '未登入' }
  }

  const result = await vpsApi.getProjectDetail({ projectId, token })

  if (!result.success || !result.data) {
    return { success: false, error: result.error || '獲取專案詳情失敗' }
  }

  const { project, conversations, deployments, generations } = result.data

  return {
    success: true,
    data: {
      project: {
        ...project,
        status: project.status as ProjectStatus,
      },
      conversations: conversations.map((c: any) => {
        const messages = c.messages || []
        const lastUserMessage = [...messages].reverse().find((m: { role: string; content: string }) => m.role === 'user')
        return {
          id: c.id,
          messageCount: messages.length,
          specComplete: c.specComplete,
          lastMessage: lastUserMessage?.content?.slice(0, 100) || null,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt
        }
      }),
      deployments,
      generations,
    }
  }
}

// ============================================================
// 部署整合 Actions
// ============================================================

/**
 * 從資料庫取得專案 Schema
 * 優先從 generations 表讀取，否則返回空字串
 */
async function getProjectSchema(_projectId: string): Promise<string> {
  // TODO: 透過 VPS API 從 Storage 讀取 schema
  // 暫時返回空 schema（用模板）
  return ''
}

/**
 * 從資料庫或模板取得專案檔案
 */
async function getProjectFiles(projectId: string): Promise<Array<{ file: string; data: string }>> {
  // 優先從 Storage 讀取
  // TODO: 實作 VPS API Storage 讀取

  // 暫時使用模板，透過 VPS API 取得專案名稱
  const token = await getAuthToken()
  if (token) {
    const result = await vpsApi.getProject({ projectId, token })
    if (result.success && result.data) {
      return generateNextJsTemplate(result.data.project.name || 'my-app', '')
    }
  }

  return generateNextJsTemplate('my-app', '')
}

/**
 * 從資料庫部署專案（整合真正的 Vercel API）
 * - 前置：專案狀態必須為 testing
 * - 後置：部署成功後更新專案的 Vercel/Supabase 資訊
 */
export async function deployProjectFromDb(input: {
  projectId: string
}): Promise<ActionResult<{ deploymentId: string; url?: string; status: string }>> {
  const { projectId } = input

  const token = await getAuthToken()
  if (!token) {
    return { success: false, error: '未登入' }
  }

  // 1. 透過 VPS API 查詢專案資訊
  const projectResult = await vpsApi.getProject({ projectId, token })

  if (!projectResult.success || !projectResult.data) {
    return { success: false, error: projectResult.error || '專案不存在' }
  }

  const project = projectResult.data.project

  // 2. 前置條件檢查
  if (project.status !== 'testing') {
    return { success: false, error: '專案狀態必須為 testing' }
  }

  // 3. 讀取 schema
  const schema = await getProjectSchema(projectId)

  // 4. 讀取或生成程式碼
  const files = await getProjectFiles(projectId)

  // 5. 呼叫真正的部署 API
  const result = await deployProjectReal({
    name: project.name,
    schema,
    files,
  })

  // 6. 根據結果透過 VPS API 更新狀態
  if (result.stage === 'complete') {
    await vpsApi.updateProjectStatus({
      projectId,
      status: 'deployed',
      vercelUrl: result.deploymentUrl,
      token,
    })

    return {
      success: true,
      data: {
        deploymentId: result.vercelProjectId || '',
        url: result.deploymentUrl,
        status: result.stage,
      },
    }
  }

  // 部署失敗
  return {
    success: false,
    data: {
      deploymentId: '',
      url: undefined,
      status: result.stage,
    },
    error: result.error || result.message,
  }
}

// ============================================================
// BDD Session Actions
// ============================================================

import type { ClarifyItem } from '../lib/llm'

// BDD Session 階段類型
type BddPhase =
  | 'prd_discovery'
  | 'prd_clarify'
  | 'formulation'
  | 'spec_discovery'
  | 'spec_clarify'
  | 'actions_design'
  | 'isa_config'
  | 'uiux'
  | 'completed'

// BDD Session 資料結構
interface BddSession {
  id: string
  projectId: string | null
  conversationId: string
  taskId?: string | null
  currentPhase: BddPhase
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
  projectId: string
  conversationId: string
  taskId?: string
  originalRequirements: string
  projectContext?: string
}): Promise<ActionResult<{ sessionId: string }>> {
  const { projectId, conversationId, taskId, originalRequirements, projectContext } = input

  const token = await getAuthToken()
  const result = await vpsApi.createBddSession({
    conversationId,
    projectId,
    taskId,
    originalRequirements,
    projectContext: projectContext ? JSON.parse(projectContext) : undefined,
    token: token || undefined,
  })

  if (!result.success || !result.data) {
    return { success: false, error: result.error || '創建 BDD Session 失敗' }
  }

  return { success: true, data: { sessionId: result.data.sessionId } }
}

/**
 * 獲取 BDD Session
 */
export async function getBddSession(input: {
  sessionId?: string
  conversationId?: string
  projectId?: string
}): Promise<ActionResult<BddSession | null>> {
  const { sessionId, conversationId, projectId } = input

  const token = await getAuthToken()
  const result = await vpsApi.getBddSession({
    sessionId,
    conversationId,
    projectId,
    token: token || undefined,
  })

  if (!result.success) {
    return { success: false, error: result.error }
  }

  // 轉換 VPS API 返回的 session 為本地類型
  const session = result.data?.session
  if (!session) {
    return { success: true, data: null }
  }

  return {
    success: true,
    data: {
      ...session,
      currentPhase: session.currentPhase as BddPhase,
      clarifyItems: session.clarifyItems as unknown as ClarifyItem[],
      stagingItems: session.stagingItems as unknown as ClarifyItem[],
      resolvedItems: session.resolvedItems as unknown as ClarifyItem[],
    } as BddSession
  }
}

/**
 * 更新 BDD Session
 */
export async function updateBddSession(input: {
  sessionId: string
  updates: Partial<{
    currentPhase: BddPhase
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
    featuresContent: Array<{ name: string; actionName?: string; content: string }>
    actionsYmlContent: string
    isaConfigContent: string
    validationResult: { passed: boolean; errors: string[]; warnings: string[] }
  }>
}): Promise<ActionResult<null>> {
  const { sessionId, updates } = input

  const token = await getAuthToken()
  const result = await vpsApi.updateBddSession({
    sessionId,
    updates: updates as any,
    token: token || undefined,
  })

  if (!result.success) {
    return { success: false, error: result.error }
  }

  return { success: true, data: null }
}

/**
 * 記錄釐清項目的回答
 * 將項目移到 staging 區
 */
export async function answerClarifyItem(input: {
  sessionId: string
  itemId: string
  answer: string
}): Promise<ActionResult<null>> {
  const { sessionId, itemId, answer } = input

  // 讀取當前 session
  const sessionResult = await getBddSession({ sessionId })
  if (!sessionResult.success || !sessionResult.data) {
    return { success: false, error: sessionResult.error || 'Session 不存在' }
  }

  const session = sessionResult.data
  const clarifyItems = [...session.clarifyItems]
  const stagingItems = [...session.stagingItems]

  // 找到並更新項目
  const itemIndex = clarifyItems.findIndex(item => item.id === itemId)
  if (itemIndex === -1) {
    return { success: false, error: '找不到釐清項目' }
  }

  const item = clarifyItems[itemIndex]
  item.answer = answer
  item.status = 'reviewing'
  item.answeredAt = new Date().toISOString()

  // 移到 staging
  clarifyItems.splice(itemIndex, 1)
  stagingItems.push(item)

  // 更新 session
  return await updateBddSession({
    sessionId,
    updates: {
      clarifyItems,
      stagingItems,
      currentQuestionIndex: session.currentQuestionIndex + 1,
    },
  })
}

/**
 * 批量確認釐清項目
 * 將 staging 區的項目移到 resolved 區
 */
export async function confirmBatch(input: {
  sessionId: string
  itemIds?: string[]  // 如果不提供，確認所有 staging 項目
}): Promise<ActionResult<{ confirmedCount: number }>> {
  const { sessionId, itemIds } = input

  // 讀取當前 session
  const sessionResult = await getBddSession({ sessionId })
  if (!sessionResult.success || !sessionResult.data) {
    return { success: false, error: sessionResult.error || 'Session 不存在' }
  }

  const session = sessionResult.data
  let stagingItems = [...session.stagingItems]
  const resolvedItems = [...session.resolvedItems]

  // 確認項目
  let confirmedCount = 0
  if (itemIds) {
    // 確認指定項目
    const toConfirm = stagingItems.filter(item => itemIds.includes(item.id))
    stagingItems = stagingItems.filter(item => !itemIds.includes(item.id))
    toConfirm.forEach(item => {
      item.status = 'resolved'
      resolvedItems.push(item)
      confirmedCount++
    })
  } else {
    // 確認所有 staging 項目
    stagingItems.forEach(item => {
      item.status = 'resolved'
      resolvedItems.push(item)
      confirmedCount++
    })
    stagingItems = []
  }

  // 更新 session
  await updateBddSession({
    sessionId,
    updates: {
      stagingItems,
      resolvedItems,
      totalResolved: session.totalResolved + confirmedCount,
    },
  })

  return { success: true, data: { confirmedCount } }
}

/**
 * 撤回答案（反悔）
 * 將項目從 staging 移回 clarify
 */
export async function revertAnswer(input: {
  sessionId: string
  itemId: string
}): Promise<ActionResult<null>> {
  const { sessionId, itemId } = input

  // 讀取當前 session
  const sessionResult = await getBddSession({ sessionId })
  if (!sessionResult.success || !sessionResult.data) {
    return { success: false, error: sessionResult.error || 'Session 不存在' }
  }

  const session = sessionResult.data
  const clarifyItems = [...session.clarifyItems]
  const stagingItems = [...session.stagingItems]

  // 找到項目
  const itemIndex = stagingItems.findIndex(item => item.id === itemId)
  if (itemIndex === -1) {
    return { success: false, error: '找不到待確認的項目' }
  }

  const item = stagingItems[itemIndex]
  item.status = 'pending'
  item.answer = undefined
  item.answeredAt = undefined

  // 移回 clarify
  stagingItems.splice(itemIndex, 1)
  clarifyItems.unshift(item)  // 放到最前面，讓用戶重新回答

  // 更新 session
  return await updateBddSession({
    sessionId,
    updates: {
      clarifyItems,
      stagingItems,
      currentQuestionIndex: Math.max(0, session.currentQuestionIndex - 1),
    },
  })
}

/**
 * 跳過釐清項目
 */
export async function skipClarifyItem(input: {
  sessionId: string
  itemId: string
}): Promise<ActionResult<null>> {
  const { sessionId, itemId } = input

  // 讀取當前 session
  const sessionResult = await getBddSession({ sessionId })
  if (!sessionResult.success || !sessionResult.data) {
    return { success: false, error: sessionResult.error || 'Session 不存在' }
  }

  const session = sessionResult.data
  const clarifyItems = [...session.clarifyItems]
  const resolvedItems = [...session.resolvedItems]

  // 找到並更新項目
  const itemIndex = clarifyItems.findIndex(item => item.id === itemId)
  if (itemIndex === -1) {
    return { success: false, error: '找不到釐清項目' }
  }

  const item = clarifyItems[itemIndex]
  item.status = 'skipped'

  // 移到 resolved
  clarifyItems.splice(itemIndex, 1)
  resolvedItems.push(item)

  // 更新 session
  return await updateBddSession({
    sessionId,
    updates: {
      clarifyItems,
      resolvedItems,
      currentQuestionIndex: session.currentQuestionIndex + 1,
    },
  })
}

/**
 * 添加新的釐清項目（Discovery 階段產出）
 * 包含去重邏輯，避免語意相似的問題重複出現
 */
export async function addClarifyItems(input: {
  sessionId: string
  items: ClarifyItem[]
}): Promise<ActionResult<{ addedCount: number; duplicatesRemoved: number }>> {
  const { sessionId, items } = input

  // 讀取當前 session
  const sessionResult = await getBddSession({ sessionId })
  if (!sessionResult.success || !sessionResult.data) {
    return { success: false, error: sessionResult.error || 'Session 不存在' }
  }

  const session = sessionResult.data

  // 收集所有現有問題（用於去重）
  const allExistingItems = [
    ...session.clarifyItems,
    ...session.stagingItems,
    ...session.resolvedItems,
  ]

  // 提取問題核心關鍵詞（移除問法相關的詞彙）
  const extractKeywords = (text: string): Set<string> => {
    // 移除常見問法詞彙
    const stopWords = [
      '請問', '是否', '需要', '可以', '應該', '會', '要', '能', '嗎', '呢', '還是',
      '例如', '比如', '這個', '那個', '什麼', '哪些', '如何', '怎麼', '怎樣',
      '的', '了', '在', '是', '有', '和', '與', '或', '等', '以', '為', '從', '到',
    ]
    const normalized = text
      .toLowerCase()
      .replace(/[，。？！、：；""''（）\[\]【】\s,.?!:;"'()\[\]\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= 2 && !stopWords.includes(word))

    return new Set(normalized)
  }

  // 計算兩個關鍵詞集合的相似度（Jaccard similarity）
  const calculateSimilarity = (set1: Set<string>, set2: Set<string>): number => {
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])
    return union.size > 0 ? intersection.size / union.size : 0
  }

  // 建立現有問題的關鍵詞列表
  const existingKeywordSets = allExistingItems.map(item => ({
    keywords: extractKeywords(item.whiteTextQuestion || item.question),
    text: item.whiteTextQuestion || item.question,
  }))

  // 過濾掉重複或相似的項目
  const uniqueItems = items.filter(item => {
    const newKeywords = extractKeywords(item.whiteTextQuestion || item.question)

    // 檢查是否與任何現有問題相似
    for (const existing of existingKeywordSets) {
      const similarity = calculateSimilarity(newKeywords, existing.keywords)
      if (similarity > 0.6) { // 相似度超過 60% 視為重複
        return false
      }
    }

    // 加入現有列表，避免新項目間重複
    existingKeywordSets.push({
      keywords: newKeywords,
      text: item.whiteTextQuestion || item.question,
    })
    return true
  })

  const duplicatesRemoved = items.length - uniqueItems.length

  if (uniqueItems.length > 0) {
    const clarifyItems = [...session.clarifyItems, ...uniqueItems]

    // 更新 session
    await updateBddSession({
      sessionId,
      updates: {
        clarifyItems,
        totalDiscovered: session.totalDiscovered + uniqueItems.length,
      },
    })
  }

  return { success: true, data: { addedCount: uniqueItems.length, duplicatesRemoved } }
}

/**
 * 獲取當前待回答的釐清項目
 */
export async function getCurrentClarifyItem(input: {
  sessionId: string
}): Promise<ActionResult<ClarifyItem | null>> {
  const { sessionId } = input

  // 讀取當前 session
  const sessionResult = await getBddSession({ sessionId })
  if (!sessionResult.success || !sessionResult.data) {
    return { success: false, error: sessionResult.error || 'Session 不存在' }
  }

  const session = sessionResult.data
  const pendingItems = session.clarifyItems.filter(item => item.status === 'pending')

  if (pendingItems.length === 0) {
    return { success: true, data: null }
  }

  // 按優先級排序：high > medium > low
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  pendingItems.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return { success: true, data: pendingItems[0] }
}

/**
 * 獲取 BDD Session 進度統計
 */
export async function getBddSessionProgress(input: {
  sessionId: string
}): Promise<ActionResult<{
  phase: BddPhase
  round: number
  totalQuestions: number
  answeredQuestions: number
  pendingQuestions: number
  stagingQuestions: number
  progress: number  // 0-100
}>> {
  const { sessionId } = input

  // 讀取當前 session
  const sessionResult = await getBddSession({ sessionId })
  if (!sessionResult.success || !sessionResult.data) {
    return { success: false, error: sessionResult.error || 'Session 不存在' }
  }

  const session = sessionResult.data

  const totalQuestions = session.totalDiscovered
  const pendingQuestions = session.clarifyItems.filter(item => item.status === 'pending').length
  const stagingQuestions = session.stagingItems.length
  const answeredQuestions = session.totalResolved + stagingQuestions

  const progress = totalQuestions > 0
    ? Math.round((answeredQuestions / totalQuestions) * 100)
    : 0

  return {
    success: true,
    data: {
      phase: session.currentPhase,
      round: session.currentRound,
      totalQuestions,
      answeredQuestions,
      pendingQuestions,
      stagingQuestions,
      progress,
    },
  }
}
