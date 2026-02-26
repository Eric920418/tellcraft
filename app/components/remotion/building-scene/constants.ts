// ============================================================
// App Building Scene 常數 — 軟體介面鍛造主題
// ============================================================

export const FPS = 30
export const TOTAL_FRAMES = 900 // 30 秒，每題 30 幀

// ── 色彩系統（深色科技風）──
export const COLORS = {
  // 背景
  bgDark: '#0f1117',
  bgGradientTop: '#1a1d2e',
  bgGradientBottom: '#0a0b10',

  // 平台
  platform: '#1e2030',
  platformEdge: '#2a2d45',
  gridGlow: '#3b82f6',

  // UI 元件
  componentLight: '#e8eaed',
  componentMedium: '#c4c7cc',
  componentDark: '#6b7280',

  // 強調色
  accentBlue: '#3b82f6',
  accentGold: '#f5a623',
  navAccent: '#818cf8',

  // 數據流
  dataLine: '#60a5fa',
  dataNode: '#34d399',

  // 粒子
  sparkBlue: '#93c5fd',
  celebGold: '#fbbf24',
  celebBlue: '#60a5fa',
  celebGreen: '#34d399',
} as const

// ── 6 輪建構階段（每輪 5 題 = 150 幀）──
export const ROUNDS = [
  { name: '基座', startQ: 1, endQ: 5, startFrame: 0, endFrame: 149 },
  { name: '框架', startQ: 6, endQ: 10, startFrame: 150, endFrame: 299 },
  { name: '元件', startQ: 11, endQ: 15, startFrame: 300, endFrame: 449 },
  { name: '數據', startQ: 16, endQ: 20, startFrame: 450, endFrame: 599 },
  { name: '視覺', startQ: 21, endQ: 25, startFrame: 600, endFrame: 749 },
  { name: '上線', startQ: 26, endQ: 30, startFrame: 750, endFrame: 899 },
] as const

export const ROUND_LABELS = ['基座', '框架', '元件', '數據', '視覺', '上線'] as const
export const ROUND_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#34d399', '#f59e0b', '#22c55e'] as const

// ── R1 基座：平台 + 支撐柱位置 ──
export const PILLAR_POSITIONS: [number, number, number][] = [
  [-3.5, -0.4, -2.0],
  [3.5, -0.4, -2.0],
  [-3.5, -0.4, 2.0],
  [3.5, -0.4, 2.0],
]

// ── R2 框架配置 ──
export const FRAME_CONFIG = {
  navBar: { pos: [0, 2.2, 0] as [number, number, number], size: [7.5, 0.4, 0.15] as [number, number, number] },
  sidebar: { pos: [-3.0, 0.5, 0] as [number, number, number], size: [1.5, 3.0, 0.15] as [number, number, number] },
  content: { pos: [0.75, 0.5, 0] as [number, number, number], size: [5.5, 3.0, 0.1] as [number, number, number] },
  footer: { pos: [0, -1.3, 0] as [number, number, number], size: [7.5, 0.3, 0.15] as [number, number, number] },
} as const

// ── R3 元件位置 ──
export const CARD_POSITIONS: [number, number, number][] = [
  [-0.7, 1.0, 0.08],
  [0.9, 1.0, 0.08],
  [2.5, 1.0, 0.08],
]

export const BUTTON_POSITIONS: [number, number, number][] = [
  [0.2, -0.4, 0.08],
  [1.2, -0.4, 0.08],
]

export const SEARCH_BAR_POS: [number, number, number] = [0.75, 1.85, 0.08]

// ── R4 數據連線端點（3 條管道）──
export const DATA_LINE_ENDPOINTS: { from: [number, number, number]; to: [number, number, number] }[] = [
  { from: [-0.7, 0.3, 0.15], to: [0.9, 0.3, 0.15] },
  { from: [0.9, 0.3, 0.15], to: [2.5, 0.3, 0.15] },
  { from: [-3.0, 0.5, 0.1], to: [-0.7, 1.0, 0.15] },
]

export const DATA_NODE_POSITIONS: [number, number, number][] = [
  [0.1, 0.3, 0.2],
  [1.7, 0.3, 0.2],
  [-1.85, 0.75, 0.15],
]

// ── R6 功能圖標位置 ──
export const FEATURE_ICON_POSITIONS: [number, number, number][] = [
  [-0.7, 1.8, 0.15],
  [0.9, 1.8, 0.15],
  [2.5, 1.8, 0.15],
]
