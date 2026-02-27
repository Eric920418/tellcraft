'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'

// 階段定義（對應 orchestrator 的 formulation 流程）
const STAGE_IDS = ['prepare', 'schema', 'features', 'validate', 'complete'] as const

function useStages() {
  const t = useTranslations('specGeneration')
  return [
    { id: 'prepare', label: t('stagePrepareLabel'), description: t('stagePrepareDesc') },
    { id: 'schema', label: t('stageSchemaLabel'), description: t('stageSchemaDesc') },
    { id: 'features', label: t('stageFeaturesLabel'), description: t('stageFeaturesDesc') },
    { id: 'validate', label: t('stageValidateLabel'), description: t('stageValidateDesc') },
    { id: 'complete', label: t('stageCompleteLabel'), description: t('stageCompleteDesc') },
  ]
}

interface SpecGenerationViewProps {
  currentStage?: number // 0-4，對應 STAGES 索引
  onComplete?: () => void
}

// 進度指示器
function StageIndicator({ stage, index, isActive, isPast }: {
  stage: { id: string; label: string; description: string }
  index: number
  isActive: boolean
  isPast: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 + 0.2 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '16px 20px',
        background: isActive ? 'var(--gray-50)' : 'transparent',
        border: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
        position: 'relative',
        transition: 'all 0.3s ease',
        opacity: isPast ? 0.4 : 1,
      }}
    >
      {/* 序號 */}
      <div style={{
        width: 28,
        height: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        fontWeight: 500,
        color: isActive ? 'var(--black)' : isPast ? 'var(--gray-400)' : 'var(--gray-500)',
        border: `1px solid ${isActive ? 'var(--black)' : 'var(--border-color)'}`,
        position: 'relative',
      }}>
        {isPast ? (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500 }}
          >
            ✓
          </motion.span>
        ) : (
          <span>{String(index + 1).padStart(2, '0')}</span>
        )}
      </div>

      {/* 文字 */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 14,
          fontWeight: isActive ? 500 : 400,
          color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
          marginBottom: 2,
        }}>
          {stage.label}
        </div>
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                fontSize: 12,
                color: 'var(--text-light)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {stage.description}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 當前階段指示 */}
      {isActive && (
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            width: 6,
            height: 6,
            background: 'var(--black)',
          }}
        />
      )}
    </motion.div>
  )
}

// 動態標題
function AnimatedTitle() {
  const t = useTranslations('specGeneration')
  const words = [t('wordAnalyze'), t('wordOrganize'), t('wordConstruct'), t('wordGenerate')]
  const [currentWord, setCurrentWord] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % words.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'baseline',
      gap: 8,
      fontSize: 24,
      fontWeight: 300,
      color: 'var(--text-primary)',
      letterSpacing: '-0.02em',
    }}>
      <span style={{ opacity: 0.6 }}>{t('aiPrefix')}</span>
      <span style={{
        position: 'relative',
        display: 'inline-block',
        minWidth: 56,
        fontWeight: 400,
        overflow: 'hidden',
      }}>
        <AnimatePresence mode="wait">
          <motion.span
            key={currentWord}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'inline-block' }}
          >
            {words[currentWord]}
          </motion.span>
        </AnimatePresence>
      </span>
      <span style={{ opacity: 0.6 }}>{t('aiSuffix')}</span>
    </div>
  )
}

// 底部提示
function BottomHint() {
  const t = useTranslations('specGeneration')
  const hints = [t('hintBlueprint'), t('hintRecorded'), t('hintNoAmbiguity')]
  const [currentHint, setCurrentHint] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHint((prev) => (prev + 1) % hints.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      position: 'absolute',
      bottom: 48,
      left: '50%',
      transform: 'translateX(-50%)',
      textAlign: 'center',
    }}>
      <AnimatePresence mode="wait">
        <motion.p
          key={currentHint}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
          style={{
            fontSize: 13,
            color: 'var(--text-light)',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.02em',
          }}
        >
          {hints[currentHint]}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}

// 角落裝飾（類似 GlowButton）
function CornerFrame() {
  return (
    <>
      {/* 左上 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 60,
        height: 60,
        borderLeft: '1px solid var(--border-color)',
        borderTop: '1px solid var(--border-color)',
      }} />
      {/* 右上 */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 60,
        height: 60,
        borderRight: '1px solid var(--border-color)',
        borderTop: '1px solid var(--border-color)',
      }} />
      {/* 左下 */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: 60,
        height: 60,
        borderLeft: '1px solid var(--border-color)',
        borderBottom: '1px solid var(--border-color)',
      }} />
      {/* 右下 */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 60,
        height: 60,
        borderRight: '1px solid var(--border-color)',
        borderBottom: '1px solid var(--border-color)',
      }} />
    </>
  )
}

export function SpecGenerationView({ currentStage = 0, onComplete }: SpecGenerationViewProps) {
  const stages = useStages()
  const [internalStage, setInternalStage] = useState(currentStage)

  // Demo 模式：自動推進階段
  useEffect(() => {
    if (currentStage === undefined) {
      const interval = setInterval(() => {
        setInternalStage((prev) => {
          if (prev >= STAGE_IDS.length - 1) {
            onComplete?.()
            return prev
          }
          return prev + 1
        })
      }, 3000)
      return () => clearInterval(interval)
    } else {
      setInternalStage(currentStage)
    }
  }, [currentStage, onComplete])

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-sans)',
      zIndex: 9999,
    }}>
      <CornerFrame />

      {/* 主內容 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 48,
        maxWidth: 400,
        padding: 24,
      }}>
        {/* 標題 */}
        <AnimatedTitle />

        {/* 進度條 */}
        <div style={{ width: '100%' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            marginBottom: 8,
          }}>
            <span style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-light)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}>
              Progress
            </span>
            <span style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
            }}>
              {internalStage + 1}/{stages.length}
            </span>
          </div>
          <div style={{
            height: 2,
            background: 'var(--gray-200)',
            position: 'relative',
          }}>
            <motion.div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                background: 'var(--black)',
              }}
              animate={{
                width: `${((internalStage + 1) / stages.length) * 100}%`,
              }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* 階段列表 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
        }}>
          {stages.map((stage, index) => (
            <StageIndicator
              key={stage.id}
              stage={stage}
              index={index}
              isActive={index === internalStage}
              isPast={index < internalStage}
            />
          ))}
        </div>
      </div>

      <BottomHint />
    </div>
  )
}

export default SpecGenerationView
