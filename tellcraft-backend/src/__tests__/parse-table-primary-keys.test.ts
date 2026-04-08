/**
 * 測試 parseTablePrimaryKeys 偵測複合主鍵和 inline PK
 */
import { describe, it, expect } from 'vitest'
import { parseTablePrimaryKeys } from '../services/coder-generation'

describe('parseTablePrimaryKeys', () => {
  it('偵測複合主鍵 (junction table)', () => {
    const sql = `
CREATE TABLE todo_tags (
  todo_id UUID NOT NULL REFERENCES todos(id),
  tag_id UUID NOT NULL REFERENCES tags(id),
  PRIMARY KEY (todo_id, tag_id)
);
`
    const pks = parseTablePrimaryKeys(sql)
    expect(pks.get('todo_tags')).toEqual(['todo_id', 'tag_id'])
  })

  it('偵測 inline PRIMARY KEY (單欄位)', () => {
    const sql = `
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL
);
`
    const pks = parseTablePrimaryKeys(sql)
    expect(pks.get('users')).toEqual(['id'])
  })

  it('混合多表（一個 inline PK + 一個複合 PK）', () => {
    const sql = `
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name TEXT
);

CREATE TABLE user_roles (
  user_id UUID NOT NULL,
  role_id UUID NOT NULL,
  PRIMARY KEY (user_id, role_id)
);
`
    const pks = parseTablePrimaryKeys(sql)
    expect(pks.get('users')).toEqual(['id'])
    expect(pks.get('user_roles')).toEqual(['user_id', 'role_id'])
  })

  it('三欄位複合主鍵', () => {
    const sql = `
CREATE TABLE permissions (
  user_id UUID NOT NULL,
  resource_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  PRIMARY KEY (user_id, resource_id, action_type)
);
`
    const pks = parseTablePrimaryKeys(sql)
    expect(pks.get('permissions')).toEqual(['user_id', 'resource_id', 'action_type'])
  })

  it('表名小寫化', () => {
    const sql = `
CREATE TABLE Users (
  id UUID PRIMARY KEY,
  name TEXT
);
`
    const pks = parseTablePrimaryKeys(sql)
    expect(pks.has('users')).toBe(true)
    expect(pks.get('users')).toEqual(['id'])
  })

  it('沒有 PK 的表不出現在結果中', () => {
    const sql = `
CREATE TABLE logs (
  message TEXT,
  created_at TIMESTAMPTZ
);
`
    const pks = parseTablePrimaryKeys(sql)
    expect(pks.has('logs')).toBe(false)
  })

  it('IF NOT EXISTS 變體', () => {
    const sql = `
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY,
  user_id UUID
);
`
    const pks = parseTablePrimaryKeys(sql)
    expect(pks.get('sessions')).toEqual(['id'])
  })
})
