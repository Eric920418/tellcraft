// ============================================================
// 產品方塊（材質動態變化：灰→藍線框→紫實體→金成品）
// ============================================================

import { FACTORY_COLORS } from './constants'

interface ProductProps {
  x: number
  y: number
  scale: number
  materialStage: number  // 0=raw, 1=wireframe, 2=solid, 3=final
  displayRotation?: number
}

const STAGE_CONFIG = [
  { color: FACTORY_COLORS.rawMaterial, wireframe: false, emissive: '#000000', emissiveIntensity: 0 },
  { color: FACTORY_COLORS.wireframe, wireframe: true, emissive: FACTORY_COLORS.wireframe, emissiveIntensity: 0.3 },
  { color: FACTORY_COLORS.solidSurface, wireframe: false, emissive: FACTORY_COLORS.solidSurface, emissiveIntensity: 0.2 },
  { color: FACTORY_COLORS.finalProduct, wireframe: false, emissive: FACTORY_COLORS.finalProduct, emissiveIntensity: 0.5 },
]

export default function Product({ x, y, scale, materialStage, displayRotation = 0 }: ProductProps) {
  const cfg = STAGE_CONFIG[materialStage] ?? STAGE_CONFIG[0]

  return (
    <group
      position={[x, y, 0]}
      rotation={[0, displayRotation, 0]}
      scale={[scale, scale, scale]}
    >
      <mesh>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial
          color={cfg.color}
          wireframe={cfg.wireframe}
          emissive={cfg.emissive}
          emissiveIntensity={cfg.emissiveIntensity}
          metalness={materialStage === 3 ? 0.6 : 0.1}
          roughness={materialStage === 3 ? 0.2 : 0.5}
          transparent={materialStage === 1}
          opacity={materialStage === 1 ? 0.8 : 1}
        />
      </mesh>
    </group>
  )
}
