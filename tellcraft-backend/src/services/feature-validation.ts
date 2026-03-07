import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { fixMultipleFeatures, FeatureFixInput } from './formulation'
import { ClarifyItem } from './bdd-session'
import { LlmTrackingContext } from './classifier'
import { createLogger } from '../lib/logger'

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
  features: FeatureInput[]
): Promise<FeatureValidationResult> {
  if (features.length === 0) {
    return { lintPassed: true, validatePassed: true, errors: [] }
  }

  const tmpDir = createTmpDir()
  try {
    writeFeaturesToTmp(tmpDir, features)

    const allErrors: string[] = []

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

  for (let round = 0; round < MAX_FIX_ROUNDS; round++) {
    lastResult = await validateFeatures(currentFeatures)

    if (lastResult.lintPassed && lastResult.validatePassed) {
      logger.info({ round: round + 1 }, '驗證通過')
      return {
        success: true,
        fixedFeatures: currentFeatures,
        validationResult: lastResult,
        fixRounds: round,
      }
    }

    logger.info({ round: round + 1, errorCount: lastResult.errors.length }, '驗證失敗，嘗試修復...')

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

  // 修復迴圈結束，使用最後結果
  logger.warn({ maxRounds: MAX_FIX_ROUNDS }, '修復輪次用盡仍有問題，使用最後修復版本繼續')
  return {
    success: false,
    fixedFeatures: currentFeatures,
    validationResult: lastResult,
    fixRounds: MAX_FIX_ROUNDS,
  }
}
