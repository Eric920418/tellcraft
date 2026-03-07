import { describe, it, expect } from 'vitest'
import {
  hasDeployIntent,
  hasRejectDeployIntent,
  hasRollbackIntent,
  hasUndoIntent,
  hasGoBackIntent,
  hasChangeIntent,
  hasRollbackSpecIntent,
  computeDiscoveryLimits,
  isDesignFeedback,
  getPhaseStrictness,
} from '../workers/intent-helpers'

// ============================================================
// hasDeployIntent
// ============================================================

describe('hasDeployIntent', () => {
  it.each([
    '部署',
    '幫我部署',
    'deploy',
    '上線',
    '發布',
    '再部署',
    '重新部署',
    '請幫我部署上線',
  ])('應該接受部署關鍵字: "%s"', (msg) => {
    expect(hasDeployIntent(msg)).toBe(true)
  })

  it.each([
    '不要部署',
    '別部署',
    '先不上線',
    '暫時不發布',
    "don't deploy",
    'cancel deploy',
  ])('否定詞應該排除: "%s"', (msg) => {
    expect(hasDeployIntent(msg)).toBe(false)
  })

  it.each([
    '修改後再部署',
    '改一下再部署',
    '調整後再上線',
  ])('修改詞衝突應該排除: "%s"', (msg) => {
    expect(hasDeployIntent(msg)).toBe(false)
  })

  it.each([
    '今天天氣真好',
    '修改顏色',
    '加一個按鈕',
  ])('無關訊息應該拒絕: "%s"', (msg) => {
    expect(hasDeployIntent(msg)).toBe(false)
  })
})

// ============================================================
// hasRejectDeployIntent
// ============================================================

describe('hasRejectDeployIntent', () => {
  it.each([
    '不要部署',
    '先不要上線',
    '不想發布',
    '別部署了',
    "don't deploy",
    'not yet deploy',
  ])('應該偵測拒絕部署: "%s"', (msg) => {
    expect(hasRejectDeployIntent(msg)).toBe(true)
  })

  it.each([
    '部署',
    '幫我部署',
    '今天天氣好',
  ])('非拒絕不應觸發: "%s"', (msg) => {
    expect(hasRejectDeployIntent(msg)).toBe(false)
  })
})

// ============================================================
// hasRollbackIntent
// ============================================================

describe('hasRollbackIntent', () => {
  it.each([
    '回滾',
    'rollback',
    '回到上一版',
    '還原',
  ])('應該偵測回滾意圖: "%s"', (msg) => {
    expect(hasRollbackIntent(msg)).toBe(true)
  })

  it('「還原修改」不應觸發回滾', () => {
    expect(hasRollbackIntent('還原修改')).toBe(false)
  })

  it('無關訊息不應觸發', () => {
    expect(hasRollbackIntent('改一下顏色')).toBe(false)
  })
})

// ============================================================
// hasUndoIntent
// ============================================================

describe('hasUndoIntent', () => {
  it.each([
    '撤銷',
    'undo',
    '復原',
    '上一步',
    '還原修改',
  ])('應該偵測撤銷意圖: "%s"', (msg) => {
    expect(hasUndoIntent(msg)).toBe(true)
  })

  it.each([
    '修改顏色',
    '繼續',
    '部署',
  ])('無關訊息不應觸發: "%s"', (msg) => {
    expect(hasUndoIntent(msg)).toBe(false)
  })
})

// ============================================================
// hasGoBackIntent
// ============================================================

describe('hasGoBackIntent', () => {
  it.each([
    '返回',
    '回去',
    '重新選擇',
    '重選',
    '重來',
    '回到上一步',
    'go back',
  ])('應該偵測返回意圖: "%s"', (msg) => {
    expect(hasGoBackIntent(msg)).toBe(true)
  })

  it('「返回修改」不應觸發（deployer_failed 專用）', () => {
    expect(hasGoBackIntent('返回修改')).toBe(false)
  })

  it('「回去修改」不應觸發', () => {
    expect(hasGoBackIntent('回去修改')).toBe(false)
  })

  it('無關訊息不應觸發', () => {
    expect(hasGoBackIntent('改顏色')).toBe(false)
  })
})

// ============================================================
// hasChangeIntent
// ============================================================

describe('hasChangeIntent', () => {
  it.each([
    '修改規格',
    '新增功能',
    '刪除功能',
    '變更需求',
  ])('應該偵測變更意圖: "%s"', (msg) => {
    expect(hasChangeIntent(msg)).toBe(true)
  })

  it.each([
    '改一下顏色',
    '部署',
    '撤銷',
  ])('一般修改不應觸發: "%s"', (msg) => {
    expect(hasChangeIntent(msg)).toBe(false)
  })
})

// ============================================================
// hasRollbackSpecIntent
// ============================================================

describe('hasRollbackSpecIntent', () => {
  it.each([
    '撤銷變更',
    '回滾規格',
    '恢復規格',
    '取消變更',
    '還原規格',
  ])('應該偵測規格回滾意圖: "%s"', (msg) => {
    expect(hasRollbackSpecIntent(msg)).toBe(true)
  })

  it('回滾不應觸發（不含規格）', () => {
    expect(hasRollbackSpecIntent('回滾')).toBe(false)
  })
})

// ============================================================
// computeDiscoveryLimits
// ============================================================

describe('computeDiscoveryLimits', () => {
  it('極短需求（<100 字，少列點/關鍵詞）→ 3 輪 15 問', () => {
    const result = computeDiscoveryLimits('做一個官網')
    expect(result).toEqual({ maxRounds: 3, maxTotalQuestions: 15 })
  })

  it('短需求（100-300，少列點少關鍵詞）→ 4 輪 25 問', () => {
    // 需要 len >= 100, bulletCount < 3, featureKeywords < 4
    const desc = '我想做一個餐廳官網，這個網站需要有漂亮的首頁設計，展示餐廳的特色和氛圍。' +
      '網站要有一個菜單展示的區域，可以讓客人在來店之前先看看菜色和價格。' +
      '另外也要有一個聯絡我們的表單，讓客人可以直接預約座位或者詢問各種相關的問題。'
    expect(desc.length).toBeGreaterThanOrEqual(100)
    expect(desc.length).toBeLessThan(300)
    const result = computeDiscoveryLimits(desc)
    expect(result).toEqual({ maxRounds: 4, maxTotalQuestions: 25 })
  })

  it('中等需求（<800）→ 6 輪 30 問', () => {
    // len > 300, < 800 → 第三條件 len < 800 命中
    const desc = '我想做一個線上課程平台，提供用戶學習。'.repeat(30)
    expect(desc.length).toBeGreaterThan(300)
    expect(desc.length).toBeLessThan(800)
    const result = computeDiscoveryLimits(desc)
    expect(result).toEqual({ maxRounds: 6, maxTotalQuestions: 30 })
  })

  it('超長需求（>=1500 字）+ ES → 8 輪 35 問', () => {
    const desc = '功能'.repeat(800)
    expect(desc.length).toBeGreaterThanOrEqual(1500)
    const result = computeDiscoveryLimits(desc, true)
    expect(result).toEqual({ maxRounds: 8, maxTotalQuestions: 35 })
  })

  it('有 ES 文件但短文本 → 先命中第一條件 3/15', () => {
    // hasEsDocument 在第 4 個條件才檢查，短文本先命中第 1 個
    const desc = '我要一個系統'
    const result = computeDiscoveryLimits(desc, true)
    expect(result).toEqual({ maxRounds: 3, maxTotalQuestions: 15 })
  })

  it('有 ES 文件 + 長文本（>=1500）→ 8 輪 35 問', () => {
    const desc = '這是一個需要多個模組的複雜系統。'.repeat(100)
    expect(desc.length).toBeGreaterThanOrEqual(1500)
    const result = computeDiscoveryLimits(desc, true)
    expect(result).toEqual({ maxRounds: 8, maxTotalQuestions: 35 })
  })

  it('len < 800 先命中 → 不管關鍵詞多少都是 6/30', () => {
    const desc = '需要功能、模組、頁面、API、角色、報表、通知、權限、流程、功能二、模組二、頁面二、API二'
    const result = computeDiscoveryLimits(desc)
    expect(result).toEqual({ maxRounds: 6, maxTotalQuestions: 30 })
  })

  it('空字串 → 最少（3 輪 15 問）', () => {
    const result = computeDiscoveryLimits('')
    expect(result).toEqual({ maxRounds: 3, maxTotalQuestions: 15 })
  })
})

// ============================================================
// isDesignFeedback
// ============================================================

describe('isDesignFeedback', () => {
  it.each([
    '把標題改成紅色',
    '字體放大一點',
    '加一個搜尋功能',
    '背景換成深色',
    'change the font size',
    'add a search feature',
    'make the header bigger',
    '按鈕太小',
    '跑版了',
    '壞了',
  ])('應該接受設計回饋: "%s"', (msg) => {
    expect(isDesignFeedback(msg)).toEqual({ valid: true })
  })

  it.each([
    { msg: 'hi', reason: 'too_short' },   // length=2 → too_short 先命中
    { msg: 'hello', reason: 'greeting' },
    { msg: '你好', reason: 'too_short' },  // length=2 → too_short 先命中
    { msg: 'ok', reason: 'too_short' },    // length=2 → too_short 先命中
    { msg: 'thanks', reason: 'greeting' },
    { msg: 'nice', reason: 'greeting' },
    { msg: 'lol', reason: 'greeting' },
  ])('問候/閒聊應該拒絕: "$msg" → $reason', ({ msg, reason }) => {
    const result = isDesignFeedback(msg)
    expect(result.valid).toBe(false)
    expect(result.rejectReason).toBe(reason)
  })

  it('純數字應該拒絕為 gibberish', () => {
    expect(isDesignFeedback('12345').valid).toBe(false)
    expect(isDesignFeedback('12345').rejectReason).toBe('gibberish')
  })

  it('重複字元應該拒絕為 gibberish', () => {
    expect(isDesignFeedback('aaa').valid).toBe(false)
    expect(isDesignFeedback('aaa').rejectReason).toBe('gibberish')
  })

  it('無母音長英文應該拒絕為 gibberish', () => {
    expect(isDesignFeedback('bfgh').valid).toBe(false)
    expect(isDesignFeedback('bfgh').rejectReason).toBe('gibberish')
  })

  it('太短且無信號應該拒絕', () => {
    const result = isDesignFeedback('好')
    expect(result.valid).toBe(false)
  })

  it('>=8 字的文字應該接受', () => {
    expect(isDesignFeedback('這個網站整體感覺不錯但需要調整').valid).toBe(true)
  })

  it('閒聊（2 字）先命中 too_short', () => {
    const result = isDesignFeedback('天氣')
    expect(result.valid).toBe(false)
    expect(result.rejectReason).toBe('too_short') // length=2 → too_short 先命中
  })

  it('閒聊（>2 字）命中 chitchat', () => {
    const result = isDesignFeedback('好無聊')
    expect(result.valid).toBe(false)
    expect(result.rejectReason).toBe('chitchat')
  })
})

// ============================================================
// getPhaseStrictness
// ============================================================

describe('getPhaseStrictness', () => {
  it.each([
    ['prd_clarify', 'strict'],
    ['spec_clarify', 'strict'],
  ] as const)('%s → %s', (phase, expected) => {
    expect(getPhaseStrictness(phase)).toBe(expected)
  })

  it.each([
    ['uiux_design_preference', 'normal'],
    ['uiux_design_clarify', 'normal'],
    ['uiux_design_brief_confirm', 'normal'],
  ] as const)('%s → %s', (phase, expected) => {
    expect(getPhaseStrictness(phase)).toBe(expected)
  })

  it.each([
    ['uiux_complete', 'lenient'],
    ['deployer_complete', 'lenient'],
    ['deployer_failed', 'lenient'],
  ] as const)('%s → %s', (phase, expected) => {
    expect(getPhaseStrictness(phase)).toBe(expected)
  })

  it('未知 phase → skip', () => {
    expect(getPhaseStrictness('some_random_phase')).toBe('skip')
    expect(getPhaseStrictness('fast_generating')).toBe('skip')
  })
})
