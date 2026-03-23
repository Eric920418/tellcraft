/**
 * RED Phase Validator — SDD 靜態規格一致性驗證
 *
 * 在 Coder 代碼生成前執行，提前抓出 Feature ↔ actionsYml ↔ Schema 的不一致。
 * 零 LLM 零 IO（純靜態分析），~2 秒完成。
 *
 * 8 個檢查：
 *   1. Action 存在性
 *   2. HTTP Method 一致性
 *   3. Path 一致性
 *   4. Summary 一致性
 *   5. Response 欄位可達性（executionKey vs schema column）
 *   6. Status Code 合理性
 *   7. Entity 對應性（entity name vs schema table）
 *   8. Step 可解析性（step text → ISA instruction regex 匹配）
 */

import * as yaml from 'js-yaml'
import { Pool } from 'pg'
import { isQueryAction, convertToOpenAPI } from './actions-design'
import { parseSchemasFromString, runAllFeatures, type ScenarioResult, type StepResult, type SpecFormulaTestResult } from './specformula-runner'
import { deriveSchemaFromBdd } from './schema-derivation'
import { StubHttpAdapter } from '../lib/specformula/http/stub-adapter'
import type { DatabaseSchema } from '../lib/specformula/spec/data/models'
import { createLogger } from '../lib/logger'

const logger = createLogger('red-phase-validator')

// ============================================================
// 型別定義
// ============================================================

export interface RedPhaseInput {
  features: Array<{ name?: string; actionName: string; content: string }>
  actionsYml: string
  schemaSql: string
  entityMapping: string
}

export type RedPhaseIssueType =
  | 'missing_action'
  | 'method_mismatch'
  | 'path_mismatch'
  | 'summary_mismatch'
  | 'field_mismatch'
  | 'status_mismatch'
  | 'entity_mismatch'
  | 'step_not_parseable'

export interface RedPhaseIssue {
  featureName: string
  issueType: RedPhaseIssueType
  severity: 'error' | 'warning'
  description: string
  suggestion: string
}

export interface RedPhaseResult {
  passed: boolean
  issues: RedPhaseIssue[]
  errors: number
  warnings: number
  summary: string
  durationMs: number
  checkedFeatures: number
}

// ============================================================
// actionsYml 解析
// ============================================================

interface ActionMeta {
  name: string
  summary: string
  method: string
  path: string
  rules?: Array<{ type: string }>
}

function parseActionsYmlMeta(actionsYml: string): ActionMeta[] {
  try {
    const parsed = yaml.load(actionsYml) as {
      actions?: Array<{
        name: string
        summary: string
        method?: string
        path?: string
        rules?: Array<{ type: string }>
      }>
    }
    if (!parsed?.actions) return []

    return parsed.actions.map(a => ({
      name: a.name,
      summary: a.summary || '',
      method: (typeof a.method === 'string' ? a.method : (isQueryAction(a) ? 'GET' : 'POST')).toUpperCase(),
      path: typeof a.path === 'string' ? a.path : `/api/${a.name}`,
      rules: a.rules,
    }))
  } catch (e) {
    logger.warn({ error: e }, 'Failed to parse actionsYml')
    return []
  }
}

// ============================================================
// Feature 註解解析
// ============================================================

interface FeatureAnnotations {
  actionName: string | null
  method: string | null
  path: string | null
  summary: string | null
  featureName: string | null
}

function extractFeatureAnnotations(content: string): FeatureAnnotations {
  const actionMatch = content.match(/^#\s*Action:\s*(\S+)/m)
  const methodPathMatch = content.match(/^#\s*\[(\w+)\]\s*(\/\S+)/m)
  const summaryMatch = content.match(/^#\s*Summary:\s*(.+)/m)
  const featureNameMatch = content.match(/^Feature:\s*(.+)/m)

  return {
    actionName: actionMatch?.[1] || null,
    method: methodPathMatch?.[1]?.toUpperCase() || null,
    path: methodPathMatch?.[2] || null,
    summary: summaryMatch?.[1]?.trim() || null,
    featureName: featureNameMatch?.[1]?.trim() || null,
  }
}

// ============================================================
// camelCase ↔ snake_case 工具
// ============================================================

function toSnakeCase(s: string): string {
  return s.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()
}

function toCamelCase(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

/**
 * 檢查 fieldName 是否能匹配 schema 中的某個 column（考慮 camelCase ↔ snake_case）
 * 返回 true 表示可匹配
 */
function fieldMatchesAnyColumn(fieldName: string, allColumns: Set<string>): boolean {
  const lower = fieldName.toLowerCase()
  if (allColumns.has(lower)) return true
  if (allColumns.has(toSnakeCase(fieldName).toLowerCase())) return true
  if (allColumns.has(toCamelCase(fieldName).toLowerCase())) return true

  // 常見的 composite 欄位（如 newUserId → id on users 表）不在單表 column 中
  // 這種情況不算 mismatch，視為 warning
  return false
}

// ============================================================
// Response 欄位提取（從 Feature 的 Then 步驟）
// ============================================================

interface ResponseFieldInfo {
  executionKeys: string[]    // <executionKey 名稱（去掉 < 前綴）
  statusCodes: number[]      // (201)、(200) 等
}

function extractResponseInfo(content: string): ResponseFieldInfo {
  const result: ResponseFieldInfo = { executionKeys: [], statusCodes: [] }
  const lines = content.split('\n')
  let inResponseTable = false
  let headerLine = ''

  for (const line of lines) {
    const trimmed = line.trim()

    // 偵測 response 驗證步驟：Then ...回應 或 And ...回應
    const statusMatch = trimmed.match(/(?:Then|And)\s+.+\((\d+)\)回應/)
    if (statusMatch) {
      result.statusCodes.push(parseInt(statusMatch[1], 10))
      inResponseTable = true
      headerLine = ''
      continue
    }

    if (inResponseTable) {
      if (trimmed.startsWith('|')) {
        if (!headerLine) {
          headerLine = trimmed
        } else {
          // data row — 提取 <executionKey
          const cells = trimmed.split('|').map(c => c.trim()).filter(Boolean)
          for (const cell of cells) {
            if (cell.startsWith('<')) {
              result.executionKeys.push(cell.substring(1))
            }
          }
        }
      } else {
        inResponseTable = false
      }
    }
  }

  return result
}

// ============================================================
// Entity 名稱提取（從 Feature 的 Given/Then 步驟）
// ============================================================

function extractEntityNames(content: string): string[] {
  const entities = new Set<string>()
  const lines = content.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    // 準備一個{entity} / 應該存在一個{entity} / 應該不存在一個{entity}
    const match = trimmed.match(/(?:準備一個|應該存在一個|應該不存在一個)\s*(.+?)\s*,/)
    if (match) {
      entities.add(match[1].trim())
    }
  }

  return [...entities]
}

// ============================================================
// Step 可解析性（簡化版 — 不依賴 ISA spec，用固定 regex）
// ============================================================

const STEP_PATTERNS = [
  { type: 'entity_setup', regex: /^準備一個.+,\s*with\s+table:/i },
  { type: 'entity_validate', regex: /^應該存在一個.+,\s*with\s+table:/i },
  { type: 'entity_non_existence', regex: /^應該不存在一個.+,\s*with\s+table:/i },
  { type: 'time_control', regex: /^現在時間為\s*"/ },
  { type: 'api_call', regex: /^(?:\(No Actor\)|\(UID="[^"]*"\))\s*.+,\s*call\s+table:/i },
  { type: 'response_validate_table', regex: /.+\(\d+\)回應,\s*with\s+table:/i },
  { type: 'response_validate_json', regex: /.+\(\d+\)回應為,\s*with\s+JSON:/i },
  { type: 'operation_failure', regex: /^操作失敗$/ },
]

function isStepParseable(stepText: string): boolean {
  return STEP_PATTERNS.some(p => p.regex.test(stepText.trim()))
}

// ============================================================
// 核心：8 個靜態檢查
// ============================================================

export function executeRedPhase(input: RedPhaseInput): RedPhaseResult {
  const start = Date.now()
  const issues: RedPhaseIssue[] = []

  // 解析 actionsYml
  const actionsMeta = parseActionsYmlMeta(input.actionsYml)
  const actionsByName = new Map<string, ActionMeta>()
  const actionsBySummary = new Map<string, ActionMeta>()
  for (const a of actionsMeta) {
    actionsByName.set(a.name, a)
    actionsBySummary.set(a.summary, a)
  }

  // 解析 schema（如果可用）
  let schemas: DatabaseSchema[] = []
  let allTableNames = new Set<string>()
  let allColumns = new Set<string>()
  try {
    schemas = parseSchemasFromString(input.schemaSql, input.entityMapping)
    for (const schema of schemas) {
      for (const [entityName, table] of schema.getTablesByEntityName()) {
        allTableNames.add(entityName.toLowerCase())
        allTableNames.add(table.tableName.toLowerCase())
        for (const col of table.columns) {
          allColumns.add(col.name.toLowerCase())
        }
      }
    }
  } catch (e) {
    logger.warn({ error: e }, 'Failed to parse schema — entity/field checks will be skipped')
  }

  // 逐 Feature 檢查
  for (const feature of input.features) {
    const displayName = feature.name || feature.actionName
    const annotations = extractFeatureAnnotations(feature.content)
    const responseInfo = extractResponseInfo(feature.content)
    const entities = extractEntityNames(feature.content)

    // 找到對應的 action
    const action = annotations.actionName
      ? actionsByName.get(annotations.actionName)
      : actionsByName.get(feature.actionName)

    // ---- Check 1: Action 存在性 ----
    if (!action) {
      issues.push({
        featureName: displayName,
        issueType: 'missing_action',
        severity: 'error',
        description: `Feature 的 Action "${annotations.actionName || feature.actionName}" 在 actionsYml 中找不到對應的 action`,
        suggestion: `確認 actionsYml 中是否有 name: "${annotations.actionName || feature.actionName}" 的 action，或修正 Feature 的 # Action: 註解`,
      })
      continue // 無法做後續檢查
    }

    // ---- Check 2: HTTP Method 一致性 ----
    if (annotations.method && action.method) {
      if (annotations.method !== action.method) {
        issues.push({
          featureName: displayName,
          issueType: 'method_mismatch',
          severity: 'error',
          description: `Feature 註解 # [${annotations.method}] 但 actionsYml 推導為 ${action.method}（基於 isQueryAction 規則）`,
          suggestion: `將 Feature 的 # [${annotations.method}] 改為 # [${action.method}]，或確認 actionsYml 的 rules 類型是否正確`,
        })
      }
    }

    // ---- Check 3: Path 一致性 ----
    if (annotations.path && action.path) {
      // 標準化 path 比較（移除尾 /，:id ↔ {id} 統一為 :id）
      const normPath = (p: string) => p.replace(/\/$/, '').replace(/\{(\w+)\}/g, ':$1')
      if (normPath(annotations.path) !== normPath(action.path)) {
        issues.push({
          featureName: displayName,
          issueType: 'path_mismatch',
          severity: 'warning',
          description: `Feature 註解 path "${annotations.path}" 與 actionsYml 推導的 "${action.path}" 不一致`,
          suggestion: `將 Feature 的 path 改為 "${action.path}"，或在 actionsYml 中設定 path: "${annotations.path}"`,
        })
      }
    }

    // ---- Check 4: Summary 一致性 ----
    const featureSummary = annotations.featureName || annotations.summary
    if (featureSummary && action.summary && featureSummary !== action.summary) {
      issues.push({
        featureName: displayName,
        issueType: 'summary_mismatch',
        severity: 'error',
        description: `Feature name/summary "${featureSummary}" 與 actionsYml summary "${action.summary}" 不一致 → _stepSummary 派發會失敗`,
        suggestion: `確保 Feature name 和 actionsYml summary 完全相同："${action.summary}"`,
      })
    }

    // ---- Check 5: Response 欄位可達性 ----
    if (responseInfo.executionKeys.length > 0 && allColumns.size > 0) {
      for (const key of responseInfo.executionKeys) {
        // executionKey 通常是 camelCase（如 newUserId），對應 schema 的 snake_case（如 id、user_id）
        // 跳過明顯的 composite key（包含 new/created/updated 前綴的）
        const isCompositeKey = /^(?:new|created|updated)/.test(key)
        if (!isCompositeKey && !fieldMatchesAnyColumn(key, allColumns)) {
          issues.push({
            featureName: displayName,
            issueType: 'field_mismatch',
            severity: 'warning',
            description: `<${key}> executionKey 在 schema 中找不到對應的 column（checked: ${key}, ${toSnakeCase(key)}）`,
            suggestion: `確認 <${key}> 是否為 LLM 生成的 composite 欄位名，或修正為 schema 中存在的 column 名`,
          })
        }
      }
    }

    // ---- Check 6: Status Code 合理性 ----
    if (responseInfo.statusCodes.length > 0) {
      for (const code of responseInfo.statusCodes) {
        if (action.method === 'POST' && code === 200) {
          issues.push({
            featureName: displayName,
            issueType: 'status_mismatch',
            severity: 'warning',
            description: `POST action 預期 status code 200，通常 POST 應為 201（Created）`,
            suggestion: `確認是否應改為 (201)回應，或保留 200（如果 POST 用於非建立操作，如登入）`,
          })
        } else if (action.method === 'GET' && code === 201) {
          issues.push({
            featureName: displayName,
            issueType: 'status_mismatch',
            severity: 'error',
            description: `GET action 預期 status code 201（Created），但 GET 不建立資源，應為 200`,
            suggestion: `將 (201)回應 改為 (200)回應`,
          })
        }
      }
    }

    // ---- Check 7: Entity 對應性 ----
    if (entities.length > 0 && allTableNames.size > 0) {
      for (const entity of entities) {
        if (!allTableNames.has(entity.toLowerCase())) {
          issues.push({
            featureName: displayName,
            issueType: 'entity_mismatch',
            severity: 'error',
            description: `Entity "${entity}" 在 schema/entityMapping 中找不到對應的 table`,
            suggestion: `確認 entity 名稱是否正確，或在 entity_mapping.yml 中新增映射`,
          })
        }
      }
    }

    // ---- Check 8: Step 可解析性 ----
    const lines = feature.content.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      // 只檢查 Given/When/Then/And/But 開頭的行
      const stepMatch = trimmed.match(/^(?:Given|When|Then|And|But)\s+(.+)/)
      if (!stepMatch) continue

      const stepText = stepMatch[1]
      // 跳過純 table row（| 開頭）和空行
      if (stepText.startsWith('|') || !stepText) continue
      // 跳過含 table 引用（step text 後面跟 table 的情況，text 本身不含 with table:）
      // 這些 step 的完整 text 包含 ", with table:" 在 Gherkin parser 裡
      // 但在原始文本中可能出現在 step text 行尾或下一行
      // 我們只檢查 step text 行本身
      if (!isStepParseable(stepText)) {
        // 容錯：如果 step text 是 DataTable 行（| 開頭）或 docstring 行（"""），跳過
        if (stepText.startsWith('|') || stepText.startsWith('"""')) continue
        // 容錯：response 驗證的短格式（...回應）可能沒有 ", with table:"
        if (/\(\d+\)回應/.test(stepText)) continue
        // 容錯：entity 步驟的短格式可能被行尾 comma 截斷
        if (/準備一個|應該存在一個|應該不存在一個/.test(stepText)) continue
        // 容錯：api_call 的短格式
        if (/call\s+table/i.test(stepText)) continue

        issues.push({
          featureName: displayName,
          issueType: 'step_not_parseable',
          severity: 'warning',
          description: `步驟 "${stepText.substring(0, 60)}..." 無法匹配任何 ISA instruction 格式`,
          suggestion: `確認步驟格式是否符合 ISA SpecFormula 標準（準備一個{entity}/操作失敗/(UID=...)...call table: 等）`,
        })
      }
    }
  }

  const errors = issues.filter(i => i.severity === 'error').length
  const warnings = issues.filter(i => i.severity === 'warning').length
  const durationMs = Date.now() - start

  const result: RedPhaseResult = {
    passed: errors === 0,
    issues,
    errors,
    warnings,
    summary: errors === 0
      ? (warnings > 0 ? `RED Phase 通過（${warnings} 個 warning）` : 'RED Phase 通過')
      : `RED Phase 發現 ${errors} 個 error + ${warnings} 個 warning`,
    durationMs,
    checkedFeatures: input.features.length,
  }

  logger.info({
    passed: result.passed,
    errors,
    warnings,
    checkedFeatures: result.checkedFeatures,
    durationMs,
  }, 'RED Phase 完成')

  return result
}

// ============================================================
// 格式化 RED Phase 結果（供 sendMessage 使用）
// ============================================================

export function formatRedPhaseReport(result: RedPhaseResult): string {
  if (result.passed && result.warnings === 0) {
    return `SDD RED Phase ✓ — ${result.checkedFeatures} 個 Feature 全部通過靜態規格驗證（${result.durationMs}ms）`
  }

  const lines: string[] = []
  if (result.passed) {
    lines.push(`SDD RED Phase ✓ — 通過（${result.warnings} 個 warning）`)
  } else {
    lines.push(`SDD RED Phase ✗ — ${result.errors} 個 error 需要修復`)
  }

  // 按 Feature 分組顯示
  const byFeature = new Map<string, RedPhaseIssue[]>()
  for (const issue of result.issues) {
    const list = byFeature.get(issue.featureName) || []
    list.push(issue)
    byFeature.set(issue.featureName, list)
  }

  for (const [featureName, featureIssues] of byFeature) {
    lines.push(`\n**${featureName}**:`)
    for (const issue of featureIssues) {
      const icon = issue.severity === 'error' ? '✗' : '⚠'
      lines.push(`  ${icon} [${issue.issueType}] ${issue.description}`)
    }
  }

  return lines.join('\n')
}

// ============================================================
// LLM 修復 Feature（error 級問題）
// ============================================================

export function buildRedPhaseFixPrompt(
  featureContent: string,
  issues: RedPhaseIssue[],
  actionsYml: string,
  schemaSql: string
): string {
  const issueList = issues
    .filter(i => i.severity === 'error')
    .map(i => `- [${i.issueType}] ${i.description}\n  建議：${i.suggestion}`)
    .join('\n')

  return `## 任務
修復以下 BDD Feature 文件中的規格問題。只修改有問題的部分，保持其他內容不變。

## 發現的問題
${issueList}

## actionsYml（參考）
\`\`\`yaml
${actionsYml}
\`\`\`

## Schema SQL（參考）
\`\`\`sql
${schemaSql.substring(0, 3000)}
\`\`\`

## 當前 Feature 內容
\`\`\`gherkin
${featureContent}
\`\`\`

## 輸出
直接輸出修正後的完整 Feature 文件（純 Gherkin，不要 markdown code fence）。`
}

// ============================================================
// RED Phase 全場景 Stub 驗證（用 StubHttpAdapter 跑完整 SpecFormula）
// ============================================================

export interface RedPhaseFullInput {
  features: Array<{ name?: string; actionName: string; content: string }>
  actionsYml: string
  openApiSpec: string
  isaConfigYml: string
  schemaSql: string
  entityMapping: string
  neonConnectionString: string
}

export type RedPhaseFailureType = 'entity_setup' | 'step_parsing' | 'api_spec_mismatch' | 'var_resolution' | 'unknown'

export interface RedPhaseUnexpectedFailure {
  featureName: string
  scenarioName: string
  stepKeyword: string
  stepText: string
  error: string
  failureType: RedPhaseFailureType
}

export interface RedPhaseFullResult {
  passed: boolean
  expectedRedCount: number
  unexpectedFailures: RedPhaseUnexpectedFailure[]
  totalScenarios: number
  durationMs: number
}

/**
 * 分類 RED Phase 中的步驟失敗：「預期 RED」vs「非預期失敗」
 *
 * 預期 RED：response_validate 因 HTTP 501（stub）失敗 → 測試本身正確，只是沒有真實實作
 * 非預期失敗：entity_setup 失敗、API spec 不匹配、VAR 解析失敗 → 測試本身有問題
 */
export function classifyRedPhaseFailure(step: StepResult): 'expected_red' | RedPhaseFailureType {
  if (step.status !== 'failed') return 'expected_red'

  const err = step.error || ''

  // entity_setup / entity_validate 失敗 → 非預期
  if (/\[entity_setup\]|\[entity_validate\]|\[entity_non_existence\]/.test(err)) {
    return 'entity_setup'
  }

  // Feature 解析失敗
  if (err.includes('Feature 解析失敗')) {
    return 'step_parsing'
  }

  // api_call 找不到 API 操作 → API spec 與 Feature summary 不匹配
  if (err.includes('找不到 API 操作') || err.includes('找不到 API')) {
    return 'api_spec_mismatch'
  }

  // response_validate 因 501 失敗 → 預期的 RED（stub 回 501，Feature 期望 200/201）
  if (err.includes('HTTP 狀態碼不匹配') && err.includes('實際: 501')) {
    return 'expected_red'
  }

  // 操作失敗（skip）步驟在 RED Phase 中容錯通過
  if (err.includes('操作未失敗但容忍通過')) {
    return 'expected_red'
  }

  // 其他 response_validate 失敗（如 VAR 無法解析、JSON 解析失敗）
  if (err.includes('ResponseValidate') || err.includes('response_validate') || err.includes('回應')) {
    return 'expected_red' // 501 body 不是 valid JSON → 也算預期 RED
  }

  // $notnull / 非空驗證失敗（stub 回 501 沒有預期欄位 → 預期的 RED）
  if (err.includes('應該不為空，但實際值為') || err.includes('應為非空值，但實際為空')) {
    return 'expected_red'
  }

  // VAR-System 錯誤（stub 回 501 無法捕獲 execution key → 預期的 RED）
  if (err.includes('VAR-System') || err.includes('execution key')) {
    return 'expected_red'
  }

  // 值不匹配（stub 回 501 欄位值不對 → 預期的 RED）
  if (err.includes('值不匹配')) {
    return 'expected_red'
  }

  // 未知類型的失敗
  return 'unknown'
}

/**
 * RED Phase 全場景 Stub 驗證
 *
 * 用 StubHttpAdapter（回 501）跑完整 SpecFormula 場景：
 * - entity_setup：連真實 Neon DB（驗證 entity/column/FK）
 * - api_call：打 stub（驗證請求組裝、VAR 解析、Actor 解析）
 * - response_validate：預期失敗（501 ≠ 200/201，這是正確的 RED）
 *
 * 區分「預期 RED」（測試正確，無實作）和「非預期失敗」（測試本身有問題）。
 */
export async function runRedPhaseFullValidation(input: RedPhaseFullInput): Promise<RedPhaseFullResult> {
  const start = Date.now()
  const stubAdapter = new StubHttpAdapter(501, '{"error":"Not Implemented"}')

  // 連接 Neon DB
  const pool = new Pool({
    connectionString: input.neonConnectionString,
    max: 3,
    idleTimeoutMillis: 10_000,
  })

  try {
    // MySQL DDL → PostgreSQL DDL
    const derived = deriveSchemaFromBdd(input.schemaSql, input.entityMapping)
    const pgSchemaSql = derived.postgresqlDDL

    // 準備 feature files
    const featureFiles = input.features.map(f => ({
      name: f.name || f.actionName,
      content: f.content,
    }))

    // 如果 openApiSpec 為空，從 actionsYml 動態生成
    let effectiveOpenApiSpec = input.openApiSpec
    if (!effectiveOpenApiSpec || !effectiveOpenApiSpec.trim()) {
      try {
        effectiveOpenApiSpec = convertToOpenAPI(input.actionsYml)
        logger.info('RED Phase Stub: openApiSpec 為空，從 actionsYml 動態生成')
      } catch (e) {
        logger.warn({ error: e }, 'RED Phase Stub: convertToOpenAPI 失敗')
        effectiveOpenApiSpec = ''
      }
    }

    // 用 stub 跑完整 SpecFormula
    const testResult: SpecFormulaTestResult = await runAllFeatures({
      features: featureFiles,
      isaConfigYml: input.isaConfigYml,
      openApiSpec: effectiveOpenApiSpec,
      schemaSql: pgSchemaSql,
      entityMapping: input.entityMapping,
      httpAdapter: stubAdapter,
      pool,
    })

    // 分類結果
    let expectedRedCount = 0
    const unexpectedFailures: RedPhaseUnexpectedFailure[] = []

    for (const scenario of testResult.scenarios) {
      if (scenario.status === 'passed') {
        // Scenario 全部通過（entity_setup 通過，且可能沒有 api_call/response_validate）
        continue
      }

      // 場景失敗 — 檢查每個步驟
      for (const step of scenario.steps) {
        if (step.status !== 'failed') continue

        const classification = classifyRedPhaseFailure(step)
        if (classification === 'expected_red') {
          expectedRedCount++
        } else {
          unexpectedFailures.push({
            featureName: scenario.featureName,
            scenarioName: scenario.scenarioName,
            stepKeyword: step.keyword,
            stepText: step.text.substring(0, 100),
            error: (step.error || '').substring(0, 300),
            failureType: classification,
          })
        }
      }
    }

    const durationMs = Date.now() - start
    const passed = unexpectedFailures.length === 0

    logger.info({
      passed,
      expectedRedCount,
      unexpectedFailureCount: unexpectedFailures.length,
      totalScenarios: testResult.totalScenarios,
      durationMs,
    }, 'RED Phase Stub 驗證完成')

    if (!passed) {
      logger.warn({
        failures: unexpectedFailures.map(f => ({
          feature: f.featureName,
          scenario: f.scenarioName,
          type: f.failureType,
          error: f.error.substring(0, 100),
        })),
      }, 'RED Phase Stub 發現非預期失敗')
    }

    return {
      passed,
      expectedRedCount,
      unexpectedFailures,
      totalScenarios: testResult.totalScenarios,
      durationMs,
    }
  } finally {
    await pool.end()
  }
}
