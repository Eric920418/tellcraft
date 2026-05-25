/**
 * 精細模式 Stripe 整合服務
 *
 * 雙模式設計：
 * - 有 STRIPE_SECRET_KEY → 真實 Stripe Checkout
 * - 缺 STRIPE_SECRET_KEY → mock 模式（前端可 dogfood 整條 funnel，但點付款只會直接跳 success 模擬）
 *
 * 為什麼雙模式：上架前你可以先把前端定價/結帳 UX 跑順，再回頭裝 stripe SDK + Dashboard 配 price ID。
 */

import { randomUUID } from 'crypto'
import { getEnv } from '../lib/env'
import { createLogger } from '../lib/logger'
import { query, queryOne } from '../db/client'
import { notifyOrderPaid, notifyOrderFailed } from './slack-notify'

const logger = createLogger('stripe-service')

// ============================================================
// 商品定價表（與 plan 的 strip-golden-seal.md 對齊）
// ============================================================

/**
 * Tier ID 保留歷史命名（`starter_299` 等含原 USD 價）— 改 id 牽涉 DB CHECK constraint + Stripe
 * metadata 同步太大，id 是技術 key，UI 顯示用實際價即可。
 *
 * 雙幣別計價（plan: 2026-05-16 用戶定價會議）：
 *   USD: $99 / $199 / $399（英文界面實扣）
 *   TWD: NT$3,000 / NT$6,000 / NT$12,000（中文界面實扣）
 *
 * ⚠️ Stripe TWD 是 zero-decimal currency：`unit_amount: 3000` = NT$3,000（不是 3,000,000）
 *    USD 是 two-decimal currency：`unit_amount: 9900` = $99.00
 */
export type PrecisionTier = 'starter_299' | 'standard_599' | 'pro_999'
export type Currency = 'usd' | 'twd'

export interface CurrencyAmount {
  usd: number  // cents（two-decimal currency）
  twd: number  // dollars（zero-decimal currency）
}

export interface TierConfig {
  tier: PrecisionTier
  basePrice: CurrencyAmount
  iterationsTotal: number
  llmCostCapUsd: number          // 內部成本控制統一用 USD（與 llm_usage 表一致）
  buyoutPrice: CurrencyAmount    // 買斷費 = 原價 1.5x
  stripePriceIdUsdEnvKey: 'STRIPE_PRICE_STARTER_USD' | 'STRIPE_PRICE_STANDARD_USD' | 'STRIPE_PRICE_PRO_USD'
  stripePriceIdTwdEnvKey: 'STRIPE_PRICE_STARTER_TWD' | 'STRIPE_PRICE_STANDARD_TWD' | 'STRIPE_PRICE_PRO_TWD'
}

/**
 * 目前對前端開放新購的 tier。2026-05-17 策略改單一 tier，starter/pro 仍保留在 TIER_CONFIG
 * 給舊訂單 join 顯示用，但 catalog / 新 checkout endpoint 都會拒絕。
 */
export const ACTIVE_TIERS: ReadonlySet<PrecisionTier> = new Set(['standard_599'])

export const TIER_CONFIG: Record<PrecisionTier, TierConfig> = {
  starter_299: {
    tier: 'starter_299',
    basePrice: { usd: 9900, twd: 3000 },        // $99 / NT$3,000
    iterationsTotal: 3,
    llmCostCapUsd: 30,                          // 訂單降價後相應下調（原 $50）
    buyoutPrice: { usd: 14900, twd: 4500 },     // $149 / NT$4,500（1.5x）
    stripePriceIdUsdEnvKey: 'STRIPE_PRICE_STARTER_USD',
    stripePriceIdTwdEnvKey: 'STRIPE_PRICE_STARTER_TWD',
  },
  standard_599: {
    tier: 'standard_599',
    // 2026-05-17：策略單一 tier，降價統一 NT$5,000 / $159（取整自 NT$5K÷32≈$156）
    basePrice: { usd: 15900, twd: 5000 },       // $159 / NT$5,000
    iterationsTotal: 8,
    llmCostCapUsd: 60,                          // 訂單價降 → cap 同步降（原 $70）
    buyoutPrice: { usd: 23900, twd: 7500 },     // $239 / NT$7,500（1.5x 取整百）
    stripePriceIdUsdEnvKey: 'STRIPE_PRICE_STANDARD_USD',
    stripePriceIdTwdEnvKey: 'STRIPE_PRICE_STANDARD_TWD',
  },
  pro_999: {
    tier: 'pro_999',
    basePrice: { usd: 39900, twd: 12000 },      // $399 / NT$12,000
    iterationsTotal: 15,
    llmCostCapUsd: 150,                         // 原 $200
    buyoutPrice: { usd: 59900, twd: 18000 },    // $599 / NT$18,000
    stripePriceIdUsdEnvKey: 'STRIPE_PRICE_PRO_USD',
    stripePriceIdTwdEnvKey: 'STRIPE_PRICE_PRO_TWD',
  },
}

// 加購菜單（與 migration 040 對齊；本 PR 先在前端勾選並列入訂單總價，後續真實 module 生成留 W3）
// 加購價同步等比下調，避免 $99 訂單搭 $149 模塊比例失衡
export type AddonType = 'hosting' | 'maintenance' | 'module_blog' | 'module_auth' | 'module_ecommerce' | 'module_forms'

export const ADDON_CONFIG: Record<AddonType, { labelZh: string; labelEn: string; price: CurrencyAmount; recurring?: 'month' }> = {
  hosting: {
    labelZh: '託管月費（hosting + 域名 + uptime）',
    labelEn: 'Hosting (hosting + domain + uptime)',
    price: { usd: 900, twd: 300 },          // $9/月 / NT$300/月
    recurring: 'month',
  },
  maintenance: {
    labelZh: '維護訂閱（無限迭代 + bugfix）',
    labelEn: 'Maintenance (unlimited iterations + bugfix)',
    price: { usd: 1900, twd: 600 },         // $19/月 / NT$600/月
    recurring: 'month',
  },
  module_blog: {
    labelZh: '部落格 / CMS 模塊',
    labelEn: 'Blog / CMS module',
    price: { usd: 4900, twd: 1500 },        // $49 / NT$1,500
  },
  module_auth: {
    labelZh: '會員系統 / Auth 模塊',
    labelEn: 'Member / Auth module',
    price: { usd: 7900, twd: 2500 },        // $79 / NT$2,500
  },
  module_ecommerce: {
    labelZh: '電商 + Stripe 付款模塊',
    labelEn: 'E-commerce + Stripe module',
    price: { usd: 12900, twd: 3900 },       // $129 / NT$3,900
  },
  module_forms: {
    labelZh: '表單 / Newsletter 模塊',
    labelEn: 'Forms / Newsletter module',
    price: { usd: 1900, twd: 600 },         // $19 / NT$600
  },
}

// ============================================================
// Stripe SDK 載入（lazy + optional）
// ============================================================

export interface StripeEvent {
  id: string
  type: string
  data: { object: Record<string, unknown> }
  created: number
}

type StripeLike = {
  checkout: {
    sessions: {
      create: (params: Record<string, unknown>) => Promise<{ id: string; url: string | null; payment_intent?: string | null }>
      retrieve: (id: string) => Promise<{ id: string; payment_status: string; payment_intent?: string | null }>
    }
  }
  customers: {
    create: (params: Record<string, unknown>) => Promise<{ id: string }>
  }
  webhooks: {
    constructEvent: (payload: string | Buffer, signature: string, secret: string) => StripeEvent
  }
}

let _stripeClient: StripeLike | null = null
let _stripeLoadAttempted = false

async function getStripeClient(): Promise<StripeLike | null> {
  if (_stripeLoadAttempted) return _stripeClient
  _stripeLoadAttempted = true

  const secretKey = getEnv().STRIPE_SECRET_KEY
  if (!secretKey) {
    logger.warn('STRIPE_SECRET_KEY 未設定，精細模式 checkout 走 mock 模式（不會真實扣款）')
    return null
  }

  try {
    // 動態 require 避免 `pnpm add stripe` 前 import 失敗
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const StripeCtor = require('stripe').default || require('stripe')
    _stripeClient = new StripeCtor(secretKey, { apiVersion: '2024-06-20' }) as StripeLike
    logger.info('Stripe SDK 初始化成功')
    return _stripeClient
  } catch (err) {
    logger.error({ err }, 'Stripe SDK 載入失敗，請先執行 pnpm add stripe；現走 mock 模式')
    return null
  }
}

// ============================================================
// 訂單建立 + Checkout Session
// ============================================================

export interface CreateCheckoutInput {
  userId: string
  userEmail: string | null
  tier: PrecisionTier
  currency: Currency           // 'usd' (英文) / 'twd' (中文)
  addons: { type: AddonType; quantity?: number }[]
  successUrl: string           // 含 {CHECKOUT_SESSION_ID} placeholder
  cancelUrl: string
}

export interface CreateCheckoutResult {
  orderId: string
  sessionId: string
  checkoutUrl: string
  amountCents: number          // 對應幣別的 unit_amount（USD=cents, TWD=dollars）
  currency: Currency
  isMock: boolean
}

export async function createPrecisionCheckoutSession(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
  const config = TIER_CONFIG[input.tier]
  if (!config) throw new Error(`Unknown tier: ${input.tier}`)
  const currency = input.currency

  // 計算總額（base + 加購）
  const addonRows = input.addons
    .map((a) => {
      const cfg = ADDON_CONFIG[a.type]
      if (!cfg) return null
      const label = currency === 'twd' ? cfg.labelZh : cfg.labelEn
      const amount = cfg.price[currency]
      return { type: a.type, label, amount, recurring: cfg.recurring ?? null, quantity: a.quantity ?? 1 }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  // 一次性付款：base + 非 recurring 加購（recurring 走獨立 subscription 流程，本 PR 不接）
  const baseAmount = config.basePrice[currency]
  const oneTimeAddonAmount = addonRows
    .filter((a) => !a.recurring)
    .reduce((sum, a) => sum + a.amount * a.quantity, 0)
  const totalAmount = baseAmount + oneTimeAddonAmount

  // 寫入 precision_orders（status=pending）
  // ⚠️ amount_cents 欄位語意已變：USD=cents（× 100）/ TWD=dollars（zero-decimal）
  //    後續分析訂單金額時要 join currency 欄位才能正確還原
  const orderId = randomUUID()
  await query(
    `INSERT INTO precision_orders (
       id, user_id, tier, amount_cents, base_amount_cents, currency,
       addons, status, iterations_total, llm_cost_cap_usd
     ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, 'pending', $8, $9)`,
    [
      orderId,
      input.userId,
      input.tier,
      totalAmount,
      baseAmount,
      currency,
      JSON.stringify(addonRows),
      config.iterationsTotal,
      config.llmCostCapUsd,
    ]
  )

  const stripe = await getStripeClient()

  // ── Mock 模式（沒 Stripe SDK / 沒 SECRET_KEY） ──
  if (!stripe) {
    const mockSessionId = `mock_session_${orderId.replace(/-/g, '').slice(0, 16)}`
    await query(
      `UPDATE precision_orders SET stripe_checkout_session_id = $1 WHERE id = $2`,
      [mockSessionId, orderId]
    )
    // mock 直接把 success URL 當作 checkout URL，模擬「立即付款成功」
    const mockCheckoutUrl = input.successUrl.replace('{CHECKOUT_SESSION_ID}', mockSessionId)
    return {
      orderId,
      sessionId: mockSessionId,
      checkoutUrl: mockCheckoutUrl,
      amountCents: totalAmount,
      currency,
      isMock: true,
    }
  }

  // ── 真實 Stripe Checkout ──
  const env = getEnv() as unknown as Record<string, string | undefined>
  const priceIdEnvKey = currency === 'twd' ? config.stripePriceIdTwdEnvKey : config.stripePriceIdUsdEnvKey
  const priceId = env[priceIdEnvKey]

  // 如果 Stripe 上沒配 price，用 price_data 動態建立（建議生產還是配 price ID 比較可控）
  const lineItem = priceId
    ? { price: priceId, quantity: 1 }
    : {
        price_data: {
          currency,
          product_data: { name: `Tellcraft Precision Mode - ${input.tier}` },
          unit_amount: baseAmount,
        },
        quantity: 1,
      }

  const addonLineItems = addonRows
    .filter((a) => !a.recurring)
    .map((a) => ({
      price_data: {
        currency,
        product_data: { name: a.label },
        unit_amount: a.amount,
      },
      quantity: a.quantity,
    }))

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [lineItem, ...addonLineItems],
    customer_email: input.userEmail ?? undefined,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: {
      orderId,
      userId: input.userId,
      tier: input.tier,
      currency,
    },
  })

  if (!session.url) {
    throw new Error('Stripe checkout session 建立成功但缺少 url')
  }

  await query(
    `UPDATE precision_orders SET stripe_checkout_session_id = $1 WHERE id = $2`,
    [session.id, orderId]
  )

  return {
    orderId,
    sessionId: session.id,
    checkoutUrl: session.url,
    amountCents: totalAmount,
    currency,
    isMock: false,
  }
}

// ============================================================
// 買斷 Checkout（W3 第 3 件 — 對既有訂單加購 exported_buyout=true）
// ============================================================

export interface CreateBuyoutInput {
  userId: string
  userEmail: string | null
  orderId: string         // 既有 precision_orders.id
  currency: Currency
  successUrl: string
  cancelUrl: string
}

export interface CreateBuyoutResult {
  sessionId: string
  checkoutUrl: string
  amountCents: number
  currency: Currency
  isMock: boolean
}

export async function createBuyoutCheckoutSession(input: CreateBuyoutInput): Promise<CreateBuyoutResult> {
  // 查訂單拿 tier
  const order = await queryOne<{ id: string; tier: string; user_id: string; exported_buyout: boolean; status: string }>(
    `SELECT id, tier, user_id, exported_buyout, status
     FROM precision_orders
     WHERE id = $1`,
    [input.orderId]
  )
  if (!order) throw new Error(`Order not found: ${input.orderId}`)
  if (order.user_id !== input.userId) throw new Error('Order does not belong to user')
  if (order.exported_buyout) throw new Error('Order already bought out')
  if (!['paid', 'in_progress', 'delivered'].includes(order.status)) {
    throw new Error(`Cannot buyout order in status: ${order.status}`)
  }

  const config = TIER_CONFIG[order.tier as PrecisionTier]
  if (!config) throw new Error(`Unknown tier: ${order.tier}`)

  const buyoutAmount = config.buyoutPrice[input.currency]
  const stripe = await getStripeClient()

  // ── Mock 模式（沒 SDK / 沒 SECRET）── 立即標記 exported_buyout=true，回 mock URL
  if (!stripe) {
    await query(
      `UPDATE precision_orders SET exported_buyout = true WHERE id = $1`,
      [input.orderId]
    )
    const mockSessionId = `mock_buyout_${input.orderId.replace(/-/g, '').slice(0, 16)}`
    const mockUrl = input.successUrl.replace('{CHECKOUT_SESSION_ID}', mockSessionId)
    logger.info({ orderId: input.orderId, currency: input.currency }, 'Mock 買斷立即完成')
    return {
      sessionId: mockSessionId,
      checkoutUrl: mockUrl,
      amountCents: buyoutAmount,
      currency: input.currency,
      isMock: true,
    }
  }

  // ── 真實 Stripe Checkout（買斷無 Price ID，固定用 price_data 動態）──
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: input.currency,
          product_data: {
            name: `Code Buyout - ${order.tier}`,
          },
          unit_amount: buyoutAmount,
        },
        quantity: 1,
      },
    ],
    customer_email: input.userEmail ?? undefined,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: {
      type: 'buyout',         // ← webhook handler 用此分流
      orderId: input.orderId,
      userId: input.userId,
      tier: order.tier,
      currency: input.currency,
    },
  })

  if (!session.url) throw new Error('Stripe buyout checkout 缺 url')

  return {
    sessionId: session.id,
    checkoutUrl: session.url,
    amountCents: buyoutAmount,
    currency: input.currency,
    isMock: false,
  }
}

// ============================================================
// Checkout 狀態查詢（success 頁 polling 用）
// ============================================================

export interface CheckoutStatus {
  orderId: string | null
  status: 'pending' | 'paid' | 'in_progress' | 'delivered' | 'refunded' | 'cancelled' | 'failed'
  isMock: boolean
}

export async function getCheckoutSessionStatus(sessionId: string): Promise<CheckoutStatus> {
  const row = await queryOne<{ id: string; status: string }>(
    `SELECT id, status FROM precision_orders WHERE stripe_checkout_session_id = $1`,
    [sessionId]
  )

  if (!row) {
    return { orderId: null, status: 'pending', isMock: sessionId.startsWith('mock_session_') }
  }

  // Mock 模式：第一次查詢時自動把 pending → paid（模擬付款成功 webhook）
  if (sessionId.startsWith('mock_session_') && row.status === 'pending') {
    await query(
      `UPDATE precision_orders
       SET status = 'paid',
           refund_deadline = NOW() + INTERVAL '14 days'
       WHERE id = $1`,
      [row.id]
    )
    return { orderId: row.id, status: 'paid', isMock: true }
  }

  // 真實模式：可選 fallback 查 Stripe API 確認（webhook 慢的話 DB 還是 pending）
  if (!sessionId.startsWith('mock_session_') && row.status === 'pending') {
    const stripe = await getStripeClient()
    if (stripe) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId)
        if (session.payment_status === 'paid') {
          await query(
            `UPDATE precision_orders
             SET status = 'paid',
                 stripe_payment_intent_id = $2,
                 refund_deadline = NOW() + INTERVAL '14 days'
             WHERE id = $1 AND status = 'pending'`,
            [row.id, session.payment_intent ?? null]
          )
          return { orderId: row.id, status: 'paid', isMock: false }
        }
      } catch (err) {
        logger.warn({ err, sessionId }, 'Stripe session retrieve 失敗，繼續回 DB status')
      }
    }
  }

  return {
    orderId: row.id,
    status: row.status as CheckoutStatus['status'],
    isMock: sessionId.startsWith('mock_session_'),
  }
}

// ============================================================
// 取消（cancel 頁收集原因）
// ============================================================

export async function cancelCheckoutSession(sessionId: string, reason: string | null): Promise<void> {
  await query(
    `UPDATE precision_orders
     SET status = 'cancelled',
         cancellation_reason = $2
     WHERE stripe_checkout_session_id = $1 AND status = 'pending'`,
    [sessionId, reason?.slice(0, 64) ?? null]
  )
}

// ============================================================
// Webhook：簽名驗證 + 事件處理
// ============================================================

export interface VerifyResult {
  ok: true
  event: StripeEvent
}
export interface VerifyError {
  ok: false
  reason: 'missing_secret' | 'missing_signature' | 'invalid_signature' | 'sdk_unavailable'
  detail?: string
}

export async function verifyWebhookSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined
): Promise<VerifyResult | VerifyError> {
  const secret = getEnv().STRIPE_WEBHOOK_SECRET
  if (!secret) return { ok: false, reason: 'missing_secret' }
  if (!signatureHeader) return { ok: false, reason: 'missing_signature' }

  const stripe = await getStripeClient()
  if (!stripe) return { ok: false, reason: 'sdk_unavailable' }

  try {
    const event = stripe.webhooks.constructEvent(rawBody, signatureHeader, secret)
    return { ok: true, event }
  } catch (err) {
    return {
      ok: false,
      reason: 'invalid_signature',
      detail: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * Idempotency 入口：先嘗試 INSERT event_id，成功才繼續處理。
 * @returns true=新事件繼續處理 / false=重複事件已跳過
 */
export async function reserveWebhookEvent(
  eventId: string,
  eventType: string,
  payload: unknown
): Promise<boolean> {
  // ON CONFLICT DO NOTHING + RETURNING 拿不到 row 就是重複
  const rows = await query<{ event_id: string }>(
    `INSERT INTO stripe_webhook_events (event_id, event_type, status, payload)
     VALUES ($1, $2, 'processed', $3::jsonb)
     ON CONFLICT (event_id) DO NOTHING
     RETURNING event_id`,
    [eventId, eventType, JSON.stringify(payload)]
  )
  return rows.rowCount === 1
}

export async function markWebhookEventFailed(eventId: string, error: string, orderId: string | null): Promise<void> {
  await query(
    `UPDATE stripe_webhook_events
     SET status = 'failed', error_message = $2, order_id = $3
     WHERE event_id = $1`,
    [eventId, error.slice(0, 500), orderId]
  )
}

export async function markWebhookEventSkipped(eventId: string): Promise<void> {
  await query(
    `UPDATE stripe_webhook_events
     SET status = 'skipped', processed_at = NOW()
     WHERE event_id = $1`,
    [eventId]
  )
}

export async function markWebhookEventDone(eventId: string, orderId: string | null): Promise<void> {
  await query(
    `UPDATE stripe_webhook_events
     SET processed_at = NOW(), order_id = $2
     WHERE event_id = $1`,
    [eventId, orderId]
  )
}

// ── 事件處理 handlers ──

export interface CheckoutSessionObject {
  id: string
  payment_intent?: string | null
  customer?: string | null
  metadata?: Record<string, string> | null
  amount_total?: number | null
}

/**
 * checkout.session.completed — 付款成功
 * 兩種類型用 metadata.type 區分：
 * - 一般訂單：pending → paid（+ refund_deadline + customer_id 寫回 users）
 * - 買斷加購（metadata.type='buyout'）：UPDATE exported_buyout=true（不動 status）
 */
export async function handleCheckoutCompleted(session: CheckoutSessionObject): Promise<string | null> {
  const sessionId = session.id
  const paymentIntentId = session.payment_intent ?? null
  const customerId = session.customer ?? null
  const orderIdFromMeta = session.metadata?.orderId ?? null
  const userIdFromMeta = session.metadata?.userId ?? null
  const type = session.metadata?.type ?? null

  // ── 買斷加購（W3 第 3 件）──
  if (type === 'buyout' && orderIdFromMeta) {
    const result = await query<{ id: string }>(
      `UPDATE precision_orders
       SET exported_buyout = true
       WHERE id = $1 AND exported_buyout = false
       RETURNING id`,
      [orderIdFromMeta]
    )
    if (result.rowCount === 0) {
      logger.info({ orderId: orderIdFromMeta, sessionId }, '買斷 webhook：訂單已是 bought out 或不存在')
    } else {
      logger.info({ orderId: orderIdFromMeta, sessionId }, '精細模式代碼買斷完成（via webhook）')
    }
    return orderIdFromMeta
  }

  // ── 一般精細模式訂單付款 ──
  // RETURNING 額外帶 tier/amount/currency 給 Slack 通知用，省一次 DB query
  const result = await query<{
    id: string
    user_id: string
    tier: string
    amount_cents: number
    currency: string
  }>(
    `UPDATE precision_orders
     SET status = 'paid',
         stripe_payment_intent_id = $2,
         stripe_customer_id = $3,
         refund_deadline = NOW() + INTERVAL '14 days'
     WHERE stripe_checkout_session_id = $1
       AND status = 'pending'
     RETURNING id, user_id, tier, amount_cents, currency`,
    [sessionId, paymentIntentId, customerId]
  )

  if (result.rowCount === 0) {
    // 已被其他 path 處理（success 頁 polling 也會升級狀態），或 order 不存在
    logger.info({ sessionId, orderIdFromMeta }, 'checkout.session.completed 沒有 pending order 可更新（可能已被 polling 升級）')
    return orderIdFromMeta
  }

  const order = result.rows[0]
  // 同步把 stripe_customer_id 寫回 users 表
  if (customerId && (userIdFromMeta || order.user_id)) {
    await query(
      `UPDATE users SET stripe_customer_id = COALESCE(stripe_customer_id, $1) WHERE id = $2`,
      [customerId, userIdFromMeta ?? order.user_id]
    )
  }

  // W1 ops backstop：Slack 通知工程師 24h 內必須聯絡客戶
  // fire-and-forget — Slack 慢/掛不能拖死 webhook handler
  const userRow = await queryOne<{ email: string | null }>(
    `SELECT email FROM users WHERE id = $1`,
    [order.user_id]
  ).catch(() => null)
  notifyOrderPaid({
    orderId: order.id,
    tier: order.tier,
    amountCents: order.amount_cents,
    currency: order.currency,
    userEmail: userRow?.email ?? null,
  })

  logger.info({ orderId: order.id, sessionId }, '精細模式訂單 paid via webhook + Slack notified')
  return order.id
}

export interface ChargeRefundedObject {
  id: string
  payment_intent?: string | null
  amount_refunded?: number | null
  refunded?: boolean | null
}

/**
 * charge.refunded — 退款（全額或部分）
 * 全額退 → status='refunded' + 凍結 project（保留資料，禁止覆寫 DB 既有資料的全域守則）
 * 部分退 → 暫不處理（plan 未要求部分退款）
 */
export async function handleChargeRefunded(charge: ChargeRefundedObject): Promise<string | null> {
  const paymentIntentId = charge.payment_intent
  if (!paymentIntentId) {
    logger.warn({ chargeId: charge.id }, 'charge.refunded 沒有 payment_intent，無法 lookup order')
    return null
  }

  // 用 payment_intent 反查 order（同時拿 tier/currency/user_id 給 Slack 用）
  const orderRow = await queryOne<{
    id: string
    project_id: string | null
    amount_cents: number
    tier: string
    currency: string
    user_id: string
  }>(
    `SELECT id, project_id, amount_cents, tier, currency, user_id
     FROM precision_orders WHERE stripe_payment_intent_id = $1`,
    [paymentIntentId]
  )
  if (!orderRow) {
    logger.warn({ paymentIntentId }, '退款找不到對應的 precision_order')
    return null
  }

  // 只處理全額退款（amount_refunded == amount_total）
  const isFullRefund = charge.refunded === true || charge.amount_refunded === orderRow.amount_cents
  if (!isFullRefund) {
    logger.info(
      { orderId: orderRow.id, amountRefunded: charge.amount_refunded, amountTotal: orderRow.amount_cents },
      '部分退款，暫不修改 order 狀態'
    )
    return orderRow.id
  }

  await query(
    `UPDATE precision_orders
     SET status = 'refunded'
     WHERE id = $1 AND status IN ('paid', 'in_progress', 'delivered')`,
    [orderRow.id]
  )

  // W1 ops backstop：退款也通知，工程師可能要解除 hosting / 取消處理中工作
  const userRow = await queryOne<{ email: string | null }>(
    `SELECT email FROM users WHERE id = $1`,
    [orderRow.user_id]
  ).catch(() => null)
  notifyOrderFailed({
    orderId: orderRow.id,
    tier: orderRow.tier,
    amountCents: orderRow.amount_cents,
    currency: orderRow.currency,
    userEmail: userRow?.email ?? null,
    projectId: orderRow.project_id,
    reason: 'refunded (全額)',
  })

  logger.info({ orderId: orderRow.id, projectId: orderRow.project_id }, '訂單退款完成（project 保留資料但凍結）+ Slack notified')
  return orderRow.id
}

export interface PaymentIntentObject {
  id: string
  last_payment_error?: { message?: string } | null
}

/**
 * payment_intent.payment_failed — 信用卡被拒等扣款失敗
 */
export async function handlePaymentFailed(intent: PaymentIntentObject): Promise<string | null> {
  const orderRow = await queryOne<{
    id: string
    tier: string
    amount_cents: number
    currency: string
    user_id: string
  }>(
    `SELECT id, tier, amount_cents, currency, user_id
     FROM precision_orders WHERE stripe_payment_intent_id = $1`,
    [intent.id]
  )
  if (!orderRow) return null

  const reason = intent.last_payment_error?.message?.slice(0, 64) ?? 'payment_failed'
  await query(
    `UPDATE precision_orders
     SET status = 'failed',
         cancellation_reason = $2
     WHERE id = $1 AND status = 'pending'`,
    [orderRow.id, reason]
  )

  // 通常付款失敗用戶看得到 Stripe Checkout 錯誤訊息，工程師不一定要介入，
  // 但累計多次失敗 = 可能信用卡風控 / Stripe 設定問題，要 ops 注意
  const userRow = await queryOne<{ email: string | null }>(
    `SELECT email FROM users WHERE id = $1`,
    [orderRow.user_id]
  ).catch(() => null)
  notifyOrderFailed({
    orderId: orderRow.id,
    tier: orderRow.tier,
    amountCents: orderRow.amount_cents,
    currency: orderRow.currency,
    userEmail: userRow?.email ?? null,
    reason,
  })

  return orderRow.id
}
