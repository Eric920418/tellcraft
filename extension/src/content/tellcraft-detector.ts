/**
 * content/tellcraft-detector.ts — 跑在 tellcraft.com 上的 content script
 *
 * 職責：讓 tellcraft.com 主視窗能偵測「extension 是否安裝」
 *
 * 通信方式：
 *   1. tellcraft.com 主視窗 window.postMessage({ type: 'tc_ping_extension' }, '*')
 *   2. 本 content script 收到 → 回 window.postMessage({ type: 'tc_extension_pong', version }, '*')
 *   3. tellcraft.com hook 拿到 pong → 顯示「✏️ 開啟編輯器」按鈕（commit 7）
 */

window.addEventListener('message', (event: MessageEvent) => {
  // 安全性：來源必須是當前 tab 自己
  if (event.source !== window) return
  if (!event.data || typeof event.data !== 'object') return

  if (event.data.type === 'tc_ping_extension') {
    window.postMessage(
      { type: 'tc_extension_pong', version: '0.1.0' },
      window.location.origin,
    )
  }
})

console.log('[Tellcraft Detector] loaded on tellcraft.com — waiting for tc_ping_extension')
