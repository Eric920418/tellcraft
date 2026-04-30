import { describe, it, expect } from 'vitest'
import { auditCssConsistency, isConsistencyIssue } from '../services/css-consistency-audit'
import type { GeneratedCode } from '../types/flow-state'

function makeCode(files: Array<{ path: string; content: string }>): GeneratedCode {
  return {
    pages: files.filter(f => f.path.startsWith('app/')).map(f => ({ path: f.path, content: f.content, description: '' })),
    components: files.filter(f => !f.path.startsWith('app/')).map(f => ({ path: f.path, content: f.content, description: '' })),
    styles: '',
  }
}

describe('css-consistency-audit', () => {
  it('空代碼不 crash 且無 issue', () => {
    const result = auditCssConsistency(makeCode([]))
    expect(result.issues).toHaveLength(0)
    expect(result.global.grayCount).toBe(0)
  })

  it('per-file 灰階 ≥4 種 → warning', () => {
    const code = makeCode([{
      path: 'app/page.tsx',
      content: `<div className="bg-gray-100 text-gray-200 border-gray-300 ring-gray-400">x</div>`,
    }])
    const result = auditCssConsistency(code)
    const grayIssue = result.issues.find(i => i.rule === 'consistency-gray-shades')
    expect(grayIssue).toBeDefined()
    expect(grayIssue?.severity).toBe('warning')
    expect(grayIssue?.message).toContain('4 種灰色')
  })

  it('混合 family（slate + gray + zinc）也算成多種灰', () => {
    const code = makeCode([{
      path: 'app/page.tsx',
      content: `<div className="bg-slate-100 text-gray-300 border-zinc-500 ring-neutral-700">x</div>`,
    }])
    const result = auditCssConsistency(code)
    expect(result.perFile[0].grayCount).toBe(4)
  })

  it('per-file 字級 ≥6 種 → warning', () => {
    const code = makeCode([{
      path: 'app/page.tsx',
      content: `
        <h1 className="text-xs">a</h1>
        <h2 className="text-sm">b</h2>
        <h3 className="text-base">c</h3>
        <h4 className="text-lg">d</h4>
        <h5 className="text-2xl">e</h5>
        <h6 className="text-4xl">f</h6>
      `,
    }])
    const result = auditCssConsistency(code)
    const issue = result.issues.find(i => i.rule === 'consistency-font-sizes')
    expect(issue).toBeDefined()
    expect(issue?.severity).toBe('warning')
  })

  it('text-red-500 等色彩 class 不被誤判為字級', () => {
    const code = makeCode([{
      path: 'app/page.tsx',
      content: `<p className="text-red-500 text-blue-600 text-green-700">x</p>`,
    }])
    const result = auditCssConsistency(code)
    expect(result.perFile[0].fontSizeCount).toBe(0)
  })

  it('per-file 圓角 ≥4 種 → warning', () => {
    const code = makeCode([{
      path: 'app/page.tsx',
      content: `
        <div className="rounded-sm">a</div>
        <div className="rounded-md">b</div>
        <div className="rounded-lg">c</div>
        <div className="rounded-full">d</div>
      `,
    }])
    const result = auditCssConsistency(code)
    const issue = result.issues.find(i => i.rule === 'consistency-radii')
    expect(issue).toBeDefined()
  })

  it('per-file shadow ≥4 種 → warning', () => {
    const code = makeCode([{
      path: 'app/page.tsx',
      content: `
        <div className="shadow-sm">a</div>
        <div className="shadow-md">b</div>
        <div className="shadow-lg">c</div>
        <div className="shadow-2xl">d</div>
      `,
    }])
    const result = auditCssConsistency(code)
    const issue = result.issues.find(i => i.rule === 'consistency-shadows')
    expect(issue).toBeDefined()
  })

  it('全站 ≥8 種灰色 → critical global issue', () => {
    const files = Array.from({ length: 8 }, (_, i) => ({
      path: `app/p${i}.tsx`,
      content: `<div className="bg-gray-${(i + 1) * 100}">x</div>`,
    }))
    const result = auditCssConsistency(makeCode(files))
    const globalIssue = result.issues.find(i => i.rule === 'consistency-gray-shades-global')
    expect(globalIssue).toBeDefined()
    expect(globalIssue?.severity).toBe('critical')
  })

  it('合理的設計（3 灰 + 3 圓角 + 4 字級）不產 issue', () => {
    const code = makeCode([{
      path: 'app/page.tsx',
      content: `
        <div className="bg-slate-50 text-slate-900 border-slate-200">
          <h1 className="text-4xl">Title</h1>
          <p className="text-base">Body</p>
          <small className="text-sm">Caption</small>
          <button className="rounded-md">Action</button>
          <div className="rounded-lg">Card</div>
          <span className="rounded-full">Pill</span>
          <span className="text-xs">Meta</span>
        </div>
      `,
    }])
    const result = auditCssConsistency(code)
    const issues = result.issues.filter(i => i.rule.startsWith('consistency-'))
    expect(issues).toHaveLength(0)
  })

  it('isConsistencyIssue 正確分辨', () => {
    expect(isConsistencyIssue({
      id: 'x', category: 'code_quality', severity: 'warning',
      rule: 'consistency-gray-shades', file: 'a', message: 'm',
    })).toBe(true)
    expect(isConsistencyIssue({
      id: 'x', category: 'code_quality', severity: 'warning',
      rule: 'no-h-screen', file: 'a', message: 'm',
    })).toBe(false)
  })
})
