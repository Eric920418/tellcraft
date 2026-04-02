// ============================================================
// Domain Service — 域名購買/綁定/DNS 管理核心服務
// 從前端 app/actions/porkbun.ts + cloudflare.ts 遷移 + 改進
// ============================================================

import { getEnv } from '../lib/env'
import * as db from '../db/client'
import { createLogger } from '../lib/logger'
import type Redis from 'ioredis'
import { sendMessage, saveFlowState, getFlowState } from '../workers/orchestrator-utils'
import type { FlowState, IoEmitter } from '../types/flow-state'
import type { RegistrantInfo, CreateDnsRecordInput } from '../schemas/domain'

const logger = createLogger('domain-service')

const PORKBUN_API = 'https://api.porkbun.com/api/json/v3'
const CLOUDFLARE_API = 'https://api.cloudflare.com/client/v4'
const VERCEL_API = 'https://api.vercel.com'

// 備用價格表
const FALLBACK_PRICING: Record<string, { registration: string; renewal: string }> = {
  'com': { registration: '9.73', renewal: '9.73' },
  'net': { registration: '10.73', renewal: '10.73' },
  'org': { registration: '9.73', renewal: '9.73' },
  'io': { registration: '33.73', renewal: '33.73' },
  'ai': { registration: '26.18', renewal: '73.18' },
  'dev': { registration: '12.18', renewal: '12.18' },
  'app': { registration: '12.18', renewal: '12.18' },
  'co': { registration: '23.73', renewal: '23.73' },
}

// ============================================================
// 帶超時 + 指數退避的 fetch
// ============================================================

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  { timeoutMs = 10000, maxRetries = 3, baseDelay = 2000 } = {}
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
          logger.warn({ url, status: response.status, attempt, delay }, 'API 重試')
          await new Promise(r => setTimeout(r, delay))
          continue
        }
      }

      return response
    } catch (err) {
      clearTimeout(timeoutId)
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1)
        logger.warn({ url, attempt, delay, err: String(err) }, 'fetch 重試')
        await new Promise(r => setTimeout(r, delay))
        continue
      }
      throw err
    }
  }
  throw new Error(`fetchWithRetry exhausted retries for ${url}`)
}

// ============================================================
// Porkbun helpers
// ============================================================

function getPorkbunKeys() {
  const env = getEnv()
  const apiKey = env.PORKBUN_API_KEY
  const secretKey = env.PORKBUN_SECRET_KEY
  if (!apiKey || !secretKey) {
    throw new Error('PORKBUN_API_KEY 和 PORKBUN_SECRET_KEY 必須設定')
  }
  return { apiKey, secretKey }
}

function getCloudflareAuth() {
  const env = getEnv()
  const token = env.CLOUDFLARE_API_TOKEN
  const accountId = env.CLOUDFLARE_ACCOUNT_ID
  if (!token || !accountId) {
    throw new Error('CLOUDFLARE_API_TOKEN 和 CLOUDFLARE_ACCOUNT_ID 必須設定')
  }
  return { token, accountId }
}

function getVercelAuth() {
  const env = getEnv()
  const token = env.VERCEL_ACCESS_TOKEN
  if (!token) throw new Error('VERCEL_ACCESS_TOKEN 必須設定')
  const teamId = env.VERCEL_TEAM_ID
  return { token, teamId }
}

// ============================================================
// 域名可用性查詢（RDAP 主查詢 + Google DNS 降級）
// ============================================================

export async function checkDomainAvailability(domain: string): Promise<{
  available: boolean
  price?: string
  source: 'rdap' | 'dns' | 'fallback'
}> {
  // 先嘗試 RDAP 查詢（更可靠）
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const rdapResponse = await fetch(`https://rdap.org/domain/${domain}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/rdap+json' },
    })
    clearTimeout(timeoutId)

    if (rdapResponse.status === 404) {
      // 域名未註冊
      const tld = domain.split('.').pop()?.toLowerCase()
      const price = tld && FALLBACK_PRICING[tld] ? `$${FALLBACK_PRICING[tld].registration}` : undefined
      return { available: true, price, source: 'rdap' }
    }

    if (rdapResponse.ok) {
      return { available: false, source: 'rdap' }
    }

    // RDAP 非標準回應，降級 DNS
    logger.warn({ domain, status: rdapResponse.status }, 'RDAP 非標準回應，降級 DNS 查詢')
  } catch (err) {
    logger.warn({ domain, err: String(err) }, 'RDAP 查詢失敗，降級 DNS')
  }

  // 降級：Google DNS
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const dnsResponse = await fetch(
      `https://dns.google/resolve?name=${domain}&type=A`,
      { signal: controller.signal }
    )
    clearTimeout(timeoutId)

    const dnsData = await dnsResponse.json() as { Status: number; Answer?: unknown[] }
    const isAvailable = dnsData.Status === 3 || !dnsData.Answer || dnsData.Answer.length === 0

    const tld = domain.split('.').pop()?.toLowerCase()
    const price = tld && FALLBACK_PRICING[tld] ? `$${FALLBACK_PRICING[tld].registration}` : undefined

    return { available: isAvailable, price: isAvailable ? price : undefined, source: 'dns' }
  } catch (err) {
    logger.error({ domain, err: String(err) }, 'DNS 查詢也失敗')
    throw new Error(`域名查詢失敗：${domain}`)
  }
}

// ============================================================
// Porkbun — 域名註冊
// ============================================================

export async function registerDomain(
  domain: string,
  registrant: RegistrantInfo,
  years: number = 1
): Promise<{ domain: string; expireDate?: string }> {
  const { apiKey, secretKey } = getPorkbunKeys()

  const response = await fetchWithRetry(`${PORKBUN_API}/domain/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey: apiKey,
      secretapikey: secretKey,
      domain,
      years,
      ...registrant,
    }),
  })

  const data = await response.json() as { status: string; domain?: string; expireDate?: string; message?: string }
  if (data.status !== 'SUCCESS') {
    throw new Error(`域名註冊失敗：${data.message || '未知錯誤'}`)
  }

  return { domain: data.domain || domain, expireDate: data.expireDate }
}

// ============================================================
// Porkbun — 更新 Nameservers
// ============================================================

export async function updateNameservers(domain: string, nameservers: string[]): Promise<void> {
  const { apiKey, secretKey } = getPorkbunKeys()

  const response = await fetchWithRetry(`${PORKBUN_API}/domain/updateNs/${domain}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apikey: apiKey, secretapikey: secretKey, ns: nameservers }),
  })

  const data = await response.json() as { status: string; message?: string }
  if (data.status !== 'SUCCESS') {
    throw new Error(`NS 更新失敗：${data.message || '未知錯誤'}`)
  }
}

// ============================================================
// Porkbun — 價格查詢
// ============================================================

export async function getDomainPricing(): Promise<{
  pricing: Record<string, { registration: string; renewal: string }>
  source: 'api' | 'fallback'
}> {
  try {
    const { apiKey, secretKey } = getPorkbunKeys()
    const response = await fetchWithRetry(`${PORKBUN_API}/pricing/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apikey: apiKey, secretapikey: secretKey }),
    }, { timeoutMs: 5000, maxRetries: 1 })

    const data = await response.json() as {
      status: string
      pricing?: Record<string, { registration: string; renewal: string }>
    }

    if (data.status === 'SUCCESS' && data.pricing) {
      return { pricing: data.pricing, source: 'api' }
    }
  } catch (err) {
    logger.warn({ err: String(err) }, 'Porkbun 價格 API 失敗，使用備用價格')
  }

  return { pricing: FALLBACK_PRICING, source: 'fallback' }
}

// ============================================================
// Cloudflare — Zone CRUD
// ============================================================

export async function createCloudflareZone(domain: string): Promise<{
  zoneId: string
  nameservers: string[]
}> {
  const { token, accountId } = getCloudflareAuth()

  const response = await fetchWithRetry(`${CLOUDFLARE_API}/zones`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: domain, account: { id: accountId }, type: 'full' }),
  })

  const data = await response.json() as {
    success: boolean
    result?: { id: string; name_servers: string[] }
    errors?: Array<{ message: string }>
  }

  if (!data.success || !data.result) {
    throw new Error(`Cloudflare Zone 建立失敗：${data.errors?.[0]?.message || '未知錯誤'}`)
  }

  return { zoneId: data.result.id, nameservers: data.result.name_servers }
}

export async function deleteCloudflareZone(zoneId: string): Promise<void> {
  const { token } = getCloudflareAuth()

  try {
    await fetchWithRetry(`${CLOUDFLARE_API}/zones/${zoneId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    }, { maxRetries: 2 })
  } catch (err) {
    logger.error({ zoneId, err: String(err) }, '刪除 Cloudflare Zone 失敗（rollback）')
  }
}

// ============================================================
// Cloudflare — DNS Records CRUD
// ============================================================

export async function createDnsRecord(
  zoneId: string,
  record: CreateDnsRecordInput
): Promise<{ id: string; type: string; name: string; content: string }> {
  const { token } = getCloudflareAuth()

  const response = await fetchWithRetry(`${CLOUDFLARE_API}/zones/${zoneId}/dns_records`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(record),
  })

  const data = await response.json() as {
    success: boolean
    result?: { id: string; type: string; name: string; content: string }
    errors?: Array<{ message: string }>
  }

  if (!data.success || !data.result) {
    throw new Error(`DNS 記錄建立失敗：${data.errors?.[0]?.message || '未知錯誤'}`)
  }

  return data.result
}

export async function listDnsRecords(zoneId: string): Promise<Array<{
  id: string; type: string; name: string; content: string; ttl: number; proxied: boolean
}>> {
  const { token } = getCloudflareAuth()

  const response = await fetchWithRetry(`${CLOUDFLARE_API}/zones/${zoneId}/dns_records?per_page=100`, {
    headers: { 'Authorization': `Bearer ${token}` },
  }, { maxRetries: 2 })

  const data = await response.json() as {
    success: boolean
    result?: Array<{ id: string; type: string; name: string; content: string; ttl: number; proxied: boolean }>
  }

  return data.result || []
}

export async function deleteDnsRecord(zoneId: string, recordId: string): Promise<void> {
  const { token } = getCloudflareAuth()

  const response = await fetchWithRetry(`${CLOUDFLARE_API}/zones/${zoneId}/dns_records/${recordId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  })

  const data = await response.json() as { success: boolean; errors?: Array<{ message: string }> }
  if (!data.success) {
    throw new Error(`DNS 記錄刪除失敗：${data.errors?.[0]?.message || '未知錯誤'}`)
  }
}

export async function setupVercelDns(zoneId: string, domain: string): Promise<void> {
  // Vercel 標準 DNS 設定：A record + CNAME for www
  await createDnsRecord(zoneId, {
    type: 'A',
    name: domain,
    content: '76.76.21.21', // Vercel IP
    ttl: 1,
    proxied: false,
  })

  await createDnsRecord(zoneId, {
    type: 'CNAME',
    name: `www.${domain}`,
    content: 'cname.vercel-dns.com',
    ttl: 1,
    proxied: false,
  })
}

// ============================================================
// Vercel — 域名綁定
// ============================================================

export async function bindDomainToVercel(
  vercelProjectId: string,
  domain: string
): Promise<{ verified: boolean }> {
  const { token, teamId } = getVercelAuth()
  const teamParam = teamId ? `?teamId=${teamId}` : ''

  // 新增域名到 Vercel project
  const response = await fetchWithRetry(
    `${VERCEL_API}/v10/projects/${vercelProjectId}/domains${teamParam}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: domain }),
    }
  )

  const data = await response.json() as {
    name?: string
    verified?: boolean
    error?: { code: string; message: string }
  }

  if (data.error) {
    // domain_already_in_use 不一定是錯誤（可能是重試）
    if (data.error.code === 'domain_already_in_use') {
      logger.warn({ domain, vercelProjectId }, '域名已綁定到 Vercel（可能是重試）')
      return { verified: true }
    }
    throw new Error(`Vercel 域名綁定失敗：${data.error.message}`)
  }

  return { verified: data.verified ?? false }
}

export async function removeDomainFromVercel(
  vercelProjectId: string,
  domain: string
): Promise<void> {
  const { token, teamId } = getVercelAuth()
  const teamParam = teamId ? `?teamId=${teamId}` : ''

  try {
    await fetchWithRetry(
      `${VERCEL_API}/v10/projects/${vercelProjectId}/domains/${domain}${teamParam}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      },
      { maxRetries: 2 }
    )
  } catch (err) {
    logger.error({ domain, vercelProjectId, err: String(err) }, '移除 Vercel 域名綁定失敗（rollback）')
  }
}

// ============================================================
// DNS 傳播驗證
// ============================================================

export async function verifyDnsPropagation(domain: string, maxAttempts = 3, intervalMs = 30000): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(
        `https://dns.google/resolve?name=${domain}&type=A`,
        { signal: controller.signal }
      )
      clearTimeout(timeoutId)

      const data = await response.json() as { Status: number; Answer?: Array<{ data: string }> }

      // Status 0 = NOERROR，且有 Answer → DNS 已傳播
      if (data.Status === 0 && data.Answer && data.Answer.length > 0) {
        // 驗證是否指向 Vercel IP
        const vercelIp = '76.76.21.21'
        const pointsToVercel = data.Answer.some(a => a.data === vercelIp)
        if (pointsToVercel) {
          logger.info({ domain, attempt }, 'DNS 驗證通過')
          return true
        }
      }

      if (attempt < maxAttempts) {
        logger.info({ domain, attempt, maxAttempts }, 'DNS 尚未傳播，等待重試')
        await new Promise(r => setTimeout(r, intervalMs))
      }
    } catch (err) {
      logger.warn({ domain, attempt, err: String(err) }, 'DNS 驗證查詢失敗')
      if (attempt < maxAttempts) {
        await new Promise(r => setTimeout(r, intervalMs))
      }
    }
  }

  return false
}

// ============================================================
// DB CRUD — domain_records
// ============================================================

interface DomainRecord {
  id: string
  project_id: string
  user_id: string
  domain: string
  source: string
  status: string
  porkbun_order_id: string | null
  registration_price: string | null
  expire_date: string | null
  cloudflare_zone_id: string | null
  cloudflare_nameservers: string[] | null
  vercel_project_id: string | null
  vercel_domain_verified: boolean
  completed_steps: string[]
  error_message: string | null
  created_at: string
  updated_at: string
}

export async function createDomainRecord(params: {
  projectId: string
  userId: string
  domain: string
  source: 'purchased' | 'own'
  vercelProjectId?: string
}): Promise<string> {
  const result = await db.queryOne<{ id: string }>(
    `INSERT INTO domain_records (project_id, user_id, domain, source, vercel_project_id)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (domain) DO UPDATE SET
       project_id = EXCLUDED.project_id,
       user_id = EXCLUDED.user_id,
       source = EXCLUDED.source,
       vercel_project_id = COALESCE(EXCLUDED.vercel_project_id, domain_records.vercel_project_id),
       status = 'pending',
       error_message = NULL,
       updated_at = NOW()
     RETURNING id`,
    [params.projectId, params.userId, params.domain, params.source, params.vercelProjectId || null]
  )
  if (!result) throw new Error('建立域名記錄失敗')
  return result.id
}

export async function updateDomainRecord(
  domainId: string,
  updates: Partial<Pick<DomainRecord, 'status' | 'porkbun_order_id' | 'registration_price' | 'expire_date' | 'cloudflare_zone_id' | 'cloudflare_nameservers' | 'vercel_project_id' | 'vercel_domain_verified' | 'completed_steps' | 'error_message'>>
): Promise<void> {
  const sets: string[] = ['updated_at = NOW()']
  const values: unknown[] = []
  let idx = 1

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      const dbKey = key.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`)
      sets.push(`${dbKey} = $${idx}`)
      values.push(value)
      idx++
    }
  }

  values.push(domainId)
  await db.query(
    `UPDATE domain_records SET ${sets.join(', ')} WHERE id = $${idx}`,
    values
  )
}

export async function getDomainRecord(domainId: string): Promise<DomainRecord | null> {
  return db.queryOne<DomainRecord>(
    'SELECT * FROM domain_records WHERE id = $1',
    [domainId]
  )
}

export async function listUserDomains(userId: string): Promise<DomainRecord[]> {
  const result = await db.query<DomainRecord>(
    `SELECT dr.*, p.name as project_name
     FROM domain_records dr
     LEFT JOIN projects p ON p.id = dr.project_id
     WHERE dr.user_id = $1
     ORDER BY dr.created_at DESC`,
    [userId]
  )
  return result.rows
}

/**
 * 檢查用戶域名配額
 * 只計算非失敗/非過期的域名
 */
export async function checkDomainQuota(userId: string, plan: string): Promise<{
  allowed: boolean
  current: number
  limit: number
}> {
  const { getDomainLimit } = await import('../config/plans')
  const limit = getDomainLimit(plan)
  const result = await db.queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM domain_records
     WHERE user_id = $1 AND status NOT IN ('failed', 'expired')`,
    [userId]
  )
  const current = parseInt(result?.count || '0', 10)
  return { allowed: current < limit, current, limit }
}

export async function getDomainByName(domain: string): Promise<DomainRecord | null> {
  return db.queryOne<DomainRecord>(
    'SELECT * FROM domain_records WHERE domain = $1',
    [domain]
  )
}

// ============================================================
// 購買流程（完整 workflow + 反向補償 + Socket.io 進度推送）
// ============================================================

export async function executePurchaseWorkflow(params: {
  domainId: string
  domain: string
  registrant: RegistrantInfo
  vercelProjectId: string
  conversationId: string
  projectId: string
  userId: string
  redis: Redis
  io: IoEmitter
  locale?: 'zh' | 'en'
}): Promise<void> {
  const { domainId, domain, registrant, vercelProjectId, conversationId, redis, io, locale } = params
  const isChinese = locale !== 'en'
  const completedSteps: string[] = []

  const emitProgress = (step: string, status: 'running' | 'done' | 'error', message: string) => {
    io.to(`conversation:${conversationId}`).emit('domain_progress', {
      domainId, step, status, message, completedSteps,
    })
  }

  try {
    // Step 1: 註冊域名
    emitProgress('register', 'running', isChinese ? '正在註冊域名...' : 'Registering domain...')
    await updateDomainRecord(domainId, { status: 'registering' })

    const regResult = await registerDomain(domain, registrant)
    completedSteps.push('registered')
    await updateDomainRecord(domainId, {
      status: 'registered',
      expire_date: regResult.expireDate || null,
      completed_steps: completedSteps,
    })
    emitProgress('register', 'done', isChinese ? '域名註冊成功' : 'Domain registered')

    // Step 2: 建立 Cloudflare Zone
    emitProgress('cloudflare_zone', 'running', isChinese ? '正在建立 DNS 託管...' : 'Setting up DNS hosting...')
    const zoneResult = await createCloudflareZone(domain)
    completedSteps.push('zone_created')
    await updateDomainRecord(domainId, {
      status: 'zone_created',
      cloudflare_zone_id: zoneResult.zoneId,
      cloudflare_nameservers: zoneResult.nameservers,
      completed_steps: completedSteps,
    })
    emitProgress('cloudflare_zone', 'done', isChinese ? 'DNS 託管已建立' : 'DNS hosting ready')

    // Step 3: 更新 Nameservers（Porkbun → Cloudflare）
    emitProgress('nameservers', 'running', isChinese ? '正在更新 NS 記錄...' : 'Updating nameservers...')
    await updateNameservers(domain, zoneResult.nameservers)
    completedSteps.push('ns_updated')
    await updateDomainRecord(domainId, { status: 'ns_updated', completed_steps: completedSteps })
    emitProgress('nameservers', 'done', isChinese ? 'NS 記錄已更新' : 'Nameservers updated')

    // Step 4: 設定 DNS 記錄（指向 Vercel）
    emitProgress('dns_records', 'running', isChinese ? '正在設定 DNS 記錄...' : 'Configuring DNS records...')
    await setupVercelDns(zoneResult.zoneId, domain)
    completedSteps.push('dns_configured')
    await updateDomainRecord(domainId, { status: 'dns_configured', completed_steps: completedSteps })
    emitProgress('dns_records', 'done', isChinese ? 'DNS 記錄已設定' : 'DNS records configured')

    // Step 5: 綁定到 Vercel
    emitProgress('vercel_bind', 'running', isChinese ? '正在綁定到 Vercel...' : 'Binding to Vercel...')
    const bindResult = await bindDomainToVercel(vercelProjectId, domain)
    completedSteps.push('vercel_bound')
    await updateDomainRecord(domainId, {
      status: 'vercel_bound',
      vercel_project_id: vercelProjectId,
      vercel_domain_verified: bindResult.verified,
      completed_steps: completedSteps,
    })
    emitProgress('vercel_bind', 'done', isChinese ? '已綁定到 Vercel' : 'Bound to Vercel')

    // Step 6: 等待 DNS 傳播（非阻塞，3 次 30 秒間隔）
    emitProgress('dns_verify', 'running', isChinese ? '正在驗證 DNS 傳播（可能需要幾分鐘）...' : 'Verifying DNS propagation (may take a few minutes)...')
    const dnsVerified = await verifyDnsPropagation(domain, 3, 30000)

    if (dnsVerified) {
      completedSteps.push('dns_verified')
      await updateDomainRecord(domainId, { status: 'active', completed_steps: completedSteps })
      emitProgress('dns_verify', 'done', isChinese ? 'DNS 驗證通過' : 'DNS verified')
    } else {
      // DNS 未完全傳播但流程可繼續
      completedSteps.push('dns_pending')
      await updateDomainRecord(domainId, { status: 'active', completed_steps: completedSteps })
      emitProgress('dns_verify', 'done', isChinese ? 'DNS 設定完成（傳播可能需要 24-48 小時）' : 'DNS configured (propagation may take 24-48 hours)')
    }

    // 完成 → 更新 FlowState
    const state = await getFlowState(redis, conversationId)
    if (state) {
      state.phase = 'domain_complete'
      state.waitingForReply = true
      state.domainCompletedSteps = completedSteps
      await saveFlowState(redis, conversationId, state)
    }

    await sendMessage(conversationId, io, {
      content: isChinese
        ? `🎉 域名 **${domain}** 已成功綁定！\n\n您的網站現在可以通過 https://${domain} 訪問${dnsVerified ? '' : '（DNS 傳播可能需要 24-48 小時）'}。`
        : `🎉 Domain **${domain}** is now bound!\n\nYour site is accessible at https://${domain}${dnsVerified ? '' : ' (DNS propagation may take 24-48 hours)'}.`,
      stage: 'domain_complete',
      richContent: {
        type: 'domain_complete_result',
        data: { domain, verified: dnsVerified, completedSteps } as Record<string, unknown>,
      },
      quickReplies: [
        { label: isChinese ? '開始新專案' : 'New Project', value: '__new_project__', style: 'ghost' as const },
      ],
    })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    logger.error({ domainId, domain, err: errorMsg, completedSteps }, '購買流程失敗')

    // 反向補償
    await rollbackPurchase(domainId, completedSteps, vercelProjectId, domain)

    await updateDomainRecord(domainId, {
      status: 'failed',
      error_message: errorMsg,
      completed_steps: completedSteps,
    })

    const state = await getFlowState(redis, conversationId)
    if (state) {
      state.phase = 'domain_failed'
      state.waitingForReply = true
      state.domainCompletedSteps = completedSteps
      await saveFlowState(redis, conversationId, state)
    }

    await sendMessage(conversationId, io, {
      content: isChinese
        ? `域名設定過程中發生錯誤：${errorMsg}\n\n已自動清理已完成的步驟。您可以重試或放棄。`
        : `Error during domain setup: ${errorMsg}\n\nCompleted steps have been cleaned up. You can retry or cancel.`,
      stage: 'error',
      quickReplies: [
        { label: isChinese ? '重試' : 'Retry', value: '__retry_domain__', style: 'primary' as const },
        { label: isChinese ? '放棄' : 'Cancel', value: '__cancel_domain__', style: 'ghost' as const },
      ],
    })
  }
}

// ============================================================
// 自有域名綁定流程
// ============================================================

export async function executeOwnDomainWorkflow(params: {
  domainId: string
  domain: string
  vercelProjectId: string
  conversationId: string
  redis: Redis
  io: IoEmitter
  locale?: 'zh' | 'en'
}): Promise<void> {
  const { domainId, domain, vercelProjectId, conversationId, redis, io, locale } = params
  const isChinese = locale !== 'en'

  try {
    // 綁定到 Vercel
    await bindDomainToVercel(vercelProjectId, domain)
    await updateDomainRecord(domainId, {
      status: 'vercel_bound',
      vercel_project_id: vercelProjectId,
      completed_steps: ['vercel_bound'],
    })

    // 進入 DNS 說明階段
    const state = await getFlowState(redis, conversationId)
    if (state) {
      state.phase = 'domain_own_setup'
      state.waitingForReply = true
      await saveFlowState(redis, conversationId, state)
    }

    await sendMessage(conversationId, io, {
      content: isChinese
        ? `請在您的域名管理後台設定以下 DNS 記錄：\n\n| 類型 | 名稱 | 值 |\n|------|------|----|\n| A | @ | 76.76.21.21 |\n| CNAME | www | cname.vercel-dns.com |\n\n設定完成後，請告訴我「設定好了」，我會幫您驗證。`
        : `Please add the following DNS records in your domain registrar:\n\n| Type | Name | Value |\n|------|------|-------|\n| A | @ | 76.76.21.21 |\n| CNAME | www | cname.vercel-dns.com |\n\nOnce done, tell me "done" and I'll verify.`,
      stage: 'domain_own_setup',
      richContent: {
        type: 'domain_dns_instructions',
        data: {
          domain,
          records: [
            { type: 'A', name: '@', value: '76.76.21.21' },
            { type: 'CNAME', name: 'www', value: 'cname.vercel-dns.com' },
          ],
        } as Record<string, unknown>,
      },
      quickReplies: [
        { label: isChinese ? '設定好了' : 'Done', value: isChinese ? '設定好了' : 'done', style: 'primary' as const },
        { label: isChinese ? '取消' : 'Cancel', value: '__cancel_domain__', style: 'ghost' as const },
      ],
    })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    logger.error({ domainId, domain, err: errorMsg }, '自有域名綁定失敗')

    await updateDomainRecord(domainId, { status: 'failed', error_message: errorMsg })

    const state = await getFlowState(redis, conversationId)
    if (state) {
      state.phase = 'domain_failed'
      state.waitingForReply = true
      await saveFlowState(redis, conversationId, state)
    }

    await sendMessage(conversationId, io, {
      content: isChinese
        ? `域名綁定失敗：${errorMsg}`
        : `Domain binding failed: ${errorMsg}`,
      stage: 'error',
      quickReplies: [
        { label: isChinese ? '重試' : 'Retry', value: '__retry_domain__', style: 'primary' as const },
        { label: isChinese ? '放棄' : 'Cancel', value: '__cancel_domain__', style: 'ghost' as const },
      ],
    })
  }
}

// ============================================================
// 反向補償（Rollback）
// ============================================================

async function rollbackPurchase(
  domainId: string,
  completedSteps: string[],
  vercelProjectId: string,
  domain: string
): Promise<void> {
  logger.info({ domainId, completedSteps }, '開始反向補償')

  // 域名註冊不可逆（Porkbun 不支持退款/取消），只清理後續步驟
  if (completedSteps.includes('vercel_bound')) {
    await removeDomainFromVercel(vercelProjectId, domain)
  }

  const record = await getDomainRecord(domainId)
  if (completedSteps.includes('zone_created') && record?.cloudflare_zone_id) {
    await deleteCloudflareZone(record.cloudflare_zone_id)
  }
}

// ============================================================
// 解除域名綁定（REST API 用）
// ============================================================

export async function removeDomainBinding(domainId: string): Promise<void> {
  const record = await getDomainRecord(domainId)
  if (!record) throw new Error('域名記錄不存在')

  // 移除 Vercel 綁定
  if (record.vercel_project_id) {
    await removeDomainFromVercel(record.vercel_project_id, record.domain)
  }

  // 刪除 Cloudflare Zone
  if (record.cloudflare_zone_id) {
    await deleteCloudflareZone(record.cloudflare_zone_id)
  }

  // 更新狀態
  await updateDomainRecord(domainId, { status: 'expired' })
}
