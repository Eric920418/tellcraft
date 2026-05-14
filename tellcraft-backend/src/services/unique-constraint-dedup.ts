// ============================================================
// Tier B2 — Unique Constraint Auto-Dedup
//
// 解：BDD 多筆 entity_setup 用同一 UNIQUE column 值（如同 email）
//     → INSERT 時 duplicate key violation → 整個 scenario 炸
//     → LLM fix loop 看不到根因（在 Server Action 層轉圈）
//
// 邏輯：scan features 的 entity_setup DataTable，按「同 scenario / Background scope」
//      group by (entity, uniqueColumn) — 若同值出現 ≥2 次 → 後出現的加 suffix
//
// 不動：Then 期望表（用戶可能故意比對原值）/ When call table headers
// 安全網：schemaSql 解析失敗 → 整個函數 fail-open（return null），不阻塞 pipeline
// ============================================================
import { createLogger } from '../lib/logger'

const logger = createLogger('unique-constraint-dedup')

export interface UniqueDedupChange {
  featureName: string
  entity: string
  column: string
  scope: 'background' | 'scenario'
  originalValue: string
  newValue: string
  line: number
}

export interface UniqueDedupResult {
  fixedFeatures: Map<string, string>
  changes: UniqueDedupChange[]
}

export function extractUniqueColumnsBySchema(schemaSql: string): Map<string, Set<string>> {
  const result = new Map<string, Set<string>>()
  if (!schemaSql) return result

  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?(\w+)["`]?\s*\(([\s\S]*?)\)\s*;/gi
  let m: RegExpExecArray | null
  while ((m = tableRegex.exec(schemaSql)) !== null) {
    const tableName = m[1].toLowerCase()
    const body = m[2]
    const uniqueCols = new Set<string>()

    const segments: string[] = []
    let depth = 0
    let start = 0
    for (let i = 0; i < body.length; i++) {
      const ch = body[i]
      if (ch === '(') depth++
      else if (ch === ')') depth--
      else if (ch === ',' && depth === 0) {
        segments.push(body.slice(start, i))
        start = i + 1
      }
    }
    segments.push(body.slice(start))

    for (const seg of segments) {
      const trimmed = seg.trim().replace(/--[^\n]*/g, '').trim()
      if (!trimmed) continue
      const upper = trimmed.toUpperCase()

      if (upper.startsWith('UNIQUE') || upper.startsWith('CONSTRAINT')) {
        const uMatch = trimmed.match(/UNIQUE\s*\(\s*([^)]+)\s*\)/i)
        if (uMatch) {
          const cols = uMatch[1].split(',').map(c => c.trim().replace(/["`]/g, '').toLowerCase())
          if (cols.length === 1) uniqueCols.add(cols[0])
        }
        continue
      }

      const colMatch = trimmed.match(/^["`]?(\w+)["`]?\s+/)
      if (colMatch && /\bUNIQUE\b/i.test(upper)) {
        uniqueCols.add(colMatch[1].toLowerCase())
      }
    }

    if (uniqueCols.size > 0) result.set(tableName, uniqueCols)
  }

  return result
}

interface EntitySetupBlock {
  entity: string
  scope: 'background' | 'scenario'
  scenarioName: string
  headerLine: number
  headers: string[]
  rowLines: number[]
  rows: string[][]
}

function extractEntitySetupBlocks(content: string): EntitySetupBlock[] {
  const lines = content.split('\n')
  const blocks: EntitySetupBlock[] = []
  let currentScope: 'background' | 'scenario' = 'scenario'
  let currentScenario = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (/^Background\s*:/i.test(trimmed)) {
      currentScope = 'background'
      currentScenario = 'Background'
      continue
    }
    if (/^(?:Scenario|Example)\s*:/i.test(trimmed)) {
      currentScope = 'scenario'
      currentScenario = trimmed.replace(/^(?:Scenario|Example)\s*:\s*/i, '').trim()
      continue
    }

    const stepMatch = line.match(/(?:Given|And|When|Then)\s+準備一個(\w+),\s*with\s+table\s*:\s*$/i)
    if (!stepMatch) continue
    const entity = stepMatch[1]

    let j = i + 1
    while (j < lines.length && lines[j].trim() === '') j++
    if (j >= lines.length || !lines[j].trim().startsWith('|')) continue

    const headerLineIdx = j
    const headers = lines[j].split('|').slice(1, -1).map(h => h.trim())

    const rowLines: number[] = []
    const rows: string[][] = []
    let k = j + 1
    while (k < lines.length && lines[k].trim().startsWith('|')) {
      const cells = lines[k].split('|').slice(1, -1).map(c => c.trim())
      rowLines.push(k + 1)
      rows.push(cells)
      k++
    }

    blocks.push({
      entity, scope: currentScope, scenarioName: currentScenario,
      headerLine: headerLineIdx + 1, headers, rowLines, rows,
    })
    i = k - 1
  }

  return blocks
}

function appendUniqueSuffix(value: string, index: number): string {
  if (!value || /^[<>$]/.test(value.trim())) return value
  if (/^\d+(\.\d+)?$/.test(value.trim())) return value

  const emailMatch = value.match(/^(.+)@(.+)$/)
  if (emailMatch) {
    return `${emailMatch[1]}+s${index}@${emailMatch[2]}`
  }
  return `${value}_s${index}`
}

function toSnake(s: string): string {
  return s.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()
}

function dedupSingleFeature(
  featureName: string,
  content: string,
  uniqueBySchema: Map<string, Set<string>>,
  entityToTable: Map<string, string>,
): { fixed: string | null; changes: UniqueDedupChange[] } {
  const blocks = extractEntitySetupBlocks(content)
  if (blocks.length === 0) return { fixed: null, changes: [] }

  const changes: UniqueDedupChange[] = []
  const lines = content.split('\n')

  const groupedByScope = new Map<string, EntitySetupBlock[]>()
  for (const b of blocks) {
    const key = `${b.scope}:${b.scenarioName}`
    if (!groupedByScope.has(key)) groupedByScope.set(key, [])
    groupedByScope.get(key)!.push(b)
  }

  for (const [, scopeBlocks] of groupedByScope) {
    const usedValues = new Map<string, Map<string, string>>()

    for (const block of scopeBlocks) {
      const entityLower = block.entity.toLowerCase()
      const snake = toSnake(block.entity)
      // 試多種對映：mapping yaml > snake_case > snake + 's' (plural)
      // 多數 schema 用複數命名（users, posts），entity 多用單數（User, Post）
      const candidates = [
        entityToTable.get(entityLower),
        snake,
        snake + 's',
        snake.endsWith('y') ? snake.slice(0, -1) + 'ies' : null,
      ].filter(Boolean) as string[]
      let uniqueCols: Set<string> | undefined
      for (const t of candidates) {
        const cols = uniqueBySchema.get(t.toLowerCase())
        if (cols && cols.size > 0) { uniqueCols = cols; break }
      }
      if (!uniqueCols || uniqueCols.size === 0) continue

      const uniqueHeaderIdxs: Array<{ idx: number; colName: string }> = []
      for (let i = 0; i < block.headers.length; i++) {
        const h = block.headers[i].replace(/^[<>]/, '')
        const hLower = h.toLowerCase()
        const hSnake = toSnake(h)
        if (uniqueCols.has(hLower) || uniqueCols.has(hSnake)) {
          uniqueHeaderIdxs.push({ idx: i, colName: hLower })
        }
      }
      if (uniqueHeaderIdxs.length === 0) continue

      const entityKey = block.entity.toLowerCase()
      if (!usedValues.has(entityKey)) usedValues.set(entityKey, new Map())
      const entitySeen = usedValues.get(entityKey)!

      for (let r = 0; r < block.rows.length; r++) {
        const row = block.rows[r]
        const lineNum = block.rowLines[r]

        for (const { idx, colName } of uniqueHeaderIdxs) {
          if (idx >= row.length) continue
          const val = row[idx]
          if (!val || /^[<>$]/.test(val.trim())) continue

          const seenKey = `${colName}|${val}`
          const sameSeen = entitySeen.get(seenKey)
          if (!sameSeen) {
            entitySeen.set(seenKey, val)
            continue
          }

          let suffixIdx = 2
          let newVal = appendUniqueSuffix(val, suffixIdx)
          while (entitySeen.has(`${colName}|${newVal}`)) {
            suffixIdx++
            newVal = appendUniqueSuffix(val, suffixIdx)
          }
          if (newVal === val) continue

          entitySeen.set(`${colName}|${newVal}`, newVal)

          const originalLine = lines[lineNum - 1]
          const cells = originalLine.split('|')
          const cellIdx = idx + 1
          if (cellIdx < cells.length) {
            const oldCell = cells[cellIdx]
            const leadingWs = oldCell.match(/^\s*/)?.[0] ?? ''
            const trailingWs = oldCell.match(/\s*$/)?.[0] ?? ''
            cells[cellIdx] = `${leadingWs}${newVal}${trailingWs}`
            lines[lineNum - 1] = cells.join('|')

            changes.push({
              featureName, entity: block.entity, column: colName,
              scope: block.scope, originalValue: val, newValue: newVal,
              line: lineNum,
            })
          }
        }
      }
    }
  }

  if (changes.length === 0) return { fixed: null, changes: [] }
  return { fixed: lines.join('\n'), changes }
}

export function dedupUniqueColumnValuesInFeatures(
  features: Array<{ name?: string; actionName: string; content: string }>,
  schemaSql: string,
  entityMappingYaml?: string,
): UniqueDedupResult {
  const fixedFeatures = new Map<string, string>()
  const allChanges: UniqueDedupChange[] = []

  if (!schemaSql || !schemaSql.trim()) return { fixedFeatures, changes: allChanges }

  let uniqueBySchema: Map<string, Set<string>>
  try {
    uniqueBySchema = extractUniqueColumnsBySchema(schemaSql)
  } catch (e) {
    logger.warn({ err: e }, 'schemaSql 解析失敗，跳過 unique dedup')
    return { fixedFeatures, changes: allChanges }
  }
  if (uniqueBySchema.size === 0) return { fixedFeatures, changes: allChanges }

  const entityToTable = new Map<string, string>()
  if (entityMappingYaml) {
    const lineRegex = /^\s*(\w+):\s*(\w+)\s*$/gm
    let m: RegExpExecArray | null
    while ((m = lineRegex.exec(entityMappingYaml)) !== null) {
      entityToTable.set(m[1].toLowerCase(), m[2])
    }
  }

  for (const feature of features) {
    const featureName = feature.name || feature.actionName
    const result = dedupSingleFeature(featureName, feature.content, uniqueBySchema, entityToTable)
    if (result.fixed !== null) {
      fixedFeatures.set(featureName, result.fixed)
      allChanges.push(...result.changes)
    }
  }

  return { fixedFeatures, changes: allChanges }
}
