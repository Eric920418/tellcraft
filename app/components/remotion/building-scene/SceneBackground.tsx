// ============================================================
// 深色科技風背景（取代 CastleSky 天空半球）
// 靜態深色漸層 + 微弱星點
// ============================================================

import { useMemo } from 'react'
import * as THREE from 'three'
import { COLORS } from './constants'

interface SceneBackgroundProps {
  /** 建構進度 0→1，影響底部網格亮度 */
  progress: number
}

export default function SceneBackground({ progress }: SceneBackgroundProps) {
  // 背景球體：內側深色漸層
  const bgGeometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(50, 16, 12)
    geo.scale(-1, 1, -1) // 翻轉法線
    return geo
  }, [])

  const bgColors = useMemo(() => {
    const topRGB = hexToRgb(COLORS.bgGradientTop)
    const bottomRGB = hexToRgb(COLORS.bgGradientBottom)

    const posAttr = bgGeometry.getAttribute('position')
    const count = posAttr.count
    const arr = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const y = posAttr.getY(i)
      const t = Math.max(0, Math.min(1, (y + 50) / 100))
      arr[i * 3] = (bottomRGB[0] + (topRGB[0] - bottomRGB[0]) * t) / 255
      arr[i * 3 + 1] = (bottomRGB[1] + (topRGB[1] - bottomRGB[1]) * t) / 255
      arr[i * 3 + 2] = (bottomRGB[2] + (topRGB[2] - bottomRGB[2]) * t) / 255
    }
    return arr
  }, [bgGeometry])

  // 星點
  const starPositions = useMemo(() => {
    const count = 80
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      // 只在上半球
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI * 0.45
      const r = 40
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = r * Math.cos(phi) + 5
      arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    }
    return arr
  }, [])

  return (
    <group>
      {/* 背景球 */}
      <mesh geometry={bgGeometry}>
        <bufferGeometry attach="geometry">
          <bufferAttribute
            attach="attributes-position"
            args={[bgGeometry.getAttribute('position').array, 3]}
            count={bgGeometry.getAttribute('position').count}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[bgColors, 3]}
            count={bgColors.length / 3}
          />
          {bgGeometry.index && (
            <bufferAttribute
              attach="index"
              args={[bgGeometry.index.array, 1]}
              count={bgGeometry.index.count}
            />
          )}
        </bufferGeometry>
        <meshBasicMaterial vertexColors side={THREE.BackSide} />
      </mesh>

      {/* 微弱星點 */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[starPositions, 3]}
            count={starPositions.length / 3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#ffffff"
          size={0.15}
          transparent
          opacity={0.15 + progress * 0.15}
          sizeAttenuation
        />
      </points>
    </group>
  )
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ]
}
