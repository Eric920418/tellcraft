import { describe, it, expect } from 'vitest'
import * as path from 'path'
import { IsaSpecReader } from '../../lib/specformula/spec/isa/isa-spec-reader'

// Use the actual isa.yml from the project
const ISA_PATH = path.resolve(__dirname, '../../../../spec/isa.yml')

describe('IsaSpecReader', () => {
  it('reads and parses the actual isa.yml', () => {
    const reader = new IsaSpecReader(ISA_PATH)
    const spec = reader.read()

    expect(spec.config).toBeDefined()
    expect(spec.config.api).toBeDefined()
    expect(spec.config.data).toBeDefined()
    expect(spec.instructions).toBeDefined()
  })

  it('validates config.api fields', () => {
    const reader = new IsaSpecReader(ISA_PATH)
    const spec = reader.read()

    expect(spec.config.api.resource_path).toBeDefined()
    expect(spec.config.api.project_path).toBeDefined()
    expect(spec.config.api.time_format).toBe('iso')
  })

  it('validates config.data fields', () => {
    const reader = new IsaSpecReader(ISA_PATH)
    const spec = reader.read()

    expect(spec.config.data.permission).toBe('isolated')
    expect(spec.config.data.source).toBeDefined()
    expect(spec.config.data.source!.length).toBeGreaterThan(0)
    expect(spec.config.data.source![0].name).toBe('default')
    expect(spec.config.data.source![0].db_type).toBe('postgresql')
  })

  it('parses all 7 instruction types', () => {
    const reader = new IsaSpecReader(ISA_PATH)
    const spec = reader.read()

    const types = spec.instructions!.map(i => i.instruction_type)
    expect(types).toContain('entity_setup')
    expect(types).toContain('time_control')
    expect(types).toContain('api_call')
    expect(types).toContain('response_validate')
    expect(types).toContain('entity_validate')
    expect(types).toContain('entity_non_existence_validate')
  })

  it('validates response_validate has data_format', () => {
    const reader = new IsaSpecReader(ISA_PATH)
    const spec = reader.read()

    const responseInstructions = spec.instructions!.filter(i => i.instruction_type === 'response_validate')
    expect(responseInstructions.length).toBeGreaterThanOrEqual(2)
    const formats = responseInstructions.map(i => i.data_format)
    expect(formats).toContain('data_table')
    expect(formats).toContain('json')
  })

  it('instruction formats contain named groups', () => {
    const reader = new IsaSpecReader(ISA_PATH)
    const spec = reader.read()

    const entitySetup = spec.instructions!.find(i => i.instruction_type === 'entity_setup')
    expect(entitySetup!.format).toContain('(?<entity>')

    const apiCall = spec.instructions!.find(i => i.instruction_type === 'api_call')
    expect(apiCall!.format).toContain('(?<summary>')

    const responseValidate = spec.instructions!.find(i => i.instruction_type === 'response_validate')
    expect(responseValidate!.format).toContain('(?<status_code>')
  })

  it('throws for missing file', () => {
    const reader = new IsaSpecReader('/nonexistent/path/isa.yml')
    expect(() => reader.read()).toThrow('isa.yml not found')
  })
})
