// ============================================================
// Feature Alignment Gate — L31.I: Cost Guardrail
// 防止 alignment gate 失控修復（c9cefcc6 案例：81 calls / $8.62）
//
// 兩層測試：
// 1. checkAlignmentCostBreach 純函數 unit test（核心邏輯）
// 2. runFeatureAlignmentGate sanity check（沒真矛盾不觸發）
// ============================================================

import { describe, it, expect } from 'vitest'
import {
  checkAlignmentCostBreach,
  runFeatureAlignmentGate,
} from '../services/feature-alignment-gate'

describe('Phase 5 (L31.I): checkAlignmentCostBreach helper', () => {
  it('callCount 超過上限 → breached: calls', () => {
    const r = checkAlignmentCostBreach(25, 1.0, 20, 3.0)
    expect(r.breached).toBe(true)
    expect(r.reason).toBe('calls')
  })

  it('costUsd 超過上限 → breached: cost', () => {
    const r = checkAlignmentCostBreach(5, 5.0, 20, 3.0)
    expect(r.breached).toBe(true)
    expect(r.reason).toBe('cost')
  })

  it('callCount = 上限（>=）→ breached', () => {
    const r = checkAlignmentCostBreach(20, 0, 20, 3.0)
    expect(r.breached).toBe(true)
    expect(r.reason).toBe('calls')
  })

  it('正常範圍內 → not breached', () => {
    const r = checkAlignmentCostBreach(5, 0.5, 20, 3.0)
    expect(r.breached).toBe(false)
    expect(r.reason).toBeUndefined()
  })

  it('兩個都超 → 先報 calls', () => {
    const r = checkAlignmentCostBreach(30, 5.0, 20, 3.0)
    expect(r.breached).toBe(true)
    expect(r.reason).toBe('calls')  // calls 先檢查
  })

  it('真實 c9cefcc6 場景（81 calls, $8.62） → breached', () => {
    const r = checkAlignmentCostBreach(81, 8.62, 20, 3.0)
    expect(r.breached).toBe(true)
  })
})

describe('Phase 5 (L31.I): runFeatureAlignmentGate integration sanity', () => {
  // 「沒真矛盾的乾淨 feature」不觸發 LLM call → 不會走 guardrail 路徑
  // 這驗證了「正常情況不誤觸發 guardrail」+ 「不打破既有 pass 流程」
  const ACTIONS_YML = `actions:
  - name: list_service_items
    summary: List Service Items
    http_method: GET
    http_path: /api/list_service_items
    input: {}
    output: {}
`
  const SCHEMA_SQL = `CREATE TABLE service_items (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  image_url TEXT
);`
  const ENTITY_MAPPING = `entity_to_table_mapping:
  - ServiceItem: service_items
`
  const CLEAN_FEATURE = `# Action: list_service_items
# [GET] /api/list_service_items
# Summary: List Service Items
Feature: List Service Items

  Rule: 後置（回應）

    Example: Returns items
      Given 準備一個ServiceItem, with table:
        | name | imageUrl              |
        | X    | https://cdn.x/img.png |
      When (No Actor) List Service Items, call table:
        | dummy |
        | _     |
      Then List Service Items(200)回應, with table:
        | name | imageUrl              |
        | X    | https://cdn.x/img.png |
`

  it('乾淨 feature 不觸發 LLM call，alignment gate pass', async () => {
    const result = await runFeatureAlignmentGate({
      features: [{ name: 'List Service Items', actionName: 'list_service_items', content: CLEAN_FEATURE }],
      actionsYml: ACTIONS_YML,
      schemaSql: SCHEMA_SQL,
      entityMapping: ENTITY_MAPPING,
    })

    expect(result.passed).toBe(true)
    expect(result.blocked).toBe(false)
    expect(result.blockMessage).toBeUndefined()
  })
})
