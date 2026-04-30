import { describe, it, expect } from 'vitest'
import { runQualityGate } from '../services/quality-gate'
import { resolveColor, extractBgAndText, isLargeText } from '../services/tailwind-color-resolver'
import type { GeneratedCode } from '../types/flow-state'

function makeCode(content: string): GeneratedCode {
  return {
    pages: [{ path: 'app/page.tsx', content, description: '' }],
    components: [],
    styles: '',
  }
}

describe('tailwind-color-resolver', () => {
  it('resolveColor 解析標準 token', () => {
    expect(resolveColor('bg-white')).toBe('#ffffff')
    expect(resolveColor('text-slate-900')).toBe('#0f172a')
    expect(resolveColor('bg-blue-500')).toBe('#3b82f6')
    expect(resolveColor('border-red-200')).toBe('#fecaca')
  })

  it('resolveColor 處理 arbitrary value', () => {
    expect(resolveColor('bg-[#ff0000]')).toBe('#ff0000')
    expect(resolveColor('text-[#abc]')).toBe('#abc')
  })

  it('resolveColor 處理透明度後綴', () => {
    expect(resolveColor('bg-slate-900/50')).toBe('#0f172a')
    expect(resolveColor('text-white/80')).toBe('#ffffff')
  })

  it('resolveColor 對 transparent/current 回 null', () => {
    expect(resolveColor('bg-transparent')).toBeNull()
    expect(resolveColor('text-current')).toBeNull()
  })

  it('resolveColor 對未知 token 回 null', () => {
    expect(resolveColor('bg-foreground')).toBeNull()
    expect(resolveColor('text-primary')).toBeNull()
    expect(resolveColor('not-a-class')).toBeNull()
  })

  it('extractBgAndText 抽取 bg + text，剝除 variant prefix', () => {
    const result = extractBgAndText('p-4 bg-slate-900 hover:bg-slate-800 text-white md:text-lg')
    expect(result.bg).toContain('bg-slate-900')
    expect(result.bg).toContain('bg-slate-800')
    expect(result.text).toContain('text-white')
    expect(result.text).toContain('text-lg')
  })

  it('isLargeText 偵測 ≥text-xl', () => {
    expect(isLargeText('text-xl')).toBe(true)
    expect(isLargeText('text-2xl font-bold')).toBe(true)
    expect(isLargeText('text-base')).toBe(false)
    expect(isLargeText('text-lg font-bold')).toBe(true)
    expect(isLargeText('text-lg')).toBe(false)
  })
})

describe('runQualityGate contrast (P1 真實 luminance)', () => {
  it('bg-yellow-200 + text-yellow-300 對比極低 → critical', () => {
    const code = makeCode(`<div className="bg-yellow-200 text-yellow-300">low</div>`)
    const report = runQualityGate(code)
    const critical = report.categories.a11y.issues.filter(i => i.rule === 'contrast-ratio')
    expect(critical.length).toBeGreaterThanOrEqual(1)
    expect(critical[0].severity).toBe('critical')
    expect(critical[0].message).toMatch(/對比度.*低於/)
  })

  it('bg-slate-900 + text-white 對比極高 → 不報', () => {
    const code = makeCode(`<div className="bg-slate-900 text-white">ok</div>`)
    const report = runQualityGate(code)
    const contrastIssues = report.categories.a11y.issues.filter(i => i.rule.startsWith('contrast-ratio'))
    expect(contrastIssues).toHaveLength(0)
  })

  it('arbitrary #888 灰文字 + 白底 ≈3.58:1 → 非 large text → warning AA', () => {
    // ratio between #888 and #fff ≈ 3.58 (在 3.0~4.5 之間)
    const code = makeCode(`<p className="bg-white text-[#888888]">small</p>`)
    const report = runQualityGate(code)
    const aaWarnings = report.categories.a11y.issues.filter(i => i.rule === 'contrast-ratio-aa')
    expect(aaWarnings.length).toBeGreaterThanOrEqual(1)
    expect(aaWarnings[0].severity).toBe('warning')
  })

  it('arbitrary #888 + 白底 + text-2xl → large text 閾值 3.0 → 不報', () => {
    const code = makeCode(`<h2 className="bg-white text-[#888888] text-2xl">heading</h2>`)
    const report = runQualityGate(code)
    const aaWarnings = report.categories.a11y.issues.filter(i => i.rule === 'contrast-ratio-aa')
    expect(aaWarnings).toHaveLength(0)
  })

  it('bg-white + text-gray-400 對比 ≈2.85:1 → critical（低於 3.0 即使 large text 也不過）', () => {
    const code = makeCode(`<p className="bg-white text-gray-400">x</p>`)
    const report = runQualityGate(code)
    const critical = report.categories.a11y.issues.filter(i => i.rule === 'contrast-ratio')
    expect(critical.length).toBeGreaterThanOrEqual(1)
  })

  it('未解析的自訂 token（bg-foreground）不誤報', () => {
    const code = makeCode(`<div className="bg-foreground text-background">x</div>`)
    const report = runQualityGate(code)
    const ratioIssues = report.categories.a11y.issues.filter(i => i.rule.startsWith('contrast-ratio'))
    expect(ratioIssues).toHaveLength(0)
  })

  it('arbitrary value 也能算對比', () => {
    const code = makeCode(`<div className="bg-[#fff8e1] text-[#fce38f]">low</div>`)
    const report = runQualityGate(code)
    const ratioIssues = report.categories.a11y.issues.filter(i => i.rule === 'contrast-ratio')
    expect(ratioIssues.length).toBeGreaterThanOrEqual(1)
  })

  it('per-file 上限 3 個 ratio issue（避免 autofix prompt 爆量）', () => {
    const lines = Array.from({ length: 10 }, (_, i) =>
      `<div className="bg-yellow-${(i % 3 + 1) * 100} text-yellow-${(i % 3 + 2) * 100}">${i}</div>`
    ).join('\n')
    const code = makeCode(lines)
    const report = runQualityGate(code)
    const ratioIssues = report.categories.a11y.issues.filter(i => i.rule.startsWith('contrast-ratio'))
    expect(ratioIssues.length).toBeLessThanOrEqual(3)
  })
})
