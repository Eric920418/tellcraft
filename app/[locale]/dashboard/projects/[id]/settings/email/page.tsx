'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Link, useRouter } from '@/i18n/navigation'
import { motion } from 'framer-motion'
import { getProjectEmailConfig, updateProjectEmailConfig } from '@/app/lib/vps-api'

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

export default function ProjectEmailSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasKey, setHasKey] = useState(false)
  const [keyMask, setKeyMask] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState('')  // 新輸入值，空字串=不變
  const [emailFrom, setEmailFrom] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [projectId])

  async function load() {
    setIsLoading(true)
    setError(null)
    const token = getAuthToken()
    if (!token) {
      router.push(`/auth/login?next=/dashboard/projects/${projectId}/settings/email`)
      return
    }
    try {
      const result = await getProjectEmailConfig({ projectId, token })
      if (result.data) {
        setHasKey(result.data.hasResendApiKey)
        setKeyMask(result.data.resendApiKeyMask)
        setEmailFrom(result.data.emailFrom || '')
      } else {
        setError(result.error || '載入失敗')
      }
    } catch (err: any) {
      setError(err?.message || '載入失敗')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsSaving(true)
    const token = getAuthToken()
    if (!token) {
      router.push(`/auth/login?next=/dashboard/projects/${projectId}/settings/email`)
      return
    }

    try {
      const payload: { projectId: string; token: string; resendApiKey?: string | null; emailFrom?: string | null } = {
        projectId,
        token,
      }

      // apiKey 為空 → 不更新（保留舊的）
      // 若用戶按「清除」按鈕會單獨處理，不走這個流程
      if (apiKey.trim()) {
        payload.resendApiKey = apiKey.trim()
      }

      // emailFrom 空字串 = 清除，其他 = 更新
      payload.emailFrom = emailFrom.trim() || null

      const result = await updateProjectEmailConfig(payload)
      if (result.data?.success) {
        setSuccess('已儲存設定')
        setApiKey('')
        await load()
      } else {
        setError(result.error || '儲存失敗')
      }
    } catch (err: any) {
      setError(err?.message || '儲存失敗')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleClearKey() {
    if (!confirm('確定清除 Resend API key？清除後 magic-link 登入與通知信將無法寄出。')) return
    setError(null)
    setSuccess(null)
    setIsSaving(true)
    const token = getAuthToken()
    if (!token) {
      router.push(`/auth/login?next=/dashboard/projects/${projectId}/settings/email`)
      return
    }
    try {
      const result = await updateProjectEmailConfig({ projectId, token, resendApiKey: null })
      if (result.data?.success) {
        setSuccess('已清除 API key')
        await load()
      } else {
        setError(result.error || '清除失敗')
      }
    } catch (err: any) {
      setError(err?.message || '清除失敗')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Link
          href={`/dashboard/projects/${projectId}`}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← 返回專案
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold mb-2">Email 設定</h1>
        <p className="text-gray-600 text-sm mb-6">
          設定 Resend API key 與發信者資訊。客戶 app 會用此配置寄送 magic-link 登入信、驗證信、通知信。
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded">
            <strong>錯誤：</strong>
            <pre className="mt-1 text-sm whitespace-pre-wrap break-words">{error}</pre>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded text-sm">
            {success}
          </div>
        )}

        {isLoading ? (
          <div className="py-12 text-center text-gray-500">載入中...</div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resend API Key
              </label>
              {hasKey && (
                <div className="mb-2 text-sm text-gray-600">
                  目前：<span className="font-mono">{keyMask}</span>
                  <button
                    type="button"
                    onClick={handleClearKey}
                    disabled={isSaving}
                    className="ml-3 text-red-600 hover:underline disabled:opacity-50"
                  >
                    清除
                  </button>
                </div>
              )}
              <input
                type="password"
                autoComplete="off"
                placeholder={hasKey ? '輸入新值以覆蓋（或留空保留舊的）' : 're_xxxxxxxxxxxxxxxx'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                到 <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">resend.com/api-keys</a> 建立 API key。儲存後只顯示後 4 碼。
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                發信者（EMAIL_FROM）
              </label>
              <input
                type="text"
                placeholder="Example Co <noreply@example.com> 或 onboarding@resend.dev"
                value={emailFrom}
                onChange={(e) => setEmailFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                留空則預設 <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">onboarding@resend.dev</code>（Resend 共用測試域名，只能寄給帳號擁有者）。production 環境請自行驗證域名後改為 <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">Name &lt;email@yourdomain.com&gt;</code>。
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? '儲存中...' : '儲存'}
              </button>
            </div>

            <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded text-sm text-amber-900">
              <p className="font-medium mb-1">⚠ 重要提醒</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>設定會在下一次部署時注入 Vercel env vars，本次設定不影響已部署版本</li>
                <li>若客戶 app 偵測到 users.email 欄位會自動生成 magic-link 登入，請務必先設定 API key</li>
                <li>未設定時：sendEmail 呼叫會降級（回 skipped），不影響其他功能</li>
              </ul>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  )
}
