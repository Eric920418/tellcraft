/**
 * contrast-pairing 純函式 unit test
 * 守住按鈕對比度 deterministic 派生的所有 edge case
 */
import { describe, it, expect } from 'vitest'
import {
  pickReadableForeground,
  deriveButtonPairs,
  computeClassNameContrast,
  resolveBgFromClass,
} from '../services/contrast-pairing'

describe('pickReadableForeground', () => {
  it('white bg → 選 slate-900（white fg ratio 1）', () => {
    const result = pickReadableForeground('#ffffff')
    expect(result.hex).toBe('#0f172a')
    expect(result.tailwindToken).toBe('slate-900')
    expect(result.safe).toBe(true)
    expect(result.ratio).toBeGreaterThan(15)
  })

  it('yellow-400 bg → 選 slate-900（white 對 yellow ratio 不到 4.5）', () => {
    const result = pickReadableForeground('#facc15')
    expect(result.hex).toBe('#0f172a')
    expect(result.safe).toBe(true)
    expect(result.ratio).toBeGreaterThanOrEqual(4.5)
  })

  it('slate-800 深 bg → 選 white', () => {
    const result = pickReadableForeground('#1e293b')
    expect(result.hex).toBe('#ffffff')
    expect(result.tailwindToken).toBe('white')
    expect(result.safe).toBe(true)
  })

  it('blue-500 primary bg → 自動派生 slate-900（safe ratio 4.85）解 R9 incident', () => {
    // R9 incident 根因：LLM 自己選 text-white 配 blue-500 ratio=3.68 < 4.5
    // 治本：deriveButtonPairs 派生 slate-900 fg 自動 safe（ratio 4.85）
    // → Layer 2 prompt 強制 LLM 用 text-on-primary 而非 text-white 即治本
    const result = pickReadableForeground('#3b82f6')
    expect(result.hex).toBe('#0f172a')
    expect(result.safe).toBe(true)
    expect(result.ratio).toBeGreaterThan(4.5)
  })

  it('短 hex #fff → 自動展開且工作', () => {
    const result = pickReadableForeground('#fff')
    expect(result.hex).toBe('#0f172a')
    expect(result.safe).toBe(true)
  })

  it('fail-soft: var(--x) → 不丟錯 + return slate-900 unsafe', () => {
    const result = pickReadableForeground('var(--primary)')
    expect(result.hex).toBe('#0f172a')
    expect(result.safe).toBe(false)
  })

  it('fail-soft: null/空 → 不丟錯', () => {
    const result = pickReadableForeground('')
    expect(result.hex).toBe('#0f172a')
    expect(result.safe).toBe(false)
  })

  it('fail-soft: 亂碼 → 不丟錯', () => {
    const result = pickReadableForeground('not-a-color')
    expect(result.safe).toBe(false)
  })

  it('hex 8 字 + alpha → 剝 alpha 後算（用深 bg 確保 safe）', () => {
    const result = pickReadableForeground('#1e293bff')  // slate-800 + alpha
    expect(result.hex).toBe('#ffffff')
    expect(result.safe).toBe(true)
  })

  it('無 # 前綴 → 自動補', () => {
    const result = pickReadableForeground('facc15')
    expect(result.hex).toBe('#0f172a')
    expect(result.safe).toBe(true)
  })

  it('極淡 cyan-100 bg → 仍能找到 safe fg（slate-900）', () => {
    const result = pickReadableForeground('#cffafe')
    expect(result.hex).toBe('#0f172a')
    expect(result.safe).toBe(true)
  })
})

describe('deriveButtonPairs', () => {
  it('完整 palette → 用真實 WCAG 演算法決定 fg', () => {
    // 用深 primary 確保 safe（避免 mid-saturation 陷阱）
    const pairs = deriveButtonPairs({
      primary: '#1d4ed8',  // blue-700 對 white ratio 7.7+
      secondary: '#7c3aed',  // violet-600 對 white ratio 5+
      accent: '#f59e0b',  // amber-500 對 white < 4.5 → fallback slate-900
    })
    expect(pairs.onPrimary).toBe('#ffffff')
    expect(pairs.onSecondary).toBe('#ffffff')
    expect(pairs.onAccent).toBe('#0f172a')
  })

  it('含 optional 色 → 派生對應 pair（mid-sat 色取 slate-900 fallback）', () => {
    const pairs = deriveButtonPairs({
      primary: '#3b82f6',  // blue-500 mid-sat
      secondary: '#8b5cf6',  // violet-500 mid-sat
      accent: '#f59e0b',
      destructive: '#ef4444',  // red-500 mid-sat
      success: '#10b981',
      surface1: '#ffffff',
      surface2: '#f1f5f9',
      surface3: '#e2e8f0',
    })
    // mid-sat 色對 white 都不到 4.5 → 取 ratio 較高的 slate-900
    expect(pairs.onPrimary).toBe('#0f172a')
    expect(pairs.onDestructive).toBe('#0f172a')
    expect(pairs.onSuccess).toBeDefined()
    // 淺色 surface → 必選深 fg
    expect(pairs.onSurface1).toBe('#0f172a')
    expect(pairs.onSurface2).toBe('#0f172a')
    expect(pairs.onSurface3).toBe('#0f172a')
  })

  it('fail-soft: 缺 primary → onPrimary fallback slate-900', () => {
    const pairs = deriveButtonPairs({
      secondary: '#8b5cf6',
      accent: '#f59e0b',
    })
    expect(pairs.onPrimary).toBe('#0f172a')
  })

  it('fail-soft: var() 值 → 不丟錯', () => {
    const pairs = deriveButtonPairs({
      primary: 'var(--brand)',
      secondary: '#8b5cf6',
      accent: '#f59e0b',
    })
    expect(pairs.onPrimary).toBe('#0f172a')
  })

  it('黃 primary（已知對比陷阱）→ onPrimary 必為深色不是 white', () => {
    const pairs = deriveButtonPairs({
      primary: '#fde047',  // yellow-300
      secondary: '#f59e0b',
      accent: '#ef4444',
    })
    expect(pairs.onPrimary).toBe('#0f172a')
  })
})

describe('computeClassNameContrast', () => {
  it('bg-slate-900 + text-white → ratio > 15', () => {
    const r = computeClassNameContrast('bg-slate-900', 'text-white')
    expect(r).toBeGreaterThan(15)
  })

  it('bg-yellow-400 + text-white → ratio < 4.5（這就是 R9 incident 案例）', () => {
    const r = computeClassNameContrast('bg-yellow-400', 'text-white')
    expect(r).not.toBeNull()
    expect(r!).toBeLessThan(4.5)
  })

  it('bg-primary + text-on-primary 用 DS palette 解析（R9: blue-500 on white < 4.5 的 incident 證明）', () => {
    // 這個 case 證明 R9 incident：LLM 選 primary=#3b82f6 配 text-white = ratio 3.68 < 4.5
    // pickReadableForeground / Layer 3 swap 看到此 ratio 會啟動兜底邏輯
    const r = computeClassNameContrast('bg-primary', 'text-on-primary', {
      primary: '#3b82f6',
      'on-primary': '#ffffff',
    })
    expect(r).not.toBeNull()
    expect(r!).toBeLessThan(4.5)  // 這就是 R9 incident — 看似 safe 實則不到 AA
  })

  it('正向 case: bg-primary 深色 + text-white → ratio > 4.5', () => {
    const r = computeClassNameContrast('bg-primary', 'text-on-primary', {
      primary: '#1d4ed8',  // blue-700
      'on-primary': '#ffffff',
    })
    expect(r).toBeGreaterThan(4.5)
  })

  it('未知 token → null（caller skip）', () => {
    const r = computeClassNameContrast('bg-foobar', 'text-white')
    expect(r).toBeNull()
  })
})

describe('resolveBgFromClass', () => {
  it('Tailwind 標準色', () => {
    expect(resolveBgFromClass('bg-slate-900')).toBe('#0f172a')
    expect(resolveBgFromClass('text-white')).toBe('#ffffff')
  })

  it('DS custom token kebab match', () => {
    expect(resolveBgFromClass('bg-primary', { primary: '#ff0000' })).toBe('#ff0000')
  })

  it('DS custom token camelCase match (buttonContrast.onPrimary)', () => {
    expect(resolveBgFromClass('text-on-primary', { onPrimary: '#ffffff' })).toBe('#ffffff')
  })

  it('未知 → null', () => {
    expect(resolveBgFromClass('bg-mystery')).toBeNull()
  })
})
