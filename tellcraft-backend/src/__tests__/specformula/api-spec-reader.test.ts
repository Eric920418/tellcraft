import { describe, it, expect } from 'vitest'
import * as path from 'path'
import { ApiSpecReader } from '../../lib/specformula/spec/api/api-spec-reader'
import { findBySummary } from '../../lib/specformula/spec/api/models'
import type { IsaApiConfig } from '../../lib/specformula/spec/isa/models'

const API_RESOURCE_PATH = path.resolve(__dirname, '../../../../spec/api')

function makeConfig(resourcePath = API_RESOURCE_PATH): IsaApiConfig {
  return { resource_path: resourcePath, project_path: '.' }
}

describe('ApiSpecReader', () => {
  it('reads and merges all yml files in directory', () => {
    const reader = new ApiSpecReader(makeConfig())
    const spec = reader.read()

    expect(spec.operations.length).toBeGreaterThan(0)
  })

  it('parses 19 operations across 4 files', () => {
    const reader = new ApiSpecReader(makeConfig())
    const spec = reader.read()

    expect(spec.operations.length).toBe(19)
  })

  // ── conversation.yml (3 operations) ──

  it('parses 發送訊息', () => {
    const reader = new ApiSpecReader(makeConfig())
    const spec = reader.read()

    const op = findBySummary(spec, '發送訊息')
    expect(op).not.toBeNull()
    expect(op!.method.toUpperCase()).toBe('POST')
    expect(op!.path).toBe('/api/conversations/{id}/message')
    expect(op!.operationId).toBe('sendMessage')
  })

  it('parses 回覆訊息', () => {
    const reader = new ApiSpecReader(makeConfig())
    const spec = reader.read()

    const op = findBySummary(spec, '回覆訊息')
    expect(op).not.toBeNull()
    expect(op!.method.toUpperCase()).toBe('POST')
    expect(op!.path).toBe('/api/conversations/{id}/reply')
  })

  it('parses 取得訊息列表', () => {
    const reader = new ApiSpecReader(makeConfig())
    const spec = reader.read()

    const op = findBySummary(spec, '取得訊息列表')
    expect(op).not.toBeNull()
    expect(op!.method.toUpperCase()).toBe('GET')
    expect(op!.path).toBe('/api/conversations/{id}/messages')

    // Should have path param + query param
    const pathParams = (op!.parameters ?? []).filter(p => p.in === 'path')
    const queryParams = (op!.parameters ?? []).filter(p => p.in === 'query')
    expect(pathParams.length).toBe(1)
    expect(queryParams.length).toBe(1)
    expect(queryParams[0].name).toBe('lastUpdatedAt')
  })

  // ── session.yml (2 operations) ──

  it('parses 建立對話', () => {
    const reader = new ApiSpecReader(makeConfig())
    const spec = reader.read()

    const op = findBySummary(spec, '建立對話')
    expect(op).not.toBeNull()
    expect(op!.method.toUpperCase()).toBe('POST')
    expect(op!.path).toBe('/api/session/initialize')
  })

  it('parses 取得對話列表', () => {
    const reader = new ApiSpecReader(makeConfig())
    const spec = reader.read()

    const op = findBySummary(spec, '取得對話列表')
    expect(op).not.toBeNull()
    expect(op!.method.toUpperCase()).toBe('GET')
    expect(op!.path).toBe('/api/session/conversations')
  })

  // ── project.yml (8 operations) ──

  it('parses 取得專案', () => {
    const reader = new ApiSpecReader(makeConfig())
    const spec = reader.read()

    const op = findBySummary(spec, '取得專案')
    expect(op).not.toBeNull()
    expect(op!.method.toUpperCase()).toBe('GET')
    expect(op!.path).toBe('/api/projects/{id}')
  })

  it('parses 取得專案列表 with query params', () => {
    const reader = new ApiSpecReader(makeConfig())
    const spec = reader.read()

    const op = findBySummary(spec, '取得專案列表')
    expect(op).not.toBeNull()
    expect(op!.method.toUpperCase()).toBe('GET')
    expect(op!.path).toBe('/api/projects')

    const queryParams = (op!.parameters ?? []).filter(p => p.in === 'query')
    expect(queryParams.length).toBe(4)
    const queryNames = queryParams.map(p => p.name)
    expect(queryNames).toContain('page')
    expect(queryNames).toContain('search')
    expect(queryNames).toContain('status')
  })

  it('parses 建立專案', () => {
    const reader = new ApiSpecReader(makeConfig())
    const spec = reader.read()

    const op = findBySummary(spec, '建立專案')
    expect(op).not.toBeNull()
    expect(op!.method.toUpperCase()).toBe('POST')
    expect(op!.requestBody).toBeDefined()
    expect(op!.requestBody!.schema!.properties!['name']).toBeDefined()
  })

  it('parses 更新專案', () => {
    const reader = new ApiSpecReader(makeConfig())
    const spec = reader.read()

    const op = findBySummary(spec, '更新專案')
    expect(op).not.toBeNull()
    expect(op!.method.toUpperCase()).toBe('PATCH')
    expect(op!.path).toBe('/api/projects/{id}')
  })

  it('parses 刪除專案', () => {
    const reader = new ApiSpecReader(makeConfig())
    const spec = reader.read()

    const op = findBySummary(spec, '刪除專案')
    expect(op).not.toBeNull()
    expect(op!.method.toUpperCase()).toBe('DELETE')
  })

  it('parses 釘選專案', () => {
    const reader = new ApiSpecReader(makeConfig())
    const spec = reader.read()

    const op = findBySummary(spec, '釘選專案')
    expect(op).not.toBeNull()
    expect(op!.method.toUpperCase()).toBe('POST')
    expect(op!.path).toBe('/api/projects/{id}/pin')
  })

  it('parses 取得專案版本', () => {
    const reader = new ApiSpecReader(makeConfig())
    const spec = reader.read()

    const op = findBySummary(spec, '取得專案版本')
    expect(op).not.toBeNull()
    expect(op!.method.toUpperCase()).toBe('GET')
    expect(op!.path).toBe('/api/projects/{id}/versions')
  })

  it('parses 取得專案檔案 with skill_source query', () => {
    const reader = new ApiSpecReader(makeConfig())
    const spec = reader.read()

    const op = findBySummary(spec, '取得專案檔案')
    expect(op).not.toBeNull()
    expect(op!.method.toUpperCase()).toBe('GET')

    const queryParams = (op!.parameters ?? []).filter(p => p.in === 'query')
    expect(queryParams.length).toBe(1)
    expect(queryParams[0].name).toBe('skill_source')
  })

  // ── bdd.yml (6 operations) ──

  it('parses 建立BDD會話', () => {
    const reader = new ApiSpecReader(makeConfig())
    const spec = reader.read()

    const op = findBySummary(spec, '建立BDD會話')
    expect(op).not.toBeNull()
    expect(op!.method.toUpperCase()).toBe('POST')
    expect(op!.path).toBe('/api/bdd/session')
    expect(op!.requestBody!.schema!.properties!['conversationId']).toBeDefined()
    expect(op!.requestBody!.schema!.properties!['originalRequirements']).toBeDefined()
  })

  it('parses 取得BDD會話', () => {
    const reader = new ApiSpecReader(makeConfig())
    const spec = reader.read()

    const op = findBySummary(spec, '取得BDD會話')
    expect(op).not.toBeNull()
    expect(op!.method.toUpperCase()).toBe('GET')
    expect(op!.path).toBe('/api/bdd/session/{id}')
  })

  it('parses BDD clarify operations (answer/confirm/revert/skip)', () => {
    const reader = new ApiSpecReader(makeConfig())
    const spec = reader.read()

    const answer = findBySummary(spec, '回答釐清問題')
    expect(answer).not.toBeNull()
    expect(answer!.method.toUpperCase()).toBe('POST')

    const confirm = findBySummary(spec, '確認規格')
    expect(confirm).not.toBeNull()
    expect(confirm!.requestBody!.schema!.properties!['itemIds']).toBeDefined()

    const revert = findBySummary(spec, '回退釐清項目')
    expect(revert).not.toBeNull()

    const skip = findBySummary(spec, '跳過釐清問題')
    expect(skip).not.toBeNull()
  })

  // ── General ──

  it('findBySummary returns null for unknown summary', () => {
    const reader = new ApiSpecReader(makeConfig())
    const spec = reader.read()

    expect(findBySummary(spec, '不存在的操作')).toBeNull()
  })

  it('parses path parameters correctly', () => {
    const reader = new ApiSpecReader(makeConfig())
    const spec = reader.read()

    const sendMessage = findBySummary(spec, '發送訊息')
    const pathParams = (sendMessage!.parameters ?? []).filter(p => p.in === 'path')
    expect(pathParams.length).toBe(1)
    expect(pathParams[0].name).toBe('id')
    expect(pathParams[0].required).toBe(true)
  })

  it('parses request body schema', () => {
    const reader = new ApiSpecReader(makeConfig())
    const spec = reader.read()

    const sendMessage = findBySummary(spec, '發送訊息')
    expect(sendMessage!.requestBody).toBeDefined()
    expect(sendMessage!.requestBody!.schema).toBeDefined()
    expect(sendMessage!.requestBody!.schema!.properties).toBeDefined()
    expect(sendMessage!.requestBody!.schema!.properties!['message']).toBeDefined()
  })

  it('throws for missing directory', () => {
    const reader = new ApiSpecReader(makeConfig('/nonexistent/path'))
    expect(() => reader.read()).toThrow()
  })
})
