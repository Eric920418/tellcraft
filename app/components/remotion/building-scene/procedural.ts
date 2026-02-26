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
  /** 核心 emissive 色（hex） */
  coreEmissive: string
  /** 原料碎片色 */
  fragmentColor: string
  /** 能量線色 */
  energyColor: string
  /** 軌道環色 */
  ringColor: string
  /** 火花色 */
  sparkColor: string
  /** 慶祝爆發色 */
  celebrationColor: string
  /** 色溫 label */
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

// ── 原料碎片配置 ──
export interface FragmentData {
  /** 球面座標偏移 */
  theta: number
  phi: number
  /** 離核心距離 */
  radius: number
  /** 出現延遲 frame（對應答題順序） */
  delay: number
  /** 不規則縮放 */
  scaleX: number
  scaleY: number
  scaleZ: number
  /** 自轉速度 */
  rotationSpeed: number
}

export function generateFragments(seed: number, count: number): FragmentData[] {
  const rng = mulberry32(seed * 3571)
  const fragments: FragmentData[] = []

  for (let i = 0; i < count; i++) {
    fragments.push({
      theta: rng() * Math.PI * 2,
      phi: rng() * Math.PI - Math.PI / 2,
      radius: 3 + rng() * 3,
      delay: i, // 第 i 題時第 i 個碎片被吸入
      scaleX: 0.6 + rng() * 0.8,
      scaleY: 0.6 + rng() * 0.8,
      scaleZ: 0.6 + rng() * 0.8,
      rotationSpeed: 0.003 + rng() * 0.008,
    })
  }

  return fragments
}

// ── 能量線配置 ──
export interface EnergyLineData {
  /** 起始角度 */
  angle: number
  /** 仰角 */
  elevation: number
  /** 長度 */
  length: number
  /** 出現的 phase（0-3） */
  appearPhase: number
}

export function generateEnergyLines(seed: number): EnergyLineData[] {
  const rng = mulberry32(seed * 4649)
  const count = 3 + Math.floor(rng() * 4) // 3-6 條
  const lines: EnergyLineData[] = []

  for (let i = 0; i < count; i++) {
    lines.push({
      angle: (i / count) * Math.PI * 2 + rng() * 0.5,
      elevation: -0.3 + rng() * 0.6,
      length: 2 + rng() * 2,
      appearPhase: i < 2 ? 1 : 2, // 前 2 條 Phase 2 出現，其他 Phase 3
    })
  }

  return lines
}

// ── 軌道環配置 ──
export interface OrbitRingData {
  /** 軸向傾斜 (xyz rotation) */
  tiltX: number
  tiltZ: number
  /** 半徑 */
  radius: number
  /** 出現的 phase */
  appearPhase: number
}

export function generateOrbitRings(seed: number): OrbitRingData[] {
  const rng = mulberry32(seed * 8291)
  const rings: OrbitRingData[] = [
    {
      tiltX: rng() * 0.5 - 0.25,
      tiltZ: rng() * 0.8 - 0.4,
      radius: 2.0,
      appearPhase: 2,
    },
    {
      tiltX: rng() * 0.6 - 0.3,
      tiltZ: rng() * 1.0 - 0.5,
      radius: 2.6,
      appearPhase: 2,
    },
    {
      tiltX: rng() * 0.4 - 0.2,
      tiltZ: rng() * 0.7 - 0.35,
      radius: 3.2,
      appearPhase: 3,
    },
  ]
  return rings
}
