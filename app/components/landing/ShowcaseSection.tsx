'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useTranslations } from 'next-intl'
import BlurRevealText from './BlurRevealText'
import AnimatedCounter from './AnimatedCounter'
import CardSwap, { Card } from '@/app/components/CardSwap'

function ShowcaseSection() {
  const t = useTranslations('showcase')
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const showcases = [
    { title: t('item1Title'), category: t('item1Category'), description: t('item1Desc'), stats: t('item1Stats'), color: '#f5f5f5' },
    { title: t('item2Title'), category: t('item2Category'), description: t('item2Desc'), stats: t('item2Stats'), color: '#fafafa' },
    { title: t('item3Title'), category: t('item3Category'), description: t('item3Desc'), stats: t('item3Stats'), color: '#f8f8f8' },
    { title: t('item4Title'), category: t('item4Category'), description: t('item4Desc'), stats: t('item4Stats'), color: '#f5f5f5' },
  ]

  return (
    <section ref={ref} className="showcase-section" style={{ padding: '80px 24px', background: 'var(--white)', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="showcase-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 80,
          alignItems: 'center',
        }}>
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="showcase-text"
          >
            <div style={{
              fontSize: 11,
              color: 'var(--gray-400)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 16,
            }}>
              Showcase
            </div>
            <h2 style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 400,
              letterSpacing: '-0.03em',
              lineHeight: 1.3,
              marginBottom: 24,
            }}>
              <BlurRevealText text={t('heading1')} delay={0} />
              <br />
              <BlurRevealText text={t('heading2')} delay={0.15} />
            </h2>
            <p style={{
              fontSize: 16,
              color: 'var(--gray-500)',
              lineHeight: 1.7,
              marginBottom: 32,
              maxWidth: 400,
            }}>
              {t('description')}
            </p>
            <div className="showcase-stats" style={{
              display: 'flex',
              gap: 32,
              paddingTop: 24,
              borderTop: '1px solid var(--border-color)',
            }}>
              <div>
                <div style={{
                  fontSize: 32,
                  fontWeight: 300,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '-0.02em',
                }}>
                  <AnimatedCounter target={50} suffix="+" />
                </div>
                <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>{t('statsProjects')}</div>
              </div>
              <div>
                <div style={{
                  fontSize: 32,
                  fontWeight: 300,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '-0.02em',
                }}>
                  <AnimatedCounter target={12} suffix={t('suffixTypes')} />
                </div>
                <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>{t('statsIndustries')}</div>
              </div>
            </div>
          </motion.div>

          {/* Right: Card Swap */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="showcase-cards"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 450,
              position: 'relative',
            }}
          >
            <CardSwap
              width="min(360px, calc(100vw - 80px))"
              height="min(280px, 65vw)"
              cardDistance={45}
              verticalDistance={55}
              delay={2500}
              pauseOnHover={true}
              skewAmount={3}
              easing="linear"
            >
              {showcases.map((item, i) => (
                <Card key={i}>
                  <div style={{
                    padding: 28,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background: item.color,
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 16,
                    }}>
                      <span style={{
                        fontSize: 11,
                        padding: '4px 8px',
                        background: 'var(--white)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--gray-500)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>
                        {item.category}
                      </span>
                      <span style={{
                        fontSize: 12,
                        color: 'var(--gray-400)',
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {item.stats}
                      </span>
                    </div>
                    <h3 style={{
                      fontSize: 20,
                      fontWeight: 500,
                      marginBottom: 12,
                      letterSpacing: '-0.02em',
                    }}>
                      {item.title}
                    </h3>
                    <p style={{
                      fontSize: 14,
                      color: 'var(--gray-500)',
                      lineHeight: 1.6,
                      flex: 1,
                    }}>
                      {item.description}
                    </p>
                    <div style={{
                      marginTop: 16,
                      paddingTop: 16,
                      borderTop: '1px solid var(--border-color)',
                      fontSize: 13,
                      color: 'var(--gray-400)',
                    }}>
                      {t('cardHint')}
                    </div>
                  </div>
                </Card>
              ))}
            </CardSwap>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default ShowcaseSection
