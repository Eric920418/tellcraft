'use server'

import { checkDomainAvailability, registerDomain, updateNameservers } from './porkbun'
import { createZone, setupVercelDns } from './cloudflare'
import { createVercelProject, deployFiles } from './vercel'

// 網域生命週期狀態
export type DomainStatus =
  | 'searching'           // 搜尋網域中
  | 'available'           // 網域可用，待註冊
  | 'unavailable'         // 網域不可用
  | 'registering'         // 註冊網域中
  | 'creating_zone'       // 建立 Cloudflare Zone 中
  | 'setting_ns'          // 設定 Nameserver 中
  | 'waiting_dns'         // 等待 DNS 傳播
  | 'creating_project'    // 建立 Vercel Project 中
  | 'deploying'           // 部署程式碼中
  | 'setting_domain'      // 設定 Vercel Domain 中
  | 'verifying'           // 驗證 Domain 中
  | 'active'              // 完成，網站已上線
  | 'error'               // 錯誤

export interface DomainWorkflow {
  status: DomainStatus
  domain: string
  message: string
  progress: number  // 0-100

  // 各階段產出
  porkbunDomain?: string
  cloudflareZoneId?: string
  cloudflareNameservers?: string[]
  vercelProjectId?: string
  vercelDeploymentUrl?: string
  supabaseProjectId?: string
  supabaseUrl?: string

  error?: string
}

// 搜尋網域可用性
export async function searchDomain(domain: string): Promise<DomainWorkflow> {
  const result = await checkDomainAvailability(domain)

  if (!result.success) {
    return {
      status: 'error',
      domain,
      message: result.error || '查詢失敗',
      progress: 0,
      error: result.error,
    }
  }

  if (result.available) {
    return {
      status: 'available',
      domain,
      message: `網域可用，價格：${result.price}/年`,
      progress: 10,
    }
  } else {
    return {
      status: 'unavailable',
      domain,
      message: '網域已被註冊',
      progress: 0,
    }
  }
}

// 完整的網域註冊 + 部署流程
export async function fullDomainWorkflow(
  domain: string,
  projectName: string,
  registrant: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    postalCode: string
    country: string
  },
  files: Array<{ file: string; data: string }>,
  onProgress?: (workflow: DomainWorkflow) => void
): Promise<DomainWorkflow> {

  const report = (workflow: DomainWorkflow) => {
    console.log(`[Domain Workflow] ${workflow.status}: ${workflow.message}`)
    onProgress?.(workflow)
    return workflow
  }

  // Step 1: 註冊網域
  report({
    status: 'registering',
    domain,
    message: '正在註冊網域...',
    progress: 15,
  })

  const registerResult = await registerDomain(domain, 1, registrant)

  if (!registerResult.success) {
    return report({
      status: 'error',
      domain,
      message: registerResult.error || '網域註冊失敗',
      progress: 15,
      error: registerResult.error,
    })
  }

  // Step 2: 建立 Cloudflare Zone
  report({
    status: 'creating_zone',
    domain,
    message: '正在建立 DNS 託管...',
    progress: 30,
    porkbunDomain: registerResult.domain,
  })

  const zoneResult = await createZone(domain)

  if (!zoneResult.success) {
    return report({
      status: 'error',
      domain,
      message: zoneResult.error || '建立 DNS Zone 失敗',
      progress: 30,
      porkbunDomain: registerResult.domain,
      error: zoneResult.error,
    })
  }

  const zoneId = zoneResult.zone!.id
  const nameservers = zoneResult.nameservers!

  // Step 3: 更新 Nameserver
  report({
    status: 'setting_ns',
    domain,
    message: '正在設定 Nameserver...',
    progress: 40,
    porkbunDomain: registerResult.domain,
    cloudflareZoneId: zoneId,
    cloudflareNameservers: nameservers,
  })

  const nsResult = await updateNameservers(domain, nameservers)

  if (!nsResult.success) {
    return report({
      status: 'error',
      domain,
      message: nsResult.error || '設定 Nameserver 失敗',
      progress: 40,
      porkbunDomain: registerResult.domain,
      cloudflareZoneId: zoneId,
      cloudflareNameservers: nameservers,
      error: nsResult.error,
    })
  }

  // Step 4: 建立 Vercel Project
  report({
    status: 'creating_project',
    domain,
    message: '正在建立部署環境...',
    progress: 50,
    porkbunDomain: registerResult.domain,
    cloudflareZoneId: zoneId,
    cloudflareNameservers: nameservers,
  })

  const projectSlug = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30)
  const vercelResult = await createVercelProject(projectSlug)

  if (!vercelResult.success) {
    return report({
      status: 'error',
      domain,
      message: vercelResult.error || '建立 Vercel Project 失敗',
      progress: 50,
      porkbunDomain: registerResult.domain,
      cloudflareZoneId: zoneId,
      cloudflareNameservers: nameservers,
      error: vercelResult.error,
    })
  }

  const vercelProjectId = vercelResult.project!.id

  // Step 5: 部署程式碼
  report({
    status: 'deploying',
    domain,
    message: '正在部署程式碼...',
    progress: 60,
    porkbunDomain: registerResult.domain,
    cloudflareZoneId: zoneId,
    cloudflareNameservers: nameservers,
    vercelProjectId,
  })

  const deployResult = await deployFiles(projectSlug, files)

  if (!deployResult.success) {
    return report({
      status: 'error',
      domain,
      message: deployResult.error || '部署失敗',
      progress: 60,
      porkbunDomain: registerResult.domain,
      cloudflareZoneId: zoneId,
      cloudflareNameservers: nameservers,
      vercelProjectId,
      error: deployResult.error,
    })
  }

  // Step 6: 綁定自訂網域到 Vercel
  report({
    status: 'setting_domain',
    domain,
    message: '正在綁定自訂網域...',
    progress: 75,
    porkbunDomain: registerResult.domain,
    cloudflareZoneId: zoneId,
    cloudflareNameservers: nameservers,
    vercelProjectId,
    vercelDeploymentUrl: deployResult.url,
  })

  const domainBindResult = await addDomainToVercel(vercelProjectId, domain)

  if (!domainBindResult.success) {
    // 網域綁定失敗不算致命錯誤，用戶可以之後手動綁定
    console.warn('綁定網域失敗:', domainBindResult.error)
  }

  // Step 7: 設定 DNS 指向 Vercel
  report({
    status: 'verifying',
    domain,
    message: '正在設定 DNS 記錄...',
    progress: 85,
    porkbunDomain: registerResult.domain,
    cloudflareZoneId: zoneId,
    cloudflareNameservers: nameservers,
    vercelProjectId,
    vercelDeploymentUrl: deployResult.url,
  })

  // 設定 Vercel 所需的 DNS 記錄
  // Apex domain (example.com) → A record → 76.76.21.21
  // www.example.com → CNAME → cname.vercel-dns.com
  const dnsResult = await setupVercelDns(zoneId, domain, [
    { type: 'A', name: '@', value: '76.76.21.21' },
    { type: 'CNAME', name: 'www', value: 'cname.vercel-dns.com' },
  ])

  if (!dnsResult.success) {
    console.warn('設定 DNS 記錄失敗:', dnsResult.error)
  }

  // 完成
  return report({
    status: 'active',
    domain,
    message: `網站已上線！網址：https://${domain}`,
    progress: 100,
    porkbunDomain: registerResult.domain,
    cloudflareZoneId: zoneId,
    cloudflareNameservers: nameservers,
    vercelProjectId,
    vercelDeploymentUrl: deployResult.url,
  })
}

// 綁定網域到 Vercel Project
async function addDomainToVercel(projectId: string, domain: string): Promise<{
  success: boolean
  verification?: Array<{ type: string; domain: string; value: string }>
  error?: string
}> {
  const token = process.env.VERCEL_ACCESS_TOKEN
  const teamId = process.env.VERCEL_TEAM_ID

  if (!token) {
    return { success: false, error: '缺少 Vercel 認證配置' }
  }

  try {
    const params = new URLSearchParams()
    if (teamId) params.append('teamId', teamId)

    const response = await fetch(
      `https://api.vercel.com/v10/projects/${projectId}/domains?${params}`,
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
      verification?: Array<{ type: string; domain: string; value: string }>
      error?: { message: string }
    }

    if (data.error) {
      return { success: false, error: data.error.message }
    }

    return {
      success: true,
      verification: data.verification,
    }
  } catch (err) {
    return { success: false, error: `綁定網域時發生錯誤: ${err}` }
  }
}

// 使用免費網域（跳過網域購買步驟）
export async function deployWithFreeDomain(
  projectName: string,
  files: Array<{ file: string; data: string }>,
): Promise<DomainWorkflow> {
  const projectSlug = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30)
  const freeDomain = `${projectSlug}.vercel.app`

  console.log('[Deploy] 使用免費網域:', freeDomain)

  // Step 1: 建立 Vercel Project
  const vercelResult = await createVercelProject(projectSlug)

  if (!vercelResult.success) {
    return {
      status: 'error',
      domain: freeDomain,
      message: vercelResult.error || '建立 Vercel Project 失敗',
      progress: 30,
      error: vercelResult.error,
    }
  }

  // Step 2: 部署程式碼
  const deployResult = await deployFiles(projectSlug, files)

  if (!deployResult.success) {
    return {
      status: 'error',
      domain: freeDomain,
      message: deployResult.error || '部署失敗',
      progress: 60,
      vercelProjectId: vercelResult.project?.id,
      error: deployResult.error,
    }
  }

  return {
    status: 'active',
    domain: freeDomain,
    message: `網站已上線！網址：https://${freeDomain}`,
    progress: 100,
    vercelProjectId: vercelResult.project?.id,
    vercelDeploymentUrl: deployResult.url,
  }
}

// 使用自有網域（用戶已有網域，只需設定 DNS）
export async function deployWithOwnDomain(
  domain: string,
  projectName: string,
  files: Array<{ file: string; data: string }>,
): Promise<DomainWorkflow & { dnsInstructions?: string }> {
  const projectSlug = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30)

  console.log('[Deploy] 使用自有網域:', domain)

  // Step 1: 建立 Vercel Project
  const vercelResult = await createVercelProject(projectSlug)

  if (!vercelResult.success) {
    return {
      status: 'error',
      domain,
      message: vercelResult.error || '建立 Vercel Project 失敗',
      progress: 30,
      error: vercelResult.error,
    }
  }

  // Step 2: 部署程式碼
  const deployResult = await deployFiles(projectSlug, files)

  if (!deployResult.success) {
    return {
      status: 'error',
      domain,
      message: deployResult.error || '部署失敗',
      progress: 60,
      vercelProjectId: vercelResult.project?.id,
      error: deployResult.error,
    }
  }

  // Step 3: 綁定網域
  await addDomainToVercel(vercelResult.project!.id, domain)

  // 生成 DNS 設定說明
  const dnsInstructions = `
請在你的 DNS 管理介面設定以下記錄：

1. A 記錄
   主機名稱：@ (或留空)
   指向：76.76.21.21

2. CNAME 記錄
   主機名稱：www
   指向：cname.vercel-dns.com

設定完成後，DNS 傳播可能需要 24-48 小時。
`.trim()

  return {
    status: 'active',
    domain,
    message: `網站已部署！請依照說明設定 DNS。`,
    progress: 100,
    vercelProjectId: vercelResult.project?.id,
    vercelDeploymentUrl: deployResult.url,
    dnsInstructions,
  }
}
