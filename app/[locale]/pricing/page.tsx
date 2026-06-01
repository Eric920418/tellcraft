import { setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import PricingClient from './PricingClient'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isZh = locale === 'zh'
  return {
    title: isZh ? '方案與定價 | Tellcraft' : 'Pricing | Tellcraft',
    description: isZh
      ? 'Tellcraft 方案與定價：精準交付一次性 NT$5,000 交付完整可上線網站（含 14 天退款、90 天保固），或月訂閱 NT$699 起。'
      : 'Tellcraft pricing: a one-time $159 Precision Delivery for a complete, deployable site (14-day money-back, 90-day warranty), or monthly plans from $25.',
  }
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  return <PricingClient locale={locale} />
}
