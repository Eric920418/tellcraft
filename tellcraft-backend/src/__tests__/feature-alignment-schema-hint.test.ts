// ============================================================
// L15.P1: buildUndeclaredVarRepairHint
// 對 Check 5「完全未宣告」issue 產生 schema-aware 修復範本
// 讓 fixMultipleFeatures 的 LLM 不用自己推 entity → table → required cols 映射
// ============================================================

import { describe, it, expect } from 'vitest'
import { buildUndeclaredVarRepairHint } from '../services/feature-alignment-gate'
import { DatabaseSchema, TableDefinition } from '../lib/specformula/spec/data/models'

function makeSchema(entityToTable: Record<string, { tableName: string; cols: Array<{ name: string; notNull?: boolean; primaryKey?: boolean }> }>): DatabaseSchema[] {
  const schema = new DatabaseSchema()
  for (const [, { tableName, cols }] of Object.entries(entityToTable)) {
    const table = new TableDefinition(tableName)
    table.columns = cols.map(c => ({
      name: c.name,
      type: 'TEXT',
      notNull: c.notNull || false,
      primaryKey: c.primaryKey || false,
    }))
    schema.tables.push(table)
  }
  // EntityTableMapping 格式：{ entity_to_table_mapping: [{ <entity>: <table> }, ...] }
  const entries = Object.entries(entityToTable).map(([entity, { tableName }]) => ({ [entity]: tableName }))
  schema.setEntityTableMapping({ entity_to_table_mapping: entries })
  return [schema]
}

describe('buildUndeclaredVarRepairHint', () => {
  it('未宣告 $Store.id + Store 在 schema → 產生 Background 補宣告範本', () => {
    const schemas = makeSchema({
      Store: {
        tableName: 'stores',
        cols: [
          { name: 'id', primaryKey: true, notNull: true },
          { name: 'name', notNull: true },
          { name: 'address', notNull: true },
          { name: 'created_at' },
        ],
      },
    })
    const hint = buildUndeclaredVarRepairHint(
      'VAR 引用 "$Store.id" (line 42) 完全未宣告 → ...',
      schemas,
    )
    expect(hint).not.toBeNull()
    expect(hint).toContain('Store 對應 table `stores`')
    expect(hint).toContain('name, address')  // 必要欄位（排除 id、created_at）
    expect(hint).toContain('準備一個Store, with table:')
    expect(hint).toContain('>Store1.id')
    expect(hint).toContain('<store1Id')  // camelCase
  })

  it('entity 不在 schema → 提示補 schema 或改 entity 名', () => {
    const schemas = makeSchema({
      Customer: { tableName: 'customers', cols: [{ name: 'id', primaryKey: true }] },
    })
    const hint = buildUndeclaredVarRepairHint(
      'VAR 引用 "$UnknownEntity.id" (line 10) 完全未宣告 → ...',
      schemas,
    )
    expect(hint).toContain('UnknownEntity')
    expect(hint).toContain('不在 Entity Mapping')
  })

  it('description 不含「完全未宣告」→ 不返回 hint（case 不一致等其他問題）', () => {
    const schemas = makeSchema({
      Store: { tableName: 'stores', cols: [{ name: 'id', primaryKey: true }] },
    })
    const hint = buildUndeclaredVarRepairHint(
      'VAR 引用 "$STORE.ID" 與宣告 "Store.id" 大小寫不一致 → runtime 可能解析失敗',
      schemas,
    )
    expect(hint).toBeNull()
  })

  it('排除 id / created_at / updated_at / deleted_at 以外的必要欄位', () => {
    const schemas = makeSchema({
      Product: {
        tableName: 'products',
        cols: [
          { name: 'id', primaryKey: true, notNull: true },
          { name: 'name', notNull: true },
          { name: 'price', notNull: true },
          { name: 'description' }, // 允許 null
          { name: 'created_at', notNull: true }, // 忽略
          { name: 'updated_at', notNull: true }, // 忽略
        ],
      },
    })
    const hint = buildUndeclaredVarRepairHint(
      'VAR 引用 "$Product.id" (line 5) 完全未宣告 → ...',
      schemas,
    )
    expect(hint).toContain('name, price')
    expect(hint).not.toContain('created_at')
    expect(hint).not.toContain('updated_at')
    expect(hint).not.toContain('description')  // nullable
  })

  it('無必要欄位時顯示 (無)', () => {
    const schemas = makeSchema({
      Tag: {
        tableName: 'tags',
        cols: [
          { name: 'id', primaryKey: true, notNull: true },
        ],
      },
    })
    const hint = buildUndeclaredVarRepairHint(
      'VAR 引用 "$Tag.id" 完全未宣告 → ...',
      schemas,
    )
    expect(hint).toContain('必要欄位：(無)')
  })

  it('空 schemas → 返回「不在 Entity Mapping」提示', () => {
    const hint = buildUndeclaredVarRepairHint(
      'VAR 引用 "$Order.id" 完全未宣告 → ...',
      [],
    )
    expect(hint).toContain('Order')
    expect(hint).toContain('不在 Entity Mapping')
  })

  it('只匹配 $Entity.field 格式（單層變數名無法產生範本）', () => {
    const schemas = makeSchema({
      Store: { tableName: 'stores', cols: [{ name: 'id', primaryKey: true }] },
    })
    const hint = buildUndeclaredVarRepairHint(
      'VAR 引用 "$orphanVar" 完全未宣告 → ...',
      schemas,
    )
    expect(hint).toBeNull()
  })
})
