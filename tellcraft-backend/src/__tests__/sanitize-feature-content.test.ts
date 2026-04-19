// ============================================================
// sanitizeFeatureContent — 規則 4：entity 花括號剝除
// 覆蓋 `準備一個{entity}` / `應該存在一個{entity}` / `應該不存在一個{entity}`
// LLM 偶爾照抄 prompt 模板的 {entity} placeholder → SpecFormula regex 字元類不含 {} → matchStepToInstruction 全失敗
// ============================================================

import { describe, it, expect } from 'vitest'
import { sanitizeFeatureContent } from '../services/formulation'

describe('sanitizeFeatureContent — entity 花括號剝除（規則 4）', () => {
  it('剝除 `準備一個{顧客}` 的大括號', () => {
    const input = `Feature: 下單
  Background:
    Given 準備一個{顧客}, with table:
      | >Customer1.id | name |
      | <customer1Id  | 小明 |`
    const { content, fixes } = sanitizeFeatureContent(input)
    expect(content).toContain('準備一個顧客, with table:')
    expect(content).not.toContain('{顧客}')
    expect(fixes.some(f => f.includes('準備一個{顧客}'))).toBe(true)
  })

  it('剝除 `應該存在一個{店家}` 的大括號', () => {
    const input = `    And 應該存在一個{店家}, with table:
      | id        | name   |
      | $store1Id | 小店家 |`
    const { content, fixes } = sanitizeFeatureContent(input)
    expect(content).toContain('應該存在一個店家, with table:')
    expect(content).not.toContain('{店家}')
    expect(fixes.some(f => f.includes('應該存在一個{店家}'))).toBe(true)
  })

  it('剝除 `應該不存在一個{訂單}` 的大括號', () => {
    const input = `    And 應該不存在一個{訂單}, with table:
      | id         |
      | $orderId   |`
    const { content, fixes } = sanitizeFeatureContent(input)
    expect(content).toContain('應該不存在一個訂單, with table:')
    expect(content).not.toContain('{訂單}')
    expect(fixes.some(f => f.includes('應該不存在一個{訂單}'))).toBe(true)
  })

  it('原本就正確的 `準備一個商品` 維持不變且不產生 fix', () => {
    const input = `Feature: 建立訂單
  Background:
    Given 準備一個商品, with table:
      | >Product1.id | name   | price |
      | <product1Id  | 牛肉麵 | 120   |`
    const { content, fixes } = sanitizeFeatureContent(input)
    expect(content).toBe(input)
    // 規則 4 不應觸發任何 fix
    expect(fixes.filter(f => f.startsWith('entity 花括號剝除'))).toHaveLength(0)
  })

  it('DataTable 內 JSON 值 `[{"productId":"$X"}]` 不被誤傷', () => {
    // prefix 鎖定（準備一個 / 應該(不)?存在一個）→ DataTable 的 JSON 物件前綴不會是這三個關鍵字 → 不該被剝
    const input = `    When (UID="$Customer.id") 建立訂單, call table:
      | items                                  |
      | [{"productId":"$product1Id","qty":2}]  |`
    const { content, fixes } = sanitizeFeatureContent(input)
    expect(content).toBe(input)
    expect(fixes.filter(f => f.startsWith('entity 花括號剝除'))).toHaveLength(0)
  })

  it('同一 Feature 內多個大括號步驟全部被修復', () => {
    const input = `Feature: 建立訂單
  Background:
    Given 準備一個{顧客}, with table:
      | >Customer1.id | name |
      | <customer1Id  | 小明 |
    And 準備一個{商品}, with table:
      | >Product1.id | name   |
      | <product1Id  | 牛肉麵 |

  Scenario: 成功下單
    When (UID="$customer1Id") 建立訂單, call table:
      | productId   |
      | $product1Id |
    Then 建立訂單(201)回應, with table:
      | id        |
      | $notnull  |
    And 應該存在一個{訂單}, with table:
      | id       |
      | $notnull |
    And 應該不存在一個{錯誤日誌}, with table:
      | orderId  |
      | $notnull |`
    const { content, fixes } = sanitizeFeatureContent(input)
    expect(content).not.toContain('{顧客}')
    expect(content).not.toContain('{商品}')
    expect(content).not.toContain('{訂單}')
    expect(content).not.toContain('{錯誤日誌}')
    expect(content).toContain('準備一個顧客, with table:')
    expect(content).toContain('準備一個商品, with table:')
    expect(content).toContain('應該存在一個訂單, with table:')
    expect(content).toContain('應該不存在一個錯誤日誌, with table:')
    // 4 個步驟 → 4 個 fix
    expect(fixes.filter(f => f.startsWith('entity 花括號剝除'))).toHaveLength(4)
  })
})
