// ============================================================
// Seeded 程序化生成：每個專案產出不同的鍛造作品
// 使用 mulberry32 PRNG — 同 seed 永遠產出同結果
// ============================================================

// ── Mulberry32 PRNG ──
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── Hash string → number ──
export function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

// ── 核心最終形狀 ──
export type CoreShape = 'dodecahedron' | 'icosahedron' | 'octahedron' | 'rhombic'
const CORE_SHAPES: CoreShape[] = ['dodecahedron', 'icosahedron', 'octahedron', 'rhombic']

export function selectCoreShape(seed: number): CoreShape {
  const rng = mulberry32(seed * 7919)
  return CORE_SHAPES[Math.floor(rng() * CORE_SHAPES.length)]
}

// ── 色溫偏移 ──
export interface CraftPalette {
  coreEmissive: string
  fragmentColor: string
  energyColor: string
  ringColor: string
  sparkColor: string
  celebrationColor: string
  warmth: 'warm' | 'neutral' | 'cool'
}

const PALETTES: CraftPalette[] = [
  {
    // 琥珀暖金
    coreEmissive: '#FF8C42',
    fragmentColor: '#6B3A2A',
    energyColor: '#FFB347',
    ringColor: '#E8D5B7',
    sparkColor: '#FFD700',
    celebrationColor: '#FFD700',
    warmth: 'warm',
  },
  {
    // 銅火紅
    coreEmissive: '#FF6B35',
    fragmentColor: '#8B4513',
    energyColor: '#FF9966',
    ringColor: '#DEB887',
    sparkColor: '#FFA500',
    celebrationColor: '#FFD700',
    warmth: 'warm',
  },
  {
    // 白金冷調
    coreEmissive: '#C0A878',
    fragmentColor: '#5A4A3A',
    energyColor: '#D4C5A9',
    ringColor: '#C8C0B0',
    sparkColor: '#E8D5B7',
    celebrationColor: '#FFD700',
    warmth: 'cool',
  },
  {
    // 熔岩橙
    coreEmissive: '#FF5722',
    fragmentColor: '#7B3F00',
    energyColor: '#FF7043',
    ringColor: '#FFAB91',
    sparkColor: '#FFCC02',
    celebrationColor: '#FFD700',
    warmth: 'warm',
  },
]

export function selectPalette(seed: number): CraftPalette {
  const rng = mulberry32(seed * 6271)
  return PALETTES[Math.floor(rng() * PALETTES.length)]
}

// ── 軌道環配置 ──
export interface OrbitRingData {
  tiltX: number
  tiltZ: number
  radius: number
  appearPhase: number
}

export function generateOrbitRings(seed: number): OrbitRingData[] {
  const rng = mulberry32(seed * 8291)
  return [
    {
      tiltX: rng() * 0.5 - 0.25,
      tiltZ: rng() * 0.8 - 0.4,
      radius: 0.6,
      appearPhase: 2,
    },
    {
      tiltX: rng() * 0.6 - 0.3,
      tiltZ: rng() * 1.0 - 0.5,
      radius: 0.8,
      appearPhase: 2,
    },
    {
      tiltX: rng() * 0.4 - 0.2,
      tiltZ: rng() * 0.7 - 0.35,
      radius: 1.0,
      appearPhase: 3,
    },
  ]
}

// ── 火花種子配置 ──
export interface SparkSeed {
  /** 爆發角度 */
  angle: number
  /** 垂直起飛角度 */
  elevation: number
  /** 速度倍數 */
  speed: number
  /** 粒子大小 */
  size: number
  /** 色溫偏移 0=橙 1=金 */
  colorBias: number
}

export function generateSparkSeeds(seed: number, count: number): SparkSeed[] {
  const rng = mulberry32(seed * 5147)
  const sparks: SparkSeed[] = []
  for (let i = 0; i < count; i++) {
    sparks.push({
      angle: rng() * Math.PI * 2,
      elevation: 0.3 + rng() * 1.0,
      speed: 0.5 + rng() * 1.5,
      size: 0.02 + rng() * 0.02,
      colorBias: rng(),
    })
  }
  return sparks
}

// ── 煤炭配置 ──
export interface CoalData {
  x: number
  y: number
  z: number
  size: number
  emissiveBias: number // 0=紅 1=橙
}

export function generateCoals(seed: number): CoalData[] {
  const rng = mulberry32(seed * 3389)
  const count = 4 + Math.floor(rng() * 3) // 4-6
  const coals: CoalData[] = []
  for (let i = 0; i < count; i++) {
    coals.push({
      x: (rng() - 0.5) * 0.35,
      y: (rng() - 0.5) * 0.15,
      z: (rng() - 0.5) * 0.2,
      size: 0.06 + rng() * 0.06,
      emissiveBias: rng(),
    })
  }
  return coals
}

// ── 鐵砧風格 ──
export type AnvilStyle = 'standard' | 'wide' | 'narrow'

export function selectAnvilStyle(seed: number): AnvilStyle {
  const rng = mulberry32(seed * 4201)
  const styles: AnvilStyle[] = ['standard', 'wide', 'narrow']
  return styles[Math.floor(rng() * styles.length)]
}

// ── 環境餘燼配置 ──
export interface AmbientEmberData {
  startX: number
  startY: number
  startZ: number
  speed: number
  drift: number
  size: number
}

export function generateAmbientEmbers(seed: number): AmbientEmberData[] {
  const rng = mulberry32(seed * 2903)
  const count = 15
  const embers: AmbientEmberData[] = []
  for (let i = 0; i < count; i++) {
    embers.push({
      startX: (rng() - 0.5) * 3,
      startY: rng() * 0.5,
      startZ: (rng() - 0.5) * 2 - 1.5,
      speed: 0.3 + rng() * 0.5,
      drift: (rng() - 0.5) * 0.5,
      size: 0.015 + rng() * 0.015,
    })
  }
  return embers
}
