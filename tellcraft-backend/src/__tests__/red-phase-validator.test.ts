import { describe, it, expect } from 'vitest'
import { executeRedPhase, classifyRedPhaseFailure, type RedPhaseInput } from '../services/red-phase-validator'
import type { StepResult } from '../services/specformula-runner'
import { StubHttpAdapter } from '../lib/specformula/http/stub-adapter'

// ============================================================
// 測試用 actionsYml 工廠
// ============================================================

function buildActionsYml(actions: Array<{
  name: string
  summary: string
  method?: string
  path?: string
  rules?: Array<{ type: string }>
}>): string {
  const actionsStr = actions.map(a => {
    let yml = `  - name: ${a.name}\n    summary: "${a.summary}"`
    if (a.method) yml += `\n    method: ${a.method}`
    if (a.path) yml += `\n    path: ${a.path}`
    if (a.rules) {
      yml += '\n    rules:'
      for (const r of a.rules) {
        yml += `\n      - rule: "test"\n        type: "${r.type}"\n        step: "test step"`
      }
    }
    return yml
  }).join('\n')
  return `project:\n  name: test\n\nactions:\n${actionsStr}\n\ntypes:\n  User:\n    description: 用戶`
}

// ============================================================
// 測試用 Feature 工廠
// ============================================================

function buildFeature(opts: {
  actionName: string
  method?: string
  path?: string
  summary?: string
  featureName?: string
  entitySetup?: string
  statusCode?: number
  executionKey?: string
}): string {
  const method = opts.method || 'POST'
  const path = opts.path || `/api/${opts.actionName}`
  const summary = opts.summary || opts.featureName || '建立訂單'
  const featureName = opts.featureName || summary
  const statusCode = opts.statusCode || 201
  const executionKey = opts.executionKey || 'orderId'

  let content = `# Action: ${opts.actionName}\n# [${method}] ${path}\n# Summary: ${summary}\n\nFeature: ${featureName}`

  if (opts.entitySetup) {
    content += `\n  Background:\n    Given 準備一個${opts.entitySetup}, with table:\n      | id | name |\n      | 1  | test |`
  }

  content += `\n  Rule: 後置（狀態）- 成功建立
    Example: 成功建立
      When (UID="$User1.id") ${summary}, call table:
        | name |
        | test |
      Then ${summary}(${statusCode})回應, with table:
        | >${opts.actionName}1.id | status |
        | <${executionKey}        | ok     |`

  return content
}

const SCHEMA_SQL = `
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
`

const ENTITY_MAPPING = `
entity_to_table_mapping:
  - Order: orders
  - User: users
`

// ============================================================
// 測試
// ============================================================

describe('RED Phase Validator', () => {
  describe('全部通過（no-op）', () => {
    it('Feature 和 actionsYml 完全一致時，零問題通過', () => {
      const input: RedPhaseInput = {
        features: [{
          name: '建立訂單',
          actionName: 'createOrder',
          content: buildFeature({
            actionName: 'createOrder',
            method: 'POST',
            summary: '建立訂單',
            featureName: '建立訂單',
            entitySetup: 'User',
            statusCode: 201,
            executionKey: 'orderId',
          }),
        }],
        actionsYml: buildActionsYml([{
          name: 'createOrder',
          summary: '建立訂單',
          method: 'POST',
          path: '/api/createOrder',
          rules: [{ type: '後置（狀態）' }],
        }]),
        schemaSql: SCHEMA_SQL,
        entityMapping: ENTITY_MAPPING,
      }

      const result = executeRedPhase(input)
      expect(result.passed).toBe(true)
      expect(result.errors).toBe(0)
      expect(result.checkedFeatures).toBe(1)
    })
  })

  describe('Check 1: Action 存在性', () => {
    it('Feature 的 Action 在 actionsYml 中找不到 → error', () => {
      const input: RedPhaseInput = {
        features: [{
          name: '建立訂單',
          actionName: 'createOrder',
          content: buildFeature({ actionName: 'createOrder', summary: '建立訂單', featureName: '建立訂單' }),
        }],
        actionsYml: buildActionsYml([{
          name: 'deleteOrder',
          summary: '刪除訂單',
          rules: [{ type: '後置（狀態）' }],
        }]),
        schemaSql: SCHEMA_SQL,
        entityMapping: ENTITY_MAPPING,
      }

      const result = executeRedPhase(input)
      expect(result.passed).toBe(false)
      expect(result.errors).toBe(1)
      expect(result.issues[0].issueType).toBe('missing_action')
    })
  })

  describe('Check 2: HTTP Method 一致性', () => {
    it('Feature 寫 POST 但 actionsYml 推導為 GET → error', () => {
      const input: RedPhaseInput = {
        features: [{
          name: '查詢訂單',
          actionName: 'getOrder',
          content: buildFeature({
            actionName: 'getOrder',
            method: 'POST',  // Feature 寫 POST
            summary: '查詢訂單',
            featureName: '查詢訂單',
          }),
        }],
        actionsYml: buildActionsYml([{
          name: 'getOrder',
          summary: '查詢訂單',
          method: 'GET',  // actionsYml 是 GET
          rules: [{ type: '後置（回應）' }],  // 只有回應規則 → isQueryAction = true
        }]),
        schemaSql: SCHEMA_SQL,
        entityMapping: ENTITY_MAPPING,
      }

      const result = executeRedPhase(input)
      expect(result.passed).toBe(false)
      expect(result.issues.some(i => i.issueType === 'method_mismatch')).toBe(true)
    })
  })

  describe('Check 3: Path 一致性', () => {
    it('Feature path 與 actionsYml path 不同 → warning', () => {
      const input: RedPhaseInput = {
        features: [{
          name: '建立訂單',
          actionName: 'createOrder',
          content: buildFeature({
            actionName: 'createOrder',
            method: 'POST',
            path: '/api/orders',  // Feature 寫 /api/orders
            summary: '建立訂單',
            featureName: '建立訂單',
          }),
        }],
        actionsYml: buildActionsYml([{
          name: 'createOrder',
          summary: '建立訂單',
          method: 'POST',
          path: '/api/create-order',  // actionsYml 推導的不同
          rules: [{ type: '後置（狀態）' }],
        }]),
        schemaSql: SCHEMA_SQL,
        entityMapping: ENTITY_MAPPING,
      }

      const result = executeRedPhase(input)
      // path 不一致是 warning
      expect(result.warnings).toBeGreaterThanOrEqual(1)
      expect(result.issues.some(i => i.issueType === 'path_mismatch')).toBe(true)
    })
  })

  describe('Check 4: Summary 一致性', () => {
    it('Feature name 和 actionsYml summary 不同 → error', () => {
      const input: RedPhaseInput = {
        features: [{
          name: '新增訂單',
          actionName: 'createOrder',
          content: buildFeature({
            actionName: 'createOrder',
            summary: '新增訂單',      // Feature 用「新增訂單」
            featureName: '新增訂單',
          }),
        }],
        actionsYml: buildActionsYml([{
          name: 'createOrder',
          summary: '建立訂單',         // actionsYml 用「建立訂單」
          rules: [{ type: '後置（狀態）' }],
        }]),
        schemaSql: SCHEMA_SQL,
        entityMapping: ENTITY_MAPPING,
      }

      const result = executeRedPhase(input)
      expect(result.passed).toBe(false)
      expect(result.issues.some(i => i.issueType === 'summary_mismatch')).toBe(true)
    })
  })

  describe('Check 6: Status Code 合理性', () => {
    it('GET action 預期 201 → error', () => {
      const input: RedPhaseInput = {
        features: [{
          name: '查詢訂單',
          actionName: 'getOrder',
          content: buildFeature({
            actionName: 'getOrder',
            method: 'GET',
            summary: '查詢訂單',
            featureName: '查詢訂單',
            statusCode: 201,  // GET 不應該 201
          }),
        }],
        actionsYml: buildActionsYml([{
          name: 'getOrder',
          summary: '查詢訂單',
          method: 'GET',
          rules: [{ type: '後置（回應）' }],
        }]),
        schemaSql: SCHEMA_SQL,
        entityMapping: ENTITY_MAPPING,
      }

      const result = executeRedPhase(input)
      expect(result.issues.some(i => i.issueType === 'status_mismatch' && i.severity === 'error')).toBe(true)
    })

    it('POST action 預期 200（登入）→ warning', () => {
      const input: RedPhaseInput = {
        features: [{
          name: '使用者登入',
          actionName: 'login',
          content: buildFeature({
            actionName: 'login',
            method: 'POST',
            summary: '使用者登入',
            featureName: '使用者登入',
            statusCode: 200,  // POST 但 200（登入是合理的）
          }),
        }],
        actionsYml: buildActionsYml([{
          name: 'login',
          summary: '使用者登入',
          method: 'POST',
          rules: [{ type: '後置（狀態）' }],
        }]),
        schemaSql: SCHEMA_SQL,
        entityMapping: ENTITY_MAPPING,
      }

      const result = executeRedPhase(input)
      const statusIssues = result.issues.filter(i => i.issueType === 'status_mismatch')
      // POST + 200 is a warning, not error
      expect(statusIssues.every(i => i.severity === 'warning')).toBe(true)
    })
  })

  describe('Check 7: Entity 對應性', () => {
    it('Feature 引用不存在的 entity → error', () => {
      const input: RedPhaseInput = {
        features: [{
          name: '建立訂單',
          actionName: 'createOrder',
          content: buildFeature({
            actionName: 'createOrder',
            summary: '建立訂單',
            featureName: '建立訂單',
            entitySetup: 'Product',  // schema 中沒有 Product
          }),
        }],
        actionsYml: buildActionsYml([{
          name: 'createOrder',
          summary: '建立訂單',
          rules: [{ type: '後置（狀態）' }],
        }]),
        schemaSql: SCHEMA_SQL,
        entityMapping: ENTITY_MAPPING,
      }

      const result = executeRedPhase(input)
      expect(result.issues.some(i => i.issueType === 'entity_mismatch')).toBe(true)
    })

    it('Feature 引用存在的 entity → 通過', () => {
      const input: RedPhaseInput = {
        features: [{
          name: '建立訂單',
          actionName: 'createOrder',
          content: buildFeature({
            actionName: 'createOrder',
            summary: '建立訂單',
            featureName: '建立訂單',
            entitySetup: 'User',  // schema 中有 User
          }),
        }],
        actionsYml: buildActionsYml([{
          name: 'createOrder',
          summary: '建立訂單',
          rules: [{ type: '後置（狀態）' }],
        }]),
        schemaSql: SCHEMA_SQL,
        entityMapping: ENTITY_MAPPING,
      }

      const result = executeRedPhase(input)
      expect(result.issues.filter(i => i.issueType === 'entity_mismatch')).toHaveLength(0)
    })
  })

  describe('多 Feature 批次檢查', () => {
    it('混合正確和錯誤的 Feature', () => {
      const input: RedPhaseInput = {
        features: [
          {
            name: '建立訂單',
            actionName: 'createOrder',
            content: buildFeature({
              actionName: 'createOrder',
              summary: '建立訂單',
              featureName: '建立訂單',
            }),
          },
          {
            name: '刪除訂單',
            actionName: 'deleteOrder',
            content: buildFeature({
              actionName: 'deleteOrder',
              summary: '移除訂單',     // 與 actionsYml summary 不一致
              featureName: '移除訂單',
            }),
          },
        ],
        actionsYml: buildActionsYml([
          { name: 'createOrder', summary: '建立訂單', rules: [{ type: '後置（狀態）' }] },
          { name: 'deleteOrder', summary: '刪除訂單', rules: [{ type: '後置（狀態）' }] },
        ]),
        schemaSql: SCHEMA_SQL,
        entityMapping: ENTITY_MAPPING,
      }

      const result = executeRedPhase(input)
      expect(result.passed).toBe(false)
      expect(result.checkedFeatures).toBe(2)
      // 第二個 Feature 有 summary_mismatch
      expect(result.issues.some(i =>
        i.featureName === '刪除訂單' && i.issueType === 'summary_mismatch'
      )).toBe(true)
    })
  })

  describe('降級場景', () => {
    it('actionsYml 解析失敗 → 所有 Feature 報 missing_action', () => {
      const input: RedPhaseInput = {
        features: [{
          name: '建立訂單',
          actionName: 'createOrder',
          content: buildFeature({ actionName: 'createOrder', summary: '建立訂單', featureName: '建立訂單' }),
        }],
        actionsYml: 'invalid: yaml: [broken',
        schemaSql: SCHEMA_SQL,
        entityMapping: ENTITY_MAPPING,
      }

      const result = executeRedPhase(input)
      expect(result.passed).toBe(false)
      expect(result.issues[0].issueType).toBe('missing_action')
    })

    it('schema 解析失敗 → 跳過 entity/field 檢查，其他正常', () => {
      const input: RedPhaseInput = {
        features: [{
          name: '建立訂單',
          actionName: 'createOrder',
          content: buildFeature({
            actionName: 'createOrder',
            summary: '建立訂單',
            featureName: '建立訂單',
            entitySetup: 'NonExistent',  // 無法驗證因為 schema 壞了
          }),
        }],
        actionsYml: buildActionsYml([{
          name: 'createOrder',
          summary: '建立訂單',
          rules: [{ type: '後置（狀態）' }],
        }]),
        schemaSql: 'INVALID SQL',
        entityMapping: '',
      }

      const result = executeRedPhase(input)
      // schema 解析失敗 → entity check 跳過 → 應該通過（除非有其他問題）
      expect(result.issues.filter(i => i.issueType === 'entity_mismatch')).toHaveLength(0)
    })

    it('空 features → 直接通過', () => {
      const result = executeRedPhase({
        features: [],
        actionsYml: 'project:\n  name: test',
        schemaSql: '',
        entityMapping: '',
      })
      expect(result.passed).toBe(true)
      expect(result.checkedFeatures).toBe(0)
    })
  })

  describe('效能', () => {
    it('10 個 Feature 在 100ms 內完成', () => {
      const features = Array.from({ length: 10 }, (_, i) => ({
        name: `建立項目${i}`,
        actionName: `createItem${i}`,
        content: buildFeature({
          actionName: `createItem${i}`,
          summary: `建立項目${i}`,
          featureName: `建立項目${i}`,
        }),
      }))

      const actionsYml = buildActionsYml(features.map(f => ({
        name: f.actionName,
        summary: f.name,
        rules: [{ type: '後置（狀態）' }],
      })))

      const result = executeRedPhase({
        features,
        actionsYml,
        schemaSql: SCHEMA_SQL,
        entityMapping: ENTITY_MAPPING,
      })

      expect(result.durationMs).toBeLessThan(100)
      expect(result.checkedFeatures).toBe(10)
    })
  })
})

// ============================================================
// StubHttpAdapter 測試
// ============================================================

describe('StubHttpAdapter', () => {
  it('預設回 501', async () => {
    const stub = new StubHttpAdapter()
    const { TestRequest } = await import('../lib/specformula/http/test-request')
    const request = TestRequest.builder('POST', '/api/test').build()
    const response = await stub.execute(request)
    expect(response.status).toBe(501)
    expect(response.body).toContain('Not Implemented')
  })

  it('自訂 status code 和 body', async () => {
    const stub = new StubHttpAdapter(200, '{"ok":true}')
    const { TestRequest } = await import('../lib/specformula/http/test-request')
    const request = TestRequest.builder('GET', '/api/test').build()
    const response = await stub.execute(request)
    expect(response.status).toBe(200)
    expect(response.body).toBe('{"ok":true}')
  })
})

// ============================================================
// classifyRedPhaseFailure 測試
// ============================================================

describe('classifyRedPhaseFailure', () => {
  const makeStep = (status: 'passed' | 'failed', error?: string): StepResult => ({
    keyword: 'When',
    text: 'test step',
    status,
    error,
    durationMs: 10,
  })

  it('passed 步驟 → expected_red', () => {
    expect(classifyRedPhaseFailure(makeStep('passed'))).toBe('expected_red')
  })

  it('entity_setup 失敗 → entity_setup', () => {
    expect(classifyRedPhaseFailure(makeStep('failed', '[entity_setup] 插入失敗：column "xyz" 不存在'))).toBe('entity_setup')
  })

  it('Feature 解析失敗 → step_parsing', () => {
    expect(classifyRedPhaseFailure(makeStep('failed', 'Feature 解析失敗: Parser error'))).toBe('step_parsing')
  })

  it('找不到 API 操作 → api_spec_mismatch', () => {
    expect(classifyRedPhaseFailure(makeStep('failed', '[ApiCall] 找不到 API 操作 \'建立訂單\'。'))).toBe('api_spec_mismatch')
  })

  it('HTTP 501 狀態碼不匹配 → expected_red', () => {
    const error = '[ResponseValidate:DataTable] HTTP 狀態碼不匹配。\nAPI: 建立訂單\n預期: 201\n實際: 501\n回應: {"error":"Not Implemented"}'
    expect(classifyRedPhaseFailure(makeStep('failed', error))).toBe('expected_red')
  })

  it('其他 ResponseValidate 失敗 → expected_red（stub body 非 valid JSON 等）', () => {
    const error = '[ResponseValidate:DataTable] 回應內容非合法 JSON 物件'
    expect(classifyRedPhaseFailure(makeStep('failed', error))).toBe('expected_red')
  })

  it('未知錯誤 → unknown', () => {
    expect(classifyRedPhaseFailure(makeStep('failed', 'Some random error'))).toBe('unknown')
  })
})
