'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'

interface GlowButtonProps {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  variant?: 'default' | 'outline'
  size?: 'sm' | 'md'
  style?: React.CSSProperties
}

export function GlowButton({
  children,
  onClick,
  href,
  variant = 'default',
  size = 'md',
  style = {}
}: GlowButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  const isOutline = variant === 'outline'
  const padding = size === 'sm' ? '8px 16px' : '12px 24px'
  const fontSize = size === 'sm' ? 13 : 14

  const baseStyles: React.CSSProperties = {
    position: 'relative',
    cursor: 'pointer',
    padding,
    fontSize,
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: isOutline ? 'var(--black)' : 'var(--white)',
    background: isOutline ? 'transparent' : 'var(--black)',
    border: 'none',
    overflow: 'hidden',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    transition: 'all 0.3s ease',
    ...style
  }

  const borderColor = isOutline ? 'var(--black)' : 'var(--gray-400)'

  const content = (
    <>
      {/* Text content */}
      <span style={{ position: 'relative', zIndex: 20 }}>{children}</span>

      {/* Shine effect */}
      <motion.span
        initial={{ left: '-75%' }}
        animate={{ left: isHovered ? '125%' : '-75%' }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: 0,
          height: '100%',
          width: '50%',
          background: isOutline
            ? 'linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          transform: 'skewX(-12deg)',
          zIndex: 10,
          filter: 'blur(8px)',
        }}
      />

      {/* Corner borders - Top Left */}
      <motion.span
        animate={{ width: isHovered ? '60%' : '50%' }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '20%',
          borderLeft: `2px solid ${borderColor}`,
          borderTop: `2px solid ${borderColor}`,
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
          borderRight: `2px solid ${borderColor}`,
          borderTop: `2px solid ${borderColor}`,
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
          borderLeft: `2px solid ${borderColor}`,
          borderBottom: `2px solid ${borderColor}`,
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
          borderRight: `2px solid ${borderColor}`,
          borderBottom: `2px solid ${borderColor}`,
        }}
      />
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        style={baseStyles}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {content}
      </a>
    )
  }

  return (
    <button
      onClick={onClick}
      style={baseStyles}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {content}
    </button>
  )
}

export default GlowButton
