// ============================================================
// "The Craft" 3D 鍛造場景
// 核心 + 原料碎片 + 能量線 + 軌道環 + 火花粒子
// ============================================================

import { useMemo } from 'react'
import * as THREE from 'three'
import type { CraftAnimationValues } from './FrameDrivenAnimations'
import type {
  CoreShape,
  CraftPalette,
  FragmentData,
  EnergyLineData,
  OrbitRingData,
} from './procedural'
import { COLORS, ENERGY_LINE_SEGMENTS, RING_TUBE_RADIUS } from './constants'

interface CraftSceneProps {
  v: CraftAnimationValues
  frame: number
  coreShape: CoreShape
  palette: CraftPalette
  fragments: FragmentData[]
  energyLines: EnergyLineData[]
  orbitRings: OrbitRingData[]
}

export default function CraftScene({
  v,
  frame,
  coreShape,
  palette,
  fragments,
  energyLines,
  orbitRings,
}: CraftSceneProps) {
  return (
    <group>
      {/* 鍛造核心 */}
      <ForgeCore
        v={v}
        frame={frame}
        shape={coreShape}
        palette={palette}
      />

      {/* 原料碎片 */}
      <Fragments
        v={v}
        frame={frame}
        fragments={fragments}
        palette={palette}
      />

      {/* 能量線 */}
      <EnergyLines
        v={v}
        frame={frame}
        lines={energyLines}
        palette={palette}
      />

      {/* 軌道環 */}
      <OrbitRings
        v={v}
        frame={frame}
        rings={orbitRings}
        palette={palette}
      />

      {/* 火花粒子（慶祝） */}
      {v.celebrationActive && (
        <CelebrationSparks
          frame={frame}
          progress={v.celebrationProgress}
          palette={palette}
        />
      )}
    </group>
  )
}

// ═══════════════════════════════════════
// 鍛造核心
// ═══════════════════════════════════════

function ForgeCore({
  v,
  frame,
  shape,
  palette,
}: {
  v: CraftAnimationValues
  frame: number
  shape: CoreShape
  palette: CraftPalette
}) {
  // 根據進度選擇幾何
  const geometry = useMemo(() => {
    switch (shape) {
      case 'dodecahedron':
        return new THREE.DodecahedronGeometry(1, 1)
      case 'icosahedron':
        return new THREE.IcosahedronGeometry(1, 1)
      case 'octahedron':
        return new THREE.OctahedronGeometry(1, 1)
      case 'rhombic':
        return new THREE.DodecahedronGeometry(1, 0)
      default:
        return new THREE.IcosahedronGeometry(1, 1)
    }
  }, [shape])

  const sphereGeo = useMemo(() => new THREE.SphereGeometry(1, 24, 24), [])

  // Phase 色插值
  const emissiveColor = useMemo(() => {
    if (v.phase === 0) return COLORS.coreDimEmissive
    if (v.phase === 1) return COLORS.coreHotEmissive
    if (v.phase === 2) return COLORS.coreBrightEmissive
    return COLORS.coreGoldEmissive
  }, [v.phase])

  const rotation: [number, number, number] = [
    frame * v.coreRotationSpeed,
    frame * v.coreRotationSpeed * 0.7,
    frame * v.coreRotationSpeed * 0.3,
  ]

  // 使用 coreMorphProgress 在球體和多面體之間切換
  // morph < 0.5 → 球體; morph >= 0.5 → 多面體
  const usePolyhedron = v.coreMorphProgress >= 0.5

  return (
    <group>
      {/* 核心主體 */}
      <mesh
        rotation={rotation}
        scale={[v.coreScale, v.coreScale, v.coreScale]}
        geometry={usePolyhedron ? geometry : sphereGeo}
      >
        <meshPhysicalMaterial
          color="#2A1A0E"
          emissive={emissiveColor}
          emissiveIntensity={v.coreEmissiveIntensity}
          roughness={v.coreRoughness}
          metalness={0.8}
          clearcoat={v.coreClearcoat}
          clearcoatRoughness={0.2}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* 核心外層光暈（半透明球） */}
      <mesh scale={[v.coreScale * 1.3, v.coreScale * 1.3, v.coreScale * 1.3]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color={palette.coreEmissive}
          transparent
          opacity={v.coreEmissiveIntensity * 0.12}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  )
}

// ═══════════════════════════════════════
// 原料碎片
// ═══════════════════════════════════════

function Fragments({
  v,
  frame,
  fragments,
  palette,
}: {
  v: CraftAnimationValues
  frame: number
  fragments: FragmentData[]
  palette: CraftPalette
}) {
  return (
    <group>
      {fragments.map((frag, i) => {
        const absorb = v.fragmentAbsorb[i] ?? 0
        if (absorb >= 1) return null // 已完全吸入，不渲染

        // 起始位置（球面座標）
        const startX = Math.cos(frag.theta) * Math.cos(frag.phi) * frag.radius
        const startY = Math.sin(frag.phi) * frag.radius * 0.5
        const startZ = Math.sin(frag.theta) * Math.cos(frag.phi) * frag.radius

        // 漂浮 + 被吸入的混合
        const floatOffset = Math.sin(frame * 0.02 + i) * 0.3 * (1 - absorb)
        const x = startX * (1 - absorb)
        const y = (startY + floatOffset) * (1 - absorb)
        const z = startZ * (1 - absorb)

        // 接近核心時縮小
        const scale = (1 - absorb) * 0.15

        // 自轉
        const rot: [number, number, number] = [
          frame * frag.rotationSpeed,
          frame * frag.rotationSpeed * 1.3,
          0,
        ]

        return (
          <mesh
            key={i}
            position={[x, y, z]}
            rotation={rot}
            scale={[
              scale * frag.scaleX,
              scale * frag.scaleY,
              scale * frag.scaleZ,
            ]}
          >
            <octahedronGeometry args={[1, 0]} />
            <meshPhysicalMaterial
              color={palette.fragmentColor}
              emissive={palette.coreEmissive}
              emissiveIntensity={absorb * 0.8}
              roughness={0.7}
              metalness={0.5}
            />
          </mesh>
        )
      })}
    </group>
  )
}

// ═══════════════════════════════════════
// 能量線
// ═══════════════════════════════════════

function EnergyLines({
  v,
  frame,
  lines,
  palette,
}: {
  v: CraftAnimationValues
  frame: number
  lines: EnergyLineData[]
  palette: CraftPalette
}) {
  return (
    <group>
      {lines.map((line, i) => {
        const progress = v.energyLineProgress[i] ?? 0
        if (progress <= 0.01) return null

        return (
          <EnergyLine
            key={i}
            line={line}
            progress={progress}
            pulseIntensity={v.energyPulseIntensity}
            frame={frame}
            color={palette.energyColor}
          />
        )
      })}
    </group>
  )
}

function EnergyLine({
  line,
  progress,
  pulseIntensity,
  frame,
  color,
}: {
  line: EnergyLineData
  progress: number
  pulseIntensity: number
  frame: number
  color: string
}) {
  const curve = useMemo(() => {
    const points: THREE.Vector3[] = []
    for (let t = 0; t <= 1; t += 1 / ENERGY_LINE_SEGMENTS) {
      const r = t * line.length
      const wobble = Math.sin(t * Math.PI * 3) * 0.15
      points.push(new THREE.Vector3(
        Math.cos(line.angle) * r + wobble,
        line.elevation + Math.sin(t * Math.PI) * 0.5,
        Math.sin(line.angle) * r + wobble,
      ))
    }
    return new THREE.CatmullRomCurve3(points)
  }, [line])

  const geometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, ENERGY_LINE_SEGMENTS, 0.03, 6, false)
  }, [curve])

  // 脈衝波動效果
  const pulseOffset = Math.sin(frame * 0.1 + line.angle) * 0.3
  const emissiveIntensity = (0.5 + pulseIntensity * 0.5 + pulseOffset) * progress

  return (
    <mesh
      geometry={geometry}
      scale={[progress, progress, progress]}
    >
      <meshBasicMaterial
        color={color}
        transparent
        opacity={progress * 0.7}
      />
    </mesh>
  )
}

// ═══════════════════════════════════════
// 軌道環
// ═══════════════════════════════════════

function OrbitRings({
  v,
  frame,
  rings,
  palette,
}: {
  v: CraftAnimationValues
  frame: number
  rings: OrbitRingData[]
  palette: CraftPalette
}) {
  return (
    <group>
      {rings.map((ring, i) => {
        const scale = v.ringScale[i] ?? 0
        if (scale <= 0.01) return null

        // 環的呼吸動畫
        const breathe = 1 + Math.sin(frame * 0.03 + i * 2) * 0.05

        return (
          <mesh
            key={i}
            rotation={[ring.tiltX, frame * 0.002 * (i + 1), ring.tiltZ]}
            scale={[scale * breathe, scale * breathe, scale * breathe]}
          >
            <torusGeometry args={[ring.radius, RING_TUBE_RADIUS, 8, 64]} />
            <meshPhysicalMaterial
              color={i < 2 ? palette.ringColor : palette.sparkColor}
              emissive={palette.energyColor}
              emissiveIntensity={v.ringOpacity * 0.5}
              transparent
              opacity={v.ringOpacity}
              metalness={0.6}
              roughness={0.3}
            />
          </mesh>
        )
      })}
    </group>
  )
}

// ═══════════════════════════════════════
// 慶祝火花
// ═══════════════════════════════════════

function CelebrationSparks({
  frame,
  progress,
  palette,
}: {
  frame: number
  progress: number
  palette: CraftPalette
}) {
  const sparks = useMemo(() => {
    const count = 60
    const result: { theta: number; phi: number; speed: number; size: number }[] = []
    for (let i = 0; i < count; i++) {
      result.push({
        theta: (i / count) * Math.PI * 2 + Math.sin(i * 7) * 0.5,
        phi: Math.sin(i * 13) * Math.PI * 0.4,
        speed: 0.8 + Math.sin(i * 3) * 0.5 + 0.5,
        size: 0.02 + Math.sin(i * 17) * 0.01 + 0.01,
      })
    }
    return result
  }, [])

  const positions = useMemo(() => {
    const arr = new Float32Array(sparks.length * 3)
    return arr
  }, [sparks.length])

  // 更新粒子位置
  const celebFrame = Math.max(0, frame - 850)
  for (let i = 0; i < sparks.length; i++) {
    const s = sparks[i]
    const expand = Math.min(celebFrame * 0.04, 1) * s.speed * 3
    positions[i * 3] = Math.cos(s.theta) * Math.cos(s.phi) * expand
    positions[i * 3 + 1] = Math.sin(s.phi) * expand + Math.sin(celebFrame * 0.05 + i) * 0.3
    positions[i * 3 + 2] = Math.sin(s.theta) * Math.cos(s.phi) * expand
  }

  const opacity = Math.max(0, 1 - progress * 0.6)

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={sparks.length}
        />
      </bufferGeometry>
      <pointsMaterial
        color={palette.celebrationColor}
        size={0.15}
        transparent
        opacity={opacity}
        sizeAttenuation
      />
    </points>
  )
}
