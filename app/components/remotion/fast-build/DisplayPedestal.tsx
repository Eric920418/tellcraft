// ============================================================
// 展示台 + 聚光燈
// ============================================================

import { FACTORY_COLORS, STATION_X, BELT } from './constants'

interface DisplayPedestalProps {
  spotlightIntensity: number
}

export default function DisplayPedestal({ spotlightIntensity }: DisplayPedestalProps) {
  return (
    <group position={[STATION_X.display, 0, 0]}>
      {/* 展示台底座 */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.6, 0.7, 0.2, 16]} />
        <meshStandardMaterial
          color={FACTORY_COLORS.pedestal}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>

      {/* 展示台頂面 */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.04, 16]} />
        <meshStandardMaterial
          color={FACTORY_COLORS.pedestal}
          metalness={0.7}
          roughness={0.2}
          emissive={FACTORY_COLORS.spotlight}
          emissiveIntensity={spotlightIntensity * 0.3}
        />
      </mesh>

      {/* 聚光燈錐（頂部） */}
      {spotlightIntensity > 0.1 && (
        <>
          <mesh position={[0, 2.5, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.15, 0.4, 8]} />
            <meshStandardMaterial
              color={'#94a3b8'}
              metalness={0.5}
              roughness={0.4}
            />
          </mesh>
          <spotLight
            position={[0, 2.3, 0]}
            angle={0.4}
            penumbra={0.5}
            intensity={spotlightIntensity * 3}
            color={FACTORY_COLORS.spotlight}
            target-position={[STATION_X.display, 0, 0]}
            distance={4}
          />
        </>
      )}
    </group>
  )
}
