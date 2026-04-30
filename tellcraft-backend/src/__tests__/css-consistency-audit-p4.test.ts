import { describe, it, expect } from 'vitest'
import { auditCssConsistency } from '../services/css-consistency-audit'
import type { GeneratedCode } from '../types/flow-state'

function makeCode(files: Array<{ path: string; content: string }>): GeneratedCode {
  return {
    pages: files.filter(f => f.path.startsWith('app/')).map(f => ({ path: f.path, content: f.content, description: '' })),
    components: files.filter(f => !f.path.startsWith('app/')).map(f => ({ path: f.path, content: f.content, description: '' })),
    styles: '',
  }
}

describe('P4 spacing 一致性', () => {
  it('per-file 5 種 spacing → 不報', () => {
    const code = makeCode([{
      path: 'app/page.tsx',
      content: `
        <div className="p-2">a</div>
        <div className="p-4">b</div>
        <div className="m-6">c</div>
        <div className="gap-8">d</div>
        <div className="px-12">e</div>
      `,
    }])
    const result = auditCssConsistency(code)
    expect(result.issues.find(i => i.rule === 'consistency-spacing')).toBeUndefined()
  })

  it('per-file 6 種 spacing → warning', () => {
    const code = makeCode([{
      path: 'app/page.tsx',
      content: `
        <div className="p-1">a</div>
        <div className="p-2">b</div>
        <div className="p-3">c</div>
        <div className="m-4">d</div>
        <div className="m-5">e</div>
        <div className="gap-6">f</div>
      `,
    }])
    const result = auditCssConsistency(code)
    const issue = result.issues.find(i => i.rule === 'consistency-spacing')
    expect(issue).toBeDefined()
    expect(issue?.severity).toBe('warning')
    expect(issue?.message).toContain('6 種 spacing')
  })

  it('arbitrary value [1.5rem] 也算一種', () => {
    const code = makeCode([{
      path: 'app/page.tsx',
      content: `<div className="p-[1.5rem] p-[2rem] p-[2.5rem]">x</div>`,
    }])
    const result = auditCssConsistency(code)
    expect(result.perFile[0].spacingCount).toBe(3)
  })

  it('全站 ≥10 種 spacing → critical global', () => {
    const files = Array.from({ length: 6 }, (_, i) => ({
      path: `app/p${i}.tsx`,
      content: `<div className="p-${i + 1} m-${i + 5}">x</div>`,
    }))
    const result = auditCssConsistency(makeCode(files))
    const issue = result.issues.find(i => i.rule === 'consistency-spacing-global')
    expect(issue).toBeDefined()
    expect(issue?.severity).toBe('critical')
  })
})

describe('P4 button variant 跨頁比對', () => {
  it('全站 3 種 button 變體 → 不報', () => {
    const code = makeCode([{
      path: 'app/page.tsx',
      content: `
        <button className="bg-blue-600 text-white p-3 rounded-md font-bold">Primary</button>
        <button className="bg-gray-100 text-gray-900 p-3 rounded-md font-medium">Secondary</button>
        <a className="bg-transparent text-blue-600 p-2 rounded-none font-normal">Ghost</a>
      `,
    }])
    const result = auditCssConsistency(code)
    expect(result.global.buttonVariantCount).toBe(3)
    expect(result.issues.find(i => i.rule === 'consistency-button-variants')).toBeUndefined()
  })

  it('全站 6 種 button 變體 → warning', () => {
    const code = makeCode([
      {
        path: 'app/p1.tsx',
        content: `
          <button className="bg-blue-500 text-white p-2 rounded-md font-bold">A</button>
          <button className="bg-blue-600 text-white p-3 rounded-lg font-semibold">B</button>
          <button className="bg-blue-700 text-white p-4 rounded-xl font-medium">C</button>
        `,
      },
      {
        path: 'app/p2.tsx',
        content: `
          <button className="bg-red-500 text-white p-2 rounded-md font-bold">D</button>
          <button className="bg-green-500 text-white p-3 rounded-lg font-semibold">E</button>
          <button className="bg-purple-500 text-white p-4 rounded-xl font-medium">F</button>
        `,
      },
    ])
    const result = auditCssConsistency(code)
    expect(result.global.buttonVariantCount).toBe(6)
    const issue = result.issues.find(i => i.rule === 'consistency-button-variants')
    expect(issue).toBeDefined()
    expect(issue?.severity).toBe('warning')
  })

  it('全站 ≥10 種 button → critical 含具體範例', () => {
    const files = Array.from({ length: 10 }, (_, i) => ({
      path: `app/p${i}.tsx`,
      content: `<button className="bg-blue-${(i + 1) * 100} text-white p-${i + 1} rounded-md font-bold">${i}</button>`,
    }))
    const result = auditCssConsistency(makeCode(files))
    const issue = result.issues.find(i => i.rule === 'consistency-button-variants')
    expect(issue?.severity).toBe('critical')
    expect(issue?.suggestion).toContain('範例變體')
  })

  it('hover:/focus: variant prefix 被剝除（同預設狀態算同 fingerprint）', () => {
    const code = makeCode([{
      path: 'app/page.tsx',
      content: `
        <button className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-md font-bold">A</button>
        <button className="bg-blue-600 focus:bg-blue-800 text-white p-3 rounded-md font-bold">B</button>
      `,
    }])
    const result = auditCssConsistency(code)
    // 兩者預設狀態相同 → 1 種 fingerprint
    expect(result.global.buttonVariantCount).toBe(1)
  })

  it('全空 fingerprint（無 bg/text/padding/rounded/fontWeight）不算', () => {
    const code = makeCode([{
      path: 'app/page.tsx',
      content: `<button className="block">x</button>`,
    }])
    const result = auditCssConsistency(code)
    expect(result.global.buttonVariantCount).toBe(0)
  })
})
