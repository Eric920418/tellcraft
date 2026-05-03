// ============================================================
// Feature Alignment Gate — Check 15 (L31.A): null_expectation_setup_conflict
// 偵測 Then 期望 $null 但 entity_setup 給了該欄位非空字面值
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

describe('Check 15 — null_expectation_setup_conflict', () => {
  it('❌ Then 期望 nickname $null 但 entity_setup 給了非空時間 → 報 error', async () => {
    const feature = `# Action: get_user
# [GET] /api/get_user
# Summary: Get User
Feature: Get User

  Rule: 後置（回應）

    Example: Returns active user
      Given 準備一個User, with table:
        | email          | nickname           |
        | x@example.com  | Alice |
      When (No Actor) Get User, call table:
        | dummy |
        | _     |
      Then Get User(200)回應, with table:
        | email          | nickname |
        | x@example.com  | $null     |
`
    const issues = await runAlignmentChecks(makeInput(feature))
    const nullConflictIssues = issues.filter(i => i.checkName === 'null_expectation_setup_conflict')
    expect(nullConflictIssues).toHaveLength(1)
    expect(nullConflictIssues[0].severity).toBe('error')
    expect(nullConflictIssues[0].description).toContain('nickname')
    expect(nullConflictIssues[0].description).toContain('$null')
  })

  it('✅ entity_setup 沒給 nickname（走 DB DEFAULT/NULL）→ 不報', async () => {
    const feature = `# Action: get_user
# [GET] /api/get_user
# Summary: Get User
Feature: Get User

  Rule: 後置（回應）

    Example: Returns active user
      Given 準備一個User, with table:
        | email          |
        | x@example.com  |
      When (No Actor) Get User, call table:
        | dummy |
        | _     |
      Then Get User(200)回應, with table:
        | email          | nickname |
        | x@example.com  | $null     |
`
    const issues = await runAlignmentChecks(makeInput(feature))
    const nullConflictIssues = issues.filter(i => i.checkName === 'null_expectation_setup_conflict')
    expect(nullConflictIssues).toHaveLength(0)
  })

  it('✅ entity_setup 給 nickname 是 VAR 引用（$xxx）不算字面衝突', async () => {
    const feature = `# Action: get_user
# [GET] /api/get_user
# Summary: Get User
Feature: Get User

  Background:
    Given 準備一個User, with table:
      | email          | nickname   |
      | x@example.com  | $someName   |

  Rule: 後置（回應）

    Example: Returns active user
      When (No Actor) Get User, call table:
        | dummy |
        | _     |
      Then Get User(200)回應, with table:
        | email          | nickname |
        | x@example.com  | $null     |
`
    const issues = await runAlignmentChecks(makeInput(feature))
    const nullConflictIssues = issues.filter(i => i.checkName === 'null_expectation_setup_conflict')
    expect(nullConflictIssues).toHaveLength(0)
  })
})
