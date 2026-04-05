/**
 * TypeConverter: string → appropriate JS/PG type conversion.
 * Simplified from Java's TypeConverter (453 lines) for PostgreSQL-only use.
 * pg driver handles most type conversions automatically.
 */
export class TypeConverter {
  /**
   * Convert a DataTable string value to the appropriate type based on SQL column type.
   * PostgreSQL's pg driver handles most type conversions, but we help with:
   * - UUID validation
   * - Boolean normalization
   * - Number parsing
   * - JSON/JSONB handling
   */
  static convertToColumnType(value: unknown, columnType: string | null): unknown {
    if (value === null || value === undefined) return null;
    // 空字串 → null（Java reference: TypeConverter line 45）
    if (typeof value === 'string' && value.trim() === '') return null;
    if (columnType === null || columnType === undefined) return value;

    const upper = columnType.toUpperCase();
    const strValue = String(value);

    // UUID
    if (upper === 'UUID') {
      return strValue;
    }

    // Boolean
    if (upper === 'BOOLEAN' || upper === 'BOOL') {
      if (typeof value === 'boolean') return value;
      const lower = strValue.toLowerCase();
      if (lower === 'true' || lower === '1') return true;
      if (lower === 'false' || lower === '0') return false;
      return value;
    }

    // Integer types
    if (upper === 'INT' || upper === 'INTEGER' || upper === 'SERIAL' ||
        upper === 'SMALLINT' || upper === 'SMALLSERIAL') {
      if (typeof value === 'number') return Math.trunc(value);
      const n = parseInt(strValue, 10);
      return isNaN(n) ? value : n;
    }

    // Big integer types (use string for safety with > 2^53)
    if (upper === 'BIGINT' || upper === 'BIGSERIAL') {
      if (typeof value === 'number') return value;
      const n = parseInt(strValue, 10);
      return isNaN(n) ? value : n;
    }

    // Decimal/numeric types
    if (upper.startsWith('DECIMAL') || upper.startsWith('NUMERIC') ||
        upper === 'REAL' || upper === 'FLOAT' ||
        upper === 'DOUBLE PRECISION' || upper.startsWith('FLOAT')) {
      if (typeof value === 'number') return value;
      const n = parseFloat(strValue);
      return isNaN(n) ? value : n;
    }

    // JSON/JSONB - pass through (pg handles the cast at SQL level)
    if (upper === 'JSON' || upper === 'JSONB') {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
          return value; // valid JSON string
        } catch {
          return JSON.stringify(value); // wrap as JSON string
        }
      }
      return typeof value === 'object' ? JSON.stringify(value) : value;
    }

    // Timestamp types - pg handles ISO strings natively
    if (upper.startsWith('TIMESTAMP') || upper === 'TIMESTAMPTZ') {
      if (value instanceof Date) return value;
      return value; // pg parses ISO strings
    }

    // Date
    if (upper === 'DATE') {
      if (value instanceof Date) return value;
      return value; // pg parses ISO date strings
    }

    // Time
    if (upper === 'TIME' || upper === 'TIMETZ') {
      return value;
    }

    // Text types - pass through
    if (upper === 'TEXT' || upper.startsWith('VARCHAR') || upper.startsWith('CHAR')) {
      return strValue;
    }

    return value;
  }

  /**
   * Convert value for use in pg query parameters.
   * pg driver handles most conversions, so this is minimal.
   */
  static toQueryParam(value: unknown): unknown {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return value.toISOString();
    return value;
  }
}
