/**
 * Quality Gate Service
 * 自動化品質檢查：A11y / Performance / Code Quality
 * 基於 regex/字串匹配的靜態分析，發現 critical 問題時用 LLM 自動修復
 */

import { getAnthropicClient, MODEL, trackLlmUsage } from '../lib/anthropic'
import { GeneratedComponent, repairUndeclaredRefs, repairHookShadowing } from './uiux-generation'
import { createLogger } from '../lib/logger'
import {
  recordTelemetryBatch,
  recordTelemetry,
  type TelemetryTrackingContext,
} from './skill-telemetry'
import { auditCssConsistency } from './css-consistency-audit'
import { auditVisualCraft } from './visual-craft-audit'
import { resolveColor, extractBgAndText, isLargeText } from './tailwind-color-resolver'
import { hex as wcagHex } from 'wcag-contrast'
import { parseSearchReplaceBlocks, applySearchReplace } from './uiux-generation'
import { getEnv } from '../lib/env'

const logger = createLogger('quality-gate')

// ============================================================
// 型別定義
// ============================================================

export type QualityCategory = 'a11y' | 'performance' | 'code_quality'
export type Severity = 'critical' | 'warning' | 'info'

export interface QualityIssue {
  id: string
  category: QualityCategory
  severity: Severity
  rule: string
  message: string
  file: string
  line?: number
  suggestion?: string
}

export interface QualityReport {
  passed: boolean
  timestamp: string
  summary: {
    total: number
    critical: number
    warning: number
    info: number
    autoFixed: number
  }
  categories: {
    a11y: { passed: boolean; issues: QualityIssue[] }
    performance: { passed: boolean; issues: QualityIssue[] }
    code_quality: { passed: boolean; issues: QualityIssue[] }
  }
}

interface GeneratedCode {
  pages: GeneratedComponent[]
  components: GeneratedComponent[]
  styles: string
}

type DesignTier = 'functional' | 'creative'


// ============================================================
// 輔助：在代碼中逐行掃描
// ============================================================

function scanLines(
  content: string,
  filePath: string,
  pattern: RegExp,
  createIssue: (match: RegExpMatchArray, line: number) => QualityIssue | null
): QualityIssue[] {
  const issues: QualityIssue[] = []
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(pattern)
    if (match) {
      const issue = createIssue(match, i + 1)
      if (issue) {
        issues.push({ ...issue, file: filePath })
      }
    }
  }
  return issues
}

// ============================================================
// Checker 1: Accessibility
// ============================================================

function checkAccessibility(code: GeneratedCode): QualityIssue[] {
  const issues: QualityIssue[] = []
  const allFiles = [...code.pages, ...code.components]
  let issueCounter = 0

  for (const file of allFiles) {
    const content = file.content

    // 檢查 icon-only buttons 缺少 aria-label
    // 匹配 <button> 內只有 Icon/SVG 沒有文字
    issues.push(...scanLines(content, file.path, /<button[^>]*>/, (match, line) => {
      // 檢查這一行是否有 aria-label
      if (match[0].includes('aria-label')) return null
      // 簡單判斷：如果 button 標籤附近沒有可見文字，可能是 icon-only
      // 取得 button 區塊（粗略匹配同行或下一行有 Icon/Svg）
      const nextLines = content.split('\n').slice(line - 1, line + 2).join(' ')
      if ((nextLines.match(/Icon|<svg/i)) && !nextLines.match(/>[\s]*[a-zA-Z\u4e00-\u9fff]+[\s]*</)) {
        return {
          id: `a11y-${++issueCounter}`,
          category: 'a11y' as QualityCategory,
          severity: 'critical' as Severity,
          rule: 'aria-label',
          message: 'Icon-only button 缺少 aria-label',
          file: file.path,
          line,
          suggestion: '在 button 上加入 aria-label="描述動作"',
        }
      }
      return null
    }))

    // 檢查 <img> 缺少 alt
    issues.push(...scanLines(content, file.path, /<img\s[^>]*>/i, (match, line) => {
      if (!match[0].includes('alt=')) {
        return {
          id: `a11y-${++issueCounter}`,
          category: 'a11y',
          severity: 'warning',
          rule: 'alt-text',
          message: '圖片缺少 alt 屬性',
          file: file.path,
          line,
          suggestion: '加入 alt="圖片描述"',
        }
      }
      return null
    }))

    // 檢查 <input> 缺少 label 關聯
    issues.push(...scanLines(content, file.path, /<input\s[^>]*>/i, (match, line) => {
      const tag = match[0]
      if (tag.includes('type="hidden"') || tag.includes('type="submit"')) return null
      if (!tag.includes('aria-label') && !tag.includes('aria-labelledby') && !tag.includes('id=')) {
        return {
          id: `a11y-${++issueCounter}`,
          category: 'a11y',
          severity: 'critical',
          rule: 'form-labels',
          message: 'Input 缺少 label 關聯（沒有 aria-label 或 id）',
          file: file.path,
          line,
          suggestion: '加入 aria-label 或用 <label htmlFor="..."> 關聯',
        }
      }
      return null
    }))

    // 檢查 heading hierarchy（h1 → h3 跳級）
    const headings: { level: number; line: number }[] = []
    const headingRegex = /<h([1-6])/g
    let hMatch
    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      while ((hMatch = headingRegex.exec(lines[i])) !== null) {
        headings.push({ level: parseInt(hMatch[1]), line: i + 1 })
      }
    }
    for (let i = 1; i < headings.length; i++) {
      if (headings[i].level - headings[i - 1].level > 1) {
        issues.push({
          id: `a11y-${++issueCounter}`,
          category: 'a11y',
          severity: 'warning',
          rule: 'heading-hierarchy',
          message: `標題跳級：h${headings[i - 1].level} → h${headings[i].level}`,
          file: file.path,
          line: headings[i].line,
          suggestion: `使用 h${headings[i - 1].level + 1} 而非 h${headings[i].level}`,
        })
      }
    }

    // 檢查每個互動元素是否有 focus-visible（per-element，非 per-file）
    const tagStartRegex = /<(button|a)\b/gi
    let startMatch
    while ((startMatch = tagStartRegex.exec(content)) !== null) {
      const startIdx = startMatch.index
      const closeIdx = content.indexOf('>', startIdx)
      if (closeIdx === -1) continue
      const fullTag = content.substring(startIdx, closeIdx + 1)
      const tagLine = content.substring(0, startIdx).split('\n').length

      if (!fullTag.includes('focus-visible') && !fullTag.includes('focus:')) {
        issues.push({
          id: `a11y-${++issueCounter}`,
          category: 'a11y',
          severity: 'critical',
          rule: 'focus-visible',
          message: `互動元素 <${startMatch[1]}> 缺少可見的 focus 狀態`,
          file: file.path,
          line: tagLine,
          suggestion: '加入 focus-visible:ring-2 focus-visible:ring-offset-2',
        })
      }
    }
  }

  return issues
}

// ============================================================
// Checker 2: Performance
// ============================================================

function checkPerformance(code: GeneratedCode): QualityIssue[] {
  const issues: QualityIssue[] = []
  const allFiles = [...code.pages, ...code.components]
  let issueCounter = 0

  for (const file of allFiles) {
    const content = file.content

    // 檢查是否動畫了 layout 屬性（width/height/top/left/margin/padding）
    const layoutAnimProps = ['width', 'height', 'top', 'left', 'right', 'bottom', 'margin', 'padding']
    for (const prop of layoutAnimProps) {
      // CSS transition 中的 layout 屬性
      issues.push(...scanLines(content, file.path, new RegExp(`transition[^;]*${prop}`, 'i'), (_match, line) => {
        return {
          id: `perf-${++issueCounter}`,
          category: 'performance',
          severity: 'critical',
          rule: 'animation-properties',
          message: `動畫了 layout 屬性 "${prop}"，會導致 layout thrashing`,
          file: file.path,
          line,
          suggestion: '只動畫 transform 和 opacity',
        }
      }))
    }

    // 檢查 transition-all（可能動畫 layout 屬性）
    issues.push(...scanLines(content, file.path, /transition-all/i, (_match, line) => {
      return {
        id: `perf-${++issueCounter}`,
        category: 'performance',
        severity: 'warning',
        rule: 'no-transition-all',
        message: '使用了 transition-all，可能動畫不必要的屬性',
        file: file.path,
        line,
        suggestion: '改用具體的 transition-colors 或 transition-transform',
      }
    }))

    // 檢查是否有動畫但缺少 reduced-motion 支援
    const hasAnimation = content.includes('animate-') ||
      content.includes('transition') ||
      content.includes('motion.') ||
      content.includes('framer-motion') ||
      content.includes('motion/react')
    const hasReducedMotion = content.includes('prefers-reduced-motion') ||
      content.includes('motion-reduce') ||
      content.includes('reducedMotion')

    if (hasAnimation && !hasReducedMotion) {
      issues.push({
        id: `perf-${++issueCounter}`,
        category: 'performance',
        severity: 'warning',
        rule: 'reduced-motion',
        message: '有動畫但缺少 prefers-reduced-motion 支援',
        file: file.path,
        suggestion: '加入 motion-reduce:* Tailwind class 或 prefers-reduced-motion media query',
      })
    }

    // 檢查動畫時長過長（> 500ms）— 三組 pattern
    // Pattern 1: 自定義 Tailwind — duration-[800ms] 或 duration:[800ms]
    issues.push(...scanLines(content, file.path, /duration[:-]\[(\d+)ms\]/i, (match, line) => {
      const duration = parseInt(match[1])
      if (duration > 500) {
        return {
          id: `perf-${++issueCounter}`,
          category: 'performance',
          severity: 'warning',
          rule: 'animation-duration',
          message: `動畫時長 ${duration}ms 過長（建議 ≤ 500ms）`,
          file: file.path,
          line,
          suggestion: '縮短至 200-300ms',
        }
      }
      return null
    }))

    // Pattern 2: 標準 Tailwind class — duration-700
    issues.push(...scanLines(content, file.path, /\bduration-(\d+)\b(?!ms])/i, (match, line) => {
      const duration = parseInt(match[1])
      if (duration > 500) {
        return {
          id: `perf-${++issueCounter}`,
          category: 'performance',
          severity: 'warning',
          rule: 'animation-duration',
          message: `動畫時長 ${duration}ms 過長（建議 ≤ 500ms）`,
          file: file.path,
          line,
          suggestion: '縮短至 200-300ms',
        }
      }
      return null
    }))

    // Pattern 3: motion/react — duration: 0.8（秒）
    issues.push(...scanLines(content, file.path, /duration:\s*([\d.]+)/, (match, line) => {
      const seconds = parseFloat(match[1])
      const durationMs = Math.round(seconds * 1000)
      if (durationMs > 500) {
        return {
          id: `perf-${++issueCounter}`,
          category: 'performance',
          severity: 'warning',
          rule: 'animation-duration',
          message: `動畫時長 ${durationMs}ms (${seconds}s) 過長（建議 ≤ 500ms）`,
          file: file.path,
          line,
          suggestion: '縮短至 0.2-0.3s',
        }
      }
      return null
    }))
  }

  return issues
}

// ============================================================
// Checker 3: Code Quality
// ============================================================

function checkCodeQuality(code: GeneratedCode, designTier?: DesignTier): QualityIssue[] {
  const issues: QualityIssue[] = []
  const allFiles = [...code.pages, ...code.components]
  let issueCounter = 0

  for (const file of allFiles) {
    const content = file.content

    // 檢查是否引用了 framer-motion 而非 motion/react
    issues.push(...scanLines(content, file.path, /from\s+['"]framer-motion['"]/, (_match, line) => {
      return {
        id: `cq-${++issueCounter}`,
        category: 'code_quality',
        severity: 'critical',
        rule: 'motion-import',
        message: '使用了 framer-motion，應改用 motion/react',
        file: file.path,
        line,
        suggestion: "將 import 改為 from 'motion/react'",
      }
    }))

    // 檢查 Tailwind v4 語法（CSS 中不應用 @tailwind）
    if (file.path.endsWith('.css') || file.path.includes('globals')) {
      issues.push(...scanLines(content, file.path, /@tailwind/, (_match, line) => {
        return {
          id: `cq-${++issueCounter}`,
          category: 'code_quality',
          severity: 'critical',
          rule: 'tailwind-v4',
          message: '使用了 Tailwind v3 的 @tailwind 語法',
          file: file.path,
          line,
          suggestion: '改用 Tailwind v4 的 @import "tailwindcss"',
        }
      }))
    }

    // 檢查 h-screen（應用 h-dvh）
    issues.push(...scanLines(content, file.path, /\bh-screen\b/, (_match, line) => {
      return {
        id: `cq-${++issueCounter}`,
        category: 'code_quality',
        severity: 'critical',
        rule: 'no-h-screen',
        message: '使用了 h-screen，在移動端有地址欄遮擋問題',
        file: file.path,
        line,
        suggestion: '改用 h-dvh（dynamic viewport height）',
      }
    }))

    // 檢查使用 emoji 作為 icon
    // 常見的 emoji icon 模式：>🔒<  >📧<  等
    issues.push(...scanLines(content, file.path, />[^\S]*[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}][^\S]*</u, (_match, line) => {
      return {
        id: `cq-${++issueCounter}`,
        category: 'code_quality',
        severity: 'warning',
        rule: 'no-emoji-icons',
        message: '使用了 emoji 作為 icon，應改用 SVG icon',
        file: file.path,
        line,
        suggestion: '替換為 SVG icon 組件',
      }
    }))

    // 檢查 Google Fonts link/import（應用 next/font）
    issues.push(...scanLines(content, file.path, /fonts\.googleapis\.com|@import\s+url\(.*fonts/i, (_match, line) => {
      return {
        id: `cq-${++issueCounter}`,
        category: 'code_quality',
        severity: 'critical',
        rule: 'next-font',
        message: '使用了 <link> 或 @import 載入 Google Fonts',
        file: file.path,
        line,
        suggestion: '改用 next/font 載入字體',
      }
    }))

    // 可點擊元素缺少 cursor-pointer
    issues.push(...scanLines(content, file.path, /<button[^>]*className="([^"]*)"/, (match, line) => {
      const classes = match[1]
      if (!classes.includes('cursor-pointer') && !classes.includes('cursor-')) {
        return {
          id: `cq-${++issueCounter}`,
          category: 'code_quality',
          severity: 'info',
          rule: 'cursor-pointer',
          message: 'Button 缺少 cursor-pointer class',
          file: file.path,
          line,
          suggestion: '加入 cursor-pointer class',
        }
      }
      return null
    }))
  }

  // Functional tier 特定檢查（warning，不觸發 autofix）
  if (designTier === 'functional') {
    for (const file of allFiles) {
      const content = file.content

      // 檢測漸層（bg-gradient-to-*, from-*-NNN, via-*-NNN）
      issues.push(...scanLines(content, file.path, /\b(bg-gradient-to-\w+|from-\w+-\d+|via-\w+-\d+)\b/, (match, line) => {
        return {
          id: `cq-${++issueCounter}`,
          category: 'code_quality',
          severity: 'warning',
          rule: 'functional-no-gradient',
          message: `Functional tier 不建議使用漸層（${match[1]}）`,
          file: file.path,
          line,
          suggestion: '使用純色背景，如 bg-slate-50 或 bg-surface-1',
        }
      }))

      // 檢測 glow 效果
      issues.push(...scanLines(content, file.path, /shadow-\[0[_ ]0[_ ][^\]]*\]|drop-shadow-\w+/i, (match, line) => {
        return {
          id: `cq-${++issueCounter}`,
          category: 'code_quality',
          severity: 'warning',
          rule: 'functional-no-glow',
          message: 'Functional tier 不建議使用 glow/drop-shadow 效果',
          file: file.path,
          line,
          suggestion: '移除 glow 效果，使用標準 shadow-sm / shadow-md',
        }
      }))

      // 檢測 spring/bounce 動畫（跳過註釋行）
      issues.push(...scanLines(content, file.path, /\b(spring|bounce|stiffness|damping)\b/i, (match, line) => {
        const trimmedLine = content.split('\n')[line - 1]?.trimStart()
        if (trimmedLine?.startsWith('//') || trimmedLine?.startsWith('*')) return null
        return {
          id: `cq-${++issueCounter}`,
          category: 'code_quality',
          severity: 'warning',
          rule: 'functional-no-spring',
          message: `Functional tier 不建議使用 spring/bounce 動畫（${match[1]}）`,
          file: file.path,
          line,
          suggestion: '使用 ease-out 過渡，時長 150-300ms',
        }
      }))
    }
  }

  // 檢查 styles 中的問題
  if (code.styles) {
    // Tailwind v3 語法
    scanLines(code.styles, 'globals.css', /@tailwind/, (_match, line) => {
      issues.push({
        id: `cq-${++issueCounter}`,
        category: 'code_quality',
        severity: 'critical',
        rule: 'tailwind-v4',
        message: 'globals.css 使用了 @tailwind 語法（Tailwind v3）',
        file: 'globals.css',
        line,
        suggestion: '改用 @import "tailwindcss"',
      })
      return null
    })

    // Google Fonts in CSS
    scanLines(code.styles, 'globals.css', /fonts\.googleapis\.com|@import\s+url\(.*fonts/i, (_match, line) => {
      issues.push({
        id: `cq-${++issueCounter}`,
        category: 'code_quality',
        severity: 'critical',
        rule: 'next-font',
        message: 'globals.css 使用了 @import 載入 Google Fonts',
        file: 'globals.css',
        line,
        suggestion: '改用 next/font 載入字體',
      })
      return null
    })
  }

  return issues
}

// ============================================================
// Checker 4: Color Contrast
// ============================================================

function checkColorContrast(code: GeneratedCode, moodId?: string): QualityIssue[] {
  const issues: QualityIssue[] = []
  let issueCounter = 0

  const allFiles = [
    ...code.pages.map(f => ({ path: f.path, content: f.content })),
    ...code.components.map(f => ({ path: f.path, content: f.content })),
  ]

  // ========================================================
  // Layer 0：真實 WCAG luminance ratio 計算（R9 治本 Layer 4 升級版）
  // 找 element 上同時存在的 bg-* + text-* class 配對，算 ratio。
  // - 按鈕 context（<button>/role=button/btn class）內 ratio < 4.5 → critical（必擋部署）
  // - 普通 context ratio < 3.0 → critical
  // - 普通 context ratio < 4.5 非 large text → warning
  // - 移除 PER_FILE_CAP=3 沉默吞噬，改成 (bg,fg) pair dedup（同對只報一次）
  // 不解析 parent inherited bg（首版限制）
  // 注意：Layer 3 deployer auto-swap 已先處理 button context，QG 觸發 = 真實罕見漏網
  // ========================================================
  const classNameMatcher = /className\s*=\s*(["'])([^"']+?)\1/g
  // R9: 偵測按鈕 context 用於 severity 升級
  const BUTTON_LINE_RE = /<(button|Button)\b|<(a|Link)\b[^>]*?\b(btn|cta|button|link-button)\b|role=(["'])button\4/
  for (const { path, content } of allFiles) {
    const lines = content.split('\n')
    // R9: 同 (bg,fg) pair 一個 file 只報一次（取代 PER_FILE_CAP=3 沉默 cap）
    const reportedPairs = new Set<string>()
    for (let i = 0; i < lines.length; i++) {
      const matches = [...lines[i].matchAll(classNameMatcher)]
      // R9: 判斷此 line 是否在 button context（看本行 + 前 2 行 + 後 1 行 window）
      const contextWindow = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 2)).join(' ')
      const inButtonContext = BUTTON_LINE_RE.test(contextWindow)
      for (const m of matches) {
        const className = m[2]
        const { bg, text } = extractBgAndText(className)
        if (bg.length === 0 || text.length === 0) continue

        const bgHex = resolveColor(bg[0])
        const fgHex = resolveColor(text[0])
        if (!bgHex || !fgHex) continue
        if (bgHex === 'transparent' || fgHex === 'transparent') continue

        let ratio: number
        try {
          ratio = wcagHex(bgHex, fgHex)
        } catch {
          continue
        }

        const large = isLargeText(className)
        // R9: button context 強制 4.5 閾值（不分 large text）
        const buttonFailsCritical = inButtonContext && ratio < 4.5
        const failsCritical = ratio < 3.0
        const failsAA = !large && ratio < 4.5

        // R9: dedup (bg,fg) pair 一個 file 只報一次
        const pairKey = `${bg[0]}__${text[0]}`
        if (reportedPairs.has(pairKey)) continue

        if (buttonFailsCritical) {
          issues.push({
            id: `contrast-${++issueCounter}`,
            category: 'a11y',
            severity: 'critical',
            rule: 'contrast-button-aa',
            file: path,
            line: i + 1,
            message: `按鈕對比度僅 ${ratio.toFixed(2)}:1（${bg[0]} + ${text[0]}），按鈕內文字必須 ≥ 4.5:1（R9 治本：Layer 3 應已 auto-swap，這條觸發表示漏網）`,
            suggestion: `用 text-on-${bg[0].replace('bg-', '')} 配對 token，或改用 bg-slate-900 + text-white`,
          })
          reportedPairs.add(pairKey)
        } else if (failsCritical) {
          issues.push({
            id: `contrast-${++issueCounter}`,
            category: 'a11y',
            severity: 'critical',
            rule: 'contrast-ratio',
            file: path,
            line: i + 1,
            message: `對比度僅 ${ratio.toFixed(2)}:1（${bg[0]} + ${text[0]}），低於 WCAG 最低門檻 3:1`,
            suggestion: `提高對比度到 ≥ 4.5:1（normal text）或 ≥ 3:1（large/UI）。建議用更深 bg + 更亮 text`,
          })
          reportedPairs.add(pairKey)
        } else if (failsAA) {
          issues.push({
            id: `contrast-${++issueCounter}`,
            category: 'a11y',
            severity: 'warning',
            rule: 'contrast-ratio-aa',
            file: path,
            line: i + 1,
            message: `對比度 ${ratio.toFixed(2)}:1（${bg[0]} + ${text[0]}），未達 WCAG AA normal text 4.5:1（可能誤報若實際是 large text）`,
            suggestion: `若該文字是 body/UI label，提升對比度到 4.5:1；若是 ≥18px heading 可放寬到 3:1`,
          })
          reportedPairs.add(pairKey)
        }
      }
    }
  }

  // Layer A：通用亮底白字偵測（所有 mood 都跑）
  const lightBgPatterns = [
    'bg-white', 'bg-muted', 'bg-surface-1', 'bg-surface-2', 'bg-surface-3',
    'bg-gray-50', 'bg-gray-100', 'bg-slate-50', 'bg-zinc-50', 'bg-[#fafafa]', 'bg-[#ffffff]'
  ]
  const whiteTextPatterns = ['text-white', 'text-slate-50', 'text-gray-50', 'text-zinc-50']

  for (const { path, content } of allFiles) {
    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const window = lines.slice(Math.max(0, i - 2), i + 3).join(' ')
      const hasLightBg = lightBgPatterns.some(p => window.includes(p))
      const hasWhiteText = whiteTextPatterns.some(p => window.includes(p))
      if (hasLightBg && hasWhiteText) {
        issues.push({
          id: `contrast-${++issueCounter}`,
          category: 'a11y',
          severity: 'critical',
          rule: 'color-contrast',
          file: path,
          line: i + 1,
          message: '亮色背景上使用白色文字，對比度不足（WCAG AA 違規）',
          suggestion: '改用 text-foreground 或 text-zinc-900；若需要白字，必須先加深色容器（bg-slate-950）',
        })
        break  // 每個檔案只報一次，避免 autofix prompt 過長
      }
    }
  }

  // Layer B：Dark mood 缺乏深色容器偵測
  const DARK_MOOD_IDS = ['glassmorphic-dark', 'tech-dark']
  if (moodId && DARK_MOOD_IDS.includes(moodId)) {
    for (const { path, content } of allFiles) {
      const hasBackdropBlur = content.includes('backdrop-blur')
      const hasWhiteText = whiteTextPatterns.some(p => content.includes(p))
      const hasDarkContainer = /bg-(slate|zinc|gray|neutral)-9\d\d|bg-black/.test(content)

      if ((hasBackdropBlur || hasWhiteText) && !hasDarkContainer) {
        issues.push({
          id: `contrast-${++issueCounter}`,
          category: 'a11y',
          severity: 'critical',
          rule: 'dark-mood-contrast',
          file: path,
          message: `glassmorphic-dark mood 需要深色底層容器，但 ${path} 中找不到 bg-slate-900/bg-zinc-950/bg-black`,
          suggestion: '在使用 backdrop-blur 或 text-white 的 section 外層加 bg-slate-950 或 bg-zinc-950 容器',
        })
        break
      }
    }
  }

  return issues
}

// ============================================================
// Checker 5: SVG/HTML ID Uniqueness
// ============================================================

function checkIdUniqueness(code: GeneratedCode): QualityIssue[] {
  const issues: QualityIssue[] = []
  let issueCounter = 0
  const SVG_DEFS_RE = /<(linearGradient|radialGradient|clipPath|mask|filter|pattern)\s[^>]*id=["']([^"']+)["']/gi

  for (const file of [...code.pages, ...code.components]) {
    SVG_DEFS_RE.lastIndex = 0
    let m
    while ((m = SVG_DEFS_RE.exec(file.content)) !== null) {
      const idValue = m[2]
      // 跳過已用動態 ID 的情況（模板字串 ${...}）
      if (idValue.includes('${')) continue
      issues.push({
        id: `id-${++issueCounter}`,
        category: 'code_quality',
        severity: 'critical',
        rule: 'svg-id-uniqueness',
        message: `SVG <${m[1]}> 使用硬編碼 id="${idValue}"，多實例渲染時會 ID 衝突`,
        file: file.path,
        suggestion: '用 React.useId() 生成唯一前綴：const uid = useId(); id={`${uid}-name`}',
      })
    }
  }
  return issues
}

// ============================================================
// 主函數：runQualityGate
// ============================================================

export function runQualityGate(
  code: GeneratedCode,
  designTier?: DesignTier,
  moodId?: string,
  /** Phase D: 注入 DesignSystem → 跑 design-token-compliance；不傳則跳過此檢查 */
  designSystem?: import('./uiux-generation').DesignSystem,
  /** Phase D: 用戶按下「強制覆寫」按鈕 → 跳過 design-token-compliance critical 阻塞 */
  designTokenOverride?: boolean,
): QualityReport {
  // 並行執行 checkers
  const a11yIssues = checkAccessibility(code)
  const perfIssues = checkPerformance(code)
  const cqIssues = checkCodeQuality(code, designTier)
  const contrastIssues = checkColorContrast(code, moodId)
  const idIssues = checkIdUniqueness(code)
  // P0: CSS Token 一致性（rule prefix 'consistency-*'，category=code_quality）
  const consistencyIssues = auditCssConsistency(code).issues
  // T8: 視覺品質（rule prefix 'craft-*'，category=code_quality）
  const craftIssues = auditVisualCraft(code).issues

  // Phase D: design-token-compliance（rule prefix 'design-token-*'，category=code_quality）
  // - severity 由 env DESIGN_TOKEN_SEVERITY 控制：預設 'warning' (advisory)
  // - 觀察 violation rate < 10% 後手動切 'critical'（升級後違反阻塞部署）
  // - 強制覆寫（designTokenOverride=true）：所有 issues 強制降級為 'warning'，不阻塞 — critical 模式下的逃生口
  const designTokenIssues: QualityIssue[] = []
  if (designSystem) {
    try {
      const { auditDesignTokenCompliance } = require('./design-token-compliance') as typeof import('./design-token-compliance')
      const { getEnv } = require('../lib/env') as typeof import('../lib/env')
      const envSeverity = getEnv().DESIGN_TOKEN_SEVERITY  // 'critical' | 'warning'
      const allFiles = [
        ...code.pages.map(p => ({ path: p.path, content: p.content })),
        ...code.components.map(c => ({ path: c.path, content: c.content })),
        ...(code.styles ? [{ path: 'app/globals.css', content: code.styles }] : []),
      ]
      const result = auditDesignTokenCompliance(allFiles, designSystem)
      for (const issue of result.issues) {
        // 優先順序：用戶覆寫 > env 設定
        const finalSeverity: Severity = designTokenOverride
          ? 'warning'
          : (envSeverity === 'critical' ? 'critical' : 'warning')
        designTokenIssues.push({ ...issue, severity: finalSeverity })
      }
    } catch (err) {
      // fail-soft：design-token-compliance 異常不阻塞 QG
      // eslint-disable-next-line no-console
      console.warn('[quality-gate] design-token-compliance audit 失敗（跳過）:', err)
    }
  }

  const allA11yIssues = [...a11yIssues, ...contrastIssues]
  const allCqIssues = [...cqIssues, ...idIssues, ...consistencyIssues, ...craftIssues, ...designTokenIssues]
  const allIssues = [...allA11yIssues, ...perfIssues, ...allCqIssues]

  const critical = allIssues.filter(i => i.severity === 'critical').length
  const warning = allIssues.filter(i => i.severity === 'warning').length
  const info = allIssues.filter(i => i.severity === 'info').length

  return {
    passed: critical === 0,
    timestamp: new Date().toISOString(),
    summary: {
      total: allIssues.length,
      critical,
      warning,
      info,
      autoFixed: 0,
    },
    categories: {
      a11y: {
        passed: allA11yIssues.filter(i => i.severity === 'critical').length === 0,
        issues: allA11yIssues,
      },
      performance: {
        passed: perfIssues.filter(i => i.severity === 'critical').length === 0,
        issues: perfIssues,
      },
      code_quality: {
        passed: allCqIssues.filter(i => i.severity === 'critical').length === 0,
        issues: allCqIssues,
      },
    },
  }
}

function mergeGeneratedCode(base: GeneratedCode, patch: Partial<GeneratedCode>): GeneratedCode {
  const pageMap = new Map((patch.pages || []).map(page => [page.path, page]))
  const componentMap = new Map((patch.components || []).map(component => [component.path, component]))

  return {
    pages: [
      ...base.pages.map(page => pageMap.get(page.path) ?? page),
      ...(patch.pages || []).filter(page => !base.pages.some(existing => existing.path === page.path)),
    ],
    components: [
      ...base.components.map(component => componentMap.get(component.path) ?? component),
      ...(patch.components || []).filter(component => !base.components.some(existing => existing.path === component.path)),
    ],
    styles: patch.styles || base.styles,
  }
}

function addClassToken(tag: string, token: string): string {
  const classMatch = tag.match(/className=(["'])([^"']*)(\1)/)
  if (!classMatch) {
    return tag.replace(/<(\w+)/, `<$1 className="${token}"`)
  }
  const quote = classMatch[1]
  const current = classMatch[2]
  if (current.includes(token)) return tag
  const nextValue = `${current} ${token}`.trim()
  return tag.replace(classMatch[0], `className=${quote}${nextValue}${quote}`)
}

function applyRuleBasedFixToFile(content: string, issue: QualityIssue): string {
  switch (issue.rule) {
    case 'motion-import':
      return content.replace(/from\s+['"]framer-motion['"]/g, "from 'motion/react'")
    case 'tailwind-v4': {
      const withoutTailwind = content.replace(/^\s*@tailwind\s+(base|components|utilities)\s*;?\s*$/gm, '').trim()
      if (withoutTailwind.includes('@import "tailwindcss"')) {
        return withoutTailwind
      }
      return `@import "tailwindcss"\n\n${withoutTailwind}`.trim()
    }
    case 'focus-visible':
      return content
        .replace(/<button\b[^>]*>/g, tag => addClassToken(tag, 'focus-visible:ring-2 focus-visible:ring-offset-2'))
        .replace(/<a\b[^>]*>/g, tag => addClassToken(tag, 'focus-visible:ring-2 focus-visible:ring-offset-2'))
    case 'form-labels':
      return content.replace(/<input\b([^>]*?)>/g, (match, attrs) => {
        if (/aria-label=|aria-labelledby=|id=/.test(attrs)) return match
        const placeholder = attrs.match(/placeholder=(["'])(.*?)\1/)
        if (placeholder?.[2]) {
          return `<input${attrs} aria-label="${placeholder[2]}">`
        }
        return match
      })
    case 'no-h-screen':
      return content.replace(/\bmin-h-screen\b/g, 'min-h-dvh').replace(/\bh-screen\b/g, 'h-dvh')
    default:
      return content
  }
}

const RULE_BASED_FIXABLE = new Set([
  'motion-import',
  'tailwind-v4',
  'focus-visible',
  'form-labels',
  'no-h-screen',
])

export function autoFixCriticalIssuesRuleBased(
  code: GeneratedCode,
  issues: QualityIssue[],
  trackingContext?: TelemetryTrackingContext
): GeneratedCode | null {
  // Telemetry: 每條進來的 issue 都記錄一次 rule 命中（不論最後是否真的改動檔案內容）
  // 這樣可以統計「rule 每天被觸發幾次」，作為 prompt 回灌的高頻 pattern 來源
  if (issues.length > 0) {
    recordTelemetryBatch(
      issues.map(issue => ({
        skillName: 'quality_gate' as const,
        eventType: 'qg_rule_fix' as const,
        patternKey: issue.rule || 'unknown',
        severity: issue.severity,
        userId: trackingContext?.userId || null,
        conversationId: trackingContext?.conversationId || null,
        projectId: trackingContext?.projectId || null,
        payload: {
          file: issue.file,
          category: issue.category,
          fixable: RULE_BASED_FIXABLE.has(issue.rule || ''),
        },
      }))
    ).catch(() => {})
  }

  let changed = false

  const pages = code.pages.map(page => {
    const fileIssues = issues.filter(issue => issue.file === page.path)
    if (fileIssues.length === 0) return page
    let nextContent = page.content
    for (const issue of fileIssues) {
      nextContent = applyRuleBasedFixToFile(nextContent, issue)
    }
    if (nextContent !== page.content) changed = true
    return nextContent === page.content ? page : { ...page, content: nextContent }
  })

  const components = code.components.map(component => {
    const fileIssues = issues.filter(issue => issue.file === component.path)
    if (fileIssues.length === 0) return component
    let nextContent = component.content
    for (const issue of fileIssues) {
      nextContent = applyRuleBasedFixToFile(nextContent, issue)
    }
    if (nextContent !== component.content) changed = true
    return nextContent === component.content ? component : { ...component, content: nextContent }
  })

  let styles = code.styles
  const styleIssues = issues.filter(issue => issue.file === 'globals.css')
  if (styleIssues.length > 0) {
    for (const issue of styleIssues) {
      styles = applyRuleBasedFixToFile(styles, issue)
    }
    if (styles !== code.styles) changed = true
  }

  if (!changed) return null
  return { pages, components, styles }
}

function pickIssueScopedCode(code: GeneratedCode, issues: QualityIssue[]): GeneratedCode {
  const filePaths = new Set(issues.map(issue => issue.file))

  return {
    pages: code.pages.filter(page => filePaths.has(page.path)),
    components: code.components.filter(component => filePaths.has(component.path)),
    styles: filePaths.has('globals.css') ? code.styles : '',
  }
}

// ============================================================
// 自動修復：用 LLM 修復 critical issues
// ============================================================

export async function autoFixCriticalIssues(
  code: GeneratedCode,
  issues: QualityIssue[],
  trackingContext?: { userId?: string; conversationId?: string; projectId?: string }
): Promise<GeneratedCode | null> {
  const client = getAnthropicClient()
  const scopedCode = pickIssueScopedCode(code, issues)

  // Telemetry: 進到 LLM fallback 代表 rule-based 沒救到 → 高成本修復事件
  // patternKey 聚合所有剩餘 issue 的 rule，排序後去重
  if (issues.length > 0) {
    const rules = Array.from(new Set(issues.map(i => i.rule || 'unknown'))).sort()
    recordTelemetry({
      skillName: 'quality_gate',
      eventType: 'qg_llm_fallback',
      patternKey: rules.join(',') || 'unknown',
      userId: trackingContext?.userId || null,
      conversationId: trackingContext?.conversationId || null,
      projectId: trackingContext?.projectId || null,
      payload: {
        issue_count: issues.length,
        rules,
        files: Array.from(new Set(issues.map(i => i.file))).slice(0, 10),
      },
      fixRounds: issues.length,
    }).catch(() => {})
  }

  // 組合所有代碼供 LLM 修復
  const codeBlocks: string[] = []
  for (const page of scopedCode.pages) {
    codeBlocks.push(`\`\`\`tsx:${page.path}\n${page.content}\n\`\`\``)
  }
  for (const comp of scopedCode.components) {
    codeBlocks.push(`\`\`\`tsx:${comp.path}\n${comp.content}\n\`\`\``)
  }
  if (scopedCode.styles) {
    codeBlocks.push(`\`\`\`css:globals.css\n${scopedCode.styles}\n\`\`\``)
  }

  const issueList = issues.map(i =>
    `- [${i.severity}] ${i.rule}: ${i.message} (${i.file}${i.line ? `:${i.line}` : ''})${i.suggestion ? ` → ${i.suggestion}` : ''}`
  ).join('\n')

  // T9: per-user rollout（trackingContext.userId hash bucket）
  const { isFeatureEnabledForUser } = await import('../lib/feature-flag')
  const useDiff = isFeatureEnabledForUser('refine_diff_output', trackingContext?.userId)
  const outputFormatHint = useDiff
    ? `3. 用 SEARCH/REPLACE block 標示每處修改（省 token + 避免大檔案截斷）：

<<<<<<< SEARCH:path/to/file.tsx
// 原代碼片段（必須精確匹配，含 3-5 行上下文確保唯一定位）
=======
// 修復後的代碼片段
>>>>>>> REPLACE

CSS 修改用 <<<<<<< SEARCH:globals.css。SEARCH 多處匹配會被拒絕，請含足夠上下文。`
    : `3. 輸出修復後的完整檔案（與原始格式相同的 \`\`\`tsx:path 或 \`\`\`css:path 代碼塊）`

  const prompt = `你是程式碼修復專家。以下是前端程式碼和需要修復的品質問題清單。

## 規則
1. **只修復列出的問題**，不要改變任何設計、佈局、功能或樣式
2. 保持所有現有代碼結構不變
${outputFormatHint}
4. 動畫庫用 motion/react（不是 framer-motion）
5. 字體載入用 next/font（不用 <link> 或 @import Google Fonts）
6. Tailwind v4 用 @import "tailwindcss"（不用 @tailwind）

## 需要修復的問題
${issueList}

## 原始代碼
${codeBlocks.join('\n\n')}

${useDiff ? '請用 SEARCH/REPLACE block 輸出每處修改。' : '請輸出修復後的所有檔案（保持相同的 ```tsx:filepath 格式）。'}`

  try {
    const stream = client.messages.stream({
      model: MODEL.HAIKU,
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt }],
    })
    const response = await stream.finalMessage()

    // 記錄 LLM 用量
    const usage = response.usage
    if (usage) {
      trackLlmUsage({
        model: MODEL.HAIKU,
        inputTokens: usage.input_tokens || 0,
        outputTokens: usage.output_tokens || 0,
        purpose: 'quality_gate_autofix',
        userId: trackingContext?.userId,
        conversationId: trackingContext?.conversationId,
      })
    }

    const content = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n')

    // P6: hybrid 解析 — 先試 SEARCH/REPLACE diff，沒 block 或全失敗 fallback 完整檔案
    let merged: GeneratedCode
    const srBlocks = parseSearchReplaceBlocks(content)
    if (srBlocks && srBlocks.length > 0) {
      const srResult = applySearchReplace(scopedCode, srBlocks)
      if (srResult.appliedCount > 0) {
        logger.info({
          appliedCount: srResult.appliedCount,
          failedCount: srResult.failedBlocks.length,
        }, 'autoFixCriticalIssues：用 SEARCH/REPLACE diff 解析成功')
        merged = mergeGeneratedCode(code, srResult.updatedCode)
      } else {
        const result = parseFixedFiles(content, scopedCode)
        merged = mergeGeneratedCode(code, result)
      }
    } else {
      const result = parseFixedFiles(content, scopedCode)
      merged = mergeGeneratedCode(code, result)
    }
    // LLM 修復後再跑一輪靜態 repair，防止 Haiku 引入新問題
    const applyRepairs = (f: GeneratedComponent) => {
      let current = f
      const h = repairHookShadowing(current)
      if (h.repaired) current = { ...current, content: h.content }
      const r = repairUndeclaredRefs(current)
      if (r.repaired) current = { ...current, content: r.content }
      return current
    }
    return {
      ...merged,
      pages: merged.pages.map(applyRepairs),
      components: merged.components.map(applyRepairs),
    }
  } catch (error) {
    logger.error({ err: error }, 'autoFix 失敗')
    return null
  }
}

/**
 * 解析 LLM 修復結果，合併回原始代碼結構
 */
function parseFixedFiles(content: string, originalCode: GeneratedCode): GeneratedCode {
  const tsxRegex = /`{3,}tsx:([^\n]+)\n([\s\S]*?)`{3,}/g
  const cssRegex = /`{3,}css:([^\n]+)\n([\s\S]*?)`{3,}/g

  const fixedPages = new Map<string, string>()
  const fixedComponents = new Map<string, string>()
  let fixedStyles = ''

  let match
  while ((match = tsxRegex.exec(content)) !== null) {
    const path = match[1].trim()
    const fileContent = match[2].trim()

    // 判斷是 page 還是 component
    if (originalCode.pages.some(p => p.path === path)) {
      fixedPages.set(path, fileContent)
    } else {
      fixedComponents.set(path, fileContent)
    }
  }

  while ((match = cssRegex.exec(content)) !== null) {
    fixedStyles = match[2].trim()
  }

  return {
    pages: originalCode.pages.map(p => ({
      ...p,
      content: fixedPages.get(p.path) || p.content,
    })),
    components: originalCode.components.map(c => ({
      ...c,
      content: fixedComponents.get(c.path) || c.content,
    })),
    styles: fixedStyles || originalCode.styles,
  }
}
