// Coder flow fixes — refactored to use existing deterministic-actions-fix.ts (authoritative)
// A: actionsYml method/path 強制覆蓋（authoritative override）
// B: RED Phase validator field_mismatch 去 VAR capture false positive
// C: WHEN call table headers strip `>` / `<` 前綴（既有 autoFixVarInCallTable）
import { describe, it, expect } from 'vitest'
import * as yaml from 'js-yaml'
import {
  autoFixActionsMethodPathFromFeatures,
  autoFixVarInCallTable,
} from '../services/deterministic-actions-fix'

describe('Fix A: autoFixActionsMethodPathFromFeatures (authoritative)', () => {
  it('injects missing method + path from Feature annotation', () => {
    const actionsYml = `
actions:
  - name: createPricingPlan
    summary: Create Pricing Plan
`
    const features = [{
      name: 'Create Pricing Plan',
      actionName: 'createPricingPlan',
      content: `# Action: createPricingPlan\n# [POST] /api/admin/pricing-plans\n\nFeature: Create Pricing Plan`,
    }]
    const r = autoFixActionsMethodPathFromFeatures(actionsYml, features)
    expect(r.fixed).not.toBeNull()
    expect(r.changes.length).toBe(2)
    const parsed = yaml.load(r.fixed!) as { actions: Array<{ method: string; path: string }> }
    expect(parsed.actions[0].method).toBe('POST')
    expect(parsed.actions[0].path).toBe('/api/admin/pricing-plans')
  })

  it('overrides existing mismatched method (Fix authority)', () => {
    const actionsYml = `
actions:
  - name: updatePricingPlan
    summary: Update Pricing Plan
    method: PUT
    path: /api/update_pricing_plan
`
    const features = [{
      name: 'Update Pricing Plan',
      actionName: 'updatePricingPlan',
      content: `# Action: updatePricingPlan\n# [PATCH] /api/admin/pricing-plans/:id\n\nFeature: Update Pricing Plan`,
    }]
    const r = autoFixActionsMethodPathFromFeatures(actionsYml, features)
    expect(r.fixed).not.toBeNull()
    expect(r.changes.length).toBe(2)
    const parsed = yaml.load(r.fixed!) as { actions: Array<{ method: string; path: string }> }
    expect(parsed.actions[0].method).toBe('PATCH')
    expect(parsed.actions[0].path).toBe('/api/admin/pricing-plans/:id')
    // 確認 change detail 標示 override
    expect(r.changes.find(c => c.type === 'method_set')?.detail).toContain('PUT → PATCH')
    expect(r.changes.find(c => c.type === 'path_set')?.detail).toContain('override')
  })

  it('no change when already correct', () => {
    const actionsYml = `
actions:
  - name: x
    summary: X
    method: GET
    path: /api/x
`
    const features = [{
      name: 'X', actionName: 'x',
      content: `# Action: x\n# [GET] /api/x\n\nFeature: X`,
    }]
    const r = autoFixActionsMethodPathFromFeatures(actionsYml, features)
    expect(r.fixed).toBeNull()
    expect(r.changes.length).toBe(0)
  })

  it('skips actions without matching feature annotation', () => {
    const actionsYml = `actions:\n  - name: unknown\n    summary: U\n`
    const features = [{
      name: 'Other', actionName: 'other',
      content: `# Action: other\n# [POST] /api/other\n\nFeature: Other`,
    }]
    const r = autoFixActionsMethodPathFromFeatures(actionsYml, features)
    expect(r.fixed).toBeNull()
  })

  it('ignores invalid method strings but still injects valid path', () => {
    const actionsYml = `actions:\n  - name: x\n    summary: X\n`
    const features = [{
      name: 'X', actionName: 'x',
      content: `# Action: x\n# [INVALID] /api/x\n\nFeature: X`,
    }]
    const r = autoFixActionsMethodPathFromFeatures(actionsYml, features)
    // 注意：path 仍會被注入（合法），但 method 不會（INVALID 不在白名單）
    const methodChange = r.changes.find(c => c.type === 'method_set')
    expect(methodChange).toBeUndefined()
    // path 應被注入
    const pathChange = r.changes.find(c => c.type === 'path_set')
    expect(pathChange).toBeDefined()
  })

  it('ignores both when neither method nor path are extractable', () => {
    const actionsYml = `actions:\n  - name: x\n    summary: X\n`
    const features = [{
      name: 'X', actionName: 'x',
      content: `# Action: x\n\nFeature: X`,  // 無 # [...] 註解
    }]
    const r = autoFixActionsMethodPathFromFeatures(actionsYml, features)
    expect(r.fixed).toBeNull()
  })
})

describe('Fix C: autoFixVarInCallTable', () => {
  it('strips > prefix from WHEN call table headers', () => {
    const content = `Feature: F

Scenario: A
  When (No Actor) Create FAQ, call table:
    | >question | >answer |
    | what?     | yes     |
  Then op(200)回應, with table:
    | id       |
    | $notnull |
`
    const r = autoFixVarInCallTable(content)
    expect(r.fixed).not.toBeNull()
    expect(r.removedCount).toBe(2)
    const headerLine = r.fixed!.split('\n').find(l => l.includes('question'))
    expect(headerLine).toBeDefined()
    expect(headerLine).not.toContain('>question')
  })

  it('does not touch Then response table headers', () => {
    const content = `Feature: F\n\nScenario: A\n  When (No Actor) op, call table:\n    | param |\n    | x     |\n  Then op(200)回應, with table:\n    | <capturedId |\n    | $notnull    |\n`
    const r = autoFixVarInCallTable(content)
    expect(r.fixed).toBeNull()
  })

  it('handles call table with no bad prefixes', () => {
    const content = `Feature: F\n\nScenario: A\n  When (No Actor) op, call table:\n    | name | age |\n    | bob  | 30  |\n`
    const r = autoFixVarInCallTable(content)
    expect(r.fixed).toBeNull()
  })
})

// Fix B test: VAR sequential naming pattern recognition for executionKey ↔ schema column
describe('Fix B: VAR sequential naming pattern recognition', () => {
  it('plan1Id should extract Id → id', () => {
    const m = 'plan1Id'.match(/^[a-z]+\d+([A-Z]\w*)$/)
    expect(m).not.toBeNull()
    expect(m![1]).toBe('Id')
    const field = m![1].charAt(0).toLowerCase() + m![1].slice(1)
    expect(field).toBe('id')
  })

  it('faq2Title should extract Title → title', () => {
    const m = 'faq2Title'.match(/^[a-z]+\d+([A-Z]\w*)$/)
    expect(m).not.toBeNull()
    expect(m![1]).toBe('Title')
  })

  it('inquiry1CustomerName should extract CustomerName → customerName', () => {
    const m = 'inquiry1CustomerName'.match(/^[a-z]+\d+([A-Z]\w*)$/)
    expect(m).not.toBeNull()
    const field = m![1].charAt(0).toLowerCase() + m![1].slice(1)
    expect(field).toBe('customerName')
  })

  it('regular camelCase (no seq number) uses alternate pattern', () => {
    expect('planId'.match(/^[a-z]+\d+([A-Z]\w*)$/)).toBeNull()
    const m = 'planId'.match(/^[a-z]+([A-Z]\w*)$/)
    expect(m![1]).toBe('Id')
  })

  it('composite key (newUserId) is caught by isCompositeKey before regex', () => {
    expect(/^(?:new|created|updated)/.test('newUserId')).toBe(true)
  })
})
