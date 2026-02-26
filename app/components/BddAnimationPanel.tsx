'use client'

// ============================================================
// "The Craft" BDD 動畫面板
// 三層視覺架構：
//   Layer 1: Remotion Player（Three.js 鍛造場景）
//   Layer 2: CSS Ambient Overlay（餘燼粒子，永遠飄動）
//   Layer 3: Feedback Pulse（回答瞬間火花爆發）
//   Layer 0: Progress Bar（底部進度指示）
// ============================================================

import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { Player, type PlayerRef } from '@remotion/player'
import CraftComposition from './remotion/building-scene/CraftComposition'
import BuildingFallback2D from './remotion/building-scene/BuildingFallback2D'
import { FPS, TOTAL_FRAMES, PHASE_LABELS, PHASE_COLORS, PROGRESS_STATUS } from './remotion/building-scene/constants'
import { hashString } from './remotion/building-scene/procedural'

// ── Props ──

interface BddAnimationPanelProps {
  progress: number
  totalQuestions: number
  round: number
  maxRounds?: number
  isWorking?: boolean
  isComplete?: boolean
  conversationId?: string
}

// ── 餘燼粒子配置 ──

const EMBER_COUNT = 8
const EMBER_COLORS = ['#D4740E', '#FF8C42', '#8B4513', '#FFB347', '#FF6B35']

function generateEmbers() {
  return Array.from({ length: EMBER_COUNT }, (_, i) => ({
    left: `${5 + (i * 73 + 17) % 90}%`,
    size: 2 + (i % 3),
    duration: 4 + (i % 7),
    delay: (i * 0.6) % 6,
    color: EMBER_COLORS[i % EMBER_COLORS.length],
    drift: ((i * 37) % 20) - 10, // -10 to +10 px 水平漂移
  }))
}

// ── Main Component ──

export default function BddAnimationPanel({
  progress,
  totalQuestions,
  round: _round,
  maxRounds: _maxRounds = 6,
  isWorking,
  isComplete,
  conversationId,
}: BddAnimationPanelProps) {
  const playerRef = useRef<PlayerRef>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [webglOk, setWebglOk] = useState(true)
  const [containerSize, setContainerSize] = useState<{ w: number; h: number } | null>(null)
  const [showPulse, setShowPulse] = useState(false)
  const prevProgressRef = useRef(0)
  const targetFrameRef = useRef(0)
  const isCompleteRef = useRef(false)

  // Seed（專案專屬）
  const seed = useMemo(() => hashString(conversationId || 'default'), [conversationId])

  // 餘燼配置（穩定不重算）
  const embers = useMemo(() => generateEmbers(), [])

  // WebGL 檢測
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      if (!gl) setWebglOk(false)
    } catch {
      setWebglOk(false)
    }
  }, [])

  // 容器尺寸偵測
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const { width, height } = el.getBoundingClientRect()
      if (width > 0 && height > 0) {
        setContainerSize({ w: Math.round(width), h: Math.round(height) })
      }
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // 幀控制回調
  const handleFrameUpdate = useCallback((e: { detail: { frame: number } }) => {
    if (e.detail.frame >= targetFrameRef.current && !isCompleteRef.current) {
      playerRef.current?.pause()
    }
  }, [])

  // 註冊 frameupdate
  useEffect(() => {
    const player = playerRef.current
    if (!player) return
    player.addEventListener('frameupdate', handleFrameUpdate)
    player.seekTo(0)
    player.pause()
    return () => {
      player.removeEventListener('frameupdate', handleFrameUpdate)
    }
  }, [handleFrameUpdate, webglOk, containerSize])

  // progress 變化 → 推進幀 + 觸發火花脈衝
  useEffect(() => {
    const player = playerRef.current
    if (!player) return

    if (progress <= 0) {
      targetFrameRef.current = 0
      player.seekTo(0)
      player.pause()
      prevProgressRef.current = 0
      return
    }

    const ratio = totalQuestions > 0 ? progress / totalQuestions : 0
    const newTarget = Math.min(Math.floor(ratio * TOTAL_FRAMES), TOTAL_FRAMES - 1)
    targetFrameRef.current = newTarget

    if (prevProgressRef.current === 0 && progress > 1) {
      player.seekTo(newTarget)
      player.pause()
    } else {
      player.play()
      // 觸發火花脈衝（progress 真的變了才觸發）
      if (progress > prevProgressRef.current) {
        setShowPulse(true)
        setTimeout(() => setShowPulse(false), 700)
      }
    }

    prevProgressRef.current = progress
  }, [progress, totalQuestions, containerSize])

  // isComplete → 解除暫停
  useEffect(() => {
    const player = playerRef.current
    if (!player) return
    isCompleteRef.current = !!isComplete
    if (isComplete) {
      targetFrameRef.current = TOTAL_FRAMES - 1
      player.play()
    }
  }, [isComplete, containerSize])

  // Remotion inputProps
  const inputProps = useMemo(() => ({ seed }), [seed])

  const style = useMemo(() => ({ width: '100%', height: '100%' }), [])

  const compW = containerSize?.w ?? 1280
  const compH = containerSize?.h ?? 720
  const percent = totalQuestions > 0 ? Math.round((progress / totalQuestions) * 100) : 0
  const currentPhase = percent < 25 ? 0 : percent < 50 ? 1 : percent < 75 ? 2 : 3

  return (
    <div
      ref={containerRef}
      style={{
        height: '100%',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: '#1a0e08',
      }}
    >
      {/* Layer 1: Remotion Player */}
      {containerSize && (
        webglOk ? (
          <Player
            ref={playerRef}
            component={CraftComposition}
            inputProps={inputProps}
            compositionWidth={compW}
            compositionHeight={compH}
            durationInFrames={TOTAL_FRAMES}
            fps={FPS}
            style={style}
            loop={!!isComplete}
            controls={false}
            showVolumeControls={false}
            clickToPlay={false}
          />
        ) : (
          <Player
            ref={playerRef}
            component={BuildingFallback2D}
            inputProps={{ round: _round, progress, totalQuestions, isWorking }}
            compositionWidth={compW}
            compositionHeight={compH}
            durationInFrames={TOTAL_FRAMES}
            fps={FPS}
            style={style}
            loop={!!isComplete}
            controls={false}
            showVolumeControls={false}
            clickToPlay={false}
          />
        )
      )}

      {/* Layer 2: Ambient Overlay — 餘燼粒子（CSS 純動畫，永遠飄動） */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 5,
        overflow: 'hidden',
      }}>
        {embers.map((ember, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              bottom: '-5%',
              left: ember.left,
              width: ember.size,
              height: ember.size,
              borderRadius: '50%',
              background: ember.color,
              boxShadow: `0 0 ${ember.size + 2}px ${ember.color}`,
              opacity: 0,
              animation: `craft-ember ${ember.duration}s ${ember.delay}s infinite ease-out`,
            }}
          />
        ))}
        {/* 背景微呼吸（暗銅漸層） */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(107,58,42,0.08) 70%)',
          animation: 'craft-breathe 6s infinite ease-in-out',
        }} />
      </div>

      {/* Layer 3: Feedback Pulse — 回答瞬間火花 */}
      {showPulse && (
        <div style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* 中心光暈擴散 */}
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,215,0,0.5) 0%, rgba(255,107,53,0.2) 50%, transparent 70%)',
            animation: 'craft-spark 0.7s ease-out forwards',
          }} />
          {/* 散射火花碎片 */}
          {[0, 1, 2, 3, 4].map(i => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: PHASE_COLORS[currentPhase] || '#FFD700',
                boxShadow: `0 0 6px ${PHASE_COLORS[currentPhase] || '#FFD700'}`,
                animation: `craft-spark-particle-${i} 0.6s ease-out forwards`,
              }}
            />
          ))}
        </div>
      )}

      {/* Layer 0: 進度指示器 */}
      <div style={{
        position: 'absolute',
        bottom: 16,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        pointerEvents: 'none',
        zIndex: 10,
      }}>
        {/* 4 階段標籤 */}
        <div style={{
          display: 'flex',
          gap: 4,
          alignItems: 'center',
          padding: '6px 14px',
          background: 'rgba(26,14,8,0.7)',
          borderRadius: 20,
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,107,53,0.15)',
        }}>
          {PHASE_LABELS.map((label, i) => {
            const isActive = i <= currentPhase
            const isCurrent = i === currentPhase
            return (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {i > 0 && (
                  <span style={{
                    display: 'inline-block',
                    width: 16,
                    height: 1,
                    background: isActive ? PHASE_COLORS[i] : 'rgba(255,255,255,0.15)',
                    transition: 'background 0.5s',
                  }} />
                )}
                <span style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 10,
                  background: isCurrent
                    ? PHASE_COLORS[i]
                    : isActive
                      ? `${PHASE_COLORS[i]}33`
                      : 'transparent',
                  color: isActive ? '#FFF8DC' : 'rgba(255,255,255,0.35)',
                  fontWeight: isCurrent ? 600 : 400,
                  transition: 'all 0.5s',
                  whiteSpace: 'nowrap',
                }}>
                  {isActive && i < currentPhase ? '\u25CF' : isCurrent ? '\u25CF' : '\u25CB'} {label}
                </span>
              </span>
            )
          })}
        </div>

        {/* 進度文字 */}
        <div style={{
          fontSize: 12,
          color: 'rgba(255,248,220,0.85)',
          background: 'rgba(26,14,8,0.6)',
          padding: '4px 14px',
          borderRadius: 12,
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,107,53,0.1)',
        }}>
          {progress}/{totalQuestions} · {percent}%
          {isWorking && (
            <span style={{ animation: 'craft-working-pulse 1.5s infinite ease-in-out' }}>
              {' · '}{PROGRESS_STATUS.working}
            </span>
          )}
        </div>
      </div>

      {/* CSS 動畫定義 */}
      <style>{`
        @keyframes craft-ember {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 0.25; }
          50% { transform: translateY(-40vh) translateX(var(--drift, 8px)); opacity: 0.3; }
          100% { transform: translateY(-80vh) translateX(var(--drift, 8px)); opacity: 0; }
        }
        @keyframes craft-breathe {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes craft-spark {
          0% { transform: scale(0.3); opacity: 0.8; filter: blur(0px); }
          50% { transform: scale(1.8); opacity: 0.4; filter: blur(2px); }
          100% { transform: scale(3); opacity: 0; filter: blur(5px); }
        }
        @keyframes craft-spark-particle-0 {
          0% { transform: translate(0,0) scale(1); opacity: 0.9; }
          100% { transform: translate(40px,-30px) scale(0.3); opacity: 0; }
        }
        @keyframes craft-spark-particle-1 {
          0% { transform: translate(0,0) scale(1); opacity: 0.9; }
          100% { transform: translate(-35px,-40px) scale(0.3); opacity: 0; }
        }
        @keyframes craft-spark-particle-2 {
          0% { transform: translate(0,0) scale(1); opacity: 0.9; }
          100% { transform: translate(25px,35px) scale(0.3); opacity: 0; }
        }
        @keyframes craft-spark-particle-3 {
          0% { transform: translate(0,0) scale(1); opacity: 0.9; }
          100% { transform: translate(-45px,20px) scale(0.3); opacity: 0; }
        }
        @keyframes craft-spark-particle-4 {
          0% { transform: translate(0,0) scale(1); opacity: 0.9; }
          100% { transform: translate(10px,-50px) scale(0.3); opacity: 0; }
        }
        @keyframes craft-working-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
