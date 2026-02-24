'use client'

import { useRef, useEffect, useMemo, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import { createBuildingTimeline, seekToQuestion, type BuildingRefs } from './buildingTimeline'

// ============================================================
// Three.js 3D 蓋房子場景
// Low-poly isometric 風格，藍圖線框 → 逐漸上色
// ============================================================

interface BuildingSceneProps {
  progress: number       // 已回答的題數 (0-30)
  totalQuestions: number  // 總題數
  round: number          // 當前輪次 (1-6)
  isWorking?: boolean    // LLM 正在工作（顯示施工粒子）
  isComplete?: boolean   // Q&A 結束
}

// ── 材質預設 ──
const BLUEPRINT_COLOR = new THREE.Color('#4a90d9')
const WALL_COLOR = new THREE.Color('#e2e8f0')
const ROOF_COLOR = new THREE.Color('#f59e0b')
const DOOR_COLOR = new THREE.Color('#8b5cf6')
const WINDOW_COLOR = new THREE.Color('#93c5fd')
const GROUND_COLOR = new THREE.Color('#86efac')
const TREE_GREEN = new THREE.Color('#22c55e')
const TREE_TRUNK = new THREE.Color('#92400e')
const LIGHT_COLOR = new THREE.Color('#facc15')

function createBlueprintMat(color: THREE.Color, initialOpacity = 0.3): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    transparent: true,
    opacity: initialOpacity,
    wireframe: false,
    roughness: 0.8,
    metalness: 0.1,
  })
}

// ── 主建築元件 ──
function Building({ progress, isWorking, isComplete }: { progress: number; isWorking?: boolean; isComplete?: boolean }) {
  const groupRef = useRef<THREE.Group>(null!)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const refsReady = useRef(false)

  // 所有幾何體 refs
  const groundRef = useRef<THREE.Mesh>(null!)
  const foundationRefs = useRef<THREE.Mesh[]>([])
  const wallRefs = useRef<THREE.Mesh[]>([])
  const doorRefs = useRef<THREE.Mesh[]>([])
  const windowRefs = useRef<THREE.Mesh[]>([])
  const roofRef = useRef<THREE.Mesh>(null!)
  const chimneyRef = useRef<THREE.Mesh>(null!)
  const lightRefs = useRef<THREE.Mesh[]>([])
  const treeRefs = useRef<THREE.Group[]>([])
  const colorTargetRefs = useRef<THREE.Mesh[]>([])
  const decorationRefs = useRef<THREE.Mesh[]>([])

  // 施工粒子
  const particlesRef = useRef<THREE.Points>(null!)
  const particleGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(30 * 3)
    for (let i = 0; i < 30; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6
      positions[i * 3 + 1] = Math.random() * 4
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [])

  // 初始化 timeline
  useEffect(() => {
    if (refsReady.current) return
    // 等所有 ref 掛上
    const timer = setTimeout(() => {
      if (!groundRef.current) return

      const buildingRefs: BuildingRefs = {
        ground: groundRef.current,
        foundations: foundationRefs.current.filter(Boolean),
        walls: wallRefs.current.filter(Boolean),
        doors: doorRefs.current.filter(Boolean),
        windows: windowRefs.current.filter(Boolean),
        colorTargets: colorTargetRefs.current.filter(Boolean),
        decorations: decorationRefs.current.filter(Boolean),
        roof: roofRef.current,
        chimney: chimneyRef.current,
        lights: lightRefs.current.filter(Boolean),
        trees: treeRefs.current.filter(Boolean) as unknown as THREE.Object3D[],
        particles: null,
      }

      timelineRef.current = createBuildingTimeline(buildingRefs)
      refsReady.current = true

      // 如果已有進度，立即跳轉
      if (progress > 0) {
        seekToQuestion(timelineRef.current, progress)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // 監聽進度變化
  useEffect(() => {
    if (timelineRef.current && progress > 0) {
      seekToQuestion(timelineRef.current, progress)
    }
  }, [progress])

  // 施工粒子動畫
  useFrame((_, delta) => {
    if (particlesRef.current && isWorking) {
      const positions = particlesRef.current.geometry.attributes.position
      for (let i = 0; i < positions.count; i++) {
        const y = positions.getY(i)
        positions.setY(i, y + delta * 0.5)
        if (y > 4) positions.setY(i, 0)
      }
      positions.needsUpdate = true
      particlesRef.current.rotation.y += delta * 0.1
    }
  })

  // 完工慶祝 — 略微旋轉
  useFrame((_, delta) => {
    if (isComplete && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15
    }
  })

  const setFoundationRef = (i: number) => (el: THREE.Mesh) => { foundationRefs.current[i] = el }
  const setWindowRef = (i: number) => (el: THREE.Mesh) => { windowRefs.current[i] = el }
  const setLightRef = (i: number) => (el: THREE.Mesh) => { lightRefs.current[i] = el }

  return (
    <group ref={groupRef}>
      {/* 地面 */}
      <mesh ref={groundRef} position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color={GROUND_COLOR} transparent opacity={0.3} roughness={0.9} />
      </mesh>

      {/* 地基（4 塊） */}
      {[[-1.2, 0, -1.2], [1.2, 0, -1.2], [-1.2, 0, 1.2], [1.2, 0, 1.2]].map((pos, i) => (
        <mesh key={`f${i}`} ref={setFoundationRef(i)} position={pos as [number, number, number]}>
          <boxGeometry args={[1, 0.3, 1]} />
          <meshStandardMaterial color={BLUEPRINT_COLOR} transparent opacity={0.4} roughness={0.7} />
        </mesh>
      ))}

      {/* 牆體（4 面） */}
      {[
        { pos: [0, 1, -1.5] as [number, number, number], size: [3, 2, 0.15] as [number, number, number] },
        { pos: [0, 1, 1.5] as [number, number, number], size: [3, 2, 0.15] as [number, number, number] },
        { pos: [-1.5, 1, 0] as [number, number, number], size: [0.15, 2, 3] as [number, number, number] },
        { pos: [1.5, 1, 0] as [number, number, number], size: [0.15, 2, 3] as [number, number, number] },
      ].map((wall, i) => {
        const mat = createBlueprintMat(WALL_COLOR, 0.5)
        colorTargetRefs.current[i] = null!
        return (
          <mesh
            key={`w${i}`}
            ref={(el: THREE.Mesh) => {
              wallRefs.current[i] = el
              colorTargetRefs.current[i] = el
            }}
            position={wall.pos}
            material={mat}
          >
            <boxGeometry args={wall.size} />
          </mesh>
        )
      })}

      {/* 門（正面中間） */}
      <mesh
        ref={(el: THREE.Mesh) => { doorRefs.current[0] = el }}
        position={[0, 0.6, -1.55]}
      >
        <boxGeometry args={[0.6, 1.2, 0.1]} />
        <meshStandardMaterial color={DOOR_COLOR} transparent opacity={0.6} roughness={0.5} />
      </mesh>

      {/* 窗戶（4 扇） */}
      {[
        [-0.8, 1.3, -1.55],
        [0.8, 1.3, -1.55],
        [-1.55, 1.3, 0.5],
        [1.55, 1.3, 0.5],
      ].map((pos, i) => (
        <mesh key={`win${i}`} ref={setWindowRef(i)} position={pos as [number, number, number]}>
          <boxGeometry args={[0.5, 0.5, 0.1]} />
          <meshStandardMaterial color={WINDOW_COLOR} transparent opacity={0.5} roughness={0.3} metalness={0.2} />
        </mesh>
      ))}

      {/* 裝飾（花盆） */}
      {[[-0.8, 0.15, -1.7], [0.8, 0.15, -1.7]].map((pos, i) => (
        <mesh
          key={`dec${i}`}
          ref={(el: THREE.Mesh) => { decorationRefs.current[i] = el }}
          position={pos as [number, number, number]}
        >
          <cylinderGeometry args={[0.15, 0.12, 0.2, 8]} />
          <meshStandardMaterial color="#dc2626" transparent opacity={0.6} />
        </mesh>
      ))}

      {/* 屋頂 */}
      <mesh ref={roofRef} position={[0, 2.8, 0]} userData={{ targetY: 2.8 }}>
        <coneGeometry args={[2.5, 1.2, 4]} />
        <meshStandardMaterial color={ROOF_COLOR} transparent opacity={0.5} roughness={0.6} />
      </mesh>

      {/* 煙囪 */}
      <mesh ref={chimneyRef} position={[0.8, 3.6, 0.3]} userData={{ targetY: 3.6 }}>
        <boxGeometry args={[0.3, 0.6, 0.3]} />
        <meshStandardMaterial color="#78716c" transparent opacity={0.5} />
      </mesh>

      {/* 燈光裝飾 */}
      {[[0, 2.3, -1.55], [-1.55, 2.3, 0]].map((pos, i) => (
        <group key={`light${i}`} ref={setLightRef(i) as React.Ref<THREE.Mesh>}>
          <mesh position={pos as [number, number, number]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color={LIGHT_COLOR} emissive={LIGHT_COLOR} emissiveIntensity={2} />
          </mesh>
          <pointLight position={pos as [number, number, number]} color={LIGHT_COLOR} intensity={0.5} distance={3} />
        </group>
      ))}

      {/* 樹木 */}
      {[[3, 0, 2], [-3, 0, -2]].map((pos, i) => (
        <group
          key={`tree${i}`}
          ref={(el: THREE.Group) => { treeRefs.current[i] = el }}
          position={pos as [number, number, number]}
          userData={{ targetY: 0 }}
        >
          <mesh position={[0, 1, 0]}>
            <coneGeometry args={[0.6, 1.5, 6]} />
            <meshStandardMaterial color={TREE_GREEN} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.1, 0.12, 0.5, 6]} />
            <meshStandardMaterial color={TREE_TRUNK} roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* 施工粒子（LLM 工作時顯示） */}
      {isWorking && (
        <points ref={particlesRef} geometry={particleGeo}>
          <pointsMaterial
            color={BLUEPRINT_COLOR}
            size={0.05}
            transparent
            opacity={0.6}
            sizeAttenuation
          />
        </points>
      )}
    </group>
  )
}

// ── Camera 動畫控制 ──
function CameraController({ progress, totalQuestions }: { progress: number; totalQuestions: number }) {
  const { camera } = useThree()
  const targetY = useMemo(() => {
    // 從高處俯瞰逐漸降到平視
    const ratio = totalQuestions > 0 ? progress / totalQuestions : 0
    return 10 - ratio * 4 // 10 → 6
  }, [progress, totalQuestions])

  useFrame(() => {
    camera.position.y += (targetY - camera.position.y) * 0.02
  })

  return null
}

// ── 主元件 ──
export default function BuildingScene({ progress, totalQuestions, round, isWorking, isComplete }: BuildingSceneProps) {
  const [webglOk, setWebglOk] = useState(true)

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      if (!gl) setWebglOk(false)
    } catch {
      setWebglOk(false)
    }
  }, [])

  if (!webglOk) {
    // Fallback 由外層 index.ts 處理
    return null
  }

  const percent = totalQuestions > 0 ? Math.round((progress / totalQuestions) * 100) : 0

  return (
    <div style={{ height: '100%', position: 'relative', background: '#f8fafc' }}>
      <Canvas
        camera={{ position: [8, 10, 8], fov: 35 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 5]} intensity={0.8} castShadow />
        <directionalLight position={[-3, 4, -3]} intensity={0.3} />

        <Building progress={progress} isWorking={isWorking} isComplete={isComplete} />
        <CameraController progress={progress} totalQuestions={totalQuestions} />

        <OrbitControls
          autoRotate={isComplete}
          autoRotateSpeed={0.5}
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.5}
        />
      </Canvas>

      {/* UI Overlay */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        pointerEvents: 'none',
      }}>
        {/* 輪次標籤 */}
        <div style={{
          display: 'flex',
          gap: 4,
          padding: '6px 12px',
          background: 'rgba(255,255,255,0.9)',
          borderRadius: 20,
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border-color)',
        }}>
          {['地基', '牆體', '門窗', '內裝', '屋頂', '完工'].map((label, i) => (
            <span key={label} style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 10,
              background: i < round ? 'var(--accent, #3b82f6)' : i === round - 1 ? 'var(--accent, #3b82f6)' : 'transparent',
              color: i < round || i === round - 1 ? 'white' : 'var(--gray-400)',
              fontWeight: i === round - 1 ? 600 : 400,
              transition: 'all 0.3s',
            }}>
              {label}
            </span>
          ))}
        </div>

        {/* 進度文字 */}
        <div style={{
          fontSize: 12,
          color: 'var(--gray-500)',
          background: 'rgba(255,255,255,0.8)',
          padding: '4px 12px',
          borderRadius: 12,
          backdropFilter: 'blur(4px)',
        }}>
          {progress}/{totalQuestions} 題完成 · {percent}%
          {isWorking && ' · AI 分析中...'}
        </div>
      </div>
    </div>
  )
}
