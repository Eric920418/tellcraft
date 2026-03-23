'use client'

import { useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { heavyEasing, HEAVY } from '@/app/lib/chat-utils'

function FAQItem({
  question,
  answer,
  isOpen,
  onClick,
  index,
  delay = 0
}: {
  question: string
  answer: string
  isOpen: boolean
  onClick: () => void
  index: number
  delay?: number
}) {
  const itemRef = useRef(null)
  const isInView = useInView(itemRef, { once: true, margin: '-50px' })

  return (
    <motion.div
      ref={itemRef}
      initial={{ opacity: 0, x: -24 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: HEAVY.durationSecondary, delay, ease: heavyEasing }}
      style={{
        display: 'grid',
        gridTemplateColumns: '80px 1fr',
        gap: 0,
        borderBottom: '1px solid var(--border-color)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Large Number */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 28,
        borderRight: '1px solid var(--border-color)',
        position: 'relative',
      }}>
        <motion.span
          animate={{
            color: isOpen ? 'var(--accent)' : 'var(--gray-300)',
            scale: isOpen ? 1.1 : 1,
          }}
          transition={{ duration: 0.3 }}
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 32,
            fontWeight: 300,
            letterSpacing: '-0.05em',
            lineHeight: 1,
          }}
        >
          {String(index + 1).padStart(2, '0')}
        </motion.span>
        {/* Animated line indicator */}
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: isOpen ? 1 : 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 2,
            background: 'var(--accent)',
            transformOrigin: 'top',
          }}
        />
      </div>

      {/* Content */}
      <div>
        <motion.button
          onClick={onClick}
          whileHover={{ x: 4 }}
          transition={{ duration: 0.2 }}
          style={{
            width: '100%',
            padding: '24px 24px 24px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span style={{
            fontSize: 17,
            fontWeight: 500,
            lineHeight: 1.4,
            flex: 1,
            color: 'var(--black)',
          }}>
            {question}
          </span>
          <motion.div
            animate={{
              rotate: isOpen ? 180 : 0,
            }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            style={{
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: 2,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              style={{ color: isOpen ? 'var(--black)' : 'var(--gray-400)' }}
            >
              <path
                d="M2 5L7 10L12 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
                opacity: { duration: 0.3, delay: 0.1 }
              }}
              style={{ overflow: 'hidden' }}
            >
              <motion.div
                initial={{ y: -10 }}
                animate={{ y: 0 }}
                exit={{ y: -10 }}
                transition={{ duration: 0.3 }}
                style={{
                  padding: '0 24px 28px 24px',
                }}
              >
                {/* Decorative line */}
                <div style={{
                  width: 40,
                  height: 1,
                  background: 'var(--accent)',
                  opacity: 0.4,
                  marginBottom: 16,
                }} />
                <p style={{
                  fontSize: 15,
                  color: 'var(--gray-500)',
                  lineHeight: 1.8,
                  maxWidth: '90%',
                }}>
                  {answer}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default FAQItem
