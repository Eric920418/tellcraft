// ============================================================
// 工位粒子效果（火花/油漆滴/光點）
// ============================================================

import { useMemo } from 'react'
import { FACTORY_COLORS, STATION_X, BELT } from './constants'

const SPARK_COUNT = 12
const PAINT_COUNT = 8
const GLOW_COUNT = 6

interface FactoryParticlesProps {
  frame: number
  s1Active: boolean
  s2Active: boolean
  s3Active: boolean
  displayActive: boolean
}

export default function FactoryParticles({ frame, s1Active, s2Active, s3Active, displayActive }: FactoryParticlesProps) {
  const sparkSeeds = useMemo(() =>
    Array.from({ length: SPARK_COUNT }, () => ({
      dx: (Math.random() - 0.5) * 0.8,
      dy: Math.random() * 0.6,
      dz: (Math.random() - 0.5) * 0.8,
      speed: 0.5 + Math.random() * 0.5,
    })),
  [])

  const paintSeeds = useMemo(() =>
    Array.from({ length: PAINT_COUNT }, () => ({
      dx: (Math.random() - 0.5) * 0.5,
      dz: (Math.random() - 0.5) * 0.5,
      speed: 0.3 + Math.random() * 0.3,
    })),
  [])

  const glowSeeds = useMemo(() =>
    Array.from({ length: GLOW_COUNT }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: 0.3 + Math.random() * 0.4,
      speed: 0.3 + Math.random() * 0.4,
    })),
  [])

  return (
    <group>
      {/* 工位 1 火花 */}
      {s1Active && sparkSeeds.map((seed, i) => {
        const t = ((frame * seed.speed * 0.08) % 1)
        const x = STATION_X.station1 + seed.dx
        const y = BELT.y + 0.5 + seed.dy * t
        const z = seed.dz
        const opacity = 1 - t

        return (
          <mesh key={`s1p${i}`} position={[x, y, z]}>
            <sphereGeometry args={[0.02, 4, 4]} />
            <meshBasicMaterial color={FACTORY_COLORS.spark} transparent opacity={opacity * 0.8} />
          </mesh>
        )
      })}

      {/* 工位 2 油漆滴 */}
      {s2Active && paintSeeds.map((seed, i) => {
        const t = ((frame * seed.speed * 0.06) % 1)
        const x = STATION_X.station2 + seed.dx
        const y = BELT.y + 1.5 - t * 0.8
        const z = seed.dz
        const opacity = 1 - t

        return (
          <mesh key={`s2p${i}`} position={[x, y, z]}>
            <sphereGeometry args={[0.025, 4, 4]} />
            <meshBasicMaterial color={FACTORY_COLORS.paintDrop} transparent opacity={opacity * 0.7} />
          </mesh>
        )
      })}

      {/* 展示台光點 */}
      {displayActive && glowSeeds.map((seed, i) => {
        const angle = seed.angle + frame * seed.speed * 0.04
        const x = STATION_X.display + Math.cos(angle) * seed.radius
        const y = 0.5 + Math.sin(frame * 0.1 + i) * 0.2
        const z = Math.sin(angle) * seed.radius

        return (
          <mesh key={`dp${i}`} position={[x, y, z]}>
            <sphereGeometry args={[0.03, 4, 4]} />
            <meshBasicMaterial color={FACTORY_COLORS.glow} transparent opacity={0.6} />
          </mesh>
        )
      })}
    </group>
  )
}
