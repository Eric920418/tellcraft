// @ts-nocheck — 已被 BddAnimationPanel.tsx 取代，保留作後續清理參考
'use client'

import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Player, type PlayerRef } from '@remotion/player'
import BuildingComposition from '../remotion/building-scene/BuildingComposition'
import BuildingFallback2D from '../remotion/building-scene/BuildingFallback2D'
import { FPS, TOTAL_FRAMES, ROUND_LABELS, ROUND_COLORS } from '../remotion/building-scene/constants'

// ============================================================
// Building Player 包裝器
// 動畫跟隨用戶回答逐步推進：每答一題播放 30 幀後暫停
// compositionWidth/Height 動態匹配容器，消除 letterbox 黑邊
// 進度 overlay 在此層渲染（直接用 React props，即時更新）
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
  const t = useTranslations('buildingPlayer')
  const playerRef = useRef<PlayerRef>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [webglOk, setWebglOk] = useState(true)
  // 動態容器尺寸（消除 letterbox 黑邊）
  const [containerSize, setContainerSize] = useState<{ w: number; h: number } | null>(null)

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

  // 偵測容器尺寸，讓 compositionWidth/Height 完美匹配
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const { width, height } = el.getBoundingClientRect()
      if (width > 0 && height > 0) {
        setContainerSize({ w: Math.round(width), h: Math.round(height) })
      }
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // frameupdate 回調：到達目標幀時暫停
  const handleFrameUpdate = useCallback((e: { detail: { frame: number } }) => {
    if (e.detail.frame >= targetFrameRef.current && !isCompleteRef.current) {
      playerRef.current?.pause()
    }
  }, [])

  // 註冊 frameupdate 事件監聯器
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
  }, [handleFrameUpdate, webglOk, containerSize])

  // progress 變化：計算目標幀並播放
  // containerSize 在依賴中確保 Player 渲染後 effect 重跑（頁面刷新時 Player 晚於 progress 出現）
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

    // 歸一化幀映射：按 progress/totalQuestions 比例分配整個 900 幀
    const ratio = totalQuestions > 0 ? progress / totalQuestions : 0
    const newTarget = Math.min(Math.floor(ratio * TOTAL_FRAMES), TOTAL_FRAMES - 1)
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
  }, [progress, totalQuestions, containerSize])

  // isComplete 變化：完成時解除暫停限制，讓動畫播完 + loop
  useEffect(() => {
    const player = playerRef.current
    if (!player) return

    isCompleteRef.current = !!isComplete

    if (isComplete) {
      targetFrameRef.current = TOTAL_FRAMES - 1
      player.play()
    }
  }, [isComplete, containerSize])

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

  const compW = containerSize?.w ?? 1280
  const compH = containerSize?.h ?? 720

  // 進度計算（直接用 React props，即時更新）
  const percent = totalQuestions > 0 ? Math.round((progress / totalQuestions) * 100) : 0

  // 基於進度比例映射到 6 輪視覺顯示（後端 round/maxRounds 可能不是 6）
  const visualRound = Math.min(6, Math.ceil((progress / Math.max(1, totalQuestions)) * 6))

  // 進度 overlay（在 Player 外層，不依賴 Remotion inputProps）
  const progressOverlay = (
    <div style={{
      position: 'absolute',
      bottom: 16,
      left: 0,
      right: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      pointerEvents: 'none',
      zIndex: 10,
    }}>
      {/* 輪次標籤 */}
      <div style={{
        display: 'flex',
        gap: 4,
        padding: '6px 12px',
        background: 'rgba(0,0,0,0.35)',
        borderRadius: 20,
        backdropFilter: 'blur(8px)',
      }}>
        {ROUND_LABELS.map((label, i) => (
          <span key={label} style={{
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 10,
            background: i < visualRound ? ROUND_COLORS[i] : 'transparent',
            color: i < visualRound ? 'white' : 'rgba(255,255,255,0.4)',
            fontWeight: i === visualRound - 1 ? 600 : 400,
          }}>
            {label}
          </span>
        ))}
      </div>

      {/* 進度文字 */}
      <div style={{
        fontSize: 12,
        color: 'rgba(255,255,255,0.85)',
        background: 'rgba(0,0,0,0.3)',
        padding: '4px 12px',
        borderRadius: 12,
        backdropFilter: 'blur(4px)',
      }}>
        {t('questionsComplete', { progress, total: totalQuestions, percent })}
        {isWorking && t('aiAnalyzing')}
      </div>
    </div>
  )

  if (!webglOk) {
    // 2D Remotion fallback（同樣邏輯：不 autoPlay，由 frameupdate 控制）
    return (
      <div ref={containerRef} style={{ height: '100%', width: '100%', position: 'relative', overflow: 'hidden' }}>
        {containerSize && (
          <Player
            ref={playerRef}
            component={BuildingFallback2D}
            inputProps={{ round, progress, totalQuestions, isWorking }}
            compositionWidth={compW}
            compositionHeight={compH}
            durationInFrames={TOTAL_FRAMES}
            fps={FPS}
            style={style}
            loop={!!isComplete}
            controls={false}
            showVolumeControls={false}
            clickToPlay={false}
          />
        )}
        {progressOverlay}
      </div>
    )
  }

  return (
    <div ref={containerRef} style={{ height: '100%', width: '100%', position: 'relative', overflow: 'hidden' }}>
      {containerSize && (
        <Player
          ref={playerRef}
          component={BuildingComposition}
          inputProps={inputProps}
          compositionWidth={compW}
          compositionHeight={compH}
          durationInFrames={TOTAL_FRAMES}
          fps={FPS}
          style={style}
          loop={!!isComplete}
          controls={false}
          showVolumeControls={false}
          clickToPlay={false}
        />
      )}
      {progressOverlay}
    </div>
  )
}
