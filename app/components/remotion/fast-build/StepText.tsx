// ============================================================
// 文字模糊漸入效果
// ============================================================

import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { SMOOTH } from '../shared/springs'
import { STEP_TEXTS, PHASE_FRAMES } from './constants'

export default function StepText() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // 根據幀確定當前階段
  let phase = 'structure'
  let phaseLocalFrame = frame
  if (frame >= PHASE_FRAMES.phase3.start) {
    phase = 'rwd'
    phaseLocalFrame = frame - PHASE_FRAMES.phase3.start
  } else if (frame >= PHASE_FRAMES.phase2.start) {
    phase = 'animation'
    phaseLocalFrame = frame - PHASE_FRAMES.phase2.start
  } else if (frame >= PHASE_FRAMES.phase1.start) {
    phase = 'structure'
    phaseLocalFrame = frame - PHASE_FRAMES.phase1.start
  } else {
    // idle 階段
    return (
      <div style={{
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        height: 20,
      }}>
        準備就緒...
      </div>
    )
  }

  const texts = STEP_TEXTS[phase] || STEP_TEXTS.structure
  // 每 25 幀切換一次文字
  const textIndex = Math.min(Math.floor(phaseLocalFrame / 25), texts.length - 1)
  const textLocalFrame = phaseLocalFrame - textIndex * 25

  // 每次切換時的淡入動畫
  const enterProgress = spring({
    frame: textLocalFrame,
    fps,
    config: SMOOTH,
  })
  const opacity = interpolate(enterProgress, [0, 1], [0, 1])
  const blur = interpolate(enterProgress, [0, 1], [4, 0])
  const y = interpolate(enterProgress, [0, 1], [8, 0])

  return (
    <div style={{
      fontSize: 14,
      color: '#64748b',
      textAlign: 'center',
      height: 20,
      opacity,
      filter: `blur(${blur}px)`,
      transform: `translateY(${y}px)`,
    }}>
      {texts[textIndex]}
    </div>
  )
}
