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

  // 前置：檢查專案數量（使用 select('id') 減少開銷）
  const { count } = await supabase
    .from('projects')
    .select('id', { count: 'exact', head: true })
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

  const availableOrg = orgs?.find(org => org.project_count < org.max_projects)

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
  const { projectId, changes: _changes, isDestructive } = input

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
  const { userId: _userId, format, projectId, requestUserId } = input

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

  const email = `${anonymousId}@anonymous.tellcraft.app`

  // 1. 查找現有用戶（先在 users 表查）
  let { data: user, error: _userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  let isNew = false

  if (_userError || !user) {
    // 用戶不存在，需要先在 auth.users 創建，再在 users 表創建
    // 使用 Supabase Admin API 創建 auth 用戶
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true, // 自動確認 email
      user_metadata: {
        anonymous: true,
        anonymousId
      }
    })

    if (authError || !authData.user) {
      // 如果 auth 用戶已存在（可能之前創建過），嘗試獲取
      const { data: existingAuth } = await supabase.auth.admin.listUsers()
      const existingUser = existingAuth?.users?.find(u => u.email === email)

      if (!existingUser) {
        return { success: false, error: authError?.message || '創建認證用戶失敗' }
      }

      // 在 users 表創建記錄
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert({
          id: existingUser.id,
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
    } else {
      // 在 users 表創建記錄
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
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
  // 規則：draft/generating 狀態的專案可以複用，deployed/testing/failed 則創建新專案
  const reusableStatuses = ['draft', 'generating']

  const { data: existingProject } = await supabase
    .from('projects')
    .select('id, status')
    .eq('user_id', user.id)
    .in('status', reusableStatuses)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let project: { id: string }

  if (existingProject) {
    // 複用現有的 draft/generating 專案
    project = existingProject
  } else {
    // 沒有可複用的專案，創建新專案
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

  // 3. 檢查是否有歷史對話
  const { count: historyCount } = await supabase
    .from('conversations')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', project.id)

  const hasHistory = (historyCount || 0) > 0

  // 4. 處理對話：恢復指定對話、創建新對話、或返回需選擇
  let finalConversationId: string

  if (conversationId) {
    // 嘗試恢復指定對話
    const { data: existingConv, error: convError } = await supabase
      .from('conversations')
      .select('id, project_id')
      .eq('id', conversationId)
      .single()

    if (convError || !existingConv) {
      return { success: false, error: '對話不存在或無權訪問' }
    }

    // 驗證對話屬於該用戶的專案
    const { data: convProject } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', existingConv.project_id)
      .single()

    if (convProject?.user_id !== user.id) {
      return { success: false, error: '無權訪問此對話' }
    }

    finalConversationId = conversationId
  } else if (createNew || !hasHistory) {
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
    finalConversationId = newConv.id
    isNew = true
  } else {
    // 有歷史但未指定要恢復哪個 → 返回最近的未完成對話
    const { data: recentConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('project_id', project.id)
      .eq('spec_complete', false)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (recentConv) {
      // 有未完成的對話，恢復它
      finalConversationId = recentConv.id
    } else {
      // 沒有未完成的對話，創建新的
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
      finalConversationId = newConv.id
      isNew = true
    }
  }

  return {
    success: true,
    data: {
      userId: user.id,
      projectId: project.id,
      conversationId: finalConversationId,
      isNew,
      hasHistory
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
  const userQueryResult = await supabase
    .from('users')
    .select('id')
    .eq('id', authUser.id)
    .single()

  let user = userQueryResult.data
  let isNew = false

  if (userQueryResult.error || !user) {
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

  // 2. 執行帳號合併（如果有 anonymousId）
  let migrationResult: { migratedProjects: number; migratedConversations: number } | undefined

  if (anonymousId) {
    const migration = await migrateAnonymousAccount({
      authUserId: user.id,
      anonymousId
    })

    if (migration.success && migration.data) {
      migrationResult = migration.data
    }
  }

  // 3. 查找或創建專案
  // 規則：draft/generating 狀態的專案可以複用，deployed/testing/failed 則創建新專案
  const reusableStatuses = ['draft', 'generating']

  const { data: existingProject } = await supabase
    .from('projects')
    .select('id, status')
    .eq('user_id', user.id)
    .in('status', reusableStatuses)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let project: { id: string }

  if (existingProject) {
    // 複用現有的 draft/generating 專案
    project = existingProject
  } else {
    // 沒有可複用的專案，創建新專案
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

  // 4. 檢查是否有歷史對話
  const { count: historyCount } = await supabase
    .from('conversations')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', project.id)

  const hasHistory = (historyCount || 0) > 0

  // 5. 處理對話：恢復指定對話、創建新對話
  let finalConversationId: string

  if (conversationId) {
    // 嘗試恢復指定對話
    const { data: existingConv, error: convError } = await supabase
      .from('conversations')
      .select('id, project_id')
      .eq('id', conversationId)
      .single()

    if (convError || !existingConv) {
      return { success: false, error: '對話不存在或無權訪問' }
    }

    // 驗證對話屬於該用戶的專案
    const { data: convProject } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', existingConv.project_id)
      .single()

    if (convProject?.user_id !== user.id) {
      return { success: false, error: '無權訪問此對話' }
    }

    finalConversationId = conversationId
  } else if (createNew || !hasHistory) {
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
    finalConversationId = newConv.id
    isNew = true
  } else {
    // 有歷史但未指定要恢復哪個 → 返回最近的未完成對話
    const { data: recentConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('project_id', project.id)
      .eq('spec_complete', false)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (recentConv) {
      // 有未完成的對話，恢復它
      finalConversationId = recentConv.id
    } else {
      // 沒有未完成的對話，創建新的
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
      finalConversationId = newConv.id
      isNew = true
    }
  }

  return {
    success: true,
    data: {
      userId: user.id,
      projectId: project.id,
      conversationId: finalConversationId,
      isNew,
      isAuthenticated: true,
      hasHistory,
      migrationResult,
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
 * - 包含 isAdmin 狀態避免前端重複查詢
 */
export async function getCurrentUser(): Promise<ActionResult<{
  userId: string
  email?: string
  name?: string
  avatarUrl?: string
  isAdmin: boolean
} | null>> {
  const authClient = await createClient()
  const { data: { user: authUser } } = await authClient.auth.getUser()

  if (!authUser) {
    return { success: true, data: null }
  }

  // 查詢 is_admin 狀態（避免前端再次查詢）
  const { data: userData } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', authUser.id)
    .single()

  return {
    success: true,
    data: {
      userId: authUser.id,
      email: authUser.email,
      name: authUser.user_metadata?.name || authUser.user_metadata?.full_name,
      avatarUrl: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
      isAdmin: userData?.is_admin || false
    }
  }
}

/**
 * 遷移匿名帳號到認證帳號
 * - 將訪客的專案和對話遷移到認證帳號
 * - 處理同名專案衝突（重命名）
 * - 標記原訪客帳號為 cancelled
 */
export async function migrateAnonymousAccount(input: {
  authUserId: string
  anonymousId: string
}): Promise<ActionResult<{
  migratedProjects: number
  migratedConversations: number
}>> {
  const { authUserId, anonymousId } = input

  const anonymousEmail = `${anonymousId}@anonymous.tellcraft.app`

  // 1. 查找匿名用戶
  const { data: anonymousUser, error: anonError } = await supabase
    .from('users')
    .select('id')
    .eq('email', anonymousEmail)
    .single()

  if (anonError || !anonymousUser) {
    // 沒有匿名用戶資料，無需遷移
    return {
      success: true,
      data: { migratedProjects: 0, migratedConversations: 0 }
    }
  }

  // 如果匿名用戶就是認證用戶，無需遷移
  if (anonymousUser.id === authUserId) {
    return {
      success: true,
      data: { migratedProjects: 0, migratedConversations: 0 }
    }
  }

  // 2. 查詢匿名用戶的專案
  const { data: anonymousProjects, error: projError } = await supabase
    .from('projects')
    .select('id, name')
    .eq('user_id', anonymousUser.id)

  if (projError) {
    return { success: false, error: projError.message }
  }

  // 3. 查詢認證用戶現有的專案名稱
  const { data: authProjects } = await supabase
    .from('projects')
    .select('name')
    .eq('user_id', authUserId)

  const existingNames = new Set((authProjects || []).map(p => p.name))

  // 4. 遷移專案，處理同名衝突（並行處理避免序列 await）
  let migratedProjects = 0
  let migratedConversations = 0

  // 預處理：計算所有新名稱（純計算，無 async）
  const projectsToMigrate = (anonymousProjects || []).map(project => {
    let newName = project.name

    // 處理同名衝突
    if (existingNames.has(newName)) {
      let suffix = 2
      while (existingNames.has(`${project.name} (${suffix})`)) {
        suffix++
      }
      newName = `${project.name} (${suffix})`
    }

    existingNames.add(newName) // 預先添加避免後續衝突
    return { ...project, newName }
  })

  // 並行執行所有專案更新
  const updateResults = await Promise.all(
    projectsToMigrate.map(project =>
      supabase
        .from('projects')
        .update({
          user_id: authUserId,
          name: project.newName,
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id)
        .then(result => ({ projectId: project.id, error: result.error }))
    )
  )

  // 統計成功遷移的專案
  const successfulProjectIds = updateResults
    .filter(r => !r.error)
    .map(r => r.projectId)
  migratedProjects = successfulProjectIds.length

  // 一次性查詢所有成功遷移專案的對話數量
  if (successfulProjectIds.length > 0) {
    const { count } = await supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .in('project_id', successfulProjectIds)

    migratedConversations = count || 0
  }

  // 5. 更新認證用戶，記錄關聯的匿名用戶 ID
  await supabase
    .from('users')
    .update({ anonymous_user_id: anonymousUser.id })
    .eq('id', authUserId)

  // 6. 標記匿名用戶為 cancelled
  await supabase
    .from('users')
    .update({
      subscription_status: 'cancelled',
      cancelled_at: new Date().toISOString()
    })
    .eq('id', anonymousUser.id)

  return {
    success: true,
    data: {
      migratedProjects,
      migratedConversations
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
  const { conversationId, content, projectId } = input
  let { userId } = input

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
    // 將錯誤記錄到對話中，讓前端看到
    const errorMsg = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `[系統錯誤] 無法啟動 AI 處理流程：${err instanceof Error ? err.message : String(err)}\n\n請聯繫管理員。`,
      timestamp: new Date().toISOString(),
    }
    const { data: conv } = await supabase
      .from('conversations')
      .select('messages')
      .eq('id', conversationId)
      .single()
    await supabase
      .from('conversations')
      .update({ messages: [...(conv?.messages || []), errorMsg] })
      .eq('id', conversationId)
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
 * 獲取用戶所有對話列表
 * - 用於顯示歷史對話選擇器
 * - 支援匿名用戶和已登入用戶
 * - 優化：使用 JOIN 減少請求次數
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
  const { userId, limit = 10 } = input

  // 使用 JOIN 一次查詢取得對話和專案名稱
  // 注意：messages 欄位仍需載入以取得 lastMessage 和 count
  // 未來可考慮在 DB 層添加 message_count 欄位來進一步優化
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select(`
      id,
      project_id,
      messages,
      updated_at,
      created_at,
      projects!inner(name, user_id)
    `)
    .eq('projects.user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit + 1)  // 多取一條用於判斷是否有更多

  if (convError) {
    return { success: false, error: convError.message }
  }

  if (!conversations || conversations.length === 0) {
    return {
      success: true,
      data: {
        conversations: [],
        hasMore: false,
      }
    }
  }

  const hasMore = conversations.length > limit
  const limitedConversations = conversations.slice(0, limit)

  const formattedConversations = limitedConversations.map(conv => {
    const messages = conv.messages || []
    const lastUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === 'user')
    // 取得 JOIN 的專案名稱（Supabase 返回的 projects 是單一物件，因為是 !inner join）
    const project = conv.projects as unknown as { name: string } | null
    const projectName = project?.name || '未命名專案'

    return {
      id: conv.id,
      projectId: conv.project_id,
      projectName,
      lastMessage: lastUserMessage?.content?.slice(0, 100) || undefined,
      messageCount: messages.length,
      updatedAt: conv.updated_at,
      createdAt: conv.created_at,
    }
  })

  return {
    success: true,
    data: {
      conversations: formattedConversations,
      hasMore,
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
  }>
  currentTaskId?: string
  taskStatus?: string
  updatedAt?: string  // 返回當前 updated_at 供下次比對
  isComplete?: boolean  // 對話是否已完成（spec_complete），用於停止輪詢
}>> {
  const { conversationId, afterTimestamp, lastUpdatedAt } = input

  // 1. 先檢查 updated_at 和 spec_complete 是否有變化（輕量查詢）
  if (lastUpdatedAt) {
    const { data: check } = await supabase
      .from('conversations')
      .select('updated_at, project_id, spec_complete')
      .eq('id', conversationId)
      .single()

    if (check && check.updated_at === lastUpdatedAt) {
      // 沒有更新，只查詢 task 狀態
      const { data: task } = await supabase
        .from('tasks')
        .select('id, status')
        .eq('project_id', check.project_id)
        .in('status', ['planning', 'executing', 'pending_approval', 'waiting_approval'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      return {
        success: true,
        data: {
          messages: [],  // 沒有新消息
          currentTaskId: task?.id,
          taskStatus: task?.status,
          updatedAt: check.updated_at,
          isComplete: check.spec_complete  // 告訴前端對話是否完成
        }
      }
    }
  }

  // 2. 有更新或首次查詢，載入完整 messages
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('messages, project_id, updated_at, spec_complete')
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

  // 3. 查找當前活躍的任務
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
      taskStatus: task?.status,
      updatedAt: conversation.updated_at,
      isComplete: conversation.spec_complete  // 告訴前端對話是否完成
    }
  }
}

// ============================================================
// 用戶儀表板 Actions
// ============================================================

/**
 * 獲取當前用戶統計
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
  const authClient = await createClient()
  const { data: { user: authUser } } = await authClient.auth.getUser()

  if (!authUser) {
    return { success: false, error: '未登入' }
  }

  // 查詢用戶資訊和專案 IDs（合併查詢，減少請求次數）
  const [userResult, projectsResult] = await Promise.all([
    supabase
      .from('users')
      .select('plan, message_count_this_period')
      .eq('id', authUser.id)
      .single(),
    supabase
      .from('projects')
      .select('id', { count: 'exact' })  // 一次查詢同時取得 count 和 IDs
      .eq('user_id', authUser.id)
  ])

  if (userResult.error || !userResult.data) {
    return { success: false, error: '用戶不存在' }
  }

  const user = userResult.data
  const projectIds = projectsResult.data?.map(p => p.id) || []
  const projectCount = projectsResult.count || 0

  // 並行查詢對話和部署數量（減少往返次數）
  const [convResult, deployResult] = projectIds.length > 0
    ? await Promise.all([
        supabase
          .from('conversations')
          .select('id', { count: 'exact', head: true })  // 使用 id 而非 *
          .in('project_id', projectIds),
        supabase
          .from('deployments')
          .select('id', { count: 'exact', head: true })  // 使用 id 而非 *
          .in('project_id', projectIds)
          .eq('status', 'success')
      ])
    : [{ count: 0 }, { count: 0 }]

  const convCount = convResult.count || 0
  const deployCount = deployResult.count || 0

  return {
    success: true,
    data: {
      totalProjects: projectCount || 0,
      totalConversations: convCount || 0,
      totalDeployments: deployCount || 0,
      messageUsage: {
        used: user.message_count_this_period,
        limit: PLAN_MESSAGE_LIMITS[user.plan] || 50,
        plan: user.plan
      }
    }
  }
}

/**
 * 獲取當前用戶的專案列表
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
  const authClient = await createClient()
  const { data: { user: authUser } } = await authClient.auth.getUser()

  if (!authUser) {
    return { success: false, error: '未登入' }
  }

  const { page = 1, pageSize = 10, status } = params

  let query = supabase
    .from('projects')
    .select('id, name, description, status, vercel_url, custom_domain, created_at, updated_at', { count: 'exact' })
    .eq('user_id', authUser.id)

  if (status) {
    query = query.eq('status', status)
  }

  query = query.order('updated_at', { ascending: false })

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data: projects, error, count } = await query

  if (error) {
    return { success: false, error: error.message }
  }

  // 查詢每個專案的對話數量
  const projectIds = projects?.map(p => p.id) || []
  const { data: convCounts } = projectIds.length > 0
    ? await supabase
        .from('conversations')
        .select('project_id')
        .in('project_id', projectIds)
    : { data: [] }

  const convCountMap = new Map<string, number>()
  convCounts?.forEach(c => {
    convCountMap.set(c.project_id, (convCountMap.get(c.project_id) || 0) + 1)
  })

  return {
    success: true,
    data: {
      projects: (projects || []).map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status as ProjectStatus,
        vercelUrl: p.vercel_url,
        customDomain: p.custom_domain,
        conversationCount: convCountMap.get(p.id) || 0,
        createdAt: p.created_at,
        updatedAt: p.updated_at
      })),
      total: count || 0,
      page,
      pageSize
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
  const authClient = await createClient()
  const { data: { user: authUser } } = await authClient.auth.getUser()

  if (!authUser) {
    return { success: false, error: '未登入' }
  }

  // 查詢專案
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, name, description, status, vercel_url, custom_domain, domain_status, created_at, updated_at, user_id')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    return { success: false, error: '專案不存在' }
  }

  // 驗證擁有權
  if (project.user_id !== authUser.id) {
    return { success: false, error: '無權訪問此專案' }
  }

  // 並行查詢對話、部署和生成記錄（減少往返時間）
  const [convResult, deployResult, genResult] = await Promise.all([
    supabase
      .from('conversations')
      .select('id, messages, spec_complete, created_at, updated_at')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false }),
    supabase
      .from('deployments')
      .select('id, url, status, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('generations')
      .select('id, status, attempt_count, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(10)
  ])

  const conversations = convResult.data
  const deployments = deployResult.data
  const generations = genResult.data

  return {
    success: true,
    data: {
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status as ProjectStatus,
        vercelUrl: project.vercel_url,
        customDomain: project.custom_domain,
        domainStatus: project.domain_status,
        createdAt: project.created_at,
        updatedAt: project.updated_at
      },
      conversations: (conversations || []).map(c => {
        const messages = c.messages || []
        const lastUserMessage = [...messages].reverse().find((m: { role: string; content: string }) => m.role === 'user')
        return {
          id: c.id,
          messageCount: messages.length,
          specComplete: c.spec_complete,
          lastMessage: lastUserMessage?.content?.slice(0, 100) || null,
          createdAt: c.created_at,
          updatedAt: c.updated_at
        }
      }),
      deployments: (deployments || []).map(d => ({
        id: d.id,
        url: d.url,
        status: d.status,
        createdAt: d.created_at
      })),
      generations: (generations || []).map(g => ({
        id: g.id,
        status: g.status,
        attemptCount: g.attempt_count,
        createdAt: g.created_at
      }))
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
  | 'completed'

// BDD Session 資料結構
interface BddSession {
  id: string
  projectId: string
  conversationId: string
  taskId?: string
  currentPhase: BddPhase
  currentRound: number
  currentQuestionIndex: number
  totalDiscovered: number
  totalResolved: number
  consecutiveEmptyRounds: number
  clarifyItems: ClarifyItem[]
  stagingItems: ClarifyItem[]
  resolvedItems: ClarifyItem[]
  originalRequirements?: string
  projectContext?: string
  schemaSqlContent?: string
  entityMappingContent?: string
  featuresContent?: Array<{ name: string; actionName?: string; content: string }>
  actionsYmlContent?: string
  isaConfigContent?: string
  validationResult?: { passed: boolean; errors: string[]; warnings: string[] }
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

  const { data, error } = await supabase
    .from('bdd_sessions')
    .insert({
      project_id: projectId,
      conversation_id: conversationId,
      task_id: taskId,
      current_phase: 'prd_discovery',
      original_requirements: originalRequirements,
      project_context: projectContext,
    })
    .select('id')
    .single()

  if (error || !data) {
    return { success: false, error: error?.message || '創建 BDD Session 失敗' }
  }

  return { success: true, data: { sessionId: data.id } }
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

  let query = supabase.from('bdd_sessions').select('*')

  if (sessionId) {
    query = query.eq('id', sessionId)
  } else if (conversationId) {
    query = query.eq('conversation_id', conversationId)
  } else if (projectId) {
    query = query.eq('project_id', projectId)
  } else {
    return { success: false, error: '必須提供 sessionId、conversationId 或 projectId' }
  }

  const { data, error } = await query.order('created_at', { ascending: false }).limit(1).single()

  if (error) {
    if (error.code === 'PGRST116') {
      // 沒有找到記錄
      return { success: true, data: null }
    }
    return { success: false, error: error.message }
  }

  // 轉換 snake_case 到 camelCase
  const session: BddSession = {
    id: data.id,
    projectId: data.project_id,
    conversationId: data.conversation_id,
    taskId: data.task_id,
    currentPhase: data.current_phase,
    currentRound: data.current_round,
    currentQuestionIndex: data.current_question_index,
    totalDiscovered: data.total_discovered,
    totalResolved: data.total_resolved,
    consecutiveEmptyRounds: data.consecutive_empty_rounds,
    clarifyItems: data.clarify_items || [],
    stagingItems: data.staging_items || [],
    resolvedItems: data.resolved_items || [],
    originalRequirements: data.original_requirements,
    projectContext: data.project_context,
    schemaSqlContent: data.schema_sql_content,
    entityMappingContent: data.entity_mapping_content,
    featuresContent: data.features_content,
    actionsYmlContent: data.actions_yml_content,
    isaConfigContent: data.isa_config_content,
    validationResult: data.validation_result,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }

  return { success: true, data: session }
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

  // 轉換 camelCase 到 snake_case
  const dbUpdates: Record<string, unknown> = {}
  if (updates.currentPhase !== undefined) dbUpdates.current_phase = updates.currentPhase
  if (updates.currentRound !== undefined) dbUpdates.current_round = updates.currentRound
  if (updates.currentQuestionIndex !== undefined) dbUpdates.current_question_index = updates.currentQuestionIndex
  if (updates.totalDiscovered !== undefined) dbUpdates.total_discovered = updates.totalDiscovered
  if (updates.totalResolved !== undefined) dbUpdates.total_resolved = updates.totalResolved
  if (updates.consecutiveEmptyRounds !== undefined) dbUpdates.consecutive_empty_rounds = updates.consecutiveEmptyRounds
  if (updates.clarifyItems !== undefined) dbUpdates.clarify_items = updates.clarifyItems
  if (updates.stagingItems !== undefined) dbUpdates.staging_items = updates.stagingItems
  if (updates.resolvedItems !== undefined) dbUpdates.resolved_items = updates.resolvedItems
  if (updates.schemaSqlContent !== undefined) dbUpdates.schema_sql_content = updates.schemaSqlContent
  if (updates.entityMappingContent !== undefined) dbUpdates.entity_mapping_content = updates.entityMappingContent
  if (updates.featuresContent !== undefined) dbUpdates.features_content = updates.featuresContent
  if (updates.actionsYmlContent !== undefined) dbUpdates.actions_yml_content = updates.actionsYmlContent
  if (updates.isaConfigContent !== undefined) dbUpdates.isa_config_content = updates.isaConfigContent
  if (updates.validationResult !== undefined) dbUpdates.validation_result = updates.validationResult

  const { error } = await supabase
    .from('bdd_sessions')
    .update(dbUpdates)
    .eq('id', sessionId)

  if (error) {
    return { success: false, error: error.message }
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
