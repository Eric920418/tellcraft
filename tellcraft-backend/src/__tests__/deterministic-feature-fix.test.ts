// ============================================================
// L17.P2: Deterministic Feature 補宣告
// ============================================================

import { describe, it, expect } from 'vitest'
import {
  autoDeclareUndeclaredVars,
  extractBackgroundBounds,
  insertIntoBackground,
  buildForeignKeyGraph,
  topologicalSort,
  getRequiredColumns,
  sampleValueForColumn,
} from '../services/deterministic-feature-fix'
import { DatabaseSchema, TableDefinition, type ColumnDefinition } from '../lib/specformula/spec/data/models'

// Helper: 快速建 DatabaseSchema
function makeSchema(spec: Record<string, { tableName: string; cols: ColumnDefinition[] }>): DatabaseSchema[] {
  const schema = new DatabaseSchema()
  for (const { tableName, cols } of Object.values(spec)) {
    const table = new TableDefinition(tableName)
    table.columns = cols
    schema.tables.push(table)
  }
  const mappingEntries = Object.entries(spec).map(([entity, { tableName }]) => ({ [entity]: tableName }))
  schema.setEntityTableMapping({ entity_to_table_mapping: mappingEntries })
  return [schema]
}

function col(name: string, type: string, extra: Partial<ColumnDefinition> = {}): ColumnDefinition {
  return { name, type, notNull: false, primaryKey: false, ...extra }
}

// ============================================================
// extractBackgroundBounds
// ============================================================

describe('extractBackgroundBounds', () => {
  it('有 Background：回傳 startLine / endLine / indent', () => {
    const content = `Feature: Test

  Background:
    Given 準備一個Store, with table:
      | >Store1.id | name |
      | <store1Id  | Foo  |

  Rule: R
    Example: ok
      When X
      Then Y`
    const b = extractBackgroundBounds(content)
    expect(b).not.toBeNull()
    expect(b!.startLine).toBe(3)  // 1-based line of "Background:"
    expect(b!.indent).toBe('  ')
    // endLine 該是最後一個 Background 內容行（`| <store1Id | Foo |`）
    expect(b!.endLine).toBeGreaterThanOrEqual(6)
  })

  it('無 Background：回 null', () => {
    const content = `Feature: Test
  Rule: R
    Example: ok
      When X`
    expect(extractBackgroundBounds(content)).toBeNull()
  })
})

// ============================================================
// insertIntoBackground
// ============================================================

describe('insertIntoBackground', () => {
  it('有 Background：append 到最末，第一步改 And', () => {
    const content = `Feature: Test

  Background:
    Given 準備一個Store, with table:
      | >Store1.id | name |
      | <store1Id  | Foo  |

  Rule: R`
    const newLines = [
      `    Given 準備一個MenuItem, with table:`,
      `      | >MenuItem1.id | name |`,
      `      | <menuItem1Id  | Pao  |`,
    ]
    const out = insertIntoBackground(content, newLines)
    expect(out).toContain('準備一個MenuItem')
    expect(out).toContain('And 準備一個MenuItem')  // Given 被改成 And
    expect(out).not.toContain('Given 準備一個MenuItem')  // 原始的 Given 被替換
  })

  it('無 Background：在 Feature: 後插新 Background', () => {
    const content = `Feature: Test

  Rule: R
    Example: ok
      When X`
    const newLines = [
      `    Given 準備一個Store, with table:`,
      `      | >Store1.id | name |`,
      `      | <store1Id  | Foo  |`,
    ]
    const out = insertIntoBackground(content, newLines)
    expect(out).toContain('Background:')
    expect(out).toContain('Given 準備一個Store')
    // 順序：Feature: → Background: → Store → Rule
    const fIdx = out.indexOf('Feature:')
    const bIdx = out.indexOf('Background:')
    const rIdx = out.indexOf('Rule:')
    expect(fIdx).toBeLessThan(bIdx)
    expect(bIdx).toBeLessThan(rIdx)
  })
})

// ============================================================
// buildForeignKeyGraph + topologicalSort
// ============================================================

describe('buildForeignKeyGraph + topologicalSort', () => {
  it('Order → Customer, Store：補 Order 時需先補 Customer + Store', () => {
    const schemas = makeSchema({
      Customer: { tableName: 'customers', cols: [col('id', 'UUID', { primaryKey: true })] },
      Store: { tableName: 'stores', cols: [col('id', 'UUID', { primaryKey: true })] },
      Order: {
        tableName: 'orders',
        cols: [
          col('id', 'UUID', { primaryKey: true }),
          col('customer_id', 'UUID', { foreignKey: 'customers.id', notNull: true }),
          col('store_id', 'UUID', { foreignKey: 'stores.id', notNull: true }),
        ],
      },
    })
    const graph = buildForeignKeyGraph(schemas, ['Order'])
    expect(graph.get('Order')).toEqual(new Set(['Customer', 'Store']))
    const { order, cycles } = topologicalSort(graph)
    expect(cycles).toEqual([])
    // Customer / Store 在 Order 前
    expect(order.indexOf('Customer')).toBeLessThan(order.indexOf('Order'))
    expect(order.indexOf('Store')).toBeLessThan(order.indexOf('Order'))
  })

  it('循環 FK A → B → A：回 cycles', () => {
    const schemas = makeSchema({
      A: { tableName: 'a', cols: [col('id', 'UUID', { primaryKey: true }), col('b_id', 'UUID', { foreignKey: 'b.id', notNull: true })] },
      B: { tableName: 'b', cols: [col('id', 'UUID', { primaryKey: true }), col('a_id', 'UUID', { foreignKey: 'a.id', notNull: true })] },
    })
    const graph = buildForeignKeyGraph(schemas, ['A', 'B'])
    const { order, cycles } = topologicalSort(graph)
    expect(cycles.length).toBeGreaterThan(0)
    expect(cycles.flat().sort()).toEqual(['A', 'B'])
    // A 和 B 都在 cycle 裡 → order 裡都沒有（或只有一個）
    expect(order.length).toBe(0)
  })

  it('Self-FK 忽略（parent → parent.parent_id）', () => {
    const schemas = makeSchema({
      Category: {
        tableName: 'categories',
        cols: [
          col('id', 'UUID', { primaryKey: true }),
          col('parent_id', 'UUID', { foreignKey: 'categories.id' }),
        ],
      },
    })
    const graph = buildForeignKeyGraph(schemas, ['Category'])
    expect(graph.get('Category')).toEqual(new Set())  // self-FK 不計
    const { order, cycles } = topologicalSort(graph)
    expect(cycles).toEqual([])
    expect(order).toEqual(['Category'])
  })
})

// ============================================================
// getRequiredColumns + sampleValueForColumn
// ============================================================

describe('getRequiredColumns', () => {
  it('排除 PK / id / created_at / updated_at / deleted_at / 有 default 的', () => {
    const table = new TableDefinition('x')
    table.columns = [
      col('id', 'UUID', { primaryKey: true, notNull: true }),
      col('name', 'TEXT', { notNull: true }),
      col('description', 'TEXT'),  // 可空
      col('status', 'TEXT', { notNull: true, defaultValue: "'active'" }),  // 有 default
      col('created_at', 'TIMESTAMPTZ', { notNull: true }),
      col('updated_at', 'TIMESTAMPTZ', { notNull: true }),
    ]
    const req = getRequiredColumns(table)
    expect(req.map(c => c.name)).toEqual(['name'])
  })
})

describe('sampleValueForColumn', () => {
  const noFk = () => null

  it('TEXT → Sample <ColName>', () => {
    expect(sampleValueForColumn(col('name', 'TEXT', { notNull: true }), noFk)).toBe('Sample name')
  })

  it('INTEGER → 0', () => {
    expect(sampleValueForColumn(col('qty', 'INTEGER', { notNull: true }), noFk)).toBe('0')
  })

  it('BOOLEAN → true', () => {
    expect(sampleValueForColumn(col('active', 'BOOLEAN', { notNull: true }), noFk)).toBe('true')
  })

  it('CHECK IN → 取第一個允許值', () => {
    expect(sampleValueForColumn(
      col('status', 'VARCHAR(20)', { notNull: true, checkConstraint: "status IN ('active','inactive')" }),
      noFk,
    )).toBe('active')
  })

  it('CHECK >= 1 → 取邊界', () => {
    expect(sampleValueForColumn(
      col('rating', 'INTEGER', { notNull: true, checkConstraint: 'rating >= 1' }),
      noFk,
    )).toBe('1')
  })

  it('FK 欄位優先用 resolver', () => {
    const fkResolver = () => '$Customer1.id'
    expect(sampleValueForColumn(
      col('customer_id', 'UUID', { notNull: true, foreignKey: 'customers.id' }),
      fkResolver,
    )).toBe('$Customer1.id')
  })
})

// ============================================================
// autoDeclareUndeclaredVars（整合）
// ============================================================

describe('autoDeclareUndeclaredVars', () => {
  it('單 entity：$Store.id → 補 Background 宣告', () => {
    const schemas = makeSchema({
      Store: {
        tableName: 'stores',
        cols: [
          col('id', 'UUID', { primaryKey: true, notNull: true }),
          col('name', 'TEXT', { notNull: true }),
        ],
      },
    })
    const content = `Feature: Test
  Rule: R
    Example: ok
      When (No Actor) Create, call table:
        | storeId  |
        | $Store.id |
      Then Create(201)回應, with table:
        | id       |
        | $notnull |`
    const result = autoDeclareUndeclaredVars(content, [{ entity: 'Store', field: 'id' }], schemas)
    expect(result.declaredEntities).toEqual(['Store'])
    expect(result.content).toContain('Background:')
    expect(result.content).toContain('準備一個Store, with table:')
    expect(result.content).toContain('>Store1.id')
    expect(result.content).toContain('<store1Id')
  })

  it('FK 依賴：補 Order 時先補 Customer 和 Store', () => {
    const schemas = makeSchema({
      Customer: {
        tableName: 'customers',
        cols: [
          col('id', 'UUID', { primaryKey: true, notNull: true }),
          col('name', 'TEXT', { notNull: true }),
        ],
      },
      Store: {
        tableName: 'stores',
        cols: [
          col('id', 'UUID', { primaryKey: true, notNull: true }),
          col('name', 'TEXT', { notNull: true }),
        ],
      },
      Order: {
        tableName: 'orders',
        cols: [
          col('id', 'UUID', { primaryKey: true, notNull: true }),
          col('customer_id', 'UUID', { foreignKey: 'customers.id', notNull: true }),
          col('store_id', 'UUID', { foreignKey: 'stores.id', notNull: true }),
        ],
      },
    })
    const content = `Feature: Test
  Rule: R
    Example: ok
      When (No Actor) X, call table:
        | orderId   |
        | $Order.id |
      Then Create(201)回應, with table:
        | id       |
        | $notnull |`
    const result = autoDeclareUndeclaredVars(content, [{ entity: 'Order', field: 'id' }], schemas)
    // declaredEntities 含 Customer / Store / Order（傳遞依賴）
    expect(result.declaredEntities).toEqual(expect.arrayContaining(['Customer', 'Store', 'Order']))
    // Customer / Store 宣告在 Order 之前
    const customerIdx = result.content.indexOf('準備一個Customer')
    const storeIdx = result.content.indexOf('準備一個Store')
    const orderIdx = result.content.indexOf('準備一個Order')
    expect(customerIdx).toBeLessThan(orderIdx)
    expect(storeIdx).toBeLessThan(orderIdx)
    // Order 的 customer_id 用 $Customer1.id 引用
    expect(result.content).toContain('$Customer1.id')
    expect(result.content).toContain('$Store1.id')
  })

  it('Entity 不在 schema → skipped 並 reason', () => {
    const schemas = makeSchema({
      Customer: { tableName: 'customers', cols: [col('id', 'UUID', { primaryKey: true })] },
    })
    const result = autoDeclareUndeclaredVars(
      'Feature: T\n',
      [{ entity: 'UnknownEntity', field: 'id' }],
      schemas,
    )
    expect(result.declaredEntities).toEqual([])
    expect(result.skippedWithReason).toHaveLength(1)
    expect(result.skippedWithReason[0].entity).toBe('UnknownEntity')
    expect(result.skippedWithReason[0].reason).toContain('not in schema')
  })

  it('循環 FK：skip 並 reason', () => {
    const schemas = makeSchema({
      A: {
        tableName: 'a',
        cols: [
          col('id', 'UUID', { primaryKey: true, notNull: true }),
          col('b_id', 'UUID', { foreignKey: 'b.id', notNull: true }),
        ],
      },
      B: {
        tableName: 'b',
        cols: [
          col('id', 'UUID', { primaryKey: true, notNull: true }),
          col('a_id', 'UUID', { foreignKey: 'a.id', notNull: true }),
        ],
      },
    })
    const result = autoDeclareUndeclaredVars(
      'Feature: T\n',
      [{ entity: 'A', field: 'id' }],
      schemas,
    )
    expect(result.declaredEntities).not.toContain('A')
    expect(result.skippedWithReason.some(s => s.entity === 'A' && s.reason.includes('circular FK'))).toBe(true)
  })

  it('CHECK 約束值：用允許清單第一個', () => {
    const schemas = makeSchema({
      Order: {
        tableName: 'orders',
        cols: [
          col('id', 'UUID', { primaryKey: true, notNull: true }),
          col('delivery_type', 'VARCHAR(20)', { notNull: true, checkConstraint: "delivery_type IN ('pickup','delivery')" }),
        ],
      },
    })
    const result = autoDeclareUndeclaredVars(
      `Feature: T
  Rule: R
    Example: ok
      When X
      Then Y`,
      [{ entity: 'Order', field: 'id' }],
      schemas,
    )
    expect(result.content).toContain('pickup')  // 取第一個 enum 值
  })

  it('已有 Background：append 新宣告（And 開頭）', () => {
    const schemas = makeSchema({
      Store: { tableName: 'stores', cols: [col('id', 'UUID', { primaryKey: true, notNull: true })] },
    })
    const content = `Feature: T

  Background:
    Given 準備一個Customer, with table:
      | >Customer1.id | name |
      | <customer1Id  | Foo  |

  Rule: R`
    const result = autoDeclareUndeclaredVars(content, [{ entity: 'Store', field: 'id' }], schemas)
    // 新宣告要用 And（非 Given）
    expect(result.content).toContain('And 準備一個Store')
    expect(result.content).not.toContain('Given 準備一個Store')
  })

  it('多個 undeclared 同 entity 只補一次', () => {
    const schemas = makeSchema({
      Store: {
        tableName: 'stores',
        cols: [
          col('id', 'UUID', { primaryKey: true, notNull: true }),
          col('name', 'TEXT', { notNull: true }),
        ],
      },
    })
    const result = autoDeclareUndeclaredVars(
      'Feature: T\n',
      [
        { entity: 'Store', field: 'id' },
        { entity: 'Store', field: 'name' },
      ],
      schemas,
    )
    expect(result.declaredEntities).toEqual(['Store'])
    // 只出現一個「準備一個Store」
    const matches = result.content.match(/準備一個Store/g) || []
    expect(matches).toHaveLength(1)
  })

  it('空 undeclared list → 不動 content', () => {
    const schemas = makeSchema({
      Store: { tableName: 'stores', cols: [col('id', 'UUID', { primaryKey: true })] },
    })
    const content = 'Feature: T\n  Rule: R\n'
    const result = autoDeclareUndeclaredVars(content, [], schemas)
    expect(result.content).toBe(content)
    expect(result.declaredEntities).toEqual([])
  })
})
