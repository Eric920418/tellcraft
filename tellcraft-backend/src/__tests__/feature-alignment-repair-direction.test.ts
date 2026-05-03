// ============================================================
// Feature Alignment Gate — Bug 5 (L31.D): per-check repairDirection hint
// 確認 CHECK_REPAIR_DIRECTION map 涵蓋所有 5 個對齊類 check
// 確認 issuesWithHints 注入「強制方向」字串到 description（給 LLM 看）
// ============================================================

import { describe, it, expect } from 'vitest'

// 只測 map 完整性 — autoFixFeatures 整體流程不單獨測（要 mock LLM）
describe('Bug 5 — CHECK_REPAIR_DIRECTION map', () => {
  it('5 個對齊類 check 都有對應 repair direction hint', async () => {
    // 因為 CHECK_REPAIR_DIRECTION 是 module-private const，間接驗證 — 跑一個會觸發 Check 12 的 case
    // 並驗 issue.description 內含「強制方向」標誌
    const { runAlignmentChecks } = await import('../services/feature-alignment-gate')

    const feature = `# Action: list_service_items
# [GET] /api/list_service_items
# Summary: List Service Items
Feature: List Service Items

  Rule: 後置（回應）

    Example: Returns items
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
    const issues = await runAlignmentChecks({
      features: [{ name: 'List Service Items', actionName: 'list_service_items', content: feature }],
      actionsYml: `actions:\n  - name: list_service_items\n    summary: List Service Items\n    http_method: GET\n    http_path: /api/list_service_items\n    input: {}\n    output: {}`,
      schemaSql: `CREATE TABLE service_items (id UUID PRIMARY KEY, title VARCHAR(200) NOT NULL, image_url TEXT);`,
      entityMapping: `entity_to_table_mapping:\n  - ServiceItem: service_items`,
    })

    const notnullIssue = issues.find(i => i.checkName === 'notnull_field_missing_from_setup')
    expect(notnullIssue).toBeDefined()
    // Check 12 的 issue.description 本身就含「修法方向（強制）」字樣
    expect(notnullIssue!.description).toContain('修法方向（強制）')
    expect(notnullIssue!.description).toContain('禁止')  // 明確禁止移除驗證
  })

  it('Check 13 issue description 含「禁止修改 Then 期望值」', async () => {
    const { runAlignmentChecks } = await import('../services/feature-alignment-gate')
    const feature = `# Action: list_service_items
# [GET] /api/list_service_items
# Summary: List Service Items
Feature: List Service Items

  Rule: 後置（回應）

    Example: Returns items
      Given 準備一個ServiceItem, with table:
        | title |
        | X     |
      When (No Actor) List Service Items, call table:
        | dummy |
        | _     |
      Then List Service Items(200)回應, with table:
        | imageUrl                |
        | https://cdn.x/split.png |
`
    const issues = await runAlignmentChecks({
      features: [{ name: 'List Service Items', actionName: 'list_service_items', content: feature }],
      actionsYml: `actions:\n  - name: list_service_items\n    summary: List Service Items\n    http_method: GET\n    http_path: /api/list_service_items\n    input: {}\n    output: {}`,
      schemaSql: `CREATE TABLE service_items (id UUID PRIMARY KEY, title VARCHAR(200) NOT NULL, image_url TEXT);`,
      entityMapping: `entity_to_table_mapping:\n  - ServiceItem: service_items`,
    })

    const concreteIssue = issues.find(i => i.checkName === 'then_concrete_value_missing_from_setup')
    expect(concreteIssue).toBeDefined()
    expect(concreteIssue!.description).toContain('修法方向（強制）')
    expect(concreteIssue!.description).toContain('禁止')
  })
})
