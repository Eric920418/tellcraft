import type { Pool } from 'pg';
import type { ISAFeatureArgumentResolver } from '../helper/isa-feature-argument-resolver';
import { NamingConverter } from '../helper/naming-converter';
import { TypeConverter } from '../helper/type-converter';
import { isSentinelValue } from '../helper/sentinel-values';
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
        // L28.B: 用統一 sentinel 過濾（涵蓋 & / < / > / $notnull / $null / null / 空）
        if (!pkRaw || isSentinelValue(pkRaw)) {
          hasAllPks = false;
          break;
        }
        const resolvedPk = this.resolver.resolveVariable(pkRaw);
        // fail-closed：$variable 或 <executionKey 未解析時不要用字面字串查 DB
        // 注意：只有 $letter 開頭才是 VAR 引用；$digit 開頭是 bcrypt hash（$2b$10$...）
        if (resolvedPk === null && (/^\$[a-zA-Z]/.test(pkRaw.trim()) || pkRaw.trim().startsWith('<'))) {
          throw new Error(
            `[EntityNonExistenceValidate] VAR 解析失敗：${pkRaw} 無法解析。請確認 Background 或先前步驟已正確宣告此變數。`
          );
        }
        const typed = TypeConverter.convertToColumnType(
          resolvedPk != null ? resolvedPk : pkRaw,
          tableDef.findColumnType(pkCol)
        );
        pkValues.set(pkCol, typed);
      }

      if (hasAllPks) {
        // L28.D: PK + 額外非 PK 欄位 → 全部 AND 查，不只看 PK
        // 否則 BDD 寫 `應該不存在一個X, with table: | id | isVisible | | $x | true |` 期望
        // 「id=X 且 isVisible=true 的 row 不存在」會被誤判為「id=X 的 row 不存在」
        // → BDD 想驗的「條件式不存在」變成「絕對不存在」，但 Background 剛建立該 PK，必失敗
        const extraConditions = this.buildProbeConditions(row, tableDef);
        if (extraConditions.size > 0) {
          // 合併 PK + 額外條件
          const allConditions = new Map<string, unknown>(pkValues);
          for (const [k, v] of extraConditions) allConditions.set(k, v);
          tableDef.setQueryColumns([...allConditions.keys()]);
          const exists = await this.existsByProbe(tableDef, allConditions, pool);
          if (exists) {
            throw new Error(
              `${entityName} with ${JSON.stringify(Object.fromEntries(allConditions))} should not exist`
            );
          }
        } else {
          // 純 PK 查（既有行為）
          const exists = await this.existsByPk(tableDef, pkValues, pool);
          if (exists) {
            throw new Error(
              `${entityName} with ${JSON.stringify(Object.fromEntries(pkValues))} should not exist`
            );
          }
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
      // L28.B: 統一用 sentinel helper
      if (isSentinelValue(expected)) continue;

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
    if (result.rows.length === 0) return false;

    // Soft-delete 感知：如果表有 deleted_at 欄位，已軟刪除的記錄（deleted_at IS NOT NULL）視為「不存在」
    const hasDeletedAt = tableDef.columns.some(c => c.name === 'deleted_at');
    if (hasDeletedAt) {
      return result.rows.some(r => r.deleted_at === null || r.deleted_at === undefined);
    }
    return true;
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
    if (result.rows.length === 0) return false;

    // Soft-delete 感知
    const hasDeletedAt = tableDef.columns.some(c => c.name === 'deleted_at');
    if (hasDeletedAt) {
      return result.rows.some(r => r.deleted_at === null || r.deleted_at === undefined);
    }
    return true;
  }
}
