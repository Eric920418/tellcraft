// ============================================================
// 城堡幀驅動動畫值：65+ mesh 的動畫參數
// 每個值由 useCurrentFrame + spring/interpolate 驅動
// ============================================================

import { spring, interpolate } from 'remotion'
import type { SpringConfig } from 'remotion'
import { BOUNCY, SNAPPY, HEAVY, SMOOTH, EXTRA_HEAVY } from '../shared/springs'
import { SKY_CONFIG } from './constants'

function safeSpring(frame: number, fps: number, delay: number, config?: SpringConfig): number {
  const f = frame - delay
  if (f < 0) return 0
  return spring({ frame: f, fps, config })
}

function lerpChannel(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t)
}

function lerpRGB(
  from: [number, number, number],
  to: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    lerpChannel(from[0], to[0], t),
    lerpChannel(from[1], to[1], t),
    lerpChannel(from[2], to[2], t),
  ]
}

export interface CastleAnimationValues {
  // Round 1: 地基
  groundScale: number
  moatOpacity: number
  moatY: number
  foundationY: number[]
  foundationScale: number[]
  foundationCenterScale: number
  foundationSolidOpacity: number

  // Round 2: 城牆
  wallScaleY: number[]
  wallShakeY: number[]
  battlementScale: number[]

  // Round 3: 塔樓
  towerScaleY: number[]
  arrowSlitScale: number[]

  // Round 4: 內裝
  drawbridgeRotationX: number
  gateScaleY: number
  gateArchScale: number
  courtyardOpacity: number
  wellScale: number
  barrelScale: number[]

  // Round 5: 屋頂
  towerRoofY: number[]
  towerRoofScale: number[]
  flagPoleScaleY: number[]
  flagWave: number

  // Round 6: 完工
  windowGlowIntensity: number[]
  treeY: number[]
  treeScale: number[]
  grandFlagPoleScaleY: number
  grandFlagScale: number
  fireworksActive: boolean

  // 全局
  celebrationRotation: number
  cameraY: number
  cameraOrbitAngle: number
  blueprintToSolid: number
  skyTopRGB: [number, number, number]
  skyBottomRGB: [number, number, number]
  ambientIntensity: number
  sunIntensity: number
}

export function useCastleAnimationValues(frame: number, fps: number): CastleAnimationValues {
  // ══════════════════════════════════════
  // Round 1: 地基（q1-q5 → frame 0-149）
  // ══════════════════════════════════════

  // q1: 地面展開
  const groundScale = safeSpring(frame, fps, 0, EXTRA_HEAVY)

  // q2: 護城河填水
  const moatSpring = safeSpring(frame, fps, 30, SMOOTH)
  const moatOpacity = interpolate(moatSpring, [0, 1], [0, 0.6])
  const moatY = interpolate(moatSpring, [0, 1], [-0.5, -0.08])

  // q3-q4: 4 塊地基石升起
  const foundationY = [0, 1, 2, 3].map(i => {
    const delay = 60 + i * 20
    const p = safeSpring(frame, fps, delay, SNAPPY)
    return interpolate(p, [0, 1], [-2, 0.15])
  })

  const foundationScale = [0, 1, 2, 3].map(i => {
    const delay = 60 + i * 20
    return safeSpring(frame, fps, delay, SNAPPY)
  })

  // q5: 中心地基
  const foundationCenterScale = safeSpring(frame, fps, 120, HEAVY)
  const foundationSolidOpacity = safeSpring(frame, fps, 100, SMOOTH)

  // ══════════════════════════════════════
  // Round 2: 城牆（q6-q10 → frame 150-299）
  // ══════════════════════════════════════

  // q6-q9: 4 面城牆升起
  const wallScaleY = [0, 1, 2, 3].map(i => {
    const delay = 150 + i * 30
    return safeSpring(frame, fps, delay, HEAVY)
  })

  // q10: 牆完成微震
  const wallShakeY = [0, 1, 2, 3].map(() => {
    if (frame < 270 || frame > 295) return 0
    const t = frame - 270
    return interpolate(t, [0, 5, 10, 15, 20, 25], [0, 0.06, -0.04, 0.02, -0.01, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  })

  // q10+: 8 個城垛彈出
  const battlementScale = Array.from({ length: 8 }, (_, i) => {
    const delay = 260 + i * 5
    return safeSpring(frame, fps, delay, BOUNCY)
  })

  // ══════════════════════════════════════
  // Round 3: 塔樓（q11-q15 → frame 300-449）
  // ══════════════════════════════════════

  // q11-q14: 4 個角塔生長
  const towerScaleY = [0, 1, 2, 3].map(i => {
    const delay = 300 + i * 30
    return safeSpring(frame, fps, delay, HEAVY)
  })

  // q15: 8 個箭孔
  const arrowSlitScale = Array.from({ length: 8 }, (_, i) => {
    const delay = 420 + i * 4
    return safeSpring(frame, fps, delay, SNAPPY)
  })

  // ══════════════════════════════════════
  // Round 4: 內裝（q16-q20 → frame 450-599）
  // ══════════════════════════════════════

  // q16: 吊橋放下（旋轉）
  const drawbridgeSpring = safeSpring(frame, fps, 450, HEAVY)
  const drawbridgeRotationX = interpolate(drawbridgeSpring, [0, 1], [-Math.PI / 2, 0])

  // q17: 城門升起
  const gateScaleY = safeSpring(frame, fps, 480, SNAPPY)

  // q17: 拱門
  const gateArchScale = safeSpring(frame, fps, 490, BOUNCY)

  // q18: 庭院地面
  const courtyardOpacity = safeSpring(frame, fps, 510, SMOOTH)

  // q19: 水井
  const wellScale = safeSpring(frame, fps, 540, BOUNCY)

  // q20: 2 個木桶
  const barrelScale = [0, 1].map(i => {
    const delay = 570 + i * 15
    return safeSpring(frame, fps, delay, BOUNCY)
  })

  // ══════════════════════════════════════
  // Round 5: 屋頂（q21-q25 → frame 600-749）
  // ══════════════════════════════════════

  // q21-q22: 4 個塔頂落下
  const towerRoofY = [0, 1, 2, 3].map(i => {
    const delay = 600 + i * 20
    const p = safeSpring(frame, fps, delay, HEAVY)
    return interpolate(p, [0, 1], [8, 4.2])
  })

  const towerRoofScale = [0, 1, 2, 3].map(i => {
    const delay = 600 + i * 20
    return safeSpring(frame, fps, delay, HEAVY)
  })

  // q23: 旗桿伸出
  const flagPoleScaleY = [0, 1, 2, 3].map(i => {
    const delay = 660 + i * 10
    return safeSpring(frame, fps, delay, SNAPPY)
  })

  // q24-q25: 旗幟飄動
  const flagWave = frame >= 700 ? Math.sin(frame * 0.15) * 0.2 : 0

  // ══════════════════════════════════════
  // Round 6: 完工（q26-q30 → frame 750-899）
  // ══════════════════════════════════════

  // q26: 8 個窗戶發光
  const windowGlowIntensity = Array.from({ length: 8 }, (_, i) => {
    const delay = 750 + i * 6
    const p = safeSpring(frame, fps, delay, SMOOTH)
    const basePulse = frame >= delay + 15
      ? 0.8 + Math.sin((frame - delay) * 0.08) * 0.2
      : p
    return basePulse
  })

  // q27-q28: 4 棵樹
  const treeY = [0, 1, 2, 3].map(i => {
    const delay = 810 + i * 15
    const p = safeSpring(frame, fps, delay, BOUNCY)
    return interpolate(p, [0, 1], [-1.5, 0])
  })

  const treeScale = [0, 1, 2, 3].map(i => {
    const delay = 810 + i * 15
    return safeSpring(frame, fps, delay, BOUNCY)
  })

  // q29: 中央大旗幟
  const grandFlagPoleScaleY = safeSpring(frame, fps, 860, SNAPPY)
  const grandFlagScale = safeSpring(frame, fps, 870, BOUNCY)

  // q30: 煙火
  const fireworksActive = frame >= 880

  // ══════════════════════════════════════
  // 全局
  // ══════════════════════════════════════

  // 完工慶祝旋轉
  const celebrationRotation = frame >= 880
    ? (frame - 880) * 0.004
    : 0

  // 相機 Y 下降
  const camProgress = interpolate(frame, [0, 899], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const cameraY = interpolate(camProgress, [0, 0.5, 1], [12, 8, 6])

  // 相機環繞角度（完工後慢轉）
  const cameraOrbitAngle = frame >= 880
    ? (frame - 880) * 0.006
    : 0

  // 藍圖→實體（隨建造進度 0→1）
  const blueprintToSolid = interpolate(frame, [0, 850], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // 天空漸變
  let skyTopRGB: [number, number, number]
  let skyBottomRGB: [number, number, number]
  if (frame <= 450) {
    const t = interpolate(frame, [0, 450], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    skyTopRGB = lerpRGB(SKY_CONFIG.dawn.top, SKY_CONFIG.day.top, t)
    skyBottomRGB = lerpRGB(SKY_CONFIG.dawn.bottom, SKY_CONFIG.day.bottom, t)
  } else {
    const t = interpolate(frame, [450, 899], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    skyTopRGB = lerpRGB(SKY_CONFIG.day.top, SKY_CONFIG.dusk.top, t)
    skyBottomRGB = lerpRGB(SKY_CONFIG.day.bottom, SKY_CONFIG.dusk.bottom, t)
  }

  // 光照強度隨時間
  const ambientIntensity = interpolate(frame, [0, 300, 600, 899], [0.3, 0.5, 0.7, 0.9], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const sunIntensity = interpolate(frame, [0, 300, 600, 899], [0.4, 0.7, 0.9, 1.1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return {
    groundScale,
    moatOpacity,
    moatY,
    foundationY,
    foundationScale,
    foundationCenterScale,
    foundationSolidOpacity,
    wallScaleY,
    wallShakeY,
    battlementScale,
    towerScaleY,
    arrowSlitScale,
    drawbridgeRotationX,
    gateScaleY,
    gateArchScale,
    courtyardOpacity,
    wellScale,
    barrelScale,
    towerRoofY,
    towerRoofScale,
    flagPoleScaleY,
    flagWave,
    windowGlowIntensity,
    treeY,
    treeScale,
    grandFlagPoleScaleY,
    grandFlagScale,
    fireworksActive,
    celebrationRotation,
    cameraY,
    cameraOrbitAngle,
    blueprintToSolid,
    skyTopRGB,
    skyBottomRGB,
    ambientIntensity,
    sunIntensity,
  }
}
