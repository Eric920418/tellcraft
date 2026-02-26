// ============================================================
// "The Craft" v2 Remotion Composition
// 鍛造車間：HemisphereLight + Fog + Shadows + Bloom + ToneMapping
// ============================================================

import { useCurrentFrame, useVideoConfig } from 'remotion'
import { ThreeCanvas } from '@remotion/three'
import { useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, Suspense } from 'react'
import * as THREE from 'three'
import { EffectComposer, Bloom, Vignette, Noise, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
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

// ── 禁用 Renderer 內建 ToneMapping（由 EffectComposer 統一處理）──

function RendererSetup() {
  const { gl } = useThree()
  useEffect(() => {
    gl.toneMapping = THREE.NoToneMapping
    gl.shadowMap.enabled = true
    gl.shadowMap.type = THREE.PCFSoftShadowMap
  }, [gl])
  return null
}

// ── SpotLight 需要 target Object3D ──

function WorkAreaSpotLight({ intensity }: { intensity: number }) {
  const spotRef = useRef<THREE.SpotLight>(null)
  const { scene } = useThree()

  useEffect(() => {
    if (!spotRef.current) return
    const target = new THREE.Object3D()
    target.position.set(0, 0.7, 0)
    scene.add(target)
    spotRef.current.target = target
    return () => { scene.remove(target) }
  }, [scene])

  return (
    <spotLight
      ref={spotRef}
      position={[0.5, 5, 1.5]}
      angle={Math.PI / 5}
      penumbra={0.8}
      intensity={intensity}
      color="#FFA060"
      decay={2}
      castShadow
      shadow-mapSize-width={512}
      shadow-mapSize-height={512}
      shadow-bias={-0.002}
    />
  )
}

// ── 幀驅動相機 ──

function CraftCamera({ v }: { v: ReturnType<typeof useCraftAnimation> }) {
  const { camera } = useThree()

  useEffect(() => {
    const angle = v.cameraOrbitAngle + 0.8
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
          luminanceThreshold={0.9}
          luminanceSmoothing={0.4}
          mipmapBlur
        />
        <Noise opacity={0.03} />
        <Vignette eskil={false} offset={0.15} darkness={0.8} />
        <ToneMapping mode={ToneMappingMode.AGX} />
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
        <RendererSetup />

        {/* 霧氣（增加深度感和氛圍） */}
        <fogExp2 attach="fog" args={[COLORS.bgDark, 0.06]} />

        {/* 暗色鍛爐背景球 */}
        <CraftBackground />

        {/* ── 照明系統 ── */}

        {/* HemisphereLight（天空暖黃 + 地面深褐，取代 ambientLight） */}
        <hemisphereLight
          args={['#FFF0D4', '#3A1F0E', v.ambientIntensity * 1.5]}
        />

        {/* 主光：從右上方打在鐵砧上（投射陰影） */}
        <directionalLight
          position={[4, 6, 3]}
          intensity={v.mainLightIntensity}
          color="#FFD4A0"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.001}
        />

        {/* 上方聚光燈：聚焦在工作區（正確設定 target） */}
        <WorkAreaSpotLight intensity={v.spotLightIntensity} />

        {/* 冷色 Rim Light（左後方，增加深度分離） */}
        <directionalLight
          position={[-4, 2, -5]}
          intensity={0.12}
          color="#6B8CAE"
        />

        {/* 地面反射補光（從下方微弱暖色反彈） */}
        <pointLight
          position={[0, -0.3, 0]}
          intensity={0.06}
          distance={3}
          color="#FF8C42"
        />

        {/* 工件位置點光源（隨工件發光增強） */}
        <pointLight
          position={[0, 0.7 + v.workpieceRise, 0]}
          intensity={v.pointLightIntensity}
          distance={8}
          decay={2}
          color={palette.coreEmissive}
        />

        {/* 熔爐內部點光源（強烈暖光） */}
        <pointLight
          position={[0, 0.4, -1.5]}
          intensity={v.furnaceGlow * 0.8}
          distance={5}
          decay={2}
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
    const geo = new THREE.SphereGeometry(50, 16, 12)
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
