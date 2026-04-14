/**
 * PR1 — ui-evaluator.ts 單元測試
 *
 * 涵蓋可測試的邊界：
 * - Feature flag OFF（預設）時立即 softFail
 * - Rubric .md 檔可載入且含核心 QA 維度
 * - UiEvaluationReport schema 結構
 *
 * 不涵蓋：
 * - 真實 Puppeteer + ephemeral dev server（整合測試層級，需 chromium）
 * - 真實 Anthropic Vision 呼叫（e2e 測試，需 API key）
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

describe('ui-evaluator feature flag', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...OLD_ENV }
  })

  afterEach(() => {
    process.env = OLD_ENV
  })

  it('ENABLE_UI_EVALUATOR 未設定時，evaluateUi 立即 softFail，不啟動 puppeteer', async () => {
    delete process.env.ENABLE_UI_EVALUATOR
    const { evaluateUi } = await import('../services/ui-evaluator')
    const result = await evaluateUi({
      code: { pages: [], components: [], styles: '' } as any,
      tailwindConfig: '',
    })
    expect(result.softFail).toBe(true)
    expect(result.report.passed).toBe(true)
    expect(result.report.issues).toEqual([])
    expect(result.skipReason).toContain('ENABLE_UI_EVALUATOR=false')
  })

  it('ENABLE_UI_EVALUATOR=false 顯式設定也是 softFail', async () => {
    process.env.ENABLE_UI_EVALUATOR = 'false'
    const { evaluateUi } = await import('../services/ui-evaluator')
    const result = await evaluateUi({
      code: { pages: [], components: [], styles: '' } as any,
      tailwindConfig: '',
    })
    expect(result.softFail).toBe(true)
  })
})

describe('ui-evaluator rubric 檔案', () => {
  it('base.md 存在且涵蓋四大 category', () => {
    const rubricPath = path.join(__dirname, '..', 'services', 'ui-evaluator-rubric', 'base.md')
    expect(fs.existsSync(rubricPath)).toBe(true)
    const content = fs.readFileSync(rubricPath, 'utf-8')
    expect(content).toContain('layout_broken')
    expect(content).toContain('content_missing')
    expect(content).toContain('interaction_dead')
    expect(content).toContain('visual_regression')
  })

  it('rubric 明示 Evaluator 不能看原始碼', () => {
    const rubricPath = path.join(__dirname, '..', 'services', 'ui-evaluator-rubric', 'base.md')
    const content = fs.readFileSync(rubricPath, 'utf-8')
    // 黑盒驗收的核心約束
    expect(content).toContain('禁止提到 class 名稱')
    expect(content).toContain('原始碼')
  })
})

describe('ui-evaluator preview-runner 整合', () => {
  it('extractRoutes 正確處理 app/ 路徑前綴與動態路由', async () => {
    const { extractRoutes } = await import('../services/preview-runner')
    const routes = extractRoutes([
      { path: 'app/page.tsx', content: '' },
      { path: 'app/products/page.tsx', content: '' },
      { path: 'app/products/[id]/page.tsx', content: '' },
      { path: 'app/[locale]/about/page.tsx', content: '' },
    ] as any)
    const paths = routes.map(r => r.route)
    expect(paths).toContain('/')
    expect(paths).toContain('/products')
    expect(paths).toContain('/products/test-id')
    expect(paths).toContain('/about')
  })
})
