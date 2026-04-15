import { describe, it, expect } from 'vitest'
import { validatePreviewBatch } from '../services/preview-gate'
import type { GeneratedCode } from '../types/flow-state'

function code(files: Array<{ path: string; content: string; isPage?: boolean }>): GeneratedCode {
  return {
    pages: files.filter(f => f.isPage).map(f => ({ path: f.path, content: f.content, description: '' })),
    components: files.filter(f => !f.isPage).map(f => ({ path: f.path, content: f.content, description: '' })),
    styles: '',
  }
}

describe('validatePreviewBatch', () => {
  // ============================================================
  // 正向 case：合法代碼應該全部通過
  // ============================================================

  it('空的 code (無任何檔案) → ok: true', async () => {
    const result = await validatePreviewBatch({ pages: [], components: [], styles: '' })
    expect(result.ok).toBe(true)
    expect(result.failed).toHaveLength(0)
    expect(result.checkedFiles).toBe(0)
  })

  it('簡單合法 page 元件 → pass', async () => {
    const result = await validatePreviewBatch(code([
      { path: 'app/page.tsx', isPage: true, content: `export default function Page() { return <div>Hello</div> }` },
    ]))
    expect(result.ok).toBe(true)
    expect(result.failed).toHaveLength(0)
  })

  it('完整含 hooks / import 的 client component → pass', async () => {
    const result = await validatePreviewBatch(code([
      { path: 'app/page.tsx', isPage: true, content: `'use client'
import { useState } from 'react'
export default function Page() {
  const [n, setN] = useState(0)
  return <button onClick={() => setN(n+1)}>{n}</button>
}` },
    ]))
    expect(result.ok).toBe(true)
  })

  it('多個合法 component 並行驗證 → all pass', async () => {
    const files = Array.from({ length: 20 }, (_, i) => ({
      path: `components/Comp${i}.tsx`,
      content: `export default function Comp${i}() { return <span>comp-${i}</span> }`,
    }))
    const result = await validatePreviewBatch(code(files))
    expect(result.ok).toBe(true)
    expect(result.checkedFiles).toBe(20)
  })

  it('CSS / JSON 檔案應跳過 (validateComponentSyntax 忽略)', async () => {
    const result = await validatePreviewBatch(code([
      { path: 'app/globals.css', content: 'body { color: red; } @invalid-css-rule { }' },
    ]))
    // CSS 不被 esbuild 驗證，直接視為通過
    expect(result.ok).toBe(true)
  })

  // ============================================================
  // 負向 case：壞代碼應該被攔下
  // ============================================================

  it('未閉合 JSX 標籤 → fail', async () => {
    const result = await validatePreviewBatch(code([
      { path: 'app/page.tsx', isPage: true, content: `export default function Page() { return <div>unclosed }` },
    ]))
    expect(result.ok).toBe(false)
    expect(result.failed).toHaveLength(1)
    expect(result.failed[0].path).toBe('app/page.tsx')
  })

  it('JSX 屬性缺等號 → fail', async () => {
    const result = await validatePreviewBatch(code([
      { path: 'app/page.tsx', isPage: true, content: `export default function Page() { return <div className"broken">x</div> }` },
    ]))
    expect(result.ok).toBe(false)
  })

  it('function body 缺右大括號 → fail', async () => {
    const result = await validatePreviewBatch(code([
      { path: 'app/page.tsx', isPage: true, content: `export default function Page() { return <div>a</div>` },
    ]))
    expect(result.ok).toBe(false)
  })

  it('import 語法錯誤 → fail', async () => {
    const result = await validatePreviewBatch(code([
      { path: 'components/X.tsx', content: `import { from 'react'
export default function X() { return <div/> }` },
    ]))
    expect(result.ok).toBe(false)
  })

  it('一個壞檔案混在多個好檔案中 → ok:false，只 failed 那個', async () => {
    const result = await validatePreviewBatch(code([
      { path: 'app/page.tsx', isPage: true, content: `export default function P(){ return <div/> }` },
      { path: 'components/Bad.tsx', content: `export default function Bad(){ return <div` },
      { path: 'components/Good.tsx', content: `export default function Good(){ return <span/> }` },
    ]))
    expect(result.ok).toBe(false)
    expect(result.failed).toHaveLength(1)
    expect(result.failed[0].path).toBe('components/Bad.tsx')
  })

  it('壞代碼的 errors 欄位應有內容供修復參考', async () => {
    const result = await validatePreviewBatch(code([
      { path: 'app/page.tsx', isPage: true, content: `export default function P(){ return <` },
    ]))
    expect(result.ok).toBe(false)
    expect(result.failed[0].errors.length).toBeGreaterThan(0)
    expect(result.failed[0].errors.join(' ')).toMatch(/./)
  })

  // ============================================================
  // 效能 sanity check
  // ============================================================

  it('100 個檔案並行驗證應在 5 秒內完成 (native esbuild)', async () => {
    const files = Array.from({ length: 100 }, (_, i) => ({
      path: `components/Many${i}.tsx`,
      content: `export default function M${i}() { return <div>many-${i}</div> }`,
    }))
    const result = await validatePreviewBatch(code(files))
    expect(result.ok).toBe(true)
    expect(result.durationMs).toBeLessThan(5000)
  })
})
