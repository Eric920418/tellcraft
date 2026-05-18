/**
 * shared/api-client.ts — Tellcraft backend HTTP client
 *
 * Only used from background service worker（content script via chrome.runtime proxy）
 * scoped JWT 從 chrome.storage.session 拿（commit 4 接 auth-exchange）
 */

const API_BASE = (typeof process !== 'undefined' && process.env.TELLCRAFT_API_URL) || 'https://tellcraft.com'

export interface ApiResult<T> {
  ok: boolean
  data?: T
  error?: string
  status?: number
}

async function getStoredToken(): Promise<string | null> {
  try {
    const data = await chrome.storage.session.get('scopedToken')
    return data.scopedToken ?? null
  } catch {
    return null
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  if (!options.skipAuth) {
    const token = await getStoredToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return { ok: false, error: body || res.statusText, status: res.status }
    }
    const data = await res.json() as T
    return { ok: true, data, status: res.status }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

// ──────────────────────────────────────────────────────────
// Endpoints
// ──────────────────────────────────────────────────────────

export interface AuthExchangeResponse {
  scopedToken: string
  expiresAt: number  // epoch ms
  conversationId: string
  projectId: string
  userId: string
}

export async function authExchange(conversationId: string) {
  return apiFetch<AuthExchangeResponse>('/api/extension/auth/exchange', {
    method: 'POST',
    body: JSON.stringify({ conversationId }),
    skipAuth: true,  // 用 cookie + conversationId 換 scoped token
  })
}

export interface VerifyPreviewResponse {
  ok: true
  projectId: string
  conversationId: string
}

export async function verifyPreview(host: string, conversationId: string) {
  const params = new URLSearchParams({ host, conversationId })
  return apiFetch<VerifyPreviewResponse>(`/api/extension/verify-preview?${params}`)
}

export interface ApplyUpdateResponse {
  ok: true
  deploymentId?: string
}

export async function applyUpdate(payload: {
  conversationId: string
  elementId: string
  domPath: string
  updates: Array<{ kind: string; key?: string; value: string }>
}) {
  return apiFetch<ApplyUpdateResponse>('/api/extension/apply-update', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
