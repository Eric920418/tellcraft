import { describe, it, expect } from 'vitest'
import {
  expandFieldCandidates,
  fieldMatchesAnyColumn,
  columnExistsInTable,
  toSnakeCase,
  toCamelCase,
} from '../services/column-name-matcher'
import { isCreateScenario } from '../services/feature-alignment-gate'

describe('column-name-matcher — expandFieldCandidates', () => {
  it('原始 / snake / camel 三變體都產出', () => {
    const out = expandFieldCandidates('userName')
    expect(out).toContain('username')
    expect(out).toContain('user_name')
  })

  it('VAR 序列化命名（adminUser1Id）剝尾段抓 id', () => {
    const out = expandFieldCandidates('adminUser1Id')
    expect(out).toContain('id')  // ← 關鍵：要能對應 admin_users.id
    expect(out).toContain('adminuser1id')
  })

  it('VAR 命名 plan2Title → title', () => {
    const out = expandFieldCandidates('plan2Title')
    expect(out).toContain('title')
  })

  it('VAR 命名 article1CategoryId → category_id（複合 field）', () => {
    const out = expandFieldCandidates('article1CategoryId')
    // CategoryId → categoryId → category_id
    expect(out).toContain('categoryid')
    expect(out).toContain('category_id')
  })

  it('單 entity prefix（無 seq）planId → id', () => {
    const out = expandFieldCandidates('planId')
    expect(out).toContain('id')
    expect(out).toContain('plan_id')
  })

  it('單 entity prefix userEmail → email', () => {
    const out = expandFieldCandidates('userEmail')
    expect(out).toContain('email')
    expect(out).toContain('user_email')
  })

  it('snake_case 原樣輸入不爆', () => {
    const out = expandFieldCandidates('user_email')
    expect(out).toContain('user_email')
    expect(out).toContain('useremail')
  })

  it('空字串回空陣列', () => {
    expect(expandFieldCandidates('')).toEqual([])
    expect(expandFieldCandidates('   ')).toEqual([])
  })

  it('純小寫單字（id / name / email）不解構也能對應自己', () => {
    expect(expandFieldCandidates('id')).toContain('id')
    expect(expandFieldCandidates('name')).toContain('name')
  })

  it('全部 candidate 都是 lowercase', () => {
    const out = expandFieldCandidates('adminUser1Id')
    for (const c of out) {
      expect(c).toBe(c.toLowerCase())
    }
  })
})

describe('column-name-matcher — fieldMatchesAnyColumn', () => {
  it('VAR 命名 adminUser1Id 對應 schema admin_users.id', () => {
    // admin_users 表的 columns
    const cols = ['id', 'username', 'password_hash', 'role', 'deleted_at']
    expect(fieldMatchesAnyColumn('adminUser1Id', cols)).toBe(true)
  })

  it('VAR 命名 category1Name 對應 categories.name', () => {
    const cols = ['id', 'name', 'slug', 'description']
    expect(fieldMatchesAnyColumn('category1Name', cols)).toBe(true)
  })

  it('完全不在 schema 的欄位回 false', () => {
    const cols = ['id', 'name']
    expect(fieldMatchesAnyColumn('adminUser1Foo', cols)).toBe(false)
  })

  it('支援 Set<string> input', () => {
    const set = new Set(['id', 'name'])
    expect(fieldMatchesAnyColumn('plan1Id', set)).toBe(true)
  })

  it('支援 ColumnLike[] input', () => {
    const cols = [{ name: 'id' }, { name: 'name' }]
    expect(fieldMatchesAnyColumn('adminUser1Id', cols)).toBe(true)
  })

  it('大小寫不敏感', () => {
    const cols = ['ID', 'Name']
    expect(fieldMatchesAnyColumn('adminUser1Id', cols)).toBe(true)
    expect(fieldMatchesAnyColumn('CATEGORY1NAME', cols)).toBe(true)
  })
})

describe('column-name-matcher — columnExistsInTable', () => {
  it('VAR 命名能對應 table.columns', () => {
    const table = { columns: [{ name: 'id' }, { name: 'email' }, { name: 'created_at' }] }
    expect(columnExistsInTable('adminUser1Id', table)).toBe(true)
    expect(columnExistsInTable('user2Email', table)).toBe(true)
    expect(columnExistsInTable('record1CreatedAt', table)).toBe(true)
  })

  it('不存在欄位回 false', () => {
    const table = { columns: [{ name: 'id' }] }
    expect(columnExistsInTable('foo1Bar', table)).toBe(false)
  })
})

describe('column-name-matcher — toSnakeCase / toCamelCase', () => {
  it('與既有實作一致', () => {
    expect(toSnakeCase('userName')).toBe('user_name')
    expect(toSnakeCase('adminUserId')).toBe('admin_user_id')
    expect(toCamelCase('user_name')).toBe('userName')
    expect(toCamelCase('admin_user_id')).toBe('adminUserId')
  })
})

describe('feature-alignment-gate — isCreateScenario', () => {
  it('Create scenario 前綴命中', () => {
    expect(isCreateScenario('Create Category succeeds')).toBe(true)
    expect(isCreateScenario('Add new product')).toBe(true)
    expect(isCreateScenario('Submit Contact Form')).toBe(true)
    expect(isCreateScenario('Register new admin')).toBe(true)
    expect(isCreateScenario('Insert order item')).toBe(true)
    expect(isCreateScenario('Upload Product Image')).toBe(true)
    expect(isCreateScenario('New article published')).toBe(true)
  })

  it('大小寫不敏感', () => {
    expect(isCreateScenario('create category')).toBe(true)
    expect(isCreateScenario('SUBMIT form')).toBe(true)
  })

  it('非 Create scenario 不命中', () => {
    expect(isCreateScenario('List articles')).toBe(false)
    expect(isCreateScenario('Update product')).toBe(false)
    expect(isCreateScenario('Delete order')).toBe(false)
    expect(isCreateScenario('Show created articles')).toBe(false)  // create 在中間不算
    expect(isCreateScenario('Customer creates account')).toBe(false)  // create 在中間
  })

  it('前綴後沒空格不命中（避免 createdAt 等誤判）', () => {
    expect(isCreateScenario('Createdat field test')).toBe(false)
    expect(isCreateScenario('Created article shown')).toBe(false)
  })

  it('空字串 / 前後空白安全處理', () => {
    expect(isCreateScenario('')).toBe(false)
    expect(isCreateScenario('   ')).toBe(false)
    expect(isCreateScenario('  Create Foo  ')).toBe(true)
  })
})
