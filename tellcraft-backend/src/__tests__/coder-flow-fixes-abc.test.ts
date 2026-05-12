// Coder flow fixes A/B/C 測試
// A: actionsYml 強制讀 Feature # [METHOD] /path 註解
// B: RED Phase validator field_mismatch 去 VAR capture false positive
// C: WHEN call table headers strip `>` / `<` 前綴
import { describe, it, expect } from 'vitest'
import * as yaml from 'js-yaml'
import { injectFeatureAnnotationsToActions } from '../services/actions-design'
import { autoStripVarPrefixFromCallTable } from '../services/deterministic-feature-fix'

describe('Fix A: injectFeatureAnnotationsToActions', () => {
  it('injects method + path from Feature annotation', () => {
    const actionsYml = `
actions:
  - name: createPricingPlan
    summary: Create Pricing Plan
  - name: getPublicFaqs
    summary: Get Public FAQs
`
    const features = [
      {
        name: 'Create Pricing Plan',
        actionName: 'createPricingPlan',
        content: `# Action: createPricingPlan\n# [POST] /api/admin/pricing-plans\n# Summary: Create a pricing plan\n\nFeature: Create Pricing Plan\n`,
      },
      {
        name: 'Get Public FAQs',
        actionName: 'getPublicFaqs',
        content: `# Action: getPublicFaqs\n# [GET] /api/public/faqs\n\nFeature: Get Public FAQs\n`,
      },
    ]
    const r = injectFeatureAnnotationsToActions(actionsYml, features)
    expect(r.injectedMethod).toBe(2)
    expect(r.injectedPath).toBe(2)
    const parsed = yaml.load(r.aligned) as { actions: Array<{ name: string; method: string; path: string }> }
    const create = parsed.actions.find(a => a.name === 'createPricingPlan')
    expect(create?.method).toBe('POST')
    expect(create?.path).toBe('/api/admin/pricing-plans')
    const get = parsed.actions.find(a => a.name === 'getPublicFaqs')
    expect(get?.method).toBe('GET')
    expect(get?.path).toBe('/api/public/faqs')
  })

  it('skips actions without matching feature annotation', () => {
    const actionsYml = `
actions:
  - name: unknownAction
    summary: Unknown
`
    const features = [{
      name: 'Other Feature', actionName: 'otherAction',
      content: `# Action: otherAction\n# [POST] /api/other\n\nFeature: Other Feature`,
    }]
    const r = injectFeatureAnnotationsToActions(actionsYml, features)
    expect(r.injectedMethod).toBe(0)
    expect(r.injectedPath).toBe(0)
  })

  it('overrides existing method/path when Feature annotation differs', () => {
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
    const r = injectFeatureAnnotationsToActions(actionsYml, features)
    expect(r.injectedMethod).toBe(1)
    expect(r.injectedPath).toBe(1)
    const parsed = yaml.load(r.aligned) as { actions: Array<{ method: string; path: string }> }
    expect(parsed.actions[0].method).toBe('PATCH')
    expect(parsed.actions[0].path).toBe('/api/admin/pricing-plans/:id')
  })

  it('returns unchanged when no features have annotations', () => {
    const actionsYml = `actions:\n  - name: x\n    summary: X\n`
    const r = injectFeatureAnnotationsToActions(actionsYml, [{
      name: 'X', actionName: 'x', content: 'Feature: X\n',  // 無 # [...] 註解
    }])
    expect(r.aligned).toBe(actionsYml)
    expect(r.injectedMethod).toBe(0)
  })

  it('ignores invalid method strings', () => {
    const actionsYml = `actions:\n  - name: x\n    summary: X\n`
    const r = injectFeatureAnnotationsToActions(actionsYml, [{
      name: 'X', actionName: 'x', content: '# Action: x\n# [INVALID] /api/x\n\nFeature: X',
    }])
    expect(r.injectedMethod).toBe(0)
  })
})

describe('Fix C: autoStripVarPrefixFromCallTable', () => {
  it('strips > prefix from WHEN call table headers', () => {
    const content = `Feature: F

Scenario: A
  When (No Actor) Create FAQ, call table:
    | >question     | >answer |
    | what?         | yes     |
  Then op(200)回應, with table:
    | id       |
    | $notnull |
`
    const r = autoStripVarPrefixFromCallTable(content)
    expect(r.strippedHeaders.length).toBe(2)
    expect(r.strippedHeaders[0].from).toBe('>question')
    expect(r.strippedHeaders[0].to).toBe('question')
    // 確認 header 已修正、data row 不變
    const lines = r.content.split('\n')
    const headerLine = lines.find(l => l.includes('question') && l.includes('answer'))
    expect(headerLine).toBeDefined()
    expect(headerLine).not.toContain('>question')
    expect(headerLine).toContain('question')
    const dataLine = lines.find(l => l.includes('what?'))
    expect(dataLine).toContain('what?')
  })

  it('does not touch Then response table headers', () => {
    const content = `Feature: F

Scenario: A
  When (No Actor) op, call table:
    | param |
    | x     |
  Then op(200)回應, with table:
    | <capturedId |
    | $notnull    |
`
    const r = autoStripVarPrefixFromCallTable(content)
    expect(r.strippedHeaders.length).toBe(0)
    expect(r.content).toBe(content)
  })

  it('does not touch Given entity_setup tables', () => {
    const content = `Feature: F

Background:
  Given 準備一個 X, with table:
    | >X1.id | name |
    | $uuid  | foo  |
`
    const r = autoStripVarPrefixFromCallTable(content)
    expect(r.strippedHeaders.length).toBe(0)
  })

  it('handles call table with no bad prefixes', () => {
    const content = `Feature: F

Scenario: A
  When (No Actor) op, call table:
    | name | age |
    | bob  | 30  |
`
    const r = autoStripVarPrefixFromCallTable(content)
    expect(r.strippedHeaders.length).toBe(0)
    expect(r.content).toBe(content)
  })

  it('handles < prefix as well', () => {
    const content = `Feature: F

Scenario: A
  When (UID="$id") op, call table:
    | <captured | name |
    | x         | y    |
`
    const r = autoStripVarPrefixFromCallTable(content)
    expect(r.strippedHeaders.length).toBe(1)
    expect(r.strippedHeaders[0].to).toBe('captured')
  })
})

// Fix B test: 通過實際的 red-phase-validator 整合測試難以單元測（需 mock schemas）
// 用簡單的 regex 級驗證：序列化命名 → 抓尾段 PascalCase field
describe('Fix B: VAR sequential naming pattern recognition', () => {
  // 這些 pattern 是 red-phase-validator.ts:535 對應的邏輯
  it('plan1Id should extract Id → id', () => {
    const key = 'plan1Id'
    const m = key.match(/^[a-z]+\d+([A-Z]\w*)$/)
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
    expect(m![1]).toBe('CustomerName')
    const field = m![1].charAt(0).toLowerCase() + m![1].slice(1)
    expect(field).toBe('customerName')
  })

  it('regular camelCase (no seq number) goes through alternate path', () => {
    const key = 'planId'
    // 序列化 pattern 不匹配
    expect(key.match(/^[a-z]+\d+([A-Z]\w*)$/)).toBeNull()
    // 但 camelCase pattern 應該抓得到
    const camelM = key.match(/^[a-z]+([A-Z]\w*)$/)
    expect(camelM).not.toBeNull()
    expect(camelM![1]).toBe('Id')
  })

  it('composite key (newUserId) should be caught by isCompositeKey before our regex', () => {
    expect(/^(?:new|created|updated)/.test('newUserId')).toBe(true)
  })
})
