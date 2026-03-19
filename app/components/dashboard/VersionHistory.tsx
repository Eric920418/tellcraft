'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations, useLocale } from 'next-intl'
import { getProjectVersions, updateVersionLabel, rollbackVersion, compareVersions } from '../../lib/vps-api'

interface Version {
  id: string
  versionNumber: number
  versionLabel: string | null
  status: string
  changeSummary: string | null
  conversationId: string | null
  createdAt: string
  hasBackup: boolean
  hasCodeSnapshot: boolean
}

interface VersionHistoryProps {
  projectId: string
  token: string
  onError?: (error: string) => void
}

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'var(--gray-100)', text: 'var(--gray-600)' },
  running: { bg: 'var(--yellow-100)', text: 'var(--yellow-700)' },
  success: { bg: 'var(--green-100)', text: 'var(--green-700)' },
  failed: { bg: 'var(--red-100)', text: 'var(--red-700)' },
}

const statusKeyMap: Record<string, string> = {
  pending: 'statusPending',
  running: 'statusRunning',
  success: 'statusSuccess',
  failed: 'statusFailed',
}

export function VersionHistory({ projectId, token, onError }: VersionHistoryProps) {
  const t = useTranslations('dashboard')
  const tc = useTranslations('common')
  const locale = useLocale()
  const [versions, setVersions] = useState<Version[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingLabel, setEditingLabel] = useState<number | null>(null)
  const [labelValue, setLabelValue] = useState('')
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([])
  const [showRollbackConfirm, setShowRollbackConfirm] = useState<number | null>(null)
  const [showDiffModal, setShowDiffModal] = useState(false)
  const [diffData, setDiffData] = useState<{
    schemaDiff: string
    featuresDiff: Array<{ name: string; status: string; diff?: string }>
  } | null>(null)
  const [isRollingBack, setIsRollingBack] = useState(false)
  const [isDownloading, setIsDownloading] = useState<number | null>(null)

  // 載入版本歷史
  useEffect(() => {
    const fetchVersions = async () => {
      setIsLoading(true)
      const result = await getProjectVersions({ projectId, token })
      if (result.success && result.data) {
        setVersions(result.data.versions)
      } else {
        onError?.(result.error || t('versionLoadFailed'))
      }
      setIsLoading(false)
    }

    fetchVersions()
  }, [projectId, token, onError])

  // 編輯版本標籤
  const handleEditLabel = (versionNumber: number, currentLabel: string | null) => {
    setEditingLabel(versionNumber)
    setLabelValue(currentLabel || '')
  }

  const handleSaveLabel = async (versionNumber: number) => {
    const result = await updateVersionLabel({
      projectId,
      versionNumber,
      label: labelValue,
      token,
    })

    if (result.success) {
      setVersions(versions.map(v =>
        v.versionNumber === versionNumber
          ? { ...v, versionLabel: labelValue || null }
          : v
      ))
    } else {
      onError?.(result.error || t('versionUpdateLabelFailed'))
    }

    setEditingLabel(null)
  }

  // 選擇版本進行對比
  const handleSelectForCompare = (versionNumber: number) => {
    if (selectedForCompare.includes(versionNumber)) {
      setSelectedForCompare(selectedForCompare.filter(v => v !== versionNumber))
    } else if (selectedForCompare.length < 2) {
      setSelectedForCompare([...selectedForCompare, versionNumber])
    }
  }

  // 執行版本對比
  const handleCompare = async () => {
    if (selectedForCompare.length !== 2) return

    const [v1, v2] = selectedForCompare.sort((a, b) => a - b)
    const result = await compareVersions({ projectId, v1, v2, token })

    if (result.success && result.data) {
      setDiffData(result.data)
      setShowDiffModal(true)
    } else {
      onError?.(result.error || t('versionCompareFailed'))
    }
  }

  // 回滾版本
  const handleRollback = async (versionNumber: number) => {
    setIsRollingBack(true)
    const result = await rollbackVersion({ projectId, versionNumber, token })

    if (result.success && result.data) {
      // 重新載入版本列表
      const refreshResult = await getProjectVersions({ projectId, token })
      if (refreshResult.success && refreshResult.data) {
        setVersions(refreshResult.data.versions)
      }
      alert(result.data.message)
    } else {
      onError?.(result.error || t('versionRollbackFailed'))
    }

    setIsRollingBack(false)
    setShowRollbackConfirm(null)
  }

  // 下載版本代碼
  const handleDownloadVersion = async (versionNumber: number) => {
    setIsDownloading(versionNumber)
    try {
      const res = await fetch(
        `/api/projects/${projectId}/versions/${versionNumber}/download-code`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        onError?.(err.error || t('versionDownloadFailed'))
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `v${versionNumber}-code.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      onError?.(t('versionDownloadFailed'))
    } finally {
      setIsDownloading(null)
    }
  }

  if (isLoading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>
        {t('versionLoading')}
      </div>
    )
  }

  if (versions.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>
        {t('versionNoRecords')}
      </div>
    )
  }

  return (
    <div>
      {/* 對比按鈕 */}
      {selectedForCompare.length === 2 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: 16,
            padding: '12px 16px',
            background: 'var(--blue-50)',
            border: '1px solid var(--blue-200)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 14, color: 'var(--blue-700)' }}>
            {t('versionSelected', { v1: selectedForCompare[0], v2: selectedForCompare[1] })}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setSelectedForCompare([])}
              style={{
                padding: '6px 12px',
                fontSize: 13,
                background: 'transparent',
                border: '1px solid var(--blue-300)',
                color: 'var(--blue-600)',
                cursor: 'pointer',
              }}
            >
              {tc('cancel')}
            </button>
            <button
              onClick={handleCompare}
              style={{
                padding: '6px 12px',
                fontSize: 13,
                background: 'var(--blue-600)',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              {t('versionCompare')}
            </button>
          </div>
        </motion.div>
      )}

      {/* 版本時間線 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {versions.map((version, index) => (
          <motion.div
            key={version.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            style={{
              display: 'flex',
              gap: 16,
              padding: '16px 0',
              borderBottom: index < versions.length - 1 ? '1px solid var(--border-color)' : 'none',
            }}
          >
            {/* 時間線指示器 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: version.status === 'success' ? 'var(--green-500)' : 'var(--gray-300)',
                  border: selectedForCompare.includes(version.versionNumber)
                    ? '3px solid var(--blue-500)'
                    : 'none',
                }}
              />
              {index < versions.length - 1 && (
                <div style={{ flex: 1, width: 2, background: 'var(--gray-200)', marginTop: 4 }} />
              )}
            </div>

            {/* 版本內容 */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  {/* 版本號和標籤 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>
                      v{version.versionNumber}
                    </span>
                    {editingLabel === version.versionNumber ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <input
                          type="text"
                          value={labelValue}
                          onChange={(e) => setLabelValue(e.target.value)}
                          placeholder={t('versionLabelPlaceholder')}
                          style={{
                            padding: '4px 8px',
                            fontSize: 12,
                            border: '1px solid var(--border-color)',
                            width: 120,
                          }}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveLabel(version.versionNumber)
                            if (e.key === 'Escape') setEditingLabel(null)
                          }}
                        />
                        <button
                          onClick={() => handleSaveLabel(version.versionNumber)}
                          style={{
                            padding: '4px 8px',
                            fontSize: 11,
                            background: 'var(--black)',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {tc('save')}
                        </button>
                      </div>
                    ) : (
                      <span
                        onClick={() => handleEditLabel(version.versionNumber, version.versionLabel)}
                        style={{
                          fontSize: 12,
                          padding: '2px 8px',
                          background: version.versionLabel ? 'var(--gray-100)' : 'transparent',
                          color: version.versionLabel ? 'var(--gray-600)' : 'var(--gray-400)',
                          cursor: 'pointer',
                          borderRadius: 4,
                        }}
                      >
                        {version.versionLabel || t('versionAddLabel')}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: 11,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: statusColors[version.status]?.bg || 'var(--gray-100)',
                        color: statusColors[version.status]?.text || 'var(--gray-600)',
                      }}
                    >
                      {statusKeyMap[version.status] ? t(statusKeyMap[version.status]) : version.status}
                    </span>
                  </div>

                  {/* 變更摘要 */}
                  {version.changeSummary && (
                    <p style={{ fontSize: 13, color: 'var(--gray-500)', margin: '4px 0' }}>
                      {version.changeSummary}
                    </p>
                  )}

                  {/* 時間 */}
                  <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                    {new Date(version.createdAt).toLocaleString(locale === 'zh' ? 'zh-TW' : 'en-US')}
                  </span>
                </div>

                {/* 操作按鈕 */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {/* 選擇對比 */}
                  <button
                    onClick={() => handleSelectForCompare(version.versionNumber)}
                    style={{
                      padding: '4px 8px',
                      fontSize: 11,
                      background: selectedForCompare.includes(version.versionNumber)
                        ? 'var(--blue-100)'
                        : 'transparent',
                      color: selectedForCompare.includes(version.versionNumber)
                        ? 'var(--blue-700)'
                        : 'var(--gray-500)',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer',
                    }}
                  >
                    {selectedForCompare.includes(version.versionNumber) ? t('versionCompareSelected') : t('versionCompareSelect')}
                  </button>

                  {/* 下載代碼按鈕 */}
                  {version.hasCodeSnapshot && (
                    <button
                      onClick={() => handleDownloadVersion(version.versionNumber)}
                      disabled={isDownloading === version.versionNumber}
                      style={{
                        padding: '4px 8px',
                        fontSize: 11,
                        background: 'transparent',
                        color: isDownloading === version.versionNumber
                          ? 'var(--gray-400)'
                          : 'var(--gray-600)',
                        border: '1px solid var(--border-color)',
                        cursor: isDownloading === version.versionNumber
                          ? 'not-allowed'
                          : 'pointer',
                      }}
                    >
                      {isDownloading === version.versionNumber
                        ? t('versionDownloading')
                        : t('versionDownloadCode')}
                    </button>
                  )}

                  {/* 回滾按鈕 */}
                  {version.hasBackup && index > 0 && (
                    <button
                      onClick={() => setShowRollbackConfirm(version.versionNumber)}
                      style={{
                        padding: '4px 8px',
                        fontSize: 11,
                        background: 'transparent',
                        color: 'var(--orange-600)',
                        border: '1px solid var(--orange-300)',
                        cursor: 'pointer',
                      }}
                    >
                      {t('versionRollback')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 回滾確認彈窗 */}
      <AnimatePresence>
        {showRollbackConfirm !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setShowRollbackConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                padding: 24,
                width: 400,
                maxWidth: '90vw',
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
                {t('versionRollbackConfirmTitle')}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--gray-600)', marginBottom: 8 }}>
                {t('versionRollbackConfirmMessage', { version: showRollbackConfirm })}
              </p>
              <p style={{ fontSize: 13, color: 'var(--orange-600)', marginBottom: 24 }}>
                {t('versionRollbackWarning')}
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowRollbackConfirm(null)}
                  style={{
                    padding: '8px 16px',
                    fontSize: 14,
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                  }}
                >
                  {tc('cancel')}
                </button>
                <button
                  onClick={() => handleRollback(showRollbackConfirm)}
                  disabled={isRollingBack}
                  style={{
                    padding: '8px 16px',
                    fontSize: 14,
                    background: isRollingBack ? 'var(--gray-300)' : 'var(--orange-600)',
                    color: 'white',
                    border: 'none',
                    cursor: isRollingBack ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isRollingBack ? t('versionRollingBack') : t('versionConfirmRollback')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 版本對比彈窗 */}
      <AnimatePresence>
        {showDiffModal && diffData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setShowDiffModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                padding: 24,
                width: 800,
                maxWidth: '90vw',
                maxHeight: '80vh',
                overflow: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600 }}>
                  {t('versionDiffTitle', { v1: selectedForCompare[0], v2: selectedForCompare[1] })}
                </h3>
                <button
                  onClick={() => setShowDiffModal(false)}
                  style={{
                    padding: '4px 8px',
                    fontSize: 20,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--gray-400)',
                  }}
                >
                  ×
                </button>
              </div>

              {/* Schema 差異 */}
              {diffData.schemaDiff && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{t('versionSchemaChanges')}</h4>
                  <pre style={{
                    fontSize: 12,
                    fontFamily: 'monospace',
                    background: 'var(--gray-50)',
                    padding: 16,
                    overflow: 'auto',
                    maxHeight: 300,
                    lineHeight: 1.6,
                  }}>
                    {diffData.schemaDiff.split('\n').map((line, i) => (
                      <div
                        key={i}
                        style={{
                          background: line.startsWith('+')
                            ? 'var(--green-50)'
                            : line.startsWith('-')
                              ? 'var(--red-50)'
                              : 'transparent',
                          color: line.startsWith('+')
                            ? 'var(--green-700)'
                            : line.startsWith('-')
                              ? 'var(--red-700)'
                              : 'inherit',
                        }}
                      >
                        {line}
                      </div>
                    ))}
                  </pre>
                </div>
              )}

              {/* Features 差異 */}
              {diffData.featuresDiff.length > 0 && (
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{t('versionFeatureChanges')}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {diffData.featuresDiff.map((feature, i) => (
                      <div
                        key={i}
                        style={{
                          padding: 12,
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            fontSize: 11,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: feature.status === 'added'
                              ? 'var(--green-100)'
                              : feature.status === 'removed'
                                ? 'var(--red-100)'
                                : 'var(--yellow-100)',
                            color: feature.status === 'added'
                              ? 'var(--green-700)'
                              : feature.status === 'removed'
                                ? 'var(--red-700)'
                                : 'var(--yellow-700)',
                          }}>
                            {feature.status === 'added' ? t('versionFeatureAdded') : feature.status === 'removed' ? t('versionFeatureRemoved') : t('versionFeatureModified')}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{feature.name}</span>
                        </div>
                        {feature.diff && (
                          <pre style={{
                            fontSize: 11,
                            fontFamily: 'monospace',
                            background: 'var(--gray-50)',
                            padding: 8,
                            marginTop: 8,
                            overflow: 'auto',
                            maxHeight: 200,
                          }}>
                            {feature.diff}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
