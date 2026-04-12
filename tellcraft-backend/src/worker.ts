// ============================================================
// Tellcraft Worker Process — BullMQ Worker 獨立進程
// 不跑 HTTP Server / Socket.io Server，用 Redis Emitter 推送消息
// ============================================================

import 'dotenv/config'

import { validateEnv, getEnv } from './lib/env'
validateEnv()

import { QueueEvents } from 'bullmq'
import Redis, { type RedisOptions } from 'ioredis'
import * as os from 'os'
import * as path from 'path'
import * as fsPromises from 'fs/promises'
import { Emitter } from '@socket.io/redis-emitter'

import { createOrchestratorWorker } from './workers/orchestrator'
import { testConnection, closePool } from './db/client'
import { scanAndRecoverStuckFlowStates } from './services/flowstate-recovery'
import { runStartupCodeRepair } from './services/code-repair'
import { createLogger } from './lib/logger'

const logger = createLogger('worker')

// ============================================================
// 環境變數
// ============================================================

const env = getEnv()
const REDIS_URL = env.REDIS_URL

// ============================================================
// Redis 連線
// ============================================================

function createRedisConnection(name: string, overrides: Partial<RedisOptions> = {}): Redis {
  const conn = new Redis(REDIS_URL, {
    retryStrategy: (times) => Math.min(times * 50, 2000),
    enableReadyCheck: true,
    keepAlive: 30000,
    connectTimeout: 10000,
    ...overrides,
  })
  conn.on('connect', () => logger.info(`Redis [${name}] 已連接`))
  conn.on('error', (err) => logger.error({ err }, `Redis [${name}] 錯誤`))
  return conn
}

// Worker 連線 — BullMQ Worker 專用（阻塞命令，maxRetriesPerRequest: null）
const workerRedis = createRedisConnection('worker', { maxRetriesPerRequest: null })
// QueueEvents 連線 — 事件監聽專用（阻塞命令）
const eventsRedis = createRedisConnection('events', { maxRetriesPerRequest: null })
// 通用連線 — FlowState/lock/cache/rate-limit（業務邏輯）
const generalRedis = createRedisConnection('general', { maxRetriesPerRequest: 3 })
// Emitter 連線 — @socket.io/redis-emitter 專用
const emitterRedis = createRedisConnection('emitter')

// ============================================================
// Socket.io Redis Emitter（取代 Socket.io Server）
// Worker 進程不跑 HTTP Server，用 Emitter 透過 Redis 推送消息
// HTTP 進程的 Socket.io Server（裝了 @socket.io/redis-adapter）會收到並轉發
// ============================================================

const emitter = new Emitter(emitterRedis)

// ============================================================
// BullMQ Worker + QueueEvents
// ============================================================

const orchestratorWorker = createOrchestratorWorker(workerRedis, generalRedis, emitter)

const queueEvents = new QueueEvents('orchestrator', { connection: eventsRedis })
queueEvents.on('stalled', ({ jobId }) => {
  logger.warn({ jobId }, '[STALLED] Job stalled — 可能 event loop 阻塞')
})
queueEvents.on('error', (err) => {
  logger.error({ err }, 'QueueEvents error')
})

// 啟動清理：刪除上次程序崩潰/重啟留下的孤立 lock
Promise.all([
  generalRedis.keys('conv-lock:*'),
  generalRedis.keys('user-active:*'),
  generalRedis.keys('flow:activity:*'),
]).then(async ([staleConvLocks, staleUserLocks, staleActivity]) => {
  const stale = [...staleConvLocks, ...staleUserLocks, ...staleActivity]
  if (stale.length > 0) {
    await generalRedis.del(...stale)
    logger.warn({
      convLocks: staleConvLocks.length,
      userLocks: staleUserLocks.length,
      activityKeys: staleActivity.length,
    }, '啟動清理：刪除殘留鎖和心跳')
  }
}).catch((err) => logger.error({ err }, '啟動清理失敗'))

// ============================================================
// 臨時目錄清理（build/test 殘留）
// ============================================================

async function cleanupOrphanBuildDirs() {
  try {
    const tmpDir = os.tmpdir()
    const entries = await fsPromises.readdir(tmpDir)
    const buildDirs = entries.filter(e => e.startsWith('tellcraft-build-') || e.startsWith('tellcraft-test-'))
    const thirtyMinAgo = Date.now() - 30 * 60 * 1000
    let cleaned = 0

    for (const dir of buildDirs) {
      try {
        const fullPath = path.join(tmpDir, dir)
        const stat = await fsPromises.stat(fullPath)
        if (stat.mtimeMs < thirtyMinAgo) {
          await fsPromises.rm(fullPath, { recursive: true, force: true })
          cleaned++
        }
      } catch { /* skip */ }
    }

    if (cleaned > 0) {
      logger.info({ cleaned }, '移除過期的臨時目錄')
    }
  } catch (err) {
    logger.error({ err }, '清理臨時目錄失敗')
  }
}

// ============================================================
// 啟動
// ============================================================

async function start() {
  logger.info('='.repeat(60))
  logger.info('Tellcraft Worker Process')
  logger.info('='.repeat(60))

  // 測試資料庫連接
  const dbConnected = await testConnection()
  if (!dbConnected) {
    logger.error('資料庫連接失敗，退出')
    process.exit(1)
  }

  // 清理殘留 build 目錄
  await cleanupOrphanBuildDirs()
  setInterval(cleanupOrphanBuildDirs, 10 * 60 * 1000)

  // 每 2 分鐘掃描超時的 FlowState 並自動恢復
  setInterval(() => {
    scanAndRecoverStuckFlowStates(generalRedis, emitter).catch(err => {
      logger.error({ err }, 'FlowState Recovery 掃描失敗')
    })
  }, 2 * 60 * 1000)

  // 啟動時一次性修復舊代碼
  runStartupCodeRepair(generalRedis).catch(err =>
    logger.error({ err }, 'startup code repair 失敗')
  )

  logger.info('Worker 就緒，等待 Job...')
  logger.info('='.repeat(60))

  // pm2 ready 信號
  if (typeof process.send === 'function') process.send('ready')
}

// ============================================================
// 優雅關閉
// ============================================================

async function shutdown() {
  logger.info('收到關閉信號...')

  // 清理 flow:activity keys
  try {
    const activityKeys = await generalRedis.keys('flow:activity:*')
    if (activityKeys.length > 0) {
      await generalRedis.del(...activityKeys)
      logger.info({ count: activityKeys.length }, '關閉時清理 flow:activity keys')
    }
  } catch { /* 不影響關閉 */ }

  // 關閉 Worker（等待進行中 jobs 完成）
  await orchestratorWorker.close()
  logger.info('Worker 已關閉')

  // 關閉 QueueEvents
  await queueEvents.close()
  logger.info('QueueEvents 已關閉')

  // 關閉所有 Redis 連線
  workerRedis.disconnect()
  eventsRedis.disconnect()
  generalRedis.disconnect()
  emitterRedis.disconnect()
  logger.info('Redis 已斷開（4 連線）')

  // 關閉 LangGraph checkpointer（如果初始化過）
  try {
    const { shutdownCheckpointer } = await import('./graph/checkpointer')
    await shutdownCheckpointer()
    logger.info('LangGraph checkpointer 已關閉')
  } catch { /* checkpointer 可能未初始化 */ }

  // 關閉資料庫連接池
  await closePool()
  logger.info('資料庫連接池已關閉')

  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

start().catch((err) => {
  logger.error({ err }, '啟動錯誤')
  process.exit(1)
})
