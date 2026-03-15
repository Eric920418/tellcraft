#!/usr/bin/env tsx
// ============================================================
// Coder Pipeline 端到端測試腳本
// 不依賴 Redis/Socket.io/BullMQ，直接在 VPS 執行
//
// 用法：cd tellcraft-backend && npx tsx --require dotenv/config src/scripts/test-coder-pipeline.ts
// ============================================================

import { validateEnv, getEnv } from '../lib/env'
import { Pool } from 'pg'

// ── 先驗證環境變數 ──
validateEnv()

const PROJECT_ID = '9f7bc354-a0a2-47b4-9de4-24aff98168b1'

// ── 直接建 Pool（不走 db/client.ts 避免它在 import 時就 new Pool）──
const env = getEnv()
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 3,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
})

// ============================================================
// 型別
// ============================================================

interface BddSessionRow {
  features_content: unknown[] | null
  actions_yml_content: string | null
  open_api_spec_content: string | null
  isa_config_content: string | null
  schema_sql_content: string | null
  entity_mapping_content: string | null
}

interface ProjectRow {
  neon_connection_string: string | null
}

// ============================================================
// Step 1: 讀取 BDD 資料
// ============================================================

async function loadBddData(): Promise<BddSessionRow> {
  console.log('\n📦 [Step 1] 讀取 BDD 資料...')

  const result = await pool.query<BddSessionRow>(
    `SELECT features_content, actions_yml_content, open_api_spec_content,
            isa_config_content, schema_sql_content, entity_mapping_content
     FROM bdd_sessions
     WHERE project_id = $1 AND actions_yml_content IS NOT NULL
     ORDER BY updated_at DESC LIMIT 1`,
    [PROJECT_ID]
  )

  const row = result.rows[0]
  if (!row) throw new Error('找不到 BDD session')
  if (!row.actions_yml_content) throw new Error('缺少 actionsYml')
  if (!row.schema_sql_content) throw new Error('缺少 schemaSql')

  const features = Array.isArray(row.features_content) ? row.features_content : []
  console.log(`  ✅ actions_yml: ${row.actions_yml_content.length} chars`)
  console.log(`  ✅ schema_sql: ${row.schema_sql_content.length} chars`)
  console.log(`  ✅ features: ${features.length} 個`)
  console.log(`  ✅ isa_config: ${row.isa_config_content ? row.isa_config_content.length + ' chars' : '無'}`)
  console.log(`  ✅ open_api_spec: ${row.open_api_spec_content ? row.open_api_spec_content.length + ' chars' : '無'}`)
  console.log(`  ✅ entity_mapping: ${row.entity_mapping_content ? row.entity_mapping_content.length + ' chars' : '無'}`)

  return row
}

// ============================================================
// Step 2: 讀取 Neon 連線字串
// ============================================================

async function loadNeonConnection(): Promise<string> {
  console.log('\n🔌 [Step 2] 讀取 Neon 連線字串...')

  const result = await pool.query<ProjectRow>(
    'SELECT neon_connection_string FROM projects WHERE id = $1',
    [PROJECT_ID]
  )

  const row = result.rows[0]
  if (!row?.neon_connection_string) throw new Error('找不到 Neon 連線字串')

  console.log(`  ✅ 連線字串: ${row.neon_connection_string.substring(0, 50)}...`)
  return row.neon_connection_string
}

// ============================================================
// Step 3: Stage A — 代碼生成
// ============================================================

async function runStageA(bdd: BddSessionRow) {
  console.log('\n🏗️  [Step 3] Stage A: 代碼生成（LLM 呼叫）...')
  console.log('  ⏳ 這需要幾分鐘（7 個 Sonnet LLM 呼叫）...\n')

  const { executeCoderPipeline } = await import('../services/coder-generation')

  const startTime = Date.now()
  const result = await executeCoderPipeline(
    {
      projectId: PROJECT_ID,
      actionsYml: bdd.actions_yml_content!,
      schemaSql: bdd.schema_sql_content!,
      entityMapping: bdd.entity_mapping_content || '',
      existingUiuxCode: { pages: [], components: [], styles: '' }, // 測試不含 UIUX
      trackingContext: { userId: 'test', conversationId: 'test-coder-pipeline' },
    },
    {
      onProgress: async (step, percent) => {
        process.stdout.write(`\r  [${percent}%] ${step}                    `)
      },
    }
  )

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n\n  ✅ Stage A 完成（${elapsed}s）`)
  console.log(`  ${result.summary}`)

  // 列出生成的檔案
  console.log('\n  📁 後端檔案:')
  for (const f of result.backendFiles) {
    const lines = f.content.split('\n').length
    console.log(`    ${f.path} (${lines} 行)`)
  }

  if (result.rewrittenFrontend.length > 0) {
    console.log('\n  📁 改寫的前端:')
    for (const f of result.rewrittenFrontend) {
      console.log(`    ${f.path}`)
    }
  }

  return result
}

// ============================================================
// Step 4: 保存代碼到 DB（可選）
// ============================================================

async function saveToDb(files: Array<{ path: string; content: string; description: string }>) {
  console.log('\n💾 [Step 4] 保存到 project_files...')

  for (const f of files) {
    const fileType = f.path.startsWith('lib/') ? 'lib'
      : f.path.startsWith('app/api/') ? 'api'
      : f.path.startsWith('app/actions/') ? 'action'
      : 'other'

    await pool.query(
      `INSERT INTO project_files (project_id, skill_source, file_path, content, description, file_type)
       VALUES ($1, 'coder', $2, $3, $4, $5)
       ON CONFLICT (project_id, skill_source, file_path) DO UPDATE SET content = $3, description = $4`,
      [PROJECT_ID, f.path, f.content, f.description || '', fileType]
    )
  }

  console.log(`  ✅ 保存了 ${files.length} 個檔案`)
}

// ============================================================
// Step 5: Stage B — SpecFormula 紅綠燈
// ============================================================

async function runStageB(
  bdd: BddSessionRow,
  backendFiles: Array<{ path: string; content: string; description: string }>,
  neonConnectionString: string,
) {
  console.log('\n🧪 [Step 5] Stage B: SpecFormula 測試（紅綠燈循環）...')
  console.log('  ⏳ 每輪測試：啟動 Express Test Server + 跑 Feature Scenarios...\n')

  const { runRedGreenCycle, formatTestResults } = await import('../services/specformula-runner')

  // 解析 featureFiles
  const rawFeatures = bdd.features_content
  const featureFiles: { name: string; content: string }[] = Array.isArray(rawFeatures)
    ? rawFeatures.map((f: unknown) => {
        const obj = f as Record<string, unknown>
        return {
          name: (obj.name as string) || (obj.featureName as string) || 'unknown',
          content: (obj.content as string) || (obj.featureContent as string) || '',
        }
      })
    : []

  if (featureFiles.length === 0) {
    throw new Error('Feature Files 為空')
  }

  console.log(`  📄 Feature Files: ${featureFiles.map(f => f.name).join(', ')}`)

  const startTime = Date.now()
  const result = await runRedGreenCycle({
    backendFiles,
    featureFiles,
    actionsYml: bdd.actions_yml_content!,
    openApiSpec: bdd.open_api_spec_content || '',
    isaConfigYml: bdd.isa_config_content || '',
    schemaSql: bdd.schema_sql_content || '',
    entityMapping: bdd.entity_mapping_content || '',
    neonConnectionString,
    maxAttempts: 3,
    trackingContext: { userId: 'test', conversationId: 'test-coder-pipeline' },
    onProgress: async (step, percent) => {
      process.stdout.write(`\r  [${percent}%] ${step}                    `)
    },
  })

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n\n  ⏱️  Stage B 完成（${elapsed}s, ${result.attempts} 輪）`)

  // 詳細報告
  const report = formatTestResults(result.testResults)
  console.log('\n' + '='.repeat(60))
  console.log(report)
  console.log('='.repeat(60))

  return result
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  Coder Pipeline 端到端測試')
  console.log(`  Project: ${PROJECT_ID}`)
  console.log(`  時間: ${new Date().toISOString()}`)
  console.log('═══════════════════════════════════════════════════════════')

  const startTime = Date.now()

  try {
    // Step 1: 讀取 BDD 資料
    const bdd = await loadBddData()

    // Step 2: 讀取 Neon 連線
    const neonConnectionString = await loadNeonConnection()

    // Step 3: Stage A — 代碼生成
    const stageAResult = await runStageA(bdd)

    // Step 4: 保存到 DB
    await saveToDb(stageAResult.backendFiles)

    // Step 5: Stage B — SpecFormula 測試
    const stageBResult = await runStageB(
      bdd,
      stageAResult.backendFiles,
      neonConnectionString,
    )

    // ── 最終摘要 ──
    const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log('\n═══════════════════════════════════════════════════════════')
    if (stageBResult.allPassed) {
      console.log(`  ✅ ALL PASSED（${stageBResult.testResults.passed}/${stageBResult.testResults.totalScenarios} scenarios）`)
    } else {
      console.log(`  ❌ ${stageBResult.testResults.passed}/${stageBResult.testResults.totalScenarios} passed, ${stageBResult.testResults.failed} failed`)
    }
    console.log(`  ⏱️  總耗時: ${totalElapsed}s`)
    console.log(`  🔄 修復輪數: ${stageBResult.attempts}`)
    console.log('═══════════════════════════════════════════════════════════')

    // 如果有修復過的代碼，也更新 DB
    if (stageBResult.attempts > 1) {
      console.log('\n💾 更新修復後的代碼到 DB...')
      await saveToDb(stageBResult.finalFiles)
    }

  } catch (err) {
    console.error('\n❌ 測試失敗:', err)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

main()
