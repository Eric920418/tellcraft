'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/app/hooks/useAuth'
import {
  adminGetOrders,
  adminAcknowledgeOrder,
  type AdminOrderRow,
  type CheckoutCurrency,
} from '@/app/lib/vps-api'

const STATUS_LIST = ['pending', 'paid', 'in_progress', 'delivered', 'refunded', 'cancelled', 'failed'] as const
type StatusFilter = '' | (typeof STATUS_LIST)[number]

function fmt(cents: number, currency: string) {
  if (currency === 'twd') return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(cents)
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(cents / 100)
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / (1000 * 60 * 60))
  if (h < 1) return `${Math.floor(diff / (1000 * 60))}m ago`
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function AdminOrdersClient({ locale }: { locale: string }) {
  const t = useTranslations('adminOrders')
  const { token, isLoading: authLoading } = useAuth()

  const [orders, setOrders] = useState<AdminOrderRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [unackOnly, setUnackOnly] = useState(false)
  const [ackingId, setAckingId] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    if (!token) return
    setError(null)
    const res = await adminGetOrders({
      token,
      statusFilter: statusFilter || undefined,
      unacknowledgedOnly: unackOnly,
    })
    if (res.success && res.data) {
      setOrders(Array.isArray(res.data.orders) ? res.data.orders : [])
    } else {
      setError(res.error ?? 'Failed to load')
      setOrders([])
    }
  }, [token, statusFilter, unackOnly])

  useEffect(() => {
    if (authLoading) return
    fetchOrders()
  }, [authLoading, fetchOrders])

  const handleAcknowledge = useCallback(
    async (orderId: string) => {
      if (!token) return
      setAckingId(orderId)
      try {
        const res = await adminAcknowledgeOrder({ orderId, token })
        if (!res.success || !res.data) {
          setError(res.error ?? 'Acknowledge failed')
          return
        }
        // Refresh list locally — flip engineer_contacted_at
        setOrders((prev) =>
          prev?.map((o) =>
            o.id === orderId
              ? { ...o, engineer_contacted_at: res.data!.engineer_contacted_at }
              : o
          ) ?? null
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setAckingId(null)
      }
    },
    [token]
  )

  const counts = useMemo(() => {
    if (!orders) return { total: 0, unack: 0, delivered: 0 }
    return {
      total: orders.length,
      unack: orders.filter((o) => (o.status === 'paid' || o.status === 'in_progress') && !o.engineer_contacted_at).length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
    }
  }, [orders])

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1400, margin: '0 auto' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 400, letterSpacing: '-0.02em', marginBottom: 6 }}>{t('pageTitle')}</h1>
        <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>{t('pageDescription')}</p>
      </header>

      {/* Stats + filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 20, fontSize: 13 }}>
        <span>
          {t('total')}: <strong>{counts.total}</strong>
        </span>
        <span style={{ color: counts.unack > 0 ? '#a52a25' : 'var(--gray-500)' }}>
          {t('unacknowledged')}: <strong>{counts.unack}</strong>
        </span>
        <span style={{ color: 'var(--gray-500)' }}>
          {t('delivered')}: <strong>{counts.delivered}</strong>
        </span>

        <div style={{ flex: 1 }} />

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input type="checkbox" checked={unackOnly} onChange={(e) => setUnackOnly(e.target.checked)} />
          {t('filterUnackOnly')}
        </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          style={{ padding: '6px 10px', border: '1px solid var(--gray-300)', background: 'var(--white)', fontSize: 13 }}
        >
          <option value="">{t('filterAllStatus')}</option>
          {STATUS_LIST.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={fetchOrders}
          style={{ padding: '6px 14px', fontSize: 12, border: '1px solid var(--gray-300)', background: 'var(--white)', cursor: 'pointer' }}
        >
          {t('refresh')}
        </button>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: 'rgba(220, 50, 47, 0.08)', border: '1px solid rgba(220, 50, 47, 0.3)', color: '#a52a25', fontSize: 12, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {!orders && !error && <div style={{ padding: 32, color: 'var(--gray-500)', fontSize: 13 }}>…</div>}
      {orders && orders.length === 0 && <div style={{ padding: 48, textAlign: 'center', color: 'var(--gray-500)', background: 'var(--white)', border: '1px solid var(--gray-200)', fontSize: 13 }}>{t('empty')}</div>}

      {orders && orders.length > 0 && (
        <div style={{ overflow: 'auto', border: '1px solid var(--gray-200)', background: 'var(--white)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', textAlign: 'left' }}>
                <Th>{t('colCreated')}</Th>
                <Th>{t('colStatus')}</Th>
                <Th>{t('colTier')}</Th>
                <Th>{t('colAmount')}</Th>
                <Th>{t('colCustomer')}</Th>
                <Th>{t('colProject')}</Th>
                <Th>{t('colIterations')}</Th>
                <Th>{t('colEngineer')}</Th>
                <Th>{t('colAction')}</Th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const needsAck = (o.status === 'paid' || o.status === 'in_progress') && !o.engineer_contacted_at
                return (
                  <motion.tr
                    key={o.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      borderTop: '1px solid var(--gray-200)',
                      background: needsAck ? 'rgba(220, 50, 47, 0.04)' : 'transparent',
                    }}
                  >
                    <Td>
                      <div title={o.created_at}>{timeAgo(o.created_at)}</div>
                      <div style={{ fontSize: 10, color: 'var(--gray-500)' }}>
                        <code>{o.id.slice(-8)}</code>
                      </div>
                    </Td>
                    <Td>
                      <StatusBadge status={o.status} />
                    </Td>
                    <Td>{o.tier.replace('_', ' ')}</Td>
                    <Td>{fmt(o.amount_cents, o.currency as CheckoutCurrency)}</Td>
                    <Td>
                      <div>{o.user_name || '—'}</div>
                      {o.user_email && (
                        <a href={`mailto:${o.user_email}?subject=【Tellcraft】訂單 ${o.id.slice(-8)} — 工程師接案`}
                           style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'underline' }}>
                          {o.user_email}
                        </a>
                      )}
                    </Td>
                    <Td>
                      {o.project_name ? (
                        <div>
                          <div>{o.project_name}</div>
                          {o.project_vercel_url && (
                            <a href={o.project_vercel_url} target="_blank" rel="noopener" style={{ fontSize: 10, color: 'var(--gray-500)' }}>
                              {t('visitSite')} ↗
                            </a>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--gray-400)' }}>—</span>
                      )}
                    </Td>
                    <Td>
                      {o.iterations_used} / {o.iterations_total}
                    </Td>
                    <Td>
                      {o.engineer_contacted_at ? (
                        <span style={{ color: '#0d8a4f', fontSize: 11 }}>
                          ✓ {timeAgo(o.engineer_contacted_at)}
                        </span>
                      ) : needsAck ? (
                        <span style={{ color: '#a52a25', fontSize: 11, fontWeight: 600 }}>{t('needsAck')}</span>
                      ) : (
                        <span style={{ color: 'var(--gray-400)' }}>—</span>
                      )}
                    </Td>
                    <Td>
                      {needsAck && (
                        <button
                          type="button"
                          onClick={() => handleAcknowledge(o.id)}
                          disabled={ackingId === o.id}
                          style={{
                            padding: '4px 10px',
                            fontSize: 11,
                            fontWeight: 500,
                            color: 'var(--white)',
                            background: 'var(--accent)',
                            border: 'none',
                            cursor: ackingId === o.id ? 'wait' : 'pointer',
                            borderRadius: 3,
                          }}
                        >
                          {ackingId === o.id ? '…' : t('ackButton')}
                        </button>
                      )}
                    </Td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ============================================================
// 小元件
// ============================================================

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{ padding: '8px 10px', fontWeight: 500, color: 'var(--gray-600)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {children}
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '10px', verticalAlign: 'top' }}>{children}</td>
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'var(--gray-500)',
  paid: '#c66a14',
  in_progress: '#c66a14',
  delivered: '#0d8a4f',
  refunded: '#6b6b6b',
  cancelled: '#6b6b6b',
  failed: '#a52a25',
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLOR[status] || 'var(--gray-500)'
  return (
    <span style={{ display: 'inline-block', padding: '1px 6px', fontSize: 10, color, border: `1px solid ${color}`, borderRadius: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {status}
    </span>
  )
}
