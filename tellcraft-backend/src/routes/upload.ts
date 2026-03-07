import { Router, Request, Response } from 'express'
import multer from 'multer'
import * as path from 'path'
import * as fs from 'fs'
import * as crypto from 'crypto'
import { requireAuth } from '../middleware/auth'
import { createLogger } from '../lib/logger'

const logger = createLogger('upload')

const router: Router = Router()

// ============================================================
// 設定
// ============================================================

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/var/www/uploads/tellcraft'
const UPLOAD_BASE_URL = (process.env.UPLOAD_BASE_URL || '').trim().replace(/\/+$/, '')

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIMETYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]
const MIMETYPE_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
}

// ============================================================
// Multer Storage
// ============================================================

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const now = new Date()
    const subDir = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const fullDir = path.join(UPLOAD_DIR, subDir)

    fs.mkdirSync(fullDir, { recursive: true })
    cb(null, fullDir)
  },
  filename: (_req, file, cb) => {
    const uuid = crypto.randomUUID()
    const ext = MIMETYPE_TO_EXT[file.mimetype] || path.extname(file.originalname) || '.bin'
    cb(null, `${uuid}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`不支援的檔案類型: ${file.mimetype}。僅支援 JPG, PNG, WebP, GIF, SVG`))
    }
  },
})

// ============================================================
// POST /api/upload/image
// ============================================================

router.post(
  '/image',
  requireAuth,
  (req: Request, res: Response, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(413).json({ success: false, error: '檔案大小超過 5MB 限制' })
            return
          }
          res.status(400).json({ success: false, error: `上傳錯誤: ${err.message}` })
          return
        }
        res.status(400).json({ success: false, error: err.message })
        return
      }
      next()
    })
  },
  (req: Request, res: Response) => {
    if (!UPLOAD_BASE_URL) {
      logger.error('UPLOAD_BASE_URL is not configured')
      res.status(500).json({
        success: false,
        code: 'UPLOAD_BASE_URL_MISSING',
        error: '伺服器未設定圖片公開網址（UPLOAD_BASE_URL）',
      })
      return
    }

    if (!req.file) {
      res.status(400).json({ success: false, error: '未提供圖片檔案' })
      return
    }

    // 構建公開 URL
    const relativePath = path.relative(UPLOAD_DIR, req.file.path).split(path.sep).join('/')
    const url = `${UPLOAD_BASE_URL}/${relativePath}`

    logger.info({ userId: req.user?.id, originalname: req.file.originalname, url }, '用戶上傳圖片')

    res.json({
      success: true,
      path: relativePath,
      url,
      filename: req.file.filename,
      size: req.file.size,
    })
  }
)

export default router
