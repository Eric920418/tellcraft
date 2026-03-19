import { describe, it, expect } from 'vitest'
import { deriveSchemaFromBdd } from '../services/schema-derivation'

describe('schema-derivation', () => {
  // ============================================================
  // 基礎功能
  // ============================================================

  it('空 SQL 回傳空結果', () => {
    const result = deriveSchemaFromBdd('', '')
    expect(result.entityCount).toBe(0)
    expect(result.postgresqlDDL).toBe('')
  })

  it('簡單表自動加 id + created_at', () => {
    const sql = `CREATE TABLE products (
      name VARCHAR(100) NOT NULL
    );`
    const result = deriveSchemaFromBdd(sql, '')
    expect(result.entityCount).toBe(1)
    expect(result.postgresqlDDL).toContain('id UUID PRIMARY KEY DEFAULT gen_random_uuid()')
    expect(result.postgresqlDDL).toContain('created_at TIMESTAMPTZ DEFAULT NOW()')
  })

  it('已有 id 和 created_at 不重複加', () => {
    const sql = `CREATE TABLE users (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      name VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`
    const result = deriveSchemaFromBdd(sql, '')
    // id 應被轉為 UUID，不應出現兩個 id
    const idCount = (result.postgresqlDDL.match(/PRIMARY KEY/g) || []).length
    expect(idCount).toBe(1)
  })

  // ============================================================
  // Bug 1: REFERENCES 前有空格 — `REFERENCES users (id)`
  // ============================================================

  it('CONSTRAINT FK 帶空格 REFERENCES table (col) 正確匹配', () => {
    const sql = `
    CREATE TABLE users (
      id VARCHAR(36) NOT NULL PRIMARY KEY
    );
    CREATE TABLE tokens (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      CONSTRAINT fk_token_user FOREIGN KEY (user_id) REFERENCES users (id)
    );`
    const result = deriveSchemaFromBdd(sql, '')
    // FK 應被延後
    expect(result.postgresqlDDL).toContain('ALTER TABLE tokens ADD CONSTRAINT fk_token_user')
    // user_id 應被轉為 UUID（因為在 fkColumns 中）
    expect(result.postgresqlDDL).toContain('user_id UUID')
    expect(result.postgresqlDDL).not.toContain('user_id VARCHAR')
  })

  // ============================================================
  // Bug 2: CONSTRAINT ... PRIMARY KEY — 不應重複加 id
  // ============================================================

  it('CONSTRAINT pk_xxx PRIMARY KEY (col) 不會自動加 id', () => {
    const sql = `CREATE TABLE users (
      user_id VARCHAR(36) NOT NULL COMMENT 'UUID',
      name VARCHAR(100),
      CONSTRAINT pk_users PRIMARY KEY (user_id)
    );`
    const result = deriveSchemaFromBdd(sql, '')
    // 不應自動加 id
    expect(result.postgresqlDDL).not.toContain('id UUID PRIMARY KEY DEFAULT gen_random_uuid()')
    // user_id 的 VARCHAR 應轉為 UUID（因為是 PK）
    expect(result.postgresqlDDL).toContain('user_id UUID')
  })

  it('CONSTRAINT PK + CONSTRAINT FK 都正確處理', () => {
    const sql = `
    CREATE TABLE users (
      user_id VARCHAR(36) NOT NULL COMMENT 'UUID',
      display_name VARCHAR(100) NOT NULL,
      CONSTRAINT pk_users PRIMARY KEY (user_id)
    );
    CREATE TABLE todos (
      todo_id VARCHAR(36) NOT NULL COMMENT 'UUID',
      user_id VARCHAR(36) NOT NULL,
      title VARCHAR(500) NOT NULL,
      CONSTRAINT pk_todos PRIMARY KEY (todo_id),
      CONSTRAINT fk_todos_user FOREIGN KEY (user_id) REFERENCES users (user_id)
    );`
    const result = deriveSchemaFromBdd(sql, '')
    const ddl = result.postgresqlDDL

    // 不應自動加 id
    expect(ddl).not.toContain('id UUID PRIMARY KEY DEFAULT gen_random_uuid()')
    // PK 欄位轉 UUID
    expect(ddl).toContain('user_id UUID')
    expect(ddl).toContain('todo_id UUID')
    // FK 延後
    expect(ddl).toContain('ALTER TABLE todos ADD CONSTRAINT fk_todos_user')
    // 不應有 multiple primary keys
    const usersBlock = ddl.split('CREATE TABLE IF NOT EXISTS todos')[0]
    const pkCount = (usersBlock.match(/PRIMARY KEY/g) || []).length
    expect(pkCount).toBeLessThanOrEqual(1)
  })

  // ============================================================
  // FK 延後（表順序問題）
  // ============================================================

  it('FK 約束延後到所有表建完後', () => {
    const sql = `
    CREATE TABLE orders (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL REFERENCES users(id)
    );
    CREATE TABLE users (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      name VARCHAR(100)
    );`
    const result = deriveSchemaFromBdd(sql, '')
    const ddl = result.postgresqlDDL
    // 兩個表都應該先 CREATE
    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS orders')
    expect(ddl).toContain('CREATE TABLE IF NOT EXISTS users')
    // FK 應在 CREATE TABLE 之後
    const fkPos = ddl.indexOf('ALTER TABLE orders ADD CONSTRAINT')
    const createUsersPos = ddl.indexOf('CREATE TABLE IF NOT EXISTS users')
    expect(fkPos).toBeGreaterThan(createUsersPos)
  })

  // ============================================================
  // MySQL 語法轉換
  // ============================================================

  it('ENUM 轉 VARCHAR + CHECK', () => {
    const sql = `CREATE TABLE tasks (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium'
    );`
    const result = deriveSchemaFromBdd(sql, '')
    expect(result.postgresqlDDL).toContain("VARCHAR(50)")
    expect(result.postgresqlDDL).toContain("CHECK (priority IN ('low', 'medium', 'high'))")
  })

  it('DATETIME 轉 TIMESTAMPTZ', () => {
    const sql = `CREATE TABLE logs (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      logged_at DATETIME NOT NULL
    );`
    const result = deriveSchemaFromBdd(sql, '')
    expect(result.postgresqlDDL).toContain('TIMESTAMPTZ')
    expect(result.postgresqlDDL).not.toContain('DATETIME')
  })

  it('ON UPDATE CURRENT_TIMESTAMP 被移除', () => {
    const sql = `CREATE TABLE items (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );`
    const result = deriveSchemaFromBdd(sql, '')
    expect(result.postgresqlDDL).not.toContain('ON UPDATE')
  })

  it('內聯 COMMENT 轉為 COMMENT ON COLUMN', () => {
    const sql = `CREATE TABLE users (
      id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
      name VARCHAR(100) NOT NULL COMMENT '用戶名稱'
    );`
    const result = deriveSchemaFromBdd(sql, '')
    expect(result.postgresqlDDL).not.toMatch(/COMMENT\s+'/)
    expect(result.postgresqlDDL).toContain("COMMENT ON COLUMN users.name IS '用戶名稱'")
  })

  // ============================================================
  // RLS + Entity Mapping
  // ============================================================

  it('每個表啟用 RLS', () => {
    const sql = `
    CREATE TABLE users (id VARCHAR(36) PRIMARY KEY);
    CREATE TABLE posts (id VARCHAR(36) PRIMARY KEY);`
    const result = deriveSchemaFromBdd(sql, '')
    expect(result.postgresqlDDL).toContain('ALTER TABLE users ENABLE ROW LEVEL SECURITY')
    expect(result.postgresqlDDL).toContain('ALTER TABLE posts ENABLE ROW LEVEL SECURITY')
  })

  it('entity mapping 解析中英文對照', () => {
    const sql = `CREATE TABLE users (id VARCHAR(36) PRIMARY KEY);`
    const mapping = `entity_to_table_mapping:
  用戶: users`
    const result = deriveSchemaFromBdd(sql, mapping)
    expect(result.entities[0].chineseName).toBe('用戶')
    expect(result.entities[0].tableName).toBe('users')
  })

  // ============================================================
  // 真實 BDD schema 回歸測試
  // ============================================================

  it('代辦清單 schema — FK 空格 + CONSTRAINT PK', () => {
    // 簡化版的真實 schema（觸發過 Bug 1 + Bug 2）
    const sql = `
    CREATE TABLE users (
      id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
      email VARCHAR(255) NOT NULL COMMENT 'Email',
      CONSTRAINT uq_users_email UNIQUE (email)
    );
    CREATE TABLE password_reset_tokens (
      id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
      user_id VARCHAR(36) NOT NULL COMMENT 'FK',
      token_hash VARCHAR(255) NOT NULL,
      CONSTRAINT fk_prt_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    CREATE TABLE todos (
      id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
      user_id VARCHAR(36) NOT NULL COMMENT 'FK',
      title VARCHAR(500) NOT NULL,
      priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
      CONSTRAINT fk_todos_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );`

    const result = deriveSchemaFromBdd(sql, '')
    const ddl = result.postgresqlDDL

    expect(result.entityCount).toBe(3)
    // FK 應延後
    expect(ddl).toContain('ALTER TABLE password_reset_tokens ADD CONSTRAINT fk_prt_user_id')
    expect(ddl).toContain('ALTER TABLE todos ADD CONSTRAINT fk_todos_user_id')
    // FK 欄位轉 UUID
    expect(ddl).not.toMatch(/user_id\s+VARCHAR/)
    // ENUM 轉 CHECK
    expect(ddl).toContain("CHECK (priority IN ('low', 'medium', 'high'))")
    // 不應有 multiple primary key
    const tableBlocks = ddl.split('CREATE TABLE IF NOT EXISTS').slice(1)
    for (const block of tableBlocks) {
      const pkCount = (block.split(/CREATE TABLE|ALTER TABLE/)[0].match(/PRIMARY KEY/g) || []).length
      expect(pkCount).toBeLessThanOrEqual(1)
    }
  })

  it('id VARCHAR PK + CONSTRAINT PK 不應產生 multiple primary keys', () => {
    const sql = `
    CREATE TABLE users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      CONSTRAINT pk_users PRIMARY KEY (id)
    );`

    const result = deriveSchemaFromBdd(sql, '')
    const ddl = result.postgresqlDDL

    // 只應有 1 個 PRIMARY KEY
    const usersBlock = ddl.split('CREATE TABLE IF NOT EXISTS')[1] || ''
    const pkCount = (usersBlock.match(/PRIMARY KEY/gi) || []).length
    expect(pkCount).toBe(1)
    // id 應被轉成 UUID
    expect(ddl).toContain('id UUID PRIMARY KEY')
  })

  it('id UUID PK + 獨立 PRIMARY KEY (id) 不應重複', () => {
    const sql = `
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL,
      PRIMARY KEY (id)
    );`

    const result = deriveSchemaFromBdd(sql, '')
    const ddl = result.postgresqlDDL

    const usersBlock = ddl.split('CREATE TABLE IF NOT EXISTS')[1] || ''
    const pkCount = (usersBlock.match(/PRIMARY KEY/gi) || []).length
    expect(pkCount).toBe(1)
  })

  it('夜間導航 schema — CONSTRAINT PK 非 id 欄位', () => {
    const sql = `
    CREATE TABLE users (
      user_id VARCHAR(36) NOT NULL COMMENT 'UUID',
      display_name VARCHAR(100) NOT NULL,
      CONSTRAINT pk_users PRIMARY KEY (user_id)
    );
    CREATE TABLE guardian_relationships (
      relationship_id VARCHAR(36) NOT NULL COMMENT 'UUID',
      walker_id VARCHAR(36) NOT NULL COMMENT 'FK',
      guardian_id VARCHAR(36) NOT NULL COMMENT 'FK',
      CONSTRAINT pk_guardian_relationships PRIMARY KEY (relationship_id),
      CONSTRAINT fk_gr_walker FOREIGN KEY (walker_id) REFERENCES users(user_id),
      CONSTRAINT fk_gr_guardian FOREIGN KEY (guardian_id) REFERENCES users(user_id)
    );`

    const result = deriveSchemaFromBdd(sql, '')
    const ddl = result.postgresqlDDL

    expect(result.entityCount).toBe(2)
    // 不應自動加 id（因為有 CONSTRAINT PK）
    expect(ddl).not.toContain('id UUID PRIMARY KEY DEFAULT gen_random_uuid()')
    // PK 欄位轉 UUID
    expect(ddl).toContain('user_id UUID')
    expect(ddl).toContain('relationship_id UUID')
    // FK 欄位轉 UUID
    expect(ddl).toContain('walker_id UUID')
    expect(ddl).toContain('guardian_id UUID')
    // FK 延後
    expect(ddl).toContain('ALTER TABLE guardian_relationships ADD CONSTRAINT fk_gr_walker')
    expect(ddl).toContain('ALTER TABLE guardian_relationships ADD CONSTRAINT fk_gr_guardian')
  })
})
