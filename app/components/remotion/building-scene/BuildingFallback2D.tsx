// ============================================================
// 城堡風格純 2D Fallback（無 WebGL 時使用）
// ============================================================

import { useCurrentFrame, useVideoConfig, spring, interpolate, AbsoluteFill } from 'remotion'
import { BOUNCY, SNAPPY, SMOOTH, HEAVY } from '../shared/springs'
import { pulse } from '../shared/utils'
import { ROUND_LABELS, ROUND_COLORS } from './constants'

interface BuildingFallback2DProps {
  round?: number
  progress?: number
  totalQuestions?: number
  isWorking?: boolean
}

export default function BuildingFallback2D({
  round = 1,
  progress = 0,
  totalQuestions = 30,
  isWorking,
}: BuildingFallback2DProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const percent = totalQuestions > 0 ? Math.round((progress / totalQuestions) * 100) : 0
  const layers = Math.ceil((progress / totalQuestions) * 6)

  // Layer 1: 地基 + 護城河
  const groundScale = layers >= 1 ? spring({ frame, fps, config: HEAVY }) : 0
  const moatOpacity = layers >= 1 ? spring({ frame: Math.max(0, frame - 10), fps, config: SMOOTH }) * 0.4 : 0

  // Layer 2: 城牆 + 城垛
  const wallScale = layers >= 2 ? spring({ frame: Math.max(0, frame - 15), fps, config: HEAVY }) : 0
  const battlementScale = layers >= 2 ? spring({ frame: Math.max(0, frame - 25), fps, config: BOUNCY }) : 0

  // Layer 3: 塔樓
  const towerScale = layers >= 3 ? spring({ frame: Math.max(0, frame - 30), fps, config: HEAVY }) : 0

  // Layer 4: 內裝（吊橋 + 城門）
  const gateOpacity = layers >= 4 ? spring({ frame: Math.max(0, frame - 40), fps, config: SMOOTH }) : 0

  // Layer 5: 屋頂
  const roofSpring = layers >= 5 ? spring({ frame: Math.max(0, frame - 50), fps, config: BOUNCY }) : 0
  const roofY = interpolate(roofSpring, [0, 1], [-15, 0])

  // Layer 6: 完工特效
  const flagWave = layers >= 6 ? Math.sin(frame * 0.12) * 3 : 0
  const glowPulse = layers >= 6 ? pulse(frame, 0.08, 0.4, 1) : 0
  const treeScale = layers >= 6 ? spring({ frame: Math.max(0, frame - 60), fps, config: BOUNCY }) : 0

  const workingOpacity = isWorking ? pulse(frame, 0.07, 0.5, 1) : 0

  // 天空漸變背景
  const skyProgress = interpolate(layers, [0, 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const bgTop = interpolate(skyProgress, [0, 0.5, 1], [0, 0, 0]).toString()
  const bgGradient = `linear-gradient(180deg,
    hsl(215, ${interpolate(skyProgress, [0, 1], [40, 60])}%, ${interpolate(skyProgress, [0, 1], [25, 70])}%) 0%,
    hsl(${interpolate(skyProgress, [0, 1], [215, 35])}, ${interpolate(skyProgress, [0, 1], [30, 50])}%, ${interpolate(skyProgress, [0, 1], [35, 75])}%) 100%
  )`

  return (
    <AbsoluteFill style={{
      background: bgGradient,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      gap: 20,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 藍圖網格 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
        opacity: Math.max(0.2, 1 - skyProgress),
      }} />

      {/* 城堡 2D 視圖 */}
      <div style={{
        position: 'relative',
        width: 240,
        height: 220,
        display: 'flex',
        flexDirection: 'column-reverse',
        alignItems: 'center',
        justifyContent: 'flex-start',
      }}>
        {/* 地面 + 護城河 */}
        {layers >= 1 && (
          <>
            <div style={{
              width: 220,
              height: 12,
              background: '#7cb342',
              borderRadius: 2,
              transform: `scaleX(${groundScale})`,
              transformOrigin: 'center bottom',
            }} />
            <div style={{
              position: 'absolute',
              bottom: 0,
              width: 240,
              height: 8,
              background: '#3b82f6',
              borderRadius: 4,
              opacity: moatOpacity,
            }} />
          </>
        )}

        {/* 城牆 */}
        {layers >= 2 && (
          <div style={{
            width: 160,
            height: 70,
            background: '#c8bca6',
            borderRadius: '2px 2px 0 0',
            transform: `scaleY(${wallScale})`,
            transformOrigin: 'center bottom',
            position: 'relative',
          }}>
            {/* 城垛 */}
            <div style={{
              position: 'absolute',
              top: -10,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'space-around',
              padding: '0 8px',
              transform: `scale(${battlementScale})`,
            }}>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} style={{ width: 12, height: 10, background: '#a69882', borderRadius: 1 }} />
              ))}
            </div>

            {/* 城門 */}
            {layers >= 4 && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 24,
                height: 32,
                background: '#92400e',
                borderRadius: '12px 12px 0 0',
                opacity: gateOpacity,
              }} />
            )}
          </div>
        )}

        {/* 塔樓（左右） */}
        {layers >= 3 && (
          <>
            <div style={{
              position: 'absolute',
              bottom: 12,
              left: 10,
              width: 30,
              height: 90,
              background: '#9e917b',
              borderRadius: '4px 4px 0 0',
              transform: `scaleY(${towerScale})`,
              transformOrigin: 'bottom',
            }} />
            <div style={{
              position: 'absolute',
              bottom: 12,
              right: 10,
              width: 30,
              height: 90,
              background: '#9e917b',
              borderRadius: '4px 4px 0 0',
              transform: `scaleY(${towerScale})`,
              transformOrigin: 'bottom',
            }} />
          </>
        )}

        {/* 屋頂 */}
        {layers >= 5 && (
          <>
            {/* 塔頂（三角形） */}
            {[-1, 1].map(side => (
              <div key={side} style={{
                position: 'absolute',
                bottom: 102,
                [side === -1 ? 'left' : 'right']: 5,
                width: 0,
                height: 0,
                borderLeft: '20px solid transparent',
                borderRight: '20px solid transparent',
                borderBottom: '25px solid #b45309',
                transform: `translateY(${roofY}px)`,
              }} />
            ))}
            {/* 旗幟 */}
            {layers >= 5 && (
              <div style={{
                position: 'absolute',
                top: -5,
                left: '50%',
                transform: `translateX(-50%) rotate(${flagWave}deg)`,
                width: 4,
                height: 30,
                background: '#92400e',
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 4,
                  width: 18,
                  height: 12,
                  background: '#dc2626',
                  borderRadius: '0 2px 2px 0',
                }} />
              </div>
            )}
          </>
        )}

        {/* 完工特效 */}
        {layers >= 6 && (
          <>
            {/* 窗戶發光 */}
            {[[-30, 50], [30, 50], [-30, 30], [30, 30]].map(([x, y], i) => (
              <div key={`glow${i}`} style={{
                position: 'absolute',
                bottom: 12 + y,
                left: `calc(50% + ${x}px)`,
                width: 10,
                height: 12,
                background: '#fbbf24',
                borderRadius: 2,
                opacity: glowPulse,
                boxShadow: `0 0 ${glowPulse * 8}px rgba(251,191,36,0.5)`,
              }} />
            ))}
            {/* 樹 */}
            <div style={{
              position: 'absolute',
              bottom: 8,
              right: -25,
              transform: `scale(${treeScale})`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              <div style={{ width: 18, height: 22, borderRadius: '50% 50% 30% 30%', background: '#2e7d32' }} />
              <div style={{ width: 4, height: 10, background: '#5d4037' }} />
            </div>
          </>
        )}
      </div>

      {/* 輪次指示 */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', zIndex: 1 }}>
        {ROUND_LABELS.map((label, i) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: i < round ? ROUND_COLORS[i] : 'rgba(255,255,255,0.3)',
            }} />
            <span style={{
              fontSize: 11,
              color: i < round ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
              fontWeight: i === round - 1 ? 600 : 400,
            }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* 進度文字 */}
      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
          {progress}/{totalQuestions} 題完成
        </p>
        {isWorking && (
          <p style={{
            fontSize: 12,
            color: '#93c5fd',
            margin: '4px 0 0',
            opacity: workingOpacity,
          }}>
            AI 分析中...
          </p>
        )}
      </div>

      {/* 底部進度條 */}
      <div style={{
        width: '100%',
        maxWidth: 280,
        height: 4,
        borderRadius: 2,
        background: 'rgba(255,255,255,0.15)',
        overflow: 'hidden',
        zIndex: 1,
      }}>
        <div style={{
          height: '100%',
          borderRadius: 2,
          background: '#60a5fa',
          width: `${percent}%`,
        }} />
      </div>
    </AbsoluteFill>
  )
}
