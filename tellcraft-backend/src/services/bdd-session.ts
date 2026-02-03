import * as db from '../db/client'

// ============================================================
// 類型定義
// ============================================================

export interface ClarifyItem {
  id: string
  question: string
  whiteTextQuestion?: string
  checklistItem: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'answered' | 'skipped'
  answer?: string
  options?: Array<string | { label: string; description?: string }>
}

export interface BddSession {
  id: string
  projectId: string
  conversationId: string
  taskId: string
  originalRequirements: string
  projectContext: string | null
  currentPhase: string
  currentRound: number
  clarifyItems: ClarifyItem[]
  stagingItems: ClarifyItem[]
  resolvedItems: ClarifyItem[]
  schemaSqlContent: string | null
  entityMappingContent: string | null
  featuresContent: FeatureFile[] | null
  actionsYmlContent: string | null
  isaConfigContent: string | null
  validationResult: {
    passed: boolean
    errors: string[]
    warnings: string[]
  } | null
}

export interface FeatureFile {
  name: string
  actionName?: string
  content: string
}

// ============================================================
// BDD Session 操作
// ============================================================

/**
 * 創建 BDD Session
 */
export async function createBddSession(data: {
  projectId: string
  conversationId: string
  taskId: string
  originalRequirements: string
  projectContext?: string
}): Promise<{ success: boolean; data?: { sessionId: string }; error?: string }> {
  try {
    const sessionId = await db.createBddSession(data)
    if (!sessionId) {
      return { success: false, error: '創建 BDD Session 失敗' }
    }
    return { success: true, data: { sessionId } }
  } catch (error) {
    console.error('[BddSession] 創建失敗:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * 取得 BDD Session
 */
export async function getBddSession(input: {
  sessionId: string
}): Promise<{ success: boolean; data?: BddSession; error?: string }> {
  try {
    const session = await db.getBddSession(input.sessionId)
    if (!session) {
      return { success: false, error: 'Session 不存在' }
    }

    // 轉換資料格式
    const data: BddSession = {
      id: session.id,
      projectId: session.project_id,
      conversationId: session.conversation_id,
      taskId: session.task_id,
      originalRequirements: session.original_requirements,
      projectContext: session.project_context,
      currentPhase: session.current_phase,
      currentRound: session.current_round,
      clarifyItems: (session.clarify_items || []) as ClarifyItem[],
      stagingItems: (session.staging_items || []) as ClarifyItem[],
      resolvedItems: (session.resolved_items || []) as ClarifyItem[],
      schemaSqlContent: session.schema_sql_content,
      entityMappingContent: session.entity_mapping_content,
      featuresContent: session.features_content as FeatureFile[] | null,
      actionsYmlContent: session.actions_yml_content,
      isaConfigContent: session.isa_config_content,
      validationResult: session.validation_result as BddSession['validationResult'],
    }

    return { success: true, data }
  } catch (error) {
    console.error('[BddSession] 取得失敗:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * 更新 BDD Session
 */
export async function updateBddSession(input: {
  sessionId: string
  updates: Partial<{
    currentPhase: string
    currentRound: number
    clarifyItems: ClarifyItem[]
    stagingItems: ClarifyItem[]
    resolvedItems: ClarifyItem[]
    schemaSqlContent: string
    entityMappingContent: string
    featuresContent: FeatureFile[]
    actionsYmlContent: string
    isaConfigContent: string
    validationResult: { passed: boolean; errors: string[]; warnings: string[] }
  }>
}): Promise<{ success: boolean; error?: string }> {
  try {
    await db.updateBddSession(input.sessionId, input.updates)
    return { success: true }
  } catch (error) {
    console.error('[BddSession] 更新失敗:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * 添加釐清項目
 */
export async function addClarifyItems(input: {
  sessionId: string
  items: ClarifyItem[]
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await db.getBddSession(input.sessionId)
    if (!session) {
      return { success: false, error: 'Session 不存在' }
    }

    const existingItems = (session.clarify_items || []) as ClarifyItem[]
    const newItems = input.items.map(item => ({
      ...item,
      id: item.id || crypto.randomUUID(),
      status: item.status || 'pending',
    }))

    await db.updateBddSession(input.sessionId, {
      clarifyItems: [...existingItems, ...newItems],
    })

    return { success: true }
  } catch (error) {
    console.error('[BddSession] 添加釐清項目失敗:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * 回答釐清項目（移到 staging）
 */
export async function answerClarifyItem(input: {
  sessionId: string
  itemId: string
  answer: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await db.getBddSession(input.sessionId)
    if (!session) {
      return { success: false, error: 'Session 不存在' }
    }

    const clarifyItems = (session.clarify_items || []) as ClarifyItem[]
    const stagingItems = (session.staging_items || []) as ClarifyItem[]

    const itemIndex = clarifyItems.findIndex(item => item.id === input.itemId)
    if (itemIndex === -1) {
      return { success: false, error: '項目不存在' }
    }

    const item = clarifyItems[itemIndex]
    const answeredItem: ClarifyItem = {
      ...item,
      status: 'answered',
      answer: input.answer,
    }

    // 從 clarifyItems 移除，加入 stagingItems
    clarifyItems.splice(itemIndex, 1)
    stagingItems.push(answeredItem)

    await db.updateBddSession(input.sessionId, {
      clarifyItems,
      stagingItems,
    })

    return { success: true }
  } catch (error) {
    console.error('[BddSession] 回答釐清項目失敗:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * 確認批次（staging → resolved）
 */
export async function confirmBatch(input: {
  sessionId: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await db.getBddSession(input.sessionId)
    if (!session) {
      return { success: false, error: 'Session 不存在' }
    }

    const stagingItems = (session.staging_items || []) as ClarifyItem[]
    const resolvedItems = (session.resolved_items || []) as ClarifyItem[]

    // 將所有 staging 項目移到 resolved
    await db.updateBddSession(input.sessionId, {
      stagingItems: [],
      resolvedItems: [...resolvedItems, ...stagingItems],
    })

    return { success: true }
  } catch (error) {
    console.error('[BddSession] 確認批次失敗:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * 反悔答案（staging → clarifyItems）
 */
export async function revertAnswer(input: {
  sessionId: string
  itemId: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await db.getBddSession(input.sessionId)
    if (!session) {
      return { success: false, error: 'Session 不存在' }
    }

    const clarifyItems = (session.clarify_items || []) as ClarifyItem[]
    const stagingItems = (session.staging_items || []) as ClarifyItem[]

    const itemIndex = stagingItems.findIndex(item => item.id === input.itemId)
    if (itemIndex === -1) {
      return { success: false, error: '項目不存在於 staging' }
    }

    const item = stagingItems[itemIndex]
    const revertedItem: ClarifyItem = {
      ...item,
      status: 'pending',
      answer: undefined,
    }

    // 從 stagingItems 移除，加入 clarifyItems
    stagingItems.splice(itemIndex, 1)
    clarifyItems.push(revertedItem)

    await db.updateBddSession(input.sessionId, {
      clarifyItems,
      stagingItems,
    })

    return { success: true }
  } catch (error) {
    console.error('[BddSession] 反悔答案失敗:', error)
    return { success: false, error: String(error) }
  }
}
