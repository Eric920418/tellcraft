/**
 * Feature Alignment Gate — 阻斷式 Feature 品質閘門
 *
 * 在 RED Phase 之後、executeCoderPipeline() 之前執行。
 * 6 項深度對齊檢查 + LLM 自動修復。修不好的問題會阻塞 pipeline。
 *
 * 核心理念：把問題消滅在源頭（Feature 對齊），而不是在終點修復（fix loop）。
 */

import * as yaml from 'js-yaml'
import { parseSchemasFromString } from './specformula-runner'
import { fixMultipleFeatures, sanitizeFeatureContent, type FeatureFixInput, type GeneratedFeature, type FixUsage } from './formulation'
import { getEnv } from '../lib/env'
import { enrichError, type EnrichableRootCause } from './error-enrichment'

/**
 * 把 AlignmentIssue.checkName 映射到 EnrichableRootCause。
 * 未映射到的 checkName 回 'unknown'（harnessHint 為空字串，不影響 prompt）。
 */
function alignmentCheckToRootCause(checkName: string): EnrichableRootCause {
  switch (checkName) {
    case 'entity_column_coverage': return 'missing_column'
    case 'not_null_missing': return 'entity_setup'
    case 'fk_reference_integrity': return 'fk_constraint'
    case 'response_field_naming': return 'field_naming'
    case 'var_system_alignment': return 'var_resolution'
    case 'summary_action_match': return 'api_spec_mismatch'
    case 'semantic_consistency': return 'unknown'  // semantic 矛盾的修復策略由 issue description 本身提供，不走 rootCause 路徑
    case 'check_constraint': return 'unknown'  // L17.P1：CHECK 約束違反，fix hint 由 description 本身提供（含允許值）
    case 'pagination_mismatch': return 'unknown'  // L19.P1：pagination/DataTable 衝突，fix hint 由 description 提供（二選一改法）
    default: return 'unknown'
  }
}

/**
 * L31.I：判斷 alignment gate 是否該因 cost 超限而 break
 * 純函數，不依賴 module state — 給單元測試用
 */
export function checkAlignmentCostBreach(
  cumulativeLlmCalls: number,
  cumulativeCostUsd: number,
  maxLlmCalls: number,
  maxCostUsd: number,
): { breached: boolean; reason?: 'calls' | 'cost' } {
  if (cumulativeLlmCalls >= maxLlmCalls) return { breached: true, reason: 'calls' }
  if (cumulativeCostUsd >= maxCostUsd) return { breached: true, reason: 'cost' }
  return { breached: false }
}

/**
 * L31.D：per-check 修法方向 hint（強制 LLM 走「正確」修法）
 *
 * 背景：autoFixFeatures 的 LLM 修復常常「修錯方向」—
 *   例如 Check 12 報「imageUrl 缺 entity_setup 值」，LLM 可能選擇「移除 Then $notnull」
 *   而非「加 imageUrl 進 entity_setup」 → 通過 alignment gate，但 spec 變鬆，code 弱驗證
 *
 * 解法：在 issuesWithHints 注入 forced direction，明確告訴 LLM「該怎麼修」+「禁止怎麼修」
 *
 * 對應 post-fix 方向審計（runFeatureAlignmentGate 內）會確認 LLM 沒違反這個方向。
 */
const CHECK_REPAIR_DIRECTION: Record<string, string> = {
  notnull_field_missing_from_setup: '【強制方向】必須把缺失欄位加進對應的 `準備一個 X, with table:` headers 並提供值。【禁止】移除 Then `$notnull` 驗證，否則 spec 變鬆。',
  then_concrete_value_missing_from_setup: '【強制方向】必須把缺失欄位 + 對應值加進 entity_setup DataTable。【禁止】修改 Then 的期望值，否則測試失去意義。',
  null_expectation_setup_conflict: '【強制方向】優先選 (A) 把該欄位從 entity_setup 移除（讓它走 DB DEFAULT/NULL），除非業務語意上該欄位本來就有值才選 (B) 修改 Then 期望。',
  scenario_scope_setup_mismatch: '【強制方向】在該 scenario 的 Given 補上含該欄位的 entity_setup，或把共用 setup 移到 Background。【禁止】移除 Then 期望。',
  entity_validation_field_missing_from_setup: '【強制方向】把缺失欄位加進 `準備一個 X, with table:` 並提供值（建議與 entity_validate 期望值一致）。【禁止】移除 entity_validate 步驟。',
}
import { extractEntitySetupSteps } from './red-phase-validator'
import { DatabaseSchema } from '../lib/specformula/spec/data/models'
import { validateSemanticConsistency } from './semantic-consistency-validator'
import { createLogger } from '../lib/logger'
import { recordTelemetry } from './skill-telemetry'

const logger = createLogger('feature-alignment-gate')

// ============================================================
// 型別定義
// ============================================================

export interface AlignmentGateInput {
  features: Array<{ name?: string; actionName: string; content: string }>
  actionsYml: string
  schemaSql: string
  entityMapping: string
  trackingContext?: { userId?: string; conversationId?: string }
}

export interface AlignmentIssue {
  featureName: string
  checkName: string
  severity: 'error' | 'warning'
  description: string
}

export interface AlignmentGateResult {
  passed: boolean
  blocked: boolean
  fixedFeatures?: Array<{ name?: string; actionName: string; content: string }>
  fixedSchemaSql?: string
  fixedEntityMapping?: string
  issues: AlignmentIssue[]
  fixedIssueCount: number
  remainingIssueCount: number
  blockMessage?: string
  durationMs: number
}

// ============================================================
// 工具函數
// ============================================================

function toSnakeCase(s: string): string {
  return s.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()
}

function toCamelCase(s: string): string {
  return s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
}

interface ActionMeta {
  name: string
  summary: string
}

function parseActionsMeta(actionsYml: string): ActionMeta[] {
  try {
    const parsed = yaml.load(actionsYml) as {
      actions?: Array<{ name: string; summary: string }>
    }
    if (!parsed?.actions) return []
    return parsed.actions.map(a => ({ name: a.name, summary: a.summary || '' }))
  } catch {
    return []
  }
}

/**
 * 從 Feature 文本提取所有 When 步驟的 summary（_stepSummary 的值）
 */
export function extractWhenSummaries(content: string): string[] {
  const summaries: string[] = []
  const lines = content.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    // 匹配 When/And 步驟的 api_call 格式
    const match = trimmed.match(
      /^(?:When|And)\s+(?:\(No Actor\)|\(UID="[^"]*"\))\s+(.+?)\s*[,，]\s*call\s+table:/i
    )
    if (match) {
      summaries.push(match[1].trim())
    }
  }
  return summaries
}

/**
 * 從 Feature 文本提取 # Summary: 註解和 Feature: 名稱
 */
function extractFeatureAnnotations(content: string): {
  summary: string | null
  featureName: string | null
  actionName: string | null
} {
  const summaryMatch = content.match(/^#\s*Summary:\s*(.+)/m)
  const featureNameMatch = content.match(/^Feature:\s*(.+)/m)
  const actionMatch = content.match(/^#\s*Action:\s*(\S+)/m)
  return {
    summary: summaryMatch?.[1]?.trim() || null,
    featureName: featureNameMatch?.[1]?.trim() || null,
    actionName: actionMatch?.[1] || null,
  }
}

/**
 * 從 Feature 文本提取 Then 回應的 DataTable headers（response fields）
 */
function extractResponseHeaders(content: string): string[] {
  const headers: string[] = []
  const lines = content.split('\n')
  let inResponseTable = false
  let headerCollected = false

  for (const line of lines) {
    const trimmed = line.trim()
    // Then/And ...回應, with table:
    if (/(?:Then|And)\s+.+\(\d+\)回應/.test(trimmed)) {
      inResponseTable = true
      headerCollected = false
      continue
    }
    if (inResponseTable) {
      if (trimmed.startsWith('|')) {
        if (!headerCollected) {
          const cells = trimmed.split('|').map(c => c.trim()).filter(Boolean)
          for (const cell of cells) {
            // 去除 VAR 前綴
            let clean = cell
            if (clean.startsWith('>') || clean.startsWith('<') || clean.startsWith('$')) {
              clean = clean.substring(1)
            }
            const dotIdx = clean.lastIndexOf('.')
            if (dotIdx >= 0) clean = clean.substring(dotIdx + 1)
            headers.push(clean)
          }
          headerCollected = true
        }
      } else {
        inResponseTable = false
      }
    }
  }
  return headers
}

/**
 * L31.A：Then 表期望值的 cell-level 解析
 *
 * 解析 Feature content 內所有 Then `(STATUS)回應, with table:` 步驟，
 * 把 header × data row 展平成 per-cell expectation，附帶 scenario name 與 line number。
 *
 * 用途：Check 12（$notnull 缺 entity_setup）、Check 13（literal 缺 entity_setup）、
 * Check 15（$null 與 entity_setup 給值矛盾）共用此 helper，避免邏輯重複。
 *
 * expectedKind:
 *   - 'notnull'  — `$notnull` / `&isNotNull`
 *   - 'null'     — `$null` / `&isNull`
 *   - 'var'      — `$xxx`（VAR 引用）/ `<xxx`（capture）/ `_`（不關心）
 *   - 'literal'  — 具體字面值（字串/數字/布林/JSON）
 */
export interface ThenExpectation {
  scenarioName: string
  ruleName: string
  fieldName: string
  expectedKind: 'notnull' | 'null' | 'var' | 'literal'
  expectedValue?: string  // 只有 literal/var 會填
  line: number
}

export function extractThenExpectations(content: string): ThenExpectation[] {
  const results: ThenExpectation[] = []
  const lines = content.split('\n')

  let inResponseTable = false
  let responseHeaderRow: string[] | null = null
  let currentScenarioName = ''
  let currentRuleName = ''

  for (let li = 0; li < lines.length; li++) {
    const trimmed = lines[li].trim()

    const ruleMatch = trimmed.match(/^Rule:\s*(.+)$/)
    if (ruleMatch) { currentRuleName = ruleMatch[1].trim(); continue }

    const scMatch = trimmed.match(/^(?:Scenario:|Scenario Outline:|Example:)\s*(.+)$/)
    if (scMatch) {
      currentScenarioName = scMatch[1].trim()
      inResponseTable = false
      responseHeaderRow = null
      continue
    }

    // Then ...(STATUS)回應, with table:
    if (/(?:Then|And)\s+.+\(\d+\)回應.*with\s+table:/.test(trimmed)) {
      inResponseTable = true
      responseHeaderRow = null
      continue
    }

    if (!inResponseTable) continue

    if (!trimmed.startsWith('|')) {
      inResponseTable = false
      responseHeaderRow = null
      continue
    }

    const cells = trimmed.split('|').map(c => c.trim()).filter(Boolean)

    if (responseHeaderRow === null) {
      responseHeaderRow = cells.map(c => {
        let clean = c
        if (clean.startsWith('>') || clean.startsWith('<') || clean.startsWith('$')) clean = clean.substring(1)
        const dotIdx = clean.lastIndexOf('.')
        if (dotIdx >= 0) clean = clean.substring(dotIdx + 1)
        return clean
      })
      continue
    }

    for (let ci = 0; ci < cells.length && ci < responseHeaderRow.length; ci++) {
      const cellRaw = cells[ci]
      const cellLower = cellRaw.trim().toLowerCase()
      const fieldName = responseHeaderRow[ci]
      if (!fieldName) continue

      let kind: ThenExpectation['expectedKind']
      let value: string | undefined

      if (cellLower === '$notnull' || cellLower === '&isnotnull') {
        kind = 'notnull'
      } else if (cellLower === '$null' || cellLower === '&isnull') {
        kind = 'null'
      } else if (cellLower === '_' || cellLower === '') {
        // _ = 不關心；空 cell 也視為不關心
        continue
      } else if (cellRaw.startsWith('$') || cellRaw.startsWith('<') || cellRaw.startsWith('&')) {
        kind = 'var'
        value = cellRaw
      } else {
        kind = 'literal'
        value = cellRaw
      }

      results.push({
        scenarioName: currentScenarioName,
        ruleName: currentRuleName,
        fieldName,
        expectedKind: kind,
        expectedValue: value,
        line: li + 1,
      })
    }
  }

  return results
}

/**
 * L17.P1：解析 PostgreSQL CHECK 約束字串。支援常見 pattern：
 *   IN (...)  → { kind: 'enum', values }
 *   = 'x'     → { kind: 'enum', values: ['x'] }
 *   >= N / <= N / > N / < N / = N → { kind: 'range', op, value }
 * 複雜 expression（length() / ~ regex / 多條件 AND）→ null（fail-open，不誤報）
 */
export type CheckSpec =
  | { kind: 'enum'; values: string[] }
  | { kind: 'range'; op: '>=' | '<=' | '>' | '<' | '='; value: number }

export function parseCheckConstraintSpec(check: string): CheckSpec | null {
  if (!check) return null
  const trimmed = check.trim()

  // IN (...) 優先
  const inMatch = trimmed.match(/\bIN\s*\(([^)]+)\)/i)
  if (inMatch) {
    const values = inMatch[1]
      .split(',')
      .map(v => v.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean)
    if (values.length > 0) return { kind: 'enum', values }
  }

  // 單一 = 'x' / = N
  const eqMatch = trimmed.match(/[a-zA-Z_][\w]*\s*=\s*(?:'([^']+)'|(-?\d+(?:\.\d+)?))/)
  if (eqMatch) {
    if (eqMatch[1] !== undefined) return { kind: 'enum', values: [eqMatch[1]] }
    if (eqMatch[2] !== undefined) return { kind: 'range', op: '=', value: parseFloat(eqMatch[2]) }
  }

  // 數值比較 >= / <= / > / <
  const cmpMatch = trimmed.match(/[a-zA-Z_][\w]*\s*(>=|<=|>|<)\s*(-?\d+(?:\.\d+)?)/)
  if (cmpMatch) {
    return { kind: 'range', op: cmpMatch[1] as '>=' | '<=' | '>' | '<', value: parseFloat(cmpMatch[2]) }
  }

  return null
}

/**
 * L17.P1：從 Feature content 提取所有 entity_setup 步驟的完整結構
 * （包含 entityName、stepLine、原始 headers、完整 data rows）
 * 比 red-phase-validator 的 extractEntitySetupSteps 多保留 data rows。
 */
export interface EntitySetupWithData {
  entityName: string
  stepLine: number       // 1-based
  rawHeaders: string[]   // 原始含 > 前綴
  dataRows: Array<{ line: number; cells: string[] }>
}

function splitDataTableRow(text: string): string[] {
  // `| a | b | c |` → ['', 'a', 'b', 'c', ''] → 去頭尾空字串 → ['a', 'b', 'c']
  // 保留中間空 cell（若有）
  const parts = text.split('|').map(c => c.trim())
  if (parts.length > 0 && parts[0] === '') parts.shift()
  if (parts.length > 0 && parts[parts.length - 1] === '') parts.pop()
  return parts
}

export function extractEntitySetupWithData(content: string): EntitySetupWithData[] {
  const results: EntitySetupWithData[] = []
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    const match = trimmed.match(/(?:Given|When|Then|And|But)\s+準備一個\s*(.+?)\s*[,，]\s*with\s+table:/i)
    if (!match) continue

    const entityName = match[1].trim()
    const tableLines: Array<{ line: number; text: string }> = []
    for (let j = i + 1; j < lines.length; j++) {
      const tl = lines[j].trim()
      if (tl.startsWith('|')) {
        tableLines.push({ line: j + 1, text: tl })
      } else {
        break
      }
    }
    if (tableLines.length < 1) continue

    const rawHeaders = splitDataTableRow(tableLines[0].text)
    const dataRows = tableLines.slice(1).map(({ line, text }) => ({
      line,
      cells: splitDataTableRow(text),
    }))

    results.push({ entityName, stepLine: i + 1, rawHeaders, dataRows })
  }
  return results
}

/**
 * L31.G part1: 解析 Feature 所有 When 步驟的 call table，回傳 user input 字面值
 * 關鍵：Check 12/13/15 必須把 When call table 視為「資料來源」 — Create/Submit/Update 操作
 * 的 Then expected value 來自 user API input（When call table），不是只有 entity_setup
 */
export function extractWhenCallTableValues(content: string): {
  headers: Set<string>
  values: Set<string>
} {
  const headers = new Set<string>()
  const values = new Set<string>()
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (!/(?:When|And)\s+(?:\(No Actor\)|\(UID="[^"]*"\)|\([^)]*\))?\s*.+?[,，]\s*call\s+table:/i.test(trimmed)) continue

    let headerCells: string[] | null = null
    for (let j = i + 1; j < lines.length; j++) {
      const tl = lines[j].trim()
      if (!tl.startsWith('|')) break
      const cells = tl.split('|').map(c => c.trim()).filter(Boolean)
      if (headerCells === null) {
        headerCells = cells.map(c => {
          let clean = c
          if (clean.startsWith('>') || clean.startsWith('<') || clean.startsWith('$')) clean = clean.substring(1)
          const dotIdx = clean.lastIndexOf('.')
          if (dotIdx >= 0) clean = clean.substring(dotIdx + 1)
          return clean
        })
        for (const h of headerCells) {
          if (!h) continue
          headers.add(h)
          headers.add(toCamelCase(h))
          headers.add(toSnakeCase(h))
        }
      } else {
        for (const cell of cells) {
          const c = cell.trim()
          if (!c || c === '_') continue
          if (c.startsWith('$') || c.startsWith('<') || c.startsWith('&')) continue
          values.add(c)
          const stripped = c.replace(/^["']|["']$/g, '')
          if (stripped !== c) values.add(stripped)
        }
      }
    }
  }

  return { headers, values }
}

/**
 * L31.G part2: 解析 schema SQL 提取所有 column names
 * 用途：Check 12/13/15 判斷「expected field 是否真在 schema 裡」
 * 不在 schema = server-gen / aggregation / metadata，不該報
 */
export function extractAllSchemaColumnNames(schemaSql: string): Set<string> {
  const cols = new Set<string>()
  if (!schemaSql) return cols
  const tableRegex = /CREATE\s+TABLE\s+\w+\s*\(([\s\S]*?)\)\s*(?:COMMENT[^;]*)?;/gi
  let m: RegExpExecArray | null
  while ((m = tableRegex.exec(schemaSql)) !== null) {
    const body = m[1]
    const splitLines = body.split(/[\n,]/)
    for (const line of splitLines) {
      const trimmedLine = line.trim()
      if (!trimmedLine) continue
      if (/^\s*(PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|CHECK|CONSTRAINT|INDEX)\b/i.test(trimmedLine)) continue
      const nameMatch = trimmedLine.match(/^\s*(\w+)\s+/)
      if (!nameMatch) continue
      const name = nameMatch[1].toLowerCase()
      cols.add(name)
      cols.add(toCamelCase(name))
    }
  }
  return cols
}

/**
 * L31.B：把 Feature content 切成 Background block + 每個 scenario block
 * 給 Check 14 scenario-scope 對齊用（每 scenario 獨立檢查）
 */
export interface FeatureBlock {
  scenarioName: string  // '' = Background
  startLine: number
  endLine: number       // exclusive
  content: string       // 該 block 的子串
}

export function splitFeatureIntoScenarios(content: string): {
  background: FeatureBlock | null
  scenarios: FeatureBlock[]
} {
  const lines = content.split('\n')
  const breaks: Array<{ line: number; type: 'background' | 'scenario'; name: string }> = []

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (/^Background:/.test(trimmed)) {
      breaks.push({ line: i, type: 'background', name: '' })
    } else {
      const sc = trimmed.match(/^(?:Scenario:|Scenario Outline:|Example:)\s*(.+)$/)
      if (sc) breaks.push({ line: i, type: 'scenario', name: sc[1].trim() })
    }
  }

  let background: FeatureBlock | null = null
  const scenarios: FeatureBlock[] = []

  for (let i = 0; i < breaks.length; i++) {
    const br = breaks[i]
    const endLine = i + 1 < breaks.length ? breaks[i + 1].line : lines.length
    const blockContent = lines.slice(br.line, endLine).join('\n')
    const block: FeatureBlock = {
      scenarioName: br.name,
      startLine: br.line + 1,
      endLine,
      content: blockContent,
    }
    if (br.type === 'background') {
      background = block
    } else {
      scenarios.push(block)
    }
  }

  return { background, scenarios }
}

/**
 * L31.B：解析 Feature 內所有 entity_validate 步驟
 * 「應該存在一個 X, with table:」/「應該不存在一個 X, with table:」
 * 用於 Check 16 entity 驗證對齊
 */
export interface EntityValidateStep {
  scenarioName: string
  ruleName: string
  entityName: string
  shouldExist: boolean  // true = 應該存在, false = 應該不存在
  rawHeaders: string[]
  dataRows: Array<{ line: number; cells: string[] }>
  stepLine: number
}

export function extractEntityValidateSteps(content: string): EntityValidateStep[] {
  const results: EntityValidateStep[] = []
  const lines = content.split('\n')
  let currentScenarioName = ''
  let currentRuleName = ''

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()

    const ruleMatch = trimmed.match(/^Rule:\s*(.+)$/)
    if (ruleMatch) { currentRuleName = ruleMatch[1].trim(); continue }
    const scMatch = trimmed.match(/^(?:Scenario:|Scenario Outline:|Example:)\s*(.+)$/)
    if (scMatch) { currentScenarioName = scMatch[1].trim(); continue }

    // 應該存在/不存在一個 X, with table:
    const m = trimmed.match(/(?:Given|When|Then|And|But)\s+應該(不存在|存在)一個\s*(.+?)\s*[,，]\s*with\s+table:/i)
    if (!m) continue
    const shouldExist = m[1] === '存在'
    const entityName = m[2].trim()

    const tableLines: Array<{ line: number; text: string }> = []
    for (let j = i + 1; j < lines.length; j++) {
      const tl = lines[j].trim()
      if (tl.startsWith('|')) tableLines.push({ line: j + 1, text: tl })
      else break
    }
    if (tableLines.length < 1) continue

    const rawHeaders = splitDataTableRow(tableLines[0].text)
    const dataRows = tableLines.slice(1).map(({ line, text }) => ({
      line,
      cells: splitDataTableRow(text),
    }))

    results.push({
      scenarioName: currentScenarioName,
      ruleName: currentRuleName,
      entityName,
      shouldExist,
      rawHeaders,
      dataRows,
      stepLine: i + 1,
    })
  }

  return results
}

/**
 * SpecFormula 系統常數（非一般變數，不需要宣告）。
 * - `$notnull` — 非空驗證標記（see formulation.ts:814, red-phase-validator.ts:925）
 * - `$null` — 明確 null 驗證
 * - `&isNull` / `&isNotNull` — 舊語法，有些 scenario 仍用
 *   （`&` 前綴會被 L199 的 regex `/^\$[a-zA-Z]/` 過濾掉不進 references，但保留在白名單以防未來 regex 放寬）
 */
const SPECFORMULA_SYSTEM_VARS = new Set<string>([
  'notnull',
  'null',
  'undefined',
  'isnull',
  'isnotnull',
])

/**
 * L23.C: 按 Scenario / Example 切割 Feature，回傳每個 scenario 的 scope：
 *   - 該 scenario 有效的 VAR 宣告 = Background 宣告 + 該 scenario Given 宣告
 *   - 該 scenario 的 VAR 引用 = 該 scenario When/Then 引用
 * 用於檢測 cross-scenario VAR 引用（SpecFormula 每個 scenario 獨立執行）
 */
export function extractScenariosWithScope(content: string): Array<{
  scenarioName: string
  startLine: number
  declaredInBackground: Set<string>
  declaredInLocalGiven: Set<string>
  referencedInWhenThen: Array<{ varName: string; line: number }>
}> {
  const lines = content.split('\n')

  // 第一遍：收集 Background 宣告
  const backgroundDecls = new Set<string>()
  let inBackground = false
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (/^Background:/.test(trimmed)) { inBackground = true; continue }
    if (/^(Rule:|Scenario:|Scenario Outline:|Example:|@)/.test(trimmed)) { inBackground = false }
    if (!inBackground || !trimmed.startsWith('|')) continue
    const cells = trimmed.split('|').map(c => c.trim()).filter(Boolean)
    for (const cell of cells) {
      if (cell.startsWith('>')) {
        // Context Key 宣告：>Entity.field
        const key = cell.substring(1)
        backgroundDecls.add(key)
        // 衍生變數名（entity.charAt(0).toLower + field.charAt(0).toUpper + ...）
        const parts = key.split('.')
        if (parts.length === 2) {
          const entity = parts[0]
          const field = parts[1]
          backgroundDecls.add(field)
          backgroundDecls.add(entity.charAt(0).toLowerCase() + entity.slice(1) + field.charAt(0).toUpperCase() + field.slice(1))
        }
      } else if (cell.startsWith('<')) {
        backgroundDecls.add(cell.substring(1)) // executionKey 捕獲
      }
    }
  }

  // 第二遍：按 scenario / example 切割並收集 local scope
  const scenarios: Array<{
    scenarioName: string
    startLine: number
    declaredInBackground: Set<string>
    declaredInLocalGiven: Set<string>
    referencedInWhenThen: Array<{ varName: string; line: number }>
  }> = []

  let currentScenario: (typeof scenarios)[number] | null = null
  let currentStepType: 'given' | 'when' | 'then' | null = null

  const flushScenario = () => {
    if (currentScenario) scenarios.push(currentScenario)
  }

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()

    // 新 scenario 開頭
    const scenarioMatch = trimmed.match(/^(?:Scenario:|Scenario Outline:|Example:)\s*(.+)$/)
    if (scenarioMatch) {
      flushScenario()
      currentScenario = {
        scenarioName: scenarioMatch[1].trim(),
        startLine: i + 1,
        declaredInBackground: backgroundDecls,
        declaredInLocalGiven: new Set<string>(),
        referencedInWhenThen: [],
      }
      currentStepType = null
      continue
    }

    // Rule: 分隔 — 不重置 scenario（scenario 在 Rule 內）
    if (/^Rule:/.test(trimmed)) { currentStepType = null; continue }
    // Background: / 結尾 — 不在 scenario 內
    if (/^Background:/.test(trimmed)) { continue }

    if (!currentScenario) continue

    // 追蹤 step 類型
    if (/^(Given|And|But)\b/.test(trimmed) && currentStepType !== 'when' && currentStepType !== 'then') {
      currentStepType = 'given'
    } else if (/^When\b/.test(trimmed)) {
      currentStepType = 'when'
    } else if (/^Then\b/.test(trimmed)) {
      currentStepType = 'then'
    } else if (/^(And|But)\b/.test(trimmed)) {
      // And/But 繼承前一個 step 類型
    }

    // table 行處理
    if (trimmed.startsWith('|')) {
      const cells = trimmed.split('|').map(c => c.trim()).filter(Boolean)
      for (const cell of cells) {
        if (currentStepType === 'given') {
          if (cell.startsWith('>')) {
            const key = cell.substring(1)
            currentScenario.declaredInLocalGiven.add(key)
            const parts = key.split('.')
            if (parts.length === 2) {
              const entity = parts[0]
              const field = parts[1]
              currentScenario.declaredInLocalGiven.add(field)
              currentScenario.declaredInLocalGiven.add(entity.charAt(0).toLowerCase() + entity.slice(1) + field.charAt(0).toUpperCase() + field.slice(1))
            }
          } else if (cell.startsWith('<')) {
            currentScenario.declaredInLocalGiven.add(cell.substring(1))
          } else if (cell.startsWith('$') && /^\$[a-zA-Z]/.test(cell)) {
            // Given 也可能用 $ 引用（如 FK 指向 Background 宣告的實體）
            currentScenario.referencedInWhenThen.push({ varName: cell.substring(1), line: i + 1 })
          }
        } else if (currentStepType === 'when' || currentStepType === 'then') {
          if (cell.startsWith('$') && /^\$[a-zA-Z]/.test(cell)) {
            currentScenario.referencedInWhenThen.push({ varName: cell.substring(1), line: i + 1 })
          } else if (cell.startsWith('<')) {
            // Then 的 <executionKey 也是宣告（捕獲回應欄位）
            currentScenario.declaredInLocalGiven.add(cell.substring(1))
          }
        }
      }
    }
  }
  flushScenario()

  return scenarios
}

/**
 * 提取所有 VAR 宣告（>Context.field）和引用（$variable）
 */
function extractVarDeclarationsAndReferences(content: string): {
  declarations: Array<{ raw: string; contextKey: string; line: number }>
  references: Array<{ raw: string; varName: string; line: number }>
  executionKeys: Array<{ raw: string; keyName: string; line: number }>
} {
  const declarations: Array<{ raw: string; contextKey: string; line: number }> = []
  const references: Array<{ raw: string; varName: string; line: number }> = []
  const executionKeys: Array<{ raw: string; keyName: string; line: number }> = []

  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim().startsWith('|')) continue

    const cells = line.split('|').map(c => c.trim()).filter(Boolean)
    for (const cell of cells) {
      if (cell.startsWith('>')) {
        declarations.push({ raw: cell, contextKey: cell.substring(1), line: i + 1 })
      } else if (cell.startsWith('$') && /^\$[a-zA-Z]/.test(cell)) {
        references.push({ raw: cell, varName: cell.substring(1), line: i + 1 })
      } else if (cell.startsWith('<')) {
        executionKeys.push({ raw: cell, keyName: cell.substring(1), line: i + 1 })
      }
    }
  }

  return { declarations, references, executionKeys }
}

// ============================================================
// 6 項對齊檢查
// ============================================================

export async function runAlignmentChecks(input: AlignmentGateInput): Promise<AlignmentIssue[]> {
  const issues: AlignmentIssue[] = []
  const actionsMeta = parseActionsMeta(input.actionsYml)
  const actionsByName = new Map(actionsMeta.map(a => [a.name, a]))

  // 解析 Schema
  let schemas: DatabaseSchema[] = []
  try {
    schemas = await parseSchemasFromString(input.schemaSql, input.entityMapping)
  } catch (e) {
    logger.warn({ error: e }, 'Schema 解析失敗，部分對齊檢查將跳過')
  }

  // 收集所有 Feature 的 summary → actionName 映射
  const allSummariesByAction = new Map<string, string[]>()
  for (const feature of input.features) {
    const summaries = extractWhenSummaries(feature.content)
    allSummariesByAction.set(feature.actionName, summaries)
  }

  // ---- Check 1: Summary 唯一性（跨 Feature 的 _stepSummary 碰撞偵測） ----
  const allSummaries: Array<{ summary: string; featureName: string; actionName: string }> = []
  for (const feature of input.features) {
    const displayName = feature.name || feature.actionName
    const summaries = extractWhenSummaries(feature.content)
    for (const s of summaries) {
      allSummaries.push({ summary: s, featureName: displayName, actionName: feature.actionName })
    }
  }

  // L24.A: 移除 substring collision 檢查
  // 理由：Coder 現在一律用 `op === 'exact'` 精確匹配（coder-generation.ts:1703、:472），
  //   substring 不會造成實際 dispatch 碰撞。原本這個檢查是 L14 前用 `op.includes()` 時代的防禦，
  //   現在是誤報來源：LLM 被誤導把合法命名（如 "Delete Pricing Plan" vs "Delete Pricing Plan Item"）
  //   改成 "Remove Pricing Plan" → 打破 actionsYml 對齊 → 造成真 bug。
  //   若未來某些場景重新引入 substring 比對，應該改成 warning（非 error）並在實際 runtime 偵測

  for (const feature of input.features) {
    const displayName = feature.name || feature.actionName
    const annotations = extractFeatureAnnotations(feature.content)
    const action = annotations.actionName
      ? actionsByName.get(annotations.actionName)
      : actionsByName.get(feature.actionName)

    // ---- Check 2: Entity Setup Column Coverage（深度 Schema 驗證） ----
    if (schemas.length > 0) {
      const setupSteps = extractEntitySetupSteps(feature.content)
      for (const step of setupSteps) {
        const found = DatabaseSchema.findSchemaAndTable(schemas, step.entityName)
        if (!found) continue

        const { table } = found
        for (const header of step.headers) {
          const snakeName = toSnakeCase(header).toLowerCase()
          const camelName = toCamelCase(header).toLowerCase()
          const lowerName = header.toLowerCase()

          const columnExists = table.columns.some(c => {
            const cn = c.name.toLowerCase()
            return cn === lowerName || cn === snakeName || cn === camelName
          })

          if (!columnExists) {
            // 檢查是否在其他表中（跨表 FK 場景由 runtime 處理，非 error）
            let inOtherTable = false
            for (const schema of schemas) {
              for (const [, otherTable] of schema.getTablesByEntityName()) {
                if (otherTable.tableName === table.tableName) continue
                if (otherTable.columns.some(c => {
                  const cn = c.name.toLowerCase()
                  return cn === lowerName || cn === snakeName || cn === camelName
                })) {
                  inOtherTable = true
                  break
                }
              }
              if (inOtherTable) break
            }

            if (!inOtherTable) {
              issues.push({
                featureName: displayName,
                checkName: 'entity_column_coverage',
                severity: 'error',
                description: `Entity "${step.entityName}" 的 DataTable 欄位 "${header}" 在 Schema 的 "${table.tableName}" 表中找不到（也不在其他表中）`,
              })
            }
          }
        }

        // NOT NULL 欄位缺失檢查
        const providedCols = new Set(step.headers.map(h => toSnakeCase(h).toLowerCase()))
        for (const col of table.columns) {
          if (!col.notNull || col.defaultValue || col.primaryKey || col.autoIncrement) continue
          if (col.name.endsWith('_id')) continue // FK 由 runtime 自動處理
          if (col.name === 'created_at' || col.name === 'updated_at') continue // 通常有 DEFAULT

          if (!providedCols.has(col.name.toLowerCase()) && !providedCols.has(toCamelCase(col.name).toLowerCase())) {
            issues.push({
              featureName: displayName,
              checkName: 'not_null_missing',
              severity: 'warning',
              description: `Entity "${step.entityName}" 的 DataTable 缺少 NOT NULL 欄位 "${col.name}"（fillMissingNotNullColumns 會自動補，但明確提供更可靠）`,
            })
          }
        }
      }
    }

    // ---- Check 3: FK Reference 完整性 ----
    if (schemas.length > 0) {
      const setupSteps = extractEntitySetupSteps(feature.content)
      for (const step of setupSteps) {
        const found = DatabaseSchema.findSchemaAndTable(schemas, step.entityName)
        if (!found) continue
        const { table } = found

        for (const header of step.headers) {
          const snakeName = toSnakeCase(header).toLowerCase()
          if (!snakeName.endsWith('_id')) continue

          // 找到對應的 column definition
          const colDef = table.columns.find(c => c.name.toLowerCase() === snakeName)
          if (!colDef) continue

          // 如果欄位型別是 UUID，檢查 FK 目標表是否在 Schema 中
          const baseName = snakeName.replace(/_id$/, '')
          const allTableNames = new Set<string>()
          for (const schema of schemas) {
            for (const [entityName, t] of schema.getTablesByEntityName()) {
              allTableNames.add(entityName.toLowerCase())
              allTableNames.add(t.tableName.toLowerCase())
            }
          }

          const candidates = [baseName + 's', baseName + 'es', baseName]
          if (baseName.endsWith('y')) candidates.push(baseName.slice(0, -1) + 'ies')
          const fkTableExists = candidates.some(c => allTableNames.has(c))

          if (!fkTableExists && !colDef.foreignKey) {
            issues.push({
              featureName: displayName,
              checkName: 'fk_reference_integrity',
              severity: 'warning',
              description: `Entity "${step.entityName}" 的 FK 欄位 "${header}" 找不到對應的被引用表（${candidates.join('/')})`,
            })
          }
        }
      }
    }

    // ---- Check 4: Response Field 命名一致性 ----
    if (schemas.length > 0) {
      const responseHeaders = extractResponseHeaders(feature.content)
      for (const header of responseHeaders) {
        // 跳過 __status 等內部欄位和約束標記
        if (header.startsWith('__') || header.startsWith('&')) continue
        // 跳過 composite 欄位（如 newUserId, createdAt, items）
        if (/^(?:new|created|updated|total|count|items|data|message|success|error)/.test(header)) continue

        // 檢查是否是 snake_case（含底線且不是 camelCase）
        if (header.includes('_') && header !== header.toLowerCase()) {
          // 混合 case + underscore — 可能是問題
          issues.push({
            featureName: displayName,
            checkName: 'response_field_naming',
            severity: 'warning',
            description: `Response 欄位 "${header}" 混合了 snake_case 和 camelCase，建議統一為 camelCase: "${toCamelCase(header)}"`,
          })
        } else if (header.includes('_')) {
          // 純 snake_case — 應轉 camelCase
          issues.push({
            featureName: displayName,
            checkName: 'response_field_naming',
            severity: 'error',
            description: `Response 欄位 "${header}" 是 snake_case，BDD 測試框架期望 camelCase: "${toCamelCase(header)}"`,
          })
        }
      }
    }

    // ---- Check 5.5 (L23.C): Scenario-scope VAR 對齊 ----
    // SpecFormula 每個 scenario 獨立執行，VAR 不跨 scenario 傳承。
    // Background + 該 scenario 自己的 Given 才是有效 scope；引用在 scope 外 → runtime fail。
    const scenarios = extractScenariosWithScope(feature.content)
    const crossScenarioIssues = new Set<string>() // dedupe by (scenario+varName)
    for (const scenario of scenarios) {
      const scope = new Set([
        ...scenario.declaredInBackground,
        ...scenario.declaredInLocalGiven,
      ])
      for (const ref of scenario.referencedInWhenThen) {
        if (SPECFORMULA_SYSTEM_VARS.has(ref.varName.toLowerCase())) continue
        if (scope.has(ref.varName)) continue
        // case-insensitive 二次嘗試（大小寫誤用由 Check 5 另外報）
        let inScopeCI = false
        for (const s of scope) {
          if (s.toLowerCase() === ref.varName.toLowerCase()) { inScopeCI = true; break }
        }
        if (inScopeCI) continue
        const key = `${scenario.scenarioName}::${ref.varName}`
        if (crossScenarioIssues.has(key)) continue
        crossScenarioIssues.add(key)
        issues.push({
          featureName: displayName,
          checkName: 'cross_scenario_var_reference',
          severity: 'error',
          description: `Scenario "${scenario.scenarioName}" (line ${ref.line}) 引用 "$${ref.varName}" 未在該 scenario 的 Background 或 Given 宣告。SpecFormula 每個 scenario 獨立執行，VAR 不跨 scenario 傳承 — 在別的 Rule/Example 宣告的 VAR 在此 scenario 無效。請在該 scenario 自己的 Given 補上宣告（如 \`| >Xxx.id | ... | <${ref.varName} | ... |\`），或把共用資料移到 Background。`,
        })
      }
    }

    // ---- Check 5: VAR-System 對齊 ----
    const vars = extractVarDeclarationsAndReferences(feature.content)
    // 檢查 $variable 引用是否有對應的 >context 宣告或 <executionKey 捕獲
    const declaredContextKeys = new Set<string>()
    for (const d of vars.declarations) {
      // >Context.field → 衍生的變數名有多種可能
      const parts = d.contextKey.split('.')
      if (parts.length === 2) {
        // >User.id → userId, User.id, id
        const entityPart = parts[0]
        const fieldPart = parts[1]
        declaredContextKeys.add(`${entityPart}.${fieldPart}`)
        declaredContextKeys.add(fieldPart)
        declaredContextKeys.add(`${entityPart.charAt(0).toLowerCase() + entityPart.slice(1)}${fieldPart.charAt(0).toUpperCase() + fieldPart.slice(1)}`)
      } else {
        declaredContextKeys.add(d.contextKey)
      }
    }
    const capturedKeys = new Set(vars.executionKeys.map(k => k.keyName))

    for (const ref of vars.references) {
      const varName = ref.varName
      // 系統常數跳過（非一般變數引用，不需要宣告）
      if (SPECFORMULA_SYSTEM_VARS.has(varName.toLowerCase())) continue

      // 檢查是否能解析
      let resolved = false
      // 直接匹配
      if (declaredContextKeys.has(varName)) resolved = true
      // Entity.field 格式
      if (!resolved) {
        for (const dk of declaredContextKeys) {
          if (dk.toLowerCase() === varName.toLowerCase()) {
            // Case 不一致！
            if (dk !== varName) {
              issues.push({
                featureName: displayName,
                checkName: 'var_system_alignment',
                severity: 'error',
                description: `VAR 引用 "$${varName}" (line ${ref.line}) 與宣告 "${dk}" 大小寫不一致 → runtime 可能解析失敗`,
              })
            }
            resolved = true
            break
          }
        }
      }
      // 從 executionKey 捕獲
      if (!resolved) {
        for (const ek of capturedKeys) {
          if (ek.toLowerCase() === varName.toLowerCase()) {
            if (ek !== varName) {
              issues.push({
                featureName: displayName,
                checkName: 'var_system_alignment',
                severity: 'error',
                description: `VAR 引用 "$${varName}" (line ${ref.line}) 與 executionKey "<${ek}" 大小寫不一致`,
              })
            }
            resolved = true
            break
          }
        }
      }

      // Check 5.5：Cross-scenario VAR reference（L23.C）
      // （在 Check 5b 前執行 — 若在本 scenario scope 外宣告，精確指出是 cross-scenario 問題）
      // 注意：此處的 "resolved" 是 flat-scope 結果。下面的 L23.C 檢查會在更精確的 scope 重跑。

      // Check 5b：完全未宣告偵測（L15.P0）
      // 既沒匹配到 declared context key，也沒匹配到 executionKey，也非系統常數 →
      // runtime 會拋「VAR 解析失敗：$X 無法解析為有效值」，整個 scenario fail。
      // 報 error + 明確修復提示，讓 LLM 修復 loop 有方向。
      // Scenario 獨立重 run Background，不允許跨 Feature 引用 → 無匹配一律視為錯。
      if (!resolved) {
        const parts = varName.split('.')
        let suggestion: string
        if (parts.length === 2) {
          // $Entity.field → 建議補宣告
          const entity = parts[0]
          const field = parts[1]
          const entityLower = entity.charAt(0).toLowerCase() + entity.slice(1)
          const fieldUpper = field.charAt(0).toUpperCase() + field.slice(1)
          suggestion = `在 Background / Given 的 DataTable 加入宣告行，例如：\`| >${entity}1.${field} | ... |\` 搭配同 cell 的 \`<${entityLower}1${fieldUpper}\`（或直接用 Entity Mapping 既有的 entity）`
        } else {
          // $someVar → 建議確認 executionKey 捕獲
          suggestion = `確認此變數有在 Background / Given 先宣告（\`>Xxx.yyy\`）或從前一個 Then 回應捕獲（\`<${varName}\`）`
        }
        issues.push({
          featureName: displayName,
          checkName: 'var_system_alignment',
          severity: 'error',
          description: `VAR 引用 "$${varName}" (line ${ref.line}) 完全未宣告 → runtime 會拋「VAR 解析失敗：$${varName} 無法解析為有效值」。${suggestion}`,
        })
      }
    }

    // ---- Check 6: Summary ↔ actionsYml 精確匹配 ----
    if (action) {
      const featureSummary = annotations.featureName || annotations.summary
      if (featureSummary && action.summary) {
        // 去除首尾空白後比較
        const normalizedFeature = featureSummary.trim()
        const normalizedAction = action.summary.trim()
        if (normalizedFeature !== normalizedAction) {
          // 檢查是否只是空白/標點差異
          const stripPunct = (s: string) => s.replace(/[，,。.、；;：:！!？?]/g, '').replace(/\s+/g, '')
          if (stripPunct(normalizedFeature) === stripPunct(normalizedAction)) {
            issues.push({
              featureName: displayName,
              checkName: 'summary_action_match',
              severity: 'warning',
              description: `Feature summary "${normalizedFeature}" 與 actionsYml summary "${normalizedAction}" 有標點/空白差異`,
            })
          } else {
            issues.push({
              featureName: displayName,
              checkName: 'summary_action_match',
              severity: 'error',
              description: `Feature summary "${normalizedFeature}" 與 actionsYml summary "${normalizedAction}" 不一致 → _stepSummary dispatch 會失敗`,
            })
          }
        }
      }
    }

    // ---- Check 6b: When 步驟 summary 必須在 actionsYml 找得到 ----
    // SpecFormula 用 When summary 查 api-spec 找 operation。如果找不到 → 整個 scenario 100% 失敗。
    // 這個檢查是 Check 6 的擴展：Check 6 只比對 Feature 註解，6b 比對每個 When 步驟的實際 summary。
    const whenSummariesInFeature = extractWhenSummaries(feature.content)
    const allActionSummaries = new Set(actionsMeta.map(a => a.summary).filter(Boolean))
    const allActionNames = new Set(actionsMeta.map(a => a.name).filter(Boolean))
    for (const whenSum of whenSummariesInFeature) {
      // 完全相等才算找到（與 SpecFormula findBySummary 第一層匹配一致）
      if (allActionSummaries.has(whenSum)) continue
      // 容錯：如果 whenSum === actionName（罕見，但有些 LLM 會這樣寫）→ 視為等價
      if (allActionNames.has(whenSum)) continue
      issues.push({
        featureName: displayName,
        checkName: 'when_summary_mismatch',
        severity: 'error',
        description: `Feature 的 When 步驟 summary "${whenSum}" 在 actionsYml 找不到對應 operation。SpecFormula findBySummary 會失敗 → 整個 scenario 100% 失敗。actionsYml 現有的 summary：${Array.from(allActionSummaries).slice(0, 5).join(', ')}${allActionSummaries.size > 5 ? ` ...(共 ${allActionSummaries.size} 個)` : ''}`,
      })
    }
  }

  // ---- Check 7: Semantic Consistency（Feature 語義一致性：name vs DataTable / expectation vs Schema） ----
  // 偵測 spec 內部矛盾（e.g. scenario 名稱說「應變為 null」但 DataTable 期望 UUID）
  try {
    const semanticResult = await validateSemanticConsistency({
      features: input.features,
      schemaSql: input.schemaSql,
      entityMapping: input.entityMapping,
      trackingContext: input.trackingContext,
    })
    for (const issue of semanticResult.issues) {
      issues.push({
        featureName: issue.featureName,
        checkName: 'semantic_consistency',
        severity: issue.severity,
        description: `[${issue.issueType}] ${issue.description}\n  建議：${issue.suggestedFix}`,
      })
    }
  } catch (e) {
    // Semantic validator 失敗不阻塞 pipeline（降級跳過）
    logger.warn({ error: e }, 'Semantic consistency 驗證失敗，降級跳過')
  }

  // ---- Check 8: DDL CHECK 約束違反（L17.P1） ----
  // 偵測 entity_setup DataTable 的值是否違反 DDL CHECK 約束。
  // 典型案例：DDL `CHECK (delivery_type IN ('pickup','delivery'))`，Feature 給 `'takeout'` → runtime INSERT 爆
  //   "violates check constraint" 全 scenario fail。
  // 只處理 `IN (...)` / `= 'x'` / 數值比較等簡單 pattern；複雜 expression fail-open 不誤報。
  if (schemas.length > 0) {
    for (const feature of input.features) {
      const displayName = feature.name || feature.actionName
      const setupSteps = extractEntitySetupWithData(feature.content)
      for (const step of setupSteps) {
        const found = DatabaseSchema.findSchemaAndTable(schemas, step.entityName)
        if (!found) continue
        const { table } = found

        // 對每個 header 找出有 CHECK 的 column
        const colsWithCheck: Array<{ col: typeof table.columns[0]; headerIdx: number; spec: CheckSpec }> = []
        for (let h = 0; h < step.rawHeaders.length; h++) {
          const headerRaw = step.rawHeaders[h]
          // 去 > / < / $ 前綴 + 去 entity 前綴（>Store.id → id）
          let clean = headerRaw
          if (clean.startsWith('>') || clean.startsWith('<') || clean.startsWith('$')) clean = clean.substring(1)
          const dotIdx = clean.lastIndexOf('.')
          if (dotIdx >= 0) clean = clean.substring(dotIdx + 1)
          const cleanLower = clean.toLowerCase()
          // 在 table 找對應 column（支援 snake/camel）
          const matched = table.columns.find(c => {
            const cn = c.name.toLowerCase()
            return cn === cleanLower
              || cn === toSnakeCase(clean).toLowerCase()
              || cn === toCamelCase(clean).toLowerCase()
          })
          if (!matched || !matched.checkConstraint) continue
          const spec = parseCheckConstraintSpec(matched.checkConstraint)
          if (!spec) continue // 複雜 CHECK → 跳過不誤報
          colsWithCheck.push({ col: matched, headerIdx: h, spec })
        }

        if (colsWithCheck.length === 0) continue

        // 掃 data rows 驗證值
        for (const row of step.dataRows) {
          for (const { col, headerIdx, spec } of colsWithCheck) {
            if (headerIdx >= row.cells.length) continue
            const cell = row.cells[headerIdx]
            if (!cell) continue
            // runtime value 跳過（$Variable / <executionKey）
            if (cell.startsWith('$') || cell.startsWith('<') || cell.startsWith('>')) continue
            // 去首尾引號做比較
            const stripped = cell.replace(/^['"]|['"]$/g, '')

            if (spec.kind === 'enum') {
              if (!spec.values.includes(stripped)) {
                issues.push({
                  featureName: displayName,
                  checkName: 'check_constraint',
                  severity: 'error',
                  description: `Feature "${displayName}" line ${row.line} 的 "準備一個${step.entityName}" DataTable 值 "${stripped}" 違反欄位 ${col.name} 的 CHECK 約束。允許值：[${spec.values.map(v => `'${v}'`).join(', ')}]`,
                })
              }
            } else if (spec.kind === 'range') {
              const num = parseFloat(stripped)
              if (Number.isNaN(num)) continue // 非數字跳過（可能是 $var 未識別等）
              let ok = true
              switch (spec.op) {
                case '>=': ok = num >= spec.value; break
                case '<=': ok = num <= spec.value; break
                case '>': ok = num > spec.value; break
                case '<': ok = num < spec.value; break
                case '=': ok = num === spec.value; break
              }
              if (!ok) {
                issues.push({
                  featureName: displayName,
                  checkName: 'check_constraint',
                  severity: 'error',
                  description: `Feature "${displayName}" line ${row.line} 的 "準備一個${step.entityName}" DataTable 值 "${stripped}" 違反欄位 ${col.name} 的 CHECK 約束（${spec.op} ${spec.value}）。`,
                })
              }
            }
          }
        }
      }
    }
  }

  // ---- Check 9: Pagination 參數 vs DataTable 驗證衝突（L19.P1） ----
  // 場景：Feature 的 When 步驟 api_call 傳 `page`/`pageSize`/`limit`/`offset` headers → Coder 合理
  //   wrap 回應為 `{items: [...], total, page, pageSize}`。但 Feature 的 Then `...回應, with table:`
  //   DataTable 驗證預設把 response 當純 array → 驗證永遠失敗（實際 List Media Files 實測就是這個）。
  // 解法：Feature 層二選一：用 `with JSON:` 指定 `$.items[*].id`，或移除 pagination input headers。
  for (const feature of input.features) {
    const displayName = feature.name || feature.actionName
    const pr = detectPaginationConflict(feature.content)
    if (pr.hasPaginationInput && pr.hasDataTableValidation && pr.paginationParams.length > 0) {
      // L24.C: 降為 warning（非 error 阻擋）— L22.E + L24.B 的 validator drill-down 已支援
      // wrapped array（object + items/data/rows/results/list 欄位）的單行/多行驗證，大多數 pagination
      // 情境 runtime 可通過。保留為 warning 提示開發者可能的結構不對稱。
      issues.push({
        featureName: displayName,
        checkName: 'pagination_mismatch',
        severity: 'warning',
        description: `Feature "${displayName}" 的 api_call 含分頁參數 [${pr.paginationParams.join(', ')}]，Coder 會回 \`{items:[...], total, page, pageSize}\` wrap 格式。L22.E/L24.B validator drill-down 通常可自動處理，但若 Feature 的 Then 驗證欄位同時出現在 top-level wrap（如 \`total\`）和 item 內（如 \`id\`）可能產生混淆。可改用 \`with JSON:\` + \`$.items[*].id\` 明確指定路徑以避免歧義。`,
      })
    }
  }

  // ── Check 10: DataTable 空 row 偵測（L23.B）──
  //   Given 準備一個 X, with table: 下的 data row 若 cells 全空或只有 VAR capture (<xxxId)，
  //   EntitySetup 會爆「沒有可插入的欄位」。此處提前攔下，避免到 SpecFormula 才炸。
  for (const feature of input.features) {
    const displayName = feature.name || '(unnamed)'
    const setupSteps = extractEntitySetupWithData(feature.content)
    for (const step of setupSteps) {
      for (let rowIdx = 0; rowIdx < step.dataRows.length; rowIdx++) {
        const row = step.dataRows[rowIdx]
        const cells = row.cells
        if (cells.length === 0) continue
        // 有效欄位 = 非空 + 非純 VAR capture（<xxxId）+ 非純 VAR reference（$xxx）
        const hasRealValue = cells.some(raw => {
          const c = (raw || '').trim()
          if (!c) return false
          if (/^<[\w.]+$/.test(c)) return false
          if (/^\$[\w.]+$/.test(c)) return false
          return true
        })
        if (!hasRealValue) {
          issues.push({
            featureName: displayName,
            checkName: 'datatable_empty_row',
            severity: 'error',
            description: `Feature "${displayName}" 的 \`準備一個 ${step.entityName}\` DataTable (line ${row.line}) 整 row 無任何實值（全空或只有 VAR capture/reference）。EntitySetup INSERT 會失敗「沒有可插入的欄位」。請至少提供一個非空、非 \`<\`/\`$\` 前綴的欄位值。`,
          })
        }
      }
    }
  }

  // ── Check 11: Credential 矛盾偵測（L29.C）──
  // 偵測 entity_setup 的 hashed credential 字面值與 When step 測試 plain 值是否有可驗證關係。
  // 三選一才放行：
  //   - 真實 bcrypt hash（$2b$10$... / $2a$10$... / $2y$10$...）— Coder 用 bcrypt.compare
  //   - 字面相等 — Coder 走 plain compare fallback
  //   - 任一為空（不適用本 check）
  // 都不滿足 → warning（避免 Admin Login 那種「永遠 fail」場景）
  const HASHED_FIELDS = ['passwordHash', 'apiKeyHash', 'secretHash', 'tokenHash', 'password_hash', 'api_key_hash']
  const PLAIN_FIELDS = ['password', 'apiKey', 'secret', 'token']
  const BCRYPT_PATTERN = /^\$2[aby]\$\d+\$/

  for (const feature of input.features) {
    const displayName = feature.name || '(unnamed)'
    const setupSteps = extractEntitySetupWithData(feature.content)
    // 收集 entity_setup 的 hashed 欄位字面值（去除 < / $ 前綴的純值）
    const hashedValues = new Map<string, string[]>()  // fieldName → [literal values]
    for (const step of setupSteps) {
      for (let i = 0; i < step.rawHeaders.length; i++) {
        const headerRaw = step.rawHeaders[i]
        const header = headerRaw.replace(/^[><]/, '').trim()
        if (!HASHED_FIELDS.includes(header)) continue
        for (const row of step.dataRows) {
          const cell = (row.cells[i] || '').trim()
          if (!cell) continue
          if (cell.startsWith('<') || cell.startsWith('$') || cell.startsWith('&')) continue
          const stripped = cell.replace(/^["']|["']$/g, '')  // 去掉外層引號
          if (!hashedValues.has(header)) hashedValues.set(header, [])
          hashedValues.get(header)!.push(stripped)
        }
      }
    }
    if (hashedValues.size === 0) continue

    // 從 When call table 抓 plain 字面值（簡易 regex：找 |欄位名| ... 的 data row）
    const lines = feature.content.split('\n')
    const plainValues = new Map<string, string[]>()  // fieldName → [literal values]
    for (let li = 0; li < lines.length; li++) {
      const trimmed = lines[li].trim()
      if (!/(?:When|And)\s+.+,\s*call\s+table:/i.test(trimmed)) continue
      // 找接下來的 header + data row
      let headerLine = ''
      for (let lj = li + 1; lj < lines.length && lj < li + 10; lj++) {
        const t = lines[lj].trim()
        if (!t.startsWith('|')) break
        if (!headerLine) {
          headerLine = t
          continue
        }
        // data row
        const headers = headerLine.split('|').map(c => c.trim()).filter(Boolean)
        const cells = t.split('|').map(c => c.trim())
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)  // 去掉前後空 cell
        for (let ci = 0; ci < headers.length && ci < cells.length; ci++) {
          const h = headers[ci]
          if (!PLAIN_FIELDS.includes(h)) continue
          const v = cells[ci]
          if (!v || v.startsWith('<') || v.startsWith('$') || v.startsWith('&')) continue
          const stripped = v.replace(/^["']|["']$/g, '')
          if (!plainValues.has(h)) plainValues.set(h, [])
          plainValues.get(h)!.push(stripped)
        }
      }
    }

    // 比對：每個 hashed 值要找到匹配的 plain 值（或 hashed 是真 bcrypt format）
    for (const [hashField, hashLiterals] of hashedValues) {
      // 對應的 plain 欄位（passwordHash → password；apiKeyHash → apiKey）
      const plainField = hashField.replace(/Hash$/, '').replace(/_hash$/, '')
      const plainsForField = plainValues.get(plainField) || []
      // L31.fix: 該 Feature 沒有對應的 plain field 比對（如 Update/Delete admin 操作只用 UID 引用，
      // passwordHash 純粹是 entity_setup fixture data，不會被 Coder 拿來 bcrypt.compare）→ 不可能 mismatch
      if (plainsForField.length === 0) continue
      for (const hashLit of hashLiterals) {
        if (BCRYPT_PATTERN.test(hashLit)) continue  // ✅ 真實 bcrypt
        if (plainsForField.includes(hashLit)) continue  // ✅ 字面相等（plain fixture）
        // 三條件都不滿足 → 矛盾
        const samplePlain = plainsForField[0]
        // L31: 從 warning 升級為 error → 觸發 alignment gate 自動修復
        // 原因：warning 不阻擋，Feature 帶矛盾進 Coder 後永遠 fail，浪費所有下游成本
        issues.push({
          featureName: displayName,
          checkName: 'credential_mismatch',
          severity: 'error',
          description: `Feature "${displayName}" 的 \`${hashField}\` 字面值 "${hashLit}" 與測試的 \`${plainField}\` 字面值 "${samplePlain}" 無法對應 → 該 scenario 永遠 fail（bcrypt.compare 失敗因為 "${hashLit}" 不是 bcrypt hash，plain compare 也不等）。**修法**：把 \`${hashField}\` 改為等同於測試 \`${plainField}\` 的明文（例：\`${hashField}: ${samplePlain}\`），讓 Coder 的 plain compare fallback 能匹配。或改為對應的真實 bcrypt hash（\`$2b$10$...\`）。**最簡單**：直接把 \`${hashField}\` 字面值改成 "${samplePlain}"。`,
        })
      }
    }
  }

  // ── Check 12, 13, 15: Then 表期望 vs entity_setup 對齊（L31.A + L31.G 修補）──
  // 真實案例：List Service Items.imageUrl 期望 $notnull，但 entity_setup ServiceItem
  //   只提供 [title, description, isActive]，沒給 imageUrl → 永遠 fail
  // Check 12: $notnull 缺 entity_setup 欄位
  // Check 13: 具體字面值期望（非 sentinel）缺 entity_setup 欄位
  // Check 15: $null 期望但 entity_setup 給了非空值（反向矛盾）
  //
  // L31.G 修補（避免誤報）：
  //   - Skip server-gen / aggregation / metadata：expected field 不在 schema columns → 跳過
  //     例：token (JWT)、total (pagination)、seoSettings (sub-object)、url (uploaded)
  //   - Skip Create/Submit/Update 的 user input：expected literal 在 When call table cells → 跳過
  //     例：Create Service Item 的 name="X"，response echo 自 When call table，不需要 entity_setup
  const SYSTEM_AUTO_FIELDS = new Set([
    'id', 'createdAt', 'updatedAt', 'deletedAt', 'created_at', 'updated_at', 'deleted_at',
    'submittedAt', 'submitted_at', 'publishedAt', 'published_at',
  ])

  // L31.G：解析 schema columns（給「不在 schema → 跳過」用）
  const allSchemaColumns = extractAllSchemaColumnNames(input.schemaSql)

  for (const feature of input.features) {
    const displayName = feature.name || '(unnamed)'

    // 收集整個 Feature 的所有 entity_setup headers union（含 Background）
    const allEntitySetupHeaders = new Set<string>()
    const setupSteps = extractEntitySetupWithData(feature.content)
    for (const step of setupSteps) {
      for (const headerRaw of step.rawHeaders) {
        const header = headerRaw.replace(/^[><]/, '').trim()
        if (!header) continue
        allEntitySetupHeaders.add(header)
        allEntitySetupHeaders.add(toCamelCase(header))
        allEntitySetupHeaders.add(toSnakeCase(header))
      }
    }

    // L31.G：解析 When call table（user API input — Create/Submit/Update 的資料來源）
    const whenCall = extractWhenCallTableValues(feature.content)

    const expectations = extractThenExpectations(feature.content)
    const setupSummary = setupSteps.length > 0
      ? setupSteps.map(s => `${s.entityName}[${s.rawHeaders.map(h => h.replace(/^[><]/, '').trim()).join(', ')}]`).join('; ')
      : '(無 entity_setup)'

    const reported = new Set<string>()
    const fpKey = (sc: string, fn: string, check: string) => `${sc}|${fn}|${check}`

    for (const exp of expectations) {
      if (SYSTEM_AUTO_FIELDS.has(exp.fieldName)) continue

      const fieldVariants = [exp.fieldName, toCamelCase(exp.fieldName), toSnakeCase(exp.fieldName)]
      const inAnySetup = fieldVariants.some(v => allEntitySetupHeaders.has(v))

      // L31.G/H：filter 評估（不再「靜默跳過」，改為標記為 warning 留 audit trail）
      // - 不藏 bug：所有跳過的 case 都進 issues list 供 user/LLM 檢視（severity='warning' 不阻塞）
      // - 真矛盾仍是 error，可被 alignment gate 自動修復
      const inSchema = allSchemaColumns.size > 0 && fieldVariants.some(v => allSchemaColumns.has(v.toLowerCase()) || allSchemaColumns.has(v))
      const inWhenHeaders = fieldVariants.some(v => whenCall.headers.has(v))
      const inWhenValues = exp.expectedValue ? whenCall.values.has(exp.expectedValue) : false

      // 「資料來源」分類
      let dataSourceTag: 'server-gen-or-aggregation' | 'user-input-echo' | 'unverified' | null = null
      if (allSchemaColumns.size > 0 && !inSchema && !inAnySetup) {
        dataSourceTag = 'server-gen-or-aggregation'
      } else if (!inAnySetup && (inWhenHeaders || inWhenValues)) {
        dataSourceTag = 'user-input-echo'
      } else if (!inAnySetup) {
        dataSourceTag = 'unverified'
      }

      // Check 12: $notnull
      if (exp.expectedKind === 'notnull' && !inAnySetup) {
        const k = fpKey(exp.scenarioName, exp.fieldName, 'check12')
        if (reported.has(k)) continue
        reported.add(k)
        if (dataSourceTag === 'server-gen-or-aggregation') {
          // 不阻塞，但留 audit trail（user 可檢視，避免靜默藏真 bug）
          issues.push({
            featureName: displayName,
            checkName: 'notnull_field_missing_from_setup',
            severity: 'warning',
            description: `[資料來源：server-generated 或 aggregation] Scenario "${exp.scenarioName}" 的 \`${exp.fieldName}: $notnull\` — 此欄位**不在 schema 任何 column**，推測為 server 生成（如 token/uploadedAt）或聚合 response（如 seoSettings）。**已自動放行**，不會阻塞 alignment gate。**但若你預期它應該對應 schema 的某個 column → 請補進 schema + entity_setup**。`,
          })
        } else if (dataSourceTag === 'user-input-echo') {
          issues.push({
            featureName: displayName,
            checkName: 'notnull_field_missing_from_setup',
            severity: 'warning',
            description: `[資料來源：user input echo] Scenario "${exp.scenarioName}" 的 \`${exp.fieldName}: $notnull\` — 此欄位在 When call table 出現（user API input），response 通常 echo 回來。**已自動放行**。**但若有 server-side transform 邏輯（hash/encrypt/normalize）→ 請補 entity_setup 或顯式驗證 transformed value**。`,
          })
        } else {
          // 真矛盾：unverified — 報 error 阻塞
          issues.push({
            featureName: displayName,
            checkName: 'notnull_field_missing_from_setup',
            severity: 'error',
            description: `Scenario "${exp.scenarioName}" 的 Then 表期望欄位 \`${exp.fieldName}\` 為 \`$notnull\`，但本 Feature 的 entity_setup DataTable 從未提供 \`${exp.fieldName}\` 值（現有 setup: ${setupSummary}）。DB column 會用預設值（通常 null）→ response 也是 null → \`response_validate\` 永遠失敗 → **LLM 修 code 永遠修不好**（這是 spec 資料矛盾，不是 code bug）。**修法方向（強制）**：把 \`${exp.fieldName}\` 加進對應的 \`準備一個 X, with table:\` headers 並提供值。**禁止**移除 Then 的 \`${exp.fieldName}: $notnull\` 驗證。`,
          })
        }
        continue
      }

      // Check 13: 具體字面值
      if (exp.expectedKind === 'literal' && !inAnySetup) {
        const k = fpKey(exp.scenarioName, exp.fieldName, 'check13')
        if (reported.has(k)) continue
        reported.add(k)
        if (dataSourceTag === 'server-gen-or-aggregation') {
          issues.push({
            featureName: displayName,
            checkName: 'then_concrete_value_missing_from_setup',
            severity: 'warning',
            description: `[資料來源：server-generated 或 aggregation] Scenario "${exp.scenarioName}" 的 \`${exp.fieldName}: ${exp.expectedValue}\` — 此欄位**不在 schema 任何 column**。**已自動放行**。**但若該值來源不明 → 請手動驗證**。`,
          })
        } else if (dataSourceTag === 'user-input-echo') {
          issues.push({
            featureName: displayName,
            checkName: 'then_concrete_value_missing_from_setup',
            severity: 'warning',
            description: `[資料來源：user input echo] Scenario "${exp.scenarioName}" 的 \`${exp.fieldName}: ${exp.expectedValue}\` — 此值在 When call table 出現過（user API input echo）。**已自動放行**。**但若有 transform 邏輯 → 請手動驗證 transformed value**。`,
          })
        } else {
          // 真矛盾（Read 操作 + 沒給）
          issues.push({
            featureName: displayName,
            checkName: 'then_concrete_value_missing_from_setup',
            severity: 'warning',
            description: `Scenario "${exp.scenarioName}" 的 Then 表期望欄位 \`${exp.fieldName}\` 為具體值 \`${exp.expectedValue}\`，但本 Feature 的 entity_setup DataTable 從未提供 \`${exp.fieldName}\` 值（現有 setup: ${setupSummary}）。如果這是 Read 操作 → 真矛盾，需把 \`${exp.fieldName}: ${exp.expectedValue}\` 加進 entity_setup；如果是 Create/Update 操作且該值來自 user API input → 此警告可能誤報，可忽略。`,
          })
        }
        continue
      }

      // Check 15: $null 期望但 entity_setup 給了「該欄位 + 非空字面值」
      if (exp.expectedKind === 'null' && inAnySetup) {
        // 進一步檢查：entity_setup 是否真的給了非空、非 VAR、非 sentinel 的字面值
        let setupGivesNonNullValue = false
        let conflictEntity = ''
        let conflictRowValue = ''
        outerSetupScan: for (const step of setupSteps) {
          for (let hi = 0; hi < step.rawHeaders.length; hi++) {
            const header = step.rawHeaders[hi].replace(/^[><]/, '').trim()
            const headerVariants = [header, toCamelCase(header), toSnakeCase(header)]
            if (!fieldVariants.some(v => headerVariants.includes(v))) continue
            for (const row of step.dataRows) {
              const cell = (row.cells[hi] || '').trim()
              if (!cell) continue
              if (cell.startsWith('<') || cell.startsWith('$') || cell.startsWith('&')) continue
              setupGivesNonNullValue = true
              conflictEntity = step.entityName
              conflictRowValue = cell
              break outerSetupScan
            }
          }
        }
        if (setupGivesNonNullValue) {
          const k = fpKey(exp.scenarioName, exp.fieldName, 'check15')
          if (reported.has(k)) continue
          reported.add(k)
          issues.push({
            featureName: displayName,
            checkName: 'null_expectation_setup_conflict',
            severity: 'error',
            description: `Scenario "${exp.scenarioName}" 的 Then 表期望欄位 \`${exp.fieldName}\` 為 \`$null\`（必須是 null），但 entity_setup \`${conflictEntity}\` 給了 \`${exp.fieldName} = ${conflictRowValue}\` → INSERT 後 \`${exp.fieldName}\` 是 \`${conflictRowValue}\` 不是 null → \`response_validate\` 永遠失敗。**修法方向**：(A) 把 \`${conflictEntity}\` 的 \`${exp.fieldName}\` 從 entity_setup 移除（讓它走 DB DEFAULT/NULL）；或 (B) 修改 Then 不期望 \`${exp.fieldName}\` 為 null（如果業務語意上該欄位本來就會有值）。`,
          })
        }
      }
    }
  }

  // ── Check 14: scenario_scope_setup_mismatch（L31.B）──
  // 比 Check 12 更精準：每 scenario 獨立檢查，不做 Feature-level union
  // 該 scenario 的合法 entity_setup = Background entity_setup + 該 scenario 自身 Given entity_setup
  // 預設 warning（避免 false positive 阻擋合法 spec），環境變數 STRICT_SCENARIO_SCOPE_ALIGNMENT=true 升 error
  const strictScenarioScope = process.env.STRICT_SCENARIO_SCOPE_ALIGNMENT === 'true'
  for (const feature of input.features) {
    const displayName = feature.name || '(unnamed)'
    const { background, scenarios } = splitFeatureIntoScenarios(feature.content)

    // Background entity_setup headers union（所有 scenario 共用）
    const bgHeaders = new Set<string>()
    if (background) {
      const bgSetups = extractEntitySetupWithData(background.content)
      for (const s of bgSetups) {
        for (const h of s.rawHeaders) {
          const clean = h.replace(/^[><]/, '').trim()
          if (!clean) continue
          bgHeaders.add(clean)
          bgHeaders.add(toCamelCase(clean))
          bgHeaders.add(toSnakeCase(clean))
        }
      }
    }

    for (const sc of scenarios) {
      // 該 scenario 自身 Given entity_setup headers
      const localHeaders = new Set<string>()
      const localSetups = extractEntitySetupWithData(sc.content)
      for (const s of localSetups) {
        for (const h of s.rawHeaders) {
          const clean = h.replace(/^[><]/, '').trim()
          if (!clean) continue
          localHeaders.add(clean)
          localHeaders.add(toCamelCase(clean))
          localHeaders.add(toSnakeCase(clean))
        }
      }
      // scenario scope = Background + Local
      const scopeHeaders = new Set([...bgHeaders, ...localHeaders])

      // 解析該 scenario 的 Then expectations（注意 expectations 可能含 Feature-level 但
      // 這裡只看落在該 scenario 範圍的）
      const scExpectations = extractThenExpectations(sc.content)
      const reported = new Set<string>()
      for (const exp of scExpectations) {
        if (SYSTEM_AUTO_FIELDS.has(exp.fieldName)) continue
        if (exp.expectedKind !== 'notnull' && exp.expectedKind !== 'literal') continue
        const fieldVariants = [exp.fieldName, toCamelCase(exp.fieldName), toSnakeCase(exp.fieldName)]
        const inScope = fieldVariants.some(v => scopeHeaders.has(v))
        if (inScope) continue
        // 如果該 scenario 沒覆蓋，但 Feature 其他 scenario 有 → 報 scope 不對齊
        // 否則 Check 12/13 已涵蓋，這裡不重複報
        const allFeatureSetups = extractEntitySetupWithData(feature.content)
        const otherScenarioHasField = allFeatureSetups.some(s =>
          s.rawHeaders.some(h => fieldVariants.includes(h.replace(/^[><]/, '').trim()))
        )
        if (!otherScenarioHasField) continue
        const k = `${exp.scenarioName}|${exp.fieldName}`
        if (reported.has(k)) continue
        reported.add(k)
        issues.push({
          featureName: displayName,
          checkName: 'scenario_scope_setup_mismatch',
          severity: strictScenarioScope ? 'error' : 'warning',
          description: `Scenario "${sc.scenarioName}" 的 Then 期望欄位 \`${exp.fieldName}\`（${exp.expectedKind === 'notnull' ? '$notnull' : `具體值 ${exp.expectedValue}`}），但該 scenario scope（Background + 自身 Given）的 entity_setup **沒有提供** \`${exp.fieldName}\`。Feature 其他 scenario 有提供，但 SpecFormula 每個 scenario 獨立執行 → 該 scenario 的 DB 不會有值 → 永遠失敗。**修法方向**：在該 scenario 的 Given 補上 entity_setup 含 \`${exp.fieldName}\` 欄位，或把該共用 setup 移到 Background 讓所有 scenario 共享。`,
        })
      }
    }
  }

  // ── Check 16: entity_validation_field_missing_from_setup（L31.C）──
  // 「應該存在一個 X, with table:」也是欄位驗證 — 對齊邏輯同 Check 12 但目標是 entity_validate 而非 response
  // 例：應該存在一個 ServiceItem, with table: | imageUrl | $notnull |
  //     如果 entity_setup ServiceItem 沒給 imageUrl 值 → entity_validate 永遠失敗
  for (const feature of input.features) {
    const displayName = feature.name || '(unnamed)'
    const setupSteps = extractEntitySetupWithData(feature.content)
    const validateSteps = extractEntityValidateSteps(feature.content)
    if (validateSteps.length === 0) continue

    // 收集 entity → setup headers map（per entity，不是 union — 因為 entity_validate 比的是特定 entity）
    const setupByEntity = new Map<string, Set<string>>()
    for (const step of setupSteps) {
      const entityKey = step.entityName.toLowerCase()
      if (!setupByEntity.has(entityKey)) setupByEntity.set(entityKey, new Set())
      const set = setupByEntity.get(entityKey)!
      for (const h of step.rawHeaders) {
        const clean = h.replace(/^[><]/, '').trim()
        if (!clean) continue
        set.add(clean)
        set.add(toCamelCase(clean))
        set.add(toSnakeCase(clean))
      }
    }

    const reported = new Set<string>()
    for (const vstep of validateSteps) {
      if (!vstep.shouldExist) continue  // 「應該不存在」不需要對齊（沒這 entity 不需要 setup）
      const entityKey = vstep.entityName.toLowerCase()
      const entitySetupHeaders = setupByEntity.get(entityKey)
      if (!entitySetupHeaders) {
        // 完全沒 setup 該 entity，但要求驗證存在 — 這比 Check 12 更基本，跳過（其他 check 會報）
        continue
      }
      for (let hi = 0; hi < vstep.rawHeaders.length; hi++) {
        const headerRaw = vstep.rawHeaders[hi]
        const fieldName = headerRaw.replace(/^[><]/, '').trim()
        if (!fieldName) continue
        if (SYSTEM_AUTO_FIELDS.has(fieldName)) continue

        const fieldVariants = [fieldName, toCamelCase(fieldName), toSnakeCase(fieldName)]
        if (fieldVariants.some(v => entitySetupHeaders.has(v))) continue

        // 檢查 data row 是否真的對該欄位有非 sentinel 期望
        let hasRealExpectation = false
        let sampleExpected = ''
        for (const row of vstep.dataRows) {
          const cell = (row.cells[hi] || '').trim()
          if (!cell) continue
          const cellLower = cell.toLowerCase()
          if (cellLower === '_' || cell.startsWith('<') || cell.startsWith('$') || cell.startsWith('&')) {
            // var/sentinel — $notnull 算（Check 12 補不到 entity_validate scope，這裡仍要報）
            if (cellLower === '$notnull' || cellLower === '&isnotnull') {
              hasRealExpectation = true
              sampleExpected = '$notnull'
              break
            }
            continue
          }
          hasRealExpectation = true
          sampleExpected = cell
          break
        }
        if (!hasRealExpectation) continue

        const k = `${vstep.scenarioName}|${vstep.entityName}|${fieldName}`
        if (reported.has(k)) continue
        reported.add(k)
        issues.push({
          featureName: displayName,
          checkName: 'entity_validation_field_missing_from_setup',
          severity: 'error',
          description: `Scenario "${vstep.scenarioName}" 的 \`應該存在一個 ${vstep.entityName}, with table:\` 期望欄位 \`${fieldName}\` 為 \`${sampleExpected}\`，但 entity_setup \`${vstep.entityName}\` 從未提供 \`${fieldName}\` 值。entity_validate 會跑 \`SELECT ... WHERE ${fieldName} = ${sampleExpected === '$notnull' ? 'NOT NULL' : sampleExpected}\`，但 INSERT 的 row 該欄位是 null → 永遠 0 row matches → 驗證永遠失敗。**修法方向**：把 \`${fieldName}\` 加進 \`準備一個 ${vstep.entityName}, with table:\` 並提供值（建議與 entity_validate 期望值一致）。`,
        })
      }
    }
  }

  // L24.D: Dedupe — 同一 (featureName, checkName, description) 只報一次
  // 避免 extractWhenSummaries 抓到重複 When 步驟造成多倍誤報（如 1 個 Feature 內 16 個 scenario
  // 各產生一組相同的 summary_uniqueness issue）
  const seen = new Set<string>()
  const dedupedIssues: AlignmentIssue[] = []
  for (const issue of issues) {
    const key = `${issue.featureName}|${issue.checkName}|${issue.description}`
    if (seen.has(key)) continue
    seen.add(key)
    dedupedIssues.push(issue)
  }

  return dedupedIssues
}

/**
 * L19.P1: 偵測 Feature content 的 pagination input vs DataTable validation 衝突
 */
function detectPaginationConflict(content: string): {
  hasPaginationInput: boolean
  hasDataTableValidation: boolean
  paginationParams: string[]
} {
  // L20.F：offset-based + cursor-based + GraphQL style 都涵蓋
  const paginationKeywords = [
    // offset-based
    'page', 'pageSize', 'pagesize', 'limit', 'offset', 'perPage', 'per_page', 'pageNum', 'pageNumber',
    // cursor-based
    'cursor', 'after', 'before', 'startId', 'lastId', 'nextToken', 'pageToken',
    // GraphQL Relay style
    'first', 'last',
  ]
  const lines = content.split('\n')
  const paginationParams = new Set<string>()
  let hasDataTableValidation = false

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()

    // api_call 步驟：收集下一行 DataTable header
    if (/(?:When|And)\s+(?:\(No Actor\)|\(UID="[^"]*"\))\s+.+?[,，]\s*call\s+table:/i.test(trimmed)) {
      for (let j = i + 1; j < lines.length; j++) {
        const tl = lines[j].trim()
        if (!tl.startsWith('|')) break
        // 第一行是 header
        const cells = tl.split('|').map(c => c.trim()).filter(Boolean)
        for (const cell of cells) {
          const clean = cell.replace(/^[>$<]/, '')
          if (paginationKeywords.some(kw => clean.toLowerCase() === kw.toLowerCase())) {
            paginationParams.add(clean)
          }
        }
        break  // 只看 header，不看 data row
      }
    }

    // Then `{summary}(STATUS)回應, with table:` — 2xx status 才算（錯誤情境沒 pagination 衝突）
    const thenMatch = trimmed.match(/^(?:Then|And)\s+.+?\((\d+)\)回應\s*[,，]\s*with\s+table:/i)
    if (thenMatch) {
      const status = parseInt(thenMatch[1], 10)
      if (status >= 200 && status < 300) {
        // 確認有 ≥1 data row（header + 至少 1 row）
        let tableRowCount = 0
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].trim().startsWith('|')) tableRowCount++
          else break
        }
        if (tableRowCount >= 2) hasDataTableValidation = true  // 1 header + ≥1 data row
      }
    }
  }

  return {
    hasPaginationInput: paginationParams.size > 0,
    hasDataTableValidation,
    paginationParams: [...paginationParams],
  }
}

// ============================================================
// 自動修復
// ============================================================

/**
 * L15.P1：對「完全未宣告」的 VAR issue，生成 schema-aware 修復範本附加到 issue hint。
 * Deterministic 查 schema 找到對應 table + 必要欄位 → 產出具體可複製的 Background 補宣告模板。
 * LLM 照範本填入修復後 Feature，不用自己推測 entity → table → required columns 的映射。
 */
export function buildUndeclaredVarRepairHint(
  description: string,
  schemas: DatabaseSchema[],
): string | null {
  // 只處理 Check 5 的「完全未宣告」issue
  if (!description.includes('完全未宣告')) return null
  const match = description.match(/\$([A-Za-z_][\w]*)\.([A-Za-z_][\w]*)/)
  if (!match) return null
  const [, entity, field] = match

  // 查 schema：entityTableMapping key 通常是 PascalCase entity（L13 強制英文後）
  let targetTable: { tableName: string; requiredCols: string[] } | null = null
  for (const schema of schemas) {
    const table = schema.findByEntityName(entity)
    if (table) {
      const required = table.columns
        .filter(c => c.notNull && !c.primaryKey
          && !['created_at', 'updated_at', 'deleted_at'].includes(c.name.toLowerCase()))
        .slice(0, 3)  // 最多提示 3 個必要欄位，避免 DataTable 過長
        .map(c => c.name)
      targetTable = { tableName: table.tableName, requiredCols: required }
      break
    }
  }

  if (!targetTable) {
    // Entity 不在 schema → 可能是規格真的需要新 entity，LLM 需自行處理
    return `【Schema 檢查】entity "${entity}" 不在 Entity Mapping 中。若確實需要，先在 Schema + Entity Mapping 補上；否則改用其他 entity 名。`
  }

  // 產生可複製的 Background 補宣告模板
  const entityLower = entity.charAt(0).toLowerCase() + entity.slice(1)
  const fieldUpper = field.charAt(0).toUpperCase() + field.slice(1)
  const execKey = `${entityLower}1${fieldUpper}`
  const headerCols = ['>' + entity + '1.' + field, ...targetTable.requiredCols]
  const dataRow = ['<' + execKey, ...targetTable.requiredCols.map(c => `Sample ${c}`)]
  const template = `    And 準備一個${entity}, with table:\n      | ${headerCols.join(' | ')} |\n      | ${dataRow.join(' | ')} |`
  return `【Schema 提示】${entity} 對應 table \`${targetTable.tableName}\`，必要欄位：${targetTable.requiredCols.join(', ') || '(無)'}。
在 Background 補上以下宣告（若 Background 不存在則先 \`Background:\` 再加）：
${template}
注意：Sample 值僅為範本，請替換為有業務意義的值。`
}

async function autoFixFeatures(
  features: Array<{ name?: string; actionName: string; content: string }>,
  issues: AlignmentIssue[],
  schemaSql: string,
  entityMapping: string,
  trackingContext?: { userId?: string; conversationId?: string },
): Promise<{
  fixedFeatures: Array<{ name?: string; actionName: string; content: string }>
  fixApplied: boolean
  updatedSchemaSql?: string
  updatedEntityMapping?: string
  usage?: FixUsage  // L31.I：透傳給 runFeatureAlignmentGate 累計
}> {
  // 按 feature 分組 issues
  const issuesByFeature = new Map<string, AlignmentIssue[]>()
  for (const issue of issues) {
    const arr = issuesByFeature.get(issue.featureName) || []
    arr.push(issue)
    issuesByFeature.set(issue.featureName, arr)
  }

  // L15.P1：解析 schema 供修復範本用（失敗時空陣列，fallthrough 到原有 hint）
  let schemasForRepair: DatabaseSchema[] = []
  try {
    schemasForRepair = await parseSchemasFromString(schemaSql, entityMapping)
  } catch (e) {
    logger.warn({ err: e }, 'autoFixFeatures: schema 解析失敗，schema-aware hint 將跳過')
  }

  // L17.P2：Deterministic 補宣告（LLM fix 前置步驟）
  // 目的：對「$X.field 完全未宣告」issue 直接修改 Feature content 補 Background 宣告，
  // 不依賴 LLM。減少 LLM 偷懶改名/刪 scenario 造成的症狀修復。
  const workingFeatures = features.map(f => ({ ...f }))
  let deterministicFixCount = 0
  if (schemasForRepair.length > 0) {
    const { autoDeclareUndeclaredVars } = await import('./deterministic-feature-fix')
    for (let fi = 0; fi < workingFeatures.length; fi++) {
      const displayName = workingFeatures[fi].name || workingFeatures[fi].actionName
      const featureIssues = issuesByFeature.get(displayName) || []
      const undeclared: Array<{ entity: string; field: string }> = []
      const seen = new Set<string>()
      for (const it of featureIssues) {
        if (it.checkName !== 'var_system_alignment') continue
        if (!it.description.includes('完全未宣告')) continue
        const m = it.description.match(/\$([A-Za-z_][\w]*)\.([A-Za-z_][\w]*)/)
        if (!m) continue
        const key = `${m[1]}.${m[2]}`
        if (seen.has(key)) continue
        seen.add(key)
        undeclared.push({ entity: m[1], field: m[2] })
      }
      if (undeclared.length === 0) continue

      try {
        const result = autoDeclareUndeclaredVars(workingFeatures[fi].content, undeclared, schemasForRepair)
        if (result.declaredEntities.length > 0) {
          workingFeatures[fi] = { ...workingFeatures[fi], content: result.content }
          deterministicFixCount += result.declaredEntities.length
          logger.info({
            feature: displayName,
            declaredEntities: result.declaredEntities,
            skippedWithReason: result.skippedWithReason,
          }, 'Deterministic 補宣告')
          recordTelemetry({
            skillName: 'feature_gate', eventType: 'alignment_fixed',
            patternKey: 'deterministic_declared_vars', outcome: 'repaired', phase: 'feature_alignment_gate',
            userId: trackingContext?.userId, conversationId: trackingContext?.conversationId,
            payload: { feature: displayName, declaredCount: result.declaredEntities.length, skipped: result.skippedWithReason.length },
          }).catch(() => {})
        }
      } catch (e) {
        logger.warn({ err: e, feature: displayName }, 'Deterministic 補宣告失敗，fallthrough 到 LLM')
      }
    }

    // L19.P0.1 + P0.2：對所有 feature 再跑一次單層 VAR gap 填補 + 空 entity_setup 刪除
    // 這兩個 pass 不依賴 issue list（主動 scan content），所以對「Check 5 抓不到但 runtime 會爆」
    // 的場景也有效（例如 $section6Id 這類單層變數，Check 5 只偵測 $Entity.field 格式）
    const { autoFillSingleLayerVarGaps, removeEmptyEntitySetup } = await import('./deterministic-feature-fix')
    for (let fi = 0; fi < workingFeatures.length; fi++) {
      const displayName = workingFeatures[fi].name || workingFeatures[fi].actionName
      try {
        const gapResult = autoFillSingleLayerVarGaps(workingFeatures[fi].content, schemasForRepair)
        if (gapResult.filledGaps.length > 0) {
          workingFeatures[fi] = { ...workingFeatures[fi], content: gapResult.content }
          deterministicFixCount += gapResult.filledGaps.length
          recordTelemetry({
            skillName: 'feature_gate', eventType: 'alignment_fixed',
            patternKey: 'deterministic_single_layer_vars', outcome: 'repaired', phase: 'feature_alignment_gate',
            userId: trackingContext?.userId, conversationId: trackingContext?.conversationId,
            payload: { feature: displayName, gapCount: gapResult.filledGaps.length },
          }).catch(() => {})
        }
        const emptyResult = removeEmptyEntitySetup(workingFeatures[fi].content)
        if (emptyResult.removed.length > 0) {
          workingFeatures[fi] = { ...workingFeatures[fi], content: emptyResult.content }
          deterministicFixCount += emptyResult.removed.length
          recordTelemetry({
            skillName: 'feature_gate', eventType: 'alignment_fixed',
            patternKey: 'deterministic_removed_empty_setup', outcome: 'repaired', phase: 'feature_alignment_gate',
            userId: trackingContext?.userId, conversationId: trackingContext?.conversationId,
            payload: { feature: displayName, removedCount: emptyResult.removed.length, entities: emptyResult.removed },
          }).catch(() => {})
        }
      } catch (e) {
        logger.warn({ err: e, feature: displayName }, 'L19 deterministic 單層 VAR/空 setup 修復失敗，fallthrough')
      }
    }
  }

  // ============================================================
  // R1：Check 12/14/15/16 deterministic 修補（取代 LLM）
  // 條件：env R1_DETERMINISTIC_ALIGNMENT_FIX=true（預設 true，可 rollback）
  // 失敗安全網：每 helper 跑完後 try-catch，跑完整體 deterministic 後重跑
  //   runAlignmentChecks 比對 issue set — 若 deterministic 引入新 error → 整批回退
  // ============================================================
  const r1Enabled = process.env.R1_DETERMINISTIC_ALIGNMENT_FIX !== 'false'
  if (r1Enabled && schemasForRepair.length > 0) {
    const {
      autoFillNotnullSetupGap,
      autoRemoveNullConflictSetup,
      autoFillEntityValidateGap,
      autoFillScenarioScopeSetup,
    } = await import('./deterministic-feature-fix')

    // pre-R1 snapshot 供回退用
    const preR1Snapshot = workingFeatures.map(f => ({ ...f }))
    const preR1ErrorFingerprints = issues
      .filter(i => i.severity === 'error')
      .map(i => issueFingerprint(i))
    const preR1ErrorSet = new Set(preR1ErrorFingerprints)

    let r1FixCount = 0
    for (let fi = 0; fi < workingFeatures.length; fi++) {
      const displayName = workingFeatures[fi].name || workingFeatures[fi].actionName
      const featureIssues = issuesByFeature.get(displayName) || []
      if (featureIssues.length === 0) continue

      let curContent = workingFeatures[fi].content
      const allFixed: Array<{ checkName: string; field: string; entity?: string }> = []

      // Helper 1: Check 12 notnull
      try {
        const r = autoFillNotnullSetupGap(curContent, featureIssues, schemasForRepair)
        if (r.fixedFields.length > 0) {
          curContent = r.content
          for (const f of r.fixedFields) allFixed.push({ checkName: 'notnull_field_missing_from_setup', field: f.field, entity: f.entity })
        }
      } catch (e) {
        logger.warn({ err: e, feature: displayName }, 'R1: autoFillNotnullSetupGap 失敗，fallthrough')
      }

      // Helper 2: Check 15 null conflict
      try {
        const r = autoRemoveNullConflictSetup(curContent, featureIssues)
        if (r.removedFields.length > 0) {
          curContent = r.content
          for (const f of r.removedFields) allFixed.push({ checkName: 'null_expectation_setup_conflict', field: f.field, entity: f.entity })
        }
      } catch (e) {
        logger.warn({ err: e, feature: displayName }, 'R1: autoRemoveNullConflictSetup 失敗，fallthrough')
      }

      // Helper 3: Check 16 entity validate
      try {
        const r = autoFillEntityValidateGap(curContent, featureIssues, schemasForRepair)
        if (r.fixedFields.length > 0) {
          curContent = r.content
          for (const f of r.fixedFields) allFixed.push({ checkName: 'entity_validation_field_missing_from_setup', field: f.field, entity: f.entity })
        }
      } catch (e) {
        logger.warn({ err: e, feature: displayName }, 'R1: autoFillEntityValidateGap 失敗，fallthrough')
      }

      // Helper 4: Check 14 scenario scope
      try {
        const r = autoFillScenarioScopeSetup(curContent, featureIssues, schemasForRepair)
        if (r.fixedFields.length > 0) {
          curContent = r.content
          for (const f of r.fixedFields) allFixed.push({ checkName: 'scenario_scope_setup_mismatch', field: f.field, entity: f.entity })
        }
      } catch (e) {
        logger.warn({ err: e, feature: displayName }, 'R1: autoFillScenarioScopeSetup 失敗，fallthrough')
      }

      // R3-A: 擴大 deterministic 覆蓋（Check 4/8/10）— 獨立 kill switch
      const r3aEnabled = process.env.R3A_DETERMINISTIC_EXPANSION !== 'false'
      if (r3aEnabled) {
        // R3-A Helper 1: Check 4 response_field_naming（snake → camel）
        try {
          const { autoFixResponseFieldNaming } = await import('./deterministic-feature-fix')
          const r = autoFixResponseFieldNaming(curContent, featureIssues)
          if (r.renamedFields.length > 0) {
            curContent = r.content
            for (const f of r.renamedFields) allFixed.push({ checkName: 'response_field_naming', field: f.to })
          }
        } catch (e) {
          logger.warn({ err: e, feature: displayName }, 'R3-A: autoFixResponseFieldNaming 失敗，fallthrough')
        }

        // R3-A Helper 2: Check 10 datatable_empty_row（刪掉全空 row）
        try {
          const { autoRemoveEmptyDataRows } = await import('./deterministic-feature-fix')
          const r = autoRemoveEmptyDataRows(curContent, featureIssues)
          if (r.removedRows.length > 0) {
            curContent = r.content
            for (const row of r.removedRows) allFixed.push({ checkName: 'datatable_empty_row', field: `line ${row.line}`, entity: row.entity })
          }
        } catch (e) {
          logger.warn({ err: e, feature: displayName }, 'R3-A: autoRemoveEmptyDataRows 失敗，fallthrough')
        }

        // R3-A Helper 3: Check 8 check_constraint（enum/range 替換成合法值）
        try {
          const { autoFixCheckConstraintViolation } = await import('./deterministic-feature-fix')
          const r = autoFixCheckConstraintViolation(curContent, featureIssues, schemasForRepair)
          if (r.fixedValues.length > 0) {
            curContent = r.content
            for (const v of r.fixedValues) allFixed.push({ checkName: 'check_constraint', field: `${v.column}:${v.from}→${v.to}`, entity: v.entity })
          }
        } catch (e) {
          logger.warn({ err: e, feature: displayName }, 'R3-A: autoFixCheckConstraintViolation 失敗，fallthrough')
        }
      }

      // R4: Check 5.5 cross_scenario_var_reference（複製跨 scenario 引用的 entity_setup 到本 scenario Given）
      const r4Enabled = process.env.R4_CROSS_SCENARIO_VAR_FIX !== 'false'
      if (r4Enabled) {
        try {
          const { autoFillCrossScenarioVarReference } = await import('./deterministic-feature-fix')
          const r = autoFillCrossScenarioVarReference(curContent, featureIssues)
          if (r.fixedRefs.length > 0) {
            curContent = r.content
            for (const f of r.fixedRefs) allFixed.push({ checkName: 'cross_scenario_var_reference', field: `${f.varName}@${f.targetScenario}` })
          }
        } catch (e) {
          logger.warn({ err: e, feature: displayName }, 'R4: autoFillCrossScenarioVarReference 失敗，fallthrough')
        }
      }

      // Fix C: var_in_call_table — strip `>` / `<` 從 WHEN call table headers
      // 主動 scan（不依賴 issue），因為 var_in_call_table 由 RED Phase 報，不在 alignment gate
      const fixCEnabled = process.env.FIX_C_STRIP_VAR_IN_CALL_TABLE !== 'false'
      if (fixCEnabled) {
        try {
          const { autoStripVarPrefixFromCallTable } = await import('./deterministic-feature-fix')
          const r = autoStripVarPrefixFromCallTable(curContent)
          if (r.strippedHeaders.length > 0) {
            curContent = r.content
            for (const h of r.strippedHeaders) allFixed.push({ checkName: 'var_in_call_table', field: `${h.from}→${h.to}` })
          }
        } catch (e) {
          logger.warn({ err: e, feature: displayName }, 'Fix C: autoStripVarPrefixFromCallTable 失敗，fallthrough')
        }
      }

      if (allFixed.length > 0) {
        workingFeatures[fi] = { ...workingFeatures[fi], content: curContent }
        r1FixCount += allFixed.length
        deterministicFixCount += allFixed.length
        recordTelemetry({
          skillName: 'feature_gate',
          eventType: 'alignment_fixed',
          patternKey: 'deterministic_alignment_fix',
          outcome: 'repaired',
          phase: 'feature_alignment_gate',
          userId: trackingContext?.userId,
          conversationId: trackingContext?.conversationId,
          payload: { feature: displayName, fixed: allFixed },
        }).catch(() => {})
        logger.info({ feature: displayName, fixed: allFixed }, 'R1: deterministic alignment 修補完成')
      }
    }

    // 安全網：R1 修完後對每個 mutated feature 做結構完整性檢查
    // - 每行 DataTable 的 cell count 一致（header rows 與 data rows）
    // - 至少還有原來的 entity_setup steps（不會憑空消失）
    // 任一 feature 失敗 → 整批回退到 preR1 snapshot，由 LLM 接手
    if (r1FixCount > 0) {
      let safetyNetFailed = false
      for (let fi = 0; fi < workingFeatures.length; fi++) {
        const before = preR1Snapshot[fi].content
        const after = workingFeatures[fi].content
        if (before === after) continue  // 沒動過

        try {
          // 結構檢查 1：每個 DataTable 區塊內所有行的 cell count 一致
          const afterLines = after.split('\n')
          let inTable = false
          let tableCellCount = -1
          for (const line of afterLines) {
            const trimmed = line.trim()
            if (trimmed.startsWith('|')) {
              const cells = trimmed.split('|').length - 2  // 去頭尾空字串
              if (!inTable) {
                inTable = true
                tableCellCount = cells
              } else if (cells !== tableCellCount) {
                throw new Error(`DataTable cell count 不一致：期望 ${tableCellCount}，實際 ${cells}`)
              }
            } else {
              inTable = false
              tableCellCount = -1
            }
          }
          // 結構檢查 2：entity_setup count 不減少
          const beforeSetupCount = extractEntitySetupWithData(before).length
          const afterSetupCount = extractEntitySetupWithData(after).length
          if (afterSetupCount < beforeSetupCount) {
            throw new Error(`entity_setup 從 ${beforeSetupCount} 降到 ${afterSetupCount}`)
          }
        } catch (e) {
          logger.warn({ err: e, feature: workingFeatures[fi].name }, 'R1: 安全網結構檢查失敗，將整批回退')
          safetyNetFailed = true
          break
        }
      }
      if (safetyNetFailed) {
        for (let i = 0; i < workingFeatures.length; i++) workingFeatures[i] = preR1Snapshot[i]
        deterministicFixCount -= r1FixCount
      } else {
        logger.info({ r1FixCount, preErrorCount: preR1ErrorFingerprints.length }, 'R1: 安全網通過，保留 deterministic 修補')
      }
    }
  }

  // 若 deterministic 已修完所有 feature 的 var issues → 直接回傳，skip LLM
  if (deterministicFixCount > 0) {
    // 重新驗證：如果這次 deterministic 補完後剩下 error 都不是 var_system_alignment → LLM 也不用跑
    // 但保守起見仍走 LLM 修剩餘 issue（例如 check_constraint / summary_action_match 等）
    // 所以下面的 featuresToFix 會重新從 workingFeatures 建
  }

  // 構建 FeatureFixInput
  // L17.P2：用 workingFeatures（已 deterministic 補宣告）而非原 features
  //   這樣 LLM 看到的 content 已含 Background 宣告，只需修剩下的 issue（check_constraint / summary_action_match）
  //   deterministic 已修的 var_system_alignment issue 不會再報，所以 errorIssues 自動縮小
  const featuresToFix: FeatureFixInput[] = []
  for (const feature of workingFeatures) {
    const displayName = feature.name || feature.actionName
    const featureIssues = issuesByFeature.get(displayName)
    if (!featureIssues || featureIssues.length === 0) continue

    // 只修 error 級 issues，且排除 deterministic 已處理的 var_system_alignment-未宣告
    // （deterministic 補後再跑 runAlignmentChecks 會省略，但我們這邊還拿著舊 issues 列表；
    //  LLM 修時應忽略已由 deterministic 處理的，避免重複工作）
    const errorIssues = featureIssues.filter(i => {
      if (i.severity !== 'error') return false
      if (deterministicFixCount > 0 && i.checkName === 'var_system_alignment'
          && i.description.includes('完全未宣告')) {
        return false  // deterministic 已補宣告，跳過這類 issue
      }
      return true
    })
    if (errorIssues.length === 0) continue

    // Harness 修復提示：把已知 checkName 轉成 rootCause hint 附加到 issue 描述
    const issuesWithHints = errorIssues.map(i => {
      const rootCause = alignmentCheckToRootCause(i.checkName)
      const enriched = enrichError(i.description, rootCause, { phase: 'feature_alignment' })
      // L15.P1: schema-aware 修復範本（只對 var_system_alignment 的「完全未宣告」case，保留給 deterministic 跳過的）
      const schemaHint = i.checkName === 'var_system_alignment' && schemasForRepair.length > 0
        ? buildUndeclaredVarRepairHint(i.description, schemasForRepair)
        : null
      // L31.D: per-check 強制修法方向（防止 LLM 修錯方向）
      const repairDirection = CHECK_REPAIR_DIRECTION[i.checkName]
      const parts = [`[${i.checkName}] ${i.description}`]
      if (enriched.harnessHint) {
        const hintShort = enriched.harnessHint.split('\n').slice(0, 2).join(' ')
        parts.push(`  → Harness: ${hintShort}`)
      }
      if (schemaHint) {
        parts.push(`  → ${schemaHint}`)
      }
      if (repairDirection) {
        parts.push(`  → ${repairDirection}`)
      }
      return parts.join('\n')
    })

    featuresToFix.push({
      name: feature.name || feature.actionName,
      actionName: feature.actionName,
      content: feature.content,
      issues: issuesWithHints,
    })
  }

  if (featuresToFix.length === 0) {
    // deterministic 補宣告後沒有剩餘 issue 要送 LLM → 直接回傳修過的 features
    if (deterministicFixCount > 0) {
      return { fixedFeatures: workingFeatures, fixApplied: true }
    }
    return { fixedFeatures: features, fixApplied: false }
  }

  logger.info({ featureCount: featuresToFix.length, issueCount: featuresToFix.reduce((sum, f) => sum + f.issues.length, 0) }, 'Alignment Gate: 嘗試自動修復 Features')

  // R2: 跨 loop fingerprint cache — LLM call 前 check
  const r2Enabled = process.env.R2_FIX_ATTEMPT_CACHE !== 'false'
  let fingerprintsForCache: string[] = []
  if (r2Enabled && trackingContext?.conversationId) {
    const { buildFingerprint, shouldSkipLlmFix } = await import('../lib/fix-attempt-cache')
    fingerprintsForCache = featuresToFix.flatMap(f =>
      f.issues.map(issueText => {
        // issueText 格式：`[checkName] description\n  → Harness: ...`
        const checkMatch = issueText.match(/^\[([^\]]+)\]\s*(.+?)(?:\n|$)/)
        const checkName = checkMatch?.[1] ?? 'unknown'
        const desc = checkMatch?.[2] ?? issueText
        return buildFingerprint({
          loopName: 'alignment_gate',
          featureName: f.name || f.actionName,
          issueKind: checkName,
          keyContent: desc,
        })
      })
    )
    const skipCheck = await shouldSkipLlmFix(trackingContext.conversationId, fingerprintsForCache)
    if (skipCheck.skip) {
      logger.warn({
        reason: skipCheck.reason,
        fingerprintCount: fingerprintsForCache.length,
        attemptCounts: skipCheck.attemptCounts,
      }, 'R2: alignment_gate LLM 修補 skip（cache hit — 全部 issue 已多次嘗試）')
      const { recordTelemetry } = await import('./skill-telemetry')
      recordTelemetry({
        skillName: 'feature_gate',
        eventType: 'cross_loop_fix_skipped',
        patternKey: 'alignment_gate_skipped_by_cache',
        outcome: 'blocked',
        phase: 'feature_alignment_gate',
        severity: 'warning',
        userId: trackingContext.userId,
        conversationId: trackingContext.conversationId,
        payload: { fingerprintCount: fingerprintsForCache.length, attemptCounts: skipCheck.attemptCounts },
      }).catch(() => {})
      return { fixedFeatures: workingFeatures, fixApplied: deterministicFixCount > 0 }
    }
  }

  const result = await fixMultipleFeatures(
    featuresToFix,
    [], // 沒有 clarifyItems（這是 post-BDD 修復）
    schemaSql,
    entityMapping,
    trackingContext,
  )

  if (!result.success || !result.fixedFeatures) {
    logger.warn({ error: result.error }, 'Alignment Gate: LLM 修復失敗')
    return { fixedFeatures: features, fixApplied: false }
  }

  // 合併修復結果：用修復後的 feature 替換原始 feature
  // L17.P2：base 從 workingFeatures（deterministic 已補）開始，LLM 修的覆蓋其上
  const fixedMap = new Map<string, GeneratedFeature>()
  for (const ff of result.fixedFeatures) {
    fixedMap.set(ff.actionName, ff)
  }

  const merged = workingFeatures.map(f => {
    const fixed = fixedMap.get(f.actionName)
    if (fixed) {
      // 後置 sanitize
      const { content: sanitized } = sanitizeFeatureContent(fixed.content)
      return { ...f, content: sanitized }
    }
    return f  // LLM 沒碰 → 保留 workingFeatures 版本（可能已 deterministic 補過）
  })

  // R2: LLM 修完後寫 cache — 所有送修 fingerprints 記為「已嘗試一次」（succeeded 由下輪 alignment 重檢知道）
  // 此處保守記為 succeeded=false（讓下輪能再試）；真實成功與否由下次 runAlignmentChecks 決定
  if (r2Enabled && trackingContext?.conversationId && fingerprintsForCache.length > 0) {
    const { recordBatchAttempt } = await import('../lib/fix-attempt-cache')
    recordBatchAttempt(trackingContext.conversationId, [], fingerprintsForCache).catch(() => {})
  }

  return {
    fixedFeatures: merged,
    fixApplied: true,
    updatedSchemaSql: result.updatedSchemaSql,
    updatedEntityMapping: result.updatedEntityMapping,
    usage: result.usage,  // L31.I：透傳 LLM cost 給 alignment gate 累計
  }
}

// ============================================================
// 主入口
// ============================================================

const MAX_FIX_ROUNDS = 2

/**
 * L17.P0.3：把 issue 轉成指紋 key（feature|check|line|var）供 fix 前後比對。
 * 目的：擋 LLM「改名症狀修復」— 例如把 $Store.id 改成 $storeId（仍未宣告）→
 *   純 errorCount 比對看起來「一樣」，但 fingerprint 能看出是「解了 A、新增了 B」。
 * 從 issue.description 抽取穩定部分：`$var` 名 + `line N`（若有）。
 */
export function issueFingerprint(i: AlignmentIssue): string {
  const lineMatch = i.description.match(/line\s+(\d+)/)
  const varMatch = i.description.match(/\$([A-Za-z_][\w.]*)/)
  // line 或 var 缺任一都退化為「只靠 checkName + featureName」比對，寬鬆一點不誤報
  return `${i.featureName}|${i.checkName}|${lineMatch?.[1] ?? '?'}|${varMatch?.[1] ?? '?'}`
}

export async function runFeatureAlignmentGate(input: AlignmentGateInput): Promise<AlignmentGateResult> {
  const start = Date.now()
  let currentFeatures = input.features
  let currentSchemaSql = input.schemaSql
  let currentEntityMapping = input.entityMapping
  let latestFixedSchemaSql: string | undefined
  let latestFixedEntityMapping: string | undefined
  let totalFixedCount = 0

  // L25.A: 追蹤「最佳版本」— LLM 可能越修越糟（例：13 issue → 32 issue），
  // 此時不該 return 最後那份更糟的，而是回到錯誤數最少的版本
  let bestFeatures: typeof currentFeatures = [...currentFeatures]
  let bestErrorCount = Infinity
  let bestSchemaSql: string | undefined
  let bestEntityMapping: string | undefined

  // L31.I：Cost guardrail — 累計 LLM call 次數 + cost USD，超過上限就 break
  // 防止 alignment gate 失控（c9cefcc6 案例：81 calls / $8.62）
  const env = getEnv()
  const MAX_LLM_CALLS_PER_GATE = env.ALIGNMENT_GATE_MAX_LLM_CALLS
  const MAX_COST_USD_PER_GATE = env.ALIGNMENT_GATE_MAX_COST_USD
  let cumulativeLlmCalls = 0
  let cumulativeCostUsd = 0

  for (let round = 0; round < MAX_FIX_ROUNDS; round++) {
    // 執行檢查（使用可能已更新的 schema）
    const issues = await runAlignmentChecks({ ...input, features: currentFeatures, schemaSql: currentSchemaSql, entityMapping: currentEntityMapping })
    const errorIssues = issues.filter(i => i.severity === 'error')

    // L25.A: 每輪更新最佳版本（錯誤數嚴格更少才算更好，避免平手時誤替換）
    if (errorIssues.length < bestErrorCount) {
      bestErrorCount = errorIssues.length
      bestFeatures = [...currentFeatures]
      bestSchemaSql = currentSchemaSql !== input.schemaSql ? currentSchemaSql : undefined
      bestEntityMapping = currentEntityMapping !== input.entityMapping ? currentEntityMapping : undefined
    }

    logger.info({
      round: round + 1,
      totalIssues: issues.length,
      errors: errorIssues.length,
      warnings: issues.length - errorIssues.length,
      bestErrorCount,
    }, 'Alignment Gate: 檢查完成')

    // 無 error 級問題 → 通過
    if (errorIssues.length === 0) {
      if (totalFixedCount > 0) {
        recordTelemetry({
          skillName: 'feature_gate', eventType: 'alignment_fixed',
          patternKey: 'gate_passed_after_fix', outcome: 'repaired', phase: 'feature_alignment_gate',
          fixRounds: round + 1,
          userId: input.trackingContext?.userId, conversationId: input.trackingContext?.conversationId,
          payload: { fixedCount: totalFixedCount, warningCount: issues.filter(i => i.severity === 'warning').length },
        }).catch(() => {})
      }
      return {
        passed: true,
        blocked: false,
        fixedFeatures: totalFixedCount > 0 ? bestFeatures : undefined,
        fixedSchemaSql: bestSchemaSql ?? latestFixedSchemaSql,
        fixedEntityMapping: bestEntityMapping ?? latestFixedEntityMapping,
        issues,
        fixedIssueCount: totalFixedCount,
        remainingIssueCount: issues.filter(i => i.severity === 'warning').length,
        durationMs: Date.now() - start,
      }
    }

    // 最後一輪不修了
    if (round === MAX_FIX_ROUNDS - 1) {
      const blockMessage = formatBlockMessage(errorIssues)
      const checkNames = [...new Set(errorIssues.map(i => i.checkName))]
      recordTelemetry({
        skillName: 'feature_gate', eventType: 'alignment_blocked',
        patternKey: checkNames.join(','), outcome: 'blocked', phase: 'feature_alignment_gate',
        fixRounds: MAX_FIX_ROUNDS, severity: 'critical',
        userId: input.trackingContext?.userId, conversationId: input.trackingContext?.conversationId,
        payload: { errorCount: errorIssues.length, checkNames, fixedTotal: totalFixedCount },
      }).catch(() => {})
      return {
        passed: false,
        blocked: true,
        fixedFeatures: totalFixedCount > 0 ? bestFeatures : undefined,
        fixedSchemaSql: bestSchemaSql ?? latestFixedSchemaSql,
        fixedEntityMapping: bestEntityMapping ?? latestFixedEntityMapping,
        issues,
        fixedIssueCount: totalFixedCount,
        remainingIssueCount: errorIssues.length,
        blockMessage,
        durationMs: Date.now() - start,
      }
    }

    // 嘗試自動修復
    const beforeCount = errorIssues.length
    const { fixedFeatures, fixApplied, updatedSchemaSql, updatedEntityMapping, usage } = await autoFixFeatures(
      currentFeatures,
      issues,
      currentSchemaSql,
      currentEntityMapping,
      input.trackingContext,
    )

    // L31.I：累計 cost + 觸發 guardrail（在 fixApplied check 後處理，先讓正常流程跑）
    if (usage) {
      cumulativeLlmCalls += usage.callCount
      cumulativeCostUsd += usage.costUsd
    }

    const breach = checkAlignmentCostBreach(cumulativeLlmCalls, cumulativeCostUsd, MAX_LLM_CALLS_PER_GATE, MAX_COST_USD_PER_GATE)
    if (breach.breached) {
      logger.warn({
        cumulativeLlmCalls, cumulativeCostUsd,
        maxCalls: MAX_LLM_CALLS_PER_GATE, maxCostUsd: MAX_COST_USD_PER_GATE,
        round: round + 1, fixedTotal: totalFixedCount,
        conversationId: input.trackingContext?.conversationId,
      }, 'Alignment Gate: Cost guardrail breached, stopping fix loop')

      recordTelemetry({
        skillName: 'feature_gate', eventType: 'alignment_blocked',
        patternKey: 'cost_guardrail_breach', outcome: 'blocked', phase: 'feature_alignment_gate',
        fixRounds: round + 1, severity: 'warning',
        userId: input.trackingContext?.userId,
        conversationId: input.trackingContext?.conversationId,
        payload: {
          cumulativeLlmCalls, cumulativeCostUsd,
          maxCalls: MAX_LLM_CALLS_PER_GATE, maxCostUsd: MAX_COST_USD_PER_GATE,
          fixedCount: totalFixedCount,
        },
      }).catch(() => {})

      // 即使 break 也要先合併這次的 fix 結果（已花了錢，能用就用）
      const recheckedAfterBreak = fixApplied
        ? await runAlignmentChecks({ ...input, features: fixedFeatures, schemaSql: updatedSchemaSql ?? currentSchemaSql, entityMapping: updatedEntityMapping ?? currentEntityMapping })
        : issues
      const errorsAfterBreak = recheckedAfterBreak.filter(i => i.severity === 'error')

      // 用 best 版本（更少 error 才採用）
      const finalFeatures = fixApplied && errorsAfterBreak.length < bestErrorCount ? fixedFeatures : bestFeatures
      const finalSchemaSql = fixApplied && errorsAfterBreak.length < bestErrorCount ? updatedSchemaSql : (bestSchemaSql ?? latestFixedSchemaSql)
      const finalEntityMapping = fixApplied && errorsAfterBreak.length < bestErrorCount ? updatedEntityMapping : (bestEntityMapping ?? latestFixedEntityMapping)

      return {
        passed: false,
        blocked: true,
        fixedFeatures: finalFeatures,
        fixedSchemaSql: finalSchemaSql,
        fixedEntityMapping: finalEntityMapping,
        issues: recheckedAfterBreak,
        fixedIssueCount: totalFixedCount,
        remainingIssueCount: errorsAfterBreak.length,
        blockMessage: `**Alignment Gate Cost Guardrail 觸發** — 累計 ${cumulativeLlmCalls} LLM calls / $${cumulativeCostUsd.toFixed(2)} USD 已達上限（防止失控修復）。\n\n已修 ${totalFixedCount} 個 issue，剩餘 ${errorsAfterBreak.length} 個未解。建議：\n- 手動審查 BDD spec\n- 或調整 env: \`ALIGNMENT_GATE_MAX_LLM_CALLS\` / \`ALIGNMENT_GATE_MAX_COST_USD\``,
        durationMs: Date.now() - start,
      }
    }

    if (!fixApplied) {
      // LLM 修復失敗 → 阻塞
      const blockMessage = formatBlockMessage(errorIssues)
      recordTelemetry({
        skillName: 'feature_gate', eventType: 'alignment_blocked',
        patternKey: 'llm_fix_failed', outcome: 'blocked', phase: 'feature_alignment_gate',
        fixRounds: round + 1, severity: 'critical',
        userId: input.trackingContext?.userId, conversationId: input.trackingContext?.conversationId,
        payload: { errorCount: errorIssues.length },
      }).catch(() => {})
      return {
        passed: false,
        blocked: true,
        fixedFeatures: totalFixedCount > 0 ? bestFeatures : undefined,
        issues,
        fixedIssueCount: totalFixedCount,
        remainingIssueCount: errorIssues.length,
        blockMessage,
        durationMs: Date.now() - start,
      }
    }

    // L31.D：保留 before snapshot 給 post-fix 方向審計用（必須在覆寫 currentFeatures 前）
    const beforeFeaturesSnapshot = currentFeatures.map(f => ({ name: f.name, actionName: f.actionName, content: f.content }))

    currentFeatures = fixedFeatures
    if (updatedSchemaSql) {
      currentSchemaSql = updatedSchemaSql
      latestFixedSchemaSql = updatedSchemaSql
    }
    if (updatedEntityMapping) {
      currentEntityMapping = updatedEntityMapping
      latestFixedEntityMapping = updatedEntityMapping
    }
    // 重新檢查看修了多少（使用可能已更新的 schema）
    const postFixIssues = await runAlignmentChecks({ ...input, features: currentFeatures, schemaSql: currentSchemaSql, entityMapping: currentEntityMapping })
    const postFixErrors = postFixIssues.filter(i => i.severity === 'error')
    const fixedThisRound = beforeCount - postFixErrors.length
    totalFixedCount += Math.max(0, fixedThisRound)

    // L17.P0.3：issue fingerprint 比對（擋 LLM 症狀修復騙過純數值比較）
    // 場景：LLM 把 `$Store.id` 改名為 `$storeId`（兩者皆未宣告）→
    //   before 1 個「`$Store.id` 未宣告」error，after 1 個「`$storeId` 未宣告」error → 純數值看不出差
    // 解法：fingerprint = feature|checkName|line|varName，比對實際解決 vs 新引入
    const beforeKeys = new Set(errorIssues.map(issueFingerprint))
    const afterKeys = new Set(postFixErrors.map(issueFingerprint))
    const resolvedKeys = [...beforeKeys].filter(k => !afterKeys.has(k))
    const newKeys = [...afterKeys].filter(k => !beforeKeys.has(k))

    // L31.D：post-fix 修法方向審計
    // 偵測 LLM 是否「修錯方向」— 例如 Check 12 報「imageUrl 缺值」，LLM 卻移除 Then $notnull 通過 gate
    // 演算法：對每個 feature 比對前後 Then expectations 的 notnull+literal 總數
    //   如果 LLM 解掉的 issue 是「補欄位」型，但 Then expectations 數量「大幅下降」→ 反向修復
    const directionAuditFailures: Array<{ feature: string; before: number; after: number; checkName: string }> = []
    const ALIGNMENT_DIRECTION_CHECKS = new Set([
      'notnull_field_missing_from_setup',
      'then_concrete_value_missing_from_setup',
      'null_expectation_setup_conflict',
      'scenario_scope_setup_mismatch',
      'entity_validation_field_missing_from_setup',
    ])
    for (let fi = 0; fi < currentFeatures.length; fi++) {
      const featureName = currentFeatures[fi].name || currentFeatures[fi].actionName
      const beforeFeature = beforeFeaturesSnapshot.find(f => (f.name || f.actionName) === featureName)
      if (!beforeFeature) continue
      // 該 feature 是否有解掉的 alignment direction issue？
      const resolvedDirectionIssues = errorIssues.filter(i =>
        (i.featureName === featureName) &&
        ALIGNMENT_DIRECTION_CHECKS.has(i.checkName) &&
        !postFixErrors.some(p => issueFingerprint(p) === issueFingerprint(i))
      )
      if (resolvedDirectionIssues.length === 0) continue

      // 比對前後 Then expectations「強驗證」（notnull/literal/null）總數
      const beforeExp = extractThenExpectations(beforeFeature.content).filter(e => e.expectedKind !== 'var')
      const afterExp = extractThenExpectations(currentFeatures[fi].content).filter(e => e.expectedKind !== 'var')

      // 如果強驗證總數降幅 > 30% 且該 feature 有解掉 direction issue → 高機率 LLM 砍驗證
      if (beforeExp.length > 0 && afterExp.length < beforeExp.length * 0.7) {
        directionAuditFailures.push({
          feature: featureName,
          before: beforeExp.length,
          after: afterExp.length,
          checkName: resolvedDirectionIssues[0].checkName,
        })
      }
    }
    if (directionAuditFailures.length > 0) {
      logger.warn({ failures: directionAuditFailures }, 'Alignment Gate: post-fix 方向審計失敗 — LLM 可能移除 Then 驗證而非補 entity_setup')
      recordTelemetry({
        skillName: 'feature_gate', eventType: 'alignment_blocked',
        patternKey: 'llm_fix_wrong_direction', outcome: 'blocked', phase: 'feature_alignment_gate',
        fixRounds: round + 1, severity: 'critical',
        userId: input.trackingContext?.userId, conversationId: input.trackingContext?.conversationId,
        payload: { failures: directionAuditFailures },
      }).catch(() => {})
      // 回退：保留 before 版本（不採用 LLM 改錯方向的版本）
      const blockMessage = `**Alignment Gate post-fix 方向審計失敗** — LLM 可能採取「移除 Then 驗證」修法而非「補 entity_setup 欄位」。\n\n${directionAuditFailures.map(f => `- ${f.feature}: Then 強驗證從 ${f.before} 降到 ${f.after}（>30% 降幅，疑似砍驗證）`).join('\n')}\n\n請手動檢查 BDD Feature，確認 entity_setup 已補上缺失欄位（不是把 Then 期望刪掉）。`
      return {
        passed: false,
        blocked: true,
        fixedFeatures: bestFeatures,  // 保留歷史最佳版本（不是這輪偏方向的）
        fixedSchemaSql: bestSchemaSql ?? latestFixedSchemaSql,
        fixedEntityMapping: bestEntityMapping ?? latestFixedEntityMapping,
        issues: postFixIssues,
        fixedIssueCount: totalFixedCount,
        remainingIssueCount: postFixErrors.length,
        blockMessage,
        durationMs: Date.now() - start,
      }
    }

    // 提前 block 條件：
    //   - 一個 before issue 都沒解（resolvedKeys 空）→ LLM 無實質修復
    //   - OR 新引入 issue 超過原來一半 → LLM 很可能改名/重組讓問題換殼
    if (postFixErrors.length > 0 && (resolvedKeys.length === 0 || newKeys.length > Math.max(1, beforeKeys.size / 2))) {
      logger.warn({
        beforeCount: beforeKeys.size,
        afterCount: afterKeys.size,
        resolvedCount: resolvedKeys.length,
        newCount: newKeys.length,
        sampleNewKeys: newKeys.slice(0, 3),
      }, 'Alignment Gate: LLM 未實質修復（或引入新問題）— 提前 block')
      recordTelemetry({
        skillName: 'feature_gate', eventType: 'alignment_blocked',
        patternKey: 'llm_fix_no_real_progress', outcome: 'blocked', phase: 'feature_alignment_gate',
        fixRounds: round + 1, severity: 'critical',
        userId: input.trackingContext?.userId, conversationId: input.trackingContext?.conversationId,
        payload: {
          beforeCount: beforeKeys.size, afterCount: afterKeys.size,
          resolvedCount: resolvedKeys.length, newCount: newKeys.length,
        },
      }).catch(() => {})
      const blockMessage = formatBlockMessage(postFixErrors)
      return {
        passed: false,
        blocked: true,
        fixedFeatures: totalFixedCount > 0 ? bestFeatures : undefined,
        fixedSchemaSql: bestSchemaSql ?? latestFixedSchemaSql,
        fixedEntityMapping: bestEntityMapping ?? latestFixedEntityMapping,
        issues: postFixIssues,
        fixedIssueCount: totalFixedCount,
        remainingIssueCount: postFixErrors.length,
        blockMessage,
        durationMs: Date.now() - start,
      }
    }

    if (fixedThisRound <= 0) {
      // 修了但沒效果 → 不再重試
      logger.warn({ beforeCount, afterCount: postFixErrors.length }, 'Alignment Gate: 修復無進展，停止重試')
      if (postFixErrors.length > 0) {
        const blockMessage = formatBlockMessage(postFixErrors)
        return {
          passed: false,
          blocked: true,
          fixedFeatures: totalFixedCount > 0 ? bestFeatures : undefined,
          fixedSchemaSql: bestSchemaSql ?? latestFixedSchemaSql,
          fixedEntityMapping: bestEntityMapping ?? latestFixedEntityMapping,
          issues: postFixIssues,
          fixedIssueCount: totalFixedCount,
          remainingIssueCount: postFixErrors.length,
          blockMessage,
          durationMs: Date.now() - start,
        }
      }
    }

    logger.info({ fixedThisRound, remainingErrors: postFixErrors.length }, `Alignment Gate: 第 ${round + 1} 輪修復完成`)
  }

  // 最終檢查
  const finalIssues = await runAlignmentChecks({ ...input, features: currentFeatures })
  const finalErrors = finalIssues.filter(i => i.severity === 'error')

  if (finalErrors.length === 0) {
    return {
      passed: true,
      blocked: false,
      fixedFeatures: totalFixedCount > 0 ? bestFeatures : undefined,
      issues: finalIssues,
      fixedIssueCount: totalFixedCount,
      remainingIssueCount: finalIssues.filter(i => i.severity === 'warning').length,
      durationMs: Date.now() - start,
    }
  }

  const blockMessage = formatBlockMessage(finalErrors)
  return {
    passed: false,
    blocked: true,
    fixedFeatures: totalFixedCount > 0 ? bestFeatures : undefined,
    issues: finalIssues,
    fixedIssueCount: totalFixedCount,
    remainingIssueCount: finalErrors.length,
    blockMessage,
    durationMs: Date.now() - start,
  }
}

function formatBlockMessage(errors: AlignmentIssue[]): string {
  // 優先顯示 semantic consistency 矛盾（最常導致 fix loop 卡死）
  const semanticErrors = errors.filter(e => e.checkName === 'semantic_consistency')
  const otherErrors = errors.filter(e => e.checkName !== 'semantic_consistency')

  const lines: string[] = []

  if (semanticErrors.length > 0) {
    lines.push('**Feature 內部語義矛盾**（Scenario 名稱與 DataTable 期望值互相矛盾 — LLM 無論修幾輪代碼都無法通過，必須先修正 Feature 規格）：\n')
    const groupedSemantic = new Map<string, AlignmentIssue[]>()
    for (const e of semanticErrors) {
      const arr = groupedSemantic.get(e.featureName) || []
      arr.push(e)
      groupedSemantic.set(e.featureName, arr)
    }
    for (const [featureName, featureErrors] of groupedSemantic) {
      lines.push(`**${featureName}**:`)
      for (const err of featureErrors) {
        lines.push(`  - ${err.description}`)
      }
      lines.push('')
    }
    // A/B/C 決策指引
    lines.push('**如何修正**（每個矛盾選一）：')
    lines.push('  **(A) 改 Scenario 名稱** — 若原本的業務行為是「保留原值」，改為更精確的名稱（例如「X 應保留原值」）')
    lines.push('  **(B) 改 DataTable 期望值為 `&isNull`** — 若業務行為確實是「設為 null」，把 DataTable 對應欄位改為 `&isNull`')
    lines.push('  **(C) 刪除此 Scenario** — 若此 scenario 其實不符合真實業務需求')
    lines.push('')
  }

  if (otherErrors.length > 0) {
    if (lines.length > 0) lines.push('---\n')
    lines.push('**其他對齊問題**:\n')
    const grouped = new Map<string, AlignmentIssue[]>()
    for (const e of otherErrors) {
      const arr = grouped.get(e.featureName) || []
      arr.push(e)
      grouped.set(e.featureName, arr)
    }
    for (const [featureName, featureErrors] of grouped) {
      lines.push(`**${featureName}**:`)
      for (const err of featureErrors) {
        lines.push(`  - [${err.checkName}] ${err.description}`)
      }
    }
  }

  if (lines.length === 0) {
    lines.push('Feature 對齊檢查發現無法自動修復的問題。')
  }

  lines.push('\n下一步：回到 BDD 階段修正上述 Feature 規格後重試；或直接在對話中告訴我要採用哪個選項（例如「選 A」、「改為 &isNull」、「刪除該 scenario」），我會幫你改。')
  return lines.join('\n')
}
