import type { DatabaseDialect } from './database-dialect';

export class PostgresDialect implements DatabaseDialect {
  readonly dbType = 'postgresql';

  buildTruncateSql(tableName: string): string {
    return `TRUNCATE TABLE ${tableName} CASCADE`;
  }

  buildResetSequenceSql(tableName: string, columnName: string): string {
    return `ALTER SEQUENCE IF EXISTS ${tableName}_${columnName}_seq RESTART WITH 1`;
  }
}
