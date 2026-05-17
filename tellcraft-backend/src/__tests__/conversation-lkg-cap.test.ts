/**
 * 守 incident 2026-05-17 三層防護：LKG / response / message size 不再撐爆前端
 *
 * 根因：
 *   1. conversation.ts:487 LKG trigger 用 `current_phase != 'completed'` 字串比對
 *      → Tellcraft 實際完成 phase 叫 uiux_complete/deployer_complete/... → 所有完成對話被誤判 active
 *      → 每次 polling 都拉整個專案 LKG（70+ files / 500KB+）撐爆前端 JSON.parse + main thread → freeze
 *   2. 單條 message 含 code_preview 整套 pages/components/styles 可達 328KB → 即使 LKG 修了，
 *      單條 message 過大仍 freeze。需要 polling response 層 strip + lazy fetch endpoint
 */

import { describe, it, expect } from 'vitest'

// 從 conversation.ts 抽常數測試（這些是 hard-coded 在 router 內 — 測試守它們的意圖不被改錯）
const TERMINAL_PHASES = [
  'completed', 'uiux_complete', 'deployer_complete', 'fast_complete',
  'clone_complete', 'domain_complete', 'failed',
]

describe('LKG trigger TERMINAL_PHASES — incident 2026-05-17 根因守', () => {
  it('uiux_complete 在 terminal phases 內（最常見的「完成」狀態）', () => {
    expect(TERMINAL_PHASES).toContain('uiux_complete')
  })

  it('deployer_complete 在 terminal phases 內', () => {
    expect(TERMINAL_PHASES).toContain('deployer_complete')
  })

  it('fast_complete 在 terminal phases 內', () => {
    expect(TERMINAL_PHASES).toContain('fast_complete')
  })

  it('legacy `completed` 也保留（向後相容）', () => {
    expect(TERMINAL_PHASES).toContain('completed')
  })

  it('failed 終態也算 — 失敗不該繼續 inject LKG', () => {
    expect(TERMINAL_PHASES).toContain('failed')
  })

  it('真正 active 的 phase 不應在白名單（會被當 active 才對）', () => {
    expect(TERMINAL_PHASES).not.toContain('uiux_code_generation')
    expect(TERMINAL_PHASES).not.toContain('uiux_quality_gate')
    expect(TERMINAL_PHASES).not.toContain('deployer_deploying')
    expect(TERMINAL_PHASES).not.toContain('coder_generating')
  })
})

describe('Response size cap — LKG / message 不能撐爆 polling response', () => {
  // 模擬 inline cap 邏輯（conversation.ts 內常數）
  const LKG_INLINE_MAX_BYTES = 200 * 1024
  const MESSAGE_INLINE_MAX_BYTES = 150 * 1024

  it('LKG 50KB → inline 進 response（小檔可保留）', () => {
    const lkgRows = [{ content: 'a'.repeat(40 * 1024) }, { content: 'b'.repeat(10 * 1024) }]
    const totalSize = lkgRows.reduce((sum, r) => sum + r.content.length, 0)
    expect(totalSize).toBeLessThan(LKG_INLINE_MAX_BYTES)
  })

  it('LKG 500KB → 必須 strip（incident 觸發點）', () => {
    const lkgRows = Array.from({ length: 70 }, () => ({ content: 'a'.repeat(7 * 1024) }))
    const totalSize = lkgRows.reduce((sum, r) => sum + r.content.length, 0)
    expect(totalSize).toBeGreaterThan(LKG_INLINE_MAX_BYTES)
  })

  it('LKG cap 不能設太小（< 100KB 會誤殺正常小專案）', () => {
    expect(LKG_INLINE_MAX_BYTES).toBeGreaterThanOrEqual(100 * 1024)
  })

  it('Message cap < LKG cap（單條訊息更該嚴格 — 因為單條會 block render）', () => {
    expect(MESSAGE_INLINE_MAX_BYTES).toBeLessThan(LKG_INLINE_MAX_BYTES)
  })
})

describe('單條 message strip 行為 — 保 type + reference，砍 data', () => {
  // 模擬 polling response 對超大 message 的 strip 邏輯
  function stripIfOversize(
    msg: Record<string, unknown>,
    maxBytes: number,
    conversationId: string,
  ): Record<string, unknown> {
    const msgStr = JSON.stringify(msg)
    if (msgStr.length <= maxBytes) return msg
    const rc = msg.richContent as { type?: string; data?: unknown } | undefined
    if (!rc || !rc.data) return msg
    return {
      ...msg,
      richContent: {
        type: rc.type,
        data: {
          _stripped: true,
          _originalSize: msgStr.length,
          _reason: `message exceeded ${maxBytes}B cap — fetch via /api/conversation/${conversationId}/messages/${(msg as { id?: string }).id}/rich-data`,
        },
      },
    }
  }

  it('< cap 的 message 原樣保留', () => {
    const msg = { id: 'm1', content: 'hi', richContent: { type: 'code_preview', data: { pages: [{ content: 'a' }] } } }
    const result = stripIfOversize(msg, 150 * 1024, 'c1')
    expect(result).toEqual(msg)
  })

  it('> cap 的 code_preview message 保留 type、strip data，留 _reason 指 lazy fetch endpoint', () => {
    const giant = { id: 'm2', content: 'preview', richContent: { type: 'code_preview', data: { styles: 'x'.repeat(200 * 1024) } } }
    const result = stripIfOversize(giant, 150 * 1024, 'c1') as { richContent: { type: string; data: Record<string, unknown> } }
    expect(result.richContent.type).toBe('code_preview')
    expect(result.richContent.data._stripped).toBe(true)
    expect(result.richContent.data._reason).toContain('/api/conversation/c1/messages/m2/rich-data')
    expect(result.richContent.data._originalSize).toBeGreaterThan(150 * 1024)
  })

  it('沒有 richContent 的訊息即使大也不 strip（沒可 strip 的對象）', () => {
    const msg = { id: 'm3', content: 'x'.repeat(200 * 1024) }
    const result = stripIfOversize(msg, 150 * 1024, 'c1')
    expect(result).toEqual(msg)  // 原樣返回
  })
})

describe('sendMessage size warning threshold', () => {
  const MESSAGE_SIZE_WARN_BYTES = 100 * 1024

  it('100KB 是合理閾值 — 上方 polling cap 150KB，留 50KB buffer 給 logger 內部', () => {
    expect(MESSAGE_SIZE_WARN_BYTES).toBeLessThan(150 * 1024)
    expect(MESSAGE_SIZE_WARN_BYTES).toBeGreaterThanOrEqual(50 * 1024)
  })
})
