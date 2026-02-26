// ============================================================
// 能量脈衝粒子 + 上線慶祝粒子（取代施工火花 + 煙火）
// ============================================================

import { useMemo } from 'react'
import { COLORS } from './constants'

const PULSE_COUNT = 30
const CELEB_COUNT = 50
const CELEB_COLORS = [COLORS.celebGold, COLORS.celebBlue, COLORS.celebGreen]

interface ParticlesProps {
  visible: boolean
  isCelebration?: boolean
  frame: number
}

export default function Particles({ visible, isCelebration, frame }: ParticlesProps) {
  // 能量脈衝種子（工作中顯示）
  const pulseSeeds = useMemo(() =>
    Array.from({ length: PULSE_COUNT }, (_, i) => ({
      angle: (i / PULSE_COUNT) * Math.PI * 2,
      radius: 1.0 + Math.random() * 3.0,
      speed: 0.2 + Math.random() * 0.3,
      yBase: -0.5 + Math.random() * 3.5,
      phase: Math.random() * Math.PI * 2,
    })),
  [])

  // 慶祝粒子種子
  const celebSeeds = useMemo(() =>
    Array.from({ length: CELEB_COUNT }, (_, i) => ({
      theta: Math.random() * Math.PI * 2,
      phi: Math.random() * Math.PI * 0.8,
      speed: 1.0 + Math.random() * 2.0,
      colorIndex: i % 3,
      sizeMultiplier: 0.5 + Math.random() * 1.0,
    })),
  [])

  if (!visible && !isCelebration) return null

  return (
    <group>
      {/* 能量脈衝粒子（藍色，往上漂浮） */}
      {visible && !isCelebration && pulseSeeds.map((seed, i) => {
        const t = (frame * seed.speed * 0.03 + seed.phase) % (Math.PI * 2)
        const x = Math.cos(seed.angle + t * 0.3) * seed.radius
        const y = (seed.yBase + frame * 0.015) % 4 - 0.5
        const z = Math.sin(seed.angle + t * 0.3) * seed.radius
        const opacity = 0.15 + Math.sin(t) * 0.15

        return (
          <mesh key={`pulse${i}`} position={[x, y, z]}>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshBasicMaterial
              color={COLORS.sparkBlue}
              transparent
              opacity={opacity}
            />
          </mesh>
        )
      })}

      {/* 上線慶祝粒子（多色，往外擴散 + 緩慢下落） */}
      {isCelebration && celebSeeds.map((seed, i) => {
        const celebFrame = Math.max(0, frame - 880)
        const expand = Math.min(celebFrame * 0.06, 1) * seed.speed
        const x = Math.sin(seed.phi) * Math.cos(seed.theta) * expand
        const y = 2 + Math.cos(seed.phi) * expand - celebFrame * 0.008
        const z = Math.sin(seed.phi) * Math.sin(seed.theta) * expand
        const opacity = Math.max(0, 1 - celebFrame * 0.02)
        const size = 0.04 * seed.sizeMultiplier

        return (
          <mesh key={`celeb${i}`} position={[x, y, z]}>
            <sphereGeometry args={[size, 6, 6]} />
            <meshBasicMaterial
              color={CELEB_COLORS[seed.colorIndex]}
              transparent
              opacity={opacity}
            />
          </mesh>
        )
      })}
    </group>
  )
}
