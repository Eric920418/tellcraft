// ============================================================
// L17.P2 — Deterministic Feature 補宣告
// 核心：對「完全未宣告的 $X.field」直接產出合法的 Background DataTable 宣告，
// 不靠 LLM。FK 拓撲排序處理依賴鏈；CHECK 約束值從 enum 取第一個。
// 失敗（循環 FK / entity 不在 schema）→ 跳過該 entity 並記 reason，由 LLM fallback。
// ============================================================

import { DatabaseSchema, TableDefinition, type ColumnDefinition } from '../lib/specformula/spec/data/models'
import { parseCheckConstraintSpec } from './feature-alignment-gate'
import { createLogger } from '../lib/logger'

const logger = createLogger('deterministic-feature-fix')

// ============================================================
// Background 邊界偵測
// ============================================================

export interface BackgroundBounds {
  startLine: number  // 1-based, `Background:` 行
  endLine: number    // 1-based，Background 區塊最後一行（含），通常是最後一個 DataTable row
  indent: string     // Background 關鍵字的縮排（用於新 step 對齊）
}

export function extractBackgroundBounds(content: string): BackgroundBounds | null {
  const lines = content.split('\n')
  let startLine = -1
  let indent = ''
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\s*)Background:\s*$/)
    if (m) {
      startLine = i
      indent = m[1]
      break
    }
  }
  if (startLine < 0) return null

  // endLine = 最後一個屬於 Background 的行（下一個 Rule/Scenario/Example 之前）
  let endLine = startLine
  for (let i = startLine + 1; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (/^(Rule|Scenario|Example|Feature):/.test(trimmed)) break
    if (trimmed !== '') endLine = i
  }
  return { startLine: startLine + 1, endLine: endLine + 1, indent }
}

// ============================================================
// FK 圖 + 拓撲排序
// ============================================================

/**
 * 從 schemas 中為「相關 entity」建 FK adjacency：entity → { dependsOn: Set<entity> }
 * 只考慮 relevantEntities 範圍內的 FK（以及其傳遞依賴）。
 */
export function buildForeignKeyGraph(
  schemas: DatabaseSchema[],
  relevantEntities: string[],
): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>()
  // table name → entity name（反查）
  const tableToEntity = new Map<string, string>()
  for (const schema of schemas) {
    const byEntity = schema.getTablesByEntityName()
    for (const [entity, table] of byEntity) {
      tableToEntity.set(table.tableName.toLowerCase(), entity)
    }
  }

  const queue = [...relevantEntities]
  const seen = new Set<string>()
  while (queue.length > 0) {
    const entity = queue.shift()!
    if (seen.has(entity)) continue
    seen.add(entity)
    if (!graph.has(entity)) graph.set(entity, new Set())

    const found = DatabaseSchema.findSchemaAndTable(schemas, entity)
    if (!found) continue
    for (const col of found.table.columns) {
      if (!col.foreignKey) continue
      // foreignKey 格式 "table.column"
      const refTable = col.foreignKey.split('.')[0]?.toLowerCase()
      if (!refTable) continue
      const refEntity = tableToEntity.get(refTable)
      if (!refEntity || refEntity === entity) continue  // self-FK 忽略（table 需要 pre-exist 才能 insert）
      graph.get(entity)!.add(refEntity)
      // 傳遞依賴：也要 FK 的 FK
      if (!seen.has(refEntity)) queue.push(refEntity)
    }
  }
  return graph
}

/**
 * Kahn 拓撲排序 + 環偵測。
 * 回傳 `order`：沒環的 entity（依賴在前）；`cycles`：參與環的 entity 分群。
 */
export function topologicalSort(graph: Map<string, Set<string>>): { order: string[]; cycles: string[][] } {
  // 反向：dependent → dependencies. Kahn 需 indegree：被多少人依賴
  const indegree = new Map<string, number>()
  for (const node of graph.keys()) indegree.set(node, 0)
  for (const deps of graph.values()) {
    for (const d of deps) {
      indegree.set(d, (indegree.get(d) || 0) + 1)
    }
  }

  // 起點 = 沒人依賴的節點（葉子，實際是拓撲順序最後的）
  // 但我們要 dependency-first 順序 → 先從「沒有 dependency 的 entity」開始
  // 所以用 forward 方向：outdegree（我依賴多少人）= 0 → 起點
  const outdegree = new Map<string, number>()
  for (const [node, deps] of graph) outdegree.set(node, deps.size)

  const order: string[] = []
  const queue: string[] = []
  for (const [node, deg] of outdegree) {
    if (deg === 0) queue.push(node)
  }
  while (queue.length > 0) {
    const node = queue.shift()!
    order.push(node)
    // 找所有「依賴 node」的 entity，減其 outdegree
    for (const [other, deps] of graph) {
      if (deps.has(node)) {
        outdegree.set(other, (outdegree.get(other) || 1) - 1)
        if (outdegree.get(other) === 0) queue.push(other)
      }
    }
  }

  // 剩下沒排到的就是在環裡
  const cycleNodes = [...graph.keys()].filter(n => !order.includes(n))
  // 簡化：不細分多個環，全部當一個 group 回傳
  const cycles = cycleNodes.length > 0 ? [cycleNodes] : []
  return { order, cycles }
}

// ============================================================
// Column 合法值生成
// ============================================================

const AUTO_MANAGED_COLS = new Set(['id', 'created_at', 'updated_at', 'deleted_at'])

export function getRequiredColumns(table: TableDefinition): ColumnDefinition[] {
  return table.columns.filter(c => {
    if (c.primaryKey) return false
    const lower = c.name.toLowerCase()
    if (AUTO_MANAGED_COLS.has(lower)) return false
    // notNull 且無 default → 必填
    if (c.notNull && !c.defaultValue) return true
    // 有 default 的不必填
    return false
  })
}

/**
 * 為一個 column 產生 sample 值（CHECK 優先 > FK 引用 > 類型預設）
 * fkResolver: 若 column 是 FK，傳回「$ParentEntity1.id」；若 null 回 fallback
 */
export function sampleValueForColumn(col: ColumnDefinition, fkResolver: (col: ColumnDefinition) => string | null): string {
  // FK 欄位優先
  if (col.foreignKey) {
    const fk = fkResolver(col)
    if (fk) return fk
  }
  // CHECK 約束欄位：取 enum 第一個
  if (col.checkConstraint) {
    const spec = parseCheckConstraintSpec(col.checkConstraint)
    if (spec?.kind === 'enum' && spec.values.length > 0) return spec.values[0]
    if (spec?.kind === 'range') {
      // 取邊界值
      switch (spec.op) {
        case '>=': return String(spec.value)
        case '<=': return String(spec.value)
        case '>': return String(spec.value + 1)
        case '<': return String(spec.value - 1)
        case '=': return String(spec.value)
      }
    }
  }
  // 類型預設
  const type = col.type.toUpperCase()
  if (type.includes('INT') || type.includes('SERIAL')) return '0'
  if (type.includes('BOOL')) return 'true'
  if (type.includes('NUMERIC') || type.includes('DECIMAL') || type.includes('REAL') || type.includes('DOUBLE') || type.includes('FLOAT')) return '0'
  if (type.includes('DATE') && !type.includes('TIMESTAMP')) return '@time(now)'
  if (type.includes('TIMESTAMP')) return '@time(now)'
  if (type.includes('JSON')) return '{}'
  if (type.includes('UUID')) return '@uuid(1)'  // SpecFormula 的 uuid helper
  // TEXT/VARCHAR 預設
  return `Sample ${col.name}`
}

// ============================================================
// 主函數：autoDeclareUndeclaredVars
// ============================================================

export interface AutoDeclareResult {
  content: string
  declaredEntities: string[]
  skippedWithReason: Array<{ entity: string; reason: string }>
}

/**
 * 對 Feature content 的「完全未宣告變數」deterministic 補 Background 宣告。
 *
 * @param featureContent 原始 Feature 文字（可能有或沒有 Background）
 * @param undeclaredVars 已由 Check 5 偵測到的未宣告變數列表（{ entity, field }）
 * @param schemas 來自 parseSchemasFromString 的 schemas（含 entity → table 映射）
 * @returns 修改後 content + 成功宣告的 entity 列表 + 跳過的 entity 及原因
 */
export function autoDeclareUndeclaredVars(
  featureContent: string,
  undeclaredVars: Array<{ entity: string; field: string }>,
  schemas: DatabaseSchema[],
): AutoDeclareResult {
  if (undeclaredVars.length === 0) {
    return { content: featureContent, declaredEntities: [], skippedWithReason: [] }
  }

  // De-dup by entity（每個 entity 只補一次宣告）
  const entitiesSet = new Set(undeclaredVars.map(v => v.entity))
  const entities = [...entitiesSet]

  // 篩掉 schema 沒對應的
  const validEntities: string[] = []
  const skipped: Array<{ entity: string; reason: string }> = []
  for (const e of entities) {
    const found = DatabaseSchema.findSchemaAndTable(schemas, e)
    if (!found) {
      skipped.push({ entity: e, reason: 'entity not in schema (check Entity Mapping)' })
    } else {
      validEntities.push(e)
    }
  }

  if (validEntities.length === 0) {
    return { content: featureContent, declaredEntities: [], skippedWithReason: skipped }
  }

  // FK 拓撲排序
  const graph = buildForeignKeyGraph(schemas, validEntities)
  const { order, cycles } = topologicalSort(graph)
  for (const cycleGroup of cycles) {
    for (const e of cycleGroup) {
      if (validEntities.includes(e)) {
        skipped.push({ entity: e, reason: `circular FK: ${cycleGroup.join(' → ')}` })
      }
    }
  }

  // 過濾：order 含依賴但不在 validEntities 的（傳遞依賴自動帶入）要保留
  const finalOrder = order.filter(e => validEntities.includes(e) || graph.has(e))

  // 為每個 entity 生成 Given / And 步驟文字
  const lines: string[] = []
  const declared: string[] = []
  for (const entity of finalOrder) {
    const found = DatabaseSchema.findSchemaAndTable(schemas, entity)
    if (!found) continue
    const { table } = found
    const required = getRequiredColumns(table)

    // header: >Entity1.id + 必要欄位名（非 FK 也列出，以便補 sample 值）
    //   FK 欄位用 parent entity reference
    const entityLower = entity.charAt(0).toLowerCase() + entity.slice(1)
    const execKey = `${entityLower}1Id`
    const headers = [`>${entity}1.id`, ...required.map(c => c.name)]
    const dataCells = [
      `<${execKey}`,
      ...required.map(c => {
        const val = sampleValueForColumn(c, (col) => {
          // FK resolver：找 parent entity 的 >X1.id，若 parent 不在 declared set 但 schema 有 → 也用
          if (!col.foreignKey) return null
          const refTable = col.foreignKey.split('.')[0]?.toLowerCase()
          if (!refTable) return null
          // 反查 parent entity name
          for (const schema of schemas) {
            const byEntity = schema.getTablesByEntityName()
            for (const [ent, tbl] of byEntity) {
              if (tbl.tableName.toLowerCase() === refTable) {
                return `$${ent}1.id`
              }
            }
          }
          return null
        })
        return val
      }),
    ]

    // 格式化 row（簡單對齊，空格 padding 不強求）
    const headerLine = `      | ${headers.join(' | ')} |`
    const dataLine = `      | ${dataCells.join(' | ')} |`
    // 用 Given 開頭（如果是 Background 的首步驟）或 And（後續步驟）
    const keyword = lines.length === 0 ? 'Given' : 'And'
    lines.push(`    ${keyword} 準備一個${entity}, with table:`)
    lines.push(headerLine)
    lines.push(dataLine)

    declared.push(entity)
  }

  if (lines.length === 0) {
    return { content: featureContent, declaredEntities: [], skippedWithReason: skipped }
  }

  // 插入到 Background（有則 append、無則創建）
  const newContent = insertIntoBackground(featureContent, lines)

  logger.info({ declared, skipped }, 'Deterministic 補宣告完成')
  return { content: newContent, declaredEntities: declared, skippedWithReason: skipped }
}

/**
 * 把新 step lines 插到 Feature 的 Background 區塊。
 *   有 Background：在最末 data row 後 append，關鍵字改為 And
 *   無 Background：在 Feature: 之後插新 Background 區塊
 */
export function insertIntoBackground(content: string, newStepLines: string[]): string {
  const lines = content.split('\n')
  const bounds = extractBackgroundBounds(content)

  if (bounds) {
    // 已有 Background：在 endLine 之後插入，第一行改 And（因為已有先存的 Given/And）
    const adjusted = [...newStepLines]
    // 第一步應該是 And 而非 Given（sibling of 現有步驟）
    if (adjusted[0].match(/^\s*Given\s/)) {
      adjusted[0] = adjusted[0].replace(/^(\s*)Given\s/, '$1And ')
    }
    const before = lines.slice(0, bounds.endLine)
    const after = lines.slice(bounds.endLine)
    return [...before, ...adjusted, ...after].join('\n')
  }

  // 無 Background：找 `Feature: ...` 行，在後面插新 `\n  Background:\n<steps>`
  let featureLineIdx = -1
  for (let i = 0; i < lines.length; i++) {
    if (/^Feature:\s/.test(lines[i].trim())) {
      featureLineIdx = i
      break
    }
  }
  if (featureLineIdx < 0) {
    // 沒 Feature: 宣告（壞 Feature）→ 不動
    return content
  }
  const backgroundBlock = ['', '  Background:', ...newStepLines]
  const before = lines.slice(0, featureLineIdx + 1)
  const after = lines.slice(featureLineIdx + 1)
  return [...before, ...backgroundBlock, ...after].join('\n')
}
