'use client'

/**
 * 付款完 onboarding modal (Sprint 1 — Plan 第 2 件 critical)
 *
 * 觸發：HomeClient detect URL ?orderId=xxx → 顯示一次性 modal
 * 目的：客戶刷完卡看到聊天框會迷茫 — 用這個 overlay 明確告訴他：
 *   ✓ 付款成功
 *   ✓ 訂單編號
 *   ✓ 工程師 24h 內聯絡
 *   現在做什麼：開始描述需求 + 範例 prompt
 *
 * 設計：
 * - 用 sessionStorage 記住「已看過」key=`onboarded:${orderId}`，避免每次刷新都跳
 * - 點任一按鈕 dismiss
 * - 不擋住 chat 介面 — overlay 半透明 + 中央卡片
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

interface Props {
  orderId: string
  onDismiss?: () => void
}

const SS_KEY_PREFIX = 'tellcraft.onboarded.'

function alreadyShown(orderId: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    return sessionStorage.getItem(SS_KEY_PREFIX + orderId) === '1'
  } catch {
    return false
  }
}

function markShown(orderId: string) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(SS_KEY_PREFIX + orderId, '1')
  } catch {}
}

export default function OnboardingOverlay({ orderId, onDismiss }: Props) {
  const t = useTranslations('paymentOnboarding')
  const locale = useLocale()
  const [open, setOpen] = useState(false)

  // 進場：sessionStorage 沒記就顯示
  useEffect(() => {
    if (!orderId) return
    if (alreadyShown(orderId)) {
      onDismiss?.()
      return
    }
    setOpen(true)
  }, [orderId, onDismiss])

  const handleDismiss = () => {
    markShown(orderId)
    setOpen(false)
    onDismiss?.()
  }

  if (!orderId) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          // 全屏半透明 backdrop
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={handleDismiss}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <motion.div
            // 中央卡片
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 560,
              width: '100%',
              background: 'var(--white)',
              border: '1px solid var(--gray-200)',
              borderRadius: 8,
              padding: '40px 36px',
              color: 'var(--gray-800)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
              position: 'relative',
            }}
          >
            {/* 右上關閉按鈕 */}
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                width: 32,
                height: 32,
                border: 'none',
                background: 'transparent',
                color: 'var(--gray-500)',
                fontSize: 20,
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >
              ×
            </button>

            {/* Title */}
            <h2 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 8, lineHeight: 1.3 }}>
              {t('title')}
            </h2>

            {/* Order ID */}
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 28 }}>
              {t('orderIdLabel')}: <code style={{ fontSize: 12, background: 'var(--gray-100)', padding: '1px 6px', borderRadius: 3 }}>{orderId.slice(-12)}</code>
            </div>

            {/* 3 個確認 step */}
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li style={{ fontSize: 14, color: 'var(--gray-700)' }}>{t('step1')}</li>
              <li style={{ fontSize: 14, color: 'var(--gray-700)' }}>{t('step2')}</li>
              <li style={{ fontSize: 14, color: 'var(--gray-700)' }}>{t('step3')}</li>
            </ul>

            {/* Step 4: 範例 prompt */}
            <div style={{ padding: '16px 18px', background: 'var(--gray-50)', borderLeft: '3px solid var(--accent)', marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)', marginBottom: 8 }}>
                {t('step4Title')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--gray-600)', lineHeight: 1.6, fontStyle: 'italic' }}>
                {t('promptHint')}
              </div>
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              <button
                type="button"
                onClick={handleDismiss}
                style={{
                  flex: 1,
                  minWidth: 180,
                  padding: '12px 18px',
                  background: 'var(--accent)',
                  color: 'var(--white)',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  borderRadius: 4,
                }}
              >
                {t('startCta')}
              </button>
              <Link
                href={`/${locale}/dashboard/orders`}
                onClick={handleDismiss}
                style={{
                  flex: 1,
                  minWidth: 180,
                  textAlign: 'center',
                  padding: '12px 18px',
                  background: 'var(--white)',
                  color: 'var(--gray-700)',
                  border: '1px solid var(--gray-300)',
                  fontSize: 14,
                  textDecoration: 'none',
                  borderRadius: 4,
                }}
              >
                {t('viewOrdersCta')}
              </Link>
            </div>

            {/* support note */}
            <div style={{ fontSize: 11, color: 'var(--gray-500)', textAlign: 'center', lineHeight: 1.5 }}>
              {t('supportNote')}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
