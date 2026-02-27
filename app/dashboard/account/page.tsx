'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

interface ProviderInfo {
  provider: string
  email: string | null
  name: string | null
  avatarUrl: string | null
  linkedAt: string
  isPrimary: boolean
}

const PROVIDER_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  google: { label: 'Google', icon: 'G', color: '#4285F4' },
  line: { label: 'LINE', icon: 'L', color: '#06C755' },
}

const ALL_PROVIDERS = ['google', 'line']

export default function AccountPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [providers, setProviders] = useState<ProviderInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [unlinking, setUnlinking] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [user, setUser] = useState<{ name?: string; email?: string; avatarUrl?: string } | null>(null)

  // 檢查 URL 參數中的綁定結果
  useEffect(() => {
    const linked = searchParams.get('linked')
    const error = searchParams.get('error')

    if (linked) {
      const config = PROVIDER_CONFIG[linked]
      showToast(`${config?.label || linked} 帳號綁定成功`, 'success')
      // 清除 URL 參數
      window.history.replaceState({}, '', '/dashboard/account')
      // 重新載入資料
      fetchProviders()
    } else if (error) {
      const errorMessages: Record<string, string> = {
        PROVIDER_ALREADY_LINKED: '此帳號已綁定到其他用戶',
        PROVIDER_ALREADY_BOUND: '你已經綁定過此類型的帳號',
        LAST_PROVIDER: '無法解除最後一個登入方式',
        link_failed: '綁定失敗，請稍後再試',
      }
      showToast(errorMessages[error] || `錯誤：${error}`, 'error')
      window.history.replaceState({}, '', '/dashboard/account')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 5000)
  }

  async function fetchProviders() {
    const token = getAuthToken()
    if (!token) {
      router.push('/auth/login?next=/dashboard/account')
      return
    }

    try {
      // 同時取 user info 和 providers
      const [meRes, provRes] = await Promise.all([
        fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/auth/providers', { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if (meRes.ok) {
        const meData = await meRes.json()
        setUser(meData.user)
      }

      if (provRes.ok) {
        const provData = await provRes.json()
        setProviders(provData.providers || [])
      }
    } catch (error) {
      console.error('[Account] Failed to fetch:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProviders()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleUnlink(provider: string) {
    const token = getAuthToken()
    if (!token) return

    const config = PROVIDER_CONFIG[provider]
    if (!confirm(`確定要解除 ${config?.label || provider} 帳號的綁定嗎？`)) return

    setUnlinking(provider)
    try {
      const res = await fetch(`/api/auth/unlink/${provider}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await res.json()

      if (res.ok && data.success) {
        showToast(`已解除 ${config?.label} 綁定`, 'success')
        setProviders(prev => prev.filter(p => p.provider !== provider))
      } else {
        const errorMessages: Record<string, string> = {
          LAST_PROVIDER: '無法解除最後一個登入方式',
        }
        showToast(errorMessages[data.error] || '解除綁定失敗', 'error')
      }
    } catch {
      showToast('網路錯誤，請稍後再試', 'error')
    } finally {
      setUnlinking(null)
    }
  }

  const linkedProviderNames = providers.map(p => p.provider)
  const unlinkedProviders = ALL_PROVIDERS.filter(p => !linkedProviderNames.includes(p))

  if (isLoading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
        載入中...
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px' }}>
      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            padding: '12px 20px',
            borderRadius: 8,
            background: toast.type === 'success' ? '#10B981' : '#EF4444',
            color: 'white',
            fontSize: 14,
            fontWeight: 500,
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {toast.message}
        </motion.div>
      )}

      {/* 頁面標題 */}
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, letterSpacing: '-0.02em' }}>
        帳號設定
      </h1>
      <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 32 }}>
        管理你的登入方式和帳號資訊
      </p>

      {/* 用戶資訊 */}
      <section style={{
        padding: 24,
        border: '1px solid var(--border-color)',
        borderRadius: 12,
        marginBottom: 24,
        background: 'var(--white)',
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>基本資訊</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {user?.avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={user.avatarUrl}
              alt=""
              style={{ width: 56, height: 56, borderRadius: '50%', border: '1px solid var(--border-color)' }}
            />
          ) : (
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, color: 'var(--gray-500)',
            }}>
              {user?.name?.[0] || user?.email?.[0] || '?'}
            </div>
          )}
          <div>
            <div style={{ fontSize: 16, fontWeight: 500 }}>{user?.name || '未設定名稱'}</div>
            <div style={{ fontSize: 14, color: 'var(--gray-500)', marginTop: 2 }}>{user?.email}</div>
          </div>
        </div>
      </section>

      {/* 已綁定帳號 */}
      <section style={{
        padding: 24,
        border: '1px solid var(--border-color)',
        borderRadius: 12,
        marginBottom: 24,
        background: 'var(--white)',
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>已綁定的登入方式</h2>

        {providers.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--gray-400)' }}>尚無綁定的登入方式</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {providers.map(p => {
              const config = PROVIDER_CONFIG[p.provider] || { label: p.provider, icon: '?', color: '#666' }
              return (
                <div
                  key={p.provider}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    background: 'var(--gray-50)',
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {/* Provider Icon */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: config.color, color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700,
                  }}>
                    {config.icon}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>
                      {config.label}
                      {p.isPrimary && (
                        <span style={{
                          marginLeft: 8, fontSize: 11, color: 'var(--gray-400)',
                          padding: '1px 6px', background: 'var(--gray-100)', borderRadius: 4,
                        }}>
                          主要
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>
                      {p.email || '—'}
                      {p.linkedAt && (
                        <span style={{ marginLeft: 8 }}>
                          綁定於 {new Date(p.linkedAt).toLocaleDateString('zh-TW')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 解綁按鈕（至少保留一個） */}
                  {providers.length > 1 && (
                    <button
                      onClick={() => handleUnlink(p.provider)}
                      disabled={unlinking === p.provider}
                      style={{
                        padding: '6px 12px',
                        fontSize: 12,
                        border: '1px solid var(--border-color)',
                        borderRadius: 6,
                        background: 'var(--white)',
                        color: 'var(--gray-600)',
                        cursor: unlinking === p.provider ? 'not-allowed' : 'pointer',
                        opacity: unlinking === p.provider ? 0.5 : 1,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {unlinking === p.provider ? '解除中...' : '解除綁定'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* 可綁定帳號 */}
      {unlinkedProviders.length > 0 && (
        <section style={{
          padding: 24,
          border: '1px solid var(--border-color)',
          borderRadius: 12,
          background: 'var(--white)',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>綁定其他登入方式</h2>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 16 }}>
            綁定後可以用任一方式登入同一帳戶
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {unlinkedProviders.map(provider => {
              const config = PROVIDER_CONFIG[provider]
              return (
                <a
                  key={provider}
                  href={`/api/auth/link/${provider}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: `1px dashed var(--border-color)`,
                    textDecoration: 'none',
                    color: 'var(--black)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = config.color
                    e.currentTarget.style.background = 'var(--gray-50)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-color)'
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: `${config.color}20`, color: config.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700,
                  }}>
                    {config.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>綁定 {config.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                      使用 {config.label} 帳號登入此帳戶
                    </div>
                  </div>
                  <span style={{ fontSize: 18, color: 'var(--gray-300)' }}>+</span>
                </a>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
