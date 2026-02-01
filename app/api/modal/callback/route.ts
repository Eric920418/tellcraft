/**
 * Modal Formulation 回調 Webhook
 *
 * Modal 完成後會調用這個 endpoint，然後這裡發送 Inngest 事件
 * 這樣可以避免 Vercel 函數超時問題
 */

import { NextResponse } from 'next/server'
import { inngest } from '../../../inngest/client'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      sessionId,
      conversationId,
      success,
      schema_sql,
      entity_mapping,
      features,
      validation,
      error,
    } = body

    if (!sessionId || !conversationId) {
      return NextResponse.json(
        { error: '缺少 sessionId 或 conversationId' },
        { status: 400 }
      )
    }

    // 發送 Inngest 事件
    await inngest.send({
      name: 'modal/formulation-complete',
      data: {
        sessionId,
        conversationId,
        success: success ?? false,
        schema_sql,
        entity_mapping,
        features,
        validation,
        error,
      },
    })

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[Modal Callback] Error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
