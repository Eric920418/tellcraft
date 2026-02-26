// ============================================================
// App Building Scene 主 Composition：ThreeCanvas + 深色背景 + 3D 場景
// ============================================================

import { useCurrentFrame, useVideoConfig } from 'remotion'
import { ThreeCanvas } from '@remotion/three'
import AppMeshes from './AppMeshes'
import CameraController from './CameraController'
import SceneBackground from './SceneBackground'
import { useAppAnimationValues } from './FrameDrivenAnimations'
import { COLORS } from './constants'

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
  const v = useAppAnimationValues(frame, fps)

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: COLORS.bgDark }}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ position: [10, 10, 10], fov: 35 }}
      >
        {/* 深色科技風背景 */}
        <SceneBackground progress={v.ghostToSolid} />

        {/* 柔和 3 點光源 */}
        <ambientLight intensity={v.ambientIntensity} />
        <directionalLight
          position={[6, 10, 5]}
          intensity={v.mainLightIntensity}
          castShadow={false}
          color="#f0f0ff"
        />
        <directionalLight
          position={[-4, 5, -3]}
          intensity={v.mainLightIntensity * 0.25}
          color="#a0b0ff"
        />
        <pointLight
          position={[0, -1, 4]}
          intensity={v.lightBoost}
          distance={15}
          color={COLORS.accentBlue}
        />

        <AppMeshes isWorking={isWorking} />
        <CameraController />
      </ThreeCanvas>
    </div>
  )
}
