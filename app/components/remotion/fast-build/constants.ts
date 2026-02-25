// ============================================================
// 3D 工廠流水線常數
// ============================================================

export const FPS = 30
export const TOTAL_FRAMES = 300 // 10 秒

// ── 顏色 ──
export const FACTORY_COLORS = {
  // 場景
  floor: '#475569',
  floorGrid: '#64748b',

  // 傳送帶
  beltDark: '#334155',
  beltLight: '#475569',
  roller: '#94a3b8',
  frame: '#64748b',

  // 工位
  stationBase: '#334155',
  stationAccent: '#3b82f6',

  // 工位 1 機械臂
  arm: '#94a3b8',
  armTop: '#3b82f6',
  piston: '#60a5fa',

  // 工位 2 噴嘴 + 刷子
  nozzle: '#c084fc',
  brush: '#a78bfa',

  // 工位 3 夾具
  clamp: '#f59e0b',
  plate: '#fbbf24',

  // 產品材質 4 階段
  rawMaterial: '#e2e8f0',
  wireframe: '#60a5fa',
  solidSurface: '#c084fc',
  finalProduct: '#fbbf24',

  // 展示
  pedestal: '#1e293b',
  spotlight: '#fef3c7',

  // 粒子
  spark: '#60a5fa',
  paintDrop: '#c084fc',
  glow: '#fbbf24',
} as const

// ── 幀佈局 ──
export const PHASE_FRAMES = {
  idle: { start: 0, end: 29 },
  phase1: { start: 30, end: 129 },
  phase2: { start: 130, end: 229 },
  phase3: { start: 230, end: 299 },
} as const

// ── 工位 X 座標 ──
export const STATION_X = {
  start: -8,
  station1: -4,
  station2: 0,
  station3: 4,
  display: 7,
} as const

// ── 傳送帶參數 ──
export const BELT = {
  y: 0.6,
  width: 1.2,
  length: 18,
  rollerCount: 20,
  rollerRadius: 0.08,
  rollerSpacing: 0.9,
} as const

// ── 產品基線 Y ──
export const PRODUCT_BASE_Y = 0.88

// ── phase 目標幀（供 FastBuildPlayer seekTo） ──
export const PHASE_TARGET_FRAME: Record<string, number> = {
  structure: 30,
  animation: 130,
  rwd: 230,
  quality_gate: 280,
  complete: 295,
}

// ── phase 長度（供微進度計算） ──
export const PHASE_LENGTHS: Record<string, number> = {
  structure: 100,
  animation: 100,
  rwd: 70,
}
