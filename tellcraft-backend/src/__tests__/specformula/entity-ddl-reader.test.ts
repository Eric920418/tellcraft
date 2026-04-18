import { describe, it, expect } from 'vitest'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
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

  // ========== L6 防禦性錯誤訊息（Pre-normalize 漏抓時的人類可讀錯誤） ==========
  describe('L6: mapping 結構異常的防禦性錯誤', () => {
    function makeTmpDirWithBadMapping(badYml: string): string {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ddl-reader-bad-'))
      fs.writeFileSync(path.join(tmpDir, 'schema.sql'), 'CREATE TABLE users (id UUID PRIMARY KEY);')
      fs.writeFileSync(path.join(tmpDir, 'entity_to_table_mapping.yml'), badYml)
      return tmpDir
    }

    it('mapping 是 object 而非 array → 拋出人類可讀錯誤（非 "is not iterable"）', () => {
      // 格式 D 未經 normalize 的樣子
      const tmpDir = makeTmpDirWithBadMapping(`entity_to_table_mapping:\n  會員: members\n  美容師: beauticians\n`)
      try {
        expect(() => new EntityDdlReader(makeConfig(tmpDir)).read())
          .toThrow(/格式錯誤.*array/)
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true })
      }
    })

    it('mapping 缺少 entity_to_table_mapping 頂層 key → 拋出 undefined 錯誤', () => {
      const tmpDir = makeTmpDirWithBadMapping(`something_else:\n  - foo: bar\n`)
      try {
        expect(() => new EntityDdlReader(makeConfig(tmpDir)).read())
          .toThrow(/undefined.*缺少此頂層 key/)
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true })
      }
    })

    it('mapping 為空字串 → 拋出解析失敗錯誤', () => {
      const tmpDir = makeTmpDirWithBadMapping('')
      try {
        expect(() => new EntityDdlReader(makeConfig(tmpDir)).read())
          .toThrow(/解析失敗|格式錯誤/)
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true })
      }
    })
  })
})
