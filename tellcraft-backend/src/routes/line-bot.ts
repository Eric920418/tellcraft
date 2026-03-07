// ============================================================
// LINE Bot Webhook 路由
// POST /api/line/webhook — 接收 LINE Platform 推送的事件
//
// 注意：此路由必須在 express.json() 之前註冊
// 因為簽名驗證需要 raw body（express.raw()）
// ============================================================

import { Router, type Router as RouterType } from 'express'
import { validateSignature } from '@line/bot-sdk'
import { handleFollow, handleTextMessage, handlePostback } from '../services/line-bot-handler'
import { createLogger } from '../lib/logger'

const logger = createLogger('line-bot')

const router: RouterType = Router()

const LINE_BOT_CHANNEL_SECRET = process.env.LINE_BOT_CHANNEL_SECRET

// ============================================================
// POST /api/line/webhook
// ============================================================

router.post('/', async (req, res) => {
  // 未配置 → 靜默返回 200（避免 LINE Platform 持續重試）
  if (!LINE_BOT_CHANNEL_SECRET) {
    logger.warn('LINE_BOT_CHANNEL_SECRET not configured, skipping webhook')
    return res.status(200).json({ message: 'ok' })
  }

  try {
    // 1. 簽名驗證
    const signature = req.headers['x-line-signature'] as string
    if (!signature) {
      return res.status(400).json({ error: 'Missing X-Line-Signature' })
    }

    // req.body 是 Buffer（express.raw() 處理的）
    const rawBody = req.body as Buffer
    if (!validateSignature(rawBody, LINE_BOT_CHANNEL_SECRET, signature)) {
      logger.warn('Signature verification failed')
      return res.status(403).json({ error: 'Invalid signature' })
    }

    // 2. 解析事件
    const body = JSON.parse(rawBody.toString('utf-8'))
    const events = body.events || []

    // 3. 立即返回 200（LINE Platform 要求 webhook 快速回應）
    res.status(200).json({ message: 'ok' })

    // 4. 異步處理事件
    for (const event of events) {
      try {
        await routeEvent(event)
      } catch (err) {
        logger.error({ err, event: JSON.stringify(event).substring(0, 200) }, 'Event processing error')
      }
    }
  } catch (err) {
    logger.error({ err }, 'Webhook error')
    // 即使出錯也返回 200，避免 LINE Platform 重試
    if (!res.headersSent) {
      res.status(200).json({ message: 'ok' })
    }
  }
})

// ============================================================
// Event Router
// ============================================================

async function routeEvent(event: {
  type: string
  source?: { type: string; userId: string }
  replyToken?: string
  message?: { type: string; text: string }
  postback?: { data: string }
}): Promise<void> {
  const userId = event.source?.userId
  if (!userId) return

  switch (event.type) {
    case 'follow':
      logger.info({ userId }, 'Follow event')
      if (event.replyToken) {
        await handleFollow(userId, event.replyToken)
      }
      break

    case 'message':
      if (event.message?.type === 'text' && event.replyToken) {
        logger.info({ userId, text: event.message.text.substring(0, 50) }, 'Text message')
        await handleTextMessage(userId, event.message.text, event.replyToken)
      }
      break

    case 'postback':
      if (event.postback?.data && event.replyToken) {
        logger.info({ userId, data: event.postback.data.substring(0, 100) }, 'Postback')
        await handlePostback(userId, event.postback.data, event.replyToken)
      }
      break

    case 'unfollow':
      logger.info({ userId }, 'Unfollow')
      // 可選：清理 line_active_conversations
      break

    default:
      logger.info({ eventType: event.type }, 'Unhandled event type')
  }
}

export default router
