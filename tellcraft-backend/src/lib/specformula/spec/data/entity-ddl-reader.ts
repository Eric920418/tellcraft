import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { TableDefinition, DatabaseSchema, type ColumnDefinition, type EntityTableMapping } from './models';
import type { IsaDataSourceConfig } from '../isa/models';

const CREATE_TABLE_PATTERN = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(/gi;
const TABLE_COMMENT_PATTERN = /\)\s*COMMENT\s+'([^']*)'/i;
const COLUMN_COMMENT_PATTERN = /COMMENT\s+'([^']*)'/i;
const DEFAULT_PATTERN = /DEFAULT\s+(\S+)/i;
const CHECK_PATTERN = /CHECK\s*\((.+)\)/i;
const COMPOSITE_PK_PATTERN = /PRIMARY\s+KEY\s*\(([^)]+)\)/i;
const FOREIGN_KEY_PATTERN = /FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+(\w+)\s*\(([^)]+)\)/i;

export class EntityDdlReader {
  private readonly resourcePath: string;
  private readonly dataSourceName: string;
  private readonly dbType: string;

  constructor(dataSourceConfig: IsaDataSourceConfig) {
    this.resourcePath = dataSourceConfig.resource_path;
    this.dataSourceName = dataSourceConfig.name ?? 'default';
    this.dbType = dataSourceConfig.db_type ?? 'postgresql';
  }

  read(): DatabaseSchema {
    const schema = new DatabaseSchema();
    schema.dataSourceName = this.dataSourceName;
    schema.dbType = this.dbType;

    const dirPath = path.resolve(this.resourcePath);
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      throw new Error(`DDL directory not found: ${dirPath}`);
    }

    this.scanDirectory(dirPath, schema);
    return schema;
  }

  private scanDirectory(dirPath: string, schema: DatabaseSchema): void {
    // Validate entity_to_table_mapping.yml exists
    const mappingFile = path.join(dirPath, 'entity_to_table_mapping.yml');
    if (!fs.existsSync(mappingFile)) {
      throw new Error(`entity_to_table_mapping.yml not found in: ${dirPath}`);
    }

    // Read SQL files, sorted for deterministic order
    const sqlFiles = fs.readdirSync(dirPath)
      .filter(f => f.endsWith('.sql'))
      .sort()
      .map(f => path.join(dirPath, f));

    if (sqlFiles.length === 0) {
      throw new Error(`No .sql files found in: ${dirPath}`);
    }

    for (const file of sqlFiles) {
      const sql = fs.readFileSync(file, 'utf-8');
      const parsed = this.parseDdl(sql);
      for (const t of parsed) {
        t.dbType = this.dbType;
      }
      schema.tables.push(...parsed);
    }

    // Check duplicate table names
    const seenTableNames = new Set<string>();
    for (const table of schema.tables) {
      if (seenTableNames.has(table.tableName)) {
        throw new Error(`Duplicate table name: ${table.tableName}`);
      }
      seenTableNames.add(table.tableName);
    }

    // Read entity_to_table_mapping.yml
    const mappingContent = fs.readFileSync(mappingFile, 'utf-8');
    const mapping = yaml.load(mappingContent) as EntityTableMapping;
    schema.setEntityTableMapping(mapping);

    // Validate mapping against SQL table names
    for (const entry of mapping.entity_to_table_mapping) {
      for (const [entityName, tableName] of Object.entries(entry)) {
        if (!seenTableNames.has(tableName)) {
          throw new Error(
            `entity_to_table_mapping 中的 table '${tableName}' (entity: ${entityName}) 不存在於 SQL 定義中`
          );
        }
      }
    }
  }

  parseDdl(sql: string): TableDefinition[] {
    const tables: TableDefinition[] = [];
    let match: RegExpExecArray | null;

    // Reset lastIndex for global regex
    CREATE_TABLE_PATTERN.lastIndex = 0;
    while ((match = CREATE_TABLE_PATTERN.exec(sql)) !== null) {
      const tableName = match[1];
      const bodyStart = match.index + match[0].length;

      // Find matching closing ')'
      const bodyEnd = this.findMatchingParen(sql, bodyStart - 1);
      if (bodyEnd < 0) continue;

      const body = sql.substring(bodyStart, bodyEnd);
      const table = new TableDefinition(tableName);

      // Parse table comment after closing ')'
      const afterBody = sql.substring(bodyEnd, Math.min(bodyEnd + 200, sql.length));
      const tableCommentMatch = TABLE_COMMENT_PATTERN.exec(')' + afterBody);
      if (tableCommentMatch) {
        table.comment = tableCommentMatch[1];
      }

      // Split body into segments by top-level commas
      const segments = this.splitByTopLevelComma(body);
      for (const segment of segments) {
        let trimmed = segment.trim();
        if (!trimmed) continue;

        // Remove inline comments
        const cleaned = trimmed.replace(/(?:^|\s)--.*$/gm, '').trim();
        if (!cleaned) continue;

        const upper = cleaned.toUpperCase();
        if (upper.startsWith('INDEX') || upper.startsWith('UNIQUE') || upper.startsWith('CHECK')) {
          continue;
        }
        if (upper.startsWith('FOREIGN KEY') || (upper.startsWith('CONSTRAINT') && upper.includes('FOREIGN KEY'))) {
          this.applyForeignKey(cleaned, table);
          continue;
        }
        if (upper.startsWith('PRIMARY KEY') || (upper.startsWith('CONSTRAINT') && upper.includes('PRIMARY KEY'))) {
          this.applyCompositePrimaryKey(cleaned, table);
          continue;
        }

        const col = this.parseColumn(trimmed);
        if (col) table.columns.push(col);
      }

      // Collect pkColumns from inline PRIMARY KEY
      for (const col of table.columns) {
        if (col.primaryKey) table.pkColumns.add(col.name);
      }

      // Set queryColumns: non-PK, non-high-precision
      table.queryColumns = table.columns
        .filter(c => !c.primaryKey && !this.isHighPrecisionType(c.type))
        .map(c => c.name);

      tables.push(table);
    }

    return tables;
  }

  private parseColumn(line: string): ColumnDefinition | null {
    let cleaned = line.replace(/(?:^|\s)--.*$/gm, '').trim();
    if (!cleaned) return null;

    // Extract COMMENT 'xxx'
    let comment: string | undefined;
    const commentMatch = COLUMN_COMMENT_PATTERN.exec(cleaned);
    if (commentMatch) {
      comment = commentMatch[1];
      cleaned = cleaned.replace(COLUMN_COMMENT_PATTERN, '').trim();
    }

    const tokens = cleaned.split(/\s+/);
    if (tokens.length < 2) return null;

    const name = tokens[0];
    if (name.toUpperCase() === 'CONSTRAINT') return null;

    const rest = cleaned.substring(name.length).trim();
    const type = this.extractType(rest);
    const constraints = rest.substring(type.length).trim();
    const upperConstraints = constraints.toUpperCase();

    const col: ColumnDefinition = {
      name,
      type,
      comment,
      notNull: upperConstraints.includes('NOT NULL'),
      primaryKey: upperConstraints.includes('PRIMARY KEY') || type.toUpperCase().endsWith('SERIAL'),
      unique: upperConstraints.includes('UNIQUE'),
      autoIncrement: upperConstraints.includes('IDENTITY') || type.toUpperCase().endsWith('SERIAL'),
    };

    const defaultMatch = DEFAULT_PATTERN.exec(constraints);
    if (defaultMatch) {
      let defaultValue = defaultMatch[1];
      if (defaultValue.startsWith("'") && defaultValue.endsWith("'") && defaultValue.length >= 2) {
        defaultValue = defaultValue.substring(1, defaultValue.length - 1);
      }
      col.defaultValue = defaultValue;
    }

    const checkMatch = CHECK_PATTERN.exec(constraints);
    if (checkMatch) {
      col.checkConstraint = checkMatch[1];
    }

    // Inline REFERENCES: e.g., "show_id UUID NOT NULL REFERENCES shows(id)"
    const inlineRefMatch = /REFERENCES\s+(\w+)\s*\((\w+)\)/i.exec(constraints);
    if (inlineRefMatch) {
      col.foreignKey = `${inlineRefMatch[1]}.${inlineRefMatch[2]}`;
    }

    return col;
  }

  private applyCompositePrimaryKey(segment: string, table: TableDefinition): void {
    const m = COMPOSITE_PK_PATTERN.exec(segment);
    if (!m) return;
    const pkColNames = m[1].split(',');
    for (const pkColName of pkColNames) {
      const name = pkColName.trim();
      table.pkColumns.add(name);
      for (const col of table.columns) {
        if (col.name.toLowerCase() === name.toLowerCase()) {
          col.primaryKey = true;
        }
      }
    }
  }

  private applyForeignKey(segment: string, table: TableDefinition): void {
    const m = FOREIGN_KEY_PATTERN.exec(segment);
    if (!m) return;
    const fkColName = m[1].trim();
    const refTable = m[2].trim();
    const refCol = m[3].trim();
    for (const col of table.columns) {
      if (col.name.toLowerCase() === fkColName.toLowerCase()) {
        col.foreignKey = `${refTable}.${refCol}`;
      }
    }
  }

  private extractType(rest: string): string {
    const typePattern = /^(\w+(?:\s*\([^)]*\))?)/;
    const m = typePattern.exec(rest);
    if (m) return m[1];
    return rest.split(/\s+/)[0];
  }

  private isHighPrecisionType(type: string): boolean {
    const upper = type.toUpperCase();
    return upper.startsWith('TIMESTAMP') || upper.startsWith('DATETIME') ||
           upper.startsWith('DATE') || upper.startsWith('TIME') ||
           upper.startsWith('INTERVAL');
  }

  private findMatchingParen(sql: string, openParenIndex: number): number {
    let depth = 0;
    let inSingleQuote = false;
    for (let i = openParenIndex; i < sql.length; i++) {
      const c = sql[i];
      if (c === "'" && !inSingleQuote) {
        inSingleQuote = true;
      } else if (c === "'" && inSingleQuote) {
        inSingleQuote = false;
      } else if (!inSingleQuote) {
        if (c === '(') depth++;
        else if (c === ')') {
          depth--;
          if (depth === 0) return i;
        }
      }
    }
    return -1;
  }

  private splitByTopLevelComma(body: string): string[] {
    const segments: string[] = [];
    let depth = 0;
    let inSingleQuote = false;
    let inLineComment = false;
    let start = 0;

    for (let i = 0; i < body.length; i++) {
      const c = body[i];

      if (inLineComment) {
        if (c === '\n' || c === '\r') inLineComment = false;
        continue;
      }

      if (c === '-' && i + 1 < body.length && body[i + 1] === '-' && !inSingleQuote) {
        inLineComment = true;
        continue;
      }

      if (c === "'" && !inSingleQuote) {
        inSingleQuote = true;
      } else if (c === "'" && inSingleQuote) {
        inSingleQuote = false;
      } else if (!inSingleQuote) {
        if (c === '(') depth++;
        else if (c === ')') depth--;
        else if (c === ',' && depth === 0) {
          segments.push(body.substring(start, i));
          start = i + 1;
        }
      }
    }
    if (start < body.length) {
      segments.push(body.substring(start));
    }
    return segments;
  }
}
