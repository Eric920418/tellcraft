// ============================================================
// L8：hasConflictMarker — 偵測 LLM 在 SEARCH/REPLACE 模式下吐出的 git conflict marker
// ============================================================

import { describe, it, expect } from 'vitest'
import { hasConflictMarker } from '../services/coder-generation'

describe('hasConflictMarker', () => {
  it('行首 7 個 < → true', () => {
    const code = 'function foo() {\n<<<<<<< HEAD\n  return 1\n}'
    expect(hasConflictMarker(code)).toBe(true)
  })

  it('行首 7 個 = → true', () => {
    const code = '  return 1\n=======\n  return 2\n>>>>>>> branch'
    expect(hasConflictMarker(code)).toBe(true)
  })

  it('行首 7 個 > → true', () => {
    const code = '  return 1\n>>>>>>> REPLACE'
    expect(hasConflictMarker(code)).toBe(true)
  })

  it('完整 conflict block → true', () => {
    const code = `function foo() {
<<<<<<< HEAD
  return 1
=======
  return 2
>>>>>>> branch
}`
    expect(hasConflictMarker(code)).toBe(true)
  })

  it('行首在文件第一行也能偵測', () => {
    expect(hasConflictMarker('<<<<<<< HEAD\nfoo')).toBe(true)
  })

  it('正常 React/TS 代碼 → false', () => {
    const code = `import { useState } from 'react'
export default function Page() {
  const [count, setCount] = useState(0)
  return <div>{count}</div>
}`
    expect(hasConflictMarker(code)).toBe(false)
  })

  it('JSX comparison `<` 算子 → false（不是行首 7 個連續）', () => {
    const code = `function foo() {
  return a < b && b > c
}`
    expect(hasConflictMarker(code)).toBe(false)
  })

  it('markdown 文字含 `<<<` 但不到 7 個 → false', () => {
    const code = `// 註解：<<< 表示 in
const x = 1`
    expect(hasConflictMarker(code)).toBe(false)
  })

  it('行中間有 7 個連續 `<` 但不在行首 → false', () => {
    const code = `const arrow = '<<<<<<<' // 字串字面值`
    expect(hasConflictMarker(code)).toBe(false)
  })

  it('恰好 6 個 `<` → false（git 標準是 7 個）', () => {
    const code = '<<<<<< NotAMarker\nfoo'
    expect(hasConflictMarker(code)).toBe(false)
  })

  it('空字串 → false', () => {
    expect(hasConflictMarker('')).toBe(false)
  })

  it('回退 marker 後跟 = → 仍偵測（防 LLM 變種）', () => {
    const code = '<<<<<<<\n======\n>>>>>>> '
    expect(hasConflictMarker(code)).toBe(true)
  })
})
