#!/usr/bin/env npx ts-node
/**
 * lint-gherkin-format.ts
 *
 * 嚴格 Linter：確保生成的 .feature 檔案 100% 符合 isa.yml 中定義的 Regex 規範（SpecFormula 標準）
 *
 * 此腳本解決「Regex 與生成內容的脆弱耦合」問題：
 * - LLM 可能生成格式不正確的步驟
 * - 這些變體會導致 isa.yml 的 Regex 匹配失敗
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
// ISA Config 定義的精確 Regex 模式（SpecFormula 標準）
// 這些模式必須與 05-isa-config.md / isa.yml 完全一致
// ============================================================

const ISA_PATTERNS = {
  // Given 步驟 - 資料準備
  entitySetup: {
    name: 'Entity setup',
    stepType: 'Given',
    // 精確格式：準備一個{entity}, with table:
    regex: /^準備一個[\u4e00-\u9fffa-zA-Z0-9_]+, with table:$/,
    template: '準備一個{entity}, with table:',
    commonErrors: [
      { pattern: /準備一個.+,\s{2,}with table:/, fix: '移除多餘空格', suggestion: '`, with table:` 中逗號後只能有一個空格' },
      { pattern: /準備一個.+，with table:/, fix: '使用半形逗號', suggestion: '使用半形逗號 `,` 而非全形 `，`' },
      { pattern: /準備一個.+,with table:/, fix: '加入空格', suggestion: '逗號後需要一個空格' },
    ],
  },

  // Given 步驟 - 時間控制
  timeControl: {
    name: 'Time control',
    stepType: 'Given',
    // 精確格式：現在時間為 "{datetime}"
    regex: /^現在時間為 "[^"]+"$/,
    template: '現在時間為 "{datetime}"',
    commonErrors: [
      { pattern: /現在時間為"[^"]+"/, fix: '加入空格', suggestion: '「現在時間為」後需要一個空格' },
      { pattern: /現在時間為 [^"]+/, fix: '加入引號', suggestion: '日期時間需要用雙引號包圍' },
    ],
  },

  // When 步驟 - Action 呼叫（含 Actor 前綴）
  actionCall: {
    name: 'Action call',
    stepType: 'When',
    // 精確格式：(No Actor|UID="...") {summary}, call table:
    regex: /^\((?:No Actor|UID="[^"]+")\) .+, call table:$/,
    template: '(No Actor|UID="$var") {summary}, call table:',
    commonErrors: [
      { pattern: /^\(.+\)\s*.+,\s{2,}call table:/, fix: '移除多餘空格', suggestion: '`, call table:` 中逗號後只能有一個空格' },
      { pattern: /^\(.+\)\s*.+，call table:/, fix: '使用半形逗號', suggestion: '使用半形逗號 `,` 而非全形 `，`' },
      { pattern: /^\(.+\)\s*.+,call table:/, fix: '加入空格', suggestion: '逗號後需要一個空格' },
      { pattern: /^\(.+\)\s*.+, call_table:/, fix: '使用空格', suggestion: '使用 `call table:` 而非 `call_table:`' },
      { pattern: /^\(.+\)\s*.+, call table\s*$/, fix: '加入冒號', suggestion: '結尾需要冒號 `:`' },
      // 缺少 Actor 前綴（舊格式）
      { pattern: /^[^(].+, call table:$/, fix: '加入 Actor 前綴', suggestion: '必須有 `(No Actor)` 或 `(UID="$var")` 前綴' },
    ],
  },

  // Then 步驟 - 成功回應驗證（含 HTTP status code）
  responseValidate: {
    name: 'Response validation',
    stepType: 'Then',
    // 精確格式：{summary}(STATUS)回應, with table:
    regex: /^.+\(\d{3}\)回應,?\s*with table:$/,
    template: '{summary}(STATUS)回應, with table:',
    commonErrors: [
      { pattern: /.+\(\d{3}\)回應,\s{2,}with table:/, fix: '移除多餘空格', suggestion: '逗號後最多一個空格' },
      { pattern: /.+\(\d{3}\)回應，with table:/, fix: '使用半形逗號', suggestion: '使用半形逗號 `,` 而非全形 `，`' },
      // 舊格式：{summary}成功, with table:
      { pattern: /.+成功,?\s*with table:$/, fix: '改用新格式', suggestion: '請將 `{summary}成功, with table:` 改為 `{summary}(STATUS)回應, with table:`' },
    ],
  },

  // Then 步驟 - 成功回應 JSON 驗證
  responseValidateJson: {
    name: 'Response validation JSON',
    stepType: 'Then',
    // 精確格式：{summary}(STATUS)回應為, with JSON:
    regex: /^.+\(\d{3}\)回應為,?\s*with JSON:$/,
    template: '{summary}(STATUS)回應為, with JSON:',
    commonErrors: [
      { pattern: /.+\(\d{3}\)回應為,\s{2,}with JSON:/, fix: '移除多餘空格', suggestion: '逗號後最多一個空格' },
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

  // Then 步驟 - Entity 存在驗證
  entityValidate: {
    name: 'Entity validate',
    stepType: 'Then',
    // 精確格式：應該存在一個{entity}, with table:
    regex: /^應該存在一個[\u4e00-\u9fffa-zA-Z0-9_]+, with table:$/,
    template: '應該存在一個{entity}, with table:',
    commonErrors: [
      { pattern: /應該存在一個.+,\s{2,}with table:/, fix: '移除多餘空格', suggestion: '逗號後只能有一個空格' },
      { pattern: /應該存在一個.+，with table:/, fix: '使用半形逗號', suggestion: '使用半形逗號 `,` 而非全形 `，`' },
      { pattern: /應該存在一個.+,with table:/, fix: '加入空格', suggestion: '逗號後需要一個空格' },
      // 舊格式：存在一個{entity}, with table:
      { pattern: /^存在一個[\u4e00-\u9fffa-zA-Z0-9_]+, with table:$/, fix: '加入「應該」', suggestion: '請將 `存在一個` 改為 `應該存在一個`' },
    ],
  },

  // Then 步驟 - Entity 不存在驗證
  entityNonExistence: {
    name: 'Entity non-existence',
    stepType: 'Then',
    // 精確格式：應該不存在一個{entity}, with table:
    regex: /^應該不存在一個[\u4e00-\u9fffa-zA-Z0-9_]+, with table:$/,
    template: '應該不存在一個{entity}, with table:',
    commonErrors: [
      { pattern: /應該不存在一個.+,\s{2,}with table:/, fix: '移除多餘空格', suggestion: '逗號後只能有一個空格' },
      { pattern: /應該不存在一個.+，with table:/, fix: '使用半形逗號', suggestion: '使用半形逗號 `,` 而非全形 `，`' },
      { pattern: /應該不存在一個.+,with table:/, fix: '加入空格', suggestion: '逗號後需要一個空格' },
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
  // And/But 繼承前一步驟語義，根據 content 特徵判斷應匹配哪個 pattern
  const isGivenLike = keyword === 'Given' || keyword === 'And' || keyword === 'But'
  const isWhenLike  = keyword === 'When'  || keyword === 'And' || keyword === 'But'
  const isThenLike  = keyword === 'Then'  || keyword === 'And' || keyword === 'But'

  if (isGivenLike) {
    if (content.startsWith('準備一個')) {
      return ISA_PATTERNS.entitySetup
    }
    if (content.startsWith('現在時間為')) {
      return ISA_PATTERNS.timeControl
    }
  }

  if (isWhenLike) {
    if (content.includes('call table')) {
      return ISA_PATTERNS.actionCall
    }
  }

  if (isThenLike) {
    if (content === '操作失敗' || content.trim() === '操作失敗') {
      return ISA_PATTERNS.operationFailure
    }
    // 必須先判斷「回應為」再判斷「回應」，因為「回應為」包含「回應」
    if (content.includes('回應為') && content.includes('with JSON')) {
      return ISA_PATTERNS.responseValidateJson
    }
    if (content.includes('回應') && content.includes('with table')) {
      return ISA_PATTERNS.responseValidate
    }
    // 舊格式兼容偵測：{summary}成功, with table:
    if (content.includes('成功') && content.includes('with table')) {
      return ISA_PATTERNS.responseValidate
    }
    if (content.startsWith('應該存在一個')) {
      return ISA_PATTERNS.entityValidate
    }
    if (content.startsWith('應該不存在一個')) {
      return ISA_PATTERNS.entityNonExistence
    }
    // 舊格式兼容偵測：存在一個 / 不存在一個
    if (content.startsWith('存在一個') || content.startsWith('不存在一個')) {
      return ISA_PATTERNS.entityValidate
    }
  }

  return null
}

function lintStep(lineNum: number, keyword: string, content: string): LintError | null {
  // Scenario Outline 佔位符（<xxx>）— 跳過 lint（實際值在 Examples 表格中）
  if (/<[^>]+>/.test(content)) {
    return null
  }

  const pattern = determineExpectedPattern(keyword, content)

  if (!pattern) {
    return {
      line: lineNum,
      stepType: keyword,
      original: content,
      errorType: 'pattern_mismatch',
      message: '未支援的 ISA 步驟格式',
      suggestion: '僅支援：準備一個{entity}, with table: / 現在時間為 "..." / (No Actor|UID="$var") {summary}, call table: / {summary}(STATUS)回應, with table: / {summary}(STATUS)回應為, with JSON: / 操作失敗 / 應該存在一個{entity}, with table: / 應該不存在一個{entity}, with table:',
    }
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
  console.log('\n🔍 ISA Format Linter (SpecFormula) - 檢查 Gherkin 步驟是否符合 isa.yml Regex\n')

  for (const result of results) {
    console.log(`📄 ${result.file}`)
    console.log(`   步驟統計: ${result.stats.validSteps}/${result.stats.totalSteps} 通過`)

    if (result.passed) {
      console.log('   ✅ 所有步驟符合 ISA SpecFormula 格式\n')
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
    console.log('\n✅ ISA Format Lint 通過 - 所有步驟符合 SpecFormula 標準')
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
  console.log('  此腳本確保生成的 .feature 檔案 100% 符合 isa.yml 中定義的 Regex 規範（SpecFormula 標準）')
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
