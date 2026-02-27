'use client'

import { useLocale } from 'next-intl'
import { routing } from '@/i18n/routing'

/**
 * Returns a function that prefixes a path with the current locale
 * when the locale is not the default (en).
 *
 * Usage:
 *   const localePath = useLocalePath()
 *   window.location.href = localePath('/dashboard')
 *   // en → '/dashboard', zh → '/zh/dashboard'
 */
export function useLocalePath() {
  const locale = useLocale()

  return (path: string) => {
    if (locale === routing.defaultLocale) return path
    return `/${locale}${path}`
  }
}
