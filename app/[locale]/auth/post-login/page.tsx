'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n/navigation'
import { motion } from 'framer-motion'
import { initializeSessionFromAuth } from '@/app/actions'

function PostLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'merging' | 'success' | 'error'>('merging')
  const [migrationResult, setMigrationResult] = useState<{
    migratedProjects: number
    migratedConversations: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const next = searchParams.get('next') ?? '/'

  useEffect(() => {
    const handlePostLogin = async () => {
      // 從 sessionStorage 獲取待合併的 anonymousId
      const pendingAnonymousId = sessionStorage.getItem('tellcraft_pending_anonymous_id')

      try {
        // 調用 initializeSessionFromAuth 並傳入 anonymousId 進行合併
        const result = await initializeSessionFromAuth({
          anonymousId: pendingAnonymousId || undefined,
        })

        if (result.success && result.data) {
          // 清除 pending anonymousId
          sessionStorage.removeItem('tellcraft_pending_anonymous_id')

          // 清除 Cookie 中的 anonymousId（已經合併了）
          if (pendingAnonymousId) {
            try {
              await fetch('/api/session', { method: 'DELETE' })
            } catch {
              // ignore
            }

            // 清除 localStorage 中的 anonymousId
            localStorage.removeItem('tellcraft_anonymous_id')
          }

          // 設置合併結果
          if (result.data.migrationResult) {
            setMigrationResult(result.data.migrationResult)

            // 如果有遷移的資料，短暫顯示成功訊息
            if (
              result.data.migrationResult.migratedProjects > 0 ||
              result.data.migrationResult.migratedConversations > 0
            ) {
              setStatus('success')
              // 等待 2 秒後跳轉
              setTimeout(() => {
                router.push(next)
              }, 2000)
              return
            }
          }

          // 沒有需要遷移的資料，直接跳轉
          router.push(next)
        } else {
          setError(result.error || '登入處理失敗')
          setStatus('error')
        }
      } catch (err) {
        console.error('Post-login error:', err)
        setError('登入處理時發生錯誤')
        setStatus('error')
      }
    }

    handlePostLogin()
  }, [next, router])

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
          textAlign: 'center',
        }}
      >
        {status === 'merging' && (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{
                width: 40,
                height: 40,
                border: '3px solid var(--gray-200)',
                borderTopColor: 'var(--black)',
                borderRadius: '50%',
                margin: '0 auto 24px',
              }}
            />
            <h2
              style={{
                fontSize: 18,
                fontWeight: 500,
                marginBottom: 8,
              }}
            >
              正在處理登入...
            </h2>
            <p
              style={{
                fontSize: 14,
                color: 'var(--gray-500)',
              }}
            >
              請稍候
            </p>
          </>
        )}

        {status === 'success' && migrationResult && (
          <>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'var(--gray-50)',
                border: '2px solid var(--black)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: 24,
              }}
            >
              <span style={{ color: 'var(--black)' }}>&#10003;</span>
            </div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 500,
                marginBottom: 8,
              }}
            >
              登入成功
            </h2>
            <p
              style={{
                fontSize: 14,
                color: 'var(--gray-500)',
                marginBottom: 16,
              }}
            >
              已將你的訪客資料合併到帳號
            </p>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 24,
                padding: '16px 0',
                borderTop: '1px solid var(--border-color)',
              }}
            >
              {migrationResult.migratedProjects > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 300,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {migrationResult.migratedProjects}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>專案已遷移</div>
                </div>
              )}
              {migrationResult.migratedConversations > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 300,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {migrationResult.migratedConversations}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>對話已遷移</div>
                </div>
              )}
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: 24,
              }}
            >
              <span style={{ color: '#DC2626' }}>!</span>
            </div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 500,
                marginBottom: 8,
              }}
            >
              處理失敗
            </h2>
            <p
              style={{
                fontSize: 14,
                color: 'var(--gray-500)',
                marginBottom: 24,
              }}
            >
              {error}
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(next)}
              style={{
                padding: '12px 24px',
                fontSize: 14,
                fontWeight: 500,
                background: 'var(--black)',
                color: 'var(--white)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              繼續
            </motion.button>
          </>
        )}
      </motion.div>
    </div>
  )
}

// 包裝 Suspense 以處理 useSearchParams
export default function PostLoginPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--gray-50)',
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid var(--gray-200)',
          borderTopColor: 'var(--black)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
      </div>
    }>
      <PostLoginContent />
    </Suspense>
  )
}
