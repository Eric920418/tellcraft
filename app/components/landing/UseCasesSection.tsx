'use client'

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, useInView } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { gsap } from 'gsap'
import RotatingText from '@/app/components/RotatingText'
import GlareHover from '@/app/components/GlareHover'
import { useIsMobile } from '@/app/hooks/useIsMobile'

/* ─── TargetCursor（Portal 渲染到 body，避免祖先 transform 干擾 fixed） ─── */

interface TargetCursorProps {
  targetSelector?: string
  spinDuration?: number
  hoverDuration?: number
  parallaxOn?: boolean
  containerRef: React.RefObject<HTMLElement | null>
}

const TargetCursor: React.FC<TargetCursorProps> = ({
  targetSelector = '.cursor-target',
  spinDuration = 2,
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
  const styleTagRef = useRef<HTMLStyleElement | null>(null)

  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const isSmallScreen = window.innerWidth <= 768
    return hasTouchScreen && isSmallScreen
  }, [])

  const constants = useMemo(() => ({ borderWidth: 3, cornerSize: 12 }), [])

  const moveCursor = useCallback((x: number, y: number) => {
    if (!cursorRef.current) return
    gsap.to(cursorRef.current, { x, y, duration: 0.1, ease: 'power3.out' })
  }, [])

  /* 主要邏輯 effect */
  useEffect(() => {
    if (isMobile || !mounted || !cursorRef.current) return

    const container = containerRef?.current
    if (!container) return

    const cursor = cursorRef.current
    cornersRef.current = cursor.querySelectorAll<HTMLDivElement>('.target-cursor-corner')

    let activeTarget: Element | null = null
    let currentLeaveHandler: (() => void) | null = null
    let resumeTimeout: ReturnType<typeof setTimeout> | null = null

    const cleanupTarget = (target: Element) => {
      if (currentLeaveHandler) target.removeEventListener('mouseleave', currentLeaveHandler)
      currentLeaveHandler = null
    }

    gsap.set(cursor, { xPercent: -50, yPercent: -50, x: window.innerWidth / 2, y: window.innerHeight / 2, opacity: 0 })

    const createSpinTimeline = () => {
      spinTl.current?.kill()
      spinTl.current = gsap.timeline({ repeat: -1 }).to(cursor, { rotation: '+=360', duration: spinDuration, ease: 'none' })
    }
    createSpinTimeline()

    /* ticker：吸附到目標四角 */
    const tickerFn = () => {
      if (!targetCornerPositionsRef.current || !cursorRef.current || !cornersRef.current) return
      const strength = activeStrengthRef.current.current
      if (strength === 0) return
      const cursorX = gsap.getProperty(cursorRef.current, 'x') as number
      const cursorY = gsap.getProperty(cursorRef.current, 'y') as number
      Array.from(cornersRef.current).forEach((corner, i) => {
        const cx = gsap.getProperty(corner, 'x') as number
        const cy = gsap.getProperty(corner, 'y') as number
        const tx = targetCornerPositionsRef.current![i].x - cursorX
        const ty = targetCornerPositionsRef.current![i].y - cursorY
        const fx = cx + (tx - cx) * strength
        const fy = cy + (ty - cy) * strength
        const dur = strength >= 0.99 ? (parallaxOn ? 0.2 : 0) : 0.05
        gsap.to(corner, { x: fx, y: fy, duration: dur, ease: dur === 0 ? 'none' : 'power1.out', overwrite: 'auto' })
      })
    }
    tickerFnRef.current = tickerFn

    /* cursor: none — 用 <style> + !important 覆蓋子元素 inline cursor */
    const containerId = 'usecases-cursor-scope'
    container.setAttribute('data-cursor-scope', containerId)

    const containerEnterHandler = () => {
      isInsideRef.current = true
      if (cursorRef.current) gsap.to(cursorRef.current, { opacity: 1, duration: 0.15 })
      if (!styleTagRef.current) {
        const tag = document.createElement('style')
        tag.textContent = `[data-cursor-scope="${containerId}"], [data-cursor-scope="${containerId}"] * { cursor: none !important; }`
        document.head.appendChild(tag)
        styleTagRef.current = tag
      }
    }
    const containerLeaveHandler = () => {
      isInsideRef.current = false
      if (cursorRef.current) gsap.to(cursorRef.current, { opacity: 0, duration: 0.15 })
      if (styleTagRef.current) { styleTagRef.current.remove(); styleTagRef.current = null }
      if (activeTarget && currentLeaveHandler) currentLeaveHandler()
    }
    container.addEventListener('mouseenter', containerEnterHandler)
    container.addEventListener('mouseleave', containerLeaveHandler)

    /* 滑鼠移動 */
    const moveHandler = (e: MouseEvent) => moveCursor(e.clientX, e.clientY)
    window.addEventListener('mousemove', moveHandler)

    /* 捲動偵測 */
    const scrollHandler = () => {
      if (!activeTarget || !cursorRef.current) return
      const mx = gsap.getProperty(cursorRef.current, 'x') as number
      const my = gsap.getProperty(cursorRef.current, 'y') as number
      const el = document.elementFromPoint(mx, my)
      if (!el || (el !== activeTarget && el.closest(targetSelector) !== activeTarget)) {
        currentLeaveHandler?.()
      }
    }
    window.addEventListener('scroll', scrollHandler, { passive: true })

    /* 點擊回饋 */
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

    /* hover 目標吸附 */
    const enterHandler = (e: MouseEvent) => {
      if (!isInsideRef.current) return
      let el: Element | null = e.target as Element
      let target: Element | null = null
      while (el && el !== document.body) {
        if (el.matches(targetSelector)) { target = el; break }
        el = el.parentElement
      }
      if (!target || !cursorRef.current || !cornersRef.current) return
      if (activeTarget === target) return
      if (activeTarget) cleanupTarget(activeTarget)
      if (resumeTimeout) { clearTimeout(resumeTimeout); resumeTimeout = null }

      activeTarget = target
      const corners = Array.from(cornersRef.current)
      corners.forEach(c => gsap.killTweensOf(c))
      gsap.killTweensOf(cursorRef.current, 'rotation')
      spinTl.current?.pause()
      gsap.set(cursorRef.current, { rotation: 0 })

      const rect = target.getBoundingClientRect()
      const { borderWidth, cornerSize } = constants
      const cx = gsap.getProperty(cursorRef.current, 'x') as number
      const cy = gsap.getProperty(cursorRef.current, 'y') as number

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
          x: targetCornerPositionsRef.current![i].x - cx,
          y: targetCornerPositionsRef.current![i].y - cy,
          duration: 0.2, ease: 'power2.out',
        })
      })

      const leaveHandler = () => {
        gsap.ticker.remove(tickerFnRef.current!)
        isActiveRef.current = false
        targetCornerPositionsRef.current = null
        gsap.set(activeStrengthRef.current, { current: 0, overwrite: true })
        activeTarget = null
        if (cornersRef.current) {
          const lCorners = Array.from(cornersRef.current)
          gsap.killTweensOf(lCorners)
          const { cornerSize: cs } = constants
          const positions = [
            { x: -cs * 1.5, y: -cs * 1.5 },
            { x: cs * 0.5, y: -cs * 1.5 },
            { x: cs * 0.5, y: cs * 0.5 },
            { x: -cs * 1.5, y: cs * 0.5 },
          ]
          const tl = gsap.timeline()
          lCorners.forEach((c, idx) => {
            tl.to(c, { x: positions[idx].x, y: positions[idx].y, duration: 0.3, ease: 'power3.out' }, 0)
          })
        }
        resumeTimeout = setTimeout(() => {
          if (!activeTarget && cursorRef.current && spinTl.current) {
            const rot = (gsap.getProperty(cursorRef.current, 'rotation') as number) % 360
            spinTl.current.kill()
            spinTl.current = gsap.timeline({ repeat: -1 }).to(cursorRef.current, { rotation: '+=360', duration: spinDuration, ease: 'none' })
            gsap.to(cursorRef.current, {
              rotation: rot + 360,
              duration: spinDuration * (1 - rot / 360),
              ease: 'none',
              onComplete: () => { spinTl.current?.restart() },
            })
          }
          resumeTimeout = null
        }, 50)
        cleanupTarget(target!)
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
      if (styleTagRef.current) { styleTagRef.current.remove(); styleTagRef.current = null }
      container.removeAttribute('data-cursor-scope')
      isActiveRef.current = false
      targetCornerPositionsRef.current = null
      activeStrengthRef.current.current = 0
    }
  }, [targetSelector, spinDuration, moveCursor, constants, isMobile, hoverDuration, parallaxOn, containerRef, mounted])

  if (isMobile || !mounted) return null

  return createPortal(
    <div
      ref={cursorRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        pointerEvents: 'none',
        zIndex: 99999,
        willChange: 'transform',
      }}
    >
      <div
        ref={dotRef}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 6,
          height: 6,
          background: 'var(--black)',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          willChange: 'transform',
        }}
      />
      {/* 四個角：左上、右上、右下、左下 */}
      {[
        { borderTop: '3px solid var(--black)', borderLeft: '3px solid var(--black)', tx: -18, ty: -18 },
        { borderTop: '3px solid var(--black)', borderRight: '3px solid var(--black)', tx: 6, ty: -18 },
        { borderBottom: '3px solid var(--black)', borderRight: '3px solid var(--black)', tx: 6, ty: 6 },
        { borderBottom: '3px solid var(--black)', borderLeft: '3px solid var(--black)', tx: -18, ty: 6 },
      ].map((s, i) => (
        <div
          key={i}
          className="target-cursor-corner"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 12,
            height: 12,
            ...s,
            transform: `translate(${s.tx}px, ${s.ty}px)`,
            willChange: 'transform',
          }}
        />
      ))}
    </div>,
    document.body,
  )
}

/* ─── UseCasesSection ─── */

function UseCasesSection() {
  const t = useTranslations('useCases')
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const isMobile = useIsMobile()

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
    <section ref={ref} style={{ padding: isMobile ? '48px 16px' : '80px 24px', background: 'var(--gray-50)' }}>
      <TargetCursor containerRef={ref} targetSelector=".cursor-target" />
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 80 }}
        >
          <div style={{
            fontSize: 11,
            color: 'var(--accent)',
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
                borderBottom: '2px solid var(--accent)',
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
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: isMobile ? 16 : 24,
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
                <article style={{ padding: isMobile ? 20 : 32, height: '100%' }}>
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
