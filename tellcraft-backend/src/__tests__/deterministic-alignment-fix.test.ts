// R1: Check 12/14/15/16 確定性修補測試
import { describe, it, expect } from 'vitest'
import {
  autoFillNotnullSetupGap,
  autoRemoveNullConflictSetup,
  autoFillEntityValidateGap,
} from '../services/deterministic-feature-fix'
import { DatabaseSchema, TableDefinition } from '../lib/specformula/spec/data/models'
import type { AlignmentIssue } from '../services/feature-alignment-gate'

function makeSchema(): DatabaseSchema {
  const schema = new DatabaseSchema()
  const table = new TableDefinition('service_items')
  table.columns = [
    { name: 'id', type: 'UUID', primaryKey: true, notNull: true },
    { name: 'title', type: 'VARCHAR(255)', notNull: true },
    { name: 'image_url', type: 'TEXT' },
  ]
  table.pkColumns.add('id')
  schema.tables = [table]
  schema.setEntityTableMapping({
    entity_to_table_mapping: [{ ServiceItem: 'service_items' }],
  })
  return schema
}

describe('R1: autoFillNotnullSetupGap (Check 12)', () => {
  it('appends missing column to entity_setup table', () => {
    const content = `Feature: List Items

Background:
  Given 準備一個 ServiceItem, with table:
    | >ServiceItem1.id | title |
    | $uuid            | foo   |

Scenario: list all items
  When (No Actor) List Service Items, call table:
    |  |
  Then List Service Items(200)回應, with table:
    | imageUrl  |
    | $notnull  |
`
    const issues: AlignmentIssue[] = [{
      featureName: 'List Items',
      checkName: 'notnull_field_missing_from_setup',
      severity: 'error',
      description: 'Scenario "list all items" 的 Then 表期望欄位 `imageUrl` 為 `$notnull`，但本 Feature 的 entity_setup 從未提供 imageUrl 值。',
    }]
    const result = autoFillNotnullSetupGap(content, issues, [makeSchema()])
    expect(result.fixedFields.length).toBe(1)
    expect(result.fixedFields[0].field).toBe('imageUrl')
    expect(result.fixedFields[0].entity).toBe('ServiceItem')
    // 確認新 content 含 imageUrl
    expect(result.content).toContain('imageUrl')
    // 確認 header 多了 imageUrl，且 data row 也對應補一格
    const lines = result.content.split('\n')
    const headerLine = lines.find(l => l.includes('>ServiceItem1.id') && l.includes('title'))
    expect(headerLine).toContain('imageUrl')
    const dataLine = lines.find(l => l.includes('$uuid') && l.includes('foo'))
    expect(dataLine).toBeDefined()
    // data row 多一格
    const headerCells = headerLine!.split('|').filter(c => c.trim()).length
    const dataCells = dataLine!.split('|').filter(c => c.trim()).length
    expect(headerCells).toBe(dataCells)
  })

  it('skips when issue is warning (not error)', () => {
    const content = `Feature: F\n\nBackground:\n  Given 準備一個 ServiceItem, with table:\n    | id |\n    | 1  |\n`
    const issues: AlignmentIssue[] = [{
      featureName: 'F',
      checkName: 'notnull_field_missing_from_setup',
      severity: 'warning',
      description: 'Scenario "X" 的 Then 表期望欄位 `imageUrl` 為 `$notnull`',
    }]
    const result = autoFillNotnullSetupGap(content, issues, [makeSchema()])
    expect(result.fixedFields.length).toBe(0)
    expect(result.content).toBe(content)
  })

  it('skips when field not in schema (server-gen guess)', () => {
    const content = `Feature: F\n\nBackground:\n  Given 準備一個 ServiceItem, with table:\n    | id |\n    | 1  |\n`
    const issues: AlignmentIssue[] = [{
      featureName: 'F',
      checkName: 'notnull_field_missing_from_setup',
      severity: 'error',
      description: 'Scenario "X" 的 Then 表期望欄位 `token` 為 `$notnull`',
    }]
    const result = autoFillNotnullSetupGap(content, issues, [makeSchema()])
    expect(result.fixedFields.length).toBe(0)
    expect(result.skipped.length).toBe(1)
    expect(result.skipped[0].reason).toContain('schema')
  })
})

describe('R1: autoRemoveNullConflictSetup (Check 15)', () => {
  it('removes the conflicting column from entity_setup', () => {
    const content = `Feature: F

Background:
  Given 準備一個 ServiceItem, with table:
    | id | imageUrl                |
    | 1  | https://cdn.x/photo.png |

Scenario: A
  Then op(200)回應, with table:
    | imageUrl |
    | $null    |
`
    const issues: AlignmentIssue[] = [{
      featureName: 'F',
      checkName: 'null_expectation_setup_conflict',
      severity: 'error',
      description: 'Scenario "A" 的 Then 表期望欄位 `imageUrl` 為 `$null`（必須是 null），但 entity_setup `ServiceItem` 給了 `imageUrl = https://cdn.x/photo.png`',
    }]
    const result = autoRemoveNullConflictSetup(content, issues)
    expect(result.removedFields.length).toBe(1)
    expect(result.removedFields[0].field).toBe('imageUrl')
    // entity_setup row 不再含 photo.png 值（imageUrl header 仍可能在 Then 表）
    expect(result.content).not.toContain('https://cdn.x/photo.png')
    // entity_setup header 行不再有 imageUrl
    const lines = result.content.split('\n')
    const setupHeaderIdx = lines.findIndex(l => l.includes('| id |') && !l.includes('$null'))
    expect(setupHeaderIdx).toBeGreaterThanOrEqual(0)
    expect(lines[setupHeaderIdx]).not.toContain('imageUrl')
  })
})

describe('R1: autoFillEntityValidateGap (Check 16)', () => {
  it('appends column to entity_setup matching validate expectation', () => {
    const content = `Feature: F

Background:
  Given 準備一個 ServiceItem, with table:
    | id | title |
    | 1  | foo   |

Scenario: A
  When op
  Then 應該存在一個 ServiceItem, with table:
    | id | imageUrl |
    | 1  | $notnull |
`
    const issues: AlignmentIssue[] = [{
      featureName: 'F',
      checkName: 'entity_validation_field_missing_from_setup',
      severity: 'error',
      description: 'Scenario "A" 的 `應該存在一個 ServiceItem, with table:` 期望欄位 `imageUrl` 為 `$notnull`',
    }]
    const result = autoFillEntityValidateGap(content, issues, [makeSchema()])
    expect(result.fixedFields.length).toBe(1)
    expect(result.fixedFields[0].entity).toBe('ServiceItem')
    expect(result.fixedFields[0].field).toBe('imageUrl')
    // entity_setup header 多了 imageUrl
    const lines = result.content.split('\n')
    const setupHeader = lines.find(l => l.includes('| id |') && l.includes('title'))
    expect(setupHeader).toContain('imageUrl')
  })

  it('uses literal value when expectedValue is concrete', () => {
    const content = `Feature: F\n\nBackground:\n  Given 準備一個 ServiceItem, with table:\n    | id |\n    | 1  |\n\nScenario: A\n  Then 應該存在一個 ServiceItem, with table:\n    | id | title    |\n    | 1  | Hardcoded |\n`
    const issues: AlignmentIssue[] = [{
      featureName: 'F',
      checkName: 'entity_validation_field_missing_from_setup',
      severity: 'error',
      description: 'Scenario "A" 的 `應該存在一個 ServiceItem, with table:` 期望欄位 `title` 為 `Hardcoded`',
    }]
    const result = autoFillEntityValidateGap(content, issues, [makeSchema()])
    expect(result.fixedFields.length).toBe(1)
    expect(result.content).toContain('Hardcoded')
  })
})

describe('R1: no targets → returns unchanged', () => {
  it('autoFillNotnullSetupGap with empty issues returns unchanged', () => {
    const content = 'Feature: X\n'
    const r = autoFillNotnullSetupGap(content, [], [makeSchema()])
    expect(r.content).toBe(content)
    expect(r.fixedFields.length).toBe(0)
  })
  it('autoRemoveNullConflictSetup with non-matching checkName returns unchanged', () => {
    const content = 'Feature: X\n'
    const r = autoRemoveNullConflictSetup(content, [{
      featureName: 'X', checkName: 'other_check', severity: 'error', description: 'irrelevant',
    }])
    expect(r.content).toBe(content)
    expect(r.removedFields.length).toBe(0)
  })
})
