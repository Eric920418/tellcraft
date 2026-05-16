import { vi } from 'vitest'

// Mock env（必須在其他 import 之前，因為 deployer/anthropic 在模組頂層呼叫 getEnv()）
vi.mock('../lib/env', () => ({
  validateEnv: vi.fn(() => ({})),
  getEnv: vi.fn(() => ({
    DATABASE_URL: 'postgresql://test:test@localhost/test',
    JWT_SECRET: 'test-secret',
    ANTHROPIC_API_KEY: 'sk-ant-test',
    PORT: 3100,
    REDIS_URL: 'redis://localhost:6379',
    CORS_ORIGIN: 'http://localhost:3000',
    DB_POOL_MAX: 20,
    LOG_LEVEL: 'info',
    NODE_ENV: 'test',
    WORKER_CONCURRENCY: 20,
    LLM_MAX_CONCURRENT: 20,
    LLM_QUEUE_TIMEOUT_MS: 120_000,
    DEPLOY_MAX_CONCURRENT: 2,
    DEPLOY_BUILD_MAX_MEMORY_MB: 1024,
    UPLOAD_DIR: '/tmp/uploads',
    APP_URL: 'http://localhost:3000',
    API_URL: 'http://localhost:3100',
    SOCKET_VERBOSE_LOG: false,
    ALLOWED_CALLBACK_HOSTS: 'http://localhost:3000',
    ENABLE_DESIGN_TELEMETRY_V2: true,
    ENABLE_OPEN_DESIGN_STYLES: true,
    OPEN_DESIGN_STYLE_MAX_INJECT_COUNT: 1,
  })),
}))

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
  class PoolMock {
    query = vi.fn().mockResolvedValue({ rows: [], rowCount: 0 })
    connect = vi.fn()
    end = vi.fn()
    on = vi.fn()
  }
  return { default: { Pool: PoolMock }, Pool: PoolMock }
})
