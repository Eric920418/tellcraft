'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

export default function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale as (typeof routing.locales)[number] })
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <button
        onClick={() => switchLocale('zh')}
        style={{
          padding: '4px 8px',
          fontSize: 13,
          fontWeight: locale === 'zh' ? 600 : 400,
          color: locale === 'zh' ? 'var(--text-primary)' : 'var(--gray-400)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          transition: 'color 0.15s',
        }}
      >
        中
      </button>
      <span style={{ color: 'var(--gray-300)', fontSize: 12 }}>/</span>
      <button
        onClick={() => switchLocale('en')}
        style={{
          padding: '4px 8px',
          fontSize: 13,
          fontWeight: locale === 'en' ? 600 : 400,
          color: locale === 'en' ? 'var(--text-primary)' : 'var(--gray-400)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          transition: 'color 0.15s',
        }}
      >
        EN
      </button>
    </div>
  )
}
