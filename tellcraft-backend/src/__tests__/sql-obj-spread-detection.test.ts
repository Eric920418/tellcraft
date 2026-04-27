// L28.A2: detectSqlObjectSpread — 偵測 ${sql(obj)} 反模式
// Neon serverless 不支援 postgres.js 風格的動態欄位 spread

import { describe, it, expect } from 'vitest'
import { detectSqlObjectSpread } from '../services/coder-generation'

describe('detectSqlObjectSpread — L28.A2 反模式偵測', () => {
  it('❌ SET ${sql(updateData)} → 偵測到 issue', () => {
    const code = `
      const updateData = { title: input.title, description: input.description }
      const result = await sql\`UPDATE x SET \${sql(updateData)} WHERE id = \${input.id}\`
    `
    const r = detectSqlObjectSpread(code)
    expect(r.hasIssue).toBe(true)
    expect(r.matches.length).toBe(1)
    expect(r.matches[0]).toContain('updateData')
  })

  it('❌ INSERT ... VALUES (${sql(data)}) → 偵測', () => {
    const code = `await sql\`INSERT INTO x VALUES (\${sql(data)})\``
    const r = detectSqlObjectSpread(code)
    expect(r.hasIssue).toBe(true)
  })

  it('✅ COALESCE pattern → 不偵測', () => {
    const code = `
      await sql\`UPDATE x SET
        title = COALESCE(\${input.title}, title),
        updated_at = NOW()
      WHERE id = \${input.id}\`
    `
    expect(detectSqlObjectSpread(code).hasIssue).toBe(false)
  })

  it('✅ 一般 ${sql\\`...\\`} 巢狀 template → 不偵測（不是 sql(obj) 呼叫）', () => {
    const code = 'await sql`SELECT * FROM (${sql`SELECT 1`}) sub`'
    expect(detectSqlObjectSpread(code).hasIssue).toBe(false)
  })

  it('✅ 普通的 ${variable} 插值 → 不偵測', () => {
    const code = 'await sql`SELECT * FROM x WHERE id = ${input.id} AND name = ${name}`'
    expect(detectSqlObjectSpread(code).hasIssue).toBe(false)
  })

  it('多處反模式 → 全部抓出', () => {
    const code = `
      await sql\`UPDATE a SET \${sql(d1)} WHERE id = \${id}\`
      await sql\`UPDATE b SET \${sql(d2)} WHERE id = \${id}\`
    `
    const r = detectSqlObjectSpread(code)
    expect(r.hasIssue).toBe(true)
    expect(r.matches.length).toBe(2)
  })
})
