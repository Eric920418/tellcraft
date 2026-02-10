import { Router, type Router as RouterType } from 'express'
import * as os from 'os'
import * as path from 'path'
import * as fsPromises from 'fs/promises'
import { testConnection, pool } from '../db/client'
import { getLlmConcurrencyStats } from '../services/uiux-generation'
import { getDeployConcurrencyStats } from '../services/deployer'
import { requireAdmin } from '../middleware/auth'

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
        redis: 'connected',
      },
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: String(error),
    })
  }
})

/**
 * GET /health/stats
 * 系統並發狀態監控
 */
router.get('/stats', async (_req, res) => {
  try {
    const memUsage = process.memoryUsage()
    const llmStats = getLlmConcurrencyStats()
    const deployStats = getDeployConcurrencyStats()

    // DB 連接池狀態
    const dbStats = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    }

    // 計算 /tmp 下的 tellcraft-build 目錄數量
    let tmpBuildDirs = 0
    try {
      const tmpEntries = await fsPromises.readdir(os.tmpdir())
      tmpBuildDirs = tmpEntries.filter(e => e.startsWith('tellcraft-build-')).length
    } catch { /* ignore */ }

    res.json({
      timestamp: new Date().toISOString(),
      memory: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      },
      concurrency: {
        llm: llmStats,
        deploy: deployStats,
      },
      database: dbStats,
      tmpBuildDirs,
      uptime: `${Math.round(process.uptime())}s`,
    })
  } catch (error) {
    res.status(500).json({ error: String(error) })
  }
})

/**
 * POST /health/cleanup-tmp
 * 手動清理孤兒 build 目錄（超過 30 分鐘的）
 */
router.post('/cleanup-tmp', requireAdmin, async (_req, res) => {
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

    res.json({ cleaned, remaining: buildDirs.length - cleaned })
  } catch (error) {
    res.status(500).json({ error: String(error) })
  }
})

export default router
