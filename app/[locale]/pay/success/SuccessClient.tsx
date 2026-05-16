'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/app/hooks/useAuth'
import { getCheckoutStatus } from '@/app/lib/vps-api'

type Phase = 'polling' | 'paid' | 'failed' | 'missing'

const POLL_INTERVAL_MS = 1500
const POLL_TIMEOUT_MS = 30_000

export default function SuccessClient({ locale }: { locale: string }) {
  const isZh = locale === 'zh'
  const router = useRouter()
  const searchParams = useSearchParams()
  const { token, isLoading: authLoading } = useAuth()
  const sessionId = searchParams.get('session_id')

  const [phase, setPhase] = useState<Phase>(sessionId ? 'polling' : 'missing')
  const [orderId, setOrderId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [pollCount, setPollCount] = useState(0)
  const startedAtRef = useRef<number>(Date.now())

  useEffect(() => {
    if (!sessionId || authLoading || !token) return

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | null = null

    const tick = async () => {
      if (cancelled) return

      try {
        const res = await getCheckoutStatus({ sessionId, token })
        if (cancelled) return

        if (!res.success || !res.data) {
          setErrorMsg(res.error ?? (isZh ? '查詢失敗' : 'Status query failed'))
          setPhase('failed')
          return
        }

        const { status, orderId: oid } = res.data
        if (oid) setOrderId(oid)
        setPollCount((c) => c + 1)

        if (status === 'paid' || status === 'in_progress' || status === 'delivered') {
          setPhase('paid')
          // 1.5s 給用戶看到成功動畫再跳
          setTimeout(() => {
            if (cancelled) return
            const localePrefix = locale === 'en' ? '' : `/${locale}`
            router.push(`${localePrefix}/?orderId=${oid ?? ''}`)
          }, 1500)
          return
        }

        if (status === 'failed' || status === 'refunded' || status === 'cancelled') {
          setPhase('failed')
          setErrorMsg(isZh ? `訂單狀態：${status}` : `Order status: ${status}`)
          return
        }

        // status === 'pending' → 繼續 polling
        const elapsed = Date.now() - startedAtRef.current
        if (elapsed >= POLL_TIMEOUT_MS) {
          setPhase('failed')
          setErrorMsg(
            isZh
              ? '付款確認逾時（30 秒）。如已扣款請聯絡客服，附上訂單編號。'
              : 'Payment confirmation timed out (30s). If you were charged, please contact support with this order ID.'
          )
          return
        }

        timer = setTimeout(tick, POLL_INTERVAL_MS)
      } catch (err) {
        if (cancelled) return
        setErrorMsg(err instanceof Error ? err.message : String(err))
        setPhase('failed')
      }
    }

    tick()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [sessionId, token, authLoading, locale, router, isZh])

  if (phase === 'missing') {
    return (
      <CenteredCard>
        <CardTitle>{isZh ? '缺少 session_id' : 'Missing session_id'}</CardTitle>
        <CardSub>
          {isZh ? '這個頁面需要從付款流程跳轉進來。' : 'This page should be reached from a checkout redirect.'}
        </CardSub>
        <Link href={`/${locale}/pricing`} style={linkStyle}>
          {isZh ? '回方案頁' : 'Back to pricing'}
        </Link>
      </CenteredCard>
    )
  }

  if (phase === 'failed') {
    return (
      <CenteredCard>
        <CardTitle accent="#a52a25">{isZh ? '付款確認失敗' : 'Payment confirmation failed'}</CardTitle>
        {errorMsg && (
          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(220, 50, 47, 0.08)',
              border: '1px solid rgba(220, 50, 47, 0.3)',
              color: '#a52a25',
              fontSize: 13,
              marginTop: 16,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {errorMsg}
          </div>
        )}
        {orderId && (
          <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 12 }}>
            {isZh ? '訂單編號：' : 'Order ID: '}
            <code>{orderId}</code>
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <Link href={`/${locale}/pricing`} style={linkStyle}>
            {isZh ? '回方案頁' : 'Back to pricing'}
          </Link>
          <a href="mailto:support@tellcraft.com" style={{ ...linkStyle, background: 'var(--accent)', color: 'var(--white)' }}>
            {isZh ? '聯絡客服' : 'Contact support'}
          </a>
        </div>
      </CenteredCard>
    )
  }

  if (phase === 'paid') {
    return (
      <CenteredCard>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'var(--accent)',
            color: 'var(--white)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            margin: '0 auto 24px',
          }}
        >
          ✓
        </motion.div>
        <CardTitle>{isZh ? '付款成功' : 'Payment successful'}</CardTitle>
        <CardSub>
          {isZh ? '正在準備你的 AI 工作區，馬上跳轉…' : 'Preparing your AI workspace, redirecting…'}
        </CardSub>
      </CenteredCard>
    )
  }

  // phase === 'polling'
  return (
    <CenteredCard>
      <PollingSpinner />
      <CardTitle>{isZh ? '確認付款中…' : 'Confirming payment…'}</CardTitle>
      <CardSub>
        {isZh
          ? '已扣款後 Stripe 約 1-3 秒會通知我們，請稍候不要關閉頁面。'
          : 'Stripe usually confirms in 1-3 seconds. Please keep this page open.'}
      </CardSub>
      <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 16 }}>
        {isZh ? `已嘗試 ${pollCount} 次` : `Polled ${pollCount} times`}
      </div>
    </CenteredCard>
  )
}

// ============================================================
// 小元件
// ============================================================

function CenteredCard({ children }: { children: React.ReactNode }) {
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
          maxWidth: 460,
          width: '100%',
          padding: '48px 40px',
          background: 'var(--gray-50)',
          border: '1px solid var(--gray-200)',
          textAlign: 'center',
        }}
      >
        {children}
      </motion.div>
    </main>
  )
}

function CardTitle({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <h1
      style={{
        fontSize: 24,
        fontWeight: 400,
        letterSpacing: '-0.02em',
        marginBottom: 12,
        color: accent ?? 'var(--gray-800)',
      }}
    >
      {children}
    </h1>
  )
}

function CardSub({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 14, color: 'var(--gray-500)', lineHeight: 1.6 }}>{children}</p>
}

function PollingSpinner() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
      style={{
        width: 32,
        height: 32,
        border: '2px solid var(--gray-200)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        margin: '0 auto 24px',
      }}
    />
  )
}

const linkStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '10px 18px',
  fontSize: 13,
  textDecoration: 'none',
  color: 'var(--gray-800)',
  border: '1px solid var(--gray-300)',
  background: 'var(--white)',
}
