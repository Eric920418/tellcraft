// ============================================================
// 傳送帶 + 滾筒
// ============================================================

import { FACTORY_COLORS, BELT } from './constants'

interface ConveyorBeltProps {
  rollerRotation: number
}

export default function ConveyorBelt({ rollerRotation }: ConveyorBeltProps) {
  const rollers = Array.from({ length: BELT.rollerCount }, (_, i) => {
    const x = -BELT.length / 2 + i * BELT.rollerSpacing + 0.45
    return x
  })

  return (
    <group position={[0, BELT.y, 0]}>
      {/* 傳送帶面板 */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[BELT.length, 0.05, BELT.width]} />
        <meshStandardMaterial color={FACTORY_COLORS.beltDark} roughness={0.9} />
      </mesh>

      {/* 左右框架 */}
      <mesh position={[0, -0.15, BELT.width / 2 + 0.06]}>
        <boxGeometry args={[BELT.length, 0.35, 0.08]} />
        <meshStandardMaterial color={FACTORY_COLORS.frame} metalness={0.3} roughness={0.6} />
      </mesh>
      <mesh position={[0, -0.15, -(BELT.width / 2 + 0.06)]}>
        <boxGeometry args={[BELT.length, 0.35, 0.08]} />
        <meshStandardMaterial color={FACTORY_COLORS.frame} metalness={0.3} roughness={0.6} />
      </mesh>

      {/* 滾筒 */}
      {rollers.map((x, i) => (
        <mesh
          key={`roller${i}`}
          position={[x, -0.04, 0]}
          rotation={[rollerRotation, 0, 0]}
        >
          <cylinderGeometry args={[BELT.rollerRadius, BELT.rollerRadius, BELT.width - 0.05, 8]} />
          <meshStandardMaterial color={FACTORY_COLORS.roller} metalness={0.4} roughness={0.5} />
        </mesh>
      ))}

      {/* 支撐腿（4 根） */}
      {[-7, -2, 3, 7].map((x, i) => (
        <mesh key={`leg${i}`} position={[x, -0.45, 0]}>
          <boxGeometry args={[0.15, 0.6, 0.15]} />
          <meshStandardMaterial color={FACTORY_COLORS.frame} metalness={0.2} roughness={0.7} />
        </mesh>
      ))}
    </group>
  )
}
