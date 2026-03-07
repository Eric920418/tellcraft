import { vi } from 'vitest'

// Mock Redis
vi.mock('ioredis', () => {
  const RedisMock = vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    keys: vi.fn().mockResolvedValue([]),
    quit: vi.fn(),
    on: vi.fn(),
    status: 'ready',
  }))
  return { default: RedisMock, Redis: RedisMock }
})

// Mock pg Pool
vi.mock('pg', () => {
  const pool = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    connect: vi.fn(),
    end: vi.fn(),
    on: vi.fn(),
  }
  return { default: { Pool: vi.fn(() => pool) }, Pool: vi.fn(() => pool) }
})
