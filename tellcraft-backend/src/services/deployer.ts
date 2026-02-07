// ============================================================
// Deployer Service — UIUX 生成代碼 → Next.js → Vercel 部署
// ============================================================

import * as db from '../db/client'

const VERCEL_API = 'https://api.vercel.com'

// ============================================================
// 類型定義
// ============================================================

interface GeneratedComponent {
  path: string
  content: string
  description: string
}

interface GeneratedCode {
  pages: GeneratedComponent[]
  components: GeneratedComponent[]
  styles: string
}

interface VercelFile {
  file: string
  data: string
}

interface VercelProject {
  id: string
  name: string
}

interface VercelDeployment {
  id: string
  url: string
  state: string
  readyState: string
}

export interface DeployPreCheckResult {
  ready: boolean
  error?: string
  projectName?: string
  fileCount?: number
  estimatedUrl?: string
  code?: GeneratedCode
  tailwindConfig?: string
  sanitizeFixes?: string[]                         // 預檢修復項目
  extraDependencies?: Record<string, string>       // 掃描到的額外依賴
  injectedFiles?: { file: string; data: string }[] // 需要注入的 helper 文件
}

export interface DeployResult {
  success: boolean
  deploymentUrl?: string
  vercelDeploymentId?: string
  error?: string
}

export type ProgressCallback = (progress: {
  percent: number
  step: string
}) => Promise<void>

// ============================================================
// 部署前代碼預檢 + 自動修復
// ============================================================

interface SanitizeResult {
  code: GeneratedCode
  fixes: string[]                               // 修復描述（給 log 和用戶看）
  injectedFiles: { file: string; data: string }[] // 需要注入的 helper 文件
  extraDependencies: Record<string, string>       // 需要補充的第三方套件
}

/**
 * 已知第三方套件版本對照表
 * LLM 經常在代碼中引用這些但 package.json 沒有列入
 */
const KNOWN_PACKAGES: Record<string, string> = {
  'lucide-react': '^0.400.0',
  '@radix-ui/react-dialog': '^1.1.0',
  '@radix-ui/react-dropdown-menu': '^2.1.0',
  '@radix-ui/react-popover': '^1.1.0',
  '@radix-ui/react-select': '^2.1.0',
  '@radix-ui/react-tabs': '^1.1.0',
  '@radix-ui/react-toast': '^1.2.0',
  '@radix-ui/react-tooltip': '^1.1.0',
  '@radix-ui/react-slot': '^1.1.0',
  '@radix-ui/react-scroll-area': '^1.2.0',
  '@radix-ui/react-separator': '^1.1.0',
  '@radix-ui/react-switch': '^1.1.0',
  '@radix-ui/react-checkbox': '^1.1.0',
  '@radix-ui/react-accordion': '^1.2.0',
  '@radix-ui/react-alert-dialog': '^1.1.0',
  '@radix-ui/react-avatar': '^1.1.0',
  '@radix-ui/react-label': '^2.1.0',
  '@radix-ui/react-slider': '^1.2.0',
  '@radix-ui/react-navigation-menu': '^1.2.0',
  '@radix-ui/react-collapsible': '^1.1.0',
  '@radix-ui/react-toggle': '^1.1.0',
  '@radix-ui/react-toggle-group': '^1.1.0',
  '@radix-ui/react-aspect-ratio': '^1.1.0',
  '@radix-ui/react-hover-card': '^1.1.0',
  '@radix-ui/react-menubar': '^1.1.0',
  '@radix-ui/react-context-menu': '^2.2.0',
  '@radix-ui/react-progress': '^1.1.0',
  '@radix-ui/react-radio-group': '^1.2.0',
  'class-variance-authority': '^0.7.0',
  'clsx': '^2.1.0',
  'tailwind-merge': '^2.5.0',
  'react-icons': '^5.0.0',
  '@heroicons/react': '^2.1.0',
  'recharts': '^2.12.0',
  'date-fns': '^3.6.0',
  'zod': '^3.23.0',
  'react-hook-form': '^7.52.0',
  '@hookform/resolvers': '^3.9.0',
  'embla-carousel-react': '^8.3.0',
  'react-day-picker': '^9.0.0',
  'sonner': '^1.5.0',
  'cmdk': '^1.0.0',
  'vaul': '^1.0.0',
  'input-otp': '^1.2.0',
  'next-themes': '^0.3.0',
}

/** 基礎 dependencies（一定會包含在 package.json 中） */
const BASE_DEPS: Record<string, string> = {
  next: '^15.0.0',
  react: '^19.0.0',
  'react-dom': '^19.0.0',
  motion: '^11.0.0',
  tailwindcss: '^3.4.0',
  postcss: '^8.4.0',
  autoprefixer: '^10.0.0',
}

/**
 * 部署前代碼預檢 + 自動修復
 * 掃描所有已知的 build 失敗模式，自動修復後返回乾淨的代碼
 */
function sanitizeCodeForDeploy(code: GeneratedCode): SanitizeResult {
  const fixes: string[] = []
  const injectedFiles: { file: string; data: string }[] = []
  const extraDependencies: Record<string, string> = {}

  // 深拷貝避免修改原始代碼
  const sanitized: GeneratedCode = {
    pages: code.pages.map(p => ({ ...p, content: p.content })),
    components: code.components.map(c => ({ ...c, content: c.content })),
    styles: code.styles,
  }

  const allFiles = [...sanitized.pages, ...sanitized.components]
  let needsMotionHelper = false

  for (const file of allFiles) {
    // ── 修復 1: framer-motion → motion/react ──
    if (/from\s+['"]framer-motion['"]/.test(file.content)) {
      file.content = file.content.replace(
        /from\s+['"]framer-motion['"]/g,
        "from 'motion/react'"
      )
      fixes.push(`${file.path}: framer-motion → motion/react`)
    }

    // ── 修復 2: 缺少 'use client' ──
    const needsClient =
      /\b(useState|useEffect|useRef|useCallback|useMemo|useContext|useReducer)\b/.test(file.content) ||
      /from\s+['"]motion\/react['"]/.test(file.content)
    const hasUseClient = /^['"]use client['"]/.test(file.content.trimStart())
    if (needsClient && !hasUseClient) {
      file.content = "'use client'\n\n" + file.content
      fixes.push(`${file.path}: 自動加入 'use client'`)
    }

    // ── 修復 3: motion.* 上的 spread props（TypeScript 類型衝突）──
    // motion.button 的 onAnimationStart 與 React 的不相容，spread 所有 HTML props 會報錯
    if (/motion\.\w+/.test(file.content)) {
      const motionSpreadRegex = /<motion\.\w+[^>]*\{\.\.\.(\w+)\}/g
      let match
      const spreadVars = new Set<string>()
      while ((match = motionSpreadRegex.exec(file.content)) !== null) {
        spreadVars.add(match[1])
      }

      if (spreadVars.size > 0) {
        needsMotionHelper = true

        // 加入 safeMotionProps import（在最後一個 import 之後）
        if (!file.content.includes('safeMotionProps')) {
          const lines = file.content.split('\n')
          let lastImportLine = -1
          for (let i = 0; i < lines.length; i++) {
            if (/^import\s/.test(lines[i].trim())) lastImportLine = i
          }
          if (lastImportLine >= 0) {
            lines.splice(lastImportLine + 1, 0, "import { safeMotionProps } from '@/lib/motion-safe-props'")
            file.content = lines.join('\n')
          }
        }

        // 替換 motion.* 上的 {...props} → {...safeMotionProps(props)}
        for (const varName of spreadVars) {
          file.content = file.content.replace(
            new RegExp(`(<motion\\.\\w+[^>]*)\\{\\.\\.\\.${varName}\\}`, 'g'),
            `$1{...safeMotionProps(${varName})}`
          )
        }

        fixes.push(`${file.path}: motion.* spread props 類型衝突修復`)
      }
    }

    // ── 修復 4: Google Fonts <link> 或 @import（應用 next/font）──
    if (/<link[^>]*fonts\.googleapis\.com/.test(file.content)) {
      file.content = file.content.replace(/<link[^>]*fonts\.googleapis\.com[^>]*\/?>/g, '')
      fixes.push(`${file.path}: 移除 Google Fonts <link>（應用 next/font）`)
    }
  }

  // CSS 中的 Google Fonts @import
  if (/@import\s+url\(['"]*https:\/\/fonts\.googleapis\.com/.test(sanitized.styles)) {
    sanitized.styles = sanitized.styles.replace(
      /@import\s+url\(['"]*https:\/\/fonts\.googleapis\.com[^)]*\)['"]*\s*;?\s*/g, ''
    )
    fixes.push(`globals.css: 移除 Google Fonts @import`)
  }

  // ── 注入 motion helper ──
  if (needsMotionHelper) {
    injectedFiles.push({
      file: 'lib/motion-safe-props.ts',
      data: `/**
 * 排除 React HTML 事件與 motion/react 的類型衝突屬性
 * React 的 onAnimationStart 是 AnimationEvent，motion 的是 AnimationDefinition
 * 直接 spread HTML props 到 motion.* 上會導致 TypeScript 報錯
 */
export function safeMotionProps<T extends Record<string, unknown>>(props: T) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { onAnimationStart, onDragStart, onDragEnd, onDrag, ...safe } = props as Record<string, unknown>
  return safe
}
`,
    })
  }

  // ── 掃描第三方依賴 ──
  const basePkgs = new Set(Object.keys(BASE_DEPS))
  const importRegex = /import\s+[\s\S]*?\s+from\s+['"]([^./][^'"]*)['"]/g
  const requireRegex = /require\(['"]([^./][^'"]*)['"]\)/g

  for (const file of allFiles) {
    let m
    // 重置 regex lastIndex
    importRegex.lastIndex = 0
    while ((m = importRegex.exec(file.content)) !== null) {
      const raw = m[1]
      const pkg = raw.startsWith('@') ? raw.split('/').slice(0, 2).join('/') : raw.split('/')[0]
      if (!basePkgs.has(pkg) && !pkg.startsWith('next/') && !pkg.startsWith('react/') && !pkg.startsWith('react-dom/')) {
        if (KNOWN_PACKAGES[pkg]) {
          extraDependencies[pkg] = KNOWN_PACKAGES[pkg]
        } else if (pkg.startsWith('@radix-ui/')) {
          extraDependencies[pkg] = '^1.1.0' // Radix 通用 fallback 版本
        }
      }
    }
    requireRegex.lastIndex = 0
    while ((m = requireRegex.exec(file.content)) !== null) {
      const raw = m[1]
      const pkg = raw.startsWith('@') ? raw.split('/').slice(0, 2).join('/') : raw.split('/')[0]
      if (!basePkgs.has(pkg) && KNOWN_PACKAGES[pkg]) {
        extraDependencies[pkg] = KNOWN_PACKAGES[pkg]
      }
    }
  }

  if (Object.keys(extraDependencies).length > 0) {
    fixes.push(`自動補充 ${Object.keys(extraDependencies).length} 個第三方依賴: ${Object.keys(extraDependencies).join(', ')}`)
  }

  // ── 檔案間引用檢查（只 log warning，不 block 部署）──
  const filePathSet = new Set<string>()
  for (const f of allFiles) {
    filePathSet.add(f.path)
    filePathSet.add(f.path.replace(/\.(tsx?|jsx?)$/, ''))
    // index 解析
    const dir = f.path.replace(/\/[^/]+$/, '')
    if (f.path.endsWith('/index.tsx') || f.path.endsWith('/index.ts')) {
      filePathSet.add(dir)
    }
  }

  const relativeImportRegex = /from\s+['"](\.[^'"]+)['"]/g
  for (const file of allFiles) {
    relativeImportRegex.lastIndex = 0
    let m
    while ((m = relativeImportRegex.exec(file.content)) !== null) {
      const importPath = m[1]
      if (importPath.startsWith('@/')) continue // alias 另外處理

      const fileDir = file.path.replace(/\/[^/]+$/, '') || '.'
      const resolved = importPath.startsWith('./')
        ? fileDir + '/' + importPath.slice(2)
        : fileDir + '/' + importPath
      const candidates = [resolved, resolved + '.tsx', resolved + '.ts', resolved + '/index.tsx', resolved + '/index.ts']
      if (!candidates.some(c => filePathSet.has(c))) {
        console.warn(`[Deployer] 可能的 broken import: ${file.path} → ${importPath}`)
      }
    }
  }

  return { code: sanitized, fixes, injectedFiles, extraDependencies }
}

// ============================================================
// 主要函數
// ============================================================

/**
 * 部署前檢查
 * 驗證專案存在、有 UIUX 代碼、環境變數正確
 */
export async function prepareDeployment(
  projectId: string,
  userId: string
): Promise<DeployPreCheckResult> {
  // 1. 檢查 VERCEL_ACCESS_TOKEN
  if (!process.env.VERCEL_ACCESS_TOKEN) {
    return { ready: false, error: '缺少 VERCEL_ACCESS_TOKEN 環境變數，無法部署。' }
  }

  // 2. 檢查專案存在且屬於用戶
  const project = await db.getProject(projectId)
  if (!project) {
    return { ready: false, error: '找不到專案。' }
  }
  if (project.user_id !== userId) {
    return { ready: false, error: '您沒有權限部署此專案。' }
  }

  // 3. 優先從 project_files 取得生成的代碼
  let code: GeneratedCode | null = null
  let tailwindConfig = ''

  const projectFiles = await db.getProjectFiles(projectId, 'uiux')

  if (projectFiles.length > 0) {
    // 從 project_files 重建 GeneratedCode
    const pages: GeneratedComponent[] = []
    const components: GeneratedComponent[] = []
    let styles = ''

    for (const f of projectFiles) {
      if (f.file_type === 'page') {
        pages.push({ path: f.file_path, content: f.content, description: f.description || '' })
      } else if (f.file_type === 'component') {
        components.push({ path: f.file_path, content: f.content, description: f.description || '' })
      } else if (f.file_type === 'style') {
        styles = f.content
      } else if (f.file_type === 'config' && f.file_path === 'tailwind.config.ts') {
        tailwindConfig = f.content
      }
    }

    if (pages.length > 0) {
      code = { pages, components, styles }
    }
  }

  // Fallback：從 bdd_sessions 讀取（舊專案相容）
  if (!code) {
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

    if (!session || !session.generated_pages || session.generated_pages.length === 0) {
      return { ready: false, error: '此專案尚未完成 UIUX 設計，沒有可部署的代碼。' }
    }

    code = {
      pages: session.generated_pages,
      components: session.generated_components || [],
      styles: session.generated_styles || '',
    }

    // 從舊的 design system 生成 tailwind config
    if (session.final_design_system) {
      const ds = session.final_design_system as { tailwindExtend?: Record<string, unknown> }
      if (ds.tailwindExtend) {
        tailwindConfig = JSON.stringify(ds.tailwindExtend, null, 2)
      }
    }
  }

  const slug = project.name
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30) || 'tellcraft-project'

  // 部署前預檢 + 自動修復
  const sanitizeResult = sanitizeCodeForDeploy(code)
  const sanitizedCode = sanitizeResult.code

  if (sanitizeResult.fixes.length > 0) {
    console.log(`[Deployer] 預檢修復 ${sanitizeResult.fixes.length} 項:`, sanitizeResult.fixes)
  }

  const fileCount = sanitizedCode.pages.length + sanitizedCode.components.length + 1 // +1 for styles

  return {
    ready: true,
    projectName: slug,
    fileCount,
    estimatedUrl: `https://${slug}.vercel.app`,
    code: sanitizedCode,
    tailwindConfig,
    sanitizeFixes: sanitizeResult.fixes,
    extraDependencies: sanitizeResult.extraDependencies,
    injectedFiles: sanitizeResult.injectedFiles,
  }
}

/**
 * 執行部署
 */
export async function executeDeployment(
  projectId: string,
  code: GeneratedCode,
  tailwindConfig: string,
  onProgress: ProgressCallback,
  options?: {
    extraDependencies?: Record<string, string>
    injectedFiles?: { file: string; data: string }[]
  }
): Promise<DeployResult> {
  try {
    // 1. 包裝成 Next.js 專案
    await onProgress({ percent: 10, step: '打包 Next.js 專案...' })
    const project = await db.getProject(projectId)
    const projectName = project?.name
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30) || 'tellcraft-project'

    const files = wrapInNextJs(code, projectName, tailwindConfig, options?.extraDependencies, options?.injectedFiles)

    // 2. 建立 Vercel Project
    await onProgress({ percent: 30, step: '建立 Vercel 專案...' })
    const vercelProject = await createVercelProject(projectName)
    if (!vercelProject) {
      // 已存在的話繼續部署
      console.log(`[Deployer] Vercel project "${projectName}" 可能已存在，繼續部署`)
    }

    // 3. 部署檔案
    await onProgress({ percent: 60, step: '上傳並部署到 Vercel...' })
    const deployment = await deployFilesToVercel(projectName, files)
    if (!deployment) {
      return { success: false, error: '部署到 Vercel 失敗，請稍後再試。' }
    }

    // 4. 等待部署就緒
    await onProgress({ percent: 85, step: '等待部署完成...' })
    const readyDeployment = await waitForDeploymentReady(deployment.id)

    const deploymentUrl = `https://${deployment.url}`
    const finalStatus = readyDeployment?.readyState || deployment.readyState

    if (readyDeployment?.readyState === 'ERROR') {
      return { success: false, error: 'Vercel 建置失敗，請檢查代碼。', vercelDeploymentId: deployment.id }
    }

    // 5. 更新 DB
    await onProgress({ percent: 95, step: '更新專案狀態...' })

    // 寫入 deployments 表
    await db.query(
      `INSERT INTO deployments (project_id, vercel_deployment_id, url, status)
       VALUES ($1, $2, $3, $4)`,
      [projectId, deployment.id, deploymentUrl, finalStatus === 'READY' ? 'success' : 'deploying']
    )

    // 更新專案狀態
    await db.query(
      `UPDATE projects SET status = 'deployed', updated_at = NOW() WHERE id = $1`,
      [projectId]
    )

    await onProgress({ percent: 100, step: '部署完成！' })

    return {
      success: true,
      deploymentUrl,
      vercelDeploymentId: deployment.id,
    }
  } catch (err) {
    console.error('[Deployer] 部署失敗:', err)
    return { success: false, error: `部署失敗：${err instanceof Error ? err.message : String(err)}` }
  }
}

// ============================================================
// 內部函數
// ============================================================

/**
 * 將 UIUX 生成的代碼包裝成完整 Next.js 專案
 */
function wrapInNextJs(
  code: GeneratedCode,
  projectName: string,
  tailwindConfig: string,
  extraDependencies?: Record<string, string>,
  injectedFiles?: { file: string; data: string }[]
): VercelFile[] {
  const files: VercelFile[] = []

  // package.json — 合併基礎依賴 + 預檢掃描到的額外依賴
  const allDependencies: Record<string, string> = {
    ...BASE_DEPS,
    ...(extraDependencies || {}),
  }

  files.push({
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
      dependencies: allDependencies,
      devDependencies: {
        typescript: '^5.0.0',
        '@types/react': '^19.0.0',
        '@types/node': '^22.0.0',
      },
    }, null, 2),
  })

  // next.config.ts — 忽略 TypeScript/ESLint 錯誤（LLM 生成代碼不保證 100% 類型安全）
  files.push({
    file: 'next.config.ts',
    data: `import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
`,
  })

  // postcss.config.js（Tailwind v3 必需）
  files.push({
    file: 'postcss.config.js',
    data: `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`,
  })

  // tsconfig.json
  files.push({
    file: 'tsconfig.json',
    data: JSON.stringify({
      compilerOptions: {
        target: 'ES2017',
        lib: ['dom', 'dom.iterable', 'esnext'],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: 'preserve',
        incremental: true,
        paths: { '@/*': ['./*'] },
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx'],
      exclude: ['node_modules'],
    }, null, 2),
  })

  // app/globals.css — Tailwind v3
  // 確保有 @tailwind 指令（LLM 可能已包含，也可能沒有）
  let stylesContent = code.styles
    .replace(/@import\s*["']tailwindcss["']\s*;?\s*/g, '') // 移除 v4 語法
  const hasTailwindDirectives = stylesContent.includes('@tailwind base')
  const globalsCss = hasTailwindDirectives
    ? stylesContent
    : `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n${stylesContent}`
  files.push({ file: 'app/globals.css', data: globalsCss })

  // tailwind.config.ts（Tailwind v3 必需 content 路徑）
  if (tailwindConfig) {
    const isFullFile = tailwindConfig.includes('import type') || tailwindConfig.includes('export default')
    files.push({
      file: 'tailwind.config.ts',
      data: isFullFile ? tailwindConfig : `import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: ${tailwindConfig},
  },
  plugins: [],
}

export default config
`,
    })
  } else {
    // 即使沒有自訂設定也要生成 config（v3 需要 content 路徑掃描 class）
    files.push({
      file: 'tailwind.config.ts',
      data: `import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config
`,
    })
  }

  // 生成的 components — 智慧路徑處理
  let hasCustomLayout = false
  for (const comp of code.components) {
    const cleanPath = comp.path.replace(/^(components\/)?/, '')

    // app/ 開頭的檔案放到 app/（不是 components/app/）
    if (cleanPath.startsWith('app/')) {
      if (cleanPath === 'app/layout.tsx' || cleanPath === 'app/layout.ts') {
        hasCustomLayout = true
      }
      files.push({ file: cleanPath, data: comp.content })
    }
    // lib/ 開頭的檔案放到 lib/（不是 components/lib/）
    else if (cleanPath.startsWith('lib/')) {
      files.push({ file: cleanPath, data: comp.content })
    }
    // 其他才放到 components/
    else {
      files.push({ file: `components/${cleanPath}`, data: comp.content })
    }
  }

  // app/layout.tsx — 如果 LLM 沒生成自訂的，用預設
  if (!hasCustomLayout) {
    files.push({
      file: 'app/layout.tsx',
      data: `import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '${projectName}',
  description: 'Built with Tellcraft',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  )
}
`,
    })
  }

  // 自動補齊 lib/fonts.ts — LLM 經常引用但不一定有生成
  const allContent = [...code.pages, ...code.components].map(f => f.content).join('\n')
  const existingFilePaths = files.map(f => f.file)
  if (
    allContent.includes('@/lib/fonts') &&
    !existingFilePaths.includes('lib/fonts.ts') &&
    !existingFilePaths.includes('lib/fonts.tsx')
  ) {
    // 從引用處提取變數名稱
    const fontImports = allContent.match(/import\s*\{([^}]+)\}\s*from\s*['"]@\/lib\/fonts['"]/g) || []
    const fontVarNames = new Set<string>()
    for (const imp of fontImports) {
      const match = imp.match(/\{([^}]+)\}/)
      if (match) {
        match[1].split(',').map(s => s.trim()).filter(Boolean).forEach(n => fontVarNames.add(n))
      }
    }

    // camelCase 變數名 → next/font/google import 名 對照表
    const FONT_LOOKUP: Record<string, string> = {
      dmSans: 'DM_Sans', dmMono: 'DM_Mono', dmSerifDisplay: 'DM_Serif_Display',
      inter: 'Inter', geist: 'Geist', geistMono: 'Geist_Mono',
      notoSansTC: 'Noto_Sans_TC', notoSerifTC: 'Noto_Serif_TC',
      notoSansSC: 'Noto_Sans_SC', notoSansJP: 'Noto_Sans_JP',
      poppins: 'Poppins', roboto: 'Roboto', robotoMono: 'Roboto_Mono',
      lato: 'Lato', openSans: 'Open_Sans', montserrat: 'Montserrat',
      raleway: 'Raleway', playfairDisplay: 'Playfair_Display',
      merriweather: 'Merriweather', sourceSans3: 'Source_Sans_3',
      sourceCodePro: 'Source_Code_Pro', jetBrainsMono: 'JetBrains_Mono',
      ibmPlexSans: 'IBM_Plex_Sans', ibmPlexMono: 'IBM_Plex_Mono',
      spaceGrotesk: 'Space_Grotesk', spaceMono: 'Space_Mono',
      workSans: 'Work_Sans', manrope: 'Manrope', outfit: 'Outfit',
      sora: 'Sora', cabin: 'Cabin', nunito: 'Nunito', rubik: 'Rubik',
      figtree: 'Figtree', plusJakartaSans: 'Plus_Jakarta_Sans',
    }

    const imports: string[] = []
    const exports: string[] = []
    for (const varName of fontVarNames) {
      const googleName = FONT_LOOKUP[varName] || 'Geist' // fallback 安全字體
      imports.push(`import { ${googleName} } from 'next/font/google'`)
      // 檢查代碼是否使用了 .variable（CSS variable 模式）
      const usesVariable = allContent.includes(`${varName}.variable`)
      const cssVarName = `--font-${varName.replace(/([A-Z])/g, '-$1').toLowerCase()}`
      if (usesVariable) {
        exports.push(`export const ${varName} = ${googleName}({ subsets: ['latin'], display: 'swap', variable: '${cssVarName}' })`)
      } else {
        exports.push(`export const ${varName} = ${googleName}({ subsets: ['latin'], display: 'swap' })`)
      }
    }

    // 去重 import（多個變數可能 fallback 到同一字體）
    const uniqueImports = [...new Set(imports)]
    files.push({
      file: 'lib/fonts.ts',
      data: uniqueImports.join('\n') + '\n\n' + exports.join('\n'),
    })
  }

  // 頁面處理 — 找出首頁和其他路由頁面
  // 首頁：path 為 app/page.tsx、page.tsx 或 home.tsx 等
  const mainPageIndex = code.pages.findIndex(p => {
    const clean = p.path.replace(/^(app\/|pages\/)?/, '')
    return clean === 'page.tsx' || clean === 'page.ts' || clean === 'index.tsx' || clean === 'index.ts'
  })
  const mainPage = mainPageIndex >= 0 ? code.pages[mainPageIndex] : code.pages[0]
  const otherPages = code.pages.filter((_, i) => i !== (mainPageIndex >= 0 ? mainPageIndex : 0))

  if (mainPage) {
    files.push({
      file: 'app/page.tsx',
      data: mainPage.content,
    })

    for (const page of otherPages) {
      let pagePath = page.path
        .replace(/^(app\/|pages\/)?/, '')        // 去掉 app/ 或 pages/ 前綴
        .replace(/\/page\.(tsx|ts|jsx|js)$/, '')  // 去掉尾部 /page.tsx
        .replace(/\.(tsx|ts|jsx|js)$/, '')        // 去掉副檔名
      // 如果 path 就是 page / index（首頁），跳過
      if (!pagePath || pagePath === 'page' || pagePath === 'index') continue
      files.push({
        file: `app/${pagePath}/page.tsx`,
        data: page.content,
      })
    }
  } else {
    // 沒有頁面，給一個預設
    files.push({
      file: 'app/page.tsx',
      data: `export default function Home() {
  return <main style={{ padding: '2rem' }}><h1>${projectName}</h1><p>網站已部署</p></main>
}
`,
    })
  }

  // 注入預檢產生的 helper 文件（如 motion-safe-props.ts）
  if (injectedFiles && injectedFiles.length > 0) {
    for (const injected of injectedFiles) {
      // 避免重複（components 可能已有同名檔案）
      if (!files.some(f => f.file === injected.file)) {
        files.push({ file: injected.file, data: injected.data })
      }
    }
  }

  return files
}

/**
 * 建立 Vercel Project
 */
async function createVercelProject(name: string): Promise<VercelProject | null> {
  const token = process.env.VERCEL_ACCESS_TOKEN!
  const teamId = process.env.VERCEL_TEAM_ID

  const params = new URLSearchParams()
  if (teamId) params.append('teamId', teamId)

  try {
    const response = await fetch(`${VERCEL_API}/v10/projects?${params}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        framework: 'nextjs',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      // 409 表示已存在，不算錯誤
      if (response.status === 409) {
        console.log(`[Deployer] Vercel project "${name}" 已存在`)
        return null
      }
      console.error(`[Deployer] 建立 Vercel Project 失敗: ${errorText}`)
      return null
    }

    return await response.json() as VercelProject
  } catch (err) {
    console.error('[Deployer] 建立 Vercel Project 錯誤:', err)
    return null
  }
}

/**
 * 部署檔案到 Vercel
 */
async function deployFilesToVercel(projectName: string, files: VercelFile[]): Promise<VercelDeployment | null> {
  const token = process.env.VERCEL_ACCESS_TOKEN!
  const teamId = process.env.VERCEL_TEAM_ID

  const params = new URLSearchParams()
  if (teamId) params.append('teamId', teamId)

  // 轉換為 base64
  const vercelFiles = files.map(f => ({
    file: f.file,
    data: Buffer.from(f.data).toString('base64'),
    encoding: 'base64' as const,
  }))

  try {
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
      const errorText = await response.text()
      console.error(`[Deployer] 部署失敗: ${errorText}`)
      return null
    }

    return await response.json() as VercelDeployment
  } catch (err) {
    console.error('[Deployer] 部署錯誤:', err)
    return null
  }
}

/**
 * 等待部署完成
 */
async function waitForDeploymentReady(deploymentId: string, maxWaitMs = 300000): Promise<VercelDeployment | null> {
  const token = process.env.VERCEL_ACCESS_TOKEN!
  const teamId = process.env.VERCEL_TEAM_ID
  const startTime = Date.now()
  const pollInterval = 5000

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
          return deployment
        }
      }
    } catch {
      // 忽略，繼續輪詢
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval))
  }

  return null
}

// ============================================================
// 部署歷史 & 回滾
// ============================================================

export interface DeploymentRecord {
  id: string
  vercel_deployment_id: string
  url: string
  status: string
  created_at: string
}

/**
 * 查詢專案的部署歷史（從 DB）
 */
export async function listProjectDeployments(
  projectId: string
): Promise<DeploymentRecord[]> {
  const result = await db.queryMany<DeploymentRecord>(
    `SELECT id, vercel_deployment_id, url, status, created_at
     FROM deployments
     WHERE project_id = $1 AND status = 'success'
     ORDER BY created_at DESC
     LIMIT 10`,
    [projectId]
  )
  return result
}

/**
 * 回滾到指定的部署版本
 * 原理：用 Vercel API 將指定的 deployment promote 為 production
 */
export async function rollbackToDeployment(
  projectName: string,
  targetDeploymentId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const token = process.env.VERCEL_ACCESS_TOKEN
  if (!token) {
    return { success: false, error: '缺少 VERCEL_ACCESS_TOKEN' }
  }

  const teamId = process.env.VERCEL_TEAM_ID
  const params = new URLSearchParams()
  if (teamId) params.append('teamId', teamId)

  try {
    // 先取得目標 deployment 的詳情確認存在
    const detailRes = await fetch(`${VERCEL_API}/v13/deployments/${targetDeploymentId}?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (!detailRes.ok) {
      return { success: false, error: '找不到指定的部署版本' }
    }

    const detail = await detailRes.json() as { url: string; readyState: string }
    if (detail.readyState !== 'READY') {
      return { success: false, error: '指定的部署版本狀態異常' }
    }

    // 用 Vercel Promote API 將此 deployment 設為當前版本
    // POST /v10/projects/{projectName}/promote/{deploymentId}
    const promoteRes = await fetch(
      `${VERCEL_API}/v10/projects/${encodeURIComponent(projectName)}/promote/${targetDeploymentId}?${params}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!promoteRes.ok) {
      const errText = await promoteRes.text()
      console.error('[Deployer] Promote 失敗:', errText)

      // Fallback：嘗試用 aliases API 將 production alias 指向目標 deployment
      const aliasRes = await fetch(`${VERCEL_API}/v2/deployments/${targetDeploymentId}/aliases?${params}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ alias: `${projectName}.vercel.app` }),
      })

      if (!aliasRes.ok) {
        const aliasErr = await aliasRes.text()
        console.error('[Deployer] Alias fallback 失敗:', aliasErr)
        return { success: false, error: '回滾失敗，請稍後再試。' }
      }
    }

    return {
      success: true,
      url: `https://${detail.url}`,
    }
  } catch (err) {
    console.error('[Deployer] 回滾錯誤:', err)
    return { success: false, error: `回滾失敗：${err instanceof Error ? err.message : String(err)}` }
  }
}
