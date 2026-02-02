'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// 階段定義
const STAGES = [
  { id: 'analyze', label: '分析需求', icon: '◈', description: '理解你的意圖與目標' },
  { id: 'clarify', label: '釐清細節', icon: '◇', description: '確認邊界條件與例外處理' },
  { id: 'model', label: '建立資料模型', icon: '⬡', description: '設計實體與關聯結構' },
  { id: 'spec', label: '生成功能規格', icon: '⬢', description: '產出 BDD Feature Files' },
  { id: 'quality', label: '品質檢查', icon: '◆', description: '驗證規格完整性與一致性' },
]

interface SpecGenerationViewProps {
  currentStage?: number // 0-4，對應 STAGES 索引
  onComplete?: () => void
}

// 偽隨機數生成器（確保 server/client 一致）
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9999) * 10000
  return x - Math.floor(x)
}

// 粒子系統
function Particles() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const particles = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: seededRandom(i * 1.1) * 100,
      y: seededRandom(i * 2.2) * 100,
      size: seededRandom(i * 3.3) * 2 + 1,
      duration: seededRandom(i * 4.4) * 20 + 15,
      delay: seededRandom(i * 5.5) * 5,
      opacity: seededRandom(i * 6.6) * 0.5 + 0.1,
    })), []
  )

  if (!mounted) return null

  return (
    <div className="particles-container">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [p.opacity, p.opacity * 1.5, p.opacity],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// 神經網絡連線動畫
function NeuralNetwork({ activeStage }: { activeStage: number }) {
  const nodes = useMemo(() =>
    STAGES.map((_, i) => {
      const angle = (i / STAGES.length) * Math.PI * 2 - Math.PI / 2
      const radius = 140
      return {
        x: 50 + Math.cos(angle) * (radius / 3),
        y: 50 + Math.sin(angle) * (radius / 3),
      }
    }), []
  )

  return (
    <svg className="neural-network" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(100, 200, 255, 0.1)" />
          <stop offset="50%" stopColor="rgba(100, 200, 255, 0.4)" />
          <stop offset="100%" stopColor="rgba(100, 200, 255, 0.1)" />
        </linearGradient>
      </defs>

      {/* 連接線 */}
      {nodes.map((node, i) => {
        const nextNode = nodes[(i + 1) % nodes.length]
        const isActive = i <= activeStage
        return (
          <motion.line
            key={`line-${i}`}
            x1={node.x}
            y1={node.y}
            x2={nextNode.x}
            y2={nextNode.y}
            stroke={isActive ? 'rgba(100, 200, 255, 0.6)' : 'rgba(100, 200, 255, 0.15)'}
            strokeWidth={isActive ? 0.3 : 0.15}
            filter={isActive ? 'url(#glow)' : undefined}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: i * 0.2 }}
          />
        )
      })}

      {/* 中心連接 */}
      {nodes.map((node, i) => {
        const isActive = i <= activeStage
        return (
          <motion.line
            key={`center-${i}`}
            x1={50}
            y1={50}
            x2={node.x}
            y2={node.y}
            stroke={isActive ? 'rgba(100, 200, 255, 0.4)' : 'rgba(100, 200, 255, 0.08)'}
            strokeWidth={isActive ? 0.2 : 0.1}
            strokeDasharray={isActive ? '0' : '1 2'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: i * 0.1 + 0.5 }}
          />
        )
      })}

      {/* 節點 */}
      {nodes.map((node, i) => {
        const isActive = i === activeStage
        const isPast = i < activeStage
        return (
          <motion.circle
            key={`node-${i}`}
            cx={node.x}
            cy={node.y}
            r={isActive ? 2.5 : isPast ? 2 : 1.5}
            fill={
              isActive
                ? 'rgba(100, 200, 255, 1)'
                : isPast
                ? 'rgba(100, 200, 255, 0.7)'
                : 'rgba(100, 200, 255, 0.25)'
            }
            filter={isActive ? 'url(#glow)' : undefined}
            initial={{ scale: 0 }}
            animate={{
              scale: isActive ? [1, 1.3, 1] : 1,
            }}
            transition={{
              scale: { duration: 1.5, repeat: isActive ? Infinity : 0 },
              default: { duration: 0.3, delay: i * 0.1 }
            }}
          />
        )
      })}

      {/* 中心核心 */}
      <motion.circle
        cx={50}
        cy={50}
        r={4}
        fill="rgba(100, 200, 255, 0.15)"
        stroke="rgba(100, 200, 255, 0.4)"
        strokeWidth={0.3}
        animate={{
          r: [4, 5, 4],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.circle
        cx={50}
        cy={50}
        r={2}
        fill="rgba(100, 200, 255, 0.8)"
        filter="url(#glow)"
        animate={{
          r: [2, 2.5, 2],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  )
}

// 進度指示器
function StageIndicator({ stage, index, isActive, isPast }: {
  stage: typeof STAGES[0]
  index: number
  isActive: boolean
  isPast: boolean
}) {
  return (
    <motion.div
      className={`stage-item ${isActive ? 'active' : ''} ${isPast ? 'past' : ''}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 + 0.3 }}
    >
      <div className="stage-icon-wrapper">
        <motion.span
          className="stage-icon"
          animate={isActive ? {
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          {stage.icon}
        </motion.span>
        {isPast && (
          <motion.span
            className="check-mark"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500 }}
          >
            ✓
          </motion.span>
        )}
      </div>
      <div className="stage-text">
        <span className="stage-label">{stage.label}</span>
        <AnimatePresence>
          {isActive && (
            <motion.span
              className="stage-description"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {stage.description}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      {isActive && (
        <motion.div
          className="pulse-ring"
          animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.div>
  )
}

// 主動畫文字
function AnimatedTitle() {
  const words = ['思考', '分析', '建構', '生成']
  const [currentWord, setCurrentWord] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % words.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="animated-title">
      <span className="title-prefix">AI 正在</span>
      <AnimatePresence mode="wait">
        <motion.span
          key={currentWord}
          className="title-word"
          initial={{ y: 20, opacity: 0, filter: 'blur(8px)' }}
          animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: -20, opacity: 0, filter: 'blur(8px)' }}
          transition={{ duration: 0.4 }}
        >
          {words[currentWord]}
        </motion.span>
      </AnimatePresence>
      <span className="title-suffix">中...</span>
    </div>
  )
}

// 底部提示
function BottomHint() {
  const hints = [
    '規格文件是程式碼的藍圖',
    '每個細節都會被記錄',
    '確保沒有任何歧義',
    '為自動化測試做準備',
  ]
  const [currentHint, setCurrentHint] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHint((prev) => (prev + 1) % hints.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bottom-hint">
      <AnimatePresence mode="wait">
        <motion.p
          key={currentHint}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
        >
          {hints[currentHint]}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}

export function SpecGenerationView({ currentStage = 0, onComplete }: SpecGenerationViewProps) {
  const [internalStage, setInternalStage] = useState(currentStage)

  // Demo 模式：自動推進階段
  useEffect(() => {
    if (currentStage === undefined) {
      const interval = setInterval(() => {
        setInternalStage((prev) => {
          if (prev >= STAGES.length - 1) {
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
    <div className="spec-generation-view">
      <style jsx global>{`
        .spec-generation-view {
          position: fixed;
          inset: 0;
          background: linear-gradient(
            135deg,
            #0a0a0f 0%,
            #0d1117 25%,
            #0a0f14 50%,
            #080b0f 75%,
            #050608 100%
          );
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          font-family: var(--font-sans);
          z-index: 9999;
        }

        /* 背景網格 */
        .spec-generation-view::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(100, 200, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(100, 200, 255, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
        }

        /* 環境光暈 */
        .spec-generation-view::after {
          content: '';
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(
            circle,
            rgba(100, 200, 255, 0.08) 0%,
            rgba(100, 200, 255, 0.02) 40%,
            transparent 70%
          );
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        .particles-container {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .particle {
          position: absolute;
          background: rgba(100, 200, 255, 0.6);
          border-radius: 50%;
          box-shadow: 0 0 6px rgba(100, 200, 255, 0.4);
        }

        .neural-network {
          position: absolute;
          width: 500px;
          height: 500px;
          opacity: 0.8;
          pointer-events: none;
        }

        .content-wrapper {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 48px;
          max-width: 400px;
          padding: 20px;
        }

        .animated-title {
          display: flex;
          align-items: baseline;
          gap: 4px;
          font-size: 28px;
          font-weight: 300;
          color: rgba(255, 255, 255, 0.95);
          letter-spacing: 0.02em;
        }

        .title-prefix,
        .title-suffix {
          opacity: 0.7;
        }

        .title-word {
          color: rgba(100, 200, 255, 1);
          font-weight: 400;
          min-width: 70px;
          display: inline-block;
        }

        .stages-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 100%;
        }

        .stage-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          position: relative;
          transition: all 0.3s ease;
        }

        .stage-item.active {
          background: rgba(100, 200, 255, 0.08);
          border-color: rgba(100, 200, 255, 0.3);
        }

        .stage-item.past {
          opacity: 0.5;
        }

        .stage-icon-wrapper {
          position: relative;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stage-icon {
          font-size: 18px;
          color: rgba(100, 200, 255, 0.6);
          transition: color 0.3s ease;
        }

        .stage-item.active .stage-icon {
          color: rgba(100, 200, 255, 1);
        }

        .stage-item.past .stage-icon {
          opacity: 0.4;
        }

        .check-mark {
          position: absolute;
          right: -4px;
          bottom: -2px;
          font-size: 10px;
          color: rgba(100, 255, 150, 0.9);
          background: rgba(0, 0, 0, 0.8);
          border-radius: 50%;
          width: 14px;
          height: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stage-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .stage-label {
          font-size: 14px;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.8);
          letter-spacing: 0.02em;
        }

        .stage-item.active .stage-label {
          color: rgba(255, 255, 255, 0.95);
        }

        .stage-description {
          font-size: 12px;
          color: rgba(100, 200, 255, 0.7);
          font-family: var(--font-mono);
        }

        .pulse-ring {
          position: absolute;
          left: 16px;
          width: 32px;
          height: 32px;
          border: 1px solid rgba(100, 200, 255, 0.5);
          border-radius: 50%;
          pointer-events: none;
        }

        .bottom-hint {
          position: absolute;
          bottom: 48px;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
        }

        .bottom-hint p {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.35);
          font-family: var(--font-mono);
          letter-spacing: 0.05em;
        }

        /* 掃描線效果 */
        @keyframes scanline {
          0% { top: -100%; }
          100% { top: 200%; }
        }

        .scanline {
          position: absolute;
          width: 100%;
          height: 100px;
          background: linear-gradient(
            to bottom,
            transparent,
            rgba(100, 200, 255, 0.03),
            transparent
          );
          animation: scanline 8s linear infinite;
          pointer-events: none;
        }

        /* 響應式 */
        @media (max-width: 640px) {
          .neural-network {
            width: 300px;
            height: 300px;
          }

          .animated-title {
            font-size: 22px;
          }

          .content-wrapper {
            gap: 32px;
          }

          .stage-item {
            padding: 10px 12px;
          }
        }
      `}</style>

      <Particles />
      <NeuralNetwork activeStage={internalStage} />
      <div className="scanline" />

      <div className="content-wrapper">
        <AnimatedTitle />

        <div className="stages-container">
          {STAGES.map((stage, index) => (
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
