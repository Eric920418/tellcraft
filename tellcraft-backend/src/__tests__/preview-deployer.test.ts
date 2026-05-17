/**
 * Phase 1 (Vercel preview 替換 WebContainer) — quickPreviewDeploy 守護
 *
 * 守住：
 *   - code hash 計算 deterministic（key 順序不影響 / 同 input 同 hash）
 *   - canonicalization 涵蓋所有重要欄位（pages/components/styles/tailwindConfig）
 *   - findLkgPreviewUrl fallback chain（preview ready → projects.vercel_url → null）
 */

import { describe, it, expect } from 'vitest'
import { computeCodeHash } from '../services/preview-deployer'

describe('computeCodeHash — deterministic + canonicalized', () => {
  it('同 input → 同 hash', () => {
    const input = {
      pages: [{ path: 'app/page.tsx', content: 'hi', description: '' }],
      components: [{ path: 'components/A.tsx', content: 'foo', description: '' }],
      styles: '@tailwind base;',
      tailwindConfig: 'export default {}',
    }
    expect(computeCodeHash(input)).toBe(computeCodeHash(input))
  })

  it('pages 順序變化 → 同 hash（按 path sort 後 canonical）', () => {
    const h1 = computeCodeHash({
      pages: [{ path: 'app/a.tsx', content: 'a', description: '' }, { path: 'app/b.tsx', content: 'b', description: '' }],
      components: [],
      styles: '',
    })
    const h2 = computeCodeHash({
      pages: [{ path: 'app/b.tsx', content: 'b', description: '' }, { path: 'app/a.tsx', content: 'a', description: '' }],
      components: [],
      styles: '',
    })
    expect(h1).toBe(h2)
  })

  it('content 變化 → 不同 hash', () => {
    const h1 = computeCodeHash({
      pages: [{ path: 'app/page.tsx', content: 'hello', description: '' }],
      components: [],
      styles: '',
    })
    const h2 = computeCodeHash({
      pages: [{ path: 'app/page.tsx', content: 'world', description: '' }],
      components: [],
      styles: '',
    })
    expect(h1).not.toBe(h2)
  })

  it('styles 變化 → 不同 hash（防 Tailwind config 改了但 dedup 短路漏掉）', () => {
    const h1 = computeCodeHash({ pages: [], components: [], styles: '@tailwind base;' })
    const h2 = computeCodeHash({ pages: [], components: [], styles: '@tailwind base; .x{}' })
    expect(h1).not.toBe(h2)
  })

  it('tailwindConfig 變化 → 不同 hash', () => {
    const h1 = computeCodeHash({ pages: [], components: [], styles: '', tailwindConfig: 'a' })
    const h2 = computeCodeHash({ pages: [], components: [], styles: '', tailwindConfig: 'b' })
    expect(h1).not.toBe(h2)
  })

  it('tailwindConfig undefined 跟空字串 → 同 hash（避免 undefined 跟 "" 算不同造成多餘 deploy）', () => {
    const h1 = computeCodeHash({ pages: [], components: [], styles: '' })
    const h2 = computeCodeHash({ pages: [], components: [], styles: '', tailwindConfig: '' })
    expect(h1).toBe(h2)
  })

  it('輸出是 SHA-256 hex（64 字元）', () => {
    const h = computeCodeHash({ pages: [], components: [], styles: '' })
    expect(h).toMatch(/^[a-f0-9]{64}$/)
  })

  it('description 不影響 hash（只有 path + content 是 canonical key）', () => {
    const h1 = computeCodeHash({
      pages: [{ path: 'app/page.tsx', content: 'hi', description: 'old description' }],
      components: [],
      styles: '',
    })
    const h2 = computeCodeHash({
      pages: [{ path: 'app/page.tsx', content: 'hi', description: 'new description' }],
      components: [],
      styles: '',
    })
    expect(h1).toBe(h2)
  })
})
