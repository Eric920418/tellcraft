/**
 * Design System Freeze Hook
 *
 * 在 variant 選定後（uiux-phases.ts:1322 state.uiuxDesignSystem = finalDesignSystem 之後），
 * 觸發此 hook 計算 designSystemHash + 寫 audit log。
 *
 * 用途：
 *   1. **Cache key 穩定性**：hash 用作下游 prompt cache key 的一部分（同 hash → 同 cache prefix）
 *   2. **回滾驗證**：版本 snapshot 時記 hash，回滾後驗證還原是否完整
 *   3. **Telemetry**：追蹤跨會話 DesignSystem 多樣性（同 hash 出現多次表示用戶高度集中於某風格）
 *   4. **跨階段一致性 audit**：QG 完成後比對代碼與 hash 對應的 DesignSystem，找出漂移
 *
 * 不改變 state 邏輯 — 純記錄與計算。
 */

import { createHash } from 'crypto'
import type { DesignSystem } from './uiux-generation'
import type { DesignSystem as VendoredDesignSpec } from '../types/design-system-schema'
import { createLogger } from '../lib/logger'

const logger = createLogger('design-system-freeze')

// ============================================================
// Vendored DESIGN.md → uiux-generation DesignSystem 轉換器
// ============================================================

/**
 * 把 awesome-design-md vendored brand spec 轉成 uiux-generation 的 DesignSystem 型別。
 *
 * 為什麼需要轉換：兩個 DesignSystem schema 結構完全不同。
 *   - vendored: colorPalette.primary 是 Array<{name,value,role}>，typography.hierarchy 是 row 陣列
 *   - uiux-generation: colorPalette.primary 是 string (hex)，typography.scale 是 dict
 *
 * 轉換策略（lossy 但可用）：
 *   - 取每個 color category 的第一個 entry 當 flat 欄位
 *   - cssVariables 用 primary + bg + fg + accent 合成
 *   - tailwindExtend.colors 同上
 *   - typography.scale 從 hierarchy 推導常見 size
 *   - 找不到的欄位用合理 fallback（不 throw）
 */

function pickFirstColorValue(entries: Array<{ name: string; value: string }> | undefined): string | null {
  if (!entries || entries.length === 0) return null
  const v = entries[0].value
  if (!v) return null
  // 過濾非 hex/rgba 值（vendored 可能有 token 形式如 {colors.primary} — 我們要 hex）
  return /^#[0-9a-f]{3,8}$/i.test(v) || /^rgba?\(/i.test(v) ? v : null
}

function findColorByPattern(entries: Array<{ name: string; role?: string; value: string }> | undefined, pattern: RegExp): string | null {
  if (!entries) return null
  const found = entries.find(e => pattern.test(e.name) || (e.role && pattern.test(e.role)))
  if (!found) return null
  return /^#[0-9a-f]{3,8}$/i.test(found.value) ? found.value : null
}

export function convertVendoredToDesignSystem(vendored: VendoredDesignSpec): DesignSystem {
  const cp = vendored.colorPalette ?? {}

  // 主色 / 強調色 / 中性色 從各自陣列取第一個 hex 值
  const primary = pickFirstColorValue(cp.primary) ?? pickFirstColorValue(cp.brand) ?? '#5B5BD6'
  const secondary = pickFirstColorValue(cp.brand) ?? pickFirstColorValue(cp.accent) ?? primary
  const accent = pickFirstColorValue(cp.accent) ?? pickFirstColorValue(cp.brand) ?? primary

  // background / foreground 從 surface + neutral 推導
  const background = findColorByPattern(cp.surface, /background|page|canvas|white|surface[-\s]?0|surface[-\s]?1/i)
    ?? pickFirstColorValue(cp.surface)
    ?? '#FFFFFF'
  const foreground = findColorByPattern(cp.neutral, /heading|body|text|foreground|primary/i)
    ?? pickFirstColorValue(cp.neutral)
    ?? '#1A1A1A'
  const muted = findColorByPattern(cp.neutral, /muted|secondary|caption|subtle/i)
    ?? '#6B7280'
  const border = pickFirstColorValue(cp.border) ?? '#E5E7EB'

  // 多層 surface（vendored 可能多個 surface entries → surface-1/2/3）
  const surfaceEntries = (cp.surface ?? []).filter(e => /^#[0-9a-f]{3,8}$/i.test(e.value))
  const surface1 = surfaceEntries[0]?.value ?? background
  const surface2 = surfaceEntries[1]?.value ?? surfaceEntries[0]?.value
  const surface3 = surfaceEntries[2]?.value ?? surface2
  const ring = primary

  const fontFamily = vendored.typography?.primaryFont ?? 'Inter'
  const monoFont = vendored.typography?.monoFont
  const displayFont = fontFamily // vendored 通常 primary 同時用於 display

  // typography.scale — 從 hierarchy 推導常見大小（fallback 使用 Tailwind 預設）
  const scale: Record<string, string> = {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
  }

  // CSS variables：合成最常用的 token
  const cssVariables = `:root {
  --color-primary: ${primary};
  --color-secondary: ${secondary};
  --color-accent: ${accent};
  --color-background: ${background};
  --color-foreground: ${foreground};
  --color-muted: ${muted};
  --color-border: ${border};
  --color-surface-1: ${surface1};
  --color-surface-2: ${surface2};
  --color-surface-3: ${surface3};
  --color-ring: ${ring};
}`

  const ds: DesignSystem = {
    cssVariables,
    tailwindExtend: {
      colors: {
        primary,
        secondary,
        accent,
        background,
        foreground,
        muted,
        border,
        ...(surface1 && { 'surface-1': surface1 }),
        ...(surface2 && { 'surface-2': surface2 }),
        ...(surface3 && { 'surface-3': surface3 }),
        ring,
      },
      fontFamily: {
        sans: [fontFamily, 'system-ui', 'sans-serif'],
        display: [displayFont, fontFamily, 'system-ui', 'sans-serif'],
        ...(monoFont && { mono: [monoFont, 'ui-monospace', 'monospace'] }),
      },
    },
    typography: {
      fontFamily,
      scale,
    },
    colorPalette: {
      primary,
      secondary,
      accent,
      background,
      foreground,
      muted,
      border,
      surface1,
      surface2,
      surface3,
      ring,
    },
    spacing: {
      unit: 4,
      scale: {
        xs: '0.5rem',
        sm: '0.75rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem',
      },
    },
    borderRadius: {
      none: '0',
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem',
      full: '9999px',
    },
    metadata: {
      // 標註此 DesignSystem 來自 vendored，下游若需區分可讀此欄位
      layoutPreference: `vendored:${vendored.metadata.brandKey ?? 'unknown'}`,
    },
  }

  // 視覺語氣判斷：vendored visualTheme atmosphere 含 "luxurious"/"premium"/"bold" → creative tier
  // 否則保守設為 functional（讓 generateStructure 走較收斂風格）
  // （tier 判斷實際在呼叫端做，這裡不設）

  return ds
}

export type DesignSystemSource =
  | 'user_designed'        // Discovery → variant 選定
  | 'vendored_designmd'    // 用戶輸入 stripe.com 直接命中
  | 'vendored_modified'    // vendored 後用戶迭代修改過
  | 'iteration_modified'   // Phase G: 迭代修改後從代碼反推同步（design-system-token / mixed tier）
  | 'rolled_back'          // 從版本 snapshot 還原

export interface FreezeResult {
  hash: string                  // SHA256 前 16 字元
  source: DesignSystemSource
  frozenAt: number              // epoch ms
  primaryColor?: string         // 摘要：方便 log 辨識
  fontFamily?: string
  layoutArchetype?: string
}

/**
 * 計算 DesignSystem 的穩定 hash。
 *
 * 為什麼用 stable JSON：
 *   - JSON.stringify 物件順序不保證 → 同樣內容不同 hash
 *   - 用 sortKeys 確保所有 key 字典序排列
 *
 * 為什麼只取前 16 字元：
 *   - 32 字元 SHA256 完整 hash 太長，log 與 cache key 用不上
 *   - 16 字元（64 bit）對抗碰撞已綽綽有餘（用戶量級 < 10^6）
 */
function stableStringify(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj)
  if (Array.isArray(obj)) return `[${obj.map(stableStringify).join(',')}]`
  const keys = Object.keys(obj as Record<string, unknown>).sort()
  const entries = keys.map(k => `${JSON.stringify(k)}:${stableStringify((obj as Record<string, unknown>)[k])}`)
  return `{${entries.join(',')}}`
}

export function computeDesignSystemHash(ds: DesignSystem): string {
  return createHash('sha256').update(stableStringify(ds)).digest('hex').slice(0, 16)
}

/**
 * 凍結 DesignSystem — 記錄 audit + 返回 hash。
 *
 * 呼叫端應在 state.uiuxDesignSystem 寫入後立即調用：
 *   state.uiuxDesignSystem = finalDesignSystem
 *   const freeze = freezeDesignSystem(state.uiuxDesignSystem, 'user_designed', { conversationId })
 *   state.uiuxDesignSystemHash = freeze.hash  // 之後做 cache key / 回滾驗證
 */
export function freezeDesignSystem(
  ds: DesignSystem,
  source: DesignSystemSource,
  context?: { conversationId?: string; userId?: string }
): FreezeResult {
  const hash = computeDesignSystemHash(ds)
  const result: FreezeResult = {
    hash,
    source,
    frozenAt: Date.now(),
    primaryColor: ds.colorPalette?.primary,
    fontFamily: ds.typography?.fontFamily,
    layoutArchetype: ds.layoutArchetype,
  }

  logger.info({
    ...context,
    ...result,
  }, 'DesignSystem 凍結')

  return result
}
