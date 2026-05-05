// ============================================================
// Feature Alignment Gate — L31.G: Check 12/13 誤報修補
//
// 4 類已知誤報必須跳過：
// A. Server-generated（token/JWT）：不在 schema columns
// B. Aggregation 子物件（seoSettings）：不在 schema columns
// C. Pagination metadata（total/data）：不在 schema columns
// D. User API input（Create 的 name="X"）：value 在 When call table
//
// + Regression：真矛盾（List Service Items.imageUrl）仍要報 error
// ============================================================

import { describe, it, expect } from 'vitest'
import {
  runAlignmentChecks,
  extractWhenCallTableValues,
  extractAllSchemaColumnNames,
} from '../services/feature-alignment-gate'

const SCHEMA_SQL_BASIC = `CREATE TABLE admins (
  id UUID PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL
);
CREATE TABLE service_items (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price_label VARCHAR(50),
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0
);
CREATE TABLE inquiries (
  id UUID PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  email_notified BOOLEAN NOT NULL DEFAULT false
);`

const ENTITY_MAPPING_BASIC = `entity_to_table_mapping:
  - Admin: admins
  - ServiceItem: service_items
  - Inquiry: inquiries
`

function makeInput(name: string, actionName: string, content: string) {
  return {
    features: [{ name, actionName, content }],
    actionsYml: `actions:\n  - name: ${actionName}\n    summary: ${name}\n    http_method: POST\n    http_path: /api/${actionName}\n    input: {}\n    output: {}`,
    schemaSql: SCHEMA_SQL_BASIC,
    entityMapping: ENTITY_MAPPING_BASIC,
  }
}

describe('extractWhenCallTableValues', () => {
  it('解析 When call table headers + values（去 var/sentinel）', () => {
    const content = `
  Example: Test
    When (No Actor) Demo Action, call table:
      | name      | age | userId    | status   |
      | John Doe  | 30  | $User1.id | $notnull |
`
    const { headers, values } = extractWhenCallTableValues(content)
    expect(headers.has('name')).toBe(true)
    expect(headers.has('userId')).toBe(true)
    expect(values.has('John Doe')).toBe(true)
    expect(values.has('30')).toBe(true)
    expect(values.has('$User1.id')).toBe(false)  // var 跳過
    expect(values.has('$notnull')).toBe(false)   // sentinel 跳過
  })
})

describe('extractAllSchemaColumnNames', () => {
  it('提取 schema 所有 column names（snake_case + camelCase）', () => {
    const cols = extractAllSchemaColumnNames(SCHEMA_SQL_BASIC)
    expect(cols.has('username')).toBe(true)
    expect(cols.has('password_hash')).toBe(true)
    expect(cols.has('passwordHash')).toBe(true)  // camelCase variant
    expect(cols.has('image_url')).toBe(true)
    expect(cols.has('imageUrl')).toBe(true)
  })
  it('跳過 PRIMARY KEY / FOREIGN KEY 等約束行', () => {
    const sql = `CREATE TABLE x (id UUID PRIMARY KEY, name TEXT, CONSTRAINT pk_x PRIMARY KEY (id), FOREIGN KEY (other_id) REFERENCES y(id));`
    const cols = extractAllSchemaColumnNames(sql)
    expect(cols.has('id')).toBe(true)
    expect(cols.has('name')).toBe(true)
    expect(cols.has('foreign')).toBe(false)  // 約束關鍵字不該被當欄位
    expect(cols.has('constraint')).toBe(false)
  })
  it('空 schema → 空 set（不爆）', () => {
    expect(extractAllSchemaColumnNames('').size).toBe(0)
  })
})

describe('Check 12 (notnull) — 誤報修補', () => {
  it('A. token (JWT, server-gen) 不在 schema → 不報', async () => {
    const feature = `# Action: admin_login
# [POST] /api/admin_login
# Summary: Admin Login
Feature: Admin Login

  Rule: 後置（回應）

    Example: Login succeeds and returns a valid access token when credentials are correct
      Given 準備一個Admin, with table:
        | >Admin1.id | username | passwordHash |
        | <admin1Id  | admin    | hashed       |
      When (No Actor) Admin Login, call table:
        | username | password |
        | admin    | secret   |
      Then Admin Login(200)回應, with table:
        | username | token    |
        | admin    | $notnull |
`
    const issues = await runAlignmentChecks(makeInput('Admin Login', 'admin_login', feature))
    const notnullIssues = issues.filter(i => i.checkName === 'notnull_field_missing_from_setup' && i.description.includes('token'))
    expect(notnullIssues).toHaveLength(0)
  })

  it('D. user input field via When call → 不報', async () => {
    const feature = `# Action: create_service_item
# [POST] /api/create_service_item
# Summary: Create Service Item
Feature: Create Service Item

  Rule: 後置（回應）

    Example: Creating with image url echoes back
      Given 準備一個Admin, with table:
        | >Admin1.id | username | passwordHash |
        | <admin1Id  | admin    | hashed       |
      When (UID="$Admin1.id") Create Service Item, call table:
        | name              | imageUrl                       |
        | Split AC Cleaning | https://cdn.x/split-ac.jpg     |
      Then Create Service Item(200)回應, with table:
        | name              | imageUrl                       |
        | Split AC Cleaning | https://cdn.x/split-ac.jpg     |
`
    const issues = await runAlignmentChecks(makeInput('Create Service Item', 'create_service_item', feature))
    // imageUrl 在 When call table headers + values 都有 → 不報
    const allMissing = issues.filter(i =>
      (i.checkName === 'notnull_field_missing_from_setup' || i.checkName === 'then_concrete_value_missing_from_setup')
      && (i.description.includes('imageUrl') || i.description.includes('name'))
    )
    expect(allMissing).toHaveLength(0)
  })
})

describe('Check 13 (literal) — 誤報修補', () => {
  it('C. pagination metadata (total/data) 不在 schema → 不報', async () => {
    const feature = `# Action: list_inquiries
# [GET] /api/list_inquiries
# Summary: List Inquiries
Feature: List Inquiries

  Rule: 後置（回應）

    Example: No inquiries returns empty array
      Given 準備一個Admin, with table:
        | >Admin1.id | username | passwordHash |
        | <admin1Id  | admin    | hashed       |
      When (UID="$Admin1.id") List Inquiries, call table:
        | page |
        | 1    |
      Then List Inquiries(200)回應, with table:
        | total | data |
        | 0     | []   |
`
    const issues = await runAlignmentChecks(makeInput('List Inquiries', 'list_inquiries', feature))
    const concreteIssues = issues.filter(i => i.checkName === 'then_concrete_value_missing_from_setup' && (i.description.includes('total') || i.description.includes('data')))
    expect(concreteIssues).toHaveLength(0)
  })

  it('D. Submit Inquiry 的 customerName "John Doe" 在 When call → 不報', async () => {
    const feature = `# Action: submit_inquiry
# [POST] /api/submit_inquiry
# Summary: Submit Inquiry
Feature: Submit Inquiry

  Rule: 後置（回應）

    Example: Visitor submits a valid inquiry and isRead defaults to false
      When (No Actor) Submit Inquiry, call table:
        | customerName | phone      | message       |
        | John Doe     | 0912345678 | Need cleaning |
      Then Submit Inquiry(200)回應, with table:
        | customerName | phone      | isRead |
        | John Doe     | 0912345678 | false  |
`
    const issues = await runAlignmentChecks(makeInput('Submit Inquiry', 'submit_inquiry', feature))
    const concreteIssues = issues.filter(i => i.checkName === 'then_concrete_value_missing_from_setup' && (i.description.includes('customerName') || i.description.includes('phone')))
    expect(concreteIssues).toHaveLength(0)
  })

  it('Check 13 嚴格度降為 warning（不再阻擋 alignment gate）', async () => {
    // 構造一個 Check 13 會觸發但沒被 filter 跳過的 case：
    // 用 Read 操作（List）+ Then 期望具體值 + entity_setup 沒給 + 也不在 When call
    const feature = `# Action: list_service_items
# [GET] /api/list_service_items
# Summary: List Service Items
Feature: List Service Items

  Rule: 後置（回應）

    Example: Returns specific item
      Given 準備一個ServiceItem, with table:
        | >ServiceItem1.id | sortOrder |
        | <itemId          | 0         |
      When (No Actor) List Service Items, call table:
        | dummy |
        | _     |
      Then List Service Items(200)回應, with table:
        | name              |
        | Split AC Cleaning |
`
    const issues = await runAlignmentChecks(makeInput('List Service Items', 'list_service_items', feature))
    const concreteIssues = issues.filter(i => i.checkName === 'then_concrete_value_missing_from_setup')
    expect(concreteIssues.length).toBeGreaterThan(0)
    expect(concreteIssues[0].severity).toBe('warning')  // 不是 error
  })
})

describe('Regression — 真矛盾仍要報 error', () => {
  it('List Service Items.imageUrl $notnull（schema 有 image_url + entity_setup 沒給 + When 沒給）→ 仍報 error', async () => {
    const feature = `# Action: list_service_items
# [GET] /api/list_service_items
# Summary: List Service Items
Feature: List Service Items

  Rule: 後置（回應）

    Example: Each item has imageUrl
      Given 準備一個ServiceItem, with table:
        | >ServiceItem1.id | name              |
        | <itemId          | Split AC Cleaning |
      When (No Actor) List Service Items, call table:
        | dummy |
        | _     |
      Then List Service Items(200)回應, with table:
        | imageUrl |
        | $notnull |
`
    const issues = await runAlignmentChecks(makeInput('List Service Items', 'list_service_items', feature))
    const notnullIssues = issues.filter(i => i.checkName === 'notnull_field_missing_from_setup' && i.description.includes('imageUrl'))
    expect(notnullIssues).toHaveLength(1)
    expect(notnullIssues[0].severity).toBe('error')
  })
})
