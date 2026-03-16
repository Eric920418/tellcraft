/**
 * Quality Gate Service
 * 自動化品質檢查：A11y / Performance / Code Quality
 * 基於 regex/字串匹配的靜態分析，發現 critical 問題時用 LLM 自動修復
 */

import { getAnthropicClient, MODEL, trackLlmUsage } from '../lib/anthropic'
import { GeneratedComponent, repairUndeclaredRefs, repairHookShadowing } from './uiux-generation'
import { createLogger } from '../lib/logger'

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

    // 檢查互動元素是否有 focus-visible
    const hasInteractive = content.includes('<button') || content.includes('<a ')
    if (hasInteractive && !content.includes('focus-visible') && !content.includes('focus:')) {
      issues.push({
        id: `a11y-${++issueCounter}`,
        category: 'a11y',
        severity: 'critical',
        rule: 'focus-visible',
        message: '互動元素缺少可見的 focus 狀態',
        file: file.path,
        suggestion: '加入 focus-visible:ring-2 focus-visible:ring-offset-2',
      })
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

    // 檢查動畫時長過長（> 500ms）
    issues.push(...scanLines(content, file.path, /duration[:-]\[?(\d+)ms/i, (match, line) => {
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
  }

  return issues
}

// ============================================================
// Checker 3: Code Quality
// ============================================================

function checkCodeQuality(code: GeneratedCode, _designTier?: DesignTier): QualityIssue[] {
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
        severity: 'warning',
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

  for (const file of code.components) {
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

export function runQualityGate(code: GeneratedCode, designTier?: DesignTier, moodId?: string): QualityReport {
  // 並行執行 checkers
  const a11yIssues = checkAccessibility(code)
  const perfIssues = checkPerformance(code)
  const cqIssues = checkCodeQuality(code, designTier)
  const contrastIssues = checkColorContrast(code, moodId)
  const idIssues = checkIdUniqueness(code)

  const allA11yIssues = [...a11yIssues, ...contrastIssues]
  const allCqIssues = [...cqIssues, ...idIssues]
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
    default:
      return content
  }
}

export function autoFixCriticalIssuesRuleBased(
  code: GeneratedCode,
  issues: QualityIssue[]
): GeneratedCode | null {
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
  trackingContext?: { userId?: string; conversationId?: string }
): Promise<GeneratedCode | null> {
  const client = getAnthropicClient()
  const scopedCode = pickIssueScopedCode(code, issues)

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

  const prompt = `你是程式碼修復專家。以下是前端程式碼和需要修復的品質問題清單。

## 規則
1. **只修復列出的問題**，不要改變任何設計、佈局、功能或樣式
2. 保持所有現有代碼結構不變
3. 輸出修復後的完整檔案（與原始格式相同的 \`\`\`tsx:path 或 \`\`\`css:path 代碼塊）
4. 動畫庫用 motion/react（不是 framer-motion）
5. 字體載入用 next/font（不用 <link> 或 @import Google Fonts）
6. Tailwind v4 用 @import "tailwindcss"（不用 @tailwind）

## 需要修復的問題
${issueList}

## 原始代碼
${codeBlocks.join('\n\n')}

請輸出修復後的所有檔案（保持相同的 \`\`\`tsx:filepath 格式）。`

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

    // 解析修復後的檔案
    const result = parseFixedFiles(content, scopedCode)
    const merged = mergeGeneratedCode(code, result)
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
