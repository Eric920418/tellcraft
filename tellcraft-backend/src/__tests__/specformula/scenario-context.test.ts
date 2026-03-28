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
})
