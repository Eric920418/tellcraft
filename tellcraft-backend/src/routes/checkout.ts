/**
 * 精細模式 Checkout API
 *
 * POST /api/checkout/precision           — 建立 checkout session（pending order）
 * GET  /api/checkout/precision/status    — 查詢 session 狀態（success 頁 polling）
 * POST /api/checkout/precision/cancel    — 用戶取消，收集 cancellation_reason
 *
 * 真實 Stripe webhook（payment_intent.succeeded / refund）尚未實作，留待 W1 後段。
 * 目前 mock 模式：呼叫 status 時自動把 pending → paid，前端可 dogfood 整條 funnel。
 */

import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { createLogger } from '../lib/logger'
import {
  createPrecisionCheckoutSession,
  getCheckoutSessionStatus,
  cancelCheckoutSession,
  TIER_CONFIG,
  ADDON_CONFIG,
  type PrecisionTier,
  type AddonType,
} from '../services/stripe-service'

const logger = createLogger('checkout')
const router: Router = Router()

// ============================================================
// 公開：tier + addon 元資料（前端定價頁 / pay 頁 fetch）
// ============================================================

router.get('/catalog', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      tiers: Object.values(TIER_CONFIG).map((t) => ({
        tier: t.tier,
        basePriceCents: t.basePriceCents,
        iterationsTotal: t.iterationsTotal,
        buyoutPriceCents: t.buyoutPriceCents,
      })),
      addons: Object.entries(ADDON_CONFIG).map(([type, cfg]) => ({
        type,
        label: cfg.label,
        priceCents: cfg.priceCents,
        recurring: cfg.recurring ?? null,
      })),
    },
  })
})

// ============================================================
// POST /api/checkout/precision
// Body: { tier, addons: [{ type }], locale }
// ============================================================

router.post('/precision', requireAuth, async (req: Request, res: Response) => {
  try {
    const { tier, addons, locale } = req.body as {
      tier?: string
      addons?: { type: string }[]
      locale?: string
    }

    if (!tier || !(tier in TIER_CONFIG)) {
      res.status(400).json({
        success: false,
        error: `無效的檔位：${tier}。可選：${Object.keys(TIER_CONFIG).join(', ')}`,
      })
      return
    }

    const validatedAddons: { type: AddonType }[] = []
    for (const a of addons ?? []) {
      if (a.type in ADDON_CONFIG) {
        validatedAddons.push({ type: a.type as AddonType })
      } else {
        res.status(400).json({
          success: false,
          error: `無效的加購項目：${a.type}。可選：${Object.keys(ADDON_CONFIG).join(', ')}`,
        })
        return
      }
    }

    // 組 success / cancel URL（前端 origin 從 APP_URL，locale 從 body）
    const appUrl = process.env.APP_URL || 'https://tellcraft.com'
    const localePrefix = locale && locale !== 'en' ? `/${locale}` : ''
    // Stripe 會把 {CHECKOUT_SESSION_ID} 替換成真實 session id
    const successUrl = `${appUrl}${localePrefix}/pay/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${appUrl}${localePrefix}/pay/cancel?session_id={CHECKOUT_SESSION_ID}`

    const result = await createPrecisionCheckoutSession({
      userId: req.user!.id,
      userEmail: req.user!.email ?? null,
      tier: tier as PrecisionTier,
      addons: validatedAddons,
      successUrl,
      cancelUrl,
    })

    logger.info(
      { userId: req.user!.id, tier, addons: validatedAddons.length, orderId: result.orderId, isMock: result.isMock },
      '建立精細模式 checkout session'
    )

    res.json({
      success: true,
      data: {
        orderId: result.orderId,
        sessionId: result.sessionId,
        checkoutUrl: result.checkoutUrl,
        amountCents: result.amountCents,
        isMock: result.isMock,
      },
    })
  } catch (err) {
    logger.error({ err }, '建立 checkout session 失敗')
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Checkout 建立失敗',
    })
  }
})

// ============================================================
// GET /api/checkout/precision/status?session_id=xxx
// ============================================================

router.get('/precision/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const sessionId = req.query.session_id as string | undefined
    if (!sessionId) {
      res.status(400).json({ success: false, error: '缺少 session_id 參數' })
      return
    }

    const status = await getCheckoutSessionStatus(sessionId)

    res.json({
      success: true,
      data: status,
    })
  } catch (err) {
    logger.error({ err }, '查詢 checkout 狀態失敗')
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : '查詢失敗',
    })
  }
})

// ============================================================
// POST /api/checkout/precision/cancel
// Body: { session_id, reason }
// ============================================================

router.post('/precision/cancel', requireAuth, async (req: Request, res: Response) => {
  try {
    const { session_id: sessionId, reason } = req.body as { session_id?: string; reason?: string }
    if (!sessionId) {
      res.status(400).json({ success: false, error: '缺少 session_id' })
      return
    }

    await cancelCheckoutSession(sessionId, reason ?? null)

    res.json({ success: true })
  } catch (err) {
    logger.error({ err }, '取消 checkout 失敗')
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : '取消失敗',
    })
  }
})

export default router
