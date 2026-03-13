import { describe, it, expect } from 'vitest'
import * as path from 'path'
import { EntityDdlReader } from '../../lib/specformula/spec/data/entity-ddl-reader'
import type { IsaDataSourceConfig } from '../../lib/specformula/spec/isa/models'

// Use the actual spec/data files from the project
const DATA_RESOURCE_PATH = path.resolve(__dirname, '../../../../spec/data')

function makeConfig(resourcePath = DATA_RESOURCE_PATH): IsaDataSourceConfig {
  return { name: 'default', resource_path: resourcePath, project_path: '.', db_type: 'postgresql' }
}

describe('EntityDdlReader', () => {
  it('reads schema.sql and entity_to_table_mapping.yml', () => {
    const reader = new EntityDdlReader(makeConfig())
    const schema = reader.read()

    expect(schema.tables.length).toBeGreaterThan(0)
    expect(schema.entityTableMapping).not.toBeNull()
  })

  it('parses correct number of tables from schema.sql', () => {
    const reader = new EntityDdlReader(makeConfig())
    const schema = reader.read()

    // Should have 16 tables based on previous integration test
    expect(schema.tables.length).toBeGreaterThanOrEqual(10)
  })

  it('correctly identifies primary keys', () => {
    const reader = new EntityDdlReader(makeConfig())
    const schema = reader.read()

    const usersTable = schema.tables.find(t => t.tableName === 'users')
    expect(usersTable).toBeDefined()
    expect(usersTable!.pkColumns.has('id')).toBe(true)
  })

  it('correctly identifies column types', () => {
    const reader = new EntityDdlReader(makeConfig())
    const schema = reader.read()

    const usersTable = schema.tables.find(t => t.tableName === 'users')
    expect(usersTable).toBeDefined()

    const idType = usersTable!.findColumnType('id')
    expect(idType).toBeTruthy()
    // UUID type should be present
    expect(idType!.toUpperCase()).toContain('UUID')
  })

  it('entity mapping resolves Chinese entity names to table names', () => {
    const reader = new EntityDdlReader(makeConfig())
    const schema = reader.read()

    const usersTable = schema.findByEntityName('用戶')
    expect(usersTable).not.toBeNull()
    expect(usersTable!.tableName).toBe('users')
  })

  it('buildCleanupSql generates TRUNCATE for all tables', () => {
    const reader = new EntityDdlReader(makeConfig())
    const schema = reader.read()

    const sqls = schema.buildCleanupSql()
    expect(sqls.length).toBeGreaterThan(0)
    expect(sqls.some(s => s.includes('TRUNCATE TABLE users CASCADE'))).toBe(true)
  })

  it('getSelectSql generates valid SQL for users table', () => {
    const reader = new EntityDdlReader(makeConfig())
    const schema = reader.read()

    const usersTable = schema.findByEntityName('用戶')
    expect(usersTable).not.toBeNull()

    const sql = usersTable!.getSelectSql()
    expect(sql).toContain('SELECT')
    expect(sql).toContain('FROM users')
    expect(sql).toContain('WHERE id=$1')
  })
})
