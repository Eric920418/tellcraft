// ============================================================
// L16.P0.2: extractTableNamesFromDDL
// findMissingTables / ensureNeonSchemaFresh 涉及 DB I/O，留給端到端 dogfood
// ============================================================

import { describe, it, expect } from 'vitest'
import { extractTableNamesFromDDL } from '../services/neon-service'

describe('extractTableNamesFromDDL', () => {
  it('抽出基本 CREATE TABLE', () => {
    const ddl = `CREATE TABLE users (id UUID PRIMARY KEY);
CREATE TABLE orders (id UUID PRIMARY KEY);`
    expect(extractTableNamesFromDDL(ddl).sort()).toEqual(['orders', 'users'])
  })

  it('支援 IF NOT EXISTS', () => {
    const ddl = `CREATE TABLE IF NOT EXISTS magic_link_tokens (token TEXT);
CREATE TABLE orders (id UUID);`
    expect(extractTableNamesFromDDL(ddl).sort()).toEqual(['magic_link_tokens', 'orders'])
  })

  it('忽略 CREATE INDEX / CREATE UNIQUE INDEX', () => {
    const ddl = `CREATE TABLE users (id UUID);
CREATE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_users_phone ON users(phone);`
    expect(extractTableNamesFromDDL(ddl)).toEqual(['users'])
  })

  it('支援 schema.table 限定名（取 table 部分）', () => {
    const ddl = `CREATE TABLE public.users (id UUID);
CREATE TABLE IF NOT EXISTS auth.sessions (token TEXT);`
    expect(extractTableNamesFromDDL(ddl).sort()).toEqual(['sessions', 'users'])
  })

  it('table name 統一小寫', () => {
    const ddl = `CREATE TABLE MenuItems (id UUID);
CREATE TABLE ORDER_ITEMS (id UUID);`
    expect(extractTableNamesFromDDL(ddl).sort()).toEqual(['menuitems', 'order_items'])
  })

  it('空 DDL 回空陣列', () => {
    expect(extractTableNamesFromDDL('')).toEqual([])
  })

  it('16 entity 電商場景', () => {
    const ddl = `CREATE TABLE users (id UUID PRIMARY KEY);
CREATE TABLE customers (id UUID PRIMARY KEY);
CREATE TABLE stores (id UUID PRIMARY KEY);
CREATE TABLE menu_items (id UUID PRIMARY KEY);
CREATE TABLE inventory (id UUID PRIMARY KEY);
CREATE TABLE orders (id UUID PRIMARY KEY);
CREATE TABLE order_items (id UUID PRIMARY KEY);
CREATE TABLE payments (id UUID PRIMARY KEY);
CREATE TABLE reviews (id UUID PRIMARY KEY);
CREATE INDEX idx_orders_customer ON orders(customer_id);`
    const tables = extractTableNamesFromDDL(ddl)
    expect(tables).toContain('inventory')
    expect(tables).toContain('payments')
    expect(tables).toContain('reviews')
    expect(tables).toHaveLength(9)  // 9 tables, 1 index ignored
  })

  it('忽略 ALTER TABLE / COMMENT', () => {
    const ddl = `CREATE TABLE orders (id UUID);
ALTER TABLE orders ADD COLUMN status TEXT;
COMMENT ON TABLE orders IS 'Customer orders';`
    expect(extractTableNamesFromDDL(ddl)).toEqual(['orders'])
  })
})
