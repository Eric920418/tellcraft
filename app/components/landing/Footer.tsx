'use client'

import { useTranslations, useLocale } from 'next-intl'

function Footer() {
  const t = useTranslations('footer')
  const locale = useLocale()
  return (
    <footer style={{ padding: '64px 24px 48px', borderTop: '1px solid var(--border-color)', background: 'var(--gray-50)' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 48,
          marginBottom: 48,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Tellcraft" width={24} height={24} style={{ borderRadius: 4 }} />
              <span>Tellcraft</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.6 }}>
              {t('description1')}<br />
              {t('description2')}
            </p>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-400)' }}>
              {t('navProduct')}
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a href="#how-it-works" style={{ fontSize: 14, color: 'var(--gray-600)', textDecoration: 'none' }}>{t('linkFeatures')}</a>
              <a href="#use-cases" style={{ fontSize: 14, color: 'var(--gray-600)', textDecoration: 'none' }}>{t('linkUseCases')}</a>
              <a href="#faq" style={{ fontSize: 14, color: 'var(--gray-600)', textDecoration: 'none' }}>{t('linkFaq')}</a>
            </nav>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-400)' }}>
              {t('navResources')}
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a href={`/${locale}/pricing`} style={{ fontSize: 14, color: 'var(--gray-600)', textDecoration: 'none' }}>{t('linkPricing')}</a>
              <a href={`/${locale}/templates`} style={{ fontSize: 14, color: 'var(--gray-600)', textDecoration: 'none' }}>{t('linkTemplates')}</a>
            </nav>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-400)' }}>
              {t('navAbout')}
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a href={`/${locale}/privacy`} style={{ fontSize: 14, color: 'var(--gray-600)', textDecoration: 'none' }}>{t('linkPrivacy')}</a>
              <a href={`/${locale}/terms`} style={{ fontSize: 14, color: 'var(--gray-600)', textDecoration: 'none' }}>{t('linkTerms')}</a>
              <a href={`/${locale}/refund`} style={{ fontSize: 14, color: 'var(--gray-600)', textDecoration: 'none' }}>{t('linkRefund')}</a>
              <a href={`/${locale}/contact`} style={{ fontSize: 14, color: 'var(--gray-600)', textDecoration: 'none' }}>{t('linkContact')}</a>
            </nav>
          </div>
        </div>

        <div style={{
          paddingTop: 32,
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>
            © 2026 Tellcraft. All rights reserved.
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
            Made with AI in Taiwan
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
