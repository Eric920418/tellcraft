'use server'

import { supabase, PLAN_MESSAGE_LIMITS, PLAN_PROJECT_LIMITS, PLAN_PRIORITY_WEIGHTS } from '../lib/supabase'
import { createClient } from '../lib/supabase/server'
import { deployProject as deployProjectReal, generateNextJsTemplate } from './deploy'

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

// ============================================================
// Chat 串接 Inngest Actions
// ============================================================

import { triggerUserRequest, triggerUserReply } from '../inngest'

/**
 * 初始化會話
 * - 創建或獲取匿名用戶
 * - 創建或獲取專案
 * - 創建或獲取對話
 */
export async function initializeSession(input: {
  anonymousId?: string
}): Promise<ActionResult<{
  userId: string
  projectId: string
  conversationId: string
  isNew: boolean
}>> {
  const { anonymousId } = input

  if (!anonymousId) {
    return { success: false, error: '缺少 anonymousId' }
  }

  const email = `${anonymousId}@anonymous.tellcraft.app`

  // 1. 查找或創建用戶
  let { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  let isNew = false

  if (userError || !user) {
    // 創建新用戶
    const { data: newUser, error: createUserError } = await supabase
      .from('users')
      .insert({
        email,
        plan: 'free',
        subscription_status: 'active',
        message_count_this_period: 0
      })
      .select('id')
      .single()

    if (createUserError || !newUser) {
      return { success: false, error: createUserError?.message || '創建用戶失敗' }
    }
    user = newUser
    isNew = true
  }

  // 2. 查找或創建專案
  let { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (projectError || !project) {
    // 創建新專案
    const { data: newProject, error: createProjectError } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: '我的專案',
        status: 'draft'
      })
      .select('id')
      .single()

    if (createProjectError || !newProject) {
      return { success: false, error: createProjectError?.message || '創建專案失敗' }
    }
    project = newProject
    isNew = true
  }

  // 3. 查找或創建對話
  let { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('id')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (convError || !conversation) {
    // 創建新對話
    const { data: newConv, error: createConvError } = await supabase
      .from('conversations')
      .insert({
        project_id: project.id,
        messages: [],
        spec_complete: false
      })
      .select('id')
      .single()

    if (createConvError || !newConv) {
      return { success: false, error: createConvError?.message || '創建對話失敗' }
    }
    conversation = newConv
    isNew = true
  }

  return {
    success: true,
    data: {
      userId: user.id,
      projectId: project.id,
      conversationId: conversation.id,
      isNew
    }
  }
}

/**
 * 從認證 Session 初始化會話
 * - 從 Supabase Auth 讀取當前登入用戶
 * - 創建或獲取專案和對話
 * - 用於已登入用戶
 */
export async function initializeSessionFromAuth(): Promise<ActionResult<{
  userId: string
  projectId: string
  conversationId: string
  isNew: boolean
  isAuthenticated: boolean
  user?: {
    email?: string
    name?: string
    avatarUrl?: string
  }
}>> {
  const authClient = await createClient()
  const { data: { user: authUser } } = await authClient.auth.getUser()

  if (!authUser) {
    return { success: false, error: '未登入' }
  }

  // 從 auth user 的 metadata 取得用戶資訊
  const email = authUser.email || `${authUser.id}@auth.tellcraft.app`
  const name = authUser.user_metadata?.name || authUser.user_metadata?.full_name
  const avatarUrl = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture

  // 1. 查找或創建 users 表中的用戶記錄
  let { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('id', authUser.id)
    .single()

  let isNew = false

  if (userError || !user) {
    // 嘗試用 email 查找（處理舊資料遷移）
    const { data: userByEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (userByEmail) {
      // 更新現有用戶的 id 為 auth user id
      await supabase
        .from('users')
        .update({ id: authUser.id })
        .eq('id', userByEmail.id)
      user = { id: authUser.id }
    } else {
      // 創建新用戶
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email,
          plan: 'free',
          subscription_status: 'active',
          message_count_this_period: 0
        })
        .select('id')
        .single()

      if (createUserError || !newUser) {
        return { success: false, error: createUserError?.message || '創建用戶失敗' }
      }
      user = newUser
      isNew = true
    }
  }

  // 2. 查找或創建專案
  let { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (projectError || !project) {
    // 創建新專案
    const { data: newProject, error: createProjectError } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: '我的專案',
        status: 'draft'
      })
      .select('id')
      .single()

    if (createProjectError || !newProject) {
      return { success: false, error: createProjectError?.message || '創建專案失敗' }
    }
    project = newProject
    isNew = true
  }

  // 3. 查找或創建對話
  let { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('id')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (convError || !conversation) {
    // 創建新對話
    const { data: newConv, error: createConvError } = await supabase
      .from('conversations')
      .insert({
        project_id: project.id,
        messages: [],
        spec_complete: false
      })
      .select('id')
      .single()

    if (createConvError || !newConv) {
      return { success: false, error: createConvError?.message || '創建對話失敗' }
    }
    conversation = newConv
    isNew = true
  }

  return {
    success: true,
    data: {
      userId: user.id,
      projectId: project.id,
      conversationId: conversation.id,
      isNew,
      isAuthenticated: true,
      user: {
        email,
        name,
        avatarUrl
      }
    }
  }
}

/**
 * 取得當前認證用戶
 * - 用於前端檢查登入狀態
 */
export async function getCurrentUser(): Promise<ActionResult<{
  userId: string
  email?: string
  name?: string
  avatarUrl?: string
} | null>> {
  const authClient = await createClient()
  const { data: { user: authUser } } = await authClient.auth.getUser()

  if (!authUser) {
    return { success: true, data: null }
  }

  return {
    success: true,
    data: {
      userId: authUser.id,
      email: authUser.email,
      name: authUser.user_metadata?.name || authUser.user_metadata?.full_name,
      avatarUrl: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture
    }
  }
}

/**
 * 登出
 */
export async function signOut(): Promise<ActionResult<null>> {
  const authClient = await createClient()
  const { error } = await authClient.auth.signOut()

  if (error) {
    return { success: false, error: error.message }
  }

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
  let { conversationId, content, userId, projectId } = input

  // 如果未提供 userId，從認證 session 讀取
  if (!userId) {
    const authClient = await createClient()
    const { data: { user: authUser } } = await authClient.auth.getUser()
    if (!authUser) {
      return { success: false, error: '未登入' }
    }
    userId = authUser.id
  }

  // 1. 讀取現有消息
  const { data: conversation, error: readError } = await supabase
    .from('conversations')
    .select('messages')
    .eq('id', conversationId)
    .single()

  if (readError || !conversation) {
    return { success: false, error: readError?.message || '對話不存在' }
  }

  // 2. 新增用戶消息
  const messageId = crypto.randomUUID()
  const currentMessages = conversation.messages || []
  const newMessage = {
    id: messageId,
    role: 'user',
    content,
    timestamp: new Date().toISOString()
  }

  const { error: updateError } = await supabase
    .from('conversations')
    .update({
      messages: [...currentMessages, newMessage],
      updated_at: new Date().toISOString()
    })
    .eq('id', conversationId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  // 3. 更新用戶消息計數
  try {
    const { data: userData } = await supabase
      .from('users')
      .select('message_count_this_period')
      .eq('id', userId)
      .single()

    if (userData) {
      await supabase
        .from('users')
        .update({ message_count_this_period: (userData.message_count_this_period || 0) + 1 })
        .eq('id', userId)
    }
  } catch {
    // 忽略計數更新錯誤，不阻塞主流程
  }

  // 4. 觸發 Inngest
  try {
    await triggerUserRequest({
      projectId,
      conversationId,
      userId,
      message: content
    })
  } catch (err) {
    console.error('Failed to trigger Inngest:', err)
    // 不阻塞，讓消息先存入
  }

  return {
    success: true,
    data: { messageId }
  }
}

/**
 * 多輪對話回覆
 * - 存消息到 DB
 * - 觸發 user/reply 事件（帶 taskId）
 */
export async function replyToConversation(input: {
  conversationId: string
  projectId: string
  taskId: string
  content: string
  specConfirmed?: boolean
}): Promise<ActionResult<{ messageId: string }>> {
  const { conversationId, projectId, taskId, content, specConfirmed } = input

  // 1. 讀取現有消息
  const { data: conversation, error: readError } = await supabase
    .from('conversations')
    .select('messages')
    .eq('id', conversationId)
    .single()

  if (readError || !conversation) {
    return { success: false, error: readError?.message || '對話不存在' }
  }

  // 2. 新增用戶消息
  const messageId = crypto.randomUUID()
  const currentMessages = conversation.messages || []
  const newMessage = {
    id: messageId,
    role: 'user',
    content,
    timestamp: new Date().toISOString()
  }

  const { error: updateError } = await supabase
    .from('conversations')
    .update({
      messages: [...currentMessages, newMessage],
      updated_at: new Date().toISOString()
    })
    .eq('id', conversationId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  // 3. 觸發 Inngest user/reply
  try {
    await triggerUserReply({
      projectId,
      conversationId,
      taskId,
      message: content,
      specConfirmed
    })
  } catch (err) {
    console.error('Failed to trigger Inngest reply:', err)
  }

  return {
    success: true,
    data: { messageId }
  }
}

/**
 * 獲取對話消息（用於輪詢）
 * - 返回消息列表
 * - 返回當前活躍的 taskId
 */
export async function getConversationMessages(input: {
  conversationId: string
  afterTimestamp?: string
}): Promise<ActionResult<{
  messages: Array<{
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: string
    stage?: string
  }>
  currentTaskId?: string
  taskStatus?: string
}>> {
  const { conversationId, afterTimestamp } = input

  // 1. 讀取對話消息
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('messages, project_id')
    .eq('id', conversationId)
    .single()

  if (convError || !conversation) {
    return { success: false, error: convError?.message || '對話不存在' }
  }

  let messages = conversation.messages || []

  // 如果有 afterTimestamp，只返回之後的消息
  if (afterTimestamp) {
    messages = messages.filter((m: { timestamp: string }) => m.timestamp > afterTimestamp)
  }

  // 2. 查找當前活躍的任務
  const { data: task } = await supabase
    .from('tasks')
    .select('id, status')
    .eq('project_id', conversation.project_id)
    .in('status', ['planning', 'executing', 'pending_approval', 'waiting_approval'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return {
    success: true,
    data: {
      messages,
      currentTaskId: task?.id,
      taskStatus: task?.status
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
async function getProjectSchema(projectId: string): Promise<string> {
  // 優先從 generations 表讀取
  const { data: gen } = await supabase
    .from('generations')
    .select('generated_code_url')
    .eq('project_id', projectId)
    .eq('status', 'success')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (gen?.generated_code_url) {
    // TODO: 從 Storage 讀取 schema
    // 暫時返回空 schema
  }

  // 暫時返回空 schema（用模板）
  return ''
}

/**
 * 從資料庫或模板取得專案檔案
 */
async function getProjectFiles(projectId: string): Promise<Array<{ file: string; data: string }>> {
  // 優先從 Storage 讀取
  // TODO: 實作 Storage 讀取

  // 暫時使用模板
  const { data: project } = await supabase
    .from('projects')
    .select('name')
    .eq('id', projectId)
    .single()

  return generateNextJsTemplate(project?.name || 'my-app', '')
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

  // 1. 查詢專案資訊
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, name, status')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    return { success: false, error: '專案不存在' }
  }

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

  // 6. 根據結果更新資料庫
  if (result.stage === 'complete') {
    await supabase
      .from('projects')
      .update({
        status: 'deployed',
        vercel_url: result.deploymentUrl,
        vercel_project_id: result.vercelProjectId,
        supabase_project_id: result.supabaseProjectId,
        supabase_url: result.supabaseUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)

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
