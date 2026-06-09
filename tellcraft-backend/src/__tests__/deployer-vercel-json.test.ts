import { describe, it, expect } from 'vitest'
import { wrapInNextJs } from '../services/deployer'

// Helper：建立最小 GeneratedCode（跟 deployer-sanitize.test.ts 同 pattern）
function makeEmptyCode() {
  return { pages: [], components: [], styles: '' }
}

describe('wrapInNextJs — vercel.json 自動注入', () => {
  it('回傳的 files 含 vercel.json', () => {
    const files = wrapInNextJs(makeEmptyCode(), 'test-project', '')
    const vercelJson = files.find(f => f.file === 'vercel.json')
    expect(vercelJson).toBeDefined()
  })

  it('vercel.json 含 regions=["sin1"]（對齊 Neon ap-southeast-1）', () => {
    const files = wrapInNextJs(makeEmptyCode(), 'test-project', '')
    const vercelJson = files.find(f => f.file === 'vercel.json')!
    const parsed = JSON.parse(vercelJson.data)
    expect(parsed.regions).toEqual(['sin1'])
  })

  it('vercel.json 含 functions.app/**/*.ts.maxDuration=60', () => {
    const files = wrapInNextJs(makeEmptyCode(), 'test-project', '')
    const vercelJson = files.find(f => f.file === 'vercel.json')!
    const parsed = JSON.parse(vercelJson.data)
    expect(parsed.functions['app/**/*.ts'].maxDuration).toBe(60)
  })

  it('vercel.json 含 $schema 對齊 Tellcraft 平台 pattern', () => {
    const files = wrapInNextJs(makeEmptyCode(), 'test-project', '')
    const vercelJson = files.find(f => f.file === 'vercel.json')!
    const parsed = JSON.parse(vercelJson.data)
    expect(parsed.$schema).toBe('https://openapi.vercel.sh/vercel.json')
  })

  it('A3：injectedFiles 含排程 cron route → vercel.json 注入 crons', () => {
    const files = wrapInNextJs(makeEmptyCode(), 'test-project', '', undefined, [
      { file: 'app/api/cron/publish-scheduled/route.ts', data: 'export async function GET() { return Response.json({ ok: true }) }' },
    ])
    const parsed = JSON.parse(files.find(f => f.file === 'vercel.json')!.data)
    expect(parsed.crons).toEqual([{ path: '/api/cron/publish-scheduled', schedule: '*/15 * * * *' }])
  })

  it('A3：無排程 cron route → vercel.json 無 crons', () => {
    const parsed = JSON.parse(wrapInNextJs(makeEmptyCode(), 'test-project', '').find(f => f.file === 'vercel.json')!.data)
    expect(parsed.crons).toBeUndefined()
  })

  it('若 injectedFiles 已含 vercel.json，保留客戶自訂版本不覆蓋', () => {
    const customVercelJson = JSON.stringify({
      regions: ['hkg1'],
      customField: 'user-defined',
    })
    const files = wrapInNextJs(
      makeEmptyCode(),
      'test-project',
      '',
      undefined,
      [{ file: 'vercel.json', data: customVercelJson }],
    )
    const matches = files.filter(f => f.file === 'vercel.json')
    expect(matches.length).toBe(1)
    const parsed = JSON.parse(matches[0].data)
    expect(parsed.regions).toEqual(['hkg1'])  // 客戶自訂 hkg1 被保留
    expect(parsed.customField).toBe('user-defined')
  })
})
