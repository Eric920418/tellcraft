// ============================================================
// "The Craft" v2 Remotion Composition
// 鍛造車間：ThreeCanvas + 暖色光源 + SpotLight + Bloom + Vignette
// ============================================================

import { useCurrentFrame, useVideoConfig } from 'remotion'
import { ThreeCanvas } from '@remotion/three'
import { useThree } from '@react-three/fiber'
import { useEffect, useMemo, Suspense } from 'react'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import CraftScene from './CraftScene'
import { useCraftAnimation } from './FrameDrivenAnimations'
import { COLORS, CAMERA_CONFIG } from './constants'
import {
  selectCoreShape,
  selectPalette,
  generateOrbitRings,
  generateSparkSeeds,
  generateCoals,
  generateAmbientEmbers,
} from './procedural'

interface CraftCompositionProps {
  seed?: number
}

// ── 幀驅動相機 ──

function CraftCamera({ v }: { v: ReturnType<typeof useCraftAnimation> }) {
  const { camera } = useThree()

  useEffect(() => {
    const angle = v.cameraOrbitAngle + 0.8 // 從右前方 45° 開始
    camera.position.x = Math.cos(angle) * v.cameraRadius
    camera.position.y = v.cameraY
    camera.position.z = Math.sin(angle) * v.cameraRadius
    camera.lookAt(0, v.cameraLookAtY, 0)
  })

  return null
}

// ── Post Processing ──

function PostProcessing({ bloomIntensity }: { bloomIntensity: number }) {
  return (
    <Suspense fallback={null}>
      <EffectComposer>
        <Bloom
          intensity={bloomIntensity}
          luminanceThreshold={0.4}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.1} darkness={0.6} />
      </EffectComposer>
    </Suspense>
  )
}

// ── Main Composition ──

export default function CraftComposition({ seed = 0 }: CraftCompositionProps) {
  const frame = useCurrentFrame()
  const { width, height, fps } = useVideoConfig()
  const v = useCraftAnimation(frame, fps)

  // Seed-driven procedural data
  const coreShape = useMemo(() => selectCoreShape(seed), [seed])
  const palette = useMemo(() => selectPalette(seed), [seed])
  const orbitRings = useMemo(() => generateOrbitRings(seed), [seed])
  const sparkSeeds = useMemo(() => generateSparkSeeds(seed, 25), [seed])
  const coals = useMemo(() => generateCoals(seed), [seed])
  const ambientEmbers = useMemo(() => generateAmbientEmbers(seed), [seed])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: COLORS.bgDark }}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ position: [6, 3.5, 6], fov: CAMERA_CONFIG.initialFov }}
      >
        {/* 暗色鍛爐背景球 */}
        <CraftBackground />

        {/* 暖色照明系統 */}
        <ambientLight intensity={v.ambientIntensity} color="#FFF5E1" />

        {/* 主光：從右上方打在鐵砧上 */}
        <directionalLight
          position={[4, 6, 3]}
          intensity={v.mainLightIntensity}
          color="#FFD4A0"
        />

        {/* 上方聚光燈：打在工作區 */}
        <spotLight
          position={[0, 5, 1]}
          angle={0.4}
          penumbra={0.5}
          intensity={v.spotLightIntensity}
          color="#FFA060"
          target-position={[0, 0.7, 0]}
        />

        {/* 冷色補光（左後方，增加立體感） */}
        <directionalLight
          position={[-3, 2, -4]}
          intensity={0.1}
          color="#8FAADC"
        />

        {/* 工件位置點光源（隨工件發光增強） */}
        <pointLight
          position={[0, 0.7 + v.workpieceRise, 0]}
          intensity={v.pointLightIntensity}
          distance={8}
          color={palette.coreEmissive}
        />

        {/* 熔爐內部點光源 */}
        <pointLight
          position={[0, 0.35, -1.5]}
          intensity={v.furnaceGlow * 0.5}
          distance={4}
          color="#FF4500"
        />

        <CraftScene
          v={v}
          frame={frame}
          coreShape={coreShape}
          palette={palette}
          orbitRings={orbitRings}
          sparkSeeds={sparkSeeds}
          coals={coals}
          ambientEmbers={ambientEmbers}
        />

        <PostProcessing bloomIntensity={v.bloomIntensity} />

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
