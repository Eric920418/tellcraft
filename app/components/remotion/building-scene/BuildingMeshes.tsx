// ============================================================
// 所有 3D 幾何體（幀驅動動畫，無 GSAP/useFrame）
// ============================================================

import { useCurrentFrame, useVideoConfig } from 'remotion'
import { useAnimationValues } from './FrameDrivenAnimations'
import Particles from './Particles'
import {
  COLORS,
  FOUNDATION_POSITIONS,
  WALL_CONFIGS,
  WINDOW_POSITIONS,
  DECORATION_POSITIONS,
  LIGHT_POSITIONS,
  TREE_POSITIONS,
} from './constants'

interface BuildingMeshesProps {
  isWorking?: boolean
}

export default function BuildingMeshes({ isWorking }: BuildingMeshesProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const v = useAnimationValues(frame, fps)

  return (
    <group rotation={[0, v.celebrationRotation, 0]}>
      {/* 地面 */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}
        scale={[v.groundScale, v.groundScale, v.groundScale]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color={COLORS.ground} transparent opacity={0.3} roughness={0.9} />
      </mesh>

      {/* 地基（4 塊） */}
      {FOUNDATION_POSITIONS.map((pos, i) => (
        <mesh
          key={`f${i}`}
          position={[pos[0], v.foundationY[i], pos[2]]}
          scale={[v.foundationScale[i], v.foundationScale[i], v.foundationScale[i]]}
        >
          <boxGeometry args={[1, 0.3, 1]} />
          <meshStandardMaterial color={COLORS.blueprint} transparent opacity={0.4} roughness={0.7} />
        </mesh>
      ))}

      {/* 牆體（4 面） */}
      {WALL_CONFIGS.map((wall, i) => (
        <mesh
          key={`w${i}`}
          position={[wall.pos[0], wall.pos[1] + v.wallShakeY[i], wall.pos[2]]}
          scale={[1, v.wallScaleY[i], 1]}
        >
          <boxGeometry args={wall.size} />
          <meshStandardMaterial
            color={COLORS.wall}
            transparent
            opacity={v.wallOpacity[i]}
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>
      ))}

      {/* 門（正面中間） */}
      <mesh
        position={[0, 0.6, -1.55]}
        scale={[v.doorScale, v.doorScale, v.doorScale]}
      >
        <boxGeometry args={[0.6, 1.2, 0.1]} />
        <meshStandardMaterial color={COLORS.door} transparent opacity={0.6} roughness={0.5} />
      </mesh>

      {/* 窗戶（4 扇） */}
      {WINDOW_POSITIONS.map((pos, i) => (
        <mesh
          key={`win${i}`}
          position={pos}
          scale={[v.windowScale[i], v.windowScale[i], v.windowScale[i]]}
        >
          <boxGeometry args={[0.5, 0.5, 0.1]} />
          <meshStandardMaterial color={COLORS.window} transparent opacity={0.5} roughness={0.3} metalness={0.2} />
        </mesh>
      ))}

      {/* 裝飾（花盆） */}
      {DECORATION_POSITIONS.map((pos, i) => (
        <mesh
          key={`dec${i}`}
          position={pos}
          scale={[v.decorationScale[i], v.decorationScale[i], v.decorationScale[i]]}
        >
          <cylinderGeometry args={[0.15, 0.12, 0.2, 8]} />
          <meshStandardMaterial color={COLORS.decoration} transparent opacity={0.6} />
        </mesh>
      ))}

      {/* 屋頂 */}
      <mesh
        position={[0, v.roofY, 0]}
        scale={[v.roofScale, v.roofScale, v.roofScale]}
      >
        <coneGeometry args={[2.5, 1.2, 4]} />
        <meshStandardMaterial color={COLORS.roof} transparent opacity={0.5} roughness={0.6} />
      </mesh>

      {/* 煙囪 */}
      <mesh
        position={[0.8, v.chimneyY, 0.3]}
        scale={[v.chimneyScale, v.chimneyScale, v.chimneyScale]}
      >
        <boxGeometry args={[0.3, 0.6, 0.3]} />
        <meshStandardMaterial color={COLORS.chimney} transparent opacity={0.5} />
      </mesh>

      {/* 燈光裝飾 */}
      {LIGHT_POSITIONS.map((pos, i) => (
        <group key={`light${i}`} scale={[v.lightScale[i], v.lightScale[i], v.lightScale[i]]}>
          <mesh position={pos}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color={COLORS.light} emissive={COLORS.light} emissiveIntensity={2} />
          </mesh>
          <pointLight position={pos} color={COLORS.light} intensity={0.5} distance={3} />
        </group>
      ))}

      {/* 樹木 */}
      {TREE_POSITIONS.map((pos, i) => (
        <group
          key={`tree${i}`}
          position={[pos[0], v.treeY[i], pos[2]]}
          scale={[v.treeScale[i], v.treeScale[i], v.treeScale[i]]}
        >
          <mesh position={[0, 1, 0]}>
            <coneGeometry args={[0.6, 1.5, 6]} />
            <meshStandardMaterial color={COLORS.treeGreen} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.1, 0.12, 0.5, 6]} />
            <meshStandardMaterial color={COLORS.treeTrunk} roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* 施工粒子 */}
      <Particles visible={!!isWorking} />
    </group>
  )
}
