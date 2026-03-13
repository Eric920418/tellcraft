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
  it('reads and parses the actual api-spec.yml', () => {
    const reader = new ApiSpecReader(makeConfig())
    const spec = reader.read()

    expect(spec.operations.length).toBeGreaterThan(0)
  })

  it('parses 3 operations from api-spec.yml', () => {
    const reader = new ApiSpecReader(makeConfig())
    const spec = reader.read()

    expect(spec.operations.length).toBe(3)
  })

  it('correctly parses sendMessage operation', () => {
    const reader = new ApiSpecReader(makeConfig())
    const spec = reader.read()

    const sendMessage = findBySummary(spec,'發送訊息')
    expect(sendMessage).not.toBeNull()
    expect(sendMessage!.method.toUpperCase()).toBe('POST')
    expect(sendMessage!.path).toBe('/api/conversations/{id}/message')
    expect(sendMessage!.operationId).toBe('sendMessage')
  })

  it('correctly parses initializeSession operation', () => {
    const reader = new ApiSpecReader(makeConfig())
    const spec = reader.read()

    const initSession = findBySummary(spec,'建立對話')
    expect(initSession).not.toBeNull()
    expect(initSession!.method.toUpperCase()).toBe('POST')
    expect(initSession!.path).toBe('/api/session/initialize')
  })

  it('correctly parses getProject operation', () => {
    const reader = new ApiSpecReader(makeConfig())
    const spec = reader.read()

    const getProject = findBySummary(spec,'取得專案')
    expect(getProject).not.toBeNull()
    expect(getProject!.method.toUpperCase()).toBe('GET')
    expect(getProject!.path).toBe('/api/projects/{id}')
  })

  it('findBySummary returns null for unknown summary', () => {
    const reader = new ApiSpecReader(makeConfig())
    const spec = reader.read()

    expect(findBySummary(spec,'不存在的操作')).toBeNull()
  })

  it('parses path parameters correctly', () => {
    const reader = new ApiSpecReader(makeConfig())
    const spec = reader.read()

    const sendMessage = findBySummary(spec,'發送訊息')
    const pathParams = (sendMessage!.parameters ?? []).filter(p => p.in === 'path')
    expect(pathParams.length).toBe(1)
    expect(pathParams[0].name).toBe('id')
    expect(pathParams[0].required).toBe(true)
  })

  it('parses request body schema', () => {
    const reader = new ApiSpecReader(makeConfig())
    const spec = reader.read()

    const sendMessage = findBySummary(spec,'發送訊息')
    expect(sendMessage!.requestBody).toBeDefined()
    expect(sendMessage!.requestBody!.schema).toBeDefined()
    expect(sendMessage!.requestBody!.schema!.properties).toBeDefined()
    expect(sendMessage!.requestBody!.schema!.properties!['content']).toBeDefined()
  })

  it('throws for missing directory', () => {
    const reader = new ApiSpecReader(makeConfig('/nonexistent/path'))
    expect(() => reader.read()).toThrow()
  })
})
