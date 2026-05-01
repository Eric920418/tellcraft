/**
 * Iteration Intent Parser (T11)
 *
 * 既有 refineCode 把整段 feedback + 全代碼丟給 Sonnet，靠 LLM 自己解析「用戶想改
 * 什麼」。token 浪費 + 容易誤改（「把 hero 改成左右分割」LLM 順手把 footer 也動了）。
 *
 * 本模組零 LLM 規則先解析 feedback，產出 IterationIntent 供 refineCode 縮窄
 * 傳給 LLM 的檔案範圍。解析失敗 → 回 null，refineCode 走原本的 fallback（送全代碼）。
 */

import type { GeneratedComponent } from './uiux-generation'

// ============================================================
// 型別
// ============================================================

export type IterationScope = 'whole' | 'section' | 'palette' | 'typography' | 'animation'

export type IterationAction = 'replace' | 'add' | 'remove' | 'tweak'

export interface IterationIntent {
  scope: IterationScope
  action: IterationAction
  /** 偵測到的 section 關鍵詞（hero / nav / footer / card / ...） */
  targets: string[]
  /** scope=palette 時：要改成的色彩傾向（warm / cool / monochrome / 具體 hex） */
  paletteHint?: string
  /** 原始 feedback 的精簡描述（給 LLM 看） */
  rawFeedback: string
  /** 信心分數 0-1，< 0.5 呼叫端應降級為 'whole' scope */
  confidence: number
}

// ============================================================
// Section 關鍵詞表
// ============================================================

const SECTION_KEYWORDS: Record<string, RegExp[]> = {
  hero: [
    /\bhero\b/i, /主視覺|首屏|首頁開場|大標|首頁\s*(?:Banner|頂部)/i,
  ],
  nav: [
    /\bnav(?:igation|bar)?\b|navbar|menu/i, /導覽|導航|選單|頂部選單|漢堡/i,
  ],
  footer: [
    /\bfooter\b/i, /頁尾|底部|footer/i,
  ],
  header: [
    /\bheader\b/i, /頂部|頭部|頁首/i,
  ],
  sidebar: [
    /\bsidebar\b/i, /側邊欄|側欄|側邊/i,
  ],
  card: [
    /\bcards?\b/i, /卡片/i,
  ],
  form: [
    /\bforms?\b/i, /表單|輸入框/i,
  ],
  pricing: [
    /\bpricing\b|\bplans?\b/i, /方案|價格|訂閱/i,
  ],
  faq: [
    /\bfaq\b/i, /常見問題|問答/i,
  ],
  cta: [
    /\bcta\b|call\s*to\s*action/i, /主按鈕|行動呼籲/i,
  ],
  testimonial: [
    /\btestimonial/i, /見證|評價|客戶推薦/i,
  ],
  gallery: [
    /\bgallery\b/i, /相簿|畫廊|圖片集/i,
  ],
}

// ============================================================
// Action / Scope 偵測
// ============================================================

const ACTION_PATTERNS: Record<IterationAction, RegExp> = {
  replace: /改成|換成|變成|替換為|swap|replace|change\s+(?:to|into)/i,
  add: /加上|加入|增加|新增|補上|add|append/i,
  remove: /拿掉|移除|刪除|去掉|不要|拿走|remove|delete|drop|hide|get\s+rid\s+of/i,
  tweak: /縮小|放大|加粗|變細|調整|改色|微調|往(?:上|下|左|右)|tweak|tighten|loosen|adjust|nudge/i,
}

/**
 * 強範圍標記詞（顯式表達「只改 X」）
 * 命中 → 信心提升
 */
const EXPLICIT_SCOPE_PATTERNS: RegExp[] = [
  /^只|只是|只把|只需要|just\s+|only\s+/i,
  /唯一要|單純(?:把|想)|不要動其他/i,
]

const PALETTE_HINT_PATTERNS: Record<string, RegExp> = {
  warmer: /暖一點|更暖|warmer|偏暖/i,
  cooler: /冷一點|更冷|cooler|偏冷/i,
  monochrome: /單色|黑白|monochrome|grayscale/i,
  brighter: /鮮艷|亮一點|brighter|saturated/i,
  duller: /低飽和|柔和|muted|toned\s+down|dull/i,
}

// ============================================================
// 主解析函數
// ============================================================

export function parseIterationIntent(feedback: string): IterationIntent | null {
  const text = (feedback || '').trim()
  if (text.length === 0) return null

  // 1. 偵測 action（按優先序）
  let action: IterationAction = 'tweak'  // default
  let actionMatched = false
  for (const [act, regex] of Object.entries(ACTION_PATTERNS) as [IterationAction, RegExp][]) {
    if (regex.test(text)) {
      action = act
      actionMatched = true
      break
    }
  }

  // 2. 偵測 sections
  const targets: string[] = []
  for (const [section, regexes] of Object.entries(SECTION_KEYWORDS)) {
    if (regexes.some(r => r.test(text))) targets.push(section)
  }

  // 3. 偵測 palette / typography / animation 範圍
  let scope: IterationScope = 'whole'
  let paletteHint: string | undefined
  const hexMatch = text.match(/#[0-9a-f]{3,6}\b/i)
  const looksLikeColor = /顏色|配色|色調|主色|品牌色|色彩|color|palette|hue|tone/i.test(text) || !!hexMatch

  if (/字體|字型|字級|font|typography/i.test(text)) {
    scope = 'typography'
  } else if (looksLikeColor) {
    scope = 'palette'
    for (const [hint, regex] of Object.entries(PALETTE_HINT_PATTERNS)) {
      if (regex.test(text)) { paletteHint = hint; break }
    }
    if (hexMatch) paletteHint = paletteHint ? `${paletteHint},${hexMatch[0]}` : hexMatch[0]
  } else if (/動畫|過場|animation|transition|motion/i.test(text)) {
    scope = 'animation'
  } else if (targets.length > 0) {
    scope = 'section'
  }

  // 4. 信心計算
  // 起始 0.3：純猜測。要靠下面幾個訊號累積才能達到可用門檻 0.6
  let confidence = 0.3
  if (actionMatched) confidence += 0.2
  if (scope !== 'whole') confidence += 0.2
  if (targets.length > 0) confidence += 0.1
  if (EXPLICIT_SCOPE_PATTERNS.some(r => r.test(text))) confidence += 0.2
  if (text.length < 80 && (actionMatched || scope !== 'whole')) confidence += 0.1
  confidence = Math.min(1, confidence)

  // 信心過低 → 不嘗試縮窄（呼叫端 fallback 全代碼）
  if (confidence < 0.6) return null

  return {
    scope,
    action,
    targets,
    paletteHint,
    rawFeedback: text.length > 200 ? text.slice(0, 200) + '...' : text,
    confidence: Math.round(confidence * 100) / 100,
  }
}

// ============================================================
// 檔案篩選：根據 intent 從全代碼挑出相關檔案
// ============================================================

interface CodeBundle {
  pages: GeneratedComponent[]
  components: GeneratedComponent[]
  styles: string
}

/**
 * 根據 intent 從 code 中挑出可能受影響的檔案。
 *
 * 規則：
 * - scope='whole'         → 全部（不縮窄）
 * - scope='palette'       → 全 + globals.css（色票通常在 CSS variable）
 * - scope='typography'    → 全 + globals.css + layout.tsx（字體載入）
 * - scope='animation'     → components 全部（動畫多在組件層）+ globals.css
 * - scope='section'       → 從 path / content 篩選包含 target 關鍵字的檔案
 *
 * 信心 < 0.7 時自動降級到 whole（保守）。
 */
export function selectFilesByIntent(
  code: CodeBundle,
  intent: IterationIntent | null,
): CodeBundle {
  if (!intent || intent.confidence < 0.7) return code

  const allFiles = [...code.pages, ...code.components]

  if (intent.scope === 'whole') return code

  if (intent.scope === 'palette' || intent.scope === 'typography') {
    // 色彩 / 字體：全代碼 + globals.css（已包含在 styles）
    return code
  }

  if (intent.scope === 'animation') {
    // 動畫：components 居多，pages 也可能有
    return code
  }

  // scope === 'section'：篩選含 target 字眼的檔案
  if (intent.targets.length === 0) return code

  const lowerTargets = intent.targets.map(t => t.toLowerCase())

  function fileMatches(file: GeneratedComponent): boolean {
    const haystack = (file.path + '\n' + file.content).toLowerCase()
    return lowerTargets.some(t => haystack.includes(t))
  }

  const filteredPages = code.pages.filter(fileMatches)
  const filteredComponents = code.components.filter(fileMatches)

  // 篩選後完全沒有 target 命中（不算 layout）→ 降級全部，避免 LLM 拿著只有 layout
  // 一張紙在那邊不知道改什麼
  if (filteredPages.length === 0 && filteredComponents.length === 0) {
    return code
  }

  // 永遠保留 layout.tsx（防止 LLM 遺失全局結構）
  const layoutFile = code.pages.find(p => p.path.includes('layout.tsx'))
  if (layoutFile && !filteredPages.some(f => f.path === layoutFile.path)) {
    filteredPages.push(layoutFile)
  }

  return {
    pages: filteredPages,
    components: filteredComponents,
    styles: code.styles,
  }
}

/**
 * 給 LLM prompt 用的 intent 摘要描述（讓 LLM 知道我們已經解析過）。
 */
export function describeIntentForPrompt(intent: IterationIntent | null): string {
  if (!intent) return ''
  const parts = [`scope=${intent.scope}`, `action=${intent.action}`]
  if (intent.targets.length > 0) parts.push(`targets=[${intent.targets.join(', ')}]`)
  if (intent.paletteHint) parts.push(`paletteHint=${intent.paletteHint}`)
  return `\n## 已解析的修改範圍\n${parts.join(' / ')}\n（信心 ${intent.confidence}）— 請嚴格遵守此範圍，不要動到範圍外的檔案 / token。`
}
