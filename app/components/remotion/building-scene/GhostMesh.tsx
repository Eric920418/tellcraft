// @ts-nocheck — 已被 CraftScene.tsx 取代，保留作後續清理參考
// ============================================================
// 幽靈→實體過渡元件（取代 BlueprintMesh）
// 半透明藍色幽靈 → 光潤實體，無任何 wireframe
// ============================================================

import { type ReactNode } from 'react'
import { COLORS } from './constants'

interface GhostMeshProps {
  /** 過渡進度 0（幽靈態）→ 1（實體態） */
  solidProgress: number
  /** 實體態材質顏色 */
  color: string
  /** 幽靈態發光色，默認品牌藍 */
  ghostColor?: string
  /** 傳入幾何體或 RoundedBox 子元素 */
  children: ReactNode
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: [number, number, number] | number
}

export default function GhostMesh({
  solidProgress,
  color,
  ghostColor = COLORS.accentBlue,
  children,
  position,
  rotation,
  scale,
}: GhostMeshProps) {
  const scaleArr: [number, number, number] | undefined =
    typeof scale === 'number' ? [scale, scale, scale] : scale

  return (
    <mesh position={position} rotation={rotation} scale={scaleArr}>
      {children}
      <meshPhysicalMaterial
        color={color}
        transparent
        opacity={0.08 + solidProgress * 0.92}
        emissive={ghostColor}
        emissiveIntensity={(1 - solidProgress) * 0.3}
        roughness={0.9 - solidProgress * 0.6}
        metalness={solidProgress * 0.1}
        clearcoat={solidProgress * 0.3}
      />
    </mesh>
  )
}

/**
 * Hook: 計算 ghost material 屬性（用於 RoundedBox 等自帶 geometry 的 drei 元件）
 */
export function useGhostMaterial(solidProgress: number, color: string, ghostColor: string = COLORS.accentBlue) {
  return {
    color,
    transparent: true,
    opacity: 0.08 + solidProgress * 0.92,
    emissive: ghostColor,
    emissiveIntensity: (1 - solidProgress) * 0.3,
    roughness: 0.9 - solidProgress * 0.6,
    metalness: solidProgress * 0.1,
    clearcoat: solidProgress * 0.3,
  }
}
