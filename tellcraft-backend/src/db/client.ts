import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg'
import { getEnv } from '../lib/env'
import { createLogger } from '../lib/logger'

const logger = createLogger('db')

// 連接池
const pool = new Pool({
  connectionString: getEnv().DATABASE_URL,
  max: getEnv().DB_POOL_MAX,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
})

// 監聯連接錯誤
pool.on('error', (err) => {
  logger.error({ err }, '連接池錯誤')
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
      logger.warn({ duration, query: text.substring(0, 100) }, '慢查詢')
    }
    return result
  } catch (error) {
    logger.error({ err: error }, '查詢錯誤')
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
    credits_used_this_period: number
    message_count_this_period: number
  }>(
    'SELECT id, email, plan, subscription_status, credits_used_this_period, message_count_this_period FROM users WHERE id = $1',
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
    open_api_spec_content: string | null
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
    // Event Storming
    es_document_content: string | null
    // 變更歷史
    change_history: unknown[] | null
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
    openApiSpecContent: 'open_api_spec_content',
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
    // Event Storming
    esDocumentContent: 'es_document_content',
    // 變更歷史
    changeHistory: 'change_history',
  }

  // PostgreSQL 原生陣列欄位（TEXT[]）— 不能 JSON.stringify，要讓 pg driver 處理
  const pgArrayColumns = new Set(['selectedVariantIds'])

  for (const [key, value] of Object.entries(updates)) {
    const column = columnMap[key] || key
    setClauses.push(`${column} = $${paramIndex++}`)
    if (pgArrayColumns.has(key)) {
      // 原生 PostgreSQL 陣列：直接傳 JS array，pg driver 會轉為 {E} 格式
      params.push(value)
    } else {
      params.push(typeof value === 'object' ? JSON.stringify(value) : value)
    }
  }

  setClauses.push(`updated_at = NOW()`)
  params.push(sessionId)

  return query(
    `UPDATE bdd_sessions SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
    params
  )
}

// ============================================================
// Project Files（多 Skill 代碼存儲）
// ============================================================

export interface ProjectFile {
  id: string
  project_id: string
  skill_source: string
  file_path: string
  content: string
  description: string | null
  file_type: string
  created_at: string
  updated_at: string
  validation_status?: 'passed' | 'failed' | 'unknown'
  last_validated_at?: string | null
  last_validated_content?: string | null
}

export type ValidationStatus = 'passed' | 'failed' | 'unknown'

/**
 * 批量 UPSERT 專案檔案
 *
 * validationStatus 'passed' 時同步更新 last_validated_content（建立 LKG 快照）；
 * 'failed' 時只更新 content 但保留舊的 last_validated_content（LKG 永不被覆蓋）；
 * 'unknown' 時兩者都不動（向後相容）。
 */
export async function upsertProjectFiles(
  projectId: string,
  skillSource: string,
  files: { filePath: string; content: string; description?: string; fileType: string }[],
  validationStatus: ValidationStatus = 'unknown'
) {
  if (files.length === 0) return

  // 用事務批量 UPSERT
  return transaction(async (client) => {
    for (const file of files) {
      if (validationStatus === 'passed') {
        // 通過驗證：同步更新 LKG
        await client.query(
          `INSERT INTO project_files (project_id, skill_source, file_path, content, description, file_type, validation_status, last_validated_at, last_validated_content, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, 'passed', NOW(), $4, NOW(), NOW())
           ON CONFLICT (project_id, skill_source, file_path)
           DO UPDATE SET content = $4, description = $5, file_type = $6, validation_status = 'passed', last_validated_at = NOW(), last_validated_content = $4, updated_at = NOW()`,
          [projectId, skillSource, file.filePath, file.content, file.description || null, file.fileType]
        )
      } else if (validationStatus === 'failed') {
        // 驗證失敗：更新 content 但保留 last_validated_content
        await client.query(
          `INSERT INTO project_files (project_id, skill_source, file_path, content, description, file_type, validation_status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, 'failed', NOW(), NOW())
           ON CONFLICT (project_id, skill_source, file_path)
           DO UPDATE SET content = $4, description = $5, file_type = $6, validation_status = 'failed', updated_at = NOW()`,
          [projectId, skillSource, file.filePath, file.content, file.description || null, file.fileType]
        )
      } else {
        // 未驗證：向後相容舊行為，兩者都不動
        await client.query(
          `INSERT INTO project_files (project_id, skill_source, file_path, content, description, file_type, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
           ON CONFLICT (project_id, skill_source, file_path)
           DO UPDATE SET content = $4, description = $5, file_type = $6, updated_at = NOW()`,
          [projectId, skillSource, file.filePath, file.content, file.description || null, file.fileType]
        )
      }
    }
  })
}

/**
 * 取得 Last Known Good 版本：
 * 優先回傳 last_validated_content（LKG）；若 null 則 fallback content（向後相容）。
 * 用於前端首次載入 / F5 / 切 conversation 時保證不拿到壞代碼。
 */
export async function getLastValidatedProjectFiles(
  projectId: string,
  skillSource?: string
): Promise<ProjectFile[]> {
  const rows = skillSource
    ? await queryMany<ProjectFile>(
        `SELECT id, project_id, skill_source, file_path,
                COALESCE(last_validated_content, content) AS content,
                description, file_type, created_at, updated_at,
                validation_status, last_validated_at, last_validated_content
         FROM project_files
         WHERE project_id = $1 AND skill_source = $2
         ORDER BY file_path`,
        [projectId, skillSource]
      )
    : await queryMany<ProjectFile>(
        `SELECT id, project_id, skill_source, file_path,
                COALESCE(last_validated_content, content) AS content,
                description, file_type, created_at, updated_at,
                validation_status, last_validated_at, last_validated_content
         FROM project_files
         WHERE project_id = $1
         ORDER BY skill_source, file_path`,
        [projectId]
      )
  return rows
}

/**
 * 查詢專案檔案（可選 skillSource 過濾）
 */
export async function getProjectFiles(
  projectId: string,
  skillSource?: string
): Promise<ProjectFile[]> {
  if (skillSource) {
    return queryMany<ProjectFile>(
      'SELECT * FROM project_files WHERE project_id = $1 AND skill_source = $2 ORDER BY file_path',
      [projectId, skillSource]
    )
  }
  return queryMany<ProjectFile>(
    'SELECT * FROM project_files WHERE project_id = $1 ORDER BY skill_source, file_path',
    [projectId]
  )
}

/**
 * 查詢單一專案檔案
 */
export async function getProjectFile(
  projectId: string,
  skillSource: string,
  filePath: string
): Promise<ProjectFile | null> {
  return queryOne<ProjectFile>(
    'SELECT * FROM project_files WHERE project_id = $1 AND skill_source = $2 AND file_path = $3',
    [projectId, skillSource, filePath]
  )
}

/**
 * 按 skill 刪除專案檔案
 */
export async function deleteProjectFiles(
  projectId: string,
  skillSource: string
) {
  return query(
    'DELETE FROM project_files WHERE project_id = $1 AND skill_source = $2',
    [projectId, skillSource]
  )
}

/**
 * 按路徑刪除專案檔案（跨 skill_source）
 */
export async function deleteProjectFilesByPaths(
  projectId: string,
  paths: string[]
): Promise<void> {
  if (paths.length === 0) return
  await query(
    'DELETE FROM project_files WHERE project_id = $1 AND file_path = ANY($2)',
    [projectId, paths]
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
// LINE Bot 活躍對話
// ============================================================

export interface LineActiveConversation {
  line_user_id: string
  user_id: string
  conversation_id: string
  project_id: string
  mode: string
}

/**
 * 查詢 LINE 用戶的活躍對話
 */
export async function getLineActiveConversation(lineUserId: string): Promise<LineActiveConversation | null> {
  return queryOne<LineActiveConversation>(
    'SELECT * FROM line_active_conversations WHERE line_user_id = $1',
    [lineUserId]
  )
}

/**
 * 設定/更新 LINE 用戶的活躍對話
 */
export async function setLineActiveConversation(
  lineUserId: string,
  userId: string,
  conversationId: string,
  projectId: string,
  mode: string = 'fast'
) {
  return query(
    `INSERT INTO line_active_conversations (line_user_id, user_id, conversation_id, project_id, mode, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     ON CONFLICT (line_user_id)
     DO UPDATE SET conversation_id = $3, project_id = $4, mode = $5, updated_at = NOW()`,
    [lineUserId, userId, conversationId, projectId, mode]
  )
}

/**
 * 刪除 LINE 用戶的活躍對話（用於建新專案時清除）
 */
export async function deleteLineActiveConversation(lineUserId: string) {
  return query(
    'DELETE FROM line_active_conversations WHERE line_user_id = $1',
    [lineUserId]
  )
}

/**
 * 透過 conversation_id 刪除 LINE 活躍對話映射（用於「開始新專案」清除舊映射）
 */
export async function deleteLineActiveConversationByConversationId(conversationId: string) {
  return query(
    'DELETE FROM line_active_conversations WHERE conversation_id = $1',
    [conversationId]
  )
}

/**
 * 透過 LINE userId 查找系統用戶
 */
export async function findUserByLineId(lineUserId: string): Promise<{ id: string; email: string; name: string | null } | null> {
  // 優先查 user_providers 表
  const result = await queryOne<{ id: string; email: string; name: string | null }>(
    `SELECT u.id, u.email, u.name FROM user_providers up
     JOIN users u ON up.user_id = u.id
     WHERE up.provider = 'line' AND up.provider_id = $1`,
    [lineUserId]
  )
  if (result) return result

  // 向後相容：查 users 表
  return queryOne<{ id: string; email: string; name: string | null }>(
    `SELECT id, email, name FROM users
     WHERE provider = 'line' AND provider_id = $1`,
    [lineUserId]
  )
}

// ============================================================
// LINE 推播查詢
// ============================================================

/**
 * 透過 conversationId 查找 LINE 用戶的 provider_id（LINE userId）
 * conversations → projects → users（provider='line'）
 */
export async function getLineUserIdByConversation(conversationId: string): Promise<string | null> {
  // 優先查 user_providers 表（支援帳號綁定後的 LINE 推播）
  const result = await queryOne<{ provider_id: string }>(
    `SELECT up.provider_id FROM conversations c
     JOIN projects p ON c.project_id = p.id
     JOIN user_providers up ON p.user_id = up.user_id
     WHERE c.id = $1 AND up.provider = 'line'`,
    [conversationId]
  )
  if (result) return result.provider_id

  // 向後相容：查 users 表（舊用戶可能未遷移）
  const fallback = await queryOne<{ provider_id: string }>(
    `SELECT u.provider_id FROM conversations c
     JOIN projects p ON c.project_id = p.id
     JOIN users u ON p.user_id = u.id
     WHERE c.id = $1 AND u.provider = 'line' AND u.provider_id IS NOT NULL`,
    [conversationId]
  )
  return fallback?.provider_id ?? null
}

// ============================================================
// Telegram 活躍對話映射（與 LINE 完全對應）
// ============================================================

interface TelegramActiveConversation {
  telegram_user_id: string
  user_id: string
  conversation_id: string
  project_id: string
  mode: string
}

/**
 * 查詢 Telegram 用戶的活躍對話
 * tgUserId 傳 string，DB 欄位 BIGINT，用 $1::bigint 轉型
 */
export async function getTelegramActiveConversation(tgUserId: string): Promise<TelegramActiveConversation | null> {
  return queryOne<TelegramActiveConversation>(
    'SELECT * FROM telegram_active_conversations WHERE telegram_user_id = $1::bigint',
    [tgUserId]
  )
}

/**
 * 設定/更新 Telegram 用戶的活躍對話
 */
export async function setTelegramActiveConversation(
  tgUserId: string,
  userId: string,
  conversationId: string,
  projectId: string,
  mode: string = 'fast'
) {
  return query(
    `INSERT INTO telegram_active_conversations (telegram_user_id, user_id, conversation_id, project_id, mode, created_at, updated_at)
     VALUES ($1::bigint, $2, $3, $4, $5, NOW(), NOW())
     ON CONFLICT (telegram_user_id) DO UPDATE SET
       user_id = EXCLUDED.user_id,
       conversation_id = EXCLUDED.conversation_id,
       project_id = EXCLUDED.project_id,
       mode = EXCLUDED.mode,
       updated_at = NOW()`,
    [tgUserId, userId, conversationId, projectId, mode]
  )
}

/**
 * 刪除 Telegram 用戶的活躍對話（用於建新專案時清除）
 */
export async function deleteTelegramActiveConversation(tgUserId: string) {
  return query(
    'DELETE FROM telegram_active_conversations WHERE telegram_user_id = $1::bigint',
    [tgUserId]
  )
}

/**
 * 透過 Telegram userId 查找系統用戶
 */
export async function findUserByTelegramId(tgUserId: string): Promise<{ id: string; email: string; name: string | null } | null> {
  // 優先查 user_providers 表
  const result = await queryOne<{ id: string; email: string; name: string | null }>(
    `SELECT u.id, u.email, u.name FROM user_providers up
     JOIN users u ON up.user_id = u.id
     WHERE up.provider = 'telegram' AND up.provider_id = $1`,
    [tgUserId]
  )
  if (result) return result

  // 向後相容：查 users 表
  return queryOne<{ id: string; email: string; name: string | null }>(
    `SELECT id, email, name FROM users WHERE provider = 'telegram' AND provider_id = $1`,
    [tgUserId]
  )
}

/**
 * 透過 conversationId 查找 Telegram 用戶的 provider_id（BIGINT string）
 * JOIN user_providers WHERE provider='telegram'，降級查 users.provider='telegram'
 */
export async function getTelegramUserIdByConversation(conversationId: string): Promise<string | null> {
  // 優先查 user_providers 表
  const result = await queryOne<{ provider_id: string }>(
    `SELECT up.provider_id FROM conversations c
     JOIN projects p ON c.project_id = p.id
     JOIN user_providers up ON p.user_id = up.user_id
     WHERE c.id = $1 AND up.provider = 'telegram'`,
    [conversationId]
  )
  if (result) return result.provider_id

  // 向後相容：查 users 表
  const fallback = await queryOne<{ provider_id: string }>(
    `SELECT u.provider_id FROM conversations c
     JOIN projects p ON c.project_id = p.id
     JOIN users u ON p.user_id = u.id
     WHERE c.id = $1 AND u.provider = 'telegram' AND u.provider_id IS NOT NULL`,
    [conversationId]
  )
  return fallback?.provider_id ?? null
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
    logger.info('連接成功')
    return true
  } catch (error) {
    logger.error({ err: error }, '連接失敗')
    return false
  }
}

/**
 * 關閉連接池
 */
export async function closePool(): Promise<void> {
  await pool.end()
  logger.info('連接池已關閉')
}

export { pool }
