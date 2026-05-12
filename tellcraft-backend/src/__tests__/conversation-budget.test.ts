// ============================================================
// L31.M: Per-Conversation Budget Cap 測試（純安全網，預設 $20）
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

// Mock env：測試環境注入 MAX_CONVERSATION_COST_USD=20.0
vi.mock('../lib/env', () => ({
  getEnv: () => ({ MAX_CONVERSATION_COST_USD: 20.0 }),
}))

import { checkConversationBudget, guardFixPathBudget } from '../lib/conversation-budget'

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
    mockQueryOne.mockResolvedValueOnce({ cost: 10, calls: 50 })
    const r = await checkConversationBudget('conv-1', 20.0)
    expect(r.exceeded).toBe(false)
    expect(r.currentCostUsd).toBe(10)
    expect(r.callCount).toBe(50)
    expect(r.limitUsd).toBe(20.0)
  })

  it('累計 cost >= limit → exceeded: true（安全網觸發）', async () => {
    mockQueryOne.mockResolvedValueOnce({ cost: 25, calls: 120 })
    const r = await checkConversationBudget('conv-2', 20.0)
    expect(r.exceeded).toBe(true)
    expect(r.currentCostUsd).toBe(25)
  })

  it('cost 邊界值 = limit → exceeded: true（>= 比較）', async () => {
    mockQueryOne.mockResolvedValueOnce({ cost: 20.0, calls: 30 })
    const r = await checkConversationBudget('conv-3', 20.0)
    expect(r.exceeded).toBe(true)
  })

  it('DB query throw → fail-open（exceeded: false）', async () => {
    mockQueryOne.mockRejectedValueOnce(new Error('DB error'))
    const r = await checkConversationBudget('conv-4', 20.0)
    expect(r.exceeded).toBe(false)  // fail-open
  })
})

describe('L31.M: guardFixPathBudget — return shape', () => {
  it('未超出 → exceeded: false（caller 繼續走）', async () => {
    mockQueryOne.mockResolvedValueOnce({ cost: 5, calls: 30 })
    const r = await guardFixPathBudget('conv-x', 'fixMultipleFeatures')
    expect(r.exceeded).toBe(false)
  })

  it('超出 → exceeded: true + errorMessage 含安全網標示', async () => {
    mockQueryOne.mockResolvedValueOnce({ cost: 25, calls: 120 })
    const r = await guardFixPathBudget('conv-y', 'fixFailingAction')
    expect(r.exceeded).toBe(true)
    if (r.exceeded) {
      expect(r.currentCostUsd).toBe(25)
      expect(r.errorMessage).toContain('25.00')
      expect(r.errorMessage).toContain('fixFailingAction')
      expect(r.errorMessage).toContain('安全網')
    }
  })
})
