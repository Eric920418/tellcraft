import { describe, it, expect } from 'vitest'
import { tryParseRefineDiff, parseSearchReplaceBlocks, applySearchReplace } from '../services/uiux-generation'

function makeBaseCode() {
  return {
    pages: [{
      path: 'app/page.tsx',
      content: `export default function Page() {
  return (
    <div className="bg-white p-4">
      <h1 className="text-2xl">Hello</h1>
    </div>
  )
}`,
      description: 'home',
    }],
    components: [{
      path: 'components/Button.tsx',
      content: `export function Button() {
  return <button className="bg-blue-500 text-white">Click</button>
}`,
      description: 'button',
    }],
    styles: '@import "tailwindcss";\n',
  }
}

describe('tryParseRefineDiff (P6)', () => {
  it('沒有 SR block → 回 null（呼叫端 fallback）', () => {
    const result = tryParseRefineDiff('```tsx:app/page.tsx\n// full file\n```', makeBaseCode())
    expect(result).toBeNull()
  })

  it('有 SR block 且套用成功 → 回 RefinePatchSet', () => {
    const llmOutput = `<<<<<<< SEARCH:app/page.tsx
      <h1 className="text-2xl">Hello</h1>
=======
      <h1 className="text-3xl">Hi there</h1>
>>>>>>> REPLACE`
    const result = tryParseRefineDiff(llmOutput, makeBaseCode())
    expect(result).not.toBeNull()
    expect(result?.appliedCount).toBe(1)
    expect(result?.patches.modifiedPages.size).toBe(1)
    expect(result?.patches.modifiedPages.get('app/page.tsx')).toContain('text-3xl')
    expect(result?.patches.modifiedPages.get('app/page.tsx')).toContain('Hi there')
  })

  it('SR block 全部失敗（SEARCH 找不到）→ 回 null fallback', () => {
    const llmOutput = `<<<<<<< SEARCH:app/page.tsx
      <h1 className="DOES-NOT-EXIST">Wrong</h1>
=======
      <h1>x</h1>
>>>>>>> REPLACE`
    const result = tryParseRefineDiff(llmOutput, makeBaseCode())
    expect(result).toBeNull()
  })

  it('CSS modify 經由 SR block', () => {
    const llmOutput = `<<<<<<< SEARCH:globals.css
@import "tailwindcss";
=======
@import "tailwindcss";

.custom { color: red; }
>>>>>>> REPLACE`
    const result = tryParseRefineDiff(llmOutput, makeBaseCode())
    expect(result).not.toBeNull()
    expect(result?.patches.modifiedStyles).toContain('.custom')
  })

  it('component 修改 → 進 modifiedComponents（不是 modifiedPages）', () => {
    const llmOutput = `<<<<<<< SEARCH:components/Button.tsx
  return <button className="bg-blue-500 text-white">Click</button>
=======
  return <button className="bg-green-500 text-white">Confirm</button>
>>>>>>> REPLACE`
    const result = tryParseRefineDiff(llmOutput, makeBaseCode())
    expect(result?.patches.modifiedComponents.size).toBe(1)
    expect(result?.patches.modifiedPages.size).toBe(0)
    expect(result?.patches.modifiedComponents.get('components/Button.tsx')).toContain('bg-green-500')
  })

  it('CREATE 新檔（SEARCH 留空）', () => {
    const llmOutput = `<<<<<<< CREATE:components/NewWidget.tsx

=======
export function NewWidget() {
  return <div>new</div>
}
>>>>>>> REPLACE`
    const result = tryParseRefineDiff(llmOutput, makeBaseCode())
    expect(result?.appliedCount).toBe(1)
    expect(result?.patches.modifiedComponents.has('components/NewWidget.tsx')).toBe(true)
  })

  it('部分成功（一個對一個錯）→ 套用成功的，failedCount=1', () => {
    const llmOutput = `<<<<<<< SEARCH:app/page.tsx
      <h1 className="text-2xl">Hello</h1>
=======
      <h1 className="text-4xl">Big</h1>
>>>>>>> REPLACE

<<<<<<< SEARCH:components/Button.tsx
NOT-FOUND-IN-SOURCE
=======
nope
>>>>>>> REPLACE`
    const result = tryParseRefineDiff(llmOutput, makeBaseCode())
    expect(result).not.toBeNull()
    expect(result?.appliedCount).toBe(1)
    expect(result?.failedCount).toBe(1)
    expect(result?.patches.modifiedPages.get('app/page.tsx')).toContain('text-4xl')
  })

  it('既有 parseSearchReplaceBlocks 仍能用（向後相容）', () => {
    const llmOutput = `<<<<<<< SEARCH:a.tsx
old
=======
new
>>>>>>> REPLACE`
    const blocks = parseSearchReplaceBlocks(llmOutput)
    expect(blocks?.length).toBe(1)
    expect(blocks?.[0].filePath).toBe('a.tsx')
  })

  it('SR 多處匹配 → applySearchReplace 拒絕替換（既有規則保留）', () => {
    const baseWithDuplicate = {
      pages: [{
        path: 'app/page.tsx',
        content: `<button>X</button>\n<button>X</button>`,
        description: '',
      }],
      components: [],
      styles: '',
    }
    const llmOutput = `<<<<<<< SEARCH:app/page.tsx
<button>X</button>
=======
<button>Y</button>
>>>>>>> REPLACE`
    const blocks = parseSearchReplaceBlocks(llmOutput)!
    const result = applySearchReplace(baseWithDuplicate, blocks)
    // 多處匹配 → 失敗
    expect(result.failedBlocks.length).toBe(1)
    expect(result.appliedCount).toBe(0)
  })
})
