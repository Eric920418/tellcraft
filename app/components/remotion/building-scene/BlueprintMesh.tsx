// ============================================================
// 藍圖→實體雙層過渡通用元件
// wireframe 層（藍色）opacity 1→0.2 + 實體層 opacity 0→1
// ============================================================

import { type ReactNode } from 'react'
import { COLORS } from './constants'

interface BlueprintMeshProps {
  /** 過渡進度 0（純線框）→ 1（純實體） */
  solidProgress: number
  /** 實體材質顏色 */
  color: string
  /** 傳入幾何體子元素 */
  children: ReactNode
  /** mesh props */
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: [number, number, number] | number
  roughness?: number
  metalness?: number
}

export default function BlueprintMesh({
  solidProgress,
  color,
  children,
  position,
  rotation,
  scale,
  roughness = 0.7,
  metalness = 0.1,
}: BlueprintMeshProps) {
  const wireOpacity = Math.max(0.15, 1 - solidProgress * 0.85)
  const solidOpacity = solidProgress

  const scaleArr: [number, number, number] | undefined =
    typeof scale === 'number' ? [scale, scale, scale] : scale

  return (
    <group position={position} rotation={rotation} scale={scaleArr}>
      {/* 藍圖線框層 */}
      <mesh>
        {children}
        <meshStandardMaterial
          color={COLORS.blueprint}
          wireframe
          transparent
          opacity={wireOpacity}
        />
      </mesh>

      {/* 實體材質層 */}
      <mesh>
        {children}
        <meshStandardMaterial
          color={color}
          transparent
          opacity={solidOpacity}
          roughness={roughness}
          metalness={metalness}
        />
      </mesh>
    </group>
  )
}
