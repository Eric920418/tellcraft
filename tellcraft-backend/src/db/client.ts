import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg'

// 連接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // 最大連接數
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// 監聯連接錯誤
pool.on('error', (err) => {
  console.error('[DB] 連接池錯誤:', err)
})

// ============================================================
// 查詢封裝
// ============================================================

/**
 * 執行 SQL 查詢
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now()
  try {
    const result = await pool.query<T>(text, params)
    const duration = Date.now() - start
    if (duration > 100) {
      console.log(`[DB] 慢查詢 (${duration}ms):`, text.substring(0, 100))
    }
    return result
  } catch (error) {
    console.error('[DB] 查詢錯誤:', error)
    throw error
  }
}

/**
 * 查詢單一筆記錄
 */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const result = await query<T>(text, params)
  return result.rows[0] || null
}

/**
 * 查詢多筆記錄
 */
export async function queryMany<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await query<T>(text, params)
  return result.rows
}

/**
 * 執行事務
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// ============================================================
// 常用查詢
// ============================================================

/**
 * 取得用戶
 */
export async function getUser(userId: string) {
  return queryOne<{
    id: string
    email: string
    plan: string
    subscription_status: string
    message_count_this_period: number
  }>(
    'SELECT id, email, plan, subscription_status, message_count_this_period FROM users WHERE id = $1',
    [userId]
  )
}

/**
 * 取得專案
 */
export async function getProject(projectId: string) {
  return queryOne<{
    id: string
    user_id: string
    name: string
    description: string | null
    status: string
  }>(
    'SELECT id, user_id, name, description, status FROM projects WHERE id = $1',
    [projectId]
  )
}

/**
 * 取得對話
 */
export async function getConversation(conversationId: string) {
  return queryOne<{
    id: string
    project_id: string
    messages: unknown[]
    spec_complete: boolean
    updated_at: string
  }>(
    'SELECT id, project_id, messages, spec_complete, updated_at FROM conversations WHERE id = $1',
    [conversationId]
  )
}

/**
 * 更新對話消息
 */
export async function updateConversationMessages(
  conversationId: string,
  messages: unknown[]
) {
  return query(
    'UPDATE conversations SET messages = $1, updated_at = NOW() WHERE id = $2',
    [JSON.stringify(messages), conversationId]
  )
}

/**
 * 創建任務
 */
export async function createTask(data: {
  projectId: string
  userId: string
  goal: string
  status?: string
}) {
  const result = await queryOne<{ id: string }>(
    `INSERT INTO tasks (project_id, user_id, goal, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     RETURNING id`,
    [data.projectId, data.userId, data.goal, data.status || 'planning']
  )
  return result?.id
}

/**
 * 更新任務
 */
export async function updateTask(
  taskId: string,
  updates: {
    status?: string
    plan?: unknown
    completed_at?: Date
  }
) {
  const setClauses: string[] = []
  const params: unknown[] = []
  let paramIndex = 1

  if (updates.status) {
    setClauses.push(`status = $${paramIndex++}`)
    params.push(updates.status)
  }
  if (updates.plan) {
    setClauses.push(`plan = $${paramIndex++}`)
    params.push(JSON.stringify(updates.plan))
  }
  if (updates.completed_at) {
    setClauses.push(`completed_at = $${paramIndex++}`)
    params.push(updates.completed_at.toISOString())
  }

  setClauses.push(`updated_at = NOW()`)
  params.push(taskId)

  return query(
    `UPDATE tasks SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
    params
  )
}

/**
 * 取得 BDD Session
 */
export async function getBddSession(sessionId: string) {
  return queryOne<{
    id: string
    project_id: string
    conversation_id: string
    task_id: string
    original_requirements: string
    project_context: string | null
    current_phase: string
    current_round: number
    clarify_items: unknown[]
    staging_items: unknown[]
    resolved_items: unknown[]
    schema_sql_content: string | null
    entity_mapping_content: string | null
    features_content: unknown[] | null
    actions_yml_content: string | null
    isa_config_content: string | null
    validation_result: unknown | null
    // UIUX 欄位
    uiux_template_id: string | null
    design_variants: unknown[] | null
    selected_variant_ids: string[] | null
    final_design_system: unknown | null
    generated_pages: unknown[] | null
    generated_components: unknown[] | null
    generated_styles: string | null
  }>(
    `SELECT * FROM bdd_sessions WHERE id = $1`,
    [sessionId]
  )
}

/**
 * 創建 BDD Session
 */
export async function createBddSession(data: {
  projectId: string
  conversationId: string
  taskId: string
  originalRequirements: string
  projectContext?: string
}) {
  const result = await queryOne<{ id: string }>(
    `INSERT INTO bdd_sessions (
      project_id, conversation_id, task_id, original_requirements, project_context,
      current_phase, current_round, clarify_items, staging_items, resolved_items,
      created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, 'prd_discovery', 1, '[]', '[]', '[]', NOW(), NOW())
    RETURNING id`,
    [data.projectId, data.conversationId, data.taskId, data.originalRequirements, data.projectContext || null]
  )
  return result?.id
}

/**
 * 更新 BDD Session
 */
export async function updateBddSession(
  sessionId: string,
  updates: Record<string, unknown>
) {
  const setClauses: string[] = []
  const params: unknown[] = []
  let paramIndex = 1

  // 轉換 camelCase 到 snake_case
  const columnMap: Record<string, string> = {
    currentPhase: 'current_phase',
    currentRound: 'current_round',
    clarifyItems: 'clarify_items',
    stagingItems: 'staging_items',
    resolvedItems: 'resolved_items',
    schemaSqlContent: 'schema_sql_content',
    entityMappingContent: 'entity_mapping_content',
    featuresContent: 'features_content',
    actionsYmlContent: 'actions_yml_content',
    isaConfigContent: 'isa_config_content',
    validationResult: 'validation_result',
    // UIUX 欄位映射
    uiuxTemplateId: 'uiux_template_id',
    designVariants: 'design_variants',
    selectedVariantIds: 'selected_variant_ids',
    finalDesignSystem: 'final_design_system',
    generatedPages: 'generated_pages',
    generatedComponents: 'generated_components',
    generatedStyles: 'generated_styles',
  }

  for (const [key, value] of Object.entries(updates)) {
    const column = columnMap[key] || key
    setClauses.push(`${column} = $${paramIndex++}`)
    params.push(typeof value === 'object' ? JSON.stringify(value) : value)
  }

  setClauses.push(`updated_at = NOW()`)
  params.push(sessionId)

  return query(
    `UPDATE bdd_sessions SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
    params
  )
}

/**
 * 記錄 LLM 使用量
 */
export async function recordLlmUsage(data: {
  model: string
  inputTokens: number
  outputTokens: number
  costUsd: number
  purpose: string
  userId?: string
  conversationId?: string
}) {
  return query(
    `INSERT INTO llm_usage (user_id, conversation_id, model, input_tokens, output_tokens, cost_usd, purpose, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [data.userId || null, data.conversationId || null, data.model, data.inputTokens, data.outputTokens, data.costUsd, data.purpose]
  )
}

// ============================================================
// Flow State 持久化（Redis 備份）
// ============================================================

/**
 * 保存 Flow State 到 PostgreSQL
 */
export async function saveFlowState(conversationId: string, state: unknown) {
  return query(
    `INSERT INTO flow_states (conversation_id, state, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (conversation_id)
     DO UPDATE SET state = $2, updated_at = NOW()`,
    [conversationId, JSON.stringify(state)]
  )
}

/**
 * 從 PostgreSQL 取得 Flow State
 */
export async function getFlowState(conversationId: string) {
  return queryOne<{
    conversation_id: string
    state: unknown
    updated_at: string
  }>(
    'SELECT * FROM flow_states WHERE conversation_id = $1',
    [conversationId]
  )
}

/**
 * 刪除 Flow State
 */
export async function deleteFlowState(conversationId: string) {
  return query(
    'DELETE FROM flow_states WHERE conversation_id = $1',
    [conversationId]
  )
}

/**
 * 清理過期的 Flow States（超過 24 小時）
 */
export async function cleanupExpiredFlowStates() {
  return query(
    `DELETE FROM flow_states WHERE updated_at < NOW() - INTERVAL '24 hours'`
  )
}

// ============================================================
// 連接管理
// ============================================================

/**
 * 測試連接
 */
export async function testConnection(): Promise<boolean> {
  try {
    await query('SELECT 1')
    console.log('[DB] 連接成功')
    return true
  } catch (error) {
    console.error('[DB] 連接失敗:', error)
    return false
  }
}

/**
 * 關閉連接池
 */
export async function closePool(): Promise<void> {
  await pool.end()
  console.log('[DB] 連接池已關閉')
}

export { pool }
