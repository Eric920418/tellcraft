// ============================================================
// 施工火花 + 完工煙火（幀驅動）
// ============================================================

import { useMemo } from 'react'
import { COLORS } from './constants'

const SPARK_COUNT = 40
const FIREWORK_COUNT = 60
const FIREWORK_COLORS = [COLORS.fireworkRed, COLORS.fireworkGold, COLORS.fireworkBlue]

interface ParticlesProps {
  visible: boolean
  isFireworks?: boolean
  frame: number
}

export default function Particles({ visible, isFireworks, frame }: ParticlesProps) {
  // 施工火花種子
  const sparkSeeds = useMemo(() =>
    Array.from({ length: SPARK_COUNT }, (_, i) => ({
      angle: (i / SPARK_COUNT) * Math.PI * 2,
      radius: 0.5 + Math.random() * 2.5,
      speed: 0.3 + Math.random() * 0.4,
      yOffset: Math.random() * 3,
      phase: Math.random() * Math.PI * 2,
    })),
  [])

  // 煙火種子
  const fireworkSeeds = useMemo(() =>
    Array.from({ length: FIREWORK_COUNT }, (_, i) => ({
      theta: Math.random() * Math.PI * 2,
      phi: Math.random() * Math.PI,
      speed: 1.5 + Math.random() * 2.5,
      colorIndex: i % 3,
    })),
  [])

  if (!visible && !isFireworks) return null

  return (
    <group>
      {/* 施工火花（金色） */}
      {visible && !isFireworks && sparkSeeds.map((seed, i) => {
        const t = (frame * seed.speed * 0.03 + seed.phase) % (Math.PI * 2)
        const x = Math.cos(seed.angle + t * 0.5) * seed.radius
        const y = (seed.yOffset + frame * 0.02) % 4
        const z = Math.sin(seed.angle + t * 0.5) * seed.radius
        const opacity = 0.3 + Math.sin(t) * 0.3

        return (
          <mesh key={`spark${i}`} position={[x, y, z]}>
            <sphereGeometry args={[0.03, 4, 4]} />
            <meshBasicMaterial color={COLORS.sparkGold} transparent opacity={opacity} />
          </mesh>
        )
      })}

      {/* 完工煙火 */}
      {isFireworks && fireworkSeeds.map((seed, i) => {
        const fireworkFrame = Math.max(0, frame - 880)
        const expand = Math.min(fireworkFrame * 0.08, 1) * seed.speed
        const x = Math.sin(seed.phi) * Math.cos(seed.theta) * expand
        const y = 5 + Math.cos(seed.phi) * expand - fireworkFrame * 0.01
        const z = Math.sin(seed.phi) * Math.sin(seed.theta) * expand
        const opacity = Math.max(0, 1 - fireworkFrame * 0.03)

        return (
          <mesh key={`fw${i}`} position={[x, y, z]}>
            <sphereGeometry args={[0.06, 4, 4]} />
            <meshBasicMaterial
              color={FIREWORK_COLORS[seed.colorIndex]}
              transparent
              opacity={opacity}
            />
          </mesh>
        )
      })}
    </group>
  )
}
