// ============================================================
// Supabase Service — Management API 客戶端
// 自動建立 Supabase Project + 套用 BDD 推導的 Schema
// ============================================================

import crypto from 'crypto'
import { getEnv } from '../lib/env'
import * as db from '../db/client'
import { createLogger } from '../lib/logger'
import { getSupabaseLimit } from '../config/plans'
import { sendMessage } from '../workers/orchestrator-utils'
import type { DerivedSchema } from './schema-derivation'
import type { Server as SocketIOServer } from 'socket.io'
import type Redis from 'ioredis'

const logger = createLogger('supabase-service')

const SUPABASE_MGMT_API = 'https://api.supabase.com'

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
          logger.warn({ url, status: response.status, attempt, delay }, 'Supabase API 重試')
          await new Promise(r => setTimeout(r, delay))
          continue
        }
      }

      return response
    } catch (err) {
      clearTimeout(timeoutId)
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1)
        logger.warn({ url, attempt, delay, err: String(err) }, 'Supabase fetch 重試')
        await new Promise(r => setTimeout(r, delay))
        continue
      }
      throw err
    }
  }
  throw new Error(`fetchWithRetry exhausted retries for ${url}`)
}

function getAuthHeaders(): Record<string, string> {
  const token = getEnv().SUPABASE_ACCESS_TOKEN
  if (!token) throw new Error('SUPABASE_ACCESS_TOKEN 未設定')
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

// ============================================================
// Quota 檢查
// ============================================================

export async function checkSupabaseQuota(
  userId: string,
  plan: string
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const limit = getSupabaseLimit(plan)
  if (limit <= 0) return { allowed: false, current: 0, limit: 0 }

  const result = await db.query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM projects WHERE user_id = $1 AND supabase_project_id IS NOT NULL',
    [userId]
  )
  const current = parseInt(result.rows[0]?.count || '0', 10)

  return { allowed: current < limit, current, limit }
}

// ============================================================
// Supabase Management API 核心函數
// ============================================================

export async function createSupabaseProject(params: {
  name: string
  organizationId: string
  region?: string
  dbPassword: string
}): Promise<{ ref: string }> {
  const { name, organizationId, region = 'ap-northeast-1', dbPassword } = params

  const response = await fetchWithRetry(
    `${SUPABASE_MGMT_API}/v1/projects`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name,
        organization_id: organizationId,
        region,
        db_pass: dbPassword,
        plan: 'free',
      }),
    },
    { timeoutMs: 30000 }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Supabase createProject 失敗 (${response.status}): ${errorText}`)
  }

  const data = await response.json() as { id: string }
  logger.info({ ref: data.id, name, region }, 'Supabase project 建立請求已送出')
  return { ref: data.id }
}

export async function pollProjectUntilActive(
  ref: string,
  maxWaitMs = 300_000,
  pollIntervalMs = 10_000
): Promise<boolean> {
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const response = await fetchWithRetry(
        `${SUPABASE_MGMT_API}/v1/projects/${ref}`,
        { method: 'GET', headers: getAuthHeaders() },
        { maxRetries: 1, timeoutMs: 10000 }
      )

      if (response.ok) {
        const data = await response.json() as { status: string }
        if (data.status === 'ACTIVE_HEALTHY') {
          logger.info({ ref }, 'Supabase project 已就緒')
          return true
        }
        logger.debug({ ref, status: data.status }, 'Supabase project 等待中...')
      }
    } catch {
      // 輪詢中的暫時錯誤，繼續
    }

    await new Promise(r => setTimeout(r, pollIntervalMs))
  }

  logger.warn({ ref, maxWaitMs }, 'Supabase project 輪詢超時')
  return false
}

export async function getProjectApiKeys(
  ref: string
): Promise<{ anonKey: string; serviceRoleKey: string }> {
  const response = await fetchWithRetry(
    `${SUPABASE_MGMT_API}/v1/projects/${ref}/api-keys`,
    { method: 'GET', headers: getAuthHeaders() }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Supabase getApiKeys 失敗 (${response.status}): ${errorText}`)
  }

  const keys = await response.json() as Array<{ name: string; api_key: string }>
  const anonKey = keys.find(k => k.name === 'anon')?.api_key
  const serviceRoleKey = keys.find(k => k.name === 'service_role')?.api_key

  if (!anonKey || !serviceRoleKey) {
    throw new Error(`Supabase API keys 不完整: anon=${!!anonKey}, service_role=${!!serviceRoleKey}`)
  }

  return { anonKey, serviceRoleKey }
}

export async function executeSql(
  ref: string,
  sql: string
): Promise<{ success: boolean; error?: string }> {
  const response = await fetchWithRetry(
    `${SUPABASE_MGMT_API}/v1/projects/${ref}/database/query`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ query: sql }),
    },
    { timeoutMs: 30000 }
  )

  if (!response.ok) {
    const errorText = await response.text()
    return { success: false, error: `SQL 執行失敗 (${response.status}): ${errorText}` }
  }

  return { success: true }
}

async function deleteProject(ref: string): Promise<void> {
  try {
    await fetchWithRetry(
      `${SUPABASE_MGMT_API}/v1/projects/${ref}`,
      { method: 'DELETE', headers: getAuthHeaders() },
      { maxRetries: 2 }
    )
    logger.info({ ref }, 'Supabase project 已刪除（回滾）')
  } catch (err) {
    logger.error({ err, ref }, 'Supabase project 刪除失敗')
  }
}

// ============================================================
// 完整 Provisioning 流程（fire-and-forget）
// ============================================================

export async function provisionSupabaseDatabase(params: {
  projectId: string
  projectName: string
  schema: DerivedSchema
  conversationId: string
  redis: Redis
  io: SocketIOServer
  locale?: 'zh' | 'en'
}): Promise<void> {
  const { projectId, projectName, schema, conversationId, redis, io, locale } = params
  const isZh = locale !== 'en'
  const redisKey = `supabase-provision:${projectId}`

  try {
    const env = getEnv()
    const orgId = env.SUPABASE_ORG_ID
    if (!orgId) throw new Error('SUPABASE_ORG_ID 未設定')

    // 1. 設定 Redis 追蹤 key（TTL 24h）
    await redis.set(redisKey, JSON.stringify({
      status: 'creating',
      startedAt: Date.now(),
    }), 'EX', 86400)

    // 2. 建立 Supabase project
    const dbPassword = crypto.randomBytes(16).toString('hex')
    const { ref } = await createSupabaseProject({
      name: projectName,
      organizationId: orgId,
      dbPassword,
    })

    // 3. 輪詢等待就緒
    const isActive = await pollProjectUntilActive(ref)
    if (!isActive) {
      await redis.set(redisKey, JSON.stringify({
        status: 'failed',
        error: 'Project 建立超時（5 分鐘）',
      }), 'EX', 86400)
      await sendMessage(conversationId, io, {
        content: isZh
          ? '資料庫建立超時，你可以稍後在專案設定中重試。不影響目前的設計流程。'
          : 'Database creation timed out. You can retry later in project settings. This does not affect the current design flow.',
        stage: 'supabase_failed',
      })
      return
    }

    // 4. 取得 API Keys
    const { anonKey, serviceRoleKey } = await getProjectApiKeys(ref)

    // 5. 執行 Schema DDL
    if (schema.postgresqlDDL) {
      const sqlResult = await executeSql(ref, schema.postgresqlDDL)
      if (!sqlResult.success) {
        logger.error({ ref, error: sqlResult.error }, 'Schema 執行失敗，回滾 project')
        await deleteProject(ref)
        await redis.set(redisKey, JSON.stringify({
          status: 'failed',
          error: `Schema 套用失敗: ${sqlResult.error}`,
        }), 'EX', 86400)
        await sendMessage(conversationId, io, {
          content: isZh
            ? '資料庫 Schema 套用失敗，已自動清理。不影響目前的設計流程。'
            : 'Database schema application failed. Cleaned up automatically. Design flow continues.',
          stage: 'supabase_failed',
        })
        return
      }
    }

    // 6. 寫入 DB
    const supabaseUrl = `https://${ref}.supabase.co`
    await db.query(
      `UPDATE projects SET
        supabase_project_id = $2,
        supabase_url = $3,
        supabase_anon_key = $4,
        supabase_service_role_key = $5,
        supabase_org_id = $6,
        updated_at = NOW()
      WHERE id = $1`,
      [projectId, ref, supabaseUrl, anonKey, serviceRoleKey, orgId]
    )

    // 7. 更新 Redis key
    await redis.set(redisKey, JSON.stringify({
      status: 'completed',
      ref,
      url: supabaseUrl,
      anonKey,
    }), 'EX', 86400)

    // 8. 推送成功通知
    await sendMessage(conversationId, io, {
      content: isZh
        ? `Supabase 資料庫已建立完成！\n\n- **URL**: \`${supabaseUrl}\`\n- **${schema.entityCount} 個資料表**已自動建立\n\n部署時會自動注入連線資訊。`
        : `Supabase database is ready!\n\n- **URL**: \`${supabaseUrl}\`\n- **${schema.entityCount} tables** created\n\nConnection info will be injected automatically during deployment.`,
      stage: 'supabase_complete',
      richContent: {
        type: 'supabase_provision_result',
        data: {
          url: supabaseUrl,
          entityCount: schema.entityCount,
          entities: schema.entities,
        },
      },
    })

    logger.info({ projectId, ref, entityCount: schema.entityCount }, 'Supabase provisioning 完成')
  } catch (err) {
    logger.error({ err, projectId }, 'Supabase provisioning 失敗')

    await redis.set(redisKey, JSON.stringify({
      status: 'failed',
      error: String(err),
    }), 'EX', 86400).catch(() => {})

    await sendMessage(conversationId, io, {
      content: isZh
        ? '資料庫建立失敗，不影響目前的設計流程。你可以稍後重試。'
        : 'Database creation failed. This does not affect the design flow. You can retry later.',
      stage: 'supabase_failed',
    }).catch(() => {})
  }
}

// ============================================================
// Deployer 整合：等待 provisioning 完成
// ============================================================

export async function waitForSupabaseProvisioning(
  projectId: string,
  redis: Redis,
  maxWaitMs = 120_000
): Promise<{ url: string; anonKey: string } | null> {
  const key = `supabase-provision:${projectId}`
  const start = Date.now()

  while (Date.now() - start < maxWaitMs) {
    const raw = await redis.get(key)
    if (!raw) return null // 沒有 provisioning → 跳過

    const data = JSON.parse(raw) as { status: string; url?: string; anonKey?: string }
    if (data.status === 'completed' && data.url && data.anonKey) {
      return { url: data.url, anonKey: data.anonKey }
    }
    if (data.status === 'failed') return null

    await new Promise(r => setTimeout(r, 5000))
  }

  logger.warn({ projectId, maxWaitMs }, 'Supabase provisioning 等待超時')
  return null
}
