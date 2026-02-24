// ============================================================
// 背景藍圖網格 + 掃描線動畫
// ============================================================

import { useCurrentFrame, useVideoConfig, AbsoluteFill } from 'remotion'
import { loopValue } from '../shared/utils'
import { GRID_COLOR, SCAN_COLOR } from './constants'

export default function BlueprintGrid() {
  const frame = useCurrentFrame()
  const { height } = useVideoConfig()

  // 掃描線 Y 位置：60 幀一個循環
  const scanY = loopValue(frame, 90, -20, height + 20)

  return (
    <AbsoluteFill>
      {/* 網格背景 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(${GRID_COLOR} 1px, transparent 1px),
            linear-gradient(90deg, ${GRID_COLOR} 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }}
      />
      {/* 水平掃描線 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: scanY,
          height: 2,
          background: `linear-gradient(90deg, transparent 0%, ${SCAN_COLOR} 30%, ${SCAN_COLOR} 70%, transparent 100%)`,
          filter: 'blur(1px)',
        }}
      />
      {/* 掃描線光暈 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: scanY - 8,
          height: 18,
          background: `linear-gradient(90deg, transparent 10%, rgba(59,130,246,0.04) 40%, rgba(59,130,246,0.04) 60%, transparent 90%)`,
        }}
      />
    </AbsoluteFill>
  )
}
