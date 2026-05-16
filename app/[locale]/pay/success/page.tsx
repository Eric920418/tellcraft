import { setRequestLocale } from 'next-intl/server'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import SuccessClient from './SuccessClient'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isZh = locale === 'zh'
  return {
    title: isZh ? '付款成功 | Tellcraft' : 'Payment successful | Tellcraft',
    robots: 'noindex',
  }
}

export default async function PaySuccessPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  // useSearchParams 必須在 Suspense 內（Next.js 16 static rendering 規範）
  return (
    <Suspense fallback={<div style={{ padding: '120px 24px', textAlign: 'center' }}>...</div>}>
      <SuccessClient locale={locale} />
    </Suspense>
  )
}
