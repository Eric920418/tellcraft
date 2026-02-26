// ============================================================
// "The Craft" v2 鍛造車間場景
// flatShading + castShadow + 材質對比 + 裝飾細節
// ============================================================

import { useMemo } from 'react'
import * as THREE from 'three'
import type { CraftAnimationValues } from './FrameDrivenAnimations'
import type { CoreShape, CraftPalette, OrbitRingData, SparkSeed, CoalData, AmbientEmberData } from './procedural'
import { COLORS, POSITIONS } from './constants'

interface CraftSceneProps {
  v: CraftAnimationValues
  frame: number
  coreShape: CoreShape
  palette: CraftPalette
  orbitRings: OrbitRingData[]
  sparkSeeds: SparkSeed[]
  coals: CoalData[]
  ambientEmbers: AmbientEmberData[]
}

export default function CraftScene({
  v,
  frame,
  coreShape,
  palette,
  orbitRings,
  sparkSeeds,
  coals,
  ambientEmbers,
}: CraftSceneProps) {
  return (
    <group>
      <Floor />
      <Furnace v={v} frame={frame} coals={coals} />
      <Bellows v={v} />
      <Anvil />
      {v.workpieceVisible && (
        <Workpiece v={v} frame={frame} coreShape={coreShape} palette={palette} />
      )}
      <Hammer v={v} />
      <Sparks v={v} seeds={sparkSeeds} palette={palette} />
      <OrbitRings v={v} frame={frame} rings={orbitRings} palette={palette} />
      <AmbientEmbers v={v} frame={frame} embers={ambientEmbers} />
      <FloorDebris />
      <ToolRack />
      {v.celebrationActive && (
        <CelebrationGlow v={v} frame={frame} palette={palette} />
      )}
    </group>
  )
}

// ═══════════════════════════════════════
// 地面
// ═══════════════════════════════════════

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial color={COLORS.floorDark} roughness={0.95} />
    </mesh>
  )
}

// ═══════════════════════════════════════
// 鐵砧 + 木墩
// ═══════════════════════════════════════

function Anvil() {
  const pos = POSITIONS.anvil as unknown as [number, number, number]
  return (
    <group position={pos}>
      {/* 木墩底座（6 段 = 更多邊形感） */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.4, 0.38, 0.7, 6]} />
        <meshStandardMaterial
          color={COLORS.woodBrown}
          roughness={0.95}
          metalness={0}
          flatShading
        />
      </mesh>

      {/* 砧體 */}
      <mesh position={[0, 0.875, 0]} castShadow>
        <boxGeometry args={[1.0, 0.35, 0.5]} />
        <meshStandardMaterial
          color="#5A5A5A"
          metalness={0.85}
          roughness={0.45}
          flatShading
        />
      </mesh>

      {/* 砧角（horn）— 抛光工作面 */}
      <mesh position={[0.65, 0.85, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
        <coneGeometry args={[0.15, 0.5, 6]} />
        <meshStandardMaterial
          color="#666666"
          metalness={0.9}
          roughness={0.15}
          flatShading
        />
      </mesh>

      {/* 砧底座的鐵箍 */}
      <mesh position={[0, 0.6, 0]}>
        <torusGeometry args={[0.39, 0.025, 6, 12]} />
        <meshStandardMaterial
          color="#444444"
          metalness={0.8}
          roughness={0.4}
          flatShading
        />
      </mesh>
    </group>
  )
}

// ═══════════════════════════════════════
// 錘子
// ═══════════════════════════════════════

function Hammer({ v }: { v: CraftAnimationValues }) {
  return (
    <group
      position={POSITIONS.hammerPivot as unknown as [number, number, number]}
      rotation={[0, 0, v.hammerAngle]}
    >
      {/* 把手（6 段木頭） */}
      <mesh position={[0, -0.4, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.045, 0.8, 6]} />
        <meshStandardMaterial
          color={COLORS.hammerHandle}
          roughness={0.85}
          metalness={0}
          flatShading
        />
      </mesh>

      {/* 錘頭（亮鋼） */}
      <mesh position={[0, -0.82, 0]} castShadow>
        <boxGeometry args={[0.25, 0.15, 0.15]} />
        <meshStandardMaterial
          color="#707070"
          metalness={0.92}
          roughness={0.18}
          flatShading
        />
      </mesh>

      {/* 鉚釘 */}
      <mesh position={[0, -0.73, 0]}>
        <sphereGeometry args={[0.035, 4, 4]} />
        <meshStandardMaterial
          color="#999999"
          metalness={0.9}
          roughness={0.2}
          flatShading
        />
      </mesh>
    </group>
  )
}

// ═══════════════════════════════════════
// 熔爐
// ═══════════════════════════════════════

function Furnace({
  v,
  frame,
  coals,
}: {
  v: CraftAnimationValues
  frame: number
  coals: CoalData[]
}) {
  const pos = POSITIONS.furnace as unknown as [number, number, number]

  return (
    <group position={pos}>
      {/* 爐體 */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.2, 0.8, 0.7]} />
        <meshStandardMaterial
          color={COLORS.brickRed}
          roughness={0.98}
          metalness={0}
          flatShading
        />
      </mesh>

      {/* 爐腳（4 個磚柱） */}
      {[[-0.45, -0.25], [0.45, -0.25], [-0.45, 0.25], [0.45, 0.25]].map(([x, z], i) => (
        <mesh key={`leg-${i}`} position={[x, 0.05, z]}>
          <boxGeometry args={[0.12, 0.1, 0.12]} />
          <meshStandardMaterial color={COLORS.brickDark} roughness={0.98} flatShading />
        </mesh>
      ))}

      {/* 爐口（黑色凹陷，面向前方） */}
      <mesh position={[0, 0.38, 0.32]}>
        <boxGeometry args={[0.55, 0.35, 0.08]} />
        <meshStandardMaterial color="#0A0400" roughness={0.99} />
      </mesh>

      {/* 爐口磚框（強調開口） */}
      <mesh position={[0, 0.38, 0.34]}>
        <boxGeometry args={[0.65, 0.45, 0.04]} />
        <meshStandardMaterial
          color="#5A2010"
          roughness={0.95}
          metalness={0}
          flatShading
        />
      </mesh>

      {/* 內部光源球（驅動 Bloom） */}
      <mesh position={[0, 0.38, 0.15]}>
        <sphereGeometry args={[0.2, 6, 6]} />
        <meshStandardMaterial
          color="#FF4500"
          emissive="#FF6B35"
          emissiveIntensity={v.furnaceGlow * 2}
          toneMapped={false}
          transparent
          opacity={0.9}
          flatShading
        />
      </mesh>

      {/* 煤炭（強發光，驅動 Bloom） */}
      {coals.map((coal, i) => {
        const pulse = Math.sin(frame * 0.05 + i * 2) * 0.3 + 0.7
        const emColor = coal.emissiveBias > 0.5 ? COLORS.coalOrange : COLORS.coalRed
        return (
          <mesh key={i} position={[coal.x, 0.18 + coal.y, 0.15 + coal.z]}>
            <sphereGeometry args={[coal.size, 5, 4]} />
            <meshStandardMaterial
              color="#1A0800"
              emissive={emColor}
              emissiveIntensity={v.coalEmissive * pulse * 1.5}
              toneMapped={false}
              flatShading
            />
          </mesh>
        )
      })}

      {/* 煙囪 */}
      <mesh position={[0, 0.95, -0.1]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.5, 6]} />
        <meshStandardMaterial
          color={COLORS.brickDark}
          roughness={0.95}
          metalness={0}
          flatShading
        />
      </mesh>

      {/* 煙囪頂蓋 */}
      <mesh position={[0, 1.22, -0.1]}>
        <cylinderGeometry args={[0.12, 0.12, 0.04, 6]} />
        <meshStandardMaterial
          color="#3A3A3A"
          metalness={0.7}
          roughness={0.5}
          flatShading
        />
      </mesh>
    </group>
  )
}

// ═══════════════════════════════════════
// 風箱
// ═══════════════════════════════════════

function Bellows({ v }: { v: CraftAnimationValues }) {
  const pos = POSITIONS.bellows as unknown as [number, number, number]

  return (
    <group position={pos}>
      {/* 把手（木頭） */}
      <mesh position={[-0.15, 0.52, 0]} rotation={[0, 0, 0.3]}>
        <cylinderGeometry args={[0.025, 0.025, 0.3, 5]} />
        <meshStandardMaterial color={COLORS.woodDark} roughness={0.9} flatShading />
      </mesh>

      {/* 上板 */}
      <mesh position={[0, 0.42, 0]} rotation={[v.bellowsAngle, 0, 0]} castShadow>
        <boxGeometry args={[0.4, 0.03, 0.25]} />
        <meshStandardMaterial
          color="#7B5030"
          roughness={0.85}
          metalness={0}
          flatShading
        />
      </mesh>

      {/* 下板 */}
      <mesh position={[0, 0.28, 0]} rotation={[-v.bellowsAngle, 0, 0]} castShadow>
        <boxGeometry args={[0.4, 0.03, 0.25]} />
        <meshStandardMaterial
          color="#7B5030"
          roughness={0.85}
          metalness={0}
          flatShading
        />
      </mesh>

      {/* 中間皮革褶皺（V 型摺疊效果） */}
      <mesh position={[0, 0.35, 0]} scale={[1, 0.5 + Math.abs(v.bellowsAngle) * 3, 1]}>
        <boxGeometry args={[0.35, 0.1, 0.2]} />
        <meshStandardMaterial
          color="#4A2A12"
          roughness={0.92}
          metalness={0}
          flatShading
        />
      </mesh>

      {/* 噴嘴（指向熔爐） */}
      <mesh position={[0.28, 0.35, 0.08]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.045, 0.22, 6]} />
        <meshStandardMaterial
          color="#888888"
          metalness={0.75}
          roughness={0.35}
          flatShading
        />
      </mesh>

      {/* 底座板 */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.42, 0.04, 0.27]} />
        <meshStandardMaterial color={COLORS.woodDark} roughness={0.9} flatShading />
      </mesh>
    </group>
  )
}

// ═══════════════════════════════════════
// 工件
// ═══════════════════════════════════════

function Workpiece({
  v,
  frame,
  coreShape,
  palette,
}: {
  v: CraftAnimationValues
  frame: number
  coreShape: CoreShape
  palette: CraftPalette
}) {
  void frame

  const finalGeo = useMemo(() => {
    switch (coreShape) {
      case 'dodecahedron': return new THREE.DodecahedronGeometry(0.18, 1)
      case 'icosahedron': return new THREE.IcosahedronGeometry(0.18, 1)
      case 'octahedron': return new THREE.OctahedronGeometry(0.22, 1)
      case 'rhombic': return new THREE.DodecahedronGeometry(0.18, 0)
      default: return new THREE.IcosahedronGeometry(0.18, 1)
    }
  }, [coreShape])

  const roughGeo = useMemo(() => new THREE.OctahedronGeometry(0.15, 0), [])
  const usePolyhedron = v.workpieceMorph >= 0.5

  const emissiveColor = useMemo(() => {
    if (v.phase === 0) return COLORS.rawGrey
    if (v.phase === 1) return COLORS.hotOrange
    if (v.phase === 2) return COLORS.hotGold
    return COLORS.finalGold
  }, [v.phase])

  const workpieceY = POSITIONS.workpiece[1] + v.workpieceRise
  const scale = v.workpieceScale
  const shakeX = v.workpieceShake

  // emissiveIntensity > 1.0 + toneMapped={false} → 觸發 Bloom
  const shouldBloom = v.workpieceEmissive > 1.0

  return (
    <group position={[POSITIONS.workpiece[0] + shakeX, workpieceY, POSITIONS.workpiece[2]]}>
      <mesh
        geometry={usePolyhedron ? finalGeo : roughGeo}
        rotation={[0, v.workpieceDisplayRotation, 0]}
        scale={[
          scale * (usePolyhedron ? 1 : 1.2),
          scale * (usePolyhedron ? 1 : 0.8),
          scale * (usePolyhedron ? 1 : 1.1),
        ]}
        castShadow
      >
        <meshPhysicalMaterial
          color={v.phase === 0 ? '#4A4A4A' : '#2A1A0E'}
          emissive={emissiveColor}
          emissiveIntensity={v.workpieceEmissive}
          roughness={v.workpieceRoughness}
          metalness={0.85}
          clearcoat={v.workpieceClearcoat}
          clearcoatRoughness={0.15}
          flatShading
          toneMapped={!shouldBloom}
        />
      </mesh>

      {/* 外層光暈 */}
      {v.workpieceEmissive > 0.5 && (
        <mesh scale={[scale * 1.8, scale * 1.8, scale * 1.8]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshBasicMaterial
            color={palette.coreEmissive}
            transparent
            opacity={Math.min(0.25, v.workpieceEmissive * 0.05)}
            side={THREE.BackSide}
            toneMapped={false}
          />
        </mesh>
      )}
    </group>
  )
}

// ═══════════════════════════════════════
// 火花
// ═══════════════════════════════════════

function Sparks({
  v,
  seeds,
  palette,
}: {
  v: CraftAnimationValues
  seeds: SparkSeed[]
  palette: CraftPalette
}) {
  if (!v.hammerActive) return null

  const sparkCount = Math.ceil(seeds.length * v.sparkIntensity)
  const progress = v.sparkProgress
  if (progress <= 0 || progress >= 1) return null

  return (
    <group position={[POSITIONS.workpiece[0], POSITIONS.workpiece[1] + 0.1, POSITIONS.workpiece[2]]}>
      {seeds.slice(0, sparkCount).map((seed, i) => {
        const t = progress
        const x = Math.cos(seed.angle) * seed.speed * t * 0.6
        const gravity = 2.5
        const y = seed.elevation * t - gravity * t * t
        const z = Math.sin(seed.angle) * seed.speed * t * 0.6
        const opacity = Math.max(0, 1 - t * 1.3)
        const sparkColor = seed.colorBias > 0.5 ? palette.sparkColor : COLORS.sparkOrange

        if (opacity <= 0) return null

        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[seed.size * (1 - t * 0.3), 3, 3]} />
            <meshBasicMaterial
              color={sparkColor}
              transparent
              opacity={opacity}
              toneMapped={false}
            />
          </mesh>
        )
      })}
    </group>
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
  const workpieceY = POSITIONS.workpiece[1] + v.workpieceRise

  return (
    <group position={[POSITIONS.workpiece[0], workpieceY, POSITIONS.workpiece[2]]}>
      {rings.map((ring, i) => {
        const scale = v.ringScale[i] ?? 0
        if (scale <= 0.01) return null

        const breathe = 1 + Math.sin(frame * 0.03 + i * 2) * 0.05

        return (
          <mesh
            key={i}
            rotation={[ring.tiltX, frame * 0.005 * (i + 1), ring.tiltZ]}
            scale={[scale * breathe, scale * breathe, scale * breathe]}
          >
            <torusGeometry args={[ring.radius, 0.015, 6, 36]} />
            <meshStandardMaterial
              color={i < 2 ? palette.ringColor : palette.sparkColor}
              emissive={palette.energyColor}
              emissiveIntensity={v.ringOpacity * 1.5}
              transparent
              opacity={v.ringOpacity}
              metalness={0.7}
              roughness={0.2}
              toneMapped={false}
              flatShading
            />
          </mesh>
        )
      })}
    </group>
  )
}

// ═══════════════════════════════════════
// 環境餘燼
// ═══════════════════════════════════════

function AmbientEmbers({
  v,
  frame,
  embers,
}: {
  v: CraftAnimationValues
  frame: number
  embers: AmbientEmberData[]
}) {
  if (v.ambientEmberOpacity <= 0) return null

  return (
    <group>
      {embers.map((ember, i) => {
        const period = 180 + i * 20
        const t = ((frame + i * 30) % period) / period
        const x = ember.startX + Math.sin(frame * 0.01 + i) * ember.drift
        const y = ember.startY + t * 3.0
        const z = ember.startZ
        const fadeIn = Math.min(1, t * 5)
        const fadeOut = Math.max(0, 1 - (t - 0.7) * 3.3)
        const opacity = fadeIn * fadeOut * v.ambientEmberOpacity * 0.6

        if (opacity <= 0.01) return null

        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[ember.size, 3, 3]} />
            <meshBasicMaterial
              color={COLORS.sparkOrange}
              transparent
              opacity={opacity}
              toneMapped={false}
            />
          </mesh>
        )
      })}
    </group>
  )
}

// ═══════════════════════════════════════
// 地面碎屑（靜態裝飾）
// ═══════════════════════════════════════

function FloorDebris() {
  const debris = useMemo(() =>
    Array.from({ length: 10 }, (_, i) => {
      const angle = (i / 10) * Math.PI * 2 + Math.sin(i * 3.7) * 0.5
      const dist = 0.6 + Math.sin(i * 5.3) * 0.4
      return {
        x: Math.cos(angle) * dist,
        z: Math.sin(angle) * dist,
        rotY: angle + i * 0.7,
        scaleX: 0.04 + (i % 3) * 0.02,
        scaleZ: 0.03 + (i % 2) * 0.02,
      }
    }), [])

  return (
    <group>
      {debris.map((d, i) => (
        <mesh
          key={`debris-${i}`}
          position={[d.x, 0.01, d.z]}
          rotation={[0, d.rotY, Math.sin(i) * 0.3]}
        >
          <boxGeometry args={[d.scaleX, 0.015, d.scaleZ]} />
          <meshStandardMaterial
            color="#555555"
            metalness={0.6}
            roughness={0.65}
            flatShading
          />
        </mesh>
      ))}
    </group>
  )
}

// ═══════════════════════════════════════
// 工具架（右側裝飾）
// ═══════════════════════════════════════

function ToolRack() {
  return (
    <group position={[1.8, 0, -0.3]}>
      {/* 垂直支架 */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.08, 1.1, 0.08]} />
        <meshStandardMaterial color={COLORS.woodDark} roughness={0.92} flatShading />
      </mesh>
      <mesh position={[0, 0.55, -0.4]} castShadow>
        <boxGeometry args={[0.08, 1.1, 0.08]} />
        <meshStandardMaterial color={COLORS.woodDark} roughness={0.92} flatShading />
      </mesh>

      {/* 橫桿 */}
      <mesh position={[0, 0.85, -0.2]}>
        <boxGeometry args={[0.06, 0.06, 0.5]} />
        <meshStandardMaterial color={COLORS.woodBrown} roughness={0.9} flatShading />
      </mesh>

      {/* 掛鉤上的鉗子（簡化） */}
      <mesh position={[0.08, 0.7, -0.1]} rotation={[0, 0.2, 0.4]}>
        <boxGeometry args={[0.28, 0.03, 0.03]} />
        <meshStandardMaterial
          color="#555555"
          metalness={0.8}
          roughness={0.4}
          flatShading
        />
      </mesh>

      {/* 掛鉤上的小錘 */}
      <mesh position={[0.06, 0.65, -0.35]} rotation={[0.3, 0, 0.6]}>
        <cylinderGeometry args={[0.015, 0.015, 0.22, 5]} />
        <meshStandardMaterial color={COLORS.hammerHandle} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0.06, 0.53, -0.35]} rotation={[0.3, 0, 0.6]}>
        <boxGeometry args={[0.08, 0.05, 0.05]} />
        <meshStandardMaterial
          color="#666666"
          metalness={0.85}
          roughness={0.3}
          flatShading
        />
      </mesh>
    </group>
  )
}

// ═══════════════════════════════════════
// 慶祝光暈
// ═══════════════════════════════════════

function CelebrationGlow({
  v,
  frame,
  palette,
}: {
  v: CraftAnimationValues
  frame: number
  palette: CraftPalette
}) {
  const workpieceY = POSITIONS.workpiece[1] + v.workpieceRise
  const progress = v.celebrationProgress
  const pulseScale = 1 + Math.sin(frame * 0.1) * 0.2
  const glowSize = 0.5 + progress * 1.5

  return (
    <group position={[POSITIONS.workpiece[0], workpieceY, POSITIONS.workpiece[2]]}>
      <mesh scale={[glowSize * pulseScale, glowSize * pulseScale, glowSize * pulseScale]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial
          color={palette.celebrationColor}
          transparent
          opacity={0.15 * (1 - progress * 0.5)}
          side={THREE.BackSide}
          toneMapped={false}
        />
      </mesh>

      {Array.from({ length: 24 }, (_, i) => {
        const angle = (i / 24) * Math.PI * 2 + frame * 0.03
        const celebFrame = Math.max(0, frame - 850)
        const expand = Math.min(celebFrame * 0.03, 1) * 2.0
        const sparkY = Math.sin(angle * 3 + frame * 0.05) * 0.5
        const opacity = Math.max(0, 1 - progress * 0.8)

        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * expand,
              sparkY,
              Math.sin(angle) * expand,
            ]}
          >
            <sphereGeometry args={[0.03, 3, 3]} />
            <meshBasicMaterial
              color={i % 2 === 0 ? palette.sparkColor : COLORS.celebWhite}
              transparent
              opacity={opacity}
              toneMapped={false}
            />
          </mesh>
        )
      })}
    </group>
  )
}
