import { NextResponse } from 'next/server'

const VPS_API_URL = process.env.VPS_API_URL || 'http://54.238.4.117:8080'

/**
 * GET /api/auth/me
 * 代理到 VPS 獲取當前用戶資訊
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')

  if (!authHeader) {
    return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
  }

  try {
    const response = await fetch(`${VPS_API_URL}/auth/me`, {
      headers: {
        'Authorization': authHeader,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[Auth Proxy] Error:', error)
    return NextResponse.json({ error: 'Failed to verify token' }, { status: 500 })
  }
}
