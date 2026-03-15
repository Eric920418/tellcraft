// ============================================================
// SpecFormula Runner — Feature File 直接執行器 + Mini Express Test Server
// 不依賴 Cucumber.js runtime，直接解析 Feature Files 並執行步驟
// ============================================================

import * as yaml from 'js-yaml'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
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
  EntityDdlReader,
  ApiSpecReader,
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
        const headers = (rows[0].cells || []).map((c: { value: string }) => c.value)
        const dataRows = rows.slice(1).map((row: { cells: Array<{ value: string }> }) => {
          const obj: Record<string, string> = {}
          const cells = row.cells || []
          headers.forEach((h: string, i: number) => {
            obj[h] = cells[i]?.value ?? ''
          })
          return obj
        })
        step.dataTable = { headers, rows: dataRows }
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
// 步驟執行
// ============================================================

async function executeStep(
  step: ParsedStep,
  matched: MatchResult,
  instructionSet: InstructionSet,
  scenarioContext: ScenarioContext,
  featureSummary?: string
): Promise<StepResult> {
  const start = Date.now()
  const keyword = step.keyword.trim()
  const { instruction, captures } = matched

  try {
    switch (instruction.instruction_type) {
      case 'entity_setup': {
        if (!step.dataTable) throw new Error('entity_setup 需要 DataTable')
        await instructionSet.entitySetup.setup(
          captures.entity,
          step.dataTable.headers,
          step.dataTable.rows
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
        if (captures.actor) {
          await instructionSet.apiCall.invokeWithActor(
            step.dataTable.headers,
            step.dataTable.rows,
            summary
          )
        } else {
          await instructionSet.apiCall.invokeWithoutActor(
            step.dataTable.headers,
            step.dataTable.rows,
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
          instructionSet.dataTableResponseValidate.validate(
            captures.summary,
            statusCode,
            step.dataTable.headers,
            step.dataTable.rows
          )
        }
        break
      }

      case 'entity_validate': {
        if (!step.dataTable) throw new Error('entity_validate 需要 DataTable')
        await instructionSet.entityValidate.assertExists(
          captures.entity,
          step.dataTable.headers,
          step.dataTable.rows
        )
        break
      }

      case 'entity_non_existence_validate': {
        if (!step.dataTable) throw new Error('entity_non_existence_validate 需要 DataTable')
        await instructionSet.entityNonExistenceValidate.assertNotExists(
          captures.entity,
          step.dataTable.rows
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
  scenarioContext: ScenarioContext
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

    const stepResult = await executeStep(step, matched, instructionSet, scenarioContext, feature.name)
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
        scenarioContext
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

      if (KNOWN_PACKAGES[pkgName]) {
        deps[pkgName] = KNOWN_PACKAGES[pkgName]
      } else {
        deps[pkgName] = 'latest'
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
    const pgDbContent = `import { Pool } from 'pg'
console.log('[db.ts] pg Pool 版本已載入 — DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 30) + '...')
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
export async function sql<T = any>(query: string, params?: any[]): Promise<T[]> {
  try {
    const result = await pool.query(query, params)
    return result.rows as T[]
  } catch (err: any) {
    console.error('[db.ts] SQL ERROR:', err.message, '\\nQuery:', typeof query === 'string' ? query.substring(0, 200) : 'NON-STRING:' + JSON.stringify(query).substring(0, 200), '\\nParams:', JSON.stringify(params)?.substring(0, 200))
    throw err
  }
}
export default sql
`
    const dbFilePath = path.join(tmpDir, 'lib/db.ts')
    fs.mkdirSync(path.dirname(dbFilePath), { recursive: true })
    fs.writeFileSync(dbFilePath, pgDbContent, 'utf-8')
    logger.info('lib/db.ts 已覆寫為 pg Pool 版本')

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

  return `import express from 'express'
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
      logger.warn({ stderr: errText.slice(0, 200) }, 'test server stderr')
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

    // 3. 建立 DB pool（直接連 Neon）+ monkey-patch 偵測 @ 錯誤來源
    const pool = new Pool({ connectionString: input.neonConnectionString })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const origQuery = pool.query.bind(pool)
    const _origQuery = pool.query.bind(pool) as (...a: unknown[]) => Promise<any>
    ;(pool as any).query = async (...args: unknown[]) => {
      try {
        return await _origQuery(...args)
      } catch (err: any) {
        if (err?.message?.includes('@')) {
          logger.error({
            sql: typeof args[0] === 'string' ? args[0].substring(0, 300) : 'non-string',
            params: JSON.stringify(args[1])?.substring(0, 300),
            error: err.message,
          }, '❌ @ 錯誤 SQL 偵測')
        }
        throw err
      }
    }

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

    // 跑測試
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
