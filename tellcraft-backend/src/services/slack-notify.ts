/**
 * Slack 通知 — 24h ops backstop
 *
 * 用途：新訂單付款成功、訂單交付、訂單失敗等關鍵事件 ping Slack 工程師 channel。
 * 賣「真人工程師 24h 協助」必須有此 backstop，否則訂單進來沒人知道。
 *
 * 設計原則：
 * - 完全 fire-and-forget（catch + log，不阻擋 caller）
 * - 沒設 SLACK_OPS_WEBHOOK_URL 直接 noop（dev 環境 / 自架不需要時不報錯）
 * - 用 Slack Incoming Webhook（最簡單，無 SDK 依賴、無 OAuth）
 * - 純文字 + Slack markdown（粗體 *xxx*、代碼 `xxx`、link <url|text>）
 *
 * 不做的事：
 * - 不做 Block Kit（過度設計，純文字夠用）
 * - 不做 retry（fire-and-forget，失敗就失敗，下次新訂單會補上）
 * - 不做 rate limit（Slack incoming webhook 1 req/sec 已夠用，超出純丟）
 */

import { getEnv } from '../lib/env'
import { createLogger } from '../lib/logger'

const logger = createLogger('slack-notify')

// ============================================================
// 底層 POST 函數（fail-soft）
// ============================================================

async function postToSlack(text: string): Promise<void> {
  const url = getEnv().SLACK_OPS_WEBHOOK_URL
  if (!url) return  // noop — Slack 未配，安靜跳過

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      logger.warn({ status: res.status, body: body.slice(0, 200) }, 'Slack webhook 回非 200')
    }
  } catch (err) {
    logger.warn({ err }, 'Slack POST 失敗')
  }
}

/**
 * Fire-and-forget 包裝：永遠 sync return，POST 在背景跑。
 * 失敗只記 log，不會丟例外給 caller。
 */
function fire(text: string): void {
  postToSlack(text).catch((err) => logger.warn({ err }, 'slack notify uncaught error'))
}

// ============================================================
// 事件 helpers
// ============================================================

export interface OrderNotifyContext {
  orderId: string
  tier: string
  amountCents: number
  currency: string
  userEmail?: string | null
  projectId?: string | null
}

function fmtAmount(cents: number, currency: string): string {
  if (currency === 'twd') return `NT$${cents.toLocaleString()}`
  // USD 是 two-decimal，cents/100
  return `$${(cents / 100).toFixed(2)} USD`
}

function dashboardLink(orderId: string): string {
  // Slack 自動把 <url|text> 渲染成連結
  // 改成 admin 後台 URL（如果有）— 目前指 user-facing dashboard
  const appUrl = process.env.APP_URL || 'https://tellcraft.com'
  return `<${appUrl}/zh/dashboard/orders|查看訂單>`
}

/**
 * 新訂單付款成功 — 通知工程師「24h 內聯絡客戶」
 * 由 stripe-service.handleCheckoutCompleted 在 pending → paid 時呼叫
 */
export function notifyOrderPaid(ctx: OrderNotifyContext): void {
  const lines = [
    `🆕 *新精準交付訂單已付款*`,
    `*Tier*: ${ctx.tier}`,
    `*金額*: ${fmtAmount(ctx.amountCents, ctx.currency)}`,
    `*客戶*: ${ctx.userEmail || '（無 email）'}`,
    `*訂單 ID*: \`${ctx.orderId.slice(0, 8)}...${ctx.orderId.slice(-4)}\``,
    `⏰ *24h 內必須聯絡客戶*`,
    dashboardLink(ctx.orderId),
    ``,
    `_接案後請手動 UPDATE precision_orders SET engineer_contacted_at = NOW() WHERE id = '${ctx.orderId}';_`,
  ]
  fire(lines.join('\n'))
}

/**
 * 訂單交付完成 — 通知工程師「pipeline 跑完了，可以收尾」
 * 由 deployer 成功完成時呼叫（W1 暫不接，等 deployer 加 hook）
 */
export function notifyOrderDelivered(ctx: OrderNotifyContext & { vercelUrl?: string | null }): void {
  const lines = [
    `✅ *訂單已交付*`,
    `*Tier*: ${ctx.tier}`,
    `*客戶*: ${ctx.userEmail || '（無 email）'}`,
    `*訂單 ID*: \`${ctx.orderId.slice(0, 8)}...${ctx.orderId.slice(-4)}\``,
    ctx.vercelUrl ? `*網站*: <${ctx.vercelUrl}|前往網站>` : ``,
    dashboardLink(ctx.orderId),
  ].filter(Boolean)
  fire(lines.join('\n'))
}

/**
 * 訂單失敗 — 通知工程師「pipeline 失敗了，可能要人工介入」
 */
export function notifyOrderFailed(ctx: OrderNotifyContext & { reason?: string }): void {
  const lines = [
    `❌ *訂單失敗，需介入*`,
    `*Tier*: ${ctx.tier}`,
    `*客戶*: ${ctx.userEmail || '（無 email）'}`,
    `*訂單 ID*: \`${ctx.orderId.slice(0, 8)}...${ctx.orderId.slice(-4)}\``,
    `*原因*: ${ctx.reason || '（未知）'}`,
    dashboardLink(ctx.orderId),
  ]
  fire(lines.join('\n'))
}

/**
 * Stripe webhook signature 異常 / SDK 載入失敗等 ops-critical 錯誤
 * （未來可擴充用）
 */
export function notifyOpsAlert(title: string, detail: string): void {
  fire(`🚨 *${title}*\n${detail}`)
}
