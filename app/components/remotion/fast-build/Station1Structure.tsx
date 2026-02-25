// ============================================================
// 工位 1：結構生成（機械臂 + 活塞）
// ============================================================

import { FACTORY_COLORS, STATION_X, BELT } from './constants'

interface Station1Props {
  armRotation: number
  pistonY: number
  active: boolean
  idleBob: number
}

export default function Station1Structure({ armRotation, pistonY, active, idleBob }: Station1Props) {
  return (
    <group position={[STATION_X.station1, BELT.y + 0.02, 0]}>
      {/* 底座 */}
      <mesh position={[0, 0.8, -1]}>
        <boxGeometry args={[0.6, 1.6, 0.6]} />
        <meshStandardMaterial color={FACTORY_COLORS.stationBase} metalness={0.3} roughness={0.6} />
      </mesh>

      {/* 機械臂 */}
      <group
        position={[0, 1.6 + idleBob, -1]}
        rotation={[0, 0, armRotation]}
      >
        <mesh position={[0, 0, 0.5]}>
          <boxGeometry args={[0.15, 0.15, 1.2]} />
          <meshStandardMaterial color={FACTORY_COLORS.arm} metalness={0.5} roughness={0.4} />
        </mesh>
        {/* 臂頂（關節） */}
        <mesh position={[0, 0, 1.1]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color={FACTORY_COLORS.armTop} metalness={0.6} roughness={0.3} />
        </mesh>
      </group>

      {/* 活塞（從上方下壓） */}
      <mesh position={[0, 2.0 + pistonY, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 0.5, 8]} />
        <meshStandardMaterial color={FACTORY_COLORS.piston} metalness={0.5} roughness={0.3} />
      </mesh>

      {/* 工位標籤指示燈 */}
      <mesh position={[0, 2.3, -1]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial
          color={active ? '#22c55e' : '#94a3b8'}
          emissive={active ? '#22c55e' : '#000000'}
          emissiveIntensity={active ? 2 : 0}
        />
      </mesh>
    </group>
  )
}
