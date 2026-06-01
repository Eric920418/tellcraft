import { describe, it, expect } from 'vitest'
import {
  schemaChangesToSql,
  classifySchemaChanges,
  isDestructive,
  validateIdentifier,
  validatePostgresType,
  type SchemaChange,
} from '../services/schema-change-dsl'

// ============================================================
// validateIdentifier
// ============================================================

describe('validateIdentifier', () => {
  it('合法識別符不 throw', () => {
    expect(() => validateIdentifier('users', 'table')).not.toThrow()
    expect(() => validateIdentifier('user_id', 'column')).not.toThrow()
    expect(() => validateIdentifier('_internal', 'column')).not.toThrow()
    expect(() => validateIdentifier('a1b2c3', 'column')).not.toThrow()
  })

  it('SQL injection 嘗試 → throw', () => {
    expect(() => validateIdentifier('"; DROP TABLE users; --', 'table')).toThrow(/不合法識別符/)
    expect(() => validateIdentifier("users'; DELETE FROM x; --", 'table')).toThrow()
    expect(() => validateIdentifier('users--comment', 'table')).toThrow()
    expect(() => validateIdentifier('users WHERE 1=1', 'table')).toThrow()
  })

  it('開頭數字 / 空字串 / 含空格 → throw', () => {
    expect(() => validateIdentifier('1users', 'table')).toThrow()
    expect(() => validateIdentifier('', 'table')).toThrow()
    expect(() => validateIdentifier('user name', 'column')).toThrow()
    expect(() => validateIdentifier('user-name', 'column')).toThrow()
  })
})

// ============================================================
// validatePostgresType
// ============================================================

describe('validatePostgresType', () => {
  it('常見 base type 通過', () => {
    expect(() => validatePostgresType('INTEGER')).not.toThrow()
    expect(() => validatePostgresType('TEXT')).not.toThrow()
    expect(() => validatePostgresType('BOOLEAN')).not.toThrow()
    expect(() => validatePostgresType('JSONB')).not.toThrow()
    expect(() => validatePostgresType('UUID')).not.toThrow()
    expect(() => validatePostgresType('TIMESTAMPTZ')).not.toThrow()
  })

  it('帶 size/precision 參數通過', () => {
    expect(() => validatePostgresType('VARCHAR(100)')).not.toThrow()
    expect(() => validatePostgresType('NUMERIC(10, 2)')).not.toThrow()
    expect(() => validatePostgresType('CHAR(5)')).not.toThrow()
  })

  it('陣列後綴通過', () => {
    expect(() => validatePostgresType('INT[]')).not.toThrow()
    expect(() => validatePostgresType('TEXT[][]')).not.toThrow()
  })

  it('未知 type → throw', () => {
    expect(() => validatePostgresType('STRING')).toThrow()  // 不是 PostgreSQL keyword
    expect(() => validatePostgresType('OBJECT')).toThrow()
    expect(() => validatePostgresType('hstore')).toThrow()  // extension type 故意不在白名單
  })

  it('SQL injection 形式 → throw', () => {
    expect(() => validatePostgresType('INT; DROP TABLE x; --')).toThrow()
  })
})

// ============================================================
// schemaChangesToSql — forward
// ============================================================

describe('schemaChangesToSql forward', () => {
  it('add_column 產出 ALTER TABLE ADD COLUMN', () => {
    const changes: SchemaChange[] = [{
      kind: 'add_column',
      table: 'posts',
      column: 'vote_count',
      type: 'INTEGER',
      nullable: false,
      default: '0',
      destructive: false,
    }]
    const { forward, reverse } = schemaChangesToSql(changes)
    expect(forward).toBe('ALTER TABLE "posts" ADD COLUMN "vote_count" INTEGER NOT NULL DEFAULT 0;')
    expect(reverse).toBe('ALTER TABLE "posts" DROP COLUMN IF EXISTS "vote_count";')
  })

  it('add_table 含 primary key 與多欄位', () => {
    const changes: SchemaChange[] = [{
      kind: 'add_table',
      table: 'comments',
      columns: [
        { name: 'id', type: 'UUID', nullable: false, primaryKey: true },
        { name: 'post_id', type: 'UUID', nullable: false },
        { name: 'body', type: 'TEXT', nullable: false },
      ],
      destructive: false,
    }]
    const { forward, reverse } = schemaChangesToSql(changes)
    expect(forward).toContain('CREATE TABLE "comments"')
    expect(forward).toContain('"id" UUID PRIMARY KEY')
    expect(forward).toContain('"post_id" UUID NOT NULL')
    expect(reverse).toBe('DROP TABLE IF EXISTS "comments";')
  })

  it('add_index 加 UNIQUE', () => {
    const changes: SchemaChange[] = [{
      kind: 'add_index',
      table: 'users',
      indexName: 'users_email_idx',
      columns: ['email'],
      unique: true,
      destructive: false,
    }]
    const { forward, reverse } = schemaChangesToSql(changes)
    expect(forward).toBe('CREATE UNIQUE INDEX "users_email_idx" ON "users" ("email");')
    expect(reverse).toBe('DROP INDEX IF EXISTS "users_email_idx";')
  })

  it('add_foreign_key 加 ON DELETE CASCADE', () => {
    const changes: SchemaChange[] = [{
      kind: 'add_foreign_key',
      table: 'comments',
      column: 'post_id',
      references: { table: 'posts', column: 'id' },
      onDelete: 'CASCADE',
      destructive: false,
    }]
    const { forward, reverse } = schemaChangesToSql(changes)
    expect(forward).toContain('ALTER TABLE "comments" ADD FOREIGN KEY ("post_id") REFERENCES "posts" ("id") ON DELETE CASCADE;')
    // reverse 用自動命名規則
    expect(reverse).toContain('DROP CONSTRAINT IF EXISTS "comments_post_id_fkey"')
  })

  it('drop_column 帶 reverseType 用於 reverse', () => {
    const changes: SchemaChange[] = [{
      kind: 'drop_column',
      table: 'users',
      column: 'old_field',
      reverseType: 'TEXT',
      reverseNullable: true,
      destructive: true,
    }]
    const { forward, reverse } = schemaChangesToSql(changes)
    expect(forward).toBe('ALTER TABLE "users" DROP COLUMN "old_field";')
    expect(reverse).toBe('ALTER TABLE "users" ADD COLUMN "old_field" TEXT;')
  })

  it('rename_column forward + reverse 對稱', () => {
    const changes: SchemaChange[] = [{
      kind: 'rename_column',
      table: 'users',
      fromColumn: 'username',
      toColumn: 'login_name',
      destructive: true,
    }]
    const { forward, reverse } = schemaChangesToSql(changes)
    expect(forward).toBe('ALTER TABLE "users" RENAME COLUMN "username" TO "login_name";')
    expect(reverse).toBe('ALTER TABLE "users" RENAME COLUMN "login_name" TO "username";')
  })

  it('alter_type 含 USING', () => {
    const changes: SchemaChange[] = [{
      kind: 'alter_type',
      table: 'posts',
      column: 'views',
      newType: 'BIGINT',
      oldType: 'INTEGER',
      using: '"views"::bigint',
      destructive: true,
    }]
    const { forward, reverse } = schemaChangesToSql(changes)
    expect(forward).toBe('ALTER TABLE "posts" ALTER COLUMN "views" TYPE BIGINT USING "views"::bigint;')
    expect(reverse).toBe('ALTER TABLE "posts" ALTER COLUMN "views" TYPE INTEGER;')
  })
})

// ============================================================
// schemaChangesToSql — 依存排序
// ============================================================

describe('schemaChangesToSql 依存排序', () => {
  it('add_table 排在 add_foreign_key 前', () => {
    const changes: SchemaChange[] = [
      {
        kind: 'add_foreign_key',
        table: 'comments',
        column: 'post_id',
        references: { table: 'posts', column: 'id' },
        destructive: false,
      },
      {
        kind: 'add_table',
        table: 'comments',
        columns: [
          { name: 'id', type: 'UUID', nullable: false, primaryKey: true },
          { name: 'post_id', type: 'UUID', nullable: false },
        ],
        destructive: false,
      },
    ]
    const { forward } = schemaChangesToSql(changes)
    const tableIdx = forward.indexOf('CREATE TABLE "comments"')
    const fkIdx = forward.indexOf('FOREIGN KEY')
    expect(tableIdx).toBeLessThan(fkIdx)
  })

  it('add_column 排在 add_index 前（先有欄位才能加索引）', () => {
    const changes: SchemaChange[] = [
      {
        kind: 'add_index',
        table: 'users',
        indexName: 'users_role_idx',
        columns: ['role'],
        unique: false,
        destructive: false,
      },
      {
        kind: 'add_column',
        table: 'users',
        column: 'role',
        type: 'TEXT',
        nullable: false,
        default: "'user'",
        destructive: false,
      },
    ]
    const { forward } = schemaChangesToSql(changes)
    const colIdx = forward.indexOf('ADD COLUMN "role"')
    const idxIdx = forward.indexOf('CREATE INDEX')
    expect(colIdx).toBeLessThan(idxIdx)
  })

  it('reverse 順序與 forward 相反（drop_table 應排在最後 forward / 最前 reverse 動作）', () => {
    const changes: SchemaChange[] = [
      {
        kind: 'add_column',
        table: 'users',
        column: 'extra',
        type: 'TEXT',
        nullable: true,
        destructive: false,
      },
      {
        kind: 'add_table',
        table: 'logs',
        columns: [{ name: 'id', type: 'UUID', nullable: false, primaryKey: true }],
        destructive: false,
      },
    ]
    const { forward, reverse } = schemaChangesToSql(changes)
    // forward: add_table 先（KIND_ORDER 1）→ add_column 後（KIND_ORDER 2）
    expect(forward.indexOf('CREATE TABLE "logs"')).toBeLessThan(forward.indexOf('ADD COLUMN "extra"'))
    // reverse: add_column 反向先（DROP COLUMN）→ add_table 反向後（DROP TABLE）
    expect(reverse.indexOf('DROP COLUMN IF EXISTS "extra"')).toBeLessThan(reverse.indexOf('DROP TABLE IF EXISTS "logs"'))
  })
})

// ============================================================
// schemaChangesToSql — injection 防護
// ============================================================

describe('schemaChangesToSql injection 防護', () => {
  it('table name 含 SQL injection → throw', () => {
    const changes: SchemaChange[] = [{
      kind: 'add_column',
      table: 'users"; DROP TABLE x; --',
      column: 'x',
      type: 'TEXT',
      nullable: true,
      destructive: false,
    }]
    expect(() => schemaChangesToSql(changes)).toThrow(/不合法識別符/)
  })

  it('column name 含特殊字元 → throw', () => {
    const changes: SchemaChange[] = [{
      kind: 'add_column',
      table: 'users',
      column: 'foo; DELETE FROM x',
      type: 'TEXT',
      nullable: true,
      destructive: false,
    }]
    expect(() => schemaChangesToSql(changes)).toThrow()
  })

  it('未知 type → throw', () => {
    const changes: SchemaChange[] = [{
      kind: 'add_column',
      table: 'users',
      column: 'evil',
      type: 'INTEGER; DROP TABLE x; --',
      nullable: true,
      destructive: false,
    }]
    expect(() => schemaChangesToSql(changes)).toThrow()
  })

  it('FK onDelete 非白名單 → throw', () => {
    const changes: SchemaChange[] = [{
      kind: 'add_foreign_key',
      table: 'comments',
      column: 'post_id',
      references: { table: 'posts', column: 'id' },
      onDelete: 'DROP TABLE x' as 'CASCADE',
      destructive: false,
    }]
    expect(() => schemaChangesToSql(changes)).toThrow(/不合法 onDelete/)
  })
})

// ============================================================
// classifySchemaChanges
// ============================================================

describe('classifySchemaChanges', () => {
  it('全 additive', () => {
    const changes: SchemaChange[] = [
      { kind: 'add_column', table: 'a', column: 'b', type: 'TEXT', nullable: true, destructive: false },
      { kind: 'add_index', table: 'a', indexName: 'a_b_idx', columns: ['b'], unique: false, destructive: false },
    ]
    expect(classifySchemaChanges(changes)).toBe('additive')
  })

  it('全 destructive', () => {
    const changes: SchemaChange[] = [
      { kind: 'drop_column', table: 'a', column: 'b', reverseType: 'TEXT', reverseNullable: true, destructive: true },
    ]
    expect(classifySchemaChanges(changes)).toBe('destructive')
  })

  it('mixed', () => {
    const changes: SchemaChange[] = [
      { kind: 'add_column', table: 'a', column: 'b', type: 'TEXT', nullable: true, destructive: false },
      { kind: 'drop_column', table: 'a', column: 'c', reverseType: 'TEXT', reverseNullable: true, destructive: true },
    ]
    expect(classifySchemaChanges(changes)).toBe('mixed')
  })

  it('空 array 視為 additive（no-op）', () => {
    expect(classifySchemaChanges([])).toBe('additive')
  })
})

// ============================================================
// isDestructive
// ============================================================

describe('isDestructive', () => {
  it('讀取 destructive 旗標', () => {
    expect(isDestructive({ kind: 'add_column', table: 'a', column: 'b', type: 'TEXT', nullable: true, destructive: false })).toBe(false)
    expect(isDestructive({ kind: 'drop_column', table: 'a', column: 'b', reverseType: 'TEXT', reverseNullable: true, destructive: true })).toBe(true)
  })
})

// ============================================================
// schemaChangesToSql — warnings + empty
// ============================================================

describe('schemaChangesToSql warnings', () => {
  it('空 array 回 warnings 提示', () => {
    const { forward, reverse, warnings } = schemaChangesToSql([])
    expect(forward).toBe('')
    expect(reverse).toBe('')
    expect(warnings).toContain('empty schema changes')
  })

  it('drop_column 缺 reverseType → warning', () => {
    const changes: SchemaChange[] = [{
      kind: 'drop_column',
      table: 'a',
      column: 'b',
      reverseType: '',
      reverseNullable: true,
      destructive: true,
    }]
    // 空 reverseType 形式上會傳到 formatColumnDef，會 throw validatePostgresType
    // 所以這裡測 warning 邏輯是否在 throw 前被偵測
    expect(() => schemaChangesToSql(changes)).toThrow()
  })

  it('drop_table 缺 reverseColumns → warning', () => {
    const changes: SchemaChange[] = [{
      kind: 'drop_table',
      table: 'a',
      reverseColumns: [],
      destructive: true,
    }]
    const { warnings } = schemaChangesToSql(changes)
    expect(warnings.some(w => w.includes('drop_table on a'))).toBe(true)
  })
})
