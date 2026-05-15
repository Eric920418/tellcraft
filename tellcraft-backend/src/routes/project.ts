import { Router, type Router as RouterType } from 'express'
import archiver from 'archiver'
import { Queue } from 'bullmq'
import type Redis from 'ioredis'
import { requireAuth, requireActiveSubscription, requirePlan } from '../middleware/auth'
import { validateBody } from '../middleware/validate'
import { createProjectSchema, templateOverridesSchema, batchDeleteSchema, emailConfigSchema, cmsSlotsSchema } from '../schemas/project'
import { parseTellcraftDesignMd } from '../services/design-md-importer'
import { freezeDesignSystem } from '../services/design-system-freeze'
import { getEnv } from '../lib/env'

// Phase I: BullMQ queue + Redis client（在 index.ts 注入後 endpoint 才能用）
let orchestratorQueue: Queue | null = null
let redisClient: Redis | null = null
export function setProjectOrchestratorQueue(q: Queue) { orchestratorQueue = q }
export function setProjectRedisClient(r: Redis) { redisClient = r }
import {
  mergeSlotsWithDefaults,
  validateSlotOverrides,
  getSlotsSchemaForUI,
  getLockedItems,
  CMS_SKELETON_VERSION,
  generateSkeletonServerActions,
  type SlotsOverride,
} from '../services/cms-skeleton'
import {
  generateAdminLayoutShell,
  getAdminShellOptionsFromSlots,
} from '../services/cms-skeleton/ui-scaffold'
import * as db from '../db/client'
import { toVercelSlug, deleteVercelProject } from '../services/deployer'
import { deleteNeonProject } from '../services/neon-service'
import { repairProjectFiles, applyFixersToContent } from '../services/code-repair'
import { buildDownloadBundle } from '../services/download-bundler'
import { getProjectLimit } from '../config/plans'
import { createLogger } from '../lib/logger'

const logger = createLogger('project')

const router: RouterType = Router()

/**
 * 把 download bundler 產出的檔案陣列打包成 ZIP buffer。
 * 共用於三個 download-code route。
 */
async function zipBundleFiles(
  files: Array<{ path: string; content: string }>
): Promise<Buffer> {
  const archive = archiver('zip', { zlib: { level: 6 } })
  const chunks: Buffer[] = []
  await new Promise<void>((resolve, reject) => {
    archive.on('data', (chunk: Buffer) => chunks.push(chunk))
    archive.on('end', resolve)
    archive.on('error', reject)
    archive.on('warning', (warn) => logger.warn({ warn }, 'archiver warning'))
    for (const f of files) {
      archive.append(Buffer.from(f.content), { name: f.path })
    }
    archive.finalize().catch(reject)
  })
  return Buffer.concat(chunks)
}

// ============================================================
// 專案 API
// ============================================================

/**
 * GET /api/project
 * 取得用戶的所有專案（支持分頁和搜索）
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id
    const { page = '1', pageSize = '10', search, status } = req.query as {
      page?: string
      pageSize?: string
      search?: string
      status?: string
    }

    const pageNum = parseInt(page, 10)
    const limit = parseInt(pageSize, 10)
    const offset = (pageNum - 1) * limit

    // 構建 WHERE 條件
    const conditions = ['p.user_id = $1']
    const params: (string | number)[] = [userId]
    let paramIndex = 2

    if (search) {
      conditions.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`)
      params.push(`%${search}%`)
      paramIndex++
    }

    if (status) {
      conditions.push(`p.status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    const whereClause = conditions.join(' AND ')

    // 查詢總數
    const countResult = await db.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM projects p WHERE ${whereClause}`,
      params
    )
    const total = parseInt(countResult?.count || '0', 10)

    // 查詢專案列表（包含對話數量 + 最新對話 ID）
    const projects = await db.queryMany<{
      id: string
      name: string
      description: string | null
      status: string
      vercel_url: string | null
      custom_domain: string | null
      is_pinned: boolean
      created_at: string
      updated_at: string
      conversation_count: string
      latest_conversation_id: string | null
    }>(
      `SELECT p.id, p.name, p.description, p.status, p.vercel_url, p.custom_domain,
              p.is_pinned, p.created_at, p.updated_at,
              COUNT(c.id) as conversation_count,
              (SELECT c2.id FROM conversations c2
               WHERE c2.project_id = p.id
               ORDER BY c2.updated_at DESC LIMIT 1) as latest_conversation_id
       FROM projects p
       LEFT JOIN conversations c ON c.project_id = p.id
       WHERE ${whereClause}
       GROUP BY p.id
       ORDER BY p.is_pinned DESC, p.pinned_at DESC NULLS LAST, p.updated_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    )

    res.json({
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        vercelUrl: p.vercel_url,
        customDomain: p.custom_domain,
        conversationCount: parseInt(p.conversation_count, 10),
        latestConversationId: p.latest_conversation_id,
        isPinned: p.is_pinned,
        createdAt: p.created_at,
        updatedAt: p.updated_at
      })),
      total,
      page: pageNum,
      pageSize: limit
    })
  } catch (error) {
    logger.error({ err: error }, '取得專案列表失敗')
    res.status(500).json({ error: 'Failed to get projects' })
  }
})

/**
 * POST /api/project/:id/pin
 * 置頂/取消置頂專案
 */
router.post('/:id/pin', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    // 驗證專案擁有權
    const project = await db.queryOne<{ user_id: string; is_pinned: boolean }>(
      'SELECT user_id, is_pinned FROM projects WHERE id = $1',
      [id]
    )

    if (!project || project.user_id !== userId) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const newPinned = !project.is_pinned

    await db.query(
      `UPDATE projects SET is_pinned = $1, pinned_at = $2 WHERE id = $3`,
      [newPinned, newPinned ? new Date().toISOString() : null, id]
    )

    res.json({ success: true, isPinned: newPinned })
  } catch (error) {
    logger.error({ err: error }, '置頂專案失敗')
    res.status(500).json({ error: 'Failed to toggle pin' })
  }
})

/**
 * GET /api/project/:id
 * 取得單一專案
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const project = await db.getProject(id)
    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    // 確保用戶擁有該專案
    if (project.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // 取得對話
    const conversation = await db.queryOne<{
      id: string
      messages: unknown[]
      spec_complete: boolean
    }>(
      'SELECT id, messages, spec_complete FROM conversations WHERE project_id = $1',
      [id]
    )

    res.json({
      project,
      conversation,
    })
  } catch (error) {
    logger.error({ err: error }, '取得專案失敗')
    res.status(500).json({ error: 'Failed to get project' })
  }
})

/**
 * POST /api/project
 * 創建專案
 */
router.post('/', requireAuth, requireActiveSubscription, validateBody(createProjectSchema), async (req, res) => {
  try {
    const userId = req.user!.id
    const userPlan = req.user!.plan
    const { name, description } = req.body

    // 檢查專案數量限制
    const { rows: [{ count }] } = await db.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM projects WHERE user_id = $1',
      [userId]
    )

    const limit = getProjectLimit(userPlan)
    if (parseInt(count) >= limit) {
      return res.status(403).json({
        error: 'Project limit reached',
        limit,
        current: parseInt(count),
      })
    }

    // 處理名稱重複
    let finalName = name
    const existingProjects = await db.queryMany<{ name: string }>(
      "SELECT name FROM projects WHERE user_id = $1 AND name LIKE $2",
      [userId, `${name}%`]
    )

    if (existingProjects.length > 0) {
      const existingNames = new Set(existingProjects.map(p => p.name))
      if (existingNames.has(name)) {
        let suffix = 2
        while (existingNames.has(`${name} (${suffix})`)) {
          suffix++
        }
        finalName = `${name} (${suffix})`
      }
    }

    // 創建專案
    const project = await db.queryOne<{ id: string; status: string }>(
      `INSERT INTO projects (user_id, name, description, status, created_at, updated_at)
       VALUES ($1, $2, $3, 'draft', NOW(), NOW())
       RETURNING id, status`,
      [userId, finalName, description || null]
    )

    if (!project) {
      return res.status(500).json({ error: 'Failed to create project' })
    }

    // 創建對話
    await db.query(
      `INSERT INTO conversations (project_id, messages, spec_complete, created_at, updated_at)
       VALUES ($1, '[]', false, NOW(), NOW())`,
      [project.id]
    )

    res.json({
      success: true,
      project: {
        id: project.id,
        name: finalName,
        status: project.status,
      },
    })
  } catch (error) {
    logger.error({ err: error }, '創建專案失敗')
    res.status(500).json({ error: 'Failed to create project' })
  }
})

/**
 * PATCH /api/project/:id
 * 更新專案
 */
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const { name, description } = req.body

    // 確保用戶擁有該專案
    const project = await db.getProject(id)
    if (!project || project.user_id !== userId) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const updates: string[] = []
    const params: unknown[] = []
    let paramIndex = 1

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`)
      params.push(name)
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`)
      params.push(description)
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' })
    }

    updates.push(`updated_at = NOW()`)
    params.push(id)

    await db.query(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      params
    )

    res.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, '更新專案失敗')
    res.status(500).json({ error: 'Failed to update project' })
  }
})

/**
 * GET /api/project/:id/email-config
 * 讀取 email 配置（Resend API key masked、From 信箱）
 * 安全：API key 只回傳後 4 碼與 hasKey 旗標
 */
router.get('/:id/email-config', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const row = await db.queryOne<{
      user_id: string
      resend_api_key: string | null
      email_from: string | null
    }>(
      'SELECT user_id, resend_api_key, email_from FROM projects WHERE id = $1',
      [id]
    )
    if (!row || row.user_id !== userId) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const hasKey = !!row.resend_api_key
    const keyMask = row.resend_api_key ? `••••${row.resend_api_key.slice(-4)}` : null

    res.json({
      hasResendApiKey: hasKey,
      resendApiKeyMask: keyMask,
      emailFrom: row.email_from,
    })
  } catch (error) {
    logger.error({ err: error }, '讀取 email 配置失敗')
    res.status(500).json({ error: 'Failed to load email config' })
  }
})

/**
 * GET /api/project/:id/cms-slots
 * 讀取 CMS Skeleton slots（merge manifest default + user override）
 * 回傳：{ version, slots(merged), overrides(raw), schema(動態 render), locked(只讀展示) }
 */
router.get('/:id/cms-slots', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const row = await db.queryOne<{ user_id: string; cms_slots: SlotsOverride | null }>(
      'SELECT user_id, cms_slots FROM projects WHERE id = $1',
      [id]
    )
    if (!row || row.user_id !== userId) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const overrides = row.cms_slots ?? null
    const merged = mergeSlotsWithDefaults(overrides)

    res.json({
      version: CMS_SKELETON_VERSION,
      slots: merged,
      overrides,
      schema: getSlotsSchemaForUI(),
      locked: getLockedItems(),
    })
  } catch (error) {
    logger.error({ err: error }, '讀取 cms-slots 失敗')
    res.status(500).json({ error: 'Failed to load cms slots' })
  }
})

/**
 * PATCH /api/project/:id/cms-slots
 * 更新 CMS Skeleton slots
 * body: { slots: { [moduleId]: { [slotKey]: value } } | null }
 * 整體清除：傳 slots: null（回 manifest default 行為）
 * 不在 manifest 內的 key 直接拒絕（400）
 */
router.patch('/:id/cms-slots', requireAuth, validateBody(cmsSlotsSchema), async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const { slots } = req.body as { slots?: SlotsOverride | null }

    const project = await db.getProject(id)
    if (!project || project.user_id !== userId) {
      return res.status(404).json({ error: 'Project not found' })
    }

    if (slots !== null && slots !== undefined) {
      const v = validateSlotOverrides(slots)
      if (!v.valid) {
        return res.status(400).json({ error: 'Invalid slots', details: v.errors })
      }
    }

    const value = slots === null ? null : (slots ?? null)
    await db.query(
      'UPDATE projects SET cms_slots = $1, updated_at = NOW() WHERE id = $2',
      [value === null ? null : JSON.stringify(value), id]
    )

    res.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, '更新 cms-slots 失敗')
    res.status(500).json({ error: 'Failed to update cms slots' })
  }
})

/**
 * POST /api/project/:id/cms-slots/regen
 * Partial regen — 用最新 slot 值重 render skeleton 檔（5 Server Actions + 4 layout shell），
 * UPSERT 進 project_files 的 skill_source='coder' 同一份檔。
 * 不重跑 BDD / 業務 LLM。Sidebar.tsx 不在範圍（需要 entity 上下文，等下次完整生成）。
 *
 * 回應：{ success, changedPaths: string[], note: string }
 * 注意：partial regen 只寫 DB，**不會自動部署**。Vercel 預覽要客戶自己重新部署或下次 iterate。
 */
router.post('/:id/cms-slots/regen', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const row = await db.queryOne<{ user_id: string; cms_slots: SlotsOverride | null }>(
      'SELECT user_id, cms_slots FROM projects WHERE id = $1',
      [id]
    )
    if (!row || row.user_id !== userId) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const merged = mergeSlotsWithDefaults(row.cms_slots ?? null)
    const adminAuth = merged.admin_auth ?? {}
    const serverActionOpts = {
      username: typeof adminAuth.canonical_test_username === 'string' ? adminAuth.canonical_test_username : undefined,
      password: typeof adminAuth.canonical_test_password === 'string' ? adminAuth.canonical_test_password : undefined,
      jwtExpiresIn: typeof adminAuth.jwt_expires_in === 'string' ? adminAuth.jwt_expires_in : undefined,
    }

    const skeletonActions = generateSkeletonServerActions(serverActionOpts)
    const shellFiles = generateAdminLayoutShell(getAdminShellOptionsFromSlots(merged))

    const changes: Array<{ path: string; content: string }> = [
      ...skeletonActions.map(a => ({ path: a.filePath, content: a.content })),
      ...shellFiles.map(f => ({ path: f.path, content: f.content })),
    ]

    for (const f of changes) {
      await db.query(
        `INSERT INTO project_files (project_id, skill_source, file_path, content, file_type, updated_at)
         VALUES ($1, 'coder', $2, $3, 'component', NOW())
         ON CONFLICT (project_id, skill_source, file_path)
         DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()`,
        [id, f.path, f.content]
      )
    }

    logger.info({ projectId: id, fileCount: changes.length }, 'CMS partial regen 完成')

    res.json({
      success: true,
      changedPaths: changes.map(c => c.path),
      count: changes.length,
      note: 'Files updated in DB. To deploy, trigger a new deployment (Vercel won\'t auto-redeploy from DB writes).',
    })
  } catch (error) {
    logger.error({ err: error }, 'CMS partial regen 失敗')
    res.status(500).json({ error: 'Partial regen failed', message: error instanceof Error ? error.message : String(error) })
  }
})

/**
 * PATCH /api/project/:id/email-config
 * 更新 email 配置（Resend API key + From 信箱）
 * body: { resendApiKey?: string | null, emailFrom?: string | null }
 */
router.patch('/:id/email-config', requireAuth, validateBody(emailConfigSchema), async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const { resendApiKey, emailFrom } = req.body as {
      resendApiKey?: string | null
      emailFrom?: string | null
    }

    const project = await db.getProject(id)
    if (!project || project.user_id !== userId) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const updates: string[] = []
    const params: unknown[] = []
    let paramIndex = 1

    if (resendApiKey !== undefined) {
      updates.push(`resend_api_key = $${paramIndex++}`)
      params.push(resendApiKey)
    }
    if (emailFrom !== undefined) {
      updates.push(`email_from = $${paramIndex++}`)
      params.push(emailFrom)
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' })
    }

    updates.push(`updated_at = NOW()`)
    params.push(id)

    await db.query(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      params
    )

    res.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, '更新 email 配置失敗')
    res.status(500).json({ error: 'Failed to update email config' })
  }
})

/**
 * GET /api/project/:id/detail
 * 取得專案完整詳情（包含對話、部署、生成記錄）
 */
router.get('/:id/detail', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const project = await db.queryOne<{
      id: string
      name: string
      description: string | null
      status: string
      vercel_url: string | null
      custom_domain: string | null
      domain_status: string | null
      created_at: string
      updated_at: string
      user_id: string
    }>(
      'SELECT * FROM projects WHERE id = $1',
      [id]
    )

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    if (project.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // 取得對話
    const conversations = await db.queryMany<{
      id: string
      messages: unknown[]
      spec_complete: boolean
      created_at: string
      updated_at: string
    }>(
      'SELECT id, messages, spec_complete, created_at, updated_at FROM conversations WHERE project_id = $1 ORDER BY updated_at DESC',
      [id]
    )

    // 取得部署（向下相容：code_snapshot 欄位可能尚未建立）
    let deployments: Array<{
      id: string
      url: string | null
      status: string
      created_at: string
      has_code_snapshot: boolean
    }> = []
    try {
      deployments = await db.queryMany(
        `SELECT id, url, status, created_at, (code_snapshot IS NOT NULL) as has_code_snapshot
         FROM deployments WHERE project_id = $1 ORDER BY created_at DESC LIMIT 5`,
        [id]
      )
    } catch {
      // code_snapshot 欄位尚未建立，fallback 不帶 has_code_snapshot
      const rows = await db.queryMany<{
        id: string; url: string | null; status: string; created_at: string
      }>(
        'SELECT id, url, status, created_at FROM deployments WHERE project_id = $1 ORDER BY created_at DESC LIMIT 5',
        [id]
      )
      deployments = rows.map(r => ({ ...r, has_code_snapshot: false }))
    }

    // 取得生成記錄
    const generations = await db.queryMany<{
      id: string
      status: string
      attempt_count: number
      created_at: string
    }>(
      'SELECT id, status, attempt_count, created_at FROM generations WHERE project_id = $1 ORDER BY created_at DESC LIMIT 5',
      [id]
    )

    res.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        vercelUrl: project.vercel_url,
        customDomain: project.custom_domain,
        domainStatus: project.domain_status,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      },
      conversations: conversations.map(c => ({
        id: c.id,
        messages: c.messages,
        specComplete: c.spec_complete,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      })),
      deployments: deployments.map(d => ({
        id: d.id,
        url: d.url,
        status: d.status,
        createdAt: d.created_at,
        hasCodeSnapshot: d.has_code_snapshot,
      })),
      generations: generations.map(g => ({
        id: g.id,
        status: g.status,
        attemptCount: g.attempt_count,
        createdAt: g.created_at,
      })),
    })
  } catch (error) {
    logger.error({ err: error }, '取得專案詳情失敗')
    res.status(500).json({ error: 'Failed to get project detail' })
  }
})

/**
 * GET /api/project/:id/latest-generation
 * 取得專案最新的生成記錄
 */
router.get('/:id/latest-generation', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    // 驗證專案擁有權
    const project = await db.queryOne<{ user_id: string }>(
      'SELECT user_id FROM projects WHERE id = $1',
      [id]
    )

    if (!project || project.user_id !== userId) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const generation = await db.queryOne<{
      id: string
      generated_code_url: string | null
      status: string
      attempt_count: number
      created_at: string
    }>(
      'SELECT id, generated_code_url, status, attempt_count, created_at FROM generations WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1',
      [id]
    )

    res.json({
      generation: generation ? {
        id: generation.id,
        generatedCodeUrl: generation.generated_code_url,
        status: generation.status,
        attemptCount: generation.attempt_count,
        createdAt: generation.created_at,
      } : null
    })
  } catch (error) {
    logger.error({ err: error }, '取得最新生成記錄失敗')
    res.status(500).json({ error: 'Failed to get latest generation' })
  }
})

/**
 * GET /api/project/:id/versions
 * 取得專案版本歷史
 */
router.get('/:id/versions', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    // 驗證專案擁有權
    const project = await db.queryOne<{ user_id: string }>(
      'SELECT user_id FROM projects WHERE id = $1',
      [id]
    )

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    if (project.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // 查詢版本歷史（向下相容：code_snapshot 欄位可能尚未建立）
    type VersionRow = {
      id: string
      version_number: number
      version_label: string | null
      status: string
      change_summary: string | null
      conversation_id: string | null
      created_at: string
      schema_snapshot: string | null
      features_snapshot: unknown | null
      has_code_snapshot: boolean
    }
    let versions: VersionRow[] = []
    try {
      versions = await db.queryMany(
        `SELECT id, version_number, version_label, status, change_summary,
                conversation_id, created_at, schema_snapshot, features_snapshot,
                (code_snapshot IS NOT NULL) as has_code_snapshot
         FROM generations
         WHERE project_id = $1
         ORDER BY version_number DESC`,
        [id]
      )
    } catch {
      const rows = await db.queryMany<Omit<VersionRow, 'has_code_snapshot'>>(
        `SELECT id, version_number, version_label, status, change_summary,
                conversation_id, created_at, schema_snapshot, features_snapshot
         FROM generations
         WHERE project_id = $1
         ORDER BY version_number DESC`,
        [id]
      )
      versions = rows.map(r => ({ ...r, has_code_snapshot: false }))
    }

    res.json({
      versions: versions.map(v => ({
        id: v.id,
        versionNumber: v.version_number,
        versionLabel: v.version_label,
        status: v.status,
        changeSummary: v.change_summary,
        conversationId: v.conversation_id,
        createdAt: v.created_at,
        hasBackup: !!(v.schema_snapshot || v.features_snapshot),
        hasCodeSnapshot: v.has_code_snapshot,
      }))
    })
  } catch (error) {
    logger.error({ err: error }, '取得版本歷史失敗')
    res.status(500).json({ error: 'Failed to get versions' })
  }
})

/**
 * PATCH /api/project/:id/versions/:versionNumber
 * 更新版本標籤
 */
router.patch('/:id/versions/:versionNumber', requireAuth, async (req, res) => {
  try {
    const { id, versionNumber } = req.params
    const userId = req.user!.id
    const { label } = req.body as { label?: string }

    // 驗證專案擁有權
    const project = await db.queryOne<{ user_id: string }>(
      'SELECT user_id FROM projects WHERE id = $1',
      [id]
    )

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    if (project.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // 更新版本標籤
    const result = await db.query(
      `UPDATE generations
       SET version_label = $1
       WHERE project_id = $2 AND version_number = $3`,
      [label || null, id, parseInt(versionNumber, 10)]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Version not found' })
    }

    res.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, '更新版本標籤失敗')
    res.status(500).json({ error: 'Failed to update version label' })
  }
})

/**
 * POST /api/project/:id/versions/:versionNumber/rollback
 * 回滾到指定版本
 */
router.post('/:id/versions/:versionNumber/rollback', requireAuth, async (req, res) => {
  try {
    const { id, versionNumber } = req.params
    const userId = req.user!.id
    const { confirm } = req.body as { confirm?: boolean }

    if (!confirm) {
      return res.status(400).json({ error: '需要確認回滾操作' })
    }

    // 驗證專案擁有權
    const project = await db.queryOne<{ user_id: string; status: string }>(
      'SELECT user_id, status FROM projects WHERE id = $1',
      [id]
    )

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    if (project.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // 讀取目標版本
    const targetVersion = await db.queryOne<{
      id: string
      version_number: number
      schema_snapshot: string | null
      features_snapshot: unknown | null
    }>(
      `SELECT id, version_number, schema_snapshot, features_snapshot
       FROM generations
       WHERE project_id = $1 AND version_number = $2`,
      [id, parseInt(versionNumber, 10)]
    )

    if (!targetVersion) {
      return res.status(404).json({ error: 'Version not found' })
    }

    if (!targetVersion.schema_snapshot && !targetVersion.features_snapshot) {
      return res.status(400).json({ error: '此版本沒有可用的快照' })
    }

    // 獲取當前最大版本號
    const maxVersion = await db.queryOne<{ max_version: number }>(
      'SELECT COALESCE(MAX(version_number), 0) as max_version FROM generations WHERE project_id = $1',
      [id]
    )

    const newVersionNumber = (maxVersion?.max_version || 0) + 1

    // 創建新版本（從快照恢復）
    await db.transaction(async (client) => {
      // 創建新的 generation 記錄
      await client.query(
        `INSERT INTO generations (
           id, project_id, version_number, version_label, status,
           change_summary, schema_snapshot, features_snapshot, created_at
         ) VALUES (
           $1, $2, $3, $4, 'pending', $5, $6, $7, NOW()
         )`,
        [
          require('crypto').randomUUID(),
          id,
          newVersionNumber,
          null,
          `回滾自 v${targetVersion.version_number}`,
          targetVersion.schema_snapshot,
          JSON.stringify(targetVersion.features_snapshot),
        ]
      )

      // 更新專案狀態
      await client.query(
        `UPDATE projects SET status = 'testing', updated_at = NOW() WHERE id = $1`,
        [id]
      )
    })

    res.json({
      success: true,
      newVersionNumber,
      message: `已回滾到版本 ${targetVersion.version_number}，創建新版本 ${newVersionNumber}`
    })
  } catch (error) {
    logger.error({ err: error }, '版本回滾失敗')
    res.status(500).json({ error: 'Failed to rollback version' })
  }
})

/**
 * GET /api/project/:id/versions/compare
 * 對比兩個版本
 */
router.get('/:id/versions/compare', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const { v1, v2 } = req.query as { v1?: string; v2?: string }

    if (!v1 || !v2) {
      return res.status(400).json({ error: '需要提供 v1 和 v2 參數' })
    }

    // 驗證專案擁有權
    const project = await db.queryOne<{ user_id: string }>(
      'SELECT user_id FROM projects WHERE id = $1',
      [id]
    )

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    if (project.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // 讀取兩個版本
    const versions = await db.queryMany<{
      version_number: number
      schema_snapshot: string | null
      features_snapshot: unknown | null
    }>(
      `SELECT version_number, schema_snapshot, features_snapshot
       FROM generations
       WHERE project_id = $1 AND version_number IN ($2, $3)
       ORDER BY version_number`,
      [id, parseInt(v1, 10), parseInt(v2, 10)]
    )

    if (versions.length !== 2) {
      return res.status(404).json({ error: '找不到指定的版本' })
    }

    const [version1, version2] = versions

    // 計算 Schema 差異（簡單的行對比）
    const schema1Lines = (version1.schema_snapshot || '').split('\n')
    const schema2Lines = (version2.schema_snapshot || '').split('\n')

    const schemaDiff = computeSimpleDiff(schema1Lines, schema2Lines)

    // 計算 Features 差異
    const features1 = (version1.features_snapshot as Array<{ name: string; content: string }>) || []
    const features2 = (version2.features_snapshot as Array<{ name: string; content: string }>) || []

    const featuresDiff = computeFeaturesDiff(features1, features2)

    res.json({
      schemaDiff,
      featuresDiff
    })
  } catch (error) {
    logger.error({ err: error }, '版本對比失敗')
    res.status(500).json({ error: 'Failed to compare versions' })
  }
})

// 簡單的行差異計算
function computeSimpleDiff(lines1: string[], lines2: string[]): string {
  const result: string[] = []
  const maxLines = Math.max(lines1.length, lines2.length)

  for (let i = 0; i < maxLines; i++) {
    const line1 = lines1[i] || ''
    const line2 = lines2[i] || ''

    if (line1 === line2) {
      result.push(`  ${line1}`)
    } else if (!line1) {
      result.push(`+ ${line2}`)
    } else if (!line2) {
      result.push(`- ${line1}`)
    } else {
      result.push(`- ${line1}`)
      result.push(`+ ${line2}`)
    }
  }

  return result.join('\n')
}

// Features 差異計算
function computeFeaturesDiff(
  features1: Array<{ name: string; content: string }>,
  features2: Array<{ name: string; content: string }>
): Array<{ name: string; status: 'added' | 'removed' | 'modified'; diff?: string }> {
  const result: Array<{ name: string; status: 'added' | 'removed' | 'modified'; diff?: string }> = []

  const names1 = new Set(features1.map(f => f.name))
  const names2 = new Set(features2.map(f => f.name))

  // 找出新增的
  for (const f of features2) {
    if (!names1.has(f.name)) {
      result.push({ name: f.name, status: 'added' })
    }
  }

  // 找出刪除的
  for (const f of features1) {
    if (!names2.has(f.name)) {
      result.push({ name: f.name, status: 'removed' })
    }
  }

  // 找出修改的
  for (const f1 of features1) {
    const f2 = features2.find(f => f.name === f1.name)
    if (f2 && f1.content !== f2.content) {
      const diff = computeSimpleDiff(f1.content.split('\n'), f2.content.split('\n'))
      result.push({ name: f1.name, status: 'modified', diff })
    }
  }

  return result
}

/**
 * POST /api/project/:id/iterate
 * 開始新迭代：創建新對話 + 專案狀態改為 generating
 */
router.post('/:id/iterate', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const { description } = req.body as { description?: string }

    // 驗證專案擁有權
    const project = await db.queryOne<{
      id: string
      user_id: string
      status: string
      name: string
    }>(
      'SELECT id, user_id, status, name FROM projects WHERE id = $1',
      [id]
    )

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    if (project.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // 只有已部署或失敗的專案可以開始新迭代
    if (project.status !== 'deployed' && project.status !== 'failed') {
      return res.status(400).json({
        error: '只有已部署或失敗的專案可以開始新迭代',
        currentStatus: project.status
      })
    }

    // 使用事務創建新對話並更新專案狀態
    const result = await db.transaction(async (client) => {
      // 創建新對話
      const conversationResult = await client.query<{ id: string }>(
        `INSERT INTO conversations (project_id, messages, spec_complete, created_at, updated_at)
         VALUES ($1, $2, false, NOW(), NOW())
         RETURNING id`,
        [id, JSON.stringify(description ? [{
          id: require('crypto').randomUUID(),
          role: 'user',
          content: description,
          timestamp: new Date().toISOString()
        }] : [])]
      )

      const conversationId = conversationResult.rows[0].id

      // 更新專案狀態為 generating
      await client.query(
        `UPDATE projects SET status = 'generating', updated_at = NOW() WHERE id = $1`,
        [id]
      )

      return { conversationId }
    })

    res.json({
      conversationId: result.conversationId,
      projectStatus: 'generating'
    })
  } catch (error) {
    logger.error({ err: error }, '開始新迭代失敗')
    res.status(500).json({ error: 'Failed to start iteration' })
  }
})

/**
 * GET /api/project/:id/template-overrides
 * 取得專案的模板客製化
 */
router.get('/:id/template-overrides', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const project = await db.queryOne<{
      user_id: string
      template_overrides: Record<string, Record<string, string>> | null
    }>(
      'SELECT user_id, template_overrides FROM projects WHERE id = $1',
      [id]
    )

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    if (project.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    res.json({
      overrides: project.template_overrides || {}
    })
  } catch (error) {
    logger.error({ err: error }, '取得模板客製化失敗')
    res.status(500).json({ error: 'Failed to get template overrides' })
  }
})

/**
 * PUT /api/project/:id/template-overrides
 * 更新專案的模板客製化
 */
router.put('/:id/template-overrides', requireAuth, validateBody(templateOverridesSchema), async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const { overrides } = req.body

    // 驗證專案擁有權
    const project = await db.queryOne<{ user_id: string }>(
      'SELECT user_id FROM projects WHERE id = $1',
      [id]
    )

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    if (project.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // 更新 template_overrides
    await db.query(
      `UPDATE projects SET template_overrides = $1, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(overrides), id]
    )

    res.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, '更新模板客製化失敗')
    res.status(500).json({ error: 'Failed to update template overrides' })
  }
})

/**
 * GET /api/project/:id/download-code
 * 下載專案全部代碼（ZIP）— 付費方案限定
 */
router.get('/:id/download-code', requireAuth, requirePlan('creator', 'pro', 'business'), async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const project = await db.queryOne<{ user_id: string; name: string }>(
      'SELECT user_id, name FROM projects WHERE id = $1',
      [id]
    )
    if (!project || project.user_id !== userId) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const { files } = await buildDownloadBundle(id)

    const asciiName = project.name.replace(/[^a-z0-9-]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'project'
    const encodedName = encodeURIComponent(`${project.name.slice(0, 50)}-code.zip`)

    const zipBuffer = await zipBundleFiles(files)
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="${asciiName}-code.zip"; filename*=UTF-8''${encodedName}`)
    res.setHeader('Content-Length', String(zipBuffer.length))
    res.send(zipBuffer)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logger.error({ err: error }, `下載代碼失敗: ${msg}`)
    if (!res.headersSent) {
      res.status(500).json({ error: `Failed to download project code: ${msg}` })
    }
  }
})

/**
 * POST /api/project/:id/import-design
 * Phase I: 用戶上傳 DESIGN.md → 解析 → 更新 state.uiuxDesignSystem → 觸發 big-bang regen
 *
 * Body: { designMdContent: string }
 *
 * 流程：
 *   1. 驗證 project 屬於該 user
 *   2. parseTellcraftDesignMd(designMdContent) → 解析失敗回 400 + errors[]
 *   3. 找該 project 最新的 conversation
 *   4. getFlowState → patch uiuxDesignSystem + freeze + 設 phase='uiux_code_generation'
 *   5. saveFlowState 到 DB
 *   6. enqueue 'continue-flow' job 帶 sentinel message '__import_design_md__'
 *   7. worker 收到 job → phase-router 看到 phase='uiux_code_generation' → executeFullCodePipeline
 */
router.post('/:id/import-design', requireAuth, requirePlan('creator', 'pro', 'business'), async (req, res) => {
  try {
    if (!getEnv().ENABLE_DESIGN_MD_IMPORT) {
      return res.status(403).json({ error: 'DESIGN.md import 功能暫時關閉' })
    }
    if (!orchestratorQueue || !redisClient) {
      return res.status(500).json({ error: 'Service not initialized' })
    }

    const { id: projectId } = req.params
    const userId = req.user!.id
    const { designMdContent } = req.body as { designMdContent?: string }

    if (!designMdContent || typeof designMdContent !== 'string') {
      return res.status(400).json({ error: 'designMdContent 必填且必須為字串' })
    }
    if (designMdContent.length > 200_000) {
      return res.status(400).json({ error: 'designMdContent 超過 200KB 上限' })
    }

    // 1. 驗證 project ownership
    const project = await db.queryOne<{ user_id: string; name: string }>(
      'SELECT user_id, name FROM projects WHERE id = $1',
      [projectId]
    )
    if (!project) return res.status(404).json({ error: 'Project not found' })
    if (project.user_id !== userId) return res.status(403).json({ error: 'Access denied' })

    // 2. parse DESIGN.md
    const parseResult = parseTellcraftDesignMd(designMdContent)
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'DESIGN.md 解析失敗',
        errors: parseResult.errors,
      })
    }

    // 3. 找該 project 最新 conversation
    const conv = await db.queryOne<{ id: string }>(
      'SELECT id FROM conversations WHERE project_id = $1 ORDER BY updated_at DESC LIMIT 1',
      [projectId]
    )
    if (!conv) {
      return res.status(404).json({ error: '找不到此 project 的 conversation，請先在對話內建立內容' })
    }
    const conversationId = conv.id

    // 4. 取得 + patch flowState
    const { getFlowState, saveFlowState } = await import('../workers/orchestrator-utils')
    const state = await getFlowState(redisClient, conversationId)
    if (!state) {
      return res.status(404).json({ error: '找不到此 conversation 的 flow state' })
    }

    state.uiuxDesignSystem = parseResult.designSystem
    const freeze = freezeDesignSystem(parseResult.designSystem, 'imported_design_md', { conversationId, userId })
    state.uiuxDesignSystemHash = freeze.hash
    state.uiuxDesignSystemSource = freeze.source
    state.phase = 'uiux_code_generation'
    state.uiuxCodePhase = 'structure'
    state.waitingForReply = false
    state.uiuxCodeGenerationStartedAt = Date.now()
    await saveFlowState(redisClient, conversationId, state)

    // 5. enqueue regen job — worker 收到後走 phase-router → executeFullCodePipeline
    const job = await orchestratorQueue.add('continue-flow', {
      projectId,
      conversationId,
      userId,
      message: '__import_design_md__',  // sentinel，phase-router 看 phase 就好不需依賴 message
      locale: state.locale ?? 'zh',
    }, {
      jobId: `import-design:${conversationId}:${Date.now()}`,
      attempts: 2,
      backoff: { type: 'exponential', delay: 2000 },
    })

    logger.info({
      projectId,
      conversationId,
      userId,
      primary: parseResult.designSystem.colorPalette.primary,
      warningCount: parseResult.warnings.length,
      jobId: job.id,
    }, 'DESIGN.md import 觸發 big-bang regen')

    res.json({
      success: true,
      warnings: parseResult.warnings,
      jobId: job.id,
      conversationId,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logger.error({ err: error }, `DESIGN.md import 失敗: ${msg}`)
    res.status(500).json({ error: `Import failed: ${msg}` })
  }
})

/**
 * GET /api/project/:id/versions/:versionNumber/download-code
 * 下載指定版本的代碼快照（ZIP）— 付費方案限定
 */
router.get('/:id/versions/:versionNumber/download-code', requireAuth, requirePlan('creator', 'pro', 'business'), async (req, res) => {
  try {
    const { id, versionNumber } = req.params
    const userId = req.user!.id

    const project = await db.queryOne<{ user_id: string; name: string }>(
      'SELECT user_id, name FROM projects WHERE id = $1',
      [id]
    )
    if (!project || project.user_id !== userId) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const generation = await db.queryOne<{ code_snapshot: unknown }>(
      'SELECT code_snapshot FROM generations WHERE project_id = $1 AND version_number = $2',
      [id, Number(versionNumber)]
    )

    if (!generation || !generation.code_snapshot) {
      return res.status(404).json({ error: '此版本無代碼快照' })
    }

    const snapshot = generation.code_snapshot as Array<{ filePath: string; content: string }>
    if (!Array.isArray(snapshot) || snapshot.length === 0) {
      return res.status(400).json({ error: 'No files found in snapshot' })
    }

    const { files } = await buildDownloadBundle(id, { snapshot })

    const asciiName = project.name.replace(/[^a-z0-9-]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'project'
    const encodedName = encodeURIComponent(`${project.name.slice(0, 50)}-v${versionNumber}-code.zip`)

    const zipBuffer = await zipBundleFiles(files)
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="${asciiName}-v${versionNumber}-code.zip"; filename*=UTF-8''${encodedName}`)
    res.setHeader('Content-Length', String(zipBuffer.length))
    res.send(zipBuffer)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logger.error({ err: error }, `下載版本代碼失敗: ${msg}`)
    if (!res.headersSent) {
      res.status(500).json({ error: `Failed to download version code: ${msg}` })
    }
  }
})

/**
 * GET /api/project/:id/deployments/:deploymentId/download-code
 * 下載指定部署的代碼快照（ZIP）— 付費方案限定
 */
router.get('/:id/deployments/:deploymentId/download-code', requireAuth, requirePlan('creator', 'pro', 'business'), async (req, res) => {
  try {
    const { id, deploymentId } = req.params
    const userId = req.user!.id

    const project = await db.queryOne<{ user_id: string; name: string }>(
      'SELECT user_id, name FROM projects WHERE id = $1',
      [id]
    )
    if (!project || project.user_id !== userId) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const deploy = await db.queryOne<{ code_snapshot: unknown; url: string | null }>(
      'SELECT code_snapshot, url FROM deployments WHERE id = $1 AND project_id = $2',
      [deploymentId, id]
    )

    if (!deploy || !deploy.code_snapshot) {
      return res.status(404).json({ error: '此部署無代碼快照' })
    }

    const snapshot = deploy.code_snapshot as Array<{ filePath: string; content: string }>
    if (!Array.isArray(snapshot) || snapshot.length === 0) {
      return res.status(400).json({ error: 'No files found in snapshot' })
    }

    const { files } = await buildDownloadBundle(id, { snapshot })

    const urlSlug = deploy.url
      ? deploy.url.replace('https://', '').split('.')[0].slice(0, 30)
      : 'deploy'
    const asciiName = project.name.replace(/[^a-z0-9-]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'project'

    const zipBuffer = await zipBundleFiles(files)
    const fileName = `${asciiName}-${urlSlug}-code.zip`
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    res.setHeader('Content-Length', String(zipBuffer.length))
    res.send(zipBuffer)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logger.error({ err: error }, `下載部署代碼失敗: ${msg}`)
    if (!res.headersSent) {
      res.status(500).json({ error: `Failed to download deployment code: ${msg}` })
    }
  }
})

/**
 * GET /api/project/:id/files
 * 取得專案的生成檔案（支持 skill_source 過濾）
 */
router.get('/:id/files', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const { skill_source } = req.query as { skill_source?: string }

    // 驗證專案擁有權
    const project = await db.queryOne<{ user_id: string }>(
      'SELECT user_id FROM projects WHERE id = $1',
      [id]
    )

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    if (project.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const files = await db.getProjectFiles(id, skill_source)

    // 先 in-memory 修復再回傳，確保用戶第一次打開就看到修復後的內容
    const repairedFiles = files.map(f => {
      const { content, changed } = applyFixersToContent(f.file_path, f.content)
      return changed ? { ...f, content } : f
    })

    res.json({
      files: repairedFiles.map(f => ({
        id: f.id,
        filePath: f.file_path,
        skillSource: f.skill_source,
        fileType: f.file_type,
        content: f.content,
        description: f.description,
        createdAt: f.created_at,
        updatedAt: f.updated_at,
      })),
      total: repairedFiles.length,
    })

    // 背景存回 DB（讓下次直接從 DB 拿到修復版本）
    repairProjectFiles(id).catch(err =>
      logger.warn({ err, projectId: id }, 'lazy project repair failed')
    )
  } catch (error) {
    logger.error({ err: error }, '取得專案檔案失敗')
    res.status(500).json({ error: 'Failed to get project files' })
  }
})

/**
 * GET /api/project/:id/db-url
 * 取得專案的 Neon 資料庫連線字串（供 WebContainer 預覽注入）
 */
router.get('/:id/db-url', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const project = await db.queryOne<{ user_id: string; neon_connection_string: string | null }>(
      'SELECT user_id, neon_connection_string FROM projects WHERE id = $1',
      [id]
    )

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }
    if (project.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    if (!project.neon_connection_string) {
      return res.json({ neonConnectionString: null })
    }

    res.json({ neonConnectionString: project.neon_connection_string })
  } catch (error) {
    logger.error({ err: error }, '取得 DB URL 失敗')
    res.status(500).json({ error: 'Failed to get database URL' })
  }
})

/**
 * DELETE /api/project/batch
 * 批量刪除專案（最多 50 個）
 */
router.delete('/batch', requireAuth, validateBody(batchDeleteSchema), async (req, res) => {
  try {
    const userId = req.user!.id
    const { ids } = req.body as { ids: string[] }

    // 一次驗證所有 ids 的擁有權
    const owned = await db.queryMany<{ id: string; status: string; name: string }>(
      'SELECT id, status, name FROM projects WHERE id = ANY($1::uuid[]) AND user_id = $2',
      [ids, userId]
    )

    if (owned.length !== ids.length) {
      return res.status(403).json({ error: '部分專案不存在或無權限刪除' })
    }

    // 並行清理 Vercel（只清 deployed，失敗不阻擋）
    await Promise.allSettled(
      owned
        .filter(p => p.status === 'deployed')
        .map(async (p) => {
          const vercelSlug = toVercelSlug(p.name, p.id)
          const result = await deleteVercelProject(vercelSlug)
          if (!result.success) {
            logger.warn({ error: result.error, projectId: p.id }, '批量刪除：清理 Vercel 專案失敗（不阻擋）')
          }
        })
    )

    // 並行清理 Neon DB（失敗不阻擋）
    const neonRows = await db.queryMany<{ id: string; neon_project_id: string }>(
      'SELECT id, neon_project_id FROM projects WHERE id = ANY($1::uuid[]) AND neon_project_id IS NOT NULL',
      [ids]
    )
    if (neonRows.length > 0) {
      await Promise.allSettled(
        neonRows.map(async (row) => {
          try {
            await deleteNeonProject(row.neon_project_id)
          } catch (err) {
            logger.warn({ err, projectId: row.id }, '批量刪除：清理 Neon DB 失敗（不阻擋）')
          }
        })
      )
    }

    // 事務級聯刪除
    await db.transaction(async (client) => {
      await client.query('DELETE FROM deployments WHERE project_id = ANY($1::uuid[])', [ids])
      await client.query('DELETE FROM generations WHERE project_id = ANY($1::uuid[])', [ids])
      await client.query('DELETE FROM project_files WHERE project_id = ANY($1::uuid[])', [ids])
      await client.query('DELETE FROM bdd_sessions WHERE project_id = ANY($1::uuid[])', [ids])
      await client.query('DELETE FROM tasks WHERE project_id = ANY($1::uuid[])', [ids])
      await client.query(
        'DELETE FROM line_active_conversations WHERE conversation_id IN (SELECT id FROM conversations WHERE project_id = ANY($1::uuid[]))',
        [ids]
      )
      await client.query(
        'DELETE FROM flow_states WHERE conversation_id IN (SELECT id FROM conversations WHERE project_id = ANY($1::uuid[]))',
        [ids]
      )
      await client.query('DELETE FROM conversations WHERE project_id = ANY($1::uuid[])', [ids])
      await client.query('DELETE FROM projects WHERE id = ANY($1::uuid[])', [ids])
    })

    res.json({ success: true, deleted: ids.length })
  } catch (error) {
    logger.error({ err: error }, '批量刪除專案失敗')
    res.status(500).json({ error: 'Failed to batch delete projects' })
  }
})

/**
 * DELETE /api/project/:id
 * 刪除專案
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    // 確保用戶擁有該專案
    const project = await db.getProject(id)
    if (!project || project.user_id !== userId) {
      return res.status(404).json({ error: 'Project not found' })
    }

    // 刪除 Vercel 上的專案（在 DB 事務之前執行，失敗不阻擋刪除）
    if (project.status === 'deployed') {
      const vercelSlug = toVercelSlug(project.name, id)
      const vercelResult = await deleteVercelProject(vercelSlug)
      if (!vercelResult.success) {
        logger.warn({ error: vercelResult.error }, '刪除 Vercel 專案失敗（不阻擋刪除）')
      }
    }

    // 刪除 Neon DB（失敗不阻擋刪除）
    try {
      const neonRow = await db.query<{ neon_project_id: string }>(
        'SELECT neon_project_id FROM projects WHERE id = $1 AND neon_project_id IS NOT NULL',
        [id]
      )
      if (neonRow.rows[0]) {
        await deleteNeonProject(neonRow.rows[0].neon_project_id)
      }
    } catch (err) {
      logger.warn({ err, projectId: id }, 'Neon project 刪除失敗（不阻擋刪除）')
    }

    // 使用事務刪除相關資料
    await db.transaction(async (client) => {
      // 刪除 Deployments
      await client.query(
        'DELETE FROM deployments WHERE project_id = $1',
        [id]
      )
      // 刪除 Generations
      await client.query(
        'DELETE FROM generations WHERE project_id = $1',
        [id]
      )
      // 刪除 Project Files
      await client.query(
        'DELETE FROM project_files WHERE project_id = $1',
        [id]
      )
      // 刪除 BDD Sessions
      await client.query(
        'DELETE FROM bdd_sessions WHERE project_id = $1',
        [id]
      )
      // 刪除 Tasks
      await client.query(
        'DELETE FROM tasks WHERE project_id = $1',
        [id]
      )
      // 刪除 LINE 活躍對話映射（conversation_id FK 無 CASCADE）
      await client.query(
        'DELETE FROM line_active_conversations WHERE conversation_id IN (SELECT id FROM conversations WHERE project_id = $1)',
        [id]
      )
      // 刪除 Flow States（conversation_id 可能有 FK）
      await client.query(
        'DELETE FROM flow_states WHERE conversation_id IN (SELECT id FROM conversations WHERE project_id = $1)',
        [id]
      )
      // 刪除 Conversations
      await client.query(
        'DELETE FROM conversations WHERE project_id = $1',
        [id]
      )
      // 刪除 Project
      await client.query(
        'DELETE FROM projects WHERE id = $1',
        [id]
      )
    })

    res.json({ success: true })
  } catch (error) {
    logger.error({ err: error }, '刪除專案失敗')
    res.status(500).json({ error: 'Failed to delete project' })
  }
})

export default router
