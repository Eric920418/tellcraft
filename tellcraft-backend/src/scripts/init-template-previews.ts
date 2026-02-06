/**
 * 初始化模板預覽
 * 將預生成的 HTML 文件同步到 template_previews 表
 *
 * 使用方式：npx ts-node src/scripts/init-template-previews.ts
 */
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { query, queryOne, closePool } from '../db/client'

// 模板 slug（資料庫）到文件名的映射
const TEMPLATES: Record<string, string> = {
  'saas-minimal': 'saas-dashboard-minimal.html',
  'saas-pro': 'saas-dashboard-professional.html',
  'landing-startup': 'startup-landing-page.html',
  'landing-corporate': 'corporate-website.html',
  'ecommerce-modern': 'modern-ecommerce.html',
}

const TEMPLATES_DIR = join(__dirname, '../data/template-previews')

async function main() {
  console.log('🚀 開始同步模板預覽到數據庫...\n')

  let successCount = 0
  let skipCount = 0
  let errorCount = 0

  for (const [slug, filename] of Object.entries(TEMPLATES)) {
    try {
      // 1. 查找模板 ID
      const template = await queryOne<{ id: string; name: string }>(
        'SELECT id, name FROM templates WHERE slug = $1',
        [slug]
      )

      if (!template) {
        console.log(`⚠️  模板不存在: ${slug}`)
        skipCount++
        continue
      }

      // 2. 讀取 HTML 文件
      const filePath = join(TEMPLATES_DIR, filename)
      if (!existsSync(filePath)) {
        console.log(`⚠️  文件不存在: ${filename}`)
        skipCount++
        continue
      }

      const htmlContent = readFileSync(filePath, 'utf-8')

      // 3. 插入或更新數據庫
      await query(
        `INSERT INTO template_previews (template_id, html_content, version, updated_at)
         VALUES ($1, $2, 1, NOW())
         ON CONFLICT (template_id) DO UPDATE SET
           html_content = $2,
           version = template_previews.version + 1,
           updated_at = NOW()`,
        [template.id, htmlContent]
      )

      console.log(`✅ ${template.name} (${slug})`)
      successCount++
    } catch (error) {
      console.error(`❌ 處理 ${slug} 失敗:`, error)
      errorCount++
    }
  }

  console.log(`\n📊 同步完成:`)
  console.log(`   成功: ${successCount}`)
  console.log(`   跳過: ${skipCount}`)
  console.log(`   失敗: ${errorCount}`)

  await closePool()
  process.exit(errorCount > 0 ? 1 : 0)
}

main().catch(console.error)
