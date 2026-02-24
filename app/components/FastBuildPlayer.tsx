'use client'

import { useRef, useEffect, useMemo } from 'react'
import { Player, type PlayerRef } from '@remotion/player'
import FastBuildComposition from './remotion/fast-build/FastBuildComposition'
import { FPS, TOTAL_FRAMES } from './remotion/fast-build/constants'

// ============================================================
// Fast Build Player 包裝器
// Props interface 與 FastBuildProgress 完全相同
// ============================================================

interface FastBuildPlayerProps {
  phase: 'structure' | 'animation' | 'rwd' | 'quality_gate' | 'complete'
  progress: { current: number; total: number; step: string }
  streamingChunks?: number
}

// phase → 目標幀映射
const PHASE_TARGET_FRAME: Record<string, number> = {
  structure: 30,
  animation: 130,
  rwd: 230,
  quality_gate: 280,
  complete: 295,
}

export default function FastBuildPlayer({ phase }: FastBuildPlayerProps) {
  const playerRef = useRef<PlayerRef>(null)

  useEffect(() => {
    const player = playerRef.current
    if (!player) return

    const targetFrame = PHASE_TARGET_FRAME[phase] ?? 0
    player.seekTo(targetFrame)
    player.play()
  }, [phase])

  // Player component style
  const style = useMemo(() => ({
    width: '100%',
    height: '100%',
  }), [])

  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8' }}>
      <Player
        ref={playerRef}
        component={FastBuildComposition}
        compositionWidth={640}
        compositionHeight={480}
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
