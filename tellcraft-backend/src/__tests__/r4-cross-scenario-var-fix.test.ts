// R4: Check 5.5 cross_scenario_var_reference deterministic 修補測試
import { describe, it, expect } from 'vitest'
import { autoFillCrossScenarioVarReference } from '../services/deterministic-feature-fix'
import type { AlignmentIssue } from '../services/feature-alignment-gate'

describe('R4: autoFillCrossScenarioVarReference', () => {
  it('copies entity_setup step from source scenario to target scenario Given', () => {
    const content = `Feature: Order Management

Scenario: create product
  Given 準備一個 Product, with table:
    | name | price | <newProductId |
    | foo  | 100   | <prod1Id      |
  When (No Actor) Create Product, call table:
    |  |
  Then Create Product(200)回應, with table:
    | id      |
    | $notnull|

Scenario: place order
  When (No Actor) Place Order, call table:
    | productId   |
    | $prod1Id    |
  Then Place Order(200)回應, with table:
    | id      |
    | $notnull|
`
    const issues: AlignmentIssue[] = [{
      featureName: 'Order Management',
      checkName: 'cross_scenario_var_reference',
      severity: 'error',
      description: 'Scenario "place order" (line 13) 引用 "$prod1Id" 未在該 scenario 的 Background 或 Given 宣告。SpecFormula 每個 scenario 獨立執行...',
    }]
    const r = autoFillCrossScenarioVarReference(content, issues)
    expect(r.fixedRefs.length).toBe(1)
    expect(r.fixedRefs[0].targetScenario).toBe('place order')
    expect(r.fixedRefs[0].varName).toBe('prod1Id')
    expect(r.fixedRefs[0].sourceScenario).toBe('create product')

    // 確認 entity_setup 已插到 place order 的 Given 區
    const lines = r.content.split('\n')
    const placeOrderIdx = lines.findIndex(l => l.includes('Scenario: place order'))
    const whenIdx = lines.findIndex((l, i) => i > placeOrderIdx && /^\s*When\b/.test(l))
    expect(whenIdx).toBeGreaterThan(placeOrderIdx)
    const givenBlock = lines.slice(placeOrderIdx, whenIdx).join('\n')
    expect(givenBlock).toContain('準備一個 Product')
    expect(givenBlock).toContain('<prod1Id')
  })

  it('uses And keyword if scenario already has Given step', () => {
    const content = `Feature: F

Scenario: source
  Given 準備一個 X, with table:
    | a | <var1 |
    | 1 | <v1   |

Scenario: target
  Given 準備一個 Y, with table:
    | b |
    | 2 |
  When op call $v1
  Then op(200)回應, with table:
    | id       |
    | $notnull |
`
    const issues: AlignmentIssue[] = [{
      featureName: 'F',
      checkName: 'cross_scenario_var_reference',
      severity: 'error',
      description: 'Scenario "target" (line 11) 引用 "$v1" 未在該 scenario',
    }]
    const r = autoFillCrossScenarioVarReference(content, issues)
    expect(r.fixedRefs.length).toBe(1)
    // 應該用 And 而不是 Given（因為 target 已有 Given Y）
    const lines = r.content.split('\n')
    const targetIdx = lines.findIndex(l => l.includes('Scenario: target'))
    const whenIdx = lines.findIndex((l, i) => i > targetIdx && /^\s*When\b/.test(l))
    const givenBlock = lines.slice(targetIdx, whenIdx).map(l => l.trim()).join('\n')
    expect(givenBlock).toMatch(/And\s+準備一個 X/)
    expect(givenBlock).not.toMatch(/Given\s+準備一個 X/)  // 不該複製成 Given
  })

  it('returns unchanged when no matching source scenario', () => {
    const content = `Feature: F

Scenario: only one
  When op call $unknownVar
  Then op(200)回應, with table:
    | id       |
    | $notnull |
`
    const issues: AlignmentIssue[] = [{
      featureName: 'F',
      checkName: 'cross_scenario_var_reference',
      severity: 'error',
      description: 'Scenario "only one" (line 4) 引用 "$unknownVar" 未在該 scenario',
    }]
    const r = autoFillCrossScenarioVarReference(content, issues)
    expect(r.fixedRefs.length).toBe(0)
    expect(r.skipped.length).toBe(1)
    expect(r.skipped[0].reason).toContain('找不到 source')
  })

  it('dedupes when same (scenario, var) appears in multiple issues', () => {
    const content = `Feature: F

Scenario: source
  Given 準備一個 X, with table:
    | a | <v1 |
    | 1 | <v1Captured |

Scenario: target
  When op1 use $v1Captured
  And op2 use $v1Captured
  Then op(200)回應, with table:
    | id       |
    | $notnull |
`
    const issues: AlignmentIssue[] = [
      {
        featureName: 'F',
        checkName: 'cross_scenario_var_reference',
        severity: 'error',
        description: 'Scenario "target" (line 9) 引用 "$v1Captured" 未在該 scenario',
      },
      {
        featureName: 'F',
        checkName: 'cross_scenario_var_reference',
        severity: 'error',
        description: 'Scenario "target" (line 10) 引用 "$v1Captured" 未在該 scenario',
      },
    ]
    const r = autoFillCrossScenarioVarReference(content, issues)
    // 兩個 issue 但只插入一次（同 scenario + 同 var）
    expect(r.fixedRefs.length).toBe(1)
    // 確認沒有重複插
    const occurrences = (r.content.match(/準備一個 X/g) ?? []).length
    expect(occurrences).toBe(2)  // 一個在 source、一個在 target（不重複到 3 個）
  })

  it('returns unchanged when severity is warning (not error)', () => {
    const r = autoFillCrossScenarioVarReference('Feature: F\n', [{
      featureName: 'F',
      checkName: 'cross_scenario_var_reference',
      severity: 'warning',
      description: 'Scenario "X" (line 1) 引用 "$v"',
    }])
    expect(r.fixedRefs.length).toBe(0)
  })
})
