'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n/navigation'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

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
  const t = useTranslations('dashboard.account')
  const tc = useTranslations('common')
  const [providers, setProviders] = useState<ProviderInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [unlinking, setUnlinking] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [user, setUser] = useState<{ name?: string; email?: string; avatarUrl?: string; preferredLanguage?: string | null } | null>(null)
  const [savingLanguage, setSavingLanguage] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // 檢查 URL 參數中的綁定結果
  useEffect(() => {
    const linked = searchParams.get('linked')
    const error = searchParams.get('error')

    if (linked) {
      const config = PROVIDER_CONFIG[linked]
      showToast(t('linkSuccess', { provider: config?.label || linked }), 'success')
      // 清除 URL 參數
      window.history.replaceState({}, '', '/dashboard/account')
      // 重新載入資料
      fetchProviders()
    } else if (error) {
      const errorMessages: Record<string, string> = {
        PROVIDER_ALREADY_LINKED: t('errorProviderAlreadyLinked'),
        PROVIDER_ALREADY_BOUND: t('errorProviderAlreadyBound'),
        LAST_PROVIDER: t('errorLastProvider'),
        link_failed: t('errorLinkFailed'),
      }
      showToast(errorMessages[error] || t('errorGeneric', { error }), 'error')
      window.history.replaceState({}, '', '/dashboard/account')
    }
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
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const syncMobileState = (event?: MediaQueryListEvent) => {
      setIsMobile(event ? event.matches : mediaQuery.matches)
    }

    syncMobileState()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncMobileState)
      return () => mediaQuery.removeEventListener('change', syncMobileState)
    }

    mediaQuery.addListener(syncMobileState)
    return () => mediaQuery.removeListener(syncMobileState)
  }, [])

  async function handleLanguageChange(lang: string) {
    const token = getAuthToken()
    if (!token) return

    setSavingLanguage(true)
    try {
      const res = await fetch('/api/auth/preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferredLanguage: lang }),
      })

      if (res.ok) {
        document.cookie = `NEXT_LOCALE=${lang};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`
        showToast(t('languageSaved'), 'success')
        // 硬跳轉確保 middleware 重新解析語言
        const currentPath = window.location.pathname
        // 移除現有 locale prefix 再加上新的
        const pathWithoutLocale = currentPath.replace(/^\/(zh|en)/, '') || '/'
        const newPath = lang === 'en' ? pathWithoutLocale : `/${lang}${pathWithoutLocale}`
        setTimeout(() => {
          window.location.href = newPath
        }, 500)
      } else {
        showToast(t('languageSaveFailed'), 'error')
      }
    } catch {
      showToast(t('languageSaveFailed'), 'error')
    } finally {
      setSavingLanguage(false)
    }
  }

  async function handleUnlink(provider: string) {
    const token = getAuthToken()
    if (!token) return

    const config = PROVIDER_CONFIG[provider]
    if (!confirm(t('confirmUnlink', { provider: config?.label || provider }))) return

    setUnlinking(provider)
    try {
      const res = await fetch(`/api/auth/unlink/${provider}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await res.json()

      if (res.ok && data.success) {
        showToast(t('unlinkSuccess', { provider: config?.label }), 'success')
        setProviders(prev => prev.filter(p => p.provider !== provider))
      } else {
        const errorMessages: Record<string, string> = {
          LAST_PROVIDER: t('errorLastProvider'),
        }
        showToast(errorMessages[data.error] || t('unlinkFailed'), 'error')
      }
    } catch {
      showToast(t('networkError'), 'error')
    } finally {
      setUnlinking(null)
    }
  }

  const linkedProviderNames = providers.map(p => p.provider)
  const unlinkedProviders = ALL_PROVIDERS.filter(p => !linkedProviderNames.includes(p))

  if (isLoading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
        {tc('loading')}
      </div>
    )
  }

  return (
    <div className="dashboard-account-container" style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px' }}>
      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 20,
            right: isMobile ? 12 : 20,
            left: isMobile ? 12 : 'auto',
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
        {t('title')}
      </h1>
      <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 32 }}>
        {t('subtitle')}
      </p>

      {/* 用戶資訊 */}
      <section style={{
        padding: 24,
        border: '1px solid var(--border-color)',
        borderRadius: 12,
        marginBottom: 24,
        background: 'var(--white)',
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>{t('basicInfo')}</h2>
        <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
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
          <div style={{ minWidth: 0, width: '100%' }}>
            <div style={{ fontSize: 16, fontWeight: 500 }}>{user?.name || t('noNameSet')}</div>
            <div style={{ fontSize: 14, color: 'var(--gray-500)', marginTop: 2, wordBreak: 'break-all' }}>{user?.email}</div>
          </div>
        </div>

        {/* 語言偏好 */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{t('languagePreference')}</div>
          <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 12 }}>{t('languagePreferenceHint')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              { value: 'zh', label: '中文' },
              { value: 'en', label: 'English' },
            ].map(lang => {
              const isActive = user?.preferredLanguage
                ? user.preferredLanguage === lang.value
                : (typeof document !== 'undefined' && document.cookie.match(/NEXT_LOCALE=(\w+)/)?.[1]) === lang.value
              return (
                <button
                  key={lang.value}
                  onClick={() => handleLanguageChange(lang.value)}
                  disabled={savingLanguage}
                  style={{
                    padding: '8px 20px',
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    border: isActive ? '2px solid var(--text-primary)' : '1px solid var(--border-color)',
                    borderRadius: 8,
                    background: isActive ? 'var(--gray-50)' : 'var(--white)',
                    color: isActive ? 'var(--text-primary)' : 'var(--gray-500)',
                    cursor: savingLanguage ? 'not-allowed' : 'pointer',
                    opacity: savingLanguage ? 0.5 : 1,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {lang.label}
                </button>
              )
            })}
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
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>{t('linkedLoginMethods')}</h2>

        {providers.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--gray-400)' }}>{t('noLinkedMethods')}</p>
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
                    flexWrap: isMobile ? 'wrap' : 'nowrap',
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
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>
                      {config.label}
                      {p.isPrimary && (
                        <span style={{
                          marginLeft: 8, fontSize: 11, color: 'var(--gray-400)',
                          padding: '1px 6px', background: 'var(--gray-100)', borderRadius: 4,
                        }}>
                          {t('primary')}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2, wordBreak: 'break-all' }}>
                      {p.email || '—'}
                      {p.linkedAt && (
                        <span style={{ marginLeft: isMobile ? 0 : 8, display: isMobile ? 'block' : 'inline' }}>
                          {t('linkedAt', { date: new Date(p.linkedAt).toLocaleDateString() })}
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
                        width: isMobile ? '100%' : 'auto',
                      }}
                    >
                      {unlinking === p.provider ? t('unlinking') : t('unlinkAccount')}
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
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>{t('linkOtherMethods')}</h2>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 16 }}>
            {t('linkOtherHint')}
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
                    flexWrap: isMobile ? 'wrap' : 'nowrap',
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
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{t('linkProvider', { provider: config.label })}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)', wordBreak: 'break-word' }}>
                      {t('linkProviderHint', { provider: config.label })}
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
