'use server'

const VERCEL_API = 'https://api.vercel.com'

interface VercelProject {
  id: string
  name: string
  accountId: string
  framework: string | null
  latestDeployments?: Array<{
    id: string
    url: string
    state: string
  }>
}

interface VercelDeployment {
  id: string
  url: string
  state: string
  readyState: string
}

// 建立新的 Vercel Project
export async function createVercelProject(name: string, framework: string = 'nextjs'): Promise<{
  success: boolean
  project?: VercelProject
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

    const response = await fetch(`${VERCEL_API}/v10/projects?${params}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name,
        framework: framework,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `建立 Vercel Project 失敗: ${error}` }
    }

    const project = await response.json() as VercelProject
    return { success: true, project }
  } catch (err) {
    return { success: false, error: `建立 Vercel Project 時發生錯誤: ${err}` }
  }
}

// 設定環境變數
export async function setEnvironmentVariables(
  projectId: string,
  envVars: Array<{ key: string; value: string; target: ('production' | 'preview' | 'development')[] }>
): Promise<{
  success: boolean
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

    const response = await fetch(`${VERCEL_API}/v10/projects/${projectId}/env?${params}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(envVars),
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `設定環境變數失敗: ${error}` }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: `設定環境變數時發生錯誤: ${err}` }
  }
}

// 從 GitHub 部署
export async function deployFromGitHub(
  projectId: string,
  repoUrl: string,
  branch: string = 'main'
): Promise<{
  success: boolean
  deployment?: VercelDeployment
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

    // 解析 GitHub URL
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!match) {
      return { success: false, error: '無效的 GitHub URL' }
    }

    const [, owner, repo] = match

    const response = await fetch(`${VERCEL_API}/v13/deployments?${params}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: projectId,
        project: projectId,
        gitSource: {
          type: 'github',
          repoId: `${owner}/${repo.replace('.git', '')}`,
          ref: branch,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `部署失敗: ${error}` }
    }

    const deployment = await response.json() as VercelDeployment
    return { success: true, deployment }
  } catch (err) {
    return { success: false, error: `部署時發生錯誤: ${err}` }
  }
}

// 從檔案內容部署（直接上傳程式碼）
export async function deployFiles(
  projectName: string,
  files: Array<{ file: string; data: string }>
): Promise<{
  success: boolean
  deployment?: VercelDeployment
  url?: string
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

    // 轉換檔案格式
    const vercelFiles = files.map(f => ({
      file: f.file,
      data: Buffer.from(f.data).toString('base64'),
      encoding: 'base64',
    }))

    const response = await fetch(`${VERCEL_API}/v13/deployments?${params}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: projectName,
        files: vercelFiles,
        projectSettings: {
          framework: 'nextjs',
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `部署失敗: ${error}` }
    }

    const deployment = await response.json() as VercelDeployment

    // 等待部署完成
    const readyDeployment = await waitForDeploymentReady(deployment.id)

    return {
      success: true,
      deployment: readyDeployment || deployment,
      url: `https://${deployment.url}`,
    }
  } catch (err) {
    return { success: false, error: `部署時發生錯誤: ${err}` }
  }
}

// 等待部署完成
async function waitForDeploymentReady(deploymentId: string, maxWaitMs = 300000): Promise<VercelDeployment | null> {
  const token = process.env.VERCEL_ACCESS_TOKEN
  const teamId = process.env.VERCEL_TEAM_ID
  const startTime = Date.now()
  const pollInterval = 5000 // 每 5 秒檢查一次

  const params = new URLSearchParams()
  if (teamId) params.append('teamId', teamId)

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const response = await fetch(`${VERCEL_API}/v13/deployments/${deploymentId}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const deployment = await response.json() as VercelDeployment
        if (deployment.readyState === 'READY') {
          return deployment
        }
        if (deployment.readyState === 'ERROR' || deployment.readyState === 'CANCELED') {
          return null
        }
      }
    } catch {
      // 忽略錯誤，繼續等待
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval))
  }

  return null
}

// 列出所有 Projects
export async function listVercelProjects(): Promise<{
  success: boolean
  projects?: VercelProject[]
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
    params.append('limit', '100')

    const response = await fetch(`${VERCEL_API}/v9/projects?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `列出 Projects 失敗: ${error}` }
    }

    const data = await response.json() as { projects: VercelProject[] }
    return { success: true, projects: data.projects }
  } catch (err) {
    return { success: false, error: `列出 Projects 時發生錯誤: ${err}` }
  }
}

// 取得 Project 資訊
export async function getVercelProject(projectId: string): Promise<{
  success: boolean
  project?: VercelProject
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

    const response = await fetch(`${VERCEL_API}/v9/projects/${projectId}?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `取得 Project 失敗: ${error}` }
    }

    const project = await response.json() as VercelProject
    return { success: true, project }
  } catch (err) {
    return { success: false, error: `取得 Project 時發生錯誤: ${err}` }
  }
}
