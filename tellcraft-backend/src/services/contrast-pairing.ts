/**
 * contrast-pairing.ts — DesignSystem 按鈕對比色 deterministic 派生
 *
 * 治本「按鈕背景色 vs 字色對比度不足」(R9 incident 2026-05-17)
 *
 * 用途：
 *   1. generateCssVariables 前算 buttonContrast pair 注入 DesignSystem
 *   2. deployer contrast-auto-swap 兜底時找最佳 fg candidate
 *
 * 純函式 + fail-soft：
 *   - 無 side effect、無 IO、無 LLM
 *   - 解析失敗（如 var()/null/亂碼）→ return safe fallback 不 throw
 *
 * WCAG AA 標準：
 *   - normal text (< 18pt 或 < 14pt bold) 要 ratio ≥ 4.5
 *   - large text (≥ 18pt 或 ≥ 14pt bold) 要 ratio ≥ 3.0
 *   - UI components (按鈕邊框) 要 ratio ≥ 3.0
 *   - 按鈕內文字 = normal text → 必須 ≥ 4.5
 */

import { hex as wcagHex } from 'wcag-contrast'
import { findClosestTailwindToken, resolveColor } from './tailwind-color-resolver'

const WCAG_AA_NORMAL = 4.5

/**
 * 給定 bg hex 從 candidates 選最佳 fg
 * 演算法：
 *   - 對每個 candidate 算 wcagHex(bg, fg) ratio
 *   - 取 ratio ≥ 4.5 中最高者（safe = true）
 *   - 無 candidate 達標 → 取 ratio 最高者 + safe = false（呼叫端可選 fallback）
 *
 * 預設 candidates：
 *   - #ffffff (white) — 深色 bg 標配
 *   - #0f172a (slate-900) — 淺色 bg 標配
 *   - #fafafa (near-white) — slight off-white 適合純 black bg
 *   - #18181b (zinc-900) — slight off-black
 */
export interface ContrastResult {
  hex: string
  ratio: number
  tailwindToken: string
  safe: boolean
}

const DEFAULT_CANDIDATES = ['#ffffff', '#0f172a', '#fafafa', '#18181b']

export function pickReadableForeground(
  bgHex: string,
  candidates: string[] = DEFAULT_CANDIDATES,
): ContrastResult {
  // Fail-soft：bgHex 無法解析（var() / 亂碼 / null）→ return slate-900 unsafe
  const normalizedBg = normalizeHex(bgHex)
  if (!normalizedBg) {
    return { hex: '#0f172a', ratio: 0, tailwindToken: 'slate-900', safe: false }
  }

  let best: ContrastResult | null = null
  for (const candidate of candidates) {
    const normalizedFg = normalizeHex(candidate)
    if (!normalizedFg) continue
    let ratio = 0
    try {
      ratio = wcagHex(normalizedBg, normalizedFg)
    } catch {
      continue
    }
    const token = findClosestTailwindToken(normalizedFg) || hexToCommonToken(normalizedFg)
    const result: ContrastResult = {
      hex: normalizedFg,
      ratio,
      tailwindToken: token,
      safe: ratio >= WCAG_AA_NORMAL,
    }
    if (!best) {
      best = result
      continue
    }
    // 優先 safe；同 safe 取 ratio 高者
    if (result.safe && !best.safe) {
      best = result
    } else if (result.safe === best.safe && result.ratio > best.ratio) {
      best = result
    }
  }
  return best ?? { hex: '#0f172a', ratio: 0, tailwindToken: 'slate-900', safe: false }
}

/**
 * 對 DesignSystem.colorPalette 每個 base color 派生對比 pair
 *
 * 用於：
 *   - generateCssVariables 注入 --color-on-primary 等 CSS variable
 *   - tailwindExtend.colors 加 on-primary 等 token
 *   - deployer-fixes/contrast-auto-swap 偵測 bg-primary 時知道對應 text-on-primary
 *
 * Fail-soft：base 解析失敗（如 var()）→ 該 key 用 '#0f172a' fallback unsafe
 */
export interface ButtonContrastPairs {
  onPrimary: string
  onSecondary: string
  onAccent: string
  onDestructive?: string
  onSuccess?: string
  onSurface1?: string
  onSurface2?: string
  onSurface3?: string
}

export interface PaletteForPairing {
  primary?: string
  secondary?: string
  accent?: string
  destructive?: string
  success?: string
  surface1?: string
  surface2?: string
  surface3?: string
}

export function deriveButtonPairs(palette: PaletteForPairing): ButtonContrastPairs {
  const pick = (bg: string | undefined): string => {
    if (!bg) return '#0f172a'
    return pickReadableForeground(bg).hex
  }
  const pairs: ButtonContrastPairs = {
    onPrimary: pick(palette.primary),
    onSecondary: pick(palette.secondary),
    onAccent: pick(palette.accent),
  }
  if (palette.destructive) pairs.onDestructive = pick(palette.destructive)
  if (palette.success) pairs.onSuccess = pick(palette.success)
  if (palette.surface1) pairs.onSurface1 = pick(palette.surface1)
  if (palette.surface2) pairs.onSurface2 = pick(palette.surface2)
  if (palette.surface3) pairs.onSurface3 = pick(palette.surface3)
  return pairs
}

/**
 * 給定既有 className 內的 bg + text class，回傳實際 WCAG ratio
 *
 * 用途：deployer contrast-auto-swap 偵測階段判斷是否需要 swap
 * Fail-soft：任一 token 解析失敗 → return null（呼叫端應 skip）
 */
export function computeClassNameContrast(
  bgClass: string,
  textClass: string,
  designSystemPalette?: Record<string, string | undefined>,
): number | null {
  const bgHex = resolveBgFromClass(bgClass, designSystemPalette)
  const fgHex = resolveBgFromClass(textClass.replace(/^text-/, 'bg-'), designSystemPalette)
  if (!bgHex || !fgHex) return null
  try {
    return wcagHex(bgHex, fgHex)
  } catch {
    return null
  }
}

/**
 * 把 bg-* / text-* class 解析成 hex（含 DesignSystem 自訂 token 反查）
 */
export function resolveBgFromClass(
  className: string,
  designSystemPalette?: Record<string, string | undefined>,
): string | null {
  // 先試 Tailwind 標準色（slate-900 / yellow-400 / white 等）
  const standard = resolveColor(className)
  if (standard) return normalizeHex(standard)

  // 再試 DesignSystem custom token (bg-primary / bg-accent / text-on-primary 等)
  if (!designSystemPalette) return null
  const tokenMatch = className.match(/^(?:bg|text|border|ring|fill|stroke)-(.+)$/)
  if (!tokenMatch) return null
  const tokenName = tokenMatch[1]
  // 直接命中（primary / accent / on-primary 等）
  const direct = designSystemPalette[tokenName]
  if (direct) return normalizeHex(direct)
  // 嘗試 camelCase 命中（buttonContrast.onPrimary）
  const camel = kebabToCamel(tokenName)
  const camelHit = designSystemPalette[camel]
  if (camelHit) return normalizeHex(camelHit)
  return null
}

// ──────────────────────────────────────────────────────────
// 內部 helpers
// ──────────────────────────────────────────────────────────

function normalizeHex(input: string): string | null {
  if (!input || typeof input !== 'string') return null
  let h = input.trim().toLowerCase()
  // var() / oklch() / rgb() / hsl() 暫不處理 → null
  if (h.startsWith('var(') || h.startsWith('oklch') || h.startsWith('rgb') || h.startsWith('hsl')) {
    return null
  }
  if (!h.startsWith('#')) h = '#' + h
  // 接受 #rgb / #rgba / #rrggbb / #rrggbbaa
  if (!/^#[0-9a-f]{3,8}$/.test(h)) return null
  // 標準化成 #rrggbb（剝 alpha）
  if (h.length === 4) {
    h = '#' + h.slice(1).split('').map(c => c + c).join('')
  } else if (h.length === 9) {
    h = h.slice(0, 7)
  } else if (h.length === 5) {
    // #rgba → #rrggbb (剝 alpha)
    h = '#' + h.slice(1, 4).split('').map(c => c + c).join('')
  }
  return h
}

function hexToCommonToken(hex: string): string {
  // 常見 fg 候選的直接映射，比 findClosestTailwindToken 更精準
  const map: Record<string, string> = {
    '#ffffff': 'white',
    '#000000': 'black',
    '#fafafa': 'neutral-50',
    '#0f172a': 'slate-900',
    '#18181b': 'zinc-900',
  }
  return map[hex.toLowerCase()] ?? hex
}

function kebabToCamel(s: string): string {
  return s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
}
