// ============================================================
// 純 Remotion 2D Fallback（無 WebGL）
// 用 interpolate/spring 驅動 CSS 磚塊堆疊動畫
// ============================================================

import { useCurrentFrame, useVideoConfig, spring, interpolate, AbsoluteFill } from 'remotion'
import { BOUNCY, SNAPPY, SMOOTH } from '../shared/springs'
import { pulse } from '../shared/utils'
import { ROUND_LABELS, ROUND_COLORS, TOTAL_FRAMES } from './constants'

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

  // 每一層的動畫
  const foundationScale = layers >= 1
    ? spring({ frame, fps, config: SNAPPY })
    : 0

  const wallScale = layers >= 2
    ? spring({ frame: Math.max(0, frame - 15), fps, config: SNAPPY })
    : 0

  const windowScale1 = layers >= 3 ? spring({ frame: Math.max(0, frame - 25), fps, config: BOUNCY }) : 0
  const windowScale2 = layers >= 3 ? spring({ frame: Math.max(0, frame - 30), fps, config: BOUNCY }) : 0
  const windowScale3 = layers >= 3 ? spring({ frame: Math.max(0, frame - 35), fps, config: BOUNCY }) : 0

  const interiorOpacity = layers >= 4
    ? interpolate(
      spring({ frame: Math.max(0, frame - 40), fps, config: SMOOTH }),
      [0, 1], [0, 1],
    )
    : 0

  const roofSpring = layers >= 5
    ? spring({ frame: Math.max(0, frame - 50), fps, config: BOUNCY })
    : 0
  const roofY = interpolate(roofSpring, [0, 1], [-20, 0])
  const roofScale = interpolate(roofSpring, [0, 1], [0.5, 1])

  const lightGlow = layers >= 6 ? pulse(frame, 0.1, 0.6, 1) : 0
  const lightShadow = layers >= 6 ? pulse(frame, 0.1, 8, 16) : 0
  const treeScale = layers >= 6
    ? spring({ frame: Math.max(0, frame - 60), fps, config: BOUNCY })
    : 0

  const workingOpacity = isWorking ? pulse(frame, 0.07, 0.5, 1) : 0

  return (
    <AbsoluteFill style={{
      background: 'var(--gray-50, #f8fafc)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
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
          <div style={{
            width: 160,
            height: 16,
            background: ROUND_COLORS[0],
            borderRadius: 2,
            transformOrigin: 'center bottom',
            transform: `scaleX(${foundationScale})`,
          }} />
        )}

        {/* 牆體 */}
        {layers >= 2 && (
          <div style={{
            width: 140,
            height: 60,
            background: ROUND_COLORS[1],
            borderRadius: '2px 2px 0 0',
            transformOrigin: 'center bottom',
            transform: `scaleY(${wallScale})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            flexWrap: 'wrap',
            padding: 8,
          }}>
            {/* 門窗 */}
            {layers >= 3 && (
              <>
                <div style={{
                  width: 20, height: 24, background: '#bfdbfe', borderRadius: 2,
                  transform: `scale(${windowScale1})`,
                }} />
                <div style={{
                  width: 16, height: 30, background: '#93c5fd', borderRadius: '8px 8px 0 0',
                  transform: `scale(${windowScale2})`,
                }} />
                <div style={{
                  width: 20, height: 24, background: '#bfdbfe', borderRadius: 2,
                  transform: `scale(${windowScale3})`,
                }} />
              </>
            )}
          </div>
        )}

        {/* 內裝（色帶） */}
        {layers >= 4 && (
          <div style={{
            position: 'absolute',
            bottom: 16,
            width: 140,
            height: 60,
            background: `linear-gradient(135deg, ${ROUND_COLORS[3]}22, ${ROUND_COLORS[3]}44)`,
            borderRadius: '2px 2px 0 0',
            pointerEvents: 'none',
            opacity: interiorOpacity,
          }} />
        )}

        {/* 屋頂 */}
        {layers >= 5 && (
          <div style={{
            width: 0,
            height: 0,
            borderLeft: '80px solid transparent',
            borderRight: '80px solid transparent',
            borderBottom: `40px solid ${ROUND_COLORS[4]}`,
            transform: `translateY(${roofY}px) scale(${roofScale})`,
          }} />
        )}

        {/* 完工特效 */}
        {layers >= 6 && (
          <>
            {/* 燈光 */}
            <div style={{
              position: 'absolute',
              bottom: 40,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#facc15',
              opacity: lightGlow,
              boxShadow: `0 0 ${lightShadow}px rgba(250,204,21,0.5)`,
            }} />
            {/* 樹 */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              right: -30,
              width: 24,
              height: 36,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transform: `scale(${treeScale})`,
            }}>
              <div style={{ width: 20, height: 24, borderRadius: '50%', background: '#22c55e' }} />
              <div style={{ width: 4, height: 12, background: '#92400e' }} />
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
              background: i < round ? ROUND_COLORS[i] : '#d1d5db',
            }} />
            <span style={{
              fontSize: 11,
              color: i < round ? '#374151' : '#9ca3af',
              fontWeight: i === round - 1 ? 600 : 400,
            }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* 進度文字 */}
      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
          {progress}/{totalQuestions} 題完成
        </p>
        {isWorking && (
          <p style={{
            fontSize: 12,
            color: '#3b82f6',
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
        background: '#e2e8f0',
        overflow: 'hidden',
        zIndex: 1,
      }}>
        <div style={{
          height: '100%',
          borderRadius: 2,
          background: '#3b82f6',
          width: `${percent}%`,
        }} />
      </div>
    </AbsoluteFill>
  )
}
