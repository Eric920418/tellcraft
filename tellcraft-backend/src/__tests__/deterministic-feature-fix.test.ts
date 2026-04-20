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
  extractSingleLayerVarRefs,
  extractExistingDeclarationIndexes,
  autoFillSingleLayerVarGaps,
  removeEmptyEntitySetup,
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

// ============================================================
// L19.P0.1：extractSingleLayerVarRefs
// ============================================================

describe('extractSingleLayerVarRefs', () => {
  const schemas = makeSchema({
    Section: { tableName: 'sections', cols: [col('id', 'UUID', { primaryKey: true })] },
    PageSection: { tableName: 'page_sections', cols: [col('id', 'UUID', { primaryKey: true })] },
    MenuItem: { tableName: 'menu_items', cols: [col('id', 'UUID', { primaryKey: true })] },
  })

  it('解析 `$section6Id` → Section idx 6 field id', () => {
    const refs = extractSingleLayerVarRefs('some $section6Id here', schemas)
    expect(refs).toEqual([{ varName: 'section6Id', entity: 'Section', index: 6, field: 'id' }])
  })

  it('長 prefix 優先：`$pageSection2Id` → PageSection（不是 Section）', () => {
    const refs = extractSingleLayerVarRefs('and $pageSection2Id here', schemas)
    expect(refs[0].entity).toBe('PageSection')
    expect(refs[0].index).toBe(2)
  })

  it('多行 + 去重', () => {
    const content = `line1: $section6Id
line2: $section6Id
line3: $pageSection1Id`
    const refs = extractSingleLayerVarRefs(content, schemas)
    const entities = refs.map(r => `${r.entity}-${r.index}`).sort()
    expect(entities).toEqual(['PageSection-1', 'Section-6'])
  })

  it('跳過 `$Entity.field` 格式（L17 主流程已處理）', () => {
    const refs = extractSingleLayerVarRefs('$Section.id not this', schemas)
    expect(refs).toEqual([])
  })

  it('entity 不在 schema → 解析失敗略過', () => {
    const refs = extractSingleLayerVarRefs('$unknownEntity3Id', schemas)
    expect(refs).toEqual([])
  })

  it('非 camelCase pattern → 略過', () => {
    expect(extractSingleLayerVarRefs('$notnull', schemas)).toEqual([])
    expect(extractSingleLayerVarRefs('$sectionId', schemas)).toEqual([])  // 無數字
    expect(extractSingleLayerVarRefs('$Section6Id', schemas)).toEqual([])  // 大寫開頭（non camel）
  })

  it('field 其他欄位（非 id）', () => {
    const refs = extractSingleLayerVarRefs('$section3Name', schemas)
    expect(refs).toEqual([{ varName: 'section3Name', entity: 'Section', index: 3, field: 'name' }])
  })
})

// ============================================================
// L19.P0.1：extractExistingDeclarationIndexes
// ============================================================

describe('extractExistingDeclarationIndexes', () => {
  it('抓所有 >EntityN.field 宣告', () => {
    const content = `Background:
      | >Section1.id | >Section2.id | >PageSection1.id |
      | <s1           | <s2           | <p1              |
    Another:
      | >Section3.id |`
    const result = extractExistingDeclarationIndexes(content)
    expect(result.get('Section')).toEqual(new Set([1, 2, 3]))
    expect(result.get('PageSection')).toEqual(new Set([1]))
  })

  it('無 > 宣告 → 空 map', () => {
    const result = extractExistingDeclarationIndexes('no declarations here')
    expect(result.size).toBe(0)
  })
})

// ============================================================
// L19.P0.1：autoFillSingleLayerVarGaps（整合）
// ============================================================

describe('autoFillSingleLayerVarGaps', () => {
  it('引用 $section6Id 但只宣告 >Section1 → 補 >Section6', () => {
    const schemas = makeSchema({
      Section: {
        tableName: 'sections',
        cols: [
          col('id', 'UUID', { primaryKey: true, notNull: true }),
          col('name', 'TEXT', { notNull: true }),
        ],
      },
    })
    const content = `Feature: Test
  Background:
    Given 準備一個Section, with table:
      | >Section1.id | name |
      | <section1Id  | A    |
  Rule: R
    Example: ok
      When X $section6Id here`
    const result = autoFillSingleLayerVarGaps(content, schemas)
    expect(result.filledGaps).toHaveLength(1)
    expect(result.filledGaps[0].entity).toBe('Section')
    expect(result.filledGaps[0].index).toBe(6)
    expect(result.content).toContain('>Section6.id')
    expect(result.content).toContain('<section6Id')
  })

  it('引用與宣告都對齊 → 無 gap', () => {
    const schemas = makeSchema({
      Section: { tableName: 'sections', cols: [col('id', 'UUID', { primaryKey: true, notNull: true })] },
    })
    const content = `  Background:
    Given 準備一個Section, with table:
      | >Section1.id |
      | <section1Id  |
  Example: X uses $section1Id`
    const result = autoFillSingleLayerVarGaps(content, schemas)
    expect(result.filledGaps).toEqual([])
    expect(result.content).toBe(content)
  })

  it('多個 gap：$section5Id + $pageSection2Id 全部補', () => {
    const schemas = makeSchema({
      Section: { tableName: 'sections', cols: [col('id', 'UUID', { primaryKey: true, notNull: true })] },
      PageSection: { tableName: 'page_sections', cols: [col('id', 'UUID', { primaryKey: true, notNull: true })] },
    })
    const content = `Feature: T
  Rule: R
    Example: uses $section5Id and $pageSection2Id`
    const result = autoFillSingleLayerVarGaps(content, schemas)
    expect(result.filledGaps).toHaveLength(2)
    expect(result.content).toContain('>Section5.id')
    expect(result.content).toContain('>PageSection2.id')
  })
})

// ============================================================
// L19.P0.2：removeEmptyEntitySetup
// ============================================================

describe('removeEmptyEntitySetup', () => {
  it('刪除 DataTable 全空的 entity_setup', () => {
    const content = `Feature: T
  Rule: R
    Example: no data
      Given 準備一個SeoSetting, with table:
        | siteTitle | siteDescription |
        |           |                 |
      Then response`
    const result = removeEmptyEntitySetup(content)
    expect(result.removed).toEqual(['SeoSetting'])
    expect(result.content).not.toContain('準備一個SeoSetting')
    expect(result.content).not.toContain('siteTitle')
    expect(result.content).toContain('Then response')
  })

  it('刪除只 header 無 data row 的 entity_setup', () => {
    const content = `    Given 準備一個Store, with table:
      | name | status |
    Then X`
    const result = removeEmptyEntitySetup(content)
    expect(result.removed).toEqual(['Store'])
    expect(result.content).not.toContain('準備一個Store')
  })

  it('保留合法 placeholder（>Entity.id + <executionKey 的純宣告）', () => {
    const content = `    Given 準備一個Store, with table:
      | >Store1.id |
      | <store1Id  |`
    const result = removeEmptyEntitySetup(content)
    expect(result.removed).toEqual([])
    expect(result.content).toBe(content)
  })

  it('保留有業務值的 entity_setup', () => {
    const content = `    Given 準備一個Product, with table:
      | name    | price |
      | Widget  | 99    |`
    const result = removeEmptyEntitySetup(content)
    expect(result.removed).toEqual([])
    expect(result.content).toBe(content)
  })

  it('null 字面值視為空', () => {
    const content = `    Given 準備一個X, with table:
      | a    | b    |
      | null | NULL |`
    const result = removeEmptyEntitySetup(content)
    expect(result.removed).toEqual(['X'])
  })

  it('多步驟：只刪空的、保留有資料的', () => {
    const content = `Feature: T
    Given 準備一個Store, with table:
      | name    |
      | MyStore |
    And 準備一個Empty, with table:
      | field |
      |       |
    And 準備一個Another, with table:
      | x |
      | y |`
    const result = removeEmptyEntitySetup(content)
    expect(result.removed).toEqual(['Empty'])
    expect(result.content).toContain('MyStore')
    expect(result.content).toContain('準備一個Store')
    expect(result.content).toContain('準備一個Another')
    expect(result.content).not.toContain('準備一個Empty')
  })
})
