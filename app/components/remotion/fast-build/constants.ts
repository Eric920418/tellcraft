// ============================================================
// Fast Build Composition 常數
// ============================================================

export const FPS = 30
export const TOTAL_FRAMES = 300 // 10 秒

// 顏色
export const BLUEPRINT_BG = '#f0f4f8'
export const GRID_COLOR = 'rgba(59, 130, 246, 0.08)'
export const SCAN_COLOR = 'rgba(59, 130, 246, 0.15)'
export const ACCENT = '#3b82f6'
export const ACCENT_GLOW = 'rgba(59, 130, 246, 0.3)'
export const NODE_BG = '#ffffff'
export const NODE_BORDER = '#e2e8f0'
export const NODE_ACTIVE_BORDER = ACCENT
export const COMPLETED_BG = ACCENT
export const PENDING_TEXT = '#94a3b8'
export const PARTICLE_COLOR = ACCENT
export const SHIMMER_COLOR = 'rgba(255, 255, 255, 0.4)'

// 階段資訊
export const PHASES = [
  { key: 'structure', label: '骨架', index: 0 },
  { key: 'animation', label: '動效', index: 1 },
  { key: 'rwd', label: '適配', index: 2 },
] as const

// 幀佈局
export const PHASE_FRAMES = {
  idle: { start: 0, end: 30 },
  phase1: { start: 30, end: 130 },
  phase2: { start: 130, end: 230 },
  phase3: { start: 230, end: 300 },
} as const

// 節點 spring 激活幀
export const NODE_ACTIVATE_FRAMES = [30, 140, 240] as const
// checkmark 完成幀
export const NODE_COMPLETE_FRAMES = [130, 230, 280] as const
// 連接線粒子開始幀
export const LINE_START_FRAMES = [45, 155] as const

// 進度條目標百分比
export const PROGRESS_TARGETS = [
  { frame: 30, percent: 0 },
  { frame: 130, percent: 33 },
  { frame: 230, percent: 66 },
  { frame: 300, percent: 100 },
] as const

// 步驟文字
export const STEP_TEXTS: Record<string, string[]> = {
  structure: [
    '正在搭建頁面結構...',
    '正在生成 Hero Section...',
    '正在處理導航欄...',
    '正在構建內容區塊...',
    '正在添加互動元素...',
  ],
  animation: [
    '正在添加入場動畫...',
    '正在設定滾動效果...',
    '正在處理過渡動畫...',
    '正在增強視覺回饋...',
  ],
  rwd: [
    '正在優化手機版佈局...',
    '正在調整平板斷點...',
    '正在確保文字可讀性...',
    '正在測試響應式間距...',
  ],
  quality_gate: ['正在執行品質檢查...'],
  complete: ['生成完成！'],
}

// 佈局
export const NODE_SIZE = 64
export const NODE_GAP = 48
export const NODE_RADIUS = 16
