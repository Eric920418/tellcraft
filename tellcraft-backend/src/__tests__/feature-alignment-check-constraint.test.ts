// ============================================================
// L17.P1: Check 8 — DDL CHECK 約束違反偵測
// 測試 parseCheckConstraintSpec + extractEntitySetupWithData + runAlignmentChecks 整合
// ============================================================

import { describe, it, expect } from 'vitest'
import {
  parseCheckConstraintSpec,
  extractEntitySetupWithData,
  runAlignmentChecks,
} from '../services/feature-alignment-gate'

describe('parseCheckConstraintSpec', () => {
  it('IN (...) 單引號字串 → enum', () => {
    expect(parseCheckConstraintSpec("status IN ('active','inactive','paused')"))
      .toEqual({ kind: 'enum', values: ['active', 'inactive', 'paused'] })
  })

  it('IN (...) 含空格', () => {
    expect(parseCheckConstraintSpec("delivery_type IN ( 'pickup' , 'delivery' )"))
      .toEqual({ kind: 'enum', values: ['pickup', 'delivery'] })
  })

  it('= \'x\' → enum 單值', () => {
    expect(parseCheckConstraintSpec("role = 'admin'"))
      .toEqual({ kind: 'enum', values: ['admin'] })
  })

  it('= N → range 等值', () => {
    expect(parseCheckConstraintSpec('priority = 5'))
      .toEqual({ kind: 'range', op: '=', value: 5 })
  })

  it('>= N → range', () => {
    expect(parseCheckConstraintSpec('rating >= 1'))
      .toEqual({ kind: 'range', op: '>=', value: 1 })
  })

  it('<= N', () => {
    expect(parseCheckConstraintSpec('rating <= 5'))
      .toEqual({ kind: 'range', op: '<=', value: 5 })
  })

  it('小數值', () => {
    expect(parseCheckConstraintSpec('price >= 0.01'))
      .toEqual({ kind: 'range', op: '>=', value: 0.01 })
  })

  it('負數', () => {
    expect(parseCheckConstraintSpec('delta > -100'))
      .toEqual({ kind: 'range', op: '>', value: -100 })
  })

  it('複雜 expression（length / regex / 多條件）→ null（fail-open）', () => {
    expect(parseCheckConstraintSpec('length(email) > 5')).toBeNull()
    expect(parseCheckConstraintSpec("email ~ '^[a-z]+@'")).toBeNull()
    // 多條件 AND 現階段取 IN 或第一個比較，fail-open 其他情境
    const multi = parseCheckConstraintSpec("status = 'active' AND price >= 0")
    // status='active' 會 match enum — 接受此行為
    expect(multi).toEqual({ kind: 'enum', values: ['active'] })
  })

  it('空字串 → null', () => {
    expect(parseCheckConstraintSpec('')).toBeNull()
  })
})

describe('extractEntitySetupWithData', () => {
  it('抽出 entity_setup 步驟的 entity + headers + data rows', () => {
    const content = `Feature: Test
  Background:
    Given 準備一個Store, with table:
      | >Store1.id | name      | status   |
      | <store1Id  | My Store  | active   |
    And 準備一個MenuItem, with table:
      | >MenuItem1.id | name        | price |
      | <menuItem1Id  | Kung Pao    | 120   |`
    const results = extractEntitySetupWithData(content)
    expect(results).toHaveLength(2)
    expect(results[0].entityName).toBe('Store')
    expect(results[0].rawHeaders).toEqual(['>Store1.id', 'name', 'status'])
    expect(results[0].dataRows).toHaveLength(1)
    expect(results[0].dataRows[0].cells).toEqual(['<store1Id', 'My Store', 'active'])
    expect(results[1].entityName).toBe('MenuItem')
    expect(results[1].dataRows[0].cells).toEqual(['<menuItem1Id', 'Kung Pao', '120'])
  })

  it('多個 data rows', () => {
    const content = `    Given 準備一個Customer, with table:
      | >Customer1.id | name |
      | <customer1Id  | John |
      | <customer2Id  | Mary |`
    const results = extractEntitySetupWithData(content)
    // 注意：第二個 data row 其實是錯的（應該用新的 >Customer2.id 宣告），但 extractor 不檢查語義
    expect(results).toHaveLength(1)
    expect(results[0].dataRows).toHaveLength(2)
  })

  it('無 DataTable → skip', () => {
    const content = `Feature: X
  Background:
    Given 準備一個Store, with table:
    # 沒有 DataTable 行
`
    expect(extractEntitySetupWithData(content)).toEqual([])
  })
})

describe('Check 8 — CHECK 約束違反偵測（整合）', () => {
  const BASE_ACTIONS_YML = `actions:
  - name: create_order
    summary: Create Order
    http_method: POST
    http_path: /api/orders
    input: {}
    output: {}
`
  const SCHEMA_WITH_CHECK = `CREATE TABLE orders (
  id UUID PRIMARY KEY,
  delivery_type VARCHAR(20) NOT NULL CHECK (delivery_type IN ('pickup','delivery')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5)
);`
  const ENTITY_MAPPING = `entity_to_table_mapping:
  - Order: orders
`

  function makeInput(featureContent: string) {
    return {
      features: [{ name: 'Create Order', actionName: 'create_order', content: featureContent }],
      actionsYml: BASE_ACTIONS_YML,
      schemaSql: SCHEMA_WITH_CHECK,
      entityMapping: ENTITY_MAPPING,
    }
  }

  it('❌ deliveryType 值不在允許範圍 → 報 check_constraint error', async () => {
    const feature = `# Action: create_order
# [POST] /api/orders
# Summary: Create Order
Feature: Create Order

  Background:
    Given 準備一個Order, with table:
      | >Order1.id | deliveryType |
      | <order1Id  | takeout      |

  Rule: 後置（狀態）- Order created
    Example: ok
      When (No Actor) Create Order, call table:
        | x |
        | y |
      Then Create Order(201)回應, with table:
        | id       |
        | $notnull |`
    const issues = await runAlignmentChecks(makeInput(feature))
    const checkErrors = issues.filter(i => i.checkName === 'check_constraint')
    expect(checkErrors.length).toBeGreaterThan(0)
    expect(checkErrors[0].description).toContain('takeout')
    expect(checkErrors[0].description).toContain("'pickup'")
    expect(checkErrors[0].description).toContain("'delivery'")
  })

  it('✅ deliveryType = \'pickup\' → 無 error', async () => {
    const feature = `# Action: create_order
# [POST] /api/orders
# Summary: Create Order
Feature: Create Order

  Background:
    Given 準備一個Order, with table:
      | >Order1.id | deliveryType |
      | <order1Id  | pickup       |

  Rule: 後置（狀態）- ok
    Example: ok
      When (No Actor) Create Order, call table:
        | x |
        | y |
      Then Create Order(201)回應, with table:
        | id       |
        | $notnull |`
    const issues = await runAlignmentChecks(makeInput(feature))
    expect(issues.filter(i => i.checkName === 'check_constraint')).toHaveLength(0)
  })

  it('✅ runtime value（$var / <executionKey）跳過不誤報', async () => {
    const feature = `Feature: Create Order

  Background:
    Given 準備一個Order, with table:
      | >Order1.id | deliveryType  |
      | <order1Id  | $someVariable |

  Rule: ok
    Example: ok
      When (No Actor) Create Order, call table:
        | x |
        | y |
      Then Create Order(201)回應, with table:
        | id       |
        | $notnull |`
    const issues = await runAlignmentChecks(makeInput(feature))
    expect(issues.filter(i => i.checkName === 'check_constraint')).toHaveLength(0)
  })
})
