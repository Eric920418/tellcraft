// ============================================================
// "The Craft" 工藝鍛造常數
// ============================================================

export const FPS = 30
export const TOTAL_FRAMES = 900 // 30 秒

// ── 鍛造色彩系統（暖色工藝風）──
export const COLORS = {
  // 背景（暗色鍛爐空間）
  bgDark: '#1a0e08',
  bgGradientTop: '#2a1810',
  bgGradientBottom: '#0d0704',

  // 核心（熔爐）
  coreDimEmissive: '#6B3A2A',     // Phase 1 微弱
  coreHotEmissive: '#FF6B35',     // Phase 2 熔融
  coreBrightEmissive: '#FFB347',  // Phase 3 白熱
  coreGoldEmissive: '#FFD700',    // Phase 4 金色

  // 原料碎片
  fragmentDark: '#5A3D2B',
  fragmentGlow: '#8B5E3C',

  // 能量線
  energyOrange: '#FF6B35',
  energyGold: '#FFB347',

  // 軌道環
  ringPlatinum: '#E8D5B7',
  ringGold: '#FFD700',

  // 火花 / 餘燼
  sparkOrange: '#FF8C42',
  sparkGold: '#FFD700',
  emberAmber: '#D4740E',
  emberDim: '#8B4513',

  // 慶祝
  celebGold: '#FFD700',
  celebWhite: '#FFF8DC',
} as const

// ── 4 個鍛造階段 ──
export const CRAFT_PHASES = [
  { name: '原料', nameEn: 'Raw', startPercent: 0, endPercent: 25 },
  { name: '鍛造', nameEn: 'Forge', startPercent: 25, endPercent: 50 },
  { name: '塑形', nameEn: 'Shape', startPercent: 50, endPercent: 75 },
  { name: '成品', nameEn: 'Complete', startPercent: 75, endPercent: 100 },
] as const

export const PHASE_LABELS = ['原料', '鍛造', '塑形', '成品'] as const
export const PHASE_COLORS = ['#6B3A2A', '#FF6B35', '#FFB347', '#FFD700'] as const

// ── 幀範圍映射 ──
// Phase 0 (Raw):      0-224
// Phase 1 (Forge):    225-449
// Phase 2 (Shape):    450-674
// Phase 3 (Complete): 675-899
export const PHASE_FRAME_RANGES = [
  { start: 0, end: 224 },
  { start: 225, end: 449 },
  { start: 450, end: 674 },
  { start: 675, end: 899 },
] as const

// ── 原料碎片幾何 ──
export const FRAGMENT_BASE_SIZE = 0.2
export const FRAGMENT_COUNT = 30 // 最多 30 個碎片

// ── 能量線 ──
export const ENERGY_LINE_SEGMENTS = 32
export const ENERGY_LINE_RADIUS = 0.03

// ── 軌道環 ──
export const RING_TUBE_RADIUS = 0.02

// ── 相機 ──
export const CAMERA_CONFIG = {
  initialY: 7,
  finalY: 5,
  initialRadius: 8,
  finalRadius: 12,
  orbitSpeed: 0.0026, // 0.15°/frame ≈ 0.0026 rad/frame
  initialFov: 35,
} as const

// ── 進度指示器 ──
export const PROGRESS_STATUS = {
  working: 'AI 正在鍛造中...',
  idle: '',
} as const

// ── 舊介面相容（BuildingPlayer overlay 仍引用）──
export const ROUND_LABELS = PHASE_LABELS
export const ROUND_COLORS = PHASE_COLORS
