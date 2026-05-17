/**
 * contrast-auto-swap.ts — Deployer post-process 按鈕對比度兜底
 *
 * R9 治本 Layer 3（100% 保證）
 *
 * 邏輯：
 *   1. 掃描所有 file 找含 <button|<Button|role="button"|<a class*="btn|cta|button|link-button" 的 JSX
 *   2. 從該 element className 抽 bg-* + text-* class
 *   3. 算 wcag-contrast ratio（含 DS palette 自訂 token 反查）
 *   4. ratio < 4.5 → swap text class 為對應 on-* token（有 buttonContrast）或 pickReadableForeground 結果
 *   5. swap 後仍 < 4.5 → 標 unsafe fallback（後續 commit 加 ring 處理）
 *
 * 設計原則：
 *   - 只動 button context className，普通 <div className="bg-yellow-400 text-white"> 不動（避免誤殺）
 *   - 失敗 → skip + 記 telemetry skipped event（不阻塞 deploy）
 *   - idempotent：跑兩次第二次 0 swap（swap 後 ratio 已 ≥ 4.5）
 */

import { hex as wcagHex } from 'wcag-contrast'
import {
  pickReadableForeground,
  resolveBgFromClass,
} from '../contrast-pairing'
import { extractBgAndText, isLargeText } from '../tailwind-color-resolver'

const WCAG_AA_NORMAL = 4.5
const WCAG_AA_LARGE = 3.0

const BUTTON_TAG_RE = /<(button|Button)\b([^>]*?)className=(["'])([^"']+)\3/g
const BUTTON_LINK_RE = /<(a|Link)\b([^>]*?)className=(["'])([^"']+)\3/g
const LINK_BUTTON_HINT_RE = /\b(btn|cta|button|link-button|action-button)\b/i
// group 1=tag, 2=middle, 3=role quote, 4=className quote, 5=className content
const ROLE_BUTTON_RE = /<(\w+)\b([^>]*?role=(["'])button\3[^>]*?)className=(["'])([^"']+)\4/g

interface CodeFile {
  path: string
  content: string
  description: string
}

export interface GeneratedCodeLike {
  pages: CodeFile[]
  components: CodeFile[]
  styles: string
}

export interface PaletteLike {
  primary?: string
  secondary?: string
  accent?: string
  destructive?: string
  success?: string
  surface1?: string
  surface2?: string
  surface3?: string
  buttonContrast?: {
    onPrimary?: string
    onSecondary?: string
    onAccent?: string
    onDestructive?: string
    onSuccess?: string
    onSurface1?: string
    onSurface2?: string
    onSurface3?: string
  }
  [k: string]: unknown
}

export interface DesignSystemLike {
  colorPalette: PaletteLike
}

export interface ContrastSwap {
  filePath: string
  bgClass: string
  oldFgClass: string
  newFgClass: string
  oldRatio: number
  newRatio: number
  reason: 'token-derived' | 'explicit-bg' | 'fallback-ring'
}

export interface ContrastSwapResult {
  fixedCode: GeneratedCodeLike
  swaps: ContrastSwap[]
  unsafeFallbacks: ContrastSwap[]
}

/**
 * 主 entry — 掃描 + swap + 返回新 code
 */
export function autoSwapButtonContrast(
  code: GeneratedCodeLike,
  designSystem?: DesignSystemLike,
): ContrastSwapResult {
  const swaps: ContrastSwap[] = []
  const unsafeFallbacks: ContrastSwap[] = []

  const paletteFlat = flattenPaletteForResolver(designSystem?.colorPalette)

  const fixFile = (filePath: string, content: string): string => {
    let result = content
    result = scanAndSwap(result, BUTTON_TAG_RE, filePath, paletteFlat, swaps, unsafeFallbacks)
    result = scanAndSwap(result, BUTTON_LINK_RE, filePath, paletteFlat, swaps, unsafeFallbacks, { requireHint: true })
    result = scanAndSwap(result, ROLE_BUTTON_RE, filePath, paletteFlat, swaps, unsafeFallbacks, { classMatchIndex: 5 })
    return result
  }

  const fixedPages = code.pages.map(p => ({ ...p, content: fixFile(p.path, p.content) }))
  const fixedComponents = code.components.map(c => ({ ...c, content: fixFile(c.path, c.content) }))

  return {
    fixedCode: { pages: fixedPages, components: fixedComponents, styles: code.styles },
    swaps,
    unsafeFallbacks,
  }
}

interface ScanOptions {
  requireHint?: boolean
  classMatchIndex?: number
}

function scanAndSwap(
  content: string,
  re: RegExp,
  filePath: string,
  paletteFlat: Record<string, string> | undefined,
  swaps: ContrastSwap[],
  unsafeFallbacks: ContrastSwap[],
  opts: ScanOptions = {},
): string {
  const classIdx = opts.classMatchIndex ?? 4
  re.lastIndex = 0
  let result = content
  const replacements: { match: string; newMatch: string }[] = []

  let m: RegExpExecArray | null
  while ((m = re.exec(content)) !== null) {
    const fullMatch = m[0]
    const className = m[classIdx]
    if (!className) continue

    if (opts.requireHint && !LINK_BUTTON_HINT_RE.test(className)) continue

    const { bg, text } = extractBgAndText(className)
    if (bg.length === 0 || text.length === 0) continue

    let newClassName = className
    let modified = false

    for (const bgClass of bg) {
      const bgHex = resolveBgFromClass(bgClass, paletteFlat)
      if (!bgHex) continue

      for (const textClass of text) {
        if (/^(hover|focus|active|disabled|group-hover|peer-hover|dark):/.test(textClass)) continue
        const fgHex = resolveBgFromClass(textClass.replace(/^text-/, 'bg-'), paletteFlat)
        if (!fgHex) continue

        let ratio = 0
        try { ratio = wcagHex(bgHex, fgHex) } catch { continue }

        const threshold = isLargeText(className) ? WCAG_AA_LARGE : WCAG_AA_NORMAL
        if (ratio >= threshold) continue

        const swap = pickSwapTarget(bgClass, bgHex, paletteFlat)
        if (!swap) {
          unsafeFallbacks.push({
            filePath, bgClass, oldFgClass: textClass, newFgClass: textClass,
            oldRatio: ratio, newRatio: ratio, reason: 'fallback-ring',
          })
          continue
        }

        const oldClassPattern = new RegExp(`\\b${escapeRegExp(textClass)}\\b`)
        newClassName = newClassName.replace(oldClassPattern, swap.newFgClass)
        modified = true

        const swapRecord: ContrastSwap = {
          filePath,
          bgClass,
          oldFgClass: textClass,
          newFgClass: swap.newFgClass,
          oldRatio: ratio,
          newRatio: swap.newRatio,
          reason: swap.reason,
        }
        if (swap.newRatio < threshold) {
          unsafeFallbacks.push(swapRecord)
        } else {
          swaps.push(swapRecord)
        }
      }
    }

    if (modified) {
      const newFullMatch = fullMatch
        .replace(`"${className}"`, `"${newClassName}"`)
        .replace(`'${className}'`, `'${newClassName}'`)
      replacements.push({ match: fullMatch, newMatch: newFullMatch })
    }
  }

  for (const { match, newMatch } of replacements) {
    result = result.split(match).join(newMatch)
  }
  return result
}

function pickSwapTarget(
  bgClass: string,
  bgHex: string,
  paletteFlat: Record<string, string> | undefined,
): { newFgClass: string; newRatio: number; reason: ContrastSwap['reason'] } | null {
  const tokenMatch = bgClass.match(/^bg-(.+)$/)
  if (tokenMatch && paletteFlat) {
    const tokenName = tokenMatch[1]
    const onTokenName = `on-${tokenName}`
    const onCamel = `on${tokenName.charAt(0).toUpperCase()}${tokenName.slice(1).replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())}`
    const onHex = paletteFlat[onTokenName] || paletteFlat[onCamel]
    if (onHex) {
      try {
        const newRatio = wcagHex(bgHex, onHex)
        return { newFgClass: `text-${onTokenName}`, newRatio, reason: 'token-derived' }
      } catch { /* skip */ }
    }
  }

  const best = pickReadableForeground(bgHex)
  if (best.tailwindToken) {
    return {
      newFgClass: `text-${best.tailwindToken}`,
      newRatio: best.ratio,
      reason: best.safe ? 'explicit-bg' : 'fallback-ring',
    }
  }
  return null
}

function flattenPaletteForResolver(palette: PaletteLike | undefined): Record<string, string> | undefined {
  if (!palette) return undefined
  const flat: Record<string, string> = {}
  for (const [k, v] of Object.entries(palette)) {
    if (typeof v === 'string') flat[k] = v
  }
  const bc = palette.buttonContrast
  if (bc) {
    if (bc.onPrimary) flat['on-primary'] = bc.onPrimary
    if (bc.onSecondary) flat['on-secondary'] = bc.onSecondary
    if (bc.onAccent) flat['on-accent'] = bc.onAccent
    if (bc.onDestructive) flat['on-destructive'] = bc.onDestructive
    if (bc.onSuccess) flat['on-success'] = bc.onSuccess
    if (bc.onSurface1) flat['on-surface-1'] = bc.onSurface1
    if (bc.onSurface2) flat['on-surface-2'] = bc.onSurface2
    if (bc.onSurface3) flat['on-surface-3'] = bc.onSurface3
  }
  return flat
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
