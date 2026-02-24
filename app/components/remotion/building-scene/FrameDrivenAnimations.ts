// ============================================================
// 幀驅動動畫值：替代 GSAP timeline 的 30 個 label
// 每個 getter 用 useCurrentFrame + spring/interpolate
// ============================================================

import { spring, interpolate } from 'remotion'
import type { SpringConfig } from 'remotion'
import { BOUNCY, SNAPPY, HEAVY, SMOOTH } from '../shared/springs'

// spring 的 helper：frame < 0 時返回 0
function safeSpring(frame: number, fps: number, delay: number, config?: SpringConfig): number {
  const f = frame - delay
  if (f < 0) return 0
  return spring({ frame: f, fps, config })
}

export interface AnimationValues {
  // Round 1: 地基
  groundScale: number
  foundationY: number[]
  foundationScale: number[]

  // Round 2: 牆體
  wallScaleY: number[]
  wallShakeY: number[]

  // Round 3: 門窗
  doorScale: number
  windowScale: number[]

  // Round 4: 內裝
  wallOpacity: number[]
  decorationScale: number[]

  // Round 5: 屋頂
  roofY: number
  roofScale: number
  chimneyY: number
  chimneyScale: number

  // Round 6: 完工
  lightScale: number[]
  treeScale: number[]
  treeY: number[]

  // 全局
  celebrationRotation: number
  cameraY: number
}

export function useAnimationValues(frame: number, fps: number): AnimationValues {
  // ── Round 1: 地基（q1-q5 → frame 0-149）──
  const groundScale = safeSpring(frame, fps, 0, BOUNCY)

  const foundationY = [0, 1, 2, 3].map(i => {
    const delay = 30 + i * 30 // q2=30, q3=60, q4=90, q5=120
    const p = safeSpring(frame, fps, delay, SNAPPY)
    return interpolate(p, [0, 1], [-2, 0])
  })

  const foundationScale = [0, 1, 2, 3].map(i => {
    const delay = 30 + i * 30
    const p = safeSpring(frame, fps, delay, SNAPPY)
    return interpolate(p, [0, 1], [0.8, 1])
  })

  // ── Round 2: 牆體（q6-q10 → frame 150-299）──
  const wallScaleY = [0, 1, 2, 3].map(i => {
    const delay = 150 + i * 30 // q6=150, q7=180, q8=210, q9=240
    return safeSpring(frame, fps, delay, SNAPPY)
  })

  // 牆體完成微震（q10 = frame 270）
  const wallShakeY = [0, 1, 2, 3].map(() => {
    if (frame < 270 || frame > 290) return 0
    const shakeFrame = frame - 270
    return interpolate(
      shakeFrame,
      [0, 5, 10, 15, 20],
      [0, 0.05, -0.03, 0.01, 0],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
    )
  })

  // ── Round 3: 門窗（q11-q15 → frame 300-449）──
  const doorScale = safeSpring(frame, fps, 300, BOUNCY)

  const windowScale = [0, 1, 2, 3].map(i => {
    const delay = 330 + i * 30 // q12=330, q13=360, q14=390, q15=420
    return safeSpring(frame, fps, delay, BOUNCY)
  })

  // ── Round 4: 內裝（q16-q20 → frame 450-599）──
  const wallOpacity = [0, 1, 2, 3].map(i => {
    const delay = 450 + i * 25
    const p = safeSpring(frame, fps, delay, SMOOTH)
    return interpolate(p, [0, 1], [0.5, 1])
  })

  const decorationScale = [0, 1].map(i => {
    const delay = 530 + i * 30
    return safeSpring(frame, fps, delay, BOUNCY)
  })

  // ── Round 5: 屋頂（q21-q25 → frame 600-749）──
  const roofSpring = safeSpring(frame, fps, 600, HEAVY)
  const roofY = interpolate(roofSpring, [0, 1], [5, 2.8])
  const roofScale = interpolate(roofSpring, [0, 1], [0.5, 1])

  const chimneySpring = safeSpring(frame, fps, 660, SNAPPY)
  const chimneyY = interpolate(chimneySpring, [0, 1], [5, 3.6])
  const chimneyScale = chimneySpring

  // ── Round 6: 完工（q26-q30 → frame 750-899）──
  const lightScale = [0, 1].map(i => {
    const delay = 750 + i * 15
    return safeSpring(frame, fps, delay, BOUNCY)
  })

  const treeScale = [0, 1].map(i => {
    const delay = 810 + i * 30
    return safeSpring(frame, fps, delay, BOUNCY)
  })

  const treeY = [0, 1].map(i => {
    const delay = 810 + i * 30
    const p = safeSpring(frame, fps, delay, SNAPPY)
    return interpolate(p, [0, 1], [-1, 0])
  })

  // ── 全局 ──
  // 完工後慶祝旋轉
  const celebrationRotation = frame >= 870
    ? (frame - 870) * 0.003
    : 0

  // 相機 Y：從高處逐漸降到平視
  const cameraProgress = interpolate(frame, [0, 899], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const cameraY = interpolate(cameraProgress, [0, 1], [10, 6])

  return {
    groundScale,
    foundationY,
    foundationScale,
    wallScaleY,
    wallShakeY,
    doorScale,
    windowScale,
    wallOpacity,
    decorationScale,
    roofY,
    roofScale,
    chimneyY,
    chimneyScale,
    lightScale,
    treeScale,
    treeY,
    celebrationRotation,
    cameraY,
  }
}
