'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function ProcessStep({
  step,
  title,
  active,
  completed,
  isLast = false
}: {
  step: number
  title: string
  active: boolean
  completed: boolean
  isLast?: boolean
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 步驟容器 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        position: 'relative',
        padding: '6px 0',
      }}>
        {/* 方形指示器 */}
        <div style={{
          width: 20,
          height: 20,
          position: 'relative',
          flexShrink: 0,
        }}>
          {/* 背景填充 */}
          <motion.div
            initial={false}
            animate={{
              backgroundColor: completed ? 'var(--black)' : 'transparent',
            }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              inset: 0,
            }}
          />

          {/* 角落邊框 - 左上 */}
          <motion.span
            initial={false}
            animate={{
              width: active || isHovered ? '60%' : '40%',
              borderColor: completed || active ? 'var(--black)' : 'var(--gray-300)',
            }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '40%',
              borderLeft: '1px solid',
              borderTop: '1px solid',
            }}
          />

          {/* 角落邊框 - 右上 */}
          <motion.span
            initial={false}
            animate={{
              height: active || isHovered ? '60%' : '40%',
              borderColor: completed || active ? 'var(--black)' : 'var(--gray-300)',
            }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '40%',
              borderRight: '1px solid',
              borderTop: '1px solid',
            }}
          />

          {/* 角落邊框 - 左下 */}
          <motion.span
            initial={false}
            animate={{
              height: active || isHovered ? '60%' : '40%',
              borderColor: completed || active ? 'var(--black)' : 'var(--gray-300)',
            }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '40%',
              borderLeft: '1px solid',
              borderBottom: '1px solid',
            }}
          />

          {/* 角落邊框 - 右下 */}
          <motion.span
            initial={false}
            animate={{
              width: active || isHovered ? '60%' : '40%',
              borderColor: completed || active ? 'var(--black)' : 'var(--gray-300)',
            }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              height: '40%',
              borderRight: '1px solid',
              borderBottom: '1px solid',
            }}
          />

          {/* 內容 */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <AnimatePresence mode="wait">
              {completed ? (
                <motion.svg
                  key="check"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--white)"
                  strokeWidth="3"
                  strokeLinecap="square"
                >
                  <polyline points="20 6 9 17 4 12" />
                </motion.svg>
              ) : (
                <motion.span
                  key="number"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    fontFamily: 'var(--font-mono)',
                    color: active ? 'var(--black)' : 'var(--gray-400)',
                    letterSpacing: '0.02em',
                  }}
                >
                  {step}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 標題 */}
        <motion.span
          initial={false}
          animate={{
            color: completed || active ? 'var(--black)' : 'var(--gray-400)',
          }}
          transition={{ duration: 0.2 }}
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </motion.span>
      </div>

      {/* 連接線 */}
      {!isLast && (
        <div style={{
          width: 24,
          height: 1,
          marginLeft: 10,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* 背景線（虛線效果） */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'repeating-linear-gradient(90deg, var(--gray-200) 0, var(--gray-200) 3px, transparent 3px, transparent 6px)',
          }} />
          {/* 進度線 */}
          <motion.div
            initial={false}
            animate={{
              scaleX: completed ? 1 : 0,
              transformOrigin: 'left',
            }}
            transition={{ duration: 0.4, delay: completed ? 0.1 : 0 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--black)',
            }}
          />
        </div>
      )}
    </div>
  )
}

export default ProcessStep
