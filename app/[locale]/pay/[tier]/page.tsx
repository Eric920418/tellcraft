import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import PayClient from './PayClient'

// 2026-05-17：策略單一 tier，僅允許 standard_599
// starter_299 / pro_999 仍存在於 backend TIER_CONFIG（供舊訂單查詢），但前端不再開放新購
const VALID_TIERS = ['standard_599'] as const
type TierId = (typeof VALID_TIERS)[number]

type Props = {
  params: Promise<{ locale: string; tier: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isZh = locale === 'zh'
  return {
    title: isZh ? '結帳 | Tellcraft' : 'Checkout | Tellcraft',
    robots: 'noindex',
  }
}

export default async function PayPage({ params }: Props) {
  const { locale, tier } = await params
  setRequestLocale(locale)

  if (!VALID_TIERS.includes(tier as TierId)) {
    notFound()
  }

  return <PayClient locale={locale} tier={tier as TierId} />
}
