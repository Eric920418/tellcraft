import { NextRequest, NextResponse } from 'next/server'

const VPS_API_URL = process.env.VPS_API_URL || 'http://54.238.4.117:8080'

/**
 * VPS API 代理
 * 解決 Mixed Content 問題（HTTPS -> HTTP）
 * 所有 /api/vps/* 請求會被轉發到 VPS 後端
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const targetPath = '/' + path.join('/')
  const url = new URL(request.url)
  const queryString = url.search

  try {
    const response = await fetch(`${VPS_API_URL}${targetPath}${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[VPS Proxy] GET error:', error)
    return NextResponse.json({ error: 'VPS connection failed' }, { status: 502 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const targetPath = '/' + path.join('/')

  try {
    const body = await request.json()
    const response = await fetch(`${VPS_API_URL}${targetPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[VPS Proxy] POST error:', error)
    return NextResponse.json({ error: 'VPS connection failed' }, { status: 502 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const targetPath = '/' + path.join('/')

  try {
    const body = await request.json()
    const response = await fetch(`${VPS_API_URL}${targetPath}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[VPS Proxy] PUT error:', error)
    return NextResponse.json({ error: 'VPS connection failed' }, { status: 502 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const targetPath = '/' + path.join('/')

  try {
    const response = await fetch(`${VPS_API_URL}${targetPath}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[VPS Proxy] DELETE error:', error)
    return NextResponse.json({ error: 'VPS connection failed' }, { status: 502 })
  }
}
