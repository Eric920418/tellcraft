/**
 * Schema Change DSL — 零依賴純函數模組
 *
 * 用於 iteration-skill 的 executeSchemaIteration：LLM 不寫 raw SQL，只交出 SchemaChange[]
 * 結構化 DSL；本模組純函數推導 forward/reverse SQL，並執行：
 *   - identifier 白名單防注入
 *   - PostgreSQL type 白名單防亂寫
 *   - 依存排序（add_table → add_column → add_index → add_foreign_key）
 *   - additive vs destructive 分類給 confirm UI 用
 *
 * 自包含原則：identifier validator + type whitelist 全在本檔，不依賴 schema-derivation.ts
 */

// ============================================================
// Types
// ============================================================

export type SchemaChange =
  | AddColumnChange
  | DropColumnChange
  | RenameColumnChange
  | AlterTypeChange
  | AddIndexChange
  | DropIndexChange
  | AddTableChange
  | DropTableChange
  | AddForeignKeyChange

export interface AddColumnChange {
  kind: 'add_column'
  table: string
  column: string
  type: string                  // PostgreSQL type literal, e.g. 'INTEGER' / 'TEXT' / 'VARCHAR(100)'
  nullable: boolean
  default?: string              // SQL default literal, e.g. "0" / "'pending'" / 'NOW()'
  destructive: false
}

export interface DropColumnChange {
  kind: 'drop_column'
  table: string
  column: string
  /** Reverse 需要原 type 才能還原；LLM 必須提供 */
  reverseType: string
  reverseNullable: boolean
  reverseDefault?: string
  destructive: true
}

export interface RenameColumnChange {
  kind: 'rename_column'
  table: string
  fromColumn: string
  toColumn: string
  destructive: true             // 改名會 break 既有 SQL 引用，視為破壞
}

export interface AlterTypeChange {
  kind: 'alter_type'
  table: string
  column: string
  newType: string
  oldType: string               // 供 reverse 還原
  /** USING expression for safe type conversion, e.g. "column_name::integer" */
  using?: string
  destructive: true
}

export interface AddIndexChange {
  kind: 'add_index'
  table: string
  indexName: string
  columns: string[]
  unique: boolean
  destructive: false
}

export interface DropIndexChange {
  kind: 'drop_index'
  indexName: string
  /** Reverse 需要原 table + columns + unique 才能還原 */
  reverseTable: string
  reverseColumns: string[]
  reverseUnique: boolean
  destructive: true
}

export interface AddTableChange {
  kind: 'add_table'
  table: string
  columns: {
    name: string
    type: string
    nullable: boolean
    default?: string
    primaryKey?: boolean
  }[]
  destructive: false
}

export interface DropTableChange {
  kind: 'drop_table'
  table: string
  /** Reverse 需要完整 columns 定義才能還原 */
  reverseColumns: AddTableChange['columns']
  destructive: true
}

export interface AddForeignKeyChange {
  kind: 'add_foreign_key'
  table: string
  column: string
  references: {
    table: string
    column: string
  }
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'
  /** FK constraint name，省略由 Postgres 自動命名（reverse 會用 IF EXISTS 找） */
  constraintName?: string
  destructive: false
}

export type SchemaClassification = 'additive' | 'destructive' | 'mixed'

// ============================================================
// Validation
// ============================================================

const IDENTIFIER_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/

/** PostgreSQL type 白名單。base type 允許參數化（VARCHAR(100)、NUMERIC(10,2)）；陣列允許 [] 後綴 */
const TYPE_BASE_WHITELIST = new Set([
  'INT', 'INTEGER', 'INT2', 'INT4', 'INT8',
  'SMALLINT', 'BIGINT', 'SERIAL', 'BIGSERIAL',
  'NUMERIC', 'DECIMAL', 'REAL', 'DOUBLE PRECISION', 'FLOAT',
  'BOOLEAN', 'BOOL',
  'TEXT', 'VARCHAR', 'CHAR', 'CHARACTER VARYING', 'CHARACTER',
  'DATE', 'TIME', 'TIMESTAMP', 'TIMESTAMPTZ', 'TIMESTAMP WITH TIME ZONE',
  'TIMESTAMP WITHOUT TIME ZONE',
  'INTERVAL',
  'UUID',
  'JSON', 'JSONB',
  'BYTEA',
  'INET', 'CIDR', 'MACADDR',
])

const FK_ACTION_WHITELIST = new Set(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION'])

export function validateIdentifier(name: string, role: string): void {
  if (!IDENTIFIER_RE.test(name)) {
    throw new Error(`SchemaChange validation: ${role} 不合法識別符 ${JSON.stringify(name)}（必須 ^[a-zA-Z_][a-zA-Z0-9_]*$）`)
  }
}

export function validatePostgresType(type: string): void {
  // 去掉 array suffix（int[] / text[][]）
  const stripped = type.replace(/(\s*\[\s*\])+$/, '').trim().toUpperCase()
  // 去掉 size/precision 參數 VARCHAR(100) → VARCHAR
  const base = stripped.replace(/\s*\([^)]*\)\s*$/, '').trim()
  if (!TYPE_BASE_WHITELIST.has(base)) {
    throw new Error(`SchemaChange validation: 不支援的 PostgreSQL type ${JSON.stringify(type)}（base=${base}）`)
  }
}

// ============================================================
// SQL formatting helpers
// ============================================================

function quoteIdent(name: string): string {
  // 已驗證白名單後加雙引號（postgres 識別符）
  return `"${name}"`
}

function formatColumnDef(col: { name: string; type: string; nullable: boolean; default?: string; primaryKey?: boolean }): string {
  validateIdentifier(col.name, 'column name')
  validatePostgresType(col.type)
  const parts = [quoteIdent(col.name), col.type]
  if (col.primaryKey) parts.push('PRIMARY KEY')
  if (!col.nullable && !col.primaryKey) parts.push('NOT NULL')
  if (col.default !== undefined) parts.push(`DEFAULT ${col.default}`)
  return parts.join(' ')
}

// ============================================================
// Dependency ordering
// ============================================================

const KIND_ORDER: Record<SchemaChange['kind'], number> = {
  add_table: 1,
  add_column: 2,
  alter_type: 3,
  rename_column: 4,
  add_index: 5,
  add_foreign_key: 6,
  drop_index: 7,
  drop_column: 8,
  drop_table: 9,
}

function sortForForward(changes: SchemaChange[]): SchemaChange[] {
  return [...changes].sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind])
}

function sortForReverse(changes: SchemaChange[]): SchemaChange[] {
  // Reverse = forward 反序 + 反向動作
  return [...changes].sort((a, b) => KIND_ORDER[b.kind] - KIND_ORDER[a.kind])
}

// ============================================================
// Per-kind SQL generators
// ============================================================

function forwardSql(c: SchemaChange): string {
  switch (c.kind) {
    case 'add_table': {
      validateIdentifier(c.table, 'table name')
      const cols = c.columns.map(formatColumnDef).join(', ')
      return `CREATE TABLE ${quoteIdent(c.table)} (${cols});`
    }
    case 'add_column': {
      validateIdentifier(c.table, 'table name')
      const def = formatColumnDef({ name: c.column, type: c.type, nullable: c.nullable, default: c.default })
      return `ALTER TABLE ${quoteIdent(c.table)} ADD COLUMN ${def};`
    }
    case 'drop_column': {
      validateIdentifier(c.table, 'table name')
      validateIdentifier(c.column, 'column name')
      return `ALTER TABLE ${quoteIdent(c.table)} DROP COLUMN ${quoteIdent(c.column)};`
    }
    case 'rename_column': {
      validateIdentifier(c.table, 'table name')
      validateIdentifier(c.fromColumn, 'fromColumn')
      validateIdentifier(c.toColumn, 'toColumn')
      return `ALTER TABLE ${quoteIdent(c.table)} RENAME COLUMN ${quoteIdent(c.fromColumn)} TO ${quoteIdent(c.toColumn)};`
    }
    case 'alter_type': {
      validateIdentifier(c.table, 'table name')
      validateIdentifier(c.column, 'column name')
      validatePostgresType(c.newType)
      const using = c.using ? ` USING ${c.using}` : ''
      return `ALTER TABLE ${quoteIdent(c.table)} ALTER COLUMN ${quoteIdent(c.column)} TYPE ${c.newType}${using};`
    }
    case 'add_index': {
      validateIdentifier(c.table, 'table name')
      validateIdentifier(c.indexName, 'index name')
      c.columns.forEach(col => validateIdentifier(col, 'index column'))
      const unique = c.unique ? 'UNIQUE ' : ''
      const cols = c.columns.map(quoteIdent).join(', ')
      return `CREATE ${unique}INDEX ${quoteIdent(c.indexName)} ON ${quoteIdent(c.table)} (${cols});`
    }
    case 'drop_index': {
      validateIdentifier(c.indexName, 'index name')
      return `DROP INDEX IF EXISTS ${quoteIdent(c.indexName)};`
    }
    case 'drop_table': {
      validateIdentifier(c.table, 'table name')
      return `DROP TABLE ${quoteIdent(c.table)};`
    }
    case 'add_foreign_key': {
      validateIdentifier(c.table, 'table name')
      validateIdentifier(c.column, 'column name')
      validateIdentifier(c.references.table, 'references.table')
      validateIdentifier(c.references.column, 'references.column')
      if (c.onDelete && !FK_ACTION_WHITELIST.has(c.onDelete)) {
        throw new Error(`SchemaChange validation: 不合法 onDelete=${c.onDelete}`)
      }
      let constraint = ''
      if (c.constraintName) {
        validateIdentifier(c.constraintName, 'constraintName')
        constraint = `CONSTRAINT ${quoteIdent(c.constraintName)} `
      }
      const onDelete = c.onDelete ? ` ON DELETE ${c.onDelete}` : ''
      return `ALTER TABLE ${quoteIdent(c.table)} ADD ${constraint}FOREIGN KEY (${quoteIdent(c.column)}) REFERENCES ${quoteIdent(c.references.table)} (${quoteIdent(c.references.column)})${onDelete};`
    }
  }
}

function reverseSql(c: SchemaChange): string {
  switch (c.kind) {
    case 'add_table':
      validateIdentifier(c.table, 'table name')
      return `DROP TABLE IF EXISTS ${quoteIdent(c.table)};`
    case 'add_column':
      validateIdentifier(c.table, 'table name')
      validateIdentifier(c.column, 'column name')
      return `ALTER TABLE ${quoteIdent(c.table)} DROP COLUMN IF EXISTS ${quoteIdent(c.column)};`
    case 'drop_column': {
      validateIdentifier(c.table, 'table name')
      const def = formatColumnDef({ name: c.column, type: c.reverseType, nullable: c.reverseNullable, default: c.reverseDefault })
      return `ALTER TABLE ${quoteIdent(c.table)} ADD COLUMN ${def};`
    }
    case 'rename_column':
      validateIdentifier(c.table, 'table name')
      validateIdentifier(c.fromColumn, 'fromColumn')
      validateIdentifier(c.toColumn, 'toColumn')
      return `ALTER TABLE ${quoteIdent(c.table)} RENAME COLUMN ${quoteIdent(c.toColumn)} TO ${quoteIdent(c.fromColumn)};`
    case 'alter_type': {
      validateIdentifier(c.table, 'table name')
      validateIdentifier(c.column, 'column name')
      validatePostgresType(c.oldType)
      // reverse 無 USING（除非用戶後續補資料）；簡化：直接 ALTER
      return `ALTER TABLE ${quoteIdent(c.table)} ALTER COLUMN ${quoteIdent(c.column)} TYPE ${c.oldType};`
    }
    case 'add_index':
      validateIdentifier(c.indexName, 'index name')
      return `DROP INDEX IF EXISTS ${quoteIdent(c.indexName)};`
    case 'drop_index': {
      validateIdentifier(c.indexName, 'index name')
      validateIdentifier(c.reverseTable, 'reverseTable')
      c.reverseColumns.forEach(col => validateIdentifier(col, 'reverseColumns'))
      const unique = c.reverseUnique ? 'UNIQUE ' : ''
      const cols = c.reverseColumns.map(quoteIdent).join(', ')
      return `CREATE ${unique}INDEX ${quoteIdent(c.indexName)} ON ${quoteIdent(c.reverseTable)} (${cols});`
    }
    case 'drop_table': {
      validateIdentifier(c.table, 'table name')
      const cols = c.reverseColumns.map(formatColumnDef).join(', ')
      return `CREATE TABLE ${quoteIdent(c.table)} (${cols});`
    }
    case 'add_foreign_key': {
      validateIdentifier(c.table, 'table name')
      // 沒給 constraintName 時 Postgres 自動命名 ${table}_${column}_fkey
      const name = c.constraintName || `${c.table}_${c.column}_fkey`
      validateIdentifier(name, 'fk constraint name (auto-derived)')
      return `ALTER TABLE ${quoteIdent(c.table)} DROP CONSTRAINT IF EXISTS ${quoteIdent(name)};`
    }
  }
}

// ============================================================
// Public API
// ============================================================

export function schemaChangesToSql(changes: SchemaChange[]): {
  forward: string
  reverse: string
  warnings: string[]
} {
  const warnings: string[] = []
  if (changes.length === 0) {
    return { forward: '', reverse: '', warnings: ['empty schema changes'] }
  }

  const forwardSorted = sortForForward(changes)
  const reverseSorted = sortForReverse(changes)

  const forwardStmts = forwardSorted.map(forwardSql)
  const reverseStmts = reverseSorted.map(reverseSql)

  // 警告：destructive + 無 reverse meta（理論上型別已強制，這裡防 LLM 透過 any 繞過）
  for (const c of changes) {
    if (c.kind === 'drop_column' && (!c.reverseType || !c.reverseType.trim())) {
      warnings.push(`drop_column on ${c.table}.${c.column} 缺 reverseType — rollback 將不可用`)
    }
    if (c.kind === 'drop_table' && (!c.reverseColumns || c.reverseColumns.length === 0)) {
      warnings.push(`drop_table on ${c.table} 缺 reverseColumns — rollback 將不可用`)
    }
  }

  return {
    forward: forwardStmts.join('\n'),
    reverse: reverseStmts.join('\n'),
    warnings,
  }
}

export function isDestructive(c: SchemaChange): boolean {
  return c.destructive === true
}

export function classifySchemaChanges(changes: SchemaChange[]): SchemaClassification {
  if (changes.length === 0) return 'additive'
  const hasDestructive = changes.some(isDestructive)
  const hasAdditive = changes.some(c => !isDestructive(c))
  if (hasDestructive && hasAdditive) return 'mixed'
  if (hasDestructive) return 'destructive'
  return 'additive'
}
