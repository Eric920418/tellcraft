/**
 * Admin 訂單後台 API（W2 ops backstop — Sprint 1）
 *
 * GET  /api/admin/orders                    — 列出所有 precision_orders（admin only）
 * POST /api/admin/orders/:id/acknowledge    — 一鍵接案：UPDATE engineer_contacted_at = NOW
 *
 * 取代之前工程師要 SSH + SQL 的痛苦流程。
 * 認證：requireAdmin = requireAuth + DB is_admin = true 雙重檢查。
 */

import { Router, Request, Response } from 'express'
import { requireAdmin } from '../middleware/auth'
import { createLogger } from '../lib/logger'
import { query, queryMany } from '../db/client'

const logger = createLogger('admin-orders')
const router: Router = Router()

// ============================================================
// GET /api/admin/orders
// Query: ?status=paid|delivered|...&unacknowledged_only=1
// ============================================================

router.get('/orders', requireAdmin, async (req: Request, res: Response) => {
  try {
    const statusFilter = req.query.status as string | undefined
    const unackOnly = req.query.unacknowledged_only === '1'

    const whereParts: string[] = []
    const params: unknown[] = []
    let paramIdx = 1

    if (statusFilter) {
      whereParts.push(`po.status = $${paramIdx++}`)
      params.push(statusFilter)
    }
    if (unackOnly) {
      whereParts.push(`po.engineer_contacted_at IS NULL`)
      whereParts.push(`po.status IN ('paid', 'in_progress')`)
    }

    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : ''

    const orders = await queryMany<{
      id: string
      tier: string
      amount_cents: number
      currency: string
      status: string
      iterations_total: number
      iterations_used: number
      warranty_until: string | null
      refund_deadline: string | null
      delivered_at: string | null
      exported_buyout: boolean
      cancellation_reason: string | null
      engineer_contacted_at: string | null
      created_at: string
      // joined
      user_id: string
      user_email: string | null
      user_name: string | null
      project_id: string | null
      project_name: string | null
      project_vercel_url: string | null
    }>(
      `SELECT
         po.id, po.tier, po.amount_cents, po.currency, po.status,
         po.iterations_total, po.iterations_used,
         po.warranty_until, po.refund_deadline, po.delivered_at,
         po.exported_buyout, po.cancellation_reason,
         po.engineer_contacted_at, po.created_at,
         po.user_id,
         u.email AS user_email,
         u.name AS user_name,
         po.project_id,
         p.name AS project_name,
         p.vercel_url AS project_vercel_url
       FROM precision_orders po
       LEFT JOIN users u ON u.id = po.user_id
       LEFT JOIN projects p ON p.id = po.project_id
       ${whereClause}
       ORDER BY
         -- 緊急 sort：未接案 paid 排最上、其次按 created_at DESC
         (CASE WHEN po.status = 'paid' AND po.engineer_contacted_at IS NULL THEN 0 ELSE 1 END),
         po.created_at DESC
       LIMIT 500`,
      params
    )

    res.json({ orders })
  } catch (err) {
    logger.error({ err, userId: req.user?.id }, 'admin GET /orders 失敗')
    res.status(500).json({
      error: err instanceof Error ? err.message : '查詢失敗',
    })
  }
})

// ============================================================
// POST /api/admin/orders/:id/acknowledge
// 一鍵接案：UPDATE engineer_contacted_at = NOW
// ============================================================

router.post('/orders/:id/acknowledge', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const result = await query<{ id: string; engineer_contacted_at: string }>(
      `UPDATE precision_orders
       SET engineer_contacted_at = NOW()
       WHERE id = $1 AND engineer_contacted_at IS NULL
       RETURNING id, engineer_contacted_at`,
      [id]
    )

    if (result.rowCount === 0) {
      // 訂單不存在 or 已被接過 — 兩種都不算錯
      const existing = await query<{ engineer_contacted_at: string | null }>(
        `SELECT engineer_contacted_at FROM precision_orders WHERE id = $1`,
        [id]
      )
      if (existing.rowCount === 0) {
        res.status(404).json({ error: 'Order not found' })
        return
      }
      logger.info({ orderId: id }, '訂單已被接過，noop')
      res.json({
        ok: true,
        already_acknowledged: true,
        engineer_contacted_at: existing.rows[0].engineer_contacted_at,
      })
      return
    }

    const row = result.rows[0]
    logger.info({ orderId: row.id, adminUserId: req.user?.id }, '訂單 acknowledged')

    res.json({
      ok: true,
      already_acknowledged: false,
      engineer_contacted_at: row.engineer_contacted_at,
    })
  } catch (err) {
    logger.error({ err, orderId: req.params.id }, 'admin acknowledge 失敗')
    res.status(500).json({
      error: err instanceof Error ? err.message : '接案失敗',
    })
  }
})

export default router
