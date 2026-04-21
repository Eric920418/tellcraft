// ============================================================
// Feature Alignment Gate — L23.B / L23.C
// L23.B: datatable_empty_row — 偵測 Given 準備一個 X DataTable 整 row 無實值
// L23.C: cross_scenario_var_reference — 偵測跨 scenario 引用 VAR
// ============================================================

import { describe, it, expect } from 'vitest'
import { runAlignmentChecks, extractScenariosWithScope } from '../services/feature-alignment-gate'

const BASE_ACTIONS_YML = `actions:
  - name: demo_action
    summary: Demo Action
    http_method: POST
    http_path: /api/demo
    input: {}
    output: {}
`

const BASE_SCHEMA_SQL = `CREATE TABLE demos (id UUID PRIMARY KEY, name VARCHAR(100));`
const BASE_ENTITY_MAPPING = `entity_to_table_mapping:
  - Demo: demos
`

function makeInput(content: string) {
  return {
    features: [{ name: 'Demo Action', actionName: 'demo_action', content }],
    actionsYml: BASE_ACTIONS_YML,
    schemaSql: BASE_SCHEMA_SQL,
    entityMapping: BASE_ENTITY_MAPPING,
  }
}

describe('L23.B — datatable_empty_row check', () => {
  it('❌ DataTable data row 只有 <xxxId capture，其他全空 → 報 error', async () => {
    const feature = `# Action: demo_action
# [POST] /api/demo
# Summary: Demo Action
Feature: Demo Action

  Background:
    Given 準備一個Demo, with table:
      | >Demo1.id | name |
      | <demo1Id  |      |

  Rule: 後置（回應）- Demo should return

    Example: Query demo
      When (No Actor) Demo Action, call table:
        | id |
        | $Demo1.id |
      Then Demo Action(200)回應, with table:
        | name |
        | something |
`
    const issues = await runAlignmentChecks(makeInput(feature))
    const emptyRowIssues = issues.filter(i => i.checkName === 'datatable_empty_row')
    expect(emptyRowIssues.length).toBeGreaterThan(0)
    expect(emptyRowIssues[0].description).toContain('Demo')
  })

  it('✅ DataTable data row 有實值 → 不報 empty row issue', async () => {
    const feature = `# Action: demo_action
# [POST] /api/demo
# Summary: Demo Action
Feature: Demo Action

  Background:
    Given 準備一個Demo, with table:
      | >Demo1.id | name          |
      | <demo1Id  | "Real Demo"   |

  Rule: 後置（回應）- Demo should return

    Example: Query demo
      When (No Actor) Demo Action, call table:
        | id |
        | $Demo1.id |
      Then Demo Action(200)回應, with table:
        | name |
        | "Real Demo" |
`
    const issues = await runAlignmentChecks(makeInput(feature))
    const emptyRowIssues = issues.filter(i => i.checkName === 'datatable_empty_row')
    expect(emptyRowIssues).toHaveLength(0)
  })
})

describe('L23.C — cross_scenario_var_reference check', () => {
  it('❌ Rule B 的 Example 引用 Rule A 才宣告的 VAR → 報 error', async () => {
    const feature = `# Action: demo_action
# [POST] /api/demo
# Summary: Demo Action
Feature: Demo Action

  Background:
    Given 準備一個Demo, with table:
      | >Demo1.id | name |
      | <demo1Id  | base |

  Rule: 前置（狀態）- Some rule A

    Example: Example with extra demo
      Given 準備一個Demo, with table:
        | >Demo2.id | name        |
        | <demo2Id  | "Extra Two" |
      When (No Actor) Demo Action, call table:
        | id |
        | $demo2Id |
      Then Demo Action(200)回應, with table:
        | name |
        | "Extra Two" |

  Rule: 後置（回應）- Some rule B

    Example: Example B references demo2Id from Rule A
      When (No Actor) Demo Action, call table:
        | id |
        | $demo2Id |
      Then Demo Action(200)回應, with table:
        | name |
        | "Extra Two" |
`
    const issues = await runAlignmentChecks(makeInput(feature))
    const crossIssues = issues.filter(i => i.checkName === 'cross_scenario_var_reference')
    expect(crossIssues.length).toBeGreaterThan(0)
    expect(crossIssues.some(i => i.description.includes('demo2Id'))).toBe(true)
  })

  it('✅ 共用 VAR 宣告在 Background → 不報 cross-scenario issue', async () => {
    const feature = `# Action: demo_action
# [POST] /api/demo
# Summary: Demo Action
Feature: Demo Action

  Background:
    Given 準備一個Demo, with table:
      | >Demo1.id | name  |
      | <demo1Id  | base  |

  Rule: 後置（回應）- Demo should return

    Example: E1 uses demo1Id
      When (No Actor) Demo Action, call table:
        | id |
        | $demo1Id |
      Then Demo Action(200)回應, with table:
        | name |
        | base |

    Example: E2 also uses demo1Id
      When (No Actor) Demo Action, call table:
        | id |
        | $demo1Id |
      Then Demo Action(200)回應, with table:
        | name |
        | base |
`
    const issues = await runAlignmentChecks(makeInput(feature))
    const crossIssues = issues.filter(i => i.checkName === 'cross_scenario_var_reference')
    expect(crossIssues).toHaveLength(0)
  })

  it('extractScenariosWithScope 正確分析每個 scenario 的 scope', () => {
    const feature = `Feature: X

  Background:
    Given 準備一個Demo, with table:
      | >Demo1.id | name |
      | <demo1Id  | base |

  Rule: 前置

    Example: E1
      Given 準備一個Demo, with table:
        | >Demo2.id | name |
        | <demo2Id  | two  |
      When (No Actor) X, call table:
        | id |
        | $demo2Id |

    Example: E2
      When (No Actor) X, call table:
        | id |
        | $demo2Id |
`
    const scenarios = extractScenariosWithScope(feature)
    expect(scenarios).toHaveLength(2)
    expect(scenarios[0].scenarioName).toBe('E1')
    expect(scenarios[0].declaredInLocalGiven.has('demo2Id')).toBe(true)
    expect(scenarios[1].scenarioName).toBe('E2')
    expect(scenarios[1].declaredInLocalGiven.has('demo2Id')).toBe(false)
    // E2 引用了 demo2Id 但未在 E2 scope 宣告 → 應被偵測
    expect(scenarios[1].referencedInWhenThen.some(r => r.varName === 'demo2Id')).toBe(true)
  })
})
