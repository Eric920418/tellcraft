'use client'

import { motion, AnimatePresence } from 'framer-motion'

// ============================================================
// Fast Build 工程藍圖風三階段進度元件
// ============================================================

interface FastBuildProgressProps {
  phase: 'structure' | 'animation' | 'rwd' | 'quality_gate' | 'complete'
  progress: { current: number; total: number; step: string }
  streamingChunks?: number
}

const PHASES = [
  { key: 'structure', label: '骨架', icon: '🏗️' },
  { key: 'animation', label: '動效', icon: '✨' },
  { key: 'rwd', label: '適配', icon: '📱' },
] as const

const PHASE_INDEX: Record<string, number> = {
  structure: 0,
  animation: 1,
  rwd: 2,
  quality_gate: 2,
  complete: 3,
}

const PHASE_DESCRIPTIONS: Record<string, string[]> = {
  structure: [
    '正在搭建頁面結構...',
    '正在生成 Hero Section...',
    '正在處理導航欄...',
    '正在構建內容區塊...',
    '正在添加互動元素...',
  ],
  animation: [
    '正在添加入場動畫...',
    '正在設定滾動效果...',
    '正在處理過渡動畫...',
    '正在增強視覺回饋...',
  ],
  rwd: [
    '正在優化手機版佈局...',
    '正在調整平板斷點...',
    '正在確保文字可讀性...',
    '正在測試響應式間距...',
  ],
  quality_gate: [
    '正在執行品質檢查...',
  ],
  complete: [
    '生成完成！',
  ],
}

export default function FastBuildProgress({ phase, progress, streamingChunks = 0 }: FastBuildProgressProps) {
  const currentPhaseIndex = PHASE_INDEX[phase] ?? 0
  const percent = phase === 'complete' ? 100 : Math.min(95, Math.round(((progress.current - 1) / progress.total) * 100 + (streamingChunks * 2)))
  const descriptions = PHASE_DESCRIPTIONS[phase] || PHASE_DESCRIPTIONS.structure
  const descIndex = Math.min(streamingChunks, descriptions.length - 1)

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--gray-50)',
      padding: 32,
      fontFamily: 'var(--font-mono, monospace)',
    }}>
      {/* 標題 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: 'var(--black)',
          marginBottom: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span>建站中</span>
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          ...
        </motion.span>
      </motion.div>

      {/* 三階段節點 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        marginBottom: 40,
      }}>
        {PHASES.map((p, i) => {
          const isCompleted = currentPhaseIndex > i
          const isActive = currentPhaseIndex === i
          const isPending = currentPhaseIndex < i

          return (
            <div key={p.key} style={{ display: 'flex', alignItems: 'center' }}>
              {/* 節點 */}
              <motion.div
                animate={isActive ? {
                  scale: [1, 1.08, 1],
                  boxShadow: [
                    '0 0 0 0 rgba(59, 130, 246, 0)',
                    '0 0 0 8px rgba(59, 130, 246, 0.15)',
                    '0 0 0 0 rgba(59, 130, 246, 0)',
                  ],
                } : {}}
                transition={isActive ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  background: isCompleted
                    ? 'var(--accent, #3b82f6)'
                    : isActive
                      ? 'var(--white)'
                      : 'var(--gray-100)',
                  border: isActive
                    ? '2px solid var(--accent, #3b82f6)'
                    : isCompleted
                      ? '2px solid var(--accent, #3b82f6)'
                      : '2px solid var(--gray-200)',
                  position: 'relative',
                  transition: 'background 0.3s, border-color 0.3s',
                }}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </motion.div>
                ) : (
                  <>
                    <span style={{ fontSize: 12, opacity: isPending ? 0.4 : 1 }}>
                      {i + 1}
                    </span>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: isActive ? 'var(--accent, #3b82f6)' : isPending ? 'var(--gray-400)' : 'var(--gray-600)',
                    }}>
                      {p.label}
                    </span>
                  </>
                )}
              </motion.div>

              {/* 連接線 */}
              {i < PHASES.length - 1 && (
                <div style={{
                  width: 48,
                  height: 2,
                  background: currentPhaseIndex > i
                    ? 'var(--accent, #3b82f6)'
                    : 'var(--gray-200)',
                  transition: 'background 0.5s',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {currentPhaseIndex === i && (
                    <motion.div
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '50%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, var(--accent, #3b82f6), transparent)',
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 當前步驟文字 */}
      <AnimatePresence mode="wait">
        <motion.p
          key={`${phase}-${descIndex}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          style={{
            fontSize: 14,
            color: 'var(--gray-600)',
            marginBottom: 24,
            textAlign: 'center',
          }}
        >
          {descriptions[descIndex]}
        </motion.p>
      </AnimatePresence>

      {/* 進度條 */}
      <div style={{
        width: '100%',
        maxWidth: 320,
        height: 6,
        borderRadius: 3,
        background: 'var(--gray-200)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <motion.div
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
          style={{
            height: '100%',
            borderRadius: 3,
            background: 'var(--accent, #3b82f6)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* 進度條閃光效果 */}
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '30%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            }}
          />
        </motion.div>
      </div>

      {/* 百分比文字 */}
      <motion.span
        key={percent}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          fontSize: 12,
          color: 'var(--gray-400)',
          marginTop: 8,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {percent}%
      </motion.span>
    </div>
  )
}
