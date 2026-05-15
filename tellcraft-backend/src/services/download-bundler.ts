/**
 * Download Bundler
 *
 * 把 deployer 的 Next.js 組裝邏輯重用在「下載 ZIP」場景：
 * 客戶下載後可直接 pnpm install && pnpm dev 跑起來，
 * 並能用 db/schema.sql 在自己的 Postgres 重建資料庫。
 *
 * 與部署的差異：
 * - 不注入真實 secrets（Neon 連線字串、Resend API key 等）
 * - 多產出 .env.example、README.md、.gitignore、db/schema.sql
 *
 * 相對 deployer，下載走純源碼匯出，不做 build 驗證 / 不調 Vercel API。
 */

import * as db from '../db/client'
import {
  sanitizeCodeForDeploy,
  wrapInNextJs,
} from './deployer'
import type { GeneratedComponent } from './uiux-generation'
import { generateTailwindConfig } from './uiux-generation'
import { deriveSchemaFromBdd } from './schema-derivation'
import { createLogger } from '../lib/logger'

const logger = createLogger('download-bundler')

interface SnapshotFile {
  filePath: string
  content: string
}

export interface DownloadBundleFile {
  path: string
  content: string
}

export interface BuildDownloadBundleOptions {
  /** 版本/部署快照下載：直接從快照陣列重建 GeneratedCode，跳過 project_files */
  snapshot?: SnapshotFile[]
}

interface AssembledCode {
  pages: GeneratedComponent[]
  components: GeneratedComponent[]
  styles: string
  tailwindConfig: string
  /** Phase H: 額外文件（DESIGN.md 等），原樣放在專案 root */
  docs: Array<{ path: string; content: string }>
  /** 從快照衍生時用來 fallback 推 tailwind config */
  designSystem: unknown | null
}

/**
 * 主入口：給 projectId（與可選快照），組出可下載的完整 Next.js 專案檔案陣列
 */
export async function buildDownloadBundle(
  projectId: string,
  opts: BuildDownloadBundleOptions = {}
): Promise<{ files: DownloadBundleFile[] }> {
  const project = await db.queryOne<{ id: string; name: string }>(
    'SELECT id, name FROM projects WHERE id = $1',
    [projectId]
  )
  if (!project) throw new Error('Project not found')

  // 1. 取得源碼：snapshot 優先，否則從 project_files
  const assembled = opts.snapshot
    ? assembleFromSnapshot(opts.snapshot)
    : await assembleFromProjectFiles(projectId)

  // designSystem fallback：snapshot 模式且 tailwind 為空時，從 bdd_sessions 補
  let tailwindConfig = assembled.tailwindConfig
  if (!tailwindConfig && assembled.designSystem) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tailwindConfig = generateTailwindConfig(assembled.designSystem as any) || ''
    } catch (err) {
      logger.warn({ err }, 'generateTailwindConfig fallback 失敗，使用空 config')
    }
  }

  if (assembled.pages.length === 0) {
    throw new Error('此專案尚未生成任何頁面，無可下載內容')
  }

  // 2. 跑 sanitize（共用部署管線，自動修補 import + 推導 extraDependencies）
  const sanitized = sanitizeCodeForDeploy({
    pages: assembled.pages,
    components: assembled.components,
    styles: assembled.styles,
  })

  // 3. wrapInNextJs 組 12+ scaffolding 檔（package.json / next.config.ts / tsconfig.json / ...）
  const vercelFiles = wrapInNextJs(
    sanitized.code,
    project.name,
    tailwindConfig,
    sanitized.extraDependencies,
    sanitized.injectedFiles
  )

  const out: DownloadBundleFile[] = vercelFiles.map((f) => ({
    path: f.file,
    content: f.data,
  }))

  // 4. 加 db/schema.sql（從 bdd_sessions 即時 derive）
  try {
    const bdd = await db.queryOne<{
      schema_sql_content: string | null
      entity_mapping_content: string | null
    }>(
      `SELECT schema_sql_content, entity_mapping_content FROM bdd_sessions
       WHERE project_id = $1 ORDER BY updated_at DESC LIMIT 1`,
      [projectId]
    )
    if (bdd?.schema_sql_content) {
      const derived = deriveSchemaFromBdd(
        bdd.schema_sql_content,
        bdd.entity_mapping_content || ''
      )
      if (derived?.postgresqlDDL) {
        out.push({ path: 'db/schema.sql', content: derived.postgresqlDDL })
      }
    }
  } catch (err) {
    // 不要因為 schema derive 失敗就阻擋整個下載；附一個錯誤說明
    const msg = err instanceof Error ? err.message : String(err)
    logger.warn({ projectId, err }, '資料庫 schema 衍生失敗，將以註記檔代替')
    out.push({
      path: 'db/schema.sql',
      content: `-- 自動衍生資料庫 schema 失敗：${msg}\n-- 請聯繫 Tellcraft 客服或手動撰寫 schema\n`,
    })
  }

  // 5. 加 .env.example（占位符，禁止帶出真實 secrets）
  out.push({
    path: '.env.example',
    content: buildEnvExample(out.map((f) => f.path)),
  })

  // 6. 加 README.md
  out.push({
    path: 'README.md',
    content: buildReadme(project.name),
  })

  // 7. 加 .gitignore
  out.push({
    path: '.gitignore',
    content: buildGitignore(),
  })

  // 8. Phase H: 把 project_files 的 doc 類型（DESIGN.md 等）放進專案 root
  //    用戶 git clone / unzip 後看得到，跨 AI 工具可攜
  //    如果 path 衝突（理論上不會，因 wrapInNextJs 沒生 DESIGN.md），doc 覆蓋（用戶 DesignSystem 為真理）
  for (const doc of assembled.docs) {
    const existingIdx = out.findIndex((f) => f.path === doc.path)
    if (existingIdx >= 0) {
      out[existingIdx] = doc
    } else {
      out.push(doc)
    }
  }

  return { files: out }
}

// ============================================================
// 內部：從 project_files 組合
// ============================================================

async function assembleFromProjectFiles(projectId: string): Promise<AssembledCode> {
  const uiuxFiles = await db.getProjectFiles(projectId, 'uiux')
  const coderFiles = await db.getProjectFiles(projectId, 'coder')

  const fileMap = new Map<string, (typeof uiuxFiles)[0]>()
  for (const f of uiuxFiles) fileMap.set(f.file_path, f)
  for (const f of coderFiles) fileMap.set(f.file_path, f) // coder 覆蓋 uiux
  const projectFiles = Array.from(fileMap.values())

  const pages: GeneratedComponent[] = []
  const components: GeneratedComponent[] = []
  const backendFiles: GeneratedComponent[] = []
  const docs: Array<{ path: string; content: string }> = []
  let styles = ''
  let tailwindConfig = ''

  for (const f of projectFiles) {
    if (f.file_type === 'page') {
      pages.push({ path: f.file_path, content: f.content, description: f.description || '' })
    } else if (f.file_type === 'component') {
      components.push({ path: f.file_path, content: f.content, description: f.description || '' })
    } else if (f.file_type === 'style') {
      styles = f.content
    } else if (f.file_type === 'config' && f.file_path === 'tailwind.config.ts') {
      tailwindConfig = f.content
    } else if (['service', 'api_route', 'config'].includes(f.file_type)) {
      backendFiles.push({ path: f.file_path, content: f.content, description: f.description || '' })
    } else if (f.file_type === 'doc') {
      // Phase H: DESIGN.md 等文件，原樣推進 docs（後續 bundle 組合處放進專案 root）
      docs.push({ path: f.file_path, content: f.content })
    }
  }

  // Fallback：project_files 沒生成任何 page → 從 bdd_sessions 撈舊資料
  if (pages.length === 0) {
    const session = await db.queryOne<{
      generated_pages: GeneratedComponent[] | null
      generated_components: GeneratedComponent[] | null
      generated_styles: string | null
      final_design_system: unknown | null
    }>(
      `SELECT generated_pages, generated_components, generated_styles, final_design_system
       FROM bdd_sessions
       WHERE project_id = $1
       ORDER BY updated_at DESC
       LIMIT 1`,
      [projectId]
    )
    if (session?.generated_pages?.length) {
      return {
        pages: session.generated_pages,
        components: session.generated_components || [],
        styles: session.generated_styles || '',
        tailwindConfig: '',
        docs: [],  // 舊 session fallback 無 DESIGN.md（Phase H 前的專案）
        designSystem: session.final_design_system,
      }
    }
  }

  return {
    pages,
    // 後端檔案合進 components，跟 deployer 一致（wrapInNextJs 會以路徑判斷分類）
    components: [...components, ...backendFiles],
    styles,
    tailwindConfig,
    docs,
    designSystem: null,
  }
}

// ============================================================
// 內部：從 snapshot 組合
// ============================================================

function assembleFromSnapshot(snapshot: SnapshotFile[]): AssembledCode {
  const pages: GeneratedComponent[] = []
  const components: GeneratedComponent[] = []
  let styles = ''
  let tailwindConfig = ''

  for (const f of snapshot) {
    const path = f.filePath
    const inferred = inferFileTypeFromPath(path)

    if (inferred === 'page') {
      pages.push({ path, content: f.content, description: '' })
    } else if (inferred === 'style') {
      styles = f.content
    } else if (inferred === 'tailwind_config') {
      tailwindConfig = f.content
    } else {
      // component / service / api_route / 其他都丟 components（wrapInNextJs 用路徑分類）
      components.push({ path, content: f.content, description: '' })
    }
  }

  return { pages, components, styles, tailwindConfig, docs: [], designSystem: null }
}

function inferFileTypeFromPath(p: string): 'page' | 'style' | 'tailwind_config' | 'other' {
  if (p === 'tailwind.config.ts' || p === 'tailwind.config.js') return 'tailwind_config'
  if (p === 'app/globals.css') return 'style'
  // Next.js App Router page：app/.../page.tsx；排除 layout/loading/error/not-found
  if (/^app\/(.*\/)?page\.(tsx|jsx)$/.test(p)) return 'page'
  return 'other'
}

// ============================================================
// 內部：產出輔助檔案
// ============================================================

function buildEnvExample(filePaths: string[]): string {
  const has = (path: string) => filePaths.includes(path)
  const hasEmail = has('lib/email.ts')
  const hasMagicLink = has('lib/magic-link.ts')
  const hasAuth = has('auth.ts')

  const lines: string[] = [
    '# 環境變數範本 — 請複製為 .env 並填入實際值',
    '# Tellcraft 不會把真實 secrets 包進下載 ZIP，需自行設定',
    '',
    '# ─── 必填 ───',
    '# Neon / 任何 PostgreSQL 連線字串',
    'DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require',
    '',
  ]

  if (hasEmail) {
    lines.push(
      '# ─── Email（lib/email.ts 偵測到） ───',
      '# Resend API key（https://resend.com）',
      'RESEND_API_KEY=re_xxxxxxxxxxxxxxxx',
      '# 寄件來源',
      'EMAIL_FROM=onboarding@resend.dev',
      ''
    )
  }

  if (hasMagicLink) {
    lines.push(
      '# ─── Magic Link（lib/magic-link.ts 偵測到） ───',
      '# 應用對外 URL（含 https://）',
      'APP_URL=https://your-domain.com',
      ''
    )
  }

  if (hasAuth) {
    lines.push(
      '# ─── 驗證（auth.ts 偵測到） ───',
      '# 用 `openssl rand -base64 32` 自行生成',
      'AUTH_SECRET=please_generate_a_random_base64_string',
      ''
    )
  }

  return lines.join('\n')
}

function buildReadme(projectName: string): string {
  return `# ${projectName}

由 [Tellcraft](https://tellcraft.com) 自動生成的 Next.js 專案。

## 系統需求

- Node.js 20+
- pnpm 8+（建議）或 npm / yarn
- PostgreSQL（推薦 [Neon](https://neon.tech)，serverless 且免費）

## 快速開始

\`\`\`bash
# 1. 安裝依賴
pnpm install

# 2. 設定環境變數
cp .env.example .env
# 編輯 .env，填入 DATABASE_URL 等變數

# 3. 建立資料庫 schema（首次設定）
psql "$DATABASE_URL" -f db/schema.sql

# 4. 啟動開發伺服器
pnpm dev
\`\`\`

打開 http://localhost:3000 查看。

## 部署到 Vercel

1. 把專案推到 GitHub repo
2. 在 [Vercel](https://vercel.com) 點 New Project → Import 你的 repo
3. 在 Project Settings → Environment Variables 把 \`.env.example\` 內所有變數都加上
4. Deploy

## 專案結構

- \`app/\` — Next.js App Router（pages、layouts、Server Actions）
- \`app/actions/\` — Server Actions（前端可直接呼叫）
- \`lib/\` — 後端 helpers（DB 連線、actions 實作、email、auth 等）
- \`components/\` — React 共用元件
- \`db/schema.sql\` — PostgreSQL DDL（CREATE TABLE 等）

## 架構

- Frontend：Next.js（App Router）+ Tailwind CSS + framer-motion
- Backend：Server Actions → \`lib/actions/*\` → PostgreSQL
- Database：Neon（推薦）或任何 PostgreSQL 16+

## 授權

由 Tellcraft 為你生成，著作權屬於你。
`
}

function buildGitignore(): string {
  return `# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Next.js
.next/
out/
build/
dist/

# Production
*.tgz

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Env
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
`
}
