'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

interface LoginPromptProps {
  variant: 'subtle' | 'emphasized'
  message: string
  subMessage?: string
  onLogin: () => void
  onDismiss: () => void
  autoHideAfter?: number // 毫秒，0 表示不自動隱藏
}

const PROMPT_DISMISS_KEY = 'tellcraft_login_prompt_dismissed'
const DISMISS_DURATION = 24 * 60 * 60 * 1000 // 24 小時

/**
 * 檢查是否應該顯示登入提示
 */
export function shouldShowLoginPrompt(promptId: string): boolean {
  if (typeof window === 'undefined') return true

  const dismissedData = localStorage.getItem(PROMPT_DISMISS_KEY)
  if (!dismissedData) return true

  try {
    const dismissed = JSON.parse(dismissedData) as Record<string, number>
    const dismissedAt = dismissed[promptId]
    if (!dismissedAt) return true

    // 檢查是否已過 24 小時
    return Date.now() - dismissedAt > DISMISS_DURATION
  } catch {
    return true
  }
}

/**
 * 記錄用戶拒絕了提示
 */
export function dismissLoginPrompt(promptId: string): void {
  if (typeof window === 'undefined') return

  const dismissedData = localStorage.getItem(PROMPT_DISMISS_KEY)
  let dismissed: Record<string, number> = {}

  try {
    if (dismissedData) {
      dismissed = JSON.parse(dismissedData)
    }
  } catch {
    // ignore
  }

  dismissed[promptId] = Date.now()
  localStorage.setItem(PROMPT_DISMISS_KEY, JSON.stringify(dismissed))
}

export default function LoginPrompt({
  variant,
  message,
  subMessage,
  onLogin,
  onDismiss,
  autoHideAfter = 0,
}: LoginPromptProps) {
  const t = useTranslations('login')
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (autoHideAfter > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onDismiss()
      }, autoHideAfter)
      return () => clearTimeout(timer)
    }
  }, [autoHideAfter, onDismiss])

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss()
  }

  const handleLogin = () => {
    onLogin()
  }

  if (variant === 'subtle') {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            style={{
              background: 'linear-gradient(90deg, var(--gray-50) 0%, var(--white) 100%)',
              borderBottom: '1px solid var(--border-color)',
              padding: '10px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
            }}
          >
            <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>
              {message}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogin}
                style={{
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 500,
                  background: 'var(--black)',
                  color: 'var(--white)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {t('loginButton')}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDismiss}
                style={{
                  padding: '6px 10px',
                  fontSize: 12,
                  background: 'transparent',
                  color: 'var(--gray-400)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {t('laterButton')}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  // emphasized 版本
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: 24,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            style={{
              background: 'var(--white)',
              maxWidth: 400,
              width: '100%',
              padding: 32,
              textAlign: 'center',
              position: 'relative',
            }}
          >
            {/* Close button */}
            <button
              onClick={handleDismiss}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                fontSize: 20,
                color: 'var(--gray-400)',
                cursor: 'pointer',
                padding: 4,
                lineHeight: 1,
              }}
            >
              &times;
            </button>

            {/* Success indicator */}
            <div style={{
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
            }}>
              <span style={{ color: 'var(--black)' }}>&#10003;</span>
            </div>

            <h3 style={{
              fontSize: 20,
              fontWeight: 500,
              marginBottom: 12,
              letterSpacing: '-0.02em',
            }}>
              {message}
            </h3>

            {subMessage && (
              <p style={{
                fontSize: 14,
                color: 'var(--gray-500)',
                lineHeight: 1.6,
                marginBottom: 28,
              }}>
                {subMessage}
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogin}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  fontSize: 15,
                  fontWeight: 500,
                  background: 'var(--black)',
                  color: 'var(--white)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {t('saveProgressButton')}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleDismiss}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  fontSize: 14,
                  background: 'transparent',
                  color: 'var(--gray-500)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                }}
              >
                {t('laterFull')}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
