// ============================================================
// 天空漸變半球：黎明→白天→黃昏
// 用 vertexColors 驅動漸層色（避免 shaderMaterial）
// ============================================================

import { useMemo } from 'react'
import * as THREE from 'three'

interface CastleSkyProps {
  topRGB: [number, number, number]
  bottomRGB: [number, number, number]
}

export default function CastleSky({ topRGB, bottomRGB }: CastleSkyProps) {
  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(50, 16, 12)
    // 翻轉法線讓材質從內側可見
    geo.scale(-1, 1, -1)
    return geo
  }, [])

  // 每幀更新頂點色（基於 Y 座標插值 top↔bottom）
  const colors = useMemo(() => {
    const posAttr = geometry.getAttribute('position')
    const count = posAttr.count
    const arr = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const y = posAttr.getY(i)
      // y 範圍 [-50, 50] → t [0, 1]
      const t = Math.max(0, Math.min(1, (y + 50) / 100))
      arr[i * 3] = (bottomRGB[0] + (topRGB[0] - bottomRGB[0]) * t) / 255
      arr[i * 3 + 1] = (bottomRGB[1] + (topRGB[1] - bottomRGB[1]) * t) / 255
      arr[i * 3 + 2] = (bottomRGB[2] + (topRGB[2] - bottomRGB[2]) * t) / 255
    }
    return arr
  }, [geometry, topRGB, bottomRGB])

  return (
    <mesh geometry={geometry}>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attach="attributes-position"
          args={[geometry.getAttribute('position').array, 3]}
          count={geometry.getAttribute('position').count}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={colors.length / 3}
        />
        {geometry.index && (
          <bufferAttribute
            attach="index"
            args={[geometry.index.array, 1]}
            count={geometry.index.count}
          />
        )}
      </bufferGeometry>
      <meshBasicMaterial vertexColors side={THREE.BackSide} />
    </mesh>
  )
}
