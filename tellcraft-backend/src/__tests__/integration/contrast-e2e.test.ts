/**
 * Contrast E2E integration test
 * 驗證 R9 治本 4 層協同：
 *   1. deriveButtonPairs 注入 DesignSystem 派生 token
 *   2. sanitizeCodeForDeploy 整合 autoSwapButtonContrast 修按鈕對比
 *   3. 跑兩次 idempotent
 *   4. 真實 R9 incident fixture（bg-yellow-400 text-white CTA）端到端確認被修
 */
import { describe, it, expect } from 'vitest'
import { sanitizeCodeForDeploy } from '../../services/deployer'
import { autoSwapButtonContrast } from '../../services/deployer-fixes/contrast-auto-swap'
import { deriveButtonPairs } from '../../services/contrast-pairing'
import { hex as wcagHex } from 'wcag-contrast'

const R9_INCIDENT_PAGE = `
import Link from 'next/link'

export default function Home() {
  return (
    <main>
      <section className="hero bg-primary py-20">
        <h1 className="text-4xl font-bold text-white">毛孩樂園</h1>
        <button className="bg-yellow-400 text-white px-6 py-3 rounded-full mt-6">
          立即預約
        </button>
        <a className="btn bg-amber-300 text-white ml-4">看更多</a>
      </section>
      <section className="bg-surface-2 py-12">
        <button className="bg-slate-900 text-white">已 safe 的按鈕</button>
      </section>
    </main>
  )
}
`

describe('R9 contrast e2e — 4 層架構協同', () => {
  it('full pipeline: derive → sanitize 修 yellow button → idempotent', () => {
    // Layer 1: 派生 DS buttonContrast
    const palette = {
      primary: '#3b82f6', secondary: '#8b5cf6', accent: '#f59e0b',
      background: '#ffffff', foreground: '#0f172a', muted: '#64748b',
      border: '#e2e8f0', surface1: '#ffffff', surface2: '#f1f5f9', surface3: '#e2e8f0',
    }
    const pairs = deriveButtonPairs(palette)
    expect(pairs.onPrimary).toBeDefined()
    expect(pairs.onSecondary).toBeDefined()
    expect(pairs.onAccent).toBeDefined()

    // Layer 3: sanitize 跑 autoSwap
    const code = {
      pages: [{ path: 'app/page.tsx', content: R9_INCIDENT_PAGE, description: '' }],
      components: [],
      styles: '',
    }
    const ds = { colorPalette: { ...palette, buttonContrast: pairs } } as Parameters<typeof sanitizeCodeForDeploy>[1]
    const result = sanitizeCodeForDeploy(code, ds)

    // yellow button 應被 swap
    const contrastFixes = result.fixes.filter(f => f.startsWith('contrast auto-swap:'))
    expect(contrastFixes.length).toBeGreaterThan(0)

    // 確認 page content 不含 'bg-yellow-400 text-white' 配對
    const newContent = result.code.pages[0].content
    expect(newContent).toContain('bg-yellow-400')  // bg 保留
    // text-white 不該再跟 bg-yellow-400 同 className（已被 swap）
    expect(newContent).toMatch(/bg-yellow-400\s+text-slate-900/)
    // bg-slate-900 + text-white 安全，不該被動
    expect(newContent).toContain('bg-slate-900 text-white')
  })

  it('idempotent: sanitize 兩次第二次 0 contrast swap', () => {
    const code = {
      pages: [{ path: 'app/page.tsx', content: R9_INCIDENT_PAGE, description: '' }],
      components: [],
      styles: '',
    }
    const first = sanitizeCodeForDeploy(code)
    const firstSwaps = first.fixes.filter(f => f.startsWith('contrast auto-swap:'))
    expect(firstSwaps.length).toBeGreaterThan(0)

    const second = sanitizeCodeForDeploy(first.code)
    const secondSwaps = second.fixes.filter(f => f.startsWith('contrast auto-swap:'))
    expect(secondSwaps.length).toBe(0)
  })

  it('100% 保證 spec: 所有 button 最終 ratio 都 ≥ 4.5（除 unsafe fallback 例外）', () => {
    const code = {
      pages: [{ path: 'app/page.tsx', content: R9_INCIDENT_PAGE, description: '' }],
      components: [],
      styles: '',
    }
    const result = sanitizeCodeForDeploy(code)
    const final = result.code.pages[0].content

    // 從修改後 content 找所有 <button|<a class*="btn"> 算 ratio
    const buttonMatches = [...final.matchAll(/<(button|a)\b[^>]*?className=["']([^"']+)["']/g)]
    let allButtonsSafe = true
    let unsafeCount = 0
    for (const m of buttonMatches) {
      const cls = m[2]
      const bg = cls.match(/\b(bg-\S+)/)?.[1]
      const text = cls.match(/\btext-([\w-]+)\b/)?.[1]
      if (!bg || !text) continue
      // 簡單 case: Tailwind 標準色才能直接算
      try {
        const bgHex = simpleResolve(bg.replace('bg-', ''))
        const fgHex = simpleResolve(text)
        if (!bgHex || !fgHex) continue
        const ratio = wcagHex(bgHex, fgHex)
        if (ratio < 4.5) {
          unsafeCount++
          allButtonsSafe = false
        }
      } catch { /* skip 無法解析的 */ }
    }
    // 期望：unsafe fallback 應該記錄在 result.fixes ⚠ contrast unsafe 條目
    if (!allButtonsSafe) {
      const unsafeWarnings = result.fixes.filter(f => f.startsWith('⚠ contrast unsafe:'))
      expect(unsafeWarnings.length).toBeGreaterThanOrEqual(unsafeCount)
    }
  })
})

// 簡化版 resolve（只 cover test fixture 用到的色）
function simpleResolve(token: string): string | null {
  const MAP: Record<string, string> = {
    'white': '#ffffff',
    'slate-900': '#0f172a',
    'slate-50': '#f8fafc',
    'yellow-400': '#facc15',
    'amber-300': '#fcd34d',
    'amber-500': '#f59e0b',
    'blue-500': '#3b82f6',
  }
  return MAP[token] ?? null
}
