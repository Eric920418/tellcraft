// ============================================================
// "The Craft" 幀驅動動畫值
// 鍛造主題：核心成長 + 原料碎片吸入 + 能量線 + 軌道環 + 慶祝
// ============================================================

import { spring, interpolate } from 'remotion'
import type { SpringConfig } from 'remotion'
import { SMOOTH, HEAVY, EXTRA_HEAVY } from '../shared/springs'
import { TOTAL_FRAMES } from './constants'

// ── Spring 工具 ──

function safeSpring(frame: number, fps: number, delay: number, config?: SpringConfig): number {
  const f = frame - delay
  if (f < 0) return 0
  return spring({ frame: f, fps, config })
}

function clampInterpolate(
  input: number,
  inputRange: readonly number[],
  outputRange: readonly number[],
): number {
  return interpolate(input, inputRange as number[], outputRange as number[], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

// ── 動畫值介面 ──

export interface CraftAnimationValues {
  // Phase（0-3）
  phase: number

  // 核心
  coreScale: number
  coreEmissiveIntensity: number
  coreRoughness: number
  coreClearcoat: number
  coreRotationSpeed: number
  /** 核心幾何混合：0=球體 → 1=多面體 */
  coreMorphProgress: number

  // 原料碎片
  /** 每個碎片的吸入進度 0→1（1=已被吸入核心） */
  fragmentAbsorb: number[]
  /** 整體漂浮 → 被吸入軌道的過渡 0→1 */
  fragmentOrbitProgress: number

  // 能量線
  /** 每條能量線的繪製進度 0→1 */
  energyLineProgress: number[]
  /** 脈衝強度 0→1 */
  energyPulseIntensity: number

  // 軌道環
  /** 已出現的環數 0-3 */
  ringCount: number
  /** 每個環的 spring 出場 */
  ringScale: number[]
  /** 環透明度 */
  ringOpacity: number

  // 光源
  ambientIntensity: number
  mainLightIntensity: number
  fillLightIntensity: number
  pointLightIntensity: number

  // 相機
  cameraY: number
  cameraRadius: number
  cameraOrbitAngle: number

  // 慶祝
  celebrationActive: boolean
  celebrationProgress: number

  // 整體進度 0→1
  overallProgress: number
}

// ── 主 Hook ──

export function useCraftAnimation(
  frame: number,
  fps: number,
  fragmentCount: number = 30,
): CraftAnimationValues {
  // 整體進度
  const overallProgress = clampInterpolate(frame, [0, TOTAL_FRAMES - 1], [0, 1])

  // Phase 判定
  const phase = frame < 225 ? 0 : frame < 450 ? 1 : frame < 675 ? 2 : 3

  // ══════════════════════════════════════
  // 核心
  // ══════════════════════════════════════

  // Phase 1 緩慢出現 → Phase 4 完整大小
  const coreScale = clampInterpolate(frame, [0, 100, 225, 675, 850], [0, 0.4, 0.6, 0.85, 1.0])

  // emissive 強度：微弱 → 熾熱
  const coreEmissiveIntensity = clampInterpolate(frame, [0, 225, 450, 675, 850], [0.2, 0.5, 0.9, 1.2, 1.5])

  // 粗糙度：非常粗糙 → 光滑
  const coreRoughness = clampInterpolate(frame, [0, 450, 675, 850], [0.9, 0.6, 0.3, 0.1])

  // clearcoat：Phase 3 開始反射
  const coreClearcoat = clampInterpolate(frame, [450, 675, 850], [0, 0.4, 0.8])

  // 旋轉速度：越轉越快
  const coreRotationSpeed = clampInterpolate(frame, [0, 225, 450, 850], [0.001, 0.002, 0.003, 0.005])

  // 球體 → 多面體
  const coreMorphProgress = clampInterpolate(frame, [225, 675], [0, 1])

  // ══════════════════════════════════════
  // 原料碎片
  // ══════════════════════════════════════

  // 每個碎片在自己的 delay frame 被吸入
  const framesPerFragment = fragmentCount > 0 ? Math.floor(TOTAL_FRAMES * 0.6 / fragmentCount) : 30
  const fragmentAbsorb: number[] = []
  for (let i = 0; i < fragmentCount; i++) {
    const absorbStart = i * framesPerFragment
    const absorbEnd = absorbStart + 45 // 1.5 秒吸入動畫
    fragmentAbsorb.push(clampInterpolate(frame, [absorbStart, absorbEnd], [0, 1]))
  }

  // 自由漂浮 → 被吸入軌道
  const fragmentOrbitProgress = clampInterpolate(frame, [225, 450], [0, 1])

  // ══════════════════════════════════════
  // 能量線
  // ══════════════════════════════════════

  // 6 條能量線，Phase 2 開始出現
  const energyLineProgress: number[] = []
  for (let i = 0; i < 6; i++) {
    const lineDelay = 225 + i * 40
    energyLineProgress.push(safeSpring(frame, fps, lineDelay, HEAVY))
  }

  // 脈衝強度（Phase 2+）
  const basePulse = clampInterpolate(frame, [225, 350], [0, 1])
  const pulseWave = Math.sin(frame * 0.08) * 0.3 + 0.7
  const energyPulseIntensity = basePulse * pulseWave

  // ══════════════════════════════════════
  // 軌道環
  // ══════════════════════════════════════

  // 環逐漸出現（Phase 2: 2 環, Phase 3: 3 環）
  const ringCount = frame < 450 ? (frame < 350 ? 0 : frame < 400 ? 1 : 2) : 3

  const ringScale = [
    safeSpring(frame, fps, 350, EXTRA_HEAVY),
    safeSpring(frame, fps, 400, EXTRA_HEAVY),
    safeSpring(frame, fps, 500, EXTRA_HEAVY),
  ]

  const ringOpacity = clampInterpolate(frame, [350, 400, 675, 850], [0, 0.3, 0.5, 0.7])

  // ══════════════════════════════════════
  // 光源
  // ══════════════════════════════════════

  const ambientIntensity = clampInterpolate(frame, [0, 225, 675, 850], [0.15, 0.25, 0.4, 0.6])
  const mainLightIntensity = clampInterpolate(frame, [0, 225, 675, 850], [0.4, 0.6, 0.9, 1.2])
  const fillLightIntensity = clampInterpolate(frame, [0, 225, 675], [0.1, 0.15, 0.2])
  const pointLightIntensity = clampInterpolate(frame, [0, 225, 450, 675, 850], [0.3, 0.6, 1.0, 1.5, 2.0])

  // ══════════════════════════════════════
  // 相機
  // ══════════════════════════════════════

  // Y：略微下降（仰角減少）
  const cameraY = clampInterpolate(frame, [0, TOTAL_FRAMES - 1], [7, 5])

  // 半徑：特寫 → 遠景
  const cameraRadius = clampInterpolate(frame, [0, TOTAL_FRAMES - 1], [8, 12])

  // 持續緩慢軌道旋轉
  const cameraOrbitAngle = frame * 0.0026

  // ══════════════════════════════════════
  // 慶祝
  // ══════════════════════════════════════

  const celebrationActive = frame >= 850
  const celebrationProgress = clampInterpolate(frame, [850, TOTAL_FRAMES - 1], [0, 1])

  return {
    phase,
    coreScale,
    coreEmissiveIntensity,
    coreRoughness,
    coreClearcoat,
    coreRotationSpeed,
    coreMorphProgress,
    fragmentAbsorb,
    fragmentOrbitProgress,
    energyLineProgress,
    energyPulseIntensity,
    ringCount,
    ringScale,
    ringOpacity,
    ambientIntensity,
    mainLightIntensity,
    fillLightIntensity,
    pointLightIntensity,
    cameraY,
    cameraRadius,
    cameraOrbitAngle,
    celebrationActive,
    celebrationProgress,
    overallProgress,
  }
}
