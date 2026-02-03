/**
 * Modal Formulation 回調 Webhook
 *
 * Modal 完成後會調用這個 endpoint，然後轉發到 VPS Backend
 */

import { NextResponse } from 'next/server'

const VPS_API_URL = process.env.VPS_API_URL || 'http://54.238.4.117:8080'

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

    // 轉發到 VPS Backend
    const response = await fetch(`${VPS_API_URL}/api/modal/formulation-complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        conversationId,
        success: success ?? false,
        schema_sql,
        entity_mapping,
        features,
        validation,
        error,
      }),
    })

    if (!response.ok) {
      console.error('[Modal Callback] VPS error:', await response.text())
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[Modal Callback] Error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
