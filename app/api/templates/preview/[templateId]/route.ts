import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params

  // 代理到 VPS API（DB-only 來源）
  const vpsUrl = process.env.VPS_API_URL || 'http://54.238.4.117:8080'
  try {
    const response = await fetch(`${vpsUrl}/api/templates/preview/${templateId}`, {
      headers: {
        'Accept': 'text/html',
      },
    })

    if (response.ok) {
      const html = await response.text()
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Proxy': 'VPS',
        },
      })
    }
  } catch (error) {
    console.error('[Template Preview] VPS proxy failed:', error)
  }

  return new NextResponse('Template not found', { status: 404 })
}
