// @ts-nocheck — 已被 CraftComposition.tsx 內嵌 CraftCamera 取代，保留作後續清理參考
// ============================================================
// 幀驅動相機控制（科技風俯瞰→平視）
// ============================================================

import { useCurrentFrame, useVideoConfig } from 'remotion'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { useAppAnimationValues } from './FrameDrivenAnimations'

const BASE_RADIUS = 10

export default function CameraController() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const { camera } = useThree()
  const v = useAppAnimationValues(frame, fps)

  useEffect(() => {
    const angle = v.cameraOrbitAngle - 0.3 // 初始稍偏右前方
    const radius = BASE_RADIUS

    camera.position.x = Math.cos(angle) * radius
    camera.position.y = v.cameraY
    camera.position.z = Math.sin(angle) * radius

    // 永遠看向平台中心（略偏上）
    camera.lookAt(0, 0.8, 0)
  })

  return null
}
