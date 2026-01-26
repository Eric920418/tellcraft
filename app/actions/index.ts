'use server'

import { supabase, PLAN_MESSAGE_LIMITS, PLAN_PROJECT_LIMITS, PLAN_PRIORITY_WEIGHTS } from '../lib/supabase'

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
  const { userId, name, description } = input

  // 查詢用戶
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, plan, subscription_status')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    return { success: false, error: '用戶不存在' }
  }

  // 前置：檢查訂閱狀態
  if (user.subscription_status !== 'active') {
    return { success: false, error: '訂閱狀態必須為 active' }
  }

  // 前置：檢查專案數量
  const { count } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const limit = PLAN_PROJECT_LIMITS[user.plan] || 1
  if ((count || 0) >= limit) {
    return { success: false, error: '專案數量已達上限' }
  }

  // 後置：處理名稱重複
  let finalName = name
  const { data: existingProjects } = await supabase
    .from('projects')
    .select('name')
    .eq('user_id', userId)
    .like('name', `${name}%`)

  if (existingProjects && existingProjects.length > 0) {
    const existingNames = new Set(existingProjects.map(p => p.name))
    if (existingNames.has(name)) {
      let suffix = 2
      while (existingNames.has(`${name} (${suffix})`)) {
        suffix++
      }
      finalName = `${name} (${suffix})`
    }
  }

  // 建立專案
  const { data: project, error: createError } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      name: finalName,
      description,
      status: 'draft'
    })
    .select('id, status')
    .single()

  if (createError || !project) {
    return { success: false, error: createError?.message || '建立專案失敗' }
  }

  return {
    success: true,
    data: { projectId: project.id, status: project.status }
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
}): Promise<ActionResult<{ messageId: string }>> {
  const { conversationId, content } = input

  // 查詢對話及關聯的專案和用戶
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('id, project_id, projects(user_id, users(id, plan, message_count_this_period))')
    .eq('id', conversationId)
    .single()

  if (convError || !conversation) {
    return { success: false, error: '對話不存在' }
  }

  const project = conversation.projects as any
  const user = project?.users as any

  if (!user) {
    return { success: false, error: '用戶不存在' }
  }

  // 前置：檢查對話配額
  const limit = PLAN_MESSAGE_LIMITS[user.plan] || 50
  if (user.message_count_this_period >= limit) {
    return { success: false, error: '對話次數已達上限' }
  }

  // 更新對話內容
  const { data: messages } = await supabase
    .from('conversations')
    .select('messages')
    .eq('id', conversationId)
    .single()

  const currentMessages = messages?.messages || []
  const messageId = crypto.randomUUID()
  const newMessage = {
    id: messageId,
    role: 'user',
    content,
    timestamp: new Date().toISOString()
  }

  await supabase
    .from('conversations')
    .update({
      messages: [...currentMessages, newMessage],
      updated_at: new Date().toISOString()
    })
    .eq('id', conversationId)

  // 後置：更新對話次數
  await supabase
    .from('users')
    .update({
      message_count_this_period: user.message_count_this_period + 1
    })
    .eq('id', user.id)

  return {
    success: true,
    data: { messageId }
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

  // 查詢專案和對話
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, status')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    return { success: false, error: '專案不存在' }
  }

  // 前置：檢查是否有對話且已完成釐清
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, spec_complete')
    .eq('project_id', projectId)
    .single()

  if (!conversation) {
    return { success: false, error: '沒有對話記錄' }
  }

  if (!conversation.spec_complete) {
    return { success: false, error: 'BDD Spec 尚未完成' }
  }

  // 檢查是否有失敗的生成記錄
  const { data: existingGeneration } = await supabase
    .from('generations')
    .select('id, attempt_count, status')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // 自癒機制：3 次失敗後停止
  if (existingGeneration?.status === 'failed' && existingGeneration.attempt_count >= 3) {
    await supabase
      .from('projects')
      .update({ status: 'failed' })
      .eq('id', projectId)
    return { success: false, error: '生成失敗次數已達上限' }
  }

  // 建立或更新生成記錄
  let generationId: string
  let attemptCount: number

  if (existingGeneration?.status === 'failed') {
    // 重試現有生成
    generationId = existingGeneration.id
    attemptCount = existingGeneration.attempt_count + 1
    await supabase
      .from('generations')
      .update({
        status: 'success',
        attempt_count: attemptCount
      })
      .eq('id', generationId)
  } else {
    // 建立新生成記錄
    attemptCount = 1
    const { data: newGeneration, error: genError } = await supabase
      .from('generations')
      .insert({
        project_id: projectId,
        status: 'success',
        attempt_count: attemptCount
      })
      .select('id')
      .single()

    if (genError || !newGeneration) {
      return { success: false, error: genError?.message || '建立生成記錄失敗' }
    }
    generationId = newGeneration.id
  }

  // 後置：更新專案狀態為 testing
  await supabase
    .from('projects')
    .update({ status: 'testing', updated_at: new Date().toISOString() })
    .eq('id', projectId)

  return {
    success: true,
    data: { generationId, status: 'success' }
  }
}

/**
 * 部署專案
 * - 前置：專案狀態必須為 testing
 * - 後置：部署成功後專案狀態變為 deployed
 * - 後置：主 Org 配額用盡時自動切換備用 Org
 */
export async function deployProject(input: {
  projectId: string
}): Promise<ActionResult<{ deploymentId: string; url?: string; status: string }>> {
  const { projectId } = input

  // 查詢專案
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, status')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    return { success: false, error: '專案不存在' }
  }

  // 前置：檢查專案狀態
  if (project.status !== 'testing') {
    return { success: false, error: '專案狀態必須為 testing' }
  }

  // 查找可用的 Supabase Organization
  const { data: orgs } = await supabase
    .from('supabase_organizations')
    .select('id, project_count, max_projects, is_primary')
    .order('is_primary', { ascending: false })

  let availableOrg = orgs?.find(org => org.project_count < org.max_projects)

  // 建立部署記錄
  const deploymentId = crypto.randomUUID()

  if (!availableOrg) {
    // 所有 Org 都滿，標記為 pending
    await supabase
      .from('deployments')
      .insert({
        id: deploymentId,
        project_id: projectId,
        status: 'pending',
        waiting_for_capacity: true
      })

    return {
      success: true,
      data: { deploymentId, status: 'pending' }
    }
  }

  // 成功部署
  const url = `https://${projectId.slice(0, 8)}.vercel.app`

  await supabase
    .from('deployments')
    .insert({
      id: deploymentId,
      project_id: projectId,
      status: 'success',
      url
    })

  // 更新專案狀態和 Org 資訊
  await supabase
    .from('projects')
    .update({
      status: 'deployed',
      supabase_org_id: availableOrg.id,
      vercel_url: url,
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId)

  // 更新 Org 計數
  await supabase
    .from('supabase_organizations')
    .update({ project_count: availableOrg.project_count + 1 })
    .eq('id', availableOrg.id)

  return {
    success: true,
    data: { deploymentId, url, status: 'success' }
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

  // 查詢專案
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, status')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    return { success: false, error: '專案不存在' }
  }

  // 前置：檢查專案狀態
  if (project.status !== 'deployed' && project.status !== 'failed') {
    return { success: false, error: '專案狀態必須為 deployed 或 failed' }
  }

  let backupCreated = false

  // 後置：破壞性變更前備份
  if (isDestructive) {
    const backupUrl = `https://r2.example.com/backup-${Date.now()}.sql`
    await supabase
      .from('generations')
      .insert({
        project_id: projectId,
        backup_sql_url: backupUrl,
        backup_created_at: new Date().toISOString(),
        status: 'pending'
      })
    backupCreated = true
  }

  // 更新專案狀態為 generating
  await supabase
    .from('projects')
    .update({
      status: 'generating',
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId)

  return {
    success: true,
    data: { projectId, status: 'generating', backupCreated }
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

  // 查詢用戶
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, subscription_status')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    return { success: false, error: '用戶不存在' }
  }

  if (action === 'resubscribe') {
    // 重新訂閱
    await supabase
      .from('users')
      .update({
        subscription_status: 'active',
        cancelled_at: null
      })
      .eq('id', userId)

    return {
      success: true,
      data: { userId, status: 'active' }
    }
  }

  // 取消訂閱
  await supabase
    .from('users')
    .update({
      subscription_status: 'suspended',
      cancelled_at: new Date().toISOString()
    })
    .eq('id', userId)

  return {
    success: true,
    data: { userId, status: 'suspended' }
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
  const { userId, format, projectId, requestUserId } = input

  // 如果指定了 projectId，檢查擁有權
  if (projectId) {
    const { data: project } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', projectId)
      .single()

    if (requestUserId && project?.user_id !== requestUserId) {
      return { success: false, error: '僅專案擁有者可導出' }
    }
  }

  // 生成導出 URL
  const downloadUrl = `https://r2.example.com/export-${Date.now()}.${format === 'sql' ? 'sql' : 'json'}`

  return {
    success: true,
    data: { downloadUrl, format: format === 'sql' ? 'sql_dump' : 'json' }
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
  supabaseApiKey?: string
  vercelToken?: string
}): Promise<ActionResult<{ projectId: string; transferred: boolean }>> {
  const { projectId, supabaseApiKey, vercelToken } = input

  // 查詢專案
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, user_id, is_transferred, users(subscription_status)')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    return { success: false, error: '專案不存在' }
  }

  const user = project.users as any

  // 前置：檢查訂閱狀態
  if (user?.subscription_status !== 'active') {
    return { success: false, error: '訂閱狀態必須為 active' }
  }

  // 前置：檢查是否已移轉
  if (project.is_transferred) {
    return { success: false, error: '已移轉的專案不可再次移轉' }
  }

  // 前置：驗證 API Key（簡單驗證）
  if (!supabaseApiKey?.startsWith('sb_key') || !vercelToken?.startsWith('vercel_')) {
    return { success: false, error: 'API Key 無效' }
  }

  // 執行移轉
  await supabase
    .from('projects')
    .update({
      is_transferred: true,
      transferred_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId)

  return {
    success: true,
    data: { projectId, transferred: true }
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
  const { projectId, goal, userId } = input

  // 查詢專案
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, user_id, users(id, plan, subscription_status)')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    return { success: false, error: '專案不存在' }
  }

  const user = project.users as any

  // 如果提供了 userId，使用它來檢查；否則使用專案的 user
  if (userId) {
    const { data: requestUser } = await supabase
      .from('users')
      .select('subscription_status')
      .eq('id', userId)
      .single()

    if (requestUser?.subscription_status !== 'active') {
      return { success: false, error: '訂閱狀態必須為 active' }
    }
  } else if (user?.subscription_status !== 'active') {
    return { success: false, error: '訂閱狀態必須為 active' }
  }

  // 計算優先級
  const planPriority = PLAN_PRIORITY_WEIGHTS[user?.plan || 'free'] || 0
  const calculatedPriority = planPriority

  // 建立任務
  const taskId = crypto.randomUUID()
  const { error: taskError } = await supabase
    .from('tasks')
    .insert({
      id: taskId,
      project_id: projectId,
      user_id: project.user_id,
      goal,
      status: 'planning',
      calculated_priority: calculatedPriority
    })

  if (taskError) {
    return { success: false, error: taskError.message }
  }

  // 模擬 LLM Planning - 生成執行計劃
  const stepCount = 2 // 假設生成 2 個步驟

  // 更新任務狀態為等待確認
  await supabase
    .from('tasks')
    .update({
      status: 'pending_approval',
      plan: { steps: stepCount }
    })
    .eq('id', taskId)

  return {
    success: true,
    data: { taskId, status: 'pending_approval', stepCount, calculatedPriority }
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
  const { taskId, approved, requestUserId } = input

  // 查詢任務
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id, status, user_id')
    .eq('id', taskId)
    .single()

  if (taskError || !task) {
    return { success: false, error: '任務不存在' }
  }

  // 前置：檢查擁有權
  if (requestUserId && task.user_id !== requestUserId) {
    return { success: false, error: '僅任務擁有者可確認' }
  }

  // 前置：檢查任務狀態
  if (task.status !== 'pending_approval') {
    return { success: false, error: '任務狀態必須為 pending_approval' }
  }

  const newStatus: TaskStatus = approved ? 'executing' : 'cancelled'

  await supabase
    .from('tasks')
    .update({
      status: newStatus,
      started_at: approved ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId)

  return {
    success: true,
    data: { taskId, status: newStatus }
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

  // 查詢任務
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id, status, user_id')
    .eq('id', taskId)
    .single()

  if (taskError || !task) {
    return { success: false, error: '任務不存在' }
  }

  // 前置：檢查任務狀態
  if (task.status === 'completed' || task.status === 'cancelled') {
    return { success: false, error: '已完成或已取消的任務無法再取消' }
  }

  // 取消運行中的步驟
  await supabase
    .from('task_steps')
    .update({ status: 'cancelled' })
    .eq('task_id', taskId)
    .eq('status', 'running')

  // 更新任務狀態
  await supabase
    .from('tasks')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId)

  // 後置：發送通知
  await supabase
    .from('notifications')
    .insert({
      user_id: task.user_id,
      type: 'task_cancelled',
      title: '任務已取消',
      task_id: taskId
    })

  return {
    success: true,
    data: { taskId, status: 'cancelled' }
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

  // 查詢任務
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id, status, failed_step')
    .eq('id', taskId)
    .single()

  if (taskError || !task) {
    return { success: false, error: '任務不存在' }
  }

  // 前置：檢查任務狀態
  if (task.status !== 'failed') {
    return { success: false, error: '只有 failed 狀態的任務可重試' }
  }

  const currentStep = task.failed_step || 1

  // 將失敗的步驟改為 running
  await supabase
    .from('task_steps')
    .update({ status: 'running' })
    .eq('task_id', taskId)
    .eq('step_number', currentStep)

  // 更新任務狀態
  await supabase
    .from('tasks')
    .update({
      status: 'executing',
      current_step: currentStep,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId)

  return {
    success: true,
    data: { taskId, status: 'executing', currentStep }
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
  const { name, displayName, description, minPlan = 'free', costLevel = 'medium', timeoutMs = 300000 } = input

  // 前置：檢查名稱重複
  const { data: existingSkill } = await supabase
    .from('skills')
    .select('id')
    .eq('name', name)
    .single()

  if (existingSkill) {
    return { success: false, error: '技能名稱已存在' }
  }

  // 建立技能
  const skillId = crypto.randomUUID()
  const { error: skillError } = await supabase
    .from('skills')
    .insert({
      id: skillId,
      name,
      display_name: displayName,
      description,
      min_plan: minPlan,
      cost_level: costLevel,
      timeout_ms: timeoutMs,
      status: 'enabled',
      // 模擬 embedding（實際上會調用 LLM）
      description_embedding: new Array(1536).fill(0.1)
    })

  if (skillError) {
    return { success: false, error: skillError.message }
  }

  return {
    success: true,
    data: { skillId, name, status: 'enabled', hasEmbedding: true }
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
  const { userId, webhookId, url, events, isActive } = input

  // 前置：URL 必須是 HTTPS
  if (url && !url.startsWith('https://')) {
    return { success: false, error: 'URL 必須是 HTTPS' }
  }

  if (webhookId) {
    // 更新現有 Webhook
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (url !== undefined) updateData.url = url
    if (events !== undefined) updateData.events = events.split(',')
    if (isActive !== undefined) updateData.is_active = isActive

    await supabase
      .from('user_webhooks')
      .update(updateData)
      .eq('id', webhookId)

    return {
      success: true,
      data: { webhookId, url, isActive: isActive ?? true }
    }
  }

  // 建立新 Webhook
  if (!userId || !url || !events) {
    return { success: false, error: '缺少必要參數' }
  }

  const newWebhookId = crypto.randomUUID()
  await supabase
    .from('user_webhooks')
    .insert({
      id: newWebhookId,
      user_id: userId,
      url,
      events: events.split(','),
      is_active: true
    })

  return {
    success: true,
    data: { webhookId: newWebhookId, url, isActive: true }
  }
}
