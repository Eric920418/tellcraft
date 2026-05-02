/**
 * Design Token Compliance Audit (Phase D)
 *
 * 檢查代碼是否使用 DesignSystem 定義範圍外的色號。違反 → critical 阻塞部署。
 *
 * 為什麼用色族展開（family expand）而非精確比對：
 *   - DesignSystem 通常只指定基準 shade（primary='#A855F7' ≈ purple-500）
 *   - LLM 寫 hover state 自然會用 purple-700/800
 *   - 把整個色族視為合規 → 不會誤殺常見用法 → 降低 critical 阻塞用戶的機率
 *
 * 規則 prefix design-token-*，不擴 QualityCategory enum
 *   （沿用 css-consistency-audit consistency-* 模式，避免前端/telemetry 級聯改動）
 *
 * 用戶決策：硬性 critical（修不好阻塞部署）。提供 state.uiuxDesignTokenOverride 強制覆寫逃生口。
 */

import type { DesignSystem } from './uiux-generation'
import type { QualityIssue } from './quality-gate'
import { expandColorFamily, findClosestTailwindToken, resolveColor } from './tailwind-color-resolver'
import { createLogger } from '../lib/logger'

const logger = createLogger('design-token-compliance')

export interface FilePayload {
  path: string
  content: string
}

/**
 * 從 DesignSystem 計算允許的 Tailwind class token 集合。
 */
export function computeAllowedColorTokens(ds: DesignSystem): Set<string> {
  const allowed = new Set<string>()
  const cp = ds.colorPalette ?? {}

  for (const t of ['white', 'black', 'transparent', 'current', 'inherit']) {
    allowed.add(t)
  }

  const hexValues: string[] = []
  for (const v of Object.values(cp)) {
    if (typeof v === 'string' && /^#[0-9a-f]{3,8}$/i.test(v)) hexValues.push(v)
  }
  for (const hex of hexValues) {
    const closest = findClosestTailwindToken(hex)
    if (!closest) continue
    if (['white', 'black'].includes(closest)) {
      allowed.add(closest)
      continue
    }
    for (const t of expandColorFamily(closest)) {
      allowed.add(t)
    }
  }

  const customColors = ds.tailwindExtend?.colors ?? {}
  for (const aliasKey of Object.keys(customColors)) {
    allowed.add(aliasKey)
  }

  return allowed
}

const COLOR_CLASS_REGEX = /\b(?:bg|text|border|from|to|via|ring|divide|placeholder|fill|stroke)-([a-z]+(?:-\d+)?(?:\/[\d.]+)?|\[[^\]]+\])/g

function extractColorTokens(content: string): Array<{ raw: string; key: string; line: number }> {
  const out: Array<{ raw: string; key: string; line: number }> = []
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const tokenRegex = new RegExp(COLOR_CLASS_REGEX.source, 'g')
    let m: RegExpExecArray | null
    while ((m = tokenRegex.exec(line)) !== null) {
      const raw = m[0]
      const noVariant = raw.replace(/^([a-z-]+:)+/, '')
      const noOpacity = noVariant.replace(/\/[\d.]+$/, '').replace(/\/\[[\d.]+\]$/, '')
      const keyMatch = noOpacity.match(/^(?:bg|text|border|from|to|via|ring|divide|placeholder|fill|stroke)-(.+)$/)
      const key = keyMatch ? keyMatch[1] : noOpacity
      out.push({ raw, key, line: i + 1 })
    }
  }
  return out
}

function isTokenCompliant(key: string, allowed: Set<string>): boolean {
  if (allowed.has(key)) return true
  if (/^\[.*\]$/.test(key)) return true
  if (resolveColor(`bg-${key}`) === null) return true
  return false
}

export interface DesignTokenAuditResult {
  issues: QualityIssue[]
  scannedCount: number
  violationCount: number
}

export function auditDesignTokenCompliance(
  files: FilePayload[],
  designSystem: DesignSystem,
): DesignTokenAuditResult {
  const allowed = computeAllowedColorTokens(designSystem)
  const issues: QualityIssue[] = []
  let scannedCount = 0

  for (const file of files) {
    if (!/\.(tsx?|jsx?|css)$/.test(file.path)) continue
    const tokens = extractColorTokens(file.content)
    scannedCount += tokens.length
    const seenInFile = new Set<string>()
    for (const t of tokens) {
      if (isTokenCompliant(t.key, allowed)) continue
      const dedupKey = t.key
      if (seenInFile.has(dedupKey)) continue
      seenInFile.add(dedupKey)
      issues.push({
        id: `design-token-${file.path}-${t.line}-${t.key}`,
        category: 'code_quality',
        severity: 'critical',
        rule: 'design-token-out-of-palette',
        message: `色號 \`${t.raw}\` 不在 DesignSystem 允許範圍內。允許色族：${Array.from(allowed).filter(a => a.includes('-')).slice(0, 6).join(', ')}...`,
        file: file.path,
        line: t.line,
        suggestion: `改用 DesignSystem 已定義的色號（DesignSystem.colorPalette 對應的 Tailwind 色族），或將此色加進 designSystem.colorPalette。`,
      })
    }
  }

  logger.info({
    scannedCount,
    violationCount: issues.length,
    allowedSize: allowed.size,
  }, 'design-token-compliance audit')

  return {
    issues,
    scannedCount,
    violationCount: issues.length,
  }
}
