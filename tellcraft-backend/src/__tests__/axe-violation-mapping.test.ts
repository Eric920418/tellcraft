import { describe, expect, it } from 'vitest'
import { axeViolationToIssue, type AxeViolation } from '../services/ui-evaluator'

describe('axe-core violation → UiEvaluationIssue mapping', () => {
  const baseViolation: AxeViolation = {
    id: 'color-contrast',
    impact: 'serious',
    description: 'Elements must have sufficient color contrast',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/color-contrast',
    nodes: [
      { target: ['main', '.hero-cta'], failureSummary: 'Fix any of the following: Element has insufficient color contrast' },
    ],
  }

  it('maps axe critical → Tellcraft critical', () => {
    const issue = axeViolationToIssue({ ...baseViolation, impact: 'critical' }, '/')
    expect(issue.severity).toBe('critical')
  })

  it('maps axe serious → Tellcraft critical', () => {
    const issue = axeViolationToIssue({ ...baseViolation, impact: 'serious' }, '/')
    expect(issue.severity).toBe('critical')
  })

  it('maps axe moderate → Tellcraft warning', () => {
    const issue = axeViolationToIssue({ ...baseViolation, impact: 'moderate' }, '/')
    expect(issue.severity).toBe('warning')
  })

  it('maps axe minor → Tellcraft warning', () => {
    const issue = axeViolationToIssue({ ...baseViolation, impact: 'minor' }, '/')
    expect(issue.severity).toBe('warning')
  })

  it('maps axe null impact → Tellcraft warning (defensive)', () => {
    const issue = axeViolationToIssue({ ...baseViolation, impact: null }, '/')
    expect(issue.severity).toBe('warning')
  })

  it('uses visual_regression category to keep enum pure', () => {
    const issue = axeViolationToIssue(baseViolation, '/')
    expect(issue.category).toBe('visual_regression')
  })

  it('prefixes description with [a11y/<rule-id>] for downstream filtering', () => {
    const issue = axeViolationToIssue(baseViolation, '/pricing')
    expect(issue.description.startsWith('[a11y/color-contrast]')).toBe(true)
    expect(issue.description).toContain('Elements must have sufficient color contrast')
  })

  it('includes target selector path for actionable feedback', () => {
    const issue = axeViolationToIssue(baseViolation, '/')
    expect(issue.description).toContain('main > .hero-cta')
  })

  it('preserves route', () => {
    const issue = axeViolationToIssue(baseViolation, '/blog/post-1')
    expect(issue.route).toBe('/blog/post-1')
  })

  it('handles empty nodes (defensive)', () => {
    const issue = axeViolationToIssue({ ...baseViolation, nodes: [] }, '/')
    expect(issue.description).toContain('?')  // fallback selector
  })
})
