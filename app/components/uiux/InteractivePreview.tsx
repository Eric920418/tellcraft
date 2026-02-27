'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import DeviceSwitcher, { DeviceType, getDeviceWidth } from './DeviceSwitcher'
import PropertyEditor from './PropertyEditor'
import type { ElementInfo } from './PreviewPanel'

// ============================================================
// InteractivePreview - 互動預覽元件
// 支援元素選擇、屬性編輯、即時同步
// ============================================================

interface InteractivePreviewProps {
  previewUrl: string
  templateName?: string
  onElementUpdate?: (elementId: string, changes: Record<string, string>) => void
  onSaveChanges?: (changes: ElementChange[]) => void
}

// 元素變更記錄
export interface ElementChange {
  elementId: string
  property: string
  oldValue: string
  newValue: string
  timestamp: Date
}

// iframe 訊息類型
interface IframeMessage {
  type: string
  element?: ElementInfo
  elementId?: string
  success?: boolean
}

export default function InteractivePreview({
  previewUrl,
  templateName,
  onElementUpdate,
  onSaveChanges
}: InteractivePreviewProps) {
  const t = useTranslations('uiux')
  const [device, setDevice] = useState<DeviceType>('desktop')
  const [zoom, setZoom] = useState(1)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(null)
  const [pendingChanges, setPendingChanges] = useState<ElementChange[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // 計算適合的縮放比例
  useEffect(() => {
    const calculateZoom = () => {
      if (!containerRef.current) return

      const containerWidth = containerRef.current.clientWidth - 48
      const containerHeight = containerRef.current.clientHeight - 48
      const deviceWidth = getDeviceWidth(device)
      const deviceHeight = deviceWidth * 0.75

      const scaleX = containerWidth / deviceWidth
      const scaleY = containerHeight / deviceHeight
      const scale = Math.min(scaleX, scaleY, 1)

      setZoom(scale)
    }

    calculateZoom()
    window.addEventListener('resize', calculateZoom)
    return () => window.removeEventListener('resize', calculateZoom)
  }, [device])

  // 處理 iframe postMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data as IframeMessage

      switch (data.type) {
        case 'ELEMENT_SELECTED':
          if (data.element) {
            setSelectedElement(data.element)
          }
          break

        case 'STYLES_UPDATED':
          // 樣式更新成功
          break

        case 'SELECTION_MODE_ENABLED':
          // 選擇模式已啟用
          break
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // 切換選擇模式
  const toggleSelectionMode = useCallback(() => {
    const newMode = !isSelectionMode
    setIsSelectionMode(newMode)

    iframeRef.current?.contentWindow?.postMessage(
      { type: newMode ? 'ENABLE_SELECTION_MODE' : 'DISABLE_SELECTION_MODE' },
      '*'
    )

    if (!newMode) {
      setSelectedElement(null)
    }
  }, [isSelectionMode])

  // 更新元素屬性
  const handleElementUpdate = useCallback((elementId: string, changes: Record<string, string>) => {
    // 發送到 iframe
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'UPDATE_ELEMENT', elementId, changes },
      '*'
    )

    // 記錄變更
    Object.entries(changes).forEach(([property, newValue]) => {
      const oldValue = selectedElement?.styles[property] || ''
      setPendingChanges(prev => [...prev, {
        elementId,
        property,
        oldValue,
        newValue,
        timestamp: new Date()
      }])
    })

    setHasUnsavedChanges(true)
    onElementUpdate?.(elementId, changes)
  }, [selectedElement, onElementUpdate])

  // 儲存所有變更
  const saveChanges = useCallback(() => {
    if (pendingChanges.length > 0) {
      onSaveChanges?.(pendingChanges)
      setPendingChanges([])
      setHasUnsavedChanges(false)
    }
  }, [pendingChanges, onSaveChanges])

  // 重置變更
  const resetChanges = useCallback(() => {
    // 發送重置指令到 iframe
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'RESET_CHANGES' },
      '*'
    )
    setPendingChanges([])
    setHasUnsavedChanges(false)
    setSelectedElement(null)
  }, [])

  // 關閉屬性編輯器
  const closePropertyEditor = useCallback(() => {
    setSelectedElement(null)
  }, [])

  const deviceWidth = getDeviceWidth(device)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* 工具列 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--white)',
        }}
      >
        {/* 左側：模板名稱 + 未儲存提示 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {templateName && (
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--black)' }}>
              {templateName}
            </span>
          )}
          {hasUnsavedChanges && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                padding: '3px 8px',
                background: '#FEF3C7',
                color: '#92400E',
                fontSize: 11,
                fontWeight: 500,
                borderRadius: 4,
              }}
            >
              {t('unsaved')}
            </motion.span>
          )}
        </div>

        {/* 中間：設備切換器 */}
        <DeviceSwitcher activeDevice={device} onDeviceChange={setDevice} />

        {/* 右側：操作按鈕 */}
        <div style={{ display: 'flex', gap: 8 }}>
          {/* 選擇模式按鈕 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleSelectionMode}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 500,
              background: isSelectionMode ? 'var(--black)' : 'var(--gray-100)',
              color: isSelectionMode ? 'var(--white)' : 'var(--gray-700)',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
            </svg>
            {isSelectionMode ? t('selecting') : t('select')}
          </motion.button>

          {/* 儲存按鈕 */}
          {hasUnsavedChanges && (
            <>
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={saveChanges}
                style={{
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 500,
                  background: 'var(--black)',
                  color: 'var(--white)',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                {t('saveChanges')}
              </motion.button>
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetChanges}
                style={{
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 500,
                  background: 'var(--gray-100)',
                  color: 'var(--gray-600)',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                {t('reset')}
              </motion.button>
            </>
          )}
        </div>
      </div>

      {/* 主區域 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 預覽區域 */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            overflow: 'hidden',
            background: 'var(--gray-50)',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            style={{
              width: deviceWidth,
              height: deviceWidth * 0.75,
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              background: 'var(--white)',
              borderRadius: 8,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* 選擇模式指示器 */}
            {isSelectionMode && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  position: 'absolute',
                  top: 8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  padding: '4px 12px',
                  background: 'rgba(0,0,0,0.8)',
                  color: 'white',
                  fontSize: 11,
                  fontWeight: 500,
                  borderRadius: 12,
                  zIndex: 10,
                  pointerEvents: 'none',
                }}
              >
                {t('clickToEditElement')}
              </motion.div>
            )}

            {/* 載入指示器 */}
            {!iframeLoaded && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--white)',
                }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: '2px solid var(--gray-200)',
                    borderTopColor: 'var(--gray-500)',
                  }}
                />
              </div>
            )}

            <iframe
              ref={iframeRef}
              src={previewUrl}
              onLoad={() => setIframeLoaded(true)}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                opacity: iframeLoaded ? 1 : 0,
                transition: 'opacity 0.3s ease',
                pointerEvents: isSelectionMode ? 'auto' : 'none',
              }}
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          </motion.div>
        </div>

        {/* 屬性編輯器側欄 */}
        {selectedElement && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              borderLeft: '1px solid var(--border-color)',
              background: 'var(--white)',
              overflow: 'hidden',
            }}
          >
            <PropertyEditor
              element={selectedElement}
              onUpdate={handleElementUpdate}
              onClose={closePropertyEditor}
            />
          </motion.div>
        )}
      </div>
    </div>
  )
}
