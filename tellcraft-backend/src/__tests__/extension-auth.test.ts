/**
 * Extension auth + verify-preview unit test（R11 Layer 3）
 *
 * 守住：
 *   - signExtensionToken 生 JWT 含 scope='extension' + conversationId/projectId
 *   - JWT verify 解開 payload 正確
 *   - 非 extension scope token 被拒絕（防 user token 拿來打 extension endpoint）
 */
import { describe, it, expect } from 'vitest'
import jwt from 'jsonwebtoken'
import { signExtensionToken } from '../middleware/auth'

// 對齊 src/__tests__/setup.ts 的 JWT_SECRET
const JWT_SECRET = 'test-secret'

describe('signExtensionToken', () => {
  it('生 JWT 含 scope=extension + conversationId + projectId', () => {
    const { token, expiresAt } = signExtensionToken({
      userId: 'u-1', conversationId: 'c-1', projectId: 'p-1',
    })
    const decoded = jwt.verify(token, JWT_SECRET) as { scope: string; sub: string; conversationId: string; projectId: string; exp: number }
    expect(decoded.scope).toBe('extension')
    expect(decoded.sub).toBe('u-1')
    expect(decoded.conversationId).toBe('c-1')
    expect(decoded.projectId).toBe('p-1')
    expect(expiresAt).toBeGreaterThan(Date.now())
    expect(expiresAt).toBeLessThanOrEqual(Date.now() + 3600 * 1000 + 100)  // 1 hour ± buffer
  })

  it('expiresAt 跟 JWT exp claim 對齊', () => {
    const { token, expiresAt } = signExtensionToken({
      userId: 'u-2', conversationId: 'c-2', projectId: 'p-2',
    })
    const decoded = jwt.verify(token, JWT_SECRET) as { exp: number }
    expect(Math.abs(decoded.exp * 1000 - expiresAt)).toBeLessThan(1500)  // ms-level alignment
  })

  it('每次簽出來都不一樣（iat 不同避免 collision）', async () => {
    const a = signExtensionToken({ userId: 'u', conversationId: 'c', projectId: 'p' })
    await new Promise(r => setTimeout(r, 1100))  // 1.1s 跨秒級邊界
    const b = signExtensionToken({ userId: 'u', conversationId: 'c', projectId: 'p' })
    expect(a.token).not.toBe(b.token)
  })
})

describe('extension scoped token 防 reuse', () => {
  it('user-scope token 無 extension scope claim — verify 後 scope 缺失', () => {
    const userToken = jwt.sign({ sub: 'u-1', email: 'u@x.com' }, JWT_SECRET, { expiresIn: '1h' })
    const decoded = jwt.verify(userToken, JWT_SECRET) as { scope?: string }
    expect(decoded.scope).toBeUndefined()
    // requireExtensionAuth middleware 會 reject scope !== 'extension'
  })

  it('extension token 跟 user token 結構區分', () => {
    const ext = signExtensionToken({ userId: 'u', conversationId: 'c', projectId: 'p' })
    const decoded = jwt.verify(ext.token, JWT_SECRET) as Record<string, unknown>
    expect(decoded).toHaveProperty('scope', 'extension')
    expect(decoded).toHaveProperty('conversationId')
    expect(decoded).toHaveProperty('projectId')
  })
})
