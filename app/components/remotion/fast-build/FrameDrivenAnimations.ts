// ============================================================
// 工廠流水線幀驅動動畫值
// ============================================================

import { spring, interpolate } from 'remotion'
import type { SpringConfig } from 'remotion'
import { SNAPPY, HEAVY, SMOOTH, BOUNCY } from '../shared/springs'
import { STATION_X, PRODUCT_BASE_Y } from './constants'

function safeSpring(frame: number, fps: number, delay: number, config?: SpringConfig): number {
  const f = frame - delay
  if (f < 0) return 0
  return spring({ frame: f, fps, config })
}

export interface FactoryAnimationValues {
  // 傳送帶
  rollerRotation: number

  // 產品位置
  productX: number
  productY: number
  productScale: number

  // 產品材質階段 (0=raw, 1=wireframe, 2=solid, 3=final)
  materialStage: number

  // 工位 1：機械臂
  s1ArmRotation: number
  s1PistonY: number
  s1Active: boolean

  // 工位 2：噴嘴 + 刷子
  s2NozzleY: number
  s2BrushClose: number
  s2Active: boolean

  // 工位 3：夾具 + 壓板
  s3ClampClose: number
  s3PlateY: number
  s3SizeTest: number
  s3Active: boolean

  // 展示台
  displayActive: boolean
  displaySpotlight: number
  displayRotation: number
  displayProductY: number

  // 全局
  idleBob: number
}

export function useFactoryAnimationValues(frame: number, fps: number): FactoryAnimationValues {
  // ── 傳送帶滾筒旋轉 ──
  const rollerRotation = frame * 0.15

  // ── 產品 X 座標（關鍵幀插值）──
  const productX = interpolate(
    frame,
    [0, 29, 30, 50, 50, 75, 80, 129, 130, 150, 150, 200, 210, 229, 230, 250, 250, 270, 270, 285, 285, 300],
    [
      STATION_X.start, STATION_X.start,         // idle
      STATION_X.start, STATION_X.station1,       // slide to s1
      STATION_X.station1, STATION_X.station1,    // processing at s1
      STATION_X.station1, STATION_X.station1,    // finish s1
      STATION_X.station1, STATION_X.station2,    // slide to s2
      STATION_X.station2, STATION_X.station2,    // processing at s2
      STATION_X.station2, STATION_X.station2,    // finish s2
      STATION_X.station2, STATION_X.station3,    // slide to s3
      STATION_X.station3, STATION_X.station3,    // processing at s3
      STATION_X.station3, STATION_X.display,     // slide to display
      STATION_X.display, STATION_X.display,      // on display
    ],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )

  // ── 產品 Y 座標（加工時抬升）──
  const productY = interpolate(
    frame,
    [0, 49, 50, 55, 75, 80, 149, 150, 155, 200, 210, 229, 250, 255, 270, 275, 285, 290, 300],
    [
      PRODUCT_BASE_Y, PRODUCT_BASE_Y,
      PRODUCT_BASE_Y, 1.5, 1.5, PRODUCT_BASE_Y,    // s1 lift
      PRODUCT_BASE_Y, PRODUCT_BASE_Y,
      1.8, 1.8, PRODUCT_BASE_Y,                     // s2 lift
      PRODUCT_BASE_Y,
      1.2, 1.2, 1.2, PRODUCT_BASE_Y,                // s3 lift
      0.4, 0.4,                                      // display pedestal
    ],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )

  // ── 產品縮放（工位 3 RWD 測試）──
  const productScale = interpolate(
    frame,
    [250, 255, 260, 264, 268, 270],
    [1, 0.6, 0.35, 0.6, 1, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )

  // ── 材質階段 ──
  let materialStage = 0
  if (frame >= 75) materialStage = 1
  if (frame >= 200) materialStage = 2
  if (frame >= 270) materialStage = 3

  // ══ 工位 1：機械臂 ══
  const s1Active = frame >= 50 && frame <= 80
  const s1ArmSpring = safeSpring(frame, fps, 52, HEAVY)
  const s1ArmRotation = s1Active
    ? interpolate(s1ArmSpring, [0, 1], [0, -0.8])
    : 0
  const s1PistonY = s1Active
    ? interpolate(frame, [55, 65, 70, 75], [0, -0.8, -0.8, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0

  // ══ 工位 2：噴嘴 + 刷子 ══
  const s2Active = frame >= 150 && frame <= 210
  const s2NozzleY = s2Active
    ? interpolate(frame, [150, 155, 195, 200], [0, -0.6, -0.6, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0
  const s2BrushClose = s2Active
    ? interpolate(frame, [155, 160, 195, 200], [0, 1, 1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0

  // ══ 工位 3：夾具 + 壓板 ══
  const s3Active = frame >= 250 && frame <= 275
  const s3ClampClose = s3Active
    ? interpolate(frame, [250, 255, 268, 272], [0, 1, 1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0
  const s3PlateY = s3Active
    ? interpolate(frame, [252, 258, 265, 270], [0, -0.5, -0.5, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0
  const s3SizeTest = s3Active
    ? interpolate(frame, [255, 260, 264, 268], [1, 0.6, 0.35, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 1

  // ══ 展示台 ══
  const displayActive = frame >= 285
  const displaySpotlight = displayActive
    ? safeSpring(frame, fps, 288, SMOOTH)
    : 0
  const displayRotation = displayActive
    ? (frame - 285) * 0.06
    : 0
  const displayProductY = displayActive
    ? interpolate(
        safeSpring(frame, fps, 285, BOUNCY),
        [0, 1],
        [PRODUCT_BASE_Y, 0.4],
      )
    : PRODUCT_BASE_Y

  // ══ 全局微晃 ══
  const idleBob = Math.sin(frame * 0.08) * 0.02

  return {
    rollerRotation,
    productX,
    productY,
    productScale,
    materialStage,
    s1ArmRotation,
    s1PistonY,
    s1Active,
    s2NozzleY,
    s2BrushClose,
    s2Active,
    s3ClampClose,
    s3PlateY,
    s3SizeTest,
    s3Active,
    displayActive,
    displaySpotlight,
    displayRotation,
    displayProductY,
    idleBob,
  }
}
