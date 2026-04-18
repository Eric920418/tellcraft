/**
 * Feature Dry-Run — BDD 完成後、Coder 之前的規格驗證
 *
 * 用真實的 SpecFormula 引擎 + 真實的 Neon DB 執行 Feature 的 entity_setup 步驟，
 * 驗證 Feature 的 entity/column/VAR 格式是否正確。
 *
 * 跳過 api_call / response_validate（Coder 還沒生成後端）。
 */

import { Pool } from 'pg'
import {
  parseFeatureFile,
  parseSchemasFromString,
  fixDataTableBySchema,
  fillMissingNotNullColumns,
  ensureFkReferencesExist,
  resolveEntityIdHeaders,
  fixNonUuidValues,
  resolveNonSchemaColumns,
  autoHashPasswords,
  type ParsedFeature,
  type ParsedStep,
} from './specformula-runner'
import { ScenarioContext } from '../lib/specformula/context/scenario-context'
import { ISAFeatureArgumentResolver } from '../lib/specformula/helper/isa-feature-argument-resolver'
import { EntitySetup } from '../lib/specformula/instruction/entity-setup'
import { EntityValidate } from '../lib/specformula/instruction/entity-validate'
import { EntityNonExistenceValidate } from '../lib/specformula/instruction/entity-non-existence-validate'
import { TimeControl } from '../lib/specformula/instruction/time-control'
import type { DatabaseSchema } from '../lib/specformula/spec/data/models'
import { createLogger } from '../lib/logger'

const logger = createLogger('feature-dry-run')

// ============================================================
// 型別定義
// ============================================================

export interface DryRunInput {
  features: Array<{ name: string; actionName: string; content: string }>
  schemaSql: string
  entityMapping: string
  neonConnectionString: string
}

export interface DryRunResult {
  passed: boolean
  failedFeatures: Array<{ name: string; errors: string[] }>
  summary: string
  totalSteps: number
  passedSteps: number
  failedSteps: number
  skippedSteps: number
  durationMs: number
}

// ============================================================
// 步驟分類
// ============================================================

const ENTITY_SETUP_PATTERN = /準備一個([\u4e00-\u9fffa-zA-Z0-9_]+),?\s*with table:/
const ENTITY_VALIDATE_PATTERN = /應該存在一個([\u4e00-\u9fffa-zA-Z0-9_]+),?\s*with table:/
const ENTITY_NON_EXISTENCE_PATTERN = /應該不存在一個([\u4e00-\u9fffa-zA-Z0-9_]+),?\s*with table:/
const TIME_CONTROL_PATTERN = /現在(?:的)?時間(?:為|是)\s*"([^"]+)"/
const API_CALL_PATTERN = /\((?:No Actor|UID="[^"]+")\)\s+.+,\s*call table:/
const RESPONSE_VALIDATE_PATTERN = /.+\(\d{3}\)回應/
const OPERATION_FAILURE_PATTERN = /^操作失敗$/

type StepType = 'entity_setup' | 'entity_validate' | 'entity_non_existence' | 'time_control' | 'api_call' | 'response_validate' | 'operation_failure' | 'unknown'

function classifyStep(text: string): StepType {
  if (ENTITY_SETUP_PATTERN.test(text)) return 'entity_setup'
  if (ENTITY_VALIDATE_PATTERN.test(text)) return 'entity_validate'
  if (ENTITY_NON_EXISTENCE_PATTERN.test(text)) return 'entity_non_existence'
  if (TIME_CONTROL_PATTERN.test(text)) return 'time_control'
  if (API_CALL_PATTERN.test(text)) return 'api_call'
  if (RESPONSE_VALIDATE_PATTERN.test(text)) return 'response_validate'
  if (OPERATION_FAILURE_PATTERN.test(text)) return 'operation_failure'
  return 'unknown'
}

// 是否在 api_call 之前的步驟（dry-run 只執行這些）
const RUNNABLE_TYPES = new Set<StepType>(['entity_setup', 'entity_validate', 'entity_non_existence', 'time_control'])

// ============================================================
// 核心 Dry-Run
// ============================================================

export async function runFeatureDryRun(input: DryRunInput): Promise<DryRunResult> {
  const startTime = Date.now()
  const pool = new Pool({ connectionString: input.neonConnectionString, max: 3 })
  const failedFeatures = new Map<string, string[]>()
  let totalSteps = 0
  let passedSteps = 0
  let failedSteps = 0
  let skippedSteps = 0

  try {
    // 1. 解析 schema
    const schemas = await parseSchemasFromString(input.schemaSql, input.entityMapping)

    // 2. 逐 Feature 驗證
    for (const feature of input.features) {
      let parsed: ParsedFeature
      try {
        parsed = await parseFeatureFile(feature.content)
      } catch (err) {
        const errMsg = `Feature 解析失敗: ${err instanceof Error ? err.message : String(err)}`
        failedFeatures.set(feature.name, [errMsg])
        failedSteps++
        totalSteps++
        continue
      }

      // 收集所有 scenario（含 rule 下的和直接在 feature 下的）
      const allScenarios: Array<{ name: string; steps: ParsedStep[] }> = []
      for (const rule of parsed.rules) {
        for (const scenario of rule.scenarios) {
          allScenarios.push({ name: scenario.name, steps: scenario.steps })
        }
      }
      for (const scenario of parsed.scenarios) {
        allScenarios.push({ name: scenario.name, steps: scenario.steps })
      }

      // 只跑第一個 scenario 的 Background + Given 步驟即可驗證格式
      // 不需要跑所有 scenario，因為 entity/column 格式在 Background 共用
      const firstScenario = allScenarios[0]
      if (!firstScenario) continue

      const stepsToRun = [
        ...(parsed.background || []),
        ...getStepsBeforeApiCall(firstScenario.steps),
      ]

      if (stepsToRun.length === 0) continue

      // Cleanup tables
      try {
        for (const schema of schemas) {
          const sqls = schema.buildCleanupSql()
          for (const sql of sqls) {
            await pool.query(sql).catch(() => {}) // ignore cleanup errors
          }
        }
      } catch {
        // non-fatal
      }

      // 建立 SpecFormula context
      const scenarioContext = new ScenarioContext()
      const resolver = new ISAFeatureArgumentResolver(() => scenarioContext)
      const entitySetup = new EntitySetup(resolver, schemas, () => pool)
      const entityValidate = new EntityValidate(resolver, schemas, () => pool)
      const entityNonExistence = new EntityNonExistenceValidate(resolver, schemas, () => pool)
      const timeControl = new TimeControl(resolver)

      const featureErrors: string[] = []

      // L4 級聯失敗抑制：當 entity_setup 失敗時，該步宣告的 >contextKey 變成「未就緒」。
      // 後續步驟若在 DataTable 中引用這些 $key，直接 skip 不跑 SQL —— 避免
      // FK 衍生錯誤膨脹失敗數。每個 feature 獨立維護一份（跨 feature reset）。
      const unresolvedContextKeys = new Set<string>()

      for (const step of stepsToRun) {
        totalSteps++
        const stepType = classifyStep(step.text)

        if (!RUNNABLE_TYPES.has(stepType)) {
          skippedSteps++
          continue
        }

        // L4 級聯檢查：若本步驟引用任一未就緒的 contextKey → skip（不算 failed）
        const blockedBy = stepReferencesUnresolvedKey(step, unresolvedContextKeys)
        if (blockedBy) {
          skippedSteps++
          logger.info({
            feature: feature.name,
            step: step.text.substring(0, 80),
            blockedBy: `$${blockedBy}`,
          }, 'Dry-run step skipped (父步驟失敗級聯)')
          continue
        }

        try {
          switch (stepType) {
            case 'entity_setup': {
              const entityMatch = step.text.match(ENTITY_SETUP_PATTERN)
              if (!entityMatch || !step.dataTable) {
                throw new Error('entity_setup 格式不正確或缺少 DataTable')
              }
              const entityName = entityMatch[1]

              // 應用完整修正鏈（對齊 specformula-runner executeStep entity_setup）
              let dt = step.dataTable
              dt = fixDataTableBySchema(dt, entityName, schemas)
              dt = resolveEntityIdHeaders(dt, entityName, schemas)
              dt = fillMissingNotNullColumns(dt, entityName, schemas)
              dt = fixNonUuidValues(dt, entityName, schemas)
              dt = await resolveNonSchemaColumns(dt, entityName, schemas, pool)
              await autoHashPasswords(dt)
              await ensureFkReferencesExist(dt, entityName, schemas, pool)

              await entitySetup.setup(entityName, dt.headers, dt.rows)
              passedSteps++
              break
            }

            case 'entity_validate': {
              const entityMatch = step.text.match(ENTITY_VALIDATE_PATTERN)
              if (!entityMatch || !step.dataTable) {
                throw new Error('entity_validate 格式不正確或缺少 DataTable')
              }
              await entityValidate.assertExists(entityMatch[1], step.dataTable.headers, step.dataTable.rows)
              passedSteps++
              break
            }

            case 'entity_non_existence': {
              const entityMatch = step.text.match(ENTITY_NON_EXISTENCE_PATTERN)
              if (!entityMatch || !step.dataTable) {
                throw new Error('entity_non_existence 格式不正確或缺少 DataTable')
              }
              await entityNonExistence.assertNotExists(entityMatch[1], step.dataTable.rows)
              passedSteps++
              break
            }

            case 'time_control': {
              const timeMatch = step.text.match(TIME_CONTROL_PATTERN)
              if (timeMatch) {
                timeControl.setTime(timeMatch[1])
              }
              passedSteps++
              break
            }
          }
        } catch (err) {
          failedSteps++
          const errMsg = `[${stepType}] ${err instanceof Error ? err.message : String(err)}`
          featureErrors.push(errMsg)
          logger.warn({ feature: feature.name, step: step.text.substring(0, 80), error: errMsg }, 'Dry-run step 失敗')

          // L4 級聯失敗記錄：entity_setup 失敗時，該步試圖宣告的 contextKey 全部變成未就緒。
          // 後續 DataTable 引用這些 key 的步驟會在上方的 stepReferencesUnresolvedKey 被 skip。
          if (stepType === 'entity_setup' && step.dataTable) {
            for (const header of step.dataTable.headers) {
              const trimmed = (header || '').trim()
              if (trimmed.startsWith('>')) {
                const contextKey = trimmed.substring(1).trim()
                if (contextKey) unresolvedContextKeys.add(contextKey)
              }
            }
          }
        }
      }

      if (featureErrors.length > 0) {
        failedFeatures.set(feature.name, featureErrors)
      }
    }
  } finally {
    await pool.end().catch(() => {})
  }

  const durationMs = Date.now() - startTime
  const passed = failedFeatures.size === 0

  const summary = passed
    ? `Dry-run 通過：${passedSteps} 步驟成功（${durationMs}ms）`
    : `Dry-run 失敗：${failedFeatures.size} 個 Feature 有問題，${failedSteps} 步驟失敗（${durationMs}ms）`

  logger.info({ passed, totalSteps, passedSteps, failedSteps, skippedSteps, durationMs }, summary)

  return {
    passed,
    failedFeatures: [...failedFeatures.entries()].map(([name, errors]) => ({ name, errors })),
    summary,
    totalSteps,
    passedSteps,
    failedSteps,
    skippedSteps,
    durationMs,
  }
}

// ============================================================
// 輔助函數
// ============================================================

/**
 * L4 輔助：判斷 step 的 DataTable 是否引用任一未就緒的 contextKey。
 * 掃所有 header + cell 的 `$VariableName`，與 unresolved set 做多種格式匹配：
 * - 精確（`$Merchant1.id` ↔ `Merchant1.id`）
 * - normalize（去 . _ - 後 case-insensitive）
 * - entityField 組合（`Merchant1.id` 被 `$merchant1Id` 引用）
 * 回傳第一個命中的 unresolved key；無命中則 null。
 */
export function stepReferencesUnresolvedKey(step: ParsedStep, unresolved: Set<string>): string | null {
  if (unresolved.size === 0 || !step.dataTable) return null

  const cells: string[] = []
  for (const h of step.dataTable.headers) {
    if (typeof h === 'string') cells.push(h)
  }
  for (const row of step.dataTable.rows) {
    for (const v of Object.values(row)) {
      if (typeof v === 'string') cells.push(v)
    }
  }

  const normalize = (s: string) => s.toLowerCase().replace(/[._\-]/g, '')
  // 預計算 unresolved 的 normalize 和 entityField 組合形式
  const unresolvedVariants = new Map<string, string>()  // variant → original key
  for (const key of unresolved) {
    unresolvedVariants.set(key, key)
    unresolvedVariants.set(normalize(key), key)
    if (key.includes('.')) {
      const [entity, field] = key.split('.')
      const combined = entity.charAt(0).toLowerCase() + entity.slice(1) + field.charAt(0).toUpperCase() + field.slice(1)
      unresolvedVariants.set(combined, key)
      unresolvedVariants.set(normalize(combined), key)
    }
  }

  for (const cell of cells) {
    // 找所有 $VariableName 引用（$letter 開頭；$數字 開頭是 bcrypt hash）
    const refs = cell.matchAll(/\$([a-zA-Z][\w.]*)/g)
    for (const m of refs) {
      const varName = m[1]
      if (unresolvedVariants.has(varName)) return unresolvedVariants.get(varName)!
      const varNorm = normalize(varName)
      if (unresolvedVariants.has(varNorm)) return unresolvedVariants.get(varNorm)!
    }
  }

  return null
}

/** 取得 api_call 之前的所有步驟 */
function getStepsBeforeApiCall(steps: ParsedStep[]): ParsedStep[] {
  const result: ParsedStep[] = []
  for (const step of steps) {
    const type = classifyStep(step.text)
    if (type === 'api_call' || type === 'response_validate' || type === 'operation_failure') {
      break // api_call 之後的步驟全部跳過
    }
    result.push(step)
  }
  return result
}
