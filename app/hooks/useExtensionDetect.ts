'use client'

/**
 * useExtensionDetect — 偵測 Tellcraft Chrome Extension 是否安裝
 *
 * R11 commit 7
 *
 * 通信協議：
 *   1. 主視窗 postMessage({ type: 'tc_ping_extension' }, origin)
 *   2. extension/src/content/tellcraft-detector.ts 收到 → postMessage({ type: 'tc_extension_pong', version })
 *   3. 本 hook 收到 pong → setInstalled(true) + 記版本
 *
 * Fallback：3 秒沒收到 pong → setInstalled(false)
 *
 * 用法：
 *   const { installed, version } = useExtensionDetect()
 *   {installed ? <OpenEditorButton /> : <InstallExtensionLink />}
 */

import { useEffect, useState } from 'react'

interface ExtensionStatus {
  installed: boolean
  version: string | null
  loading: boolean
}

export function useExtensionDetect(): ExtensionStatus {
  const [installed, setInstalled] = useState(false)
  const [version, setVersion] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    let cancelled = false

    const handler = (event: MessageEvent) => {
      if (event.source !== window) return
      if (!event.data || typeof event.data !== 'object') return
      if (event.data.type === 'tc_extension_pong') {
        if (cancelled) return
        setInstalled(true)
        setVersion(typeof event.data.version === 'string' ? event.data.version : null)
        setLoading(false)
      }
    }
    window.addEventListener('message', handler)

    // ping (extension content_script 收到才回)
    window.postMessage({ type: 'tc_ping_extension' }, window.location.origin)

    // 3 秒 timeout — 沒收到 pong 視為未安裝
    const timeout = setTimeout(() => {
      if (cancelled) return
      setLoading(false)
    }, 3000)

    return () => {
      cancelled = true
      window.removeEventListener('message', handler)
      clearTimeout(timeout)
    }
  }, [])

  return { installed, version, loading }
}

/**
 * 把編輯器 hash sentinel 加到 vercel preview URL
 * 用戶點「✏️ 開啟編輯器」會打開 URL + #tc=<conversationId>.<nonce>
 * extension bootstrap.ts 看到此 hash 才啟動三層偵測 → mount overlay
 */
export function buildEditorUrl(previewUrl: string, conversationId: string): string {
  const nonce = Math.random().toString(36).slice(2, 10)
  const sep = previewUrl.includes('#') ? '&' : '#tc='
  return `${previewUrl}${sep}${conversationId}.${nonce}`
}

/**
 * Chrome Web Store URL (commit 8 packaging 後填正式 ID)
 * Dev 階段：開 chrome://extensions/ 用「載入未封裝」
 */
export const EXTENSION_INSTALL_URL = 'https://chrome.google.com/webstore/detail/tellcraft-editor/PLACEHOLDER'
