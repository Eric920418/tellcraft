// ============================================================
// 幀驅動相機控制 + 天空漸變環繞
// ============================================================

import { useCurrentFrame, useVideoConfig } from 'remotion'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { useCastleAnimationValues } from './FrameDrivenAnimations'

const BASE_RADIUS = 11

export default function CameraController() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const { camera } = useThree()
  const v = useCastleAnimationValues(frame, fps)

  useEffect(() => {
    const angle = v.cameraOrbitAngle
    const radius = BASE_RADIUS

    camera.position.x = Math.cos(angle) * radius
    camera.position.y = v.cameraY
    camera.position.z = Math.sin(angle) * radius

    // 永遠看向城堡中心（略偏上）
    camera.lookAt(0, 1.5, 0)
  })

  return null
}
