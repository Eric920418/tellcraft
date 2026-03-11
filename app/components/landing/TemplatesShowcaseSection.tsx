'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { getTemplates } from '@/app/actions/templates'
import { INITIAL_TEMPLATES, toTemplateCardData, type TemplateCardData } from '@/app/lib/templates'

function TemplateCard({ card }: { card: TemplateCardData }) {
  const categoryColors: Record<string, string> = {
    saas: '#6366f1',
    landing: '#0ea5e9',
    ecommerce: '#10b981',
    content: '#f59e0b',
    portfolio: '#ec4899',
    dashboard: '#8b5cf6',
    blog: '#14b8a6',
    event: '#f97316',
    tool: '#64748b',
  }
  const badgeColor = categoryColors[card.category] ?? '#64748b'

  return (
    <motion.div
      whileHover={{ scale: 1.03, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
      transition={{ duration: 0.2 }}
      style={{
        width: 260,
        flexShrink: 0,
        borderRadius: 12,
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        background: 'var(--bg-secondary, #fff)',
        cursor: 'pointer',
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          aspectRatio: '16/9',
          overflow: 'hidden',
          background: card.thumbnailUrl
            ? 'transparent'
            : `linear-gradient(135deg, ${badgeColor}22, ${badgeColor}44)`,
        }}
      >
        {card.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.thumbnailUrl}
            alt={card.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            loading="lazy"
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              opacity: 0.3,
            }}
          >
            ▤
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--black)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {card.name}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            padding: '2px 8px',
            borderRadius: 999,
            background: `${badgeColor}18`,
            color: badgeColor,
            flexShrink: 0,
          }}
        >
          {card.category}
        </span>
      </div>
    </motion.div>
  )
}

interface MarqueeRowProps {
  cards: TemplateCardData[]
  direction: 'left' | 'right'
  duration?: number
}

function MarqueeRow({ cards, direction, duration = 35 }: MarqueeRowProps) {
  const [paused, setPaused] = useState(false)
  const animName = direction === 'left' ? 'tc-scroll-left' : 'tc-scroll-right'

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ overflow: 'hidden', width: '100%' }}
    >
      <div
        style={{
          display: 'flex',
          gap: 16,
          width: 'max-content',
          animation: `${animName} ${duration}s linear infinite`,
          animationPlayState: paused ? 'paused' : 'running',
        }}
      >
        {[...cards, ...cards].map((card, i) => (
          <TemplateCard key={`${card.id}-${i}`} card={card} />
        ))}
      </div>
    </div>
  )
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function TemplatesShowcaseSection() {
  const [row1, setRow1] = useState<TemplateCardData[]>([])
  const [row2, setRow2] = useState<TemplateCardData[]>([])
  const [loaded, setLoaded] = useState(false)

  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' })

  useEffect(() => {
    const staticFallback = INITIAL_TEMPLATES.filter(t => t.isActive).map(toTemplateCardData)

    getTemplates().then(result => {
      const data = (result.success && result.data && result.data.length > 0)
        ? result.data
        : staticFallback
      const shuffled = shuffle(data)
      // Duplicate small datasets so each row has enough cards for marquee
      const padded = shuffled.length < 8
        ? [...shuffled, ...shuffled, ...shuffled, ...shuffled]
        : shuffled
      const take = padded.slice(0, 16)
      const half = Math.ceil(take.length / 2)
      setRow1(take.slice(0, half))
      setRow2(take.slice(half))
      setLoaded(true)
    }).catch(() => {
      const shuffled = shuffle(staticFallback)
      const padded = [...shuffled, ...shuffled, ...shuffled, ...shuffled]
      const take = padded.slice(0, 16)
      const half = Math.ceil(take.length / 2)
      setRow1(take.slice(0, half))
      setRow2(take.slice(half))
      setLoaded(true)
    })
  }, [])

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: isInView ? { opacity: 1, y: 0 } : {},
    transition: { duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  })

  if (!loaded) return null

  return (
    <section ref={sectionRef} style={{ padding: '80px 0', overflow: 'hidden' }}>
      <style>{`
        @keyframes tc-scroll-left {
          0%   { transform: translateX(0) }
          100% { transform: translateX(-50%) }
        }
        @keyframes tc-scroll-right {
          0%   { transform: translateX(-50%) }
          100% { transform: translateX(0) }
        }
      `}</style>

      {/* Header */}
      <div style={{ padding: '0 24px', textAlign: 'center', marginBottom: 48 }}>
        <motion.div {...fadeUp(0)} style={{
          fontSize: 11,
          color: 'var(--gray-400)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: 16,
          fontFamily: 'var(--font-mono)',
        }}>
          Templates
        </motion.div>

        <motion.h2
          {...fadeUp(0.15)}
          style={{
            fontSize: 'clamp(26px, 3.5vw, 38px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--black)',
            margin: 0,
          }}
        >
          從模板開始，快速落地
        </motion.h2>

        <motion.p {...fadeUp(0.25)} style={{
          marginTop: 12,
          fontSize: 15,
          color: 'var(--gray-400)',
          maxWidth: 480,
          margin: '12px auto 0',
          lineHeight: 1.6,
        }}>
          精選設計模板，一句話描述需求即可套用並完整客製化
        </motion.p>
      </div>

      {/* Marquee rows */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.35 }}
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        {row1.length > 0 && <MarqueeRow cards={row1} direction="left" duration={35} />}

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.45 }}
        >
          {row2.length > 0 && <MarqueeRow cards={row2} direction="right" duration={42} />}
        </motion.div>
      </motion.div>

      {/* CTA */}
      <motion.div
        {...fadeUp(0.5)}
        style={{ textAlign: 'center', marginTop: 40 }}
      >
        <a
          href="/templates"
          style={{
            fontSize: 14,
            color: 'var(--gray-400)',
            textDecoration: 'none',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: 2,
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--black)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--gray-400)')}
        >
          瀏覽所有模板 →
        </a>
      </motion.div>
    </section>
  )
}
