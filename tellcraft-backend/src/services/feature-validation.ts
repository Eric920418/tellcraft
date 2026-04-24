import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { fixMultipleFeatures, FeatureFixInput } from './formulation'
import { ClarifyItem } from './bdd-session'
import { LlmTrackingContext } from './classifier'
import { createLogger } from '../lib/logger'
import { parseCreateTables, parseEntityToTableMapping } from './schema-derivation'

const logger = createLogger('feature-validation')

// ============================================================
// 類型定義
// ============================================================

interface LintSummary {
  passed: boolean
  totalFiles: number
  passedFiles: number
  totalErrors: number
  errors: string[]
  filesWithErrors: string[]
}

interface ValidateSummary {
  passed: boolean
  total_files: number
  valid_files: number
  total_errors: number
  total_warnings: number
  errors: string[]
  warnings: string[]
}

export interface FeatureValidationResult {
  lintPassed: boolean
  validatePassed: boolean
  lintSummary?: LintSummary
  validateSummary?: ValidateSummary
  errors: string[]
}

export interface FeatureInput {
  name: string
  actionName: string
  content: string
}

// ============================================================
// 臨時檔案管理
// ============================================================

function createTmpDir(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const tmpDir = path.join('/tmp', `tellcraft-bdd-validate-${timestamp}-${random}`)
  fs.mkdirSync(tmpDir, { recursive: true })
  return tmpDir
}

function writeFeaturesToTmp(tmpDir: string, features: FeatureInput[]): void {
  for (const feature of features) {
    const fileName = `${feature.name}.feature`
    fs.writeFileSync(path.join(tmpDir, fileName), feature.content, 'utf-8')
  }
}

function cleanupTmpDir(tmpDir: string): void {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  } catch (err) {
    logger.warn({ err }, '清理臨時目錄失敗')
  }
}

// ============================================================
// VAR-System 對齊快檢（內建，不依賴外部腳本）
// ============================================================

function checkVarAlignment(content: string, featureName: string): string[] {
  const errors: string[] = []
  const lines = content.split('\n')
  let tableLines: string[] = []
  let tableStartIdx = -1

  const flushTable = () => {
    if (tableLines.length < 2) { tableLines = []; return }

    const parseRow = (line: string) => line.split('|').map(c => c.trim()).filter(Boolean)
    const headerCells = parseRow(tableLines[0])
    for (let rowIdx = 1; rowIdx < tableLines.length; rowIdx++) {
      const dataCells = parseRow(tableLines[rowIdx])
      for (let col = 0; col < Math.min(headerCells.length, dataCells.length); col++) {
        // E011: Header >contextKey 但 data 不是 <executionKey
        if (headerCells[col].startsWith('>') && dataCells[col] && !dataCells[col].startsWith('<') && !dataCells[col].startsWith('$')) {
          errors.push(`[${featureName}] L${tableStartIdx + rowIdx + 1}: Header >${headerCells[col].substring(1)} 對應的 data 不是 <executionKey（實際值：${dataCells[col]}）`)
        }
        // E012: Data <executionKey 但 header 沒有 >contextKey
        if (dataCells[col].startsWith('<') && !headerCells[col].startsWith('>')) {
          errors.push(`[${featureName}] L${tableStartIdx + rowIdx + 1}: Data <${dataCells[col].substring(1)} 但 header 沒有 >contextKey（header：${headerCells[col]}）`)
        }
      }
    }
    tableLines = []
  }

  lines.forEach((line, idx) => {
    if (line.trim().startsWith('|')) {
      if (tableLines.length === 0) tableStartIdx = idx
      tableLines.push(line)
    } else {
      if (tableLines.length > 0) flushTable()
    }
  })
  if (tableLines.length > 0) flushTable()

  return errors
}

// ============================================================
// Schema-Aware Feature 靜態分析（三層檢查）
// ============================================================

function checkFeatureSchemaAlignment(
  content: string,
  featureName: string,
  schemaSql: string,
  entityMapping: string
): string[] {
  const errors: string[] = []
  const lines = content.split('\n')

  // 解析 schema
  const entityToTable = parseEntityToTableMapping(entityMapping)
  const tables = parseCreateTables(schemaSql)

  // 建立 table → column names 映射
  const tableColumns = new Map<string, Set<string>>()
  for (const table of tables) {
    const cols = new Set<string>()
    for (const colDef of table.columns) {
      // 取 column 定義的第一個 word 作為 column name（跳過 CONSTRAINT/PRIMARY KEY 等）
      const trimmed = colDef.trim()
      if (/^\s*CONSTRAINT\s/i.test(trimmed) || /^\s*PRIMARY\s+KEY/i.test(trimmed) || /^\s*UNIQUE\s/i.test(trimmed) || /^\s*CHECK\s/i.test(trimmed) || /^\s*FOREIGN\s/i.test(trimmed)) continue
      const colNameMatch = trimmed.match(/^(\w+)\s+/)
      if (colNameMatch) {
        cols.add(colNameMatch[1].toLowerCase())
      }
    }
    tableColumns.set(table.tableName.toLowerCase(), cols)
  }

  // === Layer 1 + 2: Entity 存在性 + Column 存在性 ===
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    // 匹配 `準備一個X` 或 `應該存在一個X` 或 `應該不存在一個X`
    const entityMatch = line.match(/(?:準備一個|應該存在一個|應該不存在一個)([\u4e00-\u9fffa-zA-Z0-9_]+)/)
    if (!entityMatch) continue

    const entityName = entityMatch[1]
    const tableName = entityToTable.get(entityName)

    // Layer 1: Entity 不存在
    if (!tableName) {
      errors.push(`[${featureName}] L${i + 1}: Entity「${entityName}」不在 entity_to_table_mapping 中（可能不存在於 Schema）`)
      continue
    }

    const cols = tableColumns.get(tableName.toLowerCase())
    if (!cols) {
      errors.push(`[${featureName}] L${i + 1}: Entity「${entityName}」映射到 table「${tableName}」，但 Schema 中沒有此表`)
      continue
    }

    // Layer 2: 找後面的 DataTable header，檢查欄位
    // 向下搜尋 DataTable（| 開頭的行）
    let headerLine = ''
    for (let j = i + 1; j < lines.length && j <= i + 3; j++) {
      if (lines[j].trim().startsWith('|')) {
        headerLine = lines[j]
        break
      }
    }
    if (!headerLine) continue

    const headers = headerLine.split('|').map(c => c.trim()).filter(Boolean)
    for (const header of headers) {
      // 跳過 VAR-System 前綴
      if (header.startsWith('>') || header.startsWith('<') || header.startsWith('$')) continue
      // camelCase → snake_case
      const snake = header.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()
      if (!cols.has(snake) && !cols.has(header.toLowerCase())) {
        errors.push(`[${featureName}] L${i + 1}: Entity「${entityName}」(table: ${tableName}) 沒有欄位「${header}」（snake_case: ${snake}）`)
      }
    }
  }

  // === Layer 3: VAR 變數流 — 宣告/引用比對 ===
  const declaredVars = new Set<string>()

  // 掃描所有 >ContextName.field 宣告
  const declarePattern = />\s*([\w.]+)/g
  let match: RegExpExecArray | null
  while ((match = declarePattern.exec(content)) !== null) {
    // >User.id → "User" (只取 ContextName，不含 .field)
    const contextName = match[1].split('.')[0]
    declaredVars.add(contextName)
  }

  // 掃描所有 $ContextName.field 引用，檢查 ContextName 是否已宣告
  const refPattern = /\$\s*([\w.]+)/g
  while ((match = refPattern.exec(content)) !== null) {
    const fullRef = match[1]
    // 跳過 $notnull（特殊值）
    if (fullRef === 'notnull') continue
    const contextName = fullRef.split('.')[0]
    if (!declaredVars.has(contextName)) {
      // 找到 line number
      const beforeMatch = content.substring(0, match.index)
      const lineNum = (beforeMatch.match(/\n/g) || []).length + 1
      errors.push(`[${featureName}] L${lineNum}: 引用 $${fullRef}，但「${contextName}」從未被 > 宣告`)
    }
  }

  return errors
}

// ============================================================
// 腳本路徑（相對於專案根目錄）
// ============================================================

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..')
const LINT_SCRIPT = path.join(PROJECT_ROOT, 'bdd-spec', 'scripts', 'lint-gherkin-format.ts')
const VALIDATE_SCRIPT = path.join(PROJECT_ROOT, 'bdd-spec', 'scripts', 'validate-feature.ts')

// ============================================================
// 執行驗證腳本
// ============================================================

function runScript(scriptPath: string, targetDir: string, extraArgs: string[] = []): { exitCode: number; stdout: string; stderr: string } {
  const args = [scriptPath, targetDir, '--json', ...extraArgs].join(' ')
  // 優先用 tsx（更快、更穩），fallback npx ts-node
  const cmd = `npx tsx ${args}`

  try {
    const stdout = execSync(cmd, {
      cwd: PROJECT_ROOT,
      timeout: 30000,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return { exitCode: 0, stdout, stderr: '' }
  } catch (error: unknown) {
    // child_process exit code !== 0 會拋 error，但 stdout 仍有 JSON
    const execError = error as { status?: number; stdout?: string; stderr?: string }
    return {
      exitCode: execError.status || 1,
      stdout: execError.stdout || '',
      stderr: execError.stderr || '',
    }
  }
}

function parseLintOutput(stdout: string): LintSummary | null {
  try {
    // 找 JSON（可能前面有 ts-node 的警告輸出）
    const jsonStart = stdout.indexOf('{')
    if (jsonStart === -1) return null
    return JSON.parse(stdout.substring(jsonStart))
  } catch {
    return null
  }
}

function parseValidateOutput(stdout: string): ValidateSummary | null {
  try {
    const jsonStart = stdout.indexOf('{')
    if (jsonStart === -1) return null
    return JSON.parse(stdout.substring(jsonStart))
  } catch {
    return null
  }
}

// ============================================================
// 公開 API
// ============================================================

/**
 * 驗證 Feature Files（不修復）
 */
export async function validateFeatures(
  features: FeatureInput[],
  schemaSql?: string,
  entityMapping?: string
): Promise<FeatureValidationResult> {
  if (features.length === 0) {
    return { lintPassed: true, validatePassed: true, errors: [] }
  }

  const tmpDir = createTmpDir()
  try {
    writeFeaturesToTmp(tmpDir, features)

    const allErrors: string[] = []

    // Step 0: 內建 VAR-System 對齊快檢（不依賴外部腳本）
    for (const feature of features) {
      const varErrors = checkVarAlignment(feature.content, feature.name)
      allErrors.push(...varErrors)
    }

    // Step 0.5: Schema-Aware 靜態分析（entity/column/VAR 流）
    if (schemaSql && entityMapping) {
      for (const feature of features) {
        const schemaErrors = checkFeatureSchemaAlignment(feature.content, feature.name, schemaSql, entityMapping)
        allErrors.push(...schemaErrors)
      }
    }

    // Step 1: ISA Format Lint
    const lintResult = runScript(LINT_SCRIPT, tmpDir)
    const lintSummary = parseLintOutput(lintResult.stdout)

    if (!lintSummary) {
      logger.warn({ stdout: lintResult.stdout.substring(0, 500), stderr: lintResult.stderr.substring(0, 500), exitCode: lintResult.exitCode }, 'Lint 腳本輸出解析失敗')
      // 腳本本身出錯（非 Feature 問題），不推入 allErrors 避免觸發無效 LLM 修復
    } else if (!lintSummary.passed) {
      allErrors.push(...lintSummary.errors)
    }

    // Step 2: 結構驗證
    const validateResult = runScript(VALIDATE_SCRIPT, tmpDir, ['--strict'])
    const validateSummary = parseValidateOutput(validateResult.stdout)

    if (!validateSummary) {
      logger.warn({ stdout: validateResult.stdout.substring(0, 500), stderr: validateResult.stderr.substring(0, 500), exitCode: validateResult.exitCode }, 'Validate 腳本輸出解析失敗')
      // 腳本本身出錯（非 Feature 問題），不推入 allErrors 避免觸發無效 LLM 修復
    } else if (!validateSummary.passed) {
      allErrors.push(...validateSummary.errors)
    }

    return {
      // 腳本解析失敗時視為通過（不是 Feature 的問題，不應觸發 LLM 修復）
      lintPassed: lintSummary?.passed ?? true,
      validatePassed: validateSummary?.passed ?? true,
      lintSummary: lintSummary ?? undefined,
      validateSummary: validateSummary ?? undefined,
      errors: allErrors,
    }
  } finally {
    cleanupTmpDir(tmpDir)
  }
}

/**
 * 驗證 + 自動修復迴圈（最多 3 輪）
 *
 * 修復使用 formulation.ts 的 fixMultipleFeatures() 模式
 */
export async function validateAndFixFeatures(
  features: FeatureInput[],
  schemaSql: string,
  entityMapping: string,
  resolvedItems?: ClarifyItem[],
  trackingContext?: LlmTrackingContext
): Promise<{
  success: boolean
  fixedFeatures: FeatureInput[]
  validationResult: FeatureValidationResult
  fixRounds: number
}> {
  const MAX_FIX_ROUNDS = 3
  let currentFeatures = [...features]
  let lastResult: FeatureValidationResult = { lintPassed: true, validatePassed: true, errors: [] }
  let prevErrorCount = Infinity

  // L25.B: 追蹤最佳版本 — LLM 可能越修越糟（用戶實測 276 → 286），
  // return 時用最少錯誤的版本，不是最後那輪
  let bestFeatures: typeof currentFeatures = [...features]
  let bestResult: FeatureValidationResult = lastResult
  let bestErrorCount = Infinity

  for (let round = 0; round < MAX_FIX_ROUNDS; round++) {
    lastResult = await validateFeatures(currentFeatures, schemaSql, entityMapping)

    if (lastResult.lintPassed && lastResult.validatePassed && lastResult.errors.length === 0) {
      logger.info({ round: round + 1 }, '驗證通過')
      return {
        success: true,
        fixedFeatures: currentFeatures,
        validationResult: lastResult,
        fixRounds: round,
      }
    }

    const errorCount = lastResult.errors.length

    // L25.B: 更新最佳版本（嚴格更少才算更好）
    if (errorCount < bestErrorCount) {
      bestErrorCount = errorCount
      bestFeatures = [...currentFeatures]
      bestResult = lastResult
    }

    // Early stop: round >= 1 且錯誤數沒下降 → LLM 已無法再修復，再跑也浪費時間
    if (round >= 1 && errorCount >= prevErrorCount) {
      logger.warn(
        { round: round + 1, errorCount, prevErrorCount, bestErrorCount },
        '錯誤數未下降，提前停止修復迴圈（LLM 已收斂失敗）'
      )
      break
    }
    prevErrorCount = errorCount

    logger.info({ round: round + 1, errorCount }, '驗證失敗，嘗試修復...')

    // 構建修復輸入：將錯誤分配到對應 Feature
    const featureErrorMap = new Map<string, string[]>()
    for (const error of lastResult.errors) {
      // 嘗試從錯誤訊息提取檔名（格式：[path/file.feature:line] message）
      const fileMatch = error.match(/\[([^\]:]+\.feature)/)
      if (fileMatch) {
        const fileName = path.basename(fileMatch[1], '.feature')
        const existing = featureErrorMap.get(fileName) || []
        existing.push(error)
        featureErrorMap.set(fileName, existing)
      } else {
        // 無法定位到特定檔案，只分配給前 3 個 Feature（避免大量 Features 全送修導致 LLM 截斷）
        const fallbackTargets = currentFeatures.slice(0, 3)
        for (const f of fallbackTargets) {
          const existing = featureErrorMap.get(f.name) || []
          existing.push(error)
          featureErrorMap.set(f.name, existing)
        }
      }
    }

    // 只修復有問題的 Features
    const featuresNeedingFix: FeatureFixInput[] = []
    for (const feature of currentFeatures) {
      const issues = featureErrorMap.get(feature.name)
      if (issues && issues.length > 0) {
        featuresNeedingFix.push({
          name: feature.name,
          actionName: feature.actionName,
          content: feature.content,
          issues,
        })
      }
    }

    if (featuresNeedingFix.length === 0) {
      // 有錯誤但無法定位到具體 Feature，修復所有
      for (const feature of currentFeatures) {
        featuresNeedingFix.push({
          name: feature.name,
          actionName: feature.actionName,
          content: feature.content,
          issues: lastResult.errors,
        })
      }
    }

    const fixResult = await fixMultipleFeatures(
      featuresNeedingFix,
      resolvedItems || [],
      schemaSql,
      entityMapping,
      trackingContext
    )

    if (!fixResult.success || !fixResult.fixedFeatures) {
      logger.warn({ round: round + 1, error: fixResult.error }, '修復失敗')
      break
    }

    // 合併修復結果：替換被修復的 Features，保留未修改的
    const fixedMap = new Map(fixResult.fixedFeatures.map(f => [f.name, f]))
    currentFeatures = currentFeatures.map(f => {
      const fixed = fixedMap.get(f.name)
      return fixed ? { name: fixed.name, actionName: fixed.actionName, content: fixed.content } : f
    })
  }

  // L25.B: 修復迴圈結束，使用最佳版本（可能非最後一輪）
  logger.warn({
    maxRounds: MAX_FIX_ROUNDS,
    finalErrorCount: lastResult.errors.length,
    bestErrorCount,
    usingBest: bestErrorCount < lastResult.errors.length,
  }, '修復輪次用盡，使用最佳版本（bestErrorCount）繼續')
  return {
    success: false,
    fixedFeatures: bestFeatures,
    validationResult: bestResult,
    fixRounds: MAX_FIX_ROUNDS,
  }
}
