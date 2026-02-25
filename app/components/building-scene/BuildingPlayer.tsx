'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import { Player, type PlayerRef } from '@remotion/player'
import BuildingComposition from '../remotion/building-scene/BuildingComposition'
import BuildingFallback2D from '../remotion/building-scene/BuildingFallback2D'
import { FPS, TOTAL_FRAMES } from '../remotion/building-scene/constants'

// ============================================================
// Building Player 包裝器
// Props interface 與 BuildingScene 完全相同
// ============================================================

interface BuildingPlayerProps {
  progress: number       // 已回答的題數 (0-30)
  totalQuestions: number  // 總題數
  round: number          // 當前輪次 (1-6)
  maxRounds?: number     // 最大輪次（用於動態調整）
  isWorking?: boolean    // LLM 正在工作
  isComplete?: boolean   // Q&A 結束
}

export default function BuildingPlayer({
  progress,
  totalQuestions,
  round,
  maxRounds: _maxRounds = 6,
  isWorking,
  isComplete,
}: BuildingPlayerProps) {
  const playerRef = useRef<PlayerRef>(null)
  const [webglOk, setWebglOk] = useState(true)

  // WebGL 檢測
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      if (!gl) setWebglOk(false)
    } catch {
      setWebglOk(false)
    }
  }, [])

  // 根據已回答題數跳轉到對應幀
  useEffect(() => {
    const player = playerRef.current
    if (!player || progress <= 0) return

    const targetFrame = Math.min(progress * 30, TOTAL_FRAMES - 1)
    player.seekTo(targetFrame)
    player.play()
  }, [progress])

  const inputProps = useMemo(() => ({
    isWorking,
    round,
    progress,
    totalQuestions,
  }), [isWorking, round, progress, totalQuestions])

  const style = useMemo(() => ({
    width: '100%',
    height: '100%',
  }), [])

  if (!webglOk) {
    // 2D Remotion fallback
    return (
      <div style={{ height: '100%' }}>
        <Player
          ref={playerRef}
          component={BuildingFallback2D}
          inputProps={{ round, progress, totalQuestions, isWorking }}
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

  return (
    <div style={{ height: '100%', position: 'relative', background: '#f8fafc' }}>
      <Player
        ref={playerRef}
        component={BuildingComposition}
        inputProps={inputProps}
        compositionWidth={800}
        compositionHeight={600}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        style={style}
        autoPlay
        loop={!!isComplete}
        controls={false}
        showVolumeControls={false}
        clickToPlay={false}
      />
    </div>
  )
}
