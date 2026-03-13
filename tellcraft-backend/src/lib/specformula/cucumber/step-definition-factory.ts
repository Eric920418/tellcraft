import type { ISAFeatureArgumentResolver } from '../helper/isa-feature-argument-resolver';
import type { ScenarioContext } from '../context/scenario-context';
import type { HttpClientAdapter } from '../http/http-client-adapter';
import type { ApiSpec } from '../spec/api/models';
import type { DatabaseSchema } from '../spec/data/models';
import type { Pool } from 'pg';

import { TimeControl } from '../instruction/time-control';
import { EntitySetup } from '../instruction/entity-setup';
import { EntityValidate } from '../instruction/entity-validate';
import { EntityNonExistenceValidate } from '../instruction/entity-non-existence-validate';
import { ApiCall } from '../instruction/api-call';
import { DataTableResponseValidate } from '../instruction/data-table-response-validate';
import { JsonResponseValidate } from '../instruction/json-response-validate';

export interface InstructionSet {
  timeControl: TimeControl;
  entitySetup: EntitySetup;
  entityValidate: EntityValidate;
  entityNonExistenceValidate: EntityNonExistenceValidate;
  apiCall: ApiCall;
  dataTableResponseValidate: DataTableResponseValidate;
  jsonResponseValidate: JsonResponseValidate;
}

/**
 * Creates all instruction instances from configuration.
 */
export function createInstructionSet(
  resolver: ISAFeatureArgumentResolver,
  contextSupplier: () => ScenarioContext,
  schemas: DatabaseSchema[],
  poolProvider: (dataSourceName: string) => Pool,
  httpClient: HttpClientAdapter,
  apiSpec: ApiSpec,
  timeFormat?: string
): InstructionSet {
  return {
    timeControl: new TimeControl(resolver),
    entitySetup: new EntitySetup(resolver, schemas, poolProvider),
    entityValidate: new EntityValidate(resolver, schemas, poolProvider),
    entityNonExistenceValidate: new EntityNonExistenceValidate(resolver, schemas, poolProvider),
    apiCall: new ApiCall(resolver, contextSupplier, httpClient, apiSpec, timeFormat),
    dataTableResponseValidate: new DataTableResponseValidate(resolver, contextSupplier, apiSpec),
    jsonResponseValidate: new JsonResponseValidate(resolver, contextSupplier, apiSpec),
  };
}
