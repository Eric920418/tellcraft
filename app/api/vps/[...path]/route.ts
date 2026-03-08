import { NextRequest, NextResponse } from 'next/server'

const VPS_API_URL = process.env.VPS_API_URL || 'http://54.238.4.117:8080'
export const dynamic = 'force-dynamic'
export const revalidate = 0

// 路徑驗證白名單
const ALLOWED_PATH_PREFIXES = ['/api/', '/auth/', '/health']

function validateProxyPath(targetPath: string): boolean {
  // 拒絕路徑遍歷
  if (targetPath.includes('..') || targetPath.includes('//')) {
    return false
  }
  // 白名單路徑前綴
  return ALLOWED_PATH_PREFIXES.some(prefix => targetPath.startsWith(prefix))
}

/**
 * 安全解析 VPS 回應：JSON 優先，非 JSON 回傳錯誤物件
 */
async function safeParseResponse(response: Response): Promise<{ data: unknown; status: number }> {
  const text = await response.text()
  try {
    const data = JSON.parse(text)
    return { data, status: response.status }
  } catch {
    // VPS 返回非 JSON（nginx 錯誤頁、HTML 等）
    console.error(`[VPS Proxy] Non-JSON response (${response.status}): ${text.substring(0, 200)}`)
    return {
      data: { error: 'VPS 後端無回應或返回錯誤', statusCode: response.status },
      status: response.status >= 400 ? response.status : 502,
    }
  }
}

function jsonNoStore(data: unknown, status: number): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      'Surrogate-Control': 'no-store',
    },
  })
}

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

  if (!validateProxyPath(targetPath)) {
    return jsonNoStore({ error: 'Invalid proxy path' }, 400)
  }
  const url = new URL(request.url)
  const queryString = url.search

  try {
    const response = await fetch(`${VPS_API_URL}${targetPath}${queryString}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
    })

    const { data, status } = await safeParseResponse(response)
    return jsonNoStore(data, status)
  } catch (error) {
    console.error('[VPS Proxy] GET error:', error)
    return jsonNoStore({ error: 'VPS connection failed' }, 502)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const targetPath = '/' + path.join('/')

  if (!validateProxyPath(targetPath)) {
    return jsonNoStore({ error: 'Invalid proxy path' }, 400)
  }

  try {
    const url = new URL(request.url)
    const queryString = url.search
    const contentType = request.headers.get('content-type') || ''
    const isMultipart = contentType.includes('multipart/form-data')

    let response: Response

    if (isMultipart) {
      // FormData：透傳原始 body + Content-Type（保留 boundary）
      const rawBody = await request.arrayBuffer()
      response = await fetch(`${VPS_API_URL}${targetPath}${queryString}`, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': contentType,
          'Authorization': request.headers.get('authorization') || '',
        },
        body: rawBody,
      })
    } else {
      // JSON：body 可能為空（如 POST /pin），需容錯
      const text = await request.text()
      let body: unknown = {}
      if (text) {
        try {
          body = JSON.parse(text)
        } catch {
          // 非 JSON body，直接轉發原始文字
        }
      }
      response = await fetch(`${VPS_API_URL}${targetPath}${queryString}`, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('authorization') || '',
        },
        body: JSON.stringify(body),
      })
    }

    const { data, status } = await safeParseResponse(response)
    return jsonNoStore(data, status)
  } catch (error) {
    console.error('[VPS Proxy] POST error:', error)
    return jsonNoStore({ error: 'VPS connection failed' }, 502)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const targetPath = '/' + path.join('/')

  if (!validateProxyPath(targetPath)) {
    return jsonNoStore({ error: 'Invalid proxy path' }, 400)
  }

  try {
    const url = new URL(request.url)
    const queryString = url.search
    const body = await request.json()
    const response = await fetch(`${VPS_API_URL}${targetPath}${queryString}`, {
      method: 'PUT',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
      body: JSON.stringify(body),
    })

    const { data, status } = await safeParseResponse(response)
    return jsonNoStore(data, status)
  } catch (error) {
    console.error('[VPS Proxy] PUT error:', error)
    return jsonNoStore({ error: 'VPS connection failed' }, 502)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const targetPath = '/' + path.join('/')

  if (!validateProxyPath(targetPath)) {
    return jsonNoStore({ error: 'Invalid proxy path' }, 400)
  }

  try {
    const url = new URL(request.url)
    const queryString = url.search
    const response = await fetch(`${VPS_API_URL}${targetPath}${queryString}`, {
      method: 'DELETE',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
    })

    const { data, status } = await safeParseResponse(response)
    return jsonNoStore(data, status)
  } catch (error) {
    console.error('[VPS Proxy] DELETE error:', error)
    return jsonNoStore({ error: 'VPS connection failed' }, 502)
  }
}
