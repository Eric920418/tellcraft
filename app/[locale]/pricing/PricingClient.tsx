'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useMemo } from 'react'

type Tier = {
  id: 'starter_299' | 'standard_599' | 'pro_999'
  priceUSD: number      // 美金顯示值（整數）
  priceTWD: number      // 台幣顯示值（整數）
  name: { zh: string; en: string }
  tagline: { zh: string; en: string }
  iterations: number
  bullets: { zh: string[]; en: string[] }
  highlighted?: boolean
}

const TIERS: Tier[] = [
  {
    id: 'starter_299',
    priceUSD: 99,
    priceTWD: 3000,
    name: { zh: '入門', en: 'Starter' },
    tagline: { zh: 'Landing 單頁，最快上線', en: 'Single-page landing site' },
    iterations: 3,
    bullets: {
      zh: [
        '1 頁完整 Landing Page',
        '響應式設計 + 動畫',
        '3 次微調迭代',
        '14 天無條件退款',
        '90 天保固',
      ],
      en: [
        '1 page polished landing',
        'Responsive + animations',
        '3 refinement iterations',
        '14-day money-back',
        '90-day warranty',
      ],
    },
  },
  {
    id: 'standard_599',
    priceUSD: 199,
    priceTWD: 6000,
    name: { zh: '標準', en: 'Standard' },
    tagline: { zh: '3-5 頁中型網站，小商業首選', en: '3-5 page mid-size site' },
    iterations: 8,
    highlighted: true,
    bullets: {
      zh: [
        '★ 真人工程師 24 小時協助開發完工',
        '3-5 頁完整網站',
        '響應式 + 動畫 + 表單',
        '8 次微調迭代',
        '14 天無條件退款',
        '90 天保固',
        'SEO 結構化資料',
      ],
      en: [
        '★ Real engineer 24/7 assistance until launch',
        '3-5 page complete site',
        'Responsive + forms',
        '8 refinement iterations',
        '14-day money-back',
        '90-day warranty',
        'SEO structured data',
      ],
    },
  },
  {
    id: 'pro_999',
    priceUSD: 399,
    priceTWD: 12000,
    name: { zh: '專業', en: 'Pro' },
    tagline: { zh: '含後台 + 資料庫的 SaaS 起步包', en: 'SaaS with admin + DB' },
    iterations: 15,
    bullets: {
      zh: [
        '★ 真人工程師 24 小時協助開發完工',
        '完整 SaaS / 多頁 Web App',
        '後台管理介面',
        '資料庫 + 認證',
        '15 次微調迭代',
        '14 天無條件退款',
        '90 天保固',
      ],
      en: [
        '★ Real engineer 24/7 assistance until launch',
        'Full SaaS / multi-page app',
        'Admin dashboard',
        'Database + auth',
        '15 refinement iterations',
        '14-day money-back',
        '90-day warranty',
      ],
    },
  },
]

// 訂閱方案：zh 用真實 TWD 月費 / en 顯示換算 USD（暫無真實 USD 訂閱計價）
const SUBSCRIPTION_PLANS = [
  { id: 'creator', label: { zh: 'Creator', en: 'Creator' }, priceTWD: 699, priceUSD: 25, credits: 90 },
  { id: 'pro', label: { zh: 'Pro', en: 'Pro' }, priceTWD: 1990, priceUSD: 65, credits: 300 },
  { id: 'business', label: { zh: 'Business', en: 'Business' }, priceTWD: 4990, priceUSD: 160, credits: 900 },
]

export default function PricingClient({ locale }: { locale: string }) {
  const isZh = locale === 'zh'
  const t = useMemo(
    () => ({
      heroEyebrow: isZh ? '兩種模式' : 'Two ways to build',
      heroTitle: isZh ? '一次性付費，或彈性訂閱' : 'Pay once, or subscribe',
      heroSub: isZh
        ? '精細模式：一筆付清，AI 一步到位交付完整網站，省去找設計師 + 工程師的麻煩。訂閱方案：適合想自己慢慢打磨的人。'
        : 'Precision Mode: one payment, AI delivers a complete site end-to-end — no designer / dev hunting needed. Subscription: for those who prefer to iterate at their own pace.',
      precisionEyebrow: isZh ? '主打方案' : 'Featured',
      precisionTitle: isZh ? '精細模式 — 一次交付完整網站' : 'Precision Mode — End-to-end delivery',
      precisionSub: isZh
        ? '對標自由工程師 NT$60,000-150,000 接案費，Tellcraft 一次性 NT$3,000-12,000 直接交付。'
        : 'Replaces $2,000-$5,000 freelance gigs. One payment, complete deliverable.',
      subEyebrow: isZh ? '次要選項' : 'Alternative',
      subTitle: isZh ? '訂閱方案 — 想自己慢慢試' : 'Subscription — Build at your own pace',
      subSub: isZh
        ? '按月訂閱 Credit，自己對話、自己調整、自己反覆迭代。'
        : 'Monthly Credits. Chat, tweak, iterate on your own.',
      cta: isZh ? '立即購買' : 'Buy now',
      perMonth: isZh ? '/月' : '/mo',
      credits: isZh ? 'Credits' : 'Credits',
      highlight: isZh ? '最受歡迎' : 'Most popular',
      iterations: isZh ? '次迭代' : 'iterations',
      contactCta: isZh ? '聯絡銷售' : 'Contact sales',
    }),
    [isZh]
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--white)', color: 'var(--gray-800)' }}>
      {/* ── Hero ── */}
      <section style={{ padding: '120px 24px 60px', textAlign: 'center', maxWidth: 880, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div
            style={{
              fontSize: 12,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              marginBottom: 16,
            }}
          >
            {t.heroEyebrow}
          </div>
          <h1
            style={{
              fontSize: 'clamp(36px, 6vw, 56px)',
              fontWeight: 400,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              marginBottom: 24,
            }}
          >
            {t.heroTitle}
          </h1>
          <p
            style={{
              fontSize: 17,
              color: 'var(--gray-500)',
              lineHeight: 1.7,
              maxWidth: 640,
              margin: '0 auto',
            }}
          >
            {t.heroSub}
          </p>
        </motion.div>
      </section>

      {/* ── 精細模式（主打）── */}
      <section style={{ padding: '40px 24px 80px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              marginBottom: 12,
            }}
          >
            {t.precisionEyebrow}
          </div>
          <h2
            style={{
              fontSize: 'clamp(28px, 4.5vw, 40px)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              marginBottom: 12,
            }}
          >
            {t.precisionTitle}
          </h2>
          <p style={{ fontSize: 15, color: 'var(--gray-500)' }}>{t.precisionSub}</p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
          }}
        >
          {TIERS.map((tier, idx) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              style={{
                position: 'relative',
                background: 'var(--gray-50)',
                border: tier.highlighted ? '2px solid var(--accent)' : '1px solid var(--gray-200)',
                padding: '40px 32px',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              {tier.highlighted && (
                <div
                  style={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--accent)',
                    color: 'var(--white)',
                    padding: '4px 12px',
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  {t.highlight}
                </div>
              )}

              <div>
                <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 6 }}>{isZh ? tier.name.zh : tier.name.en}</div>
                <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>{isZh ? tier.tagline.zh : tier.tagline.en}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 48, fontWeight: 300, letterSpacing: '-0.02em' }}>
                  {isZh ? `NT$${tier.priceTWD.toLocaleString()}` : `$${tier.priceUSD}`}
                </span>
                <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>{isZh ? 'TWD' : 'USD'}</span>
              </div>

              <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                {tier.iterations} {t.iterations}
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(isZh ? tier.bullets.zh : tier.bullets.en).map((bullet) => {
                  // ★ 開頭的 bullet 視為「強化差異點」（如真人工程師協助）— 不放 ✓，改加粗 + 邊框
                  const isHighlighted = bullet.startsWith('★')
                  if (isHighlighted) {
                    return (
                      <li
                        key={bullet}
                        style={{
                          fontSize: 13,
                          color: 'var(--gray-800)',
                          fontWeight: 600,
                          padding: '8px 12px',
                          background: 'var(--accent-muted, rgba(201, 81, 47, 0.08))',
                          borderLeft: '3px solid var(--accent)',
                          lineHeight: 1.4,
                        }}
                      >
                        {bullet.replace(/^★\s*/, '')}
                      </li>
                    )
                  }
                  return (
                    <li
                      key={bullet}
                      style={{
                        fontSize: 14,
                        color: 'var(--gray-600)',
                        paddingLeft: 20,
                        position: 'relative',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          left: 0,
                          color: 'var(--accent)',
                        }}
                      >
                        ✓
                      </span>
                      {bullet}
                    </li>
                  )
                })}
              </ul>

              <Link
                href={`/${locale}/pay/${tier.id}`}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '14px 24px',
                  background: tier.highlighted ? 'var(--accent)' : 'transparent',
                  color: tier.highlighted ? 'var(--white)' : 'var(--gray-800)',
                  border: tier.highlighted ? 'none' : '1px solid var(--gray-300)',
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 500,
                  marginTop: 'auto',
                  transition: 'all 0.2s',
                }}
              >
                {t.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── 訂閱方案（次要）── */}
      <section
        style={{
          padding: '80px 24px',
          background: 'var(--gray-50)',
          borderTop: '1px solid var(--gray-200)',
        }}
      >
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div
              style={{
                fontSize: 11,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--gray-500)',
                marginBottom: 12,
              }}
            >
              {t.subEyebrow}
            </div>
            <h2
              style={{
                fontSize: 'clamp(24px, 3.5vw, 32px)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                marginBottom: 12,
              }}
            >
              {t.subTitle}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>{t.subSub}</p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            {SUBSCRIPTION_PLANS.map((plan) => (
              <div
                key={plan.id}
                style={{
                  background: 'var(--white)',
                  border: '1px solid var(--gray-200)',
                  padding: '28px 24px',
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
                  {isZh ? plan.label.zh : plan.label.en}
                </div>
                <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 16 }}>
                  {isZh ? `NT$${plan.priceTWD.toLocaleString()}` : `$${plan.priceUSD}`}
                  {t.perMonth}
                </div>
                <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                  {plan.credits} {t.credits}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
