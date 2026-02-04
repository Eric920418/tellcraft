import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { Queue } from 'bullmq'
import Redis from 'ioredis'
import cors from 'cors'

import { testConnection, closePool } from './db/client'
import { createOrchestratorWorker } from './workers/orchestrator'
import conversationRoutes, { setOrchestratorQueue } from './routes/conversation'
import projectRoutes from './routes/project'
import healthRoutes from './routes/health'
import authRoutes from './routes/auth'
import dashboardRoutes from './routes/dashboard'
import sessionRoutes from './routes/session'
import userRoutes from './routes/user'

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

// CORS 配置
app.use(cors({
  origin: CORS_ORIGIN.split(','),
  credentials: true,
}))

app.use(express.json())

// ============================================================
// Socket.io
// ============================================================

const io = new SocketIOServer(server, {
  cors: {
    origin: CORS_ORIGIN.split(','),
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})

io.on('connection', (socket) => {
  console.log(`[Socket] 連接: ${socket.id}`)

  // 訂閱對話
  socket.on('subscribe', (conversationId: string) => {
    socket.join(`conversation:${conversationId}`)
    console.log(`[Socket] ${socket.id} 訂閱對話: ${conversationId}`)
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

// 創建 Worker
const orchestratorWorker = createOrchestratorWorker(redis, io)

// ============================================================
// 路由
// ============================================================

app.use('/health', healthRoutes)
app.use('/auth', authRoutes)
app.use('/api/conversation', conversationRoutes)
app.use('/api/project', projectRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/session', sessionRoutes)
app.use('/api/user', userRoutes)

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
