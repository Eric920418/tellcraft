import type { Pool } from 'pg';
import type { Express } from 'express';

import { ScenarioContext } from '../context/scenario-context';
import { ISAFeatureArgumentResolver } from '../helper/isa-feature-argument-resolver';
import { IsaSpecReader } from '../spec/isa/isa-spec-reader';
import { ApiSpecReader } from '../spec/api/api-spec-reader';
import { EntityDdlReader } from '../spec/data/entity-ddl-reader';
import { SupertestAdapter } from '../http/supertest-adapter';
import { createInstructionSet } from './step-definition-factory';
import { registerSteps } from './register-steps';
import type { DatabaseSchema } from '../spec/data/models';
import type { IsaSpec } from '../spec/isa/models';
import type { ApiSpec } from '../spec/api/models';
import type { InstructionSet } from './step-definition-factory';

export interface BootstrapConfig {
  isaPath: string;
  app: Express;
  poolProvider: (dataSourceName: string) => Pool;
}

export interface BootstrapResult {
  isaSpec: IsaSpec;
  apiSpec: ApiSpec;
  schemas: DatabaseSchema[];
  instructionSet: InstructionSet;
  scenarioContext: ScenarioContext;
  resolver: ISAFeatureArgumentResolver;
  cleanupSchemas: () => Promise<void>;
}

/**
 * Bootstrap SpecFormula for Cucumber.js integration.
 *
 * Reads isa.yml → loads DDL + API spec → creates resolver + instructions → registers steps.
 * Returns handles for lifecycle management (Before/After hooks).
 */
export function bootstrap(
  config: BootstrapConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Given: (pattern: string | RegExp, fn: (...args: any[]) => Promise<void> | void) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  When: (pattern: string | RegExp, fn: (...args: any[]) => Promise<void> | void) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Then: (pattern: string | RegExp, fn: (...args: any[]) => Promise<void> | void) => void
): BootstrapResult {
  // 1. Read isa.yml
  const isaSpec = new IsaSpecReader(config.isaPath).read();

  // 2. Read API spec
  const apiSpec = new ApiSpecReader(isaSpec.config.api).read();

  // 3. Read DDL schemas
  const schemas: DatabaseSchema[] = [];
  for (const source of isaSpec.config.data.source) {
    const schema = new EntityDdlReader(source).read();
    schemas.push(schema);
  }

  // 4. Create scenario context + resolver
  const scenarioContext = new ScenarioContext();
  const resolver = new ISAFeatureArgumentResolver(() => scenarioContext);

  // 5. Create HTTP client (supertest)
  const httpClient = new SupertestAdapter(config.app);

  // 6. Create instruction set
  const instructionSet = createInstructionSet(
    resolver,
    () => scenarioContext,
    schemas,
    config.poolProvider,
    httpClient,
    apiSpec,
    isaSpec.config.api.time_format
  );

  // 7. Register step definitions
  registerSteps(isaSpec.instructions, instructionSet, Given, When, Then);

  // 8. Cleanup function for After hook
  const cleanupSchemas = async (): Promise<void> => {
    for (const schema of schemas) {
      const pool = config.poolProvider(schema.dataSourceName);
      const sqls = schema.buildCleanupSql();
      for (const sql of sqls) {
        try {
          await pool.query(sql);
        } catch (err) {
          console.warn(`[SpecFormula] Cleanup SQL failed: ${sql}`, err);
        }
      }
    }
  };

  return {
    isaSpec,
    apiSpec,
    schemas,
    instructionSet,
    scenarioContext,
    resolver,
    cleanupSchemas,
  };
}
