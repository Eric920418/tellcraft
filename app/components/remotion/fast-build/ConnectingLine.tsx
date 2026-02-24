// ============================================================
// 節點間粒子流線
// ============================================================

import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'
import { SNAPPY } from '../shared/springs'
import {
  NODE_GAP, ACCENT, NODE_BORDER,
  LINE_START_FRAMES, NODE_COMPLETE_FRAMES,
} from './constants'

interface ConnectingLineProps {
  /** 第幾條線（0 = 節點1→2，1 = 節點2→3） */
  index: number
}

const PARTICLE_COUNT = 3
const LINE_WIDTH = NODE_GAP

export default function ConnectingLine({ index }: ConnectingLineProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const startFrame = LINE_START_FRAMES[index]
  const completeFrame = NODE_COMPLETE_FRAMES[index]

  const isActive = frame >= startFrame
  const isCompleted = frame >= completeFrame

  // 線條填充進度
  const fillProgress = isCompleted
    ? 1
    : isActive
      ? spring({ frame: frame - startFrame, fps, config: SNAPPY })
      : 0

  const lineColor = isCompleted ? ACCENT : NODE_BORDER

  return (
    <div style={{
      width: LINE_WIDTH,
      height: 2,
      background: lineColor,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 填充進度 */}
      {fillProgress > 0 && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${fillProgress * 100}%`,
          height: '100%',
          background: ACCENT,
        }} />
      )}

      {/* 粒子流動 */}
      {isActive && !isCompleted && Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
        const offset = i * (30 / PARTICLE_COUNT)
        const particleX = interpolate(
          (frame + offset) % 30,
          [0, 30],
          [0, LINE_WIDTH],
        )
        const particleOpacity = interpolate(
          (frame + offset) % 30,
          [0, 5, 25, 30],
          [0, 0.8, 0.8, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
        )

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: -1,
              left: particleX,
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: ACCENT,
              opacity: particleOpacity,
              filter: 'blur(0.5px)',
            }}
          />
        )
      })}
    </div>
  )
}
