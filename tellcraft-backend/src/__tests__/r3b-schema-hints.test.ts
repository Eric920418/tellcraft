// R3-B: FK + CHECK constraint hint helpers 測試
import { describe, it, expect } from 'vitest'
import {
  extractFkRelationshipHint,
  extractCheckConstraintHint,
} from '../services/schema-derivation'

describe('R3-B: extractFkRelationshipHint', () => {
  it('extracts FK columns with REFERENCES syntax', () => {
    const schemaSql = `
      CREATE TABLE orders (
        id UUID PRIMARY KEY,
        customer_id UUID NOT NULL REFERENCES customers(id)
      );
      CREATE TABLE customers (
        id UUID PRIMARY KEY,
        name VARCHAR(100)
      );
    `
    const entityMapping = `
entity_to_table_mapping:
  - 訂單: orders
  - 客戶: customers
`
    const hint = extractFkRelationshipHint(schemaSql, entityMapping)
    expect(hint).toContain('FK')
    expect(hint).toContain('customer_id')
    expect(hint).toContain('客戶')  // parent entity 中文名
    expect(hint).toContain('id')
  })

  it('returns empty when no FK columns', () => {
    const schemaSql = `CREATE TABLE simple (id UUID PRIMARY KEY, name TEXT);`
    const entityMapping = `entity_to_table_mapping:\n  - 簡單: simple\n`
    expect(extractFkRelationshipHint(schemaSql, entityMapping)).toBe('')
  })

  it('returns empty when schema has no tables', () => {
    expect(extractFkRelationshipHint('', '')).toBe('')
  })
})

describe('R3-B: extractCheckConstraintHint', () => {
  it('extracts enum CHECK constraints', () => {
    const schemaSql = `
      CREATE TABLE orders (
        id UUID PRIMARY KEY,
        status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed', 'cancelled'))
      );
    `
    const entityMapping = `entity_to_table_mapping:\n  - 訂單: orders\n`
    const hint = extractCheckConstraintHint(schemaSql, entityMapping)
    expect(hint).toContain('CHECK')
    expect(hint).toContain('status')
    expect(hint).toContain("'pending'")
    expect(hint).toContain("'completed'")
    expect(hint).toContain("'cancelled'")
  })

  it('extracts range CHECK constraints', () => {
    const schemaSql = `
      CREATE TABLE products (
        id UUID PRIMARY KEY,
        quantity INT NOT NULL CHECK (quantity >= 1)
      );
    `
    const entityMapping = `entity_to_table_mapping:\n  - 商品: products\n`
    const hint = extractCheckConstraintHint(schemaSql, entityMapping)
    expect(hint).toContain('quantity')
    expect(hint).toContain('>=')
    expect(hint).toContain('1')
  })

  it('returns empty when no CHECK constraints', () => {
    const schemaSql = `CREATE TABLE simple (id UUID PRIMARY KEY, name TEXT);`
    const entityMapping = `entity_to_table_mapping:\n  - 簡單: simple\n`
    expect(extractCheckConstraintHint(schemaSql, entityMapping)).toBe('')
  })
})
