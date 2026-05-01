import { describe, it, expect } from 'vitest'
import {
  detectFeedbackAxes,
  diffReports,
  countIssuesForAxis,
  assessIteration,
  buildFailedToImproveMessage,
} from '../services/iteration-feedback-loop'
import type { QualityReport, QualityIssue } from '../services/quality-gate'

// ============================================================
// Fixtures
// ============================================================

const issue = (rule: string, file: string, severity: 'critical' | 'warning' = 'critical', message = ''): QualityIssue => ({
  id: `${file}-${rule}`,
  category: 'code_quality',
  severity,
  rule,
  message: message || `msg-${rule}`,
  file,
})

const report = (issues: QualityIssue[]): QualityReport => ({
  passed: issues.filter(i => i.severity === 'critical').length === 0,
  timestamp: new Date().toISOString(),
  summary: {
    total: issues.length,
    critical: issues.filter(i => i.severity === 'critical').length,
    warning: issues.filter(i => i.severity === 'warning').length,
    info: 0,
    autoFixed: 0,
  },
  categories: {
    a11y: { passed: true, issues: issues.filter(i => i.category === 'a11y') },
    performance: { passed: true, issues: issues.filter(i => i.category === 'performance') },
    code_quality: { passed: true, issues: issues.filter(i => i.category === 'code_quality') },
  },
})

// ============================================================
// detectFeedbackAxes
// ============================================================

describe('detectFeedbackAxes', () => {
  it.each([
    ['對比度太低看不清楚', ['contrast']],
    ['contrast is too low', ['contrast']],
    ['太擠了給點留白', ['spacing']],
    ['mobile 上滑不動', ['responsive']],
    ['字體太小了', ['size', 'font']],   // 「字」+ 「小」
    ['顏色不對', ['color']],
  ])('detects %s → %j', (text, expected) => {
    const found = detectFeedbackAxes(text)
    for (const axis of expected) {
      expect(found).toContain(axis)
    }
  })

  it('returns empty for unrelated feedback', () => {
    expect(detectFeedbackAxes('這個 Hero 文字改成大寫')).toEqual([])
  })
})

// ============================================================
// diffReports
// ============================================================

describe('diffReports', () => {
  it('classifies resolved / introduced / unchanged', () => {
    const before = report([
      issue('contrast', 'app/page.tsx', 'critical', 'low contrast'),
      issue('motion-import', 'components/Card.tsx'),
    ])
    const after = report([
      issue('contrast', 'app/page.tsx', 'critical', 'low contrast'),  // unchanged
      issue('focus-visible', 'app/page.tsx'),                          // introduced
      // motion-import resolved
    ])
    const diff = diffReports(before, after)
    expect(diff.resolvedCount).toBe(1)
    expect(diff.unchangedCount).toBe(1)
    expect(diff.introducedCount).toBe(1)
    expect(diff.netImprovement).toBe(0)
    expect(diff.resolved[0].rule).toBe('motion-import')
    expect(diff.introduced[0].rule).toBe('focus-visible')
  })

  it('handles null before (first iteration)', () => {
    const after = report([issue('contrast', 'app/page.tsx')])
    const diff = diffReports(null, after)
    expect(diff.resolvedCount).toBe(0)
    expect(diff.introducedCount).toBe(1)
  })

  it('handles null after', () => {
    const before = report([issue('contrast', 'app/page.tsx')])
    const diff = diffReports(before, null)
    expect(diff.resolvedCount).toBe(1)
    expect(diff.introducedCount).toBe(0)
  })

  it('issue identity ignores line numbers (same file+rule+msg = same)', () => {
    const before = report([{ ...issue('contrast', 'app/page.tsx'), line: 10 }])
    const after  = report([{ ...issue('contrast', 'app/page.tsx'), line: 42 }])  // same logical issue, different line
    const diff = diffReports(before, after)
    expect(diff.unchangedCount).toBe(1)
    expect(diff.resolvedCount).toBe(0)
  })
})

// ============================================================
// countIssuesForAxis
// ============================================================

describe('countIssuesForAxis', () => {
  it('counts contrast-axis issues', () => {
    const r = report([
      issue('contrast', 'a.tsx'),
      issue('color-contrast', 'b.tsx'),
      issue('motion-import', 'c.tsx'),  // 不算 contrast
    ])
    expect(countIssuesForAxis(r, 'contrast')).toBe(2)
  })

  it('returns 0 for unknown axis', () => {
    const r = report([issue('contrast', 'a.tsx')])
    expect(countIssuesForAxis(r, 'nonexistent_axis')).toBe(0)
  })

  it('returns 0 for null report', () => {
    expect(countIssuesForAxis(null, 'contrast')).toBe(0)
  })

  // ── Fix #4: warning 也要計入（visual-craft-audit / consistency-* 多數為 warning）──
  // 否則 T10 escalation 對「字體太擠/spacing 不一致」這類連續抱怨永遠不觸發逃離選項
  it('counts warning issues alongside critical (for warning-heavy audits like consistency-*)', () => {
    const r = report([
      issue('consistency-spacing', 'a.tsx', 'warning'),
      issue('consistency-spacing', 'b.tsx', 'warning'),
      issue('craft-vertical-rhythm', 'c.tsx', 'warning'),
      issue('motion-import', 'd.tsx', 'critical'),  // 不算 spacing 軸
    ])
    // spacing 軸：含 consistency-spacing → 應計到 2 個 warning（修前永遠是 0）
    expect(countIssuesForAxis(r, 'spacing')).toBeGreaterThanOrEqual(2)
  })

  it('info severity 不計入（保留排除）', () => {
    const r = report([
      issue('consistency-spacing', 'a.tsx', 'warning'),
      { ...issue('consistency-spacing', 'b.tsx', 'warning'), severity: 'info' as const },
    ])
    expect(countIssuesForAxis(r, 'spacing')).toBe(1)
  })
})

// ============================================================
// assessIteration
// ============================================================

describe('assessIteration', () => {
  it('improved=true when critical decreases', () => {
    const before = report([issue('contrast', 'a.tsx'), issue('motion', 'b.tsx')])
    const after = report([issue('contrast', 'a.tsx')])
    const result = assessIteration({
      before, after,
      feedback: '改個動畫',
      previousFailedCount: 0,
    })
    expect(result.improved).toBe(true)
    expect(result.shouldEscalate).toBe(false)
  })

  it('improved=false + flags failedToImproveCategory when contrast feedback but contrast not reduced', () => {
    const before = report([issue('contrast', 'a.tsx'), issue('motion', 'b.tsx')])
    const after  = report([issue('contrast', 'a.tsx')])  // motion removed but contrast 保留
    const result = assessIteration({
      before, after,
      feedback: '對比度還是太低看不清楚',
      previousFailedCount: 0,
    })
    expect(result.failedToImproveCategory).toBe('contrast')
  })

  it('improved=true even when feedback axis still has issues IF count actually decreased', () => {
    const before = report([
      issue('contrast', 'a.tsx', 'critical', 'msg-a'),
      issue('contrast', 'b.tsx', 'critical', 'msg-b'),
    ])
    const after = report([
      issue('contrast', 'a.tsx', 'critical', 'msg-a'),
    ])
    const result = assessIteration({
      before, after,
      feedback: '對比度太低',
      previousFailedCount: 0,
    })
    expect(result.failedToImproveCategory).toBeNull()  // 1 < 2，算改善
    expect(result.improved).toBe(true)
  })

  it('escalates after 2 consecutive failures', () => {
    const before = report([issue('contrast', 'a.tsx')])
    const after  = report([issue('contrast', 'a.tsx')])  // 沒改善
    const result = assessIteration({
      before, after,
      feedback: '對比度還是太低',
      previousFailedCount: 1,  // 第 2 次失敗
    })
    expect(result.shouldEscalate).toBe(true)
  })

  it('does not escalate on first failure', () => {
    const before = report([issue('contrast', 'a.tsx')])
    const after  = report([issue('contrast', 'a.tsx')])
    const result = assessIteration({
      before, after,
      feedback: '對比度太低',
      previousFailedCount: 0,
    })
    expect(result.shouldEscalate).toBe(false)
  })

  it('does not flag failedToImproveCategory when before has 0 such issues (no false positive)', () => {
    const before = report([])
    const after  = report([])
    const result = assessIteration({
      before, after,
      feedback: '對比度太低',
      previousFailedCount: 0,
    })
    expect(result.failedToImproveCategory).toBeNull()
  })
})

describe('buildFailedToImproveMessage', () => {
  it('translates axis to Chinese name', () => {
    expect(buildFailedToImproveMessage('contrast')).toContain('對比度')
    expect(buildFailedToImproveMessage('spacing')).toContain('間距')
    expect(buildFailedToImproveMessage('responsive')).toContain('響應式')
  })
})
