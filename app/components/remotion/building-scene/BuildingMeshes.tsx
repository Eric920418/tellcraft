// ============================================================
// 城堡 3D 幾何體（65+ mesh，幀驅動動畫）
// ============================================================

import { useCurrentFrame, useVideoConfig } from 'remotion'
import { useCastleAnimationValues } from './FrameDrivenAnimations'
import BlueprintMesh from './BlueprintMesh'
import Particles from './Particles'
import {
  COLORS,
  FOUNDATION_POSITIONS,
  WALL_CONFIGS,
  BATTLEMENT_POSITIONS,
  TOWER_POSITIONS,
  ARROW_SLIT_POSITIONS,
  TOWER_ROOF_POSITIONS,
  FLAG_POLE_POSITIONS,
  WINDOW_POSITIONS,
  TREE_POSITIONS,
} from './constants'

interface BuildingMeshesProps {
  isWorking?: boolean
}

export default function BuildingMeshes({ isWorking }: BuildingMeshesProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const v = useCastleAnimationValues(frame, fps)
  const bp = v.blueprintToSolid

  return (
    <group rotation={[0, v.celebrationRotation, 0]}>

      {/* ════════════ Round 1: 地基 ════════════ */}

      {/* 地面 */}
      <BlueprintMesh
        solidProgress={bp}
        color={COLORS.ground}
        position={[0, -0.05, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[v.groundScale * 10, v.groundScale * 10, 1]}
        roughness={0.9}
      >
        <planeGeometry args={[1, 1]} />
      </BlueprintMesh>

      {/* 護城河（torus） */}
      <BlueprintMesh
        solidProgress={bp}
        color={COLORS.moatWater}
        position={[0, v.moatY, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={v.moatOpacity > 0.01 ? 1 : 0}
      >
        <torusGeometry args={[3.8, 0.5, 8, 32]} />
      </BlueprintMesh>

      {/* 4 塊地基石 */}
      {FOUNDATION_POSITIONS.map((pos, i) => (
        <BlueprintMesh
          key={`f${i}`}
          solidProgress={bp}
          color={COLORS.stoneMedium}
          position={[pos[0], v.foundationY[i], pos[2]]}
          scale={v.foundationScale[i]}
          roughness={0.8}
        >
          <boxGeometry args={[1.2, 0.4, 1.2]} />
        </BlueprintMesh>
      ))}

      {/* 中心地基 */}
      <BlueprintMesh
        solidProgress={bp}
        color={COLORS.stoneDark}
        position={[0, 0.1, 0]}
        scale={v.foundationCenterScale}
        roughness={0.85}
      >
        <boxGeometry args={[4.8, 0.3, 4.8]} />
      </BlueprintMesh>

      {/* ════════════ Round 2: 城牆 ════════════ */}

      {/* 4 面城牆 */}
      {WALL_CONFIGS.map((wall, i) => (
        <BlueprintMesh
          key={`wall${i}`}
          solidProgress={bp}
          color={COLORS.wallGray}
          position={[wall.pos[0], wall.pos[1] + v.wallShakeY[i], wall.pos[2]]}
          scale={[1, v.wallScaleY[i], 1]}
          roughness={0.8}
        >
          <boxGeometry args={wall.size} />
        </BlueprintMesh>
      ))}

      {/* 8 個城垛 */}
      {BATTLEMENT_POSITIONS.map((pos, i) => (
        <BlueprintMesh
          key={`batt${i}`}
          solidProgress={bp}
          color={COLORS.battlementGray}
          position={pos}
          scale={v.battlementScale[i]}
        >
          <boxGeometry args={[0.4, 0.5, 0.4]} />
        </BlueprintMesh>
      ))}

      {/* ════════════ Round 3: 塔樓 ════════════ */}

      {/* 4 個角塔 */}
      {TOWER_POSITIONS.map((pos, i) => (
        <BlueprintMesh
          key={`tower${i}`}
          solidProgress={bp}
          color={COLORS.towerGray}
          position={[pos[0], 1.8, pos[2]]}
          scale={[1, v.towerScaleY[i], 1]}
          roughness={0.75}
        >
          <cylinderGeometry args={[0.65, 0.75, 3.6, 8]} />
        </BlueprintMesh>
      ))}

      {/* 8 個箭孔 */}
      {ARROW_SLIT_POSITIONS.map((cfg, i) => (
        <BlueprintMesh
          key={`arrow${i}`}
          solidProgress={bp}
          color={COLORS.stoneDark}
          position={cfg.pos}
          rotation={[0, cfg.rotY, 0]}
          scale={v.arrowSlitScale[i]}
        >
          <boxGeometry args={[0.08, 0.4, 0.15]} />
        </BlueprintMesh>
      ))}

      {/* ════════════ Round 4: 內裝 ════════════ */}

      {/* 吊橋 */}
      <group position={[0, 0.15, -2.65]} rotation={[v.drawbridgeRotationX, 0, 0]}>
        <BlueprintMesh solidProgress={bp} color={COLORS.woodLight} roughness={0.9}>
          <boxGeometry args={[1.2, 0.1, 1.8]} />
        </BlueprintMesh>
      </group>

      {/* 城門 */}
      <BlueprintMesh
        solidProgress={bp}
        color={COLORS.woodDark}
        position={[0, 0.6 * v.gateScaleY, -2.5]}
        scale={[1, v.gateScaleY, 1]}
      >
        <boxGeometry args={[1.0, 1.4, 0.15]} />
      </BlueprintMesh>

      {/* 拱門（半圓 torus） */}
      <BlueprintMesh
        solidProgress={bp}
        color={COLORS.stoneLight}
        position={[0, 1.3, -2.5]}
        rotation={[0, 0, 0]}
        scale={v.gateArchScale}
      >
        <torusGeometry args={[0.5, 0.08, 8, 16, Math.PI]} />
      </BlueprintMesh>

      {/* 庭院地面 */}
      <BlueprintMesh
        solidProgress={bp}
        color={COLORS.groundDark}
        position={[0, 0.05, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={v.courtyardOpacity}
        roughness={0.9}
      >
        <circleGeometry args={[2.0, 16]} />
      </BlueprintMesh>

      {/* 水井 */}
      <group position={[0.8, 0.2, 0.5]} scale={[v.wellScale, v.wellScale, v.wellScale]}>
        <BlueprintMesh solidProgress={bp} color={COLORS.stoneMedium}>
          <cylinderGeometry args={[0.3, 0.35, 0.4, 8]} />
        </BlueprintMesh>
        {/* 井架 */}
        <BlueprintMesh solidProgress={bp} color={COLORS.woodDark} position={[0, 0.5, 0]}>
          <boxGeometry args={[0.05, 0.6, 0.05]} />
        </BlueprintMesh>
      </group>

      {/* 2 個木桶 */}
      {[[-0.8, 0.15, 0.8] as [number, number, number], [-0.5, 0.15, 1.2] as [number, number, number]].map((pos, i) => (
        <BlueprintMesh
          key={`barrel${i}`}
          solidProgress={bp}
          color={COLORS.woodLight}
          position={pos}
          scale={v.barrelScale[i]}
        >
          <cylinderGeometry args={[0.18, 0.15, 0.3, 8]} />
        </BlueprintMesh>
      ))}

      {/* ════════════ Round 5: 屋頂 ════════════ */}

      {/* 4 個塔頂 */}
      {TOWER_ROOF_POSITIONS.map((pos, i) => (
        <BlueprintMesh
          key={`tRoof${i}`}
          solidProgress={bp}
          color={COLORS.roofRed}
          position={[pos[0], v.towerRoofY[i], pos[2]]}
          scale={v.towerRoofScale[i]}
          roughness={0.6}
        >
          <coneGeometry args={[0.85, 1.2, 8]} />
        </BlueprintMesh>
      ))}

      {/* 4 個旗桿 */}
      {FLAG_POLE_POSITIONS.map((pos, i) => (
        <BlueprintMesh
          key={`pole${i}`}
          solidProgress={bp}
          color={COLORS.woodDark}
          position={pos}
          scale={[1, v.flagPoleScaleY[i], 1]}
        >
          <cylinderGeometry args={[0.03, 0.03, 1.0, 6]} />
        </BlueprintMesh>
      ))}

      {/* 4 個旗幟 */}
      {FLAG_POLE_POSITIONS.map((pos, i) => (
        v.flagPoleScaleY[i] > 0.5 && (
          <mesh
            key={`flag${i}`}
            position={[pos[0] + 0.2, pos[1] + 0.3, pos[2]]}
            rotation={[0, 0, v.flagWave]}
          >
            <planeGeometry args={[0.4, 0.25]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? COLORS.flagRed : COLORS.flagGold}
              side={2}
              transparent
              opacity={Math.min(1, v.flagPoleScaleY[i])}
            />
          </mesh>
        )
      ))}

      {/* ════════════ Round 6: 完工 ════════════ */}

      {/* 8 個窗戶發光 */}
      {WINDOW_POSITIONS.map((pos, i) => (
        <group key={`win${i}`}>
          <mesh position={pos}>
            <boxGeometry args={[0.3, 0.35, 0.05]} />
            <meshStandardMaterial
              color={COLORS.windowGlow}
              emissive={COLORS.windowGlow}
              emissiveIntensity={v.windowGlowIntensity[i] * 2}
              transparent
              opacity={v.windowGlowIntensity[i]}
            />
          </mesh>
          {v.windowGlowIntensity[i] > 0.3 && (
            <pointLight
              position={pos}
              color={COLORS.windowGlow}
              intensity={v.windowGlowIntensity[i] * 0.3}
              distance={2}
            />
          )}
        </group>
      ))}

      {/* 4 棵樹 */}
      {TREE_POSITIONS.map((pos, i) => (
        <group
          key={`tree${i}`}
          position={[pos[0], v.treeY[i], pos[2]]}
          scale={[v.treeScale[i], v.treeScale[i], v.treeScale[i]]}
        >
          {/* 樹冠 */}
          <mesh position={[0, 1.2, 0]}>
            <coneGeometry args={[0.5, 1.2, 6]} />
            <meshStandardMaterial color={i % 2 === 0 ? COLORS.treeGreen : COLORS.treePine} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.8, 0]}>
            <coneGeometry args={[0.65, 0.8, 6]} />
            <meshStandardMaterial color={i % 2 === 0 ? COLORS.treeGreen : COLORS.treePine} roughness={0.8} />
          </mesh>
          {/* 樹幹 */}
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.08, 0.12, 0.5, 6]} />
            <meshStandardMaterial color={COLORS.treeTrunk} roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* 中央大旗桿 */}
      <BlueprintMesh
        solidProgress={bp}
        color={COLORS.woodDark}
        position={[0, 2.5, 0]}
        scale={[1, v.grandFlagPoleScaleY, 1]}
      >
        <cylinderGeometry args={[0.04, 0.04, 2.0, 6]} />
      </BlueprintMesh>

      {/* 中央大旗幟 */}
      {v.grandFlagScale > 0.1 && (
        <mesh
          position={[0.35, 3.3, 0]}
          rotation={[0, 0, v.flagWave * 1.5]}
        >
          <planeGeometry args={[0.7, 0.5]} />
          <meshStandardMaterial
            color={COLORS.flagRed}
            side={2}
            transparent
            opacity={v.grandFlagScale}
          />
        </mesh>
      )}

      {/* ════════════ 粒子效果 ════════════ */}
      <Particles
        visible={!!isWorking}
        isFireworks={v.fireworksActive}
        frame={frame}
      />
    </group>
  )
}
