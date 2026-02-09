// ============================================================
// Deployer Service — UIUX 生成代碼 → Next.js → Vercel 部署
// ============================================================

import { execFile } from 'child_process'
import { promisify } from 'util'
import * as os from 'os'
import * as path from 'path'
import * as fsPromises from 'fs/promises'
import Anthropic from '@anthropic-ai/sdk'
import * as db from '../db/client'

const execFileAsync = promisify(execFile)

const VERCEL_API = 'https://api.vercel.com'

// ============================================================
// 部署並發限流器（防止同時跑太多 npm install + next build）
// ============================================================

const DEPLOY_MAX_CONCURRENT = parseInt(process.env.DEPLOY_MAX_CONCURRENT || '3', 10)
let deployActiveCount = 0
const deployWaitQueue: Array<() => void> = []

async function acquireDeploySlot(): Promise<void> {
  if (deployActiveCount < DEPLOY_MAX_CONCURRENT) {
    deployActiveCount++
    return
  }
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      const idx = deployWaitQueue.indexOf(cb)
      if (idx >= 0) deployWaitQueue.splice(idx, 1)
      reject(new Error('Deploy slot acquisition timeout (5min)'))
    }, 300_000)
    const cb = () => { clearTimeout(timer); deployActiveCount++; resolve() }
    deployWaitQueue.push(cb)
  })
}

function releaseDeploySlot(): void {
  deployActiveCount--
  if (deployWaitQueue.length > 0) {
    const next = deployWaitQueue.shift()!
    next()
  }
}

/** 取得部署並發狀態（供監控用） */
export function getDeployConcurrencyStats() {
  return { active: deployActiveCount, queued: deployWaitQueue.length, max: DEPLOY_MAX_CONCURRENT }
}

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
  deployedCode?: GeneratedCode  // build 修復後實際部署的代碼（用於同步回 DB/FlowState）
}

export type ProgressCallback = (progress: {
  percent: number
  step: string
}) => Promise<void>

// ============================================================
// Anthropic Client（複用 quality-gate.ts 的模式）
// ============================================================

let anthropicClient: Anthropic | null = null

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('缺少 CLAUDE_API_KEY 或 ANTHROPIC_API_KEY')
    }
    anthropicClient = new Anthropic({ apiKey })
  }
  return anthropicClient
}

// ============================================================
// 本地 Build 驗證 — 類型定義
// ============================================================

interface BuildError {
  type: 'typescript' | 'module_not_found' | 'syntax' | 'unknown'
  message: string
  file?: string
  line?: number
}

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

/**
 * 將專案名稱轉換為 Vercel 合法的 project slug
 * Vercel 規則：只允許 a-z、0-9、連字號，最長 100 字元
 */
export function toVercelSlug(name: string, projectId?: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')  // 非英數字母（含中文）全部轉連字號
    .replace(/-+/g, '-')          // 多個連字號合併
    .replace(/^-|-$/g, '')        // 去頭尾連字號
    .slice(0, 30)

  if (slug.length >= 3) return slug

  // 專案名全是中文或特殊字元 → 用 projectId 前 8 碼
  if (projectId) {
    return `tc-${projectId.replace(/-/g, '').slice(0, 8)}`
  }
  return 'tellcraft-project'
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

  // ── 修復 5: Tailwind v4 CSS 語法 → v3 相容 ──
  if (/@theme\s*\{/.test(sanitized.styles) || /@import\s*["']tailwindcss/.test(sanitized.styles)) {
    // @import "tailwindcss" 移除
    sanitized.styles = sanitized.styles.replace(/@import\s*["']tailwindcss(?:\/[^"']*)?["']\s*;?\s*/g, '')
    // @theme {} → :root {}
    sanitized.styles = sanitized.styles.replace(/@theme\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g, (_m, inner: string) => {
      const trimmed = inner.trim()
      return trimmed.length > 0 ? `:root {\n${trimmed}\n}` : ''
    })
    // @utility/@variant/@custom-variant 移除
    sanitized.styles = sanitized.styles.replace(/@(?:utility|variant|custom-variant)\s+[\w-]+\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/g, '')
    fixes.push(`globals.css: 移除 Tailwind v4 語法（@theme/@import tailwindcss）`)
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

  const slug = toVercelSlug(project.name, projectId)

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
    // 1. 取得專案名稱
    await onProgress({ percent: 5, step: '準備部署...' })
    const project = await db.getProject(projectId)
    const projectName = toVercelSlug(project?.name || '', projectId)

    // 2. 本地 Build 驗證（5-40%）
    const buildResult = await verifyBuildLocally(
      code,
      projectName,
      tailwindConfig,
      options?.extraDependencies,
      options?.injectedFiles,
      onProgress
    )

    const files = buildResult.files

    if (buildResult.fixes.length > 0) {
      console.log(`[Deployer] Build 驗證修復: ${buildResult.fixes.join('; ')}`)
    }
    if (!buildResult.buildVerified) {
      console.warn('[Deployer] Build 驗證未通過，使用降級部署')
    }

    // 3. 建立 Vercel Project（50%）
    await onProgress({ percent: 50, step: '建立 Vercel 專案...' })
    const vercelProject = await createVercelProject(projectName)
    if (!vercelProject) {
      // 已存在的話繼續部署
      console.log(`[Deployer] Vercel project "${projectName}" 可能已存在，繼續部署`)
    }

    // 4. 部署檔案（70%）
    await onProgress({ percent: 70, step: '上傳並部署到 Vercel...' })
    const deployment = await deployFilesToVercel(projectName, files)
    if (!deployment) {
      return { success: false, error: '部署到 Vercel 失敗，請稍後再試。' }
    }

    // 5. 等待部署就緒（90%）
    await onProgress({ percent: 90, step: '等待部署完成...' })
    const readyDeployment = await waitForDeploymentReady(deployment.id)

    const deploymentUrl = `https://${deployment.url}`
    const finalStatus = readyDeployment?.readyState || deployment.readyState

    if (readyDeployment?.readyState === 'ERROR') {
      return { success: false, error: 'Vercel 建置失敗，請檢查代碼。', vercelDeploymentId: deployment.id }
    }

    // 6. 更新 DB（95-100%）
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

    // 7. 將 build 修復後的代碼同步回 project_files（確保預覽和部署一致）
    const deployedCode = buildResult.finalCode
    try {
      const fileRows: { filePath: string; content: string; description?: string; fileType: string }[] = []
      for (const p of deployedCode.pages) {
        fileRows.push({ filePath: p.path, content: p.content, description: p.description, fileType: 'page' })
      }
      for (const c of deployedCode.components) {
        fileRows.push({ filePath: c.path, content: c.content, description: c.description, fileType: 'component' })
      }
      if (deployedCode.styles) {
        fileRows.push({ filePath: 'globals.css', content: deployedCode.styles, fileType: 'style' })
      }
      await db.upsertProjectFiles(projectId, 'uiux', fileRows)
      console.log(`[Deployer] 已同步 build 修復後的代碼到 project_files（${fileRows.length} 個檔案）`)
    } catch (syncErr) {
      console.error('[Deployer] 同步代碼到 project_files 失敗（不影響部署）:', syncErr)
    }

    await onProgress({ percent: 100, step: '部署完成！' })

    return {
      success: true,
      deploymentUrl,
      vercelDeploymentId: deployment.id,
      deployedCode,
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

  // next.config.ts — ESLint 錯誤忽略（LLM 生成代碼 lint 不保證通過）
  // TypeScript 錯誤由本地 build 驗證修復，不再用 ignoreBuildErrors
  files.push({
    file: 'next.config.ts',
    data: `import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
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
    .replace(/@import\s*["']tailwindcss["']\s*;?\s*/g, '') // 移除 v4 @import 語法
    .replace(/@import\s*["']tailwindcss\/[^"']*["']\s*;?\s*/g, '') // 移除 v4 子路徑 @import（如 tailwindcss/theme）

  // 移除 Tailwind v4 的 @theme {} 區塊 → 轉換為 :root {}（保留 CSS 自訂屬性）
  stylesContent = stylesContent.replace(/@theme\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g, (_match, inner: string) => {
    const trimmed = inner.trim()
    if (trimmed.length === 0) return ''
    // @theme 裡面的自訂屬性（--color-xxx: ...）轉到 :root
    return `:root {\n${trimmed}\n}`
  })

  // 移除其他 Tailwind v4 指令（@utility, @variant, @custom-variant）
  stylesContent = stylesContent.replace(/@(?:utility|variant|custom-variant)\s+[\w-]+\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/g, '')

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
  // 這些頂層目錄直接放根目錄，不加 components/ 前綴
  const ROOT_LEVEL_DIRS = ['app/', 'lib/', 'hooks/', 'utils/', 'types/', 'context/', 'stores/', 'data/', 'config/']
  let hasCustomLayout = false
  for (const comp of code.components) {
    const cleanPath = comp.path.replace(/^(components\/)?/, '')

    if (cleanPath === 'app/layout.tsx' || cleanPath === 'app/layout.ts') {
      hasCustomLayout = true
    }

    // 頂層目錄放到對應位置（不加 components/ 前綴）
    if (ROOT_LEVEL_DIRS.some(dir => cleanPath.startsWith(dir))) {
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
      // 409 表示已存在，需要確保 Deployment Protection 已關閉
      if (response.status === 409) {
        console.log(`[Deployer] Vercel project "${name}" 已存在，確保公開存取`)
        await disableDeploymentProtection(name)
        return null
      }
      console.error(`[Deployer] 建立 Vercel Project 失敗: ${errorText}`)
      return null
    }

    // 新建專案後關閉 Deployment Protection
    await disableDeploymentProtection(name)

    return await response.json() as VercelProject
  } catch (err) {
    console.error('[Deployer] 建立 Vercel Project 錯誤:', err)
    return null
  }
}

/**
 * 關閉 Vercel 專案的 Deployment Protection，讓所有人都能訪問
 */
async function disableDeploymentProtection(projectName: string): Promise<void> {
  const token = process.env.VERCEL_ACCESS_TOKEN!
  const teamId = process.env.VERCEL_TEAM_ID

  const params = new URLSearchParams()
  if (teamId) params.append('teamId', teamId)

  try {
    const response = await fetch(`${VERCEL_API}/v9/projects/${encodeURIComponent(projectName)}?${params}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ssoProtection: null,
        passwordProtection: null,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.warn(`[Deployer] 關閉 Deployment Protection 失敗: ${errorText}`)
    } else {
      console.log(`[Deployer] 已關閉 "${projectName}" 的 Deployment Protection`)
    }
  } catch (err) {
    console.warn('[Deployer] 關閉 Deployment Protection 異常:', err)
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
        target: 'production',
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

// ============================================================
// 本地 Build 驗證 — 部署前 next build + LLM 自動修復
// ============================================================

/** 源碼檔案副檔名（retry 時只重寫這些） */
const SOURCE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.css']

/** 判斷是否是源碼檔案（非 config/package.json） */
function isSourceFile(filePath: string): boolean {
  return SOURCE_EXTENSIONS.some(ext => filePath.endsWith(ext))
}

/**
 * 將 VercelFile[] 完整寫入磁碟目錄
 */
async function writeFilesToTempDir(dir: string, files: VercelFile[]): Promise<void> {
  for (const f of files) {
    const fullPath = path.join(dir, f.file)
    await fsPromises.mkdir(path.dirname(fullPath), { recursive: true })
    await fsPromises.writeFile(fullPath, f.data, 'utf-8')
  }
}

/**
 * 只重寫源碼檔案（node_modules、config、package.json 保留）
 */
async function writeSourceFilesOnly(dir: string, files: VercelFile[]): Promise<void> {
  for (const f of files) {
    if (isSourceFile(f.file)) {
      const fullPath = path.join(dir, f.file)
      await fsPromises.mkdir(path.dirname(fullPath), { recursive: true })
      await fsPromises.writeFile(fullPath, f.data, 'utf-8')
    }
  }
}

/**
 * 執行 npm install（timeout 120s）
 */
async function runNpmInstall(dir: string): Promise<{ success: boolean; output: string }> {
  try {
    const { stdout, stderr } = await execFileAsync('npm', ['install', '--no-audit', '--no-fund'], {
      cwd: dir,
      timeout: 120_000,
      env: { ...process.env, NODE_ENV: 'development' },
    })
    return { success: true, output: stdout + '\n' + stderr }
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string; message?: string }
    return { success: false, output: (error.stdout || '') + '\n' + (error.stderr || '') + '\n' + (error.message || '') }
  }
}

/**
 * 執行 next build（timeout 180s，限制記憶體 1536MB）
 */
async function runNextBuild(dir: string): Promise<{ success: boolean; output: string }> {
  try {
    const { stdout, stderr } = await execFileAsync(
      path.join(dir, 'node_modules', '.bin', 'next'),
      ['build'],
      {
        cwd: dir,
        timeout: 180_000,
        env: {
          ...process.env,
          NODE_OPTIONS: '--max-old-space-size=1536',
          NODE_ENV: 'production',
        },
        maxBuffer: 10 * 1024 * 1024, // 10MB
      }
    )
    return { success: true, output: stdout + '\n' + stderr }
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string; message?: string }
    return { success: false, output: (error.stdout || '') + '\n' + (error.stderr || '') + '\n' + (error.message || '') }
  }
}

/**
 * 解析 next build 輸出中的錯誤
 *
 * Next.js build 錯誤格式：
 *   ./app/page.tsx
 *   12:5  Type error: Property 'foo' does not exist on type 'X'.
 *
 *   Module not found: Can't resolve 'some-package'
 *
 *   SyntaxError: Unexpected token ...
 */
function parseBuildErrors(output: string): BuildError[] {
  const errors: BuildError[] = []
  const seen = new Set<string>()

  // Pattern 1: TypeScript errors — ./path 後跟 line:col Type error: ...
  const tsErrorRegex = /\.\/([^\n]+)\n\s*(\d+):(\d+)\s+Type error:\s*(.+)/g
  let match
  while ((match = tsErrorRegex.exec(output)) !== null) {
    const key = `ts:${match[1]}:${match[2]}:${match[4]}`
    if (!seen.has(key)) {
      seen.add(key)
      errors.push({
        type: 'typescript',
        file: match[1],
        line: parseInt(match[2]),
        message: match[4].trim(),
      })
    }
  }

  // Pattern 2: Module not found — 同時嘗試捕捉來源檔案
  const moduleRegex = /Module not found:\s*Can't resolve\s*['"]([^'"]+)['"]/g
  while ((match = moduleRegex.exec(output)) !== null) {
    const key = `module:${match[1]}`
    if (!seen.has(key)) {
      seen.add(key)
      // 回溯找來源檔案（Next.js 格式：./app/page.tsx 在錯誤行之前）
      const preceding = output.slice(Math.max(0, match.index - 300), match.index)
      const fileMatch = preceding.match(/\.\/([^\n]+?\.(?:tsx?|jsx?|css))\s*$/m)
      errors.push({
        type: 'module_not_found',
        message: `Module not found: Can't resolve '${match[1]}'`,
        file: fileMatch ? fileMatch[1].trim() : undefined,
      })
    }
  }

  // Pattern 3: Syntax errors
  const syntaxRegex = /SyntaxError:\s*(.+)/g
  while ((match = syntaxRegex.exec(output)) !== null) {
    const key = `syntax:${match[1]}`
    if (!seen.has(key)) {
      seen.add(key)
      errors.push({
        type: 'syntax',
        message: match[1].trim(),
      })
    }
  }

  // Pattern 4: Next.js ⨯ 前綴的錯誤（如 ⨯ ./app/page.tsx）
  const nextjsErrorRegex = /⨯\s+(.+)/g
  while ((match = nextjsErrorRegex.exec(output)) !== null) {
    const msg = match[1].trim()
    const isDup = errors.some(e => msg.includes(e.message) || e.message.includes(msg))
    if (!isDup) {
      const key = `nextjs:${msg}`
      if (!seen.has(key)) {
        seen.add(key)
        errors.push({ type: 'unknown', message: msg })
      }
    }
  }

  // Pattern 5: Generic Error: 格式
  const buildErrorRegex = /Error:\s*(.+)/g
  while ((match = buildErrorRegex.exec(output)) !== null) {
    const msg = match[1].trim()
    // 避免重複（已被上面的 pattern 捕捉）
    const isDup = errors.some(e => msg.includes(e.message) || e.message.includes(msg))
    if (!isDup) {
      const key = `unknown:${msg}`
      if (!seen.has(key)) {
        seen.add(key)
        errors.push({ type: 'unknown', message: msg })
      }
    }
  }

  // Pattern 6: TypeScript 錯誤的替代格式（不帶 "Type error:" 前綴）
  // e.g., "./components/foo.tsx (12,5): error TS2304: Cannot find name 'xxx'"
  const tsAltRegex = /\.\/([^\s(]+)\s*\((\d+),\d+\):\s*error\s+TS\d+:\s*(.+)/g
  while ((match = tsAltRegex.exec(output)) !== null) {
    const key = `tsalt:${match[1]}:${match[2]}:${match[3]}`
    if (!seen.has(key)) {
      seen.add(key)
      errors.push({
        type: 'typescript',
        file: match[1],
        line: parseInt(match[2]),
        message: match[3].trim(),
      })
    }
  }

  // Pattern 7: Webpack CSS/PostCSS 錯誤
  // "Import trace for requested module:\n./app/globals.css" + "Build failed because of webpack errors"
  if (output.includes('Build failed because of webpack errors')) {
    // 嘗試從 Import trace 提取出問題 CSS 檔案
    const cssTraceRegex = /Import trace for requested module:\s*\n\s*\.\/([^\n]+\.css)/g
    while ((match = cssTraceRegex.exec(output)) !== null) {
      const cssFile = match[1].trim()
      const key = `webpack-css:${cssFile}`
      if (!seen.has(key)) {
        seen.add(key)
        errors.push({
          type: 'syntax',
          file: cssFile,
          message: `CSS/PostCSS 處理失敗: ${cssFile}（可能包含不支援的 Tailwind v4 語法如 @theme, @utility）`,
        })
      }
    }
    // 如果沒抓到具體檔案，至少報一個 webpack 錯誤
    if (!errors.some(e => e.message.includes('CSS/PostCSS'))) {
      const key = 'webpack:generic'
      if (!seen.has(key)) {
        seen.add(key)
        errors.push({
          type: 'syntax',
          message: 'Build failed because of webpack errors（CSS 處理失敗）',
        })
      }
    }
  }

  return errors
}

/**
 * 解析 npm install 錯誤中的壞依賴
 * 回傳需要移除的套件名稱
 */
function parseInstallErrors(output: string): string[] {
  const badPkgs: string[] = []
  // npm ERR! 404 Not Found - GET https://registry.npmjs.org/some-package
  const notFoundRegex = /npm ERR!.*404.*registry\.npmjs\.org\/([^\s/]+)/g
  let match
  while ((match = notFoundRegex.exec(output)) !== null) {
    badPkgs.push(match[1])
  }
  // npm ERR! Could not resolve dependency
  const resolveRegex = /Could not resolve dependency.*\n.*peer\s+(\S+)@/g
  while ((match = resolveRegex.exec(output)) !== null) {
    badPkgs.push(match[1])
  }
  return [...new Set(badPkgs)]
}

/**
 * 用 LLM (Haiku) 修復 build 錯誤
 * 回傳修復後的代碼和可能的新依賴
 */
async function fixBuildErrors(
  code: GeneratedCode,
  errors: BuildError[],
  buildOutput: string,
  currentDeps: Record<string, string>
): Promise<{ code: GeneratedCode; newDependencies: Record<string, string> } | null> {
  const client = getAnthropicClient()

  // 組合所有代碼供 LLM 修復
  const codeBlocks: string[] = []
  for (const page of code.pages) {
    codeBlocks.push(`\`\`\`tsx:${page.path}\n${page.content}\n\`\`\``)
  }
  for (const comp of code.components) {
    const ext = comp.path.endsWith('.ts') ? 'ts' : 'tsx'
    codeBlocks.push(`\`\`\`${ext}:${comp.path}\n${comp.content}\n\`\`\``)
  }
  if (code.styles) {
    codeBlocks.push(`\`\`\`css:globals.css\n${code.styles}\n\`\`\``)
  }

  const errorList = errors.map(e => {
    let desc = `- [${e.type}] ${e.message}`
    if (e.file) desc += ` (in ${e.file}${e.line ? `:${e.line}` : ''})`
    // 標記內部模組 vs 外部模組
    if (e.type === 'module_not_found') {
      const moduleName = e.message.match(/Can't resolve '([^']+)'/)?.[1] || ''
      if (moduleName.startsWith('@/') || moduleName.startsWith('./') || moduleName.startsWith('../')) {
        desc += ' ← **專案內部檔案缺失，需要生成此檔案**'
      }
    }
    return desc
  }).join('\n')

  // 取 build output 最後 2000 字元作為上下文
  const outputTail = buildOutput.length > 2000
    ? '...\n' + buildOutput.slice(-2000)
    : buildOutput

  const depsList = Object.entries(currentDeps).map(([k, v]) => `  "${k}": "${v}"`).join(',\n')

  const prompt = `你是 Next.js build 錯誤修復專家。以下代碼在 \`next build\` 時出錯，請修復。

## 規則
1. **只修復 build 錯誤**，不要改變任何設計、佈局、功能或樣式
2. 保持所有現有代碼結構不變
3. 動畫庫用 \`motion/react\`（不是 framer-motion）
4. 路徑別名用 \`@/\`（對應專案根目錄）
5. 輸出修復後的完整檔案（\`\`\`tsx:path 或 \`\`\`css:path 或 \`\`\`ts:path 格式）
6. 如果需要新增第三方 npm 依賴，在最後附上 \`\`\`json:NEW_DEPENDENCIES 區塊，格式如 {"package-name": "^version"}
7. 如果錯誤是找不到**第三方 npm 模組**，先確認是否拼寫錯誤或可用其他方式實現，最後才新增依賴
8. **如果錯誤是找不到 \`@/\` 開頭的專案內部模組**（如 \`@/components/xxx\`、\`@/lib/xxx\`）：
   - 這些是專案內部檔案，**不是** npm 套件，不要加到 NEW_DEPENDENCIES
   - 你必須**生成缺失的組件/工具檔案**
   - 根據 import 語句在其他檔案中的使用方式（props、調用方式）推斷該組件的功能和介面
   - 路徑映射：\`@/components/xxx\` → 輸出 \`\`\`tsx:components/xxx.tsx\`\`\`
   - 路徑映射：\`@/lib/xxx\` → 輸出 \`\`\`ts:lib/xxx.ts\`\`\`
   - 動畫相關組件使用 \`motion/react\`（不是 framer-motion）
   - export 方式必須與 import 語句一致（named export 或 default export）
   - 組件必須包含 \`'use client'\` 如果使用了 hooks 或 motion
9. **如果錯誤是 CSS/PostCSS 處理失敗**（webpack errors related to globals.css）：
   - 移除所有 Tailwind v4 語法：\`@theme {}\`、\`@import "tailwindcss"\`、\`@utility\`、\`@variant\`
   - 將 \`@theme { --color-xxx: ...; }\` 轉換為 \`:root { --color-xxx: ...; }\`
   - 確保使用 Tailwind v3 指令：\`@tailwind base;\`、\`@tailwind components;\`、\`@tailwind utilities;\`
   - \`@apply\` 語法可以保留（Tailwind v3 支援）
   - 移除任何不合法的 CSS 語法

## Build 錯誤
${errorList}

## Build 輸出（尾部）
\`\`\`
${outputTail}
\`\`\`

## 當前 package.json dependencies
\`\`\`json
{
${depsList}
}
\`\`\`

## 原始代碼
${codeBlocks.join('\n\n')}

請輸出所有需要**修改或新建**的檔案。未改動的現有檔案不需要輸出。
對於缺失的 @/ 模組，**必須生成完整的新檔案**。`

  try {
    // 使用 streaming 避免 Anthropic SDK 的非串流超時限制
    const stream = client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 24000,
      messages: [{ role: 'user', content: prompt }],
    })
    const response = await stream.finalMessage()

    const content = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('\n')

    // 解析修復後的檔案（複用 quality-gate 的模式）
    const fixedCode = parseLLMFixedFiles(content, code)

    // 解析新依賴
    const newDependencies: Record<string, string> = {}
    const depsMatch = content.match(/```json:NEW_DEPENDENCIES\n([\s\S]*?)```/)
    if (depsMatch) {
      try {
        const parsed = JSON.parse(depsMatch[1].trim())
        for (const [pkg, ver] of Object.entries(parsed)) {
          if (typeof ver === 'string') {
            newDependencies[pkg] = ver
          }
        }
      } catch {
        // 解析失敗忽略
      }
    }

    return { code: fixedCode, newDependencies }
  } catch (error) {
    console.error('[Deployer] fixBuildErrors LLM 呼叫失敗:', error)
    return null
  }
}

/**
 * 解析 LLM 修復結果，合併回原始代碼結構
 */
function parseLLMFixedFiles(content: string, originalCode: GeneratedCode): GeneratedCode {
  const fileRegex = /```(?:tsx|ts|jsx|js|css):([^\n]+)\n([\s\S]*?)```/g

  const fixedPages = new Map<string, string>()
  const fixedComponents = new Map<string, string>()
  let fixedStyles = ''

  let match
  while ((match = fileRegex.exec(content)) !== null) {
    const filePath = match[1].trim()
    const fileContent = match[2].trim()

    if (filePath === 'globals.css' || filePath.endsWith('.css')) {
      fixedStyles = fileContent
    } else if (originalCode.pages.some(p => p.path === filePath)) {
      fixedPages.set(filePath, fileContent)
    } else {
      fixedComponents.set(filePath, fileContent)
    }
  }

  const result: GeneratedCode = {
    pages: originalCode.pages.map(p => ({
      ...p,
      content: fixedPages.get(p.path) || p.content,
    })),
    components: originalCode.components.map(c => ({
      ...c,
      content: fixedComponents.get(c.path) || c.content,
    })),
    styles: fixedStyles || originalCode.styles,
  }

  // 添加 LLM 生成的新檔案（缺失的組件/工具）
  for (const [filePath, fileContent] of fixedComponents) {
    if (!originalCode.components.some(c => c.path === filePath)) {
      console.log(`[Deployer] parseLLMFixedFiles 新增缺失組件: ${filePath}`)
      result.components.push({
        path: filePath,
        content: fileContent,
        description: `Auto-generated to fix build error: ${filePath}`,
      })
    }
  }
  for (const [filePath, fileContent] of fixedPages) {
    if (!originalCode.pages.some(p => p.path === filePath)) {
      console.log(`[Deployer] parseLLMFixedFiles 新增缺失頁面: ${filePath}`)
      result.pages.push({
        path: filePath,
        content: fileContent,
        description: `Auto-generated to fix build error: ${filePath}`,
      })
    }
  }

  return result
}

/**
 * 降級用：呼叫 wrapInNextJs 後恢復 ignoreBuildErrors: true
 */
function wrapInNextJsWithIgnoreErrors(
  code: GeneratedCode,
  projectName: string,
  tailwindConfig: string,
  extraDependencies?: Record<string, string>,
  injectedFiles?: { file: string; data: string }[]
): VercelFile[] {
  const files = wrapInNextJs(code, projectName, tailwindConfig, extraDependencies, injectedFiles)

  // 替換 next.config.ts，加回 ignoreBuildErrors: true
  const configIdx = files.findIndex(f => f.file === 'next.config.ts')
  if (configIdx >= 0) {
    files[configIdx].data = `import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
`
  }

  return files
}

/**
 * 本地 Build 驗證主函數
 *
 * 建臨時 Next.js 專案 → npm install → next build → 失敗則 LLM 修復 → 重試（最多 3 輪）
 * 全失敗則降級為 ignoreBuildErrors 部署
 */
async function verifyBuildLocally(
  code: GeneratedCode,
  projectName: string,
  tailwindConfig: string,
  extraDependencies?: Record<string, string>,
  injectedFiles?: { file: string; data: string }[],
  onProgress?: ProgressCallback
): Promise<{ files: VercelFile[]; buildVerified: boolean; fixes: string[]; finalCode: GeneratedCode }> {
  const MAX_ATTEMPTS = 3
  const tmpDir = path.join(os.tmpdir(), `tellcraft-build-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
  const fixes: string[] = []

  let currentCode = code
  let currentExtraDeps = { ...(extraDependencies || {}) }
  let slotAcquired = false

  // 限制同時執行的 build 數量（npm install + next build 非常吃資源）
  try {
    await acquireDeploySlot()
    slotAcquired = true
    await fsPromises.mkdir(tmpDir, { recursive: true })

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const files = wrapInNextJs(currentCode, projectName, tailwindConfig, currentExtraDeps, injectedFiles)

      if (attempt === 1) {
        // 首次：寫入所有檔案 + npm install
        await onProgress?.({ percent: 5, step: '構建驗證：寫入臨時專案...' })
        await writeFilesToTempDir(tmpDir, files)

        await onProgress?.({ percent: 10, step: '構建驗證：安裝依賴...' })
        let installResult = await runNpmInstall(tmpDir)

        if (!installResult.success) {
          // 嘗試解析並移除壞依賴
          const badPkgs = parseInstallErrors(installResult.output)
          if (badPkgs.length > 0) {
            console.log(`[Deployer] npm install 失敗，移除壞依賴: ${badPkgs.join(', ')}`)
            fixes.push(`移除無法安裝的依賴: ${badPkgs.join(', ')}`)
            for (const pkg of badPkgs) {
              delete currentExtraDeps[pkg]
            }
            // 重寫 package.json
            const fixedFiles = wrapInNextJs(currentCode, projectName, tailwindConfig, currentExtraDeps, injectedFiles)
            const pkgFile = fixedFiles.find(f => f.file === 'package.json')
            if (pkgFile) {
              await fsPromises.writeFile(path.join(tmpDir, 'package.json'), pkgFile.data, 'utf-8')
            }
            installResult = await runNpmInstall(tmpDir)
          }

          if (!installResult.success) {
            console.error('[Deployer] npm install 最終失敗，降級部署')
            fixes.push('npm install 失敗，降級為 ignoreBuildErrors 部署')
            return {
              files: wrapInNextJsWithIgnoreErrors(currentCode, projectName, tailwindConfig, currentExtraDeps, injectedFiles),
              buildVerified: false,
              fixes,
              finalCode: currentCode,
            }
          }
        }
      } else {
        // 重試：只重寫源碼（保留 node_modules）
        await onProgress?.({ percent: 10 + attempt * 8, step: `構建驗證：第 ${attempt} 次修復後重新構建...` })
        await writeSourceFilesOnly(tmpDir, files)

        // 如果有新依賴需要安裝
        if (Object.keys(currentExtraDeps).length > 0) {
          const pkgFile = files.find(f => f.file === 'package.json')
          if (pkgFile) {
            await fsPromises.writeFile(path.join(tmpDir, 'package.json'), pkgFile.data, 'utf-8')
          }
          await runNpmInstall(tmpDir)
        }
      }

      // 執行 next build
      await onProgress?.({ percent: 15 + attempt * 8, step: `構建驗證：執行 next build（第 ${attempt} 次）...` })
      const buildResult = await runNextBuild(tmpDir)

      if (buildResult.success) {
        console.log(`[Deployer] Build 驗證通過（第 ${attempt} 次）`)
        if (attempt > 1) {
          fixes.push(`第 ${attempt} 次構建通過（AI 自動修復成功）`)
        }
        await onProgress?.({ percent: 40, step: '構建驗證通過！' })
        return {
          files: wrapInNextJs(currentCode, projectName, tailwindConfig, currentExtraDeps, injectedFiles),
          buildVerified: true,
          fixes,
          finalCode: currentCode,
        }
      }

      // Build 失敗 — 解析錯誤
      console.log(`[Deployer] Build 失敗（第 ${attempt} 次），解析錯誤...`)
      const buildErrors = parseBuildErrors(buildResult.output)
      console.log(`[Deployer] 發現 ${buildErrors.length} 個 build 錯誤:`, buildErrors.map(e => e.message))

      if (buildErrors.length === 0) {
        // 印出 build output 尾部以便診斷未知錯誤格式
        const outputTail = buildResult.output.slice(-1500)
        console.warn('[Deployer] Build 失敗但無法解析錯誤，build output 尾部:\n', outputTail)
        fixes.push('Build 失敗但無法解析錯誤類型')
        break
      }

      if (attempt < MAX_ATTEMPTS) {
        // LLM 修復
        await onProgress?.({ percent: 20 + attempt * 8, step: `AI 修復構建錯誤（第 ${attempt} 次）...` })

        const allDeps = { ...BASE_DEPS, ...currentExtraDeps }
        const fixResult = await fixBuildErrors(currentCode, buildErrors, buildResult.output, allDeps)

        if (!fixResult) {
          console.warn('[Deployer] LLM 修復失敗，繼續下一輪')
          fixes.push(`第 ${attempt} 次 AI 修復失敗`)
          continue
        }

        currentCode = fixResult.code
        if (Object.keys(fixResult.newDependencies).length > 0) {
          currentExtraDeps = { ...currentExtraDeps, ...fixResult.newDependencies }
          fixes.push(`AI 新增依賴: ${Object.keys(fixResult.newDependencies).join(', ')}`)
        }
        fixes.push(`第 ${attempt} 次 AI 修復了 ${buildErrors.length} 個錯誤`)
      }
    }

    // 3 次都失敗 → 降級
    console.warn('[Deployer] 3 次 build 都失敗，降級為 ignoreBuildErrors 部署')
    fixes.push('3 次構建驗證都失敗，降級為忽略構建錯誤部署')
    return {
      files: wrapInNextJsWithIgnoreErrors(currentCode, projectName, tailwindConfig, currentExtraDeps, injectedFiles),
      buildVerified: false,
      fixes,
      finalCode: currentCode,
    }
  } catch (err) {
    console.error('[Deployer] verifyBuildLocally 異常:', err)
    fixes.push(`構建驗證異常：${err instanceof Error ? err.message : String(err)}`)
    return {
      files: wrapInNextJsWithIgnoreErrors(code, projectName, tailwindConfig, extraDependencies, injectedFiles),
      buildVerified: false,
      fixes,
      finalCode: code,
    }
  } finally {
    if (slotAcquired) releaseDeploySlot()
    // 清理臨時目錄
    try {
      await fsPromises.rm(tmpDir, { recursive: true, force: true })
    } catch (cleanupErr) {
      console.error(`[Deployer] 清理臨時目錄失敗: ${tmpDir}`, cleanupErr)
    }
  }
}
