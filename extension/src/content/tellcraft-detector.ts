/**
 * content/tellcraft-detector.ts — 跑在 tellcraft.com 上的 content script
 *
 * R11 commit 4 完整接通：
 *   1. 讀 localStorage.auth_token → SYNC_USER_TOKEN to background
 *   2. 監聽 localStorage 變化（登入/登出）→ re-sync
 *   3. 回 tc_extension_pong 給 tellcraft.com 主視窗（commit 7「開啟編輯器」按鈕用）
 */

import type { ExtensionMessage } from '../shared/messages'

const VERSION = '0.1.0'
const TOKEN_KEY = 'auth_token'

// ──────────────────────────────────────────────────────────
// 1. Sync user token to background
// ──────────────────────────────────────────────────────────

function syncToken() {
  const token = localStorage.getItem(TOKEN_KEY)
  const msg: ExtensionMessage = { type: 'SYNC_USER_TOKEN', payload: { token } }
  chrome.runtime.sendMessage(msg, (response: ExtensionMessage) => {
    if (chrome.runtime.lastError) {
      console.warn('[Tellcraft Detector] sync error:', chrome.runtime.lastError.message)
      return
    }
    if (response?.type === 'SYNC_USER_TOKEN_RESPONSE' && response.payload.ok) {
      console.log('[Tellcraft Detector] ✓ user token synced to extension', token ? '(authenticated)' : '(logged out)')
    }
  })
}

// 初始 sync
syncToken()

// 監聽其他 tab 的 localStorage 變化（多 tab 登入/登出同步）
window.addEventListener('storage', (e: StorageEvent) => {
  if (e.key === TOKEN_KEY) syncToken()
})

// 定期 re-sync 避免 chrome.storage 跟 localStorage 漂移（保守 5min 一次）
setInterval(syncToken, 5 * 60 * 1000)

// ──────────────────────────────────────────────────────────
// 2. Pong 給 tellcraft.com 主視窗（commit 7 接 chat 按鈕用）
// ──────────────────────────────────────────────────────────

window.addEventListener('message', (event: MessageEvent) => {
  if (event.source !== window) return
  if (!event.data || typeof event.data !== 'object') return

  if (event.data.type === 'tc_ping_extension') {
    window.postMessage(
      { type: 'tc_extension_pong', version: VERSION },
      window.location.origin,
    )
  }
})

console.log('[Tellcraft Detector] loaded on tellcraft.com v' + VERSION + ' — token synced, pong listener active')
