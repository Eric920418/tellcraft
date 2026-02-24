// ============================================================
// Fast Build 主 Composition：組合所有子元件
// ============================================================

import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'
import { SMOOTH } from '../shared/springs'
import { pulse } from '../shared/utils'
import BlueprintGrid from './BlueprintGrid'
import PhaseNode from './PhaseNode'
import ConnectingLine from './ConnectingLine'
import ProgressBar from './ProgressBar'
import StepText from './StepText'
import { PHASES, BLUEPRINT_BG } from './constants'

export default function FastBuildComposition() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // 標題入場
  const titleProgress = spring({ frame, fps, config: SMOOTH })
  const titleOpacity = interpolate(titleProgress, [0, 1], [0, 1])
  const titleY = interpolate(titleProgress, [0, 1], [-10, 0])

  // 省略號閃爍（frame 驅動）
  const dotsOpacity = pulse(frame, 0.07, 0.3, 1)

  return (
    <AbsoluteFill style={{
      background: BLUEPRINT_BG,
      fontFamily: 'var(--font-mono, monospace)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    }}>
      <BlueprintGrid />

      {/* 標題 */}
      <div style={{
        fontSize: 18,
        fontWeight: 600,
        color: '#0f172a',
        marginBottom: 40,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        opacity: titleOpacity,
        transform: `translateY(${titleY}px)`,
        zIndex: 1,
      }}>
        <span>建站中</span>
        <span style={{ opacity: dotsOpacity }}>...</span>
      </div>

      {/* 三階段節點 + 連接線 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        marginBottom: 40,
        zIndex: 1,
      }}>
        {PHASES.map((p, i) => (
          <div key={p.key} style={{ display: 'flex', alignItems: 'center' }}>
            <PhaseNode index={i} label={p.label} />
            {i < PHASES.length - 1 && (
              <ConnectingLine index={i} />
            )}
          </div>
        ))}
      </div>

      {/* 步驟文字 */}
      <div style={{ marginBottom: 24, zIndex: 1 }}>
        <StepText />
      </div>

      {/* 進度條 */}
      <div style={{ zIndex: 1 }}>
        <ProgressBar />
      </div>
    </AbsoluteFill>
  )
}
