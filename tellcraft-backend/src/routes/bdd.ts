/**
 * BDD Session API 路由
 * 處理 BDD 規格釐清流程
 */
import { Router, Request, Response } from 'express'
import { query, queryOne } from '../db/client'
import { requireAuth } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { createBddSessionSchema, answerSchema, confirmSchema, revertSchema, skipSchema, addItemsSchema } from '../schemas/bdd'
import crypto from 'crypto'
import { createLogger } from '../lib/logger'

const logger = createLogger('bdd')

const router: Router = Router()

// ============================================================
// 類型定義
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

// 將 DB row 轉換為 BddSession
function rowToSession(row: any): BddSession {
  return {
    id: row.id,
    projectId: row.project_id,
    conversationId: row.conversation_id,
    taskId: row.task_id,
    currentPhase: row.current_phase,
    currentRound: row.current_round,
    currentQuestionIndex: row.current_question_index,
    totalDiscovered: row.total_discovered,
    totalResolved: row.total_resolved,
    consecutiveEmptyRounds: row.consecutive_empty_rounds,
    clarifyItems: row.clarify_items || [],
    stagingItems: row.staging_items || [],
    resolvedItems: row.resolved_items || [],
    originalRequirements: row.original_requirements,
    projectContext: row.project_context || {},
    schemaSqlContent: row.schema_sql_content,
    entityMappingContent: row.entity_mapping_content,
    featuresContent: row.features_content,
    actionsYmlContent: row.actions_yml_content,
    isaConfigContent: row.isa_config_content,
    validationResult: row.validation_result,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ============================================================
// Ownership helpers（P0-3 修復：所有讀寫必須驗 user_id）
//
// bdd_sessions → projects.user_id 是唯一可信的 ownership 來源。
// 若 row 不存在或不屬於當前 user，一律回 404（不要回 403，避免 enumerate
// 導致洩漏「session 是否存在」這個訊號）。
// ============================================================

async function getOwnedBddSession(sessionId: string, userId: string): Promise<any | null> {
  return queryOne<any>(
    `SELECT bs.*
     FROM bdd_sessions bs
     JOIN projects p ON bs.project_id = p.id
     WHERE bs.id = $1 AND p.user_id = $2`,
    [sessionId, userId]
  )
}

async function getOwnedBddSessionByConversation(conversationId: string, userId: string): Promise<any | null> {
  return queryOne<any>(
    `SELECT bs.*
     FROM bdd_sessions bs
     JOIN conversations c ON bs.conversation_id = c.id
     JOIN projects p ON c.project_id = p.id
     WHERE bs.conversation_id = $1 AND p.user_id = $2
     ORDER BY bs.created_at DESC LIMIT 1`,
    [conversationId, userId]
  )
}

async function getOwnedBddSessionByProject(projectId: string, userId: string): Promise<any | null> {
  return queryOne<any>(
    `SELECT bs.*
     FROM bdd_sessions bs
     JOIN projects p ON bs.project_id = p.id
     WHERE bs.project_id = $1 AND p.user_id = $2
     ORDER BY bs.created_at DESC LIMIT 1`,
    [projectId, userId]
  )
}

async function assertConversationOwnership(conversationId: string, userId: string): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    `SELECT c.id
     FROM conversations c
     JOIN projects p ON c.project_id = p.id
     WHERE c.id = $1 AND p.user_id = $2`,
    [conversationId, userId]
  )
  return !!row
}

async function assertProjectOwnership(projectId: string, userId: string): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    `SELECT id FROM projects WHERE id = $1 AND user_id = $2`,
    [projectId, userId]
  )
  return !!row
}

// ============================================================
// API 端點
// ============================================================

/**
 * POST /api/bdd/session
 * 創建 BDD Session
 */
router.post('/session', requireAuth, validateBody(createBddSessionSchema), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const {
      conversationId,
      projectId,
      taskId,
      originalRequirements,
      projectContext,
    } = req.body

    // P0-3：建立 session 前驗 conversation 與 project 都屬於當前 user
    if (!await assertConversationOwnership(conversationId, userId)) {
      return res.status(404).json({ error: 'Session 不存在' })
    }
    if (projectId && !await assertProjectOwnership(projectId, userId)) {
      return res.status(404).json({ error: 'Session 不存在' })
    }

    // 查找之前的 session 來繼承已解決的項目（同樣經 ownership 驗證）
    let inheritedResolvedItems: ClarifyItem[] = []
    if (projectId) {
      const prevSession = await queryOne<{ resolved_items: ClarifyItem[] }>(
        `SELECT bs.resolved_items
         FROM bdd_sessions bs
         JOIN projects p ON bs.project_id = p.id
         WHERE bs.project_id = $1 AND p.user_id = $2
         ORDER BY bs.created_at DESC LIMIT 1`,
        [projectId, userId]
      )
      if (prevSession?.resolved_items) {
        inheritedResolvedItems = prevSession.resolved_items
      }
    }

    const sessionId = crypto.randomUUID()
    await query(
      `INSERT INTO bdd_sessions (
        id, project_id, conversation_id, task_id, current_phase,
        original_requirements, project_context, resolved_items,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [
        sessionId,
        projectId || null,
        conversationId,
        taskId || null,
        'prd_discovery',
        originalRequirements,
        JSON.stringify(projectContext || {}),
        JSON.stringify(inheritedResolvedItems),
      ]
    )

    res.json({ sessionId })
  } catch (error) {
    logger.error({ err: error }, '創建 Session 失敗')
    res.status(500).json({ error: '創建 BDD Session 失敗' })
  }
})

/**
 * GET /api/bdd/session/:id
 * 獲取 BDD Session
 */
router.get('/session/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const row = await getOwnedBddSession(id, req.user!.id)

    if (!row) {
      return res.status(404).json({ error: 'Session 不存在' })
    }

    res.json({ session: rowToSession(row) })
  } catch (error) {
    logger.error({ err: error }, '獲取 Session 失敗')
    res.status(500).json({ error: '獲取 BDD Session 失敗' })
  }
})

/**
 * GET /api/bdd/session/by-conversation/:conversationId
 * 根據對話 ID 獲取 BDD Session
 */
router.get('/session/by-conversation/:conversationId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params

    const row = await getOwnedBddSessionByConversation(conversationId, req.user!.id)

    if (!row) {
      return res.json({ session: null })
    }

    res.json({ session: rowToSession(row) })
  } catch (error) {
    logger.error({ err: error }, '獲取 Session 失敗')
    res.status(500).json({ error: '獲取 BDD Session 失敗' })
  }
})

/**
 * GET /api/bdd/session/by-project/:projectId
 * 根據專案 ID 獲取 BDD Session
 */
router.get('/session/by-project/:projectId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params

    const row = await getOwnedBddSessionByProject(projectId, req.user!.id)

    if (!row) {
      return res.json({ session: null })
    }

    res.json({ session: rowToSession(row) })
  } catch (error) {
    logger.error({ err: error }, '獲取 Session 失敗')
    res.status(500).json({ error: '獲取 BDD Session 失敗' })
  }
})

/**
 * PATCH /api/bdd/session/:id
 * 更新 BDD Session
 */
router.patch('/session/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    // P0-3：更新前先驗 ownership
    const owned = await getOwnedBddSession(id, userId)
    if (!owned) {
      return res.status(404).json({ error: 'Session 不存在' })
    }

    const updates = req.body as Partial<{
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

    // 構建更新語句
    const setClauses: string[] = ['updated_at = NOW()']
    const params: any[] = []
    let paramIndex = 1

    const fieldMap: Record<string, string> = {
      currentPhase: 'current_phase',
      currentRound: 'current_round',
      currentQuestionIndex: 'current_question_index',
      totalDiscovered: 'total_discovered',
      totalResolved: 'total_resolved',
      consecutiveEmptyRounds: 'consecutive_empty_rounds',
      clarifyItems: 'clarify_items',
      stagingItems: 'staging_items',
      resolvedItems: 'resolved_items',
      schemaSqlContent: 'schema_sql_content',
      entityMappingContent: 'entity_mapping_content',
      featuresContent: 'features_content',
      actionsYmlContent: 'actions_yml_content',
      isaConfigContent: 'isa_config_content',
      validationResult: 'validation_result',
    }

    for (const [key, value] of Object.entries(updates)) {
      const dbField = fieldMap[key]
      if (dbField && value !== undefined) {
        setClauses.push(`${dbField} = $${paramIndex}`)
        // JSON 欄位需要 stringify
        if (['clarifyItems', 'stagingItems', 'resolvedItems', 'validationResult'].includes(key)) {
          params.push(JSON.stringify(value))
        } else {
          params.push(value)
        }
        paramIndex++
      }
    }

    params.push(id)
    const sql = `UPDATE bdd_sessions SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`

    await query(sql, params)

    // 返回更新後的 session（重新驗 ownership 確保 race-safe）
    const row = await getOwnedBddSession(id, userId)
    if (!row) {
      return res.status(404).json({ error: 'Session 不存在' })
    }

    res.json({ session: rowToSession(row) })
  } catch (error) {
    logger.error({ err: error }, '更新 Session 失敗')
    res.status(500).json({ error: '更新 BDD Session 失敗' })
  }
})

/**
 * POST /api/bdd/session/:id/answer
 * 回答釐清項目
 */
router.post('/session/:id/answer', requireAuth, validateBody(answerSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { itemId, answer } = req.body

    const row = await getOwnedBddSession(id, req.user!.id)
    if (!row) {
      return res.status(404).json({ error: 'Session 不存在' })
    }

    const clarifyItems: ClarifyItem[] = row.clarify_items || []
    const resolvedItems: ClarifyItem[] = row.resolved_items || []

    // 找到並更新項目
    const itemIndex = clarifyItems.findIndex(item => item.id === itemId)
    if (itemIndex === -1) {
      return res.status(404).json({ error: '項目不存在' })
    }

    const item = clarifyItems[itemIndex]
    item.answer = answer
    item.status = 'answered'
    item.answeredAt = new Date().toISOString()

    // 移動到已解決列表
    clarifyItems.splice(itemIndex, 1)
    resolvedItems.push(item)

    // 更新 session
    await query(
      `UPDATE bdd_sessions SET
        clarify_items = $1,
        resolved_items = $2,
        total_resolved = $3,
        current_question_index = GREATEST(0, current_question_index - 1),
        updated_at = NOW()
       WHERE id = $4`,
      [JSON.stringify(clarifyItems), JSON.stringify(resolvedItems), resolvedItems.length, id]
    )

    res.json({ success: true, item, remainingCount: clarifyItems.length })
  } catch (error) {
    logger.error({ err: error }, '回答項目失敗')
    res.status(500).json({ error: '回答項目失敗' })
  }
})

/**
 * POST /api/bdd/session/:id/confirm
 * 批次確認項目
 */
router.post('/session/:id/confirm', requireAuth, validateBody(confirmSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { itemIds, answers } = req.body

    const row = await getOwnedBddSession(id, req.user!.id)
    if (!row) {
      return res.status(404).json({ error: 'Session 不存在' })
    }

    const clarifyItems: ClarifyItem[] = row.clarify_items || []
    const resolvedItems: ClarifyItem[] = row.resolved_items || []
    const now = new Date().toISOString()

    // 處理每個項目
    for (const itemId of itemIds) {
      const itemIndex = clarifyItems.findIndex(item => item.id === itemId)
      if (itemIndex !== -1) {
        const item = clarifyItems[itemIndex]
        item.answer = answers[itemId] || item.answer || '已確認'
        item.status = 'answered'
        item.answeredAt = now

        clarifyItems.splice(itemIndex, 1)
        resolvedItems.push(item)
      }
    }

    // 更新 session
    await query(
      `UPDATE bdd_sessions SET
        clarify_items = $1,
        resolved_items = $2,
        total_resolved = $3,
        updated_at = NOW()
       WHERE id = $4`,
      [JSON.stringify(clarifyItems), JSON.stringify(resolvedItems), resolvedItems.length, id]
    )

    res.json({ success: true, confirmedCount: itemIds.length, remainingCount: clarifyItems.length })
  } catch (error) {
    logger.error({ err: error }, '批次確認失敗')
    res.status(500).json({ error: '批次確認失敗' })
  }
})

/**
 * POST /api/bdd/session/:id/revert
 * 撤銷回答
 */
router.post('/session/:id/revert', requireAuth, validateBody(revertSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { itemId } = req.body

    const row = await getOwnedBddSession(id, req.user!.id)
    if (!row) {
      return res.status(404).json({ error: 'Session 不存在' })
    }

    const clarifyItems: ClarifyItem[] = row.clarify_items || []
    const resolvedItems: ClarifyItem[] = row.resolved_items || []

    // 找到已解決的項目
    const itemIndex = resolvedItems.findIndex(item => item.id === itemId)
    if (itemIndex === -1) {
      return res.status(404).json({ error: '項目不存在' })
    }

    const item = resolvedItems[itemIndex]
    item.answer = undefined
    item.status = 'pending'
    item.answeredAt = undefined

    // 移回待釐清列表
    resolvedItems.splice(itemIndex, 1)
    clarifyItems.unshift(item)

    // 更新 session
    await query(
      `UPDATE bdd_sessions SET
        clarify_items = $1,
        resolved_items = $2,
        total_resolved = $3,
        updated_at = NOW()
       WHERE id = $4`,
      [JSON.stringify(clarifyItems), JSON.stringify(resolvedItems), resolvedItems.length, id]
    )

    res.json({ success: true, item })
  } catch (error) {
    logger.error({ err: error }, '撤銷回答失敗')
    res.status(500).json({ error: '撤銷回答失敗' })
  }
})

/**
 * POST /api/bdd/session/:id/skip
 * 跳過項目
 */
router.post('/session/:id/skip', requireAuth, validateBody(skipSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { itemId } = req.body

    const row = await getOwnedBddSession(id, req.user!.id)
    if (!row) {
      return res.status(404).json({ error: 'Session 不存在' })
    }

    const clarifyItems: ClarifyItem[] = row.clarify_items || []

    // 找到並跳過項目
    const item = clarifyItems.find(item => item.id === itemId)
    if (!item) {
      return res.status(404).json({ error: '項目不存在' })
    }

    item.status = 'skipped'

    // 更新 session
    await query(
      `UPDATE bdd_sessions SET
        clarify_items = $1,
        updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(clarifyItems), id]
    )

    res.json({ success: true, item })
  } catch (error) {
    logger.error({ err: error }, '跳過項目失敗')
    res.status(500).json({ error: '跳過項目失敗' })
  }
})

/**
 * POST /api/bdd/session/:id/items
 * 新增釐清項目
 */
router.post('/session/:id/items', requireAuth, validateBody(addItemsSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { items } = req.body

    const row = await getOwnedBddSession(id, req.user!.id)
    if (!row) {
      return res.status(404).json({ error: 'Session 不存在' })
    }

    const clarifyItems: ClarifyItem[] = row.clarify_items || []
    const now = new Date().toISOString()

    // 新增項目
    const newItems: ClarifyItem[] = items.map((item: { question: string; category?: string }) => ({
      ...item,
      id: crypto.randomUUID(),
      status: 'pending' as const,
      createdAt: now,
    }))

    clarifyItems.push(...newItems)

    // 更新 session
    await query(
      `UPDATE bdd_sessions SET
        clarify_items = $1,
        total_discovered = $2,
        updated_at = NOW()
       WHERE id = $3`,
      [JSON.stringify(clarifyItems), clarifyItems.length + (row.resolved_items?.length || 0), id]
    )

    res.json({ success: true, addedCount: newItems.length, totalCount: clarifyItems.length })
  } catch (error) {
    logger.error({ err: error }, '新增項目失敗')
    res.status(500).json({ error: '新增項目失敗' })
  }
})

/**
 * GET /api/bdd/session/:id/current
 * 獲取當前釐清項目
 */
router.get('/session/:id/current', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const row = await getOwnedBddSession(id, req.user!.id)
    if (!row) {
      return res.status(404).json({ error: 'Session 不存在' })
    }

    const clarifyItems: ClarifyItem[] = row.clarify_items || []
    const pendingItems = clarifyItems.filter(item => item.status === 'pending')
    const currentIndex = row.current_question_index || 0

    const currentItem = pendingItems[currentIndex] || null

    res.json({
      currentItem,
      currentIndex,
      totalPending: pendingItems.length,
      totalResolved: row.resolved_items?.length || 0,
    })
  } catch (error) {
    logger.error({ err: error }, '獲取當前項目失敗')
    res.status(500).json({ error: '獲取當前項目失敗' })
  }
})

/**
 * GET /api/bdd/session/:id/progress
 * 獲取進度
 */
router.get('/session/:id/progress', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const row = await getOwnedBddSession(id, req.user!.id)
    if (!row) {
      return res.status(404).json({ error: 'Session 不存在' })
    }

    const clarifyItems: ClarifyItem[] = row.clarify_items || []
    const resolvedItems: ClarifyItem[] = row.resolved_items || []

    res.json({
      currentPhase: row.current_phase,
      currentRound: row.current_round,
      totalDiscovered: clarifyItems.length + resolvedItems.length,
      totalResolved: resolvedItems.length,
      pendingCount: clarifyItems.filter(i => i.status === 'pending').length,
      skippedCount: clarifyItems.filter(i => i.status === 'skipped').length,
      consecutiveEmptyRounds: row.consecutive_empty_rounds,
    })
  } catch (error) {
    logger.error({ err: error }, '獲取進度失敗')
    res.status(500).json({ error: '獲取進度失敗' })
  }
})

export default router
