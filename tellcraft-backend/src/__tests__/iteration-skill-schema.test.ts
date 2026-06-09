/**
 * iteration-skill Schema 變更分支結構回歸測試
 *
 * 不 mock LLM/DB —— 純讀檔斷言關鍵函數、SQL 結構、telemetry patternKey、env flag
 * 都仍存在；保護未來重構不破壞架構契約
 */
import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

const repoRoot = path.resolve(__dirname, '../..')
const iterationSrc = fs.readFileSync(path.join(repoRoot, 'src/services/iteration-skill.ts'), 'utf-8')
const dslSrc = fs.readFileSync(path.join(repoRoot, 'src/services/schema-change-dsl.ts'), 'utf-8')
const intentSrc = fs.readFileSync(path.join(repoRoot, 'src/services/schema-iteration-intent.ts'), 'utf-8')
const envSrc = fs.readFileSync(path.join(repoRoot, 'src/lib/env.ts'), 'utf-8')
const migrationSrc = fs.readFileSync(path.join(repoRoot, 'migrations/043_add_schema_iteration_columns.sql'), 'utf-8')
const migrateSrc = fs.readFileSync(path.join(repoRoot, 'src/services/neon-migrate.ts'), 'utf-8')

describe('Schema iteration 架構契約守護', () => {
  it('classifyIterationScope 簽名包含 schema 第三類', () => {
    expect(iterationSrc).toMatch(/classifyIterationScope[\s\S]{0,200}'frontend'\s*\|\s*'fullstack'\s*\|\s*'schema'/m)
  })

  it('classifyIterationScope 守 ENABLE_SCHEMA_ITERATION flag', () => {
    const fnSection = iterationSrc.slice(
      iterationSrc.indexOf('function classifyIterationScope'),
      iterationSrc.indexOf('function classifyIterationScope') + 1500,
    )
    expect(fnSection).toContain('ENABLE_SCHEMA_ITERATION')
    expect(fnSection).toContain('detectSchemaChangeIntent')
  })

  it('executeIteration 主分流有 schema 分支且在 fullstack 之前', () => {
    const schemaIdx = iterationSrc.indexOf("if (scope === 'schema')")
    const fullstackIdx = iterationSrc.indexOf("if (scope === 'fullstack')")
    expect(schemaIdx).toBeGreaterThan(0)
    expect(fullstackIdx).toBeGreaterThan(0)
    expect(schemaIdx).toBeLessThan(fullstackIdx)
  })

  it('executeSchemaIteration 主流程 + helper 都存在；runAlterMigration 改 import 自 neon-migrate', () => {
    expect(iterationSrc).toMatch(/async function executeSchemaIteration\(/)
    expect(iterationSrc).toMatch(/async function planSchemaAndCodeChange\(/)
    expect(iterationSrc).toMatch(/async function applySchemaAndCode\(/)
    // A2：runAlterMigration 抽到 neon-migrate.ts（與 neon-service additive-drift 共用），iteration-skill 改用 import
    expect(iterationSrc).toMatch(/import\s*\{\s*runAlterMigration\s*\}\s*from\s*['"]\.\/neon-migrate['"]/)
    expect(migrateSrc).toMatch(/export async function runAlterMigration\(/)
  })

  it('runAlterMigration 用 transactional DDL（BEGIN/COMMIT）— 在 neon-migrate.ts', () => {
    const fnSection = migrateSrc.slice(
      migrateSrc.indexOf('async function runAlterMigration'),
      migrateSrc.indexOf('async function runAlterMigration') + 2000,
    )
    expect(fnSection).toContain("query('BEGIN')")
    expect(fnSection).toContain("query('COMMIT')")
    expect(fnSection).toContain("query('ROLLBACK')")
  })

  it('applySchemaAndCode transaction 失敗 → 跑 reverse SQL', () => {
    const fnSection = iterationSrc.slice(
      iterationSrc.indexOf('async function applySchemaAndCode'),
      iterationSrc.indexOf('async function applySchemaAndCode') + 6500,
    )
    expect(fnSection).toContain('runAlterMigration(connStr, reverse)')
    expect(fnSection).toContain('reversedAfterFailure')
  })

  it('applySchemaAndCode 成功時寫 generations 4 個新欄位', () => {
    const fnSection = iterationSrc.slice(
      iterationSrc.indexOf('async function applySchemaAndCode'),
      iterationSrc.indexOf('async function applySchemaAndCode') + 6500,
    )
    expect(fnSection).toContain('schema_migration_sql')
    expect(fnSection).toContain('reverse_migration_sql')
    expect(fnSection).toContain('schema_change_summary')
    expect(fnSection).toContain('schema_iteration_id')
  })

  it('Telemetry 5 個 patternKey 全部埋點', () => {
    const expectedKeys = [
      'schema_iteration_planned',
      'schema_iteration_applied',
      'schema_iteration_failed',
      'schema_iteration_rolled_back',
      'schema_destructive_blocked',
    ]
    for (const key of expectedKeys) {
      expect(iterationSrc).toContain(key)
    }
  })

  it('Phase 1 destructive 走 schema_destructive_blocked，不進 applySchemaAndCode', () => {
    const fnSection = iterationSrc.slice(
      iterationSrc.indexOf('async function executeSchemaIteration'),
      iterationSrc.indexOf('async function executeSchemaIteration') + 6000,
    )
    // destructive 分支標記
    expect(fnSection).toMatch(/classification !== 'additive'[\s\S]{0,500}schema_destructive_blocked/m)
  })

  it('LLM 規劃用 Sonnet 結構化輸出 + Zod', () => {
    const fnSection = iterationSrc.slice(
      iterationSrc.indexOf('async function planSchemaAndCodeChange'),
      iterationSrc.indexOf('async function planSchemaAndCodeChange') + 3000,
    )
    expect(fnSection).toContain('callStructured')
    expect(fnSection).toContain('MODEL.SONNET')
    expect(fnSection).toContain('SchemaIterationPlanSchema')
  })

  it('Cost guardrail SCHEMA_ITERATION_MAX_CHANGES_PER_CALL 生效', () => {
    expect(iterationSrc).toContain('SCHEMA_ITERATION_MAX_CHANGES_PER_CALL')
  })
})

describe('Migration 043 結構', () => {
  it('加 4 個欄位到 generations', () => {
    expect(migrationSrc).toContain('schema_migration_sql')
    expect(migrationSrc).toContain('reverse_migration_sql')
    expect(migrationSrc).toContain('schema_change_summary')
    expect(migrationSrc).toContain('schema_iteration_id')
  })

  it('用 IF NOT EXISTS 守護重跑安全', () => {
    expect(migrationSrc).toMatch(/ADD COLUMN IF NOT EXISTS schema_migration_sql/)
  })

  it('建 partial index 給 schema_iteration_id 查詢效能', () => {
    expect(migrationSrc).toContain('idx_generations_schema_iter')
    expect(migrationSrc).toContain('WHERE schema_iteration_id IS NOT NULL')
  })
})

describe('Env flag 結構', () => {
  it('ENABLE_SCHEMA_ITERATION 預設 false（安全 default）', () => {
    expect(envSrc).toMatch(/ENABLE_SCHEMA_ITERATION:\s*z\.stringbool\(\)\.default\(false\)/)
  })

  it('SCHEMA_ITERATION_MAX_CHANGES_PER_CALL 預設 10', () => {
    expect(envSrc).toMatch(/SCHEMA_ITERATION_MAX_CHANGES_PER_CALL:\s*z\.coerce\.number\(\)\.default\(10\)/)
  })
})

describe('DSL + intent 模組存在性', () => {
  it('DSL export schemaChangesToSql + classifySchemaChanges + isDestructive', () => {
    expect(dslSrc).toMatch(/export function schemaChangesToSql\(/)
    expect(dslSrc).toMatch(/export function classifySchemaChanges\(/)
    expect(dslSrc).toMatch(/export function isDestructive\(/)
  })

  it('DSL 9 個 SchemaChange variant 都在 union', () => {
    const variants = [
      'AddColumnChange', 'DropColumnChange', 'RenameColumnChange', 'AlterTypeChange',
      'AddIndexChange', 'DropIndexChange', 'AddTableChange', 'DropTableChange', 'AddForeignKeyChange',
    ]
    for (const v of variants) {
      expect(dslSrc).toContain(v)
    }
  })

  it('DSL identifier 白名單防 SQL injection', () => {
    expect(dslSrc).toMatch(/IDENTIFIER_RE\s*=\s*\/\^\[a-zA-Z_\]/)
    expect(dslSrc).toMatch(/validateIdentifier/)
  })

  it('Intent module 提供 detectSchemaChangeIntent', () => {
    expect(intentSrc).toMatch(/export function detectSchemaChangeIntent\(/)
    expect(intentSrc).toMatch(/hasIntent.*likelyDestructive.*signals/s)
  })
})
