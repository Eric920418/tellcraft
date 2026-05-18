/**
 * content/bootstrap.ts — ISOLATED world content script
 *
 * R11 commit 4 完整 3 層偵測：
 *   Layer 1: URL hash sentinel #tc=<conversationId>.<nonce>
 *   Layer 2: AUTH_REQUEST → background fetch /auth/exchange → 拿 scoped token
 *   Layer 3: VERIFY_PREVIEW → backend 比對 host vs preview_deployments.url
 *
 * 全 pass → 設 window.__TC_EXTENSION_READY__ = { conversationId, projectId }
 *   bridge-injector.ts (MAIN world) 看到此 flag 才 inject EDIT_BRIDGE_SCRIPT
 *   PropertyEditor mount (commit 5) 也讀此 flag 才啟動 overlay
 *
 * 失敗任一層 → 設 window.__TC_EXTENSION_ERROR__ = error，仍 console.log 不擾用戶頁面
 */

import { parseTcHash, type ExtensionMessage } from '../shared/messages'

interface TcReady {
  conversationId: string
  projectId: string
  scopedToken: string
  expiresAt: number
}

declare global {
  interface Window {
    __TC_EXTENSION_READY__?: TcReady
    __TC_EXTENSION_ERROR__?: string
  }
}

async function sendMessage<TRes extends ExtensionMessage>(msg: ExtensionMessage): Promise<TRes> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(msg, (response: TRes) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message ?? 'unknown'))
        return
      }
      resolve(response)
    })
  })
}

async function init() {
  // ── Layer 1: hash sentinel ──
  const tc = parseTcHash(window.location.hash)
  if (!tc) {
    console.log('[Tellcraft Bootstrap] no #tc= hash, dormant on', window.location.host)
    return
  }
  console.log('[Tellcraft Bootstrap] L1 hash detected:', tc)

  // ── Layer 2: auth exchange ──
  let authResp: Extract<ExtensionMessage, { type: 'AUTH_RESPONSE' }>
  try {
    authResp = await sendMessage({ type: 'AUTH_REQUEST', payload: { conversationId: tc.conversationId } })
  } catch (err) {
    console.error('[Tellcraft Bootstrap] L2 AUTH_REQUEST error:', err)
    window.__TC_EXTENSION_ERROR__ = `auth_error: ${(err as Error).message}`
    return
  }
  if (!authResp.payload.ok) {
    console.error('[Tellcraft Bootstrap] L2 auth/exchange failed:', authResp.payload.error)
    window.__TC_EXTENSION_ERROR__ = `auth_failed: ${authResp.payload.error}`
    return
  }
  console.log('[Tellcraft Bootstrap] ✓ L2 scoped token issued, expires:', new Date(authResp.payload.expiresAt).toISOString())

  // ── Layer 3: verify preview host ──
  const host = window.location.host
  let verifyResp: Extract<ExtensionMessage, { type: 'VERIFY_PREVIEW_RESPONSE' }>
  try {
    verifyResp = await sendMessage({ type: 'VERIFY_PREVIEW', payload: { host, conversationId: tc.conversationId } })
  } catch (err) {
    console.error('[Tellcraft Bootstrap] L3 VERIFY_PREVIEW error:', err)
    window.__TC_EXTENSION_ERROR__ = `verify_error: ${(err as Error).message}`
    return
  }
  if (!verifyResp.payload.ok) {
    console.error('[Tellcraft Bootstrap] L3 verify-preview failed:', verifyResp.payload.error)
    window.__TC_EXTENSION_ERROR__ = `verify_failed: ${verifyResp.payload.error}`
    return
  }
  console.log('[Tellcraft Bootstrap] ✓ L3 host verified, projectId:', verifyResp.payload.projectId)

  // ── 全 pass：設 flag 讓 bridge-injector 跑 ──
  window.__TC_EXTENSION_READY__ = {
    conversationId: authResp.payload.conversationId,
    projectId: authResp.payload.projectId,
    scopedToken: authResp.payload.token,
    expiresAt: authResp.payload.expiresAt,
  }
  console.log('[Tellcraft Bootstrap] ✓ __TC_EXTENSION_READY__ flag set, bridge-injector 可啟動')

  // Broadcast 給 bridge-injector (MAIN world)
  window.postMessage({ type: 'tc_extension_ready', conversationId: tc.conversationId, projectId: verifyResp.payload.projectId }, window.location.origin)

  // commit 5 接：mount PropertyEditor Shadow DOM overlay 在這
}

// document_idle 已保證 body 存在
init()
