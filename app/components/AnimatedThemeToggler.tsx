'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { flushSync } from 'react-dom'
import { motion } from 'framer-motion'

interface AnimatedThemeTogglerProps extends React.ComponentPropsWithoutRef<'button'> {
  duration?: number
}

export function AnimatedThemeToggler({
  duration = 400,
  style,
  ...props
}: AnimatedThemeTogglerProps) {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMounted(true)
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }

    updateTheme()

    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current) return

    // 檢查瀏覽器是否支援 View Transition API
    if (!document.startViewTransition) {
      // 不支援時使用簡單切換
      const newTheme = !isDark
      setIsDark(newTheme)
      document.documentElement.classList.toggle('dark')
      localStorage.setItem('theme', newTheme ? 'dark' : 'light')
      return
    }

    await document.startViewTransition(() => {
      flushSync(() => {
        const newTheme = !isDark
        setIsDark(newTheme)
        document.documentElement.classList.toggle('dark')
        localStorage.setItem('theme', newTheme ? 'dark' : 'light')
      })
    }).ready

    const { top, left, width, height } =
      buttonRef.current.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    const maxRadius = Math.hypot(
      Math.max(left, window.innerWidth - left),
      Math.max(top, window.innerHeight - top)
    )

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration,
        easing: 'ease-in-out',
        pseudoElement: '::view-transition-new(root)',
      }
    )
  }, [isDark, duration])

  const borderColor = 'var(--gray-400)'

  const buttonStyle: React.CSSProperties = {
    position: 'relative',
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: 'var(--black)',
    overflow: 'hidden',
    ...style,
  }

  const borderContent = (
    <>
      {/* Corner borders - Top Left */}
      <motion.span
        animate={{ width: isHovered ? '60%' : '50%' }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '20%',
          borderLeft: `1px solid ${borderColor}`,
          borderTop: `1px solid ${borderColor}`,
          pointerEvents: 'none',
        }}
      />
      {/* Corner borders - Top Right */}
      <motion.span
        animate={{ height: isHovered ? '90%' : '60%' }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '50%',
          borderRight: `1px solid ${borderColor}`,
          borderTop: `1px solid ${borderColor}`,
          pointerEvents: 'none',
        }}
      />
      {/* Corner borders - Bottom Left */}
      <motion.span
        animate={{ height: isHovered ? '90%' : '60%' }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '50%',
          borderLeft: `1px solid ${borderColor}`,
          borderBottom: `1px solid ${borderColor}`,
          pointerEvents: 'none',
        }}
      />
      {/* Corner borders - Bottom Right */}
      <motion.span
        animate={{ width: isHovered ? '60%' : '50%' }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          height: '20%',
          borderRight: `1px solid ${borderColor}`,
          borderBottom: `1px solid ${borderColor}`,
          pointerEvents: 'none',
        }}
      />
    </>
  )

  // 避免 hydration mismatch
  if (!mounted) {
    return (
      <button
        style={buttonStyle}
        {...props}
      >
        {borderContent}
        <span className="sr-only">Toggle theme</span>
      </button>
    )
  }

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      style={buttonStyle}
      aria-label={isDark ? '切換至淺色模式' : '切換至深色模式'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {borderContent}
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
