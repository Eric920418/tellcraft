import * as yaml from 'js-yaml'

// ============================================================
// 類型定義
// ============================================================

export interface IsaConfigInput {
  features: Array<{ name: string; actionName: string; content: string }>
  entityMapping: string
  actionsYml: string
}

interface StepPattern {
  type: 'entity_setup' | 'action_call' | 'action_success' | 'operation_failure' | 'entity_validate'
  count: number
  examples: string[] // 前幾個匹配的原始行（用於 debug）
}

interface IsaInstruction {
  name: string
  format: string
  step_type: string
  executor: {
    type: 'plugin' | 'skip'
    plugin_python_path?: string
  }
  linters?: Array<{
    python_plugin_path: string
    config: Record<string, string>
  }>
  constraints?: string[]
  subpackage: string
  situation: string
}

// ============================================================
// 5 種步驟模式的 Regex
// 與 lint-gherkin-format.ts 和 05-isa-config.md 完全一致
// ============================================================

const STEP_REGEXES = {
  entity_setup: /^\s*(?:Given|And)\s+準備一個([\u4e00-\u9fffa-zA-Z]+), with table:\s*$/,
  action_call: /^\s*When\s+(.+), call table:\s*$/,
  action_success: /^\s*(?:Then|And)\s+(.+)成功,?\s*with table:\s*$/,
  operation_failure: /^\s*(?:Then|And)\s+操作失敗\s*$/,
  entity_validate: /^\s*(?:Then|And)\s+存在一個([\u4e00-\u9fffa-zA-Z]+), with table:\s*$/,
}

// ============================================================
// Executor 路徑模板（使用 <sdd_os_path> 佔位符）
// ============================================================

const EXECUTOR_PATHS = {
  supabase_setup: '<sdd_os_path>/src/sdd_os/features/executors/typescript/backend/setup/codegen/candidates/supabase_setup/executor.py',
  cucumberjs_server_action: '<sdd_os_path>/src/sdd_os/features/executors/typescript/backend/action_call/codegen/candidates/cucumberjs_server_action/executor.py',
  supabase_entity: '<sdd_os_path>/src/sdd_os/features/executors/typescript/backend/validator/codegen/candidates/supabase_entity/executor.py',
}

const LINTER_PATHS = {
  action_response_validation: '<sdd_os_path>/src/isa_linters/plugins/extensions/action_response_validation/action_response_validation_linter.py',
}

// ============================================================
// 掃描步驟模式
// ============================================================

function scanStepPatterns(features: Array<{ content: string }>): Map<string, StepPattern> {
  const patterns = new Map<string, StepPattern>()

  for (const [type, regex] of Object.entries(STEP_REGEXES)) {
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
// 生成 ISA Config Instructions
// ============================================================

function buildInstructions(detectedPatterns: Map<string, StepPattern>): IsaInstruction[] {
  const instructions: IsaInstruction[] = []

  // 1. Entity Setup (Given)
  if (detectedPatterns.get('entity_setup')!.count > 0) {
    instructions.push({
      name: 'Entity setup',
      format: '^準備一個(?P<entity>[\\u4e00-\\u9fffa-zA-Z]+), with table:$',
      step_type: 'Given',
      executor: {
        type: 'plugin',
        plugin_python_path: EXECUTOR_PATHS.supabase_setup,
      },
      constraints: [
        '<entity> must be a valid entity defined in entity_to_table_mapping.yml',
        'All column headers in the DataTable must be valid schema fields',
      ],
      subpackage: 'given',
      situation: 'to prepare test data in the database before Server Action calls',
    })
  }

  // 2. Action Call (When)
  if (detectedPatterns.get('action_call')!.count > 0) {
    instructions.push({
      name: 'Action call',
      format: '^(?P<summary>.+?), call table:$',
      step_type: 'When',
      executor: {
        type: 'plugin',
        plugin_python_path: EXECUTOR_PATHS.cucumberjs_server_action,
      },
      subpackage: 'action',
      situation: 'to invoke the Server Action with the given parameters',
    })
  }

  // 3. Action Success Validation (Then)
  if (detectedPatterns.get('action_success')!.count > 0) {
    instructions.push({
      name: 'Action success validation',
      format: '^(?P<summary>.+?)成功,?\\s*with table:$',
      step_type: 'Then',
      executor: {
        type: 'skip',
      },
      linters: [{
        python_plugin_path: LINTER_PATHS.action_response_validation,
        config: {
          actions_spec_path: 'spec/actions',
        },
      }],
      subpackage: 'then',
      situation: 'to validate the Server Action success response using table',
    })
  }

  // 4. Operation Failure (Then)
  if (detectedPatterns.get('operation_failure')!.count > 0) {
    instructions.push({
      name: 'Operation failure',
      format: '^操作失敗$',
      step_type: 'Then',
      executor: {
        type: 'skip',
      },
      subpackage: 'then',
      situation: 'to validate that the Server Action returned an error',
    })
  }

  // 5. Entity Validate (Then)
  if (detectedPatterns.get('entity_validate')!.count > 0) {
    instructions.push({
      name: 'Entity validate',
      format: '^存在一個(?P<entity>[\\u4e00-\\u9fffa-zA-Z]+), with table:$',
      step_type: 'Then',
      executor: {
        type: 'plugin',
        plugin_python_path: EXECUTOR_PATHS.supabase_entity,
      },
      constraints: [
        '<entity> must be a valid entity defined in entity_to_table_mapping.yml',
        'the entity\'s properties defined in the DataTable must match the entity spec',
        'All column headers in the DataTable must be valid schema structure paths',
      ],
      subpackage: 'then',
      situation: 'to validate the entity in the database with the given parameters',
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
    console.log(`[IsaConfig] 掃描完成：${patternSummary}`)

    // Step 2: 生成 instructions
    const instructions = buildInstructions(detectedPatterns)

    if (instructions.length === 0) {
      return { success: false, error: '沒有偵測到任何 ISA 步驟模式' }
    }

    // Step 3: 組裝 YAML
    const configObj = {
      instructions,
    }

    const header = `# isa_codegen.yml - sdd.os ISA 配置檔案
# 自動生成，基於 ${features.length} 個 Feature Files
# 專案技術棧：Next.js Server Actions + Supabase + PostgreSQL
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
      console.warn(`[IsaConfig] 覆蓋率不完整，${validation.unmatchedSteps.length} 個未匹配步驟:`,
        validation.unmatchedSteps.slice(0, 5))
    }

    console.log(`[IsaConfig] 生成完成，${instructions.length} 個 instructions`)
    return { success: true, isaConfigYml }
  } catch (err) {
    return { success: false, error: `生成失敗: ${err}` }
  }
}
