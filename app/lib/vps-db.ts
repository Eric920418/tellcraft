/* eslint-disable @typescript-eslint/no-explicit-any */
import { Pool, type PoolClient } from 'pg'

// VPS PostgreSQL 連線配置
const VPS_DATABASE_URL = process.env.VPS_DATABASE_URL ||
  'postgresql://tellcraft_user:tellcraft_secure_2024@54.238.4.117:5432/tellcraft'

// 建立連線池（Serverless 環境優化）
const pool = new Pool({
  connectionString: VPS_DATABASE_URL,
  max: 3,                            // Serverless 用更少連線，避免爆炸
  idleTimeoutMillis: 10000,          // 更短閒置超時（10秒）
  connectionTimeoutMillis: 10000,
  ssl: false,
  keepAlive: true,                   // 啟用 TCP keepAlive
  keepAliveInitialDelayMillis: 10000, // 10秒後開始發送 keepAlive
})

pool.on('error', (err) => {
  console.error('[VPS DB] Unexpected error on idle client:', err)
})

/**
 * 執行 SQL 查詢
 */
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number }> {
  const start = Date.now()
  try {
    const result = await pool.query(text, params)
    const duration = Date.now() - start
    if (duration > 1000) {
      console.warn(`[VPS DB] Slow query (${duration}ms):`, text.substring(0, 100))
    }
    return { rows: result.rows as T[], rowCount: result.rowCount || 0 }
  } catch (error) {
    console.error('[VPS DB] Query error:', error)
    throw error
  }
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const { rows } = await query<T>(text, params)
  return rows[0] || null
}

export async function getClient(): Promise<PoolClient> {
  return pool.connect()
}

export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// ============================================================
// Supabase 相容 Query Builder
// ============================================================

type QueryResult<T = any> = { data: T; error: null; count?: number } | { data: null; error: { message: string; code?: string }; count?: number }

export function from(table: string): QueryBuilder {
  return new QueryBuilder(table)
}

class QueryBuilder {
  private table: string
  private operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select'
  private selectColumns: string = '*'
  private whereClauses: string[] = []
  private whereParams: unknown[] = []
  private orClauses: string[][] = []
  private orderByClause: string = ''
  private limitValue: number | null = null
  private offsetValue: number | null = null
  private countMode: 'exact' | null = null
  private headOnly: boolean = false
  private insertData: Record<string, unknown>[] = []
  private updateData: Record<string, unknown> = {}
  private upsertConflict: string = 'id'
  private returnSelect: string | null = null

  constructor(table: string) {
    this.table = table
  }

  select(columns: string = '*', options?: { count?: 'exact'; head?: boolean }): this {
    this.operation = 'select'
    this.selectColumns = columns
    if (options?.count === 'exact') {
      this.countMode = 'exact'
    }
    if (options?.head) {
      this.headOnly = true
    }
    return this
  }

  insert(data: Record<string, unknown> | Record<string, unknown>[]): this {
    this.operation = 'insert'
    this.insertData = Array.isArray(data) ? data : [data]
    return this
  }

  update(data: Record<string, unknown>): this {
    this.operation = 'update'
    this.updateData = data
    return this
  }

  delete(): this {
    this.operation = 'delete'
    return this
  }

  upsert(data: Record<string, unknown> | Record<string, unknown>[], options?: { onConflict?: string }): this {
    this.operation = 'upsert'
    this.insertData = Array.isArray(data) ? data : [data]
    this.upsertConflict = options?.onConflict || 'id'
    return this
  }

  // 用於 insert/update/upsert 後取得返回的資料
  returning(columns: string = '*'): this {
    this.returnSelect = columns
    return this
  }

  // WHERE 條件
  eq(column: string, value: unknown): this {
    this.whereParams.push(value)
    this.whereClauses.push(`"${column}" = $${this.whereParams.length}`)
    return this
  }

  neq(column: string, value: unknown): this {
    this.whereParams.push(value)
    this.whereClauses.push(`"${column}" != $${this.whereParams.length}`)
    return this
  }

  gt(column: string, value: unknown): this {
    this.whereParams.push(value)
    this.whereClauses.push(`"${column}" > $${this.whereParams.length}`)
    return this
  }

  gte(column: string, value: unknown): this {
    this.whereParams.push(value)
    this.whereClauses.push(`"${column}" >= $${this.whereParams.length}`)
    return this
  }

  lt(column: string, value: unknown): this {
    this.whereParams.push(value)
    this.whereClauses.push(`"${column}" < $${this.whereParams.length}`)
    return this
  }

  lte(column: string, value: unknown): this {
    this.whereParams.push(value)
    this.whereClauses.push(`"${column}" <= $${this.whereParams.length}`)
    return this
  }

  like(column: string, pattern: string): this {
    this.whereParams.push(pattern)
    this.whereClauses.push(`"${column}" LIKE $${this.whereParams.length}`)
    return this
  }

  ilike(column: string, pattern: string): this {
    this.whereParams.push(pattern)
    this.whereClauses.push(`"${column}" ILIKE $${this.whereParams.length}`)
    return this
  }

  in(column: string, values: unknown[]): this {
    if (values.length === 0) {
      this.whereClauses.push('FALSE')
    } else {
      const placeholders = values.map((_, i) => `$${this.whereParams.length + i + 1}`).join(', ')
      this.whereParams.push(...values)
      this.whereClauses.push(`"${column}" IN (${placeholders})`)
    }
    return this
  }

  is(column: string, value: null | boolean): this {
    if (value === null) {
      this.whereClauses.push(`"${column}" IS NULL`)
    } else {
      this.whereClauses.push(`"${column}" IS ${value ? 'TRUE' : 'FALSE'}`)
    }
    return this
  }

  not(column: string, operator: string, value: unknown): this {
    this.whereParams.push(value)
    this.whereClauses.push(`NOT ("${column}" ${operator} $${this.whereParams.length})`)
    return this
  }

  // OR 條件 - Supabase 風格: .or('col1.eq.val1,col2.eq.val2')
  or(conditions: string): this {
    // 解析 Supabase 風格的 OR 條件
    const parts = conditions.split(',').map(part => {
      const match = part.trim().match(/^(\w+)\.(\w+)\.(.+)$/)
      if (!match) return null
      const [, col, op, val] = match
      this.whereParams.push(val)
      const paramIndex = this.whereParams.length
      switch (op) {
        case 'eq': return `"${col}" = $${paramIndex}`
        case 'neq': return `"${col}" != $${paramIndex}`
        case 'gt': return `"${col}" > $${paramIndex}`
        case 'gte': return `"${col}" >= $${paramIndex}`
        case 'lt': return `"${col}" < $${paramIndex}`
        case 'lte': return `"${col}" <= $${paramIndex}`
        case 'like': return `"${col}" LIKE $${paramIndex}`
        case 'ilike': return `"${col}" ILIKE $${paramIndex}`
        default: return null
      }
    }).filter(Boolean) as string[]

    if (parts.length > 0) {
      this.whereClauses.push(`(${parts.join(' OR ')})`)
    }
    return this
  }

  order(column: string, options?: { ascending?: boolean }): this {
    const direction = options?.ascending === false ? 'DESC' : 'ASC'
    this.orderByClause = `ORDER BY "${column}" ${direction}`
    return this
  }

  limit(count: number): this {
    this.limitValue = count
    return this
  }

  range(from: number, to: number): this {
    this.offsetValue = from
    this.limitValue = to - from + 1
    return this
  }

  // 執行查詢並返回單筆
  async single(): Promise<QueryResult<any>> {
    this.limitValue = 1
    const result = await this.execute()
    if (result.error) return result
    if (!result.data || (Array.isArray(result.data) && result.data.length === 0)) {
      return { data: null, error: { message: 'No rows found', code: 'PGRST116' } }
    }
    return { data: Array.isArray(result.data) ? result.data[0] : result.data, error: null }
  }

  async maybeSingle(): Promise<QueryResult<any>> {
    this.limitValue = 1
    const result = await this.execute()
    if (result.error) return result
    if (!result.data || (Array.isArray(result.data) && result.data.length === 0)) {
      return { data: null, error: null }
    }
    return { data: Array.isArray(result.data) ? result.data[0] : result.data, error: null }
  }

  // Promise 介面
  then<TResult1 = QueryResult<any>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<any>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected)
  }

  // 主要執行方法
  private async execute(): Promise<QueryResult<any>> {
    try {
      switch (this.operation) {
        case 'select':
          return this.executeSelect()
        case 'insert':
          return this.executeInsert()
        case 'update':
          return this.executeUpdate()
        case 'delete':
          return this.executeDelete()
        case 'upsert':
          return this.executeUpsert()
        default:
          return { data: null, error: { message: 'Unknown operation' } }
      }
    } catch (error) {
      console.error('[VPS DB] Query error:', error)
      return { data: null, error: { message: (error as Error).message } }
    }
  }

  private buildWhereClause(): string {
    if (this.whereClauses.length === 0) return ''
    return ` WHERE ${this.whereClauses.join(' AND ')}`
  }

  private async executeSelect(): Promise<QueryResult<any>> {
    let sql: string
    const columns = this.selectColumns.split(',').map(c => {
      const trimmed = c.trim()
      // 不要給 * 或已經有引號的加引號
      if (trimmed === '*' || trimmed.includes('"') || trimmed.includes('(')) {
        return trimmed
      }
      return `"${trimmed}"`
    }).join(', ')

    if (this.countMode === 'exact' && this.headOnly) {
      sql = `SELECT COUNT(*) as count FROM "${this.table}"`
    } else if (this.countMode === 'exact') {
      sql = `SELECT ${columns}, COUNT(*) OVER() as full_count FROM "${this.table}"`
    } else {
      sql = `SELECT ${columns} FROM "${this.table}"`
    }

    sql += this.buildWhereClause()

    if (this.orderByClause) {
      sql += ` ${this.orderByClause}`
    }
    if (this.limitValue !== null) {
      sql += ` LIMIT ${this.limitValue}`
    }
    if (this.offsetValue !== null) {
      sql += ` OFFSET ${this.offsetValue}`
    }

    const { rows } = await query(sql, this.whereParams)

    if (this.countMode === 'exact' && this.headOnly) {
      return { data: null, error: null, count: parseInt(rows[0]?.count as string || '0', 10) }
    }

    let count: number | undefined
    const data = rows.map((row: any) => {
      if (this.countMode === 'exact' && row.full_count !== undefined) {
        count = parseInt(row.full_count, 10)
        const { full_count: _fc, ...rest } = row
        return rest
      }
      return row
    })

    return { data, error: null, count }
  }

  private async executeInsert(): Promise<QueryResult<any>> {
    if (this.insertData.length === 0) {
      return { data: [], error: null }
    }

    const columns = Object.keys(this.insertData[0])
    const quotedColumns = columns.map(c => `"${c}"`).join(', ')
    const values: unknown[] = []
    const valuePlaceholders: string[] = []

    this.insertData.forEach((row) => {
      const rowPlaceholders: string[] = []
      columns.forEach((col) => {
        values.push(row[col])
        rowPlaceholders.push(`$${values.length}`)
      })
      valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`)
    })

    const sql = `INSERT INTO "${this.table}" (${quotedColumns}) VALUES ${valuePlaceholders.join(', ')} RETURNING *`
    const { rows } = await query(sql, values)

    return {
      data: this.insertData.length === 1 ? rows[0] : rows,
      error: null
    }
  }

  private async executeUpdate(): Promise<QueryResult<any>> {
    const columns = Object.keys(this.updateData)
    if (columns.length === 0) {
      return { data: [], error: null }
    }

    const setClause = columns.map((col, i) => `"${col}" = $${i + 1}`).join(', ')
    const values = columns.map((col) => this.updateData[col])

    let sql = `UPDATE "${this.table}" SET ${setClause}`

    if (this.whereClauses.length > 0) {
      const adjustedWhere = this.whereClauses.map((clause) => {
        return clause.replace(/\$(\d+)/g, (_, num) => `$${parseInt(num) + columns.length}`)
      })
      sql += ` WHERE ${adjustedWhere.join(' AND ')}`
      values.push(...this.whereParams)
    }

    sql += ' RETURNING *'
    const { rows } = await query(sql, values)
    return { data: rows, error: null }
  }

  private async executeDelete(): Promise<QueryResult<any>> {
    let sql = `DELETE FROM "${this.table}"`
    sql += this.buildWhereClause()
    sql += ' RETURNING *'

    const { rows } = await query(sql, this.whereParams)
    return { data: rows, error: null }
  }

  private async executeUpsert(): Promise<QueryResult<any>> {
    if (this.insertData.length === 0) {
      return { data: [], error: null }
    }

    const columns = Object.keys(this.insertData[0])
    const quotedColumns = columns.map(c => `"${c}"`).join(', ')
    const values: unknown[] = []
    const valuePlaceholders: string[] = []

    this.insertData.forEach((row) => {
      const rowPlaceholders: string[] = []
      columns.forEach((col) => {
        values.push(row[col])
        rowPlaceholders.push(`$${values.length}`)
      })
      valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`)
    })

    const updateColumns = columns.filter((c) => c !== this.upsertConflict)
    const updateClause = updateColumns.map((col) => `"${col}" = EXCLUDED."${col}"`).join(', ')

    const sql = `INSERT INTO "${this.table}" (${quotedColumns}) VALUES ${valuePlaceholders.join(', ')}
                 ON CONFLICT ("${this.upsertConflict}") DO UPDATE SET ${updateClause} RETURNING *`

    const { rows } = await query(sql, values)
    return {
      data: this.insertData.length === 1 ? rows[0] : rows,
      error: null
    }
  }
}

// ============================================================
// PLAN 常數
// ============================================================

export const PLAN_MESSAGE_LIMITS: Record<string, number> = {
  free: 50,
  pro: 500,
  enterprise: 5000,
}

export const PLAN_PROJECT_LIMITS: Record<string, number> = {
  free: 3,
  pro: 20,
  enterprise: 100,
}

export const PLAN_PRIORITY_WEIGHTS: Record<string, number> = {
  free: 1,
  pro: 2,
  enterprise: 5,
}

const vpsDb = {
  from,
  query,
  queryOne,
  transaction,
  getClient,
}

export default vpsDb
