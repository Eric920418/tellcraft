import type { Pool } from 'pg';
import type { ISAFeatureArgumentResolver } from '../helper/isa-feature-argument-resolver';
import { NamingConverter } from '../helper/naming-converter';
import { TypeConverter } from '../helper/type-converter';
import { DatabaseSchema, type TableDefinition } from '../spec/data/models';

/**
 * Entity 存在性驗證指令。
 * 驗證 DataTable 內的每一列在資料庫中都存在一筆符合的記錄。
 */
export class EntityValidate {
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

  async assertExists(entityName: string, headers: string[], rows: Record<string, string>[]): Promise<void> {
    const pair = DatabaseSchema.findSchemaAndTable(this.schemas, entityName);
    if (!pair) {
      throw new Error(
        `[EntityValidate] 找不到 entity '${entityName}' 的定義。請確認 entity_to_table_mapping 設定。`
      );
    }

    const { schema, table: tableDef } = pair;
    if (!rows || rows.length === 0) {
      throw new Error(`[EntityValidate] DataTable 必須至少有一列資料。entity=${entityName}`);
    }

    const pool = this.poolProvider(schema.dataSourceName);

    for (const row of rows) {
      const actual = await this.findActual(row, entityName, tableDef, pool);
      this.assertRowMatches(row, actual, entityName);

      // VAR-System 變數擷取
      const contextKeyMap = this.resolver.parseContextKeys(headers);
      if (contextKeyMap.size > 0) {
        const camelCaseActual: Record<string, unknown> = {};
        for (const col of tableDef.columns) {
          const colName = col.name;
          const camelName = NamingConverter.snakeToCamel(colName);
          const value = this.getActualValue(actual, colName);
          camelCaseActual[camelName] = value;
          if (camelName !== colName) {
            camelCaseActual[colName] = value;
          }
        }
        const dataRow = headers.map(h => row[h] ?? '');
        this.resolver.extractAndStoreVariables(dataRow, contextKeyMap, camelCaseActual);
      }
    }
  }

  // ==================== 查詢邏輯 ====================

  private async findActual(
    row: Record<string, string>,
    entityName: string,
    tableDef: TableDefinition,
    pool: Pool
  ): Promise<Record<string, unknown>> {
    // 嘗試 PK 查詢
    const pkValues = new Map<string, unknown>();
    const pkColumns = tableDef.pkColumns;
    let hasAllPks = pkColumns.size > 0;

    for (const pkCol of pkColumns) {
      const pkRaw = NamingConverter.getRowValue(row, pkCol);
      if (!pkRaw || !pkRaw.trim() || pkRaw.trim().startsWith('&')) {
        hasAllPks = false;
        break;
      }
      const resolvedPk = this.resolver.resolveVariable(pkRaw);
      // fail-closed：$variable 未解析（返回 null）時不要用字面字串查 DB
      if (resolvedPk === null && pkRaw.startsWith('$')) {
        hasAllPks = false;
        break;
      }
      const typed = TypeConverter.convertToColumnType(
        resolvedPk != null ? resolvedPk : pkRaw,
        tableDef.findColumnType(pkCol)
      );
      pkValues.set(pkCol, typed);
    }

    if (hasAllPks) {
      const result = await this.queryByPk(tableDef, pkValues, pool);
      if (result) return result;
      // PK 查詢失敗 → 不立即 throw，繼續嘗試 Probe 查詢。
      // 常見場景：Feature 用確定性 UUID（如 EP-001 → md5 UUID），
      // 但 action 代碼用 gen_random_uuid()，DB 中的實際 PK 不同。
    }

    // Probe 查詢
    const probeFields = tableDef.getNonPkColumnNames();
    const probeConditions = new Map<string, unknown>();

    for (const fieldName of probeFields) {
      const expected = NamingConverter.getRowValue(row, fieldName);
      if (!expected) continue;
      const trim = expected.trim();
      if (!trim || trim.startsWith('&')) continue;

      const rv = this.resolver.resolveVariable(expected);
      // 跳過未解析的 $variable（rv === null 且原始值以 $ 開頭）
      if (rv === null && expected.trim().startsWith('$')) continue;
      if (rv != null) {
        const typed = TypeConverter.convertToColumnType(rv, tableDef.findColumnType(fieldName));
        probeConditions.set(fieldName, typed);
      }
    }

    if (probeConditions.size === 0) {
      const hasExtractionColumns = Object.keys(row).some(k => k.startsWith('>'));
      if (!hasExtractionColumns) {
        throw new Error('缺少查詢條件：請提供至少一個非約束欄位或主鍵');
      }
    }

    tableDef.setQueryColumns([...probeConditions.keys()]);
    let results = await this.queryByProbe(tableDef, probeConditions, pool);

    // 多筆時用 CAS 後置篩選
    if (results.length > 1) {
      const filtered = this.filterByConstraints(row, results, entityName);
      if (filtered.length > 0) {
        results = filtered;
      }
    }

    if (results.length === 0) {
      throw new Error(`找不到符合條件的${entityName}，請確認資料是否存在或提供主鍵精準查詢`);
    }
    if (results.length > 1) {
      throw new Error(`找到多筆${entityName}，請提供更多欄位或主鍵以唯一識別`);
    }

    return results[0];
  }

  private async queryByPk(
    tableDef: TableDefinition,
    pkValues: Map<string, unknown>,
    pool: Pool
  ): Promise<Record<string, unknown> | null> {
    const sql = tableDef.getSelectSql();
    const columnIndex = tableDef.getSelectWhereColumnIndex();

    const params: unknown[] = [];
    // Allocate parameter array based on max index
    let maxIdx = 0;
    for (const idx of columnIndex.values()) {
      if (idx > maxIdx) maxIdx = idx;
    }
    for (let i = 0; i < maxIdx; i++) params.push(null);

    for (const [colName, value] of pkValues) {
      const idx = columnIndex.get(colName);
      if (idx !== undefined) {
        params[idx - 1] = TypeConverter.toQueryParam(value);
      }
    }

    const result = await pool.query(sql, params);
    return result.rows.length > 0 ? (result.rows[0] as Record<string, unknown>) : null;
  }

  private async queryByProbe(
    tableDef: TableDefinition,
    conditions: Map<string, unknown>,
    pool: Pool
  ): Promise<Record<string, unknown>[]> {
    const sql = tableDef.getSelectByValuesSql();
    const columnIndex = tableDef.getSelectByValuesIndex();

    // Determine max param index
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
    return result.rows as Record<string, unknown>[];
  }

  // ==================== 驗證邏輯 ====================

  private assertRowMatches(row: Record<string, string>, actual: Record<string, unknown>, entityName: string): void {
    for (const [fieldName, expected] of Object.entries(row)) {
      if (!fieldName || !fieldName.trim()) continue;
      if (fieldName.startsWith('>') || fieldName.startsWith('<')) continue;
      if (expected === null || expected === undefined) continue;

      const actualValue = this.getActualValue(actual, fieldName);
      const resolved = this.resolver.resolveAndValidate(expected, actualValue, fieldName, entityName);
      if (resolved === null || resolved === undefined) continue;

      // resolveAndValidate 回傳非 null 表示需要進行值比較
      // UUID ID 容錯：server 用 gen_random_uuid() 產生 ID，與 Feature 的確定性 UUID 不同
      if (/(?:^id$|Id$|_id$)/i.test(fieldName) &&
          typeof resolved === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(resolved) &&
          typeof actualValue === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(actualValue as string)) {
        continue;
      }
      if (!this.valuesEqual(resolved, actualValue)) {
        throw new Error(
          `[${entityName}.${fieldName}] expect: [${String(resolved)}], actual: [${String(actualValue)}]`
        );
      }
    }
  }

  // ==================== 值比對 ====================

  private valuesEqual(expected: unknown, actual: unknown): boolean {
    if (expected === null || expected === undefined) return actual === null || actual === undefined;
    if (actual === null || actual === undefined) return false;

    // Date comparison (to-second precision)
    if (expected instanceof Date && actual instanceof Date) {
      return Math.abs(expected.getTime() - actual.getTime()) < 1000;
    }

    // String vs Date
    if (typeof expected === 'string' && actual instanceof Date) {
      const parsed = new Date(expected);
      if (!isNaN(parsed.getTime())) {
        return Math.abs(parsed.getTime() - actual.getTime()) < 1000;
      }
    }

    // Boolean handling (PG returns boolean, DataTable may have "0"/"1")
    if (typeof actual === 'boolean') {
      const expectedStr = String(expected);
      if (expectedStr === '0' || expectedStr === '1') {
        return actual === (expectedStr === '1');
      }
      return String(actual) === expectedStr;
    }

    // Cross-type: numeric semantic comparison
    if (typeof expected !== typeof actual) {
      const eNum = parseFloat(String(expected));
      const aNum = parseFloat(String(actual));
      if (!isNaN(eNum) && !isNaN(aNum)) return eNum === aNum;
      return String(expected) === String(actual);
    }

    return expected === actual;
  }

  /**
   * 當查詢回傳多筆時，對 row 裡「以 & 開頭」的欄位做後置 CAS 篩選。
   */
  private filterByConstraints(
    row: Record<string, string>,
    results: Record<string, unknown>[],
    entityName: string
  ): Record<string, unknown>[] {
    const filtered: Record<string, unknown>[] = [];

    for (const it of results) {
      let ok = true;
      for (const [fieldName, expected] of Object.entries(row)) {
        if (!expected) continue;
        const trim = expected.trim();
        if (!trim.startsWith('&')) continue;

        const actualValue = this.getActualValue(it, fieldName);
        try {
          this.resolver.resolveAndValidate(trim, actualValue, fieldName, entityName);
        } catch {
          ok = false;
          break;
        }
      }
      if (ok) filtered.push(it);
    }

    return filtered;
  }

  /**
   * 從 actual Map 中找值，支援 camelCase → snake_case 轉換。
   */
  private getActualValue(actual: Record<string, unknown>, fieldName: string): unknown {
    if (fieldName in actual) return actual[fieldName];
    const snakeCase = NamingConverter.camelToSnake(fieldName);
    if (snakeCase in actual) return actual[snakeCase];
    const lower = fieldName.toLowerCase();
    if (lower in actual) return actual[lower];
    return undefined;
  }
}
