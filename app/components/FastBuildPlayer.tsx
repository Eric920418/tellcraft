'use client'

import { useRef, useEffect, useMemo } from 'react'
import { Player, type PlayerRef } from '@remotion/player'
import FastBuildComposition from './remotion/fast-build/FastBuildComposition'
import { FPS, TOTAL_FRAMES, PHASE_TARGET_FRAME, PHASE_LENGTHS } from './remotion/fast-build/constants'

// ============================================================
// Fast Build Player 包裝器（3D 工廠流水線）
// ============================================================

interface FastBuildPlayerProps {
  phase: 'structure' | 'animation' | 'rwd' | 'quality_gate' | 'complete'
  progress: { current: number; total: number; step: string }
  streamingChunks?: number
}

export default function FastBuildPlayer({ phase, streamingChunks }: FastBuildPlayerProps) {
  const playerRef = useRef<PlayerRef>(null)

  useEffect(() => {
    const player = playerRef.current
    if (!player) return

    const baseFrame = PHASE_TARGET_FRAME[phase] ?? 0
    const phaseLength = PHASE_LENGTHS[phase] ?? 100

    // streamingChunks 驅動微進度（佔該階段 80%）
    const microProgress = streamingChunks ? Math.min(streamingChunks / 50, 1) : 0
    const targetFrame = baseFrame + Math.floor(microProgress * phaseLength * 0.8)

    player.seekTo(Math.min(targetFrame, TOTAL_FRAMES - 1))
    player.play()
  }, [phase, streamingChunks])

  const style = useMemo(() => ({
    width: '100%',
    height: '100%',
  }), [])

  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <Player
        ref={playerRef}
        component={FastBuildComposition}
        compositionWidth={800}
        compositionHeight={600}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        style={style}
        autoPlay
        loop
        controls={false}
        showVolumeControls={false}
        clickToPlay={false}
      />
    </div>
  )
}
