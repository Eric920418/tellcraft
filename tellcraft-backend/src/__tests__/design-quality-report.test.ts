import { describe, it, expect } from 'vitest'
import { generateDesignQualityReport } from '../services/design-quality-report'
import type { QualityReport, QualityIssue } from '../services/quality-gate'

function makeIssue(partial: Partial<QualityIssue> & { rule: string; severity: QualityIssue['severity'] }): QualityIssue {
  return {
    id: partial.id ?? `issue-${Math.random().toString(36).slice(2)}`,
    category: partial.category ?? 'code_quality',
    severity: partial.severity,
    rule: partial.rule,
    file: partial.file ?? 'app/page.tsx',
    message: partial.message ?? 'msg',
    suggestion: partial.suggestion,
  }
}

function makeReport(issues: QualityIssue[]): QualityReport {
  const a11y = issues.filter(i => i.category === 'a11y')
  const perf = issues.filter(i => i.category === 'performance')
  const cq = issues.filter(i => i.category === 'code_quality')
  return {
    passed: issues.every(i => i.severity !== 'critical'),
    timestamp: new Date().toISOString(),
    summary: {
      total: issues.length,
      critical: issues.filter(i => i.severity === 'critical').length,
      warning: issues.filter(i => i.severity === 'warning').length,
      info: issues.filter(i => i.severity === 'info').length,
      autoFixed: 0,
    },
    categories: {
      a11y: { passed: a11y.every(i => i.severity !== 'critical'), issues: a11y },
      performance: { passed: perf.every(i => i.severity !== 'critical'), issues: perf },
      code_quality: { passed: cq.every(i => i.severity !== 'critical'), issues: cq },
    },
  }
}

describe('generateDesignQualityReport', () => {
  it('零 issue 全部 100 分', () => {
    const dq = generateDesignQualityReport(makeReport([]))
    expect(dq.overallScore).toBe(100)
    expect(dq.dimensionScores.consistency).toBe(100)
    expect(dq.dimensionScores.accessibility).toBe(100)
    expect(dq.dimensionScores.taskExecution).toBe(100)
    expect(dq.dimensionScores.codeQuality).toBe(100)
    expect(dq.fixPlan).toHaveLength(0)
  })

  it('consistency-* rule 進入 consistency 維度', () => {
    const dq = generateDesignQualityReport(makeReport([
      makeIssue({ rule: 'consistency-gray-shades', severity: 'warning', category: 'code_quality' }),
    ]))
    expect(dq.issuesByDimension.consistency).toHaveLength(1)
    expect(dq.issuesByDimension.codeQuality).toHaveLength(0)
    expect(dq.dimensionScores.consistency).toBe(95)  // 100 - 5
  })

  it('a11y issue（非 consistency-）進入 accessibility 維度', () => {
    const dq = generateDesignQualityReport(makeReport([
      makeIssue({ rule: 'contrast-ratio', severity: 'critical', category: 'a11y' }),
    ]))
    expect(dq.issuesByDimension.accessibility).toHaveLength(1)
    expect(dq.dimensionScores.accessibility).toBe(80)  // 100 - 20
  })

  it('critical 扣 20，warning 扣 5，info 扣 1', () => {
    const dq = generateDesignQualityReport(makeReport([
      makeIssue({ rule: 'consistency-gray-shades', severity: 'critical', category: 'code_quality' }),
      makeIssue({ rule: 'consistency-radii', severity: 'warning', category: 'code_quality' }),
    ]))
    expect(dq.dimensionScores.consistency).toBe(75)  // 100 - 20 - 5
  })

  it('overallScore 是加權平均（accessibility 35%）', () => {
    const dq = generateDesignQualityReport(makeReport([
      makeIssue({ rule: 'contrast-ratio', severity: 'critical', category: 'a11y' }),  // accessibility -20
    ]))
    // accessibility=80, others=100
    // 80*0.35 + 100*0.25 + 100*0.25 + 100*0.15 = 28 + 25 + 25 + 15 = 93
    expect(dq.overallScore).toBe(93)
  })

  it('fixPlan critical 標 critical priority', () => {
    const dq = generateDesignQualityReport(makeReport([
      makeIssue({ rule: 'contrast-ratio', severity: 'critical', category: 'a11y', id: 'x1' }),
    ]))
    const criticalPlan = dq.fixPlan.find(p => p.priority === 'critical')
    expect(criticalPlan).toBeDefined()
    expect(criticalPlan?.dimension).toBe('accessibility')
    expect(criticalPlan?.issueIds).toContain('x1')
  })

  it('accessibility warning 視為 high priority（非 medium）', () => {
    const dq = generateDesignQualityReport(makeReport([
      makeIssue({ rule: 'contrast-ratio-aa', severity: 'warning', category: 'a11y' }),
    ]))
    const plan = dq.fixPlan.find(p => p.dimension === 'accessibility')
    expect(plan?.priority).toBe('high')
  })

  it('codeQuality warning 是 medium priority', () => {
    const dq = generateDesignQualityReport(makeReport([
      makeIssue({ rule: 'no-h-screen', severity: 'warning', category: 'code_quality' }),
    ]))
    const plan = dq.fixPlan.find(p => p.dimension === 'codeQuality')
    expect(plan?.priority).toBe('medium')
  })

  it('taskFailedIssues 注入 taskExecution 維度', () => {
    const dq = generateDesignQualityReport(makeReport([]), {
      taskFailedIssues: [
        { id: 't1', severity: 'critical', description: 'CTA 找不到', route: '/' },
      ],
    })
    expect(dq.issuesByDimension.taskExecution).toHaveLength(1)
    expect(dq.dimensionScores.taskExecution).toBe(80)
  })

  it('成績不會低於 0', () => {
    const issues = Array.from({ length: 20 }, (_, i) => makeIssue({
      rule: 'consistency-radii',
      severity: 'critical',
      category: 'code_quality',
      id: `x${i}`,
    }))
    const dq = generateDesignQualityReport(makeReport(issues))
    expect(dq.dimensionScores.consistency).toBe(0)
    expect(dq.overallScore).toBeGreaterThanOrEqual(0)
  })

  it('generatedAt 是 ISO 8601 字串', () => {
    const dq = generateDesignQualityReport(makeReport([]))
    expect(dq.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})
