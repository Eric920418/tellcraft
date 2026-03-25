import { describe, it, expect } from 'vitest'
import { executeRedPhase, extractEntitySetupSteps } from '../services/red-phase-validator'

// ============================================================
// Helper：建立 mock schema SQL + entity mapping
// ============================================================

const SCHEMA_SQL = `
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id),
  total_amount INT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price INT NOT NULL,
  category VARCHAR(100) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`

const ENTITY_MAPPING = `
entity_to_table_mapping:
  - 使用者: users
  - 訂單: orders
  - 商品: products
`

const ACTIONS_YML = `
actions:
  - name: createUser
    summary: 建立使用者
    method: POST
    path: /api/users
    rules:
      - type: "前置（驗證）"
        description: "email 不可為空"
  - name: getOrders
    summary: 查詢訂單列表
    method: GET
    path: /api/orders
    rules:
      - type: "後置（回應）"
        description: "回傳訂單列表"
`

function makeFeature(actionName: string, content: string) {
  return { actionName, content, name: actionName }
}

// ============================================================
// extractEntitySetupSteps
// ============================================================

describe('extractEntitySetupSteps', () => {
  it('應該從 Feature 文本提取 entity_setup 步驟', () => {
    const content = `
Feature: 建立使用者

  Rule: 正常建立
    # Action: createUser
    # [POST] /api/users
    # Summary: 建立使用者

    Example: 建立成功
      Given 準備一個使用者, with table:
        | email          | name    |
        | alice@test.com | Alice   |
      When (No Actor) 建立使用者, call table:
        | email          | name    |
        | alice@test.com | Alice   |
`
    const steps = extractEntitySetupSteps(content)
    expect(steps).toHaveLength(1)
    expect(steps[0].entityName).toBe('使用者')
    expect(steps[0].headers).toEqual(['email', 'name'])
  })

  it('應該處理 VAR 前綴（>, <, $）', () => {
    const content = `
Feature: test
  Rule: r
    Example: e
      Given 準備一個使用者, with table:
        | >RegisteredUser.id | email          | password_hash |
        | $notnull            | alice@test.com | hashed123     |
`
    const steps = extractEntitySetupSteps(content)
    expect(steps).toHaveLength(1)
    // > prefix → strip prefix + take last segment after dot
    expect(steps[0].headers).toContain('id')
    expect(steps[0].headers).toContain('email')
    expect(steps[0].headers).toContain('password_hash')
  })

  it('應該處理多個 entity_setup 步驟', () => {
    const content = `
Feature: test
  Rule: r
    Example: e
      Given 準備一個使用者, with table:
        | email          |
        | alice@test.com |
      And 準備一個訂單, with table:
        | user_id | total_amount |
        | $User.id | 100          |
`
    const steps = extractEntitySetupSteps(content)
    expect(steps).toHaveLength(2)
    expect(steps[0].entityName).toBe('使用者')
    expect(steps[1].entityName).toBe('訂單')
  })

  it('應該處理中文逗號', () => {
    const content = `
Feature: test
  Rule: r
    Example: e
      Given 準備一個商品，with table:
        | name | price |
        | 蘋果 | 100   |
`
    const steps = extractEntitySetupSteps(content)
    expect(steps).toHaveLength(1)
    expect(steps[0].entityName).toBe('商品')
  })

  it('沒有 DataTable 時不返回', () => {
    const content = `
Feature: test
  Rule: r
    Example: e
      Given 準備一個使用者, with table:
      When (No Actor) 建立使用者, call table:
`
    const steps = extractEntitySetupSteps(content)
    expect(steps).toHaveLength(0)
  })
})

// ============================================================
// Check 9: DataTable Column Coverage
// ============================================================

describe('Check 9: DataTable Column Coverage', () => {
  it('合法欄位不應產生 issue', () => {
    const feature = makeFeature('createUser', `
Feature: 建立使用者
  Rule: r
    # Action: createUser
    # [POST] /api/users
    # Summary: 建立使用者
    Example: e
      Given 準備一個使用者, with table:
        | email          | name    |
        | alice@test.com | Alice   |
`)
    const result = executeRedPhase({
      features: [feature],
      actionsYml: ACTIONS_YML,
      schemaSql: SCHEMA_SQL,
      entityMapping: ENTITY_MAPPING,
    })
    const columnIssues = result.issues.filter(i => i.issueType === 'column_not_found')
    expect(columnIssues).toHaveLength(0)
  })

  it('camelCase 欄位應能映射到 snake_case column', () => {
    const feature = makeFeature('createUser', `
Feature: 建立使用者
  Rule: r
    # Action: createUser
    # [POST] /api/users
    # Summary: 建立使用者
    Example: e
      Given 準備一個使用者, with table:
        | email          | passwordHash |
        | alice@test.com | hashed       |
`)
    const result = executeRedPhase({
      features: [feature],
      actionsYml: ACTIONS_YML,
      schemaSql: SCHEMA_SQL,
      entityMapping: ENTITY_MAPPING,
    })
    const columnIssues = result.issues.filter(i => i.issueType === 'column_not_found')
    expect(columnIssues).toHaveLength(0)
  })

  it('不存在的欄位應產生 error', () => {
    const feature = makeFeature('createUser', `
Feature: 建立使用者
  Rule: r
    # Action: createUser
    # [POST] /api/users
    # Summary: 建立使用者
    Example: e
      Given 準備一個使用者, with table:
        | email          | nonExistentColumn |
        | alice@test.com | value             |
`)
    const result = executeRedPhase({
      features: [feature],
      actionsYml: ACTIONS_YML,
      schemaSql: SCHEMA_SQL,
      entityMapping: ENTITY_MAPPING,
    })
    const columnIssues = result.issues.filter(i => i.issueType === 'column_not_found')
    expect(columnIssues).toHaveLength(1)
    expect(columnIssues[0].severity).toBe('error')
    expect(columnIssues[0].description).toContain('nonExistentColumn')
  })

  it('存在於其他表的欄位應產生 warning（跨表 FK 解析）', () => {
    // 訂單表的 entity_setup 中包含 email（存在於 users 表）
    const feature = makeFeature('getOrders', `
Feature: 查詢訂單列表
  Rule: r
    # Action: getOrders
    # [GET] /api/orders
    # Summary: 查詢訂單列表
    Example: e
      Given 準備一個訂單, with table:
        | email          | total_amount |
        | alice@test.com | 100          |
`)
    const result = executeRedPhase({
      features: [feature],
      actionsYml: ACTIONS_YML,
      schemaSql: SCHEMA_SQL,
      entityMapping: ENTITY_MAPPING,
    })
    const columnIssues = result.issues.filter(i => i.issueType === 'column_not_found')
    expect(columnIssues).toHaveLength(1)
    expect(columnIssues[0].severity).toBe('warning') // 跨表 FK 解析
    expect(columnIssues[0].description).toContain('email')
    expect(columnIssues[0].description).toContain('其他表')
  })
})

// ============================================================
// Check 10: NOT NULL Column Completeness
// ============================================================

describe('Check 10: NOT NULL Column Completeness', () => {
  it('缺少 NOT NULL column 應產生 warning', () => {
    // 使用者表有 email 和 password_hash 是 NOT NULL
    // 但 DataTable 只提供 email
    const feature = makeFeature('createUser', `
Feature: 建立使用者
  Rule: r
    # Action: createUser
    # [POST] /api/users
    # Summary: 建立使用者
    Example: e
      Given 準備一個使用者, with table:
        | email          |
        | alice@test.com |
`)
    const result = executeRedPhase({
      features: [feature],
      actionsYml: ACTIONS_YML,
      schemaSql: SCHEMA_SQL,
      entityMapping: ENTITY_MAPPING,
    })
    const nullIssues = result.issues.filter(i => i.issueType === 'not_null_missing')
    // password_hash 是 NOT NULL 且無 DEFAULT，應被偵測到
    expect(nullIssues.some(i => i.description.includes('password_hash'))).toBe(true)
    expect(nullIssues.every(i => i.severity === 'warning')).toBe(true)
  })

  it('有 DEFAULT 的 NOT NULL column 不應觸發 warning', () => {
    // status 在 orders 表有 DEFAULT 'pending'
    const feature = makeFeature('getOrders', `
Feature: 查詢訂單列表
  Rule: r
    # Action: getOrders
    # [GET] /api/orders
    # Summary: 查詢訂單列表
    Example: e
      Given 準備一個訂單, with table:
        | user_id                              | total_amount |
        | 00000000-0000-0000-0000-000000000001 | 100          |
`)
    const result = executeRedPhase({
      features: [feature],
      actionsYml: ACTIONS_YML,
      schemaSql: SCHEMA_SQL,
      entityMapping: ENTITY_MAPPING,
    })
    const nullIssues = result.issues.filter(i => i.issueType === 'not_null_missing')
    // status 有 DEFAULT 'pending'，不應出現
    expect(nullIssues.every(i => !i.description.includes('status'))).toBe(true)
  })

  it('FK UUID 欄位（_id）不應觸發 warning', () => {
    // 訂單表的 user_id 是 FK UUID，應被跳過
    const feature = makeFeature('getOrders', `
Feature: 查詢訂單列表
  Rule: r
    # Action: getOrders
    # [GET] /api/orders
    # Summary: 查詢訂單列表
    Example: e
      Given 準備一個訂單, with table:
        | total_amount |
        | 100          |
`)
    const result = executeRedPhase({
      features: [feature],
      actionsYml: ACTIONS_YML,
      schemaSql: SCHEMA_SQL,
      entityMapping: ENTITY_MAPPING,
    })
    const nullIssues = result.issues.filter(i => i.issueType === 'not_null_missing')
    // user_id 是 FK UUID → 不應觸發
    expect(nullIssues.every(i => !i.description.includes('user_id'))).toBe(true)
  })
})

// ============================================================
// Check 11: FK Reference Table Validity
// ============================================================

describe('Check 11: FK Reference Table Validity', () => {
  it('合法 FK 引用不應產生 issue', () => {
    const feature = makeFeature('getOrders', `
Feature: 查詢訂單列表
  Rule: r
    # Action: getOrders
    # [GET] /api/orders
    # Summary: 查詢訂單列表
    Example: e
      Given 準備一個訂單, with table:
        | user_id                              | total_amount |
        | 00000000-0000-0000-0000-000000000001 | 100          |
`)
    const result = executeRedPhase({
      features: [feature],
      actionsYml: ACTIONS_YML,
      schemaSql: SCHEMA_SQL,
      entityMapping: ENTITY_MAPPING,
    })
    const fkIssues = result.issues.filter(i => i.issueType === 'fk_table_not_found')
    expect(fkIssues).toHaveLength(0)
  })

  it('引用不存在的表應產生 warning', () => {
    const feature = makeFeature('getOrders', `
Feature: 查詢訂單列表
  Rule: r
    # Action: getOrders
    # [GET] /api/orders
    # Summary: 查詢訂單列表
    Example: e
      Given 準備一個訂單, with table:
        | category_id                          | total_amount |
        | 00000000-0000-0000-0000-000000000001 | 100          |
`)
    const result = executeRedPhase({
      features: [feature],
      actionsYml: ACTIONS_YML,
      schemaSql: SCHEMA_SQL,
      entityMapping: ENTITY_MAPPING,
    })
    const fkIssues = result.issues.filter(i => i.issueType === 'fk_table_not_found')
    expect(fkIssues).toHaveLength(1)
    expect(fkIssues[0].severity).toBe('warning')
    expect(fkIssues[0].description).toContain('category_id')
  })
})

// ============================================================
// 整合測試：executeRedPhase 包含新 checks
// ============================================================

describe('executeRedPhase 整合 Schema Checks', () => {
  it('所有欄位合法 + NOT NULL 完整 → 全通過', () => {
    const feature = makeFeature('createUser', `
Feature: 建立使用者
  Rule: r
    # Action: createUser
    # [POST] /api/users
    # Summary: 建立使用者
    Example: e
      Given 準備一個使用者, with table:
        | email          | password_hash | name  |
        | alice@test.com | hashed123     | Alice |
      When (No Actor) 建立使用者, call table:
        | email          | password_hash | name  |
        | alice@test.com | hashed123     | Alice |
`)
    const result = executeRedPhase({
      features: [feature],
      actionsYml: ACTIONS_YML,
      schemaSql: SCHEMA_SQL,
      entityMapping: ENTITY_MAPPING,
    })
    const schemaIssues = result.issues.filter(i =>
      ['column_not_found', 'not_null_missing', 'fk_table_not_found'].includes(i.issueType)
    )
    expect(schemaIssues).toHaveLength(0)
  })

  it('schema 為空時新 checks 不執行', () => {
    const feature = makeFeature('createUser', `
Feature: 建立使用者
  Rule: r
    # Action: createUser
    # [POST] /api/users
    # Summary: 建立使用者
    Example: e
      Given 準備一個使用者, with table:
        | nonExistentColumn |
        | value             |
`)
    const result = executeRedPhase({
      features: [feature],
      actionsYml: ACTIONS_YML,
      schemaSql: '', // 空 schema
      entityMapping: '',
    })
    const schemaIssues = result.issues.filter(i =>
      ['column_not_found', 'not_null_missing', 'fk_table_not_found'].includes(i.issueType)
    )
    expect(schemaIssues).toHaveLength(0)
  })
})
