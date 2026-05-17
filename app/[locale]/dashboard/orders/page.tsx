import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { Suspense } from 'react'
import OrdersClient from './OrdersClient'

type Props = {
  params: Promise<{ locale: string }>
}

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function OrdersPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <Suspense fallback={<div style={{ padding: 32, color: 'var(--gray-500)' }}>…</div>}>
      <OrdersClient locale={locale} />
    </Suspense>
  )
}
