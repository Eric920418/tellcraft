import { describe, it, expect, beforeEach } from 'vitest'
import { ScenarioContext } from '../../lib/specformula/context/scenario-context'
import { TestResponse } from '../../lib/specformula/http/test-response'

describe('ScenarioContext', () => {
  let ctx: ScenarioContext

  beforeEach(() => {
    ctx = new ScenarioContext()
  })

  it('starts with no lastResponse', () => {
    expect(ctx.getLastResponse()).toBeNull()
  })

  it('stores and retrieves lastResponse', () => {
    const response = new TestResponse(200, '{"ok":true}', new Map())
    ctx.setLastResponse(response)
    expect(ctx.getLastResponse()).toBe(response)
    expect(ctx.getLastResponse()!.status).toBe(200)
  })

  it('stores and retrieves string values', () => {
    ctx.put('userId', '123')
    expect(ctx.get('userId')).toBe('123')
  })

  it('stores and retrieves object values', () => {
    const obj = { id: '123', name: 'Test' }
    ctx.putObject('user', obj)
    expect(ctx.get('user')).toEqual(obj)
  })

  it('returns null for missing keys', () => {
    expect(ctx.get('nonexistent')).toBeNull()
  })

  it('clear() resets lastResponse but keeps contextData', () => {
    ctx.setLastResponse(new TestResponse(200, '', new Map()))
    ctx.put('key', 'value')
    ctx.clear()
    expect(ctx.getLastResponse()).toBeNull()
    // clear only clears lastResponse per implementation
  })

  it('reset() clears everything', () => {
    ctx.setLastResponse(new TestResponse(200, '', new Map()))
    ctx.put('key', 'value')
    ctx.reset()
    expect(ctx.getLastResponse()).toBeNull()
    expect(ctx.get('key')).toBeNull()
  })

  it('overwrites existing key', () => {
    ctx.put('key', 'value1')
    ctx.put('key', 'value2')
    expect(ctx.get('key')).toBe('value2')
  })

  // Case 1: Entity.field → entityField
  it('resolves Entity.field combined key', () => {
    ctx.putObject('Transaction.id', 'uuid-abc')
    expect(ctx.get('transactionId')).toBe('uuid-abc')
  })

  // Case 2: Entity+digits → strip digits
  it('resolves List1.id → listId (strip trailing digits)', () => {
    ctx.putObject('List1.id', 'uuid-123')
    expect(ctx.get('listId')).toBe('uuid-123')
  })

  it('resolves User2.name → userName (strip trailing digits)', () => {
    ctx.putObject('User2.name', 'Alice')
    expect(ctx.get('userName')).toBe('Alice')
  })

  // Case 2.5: plural table name → singular
  it('resolves lists.id → listId (plural table name)', () => {
    ctx.putObject('lists.id', 'uuid-plural')
    expect(ctx.get('listId')).toBe('uuid-plural')
  })

  it('resolves todos.id → todoId (plural table name)', () => {
    ctx.putObject('todos.id', 'uuid-todo')
    expect(ctx.get('todoId')).toBe('uuid-todo')
  })

  it('resolves users.name → userName (plural table name)', () => {
    ctx.putObject('users.name', 'Bob')
    expect(ctx.get('userName')).toBe('Bob')
  })

  // Case 3: field-only match
  it('resolves bare field name', () => {
    ctx.putObject('Something.id', 'uuid-field')
    expect(ctx.get('id')).toBe('uuid-field')
  })

  // Priority: exact match > combined > field
  it('exact match takes priority over combined', () => {
    ctx.putObject('lists.id', 'uuid-combined')
    ctx.putObject('listId', 'uuid-exact')
    expect(ctx.get('listId')).toBe('uuid-exact')
  })

  // 新增：保留數字後綴的 fallback（修復 LLM 生成 $beautician1Id 引用 Beautician1.id 的問題）
  describe('keep-digit fallback (LLM 數字後綴格式)', () => {
    it('resolves Beautician1.id → beautician1Id (keep digit)', () => {
      ctx.putObject('Beautician1.id', 'uuid-b1')
      expect(ctx.get('beautician1Id')).toBe('uuid-b1')
    })

    it('resolves Category2.id → category2Id (keep digit)', () => {
      ctx.putObject('Category2.id', 'uuid-c2')
      expect(ctx.get('category2Id')).toBe('uuid-c2')
    })

    it('resolves Member5.name → member5Name (keep digit, multi-char field)', () => {
      ctx.putObject('Member5.name', 'Charlie')
      expect(ctx.get('member5Name')).toBe('Charlie')
    })

    // 反向：camelCase + digit lookup → reconstructed 為 PascalCase
    it('resolves $beautician1Id when stored as Beautician1.id (case insensitive)', () => {
      ctx.putObject('Beautician1.id', 'uuid-rev')
      expect(ctx.get('beautician1Id')).toBe('uuid-rev')
    })
  })

  // 大小寫不敏感
  describe('case-insensitive matching', () => {
    it('exact key match is case insensitive', () => {
      ctx.putObject('userId', 'uuid-x')
      expect(ctx.get('UserId')).toBe('uuid-x')
      expect(ctx.get('USERID')).toBe('uuid-x')
    })

    it('PascalCase entity reference matches lowercase storage', () => {
      ctx.putObject('beautician1.id', 'uuid-low')
      expect(ctx.get('Beautician1.id')).toBe('uuid-low')
    })
  })

  // 正規化匹配（移除 . _ -）
  describe('normalized matching', () => {
    it('beautician_1_id matches beautician1Id', () => {
      ctx.putObject('beautician1Id', 'uuid-norm')
      expect(ctx.get('beautician_1_id')).toBe('uuid-norm')
    })

    it('Beautician1.id matches beautician1id', () => {
      ctx.putObject('Beautician1.id', 'uuid-norm2')
      expect(ctx.get('beautician1id')).toBe('uuid-norm2')
    })
  })
})
