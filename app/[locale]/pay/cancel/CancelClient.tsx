'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/app/hooks/useAuth'
import { cancelCheckout } from '@/app/lib/vps-api'

type ReasonId = 'price' | 'thinking' | 'feature_unclear' | 'tech_concern' | 'other'

const REASONS: { id: ReasonId; label: { zh: string; en: string } }[] = [
  { id: 'price', label: { zh: '價格超出預算', en: 'Price too high' } },
  { id: 'thinking', label: { zh: '想再考慮一下', en: 'Want more time to decide' } },
  { id: 'feature_unclear', label: { zh: '不確定功能符不符合需求', en: 'Unsure if features fit my needs' } },
  { id: 'tech_concern', label: { zh: '擔心代碼品質 / 託管細節', en: 'Concerns about code or hosting' } },
  { id: 'other', label: { zh: '其他原因', en: 'Other' } },
]

export default function CancelClient({ locale }: { locale: string }) {
  const isZh = locale === 'zh'
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const { token } = useAuth()

  const [reason, setReason] = useState<ReasonId | null>(null)
  const [otherText, setOtherText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!reason) return
    if (!sessionId || !token) {
      setSubmitted(true)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const finalReason = reason === 'other' && otherText.trim() ? otherText.slice(0, 64) : reason
      const res = await cancelCheckout({ sessionId, reason: finalReason, token })
      if (!res.success) {
        setError(res.error ?? (isZh ? '提交失敗' : 'Submit failed'))
        setSubmitting(false)
        return
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSubmitting(false)
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--white)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          maxWidth: 520,
          width: '100%',
          padding: '48px 40px',
          background: 'var(--gray-50)',
          border: '1px solid var(--gray-200)',
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 400,
            letterSpacing: '-0.02em',
            marginBottom: 12,
            textAlign: 'center',
          }}
        >
          {submitted
            ? isZh ? '謝謝你的回饋' : 'Thanks for the feedback'
            : isZh ? '你取消了付款' : 'Payment cancelled'}
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'var(--gray-500)',
            lineHeight: 1.6,
            marginBottom: 32,
            textAlign: 'center',
          }}
        >
          {submitted
            ? isZh ? '我們會用你的回饋改善方案設計。' : 'Your feedback helps us improve our offering.'
            : isZh
              ? '可以告訴我們為什麼嗎？這個資訊只用來改善定價與功能。'
              : 'Mind telling us why? This only helps us improve our pricing and features.'}
        </p>

        {!submitted && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {REASONS.map((r) => (
                <label
                  key={r.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    border: reason === r.id ? '2px solid var(--accent)' : '1px solid var(--gray-200)',
                    cursor: 'pointer',
                    background: 'var(--white)',
                    fontSize: 14,
                    transition: 'border-color 0.15s',
                  }}
                >
                  <input
                    type="radio"
                    name="reason"
                    checked={reason === r.id}
                    onChange={() => setReason(r.id)}
                  />
                  <span>{isZh ? r.label.zh : r.label.en}</span>
                </label>
              ))}
            </div>

            {reason === 'other' && (
              <textarea
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                placeholder={isZh ? '告訴我們具體原因（選填，最多 64 字元）' : 'Tell us more (optional, max 64 chars)'}
                maxLength={64}
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--gray-300)',
                  background: 'var(--white)',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  marginBottom: 16,
                  boxSizing: 'border-box',
                }}
              />
            )}

            {error && (
              <div
                style={{
                  padding: '10px 12px',
                  background: 'rgba(220, 50, 47, 0.08)',
                  border: '1px solid rgba(220, 50, 47, 0.3)',
                  color: '#a52a25',
                  fontSize: 12,
                  marginBottom: 16,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!reason || submitting}
              style={{
                width: '100%',
                padding: '14px 20px',
                background: !reason ? 'var(--gray-300)' : 'var(--accent)',
                color: 'var(--white)',
                border: 'none',
                fontSize: 14,
                fontWeight: 500,
                cursor: !reason || submitting ? 'not-allowed' : 'pointer',
                marginBottom: 12,
              }}
            >
              {submitting
                ? isZh ? '提交中…' : 'Submitting…'
                : isZh ? '送出並回方案頁' : 'Submit & back to pricing'}
            </button>
          </>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: submitted ? 24 : 0 }}>
          <Link
            href={`/${locale}/pricing`}
            style={{
              fontSize: 13,
              color: 'var(--gray-600)',
              textDecoration: 'underline',
              textUnderlineOffset: 4,
            }}
          >
            {isZh ? '回方案頁' : 'Back to pricing'}
          </Link>
          <span style={{ color: 'var(--gray-300)' }}>·</span>
          <Link
            href={`/${locale}`}
            style={{
              fontSize: 13,
              color: 'var(--gray-600)',
              textDecoration: 'underline',
              textUnderlineOffset: 4,
            }}
          >
            {isZh ? '回首頁' : 'Home'}
          </Link>
        </div>
      </motion.div>
    </main>
  )
}
