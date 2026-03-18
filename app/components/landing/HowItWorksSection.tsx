'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useTranslations } from 'next-intl'

function HowItWorksSection() {
  const t = useTranslations('howItWorks')
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  const steps = [
    {
      number: '01',
      title: t('step1Title'),
      description: t('step1Desc'),
    },
    {
      number: '02',
      title: t('step2Title'),
      description: t('step2Desc'),
    },
    {
      number: '03',
      title: t('step3Title'),
      description: t('step3Desc'),
    },
    {
      number: '04',
      title: t('step4Title'),
      description: t('step4Desc'),
    },
    {
      number: '05',
      title: t('step5Title'),
      description: t('step5Desc'),
    }
  ]

  return (
    <section ref={ref} style={{ background: 'var(--black)', overflow: 'hidden' }}>
      {/* Dramatic alternating blocks */}
      {steps.map((step, i) => {
        const isEven = i % 2 === 0
        return (
          <motion.div
            key={step.number}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: i * 0.15 }}
            style={{
              display: 'grid',
              gridTemplateColumns: isEven ? '1fr 1fr' : '1fr 1fr',
              minHeight: 200,
              background: isEven ? 'var(--gray-800)' : 'var(--white)',
              color: isEven ? 'var(--white)' : 'var(--black)',
              position: 'relative',
            }}
          >
            {/* Number side */}
            <motion.div
              initial={{ x: isEven ? -100 : 100, opacity: 0 }}
              animate={isInView ? { x: 0, opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.2 + i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isEven ? 'flex-end' : 'flex-start',
                padding: '48px 40px',
                order: isEven ? 0 : 1,
                borderRight: isEven ? `1px solid var(--gray-700)` : 'none',
                borderLeft: !isEven ? `1px solid var(--gray-200)` : 'none',
              }}
            >
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'clamp(80px, 15vw, 140px)',
                fontWeight: 200,
                lineHeight: 0.85,
                letterSpacing: '-0.05em',
                opacity: isEven ? 0.2 : 0.15,
                color: isEven ? 'var(--accent)' : undefined,
              }}>
                {step.number}
              </span>
            </motion.div>

            {/* Content side */}
            <motion.div
              initial={{ x: isEven ? 100 : -100, opacity: 0 }}
              animate={isInView ? { x: 0, opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.3 + i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '48px 40px',
                order: isEven ? 1 : 0,
                maxWidth: 500,
                marginLeft: isEven ? 0 : 'auto',
                marginRight: isEven ? 'auto' : 0,
              }}
            >
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                opacity: isEven ? 0.7 : 0.5,
                letterSpacing: '0.15em',
                marginBottom: 16,
                color: isEven ? 'var(--accent)' : undefined,
              }}>
                STEP {step.number}
              </div>
              <h3 style={{
                fontSize: 'clamp(24px, 4vw, 32px)',
                fontWeight: 500,
                marginBottom: 16,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}>
                {step.title}
              </h3>
              <p style={{
                fontSize: 16,
                opacity: 0.7,
                lineHeight: 1.7,
              }}>
                {step.description}
              </p>
            </motion.div>

            {/* Connecting line */}
            {i < steps.length - 1 && (
              <motion.div
                initial={{ scaleY: 0 }}
                animate={isInView ? { scaleY: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.5 + i * 0.15 }}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 1,
                  height: 40,
                  background: isEven ? 'var(--accent)' : 'var(--gray-300)',
                  transformOrigin: 'top',
                  zIndex: 10,
                }}
              />
            )}
          </motion.div>
        )
      })}
    </section>
  )
}

export default HowItWorksSection
