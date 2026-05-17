'use client'

/**
 * 精細模式迭代次數用完時推送的 paywall 卡片。
 * 由 `iteration-skill.ts:executeIteration` 的 0a 區段觸發。
 *
 * richContent.data shape:
 *   - tier: 'starter_299' | 'standard_599' | 'pro_999'
 *   - iterationsTotal: number
 *   - iterationsUsed: number
 *   - orderId: string
 */

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useLocale } from 'next-intl'

interface IterationLimitPaywallProps {
  data: {
    tier?: string
    iterationsTotal?: number
    iterationsUsed?: number
    orderId?: string
  }
}

const TIER_LABEL: Record<string, { zh: string; en: string }> = {
  starter_299: { zh: '入門', en: 'Starter' },
  standard_599: { zh: '標準', en: 'Standard' },
  pro_999: { zh: '專業', en: 'Pro' },
}

function IterationLimitPaywall({ data }: IterationLimitPaywallProps) {
  const locale = useLocale()
  const isZh = locale === 'zh'
  const tier = data.tier ?? 'standard_599'
  const total = data.iterationsTotal ?? 0
  const used = data.iterationsUsed ?? total
  const tierName = (TIER_LABEL[tier] || TIER_LABEL.standard_599)[isZh ? 'zh' : 'en']

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        marginTop: 12,
        padding: '16px 18px',
        background: 'var(--gray-50, #faf8f5)',
        border: '1px solid var(--gray-200, #e8e5e2)',
        borderLeft: '3px solid var(--accent, #C9512F)',
        borderRadius: 4,
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent, #C9512F)', marginBottom: 8 }}>
        {isZh ? '迭代額度用完' : 'Iteration limit reached'}
      </div>
      <div style={{ fontSize: 14, color: 'var(--gray-700, #3b3836)', marginBottom: 6, lineHeight: 1.5 }}>
        {isZh
          ? `你的「${tierName}」訂單包含 ${total} 次迭代，已全部使用。`
          : `Your "${tierName}" order includes ${total} iterations — all used up.`}
      </div>
      <div style={{ fontSize: 12, color: 'var(--gray-500, #736f6c)', marginBottom: 14 }}>
        {used}/{total} {isZh ? '已使用' : 'used'}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--gray-600, #524e4b)', marginBottom: 14, paddingLeft: 16 }}>
        <div>• {isZh ? '加購 3 次迭代包（一次性）' : 'Add 3-iteration pack (one-time)'}</div>
        <div>• {isZh ? '升級維護訂閱（無限次迭代 + bugfix）' : 'Upgrade maintenance subscription (unlimited)'}</div>
      </div>

      <Link
        href={`/${locale}/dashboard/orders`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '8px 14px',
          background: 'var(--accent, #C9512F)',
          color: 'var(--white, #fefcfa)',
          fontSize: 13,
          fontWeight: 500,
          textDecoration: 'none',
          borderRadius: 4,
        }}
      >
        {isZh ? '查看訂單與加購' : 'View order & upgrade'} <span aria-hidden>→</span>
      </Link>
    </motion.div>
  )
}

export default IterationLimitPaywall
