'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DeviceSwitcher, { DeviceType, getDeviceWidth } from './DeviceSwitcher'

// ============================================================
// PreviewPanel - 預覽面板元件
// 支援 iframe 預覽 + 設備切換 + 縮放
// ============================================================

interface PreviewPanelProps {
  previewUrl?: string                    // iframe 預覽 URL
  previewImageUrl?: string               // 靜態預覽圖 URL（fallback）
  templateName?: string                  // 模板名稱
  isLoading?: boolean                    // 是否正在載入
  error?: string                         // 錯誤訊息
  onInteract?: (element: ElementInfo) => void  // 元素互動回調
}

// 元素資訊（用於互動編輯）
export interface ElementInfo {
  id: string
  tagName: string
  text?: string
  styles: Record<string, string>
  rect: { x: number; y: number; width: number; height: number }
}

export default function PreviewPanel({
  previewUrl,
  previewImageUrl,
  templateName,
  isLoading = false,
  error,
  onInteract
}: PreviewPanelProps) {
  const [device, setDevice] = useState<DeviceType>('desktop')
  const [zoom, setZoom] = useState(1)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // 計算適合的縮放比例
  useEffect(() => {
    const calculateZoom = () => {
      if (!containerRef.current) return

      const containerWidth = containerRef.current.clientWidth - 48  // padding
      const containerHeight = containerRef.current.clientHeight - 48
      const deviceWidth = getDeviceWidth(device)
      const deviceHeight = deviceWidth * 0.75  // 假設 4:3 比例

      const scaleX = containerWidth / deviceWidth
      const scaleY = containerHeight / deviceHeight
      const scale = Math.min(scaleX, scaleY, 1)  // 最大縮放 1

      setZoom(scale)
    }

    calculateZoom()
    window.addEventListener('resize', calculateZoom)
    return () => window.removeEventListener('resize', calculateZoom)
  }, [device])

  // 處理 iframe postMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 驗證來源（實際部署時需要更嚴格的驗證）
      if (event.data?.type === 'ELEMENT_SELECTED' && onInteract) {
        onInteract(event.data.element as ElementInfo)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onInteract])

  // 啟用選擇模式
  const enableSelectionMode = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'ENABLE_SELECTION_MODE' },
      '*'
    )
  }, [])

  // 重新載入 iframe
  const reloadPreview = useCallback(() => {
    setIframeLoaded(false)
    if (iframeRef.current && iframeRef.current.src) {
      const currentSrc = iframeRef.current.src
      iframeRef.current.src = ''
      iframeRef.current.src = currentSrc
    }
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
        {/* 左側：模板名稱 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {templateName && (
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--black)',
              }}
            >
              {templateName}
            </span>
          )}
          {previewUrl && (
            <span
              style={{
                fontSize: 12,
                color: 'var(--gray-400)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {deviceWidth}px
            </span>
          )}
        </div>

        {/* 中間：設備切換器 */}
        <DeviceSwitcher activeDevice={device} onDeviceChange={setDevice} />

        {/* 右側：操作按鈕 */}
        <div style={{ display: 'flex', gap: 8 }}>
          {previewUrl && (
            <>
              {/* 互動模式按鈕 */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={enableSelectionMode}
                style={{
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 500,
                  background: 'var(--gray-100)',
                  color: 'var(--gray-700)',
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
                選擇
              </motion.button>

              {/* 重新載入按鈕 */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={reloadPreview}
                style={{
                  padding: 6,
                  background: 'var(--gray-100)',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray-600)" strokeWidth="2">
                  <path d="M21 2v6h-6" />
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                  <path d="M3 22v-6h6" />
                  <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                </svg>
              </motion.button>
            </>
          )}
        </div>
      </div>

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
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                color: 'var(--gray-500)',
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: '2px solid var(--gray-200)',
                  borderTopColor: 'var(--gray-500)',
                }}
              />
              <span style={{ fontSize: 14 }}>正在生成預覽...</span>
            </motion.div>
          )}

          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                color: 'var(--gray-500)',
                textAlign: 'center',
              }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12" y2="16" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span style={{ fontSize: 14 }}>{error}</span>
            </motion.div>
          )}

          {!isLoading && !error && previewUrl && (
            <motion.div
              key="iframe"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
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
                }}
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            </motion.div>
          )}

          {!isLoading && !error && !previewUrl && previewImageUrl && (
            <motion.div
              key="image"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              style={{
                width: deviceWidth,
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                borderRadius: 8,
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                overflow: 'hidden',
              }}
            >
              <img
                src={previewImageUrl}
                alt={templateName || '預覽'}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                }}
              />
            </motion.div>
          )}

          {!isLoading && !error && !previewUrl && !previewImageUrl && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                color: 'var(--gray-400)',
                textAlign: 'center',
              }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <span style={{ fontSize: 14 }}>選擇一個模板以預覽</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
