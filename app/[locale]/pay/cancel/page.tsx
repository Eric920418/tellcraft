import { setRequestLocale } from 'next-intl/server'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import CancelClient from './CancelClient'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isZh = locale === 'zh'
  return {
    title: isZh ? '已取消付款 | Tellcraft' : 'Payment cancelled | Tellcraft',
    robots: 'noindex',
  }
}

export default async function PayCancelPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <Suspense fallback={<div style={{ padding: '120px 24px', textAlign: 'center' }}>...</div>}>
      <CancelClient locale={locale} />
    </Suspense>
  )
}
