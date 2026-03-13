import type { Pool } from 'pg';
import type { ISAFeatureArgumentResolver } from '../helper/isa-feature-argument-resolver';
import { NamingConverter } from '../helper/naming-converter';
import { TypeConverter } from '../helper/type-converter';
import { DatabaseSchema, type TableDefinition } from '../spec/data/models';

/**
 * Entity 不存在性驗證指令。
 * 驗證 DataTable 內的每一列在資料庫中都不存在符合條件的記錄。
 */
export class EntityNonExistenceValidate {
  private readonly resolver: ISAFeatureArgumentResolver;
  private readonly schemas: DatabaseSchema[];
  private readonly poolProvider: (dataSourceName: string) => Pool;

  constructor(
    resolver: ISAFeatureArgumentResolver,
    schemas: DatabaseSchema[],
    poolProvider: (dataSourceName: string) => Pool
  ) {
    this.resolver = resolver;
    this.schemas = schemas;
    this.poolProvider = poolProvider;
  }

  async assertNotExists(entityName: string, rows: Record<string, string>[]): Promise<void> {
    const pair = DatabaseSchema.findSchemaAndTable(this.schemas, entityName);
    if (!pair) {
      throw new Error(
        `[EntityNonExistenceValidate] 找不到 entity '${entityName}' 的定義。請確認 entity_to_table_mapping 設定。`
      );
    }

    const { schema, table: tableDef } = pair;
    const pool = this.poolProvider(schema.dataSourceName);
    const pkColumns = tableDef.pkColumns;

    for (const row of rows) {
      // 嘗試收集 PK 值
      const pkValues = new Map<string, unknown>();
      let hasAllPks = pkColumns.size > 0;

      for (const pkCol of pkColumns) {
        const pkRaw = NamingConverter.getRowValue(row, pkCol);
        if (!pkRaw || !pkRaw.trim() || pkRaw.trim().startsWith('&')) {
          hasAllPks = false;
          break;
        }
        const resolvedPk = this.resolver.resolveVariable(pkRaw);
        const typed = TypeConverter.convertToColumnType(
          resolvedPk != null ? resolvedPk : pkRaw,
          tableDef.findColumnType(pkCol)
        );
        pkValues.set(pkCol, typed);
      }

      if (hasAllPks) {
        const exists = await this.existsByPk(tableDef, pkValues, pool);
        if (exists) {
          throw new Error(
            `${entityName} with ${JSON.stringify(Object.fromEntries(pkValues))} should not exist`
          );
        }
      } else {
        const conditions = this.buildProbeConditions(row, tableDef);
        if (conditions.size === 0) {
          throw new Error('缺少查詢條件：請提供至少一個欄位以檢查不存在性');
        }

        tableDef.setQueryColumns([...conditions.keys()]);
        const exists = await this.existsByProbe(tableDef, conditions, pool);
        if (exists) {
          throw new Error(
            `${entityName} with ${JSON.stringify(Object.fromEntries(conditions))} should not exist`
          );
        }
      }
    }
  }

  private buildProbeConditions(
    row: Record<string, string>,
    tableDef: TableDefinition
  ): Map<string, unknown> {
    const probeFields = tableDef.getNonPkColumnNames();
    const conditions = new Map<string, unknown>();

    for (const fieldName of probeFields) {
      const expected = NamingConverter.getRowValue(row, fieldName);
      if (!expected) continue;
      const trim = expected.trim();
      if (!trim || trim.startsWith('&')) continue;

      const rv = this.resolver.resolveVariable(expected);
      if (rv != null) {
        const typed = TypeConverter.convertToColumnType(rv, tableDef.findColumnType(fieldName));
        conditions.set(fieldName, typed);
      }
    }

    return conditions;
  }

  private async existsByPk(
    tableDef: TableDefinition,
    pkValues: Map<string, unknown>,
    pool: Pool
  ): Promise<boolean> {
    const sql = tableDef.getSelectSql();
    const columnIndex = tableDef.getSelectWhereColumnIndex();

    let maxIdx = 0;
    for (const idx of columnIndex.values()) {
      if (idx > maxIdx) maxIdx = idx;
    }
    const params: unknown[] = new Array(maxIdx).fill(null);

    for (const [colName, value] of pkValues) {
      const idx = columnIndex.get(colName);
      if (idx !== undefined) {
        params[idx - 1] = TypeConverter.toQueryParam(value);
      }
    }

    const result = await pool.query(sql, params);
    return result.rows.length > 0;
  }

  private async existsByProbe(
    tableDef: TableDefinition,
    conditions: Map<string, unknown>,
    pool: Pool
  ): Promise<boolean> {
    const sql = tableDef.getSelectByValuesSql();
    const columnIndex = tableDef.getSelectByValuesIndex();

    let maxIdx = 0;
    for (const indices of columnIndex.values()) {
      for (const idx of indices) {
        if (idx > maxIdx) maxIdx = idx;
      }
    }
    const params: unknown[] = new Array(maxIdx).fill(null);

    for (const [colName, indices] of columnIndex) {
      const value = conditions.get(colName);
      const pgValue = TypeConverter.toQueryParam(value);
      params[indices[0] - 1] = pgValue;
      params[indices[1] - 1] = pgValue;
    }

    const result = await pool.query(sql, params);
    return result.rows.length > 0;
  }
}
