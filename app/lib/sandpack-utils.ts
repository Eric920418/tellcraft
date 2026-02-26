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
// 套件名 → 版本（只用真正的 npm 套件名，不含子路徑）
// 版本號與 deployer.ts KNOWN_PACKAGES 對齊，避免預覽/部署行為差異
const SANDPACK_KNOWN_DEPS: Record<string, string> = {
  'motion': '^11.0.0',
  'lucide-react': '^0.400.0',
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
}

// 不需要安裝的套件（React 內建 / Sandpack 自帶 / shim 處理）
const BUILTIN_PACKAGES = new Set([
  'react', 'react-dom', 'react/jsx-runtime',
  'next', 'next/font', 'next/font/google', 'next/image', 'next/link',
  'next/navigation', 'next/router', 'next/head', 'next/script',
  'next-themes', // shim 處理，不需要安裝
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
// 編輯橋接腳本（Sandpack 版）
// ============================================================
// 從 PreviewPanel 的 EDIT_BRIDGE_SCRIPT 改寫為 JS 模組格式
// 關鍵差異：
//   1. 純 JS（無 <script> 包裹）—— 作為 Sandpack 檔案注入
//   2. 防重複初始化（window.__tcEditBridgeInitialized）
//   3. 用 MutationObserver + setTimeout(300ms) 延遲 tag（等 React 渲染完成）
//   4. observer 只監聽 childList（避免 attribute 變化觸發死循環）
const SANDPACK_EDIT_BRIDGE = `
if (typeof window !== 'undefined' && !window.__tcEditBridgeInitialized) {
  window.__tcEditBridgeInitialized = true;

  var editMode = false;
  var selectedId = null;

  // 自動標記可編輯元素（文字類）
  function tagEditableElements() {
    var selectors = 'h1, h2, h3, h4, h5, h6, p, button, a, span, li, label, figcaption, blockquote, dt, dd';
    var elements = document.querySelectorAll(selectors);
    var counts = {};

    elements.forEach(function(el) {
      var text = (el.textContent || '').trim();
      if (!text || el.closest('script, style, noscript, svg')) return;
      if (el.getAttribute('data-editable')) return;
      if (el.tagName === 'A' || el.tagName === 'BUTTON' || el.tagName === 'LI') {
        // 保留，即使有子元素
      } else if (el.children.length > 0) {
        var hasEditableChild = el.querySelector('h1,h2,h3,h4,h5,h6,p,button,a,span');
        if (hasEditableChild && el.tagName !== 'P') return;
      }

      var tag = el.tagName.toLowerCase();
      counts[tag] = (counts[tag] || 0);
      el.setAttribute('data-editable', tag + '-' + counts[tag]);
      el.setAttribute('data-editable-type', 'text');
      el.setAttribute('data-original-text', el.textContent || '');
      counts[tag]++;
    });
  }

  // 標記容器元素
  function tagContainerElements() {
    var selectors = 'section, header, footer, nav, main, article, aside, div.hero, div.card, div.container';
    var elements = document.querySelectorAll(selectors);
    var counts = {};

    elements.forEach(function(el) {
      if (el.closest('script, style, noscript, svg')) return;
      if (el.getAttribute('data-editable')) return;
      if (!el.textContent || !el.textContent.trim()) return;

      var tag = el.tagName.toLowerCase();
      var key = 'container-' + tag;
      counts[key] = (counts[key] || 0);
      el.setAttribute('data-editable', key + '-' + counts[key]);
      el.setAttribute('data-editable-type', 'container');
      counts[key]++;
    });
  }

  // 標記圖片元素
  function tagImageElements() {
    var images = document.querySelectorAll('img');
    var count = 0;

    images.forEach(function(el) {
      if (el.closest('script, style, noscript, svg')) return;
      if (el.getAttribute('data-editable')) return;

      el.setAttribute('data-editable', 'img-' + count);
      el.setAttribute('data-editable-type', 'image');
      el.setAttribute('data-original-src', el.src || '');
      el.setAttribute('data-original-alt', el.alt || '');
      count++;
    });
  }

  // 計算元素路徑 breadcrumb
  function getElementPath(el) {
    var parts = [];
    var current = el;
    while (current && current !== document.body && parts.length < 5) {
      var tag = current.tagName.toLowerCase();
      if (current.id) {
        parts.unshift(tag + '#' + current.id);
        break;
      } else if (current.className && typeof current.className === 'string') {
        var cls = current.className.split(' ').filter(function(c) { return c && !c.startsWith('data-') && c.length < 20; }).slice(0, 2).join('.');
        parts.unshift(cls ? tag + '.' + cls : tag);
      } else {
        parts.unshift(tag);
      }
      current = current.parentElement;
    }
    return parts.join(' > ');
  }

  // 提取計算樣式
  function extractStyles(el) {
    var cs = window.getComputedStyle(el);
    var type = el.getAttribute('data-editable-type') || 'text';
    var base = {
      color: cs.color,
      backgroundColor: cs.backgroundColor,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      padding: cs.padding,
      margin: cs.margin,
      borderRadius: cs.borderRadius
    };

    if (type === 'text') {
      base.textAlign = cs.textAlign;
      base.lineHeight = cs.lineHeight;
      base.letterSpacing = cs.letterSpacing;
    }

    if (type === 'container') {
      base.textAlign = cs.textAlign;
      base.lineHeight = cs.lineHeight;
      base.borderWidth = cs.borderWidth;
      base.borderColor = cs.borderColor;
      base.borderStyle = cs.borderStyle;
      base.boxShadow = cs.boxShadow;
      base.opacity = cs.opacity;
    }

    if (type === 'image') {
      base.objectFit = cs.objectFit;
      base.imgSrc = el.src || '';
      base.imgAlt = el.alt || '';
    }

    return base;
  }

  // 注入編輯模式高亮樣式
  var styleEl = document.createElement('style');
  styleEl.id = 'edit-bridge-styles';
  styleEl.textContent = '';
  document.head.appendChild(styleEl);

  function updateEditStyles() {
    if (!editMode) {
      styleEl.textContent = '';
      return;
    }
    styleEl.textContent =
      '[data-editable] {' +
        'cursor: pointer !important;' +
        'outline: 2px dashed transparent;' +
        'outline-offset: 2px;' +
        'transition: outline-color 0.15s ease;' +
      '}' +
      '[data-editable]:hover {' +
        'outline-color: #94a3b8 !important;' +
      '}' +
      '[data-editable-type="container"]:hover {' +
        'outline-color: #f59e0b !important;' +
      '}' +
      '[data-editable-type="image"]:hover {' +
        'outline-color: #10b981 !important;' +
      '}' +
      (selectedId
        ? '[data-editable="' + selectedId + '"] { outline: 2px solid #3b82f6 !important; outline-offset: 2px; }'
        : '');
  }

  // 點擊處理
  document.addEventListener('click', function(e) {
    if (!editMode) return;

    var target = e.target.closest('[data-editable]');
    if (!target) {
      selectedId = null;
      updateEditStyles();
      window.parent.postMessage({ type: 'tc_elementDeselected' }, '*');
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    var id = target.getAttribute('data-editable');
    selectedId = id;
    updateEditStyles();

    var rect = target.getBoundingClientRect();
    var editableType = target.getAttribute('data-editable-type') || 'text';
    window.parent.postMessage({
      type: 'tc_elementSelected',
      data: {
        id: id,
        tagName: target.tagName,
        text: editableType !== 'image' ? (target.textContent || '') : undefined,
        styles: extractStyles(target),
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        editableType: editableType,
        path: getElementPath(target)
      }
    }, '*');
  }, true);

  // 接收父視窗指令
  window.addEventListener('message', function(e) {
    var msg = e.data;
    if (!msg || !msg.type) return;

    if (msg.type === 'tc_setEditMode') {
      editMode = msg.enabled;
      if (!editMode) selectedId = null;
      updateEditStyles();
    }

    if (msg.type === 'tc_applyUpdate') {
      var el = document.querySelector('[data-editable="' + msg.elementId + '"]');
      if (!el) return;
      var changes = msg.changes;
      if (changes.text !== undefined) {
        el.textContent = changes.text;
      }
      if (changes.imgSrc !== undefined && el.tagName === 'IMG') {
        el.src = changes.imgSrc;
      }
      if (changes.imgAlt !== undefined && el.tagName === 'IMG') {
        el.alt = changes.imgAlt;
      }
      Object.keys(changes).forEach(function(key) {
        if (key !== 'text' && key !== 'imgSrc' && key !== 'imgAlt') {
          el.style[key] = changes[key];
        }
      });
    }

    if (msg.type === 'tc_applyOverrides') {
      var overrides = msg.overrides;
      Object.keys(overrides).forEach(function(elementId) {
        var el = document.querySelector('[data-editable="' + elementId + '"]');
        if (!el) return;
        var changes = overrides[elementId];
        if (changes.text !== undefined) {
          el.textContent = changes.text;
        }
        if (changes.imgSrc !== undefined && el.tagName === 'IMG') {
          el.src = changes.imgSrc;
        }
        if (changes.imgAlt !== undefined && el.tagName === 'IMG') {
          el.alt = changes.imgAlt;
        }
        Object.keys(changes).forEach(function(key) {
          if (key !== 'text' && key !== 'imgSrc' && key !== 'imgAlt') {
            el.style[key] = changes[key];
          }
        });
      });
    }

    if (msg.type === 'tc_resetElement') {
      var el = document.querySelector('[data-editable="' + msg.elementId + '"]');
      if (!el) return;
      var origText = el.getAttribute('data-original-text');
      if (origText !== null) {
        el.textContent = origText;
      }
      if (el.tagName === 'IMG') {
        var origSrc = el.getAttribute('data-original-src');
        var origAlt = el.getAttribute('data-original-alt');
        if (origSrc !== null) el.src = origSrc;
        if (origAlt !== null) el.alt = origAlt;
      }
      el.removeAttribute('style');
    }

    if (msg.type === 'tc_deselectElement') {
      selectedId = null;
      updateEditStyles();
    }
  });

  // MutationObserver：React 渲染完成後自動標記元素
  // 只監聽 childList（不監聽 attributes，避免 tag 設定 data-editable 觸發死循環）
  function tagAllElements() {
    tagEditableElements();
    tagContainerElements();
    tagImageElements();
  }

  var tagTimeout = null;
  var observer = new MutationObserver(function() {
    if (tagTimeout) clearTimeout(tagTimeout);
    tagTimeout = setTimeout(function() {
      tagAllElements();
    }, 300);
  });

  // 初始標記 + 啟動 observer
  function init() {
    tagAllElements();
    observer.observe(document.body, { childList: true, subtree: true });
    window.parent.postMessage({ type: 'tc_iframeReady' }, '*');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100);
  }
}
`

// IntersectionObserver polyfill：讓 motion/react 的 whileInView 在 Sandpack iframe 中立即觸發
// 部署端（真實瀏覽器）IntersectionObserver 正常運作，但 Sandpack iframe 的 viewport
// 不會正確觸發 intersection，導致所有 whileInView 元素停在 initial 狀態（opacity:0）
const INTERSECTION_OBSERVER_POLYFILL = `
;(function() {
  if (typeof window === 'undefined') return;
  window.IntersectionObserver = class IntersectionObserverShim {
    constructor(cb) { this._cb = cb; this._els = []; }
    observe(el) {
      this._els.push(el);
      var self = this;
      requestAnimationFrame(function() {
        self._cb([{
          target: el,
          isIntersecting: true,
          intersectionRatio: 1,
          boundingClientRect: el.getBoundingClientRect(),
          intersectionRect: el.getBoundingClientRect(),
          rootBounds: null,
          time: performance.now()
        }], self);
      });
    }
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
    get root() { return null; }
    get rootMargin() { return '0px'; }
    get thresholds() { return [0]; }
  };
})();
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

  // 計算當前檔案到根目錄的相對路徑前綴（所有路徑重寫都需要）
  // 例：components/layout/Header.tsx → depth=2 → prefix='../../'
  //     App.tsx → depth=0 → prefix='./'
  const depth = filePath.split('/').length - 1
  const prefix = depth > 0 ? '../'.repeat(depth) : './'

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
    const escaped = member.replace(/\./g, '\\.')
    result = result.replace(new RegExp(escaped, 'g'), replacement)
  }

  // next/image → shim（路徑根據檔案深度計算）
  result = result.replace(
    /import\s+(\w+)\s+from\s+['"]next\/image['"]/g,
    `import $1 from '${prefix}shims/NextImage'`
  )

  // next/link → shim
  result = result.replace(
    /import\s+(\w+)\s+from\s+['"]next\/link['"]/g,
    `import $1 from '${prefix}shims/NextLink'`
  )

  // next/navigation → shim
  result = result.replace(
    /import\s*\{([^}]*)\}\s*from\s*['"]next\/navigation['"]/g,
    `import {$1} from '${prefix}shims/NextNavigation'`
  )

  // next-themes → shim
  result = result.replace(
    /import\s*\{([^}]*)\}\s*from\s*['"]next-themes['"]/g,
    `import {$1} from '${prefix}shims/NextThemes'`
  )

  // framer-motion → motion/react（安全網）
  result = result.replace(
    /from\s+['"]framer-motion['"]/g,
    "from 'motion/react'"
  )

  // 移除 JSX 中殘留的 Google Fonts <link>（Sandpack 由 index.html CDN 注入字體）
  result = result.replace(/<link[^>]*fonts\.googleapis\.com[^>]*\/?>/g, '')

  // globals.css → 移除（entry /index.tsx 已經 import './styles.css'）
  result = result.replace(
    /import\s+['"]\.\/globals\.css['"]\s*;?\s*\n?/g,
    ''
  )

  // 移除所有剩餘的 bare 'next' import（type import 等）
  result = result.replace(/import\s+(?:type\s+)?\{[^}]*\}\s*from\s*['"]next['"]\s*;?\s*\n?/g, '')
  result = result.replace(/import\s+(?:type\s+)?\w+\s+from\s*['"]next['"]\s*;?\s*\n?/g, '')

  // @/ alias → 相對路徑
  result = result.replace(
    /from\s+['"]@\/([^'"]+)['"]/g,
    (_, p) => `from '${prefix}${p}'`
  )

  // 移除所有未被 shim 處理的 next/* import（next/head, next/script, next/dynamic 等）
  result = result.replace(/import\s+(?:type\s+)?.*\s+from\s+['"]next\/(?!image|link|navigation|font)[^'"]*['"]\s*;?\s*\n?/g, '')

  return result
}

/**
 * 清理 Layout 中的 <html>/<head>/<body> 標籤
 * Next.js root layout 包含這些標籤，但 Sandpack 在 <div id="root"> 中渲染，
 * <html> 嵌套在 <div> 裡是非法 HTML
 */
function stripLayoutDocumentTags(content: string): string {
  let result = content
  // <html lang="..."> → <div>，</html> → </div>
  result = result.replace(/<html[^>]*>/g, '<div>')
  result = result.replace(/<\/html>/g, '</div>')
  // 移除 <head>...</head>，但保留其中的 <style> 標籤內容
  // LLM 可能在 <head> 裡寫 CSS 變數、動畫 keyframes 等
  let extractedStyles = ''
  result = result.replace(/<head[\s\S]*?<\/head>/g, (headBlock) => {
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/g
    let sm
    while ((sm = styleRegex.exec(headBlock)) !== null) {
      extractedStyles += sm[1] + '\n'
    }
    return ''
  })
  // 將提取的 style 內容以 <style> 標籤注入到 body 開頭（Sandpack 支援內嵌 style）
  if (extractedStyles.trim()) {
    result = result.replace(
      /(<div[^>]*>)/, // 第一個 <div>（原 <body>）
      `$1\n<style>{\`${extractedStyles.trim()}\`}</style>`
    )
  }
  // <body className="..."> → <div className="...">，</body> → </div>
  result = result.replace(/<body([^>]*)>/g, '<div$1>')
  result = result.replace(/<\/body>/g, '</div>')
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
      // 提取套件名：@scope/name 或 name（去掉子路徑）
      // 例：'motion/react' → 'motion'，'@radix-ui/react-dialog' → '@radix-ui/react-dialog'
      const pkg = raw.startsWith('@')
        ? raw.split('/').slice(0, 2).join('/')
        : raw.split('/')[0]

      if (BUILTIN_PACKAGES.has(pkg) || BUILTIN_PACKAGES.has(raw)) continue
      if (pkg.startsWith('./') || pkg.startsWith('../')) continue

      // 始終用套件名（pkg）作為 key，而不是完整 import path（raw）
      // 這樣 'motion/react' 正確映射到 'motion' 套件
      // 已知套件用固定版本，未知套件 fallback 到 'latest'（與部署端 sanitizeCodeForDeploy 一致）
      deps[pkg] = SANDPACK_KNOWN_DEPS[pkg] || 'latest'
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

  const jsObj = extendBody
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
 * 清理 Tailwind v4 語法（與部署端 deployer.ts cleanTailwindV4Syntax 對齊）
 * - @theme { nested {} } → :root { nested {} }（支援巢狀大括號）
 * - @import "tailwindcss" → 移除
 * - @tailwind base/components/utilities → 移除
 * - @utility / @variant / @custom-variant → 移除
 * - @apply font-custom → font-family: var(--font-custom, inherit)
 */
function cleanTailwindV4Syntax(styles: string): string {
  let result = styles
  // @import "tailwindcss" 及子路徑
  result = result.replace(/@import\s*["']tailwindcss(?:\/[^"']*)?["']\s*;?\s*/g, '')
  // @tailwind base/components/utilities
  result = result.replace(/@tailwind\s+\w+\s*;?\s*/g, '')
  // @theme {} → :root {}（支援巢狀大括號，與部署端正則一致）
  result = result.replace(/@theme\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g, (_m, inner: string) => {
    const trimmed = inner.trim()
    return trimmed.length > 0 ? `:root {\n${trimmed}\n}` : ''
  })
  // @utility/@variant/@custom-variant 移除（支援巢狀大括號）
  result = result.replace(/@(?:utility|variant|custom-variant)\s+[\w-]+\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/g, '')
  // @apply font-{name}：非標準 Tailwind font utility 轉為直接 CSS
  const standardFonts = new Set(['sans', 'serif', 'mono'])
  result = result.replace(/@apply\s+font-([\w-]+)\s*;/g, (match, fontName: string) => {
    if (standardFonts.has(fontName)) return match
    return `font-family: var(--font-${fontName}, inherit);`
  })
  return result
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

// ============================================================
// 缺失模塊 Stub 生成（串流預覽安全網）
// ============================================================

/**
 * 解析相對路徑（從 fromDir 出發解析 importPath）
 * 例：fromDir='/components', importPath='../components/Header' → '/components/Header'
 */
function resolveRelativePath(fromDir: string, importPath: string): string {
  const parts = fromDir.split('/').filter(Boolean)
  for (const segment of importPath.split('/')) {
    if (segment === '.') continue
    if (segment === '..') { parts.pop() }
    else { parts.push(segment) }
  }
  return '/' + parts.join('/')
}

/**
 * 掃描所有檔案的相對 import，為缺失的內部模塊生成 stub 佔位組件
 * 解決串流預覽時，部分檔案尚未生成導致 Sandpack 報 "Could not find module" 的問題
 *
 * 原理：A.tsx import B.tsx，但 B.tsx 還在 LLM 生成中 → 注入空 stub → Sandpack 不報錯
 * 當 B.tsx 真正生成後，streaming 增量更新會用真實內容覆蓋 stub
 */
function generateMissingModuleStubs(files: Record<string, string>): void {
  const existingPaths = new Set(Object.keys(files))

  // 收集缺失模塊：resolved path → 需要的 export 名稱
  const missingModules = new Map<string, Set<string>>()

  // 匹配 import 語句（已經過 rewriteImports，@/ 已轉為相對路徑）
  const importRegex = /import\s+([\w{},\s*]+)\s+from\s+['"](\.[^'"]+)['"]/g
  const reExportRegex = /export\s+\{([^}]*)\}\s+from\s+['"](\.[^'"]+)['"]/g

  const SKIP_PATHS = new Set(['/shims/', '/polyfills.js', '/public/', '/styles.css'])

  for (const [filePath, content] of Object.entries(files)) {
    // 跳過 shim、polyfill、HTML、CSS 等非源碼檔案
    if (SKIP_PATHS.has(filePath) || Array.from(SKIP_PATHS).some(p => filePath.startsWith(p))) continue
    if (typeof content !== 'string') continue

    const fileDir = filePath.substring(0, filePath.lastIndexOf('/')) || '/'

    for (const regex of [importRegex, reExportRegex]) {
      regex.lastIndex = 0
      let match
      while ((match = regex.exec(content)) !== null) {
        const importClause = match[1]
        const importPath = match[2]

        // 跳過 CSS import
        if (importPath.endsWith('.css')) continue

        const resolved = resolveRelativePath(fileDir, importPath)

        // 檢查是否已存在（嘗試多種副檔名）
        const extensions = ['.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts']
        const hasExtension = /\.\w+$/.test(resolved)

        let found = false
        if (hasExtension) {
          found = existingPaths.has(resolved)
        } else {
          found = extensions.some(ext => existingPaths.has(resolved + ext))
        }

        if (!found) {
          const stubPath = hasExtension ? resolved : resolved + '.tsx'
          if (!missingModules.has(stubPath)) {
            missingModules.set(stubPath, new Set())
          }

          const names = missingModules.get(stubPath)!

          // 解析 default import（排除 `import type X`）
          const defaultMatch = importClause.match(/^(\w+)/)
          if (defaultMatch && defaultMatch[1] !== 'type' && !importClause.trimStart().startsWith('{')) {
            names.add('__default__')
          }

          // 解析 named imports（排除 `type Xxx`）
          const namedMatch = importClause.match(/\{([^}]*)\}/)
          if (namedMatch) {
            namedMatch[1].split(',')
              .map(s => s.trim())
              .filter(s => s && !s.startsWith('type '))
              .map(s => s.split(/\s+as\s+/)[0].trim())
              .filter(Boolean)
              .forEach(n => names.add(n))
          }
        }
      }
    }
  }

  // 生成 stub 檔案
  for (const [stubPath, names] of missingModules) {
    if (existingPaths.has(stubPath)) continue

    const fileName = stubPath.split('/').pop()?.replace(/\.\w+$/, '') || 'Stub'
    const hasDefault = names.has('__default__')
    names.delete('__default__')

    const lines: string[] = [
      `// [Sandpack Stub] 此檔案為串流預覽自動生成的佔位模塊`,
      `// 真實內容生成後會自動覆蓋`,
    ]

    // Named exports
    for (const name of names) {
      if (/^[A-Z]/.test(name)) {
        // PascalCase → React component stub
        lines.push(`export function ${name}() { return null; }`)
      } else {
        // camelCase / data → 空陣列（安全用於 .map / .filter / .length）
        lines.push(`export const ${name} = [];`)
      }
    }

    // Default export
    if (hasDefault) {
      if (/^[A-Z]/.test(fileName)) {
        lines.push(`export default function ${fileName}() { return null; }`)
      } else {
        lines.push(`export default {};`)
      }
    }

    // 如果沒有任何 export 被偵測到，至少提供 default export
    if (!hasDefault && names.size === 0) {
      lines.push(`export default function ${fileName}() { return null; }`)
    }

    files[stubPath] = lines.join('\n') + '\n'
    existingPaths.add(stubPath)
  }
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
    let rewritten = rewriteImports(comp.content, sandpackPath.slice(1))
    // Layout 檔案：移除 <html>/<head>/<body>（Sandpack 在 <div> 中渲染）
    if (sandpackPath === '/Layout.tsx') {
      rewritten = stripLayoutDocumentTags(rewritten)
    }
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

  // 4. 清理 CSS（使用與部署端對齊的 cleanTailwindV4Syntax）
  let cleanStyles = cleanTailwindV4Syntax(styles)

  // 5. CSS 變數 fallback 安全網（與部署端 deployer.ts L750-760 對齊）
  if (tailwindConfig) {
    if (tailwindConfig.includes('var(--radius-') && !cleanStyles.includes('--radius-')) {
      cleanStyles += `\n/* Fallback radius variables */\n:root {\n  --radius-none: 0;\n  --radius-sm: 0.125rem;\n  --radius-md: 0.375rem;\n  --radius-lg: 0.5rem;\n  --radius-full: 9999px;\n}\n`
    }
    if (tailwindConfig.includes('var(--color-') && !cleanStyles.includes('--color-primary')) {
      cleanStyles += `\n/* Fallback color variables */\n:root {\n  --color-primary: #2563eb;\n  --color-secondary: #4f46e5;\n  --color-accent: #06b6d4;\n  --color-background: #ffffff;\n  --color-foreground: #0f172a;\n  --color-muted: #f1f5f9;\n  --color-border: #e2e8f0;\n}\n`
    }
  }

  files['/styles.css'] = cleanStyles

  // 6. Shim 檔案
  files['/shims/NextImage.jsx'] = NEXT_IMAGE_SHIM
  files['/shims/NextLink.jsx'] = NEXT_LINK_SHIM
  files['/shims/NextNavigation.js'] = NEXT_NAVIGATION_SHIM
  files['/shims/NextThemes.jsx'] = NEXT_THEMES_SHIM
  files['/polyfills.js'] = INTERSECTION_OBSERVER_POLYFILL

  // 7. lib/fonts.ts shim 自動生成（與部署端 FONT_LOOKUP 對齊）
  // 如果代碼引用了 @/lib/fonts 但沒有生成 lib/fonts.ts，自動產生空 shim
  const hasFontsFile = '/lib/fonts.ts' in files || '/lib/fonts.tsx' in files
  if (!hasFontsFile) {
    const fontsImportRegex = /from\s+['"](?:@\/lib\/fonts|\.\.?\/(?:\.\.\/)*lib\/fonts)['"]/
    const allFileContents = Object.values(files).filter((v): v is string => typeof v === 'string')
    const needsFontShim = allFileContents.some(c => fontsImportRegex.test(c))
    if (needsFontShim) {
      // 掃描所有 import { xxx, yyy } from '@/lib/fonts' 提取變數名
      const fontVarNames = new Set<string>()
      const namedImportRegex = /import\s*\{([^}]*)\}\s*from\s*['"](?:@\/lib\/fonts|\.\.?\/(?:\.\.\/)*lib\/fonts)['"]/g
      for (const content of allFileContents) {
        let fm
        namedImportRegex.lastIndex = 0
        while ((fm = namedImportRegex.exec(content)) !== null) {
          fm[1].split(',').map(s => s.trim()).filter(Boolean).forEach(n => fontVarNames.add(n))
        }
      }
      // 生成 shim：每個變數 export { className: '', variable: '' }
      // 字體本身透過 Google Fonts CDN <link> 在 index.html 注入
      const shimLines = Array.from(fontVarNames).map(
        name => `export const ${name} = { className: '', variable: '', style: { fontFamily: '' } }`
      )
      files['/lib/fonts.ts'] = shimLines.length > 0
        ? shimLines.join('\n') + '\n'
        : "export const inter = { className: '', variable: '', style: { fontFamily: '' } }\n"
    }
  }

  // 8. 缺失內部模塊 stub 生成（串流預覽安全網）
  // 解決 LLM 生成時 A 檔案已完成但 B 檔案尚未生成，A import B 導致 Sandpack 報錯
  generateMissingModuleStubs(files)

  // 9. Tailwind CDN 配置
  const tailwindCdnScript = tailwindConfig ? extractTailwindCdnConfig(tailwindConfig) : ''

  // 10. 構建 Layout 包裹邏輯
  const hasLayout = '/Layout.tsx' in files
  const hasApp = '/App.tsx' in files

  // 11. Entry file: /index.tsx
  // 關鍵：Tailwind CDN config 必須在 JS 中設定，不能依賴 HTML script 標籤
  // 因為 Sandpack react-ts template 不一定執行自訂 HTML 中的 script
  const entryImports = []
  const entryBody = []
  // polyfill 必須在 React/motion 之前載入，確保 IntersectionObserver 被覆蓋
  entryImports.push("import './polyfills'")
  entryImports.push("import React from 'react'")
  entryImports.push("import { createRoot } from 'react-dom/client'")
  entryImports.push("import './styles.css'")

  // 注入 Tailwind CDN config 到 JS（在 React render 之前執行）
  if (tailwindCdnScript) {
    entryBody.push(`// Tailwind CDN config（從 tailwind.config.ts 提取）`)
    entryBody.push(`if (typeof window !== 'undefined' && (window as any).tailwind) { ${tailwindCdnScript} }`)
  }

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

  // 12. index.html（Tailwind CDN 由 SandpackProvider externalResources 載入，config 在 index.tsx JS 中設定）
  // 注意：Sandpack 不執行自訂 HTML 中的 <script> 標籤，所有外部腳本必須透過 externalResources
  files['/public/index.html'] = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${fontLinksHtml}
  <style>
    body { font-family: '${primaryFont}', system-ui, sans-serif; margin: 0; }
  </style>
</head>
<body>
  <div id="root"></div>
</body>
</html>`

  // 13. 掃描依賴（只加代碼實際 import 的套件）
  // react / react-dom 由 template="react-ts" 提供，不需要重複指定
  const dependencies = scanDependencies(files)

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
