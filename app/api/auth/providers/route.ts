import { NextResponse } from 'next/server'

const VPS_API_URL = process.env.VPS_API_URL || 'http://54.238.4.117:8080'

/**
 * GET /api/auth/providers
 * Proxy 到 VPS /auth/providers
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing authorization' }, { status: 401 })
  }

  try {
    const response = await fetch(`${VPS_API_URL}/auth/providers`, {
      headers: { 'Authorization': authHeader },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[Auth] Providers proxy error:', error)
    return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 })
  }
}
