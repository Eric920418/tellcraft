#!/usr/bin/env npx ts-node
/**
 * lint-gherkin-format.ts
 *
 * 嚴格 Linter：確保生成的 .feature 檔案 100% 符合 isa-config 中定義的 Regex 規範
 *
 * 此腳本解決「Regex 與生成內容的脆弱耦合」問題：
 * - LLM 可能生成 `call table :` (多空格) 或 `call_table:` (底線)
 * - 這些變體會導致 isa-config 的 Regex 匹配失敗
 * - 此腳本在 Formulation 階段結束前強制執行，確保 100% 相容
 *
 * 使用方式：
 *   npx ts-node lint-gherkin-format.ts <feature-file-or-directory>
 *   npx ts-node lint-gherkin-format.ts spec/features/ --json
 *   npx ts-node lint-gherkin-format.ts spec/features/ --fix  # 自動修復（實驗性）
 */

import * as fs from 'fs'
import * as path from 'path'

// ============================================================
// ISA Config 定義的精確 Regex 模式
// 這些模式必須與 05-isa-config.md 完全一致
// ============================================================

const ISA_PATTERNS = {
  // Given 步驟 - 資料準備
  entitySetup: {
    name: 'Entity setup',
    stepType: 'Given',
    // 精確格式：準備一個{entity}, with table:
    regex: /^準備一個[\u4e00-\u9fffa-zA-Z]+, with table:$/,
    template: '準備一個{entity}, with table:',
    commonErrors: [
      { pattern: /準備一個.+,\s{2,}with table:/, fix: '移除多餘空格', suggestion: '`, with table:` 中逗號後只能有一個空格' },
      { pattern: /準備一個.+，with table:/, fix: '使用半形逗號', suggestion: '使用半形逗號 `,` 而非全形 `，`' },
      { pattern: /準備一個.+,with table:/, fix: '加入空格', suggestion: '逗號後需要一個空格' },
    ],
  },

  // When 步驟 - Action 呼叫
  actionCall: {
    name: 'Action call',
    stepType: 'When',
    // 精確格式：{summary}, call table:
    regex: /^.+, call table:$/,
    template: '{summary}, call table:',
    commonErrors: [
      { pattern: /.+,\s{2,}call table:/, fix: '移除多餘空格', suggestion: '`, call table:` 中逗號後只能有一個空格' },
      { pattern: /.+，call table:/, fix: '使用半形逗號', suggestion: '使用半形逗號 `,` 而非全形 `，`' },
      { pattern: /.+,call table:/, fix: '加入空格', suggestion: '逗號後需要一個空格' },
      { pattern: /.+, call_table:/, fix: '使用空格', suggestion: '使用 `call table:` 而非 `call_table:`' },
      { pattern: /.+, call table\s*$/, fix: '加入冒號', suggestion: '結尾需要冒號 `:`' },
      { pattern: /.+,\s*calltable:/, fix: '加入空格', suggestion: '`call` 和 `table` 之間需要空格' },
    ],
  },

  // Then 步驟 - 成功回應驗證
  actionSuccess: {
    name: 'Action success validation',
    stepType: 'Then',
    // 精確格式：{summary}成功, with table: 或 {summary}成功,with table:
    regex: /^.+成功,?\s*with table:$/,
    template: '{summary}成功, with table:',
    commonErrors: [
      { pattern: /.+成功\s+, with table:/, fix: '移除空格', suggestion: '`成功` 和逗號之間不應有空格' },
      { pattern: /.+成功，with table:/, fix: '使用半形逗號', suggestion: '使用半形逗號 `,` 而非全形 `，`' },
      { pattern: /.+成功,\s{2,}with table:/, fix: '移除多餘空格', suggestion: '逗號後最多一個空格' },
      { pattern: /.+成功, with_table:/, fix: '使用空格', suggestion: '使用 `with table:` 而非 `with_table:`' },
    ],
  },

  // Then 步驟 - 操作失敗
  operationFailure: {
    name: 'Operation failure',
    stepType: 'Then',
    // 精確格式：操作失敗
    regex: /^操作失敗$/,
    template: '操作失敗',
    commonErrors: [
      { pattern: /^操作失敗\s+$/, fix: '移除尾部空格', suggestion: '結尾不應有空格' },
      { pattern: /^操作 失敗$/, fix: '移除中間空格', suggestion: '`操作失敗` 中間不應有空格' },
    ],
  },

  // Then 步驟 - Entity 驗證
  entityValidate: {
    name: 'Entity validate',
    stepType: 'Then',
    // 精確格式：存在一個{entity}, with table:
    regex: /^存在一個[\u4e00-\u9fffa-zA-Z]+, with table:$/,
    template: '存在一個{entity}, with table:',
    commonErrors: [
      { pattern: /存在一個.+,\s{2,}with table:/, fix: '移除多餘空格', suggestion: '逗號後只能有一個空格' },
      { pattern: /存在一個.+，with table:/, fix: '使用半形逗號', suggestion: '使用半形逗號 `,` 而非全形 `，`' },
      { pattern: /存在一個.+,with table:/, fix: '加入空格', suggestion: '逗號後需要一個空格' },
    ],
  },
}

// ============================================================
// 類型定義
// ============================================================

interface LintError {
  line: number
  column?: number
  stepType: string
  original: string
  errorType: 'pattern_mismatch' | 'common_error'
  message: string
  suggestion?: string
  autoFix?: string
}

interface LintResult {
  file: string
  passed: boolean
  errors: LintError[]
  stats: {
    totalSteps: number
    validSteps: number
    invalidSteps: number
  }
}

interface LintSummary {
  passed: boolean
  totalFiles: number
  passedFiles: number
  totalErrors: number
  errors: string[]
  filesWithErrors: string[]
}

// ============================================================
// 核心 Lint 函數
// ============================================================

function extractStepContent(line: string): { keyword: string; content: string } | null {
  const match = line.match(/^\s*(Given|When|Then|And|But)\s+(.+)$/)
  if (match) {
    return { keyword: match[1], content: match[2] }
  }
  return null
}

function determineExpectedPattern(keyword: string, content: string): typeof ISA_PATTERNS[keyof typeof ISA_PATTERNS] | null {
  // 根據 keyword 和 content 特徵判斷應該匹配哪個 pattern
  if (keyword === 'Given' || (keyword === 'And' && content.startsWith('準備一個'))) {
    if (content.startsWith('準備一個')) {
      return ISA_PATTERNS.entitySetup
    }
  }

  if (keyword === 'When') {
    if (content.includes('call table')) {
      return ISA_PATTERNS.actionCall
    }
  }

  if (keyword === 'Then' || keyword === 'And') {
    if (content === '操作失敗' || content.trim() === '操作失敗') {
      return ISA_PATTERNS.operationFailure
    }
    if (content.includes('成功') && content.includes('with table')) {
      return ISA_PATTERNS.actionSuccess
    }
    if (content.startsWith('存在一個')) {
      return ISA_PATTERNS.entityValidate
    }
  }

  return null
}

function lintStep(lineNum: number, keyword: string, content: string): LintError | null {
  const pattern = determineExpectedPattern(keyword, content)

  if (!pattern) {
    // 步驟不屬於任何已知的 ISA 模式，跳過
    return null
  }

  // 檢查是否精確匹配 ISA regex
  if (pattern.regex.test(content)) {
    return null // 通過
  }

  // 檢查常見錯誤
  for (const commonError of pattern.commonErrors) {
    if (commonError.pattern.test(content)) {
      return {
        line: lineNum,
        stepType: keyword,
        original: content,
        errorType: 'common_error',
        message: `格式錯誤：${commonError.fix}`,
        suggestion: commonError.suggestion,
        autoFix: content.replace(commonError.pattern, (match) => {
          // 嘗試自動修復
          return match.replace(/\s{2,}/g, ' ').replace(/，/g, ',')
        }),
      }
    }
  }

  // 通用不匹配錯誤
  return {
    line: lineNum,
    stepType: keyword,
    original: content,
    errorType: 'pattern_mismatch',
    message: `不符合 ISA 格式 "${pattern.name}"`,
    suggestion: `應為: ${pattern.template}`,
  }
}

function lintFeatureFile(filePath: string): LintResult {
  const result: LintResult = {
    file: filePath,
    passed: true,
    errors: [],
    stats: {
      totalSteps: 0,
      validSteps: 0,
      invalidSteps: 0,
    },
  }

  if (!fs.existsSync(filePath)) {
    result.passed = false
    result.errors.push({
      line: 0,
      stepType: 'N/A',
      original: '',
      errorType: 'pattern_mismatch',
      message: `檔案不存在: ${filePath}`,
    })
    return result
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const step = extractStepContent(line)

    if (!step) continue

    result.stats.totalSteps++

    const error = lintStep(i + 1, step.keyword, step.content)

    if (error) {
      result.errors.push(error)
      result.stats.invalidSteps++
      result.passed = false
    } else {
      result.stats.validSteps++
    }
  }

  return result
}

function lintDirectory(dirPath: string): LintResult[] {
  const results: LintResult[] = []

  if (!fs.existsSync(dirPath)) {
    console.error(`目錄不存在: ${dirPath}`)
    process.exit(1)
  }

  const files = fs.readdirSync(dirPath)
  for (const file of files) {
    if (file.endsWith('.feature')) {
      const filePath = path.join(dirPath, file)
      results.push(lintFeatureFile(filePath))
    }
  }

  return results
}

// ============================================================
// 輸出函數
// ============================================================

function generateSummary(results: LintResult[]): LintSummary {
  const allErrors: string[] = []
  const filesWithErrors: string[] = []

  for (const result of results) {
    if (!result.passed) {
      filesWithErrors.push(result.file)
    }
    for (const error of result.errors) {
      allErrors.push(`[${result.file}:${error.line}] ${error.message}`)
    }
  }

  return {
    passed: results.every((r) => r.passed),
    totalFiles: results.length,
    passedFiles: results.filter((r) => r.passed).length,
    totalErrors: allErrors.length,
    errors: allErrors,
    filesWithErrors,
  }
}

function printHumanReadable(results: LintResult[], summary: LintSummary): void {
  console.log('\n🔍 ISA Format Linter - 檢查 Gherkin 步驟是否符合 isa-config Regex\n')

  for (const result of results) {
    console.log(`📄 ${result.file}`)
    console.log(`   步驟統計: ${result.stats.validSteps}/${result.stats.totalSteps} 通過`)

    if (result.passed) {
      console.log('   ✅ 所有步驟符合 ISA 格式\n')
    } else {
      console.log('   ❌ 發現格式問題:\n')
      for (const error of result.errors) {
        console.log(`      行 ${error.line} [${error.stepType}]: ${error.message}`)
        console.log(`         原始: "${error.original}"`)
        if (error.suggestion) {
          console.log(`         💡 ${error.suggestion}`)
        }
        if (error.autoFix) {
          console.log(`         🔧 建議修正為: "${error.autoFix}"`)
        }
        console.log('')
      }
    }
  }

  console.log('='.repeat(60))
  console.log(`Lint 結果: ${summary.passedFiles}/${summary.totalFiles} 個檔案通過`)
  console.log(`錯誤總數: ${summary.totalErrors}`)

  if (summary.passed) {
    console.log('\n✅ ISA Format Lint 通過 - 所有步驟符合 isa-config Regex 規範')
  } else {
    console.log('\n❌ ISA Format Lint 失敗')
    console.log('   這些格式錯誤會導致 sdd.os 無法解析步驟')
    console.log('   請修正後重新執行 lint')
  }
}

function printJson(summary: LintSummary): void {
  console.log(JSON.stringify(summary, null, 2))
}

// ============================================================
// 自動修復（實驗性）
// ============================================================

function autoFixFile(filePath: string, result: LintResult): boolean {
  if (result.passed) return true

  let content = fs.readFileSync(filePath, 'utf-8')
  let fixed = false

  for (const error of result.errors) {
    if (error.autoFix && error.original) {
      const oldLine = content.split('\n').find((l) => l.includes(error.original))
      if (oldLine) {
        const newLine = oldLine.replace(error.original, error.autoFix)
        content = content.replace(oldLine, newLine)
        fixed = true
        console.log(`🔧 修復 ${filePath}:${error.line}`)
        console.log(`   - "${error.original}"`)
        console.log(`   + "${error.autoFix}"`)
      }
    }
  }

  if (fixed) {
    fs.writeFileSync(filePath, content, 'utf-8')
  }

  return fixed
}

// ============================================================
// Main
// ============================================================

const args = process.argv.slice(2)

const jsonMode = args.includes('--json')
const fixMode = args.includes('--fix')
const targetPath = args.find((arg) => !arg.startsWith('--'))

if (!targetPath) {
  console.log('用法: npx ts-node lint-gherkin-format.ts <feature-file-or-directory> [--json] [--fix]')
  console.log('')
  console.log('選項:')
  console.log('  --json    輸出 JSON 格式（供程式解析）')
  console.log('  --fix     嘗試自動修復格式問題（實驗性）')
  console.log('')
  console.log('說明:')
  console.log('  此腳本確保生成的 .feature 檔案 100% 符合 isa-config 中定義的 Regex 規範')
  console.log('  在 Formulation 階段結束前必須執行，否則 sdd.os 無法解析步驟')
  process.exit(1)
}

let results: LintResult[]

const stat = fs.statSync(targetPath)
if (stat.isDirectory()) {
  results = lintDirectory(targetPath)
} else {
  results = [lintFeatureFile(targetPath)]
}

// 自動修復模式
if (fixMode) {
  console.log('\n🔧 自動修復模式\n')
  for (let i = 0; i < results.length; i++) {
    if (!results[i].passed) {
      autoFixFile(results[i].file, results[i])
      // 重新 lint
      results[i] = lintFeatureFile(results[i].file)
    }
  }
}

const summary = generateSummary(results)

if (jsonMode) {
  printJson(summary)
} else {
  printHumanReadable(results, summary)
}

process.exit(summary.passed ? 0 : 1)
