/**
 * extension-apply-skill 單元測試（R11 commit 6）
 *
 * 守住：
 *   - text unique match 才替換成功
 *   - text 同檔多處出現 → fail text-not-unique
 *   - text 多檔出現 → fail text-not-unique
 *   - style key 不在 whitelist → invalid-op
 *   - FlowState 不存在 → flowstate-missing
 *   - 樣式 only 修改：成功但 modifiedFiles=0 redeployTriggered=false（MVP 限制）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../workers/orchestrator-utils', () => ({
  getFlowState: vi.fn(),
  saveFlowState: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('../workers/preview-deploy-worker', () => ({
  triggerPreviewDeploy: vi.fn().mockResolvedValue(undefined),
}))

import { applyExtensionUpdate } from '../services/extension-apply-skill'
import { getFlowState } from '../workers/orchestrator-utils'

const REDIS_MOCK = {} as unknown as import('ioredis').default

beforeEach(() => {
  vi.clearAllMocks()
})

function makeState(pages: Array<{ path: string; content: string }>, components: Array<{ path: string; content: string }> = []) {
  return {
    phase: 'uiux_complete',
    projectId: 'p-1',
    currentRound: 0,
    questionIndex: 0,
    batchCount: 0,
    waitingForReply: false,
    totalQuestionsAsked: 0,
    uiuxGeneratedCode: {
      pages: pages.map(p => ({ ...p, description: '' })),
      components: components.map(c => ({ ...c, description: '' })),
      styles: '',
    },
  } as unknown as import('../types/flow-state').FlowState
}

describe('applyExtensionUpdate', () => {
  it('text unique match → 成功替換 + 觸發 redeploy', async () => {
    vi.mocked(getFlowState).mockResolvedValue(makeState([
      { path: 'app/page.tsx', content: '<h1>毛孩樂園</h1>' },
    ]))
    const result = await applyExtensionUpdate({
      conversationId: '00000000-0000-0000-0000-000000000001',
      elementId: 'el-1',
      originalText: '毛孩樂園',
      updates: [{ kind: 'text', value: '寵物天地' }],
    }, REDIS_MOCK, undefined)
    expect(result.ok).toBe(true)
    expect(result.modifiedFiles).toBe(1)
    expect(result.redeployTriggered).toBe(true)
  })

  it('text 同檔多處出現 → text-not-unique', async () => {
    vi.mocked(getFlowState).mockResolvedValue(makeState([
      { path: 'app/page.tsx', content: '<div>HELLO</div><span>HELLO</span>' },
    ]))
    const result = await applyExtensionUpdate({
      conversationId: '00000000-0000-0000-0000-000000000002',
      elementId: 'el-2',
      originalText: 'HELLO',
      updates: [{ kind: 'text', value: 'WORLD' }],
    }, REDIS_MOCK, undefined)
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('text-not-unique')
  })

  it('text 多檔出現 → text-not-unique', async () => {
    vi.mocked(getFlowState).mockResolvedValue(makeState(
      [{ path: 'app/page.tsx', content: '<h1>Brand</h1>' }],
      [{ path: 'components/Header.tsx', content: '<a>Brand</a>' }],
    ))
    const result = await applyExtensionUpdate({
      conversationId: '00000000-0000-0000-0000-000000000003',
      elementId: 'el-3',
      originalText: 'Brand',
      updates: [{ kind: 'text', value: 'NewBrand' }],
    }, REDIS_MOCK, undefined)
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('text-not-unique')
  })

  it('style key 不在 whitelist → invalid-op', async () => {
    vi.mocked(getFlowState).mockResolvedValue(makeState([
      { path: 'app/page.tsx', content: '<h1>x</h1>' },
    ]))
    const result = await applyExtensionUpdate({
      conversationId: '00000000-0000-0000-0000-000000000004',
      elementId: 'el-4',
      // 'transform' 不在 SAFE_STYLE_KEYS — 預期被 reject
      updates: [{ kind: 'style', key: 'transform', value: 'scale(99)' }],
    }, REDIS_MOCK, undefined)
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('invalid-op')
  })

  it('FlowState 不存在 → flowstate-missing', async () => {
    vi.mocked(getFlowState).mockResolvedValue(null)
    const result = await applyExtensionUpdate({
      conversationId: '00000000-0000-0000-0000-000000000005',
      elementId: 'el-5',
      originalText: 'x',
      updates: [{ kind: 'text', value: 'y' }],
    }, REDIS_MOCK, undefined)
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('flowstate-missing')
  })

  it('style-only update → ok 但 modifiedFiles=0 redeployTriggered=false（MVP 限制）', async () => {
    vi.mocked(getFlowState).mockResolvedValue(makeState([
      { path: 'app/page.tsx', content: '<h1>x</h1>' },
    ]))
    const result = await applyExtensionUpdate({
      conversationId: '00000000-0000-0000-0000-000000000006',
      elementId: 'el-6',
      updates: [{ kind: 'style', key: 'color', value: '#ff0000' }],
    }, REDIS_MOCK, undefined)
    expect(result.ok).toBe(true)
    expect(result.modifiedFiles).toBe(0)
    expect(result.redeployTriggered).toBe(false)
  })

  it('text 同字串「沒變」→ 仍 ok（uniqueMatch 仍 true）', async () => {
    vi.mocked(getFlowState).mockResolvedValue(makeState([
      { path: 'app/page.tsx', content: '<h1>same</h1>' },
    ]))
    const result = await applyExtensionUpdate({
      conversationId: '00000000-0000-0000-0000-000000000007',
      elementId: 'el-7',
      originalText: 'same',
      updates: [{ kind: 'text', value: 'same' }],
    }, REDIS_MOCK, undefined)
    expect(result.ok).toBe(true)
  })
})
