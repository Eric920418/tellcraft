import { describe, it, expect } from 'vitest'
import { validateActionsYml, autoCorrectSummaries } from '../services/actions-design'

const FEATURES = [
  { name: '觸發緊急求助', actionName: 'triggerSosAlert' },
  { name: '解除緊急求助', actionName: 'cancelSosAlert' },
  { name: '取消誤觸求助', actionName: 'dismissFalseAlarm' },
  { name: '位置歷史紀錄', actionName: 'getLocationHistory' },
  { name: '安全資訊圖層查詢', actionName: 'querySafetyLayer' },
]

function buildActionsYml(actions: Array<{ name: string; summary: string }>): string {
  const actionsStr = actions.map(a => `  - name: ${a.name}\n    summary: "${a.summary}"\n    featureFile: "spec/features/${a.summary}.feature"\n    rules:\n      - rule: "測試規則"\n        type: "前置（狀態）"\n        step: "測試 step"`).join('\n')
  return `project:\n  name: test\n  framework: next.js\n  database: postgresql\n\nactions:\n${actionsStr}\n\ntypes:\n  User:\n    description: 用戶\n    properties:\n      id:\n        type: string\n    required:\n      - id`
}

// ============================================================
// autoCorrectSummaries
// ============================================================

describe('autoCorrectSummaries', () => {
  it('修正改寫的 summary', () => {
    const yml = buildActionsYml([
      { name: 'triggerSosAlert', summary: '觸發 SOS 求助' },       // 被 LLM 改寫
      { name: 'cancelSosAlert', summary: '取消緊急求助' },          // 被 LLM 改寫
      { name: 'dismissFalseAlarm', summary: '取消誤觸求助' },       // 正確
      { name: 'getLocationHistory', summary: '位置歷史紀錄' },      // 正確
      { name: 'querySafetyLayer', summary: '安全資訊圖層查詢' },    // 正確
    ])

    const result = autoCorrectSummaries(yml, FEATURES)

    expect(result.corrections).toHaveLength(2)
    expect(result.corrections[0]).toContain('觸發 SOS 求助')
    expect(result.corrections[0]).toContain('觸發緊急求助')
    expect(result.corrections[1]).toContain('取消緊急求助')
    expect(result.corrections[1]).toContain('解除緊急求助')
    expect(result.missingFeatures).toHaveLength(0)

    // 修正後驗證應該通過
    const validation = validateActionsYml(result.correctedYml, FEATURES)
    expect(validation.valid).toBe(true)
  })

  it('偵測缺失的 features', () => {
    const yml = buildActionsYml([
      { name: 'triggerSosAlert', summary: '觸發緊急求助' },
      { name: 'cancelSosAlert', summary: '解除緊急求助' },
      // 缺少 dismissFalseAlarm, getLocationHistory, querySafetyLayer
    ])

    const result = autoCorrectSummaries(yml, FEATURES)

    expect(result.corrections).toHaveLength(0)
    expect(result.missingFeatures).toHaveLength(3)
    expect(result.missingFeatures).toContain('取消誤觸求助')
    expect(result.missingFeatures).toContain('位置歷史紀錄')
    expect(result.missingFeatures).toContain('安全資訊圖層查詢')
  })

  it('同時處理改寫和缺失', () => {
    const yml = buildActionsYml([
      { name: 'triggerSosAlert', summary: '觸發SOS' },  // 改寫
      { name: 'cancelSosAlert', summary: '解除緊急求助' }, // 正確
      // 缺少 3 個
    ])

    const result = autoCorrectSummaries(yml, FEATURES)

    expect(result.corrections).toHaveLength(1)
    expect(result.corrections[0]).toContain('觸發SOS')
    expect(result.corrections[0]).toContain('觸發緊急求助')
    expect(result.missingFeatures).toHaveLength(3)
  })

  it('YAML 解析失敗時返回原始 YAML', () => {
    const result = autoCorrectSummaries('not valid yaml: [[[', FEATURES)

    expect(result.correctedYml).toBe('not valid yaml: [[[')
    expect(result.corrections).toHaveLength(0)
    expect(result.missingFeatures).toHaveLength(5)
  })

  it('所有 summary 都正確時不做修改', () => {
    const yml = buildActionsYml([
      { name: 'triggerSosAlert', summary: '觸發緊急求助' },
      { name: 'cancelSosAlert', summary: '解除緊急求助' },
      { name: 'dismissFalseAlarm', summary: '取消誤觸求助' },
      { name: 'getLocationHistory', summary: '位置歷史紀錄' },
      { name: 'querySafetyLayer', summary: '安全資訊圖層查詢' },
    ])

    const result = autoCorrectSummaries(yml, FEATURES)

    expect(result.corrections).toHaveLength(0)
    expect(result.missingFeatures).toHaveLength(0)
  })

  it('修正後 featureFile 也同步更新', () => {
    const yml = buildActionsYml([
      { name: 'triggerSosAlert', summary: '觸發 SOS 求助' },
    ])

    const result = autoCorrectSummaries(yml, [
      { name: '觸發緊急求助', actionName: 'triggerSosAlert' },
    ])

    expect(result.correctedYml).toContain('觸發緊急求助.feature')
    expect(result.correctedYml).not.toContain('觸發 SOS 求助.feature')
  })
})

// ============================================================
// validateActionsYml
// ============================================================

describe('validateActionsYml', () => {
  it('所有 summary 匹配時驗證通過', () => {
    const yml = buildActionsYml([
      { name: 'triggerSosAlert', summary: '觸發緊急求助' },
      { name: 'cancelSosAlert', summary: '解除緊急求助' },
      { name: 'dismissFalseAlarm', summary: '取消誤觸求助' },
      { name: 'getLocationHistory', summary: '位置歷史紀錄' },
      { name: 'querySafetyLayer', summary: '安全資訊圖層查詢' },
    ])

    const result = validateActionsYml(yml, FEATURES)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('summary 不匹配時報錯', () => {
    const yml = buildActionsYml([
      { name: 'triggerSosAlert', summary: '觸發 SOS 求助' },
      { name: 'cancelSosAlert', summary: '解除緊急求助' },
      { name: 'dismissFalseAlarm', summary: '取消誤觸求助' },
      { name: 'getLocationHistory', summary: '位置歷史紀錄' },
      { name: 'querySafetyLayer', summary: '安全資訊圖層查詢' },
    ])

    const result = validateActionsYml(yml, FEATURES)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('觸發緊急求助'))).toBe(true)
  })

  it('缺少 action 時報錯', () => {
    const yml = buildActionsYml([
      { name: 'triggerSosAlert', summary: '觸發緊急求助' },
    ])

    const result = validateActionsYml(yml, FEATURES)
    expect(result.valid).toBe(false)
    expect(result.errors.filter(e => e.includes('沒有對應的 Action')).length).toBe(4)
  })

  it('無效 YAML 報解析錯誤', () => {
    const result = validateActionsYml('not: [valid yaml', FEATURES)
    expect(result.valid).toBe(false)
  })

  it('多餘 action 報 actionName 不匹配', () => {
    const yml = buildActionsYml([
      { name: 'triggerSosAlert', summary: '觸發緊急求助' },
      { name: 'cancelSosAlert', summary: '解除緊急求助' },
      { name: 'dismissFalseAlarm', summary: '取消誤觸求助' },
      { name: 'getLocationHistory', summary: '位置歷史紀錄' },
      { name: 'querySafetyLayer', summary: '安全資訊圖層查詢' },
      { name: 'unknownAction', summary: '不存在的功能' },
    ])

    const result = validateActionsYml(yml, FEATURES)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('unknownAction') && e.includes('actionName 不匹配'))).toBe(true)
  })

  it('rules type 錯誤報錯', () => {
    const yml = `project:
  name: test
actions:
  - name: triggerSosAlert
    summary: "觸發緊急求助"
    rules:
      - rule: "測試"
        type: "錯誤的類型"
        step: "test"
types: {}`

    const result = validateActionsYml(yml, [{ name: '觸發緊急求助', actionName: 'triggerSosAlert' }])
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('不在四類之中'))).toBe(true)
  })
})

// ============================================================
// 端對端：autoCorrect + validate 組合
// ============================================================

describe('autoCorrect + validate 組合', () => {
  it('LLM 改寫 summary 時，autoCorrect 修正後 validate 通過', () => {
    // 模擬 LLM 生成的 YAML：summary 被改寫
    const llmYml = buildActionsYml([
      { name: 'triggerSosAlert', summary: '發送 SOS 緊急求助信號' },
      { name: 'cancelSosAlert', summary: '取消 SOS 求助' },
      { name: 'dismissFalseAlarm', summary: '撤回誤觸的求助通知' },
      { name: 'getLocationHistory', summary: '查詢位置歷程' },
      { name: 'querySafetyLayer', summary: '查詢安全資訊' },
    ])

    // 直接驗證會失敗
    const directValidation = validateActionsYml(llmYml, FEATURES)
    expect(directValidation.valid).toBe(false)
    expect(directValidation.errors.length).toBe(5)

    // autoCorrect 後驗證通過
    const corrected = autoCorrectSummaries(llmYml, FEATURES)
    expect(corrected.corrections).toHaveLength(5)
    expect(corrected.missingFeatures).toHaveLength(0)

    const validation = validateActionsYml(corrected.correctedYml, FEATURES)
    expect(validation.valid).toBe(true)
  })

  it('15 個 Feature 截斷情境：部分 action 缺失 + 部分 summary 改寫', () => {
    // 模擬 YAML 截斷：只有前 3 個 action，且第 1 個 summary 被改寫
    const truncatedYml = buildActionsYml([
      { name: 'triggerSosAlert', summary: '發送緊急求助' },  // 改寫
      { name: 'cancelSosAlert', summary: '解除緊急求助' },    // 正確
      { name: 'dismissFalseAlarm', summary: '取消誤觸求助' }, // 正確
      // 缺少 2 個
    ])

    const corrected = autoCorrectSummaries(truncatedYml, FEATURES)

    // 改寫的被修正
    expect(corrected.corrections).toHaveLength(1)
    expect(corrected.corrections[0]).toContain('發送緊急求助')
    expect(corrected.corrections[0]).toContain('觸發緊急求助')

    // 缺失的被偵測
    expect(corrected.missingFeatures).toHaveLength(2)
    expect(corrected.missingFeatures).toContain('位置歷史紀錄')
    expect(corrected.missingFeatures).toContain('安全資訊圖層查詢')

    // 修正後的 summary 驗證通過（只檢查已有的 3 個）
    // 但整體驗證仍失敗（因為缺少 2 個 feature 的 action）
    const validation = validateActionsYml(corrected.correctedYml, FEATURES)
    expect(validation.valid).toBe(false)
    expect(validation.errors.filter(e => e.includes('summary 不匹配'))).toHaveLength(2) // 只剩缺失的
    expect(validation.errors.filter(e => e.includes('觸發緊急求助'))).toHaveLength(0) // 改寫的已修正
  })
})
