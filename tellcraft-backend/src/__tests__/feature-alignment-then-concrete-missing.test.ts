// ============================================================
// Feature Alignment Gate — Check 13 (L31.A): then_concrete_value_missing_from_setup
// 偵測 Then 期望「具體字面值」（非 $notnull）但 entity_setup 沒給該欄位
// ============================================================

import { describe, it, expect } from 'vitest'
import { runAlignmentChecks } from '../services/feature-alignment-gate'

const ACTIONS_YML = `actions:
  - name: list_service_items
    summary: List Service Items
    http_method: GET
    http_path: /api/list_service_items
    input: {}
    output: {}
`

const SCHEMA_SQL = `CREATE TABLE service_items (
  id UUID PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true
);`

const ENTITY_MAPPING = `entity_to_table_mapping:
  - ServiceItem: service_items
`

function makeInput(content: string) {
  return {
    features: [{ name: 'List Service Items', actionName: 'list_service_items', content }],
    actionsYml: ACTIONS_YML,
    schemaSql: SCHEMA_SQL,
    entityMapping: ENTITY_MAPPING,
  }
}

describe('Check 13 — then_concrete_value_missing_from_setup', () => {
  it('❌ Then 期望具體 URL 值但 entity_setup 沒給 imageUrl → 報 error', async () => {
    const feature = `# Action: list_service_items
# [GET] /api/list_service_items
# Summary: List Service Items
Feature: List Service Items

  Rule: 後置（回應）

    Example: Returns expected items
      Given 準備一個ServiceItem, with table:
        | title             | isActive |
        | Split AC Cleaning | true     |
      When (No Actor) List Service Items, call table:
        | dummy |
        | _     |
      Then List Service Items(200)回應, with table:
        | title             | imageUrl                |
        | Split AC Cleaning | https://cdn.x/split.png |
`
    const issues = await runAlignmentChecks(makeInput(feature))
    const concreteIssues = issues.filter(i => i.checkName === 'then_concrete_value_missing_from_setup')
    expect(concreteIssues).toHaveLength(1)
    expect(concreteIssues[0].severity).toBe('error')
    expect(concreteIssues[0].description).toContain('imageUrl')
    expect(concreteIssues[0].description).toContain('https://cdn.x/split.png')
  })

  it('✅ entity_setup 提供 imageUrl 值 → 不報', async () => {
    const feature = `# Action: list_service_items
# [GET] /api/list_service_items
# Summary: List Service Items
Feature: List Service Items

  Rule: 後置（回應）

    Example: Returns expected items
      Given 準備一個ServiceItem, with table:
        | title             | isActive | imageUrl                |
        | Split AC Cleaning | true     | https://cdn.x/split.png |
      When (No Actor) List Service Items, call table:
        | dummy |
        | _     |
      Then List Service Items(200)回應, with table:
        | title             | imageUrl                |
        | Split AC Cleaning | https://cdn.x/split.png |
`
    const issues = await runAlignmentChecks(makeInput(feature))
    const concreteIssues = issues.filter(i => i.checkName === 'then_concrete_value_missing_from_setup')
    expect(concreteIssues).toHaveLength(0)
  })

  it('✅ Then 用 $notnull 不算具體值 → Check 13 不報（讓 Check 12 處理）', async () => {
    const feature = `# Action: list_service_items
# [GET] /api/list_service_items
# Summary: List Service Items
Feature: List Service Items

  Rule: 後置（回應）

    Example: Returns items with imageUrl
      Given 準備一個ServiceItem, with table:
        | title |
        | X     |
      When (No Actor) List Service Items, call table:
        | dummy |
        | _     |
      Then List Service Items(200)回應, with table:
        | imageUrl |
        | $notnull |
`
    const issues = await runAlignmentChecks(makeInput(feature))
    const concreteIssues = issues.filter(i => i.checkName === 'then_concrete_value_missing_from_setup')
    expect(concreteIssues).toHaveLength(0)
    // 但 Check 12 應該報
    const notnullIssues = issues.filter(i => i.checkName === 'notnull_field_missing_from_setup')
    expect(notnullIssues.length).toBeGreaterThan(0)
  })
})
