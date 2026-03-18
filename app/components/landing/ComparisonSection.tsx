'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useTranslations } from 'next-intl'

function ComparisonSection() {
  const t = useTranslations('comparison')
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const comparisons = [
    { feature: t('feature1'), traditional: t('traditional1'), tellcraft: t('tellcraft1') },
    { feature: t('feature2'), traditional: t('traditional2'), tellcraft: t('tellcraft2') },
    { feature: t('feature3'), traditional: t('traditional3'), tellcraft: t('tellcraft3') },
    { feature: t('feature4'), traditional: t('traditional4'), tellcraft: t('tellcraft4') },
    { feature: t('feature5'), traditional: t('traditional5'), tellcraft: t('tellcraft5') },
    { feature: t('feature6'), traditional: t('traditional6'), tellcraft: t('tellcraft6') },
  ]

  return (
    <section ref={ref} className="comparison-section" style={{ padding: '80px 24px', background: 'var(--white)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 64 }}
        >
          <div style={{
            fontSize: 11,
            color: 'var(--gray-400)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 16,
          }}>
            Comparison
          </div>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 400,
            letterSpacing: '-0.03em',
            marginBottom: 16,
          }}>
            {t('heading')}
          </h2>
          <p style={{ fontSize: 16, color: 'var(--gray-500)' }}>
            {t('subtitle')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="comparison-table"
          style={{ border: '1px solid var(--border-color)', overflow: 'hidden' }}
        >
          <div className="comparison-header" style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr',
            background: 'var(--gray-50)',
            borderBottom: '1px solid var(--border-color)',
            padding: '16px 24px',
            fontSize: 12,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            <span>{t('columnFeature')}</span>
            <span style={{ textAlign: 'center', color: 'var(--white)' }}>{t('columnTraditional')}</span>
            <span style={{ textAlign: 'center', color: 'var(--white)' }}>Tellcraft</span>
          </div>
          {comparisons.map((row, i) => (
            <div
              key={row.feature}
              className="comparison-row"
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr',
                padding: '20px 24px',
                borderBottom: i < comparisons.length - 1 ? '1px solid var(--border-color)' : 'none',
                fontSize: 14,
              }}
            >
              <span style={{ fontWeight: 500 }}>{row.feature}</span>
              <span style={{ textAlign: 'center', color: 'var(--gray-500)' }}>{row.traditional}</span>
              <span style={{ textAlign: 'center', fontWeight: 500 }}>{row.tellcraft}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default ComparisonSection
