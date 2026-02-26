// ============================================================
// "The Craft" Remotion Composition
// ThreeCanvas + 暖色光源 + CraftCamera + CraftScene
// ============================================================

import { useCurrentFrame, useVideoConfig } from 'remotion'
import { ThreeCanvas } from '@remotion/three'
import { useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import CraftScene from './CraftScene'
import { useCraftAnimation } from './FrameDrivenAnimations'
import { COLORS, CAMERA_CONFIG } from './constants'
import {
  selectCoreShape,
  selectPalette,
  generateFragments,
  generateEnergyLines,
  generateOrbitRings,
} from './procedural'

interface CraftCompositionProps {
  seed?: number
}

// ── 幀驅動相機 ──

function CraftCamera({ v }: { v: ReturnType<typeof useCraftAnimation> }) {
  const { camera } = useThree()

  useEffect(() => {
    const angle = v.cameraOrbitAngle - 0.3
    camera.position.x = Math.cos(angle) * v.cameraRadius
    camera.position.y = v.cameraY
    camera.position.z = Math.sin(angle) * v.cameraRadius
    camera.lookAt(0, 0, 0)
  })

  return null
}

export default function CraftComposition({ seed = 0 }: CraftCompositionProps) {
  const frame = useCurrentFrame()
  const { width, height, fps } = useVideoConfig()
  const v = useCraftAnimation(frame, fps)

  // Seed-driven procedural data
  const coreShape = useMemo(() => selectCoreShape(seed), [seed])
  const palette = useMemo(() => selectPalette(seed), [seed])
  const fragments = useMemo(() => generateFragments(seed, 30), [seed])
  const energyLines = useMemo(() => generateEnergyLines(seed), [seed])
  const orbitRings = useMemo(() => generateOrbitRings(seed), [seed])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: COLORS.bgDark }}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ position: [8, 7, 8], fov: CAMERA_CONFIG.initialFov }}
      >
        {/* 暗色鍛爐背景球 */}
        <CraftBackground />

        {/* 暖色 3 點照明 */}
        <ambientLight intensity={v.ambientIntensity} color="#FFF5E1" />
        <directionalLight
          position={[5, 8, 3]}
          intensity={v.mainLightIntensity}
          color="#FFD4A0"
        />
        <directionalLight
          position={[-4, 3, -5]}
          intensity={v.fillLightIntensity}
          color="#8FAADC"
        />
        <pointLight
          position={[0, 0, 0]}
          intensity={v.pointLightIntensity}
          distance={15}
          color={palette.coreEmissive}
        />

        <CraftScene
          v={v}
          frame={frame}
          coreShape={coreShape}
          palette={palette}
          fragments={fragments}
          energyLines={energyLines}
          orbitRings={orbitRings}
        />

        <CraftCamera v={v} />
      </ThreeCanvas>
    </div>
  )
}

// ── 暗色鍛爐背景 ──

function CraftBackground() {
  const bgGeo = useMemo(() => {
    const geo = new (require('three').SphereGeometry)(50, 16, 12)
    geo.scale(-1, 1, -1)
    return geo
  }, [])

  const bgColors = useMemo(() => {
    const topRGB = hexToRgb(COLORS.bgGradientTop)
    const bottomRGB = hexToRgb(COLORS.bgGradientBottom)
    const posAttr = bgGeo.getAttribute('position')
    const count = posAttr.count
    const arr = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const y = posAttr.getY(i)
      const t = Math.max(0, Math.min(1, (y + 50) / 100))
      arr[i * 3] = (bottomRGB[0] + (topRGB[0] - bottomRGB[0]) * t) / 255
      arr[i * 3 + 1] = (bottomRGB[1] + (topRGB[1] - bottomRGB[1]) * t) / 255
      arr[i * 3 + 2] = (bottomRGB[2] + (topRGB[2] - bottomRGB[2]) * t) / 255
    }
    return arr
  }, [bgGeo])

  return (
    <mesh geometry={bgGeo}>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attach="attributes-position"
          args={[bgGeo.getAttribute('position').array, 3]}
          count={bgGeo.getAttribute('position').count}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[bgColors, 3]}
          count={bgColors.length / 3}
        />
        {bgGeo.index && (
          <bufferAttribute
            attach="index"
            args={[bgGeo.index.array, 1]}
            count={bgGeo.index.count}
          />
        )}
      </bufferGeometry>
      <meshBasicMaterial vertexColors side={2} />
    </mesh>
  )
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ]
}
