/**
 * Extension build pipeline — esbuild
 *
 * Outputs:
 *   dist/background.js              (service worker, ESM)
 *   dist/content/bootstrap.js       (content script ISOLATED world, IIFE)
 *   dist/content/bridge-injector.js (content script MAIN world, IIFE, inlines EDIT_BRIDGE_SCRIPT)
 *   dist/content/tellcraft-detector.js (tellcraft.com content script, IIFE)
 *   dist/popup/popup.js             (popup react bundle, IIFE)
 *   dist/popup/popup.html           (copied)
 *   dist/manifest.json              (copied)
 *   dist/icons/*                    (copied)
 *
 * EDIT_BRIDGE_SCRIPT 來源：app/lib/edit-bridge-script.ts（單一 source of truth）
 *   build 時 fs.readFileSync 讀取 → 注入 bridge-injector.ts as raw string
 *   → Tellcraft frontend (WebContainerPreview) 跟 extension 不可能 drift
 */

import { build, context } from 'esbuild'
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, rmSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DIST = resolve(__dirname, 'dist')

const watch = process.argv.includes('--watch')

// 清理舊 dist
if (existsSync(DIST)) rmSync(DIST, { recursive: true, force: true })
mkdirSync(DIST, { recursive: true })
mkdirSync(resolve(DIST, 'content'), { recursive: true })
mkdirSync(resolve(DIST, 'popup'), { recursive: true })
mkdirSync(resolve(DIST, 'icons'), { recursive: true })

// 從 app/lib/edit-bridge-script.ts 抽出 EDIT_BRIDGE_SCRIPT 原始字串
// （而非 import，因為 extension 不依賴 Next.js 環境）
function loadEditBridgeScript() {
  const src = readFileSync(resolve(ROOT, 'app/lib/edit-bridge-script.ts'), 'utf-8')
  const match = src.match(/export const EDIT_BRIDGE_SCRIPT = `([\s\S]*?)`\s*$/m)
  if (!match) {
    throw new Error('無法從 app/lib/edit-bridge-script.ts 抽出 EDIT_BRIDGE_SCRIPT IIFE')
  }
  return match[1]
}

const EDIT_BRIDGE_SCRIPT_RAW = loadEditBridgeScript()

const sharedOptions = {
  bundle: true,
  minify: !watch,
  sourcemap: watch ? 'inline' : false,
  target: ['chrome120'],
  logLevel: 'info',
  define: {
    'process.env.NODE_ENV': watch ? '"development"' : '"production"',
    'process.env.TELLCRAFT_API_URL': JSON.stringify(
      process.env.TELLCRAFT_API_URL || 'https://tellcraft.com'
    ),
    // 把 EDIT_BRIDGE_SCRIPT 內嵌進 bridge-injector.js
    '__EDIT_BRIDGE_SCRIPT__': JSON.stringify(EDIT_BRIDGE_SCRIPT_RAW),
  },
}

const entries = [
  // Service worker (ESM)
  {
    entryPoints: [resolve(__dirname, 'src/background.ts')],
    outfile: resolve(DIST, 'background.js'),
    format: 'esm',
  },
  // Content script ISOLATED world（chrome.* APIs available）
  {
    entryPoints: [resolve(__dirname, 'src/content/bootstrap.ts')],
    outfile: resolve(DIST, 'content/bootstrap.js'),
    format: 'iife',
  },
  // Content script MAIN world（page DOM access，inject EDIT_BRIDGE_SCRIPT）
  {
    entryPoints: [resolve(__dirname, 'src/content/bridge-injector.ts')],
    outfile: resolve(DIST, 'content/bridge-injector.js'),
    format: 'iife',
  },
  // Content script on tellcraft.com（偵測 extension 安裝、回 tc_extension_pong）
  {
    entryPoints: [resolve(__dirname, 'src/content/tellcraft-detector.ts')],
    outfile: resolve(DIST, 'content/tellcraft-detector.js'),
    format: 'iife',
  },
  // Popup React bundle
  {
    entryPoints: [resolve(__dirname, 'src/popup/popup.tsx')],
    outfile: resolve(DIST, 'popup/popup.js'),
    format: 'iife',
  },
]

async function runBuild() {
  await Promise.all(
    entries.map(entry =>
      build({ ...sharedOptions, ...entry })
    )
  )
  // 複製靜態檔
  cpSync(resolve(__dirname, 'manifest.json'), resolve(DIST, 'manifest.json'))
  cpSync(resolve(__dirname, 'src/popup/popup.html'), resolve(DIST, 'popup/popup.html'))
  if (existsSync(resolve(__dirname, 'icons'))) {
    cpSync(resolve(__dirname, 'icons'), resolve(DIST, 'icons'), { recursive: true })
  } else {
    // 沒 icons 也 OK，build 不該 fail；放空檔讓 dev mode load 不抱怨
    console.warn('[build] icons/ 目錄不存在，跳過（chrome.runtime 會用 default icon）')
  }
  console.log('✓ extension/dist/ 已建置完成')
}

async function runWatch() {
  const contexts = await Promise.all(
    entries.map(entry =>
      context({ ...sharedOptions, ...entry })
    )
  )
  await Promise.all(contexts.map(ctx => ctx.watch()))
  // 靜態檔 watch 由 dev 端手動 rebuild（chrome reload extension 即可）
  console.log('✓ esbuild watch mode started')
}

if (watch) {
  await runWatch()
} else {
  await runBuild()
}
