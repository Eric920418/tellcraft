/**
 * WebContainer 檔案系統工具
 *
 * 將 Tellcraft 生成的代碼（GeneratedFile[]）轉換為 WebContainer FileSystemTree。
 * 與 sandpack-utils.ts 的根本差異：不需要任何 shim/rewrite。
 * WebContainers 跑真正的 Node.js + Next.js，所有 Next.js 特性原生支援。
 */

import type { FileSystemTree } from '@webcontainer/api'

// ── Types ──

export interface GeneratedFile {
  path: string
  content: string
  description?: string
}

export interface WebContainerFilesInput {
  pages: GeneratedFile[]
  components: GeneratedFile[]
  styles: string
  tailwindConfig?: string
  // Server-side files (from Coder Skill)
  serverActions?: GeneratedFile[]
  apiRoutes?: GeneratedFile[]
  dbLib?: GeneratedFile[]
  // 有 DB 連線時保留真實 lib/db.ts，沒有時注入 mock
  neonConnectionString?: string
}

// ── Known Package Versions ──
// Synced with deployer.ts KNOWN_PACKAGES + BASE_DEPS

// WebContainer 用 Next.js 14（15/16 的 AsyncLocalStorage 在 WASM 不完整，StackBlitz 官方也用 14）
// 部署端 deployer 用 Next.js 16（Vercel 原生 Node.js 一切正常）
// 全系統統一 Tailwind v3
const BASE_DEPS: Record<string, string> = {
  next: '14.2.28',
  react: '^18.3.0',
  'react-dom': '^18.3.0',
  motion: '^11.0.0',
  tailwindcss: '^3.4.0',
  postcss: '^8.4.0',
  autoprefixer: '^10.0.0',
}

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
  '@neondatabase/serverless': '^0.10.0',
  'bcryptjs': '^2.4.3',
  'jsonwebtoken': '^9.0.2',
}

// Packages that are built-in or sub-exports (don't install separately)
const BUILTIN_PACKAGES = new Set([
  'react', 'react-dom', 'react/jsx-runtime',
  'next', 'next/image', 'next/link', 'next/navigation', 'next/font',
  'next/font/google', 'next/script', 'next/headers', 'next/server',
])

// ── Edit Bridge Script ──

const EDIT_BRIDGE_SCRIPT = `
(function() {
  'use strict';

  function postToParent(msg) {
    try { window.parent.postMessage(msg, '*'); } catch(e) {}
    try { if (window.top !== window.parent) window.top.postMessage(msg, '*'); } catch(e) {}
  }

  // Runtime error capture
  window.onerror = function(msg, src, line, col, err) {
    postToParent({ type: 'tc_runtimeError', name: (err && err.name) || 'Error', message: String(msg), path: src });
  };
  window.addEventListener('unhandledrejection', function(e) {
    postToParent({ type: 'tc_runtimeError', name: 'UnhandledRejection', message: e.reason ? (e.reason.message || String(e.reason)) : 'Unknown' });
  });

  let editMode = false;
  let selectedElements = [];

  // Tag counters
  let tagCounters = {};
  function resetCounters() { tagCounters = {}; }
  function getTagId(tagName, parentTag) {
    const base = parentTag ? parentTag + '-' + tagName : tagName;
    tagCounters[base] = (tagCounters[base] || 0);
    const id = base + '-' + tagCounters[base];
    tagCounters[base]++;
    return id;
  }

  // Tag all editable elements
  function tagElements() {
    resetCounters();
    const textTags = ['h1','h2','h3','h4','h5','h6','p','span','button','a','li','label','blockquote'];
    const containerTags = ['section','header','nav','footer','main','article','aside','div'];
    const imageTags = ['img'];

    // Text elements
    textTags.forEach(function(tag) {
      document.querySelectorAll(tag).forEach(function(el) {
        if (el.closest('[data-tc-ignore]')) return;
        if (!el.dataset.tcId) {
          el.dataset.tcId = getTagId(tag);
          el.dataset.tcType = 'text';
        }
      });
    });

    // Container elements (only direct children of body or section-level)
    containerTags.forEach(function(tag) {
      document.querySelectorAll(tag).forEach(function(el) {
        if (el.closest('[data-tc-ignore]')) return;
        const isTopLevel = !el.parentElement || el.parentElement === document.body || el.parentElement.tagName === 'MAIN';
        const isCard = el.classList.contains('card') || el.getAttribute('role') === 'card';
        if (isTopLevel || isCard || tag !== 'div') {
          if (!el.dataset.tcId) {
            el.dataset.tcId = getTagId('container-' + tag);
            el.dataset.tcType = 'container';
          }
        }
      });
    });

    // Images
    imageTags.forEach(function(tag) {
      document.querySelectorAll(tag).forEach(function(el) {
        if (el.closest('[data-tc-ignore]')) return;
        if (!el.dataset.tcId) {
          el.dataset.tcId = getTagId(tag);
          el.dataset.tcType = 'image';
        }
      });
    });
  }

  // Compute styles for an element
  function getElementInfo(el) {
    var computed = window.getComputedStyle(el);
    var rect = el.getBoundingClientRect();
    var info = {
      id: el.dataset.tcId,
      type: el.dataset.tcType,
      tagName: el.tagName.toLowerCase(),
      text: el.dataset.tcType === 'text' ? el.textContent : undefined,
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      styles: {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        fontFamily: computed.fontFamily,
        padding: computed.padding,
        margin: computed.margin,
        borderRadius: computed.borderRadius,
      }
    };
    if (el.dataset.tcType === 'text') {
      info.styles.textAlign = computed.textAlign;
      info.styles.lineHeight = computed.lineHeight;
      info.styles.letterSpacing = computed.letterSpacing;
    }
    if (el.dataset.tcType === 'container') {
      info.styles.flexDirection = computed.flexDirection;
      info.styles.gap = computed.gap;
      info.styles.boxShadow = computed.boxShadow;
      info.styles.background = computed.background;
    }
    if (el.dataset.tcType === 'image') {
      info.styles.objectFit = computed.objectFit;
      info.src = el.src;
      info.alt = el.alt;
    }
    return info;
  }

  // Click handler
  function handleClick(e) {
    if (!editMode) return;
    var target = e.target.closest('[data-tc-id]');
    if (!target) return;
    e.preventDefault();
    e.stopPropagation();

    var info = getElementInfo(target);
    var idx = selectedElements.indexOf(target.dataset.tcId);
    if (idx >= 0) {
      selectedElements.splice(idx, 1);
      postToParent({ type: 'tc_elementDeselected', data: info });
    } else {
      selectedElements = [target.dataset.tcId];
      postToParent({ type: 'tc_elementSelected', data: info });
    }
    postToParent({ type: 'tc_selectionChanged', data: selectedElements.map(function(id) {
      var el = document.querySelector('[data-tc-id="' + id + '"]');
      return el ? getElementInfo(el) : null;
    }).filter(Boolean) });
  }

  // Message handler
  window.addEventListener('message', function(e) {
    var msg = e.data;
    if (!msg || typeof msg.type !== 'string' || !msg.type.startsWith('tc_')) return;

    if (msg.type === 'tc_setEditMode') {
      editMode = !!msg.enabled;
      if (!editMode) {
        selectedElements = [];
        document.querySelectorAll('.tc-selected').forEach(function(el) { el.classList.remove('tc-selected'); });
      }
    }

    if (msg.type === 'tc_applyUpdate') {
      var el = document.querySelector('[data-tc-id="' + msg.elementId + '"]');
      if (el && msg.changes) {
        Object.keys(msg.changes).forEach(function(prop) {
          if (prop === 'text' || prop === 'textContent') {
            el.textContent = msg.changes[prop];
          } else if (prop === 'src' || prop === 'alt') {
            el[prop] = msg.changes[prop];
          } else {
            el.style[prop] = msg.changes[prop];
          }
        });
      }
    }

    if (msg.type === 'tc_resetElement') {
      var el2 = document.querySelector('[data-tc-id="' + msg.elementId + '"]');
      if (el2) { el2.removeAttribute('style'); }
    }

    if (msg.type === 'tc_applyOverrides') {
      if (msg.overrides) {
        Object.keys(msg.overrides).forEach(function(id) {
          var el3 = document.querySelector('[data-tc-id="' + id + '"]');
          if (el3 && msg.overrides[id]) {
            Object.keys(msg.overrides[id]).forEach(function(prop) {
              if (prop === 'text' || prop === 'textContent') {
                el3.textContent = msg.overrides[id][prop];
              } else {
                el3.style[prop] = msg.overrides[id][prop];
              }
            });
          }
        });
      }
    }

    if (msg.type === 'tc_setAnnotations') {
      document.querySelectorAll('.tc-annotation-badge').forEach(function(b) { b.remove(); });
      if (msg.annotations) {
        Object.keys(msg.annotations).forEach(function(id) {
          var el4 = document.querySelector('[data-tc-id="' + id + '"]');
          if (el4) {
            el4.style.position = el4.style.position || 'relative';
            var badge = document.createElement('div');
            badge.className = 'tc-annotation-badge';
            badge.textContent = '\\uD83D\\uDCDD';
            badge.style.cssText = 'position:absolute;top:-8px;right:-8px;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:12px;z-index:9999;pointer-events:none;';
            el4.appendChild(badge);
          }
        });
      }
    }

    if (msg.type === 'tc_deselectElement') {
      selectedElements = [];
      postToParent({ type: 'tc_selectionChanged', data: [] });
    }
  });

  // MutationObserver: re-tag after React re-renders
  var observer = new MutationObserver(function() {
    clearTimeout(observer._debounce);
    observer._debounce = setTimeout(tagElements, 300);
  });

  // Initial setup
  function init() {
    document.addEventListener('click', handleClick, true);
    tagElements();
    observer.observe(document.body, { childList: true, subtree: true });
    postToParent({ type: 'tc_iframeReady' });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
`

// ── Core Functions ──

/**
 * 清理 Tailwind v4 語法，確保 CSS 使用 v3 directives。
 * 與 deployer.ts 的 cleanTailwindV4Syntax 同邏輯。
 */
export function prepareCss(rawStyles: string | undefined, _hasTailwindConfig: boolean): string {
  let css = rawStyles || MINIMAL_CSS

  // Strip v4 語法
  css = css.replace(/@import\s*["']tailwindcss(?:\/[^"']*)?["']\s*;?\s*/g, '')
  css = css.replace(/@config\s*["'][^"']*["']\s*;?\s*/g, '')
  css = css.replace(/@theme\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g, (_m, inner: string) => {
    const trimmed = inner.trim()
    return trimmed.length > 0 ? `:root {\n${trimmed}\n}` : ''
  })
  css = css.replace(/@(?:utility|variant|custom-variant)\s+[\w-]+\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/g, '')

  // Strip existing v3 directives (avoid duplicates)
  css = css.replace(/@tailwind\s+(base|components|utilities)\s*;?\s*/g, '')

  // Prepend v3 directives
  return '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n' + css
}

/**
 * Sanitize TSX/TS file content before writing to WebContainer.
 * 修復 LLM 生成的常見語法錯誤，防止 Build Error 顯示給用戶。
 * 在前端最後一道防線執行，不依賴後端修復。
 */
export function sanitizeFileContent(path: string, content: string): string {
  if (!/\.(tsx?|jsx?)$/.test(path)) return content
  // 修復可選鏈左側賦值（n?.x += value → n.x += value）
  // LLM 常在 canvas 動畫/物理模擬代碼中產生此模式，SWC/TS 不允許
  return content.replace(/(\b\w+)\?\.([\w]+)\s*([+\-*/%]?=)(?!=)/g, '$1.$2 $3')
}

/**
 * Convert TypeScript tailwind.config.ts to CommonJS tailwind.config.js
 * WebContainer 的 Tailwind v3 PostCSS plugin 可能不支援 .ts config
 */
function convertTailwindConfigToJs(tsConfig: string): string {
  let js = tsConfig
  // Remove TypeScript type imports
  js = js.replace(/import\s+type\s*\{[^}]*\}\s*from\s*['"][^'"]*['"]\s*;?\s*/g, '')
  // Convert `const config: Config =` to `const config =`
  js = js.replace(/const\s+(\w+)\s*:\s*\w+\s*=/g, 'const $1 =')
  // Convert `export default config` to `module.exports = config`
  js = js.replace(/export\s+default\s+(\w+)\s*;?/, 'module.exports = $1')
  return js
}

/**
 * 掃描所有檔案的 @/ import，為缺失的模組生成 stub。
 * 防止 webpack 因找不到模組而 500（舊的 code_preview 資料可能不含 server-side 檔案）。
 */
function generateMissingStubs(tree: FileSystemTree, files: GeneratedFile[]): void {
  // 收集已有的檔案路徑
  const existingPaths = new Set<string>()
  for (const f of files) {
    const p = f.path.startsWith('/') ? f.path.slice(1) : f.path
    existingPaths.add(p)
    // Also add without extension for resolution
    existingPaths.add(p.replace(/\.(tsx?|jsx?)$/, ''))
  }

  // 掃描所有 import（@/ 路徑別名和相對路徑）
  const importRegex = /from\s+['"](@\/[^'"]+)['"]/g
  const missingPaths = new Set<string>()

  for (const file of files) {
    let m
    importRegex.lastIndex = 0
    while ((m = importRegex.exec(file.content)) !== null) {
      const importPath = m[1].replace('@/', '') // @/lib/db → lib/db

      // 檢查是否已有（考慮 .ts/.tsx 副檔名）
      const candidates = [
        importPath,
        importPath + '.ts',
        importPath + '.tsx',
        importPath + '/index.ts',
        importPath + '/index.tsx',
      ]
      const found = candidates.some(c => existingPaths.has(c))
      if (!found) {
        missingPaths.add(importPath)
      }
    }
  }

  // 為每個缺失路徑生成 stub
  for (const mp of missingPaths) {
    // 判斷是 Server Action ('use server') 還是普通模組
    const isAction = mp.startsWith('app/actions/') || mp.includes('/actions/')
    const isDbRelated = mp.includes('lib/db') || mp.includes('lib/actions/')

    let stub: string
    if (isAction) {
      // Server Action stub — 所有 export 的函數回傳空物件
      stub = `'use server'\n\n// Auto-generated stub (original file not in preview data)\nexport default async function stub() { return {} }\n`
      // 掃描 import 這個模組的檔案，找出 named imports 並 export 它們
      const namedExports = new Set<string>()
      for (const file of files) {
        const namedRe = new RegExp(`import\\s*\\{([^}]+)\\}\\s*from\\s*['"]@/${mp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`)
        const nm = namedRe.exec(file.content)
        if (nm) {
          nm[1].split(',').map(s => s.trim().split(' as ')[0].trim()).filter(Boolean).forEach(n => namedExports.add(n))
        }
      }
      if (namedExports.size > 0) {
        stub = `'use server'\n\n// Auto-generated stub\n`
        for (const name of namedExports) {
          stub += `export async function ${name}(...args) { return {} }\n`
        }
      }
    } else if (isDbRelated) {
      stub = MOCK_DB
    } else {
      // 普通模組 stub
      const namedExports = new Set<string>()
      for (const file of files) {
        const namedRe = new RegExp(`import\\s*\\{([^}]+)\\}\\s*from\\s*['"]@/${mp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`)
        const nm = namedRe.exec(file.content)
        if (nm) {
          nm[1].split(',').map(s => s.trim().split(' as ')[0].trim()).filter(Boolean).forEach(n => namedExports.add(n))
        }
      }
      stub = `// Auto-generated stub\n`
      for (const name of namedExports) {
        // PascalCase → component, camelCase → function/data
        if (name[0] === name[0].toUpperCase()) {
          stub += `export function ${name}() { return null }\n`
        } else {
          stub += `export const ${name} = []\n`
        }
      }
      if (namedExports.size === 0) {
        stub += `export default function Stub() { return null }\n`
      }
    }

    const filePath = mp.endsWith('.ts') || mp.endsWith('.tsx') ? mp : mp + '.ts'
    setFileInTree(tree, filePath, stub)
  }
}

/**
 * Scan all files for package imports and build a deps map
 */
function scanDependencies(files: GeneratedFile[]): Record<string, string> {
  const deps: Record<string, string> = {}
  const basePkgs = new Set(Object.keys(BASE_DEPS))
  const importRegex = /import\s+[\s\S]*?\s+from\s+['"]([^./][^'"]*)['"]/g
  const requireRegex = /require\(['"]([^./][^'"]*)['"]\)/g

  for (const file of files) {
    for (const regex of [importRegex, requireRegex]) {
      regex.lastIndex = 0
      let m
      while ((m = regex.exec(file.content)) !== null) {
        const raw = m[1]
        // Skip path aliases (@/ is Next.js tsconfig paths alias)
        if (raw.startsWith('@/')) continue

        const pkg = raw.startsWith('@') ? raw.split('/').slice(0, 2).join('/') : raw.split('/')[0]

        if (basePkgs.has(pkg)) continue
        if (BUILTIN_PACKAGES.has(raw) || BUILTIN_PACKAGES.has(pkg)) continue

        if (KNOWN_PACKAGES[pkg]) {
          deps[pkg] = KNOWN_PACKAGES[pkg]
        } else if (pkg.startsWith('@radix-ui/')) {
          deps[pkg] = '^1.1.0'
        } else {
          deps[pkg] = 'latest'
        }
      }
    }
  }

  return deps
}

/**
 * Build package.json content
 */
function buildPackageJson(allFiles: GeneratedFile[]): string {
  const extraDeps = scanDependencies(allFiles)

  const pkg = {
    name: 'tellcraft-preview',
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev --port 3000',
    },
    dependencies: {
      ...BASE_DEPS,
      ...extraDeps,
    },
  }

  return JSON.stringify(pkg, null, 2)
}

/**
 * Set a file in a nested FileSystemTree structure
 * e.g. setFileInTree(tree, 'app/components/Header.tsx', content)
 */
function setFileInTree(tree: FileSystemTree, filePath: string, contents: string): void {
  const parts = filePath.split('/')
  const fileName = parts.pop()!
  let current = tree

  for (const dir of parts) {
    if (!current[dir]) {
      current[dir] = { directory: {} }
    }
    const node = current[dir]
    if ('directory' in node) {
      current = node.directory
    }
  }

  current[fileName] = { file: { contents } }
}

/**
 * Inject edit bridge <Script> tag into layout.tsx content
 */
function injectEditBridge(layoutContent: string): string {
  // If layout already has the edit bridge, skip
  if (layoutContent.includes('edit-bridge.js')) return layoutContent

  // Add Script import if not present
  let result = layoutContent
  if (!result.includes("from 'next/script'") && !result.includes('from "next/script"')) {
    // Add import at top (after 'use client' or first import)
    const insertPoint = result.indexOf('\nimport ')
    if (insertPoint >= 0) {
      result = result.slice(0, insertPoint) + "\nimport Script from 'next/script'" + result.slice(insertPoint)
    } else {
      result = "import Script from 'next/script'\n" + result
    }
  }

  // Add <Script> before closing </body>
  result = result.replace(
    '</body>',
    '        <Script src="/edit-bridge.js" strategy="afterInteractive" />\n      </body>'
  )

  return result
}

// ── Static Config Files ──

const NEXT_CONFIG = `/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: { unoptimized: true },
}
module.exports = nextConfig
`

const TS_CONFIG = `{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
`

const POSTCSS_CONFIG = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`

const MINIMAL_LAYOUT = `import './globals.css'
import Script from 'next/script'

export const metadata = { title: 'Preview' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script src="/edit-bridge.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}
`

const MINIMAL_PAGE = `export default function Page() {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#666' }}>
    <p>等待代碼生成中...</p>
  </div>
}
`

// Mock DB for WebContainer — 所有 sql`` 查詢回傳空結果，不 crash
const MOCK_DB = `// WebContainer preview mock — no real database
// sql tagged template function 回傳空陣列，不 crash
export function sql(strings: TemplateStringsArray, ...values: unknown[]): Promise<any[]> {
  return Promise.resolve([])
}
export default sql
`

// 沒有 tailwindConfig 時的預設 config — 掃描所有檔案路徑
const DEFAULT_TAILWIND_CONFIG = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: { extend: {} },
  plugins: [],
}
`

const MINIMAL_CSS = `@tailwind base;
@tailwind components;
@tailwind utilities;
`

// ── Main Export Functions ──

/**
 * Build a minimal Next.js skeleton for initial mount (before code arrives)
 */
export function buildSkeletonFiles(): FileSystemTree {
  const tree: FileSystemTree = {}

  setFileInTree(tree, 'package.json', buildPackageJson([]))
  setFileInTree(tree, 'next.config.js', NEXT_CONFIG)
  setFileInTree(tree, 'tsconfig.json', TS_CONFIG)
  setFileInTree(tree, 'postcss.config.js', POSTCSS_CONFIG)
  setFileInTree(tree, 'app/layout.tsx', MINIMAL_LAYOUT)
  setFileInTree(tree, 'app/page.tsx', MINIMAL_PAGE)
  setFileInTree(tree, 'app/globals.css', MINIMAL_CSS)
  setFileInTree(tree, 'public/edit-bridge.js', EDIT_BRIDGE_SCRIPT)

  return tree
}

/**
 * Build the complete WebContainer FileSystemTree from generated code
 */
export function buildWebContainerFiles(input: WebContainerFilesInput): FileSystemTree {
  const tree: FileSystemTree = {}
  const allFiles: GeneratedFile[] = [
    ...input.pages,
    ...input.components,
    ...(input.serverActions || []),
    ...(input.apiRoutes || []),
    ...(input.dbLib || []),
  ]

  // package.json (with scanned dependencies)
  setFileInTree(tree, 'package.json', buildPackageJson(allFiles))

  // Config files
  setFileInTree(tree, 'next.config.js', NEXT_CONFIG)
  setFileInTree(tree, 'tsconfig.json', TS_CONFIG)
  setFileInTree(tree, 'postcss.config.js', POSTCSS_CONFIG)

  // Edit bridge
  setFileInTree(tree, 'public/edit-bridge.js', EDIT_BRIDGE_SCRIPT)

  // Tailwind config — 轉為 CJS .js 格式
  if (input.tailwindConfig) {
    const jsConfig = convertTailwindConfigToJs(input.tailwindConfig)
    setFileInTree(tree, 'tailwind.config.js', jsConfig)
  } else {
    // 沒有 config（舊的 code_preview 消息）→ 生成基本的，確保 Tailwind 掃描所有檔案
    setFileInTree(tree, 'tailwind.config.js', DEFAULT_TAILWIND_CONFIG)
  }

  // Global styles
  const processedCss = prepareCss(input.styles, !!input.tailwindConfig)
  console.log('[WC] globals.css first 200 chars:', processedCss.slice(0, 200))
  console.log('[WC] tailwindConfig present:', !!input.tailwindConfig, 'pages:', input.pages.length, 'components:', input.components.length)
  setFileInTree(tree, 'app/globals.css', processedCss)

  // Pages（sanitize 修復 LLM 常見語法錯誤，防止 Build Error 顯示給用戶）
  for (const page of input.pages) {
    const path = page.path.startsWith('/') ? page.path.slice(1) : page.path
    let content = sanitizeFileContent(path, page.content)

    // Inject edit bridge into layout.tsx
    if (path === 'app/layout.tsx' || path.endsWith('/layout.tsx')) {
      content = injectEditBridge(content)
    }

    setFileInTree(tree, path, content)
  }

  // Components
  for (const comp of input.components) {
    const path = comp.path.startsWith('/') ? comp.path.slice(1) : comp.path
    setFileInTree(tree, path, sanitizeFileContent(path, comp.content))
  }

  // Server Actions (from Coder Skill)
  if (input.serverActions) {
    for (const sa of input.serverActions) {
      const path = sa.path.startsWith('/') ? sa.path.slice(1) : sa.path
      setFileInTree(tree, path, sanitizeFileContent(path, sa.content))
    }
  }

  // API Routes (from Coder Skill)
  if (input.apiRoutes) {
    for (const ar of input.apiRoutes) {
      const path = ar.path.startsWith('/') ? ar.path.slice(1) : ar.path
      setFileInTree(tree, path, sanitizeFileContent(path, ar.content))
    }
  }

  // DB Lib (from Coder Skill)
  if (input.dbLib) {
    for (const db of input.dbLib) {
      const path = db.path.startsWith('/') ? db.path.slice(1) : db.path
      setFileInTree(tree, path, sanitizeFileContent(path, db.content))
    }
  }

  // DB 連線處理
  const allCode = allFiles.map(f => f.content).join('\n')
  const needsDb = allCode.includes('@neondatabase/serverless') || allCode.includes('lib/db')

  if (input.neonConnectionString && needsDb) {
    // 有 DB 連線 → 硬編碼 connection string（WebContainer 不可靠讀 .env）
    setFileInTree(tree, 'lib/db.ts', [
      `import { neon } from '@neondatabase/serverless'`,
      ``,
      `const sql = neon('${input.neonConnectionString}')`,
      ``,
      `export { sql }`,
    ].join('\n'))
  } else if (needsDb) {
    // 沒有 DB 連線 → mock 防止 crash
    setFileInTree(tree, 'lib/db.ts', MOCK_DB)
  }

  // 自動為缺失的 @/ import 生成 stub，防止 webpack 編譯失敗
  generateMissingStubs(tree, allFiles)

  // If no layout was provided, use minimal layout with edit bridge
  const hasLayout = input.pages.some(p =>
    p.path === 'app/layout.tsx' || p.path === '/app/layout.tsx'
  )
  if (!hasLayout) {
    setFileInTree(tree, 'app/layout.tsx', MINIMAL_LAYOUT)
  }

  return tree
}

/**
 * Diff two sets of files, returning only the changed/new ones
 * Used for HMR updates during streaming
 */
export function diffFiles(
  oldFiles: GeneratedFile[],
  newFiles: GeneratedFile[],
): Record<string, string> {
  const oldMap = new Map(oldFiles.map(f => [f.path, f.content]))
  const changes: Record<string, string> = {}

  for (const file of newFiles) {
    const oldContent = oldMap.get(file.path)
    if (oldContent !== file.content) {
      const path = file.path.startsWith('/') ? file.path.slice(1) : file.path
      changes[path] = sanitizeFileContent(path, file.content)
    }
  }

  return changes
}

/**
 * Check if package.json needs updating (new dependencies detected)
 */
export function detectNewDeps(
  currentPkgJson: string,
  newFiles: GeneratedFile[],
): boolean {
  const newDeps = scanDependencies(newFiles)
  try {
    const current = JSON.parse(currentPkgJson)
    const currentDeps = current.dependencies || {}
    for (const pkg of Object.keys(newDeps)) {
      if (!currentDeps[pkg]) return true
    }
  } catch {
    return true
  }
  return false
}

/**
 * Check if the browser supports WebContainers
 */
export function isWebContainerSupported(): boolean {
  if (typeof window === 'undefined') return false
  // Chromium detection (Chrome, Edge, Opera, Brave, etc.)
  const ua = navigator.userAgent
  const isChromium = (ua.includes('Chrome') || ua.includes('Edg')) && !ua.includes('Firefox')
  const hasServiceWorker = 'serviceWorker' in navigator
  return isChromium && hasServiceWorker
}

/**
 * Write files from a FileSystemTree to a WebContainer without using mount().
 * Unlike mount(), this preserves existing files (e.g., node_modules from pre-install).
 * Used by the preload optimization to avoid destroying pre-installed dependencies.
 */
export async function writeFilesToContainer(
  container: {
    fs: {
      mkdir(path: string, opts?: { recursive?: boolean }): Promise<void>
      writeFile(path: string, data: string | Uint8Array): Promise<void>
    }
  },
  tree: FileSystemTree,
  prefix?: string,
): Promise<void> {
  const files: { path: string; contents: string | Uint8Array }[] = []
  const dirs = new Set<string>()

  function collect(node: FileSystemTree, base: string) {
    for (const [name, entry] of Object.entries(node)) {
      const fullPath = base ? `${base}/${name}` : name
      if ('directory' in entry) {
        dirs.add(fullPath)
        collect(entry.directory, fullPath)
      } else if ('file' in entry && 'contents' in entry.file) {
        const parts = fullPath.split('/')
        if (parts.length > 1) {
          dirs.add(parts.slice(0, -1).join('/'))
        }
        files.push({ path: fullPath, contents: entry.file.contents })
      }
    }
  }

  collect(tree, prefix || '')

  // Create all directories first (recursive handles nesting)
  await Promise.all(
    Array.from(dirs).map(dir => container.fs.mkdir(dir, { recursive: true }))
  )

  // Write files in parallel batches to avoid overwhelming the WASM filesystem
  const BATCH = 15
  for (let i = 0; i < files.length; i += BATCH) {
    await Promise.all(
      files.slice(i, i + BATCH).map(f =>
        container.fs.writeFile(f.path, f.contents)
      )
    )
  }
}
