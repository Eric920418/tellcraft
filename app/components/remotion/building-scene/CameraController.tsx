// ============================================================
// 幀驅動相機控制（替代 OrbitControls + useFrame）
// ============================================================

import { useCurrentFrame, useVideoConfig } from 'remotion'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { useAnimationValues } from './FrameDrivenAnimations'

export default function CameraController() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const { camera } = useThree()
  const values = useAnimationValues(frame, fps)

  // 每幀更新相機位置
  useEffect(() => {
    camera.position.y = values.cameraY

    // 完工後緩慢旋轉
    if (values.celebrationRotation > 0) {
      const angle = values.celebrationRotation
      const radius = Math.sqrt(camera.position.x ** 2 + camera.position.z ** 2)
      camera.position.x = Math.cos(angle) * radius
      camera.position.z = Math.sin(angle) * radius
      camera.lookAt(0, 1, 0)
    }
  })

  return null
}
