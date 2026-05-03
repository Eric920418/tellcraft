// ============================================================
// schema-derivation: extractNullableColumnsHint (L31.E)
// 給 BDD 生成階段注入 nullable columns metadata
// ============================================================

import { describe, it, expect } from 'vitest'
import { extractNullableColumnsHint } from '../services/schema-derivation'

const SCHEMA_SQL = `CREATE TABLE service_items (
  id UUID PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  image_url TEXT,
  image_alt TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  nickname VARCHAR(100)
);`

const ENTITY_MAPPING = `entity_to_table_mapping:
  - ServiceItem: service_items
  - User: users
`

describe('extractNullableColumnsHint', () => {
  it('輸出 markdown 格式 + 標明 nullable_no_default 欄位', () => {
    const hint = extractNullableColumnsHint(SCHEMA_SQL, ENTITY_MAPPING)
    expect(hint).toContain('## Schema Nullable 提示')
    expect(hint).toContain('ServiceItem')
    expect(hint).toContain('image_url')
    expect(hint).toContain('image_alt')
    expect(hint).toContain('description')
    expect(hint).toContain('nullable_no_default')
  })

  it('跳過系統欄位（id, created_at 等）— 不出現在 nullable 清單', () => {
    const hint = extractNullableColumnsHint(SCHEMA_SQL, ENTITY_MAPPING)
    // id 是 PRIMARY KEY 系統欄位 — 不應出現
    // created_at 是系統欄位 — 不應出現
    // is_active 是 NOT NULL — 不應出現在 nullable_no_default
    const lines = hint.split('\n')
    const serviceItemLines = lines.filter(l => l.includes('image_url') || l.includes('image_alt'))
    const allText = serviceItemLines.join(' ')
    expect(allText).not.toContain('created_at')
    // is_active 是 NOT NULL，不該出現
    const fullHintLower = hint.toLowerCase()
    // is_active NOT NULL 不應該被列出（被 helper 內部 isNotNull 條件過濾）
    expect(fullHintLower).not.toMatch(/is_active.*nullable/)
  })

  it('用 relatedEntities 限縮範圍 → 只列指定 entity', () => {
    const hint = extractNullableColumnsHint(SCHEMA_SQL, ENTITY_MAPPING, ['ServiceItem'])
    expect(hint).toContain('ServiceItem')
    expect(hint).not.toContain('User')
    expect(hint).not.toContain('nickname')
  })

  it('relatedEntities 用英文 table 名也能命中', () => {
    const hint = extractNullableColumnsHint(SCHEMA_SQL, ENTITY_MAPPING, ['users'])
    expect(hint).toContain('User')
    expect(hint).toContain('nickname')
    expect(hint).not.toContain('ServiceItem')
  })

  it('schema 全 NOT NULL → 回空字串（避免無意義 hint 浪費 token）', () => {
    const fullySolid = `CREATE TABLE accounts (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL
);`
    const hint = extractNullableColumnsHint(fullySolid, `entity_to_table_mapping:\n  - Account: accounts`)
    expect(hint).toBe('')
  })

  it('空 schema / 空 entityMapping → 回空字串（不爆）', () => {
    expect(extractNullableColumnsHint('', '')).toBe('')
    expect(extractNullableColumnsHint(SCHEMA_SQL, '')).toBe('')
    expect(extractNullableColumnsHint('', ENTITY_MAPPING)).toBe('')
  })
})
