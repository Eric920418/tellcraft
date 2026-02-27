import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { Queue } from 'bullmq'
import Redis from 'ioredis'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import jwt from 'jsonwebtoken'
import * as os from 'os'
import * as path from 'path'
import * as fsPromises from 'fs/promises'

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
import { messagingApi as lineMessagingApi } from '@line/bot-sdk'
import { setAuthRedisClient } from './routes/auth'
import { setMiddlewareRedisClient } from './middleware/auth'

// ============================================================
// 環境變數
// ============================================================

const PORT = parseInt(process.env.PORT || '3100', 10)
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'https://tellcraft.com'

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

// 全域 Rate Limiting（per real client IP via X-Forwarded-For）
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
}))

// LINE Webhook 路由必須在 express.json() 之前註冊（簽名驗證需要 raw body）
app.use('/api/line/webhook', express.raw({ type: 'application/json' }))
app.use('/api/line/webhook', lineBotRoutes)

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
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 5e6,
  connectTimeout: 30000,
})

// Socket.io 認證中間件
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('CRITICAL: JWT_SECRET environment variable is not set!')
}

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

io.on('connection', (socket) => {
  console.log(`[Socket] 連接: ${socket.id} (user: ${socket.data.userId || 'anon:' + socket.data.anonymousId})`)

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
      console.log(`[Socket] ${socket.id} 訂閱對話: ${conversationId}`)
    } catch (err) {
      console.error('[Socket] subscribe error:', err)
      socket.emit('error', { message: 'Subscribe failed' })
    }
  })

  // 取消訂閱
  socket.on('unsubscribe', (conversationId: string) => {
    socket.leave(`conversation:${conversationId}`)
    console.log(`[Socket] ${socket.id} 取消訂閱: ${conversationId}`)
  })

  socket.on('disconnect', () => {
    console.log(`[Socket] 斷開: ${socket.id}`)
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
  console.log('[Redis] 已連接')
})

redis.on('error', (err) => {
  console.error('[Redis] 錯誤:', err)
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
      age: 86400, // 24 小時後刪除
    },
  },
})

// 設置隊列到路由
setOrchestratorQueue(orchestratorQueue)
setRedisClient(redis)

// 初始化 LINE Bot Handler（注入 Messaging Client + 隊列）
if (process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN) {
  const lineMessagingClient = new lineMessagingApi.MessagingApiClient({
    channelAccessToken: process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN,
  })
  initLineBotHandler({
    messagingClient: lineMessagingClient,
    orchestratorQueue,
  })
  console.log('[LINE Bot] Handler 已初始化')
}

// 設置 Redis 到認證模組（用於 token 黑名單）
setAuthRedisClient(redis)
setMiddlewareRedisClient(redis)
setDashboardRedisClient(redis)

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

// 404 處理
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// 錯誤處理
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err)
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
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
      console.log(`[清理] 移除 ${cleaned} 個過期的 build 臨時目錄`)
    }
  } catch (err) {
    console.error('[清理] 清理臨時目錄失敗:', err)
  }
}

// ============================================================
// 啟動服務器
// ============================================================

async function start() {
  console.log('='.repeat(60))
  console.log('  Tellcraft Backend Server')
  console.log('='.repeat(60))

  // 測試資料庫連接
  const dbConnected = await testConnection()
  if (!dbConnected) {
    console.error('[啟動] 資料庫連接失敗，退出')
    process.exit(1)
  }

  // 啟動時清理殘留 build 目錄
  await cleanupOrphanBuildDirs()

  // 每 10 分鐘定時清理
  setInterval(cleanupOrphanBuildDirs, 10 * 60 * 1000)

  // 啟動服務器
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] 運行在 http://0.0.0.0:${PORT}`)
    console.log(`[Server] CORS 來源: ${CORS_ORIGIN}`)
    console.log('='.repeat(60))
  })
}

// ============================================================
// 優雅關閉
// ============================================================

async function shutdown() {
  console.log('\n[關閉] 收到關閉信號...')

  // 關閉 Worker
  await orchestratorWorker.close()
  console.log('[關閉] Worker 已關閉')

  // 關閉隊列
  await orchestratorQueue.close()
  console.log('[關閉] 隊列已關閉')

  // 關閉 Redis
  redis.disconnect()
  console.log('[關閉] Redis 已斷開')

  // 關閉資料庫連接池
  await closePool()
  console.log('[關閉] 資料庫連接池已關閉')

  // 關閉 HTTP 服務器
  server.close(() => {
    console.log('[關閉] HTTP 服務器已關閉')
    process.exit(0)
  })

  // 超時強制退出
  setTimeout(() => {
    console.error('[關閉] 超時，強制退出')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

// 啟動
start().catch((err) => {
  console.error('[啟動] 錯誤:', err)
  process.exit(1)
})
