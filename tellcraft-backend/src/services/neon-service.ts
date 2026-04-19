// ============================================================
// Neon Service — Neon PostgreSQL Database Provisioning
// 同步建立 Neon Project + 套用 BDD 推導的 Schema（< 10s）
// ============================================================

import { Client } from 'pg'
import bcrypt from 'bcryptjs'
import { getEnv } from '../lib/env'
import * as db from '../db/client'
import { createLogger } from '../lib/logger'
import { getDbLimit } from '../config/plans'
import { sendMessage } from '../workers/orchestrator-utils'
import { detectAuthInSchema } from './coder-generation'
import type { DerivedSchema } from './schema-derivation'
import type { IoEmitter } from '../types/flow-state'

const logger = createLogger('neon-service')

const NEON_API = 'https://console.neon.tech/api/v2'

// ============================================================
// 帶超時 + 指數退避的 fetch
// ============================================================

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  { timeoutMs = 15000, maxRetries = 3, baseDelay = 2000 } = {}
): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, { ...options, signal: controller.signal })
      clearTimeout(timeoutId)

      if (response.status === 429 || response.status >= 500) {
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1)
          logger.warn({ url, status: response.status, attempt, delay }, 'Neon API 重試')
          await new Promise(r => setTimeout(r, delay))
          continue
        }
      }

      return response
    } catch (err) {
      clearTimeout(timeoutId)
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1)
        logger.warn({ url, attempt, delay, err: String(err) }, 'Neon fetch 重試')
        await new Promise(r => setTimeout(r, delay))
        continue
      }
      throw err
    }
  }
  throw new Error(`fetchWithRetry exhausted retries for ${url}`)
}

function getAuthHeaders(): Record<string, string> {
  const token = getEnv().NEON_API_KEY
  if (!token) throw new Error('NEON_API_KEY 未設定')
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

// ============================================================
// Quota 檢查
// ============================================================

export async function checkDbQuota(
  userId: string,
  plan: string
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const limit = getDbLimit(plan)
  if (limit <= 0) return { allowed: false, current: 0, limit: 0 }

  const result = await db.query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM projects WHERE user_id = $1 AND neon_project_id IS NOT NULL',
    [userId]
  )
  const current = parseInt(result.rows[0]?.count || '0', 10)

  return { allowed: current < limit, current, limit }
}

// ============================================================
// Neon API 核心函數
// ============================================================

interface NeonCreateProjectResponse {
  project: { id: string; name: string }
  connection_uris: Array<{
    connection_uri: string
    connection_parameters: {
      host: string
      database: string
      role: string
      password: string
    }
  }>
}

async function createNeonProject(params: {
  name: string
  region?: string
}): Promise<{ projectId: string; connectionUri: string; host: string }> {
  const { name, region } = params
  const defaultRegion = getEnv().NEON_DEFAULT_REGION

  const response = await fetchWithRetry(
    `${NEON_API}/projects`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        project: {
          name,
          region_id: region || defaultRegion,
        },
      }),
    },
    { timeoutMs: 30000 }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Neon createProject 失敗 (${response.status}): ${errorText}`)
  }

  const data = await response.json() as NeonCreateProjectResponse
  const connUri = data.connection_uris[0]

  if (!connUri) {
    throw new Error('Neon createProject 回傳無 connection_uri')
  }

  logger.info({ projectId: data.project.id, name, region: region || defaultRegion }, 'Neon project 建立成功')
  return {
    projectId: data.project.id,
    connectionUri: connUri.connection_uri,
    host: connUri.connection_parameters.host,
  }
}

export async function deleteNeonProject(projectId: string): Promise<void> {
  try {
    await fetchWithRetry(
      `${NEON_API}/projects/${projectId}`,
      { method: 'DELETE', headers: getAuthHeaders() },
      { maxRetries: 2 }
    )
    logger.info({ projectId }, 'Neon project 已刪除（回滾）')
  } catch (err) {
    logger.error({ err, projectId }, 'Neon project 刪除失敗')
  }
}

// ============================================================
// 執行 DDL（透過 pg.Client 直連）
// ============================================================

const DDL_TIMEOUT_MS = 5 * 60 * 1000  // L16.P1：單次 DDL 最長 5 分鐘，防卡死整個 30min completeSpecPhase

async function executeDDL(
  connectionUri: string,
  sql: string
): Promise<{ success: boolean; error?: string }> {
  const client = new Client({ connectionString: connectionUri, ssl: { rejectUnauthorized: false } })
  try {
    await client.connect()
    // Promise.race 包 client.query，超時時 reject + 主動 client.end() 切斷連線
    // 防止 Neon 端長查詢無限 pending（實測過 DDL 互鎖可卡 30min+）
    await Promise.race([
      client.query(sql),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`DDL 執行超時（> ${DDL_TIMEOUT_MS / 60000}min），強制中斷`)), DDL_TIMEOUT_MS)
      ),
    ])
    return { success: true }
  } catch (err) {
    return { success: false, error: `DDL 執行失敗: ${err instanceof Error ? err.message : String(err)}` }
  } finally {
    await client.end().catch(() => {})
  }
}

// ============================================================
// 完整 Provisioning 流程（同步，< 10s）
// ============================================================

/**
 * 從 DDL 中提取 users 表的欄位名列表
 * 用於動態組裝 admin seed INSERT（避免 INSERT 不存在的欄位）
 */
function extractUsersColumns(ddl: string): string[] {
  const match = ddl.match(/CREATE\s+TABLE\s+users\s*\(([\s\S]*?)\);/i)
  if (!match) return []
  return match[1]
    .split('\n')
    .map(line => line.trim().split(/\s+/)[0]?.toLowerCase() ?? '')
    .filter(col => col && /^[a-z_]/.test(col)
      && !['constraint', 'primary', 'unique', 'foreign', 'check'].includes(col))
}

export interface NeonProvisionResult {
  neonProjectId: string
  connectionUri: string
  host: string
}

/**
 * 清淨 projects 表的 neon_* 欄位（L16.P0.1）
 * 在 provisioning 失敗路徑呼叫，避免 DB 留下指向不完整 Neon project 的 connection string。
 * 錯誤不 throw（best-effort），因為此函數本身就是清理步驟，再 throw 會遮蓋原始錯誤。
 */
async function clearNeonFieldsInDb(projectId: string): Promise<void> {
  try {
    await db.query(
      `UPDATE projects SET
        neon_project_id = NULL,
        neon_connection_string = NULL,
        neon_host = NULL,
        updated_at = NOW()
      WHERE id = $1`,
      [projectId]
    )
    logger.info({ projectId }, 'Neon fields in DB cleared (provisioning failed path)')
  } catch (err) {
    logger.error({ err, projectId }, 'Failed to clear Neon fields in DB — manual cleanup may be required')
  }
}

export async function provisionNeonDatabase(params: {
  projectId: string
  projectName: string
  schema: DerivedSchema
  conversationId: string
  io: IoEmitter
  locale?: 'zh' | 'en'
}): Promise<NeonProvisionResult | null> {
  const { projectId, projectName, schema, conversationId, io, locale } = params
  const isZh = locale !== 'en'

  // L16.P0.1：檢查是否已有舊 Neon project（regenerate 情境）
  // 若有 → 刪掉 + 清 DB 欄位，避免新舊 project 並存造成孤兒 + drift
  try {
    const existing = await db.query<{ neon_project_id: string | null }>(
      'SELECT neon_project_id FROM projects WHERE id = $1',
      [projectId]
    )
    const oldNeonProjectId = existing.rows[0]?.neon_project_id
    if (oldNeonProjectId) {
      logger.info({ projectId, oldNeonProjectId }, 'Found existing Neon project — deleting before re-provision')
      await deleteNeonProject(oldNeonProjectId)
      await clearNeonFieldsInDb(projectId)
    }
  } catch (err) {
    logger.warn({ err, projectId }, 'Old Neon project cleanup check failed — continuing')
  }

  let createdNeonProjectId: string | null = null
  try {
    // 1. 建立 Neon project（2-3s）
    const { projectId: neonProjectId, connectionUri, host } = await createNeonProject({
      name: projectName,
    })
    createdNeonProjectId = neonProjectId

    // 2. 執行 Schema DDL（2-3s）
    if (schema.postgresqlDDL) {
      const sqlResult = await executeDDL(connectionUri, schema.postgresqlDDL)
      if (!sqlResult.success) {
        logger.error({ neonProjectId, error: sqlResult.error }, 'Schema 執行失敗，回滾 project')
        await deleteNeonProject(neonProjectId)
        await clearNeonFieldsInDb(projectId)
        return null
      }
    }

    // 2.5 Seed admin 帳號（如果 schema 有 auth）
    // 動態偵測 DDL 中 users 表的實際欄位，避免 INSERT 不存在的欄位
    if (schema.postgresqlDDL && detectAuthInSchema(schema.postgresqlDDL)) {
      try {
        const userCols = extractUsersColumns(schema.postgresqlDDL)
        const hasEmail = userCols.includes('email')
        const hasPassword = userCols.includes('password')

        if (!hasEmail || !hasPassword) {
          logger.info({ userCols }, 'users 表無 email/password 欄位，跳過 admin seed')
        } else {
          const hashedPassword = await bcrypt.hash('admin123', 10)
          const nameCol = userCols.find(c => c === 'name' || c === 'username')
          const hasRole = userCols.includes('role')
          const hasCreatedAt = userCols.includes('created_at')

          const cols: string[] = ['id']
          const vals: string[] = ['gen_random_uuid()']
          if (nameCol) { cols.push(nameCol); vals.push("'Admin'") }
          cols.push('email'); vals.push("'admin@admin.com'")
          cols.push('password'); vals.push('$1')
          if (hasRole) { cols.push('role'); vals.push("'admin'") }
          if (hasCreatedAt) { cols.push('created_at'); vals.push('NOW()') }

          const seedClient = new Client({ connectionString: connectionUri, ssl: { rejectUnauthorized: false } })
          await seedClient.connect()
          await seedClient.query(
            `INSERT INTO users (${cols.join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT (email) DO NOTHING`,
            [hashedPassword]
          )
          await seedClient.end()
          logger.info({ cols }, 'Admin 帳號 seed 完成（admin@admin.com / admin123）')
        }
      } catch (seedErr) {
        // Seed 失敗不阻塞 provisioning
        logger.warn({ err: seedErr }, 'Admin 帳號 seed 失敗（不阻塞）')
      }
    }

    // 3. 寫入 DB
    await db.query(
      `UPDATE projects SET
        neon_project_id = $2,
        neon_connection_string = $3,
        neon_host = $4,
        updated_at = NOW()
      WHERE id = $1`,
      [projectId, neonProjectId, connectionUri, host]
    )

    // 4. 推送成功通知
    await sendMessage(conversationId, io, {
      content: isZh
        ? `資料庫已建立完成！\n\n- **Host**: \`${host}\`\n- **${schema.entityCount} 個資料表**已自動建立\n\n部署時會自動注入連線資訊。`
        : `Database is ready!\n\n- **Host**: \`${host}\`\n- **${schema.entityCount} tables** created\n\nConnection info will be injected automatically during deployment.`,
      stage: 'db_complete',
      richContent: {
        type: 'db_provision_result',
        data: {
          host,
          entityCount: schema.entityCount,
          entities: schema.entities,
        },
      },
    })

    logger.info({ projectId, neonProjectId, entityCount: schema.entityCount }, 'Neon provisioning 完成')
    return { neonProjectId, connectionUri, host }
  } catch (err) {
    logger.error({ err, projectId, createdNeonProjectId }, 'Neon provisioning 失敗')
    // L16.P0.1：catch 路徑 rollback
    // createdNeonProjectId 已宣告於 try 外 → catch 可見。
    // 若 project 已建但中途失敗（createProject 成功後任何一步 throw），
    // 清掉 Neon 殘骸 + DB 欄位，避免孤兒。
    if (createdNeonProjectId) {
      await deleteNeonProject(createdNeonProjectId)
    }
    await clearNeonFieldsInDb(projectId)
    return null
  }
}

// ============================================================
// L16.P0.2：Schema Drift 偵測 + Pre-flight re-provision
// ============================================================

/**
 * 從 DerivedSchema.postgresqlDDL 提取所有 CREATE TABLE 的 table 名。
 * 支援 `CREATE TABLE IF NOT EXISTS`；對 `schema.table` 限定名取 table 部分。
 */
export function extractTableNamesFromDDL(ddl: string): string[] {
  const tables: string[] = []
  const regex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:[a-zA-Z_][\w]*\s*\.\s*)?([a-zA-Z_][\w]*)/gi
  let match: RegExpExecArray | null
  while ((match = regex.exec(ddl)) !== null) {
    tables.push(match[1].toLowerCase())
  }
  return tables
}

/**
 * 查 Neon DB 的 information_schema.tables，找出 expectedTables 中不存在的表。
 * 失敗時回傳空陣列（fail-open，不阻塞 pipeline）。
 */
async function findMissingTables(connectionString: string, expectedTables: string[]): Promise<string[]> {
  if (expectedTables.length === 0) return []

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } })
  try {
    await client.connect()
    const result = await Promise.race([
      client.query<{ table_name: string }>(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
        [expectedTables]
      ),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('information_schema 查詢超時（> 30s）')), 30_000)
      ),
    ])
    const existing = new Set(result.rows.map(r => r.table_name.toLowerCase()))
    return expectedTables.filter(t => !existing.has(t))
  } catch (err) {
    logger.warn({ err }, 'findMissingTables 失敗 — fail-open 視為無缺表')
    return []
  } finally {
    await client.end().catch(() => {})
  }
}

/**
 * L16.P0.2：Coder Testing 前的 Pre-flight schema check。
 *
 * 確保 Neon DB 的 schema 跟 BDD 推導的 DDL 對得起來。三層處理：
 *   1. DB 沒有 connection string → 首次 provisioning
 *   2. 有 connection string 但 schema 缺表（regenerate 後舊 DB 沒跟上）→ re-provision
 *   3. 有 connection string 且 schema 齊全 → 直接回傳
 *
 * 注意：re-provisioning 會刪掉舊 Neon project（所有資料）。只在 regenerate 場景
 * （BDD 重算 → schema 變了）觸發，不在正常 Coder Testing 中發生。
 *
 * Fail-open：任何異常（DB query 失敗、tables 解析失敗）→ 回傳現有 connection，
 * 讓下游測試自己處理缺表錯誤，避免 pre-flight 變成新的阻塞點。
 */
export async function ensureNeonSchemaFresh(params: {
  projectId: string
  projectName: string
  schema: DerivedSchema
  conversationId: string
  io: IoEmitter
  locale?: 'zh' | 'en'
}): Promise<{ connectionString: string | null; reprovisioned: boolean; missingTables?: string[] }> {
  const { projectId, schema } = params

  // 1. 讀當前 connection
  let currentConn: string | null = null
  try {
    const row = await db.queryOne<{ neon_connection_string: string | null }>(
      'SELECT neon_connection_string FROM projects WHERE id = $1',
      [projectId]
    )
    currentConn = row?.neon_connection_string || null
  } catch (err) {
    logger.warn({ err, projectId }, 'ensureNeonSchemaFresh: 讀 DB 失敗 — 嘗試直接 provision')
  }

  // 2. 無 connection → 首次 provision
  if (!currentConn) {
    logger.info({ projectId }, 'ensureNeonSchemaFresh: no connection — fresh provision')
    const result = await provisionNeonDatabase(params)
    return { connectionString: result?.connectionUri || null, reprovisioned: !!result }
  }

  // 3. 有 connection → 檢查 schema 是否齊全
  const expectedTables = extractTableNamesFromDDL(schema.postgresqlDDL || '')
  const missing = await findMissingTables(currentConn, expectedTables)

  if (missing.length === 0) {
    return { connectionString: currentConn, reprovisioned: false }
  }

  // 4. 缺表 → re-provision（provisionNeonDatabase 內部會刪舊 + 清 DB + 建新）
  logger.warn({ projectId, missingTables: missing, expectedCount: expectedTables.length }, 'ensureNeonSchemaFresh: schema drift detected — re-provisioning')
  const reprovResult = await provisionNeonDatabase(params)
  return {
    connectionString: reprovResult?.connectionUri || null,
    reprovisioned: !!reprovResult,
    missingTables: missing,
  }
}
