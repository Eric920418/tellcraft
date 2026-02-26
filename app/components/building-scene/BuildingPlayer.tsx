'use client'

import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { Player, type PlayerRef } from '@remotion/player'
import BuildingComposition from '../remotion/building-scene/BuildingComposition'
import BuildingFallback2D from '../remotion/building-scene/BuildingFallback2D'
import { FPS, TOTAL_FRAMES } from '../remotion/building-scene/constants'

// ============================================================
// Building Player 包裝器
// 動畫跟隨用戶回答逐步推進：每答一題播放 30 幀後暫停
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

  // 用 ref 追蹤目標幀和完成狀態，避免 state 重渲染延遲
  const targetFrameRef = useRef(0)
  const isCompleteRef = useRef(false)
  const prevProgressRef = useRef(0)

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

  // frameupdate 回調：到達目標幀時暫停
  const handleFrameUpdate = useCallback((e: { detail: { frame: number } }) => {
    if (e.detail.frame >= targetFrameRef.current && !isCompleteRef.current) {
      playerRef.current?.pause()
    }
  }, [])

  // 註冊 frameupdate 事件監聽器
  useEffect(() => {
    const player = playerRef.current
    if (!player) return

    player.addEventListener('frameupdate', handleFrameUpdate)
    // 掛載時停在 frame 0
    player.seekTo(0)
    player.pause()

    return () => {
      player.removeEventListener('frameupdate', handleFrameUpdate)
    }
  }, [handleFrameUpdate, webglOk])

  // progress 變化：計算目標幀並播放
  useEffect(() => {
    const player = playerRef.current
    if (!player) return

    if (progress <= 0) {
      targetFrameRef.current = 0
      player.seekTo(0)
      player.pause()
      prevProgressRef.current = 0
      return
    }

    const newTarget = Math.min(progress * 30, TOTAL_FRAMES - 1)
    targetFrameRef.current = newTarget

    // 頁面刷新/重新載入時 progress 已經有值但 prevProgress 是 0
    // 直接跳到目標幀顯示已建好的狀態
    if (prevProgressRef.current === 0 && progress > 1) {
      player.seekTo(newTarget)
      player.pause()
    } else {
      // 正常逐步推進：從當前幀播放到目標幀
      player.play()
    }

    prevProgressRef.current = progress
  }, [progress])

  // isComplete 變化：完成時解除暫停限制，讓動畫播完 + loop
  useEffect(() => {
    const player = playerRef.current
    if (!player) return

    isCompleteRef.current = !!isComplete

    if (isComplete) {
      targetFrameRef.current = TOTAL_FRAMES - 1
      player.play()
    }
  }, [isComplete])

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
    // 2D Remotion fallback（同樣邏輯：不 autoPlay，由 frameupdate 控制）
    return (
      <div style={{ height: '100%', overflow: 'hidden' }}>
        <Player
          ref={playerRef}
          component={BuildingFallback2D}
          inputProps={{ round, progress, totalQuestions, isWorking }}
          compositionWidth={1280}
          compositionHeight={720}
          durationInFrames={TOTAL_FRAMES}
          fps={FPS}
          style={style}
          loop={!!isComplete}
          controls={false}
          showVolumeControls={false}
          clickToPlay={false}
        />
      </div>
    )
  }

  return (
    <div style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Player
        ref={playerRef}
        component={BuildingComposition}
        inputProps={inputProps}
        compositionWidth={1280}
        compositionHeight={720}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        style={style}
        loop={!!isComplete}
        controls={false}
        showVolumeControls={false}
        clickToPlay={false}
      />
    </div>
  )
}
