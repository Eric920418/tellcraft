// ============================================================
// C-Commerce：Stripe Checkout 輕整合（不引 Medusa）
//
// detect 觸發（schema 含 orders 表，由 formulation 在 ENABLE_COMMERCE_MODULE 時注入）→ 生成：
//   - lib/actions/create-checkout-session.ts（建 order + Stripe Checkout session；無 key → mock 模式）
//   - app/api/webhooks/stripe/route.ts（checkout.session.completed → 標記 order 已付）
//   - app/checkout/success|cancel/page.tsx
//
// 客戶 app 的金流 key 是 per-deploy env（STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET），與 Tellcraft 平台
// 自身的 billing key 完全區隔。購物車 UI 由客戶 app（BDD 生成 / 手寫）負責，本層只提供結帳後端 primitive。
// orders 表由 generateAdminPanel 自動生後台供站長管理訂單；order_items 為明細（INFRA 排除）。
// ============================================================
import type { GeneratedComponent } from './uiux-generation'
import { parseCreateTables } from './schema-derivation'

const CHECKOUT_ACTION = `'use server'
import Stripe from 'stripe'
import { sql } from '@/lib/db'

// 從購物車 items 建 order + Stripe Checkout session。
// 無 STRIPE_SECRET_KEY → mock 模式（直接標記已付，回本地成功頁），方便開發 / 預覽。
export async function createCheckoutSession(input: any): Promise<any> {
  const items = Array.isArray(input?.items) ? input.items : []
  if (items.length === 0) throw new Error('購物車為空')
  const norm = items.map((it: any) => ({
    name: String(it?.name || 'Item'),
    priceCents: Math.max(0, Math.round(Number(it?.priceCents || 0))),
    quantity: Math.max(1, Math.round(Number(it?.quantity || 1))),
  }))
  const totalCents = norm.reduce((s: number, it: any) => s + it.priceCents * it.quantity, 0)
  const [order] = await sql\`INSERT INTO orders (status, total_cents, currency, customer_email)
    VALUES ('pending', \${totalCents}, 'usd', \${input?.email || null}) RETURNING id\`
  for (const it of norm) {
    await sql\`INSERT INTO order_items (order_id, product_name, unit_price_cents, quantity)
      VALUES (\${order.id}, \${it.name}, \${it.priceCents}, \${it.quantity})\`
  }

  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    await sql\`UPDATE orders SET status = 'paid' WHERE id = \${order.id}\`
    return { __status: 200, url: '/checkout/success?order=' + order.id, mock: true }
  }
  const stripe: any = new Stripe(key)
  const appUrl = process.env.APP_URL || ''
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: norm.map((it: any) => ({
      price_data: { currency: 'usd', product_data: { name: it.name }, unit_amount: it.priceCents },
      quantity: it.quantity,
    })),
    success_url: appUrl + '/checkout/success?order=' + order.id,
    cancel_url: appUrl + '/checkout/cancel',
    metadata: { order_id: order.id },
  })
  await sql\`UPDATE orders SET stripe_session_id = \${session.id} WHERE id = \${order.id}\`
  return { __status: 200, url: session.url }
}
`

const STRIPE_WEBHOOK = `import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { sql } from '@/lib/db'

// Stripe webhook：checkout.session.completed → 標記 order 已付。需 STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET。
export async function POST(req: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!key || !whSecret) return NextResponse.json({ error: 'Stripe 未配置' }, { status: 400 })
  const stripe: any = new Stripe(key)
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') || ''
  let event: any
  try {
    event = stripe.webhooks.constructEvent(body, sig, whSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
  if (event.type === 'checkout.session.completed') {
    const orderId = event.data?.object?.metadata?.order_id
    if (orderId) await sql\`UPDATE orders SET status = 'paid' WHERE id = \${orderId}\`
  }
  return NextResponse.json({ received: true })
}
`

const SUCCESS_PAGE = `export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams
  return (
    <div className="max-w-lg mx-auto py-20 text-center">
      <h1 className="text-2xl font-bold mb-3">付款成功 🎉</h1>
      <p className="text-gray-500">感謝您的訂購{order ? \`，訂單編號 \${order}\` : ''}。</p>
    </div>
  )
}
`

const CANCEL_PAGE = `export default function CheckoutCancelPage() {
  return (
    <div className="max-w-lg mx-auto py-20 text-center">
      <h1 className="text-2xl font-bold mb-3">付款已取消</h1>
      <p className="text-gray-500">您的訂單尚未完成，可重新結帳。</p>
    </div>
  )
}
`

/**
 * 生成 commerce 檔案（schema 含 orders 表時觸發；orders 只在 ENABLE_COMMERCE_MODULE 時被注入）。
 */
export function generateCommerceFiles(schemaSql: string): GeneratedComponent[] | null {
  const hasOrders = parseCreateTables(schemaSql).some(t => t.tableName.toLowerCase() === 'orders')
  if (!hasOrders) return null
  return [
    { path: 'lib/actions/create-checkout-session.ts', content: CHECKOUT_ACTION, description: 'Stripe Checkout session' },
    { path: 'app/api/webhooks/stripe/route.ts', content: STRIPE_WEBHOOK, description: 'Stripe webhook' },
    { path: 'app/checkout/success/page.tsx', content: SUCCESS_PAGE, description: '結帳成功頁' },
    { path: 'app/checkout/cancel/page.tsx', content: CANCEL_PAGE, description: '結帳取消頁' },
  ]
}
