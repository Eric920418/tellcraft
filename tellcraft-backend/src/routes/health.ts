import { Router, type Router as RouterType } from 'express'
import { testConnection } from '../db/client'

const router: RouterType = Router()

/**
 * GET /health
 * 健康檢查
 */
router.get('/', async (_req, res) => {
  try {
    const dbConnected = await testConnection()

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: dbConnected ? 'connected' : 'disconnected',
        redis: 'connected', // BullMQ 會自動管理連接
      },
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: String(error),
    })
  }
})

export default router
