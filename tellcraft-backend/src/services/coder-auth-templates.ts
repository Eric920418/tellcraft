// ============================================================
// Auth 系統模板生成（M2：零 LLM 純模板）
// 從 coder-generation.ts 拆分，獨立維護
// ============================================================

import type { GeneratedComponent } from './uiux-generation'
import { createLogger } from '../lib/logger'

const logger = createLogger('coder-auth-templates')

/**
 * 偵測 BDD schema 是否包含認證需求
 * 條件：有 users 表 + password/password_hash 欄位
 */
export function detectAuthInSchema(schemaSql: string): boolean {
  return /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?users\b/i.test(schemaSql)
    && /\bpassword(?:_hash)?\s+(?:VARCHAR|TEXT)/i.test(schemaSql)
}

/**
 * 從 BDD schema 自動生成 NextAuth v5 認證系統（零 LLM）
 * 生成 7 個檔案：auth config、API route、login page、admin layout、auth check、providers、types
 */
export function generateAuthSystem(schemaSql: string): GeneratedComponent[] | null {
  if (!detectAuthInSchema(schemaSql)) return null

  const hasRole = /\brole\s+(?:VARCHAR|TEXT)/i.test(schemaSql)
  logger.info({ hasRole }, '偵測到認證需求，生成 auth 系統')

  return [
    { path: 'auth.ts', content: buildAuthConfig(hasRole), description: 'NextAuth v5 config' },
    { path: 'app/api/auth/[...nextauth]/route.ts', content: AUTH_ROUTE_HANDLER, description: 'NextAuth API handler' },
    { path: 'app/(auth)/admin/login/page.tsx', content: LOGIN_PAGE, description: '管理員登入頁面' },
    { path: 'app/admin/layout.tsx', content: buildAdminLayout(hasRole), description: 'Admin layout（auth check）' },
    { path: 'lib/auth-check.ts', content: buildAuthCheck(hasRole), description: 'requireAdmin helper' },
    { path: 'app/providers.tsx', content: SESSION_PROVIDER, description: 'SessionProvider wrapper' },
    { path: 'types/next-auth.d.ts', content: buildNextAuthTypes(hasRole), description: 'NextAuth 型別擴展' },
  ]
}

function buildAuthConfig(hasRole: boolean): string {
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
  const returnRole = hasRole ? `, role: user.role || 'user'` : ''

  return `import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/admin/login' },
  providers: [
    Credentials({
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
    }),
  ],${roleFields}
})
`
}

const AUTH_ROUTE_HANDLER = `import { handlers } from '@/auth'

export const { GET, POST } = handlers
`

const LOGIN_PAGE = `'use client'

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
