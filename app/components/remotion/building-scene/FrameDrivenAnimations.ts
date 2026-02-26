// ============================================================
// App 幀驅動動畫值：軟體介面鍛造主題
// ============================================================

import { spring, interpolate } from 'remotion'
import type { SpringConfig } from 'remotion'
import { BOUNCY, SNAPPY, HEAVY, SMOOTH, EXTRA_HEAVY } from '../shared/springs'

function safeSpring(frame: number, fps: number, delay: number, config?: SpringConfig): number {
  const f = frame - delay
  if (f < 0) return 0
  return spring({ frame: f, fps, config })
}

export interface AppAnimationValues {
  // R1: 基座
  platformScale: number
  platformGlowOpacity: number
  pillarScaleY: number[]
  gridOpacity: number

  // R2: 框架
  navBarScaleX: number
  sidebarScaleY: number
  contentAreaScale: number
  footerScaleX: number
  frameShakeY: number

  // R3: 元件
  cardScale: number[]
  buttonScale: number[]
  searchBarScaleX: number

  // R4: 數據層
  dataLineProgress: number[]
  dataNodeScale: number[]
  apiIconScale: number

  // R5: 視覺
  colorFillProgress: number
  glossProgress: number
  lightBoost: number

  // R6: 上線
  iconScale: number[]
  launchPulse: number
  celebrationActive: boolean

  // 全局
  ghostToSolid: number
  cameraY: number
  cameraOrbitAngle: number
  ambientIntensity: number
  mainLightIntensity: number
  celebrationRotation: number
}

export function useAppAnimationValues(frame: number, fps: number): AppAnimationValues {
  // ══════════════════════════════════════
  // Round 1: 基座（q1-q5 → frame 0-149）
  // ══════════════════════════════════════

  // q1: 圓角平台浮現
  const platformScale = safeSpring(frame, fps, 0, EXTRA_HEAVY)

  // q2: 平台底部光暈
  const glowSpring = safeSpring(frame, fps, 30, SMOOTH)
  const platformGlowOpacity = interpolate(glowSpring, [0, 1], [0, 0.6])

  // q3-q4: 4 個角落支撐柱
  const pillarScaleY = [0, 1, 2, 3].map(i => {
    const delay = 60 + i * 20
    return safeSpring(frame, fps, delay, SNAPPY)
  })

  // q5: 底部網格線
  const gridOpacity = safeSpring(frame, fps, 120, SMOOTH)

  // ══════════════════════════════════════
  // Round 2: 框架（q6-q10 → frame 150-299）
  // ══════════════════════════════════════

  // q6: 頂部導航列
  const navBarScaleX = safeSpring(frame, fps, 150, HEAVY)

  // q7: 側邊欄
  const sidebarScaleY = safeSpring(frame, fps, 180, HEAVY)

  // q8: 主內容區域
  const contentAreaScale = safeSpring(frame, fps, 210, HEAVY)

  // q9: 底部欄
  const footerScaleX = safeSpring(frame, fps, 240, SNAPPY)

  // q10: 框架完成微震
  let frameShakeY = 0
  if (frame >= 270 && frame <= 295) {
    const t = frame - 270
    frameShakeY = interpolate(t, [0, 5, 10, 15, 20, 25], [0, 0.06, -0.04, 0.02, -0.01, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  }

  // ══════════════════════════════════════
  // Round 3: 元件（q11-q15 → frame 300-449）
  // ══════════════════════════════════════

  // q11-q13: 3 張卡片
  const cardScale = [0, 1, 2].map(i => {
    const delay = 300 + i * 30
    return safeSpring(frame, fps, delay, BOUNCY)
  })

  // q14: 按鈕組
  const buttonScale = [0, 1].map(i => {
    const delay = 390 + i * 15
    return safeSpring(frame, fps, delay, BOUNCY)
  })

  // q15: 搜尋框
  const searchBarScaleX = safeSpring(frame, fps, 420, SNAPPY)

  // ══════════════════════════════════════
  // Round 4: 數據層（q16-q20 → frame 450-599）
  // ══════════════════════════════════════

  // q16-q18: 3 條連線
  const dataLineProgress = [0, 1, 2].map(i => {
    const delay = 450 + i * 40
    const p = safeSpring(frame, fps, delay, SMOOTH)
    return interpolate(p, [0, 1], [0, 1])
  })

  // q19: 3 個數據節點
  const dataNodeScale = [0, 1, 2].map(i => {
    const delay = 540 + i * 15
    return safeSpring(frame, fps, delay, BOUNCY)
  })

  // q20: API 圖標
  const apiIconScale = safeSpring(frame, fps, 580, BOUNCY)

  // ══════════════════════════════════════
  // Round 5: 視覺（q21-q25 → frame 600-749）
  // ══════════════════════════════════════

  // q21-q25: 全局材質變化（漸進式）
  const colorFillProgress = interpolate(frame, [600, 749], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const glossProgress = interpolate(frame, [630, 749], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const lightBoost = interpolate(frame, [600, 749], [0, 0.4], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // ══════════════════════════════════════
  // Round 6: 上線（q26-q30 → frame 750-899）
  // ══════════════════════════════════════

  // q26-q28: 功能圖標
  const iconScale = [0, 1, 2].map(i => {
    const delay = 750 + i * 25
    return safeSpring(frame, fps, delay, BOUNCY)
  })

  // q29: 發光脈衝
  let launchPulse = 0
  if (frame >= 870) {
    launchPulse = interpolate(
      Math.sin((frame - 870) * 0.15),
      [-1, 1],
      [0.2, 1],
    )
  }

  // q30: 慶祝粒子
  const celebrationActive = frame >= 880

  // ══════════════════════════════════════
  // 全局
  // ══════════════════════════════════════

  // 幽靈→實體（跨整個 850 幀）
  const ghostToSolid = interpolate(frame, [0, 850], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // 相機 Y（俯瞰→平視）
  const camProgress = interpolate(frame, [0, 899], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const cameraY = interpolate(camProgress, [0, 0.5, 1], [10, 7, 5.5])

  // 完工後緩速環繞
  const cameraOrbitAngle = frame >= 880
    ? (frame - 880) * 0.005
    : 0

  // 完工慶祝旋轉
  const celebrationRotation = frame >= 880
    ? (frame - 880) * 0.003
    : 0

  // 光照
  const ambientIntensity = interpolate(frame, [0, 300, 600, 899], [0.3, 0.4, 0.6, 0.8], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const mainLightIntensity = interpolate(frame, [0, 300, 600, 899], [0.5, 0.7, 1.0, 1.2], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return {
    platformScale,
    platformGlowOpacity,
    pillarScaleY,
    gridOpacity,
    navBarScaleX,
    sidebarScaleY,
    contentAreaScale,
    footerScaleX,
    frameShakeY,
    cardScale,
    buttonScale,
    searchBarScaleX,
    dataLineProgress,
    dataNodeScale,
    apiIconScale,
    colorFillProgress,
    glossProgress,
    lightBoost,
    iconScale,
    launchPulse,
    celebrationActive,
    ghostToSolid,
    cameraY,
    cameraOrbitAngle,
    ambientIntensity,
    mainLightIntensity,
    celebrationRotation,
  }
}
