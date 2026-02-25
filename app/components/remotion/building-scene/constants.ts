// ============================================================
// Castle Building Scene 常數
// ============================================================

export const FPS = 30
export const TOTAL_FRAMES = 900 // 30 秒，每題 30 幀

// ── 城堡顏色 ──
export const COLORS = {
  // 藍圖線框
  blueprint: '#4a90d9',
  blueprintGlow: '#60a5fa',

  // 石材
  stoneLight: '#d4c8b0',
  stoneMedium: '#b8a88a',
  stoneDark: '#8c7a62',

  // 護城河
  moatWater: '#3b82f6',
  moatDeep: '#1d4ed8',

  // 城牆 / 塔
  wallGray: '#c8bca6',
  towerGray: '#9e917b',
  battlementGray: '#a69882',

  // 屋頂
  roofRed: '#b45309',
  roofDark: '#92400e',

  // 木材
  woodLight: '#d97706',
  woodDark: '#92400e',

  // 旗幟
  flagRed: '#dc2626',
  flagGold: '#f59e0b',

  // 環境
  ground: '#7cb342',
  groundDark: '#558b2f',
  treeGreen: '#2e7d32',
  treePine: '#1b5e20',
  treeTrunk: '#5d4037',

  // 發光
  windowGlow: '#fbbf24',
  torchGlow: '#f97316',
  fireworkRed: '#ef4444',
  fireworkGold: '#fbbf24',
  fireworkBlue: '#3b82f6',

  // 施工粒子
  sparkGold: '#fcd34d',
} as const

// ── 6 輪建造階段（每輪 5 題 = 150 幀）──
export const ROUNDS = [
  { name: '地基', startQ: 1, endQ: 5, startFrame: 0, endFrame: 149 },
  { name: '城牆', startQ: 6, endQ: 10, startFrame: 150, endFrame: 299 },
  { name: '塔樓', startQ: 11, endQ: 15, startFrame: 300, endFrame: 449 },
  { name: '內裝', startQ: 16, endQ: 20, startFrame: 450, endFrame: 599 },
  { name: '屋頂', startQ: 21, endQ: 25, startFrame: 600, endFrame: 749 },
  { name: '完工', startQ: 26, endQ: 30, startFrame: 750, endFrame: 899 },
] as const

export const ROUND_LABELS = ['地基', '城牆', '塔樓', '內裝', '屋頂', '完工'] as const
export const ROUND_COLORS = ['#78909c', '#607d8b', '#5c6bc0', '#ab47bc', '#f59e0b', '#43a047'] as const

// ── 地基石塊位置（4 個角落）──
export const FOUNDATION_POSITIONS: [number, number, number][] = [
  [-2.0, 0, -2.0],
  [2.0, 0, -2.0],
  [-2.0, 0, 2.0],
  [2.0, 0, 2.0],
]

// ── 城牆配置（4 面）──
export const WALL_CONFIGS = [
  { pos: [0, 1.2, -2.5] as [number, number, number], size: [5.2, 2.4, 0.3] as [number, number, number] },  // 前
  { pos: [0, 1.2, 2.5] as [number, number, number], size: [5.2, 2.4, 0.3] as [number, number, number] },   // 後
  { pos: [-2.5, 1.2, 0] as [number, number, number], size: [0.3, 2.4, 5.2] as [number, number, number] },  // 左
  { pos: [2.5, 1.2, 0] as [number, number, number], size: [0.3, 2.4, 5.2] as [number, number, number] },   // 右
]

// ── 城垛位置（每面牆 2 個 = 8 個）──
export const BATTLEMENT_POSITIONS: [number, number, number][] = [
  // 前牆
  [-1.5, 2.6, -2.5], [1.5, 2.6, -2.5],
  // 後牆
  [-1.5, 2.6, 2.5], [1.5, 2.6, 2.5],
  // 左牆
  [-2.5, 2.6, -1.5], [-2.5, 2.6, 1.5],
  // 右牆
  [2.5, 2.6, -1.5], [2.5, 2.6, 1.5],
]

// ── 角塔位置（4 個角）──
export const TOWER_POSITIONS: [number, number, number][] = [
  [-2.5, 0, -2.5],
  [2.5, 0, -2.5],
  [-2.5, 0, 2.5],
  [2.5, 0, 2.5],
]

// ── 箭孔位置（每塔 2 個 = 8 個）──
export const ARROW_SLIT_POSITIONS: { pos: [number, number, number]; rotY: number }[] = [
  // 塔 0 (左前)
  { pos: [-2.5, 1.8, -3.15], rotY: 0 },
  { pos: [-3.15, 1.8, -2.5], rotY: Math.PI / 2 },
  // 塔 1 (右前)
  { pos: [2.5, 1.8, -3.15], rotY: 0 },
  { pos: [3.15, 1.8, -2.5], rotY: Math.PI / 2 },
  // 塔 2 (左後)
  { pos: [-2.5, 1.8, 3.15], rotY: 0 },
  { pos: [-3.15, 1.8, 2.5], rotY: Math.PI / 2 },
  // 塔 3 (右後)
  { pos: [2.5, 1.8, 3.15], rotY: 0 },
  { pos: [3.15, 1.8, 2.5], rotY: Math.PI / 2 },
]

// ── 塔頂位置（4 個角塔頂部）──
export const TOWER_ROOF_POSITIONS: [number, number, number][] = [
  [-2.5, 4.2, -2.5],
  [2.5, 4.2, -2.5],
  [-2.5, 4.2, 2.5],
  [2.5, 4.2, 2.5],
]

// ── 旗桿位置（4 個角塔頂 + 1 個中央）──
export const FLAG_POLE_POSITIONS: [number, number, number][] = [
  [-2.5, 4.8, -2.5],
  [2.5, 4.8, -2.5],
  [-2.5, 4.8, 2.5],
  [2.5, 4.8, 2.5],
]

// ── 窗戶位置（8 個，2 面各 4 個）──
export const WINDOW_POSITIONS: [number, number, number][] = [
  // 前牆
  [-1.2, 1.6, -2.55], [0, 1.6, -2.55], [1.2, 1.6, -2.55], [0, 0.8, -2.55],
  // 後牆
  [-1.2, 1.6, 2.55], [0, 1.6, 2.55], [1.2, 1.6, 2.55], [0, 0.8, 2.55],
]

// ── 樹木位置（4 棵）──
export const TREE_POSITIONS: [number, number, number][] = [
  [4.5, 0, 3],
  [-4.5, 0, -3],
  [4, 0, -4],
  [-4, 0, 4],
]

// ── 天空色溫配置 ──
export const SKY_CONFIG = {
  dawn: { top: [0x1e, 0x3a, 0x5f] as [number, number, number], bottom: [0x4a, 0x60, 0x8a] as [number, number, number] },
  day: { top: [0x87, 0xce, 0xeb] as [number, number, number], bottom: [0xb0, 0xe0, 0xf0] as [number, number, number] },
  dusk: { top: [0xff, 0x8c, 0x42] as [number, number, number], bottom: [0xff, 0xcc, 0x80] as [number, number, number] },
} as const
