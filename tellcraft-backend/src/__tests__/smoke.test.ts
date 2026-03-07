import { describe, it, expect } from 'vitest'

describe('Backend Smoke Test', () => {
  it('vitest is working', () => {
    expect(1 + 1).toBe(2)
  })

  it('environment is node', () => {
    expect(typeof process.env).toBe('object')
  })
})
