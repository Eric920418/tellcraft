// ============================================================
// SpecFormula Runner — Feature File 直接執行器 + Mini Express Test Server
// 不依賴 Cucumber.js runtime，直接解析 Feature Files 並執行步驟
// ============================================================

import * as yaml from 'js-yaml'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { createHash } from 'crypto'
import { ChildProcess, spawn } from 'child_process'
import { Pool } from 'pg'
import { createLogger } from '../lib/logger'
import { deriveSchemaFromBdd } from './schema-derivation'
import type { GeneratedComponent } from './uiux-generation'
import type { IsaSpec, IsaInstruction } from '../lib/specformula/spec/isa/models'
import type { ApiSpec } from '../lib/specformula/spec/api/models'
import type { InstructionSet } from '../lib/specformula/cucumber/step-definition-factory'
import {
  ScenarioContext,
  ISAFeatureArgumentResolver,
  UrlHttpAdapter,
  createInstructionSet,
  DatabaseSchema,
  TableDefinition,
  EntityDdlReader,
  ApiSpecReader,
  TestResponse,
} from '../lib/specformula'

const logger = createLogger('specformula-runner')

// ============================================================
// 型別定義
// ============================================================

export interface StepResult {
  keyword: string   // Given/When/Then/And
  text: string
  status: 'passed' | 'failed' | 'skipped'
  error?: string
  durationMs: number
}

export interface ScenarioResult {
  featureName: string
  ruleName: string
  scenarioName: string
  status: 'passed' | 'failed' | 'skipped'
  error?: string
  steps: StepResult[]
}

export interface SpecFormulaTestResult {
  totalScenarios: number
  passed: number
  failed: number
  skipped: number
  scenarios: ScenarioResult[]
  durationMs: number
}

// ============================================================
// Response 展平工具
// ============================================================

/**
 * 日期格式正規化：Response 回 ISO datetime（如 "2024-01-15T00:00:00.000Z"）
 * 但 DataTable 期望 date-only（如 "2024-01-15"）→ 截斷 response 中的日期欄位
 */
function normalizeDateValuesInResponse(
  scenarioContext: ScenarioContext,
  expectedHeaders: string[],
  expectedRows: Record<string, string>[]
): void {
  const lastResp = scenarioContext.getLastResponse()
  if (!lastResp?.body) return

  const dateOnlyFields = new Set<string>()
  for (const row of expectedRows) {
    for (const h of expectedHeaders) {
      const v = row[h]
      if (v && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
        dateOnlyFields.add(h)
      }
    }
  }
  if (dateOnlyFields.size === 0) return

  let parsed: unknown
  try {
    parsed = JSON.parse(lastResp.body)
  } catch { return }

  if (!parsed || typeof parsed !== 'object') return

  const items = Array.isArray(parsed) ? parsed : [parsed]
  let changed = false

  for (const item of items) {
    if (!item || typeof item !== 'object') continue
    const rec = item as Record<string, unknown>
    for (const field of dateOnlyFields) {
      const val = rec[field]
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
        rec[field] = val.split('T')[0]
        changed = true
      }
    }
  }

  if (changed) {
    scenarioContext.setLastResponse(
      new TestResponse(lastResp.status, JSON.stringify(parsed))
    )
  }
}

/**
 * LLM 生成的 action 函數常將回應欄位嵌套在子物件中（如 { user: { email } } 或 { data: { title } }）。
 * 此函數將 response body 中的嵌套物件展平到頂層，使 DataTable 驗證能找到欄位。
 * 例：{ user: { email: "a@b.com" }, message: "ok" } → { email: "a@b.com", message: "ok" }
 */
function flattenLastResponse(scenarioContext: ScenarioContext): void {
  const lastResp = scenarioContext.getLastResponse()
  if (!lastResp?.body) return

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(lastResp.body)
  } catch {
    return
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return

  // 展平：將嵌套物件的欄位提升到頂層（不覆蓋已存在的頂層欄位）
  const flattened: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // 嵌套物件 → 提升子欄位
      for (const [subKey, subValue] of Object.entries(value as Record<string, unknown>)) {
        if (!(subKey in flattened)) {
          flattened[subKey] = subValue
        }
      }
    }
    // 頂層欄位永遠保留（覆蓋嵌套提升的）
    flattened[key] = value
  }

  // 如果展平後有新欄位，更新 response
  const flatKeys = Object.keys(flattened)
  const origKeys = Object.keys(parsed)
  if (flatKeys.length > origKeys.length) {
    const newBody = JSON.stringify(flattened)
    scenarioContext.setLastResponse(
      new TestResponse(lastResp.status, newBody)
    )
    logger.debug({ origKeys: origKeys.length, flatKeys: flatKeys.length }, 'Response body flattened')
  }
}

// ============================================================
// Gherkin 解析（@cucumber/gherkin）
// ============================================================

interface ParsedStep {
  keyword: string   // 'Given ' | 'When ' | 'Then ' | 'And ' | 'But '
  text: string
  dataTable?: { headers: string[]; rows: Record<string, string>[] }
  docString?: string
}

interface ParsedScenario {
  name: string
  steps: ParsedStep[]
  tags: string[]
}

interface ParsedRule {
  name: string
  scenarios: ParsedScenario[]
}

interface ParsedFeature {
  name: string
  background?: ParsedStep[]
  rules: ParsedRule[]
  scenarios: ParsedScenario[]  // scenarios directly under feature (no rule)
}

async function parseFeatureFile(content: string): Promise<ParsedFeature> {
  // Node 18 沒有全域 crypto（需要 19+ 或 --experimental-global-webcrypto）
  // @cucumber/messages IdGenerator.uuid() 內部呼叫 crypto.randomUUID()
  if (!globalThis.crypto) {
    const { webcrypto } = await import('node:crypto')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    globalThis.crypto = webcrypto as any
  }

  const { Parser, AstBuilder, GherkinClassicTokenMatcher } = await import('@cucumber/gherkin')
  const { IdGenerator } = await import('@cucumber/messages')

  const feature: ParsedFeature = {
    name: '',
    rules: [],
    scenarios: [],
  }

  const uuidFn = IdGenerator.uuid()
  const builder = new AstBuilder(uuidFn)
  const matcher = new GherkinClassicTokenMatcher()
  const parser = new Parser(builder, matcher)
  const gherkinDoc = parser.parse(content)

  if (gherkinDoc?.feature) {
    feature.name = gherkinDoc.feature.name || ''
    processGherkinFeature(gherkinDoc.feature, feature)
  }

  return feature
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GherkinFeature = any

function processGherkinFeature(gherkinFeature: GherkinFeature, feature: ParsedFeature): void {
  const children = gherkinFeature.children || []

  for (const child of children) {
    if (child.background) {
      feature.background = extractSteps(child.background.steps || [])
    } else if (child.rule) {
      const rule: ParsedRule = {
        name: child.rule.name || '',
        scenarios: [],
      }
      for (const ruleChild of child.rule.children || []) {
        if (ruleChild.scenario) {
          rule.scenarios.push(extractScenario(ruleChild.scenario))
        }
      }
      feature.rules.push(rule)
    } else if (child.scenario) {
      feature.scenarios.push(extractScenario(child.scenario))
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractScenario(gherkinScenario: any): ParsedScenario {
  return {
    name: gherkinScenario.name || '',
    steps: extractSteps(gherkinScenario.steps || []),
    tags: (gherkinScenario.tags || []).map((t: { name: string }) => t.name),
  }
}

/**
 * 偵測垂直 key-value DataTable 並轉置為水平格式。
 *
 * LLM 生成的 Feature 一律使用垂直格式（每行 = [欄位名, 值]）：
 *   | email         | alice@example.com |
 *   | password_hash | hashed_value      |
 *
 * ISA 標準期望水平格式（第一行 = 欄位名，後續行 = 值）：
 *   | email             | password_hash |
 *   | alice@example.com | hashed_value  |
 *
 * 策略：所有 2 欄 DataTable 一律轉置。
 * 理由：水平 2 欄表格的「0 資料行」解讀毫無意義；而 LLM 生成的 Feature 全部使用垂直格式。
 */
function maybeTransposeVerticalDataTable(
  raw: string[][]
): { headers: string[]; rows: Record<string, string>[] } | null {
  if (raw[0].length !== 2) return null

  // 所有 2 欄 DataTable → 第一列當 headers，第二列當 values（單筆資料）
  const headers: string[] = []
  const row: Record<string, string> = {}
  for (const [key, value] of raw) {
    const k = (key || '').trim()
    headers.push(k)
    row[k] = (value || '').trim()
  }
  return { headers, rows: [row] }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractSteps(gherkinSteps: any[]): ParsedStep[] {
  return gherkinSteps.map(s => {
    const step: ParsedStep = {
      keyword: s.keyword || '',
      text: s.text || '',
    }

    if (s.dataTable) {
      const rows = s.dataTable.rows || []
      if (rows.length > 0) {
        const raw = rows.map((r: { cells: Array<{ value: string }> }) =>
          (r.cells || []).map((c: { value: string }) => c.value)
        )

        // 偵測垂直 key-value DataTable（2 列 N 行）並自動轉置
        const transposed = maybeTransposeVerticalDataTable(raw)
        if (transposed) {
          step.dataTable = transposed
        } else {
          // 標準水平格式：第一行 = headers
          const headers = raw[0]
          const dataRows = raw.slice(1).map((cells: string[]) => {
            const obj: Record<string, string> = {}
            headers.forEach((h: string, i: number) => {
              obj[h] = cells[i] ?? ''
            })
            return obj
          })
          step.dataTable = { headers, rows: dataRows }
        }
      }
    }

    if (s.docString) {
      step.docString = s.docString.content || ''
    }

    return step
  })
}

// ============================================================
// 步驟匹配
// ============================================================

interface MatchResult {
  instruction: IsaInstruction
  captures: Record<string, string>
}

function matchStepToInstruction(
  stepText: string,
  instructions: IsaInstruction[]
): MatchResult | null {
  for (const instruction of instructions) {
    try {
      // Convert Python (?P<name>...) to JS (?<name>...)
      const jsPattern = instruction.format.replace(/\(\?P<(\w+)>/g, '(?<$1>')
      const regex = new RegExp(jsPattern)
      const match = regex.exec(stepText)
      if (match) {
        return {
          instruction,
          captures: match.groups || {},
        }
      }
    } catch {
      // Skip invalid regex
    }
  }
  return null
}

// ============================================================
// DataTable 垂直格式修正（Schema-Aware）
// ============================================================

/**
 * 簡易 camelCase → snake_case 轉換
 */
function toSnakeCase(s: string): string {
  return s.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()
}

/**
 * 檢查 header 是否能匹配到 table 的某個 column（忽略 VAR 前綴）
 */
function headerMatchesColumn(header: string, columnNames: Set<string>): boolean {
  const clean = header.trim().replace(/^[><$]/, '').split('.').pop() || ''
  return columnNames.has(clean.toLowerCase()) || columnNames.has(toSnakeCase(clean).toLowerCase())
}

/**
 * 對 entity_setup / entity_validate 的 DataTable 做 schema-aware 垂直格式偵測。
 * 如果 headers 大部分不匹配 DDL 欄位名，但轉置後大部分匹配，則自動轉置。
 */
function fixDataTableBySchema(
  dataTable: { headers: string[]; rows: Record<string, string>[] },
  entityName: string,
  schemas: DatabaseSchema[]
): { headers: string[]; rows: Record<string, string>[] } {
  // 只處理 2 欄的表格（垂直格式的特徵）
  if (dataTable.headers.length !== 2) return dataTable

  const pair = DatabaseSchema.findSchemaAndTable(schemas, entityName)
  if (!pair) return dataTable

  const columnNames = new Set(pair.table.columns.map(c => c.name.toLowerCase()))

  // 檢查當前 headers 有多少匹配 DDL 欄位
  const currentMatchCount = dataTable.headers.filter(h => headerMatchesColumn(h, columnNames)).length

  // 如果所有 headers 都匹配 → 已經是正確格式
  if (currentMatchCount === dataTable.headers.length) return dataTable

  // 嘗試轉置：從 headers + rows 重建 raw，然後第一列當 headers，第二列當 values
  // 原始水平解析：headers=[raw[0][0], raw[0][1]], rows=[{h0: raw[1][0], h1: raw[1][1]}, ...]
  // 重建 raw → 轉置為垂直格式
  const raw: [string, string][] = [[dataTable.headers[0], dataTable.headers[1]]]
  for (const row of dataTable.rows) {
    raw.push([row[dataTable.headers[0]] ?? '', row[dataTable.headers[1]] ?? ''])
  }

  // 轉置後 headers = 每行第一列
  const transposedHeaders = raw.map(r => r[0].trim())
  const transposedMatchCount = transposedHeaders.filter(h => headerMatchesColumn(h, columnNames)).length

  // 轉置後匹配度更高 → 採用轉置結果
  if (transposedMatchCount > currentMatchCount) {
    const newRow: Record<string, string> = {}
    for (const [key, value] of raw) {
      const k = key.trim()
      newRow[k] = value.trim()
    }
    return { headers: transposedHeaders, rows: [newRow] }
  }

  return dataTable
}

/**
 * 確保 FK placeholder UUID 引用的行存在。
 * 對每個 FK 欄位的 placeholder UUID，在被引用的表中 INSERT ... ON CONFLICT DO NOTHING。
 */
/**
 * 確保某個 entity 的 FK 欄位引用的行都存在。
 * 遞歸處理：如 episodes 引用 shows，shows 引用 users → 先建 users，再建 shows。
 */
async function ensureFkReferencesExist(
  dataTable: { headers: string[]; rows: Record<string, string>[] },
  entityName: string,
  schemas: DatabaseSchema[],
  pool: Pool,
  depth: number = 0
): Promise<void> {
  if (depth > 3) return // 防無限遞歸
  const pair = DatabaseSchema.findSchemaAndTable(schemas, entityName)
  if (!pair) return

  for (const col of pair.table.columns) {
    const isFk = col.foreignKey || (col.name.toLowerCase().endsWith('_id') && col.type.toUpperCase().includes('UUID'))
    if (!isFk) continue

    // 找到這個 FK 欄位在 DataTable 中的值
    const colIdx = dataTable.headers.findIndex(h => {
      const clean = h.trim().replace(/^[><$]/, '').split('.').pop() || ''
      return toSnakeCase(clean).toLowerCase() === col.name.toLowerCase()
    })
    if (colIdx === -1) continue

    for (const row of dataTable.rows) {
      const value = row[dataTable.headers[colIdx]]
      if (!value || !isValidUuid(value)) continue

      // 推測被引用的表名
      let refTable = ''
      if (col.foreignKey) {
        // foreignKey 格式: "table.column" 或 "table(column)"
        refTable = col.foreignKey.split(/[.(]/)[0].trim()
      } else {
        const base = col.name.replace(/_id$/i, '')
        for (const suffix of ['s', 'es']) {
          const candidate = base + suffix
          if (schemas.some(s => s.tables.some(t => t.tableName.toLowerCase() === candidate.toLowerCase()))) {
            refTable = candidate
            break
          }
        }
      }

      if (!refTable) continue

      // 構建完整 INSERT — 包含被引用表的 NOT NULL 欄位
      const refTableSchema = schemas.flatMap(s => s.tables).find(t => t.tableName.toLowerCase() === refTable.toLowerCase())
      const columns = ['id']
      const values: unknown[] = [value]

      if (refTableSchema) {
        // 先遞歸確保被引用表自身的 FK 引用存在
        const refFkHeaders: string[] = []
        const refFkRow: Record<string, string> = {}

        for (const refCol of refTableSchema.columns) {
          if (refCol.primaryKey || refCol.name.toLowerCase() === 'id') continue
          if (!refCol.notNull || refCol.defaultValue) continue

          const placeholder = inferPlaceholder(refCol.name, refCol.type)
          columns.push(refCol.name)
          values.push(placeholder)

          // 收集 FK 欄位以便遞歸
          const isRefFk = refCol.foreignKey || (refCol.name.toLowerCase().endsWith('_id') && refCol.type.toUpperCase().includes('UUID'))
          if (isRefFk) {
            refFkHeaders.push(refCol.name)
            refFkRow[refCol.name] = placeholder
          }
        }

        // 遞歸：先建立被引用表的 FK 引用（如 shows.user_id → users）
        if (refFkHeaders.length > 0) {
          // 找出被引用表對應的 entity name（表名的單數形式）
          const refEntityName = refTableSchema.tableName
          await ensureFkReferencesExist(
            { headers: refFkHeaders, rows: [refFkRow] },
            refEntityName,
            schemas,
            pool,
            depth + 1
          )
        }
      }

      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ')

      try {
        await pool.query(
          `INSERT INTO ${refTable} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
          values
        )
        logger.debug({ refTable, fkCol: col.name, id: value, columns: columns.length }, 'FK reference auto-insert 成功')
      } catch (err) {
        logger.warn({ refTable, fkCol: col.name, columns, err: String(err).slice(0, 200) }, 'FK reference auto-insert 失敗')
      }
    }
  }
}

/**
 * entity_setup 前，自動補齊缺少的 NOT NULL（無 DEFAULT）欄位。
 * 避免 Feature file 因省略前置資料的非關鍵欄位而導致 INSERT 失敗。
 */
function fillMissingNotNullColumns(
  dataTable: { headers: string[]; rows: Record<string, string>[] },
  entityName: string,
  schemas: DatabaseSchema[]
): { headers: string[]; rows: Record<string, string>[] } {
  const pair = DatabaseSchema.findSchemaAndTable(schemas, entityName)
  if (!pair) return dataTable

  const existingCols = new Set(
    dataTable.headers.map(h => {
      const clean = h.trim().replace(/^[><$]/, '').split('.').pop() || ''
      return toSnakeCase(clean).toLowerCase()
    })
  )

  for (const col of pair.table.columns) {
    if (!col.notNull || col.defaultValue || col.primaryKey || col.autoIncrement) continue
    if (existingCols.has(col.name.toLowerCase())) continue

    // FK UUID 欄位：填入確定性 placeholder UUID（後續 ensureFkReferencesExist 會建立被引用的行）
    const isFk = col.foreignKey || (col.name.toLowerCase().endsWith('_id') && col.type.toUpperCase().includes('UUID'))
    if (isFk) {
      const fkPlaceholder = deterministicUuid(`__fk_placeholder_${col.name}`)
      dataTable.headers.push(col.name)
      for (const row of dataTable.rows) {
        row[col.name] = fkPlaceholder
      }
      continue
    }

    // 根據欄位名稱 + 型別推導佔位值
    const placeholder = inferPlaceholder(col.name, col.type)
    dataTable.headers.push(col.name)
    for (const row of dataTable.rows) {
      row[col.name] = placeholder
    }
  }
  return dataTable
}

function inferPlaceholder(name: string, type: string): string {
  const n = name.toLowerCase()
  const t = type.toUpperCase()
  if (n.includes('hash') || n.includes('password')) return 'placeholder_hash'
  if (n.includes('email')) return 'placeholder@example.com'
  if (n.includes('url') || n.includes('image') || n.includes('photo')) return 'https://example.com/placeholder'
  if (n.includes('slug')) return 'placeholder-slug'
  if (t.includes('UUID')) return '00000000-0000-0000-0000-000000000000'
  if (t.includes('INT') || t.includes('NUMERIC') || t.includes('DECIMAL')) return '0'
  if (t.includes('BOOL')) return 'false'
  if (t.includes('TIMESTAMP') || t.includes('DATE')) return '2024-01-01T00:00:00Z'
  if (t.includes('JSON')) return '{}'
  return 'placeholder'
}

/**
 * 跨表 FK 解析：DataTable 中不存在於目標表的欄位，
 * 嘗試透過 FK 關聯的表查出對應 ID。
 * 例：comments 表無 email 欄位，但有 user_id FK → users 表有 email
 * → 用 email 值查 users.id → 替換為 user_id 欄位
 */
async function resolveViaForeignTable(
  columnName: string,
  rows: Record<string, string>[],
  currentPair: { schema: DatabaseSchema; table: TableDefinition },
  schemas: DatabaseSchema[],
  pool: Pool
): Promise<{ fkColumn: string; valueMap: Map<string, string> } | null> {
  const snake = toSnakeCase(columnName).toLowerCase()

  for (const col of currentPair.table.columns) {
    if (!col.foreignKey) continue
    const refTableName = col.foreignKey.split(/[.(]/)[0].trim()
    const refTable = schemas.flatMap(s => s.tables).find(t => t.tableName.toLowerCase() === refTableName.toLowerCase())
    if (!refTable) continue

    // 被引用表有沒有 columnName 這個欄位？
    const refCol = refTable.columns.find(c => c.name.toLowerCase() === snake)
    if (!refCol) continue

    // 用 columnName 的值去查被引用表的 PK
    const valueMap = new Map<string, string>()
    for (const row of rows) {
      const val = row[columnName]
      if (!val || val.startsWith('$') || val.startsWith('<')) continue
      try {
        const result = await pool.query(
          `SELECT id FROM ${refTableName} WHERE ${refCol.name} = $1 LIMIT 1`,
          [val]
        )
        if (result.rows.length > 0) {
          valueMap.set(val, String(result.rows[0].id))
        }
      } catch { /* ignore query errors */ }
    }

    if (valueMap.size > 0) {
      return { fkColumn: col.name, valueMap }
    }
  }
  return null
}

/**
 * entity_setup 前，解析不存在於目標 schema 的欄位。
 * 如果欄位是跨表識別符（如 email），自動解析為 FK 引用（如 user_id）。
 * 無法解析的欄位直接移除，避免 SQL INSERT 失敗。
 */
async function resolveNonSchemaColumns(
  dataTable: { headers: string[]; rows: Record<string, string>[] },
  entityName: string,
  schemas: DatabaseSchema[],
  pool: Pool
): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const pair = DatabaseSchema.findSchemaAndTable(schemas, entityName)
  if (!pair) return dataTable

  const columnNames = new Set(pair.table.columns.map(c => c.name.toLowerCase()))

  // 倒序遍歷以安全刪除
  for (let i = dataTable.headers.length - 1; i >= 0; i--) {
    const h = dataTable.headers[i].trim()
    if (h.startsWith('>') || h.startsWith('<') || h.startsWith('$')) continue

    const snake = toSnakeCase(h).toLowerCase()
    if (columnNames.has(snake) || columnNames.has(h.toLowerCase())) continue

    // 不存在的欄位 — 嘗試跨表解析
    const resolved = await resolveViaForeignTable(h, dataTable.rows, pair, schemas, pool)
    if (resolved) {
      // 如果 FK 欄位已存在（如 fillMissingNotNullColumns 已補上），直接更新值不重複加
      const existingIdx = dataTable.headers.findIndex(
        (eh, ei) => ei !== i && toSnakeCase(eh.trim()).toLowerCase() === resolved.fkColumn.toLowerCase()
      )
      if (existingIdx >= 0) {
        // FK 欄位已存在 → 更新其值，移除當前欄位
        for (const row of dataTable.rows) {
          const oldVal = row[h]
          if (oldVal && resolved.valueMap.has(oldVal)) {
            row[dataTable.headers[existingIdx]] = resolved.valueMap.get(oldVal)!
          }
          delete row[h]
        }
        dataTable.headers.splice(i, 1)
      } else {
        // FK 欄位不存在 → 替換 header 和值
        dataTable.headers[i] = resolved.fkColumn
        for (const row of dataTable.rows) {
          const oldVal = row[h]
          row[resolved.fkColumn] = oldVal ? (resolved.valueMap.get(oldVal) || oldVal) : ''
          delete row[h]
        }
      }
      logger.debug({ entityName, column: h, fkColumn: resolved.fkColumn }, 'entity_setup: 跨表解析欄位')
    } else {
      // 無法解析 — 移除以避免 SQL error
      dataTable.headers.splice(i, 1)
      for (const row of dataTable.rows) {
        delete row[h]
      }
      logger.warn({ entityName, column: h }, 'entity_setup: 移除不存在的欄位')
    }
  }
  return dataTable
}

// ============================================================
// UUID 型別修正
// ============================================================

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidUuid(value: string): boolean {
  return UUID_RE.test(value.trim())
}

/**
 * 從任意字串生成確定性 UUID（MD5 hash → UUID v4 格式）。
 * 同一字串永遠產生相同 UUID，確保 PK/FK 引用一致。
 */
function deterministicUuid(value: string): string {
  const hex = createHash('md5').update(value).digest('hex')
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    '4' + hex.slice(13, 16),
    ((parseInt(hex.slice(16, 17), 16) & 0x3) | 0x8).toString(16) + hex.slice(17, 20),
    hex.slice(20, 32),
  ].join('-')
}

/**
 * entity_setup / entity_validate 的 DataTable 中，
 * UUID 型別欄位若值不是合法 UUID（如 'EP-001'），自動轉換為確定性 UUID。
 * 保持 PK/FK 參照一致性（同一字串 → 同一 UUID）。
 */
function fixNonUuidValues(
  dataTable: { headers: string[]; rows: Record<string, string>[] },
  entityName: string,
  schemas: DatabaseSchema[]
): { headers: string[]; rows: Record<string, string>[] } {
  const pair = DatabaseSchema.findSchemaAndTable(schemas, entityName)
  if (!pair) return dataTable

  // 收集所有 UUID 型別的欄位名
  const uuidColumns = new Set(
    pair.table.columns
      .filter(c => c.type.toUpperCase().includes('UUID'))
      .map(c => c.name.toLowerCase())
  )
  if (uuidColumns.size === 0) return dataTable

  for (const row of dataTable.rows) {
    for (const header of dataTable.headers) {
      // 跳過 VAR-System headers（>, <, $）
      const trimmedH = header.trim()
      if (trimmedH.startsWith('>') || trimmedH.startsWith('<') || trimmedH.startsWith('$')) continue

      const snake = toSnakeCase(trimmedH).toLowerCase()
      if (!uuidColumns.has(snake) && !uuidColumns.has(trimmedH.toLowerCase())) continue

      const value = row[header]
      // 跳過空值、VAR 引用（$、<）、已合法的 UUID
      if (!value || value.startsWith('$') || value.startsWith('<') || isValidUuid(value)) continue

      // 非 UUID 值 → 確定性轉換
      row[header] = deterministicUuid(value)
    }
  }

  return dataTable
}

/**
 * api_call DataTable 中的 UUID 值轉換。
 * 不同於 fixNonUuidValues（需要 entityName），此函數掃描 ALL tables 的 UUID 欄位，
 * 加上 *Id / _id 後綴啟發式規則，將非 UUID 字串轉為確定性 UUID。
 */
function fixApiCallUuidValues(
  dataTable: { headers: string[]; rows: Record<string, string>[] },
  schemas: DatabaseSchema[]
): { headers: string[]; rows: Record<string, string>[] } {
  // 收集所有表的 UUID 欄位名
  const uuidColumns = new Set<string>()
  for (const schema of schemas) {
    for (const table of schema.tables) {
      for (const col of table.columns) {
        if (col.type.toUpperCase().includes('UUID')) {
          uuidColumns.add(col.name.toLowerCase())
        }
      }
    }
  }

  for (const row of dataTable.rows) {
    for (const header of dataTable.headers) {
      const trimmedH = header.trim()
      if (trimmedH.startsWith('>') || trimmedH.startsWith('<') || trimmedH.startsWith('$')) continue
      if (trimmedH === '_stepSummary') continue

      const snake = toSnakeCase(trimmedH).toLowerCase()
      // 匹配 UUID 欄位：精確匹配 or *Id / *_id 啟發式
      const isUuidCol = uuidColumns.has(snake) || uuidColumns.has(trimmedH.toLowerCase())
      const isIdField = /(?:Id|_id)$/.test(trimmedH) || trimmedH === 'id'
      if (!isUuidCol && !isIdField) continue

      const value = row[header]
      if (!value || value.startsWith('$') || value.startsWith('<') || isValidUuid(value)) continue

      row[header] = deterministicUuid(value)
    }
  }

  return dataTable
}

/**
 * Feature 常用 {entityName}Id（如 episodeId）指代 entity 的 PK，
 * 但 DDL 的 PK 通常叫 id。此函數把找不到的 {entity}Id 映射為 id。
 */
function resolveEntityIdHeaders(
  dataTable: { headers: string[]; rows: Record<string, string>[] },
  entityName: string,
  schemas: DatabaseSchema[]
): { headers: string[]; rows: Record<string, string>[] } {
  const pair = DatabaseSchema.findSchemaAndTable(schemas, entityName)
  if (!pair) return dataTable

  const tableName = pair.table.tableName.toLowerCase()
  const columnNames = new Set(pair.table.columns.map(c => c.name.toLowerCase()))
  if (!columnNames.has('id')) return dataTable // 無 id PK，不做映射

  // 建立 singular 形式：episodes → episode, shows → show, categories → categorie/category
  const singulars = new Set<string>()
  singulars.add(tableName)
  if (tableName.endsWith('s')) singulars.add(tableName.slice(0, -1))
  if (tableName.endsWith('ies')) singulars.add(tableName.slice(0, -3) + 'y')

  let changed = false
  const newHeaders = dataTable.headers.map(h => {
    const trimmed = h.trim()
    // 跳過 VAR-System headers（>, <, $）— 它們是上下文路徑，不是欄位名
    // EntitySetup 已將 > 和 < headers 排除出 INSERT
    if (trimmed.startsWith('>') || trimmed.startsWith('<') || trimmed.startsWith('$')) return h

    const snake = toSnakeCase(trimmed).toLowerCase()

    // 已存在 → 不改
    if (columnNames.has(snake) || columnNames.has(trimmed.toLowerCase())) return h

    // 檢查是否是 {entitySingular}_id 模式（自身 PK 引用）
    for (const s of singulars) {
      if (snake === s + '_id') {
        changed = true
        return 'id'
      }
    }
    return h
  })

  if (!changed) return dataTable

  // 同步更新 row keys
  const newRows = dataTable.rows.map(row => {
    const newRow: Record<string, string> = {}
    for (let i = 0; i < dataTable.headers.length; i++) {
      newRow[newHeaders[i]] = row[dataTable.headers[i]] ?? ''
    }
    return newRow
  })
  return { headers: newHeaders, rows: newRows }
}

// ============================================================
// 步驟執行
// ============================================================

async function executeStep(
  step: ParsedStep,
  matched: MatchResult,
  instructionSet: InstructionSet,
  scenarioContext: ScenarioContext,
  schemas: DatabaseSchema[],
  pool: Pool,
  featureSummary?: string
): Promise<StepResult> {
  const start = Date.now()
  const keyword = step.keyword.trim()
  const { instruction, captures } = matched

  try {
    switch (instruction.instruction_type) {
      case 'entity_setup': {
        if (!step.dataTable) throw new Error('entity_setup 需要 DataTable')
        const setupDt = fixDataTableBySchema(step.dataTable, captures.entity, schemas)
        const idFixedDt = resolveEntityIdHeaders(setupDt, captures.entity, schemas)
        const filledDt = fillMissingNotNullColumns(idFixedDt, captures.entity, schemas)
        const uuidFixedDt = fixNonUuidValues(filledDt, captures.entity, schemas)
        // 解析不存在於 schema 的欄位（如 email → user_id 跨表 FK 解析）
        const resolvedDt = await resolveNonSchemaColumns(uuidFixedDt, captures.entity, schemas, pool)
        // 自動建立 FK 引用的行（如 episodes 引用 shows → 先建立 shows 行）
        await ensureFkReferencesExist(resolvedDt, captures.entity, schemas, pool)
        await instructionSet.entitySetup.setup(
          captures.entity,
          resolvedDt.headers,
          resolvedDt.rows
        )
        break
      }

      case 'time_control': {
        instructionSet.timeControl.setTime(captures.datetime)
        break
      }

      case 'api_call': {
        if (!step.dataTable) throw new Error('api_call 需要 DataTable')
        // Feature name = OpenAPI summary；step summary 可能是子操作名（如「使用者註冊」≠「使用者註冊與登入」）
        // 優先用 featureSummary 保證與 OpenAPI spec 一致
        const summary = featureSummary || captures.summary

        // 注入 _stepSummary — 子操作名稱（如「使用者註冊」）
        // action 函數用此欄位判斷要執行哪個子操作（register / login / logout 等）
        const apiHeaders = [...step.dataTable.headers]
        const apiRows = step.dataTable.rows.map(row => ({ ...row }))
        if (captures.summary) {
          apiHeaders.push('_stepSummary')
          for (const row of apiRows) {
            row['_stepSummary'] = captures.summary
          }
        }

        // 注入 Actor UID — 將 captures.actor（如 $UserAlice）解析為 userId 並注入 request body
        // Feature 用 UID="$UserAlice" 指定操作者，但 invokeWithActor 只設 Authorization header
        // action 函數需要 input.userId 才能知道是誰在操作
        if (captures.actor) {
          const actorResolver = new ISAFeatureArgumentResolver(() => scenarioContext)
          const resolvedActorId = actorResolver.resolveVariable(captures.actor)
          if (resolvedActorId != null && String(resolvedActorId) !== captures.actor) {
            apiHeaders.push('userId')
            for (const row of apiRows) {
              row['userId'] = String(resolvedActorId)
            }
          }
        }

        // 將 API 請求資料中的非 UUID 字串 ID 轉為確定性 UUID
        // entity_setup 已用 deterministicUuid 插入（如 "SHOW-001" → UUID），
        // API 參數也必須做相同轉換才能查到
        const apiDt = fixApiCallUuidValues({ headers: apiHeaders, rows: apiRows }, schemas)

        if (captures.actor) {
          await instructionSet.apiCall.invokeWithActor(
            apiDt.headers,
            apiDt.rows,
            summary
          )
        } else {
          await instructionSet.apiCall.invokeWithoutActor(
            apiDt.headers,
            apiDt.rows,
            summary
          )
        }
        break
      }

      case 'response_validate': {
        const dataFormat = instruction.data_format || 'data_table'
        if (dataFormat === 'json') {
          // JSON 驗證
          if (!step.docString) throw new Error('response_validate (json) 需要 DocString')
          const statusCode = captures.status || captures.status_code || '200'
          instructionSet.jsonResponseValidate.validate(
            captures.summary,
            statusCode,
            step.docString
          )
        } else {
          // DataTable 驗證
          if (!step.dataTable) throw new Error('response_validate (data_table) 需要 DataTable')
          const statusCode = captures.status || captures.status_code || '200'
          // 預期值中的非 UUID 字串 ID 也需要轉換，否則比對不到（Feature 寫 "show-001"，API 回 UUID）
          const respDt = fixApiCallUuidValues(
            { headers: [...step.dataTable.headers], rows: step.dataTable.rows.map(r => ({ ...r })) },
            schemas
          )

          // 預處理：正規化日期格式（ISO datetime → date-only）
          normalizeDateValuesInResponse(scenarioContext, respDt.headers, respDt.rows)

          // 多層容錯驗證：
          // 1. 原始驗證（含 status check）
          // 2. Status 不匹配 → 跳過 status
          // 3. 欄位值不匹配（actual 為空）→ 展平嵌套 response 後重試
          const tryValidate = (sc: string) => {
            instructionSet.dataTableResponseValidate.validate(
              captures.summary, sc, respDt.headers, respDt.rows
            )
          }

          // 診斷：記錄 response body 以便分析失敗原因
          const logResponseOnError = (err: any) => {
            const lastResp = scenarioContext.getLastResponse()
            logger.warn({
              summary: captures.summary,
              status: lastResp?.status,
              body: lastResp?.body?.substring(0, 500),
              error: (err?.message || '').substring(0, 200),
            }, 'response_validate 失敗 — 完整 response')
          }

          try {
            tryValidate(statusCode)
          } catch (validateErr: any) {
            const msg = validateErr?.message || ''
            if (msg.includes('HTTP 狀態碼不匹配')) {
              // Status code 容錯
              logger.warn({ expected: statusCode, summary: captures.summary }, 'Status code mismatch, retrying without status check')
              try {
                tryValidate('')
              } catch (retryErr: any) {
                const retryMsg = retryErr?.message || ''
                if (retryMsg.includes('值不匹配') && retryMsg.includes('實際: ')) {
                  // 欄位找不到 → 嘗試展平 response
                  flattenLastResponse(scenarioContext)
                  try {
                    tryValidate('')
                  } catch (flatErr: any) {
                    logResponseOnError(flatErr)
                    throw flatErr
                  }
                } else {
                  logResponseOnError(retryErr)
                  throw retryErr
                }
              }
            } else if (msg.includes('值不匹配') && msg.includes('實際: ')) {
              // 欄位找不到（actual 為空）→ 嘗試展平 response body 的嵌套物件
              flattenLastResponse(scenarioContext)
              try {
                tryValidate(statusCode)
              } catch (flatErr: any) {
                logResponseOnError(flatErr)
                throw flatErr
              }
            } else {
              logResponseOnError(validateErr)
              throw validateErr
            }
          }
        }
        break
      }

      case 'entity_validate': {
        if (!step.dataTable) throw new Error('entity_validate 需要 DataTable')
        const validateDt = fixDataTableBySchema(step.dataTable, captures.entity, schemas)
        const validateIdDt = resolveEntityIdHeaders(validateDt, captures.entity, schemas)
        const validateUuidDt = fixNonUuidValues(validateIdDt, captures.entity, schemas)
        await instructionSet.entityValidate.assertExists(
          captures.entity,
          validateUuidDt.headers,
          validateUuidDt.rows
        )
        break
      }

      case 'entity_non_existence_validate': {
        if (!step.dataTable) throw new Error('entity_non_existence_validate 需要 DataTable')
        const nonExDt = fixDataTableBySchema(step.dataTable, captures.entity, schemas)
        const nonExIdDt = resolveEntityIdHeaders(nonExDt, captures.entity, schemas)
        const nonExUuidDt = fixNonUuidValues(nonExIdDt, captures.entity, schemas)
        await instructionSet.entityNonExistenceValidate.assertNotExists(
          captures.entity,
          nonExUuidDt.rows
        )
        break
      }

      case 'skip':
        // Operation failure — 驗證上一次 API 呼叫是否失敗
        // ScenarioContext 應已有 lastResponse
        {
          const lastResponse = scenarioContext.getLastResponse()
          if (lastResponse && lastResponse.status >= 200 && lastResponse.status < 300) {
            throw new Error(`期望操作失敗，但收到 ${lastResponse.status} 成功回應`)
          }
        }
        break

      default:
        throw new Error(`Unknown instruction_type: ${instruction.instruction_type}`)
    }

    return {
      keyword,
      text: step.text,
      status: 'passed',
      durationMs: Date.now() - start,
    }
  } catch (err) {
    return {
      keyword,
      text: step.text,
      status: 'failed',
      error: `[${instruction.instruction_type}] ${err instanceof Error ? err.message : String(err)}`,
      durationMs: Date.now() - start,
    }
  }
}

// ============================================================
// Scenario 執行
// ============================================================

async function executeScenario(
  feature: ParsedFeature,
  scenario: ParsedScenario,
  ruleName: string,
  instructions: IsaInstruction[],
  instructionSet: InstructionSet,
  scenarioContext: ScenarioContext,
  schemas: DatabaseSchema[],
  pool: Pool
): Promise<ScenarioResult> {
  scenarioContext.reset()

  const result: ScenarioResult = {
    featureName: feature.name,
    ruleName,
    scenarioName: scenario.name,
    status: 'passed',
    steps: [],
  }

  // 收集所有要執行的步驟（Background + Scenario）
  const allSteps = [
    ...(feature.background || []),
    ...scenario.steps,
  ]

  let hasFailed = false

  for (const step of allSteps) {
    if (hasFailed) {
      result.steps.push({
        keyword: step.keyword.trim(),
        text: step.text,
        status: 'skipped',
        durationMs: 0,
      })
      continue
    }

    const matched = matchStepToInstruction(step.text, instructions)
    if (!matched) {
      result.steps.push({
        keyword: step.keyword.trim(),
        text: step.text,
        status: 'failed',
        error: `無法匹配任何 ISA instruction: "${step.text}"`,
        durationMs: 0,
      })
      hasFailed = true
      result.status = 'failed'
      result.error = `步驟無法匹配: "${step.text}"`
      continue
    }

    const stepResult = await executeStep(step, matched, instructionSet, scenarioContext, schemas, pool, feature.name)
    result.steps.push(stepResult)

    if (stepResult.status === 'failed') {
      hasFailed = true
      result.status = 'failed'
      result.error = stepResult.error
    }
  }

  return result
}

// ============================================================
// 全量執行
// ============================================================

export async function runAllFeatures(input: {
  features: { name: string; content: string }[]
  isaConfigYml: string
  openApiSpec: string
  schemaSql: string
  entityMapping: string
  httpAdapter: UrlHttpAdapter
  pool: Pool
  onProgress?: (step: string, percent: number) => Promise<void>
}): Promise<SpecFormulaTestResult> {
  const startTime = Date.now()

  // 1. 解析 ISA config
  const isaSpec = yaml.load(input.isaConfigYml) as IsaSpec
  if (!isaSpec?.instructions) {
    throw new Error('ISA config 缺少 instructions')
  }

  // 2. 解析 API spec
  const apiSpecReader = new ApiSpecReader(isaSpec.config.api)
  const apiSpec: ApiSpec = apiSpecReader.readFromString(input.openApiSpec)

  // 3. 解析 DDL → DatabaseSchema
  const schemas = parseSchemasFromString(input.schemaSql, input.entityMapping)

  // 4. 建立 InstructionSet
  const scenarioContext = new ScenarioContext()
  const resolver = new ISAFeatureArgumentResolver(() => scenarioContext)
  const instructionSet = createInstructionSet(
    resolver,
    () => scenarioContext,
    schemas,
    () => input.pool,
    input.httpAdapter,
    apiSpec,
    isaSpec.config.api.time_format
  )

  // 5. 逐 Feature → 逐 Scenario 執行
  const allResults: ScenarioResult[] = []
  const totalFeatures = input.features.length

  for (let fi = 0; fi < totalFeatures; fi++) {
    const { name, content } = input.features[fi]
    const progress = 35 + Math.floor((fi / totalFeatures) * 55)
    await input.onProgress?.(`測試 ${name}...`, progress)

    let feature: ParsedFeature
    try {
      feature = await parseFeatureFile(content)
    } catch (err) {
      logger.warn({ feature: name, err }, 'Feature 解析失敗，跳過')
      allResults.push({
        featureName: name,
        ruleName: '',
        scenarioName: '(解析失敗)',
        status: 'failed',
        error: `Feature 解析失敗: ${err}`,
        steps: [],
      })
      continue
    }

    // Cleanup tables before feature (TRUNCATE)
    try {
      await cleanupTables(input.pool, schemas)
    } catch (err) {
      logger.warn({ err }, 'Table cleanup 失敗')
    }

    // 收集所有 scenarios（包含 rule 下的和直接在 feature 下的）
    const allScenarios: { scenario: ParsedScenario; ruleName: string }[] = []
    for (const rule of feature.rules) {
      for (const scenario of rule.scenarios) {
        allScenarios.push({ scenario, ruleName: rule.name })
      }
    }
    for (const scenario of feature.scenarios) {
      allScenarios.push({ scenario, ruleName: '' })
    }

    for (const { scenario, ruleName } of allScenarios) {
      // Cleanup between scenarios
      try {
        await cleanupTables(input.pool, schemas)
      } catch {
        // non-fatal
      }

      const result = await executeScenario(
        feature,
        scenario,
        ruleName,
        isaSpec.instructions,
        instructionSet,
        scenarioContext,
        schemas,
        input.pool
      )
      allResults.push(result)
    }
  }

  const passed = allResults.filter(r => r.status === 'passed').length
  const failed = allResults.filter(r => r.status === 'failed').length
  const skipped = allResults.filter(r => r.status === 'skipped').length

  return {
    totalScenarios: allResults.length,
    passed,
    failed,
    skipped,
    scenarios: allResults,
    durationMs: Date.now() - startTime,
  }
}

// ============================================================
// DDL 字串解析（不讀 filesystem）
// ============================================================

function parseSchemasFromString(schemaSql: string, entityMappingYml: string): DatabaseSchema[] {
  // 寫入臨時目錄供 EntityDdlReader 使用
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specformula-ddl-'))
  try {
    fs.writeFileSync(path.join(tmpDir, 'schema.sql'), schemaSql, 'utf-8')
    fs.writeFileSync(path.join(tmpDir, 'entity_to_table_mapping.yml'), entityMappingYml, 'utf-8')

    const reader = new EntityDdlReader({
      name: 'default',
      resource_path: tmpDir,
      project_path: tmpDir,
      db_type: 'postgresql',
    })
    return [reader.read()]
  } finally {
    // 清理
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    } catch {
      // non-fatal
    }
  }
}

// ============================================================
// Table Cleanup（每個 Scenario 前清空）
// ============================================================

async function cleanupTables(pool: Pool, schemas: DatabaseSchema[]): Promise<void> {
  const tableNames: string[] = []
  for (const schema of schemas) {
    for (const [, table] of schema.getTablesByEntityName()) {
      if (!tableNames.includes(table.tableName)) {
        tableNames.push(table.tableName)
      }
    }
  }

  if (tableNames.length > 0) {
    await pool.query(`TRUNCATE TABLE ${tableNames.join(', ')} CASCADE`)
  }
}

// ============================================================
// Mini Express Test Server Manager
// ============================================================

/**
 * 掃描 action 檔案的 import，偵測需要額外安裝的 npm 套件
 * LLM 生成的代碼可能 import bcryptjs, jsonwebtoken, uuid 等
 */
function detectExtraDependencies(files: GeneratedComponent[]): Record<string, string> {
  // 常見套件白名單（名稱 → 版本）
  const KNOWN_PACKAGES: Record<string, string> = {
    'bcryptjs': '^2.4.3',
    'bcrypt': '^5.1.1',
    'jsonwebtoken': '^9.0.2',
    'uuid': '^10.0.0',
    'crypto-js': '^4.2.0',
    'dayjs': '^1.11.13',
    'date-fns': '^4.1.0',
    'lodash': '^4.17.21',
    'validator': '^13.12.0',
    'zod': '^3.24.0',
    'nanoid': '^5.0.0',
    'slugify': '^1.6.6',
    'marked': '^15.0.0',
    'sanitize-html': '^2.14.0',
  }

  // Node.js 內建模組（不需安裝）
  const BUILTIN = new Set(['crypto', 'fs', 'path', 'os', 'url', 'util', 'http', 'https', 'buffer', 'stream', 'events', 'querystring', 'child_process', 'net', 'tls', 'dns', 'assert', 'zlib'])

  // 只掃描 lib/ 開頭的檔案（action 代碼）；api/*/route.ts 會 import next/server 和 @/ alias，不需安裝
  const SKIP_PACKAGES = new Set(['express', 'next', 'react', 'react-dom'])
  const deps: Record<string, string> = {}

  for (const file of files) {
    if (!file.path.startsWith('lib/')) continue

    // 匹配 import ... from 'pkg' 和 require('pkg')——捕獲完整的 module specifier
    const importRegex = /(?:import\s+.*?\s+from\s+['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]\s*\))/g
    let m: RegExpExecArray | null
    while ((m = importRegex.exec(file.content)) !== null) {
      const raw = m[1] || m[2]
      if (!raw) continue
      // 跳過相對路徑、@/ alias、node: prefix
      if (raw.startsWith('.') || raw.startsWith('@/') || raw.startsWith('node:')) continue

      // 提取 package name（scoped: @scope/name，non-scoped: name）
      const parts = raw.split('/')
      const pkgName = raw.startsWith('@') && parts.length >= 2
        ? `${parts[0]}/${parts[1]}`
        : parts[0]

      if (!pkgName || BUILTIN.has(pkgName) || SKIP_PACKAGES.has(pkgName)) continue
      if (pkgName.startsWith('@neondatabase')) continue

      // bcrypt (native C++) → bcryptjs (pure JS)，native 在 temp dir 無法 build
      const resolvedPkg = pkgName === 'bcrypt' ? 'bcryptjs' : pkgName
      if (KNOWN_PACKAGES[resolvedPkg]) {
        deps[resolvedPkg] = KNOWN_PACKAGES[resolvedPkg]
      } else {
        deps[resolvedPkg] = 'latest'
      }
    }
  }

  if (Object.keys(deps).length > 0) {
    logger.info({ extraDeps: Object.keys(deps) }, '偵測到額外依賴')
  }

  return deps
}

export interface TestServerConfig {
  backendFiles: GeneratedComponent[]  // lib/db.ts + lib/actions/*.ts
  actionsYml: string                  // 用於生成 test-server.ts 路由
  neonConnectionString: string
}

interface TestServer {
  port: number
  process: ChildProcess
  tmpDir: string
  cleanup: () => Promise<void>
}

/**
 * 啟動 Mini Express 測試伺服器
 * /tmp 目錄只 ~20MB，啟動 ~3s
 */
export async function startTestServer(config: TestServerConfig): Promise<TestServer> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tellcraft-test-'))
  logger.info({ tmpDir }, '建立測試目錄')

  try {
    // 1. 寫入 action 檔案
    for (const file of config.backendFiles) {
      const filePath = path.join(tmpDir, file.path)
      fs.mkdirSync(path.dirname(filePath), { recursive: true })
      fs.writeFileSync(filePath, file.content, 'utf-8')
    }

    // 2. 覆寫 lib/db.ts — 用 pg Pool 取代 neon tagged template
    //    neon() 的 function-call 模式 sql('query', [params]) 可能做字串替換而非真正 parameterized query
    //    在 test server 中用 pg Pool 確保正確的參數化查詢
    // db.ts 需要同時支持兩種呼叫方式：
    //   1. neon tagged template: sql\`SELECT ... WHERE id = \${value}\`
    //   2. 普通函數呼叫: sql('SELECT ... WHERE id = $1', [value])
    const pgDbContent = `import { Pool } from 'pg'
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

async function execQuery<T = any>(query: string, params?: any[]): Promise<T[]> {
  try {
    const result = await pool.query(query, params)
    return result.rows as T[]
  } catch (err: any) {
    console.error('[db.ts] SQL ERROR:', err.message, '\\nQuery:', query?.substring?.(0, 200), '\\nParams:', JSON.stringify(params)?.substring(0, 200))
    throw err
  }
}

// 支持 tagged template 和普通函數呼叫
export function sql<T = any>(stringsOrQuery: TemplateStringsArray | string, ...values: any[]): Promise<T[]> {
  if (typeof stringsOrQuery === 'string') {
    // 普通呼叫: sql('SELECT ... $1', [params])
    return execQuery<T>(stringsOrQuery, values[0])
  }
  // Tagged template: sql\\\`SELECT ... WHERE id = \\\${value}\\\`
  const strings = stringsOrQuery as TemplateStringsArray
  let query = ''
  for (let i = 0; i < strings.length; i++) {
    query += strings[i]
    if (i < values.length) query += '$' + (i + 1)
  }
  return execQuery<T>(query, values)
}

export default sql
`
    const dbFilePath = path.join(tmpDir, 'lib/db.ts')
    fs.mkdirSync(path.dirname(dbFilePath), { recursive: true })
    fs.writeFileSync(dbFilePath, pgDbContent, 'utf-8')
    logger.info('lib/db.ts 已覆寫為 pg Pool 版本')

    // 2b. 修復 CJS 模組 import（bcrypt/bcryptjs/jsonwebtoken 在 "type":"module" 下不支持 ESM import）
    for (const file of config.backendFiles) {
      if (!file.path.startsWith('lib/actions/')) continue
      const filePath = path.join(tmpDir, file.path)
      let content = fs.readFileSync(filePath, 'utf-8')
      let changed = false

      // bcrypt / bcryptjs: CJS module → 統一用 createRequire + bcryptjs（純 JS，無需 native build）
      if (/['"]bcrypt(?:js)?['"]/.test(content)) {
        // 擷取 named imports（如 { hash, compare }）以便修復引用
        const bcryptNamedMatch = content.match(/import\s+\{([^}]*)\}\s+from\s+['"]bcrypt(?:js)?['"]/)
        const bcryptNamedImports = bcryptNamedMatch
          ? bcryptNamedMatch[1].split(',').map(s => s.trim()).filter(Boolean)
          : []
        content = content.replace(
          /import\s+(?:\*\s+as\s+\w+|\w+|\{[^}]*\})\s+from\s+['"]bcrypt(?:js)?['"]/g,
          "import { createRequire } from 'module'\nconst _cjsRequire = createRequire(import.meta.url)\nconst bcrypt = _cjsRequire('bcryptjs')"
        )
        // 修復 named import 引用：hash() → bcrypt.hash(), compare() → bcrypt.compare()
        for (const imp of bcryptNamedImports) {
          const parts = imp.split(/\s+as\s+/)
          const localName = (parts[1] || parts[0]).trim()
          const originalName = parts[0].trim()
          content = content.replace(new RegExp(`(?<![.\\w])${localName}\\s*\\(`, 'g'), `bcrypt.${originalName}(`)
        }
        changed = true
      }

      // jsonwebtoken: 同樣是 CJS
      if (content.includes('jsonwebtoken')) {
        const jwtNamedMatch = content.match(/import\s+\{([^}]*)\}\s+from\s+['"]jsonwebtoken['"]/)
        const jwtNamedImports = jwtNamedMatch
          ? jwtNamedMatch[1].split(',').map(s => s.trim()).filter(Boolean)
          : []
        content = content.replace(
          /import\s+(?:\*\s+as\s+\w+|\w+|\{[^}]*\})\s+from\s+['"]jsonwebtoken['"]/g,
          "import { createRequire } from 'module'\nconst _cjsRequire2 = createRequire(import.meta.url)\nconst jwt = _cjsRequire2('jsonwebtoken')"
        )
        // 修復 named import 引用：sign() → jwt.sign(), verify() → jwt.verify()
        for (const imp of jwtNamedImports) {
          const parts = imp.split(/\s+as\s+/)
          const localName = (parts[1] || parts[0]).trim()
          const originalName = parts[0].trim()
          content = content.replace(new RegExp(`(?<![.\\w])${localName}\\s*\\(`, 'g'), `jwt.${originalName}(`)
        }
        changed = true
      }

      // crypto.randomUUID: Node 18 沒有 globalThis.crypto，替換為 node:crypto import
      if (content.includes('crypto.randomUUID')) {
        if (!content.includes("from 'node:crypto'") && !content.includes("from 'crypto'")) {
          content = "import { randomUUID as _cryptoRandomUUID } from 'node:crypto'\n" + content
        }
        content = content.replace(/crypto\.randomUUID\(\)/g, '_cryptoRandomUUID()')
        changed = true
      }

      if (changed) {
        fs.writeFileSync(filePath, content, 'utf-8')
      }
    }

    // 3. 生成 test-server.ts
    const testServerCode = generateTestServerCode(config.actionsYml, config.backendFiles)
    fs.writeFileSync(path.join(tmpDir, 'test-server.ts'), testServerCode, 'utf-8')

    // 3. tsconfig.json（解析 @/ path alias）
    fs.writeFileSync(path.join(tmpDir, 'tsconfig.json'), JSON.stringify({
      compilerOptions: {
        baseUrl: '.',
        paths: { '@/*': ['./*'] },
        esModuleInterop: true,
        module: 'nodenext',
        moduleResolution: 'nodenext',
        target: 'es2022',
        skipLibCheck: true,
      },
    }, null, 2), 'utf-8')

    // 4. package.json（最小依賴 + 掃描 action import 動態加入）
    const extraDeps = detectExtraDependencies(config.backendFiles)
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({
      name: 'tellcraft-test',
      private: true,
      type: 'module',
      dependencies: {
        'express': '^4.21.0',
        'pg': '^8.13.0',
        ...extraDeps,
      },
      devDependencies: {
        'tsx': '^4.19.0',
        '@types/express': '^4.17.21',
        '@types/node': '^22.0.0',
      },
    }, null, 2), 'utf-8')

    // 5. .env
    fs.writeFileSync(path.join(tmpDir, '.env'), `DATABASE_URL=${config.neonConnectionString}\n`, 'utf-8')

    // 6. pnpm install
    logger.info('pnpm install...')
    await execShell('pnpm install --no-frozen-lockfile', tmpDir, 30_000)

    // 7. 啟動 Express server
    logger.info('啟動 test server...')
    const proc = spawn('npx', ['tsx', 'test-server.ts'], {
      cwd: tmpDir,
      env: {
        ...process.env,
        DATABASE_URL: config.neonConnectionString,
        PORT: '0',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    // 8. 等待 READY:{port}
    const port = await waitForReady(proc, 15_000)
    logger.info({ port }, 'Test server ready')

    return {
      port,
      process: proc,
      tmpDir,
      cleanup: async () => {
        await stopTestServer(proc, tmpDir)
      },
    }
  } catch (err) {
    // 清理失敗的臨時目錄
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    } catch {
      // non-fatal
    }
    throw err
  }
}

async function stopTestServer(proc: ChildProcess, tmpDir: string): Promise<void> {
  try {
    proc.kill('SIGTERM')
    // 等待 2 秒
    await new Promise(resolve => setTimeout(resolve, 2000))
    if (!proc.killed) proc.kill('SIGKILL')
  } catch {
    // non-fatal
  }

  try {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  } catch {
    // non-fatal
  }
}

// ============================================================
// Test Server 代碼生成
// ============================================================

function generateTestServerCode(
  actionsYml: string,
  backendFiles: GeneratedComponent[]
): string {
  // 從 actionsYml 解析 action 定義
  let parsed: { actions?: Array<{ name: string; method?: string; path?: string; rules?: Array<{ type: string }> }> } | undefined
  try {
    parsed = yaml.load(actionsYml) as typeof parsed
  } catch {
    // fallback
  }

  // 從 backendFiles 找出 lib/actions/*.ts 的 action 名稱
  const actionImports: string[] = []
  const actionRoutes: string[] = []

  if (parsed?.actions) {
    for (const action of parsed.actions) {
      // 找到對應的 lib/actions 檔案
      const kebabName = action.name
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[_\s]+/g, '-')
        .toLowerCase()

      const hasFile = backendFiles.some(f =>
        f.path === `lib/actions/${kebabName}.ts`
      )
      if (!hasFile) continue

      // snake_case → camelCase（與 LLM 生成的 export 名稱一致）
      const fnName = action.name
        .split(/[_\s-]+/)
        .map((w: string, i: number) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join('')

      const isQuery = action.rules?.some(r => r.type === '後置（回應）') && !action.rules?.some(r => r.type === '後置（狀態）')
      const method = (action.method || (isQuery ? 'GET' : 'POST')).toUpperCase()
      const apiPath = action.path || `/api/${action.name}`
      const statusCode = method === 'POST' ? 201 : 200

      actionImports.push(`import { ${fnName} } from './lib/actions/${kebabName}'`)

      // 註冊所有 HTTP 方法 — 同一 Feature 內可能有 POST/GET/PUT/DELETE 操作
      // status code 由 action 函數的 __status 欄位控制
      actionRoutes.push(`app.all('${apiPath}', async (req, res) => {
  try {
    const input = req.method === 'GET' ? req.query : req.body
    const result = await ${fnName}(input as any)
    const status = result?.__status || ${statusCode}
    if (result?.__status) {
      const { __status, ...data } = result
      res.status(status).json(data)
    } else {
      res.status(status).json(result)
    }
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'Unknown error' })
  }
})`)
    }
  }

  return `// Polyfill globalThis.crypto for Node 18 (crypto.randomUUID needs it)
import { webcrypto as _webcrypto } from 'node:crypto'
if (!globalThis.crypto) { (globalThis as any).crypto = _webcrypto }

import express from 'express'
${actionImports.join('\n')}

const app = express()
app.use(express.json())

${actionRoutes.join('\n\n')}

const port = parseInt(process.env.PORT || '0')
const server = app.listen(port, () => {
  const addr = server.address() as { port: number }
  console.log(\`READY:\${addr.port}\`)
})
`
}

// ============================================================
// Shell 工具
// ============================================================

function execShell(cmd: string, cwd: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('sh', ['-c', cmd], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: timeoutMs,
    })

    let stdout = ''
    let stderr = ''
    proc.stdout?.on('data', d => { stdout += d.toString() })
    proc.stderr?.on('data', d => { stderr += d.toString() })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout)
      } else {
        reject(new Error(`Command failed (${code}): ${cmd}\nstderr: ${stderr.slice(0, 500)}`))
      }
    })

    proc.on('error', reject)
  })
}

function waitForReady(proc: ChildProcess, timeoutMs: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Test server 啟動超時 (${timeoutMs}ms)`))
    }, timeoutMs)

    let output = ''

    proc.stdout?.on('data', (data) => {
      output += data.toString()
      const match = output.match(/READY:(\d+)/)
      if (match) {
        clearTimeout(timer)
        resolve(parseInt(match[1], 10))
      }
    })

    proc.stderr?.on('data', (data) => {
      const errText = data.toString()
      logger.warn({ stderr: errText.slice(0, 500) }, 'test server stderr')
    })

    proc.on('close', (code) => {
      clearTimeout(timer)
      reject(new Error(`Test server 意外退出 (code=${code})\noutput: ${output.slice(0, 500)}`))
    })

    proc.on('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })
  })
}

// ============================================================
// SpecFormula 驗證 Pipeline（整合入口）
// ============================================================

export async function runSpecFormulaValidation(input: {
  backendFiles: GeneratedComponent[]
  featureFiles: { name: string; content: string }[]
  actionsYml: string
  openApiSpec: string
  isaConfigYml: string
  schemaSql: string
  entityMapping: string
  neonConnectionString: string
  onProgress: (step: string, percent: number) => Promise<void>
}): Promise<SpecFormulaTestResult> {
  let testServer: TestServer | undefined

  try {
    // 1. 啟動 Mini Express Test Server
    await input.onProgress('建立測試環境...', 5)
    testServer = await startTestServer({
      backendFiles: input.backendFiles,
      actionsYml: input.actionsYml,
      neonConnectionString: input.neonConnectionString,
    })
    await input.onProgress('測試伺服器就緒', 25)

    // 2. 建立 HTTP adapter
    const httpAdapter = new UrlHttpAdapter(`http://localhost:${testServer.port}`)

    // 3. 建立 DB pool（直接連 Neon）
    const pool = new Pool({ connectionString: input.neonConnectionString })

    try {
      // 4. 將 MySQL DDL 轉換為 PostgreSQL DDL（EntityDdlReader 需要正確的 PG 型別）
      const derived = deriveSchemaFromBdd(input.schemaSql, input.entityMapping)
      const pgSchemaSql = derived.postgresqlDDL
      logger.info({ entityCount: derived.entityCount }, 'MySQL DDL → PostgreSQL DDL 轉換完成')

      // 5. 執行所有 Feature Files
      await input.onProgress('開始執行測試...', 30)
      const result = await runAllFeatures({
        features: input.featureFiles,
        isaConfigYml: input.isaConfigYml,
        openApiSpec: input.openApiSpec,
        schemaSql: pgSchemaSql,
        entityMapping: input.entityMapping,
        httpAdapter,
        pool,
        onProgress: input.onProgress,
      })

      await input.onProgress('測試完成', 95)

      logger.info({
        total: result.totalScenarios,
        passed: result.passed,
        failed: result.failed,
        durationMs: result.durationMs,
      }, 'SpecFormula 測試完成')

      return result
    } finally {
      await pool.end()
    }
  } finally {
    // 5. 清理
    if (testServer) {
      await input.onProgress('清理測試環境...', 97)
      await testServer.cleanup()
    }
  }
}

// ============================================================
// 紅綠燈循環（測試 → 修復 → 重測）
// ============================================================

export async function runRedGreenCycle(input: {
  backendFiles: GeneratedComponent[]
  featureFiles: { name: string; content: string }[]
  actionsYml: string
  openApiSpec: string
  isaConfigYml: string
  schemaSql: string
  entityMapping: string
  neonConnectionString: string
  maxAttempts?: number
  trackingContext?: { userId?: string; conversationId?: string }
  onProgress: (step: string, percent: number) => Promise<void>
}): Promise<{
  finalFiles: GeneratedComponent[]
  testResults: SpecFormulaTestResult
  attempts: number
  allPassed: boolean
}> {
  const { fixFailingAction } = await import('./coder-generation')
  const maxAttempts = input.maxAttempts ?? 3
  let currentFiles = [...input.backendFiles]
  let lastResult: SpecFormulaTestResult | undefined
  let attempt = 0

  for (attempt = 1; attempt <= maxAttempts; attempt++) {
    const attemptPercent = Math.floor(((attempt - 1) / maxAttempts) * 80)
    await input.onProgress(`第 ${attempt}/${maxAttempts} 輪測試...`, 5 + attemptPercent)

    // 跑測試（test server crash 時降級為全部失敗，繼續下一輪修復）
    try {
      lastResult = await runSpecFormulaValidation({
        backendFiles: currentFiles,
        featureFiles: input.featureFiles,
        actionsYml: input.actionsYml,
        openApiSpec: input.openApiSpec,
        isaConfigYml: input.isaConfigYml,
        schemaSql: input.schemaSql,
        entityMapping: input.entityMapping,
        neonConnectionString: input.neonConnectionString,
        onProgress: async (step, pct) => {
          const scaledPct = attemptPercent + Math.floor(pct * 0.8 / maxAttempts)
          await input.onProgress(`[${attempt}/${maxAttempts}] ${step}`, 5 + scaledPct)
        },
      })
    } catch (testErr) {
      logger.error({ attempt, err: testErr }, '測試執行失敗（test server crash），視為全部失敗')
      lastResult = {
        totalScenarios: input.featureFiles.length,
        passed: 0,
        failed: input.featureFiles.length,
        skipped: 0,
        scenarios: input.featureFiles.map(f => ({
          featureName: f.name,
          ruleName: '',
          scenarioName: '(test server crash)',
          status: 'failed' as const,
          error: `Test server crash: ${testErr instanceof Error ? testErr.message : String(testErr)}`,
          steps: [],
        })),
        durationMs: 0,
      }
    }

    logger.info({
      attempt,
      passed: lastResult.passed,
      failed: lastResult.failed,
      total: lastResult.totalScenarios,
    }, '紅綠燈循環結果')

    // 全部通過？
    if (lastResult.failed === 0) {
      break
    }

    // 最後一輪不需要修復
    if (attempt >= maxAttempts) {
      break
    }

    // 收集失敗的 action → 修復
    await input.onProgress(`修復失敗的 action...`, 5 + attemptPercent + 15)
    const failedByAction = groupFailedByAction(lastResult, input.featureFiles, input.actionsYml)

    for (const [actionName, scenarios] of failedByAction) {
      // 找到對應的 lib/actions/<name>.ts 檔案
      const kebabName = actionName
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[_\s]+/g, '-')
        .toLowerCase()
      const filePath = `lib/actions/${kebabName}.ts`
      const fileIdx = currentFiles.findIndex(f => f.path === filePath)

      if (fileIdx === -1) {
        logger.warn({ actionName, filePath }, '找不到對應的 action 檔案，跳過修復')
        continue
      }

      const fixedCode = await fixFailingAction(
        actionName,
        currentFiles[fileIdx].content,
        scenarios,
        input.schemaSql,
        input.trackingContext
      )

      // 替換
      currentFiles[fileIdx] = {
        ...currentFiles[fileIdx],
        content: fixedCode,
      }
    }
  }

  return {
    finalFiles: currentFiles,
    testResults: lastResult!,
    attempts: attempt,
    allPassed: lastResult!.failed === 0,
  }
}

/**
 * 根據 feature 名稱反查 action，分組失敗的 scenario
 */
function groupFailedByAction(
  result: SpecFormulaTestResult,
  featureFiles: { name: string; content: string }[],
  actionsYml: string
): Map<string, Array<{ scenarioName: string; ruleName: string; error?: string }>> {
  // 從 actionsYml 建立 summary → actionName 映射
  const summaryToAction = new Map<string, string>()
  try {
    const parsed = yaml.load(actionsYml) as { actions?: Array<{ name: string; summary: string }> }
    if (parsed?.actions) {
      for (const a of parsed.actions) {
        summaryToAction.set(a.summary, a.name)
      }
    }
  } catch {
    // fallback
  }

  // 從 featureFiles 建立 feature 名稱 → action name
  const featureToAction = new Map<string, string>()
  for (const f of featureFiles) {
    // 從 # Action: 註解提取
    const actionMatch = f.content.match(/^#\s*Action:\s*(\S+)/m)
    if (actionMatch) {
      featureToAction.set(f.name, actionMatch[1])
    }
  }

  const grouped = new Map<string, Array<{ scenarioName: string; ruleName: string; error?: string }>>()

  for (const s of result.scenarios) {
    if (s.status !== 'failed') continue

    // 反查 action name
    const actionName = featureToAction.get(s.featureName)
      || summaryToAction.get(s.featureName)
      || 'unknown'

    const list = grouped.get(actionName) || []
    list.push({
      scenarioName: s.scenarioName,
      ruleName: s.ruleName,
      error: s.error,
    })
    grouped.set(actionName, list)
  }

  return grouped
}

// ============================================================
// 測試結果格式化（用於 sendMessage）
// ============================================================

export function formatTestResults(result: SpecFormulaTestResult): string {
  const lines: string[] = []

  // 按 feature 分組
  const byFeature = new Map<string, ScenarioResult[]>()
  for (const s of result.scenarios) {
    const list = byFeature.get(s.featureName) || []
    list.push(s)
    byFeature.set(s.featureName, list)
  }

  for (const [feature, scenarios] of byFeature) {
    const passed = scenarios.filter(s => s.status === 'passed').length
    const total = scenarios.length
    const icon = passed === total ? '✅' : '❌'
    lines.push(`${icon} ${feature} — ${passed}/${total} scenario 通過`)

    // 顯示失敗的 scenario 細節
    for (const s of scenarios) {
      if (s.status === 'failed') {
        const label = s.ruleName ? `${s.ruleName} - ${s.scenarioName}` : s.scenarioName
        lines.push(`   ❌ ${label}`)
        if (s.error) {
          lines.push(`      Error: ${s.error.slice(0, 200)}`)
        }
      }
    }
  }

  lines.push('')
  lines.push(`總計：${result.passed}/${result.totalScenarios} 通過（${result.durationMs}ms）`)

  return lines.join('\n')
}
