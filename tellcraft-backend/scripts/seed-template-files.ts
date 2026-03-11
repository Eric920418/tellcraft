/**
 * 一次性 Seeding 腳本：為所有 seed 模板生成 React 代碼，存入 project_files
 * 執行：cd tellcraft-backend && npx tsx scripts/seed-template-files.ts
 * 前置條件：已執行 migration 020
 */
import { Pool } from 'pg'
import { generateSeedTemplateFiles } from '../src/services/seed-template-code-generator'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
})

async function query<T = unknown>(sql: string, params: unknown[] = []) {
  const client = await pool.connect()
  try {
    return await client.query<T>(sql, params)
  } finally {
    client.release()
  }
}

async function main() {
  console.log('🌱 Starting seed-template-files...')

  // 取得所有模板（seed 模板：source_project_id IS NULL）
  const result = await query<{
    id: string; name: string; description: string; category: string; tags: string[]
  }>(
    `SELECT id, name, COALESCE(description, '') as description, category, COALESCE(tags, '{}') as tags
     FROM templates
     WHERE source_project_id IS NULL AND is_active = true
     ORDER BY sort_order ASC`
  )

  const templates = result.rows
  console.log(`Found ${templates.length} seed templates`)

  let success = 0
  let errors = 0

  for (const t of templates) {
    try {
      const files = generateSeedTemplateFiles(t)
      for (const f of files) {
        await query(
          `INSERT INTO project_files (template_id, skill_source, file_path, content, file_type)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (template_id, skill_source, file_path) WHERE template_id IS NOT NULL
           DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()`,
          [t.id, f.skillSource, f.filePath, f.content, f.fileType]
        )
      }
      console.log(`  ✓ [${t.category}] ${t.name} → ${files.length} files`)
      success++
    } catch (err) {
      console.error(`  ✗ ${t.name}: ${err}`)
      errors++
    }
  }

  console.log(`\nDone: ${success} succeeded, ${errors} failed`)
  await pool.end()
  process.exit(errors > 0 ? 1 : 0)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
