// ============================================================
// Feature Alignment Gate — Check 14 (L31.B): scenario_scope_setup_mismatch
// 偵測單個 scenario 的 Then 期望欄位不在「該 scenario scope」(Background + 自身 Given)
// 預設 warning，環境變數 STRICT_SCENARIO_SCOPE_ALIGNMENT=true 升 error
// ============================================================

import { describe, it, expect } from 'vitest'
import { runAlignmentChecks } from '../services/feature-alignment-gate'

const ACTIONS_YML = `actions:
  - name: get_user
    summary: Get User
    http_method: GET
    http_path: /api/get_user
    input: {}
    output: {}
`

const SCHEMA_SQL = `CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  nickname VARCHAR(100)
);`

const ENTITY_MAPPING = `entity_to_table_mapping:
  - User: users
`

function makeInput(content: string) {
  return {
    features: [{ name: 'Get User', actionName: 'get_user', content }],
    actionsYml: ACTIONS_YML,
    schemaSql: SCHEMA_SQL,
    entityMapping: ENTITY_MAPPING,
  }
}

describe('Check 14 — scenario_scope_setup_mismatch', () => {
  it('❌ Scenario A entity_setup 有 nickname，Scenario B 沒有，B 期望 nickname → 報 warning', async () => {
    const feature = `# Action: get_user
# [GET] /api/get_user
# Summary: Get User
Feature: Get User

  Rule: 後置（回應）

    Example: Scenario A with nickname
      Given 準備一個User, with table:
        | email     | nickname |
        | a@x.com   | Alice    |
      When (No Actor) Get User, call table:
        | dummy |
        | _     |
      Then Get User(200)回應, with table:
        | email   | nickname |
        | a@x.com | Alice    |

    Example: Scenario B without nickname setup
      Given 準備一個User, with table:
        | email   |
        | b@x.com |
      When (No Actor) Get User, call table:
        | dummy |
        | _     |
      Then Get User(200)回應, with table:
        | email   | nickname |
        | b@x.com | $notnull |
`
    const issues = await runAlignmentChecks(makeInput(feature))
    const scopeIssues = issues.filter(i => i.checkName === 'scenario_scope_setup_mismatch')
    expect(scopeIssues.length).toBeGreaterThanOrEqual(1)
    expect(scopeIssues[0].severity).toBe('warning')  // 預設 warning
    expect(scopeIssues[0].description).toContain('Scenario B')
    expect(scopeIssues[0].description).toContain('nickname')
  })

  it('✅ 共用 setup 在 Background → 所有 scenario 都覆蓋 → 不報', async () => {
    const feature = `# Action: get_user
# [GET] /api/get_user
# Summary: Get User
Feature: Get User

  Background:
    Given 準備一個User, with table:
      | email     | nickname |
      | base@x.com| Base     |

  Rule: 後置（回應）

    Example: Scenario A
      When (No Actor) Get User, call table:
        | dummy |
        | _     |
      Then Get User(200)回應, with table:
        | nickname |
        | $notnull |

    Example: Scenario B
      When (No Actor) Get User, call table:
        | dummy |
        | _     |
      Then Get User(200)回應, with table:
        | nickname |
        | $notnull |
`
    const issues = await runAlignmentChecks(makeInput(feature))
    const scopeIssues = issues.filter(i => i.checkName === 'scenario_scope_setup_mismatch')
    expect(scopeIssues).toHaveLength(0)
  })

  it('✅ 全部 scenario 都沒給 nickname → Check 12 處理（Check 14 不重複報）', async () => {
    const feature = `# Action: get_user
# [GET] /api/get_user
# Summary: Get User
Feature: Get User

  Rule: 後置（回應）

    Example: Scenario A
      Given 準備一個User, with table:
        | email   |
        | a@x.com |
      When (No Actor) Get User, call table:
        | dummy |
        | _     |
      Then Get User(200)回應, with table:
        | nickname |
        | $notnull |
`
    const issues = await runAlignmentChecks(makeInput(feature))
    const scopeIssues = issues.filter(i => i.checkName === 'scenario_scope_setup_mismatch')
    // Check 14 不報 — 因為沒有「其他 scenario 提供 nickname」這個前提
    expect(scopeIssues).toHaveLength(0)
    // Check 12 應該報
    const notnullIssues = issues.filter(i => i.checkName === 'notnull_field_missing_from_setup')
    expect(notnullIssues.length).toBeGreaterThan(0)
  })
})
