import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { Suspense } from 'react'
import AdminOrdersClient from './AdminOrdersClient'

type Props = { params: Promise<{ locale: string }> }

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function AdminOrdersPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <Suspense fallback={<div style={{ padding: 32, color: 'var(--gray-500)' }}>…</div>}>
      <AdminOrdersClient locale={locale} />
    </Suspense>
  )
}
