'use server'

const PORKBUN_API = 'https://api.porkbun.com/api/json/v3'

// 帶超時的 fetch
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 5000): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(timeoutId)
    return response
  } catch (err) {
    clearTimeout(timeoutId)
    throw err
  }
}

// 測試 API 連接
export async function pingPorkbun(): Promise<{
  success: boolean
  message?: string
  yourIp?: string
  error?: string
}> {
  const apiKey = process.env.PORKBUN_API_KEY
  const secretKey = process.env.PORKBUN_SECRET_KEY

  if (!apiKey || !secretKey) {
    return { success: false, error: '缺少 Porkbun API 認證配置' }
  }

  try {
    const response = await fetchWithTimeout(`${PORKBUN_API}/ping`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apikey: apiKey,
        secretapikey: secretKey,
      }),
    }, 5000)

    const data = await response.json() as {
      status: string
      yourIp?: string
      message?: string
    }

    if (data.status === 'SUCCESS') {
      return {
        success: true,
        message: 'Porkbun API 連接成功',
        yourIp: data.yourIp,
      }
    } else {
      return {
        success: false,
        error: data.message || `API 返回狀態: ${data.status}`,
      }
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { success: false, error: '連接超時（5秒）- 你的網路可能無法連接 Porkbun' }
    }
    return { success: false, error: `連接 Porkbun API 時發生錯誤: ${err}` }
  }
}

interface DomainPricing {
  registration: string
  renewal: string
  transfer: string
}

interface DomainInfo {
  domain: string
  status: string
  createDate: string
  expireDate: string
  securityLock: string
  autoRenew: number
  notLocal: number
}

// 備用價格表（當 Porkbun API 不可用時使用）
const FALLBACK_PRICING: Record<string, string> = {
  'com': '9.73',
  'net': '10.73',
  'org': '9.73',
  'io': '33.73',
  'ai': '26.18',
  'dev': '12.18',
  'app': '12.18',
  'co': '23.73',
}

// 檢查網域是否可註冊
// 注意：Porkbun 沒有提供網域查詢 API，改用 DNS 查詢判斷
export async function checkDomainAvailability(domain: string): Promise<{
  success: boolean
  available?: boolean
  price?: string
  error?: string
}> {
  try {
    // 使用 Google DNS API 檢查網域是否存在
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const dnsResponse = await fetch(
      `https://dns.google/resolve?name=${domain}&type=A`,
      { signal: controller.signal }
    )
    clearTimeout(timeoutId)

    const dnsData = await dnsResponse.json() as { Status: number; Answer?: unknown[] }

    // Status 3 = NXDOMAIN (網域不存在)
    // Status 0 = NOERROR (網域存在，有記錄)
    const isAvailable = dnsData.Status === 3 || !dnsData.Answer || dnsData.Answer.length === 0

    // 獲取價格（使用備用價格表，避免等待 Porkbun API）
    let price: string | undefined
    const tld = domain.split('.').pop()?.toLowerCase()

    if (tld && FALLBACK_PRICING[tld]) {
      price = `$${FALLBACK_PRICING[tld]}`
    }

    return {
      success: true,
      available: isAvailable,
      price: isAvailable ? price : undefined,
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { success: false, error: '查詢超時，請稍後再試' }
    }
    return { success: false, error: `查詢網域時發生錯誤: ${err}` }
  }
}

// 註冊網域
export async function registerDomain(
  domain: string,
  years: number = 1,
  registrant: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    postalCode: string
    country: string // ISO 3166-1 alpha-2 (e.g., "TW")
  }
): Promise<{
  success: boolean
  domain?: string
  expireDate?: string
  error?: string
}> {
  const apiKey = process.env.PORKBUN_API_KEY
  const secretKey = process.env.PORKBUN_SECRET_KEY

  if (!apiKey || !secretKey) {
    // Mock 模式
    console.log('[Porkbun] Mock 模式 - 模擬網域註冊:', domain)
    return {
      success: true,
      domain: domain,
      expireDate: new Date(Date.now() + years * 365 * 24 * 60 * 60 * 1000).toISOString(),
    }
  }

  try {
    const response = await fetch(`${PORKBUN_API}/domain/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apikey: apiKey,
        secretapikey: secretKey,
        domain: domain,
        years: years,
        ...registrant,
      }),
    })

    const data = await response.json() as {
      status: string
      domain?: string
      expireDate?: string
      message?: string
    }

    if (data.status !== 'SUCCESS') {
      return { success: false, error: data.message || '註冊失敗' }
    }

    return {
      success: true,
      domain: data.domain,
      expireDate: data.expireDate,
    }
  } catch (err) {
    return { success: false, error: `註冊網域時發生錯誤: ${err}` }
  }
}

// 更新 Nameserver
export async function updateNameservers(
  domain: string,
  nameservers: string[]
): Promise<{
  success: boolean
  error?: string
}> {
  const apiKey = process.env.PORKBUN_API_KEY
  const secretKey = process.env.PORKBUN_SECRET_KEY

  if (!apiKey || !secretKey) {
    // Mock 模式
    console.log('[Porkbun] Mock 模式 - 更新 NS:', domain, nameservers)
    return { success: true }
  }

  try {
    const response = await fetch(`${PORKBUN_API}/domain/updateNs/${domain}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apikey: apiKey,
        secretapikey: secretKey,
        ns: nameservers,
      }),
    })

    const data = await response.json() as {
      status: string
      message?: string
    }

    if (data.status !== 'SUCCESS') {
      return { success: false, error: data.message || '更新 Nameserver 失敗' }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: `更新 Nameserver 時發生錯誤: ${err}` }
  }
}

// 取得網域資訊
export async function getDomainInfo(domain: string): Promise<{
  success: boolean
  info?: DomainInfo
  error?: string
}> {
  const apiKey = process.env.PORKBUN_API_KEY
  const secretKey = process.env.PORKBUN_SECRET_KEY

  if (!apiKey || !secretKey) {
    // Mock 模式
    return {
      success: true,
      info: {
        domain: domain,
        status: 'ACTIVE',
        createDate: new Date().toISOString(),
        expireDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        securityLock: 'locked',
        autoRenew: 1,
        notLocal: 0,
      },
    }
  }

  try {
    const response = await fetch(`${PORKBUN_API}/domain/getDomainInfo/${domain}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apikey: apiKey,
        secretapikey: secretKey,
      }),
    })

    const data = await response.json() as {
      status: string
      domain?: DomainInfo
      message?: string
    }

    if (data.status !== 'SUCCESS') {
      return { success: false, error: data.message || '取得網域資訊失敗' }
    }

    return { success: true, info: data.domain }
  } catch (err) {
    return { success: false, error: `取得網域資訊時發生錯誤: ${err}` }
  }
}

// 列出所有網域
export async function listDomains(): Promise<{
  success: boolean
  domains?: DomainInfo[]
  error?: string
}> {
  const apiKey = process.env.PORKBUN_API_KEY
  const secretKey = process.env.PORKBUN_SECRET_KEY

  if (!apiKey || !secretKey) {
    // Mock 模式
    return { success: true, domains: [] }
  }

  try {
    const response = await fetch(`${PORKBUN_API}/domain/listAll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apikey: apiKey,
        secretapikey: secretKey,
      }),
    })

    const data = await response.json() as {
      status: string
      domains?: DomainInfo[]
      message?: string
    }

    if (data.status !== 'SUCCESS') {
      return { success: false, error: data.message || '列出網域失敗' }
    }

    return { success: true, domains: data.domains }
  } catch (err) {
    return { success: false, error: `列出網域時發生錯誤: ${err}` }
  }
}

// 取得網域價格
export async function getDomainPricing(): Promise<{
  success: boolean
  pricing?: Record<string, DomainPricing>
  error?: string
  source?: 'api' | 'fallback'
}> {
  const apiKey = process.env.PORKBUN_API_KEY
  const secretKey = process.env.PORKBUN_SECRET_KEY

  // 備用價格表
  const fallbackPricing: Record<string, DomainPricing> = {
    'com': { registration: '9.73', renewal: '9.73', transfer: '9.73' },
    'net': { registration: '10.73', renewal: '10.73', transfer: '10.73' },
    'org': { registration: '9.73', renewal: '9.73', transfer: '9.73' },
    'io': { registration: '33.73', renewal: '33.73', transfer: '33.73' },
    'ai': { registration: '26.18', renewal: '73.18', transfer: '73.18' },
    'dev': { registration: '12.18', renewal: '12.18', transfer: '12.18' },
    'app': { registration: '12.18', renewal: '12.18', transfer: '12.18' },
    'co': { registration: '23.73', renewal: '23.73', transfer: '23.73' },
  }

  if (!apiKey || !secretKey) {
    return { success: true, pricing: fallbackPricing, source: 'fallback' }
  }

  try {
    const response = await fetchWithTimeout(`${PORKBUN_API}/pricing/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apikey: apiKey,
        secretapikey: secretKey,
      }),
    }, 5000)

    const data = await response.json() as {
      status: string
      pricing?: Record<string, DomainPricing>
      message?: string
    }

    if (data.status !== 'SUCCESS') {
      // API 失敗，返回備用價格
      return { success: true, pricing: fallbackPricing, source: 'fallback' }
    }

    return { success: true, pricing: data.pricing, source: 'api' }
  } catch (err) {
    // 超時或錯誤，返回備用價格
    console.warn('[Porkbun] API 不可用，使用備用價格:', err)
    return { success: true, pricing: fallbackPricing, source: 'fallback' }
  }
}
