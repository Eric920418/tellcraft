// ============================================================
// Deterministic actionsYml + Feature 修補（0 LLM call）
//
// 修兩類 RED Phase 抓到的問題，這些原本被當 advisory warning 放過：
// 1. method_mismatch — Feature 註解 # [PUT/PATCH/DELETE] 但 actionsYml 缺 method:
//    → 直接 patch actionsYml，加 method: <Feature 註解的值>
// 2. path_mismatch — Feature 註解 path 與 actionsYml 推導不一致
//    → 直接 patch actionsYml，加 path: <Feature 註解的值>
// 3. var_in_call_table — WHEN call table headers 含 > 或 < 前綴
//    → 移除 BDD content 中該行的 >/< 前綴
//
// 修法依據：Feature 註解是 user-facing API 契約的真實意圖，
// actionsYml 是技術細節。發生衝突時 Feature 註解優先。
// ============================================================
import * as yaml from 'js-yaml'
import { createLogger } from '../lib/logger'

const logger = createLogger('deterministic-actions-fix')

export interface ActionsFixResult {
  fixedActionsYml: string | null  // null 代表無變動
  fixedFeatures: Map<string, string>  // featureName → fixed content（無變動的不放）
  changes: Array<{
    type: 'method_set' | 'path_set' | 'var_in_call_table_removed' | 'empty_table_literal_removed' | 'unique_constraint_deduped' | 'null_intent_scenario_conflict_fixed'
    target: string  // action name 或 feature name
    detail: string
  }>
}

interface FeatureAnnotations {
  actionName: string | null
  method: string | null
  path: string | null
}

function extractAnnotations(content: string): FeatureAnnotations {
  const actionMatch = content.match(/^#\s*Action:\s*(\S+)/m)
  const methodPathMatch = content.match(/^#\s*\[(\w+)\]\s*(\/\S+)/m)
  return {
    actionName: actionMatch?.[1] || null,
    method: methodPathMatch?.[1]?.toUpperCase() || null,
    path: methodPathMatch?.[2] || null,
  }
}

/**
 * 修 actionsYml：把 Feature 註解的 method/path 寫進對應 action 的 method:/path: 欄位
 *
 * 規則（authoritative — Feature 註解是 user ground truth）：
 * - Feature 註解有 method 且為 GET/POST/PUT/PATCH/DELETE 之一 → **強制覆寫** action.method
 * - Feature 註解有 path 且不為空 → **強制覆寫** action.path
 * - 既有值與 Feature 註解一致 → 不動
 *
 * 為何 authoritative：之前是 conservative（只填 missing）導致 LLM 寫錯 method/path
 * 時不會被修正（method_mismatch / path_mismatch 雪崩來源 — bb0d1081 案例）。
 *
 * 失敗（YAML parse 失敗 / 沒有 actions 區段）→ return null
 */
export function autoFixActionsMethodPathFromFeatures(
  actionsYml: string,
  features: Array<{ name?: string; actionName: string; content: string }>,
): { fixed: string | null; changes: ActionsFixResult['changes'] } {
  const changes: ActionsFixResult['changes'] = []
  type ParsedActions = { actions?: Array<Record<string, unknown>> }
  let parsed: ParsedActions
  try {
    parsed = (yaml.load(actionsYml) as ParsedActions) ?? {}
  } catch (e) {
    logger.warn({ err: e }, 'actionsYml YAML parse 失敗，跳過')
    return { fixed: null, changes }
  }
  if (!parsed.actions || !Array.isArray(parsed.actions)) return { fixed: null, changes }
  const actions = parsed.actions

  // 建 action name → index 映射
  const actionIdxByName = new Map<string, number>()
  actions.forEach((a: Record<string, unknown>, i: number) => {
    if (typeof a.name === 'string') actionIdxByName.set(a.name, i)
  })

  const validMethods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
  let anyChange = false

  for (const feature of features) {
    const anno = extractAnnotations(feature.content)
    if (!anno.actionName) continue
    const idx = actionIdxByName.get(anno.actionName)
    if (idx === undefined) continue
    const action = actions[idx]

    if (anno.method && validMethods.has(anno.method)) {
      const currentMethod = typeof action.method === 'string' ? action.method.toUpperCase() : undefined
      if (currentMethod !== anno.method) {
        action.method = anno.method
        anyChange = true
        changes.push({
          type: 'method_set',
          target: anno.actionName,
          detail: currentMethod
            ? `method: ${currentMethod} → ${anno.method}（authoritative override）`
            : `method: ${anno.method}（注入）`,
        })
      }
    }

    if (anno.path && anno.path.startsWith('/')) {
      const currentPath = typeof action.path === 'string' ? action.path : undefined
      if (currentPath !== anno.path) {
        action.path = anno.path
        anyChange = true
        changes.push({
          type: 'path_set',
          target: anno.actionName,
          detail: currentPath
            ? `path: ${currentPath} → ${anno.path}（authoritative override）`
            : `path: ${anno.path}（注入）`,
        })
      }
    }
  }

  if (!anyChange) return { fixed: null, changes }

  const dumped = yaml.dump(parsed, { lineWidth: 120, noRefs: true })
  return { fixed: dumped, changes }
}

/**
 * 修 Feature content：移除 WHEN call table headers 中的 >/< VAR 前綴
 *
 * 規則：
 * - 找 `... call table:` 後的下一個 DataTable header row（| ... |）
 * - 若 header cell 以 `>` 或 `<` 開頭 → 移除前綴（不動 row data）
 *
 * 限制：只動 header row，不動 entity_setup / response_validate 的 table。
 */
export function autoFixVarInCallTable(
  content: string,
): { fixed: string | null; removedCount: number } {
  const lines = content.split('\n')
  let removedCount = 0
  let nextNonEmptyIsHeader = false

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    // 偵測 call table 起始
    if (/call\s+table\s*:/i.test(trimmed) && /When\s+|And\s+/i.test(lines[i])) {
      nextNonEmptyIsHeader = true
      continue
    }
    if (!nextNonEmptyIsHeader) continue
    if (trimmed === '') continue
    // header row 必須是 | xxx | xxx |
    if (!trimmed.startsWith('|')) {
      nextNonEmptyIsHeader = false
      continue
    }
    // 拆解 cells（前後可能有空白）
    const original = lines[i]
    const cells = original.split('|')
    let cellChanged = false
    for (let c = 0; c < cells.length; c++) {
      const raw = cells[c]
      const stripped = raw.replace(/^(\s*)([><])/, (_m, ws) => ws)
      if (stripped !== raw) {
        cells[c] = stripped
        cellChanged = true
        removedCount++
      }
    }
    if (cellChanged) {
      lines[i] = cells.join('|')
    }
    nextNonEmptyIsHeader = false
  }

  if (removedCount === 0) return { fixed: null, removedCount: 0 }
  return { fixed: lines.join('\n'), removedCount }
}

/**
 * 修 Feature content：偵測 `with table:\n  []` 失敗 pattern
 *
 * LLM 用 `[]` literal 表達空陣列回應，但 Gherkin DataTable 語法要求至少一個 header row
 * （`| col |`），DocString 必須 `"""..."""`，`[]` 直接 parser 噴 got '[]'。
 *
 * 修法：移除整個 `, with table:` 子句 + `[]` 那行
 * 修後 step 變成 `Then X(200)回應`（只驗 status，不驗 body）— 比原意更寬鬆但語法合法
 *
 * 注：用 SpecFormula 角度，「只驗 status 200」對「應回空陣列」的測試覆蓋下降，但
 * Gherkin 本來就難以精確表達「body 必須是空陣列」，這個取捨可接受。
 */
export function autoFixEmptyTableLiteral(
  content: string,
): { fixed: string | null; removedCount: number } {
  const lines = content.split('\n')
  let removedCount = 0
  const result: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // 偵測「step 行含 with table:」+「下一個非空行只有 []」
    if (/^\s*(?:Then|And|When|Given)\s+.+,\s*with\s+table\s*:\s*$/i.test(line)) {
      let j = i + 1
      while (j < lines.length && lines[j].trim() === '') j++
      if (j < lines.length && lines[j].trim() === '[]') {
        // 移除 step 行的 `, with table:` 子句
        result.push(line.replace(/,\s*with\s+table\s*:\s*$/i, ''))
        // 跳過至（含）`[]` 行
        i = j
        removedCount++
        continue
      }
    }
    result.push(line)
  }

  if (removedCount === 0) return { fixed: null, removedCount: 0 }
  return { fixed: result.join('\n'), removedCount }
}

/**
 * 整合：對一組 features + actionsYml 跑全部 deterministic 修補
 *
 * 多 helper 串接：同一個 feature 可能同時觸發 var_in_call_table 與 empty_table_literal
 * 修補，串接時要保留前一個 helper 的修補結果。
 */
export function autoFixActionsAndFeatures(
  actionsYml: string,
  features: Array<{ name?: string; actionName: string; content: string }>,
  schemaSql?: string,
  entityMappingYaml?: string,
): ActionsFixResult {
  const allChanges: ActionsFixResult['changes'] = []
  const fixedFeatures = new Map<string, string>()

  // 1. actionsYml method/path patch
  const actionsResult = autoFixActionsMethodPathFromFeatures(actionsYml, features)
  allChanges.push(...actionsResult.changes)

  // 2. Feature content: 串接修補（var_in_call_table → empty_table_literal）
  for (const f of features) {
    let currentContent = f.content
    let anyFix = false

    const r1 = autoFixVarInCallTable(currentContent)
    if (r1.fixed !== null) {
      currentContent = r1.fixed
      anyFix = true
      allChanges.push({
        type: 'var_in_call_table_removed',
        target: f.name || f.actionName,
        detail: `removed ${r1.removedCount} VAR prefix(es) in call table headers`,
      })
    }

    const r2 = autoFixEmptyTableLiteral(currentContent)
    if (r2.fixed !== null) {
      currentContent = r2.fixed
      anyFix = true
      allChanges.push({
        type: 'empty_table_literal_removed',
        target: f.name || f.actionName,
        detail: `removed ${r2.removedCount} broken \`with table: []\` clause(s)`,
      })
    }

    if (anyFix) {
      fixedFeatures.set(f.name || f.actionName, currentContent)
    }
  }

  // 3. Tier B2: Unique constraint dedup（同 entity 同 unique column 重複值加 suffix）
  // 跨 features 整體跑（每 feature 內部按 scope dedup）。需要 schemaSql 才能判斷 UNIQUE columns。
  if (schemaSql) {
    // 把上一輪可能修過的 content 帶進去（保留 var/empty-table 修補結果）
    const featuresForDedup = features.map(f => ({
      ...f,
      content: fixedFeatures.get(f.name || f.actionName) ?? f.content,
    }))
    // lazy require 避免循環依賴
    const { dedupUniqueColumnValuesInFeatures } = require('./unique-constraint-dedup') as typeof import('./unique-constraint-dedup')
    const dedupResult = dedupUniqueColumnValuesInFeatures(featuresForDedup, schemaSql, entityMappingYaml)
    if (dedupResult.changes.length > 0) {
      // 用 group by featureName 整合 changes（一個 feature 可能多 row 改）
      const byFeature = new Map<string, number>()
      for (const c of dedupResult.changes) {
        byFeature.set(c.featureName, (byFeature.get(c.featureName) ?? 0) + 1)
      }
      for (const [featureName, count] of byFeature) {
        allChanges.push({
          type: 'unique_constraint_deduped',
          target: featureName,
          detail: `auto-suffixed ${count} unique column value(s) to avoid duplicate key violation`,
        })
      }
      // 寫回 fixedFeatures map
      for (const [name, content] of dedupResult.fixedFeatures) {
        fixedFeatures.set(name, content)
      }
    }
  }

  // 4. autoFixNullIntentScenarioConflict（2026-05-18 b2252efc 治本）
  // 偵測「scenario name 暗示 null 但 DataTable expected 給具體值」→ 改 &isNull
  // entity_validate + response_validate 兩種 DataTable 都處理
  // lazy require 避免循環依賴
  {
    const { autoFixNullIntentScenarioConflict } = require('./deterministic-feature-fix') as typeof import('./deterministic-feature-fix')
    for (const f of features) {
      const key = f.name || f.actionName
      const currentContent = fixedFeatures.get(key) ?? f.content
      const result = autoFixNullIntentScenarioConflict(currentContent)
      if (result.fixed.length > 0) {
        fixedFeatures.set(key, result.content)
        // group by scenario+entity 統計
        const byTarget = new Map<string, number>()
        for (const fix of result.fixed) {
          const k = `${fix.validateType}:${fix.scenario}/${fix.entity}.${fix.field}`
          byTarget.set(k, (byTarget.get(k) ?? 0) + 1)
        }
        for (const [target, count] of byTarget) {
          allChanges.push({
            type: 'null_intent_scenario_conflict_fixed',
            target: key,
            detail: `forced \`&isNull\` for ${target}${count > 1 ? ` (×${count})` : ''}`,
          })
        }
      }
    }
  }

  return {
    fixedActionsYml: actionsResult.fixed,
    fixedFeatures,
    changes: allChanges,
  }
}
