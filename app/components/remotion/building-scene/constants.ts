// ============================================================
// Building Scene Composition 常數
// ============================================================

export const FPS = 30
export const TOTAL_FRAMES = 900 // 30 秒，每題 30 幀

// 材質顏色
export const COLORS = {
  blueprint: '#4a90d9',
  wall: '#e2e8f0',
  roof: '#f59e0b',
  door: '#8b5cf6',
  window: '#93c5fd',
  ground: '#86efac',
  treeGreen: '#22c55e',
  treeTrunk: '#92400e',
  light: '#facc15',
  chimney: '#78716c',
  decoration: '#dc2626',
} as const

// 6 輪建造階段（每輪 5 題 = 150 幀）
export const ROUNDS = [
  { name: '地基', startQ: 1, endQ: 5, startFrame: 0, endFrame: 149 },
  { name: '牆體', startQ: 6, endQ: 10, startFrame: 150, endFrame: 299 },
  { name: '門窗', startQ: 11, endQ: 15, startFrame: 300, endFrame: 449 },
  { name: '內裝', startQ: 16, endQ: 20, startFrame: 450, endFrame: 599 },
  { name: '屋頂', startQ: 21, endQ: 25, startFrame: 600, endFrame: 749 },
  { name: '完工', startQ: 26, endQ: 30, startFrame: 750, endFrame: 899 },
] as const

export const ROUND_LABELS = ['地基', '牆體', '門窗', '內裝', '屋頂', '完工'] as const
export const ROUND_COLORS = ['#94a3b8', '#64748b', '#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e'] as const

// 地基位置
export const FOUNDATION_POSITIONS: [number, number, number][] = [
  [-1.2, 0, -1.2],
  [1.2, 0, -1.2],
  [-1.2, 0, 1.2],
  [1.2, 0, 1.2],
]

// 牆壁配置
export const WALL_CONFIGS = [
  { pos: [0, 1, -1.5] as [number, number, number], size: [3, 2, 0.15] as [number, number, number] },
  { pos: [0, 1, 1.5] as [number, number, number], size: [3, 2, 0.15] as [number, number, number] },
  { pos: [-1.5, 1, 0] as [number, number, number], size: [0.15, 2, 3] as [number, number, number] },
  { pos: [1.5, 1, 0] as [number, number, number], size: [0.15, 2, 3] as [number, number, number] },
]

// 窗戶位置
export const WINDOW_POSITIONS: [number, number, number][] = [
  [-0.8, 1.3, -1.55],
  [0.8, 1.3, -1.55],
  [-1.55, 1.3, 0.5],
  [1.55, 1.3, 0.5],
]

// 裝飾位置
export const DECORATION_POSITIONS: [number, number, number][] = [
  [-0.8, 0.15, -1.7],
  [0.8, 0.15, -1.7],
]

// 燈光位置
export const LIGHT_POSITIONS: [number, number, number][] = [
  [0, 2.3, -1.55],
  [-1.55, 2.3, 0],
]

// 樹木位置
export const TREE_POSITIONS: [number, number, number][] = [
  [3, 0, 2],
  [-3, 0, -2],
]
