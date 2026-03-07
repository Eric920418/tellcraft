/**
 * BDD Session API 路由
 * 處理 BDD 規格釐清流程
 */
import { Router, Request, Response } from 'express'
import { query, queryOne } from '../db/client'
import { requireAuth } from '../middleware/auth'
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
// API 端點
// ============================================================

/**
 * POST /api/bdd/session
 * 創建 BDD Session
 */
router.post('/session', requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      conversationId,
      projectId,
      taskId,
      originalRequirements,
      projectContext,
    } = req.body as {
      conversationId: string
      projectId?: string
      taskId?: string
      originalRequirements: string
      projectContext?: Record<string, unknown>
    }

    if (!conversationId || !originalRequirements) {
      return res.status(400).json({ error: '缺少必要參數' })
    }

    // 查找之前的 session 來繼承已解決的項目
    let inheritedResolvedItems: ClarifyItem[] = []
    if (projectId) {
      const prevSession = await queryOne<{ resolved_items: ClarifyItem[] }>(
        `SELECT resolved_items FROM bdd_sessions
         WHERE project_id = $1
         ORDER BY created_at DESC LIMIT 1`,
        [projectId]
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

    const row = await queryOne<any>(
      'SELECT * FROM bdd_sessions WHERE id = $1',
      [id]
    )

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

    const row = await queryOne<any>(
      `SELECT * FROM bdd_sessions
       WHERE conversation_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [conversationId]
    )

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

    const row = await queryOne<any>(
      `SELECT * FROM bdd_sessions
       WHERE project_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [projectId]
    )

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

    // 返回更新後的 session
    const row = await queryOne<any>('SELECT * FROM bdd_sessions WHERE id = $1', [id])
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
router.post('/session/:id/answer', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { itemId, answer } = req.body as { itemId: string; answer: string }

    if (!itemId || !answer) {
      return res.status(400).json({ error: '缺少必要參數' })
    }

    // 獲取 session
    const row = await queryOne<any>('SELECT * FROM bdd_sessions WHERE id = $1', [id])
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
router.post('/session/:id/confirm', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { itemIds, answers } = req.body as { itemIds: string[]; answers: Record<string, string> }

    if (!itemIds || itemIds.length === 0) {
      return res.status(400).json({ error: '缺少必要參數' })
    }

    // 獲取 session
    const row = await queryOne<any>('SELECT * FROM bdd_sessions WHERE id = $1', [id])
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
router.post('/session/:id/revert', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { itemId } = req.body as { itemId: string }

    if (!itemId) {
      return res.status(400).json({ error: '缺少必要參數' })
    }

    // 獲取 session
    const row = await queryOne<any>('SELECT * FROM bdd_sessions WHERE id = $1', [id])
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
router.post('/session/:id/skip', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { itemId } = req.body as { itemId: string }

    if (!itemId) {
      return res.status(400).json({ error: '缺少必要參數' })
    }

    // 獲取 session
    const row = await queryOne<any>('SELECT * FROM bdd_sessions WHERE id = $1', [id])
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
router.post('/session/:id/items', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { items } = req.body as { items: Omit<ClarifyItem, 'id' | 'status' | 'createdAt'>[] }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: '缺少必要參數' })
    }

    // 獲取 session
    const row = await queryOne<any>('SELECT * FROM bdd_sessions WHERE id = $1', [id])
    if (!row) {
      return res.status(404).json({ error: 'Session 不存在' })
    }

    const clarifyItems: ClarifyItem[] = row.clarify_items || []
    const now = new Date().toISOString()

    // 新增項目
    const newItems: ClarifyItem[] = items.map(item => ({
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

    const row = await queryOne<any>('SELECT * FROM bdd_sessions WHERE id = $1', [id])
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

    const row = await queryOne<any>('SELECT * FROM bdd_sessions WHERE id = $1', [id])
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
