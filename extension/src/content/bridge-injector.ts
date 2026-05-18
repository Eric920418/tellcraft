/**
 * content/bridge-injector.ts — MAIN world content script
 *
 * 跑在 page DOM context（chrome.* APIs 不可用，但能訪問 page window/document）
 * 職責：inject EDIT_BRIDGE_SCRIPT IIFE 到頁面，啟動既有 10+ tc_* postMessage 協議
 *
 * EDIT_BRIDGE_SCRIPT 由 build.mjs 從 app/lib/edit-bridge-script.ts 抽出
 * 透過 esbuild define `__EDIT_BRIDGE_SCRIPT__` 內嵌成字串常數
 *
 * 本 commit (commit 2) 只做 scaffold — 實際注入 + handshake gate 在 commit 4
 */

declare const __EDIT_BRIDGE_SCRIPT__: string

function init() {
  // commit 4 才開：等 bootstrap.ts handshake 通過 (window.__TC_EXTENSION_READY__ flag)
  // 才注入 bridge script。本 commit 只 log 確認 build pipeline 把 script 正確內嵌。
  const len = typeof __EDIT_BRIDGE_SCRIPT__ === 'string' ? __EDIT_BRIDGE_SCRIPT__.length : 0
  console.log('[Tellcraft Bridge-Injector] MAIN world script loaded, EDIT_BRIDGE_SCRIPT length:', len)

  if (len === 0) {
    console.error('[Tellcraft Bridge-Injector] EDIT_BRIDGE_SCRIPT empty — build pipeline 沒注入')
    return
  }

  // commit 4 將取消這個 stub log，改為實際 inject：
  // const s = document.createElement('script')
  // s.textContent = __EDIT_BRIDGE_SCRIPT__
  // document.documentElement.appendChild(s)
  // s.remove()
}

init()
