// ============================================================
// Feature Alignment Gate — Check 16 (L31.C): entity_validation_field_missing_from_setup
// 偵測「應該存在一個 X, with table:」期望欄位但 entity_setup 同 entity 沒給該欄位
// ============================================================

import { describe, it, expect } from 'vitest'
import { runAlignmentChecks } from '../services/feature-alignment-gate'

const ACTIONS_YML = `actions:
  - name: update_service_item
    summary: Update Service Item
    http_method: POST
    http_path: /api/update_service_item
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
    features: [{ name: 'Update Service Item', actionName: 'update_service_item', content }],
    actionsYml: ACTIONS_YML,
    schemaSql: SCHEMA_SQL,
    entityMapping: ENTITY_MAPPING,
  }
}

describe('Check 16 — entity_validation_field_missing_from_setup', () => {
  it('❌ 應該存在一個 ServiceItem 期望 imageUrl 具體值，但 entity_setup 沒給 → 報 error', async () => {
    const feature = `# Action: update_service_item
# [POST] /api/update_service_item
# Summary: Update Service Item
Feature: Update Service Item

  Rule: 後置（資料庫）

    Example: Updates imageUrl
      Given 準備一個ServiceItem, with table:
        | title |
        | X     |
      When (No Actor) Update Service Item, call table:
        | id            | imageUrl                  |
        | $ServiceItem1.id | https://cdn.x/new.png |
      Then 應該存在一個 ServiceItem, with table:
        | imageUrl              |
        | https://cdn.x/new.png |
`
    const issues = await runAlignmentChecks(makeInput(feature))
    const validateIssues = issues.filter(i => i.checkName === 'entity_validation_field_missing_from_setup')
    expect(validateIssues.length).toBeGreaterThanOrEqual(1)
    expect(validateIssues[0].severity).toBe('error')
    expect(validateIssues[0].description).toContain('imageUrl')
    expect(validateIssues[0].description).toContain('應該存在一個 ServiceItem')
  })

  it('✅ 應該不存在一個 X 不需要 entity_setup 對齊 → 不報', async () => {
    const feature = `# Action: update_service_item
# [POST] /api/update_service_item
# Summary: Update Service Item
Feature: Update Service Item

  Rule: 後置（資料庫）

    Example: Soft delete
      Given 準備一個ServiceItem, with table:
        | title |
        | X     |
      When (No Actor) Update Service Item, call table:
        | id               | deleted |
        | $ServiceItem1.id | true    |
      Then 應該不存在一個 ServiceItem, with table:
        | id               |
        | $ServiceItem1.id |
`
    const issues = await runAlignmentChecks(makeInput(feature))
    const validateIssues = issues.filter(i => i.checkName === 'entity_validation_field_missing_from_setup')
    expect(validateIssues).toHaveLength(0)
  })

  it('✅ entity_setup 給了該欄位 → 不報', async () => {
    const feature = `# Action: update_service_item
# [POST] /api/update_service_item
# Summary: Update Service Item
Feature: Update Service Item

  Rule: 後置（資料庫）

    Example: Updates imageUrl
      Given 準備一個ServiceItem, with table:
        | title | imageUrl                  |
        | X     | https://cdn.x/old.png |
      When (No Actor) Update Service Item, call table:
        | id               | imageUrl                  |
        | $ServiceItem1.id | https://cdn.x/new.png |
      Then 應該存在一個 ServiceItem, with table:
        | imageUrl              |
        | https://cdn.x/new.png |
`
    const issues = await runAlignmentChecks(makeInput(feature))
    const validateIssues = issues.filter(i => i.checkName === 'entity_validation_field_missing_from_setup')
    expect(validateIssues).toHaveLength(0)
  })
})
