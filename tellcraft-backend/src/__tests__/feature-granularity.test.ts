import { describe, it, expect } from 'vitest'
import { executeRedPhase } from '../services/red-phase-validator'

// ============================================================
// 測試 Feature 粒度規則：1 Feature = 1 Operation
// 目標：當 Feature 包含多個不同 When summary（CRUD 合併）時，
//       RED Phase Check 4b 應該正確偵測並報 error
// ============================================================

describe('Feature Granularity: 1 Feature = 1 Operation', () => {
  it('合併 CRUD 的 Feature 應被偵測為 when_summary_mismatch（粒度過粗）', async () => {
    const aggregateFeature = {
      actionName: 'manageTransaction',
      name: '交易記錄管理',
      content: `# Action: manageTransaction
# [POST] /api/transactions
# Summary: 交易記錄管理

Feature: 交易記錄管理

  Rule: 後置（狀態）- 新增成功
    Example: 新增交易
      Given 準備一個使用者, with table:
        | id >user1.id | email |
        | $user1.id    | a@b.c |
      When (UID="$user1.id") 新增交易記錄, call table:
        | amount | title |
        | 100    | 午餐  |
      Then 新增交易記錄(201)回應

  Rule: 後置（回應）- 查詢成功
    Example: 查詢交易
      When (UID="$user1.id") 查詢交易記錄, call table:
        | userId    |
        | $user1.id |
      Then 查詢交易記錄(200)回應
`,
    }

    const actionsYml = `
actions:
  - name: manageTransaction
    summary: 交易記錄管理
    description: 管理交易記錄
    featureFile: spec/features/交易記錄管理.feature
    rules: []
`

    const schemaSql = `
CREATE TABLE users (id UUID PRIMARY KEY, email VARCHAR(100));
CREATE TABLE transactions (id UUID PRIMARY KEY, user_id UUID, amount NUMERIC(10,2), title VARCHAR(100));
`

    const result = await executeRedPhase({
      features: [aggregateFeature],
      actionsYml,
      schemaSql,
      entityMapping: '',
    })

    // 應該偵測到 when_summary_mismatch（「新增交易記錄」和「查詢交易記錄」都不等於「交易記錄管理」）
    const whenMismatchIssues = result.issues.filter(i => i.issueType === 'when_summary_mismatch')
    expect(whenMismatchIssues.length).toBeGreaterThan(0)

    // 錯誤訊息應包含「粒度」或「拆成」等根因提示
    const firstIssue = whenMismatchIssues[0]
    expect(firstIssue.severity).toBe('error')
    expect(firstIssue.description).toMatch(/粒度過粗|拆成|違反「1 Feature = 1 Operation」/)
    expect(firstIssue.suggestion).toMatch(/拆 Feature|獨立 Feature/)
  })

  it('正確拆分的 Feature（Feature.name === When summary）不應報錯', async () => {
    const correctFeature = {
      actionName: 'addTransaction',
      name: '新增交易記錄',
      content: `# Action: addTransaction
# [POST] /api/transactions
# Summary: 新增交易記錄

Feature: 新增交易記錄

  Rule: 後置（狀態）- 新增成功
    Example: 提供有效資料時新增成功
      Given 準備一個使用者, with table:
        | id >user1.id | email |
        | $user1.id    | a@b.c |
      When (UID="$user1.id") 新增交易記錄, call table:
        | amount | title |
        | 100    | 午餐  |
      Then 新增交易記錄(201)回應
`,
    }

    const actionsYml = `
actions:
  - name: addTransaction
    summary: 新增交易記錄
    description: 新增一筆交易記錄
    featureFile: spec/features/新增交易記錄.feature
    rules: []
`

    const schemaSql = `
CREATE TABLE users (id UUID PRIMARY KEY, email VARCHAR(100));
CREATE TABLE transactions (id UUID PRIMARY KEY, user_id UUID, amount NUMERIC(10,2), title VARCHAR(100));
`

    const result = await executeRedPhase({
      features: [correctFeature],
      actionsYml,
      schemaSql,
      entityMapping: '',
    })

    const whenMismatchIssues = result.issues.filter(i => i.issueType === 'when_summary_mismatch')
    expect(whenMismatchIssues.length).toBe(0)
  })
})
