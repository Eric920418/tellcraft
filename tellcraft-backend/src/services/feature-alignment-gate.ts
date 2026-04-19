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
import { fixMultipleFeatures, sanitizeFeatureContent, type FeatureFixInput, type GeneratedFeature } from './formulation'
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
    default: return 'unknown'
  }
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

  // 檢查 substring collision（同一 action 內的 summary 不能互為 substring）
  const summariesByAction = new Map<string, Array<{ summary: string; featureName: string }>>()
  for (const s of allSummaries) {
    const arr = summariesByAction.get(s.actionName) || []
    arr.push({ summary: s.summary, featureName: s.featureName })
    summariesByAction.set(s.actionName, arr)
  }

  // 跨 action 的 summary 也需要唯一（因為 composeActionFunction 合併多個 action 時）
  for (let i = 0; i < allSummaries.length; i++) {
    for (let j = i + 1; j < allSummaries.length; j++) {
      const a = allSummaries[i]
      const b = allSummaries[j]
      if (a.summary === b.summary) continue // 完全相同不算碰撞（同一 action 的重複 When 步驟）
      if (a.summary.includes(b.summary) || b.summary.includes(a.summary)) {
        // 兩邊都報 issue，確保兩個 Feature 都被送去修復
        issues.push({
          featureName: a.featureName,
          checkName: 'summary_uniqueness',
          severity: 'error',
          description: `Summary "${a.summary}" 與 "${b.summary}" (${b.featureName}) 互為子字串 → dispatch 碰撞。必須讓兩者的 When summary 互不包含`,
        })
        if (a.featureName !== b.featureName) {
          issues.push({
            featureName: b.featureName,
            checkName: 'summary_uniqueness',
            severity: 'error',
            description: `Summary "${b.summary}" 與 "${a.summary}" (${a.featureName}) 互為子字串 → dispatch 碰撞。必須讓兩者的 When summary 互不包含`,
          })
        }
      }
    }
  }

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

  return issues
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
      const parts = [`[${i.checkName}] ${i.description}`]
      if (enriched.harnessHint) {
        const hintShort = enriched.harnessHint.split('\n').slice(0, 2).join(' ')
        parts.push(`  → Harness: ${hintShort}`)
      }
      if (schemaHint) {
        parts.push(`  → ${schemaHint}`)
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

  return {
    fixedFeatures: merged,
    fixApplied: true,
    updatedSchemaSql: result.updatedSchemaSql,
    updatedEntityMapping: result.updatedEntityMapping,
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

  for (let round = 0; round < MAX_FIX_ROUNDS; round++) {
    // 執行檢查（使用可能已更新的 schema）
    const issues = await runAlignmentChecks({ ...input, features: currentFeatures, schemaSql: currentSchemaSql, entityMapping: currentEntityMapping })
    const errorIssues = issues.filter(i => i.severity === 'error')

    logger.info({
      round: round + 1,
      totalIssues: issues.length,
      errors: errorIssues.length,
      warnings: issues.length - errorIssues.length,
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
        fixedFeatures: totalFixedCount > 0 ? currentFeatures : undefined,
        fixedSchemaSql: latestFixedSchemaSql,
        fixedEntityMapping: latestFixedEntityMapping,
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
        fixedFeatures: totalFixedCount > 0 ? currentFeatures : undefined,
        fixedSchemaSql: latestFixedSchemaSql,
        fixedEntityMapping: latestFixedEntityMapping,
        issues,
        fixedIssueCount: totalFixedCount,
        remainingIssueCount: errorIssues.length,
        blockMessage,
        durationMs: Date.now() - start,
      }
    }

    // 嘗試自動修復
    const beforeCount = errorIssues.length
    const { fixedFeatures, fixApplied, updatedSchemaSql, updatedEntityMapping } = await autoFixFeatures(
      currentFeatures,
      issues,
      currentSchemaSql,
      currentEntityMapping,
      input.trackingContext,
    )

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
        fixedFeatures: totalFixedCount > 0 ? currentFeatures : undefined,
        issues,
        fixedIssueCount: totalFixedCount,
        remainingIssueCount: errorIssues.length,
        blockMessage,
        durationMs: Date.now() - start,
      }
    }

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
        fixedFeatures: totalFixedCount > 0 ? currentFeatures : undefined,
        fixedSchemaSql: latestFixedSchemaSql,
        fixedEntityMapping: latestFixedEntityMapping,
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
          fixedFeatures: totalFixedCount > 0 ? currentFeatures : undefined,
          fixedSchemaSql: latestFixedSchemaSql,
          fixedEntityMapping: latestFixedEntityMapping,
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
      fixedFeatures: totalFixedCount > 0 ? currentFeatures : undefined,
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
    fixedFeatures: totalFixedCount > 0 ? currentFeatures : undefined,
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
