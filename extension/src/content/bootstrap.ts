/**
 * content/bootstrap.ts — ISOLATED world content script
 *
 * 跑在 chrome.* APIs context（可用 chrome.runtime.sendMessage）
 * 職責（本 commit 為 scaffold）：
 *   1. 偵測 URL hash sentinel #tc=<conversationId>.<nonce>
 *   2. 後續 commit 4：handshake backend verify-preview → 啟動 overlay
 *   3. 後續 commit 5：mount PropertyEditor Shadow DOM
 *
 * 本 commit (commit 2) 只 log 偵測結果讓開發者驗證 extension 載入 OK
 */

import { parseTcHash, type ExtensionMessage } from '../shared/messages'

function init() {
  const tc = parseTcHash(window.location.hash)
  if (!tc) {
    console.log('[Tellcraft Bootstrap] no #tc= hash, dormant')
    return
  }

  console.log('[Tellcraft Bootstrap] detected hash:', tc)
  console.log('[Tellcraft Bootstrap] commit 2 scaffold — overlay mount in commit 4+5')

  // commit 4 接：handshake + bridge-injector
  // chrome.runtime.sendMessage({ type: 'VERIFY_PREVIEW', payload: { host: location.host, conversationId: tc.conversationId } })

  // 確認 background ↔ content message channel work
  const msg: ExtensionMessage = { type: 'PING_EXTENSION', payload: {} }
  chrome.runtime.sendMessage(msg, (response: ExtensionMessage) => {
    if (chrome.runtime.lastError) {
      console.error('[Tellcraft Bootstrap] runtime error:', chrome.runtime.lastError)
      return
    }
    if (response && response.type === 'PONG_EXTENSION') {
      console.log('[Tellcraft Bootstrap] ✓ background channel verified, version:', response.payload.version)
    }
  })
}

// document_idle 已保證 body 存在
init()
