// ============================================================
// 跟隨產品的工廠相機控制
// ============================================================

import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { interpolate } from 'remotion'
import { STATION_X } from './constants'

interface FactoryCameraControllerProps {
  productX: number
  frame: number
}

export default function FactoryCameraController({ productX, frame }: FactoryCameraControllerProps) {
  const { camera } = useThree()

  useEffect(() => {
    // 相機跟隨產品 X 座標（有延遲和偏移）
    const targetLookX = interpolate(productX, [STATION_X.start, STATION_X.display], [-2, 3], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })

    // 相機距離隨場景階段變化
    const cameraZ = interpolate(frame, [0, 285, 300], [8, 8, 6], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })

    const cameraY = interpolate(frame, [0, 285, 300], [5, 5, 3.5], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })

    camera.position.set(targetLookX + 2, cameraY, cameraZ)
    camera.lookAt(targetLookX, 1, 0)
  })

  return null
}
