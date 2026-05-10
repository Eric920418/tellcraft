// ============================================================
// Phase 3a (L31.J): Spec-First Repair — fixFailingSpec
//
// 純函數 / 邊界測試（LLM call 不單元測，integration 在 production 驗）
// ============================================================

import { describe, it, expect } from 'vitest'
import {
  fixFailingSpec,
  classifyFailureRootCause,
  BDD_SIDE_ROOT_CAUSES,
  type FailureRootCause,
} from '../services/coder-generation'

describe('Phase 3a (L31.J): BDD_SIDE_ROOT_CAUSES 涵蓋', () => {
  it('包含 5 類「該修 BDD」root cause', () => {
    expect(BDD_SIDE_ROOT_CAUSES.has('var_resolution')).toBe(true)
    expect(BDD_SIDE_ROOT_CAUSES.has('spec_inconsistency')).toBe(true)
    expect(BDD_SIDE_ROOT_CAUSES.has('api_summary_mismatch')).toBe(true)
    expect(BDD_SIDE_ROOT_CAUSES.has('step_parsing')).toBe(true)
  })

  it('不包含「該修 code」root cause（防誤分流）', () => {
    expect(BDD_SIDE_ROOT_CAUSES.has('missing_column')).toBe(false)
    expect(BDD_SIDE_ROOT_CAUSES.has('wrong_status')).toBe(false)
    expect(BDD_SIDE_ROOT_CAUSES.has('field_naming')).toBe(false)
    expect(BDD_SIDE_ROOT_CAUSES.has('sql_error')).toBe(false)
    expect(BDD_SIDE_ROOT_CAUSES.has('auth_check')).toBe(false)
    expect(BDD_SIDE_ROOT_CAUSES.has('dispatch_mismatch')).toBe(false)
  })

  it('不在分類中的 unknown 也不該分流（fallback fixFailingAction）', () => {
    expect(BDD_SIDE_ROOT_CAUSES.has('unknown')).toBe(false)
  })
})

describe('Phase 3a: classifyFailureRootCause + BDD_SIDE_ROOT_CAUSES 整合分流邏輯', () => {
  // 真實 SpecFormula error 跑 classifyFailureRootCause → 確認分流方向正確
  const cases: Array<{ name: string; error: string; scenarioName?: string; expectedRoute: 'bdd' | 'code' | 'skip' }> = [
    {
      name: 'VAR 解析失敗 → BDD',
      error: 'VAR 解析失敗：無法解析 $User.id（未在 Background 宣告）',
      expectedRoute: 'bdd',
    },
    {
      name: 'API summary 找不到 → BDD',
      error: '找不到 API 操作 "新增一筆收支記錄"（actionsYml 沒有對應 summary）',
      expectedRoute: 'bdd',
    },
    {
      name: 'Step parsing 錯（花括號）→ BDD',
      error: '步驟無法匹配：準備一個{顧客}',
      expectedRoute: 'bdd',
    },
    {
      name: 'EntityValidate 前置錯 → BDD',
      error: '[entityvalidate] 前置驗證失敗',
      expectedRoute: 'bdd',
    },
    {
      name: 'Spec 內部矛盾（scenario 名說 null + DataTable expect UUID）→ BDD',
      error: 'expect: [550e8400-e29b-41d4-a716-446655440000], actual: [null]',
      scenarioName: 'After update, deletedAt 應變為 null',
      expectedRoute: 'bdd',
    },
    {
      name: 'SQL column 不存在 → CODE（不是 BDD 問題）',
      error: 'column "user_email" does not exist',
      expectedRoute: 'code',
    },
    {
      name: 'HTTP status 不對 → CODE',
      error: 'HTTP 狀態碼不匹配：預期 201，實際 200',
      expectedRoute: 'code',
    },
    {
      name: 'Field naming 錯 → CODE',
      error: '值不匹配：欄位 totalAmount 預期 100，實際 null',
      expectedRoute: 'code',
    },
    {
      name: 'Auth check → CODE（會走 removeAuthChecks）',
      error: 'Unauthorized: missing JWT token',
      expectedRoute: 'code',
    },
    {
      name: '空 error → unknown → CODE（fallback）',
      error: '',
      expectedRoute: 'skip',  // unknown 不在 BDD_SIDE，fallback fixFailingAction
    },
  ]

  for (const c of cases) {
    it(c.name, () => {
      const rc = classifyFailureRootCause(c.error, c.scenarioName)
      const isBddSide = BDD_SIDE_ROOT_CAUSES.has(rc as FailureRootCause)
      if (c.expectedRoute === 'bdd') {
        expect(isBddSide).toBe(true)
      } else {
        expect(isBddSide).toBe(false)
      }
    })
  }
})

describe('Phase 3a: fixFailingSpec 防呆 — 不該 BDD 的 rootCause 直接 noop', () => {
  it('rootCause = missing_column（code 類）→ 直接 return 原 content + 0 cost', async () => {
    const originalContent = `# Action: get_user
# [GET] /api/users/:id
# Summary: Get User
Feature: Get User

  Rule: 後置（回應）

    Example: Returns user
      When (No Actor) Get User, call table:
        | id |
        | $User.id |
      Then Get User(200)回應, with table:
        | id |
        | $User.id |
`
    const result = await fixFailingSpec(
      'Get User',
      originalContent,
      [{ scenarioName: 'Returns user', ruleName: '後置（回應）', error: 'column "user_email" does not exist' }],
      'CREATE TABLE users (id UUID PRIMARY KEY)',
      'missing_column' as FailureRootCause,  // code-side root cause
    )

    expect(result.fixedFeatureContent).toBe(originalContent)  // 沒改
    expect(result.usage.callCount).toBe(0)  // 沒花錢
    expect(result.usage.costUsd).toBe(0)
  })

  it('rootCause = unknown → 直接 return 原 content + 0 cost', async () => {
    const result = await fixFailingSpec(
      'X',
      'unchanged',
      [{ scenarioName: 'x', ruleName: 'r', error: 'unknown error' }],
      '',
      'unknown' as FailureRootCause,
    )

    expect(result.fixedFeatureContent).toBe('unchanged')
    expect(result.usage.callCount).toBe(0)
  })
})
