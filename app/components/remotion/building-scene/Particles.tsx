// ============================================================
// 施工粒子（幀驅動，替代 useFrame）
// ============================================================

import { useMemo } from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import * as THREE from 'three'
import { COLORS } from './constants'

const PARTICLE_COUNT = 30

export default function Particles({ visible }: { visible: boolean }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const basePositions = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 6
      arr[i * 3 + 1] = Math.random() * 4
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6
    }
    return arr
  }, [])

  // 每幀計算粒子位置（確定性，基於 frame）
  const positions = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3)
    const speed = 0.5 / fps
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr[i * 3] = basePositions[i * 3]
      const baseY = basePositions[i * 3 + 1]
      const y = (baseY + frame * speed) % 4
      arr[i * 3 + 1] = y
      arr[i * 3 + 2] = basePositions[i * 3 + 2]
    }
    return arr
  }, [frame, fps, basePositions])

  const rotation = (frame * 0.1) / fps

  if (!visible) return null

  return (
    <points rotation={[0, rotation, 0]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={PARTICLE_COUNT}
        />
      </bufferGeometry>
      <pointsMaterial
        color={COLORS.blueprint}
        size={0.05}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}
