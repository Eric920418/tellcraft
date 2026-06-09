// ============================================================
// Schema Derivation — BDD schemaSql → PostgreSQL DDL（Neon 相容）
// 零 LLM 的規則式推導
// ============================================================

import { createLogger } from '../lib/logger'

const logger = createLogger('schema-derivation')

// ============================================================
// FK Delete Behavior 預設推導（安全網：LLM 沒明確寫 ON DELETE 時使用）
// ============================================================

/**
 * 判斷 FK 欄位是否 nullable（掃描 table 所有欄位定義）
 */
function isColumnNullable(fkColName: string, allColumns: string[]): boolean {
  const lowerFk = fkColName.toLowerCase()
  for (const col of allColumns) {
    const colNameMatch = col.match(/^\s*(\w+)\s+/)
    if (colNameMatch && colNameMatch[1].toLowerCase() === lowerFk) {
      return !/\bNOT\s+NULL\b/i.test(col)
    }
  }
  // 找不到欄位定義 → 保守估計為 nullable
  return true
}

/**
 * 推導 FK 的預設 ON DELETE 行為（當 LLM 沒明確寫時）
 * - nullable FK → SET NULL（鬆耦合，子可獨立存活）
 * - NOT NULL FK → CASCADE（強耦合，子依賴父）
 *
 * 注意：這是保守 fallback。LLM 應該在 prompt 裡明確指定。
 */
function inferDefaultOnDelete(fkColName: string, allColumns: string[]): string {
  const nullable = isColumnNullable(fkColName, allColumns)
  const clause = nullable ? ' ON DELETE SET NULL' : ' ON DELETE CASCADE'
  logger.info({ fkColName, nullable, inferred: clause.trim() }, 'FK ON DELETE fallback 推導')
  return clause
}

// ============================================================
// 型別定義
// ============================================================

export interface DerivedEntity {
  chineseName: string   // 中文名（從 entityMapping）
  tableName: string     // snake_case 表名
  columnCount: number
}

export interface DerivedSchema {
  displaySummary: string     // 給用戶看的可讀中文摘要
  postgresqlDDL: string      // 可直接在 Neon PostgreSQL 執行的 SQL
  entityCount: number
  entities: DerivedEntity[]
  hasMagicLink: boolean      // 偵測到 users.email 欄位，自動附加 magic_link_tokens 表
}

// ============================================================
// Magic-link Tokens 表（自動加入，支援 passwordless 登入）
// ============================================================

export const MAGIC_LINK_TOKENS_DDL = `
-- Magic-link Tokens（passwordless 登入，自動附加）
CREATE TABLE IF NOT EXISTS magic_link_tokens (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_email ON magic_link_tokens(email);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_expires_at ON magic_link_tokens(expires_at);
ALTER TABLE magic_link_tokens ENABLE ROW LEVEL SECURITY;
`.trim()

/**
 * 偵測 tables 是否含 magic-link 能力
 * 條件：存在 users 表且含 email 欄位（VARCHAR/TEXT/CITEXT）
 */
export function detectMagicLinkInTables(tables: ParsedTable[]): boolean {
  const usersTable = tables.find(t => t.tableName.toLowerCase() === 'users')
  if (!usersTable) return false
  return usersTable.columns.some(col => /^\s*email\s+(VARCHAR|TEXT|CITEXT)/i.test(col))
}

// ============================================================
// Entity Mapping 解析（中英文對照）
// ============================================================

function parseEntityMapping(entityMapping: string): Map<string, string> {
  const map = new Map<string, string>() // english → chinese
  const lines = entityMapping.split('\n')
  for (const line of lines) {
    const match = line.match(/[-\s]*(.+?):\s*(\w+)/)
    if (match && match[1] && match[2] && match[1] !== 'entity_to_table_mapping') {
      map.set(match[2].trim().toLowerCase(), match[1].trim())
    }
  }
  return map
}

/** 解析 entity mapping（中文 → table name），供外部驗證用 */
export function parseEntityToTableMapping(entityMapping: string): Map<string, string> {
  const map = new Map<string, string>() // chinese → english_table
  const lines = entityMapping.split('\n')
  for (const line of lines) {
    const match = line.match(/[-\s]*(.+?):\s*(\w+)/)
    if (match && match[1] && match[2] && match[1] !== 'entity_to_table_mapping') {
      map.set(match[1].trim(), match[2].trim().toLowerCase())
    }
  }
  return map
}

/**
 * L31.E：BDD 生成時注入 schema nullable columns metadata
 *
 * 給 `formulation.ts` BDD 生成階段用 — 讓 LLM 知道每個 entity 的哪些 columns 是
 * nullable + default 行為，避免生成「Then 期望 $notnull 但 entity_setup 沒給」這種矛盾。
 *
 * 演算法（零 LLM）：
 *   1. parseCreateTables(schemaSql) → tables
 *   2. parseEntityToTableMapping(entityMapping) → 中文 entity → table 名
 *   3. 對每個 entity 的每個 column：分類為 nullable_no_default / nullable_with_default
 *   4. 跳過系統欄位（id, created_at, updated_at, deleted_at）
 *   5. 組成 markdown hint
 *
 * @param relatedEntities 可選限縮 — 只列這些 entity 的 hint，避免 token 爆量。
 *                       不傳 → 全部 entity 都列。
 */
export function extractNullableColumnsHint(
  schemaSql: string,
  entityMapping: string,
  relatedEntities?: string[]
): string {
  const tables = parseCreateTables(schemaSql)
  const entityToTable = parseEntityToTableMapping(entityMapping)
  if (tables.length === 0 || entityToTable.size === 0) return ''

  // 用小寫 set 比對 relatedEntities（同時支援中文 entity / 英文 table 名）
  const relatedSet = relatedEntities && relatedEntities.length > 0
    ? new Set(relatedEntities.map(e => e.toLowerCase()))
    : null

  const SYSTEM_COLS = new Set(['id', 'created_at', 'updated_at', 'deleted_at', 'submitted_at', 'published_at'])

  const lines: string[] = []
  for (const [chineseName, tableName] of entityToTable) {
    if (relatedSet) {
      // 比對中文 entity 名 OR 英文 table 名（任一命中就列入）
      if (!relatedSet.has(chineseName.toLowerCase()) && !relatedSet.has(tableName.toLowerCase())) continue
    }
    const table = tables.find(t => t.tableName.toLowerCase() === tableName.toLowerCase())
    if (!table) continue

    const nullableNoDefault: string[] = []
    const nullableWithDefault: string[] = []  // 格式：name(default_value)

    for (const col of table.columns) {
      // 跳過約束行（PRIMARY KEY / FOREIGN KEY / UNIQUE / CHECK / CONSTRAINT）
      if (/^\s*(PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|CHECK|CONSTRAINT)\b/i.test(col)) continue

      // 提取欄位名（第一個 word）
      const nameMatch = col.match(/^\s*(\w+)\s+/)
      if (!nameMatch) continue
      const colName = nameMatch[1].toLowerCase()
      if (SYSTEM_COLS.has(colName)) continue

      const isNotNull = /\bNOT\s+NULL\b/i.test(col)
      const defaultMatch = col.match(/\bDEFAULT\s+([^,\n]+?)(?:\s+ON\s+|\s+REFERENCES|\s+COMMENT|\s*$)/i)
      const hasDefault = !!defaultMatch
      const defaultValue = defaultMatch ? defaultMatch[1].trim().replace(/['"]/g, '').slice(0, 30) : ''

      if (isNotNull) {
        // NOT NULL with/without DEFAULT — entity_setup 不必給也 OK（DB 會用 default 或拒絕）
        // 不放進 hint，因為 NOT NULL 缺值已被 Check 2 覆蓋
        continue
      }

      if (hasDefault) {
        nullableWithDefault.push(`${colName}(default=${defaultValue})`)
      } else {
        nullableNoDefault.push(colName)
      }
    }

    if (nullableNoDefault.length === 0 && nullableWithDefault.length === 0) continue

    const parts: string[] = [`- **${chineseName}** (${tableName})`]
    if (nullableNoDefault.length > 0) parts.push(`  - nullable_no_default: \`[${nullableNoDefault.join(', ')}]\` ⚠️ 期望 \`$notnull\` 必須在 entity_setup 給值`)
    if (nullableWithDefault.length > 0) parts.push(`  - nullable_with_default: \`[${nullableWithDefault.join(', ')}]\``)
    lines.push(parts.join('\n'))
  }

  if (lines.length === 0) return ''

  return [
    '## Schema Nullable 提示（避免 BDD spec 自相矛盾）',
    '',
    '以下欄位在 DB 預設為 null。如果 Then 表期望 `$notnull` 或具體值，必須在對應的 `準備一個 X, with table:` 提供該欄位值，否則 SpecFormula 永遠失敗（LLM 修 code 修不好）。',
    '',
    ...lines,
  ].join('\n')
}

// ============================================================
// R3-B: BDD 生成階段的 schema 引導 hint（dynamic block 注入）
// ============================================================

/**
 * R3-B Helper 1: 列出每個 entity 的 FK target，提醒 LLM 必須先建 parent entity
 *
 * 從 schemaSql 解析 `column REFERENCES table(col)` 模式
 * 輸出範例：
 *   - **訂單項目** (OrderItem) FK:
 *     - orderId → Order.id（必須先建 Order）
 *     - productId → Product.id
 */
export function extractFkRelationshipHint(
  schemaSql: string,
  entityMapping: string,
  relatedEntities?: string[]
): string {
  const tables = parseCreateTables(schemaSql)
  const entityToTable = parseEntityToTableMapping(entityMapping)
  if (tables.length === 0 || entityToTable.size === 0) return ''

  const relatedSet = relatedEntities && relatedEntities.length > 0
    ? new Set(relatedEntities.map(e => e.toLowerCase()))
    : null

  // table → entity 反查
  const tableToEntity = new Map<string, string>()
  for (const [entity, table] of entityToTable) {
    tableToEntity.set(table.toLowerCase(), entity)
  }

  const lines: string[] = []
  for (const [chineseName, tableName] of entityToTable) {
    if (relatedSet) {
      if (!relatedSet.has(chineseName.toLowerCase()) && !relatedSet.has(tableName.toLowerCase())) continue
    }
    const table = tables.find(t => t.tableName.toLowerCase() === tableName.toLowerCase())
    if (!table) continue

    const fks: string[] = []
    for (const col of table.columns) {
      if (/^\s*(PRIMARY\s+KEY|UNIQUE|CHECK|CONSTRAINT)\b/i.test(col)) continue
      // 偵測 `colName ... REFERENCES TableName(col)` 模式
      const m = col.match(/^\s*(\w+)\s+.*?REFERENCES\s+(\w+)\s*\(\s*(\w+)\s*\)/i)
      if (!m) continue
      const fkColumn = m[1]
      const refTable = m[2]
      const refCol = m[3]
      const parentEntity = tableToEntity.get(refTable.toLowerCase()) ?? refTable
      fks.push(`${fkColumn} → ${parentEntity}.${refCol}（必須先建 ${parentEntity}）`)
    }
    if (fks.length === 0) continue
    lines.push(`- **${chineseName}** (${tableName}) FK:`)
    for (const fk of fks) lines.push(`  - ${fk}`)
  }

  if (lines.length === 0) return ''

  return [
    '## Schema FK 關係提示（避免 entity_setup INSERT 失敗）',
    '',
    '以下 entity 的 FK 欄位指向其他 entity 的主鍵。在 `準備一個 X, with table:` 時必須：',
    '- 先建立 parent entity（用 `> ParentEntity1.id` 宣告，或 `$ParentEntity.id` 引用既有）',
    '- FK 欄位給有效的 parent ID（不要憑空寫死 UUID）',
    '',
    ...lines,
  ].join('\n')
}

/**
 * R3-B Helper 2: 列出每個 column 的 CHECK constraint 合法值
 *
 * 從 schemaSql 解析 `CHECK (col IN ('a','b'))` 或 `CHECK (col >= N)` 模式
 * 輸出範例：
 *   - **訂單** (Order):
 *     - status: IN ('pending', 'confirmed', 'completed', 'cancelled')
 *     - quantity: >= 1
 */
export function extractCheckConstraintHint(
  schemaSql: string,
  entityMapping: string,
  relatedEntities?: string[]
): string {
  const tables = parseCreateTables(schemaSql)
  const entityToTable = parseEntityToTableMapping(entityMapping)
  if (tables.length === 0 || entityToTable.size === 0) return ''

  const relatedSet = relatedEntities && relatedEntities.length > 0
    ? new Set(relatedEntities.map(e => e.toLowerCase()))
    : null

  const lines: string[] = []
  for (const [chineseName, tableName] of entityToTable) {
    if (relatedSet) {
      if (!relatedSet.has(chineseName.toLowerCase()) && !relatedSet.has(tableName.toLowerCase())) continue
    }
    const table = tables.find(t => t.tableName.toLowerCase() === tableName.toLowerCase())
    if (!table) continue

    const checks: string[] = []
    for (const col of table.columns) {
      // 偵測 inline CHECK：`colName ... CHECK (xxx)`
      // 用 balanced paren 提取 CHECK 內整段（避免 `IN ('a','b')` 含內層 paren 被截斷）
      const colNameMatch = col.match(/^\s*(\w+)\s+/)
      if (!colNameMatch) continue
      const colName = colNameMatch[1]
      if (/^\s*(PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|CHECK|CONSTRAINT)\b/i.test(col)) continue

      const checkIdx = col.search(/\bCHECK\s*\(/i)
      if (checkIdx === -1) continue
      // 從 `CHECK (` 後找平衡的 `)`
      const openIdx = col.indexOf('(', checkIdx)
      if (openIdx === -1) continue
      let depth = 1
      let closeIdx = -1
      for (let k = openIdx + 1; k < col.length; k++) {
        const ch = col[k]
        if (ch === '(') depth++
        else if (ch === ')') { depth--; if (depth === 0) { closeIdx = k; break } }
      }
      if (closeIdx === -1) continue
      const checkExpr = col.substring(openIdx + 1, closeIdx).trim()

      // 提取 enum: `colName IN ('a','b')`
      const inMatch = checkExpr.match(/\bIN\s*\(([^)]+)\)/i)
      if (inMatch) {
        const values = inMatch[1].split(',').map(v => v.trim().replace(/^['"]|['"]$/g, ''))
        checks.push(`${colName}: IN (${values.map(v => `'${v}'`).join(', ')})`)
        continue
      }
      // 數值比較
      const cmpMatch = checkExpr.match(/(\w+)\s*(>=|<=|>|<|=)\s*(-?\d+(?:\.\d+)?)/)
      if (cmpMatch) {
        checks.push(`${colName}: ${cmpMatch[2]} ${cmpMatch[3]}`)
        continue
      }
    }
    if (checks.length === 0) continue
    lines.push(`- **${chineseName}** (${tableName}):`)
    for (const c of checks) lines.push(`  - ${c}`)
  }

  if (lines.length === 0) return ''

  return [
    '## Schema CHECK 約束合法值（避免 INSERT 失敗）',
    '',
    '以下欄位有 CHECK 約束，entity_setup DataTable 必須用清單內的值。違反會讓 INSERT 失敗。',
    '',
    ...lines,
  ].join('\n')
}

// ============================================================
// SQL 解析 + 轉換
// ============================================================

export interface ParsedTable {
  tableName: string
  originalBlock: string
  columns: string[]
}

/**
 * 括號平衡的逗號分割，正確處理 ENUM('a', 'b') 和 PRIMARY KEY (col1, col2)
 */
function splitColumnsBalanced(body: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ''
  let inString = false

  for (const ch of body) {
    if (inString) {
      current += ch
      if (ch === "'") inString = false
      continue
    }
    if (ch === "'") {
      inString = true
      current += ch
      continue
    }
    if (ch === '(') { depth++; current += ch; continue }
    if (ch === ')') { depth--; current += ch; continue }
    if (ch === ',' && depth === 0) {
      if (current.trim()) parts.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }
  if (current.trim()) parts.push(current.trim())
  return parts
}

export function parseCreateTables(schemaSql: string): ParsedTable[] {
  const tables: ParsedTable[] = []
  // 支持 MySQL TABLE COMMENT 語法：) COMMENT '...'; 或直接 );
  // 支援 `CREATE TABLE IF NOT EXISTS`（CMS skeleton / content 模組表都用此語法）。
  // 此前缺 (?:IF NOT EXISTS)? → skeleton 表被靜默丟掉，進不了 Neon、也不生 admin panel（治本：認 IF NOT EXISTS）。
  const regex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(([\s\S]*?)\)\s*(?:COMMENT\s+'[^']*')?\s*;/gi
  let match: RegExpExecArray | null

  while ((match = regex.exec(schemaSql)) !== null) {
    const tableName = match[1].toLowerCase()
    const body = match[2]
    const columns = splitColumnsBalanced(body)
    tables.push({ tableName, originalBlock: match[0], columns })
  }

  return tables
}

function transformToPostgresqlDDL(tables: ParsedTable[]): string {
  const statements: string[] = []
  const commentStatements: string[] = []
  const rlsStatements: string[] = []
  // FK 約束延後到所有表建完後再加（避免表順序導致 FK 失敗）
  const deferredFkStatements: string[] = []

  for (const table of tables) {
    const transformedColumns: string[] = []
    let hasCreatedAt = false
    let hasId = false
    let hasPrimaryKey = false

    // === Pass 1: 收集 FK 欄位 + PK 欄位 ===
    const fkColumns = new Set<string>()
    const pkColumns = new Set<string>()
    for (const col of table.columns) {
      const fkMatch = col.match(/CONSTRAINT\s+(\w+)\s+FOREIGN\s+KEY\s*\((\w+)\)\s+REFERENCES\s+(\w+)\s*\((\w+)\)/i)
      if (fkMatch) {
        fkColumns.add(fkMatch[2].toLowerCase())
      }
      // 偵測 PRIMARY KEY（含 CONSTRAINT ... PRIMARY KEY）
      if (/PRIMARY\s+KEY/i.test(col)) {
        hasPrimaryKey = true
        // 收集 PK 欄位名（用於 VARCHAR→UUID 轉換）
        const pkMatch = col.match(/PRIMARY\s+KEY\s*\((\w+)\)/i)
        if (pkMatch) {
          pkColumns.add(pkMatch[1].toLowerCase())
        }
      }
    }

    // === Pass 2: 逐欄轉換 ===
    for (const col of table.columns) {
      let transformed = col

      // 移除內聯 COMMENT（COMMENT '...'）
      const commentMatch = transformed.match(/COMMENT\s+'([^']+)'/i)
      if (commentMatch) {
        transformed = transformed.replace(/\s*COMMENT\s+'[^']+'/i, '')
        const colNameMatch = transformed.match(/^\s*(\w+)/)
        if (colNameMatch) {
          commentStatements.push(
            `COMMENT ON COLUMN ${table.tableName}.${colNameMatch[1]} IS '${commentMatch[1]}';`
          )
        }
      }

      // 檢測 ID 欄位：VARCHAR PRIMARY KEY → UUID
      if (/^\s*id\s+VARCHAR/i.test(transformed)) {
        transformed = '  id UUID PRIMARY KEY DEFAULT gen_random_uuid()'
        hasId = true
      } else if (/^\s*id\s/i.test(transformed)) {
        hasId = true
      }

      // 檢測 created_at / updated_at
      if (/^\s*created_at\s/i.test(transformed)) {
        hasCreatedAt = true
      }

      // 檢測 PRIMARY KEY（含 CONSTRAINT ... PRIMARY KEY）→ 標記不需要自動加 id
      if (/PRIMARY\s+KEY/i.test(transformed)) {
        hasPrimaryKey = true
      }

      // CONSTRAINT ... PRIMARY KEY → 跳過（id 欄位已有內聯 PRIMARY KEY，避免 multiple primary keys）
      if (/^\s*CONSTRAINT\s+\w+\s+PRIMARY\s+KEY/i.test(transformed)) {
        continue
      }

      // 獨立 PRIMARY KEY (col) 行（非 CONSTRAINT 形式）→ 如果該欄位已有內聯 PK，跳過
      if (/^\s*PRIMARY\s+KEY\s*\(/i.test(transformed)) {
        // 檢查對應欄位是否已在 transformedColumns 中帶 PRIMARY KEY
        const pkColMatch = transformed.match(/PRIMARY\s+KEY\s*\((\w+)\)/i)
        if (pkColMatch) {
          const pkCol = pkColMatch[1].toLowerCase()
          const alreadyInline = transformedColumns.some(c =>
            new RegExp(`^\\s*${pkCol}\\s+.*PRIMARY\\s+KEY`, 'i').test(c)
          )
          if (alreadyInline) continue
        }
      }

      // CONSTRAINT ... FOREIGN KEY → 抽出延後執行（避免表順序導致 FK 失敗）
      const constraintFkMatch = transformed.match(/^\s*CONSTRAINT\s+(\w+)\s+FOREIGN\s+KEY\s*\((\w+)\)\s+REFERENCES\s+(\w+)\s*\((\w+)\)(\s+ON\s+(?:DELETE|UPDATE)\s+(?:CASCADE|SET\s+NULL|SET\s+DEFAULT|RESTRICT|NO\s+ACTION))*/i)
      if (constraintFkMatch) {
        // LLM 沒寫 ON DELETE → 用 nullable 推導預設（SET NULL / CASCADE）
        const onClause = constraintFkMatch[5] || inferDefaultOnDelete(constraintFkMatch[2], table.columns)
        deferredFkStatements.push(
          `ALTER TABLE ${table.tableName} ADD CONSTRAINT ${constraintFkMatch[1]} FOREIGN KEY (${constraintFkMatch[2]}) REFERENCES ${constraintFkMatch[3]}(${constraintFkMatch[4]})${onClause};`
        )
        // 不加入 CREATE TABLE，跳過
        continue
      }

      // 內聯 REFERENCES → 拆成欄位定義 + 延後 FK
      const inlineRefMatch = transformed.match(/^\s*(\w+)\s+.*?(UUID|VARCHAR\(\d+\))\s+(NOT\s+NULL\s+)?REFERENCES\s+(\w+)\s*\((\w+)\)/i)
      if (inlineRefMatch) {
        const colName = inlineRefMatch[1]
        const refTable = inlineRefMatch[4]
        const refCol = inlineRefMatch[5]
        // 先提取原有的 ON DELETE/UPDATE 子句（replace 之前）
        const onClauseMatch = transformed.match(/\s+(ON\s+(?:DELETE|UPDATE)\s+(?:CASCADE|SET\s+NULL|SET\s+DEFAULT|RESTRICT|NO\s+ACTION)(?:\s+ON\s+(?:DELETE|UPDATE)\s+(?:CASCADE|SET\s+NULL|SET\s+DEFAULT|RESTRICT|NO\s+ACTION))*)/i)
        const preservedOnClause = onClauseMatch ? ` ${onClauseMatch[1]}` : inferDefaultOnDelete(colName, table.columns)
        // 移除 REFERENCES 子句 + ON DELETE/UPDATE（完整移除外鍵相關語法）
        transformed = transformed.replace(/\s*REFERENCES\s+\w+\s*\(\w+\)(\s+ON\s+(?:DELETE|UPDATE)\s+(?:CASCADE|SET\s+NULL|SET\s+DEFAULT|RESTRICT|NO\s+ACTION))*/gi, '')
        deferredFkStatements.push(
          `ALTER TABLE ${table.tableName} ADD CONSTRAINT fk_${table.tableName}_${colName} FOREIGN KEY (${colName}) REFERENCES ${refTable}(${refCol})${preservedOnClause};`
        )
      } else {
        // VARCHAR(n) 的內聯外鍵引用（舊路徑，已被上面攔截，保留 fallback）
        transformed = transformed.replace(
          /VARCHAR\(\d+\)\s+(NOT\s+NULL\s+)?REFERENCES\s+(\w+)\s*\((\w+)\)(\s+ON\s+(?:DELETE|UPDATE)\s+(?:CASCADE|SET\s+NULL|SET\s+DEFAULT|RESTRICT|NO\s+ACTION))*/gi,
          'UUID $1REFERENCES $2($3)$4'
        )
      }

      // FK / PK 欄位（CONSTRAINT 行分離的情況）：VARCHAR(n) → UUID
      const colNameForTypeConvert = transformed.match(/^\s*(\w+)\s+VARCHAR/i)
      if (colNameForTypeConvert) {
        const colNameLower = colNameForTypeConvert[1].toLowerCase()
        if (fkColumns.has(colNameLower) || pkColumns.has(colNameLower)) {
          transformed = transformed.replace(/VARCHAR\(\d+\)/i, 'UUID')
        }
      }

      // ── MySQL → PostgreSQL 型別轉換（安全網）──
      // TINYINT(1) → BOOLEAN（必須在通用 TINYINT 之前）
      transformed = transformed.replace(/\bTINYINT\s*\(\s*1\s*\)/gi, 'BOOLEAN')
      // TINYINT → SMALLINT
      transformed = transformed.replace(/\bTINYINT(?:\s*\(\s*\d+\s*\))?/gi, 'SMALLINT')
      // MEDIUMINT → INTEGER
      transformed = transformed.replace(/\bMEDIUMINT(?:\s*\(\s*\d+\s*\))?/gi, 'INTEGER')
      // INT(n) 顯示寬度 → INTEGER
      transformed = transformed.replace(/\bINT\s*\(\s*\d+\s*\)/gi, 'INTEGER')
      // BIGINT(n) 顯示寬度 → BIGINT
      transformed = transformed.replace(/\bBIGINT\s*\(\s*\d+\s*\)/gi, 'BIGINT')
      // DOUBLE → DOUBLE PRECISION（不影響已經正確的 DOUBLE PRECISION）
      transformed = transformed.replace(/\bDOUBLE\b(?!\s+PRECISION)/gi, 'DOUBLE PRECISION')
      // FLOAT(p,s) / FLOAT → REAL
      transformed = transformed.replace(/\bFLOAT(?:\s*\(\s*\d+(?:\s*,\s*\d+)?\s*\))?/gi, 'REAL')
      // MEDIUMTEXT / LONGTEXT / TINYTEXT → TEXT
      transformed = transformed.replace(/\b(?:MEDIUM|LONG|TINY)TEXT\b/gi, 'TEXT')
      // BLOB 家族 → BYTEA
      transformed = transformed.replace(/\b(?:MEDIUM|LONG|TINY)?BLOB\b/gi, 'BYTEA')
      // AUTO_INCREMENT → 移除
      transformed = transformed.replace(/\s*AUTO_INCREMENT/gi, '')
      // UNSIGNED → 移除
      transformed = transformed.replace(/\s*UNSIGNED/gi, '')
      // DATETIME → TIMESTAMPTZ
      transformed = transformed.replace(/\bDATETIME\b/gi, 'TIMESTAMPTZ')
      // ON UPDATE CURRENT_TIMESTAMP → 移除
      transformed = transformed.replace(/\s*ON\s+UPDATE\s+CURRENT_TIMESTAMP/gi, '')
      // REGEXP → ~
      transformed = transformed.replace(/\bREGEXP\b/gi, '~')

      // MySQL ENUM → VARCHAR + CHECK
      const enumMatch = transformed.match(/^\s*(\w+)\s+ENUM\(([^)]+)\)/i)
      if (enumMatch) {
        const colName = enumMatch[1]
        const values = enumMatch[2]
        transformed = transformed.replace(/ENUM\([^)]+\)/i, 'VARCHAR(50)')
        transformedColumns.push(transformed)
        transformedColumns.push(`  CONSTRAINT chk_${table.tableName}_${colName}_enum CHECK (${colName} IN (${values}))`)
        continue
      }

      transformedColumns.push(transformed)
    }

    // 加入缺少的標準欄位（有複合主鍵時不自動加 id）
    if (!hasId && !hasPrimaryKey) {
      transformedColumns.unshift('  id UUID PRIMARY KEY DEFAULT gen_random_uuid()')
    }
    if (!hasCreatedAt) {
      transformedColumns.push('  created_at TIMESTAMPTZ DEFAULT NOW()')
    }

    statements.push(
      `CREATE TABLE IF NOT EXISTS ${table.tableName} (\n${transformedColumns.join(',\n')}\n);`
    )

    // RLS
    rlsStatements.push(
      `ALTER TABLE ${table.tableName} ENABLE ROW LEVEL SECURITY;`
    )
  }

  const allStatements = [
    '-- Auto-generated by Tellcraft from BDD Spec',
    '-- Neon PostgreSQL DDL',
    '',
    ...statements,
    '',
    '-- Foreign Key Constraints（延後建立，避免表順序問題）',
    ...deferredFkStatements,
    '',
    '-- Row Level Security',
    ...rlsStatements,
    '',
    '-- Column Comments',
    ...commentStatements,
  ]

  return allStatements.join('\n')
}

// ============================================================
// 主函數
// ============================================================

/**
 * CMS skeleton 注入的「基礎設施表」— 治本（parseCreateTables 認 IF NOT EXISTS）後會被解析到，
 * 仍進 postgresqlDDL 建到 Neon，但從用戶可見的 entities/displaySummary 預覽隱藏，保持非技術站長的預覽乾淨。
 * contact_submissions / newsletter_subscribers 是站長要管理的內容，不在此列。
 */
const PREVIEW_HIDDEN_TABLES = new Set(['admins', 'site_settings', 'media_uploads', 'magic_link_tokens'])

export function deriveSchemaFromBdd(schemaSql: string, entityMapping: string): DerivedSchema {
  try {
    const tables = parseCreateTables(schemaSql)

    if (tables.length === 0) {
      return {
        displaySummary: '',
        postgresqlDDL: '',
        entityCount: 0,
        entities: [],
        hasMagicLink: false,
      }
    }

    const entityMap = parseEntityMapping(entityMapping)
    let postgresqlDDL = transformToPostgresqlDDL(tables)

    const hasMagicLink = detectMagicLinkInTables(tables)
    if (hasMagicLink) {
      postgresqlDDL += '\n\n' + MAGIC_LINK_TOKENS_DDL
      logger.info({ table: 'magic_link_tokens' }, '偵測到 users.email → 自動附加 magic_link_tokens 表')
    }

    const entities: DerivedEntity[] = tables
      .filter(t => !PREVIEW_HIDDEN_TABLES.has(t.tableName))
      .map(t => ({
        chineseName: entityMap.get(t.tableName) || t.tableName,
        tableName: t.tableName,
        columnCount: t.columns.length,
      }))

    const displaySummary = entities
      .map(e => `- **${e.chineseName}**（${e.tableName}）：${e.columnCount} 個欄位`)
      .join('\n')

    logger.info({ entityCount: entities.length, tables: entities.map(e => e.tableName), hasMagicLink }, 'Schema 推導完成')

    return {
      displaySummary,
      postgresqlDDL,
      entityCount: entities.length,
      entities,
      hasMagicLink,
    }
  } catch (err) {
    logger.error({ err }, 'Schema 推導失敗')
    return {
      displaySummary: '',
      postgresqlDDL: '',
      entityCount: 0,
      entities: [],
      hasMagicLink: false,
    }
  }
}
