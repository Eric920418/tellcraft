'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useTranslations } from 'next-intl'
import AnimatedCounter from './AnimatedCounter'
import { heavyEasing, HEAVY } from '@/app/lib/chat-utils'

function StatsSection() {
  const t = useTranslations('stats')
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: HEAVY.viewMargin })

  const stats = [
    { value: 90, suffix: '%', label: t('label1'), description: t('desc1') },
    { value: 24, suffix: t('suffixHours'), label: t('label2'), description: t('desc2') },
    { value: 0, suffix: t('suffixLines'), label: t('label3'), description: t('desc3') },
    { value: 100, suffix: '%', label: t('label4'), description: t('desc4') },
  ]

  return (
    <section ref={ref} style={{ padding: '80px 24px', background: 'var(--black)', color: 'var(--white)', borderTop: '3px solid var(--accent)' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: HEAVY.y }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: HEAVY.durationHeader, ease: heavyEasing }}
          style={{ textAlign: 'center', marginBottom: 64 }}
        >
          <h2 style={{
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
          }}>
            {t('heading')}
          </h2>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 48,
        }}>
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 36 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: HEAVY.duration, delay: i * HEAVY.stagger, ease: heavyEasing }}
              style={{ textAlign: 'center' }}
            >
              <div style={{
                fontSize: 'clamp(40px, 6vw, 56px)',
                fontWeight: 300,
                letterSpacing: '-0.03em',
                marginBottom: 8,
                fontFamily: 'var(--font-mono)',
              }}>
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </div>
              <div style={{ width: 24, height: 2, background: 'var(--accent)', margin: '12px auto', opacity: 0.8 }} />
              <div style={{
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 4,
              }}>
                {stat.label}
              </div>
              <div style={{
                fontSize: 13,
                color: 'var(--gray-500)',
              }}>
                {stat.description}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default StatsSection
