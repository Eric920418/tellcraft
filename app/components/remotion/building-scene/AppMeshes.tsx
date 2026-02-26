// ============================================================
// 軟體介面 3D Mesh 群（取代城堡 BuildingMeshes）
// 6 輪：基座→框架→元件→數據→視覺→上線
// ============================================================

import { useMemo } from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { useAppAnimationValues } from './FrameDrivenAnimations'
import { useGhostMaterial } from './GhostMesh'
import Particles from './Particles'
import {
  COLORS,
  PILLAR_POSITIONS,
  FRAME_CONFIG,
  CARD_POSITIONS,
  BUTTON_POSITIONS,
  SEARCH_BAR_POS,
  DATA_LINE_ENDPOINTS,
  DATA_NODE_POSITIONS,
  FEATURE_ICON_POSITIONS,
} from './constants'

interface AppMeshesProps {
  isWorking?: boolean
}

// 單條數據管道（用 mesh + TubeGeometry 避免 SVG line 衝突）
function DataLine({ from, to, progress }: { from: [number, number, number]; to: [number, number, number]; progress: number }) {
  const tubeGeo = useMemo(() => {
    if (progress <= 0) return null
    const mid: [number, number, number] = [
      (from[0] + to[0]) / 2,
      (from[1] + to[1]) / 2 + 0.3,
      (from[2] + to[2]) / 2 + 0.1,
    ]
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...from),
      new THREE.Vector3(...mid),
      new THREE.Vector3(...to),
    )
    const segments = Math.max(4, Math.floor(32 * progress))
    // 用 TubeGeometry 繪製管道
    const partialCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...from),
      new THREE.Vector3(...mid),
      curve.getPoint(progress),
    )
    return new THREE.TubeGeometry(partialCurve, segments, 0.015, 6, false)
  }, [from, to, progress])

  if (!tubeGeo) return null
  return (
    <mesh geometry={tubeGeo}>
      <meshBasicMaterial color={COLORS.dataLine} transparent opacity={0.7} />
    </mesh>
  )
}

export default function AppMeshes({ isWorking }: AppMeshesProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const v = useAppAnimationValues(frame, fps)
  const bp = v.ghostToSolid

  // R5 視覺階段的材質混合
  const visualBlend = v.colorFillProgress
  const glossBlend = v.glossProgress

  // 動態色彩：灰度 → 品牌色
  const navColor = lerpColor('#9ca3af', COLORS.navAccent, visualBlend)
  const cardColor = lerpColor('#d1d5db', COLORS.componentLight, visualBlend)
  const sidebarColor = lerpColor('#6b7280', COLORS.componentDark, visualBlend)
  const contentColor = lerpColor('#9ca3af', '#f3f4f6', visualBlend)
  const buttonColor = lerpColor('#9ca3af', COLORS.accentBlue, visualBlend)
  const searchColor = lerpColor('#d1d5db', '#f9fafb', visualBlend)

  // 動態 roughness（光澤度）
  const dynamicRoughness = 0.9 - glossBlend * 0.5

  // 幽靈材質 helper
  const ghostNav = useGhostMaterial(bp, navColor)
  const ghostSidebar = useGhostMaterial(bp, sidebarColor)
  const ghostContent = useGhostMaterial(bp, contentColor)
  const ghostCard = useGhostMaterial(bp, cardColor)
  const ghostButton = useGhostMaterial(bp, buttonColor)
  const ghostSearch = useGhostMaterial(bp, searchColor)

  return (
    <group rotation={[0, v.celebrationRotation, 0]}>

      {/* ════════════ R1: 基座 ════════════ */}

      {/* 浮動圓角平台 */}
      <group scale={[v.platformScale, v.platformScale, v.platformScale]}>
        <RoundedBox args={[8, 0.3, 5]} radius={0.08} smoothness={4} position={[0, -0.5, 0]}>
          <meshPhysicalMaterial
            color={COLORS.platform}
            transparent
            opacity={0.08 + bp * 0.92}
            emissive={COLORS.accentBlue}
            emissiveIntensity={(1 - bp) * 0.2}
            roughness={0.7}
            metalness={0.05}
          />
        </RoundedBox>

        {/* 平台邊緣發光環 */}
        <mesh position={[0, -0.68, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[4.5, 0.04, 8, 64]} />
          <meshBasicMaterial
            color={COLORS.gridGlow}
            transparent
            opacity={v.platformGlowOpacity * 0.4}
          />
        </mesh>
      </group>

      {/* 4 個角落支撐柱 */}
      {PILLAR_POSITIONS.map((pos, i) => (
        <group key={`pillar${i}`} position={pos} scale={[1, v.pillarScaleY[i], 1]}>
          <RoundedBox args={[0.1, 0.8, 0.1]} radius={0.02} smoothness={2}>
            <meshPhysicalMaterial
              color={COLORS.platformEdge}
              transparent
              opacity={0.08 + bp * 0.92}
              emissive={COLORS.accentBlue}
              emissiveIntensity={(1 - bp) * 0.15}
              roughness={0.6}
            />
          </RoundedBox>
        </group>
      ))}

      {/* 底部光暈平面（取代 gridHelper，更微妙） */}
      {v.gridOpacity > 0.01 && (
        <mesh position={[0, -0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[5, 32]} />
          <meshBasicMaterial
            color={COLORS.gridGlow}
            transparent
            opacity={v.gridOpacity * 0.06}
          />
        </mesh>
      )}

      {/* ════════════ R2: 框架 ════════════ */}

      {/* 頂部導航列 */}
      <group
        position={FRAME_CONFIG.navBar.pos}
        scale={[v.navBarScaleX, 1, 1]}
      >
        <RoundedBox args={FRAME_CONFIG.navBar.size} radius={0.04} smoothness={3}>
          <meshPhysicalMaterial {...ghostNav} roughness={dynamicRoughness} />
        </RoundedBox>
        {/* 導航列上的小圓點 */}
        {v.navBarScaleX > 0.8 && [[-2.5, 0, 0.08], [-2.0, 0, 0.08], [-1.5, 0, 0.08]].map((dotPos, i) => (
          <mesh key={`dot${i}`} position={dotPos as [number, number, number]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshPhysicalMaterial
              color={['#ef4444', '#f59e0b', '#22c55e'][i]}
              transparent
              opacity={bp * 0.8}
              emissive={['#ef4444', '#f59e0b', '#22c55e'][i]}
              emissiveIntensity={0.3}
            />
          </mesh>
        ))}
      </group>

      {/* 左側邊欄 */}
      <group
        position={FRAME_CONFIG.sidebar.pos}
        scale={[1, v.sidebarScaleY, 1]}
      >
        <RoundedBox args={FRAME_CONFIG.sidebar.size} radius={0.04} smoothness={3}>
          <meshPhysicalMaterial {...ghostSidebar} roughness={dynamicRoughness} />
        </RoundedBox>
      </group>

      {/* 主內容區域 */}
      <group
        position={FRAME_CONFIG.content.pos}
        scale={v.contentAreaScale}
      >
        <RoundedBox args={FRAME_CONFIG.content.size} radius={0.04} smoothness={3}>
          <meshPhysicalMaterial {...ghostContent} roughness={dynamicRoughness} />
        </RoundedBox>
      </group>

      {/* 底部欄 */}
      <group
        position={[FRAME_CONFIG.footer.pos[0], FRAME_CONFIG.footer.pos[1] + v.frameShakeY, FRAME_CONFIG.footer.pos[2]]}
        scale={[v.footerScaleX, 1, 1]}
      >
        <RoundedBox args={FRAME_CONFIG.footer.size} radius={0.03} smoothness={3}>
          <meshPhysicalMaterial {...ghostNav} roughness={dynamicRoughness} />
        </RoundedBox>
      </group>

      {/* ════════════ R3: 元件 ════════════ */}

      {/* 3 張卡片 */}
      {CARD_POSITIONS.map((pos, i) => (
        <group key={`card${i}`} position={pos} scale={v.cardScale[i]}>
          <RoundedBox args={[1.4, 1.1, 0.08]} radius={0.04} smoothness={3}>
            <meshPhysicalMaterial {...ghostCard} roughness={dynamicRoughness} />
          </RoundedBox>
          {/* 卡片內小橫線（模擬文字） */}
          {v.cardScale[i] > 0.5 && (
            <group position={[0, -0.15, 0.05]}>
              {[0.2, 0, -0.2].map((yOff, j) => (
                <mesh key={j} position={[0, yOff, 0]}>
                  <boxGeometry args={[0.8, 0.04, 0.01]} />
                  <meshBasicMaterial color={COLORS.componentDark} transparent opacity={bp * 0.3} />
                </mesh>
              ))}
            </group>
          )}
        </group>
      ))}

      {/* 按鈕組 */}
      {BUTTON_POSITIONS.map((pos, i) => (
        <group key={`btn${i}`} position={pos} scale={v.buttonScale[i]}>
          <RoundedBox args={[0.8, 0.3, 0.06]} radius={0.06} smoothness={4}>
            <meshPhysicalMaterial {...ghostButton} roughness={dynamicRoughness} />
          </RoundedBox>
        </group>
      ))}

      {/* 搜尋框 */}
      <group position={SEARCH_BAR_POS} scale={[v.searchBarScaleX, 1, 1]}>
        <RoundedBox args={[3.0, 0.28, 0.06]} radius={0.06} smoothness={3}>
          <meshPhysicalMaterial {...ghostSearch} roughness={dynamicRoughness} />
        </RoundedBox>
      </group>

      {/* ════════════ R4: 數據層 ════════════ */}

      {/* 3 條數據管道 */}
      {DATA_LINE_ENDPOINTS.map((line, i) => (
        <DataLine
          key={`line${i}`}
          from={line.from}
          to={line.to}
          progress={v.dataLineProgress[i]}
        />
      ))}

      {/* 3 個數據節點 */}
      {DATA_NODE_POSITIONS.map((pos, i) => (
        <group key={`node${i}`} position={pos} scale={v.dataNodeScale[i]}>
          <mesh>
            <sphereGeometry args={[0.1, 12, 12]} />
            <meshPhysicalMaterial
              color={COLORS.dataNode}
              transparent
              opacity={0.08 + bp * 0.92}
              emissive={COLORS.dataNode}
              emissiveIntensity={0.4}
              roughness={0.3}
            />
          </mesh>
          {/* 小型光暈 */}
          <mesh>
            <sphereGeometry args={[0.16, 8, 8]} />
            <meshBasicMaterial
              color={COLORS.dataNode}
              transparent
              opacity={0.15}
            />
          </mesh>
        </group>
      ))}

      {/* API 圖標（小圓柱 + 連線） */}
      <group position={[-3.0, -0.1, 0.1]} scale={v.apiIconScale}>
        <mesh>
          <cylinderGeometry args={[0.15, 0.15, 0.08, 12]} />
          <meshPhysicalMaterial
            color={COLORS.dataLine}
            transparent
            opacity={0.08 + bp * 0.92}
            emissive={COLORS.dataLine}
            emissiveIntensity={0.3}
            roughness={0.4}
          />
        </mesh>
        {/* 上下小碟 */}
        {[-0.08, 0.08].map((yOff, j) => (
          <mesh key={j} position={[0, yOff, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.03, 12]} />
            <meshPhysicalMaterial
              color={COLORS.dataLine}
              transparent
              opacity={bp * 0.6}
              roughness={0.5}
            />
          </mesh>
        ))}
      </group>

      {/* ════════════ R5: 視覺（全局材質變化，不新增 mesh）════════════ */}

      {/* R5 的效果已透過 colorFillProgress/glossProgress 注入上方所有材質 */}

      {/* ════════════ R6: 上線 ════════════ */}

      {/* 功能圖標（發光小方塊） */}
      {FEATURE_ICON_POSITIONS.map((pos, i) => (
        <group key={`icon${i}`} position={pos} scale={v.iconScale[i]}>
          <RoundedBox args={[0.25, 0.25, 0.08]} radius={0.04} smoothness={3}>
            <meshPhysicalMaterial
              color={[COLORS.accentBlue, COLORS.dataNode, COLORS.accentGold][i]}
              emissive={[COLORS.accentBlue, COLORS.dataNode, COLORS.accentGold][i]}
              emissiveIntensity={0.5 + v.launchPulse * 0.5}
              transparent
              opacity={0.3 + bp * 0.7}
              roughness={0.3}
            />
          </RoundedBox>
        </group>
      ))}

      {/* 發光脈衝（整體氛圍光） */}
      {v.launchPulse > 0 && (
        <pointLight
          position={[0, 2, 1]}
          color={COLORS.accentGold}
          intensity={v.launchPulse * 1.5}
          distance={12}
        />
      )}

      {/* ════════════ 粒子效果 ════════════ */}
      <Particles
        visible={!!isWorking}
        isCelebration={v.celebrationActive}
        frame={frame}
      />
    </group>
  )
}

// 線性色彩插值 helper
function lerpColor(from: string, to: string, t: number): string {
  const f = hexToRgb(from)
  const r = hexToRgb(to)
  const lr = Math.round(f[0] + (r[0] - f[0]) * t)
  const lg = Math.round(f[1] + (r[1] - f[1]) * t)
  const lb = Math.round(f[2] + (r[2] - f[2]) * t)
  return `rgb(${lr},${lg},${lb})`
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ]
}
