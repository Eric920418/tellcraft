// ============================================================
// 城堡 Building Scene 主 Composition：ThreeCanvas + 天空 + 3D 場景
// ============================================================

import { useCurrentFrame, useVideoConfig } from 'remotion'
import { ThreeCanvas } from '@remotion/three'
import BuildingMeshes from './BuildingMeshes'
import CameraController from './CameraController'
import CastleSky from './CastleSky'
import { useCastleAnimationValues } from './FrameDrivenAnimations'
import { ROUND_LABELS, ROUND_COLORS } from './constants'

interface BuildingCompositionProps {
  isWorking?: boolean
  round?: number
  progress?: number
  totalQuestions?: number
}

export default function BuildingComposition({
  isWorking,
  round = 1,
  progress = 0,
  totalQuestions = 30,
}: BuildingCompositionProps) {
  const frame = useCurrentFrame()
  const { width, height, fps } = useVideoConfig()
  const v = useCastleAnimationValues(frame, fps)

  const percent = totalQuestions > 0 ? Math.round((progress / totalQuestions) * 100) : 0
  const frameRound = Math.min(6, Math.floor(frame / 150) + 1)
  const displayRound = round > 0 ? round : frameRound

  // 天空背景色（作為 canvas 底色）
  const bgR = Math.round(v.skyBottomRGB[0])
  const bgG = Math.round(v.skyBottomRGB[1])
  const bgB = Math.round(v.skyBottomRGB[2])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: `rgb(${bgR},${bgG},${bgB})` }}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ position: [11, 12, 11], fov: 30 }}
      >
        {/* 天空半球 */}
        <CastleSky topRGB={v.skyTopRGB} bottomRGB={v.skyBottomRGB} />

        {/* 動態光照 */}
        <ambientLight intensity={v.ambientIntensity} />
        <directionalLight position={[8, 12, 6]} intensity={v.sunIntensity} castShadow={false} />
        <directionalLight position={[-4, 6, -4]} intensity={v.sunIntensity * 0.3} />

        <BuildingMeshes isWorking={isWorking} />
        <CameraController />
      </ThreeCanvas>

      {/* UI Overlay */}
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
              background: i < displayRound ? ROUND_COLORS[i] : 'transparent',
              color: i < displayRound ? 'white' : 'rgba(255,255,255,0.4)',
              fontWeight: i === displayRound - 1 ? 600 : 400,
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
          {progress}/{totalQuestions} 題完成 · {percent}%
          {isWorking && ' · AI 分析中...'}
        </div>
      </div>
    </div>
  )
}
