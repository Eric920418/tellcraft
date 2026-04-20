// ============================================================
// L19.P1: Check 9 — Pagination input vs DataTable validation 衝突
// ============================================================

import { describe, it, expect } from 'vitest'
import { runAlignmentChecks } from '../services/feature-alignment-gate'

const BASE_ACTIONS_YML = `actions:
  - name: list_media_files
    summary: List Media Files
    http_method: GET
    http_path: /api/media
    input: {}
    output: {}
`
const SCHEMA = `CREATE TABLE media_files (id UUID PRIMARY KEY);`
const ENTITY_MAPPING = `entity_to_table_mapping:
  - MediaFile: media_files
`

function makeInput(content: string) {
  return {
    features: [{ name: 'List Media Files', actionName: 'list_media_files', content }],
    actionsYml: BASE_ACTIONS_YML,
    schemaSql: SCHEMA,
    entityMapping: ENTITY_MAPPING,
  }
}

function paginationErrors(issues: Awaited<ReturnType<typeof runAlignmentChecks>>) {
  return issues.filter(i => i.checkName === 'pagination_mismatch')
}

describe('Check 9 — pagination input vs DataTable validation 衝突', () => {
  it('❌ api_call 傳 page/pageSize + Then with table 有 data → 報 error', async () => {
    const feature = `# Action: list_media_files
# [GET] /api/media
# Summary: List Media Files
Feature: List Media Files

  Rule: 後置（回應）- Returns paginated list
    Example: ok
      When (UID="$User.id") List Media Files, call table:
        | page | pageSize |
        | 1    | 20       |
      Then List Media Files(200)回應, with table:
        | id       |
        | $notnull |`
    const issues = await runAlignmentChecks(makeInput(feature))
    const errs = paginationErrors(issues)
    expect(errs.length).toBeGreaterThan(0)
    expect(errs[0].description).toContain('page')
    expect(errs[0].description).toContain('pageSize')
    expect(errs[0].description).toContain('with JSON:')  // 提示修法
  })

  it('❌ limit/offset 也算 pagination', async () => {
    const feature = `# Action: list_media_files
# [GET] /api/media
# Summary: List Media Files
Feature: List Media Files

  Rule: 後置（回應）- List
    Example: ok
      When (No Actor) List Media Files, call table:
        | limit | offset |
        | 10    | 0      |
      Then List Media Files(200)回應, with table:
        | id       |
        | $notnull |`
    const issues = await runAlignmentChecks(makeInput(feature))
    const errs = paginationErrors(issues)
    expect(errs.length).toBeGreaterThan(0)
    expect(errs[0].description).toContain('limit')
    expect(errs[0].description).toContain('offset')
  })

  it('✅ 無 pagination params → 不報', async () => {
    const feature = `# Action: list_media_files
# [GET] /api/media
# Summary: List Media Files
Feature: List Media Files

  Rule: 後置（回應）- List
    Example: ok
      When (No Actor) List Media Files, call table:
        | foo |
        | bar |
      Then List Media Files(200)回應, with table:
        | id       |
        | $notnull |`
    const issues = await runAlignmentChecks(makeInput(feature))
    expect(paginationErrors(issues)).toHaveLength(0)
  })

  it('✅ 有 pagination 但 Then 無 DataTable 驗證 → 不報', async () => {
    const feature = `# Action: list_media_files
# [GET] /api/media
# Summary: List Media Files
Feature: List Media Files

  Rule: 後置（回應）- List
    Example: ok
      When (No Actor) List Media Files, call table:
        | page | pageSize |
        | 1    | 20       |
      Then 操作失敗`
    const issues = await runAlignmentChecks(makeInput(feature))
    expect(paginationErrors(issues)).toHaveLength(0)
  })

  it('✅ 失敗情境（4xx）不報 pagination 衝突', async () => {
    const feature = `# Action: list_media_files
# [GET] /api/media
# Summary: List Media Files
Feature: List Media Files

  Rule: 前置（參數）- Pagination must be valid
    Example: zero pageSize fails
      When (No Actor) List Media Files, call table:
        | page | pageSize |
        | 1    | 0        |
      Then List Media Files(400)回應, with table:
        | error    |
        | Invalid  |`
    const issues = await runAlignmentChecks(makeInput(feature))
    expect(paginationErrors(issues)).toHaveLength(0)
  })
})
