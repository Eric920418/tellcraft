// ============================================================
// 工位 3：RWD 適配（夾具 + 壓板）
// ============================================================

import { FACTORY_COLORS, STATION_X, BELT } from './constants'

interface Station3Props {
  clampClose: number
  plateY: number
  active: boolean
  idleBob: number
}

export default function Station3Rwd({ clampClose, plateY, active, idleBob }: Station3Props) {
  const clampOffset = 0.5 - clampClose * 0.3

  return (
    <group position={[STATION_X.station3, BELT.y + 0.02, 0]}>
      {/* 底座 */}
      <mesh position={[0, 0.8, -1]}>
        <boxGeometry args={[0.6, 1.6, 0.6]} />
        <meshStandardMaterial color={FACTORY_COLORS.stationBase} metalness={0.3} roughness={0.6} />
      </mesh>

      {/* 左夾具 */}
      <mesh position={[-clampOffset, 1.0 + idleBob, 0]}>
        <boxGeometry args={[0.12, 0.8, 0.5]} />
        <meshStandardMaterial color={FACTORY_COLORS.clamp} metalness={0.4} roughness={0.4} />
      </mesh>

      {/* 右夾具 */}
      <mesh position={[clampOffset, 1.0 + idleBob, 0]}>
        <boxGeometry args={[0.12, 0.8, 0.5]} />
        <meshStandardMaterial color={FACTORY_COLORS.clamp} metalness={0.4} roughness={0.4} />
      </mesh>

      {/* 壓板（從上方下壓） */}
      <mesh position={[0, 1.8 + plateY + idleBob, 0]}>
        <boxGeometry args={[0.8, 0.1, 0.6]} />
        <meshStandardMaterial color={FACTORY_COLORS.plate} metalness={0.5} roughness={0.3} />
      </mesh>

      {/* 工位標籤指示燈 */}
      <mesh position={[0, 2.3, -1]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial
          color={active ? '#f59e0b' : '#94a3b8'}
          emissive={active ? '#f59e0b' : '#000000'}
          emissiveIntensity={active ? 2 : 0}
        />
      </mesh>
    </group>
  )
}
