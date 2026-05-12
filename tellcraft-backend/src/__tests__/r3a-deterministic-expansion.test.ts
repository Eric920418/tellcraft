// R3-A: 擴大 deterministic 覆蓋（Check 4/8/10）測試
import { describe, it, expect } from 'vitest'
import {
  autoFixResponseFieldNaming,
  autoRemoveEmptyDataRows,
  autoFixCheckConstraintViolation,
} from '../services/deterministic-feature-fix'
import { DatabaseSchema, TableDefinition } from '../lib/specformula/spec/data/models'
import type { AlignmentIssue } from '../services/feature-alignment-gate'

describe('R3-A: autoFixResponseFieldNaming (Check 4)', () => {
  it('converts snake_case header to camelCase in Then response', () => {
    const content = `Feature: F

Scenario: A
  When op
  Then op(200)回應, with table:
    | user_id | created_at |
    | $notnull | $notnull  |
`
    const issues: AlignmentIssue[] = [
      {
        featureName: 'F', checkName: 'response_field_naming', severity: 'error',
        description: 'Response 欄位 "user_id" 是 snake_case，BDD 測試框架期望 camelCase: "userId"',
      },
      {
        featureName: 'F', checkName: 'response_field_naming', severity: 'error',
        description: 'Response 欄位 "created_at" 是 snake_case，BDD 測試框架期望 camelCase: "createdAt"',
      },
    ]
    const r = autoFixResponseFieldNaming(content, issues)
    expect(r.renamedFields.length).toBe(2)
    expect(r.content).toContain('userId')
    expect(r.content).toContain('createdAt')
    // entity_setup data row 應不受影響（沒有 $notnull → camelCase）
    const lines = r.content.split('\n')
    const headerLine = lines.find(l => l.includes('userId') && l.includes('createdAt'))
    expect(headerLine).toBeDefined()
  })

  it('skips warning-severity issues', () => {
    const content = 'Feature: F\n  Then op(200)回應, with table:\n    | mixed_Case |\n    | x |\n'
    const r = autoFixResponseFieldNaming(content, [{
      featureName: 'F', checkName: 'response_field_naming', severity: 'warning',
      description: 'Response 欄位 "mixed_Case" 混合了 snake_case 和 camelCase',
    }])
    expect(r.renamedFields.length).toBe(0)
    expect(r.content).toBe(content)
  })

  it('no targets → unchanged', () => {
    const r = autoFixResponseFieldNaming('Feature: F\n', [])
    expect(r.renamedFields.length).toBe(0)
  })
})

describe('R3-A: autoRemoveEmptyDataRows (Check 10)', () => {
  it('removes row with only VAR references', () => {
    const content = `Feature: F

Background:
  Given 準備一個 ServiceItem, with table:
    | id  | title |
    | $sid | foo  |
    | <newId | <newTitle |
    | 2   | bar  |
`
    const issues: AlignmentIssue[] = [{
      featureName: 'F', checkName: 'datatable_empty_row', severity: 'error',
      description: 'Feature "F" 的 `準備一個 ServiceItem` DataTable (line 5) 整 row 無任何實值',
    }]
    const r = autoRemoveEmptyDataRows(content, issues)
    expect(r.removedRows.length).toBe(1)
    expect(r.content).not.toContain('<newId')
    expect(r.content).not.toContain('<newTitle')
    // 真實 row 保留
    expect(r.content).toContain('foo')
    expect(r.content).toContain('bar')
  })

  it('no empty rows → unchanged', () => {
    const content = `Feature: F\n\nBackground:\n  Given 準備一個 ServiceItem, with table:\n    | id |\n    | 1  |\n`
    const issues: AlignmentIssue[] = [{
      featureName: 'F', checkName: 'datatable_empty_row', severity: 'error',
      description: 'dummy',  // 觸發 helper 進入 scan，但 scan 找不到
    }]
    const r = autoRemoveEmptyDataRows(content, issues)
    expect(r.removedRows.length).toBe(0)
    expect(r.content).toBe(content)
  })
})

describe('R3-A: autoFixCheckConstraintViolation (Check 8)', () => {
  function makeSchemaWithCheckEnum(): DatabaseSchema {
    const schema = new DatabaseSchema()
    const table = new TableDefinition('orders')
    table.columns = [
      { name: 'id', type: 'UUID', primaryKey: true, notNull: true },
      { name: 'status', type: 'VARCHAR(20)', notNull: true, checkConstraint: "status IN ('pending', 'completed')" },
    ]
    table.pkColumns.add('id')
    schema.tables = [table]
    schema.setEntityTableMapping({ entity_to_table_mapping: [{ Order: 'orders' }] })
    return schema
  }

  it('replaces enum violation with first valid value', () => {
    const content = `Feature: F

Background:
  Given 準備一個 Order, with table:
    | id | status      |
    | 1  | 'takeout'   |
`
    const issues: AlignmentIssue[] = [{
      featureName: 'F', checkName: 'check_constraint', severity: 'error',
      description: `Feature "F" line 5 的 "準備一個Order" DataTable 值 "takeout" 違反欄位 status 的 CHECK 約束。允許值：['pending', 'completed']`,
    }]
    const r = autoFixCheckConstraintViolation(content, issues, [makeSchemaWithCheckEnum()])
    expect(r.fixedValues.length).toBe(1)
    expect(r.fixedValues[0].from).toBe('takeout')
    expect(r.fixedValues[0].to).toBe('pending')
    expect(r.content).toContain("'pending'")
    expect(r.content).not.toContain("'takeout'")
  })

  it('respects R3A_FIX_CHECK_CONSTRAINT=false env override', () => {
    process.env.R3A_FIX_CHECK_CONSTRAINT = 'false'
    const r = autoFixCheckConstraintViolation('Feature: F\n', [{
      featureName: 'F', checkName: 'check_constraint', severity: 'error',
      description: 'whatever',
    }], [])
    expect(r.fixedValues.length).toBe(0)
    delete process.env.R3A_FIX_CHECK_CONSTRAINT
  })

  it('skips when schema has no matching CHECK constraint', () => {
    const schema = new DatabaseSchema()
    const table = new TableDefinition('orders')
    table.columns = [{ name: 'id', type: 'UUID', primaryKey: true, notNull: true }]
    schema.tables = [table]
    const r = autoFixCheckConstraintViolation('Feature: F\n', [{
      featureName: 'F', checkName: 'check_constraint', severity: 'error',
      description: `"準備一個Order" DataTable 值 "X" 違反欄位 status 的 CHECK 約束`,
    }], [schema])
    expect(r.fixedValues.length).toBe(0)
    expect(r.skipped[0].reason).toContain('schema')
  })
})
