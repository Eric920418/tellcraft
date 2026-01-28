'use client'

import { useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState<'google' | 'line' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleLogin = async () => {
    setIsLoading('google')
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
        setIsLoading(null)
      }
    } catch (err) {
      setError('登入失敗，請稍後再試')
      setIsLoading(null)
    }
  }

  const handleLineLogin = async () => {
    setIsLoading('line')
    setError(null)

    try {
      // LINE OAuth 使用自訂路由
      window.location.href = '/api/auth/line'
    } catch (err) {
      setError('登入失敗，請稍後再試')
      setIsLoading(null)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'var(--gray-50)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          width: '100%',
          maxWidth: 400,
          background: 'var(--white)',
          border: '1px solid var(--border-color)',
          padding: '48px 40px',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 500,
              letterSpacing: '-0.02em',
              marginBottom: 8,
            }}
          >
            登入 Tellcraft
          </h1>
          <p
            style={{
              fontSize: 14,
              color: 'var(--gray-500)',
            }}
          >
            用對話打造你的軟體產品
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '12px 16px',
              background: '#FEE2E2',
              border: '1px solid #FECACA',
              color: '#DC2626',
              fontSize: 14,
              marginBottom: 24,
            }}
          >
            {error}
          </motion.div>
        )}

        {/* OAuth Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Google */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleGoogleLogin}
            disabled={isLoading !== null}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              width: '100%',
              padding: '14px 20px',
              fontSize: 15,
              fontWeight: 500,
              background: 'var(--white)',
              color: 'var(--black)',
              border: '1px solid var(--border-color)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading && isLoading !== 'google' ? 0.5 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            {isLoading === 'google' ? (
              <LoadingSpinner />
            ) : (
              <>
                <GoogleIcon />
                <span>使用 Google 帳號登入</span>
              </>
            )}
          </motion.button>

          {/* LINE */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleLineLogin}
            disabled={isLoading !== null}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              width: '100%',
              padding: '14px 20px',
              fontSize: 15,
              fontWeight: 500,
              background: '#06C755',
              color: '#FFFFFF',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading && isLoading !== 'line' ? 0.5 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            {isLoading === 'line' ? (
              <LoadingSpinner color="#FFFFFF" />
            ) : (
              <>
                <LineIcon />
                <span>使用 LINE 帳號登入</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            margin: '32px 0',
          }}
        >
          <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
          <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>或</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
        </div>

        {/* Guest Option */}
        <a
          href="/"
          style={{
            display: 'block',
            textAlign: 'center',
            fontSize: 14,
            color: 'var(--gray-500)',
            textDecoration: 'none',
          }}
        >
          以訪客身份繼續（功能受限）
        </a>

        {/* Footer */}
        <div
          style={{
            marginTop: 40,
            paddingTop: 24,
            borderTop: '1px solid var(--border-color)',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: 'var(--gray-400)',
              lineHeight: 1.6,
            }}
          >
            登入即表示你同意我們的
            <a href="/terms" style={{ color: 'var(--gray-500)' }}>
              服務條款
            </a>
            和
            <a href="/privacy" style={{ color: 'var(--gray-500)' }}>
              隱私權政策
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

// Icons
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  )
}

function LineIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.121.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967 1.739-1.907 2.572-3.843 2.572-5.992zm-18.988.198c0-.127.103-.231.231-.231h2.645c.127 0 .23.104.23.231v3.858h1.893V10.502c0-.127.104-.231.231-.231h.833c.127 0 .231.104.231.231v4.921c0 .127-.104.231-.231.231H7.212a.231.231 0 01-.231-.231v-4.921zm-1.577-.231h.833c.127 0 .231.104.231.231v4.921c0 .127-.104.231-.231.231h-.833a.231.231 0 01-.231-.231V10.502c0-.127.104-.231.231-.231zm12.076 0h.833c.127 0 .231.104.231.231v4.921c0 .127-.104.231-.231.231h-.833a.233.233 0 01-.203-.119l-2.381-3.22v3.108c0 .127-.103.231-.23.231h-.833a.231.231 0 01-.231-.231V10.502c0-.127.103-.231.231-.231h.833c.09 0 .171.052.203.119l2.381 3.22v-3.108c0-.127.103-.231.23-.231zm4.231 1.064c.127 0 .231.103.231.231v.833c0 .127-.104.231-.231.231h-1.893v.894h1.893c.127 0 .231.104.231.231v.833c0 .127-.104.231-.231.231h-2.956a.231.231 0 01-.231-.231V10.502c0-.127.103-.231.231-.231h2.956c.127 0 .231.104.231.231v.833c0 .127-.104.231-.231.231h-1.893v.894l1.893.001z" />
    </svg>
  )
}

function LoadingSpinner({ color = 'var(--black)' }: { color?: string }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      style={{
        width: 18,
        height: 18,
        border: `2px solid ${color}`,
        borderTopColor: 'transparent',
        borderRadius: '50%',
      }}
    />
  )
}
