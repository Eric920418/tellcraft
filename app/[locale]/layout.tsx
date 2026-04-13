import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { ThemeProvider } from '@/app/components/ThemeProvider'
import { IBM_Plex_Mono, Noto_Sans_TC } from 'next/font/google'
import '@/app/globals.css'

const notoSansTC = Noto_Sans_TC({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-sans',
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })

  const isZh = locale === 'zh'
  const canonicalUrl = isZh ? 'https://tellcraft.com/zh' : 'https://tellcraft.com'

  return {
    metadataBase: new URL('https://tellcraft.com'),
    title: {
      default: t('title'),
      template: '%s | Tellcraft',
    },
    description: t('description'),
    keywords: isZh
      ? ['Tellcraft', 'AI 建站', 'AI 網站生成器', 'AI 自動建站', '免費建站', '對話式建站', 'AI 網站製作', '不用寫程式做網站', 'AI 建站平台推薦', 'AI 網頁設計', '一鍵部署網站', '免費 AI 架站', 'AI 開發平台', '自動化網站開發']
      : ['Tellcraft', 'AI website builder', 'AI website generator', 'build website without coding', 'no-code website builder', 'best AI website builder 2026', 'AI code generation', 'build website free', 'create website with AI', 'conversation-driven development', 'one-click deploy', 'Next.js AI builder', 'automated web development'],
    openGraph: {
      type: 'website',
      locale: isZh ? 'zh_TW' : 'en_US',
      alternateLocale: isZh ? 'en_US' : 'zh_TW',
      url: canonicalUrl,
      siteName: 'Tellcraft',
      title: t('title'),
      description: t('description'),
      images: [{
        url: `https://tellcraft.com/${isZh ? 'zh' : 'en'}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: isZh ? 'Tellcraft - AI 自動建站平台' : 'Tellcraft - AI Website Builder',
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: [{
        url: `https://tellcraft.com/${isZh ? 'zh' : 'en'}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: isZh ? 'Tellcraft - AI 自動建站平台' : 'Tellcraft - AI Website Builder',
      }],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': 'https://tellcraft.com/',
        'zh-TW': 'https://tellcraft.com/zh',
      },
    },
    robots: { index: true, follow: true },
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${notoSansTC.variable} ${ibmPlexMono.variable}`}>
        <NextIntlClientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
