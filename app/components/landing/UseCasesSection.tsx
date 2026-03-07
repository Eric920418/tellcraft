'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useTranslations } from 'next-intl'
import RotatingText from '@/app/components/RotatingText'
import GlareHover from '@/app/components/GlareHover'

function UseCasesSection() {
  const t = useTranslations('useCases')
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const useCases = [
    {
      audience: t('audience1'),
      title: t('title1'),
      description: t('desc1'),
      examples: [t('examples1_1'), t('examples1_2'), t('examples1_3')]
    },
    {
      audience: t('audience2'),
      title: t('title2'),
      description: t('desc2'),
      examples: [t('examples2_1'), t('examples2_2'), t('examples2_3')]
    },
    {
      audience: t('audience3'),
      title: t('title3'),
      description: t('desc3'),
      examples: [t('examples3_1'), t('examples3_2'), t('examples3_3')]
    },
    {
      audience: t('audience4'),
      title: t('title4'),
      description: t('desc4'),
      examples: [t('examples4_1'), t('examples4_2'), t('examples4_3')]
    }
  ]

  return (
    <section ref={ref} style={{ padding: '80px 24px', background: 'var(--gray-50)' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 80 }}
        >
          <div style={{
            fontSize: 11,
            color: 'var(--gray-400)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 16,
          }}>
            Use Cases
          </div>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 400,
            letterSpacing: '-0.03em',
            lineHeight: 1.3,
            marginBottom: 16,
          }}>
            {t('heading')}{' '}
            <RotatingText
              texts={[t('audience1'), t('audience2'), t('audience3'), t('audience4')]}
              rotationInterval={2500}
              staggerDuration={0.03}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '-100%', opacity: 0 }}
              style={{
                color: 'var(--black)',
                fontWeight: 500,
                borderBottom: '2px solid var(--black)',
                paddingBottom: 2
              }}
            />
          </h2>
          <p style={{ fontSize: 16, color: 'var(--gray-500)', maxWidth: 500, margin: '0 auto' }}>
            {t('subtitle')}
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 24,
        }}>
          {useCases.map((useCase, i) => (
            <motion.div
              key={useCase.audience}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              style={{ height: '100%' }}
            >
              <GlareHover
                height="100%"
                background="var(--white)"
                borderColor="var(--border-color)"
                glareColor="#000000"
                glareOpacity={0.08}
                glareAngle={-30}
                glareSize={200}
                transitionDuration={800}
              >
                <article style={{ padding: 32, height: '100%' }}>
                  <div style={{
                    fontSize: 11,
                    color: 'var(--gray-400)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 12,
                  }}>
                    {useCase.audience}
                  </div>
                  <h3 style={{
                    fontSize: 18,
                    fontWeight: 500,
                    marginBottom: 12,
                    letterSpacing: '-0.02em',
                  }}>
                    {useCase.title}
                  </h3>
                  <p style={{
                    fontSize: 14,
                    color: 'var(--gray-500)',
                    lineHeight: 1.7,
                    marginBottom: 20,
                  }}>
                    {useCase.description}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {useCase.examples.map(example => (
                      <span
                        key={example}
                        style={{
                          fontSize: 12,
                          padding: '4px 10px',
                          background: 'var(--gray-50)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--gray-600)',
                        }}
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                </article>
              </GlareHover>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default UseCasesSection
