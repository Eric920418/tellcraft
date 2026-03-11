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
    const rows = await query<{
      id: string; name: string; description: string; category: string; tags: string[]
    }>(
      `SELECT id, name, description, category, tags
       FROM templates
       WHERE thumbnail_url IS NULL
         AND is_active = true
         AND vercel_url IS NULL
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
        const html = generateTemplateHtml({
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
          logger.info({ templateId: row.id, name: row.name }, 'Seed 模板縮圖完成')
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
 * 啟動時自動補齊所有缺縮圖的已上線模板（序列執行，避免多個 Chromium 同時開）
 */
export async function recaptureAllMissingThumbnails(): Promise<void> {
  try {
    const rows = await query<{ id: string; vercel_url: string }>(
      `SELECT t.id, p.vercel_url
       FROM templates t
       JOIN projects p ON p.id = t.source_project_id
       WHERE t.thumbnail_url IS NULL
         AND t.is_active = true
         AND p.vercel_url IS NOT NULL
       LIMIT 20`,
      []
    )

    if (rows.rows.length === 0) return

    logger.info({ count: rows.rows.length }, '自動補截圖：找到缺圖模板，開始序列截圖')

    for (const row of rows.rows) {
      try {
        const url = row.vercel_url.startsWith('http') ? row.vercel_url : `https://${row.vercel_url}`
        const thumbUrl = await captureAndSaveThumbnail(url)
        if (thumbUrl) {
          await query(`UPDATE templates SET thumbnail_url = $1 WHERE id = $2`, [thumbUrl, row.id])
          logger.info({ templateId: row.id }, '自動補截圖完成')
        }
      } catch (err) {
        logger.warn({ templateId: row.id, err }, '自動補截圖單筆失敗，繼續下一筆')
      }
    }
  } catch (err) {
    logger.error({ err }, '自動補截圖掃描失敗')
  }
}
