/**
 * shared/messages.ts — 型別化 message 協議
 *
 * 三層通信：
 *   1. page (vercel preview) ↔ content script (bootstrap, ISOLATED world)
 *      用 window.postMessage / window.addEventListener — 既有 EDIT_BRIDGE_SCRIPT tc_* 協議
 *   2. content script ↔ background service worker
 *      用 chrome.runtime.sendMessage / chrome.runtime.onMessage
 *   3. background ↔ tellcraft backend
 *      用 fetch + scoped JWT
 */

// ──────────────────────────────────────────────────────────
// Layer 2: content ↔ background
// ──────────────────────────────────────────────────────────

export type ExtensionMessage =
  // tellcraft.com content_script → background：用戶 token sync 給 extension
  | { type: 'SYNC_USER_TOKEN'; payload: { token: string | null } }
  | { type: 'SYNC_USER_TOKEN_RESPONSE'; payload: { ok: boolean } }
  // vercel.app content_script → background：拿 scoped JWT
  | { type: 'AUTH_REQUEST'; payload: { conversationId: string } }
  | { type: 'AUTH_RESPONSE'; payload: { ok: true; token: string; expiresAt: number; conversationId: string; projectId: string; userId: string } | { ok: false; error: string } }
  // vercel.app content_script → background：驗證 host 屬該 conversation
  | { type: 'VERIFY_PREVIEW'; payload: { host: string; conversationId: string } }
  | { type: 'VERIFY_PREVIEW_RESPONSE'; payload: { ok: true; projectId: string } | { ok: false; error: string } }
  | { type: 'APPLY_UPDATE'; payload: ApplyUpdatePayload }
  | { type: 'APPLY_UPDATE_RESPONSE'; payload: { ok: true; deploymentId: string } | { ok: false; error: string } }
  | { type: 'TELEMETRY'; payload: { eventType: string; patternKey?: string; meta?: Record<string, unknown> } }
  | { type: 'PING_EXTENSION'; payload: Record<string, never> }
  | { type: 'PONG_EXTENSION'; payload: { version: string } }

export interface ApplyUpdatePayload {
  conversationId: string
  elementId: string
  domPath: string  // tagName + nth-child chain，給 backend AST patch 定位用（commit 8+ 升級）
  originalText?: string  // R11 commit 6 MVP: regex unique match 用，commit 8+ AST 升級後可移除
  updates: Array<{
    kind: 'text' | 'className' | 'style' | 'attr'
    key?: string  // for style/attr: 屬性名
    value: string
  }>
}

// ──────────────────────────────────────────────────────────
// Layer 1: page ↔ content (tc_* protocol)
// 完整定義在 app/lib/edit-bridge-script.ts，這裡只 export type 給 overlay 用
// ──────────────────────────────────────────────────────────

export type BridgeEventType =
  | 'tc_iframeReady'
  | 'tc_elementSelected'
  | 'tc_elementDeselected'
  | 'tc_selectionChanged'
  | 'tc_health'
  | 'tc_runtimeError'
  | 'tc_setEditMode'
  | 'tc_applyUpdate'
  | 'tc_resetElement'
  | 'tc_applyOverrides'
  | 'tc_setAnnotations'

export interface BridgeEvent<T = unknown> {
  type: BridgeEventType
  payload: T
}

/**
 * Tellcraft preview URL hash sentinel
 * 用戶從 tellcraft chat 「✏️ 開啟編輯器」按鈕開啟時 URL 附加 `#tc=<conversationId>.<nonce>`
 * Extension content script bootstrap 看到此 hash 才啟動 overlay
 */
export const TC_HASH_PREFIX = '#tc='

export function parseTcHash(hash: string): { conversationId: string; nonce: string } | null {
  if (!hash.startsWith(TC_HASH_PREFIX)) return null
  const raw = hash.slice(TC_HASH_PREFIX.length)
  const [conversationId, nonce] = raw.split('.')
  if (!conversationId || !nonce) return null
  return { conversationId, nonce }
}
