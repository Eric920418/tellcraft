// ============================================================
// L31.M: Per-Conversation Budget Cap 測試
// ============================================================

import { describe, it, expect, vi } from 'vitest'

// vi.hoisted 確保 mockQueryOne 在 vi.mock factory 之前初始化
const { mockQueryOne } = vi.hoisted(() => ({ mockQueryOne: vi.fn() }))

vi.mock('../db/client', () => ({
  queryOne: mockQueryOne,
  query: vi.fn(),
  queryMany: vi.fn(),
}))

// Mock telemetry — guardFixPathBudget 內動態 import 此 module 來寫 telemetry
vi.mock('../services/skill-telemetry', () => ({
  recordTelemetry: vi.fn().mockResolvedValue(undefined),
  recordTelemetryBatch: vi.fn().mockResolvedValue(undefined),
}))

// Mock env：測試環境可能沒讀 .env，明確注入 MAX_CONVERSATION_COST_USD=5.0
vi.mock('../lib/env', () => ({
  getEnv: () => ({ MAX_CONVERSATION_COST_USD: 5.0, MAX_CONVERSATION_RUNTIME_MIN: 30 }),
}))

import { checkConversationBudget, guardFixPathBudget, assertCanCallLlm } from '../lib/conversation-budget'

describe('L31.M: checkConversationBudget — null/empty conversationId', () => {
  it('conversationId = null → 跳過 check（exceeded: false）', async () => {
    const r = await checkConversationBudget(null)
    expect(r.exceeded).toBe(false)
    expect(r.currentCostUsd).toBe(0)
    expect(r.callCount).toBe(0)
  })

  it('conversationId = undefined → 跳過 check', async () => {
    const r = await checkConversationBudget(undefined)
    expect(r.exceeded).toBe(false)
  })

  it('conversationId = "" → 跳過 check', async () => {
    const r = await checkConversationBudget('')
    expect(r.exceeded).toBe(false)
  })
})

describe('L31.M: checkConversationBudget — DB query mock', () => {
  it('累計 cost < limit → exceeded: false', async () => {
    mockQueryOne.mockResolvedValueOnce({ cost: 2.5, calls: 30 })
    const r = await checkConversationBudget('conv-1', 5.0)
    expect(r.exceeded).toBe(false)
    expect(r.currentCostUsd).toBe(2.5)
    expect(r.callCount).toBe(30)
    expect(r.limitUsd).toBe(5.0)
  })

  it('累計 cost >= limit → exceeded: true', async () => {
    mockQueryOne.mockResolvedValueOnce({ cost: 5.84, calls: 75 })
    const r = await checkConversationBudget('conv-2', 5.0)
    expect(r.exceeded).toBe(true)
    expect(r.currentCostUsd).toBe(5.84)
  })

  it('cost 邊界值 = limit → exceeded: true（>= 比較）', async () => {
    mockQueryOne.mockResolvedValueOnce({ cost: 5.0, calls: 10 })
    const r = await checkConversationBudget('conv-3', 5.0)
    expect(r.exceeded).toBe(true)
  })

  it('DB query throw → fail-open（exceeded: false）', async () => {
    mockQueryOne.mockRejectedValueOnce(new Error('DB error'))
    const r = await checkConversationBudget('conv-4', 5.0)
    expect(r.exceeded).toBe(false)  // fail-open
  })
})

describe('L31.M/N: guardFixPathBudget — return shape', () => {
  it('未超出 → exceeded: false（caller 繼續走）', async () => {
    // assertCanCallLlm 先查 global timeout（first_call）→ 再查 budget（cost）
    mockQueryOne.mockResolvedValueOnce({ first_call: new Date().toISOString() })
    mockQueryOne.mockResolvedValueOnce({ cost: 0.5, calls: 5 })
    const r = await guardFixPathBudget('conv-x', 'fixMultipleFeatures')
    expect(r.exceeded).toBe(false)
  })

  it('超出 → exceeded: true + errorMessage + cost/limit 完整', async () => {
    // assertCanCallLlm 先查 timeout（不過期）→ 再查 budget（超）→ 再走 backward-compat checkConversationBudget
    mockQueryOne.mockResolvedValueOnce({ first_call: new Date().toISOString() })
    mockQueryOne.mockResolvedValueOnce({ cost: 6.5, calls: 80 })
    mockQueryOne.mockResolvedValueOnce({ cost: 6.5, calls: 80 })
    const r = await guardFixPathBudget('conv-y', 'fixFailingAction')
    expect(r.exceeded).toBe(true)
    if (r.exceeded) {
      expect(r.currentCostUsd).toBe(6.5)
      expect(r.errorMessage).toContain('6.50')
      expect(r.errorMessage).toContain('fixFailingAction')
      expect(r.errorMessage).toContain('MAX_CONVERSATION_COST_USD')
    }
  })

  it('global timeout 觸發 → exceeded: true + errorMessage 含 RUNTIME', async () => {
    const oldTime = new Date(Date.now() - 60 * 60_000).toISOString()  // 60 分鐘前
    mockQueryOne.mockResolvedValueOnce({ first_call: oldTime })
    // backward-compat budget query
    mockQueryOne.mockResolvedValueOnce({ cost: 0.5, calls: 5 })
    const r = await guardFixPathBudget('conv-timeout', 'fixFailingAction')
    expect(r.exceeded).toBe(true)
    if (r.exceeded) {
      expect(r.errorMessage).toContain('MAX_CONVERSATION_RUNTIME_MIN')
    }
  })
})

describe('L31.N: assertCanCallLlm — 三層防禦', () => {
  it('無 conversationId → allowed', async () => {
    const r = await assertCanCallLlm(null, 'test')
    expect(r.allowed).toBe(true)
  })

  it('全部通過 → allowed', async () => {
    mockQueryOne.mockResolvedValueOnce({ first_call: new Date().toISOString() })
    mockQueryOne.mockResolvedValueOnce({ cost: 0.5, calls: 5 })
    const r = await assertCanCallLlm('conv-a', 'test')
    expect(r.allowed).toBe(true)
  })

  it('Layer 3 global timeout → rule=global_timeout', async () => {
    const oldTime = new Date(Date.now() - 90 * 60_000).toISOString()
    mockQueryOne.mockResolvedValueOnce({ first_call: oldTime })
    const r = await assertCanCallLlm('conv-b', 'test')
    expect(r.allowed).toBe(false)
    if (!r.allowed) expect(r.rule).toBe('global_timeout')
  })

  it('Layer 1 cost budget → rule=cost_budget', async () => {
    mockQueryOne.mockResolvedValueOnce({ first_call: new Date().toISOString() })
    mockQueryOne.mockResolvedValueOnce({ cost: 10, calls: 100 })
    const r = await assertCanCallLlm('conv-c', 'test')
    expect(r.allowed).toBe(false)
    if (!r.allowed) expect(r.rule).toBe('cost_budget')
  })
})
