// ============================================================
// Deployer Service — UIUX 生成代碼 → Next.js → Vercel 部署
// ============================================================

import { execFile } from 'child_process'
import { promisify } from 'util'
import * as os from 'os'
import * as path from 'path'
import * as fsPromises from 'fs/promises'
import { getAnthropicClient, MODEL, trackLlmUsage } from '../lib/anthropic'
import { getEnv } from '../lib/env'
import { autoSwapButtonContrast } from './deployer-fixes/contrast-auto-swap'
import type { DesignSystem } from './uiux-generation'
import * as db from '../db/client'
import { createLogger } from '../lib/logger'
import { repairMissingReactImports, repairBracketLookupAccess } from './uiux-generation'
import { sanitizeNamedImports } from '../utils/sanitize-named-imports'
import { inferFileType } from '../workers/orchestrator-utils'
import { recordTelemetry, recordTelemetryBatch, categorizeSanitizeFix, truncateFeedback } from './skill-telemetry'
import {
  buildAttributionBlock,
  extractUsedUnsplashAssets,
  triggerUnsplashDownloads,
  type ImageLibrary,
  type ImageCategory,
} from './image-library-service'

// ============================================================
// 客戶 app 的 next.config images.remotePatterns
// （允許 picsum.photos, images.unsplash.com, placehold.co）
// wrapInNextJs 和 wrapInNextJsWithIgnoreErrors 共用此常數
// ============================================================
const CLIENT_APP_IMAGE_REMOTE_PATTERNS = `    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'placehold.co' },
    ],`

const logger = createLogger('deployer')
const execFileAsync = promisify(execFile)

const VERCEL_API = 'https://api.vercel.com'

// ============================================================
// 部署並發限流器（防止同時跑太多 npm install + next build）
// ============================================================

const DEPLOY_MAX_CONCURRENT = getEnv().DEPLOY_MAX_CONCURRENT
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

export interface VercelFile {
  file: string
  data: string
}

export interface VercelProject {
  id: string
  name: string
}

export interface VercelDeployment {
  id: string
  url: string
  state: string
  readyState: string
}

export interface SiteMetadata {
  title: string
  description: string
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
  // Coder Skill 常用（後端邏輯）
  'bcryptjs': '^3.0.3',
  'jsonwebtoken': '^9.0.2',
  'next-auth': '5.0.0-beta.30',
  '@vercel/blob': '^0.20.0',
  'resend': '^4.0.0',
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
  next: '^16.0.0',
  react: '^19.0.0',
  'react-dom': '^19.0.0',
  motion: '^12.0.0',  // 防雷 2026-05-17：npm motion 沒 v11（從 framer-motion rename 後 v10 跳 v12），^11 會 install fail → dev server 缺套件 → Tailwind 也 build 不出來
  tailwindcss: '^3.4.0',
  postcss: '^8.4.0',
  autoprefixer: '^10.0.0',
  '@neondatabase/serverless': '^0.10.0',
}

const LEGACY_UPLOAD_BASE_URLS = [
  'https://api.tellcraft.com/uploads/tellcraft',
  'http://api.tellcraft.com/uploads/tellcraft',
  'http://54.238.4.117/uploads/tellcraft',
  'http://54.238.4.117:8080/uploads/tellcraft',
]

function normalizeUploadBaseUrl(baseUrl?: string | null): string {
  return (baseUrl || '').trim().replace(/\/+$/, '')
}

function rewriteLegacyUploadUrl(content: string, targetBaseUrl: string): { content: string; replacements: number } {
  if (!targetBaseUrl) return { content, replacements: 0 }

  let nextContent = content
  let replacements = 0

  for (const legacyBaseUrl of LEGACY_UPLOAD_BASE_URLS) {
    if (!legacyBaseUrl || legacyBaseUrl === targetBaseUrl) continue
    const pattern = new RegExp(legacyBaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    nextContent = nextContent.replace(pattern, () => {
      replacements += 1
      return targetBaseUrl
    })
  }

  return { content: nextContent, replacements }
}

function normalizeGeneratedCodeUploadUrls(code: GeneratedCode, targetBaseUrl: string): number {
  if (!targetBaseUrl) return 0

  let replacements = 0
  for (const page of code.pages) {
    const result = rewriteLegacyUploadUrl(page.content, targetBaseUrl)
    page.content = result.content
    replacements += result.replacements
  }
  for (const comp of code.components) {
    const result = rewriteLegacyUploadUrl(comp.content, targetBaseUrl)
    comp.content = result.content
    replacements += result.replacements
  }
  const styleResult = rewriteLegacyUploadUrl(code.styles || '', targetBaseUrl)
  code.styles = styleResult.content
  replacements += styleResult.replacements
  return replacements
}

/**
 * Strip Next.js route groups from file paths: app/(auth)/login/page.tsx → app/login/page.tsx
 */
function stripRouteGroups(filePath: string): string {
  return filePath.replace(/\([^)]+\)\//g, '')
}

/**
 * 去重路由衝突：strip route groups 後同路由的頁面只保留一份（後者覆蓋前者）
 */
function deduplicateRouteConflicts<T extends { path: string }>(files: T[]): T[] {
  const routeMap = new Map<string, T>()
  for (const f of files) {
    const normalized = stripRouteGroups(f.path).replace(/^\//, '')
    routeMap.set(normalized, f)
  }
  return Array.from(routeMap.values())
}

/**
 * 部署前代碼預檢 + 自動修復
 * 掃描所有已知的 build 失敗模式，自動修復後返回乾淨的代碼
 */
export function sanitizeCodeForDeploy(code: GeneratedCode, designSystem?: DesignSystem): SanitizeResult {
  const fixes: string[] = []
  const injectedFiles: { file: string; data: string }[] = []
  const extraDependencies: Record<string, string> = {}

  // 深拷貝避免修改原始代碼，同時 normalize 路徑（LLM 可能生成含 .. 的相對路徑）
  const normalizePath = (p: string) => path.normalize(p).replace(/\\/g, '/')

  // normalize + 去重（後者覆蓋前者；防止 app/a/../components/X.tsx 和 app/b/../components/X.tsx 都 normalize 成同路徑）
  const deduplicateByNormalizedPath = <T extends { path: string }>(files: T[]): T[] => {
    const seen = new Map<string, T>()
    for (const f of files) {
      seen.set(normalizePath(f.path), { ...f, path: normalizePath(f.path) })
    }
    return Array.from(seen.values())
  }

  const pathFixes: string[] = []
  for (const f of [...code.pages, ...code.components]) {
    const n = normalizePath(f.path)
    if (f.path !== n) pathFixes.push(`${f.path} → ${n}`)
  }

  // Route group 去重（pages 和 components 都處理）+ 路徑正規化
  const sanitized: GeneratedCode = {
    pages: deduplicateRouteConflicts(deduplicateByNormalizedPath(code.pages.map(p => ({ ...p, content: p.content })))),
    components: deduplicateRouteConflicts(deduplicateByNormalizedPath(code.components.map(c => ({ ...c, content: c.content })))),
    styles: code.styles,
  }

  if (pathFixes.length > 0) {
    fixes.push(`路徑正規化: ${pathFixes.join(', ')}`)
  }

  const normalizedUploadBaseUrl = normalizeUploadBaseUrl(process.env.UPLOAD_BASE_URL)
  const rewrittenUploadUrls = normalizeGeneratedCodeUploadUrls(sanitized, normalizedUploadBaseUrl)
  if (rewrittenUploadUrls > 0) {
    fixes.push(`圖片 URL 正規化 (${rewrittenUploadUrls} 處)`)
  }

  const allFiles = [...sanitized.pages, ...sanitized.components]
  let needsMotionHelper = false

  for (const file of allFiles) {
    // 後端檔案（Server Actions / lib / API Routes）跳過 React 特定修復
    const isBackendFile = /^['"]use server['"]/.test(file.content.trimStart())
      || file.path.startsWith('lib/')
      || file.path.startsWith('app/api/')

    // ── L35 修復 0: strip leading file-path 標頭 ──
    //   LLM 偶會把檔名 `app/admin/login/page.tsx` 當代碼寫在第一行 → SWC parser 拋
    //   "use client must be placed before other expressions"。先 strip 再判 use client。
    {
      const lines = file.content.split('\n')
      let stripped = 0
      // 從頭掃，連續移除「看起來像檔案路徑」的單獨行（不超過前 5 行）
      while (stripped < 5 && lines.length > 0) {
        const line = lines[0].trim()
        // 路徑樣式：含 `/` 且以 .ts/.tsx/.js/.jsx/.css 結尾，且不是 import/comment/JSX
        if (/^[\w./-]+\.(tsx?|jsx?|css|scss|md)$/.test(line) && line.includes('/')) {
          lines.shift()
          stripped++
          continue
        }
        // 第一行是空行就跳過繼續看
        if (line === '') { lines.shift(); continue }
        break
      }
      if (stripped > 0) {
        file.content = lines.join('\n')
        fixes.push(`${file.path}: 移除 ${stripped} 行 LLM 誤寫的檔案路徑標頭`)
      }
    }

    // ── 修復 0.5: lib/actions SQL 內重複 WHERE 條件 dedup ──
    // LLM 偶把 scopeColumn 與 filters[] 同欄位疊成 `WHERE col = $1 AND col = $2`，
    // BDD setup 用同 ID 還能過，runtime 帶 NULL filter 直接 0 rows 漏資料。
    if (file.path.startsWith('lib/actions/') && /\.(tsx?|jsx?)$/.test(file.path)) {
      const dedupRes = dedupeRedundantWhereClauses(file.content)
      if (dedupRes.count > 0) {
        file.content = dedupRes.content
        fixes.push(`${file.path}: 移除 ${dedupRes.count} 處重複的 WHERE 條件（同欄位 = 比較）`)
      }
    }

    // ── 修復 1: framer-motion → motion/react ──（對所有檔案安全）
    if (/from\s+['"]framer-motion['"]/.test(file.content)) {
      file.content = file.content.replace(
        /from\s+['"]framer-motion['"]/g,
        "from 'motion/react'"
      )
      fixes.push(`${file.path}: framer-motion → motion/react`)
    }

    // ── 修復 2: 缺少 'use client' ──（跳過後端檔案）
    if (!isBackendFile) {
      const needsClient =
        /\b(useState|useEffect|useRef|useCallback|useMemo|useContext|useReducer)\b/.test(file.content) ||
        /from\s+['"]motion\/react['"]/.test(file.content)
      const hasUseClient = /^['"]use client['"]/.test(file.content.trimStart())
      const hasUseServer = /^['"]use server['"]/.test(file.content.trimStart())
      if (needsClient && !hasUseClient && !hasUseServer) {
        file.content = "'use client'\n\n" + file.content
        fixes.push(`${file.path}: 自動加入 'use client'`)
      }
      // L35 補強：去重「重複的 'use client'」— 若 strip 後又有第二個 'use client' 在文件內
      const useClientCount = (file.content.match(/^['"]use client['"]\s*$/gm) || []).length
      if (useClientCount > 1) {
        // 保留第一個（最頂的），移除後續所有
        let firstSeen = false
        file.content = file.content.split('\n').filter(line => {
          if (/^['"]use client['"]\s*$/.test(line.trim())) {
            if (firstSeen) return false
            firstSeen = true
          }
          return true
        }).join('\n')
        fixes.push(`${file.path}: 移除重複的 'use client' (保留最頂的 1 個)`)
      }
    }

    // ── 修復 2.5: 缺少 React hooks import ──（跳過後端檔案）
    if (!isBackendFile) {
      const { content: importFixed, repaired: importRepaired } = repairMissingReactImports(file)
      if (importRepaired) {
        file.content = importFixed
        fixes.push(`${file.path}: 補缺失 React hooks import`)
      }
    }

    // ── 修復 2.6: page.tsx 跨界 import server-only 模組 ──
    // Tellcraft 架構規定：app/**/page.tsx 應透過 @/app/actions/* (Server Action wrapper)
    // 與後端互動，禁止直接 import @/lib/db 或 @/lib/actions/*。違規分兩類：
    //   (A) page 沒寫 'use client' + import @/lib/db → Server Component 直接查 DB
    //       → SSR 階段 DATABASE_URL 缺失或表空就直接 500（不像 Server Action 可 try/catch）
    //   (B) page 寫 'use client' + import @/lib/db → webpack 拒絕 build（ESM error）
    //
    // 偵測後改寫成正確 import：把 @/lib/actions/foo → @/app/actions/foo（同名 wrapper），
    // 或加 console.error 警告（無對應 wrapper 時）。改寫風險低於 build error，因 wrapper
    // 一定包含對應 lib action 的調用。
    const isPageFile = /^app\/.*\/page\.(tsx|jsx|ts|js)$/.test(file.path)
    if (isPageFile && !isBackendFile) {
      const libImportRe = /import\s+(?:[^'"]*?)\s+from\s+['"]@\/lib\/(db|actions\/[^'"]+)['"];?/g
      const libImports: string[] = []
      let m: RegExpExecArray | null
      while ((m = libImportRe.exec(file.content)) !== null) {
        libImports.push(m[1])
      }
      if (libImports.length > 0) {
        // 改寫 @/lib/actions/foo → @/app/actions/foo（per-action 同名 wrapper）
        // 注意：lib/db 沒有 client-safe 替代，無法自動修；只能 warn
        let rewriteCount = 0
        file.content = file.content.replace(
          /import\s+(\{[^}]+\})\s+from\s+['"]@\/lib\/actions\/([^'"]+)['"]/g,
          (match, namedImports, actionName) => {
            // 把 import { foo } 改成 import { fooAction }（wrapper 加 `Action` 後綴）
            const camelName = String(actionName).replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase())
            const remappedImports = String(namedImports).replace(
              /(\b)([a-zA-Z_$][\w$]*)(\b)/g,
              (_n, w1, name, w2) => {
                if (name === camelName) return `${w1}${name}Action${w2}`
                return _n
              }
            )
            rewriteCount++
            return `import ${remappedImports} from '@/app/actions/${actionName}'`
          }
        )
        if (rewriteCount > 0) {
          fixes.push(`${file.path}: 重寫 ${rewriteCount} 處跨界 @/lib/actions → @/app/actions（Server Component 防護）`)
        }
        if (libImports.includes('db')) {
          // page 直接 import lib/db 沒辦法自動修；強警告 + telemetry
          fixes.push(`${file.path}: ⚠ 偵測到 page.tsx 直接 import @/lib/db（Server Component 查 DB），若 DATABASE_URL 或表缺失將直接 SSR 500`)
        }
      }
    }

    // ── 修復 2.7: bracket lookup 可能回傳 undefined → 補 optional chaining ──
    const { content: lookupFixed, repaired: lookupRepaired } = repairBracketLookupAccess(file)
    if (lookupRepaired) {
      file.content = lookupFixed
      fixes.push(`${file.path}: 補 optional chaining（bracket lookup）`)
    }

    // ── 修復 2.8: 同一 JSX tag 內的重複 className attribute ──
    // LLM 偶會在同一個 <button>/<div> 等 tag 寫兩次 className（例：focus 樣式塞前面、
    // 排版樣式塞後面）。HTML 規範是「last wins」，runtime 不 crash，但前面的
    // focus-visible 等 class 永遠失效，留下隱藏的 a11y 漏洞。
    // 純 regex 行不通：JSX 屬性裡的 `onClick={() => fn()}` 帶 `>`，`[^<>]` 會被截斷。
    // 改用 brace-aware 掃描：定位所有 `className="..."`、檢查兩個之間是否仍在同一
    // JSX 開標籤內（brace-balanced 的情況下沒有真實的 `<` 或 `>`）。
    if (!isBackendFile) {
      const merge = mergeDuplicateClassNames(file.content)
      if (merge.count > 0) {
        file.content = merge.content
        fixes.push(`${file.path}: 合併 ${merge.count} 處重複的 className attribute`)
      }
    }

    // ── 修復 3: motion.* 上的 spread props（TypeScript 類型衝突）──（跳過後端檔案）
    // motion.button 的 onAnimationStart 與 React 的不相容，spread 所有 HTML props 會報錯
    if (!isBackendFile && /motion\.\w+/.test(file.content)) {
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

    // ── 修復 3.5: ?? 與 ||/&& 混用加括號（SWC 語法錯誤）──
    // SWC 要求 ?? 與 || / && 混用時必須加括號，否則 syntax error
    // Common LLM pattern: const x = A || B ?? fallback → const x = (A || B) ?? fallback
    {
      const origContent = file.content
      file.content = file.content.replace(
        /^(\s*(?:const|let|var)\s+\w+\s*=\s*)(.+?\s*(?:\|\||&&)\s*.+?)\s*(\?\?\s*.+)$/gm,
        (_match, prefix: string, logicalExpr: string, nullishPart: string) => {
          const trimExpr = logicalExpr.trim()
          // 已有外層括號則跳過
          if (trimExpr.startsWith('(') && trimExpr.endsWith(')')) return _match
          return `${prefix}(${trimExpr}) ${nullishPart.trim()}`
        }
      )
      if (file.content !== origContent) {
        fixes.push(`${file.path}: ?? 與 ||/&& 混用加括號修復`)
      }
    }

    // ── 修復 4: Google Fonts <link> 或 @import（應用 next/font）──
    if (/<link[^>]*fonts\.googleapis\.com/.test(file.content)) {
      file.content = file.content.replace(/<link[^>]*fonts\.googleapis\.com[^>]*\/?>/g, '')
      fixes.push(`${file.path}: 移除 Google Fonts <link>（應用 next/font）`)
    }

    // ── 修復 4.5: next/font 非 variable font 誤用 axes 參數 ──
    // Google Fonts 的 `axes` 參數只對 variable font 合法，LLM 常誤加到 Playfair Display / Lora 等
    // 固定字重字體上 → Next.js build 報 "Axes can only be defined for variable fonts"
    // 黑名單維護：Google Fonts 部分字體會升級為 variable，發現誤傷時從此移除即可
    {
      const NON_VARIABLE_FONTS = [
        'Playfair_Display', 'Lora', 'Merriweather', 'Instrument_Serif',
        'Libre_Baskerville', 'Cormorant_Garamond', 'DM_Serif_Display',
        'Cabin', 'Crimson_Pro', 'Cormorant', 'Gentium_Book_Plus',
      ]
      const fontCallRegex = new RegExp(
        `\\b(${NON_VARIABLE_FONTS.join('|')})\\s*\\(\\s*\\{([\\s\\S]*?)\\}\\s*\\)`,
        'g'
      )
      const removedFonts: string[] = []
      file.content = file.content.replace(fontCallRegex, (full, fontName: string, args: string) => {
        if (!/\baxes\s*:/.test(args)) return full
        // 依序清理：前逗號版本、後逗號版本、無逗號版本
        const newArgs = args
          .replace(/,\s*axes\s*:\s*\[[^\]]*\]/g, '')
          .replace(/axes\s*:\s*\[[^\]]*\]\s*,\s*/g, '')
          .replace(/axes\s*:\s*\[[^\]]*\]/g, '')
        removedFonts.push(fontName)
        return `${fontName}({${newArgs}})`
      })
      if (removedFonts.length > 0) {
        fixes.push(`${file.path}: 移除非 variable font 的 axes 參數（${[...new Set(removedFonts)].join(', ')}）`)
      }
    }

    // ── 修復 6: Next.js 15 async params/searchParams ──
    // Next.js 15 要求 page/layout 的 params 和 searchParams 為 Promise 類型
    // 檢測 `{ params: { xxx: string } }` 舊式同步寫法並自動轉換
    if (/\bparams\s*:\s*\{/.test(file.content) && !/params\s*:\s*Promise/.test(file.content)) {
      // 匹配: function Page({ params }: { params: { id: string } })
      // 或:    function Page(props: { params: { id: string } })
      const syncParamsPattern = /(\bparams\s*:\s*)(\{[^}]+\})/g
      if (syncParamsPattern.test(file.content)) {
        // 先標記，避免 regex 匹配到其他 params（如 searchParams）
        const isPageOrLayout = /export\s+(default\s+)?(async\s+)?function\s+\w*\s*\(/.test(file.content)
          && (file.path.includes('page') || file.path.includes('layout'))
        if (isPageOrLayout) {
          // 將 params: { id: string } → params: Promise<{ id: string }>
          file.content = file.content.replace(
            /(\bparams\s*:\s*)(\{[^}]+\})/g,
            '$1Promise<$2>'
          )
          // 如果函式不是 async，加上 async
          if (!/export\s+(default\s+)?async\s+function/.test(file.content)) {
            file.content = file.content.replace(
              /export\s+(default\s+)?function/,
              'export $1async function'
            )
          }
          // 在函式體開頭解構 await params
          // 找到函式的 { 並在下一行插入 await
          const paramNames = file.content.match(/params\s*:\s*Promise<\{([^}]+)\}>/)
          if (paramNames) {
            const fields = paramNames[1].split(',').map(f => f.split(':')[0].trim()).filter(Boolean)
            if (fields.length > 0) {
              // 替換直接使用 params.xxx 為解構
              const destructure = `  const { ${fields.join(', ')} } = await params`
              // 找函式體開頭（第一個 { 後的換行）
              const funcBodyMatch = file.content.match(/(export\s+(?:default\s+)?async\s+function\s+\w*\s*\([^)]*\)\s*\{)\s*\n/)
              if (funcBodyMatch) {
                file.content = file.content.replace(
                  funcBodyMatch[0],
                  funcBodyMatch[1] + '\n' + destructure + '\n'
                )
              }
            }
          }
          fixes.push(`${file.path}: Next.js 15 async params 修復`)
        }
      }
    }
  }

  // ── 修復 7: useSearchParams() 缺少 Suspense boundary（Next.js 15 要求）──
  // Next.js 15 要求 useSearchParams() 必須在 <Suspense> boundary 內
  // 對 page 檔案：提取內容為 Client 組件，page 改為包裹 Suspense 的 Server Component
  for (let i = 0; i < sanitized.pages.length; i++) {
    const page = sanitized.pages[i]
    const hasUseSearchParams = /\buseSearchParams\s*\(/.test(page.content)
    if (!hasUseSearchParams) continue

    // 從 path 推導組件名稱（如 app/page.tsx → PageClient, app/dashboard/page.tsx → DashboardClient）
    const pathParts = page.path.replace(/^app\//, '').replace(/\/page\.(tsx|ts)$/, '').split('/')
    const baseName = pathParts.length > 0 && pathParts[0] !== 'page' && pathParts[0] !== ''
      ? pathParts[pathParts.length - 1].replace(/^\w/, c => c.toUpperCase())
      : 'Home'
    const clientComponentName = `${baseName}Client`
    const clientComponentPath = page.path.replace(/page\.(tsx|ts)$/, `${clientComponentName}.tsx`)

    // 提取原始 page 內容作為 Client 組件
    let clientContent = page.content
    // 確保 Client 組件有 'use client'
    if (!/^['"]use client['"]/.test(clientContent.trimStart())) {
      clientContent = "'use client'\n\n" + clientContent
    }
    // 將 default export 改為 named export
    clientContent = clientContent.replace(
      /export\s+default\s+function\s+(\w+)/,
      `export default function ${clientComponentName}`
    )

    // 生成新的 Server Component page
    const newPageContent = `import { Suspense } from 'react'
import ${clientComponentName} from './${clientComponentName}'

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <${clientComponentName} />
    </Suspense>
  )
}
`

    // 更新 page 為 Server Component
    sanitized.pages[i] = { ...page, content: newPageContent }

    // 新增 Client 組件檔案
    sanitized.components.push({
      path: clientComponentPath,
      content: clientContent,
      description: `Client component extracted for Suspense boundary (useSearchParams)`,
    })

    fixes.push(`${page.path}: useSearchParams Suspense boundary 修復（提取 ${clientComponentName}）`)
    recordTelemetry({
      skillName: 'deployer', eventType: 'deployer_layer_trigger', patternKey: 'l5_suspense_split',
      outcome: 'repaired', phase: 'deployer_l5',
      payload: { filePath: page.path, clientComponent: clientComponentName },
    }).catch(() => {})
  }

  // CSS 中的 Google Fonts @import
  if (/@import\s+url\(['"]*https:\/\/fonts\.googleapis\.com/.test(sanitized.styles)) {
    sanitized.styles = sanitized.styles.replace(
      /@import\s+url\(['"]*https:\/\/fonts\.googleapis\.com[^)]*\)['"]*\s*;?\s*/g, ''
    )
    fixes.push(`globals.css: 移除 Google Fonts @import`)
  }

  // ── 修復 8: root layout 缺少 <html>/<body> 標籤 ──
  // LLM 可能生成 app/layout.tsx 但只有 Header/Footer 包裹，缺少 Next.js 必要的 <html> 和 <body>
  // Path 比對採用與 wrapInNextJs cleanPath 一致的邏輯，避免 layout.tsx / components/layout.tsx
  // / app/(group)/layout.tsx 等變體在這層漏掉。排除 [locale]、[slug] 等 dynamic segments（非 root layout）
  for (const file of [...sanitized.pages, ...sanitized.components]) {
    const cleanPath = stripRouteGroups(file.path.replace(/^(components\/)?/, ''))
    const isRootLayout =
      cleanPath === 'app/layout.tsx' ||
      cleanPath === 'app/layout.ts' ||
      cleanPath === 'layout.tsx' ||  // LLM 有時漏寫 app/ 前綴
      cleanPath === 'layout.ts'
    if (!isRootLayout) continue
    const hasHtml = /<html[\s>]/.test(file.content)
    const hasBody = /<body[\s>]/.test(file.content)
    if (hasHtml && hasBody) continue

    if (hasHtml && !hasBody) {
      // 有 <html> 沒 <body>：在 <html> 內層包一層 body
      file.content = file.content.replace(
        /(<html[^>]*>)([\s\S]*?)(<\/html>)/,
        '$1\n      <body>$2</body>\n    $3'
      )
      fixes.push(`${file.path}: 自動補上缺失的 <body> 標籤`)
    } else {
      // 沒有 <html>（也可能沒 <body>）：替換 Fragment 或 div wrapper 為 html+body
      let fixed = false

      // 情況 A：return (<> ... </>)  →  return (<html><body> ... </body></html>)
      if (!fixed && /return\s*\(\s*<>/.test(file.content)) {
        file.content = file.content.replace(
          /(<>)/,
          '<html lang="zh-TW">\n      <body>'
        )
        file.content = file.content.replace(
          /(<\/>)(\s*\)\s*$)/m,
          '</body>\n    </html>$2'
        )
        fixed = true
      }

      // 情況 B：return (<div ...> ... </div>)  →  把外層 div 換成 html+body
      if (!fixed && /return\s*\(\s*<div/.test(file.content)) {
        file.content = file.content.replace(
          /return\s*\(\s*<div[^>]*>/,
          'return (\n    <html lang="zh-TW">\n      <body>'
        )
        // 替換最後一個 </div> 為 </body></html>
        const lastDivIdx = file.content.lastIndexOf('</div>')
        if (lastDivIdx !== -1) {
          file.content = file.content.slice(0, lastDivIdx) + '</body>\n    </html>' + file.content.slice(lastDivIdx + 6)
        }
        fixed = true
      }

      // 情況 C：有 return ( 但不是 <> 或 <div —— 在 return ( 後包裹
      if (!fixed && /return\s*\(/.test(file.content)) {
        file.content = file.content.replace(
          /return\s*\(/,
          'return (\n    <html lang="zh-TW">\n      <body>'
        )
        // 找最後一個 ) 前加 </body></html>
        const lastParen = file.content.lastIndexOf(')')
        if (lastParen !== -1) {
          file.content = file.content.slice(0, lastParen) + '\n      </body>\n    </html>\n  ' + file.content.slice(lastParen)
        }
        fixed = true
      }

      // 情況 D：return <JSX> 無括號（LLM 常見寫法）→ 加括號同時包 html+body
      // 例：`return <main>{children}</main>` → `return (<html><body><main>...</main></body></html>)`
      if (!fixed && /return\s*<[A-Za-z]/.test(file.content)) {
        // 定位整個 return 語句到語句結束（下一個 } 之前是函式末尾）
        // 用 balanced approach：從 return 後的第一個 < 開始，找配對的 JSX 結尾
        const returnMatch = file.content.match(/(return\s*)(<[\s\S]*?)(\n\s*\}\s*$|\n\}\s*\n)/m)
        if (returnMatch) {
          const [full, returnKw, jsxBody, ending] = returnMatch
          // 去掉 jsxBody 尾部可能的分號與空白
          const cleanJsx = jsxBody.replace(/[;\s]+$/, '')
          const replaced = `${returnKw}(\n    <html lang="zh-TW">\n      <body>\n        ${cleanJsx}\n      </body>\n    </html>\n  )${ending}`
          file.content = file.content.replace(full, replaced)
          fixed = true
        }
      }

      // 情況 E：arrow function 直接返回（const Layout = ({children}) => <X>{children}</X>）
      if (!fixed && /=>\s*<[A-Za-z]/.test(file.content)) {
        file.content = file.content.replace(
          /(=>\s*)(<[\s\S]*?)(\n\s*$|\n(?=\w)|$)/m,
          (_m, arrow: string, jsx: string, tail: string) => {
            const cleanJsx = jsx.replace(/[;\s]+$/, '')
            return `${arrow}(\n    <html lang="zh-TW">\n      <body>\n        ${cleanJsx}\n      </body>\n    </html>\n  )${tail}`
          }
        )
        fixed = true
      }

      if (fixed) {
        const fixedParts: string[] = []
        if (!hasHtml) fixedParts.push('<html>')
        if (!hasBody) fixedParts.push('<body>')
        fixes.push(`${file.path}: 自動補上缺失的 ${fixedParts.join(' 和 ')} 標籤`)
      } else {
        // 任何 case 都抓不到 → 不強改（避免破壞代碼），只記錄讓 L3 LLM 修復接手
        fixes.push(`${file.path}: ⚠ 偵測到缺失 <html>/<body> 但無法自動修復，交給 L3 LLM`)
      }
    }
  }

  // ── 修復 5: Tailwind v4 CSS 語法 → v3 ──
  const beforeClean = sanitized.styles
  sanitized.styles = cleanTailwindV4Syntax(sanitized.styles)
  if (sanitized.styles !== beforeClean) {
    fixes.push(`globals.css: 清理 Tailwind v4 語法（@theme/@import/@apply font-*）`)
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
  // L34: dynamic import — bb0d1081 `await import('@vercel/blob')` 之前 regex 抓不到 → build 撞 Module not found
  const dynamicImportRegex = /\bimport\s*\(\s*['"]([^./][^'"]*)['"]\s*\)/g

  const collectDep = (raw: string, allowReactNext = true): void => {
    const pkg = raw.startsWith('@') ? raw.split('/').slice(0, 2).join('/') : raw.split('/')[0]
    if (basePkgs.has(pkg)) return
    if (allowReactNext && (pkg.startsWith('next/') || pkg.startsWith('react/') || pkg.startsWith('react-dom/'))) return
    if (pkg.startsWith('@types/') || pkg.startsWith('node:')) return
    if (KNOWN_PACKAGES[pkg]) {
      extraDependencies[pkg] = KNOWN_PACKAGES[pkg]
    } else if (pkg.startsWith('@radix-ui/')) {
      extraDependencies[pkg] = '^1.1.0'
    } else {
      fixes.push(`⚠️ 未知依賴 ${pkg}（不在 KNOWN_PACKAGES 中）`)
    }
  }

  for (const file of allFiles) {
    let m: RegExpExecArray | null
    importRegex.lastIndex = 0
    while ((m = importRegex.exec(file.content)) !== null) collectDep(m[1])
    requireRegex.lastIndex = 0
    while ((m = requireRegex.exec(file.content)) !== null) collectDep(m[1], false)
    dynamicImportRegex.lastIndex = 0
    while ((m = dynamicImportRegex.exec(file.content)) !== null) collectDep(m[1])
  }

  if (Object.keys(extraDependencies).length > 0) {
    fixes.push(`自動補充 ${Object.keys(extraDependencies).length} 個第三方依賴: ${Object.keys(extraDependencies).join(', ')}`)
  }

  // ── 檔案間引用檢查 + 自動生成 stub 組件（防止 build 失敗）──
  const filePathSet = new Set<string>()
  const rebuildFilePathSet = () => {
    filePathSet.clear()
    const allCurrent = [...sanitized.pages, ...sanitized.components]
    for (const f of allCurrent) {
      filePathSet.add(f.path)
      filePathSet.add(f.path.replace(/\.(tsx?|jsx?)$/, ''))
      // index 解析
      const dir = f.path.replace(/\/[^/]+$/, '')
      if (f.path.endsWith('/index.tsx') || f.path.endsWith('/index.ts')) {
        filePathSet.add(dir)
      }
    }
  }
  rebuildFilePathSet()

  // 統一掃描 @/ 和 ./ 兩種路徑的 import
  const allImportRegex = /from\s+['"](@\/[^'"]+|\.\.?\/[^'"]+)['"]/g
  const brokenImports: Array<{ file: string; importPath: string; resolvedPath: string; importStatement: string }> = []

  for (const file of [...sanitized.pages, ...sanitized.components]) {
    allImportRegex.lastIndex = 0
    let m
    while ((m = allImportRegex.exec(file.content)) !== null) {
      const importPath = m[1]
      let resolved: string

      if (importPath.startsWith('@/')) {
        // @/ 映射到專案根目錄
        resolved = importPath.slice(2) // @/components/Foo → components/Foo
      } else {
        // ./ 或 ../ 相對路徑
        const fileDir = file.path.replace(/\/[^/]+$/, '') || '.'
        resolved = importPath.startsWith('./')
          ? fileDir + '/' + importPath.slice(2)
          : fileDir + '/' + importPath
      }

      // normalize resolved path（消除 app/x/../components/Y 形式）
      const resolvedNorm = normalizePath(resolved)
      const candidates = [
        resolvedNorm, resolvedNorm + '.tsx', resolvedNorm + '.ts', resolvedNorm + '.jsx', resolvedNorm + '.js',
        resolvedNorm + '/index.tsx', resolvedNorm + '/index.ts',
      ]
      if (!candidates.some(c => filePathSet.has(c))) {
        brokenImports.push({ file: file.path, importPath, resolvedPath: resolvedNorm, importStatement: m[0] })
      }
    }
  }

  // 對 broken import 去重（同一 resolvedPath 只生成一次 stub）
  const stubGenerated = new Set<string>()
  for (const broken of brokenImports) {
    if (stubGenerated.has(broken.resolvedPath)) continue
    stubGenerated.add(broken.resolvedPath)

    const stubPath = broken.resolvedPath.match(/\.(tsx?|jsx?)$/)
      ? broken.resolvedPath
      : broken.resolvedPath + '.tsx'

    // 解析 import 語句推斷 export 方式
    const importContent = [...sanitized.pages, ...sanitized.components]
      .filter(f => f.content.includes(broken.importPath))
      .map(f => f.content)
      .join('\n')

    // 提取 named imports：import { Foo, Bar } from '...'
    const namedImportRegex = new RegExp(`import\\s*\\{([^}]+)\\}\\s*from\\s*['"]${broken.importPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g')
    const namedExports: string[] = []
    let nim
    while ((nim = namedImportRegex.exec(importContent)) !== null) {
      nim[1].split(',').map(s => s.trim()).filter(Boolean).forEach(n => {
        // 處理 as 別名：import { Foo as Bar }
        const realName = n.split(/\s+as\s+/)[0].trim()
        if (realName && !namedExports.includes(realName)) namedExports.push(realName)
      })
    }

    // 提取 default import：import Foo from '...'
    const defaultImportRegex = new RegExp(`import\\s+(\\w+)\\s+from\\s*['"]${broken.importPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`)
    const defaultMatch = importContent.match(defaultImportRegex)
    const hasDefaultImport = !!defaultMatch

    // 生成 stub 組件
    const stubLines: string[] = ["'use client'\n"]
    const isComponent = (name: string) => /^[A-Z]/.test(name)

    for (const name of namedExports) {
      if (isComponent(name)) {
        stubLines.push(`export function ${name}({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) {
  return <div style={{ border: '2px dashed #ccc', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' as const }} {...props}>{children || '${name}'}</div>
}\n`)
      } else {
        stubLines.push(`export const ${name} = () => null\n`)
      }
    }

    if (hasDefaultImport) {
      const defaultName = defaultMatch![1]
      if (isComponent(defaultName)) {
        stubLines.push(`export default function ${defaultName}({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) {
  return <div style={{ border: '2px dashed #ccc', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' as const }} {...props}>{children || '${defaultName}'}</div>
}\n`)
      } else {
        stubLines.push(`export default function StubComponent() { return null }\n`)
      }
    }

    // 沒抓到任何 export 時提供一個安全的 default export
    if (namedExports.length === 0 && !hasDefaultImport) {
      stubLines.push(`export default function StubComponent() { return null }\n`)
    }

    sanitized.components.push({
      path: stubPath,
      content: stubLines.join('\n'),
      description: `Auto-generated stub for broken import: ${broken.importPath}`,
    })

    // 新 stub 加入已知路徑集合（避免連鎖引用重複生成）
    rebuildFilePathSet()

    logger.info({ file: broken.file, importPath: broken.importPath, stubPath }, 'Broken import，生成 stub 組件')
    fixes.push(`${broken.file}: broken import ${broken.importPath} → 生成 stub 組件`)
  }

  // Named import 驗證：檔案存在但 named export 不存在的情況
  const allSanitizedFiles = [...sanitized.pages, ...sanitized.components]
  const { sanitized: namedFixed, fixes: namedFixes } = sanitizeNamedImports(allSanitizedFiles)
  if (namedFixes.length > 0) {
    // 將修復後的內容寫回
    const fixedMap = new Map(namedFixed.map(f => [f.path, f.content]))
    for (const page of sanitized.pages) {
      const fixed = fixedMap.get(page.path)
      if (fixed !== undefined) page.content = fixed
    }
    for (const comp of sanitized.components) {
      const fixed = fixedMap.get(comp.path)
      if (fixed !== undefined) comp.content = fixed
    }
    for (const nf of namedFixes) {
      fixes.push(`${nf.file}: named import "${nf.removed}" 不存在於 ${nf.from}，已移除`)
    }
  }

  // ── 修復 10: Page → Action 契約檢查（warning only） ──
  // page 呼叫 xxxAction({}) 不帶 action 需要的 input.x → runtime SQL NULL filter
  // → 0 rows 漏資料。不阻斷部署（auto-fix 風險高），只記錄 telemetry 供週報追蹤。
  const sanitizedAsVercelFiles: VercelFile[] = [
    ...sanitized.pages.map(p => ({ file: p.path, data: p.content })),
    ...sanitized.components.map(c => ({ file: c.path, data: c.content })),
  ]
  const contractCheck = checkPageActionContract(sanitizedAsVercelFiles)
  if (contractCheck.warnings.length > 0) {
    for (const w of contractCheck.warnings) {
      fixes.push(`⚠ Page-Action 契約: ${w}`)
    }
  }

  // ── 修復 11: 按鈕對比度兜底（R9 Layer 3，100% 保證 WCAG AA）──
  // 偵測 <button>/<a class="btn|cta">/role="button" 內 bg-* + text-* 配對 ratio < 4.5
  // → swap text class 為 on-* token 或 pickReadableForeground 結果
  // fail-soft：任何錯誤不阻塞 deploy
  try {
    const swapResult = autoSwapButtonContrast(sanitized, designSystem)
    if (swapResult.swaps.length > 0 || swapResult.unsafeFallbacks.length > 0) {
      // 把 swap 後的 code 套用回去（fixedCode 含 pages/components 新內容）
      sanitized.pages = swapResult.fixedCode.pages
      sanitized.components = swapResult.fixedCode.components
      for (const s of swapResult.swaps) {
        fixes.push(`contrast auto-swap: ${s.filePath} ${s.bgClass} ${s.oldFgClass}(ratio ${s.oldRatio.toFixed(2)}) → ${s.newFgClass}(ratio ${s.newRatio.toFixed(2)}) [${s.reason}]`)
        // R9 observer：每個 swap fire telemetry（fire-and-forget）
        void recordTelemetry({
          skillName: 'uiux',
          eventType: 'contrast_auto_swapped',
          patternKey: `${s.bgClass}__${s.oldFgClass}__${s.newFgClass}`,
          severity: 'info',
          outcome: 'repaired',
          userId: null,
          conversationId: null,
          payload: { filePath: s.filePath, oldRatio: s.oldRatio, newRatio: s.newRatio, reason: s.reason },
        }).catch(() => {})
      }
      for (const u of swapResult.unsafeFallbacks) {
        fixes.push(`⚠ contrast unsafe: ${u.filePath} ${u.bgClass} + ${u.oldFgClass} 無法找到 ≥ 4.5 fg（ratio ${u.oldRatio.toFixed(2)}），建議用戶 iteration 調整 ${u.bgClass}`)
        // R9 observer：unsafe fallback 屬於 high signal（mid-saturation 色找不到 safe fg）
        void recordTelemetry({
          skillName: 'uiux',
          eventType: 'contrast_auto_swap_unsafe',
          patternKey: `${u.bgClass}__${u.oldFgClass}`,
          severity: 'warning',
          outcome: 'failed',
          userId: null,
          conversationId: null,
          payload: { filePath: u.filePath, ratio: u.oldRatio, reason: u.reason },
        }).catch(() => {})
      }
    }
  } catch (err) {
    // fail-soft：contrast swap 失敗不阻塞 deploy（記 fix 提示）
    fixes.push(`⚠ contrast auto-swap 失敗（fail-soft skip）: ${(err as Error).message}`)
  }

  return { code: sanitized, fixes, injectedFiles, extraDependencies }
}

// ============================================================
// Fix 9：Image Library 白名單校驗 + ImageCredits 注入
// ------------------------------------------------------------
// 在 sanitizeCodeForDeploy 之後、wrap 進 Next.js 之前呼叫
// - 掃描 <img>/<Image> 的 Unsplash URL，違規 id 替換為白名單同分類第一張
// - 產出 components/ImageCredits.tsx（若有實際使用 Unsplash）
// - 返回 download_location 給 caller fire-and-forget trigger
// ============================================================

export interface ImageLibraryApplyResult {
  code: GeneratedCode
  fixes: string[]
  injectedFile: { file: string; data: string } | null
  downloadLocations: string[]
}

const IMAGE_SRC_REGEX = /<(?:img|Image)\b[^>]*?\bsrc\s*=\s*["']([^"']+)["'][^>]*?>/g
const UNSPLASH_HOST_RE = /images\.unsplash\.com/
const UNSPLASH_ID_RE = /images\.unsplash\.com\/photo-([A-Za-z0-9_-]+)/

function getAllLibraryAssets(lib: ImageLibrary) {
  return [
    ...lib.hero, ...lib.product, ...lib.team,
    ...lib.background, ...lib.lifestyle, ...lib.detail,
  ]
}

/**
 * 推斷 <img> 出現在哪類上下文（從 src 前後文用 className/alt 關鍵字猜）
 */
function inferCategoryFromContext(imgTag: string): ImageCategory {
  const lower = imgTag.toLowerCase()
  if (/hero|banner|jumbotron|cover/.test(lower)) return 'hero'
  if (/avatar|headshot|portrait|team|member|profile/.test(lower)) return 'team'
  if (/bg|background/.test(lower)) return 'background'
  if (/product|item|card|menu/.test(lower)) return 'product'
  if (/detail|closeup|icon|thumb/.test(lower)) return 'detail'
  return 'lifestyle'
}

function pickFallbackAsset(lib: ImageLibrary, category: ImageCategory) {
  const pool = lib[category]
  if (pool.length > 0) return pool[0]
  // 所有類都可能空，按優先順序找第一個非空
  const order: ImageCategory[] = ['lifestyle', 'hero', 'product', 'background', 'detail', 'team']
  for (const c of order) {
    if (lib[c].length > 0) return lib[c][0]
  }
  return null
}

function replaceImageUrlsInContent(
  content: string,
  lib: ImageLibrary,
  allowedIds: Set<string>,
): { replaced: string; fixCount: number } {
  let fixCount = 0
  const replaced = content.replace(IMAGE_SRC_REGEX, (imgTag, src) => {
    // 只攔 Unsplash URL（picsum/placehold.co/本地路徑放行）
    if (!UNSPLASH_HOST_RE.test(src)) return imgTag
    const match = src.match(UNSPLASH_ID_RE)
    if (!match) return imgTag
    const photoId = match[1]
    // 白名單命中（完整或前綴匹配）→ 不動
    for (const id of allowedIds) {
      if (photoId === id || photoId.startsWith(id) || id.startsWith(photoId)) {
        return imgTag
      }
    }
    // 違規：替換
    const cat = inferCategoryFromContext(imgTag)
    const fallback = pickFallbackAsset(lib, cat)
    if (!fallback) return imgTag
    fixCount++
    return imgTag.replace(src, fallback.url)
  })
  return { replaced, fixCount }
}

/**
 * 對整個 GeneratedCode 套用白名單校驗 + 生成 ImageCredits
 * 會變動 code 內容（不可變模式：回傳新物件）
 */
export function applyImageLibraryToDeployCode(
  code: GeneratedCode,
  library: ImageLibrary | null | undefined,
): ImageLibraryApplyResult {
  if (!library) {
    return { code, fixes: [], injectedFile: null, downloadLocations: [] }
  }

  const fixes: string[] = []
  const allowedIds = new Set(getAllLibraryAssets(library).map((a) => a.sourceId))

  const patchedPages = code.pages.map((p) => {
    const { replaced, fixCount } = replaceImageUrlsInContent(p.content, library, allowedIds)
    if (fixCount > 0) {
      fixes.push(`${p.path}: Image whitelist 替換 ${fixCount} 處非白名單 Unsplash URL`)
    }
    return { ...p, content: replaced }
  })
  const patchedComponents = code.components.map((c) => {
    const { replaced, fixCount } = replaceImageUrlsInContent(c.content, library, allowedIds)
    if (fixCount > 0) {
      fixes.push(`${c.path}: Image whitelist 替換 ${fixCount} 處非白名單 Unsplash URL`)
    }
    return { ...c, content: replaced }
  })

  const patchedCode: GeneratedCode = {
    pages: patchedPages,
    components: patchedComponents,
    styles: code.styles,
  }

  const allText = [...patchedPages, ...patchedComponents].map((f) => f.content).join('\n')
  const injectedFile = buildAttributionBlock(allText, library)
  const usedAssets = extractUsedUnsplashAssets(allText, library)
  const downloadLocations = usedAssets.map((a) => a.downloadLocation).filter(Boolean)

  if (injectedFile) {
    const photographerCount = new Set(usedAssets.map((a) => a.photographer.name)).size
    fixes.push(`注入 ImageCredits.tsx（${usedAssets.length} 張 Unsplash 圖，${photographerCount} 位 photographer）`)
  }

  return { code: patchedCode, fixes, injectedFile, downloadLocations }
}

// ============================================================
// AST-enhanced sanitize（CODER_AST_SANITIZE=true 時啟用）
// ------------------------------------------------------------
// 替代 sanitizeCodeForDeploy 中最脆弱的 3 類 regex：
//   #2.5 missing React hooks import  → ensureReactHooksImports
//   #6   Next15 async params         → fixNext15AsyncParams
//   #7   useSearchParams Suspense    → splitPageForSuspense
// AST 先跑（對複雜 case 較穩），剩餘 regex 同步 pipeline 再補齊。
// AST 失敗降級純同步，絕不阻塞 pipeline。
// ============================================================
export async function sanitizeCodeForDeployAsync(code: GeneratedCode, designSystem?: DesignSystem): Promise<SanitizeResult> {
  if (!getEnv().CODER_AST_SANITIZE) {
    return sanitizeCodeForDeploy(code, designSystem)
  }

  const astFixes: string[] = []

  // 深拷貝避免污染 caller
  const workCode: GeneratedCode = {
    pages: code.pages.map(p => ({ ...p })),
    components: code.components.map(c => ({ ...c })),
    styles: code.styles,
  }

  try {
    const { ensureReactHooksImports, fixNext15AsyncParams, splitPageForSuspense } =
      await import('../lib/ast/fixers')

    // 1. React hooks import（僅 client files）
    for (const file of [...workCode.pages, ...workCode.components]) {
      const isBackend =
        /^['"]use server['"]/.test(file.content.trimStart()) ||
        file.path.startsWith('lib/') ||
        file.path.startsWith('app/api/')
      if (isBackend) continue
      const r = await ensureReactHooksImports(file.content, file.path)
      if (r?.repaired) {
        file.content = r.content
        astFixes.push(`[AST] ${file.path}: ${r.detail ?? '補 React hooks import'}`)
      }
    }

    // 2. Next15 async params（僅 page/layout）
    for (const file of workCode.pages) {
      const r = await fixNext15AsyncParams(file.content, file.path)
      if (r?.repaired) {
        file.content = r.content
        astFixes.push(`[AST] ${file.path}: ${r.detail ?? 'Next15 async params'}`)
      }
    }

    // 3. useSearchParams → Suspense 拆分（僅 pages）
    const pageUpdates: Array<{ index: number; content: string }> = []
    const addedClientComponents: Array<{ path: string; content: string; description: string }> = []
    for (let i = 0; i < workCode.pages.length; i++) {
      const page = workCode.pages[i]
      const r = await splitPageForSuspense(page.content, page.path)
      if (!r) continue
      pageUpdates.push({ index: i, content: r.pageContent })
      addedClientComponents.push({
        path: r.clientComponentPath,
        content: r.clientComponentContent,
        description: '[AST] Client component extracted for Suspense boundary',
      })
      astFixes.push(`[AST] ${page.path}: useSearchParams Suspense 提取 ${r.clientComponentName}`)
    }
    for (const u of pageUpdates) {
      workCode.pages[u.index] = { ...workCode.pages[u.index], content: u.content }
    }
    workCode.components = [...workCode.components, ...addedClientComponents]
  } catch (err) {
    logger.warn({ err }, 'AST sanitize 失敗，降級純同步 regex pipeline')
  }

  // 再跑一次同步 regex pipeline，補齊其他 7 類修復（冪等）+ 修復 11 contrast auto-swap
  const syncResult = sanitizeCodeForDeploy(workCode, designSystem)
  return {
    ...syncResult,
    fixes: [...astFixes, ...syncResult.fixes],
  }
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
  userId: string,
  opts: { imageLibrary?: ImageLibrary | null } = {},
): Promise<DeployPreCheckResult> {
  // 1. 檢查 VERCEL_ACCESS_TOKEN
  if (!getEnv().VERCEL_ACCESS_TOKEN) {
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

  const uiuxFiles = await db.getProjectFiles(projectId, 'uiux')
  const coderFiles = await db.getProjectFiles(projectId, 'coder')

  // 合併：coder 覆蓋同路徑 uiux 檔案
  const fileMap = new Map<string, typeof uiuxFiles[0]>()
  for (const f of uiuxFiles) fileMap.set(f.file_path, f)
  for (const f of coderFiles) fileMap.set(f.file_path, f)
  const projectFiles = Array.from(fileMap.values())

  if (projectFiles.length > 0) {
    // 從 project_files 重建 GeneratedCode
    const pages: GeneratedComponent[] = []
    const components: GeneratedComponent[] = []
    const backendFiles: GeneratedComponent[] = []
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
      } else if (['service', 'api_route', 'config'].includes(f.file_type)) {
        // Coder 生成的後端檔案（lib/db.ts, lib/actions/*, app/actions/*）
        backendFiles.push({ path: f.file_path, content: f.content, description: f.description || '' })
      }
    }

    if (pages.length > 0) {
      code = { pages, components: [...components, ...backendFiles], styles }
    }

    logger.info({
      projectId,
      pageCount: pages.length,
      componentCount: components.length,
      backendFileCount: backendFiles.length,
      pagePaths: pages.map(p => p.path),
      componentPaths: components.map(c => c.path).slice(0, 30),
    }, 'Deploy 檔案合併結果')
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

  // 部署前預檢 + 自動修復（CODER_AST_SANITIZE=true 時走 AST，否則純 regex）
  const sanitizeResult = await sanitizeCodeForDeployAsync(code)
  let sanitizedCode = sanitizeResult.code
  let finalInjectedFiles = [...sanitizeResult.injectedFiles]
  let finalFixes = [...sanitizeResult.fixes]

  // Fix 9：Image Library 白名單校驗 + ImageCredits 注入（供 Unsplash ToS 合規）
  if (opts.imageLibrary) {
    const imgResult = applyImageLibraryToDeployCode(sanitizedCode, opts.imageLibrary)
    sanitizedCode = imgResult.code
    finalFixes = [...finalFixes, ...imgResult.fixes]
    if (imgResult.injectedFile) {
      finalInjectedFiles.push(imgResult.injectedFile)
    }
    // fire-and-forget 觸發 Unsplash download（ToS 要求）
    if (imgResult.downloadLocations.length > 0) {
      triggerUnsplashDownloads(imgResult.downloadLocations)
    }
  }

  if (finalFixes.length > 0) {
    logger.info({ count: finalFixes.length, fixes: finalFixes }, '預檢修復')

    // Telemetry: 把 fixes 用 regex 分類器歸類 → 高頻 pattern 進週報
    // 這是 MVP 最高 ROI 的訊號源之一：每次 LLM 生成完都會被 sanitize 擦一次屁股
    recordTelemetryBatch(
      finalFixes.map(fix => ({
        skillName: 'deployer' as const,
        eventType: 'sanitize_fix' as const,
        patternKey: categorizeSanitizeFix(fix),
        userId,
        projectId,
        payload: { rawLabel: fix.slice(0, 200) },
      }))
    ).catch(() => {})
  }

  const fileCount = sanitizedCode.pages.length + sanitizedCode.components.length + 1 // +1 for styles

  return {
    ready: true,
    projectName: slug,
    fileCount,
    estimatedUrl: `https://${slug}.vercel.app`,
    code: sanitizedCode,
    tailwindConfig,
    sanitizeFixes: finalFixes,
    extraDependencies: sanitizeResult.extraDependencies,
    injectedFiles: finalInjectedFiles,
  }
}

/**
 * 清理 metadata 字串，確保可安全嵌入 JS 單引號字串
 * 移除換行/回車/tab → 空格，轉義反斜線和單引號，合併多空白
 */
function sanitizeMetadataString(str: string, maxLen: number): string {
  return str
    .replace(/\\/g, '\\\\')        // 反斜線（必須第一個處理）
    .replace(/'/g, "\\'")           // 單引號
    .replace(/[\n\r]/g, ' ')        // 換行/回車 → 空格
    .replace(/\t/g, ' ')            // tab → 空格
    .replace(/\s{2,}/g, ' ')        // 多空白合併
    .trim()
    .slice(0, maxLen)
}

/**
 * 將 siteMetadata 注入 layout.tsx 的 export const metadata
 * 用正則替換 title 和 description 的值
 */
function injectMetadataIntoLayout(files: VercelFile[], meta: SiteMetadata): void {
  const layoutIdx = files.findIndex(f => f.file === 'app/layout.tsx')
  if (layoutIdx === -1) return

  let content = files[layoutIdx].data
  const safeTitle = sanitizeMetadataString(meta.title, 60)
  const safeDesc = sanitizeMetadataString(meta.description, 160)

  content = content.replace(
    /title:\s*(['"]).*?\1/,
    `title: '${safeTitle}'`
  )
  content = content.replace(
    /description:\s*(['"]).*?\1/,
    `description: '${safeDesc}'`
  )

  files[layoutIdx].data = content
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
    siteMetadata?: SiteMetadata
  },
  trackingContext?: { userId?: string; conversationId?: string },
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
      onProgress,
      trackingContext
    )

    const files = buildResult.files

    // 注入 site metadata（替換 layout.tsx 中的 title/description）
    if (options?.siteMetadata) {
      injectMetadataIntoLayout(files, options.siteMetadata)
      logger.info({ title: options.siteMetadata.title, desc: options.siteMetadata.description.slice(0, 50) }, 'Metadata 注入')
    }

    if (buildResult.fixes.length > 0) {
      logger.info({ fixes: buildResult.fixes.join('; ') }, 'Build 驗證修復')
    }
    if (!buildResult.buildVerified) {
      logger.warn('Build 驗證未通過，使用降級部署')
    }

    // 3. 建立 Vercel Project（50%）
    await onProgress({ percent: 50, step: '建立 Vercel 專案...' })
    const vercelProject = await createVercelProject(projectName)
    if (!vercelProject) {
      // 已存在的話繼續部署
      logger.info({ projectName }, 'Vercel project 可能已存在，繼續部署')
    }

    // 3.5 Env vars 注入（Neon DB + Auth + Email + Magic-link 一次完成）
    // CRITICAL：DATABASE_URL 缺失或注入失敗必須阻斷部署，不能 fail-open。
    // 否則 Vercel build 過 → runtime `lib/db.ts` throw `DATABASE_URL is not set`
    // → 客戶看到 500 才回報，產品口碑炸裂。
    const cfgRow = await db.query<{
      neon_connection_string: string | null
      resend_api_key: string | null
      email_from: string | null
      custom_domain: string | null
    }>(
      'SELECT neon_connection_string, resend_api_key, email_from, custom_domain FROM projects WHERE id = $1',
      [projectId]
    )
    const cfg = cfgRow.rows[0]

    // 偵測客戶 app 是否需要 DATABASE_URL（任一 lib/db.ts 或 lib/actions/* 存在即視為需要）
    const needsDatabase = files.some(f =>
      f.file === 'lib/db.ts' || f.file.startsWith('lib/actions/') || f.file.startsWith('app/actions/')
    )
    if (needsDatabase && !cfg?.neon_connection_string) {
      throw new Error(
        'Neon 資料庫連線字串缺失（projects.neon_connection_string is null），無法部署。' +
        '請確認 Neon provisioning 階段完成且寫入 DB。'
      )
    }

    // Pre-deploy Neon schema check：客戶 app 在 lib/actions/*.ts 引用的表必須真的存在
    if (needsDatabase && cfg?.neon_connection_string) {
      const expectedTables = extractReferencedTables(files)
      if (expectedTables.length > 0) {
        const schemaCheck = await checkNeonSchemaExists(cfg.neon_connection_string, expectedTables)
        if (schemaCheck && schemaCheck.missing.length > 0) {
          // 有缺表 = schema 沒建好 = runtime 查詢必 500，必須阻斷
          void recordTelemetry({
            skillName: 'deployer',
            eventType: 'deployer_layer_trigger',
            patternKey: 'neon_schema_missing_tables',
            severity: 'critical',
            outcome: 'failed',
            projectId,
            payload: { expected: expectedTables, missing: schemaCheck.missing, existing: schemaCheck.existing },
          }).catch(() => {})
          throw new Error(
            `Neon schema 缺失表（部署中止）：${schemaCheck.missing.join(', ')}。` +
            `客戶 app 代碼引用了這些表但 Neon DB 中不存在。請重新跑 db_provisioning 或檢查 schema-derivation。` +
            `已存在的表：${schemaCheck.existing.length === 0 ? '（無）' : schemaCheck.existing.join(', ')}`
          )
        }
        if (schemaCheck) {
          logger.info({ projectId, expectedCount: expectedTables.length, existingCount: schemaCheck.existing.length }, 'Neon schema check 通過')
        }
      }
    }

    const envVars: Record<string, string> = {}

    // Neon DB 連線字串
    if (cfg?.neon_connection_string) {
      envVars['DATABASE_URL'] = cfg.neon_connection_string
    }

    // Email primitive：客戶有 lib/email.ts → 注入 Resend 配置
    const hasEmailFile = files.some(f => f.file === 'lib/email.ts')
    if (hasEmailFile) {
      if (cfg?.resend_api_key) {
        envVars['RESEND_API_KEY'] = cfg.resend_api_key
      }
      envVars['EMAIL_FROM'] = cfg?.email_from || 'onboarding@resend.dev'
    }

    // Magic-link：注入 APP_URL（優先 custom domain，fallback Vercel 預設）
    const hasMagicLinkFile = files.some(f => f.file === 'lib/magic-link.ts')
    if (hasMagicLinkFile) {
      const appUrl = cfg?.custom_domain
        ? `https://${cfg.custom_domain}`
        : `https://${projectName}.vercel.app`
      envVars['APP_URL'] = appUrl
    }

    // Auth 系統：AUTH_SECRET 由 injectVercelEnvVarIfNotExists 不覆蓋注入；
    // 為了 scan 比對先把它記入 injected 名單
    const hasAuthFile = files.some(f => f.file === 'auth.ts')
    // L36: JWT_SECRET — 客戶 Coder 生成的 admin login 用 `process.env.JWT_SECRET` 簽 token，
    // 若 Vercel 沒注入 → admin login 第一句就 throw → 用戶看「登入失敗，請稍後再試」(bb0d1081 案例)
    // 偵測：scan 客戶 code 是否有 process.env.JWT_SECRET reference
    const needsJwtSecret = files.some(f => {
      if (!/\.(tsx?|jsx?)$/.test(f.file)) return false
      if (!f.file.startsWith('lib/') && !f.file.startsWith('app/')) return false
      return /process\.env\.JWT_SECRET\b|process\.env\[\s*['"]JWT_SECRET['"]\s*\]/.test(f.data)
    })
    const injectedKeys = new Set([
      ...Object.keys(envVars),
      ...(hasAuthFile ? ['AUTH_SECRET'] : []),
      ...(needsJwtSecret ? ['JWT_SECRET'] : []),
    ])

    // 掃描客戶 app 代碼引用了哪些 process.env.X，與已注入清單比對
    const envScan = scanProcessEnvReferences(files, injectedKeys)
    if (envScan.missingCritical.length > 0) {
      throw new Error(
        `客戶 app 代碼引用了未注入的 critical env vars（部署中止）：${envScan.missingCritical.join(', ')}。` +
        `這些 key 缺失會直接導致 runtime 500，請檢查 Tellcraft pipeline 的 provisioning 階段。`
      )
    }
    if (envScan.missing.length > 0) {
      logger.warn(
        { projectId, missing: envScan.missing, referenced: envScan.referenced, injected: envScan.injected },
        `客戶 app 引用了 ${envScan.missing.length} 個未自動注入的 env vars（不阻斷，但 runtime 將為 undefined）`
      )
      // Telemetry：fire-and-forget 記錄，週報追蹤需求
      void recordTelemetry({
        skillName: 'deployer',
        eventType: 'deployer_layer_trigger',
        patternKey: 'env_var_unhandled',
        severity: 'warning',
        outcome: 'failed',
        projectId,
        payload: { missing: envScan.missing, referenced: envScan.referenced },
      }).catch(() => {})
    }

    if (Object.keys(envVars).length > 0) {
      // injectVercelEnvVars 內部對 CRITICAL_ENV_KEYS 有 fail-fast；non-critical
      // 失敗只 warn 不 throw，不影響部署成功率
      await injectVercelEnvVars(projectName, envVars)
    }

    if (hasAuthFile) {
      const crypto = await import('crypto')
      await injectVercelEnvVarIfNotExists(projectName, 'AUTH_SECRET', crypto.randomBytes(32).toString('base64'))
    }

    // L36: JWT_SECRET — 客戶 admin login / API auth 用，每客戶獨立隨機 secret
    // 用 IfNotExists 不覆蓋（user 自己手動設過的不動，保留既有 token 不失效）
    if (needsJwtSecret) {
      const crypto = await import('crypto')
      await injectVercelEnvVarIfNotExists(projectName, 'JWT_SECRET', crypto.randomBytes(32).toString('hex'))
    }

    logger.info(
      { projectId, hasAuth: hasAuthFile, hasEmail: hasEmailFile, hasMagicLink: hasMagicLinkFile, hasResendKey: !!cfg?.resend_api_key, hasDb: !!cfg?.neon_connection_string },
      'Vercel env vars 已注入'
    )

    // L38: admin seed UI hint 對齊 — UIUX 顯示「測試帳號：X / Y」，但 BDD 用其他 password
    // 算 hash 進 Neon DB → 用戶按 UI hint 永遠登入失敗（bb0d1081 案例）
    // 修法：scan UIUX 找 hint pattern → 在 Neon DB upsert admin row (username=X, hash=bcrypt(Y))
    if (cfg?.neon_connection_string) {
      try {
        const hint = extractAdminCredentialHint(files)
        if (hint) {
          const bcrypt = await import('bcryptjs')
          const hash = bcrypt.hashSync(hint.password, 10)
          const { Client } = await import('pg')
          const c = new Client({ connectionString: cfg.neon_connection_string })
          await c.connect()
          try {
            // 偵測有 admins 表才操作（沒有就跳過，不算失敗）
            const r = await c.query(`SELECT to_regclass('public.admins') AS t`)
            if (r.rows[0]?.t) {
              await c.query(
                `UPDATE admins SET password_hash = $1, updated_at = NOW() WHERE username = $2`,
                [hash, hint.username]
              )
              logger.info({ projectId, username: hint.username }, 'L38: admin seed UI hint 對齊已套用')
            }
          } finally {
            await c.end().catch(() => {})
          }
        }
      } catch (e) {
        // fail-soft — admin seed 對齊失敗不阻塞部署
        logger.warn({ err: e }, 'L38: admin seed UI hint 對齊失敗（不阻塞）')
      }
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

    // L37: 用 production alias `{projectName}.vercel.app` 取代 immutable deploy URL
    // 原 `deployment.url` 是 `tc-xxx-{random}-erics-projects-xxx.vercel.app`（每次部署都換），
    // 用戶踩 stale URL（停在舊版本前端 bundle 拿不到新 env / 新功能）— bb0d1081 案例
    // canonical production alias 始終指向最新 READY deployment，給用戶用這條最穩
    const aliasUrl = `https://${projectName}.vercel.app`
    const deploymentUrl = aliasUrl
    const immutableUrl = `https://${deployment.url}`
    const finalStatus = readyDeployment?.readyState || deployment.readyState

    if (readyDeployment?.readyState === 'ERROR') {
      const buildLogs = await fetchVercelBuildLogs(deployment.id)
      if (buildLogs) logger.error({ buildLogs }, 'Vercel build logs')
      return { success: false, error: 'Vercel 建置失敗，請檢查代碼。', vercelDeploymentId: deployment.id }
    }

    // 5.5 Post-deploy runtime smoke test
    // Vercel 回 READY 只代表 build 成功，不代表 runtime 健康（DATABASE_URL 缺失、
    // 環境變數錯誤、SSR 拋例外等都會 build 過但 runtime 500）。打幾個關鍵路徑確認
    // 客戶不會打開瀏覽器看到一片紅。失敗 → 部署視為失敗，給用戶具體錯誤而不是「成功」。
    await onProgress({ percent: 92, step: 'Smoke test — 驗證部署實際可訪問...' })
    // Smoke test 用 immutable URL — 剛部署完 alias 可能還沒切換，打 immutable 保證打到此次 deploy 的精確 instance
    const smokeFailures = await runDeploymentSmokeTest(immutableUrl, files)
    if (smokeFailures.length > 0) {
      const summary = smokeFailures
        .map(f => `${f.path} → HTTP ${f.status}${f.snippet ? `\n  ${f.snippet}` : ''}`)
        .join('\n')
      logger.error({ deploymentUrl, failures: smokeFailures }, 'Post-deploy smoke test failed')
      // Telemetry：fire-and-forget 記錄失敗，週報追蹤改善
      void recordTelemetry({
        skillName: 'deployer',
        eventType: 'deployer_layer_trigger',
        patternKey: 'smoke_test_failed',
        severity: 'critical',
        outcome: 'failed',
        projectId,
        payload: {
          deploymentUrl,
          failures: smokeFailures.map(f => ({ path: f.path, status: f.status })),
        },
      }).catch(() => {})
      return {
        success: false,
        error: `部署完成但運行時 smoke test 失敗，可能是 DATABASE_URL 缺失或頁面 SSR 出錯：\n${summary}`,
        vercelDeploymentId: deployment.id,
      }
    }

    // 6. 更新 DB（95-100%）
    await onProgress({ percent: 95, step: '更新專案狀態...' })

    // 寫入 deployments 表
    const deploymentRow = await db.queryOne<{ id: string }>(
      `INSERT INTO deployments (project_id, vercel_deployment_id, url, status)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [projectId, deployment.id, deploymentUrl, finalStatus === 'READY' ? 'success' : 'deploying']
    )

    // 更新專案狀態與 URL
    await db.query(
      `UPDATE projects SET status = 'deployed', vercel_url = $2, updated_at = NOW() WHERE id = $1`,
      [projectId, deploymentUrl]
    )

    // 7. 將 build 修復後的代碼同步回 project_files（確保預覽和部署一致）
    const deployedCode = buildResult.finalCode
    try {
      const fileRows: { filePath: string; content: string; description?: string; fileType: string }[] = []
      for (const p of deployedCode.pages) {
        fileRows.push({ filePath: p.path, content: p.content, description: p.description, fileType: inferFileType(p.path) })
      }
      for (const c of deployedCode.components) {
        fileRows.push({ filePath: c.path, content: c.content, description: c.description, fileType: inferFileType(c.path) })
      }
      if (deployedCode.styles) {
        fileRows.push({ filePath: 'app/globals.css', content: deployedCode.styles, fileType: 'style' })
      }
      // Deploy 成功後的代碼已過全五層防禦 + Vercel build → 絕對 LKG
      await db.upsertProjectFiles(projectId, 'uiux', fileRows, 'passed')
      logger.info({ fileCount: fileRows.length }, '已同步 build 修復後的代碼到 project_files (LKG)')

      // 若此專案是某個已上線模板的來源，自動更新模板縮圖（fire-and-forget）
      db.query<{ id: string }>(
        `SELECT id FROM templates WHERE source_project_id = $1 AND is_active = true LIMIT 1`,
        [projectId]
      ).then(async result => {
        const tmpl = result.rows[0]
        if (!tmpl) return
        const { captureTemplateThumbnail } = await import('./thumbnail-recapture')
        await captureTemplateThumbnail(tmpl.id)
        logger.info({ templateId: tmpl.id, projectId }, '部署後自動更新模板縮圖完成')
      }).catch(err => logger.warn({ err, projectId }, '部署後模板縮圖更新失敗（不影響部署）'))
    } catch (syncErr) {
      logger.error({ err: syncErr }, '同步代碼到 project_files 失敗（不影響部署）')
    }

    // 保存代碼快照到 deployment 記錄（在 build fix sync 之後，確保是最終版本）
    if (deploymentRow?.id) {
      try {
        const snapshotFiles = await db.getProjectFiles(projectId)
        if (snapshotFiles.length > 0) {
          const snapshot = JSON.stringify(snapshotFiles.map(f => ({
            filePath: f.file_path,
            content: f.content,
            skillSource: f.skill_source,
            fileType: f.file_type,
          })))
          await db.query(
            'UPDATE deployments SET code_snapshot = $1 WHERE id = $2',
            [snapshot, deploymentRow.id]
          )
          logger.info({ deploymentId: deploymentRow.id, fileCount: snapshotFiles.length }, '部署代碼快照已保存')

          // 只保留最近 5 個部署的快照，清除更舊的
          await db.query(
            `UPDATE deployments SET code_snapshot = NULL
             WHERE project_id = $1 AND code_snapshot IS NOT NULL
             AND id NOT IN (
               SELECT id FROM deployments
               WHERE project_id = $1 AND code_snapshot IS NOT NULL
               ORDER BY created_at DESC LIMIT 5
             )`,
            [projectId]
          )
        }
      } catch (snapErr) {
        logger.warn({ err: snapErr }, '部署代碼快照保存失敗（不影響部署）')
      }
    }

    await onProgress({ percent: 100, step: '部署完成！' })

    return {
      success: true,
      deploymentUrl,
      vercelDeploymentId: deployment.id,
      deployedCode,
    }
  } catch (err) {
    logger.error({ err }, '部署失敗')
    return { success: false, error: `部署失敗：${err instanceof Error ? err.message : String(err)}` }
  }
}

// ============================================================
// 內部函數
// ============================================================

/**
 * 將 UIUX 生成的代碼包裝成完整 Next.js 專案
 */
export function wrapInNextJs(
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

  // next.config.ts — 本地已驗證，ignoreBuildErrors 防 VPS/Vercel Node 版本差異
  // headers(): 允許 tellcraft.com 用 iframe 嵌入做 preview（Vercel preview URL embed）
  files.push({
    file: 'next.config.ts',
    data: `import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
${CLIENT_APP_IMAGE_REMOTE_PATTERNS}
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // 允許 tellcraft 主站 iframe 嵌入做 preview；deprecated 但 chrome 仍尊重
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          // 現代 CSP — 取代 X-Frame-Options，明列允許嵌入的 origin
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self' https://tellcraft.com https://*.tellcraft.com https://*.vercel.app http://localhost:* http://127.0.0.1:*" },
        ],
      },
    ]
  },
}

export default nextConfig
`,
  })

  // postcss.config.js（Tailwind v3）
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

  // app/globals.css — Tailwind v4（@import "tailwindcss" 是入口）
  let stylesContent = code.styles

  // 安全網：如果 tailwind config 引用了 CSS 變數但 styles 中缺少定義，注入 fallback
  if (tailwindConfig.includes('var(--radius-') && !stylesContent.includes('--radius-')) {
    const fallbackRadiusVars = `\n/* Fallback radius variables */\n:root {\n  --radius-none: 0;\n  --radius-sm: 0.125rem;\n  --radius-md: 0.375rem;\n  --radius-lg: 0.5rem;\n  --radius-full: 9999px;\n}\n`
    stylesContent = stylesContent + fallbackRadiusVars
  }
  if (tailwindConfig.includes('var(--color-') && !stylesContent.includes('--color-primary')) {
    const fallbackColorVars = `\n/* Fallback color variables */\n:root {\n  --color-primary: #2563eb;\n  --color-secondary: #4f46e5;\n  --color-accent: #06b6d4;\n  --color-background: #ffffff;\n  --color-foreground: #0f172a;\n  --color-muted: #f1f5f9;\n  --color-border: #e2e8f0;\n}\n`
    stylesContent = stylesContent + fallbackColorVars
  }

  // Tailwind v3：清理 v4 語法 + 確保 @tailwind directives
  stylesContent = cleanTailwindV4Syntax(stylesContent)

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
    './hooks/**/*.{js,ts,jsx,tsx}',
    './utils/**/*.{js,ts,jsx,tsx}',
    './types/**/*.{js,ts,jsx,tsx}',
    './context/**/*.{js,ts,jsx,tsx}',
    './stores/**/*.{js,ts,jsx,tsx}',
    './data/**/*.{js,ts,jsx,tsx}',
    './config/**/*.{js,ts,jsx,tsx}',
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
    './hooks/**/*.{js,ts,jsx,tsx}',
    './utils/**/*.{js,ts,jsx,tsx}',
    './types/**/*.{js,ts,jsx,tsx}',
    './context/**/*.{js,ts,jsx,tsx}',
    './stores/**/*.{js,ts,jsx,tsx}',
    './data/**/*.{js,ts,jsx,tsx}',
    './config/**/*.{js,ts,jsx,tsx}',
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
  const ROOT_LEVEL_DIRS = ['app/', 'lib/', 'hooks/', 'utils/', 'types/', 'context/', 'stores/', 'data/', 'config/', 'api/', 'components/']
  // Root layout 路徑變體：LLM 有時漏寫 app/ 前綴。必須與 sanitizeCodeForDeploy Fix 8 一致覆蓋
  const ROOT_LAYOUT_PATHS = new Set(['app/layout.tsx', 'app/layout.ts', 'layout.tsx', 'layout.ts'])
  let hasCustomLayout = false
  for (const comp of code.components) {
    // L36: 不再 strip components/ 前綴 — strip 後 components/AdminShell.tsx 會變
    // AdminShell.tsx 走「裸檔案放根目錄」路徑，但 import '@/components/AdminShell' 找不到。
    // 正確邏輯：path 已含目錄前綴（含 components/）→ 保留原樣；只有裸檔案才加 components/。
    const cleanPath = stripRouteGroups(comp.path)

    // Root layout：強制歸位到 app/layout.tsx，避免無前綴版本被放到根目錄變死檔
    if (ROOT_LAYOUT_PATHS.has(cleanPath)) {
      hasCustomLayout = true
      const normalized = cleanPath.startsWith('app/') ? cleanPath : `app/${cleanPath}`
      files.push({ file: normalized, data: comp.content })
      continue
    }

    // 已有頂層目錄前綴（含 components/）→ 保留原路徑
    if (ROOT_LEVEL_DIRS.some(dir => cleanPath.startsWith(dir))) {
      files.push({ file: cleanPath, data: comp.content })
    }
    // 根目錄裸檔案（如 LLM 寫 'Dashboard.tsx' 沒前綴）→ 默認歸 components/
    else if (!cleanPath.includes('/')) {
      files.push({ file: `components/${cleanPath}`, data: comp.content })
    }
    // 其他子目錄但無頂層前綴（如 'admin/AdminShell.tsx'）→ 加 components/ 前綴
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
      instrumentSerif: 'Instrument_Serif', instrumentSans: 'Instrument_Sans',
      bricolageGrotesque: 'Bricolage_Grotesque', libreBaskerville: 'Libre_Baskerville',
      crimsonPro: 'Crimson_Pro', fraunces: 'Fraunces', bitter: 'Bitter',
      archivo: 'Archivo', albertSans: 'Albert_Sans', lexend: 'Lexend',
      onest: 'Onest', beVietnamPro: 'Be_Vietnam_Pro',
      cormorantGaramond: 'Cormorant_Garamond', lora: 'Lora',
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
      const pagePath = stripRouteGroups(page.path)
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

  // vercel.json — 自動注入 region 對齊 Neon DB（NEON_DEFAULT_REGION=aws-ap-southeast-1）
  // 不設則 Vercel default 通常 iad1 美東 → 跨太平洋 200-300ms 延遲
  // Hobby plan 收到 regions 設定會 silent ignore（不報錯），Pro/Enterprise 才生效 → 無副作用
  // 客戶代碼若已含 vercel.json（透過 Coder 或 project_files 自訂）→ 保留客戶版本
  if (!files.some(f => f.file === 'vercel.json')) {
    files.push({
      file: 'vercel.json',
      data: JSON.stringify({
        $schema: 'https://openapi.vercel.sh/vercel.json',
        regions: ['sin1'],
        functions: {
          'app/**/*.ts': { maxDuration: 60 },
        },
      }, null, 2),
    })
  }

  // 若 components/ImageCredits.tsx 被注入 → 在 layout 的 </body> 前插入
  if (files.some(f => f.file === 'components/ImageCredits.tsx')) {
    injectImageCreditsIntoLayout(files)
  }

  logger.info({ fileCount: files.length, paths: files.map(f => f.file) }, 'wrapInNextJs 最終檔案清單')

  return files
}

/**
 * 在 app/layout.tsx 的 </body> 前插入 <ImageCredits />
 * import 區加 `import ImageCredits from '@/components/ImageCredits'`
 * 找不到 </body> 或 layout 缺失 → 記 warn，跳過（不阻斷部署）
 */
function injectImageCreditsIntoLayout(files: VercelFile[]): void {
  const idx = files.findIndex(f => f.file === 'app/layout.tsx')
  if (idx < 0) {
    logger.warn('注入 ImageCredits：找不到 app/layout.tsx，跳過')
    return
  }
  let content = files[idx].data

  // 已經引用則跳過（避免重複注入）
  if (content.includes('ImageCredits')) return

  const IMPORT_LINE = `import ImageCredits from '@/components/ImageCredits'`

  // 找最後一個 import 語句後面插入
  const importRegex = /^import[^\n]+$/gm
  const importMatches = [...content.matchAll(importRegex)]
  if (importMatches.length > 0) {
    const last = importMatches[importMatches.length - 1]
    const insertAt = (last.index ?? 0) + last[0].length
    content = content.slice(0, insertAt) + '\n' + IMPORT_LINE + content.slice(insertAt)
  } else {
    content = IMPORT_LINE + '\n' + content
  }

  // </body> 前插入 <ImageCredits />
  if (content.includes('</body>')) {
    content = content.replace('</body>', '        <ImageCredits />\n      </body>')
  } else {
    logger.warn('注入 ImageCredits：layout.tsx 找不到 </body>，跳過渲染注入（import 仍保留）')
  }

  files[idx].data = content
}

/**
 * 建立 Vercel Project
 */
export async function createVercelProject(name: string): Promise<VercelProject | null> {
  const token = getEnv().VERCEL_ACCESS_TOKEN!
  const teamId = getEnv().VERCEL_TEAM_ID

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
        logger.info({ name }, 'Vercel project 已存在，確保公開存取')
        await disableDeploymentProtection(name)
        return null
      }
      logger.error({ errorText }, '建立 Vercel Project 失敗')
      return null
    }

    // 新建專案後關閉 Deployment Protection
    await disableDeploymentProtection(name)

    return await response.json() as VercelProject
  } catch (err) {
    logger.error({ err }, '建立 Vercel Project 錯誤')
    return null
  }
}

/**
 * 關閉 Vercel 專案的 Deployment Protection，讓所有人都能訪問
 */
async function disableDeploymentProtection(projectName: string): Promise<void> {
  const token = getEnv().VERCEL_ACCESS_TOKEN!
  const teamId = getEnv().VERCEL_TEAM_ID

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
      logger.warn({ errorText }, '關閉 Deployment Protection 失敗')
    } else {
      logger.info({ projectName }, '已關閉 Deployment Protection')
    }
  } catch (err) {
    logger.warn({ err }, '關閉 Deployment Protection 異常')
  }
}

/**
 * 部署檔案到 Vercel
 */
export async function deployFilesToVercel(
  projectName: string,
  files: VercelFile[],
  target: 'production' | 'preview' = 'production',  // 預設 production 保向後相容；preview-deployer.ts 傳 'preview'
): Promise<VercelDeployment | null> {
  const token = getEnv().VERCEL_ACCESS_TOKEN!
  const teamId = getEnv().VERCEL_TEAM_ID

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
        target,
        projectSettings: {
          framework: 'nextjs',
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error({ errorText, target }, '部署失敗')
      return null
    }

    return await response.json() as VercelDeployment
  } catch (err) {
    logger.error({ err, target }, '部署錯誤')
    return null
  }
}

/**
 * 等待部署完成
 */
export async function waitForDeploymentReady(deploymentId: string, maxWaitMs = 300000): Promise<VercelDeployment | null> {
  const token = getEnv().VERCEL_ACCESS_TOKEN!
  const teamId = getEnv().VERCEL_TEAM_ID
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

/**
 * 抓取 Vercel 部署的 build logs（失敗時用於除錯）
 * 回傳最後 50 行 stderr log，失敗時回傳空字串
 */
async function fetchVercelBuildLogs(deploymentId: string): Promise<string> {
  try {
    const token = getEnv().VERCEL_ACCESS_TOKEN!
    const teamId = getEnv().VERCEL_TEAM_ID
    const params = new URLSearchParams()
    if (teamId) params.append('teamId', teamId)

    const response = await fetch(
      `${VERCEL_API}/v7/deployments/${deploymentId}/events?${params}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    )

    if (!response.ok) return ''

    const events = await response.json() as Array<{ type?: string; text?: string; payload?: { text?: string } }>
    const errorLines = events
      .filter(e => e.type === 'stderr' || e.type === 'error')
      .map(e => e.text || e.payload?.text || '')
      .filter(Boolean)

    return errorLines.slice(-50).join('\n')
  } catch {
    return ''
  }
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
  const token = getEnv().VERCEL_ACCESS_TOKEN
  if (!token) {
    return { success: false, error: '缺少 VERCEL_ACCESS_TOKEN' }
  }

  const teamId = getEnv().VERCEL_TEAM_ID
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
      logger.error({ errText }, 'Promote 失敗')

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
        logger.error({ aliasErr }, 'Alias fallback 失敗')
        return { success: false, error: '回滾失敗，請稍後再試。' }
      }
    }

    return {
      success: true,
      url: `https://${detail.url}`,
    }
  } catch (err) {
    logger.error({ err }, '回滾錯誤')
    return { success: false, error: `回滾失敗：${err instanceof Error ? err.message : String(err)}` }
  }
}

// ============================================================
// 刪除 Vercel 專案
// ============================================================

/**
 * 刪除 Vercel 上的專案（用於用戶刪除專案時一併清理）
 */
export async function deleteVercelProject(
  projectName: string
): Promise<{ success: boolean; error?: string }> {
  const token = getEnv().VERCEL_ACCESS_TOKEN
  if (!token) {
    return { success: false, error: '缺少 VERCEL_ACCESS_TOKEN' }
  }

  const teamId = getEnv().VERCEL_TEAM_ID
  const params = new URLSearchParams()
  if (teamId) params.append('teamId', teamId)

  try {
    const response = await fetch(
      `${VERCEL_API}/v9/projects/${encodeURIComponent(projectName)}?${params}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      }
    )

    if (response.status === 204 || response.status === 200) {
      logger.info({ projectName }, '已刪除 Vercel 專案')
      return { success: true }
    }

    if (response.status === 404) {
      logger.info({ projectName }, 'Vercel 專案不存在，跳過刪除')
      return { success: true }
    }

    const errorText = await response.text()
    logger.error({ status: response.status, errorText }, '刪除 Vercel 專案失敗')
    return { success: false, error: `Vercel API 錯誤: ${response.status}` }
  } catch (err) {
    logger.error({ err }, '刪除 Vercel 專案異常')
    return { success: false, error: err instanceof Error ? err.message : String(err) }
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
 * 路徑遍歷防護：確保解析後的路徑在目標目錄內
 */
function validateFilePath(dir: string, filePath: string): string {
  // 先 normalize 消除 ..（LLM 可能生成 app/personalities/../components/Header.tsx 這類合法相對路徑）
  const normalizedFilePath = path.normalize(filePath)
  const resolvedDir = path.resolve(dir)
  const resolvedPath = path.resolve(dir, normalizedFilePath)
  // 確保解析後的路徑仍在目標目錄內（防止真正的路徑遍歷攻擊）
  if (!resolvedPath.startsWith(resolvedDir + path.sep) && resolvedPath !== resolvedDir) {
    throw new Error(`Path traversal detected: ${filePath} resolves outside ${dir}`)
  }
  return resolvedPath
}

/**
 * 將 VercelFile[] 完整寫入磁碟目錄
 */
async function writeFilesToTempDir(dir: string, files: VercelFile[]): Promise<void> {
  for (const f of files) {
    const fullPath = validateFilePath(dir, f.file)
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
      const fullPath = validateFilePath(dir, f.file)
      await fsPromises.mkdir(path.dirname(fullPath), { recursive: true })
      await fsPromises.writeFile(fullPath, f.data, 'utf-8')
    }
  }
}

/**
 * 執行 npm install（timeout 120s）
 */
export async function runNpmInstall(dir: string): Promise<{ success: boolean; output: string }> {
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
          NODE_OPTIONS: `--max-old-space-size=${getEnv().DEPLOY_BUILD_MAX_MEMORY_MB}`,
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
 * 規範化 globals.css 為 Tailwind v3 — 砍 v4 語法 + 保證 v3 directives 存在。
 *
 * **這個函數必須自包含**：所有 caller（sanitizeCodeForDeploy / assembleDeployFiles /
 * fixBuildErrors 後的 cleanup / 未來新加的路徑）拿到的回傳值都必須是「可直接給 Tailwind v3
 * 跑的 globals.css」。不能讓下游補 directives — 因為非 deploy 路徑（iteration / UIUX
 * 完成寫 DB / WebContainer preview）沒有 assembleDeployFiles 那層補丁，直接寫 DB 就 dead。
 *
 * 為什麼用 v3：deployer.ts:250 + app/lib/webcontainer-utils.ts:43 都 pin `tailwindcss: '^3.4.0'`。
 * 生成的客戶 app 用 v3。Tellcraft 前端開發本身用 v4（CLAUDE.md 寫的 v4 是指 chat UI app，
 * 不是這條 generation pipeline）。
 *
 * Idempotent：多次呼叫結果一致。已含 v3 directives 不重複 prepend。
 */
export function cleanTailwindV4Syntax(styles: string): string {
  let result = styles

  // === 1. 砍 v4 語法 ===
  // @import "tailwindcss" 及子路徑
  result = result.replace(/@import\s*["']tailwindcss(?:\/[^"']*)?["']\s*;?\s*/g, '')
  // @config 指令
  result = result.replace(/@config\s*["'][^"']*["']\s*;?\s*/g, '')
  // @theme {} → :root {}
  result = result.replace(/@theme\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g, (_m, inner: string) => {
    const trimmed = inner.trim()
    return trimmed.length > 0 ? `:root {\n${trimmed}\n}` : ''
  })
  // @utility/@variant/@custom-variant 移除
  result = result.replace(/@(?:utility|variant|custom-variant)\s+[\w-]+\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/g, '')
  // @apply font-{name}：非標準 Tailwind font utility 轉為直接 CSS
  const standardFonts = new Set(['sans', 'serif', 'mono'])
  result = result.replace(/@apply\s+font-([\w-]+)\s*;/g, (match, fontName: string) => {
    if (standardFonts.has(fontName)) return match
    return `font-family: var(--font-${fontName}, inherit);`
  })

  // === 2. 保證 v3 directives 存在（自包含 — 不靠下游補）===
  // 檢查三條 directive 是否完整；任一缺失即 prepend 標準三行（idempotent — 既有就不重複）
  const hasBase = /@tailwind\s+base\s*;/.test(result)
  const hasComponents = /@tailwind\s+components\s*;/.test(result)
  const hasUtilities = /@tailwind\s+utilities\s*;/.test(result)
  if (!hasBase || !hasComponents || !hasUtilities) {
    // 先砍掉零散的 @tailwind 指令（避免重複），統一用標準三行 prepend
    result = result.replace(/^\s*@tailwind\s+\w+\s*;\s*$/gm, '')
    result = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n${result.trimStart()}`
  }

  return result
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
  currentDeps: Record<string, string>,
  trackingContext?: { userId?: string; conversationId?: string }
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
9. **Next.js 15 的 params/searchParams 必須是 async**：
   - 如果看到 \`Type '{ params: { id: string; }; }' does not satisfy the constraint 'PageProps'\` 或 \`'params' are incompatible\` 或 \`Promise<any>\` 相關錯誤
   - 這是 Next.js 15 的 breaking change：page/layout 組件的 \`params\` 和 \`searchParams\` 現在是 \`Promise\` 類型
   - 修復方式：\`export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; ... }\`
   - 同理 \`searchParams\` 也要改成 \`Promise<{ ... }>\`，解構時用 \`await searchParams\`
   - 函式必須標記 \`async\`
   - **不要用舊寫法** \`{ params: { id: string } }\`
10. **useSearchParams 需要 Suspense boundary**（Next.js 15）：
   - 如果看到 \`useSearchParams() should be wrapped in a suspense boundary\` 或類似錯誤
   - page 檔案中使用 useSearchParams() 時，必須將 page 內容提取到獨立的 Client 組件
   - page.tsx 改為 Server Component，import Client 組件並用 \`<Suspense>\` 包裹
   - 範例：
     \`\`\`tsx:app/search/SearchClient.tsx
     'use client'
     import { useSearchParams } from 'next/navigation'
     export default function SearchClient() { const params = useSearchParams(); ... }
     \`\`\`
     \`\`\`tsx:app/search/page.tsx
     import { Suspense } from 'react'
     import SearchClient from './SearchClient'
     export default function Page() { return <Suspense><SearchClient /></Suspense> }
     \`\`\`
11. **如果錯誤是 CSS/PostCSS 處理失敗**（webpack errors related to globals.css）：
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

  // 指數退避重試（對齊 callClaude 的重試機制）
  const FIX_RETRY_MAX = 3
  const FIX_RETRY_BASE_DELAY_MS = 3000
  let lastError: unknown = null

  for (let retryAttempt = 1; retryAttempt <= FIX_RETRY_MAX; retryAttempt++) {
    try {
      // 使用 streaming 避免 Anthropic SDK 的非串流超時限制
      const stream = client.messages.stream({
        model: MODEL.HAIKU,
        max_tokens: 24000,
        messages: [{ role: 'user', content: prompt }],
      })
      const response = await stream.finalMessage()

      // 記錄 LLM 用量
      const usage = response.usage
      if (usage) {
        trackLlmUsage({
          model: MODEL.HAIKU,
          inputTokens: usage.input_tokens || 0,
          outputTokens: usage.output_tokens || 0,
          purpose: 'deploy_build_fix',
          userId: trackingContext?.userId,
          conversationId: trackingContext?.conversationId,
        })
      }

      const content = response.content
        .filter(block => block.type === 'text')
        .map(block => (block as { type: 'text'; text: string }).text)
        .join('\n')

      // 解析修復後的檔案（複用 quality-gate 的模式）
      const fixedCode = parseLLMFixedFiles(content, code)

      // 解析新依賴
      const newDependencies: Record<string, string> = {}
      const depsMatch = content.match(/`{3,}json:NEW_DEPENDENCIES\n([\s\S]*?)`{3,}/)
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

      recordTelemetry({
        skillName: 'deployer', eventType: 'deployer_layer_trigger', patternKey: `l3_build_fix_success`,
        outcome: 'repaired', phase: 'deployer_l3', fixRounds: retryAttempt,
        userId: trackingContext?.userId, conversationId: trackingContext?.conversationId,
      }).catch(() => {})
      return { code: fixedCode, newDependencies }
    } catch (error) {
      lastError = error
      const errMsg = String(error)
      const isRetryable = errMsg.includes('overloaded_error') ||
        errMsg.includes('rate_limit_error') ||
        errMsg.includes('529') ||
        errMsg.includes('503') ||
        errMsg.includes('ECONNRESET') ||
        errMsg.includes('ETIMEDOUT')

      if (retryAttempt < FIX_RETRY_MAX && isRetryable) {
        const delay = FIX_RETRY_BASE_DELAY_MS * Math.pow(2, retryAttempt - 1) // 3s, 6s, 12s
        logger.warn({ attempt: retryAttempt, maxRetries: FIX_RETRY_MAX, delayMs: delay, errMsg: errMsg.slice(0, 150) }, 'fixBuildErrors LLM 暫時性錯誤，即將重試')
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      // 非暫時性錯誤或重試用盡
      logger.error({ err: error, attempt: retryAttempt, maxRetries: FIX_RETRY_MAX }, 'fixBuildErrors LLM 呼叫失敗')
      recordTelemetry({
        skillName: 'deployer', eventType: 'deployer_layer_trigger', patternKey: `l3_build_fix_failed`,
        outcome: 'failed', phase: 'deployer_l3', fixRounds: retryAttempt,
        errorType: isRetryable ? 'retryable_api_error' : 'non_retryable_error',
        userId: trackingContext?.userId, conversationId: trackingContext?.conversationId,
        payload: { error: truncateFeedback(errMsg) },
      }).catch(() => {})
      return null
    }
  }

  logger.error({ err: lastError }, 'fixBuildErrors 所有重試都失敗')
  recordTelemetry({
    skillName: 'deployer', eventType: 'deployer_layer_trigger', patternKey: 'l3_all_retries_exhausted',
    outcome: 'failed', phase: 'deployer_l3', fixRounds: FIX_RETRY_MAX,
    userId: trackingContext?.userId, conversationId: trackingContext?.conversationId,
  }).catch(() => {})
  return null
}

/**
 * 解析 LLM 修復結果，合併回原始代碼結構
 */
function parseLLMFixedFiles(content: string, originalCode: GeneratedCode): GeneratedCode {
  const fileRegex = /`{3,}(?:tsx|ts|jsx|js|css):([^\n]+)\n([\s\S]*?)`{3,}/g

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
      logger.info({ filePath }, 'parseLLMFixedFiles 新增缺失組件')
      result.components.push({
        path: filePath,
        content: fileContent,
        description: `Auto-generated to fix build error: ${filePath}`,
      })
    }
  }
  for (const [filePath, fileContent] of fixedPages) {
    if (!originalCode.pages.some(p => p.path === filePath)) {
      logger.info({ filePath }, 'parseLLMFixedFiles 新增缺失頁面')
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

  // 替換 next.config.ts，加回 ignoreBuildErrors: true（headers 同步保留供 Vercel preview iframe）
  const configIdx = files.findIndex(f => f.file === 'next.config.ts')
  if (configIdx >= 0) {
    files[configIdx].data = `import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
${CLIENT_APP_IMAGE_REMOTE_PATTERNS}
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self' https://tellcraft.com https://*.tellcraft.com https://*.vercel.app http://localhost:* http://127.0.0.1:*" },
        ],
      },
    ]
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
  onProgress?: ProgressCallback,
  trackingContext?: { userId?: string; conversationId?: string }
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

    // 語義：MAX_ATTEMPTS 次 LLM 修復機會 + 最後 1 次驗證 build
    // attempt 1: build → fail → LLM fix #1
    // attempt 2: build (verify fix #1) → fail → LLM fix #2
    // attempt 3: build (verify fix #2) → fail → LLM fix #3
    // attempt 4: build (verify fix #3) → fail → degrade
    for (let attempt = 1; attempt <= MAX_ATTEMPTS + 1; attempt++) {
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
            logger.info({ badPkgs }, 'npm install 失敗，移除壞依賴')
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
            logger.error('npm install 最終失敗，降級部署')
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
        await onProgress?.({ percent: 10 + attempt * 6, step: `構建驗證：第 ${attempt} 次修復後重新構建...` })
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
      await onProgress?.({ percent: 15 + attempt * 6, step: `構建驗證：執行 next build（第 ${attempt} 次）...` })
      const buildResult = await runNextBuild(tmpDir)

      if (buildResult.success) {
        logger.info({ attempt }, 'Build 驗證通過')
        if (attempt > 1) {
          fixes.push(`第 ${attempt} 次構建通過（AI 自動修復成功）`)
        }
        recordTelemetry({
          skillName: 'deployer', eventType: 'deployer_layer_trigger',
          patternKey: attempt === 1 ? 'l4_build_first_pass' : `l4_build_fixed_round_${attempt}`,
          outcome: attempt === 1 ? 'success' : 'repaired', phase: 'deployer_l4', fixRounds: attempt,
          userId: trackingContext?.userId, conversationId: trackingContext?.conversationId,
        }).catch(() => {})
        await onProgress?.({ percent: 40, step: '構建驗證通過！' })
        return {
          files: wrapInNextJs(currentCode, projectName, tailwindConfig, currentExtraDeps, injectedFiles),
          buildVerified: true,
          fixes,
          finalCode: currentCode,
        }
      }

      // Build 失敗 — 解析錯誤
      logger.info({ attempt }, 'Build 失敗，解析錯誤...')
      const buildErrors = parseBuildErrors(buildResult.output)
      logger.info({ count: buildErrors.length, errors: buildErrors.map(e => e.message) }, '發現 build 錯誤')

      if (buildErrors.length === 0) {
        // 印出 build output 尾部以便診斷未知錯誤格式
        const outputTail = buildResult.output.slice(-1500)
        logger.warn({ outputTail }, 'Build 失敗但無法解析錯誤')
        fixes.push('Build 失敗但無法解析錯誤類型')
        break
      }

      // 前 MAX_ATTEMPTS 次 build 失敗嘗試 LLM 修復，第 MAX_ATTEMPTS+1 次是純驗證 build
      if (attempt <= MAX_ATTEMPTS) {
        // LLM 修復
        await onProgress?.({ percent: 20 + attempt * 6, step: `AI 修復構建錯誤（第 ${attempt} 次）...` })

        const allDeps = { ...BASE_DEPS, ...currentExtraDeps }
        const fixResult = await fixBuildErrors(currentCode, buildErrors, buildResult.output, allDeps, trackingContext)

        if (!fixResult) {
          logger.warn('LLM 修復失敗，繼續下一輪')
          fixes.push(`第 ${attempt} 次 AI 修復失敗`)
          continue
        }

        currentCode = fixResult.code
        // LLM 可能在修復中重新引入 Tailwind v4 語法，每次修復後再清理一遍
        if (currentCode.styles) {
          currentCode.styles = cleanTailwindV4Syntax(currentCode.styles)
        }
        if (Object.keys(fixResult.newDependencies).length > 0) {
          currentExtraDeps = { ...currentExtraDeps, ...fixResult.newDependencies }
          fixes.push(`AI 新增依賴: ${Object.keys(fixResult.newDependencies).join(', ')}`)
        }
        fixes.push(`第 ${attempt} 次 AI 修復了 ${buildErrors.length} 個錯誤`)
      }
    }

    // 所有嘗試都失敗 → 降級
    logger.warn({ maxAttempts: MAX_ATTEMPTS }, 'LLM 修復 + 驗證 build 都失敗，降級為 ignoreBuildErrors 部署')
    fixes.push(`${MAX_ATTEMPTS} 次 AI 修復都失敗，降級為忽略構建錯誤部署`)
    recordTelemetry({
      skillName: 'deployer', eventType: 'deployer_layer_trigger', patternKey: 'l4_all_rounds_degrade',
      outcome: 'failed', phase: 'deployer_l4', fixRounds: MAX_ATTEMPTS + 1,
      userId: trackingContext?.userId, conversationId: trackingContext?.conversationId,
    }).catch(() => {})
    return {
      files: wrapInNextJsWithIgnoreErrors(currentCode, projectName, tailwindConfig, currentExtraDeps, injectedFiles),
      buildVerified: false,
      fixes,
      finalCode: currentCode,
    }
  } catch (err) {
    logger.error({ err }, 'verifyBuildLocally 異常')
    fixes.push(`構建驗證異常：${err instanceof Error ? err.message : String(err)}`)
    return {
      files: wrapInNextJsWithIgnoreErrors(currentCode, projectName, tailwindConfig, currentExtraDeps, injectedFiles),
      buildVerified: false,
      fixes,
      finalCode: currentCode,
    }
  } finally {
    if (slotAcquired) releaseDeploySlot()
    // 清理臨時目錄
    try {
      await fsPromises.rm(tmpDir, { recursive: true, force: true })
    } catch (cleanupErr) {
      logger.error({ err: cleanupErr, tmpDir }, '清理臨時目錄失敗')
    }
  }
}

// ============================================================
// Vercel Environment Variables 注入
// ============================================================

/**
 * Brace-aware merge of duplicate `className="..."` within the same JSX opening tag.
 *
 * Pure regex breaks because JSX expressions like `onClick={() => fn()}` contain a real
 * `>` character; `[^<>]` would terminate at the `=>` arrow. We scan all string-literal
 * className occurrences and pair adjacent ones that share an opening tag (no real `<` or
 * `>` between them at brace-depth 0). Multi-occurrence tags handled by re-scanning rounds.
 */
function mergeDuplicateClassNames(content: string): { content: string; count: number } {
  let totalCount = 0
  let working = content
  for (let round = 0; round < 5; round++) {
    const re = /className="([^"]*)"/g
    const matches: Array<{ start: number; end: number; value: string }> = []
    let m: RegExpExecArray | null
    while ((m = re.exec(working)) !== null) {
      matches.push({ start: m.index, end: m.index + m[0].length, value: m[1] })
    }
    if (matches.length < 2) break

    let merged = false
    for (let i = matches.length - 1; i >= 1; i--) {
      const a = matches[i - 1]
      const b = matches[i]
      const between = working.slice(a.end, b.start)

      let depth = 0
      let inSameTag = true
      for (let j = 0; j < between.length; j++) {
        const c = between[j]
        if (c === '{') depth++
        else if (c === '}') depth--
        else if (depth === 0 && (c === '<' || c === '>')) {
          inSameTag = false
          break
        }
      }
      if (!inSameTag) continue

      const mergedValue = `${a.value} ${b.value}`.replace(/\s+/g, ' ').trim()
      const newFirst = `className="${mergedValue}"`

      let removeFrom = b.start
      while (removeFrom > a.end && /\s/.test(working[removeFrom - 1])) {
        removeFrom--
      }

      working =
        working.slice(0, a.start) +
        newFirst +
        working.slice(a.end, removeFrom) +
        working.slice(b.end)

      totalCount++
      merged = true
      break
    }
    if (!merged) break
  }
  return { content: working, count: totalCount }
}

// Keys whose absence guarantees runtime 500 — must fail-fast so the deployment never
// reaches Vercel build with broken env. Lib actions throw `DATABASE_URL is not set`
// before any meaningful page render, so a "deployed app" without DATABASE_URL is worse
// than a clear deployment failure (user gets to retry instead of seeing 500s in browser).
const CRITICAL_ENV_KEYS = new Set(['DATABASE_URL'])

// Vercel/Node 自動提供，不需 Tellcraft 注入；scan 時 skip
const VERCEL_AUTO_ENV_KEYS = new Set([
  'NODE_ENV',
  'VERCEL',
  'VERCEL_URL',
  'VERCEL_ENV',
  'VERCEL_REGION',
  'VERCEL_DEPLOYMENT_ID',
  'VERCEL_GIT_COMMIT_SHA',
  'VERCEL_GIT_COMMIT_REF',
  'PORT',
])

/**
 * Page → Action 參數契約檢查。
 *
 * 動機：page 經常呼叫 `xxxAction({})` 或 `xxxAction({ id })` 不帶 filter，
 * 而 lib action 內部讀 `input.servicesSectionId` 等。Server Action wrapper 會把
 * userId 從 cookie 注入但**不會推導其他必要參數**——LLM 沒考慮 page 端可能不傳。
 *
 * Runtime 行為：input.X 是 undefined → SQL 帶 NULL 參數 → 0 rows → page 顯示空。
 * 不會 throw，是「靜默資料缺失」最難 debug 的類型。
 *
 * 此檢查兩階段：
 *   1. 從 lib/actions/*.ts 抽出 `input.\w+` 引用集合（除了 _stepSummary, userId）
 *   2. 從 app 頁面檔抽出 `xxxAction({...})` 呼叫，比對是否傳了所有 required keys
 *
 * 回傳警告清單（不阻斷部署，由 telemetry 追蹤改善）。複雜呼叫（spread、條件參數、
 * 動態 key）保守 skip 不報警，避免誤殺。
 */
export function checkPageActionContract(files: VercelFile[]): { warnings: string[] } {
  // 第一步：collect action → required input keys
  // action filename：lib/actions/get-services-section.ts → fnName getServicesSection → wrapper getServicesSectionAction
  const actionRequirements = new Map<string, Set<string>>()
  for (const f of files) {
    if (!f.file.startsWith('lib/actions/') || !/\.tsx?$/.test(f.file)) continue
    const fileName = f.file.replace(/^lib\/actions\//, '').replace(/\.tsx?$/, '')
    // toCamelCase
    const fnName = fileName.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    const actionName = fnName + 'Action'

    const inputRefs = new Set<string>()
    const re = /\binput\.(\w+)\b/g
    let m: RegExpExecArray | null
    while ((m = re.exec(f.data)) !== null) {
      const key = m[1]
      if (key === '_stepSummary' || key === 'userId') continue
      inputRefs.add(key)
    }
    actionRequirements.set(actionName, inputRefs)
  }

  // 第二步：scan pages 的 action calls
  const warnings: string[] = []
  for (const f of files) {
    if (!f.file.startsWith('app/') || !/page\.(tsx|jsx)$/.test(f.file)) continue

    // 匹配 `xxxAction(arg)` — arg 可能跨多行，需要 brace counting
    // 先粗略匹配：find `\w+Action(` 開頭，找到對應 close paren
    const callRe = /\b(\w+Action)\s*\(/g
    let m: RegExpExecArray | null
    while ((m = callRe.exec(f.data)) !== null) {
      const actionName = m[1]
      const required = actionRequirements.get(actionName)
      if (!required || required.size === 0) continue

      // 從 ( 開始，brace count 找到匹配的 )
      const argStart = m.index + m[0].length
      let depth = 1
      let argEnd = argStart
      while (argEnd < f.data.length && depth > 0) {
        const c = f.data[argEnd]
        if (c === '(' || c === '{' || c === '[') depth++
        else if (c === ')' || c === '}' || c === ']') depth--
        if (depth === 0) break
        argEnd++
      }
      const argStr = f.data.slice(argStart, argEnd).trim()

      // 若含 spread `...` 或 conditional `?:` 或變數展開，保守 skip
      if (/\.\.\./.test(argStr) || /\?\s*[\w[]/.test(argStr)) continue

      // 抽出 object literal keys (`key: value` pattern at top level)
      const passedKeys = new Set<string>()
      // 簡化：只抓 `\bkey\s*:` 形式（不嚴謹但足以涵蓋大多數情況）
      const keyRe = /\b(\w+)\s*:/g
      let km: RegExpExecArray | null
      // 限定在 argStr 第一層（不進入 nested object）
      let topDepth = 0
      let inString: string | null = null
      const topLevelStr: string[] = []
      for (let i = 0; i < argStr.length; i++) {
        const c = argStr[i]
        if (inString) {
          if (c === inString && argStr[i - 1] !== '\\') inString = null
          continue
        }
        if (c === '"' || c === "'" || c === '`') inString = c
        else if (c === '{' || c === '[' || c === '(') topDepth++
        else if (c === '}' || c === ']' || c === ')') topDepth--
        else if (topDepth === 1) topLevelStr.push(c)
      }
      // topLevelStr 含第一層 object 內容
      const topLevel = topLevelStr.join('')
      while ((km = keyRe.exec(topLevel)) !== null) {
        passedKeys.add(km[1])
      }

      const missing = [...required].filter(k => !passedKeys.has(k))
      if (missing.length > 0) {
        warnings.push(
          `${f.file}: 呼叫 ${actionName}({...}) 缺少必要參數 [${missing.join(', ')}]，` +
          `runtime 該欄位將為 undefined → SQL 永不匹配 → 0 rows / 漏資料`
        )
      }
    }
  }
  return { warnings }
}

/**
 * 偵測並移除 lib/actions/*.ts 內 `sql\`...\`` template literal 中重複的 WHERE 條件。
 *
 * 真實案例（用戶下載專案 `list-service-items.ts:11-12`）：
 * ```
 * WHERE services_section_id = ${servicesSectionId}
 *
 *   AND services_section_id = ${input.servicesSectionId}
 * ```
 *
 * 同欄位被 `WHERE col = $1 AND col = $2` 寫成兩次。BDD setup 時兩個 binding 都同 ID
 * 還能過，runtime 用戶呼叫沒帶 sectionId → 兩個 binding 都 NULL → SQL 永不匹配
 * 看似返回空陣列正常實則完全漏資料。
 *
 * 此函數在每個 sql 模板內：
 *   1. 抽出所有 `WHERE/AND <col> = ${...}` 條件
 *   2. 用 column name + operator 做 key 偵測重複
 *   3. 保留第一個出現的，移除後續重複（含前置的 `AND` 與該行 whitespace）
 *
 * 不處理：跨 sql 模板、複雜 OR 條件、sub-query 內的 WHERE。
 */
function dedupeRedundantWhereClauses(content: string): { content: string; count: number } {
  let totalCount = 0
  // 找出所有 sql 標籤模板（lib/db.ts 的 `sql\`...\`` pattern）
  const sqlBlockRe = /(sql`)([^`]*)(`)/g
  const result = content.replace(sqlBlockRe, (full, opener, body, closer) => {
    // 抽出所有 `WHERE col = ...` 與 `AND col = ...` 條件
    // pattern: 邊界（WHERE 或 AND）+ 欄位名 + `=` 或其他比較 + 值（${...} 或字面值）
    const condRe = /\b(WHERE|AND)\b\s+(\w+)\s*(=|!=|<>)\s*(\$\{[^}]*\}|[^\s]+)/gi
    const seen = new Map<string, { matchStart: number; matchEnd: number }>()
    const removed: Array<{ start: number; end: number }> = []

    let m: RegExpExecArray | null
    while ((m = condRe.exec(body)) !== null) {
      const op = m[1].toUpperCase()
      const col = m[2].toLowerCase()
      const cmp = m[3]
      const key = `${col}|${cmp}`
      if (seen.has(key) && op === 'AND') {
        // 重複：擴展到包含前置 AND 與行首 whitespace
        let removeStart = m.index
        // 往前吃掉一個 AND 前的所有 whitespace（保留換行格式整齊）
        while (removeStart > 0 && /[ \t]/.test(body[removeStart - 1])) {
          removeStart--
        }
        // 若前一字元是換行符，整行刪掉
        if (removeStart > 0 && body[removeStart - 1] === '\n') {
          removeStart--
        }
        removed.push({ start: removeStart, end: m.index + m[0].length })
        totalCount++
      } else {
        seen.set(key, { matchStart: m.index, matchEnd: m.index + m[0].length })
      }
    }

    if (removed.length === 0) return full

    // 從後往前刪（保持索引有效）
    removed.sort((a, b) => b.start - a.start)
    let modifiedBody = body
    for (const r of removed) {
      modifiedBody = modifiedBody.slice(0, r.start) + modifiedBody.slice(r.end)
    }
    return opener + modifiedBody + closer
  })
  return { content: result, count: totalCount }
}

/**
 * 從 lib/actions/*.ts 內所有 SQL 抽取 `FROM <table>` 與 `INSERT INTO <table>` 的表名集合。
 * 用於部署前對 Neon 實際 schema 做存在性比對。
 *
 * 為什麼需要：BDD 階段如果 `準備一個 X` 失敗會直接報錯，但 deployer 沒辦法重現 BDD
 * 的 setup；如果 schema 因為 DDL 部分失敗 / 客戶手動 drop 表 / Neon provisioning 沒跑
 * 完整等原因有缺表，runtime 第一次 SQL 查詢就 500。
 */
/**
 * L38: 從 UIUX code 提取「測試帳號：X / Y」hint，給 deployer 在 Neon DB 對齊 admin seed
 *
 * 支援 pattern（最寬鬆抓法）：
 *   - 測試帳號：admin / admin123
 *   - 測試帳號: admin/admin123
 *   - Test account: admin / admin123
 *   - Demo: admin/admin123
 *   - placeholder="admin" + placeholder="admin123" 雙 input field
 *
 * 回 null 表示沒找到 hint（保留現有 seed 不動）
 */
export function extractAdminCredentialHint(files: VercelFile[]): { username: string; password: string } | null {
  // 主要 pattern: 「測試帳號|Test|Demo|Default 」 + 帳號 + / + 密碼
  const re = /(?:測試帳號|測試帳戶|Test\s*account|Demo|Default)\s*[:：]\s*([\w@.\-]+)\s*[\/／]\s*([\w@.!\-]+)/i
  for (const f of files) {
    if (!/\.(tsx?|jsx?|md|html)$/.test(f.file)) continue
    if (!f.file.startsWith('app/') && !f.file.startsWith('components/') && !f.file.startsWith('lib/')) continue
    const m = f.data.match(re)
    if (m) {
      const username = m[1].trim()
      const password = m[2].trim()
      // 過濾明顯不像 credential 的 false positive（不允許空、超長、含 HTML/JSX tag）
      if (!username || !password) continue
      if (username.length > 64 || password.length > 64) continue
      if (/<|>|\{|\}/.test(username + password)) continue
      return { username, password }
    }
  }
  return null
}

export function extractReferencedTables(files: VercelFile[]): string[] {
  const tables = new Set<string>()
  // L35: 只在 sql tagged template literal `sql\`...\`` 內掃描，避免誤抓
  // 字串字面值如 `_stepSummary: 'Update Page Section'` 之前被 regex 誤判為 SQL
  // (因為 `Update Page` 匹配 `(?:UPDATE)\s+([a-z_]+)`)，導致 deployer 報「Neon 缺表 page」等假錯誤
  const sqlBlockRe = /\bsql\s*`([^`]+)`/g
  const tableRefRe = /(?:FROM|INTO|UPDATE)\s+([a-z_][a-z0-9_]*)\b/gi
  for (const f of files) {
    if (!f.file.startsWith('lib/actions/') && !f.file.startsWith('app/api/')) continue
    if (!/\.(tsx?|jsx?)$/.test(f.file)) continue
    sqlBlockRe.lastIndex = 0
    let block: RegExpExecArray | null
    while ((block = sqlBlockRe.exec(f.data)) !== null) {
      tableRefRe.lastIndex = 0
      let m: RegExpExecArray | null
      while ((m = tableRefRe.exec(block[1])) !== null) {
        const name = m[1].toLowerCase()
        if (['values', 'select', 'where', 'on'].includes(name)) continue
        if (name.startsWith('pg_') || name.startsWith('information_schema')) continue
        tables.add(name)
      }
    }
  }
  return [...tables].sort()
}

/**
 * 查詢 Neon 實際存在的 public schema 表清單，與 expected 對照。
 *
 * 失敗（連不上 Neon）回 null，呼叫端用 fallback 不阻斷部署；查到結果則回差集。
 */
async function checkNeonSchemaExists(
  connectionString: string,
  expectedTables: string[],
): Promise<{ existing: string[]; missing: string[] } | null> {
  if (expectedTables.length === 0) {
    return { existing: [], missing: [] }
  }
  const { Client } = await import('pg')
  const client = new Client({ connectionString })
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 8000)
    await client.connect()
    clearTimeout(timer)
    const res = await client.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
    )
    const existing = new Set<string>(res.rows.map((r: { tablename: string }) => r.tablename.toLowerCase()))
    const missing = expectedTables.filter(t => !existing.has(t))
    return {
      existing: [...existing].sort(),
      missing,
    }
  } catch (err) {
    logger.warn({ err }, 'Neon schema check 失敗，降級不阻斷部署')
    return null
  } finally {
    try { await client.end() } catch { /* swallow */ }
  }
}

interface EnvScanReport {
  /** 在生成代碼中被 `process.env.X` 引用的 key 集合 */
  referenced: string[]
  /** 已在 envVars 注入清單裡的 key 集合 */
  injected: string[]
  /** 引用了但未注入、也不是 Vercel 自動提供 → 部署後 runtime 會是 undefined */
  missing: string[]
  /** missing 中屬於 CRITICAL_ENV_KEYS 的子集 → fail-fast */
  missingCritical: string[]
}

/**
 * 掃描客戶 app 代碼裡所有 `process.env.X` 引用，並與 envVars 注入清單比對。
 *
 * 為什麼需要：BDD 階段 envVars 是測試環境完整準備的，runtime Vercel 端需要靠
 * deployer 主動注入才有。LLM 偶爾會在生成代碼中 reference 一個 Tellcraft 不認識
 * 的 env var（如 BDD 提到 Stripe → `process.env.STRIPE_SECRET_KEY`），deployer
 * 不會自動 inject，runtime 該行就是 undefined → 客戶 app 的相關功能直接無聲失敗。
 *
 * 這個掃描分兩級：
 * - **CRITICAL 缺失**（如 DATABASE_URL）→ 阻斷部署
 * - **非 CRITICAL 缺失**（如 STRIPE_SECRET_KEY）→ warn + telemetry，讓用戶知道
 *   有哪些 env 需要去 Vercel UI 自己補（不阻斷，因為 user 可能已手動設過）
 */
export function scanProcessEnvReferences(
  files: VercelFile[],
  injected: Set<string>,
): EnvScanReport {
  const referenced = new Set<string>()
  // Tellcraft 平台自身的 env（用於後端 BDD 測試），絕不該出現在客戶 app 代碼中
  const TELLCRAFT_INTERNAL = new Set([
    // L36: JWT_SECRET 移除 — 客戶 Coder 生成的 admin login / API auth 合法使用，
    // 由 deployer 自動 inject 隨機 secret（見 deployer.ts:1654+ needsJwtSecret 分支）
    'NEON_API_KEY',
    'VERCEL_ACCESS_TOKEN',
    'ANTHROPIC_API_KEY',
    'CLAUDE_API_KEY',
    'OPENAI_API_KEY',  // 除非客戶 app 自己用 OpenAI，否則屬內部
  ])

  for (const f of files) {
    // 只掃客戶 app 會在 runtime 執行的檔案：lib/、app/、middleware
    const isRuntimeFile =
      f.file === 'middleware.ts' ||
      f.file.startsWith('lib/') ||
      f.file.startsWith('app/')
    if (!isRuntimeFile) continue
    if (!/\.(tsx?|jsx?|mjs|cjs)$/.test(f.file)) continue

    // 匹配 `process.env.X` 與 `process.env["X"]` 兩種形式
    const re = /process\.env(?:\.([A-Z][A-Z0-9_]*)|\[\s*['"]([A-Z][A-Z0-9_]*)['"]\s*\])/g
    let m: RegExpExecArray | null
    while ((m = re.exec(f.data)) !== null) {
      const key = m[1] || m[2]
      if (!key) continue
      if (VERCEL_AUTO_ENV_KEYS.has(key)) continue
      if (TELLCRAFT_INTERNAL.has(key)) {
        // 出現 Tellcraft 內部 env 在客戶 app → bug 但不算 missing；獨立警告處理
        continue
      }
      referenced.add(key)
    }
  }

  const missing = [...referenced].filter(k => !injected.has(k)).sort()
  const missingCritical = missing.filter(k => CRITICAL_ENV_KEYS.has(k))

  return {
    referenced: [...referenced].sort(),
    injected: [...injected].sort(),
    missing,
    missingCritical,
  }
}

interface SmokeFailure {
  path: string
  status: number
  snippet?: string
}

/**
 * 從生成檔案推導出該打哪些 HTTP 路徑做 smoke test。
 *
 * 設計思路：早期版本只打 `/` + `/admin/login`，但這兩條路徑都不查 DB——
 * 客戶真實的 500 通常落在 admin/* 內部那種 useEffect → Server Action → DB
 * 的頁面。所以這個函數要把所有「真的會載入資料」的頁面都挖出來。
 *
 * 規則：
 *   1. 一定打 `/` 與所有 admin/* 子頁
 *   2. 偵測 i18n locale 路由（app/[locale]/）→ 補 `/zh` 前綴版本
 *   3. dynamic 段（[id]）跳過——沒真實 ID 試會 404 或 500 但是預期內
 *   4. route group `(auth)` 在 URL 上不出現 → strip 掉
 *   5. 上限 12 條（避免太慢）
 */
export function deriveSmokeTestPaths(files: VercelFile[]): string[] {
  const pageFiles = files.filter(f =>
    f.file.startsWith('app/') && /\/page\.(tsx|jsx|ts|js)$/.test(f.file)
  )

  const hasLocaleRoute = pageFiles.some(f => f.file.includes('app/[locale]/'))
  const localePrefix = hasLocaleRoute ? '/zh' : ''

  // 把 file path 轉成 URL path：strip `app/`, `(group)/`, locale segment, page.tsx
  function fileToUrl(file: string): string | null {
    let p = file.replace(/^app\//, '').replace(/\/page\.(tsx|jsx|ts|js)$/, '')
    // route group `(auth)` 在 URL 上不出現
    p = p.split('/').filter(seg => !/^\(.+\)$/.test(seg)).join('/')
    // dynamic segment [id] / [...slug] → 跳過（無真實值）
    if (/\[[^\]]+\]/.test(p.replace(/^\[locale\]\//, ''))) return null
    // 移除 [locale] 前綴（後面手動補）
    p = p.replace(/^\[locale\]\//, '')
    return '/' + p
  }

  const set = new Set<string>()
  set.add(`${localePrefix}/`)

  for (const f of pageFiles) {
    const url = fileToUrl(f.file)
    if (!url) continue
    // 限定打 admin/* 與根目錄頁面（其他靜態 landing 頁面已經透過 / 涵蓋）
    if (url === '/' || url.startsWith('/admin/') || url.startsWith('/dashboard')) {
      set.add(`${localePrefix}${url}`)
    }
  }

  // 上限 12 條 + 排序：優先打有 DB 查詢相關的 admin/dashboard 頁面
  const arr = Array.from(set)
  arr.sort((a, b) => {
    // 根頁優先；其次 admin/services 之類的列表頁；admin/login 等靜態頁殿後
    const score = (p: string): number => {
      if (p === `${localePrefix}/`) return 0
      if (/\/admin\/login$/.test(p)) return 100  // 靜態，殿後
      if (/\/admin\//.test(p)) return 10
      if (/\/dashboard/.test(p)) return 20
      return 50
    }
    return score(a) - score(b)
  })
  return arr.slice(0, 12)
}

/**
 * 部署後對 Vercel runtime 打 HTTP 探測，回傳所有 ≥500 的失敗路徑。
 *
 * Vercel `READY` 只代表 Next build 過了，不代表 SSR 跑得起來：
 * 1. DATABASE_URL 缺失 → `lib/db.ts` throw → 任何 server action 都 500
 * 2. SSR render 抛例外（root layout / 共用組件）→ HTML 路徑 500
 * 3. 只查靜態頁的 smoke 形同虛設——必須打 useEffect+DB 的真實 admin 頁面
 *
 * 並行打多個路徑，每路徑 5s timeout，follow 一次重定向，抓 body 前 400 char。
 * 失敗回 array；空 array 代表全綠。永不 throw（telemetry/UI 處理）。
 */
async function runDeploymentSmokeTest(
  deploymentUrl: string,
  files: VercelFile[]
): Promise<SmokeFailure[]> {
  const candidates = deriveSmokeTestPaths(files)
  logger.info({ deploymentUrl, paths: candidates }, 'Smoke test 路徑清單')

  // 並行打所有路徑，加快速度（最多 12 條 × 5s = 5s 而不是 60s）
  const results = await Promise.all(candidates.map(async (p): Promise<SmokeFailure | null> => {
    let status = 0
    let snippet: string | undefined
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 5000)
      const res = await fetch(`${deploymentUrl}${p}`, {
        method: 'GET',
        redirect: 'manual',
        signal: ctrl.signal,
      })
      clearTimeout(timer)
      status = res.status
      if (status >= 500) {
        const body = await res.text().catch(() => '')
        snippet = body.slice(0, 400).replace(/\s+/g, ' ').trim()
      }
    } catch (err: any) {
      status = 0
      snippet = `fetch error: ${err?.message ?? String(err)}`
    }
    if (status >= 500 || status === 0) {
      return { path: p, status, snippet }
    }
    return null
  }))

  return results.filter((r): r is SmokeFailure => r !== null)
}

export async function injectVercelEnvVars(
  projectName: string,
  envVars: Record<string, string>
): Promise<void> {
  const token = getEnv().VERCEL_ACCESS_TOKEN
  if (!token) {
    const criticalAttempted = Object.keys(envVars).filter(k => CRITICAL_ENV_KEYS.has(k))
    if (criticalAttempted.length > 0) {
      throw new Error(`VERCEL_ACCESS_TOKEN 未設定，無法注入 critical env: ${criticalAttempted.join(', ')}`)
    }
    return
  }

  const teamId = getEnv().VERCEL_TEAM_ID
  const params = new URLSearchParams()
  if (teamId) params.append('teamId', teamId)

  // Collect per-key failures; throw at end if any CRITICAL key never landed.
  const failedKeys: string[] = []

  for (const [key, value] of Object.entries(envVars)) {
    let succeeded = false
    try {
      // 先嘗試建立
      const res = await fetch(`${VERCEL_API}/v10/projects/${encodeURIComponent(projectName)}/env?${params}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key,
          value,
          target: ['production', 'preview'],
          type: 'encrypted',
        }),
      })

      if (res.ok) {
        succeeded = true
      } else if (res.status === 400 || res.status === 409) {
        // 已存在 → 查詢 env id 後 PATCH 更新
        const listRes = await fetch(`${VERCEL_API}/v9/projects/${encodeURIComponent(projectName)}/env?${params}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        if (listRes.ok) {
          const listData = await listRes.json() as { envs: Array<{ id: string; key: string }> }
          const existing = listData.envs?.find((e: { key: string }) => e.key === key)
          if (existing) {
            const patchRes = await fetch(`${VERCEL_API}/v9/projects/${encodeURIComponent(projectName)}/env/${existing.id}?${params}`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ value, target: ['production', 'preview'], type: 'encrypted' }),
            })
            if (patchRes.ok) {
              succeeded = true
              logger.info({ key }, 'Vercel env var 已更新（覆寫）')
            } else {
              logger.warn({ key, status: patchRes.status }, 'Vercel env var 更新失敗')
            }
          }
        }
      } else {
        logger.warn({ key, status: res.status }, 'Vercel env var 注入失敗')
      }
    } catch (err) {
      logger.warn({ err, key }, 'Vercel env var 注入異常')
    }
    if (!succeeded) failedKeys.push(key)
  }

  const criticalFailed = failedKeys.filter(k => CRITICAL_ENV_KEYS.has(k))
  if (criticalFailed.length > 0) {
    throw new Error(`Vercel critical env vars 注入失敗（部署中止）：${criticalFailed.join(', ')}`)
  }
}

/**
 * 只在 Vercel 環境變數不存在時建立（不覆蓋已有值）
 * 用於 AUTH_SECRET 等一次性生成的密鑰，避免每次部署後使所有 session 失效
 */
async function injectVercelEnvVarIfNotExists(
  projectName: string,
  key: string,
  value: string,
): Promise<void> {
  const token = getEnv().VERCEL_ACCESS_TOKEN
  if (!token) return

  const teamId = getEnv().VERCEL_TEAM_ID
  const params = new URLSearchParams()
  if (teamId) params.append('teamId', teamId)

  try {
    const res = await fetch(`${VERCEL_API}/v10/projects/${encodeURIComponent(projectName)}/env?${params}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value, target: ['production', 'preview'], type: 'encrypted' }),
    })
    if (res.status === 400 || res.status === 409) {
      logger.info({ key }, 'Vercel env var 已存在，跳過（保留原值）')
    } else if (!res.ok) {
      logger.warn({ key, status: res.status }, 'Vercel env var 建立失敗')
    } else {
      logger.info({ key }, 'Vercel env var 首次建立')
    }
  } catch (err) {
    logger.warn({ err, key }, 'Vercel env var 注入異常')
  }
}
