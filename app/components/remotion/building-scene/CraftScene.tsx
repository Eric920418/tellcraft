// ============================================================
// "The Craft" v2 鍛造車間場景
// 鐵砧 + 錘子 + 熔爐 + 風箱 + 工件 + 火花 + 環境餘燼
// 全部基礎幾何組合，低多邊形工藝美學
// ============================================================

import { useMemo } from 'react'
import * as THREE from 'three'
import type { CraftAnimationValues } from './FrameDrivenAnimations'
import type { CoreShape, CraftPalette, OrbitRingData, SparkSeed, CoalData, AmbientEmberData } from './procedural'
import { COLORS, GEO, POSITIONS } from './constants'

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
      {/* 地面 */}
      <Floor />

      {/* 熔爐（後方） */}
      <Furnace v={v} frame={frame} coals={coals} />

      {/* 風箱（熔爐左側） */}
      <Bellows v={v} frame={frame} />

      {/* 鐵砧 + 木墩（場景中心） */}
      <Anvil />

      {/* 工件（鐵砧上方） */}
      {v.workpieceVisible && (
        <Workpiece v={v} frame={frame} coreShape={coreShape} palette={palette} />
      )}

      {/* 錘子（從上方擺動） */}
      <Hammer v={v} />

      {/* 火花（錘子敲打時爆發） */}
      <Sparks v={v} frame={frame} seeds={sparkSeeds} palette={palette} />

      {/* 軌道光環（Phase 3+） */}
      <OrbitRings v={v} frame={frame} rings={orbitRings} palette={palette} />

      {/* 環境餘燼 */}
      <AmbientEmbers v={v} frame={frame} embers={ambientEmbers} />

      {/* 慶祝光暈 */}
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
      <planeGeometry args={[GEO.floor.width, GEO.floor.height]} />
      <meshStandardMaterial color={COLORS.floorDark} roughness={0.95} />
    </mesh>
  )
}

// ═══════════════════════════════════════
// 鐵砧 + 木墩
// ═══════════════════════════════════════

function Anvil() {
  return (
    <group position={POSITIONS.anvil as unknown as [number, number, number]}>
      {/* 木墩底座 */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[
          GEO.anvilStump.radiusTop,
          GEO.anvilStump.radiusBottom,
          GEO.anvilStump.height,
          GEO.anvilStump.segments,
        ]} />
        <meshStandardMaterial color={COLORS.woodBrown} roughness={0.85} />
      </mesh>

      {/* 砧體 */}
      <mesh position={[0, 0.875, 0]}>
        <boxGeometry args={[
          GEO.anvilBody.width,
          GEO.anvilBody.height,
          GEO.anvilBody.depth,
        ]} />
        <meshStandardMaterial
          color={COLORS.anvilSteel}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      {/* 砧角（horn）— 向右伸出 */}
      <mesh
        position={[0.65, 0.85, 0]}
        rotation={[0, 0, -Math.PI / 2]}
      >
        <coneGeometry args={[
          GEO.anvilHorn.radius,
          GEO.anvilHorn.height,
          GEO.anvilHorn.segments,
        ]} />
        <meshStandardMaterial
          color={COLORS.anvilDark}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>
    </group>
  )
}

// ═══════════════════════════════════════
// 錘子
// ═══════════════════════════════════════

function Hammer({ v }: { v: CraftAnimationValues }) {
  // pivot 在把手頂端（高處），整個 group 繞 Z 軸旋轉
  return (
    <group
      position={POSITIONS.hammerPivot as unknown as [number, number, number]}
      rotation={[0, 0, v.hammerAngle]}
    >
      {/* 把手（向下垂） */}
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[
          GEO.hammerHandle.radius,
          GEO.hammerHandle.radius,
          GEO.hammerHandle.height,
        ]} />
        <meshStandardMaterial color={COLORS.hammerHandle} roughness={0.7} />
      </mesh>

      {/* 錘頭（把手底部） */}
      <mesh position={[0, -0.82, 0]}>
        <boxGeometry args={[
          GEO.hammerHead.width,
          GEO.hammerHead.height,
          GEO.hammerHead.depth,
        ]} />
        <meshStandardMaterial
          color={COLORS.hammerSteel}
          metalness={0.85}
          roughness={0.25}
        />
      </mesh>

      {/* 鉚釘（錘頭與把手連接處） */}
      <mesh position={[0, -0.73, 0]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.2} />
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
  const furnacePos = POSITIONS.furnace as unknown as [number, number, number]

  return (
    <group position={furnacePos}>
      {/* 爐體 */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[
          GEO.furnaceBody.width,
          GEO.furnaceBody.height,
          GEO.furnaceBody.depth,
        ]} />
        <meshStandardMaterial color={COLORS.brickRed} roughness={0.9} />
      </mesh>

      {/* 爐口（黑色凹陷） */}
      <mesh position={[0, 0.35, 0.31]}>
        <boxGeometry args={[
          GEO.furnaceMouth.width,
          GEO.furnaceMouth.height,
          GEO.furnaceMouth.depth,
        ]} />
        <meshStandardMaterial color={COLORS.furnaceMouth} />
      </mesh>

      {/* 內部光源球 */}
      <mesh position={[0, 0.35, 0.15]}>
        <sphereGeometry args={[GEO.furnaceGlow.radius, GEO.furnaceGlow.segments, GEO.furnaceGlow.segments]} />
        <meshStandardMaterial
          color="#FF4500"
          emissive="#FF6B35"
          emissiveIntensity={v.furnaceGlow}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* 煤炭 */}
      {coals.map((coal, i) => {
        const pulse = Math.sin(frame * 0.05 + i * 2) * 0.3 + 0.7
        const emColor = coal.emissiveBias > 0.5 ? COLORS.coalOrange : COLORS.coalRed
        return (
          <mesh
            key={i}
            position={[coal.x, 0.15 + coal.y, 0.15 + coal.z]}
          >
            <sphereGeometry args={[coal.size, 6, 6]} />
            <meshStandardMaterial
              color="#2A0A00"
              emissive={emColor}
              emissiveIntensity={v.coalEmissive * pulse}
            />
          </mesh>
        )
      })}

      {/* 煙囪 */}
      <mesh position={[0, 0.95, -0.1]}>
        <cylinderGeometry args={[
          GEO.chimney.radiusTop,
          GEO.chimney.radiusBottom,
          GEO.chimney.height,
        ]} />
        <meshStandardMaterial color={COLORS.brickDark} roughness={0.9} />
      </mesh>
    </group>
  )
}

// ═══════════════════════════════════════
// 風箱
// ═══════════════════════════════════════

function Bellows({ v, frame }: { v: CraftAnimationValues; frame: number }) {
  const bellowsPos = POSITIONS.bellows as unknown as [number, number, number]
  void frame

  return (
    <group position={bellowsPos}>
      {/* 上板 */}
      <mesh
        position={[0, 0.4, 0]}
        rotation={[v.bellowsAngle, 0, 0]}
      >
        <boxGeometry args={[
          GEO.bellowsPlate.width,
          GEO.bellowsPlate.height,
          GEO.bellowsPlate.depth,
        ]} />
        <meshStandardMaterial color={COLORS.woodBrown} roughness={0.8} />
      </mesh>

      {/* 下板 */}
      <mesh
        position={[0, 0.3, 0]}
        rotation={[-v.bellowsAngle, 0, 0]}
      >
        <boxGeometry args={[
          GEO.bellowsPlate.width,
          GEO.bellowsPlate.height,
          GEO.bellowsPlate.depth,
        ]} />
        <meshStandardMaterial color={COLORS.woodBrown} roughness={0.8} />
      </mesh>

      {/* 中間皮革褶皺（簡化為縮放的盒子） */}
      <mesh position={[0, 0.35, 0]} scale={[1, 0.5 + Math.abs(v.bellowsAngle) * 2, 1]}>
        <boxGeometry args={[0.35, 0.08, 0.2]} />
        <meshStandardMaterial color="#5C3A1E" roughness={0.9} />
      </mesh>

      {/* 噴嘴（指向熔爐） */}
      <mesh
        position={[0.25, 0.35, 0.08]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[
          GEO.bellowsNozzle.radius,
          GEO.bellowsNozzle.radius,
          GEO.bellowsNozzle.height,
        ]} />
        <meshStandardMaterial color="#777777" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  )
}

// ═══════════════════════════════════════
// 工件（鐵砧上方，隨 phase 演進）
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
  // 最終形狀幾何
  const finalGeo = useMemo(() => {
    switch (coreShape) {
      case 'dodecahedron': return new THREE.DodecahedronGeometry(0.18, 1)
      case 'icosahedron': return new THREE.IcosahedronGeometry(0.18, 1)
      case 'octahedron': return new THREE.OctahedronGeometry(0.18, 1)
      case 'rhombic': return new THREE.DodecahedronGeometry(0.18, 0)
      default: return new THREE.IcosahedronGeometry(0.18, 1)
    }
  }, [coreShape])

  // 粗糙形狀（低細節八面體 + 隨機拉伸）
  const roughGeo = useMemo(() => new THREE.OctahedronGeometry(0.15, 0), [])

  const usePolyhedron = v.workpieceMorph >= 0.5

  // Phase 色彩
  const emissiveColor = useMemo(() => {
    if (v.phase === 0) return COLORS.rawGrey
    if (v.phase === 1) return COLORS.hotOrange
    if (v.phase === 2) return COLORS.hotGold
    return COLORS.finalGold
  }, [v.phase])

  const workpieceY = (POSITIONS.workpiece[1]) + v.workpieceRise
  const scale = v.workpieceScale
  const shakeX = v.workpieceShake

  return (
    <group position={[POSITIONS.workpiece[0] + shakeX, workpieceY, POSITIONS.workpiece[2]]}>
      {/* 工件主體 */}
      <mesh
        geometry={usePolyhedron ? finalGeo : roughGeo}
        rotation={[0, v.workpieceDisplayRotation, 0]}
        scale={[
          scale * (usePolyhedron ? 1 : 1.2),
          scale * (usePolyhedron ? 1 : 0.8),
          scale * (usePolyhedron ? 1 : 1.1),
        ]}
      >
        <meshPhysicalMaterial
          color={v.phase === 0 ? '#3A3A3A' : '#2A1A0E'}
          emissive={emissiveColor}
          emissiveIntensity={v.workpieceEmissive}
          roughness={v.workpieceRoughness}
          metalness={0.8}
          clearcoat={v.workpieceClearcoat}
          clearcoatRoughness={0.2}
        />
      </mesh>

      {/* 外層光暈（Phase 2+） */}
      {v.workpieceEmissive > 0.5 && (
        <mesh scale={[scale * 1.5, scale * 1.5, scale * 1.5]}>
          <sphereGeometry args={[0.2, 12, 12]} />
          <meshBasicMaterial
            color={palette.coreEmissive}
            transparent
            opacity={Math.min(0.2, v.workpieceEmissive * 0.04)}
            side={THREE.BackSide}
          />
        </mesh>
      )}
    </group>
  )
}

// ═══════════════════════════════════════
// 火花（錘子敲打時爆發）
// ═══════════════════════════════════════

function Sparks({
  v,
  frame,
  seeds,
  palette,
}: {
  v: CraftAnimationValues
  frame: number
  seeds: SparkSeed[]
  palette: CraftPalette
}) {
  if (!v.hammerActive) return null

  // 計算火花位置
  const sparkCount = Math.ceil(seeds.length * v.sparkIntensity)
  const progress = v.sparkProgress
  if (progress <= 0 || progress >= 1) return null

  return (
    <group position={[POSITIONS.workpiece[0], POSITIONS.workpiece[1] + 0.1, POSITIONS.workpiece[2]]}>
      {seeds.slice(0, sparkCount).map((seed, i) => {
        // 拋物線軌跡
        const t = progress
        const x = Math.cos(seed.angle) * seed.speed * t * 0.5
        const gravity = 2.0
        const y = seed.elevation * t - gravity * t * t
        const z = Math.sin(seed.angle) * seed.speed * t * 0.5
        const opacity = Math.max(0, 1 - t * 1.5)
        const sparkColor = seed.colorBias > 0.5 ? palette.sparkColor : COLORS.sparkOrange

        if (opacity <= 0) return null

        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[seed.size * (1 - t * 0.5), 4, 4]} />
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
// 軌道環（Phase 3+ 圍繞工件）
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
            <torusGeometry args={[ring.radius, 0.012, 8, 48]} />
            <meshPhysicalMaterial
              color={i < 2 ? palette.ringColor : palette.sparkColor}
              emissive={palette.energyColor}
              emissiveIntensity={v.ringOpacity * 0.8}
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
// 環境餘燼（熔爐附近上飄）
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
        // 循環上升
        const period = 180 + i * 20
        const t = ((frame + i * 30) % period) / period
        const x = ember.startX + Math.sin(frame * 0.01 + i) * ember.drift
        const y = ember.startY + t * 3.0
        const z = ember.startZ
        // 淡入淡出
        const fadeIn = Math.min(1, t * 5)
        const fadeOut = Math.max(0, 1 - (t - 0.7) * 3.3)
        const opacity = fadeIn * fadeOut * v.ambientEmberOpacity * 0.5

        if (opacity <= 0.01) return null

        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[ember.size, 4, 4]} />
            <meshBasicMaterial
              color={COLORS.emberAmber}
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
// 慶祝光暈（Phase 4 末段）
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

  // 脈衝光環
  const pulseScale = 1 + Math.sin(frame * 0.1) * 0.2
  const glowSize = 0.5 + progress * 1.5

  return (
    <group position={[POSITIONS.workpiece[0], workpieceY, POSITIONS.workpiece[2]]}>
      {/* 中心光暈 */}
      <mesh scale={[glowSize * pulseScale, glowSize * pulseScale, glowSize * pulseScale]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color={palette.celebrationColor}
          transparent
          opacity={0.15 * (1 - progress * 0.5)}
          side={THREE.BackSide}
          toneMapped={false}
        />
      </mesh>

      {/* 慶祝火花環繞 */}
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
            <sphereGeometry args={[0.025, 4, 4]} />
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
