import { describe, it, expect } from 'vitest'
import {
  generateEmailInfrastructure,
  generateMagicLinkSystem,
} from '../services/coder-email-templates'
import {
  detectAuthCapabilities,
  detectAuthInSchema,
  generateAuthSystem,
} from '../services/coder-auth-templates'

// ============================================================
// detectAuthCapabilities — 四種 schema 組合
// ============================================================

describe('detectAuthCapabilities', () => {
  it('無 users 表 → 兩者皆 false', () => {
    const caps = detectAuthCapabilities('CREATE TABLE products (id UUID);')
    expect(caps).toEqual({ hasCredentials: false, hasMagicLink: false })
  })

  it('users + password_hash → credentials only', () => {
    const sql = `CREATE TABLE users (id UUID, password_hash VARCHAR(255));`
    expect(detectAuthCapabilities(sql)).toEqual({ hasCredentials: true, hasMagicLink: false })
  })

  it('users + email 無 password → magic-link only', () => {
    const sql = `CREATE TABLE users (id UUID, email VARCHAR(255));`
    expect(detectAuthCapabilities(sql)).toEqual({ hasCredentials: false, hasMagicLink: true })
  })

  it('users + email + password_hash → 兩者並存', () => {
    const sql = `CREATE TABLE users (id UUID, email VARCHAR(255), password_hash VARCHAR(255));`
    expect(detectAuthCapabilities(sql)).toEqual({ hasCredentials: true, hasMagicLink: true })
  })

  it('detectAuthInSchema 為 hasCredentials 的 wrapper（backward-compat）', () => {
    const sql = `CREATE TABLE users (id UUID, email VARCHAR(255));`
    expect(detectAuthInSchema(sql)).toBe(false) // magic-link only，無 password
    expect(detectAuthCapabilities(sql).hasCredentials).toBe(false)
  })
})

// ============================================================
// generateEmailInfrastructure — 條件產出
// ============================================================

describe('generateEmailInfrastructure', () => {
  it('無 magic-link 且無 email action → 空陣列', () => {
    const sql = `CREATE TABLE products (id UUID);`
    const result = generateEmailInfrastructure(sql, ['listProducts'])
    expect(result).toEqual([])
  })

  it('有 magic-link → 生成 lib/email.ts', () => {
    const sql = `CREATE TABLE users (id UUID, email VARCHAR(255));`
    const result = generateEmailInfrastructure(sql, [])
    expect(result).toHaveLength(1)
    expect(result[0].path).toBe('lib/email.ts')
    expect(result[0].content).toContain("import { Resend } from 'resend'")
    expect(result[0].content).toContain('sendEmail')
    expect(result[0].content).toContain('escapeHtml')
  })

  it('action 名稱含 email 意圖 → 生成 lib/email.ts', () => {
    const sql = `CREATE TABLE products (id UUID);`
    const result = generateEmailInfrastructure(sql, ['sendOrderEmail'])
    expect(result).toHaveLength(1)
    expect(result[0].path).toBe('lib/email.ts')
  })

  it('action 含中文意圖（寄信/通知）→ 生成 lib/email.ts', () => {
    const sql = `CREATE TABLE products (id UUID);`
    expect(generateEmailInfrastructure(sql, ['寄信給用戶'])).toHaveLength(1)
    expect(generateEmailInfrastructure(sql, ['通知管理員'])).toHaveLength(1)
  })

  it('lib/email.ts 含 RESEND_API_KEY 未設定時的 graceful degrade', () => {
    const sql = `CREATE TABLE users (id UUID, email VARCHAR(255));`
    const result = generateEmailInfrastructure(sql, [])
    expect(result[0].content).toContain('RESEND_API_KEY 未設定')
    expect(result[0].content).toContain('skipped: true')
  })

  it('lib/email.ts 預設 EMAIL_FROM 為 onboarding@resend.dev', () => {
    const sql = `CREATE TABLE users (id UUID, email VARCHAR(255));`
    const result = generateEmailInfrastructure(sql, [])
    expect(result[0].content).toContain("'onboarding@resend.dev'")
  })
})

// ============================================================
// generateMagicLinkSystem — 5 個檔案 + null
// ============================================================

describe('generateMagicLinkSystem', () => {
  it('無 magic-link 能力 → null', () => {
    const sql = `CREATE TABLE products (id UUID);`
    expect(generateMagicLinkSystem(sql)).toBeNull()
  })

  it('users 只有 password 無 email → null', () => {
    const sql = `CREATE TABLE users (id UUID, password_hash VARCHAR(255));`
    expect(generateMagicLinkSystem(sql)).toBeNull()
  })

  it('users + email → 回傳 5 個檔案', () => {
    const sql = `CREATE TABLE users (id UUID, email VARCHAR(255));`
    const result = generateMagicLinkSystem(sql)
    expect(result).not.toBeNull()
    expect(result).toHaveLength(5)

    const paths = result!.map(f => f.path).sort()
    expect(paths).toEqual([
      'app/(auth)/magic-link/request/page.tsx',
      'app/(auth)/magic-link/verify/page.tsx',
      'app/actions/auth/request-magic-link.ts',
      'app/actions/auth/verify-magic-link.ts',
      'lib/magic-link.ts',
    ])
  })

  it('lib/magic-link.ts 含 token 生成 + rate limit + 消耗邏輯', () => {
    const sql = `CREATE TABLE users (id UUID, email VARCHAR(255));`
    const magicLib = generateMagicLinkSystem(sql)!.find(f => f.path === 'lib/magic-link.ts')!
    expect(magicLib.content).toContain('generateToken')
    expect(magicLib.content).toContain('createTokenRecord')
    expect(magicLib.content).toContain('consumeToken')
    expect(magicLib.content).toContain('RATE_LIMIT_SECONDS')
    expect(magicLib.content).toContain('TOKEN_TTL_MINUTES')
    expect(magicLib.content).toContain('DELETE FROM magic_link_tokens')
  })

  it('request-magic-link action 使用 sendEmail + escapeHtml', () => {
    const sql = `CREATE TABLE users (id UUID, email VARCHAR(255));`
    const action = generateMagicLinkSystem(sql)!.find(f => f.path === 'app/actions/auth/request-magic-link.ts')!
    expect(action.content).toContain("'use server'")
    expect(action.content).toContain("import { sendEmail, escapeHtml } from '@/lib/email'")
    expect(action.content).toContain("import { createTokenRecord } from '@/lib/magic-link'")
    expect(action.content).toContain('magic-link/verify')
  })

  it('verify-magic-link action 透過 signIn 建 session', () => {
    const sql = `CREATE TABLE users (id UUID, email VARCHAR(255));`
    const action = generateMagicLinkSystem(sql)!.find(f => f.path === 'app/actions/auth/verify-magic-link.ts')!
    expect(action.content).toContain("signIn('magic-link'")
  })
})

// ============================================================
// generateAuthSystem — caps 驅動的三種 login 變體
// ============================================================

describe('generateAuthSystem — login 變體', () => {
  it('無 auth 能力 → null', () => {
    expect(generateAuthSystem('CREATE TABLE products (id UUID);')).toBeNull()
  })

  it('credentials only → 密碼表單變體', () => {
    const sql = `CREATE TABLE users (id UUID, email VARCHAR(255), password_hash VARCHAR(255));`
    const files = generateAuthSystem(sql, { hasCredentials: true, hasMagicLink: false })!
    const loginPage = files.find(f => f.path === 'app/(auth)/admin/login/page.tsx')!
    expect(loginPage.content).toContain("signIn('credentials'")
    expect(loginPage.content).toContain('Password')
    expect(loginPage.content).not.toContain('magic-link')
  })

  it('magic-link only → redirect 變體', () => {
    const sql = `CREATE TABLE users (id UUID, email VARCHAR(255));`
    const files = generateAuthSystem(sql, { hasCredentials: false, hasMagicLink: true })!
    const loginPage = files.find(f => f.path === 'app/(auth)/admin/login/page.tsx')!
    expect(loginPage.content).toContain("redirect('/magic-link/request')")
  })

  it('兩者並存 → Tab UI 變體', () => {
    const sql = `CREATE TABLE users (id UUID, email VARCHAR(255), password_hash VARCHAR(255));`
    const files = generateAuthSystem(sql, { hasCredentials: true, hasMagicLink: true })!
    const loginPage = files.find(f => f.path === 'app/(auth)/admin/login/page.tsx')!
    expect(loginPage.content).toContain('Email 連結')
    expect(loginPage.content).toContain('密碼登入')
    expect(loginPage.content).toContain('requestMagicLink')
    expect(loginPage.content).toContain("signIn('credentials'")
  })
})

// ============================================================
// auth.ts provider 條件組合
// ============================================================

describe('generateAuthSystem — auth.ts provider 組合', () => {
  it('credentials only → auth.ts 只含 credentials provider', () => {
    const sql = `CREATE TABLE users (id UUID, email VARCHAR(255), password_hash VARCHAR(255));`
    const files = generateAuthSystem(sql, { hasCredentials: true, hasMagicLink: false })!
    const authConfig = files.find(f => f.path === 'auth.ts')!
    expect(authConfig.content).toContain("id: 'credentials'")
    expect(authConfig.content).not.toContain("id: 'magic-link'")
    expect(authConfig.content).toContain("import bcrypt from 'bcryptjs'")
    expect(authConfig.content).not.toContain('consumeToken')
  })

  it('magic-link only → auth.ts 只含 magic-link provider', () => {
    const sql = `CREATE TABLE users (id UUID, email VARCHAR(255));`
    const files = generateAuthSystem(sql, { hasCredentials: false, hasMagicLink: true })!
    const authConfig = files.find(f => f.path === 'auth.ts')!
    expect(authConfig.content).not.toContain("id: 'credentials'")
    expect(authConfig.content).toContain("id: 'magic-link'")
    expect(authConfig.content).toContain('consumeToken')
    expect(authConfig.content).not.toContain("import bcrypt from 'bcryptjs'")
  })

  it('兩者並存 → auth.ts 含兩個 providers', () => {
    const sql = `CREATE TABLE users (id UUID, email VARCHAR(255), password_hash VARCHAR(255));`
    const files = generateAuthSystem(sql, { hasCredentials: true, hasMagicLink: true })!
    const authConfig = files.find(f => f.path === 'auth.ts')!
    expect(authConfig.content).toContain("id: 'credentials'")
    expect(authConfig.content).toContain("id: 'magic-link'")
  })
})
