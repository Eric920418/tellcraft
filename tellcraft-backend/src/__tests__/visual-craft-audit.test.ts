import { describe, it, expect } from 'vitest'
import { auditVisualCraft, isCraftIssue } from '../services/visual-craft-audit'
import type { GeneratedCode } from '../types/flow-state'

const mkCode = (pages: { path: string; content: string }[], components: { path: string; content: string }[] = []): GeneratedCode => ({
  pages: pages.map(p => ({ ...p, description: '' })),
  components: components.map(c => ({ ...c, description: '' })),
  styles: '',
})

// ============================================================
// Typographic Rhythm
// ============================================================

describe('typographic rhythm', () => {
  it('flags extreme jumps (text-xs + text-9xl)', () => {
    const code = mkCode([
      { path: 'app/page.tsx', content: '<div className="text-xs"></div><h1 className="text-9xl">Hi</h1><p className="text-base">x</p>' },
    ])
    const result = auditVisualCraft(code)
    expect(result.issues.some(i => i.rule === 'craft-typographic-rhythm')).toBe(true)
  })

  it('passes on healthy ratios (text-base / text-lg / text-2xl)', () => {
    const code = mkCode([
      { path: 'app/page.tsx', content: '<h1 className="text-2xl">Hi</h1><h2 className="text-lg">x</h2><p className="text-base">y</p><h1>main</h1>' },
    ])
    const result = auditVisualCraft(code)
    expect(result.issues.filter(i => i.rule === 'craft-typographic-rhythm')).toHaveLength(0)
  })

  it('skips check when < 3 distinct sizes', () => {
    const code = mkCode([
      { path: 'app/page.tsx', content: '<p className="text-base">a</p><p className="text-lg">b</p><h1>c</h1>' },
    ])
    const result = auditVisualCraft(code)
    expect(result.issues.filter(i => i.rule === 'craft-typographic-rhythm')).toHaveLength(0)
  })
})

// ============================================================
// Vertical Rhythm
// ============================================================

describe('vertical rhythm', () => {
  it('flags ≥ 3 off-base spacings', () => {
    const code = mkCode([
      // 3 個不同的 off-base 值（0.5=2px、1.5=6px、再用 arbitrary [6px]）
      { path: 'app/page.tsx', content: '<div className="py-0.5"><div className="my-1.5"><div className="space-y-[6px]"><div className="gap-0.5"><h1>x</h1></div></div></div></div>' },
    ])
    const result = auditVisualCraft(code)
    expect(result.issues.some(i => i.rule === 'craft-vertical-rhythm')).toBe(true)
  })

  it('passes on standard 4px-multiple values', () => {
    const code = mkCode([
      { path: 'app/page.tsx', content: '<div className="py-4"><div className="my-8"><div className="space-y-2"><h1>x</h1></div></div></div>' },
    ])
    const result = auditVisualCraft(code)
    expect(result.issues.filter(i => i.rule === 'craft-vertical-rhythm')).toHaveLength(0)
  })
})

// ============================================================
// White Space Ratio
// ============================================================

describe('white space ratio', () => {
  it('flags hero page with insufficient py', () => {
    const code = mkCode([
      { path: 'app/page.tsx', content: '<section className="py-4"><h1>Hero</h1></section>' },
    ])
    const result = auditVisualCraft(code)
    const issue = result.issues.find(i => i.rule === 'craft-white-space')
    expect(issue).toBeDefined()
    expect(issue?.message).toContain('hero / landing 應 ≥ py-16')
  })

  it('passes hero with py-24', () => {
    const code = mkCode([
      { path: 'app/page.tsx', content: '<section className="py-24"><h1>Hero</h1></section>' },
    ])
    const result = auditVisualCraft(code)
    expect(result.issues.filter(i => i.rule === 'craft-white-space')).toHaveLength(0)
  })

  it('component files are skipped', () => {
    const code = mkCode([], [
      { path: 'components/Card.tsx', content: '<div className="py-1">x</div>' },
    ])
    const result = auditVisualCraft(code)
    expect(result.issues.filter(i => i.rule === 'craft-white-space')).toHaveLength(0)
  })
})

// ============================================================
// Heading Anchor Density
// ============================================================

describe('heading anchor density', () => {
  it('flags page missing <h1>', () => {
    const code = mkCode([
      { path: 'app/page.tsx', content: '<section className="py-24"><p>no heading</p></section>' },
    ])
    const result = auditVisualCraft(code)
    expect(result.issues.some(i => i.rule === 'craft-heading-anchor' && i.message.includes('缺少'))).toBe(true)
  })

  it('flags multiple <h1>', () => {
    const code = mkCode([
      { path: 'app/page.tsx', content: '<div className="py-24"><h1>A</h1><h1>B</h1><h1>C</h1></div>' },
    ])
    const result = auditVisualCraft(code)
    expect(result.issues.some(i => i.rule === 'craft-heading-anchor' && i.message.includes('3 個 <h1>'))).toBe(true)
  })

  it('flags many sections without enough headings', () => {
    const code = mkCode([
      { path: 'app/page.tsx', content: '<div className="py-24"><h1>Title</h1><section>a</section><section>b</section><section>c</section><section>d</section></div>' },
    ])
    const result = auditVisualCraft(code)
    const sectionIssue = result.issues.find(i => i.rule === 'craft-heading-anchor' && i.message.includes('section'))
    expect(sectionIssue).toBeDefined()
  })

  it('passes well-structured page', () => {
    const code = mkCode([
      { path: 'app/page.tsx', content: '<div className="py-24"><h1>Main</h1><section><h2>A</h2></section><section><h2>B</h2></section></div>' },
    ])
    const result = auditVisualCraft(code)
    expect(result.issues.filter(i => i.rule === 'craft-heading-anchor')).toHaveLength(0)
  })
})

// ============================================================
// isCraftIssue
// ============================================================

describe('isCraftIssue', () => {
  it('returns true for craft- prefix', () => {
    expect(isCraftIssue({ id: '1', category: 'code_quality', severity: 'info', rule: 'craft-typographic-rhythm', message: '', file: '' })).toBe(true)
  })

  it('returns false for non-craft', () => {
    expect(isCraftIssue({ id: '1', category: 'code_quality', severity: 'info', rule: 'consistency-spacing', message: '', file: '' })).toBe(false)
  })
})

// ============================================================
// Integration: runQualityGate includes craft issues
// ============================================================

describe('integration with runQualityGate', () => {
  it('craft issues flow through to QualityReport', async () => {
    const { runQualityGate } = await import('../services/quality-gate')
    const code = mkCode([
      { path: 'app/page.tsx', content: '<section className="py-2"><p>no h1</p></section>' },  // 觸發 white-space + heading
    ])
    const report = runQualityGate(code, 'functional')
    const craftIssues = report.categories.code_quality.issues.filter(i => i.rule.startsWith('craft-'))
    expect(craftIssues.length).toBeGreaterThan(0)
  })
})
