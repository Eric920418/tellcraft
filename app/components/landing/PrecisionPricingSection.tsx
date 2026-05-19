'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { useTranslations, useLocale } from 'next-intl'
import { HEAVY } from '@/app/lib/chat-utils'

type TierMeta = {
  id: 'starter_299' | 'standard_599' | 'pro_999'
  priceUSD: number
  priceTWD: number
  nameKey: string
  taglineKey: string
  iterations: number
  bulletKeys: string[]  // 6000+ tier 多一條 bullet_human_support，放第一位
  highlighted?: boolean
}

// 2026-05-17：策略單一 tier — 砍 starter/pro，只留 standard
const TIERS: TierMeta[] = [
  {
    id: 'standard_599',
    priceUSD: 159,
    priceTWD: 5000,
    nameKey: 'tier_standard_name',
    taglineKey: 'tier_standard_tagline',
    iterations: 8,
    bulletKeys: ['bullet_human_support', 'bullet_responsive', 'bullet_seo', 'bullet_warranty'],
  },
]

function PrecisionPricingSection() {
  const t = useTranslations('pricing')
  const locale = useLocale()
  const isZh = locale === 'zh'
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: HEAVY.viewMargin })

  return (
    <section
      ref={ref}
      style={{
        padding: '100px 24px',
        background: 'var(--gray-50)',
        borderTop: '1px solid var(--gray-200)',
        borderBottom: '1px solid var(--gray-200)',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: HEAVY.y }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...HEAVY.springHeader }}
          style={{ textAlign: 'center', marginBottom: 56 }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              marginBottom: 16,
            }}
          >
            {t('eyebrow')}
          </div>
          <h2
            style={{
              fontSize: 'clamp(28px, 5vw, 44px)',
              fontWeight: 400,
              letterSpacing: '-0.03em',
              lineHeight: 1.2,
              marginBottom: 16,
              color: 'var(--gray-800)',
            }}
          >
            {t('heading')}
          </h2>
          <p
            style={{
              fontSize: 15,
              color: 'var(--gray-500)',
              lineHeight: 1.7,
              maxWidth: 560,
              margin: '0 auto',
            }}
          >
            {t('sub')}
          </p>
        </motion.div>

        {/* Cards — 2026-05-17 改成單卡居中限寬 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            justifyItems: 'center',
            gap: 20,
            marginBottom: 40,
          }}
        >
          {TIERS.map((tier, idx) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: HEAVY.y }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...HEAVY.springSecondary, delay: idx * 0.1 }}
              style={{
                position: 'relative',
                background: 'var(--white)',
                border: tier.highlighted ? '2px solid var(--accent)' : '1px solid var(--gray-200)',
                padding: '32px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
                width: '100%',
                maxWidth: 420,
              }}
            >
              {tier.highlighted && (
                <div
                  style={{
                    position: 'absolute',
                    top: -11,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--accent)',
                    color: 'var(--white)',
                    padding: '3px 12px',
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t('tier_standard_badge')}
                </div>
              )}

              <div>
                <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4, color: 'var(--gray-800)' }}>
                  {t(tier.nameKey)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{t(tier.taglineKey)}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 36, fontWeight: 300, letterSpacing: '-0.02em', color: 'var(--gray-800)' }}>
                  {isZh ? `NT$${tier.priceTWD.toLocaleString()}` : `$${tier.priceUSD}`}
                </span>
                <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{isZh ? 'TWD' : 'USD'}</span>
              </div>

              <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>
                {tier.iterations} {t('iterations')}
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tier.bulletKeys.map((key) => {
                  const text = t(key)
                  // 文案以 ★ 開頭 → 視為強化差異點（如真人工程師協助），用 accent 邊框 + 加粗
                  const isHighlighted = text.startsWith('★')
                  if (isHighlighted) {
                    return (
                      <li
                        key={key}
                        style={{
                          fontSize: 12,
                          color: 'var(--gray-800)',
                          fontWeight: 600,
                          padding: '6px 10px',
                          background: 'var(--accent-muted, rgba(201, 81, 47, 0.08))',
                          borderLeft: '3px solid var(--accent)',
                          lineHeight: 1.4,
                        }}
                      >
                        {text.replace(/^★\s*/, '')}
                      </li>
                    )
                  }
                  return (
                    <li
                      key={key}
                      style={{
                        fontSize: 13,
                        color: 'var(--gray-600)',
                        paddingLeft: 18,
                        position: 'relative',
                        lineHeight: 1.5,
                      }}
                    >
                      <span style={{ position: 'absolute', left: 0, color: 'var(--accent)' }}>✓</span>
                      {text}
                    </li>
                  )
                })}
              </ul>

              <Link
                href={`/${locale}/pay/${tier.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '10px 0 0',
                  fontSize: 13,
                  fontWeight: 500,
                  color: tier.highlighted ? 'var(--accent)' : 'var(--gray-700)',
                  textDecoration: 'none',
                  marginTop: 'auto',
                  borderTop: '1px solid var(--gray-200)',
                  transition: 'color 0.2s',
                }}
              >
                {t('cta_buy')} <span aria-hidden>→</span>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA to full pricing page */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.4 }}
          style={{ textAlign: 'center' }}
        >
          <Link
            href={`/${locale}/pricing`}
            style={{
              fontSize: 14,
              color: 'var(--gray-600)',
              textDecoration: 'underline',
              textUnderlineOffset: 6,
              textDecorationColor: 'var(--gray-300)',
              transition: 'color 0.2s',
            }}
          >
            {t('cta_see_all')}
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

export default PrecisionPricingSection
