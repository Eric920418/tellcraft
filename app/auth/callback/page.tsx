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
    const token = searchParams.get('token')
    const returnTo = searchParams.get('returnTo') || '/'
    const errorParam = searchParams.get('error')

    if (errorParam) {
      setError(getErrorMessage(errorParam))
      return
    }

    if (!token) {
      setError('未收到認證 token')
      return
    }

    // 儲存 token 到 localStorage（供 useAuth hook 使用）
    localStorage.setItem('auth_token', token)

    // 同時設置 httpOnly cookie（供 middleware 和 Server Components 使用）
    fetch('/api/auth/set-cookie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).finally(() => {
      // 無論 cookie 設置成功與否，都跳轉
      // 使用完整頁面重新載入，確保 useAuth hook 重新讀取 token
      window.location.href = returnTo
    })
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
