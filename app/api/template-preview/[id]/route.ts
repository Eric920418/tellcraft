import { NextRequest, NextResponse } from 'next/server'

const VPS_API_URL = process.env.VPS_API_URL || 'http://54.238.4.117:8080'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return new NextResponse('Invalid template ID', { status: 400 })
  }

  try {
    const response = await fetch(`${VPS_API_URL}/api/templates/preview/${id}`, {
      cache: 'no-store',
    })
    const html = await response.text()
    return new NextResponse(html, {
      status: response.status,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch {
    return new NextResponse('<html><body><p>Preview unavailable</p></body></html>', {
      status: 502,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
}
