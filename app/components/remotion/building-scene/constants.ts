// ============================================================
// "The Craft" 鍛造車間常數
// v2：鐵砧 + 錘子 + 熔爐 + 風箱 + 工件 + 火花
// ============================================================

export const FPS = 30
export const TOTAL_FRAMES = 900 // 30 秒

// ── 鍛造車間色彩系統 ──
export const COLORS = {
  // 背景
  bgDark: '#1a0e08',
  bgGradientTop: '#2a1810',
  bgGradientBottom: '#0d0704',

  // 鐵砧
  anvilSteel: '#4A4A4A',
  anvilDark: '#333333',
  woodBrown: '#6B4226',
  woodDark: '#4A2E1A',

  // 熔爐
  brickRed: '#6B2D1A',
  brickDark: '#4A1F12',
  furnaceMouth: '#1A0A05',
  coalOrange: '#FF6B35',
  coalRed: '#CC3300',

  // 工件演進色
  rawGrey: '#5A5A5A',
  hotOrange: '#FF6B35',
  hotGold: '#FFB347',
  finalGold: '#FFD700',
  finalPlatinum: '#E8D5B7',

  // 火花
  sparkOrange: '#FF8C42',
  sparkGold: '#FFD700',
  sparkWhite: '#FFF5E1',

  // 餘燼
  emberAmber: '#D4740E',
  emberDim: '#8B4513',

  // 軌道環
  ringPlatinum: '#E8D5B7',
  ringGold: '#FFD700',

  // 慶祝
  celebGold: '#FFD700',
  celebWhite: '#FFF8DC',

  // 錘子
  hammerSteel: '#555555',
  hammerHandle: '#8B6340',

  // 地面
  floorDark: '#2A1A0E',
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
export const PHASE_FRAME_RANGES = [
  { start: 0, end: 224 },
  { start: 225, end: 449 },
  { start: 450, end: 674 },
  { start: 675, end: 899 },
] as const

// ── 錘子敲打週期（每個 phase 不同節奏）──
export const STRIKE_CYCLES = [50, 35, 25, 60] as const // frames per strike

// ── 風箱呼吸週期 ──
export const BELLOWS_CYCLES = [90, 45, 50, 120] as const // frames per breath

// ── 幾何尺寸 ──
export const GEO = {
  // 鐵砧
  anvilStump: { radiusTop: 0.4, radiusBottom: 0.35, height: 0.7, segments: 8 },
  anvilBody: { width: 1.0, height: 0.35, depth: 0.5 },
  anvilHorn: { radius: 0.15, height: 0.5, segments: 8 },

  // 錘子
  hammerHandle: { radius: 0.04, height: 0.8 },
  hammerHead: { width: 0.25, height: 0.15, depth: 0.15 },

  // 熔爐
  furnaceBody: { width: 1.2, height: 0.8, depth: 0.7 },
  furnaceMouth: { width: 0.6, height: 0.4, depth: 0.1 },
  furnaceGlow: { radius: 0.2, segments: 8 },
  chimney: { radiusTop: 0.1, radiusBottom: 0.12, height: 0.5 },

  // 風箱
  bellowsPlate: { width: 0.4, height: 0.02, depth: 0.25 },
  bellowsNozzle: { radius: 0.04, height: 0.2 },

  // 火花
  sparkSize: { min: 0.02, max: 0.04 },
  sparkCount: { phase1: 6, phase2: 18, phase3: 12, phase4: 5 },

  // 地面
  floor: { width: 8, height: 8 },
} as const

// ── 相機 ──
export const CAMERA_CONFIG = {
  initialY: 3.5,
  finalY: 4.5,
  initialRadius: 6,
  finalRadius: 7,
  orbitSpeed: 0.002,
  initialFov: 40,
  lookAtY: 0.8,
  finalLookAtY: 2.0,
} as const

// ── 場景位置 ──
export const POSITIONS = {
  anvil: [0, 0, 0] as const,
  furnace: [0, 0, -1.8] as const,
  bellows: [-1.0, 0, -1.2] as const,
  hammerPivot: [0.15, 1.6, 0.1] as const,
  workpiece: [0, 0.7, 0] as const,
} as const

// ── 進度指示器 ──
export const PROGRESS_STATUS = {
  working: 'AI 正在鍛造中...',
  idle: '',
} as const

// ── 舊介面相容 ──
export const ROUND_LABELS = PHASE_LABELS
export const ROUND_COLORS = PHASE_COLORS
