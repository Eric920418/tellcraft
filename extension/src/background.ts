/**
 * background.ts — MV3 service worker
 *
 * R11 commit 4 完整接通：
 *   - SYNC_USER_TOKEN (從 tellcraft.com detector) → 存 chrome.storage.local.userToken
 *   - AUTH_REQUEST (從 vercel.app bootstrap) → POST /api/extension/auth/exchange → 存 scoped token
 *   - VERIFY_PREVIEW → GET /api/extension/verify-preview
 *   - APPLY_UPDATE → commit 6 接
 *   - TELEMETRY → commit 8 接
 *
 * Chrome service worker 不能用 fetch().credentials='include' 自動帶 cookie（CORS issue），
 * 改成 chrome.storage.local 存 user token + Authorization Bearer header 顯式帶
 */

import type { ExtensionMessage } from './shared/messages'

const VERSION = '0.1.0'
const TELLCRAFT_API_URL = 'https://tellcraft.com'

// ──────────────────────────────────────────────────────────
// 安裝事件
// ──────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Tellcraft BG] installed:', details.reason, 'version:', VERSION)
})

// ──────────────────────────────────────────────────────────
// HTTP helpers
// ──────────────────────────────────────────────────────────

async function getUserToken(): Promise<string | null> {
  const data = await chrome.storage.local.get('userToken')
  return data.userToken ?? null
}

async function setUserToken(token: string | null): Promise<void> {
  if (token) {
    await chrome.storage.local.set({ userToken: token })
  } else {
    await chrome.storage.local.remove('userToken')
  }
}

async function getScopedToken(): Promise<string | null> {
  const data = await chrome.storage.session.get('scopedToken')
  return data.scopedToken ?? null
}

async function setScopedToken(token: string, expiresAt: number, conversationId: string, projectId: string): Promise<void> {
  await chrome.storage.session.set({ scopedToken: token, scopedExpiresAt: expiresAt, scopedConversationId: conversationId, scopedProjectId: projectId })
}

// ──────────────────────────────────────────────────────────
// Tellcraft backend API calls
// ──────────────────────────────────────────────────────────

async function callAuthExchange(conversationId: string): Promise<
  | { ok: true; token: string; expiresAt: number; conversationId: string; projectId: string; userId: string }
  | { ok: false; error: string }
> {
  const userToken = await getUserToken()
  if (!userToken) {
    return { ok: false, error: '請先在 tellcraft.com 登入（extension 沒拿到 user token）' }
  }
  try {
    const res = await fetch(`${TELLCRAFT_API_URL}/api/vps/api/extension/auth/exchange`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversationId }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { ok: false, error: body.error ?? `HTTP ${res.status}` }
    }
    // body shape: { scopedToken, expiresAt, conversationId, projectId, userId }
    await setScopedToken(body.scopedToken, body.expiresAt, body.conversationId, body.projectId)
    return {
      ok: true,
      token: body.scopedToken,
      expiresAt: body.expiresAt,
      conversationId: body.conversationId,
      projectId: body.projectId,
      userId: body.userId,
    }
  } catch (err) {
    return { ok: false, error: `Network error: ${(err as Error).message}` }
  }
}

async function callVerifyPreview(host: string, conversationId: string): Promise<
  | { ok: true; projectId: string }
  | { ok: false; error: string }
> {
  const scoped = await getScopedToken()
  if (!scoped) {
    return { ok: false, error: 'No scoped token (call AUTH_REQUEST first)' }
  }
  try {
    const params = new URLSearchParams({ host, conversationId })
    const res = await fetch(`${TELLCRAFT_API_URL}/api/vps/api/extension/verify-preview?${params}`, {
      headers: { 'Authorization': `Bearer ${scoped}` },
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { ok: false, error: body.error ?? `HTTP ${res.status}` }
    }
    return { ok: true, projectId: body.projectId }
  } catch (err) {
    return { ok: false, error: `Network error: ${(err as Error).message}` }
  }
}

// ──────────────────────────────────────────────────────────
// Message router
// ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  console.log('[Tellcraft BG] message:', message.type, 'from:', sender.tab?.url ?? 'popup/content')

  switch (message.type) {
    case 'PING_EXTENSION':
      sendResponse({ type: 'PONG_EXTENSION', payload: { version: VERSION } })
      return false

    case 'SYNC_USER_TOKEN':
      // 從 tellcraft.com content script sync user JWT
      setUserToken(message.payload.token).then(() => {
        console.log('[Tellcraft BG] user token synced:', message.payload.token ? '✓ stored' : '✗ cleared')
        sendResponse({ type: 'SYNC_USER_TOKEN_RESPONSE', payload: { ok: true } })
      })
      return true  // async response

    case 'AUTH_REQUEST':
      callAuthExchange(message.payload.conversationId).then(result => {
        if (result.ok) {
          console.log('[Tellcraft BG] ✓ scoped token issued for conv:', result.conversationId)
          sendResponse({
            type: 'AUTH_RESPONSE',
            payload: {
              ok: true,
              token: result.token,
              expiresAt: result.expiresAt,
              conversationId: result.conversationId,
              projectId: result.projectId,
              userId: result.userId,
            },
          })
        } else {
          console.error('[Tellcraft BG] auth/exchange failed:', result.error)
          sendResponse({ type: 'AUTH_RESPONSE', payload: { ok: false, error: result.error } })
        }
      })
      return true

    case 'VERIFY_PREVIEW':
      callVerifyPreview(message.payload.host, message.payload.conversationId).then(result => {
        if (result.ok) {
          console.log('[Tellcraft BG] ✓ preview verified for host:', message.payload.host)
          sendResponse({ type: 'VERIFY_PREVIEW_RESPONSE', payload: { ok: true, projectId: result.projectId } })
        } else {
          console.error('[Tellcraft BG] verify-preview failed:', result.error)
          sendResponse({ type: 'VERIFY_PREVIEW_RESPONSE', payload: { ok: false, error: result.error } })
        }
      })
      return true

    case 'APPLY_UPDATE':
      console.log('[Tellcraft BG] APPLY_UPDATE stub (commit 6 will implement)', message.payload)
      sendResponse({ type: 'APPLY_UPDATE_RESPONSE', payload: { ok: false, error: 'apply-update not implemented yet' } })
      return false

    case 'TELEMETRY':
      console.log('[Tellcraft BG] TELEMETRY stub (commit 8 will implement)', message.payload)
      return false

    default:
      console.warn('[Tellcraft BG] unknown message:', (message as { type: string }).type)
      return false
  }
})

export {}
