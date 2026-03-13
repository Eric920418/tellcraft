export interface ColumnDefinition {
  name: string;
  type: string;
  notNull?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  unique?: boolean;
  defaultValue?: string;
  foreignKey?: string; // format: 'table.column'
  checkConstraint?: string;
  comment?: string;
}

export class TableDefinition {
  tableName: string;
  comment?: string;
  columns: ColumnDefinition[] = [];
  pkColumns: Set<string> = new Set();
  queryColumns: string[] = [];
  dbType?: string;

  // Cached SQL
  private _selectSql: string | null = null;
  private _selectWhereColumnIndex: Map<string, number> | null = null;
  private _selectByValuesSql: string | null = null;
  private _selectByValuesIndex: Map<string, number[]> | null = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  findColumnType(columnName: string): string | null {
    const col = this.columns.find(c => c.name === columnName);
    return col?.type ?? null;
  }

  getNonPkColumnNames(): Set<string> {
    const result = new Set<string>();
    for (const col of this.columns) {
      if (!this.pkColumns.has(col.name)) {
        result.add(col.name);
      }
    }
    return result;
  }

  getPkColumnDefinitions(): ColumnDefinition[] {
    return this.columns.filter(col => this.pkColumns.has(col.name));
  }

  /**
   * SELECT col1, col2 FROM table WHERE pk1=$1 AND pk2=$2
   */
  getSelectSql(): string {
    this.ensureSelectBuilt();
    return this._selectSql!;
  }

  getSelectWhereColumnIndex(): Map<string, number> {
    this.ensureSelectBuilt();
    return this._selectWhereColumnIndex!;
  }

  /**
   * SELECT ... FROM table WHERE (CAST($1 AS type) IS NULL OR col1=$2) AND ...
   * PostgreSQL-specific with CAST for NULL type inference
   */
  getSelectByValuesSql(): string {
    this.ensureSelectByValuesBuilt();
    return this._selectByValuesSql!;
  }

  getSelectByValuesIndex(): Map<string, number[]> {
    this.ensureSelectByValuesBuilt();
    return this._selectByValuesIndex!;
  }

  setQueryColumns(columns: string[]): void {
    this.queryColumns = columns;
    this._selectByValuesSql = null;
    this._selectByValuesIndex = null;
  }

  private ensureSelectBuilt(): void {
    if (this._selectSql !== null) return;

    const columnIndex = new Map<string, number>();
    const colNames = this.columns.map(c => c.name).join(', ');
    let whereClause = '';

    if (this.pkColumns.size > 0) {
      const conditions: string[] = [];
      let paramIndex = 1;
      for (const pk of this.pkColumns) {
        conditions.push(`${pk}=$${paramIndex}`);
        columnIndex.set(pk, paramIndex);
        paramIndex++;
      }
      whereClause = ' WHERE ' + conditions.join(' AND ');
    }

    this._selectSql = `SELECT ${colNames} FROM ${this.tableName}${whereClause}`;
    this._selectWhereColumnIndex = columnIndex;
  }

  private ensureSelectByValuesBuilt(): void {
    if (this._selectByValuesSql !== null) return;

    const columnIndex = new Map<string, number[]>();
    const columnTypeMap = new Map<string, string>();
    for (const col of this.columns) {
      columnTypeMap.set(col.name, col.type);
    }

    const colNames = this.columns.map(c => c.name).join(', ');
    let whereClause = '';

    if (this.queryColumns.length > 0) {
      const conditions: string[] = [];
      let paramIdx = 1;
      for (const col of this.queryColumns) {
        const colType = columnTypeMap.get(col) ?? 'VARCHAR';
        // PostgreSQL needs CAST for NULL type inference
        conditions.push(`(CAST($${paramIdx} AS ${colType}) IS NULL OR ${col}=$${paramIdx + 1})`);
        columnIndex.set(col, [paramIdx, paramIdx + 1]);
        paramIdx += 2;
      }
      whereClause = ' WHERE ' + conditions.join(' AND ');
    }

    this._selectByValuesSql = `SELECT ${colNames} FROM ${this.tableName}${whereClause}`;
    this._selectByValuesIndex = columnIndex;
  }
}

export interface EntityTableMapping {
  entity_to_table_mapping: Record<string, string>[];
}

export function entityMappingAsMap(mapping: EntityTableMapping): Map<string, string> {
  const result = new Map<string, string>();
  for (const entry of mapping.entity_to_table_mapping) {
    for (const [entity, table] of Object.entries(entry)) {
      result.set(entity, table);
    }
  }
  return result;
}

export class DatabaseSchema {
  tables: TableDefinition[] = [];
  entityTableMapping: EntityTableMapping | null = null;
  dataSourceName = 'default';
  dbType = 'postgresql';

  private _tablesByEntityName: Map<string, TableDefinition> | null = null;

  findByEntityName(entityName: string): TableDefinition | null {
    this.ensureMapBuilt();
    return this._tablesByEntityName!.get(entityName) ?? null;
  }

  getTablesByEntityName(): ReadonlyMap<string, TableDefinition> {
    this.ensureMapBuilt();
    return this._tablesByEntityName!;
  }

  setEntityTableMapping(mapping: EntityTableMapping): void {
    this.entityTableMapping = mapping;
    this._tablesByEntityName = null;
  }

  private ensureMapBuilt(): void {
    if (this._tablesByEntityName !== null) return;

    this._tablesByEntityName = new Map();
    const tableByName = new Map<string, TableDefinition>();
    for (const table of this.tables) {
      tableByName.set(table.tableName, table);
    }

    if (this.entityTableMapping) {
      const mapping = entityMappingAsMap(this.entityTableMapping);
      for (const [entityName, tableName] of mapping) {
        const table = tableByName.get(tableName);
        if (table) {
          this._tablesByEntityName.set(entityName, table);
        }
      }
    } else {
      for (const table of this.tables) {
        this._tablesByEntityName.set(table.tableName, table);
      }
    }
  }

  /**
   * Build cleanup SQL for PostgreSQL (TRUNCATE CASCADE + sequence restart)
   */
  buildCleanupSql(): string[] {
    const sqls: string[] = [];
    for (const table of this.tables) {
      sqls.push(`TRUNCATE TABLE ${table.tableName} CASCADE`);
      // Reset sequences for serial/auto-increment columns
      for (const col of table.columns) {
        if (col.autoIncrement) {
          sqls.push(`ALTER SEQUENCE IF EXISTS ${table.tableName}_${col.name}_seq RESTART WITH 1`);
        }
      }
    }
    return sqls;
  }

  static findSchemaAndTable(
    schemas: DatabaseSchema[],
    entityName: string
  ): { schema: DatabaseSchema; table: TableDefinition } | null {
    for (const schema of schemas) {
      const table = schema.findByEntityName(entityName);
      if (table) {
        return { schema, table };
      }
    }
    return null;
  }
}
