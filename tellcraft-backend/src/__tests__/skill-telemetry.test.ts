import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  categorizeSanitizeFix,
  getSanitizePatternKeys,
  truncateFeedback,
  recordTelemetry,
  recordTelemetryBatch,
  aggregateWeeklyReport,
} from '../services/skill-telemetry'
import * as db from '../db/client'

// ============================================================
// categorizeSanitizeFix — 零 LLM regex 分類器
// ============================================================

describe('categorizeSanitizeFix', () => {
  it.each([
    ['app/page.tsx: framer-motion → motion/react', 'motion-import'],
    ["components/Hero.tsx: 自動加入 'use client'", 'use-client-missing'],
    ['app/layout.tsx: 補缺失 React hooks import', 'missing-hooks-import'],
    ['components/Modal.tsx: 補 optional chaining（bracket lookup）', 'optional-chaining-bracket'],
    ['app/page.tsx: motion.* spread props 類型衝突修復', 'motion-spread-conflict'],
    ['app/page.tsx: ?? 與 ||/&& 混用加括號修復', 'nullish-mixed-parens'],
    ['app/layout.tsx: 移除 Google Fonts <link>（應用 next/font）', 'google-fonts-link-removal'],
    ['globals.css: 移除 Google Fonts @import', 'google-fonts-import-removal'],
    ['app/posts/[id]/page.tsx: Next.js 15 async params 修復', 'next15-async-params'],
    ['app/search/page.tsx: useSearchParams Suspense boundary 修復（提取 SearchClient）', 'search-params-suspense'],
    ['app/page.tsx: broken import ./MissingThing → 生成 stub 組件', 'broken-import-stub'],
    ['app/page.tsx: named import "Foo" 不存在於 ./Bar，已移除', 'named-import-missing'],
    ['⚠️ 未知依賴 some-pkg（不在 KNOWN_PACKAGES 中）', 'unknown-dependency'],
    ['自動補充 2 個第三方依賴: react-icons, clsx', 'auto-add-dependency'],
    ['app/layout.tsx: 自動補上缺失的 <body> 標籤', 'missing-body-tag'],
    ['app/layout.tsx: 自動補上缺失的 <html> 和 <body> 標籤', 'missing-html-tags'],
    ['globals.css: 清理 Tailwind v4 語法（@theme/@import/@apply font-*）', 'tailwind-v4-cleanup'],
    ['路徑正規化: app/(auth)/login → app/login', 'path-normalize'],
    ['圖片 URL 正規化 (3 處)', 'upload-url-rewrite'],
    ['第 2 次構建通過（AI 自動修復成功）', 'build-retry-success'],
    ['第 1 次 AI 修復失敗', 'build-retry-fail'],
    ['第 1 次 AI 修復了 3 個錯誤', 'build-retry-partial'],
    ['AI 新增依賴: lucide-react, zod', 'build-retry-new-dependency'],
    ['3 次 AI 修復都失敗，降級為忽略構建錯誤部署', 'build-retry-give-up'],
    ['Build 失敗但無法解析錯誤類型', 'build-unparseable'],
    ['npm install 失敗，降級為 ignoreBuildErrors 部署', 'npm-install-fail'],
    ['移除無法安裝的依賴: broken-pkg', 'remove-bad-dependency'],
    ['構建驗證異常：EACCES', 'build-verify-exception'],
  ])('should classify %s → %s', (label, expected) => {
    expect(categorizeSanitizeFix(label)).toBe(expected)
  })

  it('should return "other" for unknown labels', () => {
    expect(categorizeSanitizeFix('some totally unknown fix label')).toBe('other')
    expect(categorizeSanitizeFix('')).toBe('other')
  })

  it('getSanitizePatternKeys returns all known keys', () => {
    const keys = getSanitizePatternKeys()
    expect(keys.length).toBeGreaterThanOrEqual(20)
    expect(new Set(keys).size).toBe(keys.length) // unique
    expect(keys).toContain('motion-import')
    expect(keys).toContain('use-client-missing')
    expect(keys).toContain('search-params-suspense')
  })
})

// ============================================================
// truncateFeedback — 前 500 字截斷
// ============================================================

describe('truncateFeedback', () => {
  it('should return empty string for nullish input', () => {
    expect(truncateFeedback(undefined)).toBe('')
    expect(truncateFeedback(null)).toBe('')
    expect(truncateFeedback('')).toBe('')
  })

  it('should return unchanged for short input', () => {
    expect(truncateFeedback('hello')).toBe('hello')
  })

  it('should truncate long input to 500 chars', () => {
    const long = 'a'.repeat(1000)
    const result = truncateFeedback(long)
    expect(result.length).toBe(500)
  })

  it('should keep 500 chars exactly', () => {
    const exact = 'b'.repeat(500)
    expect(truncateFeedback(exact)).toBe(exact)
    expect(truncateFeedback(exact).length).toBe(500)
  })
})

// ============================================================
// recordTelemetry — fire-and-forget 驗證（絕不拋錯）
// ============================================================

describe('recordTelemetry fire-and-forget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not throw when DB query succeeds', async () => {
    const querySpy = vi.spyOn(db, 'query').mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
      command: 'INSERT',
      oid: 0,
      fields: [],
    } as Awaited<ReturnType<typeof db.query>>)

    await expect(
      recordTelemetry({
        skillName: 'deployer',
        eventType: 'sanitize_fix',
        patternKey: 'motion-import',
      })
    ).resolves.toBeUndefined()

    expect(querySpy).toHaveBeenCalledOnce()
  })

  it('should swallow DB errors without throwing', async () => {
    vi.spyOn(db, 'query').mockRejectedValueOnce(new Error('DB connection lost'))

    // 關鍵：不應拋錯
    await expect(
      recordTelemetry({
        skillName: 'quality_gate',
        eventType: 'qg_rule_fix',
        patternKey: 'motion-import',
        severity: 'critical',
      })
    ).resolves.toBeUndefined()
  })

  it('should clamp oversized payload', async () => {
    const querySpy = vi.spyOn(db, 'query').mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
      command: 'INSERT',
      oid: 0,
      fields: [],
    } as Awaited<ReturnType<typeof db.query>>)

    const hugeString = 'x'.repeat(10000)
    await recordTelemetry({
      skillName: 'iteration',
      eventType: 'iteration',
      patternKey: 'scope:design',
      payload: { feedback: hugeString, other: 'small' },
    })

    expect(querySpy).toHaveBeenCalledOnce()
    const args = querySpy.mock.calls[0]?.[1] as unknown[] | undefined
    expect(args).toBeDefined()
    const payloadJson = args![7] as string | null
    expect(payloadJson).toBeTypeOf('string')
    expect(payloadJson!.length).toBeLessThanOrEqual(4200) // 4KB + a bit of JSON overhead
    // 應該有截斷標記
    expect(payloadJson).toContain('truncated')
  })

  it('recordTelemetryBatch should continue on single-event failure', async () => {
    const querySpy = vi.spyOn(db, 'query')
      .mockRejectedValueOnce(new Error('first fail'))
      .mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'INSERT',
        oid: 0,
        fields: [],
      } as Awaited<ReturnType<typeof db.query>>)
      .mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'INSERT',
        oid: 0,
        fields: [],
      } as Awaited<ReturnType<typeof db.query>>)

    await expect(
      recordTelemetryBatch([
        { skillName: 'deployer', eventType: 'sanitize_fix', patternKey: 'p1' },
        { skillName: 'deployer', eventType: 'sanitize_fix', patternKey: 'p2' },
        { skillName: 'deployer', eventType: 'sanitize_fix', patternKey: 'p3' },
      ])
    ).resolves.toBeUndefined()

    expect(querySpy).toHaveBeenCalledTimes(3)
  })

  it('recordTelemetryBatch should handle empty array', async () => {
    const querySpy = vi.spyOn(db, 'query')
    await expect(recordTelemetryBatch([])).resolves.toBeUndefined()
    expect(querySpy).not.toHaveBeenCalled()
  })
})

// ============================================================
// aggregateWeeklyReport — 空表行為
// ============================================================

describe('aggregateWeeklyReport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return empty report structure when no data', async () => {
    // 3 個 queries：topPatterns, escalations, totalRow
    vi.spyOn(db, 'queryMany').mockResolvedValue([])
    vi.spyOn(db, 'queryOne').mockResolvedValueOnce({ total: 0 })

    const report = await aggregateWeeklyReport(7)

    expect(report.windowDays).toBe(7)
    expect(report.totalEvents).toBe(0)
    expect(report.topPatterns).toEqual([])
    expect(report.escalations).toEqual([])
    expect(report.generatedAt).toBeTypeOf('string')
  })

  it('should pass days param to SQL', async () => {
    const querySpy = vi.spyOn(db, 'queryMany').mockResolvedValue([])
    vi.spyOn(db, 'queryOne').mockResolvedValueOnce({ total: 0 })

    await aggregateWeeklyReport(14)

    // 至少呼叫 2 次 queryMany（topPatterns + escalations）
    expect(querySpy).toHaveBeenCalled()
    // 每次呼叫的第二個參數應包含 '14'
    for (const call of querySpy.mock.calls) {
      const params = call[1] as unknown[]
      expect(params[0]).toBe('14')
    }
  })
})
