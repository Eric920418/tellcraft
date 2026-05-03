// ============================================================
// Feature Alignment Gate — Check 12 (L31.A): notnull_field_missing_from_setup
// 偵測 Then 表期望 $notnull 但 entity_setup DataTable 從未提供該欄位值
// 真實案例：List Service Items.imageUrl 期望 $notnull 但 entity_setup 只給 [title, description, isActive]
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
  description TEXT,
  image_url TEXT,
  image_alt TEXT,
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

describe('Check 12 — notnull_field_missing_from_setup', () => {
  it('❌ 真實案例：Then 期望 imageUrl $notnull 但 entity_setup 只給 [title, description, isActive] → 報 error', async () => {
    const feature = `# Action: list_service_items
# [GET] /api/list_service_items
# Summary: List Service Items
Feature: List Service Items

  Rule: 後置（回應）

    Example: Each active service item in the response contains all expected fields
      Given 準備一個ServiceItem, with table:
        | title              | description       | isActive |
        | Split AC Cleaning  | Deep clean        | true     |
      When (No Actor) List Service Items, call table:
        | dummy |
        | _     |
      Then List Service Items(200)回應, with table:
        | title              | imageUrl  |
        | Split AC Cleaning  | $notnull  |
`
    const issues = await runAlignmentChecks(makeInput(feature))
    const notnullIssues = issues.filter(i => i.checkName === 'notnull_field_missing_from_setup')
    expect(notnullIssues).toHaveLength(1)
    expect(notnullIssues[0].severity).toBe('error')
    expect(notnullIssues[0].description).toContain('imageUrl')
    expect(notnullIssues[0].description).toContain('Each active service item')
  })

  it('✅ entity_setup 提供 imageUrl 值 → 不報', async () => {
    const feature = `# Action: list_service_items
# [GET] /api/list_service_items
# Summary: List Service Items
Feature: List Service Items

  Rule: 後置（回應）

    Example: Each active service item in the response contains all expected fields
      Given 準備一個ServiceItem, with table:
        | title              | description | isActive | imageUrl                |
        | Split AC Cleaning  | Deep clean  | true     | https://cdn.x/split.png |
      When (No Actor) List Service Items, call table:
        | dummy |
        | _     |
      Then List Service Items(200)回應, with table:
        | title              | imageUrl  |
        | Split AC Cleaning  | $notnull  |
`
    const issues = await runAlignmentChecks(makeInput(feature))
    const notnullIssues = issues.filter(i => i.checkName === 'notnull_field_missing_from_setup')
    expect(notnullIssues).toHaveLength(0)
  })

  it('✅ camelCase ↔ snake_case 對齊：entity_setup 用 image_url，Then 用 imageUrl → 不報', async () => {
    const feature = `# Action: list_service_items
# [GET] /api/list_service_items
# Summary: List Service Items
Feature: List Service Items

  Rule: 後置（回應）

    Example: Field is provided
      Given 準備一個ServiceItem, with table:
        | title | image_url               |
        | X     | https://cdn.x/split.png |
      When (No Actor) List Service Items, call table:
        | dummy |
        | _     |
      Then List Service Items(200)回應, with table:
        | imageUrl |
        | $notnull |
`
    const issues = await runAlignmentChecks(makeInput(feature))
    const notnullIssues = issues.filter(i => i.checkName === 'notnull_field_missing_from_setup')
    expect(notnullIssues).toHaveLength(0)
  })

  it('✅ 系統自動欄位（id/createdAt/updatedAt）即使 entity_setup 沒給也不報', async () => {
    const feature = `# Action: list_service_items
# [GET] /api/list_service_items
# Summary: List Service Items
Feature: List Service Items

  Rule: 後置（回應）

    Example: Default fields exist
      Given 準備一個ServiceItem, with table:
        | title |
        | X     |
      When (No Actor) List Service Items, call table:
        | dummy |
        | _     |
      Then List Service Items(200)回應, with table:
        | id       | createdAt | updatedAt |
        | $notnull | $notnull  | $notnull  |
`
    const issues = await runAlignmentChecks(makeInput(feature))
    const notnullIssues = issues.filter(i => i.checkName === 'notnull_field_missing_from_setup')
    expect(notnullIssues).toHaveLength(0)
  })

  it('❌ 同 Feature 多個 scenario 各報各的（reportedFields 在 scenario 切換時重置）', async () => {
    const feature = `# Action: list_service_items
# [GET] /api/list_service_items
# Summary: List Service Items
Feature: List Service Items

  Rule: 後置（回應）

    Example: Scenario A
      Given 準備一個ServiceItem, with table:
        | title |
        | X     |
      When (No Actor) List Service Items, call table:
        | dummy |
        | _     |
      Then List Service Items(200)回應, with table:
        | imageUrl |
        | $notnull |

    Example: Scenario B
      Given 準備一個ServiceItem, with table:
        | title |
        | Y     |
      When (No Actor) List Service Items, call table:
        | dummy |
        | _     |
      Then List Service Items(200)回應, with table:
        | imageUrl |
        | $notnull |
`
    const issues = await runAlignmentChecks(makeInput(feature))
    const notnullIssues = issues.filter(i => i.checkName === 'notnull_field_missing_from_setup')
    // 兩個 scenario 各報一次（reportedFields 應該在 scenario 切換時重置）
    expect(notnullIssues.length).toBeGreaterThanOrEqual(2)
    const scenarioAIssue = notnullIssues.find(i => i.description.includes('Scenario A'))
    const scenarioBIssue = notnullIssues.find(i => i.description.includes('Scenario B'))
    expect(scenarioAIssue).toBeDefined()
    expect(scenarioBIssue).toBeDefined()
  })
})
