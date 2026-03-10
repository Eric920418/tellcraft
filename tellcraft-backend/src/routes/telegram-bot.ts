// ============================================================
// Telegram Bot Webhook 路由
// POST /api/telegram/webhook
// ============================================================

import { Router, type Router as RouterType } from 'express'
import { routeUpdate } from '../services/telegram-bot-handler'
import { getEnv } from '../lib/env'
import { createLogger } from '../lib/logger'

const logger = createLogger('telegram-bot-route')
const router: RouterType = Router()

router.post('/', (req, res) => {
  const env = getEnv()

  // 驗證 X-Telegram-Bot-Api-Secret-Token header
  const secret = req.headers['x-telegram-bot-api-secret-token']
  if (env.TELEGRAM_WEBHOOK_SECRET && secret !== env.TELEGRAM_WEBHOOK_SECRET) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  // 立即回應 200，Telegram 要求在 5 秒內回應
  res.status(200).json({ ok: true })

  // 異步處理 update
  const update = req.body as Record<string, unknown>
  routeUpdate(update).catch(err => {
    logger.error({ err }, 'routeUpdate error')
  })
})

export default router
