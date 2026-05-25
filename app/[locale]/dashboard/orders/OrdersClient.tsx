'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/app/hooks/useAuth'
import {
  getMyOrders,
  purchaseBuyout,
  type CheckoutCurrency,
  type PrecisionOrderRow,
  type PrecisionTier,
} from '@/app/lib/vps-api'

type Status = PrecisionOrderRow['status']

const TIER_KEY: Record<PrecisionTier, string> = {
  starter_299: 'tier_starter',
  standard_599: 'tier_standard',
  pro_999: 'tier_pro',
}

const STATUS_KEY: Record<Status, string> = {
  pending: 'status_pending',
  paid: 'status_paid',
  in_progress: 'status_in_progress',
  delivered: 'status_delivered',
  refunded: 'status_refunded',
  cancelled: 'status_cancelled',
  failed: 'status_failed',
}

const STATUS_COLOR: Record<Status, string> = {
  pending: 'var(--gray-500)',
  paid: '#0d8a4f',
  in_progress: '#c66a14',
  delivered: 'var(--accent)',
  refunded: '#6b6b6b',
  cancelled: '#6b6b6b',
  failed: '#a52a25',
}

function formatAmount(cents: number, currency: CheckoutCurrency) {
  if (currency === 'twd') {
    return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(cents)
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(cents / 100)
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null
  const ms = new Date(iso).getTime() - Date.now()
  if (Number.isNaN(ms)) return null
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

export default function OrdersClient({ locale }: { locale: string }) {
  const t = useTranslations('orders')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { token, isLoading: authLoading } = useAuth()
  const currency: CheckoutCurrency = locale === 'zh' ? 'twd' : 'usd'

  const [orders, setOrders] = useState<PrecisionOrderRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [buyoutLoadingId, setBuyoutLoadingId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // 載入訂單
  useEffect(() => {
    if (authLoading || !token) return
    getMyOrders({ token })
      .then((res) => {
        if (res.success && res.data) {
          // 防禦：backend 萬一回 shape 不對，至少給 [] 別讓 setOrders(undefined) 後 .length crash
          // 歷史教訓：原本 backend 雙包 {success, data: {success, data: {orders}}} 導致 dashboard 整個炸
          const list = Array.isArray(res.data.orders) ? res.data.orders : []
          setOrders(list)
        } else {
          setOrders([])  // 失敗也設成 [] 而非 null，避免後續判斷踩 undefined
          setError(res.error ?? 'Failed to load orders')
        }
      })
      .catch((err: unknown) => {
        setOrders([])
        setError(err instanceof Error ? err.message : String(err))
      })
  }, [token, authLoading])

  // Toast：buyout success/cancel callback
  useEffect(() => {
    if (searchParams.get('buyout_success') === '1') setToast(t('buyoutSuccessToast'))
    else if (searchParams.get('buyout_cancel') === '1') setToast(t('buyoutCancelToast'))
    if (searchParams.get('buyout_success') || searchParams.get('buyout_cancel')) {
      const timer = setTimeout(() => {
        setToast(null)
        // 清掉 query param 避免 refresh 重複觸發
        router.replace(`/${locale}/dashboard/orders`)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams, router, locale, t])

  const handleBuyout = useCallback(
    async (orderId: string) => {
      if (!token) return
      setBuyoutLoadingId(orderId)
      try {
        const res = await purchaseBuyout({ orderId, currency, locale, token })
        if (!res.success || !res.data) {
          setError(res.error ?? 'Buyout checkout failed')
          setBuyoutLoadingId(null)
          return
        }
        window.location.href = res.data.checkoutUrl
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        setBuyoutLoadingId(null)
      }
    },
    [token, currency, locale]
  )

  const empty = Array.isArray(orders) && orders.length === 0

  return (
    <div style={{ padding: '40px 32px', maxWidth: 1100, margin: '0 auto' }}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 400, letterSpacing: '-0.02em', marginBottom: 8 }}>{t('pageTitle')}</h1>
        <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>{t('pageDescription')}</p>
      </header>

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '12px 16px',
            background: 'var(--accent-muted, rgba(201, 81, 47, 0.12))',
            border: '1px solid var(--accent)',
            color: 'var(--gray-800)',
            fontSize: 13,
            marginBottom: 20,
            borderRadius: 4,
          }}
        >
          {toast}
        </motion.div>
      )}

      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(220, 50, 47, 0.08)',
            border: '1px solid rgba(220, 50, 47, 0.3)',
            color: '#a52a25',
            fontSize: 13,
            marginBottom: 20,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {error}
        </div>
      )}

      {!orders && !error && (
        <div style={{ padding: 32, color: 'var(--gray-500)', fontSize: 14 }}>…</div>
      )}

      {empty && (
        <div
          style={{
            padding: 48,
            textAlign: 'center',
            background: 'var(--white)',
            border: '1px solid var(--gray-200)',
          }}
        >
          <div style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 16 }}>{t('empty')}</div>
          <Link
            href={`/${locale}/pricing`}
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              background: 'var(--accent)',
              color: 'var(--white)',
              fontSize: 13,
              fontWeight: 500,
              textDecoration: 'none',
              borderRadius: 4,
            }}
          >
            {t('exploreCta')}
          </Link>
        </div>
      )}

      {Array.isArray(orders) && orders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              t={t}
              locale={locale}
              buyoutLoading={buyoutLoadingId === order.id}
              onBuyout={() => handleBuyout(order.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// 訂單卡片
// ============================================================

function OrderCard({
  order,
  t,
  locale,
  buyoutLoading,
  onBuyout,
}: {
  order: PrecisionOrderRow
  t: ReturnType<typeof useTranslations<'orders'>>
  locale: string
  buyoutLoading: boolean
  onBuyout: () => void
}) {
  const tierLabel = t(TIER_KEY[order.tier])
  const statusLabel = t(STATUS_KEY[order.status])
  const statusColor = STATUS_COLOR[order.status]
  const iterationPct = useMemo(
    () => (order.iterations_total > 0 ? Math.min(100, (order.iterations_used / order.iterations_total) * 100) : 0),
    [order.iterations_used, order.iterations_total]
  )
  const warrantyDays = daysUntil(order.warranty_until)
  const refundDays = daysUntil(order.refund_deadline)
  const isDelivered = order.status === 'delivered'
  const canBuyout = isDelivered && !order.exported_buyout

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--white)',
        border: '1px solid var(--gray-200)',
        padding: '20px 24px',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 500 }}>{tierLabel}</span>
            <span
              style={{
                fontSize: 11,
                padding: '2px 8px',
                background: 'var(--gray-100)',
                color: statusColor,
                border: `1px solid ${statusColor}`,
                borderRadius: 2,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {statusLabel}
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>
            {t('orderIdLabel')}: <code>{order.id.slice(-8)}</code>
          </div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 400, textAlign: 'right' }}>
          {formatAmount(order.amount_cents, order.currency as CheckoutCurrency)}
        </div>
      </div>

      {/* Iteration 進度條 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--gray-600)', marginBottom: 6 }}>
          <span>{t('iterations')}</span>
          <span>
            {order.iterations_used} / {order.iterations_total}
          </span>
        </div>
        <div style={{ height: 4, background: 'var(--gray-200)', borderRadius: 2, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${iterationPct}%`,
              background: iterationPct >= 100 ? '#a52a25' : 'var(--accent)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Metadata grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, fontSize: 12, marginBottom: 16 }}>
        {warrantyDays !== null && warrantyDays > 0 && (
          <MetaItem label={t('warrantyUntil')} value={`${warrantyDays} d`} />
        )}
        {refundDays !== null && refundDays > 0 && (
          <MetaItem label={t('refundDeadline')} value={`${refundDays} d`} />
        )}
        {order.delivered_at && (
          <MetaItem label={t('deliveredAt')} value={new Date(order.delivered_at).toLocaleDateString(locale === 'zh' ? 'zh-TW' : 'en-US')} />
        )}
        {order.exported_buyout && <MetaItem label={t('exportedBuyout')} value="✓" />}
      </div>

      {/* Linked project + CTAs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, paddingTop: 16, borderTop: '1px solid var(--gray-200)' }}>
        {order.project_name && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 2 }}>{t('linkedProject')}</div>
            <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {order.project_name}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {order.project_vercel_url && (
            <a
              href={order.project_vercel_url}
              target="_blank"
              rel="noopener noreferrer"
              style={btnSecondaryStyle}
            >
              {t('cta_visit_url')}
            </a>
          )}
          {order.project_id && (
            <Link href={`/${locale}/dashboard/projects/${order.project_id}`} style={btnSecondaryStyle}>
              {t('cta_view_project')}
            </Link>
          )}
          {canBuyout && (
            <button type="button" onClick={onBuyout} disabled={buyoutLoading} style={btnPrimaryStyle}>
              {buyoutLoading ? t('buyoutLoading') : t('cta_buyout')}
            </button>
          )}
          {order.exported_buyout && (
            <span style={{ ...btnSecondaryStyle, cursor: 'default', color: 'var(--accent)' }}>
              {t('cta_buyout_done')}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ color: 'var(--gray-500)', marginBottom: 2 }}>{label}</div>
      <div style={{ color: 'var(--gray-800)', fontWeight: 500 }}>{value}</div>
    </div>
  )
}

const btnSecondaryStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '8px 14px',
  fontSize: 12,
  color: 'var(--gray-700)',
  textDecoration: 'none',
  border: '1px solid var(--gray-300)',
  background: 'var(--white)',
  borderRadius: 4,
}

const btnPrimaryStyle: React.CSSProperties = {
  padding: '8px 14px',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--white)',
  background: 'var(--accent)',
  border: 'none',
  cursor: 'pointer',
  borderRadius: 4,
}
