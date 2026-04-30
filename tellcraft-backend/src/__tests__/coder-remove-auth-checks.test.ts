// ============================================================
// removeAuthChecks — 移除 LLM 偶爾加入的認證檢查
// L13 擴充英文 keyword（unauthorized / forbidden / must be logged in 等），保留中文 fallback
// 覆蓋：正常移除（中英 throw）、邊界（forbidden 誤傷評估）、不該移除的合法 throw
// ============================================================

import { describe, it, expect } from 'vitest'
import { removeAuthChecks } from '../services/coder-generation'

describe('removeAuthChecks — 應移除的 auth 檢查', () => {
  it('Pattern 1: if (!userId) { throw ... }', () => {
    const input = `export async function foo(input) {\n  if (!userId) { throw new Error('no user') }\n  return { id: 1 }\n}`
    const out = removeAuthChecks(input)
    expect(out).not.toMatch(/if\s*\(\s*!userId/)
  })

  it('Pattern 2: if (!input.userId) throw ...（無大括號）', () => {
    const input = `if (!input.userId) throw new Error('missing user')\nconst x = 1`
    const out = removeAuthChecks(input)
    expect(out).not.toMatch(/input\.userId/)
    expect(out).toContain('const x = 1')
  })

  it('Pattern 3 — 中文 auth throw（向後相容）', () => {
    const cases = [
      `if (!session) { throw new Error('必須已登入') }`,
      `if (a) { throw new Error('認證失敗') }`,
      `if (b) { throw new Error('已過期') }`,
      `if (c) { throw new Error('未登入') }`,
      `if (d) { throw new Error('操作者必須是管理員') }`,
      `if (e) { throw new Error('認證憑證無效') }`,
    ]
    for (const line of cases) {
      expect(removeAuthChecks(line).trim()).toBe('')
    }
  })

  it('Pattern 3 — 英文 auth throw（L13 擴充）', () => {
    const cases = [
      `if (a) { throw new Error('unauthorized') }`,
      `if (b) { throw new Error('authentication required') }`,
      `if (c) { throw new Error('not authenticated') }`,
      `if (d) { throw new Error('not logged in') }`,
      `if (e) { throw new Error('login required') }`,
      `if (f) { throw new Error('must be logged in') }`,
      `if (g) { throw new Error('must log in first') }`,
      `if (h) { throw new Error('permission denied') }`,
      `if (i) { throw new Error('user id required') }`,
      `if (j) { throw new Error('user id is missing') }`,
      `if (k) { throw new Error('token invalid') }`,
      `if (l) { throw new Error('session expired') }`,
    ]
    for (const line of cases) {
      expect(removeAuthChecks(line).trim()).toBe('')
    }
  })

  it('Pattern 4: if (!token) { throw } / if (!input.session) return ...', () => {
    const a = `if (!token) { throw new Error('no token') }`
    const b = `if (!input.session) return null`
    const c = `if (!authToken) { return null }`
    expect(removeAuthChecks(a).trim()).toBe('')
    expect(removeAuthChecks(b).trim()).toBe('')
    expect(removeAuthChecks(c).trim()).toBe('')
  })

  it('完整函數體：移除 auth block 後保留業務邏輯', () => {
    const input = `export async function createOrder(input) {
  if (!input.userId) { throw new Error('unauthorized') }
  if (!input.items) throw new Error('items is required')
  const [row] = await sql\`INSERT INTO orders ...\`
  return { __status: 201, ...row }
}`
    const out = removeAuthChecks(input)
    expect(out).not.toContain('unauthorized')
    expect(out).toContain('INSERT INTO orders')
    expect(out).toContain('__status: 201')
    // `items is required` 不是 auth 訊息，應保留
    expect(out).toContain('items is required')
  })
})

describe('removeAuthChecks — 不應誤傷的合法 throw', () => {
  it('業務規則 throw（非 auth）保留', () => {
    const cases = [
      `if (!input.items) throw new Error('items is required')`,
      `if (qty <= 0) throw new Error('quantity must be positive')`,
      `if (!order) throw new Error('order not found')`,
      `if (stock < 1) throw new Error('out of stock')`,
    ]
    for (const line of cases) {
      expect(removeAuthChecks(line)).toBe(line)
    }
  })

  it('⚠️ 邊界已知：forbidden / permission denied 是 auth keyword，商業邏輯誤用會被誤傷', () => {
    // trade-off 記錄：'forbidden' 在列表中為捕捉 auth 訊息，
    // 業務邏輯用 'this action is forbidden by business rule' 會被誤移除。
    // 若將來有用戶案例觸發，改 regex 加 negative lookbehind。
    const line = `if (x) { throw new Error('this is forbidden by business rule') }`
    expect(removeAuthChecks(line).trim()).toBe('')
  })

  it('變數名含 `user` 但非 auth 檢查不被誤傷', () => {
    // `if (!userName)` 不是 auth 格式（需要是 userId/token/session/authToken）
    const line = `if (!userName) throw new Error('username is required')`
    expect(removeAuthChecks(line)).toBe(line)
  })

  it('SQL 裡出現的 userId 引用不被誤傷', () => {
    const input = `const [row] = await sql\`SELECT * FROM users WHERE id = \${input.userId}\``
    expect(removeAuthChecks(input)).toBe(input)
  })
})

describe('removeAuthChecks — P1-3 行為固化（防回歸）', () => {
  it('連續多個 auth throw 全部移除', () => {
    const input = `if (!input.userId) throw new Error('unauthorized')
if (!input.token) throw new Error('token expired')
if (!input.session) throw new Error('session invalid')
const x = 1`
    const out = removeAuthChecks(input)
    expect(out).not.toContain('unauthorized')
    expect(out).not.toContain('token expired')
    expect(out).not.toContain('session invalid')
    expect(out).toContain('const x = 1')
  })

  it('業務邏輯與 auth 混合：只移除 auth，保留業務', () => {
    const input = `export async function transfer(input) {
  if (!input.userId) throw new Error('not logged in')
  if (input.amount <= 0) throw new Error('amount must be positive')
  if (input.amount > 10000) throw new Error('exceeds daily limit')
  return await sql\`UPDATE accounts SET balance = balance - \${input.amount}\`
}`
    const out = removeAuthChecks(input)
    expect(out).not.toContain('not logged in')
    expect(out).toContain('amount must be positive')
    expect(out).toContain('exceeds daily limit')
    expect(out).toContain('UPDATE accounts')
  })

  it('return 形式（非 throw）的 auth 檢查也移除', () => {
    const input = `if (!input.userId) return { __status: 401, error: 'unauthorized' }`
    const out = removeAuthChecks(input)
    expect(out.trim()).toBe('')
  })
})
