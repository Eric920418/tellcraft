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

async function executeDDL(
  connectionUri: string,
  sql: string
): Promise<{ success: boolean; error?: string }> {
  const client = new Client({ connectionString: connectionUri, ssl: { rejectUnauthorized: false } })
  try {
    await client.connect()
    await client.query(sql)
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

  try {
    // 1. 建立 Neon project（2-3s）
    const { projectId: neonProjectId, connectionUri, host } = await createNeonProject({
      name: projectName,
    })

    // 2. 執行 Schema DDL（2-3s）
    if (schema.postgresqlDDL) {
      const sqlResult = await executeDDL(connectionUri, schema.postgresqlDDL)
      if (!sqlResult.success) {
        logger.error({ neonProjectId, error: sqlResult.error }, 'Schema 執行失敗，回滾 project')
        await deleteNeonProject(neonProjectId)
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
    logger.error({ err, projectId }, 'Neon provisioning 失敗')
    return null
  }
}
