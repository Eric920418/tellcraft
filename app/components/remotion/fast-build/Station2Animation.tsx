// ============================================================
// 工位 2：動畫噴塗（噴嘴 + 刷子）
// ============================================================

import { FACTORY_COLORS, STATION_X, BELT } from './constants'

interface Station2Props {
  nozzleY: number
  brushClose: number
  active: boolean
  idleBob: number
}

export default function Station2Animation({ nozzleY, brushClose, active, idleBob }: Station2Props) {
  const brushOffset = 0.4 - brushClose * 0.25

  return (
    <group position={[STATION_X.station2, BELT.y + 0.02, 0]}>
      {/* 底座 */}
      <mesh position={[0, 0.8, -1]}>
        <boxGeometry args={[0.6, 1.6, 0.6]} />
        <meshStandardMaterial color={FACTORY_COLORS.stationBase} metalness={0.3} roughness={0.6} />
      </mesh>

      {/* 噴嘴（從上方下降） */}
      <group position={[0, 2.0 + nozzleY + idleBob, 0]}>
        <mesh>
          <coneGeometry args={[0.08, 0.4, 8]} />
          <meshStandardMaterial color={FACTORY_COLORS.nozzle} metalness={0.4} roughness={0.4} />
        </mesh>
        {/* 噴嘴管道 */}
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.3, 6]} />
          <meshStandardMaterial color={FACTORY_COLORS.stationBase} metalness={0.3} roughness={0.5} />
        </mesh>
      </group>

      {/* 左刷子 */}
      <mesh position={[-brushOffset, 1.2 + idleBob, 0]}>
        <boxGeometry args={[0.1, 0.6, 0.4]} />
        <meshStandardMaterial color={FACTORY_COLORS.brush} metalness={0.2} roughness={0.7} />
      </mesh>

      {/* 右刷子 */}
      <mesh position={[brushOffset, 1.2 + idleBob, 0]}>
        <boxGeometry args={[0.1, 0.6, 0.4]} />
        <meshStandardMaterial color={FACTORY_COLORS.brush} metalness={0.2} roughness={0.7} />
      </mesh>

      {/* 工位標籤指示燈 */}
      <mesh position={[0, 2.3, -1]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial
          color={active ? '#a855f7' : '#94a3b8'}
          emissive={active ? '#a855f7' : '#000000'}
          emissiveIntensity={active ? 2 : 0}
        />
      </mesh>
    </group>
  )
}
