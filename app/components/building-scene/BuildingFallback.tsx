'use client'

import { motion } from 'framer-motion'

// ============================================================
// 2D Fallback：WebGL 不支援或低端機時使用
// 用 motion/react 做簡化的 2D 堆疊磚塊動畫
// ============================================================

interface BuildingFallbackProps {
  progress: number // 0-30
  totalQuestions: number
  round: number
  isWorking?: boolean
}

const ROUND_LABELS = ['地基', '牆體', '門窗', '內裝', '屋頂', '完工']
const ROUND_COLORS = ['#94a3b8', '#64748b', '#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e']

export default function BuildingFallback({ progress, totalQuestions, round, isWorking }: BuildingFallbackProps) {
  const percent = totalQuestions > 0 ? Math.round((progress / totalQuestions) * 100) : 0
  const layers = Math.ceil((progress / totalQuestions) * 6)

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--gray-50)',
      padding: 24,
      gap: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 藍圖背景網格 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
      }} />

      {/* 建築物 2D 視圖 */}
      <div style={{
        position: 'relative',
        width: 200,
        height: 200,
        display: 'flex',
        flexDirection: 'column-reverse',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 2,
      }}>
        {/* 地基 */}
        {layers >= 1 && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, ease: 'backOut' }}
            style={{
              width: 160,
              height: 16,
              background: ROUND_COLORS[0],
              borderRadius: 2,
              transformOrigin: 'center bottom',
            }}
          />
        )}

        {/* 牆體 */}
        {layers >= 2 && (
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              width: 140,
              height: 60,
              background: ROUND_COLORS[1],
              borderRadius: '2px 2px 0 0',
              transformOrigin: 'center bottom',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              flexWrap: 'wrap',
              padding: 8,
            }}
          >
            {/* 門窗 */}
            {layers >= 3 && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.2, ease: 'backOut' }}
                  style={{ width: 20, height: 24, background: '#bfdbfe', borderRadius: 2 }}
                />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.3, ease: 'backOut' }}
                  style={{ width: 16, height: 30, background: '#93c5fd', borderRadius: '8px 8px 0 0' }}
                />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.4, ease: 'backOut' }}
                  style={{ width: 20, height: 24, background: '#bfdbfe', borderRadius: 2 }}
                />
              </>
            )}
          </motion.div>
        )}

        {/* 內裝（色帶） */}
        {layers >= 4 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            style={{
              position: 'absolute',
              bottom: 16,
              width: 140,
              height: 60,
              background: `linear-gradient(135deg, ${ROUND_COLORS[3]}22, ${ROUND_COLORS[3]}44)`,
              borderRadius: '2px 2px 0 0',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* 屋頂 */}
        {layers >= 5 && (
          <motion.div
            initial={{ y: -20, scale: 0.5 }}
            animate={{ y: 0, scale: 1 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
            style={{
              width: 0,
              height: 0,
              borderLeft: '80px solid transparent',
              borderRight: '80px solid transparent',
              borderBottom: `40px solid ${ROUND_COLORS[4]}`,
            }}
          />
        )}

        {/* 完工特效 */}
        {layers >= 6 && (
          <>
            {/* 燈光 */}
            <motion.div
              animate={{
                opacity: [0.6, 1, 0.6],
                boxShadow: [
                  '0 0 8px rgba(250,204,21,0.3)',
                  '0 0 16px rgba(250,204,21,0.6)',
                  '0 0 8px rgba(250,204,21,0.3)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                position: 'absolute',
                bottom: 40,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#facc15',
              }}
            />
            {/* 樹 */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              style={{
                position: 'absolute',
                bottom: 0,
                right: -30,
                width: 24,
                height: 36,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div style={{ width: 20, height: 24, borderRadius: '50%', background: '#22c55e' }} />
              <div style={{ width: 4, height: 12, background: '#92400e' }} />
            </motion.div>
          </>
        )}
      </div>

      {/* 輪次指示 */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', zIndex: 1 }}>
        {ROUND_LABELS.map((label, i) => (
          <div key={label} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: i < round ? ROUND_COLORS[i] : i === round - 1 ? ROUND_COLORS[i] : 'var(--gray-300)',
              transition: 'background 0.3s',
            }} />
            <span style={{
              fontSize: 11,
              color: i < round ? 'var(--gray-700)' : 'var(--gray-400)',
              fontWeight: i === round - 1 ? 600 : 400,
            }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* 進度文字 */}
      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <p style={{ fontSize: 13, color: 'var(--gray-500)', margin: 0 }}>
          {progress}/{totalQuestions} 題完成
        </p>
        {isWorking && (
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ fontSize: 12, color: 'var(--accent)', margin: '4px 0 0' }}
          >
            AI 分析中...
          </motion.p>
        )}
      </div>

      {/* 底部進度條 */}
      <div style={{
        width: '100%',
        maxWidth: 280,
        height: 4,
        borderRadius: 2,
        background: 'var(--gray-200)',
        overflow: 'hidden',
        zIndex: 1,
      }}>
        <motion.div
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            height: '100%',
            borderRadius: 2,
            background: 'var(--accent, #3b82f6)',
          }}
        />
      </div>
    </div>
  )
}
