/**
 * Style Lock (T12)
 *
 * 迭代修改時 LLM 常「順手」改了無關的設計 token（用戶要改 hero 文案，回來
 * 發現 primary 色變了）。T11 從 file-level 部分緩解，但 design-system 級別
 * 的污染仍會發生。
 *
 * 本模組純函數比對 originalDesignSystem 與 modifiedCode：
 *   - globals.css 的 :root 色票
 *   - typography.fontFamily（next/font 載入處）
 *   - 偵測到漂移 → 自動還原（regex 替換，不重打 LLM）
 *
 * 例外：用戶 feedback 明確要改色 / 換字體（intent.scope === 'palette' / 'typography'）
 * 時呼叫端應跳過鎖。
 */

import type { DesignSystem } from './uiux-generation'
import type { GeneratedComponent } from './uiux-generation'

// ============================================================
// 型別
// ============================================================

export interface StyleLockViolation {
  type: 'css_variable' | 'tailwind_color' | 'font_family'
  token: string         // e.g. '--color-primary'
  expected: string      // 原值（hex / 字體名）
  found: string         // 被改成的值
  file: string          // 'globals.css' 或檔案路徑
}

export interface StyleLockResult {
  violations: StyleLockViolation[]
  restoredCode: {
    pages: GeneratedComponent[]
    components: GeneratedComponent[]
    styles: string
  }
}

// ============================================================
// CSS Variable 解析
// ============================================================

const CSS_VAR_REGEX = /(--[a-z][a-z0-9-]*)\s*:\s*([^;}]+?)\s*[;}]/gi
const PROTECTED_VAR_PREFIXES = [
  'color-', 'primary', 'secondary', 'accent', 'background', 'foreground',
  'muted', 'border', 'surface', 'ring', 'destructive', 'success',
]

/** 從 CSS 字串抽出 :root { ... } 內所有變數宣告為 Map。 */
export function extractCssVariables(css: string): Map<string, string> {
  const result = new Map<string, string>()
  if (!css) return result

  const rootMatch = css.match(/:root\s*\{([\s\S]*?)\}/)
  if (!rootMatch) return result

  const body = rootMatch[1]
  let m: RegExpExecArray | null
  CSS_VAR_REGEX.lastIndex = 0
  while ((m = CSS_VAR_REGEX.exec(body)) !== null) {
    result.set(m[1], m[2].trim())
  }
  return result
}

function isProtectedVar(name: string): boolean {
  const stripped = name.replace(/^--/, '')
  return PROTECTED_VAR_PREFIXES.some(p => stripped.startsWith(p))
}

// ============================================================
// 字體偵測：next/font import 行
// ============================================================

const NEXT_FONT_IMPORT_REGEX = /import\s*\{\s*([A-Z][\w_]+(?:\s*,\s*[A-Z][\w_]+)*)\s*\}\s*from\s*['"]next\/font\/(google|local)['"]/g

/** 從一份檔案內容萃出已載入的字體名（'DM_Sans' 等） */
export function extractLoadedFonts(content: string): Set<string> {
  const fonts = new Set<string>()
  let m: RegExpExecArray | null
  NEXT_FONT_IMPORT_REGEX.lastIndex = 0
  while ((m = NEXT_FONT_IMPORT_REGEX.exec(content)) !== null) {
    for (const name of m[1].split(',')) {
      fonts.add(name.trim())
    }
  }
  return fonts
}

// ============================================================
// 主驗證 + 還原
// ============================================================

interface CodeBundle {
  pages: GeneratedComponent[]
  components: GeneratedComponent[]
  styles: string
}

/**
 * 比對 originalDesignSystem vs modifiedCode；偵測偏移 + 自動還原。
 *
 * 還原策略：
 * - CSS 色變數：以 originalDesignSystem.cssVariables 為真理，regex 替換 modifiedCode.styles
 *   只還原 PROTECTED_VAR_PREFIXES 開頭的變數
 * - layout.tsx 載入字體：若原本載過 X 字體但修改後不見了 → 還原該 import 行
 *
 * 不還原：
 * - 用戶在 feedback 明確要改的（呼叫端應根據 IterationIntent 決定是否跳過）
 * - 全新增加的變數（沒有 baseline 比對基礎）
 */
export function enforceStyleLock(
  originalDesignSystem: DesignSystem,
  modifiedCode: CodeBundle,
): StyleLockResult {
  const violations: StyleLockViolation[] = []
  let restoredStyles = modifiedCode.styles

  const originalVars = extractCssVariables(originalDesignSystem.cssVariables || '')
  const modifiedVars = extractCssVariables(modifiedCode.styles || '')

  for (const [name, originalValue] of originalVars) {
    if (!isProtectedVar(name)) continue
    const modifiedValue = modifiedVars.get(name)
    if (modifiedValue === undefined) continue  // 整個變數消失 → 暫不還原（可能是合理重構）
    if (normalizeCssValue(modifiedValue) === normalizeCssValue(originalValue)) continue

    violations.push({
      type: 'css_variable',
      token: name,
      expected: originalValue,
      found: modifiedValue,
      file: 'globals.css',
    })

    // Regex 替換：精確匹配 `--name: oldValue;` 或 `--name: oldValue }`
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`(${escaped}\\s*:\\s*)([^;}]+?)(\\s*[;}])`, 'g')
    restoredStyles = restoredStyles.replace(pattern, (_full, p1, _val, p3) => `${p1}${originalValue}${p3}`)
  }

  // 字體偵測：以 originalDesignSystem.typography.fontFamily 為基準
  const originalFontFamily = originalDesignSystem.typography?.fontFamily || ''
  const expectedFonts = parseFontFamily(originalFontFamily)
  const restoredPages = modifiedCode.pages.map(page => {
    if (!/layout\.tsx?$/.test(page.path)) return page
    const loadedNow = extractLoadedFonts(page.content)
    const missing = expectedFonts.filter(f => f && !setHasNextFontStyle(loadedNow, f))
    if (missing.length === 0) return page
    for (const m of missing) {
      violations.push({
        type: 'font_family',
        token: m,
        expected: m,
        found: '(missing import)',
        file: page.path,
      })
    }
    // 不主動加 import（會破壞代碼），只回報 violation 給呼叫端記 telemetry
    return page
  })

  return {
    violations,
    restoredCode: {
      pages: restoredPages,
      components: modifiedCode.components,
      styles: restoredStyles,
    },
  }
}

// ============================================================
// Helpers
// ============================================================

function normalizeCssValue(v: string): string {
  return v.toLowerCase().replace(/\s+/g, '').replace(/['"]/g, '')
}

/** "DM Sans, system-ui" → ["DM Sans"]（只取第一個有意義字體） */
function parseFontFamily(ff: string): string[] {
  if (!ff) return []
  const first = ff.split(',')[0].trim().replace(/^["']|["']$/g, '')
  return first ? [first] : []
}

/** "DM Sans" 在 next/font import 集合中常以 "DM_Sans" 出現 */
function setHasNextFontStyle(loaded: Set<string>, fontName: string): boolean {
  const normalized = fontName.replace(/\s+/g, '_')
  for (const f of loaded) {
    if (f === fontName || f === normalized || f.replace(/_/g, ' ') === fontName) return true
  }
  return false
}
