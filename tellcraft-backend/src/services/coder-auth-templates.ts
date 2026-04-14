// ============================================================
// Auth 系統模板生成（M2：零 LLM 純模板）
// 從 coder-generation.ts 拆分，獨立維護
// ============================================================

import type { GeneratedComponent } from './uiux-generation'
import { createLogger } from '../lib/logger'

const logger = createLogger('coder-auth-templates')

/**
 * Auth 能力集（schema 驅動）
 * - hasCredentials：users + password(_hash) → 生成傳統密碼登入
 * - hasMagicLink：users + email → 生成 magic-link passwordless 登入
 */
export interface AuthCapabilities {
  hasCredentials: boolean
  hasMagicLink: boolean
}

/**
 * 偵測 BDD schema 的 auth 能力
 */
export function detectAuthCapabilities(schemaSql: string): AuthCapabilities {
  const hasUsersTable = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?users\b/i.test(schemaSql)
  if (!hasUsersTable) return { hasCredentials: false, hasMagicLink: false }
  return {
    hasCredentials: /\bpassword(?:_hash)?\s+(?:VARCHAR|TEXT)/i.test(schemaSql),
    hasMagicLink: /\bemail\s+(?:VARCHAR|TEXT|CITEXT)/i.test(schemaSql),
  }
}

/**
 * 偵測 BDD schema 是否包含傳統密碼認證需求（backward-compat wrapper）
 * 條件：有 users 表 + password/password_hash 欄位
 * neon-service.ts 用來決定是否 seed admin 帳號（bcrypt）
 */
export function detectAuthInSchema(schemaSql: string): boolean {
  return detectAuthCapabilities(schemaSql).hasCredentials
}

/**
 * 從 BDD schema 自動生成 NextAuth v5 認證系統（零 LLM）
 * 依 caps 組合決定 provider + login page 變體：
 * - credentials only（現狀）→ 7 檔，密碼登入
 * - magic-link only → 7 檔，login page 轉向 /magic-link/request
 * - 兩者並存 → 7 檔，login page tab UI（default magic-link）
 *
 * Magic-link 所需的 lib/magic-link.ts + pages + server actions 由
 * coder-email-templates.generateMagicLinkSystem() 另外產生。
 */
export function generateAuthSystem(
  schemaSql: string,
  caps?: AuthCapabilities
): GeneratedComponent[] | null {
  const c = caps || detectAuthCapabilities(schemaSql)
  if (!c.hasCredentials && !c.hasMagicLink) return null

  const hasRole = /\brole\s+(?:VARCHAR|TEXT)/i.test(schemaSql)
  logger.info({ hasRole, ...c }, '偵測到認證需求，生成 auth 系統')

  return [
    { path: 'auth.ts', content: buildAuthConfig(hasRole, c), description: 'NextAuth v5 config' },
    { path: 'app/api/auth/[...nextauth]/route.ts', content: AUTH_ROUTE_HANDLER, description: 'NextAuth API handler' },
    { path: 'app/(auth)/admin/login/page.tsx', content: buildLoginPage(c), description: '管理員登入頁面' },
    { path: 'app/admin/layout.tsx', content: buildAdminLayout(hasRole), description: 'Admin layout（auth check）' },
    { path: 'lib/auth-check.ts', content: buildAuthCheck(hasRole), description: 'requireAdmin helper' },
    { path: 'app/providers.tsx', content: SESSION_PROVIDER, description: 'SessionProvider wrapper' },
    { path: 'types/next-auth.d.ts', content: buildNextAuthTypes(hasRole), description: 'NextAuth 型別擴展' },
  ]
}

function buildAuthConfig(hasRole: boolean, caps: AuthCapabilities): string {
  const roleFields = hasRole
    ? `
    callbacks: {
      async jwt({ token, user }) {
        if (user) { token.role = (user as any).role; token.id = user.id }
        return token
      },
      async session({ session, token }) {
        if (session.user) { (session.user as any).role = token.role as string; (session.user as any).id = token.id as string }
        return session
      },
    },`
    : `
    callbacks: {
      async jwt({ token, user }) {
        if (user) { token.id = user.id }
        return token
      },
      async session({ session, token }) {
        if (session.user) { (session.user as any).id = token.id as string }
        return session
      },
    },`

  const selectFields = hasRole ? 'id, name, email, password, role' : 'id, name, email, password'
  const selectFieldsNoPass = hasRole ? 'id, name, email, role' : 'id, name, email'
  const returnRole = hasRole ? `, role: user.role || 'user'` : ''
  const insertCols = hasRole ? '(email, name, role)' : '(email, name)'
  const insertVals = hasRole ? "${email}, ${email.split('@')[0]}, 'user'" : '${email}, ${email.split(\'@\')[0]}'

  // 條件式 imports
  const imports = [
    `import NextAuth from 'next-auth'`,
    `import Credentials from 'next-auth/providers/credentials'`,
    caps.hasCredentials ? `import bcrypt from 'bcryptjs'` : '',
    `import { neon } from '@neondatabase/serverless'`,
    caps.hasMagicLink ? `import { consumeToken } from '@/lib/magic-link'` : '',
  ].filter(Boolean).join('\n')

  // Credentials provider (只在 hasCredentials)
  const credentialsProvider = caps.hasCredentials ? `    Credentials({
      id: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string
        const password = credentials?.password as string
        if (!email || !password) return null
        const rows = await sql\`SELECT ${selectFields} FROM users WHERE email = \${email} LIMIT 1\`
        const user = rows[0] as any
        if (!user?.password) return null
        const valid = await bcrypt.compare(password, user.password)
        if (!valid) return null
        return { id: String(user.id), name: user.name || '', email: user.email${returnRole} }
      },
    }),` : ''

  // Magic-link provider (只在 hasMagicLink)
  // 找不到 user 時自動建檔（passwordless signup）；若 password 欄位 NOT NULL 會 throw → 回 null
  const magicLinkProvider = caps.hasMagicLink ? `    Credentials({
      id: 'magic-link',
      credentials: {
        token: { label: 'Token', type: 'text' },
      },
      async authorize(credentials) {
        const token = credentials?.token as string
        if (!token) return null
        const email = await consumeToken(token)
        if (!email) return null
        const rows = await sql\`SELECT ${selectFieldsNoPass} FROM users WHERE email = \${email} LIMIT 1\`
        let user = rows[0] as any
        if (!user) {
          try {
            const inserted = await sql\`
              INSERT INTO users ${insertCols}
              VALUES (${insertVals})
              ON CONFLICT (email) DO NOTHING
              RETURNING ${selectFieldsNoPass}
            \`
            user = (inserted as any)[0]
            if (!user) {
              const existing = await sql\`SELECT ${selectFieldsNoPass} FROM users WHERE email = \${email} LIMIT 1\`
              user = (existing as any)[0]
            }
          } catch (err: any) {
            console.error('[auth] magic-link auto-signup failed:', err?.message)
            return null
          }
        }
        if (!user) return null
        return { id: String(user.id), name: user.name || '', email: user.email${returnRole} }
      },
    }),` : ''

  const providers = [credentialsProvider, magicLinkProvider].filter(Boolean).join('\n')

  return `${imports}

const sql = neon(process.env.DATABASE_URL!)

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/admin/login' },
  providers: [
${providers}
  ],${roleFields}
})
`
}

const AUTH_ROUTE_HANDLER = `import { handlers } from '@/auth'

export const { GET, POST } = handlers
`

/**
 * 根據 auth 能力組合選擇 login page 變體
 * - credentials only → 傳統密碼表單（原版）
 * - magic-link only → Server Component 轉向 /magic-link/request
 * - 兩者並存 → Tab UI（default magic-link）
 */
function buildLoginPage(caps: AuthCapabilities): string {
  if (caps.hasCredentials && caps.hasMagicLink) return LOGIN_PAGE_TAB
  if (caps.hasMagicLink) return LOGIN_PAGE_MAGIC_ONLY
  return LOGIN_PAGE_CREDENTIALS
}

const LOGIN_PAGE_CREDENTIALS = `'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) {
        setError('帳號或密碼錯誤')
      } else {
        router.push('/admin')
        router.refresh()
      }
    } catch {
      setError('登入失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-center mb-6">Admin Login</h1>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2 px-4 text-white bg-blue-600 rounded-md font-medium disabled:opacity-50 hover:bg-blue-700">
              {loading ? '登入中...' : '登入'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
`

const LOGIN_PAGE_MAGIC_ONLY = `import { redirect } from 'next/navigation'

export default function AdminLoginPage() {
  redirect('/magic-link/request')
}
`

const LOGIN_PAGE_TAB = `'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { requestMagicLink } from '@/app/actions/auth/request-magic-link'

type Tab = 'magic' | 'password'

export default function AdminLoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('magic')

  // Magic-link state
  const [magicEmail, setMagicEmail] = useState('')
  const [magicState, setMagicState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [magicError, setMagicError] = useState('')

  // Password state
  const [pwEmail, setPwEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  async function handleMagicSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMagicState('sending')
    setMagicError('')
    try {
      const result = await requestMagicLink(magicEmail)
      if (result.success) {
        setMagicState('sent')
      } else {
        setMagicState('error')
        setMagicError(result.error || '寄送失敗')
      }
    } catch (err: any) {
      setMagicState('error')
      setMagicError(err?.message || '寄送失敗')
    }
  }

  async function handlePwSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    setPwLoading(true)
    try {
      const result = await signIn('credentials', { email: pwEmail, password, redirect: false })
      if (result?.error) {
        setPwError('帳號或密碼錯誤')
      } else {
        router.push('/admin')
        router.refresh()
      }
    } catch {
      setPwError('登入失敗，請稍後再試')
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-center mb-6">Admin Login</h1>
          <div className="flex border-b mb-6">
            <button
              type="button"
              onClick={() => setTab('magic')}
              className={\`flex-1 py-2 text-sm font-medium \${tab === 'magic' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}\`}
            >
              Email 連結
            </button>
            <button
              type="button"
              onClick={() => setTab('password')}
              className={\`flex-1 py-2 text-sm font-medium \${tab === 'password' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}\`}
            >
              密碼登入
            </button>
          </div>
          {tab === 'magic' ? (
            magicState === 'sent' ? (
              <div className="text-center">
                <p className="text-gray-700 mb-2">已寄送登入連結至</p>
                <p className="font-medium mb-4">{magicEmail}</p>
                <p className="text-sm text-gray-500">15 分鐘內點擊連結即可登入</p>
              </div>
            ) : (
              <form onSubmit={handleMagicSubmit} className="space-y-4">
                {magicError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{magicError}</div>
                )}
                <div>
                  <label htmlFor="magic-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input id="magic-email" type="email" value={magicEmail} onChange={(e) => setMagicEmail(e.target.value)} required autoComplete="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <button type="submit" disabled={magicState === 'sending'}
                  className="w-full py-2 px-4 text-white bg-blue-600 rounded-md font-medium disabled:opacity-50 hover:bg-blue-700">
                  {magicState === 'sending' ? '寄送中...' : '寄送登入連結'}
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handlePwSubmit} className="space-y-4">
              {pwError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{pwError}</div>
              )}
              <div>
                <label htmlFor="pw-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input id="pw-email" type="email" value={pwEmail} onChange={(e) => setPwEmail(e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="pw-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input id="pw-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" disabled={pwLoading}
                className="w-full py-2 px-4 text-white bg-blue-600 rounded-md font-medium disabled:opacity-50 hover:bg-blue-700">
                {pwLoading ? '登入中...' : '登入'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
`

function buildAdminLayout(hasRole: boolean): string {
  const roleCheck = hasRole
    ? `
  if (session.user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">無權限</h1>
          <p className="text-gray-600">您的帳號沒有管理員權限。</p>
        </div>
      </div>
    )
  }`
    : ''

  return `import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) { redirect('/admin/login') }
${roleCheck}
  return <>{children}</>
}
`
}

function buildAuthCheck(hasRole: boolean): string {
  const roleCheck = hasRole
    ? `if (!session || (session.user as any).role !== 'admin') {
    throw new Error('需要管理員權限')
  }`
    : `if (!session) {
    throw new Error('需要登入')
  }`

  return `'use server'

import { auth } from '@/auth'

export async function requireAdmin() {
  const session = await auth()
  ${roleCheck}
  return session
}
`
}

const SESSION_PROVIDER = `'use client'

import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
`

function buildNextAuthTypes(hasRole: boolean): string {
  const roleField = hasRole ? '\n      role: string' : ''
  return `import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string${roleField}
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string${hasRole ? '\n    role: string' : ''}
  }
}
`
}

/**
 * 在根 layout.tsx 中注入 SessionProvider（零 LLM 字串操作）
 */
export function injectSessionProvider(layoutContent: string): string {
  if (layoutContent.includes('Providers') || layoutContent.includes('SessionProvider')) return layoutContent

  const importLine = `import { Providers } from '@/app/providers'\n`
  let result = layoutContent

  const lastImportIdx = result.lastIndexOf('\nimport ')
  if (lastImportIdx !== -1) {
    const lineEnd = result.indexOf('\n', lastImportIdx + 1)
    if (lineEnd === -1) {
      result = result + '\n' + importLine
    } else {
      result = result.slice(0, lineEnd + 1) + importLine + result.slice(lineEnd + 1)
    }
  } else {
    result = importLine + result
  }

  result = result.replace(/(<body[^>]*>)/, '$1\n        <Providers>')
  result = result.replace(/<\/body>/, '        </Providers>\n      </body>')

  return result
}
