'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useAuth } from '@/app/hooks/useAuth'
import {
  createCheckoutSession,
  getCheckoutCatalog,
  type CheckoutCatalog,
  type CheckoutCurrency,
  type PrecisionTier,
} from '@/app/lib/vps-api'

// 2026-05-27：策略簡化 — 砍掉所有加購（hosting/maintenance/4 模塊）
// 用戶只能買標準方案，one-product-one-button 結帳 = 最高轉換率
// Backend 仍支援 addons param（傳空陣列），未來想復活加購不用 backend rework

const TIER_META: Record<PrecisionTier, { name: { zh: string; en: string }; pages: { zh: string; en: string } }> = {
  starter_299: { name: { zh: '入門', en: 'Starter' }, pages: { zh: 'Landing 單頁', en: 'Single landing page' } },
  standard_599: { name: { zh: '標準', en: 'Standard' }, pages: { zh: '3-5 頁中型網站', en: '3-5 page site' } },
  pro_999: { name: { zh: '專業', en: 'Pro' }, pages: { zh: '後台 + DB 的 SaaS', en: 'SaaS with admin + DB' } },
}

const TIER_BULLETS: Record<PrecisionTier, { zh: string[]; en: string[] }> = {
  starter_299: {
    zh: ['響應式設計 + 動畫', '3 次微調迭代', '14 天無條件退款', '90 天保固'],
    en: ['Responsive + animations', '3 refinement iterations', '14-day refund', '90-day warranty'],
  },
  standard_599: {
    zh: [
      '3-5 頁完整網站（響應式 + 動畫 + 表單）',
      '8 次微調迭代額度',
      'SEO 結構化資料',
      '14 天無條件全額退款',
      '90 天交付後保固期',
      '代碼可付費買斷帶走',
    ],
    en: [
      '3-5 page complete site (responsive + animations + forms)',
      '8 refinement iterations',
      'SEO structured data',
      '14-day full refund',
      '90-day post-delivery warranty',
      'Code buyout available',
    ],
  },
  pro_999: {
    zh: ['後台 + 資料庫 + 認證', '15 次微調迭代', '14 天無條件退款', '90 天保固'],
    en: ['Admin + DB + Auth', '15 refinement iterations', '14-day refund', '90-day warranty'],
  },
}

export default function PayClient({ locale, tier }: { locale: string; tier: PrecisionTier }) {
  const isZh = locale === 'zh'
  const currency: CheckoutCurrency = isZh ? 'twd' : 'usd'
  const { token, isAuthenticated, isLoading: authLoading } = useAuth()

  const [catalog, setCatalog] = useState<CheckoutCatalog | null>(null)
  const [catalogError, setCatalogError] = useState<string | null>(null)
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
  const totalAmount = tierInfo?.basePriceCents ?? 0

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
        addons: [],  // 不開放加購（backend 仍支援，未來想復活改這裡）
        locale,
        currency,
        token,
      })
      if (!res.success || !res.data) {
        setSubmitError(res.error ?? (isZh ? 'Checkout 建立失敗' : 'Checkout creation failed'))
        setSubmitting(false)
        return
      }
      window.location.href = res.data.checkoutUrl
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err))
      setSubmitting(false)
    }
  }

  // 格式化金額：USD 是 two-decimal（cents/100），TWD 是 zero-decimal（直接用 dollars）
  const fmt = (amount: number) => {
    if (currency === 'twd') {
      return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(amount)
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount / 100)
  }

  const tierMeta = TIER_META[tier]
  const bullets = (isZh ? TIER_BULLETS[tier].zh : TIER_BULLETS[tier].en) ?? []
  const hasHumanSupport = tier === 'standard_599' || tier === 'pro_999'

  return (
    <main style={{ minHeight: '100vh', background: 'var(--white)', color: 'var(--gray-800)' }}>
      <div style={{ maxWidth: 580, margin: '0 auto', padding: '60px 24px 80px' }}>
        {/* 返回連結 */}
        <Link
          href={`/${locale}/pricing`}
          style={{
            display: 'inline-block',
            fontSize: 13,
            color: 'var(--gray-500)',
            textDecoration: 'none',
            marginBottom: 32,
          }}
        >
          ← {isZh ? '返回方案選擇' : 'Back to pricing'}
        </Link>

        <h1
          style={{
            fontSize: 'clamp(26px, 4vw, 32px)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            marginBottom: 8,
          }}
        >
          {isZh ? '確認購買' : 'Review your order'}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 40 }}>
          {isZh ? '一鍵完成，前往 Stripe 安全付款。' : 'One click, secure checkout via Stripe.'}
        </p>

        {catalogError && (
          <div
            style={{
              padding: '14px 18px',
              background: 'rgba(220, 50, 47, 0.08)',
              border: '1px solid rgba(220, 50, 47, 0.3)',
              color: '#a52a25',
              fontSize: 13,
              marginBottom: 24,
            }}
          >
            {isZh ? '錯誤：' : 'Error: '}
            {catalogError}
          </div>
        )}

        {/* 主商品卡 — 單卡居中，含所有資訊 + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            background: 'var(--gray-50)',
            border: '1px solid var(--gray-200)',
            padding: '32px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          {/* tier 名稱 + 大價格 */}
          <div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {isZh ? '方案' : 'Plan'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 8 }}>
              <div style={{ fontSize: 22, fontWeight: 500 }}>
                {isZh ? tierMeta.name.zh : tierMeta.name.en}
              </div>
              <div style={{ fontSize: 36, fontWeight: 300, letterSpacing: '-0.02em', lineHeight: 1 }}>
                {tierInfo ? fmt(totalAmount) : '—'}
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
              {isZh ? tierMeta.pages.zh : tierMeta.pages.en}
              {tierInfo && (
                <>
                  {' · '}
                  {tierInfo.iterationsTotal} {isZh ? '次迭代' : 'iterations'}
                </>
              )}
            </div>
          </div>

          {/* 人工協助 highlight bullet（standard / pro 才有）*/}
          {hasHumanSupport && (
            <div
              style={{
                padding: '12px 14px',
                background: 'var(--accent-muted, rgba(201, 81, 47, 0.08))',
                borderLeft: '3px solid var(--accent)',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--gray-800)',
                lineHeight: 1.5,
              }}
            >
              {isZh ? '真人工程師 24 小時協助開發完工' : 'Real engineer 24/7 assistance until launch'}
            </div>
          )}

          {/* 包含內容 bullets */}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bullets.map((b) => (
              <li
                key={b}
                style={{
                  fontSize: 13,
                  color: 'var(--gray-600)',
                  paddingLeft: 22,
                  position: 'relative',
                  lineHeight: 1.5,
                }}
              >
                <span style={{ position: 'absolute', left: 0, color: 'var(--accent)' }}>✓</span>
                {b}
              </li>
            ))}
          </ul>

          {/* 大 CTA */}
          <button
            type="button"
            onClick={handleCheckout}
            disabled={submitting || authLoading || !catalog}
            style={{
              padding: '16px 24px',
              background: submitting || !catalog ? 'var(--gray-400)' : 'var(--accent)',
              color: 'var(--white)',
              border: 'none',
              fontSize: 15,
              fontWeight: 500,
              cursor: submitting || !catalog ? 'wait' : 'pointer',
              letterSpacing: '0.02em',
              marginTop: 8,
            }}
          >
            {submitting
              ? isZh ? '建立付款連結中…' : 'Creating checkout…'
              : !isAuthenticated && !authLoading
                ? isZh ? '登入後購買' : 'Sign in to buy'
                : `${isZh ? '前往 Stripe 付款' : 'Continue to Stripe'}  ·  ${fmt(totalAmount)}`}
          </button>

          {/* 錯誤訊息（CLAUDE.md：所有錯誤完整顯示前端） */}
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

          {/* 條款連結（Stripe 審核 + 法律合規）*/}
          <div style={{ fontSize: 11, color: 'var(--gray-500)', lineHeight: 1.6, textAlign: 'center' }}>
            {isZh ? '點選付款即表示同意 ' : 'By clicking pay you agree to '}
            <a href={`/${locale}/terms`} style={{ color: 'var(--gray-700)', textDecoration: 'underline' }}>
              {isZh ? '服務條款' : 'Terms'}
            </a>
            {isZh ? '、' : ', '}
            <a href={`/${locale}/privacy`} style={{ color: 'var(--gray-700)', textDecoration: 'underline' }}>
              {isZh ? '隱私政策' : 'Privacy'}
            </a>
            {isZh ? '、' : ' and '}
            <a href={`/${locale}/refund`} style={{ color: 'var(--gray-700)', textDecoration: 'underline' }}>
              {isZh ? '退款政策' : 'Refund Policy'}
            </a>
            {isZh ? '。' : '.'}
          </div>

          <div style={{ fontSize: 11, color: 'var(--gray-500)', textAlign: 'center', marginTop: -8 }}>
            {isZh ? '支援信用卡 / Apple Pay / Google Pay · 由 Stripe 處理' : 'Cards / Apple Pay / Google Pay · Powered by Stripe'}
          </div>
        </motion.div>
      </div>
    </main>
  )
}
