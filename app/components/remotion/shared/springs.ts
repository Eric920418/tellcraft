// ============================================================
// Remotion 共用 spring 預設
// ============================================================

import type { SpringConfig } from 'remotion'

/** 平滑無彈跳（微妙 reveal） */
export const SMOOTH: SpringConfig = { mass: 1, damping: 200, stiffness: 100, overshootClamping: false }

/** 快速少彈跳（UI 元素） */
export const SNAPPY: SpringConfig = { mass: 1, damping: 20, stiffness: 200, overshootClamping: false }

/** 明顯彈跳（活潑入場） */
export const BOUNCY: SpringConfig = { mass: 1, damping: 8, stiffness: 100, overshootClamping: false }

/** 厚重慢速微彈（大型物件） */
export const HEAVY: SpringConfig = { mass: 2, damping: 15, stiffness: 80, overshootClamping: false }

/** 超厚重（城堡基座、工廠底座） */
export const EXTRA_HEAVY: SpringConfig = { mass: 3, damping: 20, stiffness: 60, overshootClamping: false }

/** 精準無彈跳（進度條 / 精確定位） */
export const PRECISE: SpringConfig = { mass: 1, damping: 200, stiffness: 100, overshootClamping: true }
