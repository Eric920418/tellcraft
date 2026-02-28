// @deprecated — 部署邏輯已移至 VPS 後端 tellcraft-backend/src/services/deployer.ts
// 此檔案暫保留以避免影響其他引用，後續清理時可刪除
'use server'

import { createSupabaseProject, runMigration, getProjectConfig } from './supabase'
import { createVercelProject, setEnvironmentVariables, deployFiles } from './vercel'

export interface DeploymentStatus {
  stage: 'init' | 'supabase-creating' | 'supabase-ready' | 'migration' | 'vercel-creating' | 'deploying' | 'complete' | 'error'
  message: string
  progress: number // 0-100
  supabaseProjectId?: string
  supabaseUrl?: string
  vercelProjectId?: string
  deploymentUrl?: string
  error?: string
}

export interface ProjectSpec {
  name: string
  schema: string // SQL DDL
  files: Array<{ file: string; data: string }> // 程式碼檔案
}

// 完整部署流程
export async function deployProject(spec: ProjectSpec): Promise<DeploymentStatus> {
  const projectSlug = spec.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30)

  try {
    // Step 1: 建立 Supabase Project
    console.log('[Deploy] 建立 Supabase Project...')
    const supabaseResult = await createSupabaseProject(projectSlug)

    if (!supabaseResult.success || !supabaseResult.project) {
      return {
        stage: 'error',
        message: supabaseResult.error || 'Supabase project creation failed',
        progress: 0,
        error: supabaseResult.error,
      }
    }

    const supabaseProjectId = supabaseResult.project.id

    // Step 2: 執行 Migration
    console.log('[Deploy] 執行 Migration...')
    if (spec.schema) {
      const migrationResult = await runMigration(supabaseProjectId, spec.schema)

      if (!migrationResult.success) {
        return {
          stage: 'error',
          message: migrationResult.error || 'Migration execution failed',
          progress: 30,
          supabaseProjectId,
          error: migrationResult.error,
        }
      }
    }

    // Step 3: 取得 Supabase 連線資訊
    console.log('[Deploy] 取得 Supabase 連線資訊...')
    const configResult = await getProjectConfig(supabaseProjectId)

    if (!configResult.success || !configResult.config) {
      return {
        stage: 'error',
        message: configResult.error || 'Supabase config retrieval failed',
        progress: 40,
        supabaseProjectId,
        error: configResult.error,
      }
    }

    // Step 4: 建立 Vercel Project
    console.log('[Deploy] 建立 Vercel Project...')
    const vercelResult = await createVercelProject(projectSlug)

    if (!vercelResult.success || !vercelResult.project) {
      return {
        stage: 'error',
        message: vercelResult.error || 'Vercel project creation failed',
        progress: 50,
        supabaseProjectId,
        supabaseUrl: configResult.config.url,
        error: vercelResult.error,
      }
    }

    const vercelProjectId = vercelResult.project.id

    // Step 5: 設定環境變數
    console.log('[Deploy] 設定環境變數...')
    const envResult = await setEnvironmentVariables(vercelProjectId, [
      {
        key: 'NEXT_PUBLIC_SUPABASE_URL',
        value: configResult.config.url,
        target: ['production', 'preview', 'development'],
      },
      {
        key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        value: configResult.config.anonKey,
        target: ['production', 'preview', 'development'],
      },
    ])

    if (!envResult.success) {
      console.warn('[Deploy] Failed to set env variables:', envResult.error)
      // 繼續部署，環境變數可以之後手動設定
    }

    // Step 6: 部署程式碼
    console.log('[Deploy] 部署程式碼...')

    // 注入環境變數到程式碼中
    const filesWithEnv = injectEnvToFiles(spec.files, {
      NEXT_PUBLIC_SUPABASE_URL: configResult.config.url,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: configResult.config.anonKey,
    })

    const deployResult = await deployFiles(projectSlug, filesWithEnv)

    if (!deployResult.success) {
      return {
        stage: 'error',
        message: deployResult.error || 'Deployment failed',
        progress: 80,
        supabaseProjectId,
        supabaseUrl: configResult.config.url,
        vercelProjectId,
        error: deployResult.error,
      }
    }

    // 完成
    return {
      stage: 'complete',
      message: 'Deployment complete',
      progress: 100,
      supabaseProjectId,
      supabaseUrl: configResult.config.url,
      vercelProjectId,
      deploymentUrl: deployResult.url,
    }
  } catch (err) {
    return {
      stage: 'error',
      message: `部署時發生未預期錯誤: ${err}`,
      progress: 0,
      error: String(err),
    }
  }
}

// 將環境變數注入到 .env.local 檔案
function injectEnvToFiles(
  files: Array<{ file: string; data: string }>,
  env: Record<string, string>
): Array<{ file: string; data: string }> {
  const envContent = Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

  // 檢查是否已有 .env.local
  const hasEnvLocal = files.some(f => f.file === '.env.local')

  if (hasEnvLocal) {
    return files.map(f => {
      if (f.file === '.env.local') {
        return { file: f.file, data: f.data + '\n' + envContent }
      }
      return f
    })
  }

  return [...files, { file: '.env.local', data: envContent }]
}

// 生成簡單的 Next.js 專案模板
export async function generateNextJsTemplate(projectName: string, _schema: string): Promise<Array<{ file: string; data: string }>> {
  return [
    {
      file: 'package.json',
      data: JSON.stringify({
        name: projectName,
        version: '0.1.0',
        private: true,
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start',
        },
        dependencies: {
          next: '^14.0.0',
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          '@supabase/supabase-js': '^2.38.0',
        },
      }, null, 2),
    },
    {
      file: 'next.config.js',
      data: `/** @type {import('next').NextConfig} */
const nextConfig = {}
module.exports = nextConfig`,
    },
    {
      file: 'app/layout.tsx',
      data: `export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  )
}`,
    },
    {
      file: 'app/page.tsx',
      data: `export default function Home() {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>${projectName}</h1>
      <p>網站已成功部署</p>
    </main>
  )
}`,
    },
    {
      file: 'lib/supabase.ts',
      data: `import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)`,
    },
  ]
}

// 測試部署（不實際建立資源，只驗證配置）
export async function testDeploymentConfig(): Promise<{
  supabase: { configured: boolean; error?: string }
  vercel: { configured: boolean; error?: string }
}> {
  const result = {
    supabase: { configured: false, error: undefined as string | undefined },
    vercel: { configured: false, error: undefined as string | undefined },
  }

  // 測試 Supabase
  if (!process.env.SUPABASE_ACCESS_TOKEN) {
    result.supabase.error = 'Missing SUPABASE_ACCESS_TOKEN'
  } else if (!process.env.SUPABASE_ORG_ID) {
    result.supabase.error = 'Missing SUPABASE_ORG_ID'
  } else {
    result.supabase.configured = true
  }

  // 測試 Vercel
  if (!process.env.VERCEL_ACCESS_TOKEN) {
    result.vercel.error = 'Missing VERCEL_ACCESS_TOKEN'
  } else {
    result.vercel.configured = true
  }

  return result
}
