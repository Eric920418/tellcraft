'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

/**
 * VPS Auth Callback Content
 * 處理 OAuth 回調，儲存 token 並重定向
 */
function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 優先從 hash fragment 讀（更安全），fallback 到 query param（向後相容）
    let token: string | null = null
    let returnTo = '/'
    let errorParam: string | null = null

    // 嘗試解析 hash fragment
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      token = hashParams.get('token')
      returnTo = hashParams.get('returnTo') || '/'
    }

    // Fallback 到 query params
    if (!token) {
      token = searchParams.get('token')
      returnTo = searchParams.get('returnTo') || returnTo || '/'
    }

    errorParam = searchParams.get('error')

    if (errorParam) {
      setError(getErrorMessage(errorParam))
      return
    }

    if (!token) {
      setError('未收到認證 token')
      return
    }

    // 清除 hash fragment（避免 token 留在 URL 中）
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname)
    }

    // 儲存 token 到 localStorage（供 useAuth hook 使用）
    localStorage.setItem('auth_token', token)

    // 設置 httpOnly cookie（供 middleware 使用）- 必須等待完成
    const setCookie = async () => {
      try {
        const response = await fetch('/api/auth/set-cookie', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
          credentials: 'same-origin',
        })

        if (!response.ok) {
          console.error('[Auth] Failed to set cookie:', await response.text())
        }
      } catch (err) {
        console.error('[Auth] Error setting cookie:', err)
      }

      // 等待一小段時間確保 cookie 完全設定
      await new Promise(resolve => setTimeout(resolve, 100))

      // 跳轉到目標頁面
      window.location.href = returnTo
    }

    setCookie()
  }, [searchParams, router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full p-6 text-center">
          <div className="text-red-500 text-6xl mb-4">!</div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            登入失敗
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            重新登入
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">登入中...</p>
      </div>
    </div>
  )
}

// 包裝 Suspense 以處理 useSearchParams
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">載入中...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}

function getErrorMessage(error: string): string {
  const errorMessages: Record<string, string> = {
    missing_code: '缺少授權碼',
    token_failed: '取得 token 失敗',
    userinfo_failed: '取得用戶資訊失敗',
    profile_failed: '取得用戶資料失敗',
    callback_failed: '認證回調失敗',
    exchange_failed: 'Token 交換失敗',
  }
  return errorMessages[error] || `認證錯誤: ${error}`
}
