import 'dotenv/config'

// 環境變數驗證（必須在所有其他 import 之前）
import { validateEnv, getEnv } from './lib/env'
validateEnv()

import express from 'express'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { Queue } from 'bullmq'
import Redis from 'ioredis'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import jwt from 'jsonwebtoken'
import * as os from 'os'
import * as path from 'path'
import * as fsPromises from 'fs/promises'

import { spawn, type ChildProcessWithoutNullStreams } from 'child_process'
import { testConnection, closePool } from './db/client'
import { createOrchestratorWorker } from './workers/orchestrator'
import conversationRoutes, { setOrchestratorQueue, setRedisClient } from './routes/conversation'
import projectRoutes from './routes/project'
import healthRoutes from './routes/health'
import authRoutes from './routes/auth'
import dashboardRoutes, { setDashboardRedisClient } from './routes/dashboard'
import sessionRoutes from './routes/session'
import userRoutes from './routes/user'
import templatesRoutes from './routes/templates'
import bddRoutes from './routes/bdd'
import operationsRoutes from './routes/operations'
import uploadRoutes from './routes/upload'
import lineBotRoutes from './routes/line-bot'
import { initLineBotHandler } from './services/line-bot-handler'
import telegramBotRoutes from './routes/telegram-bot'
import { initTelegramBotHandler } from './services/telegram-bot-handler'
import { cleanupExpiredGuestUsers } from './services/guest-cleanup'
import { resetExpiredCredits } from './services/credit-reset'
import { scanAndRecoverStuckFlowStates } from './services/flowstate-recovery'
import {
  recordSocketConnected,
  recordSocketDisconnected,
  recordSocketEngineError,
} from './services/socket-metrics'
import { messagingApi as lineMessagingApi } from '@line/bot-sdk'
import { setAuthRedisClient } from './routes/auth'
import { parseLogLine, sanitizeLogLine } from './utils/log-parser'
import { setMiddlewareRedisClient } from './middleware/auth'
import { setCacheRedisClient } from './lib/cache'
import { createLogger } from './lib/logger'

const logger = createLogger('server')

// ============================================================
// 環境變數（從已驗證的 env 取得）
// ============================================================

const env = getEnv()
const PORT = env.PORT
const REDIS_URL = env.REDIS_URL
const CORS_ORIGIN = env.CORS_ORIGIN
const SOCKET_VERBOSE_LOG = env.SOCKET_VERBOSE_LOG
const UPLOAD_DIR = env.UPLOAD_DIR

// ============================================================
// Express 應用
// ============================================================

const app = express()
const server = createServer(app)

// 信任 Vercel proxy 的 X-Forwarded-For header，按真實用戶 IP 做 rate limiting
app.set('trust proxy', 1)

// 安全標頭
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}))

// CORS 配置
app.use(cors({
  origin: CORS_ORIGIN.split(','),
  credentials: true,
}))

// 全域 Rate Limiting（per user ID 或 IP）
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 500,
  // Avoid counting Socket.IO handshake traffic into HTTP API quota.
  skip: (req) => req.path.startsWith('/socket.io/'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
  keyGenerator: (req) => {
    try {
      const auth = req.headers.authorization || ''
      const token = auth.replace('Bearer ', '')
      if (token) {
        const decoded = jwt.decode(token) as { sub?: string } | null
        if (decoded?.sub) return `user:${decoded.sub}`
      }
    } catch {}
    return ipKeyGenerator(req.ip ?? req.socket.remoteAddress ?? '127.0.0.1')
  },
}))

// LINE Webhook 路由必須在 express.json() 之前註冊（簽名驗證需要 raw body）
app.use('/api/line/webhook', express.raw({ type: 'application/json' }))
app.use('/api/line/webhook', lineBotRoutes)

// Telegram Webhook 路由（JSON 格式，使用 header secret 驗證）
app.use('/api/telegram/webhook', express.json())
app.use('/api/telegram/webhook', telegramBotRoutes)

app.use(express.json({ limit: '50mb' }))

// ============================================================
// Socket.io
// ============================================================

const io = new SocketIOServer(server, {
  cors: {
    origin: CORS_ORIGIN.split(','),
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  // Disable compression to reduce CPU spikes under high concurrent sockets.
  perMessageDeflate: false,
  httpCompression: false,
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 5e6,
  connectTimeout: 30000,
})

// Socket.io 認證中間件
const JWT_SECRET = env.JWT_SECRET

io.use((socket, next) => {
  const token = socket.handshake.auth?.token
  const anonymousId = socket.handshake.auth?.anonymousId

  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { sub: string }
      socket.data.userId = payload.sub
      return next()
    } catch {
      return next(new Error('Invalid token'))
    }
  }

  if (anonymousId && typeof anonymousId === 'string') {
    socket.data.anonymousId = anonymousId
    return next()
  }

  return next(new Error('Authentication required'))
})

io.engine.on('connection_error', (err) => {
  const reason = err.message || err.code || 'engine_connection_error'
  recordSocketEngineError(String(reason))
  logger.warn({ reason }, 'Engine connection_error')
})

io.on('connection', (socket) => {
  recordSocketConnected()
  if (SOCKET_VERBOSE_LOG) {
    logger.info({ socketId: socket.id, userId: socket.data.userId || 'anon:' + socket.data.anonymousId }, '連接')
  }

  // 訂閱對話（含所有權驗證）
  socket.on('subscribe', async (conversationId: string) => {
    try {
      // 查 conversation → project → user_id
      const conv = await import('./db/client').then(db =>
        db.queryOne<{ project_id: string }>(
          'SELECT project_id FROM conversations WHERE id = $1',
          [conversationId]
        )
      )
      if (!conv) {
        socket.emit('error', { message: 'Conversation not found' })
        return
      }

      const project = await import('./db/client').then(db =>
        db.queryOne<{ user_id: string }>(
          'SELECT user_id FROM projects WHERE id = $1',
          [conv.project_id]
        )
      )
      if (!project) {
        socket.emit('error', { message: 'Project not found' })
        return
      }

      // 驗證所有權
      if (socket.data.userId) {
        if (project.user_id !== socket.data.userId) {
          socket.emit('error', { message: 'Access denied' })
          return
        }
      } else if (socket.data.anonymousId) {
        // 匿名用戶：查 user email 是否匹配 anonymousId
        const user = await import('./db/client').then(db =>
          db.queryOne<{ email: string }>(
            'SELECT email FROM users WHERE id = $1',
            [project.user_id]
          )
        )
        if (!user || user.email !== `anon_${socket.data.anonymousId}@tellcraft.local`) {
          socket.emit('error', { message: 'Access denied' })
          return
        }
      }

      socket.join(`conversation:${conversationId}`)
      if (SOCKET_VERBOSE_LOG) {
        logger.info({ socketId: socket.id, conversationId }, '訂閱對話')
      }
    } catch (err) {
      logger.error({ err }, 'Subscribe error')
      socket.emit('error', { message: 'Subscribe failed' })
    }
  })

  // 取消訂閱
  socket.on('unsubscribe', (conversationId: string) => {
    socket.leave(`conversation:${conversationId}`)
    if (SOCKET_VERBOSE_LOG) {
      logger.info({ socketId: socket.id, conversationId }, '取消訂閱')
    }
  })

  // ====== Admin Log Streaming ======
  let tailProcess: ChildProcessWithoutNullStreams | null = null

  socket.on('subscribe_admin_logs', async (options?: { source?: 'all' | 'out' | 'error' }) => {
    try {
      // 驗證 admin 身份（查 DB，不信任 JWT payload）
      if (!socket.data.userId) {
        socket.emit('error', { message: 'Authentication required' })
        return
      }

      const { queryOne: dbQueryOne } = await import('./db/client')
      const adminCheck = await dbQueryOne<{ is_admin: boolean }>(
        'SELECT is_admin FROM users WHERE id = $1',
        [socket.data.userId]
      )

      if (!adminCheck?.is_admin) {
        socket.emit('error', { message: 'Admin required' })
        return
      }

      // 清除之前的 tail 進程
      if (tailProcess) {
        tailProcess.kill()
        tailProcess = null
      }

      const source = options?.source || 'all'
      const LOG_FILES = {
        out: '/var/log/tellcraft/out.log',
        error: '/var/log/tellcraft/error.log',
      }
      const files = source === 'all'
        ? [LOG_FILES.out, LOG_FILES.error]
        : [LOG_FILES[source as keyof typeof LOG_FILES] || LOG_FILES.out]

      // tail -F 支援 logrotate，-n 0 不讀歷史（歷史由 HTTP API 提供）
      tailProcess = spawn('tail', ['-F', '-n', '0', ...files])

      tailProcess.stdout.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n').filter(Boolean)
        for (const line of lines) {
          const parsed = parseLogLine(line, 'out')
          const sanitized = sanitizeLogLine(parsed)
          socket.emit('admin_log_line', sanitized)
        }
      })

      tailProcess.stderr.on('data', (data: Buffer) => {
        const errMsg = data.toString()
        // tail -F 在檔案不存在時輸出警告到 stderr，忽略這些
        if (!errMsg.includes('has become inaccessible') && !errMsg.includes('No such file')) {
          logger.error({ stderr: errMsg }, 'Tail stderr')
        }
      })

      tailProcess.on('close', () => {
        tailProcess = null
      })

      if (SOCKET_VERBOSE_LOG) {
        logger.info({ socketId: socket.id, source }, '訂閱 admin logs')
      }
      socket.emit('admin_logs_subscribed', { source })
    } catch (err) {
      logger.error({ err }, 'subscribe_admin_logs error')
      socket.emit('error', { message: 'Failed to subscribe to logs' })
    }
  })

  socket.on('unsubscribe_admin_logs', () => {
    if (tailProcess) {
      tailProcess.kill()
      tailProcess = null
    }
    if (SOCKET_VERBOSE_LOG) {
      logger.info({ socketId: socket.id }, '取消訂閱 admin logs')
    }
  })

  socket.on('disconnect', () => {
    recordSocketDisconnected()
    // 清除 tail 進程
    if (tailProcess) {
      tailProcess.kill()
      tailProcess = null
    }
    if (SOCKET_VERBOSE_LOG) {
      logger.info({ socketId: socket.id }, '斷開')
    }
  })
})

// ============================================================
// Redis 和 BullMQ
// ============================================================

const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // BullMQ 要求
  retryStrategy: (times) => Math.min(times * 50, 2000),
  enableReadyCheck: true,
  keepAlive: 30000,
  connectTimeout: 10000,
})

redis.on('connect', () => {
  logger.info('Redis 已連接')
})

redis.on('error', (err) => {
  logger.error({ err }, 'Redis 錯誤')
})

// BullMQ 隊列
const orchestratorQueue = new Queue('orchestrator', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600, // 1 小時後刪除
      count: 1000,
    },
    removeOnFail: {
      age: 604800, // 7 天後刪除
    },
  },
})

// 設置隊列到路由
setOrchestratorQueue(orchestratorQueue)
setRedisClient(redis)

// 初始化 LINE Bot Handler（注入 Messaging Client + 隊列）
if (env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN) {
  const lineMessagingClient = new lineMessagingApi.MessagingApiClient({
    channelAccessToken: env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN,
  })
  initLineBotHandler({
    messagingClient: lineMessagingClient,
    orchestratorQueue,
  })
  logger.info('LINE Bot Handler 已初始化')
}

// 初始化 Telegram Bot Handler（注入 Bot Token + 隊列）
if (env.TELEGRAM_BOT_TOKEN) {
  initTelegramBotHandler({
    botToken: env.TELEGRAM_BOT_TOKEN,
    orchestratorQueue,
  })
  logger.info('Telegram Bot Handler 已初始化')
}

// 設置 Redis 到認證模組（用於 token 黑名單）
setAuthRedisClient(redis)
setMiddlewareRedisClient(redis)
setDashboardRedisClient(redis)
setCacheRedisClient(redis)

// 啟動清理：刪除上次程序崩潰/重啟留下的孤立 lock
// 安全：單一實例部署，啟動時不可能有活躍 Worker，所有鎖皆為殘留
// fire-and-forget，不阻塞 Worker 啟動
Promise.all([
  redis.keys('conv-lock:*'),
  redis.keys('user-active:*'),
  redis.keys('flow:activity:*'),
]).then(async ([staleConvLocks, staleUserLocks, staleActivity]) => {
  const stale = [...staleConvLocks, ...staleUserLocks, ...staleActivity]
  if (stale.length > 0) {
    await redis.del(...stale)
    logger.warn({
      convLocks: staleConvLocks.length,
      userLocks: staleUserLocks.length,
      activityKeys: staleActivity.length,
    }, '啟動清理：刪除殘留鎖和心跳')
  }
}).catch((err) => logger.error({ err }, '啟動清理失敗'))

// 創建 Worker
const orchestratorWorker = createOrchestratorWorker(redis, io)

// ============================================================
// 路由
// ============================================================

app.use('/health', healthRoutes)

// 認證端點 rate limiting（/me 每次頁面載入都會呼叫，需要較寬鬆的限制）
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth requests, please try again later' },
})
app.use('/auth', authRateLimit, authRoutes)
app.use('/api/conversation', conversationRoutes)
app.use('/api/project', projectRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/session', sessionRoutes)
app.use('/api/user', userRoutes)
app.use('/api/templates', templatesRoutes)
app.use('/api/bdd', bddRoutes)
app.use('/api/operations', operationsRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/uploads/tellcraft', (req, res, next) => {
  if (!/\.(jpe?g|png|webp|gif|svg)$/i.test(req.path)) {
    res.status(403).json({ error: 'Forbidden file type' })
    return
  }
  next()
}, express.static(UPLOAD_DIR, {
  immutable: true,
  maxAge: '30d',
  fallthrough: false,
}))

// 404 處理
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// 錯誤處理
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, 'Unhandled error')
  res.status(500).json({
    error: 'Internal server error',
    message: env.NODE_ENV === 'development' ? err.message : undefined,
  })
})

// ============================================================
// /tmp 孤兒 build 目錄清理
// ============================================================

async function cleanupOrphanBuildDirs() {
  try {
    const tmpDir = os.tmpdir()
    const entries = await fsPromises.readdir(tmpDir)
    const buildDirs = entries.filter(e => e.startsWith('tellcraft-build-'))
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
      logger.info({ cleaned }, '移除過期的 build 臨時目錄')
    }
  } catch (err) {
    logger.error({ err }, '清理臨時目錄失敗')
  }
}

// ============================================================
// 啟動服務器
// ============================================================

async function start() {
  logger.info('='.repeat(60))
  logger.info('Tellcraft Backend Server')
  logger.info('='.repeat(60))

  // 測試資料庫連接
  const dbConnected = await testConnection()
  if (!dbConnected) {
    logger.error('資料庫連接失敗，退出')
    process.exit(1)
  }

  // 啟動時清理殘留 build 目錄
  await cleanupOrphanBuildDirs()

  // 每 10 分鐘定時清理
  setInterval(cleanupOrphanBuildDirs, 10 * 60 * 1000)

  // 每 2 分鐘掃描超時的 FlowState 並自動恢復
  setInterval(() => {
    scanAndRecoverStuckFlowStates(redis, io).catch(err => {
      logger.error({ err }, 'FlowState Recovery 掃描失敗')
    })
  }, 2 * 60 * 1000)

  // 訪客資料清理：啟動 30 秒後執行一次，之後每 6 小時執行
  setTimeout(() => cleanupExpiredGuestUsers(redis).catch(err => {
    logger.error({ err }, '訪客清理 啟動清理失敗')
  }), 30 * 1000)
  setInterval(() => cleanupExpiredGuestUsers(redis).catch(err => {
    logger.error({ err }, '訪客清理 定時清理失敗')
  }), 6 * 60 * 60 * 1000)

  // Credit 月重置：啟動 60 秒後執行一次，之後每 1 小時執行
  setTimeout(() => resetExpiredCredits().catch(err => {
    logger.error({ err }, 'Credit Reset 啟動重置失敗')
  }), 60 * 1000)
  setInterval(() => resetExpiredCredits().catch(err => {
    logger.error({ err }, 'Credit Reset 定時重置失敗')
  }), 60 * 60 * 1000)

  // 啟動服務器
  server.listen(PORT, '0.0.0.0', () => {
    logger.info({ port: PORT }, '運行在 http://0.0.0.0')
    logger.info({ corsOrigin: CORS_ORIGIN }, 'CORS 來源')
    logger.info('='.repeat(60))
    // pm2 reload 需要此信號才知道新進程就緒，才會關閉舊進程
    if (typeof process.send === 'function') process.send('ready')
  })
}

// ============================================================
// 優雅關閉
// ============================================================

async function shutdown() {
  logger.info('收到關閉信號...')

  // 清理 flow:activity keys（進程死後心跳不應殘留）
  try {
    const activityKeys = await redis.keys('flow:activity:*')
    if (activityKeys.length > 0) {
      await redis.del(...activityKeys)
      logger.info({ count: activityKeys.length }, '關閉時清理 flow:activity keys')
    }
  } catch { /* 不影響關閉 */ }

  // 關閉 Worker
  await orchestratorWorker.close()
  logger.info('Worker 已關閉')

  // 關閉隊列
  await orchestratorQueue.close()
  logger.info('隊列已關閉')

  // 關閉 Redis
  redis.disconnect()
  logger.info('Redis 已斷開')

  // 關閉資料庫連接池
  await closePool()
  logger.info('資料庫連接池已關閉')

  // 關閉 HTTP 服務器
  server.close(() => {
    logger.info('HTTP 服務器已關閉')
    process.exit(0)
  })

  // 超時強制退出（85s，比 PM2 kill_timeout 90s 早 5s，確保日誌能寫出）
  setTimeout(() => {
    logger.error('超時，強制退出')
    process.exit(1)
  }, 85000)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

// 啟動
start().catch((err) => {
  logger.error({ err }, '啟動錯誤')
  process.exit(1)
})
