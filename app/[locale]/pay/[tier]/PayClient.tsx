'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useAuth } from '@/app/hooks/useAuth'
import {
  createCheckoutSession,
  getCheckoutCatalog,
  type CheckoutAddonType,
  type CheckoutCatalog,
  type CheckoutCurrency,
  type PrecisionTier,
} from '@/app/lib/vps-api'

const TIER_META: Record<PrecisionTier, { name: { zh: string; en: string }; pages: { zh: string; en: string } }> = {
  starter_299: { name: { zh: '入門', en: 'Starter' }, pages: { zh: 'Landing 單頁', en: 'Single landing page' } },
  standard_599: { name: { zh: '標準', en: 'Standard' }, pages: { zh: '3-5 頁中型網站', en: '3-5 page site' } },
  pro_999: { name: { zh: '專業', en: 'Pro' }, pages: { zh: '後台 + DB 的 SaaS', en: 'SaaS with admin + DB' } },
}

const ADDON_LABELS: Record<CheckoutAddonType, { zh: string; en: string; hint?: { zh: string; en: string } }> = {
  hosting: {
    zh: '託管月費',
    en: 'Hosting',
    hint: { zh: 'hosting + 域名 + uptime 監控（首月免費）', en: 'hosting + domain + uptime (first month free)' },
  },
  maintenance: {
    zh: '維護訂閱',
    en: 'Maintenance',
    hint: { zh: '無限迭代 + bugfix 包', en: 'Unlimited iterations + bugfix' },
  },
  module_blog: { zh: '部落格 / CMS 模塊', en: 'Blog / CMS module' },
  module_auth: { zh: '會員系統 / Auth 模塊', en: 'Member / Auth module' },
  module_ecommerce: { zh: '電商 + Stripe 付款模塊', en: 'E-commerce + Stripe module' },
  module_forms: { zh: '表單 / Newsletter 模塊', en: 'Forms / Newsletter module' },
}

export default function PayClient({ locale, tier }: { locale: string; tier: PrecisionTier }) {
  const isZh = locale === 'zh'
  const currency: CheckoutCurrency = isZh ? 'twd' : 'usd'
  const { token, isAuthenticated, isLoading: authLoading } = useAuth()

  const [catalog, setCatalog] = useState<CheckoutCatalog | null>(null)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [selectedAddons, setSelectedAddons] = useState<Set<CheckoutAddonType>>(new Set(['hosting']))
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // 載入 catalog（取得 backend 真實價格，避免前後端不同步）
  useEffect(() => {
    getCheckoutCatalog({ currency, locale })
      .then((res) => {
        if (res.success && res.data) {
          setCatalog(res.data)
        } else {
          setCatalogError(res.error ?? (isZh ? '無法載入價格資料' : 'Failed to load pricing'))
        }
      })
      .catch((err: unknown) => {
        setCatalogError(err instanceof Error ? err.message : String(err))
      })
  }, [isZh, currency, locale])

  const tierInfo = catalog?.tiers.find((t) => t.tier === tier) ?? null

  // 即時計算總額（含加購 — recurring 不計入一次性付款，標示月費另記）
  const { oneTimeCents, recurringCents } = useMemo(() => {
    if (!catalog || !tierInfo) return { oneTimeCents: 0, recurringCents: 0 }
    let oneTime = tierInfo.basePriceCents
    let recurring = 0
    for (const type of selectedAddons) {
      const addon = catalog.addons.find((a) => a.type === type)
      if (!addon) continue
      if (addon.recurring === 'month') recurring += addon.priceCents
      else oneTime += addon.priceCents
    }
    return { oneTimeCents: oneTime, recurringCents: recurring }
  }, [catalog, tierInfo, selectedAddons])

  const toggleAddon = (type: CheckoutAddonType) => {
    setSelectedAddons((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  const handleCheckout = async () => {
    if (!token) {
      setSubmitError(isZh ? '請先登入再購買' : 'Please sign in first')
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await createCheckoutSession({
        tier,
        addons: Array.from(selectedAddons).map((type) => ({ type })),
        locale,
        currency,
        token,
      })
      if (!res.success || !res.data) {
        setSubmitError(res.error ?? (isZh ? 'Checkout 建立失敗' : 'Checkout creation failed'))
        setSubmitting(false)
        return
      }
      // 跳轉到 Stripe（或 mock success）
      window.location.href = res.data.checkoutUrl
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err))
      setSubmitting(false)
    }
  }

  // 格式化金額：USD 是 two-decimal（cents/100），TWD 是 zero-decimal（直接用 dollars）
  const fmt = (amount: number) => {
    if (currency === 'twd') {
      return new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: 'TWD',
        minimumFractionDigits: 0,
      }).format(amount)
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount / 100)
  }

  const tierMeta = TIER_META[tier]

  // 加購分組
  const recurringAddons = catalog?.addons.filter((a) => a.recurring === 'month') ?? []
  const moduleAddons = catalog?.addons.filter((a) => !a.recurring) ?? []

  return (
    <main style={{ minHeight: '100vh', background: 'var(--white)', color: 'var(--gray-800)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px 80px' }}>
        {/* 返回連結 */}
        <Link
          href={`/${locale}/pricing`}
          style={{
            display: 'inline-block',
            fontSize: 13,
            color: 'var(--gray-500)',
            textDecoration: 'none',
            marginBottom: 24,
          }}
        >
          ← {isZh ? '返回方案選擇' : 'Back to pricing'}
        </Link>

        <h1
          style={{
            fontSize: 'clamp(28px, 4vw, 36px)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            marginBottom: 8,
          }}
        >
          {isZh ? '確認購買' : 'Review your order'}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 48 }}>
          {isZh ? '勾選加購、確認金額，然後前往 Stripe 安全付款。' : 'Pick add-ons, confirm the amount, then proceed to Stripe.'}
        </p>

        {catalogError && (
          <div
            style={{
              padding: '16px 20px',
              background: 'rgba(220, 50, 47, 0.08)',
              border: '1px solid rgba(220, 50, 47, 0.3)',
              color: '#a52a25',
              fontSize: 14,
              marginBottom: 32,
            }}
          >
            {isZh ? '錯誤：' : 'Error: '}
            {catalogError}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 380px)',
            gap: 48,
            alignItems: 'start',
          }}
        >
          {/* ── 左欄：訂單摘要 + 加購 ── */}
          <div>
            {/* 主商品卡 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                padding: '24px 28px',
                background: 'var(--gray-50)',
                border: '1px solid var(--gray-200)',
                marginBottom: 32,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <div style={{ fontSize: 18, fontWeight: 500 }}>
                  {isZh ? tierMeta.name.zh : tierMeta.name.en}
                </div>
                <div style={{ fontSize: 20, fontWeight: 400 }}>
                  {tierInfo ? fmt(tierInfo.basePriceCents) : '—'}
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 8 }}>
                {isZh ? tierMeta.pages.zh : tierMeta.pages.en}
              </div>
              {tierInfo && (
                <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                  {tierInfo.iterationsTotal} {isZh ? '次迭代' : 'iterations'}
                </div>
              )}

              {/* 人工協助 trust line — 只給 standard/pro (NT$6,000+) */}
              {(tier === 'standard_599' || tier === 'pro_999') && (
                <div
                  style={{
                    marginTop: 14,
                    padding: '8px 12px',
                    background: 'var(--accent-muted, rgba(201, 81, 47, 0.08))',
                    borderLeft: '3px solid var(--accent)',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--gray-800)',
                    lineHeight: 1.4,
                  }}
                >
                  {isZh ? '真人工程師 24 小時協助開發完工' : 'Real engineer 24/7 assistance until launch'}
                </div>
              )}
            </motion.div>

            {/* 加購：續費類 */}
            {recurringAddons.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <h3
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--gray-500)',
                    marginBottom: 16,
                  }}
                >
                  {isZh ? '訂閱加購（月費）' : 'Subscription add-ons'}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {recurringAddons.map((addon) => {
                    const checked = selectedAddons.has(addon.type)
                    const meta = ADDON_LABELS[addon.type]
                    return (
                      <label
                        key={addon.type}
                        style={{
                          display: 'flex',
                          gap: 14,
                          padding: '16px 20px',
                          border: checked ? '2px solid var(--accent)' : '1px solid var(--gray-200)',
                          cursor: 'pointer',
                          background: 'var(--white)',
                          transition: 'border-color 0.15s',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAddon(addon.type)}
                          style={{ marginTop: 3 }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ fontSize: 14, fontWeight: 500 }}>{isZh ? meta.zh : meta.en}</span>
                            <span style={{ fontSize: 14, color: 'var(--gray-700)' }}>
                              {fmt(addon.priceCents)}
                              <span style={{ fontSize: 11, color: 'var(--gray-500)' }}>{isZh ? ' /月' : '/mo'}</span>
                            </span>
                          </div>
                          {meta.hint && (
                            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 4 }}>
                              {isZh ? meta.hint.zh : meta.hint.en}
                            </div>
                          )}
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 加購：模塊 */}
            {moduleAddons.length > 0 && (
              <div>
                <h3
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--gray-500)',
                    marginBottom: 16,
                  }}
                >
                  {isZh ? '功能模塊加購（一次性）' : 'Feature modules (one-time)'}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {moduleAddons.map((addon) => {
                    const checked = selectedAddons.has(addon.type)
                    const meta = ADDON_LABELS[addon.type]
                    return (
                      <label
                        key={addon.type}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          padding: '14px 20px',
                          border: checked ? '2px solid var(--accent)' : '1px solid var(--gray-200)',
                          cursor: 'pointer',
                          background: 'var(--white)',
                          transition: 'border-color 0.15s',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAddon(addon.type)}
                        />
                        <span style={{ flex: 1, fontSize: 14 }}>{isZh ? meta.zh : meta.en}</span>
                        <span style={{ fontSize: 14, color: 'var(--gray-700)' }}>{fmt(addon.priceCents)}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── 右欄：總額 + 信任元素 + CTA ── */}
          <aside
            style={{
              position: 'sticky',
              top: 24,
              padding: '32px 28px',
              background: 'var(--gray-50)',
              border: '1px solid var(--gray-200)',
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
            }}
          >
            {/* 總額 */}
            <div>
              <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 8 }}>
                {isZh ? '今日付款' : 'Pay today'}
              </div>
              <div style={{ fontSize: 40, fontWeight: 300, letterSpacing: '-0.02em', lineHeight: 1 }}>
                {fmt(oneTimeCents)}
              </div>
              {recurringCents > 0 && (
                <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 8 }}>
                  +{fmt(recurringCents)}
                  {isZh ? ' /月（首月免費）' : '/mo (first month free)'}
                </div>
              )}
            </div>

            {/* 信任元素 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: 'var(--gray-600)' }}>
              <TrustItem label={isZh ? '14 天無條件全額退款' : '14-day full refund'} />
              <TrustItem label={isZh ? '90 天交付後保固期' : '90-day post-delivery warranty'} />
              <TrustItem label={isZh ? '代碼可付費買斷帶走' : 'Code buyout available'} />
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={submitting || authLoading || !catalog}
              style={{
                padding: '16px 24px',
                background: submitting || !catalog ? 'var(--gray-400)' : 'var(--accent)',
                color: 'var(--white)',
                border: 'none',
                fontSize: 14,
                fontWeight: 500,
                cursor: submitting || !catalog ? 'wait' : 'pointer',
                letterSpacing: '0.02em',
              }}
            >
              {submitting
                ? isZh ? '建立付款連結中…' : 'Creating checkout…'
                : !isAuthenticated && !authLoading
                  ? isZh ? '登入後購買' : 'Sign in to buy'
                  : `${isZh ? '前往 Stripe 付款' : 'Continue to Stripe'} · ${fmt(oneTimeCents)}`}
            </button>

            {/* 錯誤訊息（CLAUDE.md：所有錯誤完整顯示前端）*/}
            {submitError && (
              <div
                style={{
                  padding: '12px 14px',
                  background: 'rgba(220, 50, 47, 0.08)',
                  border: '1px solid rgba(220, 50, 47, 0.3)',
                  color: '#a52a25',
                  fontSize: 12,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {submitError}
              </div>
            )}

            <div style={{ fontSize: 11, color: 'var(--gray-500)', textAlign: 'center' }}>
              {isZh ? '支援信用卡 / Apple Pay / Google Pay · 由 Stripe 處理' : 'Cards / Apple Pay / Google Pay · Powered by Stripe'}
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

function TrustItem({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <span style={{ color: 'var(--accent)', fontSize: 14, lineHeight: 1.4 }}>✓</span>
      <span>{label}</span>
    </div>
  )
}
