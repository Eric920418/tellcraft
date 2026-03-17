'use client'

import React, { useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, useInView } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { gsap } from 'gsap'
import RotatingText from '@/app/components/RotatingText'
import GlareHover from '@/app/components/GlareHover'

/* ─── TargetCursor ─── */

interface TargetCursorProps {
  targetSelector?: string
  spinDuration?: number
  hideDefaultCursor?: boolean
  hoverDuration?: number
  parallaxOn?: boolean
  containerRef?: React.RefObject<HTMLElement | null>
}

const TargetCursor: React.FC<TargetCursorProps> = ({
  targetSelector = '.cursor-target',
  spinDuration = 2,
  hideDefaultCursor = true,
  hoverDuration = 0.2,
  parallaxOn = true,
  containerRef,
}) => {
  const cursorRef = useRef<HTMLDivElement>(null)
  const cornersRef = useRef<NodeListOf<HTMLDivElement> | null>(null)
  const spinTl = useRef<gsap.core.Timeline | null>(null)
  const dotRef = useRef<HTMLDivElement>(null)

  const isActiveRef = useRef(false)
  const targetCornerPositionsRef = useRef<{ x: number; y: number }[] | null>(null)
  const tickerFnRef = useRef<(() => void) | null>(null)
  const activeStrengthRef = useRef({ current: 0 })
  const isInsideRef = useRef(false)

  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const isSmallScreen = window.innerWidth <= 768
    const userAgent = navigator.userAgent || navigator.vendor || (window as unknown as { opera: string }).opera
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
    const isMobileUserAgent = mobileRegex.test(userAgent?.toLowerCase?.() ?? '')
    return (hasTouchScreen && isSmallScreen) || isMobileUserAgent
  }, [])

  const constants = useMemo(() => ({ borderWidth: 3, cornerSize: 12 }), [])

  const moveCursor = useCallback((x: number, y: number) => {
    if (!cursorRef.current) return
    gsap.to(cursorRef.current, { x, y, duration: 0.1, ease: 'power3.out' })
  }, [])

  useEffect(() => {
    if (isMobile || !cursorRef.current) return

    const container = containerRef?.current
    if (!container) return

    const cursor = cursorRef.current
    cornersRef.current = cursor.querySelectorAll<HTMLDivElement>('.target-cursor-corner')

    let activeTarget: Element | null = null
    let currentLeaveHandler: (() => void) | null = null
    let resumeTimeout: ReturnType<typeof setTimeout> | null = null

    const cleanupTarget = (target: Element) => {
      if (currentLeaveHandler) {
        target.removeEventListener('mouseleave', currentLeaveHandler)
      }
      currentLeaveHandler = null
    }

    gsap.set(cursor, { xPercent: -50, yPercent: -50, x: window.innerWidth / 2, y: window.innerHeight / 2 })

    const createSpinTimeline = () => {
      if (spinTl.current) spinTl.current.kill()
      spinTl.current = gsap
        .timeline({ repeat: -1 })
        .to(cursor, { rotation: '+=360', duration: spinDuration, ease: 'none' })
    }
    createSpinTimeline()

    const tickerFn = () => {
      if (!targetCornerPositionsRef.current || !cursorRef.current || !cornersRef.current) return
      const strength = activeStrengthRef.current.current
      if (strength === 0) return
      const cursorX = gsap.getProperty(cursorRef.current, 'x') as number
      const cursorY = gsap.getProperty(cursorRef.current, 'y') as number
      const corners = Array.from(cornersRef.current)
      corners.forEach((corner, i) => {
        const currentX = gsap.getProperty(corner, 'x') as number
        const currentY = gsap.getProperty(corner, 'y') as number
        const targetX = targetCornerPositionsRef.current![i].x - cursorX
        const targetY = targetCornerPositionsRef.current![i].y - cursorY
        const finalX = currentX + (targetX - currentX) * strength
        const finalY = currentY + (targetY - currentY) * strength
        const duration = strength >= 0.99 ? (parallaxOn ? 0.2 : 0) : 0.05
        gsap.to(corner, { x: finalX, y: finalY, duration, ease: duration === 0 ? 'none' : 'power1.out', overwrite: 'auto' })
      })
    }
    tickerFnRef.current = tickerFn

    /* 只在 container 區域內顯示游標 + 隱藏原生游標 */
    const containerEnterHandler = () => {
      isInsideRef.current = true
      if (cursorRef.current) gsap.to(cursorRef.current, { opacity: 1, duration: 0.2 })
      if (hideDefaultCursor) container.style.cursor = 'none'
    }
    const containerLeaveHandler = () => {
      isInsideRef.current = false
      if (cursorRef.current) gsap.to(cursorRef.current, { opacity: 0, duration: 0.2 })
      container.style.cursor = ''
      /* 觸發 leave cleanup 如果正在吸附 */
      if (activeTarget && currentLeaveHandler) currentLeaveHandler()
    }
    container.addEventListener('mouseenter', containerEnterHandler)
    container.addEventListener('mouseleave', containerLeaveHandler)

    gsap.set(cursor, { opacity: 0 })

    const moveHandler = (e: MouseEvent) => moveCursor(e.clientX, e.clientY)
    window.addEventListener('mousemove', moveHandler)

    const scrollHandler = () => {
      if (!activeTarget || !cursorRef.current) return
      const mouseX = gsap.getProperty(cursorRef.current, 'x') as number
      const mouseY = gsap.getProperty(cursorRef.current, 'y') as number
      const elementUnderMouse = document.elementFromPoint(mouseX, mouseY)
      const isStillOverTarget =
        elementUnderMouse &&
        (elementUnderMouse === activeTarget || elementUnderMouse.closest(targetSelector) === activeTarget)
      if (!isStillOverTarget) currentLeaveHandler?.()
    }
    window.addEventListener('scroll', scrollHandler, { passive: true })

    const mouseDownHandler = () => {
      if (!isInsideRef.current) return
      if (dotRef.current) gsap.to(dotRef.current, { scale: 0.7, duration: 0.3 })
      if (cursorRef.current) gsap.to(cursorRef.current, { scale: 0.9, duration: 0.2 })
    }
    const mouseUpHandler = () => {
      if (!isInsideRef.current) return
      if (dotRef.current) gsap.to(dotRef.current, { scale: 1, duration: 0.3 })
      if (cursorRef.current) gsap.to(cursorRef.current, { scale: 1, duration: 0.2 })
    }
    window.addEventListener('mousedown', mouseDownHandler)
    window.addEventListener('mouseup', mouseUpHandler)

    const enterHandler = (e: MouseEvent) => {
      if (!isInsideRef.current) return
      const directTarget = e.target as Element
      const allTargets: Element[] = []
      let current: Element | null = directTarget
      while (current && current !== document.body) {
        if (current.matches(targetSelector)) allTargets.push(current)
        current = current.parentElement
      }
      const target = allTargets[0] || null
      if (!target || !cursorRef.current || !cornersRef.current) return
      if (activeTarget === target) return
      if (activeTarget) cleanupTarget(activeTarget)
      if (resumeTimeout) { clearTimeout(resumeTimeout); resumeTimeout = null }

      activeTarget = target
      const corners = Array.from(cornersRef.current)
      corners.forEach(corner => gsap.killTweensOf(corner))
      gsap.killTweensOf(cursorRef.current, 'rotation')
      spinTl.current?.pause()
      gsap.set(cursorRef.current, { rotation: 0 })

      const rect = target.getBoundingClientRect()
      const { borderWidth, cornerSize } = constants
      const cursorX = gsap.getProperty(cursorRef.current, 'x') as number
      const cursorY = gsap.getProperty(cursorRef.current, 'y') as number

      targetCornerPositionsRef.current = [
        { x: rect.left - borderWidth, y: rect.top - borderWidth },
        { x: rect.right + borderWidth - cornerSize, y: rect.top - borderWidth },
        { x: rect.right + borderWidth - cornerSize, y: rect.bottom + borderWidth - cornerSize },
        { x: rect.left - borderWidth, y: rect.bottom + borderWidth - cornerSize },
      ]

      isActiveRef.current = true
      gsap.ticker.add(tickerFnRef.current!)
      gsap.to(activeStrengthRef.current, { current: 1, duration: hoverDuration, ease: 'power2.out' })

      corners.forEach((corner, i) => {
        gsap.to(corner, {
          x: targetCornerPositionsRef.current![i].x - cursorX,
          y: targetCornerPositionsRef.current![i].y - cursorY,
          duration: 0.2,
          ease: 'power2.out',
        })
      })

      const leaveHandler = () => {
        gsap.ticker.remove(tickerFnRef.current!)
        isActiveRef.current = false
        targetCornerPositionsRef.current = null
        gsap.set(activeStrengthRef.current, { current: 0, overwrite: true })
        activeTarget = null
        if (cornersRef.current) {
          const corners = Array.from(cornersRef.current)
          gsap.killTweensOf(corners)
          const { cornerSize } = constants
          const positions = [
            { x: -cornerSize * 1.5, y: -cornerSize * 1.5 },
            { x: cornerSize * 0.5, y: -cornerSize * 1.5 },
            { x: cornerSize * 0.5, y: cornerSize * 0.5 },
            { x: -cornerSize * 1.5, y: cornerSize * 0.5 },
          ]
          const tl = gsap.timeline()
          corners.forEach((corner, index) => {
            tl.to(corner, { x: positions[index].x, y: positions[index].y, duration: 0.3, ease: 'power3.out' }, 0)
          })
        }
        resumeTimeout = setTimeout(() => {
          if (!activeTarget && cursorRef.current && spinTl.current) {
            const currentRotation = gsap.getProperty(cursorRef.current, 'rotation') as number
            const normalizedRotation = currentRotation % 360
            spinTl.current.kill()
            spinTl.current = gsap
              .timeline({ repeat: -1 })
              .to(cursorRef.current, { rotation: '+=360', duration: spinDuration, ease: 'none' })
            gsap.to(cursorRef.current, {
              rotation: normalizedRotation + 360,
              duration: spinDuration * (1 - normalizedRotation / 360),
              ease: 'none',
              onComplete: () => { spinTl.current?.restart() },
            })
          }
          resumeTimeout = null
        }, 50)
        cleanupTarget(target)
      }
      currentLeaveHandler = leaveHandler
      target.addEventListener('mouseleave', leaveHandler)
    }

    container.addEventListener('mouseover', enterHandler as EventListener)

    return () => {
      if (tickerFnRef.current) gsap.ticker.remove(tickerFnRef.current)
      window.removeEventListener('mousemove', moveHandler)
      container.removeEventListener('mouseover', enterHandler as EventListener)
      container.removeEventListener('mouseenter', containerEnterHandler)
      container.removeEventListener('mouseleave', containerLeaveHandler)
      window.removeEventListener('scroll', scrollHandler)
      window.removeEventListener('mousedown', mouseDownHandler)
      window.removeEventListener('mouseup', mouseUpHandler)
      if (activeTarget) cleanupTarget(activeTarget)
      spinTl.current?.kill()
      container.style.cursor = ''
      isActiveRef.current = false
      targetCornerPositionsRef.current = null
      activeStrengthRef.current.current = 0
    }
  }, [targetSelector, spinDuration, moveCursor, constants, hideDefaultCursor, isMobile, hoverDuration, parallaxOn, containerRef])

  useEffect(() => {
    if (isMobile || !cursorRef.current || !spinTl.current) return
    if (spinTl.current.isActive()) {
      spinTl.current.kill()
      spinTl.current = gsap
        .timeline({ repeat: -1 })
        .to(cursorRef.current, { rotation: '+=360', duration: spinDuration, ease: 'none' })
    }
  }, [spinDuration, isMobile])

  if (isMobile) return null

  return (
    <div ref={cursorRef} className="fixed top-0 left-0 w-0 h-0 pointer-events-none z-[9999]" style={{ willChange: 'transform' }}>
      <div ref={dotRef} className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" style={{ willChange: 'transform' }} />
      <div className="target-cursor-corner absolute top-1/2 left-1/2 w-3 h-3 border-[3px] border-white -translate-x-[150%] -translate-y-[150%] border-r-0 border-b-0" style={{ willChange: 'transform' }} />
      <div className="target-cursor-corner absolute top-1/2 left-1/2 w-3 h-3 border-[3px] border-white translate-x-1/2 -translate-y-[150%] border-l-0 border-b-0" style={{ willChange: 'transform' }} />
      <div className="target-cursor-corner absolute top-1/2 left-1/2 w-3 h-3 border-[3px] border-white translate-x-1/2 translate-y-1/2 border-l-0 border-t-0" style={{ willChange: 'transform' }} />
      <div className="target-cursor-corner absolute top-1/2 left-1/2 w-3 h-3 border-[3px] border-white -translate-x-[150%] translate-y-1/2 border-r-0 border-t-0" style={{ willChange: 'transform' }} />
    </div>
  )
}

/* ─── UseCasesSection ─── */

function UseCasesSection() {
  const t = useTranslations('useCases')
  const ref = useRef<HTMLElement>(null)
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
    <section ref={ref} style={{ padding: '80px 24px', background: 'var(--gray-50)', position: 'relative' }}>
      <TargetCursor containerRef={ref} targetSelector=".cursor-target" />
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
                className="cursor-target"
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
