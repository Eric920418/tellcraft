/**
 * content/bridge-injector.ts — MAIN world content script
 *
 * R11 commit 4 完整接通：
 *   等 bootstrap.ts (ISOLATED world) postMessage tc_extension_ready
 *   → inject EDIT_BRIDGE_SCRIPT IIFE 進 page document
 *   → 啟動既有 10+ tc_* postMessage 雙向協議
 *
 * EDIT_BRIDGE_SCRIPT 內嵌字串由 build.mjs 從 app/lib/edit-bridge-script.ts 抽出
 * （commit 1 抽出的單一 source of truth）
 *
 * 此 script 跑在 document_start MAIN world：
 *   - 早於 page 任何 JS（包括 vercel.live toolbar）
 *   - 跟 page 共享 window/document（chrome.* APIs 不可用）
 */

declare const __EDIT_BRIDGE_SCRIPT__: string

let injected = false

function inject() {
  if (injected) return
  injected = true
  const s = document.createElement('script')
  s.textContent = __EDIT_BRIDGE_SCRIPT__
  // 用 documentElement 而非 head — document_start 時 head 可能不存在
  ;(document.head || document.documentElement).appendChild(s)
  s.remove()  // script tag 跑完即可移除，IIFE 已 register listeners
  console.log('[Tellcraft Bridge-Injector] ✓ EDIT_BRIDGE_SCRIPT injected, length:', __EDIT_BRIDGE_SCRIPT__.length)
}

// 等 bootstrap.ts 確認三層驗證通過才 inject
window.addEventListener('message', (event: MessageEvent) => {
  if (event.source !== window) return
  if (!event.data || typeof event.data !== 'object') return
  if (event.data.type === 'tc_extension_ready') {
    inject()
  }
})

console.log('[Tellcraft Bridge-Injector] MAIN world script loaded, waiting for tc_extension_ready')
