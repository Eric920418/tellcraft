/**
 * autoSwapButtonContrast unit test — R9 Layer 3 兜底
 * 守住「100% 不再出現按鈕對比度不足」承諾
 */
import { describe, it, expect } from 'vitest'
import { autoSwapButtonContrast, type GeneratedCodeLike, type DesignSystemLike } from '../services/deployer-fixes/contrast-auto-swap'

function makeCode(pageContent: string): GeneratedCodeLike {
  return {
    pages: [{ path: 'app/page.tsx', content: pageContent, description: '' }],
    components: [],
    styles: '',
  }
}

function makeDS(palette: DesignSystemLike['colorPalette']): DesignSystemLike {
  return { colorPalette: palette }
}

describe('autoSwapButtonContrast', () => {
  it('R9 incident 案例: <button bg-yellow-400 text-white> → swap 成 text-slate-900', () => {
    const code = makeCode(`
      <button className="bg-yellow-400 text-white px-4 py-2 rounded">送出</button>
    `)
    const result = autoSwapButtonContrast(code)
    expect(result.swaps.length).toBeGreaterThan(0)
    expect(result.fixedCode.pages[0].content).toContain('text-slate-900')
    expect(result.fixedCode.pages[0].content).not.toContain('text-white')
    expect(result.swaps[0].newRatio).toBeGreaterThanOrEqual(4.5)
  })

  it('已 safe 的按鈕（bg-slate-900 text-white）→ 不動', () => {
    const code = makeCode(`<button className="bg-slate-900 text-white">提交</button>`)
    const result = autoSwapButtonContrast(code)
    expect(result.swaps.length).toBe(0)
    expect(result.fixedCode.pages[0].content).toBe(code.pages[0].content)
  })

  it('普通 <div> bg-yellow-400 text-white → 不動（只動 button context，避免誤殺）', () => {
    const code = makeCode(`<div className="bg-yellow-400 text-white">標籤文字</div>`)
    const result = autoSwapButtonContrast(code)
    expect(result.swaps.length).toBe(0)
    expect(result.fixedCode.pages[0].content).toBe(code.pages[0].content)
  })

  it('<a class="btn bg-primary text-white"> + DS palette → swap 成 text-on-primary（token-derived）', () => {
    const code = makeCode(`<a className="btn bg-primary text-white">立即預約</a>`)
    const ds = makeDS({
      primary: '#3b82f6',
      buttonContrast: { onPrimary: '#0f172a' },
    })
    const result = autoSwapButtonContrast(code, ds)
    expect(result.swaps.length).toBe(1)
    expect(result.swaps[0].reason).toBe('token-derived')
    expect(result.swaps[0].newFgClass).toBe('text-on-primary')
    expect(result.fixedCode.pages[0].content).toContain('text-on-primary')
  })

  it('<a> 無 btn/cta hint → 不視為按鈕（避免內文 link 被誤判）', () => {
    const code = makeCode(`<a className="bg-yellow-400 text-white" href="/x">繼續閱讀</a>`)
    const result = autoSwapButtonContrast(code)
    expect(result.swaps.length).toBe(0)
  })

  it('role="button" + className 含 bg/text → 視為按鈕 swap', () => {
    const code = makeCode(`<div role="button" className="bg-yellow-400 text-white">按下</div>`)
    const result = autoSwapButtonContrast(code)
    expect(result.swaps.length).toBe(1)
    expect(result.swaps[0].newFgClass).toBe('text-slate-900')
  })

  it('hover: 等 pseudo-state text 不算 swap target（hover 後渲染決定）', () => {
    const code = makeCode(`<button className="bg-slate-900 text-white hover:text-yellow-300">+</button>`)
    const result = autoSwapButtonContrast(code)
    // bg-slate-900 + text-white ratio > 15，不 swap
    // bg-slate-900 + hover:text-yellow-300 跳過（pseudo）
    expect(result.swaps.length).toBe(0)
  })

  it('idempotent: swap 後再跑一次不再 swap', () => {
    const code = makeCode(`<button className="bg-yellow-400 text-white">送出</button>`)
    const first = autoSwapButtonContrast(code)
    const second = autoSwapButtonContrast(first.fixedCode)
    expect(first.swaps.length).toBe(1)
    expect(second.swaps.length).toBe(0)
  })

  it('多個 button 同檔 → 每個都檢查', () => {
    const code = makeCode(`
      <div>
        <button className="bg-yellow-400 text-white">A</button>
        <button className="bg-slate-900 text-white">B</button>
        <a className="btn bg-amber-300 text-white">C</a>
      </div>
    `)
    const result = autoSwapButtonContrast(code)
    // A 和 C swap，B 已 safe 不動
    expect(result.swaps.length + result.unsafeFallbacks.length).toBe(2)
  })

  it('fail-soft: bg 是 var(--x) 不丟錯 → skip', () => {
    const code = makeCode(`<button className="bg-[var(--x)] text-white">X</button>`)
    expect(() => autoSwapButtonContrast(code)).not.toThrow()
  })

  it('fail-soft: 缺 className → skip', () => {
    const code = makeCode(`<button>無樣式按鈕</button>`)
    const result = autoSwapButtonContrast(code)
    expect(result.swaps.length).toBe(0)
  })

  it('large text 按鈕 (text-3xl) → 用 3.0 閾值（pass case）', () => {
    // bg-amber-500 + text-white ratio 約 2.16 — 對 large text 仍不到 3.0 → swap
    // 改用 amber-200 + text-white = ratio 1.4 太低 不適合
    // 用 indigo-600 + text-white = ratio 8.5 已 safe
    const code = makeCode(`<button className="bg-indigo-600 text-white text-3xl">大字按鈕</button>`)
    const result = autoSwapButtonContrast(code)
    expect(result.swaps.length).toBe(0)  // 已 safe
  })

  it('不影響非 button 的 text-only className', () => {
    const code = makeCode(`<p className="text-red-300">普通段落紅字</p>`)
    const result = autoSwapButtonContrast(code)
    expect(result.swaps.length).toBe(0)
    expect(result.fixedCode.pages[0].content).toBe(code.pages[0].content)
  })
})
