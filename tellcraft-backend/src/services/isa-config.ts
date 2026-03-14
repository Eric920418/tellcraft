import * as yaml from 'js-yaml'
import { createLogger } from '../lib/logger'

const logger = createLogger('isa-config')

// ============================================================
// 類型定義
// ============================================================

export interface IsaConfigInput {
  features: Array<{ name: string; actionName: string; content: string }>
  entityMapping: string
  actionsYml: string
}

interface StepPattern {
  type: 'entity_setup' | 'time_control' | 'action_call' | 'response_validate' | 'response_validate_json' | 'operation_failure' | 'entity_validate' | 'entity_non_existence'
  count: number
  examples: string[] // 前幾個匹配的原始行（用於 debug）
}

interface IsaInstruction {
  name: string
  format: string
  instruction_type: string
  data_format?: string
  step_type?: string
  constraints?: string[]
  subpackage?: string
  situation?: string
}

// ============================================================
// 8 種步驟模式的 Regex（SpecFormula 標準）
// 與 lint-gherkin-format.ts 和 05-isa-config.md 完全一致
// ============================================================

const STEP_REGEXES = {
  entity_setup: /^\s*(?:Given|And)\s+準備一個([\u4e00-\u9fffa-zA-Z0-9_]+), with table:\s*$/,
  time_control: /^\s*(?:Given|And)\s+現在時間為 "([^"]+)"\s*$/,
  action_call: /^\s*When\s+\((?:No Actor|UID="([^"]+)")\) (.+), call table:\s*$/,
  response_validate: /^\s*(?:Then|And)\s+(.+)\((\d{3})\)回應,?\s*with table:\s*$/,
  response_validate_json: /^\s*(?:Then|And)\s+(.+)\((\d{3})\)回應為,?\s*with JSON:\s*$/,
  operation_failure: /^\s*(?:Then|And)\s+操作失敗\s*$/,
  entity_validate: /^\s*(?:Then|And)\s+應該存在一個([\u4e00-\u9fffa-zA-Z0-9_]+), with table:\s*$/,
  entity_non_existence: /^\s*(?:Then|And)\s+應該不存在一個([\u4e00-\u9fffa-zA-Z0-9_]+), with table:\s*$/,
}

// ============================================================
// Instruction Type 映射（SpecFormula 標準）
// ============================================================

const INSTRUCTION_TYPES = {
  entity_setup: 'entity_setup',
  time_control: 'time_control',
  action_call: 'api_call',
  response_validate: 'response_validate',
  response_validate_json: 'response_validate',
  operation_failure: 'skip',
  entity_validate: 'entity_validate',
  entity_non_existence: 'entity_non_existence_validate',
}

// ============================================================
// 掃描步驟模式
// ============================================================

function scanStepPatterns(features: Array<{ content: string }>): Map<string, StepPattern> {
  const patterns = new Map<string, StepPattern>()

  for (const [type] of Object.entries(STEP_REGEXES)) {
    patterns.set(type, { type: type as StepPattern['type'], count: 0, examples: [] })
  }

  for (const feature of features) {
    const lines = feature.content.split('\n')
    for (const line of lines) {
      for (const [type, regex] of Object.entries(STEP_REGEXES)) {
        if (regex.test(line)) {
          const pattern = patterns.get(type)!
          pattern.count++
          if (pattern.examples.length < 3) {
            pattern.examples.push(line.trim())
          }
          break // 一行只匹配一個模式
        }
      }
    }
  }

  return patterns
}

// ============================================================
// 動態約束派生
// ============================================================

interface DerivedConstraints {
  entityNames: string[]           // Feature 中出現的所有 entity
  tableNames: string[]            // entity mapping 中的 table
  columnsByTable: Record<string, string[]> // Feature DataTable headers
  hasStatePrecondition: boolean   // 是否有「前置（狀態）」Rule
}

function deriveConstraints(
  features: Array<{ name: string; content: string }>,
  entityMapping: string
): DerivedConstraints {
  const entityNames = new Set<string>()
  const columnsByTable: Record<string, string[]> = {}
  let hasStatePrecondition = false

  // 從 entity mapping 提取 entity→table 對應
  const entityToTable = new Map<string, string>()
  for (const line of entityMapping.split('\n')) {
    const match = line.match(/[-\s]*(.+?):\s*(\w+)/)
    if (match && match[1] && match[2] && match[1] !== 'entity_to_table_mapping') {
      entityToTable.set(match[1].trim(), match[2].trim().toLowerCase())
    }
  }

  for (const feature of features) {
    const lines = feature.content.split('\n')

    // 掃描 entity 名稱（SpecFormula 標準）
    for (const line of lines) {
      const setupMatch = line.match(/準備一個([\u4e00-\u9fffa-zA-Z0-9_]+),/)
      if (setupMatch) entityNames.add(setupMatch[1])
      const validateMatch = line.match(/應該存在一個([\u4e00-\u9fffa-zA-Z0-9_]+),/)
      if (validateMatch) entityNames.add(validateMatch[1])
      const nonExistMatch = line.match(/應該不存在一個([\u4e00-\u9fffa-zA-Z0-9_]+),/)
      if (nonExistMatch) entityNames.add(nonExistMatch[1])
    }

    // 掃描 DataTable headers（| col1 | col2 | 格式的第一行）
    let prevLineIsStep = false
    for (const line of lines) {
      const trimmed = line.trim()
      if (/^\s*(Given|When|Then|And|But)\s+/.test(trimmed)) {
        prevLineIsStep = true
        continue
      }
      if (prevLineIsStep && trimmed.startsWith('|')) {
        // 提取 header columns
        const cols = trimmed.split('|').map(c => c.trim()).filter(Boolean)
        // 嘗試關聯到 entity → table
        // 用上一步的 entity 推斷
        for (const [entity, table] of entityToTable.entries()) {
          if (feature.content.includes(entity)) {
            if (!columnsByTable[table]) columnsByTable[table] = []
            for (const col of cols) {
              if (col && !columnsByTable[table].includes(col)) {
                columnsByTable[table].push(col)
              }
            }
          }
        }
        prevLineIsStep = false
      } else {
        prevLineIsStep = false
      }
    }

    // 檢查是否有「前置（狀態）」Rule
    if (feature.content.includes('前置（狀態）')) {
      hasStatePrecondition = true
    }
  }

  const tableNames = [...entityToTable.values()]

  return {
    entityNames: [...entityNames],
    tableNames,
    columnsByTable,
    hasStatePrecondition,
  }
}

// ============================================================
// 生成 ISA Config Instructions
// ============================================================

function buildInstructions(detectedPatterns: Map<string, StepPattern>, derived?: DerivedConstraints): IsaInstruction[] {
  const instructions: IsaInstruction[] = []

  // 1. Entity Setup (Given)
  if (detectedPatterns.get('entity_setup')!.count > 0) {
    const entityConstraints = [
      '<entity> must be a valid entity defined in entity_to_table_mapping.yml',
      'All column headers in the DataTable must be valid schema fields',
      'Context Keys (>) must follow >ContextName.field format',
      'Execution Keys (<) capture generated values for later reference',
    ]
    if (derived && derived.entityNames.length > 0) {
      entityConstraints.push(`Valid entities: ${derived.entityNames.join(', ')}`)
    }
    if (derived && derived.tableNames.length > 0) {
      entityConstraints.push(`Valid tables: ${derived.tableNames.join(', ')}`)
    }
    if (derived) {
      for (const [table, cols] of Object.entries(derived.columnsByTable)) {
        if (cols.length > 0) {
          entityConstraints.push(`Table '${table}' known columns: ${cols.join(', ')}`)
        }
      }
    }
    instructions.push({
      name: 'Entity setup',
      format: '^準備一個(?P<entity>[\\u4e00-\\u9fffa-zA-Z0-9_]+), with table:$',
      step_type: 'Given',
      instruction_type: INSTRUCTION_TYPES.entity_setup,
      constraints: entityConstraints,
      subpackage: 'given',
      situation: 'to prepare test data in the database before Server Action calls',
    })
  }

  // 2. Time Control (Given)
  if (detectedPatterns.get('time_control')!.count > 0) {
    instructions.push({
      name: 'Time control',
      format: '^現在時間為 "(?P<datetime>[^"]+)"$',
      step_type: 'Given',
      instruction_type: INSTRUCTION_TYPES.time_control,
      subpackage: 'given',
      situation: 'to set the system time for time-dependent test scenarios',
    })
  }

  // 3. Action Call (When) — with Actor prefix
  if (detectedPatterns.get('action_call')!.count > 0) {
    const actionConstraints: string[] = []
    if (derived && derived.tableNames.length > 0) {
      actionConstraints.push(`All call table column headers must be defined in schema. Known tables: ${derived.tableNames.join(', ')}`)
    }
    instructions.push({
      name: 'Action call',
      format: '^\\((?:No Actor|UID="(?P<actor>[^"]+)")\\) (?P<summary>.+?), call table:$',
      step_type: 'When',
      instruction_type: INSTRUCTION_TYPES.action_call,
      ...(actionConstraints.length > 0 ? { constraints: actionConstraints } : {}),
      subpackage: 'action',
      situation: 'to invoke the Server Action with the given parameters and optional actor identity',
    })
  }

  // 4. Response Validation (Then) — with status code
  if (detectedPatterns.get('response_validate')!.count > 0) {
    instructions.push({
      name: 'Response validation',
      format: '^(?P<summary>.+?)\\((?P<status>\\d{3})\\)回應,?\\s*with table:$',
      instruction_type: INSTRUCTION_TYPES.response_validate,
      data_format: 'data_table',
    })
  }

  // 5. Response Validation JSON (Then)
  if (detectedPatterns.get('response_validate_json')!.count > 0) {
    instructions.push({
      name: 'Response validation JSON',
      format: '^(?P<summary>.+?)\\((?P<status>\\d{3})\\)回應為,?\\s*with JSON:$',
      instruction_type: INSTRUCTION_TYPES.response_validate_json,
      data_format: 'json',
    })
  }

  // 6. Operation Failure (Then)
  if (detectedPatterns.get('operation_failure')!.count > 0) {
    instructions.push({
      name: 'Operation failure',
      format: '^操作失敗$',
      step_type: 'Then',
      instruction_type: INSTRUCTION_TYPES.operation_failure,
      subpackage: 'then',
      situation: 'to validate that the Server Action returned an error',
    })
  }

  // 7. Entity Validate (Then) — 應該存在一個
  if (detectedPatterns.get('entity_validate')!.count > 0) {
    const validateConstraints = [
      '<entity> must be a valid entity defined in entity_to_table_mapping.yml',
      'the entity\'s properties defined in the DataTable must match the entity spec',
      'All column headers in the DataTable must be valid schema structure paths',
      'Variable references ($) must resolve to previously declared context values',
    ]
    if (derived && derived.entityNames.length > 0) {
      validateConstraints.push(`Valid entities: ${derived.entityNames.join(', ')}`)
    }
    if (derived && derived.tableNames.length > 0) {
      validateConstraints.push(`Valid tables: ${derived.tableNames.join(', ')}`)
    }
    instructions.push({
      name: 'Entity validate',
      format: '^應該存在一個(?P<entity>[\\u4e00-\\u9fffa-zA-Z0-9_]+), with table:$',
      step_type: 'Then',
      instruction_type: INSTRUCTION_TYPES.entity_validate,
      constraints: validateConstraints,
      subpackage: 'then',
      situation: 'to validate the entity exists in the database with the given parameters',
    })
  }

  // 8. Entity Non-existence (Then) — 應該不存在一個
  if (detectedPatterns.get('entity_non_existence')!.count > 0) {
    instructions.push({
      name: 'Entity non-existence',
      format: '^應該不存在一個(?P<entity>[\\u4e00-\\u9fffa-zA-Z0-9_]+), with table:$',
      step_type: 'Then',
      instruction_type: INSTRUCTION_TYPES.entity_non_existence,
      constraints: [
        '<entity> must be a valid entity defined in entity_to_table_mapping.yml',
      ],
      subpackage: 'then',
      situation: 'to validate the entity does not exist in the database',
    })
  }

  return instructions
}

// ============================================================
// 覆蓋率驗證
// ============================================================

/**
 * 驗證每個 Feature 步驟都能被某個 instruction regex 匹配
 */
export function validateIsaConfig(
  isaConfigYml: string,
  features: Array<{ content: string }>
): { valid: boolean; unmatchedSteps: Array<{ file: string; step: string }> } {
  // 解析 config 中的 format regex
  let parsed: { instructions?: Array<{ format: string }> }
  try {
    parsed = yaml.load(isaConfigYml) as { instructions?: Array<{ format: string }> }
  } catch {
    return { valid: false, unmatchedSteps: [{ file: 'N/A', step: 'YAML 解析失敗' }] }
  }

  if (!parsed?.instructions) {
    return { valid: false, unmatchedSteps: [{ file: 'N/A', step: '缺少 instructions' }] }
  }

  const configRegexes = parsed.instructions.map(inst => {
    try {
      // Python named groups (?P<name>...) → JS 不需要特殊處理，直接移除 ?P<name>
      const jsPattern = inst.format.replace(/\(\?P<\w+>/g, '(')
      return new RegExp(jsPattern)
    } catch {
      return null
    }
  }).filter(Boolean) as RegExp[]

  const unmatchedSteps: Array<{ file: string; step: string }> = []

  for (const feature of features) {
    const lines = feature.content.split('\n')
    for (const line of lines) {
      const stepMatch = line.match(/^\s*(Given|When|Then|And|But)\s+(.+)\s*$/)
      if (!stepMatch) continue

      const stepContent = stepMatch[2].trim()

      // 檢查是否有任何 config regex 能匹配此步驟
      const matched = configRegexes.some(regex => regex.test(stepContent))
      if (!matched) {
        unmatchedSteps.push({ file: 'feature', step: `${stepMatch[1]} ${stepContent}` })
      }
    }
  }

  return {
    valid: unmatchedSteps.length === 0,
    unmatchedSteps,
  }
}

// ============================================================
// 公開 API
// ============================================================

/**
 * 100% 規則式生成 ISA Config，零 LLM 成本
 *
 * 掃描所有 Feature 的 Given/When/Then 步驟，
 * 對偵測到的 5 種模式從固定模板生成 instruction 配置
 */
export function generateIsaConfig(
  input: IsaConfigInput
): { success: boolean; isaConfigYml?: string; error?: string } {
  const { features } = input

  if (features.length === 0) {
    return { success: false, error: '沒有 Feature Files' }
  }

  try {
    // Step 1: 掃描所有步驟模式
    const detectedPatterns = scanStepPatterns(features)

    const patternSummary = Array.from(detectedPatterns.entries())
      .map(([type, p]) => `${type}: ${p.count}`)
      .join(', ')
    logger.info({ patternSummary }, '掃描完成')

    // Step 1.5: 動態派生約束
    const derived = deriveConstraints(features, input.entityMapping)
    logger.info({ entities: derived.entityNames.length, tables: derived.tableNames.length, statePrecondition: derived.hasStatePrecondition }, '動態約束')

    // Step 2: 生成 instructions
    const instructions = buildInstructions(detectedPatterns, derived)

    if (instructions.length === 0) {
      return { success: false, error: '沒有偵測到任何 ISA 步驟模式' }
    }

    // Step 3: 組裝 YAML（sdd.os ISA 標準）
    const configObj = {
      config: {
        api: {
          resource_path: 'specs/api',
          project_path: 'specs/api',
          time_format: 'iso',
        },
        data: {
          permission: 'isolated',
          source: [
            {
              name: 'default',
              resource_path: 'specs/data',
              project_path: 'specs/data',
              db_type: 'postgresql',
            },
          ],
        },
      },
      instructions,
    }

    const header = `# isa.yml - sdd.os ISA 配置檔案（SpecFormula 標準）
# 自動生成，基於 ${features.length} 個 Feature Files
# 專案技術棧：Next.js API Routes + Neon PostgreSQL
`

    const yamlBody = yaml.dump(configObj, {
      lineWidth: 120,
      noRefs: true,
      quotingType: '"',
      forceQuotes: false,
    })

    const isaConfigYml = header + '\n' + yamlBody

    // Step 4: 覆蓋率驗證
    const validation = validateIsaConfig(isaConfigYml, features)
    if (!validation.valid) {
      logger.warn({ unmatchedCount: validation.unmatchedSteps.length, samples: validation.unmatchedSteps.slice(0, 5) }, '覆蓋率不完整')
    }

    logger.info({ instructionCount: instructions.length }, '生成完成')
    return { success: true, isaConfigYml }
  } catch (err) {
    return { success: false, error: `生成失敗: ${err}` }
  }
}
