// ============================================================
// 3D 工廠流水線主 Composition
// ============================================================

import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion'
import { ThreeCanvas } from '@remotion/three'
import { useFactoryAnimationValues } from './FrameDrivenAnimations'
import ConveyorBelt from './ConveyorBelt'
import Station1Structure from './Station1Structure'
import Station2Animation from './Station2Animation'
import Station3Rwd from './Station3Rwd'
import Product from './Product'
import DisplayPedestal from './DisplayPedestal'
import FactoryParticles from './FactoryParticles'
import FactoryCameraController from './FactoryCameraController'
import { FACTORY_COLORS } from './constants'

// 階段標籤
const PHASE_LABELS = [
  { key: 'structure', label: '骨架', color: '#3b82f6' },
  { key: 'animation', label: '動效', color: '#a855f7' },
  { key: 'rwd', label: '適配', color: '#f59e0b' },
]

export default function FastBuildComposition() {
  const frame = useCurrentFrame()
  const { width, height, fps } = useVideoConfig()
  const v = useFactoryAnimationValues(frame, fps)

  // 當前階段
  let currentPhase = 0
  if (frame >= 230) currentPhase = 2
  else if (frame >= 130) currentPhase = 1

  // 進度百分比
  const percent = interpolate(frame, [30, 295], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0f172a' }}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ position: [0, 5, 8], fov: 40 }}
      >
        {/* 環境光 */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={0.7} />
        <directionalLight position={[-3, 6, -3]} intensity={0.3} />

        {/* 地面 */}
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[24, 10]} />
          <meshStandardMaterial color={FACTORY_COLORS.floor} roughness={0.9} />
        </mesh>

        {/* 傳送帶 */}
        <ConveyorBelt rollerRotation={v.rollerRotation} />

        {/* 3 個工位 */}
        <Station1Structure
          armRotation={v.s1ArmRotation}
          pistonY={v.s1PistonY}
          active={v.s1Active}
          idleBob={v.idleBob}
        />
        <Station2Animation
          nozzleY={v.s2NozzleY}
          brushClose={v.s2BrushClose}
          active={v.s2Active}
          idleBob={v.idleBob}
        />
        <Station3Rwd
          clampClose={v.s3ClampClose}
          plateY={v.s3PlateY}
          active={v.s3Active}
          idleBob={v.idleBob}
        />

        {/* 產品 */}
        <Product
          x={v.productX}
          y={v.displayActive ? v.displayProductY : v.productY}
          scale={v.productScale}
          materialStage={v.materialStage}
          displayRotation={v.displayRotation}
        />

        {/* 展示台 */}
        <DisplayPedestal spotlightIntensity={v.displaySpotlight} />

        {/* 粒子 */}
        <FactoryParticles
          frame={frame}
          s1Active={v.s1Active}
          s2Active={v.s2Active}
          s3Active={v.s3Active}
          displayActive={v.displayActive}
        />

        {/* 相機控制 */}
        <FactoryCameraController productX={v.productX} frame={frame} />
      </ThreeCanvas>

      {/* UI Overlay */}
      <div style={{
        position: 'absolute',
        bottom: 16,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        pointerEvents: 'none',
      }}>
        {/* 階段指示 */}
        <div style={{
          display: 'flex',
          gap: 6,
          padding: '6px 14px',
          background: 'rgba(0,0,0,0.5)',
          borderRadius: 20,
          backdropFilter: 'blur(8px)',
        }}>
          {PHASE_LABELS.map((p, i) => (
            <span key={p.key} style={{
              fontSize: 12,
              padding: '2px 10px',
              borderRadius: 10,
              background: i <= currentPhase ? p.color : 'transparent',
              color: i <= currentPhase ? 'white' : 'rgba(255,255,255,0.3)',
              fontWeight: i === currentPhase ? 600 : 400,
              fontFamily: 'var(--font-mono, monospace)',
            }}>
              {p.label}
            </span>
          ))}
        </div>

        {/* 進度條 */}
        <div style={{
          width: 240,
          height: 4,
          borderRadius: 2,
          background: 'rgba(255,255,255,0.1)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            borderRadius: 2,
            background: PHASE_LABELS[currentPhase]?.color ?? '#3b82f6',
            width: `${percent}%`,
            transition: 'width 0.1s linear',
          }} />
        </div>

        {/* 百分比 */}
        <span style={{
          fontSize: 11,
          color: 'rgba(255,255,255,0.5)',
          fontFamily: 'var(--font-mono, monospace)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {Math.round(percent)}%
        </span>
      </div>
    </div>
  )
}
