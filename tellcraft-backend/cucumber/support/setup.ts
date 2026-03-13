import { BeforeAll, Before, After, AfterAll, Given, When, Then } from '@cucumber/cucumber';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

import { ScenarioContext } from '../../src/lib/specformula/context/scenario-context';
import { ISAFeatureArgumentResolver } from '../../src/lib/specformula/helper/isa-feature-argument-resolver';
import { IsaSpecReader } from '../../src/lib/specformula/spec/isa/isa-spec-reader';
import { ApiSpecReader } from '../../src/lib/specformula/spec/api/api-spec-reader';
import { EntityDdlReader } from '../../src/lib/specformula/spec/data/entity-ddl-reader';
import { SupertestAdapter } from '../../src/lib/specformula/http/supertest-adapter';
import { createInstructionSet, type InstructionSet } from '../../src/lib/specformula/cucumber/step-definition-factory';
import { registerSteps } from '../../src/lib/specformula/cucumber/register-steps';
import type { DatabaseSchema } from '../../src/lib/specformula/spec/data/models';
import type { SpecFormulaWorld } from './world';

/**
 * SpecFormula Cucumber.js lifecycle setup.
 *
 * IMPORTANT: Cucumber.js requires step definitions to be registered at
 * module load time (during the `require` phase), NOT in BeforeAll.
 * BeforeAll runs AFTER step matching, so late-registered steps = "Undefined".
 *
 * Strategy:
 *   1. Module load: Read isa.yml → register step definitions (regex + handler)
 *      - Handlers delegate to a mutable `instructionSet` reference
 *   2. BeforeAll: Connect DB → init schema → create instructionSet
 *   3. Before: Reset ScenarioContext
 *   4. After: TRUNCATE test data
 *   5. AfterAll: Close DB pool
 */

// ── Mutable state (set in BeforeAll, used by step handlers) ──
let instructionSet: InstructionSet | null = null;
const scenarioContext = new ScenarioContext();
const resolver = new ISAFeatureArgumentResolver(() => scenarioContext);
let pool: Pool | null = null;
let schemas: DatabaseSchema[] = [];

// ── Phase 1: Module load — read isa.yml + register steps synchronously ──
const isaPath = process.env.ISA_PATH || path.resolve(__dirname, '../e2e/isa.yml');
const isaSpec = new IsaSpecReader(isaPath).read();

// Create a lazy InstructionSet proxy: step handlers call these,
// actual instances are created in BeforeAll.
const lazyInstructionSet: InstructionSet = {
  get timeControl() { if (!instructionSet) throw new Error('[SpecFormula] Not initialized — BeforeAll has not run'); return instructionSet.timeControl; },
  get entitySetup() { if (!instructionSet) throw new Error('[SpecFormula] Not initialized'); return instructionSet.entitySetup; },
  get entityValidate() { if (!instructionSet) throw new Error('[SpecFormula] Not initialized'); return instructionSet.entityValidate; },
  get entityNonExistenceValidate() { if (!instructionSet) throw new Error('[SpecFormula] Not initialized'); return instructionSet.entityNonExistenceValidate; },
  get apiCall() { if (!instructionSet) throw new Error('[SpecFormula] Not initialized'); return instructionSet.apiCall; },
  get dataTableResponseValidate() { if (!instructionSet) throw new Error('[SpecFormula] Not initialized'); return instructionSet.dataTableResponseValidate; },
  get jsonResponseValidate() { if (!instructionSet) throw new Error('[SpecFormula] Not initialized'); return instructionSet.jsonResponseValidate; },
};

// Register step definitions NOW (module load time)
registerSteps(isaSpec.instructions, lazyInstructionSet, Given, When, Then);

// ── Phase 2: BeforeAll — DB + app + instruction setup ──
BeforeAll(async function () {
  const connectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      '[SpecFormula] TEST_DATABASE_URL or DATABASE_URL is required.\n' +
      'Example: TEST_DATABASE_URL=postgresql://user:pass@localhost/tellcraft_test'
    );
  }

  pool = new Pool({ connectionString, max: 5 });

  // Verify connection
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    throw new Error(`[SpecFormula] Cannot connect to database: ${err}`);
  }

  // Auto-init test schema if using e2e config
  if (!process.env.ISA_PATH) {
    const schemaPath = path.resolve(__dirname, '../e2e/data/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      await pool.query(schemaSql);
    }
  }

  // Load Express app
  let app;
  if (process.env.APP_MODULE_PATH) {
    const appModule = await import(process.env.APP_MODULE_PATH);
    app = appModule.app || appModule.default;
  } else {
    const testApp = await import('./test-app');
    testApp.setPool(pool);
    app = testApp.app;
  }

  if (!app) {
    throw new Error('[SpecFormula] Cannot find Express app.');
  }

  // Read specs
  const apiSpec = new ApiSpecReader(isaSpec.config.api).read();
  schemas = [];
  for (const source of isaSpec.config.data.source) {
    schemas.push(new EntityDdlReader(source).read());
  }

  // Create real instruction set
  const httpClient = new SupertestAdapter(app);
  instructionSet = createInstructionSet(
    resolver,
    () => scenarioContext,
    schemas,
    () => pool!,
    httpClient,
    apiSpec,
    isaSpec.config.api.time_format
  );
});

// ── Phase 3: Before — reset context ──
Before(function (this: SpecFormulaWorld) {
  scenarioContext.reset();
});

// ── Phase 4: After — cleanup test data ──
After(async function () {
  for (const schema of schemas) {
    const sqls = schema.buildCleanupSql();
    for (const sql of sqls) {
      try {
        await pool!.query(sql);
      } catch (err) {
        console.warn(`[SpecFormula] Cleanup SQL failed: ${sql}`, err);
      }
    }
  }
});

// ── Phase 5: AfterAll — close pool ──
AfterAll(async function () {
  if (pool) {
    await pool.end();
    pool = null;
  }
});
