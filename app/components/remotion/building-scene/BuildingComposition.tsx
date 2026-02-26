// ============================================================
// 城堡 Building Scene 主 Composition：ThreeCanvas + 天空 + 3D 場景
// UI overlay 已移至 BuildingPlayer 外層（直接用 React props，不依賴 Remotion inputProps）
// ============================================================

import { useCurrentFrame, useVideoConfig } from 'remotion'
import { ThreeCanvas } from '@remotion/three'
import BuildingMeshes from './BuildingMeshes'
import CameraController from './CameraController'
import CastleSky from './CastleSky'
import { useCastleAnimationValues } from './FrameDrivenAnimations'

interface BuildingCompositionProps {
  isWorking?: boolean
  round?: number
  progress?: number
  totalQuestions?: number
}

export default function BuildingComposition({
  isWorking,
}: BuildingCompositionProps) {
  const frame = useCurrentFrame()
  const { width, height, fps } = useVideoConfig()
  const v = useCastleAnimationValues(frame, fps)

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
    </div>
  )
}
