// ============================================================
// 精細模式 pay-to-start gate：claimPrecisionOrderForStart 不變量測試
//
// 守住「一筆付款 = 一個專案」這個直接影響營收的核心不變量：
//   1. 已綁本專案的可用訂單 → 冪等放行（只查一次，不重複認領）
//   2. 未綁定的已付訂單 → 原子認領（UPDATE ... FOR UPDATE SKIP LOCKED + project_id IS NULL）
//   3. 完全沒有可用訂單 → 回 null（呼叫端回 402）
//   4. 認領查詢只接受 paid/in_progress/delivered（pending/cancelled/refunded 一律擋）
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockQueryOne } = vi.hoisted(() => ({ mockQueryOne: vi.fn() }))

vi.mock('../db/client', () => ({
  queryOne: mockQueryOne,
  query: vi.fn(),
  queryMany: vi.fn(),
}))

// stripe-service 載入時的旁支依賴（避免真實 IO / env 驗證）
vi.mock('../lib/env', () => ({ getEnv: () => ({}) }))
vi.mock('../services/slack-notify', () => ({
  notifyOrderPaid: vi.fn().mockResolvedValue(undefined),
  notifyOrderFailed: vi.fn().mockResolvedValue(undefined),
}))

import {
  claimPrecisionOrderForStart,
  USABLE_PRECISION_ORDER_STATUSES,
} from '../services/stripe-service'

const USER = 'user-1'
const PROJECT = 'project-1'

describe('claimPrecisionOrderForStart — pay-to-start gate 不變量', () => {
  beforeEach(() => mockQueryOne.mockReset())

  it('已綁本專案的可用訂單 → 冪等放行，只查一次（不重複認領）', async () => {
    mockQueryOne.mockResolvedValueOnce({ id: 'order-bound', tier: 'standard_599' })

    const result = await claimPrecisionOrderForStart(USER, PROJECT)

    expect(result).toEqual({ id: 'order-bound', tier: 'standard_599' })
    // 第一條 SELECT 命中即 return，不應再跑第二條認領 UPDATE
    expect(mockQueryOne).toHaveBeenCalledTimes(1)
    const [sql] = mockQueryOne.mock.calls[0]
    expect(sql).toContain('SELECT')
    expect(sql).toContain('project_id = $2')
  })

  it('沒綁本專案但有未綁定已付訂單 → 原子認領（UPDATE + FOR UPDATE SKIP LOCKED + project_id IS NULL）', async () => {
    mockQueryOne
      .mockResolvedValueOnce(null) // 沒有已綁本專案的訂單
      .mockResolvedValueOnce({ id: 'order-unbound', tier: 'standard_599' }) // 認領成功

    const result = await claimPrecisionOrderForStart(USER, PROJECT)

    expect(result).toEqual({ id: 'order-unbound', tier: 'standard_599' })
    expect(mockQueryOne).toHaveBeenCalledTimes(2)

    // 認領查詢必須是原子 UPDATE，且只挑「未綁定」的訂單，避免兩專案搶同一張單
    const [claimSql] = mockQueryOne.mock.calls[1]
    expect(claimSql).toContain('UPDATE precision_orders')
    expect(claimSql).toContain('project_id IS NULL')
    expect(claimSql).toContain('FOR UPDATE SKIP LOCKED')
    expect(claimSql).toContain('RETURNING')
  })

  it('完全沒有可用訂單 → 回 null（呼叫端據此回 402）', async () => {
    mockQueryOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null)

    const result = await claimPrecisionOrderForStart(USER, PROJECT)

    expect(result).toBeNull()
    expect(mockQueryOne).toHaveBeenCalledTimes(2)
  })

  it('兩條查詢都只接受 paid/in_progress/delivered 狀態（pending/cancelled/refunded 不算可用）', async () => {
    mockQueryOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null)

    await claimPrecisionOrderForStart(USER, PROJECT)

    // 兩條查詢的 status 參數都應是統一常數，且不含 pending
    for (const call of mockQueryOne.mock.calls) {
      const statusParam = call[1][2] as string[]
      expect(statusParam).toEqual([...USABLE_PRECISION_ORDER_STATUSES])
      expect(statusParam).not.toContain('pending')
      expect(statusParam).not.toContain('cancelled')
      expect(statusParam).not.toContain('refunded')
    }
  })
})
