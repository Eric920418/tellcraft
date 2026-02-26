// ============================================================
// "The Craft" v2 幀驅動動畫值
// 鍛造車間：錘子敲打 + 風箱呼吸 + 工件演進 + 火花爆發
// ============================================================

import { interpolate } from 'remotion'
import { TOTAL_FRAMES, STRIKE_CYCLES, BELLOWS_CYCLES } from './constants'

// ── 工具函數 ──

function clamp(input: number, inputRange: readonly number[], outputRange: readonly number[]): number {
  return interpolate(input, inputRange as number[], outputRange as number[], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

// ── 動畫值介面 ──

export interface CraftAnimationValues {
  phase: number              // 0-3
  overallProgress: number    // 0→1

  // 錘子
  hammerAngle: number        // rotation-z：-0.3（舉起）→ 0.8（落下）
  hammerActive: boolean      // Phase 4 後期停止
  isImpact: boolean          // 錘子觸底瞬間（觸發火花）
  strikeCycle: number        // 當前敲打週期位置 0→1

  // 風箱
  bellowsAngle: number       // 上下板 rotation-x 開合
  bellowsSpeed: number       // 1=正常

  // 熔爐
  furnaceGlow: number        // 內部 emissive 強度
  coalEmissive: number       // 煤炭 emissive

  // 工件
  workpieceVisible: boolean  // Phase 1 中段出現
  workpieceScale: number     // spring 入場
  workpieceMorph: number     // 0（粗糙）→ 1（多面體）
  workpieceEmissive: number  // 0→5.0
  workpieceRoughness: number // 0.9→0.05
  workpieceClearcoat: number // 0→1.0
  workpieceRise: number      // Phase 4 末段升起 Y offset
  workpieceDisplayRotation: number  // Phase 4 展示旋轉
  workpieceShake: number     // 敲擊時微震

  // 光環（Phase 3+）
  ringCount: number
  ringScale: number[]
  ringOpacity: number

  // 火花
  sparkBurst: boolean
  sparkProgress: number      // 衰減 0→1
  sparkIntensity: number     // 每次爆發的粒子數量倍數

  // 環境餘燼
  ambientEmberOpacity: number

  // 光源
  ambientIntensity: number
  mainLightIntensity: number
  spotLightIntensity: number
  pointLightIntensity: number

  // Bloom
  bloomIntensity: number

  // 相機
  cameraY: number
  cameraRadius: number
  cameraOrbitAngle: number
  cameraLookAtY: number

  // 慶祝
  celebrationActive: boolean
  celebrationProgress: number
}

// ── 錘子敲打計算 ──

function getStrikeCycle(frame: number, phase: number): number {
  const cycle = STRIKE_CYCLES[phase] ?? 50
  return (frame % cycle) / cycle
}

function getHammerAngle(sc: number): number {
  // 0→0.3: 舉起靜止 (-0.3)
  // 0.3→0.5: 快速落下 (-0.3→0.8)
  // 0.5→0.6: 觸底彈跳 (0.8→0.6)
  // 0.6→1.0: 緩慢抬起 (0.6→-0.3)
  if (sc < 0.3) return -0.3
  if (sc < 0.5) {
    const t = (sc - 0.3) / 0.2
    return -0.3 + 1.1 * t * t // easeIn quadratic
  }
  if (sc < 0.6) {
    const t = (sc - 0.5) / 0.1
    return 0.8 - 0.2 * t
  }
  const t = (sc - 0.6) / 0.4
  const eased = 1 - (1 - t) * (1 - t) // easeOut quadratic
  return 0.6 - 0.9 * eased
}

// ── 風箱呼吸 ──

function getBellowsAngle(frame: number, phase: number): number {
  const cycle = BELLOWS_CYCLES[phase] ?? 90
  const t = (frame % cycle) / cycle
  // sin 波呼吸：0→最大張開→閉合
  return Math.sin(t * Math.PI * 2) * 0.25
}

// ── 主 Hook ──

export function useCraftAnimation(frame: number, fps: number): CraftAnimationValues {
  void fps // remotion fps 可用但此處用幀驅動

  const overallProgress = clamp(frame, [0, TOTAL_FRAMES - 1], [0, 1])
  const phase = frame < 225 ? 0 : frame < 450 ? 1 : frame < 675 ? 2 : 3

  // ══════════════════════════════════════
  // 錘子
  // ══════════════════════════════════════

  // Phase 1: frame 90+ 開始慢敲
  // Phase 4: frame 750 後停止
  const hammerActive = frame >= 90 && frame < 750
  const sc = hammerActive ? getStrikeCycle(frame, phase) : 0
  const hammerAngle = hammerActive ? getHammerAngle(sc) : -0.3
  const isImpact = hammerActive && sc > 0.48 && sc < 0.55

  // 敲擊震動（工件微震）
  const workpieceShake = isImpact ? (Math.sin(frame * 30) * 0.03) : 0

  // ══════════════════════════════════════
  // 風箱
  // ══════════════════════════════════════

  // Phase 1 frame 30+ 開始
  const bellowsActive = frame >= 30
  const bellowsAngle = bellowsActive ? getBellowsAngle(frame, phase) : 0
  const bellowsSpeed = phase === 0 ? 0.5 : phase === 1 ? 1.5 : phase === 2 ? 1.0 : 0.3

  // ══════════════════════════════════════
  // 熔爐
  // ══════════════════════════════════════

  const furnaceGlow = clamp(frame, [0, 60, 225, 450, 675], [0.3, 0.5, 1.5, 2.5, 3.0])
  const coalEmissive = clamp(frame, [0, 60, 225, 450], [0.2, 0.3, 1.2, 2.0])

  // 風箱鼓風時增強
  const bellowsBoost = bellowsActive ? Math.max(0, Math.sin((frame % (BELLOWS_CYCLES[phase] ?? 90)) / (BELLOWS_CYCLES[phase] ?? 90) * Math.PI * 2)) * 0.5 : 0
  const furnaceGlowFinal = furnaceGlow + bellowsBoost

  // ══════════════════════════════════════
  // 工件
  // ══════════════════════════════════════

  const workpieceVisible = frame >= 60
  const workpieceScale = clamp(frame, [60, 100], [0, 1])
  const workpieceMorph = clamp(frame, [450, 650], [0, 1])
  const workpieceEmissive = clamp(frame, [60, 225, 450, 675, 850], [0, 0.3, 1.5, 3.0, 5.0])
  const workpieceRoughness = clamp(frame, [60, 300, 550, 800], [0.9, 0.7, 0.3, 0.05])
  const workpieceClearcoat = clamp(frame, [550, 700, 850], [0, 0.5, 1.0])

  // Phase 4: frame 800+ 升起 + 旋轉
  const workpieceRise = clamp(frame, [800, 870], [0, 1.5])
  const workpieceDisplayRotation = frame >= 800 ? (frame - 800) * 0.02 : 0

  // ══════════════════════════════════════
  // 軌道環
  // ══════════════════════════════════════

  const ringCount = frame < 550 ? 0 : frame < 600 ? 1 : frame < 650 ? 2 : 3
  const ringScale = [
    clamp(frame, [550, 580], [0, 1]),
    clamp(frame, [600, 630], [0, 1]),
    clamp(frame, [650, 680], [0, 1]),
  ]
  const ringOpacity = clamp(frame, [550, 600, 800, 870], [0, 0.4, 0.6, 0.8])

  // ══════════════════════════════════════
  // 火花
  // ══════════════════════════════════════

  const sparkBurst = isImpact
  // 火花在每次敲打週期的 0.48-0.55 區間爆發
  const sparkProgress = hammerActive ? clamp(sc, [0.48, 0.9], [0, 1]) : 0
  // 不同 phase 不同強度
  const sparkIntensity = phase === 0 ? 0.4 : phase === 1 ? 1.0 : phase === 2 ? 0.7 : 0.2

  // ══════════════════════════════════════
  // 環境餘燼
  // ══════════════════════════════════════

  const ambientEmberOpacity = clamp(frame, [0, 60], [0, 0.6])

  // ══════════════════════════════════════
  // 光源
  // ══════════════════════════════════════

  const ambientIntensity = clamp(frame, [0, 225, 675, 850], [0.08, 0.12, 0.2, 0.35])
  const mainLightIntensity = clamp(frame, [0, 225, 675, 850], [0.3, 0.5, 0.8, 1.2])
  const spotLightIntensity = clamp(frame, [0, 225, 450, 675], [0.2, 0.5, 1.0, 1.5])
  const pointLightIntensity = clamp(frame, [60, 225, 450, 675, 850], [0, 0.5, 1.5, 3.0, 5.0])

  // ══════════════════════════════════════
  // Bloom
  // ══════════════════════════════════════

  const bloomIntensity = clamp(frame, [0, 225, 450, 675, 850], [0.6, 0.8, 1.2, 1.8, 2.5])

  // ══════════════════════════════════════
  // 相機
  // ══════════════════════════════════════

  const cameraY = clamp(frame, [0, TOTAL_FRAMES - 1], [3.5, 4.5])
  const cameraRadius = clamp(frame, [0, TOTAL_FRAMES - 1], [6, 7])
  const cameraOrbitAngle = frame * 0.002
  const cameraLookAtY = clamp(frame, [0, 800, 870], [0.8, 0.8, 2.0])

  // ══════════════════════════════════════
  // 慶祝
  // ══════════════════════════════════════

  const celebrationActive = frame >= 850
  const celebrationProgress = clamp(frame, [850, TOTAL_FRAMES - 1], [0, 1])

  return {
    phase,
    overallProgress,
    hammerAngle,
    hammerActive,
    isImpact,
    strikeCycle: sc,
    bellowsAngle,
    bellowsSpeed,
    furnaceGlow: furnaceGlowFinal,
    coalEmissive,
    workpieceVisible,
    workpieceScale,
    workpieceMorph,
    workpieceEmissive,
    workpieceRoughness,
    workpieceClearcoat,
    workpieceRise,
    workpieceDisplayRotation,
    workpieceShake,
    ringCount,
    ringScale,
    ringOpacity,
    sparkBurst,
    sparkProgress,
    sparkIntensity,
    ambientEmberOpacity,
    ambientIntensity,
    mainLightIntensity,
    spotLightIntensity,
    pointLightIntensity,
    bloomIntensity,
    cameraY,
    cameraRadius,
    cameraOrbitAngle,
    cameraLookAtY,
    celebrationActive,
    celebrationProgress,
  }
}
