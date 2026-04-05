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

      // VAR-System 變數擷取（只在 data row 都符合 <executionKey 格式時執行）
      const contextKeyMap = this.resolver.parseContextKeys(headers);
      if (contextKeyMap.size > 0) {
        const dataRow = headers.map(h => row[h] ?? '');
        // 檢查是否所有 >contextKey 對應的 data row 都是 <executionKey
        // 如果 data row 是 $variable（引用）或普通值，跳過擷取（entity_validate 主要目的是驗證，不是存變數）
        const allHaveExecKey = [...contextKeyMap.keys()].every(
          idx => idx < dataRow.length && dataRow[idx]?.trim().startsWith('<')
        );
        if (allHaveExecKey) {
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
          this.resolver.extractAndStoreVariables(dataRow, contextKeyMap, camelCaseActual);
        }
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
      let pkRaw = NamingConverter.getRowValue(row, pkCol);
      // Fallback：BDD spec 可能用 >id 作為 entity_validate header，嘗試帶 > 前綴查找
      if (pkRaw === null) {
        pkRaw = row[`>${pkCol}`] ?? null;
      }
      if (!pkRaw || !pkRaw.trim() || pkRaw.trim().startsWith('&') || pkRaw.trim().startsWith('<')) {
        hasAllPks = false;
        break;
      }
      const resolvedPk = this.resolver.resolveVariable(pkRaw);
      // fail-closed：$variable 或 <executionKey 未解析（返回 null）時不要用字面字串查 DB
      // 注意：只有 $letter 開頭才是 VAR 引用；$digit 開頭是 bcrypt hash（$2b$10$...）
      if (resolvedPk === null && (/^\$[a-zA-Z]/.test(pkRaw.trim()) || pkRaw.trim().startsWith('<'))) {
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
      if (!trim || trim.startsWith('&') || trim.startsWith('<')) continue;
      // 跳過特殊語義值（不能當查詢條件）
      if (trim === 'null' || trim === '$null' || trim === '$notnull' || trim === '&isNotNull' || trim === '&isNull') continue;

      const rv = this.resolver.resolveVariable(expected);
      // 跳過未解析的 $variable（rv === null 且原始值以 $ 開頭）
      if (rv === null && expected.trim().startsWith('$')) continue;
      if (rv != null) {
        const typed = TypeConverter.convertToColumnType(rv, tableDef.findColumnType(fieldName));
        probeConditions.set(fieldName, typed);
      }
    }

    if (probeConditions.size === 0) {
      // 嘗試用約束欄位（& 前綴值）做查詢條件
      for (const fieldName of probeFields) {
        const expected = NamingConverter.getRowValue(row, fieldName);
        if (!expected) continue;
        const trim = expected.trim();
        if (!trim.startsWith('&')) continue;
        // 解析約束值（去掉 & 前綴，可能含運算符如 &isTrue, &>0 等）
        const constraintValue = trim.substring(1);
        // 簡單布林/字串約束直接用作查詢條件
        if (constraintValue === 'isTrue' || constraintValue === 'true') {
          probeConditions.set(fieldName, true);
        } else if (constraintValue === 'isFalse' || constraintValue === 'false') {
          probeConditions.set(fieldName, false);
        } else if (constraintValue === 'isNull' || constraintValue === 'null') {
          // NULL 不能做 = 查詢，跳過
        } else if (constraintValue === 'isNotNull' || constraintValue === 'notNull') {
          // NOT NULL 不能做 = 查詢，跳過（在 assertRowMatches 中驗證）
        } else if (!constraintValue.includes('>') && !constraintValue.includes('<') && !constraintValue.includes('!')) {
          // 純值約束
          const typed = TypeConverter.convertToColumnType(constraintValue, tableDef.findColumnType(fieldName));
          probeConditions.set(fieldName, typed);
        }
      }

      if (probeConditions.size === 0) {
        const hasExtractionColumns = Object.keys(row).some(k => k.startsWith('>'));
        // 允許純約束驗證（如只有 &isNotNull / &isNull）— 查詢最新一筆記錄做驗證
        const hasOnlyConstraints = Object.values(row).some(v => {
          const t = (v || '').trim()
          return t.startsWith('&') || t === '$notnull' || t === '$null'
        })
        if (!hasExtractionColumns && !hasOnlyConstraints) {
          throw new Error('缺少查詢條件：請提供至少一個非約束欄位或主鍵');
        }
      }
    }

    tableDef.setQueryColumns([...probeConditions.keys()]);
    let results: Record<string, unknown>[];
    if (probeConditions.size === 0) {
      // 無 probe 條件（純約束驗證）→ 查詢最新一筆記錄
      const fallbackResult = await pool.query(
        `SELECT * FROM ${tableDef.tableName.toLowerCase()} ORDER BY created_at DESC LIMIT 5`
      );
      results = fallbackResult.rows as Record<string, unknown>[];
    } else {
      results = await this.queryByProbe(tableDef, probeConditions, pool);
    }

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
      // 多筆時逐筆嘗試 assertRowMatches，任一筆滿足就用那筆
      // Feature 的「應該存在一個」語義是「存在至少一個滿足條件的記錄」
      for (const candidate of results) {
        try {
          this.assertRowMatches(row, candidate, entityName);
          return candidate; // 這筆滿足所有驗證條件
        } catch {
          // 這筆不滿足，繼續試下一筆
        }
      }
      // 所有筆都不滿足 → 回報第一筆的錯誤
      return results[0];
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
      const trimExpected = expected.trim();
      // 跳過 <executionKey 值（capture 指令，不是比較值）— 與 data-table-response-validate:136 對齊
      if (trimExpected.startsWith('<')) continue;
      // 空字串 / "null" 字面值 → 驗證 actual 是 null（DB NULL 語義）
      if (trimExpected === '' || trimExpected === 'null') {
        const actualValue = this.getActualValue(actual, fieldName);
        if (actualValue !== null && actualValue !== undefined && actualValue !== '') {
          throw new Error(`[${entityName}.${fieldName}] 預期 null，實際: [${String(actualValue)}]`);
        }
        continue;
      }

      // &isNotNull / $notnull 約束：只驗證非空，不比對值
      if (trimExpected === '&isNotNull' || trimExpected === '$notnull') {
        const actualValue = this.getActualValue(actual, fieldName);
        if (actualValue === null || actualValue === undefined) {
          throw new Error(`[${entityName}.${fieldName}] 預期非 null，但實際值為 ${String(actualValue)}`);
        }
        continue;
      }
      // &isNull 約束：驗證為空
      if (trimExpected === '&isNull' || trimExpected === '$null') {
        const actualValue = this.getActualValue(actual, fieldName);
        if (actualValue !== null && actualValue !== undefined) {
          throw new Error(`[${entityName}.${fieldName}] 預期 null，實際: [${String(actualValue)}]`);
        }
        continue;
      }

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

    // JSON/Array 比較：string ↔ parsed JS value（JSONB 欄位 pg 回傳 JS array/object）
    if (typeof expected === 'string' && (Array.isArray(actual) || (typeof actual === 'object' && actual !== null))) {
      try {
        const parsed = JSON.parse(expected);
        return JSON.stringify(parsed) === JSON.stringify(actual);
      } catch { /* fall through to default comparison */ }
    }
    if ((Array.isArray(expected) || (typeof expected === 'object' && expected !== null && !(expected instanceof Date))) && typeof actual === 'string') {
      try {
        const parsed = JSON.parse(actual);
        return JSON.stringify(expected) === JSON.stringify(parsed);
      } catch { /* fall through */ }
    }

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
   * 從 actual Map 中找值，支援 camelCase → snake_case 轉換 + JSON 巢狀路徑導航。
   * 從 Java EntityValidate.getActualValue() 移植，增加 dot notation + array indexing 支援。
   */
  private getActualValue(actual: Record<string, unknown>, fieldName: string): unknown {
    // 直接匹配
    if (fieldName in actual) return actual[fieldName];
    // camelCase → snake_case
    const snakeCase = NamingConverter.camelToSnake(fieldName);
    if (snakeCase in actual) return actual[snakeCase];
    // lowercase
    const lower = fieldName.toLowerCase();
    if (lower in actual) return actual[lower];

    // JSON 巢狀路徑導航（如 profile.city、items[0].name）
    if (fieldName.includes('.') || fieldName.includes('[')) {
      return this.navigateJson(actual, fieldName);
    }

    return undefined;
  }

  /**
   * JSON 巢狀路徑導航：支援 dot notation + bracket array indexing。
   * 也處理 PostgreSQL JSON/JSONB 欄位（string → parse → navigate）。
   */
  private navigateJson(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    const rootKey = parts[0];
    let current: unknown = obj[rootKey] ?? obj[NamingConverter.camelToSnake(rootKey)];

    // 如果 root 值是 JSON 字串，先解析
    if (typeof current === 'string') {
      try { current = JSON.parse(current); } catch { return undefined; }
    }

    // 導航剩餘路徑
    for (let i = 1; i < parts.length; i++) {
      if (current === null || current === undefined) return undefined;
      const part = parts[i];

      if (part.includes('[')) {
        const bracketStart = part.indexOf('[');
        const bracketEnd = part.indexOf(']');
        const key = part.substring(0, bracketStart);
        const index = parseInt(part.substring(bracketStart + 1, bracketEnd), 10);

        if (key && typeof current === 'object' && !Array.isArray(current)) {
          current = (current as Record<string, unknown>)[key];
        }

        if (Array.isArray(current) && index >= 0 && index < current.length) {
          current = current[index];
        } else {
          return undefined;
        }
      } else {
        if (typeof current === 'object' && current !== null && !Array.isArray(current)) {
          current = (current as Record<string, unknown>)[part];
        } else {
          return undefined;
        }
      }
    }

    return current;
  }
}
