import { describe, it, expect } from 'vitest'
import {
  dedupUniqueColumnValuesInFeatures,
  extractUniqueColumnsBySchema,
} from '../services/unique-constraint-dedup'

const USER_SCHEMA = `
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL
);
`

const POST_SCHEMA = `
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  slug VARCHAR(100) NOT NULL,
  title TEXT NOT NULL,
  UNIQUE (slug)
);
`

describe('extractUniqueColumnsBySchema', () => {
  it('解析 inline column UNIQUE 約束', () => {
    const result = extractUniqueColumnsBySchema(USER_SCHEMA)
    expect(result.get('users')).toEqual(new Set(['email', 'username']))
  })

  it('解析 table-level UNIQUE 單欄位約束', () => {
    const result = extractUniqueColumnsBySchema(POST_SCHEMA)
    expect(result.get('posts')).toEqual(new Set(['slug']))
  })

  it('空 schema 回空 Map', () => {
    expect(extractUniqueColumnsBySchema('').size).toBe(0)
  })

  it('複合 UNIQUE (col1, col2) 不被視為 single-column unique', () => {
    const schema = `
      CREATE TABLE user_roles (
        user_id UUID,
        role_id UUID,
        UNIQUE (user_id, role_id)
      );
    `
    const result = extractUniqueColumnsBySchema(schema)
    expect(result.get('user_roles')?.size ?? 0).toBe(0)
  })
})

describe('dedupUniqueColumnValuesInFeatures', () => {
  it('Background 內同 email 重複自動加 +s2 suffix', () => {
    const featureContent = `# Action: register
Feature: Register User

  Background:
    Given 準備一個User, with table:
      | >User1.id | email          | username | passwordHash |
      | <user1Id  | alice@test.com | alice    | hash1        |
    And 準備一個User, with table:
      | >User2.id | email          | username | passwordHash |
      | <user2Id  | alice@test.com | bob      | hash2        |

  Rule: 測試
    Example: foo
      Given 準備一個Admin, with table:
        | id |
`
    const result = dedupUniqueColumnValuesInFeatures(
      [{ actionName: 'register', name: 'Register User', content: featureContent }],
      USER_SCHEMA,
    )
    expect(result.changes.length).toBe(1)
    expect(result.changes[0].column).toBe('email')
    expect(result.changes[0].originalValue).toBe('alice@test.com')
    expect(result.changes[0].newValue).toBe('alice+s2@test.com')

    const fixed = result.fixedFeatures.get('Register User')
    expect(fixed).toBeDefined()
    expect(fixed!).toContain('alice+s2@test.com')
    // 第一筆保留原值
    expect(fixed!).toContain('| alice@test.com |')
  })

  it('不同 scenario 間相同 email 不會 dedup（每 scenario reset DB）', () => {
    const featureContent = `# Action: x
Feature: X

  Rule: r1
    Example: A
      Given 準備一個User, with table:
        | >User1.id | email          | username | passwordHash |
        | <user1Id  | alice@test.com | alice    | h            |

  Rule: r2
    Example: B
      Given 準備一個User, with table:
        | >User2.id | email          | username | passwordHash |
        | <user2Id  | alice@test.com | bob      | h            |
`
    const result = dedupUniqueColumnValuesInFeatures(
      [{ actionName: 'x', name: 'X', content: featureContent }],
      USER_SCHEMA,
    )
    expect(result.changes.length).toBe(0)
    expect(result.fixedFeatures.size).toBe(0)
  })

  it('schema 沒給時 fail-open 回空結果', () => {
    const result = dedupUniqueColumnValuesInFeatures(
      [{ actionName: 'x', content: 'irrelevant' }],
      '',
    )
    expect(result.fixedFeatures.size).toBe(0)
    expect(result.changes.length).toBe(0)
  })

  it('非 UNIQUE column 重複值不動（如 sortOrder）', () => {
    const featureContent = `# Action: faq
Feature: List FAQ
  Background:
    Given 準備一個User, with table:
      | >User1.id | email          | username | passwordHash |
      | <user1Id  | a@test.com     | alice    | h            |
    And 準備一個User, with table:
      | >User2.id | email          | username | passwordHash |
      | <user2Id  | b@test.com     | bob      | h            |
`
    // email + username 都不重複 → 無變動
    const result = dedupUniqueColumnValuesInFeatures(
      [{ actionName: 'faq', name: 'List FAQ', content: featureContent }],
      USER_SCHEMA,
    )
    expect(result.changes.length).toBe(0)
  })

  it('VAR 引用值（<varName / $varName / >var）跳過不 dedup', () => {
    const featureContent = `# Action: x
Feature: X
  Background:
    Given 準備一個User, with table:
      | >User1.id | email     | username | passwordHash |
      | <user1Id  | $sharedEm | alice    | h            |
    And 準備一個User, with table:
      | >User2.id | email     | username | passwordHash |
      | <user2Id  | $sharedEm | bob      | h            |
`
    const result = dedupUniqueColumnValuesInFeatures(
      [{ actionName: 'x', content: featureContent }],
      USER_SCHEMA,
    )
    expect(result.changes.length).toBe(0)
  })

  it('username 重複用 _s2 而非 +s2（非 email 格式）', () => {
    const featureContent = `# Action: x
Feature: X
  Background:
    Given 準備一個User, with table:
      | >User1.id | email  | username | passwordHash |
      | <user1Id  | a@t.co | alice    | h            |
    And 準備一個User, with table:
      | >User2.id | email  | username | passwordHash |
      | <user2Id  | b@t.co | alice    | h            |
`
    const result = dedupUniqueColumnValuesInFeatures(
      [{ actionName: 'x', content: featureContent }],
      USER_SCHEMA,
    )
    expect(result.changes.length).toBe(1)
    expect(result.changes[0].column).toBe('username')
    expect(result.changes[0].newValue).toBe('alice_s2')
  })

  it('三次重複連續加 +s2 / +s3 suffix', () => {
    const featureContent = `# Action: x
Feature: X
  Background:
    Given 準備一個User, with table:
      | >User1.id | email          | username | passwordHash |
      | <user1Id  | dup@test.com   | a        | h            |
    And 準備一個User, with table:
      | >User2.id | email          | username | passwordHash |
      | <user2Id  | dup@test.com   | b        | h            |
    And 準備一個User, with table:
      | >User3.id | email          | username | passwordHash |
      | <user3Id  | dup@test.com   | c        | h            |
`
    const result = dedupUniqueColumnValuesInFeatures(
      [{ actionName: 'x', content: featureContent }],
      USER_SCHEMA,
    )
    expect(result.changes.length).toBe(2)
    const fixed = result.fixedFeatures.get('x')!
    expect(fixed).toContain('dup+s2@test.com')
    expect(fixed).toContain('dup+s3@test.com')
  })
})
