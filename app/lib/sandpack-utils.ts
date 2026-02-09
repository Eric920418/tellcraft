/**
 * Sandpack 預覽工具函數
 * 將 AI 生成的 TSX/CSS 轉換為 Sandpack 可用的檔案結構
 */

import type { SandpackFiles } from '@codesandbox/sandpack-react'

export interface GeneratedFile {
  path: string
  content: string
  description: string
}

// ============================================================
// 已知依賴映射（與 deployer.ts KNOWN_PACKAGES 同步）
// ============================================================
const SANDPACK_KNOWN_DEPS: Record<string, string> = {
  'motion/react': 'latest',
  'framer-motion': 'latest',
  'lucide-react': 'latest',
  'class-variance-authority': 'latest',
  'clsx': 'latest',
  'tailwind-merge': 'latest',
  'react-icons': 'latest',
  '@heroicons/react': 'latest',
  'recharts': 'latest',
  'date-fns': 'latest',
  'zod': 'latest',
  'react-hook-form': 'latest',
  '@hookform/resolvers': 'latest',
  'embla-carousel-react': 'latest',
  'react-day-picker': 'latest',
  'sonner': 'latest',
  'cmdk': 'latest',
  'vaul': 'latest',
  'input-otp': 'latest',
  'next-themes': 'latest',
  '@radix-ui/react-dialog': 'latest',
  '@radix-ui/react-dropdown-menu': 'latest',
  '@radix-ui/react-popover': 'latest',
  '@radix-ui/react-select': 'latest',
  '@radix-ui/react-tabs': 'latest',
  '@radix-ui/react-toast': 'latest',
  '@radix-ui/react-tooltip': 'latest',
  '@radix-ui/react-slot': 'latest',
  '@radix-ui/react-scroll-area': 'latest',
  '@radix-ui/react-separator': 'latest',
  '@radix-ui/react-switch': 'latest',
  '@radix-ui/react-checkbox': 'latest',
  '@radix-ui/react-accordion': 'latest',
  '@radix-ui/react-alert-dialog': 'latest',
  '@radix-ui/react-avatar': 'latest',
  '@radix-ui/react-label': 'latest',
  '@radix-ui/react-slider': 'latest',
  '@radix-ui/react-navigation-menu': 'latest',
  '@radix-ui/react-collapsible': 'latest',
  '@radix-ui/react-toggle': 'latest',
  '@radix-ui/react-toggle-group': 'latest',
  '@radix-ui/react-aspect-ratio': 'latest',
  '@radix-ui/react-hover-card': 'latest',
  '@radix-ui/react-menubar': 'latest',
  '@radix-ui/react-context-menu': 'latest',
  '@radix-ui/react-progress': 'latest',
  '@radix-ui/react-radio-group': 'latest',
}

// 不需要安裝的套件（React 內建 / Sandpack 自帶 / shim 處理）
const BUILTIN_PACKAGES = new Set([
  'react', 'react-dom', 'react/jsx-runtime',
  'next', 'next/font', 'next/font/google', 'next/image', 'next/link',
  'next/navigation', 'next/router', 'next/head', 'next/script',
])

// ============================================================
// Next.js Shim 檔案
// ============================================================
const NEXT_IMAGE_SHIM = `import React from 'react';
export default function Image({ src, alt, fill, width, height, className, style, priority, ...rest }) {
  const imgStyle = fill
    ? { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', ...style }
    : { width, height, ...style };
  return React.createElement('img', { src, alt, className, style: imgStyle, loading: priority ? 'eager' : 'lazy', ...rest });
}
`

const NEXT_LINK_SHIM = `import React from 'react';
export default function Link({ href, children, className, style, ...rest }) {
  return React.createElement('a', { href, className, style, ...rest }, children);
}
`

const NEXT_NAVIGATION_SHIM = `export function useRouter() {
  return { push: () => {}, replace: () => {}, back: () => {}, forward: () => {}, refresh: () => {}, prefetch: () => {} };
}
export function usePathname() { return '/'; }
export function useSearchParams() { return new URLSearchParams(); }
export function useParams() { return {}; }
export function redirect() {}
export function notFound() {}
`

const NEXT_THEMES_SHIM = `import React from 'react';
export function ThemeProvider({ children }) { return React.createElement(React.Fragment, null, children); }
export function useTheme() { return { theme: 'light', setTheme: () => {}, resolvedTheme: 'light', themes: ['light', 'dark'] }; }
`

// ============================================================
// 核心函數
// ============================================================

/**
 * 從 TSX 內容中提取 next/font/google 字體資訊
 * 返回 { fontNames: ['DM Sans', 'Inter'], varNames: { font: 'DM_Sans' } }
 */
function extractGoogleFonts(content: string): {
  fontNames: string[]
  varInitLines: RegExp[]
  memberReplacements: Map<string, string>
} {
  const fontNames: string[] = []
  const varInitLines: RegExp[] = []
  const memberReplacements = new Map<string, string>()

  // 匹配 import { DM_Sans, Inter } from 'next/font/google'
  const importRegex = /import\s*\{\s*([\w\s,]+)\s*\}\s*from\s*['"]next\/font\/google['"]/g
  let m
  while ((m = importRegex.exec(content)) !== null) {
    const names = m[1].split(',').map(s => s.trim()).filter(Boolean)
    for (const name of names) {
      // DM_Sans → DM Sans
      const readableName = name.replace(/_/g, ' ')
      fontNames.push(readableName)
    }
  }

  // 匹配 const font = DM_Sans({ ... }) 或 const dmSans = DM_Sans({ ... })
  const initRegex = /const\s+(\w+)\s*=\s*\w+\s*\(\s*\{[^}]*\}\s*\)/g
  while ((m = initRegex.exec(content)) !== null) {
    const varName = m[1]
    varInitLines.push(new RegExp(`const\\s+${varName}\\s*=\\s*\\w+\\s*\\([^)]*\\)`, 'g'))
    // font.className / font.variable → ''
    memberReplacements.set(`${varName}.className`, "''")
    memberReplacements.set(`${varName}.variable`, "''")
    memberReplacements.set(`${varName}.style.fontFamily`, "''")
  }

  return { fontNames, varInitLines, memberReplacements }
}

/**
 * 重寫單個檔案的 import 路徑
 */
function rewriteImports(content: string, filePath: string): string {
  let result = content

  // 移除 'use client' / 'use server'
  result = result.replace(/^['"]use client['"];?\s*\n?/m, '')
  result = result.replace(/^['"]use server['"];?\s*\n?/m, '')

  // 處理 next/font/google（完整移除 import + 初始化 + 替換成員訪問）
  const fontInfo = extractGoogleFonts(result)
  // 移除 import 行
  result = result.replace(/import\s*\{[^}]*\}\s*from\s*['"]next\/font\/google['"].*\n?/g, '')
  // 移除初始化行
  for (const re of fontInfo.varInitLines) {
    result = result.replace(re, '')
  }
  // 替換成員訪問（font.className → ''）
  for (const [member, replacement] of fontInfo.memberReplacements) {
    // 處理 className={font.className} 和模板字串 `${font.className}`
    const escaped = member.replace(/\./g, '\\.')
    result = result.replace(new RegExp(escaped, 'g'), replacement)
  }

  // next/image → shim
  result = result.replace(
    /import\s+(\w+)\s+from\s+['"]next\/image['"]/g,
    "import $1 from './shims/NextImage'"
  )

  // next/link → shim
  result = result.replace(
    /import\s+(\w+)\s+from\s+['"]next\/link['"]/g,
    "import $1 from './shims/NextLink'"
  )

  // next/navigation → shim
  result = result.replace(
    /import\s*\{([^}]*)\}\s*from\s*['"]next\/navigation['"]/g,
    "import {$1} from './shims/NextNavigation'"
  )

  // next-themes → shim
  result = result.replace(
    /import\s*\{([^}]*)\}\s*from\s*['"]next-themes['"]/g,
    "import {$1} from './shims/NextThemes'"
  )

  // framer-motion → motion/react（安全網）
  result = result.replace(
    /from\s+['"]framer-motion['"]/g,
    "from 'motion/react'"
  )

  // @/ alias → 相對路徑
  // 計算當前檔案的目錄深度來決定相對路徑前綴
  const depth = filePath.split('/').length - 1
  const prefix = depth > 0 ? '../'.repeat(depth) : './'
  result = result.replace(
    /from\s+['"]@\/([^'"]+)['"]/g,
    (_, p) => `from '${prefix}${p}'`
  )

  // 移除其他 next/* import（next/head, next/script 等）
  result = result.replace(/import\s+.*\s+from\s+['"]next\/(?:head|script|dynamic)['"]\s*;?\s*\n?/g, '')

  return result
}

/**
 * 將生成的檔案路徑映射到 Sandpack 路徑
 */
function mapToSandpackPath(originalPath: string): string {
  // app/page.tsx → /App.tsx
  if (/^app\/(page|home)\.(tsx|jsx)$/.test(originalPath)) return '/App.tsx'
  // app/layout.tsx → /Layout.tsx
  if (/^app\/layout\.(tsx|jsx)$/.test(originalPath)) return '/Layout.tsx'
  // app/globals.css → /styles.css
  if (/^app\/globals\.css$/.test(originalPath)) return '/styles.css'
  // components/X.tsx → /components/X.tsx
  // hooks/X.ts → /hooks/X.ts
  // lib/X.ts → /lib/X.ts
  // utils/X.ts → /utils/X.ts
  // types/X.ts → /types/X.ts
  return '/' + originalPath
}

/**
 * 掃描所有檔案的 import，收集需要安裝的 npm 依賴
 */
function scanDependencies(files: Record<string, string>): Record<string, string> {
  const deps: Record<string, string> = {}
  const importRegex = /(?:import|from)\s+['"]([^'"./][^'"]*)['"]/g

  for (const content of Object.values(files)) {
    let m
    importRegex.lastIndex = 0
    while ((m = importRegex.exec(content)) !== null) {
      const raw = m[1]
      // 提取套件名：@scope/name 或 name
      const pkg = raw.startsWith('@')
        ? raw.split('/').slice(0, 2).join('/')
        : raw.split('/')[0]

      if (BUILTIN_PACKAGES.has(pkg) || BUILTIN_PACKAGES.has(raw)) continue
      if (pkg.startsWith('./') || pkg.startsWith('../')) continue

      if (SANDPACK_KNOWN_DEPS[raw]) {
        deps[raw] = SANDPACK_KNOWN_DEPS[raw]
      } else if (SANDPACK_KNOWN_DEPS[pkg]) {
        deps[pkg] = SANDPACK_KNOWN_DEPS[pkg]
      }
    }
  }

  return deps
}

/**
 * 從完整 Tailwind TS config 中提取 theme.extend 用於 CDN 配置
 */
function extractTailwindCdnConfig(configContent: string): string {
  const extendMatch = configContent.match(/extend:\s*\{/)
  if (!extendMatch || extendMatch.index === undefined) return ''

  const start = extendMatch.index + extendMatch[0].length
  let depth = 1
  let i = start

  while (i < configContent.length && depth > 0) {
    if (configContent[i] === '{') depth++
    else if (configContent[i] === '}') depth--
    if (depth > 0) i++
  }

  const extendBody = configContent.substring(start, i).trim()
  if (!extendBody) return ''

  let jsObj = extendBody
    .replace(/\s+as\s+\w+/g, '')
    .replace(/\/\/.*$/gm, '')

  return `tailwind.config = {
    theme: {
      extend: {
        ${jsObj}
      }
    }
  }`
}

/**
 * 收集所有檔案中的 Google Fonts 名稱
 */
function collectGoogleFonts(allContent: string): string[] {
  const fonts: string[] = []
  const importRegex = /import\s*\{\s*([\w\s,]+)\s*\}\s*from\s*['"]next\/font\/google['"]/g
  let m
  while ((m = importRegex.exec(allContent)) !== null) {
    const names = m[1].split(',').map(s => s.trim()).filter(Boolean)
    for (const name of names) {
      fonts.push(name.replace(/_/g, ' '))
    }
  }
  // Fallback：從 CSS font-family
  if (fonts.length === 0) {
    const cssFontMatch = allContent.match(/font-family:\s*'([^']+)'/)
    if (cssFontMatch) fonts.push(cssFontMatch[1])
  }
  return fonts
}

/**
 * 主函數：將生成的 TSX/CSS 轉為 Sandpack 設定
 */
export function buildSandpackSetup(
  pages: GeneratedFile[],
  components: GeneratedFile[],
  styles: string,
  tailwindConfig?: string
): { files: SandpackFiles; dependencies: Record<string, string> } {
  const files: Record<string, string> = {}
  const allContents: string[] = []

  // 1. 映射頁面檔案
  for (const page of pages) {
    const sandpackPath = mapToSandpackPath(page.path)
    const rewritten = rewriteImports(page.content, sandpackPath.slice(1))
    files[sandpackPath] = rewritten
    allContents.push(page.content)
  }

  // 2. 映射組件/layout 檔案
  for (const comp of components) {
    const sandpackPath = mapToSandpackPath(comp.path)
    const rewritten = rewriteImports(comp.content, sandpackPath.slice(1))
    files[sandpackPath] = rewritten
    allContents.push(comp.content)
  }

  // 3. 收集字體資訊（在 rewrite 之前的原始內容上提取）
  const allRawContent = allContents.join('\n')
  const googleFonts = collectGoogleFonts(allRawContent)
  const fontLinksHtml = googleFonts.length > 0
    ? googleFonts.map(f => {
        const urlFont = f.replace(/\s+/g, '+')
        return `<link href="https://fonts.googleapis.com/css2?family=${urlFont}:wght@300;400;500;600;700&display=swap" rel="stylesheet">`
      }).join('\n    ')
    : '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">'

  const primaryFont = googleFonts.length > 0 ? googleFonts[0] : 'Inter'

  // 4. 清理 CSS
  const cleanStyles = styles
    .replace(/@import\s+["']tailwindcss["'];?/g, '')
    .replace(/@tailwind\s+\w+;?/g, '')
    .replace(/@theme\s*\{([\s\S]*?)\}/g, ':root {$1}')
    .replace(/@utility\s+[\w-]+\s*\{[\s\S]*?\}/g, '')
    .replace(/@variant\s+[\w-]+\s*\{[\s\S]*?\}/g, '')

  files['/styles.css'] = cleanStyles

  // 5. Shim 檔案
  files['/shims/NextImage.jsx'] = NEXT_IMAGE_SHIM
  files['/shims/NextLink.jsx'] = NEXT_LINK_SHIM
  files['/shims/NextNavigation.js'] = NEXT_NAVIGATION_SHIM
  files['/shims/NextThemes.jsx'] = NEXT_THEMES_SHIM

  // 6. Tailwind CDN 配置
  const tailwindCdnScript = tailwindConfig ? extractTailwindCdnConfig(tailwindConfig) : ''

  // 7. 構建 Layout 包裹邏輯
  const hasLayout = '/Layout.tsx' in files
  const hasApp = '/App.tsx' in files

  // 8. Entry file: /index.tsx
  const entryImports = []
  const entryBody = []
  entryImports.push("import React from 'react'")
  entryImports.push("import { createRoot } from 'react-dom/client'")
  entryImports.push("import './styles.css'")

  if (hasLayout && hasApp) {
    entryImports.push("import Layout from './Layout'")
    entryImports.push("import App from './App'")
    entryBody.push('createRoot(document.getElementById("root")).render(<Layout><App /></Layout>)')
  } else if (hasApp) {
    entryImports.push("import App from './App'")
    entryBody.push('createRoot(document.getElementById("root")).render(<App />)')
  } else if (pages.length > 0) {
    // 找第一個可用的頁面
    const firstPagePath = mapToSandpackPath(pages[0].path)
    const importName = 'Page'
    entryImports.push(`import ${importName} from '${firstPagePath.replace(/\.tsx$/, '')}'`)
    entryBody.push(`createRoot(document.getElementById("root")).render(<${importName} />)`)
  }

  files['/index.tsx'] = entryImports.join('\n') + '\n\n' + entryBody.join('\n') + '\n'

  // 9. index.html
  files['/public/index.html'] = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  ${tailwindCdnScript ? `<script>${tailwindCdnScript}</script>` : ''}
  ${fontLinksHtml}
  <style>
    body { font-family: '${primaryFont}', system-ui, sans-serif; margin: 0; }
  </style>
</head>
<body>
  <div id="root"></div>
</body>
</html>`

  // 10. 掃描依賴
  const scannedDeps = scanDependencies(files)
  // 預設始終包含常用依賴
  const dependencies: Record<string, string> = {
    'react': '^18.2.0',
    'react-dom': '^18.2.0',
    'motion': 'latest',
    ...scannedDeps,
  }

  // 移除 shim 處理的套件（不需要實際安裝）
  delete dependencies['next-themes']

  return { files: files as SandpackFiles, dependencies }
}

/**
 * 差異比對：只返回有變更的檔案（用於 streaming 增量更新）
 * 返回 null 表示沒有變更
 */
export function diffSandpackFiles(
  prev: SandpackFiles,
  next: SandpackFiles
): SandpackFiles | null {
  const changed: SandpackFiles = {}
  let hasChange = false

  for (const [path, content] of Object.entries(next)) {
    const prevContent = prev[path]
    const nextStr = typeof content === 'string' ? content : (content as { code: string }).code
    const prevStr = prevContent
      ? (typeof prevContent === 'string' ? prevContent : (prevContent as { code: string }).code)
      : undefined

    if (prevStr !== nextStr) {
      changed[path] = content
      hasChange = true
    }
  }

  return hasChange ? changed : null
}
