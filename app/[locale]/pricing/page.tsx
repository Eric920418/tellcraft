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
      ? '精細模式一次性付費交付完整網站，或選擇彈性月訂閱。'
      : 'One-time precision delivery or flexible monthly subscription.',
  }
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  return <PricingClient locale={locale} />
}
