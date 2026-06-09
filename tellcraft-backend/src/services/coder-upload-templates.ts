// ============================================================
// Upload 模板生成（M4：零 LLM 純模板）
// 獨立能力——有 image 欄位就觸發，不依賴 Admin Panel
// ============================================================

import type { GeneratedComponent } from './uiux-generation'
import { parseCreateTables } from './schema-derivation'
import { createLogger } from '../lib/logger'

const logger = createLogger('coder-upload-templates')

/** 欄位名匹配 → 判定為圖片欄位 */
export const IMAGE_COLUMN_PATTERN = /image|photo|cover|avatar|thumbnail|picture|icon|banner|logo/i

/**
 * 偵測 schema 是否有圖片欄位（VARCHAR/TEXT + 名稱匹配）
 */
export function detectImageColumnsInSchema(schemaSql: string): boolean {
  const tables = parseCreateTables(schemaSql)
  for (const t of tables) {
    for (const col of t.columns) {
      const trimmed = col.trim()
      const colMatch = trimmed.match(/^(\w+)\s+(\w+)/i)
      if (!colMatch) continue
      const name = colMatch[1].toLowerCase()
      const type = colMatch[2].toUpperCase()
      if (IMAGE_COLUMN_PATTERN.test(name) && (type === 'VARCHAR' || type === 'TEXT')) return true
    }
  }
  return false
}

/**
 * 生成 Upload 相關檔案（零 LLM）
 * - ImageUpload 組件（拖放+預覽+hidden input）
 * - Upload API route（Vercel Blob 生產 / 本地 fallback 開發）
 */
export function generateUploadFiles(schemaSql: string): GeneratedComponent[] | null {
  if (!detectImageColumnsInSchema(schemaSql)) return null

  logger.info('偵測到圖片欄位，生成 upload 系統')

  // A3 媒體庫：schema 含 media_uploads（CONTENT_MODEL_INJECT_MEDIA 啟用）→ 上傳同時 fail-soft 記錄進
  // media_uploads，供 /admin/media 瀏覽。非媒體 app（無 media_uploads）→ 用原版模板，行為完全不變。
  const hasMediaTable = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?media_uploads\b/i.test(schemaSql)
  return [
    { path: 'components/admin/ImageUpload.tsx', content: IMAGE_UPLOAD_COMPONENT, description: '圖片上傳組件' },
    { path: 'app/api/upload/route.ts', content: hasMediaTable ? UPLOAD_API_TEMPLATE_WITH_MEDIA : UPLOAD_API_TEMPLATE, description: '圖片上傳 API（Vercel Blob / 本地 fallback）' },
  ]
}

export const IMAGE_UPLOAD_COMPONENT = `'use client'

import { useState, useRef } from 'react'

interface ImageUploadProps {
  name: string
  currentImage?: string
  label?: string
}

export function ImageUpload({ name, currentImage, label }: ImageUploadProps) {
  const [preview, setPreview] = useState(currentImage || '')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (file.size > 5 * 1024 * 1024) { setError('檔案不能超過 5MB'); return }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('只接受 JPEG/PNG/WebP'); return }

    setError('')
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.url) {
        setPreview(data.url)
      } else {
        setError(data.error || '上傳失敗')
      }
    } catch {
      setError('上傳失敗')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <input type="hidden" name={name} value={preview} />
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
      >
        {preview ? (
          <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded" />
        ) : (
          <p className="text-sm text-gray-500">{uploading ? '上傳中...' : '點擊或拖放圖片上傳'}</p>
        )}
      </div>
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      {preview && (
        <button type="button" onClick={() => setPreview('')} className="text-sm text-gray-500 mt-1 hover:text-red-600">移除圖片</button>
      )}
    </div>
  )
}
`

export const UPLOAD_API_TEMPLATE = `import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: '請選擇檔案' }, { status: 400 })

  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: '檔案不能超過 5MB' }, { status: 400 })
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    return NextResponse.json({ error: '只接受 JPEG/PNG/WebP' }, { status: 400 })

  // Vercel Blob（生產環境）
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob')
    const blob = await put(\`uploads/\${Date.now()}-\${file.name}\`, file, { access: 'public' })
    return NextResponse.json({ url: blob.url })
  }

  // 本地 fallback（開發 / WebContainer 預覽）
  const bytes = await file.arrayBuffer()
  const fs = await import('fs/promises')
  const path = await import('path')
  const dir = path.join(process.cwd(), 'public', 'uploads')
  await fs.mkdir(dir, { recursive: true })
  const filename = \`\${Date.now()}-\${file.name}\`
  await fs.writeFile(path.join(dir, filename), Buffer.from(bytes))
  return NextResponse.json({ url: \`/uploads/\${filename}\` })
}
`

/**
 * A3：含媒體庫記錄的上傳 API（schema 有 media_uploads 時用）。
 * 與 UPLOAD_API_TEMPLATE 差別僅在：上傳成功後 fail-soft INSERT 進 media_uploads（表不存在則靜默跳過）。
 */
export const UPLOAD_API_TEMPLATE_WITH_MEDIA = `import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

// fail-soft：media_uploads 表不存在（未啟用媒體庫）→ 靜默跳過，絕不影響上傳本身
async function recordMedia(fileName: string, filePath: string, mimeType: string, fileSize: number) {
  try {
    await sql\`INSERT INTO media_uploads (file_name, file_path, mime_type, file_size)
      VALUES (\${fileName}, \${filePath}, \${mimeType}, \${fileSize})\`
  } catch { /* media_uploads 不存在 → 跳過 */ }
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: '請選擇檔案' }, { status: 400 })

  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: '檔案不能超過 5MB' }, { status: 400 })
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    return NextResponse.json({ error: '只接受 JPEG/PNG/WebP' }, { status: 400 })

  // Vercel Blob（生產環境）
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob')
    const blob = await put(\`uploads/\${Date.now()}-\${file.name}\`, file, { access: 'public' })
    await recordMedia(file.name, blob.url, file.type, file.size)
    return NextResponse.json({ url: blob.url })
  }

  // 本地 fallback（開發 / WebContainer 預覽）
  const bytes = await file.arrayBuffer()
  const fs = await import('fs/promises')
  const path = await import('path')
  const dir = path.join(process.cwd(), 'public', 'uploads')
  await fs.mkdir(dir, { recursive: true })
  const filename = \`\${Date.now()}-\${file.name}\`
  await fs.writeFile(path.join(dir, filename), Buffer.from(bytes))
  await recordMedia(file.name, \`/uploads/\${filename}\`, file.type, file.size)
  return NextResponse.json({ url: \`/uploads/\${filename}\` })
}
`
