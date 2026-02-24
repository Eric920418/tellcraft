// ============================================================
// Remotion 共用 interpolate helpers
// ============================================================

import { interpolate, spring } from 'remotion'
import type { SpringConfig } from 'remotion'

/**
 * 延遲 spring：frame < delay 時返回 0，之後從 0→1 彈入
 */
export function delayedSpring(
  frame: number,
  fps: number,
  delay: number,
  config?: SpringConfig,
): number {
  if (frame < delay) return 0
  return spring({ frame: frame - delay, fps, config })
}

/**
 * 脈衝 glow：frame 驅動的 sin 波，返回 [low, high] 之間的值
 */
export function pulse(
  frame: number,
  speed: number,
  low: number,
  high: number,
): number {
  return interpolate(
    Math.sin(frame * speed),
    [-1, 1],
    [low, high],
  )
}

/**
 * 循環位移（粒子 / shimmer 效果）
 */
export function loopValue(
  frame: number,
  period: number,
  from: number,
  to: number,
): number {
  return interpolate(
    frame % period,
    [0, period],
    [from, to],
  )
}

/**
 * clamp interpolate 快捷
 */
export function clampInterpolate(
  input: number,
  inputRange: [number, number],
  outputRange: [number, number],
): number {
  return interpolate(input, inputRange, outputRange, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}
