// ============================================================
// Feature Alignment Gate — Check 5 (VAR-System 對齊)
// L15.P0：在 case 不一致之外，加「完全未宣告」偵測
// 根因：LLM 寫 `$Store.id` 但 Background 完全沒 `>Store1.id` 宣告 →
//       runtime 拋「VAR 解析失敗：$Store.id 無法解析」→ scenario 全 fail
// ============================================================

import { describe, it, expect } from 'vitest'
import { runAlignmentChecks } from '../services/feature-alignment-gate'

// 最小合法 actionsYml / schemaSql / entityMapping（Check 5 不依賴這些的正確性）
const BASE_ACTIONS_YML = `actions:
  - name: create_order
    summary: Create Order
    http_method: POST
    http_path: /api/orders
    input: {}
    output: {}
`

const BASE_SCHEMA_SQL = `CREATE TABLE customers (id UUID PRIMARY KEY);
CREATE TABLE stores (id UUID PRIMARY KEY);
CREATE TABLE menu_items (id UUID PRIMARY KEY);
CREATE TABLE orders (id UUID PRIMARY KEY);`

const BASE_ENTITY_MAPPING = `entity_to_table_mapping:
  - Customer: customers
  - Store: stores
  - MenuItem: menu_items
  - Order: orders
`

function makeInput(featureContent: string) {
  return {
    features: [{ name: 'Create Order', actionName: 'create_order', content: featureContent }],
    actionsYml: BASE_ACTIONS_YML,
    schemaSql: BASE_SCHEMA_SQL,
    entityMapping: BASE_ENTITY_MAPPING,
  }
}

function varIssues(issues: Awaited<ReturnType<typeof runAlignmentChecks>>) {
  return issues.filter(i => i.checkName === 'var_system_alignment')
}

describe('Check 5 — 未宣告 VAR 偵測（L15.P0 新增）', () => {
  it('❌ $Store.id 引用但 Background 完全沒 >Store*.id 宣告 → 報 error', async () => {
    const feature = `# Action: create_order
# [POST] /api/orders
# Summary: Create Order
Feature: Create Order

  Background:
    Given 準備一個Customer, with table:
      | >Customer1.id | email              | name     |
      | <customer1Id  | john@example.com   | John Doe |

  Rule: 後置（狀態）- Order should be created

    Example: Successfully create an order
      When (UID="$Customer1.id") Create Order, call table:
        | storeId    |
        | $Store.id  |
      Then Create Order(201)回應, with table:
        | id       |
        | $notnull |`
    const issues = await runAlignmentChecks(makeInput(feature))
    const varErrors = varIssues(issues)
    expect(varErrors.length).toBeGreaterThan(0)
    expect(varErrors.some(e => e.description.includes('$Store.id') && e.description.includes('完全未宣告'))).toBe(true)
    // 建議應該提示補宣告
    expect(varErrors.some(e => e.description.includes('>Store1.id'))).toBe(true)
  })

  it('❌ 多個未宣告變數（$Store.id / $MenuItem.id / $Customer.id）全部報出', async () => {
    // extractVarDeclarationsAndReferences 只掃 DataTable 行，所以把引用全放 DataTable
    const feature = `# Action: create_order
# [POST] /api/orders
# Summary: Create Order
Feature: Create Order

  Background:

  Rule: 後置（狀態）- Order created

    Example: Successfully create
      When (No Actor) Create Order, call table:
        | customerId    | storeId    | menuItemId    |
        | $Customer.id  | $Store.id  | $MenuItem.id  |
      Then Create Order(201)回應, with table:
        | id       |
        | $notnull |`
    const issues = await runAlignmentChecks(makeInput(feature))
    const varErrors = varIssues(issues)
    const unDeclaredVars = varErrors
      .filter(e => e.description.includes('完全未宣告'))
      .map(e => e.description.match(/\$[A-Za-z.]+/)?.[0])
      .filter(Boolean)
    expect(unDeclaredVars).toEqual(expect.arrayContaining(['$Customer.id', '$Store.id', '$MenuItem.id']))
  })

  it('✅ $notnull / $isNull 等系統常數不報錯', async () => {
    const feature = `# Action: create_order
# [POST] /api/orders
# Summary: Create Order
Feature: Create Order

  Background:
    Given 準備一個Customer, with table:
      | >Customer1.id | name     |
      | <customer1Id  | John Doe |

  Rule: 後置（回應）- Respond with order id

    Example: Successfully create
      When (UID="$Customer1.id") Create Order, call table:
        | foo |
        | bar |
      Then Create Order(201)回應, with table:
        | id       | status   |
        | $notnull | $notnull |`
    const issues = await runAlignmentChecks(makeInput(feature))
    const varErrors = varIssues(issues)
    // 不應把 $notnull 當未宣告
    expect(varErrors.filter(e => e.description.includes('$notnull'))).toHaveLength(0)
  })

  it('✅ Background 有宣告 >Customer1.id，Scenario 引用 $Customer1.id → 不報錯', async () => {
    const feature = `# Action: create_order
# [POST] /api/orders
# Summary: Create Order
Feature: Create Order

  Background:
    Given 準備一個Customer, with table:
      | >Customer1.id | name     |
      | <customer1Id  | John Doe |

  Rule: 後置（狀態）- Order created

    Example: Successfully create
      When (UID="$Customer1.id") Create Order, call table:
        | foo |
        | bar |
      Then Create Order(201)回應, with table:
        | id       |
        | $notnull |`
    const issues = await runAlignmentChecks(makeInput(feature))
    const varErrors = varIssues(issues)
    expect(varErrors).toHaveLength(0)
  })

  it('✅ executionKey 捕獲的變數（$customer1Id）允許引用', async () => {
    // Background 宣告 >Customer1.id 同 cell 捕獲 <customer1Id
    // 後續 Scenario 引用 $customer1Id 應算解析得出
    const feature = `# Action: create_order
# [POST] /api/orders
# Summary: Create Order
Feature: Create Order

  Background:
    Given 準備一個Customer, with table:
      | >Customer1.id | name     |
      | <customer1Id  | John Doe |

  Rule: 後置（狀態）- Order created

    Example: Successfully create
      When (UID="$customer1Id") Create Order, call table:
        | foo |
        | bar |
      Then Create Order(201)回應, with table:
        | id       |
        | $notnull |`
    const issues = await runAlignmentChecks(makeInput(feature))
    const varErrors = varIssues(issues)
    expect(varErrors).toHaveLength(0)
  })

  it('⚠️ 大小寫不一致沿用原 Check 5 邏輯（不被新邏輯搶走）', async () => {
    // Background 宣告 >Customer1.id，Scenario 引用 $CUSTOMER1.ID（大寫不一致）
    // 應該報「大小寫不一致」而非「完全未宣告」
    const feature = `# Action: create_order
# [POST] /api/orders
# Summary: Create Order
Feature: Create Order

  Background:
    Given 準備一個Customer, with table:
      | >Customer1.id | name     |
      | <customer1Id  | John Doe |

  Rule: 後置（狀態）- Order created

    Example: Successfully create
      When (No Actor) Create Order, call table:
        | customerId    |
        | $CUSTOMER1.ID |
      Then Create Order(201)回應, with table:
        | id       |
        | $notnull |`
    const issues = await runAlignmentChecks(makeInput(feature))
    const varErrors = varIssues(issues)
    // 應命中大小寫不一致，而非完全未宣告
    expect(varErrors.some(e => e.description.includes('大小寫不一致'))).toBe(true)
    expect(varErrors.some(e => e.description.includes('完全未宣告'))).toBe(false)
  })

  it('❌ 單層變數名 $orphan 未宣告也會被抓', async () => {
    const feature = `# Action: create_order
# [POST] /api/orders
# Summary: Create Order
Feature: Create Order

  Background:

  Rule: 後置（狀態）- Order created

    Example: Successfully create
      When (No Actor) Create Order, call table:
        | foo      |
        | $orphan  |
      Then Create Order(201)回應, with table:
        | id       |
        | $notnull |`
    const issues = await runAlignmentChecks(makeInput(feature))
    const varErrors = varIssues(issues)
    expect(varErrors.some(e => e.description.includes('$orphan') && e.description.includes('完全未宣告'))).toBe(true)
  })
})
