/**
 * background.ts — MV3 service worker
 *
 * 職責：
 *   1. content script → background message router (chrome.runtime.onMessage)
 *   2. tellcraft API proxy + scoped JWT 儲存/renew
 *   3. extension_installed onInstalled hook + telemetry
 *
 * 本 commit (commit 2) 只 scaffold message handler，實際 auth/API call 在 commit 4 接通
 */

import type { ExtensionMessage } from './shared/messages'

const VERSION = '0.1.0'

// 安裝事件
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Tellcraft Extension] installed:', details.reason, 'version:', VERSION)
})

// 跨腳本通信
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  console.log('[Tellcraft BG] message:', message.type, 'from:', sender.tab?.url ?? 'popup/content')

  switch (message.type) {
    case 'PING_EXTENSION':
      sendResponse({ type: 'PONG_EXTENSION', payload: { version: VERSION } })
      return false  // sync response

    case 'AUTH_REQUEST':
      // commit 4 接：chrome.cookies.get + POST /api/extension/auth/exchange
      console.log('[Tellcraft BG] AUTH_REQUEST stub (commit 4 will implement)')
      sendResponse({ type: 'AUTH_RESPONSE', payload: { ok: false, error: 'auth not implemented yet' } })
      return false

    case 'VERIFY_PREVIEW':
      console.log('[Tellcraft BG] VERIFY_PREVIEW stub (commit 4 will implement)')
      sendResponse({ type: 'VERIFY_PREVIEW_RESPONSE', payload: { ok: false, error: 'verify not implemented yet' } })
      return false

    case 'APPLY_UPDATE':
      // commit 6 接：POST /api/extension/apply-update
      console.log('[Tellcraft BG] APPLY_UPDATE stub (commit 6 will implement)', message.payload)
      sendResponse({ type: 'APPLY_UPDATE_RESPONSE', payload: { ok: false, error: 'apply-update not implemented yet' } })
      return false

    case 'TELEMETRY':
      // commit 8 接：fire-and-forget POST /api/extension/telemetry
      console.log('[Tellcraft BG] TELEMETRY stub (commit 8 will implement)', message.payload)
      return false

    default:
      console.warn('[Tellcraft BG] unknown message type:', (message as { type: string }).type)
      return false
  }
})

export {}
