/**
 * Database dialect interface.
 * Only PostgreSQL is supported in the TypeScript port.
 */
export interface DatabaseDialect {
  readonly dbType: string;
  buildTruncateSql(tableName: string): string;
  buildResetSequenceSql(tableName: string, columnName: string): string;
}
