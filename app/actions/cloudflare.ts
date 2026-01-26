'use server'

const CLOUDFLARE_API = 'https://api.cloudflare.com/client/v4'

interface Zone {
  id: string
  name: string
  status: string
  name_servers: string[]
}

interface DnsRecord {
  id: string
  type: string
  name: string
  content: string
  ttl: number
  proxied: boolean
}

// 建立新的 Zone（加入網域到 Cloudflare）
export async function createZone(domain: string): Promise<{
  success: boolean
  zone?: Zone
  nameservers?: string[]
  error?: string
}> {
  const token = process.env.CLOUDFLARE_API_TOKEN
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID

  if (!token || !accountId) {
    return { success: false, error: '缺少 Cloudflare 認證配置' }
  }

  try {
    const response = await fetch(`${CLOUDFLARE_API}/zones`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: domain,
        account: { id: accountId },
        type: 'full', // 完整 DNS 託管
      }),
    })

    const data = await response.json() as { success: boolean; result?: Zone; errors?: Array<{ message: string }> }

    if (!data.success) {
      const errorMsg = data.errors?.[0]?.message || '建立 Zone 失敗'
      return { success: false, error: errorMsg }
    }

    return {
      success: true,
      zone: data.result,
      nameservers: data.result?.name_servers,
    }
  } catch (err) {
    return { success: false, error: `建立 Zone 時發生錯誤: ${err}` }
  }
}

// 取得 Zone 資訊
export async function getZone(zoneId: string): Promise<{
  success: boolean
  zone?: Zone
  error?: string
}> {
  const token = process.env.CLOUDFLARE_API_TOKEN

  if (!token) {
    return { success: false, error: '缺少 Cloudflare 認證配置' }
  }

  try {
    const response = await fetch(`${CLOUDFLARE_API}/zones/${zoneId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    const data = await response.json() as { success: boolean; result?: Zone; errors?: Array<{ message: string }> }

    if (!data.success) {
      return { success: false, error: data.errors?.[0]?.message || '取得 Zone 失敗' }
    }

    return { success: true, zone: data.result }
  } catch (err) {
    return { success: false, error: `取得 Zone 時發生錯誤: ${err}` }
  }
}

// 根據網域名稱查找 Zone
export async function getZoneByName(domain: string): Promise<{
  success: boolean
  zone?: Zone
  error?: string
}> {
  const token = process.env.CLOUDFLARE_API_TOKEN

  if (!token) {
    return { success: false, error: '缺少 Cloudflare 認證配置' }
  }

  try {
    const response = await fetch(`${CLOUDFLARE_API}/zones?name=${encodeURIComponent(domain)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    const data = await response.json() as { success: boolean; result?: Zone[]; errors?: Array<{ message: string }> }

    if (!data.success) {
      return { success: false, error: data.errors?.[0]?.message || '查詢 Zone 失敗' }
    }

    if (!data.result || data.result.length === 0) {
      return { success: false, error: '找不到該網域' }
    }

    return { success: true, zone: data.result[0] }
  } catch (err) {
    return { success: false, error: `查詢 Zone 時發生錯誤: ${err}` }
  }
}

// 新增 DNS 記錄
export async function createDnsRecord(
  zoneId: string,
  record: {
    type: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX'
    name: string
    content: string
    ttl?: number
    proxied?: boolean
  }
): Promise<{
  success: boolean
  record?: DnsRecord
  error?: string
}> {
  const token = process.env.CLOUDFLARE_API_TOKEN

  if (!token) {
    return { success: false, error: '缺少 Cloudflare 認證配置' }
  }

  try {
    const response = await fetch(`${CLOUDFLARE_API}/zones/${zoneId}/dns_records`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: record.type,
        name: record.name,
        content: record.content,
        ttl: record.ttl || 1, // 1 = auto
        proxied: record.proxied ?? false,
      }),
    })

    const data = await response.json() as { success: boolean; result?: DnsRecord; errors?: Array<{ message: string }> }

    if (!data.success) {
      return { success: false, error: data.errors?.[0]?.message || '新增 DNS 記錄失敗' }
    }

    return { success: true, record: data.result }
  } catch (err) {
    return { success: false, error: `新增 DNS 記錄時發生錯誤: ${err}` }
  }
}

// 列出 DNS 記錄
export async function listDnsRecords(zoneId: string): Promise<{
  success: boolean
  records?: DnsRecord[]
  error?: string
}> {
  const token = process.env.CLOUDFLARE_API_TOKEN

  if (!token) {
    return { success: false, error: '缺少 Cloudflare 認證配置' }
  }

  try {
    const response = await fetch(`${CLOUDFLARE_API}/zones/${zoneId}/dns_records?per_page=100`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    const data = await response.json() as { success: boolean; result?: DnsRecord[]; errors?: Array<{ message: string }> }

    if (!data.success) {
      return { success: false, error: data.errors?.[0]?.message || '列出 DNS 記錄失敗' }
    }

    return { success: true, records: data.result }
  } catch (err) {
    return { success: false, error: `列出 DNS 記錄時發生錯誤: ${err}` }
  }
}

// 刪除 DNS 記錄
export async function deleteDnsRecord(zoneId: string, recordId: string): Promise<{
  success: boolean
  error?: string
}> {
  const token = process.env.CLOUDFLARE_API_TOKEN

  if (!token) {
    return { success: false, error: '缺少 Cloudflare 認證配置' }
  }

  try {
    const response = await fetch(`${CLOUDFLARE_API}/zones/${zoneId}/dns_records/${recordId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    const data = await response.json() as { success: boolean; errors?: Array<{ message: string }> }

    if (!data.success) {
      return { success: false, error: data.errors?.[0]?.message || '刪除 DNS 記錄失敗' }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: `刪除 DNS 記錄時發生錯誤: ${err}` }
  }
}

// 設定 Vercel 所需的 DNS 記錄
export async function setupVercelDns(
  zoneId: string,
  domain: string,
  vercelRecords: Array<{ type: string; name: string; value: string }>
): Promise<{
  success: boolean
  error?: string
}> {
  const token = process.env.CLOUDFLARE_API_TOKEN

  if (!token) {
    return { success: false, error: '缺少 Cloudflare 認證配置' }
  }

  try {
    for (const record of vercelRecords) {
      const result = await createDnsRecord(zoneId, {
        type: record.type as 'A' | 'CNAME' | 'TXT',
        name: record.name === '@' ? domain : `${record.name}.${domain}`,
        content: record.value,
        proxied: false, // Vercel 需要直接指向，不能用 Cloudflare proxy
      })

      if (!result.success) {
        return { success: false, error: `設定 ${record.type} 記錄失敗: ${result.error}` }
      }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: `設定 Vercel DNS 時發生錯誤: ${err}` }
  }
}

// 列出所有 Zones
export async function listZones(): Promise<{
  success: boolean
  zones?: Zone[]
  error?: string
}> {
  const token = process.env.CLOUDFLARE_API_TOKEN

  if (!token) {
    return { success: false, error: '缺少 Cloudflare 認證配置' }
  }

  try {
    const response = await fetch(`${CLOUDFLARE_API}/zones?per_page=50`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    const data = await response.json() as { success: boolean; result?: Zone[]; errors?: Array<{ message: string }> }

    if (!data.success) {
      return { success: false, error: data.errors?.[0]?.message || '列出 Zones 失敗' }
    }

    return { success: true, zones: data.result }
  } catch (err) {
    return { success: false, error: `列出 Zones 時發生錯誤: ${err}` }
  }
}
