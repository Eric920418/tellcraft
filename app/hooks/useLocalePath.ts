'use client'

import { useLocale } from 'next-intl'

/**
 * Returns a function that prefixes a path with the current locale
 * when the locale is not the default (zh).
 *
 * Usage:
 *   const localePath = useLocalePath()
 *   window.location.href = localePath('/dashboard')
 *   // zh → '/dashboard', en → '/en/dashboard'
 */
export function useLocalePath() {
  const locale = useLocale()

  return (path: string) => {
    if (locale === 'zh') return path
    return `/${locale}${path}`
  }
}
