// ============================================================
// L17.P2 — Deterministic Feature 補宣告
// 核心：對「完全未宣告的 $X.field」直接產出合法的 Background DataTable 宣告，
// 不靠 LLM。FK 拓撲排序處理依賴鏈；CHECK 約束值從 enum 取第一個。
// 失敗（循環 FK / entity 不在 schema）→ 跳過該 entity 並記 reason，由 LLM fallback。
// ============================================================

import { DatabaseSchema, TableDefinition, type ColumnDefinition } from '../lib/specformula/spec/data/models'
import { NamingConverter } from '../lib/specformula/helper/naming-converter'
import {
  parseCheckConstraintSpec,
  extractEntitySetupWithData,
  extractEntityValidateSteps,
  splitFeatureIntoScenarios,
  extractScenariosWithScope,
  type AlignmentIssue,
  type EntitySetupWithData,
} from './feature-alignment-gate'
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

// ============================================================
// L19.P0.1：單層 VAR 編號補齊
// 處理 LLM 引用 $section6Id / $pageSection2Id 等單層 camelCase 變數
// ============================================================

export interface SingleLayerRef {
  varName: string
  entity: string
  index: number
  field: string
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** 切割 `| a | b | c |` → `['a', 'b', 'c']`，保留中間空 cell */
function splitDataTableRow(text: string): string[] {
  const parts = text.split('|').map(c => c.trim())
  if (parts.length > 0 && parts[0] === '') parts.shift()
  if (parts.length > 0 && parts[parts.length - 1] === '') parts.pop()
  return parts
}

/**
 * 掃 content 的所有單層 camelCase VAR 引用，對照 schema entities 反推。
 * 範例：`$pageSection6Id` + schema 有 `PageSection` → { entity: 'PageSection', index: 6, field: 'id' }
 * 多候選時取長 prefix 優先（避免誤拆 `pageSection6Id` 成 `Section`）。
 */
export function extractSingleLayerVarRefs(content: string, schemas: DatabaseSchema[]): SingleLayerRef[] {
  const matches = new Set<string>()
  const pattern = /\$([a-z][a-zA-Z0-9]*)(?![.\w])/g
  let m: RegExpExecArray | null
  while ((m = pattern.exec(content)) !== null) {
    matches.add(m[1])
  }

  const entities: string[] = []
  for (const schema of schemas) {
    for (const entity of schema.getTablesByEntityName().keys()) entities.push(entity)
  }
  entities.sort((a, b) => b.length - a.length)

  const refs: SingleLayerRef[] = []
  for (const varName of matches) {
    for (const entity of entities) {
      const entityLower = entity.charAt(0).toLowerCase() + entity.slice(1)
      const re = new RegExp(`^${escapeRegex(entityLower)}(\\d+)([A-Z]\\w*)$`)
      const match = varName.match(re)
      if (!match) continue

      const index = parseInt(match[1], 10)
      const fieldUpper = match[2]

      // L20.D：field 名對齊 schema 實際 column 名（而非字面 lowercase 轉換）
      // 場景：LLM 寫 `$section6ID`（大寫 ID）→ fieldUpper="ID" → 字面轉換成 "iD"（錯）
      // 解法：查 schema column 是否有 match（試 snake_case / camelCase / lowercase）
      const table = DatabaseSchema.findSchemaAndTable(schemas, entity)?.table
      let field: string
      if (table) {
        const fuLower = fieldUpper.toLowerCase()
        const fuSnake = fieldUpper.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()
        // 先找完全匹配，再找 case-insensitive，最後 fallback 到 snake
        const matched = table.columns.find(c => {
          const cn = c.name.toLowerCase()
          return cn === fuLower || cn === fuSnake
        })
        field = matched ? matched.name : fieldUpper.charAt(0).toLowerCase() + fieldUpper.slice(1)
      } else {
        // 無 table 可查 → 字面轉換（舊行為）
        field = fieldUpper.charAt(0).toLowerCase() + fieldUpper.slice(1)
      }

      refs.push({ varName, entity, index, field })
      break
    }
  }
  return refs
}

/** 掃 content 現有 `>EntityN.field` 宣告，建 Map<entity, Set<index>> */
export function extractExistingDeclarationIndexes(content: string): Map<string, Set<number>> {
  const result = new Map<string, Set<number>>()
  const pattern = />([A-Z][A-Za-z]*?)(\d+)\.(\w+)/g
  let m: RegExpExecArray | null
  while ((m = pattern.exec(content)) !== null) {
    const entity = m[1]
    const index = parseInt(m[2], 10)
    if (!result.has(entity)) result.set(entity, new Set())
    result.get(entity)!.add(index)
  }
  return result
}

/**
 * L19.P0.1：deterministic 補單層 VAR 編號缺失的宣告。
 * 場景：Feature 宣告 `>Section1.id ~ >Section5.id`，引用 `$section6Id` → 無對應 → runtime 爆
 * 解法：掃引用 → 對比現有宣告 → 缺失 index 補 `>Entity<N>.id + <entity<N>Id`
 */
export function autoFillSingleLayerVarGaps(
  content: string,
  schemas: DatabaseSchema[],
): { content: string; filledGaps: SingleLayerRef[] } {
  const refs = extractSingleLayerVarRefs(content, schemas)
  if (refs.length === 0) return { content, filledGaps: [] }

  const existing = extractExistingDeclarationIndexes(content)
  const gaps: SingleLayerRef[] = []
  for (const ref of refs) {
    const declared = existing.get(ref.entity)
    if (!declared || !declared.has(ref.index)) gaps.push(ref)
  }
  if (gaps.length === 0) return { content, filledGaps: [] }

  const lines: string[] = []
  for (const gap of gaps) {
    const found = DatabaseSchema.findSchemaAndTable(schemas, gap.entity)
    if (!found) continue
    const { table } = found
    const required = getRequiredColumns(table)

    const entityLower = gap.entity.charAt(0).toLowerCase() + gap.entity.slice(1)

    // L21.P1-B.3：gap.field 可能是 snake_case（L20.D 對齊 schema column 的後果）
    //   但 DSL VAR declaration 習慣 camelCase + executionKey 也是 camelCase
    //   統一轉 camelCase：user_id → userId，保持 `>EntityN.userId` + `<entityNUserId` 一致
    const fieldForDsl = NamingConverter.snakeToCamel(gap.field)
    const fieldUpper = fieldForDsl.charAt(0).toUpperCase() + fieldForDsl.slice(1)
    const execKey = `${entityLower}${gap.index}${fieldUpper}`

    // L21.P1-B.1：若 required columns 為空（如 entity 只有 PK + auto-managed columns）
    //   原本只會生 `>EntityN.id | <entityNId`，data row 無非 VAR cell → EntitySetup.insertRow
    //   在 entity-setup.ts:158 會爆「沒有可插入的欄位」。
    //   解法：至少帶一個 safe `id` column（顯式 UUID sample）補一欄，保證 INSERT 有可插入 column
    const hasRequiredCols = required.length > 0
    const headers = hasRequiredCols
      ? [`>${gap.entity}${gap.index}.${fieldForDsl}`, ...required.map(c => c.name)]
      : [`>${gap.entity}${gap.index}.${fieldForDsl}`, 'id']
    const dataCells = [
      `<${execKey}`,
      ...(hasRequiredCols
        ? required.map(c => sampleValueForColumn(c, (col) => {
            if (!col.foreignKey) return null
            const refTable = col.foreignKey.split('.')[0]?.toLowerCase()
            if (!refTable) return null
            for (const schema of schemas) {
              const byEntity = schema.getTablesByEntityName()
              for (const [ent, tbl] of byEntity) {
                if (tbl.tableName.toLowerCase() === refTable) return `$${ent}1.id`
              }
            }
            return null
          }))
        : ['@uuid(1)']  // 無 required columns → 顯式 id 保證 INSERT 可用
      ),
    ]

    lines.push(`    And 準備一個${gap.entity}, with table:`)
    lines.push(`      | ${headers.join(' | ')} |`)
    lines.push(`      | ${dataCells.join(' | ')} |`)
  }

  if (lines.length === 0) return { content, filledGaps: [] }

  const newContent = insertIntoBackground(content, lines)
  logger.info({ gaps }, 'Deterministic 補單層 VAR 編號完成')
  return { content: newContent, filledGaps: gaps }
}

// ============================================================
// L19.P0.2：空 entity_setup 刪除
// ============================================================

/**
 * 掃 Feature content 的 entity_setup 步驟。
 * 若 DataTable 只有 header 或所有 data cells 全空 → 刪除整個步驟。
 *
 * 保留規則：header 有 `>Entity.field` + data 有 `<executionKey` → 合法 VAR placeholder，保留。
 */
export function removeEmptyEntitySetup(content: string): { content: string; removed: string[] } {
  const lines = content.split('\n')
  const removed: string[] = []
  const keepMask = new Array(lines.length).fill(true)

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    const match = trimmed.match(/^(?:Given|When|Then|And|But)\s+準備一個\s*(.+?)\s*[,，]\s*with\s+table:/i)
    if (!match) continue
    const entityName = match[1].trim()

    const tableStart = i + 1
    let tableEnd = tableStart - 1
    for (let j = tableStart; j < lines.length; j++) {
      if (lines[j].trim().startsWith('|')) tableEnd = j
      else break
    }
    if (tableEnd < tableStart) continue

    const headerLine = lines[tableStart]
    const dataLines = lines.slice(tableStart + 1, tableEnd + 1)
    const headers = splitDataTableRow(headerLine.trim())
    const hasVarDeclaration = headers.some(h => h.startsWith('>'))

    let hasNonEmptyData = false
    let hasExecutionKey = false
    let hasExplicitNull = false
    for (const dl of dataLines) {
      const cells = splitDataTableRow(dl.trim())
      for (const c of cells) {
        if (c === '') continue
        if (c === 'null' || c === 'NULL') {
          // L20.B：顯式 null 可能是合法 NULL 測試，標記但不算空
          hasExplicitNull = true
          continue
        }
        if (c.startsWith('<')) {
          hasExecutionKey = true
          continue
        }
        hasNonEmptyData = true
        break
      }
      if (hasNonEmptyData) break
    }

    // L20.A：isLegitPlaceholder 放寬 — 只要 header 有 `>Entity.*` 宣告就保留
    //   理由：LLM 常漏加 `<executionKey`，但純 `>` 宣告仍是合法 VAR 宣告。
    //   後續 L17/P0.1 的 deterministic 會補齊 executionKey；此處不該誤刪 scaffold。
    const isLegitPlaceholder = hasVarDeclaration
    // L20.B + L21.P1-B.2：顯式 null 測試場景
    //   閾值應該看「非 VAR 宣告的業務 data column 數」，不是 raw header 數。
    //   例：header `| >Entity1.id | status | timeout |`（3 header）其中 2 個是 data column
    //       → 業務 data column 2 → 合法 NULL test
    //   避免「header 含 >VAR 就把閾值擠過 2」造成誤刪合法場景
    const dataHeaders = headers.filter(h => !h.startsWith('>') && !h.startsWith('<'))
    const isExplicitNullTest = hasExplicitNull && dataHeaders.length <= 2
    if (hasNonEmptyData || isLegitPlaceholder || isExplicitNullTest) continue

    for (let k = i; k <= tableEnd; k++) keepMask[k] = false
    removed.push(entityName)
    i = tableEnd
  }

  if (removed.length === 0) return { content, removed: [] }

  const newLines = lines.filter((_, idx) => keepMask[idx])
  logger.info({ removed }, 'Deterministic 刪除空 entity_setup')
  return { content: newLines.join('\n'), removed }
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

// ============================================================
// R1: 確定性 alignment 修補（Check 12 / 14 / 15 / 16）— 取代 LLM
// ============================================================

function toSnakeCase(s: string): string {
  return s.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()
}

function toCamelCase(s: string): string {
  return s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
}

/**
 * 把 column 加到單一 DataTable row（保持結尾 ` |` 結構）
 * `| a | b |` + value="c" → `| a | b | c |`
 */
function appendCellToRow(row: string, value: string): string {
  const m = row.match(/^(\s*\|.*?)\|\s*$/)
  if (!m) return row
  return `${m[1]}${value} |`
}

/**
 * 找到 entity_setup table 的所有行 index（header + data rows）
 * stepLine 是「準備一個 X, with table:」的 1-based 行號
 * 回傳 0-based line indices
 */
function findTableLineIndices(lines: string[], stepLine1Based: number): number[] {
  const indices: number[] = []
  let i = stepLine1Based  // 0-based 等於 1-based - 1，再從下一行開始
  // 跳過空行直到第一個 |
  while (i < lines.length && lines[i].trim() === '') i++
  while (i < lines.length && lines[i].trim().startsWith('|')) {
    indices.push(i)
    i++
  }
  return indices
}

/**
 * 把 column 加到既有 entity_setup table（header + 所有 data rows）
 * 回傳更新後的 lines；若 stepLine 找不到對應 table → 原樣返回
 */
function appendColumnToEntitySetup(
  lines: string[],
  setupStep: EntitySetupWithData,
  columnHeader: string,
  cellValue: string,
): { lines: string[]; mutated: boolean } {
  const tableIndices = findTableLineIndices(lines, setupStep.stepLine)
  if (tableIndices.length < 1) return { lines, mutated: false }
  const newLines = [...lines]
  // 第一行 = header
  newLines[tableIndices[0]] = appendCellToRow(newLines[tableIndices[0]], columnHeader)
  // 後續 = data rows
  for (let k = 1; k < tableIndices.length; k++) {
    newLines[tableIndices[k]] = appendCellToRow(newLines[tableIndices[k]], cellValue)
  }
  return { lines: newLines, mutated: true }
}

/**
 * 從 entity_setup 移除指定 column（用於 Check 15：$null 期望但 setup 給值）
 * 需要把 header 那一格 + 所有 data rows 對應 cell 整格移除
 */
function removeColumnFromEntitySetup(
  lines: string[],
  setupStep: EntitySetupWithData,
  columnHeader: string,
): { lines: string[]; mutated: boolean } {
  const tableIndices = findTableLineIndices(lines, setupStep.stepLine)
  if (tableIndices.length < 1) return { lines, mutated: false }
  // 找 header 內的 column index
  const headerRow = lines[tableIndices[0]]
  const headerCells = headerRow.split('|').map(c => c.trim())
  // headerCells[0] = ''（行首 | 前），headerCells[last] = ''（行尾 | 後）
  let targetIdx = -1
  const variants = [columnHeader, toCamelCase(columnHeader), toSnakeCase(columnHeader)]
  for (let i = 1; i < headerCells.length - 1; i++) {
    const clean = headerCells[i].replace(/^[><]/, '').trim()
    if (variants.includes(clean)) {
      targetIdx = i
      break
    }
  }
  if (targetIdx === -1) return { lines, mutated: false }

  const newLines = [...lines]
  for (const li of tableIndices) {
    const cells = newLines[li].split('|')
    // cells 對應 split — cells[0] 是行首空字串，cells[targetIdx] 是要移的，cells[last] 是行尾空字串
    if (targetIdx < cells.length - 1) {
      cells.splice(targetIdx, 1)
    }
    // 重新組合：每個非首尾空格 cell 都該補 padding。最簡單：保留結構 `| a | b |`
    // cells: ['', ' a ', ' b ', ''] → '| a | b |'
    newLines[li] = cells.join('|')
  }
  return { lines: newLines, mutated: true }
}

/**
 * 找 schema 裡哪個 table 包含這個 field（用於從 Check 12 fieldName 反推 entity）
 * 回傳 entity name（如果 schemas 帶 mapping）或 table name
 */
function findEntityForField(
  fieldName: string,
  schemas: DatabaseSchema[],
): { entityName: string; table: TableDefinition; column: ColumnDefinition } | null {
  const variants = [fieldName, toSnakeCase(fieldName), toCamelCase(fieldName)]
  for (const schema of schemas) {
    for (const table of schema.tables) {
      for (const col of table.columns) {
        if (variants.includes(col.name)) {
          // 反查 entity name
          const mapping = schema.entityTableMapping
          let entityName = table.tableName
          if (mapping) {
            for (const entry of mapping.entity_to_table_mapping) {
              for (const [eName, tName] of Object.entries(entry)) {
                if (tName === table.tableName) {
                  entityName = eName
                  break
                }
              }
            }
          }
          return { entityName, table, column: col }
        }
      }
    }
  }
  return null
}

/**
 * 為某 column 推一個合理的 sample value 作為 entity_setup cell 值
 * （複用 sampleValueForColumn 但簡化 fkResolver — 不解析 FK，回 $notnull placeholder）
 */
function sampleValueForFix(col: ColumnDefinition): string {
  return sampleValueForColumn(col, () => null)
}

// ============================================================
// Helper 1: autoFillNotnullSetupGap (Check 12)
// ============================================================

export interface AlignmentDeterministicFixResult {
  content: string
  fixedFields: Array<{ scenario: string; field: string; entity: string }>
  skipped: Array<{ field: string; reason: string }>
}

/**
 * Check 12: notnull_field_missing_from_setup
 * Then 期望 `$notnull` 但 entity_setup 沒給 → append column 到對應 entity_setup
 */
export function autoFillNotnullSetupGap(
  content: string,
  issues: AlignmentIssue[],
  schemas: DatabaseSchema[],
): AlignmentDeterministicFixResult {
  const targets = issues.filter(
    i => i.checkName === 'notnull_field_missing_from_setup' && i.severity === 'error',
  )
  if (targets.length === 0) {
    return { content, fixedFields: [], skipped: [] }
  }

  let lines = content.split('\n')
  const fixedFields: Array<{ scenario: string; field: string; entity: string }> = []
  const skipped: Array<{ field: string; reason: string }> = []

  // 每次 mutate 後重新 extract 確保 stepLine 正確（防 line index 漂移）
  for (const issue of targets) {
    const m = issue.description.match(/Scenario "([^"]+)" 的 Then 表期望欄位 `([^`]+)` 為 `\$notnull`/)
    if (!m) {
      skipped.push({ field: '?', reason: 'description 格式不符 — 無法 parse scenario/field' })
      continue
    }
    const scenarioName = m[1]
    const fieldName = m[2]

    // 從 schema 找 fieldName 屬於哪個 table → entity
    const found = findEntityForField(fieldName, schemas)
    if (!found) {
      skipped.push({ field: fieldName, reason: 'schema 找不到對應 column — 可能 server-gen' })
      continue
    }

    // 找該 entity 的 entity_setup（同 feature 內第一個匹配）
    const currentContent = lines.join('\n')
    const setupSteps = extractEntitySetupWithData(currentContent)
    const matchSetup = setupSteps.find(
      s => s.entityName.toLowerCase() === found.entityName.toLowerCase() ||
           toSnakeCase(s.entityName) === toSnakeCase(found.entityName),
    )
    if (!matchSetup) {
      skipped.push({ field: fieldName, reason: `entity_setup 缺 ${found.entityName} — 屬 Check 14/16 範疇` })
      continue
    }

    // 已存在該 column → 跳過（可能上一輪修過了）
    const variants = [fieldName, toSnakeCase(fieldName), toCamelCase(fieldName)]
    const alreadyHas = matchSetup.rawHeaders.some(
      h => variants.includes(h.replace(/^[><]/, '').trim()),
    )
    if (alreadyHas) {
      continue
    }

    const sampleValue = sampleValueForFix(found.column)
    const headerName = toCamelCase(fieldName)
    const result = appendColumnToEntitySetup(lines, matchSetup, headerName, sampleValue)
    if (!result.mutated) {
      skipped.push({ field: fieldName, reason: 'appendColumnToEntitySetup 失敗（table 結構異常）' })
      continue
    }
    lines = result.lines
    fixedFields.push({ scenario: scenarioName, field: fieldName, entity: found.entityName })
  }

  return { content: lines.join('\n'), fixedFields, skipped }
}

// ============================================================
// Helper 2: autoRemoveNullConflictSetup (Check 15)
// ============================================================

/**
 * Check 15: null_expectation_setup_conflict
 * Then 期望 `$null` 但 entity_setup 給了非空值 → 移除 entity_setup 該 column
 */
export function autoRemoveNullConflictSetup(
  content: string,
  issues: AlignmentIssue[],
): { content: string; removedFields: Array<{ scenario: string; field: string; entity: string }>; skipped: Array<{ field: string; reason: string }> } {
  const targets = issues.filter(
    i => i.checkName === 'null_expectation_setup_conflict' && i.severity === 'error',
  )
  if (targets.length === 0) {
    return { content, removedFields: [], skipped: [] }
  }

  let lines = content.split('\n')
  const removedFields: Array<{ scenario: string; field: string; entity: string }> = []
  const skipped: Array<{ field: string; reason: string }> = []

  for (const issue of targets) {
    // description 包含 entity name + field name
    // 格式：`...期望欄位 \`fieldName\` 為 \`$null\`...但 entity_setup \`entityName\` 給了 \`fieldName = ...\``
    const m = issue.description.match(
      /Scenario "([^"]+)" .*期望欄位 `([^`]+)` 為 `\$null`.*entity_setup `([^`]+)`/,
    )
    if (!m) {
      skipped.push({ field: '?', reason: 'description 格式不符' })
      continue
    }
    const scenarioName = m[1]
    const fieldName = m[2]
    const entityName = m[3]

    const currentContent = lines.join('\n')
    const setupSteps = extractEntitySetupWithData(currentContent)
    const matchSetup = setupSteps.find(s => s.entityName === entityName)
    if (!matchSetup) {
      skipped.push({ field: fieldName, reason: `找不到 entity_setup ${entityName}` })
      continue
    }
    const result = removeColumnFromEntitySetup(lines, matchSetup, fieldName)
    if (!result.mutated) {
      skipped.push({ field: fieldName, reason: 'column 已不在 entity_setup（可能上輪修過）' })
      continue
    }
    lines = result.lines
    removedFields.push({ scenario: scenarioName, field: fieldName, entity: entityName })
  }

  return { content: lines.join('\n'), removedFields, skipped }
}

// ============================================================
// Helper 3: autoFillEntityValidateGap (Check 16)
// ============================================================

/**
 * Check 16: entity_validation_field_missing_from_setup
 * 應該存在一個 X with table 期望欄位但 entity_setup 沒給 → append 到 entity_setup
 */
export function autoFillEntityValidateGap(
  content: string,
  issues: AlignmentIssue[],
  schemas: DatabaseSchema[],
): AlignmentDeterministicFixResult {
  const targets = issues.filter(
    i => i.checkName === 'entity_validation_field_missing_from_setup' && i.severity === 'error',
  )
  if (targets.length === 0) {
    return { content, fixedFields: [], skipped: [] }
  }

  let lines = content.split('\n')
  const fixedFields: Array<{ scenario: string; field: string; entity: string }> = []
  const skipped: Array<{ field: string; reason: string }> = []

  for (const issue of targets) {
    // description 包含 entityName + fieldName + sampleExpected
    // 格式：`Scenario "X" 的 \`應該存在一個 EntityName, with table:\` 期望欄位 \`fieldName\` 為 \`value\``
    const m = issue.description.match(
      /Scenario "([^"]+)" 的 `應該存在一個 ([^,，]+)[,，] with table:` 期望欄位 `([^`]+)` 為 `([^`]+)`/,
    )
    if (!m) {
      skipped.push({ field: '?', reason: 'description 格式不符' })
      continue
    }
    const scenarioName = m[1]
    const entityName = m[2].trim()
    const fieldName = m[3]
    const expectedValue = m[4]

    const currentContent = lines.join('\n')
    const setupSteps = extractEntitySetupWithData(currentContent)
    const matchSetup = setupSteps.find(s => s.entityName === entityName)
    if (!matchSetup) {
      skipped.push({ field: fieldName, reason: `entity_setup 缺 ${entityName}` })
      continue
    }

    // 已存在 column → 跳過
    const variants = [fieldName, toSnakeCase(fieldName), toCamelCase(fieldName)]
    const alreadyHas = matchSetup.rawHeaders.some(
      h => variants.includes(h.replace(/^[><]/, '').trim()),
    )
    if (alreadyHas) continue

    // 推斷 sample value：若 expectedValue=$notnull → 從 schema 取 sample；否則用 expectedValue
    let cellValue: string
    if (expectedValue === '$notnull') {
      const found = findEntityForField(fieldName, schemas)
      cellValue = found ? sampleValueForFix(found.column) : `Sample ${fieldName}`
    } else {
      cellValue = expectedValue
    }

    const headerName = toCamelCase(fieldName)
    const result = appendColumnToEntitySetup(lines, matchSetup, headerName, cellValue)
    if (!result.mutated) {
      skipped.push({ field: fieldName, reason: 'appendColumnToEntitySetup 失敗' })
      continue
    }
    lines = result.lines
    fixedFields.push({ scenario: scenarioName, field: fieldName, entity: entityName })
  }

  return { content: lines.join('\n'), fixedFields, skipped }
}

// ============================================================
// Helper 4: autoFillScenarioScopeSetup (Check 14)
// ============================================================

/**
 * Check 14: scenario_scope_setup_mismatch
 * 該 scenario scope（Background + 自身 Given）缺欄位，但 Feature 其他 scenario 有
 * → 找到「其他 scenario 提供該欄位」的 entity_setup，複製到 Background（讓所有 scenario 共享）
 *
 * 注意：Check 14 預設 severity='warning'，只在 STRICT_SCENARIO_SCOPE_ALIGNMENT=true 時為 error
 * 這裡只處理 error 嚴重度（避免誤動 warning case）
 */
export function autoFillScenarioScopeSetup(
  content: string,
  issues: AlignmentIssue[],
  schemas: DatabaseSchema[],
): AlignmentDeterministicFixResult {
  const targets = issues.filter(
    i => i.checkName === 'scenario_scope_setup_mismatch' && i.severity === 'error',
  )
  if (targets.length === 0) {
    return { content, fixedFields: [], skipped: [] }
  }

  let lines = content.split('\n')
  const fixedFields: Array<{ scenario: string; field: string; entity: string }> = []
  const skipped: Array<{ field: string; reason: string }> = []

  for (const issue of targets) {
    const m = issue.description.match(/Scenario "([^"]+)" 的 Then 期望欄位 `([^`]+)`/)
    if (!m) {
      skipped.push({ field: '?', reason: 'description 格式不符' })
      continue
    }
    const scenarioName = m[1]
    const fieldName = m[2]

    // 找 schema entity
    const found = findEntityForField(fieldName, schemas)
    if (!found) {
      skipped.push({ field: fieldName, reason: 'schema 無此 column' })
      continue
    }

    // 策略：在該 scenario 的 Given 區塊裡，如果已有對應 entity_setup → append column
    //       否則 skip（屬於 Check 12 範疇，會被 autoFillNotnullSetupGap 處理）
    const currentContent = lines.join('\n')
    const { scenarios } = splitFeatureIntoScenarios(currentContent)
    const scBlock = scenarios.find(s => s.scenarioName === scenarioName)
    if (!scBlock) {
      skipped.push({ field: fieldName, reason: `找不到 scenario block "${scenarioName}"` })
      continue
    }
    const localSetups = extractEntitySetupWithData(scBlock.content)
    const matchLocal = localSetups.find(
      s => s.entityName.toLowerCase() === found.entityName.toLowerCase(),
    )
    if (!matchLocal) {
      skipped.push({ field: fieldName, reason: '該 scenario Given 無對應 entity_setup（屬 Check 12 範疇）' })
      continue
    }

    // localSetup 的 stepLine 是相對於 scBlock 內容；需要轉成全 content 的行號
    // scBlock.startLine 是 1-based，scBlock.content = lines.slice(startLine-1, endLine).join('\n')
    // 所以 全 content 行號 = scBlock.startLine + (matchLocal.stepLine - 1)
    const absoluteStepLine = scBlock.startLine + (matchLocal.stepLine - 1)
    const absoluteSetup: EntitySetupWithData = { ...matchLocal, stepLine: absoluteStepLine }

    const variants = [fieldName, toSnakeCase(fieldName), toCamelCase(fieldName)]
    const alreadyHas = matchLocal.rawHeaders.some(
      h => variants.includes(h.replace(/^[><]/, '').trim()),
    )
    if (alreadyHas) continue

    const sampleValue = sampleValueForFix(found.column)
    const headerName = toCamelCase(fieldName)
    const result = appendColumnToEntitySetup(lines, absoluteSetup, headerName, sampleValue)
    if (!result.mutated) {
      skipped.push({ field: fieldName, reason: 'appendColumnToEntitySetup 失敗' })
      continue
    }
    lines = result.lines
    fixedFields.push({ scenario: scenarioName, field: fieldName, entity: found.entityName })
  }

  return { content: lines.join('\n'), fixedFields, skipped }
}

// ============================================================
// R3-A: 擴大 deterministic 覆蓋（Check 4 / 8 / 10）— 取代 LLM
// ============================================================

function findThenResponseHeaderLines(content: string): Array<{ headerLineIdx: number; cells: string[] }> {
  const lines = content.split('\n')
  const results: Array<{ headerLineIdx: number; cells: string[] }> = []
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (!/(?:Then|And)\s+.+\(\d+\)回應.*with\s+table:/.test(trimmed)) continue
    for (let j = i + 1; j < lines.length; j++) {
      const t = lines[j].trim()
      if (t === '') continue
      if (!t.startsWith('|')) break
      const cells = t.split('|').map(c => c.trim()).filter(Boolean)
      results.push({ headerLineIdx: j, cells })
      break
    }
  }
  return results
}

/**
 * R3-A Helper 1: Check 4 response_field_naming
 * Then 表 header 含 snake_case → 轉 camelCase（只動 header，不動 data row 內容）
 */
export function autoFixResponseFieldNaming(
  content: string,
  issues: AlignmentIssue[],
): { content: string; renamedFields: Array<{ from: string; to: string }>; skipped: Array<{ field: string; reason: string }> } {
  const targets = issues.filter(
    i => i.checkName === 'response_field_naming' && i.severity === 'error',
  )
  if (targets.length === 0) {
    return { content, renamedFields: [], skipped: [] }
  }

  const lines = content.split('\n')
  const renamedFields: Array<{ from: string; to: string }> = []
  const skipped: Array<{ field: string; reason: string }> = []

  const snakeFields = new Set<string>()
  for (const issue of targets) {
    const m = issue.description.match(/Response 欄位 "([^"]+)" 是 snake_case/)
    if (!m) {
      skipped.push({ field: '?', reason: 'description 格式不符' })
      continue
    }
    snakeFields.add(m[1])
  }

  if (snakeFields.size === 0) return { content, renamedFields: [], skipped }

  const responseHeaders = findThenResponseHeaderLines(content)
  for (const { headerLineIdx, cells } of responseHeaders) {
    let changed = false
    const newCells = cells.map(rawCell => {
      const prefixMatch = rawCell.match(/^([><$]?)(.*)$/)
      const prefix = prefixMatch?.[1] ?? ''
      const rest = prefixMatch?.[2] ?? rawCell
      const dotIdx = rest.lastIndexOf('.')
      const base = dotIdx >= 0 ? rest.substring(0, dotIdx + 1) : ''
      const fieldName = dotIdx >= 0 ? rest.substring(dotIdx + 1) : rest

      if (!snakeFields.has(fieldName)) return rawCell
      const camel = fieldName.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
      if (camel === fieldName) return rawCell
      renamedFields.push({ from: fieldName, to: camel })
      changed = true
      return `${prefix}${base}${camel}`
    })
    if (changed) {
      const origLine = lines[headerLineIdx]
      const indentMatch = origLine.match(/^(\s*)/)
      const indent = indentMatch?.[1] ?? ''
      lines[headerLineIdx] = `${indent}| ${newCells.join(' | ')} |`
    }
  }

  return { content: lines.join('\n'), renamedFields, skipped }
}

/**
 * R3-A Helper 2: Check 10 datatable_empty_row
 * entity_setup DataTable 整 row 全空 / 只有 < $ 前綴 cell → 刪掉該 row
 * 主動 scan（不依賴 issue description）— 避免行號漂移
 */
export function autoRemoveEmptyDataRows(
  content: string,
  issues: AlignmentIssue[],
): { content: string; removedRows: Array<{ entity: string; line: number }>; skipped: Array<{ entity: string; reason: string }> } {
  const targets = issues.filter(
    i => i.checkName === 'datatable_empty_row' && i.severity === 'error',
  )
  if (targets.length === 0) {
    return { content, removedRows: [], skipped: [] }
  }
  void targets

  const lines = content.split('\n')
  const setupSteps = extractEntitySetupWithData(content)
  const linesToDelete = new Set<number>()
  const removedRows: Array<{ entity: string; line: number }> = []

  for (const step of setupSteps) {
    for (const row of step.dataRows) {
      const hasRealValue = row.cells.some(raw => {
        const c = (raw || '').trim()
        if (!c) return false
        if (/^<[\w.]+$/.test(c)) return false
        if (/^\$[\w.]+$/.test(c)) return false
        return true
      })
      if (!hasRealValue) {
        linesToDelete.add(row.line)
        removedRows.push({ entity: step.entityName, line: row.line })
      }
    }
  }

  if (linesToDelete.size === 0) {
    return { content, removedRows: [], skipped: [] }
  }

  const newLines = lines.filter((_, idx) => !linesToDelete.has(idx + 1))
  return { content: newLines.join('\n'), removedRows, skipped: [] }
}

/**
 * R3-A Helper 3: Check 8 check_constraint
 * entity_setup 內的值違反 CHECK 約束 → enum 替換成第一個合法值 / range 替換成邊界值
 *
 * 安全限制：
 * - 只動 entity_setup（前置資料），不動 When call table（避免改用戶測試意圖）
 * - 環境變數 R3A_FIX_CHECK_CONSTRAINT=false 可一鍵 disable（中風險）
 */
export function autoFixCheckConstraintViolation(
  content: string,
  issues: AlignmentIssue[],
  schemas: DatabaseSchema[],
): { content: string; fixedValues: Array<{ entity: string; column: string; from: string; to: string }>; skipped: Array<{ column: string; reason: string }> } {
  if (process.env.R3A_FIX_CHECK_CONSTRAINT === 'false') {
    return { content, fixedValues: [], skipped: [] }
  }
  const targets = issues.filter(
    i => i.checkName === 'check_constraint' && i.severity === 'error',
  )
  if (targets.length === 0) {
    return { content, fixedValues: [], skipped: [] }
  }

  let lines = content.split('\n')
  const fixedValues: Array<{ entity: string; column: string; from: string; to: string }> = []
  const skipped: Array<{ column: string; reason: string }> = []

  for (const issue of targets) {
    const m = issue.description.match(/"準備一個([^"]+)" DataTable 值 "([^"]+)" 違反欄位 (\w+) 的 CHECK 約束/)
    if (!m) {
      skipped.push({ column: '?', reason: 'description 格式不符' })
      continue
    }
    const entityName = m[1].trim()
    const fromValue = m[2]
    const columnName = m[3]

    let columnDef: ColumnDefinition | null = null
    for (const schema of schemas) {
      for (const table of schema.tables) {
        const col = table.columns.find(c => c.name === columnName)
        if (col) { columnDef = col; break }
      }
      if (columnDef) break
    }
    if (!columnDef?.checkConstraint) {
      skipped.push({ column: columnName, reason: 'schema 找不到 CHECK constraint' })
      continue
    }
    const spec = parseCheckConstraintSpec(columnDef.checkConstraint)
    if (!spec) {
      skipped.push({ column: columnName, reason: 'CHECK constraint 解析失敗' })
      continue
    }

    let toValue: string
    if (spec.kind === 'enum') {
      toValue = spec.values[0]
    } else {
      switch (spec.op) {
        case '>=': toValue = String(spec.value); break
        case '<=': toValue = String(spec.value); break
        case '>': toValue = String(spec.value + 1); break
        case '<': toValue = String(spec.value - 1); break
        case '=': toValue = String(spec.value); break
      }
    }

    const currentContent = lines.join('\n')
    const setupSteps = extractEntitySetupWithData(currentContent)
    const matchSetup = setupSteps.find(s => s.entityName === entityName)
    if (!matchSetup) {
      skipped.push({ column: columnName, reason: `entity_setup 找不到 ${entityName}` })
      continue
    }

    let colIdx = -1
    for (let i = 0; i < matchSetup.rawHeaders.length; i++) {
      const h = matchSetup.rawHeaders[i].replace(/^[><]/, '').trim()
      const variants = [h, toSnakeCase(h), toCamelCase(h)]
      if (variants.includes(columnName)) {
        colIdx = i
        break
      }
    }
    if (colIdx === -1) {
      skipped.push({ column: columnName, reason: '在 entity_setup header 找不到 column' })
      continue
    }

    let mutated = false
    for (const row of matchSetup.dataRows) {
      const lineIdx = row.line - 1
      const origLine = lines[lineIdx]
      const cells = origLine.split('|')
      const targetIdx = colIdx + 1
      if (targetIdx >= cells.length - 1) continue
      const cellRaw = cells[targetIdx]
      const cellTrim = cellRaw.trim().replace(/^['"]|['"]$/g, '')
      if (cellTrim !== fromValue) continue
      const hasQuote = /^['"]/.test(cellRaw.trim())
      const newCellContent = hasQuote ? `'${toValue}'` : toValue
      cells[targetIdx] = ` ${newCellContent} `
      lines[lineIdx] = cells.join('|')
      mutated = true
    }
    if (mutated) {
      fixedValues.push({ entity: entityName, column: columnName, from: fromValue, to: toValue })
    } else {
      skipped.push({ column: columnName, reason: 'data row 找不到該值（可能已被前面修過）' })
    }
  }

  return { content: lines.join('\n'), fixedValues, skipped }
}

// ============================================================
// R4: Check 5.5 cross_scenario_var_reference deterministic 修補
// ============================================================

/**
 * 找指定 scenario 內，第一個 When/Then 之前的行 index（給 Given step 插入用）
 * 若 scenario 沒有 When/Then 則回 scenario block 末尾
 * 回傳 null 表 scenario 不存在
 */
function findScenarioGivenInsertionPoint(
  lines: string[],
  scenarioName: string,
): { lineIdx: number; indent: string; hasExistingGiven: boolean } | null {
  let inScenario = false
  let scenarioHeaderIdx = -1
  let firstWhenThenIdx = -1
  let hasExistingGiven = false

  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim()
    const sm = t.match(/^(?:Scenario:|Scenario Outline:|Example:)\s*(.+)$/)
    if (sm) {
      if (inScenario) {
        // 已進入下一個 scenario，當前 scenario 結束（沒有 When/Then 的 edge case）
        break
      }
      if (sm[1].trim() === scenarioName) {
        inScenario = true
        scenarioHeaderIdx = i
      }
      continue
    }
    if (!inScenario) continue
    if (/^(?:Given|And)\b/.test(t)) {
      hasExistingGiven = true
    }
    if (/^(?:When|Then)\b/.test(t)) {
      firstWhenThenIdx = i
      break
    }
  }
  if (!inScenario) return null
  // scenario header 的縮排 + 2 = step 縮排
  const headerIndent = lines[scenarioHeaderIdx].match(/^(\s*)/)?.[1] ?? ''
  const stepIndent = headerIndent + '  '
  const insertIdx = firstWhenThenIdx !== -1 ? firstWhenThenIdx : lines.length
  return { lineIdx: insertIdx, indent: stepIndent, hasExistingGiven }
}

/**
 * 從 content 找到「捕獲指定 var」的 entity_setup 步驟（含完整 table 行）
 * 回傳 step block 文字 + 行 index 範圍
 */
function findEntitySetupCapturingVar(
  content: string,
  varName: string,
): { stepBlock: string[]; sourceScenarioName: string | null } | null {
  const lines = content.split('\n')
  // 先用 extractEntitySetupWithData 找所有 entity_setup
  const setupSteps = extractEntitySetupWithData(content)
  for (const step of setupSteps) {
    // 該 step 的 dataRows cell 是否含 `<varName`
    const capturedHere = step.dataRows.some(row =>
      row.cells.some(cell => {
        const c = cell.trim()
        return c === `<${varName}` || c.startsWith(`<${varName}`)
      }),
    )
    if (!capturedHere) continue

    // 提取整個 step block：stepLine（1-based）+ 後續所有 |... 行
    const startIdx = step.stepLine - 1  // 0-based
    const tableEndIdx = step.dataRows.length > 0
      ? step.dataRows[step.dataRows.length - 1].line - 1  // 0-based
      : startIdx
    const block: string[] = []
    // 從 startIdx 開始，但只取「step line + table rows」
    block.push(lines[startIdx])
    for (let i = startIdx + 1; i <= tableEndIdx; i++) {
      block.push(lines[i])
    }
    // 找 source scenario name（用 splitFeatureIntoScenarios 判定）
    let sourceScenarioName: string | null = null
    const { scenarios } = splitFeatureIntoScenarios(content)
    for (const sc of scenarios) {
      if (step.stepLine >= sc.startLine && step.stepLine <= sc.endLine) {
        sourceScenarioName = sc.scenarioName
        break
      }
    }
    return { stepBlock: block, sourceScenarioName }
  }
  return null
}

/**
 * R4 Helper: Check 5.5 cross_scenario_var_reference
 *
 * Scenario X 引用 $varName 但 varName 只在 Scenario Y 宣告 →
 * 複製 Scenario Y 的 entity_setup 步驟到 Scenario X 的 Given
 *
 * 策略：複製不移動 — Scenario Y 自己仍保有宣告，避免破壞既有 scenario
 * 重複資料 INSERT 在 SpecFormula 是 OK 的（每 scenario 獨立 DB state）
 */
export function autoFillCrossScenarioVarReference(
  content: string,
  issues: AlignmentIssue[],
): {
  content: string
  fixedRefs: Array<{ targetScenario: string; varName: string; sourceScenario: string | null }>
  skipped: Array<{ ref: string; reason: string }>
} {
  const targets = issues.filter(
    i => i.checkName === 'cross_scenario_var_reference' && i.severity === 'error',
  )
  if (targets.length === 0) {
    return { content, fixedRefs: [], skipped: [] }
  }

  let workingContent = content
  const fixedRefs: Array<{ targetScenario: string; varName: string; sourceScenario: string | null }> = []
  const skipped: Array<{ ref: string; reason: string }> = []

  // 已處理（targetScenario, varName）避免重複插入
  const processed = new Set<string>()

  // 防爆 dedupe：同 targetScenario 已插入過的 step block hash → 不重複
  const insertedStepHashes = new Set<string>()

  for (const issue of targets) {
    // description: `Scenario "X" (line N) 引用 "$varName" 未在該 scenario 的 Background 或 Given 宣告`
    const m = issue.description.match(/Scenario "([^"]+)" \(line \d+\) 引用 "\$([^"]+)"/)
    if (!m) {
      skipped.push({ ref: '?', reason: 'description 格式不符' })
      continue
    }
    const targetScenarioName = m[1]
    const varName = m[2]
    const dedupeKey = `${targetScenarioName}::${varName}`
    if (processed.has(dedupeKey)) continue
    processed.add(dedupeKey)

    // 找 source step（捕獲此 var 的 entity_setup）
    const source = findEntitySetupCapturingVar(workingContent, varName)
    if (!source) {
      skipped.push({ ref: `${targetScenarioName}.$${varName}`, reason: '找不到 source（無 <varName 捕獲）' })
      continue
    }
    if (source.sourceScenarioName === targetScenarioName) {
      skipped.push({ ref: `${targetScenarioName}.$${varName}`, reason: 'source 已在 target scenario 內（誤判）' })
      continue
    }

    // 找 target scenario 的插入點
    const lines = workingContent.split('\n')
    const insertion = findScenarioGivenInsertionPoint(lines, targetScenarioName)
    if (!insertion) {
      skipped.push({ ref: `${targetScenarioName}.$${varName}`, reason: '找不到 target scenario' })
      continue
    }

    // 檢查同 step block 是否已插入過（防 N 個 var 從同 source 來重複插）
    const blockHash = `${targetScenarioName}::${source.stepBlock.join('\n')}`
    if (insertedStepHashes.has(blockHash)) {
      // 已從同 source 同 step 拉過了，不重複
      fixedRefs.push({ targetScenario: targetScenarioName, varName, sourceScenario: source.sourceScenarioName })
      continue
    }
    insertedStepHashes.add(blockHash)

    // 重新縮排 + Given/And 關鍵字調整
    // source 的第一行格式：`<indent>Given 準備一個 X, with table:` 或 `<indent>And 準備一個 X, ...`
    // 改成 target 的縮排 + 適當關鍵字
    const newStepBlock: string[] = []
    for (let k = 0; k < source.stepBlock.length; k++) {
      const line = source.stepBlock[k]
      const trimmed = line.trim()
      if (k === 0) {
        // step header line
        const keyword = insertion.hasExistingGiven ? 'And' : 'Given'
        const cleaned = trimmed.replace(/^(?:Given|And|When|Then|But)\s+/, '')
        newStepBlock.push(`${insertion.indent}${keyword} ${cleaned}`)
      } else {
        // table line — 換縮排即可
        newStepBlock.push(`${insertion.indent}  ${trimmed}`)
      }
    }

    // 插入
    const newLines = [
      ...lines.slice(0, insertion.lineIdx),
      ...newStepBlock,
      ...lines.slice(insertion.lineIdx),
    ]
    workingContent = newLines.join('\n')

    fixedRefs.push({ targetScenario: targetScenarioName, varName, sourceScenario: source.sourceScenarioName })
  }

  return { content: workingContent, fixedRefs, skipped }
}

