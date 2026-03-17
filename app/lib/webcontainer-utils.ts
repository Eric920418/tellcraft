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
}

// ── Known Package Versions ──
// Synced with deployer.ts KNOWN_PACKAGES + BASE_DEPS

// Next.js 16 統一版本（WebContainer 用 --webpack flag 繞過 Turbopack WASM 限制）
const BASE_DEPS: Record<string, string> = {
  next: '^16.0.0',
  react: '^19.0.0',
  'react-dom': '^19.0.0',
  motion: '^11.0.0',
  tailwindcss: '^4.0.0',
  '@tailwindcss/postcss': '^4.0.0',
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
 * Ensure globals.css has @import "tailwindcss" at the top.
 * Tailwind v4 native — no conversion needed.
 */
export function prepareCss(rawStyles: string | undefined, _hasTailwindConfig: boolean): string {
  let css = rawStyles || MINIMAL_CSS

  // If CSS already has @import "tailwindcss", return as-is
  if (css.includes('@import') && css.includes('tailwindcss')) {
    return css
  }

  // Strip legacy v3 directives if present (from old projects)
  css = css.replace(/@tailwind\s+(base|components|utilities)\s*;?\s*/g, '')

  // Prepend v4 import
  return '@import "tailwindcss";\n\n' + css
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
      dev: 'next dev --webpack --port 3000',
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

const NEXT_CONFIG = `import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
}

export default nextConfig
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
    '@tailwindcss/postcss': {},
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

const MINIMAL_CSS = `@import "tailwindcss";
`

// ── Main Export Functions ──

/**
 * Build a minimal Next.js skeleton for initial mount (before code arrives)
 */
export function buildSkeletonFiles(): FileSystemTree {
  const tree: FileSystemTree = {}

  setFileInTree(tree, 'package.json', buildPackageJson([]))
  setFileInTree(tree, 'next.config.ts', NEXT_CONFIG)
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
  setFileInTree(tree, 'next.config.ts', NEXT_CONFIG)
  setFileInTree(tree, 'tsconfig.json', TS_CONFIG)
  setFileInTree(tree, 'postcss.config.js', POSTCSS_CONFIG)

  // Edit bridge
  setFileInTree(tree, 'public/edit-bridge.js', EDIT_BRIDGE_SCRIPT)

  // Tailwind config (v4: referenced via @config in CSS)
  if (input.tailwindConfig) {
    setFileInTree(tree, 'tailwind.config.ts', input.tailwindConfig)
  }

  // Global styles
  setFileInTree(tree, 'app/globals.css', prepareCss(input.styles, !!input.tailwindConfig))

  // Pages
  for (const page of input.pages) {
    const path = page.path.startsWith('/') ? page.path.slice(1) : page.path
    let content = page.content

    // Inject edit bridge into layout.tsx
    if (path === 'app/layout.tsx' || path.endsWith('/layout.tsx')) {
      content = injectEditBridge(content)
    }

    setFileInTree(tree, path, content)
  }

  // Components
  for (const comp of input.components) {
    const path = comp.path.startsWith('/') ? comp.path.slice(1) : comp.path
    setFileInTree(tree, path, comp.content)
  }

  // Server Actions (from Coder Skill)
  if (input.serverActions) {
    for (const sa of input.serverActions) {
      const path = sa.path.startsWith('/') ? sa.path.slice(1) : sa.path
      setFileInTree(tree, path, sa.content)
    }
  }

  // API Routes (from Coder Skill)
  if (input.apiRoutes) {
    for (const ar of input.apiRoutes) {
      const path = ar.path.startsWith('/') ? ar.path.slice(1) : ar.path
      setFileInTree(tree, path, ar.content)
    }
  }

  // DB Lib (from Coder Skill)
  if (input.dbLib) {
    for (const db of input.dbLib) {
      const path = db.path.startsWith('/') ? db.path.slice(1) : db.path
      setFileInTree(tree, path, db.content)
    }
  }

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
      changes[path] = file.content
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
