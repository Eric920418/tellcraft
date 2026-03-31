import type { Pool } from 'pg';
import type { ISAFeatureArgumentResolver } from '../helper/isa-feature-argument-resolver';
import { NamingConverter } from '../helper/naming-converter';
import { TypeConverter } from '../helper/type-converter';
import { DatabaseSchema, type TableDefinition } from '../spec/data/models';

/**
 * Entity 資料準備指令。
 * INSERT INTO 測試資料、取得 RETURNING * 結果、VAR-System 變數擷取。
 */
export class EntitySetup {
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

  async setup(entityName: string, headers: string[], rows: Record<string, string>[]): Promise<void> {
    if (!entityName || !entityName.trim()) {
      throw new Error('[EntitySetup] 缺少 entity 名稱。');
    }
    if (!rows || rows.length === 0) {
      throw new Error('[EntitySetup] 缺少 DataTable。');
    }

    const pair = DatabaseSchema.findSchemaAndTable(this.schemas, entityName);
    if (!pair) {
      const availableEntities: string[] = [];
      for (const schema of this.schemas) {
        for (const [name] of schema.getTablesByEntityName()) {
          availableEntities.push(name);
        }
      }
      throw new Error(
        `[EntitySetup] 找不到 entity '${entityName}'。可用的 entity: ${availableEntities.join(', ')}`
      );
    }

    const { schema, table: tableDef } = pair;
    const dataSourceName = schema.dataSourceName;
    const pool = this.poolProvider(dataSourceName);

    // 解析 VAR-System context key 映射（>contextKey 欄位）
    const contextKeyMap = this.resolver.parseContextKeys(headers);

    // 分離資料欄位（排除 VAR-System > 和 < 前綴欄位）
    const dataHeaders: string[] = [];
    for (const header of headers) {
      const trimmed = header.trim();
      if (!trimmed.startsWith('>') && !trimmed.startsWith('<')) {
        dataHeaders.push(header);
      }
    }

    const needsSelect = contextKeyMap.size > 0;

    for (const row of rows) {
      const insertedRow = await this.insertRow(pool, row, dataHeaders, tableDef, needsSelect);

      // VAR-System 變數擷取
      if (needsSelect && insertedRow) {
        const camelCaseRow: Record<string, unknown> = {};
        for (const col of tableDef.columns) {
          const colName = col.name;
          const camelName = NamingConverter.snakeToCamel(colName);
          const value = this.findValueInDbRow(insertedRow, colName);
          camelCaseRow[camelName] = value;
          if (camelName !== colName) {
            camelCaseRow[colName] = value;
          }
        }
        const dataRow: string[] = headers.map(h => row[h] ?? '');
        this.resolver.extractAndStoreVariables(dataRow, contextKeyMap, camelCaseRow);
      }
    }
  }

  private async insertRow(
    pool: Pool,
    row: Record<string, string>,
    dataHeaders: string[],
    tableDef: TableDefinition,
    needsSelect: boolean
  ): Promise<Record<string, unknown> | null> {
    const tableName = tableDef.tableName.toLowerCase();

    // 建立欄位名稱到類型的映射
    const columnTypes = new Map<string, string>();
    for (const col of tableDef.columns) {
      columnTypes.set(col.name.toLowerCase(), col.type);
    }

    // 收集要插入的欄位和值
    const columns: string[] = [];
    const values: unknown[] = [];
    const valueColumnTypes: (string | null)[] = [];

    for (const header of dataHeaders) {
      let value = row[header];
      if (value === undefined || value === null || value === '' || value === 'null' || value === 'NULL' || value === 'Null') continue;

      // 處理 & 前綴 constraint markers（這些是驗證約束，不是資料值）
      const trimmedValue = (typeof value === 'string') ? value.trim() : '';
      if (trimmedValue.startsWith('&')) {
        if (trimmedValue === '&isTrue') {
          value = 'true';
        } else if (trimmedValue === '&isFalse') {
          value = 'false';
        } else {
          // &isNull, &isNotNull 等 → 跳過此欄位（不插入，DB 用 DEFAULT 或 NULL）
          continue;
        }
      }

      const actualColName = this.resolveColumnName(tableDef, header);
      const snakeCol = actualColName.toLowerCase();

      // 解析變數引用
      const resolved = this.resolver.resolveVariable(value);
      // fail-closed：$variable 未解析時不 fallback 到字面字串（會導致 SQL type error，如 uuid 欄位收到 "$listId"）
      // 注意：只有 $letter 開頭才是 VAR 引用（$userId, $Todo1.id）；$digit 開頭是 bcrypt hash（$2b$10$...）
      if (resolved === null && /^\$[a-zA-Z]/.test(value.trim())) {
        throw new Error(
          `[EntitySetup] VAR 解析失敗：${value} 無法解析為有效值。請確認 Background 或先前步驟已正確宣告此變數。`
        );
      }
      const resolvedValue = resolved != null ? resolved : value;
      const colType = columnTypes.get(snakeCol) ?? null;

      columns.push(snakeCol);
      values.push(TypeConverter.convertToColumnType(resolvedValue, colType));
      valueColumnTypes.push(colType);
    }

    if (columns.length === 0) {
      throw new Error('[EntitySetup] 沒有可插入的欄位。請確認 DataTable 有非空資料欄位。');
    }

    // 動態建構 INSERT SQL with $1, $2, ...
    // JSON/JSONB 欄位需要 SQL 層級的 CAST
    const colJoiner = columns.join(', ');
    const valParts: string[] = [];
    for (let i = 0; i < columns.length; i++) {
      const colType = valueColumnTypes[i];
      if (colType && colType.toUpperCase().includes('JSON')) {
        valParts.push(`CAST($${i + 1} AS ${colType})`);
      } else {
        valParts.push(`$${i + 1}`);
      }
    }
    const valJoiner = valParts.join(', ');

    // ON CONFLICT 防止重複鍵導致 INSERT 失敗
    // 1. 有 id 欄位 → ON CONFLICT (id) DO UPDATE
    // 2. 沒有 id 但表有 PK → ON CONFLICT (pk_cols) DO UPDATE
    // 3. 都沒有 → ON CONFLICT DO NOTHING（有唯一約束時用 catch fallback）
    const hasIdColumn = columns.includes('id');
    const pkCols = [...tableDef.pkColumns];
    const updateCols = columns.filter(c => !pkCols.includes(c) && c !== 'id');
    let conflictClause = '';
    if (hasIdColumn && updateCols.length > 0) {
      conflictClause = ` ON CONFLICT (id) DO UPDATE SET ${updateCols.map(c => `${c} = EXCLUDED.${c}`).join(', ')}`;
    } else if (hasIdColumn) {
      conflictClause = ' ON CONFLICT (id) DO NOTHING';
    } else if (pkCols.length > 0 && updateCols.length > 0) {
      conflictClause = ` ON CONFLICT (${pkCols.join(', ')}) DO UPDATE SET ${updateCols.map(c => `${c} = EXCLUDED.${c}`).join(', ')}`;
    }
    const sql = needsSelect
      ? `INSERT INTO ${tableName} (${colJoiner}) VALUES (${valJoiner})${conflictClause} RETURNING *`
      : `INSERT INTO ${tableName} (${colJoiner}) VALUES (${valJoiner})${conflictClause}`;

    const pgValues = values.map(v => TypeConverter.toQueryParam(v));
    let result;
    try {
      result = await pool.query(sql, pgValues);
    } catch (insertErr: any) {
      // 唯一約束衝突 → 嘗試 SELECT 已存在的記錄（測試場景中同一 email 可能被多個 Scenario 準備）
      if (insertErr?.code === '23505') { // unique_violation
        if (needsSelect) {
          // 用插入欄位組合 WHERE 條件查已存在的記錄
          const whereClause = columns.map((c, i) => `${c} = $${i + 1}`).join(' AND ');
          const selectResult = await pool.query(
            `SELECT * FROM ${tableName} WHERE ${whereClause} LIMIT 1`,
            pgValues
          );
          if (selectResult.rows.length > 0) {
            return selectResult.rows[0] as Record<string, unknown>;
          }
        }
        return null; // 記錄已存在，不需要插入
      }
      throw insertErr;
    }

    if (!needsSelect) return null;

    // RETURNING * 直接取得插入後的完整記錄
    if (result.rows && result.rows.length > 0) {
      return result.rows[0] as Record<string, unknown>;
    }

    return null;
  }

  private resolveColumnName(tableDef: TableDefinition, header: string): string {
    const snake = NamingConverter.camelToSnake(header);
    for (const col of tableDef.columns) {
      const name = col.name;
      if (name === header || name === snake ||
          name.toLowerCase() === header.toLowerCase() ||
          name.toLowerCase() === snake.toLowerCase()) {
        return name;
      }
    }
    return snake; // fallback
  }

  private findValueInDbRow(dbRow: Record<string, unknown>, colName: string): unknown {
    if (colName in dbRow) return dbRow[colName];
    const lower = colName.toLowerCase();
    if (lower in dbRow) return dbRow[lower];
    const snakeLower = NamingConverter.camelToSnake(colName).toLowerCase();
    if (snakeLower in dbRow) return dbRow[snakeLower];
    return null;
  }
}
