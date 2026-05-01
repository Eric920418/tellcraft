import { NextRequest } from 'next/server'

const VPS_API_URL = process.env.VPS_API_URL || 'https://api.tellcraft.com'

/**
 * LINE Webhook 專用 Proxy
 * 透傳原始 bytes + X-Line-Signature header，不做 JSON 序列化
 * （現有 vps/[...path] proxy 會 request.json() → JSON.stringify 重序列化，改變原始 bytes，LINE 簽名驗證會失敗）
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.arrayBuffer()

  const response = await fetch(`${VPS_API_URL}/api/line/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': request.headers.get('content-type') || 'application/json',
      'X-Line-Signature': request.headers.get('x-line-signature') || '',
    },
    body: rawBody,
  })

  const data = await response.text()
  return new Response(data, {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
