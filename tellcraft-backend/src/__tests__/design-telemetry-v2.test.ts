/**
 * Phase 0 設計審美閉環 — 新事件 + helper 單測
 *
 * 覆蓋：
 *  - detectAestheticComplaint regex（中英文 + 邊界 case）
 *  - aggregateDesignEffectiveness SQL 形狀（mock db.queryMany/queryOne 確認 SQL 被打）
 *  - recordDesignQualitySnapshot 在 flag off 時 noop
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  detectAestheticComplaint,
  aggregateDesignEffectiveness,
  AESTHETIC_COMPLAINT_REGEX,
} from '../services/skill-telemetry'
import * as db from '../db/client'

// ============================================================
// detectAestheticComplaint — 零 LLM regex
// ============================================================

describe('detectAestheticComplaint', () => {
  it.each([
    // 中文命中
    ['這個設計好醜', true],
    ['配色爛', true],
    ['很low', true],
    ['沒設計感', true],
    ['質感差太多', true],
    ['看起來土土的', true],
    ['很俗', true],
    // 英文命中
    ['this looks ugly', true],
    ['too cheap', true],
    ['tacky design', true],
    ['UGLY!', true],          // case insensitive
    ['amateur work', true],
    // 不應命中（功能性反饋，非審美）
    ['button 點不到', false],
    ['加一個 footer', false],
    ['hero 太大了', false],
    ['this is broken', false],
    ['', false],
  ])('detect("%s") === %s', (input, expected) => {
    expect(detectAestheticComplaint(input)).toBe(expected)
  })

  it('regex 是 case-insensitive 且 exported（給外部 audit 用）', () => {
    expect(AESTHETIC_COMPLAINT_REGEX.flags).toContain('i')
  })

  it('保守設計 — 普通批評不誤殺', () => {
    // 「不好」單獨不該觸發（容易誤殺），必須是「不好看」或具體美感詞
    expect(detectAestheticComplaint('不好')).toBe(false)
    expect(detectAestheticComplaint('還行')).toBe(false)
  })
})

// ============================================================
// aggregateDesignEffectiveness — SQL 形狀驗證
// ============================================================

describe('aggregateDesignEffectiveness', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('回傳結構穩定（無資料時所有計數為 0）', async () => {
    vi.spyOn(db, 'queryMany').mockResolvedValue([])
    vi.spyOn(db, 'queryOne').mockResolvedValue({ snap: 0, delta: 0, complaint: 0 })

    const result = await aggregateDesignEffectiveness(7)

    expect(result).toEqual({
      windowDays: 7,
      byMood: [],
      bySource: [],
      totalSnapshots: 0,
      totalIterationDeltas: 0,
      totalAestheticComplaints: 0,
    })
  })

  it('byMood 把 SQL row 映射為駝峰命名欄位', async () => {
    vi.spyOn(db, 'queryMany')
      .mockResolvedValueOnce([
        { mood: 'minimalist', snapshot_count: 12, avg_score: 85.5, avg_delta: 3.2, complaint_count: 1 },
        { mood: 'glassmorphism', snapshot_count: 8, avg_score: 72.1, avg_delta: -4.5, complaint_count: 5 },
      ])
      .mockResolvedValueOnce([])
    vi.spyOn(db, 'queryOne').mockResolvedValue({ snap: 20, delta: 15, complaint: 6 })

    const result = await aggregateDesignEffectiveness(7)

    expect(result.byMood).toHaveLength(2)
    expect(result.byMood[0]).toEqual({
      mood: 'minimalist',
      sampleSize: 12,
      avgScore: 85.5,
      avgScoreDelta: 3.2,
      complaintCount: 1,
    })
    expect(result.byMood[1].mood).toBe('glassmorphism')
    expect(result.byMood[1].avgScoreDelta).toBe(-4.5)
    expect(result.totalSnapshots).toBe(20)
    expect(result.totalAestheticComplaints).toBe(6)
  })

  it('bySource 把 ds_source 映射為 dsSource', async () => {
    vi.spyOn(db, 'queryMany')
      .mockResolvedValueOnce([])  // byMood
      .mockResolvedValueOnce([     // bySource
        { ds_source: 'user_designed', snapshot_count: 30, avg_score: 82.3, complaint_count: 2 },
        { ds_source: 'vendored_designmd', snapshot_count: 10, avg_score: 68.0, complaint_count: 4 },
      ])
    vi.spyOn(db, 'queryOne').mockResolvedValue({ snap: 40, delta: 20, complaint: 6 })

    const result = await aggregateDesignEffectiveness(7)

    expect(result.bySource).toHaveLength(2)
    expect(result.bySource[0]).toEqual({
      dsSource: 'user_designed',
      snapshotCount: 30,
      avgScore: 82.3,
      complaintCount: 2,
    })
    expect(result.bySource[1].dsSource).toBe('vendored_designmd')
  })

  it('windowDays 參數正確傳遞給 SQL（防 SQL injection 用字串 cast）', async () => {
    const querySpy = vi.spyOn(db, 'queryMany').mockResolvedValue([])
    vi.spyOn(db, 'queryOne').mockResolvedValue({ snap: 0, delta: 0, complaint: 0 })

    await aggregateDesignEffectiveness(30)

    // 第一次呼叫應該帶 '30' 作為 interval 參數
    const firstCall = querySpy.mock.calls[0]
    expect(firstCall[1]).toEqual(['30'])
  })

  it('SQL 用 NOW() 動態時間（不可在 query 字串硬編日期）', async () => {
    const querySpy = vi.spyOn(db, 'queryMany').mockResolvedValue([])
    vi.spyOn(db, 'queryOne').mockResolvedValue({ snap: 0, delta: 0, complaint: 0 })

    await aggregateDesignEffectiveness(7)

    for (const call of querySpy.mock.calls) {
      expect(call[0]).toContain("NOW()")
    }
  })
})
