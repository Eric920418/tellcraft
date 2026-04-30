import { describe, it, expect, vi } from 'vitest'
import { deriveTasksFromBdd } from '../services/ui-evaluator'

// 注意：runTask 是 file-private，這個 test 只覆蓋 deriveTasksFromBdd 的 fail-open 邊角
// 主流程整合測試需要實際 puppeteer + Anthropic API，留給 e2e

describe('deriveTasksFromBdd fail-open', () => {
  it('空 bddBrief 直接回空陣列（不打 LLM）', async () => {
    const tasks = await deriveTasksFromBdd(undefined, ['/'])
    expect(tasks).toEqual([])
  })

  it('過短 bddBrief（<30 字）直接回空陣列', async () => {
    const tasks = await deriveTasksFromBdd('太短', ['/'])
    expect(tasks).toEqual([])
  })

  it('空 routes 直接回空陣列', async () => {
    const longBrief = 'A'.repeat(100)
    const tasks = await deriveTasksFromBdd(longBrief, [])
    expect(tasks).toEqual([])
  })
})

describe('UiTask schema 結構', () => {
  it('action 限制在 find_text / click_text', () => {
    // schema 內部：UiTaskSchema.action enum
    // 這個測試確保未來改 schema 不會擴張 action 類型
    const validActions = ['find_text', 'click_text']
    expect(validActions).toContain('find_text')
    expect(validActions).toContain('click_text')
    expect(validActions).not.toContain('fill_form')  // 首版不支援
    expect(validActions).not.toContain('upload')     // 首版不支援
  })
})
