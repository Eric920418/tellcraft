'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from '@/i18n/navigation'
import { motion } from 'framer-motion'
import { getAdminTemplates } from '@/app/lib/vps-api'

interface AdminTemplate {
  id: string
  name: string
  slug: string
  category: string
  description: string
  thumbnailUrl: string
  previewImageUrl?: string | null
  tags: string[]
  isActive: boolean
  isFeatured: boolean
  sortOrder: number
  createdAt: string
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

export default function AdminTemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<AdminTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewingId, setPreviewingId] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    const token = getAuthToken()
    if (!token) {
      router.push('/auth/login?next=/dashboard/admin/templates')
      return
    }

    const result = await getAdminTemplates({ token })

    if (!result.success) {
      if (result.error === '無管理員權限') {
        router.push('/dashboard')
        return
      }
      setError(result.error || '載入失敗')
      setIsLoading(false)
      return
    }

    if (result.data) {
      setTemplates(result.data.templates)
    }
    setIsLoading(false)
  }, [router])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  if (isLoading) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--gray-500)' }}>
        載入中...
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          padding: '40px',
          background: '#FEE2E2',
          border: '1px solid #FECACA',
          color: '#DC2626',
        }}
      >
        {error}
      </div>
    )
  }

  // 使用本地 API route（HTTPS 代理），避免混合內容問題
  const previewBaseUrl = ''  // 相對路徑，自動使用當前域名

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: 32 }}
      >
        <h1
          style={{
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: '-0.02em',
            marginBottom: 8,
          }}
        >
          模板管理
        </h1>
        <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>
          管理 UIUX 設計模板和預覽
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{ marginBottom: 32 }}
      >
        <div
          style={{
            padding: 20,
            background: 'var(--white)',
            border: '1px solid var(--border-color)',
            display: 'inline-block',
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 8, textTransform: 'uppercase' }}>
            總模板數
          </div>
          <div style={{ fontSize: 28, fontWeight: 300, fontFamily: 'var(--font-mono)' }}>
            {templates.length}
          </div>
        </div>
      </motion.div>

      {/* Templates Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        style={{
          background: 'var(--white)',
          border: '1px solid var(--border-color)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: 'var(--gray-500)' }}>
                模板
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: 'var(--gray-500)' }}>
                類別
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: 'var(--gray-500)' }}>
                狀態
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 500, color: 'var(--gray-500)' }}>
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {templates.map((template, index) => (
              <motion.tr
                key={template.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                style={{ borderBottom: '1px solid var(--border-color)' }}
              >
                <td style={{ padding: '16px' }}>
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: 2 }}>{template.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{template.slug}</div>
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  <span
                    style={{
                      padding: '4px 8px',
                      fontSize: 11,
                      background: 'var(--gray-100)',
                      borderRadius: 4,
                    }}
                  >
                    {template.category}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {template.isActive && (
                      <span
                        style={{
                          padding: '4px 8px',
                          fontSize: 11,
                          background: '#DCFCE7',
                          color: '#16A34A',
                          borderRadius: 4,
                        }}
                      >
                        啟用
                      </span>
                    )}
                    {template.isFeatured && (
                      <span
                        style={{
                          padding: '4px 8px',
                          fontSize: 11,
                          background: '#FEF3C7',
                          color: '#D97706',
                          borderRadius: 4,
                        }}
                      >
                        精選
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  <button
                    onClick={() => setPreviewingId(previewingId === template.id ? null : template.id)}
                    style={{
                      padding: '6px 12px',
                      fontSize: 12,
                      background: 'var(--gray-100)',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    {previewingId === template.id ? '關閉' : '預覽'}
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Preview Modal */}
      {previewingId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
          }}
          onClick={() => setPreviewingId(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              width: '100%',
              maxWidth: 1200,
              height: '80vh',
              background: 'var(--white)',
              borderRadius: 8,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontWeight: 500 }}>
                {templates.find(t => t.id === previewingId)?.name} 預覽
              </span>
              <button
                onClick={() => setPreviewingId(null)}
                style={{
                  padding: '4px 8px',
                  fontSize: 12,
                  background: 'var(--gray-100)',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                關閉
              </button>
            </div>
            <iframe
              src={`${previewBaseUrl}/api/templates/preview/${previewingId}`}
              style={{
                flex: 1,
                width: '100%',
                border: 'none',
              }}
              title="Template Preview"
            />
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
