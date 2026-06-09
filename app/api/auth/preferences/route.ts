import { NextResponse } from 'next/server'

const VPS_API_URL = process.env.VPS_API_URL || 'https://api.tellcraft.com'

/**
 * POST /api/auth/preferences
 * Proxy 到 VPS /auth/preferences
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing authorization' }, { status: 401 })
  }

  try {
    const body = await request.json()

    const response = await fetch(`${VPS_API_URL}/auth/preferences`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[Auth] Preferences proxy error:', error)
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
  }
}
