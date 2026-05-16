/**
 * Stripe Webhook 接收端
 *
 * POST /api/stripe/webhook — Stripe 推送付款事件（checkout.session.completed / charge.refunded 等）
 *
 * ⚠️ 關鍵：此路由必須在 src/index.ts 用 express.raw({ type: 'application/json' }) 註冊，
 *         且必須在 express.json() 之前掛載 — Stripe 簽名驗證需要原始 raw bytes，
 *         JSON parse 過的 body 算出來的簽名跟 Stripe 不一樣，永遠 fail。
 *
 * Idempotency：每個 event.id 進 stripe_webhook_events PK，重複事件 ON CONFLICT 跳過。
 */

import { Router, type Router as RouterType } from 'express'
import { createLogger } from '../lib/logger'
import {
  verifyWebhookSignature,
  reserveWebhookEvent,
  markWebhookEventDone,
  markWebhookEventFailed,
  markWebhookEventSkipped,
  handleCheckoutCompleted,
  handleChargeRefunded,
  handlePaymentFailed,
  type CheckoutSessionObject,
  type ChargeRefundedObject,
  type PaymentIntentObject,
} from '../services/stripe-service'

const logger = createLogger('stripe-webhook')
const router: RouterType = Router()

// ============================================================
// POST /api/stripe/webhook
// ============================================================

router.post('/', async (req, res) => {
  // 1. req.body 必須是 Buffer（express.raw 處理過）
  const rawBody = req.body as Buffer
  if (!Buffer.isBuffer(rawBody)) {
    logger.error({ bodyType: typeof rawBody }, 'webhook body 不是 Buffer，檢查 index.ts 是否漏掛 express.raw')
    return res.status(500).json({ error: 'Webhook misconfigured: raw body parser not active' })
  }

  // 2. 驗簽名
  const signature = req.headers['stripe-signature'] as string | undefined
  const verify = await verifyWebhookSignature(rawBody, signature)

  if (!verify.ok) {
    // 配置缺失（secret / SDK）的訊息要區分，但都回 4xx 拒絕（避免 Stripe 認為 endpoint 健康繼續推送）
    if (verify.reason === 'missing_secret' || verify.reason === 'sdk_unavailable') {
      logger.error({ reason: verify.reason }, 'Webhook 配置不全，請設定 STRIPE_WEBHOOK_SECRET 並 pnpm add stripe')
      return res.status(503).json({ error: `Webhook unavailable: ${verify.reason}` })
    }
    logger.warn({ reason: verify.reason, detail: verify.detail }, 'Webhook 簽名驗證失敗（可能是攻擊或 secret 配錯）')
    return res.status(400).json({ error: `Signature verification failed: ${verify.reason}` })
  }

  const event = verify.event

  // 3. Idempotency reserve（先寫紀錄拿鎖，重複 event 直接回 200 不處理）
  const reserved = await reserveWebhookEvent(event.id, event.type, event.data?.object ?? {})
  if (!reserved) {
    logger.info({ eventId: event.id, type: event.type }, '重複的 Stripe event，跳過')
    return res.status(200).json({ received: true, duplicate: true })
  }

  // 4. 先 ACK Stripe（Stripe 要求 webhook 快速回應 < 20s，重邏輯都放 async）
  res.status(200).json({ received: true })

  // 5. 異步處理具體事件
  try {
    let orderId: string | null = null

    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        orderId = await handleCheckoutCompleted(event.data.object as unknown as CheckoutSessionObject)
        break

      case 'charge.refunded':
        orderId = await handleChargeRefunded(event.data.object as unknown as ChargeRefundedObject)
        break

      case 'payment_intent.payment_failed':
      case 'checkout.session.async_payment_failed':
        orderId = await handlePaymentFailed(event.data.object as unknown as PaymentIntentObject)
        break

      default:
        // 其他 event type（subscription / invoice 等）目前不處理但記下
        await markWebhookEventSkipped(event.id)
        logger.debug({ eventId: event.id, type: event.type }, 'Skipped 不處理的 event type')
        return
    }

    await markWebhookEventDone(event.id, orderId)
    logger.info({ eventId: event.id, type: event.type, orderId }, 'Webhook event 處理完成')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error({ err, eventId: event.id, type: event.type }, 'Webhook event 處理失敗')
    // 標記 failed 但 stripe 已經拿到 200，不會 retry —
    // 失敗時要靠 stripe_webhook_events.status='failed' 的監控 cron 抓出來人工處理
    try {
      await markWebhookEventFailed(event.id, msg, null)
    } catch (innerErr) {
      logger.error({ innerErr }, 'markWebhookEventFailed 也失敗')
    }
  }
})

export default router
