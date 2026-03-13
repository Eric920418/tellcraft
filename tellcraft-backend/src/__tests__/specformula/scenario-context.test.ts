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
})
