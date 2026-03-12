/**
 * 模板縮圖自動補截圖
 * - captureAndSaveThumbnail：截單張並存到 UPLOAD_DIR
 * - recaptureAllMissingThumbnails：啟動時掃描所有缺圖模板並補齊（fire-and-forget）
 */
import crypto from 'crypto'
import path from 'path'
import fs from 'fs'
import { query } from '../db/client'
import { takeScreenshot, screenshotHtmlContent } from './reference-analyzer'
import { generateTemplateHtml } from './template-thumbnail-generator'
import { getEnv } from '../lib/env'
import { createLogger } from '../lib/logger'

const logger = createLogger('thumbnail-recapture')


export async function captureAndSaveThumbnail(url: string): Promise<string | null> {
  try {
    const buffer = await takeScreenshot(url)
    if (!buffer) return null

    const env = getEnv()
    const uploadDir = env.UPLOAD_DIR
    const uploadBaseUrl = (env.UPLOAD_BASE_URL || '').trim().replace(/\/+$/, '')
    if (!uploadBaseUrl) {
      logger.warn('UPLOAD_BASE_URL 未設定，無法儲存截圖')
      return null
    }

    const now = new Date()
    const subDir = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const fullDir = path.join(uploadDir, subDir)
    fs.mkdirSync(fullDir, { recursive: true })

    const filename = `tmpl-${crypto.randomUUID()}.jpg`
    const filePath = path.join(fullDir, filename)
    fs.writeFileSync(filePath, buffer)

    return `${uploadBaseUrl}/${subDir}/${filename}`
  } catch (err) {
    logger.warn({ error: String(err).slice(0, 200) }, '封面截圖儲存失敗')
    return null
  }
}

/**
 * 儲存圖片 buffer 到 UPLOAD_DIR（內部共用）
 */
async function saveBuffer(buffer: Buffer): Promise<string | null> {
  const env = getEnv()
  const uploadDir = env.UPLOAD_DIR
  const uploadBaseUrl = (env.UPLOAD_BASE_URL || '').trim().replace(/\/+$/, '')
  if (!uploadBaseUrl) {
    logger.warn('UPLOAD_BASE_URL 未設定，無法儲存截圖')
    return null
  }
  const now = new Date()
  const subDir = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const fullDir = path.join(uploadDir, subDir)
  fs.mkdirSync(fullDir, { recursive: true })
  const filename = `tmpl-${crypto.randomUUID()}.jpg`
  const filePath = path.join(fullDir, filename)
  fs.writeFileSync(filePath, buffer)
  return `${uploadBaseUrl}/${subDir}/${filename}`
}

/**
 * 為所有 seed 模板（無 vercel_url、無縮圖）生成 HTML 截圖
 * 啟動 150s 後執行，序列逐筆處理避免多個 Chromium 同時開
 */
export async function generateThumbnailsForSeedTemplates(): Promise<void> {
  try {
    // JOIN template_previews 取得真實 HTML（若存在），否則用假生成 fallback
    const rows = await query<{
      id: string; name: string; description: string; category: string; tags: string[]
      html_content: string | null
    }>(
      `SELECT t.id, t.name, t.description, t.category, t.tags,
              tp.html_content
       FROM templates t
       LEFT JOIN template_previews tp ON tp.template_id = t.id
       WHERE t.thumbnail_url IS NULL
         AND t.is_active = true
         AND t.source_project_id IS NULL
       LIMIT 120`,
      []
    )

    if (rows.rows.length === 0) {
      logger.info('Seed 模板縮圖：無需補圖')
      return
    }

    logger.info({ count: rows.rows.length }, 'Seed 模板縮圖：開始生成')

    for (const row of rows.rows) {
      try {
        // 優先用 template_previews 的真實 HTML，無則 fallback 到假生成
        const html = row.html_content ?? generateTemplateHtml({
          id: row.id,
          name: row.name,
          description: row.description || '',
          category: row.category,
          tags: Array.isArray(row.tags) ? row.tags : [],
        })
        const buffer = await screenshotHtmlContent(html)
        if (!buffer) {
          logger.warn({ templateId: row.id }, 'Seed 模板截圖失敗，跳過')
          continue
        }
        const thumbUrl = await saveBuffer(buffer)
        if (thumbUrl) {
          await query(`UPDATE templates SET thumbnail_url = $1 WHERE id = $2`, [thumbUrl, row.id])
          logger.info({ templateId: row.id, name: row.name, hasRealHtml: !!row.html_content }, 'Seed 模板縮圖完成')
        }
      } catch (err) {
        logger.warn({ templateId: row.id, err }, 'Seed 模板縮圖單筆失敗，繼續下一筆')
      }
    }

    logger.info('Seed 模板縮圖：全部完成')
  } catch (err) {
    logger.error({ err }, 'Seed 模板縮圖掃描失敗')
  }
}

/**
 * 對單一模板執行縮圖擷取（只對有 vercel_url 的才截圖）
 * 社群模板縮圖由用戶提交時自行上傳，不走 Puppeteer
 */
export async function captureTemplateThumbnail(templateId: string): Promise<string | null> {
  const row = await query<{
    id: string; name: string; description: string; category: string; tags: string[]
    vercel_url: string | null
  }>(
    `SELECT t.id, t.name, t.description, t.category, t.tags, p.vercel_url
     FROM templates t
     LEFT JOIN projects p ON p.id = t.source_project_id
     WHERE t.id = $1`,
    [templateId]
  )
  const tmpl = row.rows[0]
  if (!tmpl) return null

  // 有 vercel_url → 截已部署站台（用於部署後自動更新縮圖）
  if (tmpl.vercel_url) {
    const url = tmpl.vercel_url.startsWith('http') ? tmpl.vercel_url : `https://${tmpl.vercel_url}`
    const thumbUrl = await captureAndSaveThumbnail(url)
    if (thumbUrl) {
      await query(`UPDATE templates SET thumbnail_url = $1 WHERE id = $2`, [thumbUrl, templateId])
      logger.info({ templateId, source: 'vercel_url' }, '模板縮圖截圖完成')
      return thumbUrl
    }
    logger.warn({ templateId }, 'vercel_url 截圖失敗')
  }

  return null
}

/**
 * 啟動時補齊所有缺圖的社群模板（thumbnail_url IS NULL）
 * 已有縮圖的由「用戶重新部署」觸發更新（deployer.ts），不在這裡重複截
 * 序列執行，避免多個 Chromium 同時開
 */
export async function recaptureAllMissingThumbnails(): Promise<void> {

  try {
    // 只補從未截過的社群模板（thumbnail_url IS NULL）
    // 已有縮圖的由「用戶重新部署」觸發更新（deployer.ts），不在這裡重複截
    const rows = await query<{ id: string }>(
      `SELECT t.id
       FROM templates t
       WHERE t.thumbnail_url IS NULL
         AND t.is_active = true
         AND t.source_project_id IS NOT NULL
       ORDER BY t.created_at DESC
       LIMIT 20`,
      []
    )

    if (rows.rows.length === 0) return

    logger.info({ count: rows.rows.length }, '自動截圖：補齊缺圖社群模板，開始 Sandpack 序列截圖')

    for (const row of rows.rows) {
      try {
        await captureTemplateThumbnail(row.id)
      } catch (err) {
        logger.warn({ templateId: row.id, err }, '自動截圖單筆失敗，繼續下一筆')
      }
    }
  } catch (err) {
    logger.error({ err }, '自動截圖掃描失敗')
  }
}
