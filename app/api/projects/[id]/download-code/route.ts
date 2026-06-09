import { NextRequest, NextResponse } from 'next/server'

const VPS_API_URL = process.env.VPS_API_URL || 'https://api.tellcraft.com'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const authorization = request.headers.get('Authorization')
  if (!authorization) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const vpsRes = await fetch(`${VPS_API_URL}/api/project/${id}/download-code`, {
      headers: { Authorization: authorization },
      cache: 'no-store',
    })

    if (!vpsRes.ok) {
      const err = await vpsRes.json().catch(() => ({ error: 'Download failed' }))
      return NextResponse.json(err, { status: vpsRes.status })
    }

    const buffer = await vpsRes.arrayBuffer()
    const contentDisposition =
      vpsRes.headers.get('Content-Disposition') ?? 'attachment; filename="code.zip"'

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': contentDisposition,
      },
    })
  } catch (error) {
    console.error('[download-code] VPS connection failed:', error)
    return NextResponse.json({ error: 'VPS connection failed' }, { status: 502 })
  }
}
