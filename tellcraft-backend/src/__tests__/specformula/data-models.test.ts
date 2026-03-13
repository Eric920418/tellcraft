import { describe, it, expect, beforeEach } from 'vitest'
import { TableDefinition, DatabaseSchema, entityMappingAsMap, type EntityTableMapping } from '../../lib/specformula/spec/data/models'

describe('TableDefinition', () => {
  let table: TableDefinition

  beforeEach(() => {
    table = new TableDefinition('users')
    table.columns = [
      { name: 'id', type: 'UUID', primaryKey: true },
      { name: 'email', type: 'VARCHAR(255)' },
      { name: 'name', type: 'TEXT' },
      { name: 'age', type: 'INT' },
      { name: 'created_at', type: 'TIMESTAMPTZ' },
    ]
    table.pkColumns = new Set(['id'])
  })

  it('findColumnType returns correct type', () => {
    expect(table.findColumnType('email')).toBe('VARCHAR(255)')
    expect(table.findColumnType('age')).toBe('INT')
  })

  it('findColumnType returns null for missing column', () => {
    expect(table.findColumnType('nonexistent')).toBeNull()
  })

  it('getNonPkColumnNames excludes PK', () => {
    const nonPk = table.getNonPkColumnNames()
    expect(nonPk.has('id')).toBe(false)
    expect(nonPk.has('email')).toBe(true)
    expect(nonPk.has('name')).toBe(true)
    expect(nonPk.size).toBe(4)
  })

  it('getPkColumnDefinitions returns PK columns', () => {
    const pks = table.getPkColumnDefinitions()
    expect(pks).toHaveLength(1)
    expect(pks[0].name).toBe('id')
    expect(pks[0].type).toBe('UUID')
  })

  describe('getSelectSql (PK-based)', () => {
    it('generates correct SQL with single PK', () => {
      const sql = table.getSelectSql()
      expect(sql).toBe('SELECT id, email, name, age, created_at FROM users WHERE id=$1')
    })

    it('caches SQL on second call', () => {
      const sql1 = table.getSelectSql()
      const sql2 = table.getSelectSql()
      expect(sql1).toBe(sql2)
    })

    it('generates correct column index mapping', () => {
      const index = table.getSelectWhereColumnIndex()
      expect(index.get('id')).toBe(1)
    })

    it('handles composite PK', () => {
      const composite = new TableDefinition('order_items')
      composite.columns = [
        { name: 'order_id', type: 'UUID', primaryKey: true },
        { name: 'product_id', type: 'UUID', primaryKey: true },
        { name: 'quantity', type: 'INT' },
      ]
      composite.pkColumns = new Set(['order_id', 'product_id'])

      const sql = composite.getSelectSql()
      expect(sql).toContain('WHERE order_id=$1 AND product_id=$2')
    })

    it('generates SELECT without WHERE when no PK', () => {
      const noPk = new TableDefinition('logs')
      noPk.columns = [{ name: 'message', type: 'TEXT' }]
      noPk.pkColumns = new Set()

      const sql = noPk.getSelectSql()
      expect(sql).toBe('SELECT message FROM logs')
    })
  })

  describe('getSelectByValuesSql (probe-based)', () => {
    it('generates correct SQL with CAST for NULL handling', () => {
      table.setQueryColumns(['email', 'name'])
      const sql = table.getSelectByValuesSql()
      expect(sql).toContain('CAST($1 AS VARCHAR(255)) IS NULL OR email=$2')
      expect(sql).toContain('CAST($3 AS TEXT) IS NULL OR name=$4')
    })

    it('generates correct parameter index mapping', () => {
      table.setQueryColumns(['email', 'name'])
      const index = table.getSelectByValuesIndex()
      expect(index.get('email')).toEqual([1, 2])
      expect(index.get('name')).toEqual([3, 4])
    })

    it('resets cache when setQueryColumns is called', () => {
      table.setQueryColumns(['email'])
      const sql1 = table.getSelectByValuesSql()
      expect(sql1).toContain('email=$2')

      table.setQueryColumns(['name'])
      const sql2 = table.getSelectByValuesSql()
      expect(sql2).toContain('name=$2')
      // The new SQL should not reference email in WHERE clause
      expect(sql2).not.toMatch(/email=\$/)
    })
  })
})

describe('entityMappingAsMap', () => {
  it('converts YAML-style mapping to Map', () => {
    const mapping: EntityTableMapping = {
      entity_to_table_mapping: [
        { '用戶': 'users' },
        { '專案': 'projects' },
        { '對話': 'conversations' },
      ] as Record<string, string>[],
    }
    const map = entityMappingAsMap(mapping)
    expect(map.get('用戶')).toBe('users')
    expect(map.get('專案')).toBe('projects')
    expect(map.get('對話')).toBe('conversations')
    expect(map.size).toBe(3)
  })
})

describe('DatabaseSchema', () => {
  let schema: DatabaseSchema

  beforeEach(() => {
    schema = new DatabaseSchema()
    const usersTable = new TableDefinition('users')
    usersTable.columns = [{ name: 'id', type: 'UUID', primaryKey: true }]
    usersTable.pkColumns = new Set(['id'])

    const projectsTable = new TableDefinition('projects')
    projectsTable.columns = [{ name: 'id', type: 'UUID', primaryKey: true }]
    projectsTable.pkColumns = new Set(['id'])

    schema.tables = [usersTable, projectsTable]
  })

  it('findByEntityName without mapping uses table name', () => {
    expect(schema.findByEntityName('users')?.tableName).toBe('users')
    expect(schema.findByEntityName('projects')?.tableName).toBe('projects')
  })

  it('findByEntityName with mapping uses entity name', () => {
    schema.setEntityTableMapping({
      entity_to_table_mapping: [
        { '用戶': 'users' },
        { '專案': 'projects' },
      ] as Record<string, string>[],
    })
    expect(schema.findByEntityName('用戶')?.tableName).toBe('users')
    expect(schema.findByEntityName('專案')?.tableName).toBe('projects')
    expect(schema.findByEntityName('users')).toBeNull()
  })

  it('findByEntityName returns null for unknown entity', () => {
    expect(schema.findByEntityName('nonexistent')).toBeNull()
  })

  it('buildCleanupSql generates TRUNCATE CASCADE', () => {
    const sqls = schema.buildCleanupSql()
    expect(sqls).toContain('TRUNCATE TABLE users CASCADE')
    expect(sqls).toContain('TRUNCATE TABLE projects CASCADE')
  })

  it('buildCleanupSql includes sequence reset for autoIncrement', () => {
    const table = new TableDefinition('posts')
    table.columns = [
      { name: 'id', type: 'SERIAL', autoIncrement: true },
      { name: 'title', type: 'TEXT' },
    ]
    schema.tables.push(table)
    const sqls = schema.buildCleanupSql()
    expect(sqls).toContain('ALTER SEQUENCE IF EXISTS posts_id_seq RESTART WITH 1')
  })

  it('findSchemaAndTable searches across multiple schemas', () => {
    const schema2 = new DatabaseSchema()
    const ordersTable = new TableDefinition('orders')
    ordersTable.columns = [{ name: 'id', type: 'UUID', primaryKey: true }]
    schema2.tables = [ordersTable]

    const result = DatabaseSchema.findSchemaAndTable([schema, schema2], 'orders')
    expect(result).not.toBeNull()
    expect(result!.table.tableName).toBe('orders')
    expect(result!.schema).toBe(schema2)
  })

  it('findSchemaAndTable returns null when not found', () => {
    const result = DatabaseSchema.findSchemaAndTable([schema], 'nonexistent')
    expect(result).toBeNull()
  })
})
