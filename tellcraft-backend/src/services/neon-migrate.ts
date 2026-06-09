// ============================================================
// Neon Additive Migration Runner（共用）
//
// 從 iteration-skill 抽出，由「schema 迭代（iteration-skill）」+「A2 additive-drift（neon-service
// ensureNeonSchemaFresh）」共用，避免兩個 ALTER runner 定義漂移（CLAUDE.md source-of-truth 原則）。
//
// 整段 DDL 包在單一 transaction：全成功才 COMMIT，任一失敗 ROLLBACK。connect/query 各有 timeout。
// fail-soft：不 throw，回 { success, error }。空 SQL → 視為成功 no-op。
// ============================================================
import { Client } from 'pg'

export async function runAlterMigration(
  connectionString: string,
  sql: string,
): Promise<{ success: boolean; error?: string; executedAt: number }> {
  if (!sql.trim()) return { success: true, executedAt: Date.now() }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } })
  const startedAt = Date.now()
  try {
    await Promise.race([
      client.connect(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Neon connect timeout (>15s)')), 15_000)),
    ])
    await client.query('BEGIN')
    try {
      await Promise.race([
        client.query(sql),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('ALTER TABLE timeout (>60s)')), 60_000)),
      ])
      await client.query('COMMIT')
      return { success: true, executedAt: Date.now() }
    } catch (err) {
      try { await client.query('ROLLBACK') } catch { /* swallow */ }
      throw err
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err), executedAt: startedAt }
  } finally {
    await client.end().catch(() => {})
  }
}
