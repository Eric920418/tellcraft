// ============================================================
// Email 系統模板生成（零 LLM 純模板）
// lib/email.ts (Resend primitive) + Magic-link 5 檔（lib/magic-link.ts + 2 pages + 2 server actions）
// ============================================================

import type { GeneratedComponent } from './uiux-generation'
import { detectAuthCapabilities } from './coder-auth-templates'
import { createLogger } from '../lib/logger'

const logger = createLogger('coder-email-templates')

// 偵測 action 名稱是否暗示發信需求
const EMAIL_ACTION_REGEX = /email|寄信|通知|notify|verify|confirm/i

/**
 * 生成 email primitive 基礎設施
 * 條件：hasMagicLink（需要寄登入信）或 actions 含 email 意圖（寄通知/驗證信）
 */
export function generateEmailInfrastructure(
  schemaSql: string,
  actionNames: string[] = []
): GeneratedComponent[] {
  const { hasMagicLink } = detectAuthCapabilities(schemaSql)
  const hasEmailAction = actionNames.some(n => EMAIL_ACTION_REGEX.test(n))
  if (!hasMagicLink && !hasEmailAction) return []

  logger.info({ hasMagicLink, hasEmailAction }, '生成 email primitive (lib/email.ts)')
  return [
    { path: 'lib/email.ts', content: EMAIL_LIB, description: 'Resend email primitive' },
  ]
}

/**
 * 生成 magic-link auth 子系統（5 檔）
 * 條件：schema 含 users 表 + email 欄位
 */
export function generateMagicLinkSystem(schemaSql: string): GeneratedComponent[] | null {
  const { hasMagicLink } = detectAuthCapabilities(schemaSql)
  if (!hasMagicLink) return null

  logger.info({}, '生成 magic-link 子系統（5 檔）')
  return [
    { path: 'lib/magic-link.ts', content: MAGIC_LINK_LIB, description: 'Magic-link token 管理' },
    { path: 'app/(auth)/magic-link/request/page.tsx', content: MAGIC_LINK_REQUEST_PAGE, description: 'Magic-link 申請頁' },
    { path: 'app/(auth)/magic-link/verify/page.tsx', content: MAGIC_LINK_VERIFY_PAGE, description: 'Magic-link 驗證頁' },
    { path: 'app/actions/auth/request-magic-link.ts', content: REQUEST_MAGIC_LINK_ACTION, description: 'Request Magic-link server action' },
    { path: 'app/actions/auth/verify-magic-link.ts', content: VERIFY_MAGIC_LINK_ACTION, description: 'Verify Magic-link server action' },
  ]
}

// ============================================================
// lib/email.ts — Resend primitive
// ============================================================

const EMAIL_LIB = `import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY
const resend = apiKey ? new Resend(apiKey) : null

const DEFAULT_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev'

export interface SendEmailInput {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
}

export interface SendEmailResult {
  id: string | null
  skipped?: boolean
  reason?: string
}

/**
 * 發送 email。
 * - 若 RESEND_API_KEY 未設定：console.warn 並回傳 skipped（不 throw，避免非關鍵 email 拖垮整個 action）
 * - 若 Resend API 失敗：throw（讓呼叫端決定是否吞掉）
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY 未設定，略過寄信', { to: input.to, subject: input.subject })
    return { id: null, skipped: true, reason: 'missing_api_key' }
  }
  const result = await resend.emails.send({
    from: input.from || DEFAULT_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  })
  if (result.error) {
    throw new Error(\`Email send failed: \${result.error.message}\`)
  }
  return { id: result.data?.id || null }
}

/**
 * HTML escape（防 XSS）
 * 在 email 模板拼接用戶輸入時必用
 */
export function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
`

// ============================================================
// lib/magic-link.ts — Token 管理
// ============================================================

const MAGIC_LINK_LIB = `import crypto from 'crypto'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

const TOKEN_TTL_MINUTES = 15
const RATE_LIMIT_SECONDS = 60

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * 建立 magic-link token。
 * 60 秒 rate limit：同 email 60s 內已申請過會 throw。
 */
export async function createTokenRecord(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase()

  const recent = (await sql\`
    SELECT created_at FROM magic_link_tokens
    WHERE email = \${normalized}
    ORDER BY created_at DESC
    LIMIT 1
  \`) as Array<{ created_at: string }>

  if (recent.length > 0) {
    const createdAt = new Date(recent[0].created_at).getTime()
    const secondsAgo = (Date.now() - createdAt) / 1000
    if (secondsAgo < RATE_LIMIT_SECONDS) {
      const wait = Math.ceil(RATE_LIMIT_SECONDS - secondsAgo)
      throw new Error(\`請稍候 \${wait} 秒後再試\`)
    }
  }

  const token = generateToken()
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000).toISOString()

  await sql\`
    INSERT INTO magic_link_tokens (token, email, expires_at)
    VALUES (\${token}, \${normalized}, \${expiresAt})
  \`
  return token
}

/**
 * 驗證並消耗 token（單次使用，DELETE RETURNING 原子操作）。
 * 成功回 email，過期/不存在回 null。
 */
export async function consumeToken(token: string): Promise<string | null> {
  const rows = (await sql\`
    DELETE FROM magic_link_tokens
    WHERE token = \${token} AND expires_at > NOW()
    RETURNING email
  \`) as Array<{ email: string }>
  return rows[0]?.email ?? null
}

/**
 * 清理過期 token（可選，通常 DB 夠大才需要週期呼叫）
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const rows = (await sql\`
    DELETE FROM magic_link_tokens WHERE expires_at < NOW() RETURNING token
  \`) as Array<{ token: string }>
  return rows.length
}
`

// ============================================================
// app/(auth)/magic-link/request/page.tsx — 輸入 email
// ============================================================

const MAGIC_LINK_REQUEST_PAGE = `'use client'

import { useState } from 'react'
import { requestMagicLink } from '@/app/actions/auth/request-magic-link'

export default function MagicLinkRequestPage() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('sending')
    setErrorMsg('')
    try {
      const result = await requestMagicLink(email)
      if (result.success) {
        setState('sent')
      } else {
        setState('error')
        setErrorMsg(result.error || '寄送失敗')
      }
    } catch (err: any) {
      setState('error')
      setErrorMsg(err?.message || '寄送失敗')
    }
  }

  if (state === 'sent') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-sm w-full bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-xl font-semibold mb-2">已寄送登入連結</h1>
          <p className="text-gray-600 text-sm">
            請至 <strong>{email}</strong> 信箱查收，15 分鐘內點擊連結即可登入。
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-center mb-6">用 Email 登入</h1>
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
              {errorMsg}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={state === 'sending'}
              className="w-full py-2 px-4 text-white bg-blue-600 rounded-md font-medium disabled:opacity-50 hover:bg-blue-700"
            >
              {state === 'sending' ? '寄送中...' : '寄送登入連結'}
            </button>
            <p className="text-center text-sm">
              <a href="/admin/login" className="text-gray-600 hover:text-gray-900">
                返回密碼登入
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
`

// ============================================================
// app/(auth)/magic-link/verify/page.tsx — 點連結後驗證
// 用 window.location 而非 useSearchParams，避免 Suspense boundary 要求
// ============================================================

const MAGIC_LINK_VERIFY_PAGE = `'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { verifyMagicLink } from '@/app/actions/auth/verify-magic-link'

export default function MagicLinkVerifyPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'verifying' | 'error'>('verifying')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (!token) {
      setStatus('error')
      setErrorMsg('連結無效：缺少 token')
      return
    }
    verifyMagicLink(token)
      .then((result) => {
        if (result.success) {
          router.push('/admin')
          router.refresh()
        } else {
          setStatus('error')
          setErrorMsg(result.error || '連結已過期或失效')
        }
      })
      .catch((err: any) => {
        setStatus('error')
        setErrorMsg(err?.message || '驗證失敗')
      })
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-sm w-full bg-white rounded-lg shadow-md p-8 text-center">
        {status === 'verifying' ? (
          <div className="text-gray-600">驗證中...</div>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-red-600 mb-2">驗證失敗</h1>
            <p className="text-gray-600 text-sm mb-4">{errorMsg}</p>
            <a href="/magic-link/request" className="text-blue-600 text-sm hover:underline">
              重新申請連結
            </a>
          </>
        )}
      </div>
    </div>
  )
}
`

// ============================================================
// app/actions/auth/request-magic-link.ts
// ============================================================

const REQUEST_MAGIC_LINK_ACTION = `'use server'

import { headers } from 'next/headers'
import { createTokenRecord } from '@/lib/magic-link'
import { sendEmail, escapeHtml } from '@/lib/email'

export async function requestMagicLink(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const normalized = email.trim().toLowerCase()
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(normalized)) {
      return { success: false, error: '請輸入有效的 email' }
    }

    const token = await createTokenRecord(normalized)

    // 優先 APP_URL，fallback request origin
    let appUrl = process.env.APP_URL || ''
    if (!appUrl) {
      const h = await headers()
      const host = h.get('host')
      const proto = h.get('x-forwarded-proto') || 'https'
      if (host) appUrl = \`\${proto}://\${host}\`
    }
    const verifyUrl = \`\${appUrl}/magic-link/verify?token=\${encodeURIComponent(token)}\`

    await sendEmail({
      to: normalized,
      subject: '您的登入連結',
      html: \`
        <p>您好，請點擊下方連結登入：</p>
        <p><a href="\${escapeHtml(verifyUrl)}">\${escapeHtml(verifyUrl)}</a></p>
        <p style="color:#666;font-size:13px;">此連結 15 分鐘內有效，只能使用一次。若非本人操作請忽略。</p>
      \`,
      text: \`登入連結：\${verifyUrl}\\n\\n15 分鐘內有效，只能使用一次。\`,
    })

    return { success: true }
  } catch (err: any) {
    console.error('[request-magic-link] error:', err)
    return { success: false, error: err?.message || '寄送失敗，請稍後再試' }
  }
}
`

// ============================================================
// app/actions/auth/verify-magic-link.ts
// ============================================================

const VERIFY_MAGIC_LINK_ACTION = `'use server'

import { signIn } from '@/auth'

/**
 * 驗證 magic-link token 並建立 session。
 * NextAuth Credentials provider (id: 'magic-link') 會呼叫 consumeToken。
 */
export async function verifyMagicLink(
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await signIn('magic-link', { token, redirect: false })
    return { success: true }
  } catch (err: any) {
    console.error('[verify-magic-link] error:', err)
    return { success: false, error: err?.message || '連結已過期或失效' }
  }
}
`
