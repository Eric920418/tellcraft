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
import { extractEntitySetupSteps } from './red-phase-validator'
import { DatabaseSchema } from '../lib/specformula/spec/data/models'
import { createLogger } from '../lib/logger'

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
function extractWhenSummaries(content: string): string[] {
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

async function runAlignmentChecks(input: AlignmentGateInput): Promise<AlignmentIssue[]> {
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
      // 注意：跨 Feature 的 VAR 引用無法在此檢查（需要整體上下文），只檢查同一 Feature 內
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
  }

  return issues
}

// ============================================================
// 自動修復
// ============================================================

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

  // 構建 FeatureFixInput
  const featuresToFix: FeatureFixInput[] = []
  for (const feature of features) {
    const displayName = feature.name || feature.actionName
    const featureIssues = issuesByFeature.get(displayName)
    if (!featureIssues || featureIssues.length === 0) continue

    // 只修 error 級 issues
    const errorIssues = featureIssues.filter(i => i.severity === 'error')
    if (errorIssues.length === 0) continue

    featuresToFix.push({
      name: feature.name || feature.actionName,
      actionName: feature.actionName,
      content: feature.content,
      issues: errorIssues.map(i => `[${i.checkName}] ${i.description}`),
    })
  }

  if (featuresToFix.length === 0) {
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
  const fixedMap = new Map<string, GeneratedFeature>()
  for (const ff of result.fixedFeatures) {
    fixedMap.set(ff.actionName, ff)
  }

  const merged = features.map(f => {
    const fixed = fixedMap.get(f.actionName)
    if (fixed) {
      // 後置 sanitize
      const { content: sanitized } = sanitizeFeatureContent(fixed.content)
      return { ...f, content: sanitized }
    }
    return f
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
  const grouped = new Map<string, AlignmentIssue[]>()
  for (const e of errors) {
    const arr = grouped.get(e.featureName) || []
    arr.push(e)
    grouped.set(e.featureName, arr)
  }

  const lines: string[] = ['Feature 對齊檢查發現以下問題無法自動修復：\n']
  for (const [featureName, featureErrors] of grouped) {
    lines.push(`**${featureName}**:`)
    for (const err of featureErrors) {
      lines.push(`  - [${err.checkName}] ${err.description}`)
    }
  }
  lines.push('\n建議回到 BDD 階段修正 Feature 規格後重試。')
  return lines.join('\n')
}
