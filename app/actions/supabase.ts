'use server'

const SUPABASE_API = 'https://api.supabase.com/v1'

interface SupabaseProject {
  id: string
  name: string
  organization_id: string
  region: string
  status: string
  database: {
    host: string
    version: string
  }
}

interface CreateProjectResponse {
  id: string
  name: string
  organization_id: string
  region: string
  status: string
}

// 建立新的 Supabase Project
export async function createSupabaseProject(name: string): Promise<{
  success: boolean
  project?: SupabaseProject
  error?: string
}> {
  const token = process.env.SUPABASE_ACCESS_TOKEN
  const orgId = process.env.SUPABASE_ORG_ID

  if (!token || !orgId) {
    return { success: false, error: '缺少 Supabase 認證配置' }
  }

  try {
    // 生成隨機密碼
    const dbPassword = generatePassword()

    const response = await fetch(`${SUPABASE_API}/projects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name,
        organization_id: orgId,
        region: 'ap-northeast-1', // 東京，離台灣最近
        plan: 'free',
        db_pass: dbPassword,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `建立 Supabase Project 失敗: ${error}` }
    }

    const project = await response.json() as CreateProjectResponse

    // 等待 Project 準備完成
    const readyProject = await waitForProjectReady(project.id)

    if (!readyProject) {
      return { success: false, error: 'Supabase Project 建立超時' }
    }

    return { success: true, project: readyProject }
  } catch (err) {
    return { success: false, error: `建立 Supabase Project 時發生錯誤: ${err}` }
  }
}

// 等待 Project 準備完成
async function waitForProjectReady(projectId: string, maxWaitMs = 120000): Promise<SupabaseProject | null> {
  const token = process.env.SUPABASE_ACCESS_TOKEN
  const startTime = Date.now()
  const pollInterval = 5000 // 每 5 秒檢查一次

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const response = await fetch(`${SUPABASE_API}/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const project = await response.json() as SupabaseProject
        if (project.status === 'ACTIVE_HEALTHY') {
          return project
        }
      }
    } catch {
      // 忽略錯誤，繼續等待
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval))
  }

  return null
}

// 執行 SQL Migration
export async function runMigration(projectId: string, sql: string): Promise<{
  success: boolean
  error?: string
}> {
  const token = process.env.SUPABASE_ACCESS_TOKEN

  if (!token) {
    return { success: false, error: '缺少 Supabase 認證配置' }
  }

  try {
    // 使用 Supabase Management API 執行 SQL
    const response = await fetch(`${SUPABASE_API}/projects/${projectId}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: sql,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `執行 Migration 失敗: ${error}` }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: `執行 Migration 時發生錯誤: ${err}` }
  }
}

// 取得 Project 的連線資訊
export async function getProjectConfig(projectId: string): Promise<{
  success: boolean
  config?: {
    url: string
    anonKey: string
  }
  error?: string
}> {
  const token = process.env.SUPABASE_ACCESS_TOKEN

  if (!token) {
    return { success: false, error: '缺少 Supabase 認證配置' }
  }

  try {
    // 取得 API Keys
    const keysResponse = await fetch(`${SUPABASE_API}/projects/${projectId}/api-keys`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!keysResponse.ok) {
      const error = await keysResponse.text()
      return { success: false, error: `取得 API Keys 失敗: ${error}` }
    }

    const keys = await keysResponse.json() as Array<{ name: string; api_key: string }>
    const anonKey = keys.find(k => k.name === 'anon')?.api_key

    if (!anonKey) {
      return { success: false, error: '找不到 anon key' }
    }

    return {
      success: true,
      config: {
        url: `https://${projectId}.supabase.co`,
        anonKey,
      },
    }
  } catch (err) {
    return { success: false, error: `取得 Project 配置時發生錯誤: ${err}` }
  }
}

// 列出所有 Projects
export async function listProjects(): Promise<{
  success: boolean
  projects?: SupabaseProject[]
  error?: string
}> {
  const token = process.env.SUPABASE_ACCESS_TOKEN

  if (!token) {
    return { success: false, error: '缺少 Supabase 認證配置' }
  }

  try {
    const response = await fetch(`${SUPABASE_API}/projects`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `列出 Projects 失敗: ${error}` }
    }

    const projects = await response.json() as SupabaseProject[]
    return { success: true, projects }
  } catch (err) {
    return { success: false, error: `列出 Projects 時發生錯誤: ${err}` }
  }
}

// 生成隨機密碼
function generatePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 24; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}
