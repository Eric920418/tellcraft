/**
 * package-for-store.mjs — Chrome Web Store 上架打包 script
 *
 * 用法：
 *   pnpm build && node package-for-store.mjs
 *
 * 產出：
 *   tellcraft-extension-v<version>.zip — 上傳到 Chrome Web Store Developer Dashboard
 *
 * 上架前必跑 checklist：
 *   1. icons/ 必須有 16/32/48/128 4 個 PNG（commit 8 補真實設計）
 *   2. manifest.json action.default_icon + icons 區塊要重啟用（commit 2 暫拿掉）
 *   3. README + privacy policy URL 必填（Chrome Web Store 要求）
 *   4. version bump (manifest.json + package.json 對齊)
 */
import { execFileSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = resolve(__dirname, 'dist')

if (!existsSync(DIST)) {
  console.error('❌ dist/ 不存在，先跑 pnpm build')
  process.exit(1)
}

const manifest = JSON.parse(readFileSync(resolve(DIST, 'manifest.json'), 'utf-8'))
const version = manifest.version
const zipName = `tellcraft-extension-v${version}.zip`
const zipPath = resolve(__dirname, zipName)

// 用 execFileSync 避免 shell injection（path 是常數但守原則）
try {
  execFileSync('zip', ['-r', zipPath, '.', '-x', '*.map'], { cwd: DIST, stdio: 'inherit' })
  const sizeOut = execFileSync('du', ['-h', zipPath]).toString().split(/\s+/)[0]
  console.log(`✓ Packaged: ${zipName} (${sizeOut})`)
  console.log(`✓ Upload to: https://chrome.google.com/webstore/devconsole`)
} catch (err) {
  console.error('❌ zip failed:', err.message)
  process.exit(1)
}
