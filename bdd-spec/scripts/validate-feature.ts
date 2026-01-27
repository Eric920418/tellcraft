#!/usr/bin/env npx ts-node
/**
 * validate-feature.ts
 *
 * 驗證 Gherkin Feature File 是否符合 sdd.os ISA 格式（Server Actions 版）
 *
 * 此腳本是 Quality Gate 的硬性閘門，Formulation 階段完成後必須執行。
 * 若驗證失敗（exit code 1），Skill 必須進入修正模式。
 *
 * 使用方式：
 *   npx ts-node validate-feature.ts <feature-file-or-directory>
 *   npx ts-node validate-feature.ts spec/features/ --json    # JSON 輸出（供程式解析）
 *   npx ts-node validate-feature.ts spec/features/ --strict  # 嚴格模式（警告也報錯）
 */

import * as fs from 'fs'
import * as path from 'path'

// ============================================================
// 類型定義
// ============================================================

interface ValidationResult {
  file: string
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

interface ValidationError {
  code: string
  message: string
  line?: number
  suggestion?: string
}

interface ValidationWarning {
  code: string
  message: string
  line?: number
}

interface SummaryResult {
  passed: boolean
  total_files: number
  valid_files: number
  total_errors: number
  total_warnings: number
  errors: string[]
  warnings: string[]
}

// ============================================================
// 錯誤代碼定義
// ============================================================

const ERROR_CODES = {
  MISSING_ACTION_ANNOTATION: 'E001',
  MISSING_SUMMARY_ANNOTATION: 'E002',
  MISSING_FEATURE_DECLARATION: 'E003',
  SUMMARY_FEATURE_MISMATCH: 'E004',
  RULE_MISSING_PRE_POST: 'E005',
  WHEN_FORMAT_INVALID: 'E006',
  THEN_FORMAT_INVALID: 'E007',
  NO_EXAMPLE: 'E008',
  RULE_WITHOUT_EXAMPLE: 'E009',
  DUPLICATE_RULE: 'E010',
}

const WARNING_CODES = {
  SUMMARY_FEATURE_INCONSISTENT: 'W001',
  THEN_FORMAT_AMBIGUOUS: 'W002',
  MISSING_BACKGROUND: 'W003',
  EMPTY_TABLE: 'W004',
}

// ============================================================
// sdd.os ISA 格式正規表示式（Server Actions 版）
// ============================================================

const PATTERNS = {
  actionAnnotation: /^#\s*Action:\s*(\w+)\s*$/m,
  summaryAnnotation: /^#\s*Summary:\s*(.+)\s*$/m,
  featureDeclaration: /^Feature:\s*(.+)\s*$/m,
  ruleDeclaration: /^\s*Rule:\s*(.+)\s*$/gm,
  ruleWithPrePost: /^\s*Rule:\s*(前置|後置)\s*-\s*(.+)\s*$/,
  exampleDeclaration: /^\s*Example:\s*(.+)\s*$/gm,
  scenarioDeclaration: /^\s*Scenario:\s*(.+)\s*$/gm,
  whenStep: /^\s*When\s+(.+)\s*$/gm,
  whenCallTable: /^\s*When\s+(.+),\s*call\s+table:\s*$/,
  thenStep: /^\s*Then\s+(.+)\s*$/gm,
  thenSuccess: /^\s*Then\s+(.+)成功,?\s*with\s+table:\s*$/,
  thenFailure: /^\s*Then\s+操作失敗\s*$/,
  entityValidation: /^\s*(?:And|Then)\s+存在一個(.+),\s*with\s+table:\s*$/,
  dataPreparation: /^\s*Given\s+準備一個(.+),\s*with\s+table:\s*$/,
  background: /^\s*Background:\s*$/m,
  dataTable: /^\s*\|.+\|\s*$/gm,
}

// ============================================================
// 驗證函數
// ============================================================

function validateFeatureFile(filePath: string): ValidationResult {
  const result: ValidationResult = {
    file: filePath,
    valid: true,
    errors: [],
    warnings: [],
  }

  if (!fs.existsSync(filePath)) {
    result.valid = false
    result.errors.push({
      code: 'E000',
      message: `檔案不存在: ${filePath}`,
    })
    return result
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')

  // 1. 檢查 Action 註解
  if (!PATTERNS.actionAnnotation.test(content)) {
    result.valid = false
    result.errors.push({
      code: ERROR_CODES.MISSING_ACTION_ANNOTATION,
      message: '缺少 Action 註解',
      suggestion: '在檔案開頭加入: # Action: functionName',
    })
  }

  // 2. 檢查 Summary 註解
  if (!PATTERNS.summaryAnnotation.test(content)) {
    result.valid = false
    result.errors.push({
      code: ERROR_CODES.MISSING_SUMMARY_ANNOTATION,
      message: '缺少 Summary 註解',
      suggestion: '在 Action 註解下方加入: # Summary: 功能名稱',
    })
  }

  // 3. 檢查 Feature 宣告
  if (!PATTERNS.featureDeclaration.test(content)) {
    result.valid = false
    result.errors.push({
      code: ERROR_CODES.MISSING_FEATURE_DECLARATION,
      message: '缺少 Feature 宣告',
      suggestion: '加入: Feature: 功能名稱',
    })
  }

  // 4. 檢查 Summary 與 Feature 名稱是否一致
  const summaryMatch = content.match(PATTERNS.summaryAnnotation)
  const featureMatch = content.match(PATTERNS.featureDeclaration)
  if (summaryMatch && featureMatch) {
    const summary = summaryMatch[1].trim()
    const featureName = featureMatch[1].trim()
    if (summary !== featureName) {
      result.valid = false
      result.errors.push({
        code: ERROR_CODES.SUMMARY_FEATURE_MISMATCH,
        message: `Summary "${summary}" 與 Feature 名稱 "${featureName}" 不一致`,
        suggestion: '確保 Summary 與 Feature 名稱完全相同',
      })
    }
  }

  // 5. 檢查所有 Rule 是否有前置/後置標註
  const ruleLines: { content: string; lineNum: number }[] = []
  lines.forEach((line, index) => {
    if (/^\s*Rule:/.test(line)) {
      ruleLines.push({ content: line, lineNum: index + 1 })
    }
  })

  const ruleNames = new Set<string>()
  for (const ruleLine of ruleLines) {
    const ruleContent = ruleLine.content.trim()

    // 檢查前置/後置標註
    if (!PATTERNS.ruleWithPrePost.test(ruleContent)) {
      result.valid = false
      result.errors.push({
        code: ERROR_CODES.RULE_MISSING_PRE_POST,
        message: `Rule 缺少前置/後置標註: "${ruleContent}"`,
        line: ruleLine.lineNum,
        suggestion: '格式應為: Rule: 前置 - 規則描述 或 Rule: 後置 - 規則描述',
      })
    }

    // 檢查重複 Rule
    const ruleNameMatch = ruleContent.match(/Rule:\s*(.+)/)
    if (ruleNameMatch) {
      const ruleName = ruleNameMatch[1].trim()
      if (ruleNames.has(ruleName)) {
        result.errors.push({
          code: ERROR_CODES.DUPLICATE_RULE,
          message: `重複的 Rule: "${ruleName}"`,
          line: ruleLine.lineNum,
        })
      }
      ruleNames.add(ruleName)
    }
  }

  // 6. 檢查 When 步驟格式
  lines.forEach((line, index) => {
    const whenMatch = line.match(/^\s*When\s+(.+)\s*$/)
    if (whenMatch) {
      const whenContent = whenMatch[1]
      if (!whenContent.includes(', call table:')) {
        result.valid = false
        result.errors.push({
          code: ERROR_CODES.WHEN_FORMAT_INVALID,
          message: `When 步驟格式錯誤: "${whenContent}"`,
          line: index + 1,
          suggestion: '格式應為: When {summary}, call table:',
        })
      }
    }
  })

  // 7. 檢查 Then 步驟格式
  lines.forEach((line, index) => {
    const thenMatch = line.match(/^\s*Then\s+(.+)\s*$/)
    if (thenMatch) {
      const thenContent = thenMatch[1].trim()
      const isSuccess = thenContent.includes('成功') && thenContent.includes('with table:')
      const isFailure = thenContent === '操作失敗'
      const isEntityValidation = thenContent.startsWith('存在一個')

      if (!isSuccess && !isFailure && !isEntityValidation) {
        result.warnings.push({
          code: WARNING_CODES.THEN_FORMAT_AMBIGUOUS,
          message: `Then 步驟格式可能不正確: "${thenContent}"`,
          line: index + 1,
        })
      }
    }
  })

  // 8. 檢查是否有 Example
  const exampleMatches = content.match(PATTERNS.exampleDeclaration)
  const scenarioMatches = content.match(PATTERNS.scenarioDeclaration)
  if (!exampleMatches && !scenarioMatches) {
    result.valid = false
    result.errors.push({
      code: ERROR_CODES.NO_EXAMPLE,
      message: '沒有找到任何 Example 或 Scenario',
      suggestion: '每個 Rule 至少需要一個 Example',
    })
  }

  // 9. 檢查每個 Rule 是否有對應的 Example
  // （這需要更複雜的解析邏輯，目前簡化處理）
  const exampleCount = (exampleMatches?.length || 0) + (scenarioMatches?.length || 0)
  if (ruleLines.length > 0 && exampleCount < ruleLines.length) {
    result.warnings.push({
      code: 'W005',
      message: `Rule 數量 (${ruleLines.length}) 大於 Example 數量 (${exampleCount})，可能有 Rule 缺少範例`,
    })
  }

  // 10. 檢查是否有 Background（非必要，但建議）
  if (!PATTERNS.background.test(content)) {
    result.warnings.push({
      code: WARNING_CODES.MISSING_BACKGROUND,
      message: '沒有 Background 區塊（建議用於設置共用測試資料）',
    })
  }

  // 更新 valid 狀態
  result.valid = result.errors.length === 0

  return result
}

function validateDirectory(dirPath: string): ValidationResult[] {
  const results: ValidationResult[] = []

  if (!fs.existsSync(dirPath)) {
    console.error(`目錄不存在: ${dirPath}`)
    process.exit(1)
  }

  const files = fs.readdirSync(dirPath)
  for (const file of files) {
    if (file.endsWith('.feature')) {
      const filePath = path.join(dirPath, file)
      results.push(validateFeatureFile(filePath))
    }
  }

  return results
}

// ============================================================
// 輸出函數
// ============================================================

function generateSummary(results: ValidationResult[]): SummaryResult {
  const allErrors: string[] = []
  const allWarnings: string[] = []

  for (const result of results) {
    for (const error of result.errors) {
      allErrors.push(`[${result.file}:${error.line || 0}] ${error.code}: ${error.message}`)
    }
    for (const warning of result.warnings) {
      allWarnings.push(`[${result.file}:${warning.line || 0}] ${warning.code}: ${warning.message}`)
    }
  }

  return {
    passed: results.every(r => r.valid),
    total_files: results.length,
    valid_files: results.filter(r => r.valid).length,
    total_errors: allErrors.length,
    total_warnings: allWarnings.length,
    errors: allErrors,
    warnings: allWarnings,
  }
}

function printHumanReadable(results: ValidationResult[], summary: SummaryResult): void {
  for (const result of results) {
    console.log(`\n📄 ${result.file}`)

    if (result.valid && result.warnings.length === 0) {
      console.log('   ✅ 驗證通過')
    } else {
      if (result.errors.length > 0) {
        console.log('   ❌ 錯誤:')
        for (const error of result.errors) {
          const lineInfo = error.line ? ` (行 ${error.line})` : ''
          console.log(`      [${error.code}]${lineInfo} ${error.message}`)
          if (error.suggestion) {
            console.log(`         💡 建議: ${error.suggestion}`)
          }
        }
      }

      if (result.warnings.length > 0) {
        console.log('   ⚠️  警告:')
        for (const warning of result.warnings) {
          const lineInfo = warning.line ? ` (行 ${warning.line})` : ''
          console.log(`      [${warning.code}]${lineInfo} ${warning.message}`)
        }
      }
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`驗證結果: ${summary.valid_files}/${summary.total_files} 個檔案通過`)
  console.log(`錯誤: ${summary.total_errors} | 警告: ${summary.total_warnings}`)

  if (summary.passed) {
    console.log('\n✅ Quality Gate 通過')
  } else {
    console.log('\n❌ Quality Gate 失敗 - 請修正上述錯誤後重新驗證')
  }
}

function printJson(summary: SummaryResult): void {
  console.log(JSON.stringify(summary, null, 2))
}

// ============================================================
// Main
// ============================================================

const args = process.argv.slice(2)

// 解析參數
const jsonMode = args.includes('--json')
const strictMode = args.includes('--strict')
const targetPath = args.find(arg => !arg.startsWith('--'))

if (!targetPath) {
  console.log('用法: npx ts-node validate-feature.ts <feature-file-or-directory> [--json] [--strict]')
  console.log('')
  console.log('選項:')
  console.log('  --json    輸出 JSON 格式（供程式解析）')
  console.log('  --strict  嚴格模式（警告也視為錯誤）')
  process.exit(1)
}

let results: ValidationResult[]

const stat = fs.statSync(targetPath)
if (stat.isDirectory()) {
  results = validateDirectory(targetPath)
} else {
  results = [validateFeatureFile(targetPath)]
}

// 生成摘要
const summary = generateSummary(results)

// 嚴格模式下，警告也視為失敗
if (strictMode && summary.total_warnings > 0) {
  summary.passed = false
}

// 輸出結果
if (jsonMode) {
  printJson(summary)
} else {
  printHumanReadable(results, summary)
}

// 設定 exit code
process.exit(summary.passed ? 0 : 1)
