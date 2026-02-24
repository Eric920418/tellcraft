// ============================================================
// Shimmer 光澤進度條
// ============================================================

import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion'
import { clampInterpolate, loopValue } from '../shared/utils'
import { ACCENT, SHIMMER_COLOR, PROGRESS_TARGETS } from './constants'

const BAR_WIDTH = 320
const BAR_HEIGHT = 6

export default function ProgressBar() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // 根據幀計算目標百分比（在 PROGRESS_TARGETS 之間 interpolate）
  const frames = PROGRESS_TARGETS.map(t => t.frame)
  const percents = PROGRESS_TARGETS.map(t => t.percent)
  const percent = clampInterpolate(
    frame,
    [frames[0], frames[frames.length - 1]] as [number, number],
    [percents[0], percents[percents.length - 1]] as [number, number],
  )

  // 更精確的 multi-stop interpolation
  const exactPercent = interpolate(
    frame,
    frames as unknown as number[],
    percents as unknown as number[],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )

  // Shimmer 位移
  const shimmerX = loopValue(frame, 50, -BAR_WIDTH * 0.3, BAR_WIDTH * 1.3)

  const fillWidth = (exactPercent / 100) * BAR_WIDTH

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
    }}>
      <div style={{
        width: BAR_WIDTH,
        height: BAR_HEIGHT,
        borderRadius: BAR_HEIGHT / 2,
        background: '#e2e8f0',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* 填充 */}
        <div style={{
          width: fillWidth,
          height: '100%',
          borderRadius: BAR_HEIGHT / 2,
          background: ACCENT,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Shimmer 光澤 */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: shimmerX,
            width: BAR_WIDTH * 0.3,
            height: '100%',
            background: `linear-gradient(90deg, transparent, ${SHIMMER_COLOR}, transparent)`,
          }} />
        </div>
      </div>

      {/* 百分比文字 */}
      <span style={{
        fontSize: 12,
        color: '#94a3b8',
        fontVariantNumeric: 'tabular-nums',
        fontFamily: 'var(--font-mono, monospace)',
      }}>
        {Math.round(exactPercent)}%
      </span>
    </div>
  )
}
