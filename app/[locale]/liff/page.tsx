'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useLocalePath } from '@/app/hooks/useLocalePath'

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID

export default function LiffPage() {
  const t = useTranslations('liff')
  const localePath = useLocalePath()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState(t('initStatus'))

  useEffect(() => {
    if (!LIFF_ID) {
      setError(t('configError'))
      return
    }

    initLiff()
  }, [])

  async function initLiff() {
    try {
      // 動態 import，只在此頁面載入 LIFF SDK
      const liff = (await import('@line/liff')).default

      setStatus(t('connectingLine'))
      await liff.init({ liffId: LIFF_ID! })

      // LIFF init 後讀參數（init 前 URL 參數可能不穩定）
      const params = new URLSearchParams(window.location.search)
      const conversationId = params.get('conversationId')

      // 未登入 → 觸發 LINE Login（LINE 內建瀏覽器幾乎不會觸發）
      if (!liff.isLoggedIn()) {
        setStatus(t('redirectingLogin'))
        liff.login({
          redirectUri: window.location.href,
        })
        return
      }

      // 取得 LINE ID Token
      setStatus(t('verifying'))
      const idToken = liff.getIDToken()
      if (!idToken) {
        setError(t('noIdToken'))
        return
      }

      // 呼叫後端驗證 → 取得 JWT
      setStatus(t('loggingInTellcraft'))
      const res = await fetch('/api/vps/auth/liff/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `${t('verificationFailed')} (${res.status})`)
      }

      const { token } = await res.json() as { token: string }

      // 存 JWT 到 localStorage
      localStorage.setItem('auth_token', token)

      // 設 httpOnly Cookie（供 middleware 使用）
      await fetch('/api/auth/set-cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
        credentials: 'same-origin',
      }).catch(() => {
        // Cookie 設定失敗不阻塞，localStorage 已足夠
      })

      // 跳轉主頁面（帶 conversation 參數恢復對話）
      setStatus(t('navigating'))
      const targetUrl = conversationId
        ? `/?conversation=${conversationId}`
        : '/'
      // 用 window.location.href 確保完整重載，觸發 useAuth 驗證
      window.location.href = localePath(targetUrl)
    } catch (err) {
      console.error('[LIFF] Init error:', err)
      setError(err instanceof Error ? err.message : t('loginError'))
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full p-6 text-center">
          <div className="text-red-500 text-5xl mb-4">!</div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('loginFailed')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <a
            href="/"
            className="inline-block px-6 py-2.5 bg-[#06C755] text-white rounded-lg hover:bg-[#05b74d] transition font-medium"
          >
            {t('goHome')}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        {/* LINE 綠色 spinner */}
        <div className="relative mx-auto mb-6 w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#06C755] animate-spin" />
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">{status}</p>
      </div>
    </div>
  )
}
