// ============================================================
// 單個階段節點：spring 彈入 + glow pulse + checkmark
// ============================================================

import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { BOUNCY, SNAPPY } from '../shared/springs'
import { pulse } from '../shared/utils'
import {
  NODE_SIZE, NODE_RADIUS,
  ACCENT, ACCENT_GLOW, NODE_BG, NODE_BORDER, NODE_ACTIVE_BORDER,
  COMPLETED_BG, PENDING_TEXT,
  NODE_ACTIVATE_FRAMES, NODE_COMPLETE_FRAMES,
} from './constants'

interface PhaseNodeProps {
  index: number
  label: string
}

export default function PhaseNode({ index, label }: PhaseNodeProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const activateFrame = NODE_ACTIVATE_FRAMES[index]
  const completeFrame = NODE_COMPLETE_FRAMES[index]

  // 狀態判斷
  const isActivated = frame >= activateFrame
  const isCompleted = frame >= completeFrame

  // 激活 spring（0→1）
  const activateProgress = isActivated
    ? spring({ frame: frame - activateFrame, fps, config: BOUNCY })
    : 0

  // 完成 spring（0→1，checkmark 縮放）
  const completeProgress = isCompleted
    ? spring({ frame: frame - completeFrame, fps, config: SNAPPY })
    : 0

  // 激活中 glow pulse
  const glowOpacity = (isActivated && !isCompleted)
    ? pulse(frame, 0.12, 0, 0.6)
    : 0

  // 節點 scale：未激活 0.85，激活時 spring 彈入
  const nodeScale = isActivated
    ? interpolate(activateProgress, [0, 1], [0.85, 1])
    : 0.85

  // 背景和邊框
  const background = isCompleted ? COMPLETED_BG : isActivated ? NODE_BG : '#f8fafc'
  const borderColor = isCompleted ? COMPLETED_BG : isActivated ? NODE_ACTIVE_BORDER : NODE_BORDER

  return (
    <div style={{
      width: NODE_SIZE,
      height: NODE_SIZE,
      borderRadius: NODE_RADIUS,
      background,
      border: `2px solid ${borderColor}`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      transform: `scale(${nodeScale})`,
      position: 'relative',
      boxShadow: glowOpacity > 0
        ? `0 0 0 ${interpolate(glowOpacity, [0, 0.6], [0, 8])}px ${ACCENT_GLOW}`
        : 'none',
    }}>
      {isCompleted ? (
        // Checkmark
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: `scale(${completeProgress}) rotate(${interpolate(completeProgress, [0, 1], [-90, 0])}deg)`,
          }}
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <>
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            color: isActivated ? ACCENT : PENDING_TEXT,
            opacity: isActivated ? 1 : 0.4,
          }}>
            {index + 1}
          </span>
          <span style={{
            fontSize: 11,
            fontWeight: 500,
            color: isActivated ? ACCENT : PENDING_TEXT,
          }}>
            {label}
          </span>
        </>
      )}
    </div>
  )
}
