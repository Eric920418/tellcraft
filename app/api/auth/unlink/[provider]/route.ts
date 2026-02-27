import { NextResponse } from 'next/server'

const VPS_API_URL = process.env.VPS_API_URL || 'http://54.238.4.117:8080'

/**
 * POST /api/auth/unlink/:provider
 * Proxy 到 VPS /auth/unlink/:provider
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const authHeader = request.headers.get('authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing authorization' }, { status: 401 })
  }

  try {
    const response = await fetch(`${VPS_API_URL}/auth/unlink/${provider}`, {
      method: 'POST',
      headers: { 'Authorization': authHeader },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[Auth] Unlink proxy error:', error)
    return NextResponse.json({ error: 'Failed to unlink provider' }, { status: 500 })
  }
}
