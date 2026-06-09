import { describe, it, expect } from 'vitest'
import { planWorkflowColumns } from '../services/content-model/workflow-opt-in'
import { classifySchemaChanges, schemaChangesToSql } from '../services/schema-change-dsl'
import { extractCreateTableStatements } from '../services/neon-service'

describe('A2 — planWorkflowColumns（bespoke entity opt-in，全 additive）', () => {
  it('draft_publish → status 欄位 + status 索引', () => {
    const plan = planWorkflowColumns('products', ['draft_publish'])
    expect(classifySchemaChanges(plan)).toBe('additive')
    const cols = plan.filter(c => c.kind === 'add_column').map(c => (c as { column: string }).column)
    expect(cols).toEqual(['status'])
    expect(plan.some(c => c.kind === 'add_index')).toBe(true)
  })

  it('draft_publish + schedule → status + published_at + scheduled_for', () => {
    const plan = planWorkflowColumns('listings', ['draft_publish', 'schedule'])
    expect(classifySchemaChanges(plan)).toBe('additive')
    const cols = plan.filter(c => c.kind === 'add_column').map(c => (c as { column: string }).column)
    expect(cols).toEqual(expect.arrayContaining(['status', 'published_at', 'scheduled_for']))
  })

  it('forward SQL 是 ADD COLUMN，無任何 DROP', () => {
    const { forward } = schemaChangesToSql(planWorkflowColumns('products', ['draft_publish', 'schedule']))
    expect(forward).toContain('ADD COLUMN')
    expect(forward).toContain('status')
    expect(forward).not.toContain('DROP')
  })

  it('status 欄位 NOT NULL DEFAULT draft（既有 row 自動回填，不破壞資料）', () => {
    const { forward } = schemaChangesToSql(planWorkflowColumns('products', ['draft_publish']))
    expect(forward).toMatch(/status.*NOT NULL.*DEFAULT 'draft'/)
  })

  it('核心契約：任何 capability 組合 classifySchemaChanges 恆為 additive', () => {
    const combos: Array<Parameters<typeof planWorkflowColumns>[1]> = [
      ['draft_publish'],
      ['schedule'],
      ['draft_publish', 'schedule'],
      ['draft_publish', 'schedule', 'media', 'version'],
    ]
    for (const caps of combos) {
      expect(classifySchemaChanges(planWorkflowColumns('t', caps))).toBe('additive')
    }
  })

  it('無工作流能力 → 空 plan', () => {
    expect(planWorkflowColumns('t', ['media'])).toEqual([])
    expect(planWorkflowColumns('t', [])).toEqual([])
  })
})

describe('A2 — extractCreateTableStatements（drift 補表，只 additive）', () => {
  const ddl = `CREATE TABLE IF NOT EXISTS posts (id UUID PRIMARY KEY, title VARCHAR(200));
CREATE TABLE IF NOT EXISTS products (id UUID PRIMARY KEY, name VARCHAR(100));
CREATE TABLE IF NOT EXISTS orders (id UUID PRIMARY KEY);`

  it('只回缺表的 CREATE TABLE 區塊', () => {
    const out = extractCreateTableStatements(ddl, ['posts', 'orders'])
    expect(out).toContain('CREATE TABLE IF NOT EXISTS posts')
    expect(out).toContain('CREATE TABLE IF NOT EXISTS orders')
    expect(out).not.toContain('products')
  })

  it('全 IF NOT EXISTS（idempotent，不動既有表/資料），無 DROP', () => {
    const out = extractCreateTableStatements(ddl, ['posts'])
    expect(out).toContain('IF NOT EXISTS')
    expect(out).not.toContain('DROP')
  })

  it('空 DDL / 空表名 → 空字串', () => {
    expect(extractCreateTableStatements('', ['posts'])).toBe('')
    expect(extractCreateTableStatements(ddl, [])).toBe('')
  })
})
